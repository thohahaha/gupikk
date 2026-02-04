// ==========================================
// Kasir/POS Application Logic
// ==========================================

(function () {
  "use strict";

  // ---- Check Authentication ----
  checkAuth().then((user) => {
    if (user.role !== "kasir") {
      alert("Anda tidak memiliki akses ke halaman ini");
      window.location.href = "login.html";
      return;
    }
    document.getElementById("userName").textContent = user.name;
    init();
  }).catch(() => {
    window.location.href = "login.html";
  });

  // ---- State ----
  let allProducts = [];
  let allCategories = [];
  let cart = [];
  let filteredTransactions = []; // Simpan transaksi yang terfilter untuk export

  // ---- DOM Elements ----
  const $ = (sel) => document.querySelector(sel);
  const elements = {
    productGrid: $("#productGrid"),
    cartItems: $("#cartItems"),
    totalItems: $("#totalItems"),
    totalPrice: $("#totalPrice"),
    checkoutBtn: $("#checkoutBtn"),
    productSearch: $("#productSearch"),
    categoryFilter: $("#categoryFilter"),
    themeToggle: $("#themeToggle"),
    loadingOverlay: $("#loadingOverlay"),
    toastContainer: $("#toastContainer"),
    mobileMenuBtn: $("#mobileMenuBtn"),
    sidebar: $("#sidebar"),
    sidebarOverlay: $("#sidebarOverlay"),
    transactionsTableBody: $("#transactionsTableBody")
  };

  // ---- Initialize ----
  function init() {
    loadTheme();
    bindEvents();
    
    // Load data dengan delay kecil untuk memastikan DOM ready
    setTimeout(() => {
      loadData();
    }, 100);
  }

  // ---- Theme Management ----
  function loadTheme() {
    const theme = localStorage.getItem("gupikkk-theme") || "light";
    document.documentElement.setAttribute("data-theme", theme);
    updateThemeIcon(theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("gupikkk-theme", next);
    updateThemeIcon(next);
  }

  function updateThemeIcon(theme) {
    const icon = elements.themeToggle.querySelector("i");
    icon.className = theme === "dark" ? "ri-sun-line" : "ri-moon-line";
  }

  // ---- Navigation ----
  async function navigateTo(page) {
    try {
      // Update navigation
      document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
      const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
      if (navItem) {
        navItem.classList.add("active");
      } else {
        console.warn(`Nav item not found for page: ${page}`);
      }

      // Update pages
      document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
      const targetPage = document.querySelector(`#page-${page}`);
      if (targetPage) {
        targetPage.classList.add("active");
      } else {
        console.error(`Page not found: #page-${page}`);
        return;
      }

      // Update titles
      const titles = {
        cashier: { title: "Point of Sale", subtitle: "Selamat datang di sistem kasir" },
        transactions: { title: "Riwayat Transaksi", subtitle: "Transaksi hari ini" }
      };

      const t = titles[page];
      if (t) {
        const pageTitle = $("#pageTitle");
        const pageSubtitle = $("#pageSubtitle");
        if (pageTitle) pageTitle.textContent = t.title;
        if (pageSubtitle) pageSubtitle.textContent = t.subtitle;
      }

      // Close sidebar
      elements.sidebar.classList.remove("open");
      elements.sidebarOverlay.classList.remove("active");

      // Load data for transactions page
      if (page === "transactions") {
        // Load transactions dengan error handling
        try {
          await populateTransactionFilters();
          loadTransactionsWithFilters();
        } catch (error) {
          console.error("Error loading transactions page:", error);
          showToast("error", "Gagal", "Gagal memuat halaman transaksi");
          // Tetap tampilkan halaman meskipun error
        }
      }
    } catch (error) {
      console.error("Error in navigateTo:", error);
      showToast("error", "Gagal", "Gagal navigasi ke halaman");
    }
  }

  // ---- Load Data ----
  function showLoading() {
    elements.loadingOverlay.classList.add("active");
  }

  function hideLoading() {
    elements.loadingOverlay.classList.remove("active");
  }

  async function loadData() {
    showLoading();
    try {
      // Load categories dan products secara parallel
      await Promise.all([
        loadCategories().catch((err) => {
          console.error("Error loading categories:", err);
          allCategories = [];
          populateCategoryFilter();
        }),
        loadProducts().catch((err) => {
          console.error("Error loading products:", err);
          allProducts = [];
          renderProducts();
        })
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      showToast("error", "Gagal", "Gagal memuat data produk");
    } finally {
      hideLoading();
    }
  }

  function loadCategories() {
    return new Promise((resolve, reject) => {
      // Load tanpa orderBy, sort di client-side
      db.collection("categories").onSnapshot(
        (snapshot) => {
          allCategories = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          // Sort by name di client-side
          allCategories.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
          populateCategoryFilter();
          resolve();
        },
        (error) => {
          console.error("Error loading categories:", error);
          // Resolve anyway untuk tidak block UI
          allCategories = [];
          populateCategoryFilter();
          resolve();
        }
      );
    });
  }

  function loadProducts() {
    return new Promise((resolve, reject) => {
      // Load semua produk tanpa orderBy untuk menghindari index issues
      // Filter dan sort di client-side
      db.collection("products").onSnapshot(
        (snapshot) => {
          allProducts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          // Sort by name di client-side
          allProducts.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
          renderProducts();
          resolve();
        },
        (error) => {
          console.error("Error loading products:", error);
          // Resolve anyway untuk tidak block UI
          allProducts = [];
          renderProducts();
          resolve();
        }
      );
    });
  }

  // ---- Render Products ----
  function renderProducts() {
    // Pastikan productGrid element ada
    if (!elements.productGrid) {
      console.error("Product grid element not found");
      return;
    }

    // Pastikan allProducts adalah array
    if (!Array.isArray(allProducts)) {
      allProducts = [];
    }

    let filtered = allProducts.filter((p) => {
      const stock = Number(p.stock) || 0;
      return stock > 0;
    });

    // Filter by search
    if (elements.productSearch) {
      const search = elements.productSearch.value.toLowerCase().trim();
      if (search) {
        filtered = filtered.filter((p) => {
          const name = (p.name || "").toLowerCase();
          return name.includes(search);
        });
      }
    }

    // Filter by category
    if (elements.categoryFilter) {
      const catFilter = elements.categoryFilter.value;
      if (catFilter) {
        filtered = filtered.filter((p) => p.categoryId === catFilter);
      }
    }

    if (filtered.length === 0) {
      elements.productGrid.innerHTML = `
        <div style="grid-column: 1/-1;">
          <div class="empty-state small">
            <i class="ri-box-3-line"></i>
            <p>${allProducts.length === 0 ? "Belum ada produk" : "Tidak ada produk dengan stok tersedia"}</p>
            ${allProducts.length === 0 ? '<p style="font-size: 0.85rem; margin-top: 0.5rem; color: #78716c;">Jalankan seedData() di console untuk menambah data dummy</p>' : ''}
          </div>
        </div>`;
      return;
    }

    elements.productGrid.innerHTML = filtered
      .map((p) => {
        const cat = allCategories.find((c) => c.id === p.categoryId);
        return `
        <div class="product-card" onclick="addToCart('${p.id}')" style="cursor: pointer; padding: 1rem; border: 1.5px solid #e7e5e4; border-radius: 12px; transition: all 0.2s; text-align: center;">
          <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #0f766e, #14b8a6); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem;">
            <i class="ri-box-3-line" style="font-size: 1.8rem; color: white;"></i>
          </div>
          <div style="font-weight: 600; font-size: 0.9rem; margin-bottom: 0.25rem; line-height: 1.3;">${escapeHtml(p.name)}</div>
          <div style="font-size: 0.75rem; color: #78716c; margin-bottom: 0.5rem;">${cat ? escapeHtml(cat.name) : "-"}</div>
          <div style="font-weight: 700; color: #0f766e; font-size: 1rem; margin-bottom: 0.5rem;">${formatCurrency(p.price)}</div>
          <div style="font-size: 0.8rem; color: #78716c;">Stok: ${p.stock}</div>
        </div>`;
      })
      .join("");
  }

  function populateCategoryFilter() {
    const options = allCategories.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
    elements.categoryFilter.innerHTML = `<option value="">Semua Kategori</option>${options}`;
  }

  // ---- Cart Management ----
  function addToCart(productId) {
    const product = allProducts.find((p) => p.id === productId);
    if (!product) return;

    // Check if already in cart
    const existingItem = cart.find((item) => item.id === productId);
    if (existingItem) {
      // Check stock limit
      if (existingItem.quantity >= product.stock) {
        showToast("warning", "Stok Tidak Cukup", `Stok ${product.name} hanya tersedia ${product.stock} unit`);
        return;
      }
      existingItem.quantity++;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        stock: product.stock
      });
    }

    renderCart();
    showToast("success", "Ditambahkan", `${product.name} ditambahkan ke keranjang`);
  }

  function removeFromCart(productId) {
    cart = cart.filter((item) => item.id !== productId);
    renderCart();
  }

  function updateQuantity(productId, change) {
    const item = cart.find((i) => i.id === productId);
    if (!item) return;

    item.quantity += change;

    if (item.quantity <= 0) {
      removeFromCart(productId);
    } else if (item.quantity > item.stock) {
      item.quantity = item.stock;
      showToast("warning", "Stok Terbatas", `Stok hanya tersedia ${item.stock} unit`);
    }

    renderCart();
  }

  window.clearCart = function () {
    if (cart.length === 0) return;
    if (!confirm("Kosongkan keranjang?")) return;
    cart = [];
    renderCart();
    showToast("info", "Keranjang Dikosongkan", "Semua item telah dihapus");
  };

  function renderCart() {
    if (cart.length === 0) {
      elements.cartItems.innerHTML = `
        <div class="empty-state small">
          <i class="ri-shopping-cart-line"></i>
          <p>Keranjang kosong</p>
        </div>`;
      elements.totalItems.textContent = "0";
      elements.totalPrice.textContent = "Rp 0";
      elements.checkoutBtn.disabled = true;
      
      // Reset jumlah uang dan sembunyikan kembalian
      const cashAmountInput = document.getElementById("cashAmount");
      const changeSection = document.getElementById("changeSection");
      if (cashAmountInput) cashAmountInput.value = "";
      if (changeSection) changeSection.style.display = "none";
      
      return;
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);

    elements.cartItems.innerHTML = cart
      .map((item) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #e7e5e4;">
          <div style="flex: 1;">
            <div style="font-weight: 600; margin-bottom: 0.25rem;">${escapeHtml(item.name)}</div>
            <div style="font-size: 0.9rem; color: #0f766e; font-weight: 600;">${formatCurrency(item.price)}</div>
          </div>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <button onclick="kasirApp.updateQuantity('${item.id}', -1)" class="btn-icon" style="width: 32px; height: 32px;">
              <i class="ri-subtract-line"></i>
            </button>
            <span style="font-weight: 700; min-width: 30px; text-align: center;">${item.quantity}</span>
            <button onclick="kasirApp.updateQuantity('${item.id}', 1)" class="btn-icon" style="width: 32px; height: 32px;">
              <i class="ri-add-line"></i>
            </button>
            <button onclick="kasirApp.removeFromCart('${item.id}')" class="btn-icon danger" style="width: 32px; height: 32px;">
              <i class="ri-delete-bin-line"></i>
            </button>
          </div>
        </div>`)
      .join("");

    elements.totalItems.textContent = totalQty;
    elements.totalPrice.textContent = formatCurrency(total);
    
    // Cek apakah nama kasir sudah diisi
    const cashierNameInput = document.getElementById("cashierName");
    const cashierName = cashierNameInput ? cashierNameInput.value.trim() : "";
    
    // Hitung kembalian jika ada jumlah uang
    calculateChange();
    
    // Validasi checkout button
    const cashAmountInput = document.getElementById("cashAmount");
    const cashAmount = cashAmountInput ? Number(cashAmountInput.value) || 0 : 0;
    const isValid = cashierName && cart.length > 0 && cashAmount >= total;
    
    elements.checkoutBtn.disabled = !isValid;
    
    // Update tooltip
    if (!cashierName && cart.length > 0) {
      elements.checkoutBtn.title = "Masukkan nama kasir terlebih dahulu";
    } else if (cashAmount < total && cart.length > 0) {
      elements.checkoutBtn.title = "Jumlah uang tidak mencukupi";
    } else {
      elements.checkoutBtn.title = "";
    }
  }

  // ---- Calculate Change ----
  function calculateChange() {
    const cashAmountInput = document.getElementById("cashAmount");
    const changeSection = document.getElementById("changeSection");
    const changeAmount = document.getElementById("changeAmount");
    
    if (!cashAmountInput || !changeSection || !changeAmount) return;
    
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const cashAmount = Number(cashAmountInput.value) || 0;
    const change = cashAmount - total;
    
    if (cashAmount > 0) {
      changeSection.style.display = "block";
      
      if (change >= 0) {
        changeAmount.textContent = formatCurrency(change);
        changeAmount.style.color = "#065f46";
        changeSection.style.background = "#d1fae5";
        changeSection.style.borderColor = "#0f766e";
      } else {
        changeAmount.textContent = formatCurrency(Math.abs(change));
        changeAmount.style.color = "#dc2626";
        changeSection.style.background = "#fef2f2";
        changeSection.style.borderColor = "#dc2626";
      }
    } else {
      changeSection.style.display = "none";
    }
  }

  // Export untuk bisa dipanggil dari HTML
  window.kasirApp = window.kasirApp || {};
  window.kasirApp.calculateChange = calculateChange;

  // ---- Checkout ----
  window.checkout = async function () {
    // Validasi cart tidak kosong
    if (cart.length === 0) {
      showToast("warning", "Keranjang Kosong", "Tambahkan produk ke keranjang terlebih dahulu");
      return;
    }

    // Validasi nama kasir - cek element ada
    const cashierNameInput = document.getElementById("cashierName");
    if (!cashierNameInput) {
      console.error("Element cashierName tidak ditemukan");
      showToast("error", "Error", "Element form tidak ditemukan. Silakan refresh halaman.");
      return;
    }
    
    const cashierName = cashierNameInput.value.trim();
    if (!cashierName) {
      showToast("warning", "Nama Kasir Wajib", "Masukkan nama kasir sebelum melakukan transaksi");
      cashierNameInput.focus();
      return;
    }

    // Hitung total
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (total <= 0) {
      showToast("error", "Error", "Total pembayaran tidak valid");
      return;
    }
    
    // Validasi jumlah uang - cek element ada
    const cashAmountInput = document.getElementById("cashAmount");
    if (!cashAmountInput) {
      console.error("Element cashAmount tidak ditemukan");
      showToast("error", "Error", "Element form tidak ditemukan. Silakan refresh halaman.");
      return;
    }
    
    const cashAmount = Number(cashAmountInput.value) || 0;
    if (cashAmount < total) {
      showToast("warning", "Jumlah Uang Tidak Cukup", `Jumlah uang harus minimal ${formatCurrency(total)}`);
      cashAmountInput.focus();
      return;
    }
    
    const change = cashAmount - total;
    
    // Konfirmasi pembayaran
    if (!confirm(`Proses pembayaran?\n\nTotal: ${formatCurrency(total)}\nBayar: ${formatCurrency(cashAmount)}\nKembalian: ${formatCurrency(change)}`)) {
      return;
    }

    showLoading();

    try {
      // Validasi user login
      const user = getCurrentUser();
      if (!user || !user.uid) {
        throw new Error("User tidak terautentikasi. Silakan login ulang.");
      }

      // Validasi db tersedia - gunakan firebase.firestore() jika db tidak terdefinisi
      const firestoreDb = typeof db !== 'undefined' && db ? db : firebase.firestore();
      if (!firestoreDb) {
        throw new Error("Database tidak tersedia. Pastikan Firebase sudah terinisialisasi.");
      }

      // Validasi produk di cart masih valid (cek stock)
      for (const item of cart) {
        const product = allProducts.find(p => p.id === item.id);
        if (!product) {
          throw new Error(`Produk "${item.name}" tidak ditemukan`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`Stok "${item.name}" tidak mencukupi. Stok tersedia: ${product.stock}`);
        }
      }

      const batch = firestoreDb.batch();

      // Create transaction
      const transactionRef = firestoreDb.collection("transactions").doc();
      const transactionData = {
        items: cart.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity
        })),
        total: total,
        cashAmount: cashAmount,
        change: change,
        cashier: {
          uid: user.uid,
          name: cashierName, // Gunakan nama kasir dari input
          email: user.email
        },
        cashierName: cashierName, // Simpan juga di field terpisah untuk kemudahan
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      batch.set(transactionRef, transactionData);

      // Update product stocks
      for (const item of cart) {
        const productRef = firestoreDb.collection("products").doc(item.id);
        batch.update(productRef, {
          stock: firebase.firestore.FieldValue.increment(-item.quantity),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      await batch.commit();

      // Simpan data transaksi untuk print struk
      const transactionId = transactionRef.id;
      const transactionForReceipt = {
        id: transactionId,
        ...transactionData,
        createdAt: new Date() // Untuk display di struk
      };

      showToast("success", "Berhasil", "Transaksi berhasil diproses");
      
      // Kosongkan cart dan reset input
      const savedCart = [...cart]; // Simpan cart untuk struk
      cart = [];
      if (cashAmountInput) cashAmountInput.value = "";
      renderCart();

      // Tampilkan opsi print struk
      if (confirm("Transaksi berhasil! Apakah Anda ingin mencetak struk?")) {
        printReceipt(transactionForReceipt, savedCart, cashierName, cashAmount, change);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      
      // Tampilkan pesan error yang lebih spesifik
      let errorMessage = "Terjadi kesalahan saat memproses transaksi";
      if (error.message) {
        errorMessage = error.message;
      } else if (error.code) {
        // Handle Firebase error codes
        switch (error.code) {
          case 'permission-denied':
            errorMessage = "Anda tidak memiliki izin untuk melakukan transaksi";
            break;
          case 'unavailable':
            errorMessage = "Database tidak tersedia. Periksa koneksi internet Anda";
            break;
          case 'failed-precondition':
            errorMessage = "Kondisi tidak terpenuhi. Mungkin stok produk berubah";
            break;
          default:
            errorMessage = `Error: ${error.code}`;
        }
      }
      
      showToast("error", "Gagal", errorMessage);
      
      // Jangan kosongkan cart jika error, biarkan user coba lagi
    } finally {
      hideLoading();
    }
  };

  // ---- Print Receipt/Struk ----
  function printReceipt(transaction, items, cashierName, cashAmount, change) {
    const receiptContent = document.getElementById("receiptContent");
    
    // Format tanggal dan waktu
    const now = transaction.createdAt || new Date();
    const date = new Date(now);
    const dateStr = date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    const timeStr = date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit"
    });

    // Generate struk HTML
    const receiptHTML = `
      <div style="font-family: 'Courier New', monospace; max-width: 300px; margin: 0 auto; padding: 20px; background: white;">
        <!-- Header -->
        <div style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 15px; margin-bottom: 15px;">
          <h2 style="margin: 0; font-size: 20px; font-weight: bold;">gupikkk</h2>
          <p style="margin: 5px 0; font-size: 12px;">Inventory Management System</p>
          <p style="margin: 5px 0; font-size: 11px;">Struk Pembayaran</p>
        </div>

        <!-- Transaction Info -->
        <div style="margin-bottom: 15px; font-size: 11px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>ID Transaksi:</span>
            <span>${transaction.id.substring(0, 8).toUpperCase()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Tanggal:</span>
            <span>${dateStr}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Waktu:</span>
            <span>${timeStr}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Kasir:</span>
            <span>${escapeHtml(cashierName)}</span>
          </div>
        </div>

        <!-- Items -->
        <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; margin-bottom: 15px;">
          ${items.map((item) => `
            <div style="margin-bottom: 10px;">
              <div style="font-weight: bold; margin-bottom: 3px;">${escapeHtml(item.name)}</div>
              <div style="display: flex; justify-content: space-between; font-size: 11px;">
                <span>${item.quantity} x ${formatCurrency(item.price)}</span>
                <span>${formatCurrency(item.price * item.quantity)}</span>
              </div>
            </div>
          `).join("")}
        </div>

        <!-- Total & Payment -->
        <div style="margin-bottom: 15px; border-top: 1px dashed #000; padding-top: 10px;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px;">
            <span>Total:</span>
            <span>${formatCurrency(transaction.total)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px;">
            <span>Bayar:</span>
            <span>${formatCurrency(cashAmount || transaction.cashAmount || transaction.total)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; margin-top: 8px; padding-top: 8px; border-top: 1px solid #000;">
            <span>KEMBALIAN:</span>
            <span>${formatCurrency(change !== undefined ? change : (transaction.change || 0))}</span>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; border-top: 2px dashed #000; padding-top: 15px; margin-top: 15px; font-size: 10px;">
          <p style="margin: 5px 0;">Terima kasih atas kunjungan Anda!</p>
          <p style="margin: 5px 0;">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p>
          <p style="margin: 10px 0 0 0; font-size: 9px;">www.gupikkk.com</p>
        </div>
      </div>
    `;

    // Set content
    receiptContent.innerHTML = receiptHTML;

    // Open print window
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Struk - ${transaction.id.substring(0, 8)}</title>
          <style>
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 10px;
              }
            }
            body {
              font-family: 'Courier New', monospace;
              margin: 0;
              padding: 10px;
            }
          </style>
        </head>
        <body>
          ${receiptHTML}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  // ---- Load Transactions with Filters ----
  async function loadTransactionsWithFilters() {
    try {
      showLoading();

      // Get filter values
      const filterPeriodEl = document.getElementById("filterPeriod");
      const filterDateFromEl = document.getElementById("filterDateFrom");
      const filterDateToEl = document.getElementById("filterDateTo");
      const filterCashierEl = document.getElementById("filterCashier");
      const filterCategoryEl = document.getElementById("filterCategoryTransaction");

      const period = filterPeriodEl?.value || "today";
      const dateFrom = filterDateFromEl?.value;
      const dateTo = filterDateToEl?.value;
      const filterCashier = filterCashierEl?.value || "";
      const filterCategory = filterCategoryEl?.value || "";

      // Calculate date range
      let startDate, endDate;
      const today = new Date();

      switch (period) {
        case "today":
          startDate = new Date(today);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(today);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "week":
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(today);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "month":
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        case "custom":
          if (dateFrom && dateTo) {
            startDate = new Date(dateFrom);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(dateTo);
            endDate.setHours(23, 59, 59, 999);
          } else {
            startDate = new Date(today);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(today);
            endDate.setHours(23, 59, 59, 999);
          }
          break;
        default:
          startDate = new Date(today);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(today);
          endDate.setHours(23, 59, 59, 999);
      }

      // Load all transactions (filter in client-side to avoid index issues)
      // Tidak pakai orderBy untuk menghindari index requirement
      const snapshot = await db.collection("transactions").get();

      const startTimestamp = firebase.firestore.Timestamp.fromDate(startDate);
      const endTimestamp = firebase.firestore.Timestamp.fromDate(endDate);

      // Filter transactions
      let filteredTransactions = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((t) => {
          const createdAt = t.createdAt;
          if (!createdAt) return false;
          return createdAt >= startTimestamp && createdAt <= endTimestamp;
        })
        // Sort by date descending (terbaru di atas)
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate() || new Date(0);
          const dateB = b.createdAt?.toDate() || new Date(0);
          return dateB - dateA; // Descending
        });

      // Filter by cashier name
      if (filterCashier) {
        filteredTransactions = filteredTransactions.filter((t) => {
          const cashierName = t.cashierName || t.cashier?.name || "";
          return cashierName.toLowerCase().includes(filterCashier.toLowerCase());
        });
      }

      // Filter by category (check if any item in transaction belongs to category)
      if (filterCategory) {
        // Need to load products to get category info
        const productsSnapshot = await db.collection("products").get();
        const productsMap = new Map();
        productsSnapshot.docs.forEach((doc) => {
          productsMap.set(doc.id, doc.data());
        });

        filteredTransactions = filteredTransactions.filter((t) => {
          return t.items.some((item) => {
            const product = productsMap.get(item.productId);
            return product && product.categoryId === filterCategory;
          });
        });
      }

      // Simpan ke variabel global untuk export (bahkan jika kosong)
      window.filteredTransactionsForExport = filteredTransactions;

      // Update summary
      const transactionCount = filteredTransactions.length;
      const transactionTotal = filteredTransactions.reduce((sum, t) => sum + (Number(t.total) || 0), 0);

      document.getElementById("transactionCount").textContent = transactionCount.toLocaleString("id-ID");
      document.getElementById("transactionTotal").textContent = formatCurrency(transactionTotal);

      // Render transactions
      if (filteredTransactions.length === 0) {
        elements.transactionsTableBody.innerHTML = `
          <tr><td colspan="5">
            <div class="empty-state">
              <i class="ri-file-list-line"></i>
              <h3>Tidak ada transaksi</h3>
              <p>Tidak ada transaksi yang sesuai dengan filter yang dipilih.</p>
            </div>
          </td></tr>`;
        hideLoading();
        return;
      }

      elements.transactionsTableBody.innerHTML = filteredTransactions
        .map((transaction) => {
          const time = transaction.createdAt ? transaction.createdAt.toDate().toLocaleTimeString("id-ID") : "-";
          const date = transaction.createdAt ? transaction.createdAt.toDate().toLocaleDateString("id-ID") : "-";
          const cashierName = transaction.cashierName || transaction.cashier?.name || "-";
          return `
            <tr>
              <td><code>${transaction.id.substring(0, 8)}</code></td>
              <td>
                <div>${date}</div>
                <div style="font-size: 0.85rem; color: #78716c;">${time}</div>
              </td>
              <td>${transaction.items.length} item</td>
              <td><span class="price-text">${formatCurrency(transaction.total)}</span></td>
              <td>${escapeHtml(cashierName)}</td>
            </tr>`;
        })
        .join("");

      hideLoading();
    } catch (error) {
      console.error("Error loading transactions:", error);
      showToast("error", "Gagal", "Gagal memuat riwayat transaksi");
      hideLoading();
    }
  };

  // ---- Update Transaction Filters ----
  function updateTransactionFilters() {
    const period = document.getElementById("filterPeriod")?.value || "today";
    const customDateGroup = document.getElementById("customDateGroup");
    const customDateToGroup = document.getElementById("customDateToGroup");

    if (period === "custom") {
      if (customDateGroup) customDateGroup.style.display = "block";
      if (customDateToGroup) customDateToGroup.style.display = "block";
    } else {
      if (customDateGroup) customDateGroup.style.display = "none";
      if (customDateToGroup) customDateToGroup.style.display = "none";
    }
  }

  // Export untuk bisa dipanggil dari HTML
  window.kasirApp.updateTransactionFilters = updateTransactionFilters;

  // ---- Reset Transaction Filters ----
  function resetTransactionFilters() {
    const filterPeriod = document.getElementById("filterPeriod");
    const filterDateFrom = document.getElementById("filterDateFrom");
    const filterDateTo = document.getElementById("filterDateTo");
    const filterCashier = document.getElementById("filterCashier");
    const filterCategoryTransaction = document.getElementById("filterCategoryTransaction");

    if (filterPeriod) filterPeriod.value = "today";
    if (filterDateFrom) filterDateFrom.value = "";
    if (filterDateTo) filterDateTo.value = "";
    if (filterCashier) filterCashier.value = "";
    if (filterCategoryTransaction) filterCategoryTransaction.value = "";
    
    updateTransactionFilters();
    loadTransactionsWithFilters();
  }

  // Export untuk bisa dipanggil dari HTML
  window.kasirApp.resetTransactionFilters = resetTransactionFilters;

  // ---- Populate Filter Dropdowns ----
  async function populateTransactionFilters() {
    try {
      // Populate cashier names - load all transactions and extract unique names
      const transactionsSnapshot = await db.collection("transactions").get();

      const cashierNames = new Set();
      transactionsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const cashierName = data.cashierName || data.cashier?.name;
        if (cashierName && cashierName.trim()) {
          cashierNames.add(cashierName.trim());
        }
      });

      const filterCashier = document.getElementById("filterCashier");
      if (filterCashier) {
        const options = Array.from(cashierNames)
          .sort()
          .map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`)
          .join("");
        filterCashier.innerHTML = `<option value="">Semua Kasir</option>${options}`;
      }

      // Populate categories
      const categoriesSnapshot = await db.collection("categories").get();
      const filterCategory = document.getElementById("filterCategoryTransaction");
      if (filterCategory) {
        const categories = categoriesSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            name: doc.data().name
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        
        const options = categories
          .map((cat) => `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`)
          .join("");
        filterCategory.innerHTML = `<option value="">Semua Kategori</option>${options}`;
      }
    } catch (error) {
      console.error("Error populating filters:", error);
      showToast("warning", "Peringatan", "Gagal memuat data filter, silakan refresh halaman");
    }
  }

  // ---- Export Transactions to Excel/CSV ----
  function exportTransactions() {
    const transactions = window.filteredTransactionsForExport || [];

    if (transactions.length === 0) {
      showToast("warning", "Tidak Ada Data", "Tidak ada transaksi untuk di-export");
      return;
    }

    // Get filter info untuk nama file
    const filterPeriod = document.getElementById("filterPeriod")?.value || "today";
    const filterCashier = document.getElementById("filterCashier")?.value || "";
    const filterCategory = document.getElementById("filterCategoryTransaction")?.value || "";

    // Generate filename
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    let filename = `Laporan_Penjualan_${dateStr}`;

    if (filterPeriod === "today") filename += "_HariIni";
    else if (filterPeriod === "week") filename += "_MingguIni";
    else if (filterPeriod === "month") filename += "_BulanIni";
    else if (filterPeriod === "custom") {
      const dateFrom = document.getElementById("filterDateFrom")?.value || "";
      const dateTo = document.getElementById("filterDateTo")?.value || "";
      if (dateFrom && dateTo) filename += `_${dateFrom}_${dateTo}`;
    }

    if (filterCashier) {
      filename += `_${filterCashier.replace(/\s+/g, "_")}`;
    }

    // Prepare CSV data
    let csvContent = "\uFEFF"; // BOM untuk Excel UTF-8

    // Calculate total sales once
    const totalSales = transactions.reduce((sum, t) => sum + (Number(t.total) || 0), 0);
    const avgTransaction = transactions.length > 0 ? totalSales / transactions.length : 0;

    // Header
    csvContent += "LAPORAN PENJUALAN - gupikkk\n";
    csvContent += `Tanggal Export: ${new Date().toLocaleString("id-ID")}\n`;
    csvContent += `Total Transaksi: ${transactions.length}\n`;
    csvContent += `Total Penjualan: Rp ${totalSales.toLocaleString("id-ID")}\n`;
    csvContent += "\n";

    // Filter Info
    csvContent += "FILTER:\n";
    csvContent += `Periode: ${getPeriodLabel(filterPeriod)}\n`;
    if (filterCashier) csvContent += `Kasir: ${filterCashier}\n`;
    if (filterCategory) {
      const categoryName = document.querySelector(`#filterCategoryTransaction option[value="${filterCategory}"]`)?.textContent || filterCategory;
      csvContent += `Kategori: ${categoryName}\n`;
    }
    csvContent += "\n";

    // Table Header
    csvContent += "ID Transaksi,Tanggal,Waktu,Kasir,Total Items,Total (Rp),Jumlah Uang (Rp),Kembalian (Rp),Detail Items\n";

    // Table Data
    transactions.forEach((transaction) => {
      const date = transaction.createdAt ? transaction.createdAt.toDate() : new Date();
      const dateStr = date.toLocaleDateString("id-ID");
      const timeStr = date.toLocaleTimeString("id-ID");
      const cashierName = transaction.cashierName || transaction.cashier?.name || "-";
      const total = Number(transaction.total) || 0;
      const cashAmount = Number(transaction.cashAmount) || total;
      const change = Number(transaction.change) || 0;

      // Detail items (format: Nama x Qty @ Harga = Subtotal)
      const itemsDetail = transaction.items
        .map((item) => {
          const price = Number(item.price) || 0;
          const subtotal = Number(item.subtotal) || 0;
          return `${item.name} x ${item.quantity} @ Rp ${price.toLocaleString("id-ID")} = Rp ${subtotal.toLocaleString("id-ID")}`;
        })
        .join("; ");

      // CSV row - format angka tanpa simbol untuk Excel
      csvContent += `"${transaction.id.substring(0, 8)}","${dateStr}","${timeStr}","${cashierName}",${transaction.items.length},${total},${cashAmount},${change},"${itemsDetail}"\n`;
    });

    // Summary (gunakan totalSales yang sudah dihitung di atas)
    csvContent += "\n";
    csvContent += "RINGKASAN:\n";
    csvContent += `Total Transaksi,${transactions.length}\n`;
    csvContent += `Total Penjualan,${totalSales}\n`;
    csvContent += `Rata-rata per Transaksi,${Math.round(avgTransaction)}\n`;

    // Download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("success", "Berhasil", `Data berhasil di-export: ${filename}.csv`);
  }

  // Helper function untuk label periode
  function getPeriodLabel(period) {
    const labels = {
      today: "Hari Ini",
      week: "Minggu Ini",
      month: "Bulan Ini",
      custom: "Custom"
    };
    return labels[period] || period;
  }

  // Export untuk bisa dipanggil dari HTML
  window.kasirApp.exportTransactions = exportTransactions;

  // ---- Utilities ----
  function formatCurrency(amount) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  }

  function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function showToast(type, title, message) {
    const icons = {
      success: "ri-checkbox-circle-fill",
      error: "ri-close-circle-fill",
      warning: "ri-alert-fill",
      info: "ri-information-fill"
    };

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <i class="toast-icon ${icons[type] || icons.info}"></i>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close"><i class="ri-close-line"></i></button>`;

    elements.toastContainer.appendChild(toast);
    toast.querySelector(".toast-close").addEventListener("click", () => removeToast(toast));
    setTimeout(() => removeToast(toast), 3000);
  }

  function removeToast(toast) {
    if (!toast.parentElement) return;
    toast.classList.add("removing");
    setTimeout(() => toast.remove(), 300);
  }

  // ---- Event Bindings ----
  function bindEvents() {
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.addEventListener("click", () => navigateTo(item.dataset.page));
    });

    elements.mobileMenuBtn.addEventListener("click", () => {
      elements.sidebar.classList.toggle("open");
      elements.sidebarOverlay.classList.toggle("active");
    });

    elements.sidebarOverlay.addEventListener("click", () => {
      elements.sidebar.classList.remove("open");
      elements.sidebarOverlay.classList.remove("active");
    });

    elements.themeToggle.addEventListener("click", toggleTheme);
    elements.productSearch.addEventListener("input", renderProducts);
    elements.categoryFilter.addEventListener("change", renderProducts);

    // Validasi nama kasir saat input
    const cashierNameInput = document.getElementById("cashierName");
    if (cashierNameInput) {
      cashierNameInput.addEventListener("input", () => {
        // Update status checkout button
        if (cart.length > 0) {
          renderCart();
        }
      });
    }

    // Transaction Filters Event Listeners
    const filterPeriod = document.getElementById("filterPeriod");
    const filterDateFrom = document.getElementById("filterDateFrom");
    const filterDateTo = document.getElementById("filterDateTo");
    const filterCashier = document.getElementById("filterCashier");
    const filterCategoryTransaction = document.getElementById("filterCategoryTransaction");

    if (filterPeriod) {
      filterPeriod.addEventListener("change", () => {
        updateTransactionFilters();
        // Auto load saat periode berubah
        loadTransactionsWithFilters();
      });
    }

    if (filterDateFrom) {
      filterDateFrom.addEventListener("change", () => {
        updateTransactionFilters();
        // Auto load saat tanggal berubah (jika custom period)
        if (filterPeriod && filterPeriod.value === "custom") {
          loadTransactionsWithFilters();
        }
      });
    }

    if (filterDateTo) {
      filterDateTo.addEventListener("change", () => {
        updateTransactionFilters();
        // Auto load saat tanggal berubah (jika custom period)
        if (filterPeriod && filterPeriod.value === "custom") {
          loadTransactionsWithFilters();
        }
      });
    }

    if (filterCashier) {
      filterCashier.addEventListener("change", () => {
        // Auto filter saat pilih kasir
        loadTransactionsWithFilters();
      });
    }

    if (filterCategoryTransaction) {
      filterCategoryTransaction.addEventListener("change", () => {
        // Auto filter saat pilih kategori
        loadTransactionsWithFilters();
      });
    }
  }

  // ---- Export Functions ----
  window.kasirApp = {
    addToCart,
    removeFromCart,
    updateQuantity,
    calculateChange,
    updateTransactionFilters,
    resetTransactionFilters,
    loadTransactions: loadTransactionsWithFilters,
    exportTransactions
  };

  // Initialize updateTransactionFilters saat pertama kali
  updateTransactionFilters();

  // Backward compatibility
  window.loadTransactions = loadTransactionsWithFilters;

  // Assign addToCart to window for onclick
  window.addToCart = addToCart;

  // Initialize filters if transactions page is active
  if (document.getElementById("page-transactions")?.classList.contains("active")) {
    populateTransactionFilters().then(() => {
      loadTransactionsWithFilters();
    });
  }
})();
