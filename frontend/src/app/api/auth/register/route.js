import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';

export async function POST(request) {
    try {
        const { nim, nama, email, kata_sandi } = await request.json();
        if (!nim || !nama || !email || !kata_sandi) {
            return NextResponse.json({ error: 'Semua bidang diperlukan' }, { status: 400 });
        }
        const ada = await pool.query(
            'SELECT * FROM pengguna WHERE nim = $1 OR email = $2 LIMIT 1',
            [nim, email]
        );
        if (ada.rows.length > 0) {
            return NextResponse.json({ error: 'NIM atau Email sudah terdaftar' }, { status: 409 });
        }
        const hash_kata_sandi = await bcrypt.hash(kata_sandi, 10);
        const hasil = await pool.query(
            'INSERT INTO pengguna (nim, nama, email, hash_kata_sandi, peran) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [nim, nama, email, hash_kata_sandi, 'mahasiswa']
        );
        return NextResponse.json({
            message: 'Pendaftaran berhasil',
            pengguna: { id: hasil.rows[0].id, nama, nim, peran: 'mahasiswa' }
        }, { status: 201 });
    } catch (err) {
        console.error('Register error:', err);
        return NextResponse.json({ error: 'Kesalahan server' }, { status: 500 });
    }
}
