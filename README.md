# 📦 gupikkk - Inventory Management System

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/thohahaha/gupikk)
[![License](https://img.shields.io/badge/License-Free-green)](LICENSE)

Sistem manajemen inventory dengan 3 role berbeda: **Superadmin**, **Petugas Gudang**, dan **Kasir**.

**Repository:** https://github.com/thohahaha/gupikk

## 🎯 Fitur Utama

### 👥 3 Role Pengguna

1. **Superadmin** (`index.html`)
   - Dashboard lengkap dengan statistik
   - Kelola produk (tambah, edit, hapus)
   - Kelola kategori (tambah, edit, hapus)
   - Lihat produk terbaru dan stok rendah
   - Akses penuh ke semua fitur

2. **Petugas Gudang** (`gudang.html`)
   - Update stok produk (tambah, kurangi, set langsung)
   - Kelola produk (tambah, edit - tidak bisa hapus)
   - Kelola kategori (tambah, edit - tidak bisa hapus)
   - Lihat statistik stok
   - History perubahan stok

3. **Kasir** (`kasir.html`)
   - Point of Sale (POS) untuk transaksi
   - Tambah produk ke keranjang
   - Proses pembayaran
   - Lihat riwayat transaksi hari ini
   - Cari produk berdasarkan nama/kategori

## 📥 Cara Clone dari GitHub

```bash
# Clone repository
git clone https://github.com/thohahaha/gupikk.git

# Masuk ke folder
cd gupikk

# Buka di browser
# Buka file setup.html untuk setup pertama kali
```

## 🚀 Cara Setup (Pertama Kali)

### Metode 1: Menggunakan Halaman Setup (Recommended)

1. Buka file `setup.html` di browser
2. Klik tombol **"Jalankan Semua Setup"**
3. Tunggu proses selesai
4. Login di `login.html`

### Metode 2: Manual via Console

1. Buka `index.html` di browser
2. Buka **Console** browser (F12)
3. Jalankan perintah berikut:

```javascript
// Langkah 1: Buat user
seedUsers()

// Langkah 2: Tambah data dummy
seedData()
```

4. Buka `login.html` untuk login

## 👤 Akun Demo

Gunakan salah satu akun berikut untuk login:

| Role | Email | Password | Akses |
|------|-------|----------|-------|
| **Superadmin** | admin@gupikkk.com | admin123 | Akses penuh semua fitur |
| **Petugas Gudang** | gudang@gupikkk.com | gudang123 | Kelola stok & produk |
| **Kasir** | kasir@gupikkk.com | kasir123 | Transaksi penjualan (POS) |

## 📁 Struktur File

```
tugas-pak-wahyudi/
├── index.html              # Halaman Superadmin (Dashboard)
├── login.html              # Halaman Login
├── kasir.html              # Halaman Kasir (POS)
├── gudang.html             # Halaman Petugas Gudang
├── setup.html              # Halaman Setup Awal
├── css/
│   └── style.css           # Stylesheet utama
├── js/
│   ├── firebase-config.js  # Konfigurasi Firebase
│   ├── auth.js             # Autentikasi & Authorization
│   ├── app.js              # Logic Superadmin
│   ├── kasir-app.js        # Logic Kasir (POS)
│   ├── gudang-app.js       # Logic Petugas Gudang
│   ├── seed-users.js       # Script buat user dummy
│   └── seed-data.js        # Script buat data dummy
└── README.md               # Dokumentasi ini
```

## 🔥 Firebase Configuration

Sistem ini menggunakan Firebase untuk:
- **Authentication** - Login/logout user
- **Firestore** - Database untuk produk, kategori, transaksi, user

Konfigurasi Firebase ada di `js/firebase-config.js`.

## 🎨 Fitur Tambahan

### Dark Mode
- Toggle dark mode tersedia di semua halaman
- Preferensi tersimpan di localStorage

### Responsive Design
- Desain responsive untuk mobile, tablet, dan desktop
- Mobile menu untuk navigasi di perangkat kecil

### Real-time Updates
- Semua data ter-update secara real-time
- Perubahan langsung terlihat tanpa refresh

### Toast Notifications
- Notifikasi sukses/error yang informatif
- Auto-dismiss setelah beberapa detik

## 📊 Database Collections

### `users`
```javascript
{
  name: "Administrator",
  email: "admin@gupikkk.com",
  role: "superadmin", // superadmin | gudang | kasir
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `categories`
```javascript
{
  name: "Elektronik",
  description: "Peralatan elektronik",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `products`
```javascript
{
  name: "Laptop ASUS ROG",
  categoryId: "category_id",
  sku: "GPK-ABC123",
  price: 15000000,
  stock: 25,
  description: "Deskripsi produk",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `transactions`
```javascript
{
  items: [{
    productId: "product_id",
    name: "Laptop ASUS ROG",
    price: 15000000,
    quantity: 1,
    subtotal: 15000000
  }],
  total: 15000000,
  cashier: {
    uid: "user_id",
    name: "Kasir",
    email: "kasir@gupikkk.com"
  },
  createdAt: Timestamp
}
```

### `stock_history`
```javascript
{
  productId: "product_id",
  productName: "Laptop ASUS ROG",
  type: "add", // add | subtract | set
  amount: 10,
  oldStock: 25,
  newStock: 35,
  note: "Restock bulanan",
  user: {
    uid: "user_id",
    name: "Petugas Gudang",
    email: "gudang@gupikkk.com"
  },
  createdAt: Timestamp
}
```

## 🔐 Security Rules (Firebase)

Berikut adalah security rules yang disarankan untuk Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function untuk cek role
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    
    // Users collection - hanya bisa baca data sendiri
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // Hanya bisa dibuat via server
    }
    
    // Categories - semua yang login bisa baca
    match /categories/{categoryId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && 
        (getUserRole() == 'superadmin' || getUserRole() == 'gudang');
      allow delete: if request.auth != null && getUserRole() == 'superadmin';
    }
    
    // Products - semua yang login bisa baca
    match /products/{productId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && 
        (getUserRole() == 'superadmin' || getUserRole() == 'gudang');
      allow delete: if request.auth != null && getUserRole() == 'superadmin';
    }
    
    // Transactions - kasir dan superadmin bisa create
    match /transactions/{transactionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
        (getUserRole() == 'kasir' || getUserRole() == 'superadmin');
      allow update, delete: if request.auth != null && getUserRole() == 'superadmin';
    }
    
    // Stock History - gudang dan superadmin bisa create
    match /stock_history/{historyId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
        (getUserRole() == 'gudang' || getUserRole() == 'superadmin');
      allow update, delete: if false; // History tidak bisa diubah
    }
  }
}
```

## 🛠️ Development

### Prerequisites
- Browser modern (Chrome, Firefox, Edge, Safari)
- Koneksi internet (untuk Firebase)
- Firebase project dengan Authentication & Firestore enabled

### Local Development
1. Clone/download repository
2. Update `js/firebase-config.js` dengan credentials Firebase Anda
3. Buka `setup.html` untuk setup awal
4. Buka `login.html` untuk mulai menggunakan

## 📝 Notes

- Script `seedUsers()` hanya bisa dijalankan **SEKALI**. Jika user sudah ada, akan muncul error.
- Untuk reset user, hapus manual di Firebase Console > Authentication > Users
- Data dummy mencakup 5 kategori dan 25 produk dengan stok bervariasi
- Sistem menggunakan localStorage untuk menyimpan preferensi tema dan session user

## 🆘 Troubleshooting

### "Firebase not defined"
- Pastikan koneksi internet aktif
- Cek apakah Firebase SDK ter-load dengan benar

### "Permission denied"
- Setup Firestore security rules sesuai dokumentasi di atas
- Atau set ke test mode sementara (not recommended for production)

### "Email already in use"
- User sudah pernah dibuat sebelumnya
- Skip `seedUsers()` dan langsung login dengan akun yang ada

### Data tidak muncul
- Pastikan sudah menjalankan `seedData()`
- Cek di Firebase Console > Firestore apakah data sudah masuk

## 👨‍💻 Author

Project ini dibuat untuk tugas Pak Wahyudi.

## 📄 License

Free to use for educational purposes.
