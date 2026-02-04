// ==========================================
// Seed Users - Create Dummy Users
// Script untuk membuat 3 user dengan role berbeda
// ==========================================

(function () {
  "use strict";

  // ---- Data User Dummy ----
  // 3 user dengan role berbeda untuk testing
  const dummyUsers = [
    {
      email: "admin@gupikkk.com",
      password: "admin123",
      name: "Administrator",
      role: "superadmin",
      description: "Akses penuh ke semua fitur sistem"
    },
    {
      email: "gudang@gupikkk.com",
      password: "gudang123",
      name: "Petugas Gudang",
      role: "gudang",
      description: "Kelola stok, produk, dan kategori"
    },
    {
      email: "kasir@gupikkk.com",
      password: "kasir123",
      name: "Kasir",
      role: "kasir",
      description: "Point of Sale - Transaksi penjualan"
    }
  ];

  // ---- Fungsi untuk Membuat User ----
  async function createUserAccount(userData) {
    try {
      // Buat user di Firebase Authentication
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(
        userData.email,
        userData.password
      );

      const user = userCredential.user;

      // Update display name
      await user.updateProfile({
        displayName: userData.name
      });

      // Simpan data user ke Firestore
      await firebase.firestore().collection("users").doc(user.uid).set({
        name: userData.name,
        email: userData.email,
        role: userData.role,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      console.log(`✅ User ${userData.role} (${userData.email}) berhasil dibuat`);
      return { success: true, user: user };
    } catch (error) {
      // Handle error jika user sudah ada
      if (error.code === "auth/email-already-in-use") {
        console.log(`⚠️ User ${userData.email} sudah ada`);
        return { success: false, error: "User sudah ada" };
      } else {
        console.error(`❌ Error membuat user ${userData.email}:`, error);
        return { success: false, error: error.message };
      }
    }
  }

  // ---- Fungsi Utama Seed Users ----
  async function seedUsers() {
    console.log("👥 Memulai proses seed users...");
    console.log("⚠️ PENTING: Script ini hanya bisa dijalankan SEKALI");
    console.log("⚠️ Jika user sudah ada, akan muncul pesan error\n");

    // Konfirmasi
    if (!confirm(
      "Apakah Anda yakin ingin membuat 3 user dummy?\n\n" +
      "User yang akan dibuat:\n" +
      "1. admin@gupikkk.com (password: admin123)\n" +
      "2. gudang@gupikkk.com (password: gudang123)\n" +
      "3. kasir@gupikkk.com (password: kasir123)\n\n" +
      "Klik OK untuk melanjutkan."
    )) {
      console.log("❌ Seed users dibatalkan");
      return;
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Buat setiap user
    for (const userData of dummyUsers) {
      const result = await createUserAccount(userData);
      results.push({ userData, result });
      
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }

      // Logout setelah setiap create (agar tidak tersimpan session)
      await firebase.auth().signOut();
    }

    // Tampilkan hasil
    console.log("\n📊 Hasil Seed Users:");
    console.log(`✅ Berhasil dibuat: ${successCount} user`);
    console.log(`❌ Gagal/Sudah ada: ${errorCount} user`);
    
    console.log("\n📋 Detail User:");
    console.log("┌────────────┬─────────────────────┬──────────────┬─────────────────────────────────────┐");
    console.log("│ Role       │ Email               │ Password     │ Deskripsi                           │");
    console.log("├────────────┼─────────────────────┼──────────────┼─────────────────────────────────────┤");
    
    dummyUsers.forEach(user => {
      const role = user.role.padEnd(10);
      const email = user.email.padEnd(19);
      const pass = user.password.padEnd(12);
      const desc = user.description.padEnd(35);
      console.log(`│ ${role} │ ${email} │ ${pass} │ ${desc} │`);
    });
    
    console.log("└────────────┴─────────────────────┴──────────────┴─────────────────────────────────────┘");

    // Alert hasil
    alert(
      `Seed Users Selesai!\n\n` +
      `✅ Berhasil: ${successCount} user\n` +
      `❌ Gagal: ${errorCount} user\n\n` +
      `Silakan buka login.html untuk login dengan salah satu user.`
    );

    console.log("\n✨ Seed users selesai!");
    console.log("💡 Buka login.html untuk login dengan salah satu user di atas");
  }

  // ---- Fungsi untuk Hapus Semua User (Admin Only) ----
  // Catatan: Tidak bisa hapus user via client-side
  // Harus menggunakan Firebase Admin SDK atau console Firebase
  async function deleteAllUsers() {
    console.log("⚠️ PERINGATAN:");
    console.log("Penghapusan user harus dilakukan melalui Firebase Console");
    console.log("Script client-side tidak bisa menghapus user lain");
    console.log("\nLangkah-langkah:");
    console.log("1. Buka Firebase Console: https://console.firebase.google.com");
    console.log("2. Pilih project Anda");
    console.log("3. Buka Authentication > Users");
    console.log("4. Hapus user satu per satu");
    
    alert(
      "⚠️ Tidak bisa hapus user via script\n\n" +
      "Silakan hapus user manual di Firebase Console:\n" +
      "1. Buka console.firebase.google.com\n" +
      "2. Pilih Authentication > Users\n" +
      "3. Hapus user satu per satu"
    );
  }

  // ---- Export Fungsi ke Window ----
  window.seedUsers = seedUsers;
  window.deleteAllUsers = deleteAllUsers;

  console.log("👥 Seed users script loaded!");
  console.log("💡 Gunakan seedUsers() untuk membuat 3 user dummy");
  console.log("💡 User yang akan dibuat:");
  console.log("   - admin@gupikkk.com / admin123 (Superadmin)");
  console.log("   - gudang@gupikkk.com / gudang123 (Petugas Gudang)");
  console.log("   - kasir@gupikkk.com / kasir123 (Kasir)");
})();
