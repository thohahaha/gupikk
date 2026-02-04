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
    loadData();
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
  function navigateTo(page) {
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
    document.querySelector(`.nav-item[data-page="${page}"]`).classList.add("active");

    document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
    document.querySelector(`#page-${page}`).classList.add("active");

    const titles = {
      cashier: { title: "Point of Sale", subtitle: "Selamat datang di sistem kasir" },
      transactions: { title: "Riwayat Transaksi", subtitle: "Transaksi hari ini" }
    };

    const t = titles[page];
    if (t) {
      $("#pageTitle").textContent = t.title;
      $("#pageSubtitle").textContent = t.subtitle;
    }

    elements.sidebar.classList.remove("open");
    elements.sidebarOverlay.classList.remove("active");

    if (page === "transactions") {
      window.loadTransactions();
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
      await Promise.all([loadCategories(), loadProducts()]);
    } catch (error) {
      console.error("Error loading data:", error);
      showToast("error", "Gagal", "Gagal memuat data produk");
    } finally {
      hideLoading();
    }
  }

  function loadCategories() {
    return new Promise((resolve, reject) => {
      db.collection("categories").orderBy("name").onSnapshot(
        (snapshot) => {
          allCategories = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          populateCategoryFilter();
          resolve();
        },
        (error) => reject(error)
      );
    });
  }

  function loadProducts() {
    return new Promise((resolve, reject) => {
      // Load semua produk, filter stok > 0 di client side
      // Ini menghindari kebutuhan composite index
      db.collection("products").orderBy("name").onSnapshot(
        (snapshot) => {
          allProducts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          renderProducts();
          resolve();
        },
        (error) => reject(error)
      );
    });
  }

  // ---- Render Products ----
  function renderProducts() {
    let filtered = allProducts.filter((p) => p.stock > 0);

    // Filter by search
    const search = elements.productSearch.value.toLowerCase().trim();
    if (search) {
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(search));
    }

    // Filter by category
    const catFilter = elements.categoryFilter.value;
    if (catFilter) {
      filtered = filtered.filter((p) => p.categoryId === catFilter);
    }

    if (filtered.length === 0) {
      elements.productGrid.innerHTML = `
        <div style="grid-column: 1/-1;">
          <div class="empty-state small">
            <i class="ri-box-3-line"></i>
            <p>Tidak ada produk</p>
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
    elements.checkoutBtn.disabled = false;
  }

  // ---- Checkout ----
  window.checkout = async function () {
    if (cart.length === 0) return;

    if (!confirm(`Proses pembayaran total ${formatCurrency(cart.reduce((sum, item) => sum + item.price * item.quantity, 0))}?`)) {
      return;
    }

    showLoading();

    try {
      const user = getCurrentUser();
      const batch = db.batch();

      // Create transaction
      const transactionRef = db.collection("transactions").doc();
      const transactionData = {
        items: cart.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity
        })),
        total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
        cashier: {
          uid: user.uid,
          name: user.name,
          email: user.email
        },
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      batch.set(transactionRef, transactionData);

      // Update product stocks
      for (const item of cart) {
        const productRef = db.collection("products").doc(item.id);
        batch.update(productRef, {
          stock: firebase.firestore.FieldValue.increment(-item.quantity),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      await batch.commit();

      showToast("success", "Berhasil", "Transaksi berhasil diproses");
      cart = [];
      renderCart();
    } catch (error) {
      console.error("Checkout error:", error);
      showToast("error", "Gagal", "Terjadi kesalahan saat memproses transaksi");
    } finally {
      hideLoading();
    }
  };

  // ---- Load Transactions ----
  window.loadTransactions = async function () {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const snapshot = await db.collection("transactions")
        .where("createdAt", ">=", today)
        .orderBy("createdAt", "desc")
        .get();

      if (snapshot.empty) {
        elements.transactionsTableBody.innerHTML = `
          <tr><td colspan="5">
            <div class="empty-state">
              <i class="ri-file-list-line"></i>
              <h3>Belum ada transaksi</h3>
              <p>Transaksi hari ini akan muncul di sini.</p>
            </div>
          </td></tr>`;
        return;
      }

      elements.transactionsTableBody.innerHTML = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          const time = data.createdAt ? data.createdAt.toDate().toLocaleTimeString("id-ID") : "-";
          return `
            <tr>
              <td><code>${doc.id.substring(0, 8)}</code></td>
              <td>${time}</td>
              <td>${data.items.length} item</td>
              <td><span class="price-text">${formatCurrency(data.total)}</span></td>
              <td>${escapeHtml(data.cashier.name)}</td>
            </tr>`;
        })
        .join("");
    } catch (error) {
      console.error("Error loading transactions:", error);
      showToast("error", "Gagal", "Gagal memuat riwayat transaksi");
    }
  };

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
  }

  // ---- Export Functions ----
  window.kasirApp = {
    addToCart,
    removeFromCart,
    updateQuantity
  };

  // Assign addToCart to window for onclick
  window.addToCart = addToCart;
})();
