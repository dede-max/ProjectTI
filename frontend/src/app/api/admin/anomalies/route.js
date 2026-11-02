import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/serverAuth';
import pool from '@/lib/db';

export async function GET() {
    const { user, error } = await getAuthUser(['admin']);
    if (error) return error;
    try {
        const hasil = await pool.query(
            `SELECT a.*, u.nama, u.nim, s.waktu_mulai, c.nama as nama_mata_kuliah
             FROM kehadiran a
             JOIN pengguna u ON a.id_pengguna = u.id
             JOIN sesi s ON a.id_sesi = s.id
             JOIN mata_kuliah c ON s.id_mata_kuliah = c.id
             WHERE a.status = 'ditandai'
             ORDER BY a.dipindai_pada DESC`
        );
        return NextResponse.json({ kejanggalan: hasil.rows });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Kesalahan server' }, { status: 500 });
    }
}
