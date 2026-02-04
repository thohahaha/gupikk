// ==========================================
// Seed Data - Data Dummy untuk Testing
// ==========================================
// File ini berisi fungsi untuk menambahkan data dummy
// ke database Firebase untuk keperluan testing dan demo

(function () {
  "use strict";

  // ---- Data Dummy Kategori ----
  // Kategori-kategori produk yang akan ditambahkan
  const dummyCategories = [
    {
      name: "Elektronik",
      description: "Peralatan elektronik dan gadget",
    },
    {
      name: "Pakaian",
      description: "Pakaian pria, wanita, dan anak-anak",
    },
    {
      name: "Makanan & Minuman",
      description: "Produk makanan dan minuman",
    },
    {
      name: "Alat Tulis",
      description: "Perlengkapan kantor dan sekolah",
    },
    {
      name: "Olahraga",
      description: "Peralatan dan perlengkapan olahraga",
    },
  ];

  // ---- Data Dummy Produk ----
  // Produk-produk yang akan ditambahkan
  // categoryIndex mengacu pada index array dummyCategories
  const dummyProducts = [
    // Elektronik
    {
      name: "Laptop ASUS ROG",
      categoryIndex: 0,
      price: 15000000,
      stock: 25,
      description: "Laptop gaming dengan processor Intel Core i7 dan RTX 3060",
    },
    {
      name: "Mouse Wireless Logitech",
      categoryIndex: 0,
      price: 250000,
      stock: 150,
      description: "Mouse wireless dengan koneksi bluetooth dan USB receiver",
    },
    {
      name: "Keyboard Mechanical RGB",
      categoryIndex: 0,
      price: 850000,
      stock: 45,
      description: "Keyboard mechanical dengan lampu RGB dan switch blue",
    },
    {
      name: "Monitor LED 24 inch",
      categoryIndex: 0,
      price: 2500000,
      stock: 8,
      description: "Monitor LED Full HD dengan refresh rate 75Hz",
    },
    {
      name: "Headset Gaming",
      categoryIndex: 0,
      price: 450000,
      stock: 0,
      description: "Headset gaming dengan surround sound 7.1",
    },

    // Pakaian
    {
      name: "Kaos Polo Pria",
      categoryIndex: 1,
      price: 125000,
      stock: 200,
      description: "Kaos polo berbahan cotton combed 30s",
    },
    {
      name: "Celana Jeans Wanita",
      categoryIndex: 1,
      price: 350000,
      stock: 75,
      description: "Celana jeans slim fit dengan bahan denim berkualitas",
    },
    {
      name: "Jaket Hoodie",
      categoryIndex: 1,
      price: 275000,
      stock: 90,
      description: "Jaket hoodie dengan bahan fleece hangat dan nyaman",
    },
    {
      name: "Kemeja Batik",
      categoryIndex: 1,
      price: 185000,
      stock: 5,
      description: "Kemeja batik dengan motif modern",
    },
    {
      name: "Dress Casual",
      categoryIndex: 1,
      price: 225000,
      stock: 60,
      description: "Dress casual untuk sehari-hari dengan bahan adem",
    },

    // Makanan & Minuman
    {
      name: "Kopi Arabica Premium 250gr",
      categoryIndex: 2,
      price: 85000,
      stock: 120,
      description: "Kopi arabica pilihan dari Aceh Gayo",
    },
    {
      name: "Mie Instan Goreng",
      categoryIndex: 2,
      price: 3500,
      stock: 500,
      description: "Mie instan goreng dengan berbagai varian rasa",
    },
    {
      name: "Cokelat Batangan",
      categoryIndex: 2,
      price: 15000,
      stock: 250,
      description: "Cokelat batangan premium dengan cocoa 70%",
    },
    {
      name: "Teh Celup Herbal",
      categoryIndex: 2,
      price: 25000,
      stock: 7,
      description: "Teh celup herbal dengan campuran jahe dan lemon",
    },
    {
      name: "Keripik Singkong",
      categoryIndex: 2,
      price: 12000,
      stock: 180,
      description: "Keripik singkong renyah dengan berbagai rasa",
    },

    // Alat Tulis
    {
      name: "Pulpen Gel 0.5mm",
      categoryIndex: 3,
      price: 5000,
      stock: 300,
      description: "Pulpen gel dengan tinta smooth dan tidak mudah luntur",
    },
    {
      name: "Buku Tulis A5",
      categoryIndex: 3,
      price: 8000,
      stock: 450,
      description: "Buku tulis A5 dengan 80 lembar halaman bergaris",
    },
    {
      name: "Penghapus Putih",
      categoryIndex: 3,
      price: 2500,
      stock: 600,
      description: "Penghapus putih tidak meninggalkan bekas",
    },
    {
      name: "Spidol Whiteboard Set",
      categoryIndex: 3,
      price: 35000,
      stock: 3,
      description: "Set spidol whiteboard 4 warna",
    },
    {
      name: "Penggaris 30cm",
      categoryIndex: 3,
      price: 7500,
      stock: 220,
      description: "Penggaris plastik 30cm dengan ukuran presisi",
    },

    // Olahraga
    {
      name: "Bola Sepak Size 5",
      categoryIndex: 4,
      price: 185000,
      stock: 40,
      description: "Bola sepak size 5 untuk pertandingan resmi",
    },
    {
      name: "Raket Badminton",
      categoryIndex: 4,
      price: 425000,
      stock: 35,
      description: "Raket badminton profesional berbahan carbon",
    },
    {
      name: "Matras Yoga",
      categoryIndex: 4,
      price: 150000,
      stock: 55,
      description: "Matras yoga anti slip dengan ketebalan 6mm",
    },
    {
      name: "Dumbbell 5kg",
      categoryIndex: 4,
      price: 175000,
      stock: 9,
      description: "Dumbbell dengan lapisan rubber untuk latihan fitness",
    },
    {
      name: "Sepatu Lari",
      categoryIndex: 4,
      price: 550000,
      stock: 65,
      description: "Sepatu lari dengan teknologi cushioning untuk kenyamanan maksimal",
    },
  ];

  // ---- Fungsi untuk Generate SKU ----
  // Membuat SKU unik untuk setiap produk
  function generateSKU() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let sku = "GPK-";
    for (let i = 0; i < 6; i++) {
      sku += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return sku;
  }

  // ---- Fungsi untuk Menambahkan Data Dummy ----
  // Fungsi utama untuk menambahkan semua data dummy ke Firestore
  async function seedData() {
    console.log("🌱 Memulai proses seed data...");

    try {
      const db = firebase.firestore();
      const categoriesRef = db.collection("categories");
      const productsRef = db.collection("products");

      // ---- Langkah 1: Tambahkan Kategori ----
      console.log("📁 Menambahkan kategori...");
      const categoryIds = [];

      for (const category of dummyCategories) {
        const docRef = await categoriesRef.add({
          ...category,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        categoryIds.push(docRef.id);
        console.log(`✅ Kategori "${category.name}" berhasil ditambahkan`);
      }

      // ---- Langkah 2: Tambahkan Produk ----
      console.log("\n📦 Menambahkan produk...");
      let successCount = 0;

      for (const product of dummyProducts) {
        // Ambil categoryId berdasarkan index
        const categoryId = categoryIds[product.categoryIndex];

        const productData = {
          name: product.name,
          categoryId: categoryId,
          sku: generateSKU(),
          price: product.price,
          stock: product.stock,
          description: product.description,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        await productsRef.add(productData);
        successCount++;
        console.log(`✅ Produk "${product.name}" berhasil ditambahkan`);
      }

      // ---- Selesai ----
      console.log("\n🎉 Seed data selesai!");
      console.log(`📊 Total kategori: ${categoryIds.length}`);
      console.log(`📊 Total produk: ${successCount}`);
      console.log("\n✨ Data dummy berhasil ditambahkan ke database!");
      alert(
        `✅ Berhasil!\n\nData dummy telah ditambahkan:\n- ${categoryIds.length} kategori\n- ${successCount} produk\n\nSilakan refresh halaman untuk melihat data.`
      );
    } catch (error) {
      console.error("❌ Error saat menambahkan data:", error);
      alert(`❌ Gagal menambahkan data: ${error.message}`);
    }
  }

  // ---- Fungsi untuk Menghapus Semua Data ----
  // Fungsi untuk membersihkan database (hapus semua data)
  async function clearAllData() {
    if (
      !confirm(
        "⚠️ PERINGATAN!\n\nApakah Anda yakin ingin menghapus SEMUA data?\nTindakan ini tidak dapat dibatalkan!"
      )
    ) {
      return;
    }

    console.log("🗑️ Menghapus semua data...");

    try {
      const db = firebase.firestore();

      // Hapus semua produk
      const productsSnapshot = await db.collection("products").get();
      const productDeletePromises = productsSnapshot.docs.map((doc) => doc.ref.delete());
      await Promise.all(productDeletePromises);
      console.log(`✅ ${productsSnapshot.size} produk dihapus`);

      // Hapus semua kategori
      const categoriesSnapshot = await db.collection("categories").get();
      const categoryDeletePromises = categoriesSnapshot.docs.map((doc) => doc.ref.delete());
      await Promise.all(categoryDeletePromises);
      console.log(`✅ ${categoriesSnapshot.size} kategori dihapus`);

      console.log("🎉 Semua data berhasil dihapus!");
      alert("✅ Semua data berhasil dihapus!\n\nSilakan refresh halaman.");
    } catch (error) {
      console.error("❌ Error saat menghapus data:", error);
      alert(`❌ Gagal menghapus data: ${error.message}`);
    }
  }

  // ---- Export Fungsi ke Window ----
  // Agar bisa dipanggil dari console browser dan tombol
  window.seedData = seedData;
  window.clearAllData = clearAllData;

  // ---- Pesan Siap Digunakan ----
  console.log("📝 Seed data script loaded!");
  console.log("💡 Gunakan seedData() untuk menambahkan data dummy");
  console.log("💡 Gunakan clearAllData() untuk menghapus semua data");
  console.log("💡 Atau klik tombol 'Tambah Data Dummy' di dashboard");
})();

// ---- Fungsi Wrapper untuk Memastikan Firebase Siap ----
// Memastikan Firebase sudah ter-initialize sebelum seed data dipanggil
(function ensureFirebaseReady() {
  // Cek apakah Firebase sudah siap
  const checkFirebase = setInterval(() => {
    if (typeof firebase !== "undefined" && typeof db !== "undefined") {
      clearInterval(checkFirebase);
      console.log("✅ Firebase siap, seedData() dapat dipanggil");
    }
  }, 100);

  // Timeout setelah 10 detik
  setTimeout(() => {
    clearInterval(checkFirebase);
    if (typeof firebase === "undefined" || typeof db === "undefined") {
      console.error("❌ Firebase tidak ter-load dengan benar");
    }
  }, 10000);
})();
