# 🚀 Panduan Deploy ke Firebase Hosting

## Prerequisites

1. **Node.js** sudah terinstall (untuk npm)
2. **Firebase CLI** sudah terinstall
3. **Firebase Project** sudah dibuat di Firebase Console

---

## Langkah 1: Install Firebase CLI

Jika belum terinstall, jalankan:

```bash
npm install -g firebase-tools
```

---

## Langkah 2: Login ke Firebase

```bash
firebase login
```

Ini akan membuka browser untuk login dengan akun Google Anda.

---

## Langkah 3: Setup Project ID

1. Buka file `.firebaserc`
2. Ganti `YOUR_PROJECT_ID` dengan Project ID Firebase Anda
   - Project ID bisa dilihat di Firebase Console > Project Settings
   - Contoh: `gupikk-apps`

---

## Langkah 4: Setup Firebase Config

1. Buka file `js/firebase-config.js`
2. Isi dengan credential Firebase Anda:
   - Buka Firebase Console
   - Project Settings > Your apps > Web app
   - Copy config dan paste ke `firebase-config.js`

---

## Langkah 5: Initialize Firebase Hosting (Opsional)

Jika belum pernah initialize, jalankan:

```bash
firebase init hosting
```

Pilih:
- **What do you want to use as your public directory?** → `.` (titik)
- **Configure as a single-page app?** → `No` (karena kita punya multiple HTML files)
- **Set up automatic builds and deploys with GitHub?** → `No`

**ATAU** langsung deploy karena file `firebase.json` sudah dibuat.

---

## Langkah 6: Deploy

```bash
firebase deploy --only hosting
```

Tunggu sampai selesai, Anda akan mendapat URL seperti:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/YOUR_PROJECT_ID/overview
Hosting URL: https://YOUR_PROJECT_ID.web.app
```

---

## Update Deployment

Setelah melakukan perubahan, deploy ulang dengan:

```bash
firebase deploy --only hosting
```

---

## Troubleshooting

### Error: "Firebase project not found"
- Pastikan Project ID di `.firebaserc` sudah benar
- Pastikan project sudah dibuat di Firebase Console

### Error: "Permission denied"
- Pastikan sudah login: `firebase login`
- Pastikan akun yang login memiliki akses ke project

### Error: "Cannot find module"
- Install Firebase CLI: `npm install -g firebase-tools`

---

## Catatan Penting

⚠️ **Jangan commit `js/firebase-config.js` ke Git!**
- File ini sudah ada di `.gitignore`
- Setiap developer harus membuat file sendiri dengan credential mereka

✅ **File yang akan di-deploy:**
- Semua file HTML, CSS, JS (kecuali yang di ignore)
- File `firebase-config.js` akan ikut ter-deploy (karena dibutuhkan aplikasi)
