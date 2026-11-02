import { Pool } from 'pg';

let pool;
if (!global._pgPool) {
    global._pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 3,
    });
}
pool = global._pgPool;
export default pool;
