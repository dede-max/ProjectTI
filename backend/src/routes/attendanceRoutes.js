const express = require('express');
const router = express.Router();
const { pindaiQR, dapatkanRiwayatMahasiswa } = require('../controllers/attendanceController');
const { otentikasiToken, otorisasiPeran } = require('../middleware/auth');
router.use(otentikasiToken);
router.post('/scan', otorisasiPeran(['mahasiswa']), pindaiQR);
router.get('/history', otorisasiPeran(['mahasiswa']), dapatkanRiwayatMahasiswa);
module.exports = router;
