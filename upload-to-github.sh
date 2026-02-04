#!/bin/bash

echo "========================================"
echo " Upload gupikkk ke GitHub"
echo "========================================"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "ERROR: Git tidak terinstall!"
    echo "Install dengan: brew install git (Mac) atau sudo apt install git (Linux)"
    exit 1
fi

echo "[1/5] Initialize Git..."
git init

echo ""
echo "[2/5] Menambahkan semua file..."
git add .

echo ""
echo "[3/5] Commit file..."
git commit -m "Initial commit: gupikkk Inventory Management System"

echo ""
echo "[4/5] Menambahkan remote repository..."
git remote add origin https://github.com/thohahaha/gupikk.git 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Remote sudah ada, mengupdate..."
    git remote set-url origin https://github.com/thohahaha/gupikk.git
fi

echo ""
echo "[5/5] Push ke GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "========================================"
echo " Selesai!"
echo "========================================"
echo ""
echo "Cek hasil di: https://github.com/thohahaha/gupikk"
echo ""
