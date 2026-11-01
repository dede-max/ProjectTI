const pool = require('../db');
const dapatkanKejanggalan = async (req, res) => {
    try {
        const hasil = await pool.query(
            `SELECT a.*, u.nama, u.nim, s.waktu_mulai, c.nama as nama_mata_kuliah
             FROM kehadiran a
             JOIN pengguna u ON a.id_pengguna = u.id
             JOIN sesi s ON a.id_sesi = s.id
             JOIN mata_kuliah c ON s.id_mata_kuliah = c.id
             WHERE a.status = 'ditandai'
             ORDER BY a.dipindai_pada DESC`
        );
        res.json({ kejanggalan: hasil.rows });
    } catch (kesalahan) {
        res.status(500).json({ error: 'Kesalahan server' });
    }
};
const dapatkanLogAudit = async (req, res) => {
    try {
        const hasil = await pool.query(
            `SELECT a.*, u.nama, u.nim 
             FROM log_audit a
             JOIN pengguna u ON a.id_pengguna = u.id
             ORDER BY a.dibuat_pada DESC`
        );
        res.json({ log: hasil.rows });
    } catch (kesalahan) {
        res.status(500).json({ error: 'Kesalahan server' });
    }
};
module.exports = { dapatkanKejanggalan, dapatkanLogAudit };
