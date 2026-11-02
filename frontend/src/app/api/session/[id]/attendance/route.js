import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/serverAuth';
import pool from '@/lib/db';

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
            return NextResponse.json({ error: 'Sesi tidak ditemukan' }, { status: 404 });
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
        return NextResponse.json({ attendance: kehadiran.rows });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Kesalahan server' }, { status: 500 });
    }
}
