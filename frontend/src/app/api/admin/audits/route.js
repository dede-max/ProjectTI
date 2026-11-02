import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/serverAuth';
import pool from '@/lib/db';

export async function GET() {
    const { user, error } = await getAuthUser(['admin']);
    if (error) return error;
    try {
        const hasil = await pool.query(
            `SELECT a.*, u.nama, u.nim
             FROM log_audit a
             JOIN pengguna u ON a.id_pengguna = u.id
             ORDER BY a.dibuat_pada DESC`
        );
        return NextResponse.json({ log: hasil.rows });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Kesalahan server' }, { status: 500 });
    }
}
