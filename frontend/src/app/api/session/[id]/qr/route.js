import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/serverAuth';
import pool from '@/lib/db';
import { hasilkanMuatanQR } from '@/lib/qrCrypto';
import crypto from 'crypto';

export async function GET(request, { params }) {
    const { user, error } = await getAuthUser(['dosen']);
    if (error) return error;
    try {
        const id_sesi = parseInt(params.id, 10);
        const baris_sesi = await pool.query(
            `SELECT s.*, c.id_dosen FROM sesi s
             JOIN mata_kuliah c ON s.id_mata_kuliah = c.id
             WHERE s.id = $1 AND c.id_dosen = $2`,
            [id_sesi, user.id]
        );
        if (baris_sesi.rows.length === 0) {
            return NextResponse.json({ error: 'Sesi tidak ditemukan atau tidak diizinkan' }, { status: 404 });
        }
        const sesi = baris_sesi.rows[0];
        const sekarang = new Date();
        if (sekarang > new Date(sesi.waktu_berakhir)) {
            return NextResponse.json({ error: 'Sesi sudah berakhir' }, { status: 400 });
        }
        let nonce_sekarang = sesi.nonce_qr;
        let kadaluarsa_pada = new Date(sesi.qr_kadaluarsa_pada);
        if (sekarang >= new Date(kadaluarsa_pada.getTime() - 2000)) {
            nonce_sekarang = crypto.randomBytes(16).toString('hex');
            kadaluarsa_pada = new Date(Date.now() + (parseInt(process.env.QR_EXPIRY_SEC || '60') * 1000));
            await pool.query(
                'UPDATE sesi SET nonce_qr = $1, qr_kadaluarsa_pada = $2 WHERE id = $3',
                [nonce_sekarang, kadaluarsa_pada, id_sesi]
            );
        }
        const muatan_base64 = hasilkanMuatanQR(id_sesi, nonce_sekarang);
        return NextResponse.json({ qr_payload: muatan_base64, expires_at: kadaluarsa_pada });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Kesalahan server' }, { status: 500 });
    }
}
