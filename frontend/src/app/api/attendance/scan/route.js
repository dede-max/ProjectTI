import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/serverAuth';
import pool from '@/lib/db';
import { verifikasiMuatanQR } from '@/lib/qrCrypto';
import { headers } from 'next/headers';

const pembatas = new Map();

export async function POST(request) {
    const { user: mahasiswa, error } = await getAuthUser(['mahasiswa']);
    if (error) return error;
    try {
        const body = await request.json();
        const muatan_qr = body.muatan_qr || body.qr_payload;
        const info_perangkat = body.info_perangkat || body.device_info;
        if (!muatan_qr) {
            return NextResponse.json({ status: 'error', message: 'Muatan QR diperlukan' }, { status: 400 });
        }
        const sekarang_ms = Date.now();
        const pindai_terakhir = pembatas.get(mahasiswa.id);
        if (pindai_terakhir && (sekarang_ms - pindai_terakhir < 2000)) {
            return NextResponse.json({ status: 'error', message: 'Terlalu banyak upaya pindai. Silakan tunggu.' }, { status: 429 });
        }
        pembatas.set(mahasiswa.id, sekarang_ms);
        const diurai = verifikasiMuatanQR(muatan_qr);
        if (!diurai.valid) {
            return NextResponse.json({ status: 'error', message: diurai.error }, { status: 400 });
        }
        const { id_sesi, waktu_stempel, nonce } = diurai;
        const headersList = await headers();
        const alamat_ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
        const koneksi = await pool.connect();
        try {
            await koneksi.query('BEGIN');
            const baris_sesi = await koneksi.query('SELECT * FROM sesi WHERE id = $1', [id_sesi]);
            if (baris_sesi.rows.length === 0) throw new Error('STATUS:error|CODE:404|MSG:Sesi tidak ditemukan');
            const sesi = baris_sesi.rows[0];
            const waktu_objek_sekarang = new Date();
            if (waktu_objek_sekarang > new Date(sesi.waktu_berakhir)) throw new Error('STATUS:error|CODE:400|MSG:Sesi telah berakhir');
            const detik_kadaluarsa_qr = parseInt(process.env.QR_EXPIRY_SEC || '90');
            if (sekarang_ms > waktu_stempel + (detik_kadaluarsa_qr * 1000)) throw new Error('STATUS:error|CODE:400|MSG:Kode QR telah kadaluarsa');
            const baris_nonce = await koneksi.query(
                'SELECT * FROM kode_verifikasi WHERE nonce = $1 AND id_sesi = $2',
                [nonce, id_sesi]
            );
            if (baris_nonce.rows.length > 0) throw new Error('STATUS:error|CODE:400|MSG:Kode QR sudah digunakan. Silakan perbaharui layar dosen.');
            const baris_kehadiran = await koneksi.query(
                'SELECT * FROM kehadiran WHERE id_sesi = $1 AND id_pengguna = $2',
                [id_sesi, mahasiswa.id]
            );
            if (baris_kehadiran.rows.length > 0) {
                await koneksi.query('ROLLBACK');
                koneksi.release();
                return NextResponse.json({ status: 'success', message: 'Sudah tercatat' });
            }
            await koneksi.query(
                'INSERT INTO kode_verifikasi (nonce, id_sesi, digunakan_pada) VALUES ($1, $2, $3)',
                [nonce, id_sesi, waktu_objek_sekarang]
            );
            await koneksi.query(
                `INSERT INTO kehadiran (id_sesi, id_pengguna, dipindai_pada, hash_perangkat, alamat_ip, status)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [id_sesi, mahasiswa.id, waktu_objek_sekarang, info_perangkat || null, alamat_ip, 'hadir']
            );
            await koneksi.query('COMMIT');
            koneksi.release();
            return NextResponse.json({ status: 'success', message: 'Kehadiran berhasil tercatat' });
        } catch (err) {
            await koneksi.query('ROLLBACK');
            koneksi.release();
            if (err.message.startsWith('STATUS:')) {
                const bagian = err.message.split('|');
                const kode = parseInt(bagian[1].split(':')[1], 10);
                const pesan = bagian[2].split(':')[1];
                return NextResponse.json({ status: 'error', message: pesan }, { status: kode });
            }
            throw err;
        }
    } catch (err) {
        console.error('Scan error:', err);
        return NextResponse.json({ status: 'error', message: 'Kesalahan server' }, { status: 500 });
    }
}
