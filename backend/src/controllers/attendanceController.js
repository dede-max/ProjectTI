const pool = require('../db');
const { verifikasiMuatanQR } = require('../utils/crypto');
require('dotenv').config();
const pembatas_kecepatan_pindai = new Map();
const pindaiQR = async (req, res) => {
    try {
        const muatan_qr = req.body.muatan_qr || req.body.qr_payload;
        const info_perangkat = req.body.info_perangkat || req.body.device_info;
        const mahasiswa = req.pengguna;
        if (!muatan_qr) {
            return res.status(400).json({ status: 'error', message: 'Muatan QR diperlukan' });
        }
        const sekarang_ms = Date.now();
        const pindai_terakhir = pembatas_kecepatan_pindai.get(mahasiswa.id);
        if (pindai_terakhir && (sekarang_ms - pindai_terakhir < 2000)) {
            return res.status(429).json({ status: 'error', message: 'Terlalu banyak upaya pindai. Silakan tunggu.' });
        }
        pembatas_kecepatan_pindai.set(mahasiswa.id, sekarang_ms);
        const diurai = verifikasiMuatanQR(muatan_qr);
        if (!diurai.valid) {
            return res.status(400).json({ status: 'error', message: diurai.error });
        }
        const { id_sesi, waktu_stempel, nonce } = diurai;
        const koneksi = await pool.connect();
        try {
            await koneksi.query('BEGIN');
            const baris_sesi = await koneksi.query(
                'SELECT * FROM sesi WHERE id = $1',
                [id_sesi]
            );
            if (baris_sesi.rows.length === 0) {
                throw new Error('STATUS:error|CODE:404|MSG:Sesi tidak ditemukan');
            }
            const sesi = baris_sesi.rows[0];
            const waktu_objek_sekarang = new Date();
            if (waktu_objek_sekarang > new Date(sesi.waktu_berakhir)) {
                throw new Error('STATUS:error|CODE:400|MSG:Sesi telah berakhir');
            }
            const detik_kadaluarsa_qr = parseInt(process.env.QR_EXPIRY_SEC || 90);
            if (sekarang_ms > waktu_stempel + (detik_kadaluarsa_qr * 1000)) {
                throw new Error('STATUS:error|CODE:400|MSG:Kode QR telah kadaluarsa');
            }
            const baris_nonce = await koneksi.query(
                'SELECT * FROM kode_verifikasi WHERE nonce = $1 AND id_sesi = $2',
                [nonce, id_sesi]
            );
            if (baris_nonce.rows.length > 0) {
                throw new Error('STATUS:error|CODE:400|MSG:Kode QR sudah digunakan. Silakan perbaharui layar dosen.');
            }
            const baris_kehadiran = await koneksi.query(
                'SELECT * FROM kehadiran WHERE id_sesi = $1 AND id_pengguna = $2',
                [id_sesi, mahasiswa.id]
            );
            if (baris_kehadiran.rows.length > 0) {
                await koneksi.query('ROLLBACK');
                koneksi.release();
                return res.status(200).json({ status: 'success', message: 'Sudah tercatat' });
            }
            await koneksi.query(
                'INSERT INTO kode_verifikasi (nonce, id_sesi, digunakan_pada) VALUES ($1, $2, $3)',
                [nonce, id_sesi, waktu_objek_sekarang]
            );
            const alamat_ip = req.ip || req.connection?.remoteAddress;
            await koneksi.query(
                `INSERT INTO kehadiran (id_sesi, id_pengguna, dipindai_pada, hash_perangkat, alamat_ip, status)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [id_sesi, mahasiswa.id, waktu_objek_sekarang, info_perangkat || null, alamat_ip, 'hadir']
            );
            await koneksi.query('COMMIT');
            const io = req.app.get('io');
            if (io) {
                io.to(`session_${id_sesi}`).emit('attendance_update', {
                    id_pengguna: mahasiswa.id,
                    nim: mahasiswa.nim,
                    name: mahasiswa.nama,
                    status: 'present',
                    scanned_at: waktu_objek_sekarang
                });
            }
            res.json({
                status: 'success',
                message: 'Kehadiran berhasil tercatat'
            });
        } catch (kesalahan) {
            await koneksi.query('ROLLBACK');
            if (kesalahan.message.startsWith('STATUS:')) {
                const bagian = kesalahan.message.split('|');
                const kode = parseInt(bagian[1].split(':')[1], 10);
                const pesan = bagian[2].split(':')[1];
                koneksi.release();
                return res.status(kode).json({ status: 'error', message: pesan });
            }
            throw kesalahan;
        } finally {
            koneksi.release();
        }
    } catch (kesalahan) {
        console.error('Kesalahan Pindai QR:', kesalahan);
        res.status(500).json({ status: 'error', message: 'Kesalahan server' });
    }
};
const dapatkanRiwayatMahasiswa = async (req, res) => {
    try {
        const mahasiswa = req.pengguna;
        const riwayat = await pool.query(
            `SELECT a.*, s.waktu_mulai, c.nama as course_name, a.dipindai_pada as scanned_at,
             CASE WHEN a.status = 'hadir' THEN 'present' ELSE 'flagged' END as status
             FROM kehadiran a
             JOIN sesi s ON a.id_sesi = s.id
             JOIN mata_kuliah c ON s.id_mata_kuliah = c.id
             WHERE a.id_pengguna = $1
             ORDER BY a.dipindai_pada DESC`,
            [mahasiswa.id]
        );
        res.json({ history: riwayat.rows });
    } catch (kesalahan) {
        res.status(500).json({ error: 'Kesalahan server' });
    }
};
module.exports = { pindaiQR, dapatkanRiwayatMahasiswa };
