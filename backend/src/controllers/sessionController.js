const cryptoStr = require('crypto');
const pool = require('../db');
const { hasilkanMuatanQR } = require('../utils/crypto');
require('dotenv').config();
const buatSesi = async (req, res) => {
    try {
        const id_mata_kuliah = req.body.id_mata_kuliah || req.body.course_id;
        const durasi_menit = req.body.durasi_menit || req.body.duration_min || 90;
        if (!id_mata_kuliah) {
            return res.status(400).json({ error: 'ID Mata Kuliah diperlukan' });
        }
        const baris_mk = await pool.query(
            'SELECT * FROM mata_kuliah WHERE id = $1 AND id_dosen = $2',
            [id_mata_kuliah, req.pengguna.id]
        );
        if (baris_mk.rows.length === 0) {
            return res.status(403).json({ error: 'Tidak diizinkan untuk mata kuliah ini' });
        }
        const waktu_mulai = new Date();
        const waktu_berakhir = new Date(waktu_mulai.getTime() + durasi_menit * 60000);
        const nonce_qr = cryptoStr.randomBytes(16).toString('hex');
        const qr_kadaluarsa_pada = new Date(Date.now() + (parseInt(process.env.QR_EXPIRY_SEC || 60) * 1000));
        const hasil = await pool.query(
            `INSERT INTO sesi (id_mata_kuliah, waktu_mulai, waktu_berakhir, nonce_qr, qr_kadaluarsa_pada)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [id_mata_kuliah, waktu_mulai, waktu_berakhir, nonce_qr, qr_kadaluarsa_pada]
        );
        res.status(201).json({
            message: 'Sesi dibuat',
            session_id: hasil.rows[0].id,
            start_ts: waktu_mulai,
            end_ts: waktu_berakhir
        });
    } catch (kesalahan) {
        console.error('Kesalahan buat sesi:', kesalahan);
        res.status(500).json({ error: 'Kesalahan server' });
    }
};
const dapatkanMuatanQR = async (req, res) => {
    try {
        const id_sesi = parseInt(req.params.id, 10);
        const baris_sesi = await pool.query(
            `SELECT s.*, c.id_dosen FROM sesi s 
             JOIN mata_kuliah c ON s.id_mata_kuliah = c.id 
             WHERE s.id = $1 AND c.id_dosen = $2`,
            [id_sesi, req.pengguna.id]
        );
        if (baris_sesi.rows.length === 0) {
            return res.status(404).json({ error: 'Sesi tidak ditemukan atau tidak diizinkan' });
        }
        const sesi = baris_sesi.rows[0];
        const sekarang = new Date();
        if (sekarang > new Date(sesi.waktu_berakhir)) {
            return res.status(400).json({ error: 'Sesi sudah berakhir' });
        }
        let nonce_sekarang = sesi.nonce_qr;
        let kadaluarsa_pada = new Date(sesi.qr_kadaluarsa_pada);
        if (sekarang >= new Date(kadaluarsa_pada.getTime() - 2000)) {
            nonce_sekarang = cryptoStr.randomBytes(16).toString('hex');
            kadaluarsa_pada = new Date(Date.now() + (parseInt(process.env.QR_EXPIRY_SEC || 60) * 1000));
            await pool.query(
                'UPDATE sesi SET nonce_qr = $1, qr_kadaluarsa_pada = $2 WHERE id = $3',
                [nonce_sekarang, kadaluarsa_pada, id_sesi]
            );
        }
        const muatan_base64 = hasilkanMuatanQR(id_sesi, nonce_sekarang);
        res.json({
            qr_payload: muatan_base64,
            expires_at: kadaluarsa_pada
        });
    } catch (kesalahan) {
        console.error('Kesalahan dapatkan QR:', kesalahan);
        res.status(500).json({ error: 'Kesalahan server' });
    }
};
const dapatkanKehadiranSesi = async (req, res) => {
    try {
        const id_sesi = parseInt(req.params.id, 10);
        const baris_sesi = await pool.query(
            `SELECT s.*, c.id_dosen FROM sesi s 
             JOIN mata_kuliah c ON s.id_mata_kuliah = c.id 
             WHERE s.id = $1 AND c.id_dosen = $2`,
            [id_sesi, req.pengguna.id]
        );
        if (baris_sesi.rows.length === 0) {
            return res.status(404).json({ error: 'Sesi tidak ditemukan' });
        }
        const kehadiran = await pool.query(
            `SELECT a.*, u.nama as name, u.nim, u.email, a.dipindai_pada as scanned_at,
             CASE WHEN a.status = 'hadir' THEN 'present' ELSE 'flagged' END as status
             FROM kehadiran a 
             JOIN pengguna u ON a.id_pengguna = u.id 
             WHERE a.id_sesi = $1 
             ORDER BY a.dipindai_pada DESC`,
            [id_sesi]
        );
        res.json({ attendance: kehadiran.rows });
    } catch (kesalahan) {
        console.error('Kesalahan dapatkan kehadiran:', kesalahan);
        res.status(500).json({ error: 'Kesalahan server' });
    }
};
const dapatkanSesiDosen = async (req, res) => {
    try {
        const sesi = await pool.query(
            `SELECT s.*, c.nama as course_name, s.waktu_mulai as start_ts, s.waktu_berakhir as end_ts,
             COUNT(k.id)::int as attendance_count
             FROM sesi s
             JOIN mata_kuliah c ON s.id_mata_kuliah = c.id
             LEFT JOIN kehadiran k ON k.id_sesi = s.id
             WHERE c.id_dosen = $1
             GROUP BY s.id, c.nama
             ORDER BY s.dibuat_pada DESC`,
            [req.pengguna.id]
        );
        res.json({ sessions: sesi.rows });
    } catch (kesalahan) {
        res.status(500).json({ error: 'Kesalahan server' });
    }
};
const dapatkanMatKuliahDosen = async (req, res) => {
    try {
        const mata_kuliah = await pool.query(
            'SELECT id, nama as name, id_dosen FROM mata_kuliah WHERE id_dosen = $1',
            [req.pengguna.id]
        );
        res.json({ courses: mata_kuliah.rows });
    } catch (kesalahan) {
        res.status(500).json({ error: 'Kesalahan server' });
    }
};
const hapusSesi = async (req, res) => {
    try {
        const id_sesi = parseInt(req.params.id, 10);
        const baris_sesi = await pool.query(
            `SELECT s.*, c.id_dosen FROM sesi s 
             JOIN mata_kuliah c ON s.id_mata_kuliah = c.id 
             WHERE s.id = $1 AND c.id_dosen = $2`,
            [id_sesi, req.pengguna.id]
        );
        if (baris_sesi.rows.length === 0) {
            return res.status(404).json({ error: 'Sesi tidak ditemukan atau tidak diizinkan' });
        }
        await pool.query('DELETE FROM kehadiran WHERE id_sesi = $1', [id_sesi]);
        await pool.query('DELETE FROM kode_verifikasi WHERE id_sesi = $1', [id_sesi]);
        await pool.query('DELETE FROM sesi WHERE id = $1', [id_sesi]);
        res.json({ message: 'Sesi dihapus berhasil' });
    } catch (kesalahan) {
        console.error('Kesalahan hapus sesi:', kesalahan);
        res.status(500).json({ error: 'Kesalahan server' });
    }
};
module.exports = { buatSesi, dapatkanMuatanQR, dapatkanKehadiranSesi, dapatkanSesiDosen, dapatkanMatKuliahDosen, hapusSesi };
