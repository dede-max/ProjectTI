DROP TABLE IF EXISTS log_audit;
DROP TABLE IF EXISTS kode_verifikasi;
DROP TABLE IF EXISTS kehadiran;
DROP TABLE IF EXISTS sesi;
DROP TABLE IF EXISTS mata_kuliah;
DROP TABLE IF EXISTS pengguna;

CREATE TABLE pengguna (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nim VARCHAR(20) NULL UNIQUE,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    hash_kata_sandi VARCHAR(255) NOT NULL,
    peran ENUM('mahasiswa','dosen','admin') NOT NULL,
    dibuat_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Mata Kuliah
CREATE TABLE mata_kuliah (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(150) NOT NULL,
    id_dosen INT NOT NULL,
    dibuat_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_dosen) REFERENCES pengguna(id) ON DELETE CASCADE
);

-- 3. Tabel Sesi
CREATE TABLE sesi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_mata_kuliah INT NOT NULL,
    waktu_mulai DATETIME NOT NULL,
    waktu_berakhir DATETIME NOT NULL,
    nonce_qr VARCHAR(255) NOT NULL,
    qr_kadaluarsa_pada DATETIME NOT NULL,
    lokasi_lat DECIMAL(10,6) NULL,
    lokasi_lon DECIMAL(10,6) NULL,
    dibuat_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_mata_kuliah) REFERENCES mata_kuliah(id) ON DELETE CASCADE,
    INDEX idx_nonce_qr (nonce_qr)
);

-- 4. Tabel Kehadiran
CREATE TABLE kehadiran (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_sesi INT NOT NULL,
    id_pengguna INT NOT NULL,
    dipindai_pada DATETIME NOT NULL,
    hash_perangkat VARCHAR(255) NULL,
    alamat_ip VARCHAR(45) NULL,
    lat DECIMAL(10,6) NULL,
    lon DECIMAL(10,6) NULL,
    status VARCHAR(20) DEFAULT 'hadir',
    tambahan JSON NULL,
    FOREIGN KEY (id_sesi) REFERENCES sesi(id) ON DELETE CASCADE,
    FOREIGN KEY (id_pengguna) REFERENCES pengguna(id) ON DELETE CASCADE,
    UNIQUE KEY pindai_unik (id_sesi, id_pengguna)
);

-- 5. Tabel Kode Verifikasi (untuk melacak kode QR yang digunakan)
CREATE TABLE kode_verifikasi (
    nonce VARCHAR(255) PRIMARY KEY,
    id_sesi INT NOT NULL,
    digunakan_pada DATETIME NULL,
    FOREIGN KEY (id_sesi) REFERENCES sesi(id) ON DELETE CASCADE
);

-- 6. Tabel Log Audit
CREATE TABLE log_audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aksi VARCHAR(255) NOT NULL,
    id_pengguna INT NULL,
    metadata TEXT NULL,
    dibuat_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_pengguna) REFERENCES pengguna(id) ON DELETE SET NULL
);

-- ==========================================
-- DATA AWAL
-- Kata sandi untuk semua akun adalah 'password123'
-- Hash dihasilkan melalui bcrypt: $2b$10$QMJNExp9UA2TJmruinVVu.RE/.qlBwsmDV6ciS75DpWN.z0PXwEBK
-- ==========================================

-- Admin
INSERT INTO pengguna (nim, nama, email, hash_kata_sandi, peran) VALUES 
(NULL, 'Admin Sistem', 'admin@kampus.edu', '$2b$10$QMJNExp9UA2TJmruinVVu.RE/.qlBwsmDV6ciS75DpWN.z0PXwEBK', 'admin');

-- Dosen (1)
INSERT INTO pengguna (nim, nama, email, hash_kata_sandi, peran) VALUES 
(NULL, 'Buntoro Irawan', 'Buntoro@gmail.com', '$2b$10$QMJNExp9UA2TJmruinVVu.RE/.qlBwsmDV6ciS75DpWN.z0PXwEBK', 'dosen');

-- Mahasiswa (5)
INSERT INTO pengguna (nim, nama, email, hash_kata_sandi, peran) VALUES 
('101001', 'galih dede', 'dedeganteng@gmail.com', '$2b$10$QMJNExp9UA2TJmruinVVu.RE/.qlBwsmDV6ciS75DpWN.z0PXwEBK', 'mahasiswa'),
('101002', 'dani nurwahid', 'dani@gmail.com', '$2b$10$QMJNExp9UA2TJmruinVVu.RE/.qlBwsmDV6ciS75DpWN.z0PXwEBK', 'mahasiswa'),
('101003', 'diki', 'diki@gmail.com', '$2b$10$QMJNExp9UA2TJmruinVVu.RE/.qlBwsmDV6ciS75DpWN.z0PXwEBK', 'mahasiswa'),
('101004', 'verdi nugroho', 'verdi@gmail.com', '$2b$10$QMJNExp9UA2TJmruinVVu.RE/.qlBwsmDV6ciS75DpWN.z0PXwEBK', 'mahasiswa'),
('101005', 'gadha valla', 'gadha@gmail.com', '$2b$10$QMJNExp9UA2TJmruinVVu.RE/.qlBwsmDV6ciS75DpWN.z0PXwEBK', 'mahasiswa');

INSERT INTO mata_kuliah (nama, id_dosen) VALUES 
('Computer Vision', 2),
('Decision Support System', 2),
('Manajemen project TI', 2),
('Pemrograman Web Lanjut', 2),
('Hukum dan Kebijakn TI', 2),
('Sistem Media Interaktif', 2),
('Bahasa Indonesia', 2);
