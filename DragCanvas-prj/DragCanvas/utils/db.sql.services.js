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

/**
 * Run several statements as one unit, on one connection.
 *
 * `executeQuery` takes a connection from the pool per call, so a sequence of
 * writes through it is a sequence of independent transactions: a failure
 * halfway through leaves the earlier ones committed. Anything that has to be
 * all-or-nothing needs the same client throughout, which is what this hands to
 * `work` - deleting an account, for instance, where stopping halfway would
 * leave a user with no projects or projects with no user.
 *
 * @param {(query: (text: string, params?: any[]) => Promise<any>) => Promise<any>} work
 */
export async function withTransaction(work) {
    const pool = await sqlServices.connect();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const result = await work((text, params = []) => client.query(text, params));
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Runs `work` only if no other process is already running it.
 *
 * Background jobs live inside the API process, so every instance of the server
 * wakes up on the same schedule. The birthday job checks the delivery log
 * before sending, which survives a restart - but two instances checking at the
 * same moment would both find nothing and both send. A PostgreSQL advisory
 * lock closes that window: it is held on a connection and costs nothing.
 *
 * An instance that cannot take the lock skips this tick rather than waiting -
 * the work is on a schedule and will come round again.
 *
 * @returns {Promise<{ran: boolean, result?: any}>}
 */
export async function withAdvisoryLock(key, work) {
    const pool = await sqlServices.connect();
    const client = await pool.connect();

    try {
        const { rows } = await client.query('SELECT pg_try_advisory_lock($1) AS acquired', [key]);
        if (!rows[0].acquired) {
            console.log(`[LOCK ${key}] another instance is already running this - skipping`);
            return { ran: false };
        }

        try {
            return { ran: true, result: await work() };
        } finally {
            // Released even if the work threw; the lock would also die with the
            // connection, but leaving it held until then would skip a tick.
            await client.query('SELECT pg_advisory_unlock($1)', [key]);
        }
    } finally {
        client.release();
    }
}

// Create the single instance and export it
const sqlServices = new SQLServices();

export default sqlServices;
