 import express from 'express';
  import sql from 'mssql';
  import cors from 'cors';

  const app = express();
  app.use(cors());
  app.use(express.json());

  const config = {
    server: 'YURA\\SQLEXPRESS',
    database: 'DragCanvas',
    user: 'webapp',
    password: 'WebApp123!',
    options: {
      encrypt: false,
      trustServerCertificate: true
    }
  };

  let pool;

  sql.connect(config)
    .then((poolResult) => {
      pool = poolResult;
      console.log('Connected to SQL Server!');
      app.listen(3001, () => console.log('Server running on port 3001'));
    })
    .catch((err) => {
      console.error('Database connection failed:', err);
    });

  // GET all users
  app.get('/api/users', async (req, res) => {
    try {
      const result = await pool.request().query('SELECT User_ID, UserName, UserEmail, UserPassword FROM TBUsers ');
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
      const { username, email, password_hash } = req.body;
      const result = await pool.request()
        .input('username', sql.NVarChar(50), username)
        .input('email', sql.NVarChar(255), email)
        .input('password_hash', sql.NVarChar(255), password_hash)
        .query('INSERT INTO TBUsers (UserName, UserEmail, UserPassword) OUTPUT INSERTED.* VALUES(@username, @email, @password_hash)');
      res.json(result.recordset[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT update user
  app.put('/api/users/:id', async (req, res) => {
    try {
      const { username, email } = req.body;
      await pool.request()
        .input('id', sql.Int, req.params.id)
        .input('username', sql.NVarChar(50), username)
        .input('email', sql.NVarChar(255), email)
        .query('UPDATE TBUsers SET UserName = @username, UserEmail = @email WHERE User_ID = @id');
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE user
  app.delete('/api/users/:id', async (req, res) => {
    try {
      await pool.request()
        .input('id', sql.Int, req.params.id)
        .query('DELETE FROM TBUsers WHERE User_ID = @id');
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

    // POST login
  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const result = await pool.request()
        .input('username', sql.NVarChar(50), username)
        .query('SELECT User_ID, UserName, UserEmail, UserPassword FROM TBUsers WHERE UserName = @username');

      if (result.recordset.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.recordset[0];

      // For now, simple password comparison (you should use bcrypt in production)
      if (user.UserPassword !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Return user without password
      const { UserPassword, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST register
  app.post('/api/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;
      const result = await pool.request()
        .input('username', sql.NVarChar(50), username)
        .input('email', sql.NVarChar(255), email)
        .input('password_hash', sql.NVarChar(255), password)
        .query('INSERT INTO TBUsers (UserName, UserEmail, UserPassword) OUTPUT INSERTED.* VALUES(@username, @email, @password_hash)');

      const { UserPassword, ...userWithoutPassword } = result.recordset[0];
      res.json({ user: userWithoutPassword });
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }
      res.status(500).json({ error: err.message });
    }
  });



//=================================
 // Add this after your existing endpoints (after the register endpoint)

import 'dotenv/config';
import express from 'express';
import sql from 'mssql';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const config = {
  server: 'YURA\\SQLEXPRESS',
  database: 'DragCanvas',
  user: 'webapp',
  password: 'WebApp123!',
  options: { encrypt: false, trustServerCertificate: true }
};

let pool;

sql.connect(config)
  .then((poolResult) => {
    pool = poolResult;
    console.log('Connected to SQL Server!');
    app.listen(3001, () => console.log('Server running on port 3001'));
  })
  .catch((err) => console.error('Database connection failed:', err));

// ----------------- AI ENDPOINT -----------------

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import sql from 'mssql';

const app = express();
app.use(cors());
app.use(express.json());

const config = {
  server: 'YURA\\SQLEXPRESS',
  database: 'DragCanvas',
  user: 'webapp',
  password: 'WebApp123!',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
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

// ---------- AI ----------
app.post('/api/ai-generate', async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    if (!process.env.PPLX_API_KEY) {
      return res.status(500).json({ error: 'Missing PPLX_API_KEY in .env' });
    }

    const systemPrompt = `
Output ONLY valid JSON (no markdown, no code blocks).
Start with { and end with }.
No trailing commas.
All string values must be single-line (no literal newlines). Use \\n if needed.

Use ONLY these URLs as plain strings (no [text](url) markdown):
https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop
https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop
https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop
https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop
https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop
https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop
https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=800&h=600&fit=crop
https://placehold.co/400x300/007bff/white?text=Image
https://placehold.co/1920x600/6c5ce7/white?text=Hero

Video embedUrl must be:
https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&mute=1

AVAILABLE TYPES: container, text, button, image, video, link
Generate 6-8 sections using structure:
{ "sections":[ { "type":"container","props":{...},"children":[ ... ] } ] }
`.trim();

    const requestData = {
      model: 'sonar-pro',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Create a website layout for: ${prompt}` },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    };

    const r = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.PPLX_API_KEY}`,
      },
      body: JSON.stringify(requestData),
    });

    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = null; }

    if (!r.ok) {
      return res.status(r.status).json({
        error: 'Perplexity API error',
        status: r.status,
        body: data ?? text,
      });
    }

    const raw = data?.choices?.[0]?.message?.content; // correct path [web:42]
    if (!raw) {
      return res.status(500).json({ error: 'No choices[0].message.content', body: data });
    }

    let parsed;
    try {
      parsed = safeParseAIJson(raw);
    } catch (e) {
      return res.status(400).json({
        error: 'AI returned invalid JSON',
        message: e?.message,
        rawPreview: String(raw).slice(0, 1200),
      });
    }

    return res.json(parsed);
  } catch (e) {
    return res.status(500).json({
      error: 'Server exception',
      message: e?.message,
      stack: e?.stack,
    });
  }
});

function safeParseAIJson(rawText) {
  let s = String(rawText)
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first === -1 || last === -1) throw new Error('No JSON object found');
  s = s.slice(first, last + 1);

  // smart quotes -> normal quotes
  s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

  // remove trailing commas
  s = s.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

  // strip markdown links if leaked: [url](url) -> url
  s = s.replace(/\[(https?:\/\/[^\]\s]+)\]\(\1\)/g, '$1');

  return JSON.parse(s);
}



export default app;

