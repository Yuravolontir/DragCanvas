const express = require('express');
  const sql = require('mssql');
  const cors = require('cors');

  const app = express();
  app.use(cors());
  app.use(express.json());

  

  // SQL Server Windows Authentication
  const config = {
    server: 'localhost',        // or 'localhost\SQLEXPRESS' for Express edition
    database: 'DragCanvas',
    authentication: {
      type: 'ntlm',
      options: {
        domain: '',              // leave empty if on local machine, or your domain name
        userName: '',            // your Windows username (or leave empty)
        password: ''             // your Windows password (or leave empty)
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
      console.log('Connected to SQL Server with Windows Authentication');
      app.listen(3001, () => console.log('Server running on port 3001'));
    })
    .catch((err) => {
      console.error('Database connection failed:', err);
    });

  // Test endpoint
  app.get('/api/test', async (req, res) => {
    try {
      const result = await pool.request().query('SELECT @@VERSION');
      res.json({ message: 'Connection successful!', version: result.recordset[0] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });