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
      const result = await pool.request().query('SELECT id, username, email, created_atFROM Users ORDER BY created_at DESC');
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
        .query('SELECT id, username, email, created_at FROM Users WHERE id = @id');
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
        .query('INSERT INTO Users (username, email, password_hash) OUTPUT INSERTED.* VALUES(@username, @email, @password_hash)');
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
        .query('UPDATE Users SET username = @username, email = @email WHERE id = @id');
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
        .query('DELETE FROM Users WHERE id = @id');
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  export default app;