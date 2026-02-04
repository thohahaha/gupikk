@echo off
echo ========================================
echo  Cek Akun GitHub yang Terlogin
echo ========================================
echo.

echo [1] Username Git:
git config --global user.name
echo.

echo [2] Email Git:
git config --global user.email
echo.

echo [3] Semua Konfigurasi Git:
git config --list
echo.

echo [4] Remote Repository (jika ada):
git remote -v 2>nul
if errorlevel 1 (
    echo Belum ada remote repository yang terhubung
)
echo.

echo ========================================
echo  Informasi Tambahan
echo ========================================
echo.
echo Untuk cek di browser:
echo 1. Buka: https://github.com
echo 2. Lihat username di pojok kanan atas
echo.
echo Untuk cek credential Windows:
echo 1. Control Panel ^> Credential Manager
echo 2. Windows Credentials
echo 3. Cari: git:https://github.com
echo.
pause
