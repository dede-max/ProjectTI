import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/serverAuth';
import pool from '@/lib/db';

export async function GET() {
    const { user, error } = await getAuthUser(['dosen']);
    if (error) return error;
    try {
        const mk = await pool.query(
            'SELECT id, nama as name, id_dosen FROM mata_kuliah WHERE id_dosen = $1',
            [user.id]
        );
        return NextResponse.json({ courses: mk.rows });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Kesalahan server' }, { status: 500 });
    }
}
