# 🚀 Cara Upload ke GitHub

## Langkah-langkah Upload ke Repository GitHub

### **Prasyarat:**
- Git sudah terinstall di komputer Anda
- Akun GitHub sudah dibuat
- Repository sudah dibuat di https://github.com/thohahaha/gupikk

---

## 📋 **Metode 1: Via Command Line (Recommended)**

### **Langkah 1: Buka Terminal/Command Prompt**

- **Windows:** Tekan `Win + R`, ketik `cmd`, Enter
- **Mac/Linux:** Buka Terminal

### **Langkah 2: Navigate ke Folder Project**

```bash
cd "D:\tugas pak wahyudi"
```

### **Langkah 3: Initialize Git (Jika Belum)**

```bash
git init
```

### **Langkah 4: Tambahkan Semua File**

```bash
git add .
```

### **Langkah 5: Commit File**

```bash
git commit -m "Initial commit: gupikkk Inventory Management System"
```

### **Langkah 6: Tambahkan Remote Repository**

```bash
git remote add origin https://github.com/thohahaha/gupikk.git
```

### **Langkah 7: Push ke GitHub**

```bash
git branch -M main
git push -u origin main
```

**Catatan:** Jika diminta username dan password:
- Username: `thohahaha`
- Password: Gunakan **Personal Access Token** (bukan password GitHub)
  - Cara buat token: GitHub → Settings → Developer settings → Personal access tokens → Generate new token

---

## 📋 **Metode 2: Via GitHub Desktop (Lebih Mudah)**

### **Langkah 1: Download GitHub Desktop**
- Download dari: https://desktop.github.com/
- Install aplikasinya

### **Langkah 2: Login ke GitHub**
- Buka GitHub Desktop
- Login dengan akun GitHub Anda

### **Langkah 3: Add Repository**
1. Klik **File** → **Add Local Repository**
2. Pilih folder `D:\tugas pak wahyudi`
3. Klik **Add**

### **Langkah 4: Commit & Push**
1. Di bagian bawah, ketik commit message: `Initial commit: gupikkk Inventory Management System`
2. Klik **Commit to main**
3. Klik **Publish repository** atau **Push origin**
4. Pilih repository: `thohahaha/gupikk`
5. Klik **Publish**

---

## 📋 **Metode 3: Via VS Code (Jika Pakai VS Code)**

### **Langkah 1: Buka Folder di VS Code**
- File → Open Folder → Pilih `D:\tugas pak wahyudi`

### **Langkah 2: Initialize Git**
1. Tekan `Ctrl + Shift + P` (atau `Cmd + Shift + P` di Mac)
2. Ketik: `Git: Initialize Repository`
3. Enter

### **Langkah 3: Stage All Files**
1. Klik icon **Source Control** di sidebar kiri (atau `Ctrl + Shift + G`)
2. Klik **+** di samping "Changes" untuk stage all files

### **Langkah 4: Commit**
1. Ketik commit message: `Initial commit: gupikkk Inventory Management System`
2. Tekan `Ctrl + Enter` (atau klik icon checkmark)

### **Langkah 5: Push**
1. Klik **...** (three dots) di Source Control
2. Pilih **Push** → **Push to...**
3. Masukkan URL: `https://github.com/thohahaha/gupikk.git`
4. Enter

---

## ⚠️ **Troubleshooting**

### **Error: "Repository not found"**
- Pastikan repository sudah dibuat di GitHub
- Pastikan URL repository benar: `https://github.com/thohahaha/gupikk.git`
- Pastikan Anda punya akses ke repository tersebut

### **Error: "Authentication failed"**
- Gunakan **Personal Access Token** sebagai password
- Jangan pakai password GitHub biasa
- Cara buat token:
  1. GitHub → Settings → Developer settings
  2. Personal access tokens → Tokens (classic)
  3. Generate new token (classic)
  4. Beri nama: `gupikk-upload`
  5. Centang scope: `repo` (full control)
  6. Generate token
  7. **Copy token** (hanya muncul sekali!)
  8. Gunakan token ini sebagai password saat push

### **Error: "Updates were rejected"**
```bash
# Force push (hati-hati, ini akan overwrite semua file di GitHub)
git push -u origin main --force
```

### **File .gitignore Tidak Berfungsi**
- Pastikan file `.gitignore` ada di root folder
- Pastikan file yang ingin di-ignore belum pernah di-commit sebelumnya
- Jika sudah ter-commit, hapus dari git:
```bash
git rm --cached nama-file.txt
git commit -m "Remove file from git"
```

---

## ✅ **Cek Apakah Upload Berhasil**

1. Buka browser
2. Kunjungi: https://github.com/thohahaha/gupikk
3. Pastikan semua file sudah muncul:
   - ✅ index.html
   - ✅ login.html
   - ✅ kasir.html
   - ✅ gudang.html
   - ✅ setup.html
   - ✅ css/style.css
   - ✅ js/ (semua file .js)
   - ✅ README.md
   - ✅ .gitignore

---

## 📝 **Update File di GitHub (Setelah Upload Pertama)**

Jika ada perubahan file, gunakan perintah ini:

```bash
# 1. Tambahkan file yang diubah
git add .

# 2. Commit perubahan
git commit -m "Update: deskripsi perubahan"

# 3. Push ke GitHub
git push origin main
```

---

## 🔐 **Keamanan: Jangan Upload File Ini!**

File-file berikut **TIDAK** akan di-upload karena ada di `.gitignore`:
- ❌ `node_modules/` (jika ada)
- ❌ `.env` (file environment variables)
- ❌ File log
- ❌ File temporary

**PENTING:** Jangan upload file `js/firebase-config.js` jika berisi API key yang sensitif!
- Untuk production, gunakan environment variables
- Atau buat file `firebase-config.example.js` sebagai template

---

## 🎉 **Selesai!**

Setelah upload berhasil, repository Anda akan terlihat di:
**https://github.com/thohahaha/gupikk**

Selamat! 🚀
