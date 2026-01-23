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

  app.get('/api/test', async (req, res) => {
    try {
      const result = await pool.request().query('SELECT @@VERSION as version, SUSER_NAME()as current_user, DB_NAME() as database');
      res.json({
        message: 'Connected!',
        info: result.recordset[0]
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  export default app;
