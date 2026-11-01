# Sistem Absen QR Cepat (Ephemeral)

Aplikasi *full-stack* buat absen kampus yang anti-ribet. Pakai sistem QR code yang bakal hangus dalam waktu singkat (biar nggak bisa di-screenshot terus dikirim ke grup WA).

## Fitur Kece

* **QR Sekali Pakai**: Kode QR-nya punya umur singkat, bisa diatur mau berapa detik aktifnya.
* **Anti-Joki Absen**: Dilengkapi tanda tangan HMAC, *nonce* sekali pakai, serta cek IP & perangkat.
* **Multi Role**:
    * **Dosen**: Bikin sesi, tampilin QR dinamis, pantau siapa aja yang masuk secara *real-time*.
    * **Mahasiswa**: Tinggal buka HP, scan langsung dari browser, beres.
    * **Admin**: Buat cek-cek log audit kalau ada masalah.

## Stack Teknologi

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 16, Tailwind CSS |
| Backend | Express.js, Socket.IO |
| Database | PostgreSQL (Supabase) |
| Deploy Frontend | Vercel |
| Deploy Backend | Railway |

---

## 🚀 Deploy Production

### Arsitektur

```
Browser → Vercel (Next.js) → Railway (Express.js) → Supabase (PostgreSQL)
```

### 1. Database — Supabase

1. Buat project baru di [supabase.com](https://supabase.com)
2. Buka **SQL Editor**, paste dan jalankan isi file `database.postgresql.sql`
3. Catat **Connection String** dari Settings → Database

### 2. Backend — Railway

1. Buka [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Pilih repo ini, set **Root Directory** ke `backend`
3. Tambahkan **Environment Variables**:

```env
DATABASE_URL=postgresql://postgres:PASSWORD@db.REF.supabase.co:5432/postgres
JWT_SECRET=secret_yang_kuat
HMAC_SECRET=secret_yang_kuat
QR_EXPIRY_SEC=60
FRONTEND_URL=https://nama-proyekmu.vercel.app
NODE_ENV=production
```

4. Catat URL backend Railway (contoh: `https://backend-production-xxxx.up.railway.app`)

### 3. Frontend — Vercel

1. Buka [vercel.com](https://vercel.com) → Add New Project → Import dari GitHub
2. Set **Root Directory** ke `frontend`
3. Tambahkan **Environment Variable**:

```env
NEXT_PUBLIC_API_URL=https://backend-production-xxxx.up.railway.app/api
```

4. Deploy!

---

## 💻 Development Lokal

### Persiapan

**1. Database Lokal (opsional — bisa pakai Supabase langsung)**

Kalau mau pakai lokal, install PostgreSQL lalu jalankan `database.postgresql.sql`.

**2. Setup Backend (`backend/.env`)**

```env
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/qr_attendance

JWT_SECRET=rahasia_jwt_sangat_aman
HMAC_SECRET=rahasia_hmac_sangat_aman

QR_EXPIRY_SEC=60
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

**3. Setup Frontend (`frontend/.env.local`)**

```env
# Kosongkan untuk pakai proxy lokal (development)
# NEXT_PUBLIC_API_URL=
```

### Jalankan

Buka dua terminal:

**Terminal 1 — Backend:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Buka browser ke **http://localhost:3000**

---

## 📱 Test Pakai HP (Scan Beneran)

Laptop dan HP harus konek ke Wi-Fi yang sama.

1. Cek IP laptop: buka CMD → `ipconfig` → catat **IPv4 Address** (misal `192.168.1.15`)
2. Edit `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://192.168.1.15:5000/api
   ```
3. Jalankan frontend dengan:
   ```bash
   cd frontend && npm run dev:network
   ```
4. Akses dari HP: `http://192.168.1.15:3000`

---

## Akun Demo

Password semua akun: `password123`

| Peran | Email | NIM |
|---|---|---|
| Admin | admin@kampus.edu | — |
| Dosen | Buntoro@gmail.com | — |
| Mahasiswa | dedeganteng@gmail.com | 101001 |

---

## Struktur Proyek

```
├── backend/                 # Express.js API
│   ├── src/
│   │   ├── controllers/     # Logic handler
│   │   ├── middleware/      # Auth middleware
│   │   ├── routes/          # Route definitions
│   │   ├── utils/           # Crypto utils
│   │   └── db.js            # PostgreSQL pool (pg)
│   ├── server.js            # Entry point
│   ├── railway.json         # Railway config
│   └── .env.example         # Template env
│
├── frontend/                # Next.js App
│   ├── src/app/             # App Router pages
│   ├── next.config.mjs      # Next config
│   ├── vercel.json          # Vercel config
│   └── .env.example         # Template env
│
├── database.postgresql.sql  # Schema PostgreSQL (Supabase)
└── .gitignore
```
