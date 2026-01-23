const express = require('express');
  const sql = require('mssql');
  const cors = require('cors');

  const app = express();
  app.use(cors());
  app.use(express.json());

  // SQL Server Configuration
  const config = {
    server: 'localhost',        // or your server IP (e.g., '192.168.1.100', 'SQLEXPRESS')
    database: 'DragCanvas',
    authentication: {
      type: 'default',
      options: {
        userName: 'sa',         // your SQL Server username
        password: 'YourPassword123' // your SQL Server password
      }
    },
    options: {
      encrypt: false,           // for local development
      trustServerCertificate: true // trust self-signed certificates
    }
  };

  // Alternative: Windows Authentication
  const configWindowsAuth = {
    server: 'localhost',
    database: 'YourDatabaseName',
    authentication: {
      type: 'ntlm',
      options: {
        domain: 'YOUR_DOMAIN',
        userName: 'your_windows_username',
        password: 'your_windows_password'
      }
    },
    options: {
      encrypt: false,
      trustServerCertificate: true
    }
  };

  let pool;

  // Connect to SQL Server
  sql.connect(config)
    .then((poolResult) => {
      pool = poolResult;
      console.log('Connected to SQL Server');
      app.listen(3001, () => console.log('Server running on port 3001'));
    })
    .catch((err) => {
      console.error('Database connection failed:', err);
    });

  // GET - Fetch data
  app.get('/api/data', async (req, res) => {
    try {
      const result = await pool.request().query('SELECT * FROM YourTable');
      res.json(result.recordset);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET by ID
  app.get('/api/data/:id', async (req, res) => {
    try {
      const result = await pool.request()
        .input('id', sql.Int, req.params.id)
        .query('SELECT * FROM YourTable WHERE id = @id');
      res.json(result.recordset[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST - Insert data
  app.post('/api/data', async (req, res) => {
    try {
      const { name, email, description } = req.body;
      const result = await pool.request()
        .input('name', sql.NVarChar, name)
        .input('email', sql.NVarChar, email)
        .input('description', sql.NVarChar, description)
        .query('INSERT INTO YourTable (name, email, description) OUTPUT INSERTED.id VALUES
  (@name, @email, @description)');
      res.json({ id: result.recordset[0].id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT - Update data
  app.put('/api/data/:id', async (req, res) => {
    try {
      const { name, email, description } = req.body;
      await pool.request()
        .input('id', sql.Int, req.params.id)
        .input('name', sql.NVarChar, name)
        .input('email', sql.NVarChar, email)
        .input('description', sql.NVarChar, description)
        .query('UPDATE YourTable SET name = @name, email = @email, description =
  @description WHERE id = @id');
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE
  app.delete('/api/data/:id', async (req, res) => {
    try {
      await pool.request()
        .input('id', sql.Int, req.params.id)
        .query('DELETE FROM YourTable WHERE id = @id');
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });