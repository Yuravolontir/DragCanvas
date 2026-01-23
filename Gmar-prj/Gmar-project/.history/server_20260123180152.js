 import express from 'express';
  import sql from 'mssql';
  import cors from 'cors';

  const app = express();
  app.use(cors());
  app.use(express.json());

  // Windows Authentication config
  const config = {
    server: 'yura\\sqlexpress',
    database: 'DragCanvas',
    driver: 'MSNodeSQLv8',
    options: {
      trustedConnection: true,
      trustServerCertificate: true
    }
  };

  let pool;

  sql.connect(config)
    .then((poolResult) => {
      pool = poolResult;
      console.log('Connected to SQL Server with Windows Authentication!');
      app.listen(3001, () => console.log('Server running on port 3001'));
    })
    .catch((err) => {
      console.error('Database connection failed:', err);
    });

  // Test endpoint
  app.get('/api/test', async (req, res) => {
    try {
      const result = await pool.request().query('SELECT @@VERSION, SUSER_NAME() as user');
      res.json({
        message: 'Connected!',
        user: result.recordset[0]
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  export default app;