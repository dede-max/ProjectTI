const express = require('express');
const router = express.Router();
const { masuk, keluar, saya, daftar } = require('../controllers/authController');
const { otentikasiToken } = require('../middleware/auth');
router.post('/login', masuk);
router.post('/logout', keluar);
router.post('/register', daftar);
router.get('/me', otentikasiToken, saya);
module.exports = router;
