 import express from 'express';
  import sql from 'mssql';
  import cors from 'cors';

  const app = express();
  app.use(cors());
  app.use(express.json());

  // Try different Windows Auth configurations
  const config = {
    server: 'yura\\sqlexpress',
    database: 'PageBuilderDB',
    options: {
      encrypt: false,
      trustServerCertificate: true,
      enableArithAbort: true,
      integratedSecurity: true  // Add this
    }
  };

  // ALTERNATIVE: If above doesn't work, try this instead:
  const configAlt = {
    server: 'yura\\sqlexpress',
    database: 'PageBuilderDB',
    authentication: {
      type: 'default',
      options: {
        userName: 'yura\\' + process.env.USERNAME || process.env.USERNAME,
        password: ''
      }
    },
    options: {
      encrypt: false,
      trustServerCertificate: true
    }
  };

  let pool;

  sql.connect(config)
    .then((poolResult) => {
      pool = poolResult;
      console.log('Connected to SQL Server with Windows Authentication');
      app.listen(3001, () => console.log('Server running on port 3001'));
    })
    .catch((err) => {
      console.error('Database connection failed:', err);
      console.log('Trying alternative config...');
      return sql.connect(configAlt);
    })
    .then((poolResult) => {
      if (!pool) {
        pool = poolResult;
        console.log('Connected with alternative config');
        app.listen(3001, () => console.log('Server running on port 3001'));
      }
    })
    .catch((err) => {
      console.error('All connection attempts failed:', err);
    });

  // Test endpoint
  app.get('/api/test', async (req, res) => {
    try {
      const result = await pool.request().query('SELECT @@VERSION');
      res.json({ message: 'Connected!', version: result.recordset[0] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  export default app;

  