import pg from 'pg';

const { Pool } = pg;

/**
 * Singleton service for PostgreSQL access.
 *
 * Only one instance exists for the whole application, so the connection Pool
 * is created once instead of opening a new connection on every request.
 * Every controller/model imports the same ready instance.
 */
class SQLServices {
    static instance = null;   // the single instance
    pool = null;              // the connection pool

    constructor() {
        // Second `new SQLServices()` returns the existing instance
        if (SQLServices.instance) {
            return SQLServices.instance;
        }
        SQLServices.instance = this;
    }

    /** Create the pool on first use, then always return the same one. */
    async connect() {
        if (!this.pool) {
            const connectionString = process.env.DATABASE_URL || process.env.DATABASEURL;
            this.pool = new Pool({
                connectionString,
                ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
            });

            // An idle connection can die on its own (network blip, database
            // restart). Without this listener Node treats that as an uncaught
            // error and kills the whole server, so we log it and let the pool
            // open a fresh connection on the next query.
            this.pool.on('error', (error) => {
                console.error('[DB] Idle client error:', error.message);
            });

            // Fail fast if the credentials are wrong
            const client = await this.pool.connect();
            client.release();
            console.log('Connected to PostgreSQL (Pool created)');
        }
        return this.pool;
    }

    /**
     * Run a query with parameters.
     * Values are never concatenated into the SQL string - they travel as
     * parameters ($1, $2, ...), which is what protects us from SQL Injection.
     */
    async executeQuery(queryText, params = []) {
        await this.connect();
        const result = await this.pool.query(queryText, params);
        return result.rows;
    }

    /**
     * Same as executeQuery but returns the full result object, for the cases
     * where we need `rowCount` (UPDATE/DELETE) and not only the rows.
     */
    async executeCommand(queryText, params = []) {
        await this.connect();
        return this.pool.query(queryText, params);
    }
}

// Create the single instance and export it
const sqlServices = new SQLServices();

export default sqlServices;
