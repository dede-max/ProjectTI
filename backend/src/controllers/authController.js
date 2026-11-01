const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
require('dotenv').config();
const RAHASIA_JWT = process.env.JWT_SECRET || 'fallback_secret';
const masuk = async (req, res) => {
    try {
        const { nama_pengguna, kata_sandi } = req.body;
        if (!nama_pengguna || !kata_sandi) {
            return res.status(400).json({ error: 'Nama pengguna dan kata sandi diperlukan' });
        }
        const hasil = await pool.query(
            'SELECT * FROM pengguna WHERE nim = $1 OR email = $2 LIMIT 1',
            [nama_pengguna, nama_pengguna]
        );
        const baris = hasil.rows;
        if (baris.length === 0) {
            return res.status(401).json({ error: 'Kredensial tidak valid' });
        }
        const pengguna = baris[0];
        const kata_sandi_valid = await bcrypt.compare(kata_sandi, pengguna.hash_kata_sandi);
        if (!kata_sandi_valid) {
            return res.status(401).json({ error: 'Kredensial tidak valid' });
        }
        const token = jwt.sign(
            { id: pengguna.id, peran: pengguna.peran, nim: pengguna.nim, email: pengguna.email, nama: pengguna.nama },
            RAHASIA_JWT,
            { expiresIn: '8h' }
        );
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('token', token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 8 * 60 * 60 * 1000
        });
        res.json({
            message: 'Berhasil masuk',
            pengguna: {
                id: pengguna.id,
                nama: pengguna.nama,
                peran: pengguna.peran,
                nim: pengguna.nim
            }
        });
    } catch (kesalahan) {
        console.error('Kesalahan masuk:', kesalahan);
        res.status(500).json({ error: 'Kesalahan server' });
    }
};
const keluar = (req, res) => {
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('token', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax'
    });
    res.json({ message: 'Berhasil keluar' });
};
const saya = (req, res) => {
    if (!req.pengguna) {
        return res.status(401).json({ error: 'Tidak terotentikasi' });
    }
    res.json({ pengguna: req.pengguna });
};
const daftar = async (req, res) => {
    try {
        const { nim, nama, email, kata_sandi } = req.body;
        if (!nim || !nama || !email || !kata_sandi) {
            return res.status(400).json({ error: 'Semua bidang diperlukan' });
        }
        const ada = await pool.query(
            'SELECT * FROM pengguna WHERE nim = $1 OR email = $2 LIMIT 1',
            [nim, email]
        );
        if (ada.rows.length > 0) {
            return res.status(409).json({ error: 'NIM atau Email sudah terdaftar' });
        }
        const garam = await bcrypt.genSalt(10);
        const hash_kata_sandi = await bcrypt.hash(kata_sandi, garam);
        const hasil = await pool.query(
            'INSERT INTO pengguna (nim, nama, email, hash_kata_sandi, peran) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [nim, nama, email, hash_kata_sandi, 'mahasiswa']
        );
        res.status(201).json({
            message: 'Pendaftaran berhasil',
            pengguna: { id: hasil.rows[0].id, nama, nim, peran: 'mahasiswa' }
        });
    } catch (kesalahan) {
        console.error('Kesalahan pendaftaran:', kesalahan);
        res.status(500).json({ error: 'Kesalahan server' });
    }
};
module.exports = { masuk, keluar, saya, daftar };
