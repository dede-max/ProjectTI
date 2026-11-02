import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/serverAuth';
import pool from '@/lib/db';

export async function GET() {
    const { user: mahasiswa, error } = await getAuthUser(['mahasiswa']);
    if (error) return error;
    try {
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
        return NextResponse.json({ history: riwayat.rows });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Kesalahan server' }, { status: 500 });
    }
}
