import crypto from 'crypto';

const RAHASIA_HMAC = process.env.HMAC_SECRET || 'fallback_secret_do_not_use';

export function hasilkanMuatanQR(id_sesi, nonce) {
    const waktu_stempel = Date.now();
    const string_muatan = `${id_sesi}|${waktu_stempel}|${nonce}`;
    const tanda_tangan = crypto
        .createHmac('sha256', RAHASIA_HMAC)
        .update(string_muatan)
        .digest('hex');
    const data_qr = { p: string_muatan, s: tanda_tangan };
    return Buffer.from(JSON.stringify(data_qr)).toString('base64');
}

export function verifikasiMuatanQR(muatan_base64) {
    try {
        const string_dekode = Buffer.from(muatan_base64, 'base64').toString('utf-8');
        const data_qr = JSON.parse(string_dekode);
        if (!data_qr.p || !data_qr.s) {
            return { valid: false, error: 'Muatan tidak sesuai format' };
        }
        const tanda_tangan_diharapkan = crypto
            .createHmac('sha256', RAHASIA_HMAC)
            .update(data_qr.p)
            .digest('hex');
        if (crypto.timingSafeEqual(Buffer.from(data_qr.s), Buffer.from(tanda_tangan_diharapkan))) {
            const [id_sesi, waktu_stempel, nonce] = data_qr.p.split('|');
            return { valid: true, id_sesi: parseInt(id_sesi, 10), waktu_stempel: parseInt(waktu_stempel, 10), nonce };
        }
        return { valid: false, error: 'Tanda tangan tidak valid' };
    } catch {
        return { valid: false, error: 'Format muatan tidak valid' };
    }
}
