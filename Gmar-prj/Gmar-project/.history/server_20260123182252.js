
  import express from 'express';
  import sql from 'mssql';
  import cors from 'cors';

  const app = express();
  app.use(cors());
  app.use(express.json());

  // Your C# connection string translated:
  // "Data Source=YURA\SQLEXPRESS;Initial Catalog=DragCanvas;Integrated Security=True;Encrypt=False"
  const config = {
    server: 'YURA\\SQLEXPRESS',
    database: 'DragCanvas',
    options: {
      encrypt: false,
      trustServerCertificate: true,
      enableArithAbort: true,
      // Windows Authentication
      integratedSecurity: true,
      trustedConnection: true
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
      const result = await pool.request().query('SELECT @@VERSION, SUSER_NAME() as user, DB_NAME() as database');
      res.json({
        message: 'Connected!',
        info: result.recordset[0]
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  export default app;