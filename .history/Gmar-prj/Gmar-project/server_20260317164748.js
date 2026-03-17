import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import sql from 'mssql';

const app = express();
app.use(cors());
app.use(express.json());

// ---------- SQL ----------
const config = {
  server: 'YURA\\SQLEXPRESS',
  database: 'DragCanvas',
  user: 'DragCanvasWebApp',
  password: 'WebApp@2026!',
  options: { encrypt: false, trustServerCertificate: true }
};

let pool;

async function start() {
  try {
    pool = await sql.connect(config);
    console.log('Connected to SQL Server!');
    app.listen(3001, () => console.log('Server running on port 3001'));
  } catch (err) {
    console.error('Database connection failed:', err);
  }
}
start();

 app.get('/api/users', async (req, res) => {
      try {
        const result = await pool.request().query('SELECT User_ID,UserName, UserEmail, IsActive, IsAdmin, IsSuperAdmin, CreatedDate, LastLoginDate FROM TBUsers ');
        res.json(result.recordset);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

  // GET user by id
  app.get('/api/users/:id', async (req, res) => {
    try {
      const result = await pool.request()
        .input('id', sql.Int, req.params.id)
        .query('SELECT User_ID, UserName, UserEmail, UserPassword FROM TBUsers WHERE User_ID = @id');
      if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(result.recordset[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST create user
  app.post('/api/users', async (req, res) => {
    try {
      const { username, email, password } = req.body;
      const result = await pool.request()
        .input('username', sql.NVarChar(50), username)
        .input('email', sql.NVarChar(100), email)
        .input('password', sql.NVarChar(255), password)
        .query('INSERT INTO TBUsers (UserName, UserEmail, UserPassword, IsActive, CreatedDate) OUTPUT INSERTED.* VALUES(@username, @email, @password, 1, GETDATE())');
      res.json(result.recordset[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST login - using Stored Procedure
  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Use stored procedure for login
      const result = await pool.request()
        .input('Email', sql.NVarChar(100), email)
        .input('Password', sql.NVarChar(255), password)
        .input('IPAddress', sql.NVarChar(50), req.ip || 'unknown')
        .output('UserID', sql.Int)
        .output('UserName', sql.NVarChar(50))
        .output('IsAdmin', sql.Bit)
        .output('ResultCode', sql.Int)
        .execute('dbo.SP_UserLogin');

      // Get the output parameters
      const outputs = result.output;
      const resultCode = outputs.ResultCode;
      const userID = outputs.UserID;
      const userName = outputs.UserName;
      const isAdmin = outputs.IsAdmin;

      if (resultCode !== 1 || !userID) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Fetch full user data without password
      const userResult = await pool.request()
        .input('UserID', sql.Int, userID)
          .query('SELECT User_ID, UserName, UserEmail, IsActive, IsAdmin, IsSuperAdmin FROM TBUsers WHERE User_ID = @UserID');

      if (userResult.recordset.length === 0) {
        return res.status(401).json({ error: 'User not found' });
      }

      res.json({
        user: userResult.recordset[0],
        admin: isAdmin,
        message: 'Login successful'
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // POST register - using Stored Procedure
  app.post('/api/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;

      // Create request
      const request = pool.request()
        .input('UserName', sql.NVarChar(50), username)
        .input('Email', sql.NVarChar(100), email)
        .input('Password', sql.NVarChar(255), password);

      // Add OUTPUT parameters
      const userID = { value: null, type: sql.Int };
      const resultCode = { value: null, type: sql.Int };

      request.output('UserID', sql.Int);
      request.output('ResultCode', sql.Int);

      // Execute stored procedure
      await request.execute('dbo.SP_RegisterUser');

      // Get output values
      const result = await pool.request()
        .input('UserName', sql.NVarChar(50), username)
        .query('SELECT User_ID, UserName, UserEmail FROM TBUsers WHERE UserName = @UserName');

      if (result.recordset.length === 0) {
        return res.status(400).json({ error: 'Registration failed' });
      }

      res.json({ user: result.recordset[0], message: 'Registration successful' });
    } catch (err) {
      if (err.message.includes('duplicate') || err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // POST logout - using Stored Procedure
  app.post('/api/logout', async (req, res) => {
    try {
      const { userId, sessionDurationMinutes } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Use stored procedure for logout
      await pool.request()
        .input('UserID', sql.Int, userId)
        .input('SessionDurationMinutes', sql.Int, sessionDurationMinutes || null)
        .execute('dbo.SP_UserLogout');

      res.json({ message: 'Logout successful' });
    } catch (err) {
      console.error('Logout error:', err);
      res.status(500).json({ error: err.message });
    }
  });


app.delete('/api/delete-user', async (req, res) => {
    try {
      const { targetID, adminID, confirmDelete } = req.body;

      if (!targetID || !adminID) {
        return res.status(400).json({ error: 'targetID and adminID are required' });
      }

      if (confirmDelete !== true && confirmDelete !== 1) {
        return res.status(400).json({ error: 'confirmDelete must be true' });
      }
      // Create request
      const request = pool.request()
        .input('TargetUserID', sql.Int, targetID)
        .input('AdminID', sql.Int, adminID)
        .input('ConfirmDelete', sql.Bit, confirmDelete);

            // Add OUTPUT parameters
      request.output('ResultCode', sql.Int);
      request.output('ResultMessage', sql.NVarChar(500));

      const result = await
  request.execute('dbo.SP_DeleteUserPermanently');

      // Get output values
      const outputs = result.output;
      const resultCode = outputs.ResultCode;
      const resultMessage = outputs.ResultMessage;

      if (resultCode === 1) {
        return res.json({ message: resultMessage });
      } else {
        return res.status(400).json({ error: resultMessage });
      }

    } catch (err) {
      console.error('Delete user error:', err);
      res.status(500).json({ error: err.message });
    }
  });



  app.post('/api/update-status', async (req, res) => {
    try {
      const { targetID, adminID, newStatus } = req.body;

      if (!targetID || !adminID) {
        return res.status(400).json({ error: 'targetID and adminID are required' });
      }

      // Create request
      const request = pool.request()
        .input('TargetUserID', sql.Int, targetID)
        .input('AdminID', sql.Int, adminID)
        .input('NewStatus', sql.Bit, newStatus);

            // Add OUTPUT parameters
      request.output('ResultCode', sql.Int);
      request.output('ResultMessage', sql.NVarChar(500));

      const result = await
  request.execute('dbo.SP_UpdateUserStatus');

      // Get output values
      const outputs = result.output;
      const resultCode = outputs.ResultCode;
      const resultMessage = outputs.ResultMessage;

      if (resultCode === 1) {
        return res.json({ message: resultMessage });
      } else {
        return res.status(400).json({ error: resultMessage });
      }

    } catch (err) {
      console.error('Update user status error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/reset-password', async (req, res) => {
    try {
      const { targetID, adminID, newPassword } = req.body;

      if (!targetID || !adminID) {
        return res.status(400).json({ error: 'targetID and adminID are required' });
      }

      // Create request
      const request = pool.request()
        .input('TargetUserID', sql.Int, targetID)
        .input('AdminID', sql.Int, adminID)
        .input('NewPassword', sql.NVarChar(255), newPassword);

            // Add OUTPUT parameters
      request.output('ResultCode', sql.Int);
      request.output('ResultMessage', sql.NVarChar(500));

      const result = await
  request.execute('dbo.SP_ResetUserPassword');

      // Get output values
      const outputs = result.output;
      const resultCode = outputs.ResultCode;
      const resultMessage = outputs.ResultMessage;

      if (resultCode === 1) {
        return res.json({ message: resultMessage });
      } else {
        return res.status(400).json({ error: resultMessage });
      }

    } catch (err) {
      console.error('Reset user password error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/update-role', async (req, res) => {
    try {
      const { targetID, adminID, makeAdmin } = req.body;

      if (!targetID || !adminID || makeAdmin === undefined) {
        return res.status(400).json({ error: 'targetID, adminID, and makeAdmin are required' });
      }

      const request = pool.request()
        .input('TargetUserID', sql.Int, targetID)
        .input('AdminID', sql.Int, adminID)
        .input('MakeAdmin', sql.Bit, makeAdmin);

      request.output('ResultCode', sql.Int);
      request.output('ResultMessage', sql.NVarChar(500));

      const result = await
  request.execute('dbo.SP_UpdateUserRole');

      const outputs = result.output;
      const resultCode = outputs.ResultCode;
      const resultMessage = outputs.ResultMessage;

      if (resultCode === 1) {
        return res.json({ message: resultMessage });
      } else {
        return res.status(400).json({ error: resultMessage });
      }

    } catch (err) {
      console.error('Update role error:', err);
      res.status(500).json({ error: err.message });
    }
  });


      app.post('/api/projects/save', async (req, res) => {
      try {
        const {
          projectId,
          userId,
          projectName,
          projectDescription,
          componentCount,
          projectSizeKB,
          projectData
        } = req.body;

     

        const request = pool.request()
          .input('ProjectID', sql.Int, projectId || null)
          .input('UserID', sql.Int, userId)
          .input('ProjectName', sql.NVarChar(100), projectName)
          .input('ProjectDescription', sql.NVarChar(500),projectDescription || null)
          .input('ComponentCount', sql.Int, componentCount || 0)
          .input('ProjectSizeKB', sql.Decimal(10,2), projectSizeKB || 0)
          .input('ProjectData', sql.NVarChar(sql.MAX), projectData || null)
          .output('ResultProjectID', sql.Int)
          .output('ResultCode', sql.Int);

        const result = await request.execute('dbo.SP_SaveProject');


        const resultCode = result.output?.ResultCode;
        const resultProjectId = result.output?.ResultProjectID;

        if (resultCode === 1) {
          console.log('✅ Project saved successfully, ID:', resultProjectId);
          res.json({ projectId: resultProjectId, message: 'Project saved successfully' });
        } else if (resultCode === 2) {
          console.log('❌ Maximum projects limit reached');
          res.status(400).json({ error: 'Maximum projects limit reached' });
        } else {
          console.log('❌ Failed to save project, ResultCode:', resultCode);
          res.status(400).json({ error: 'Failed to save project'
  });
        }
      } catch (err) {
        console.error('❌ Save project error:', err);
        res.status(500).json({ error: err.message });
      }
    });
  

      app.get('/api/projects/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;

      const result = await pool.request()
        .input('UserID', sql.Int, userId)
        .query(`
          SELECT Project_ID, ProjectName, ProjectDescription,
                 ComponentCount, ProjectSizeKB, IsPublished,
                 CreatedDate, ModifiedDate
          FROM TBProjects
          WHERE User_ID = @UserID AND IsDeleted = 0
          ORDER BY ModifiedDate DESC
        `);

      res.json(result.recordset);
    } catch (err) {
      console.error('Get projects error:', err);
      res.status(500).json({ error: err.message });
    }
  });

   app.get('/api/projects/:projectId', async (req, res) => {
    try {
      const { projectId } = req.params;
      const { userId } = req.query;  // pass userId in query string for security

      if (!userId) {
        return res.status(400).json({ error: 'userId required' });
      }

      console.log('Loading project:', projectId, 'for user:',
  userId);

      const request = pool.request()
        .input('ProjectID', sql.Int, projectId)
        .input('UserID', sql.Int, userId);

      const result = await
  request.execute('dbo.SP_GetProjectDetail');

      if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'Project not found'
  });
      }

      const project = result.recordset[0];
      console.log('✅ Project loaded:', project.ProjectName);
      res.json(project);

    } catch (err) {
      console.error('❌ Load project error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  
  // Delete a project
  app.delete('/api/projects/:projectId', async (req, res) => {
    try {
      const { projectId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'userId required' });
      }

      const result = await pool.request()
        .input('ProjectID', sql.Int, projectId)
        .input('UserID', sql.Int, userId)
        .query(`
          UPDATE TBProjects
          SET IsDeleted = 1
          WHERE Project_ID = @ProjectID AND User_ID = @UserID
        `);

      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ error: 'Project not found'
  });
      }

      console.log('✅ Project deleted:', projectId);
      res.json({ message: 'Project deleted successfully' });

    } catch (err) {
      console.error('❌ Delete error:', err);
      res.status(500).json({ error: err.message });
    }
  });


  // Get user statistics
  app.get('/api/users/:id/stats', async (req, res) => {
    try {
      const { id } = req.params;

      console.log('Fetching stats for user:', id);

      const result = await pool.request()
        .input('UserID', sql.Int, id)
        .query(`
          SELECT
            ISNULL((SELECT COUNT(*) FROM TBProjects WHERE User_ID =
   @UserID AND IsDeleted = 0), 0) AS TotalProjects,
            ISNULL((SELECT COUNT(*) FROM TBProjects WHERE User_ID =
   @UserID AND IsDeleted = 0 AND IsPublished = 1), 0) AS
  PublishedProjects,
            ISNULL((SELECT SUM(ComponentCount) FROM TBProjects
  WHERE User_ID = @UserID AND IsDeleted = 0), 0) AS
  TotalComponents,
            ISNULL((SELECT SUM(ExportCount) FROM TBProjects WHERE
  User_ID = @UserID), 0) AS TotalExports,
            ISNULL((SELECT COUNT(*) FROM TBUserActivity WHERE
  User_ID = @UserID), 0) AS TotalActivities,
            ISNULL((SELECT COUNT(*) FROM TBAuditLog WHERE User_ID =
   @UserID), 0) AS TotalAuditEntries
        `);

      console.log('Stats result:', result.recordset[0]);
      res.json(result.recordset[0]);
    } catch (err) {
      console.error('Get user stats error:', err);
      res.status(500).json({ error: err.message });
    }
  });


  

// ---------- Robust JSON extraction/parsing ----------
function extractBalancedJsonObject(text) {
  const s = String(text);
  const start = s.indexOf('{');
  if (start === -1) throw new Error('No { found');

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < s.length; i++) {
    const ch = s[i];

    if (inString) {
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') depth++;
    if (ch === '}') depth--;

    if (depth === 0) return s.slice(start, i + 1);
  }

  throw new Error('JSON object not closed (unbalanced braces)');
}

function safeParseAIJson(rawText) {
  let s = String(rawText)
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  // normalize smart quotes
  s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

  // keep only first balanced JSON object (ignore trailing text)
  s = extractBalancedJsonObject(s);

  // remove trailing commas
  s = s.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

  // strip markdown link form if leaked: [url](url) -> url
  s = s.replace(/\[(https?:\/\/[^\]\s]+)\]\(\1\)/g, '$1');

  return JSON.parse(s);
}

async function repairJsonWithAI(raw, apiKey) {
  const repairRequest = {
    model: 'sonar-pro',
    messages: [
      {
        role: 'system',
        content:
          'You are a JSON repair tool. Return ONLY valid JSON. No markdown. No comments. Start with { and end with }. No trailing commas.'
      },
      {
        role: 'user',
        content:
          'Fix this into valid JSON (do not change meaning, only fix syntax). Return ONLY the fixed JSON:\n' +
          raw
      }
    ],
    max_tokens: 2500,
    temperature: 0.0
  };

  const rr = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(repairRequest)
  });

  const t = await rr.text();
  let d;
  try { d = JSON.parse(t); } catch { d = null; }

  if (!rr.ok) throw new Error(`Repair call failed: ${rr.status} ${t}`);

  const fixed = d?.choices?.[0]?.message?.content;
  if (!fixed) throw new Error('Repair returned empty content');
  return fixed;
}

// ---------- Normalization (fixes missing sections + missing props wrapper) ----------
function wrapToSections(parsed) {
  if (parsed && Array.isArray(parsed.sections)) return parsed;

  // If AI returned a single root node with children => treat children as sections
  if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.children)) return { sections: parsed.children };
    if (parsed.type) return { sections: [parsed] };
  }

  return { sections: [] };
}

function normalizeNode(node) {
  if (!node || typeof node !== 'object') return node;

  // Already correct shape
  if (node.type && node.props) {
    return {
      type: node.type,
      props: node.props || {},
      children: Array.isArray(node.children) ? node.children.map(normalizeNode) : []
    };
  }

  // Convert flat keys to props
  const { type, children, props, ...rest } = node;

  return {
    type: type || 'container',
    props: { ...(props || {}), ...(rest || {}) },
    children: Array.isArray(children) ? children.map(normalizeNode) : []
  };
}

function normalizeLayout(parsed) {
  const wrapped = wrapToSections(parsed);
  return { sections: (wrapped.sections || []).map(normalizeNode) };
}

// ---------- AI endpoint ----------
app.post('/api/ai-generate', async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    if (!process.env.PPLX_API_KEY) {
      return res.status(500).json({ error: 'Missing PPLX_API_KEY in .env' });
    }

    const systemPrompt = `Output ONLY valid JSON: {"sections":[{type,props,children}]}

# ELEMENT PROPS (ALL must be included)
Container: width,height,padding=[t,r,b,l],margin=[t,r,b,l],background={r,g,b,a},color={r,g,b,a},radius,shadow,flexDirection,alignItems,justifyContent
Text: text,fontSize,fontWeight,textAlign,color={r,g,b,a},margin=[t,r,b,l],shadow
Button: text,buttonStyle,background={r,g,b,a},color={r,g,b,a},margin=[t,r,b,l]
Video: videoId="",videoUrl,text (ALL 3 required)
Image: src,radius,width,height
Link: href,text,fontSize

# VIDEO URLs (choose based on topic)
Tech: https://www.pexels.com/download/video/3129671/
Abstract: https://www.pexels.com/download/video/35969886/
Stars: https://www.pexels.com/download/video/3121459/
Nature: https://www.pexels.com/download/video/853800/
Ocean: https://www.pexels.com/download/video/2099384/
City: https://www.pexels.com/download/video/3252783/

# IMAGE URLs (choose based on topic)
Office: https://images.unsplash.com/photo-1497366216548-37526070297c?w=800
Tech: https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800
Meeting: https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800
Team: https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800
Coding: https://images.unsplash.com/photo-1551434678-e076c223a692?w=800
Nature: https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800
Food: https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800
Fitness: https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800

# EXAMPLES (VARY styling, content based on topic)
Hero:
{"type":"container","props":{"width":"100%","height":"500px","padding":[80,60,80,60],"background":{"r":20,"g":30,"b":50,"a":1},"alignItems":"center","justifyContent":"center"},"children":[
  {"type":"video","props":{"videoId":"","videoUrl":"https://www.pexels.com/download/video/3129671/","text":"Transform Your Business"}}
]}

Feature:
{"type":"container","props":{"width":"100%","padding":[40,60,40,60],"background":{"r":250,"g":250,"b":250,"a":1},"alignItems":"center"},"children":[
  {"type":"text","props":{"text":"Powerful Features","fontSize":42,"fontWeight":"700","textAlign":"center","color":{"r":30,"g":40,"b":60,"a":1},"margin":[0,0,30,0],"shadow":0}},
  {"type":"image","props":{"src":"https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800","radius":16,"width":"100%","height":"300px"}}
]}

# RULES
1. VARY content based on topic - don't use same text
2. VARY colors - use different backgrounds per section
3. VARY font sizes - headings 36-56, body 16-20
4. VARY padding/margin - create spacing
5. ALWAYS include radius (8-24) for modern look
6. ALWAYS include shadow (10-40) for depth
7. Match videos/images to topic
8. Generate 4-6 sections with different content

Topic: ${prompt}`;

    const requestData = {
      model: 'sonar-pro',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Create unique website for "${prompt}". VARY all content - use topic-specific headlines, descriptions. Choose DIFFERENT videos/images that match topic. Use DIFFERENT colors per section. Make it visually impressive with proper spacing and styling.` }
      ],
      max_tokens: 10000,
      temperature: 0.7
    };

    const r = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.PPLX_API_KEY}`
      },
      body: JSON.stringify(requestData)
    });

    const txt = await r.text();
    let data;
    try { data = JSON.parse(txt); } catch { data = null; }

    if (!r.ok) {
      return res.status(r.status).json({
        error: 'Perplexity API error',
        status: r.status,
        body: data ?? txt
      });
    }

    const raw = data?.choices?.[0]?.message?.content;
    console.log('AI Response length:', raw?.length);
    console.log('AI Response (first 500 chars):', raw?.substring(0, 500));
    console.log('AI Response (last 200 chars):', raw?.slice(-200));

    if (!raw) {
      return res.status(500).json({ error: 'No choices[0].message.content', body: data });
    }

    // Parse with repair fallback
    let parsed;
    try {
      parsed = safeParseAIJson(raw);
    } catch (e1) {
      console.log('Parse error:', e1.message);
      console.log('Attempting repair...');
      try {
        const fixedRaw = await repairJsonWithAI(raw, process.env.PPLX_API_KEY);
        parsed = safeParseAIJson(fixedRaw);
      } catch (e2) {
        console.log('Repair failed:', e2.message);
        return res.status(500).json({
          error: 'Failed to parse AI response',
          parseError: e1.message,
          repairError: e2.message,
          rawLength: raw?.length,
          rawPreview: raw?.substring(0, 1000)
        });
      }
    }

    // Normalize format to {sections:[{type,props,children}]}
    const normalized = normalizeLayout(parsed);

    if (!normalized.sections || !Array.isArray(normalized.sections) || normalized.sections.length === 0) {
      return res.status(400).json({ error: 'No sections generated', parsed, normalized });
    }

    return res.json(normalized);
  } catch (e) {
    return res.status(500).json({
      error: 'Server exception',
      message: e?.message,
      stack: e?.stack
    });
  }
});

export default app;
