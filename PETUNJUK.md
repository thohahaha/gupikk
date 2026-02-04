# 📖 Petunjuk Penggunaan gupikkk

## 🚀 Cara Setup (Pertama Kali)

### Cara Paling Mudah:

1. **Buka file `setup.html` di browser**
2. **Klik tombol "Jalankan Semua Setup"**
3. **Tunggu sampai selesai**
4. **Buka `login.html` untuk login**

Selesai! Sistem siap digunakan.

---

## 👤 Login

Buka file `login.html` dan pilih salah satu akun:

### 1. **Superadmin** (Akses Penuh)
- **Email:** admin@gupikkk.com
- **Password:** admin123
- **Bisa:** Lihat dashboard, kelola produk & kategori, hapus data

### 2. **Petugas Gudang** (Kelola Stok)
- **Email:** gudang@gupikkk.com
- **Password:** gudang123
- **Bisa:** Update stok, tambah/edit produk & kategori (tidak bisa hapus)

### 3. **Kasir** (Transaksi)
- **Email:** kasir@gupikkk.com
- **Password:** kasir123
- **Bisa:** Jual produk (POS), lihat riwayat transaksi

---

## 📱 Fitur di Setiap Role

### Superadmin (`index.html`)
```
✅ Dashboard dengan statistik lengkap
✅ Kelola produk (tambah, edit, hapus)
✅ Kelola kategori (tambah, edit, hapus)
✅ Lihat produk terbaru
✅ Lihat peringatan stok rendah
✅ Tambah data dummy (tombol orange)
```

### Petugas Gudang (`gudang.html`)
```
✅ Update stok produk (tambah/kurangi/set)
✅ Tambah & edit produk
✅ Tambah & edit kategori
✅ Lihat statistik stok
✅ Riwayat perubahan stok tersimpan
```

### Kasir (`kasir.html`)
```
✅ Sistem Point of Sale (POS)
✅ Tambah produk ke keranjang
✅ Proses pembayaran
✅ Cari produk
✅ Filter by kategori
✅ Lihat riwayat transaksi hari ini
```

---

## 🎨 Fitur Tambahan

### Dark Mode
Klik tombol bulan/matahari di pojok kanan atas untuk toggle dark mode.

### Responsive
Aplikasi bisa digunakan di HP, tablet, dan komputer.

### Auto Refresh
Data ter-update otomatis tanpa perlu refresh halaman.

---

## ❓ Pertanyaan Umum

### Q: Bagaimana cara menambah produk?
**A:** Login sebagai Superadmin atau Petugas Gudang → Klik menu "Produk" → Klik tombol "Tambah Produk"

### Q: Bagaimana cara update stok?
**A:** Login sebagai Petugas Gudang → Menu "Kelola Stok" → Klik tombol "Update Stok" pada produk yang ingin diupdate

### Q: Bagaimana cara melakukan transaksi?
**A:** Login sebagai Kasir → Klik produk yang ingin dijual → Produk masuk keranjang → Klik "Proses Pembayaran"

### Q: Data dummy tidak muncul?
**A:** Pastikan sudah:
1. Membuat user dengan `seedUsers()` atau via `setup.html`
2. Menambah data dengan `seedData()` atau klik tombol orange di dashboard

### Q: Lupa password?
**A:** Gunakan password default:
- admin123 (Superadmin)
- gudang123 (Petugas Gudang)
- kasir123 (Kasir)

### Q: Bagaimana cara logout?
**A:** Klik tombol "Keluar" di bagian bawah sidebar

---

## 🔧 Tips & Trik

### 1. Cepat Login dengan Demo Account
Di halaman login, langsung klik salah satu tombol demo account (tidak perlu ketik email/password)

### 2. Pencarian Cepat
Gunakan search box di pojok kanan atas untuk cari produk dengan cepat

### 3. Filter Produk
Gunakan dropdown filter untuk menyaring produk berdasarkan kategori atau status stok

### 4. Keyboard Shortcuts
- `Escape` - Tutup modal yang sedang terbuka
- Enter di search box - Auto focus dan cari

---

## 📊 Informasi Data Dummy

Setelah menjalankan setup, sistem akan memiliki:

- **5 Kategori:**
  - Elektronik
  - Pakaian
  - Makanan & Minuman
  - Alat Tulis
  - Olahraga

- **25 Produk** dengan variasi:
  - Harga: Rp 2.500 - Rp 15.000.000
  - Stok: 0 - 600 unit
  - Beberapa produk dengan stok rendah (untuk testing fitur peringatan)
  - Beberapa produk habis stok (untuk testing fitur filter)

---

## 🆘 Butuh Bantuan?

Jika mengalami masalah:

1. **Refresh halaman** (Ctrl + R atau F5)
2. **Clear cache browser** (Ctrl + Shift + Delete)
3. **Cek console** browser (F12) untuk melihat error
4. **Baca file README.md** untuk dokumentasi lengkap

---

## 📝 Catatan Penting

⚠️ **Script `seedUsers()` hanya bisa dijalankan SEKALI**
- Jika error "email already in use", berarti user sudah ada
- Skip step ini dan langsung login

⚠️ **Jangan hapus Firebase config**
- File `js/firebase-config.js` berisi konfigurasi koneksi ke database
- Jika dihapus, aplikasi tidak akan berfungsi

⚠️ **Logout setelah selesai**
- Jangan lupa logout jika menggunakan komputer bersama
- Data tersimpan di localStorage browser

---

Selamat menggunakan gupikkk! 🎉
