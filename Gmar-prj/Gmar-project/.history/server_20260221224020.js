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

 app.post('/api/ai-generate', async (req, res) => {
  try {
    const { prompt } = req.body;

    const requestData = {
      model: 'sonar-pro',
      messages: [
        {
            role: 'system',
            content: `
  You are a professional web layout generator AI.

  Generate ONLY raw JSON for a modern, complex website layout.

  CRITICAL RULES:
  - Return ONLY raw JSON - no markdown, no code blocks, no explanations
  - No comments inside the JSON
  - Generate 5-8 sections for a complete website

  100% WORKING IMAGE SOURCES:
  - Always use:
  https://images.unsplash.com/photo-[ID]?w=[WIDTH]&h=[HEIGHT]&fit=crop
  - Valid photo IDs: 1571019613454-1cb2f99b2d8b, 1543589069-3878a3d6?750c00,
  1557997469-be24184d3?750c2, 1492144534655-ae79c964c9d7,
  1517694712202-14dd9538aa97, 1518002171953-a2?750c5f, 1533738363-b7f9aef128ce,
  1449824913929-aa12?750c6b, 1522075469751-3a6694fb2f61
  - OR use: https://placehold.co/[WIDTH]x[HEIGHT]/[COLOR]/white?text=[TEXT]

  VIDEO SUPPORT:
  - For background videos: use embedUrl with YouTube:
  "https://www.youtube.com/embed/VIDEO_ID"
  - For video elements: use src with: "https://www.youtube.com/watch?v=VIDEO_ID"
  - Example YouTube IDs: dQw4w9WgXcQ, LXb3EKWsInQ, 9bZkp7q19f0, JGwWNGJdvx8,
  RgKAFK5djSk, 60ItHLz5WEA

  Use this structure:

  {
    "sections": [
      {
        "type": "container",
        "props": {
          "width": "100%",
          "flexDirection": "column",
          "padding": ["60", "40", "60", "40"],
          "background": "#ffffff"
        },
        "children": [...]
      }
    ]
  }

  Available types: container, text, button, image, video, link

  Include these sections in your layouts:
  1. Hero section with large heading and CTA button
  2. Features/Services grid (3-4 items)
  3. About section with image and text
  4. Video section
  5. Testimonials
  6. Contact/CTA section

  Make layouts modern, professional, and visually appealing.
  `

        },
        {
          role: 'user',
          content: `Create a website layout for: ${prompt}`
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    };

      const response = await fetch('https://api.perplexity.ai/chat/completions',
   {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer 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`
        },
        body: JSON.stringify(requestData)
      });

    const data = await response.json();

    if (!data?.choices?.[0]?.message?.content) {
      return res.status(500).json({ error: 'Invalid AI response' });
    }

    res.json({ content: data.choices[0].message.content });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});
  //=====================================


  export default app;