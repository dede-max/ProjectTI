import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/serverAuth';
import pool from '@/lib/db';
import crypto from 'crypto';

export async function POST(request) {
    const { user, error } = await getAuthUser(['dosen']);
    if (error) return error;
    try {
        const body = await request.json();
        const id_mata_kuliah = body.id_mata_kuliah || body.course_id;
        const durasi_menit = body.durasi_menit || body.duration_min || 90;
        if (!id_mata_kuliah) {
            return NextResponse.json({ error: 'ID Mata Kuliah diperlukan' }, { status: 400 });
        }
        const baris_mk = await pool.query(
            'SELECT * FROM mata_kuliah WHERE id = $1 AND id_dosen = $2',
            [id_mata_kuliah, user.id]
        );
        if (baris_mk.rows.length === 0) {
            return NextResponse.json({ error: 'Tidak diizinkan untuk mata kuliah ini' }, { status: 403 });
        }
        const waktu_mulai = new Date();
        const waktu_berakhir = new Date(waktu_mulai.getTime() + durasi_menit * 60000);
        const nonce_qr = crypto.randomBytes(16).toString('hex');
        const qr_expiry_sec = parseInt(process.env.QR_EXPIRY_SEC || '60');
        const qr_kadaluarsa_pada = new Date(Date.now() + qr_expiry_sec * 1000);
        const hasil = await pool.query(
            `INSERT INTO sesi (id_mata_kuliah, waktu_mulai, waktu_berakhir, nonce_qr, qr_kadaluarsa_pada)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [id_mata_kuliah, waktu_mulai, waktu_berakhir, nonce_qr, qr_kadaluarsa_pada]
        );
        return NextResponse.json({
            message: 'Sesi dibuat',
            session_id: hasil.rows[0].id,
            start_ts: waktu_mulai,
            end_ts: waktu_berakhir
        }, { status: 201 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Kesalahan server' }, { status: 500 });
    }
}
