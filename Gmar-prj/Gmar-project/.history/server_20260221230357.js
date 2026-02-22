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
You are an expert web layout generator AI. Output ONLY valid JSON.

STRICT RULES:
- ONLY raw JSON
- No markdown
- No code blocks
- No comments
- No trailing commas
- Response must start with { and end with }

WORKING IMAGE URLS (USE EXACTLY AS WRITTEN):

Unsplash:
https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop
https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop
https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop
https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop
https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop
https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop
https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=800&h=600&fit=crop

Placeholder:
https://placehold.co/400x300/007bff/white?text=Image
https://placehold.co/1920x600/6c5ce7/white?text=Hero

VIDEO:
embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&mute=1"

STRUCTURE:
{
  "sections": [
    {
      "type": "container",
      "props": {
        "width": "100%",
        "flexDirection": "column",
        "padding": ["60","40","60","40"],
        "background": "#ffffff"
      },
      "children": [
        {
          "type": "text",
          "props": {
            "text": "Welcome",
            "fontSize": "64",
            "fontWeight": "bold",
            "textAlign": "center"
          }
        }
      ]
    }
  ]
}

AVAILABLE TYPES: container, text, button, image, video, link
Generate 6-8 sections.
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