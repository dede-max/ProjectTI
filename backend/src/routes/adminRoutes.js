const express = require('express');
const router = express.Router();
const { dapatkanKejanggalan, dapatkanLogAudit } = require('../controllers/adminController');
const { otentikasiToken, otorisasiPeran } = require('../middleware/auth');

router.use(otentikasiToken);
router.use(otorisasiPeran(['admin']));
router.get('/anomalies', dapatkanKejanggalan);
router.get('/audits', dapatkanLogAudit);

module.exports = router;
