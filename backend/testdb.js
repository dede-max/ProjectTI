const pool = require('./src/db');
async function testDB() {
    try {
        const [rows] = await pool.execute('SELECT * FROM pengguna LIMIT 1');
        console.log('Database connected, sample user:', rows[0]);
    } catch (error) {
        console.error('Database error:', error.message);
    } finally {
        process.exit();
    }
}
testDB();