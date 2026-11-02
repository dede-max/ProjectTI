import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/serverAuth';
import pool from '@/lib/db';

export async function GET() {
    const { user, error } = await getAuthUser(['dosen']);
    if (error) return error;
    try {
        const sesi = await pool.query(
            `SELECT s.*, c.nama as course_name, s.waktu_mulai as start_ts, s.waktu_berakhir as end_ts,
             COUNT(k.id)::int as attendance_count
             FROM sesi s
             JOIN mata_kuliah c ON s.id_mata_kuliah = c.id
             LEFT JOIN kehadiran k ON k.id_sesi = s.id
             WHERE c.id_dosen = $1
             GROUP BY s.id, c.nama
             ORDER BY s.dibuat_pada DESC`,
            [user.id]
        );
        return NextResponse.json({ sessions: sesi.rows });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Kesalahan server' }, { status: 500 });
    }
}
