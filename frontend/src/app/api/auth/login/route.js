import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

export async function POST(request) {
    try {
        const { nama_pengguna, kata_sandi } = await request.json();
        if (!nama_pengguna || !kata_sandi) {
            return NextResponse.json({ error: 'Nama pengguna dan kata sandi diperlukan' }, { status: 400 });
        }
        const result = await pool.query(
            'SELECT * FROM pengguna WHERE nim = $1 OR email = $2 LIMIT 1',
            [nama_pengguna, nama_pengguna]
        );
        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Kredensial tidak valid' }, { status: 401 });
        }
        const pengguna = result.rows[0];
        const valid = await bcrypt.compare(kata_sandi, pengguna.hash_kata_sandi);
        if (!valid) {
            return NextResponse.json({ error: 'Kredensial tidak valid' }, { status: 401 });
        }
        const token = jwt.sign(
            { id: pengguna.id, peran: pengguna.peran, nim: pengguna.nim, email: pengguna.email, nama: pengguna.nama },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );
        const response = NextResponse.json({
            message: 'Berhasil masuk',
            pengguna: { id: pengguna.id, nama: pengguna.nama, peran: pengguna.peran, nim: pengguna.nim }
        });
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 8 * 60 * 60,
            path: '/'
        });
        return response;
    } catch (err) {
        console.error('Login error:', err);
        return NextResponse.json({ error: 'Kesalahan server' }, { status: 500 });
    }
}
