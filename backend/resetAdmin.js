/**
 * Script untuk reset password admin dan verifikasi login
 * Jalankan: node resetAdmin.js
 */
const bcrypt = require('bcrypt');
const pool = require('./src/db');

async function resetAdmin() {
    try {
        // Generate hash baru untuk 'admin123'
        const passwordBaru = 'admin123';
        const hash = await bcrypt.hash(passwordBaru, 10);
        console.log('Hash baru untuk admin123:', hash);

        // Cek apakah admin sudah ada
        const [baris] = await pool.execute(
            'SELECT id, nama, email, peran FROM pengguna WHERE email = ?',
            ['admin@kampus.edu']
        );

        if (baris.length > 0) {
            // Update password admin
            await pool.execute(
                'UPDATE pengguna SET hash_kata_sandi = ? WHERE email = ?',
                [hash, 'admin@kampus.edu']
            );
            console.log('✅ Password admin berhasil diupdate!');
            console.log('   Email    : admin@kampus.edu');
            console.log('   Password : admin123');
            console.log('   Peran    :', baris[0].peran);
        } else {
            // Insert admin baru jika belum ada
            await pool.execute(
                'INSERT INTO pengguna (nim, nama, email, hash_kata_sandi, peran) VALUES (?, ?, ?, ?, ?)',
                [null, 'Admin Sistem', 'admin@kampus.edu', hash, 'admin']
            );
            console.log('✅ Akun admin berhasil dibuat!');
            console.log('   Email    : admin@kampus.edu');
            console.log('   Password : admin123');
        }

        // Verifikasi dengan login test
        const [verifikasi] = await pool.execute(
            'SELECT * FROM pengguna WHERE email = ?',
            ['admin@kampus.edu']
        );
        const cocok = await bcrypt.compare(passwordBaru, verifikasi[0].hash_kata_sandi);
        console.log('\n🔐 Verifikasi password:', cocok ? '✅ COCOK' : '❌ TIDAK COCOK');
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

resetAdmin();
