const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcrypt');
require('dotenv').config();
const routes = require('./src/routes');
const pool = require('./src/db');
const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL, 'http://localhost:3000']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});
app.set('io', io);
io.on('connection', (socket) => {
    socket.on('join_session', (sessionId) => {
        socket.join(`session_${sessionId}`);
    });
});

async function setupAdmin() {
    try {
        const passwordAdmin = 'admin123';
        const hash = await bcrypt.hash(passwordAdmin, 10);
        const baris = await pool.query(
            'SELECT id, email, peran FROM pengguna WHERE email = $1',
            ['admin@kampus.edu']
        );
        if (baris.rows.length > 0) {
            await pool.query(
                'UPDATE pengguna SET hash_kata_sandi = $1 WHERE email = $2',
                [hash, 'admin@kampus.edu']
            );
            console.log('✅ Admin password di-reset: admin@kampus.edu / admin123');
        } else {
            await pool.query(
                'INSERT INTO pengguna (nim, nama, email, hash_kata_sandi, peran) VALUES ($1, $2, $3, $4, $5)',
                [null, 'Admin Sistem', 'admin@kampus.edu', hash, 'admin']
            );
            console.log('✅ Akun admin dibuat: admin@kampus.edu / admin123');
        }
    } catch (err) {
        console.error('⚠️ Gagal setup admin:', err.message);
    }
}

app.use('/api', routes);
const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await setupAdmin();
});
module.exports = { app, server };
