import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/serverAuth';
import pool from '@/lib/db';

export async function DELETE(request, { params }) {
    const { user, error } = await getAuthUser(['dosen']);
    if (error) return error;
    try {
        const id_sesi = parseInt(params.id, 10);
        const baris = await pool.query(
            `SELECT s.*, c.id_dosen FROM sesi s
             JOIN mata_kuliah c ON s.id_mata_kuliah = c.id
             WHERE s.id = $1 AND c.id_dosen = $2`,
            [id_sesi, user.id]
        );
        if (baris.rows.length === 0) {
            return NextResponse.json({ error: 'Sesi tidak ditemukan atau tidak diizinkan' }, { status: 404 });
        }
        await pool.query('DELETE FROM kehadiran WHERE id_sesi = $1', [id_sesi]);
        await pool.query('DELETE FROM kode_verifikasi WHERE id_sesi = $1', [id_sesi]);
        await pool.query('DELETE FROM sesi WHERE id = $1', [id_sesi]);
        return NextResponse.json({ message: 'Sesi dihapus berhasil' });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Kesalahan server' }, { status: 500 });
    }
}
