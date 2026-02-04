@echo off
echo ========================================
echo  Upload gupikkk ke GitHub
echo ========================================
echo.

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git tidak terinstall!
    echo Download dari: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo [1/5] Initialize Git...
git init

echo.
echo [2/5] Menambahkan semua file...
git add .

echo.
echo [3/5] Commit file...
git commit -m "Initial commit: gupikkk Inventory Management System"

echo.
echo [4/5] Menambahkan remote repository...
git remote add origin https://github.com/thohahaha/gupikk.git 2>nul
if errorlevel 1 (
    echo Remote sudah ada, mengupdate...
    git remote set-url origin https://github.com/thohahaha/gupikk.git
)

echo.
echo [5/5] Push ke GitHub...
git branch -M main
git push -u origin main

echo.
echo ========================================
echo  Selesai!
echo ========================================
echo.
echo Cek hasil di: https://github.com/thohahaha/gupikk
echo.
pause
