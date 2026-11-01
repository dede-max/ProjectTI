const jwt = require('jsonwebtoken');
require('dotenv').config();
const RAHASIA_JWT = process.env.JWT_SECRET || 'fallback_secret';
const otentikasiToken = (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).json({ error: 'Akses ditolak. Tidak ada token yang diberikan.' });
    }
    try {
        const didekode = jwt.verify(token, RAHASIA_JWT);
        req.pengguna = didekode; 
        next();
    } catch (kesalahan) {
        res.status(403).json({ error: 'Token tidak valid.' });
    }
};
const otorisasiPeran = (peran) => {
    return (req, res, next) => {
        if (!req.pengguna || !peran.includes(req.pengguna.peran)) {
            return res.status(403).json({ error: 'Terlarang. Anda tidak memiliki peran yang diperlukan.' });
        }
        next();
    };
};
module.exports = { otentikasiToken, otorisasiPeran };
