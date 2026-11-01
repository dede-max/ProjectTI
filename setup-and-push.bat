@echo off
echo ========================================
echo  SETUP: Install Dependencies
echo ========================================

echo.
echo [1/3] Install backend dependencies (pg)...
cd /d "c:\Users\yogya 370\Desktop\Sistem Absen Berbasis QR\backend"
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install backend gagal!
    pause
    exit /b 1
)
echo Backend dependencies OK!

echo.
echo [2/3] Git add semua perubahan...
cd /d "c:\Users\yogya 370\Desktop\Sistem Absen Berbasis QR"
git add .
if %errorlevel% neq 0 (
    echo ERROR: git add gagal!
    pause
    exit /b 1
)

echo.
echo [3/3] Git commit...
git commit -m "feat: migrasi ke PostgreSQL (Supabase) + siap deploy Vercel & Railway"
if %errorlevel% neq 0 (
    echo INFO: Tidak ada perubahan untuk di-commit, atau commit gagal.
)

echo.
echo ========================================
echo  Git push ke GitHub...
echo ========================================
git push
if %errorlevel% neq 0 (
    echo.
    echo Jika belum ada remote, jalankan dulu:
    echo   git remote add origin https://github.com/USERNAME/NAMA-REPO.git
    echo   git push -u origin main
)

echo.
echo ========================================
echo  SELESAI!
echo ========================================
echo.
echo Langkah selanjutnya:
echo  1. Buka Supabase - jalankan database.postgresql.sql di SQL Editor
echo  2. Deploy backend ke Railway - isi env vars
echo  3. Deploy frontend ke Vercel - isi NEXT_PUBLIC_API_URL
echo.
pause

