// ==========================================
// gupikkk - Inventory Management System
// Main Application Logic
// ==========================================

(function () {
  "use strict";

  // ---- Check Authentication ----
  // Pastikan user sudah login dan punya role superadmin
  checkAuth()
    .then((user) => {
      if (user.role !== "superadmin") {
        alert("Anda tidak memiliki akses ke halaman ini");
        window.location.href = "login.html";
        return;
      }
      // Update nama user di sidebar
      const userNameEl = document.getElementById("userName");
      if (userNameEl) {
        userNameEl.textContent = user.name;
      }
      // Lanjutkan init app - PENTING: harus dipanggil!
      init();
    })
    .catch(() => {
      window.location.href = "login.html";
    });

  // ---- References to Firestore Collections ----
  const productsRef = db.collection("products");
  const categoriesRef = db.collection("categories");

  // ---- State ----
  let allProducts = [];
  let allCategories = [];
  let deleteCallback = null;

  // ---- DOM Elements ----
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const elements = {
    sidebar: $("#sidebar"),
    sidebarOverlay: $("#sidebarOverlay"),
    mobileMenuBtn: $("#mobileMenuBtn"),
    themeToggle: $("#themeToggle"),
    globalSearch: $("#globalSearch"),
    pageTitle: $("#pageTitle"),
    pageSubtitle: $("#pageSubtitle"),
    loadingOverlay: $("#loadingOverlay"),
    toastContainer: $("#toastContainer"),

    // Stats
    totalProducts: $("#totalProducts"),
    totalCategories: $("#totalCategories"),
    totalStock: $("#totalStock"),
    lowStock: $("#lowStock"),

    // Dashboard
    recentProducts: $("#recentProducts"),
    lowStockList: $("#lowStockList"),

    // Products
    productsTableBody: $("#productsTableBody"),
    addProductBtn: $("#addProductBtn"),
    filterCategory: $("#filterCategory"),
    filterStock: $("#filterStock"),

    // Product Modal
    productModal: $("#productModal"),
    productModalTitle: $("#productModalTitle"),
    productForm: $("#productForm"),
    productId: $("#productId"),
    productName: $("#productName"),
    productCategory: $("#productCategory"),
    productSku: $("#productSku"),
    productPrice: $("#productPrice"),
    productStock: $("#productStock"),
    productDescription: $("#productDescription"),
    closeProductModal: $("#closeProductModal"),
    cancelProductBtn: $("#cancelProductBtn"),

    // Categories
    categoriesGrid: $("#categoriesGrid"),
    addCategoryBtn: $("#addCategoryBtn"),

    // Category Modal
    categoryModal: $("#categoryModal"),
    categoryModalTitle: $("#categoryModalTitle"),
    categoryForm: $("#categoryForm"),
    categoryId: $("#categoryId"),
    categoryName: $("#categoryName"),
    categoryDescription: $("#categoryDescription"),
    closeCategoryModal: $("#closeCategoryModal"),
    cancelCategoryBtn: $("#cancelCategoryBtn"),

    // Delete Modal
    deleteModal: $("#deleteModal"),
    deleteMessage: $("#deleteMessage"),
    closeDeleteModal: $("#closeDeleteModal"),
    cancelDeleteBtn: $("#cancelDeleteBtn"),
    confirmDeleteBtn: $("#confirmDeleteBtn"),
  };

  // ==========================================
  // INITIALIZATION
  // ==========================================

  function init() {
    loadTheme();
    bindEvents();
    loadData();
  }

  // ==========================================
  // THEME
  // ==========================================

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

  // ==========================================
  // NAVIGATION
  // ==========================================

  function navigateTo(page) {
    // Update nav
    $$(".nav-item").forEach((item) => item.classList.remove("active"));
    $(`.nav-item[data-page="${page}"]`).classList.add("active");

    // Update pages
    $$(".page").forEach((p) => p.classList.remove("active"));
    $(`#page-${page}`).classList.add("active");

    // Update title
    const titles = {
      dashboard: { title: "Dashboard", subtitle: "Selamat datang kembali, Administrator" },
      products: { title: "Produk", subtitle: "Kelola semua produk inventory Anda" },
      categories: { title: "Kategori", subtitle: "Kelola kategori produk" },
      reports: { title: "Laporan & Analisis", subtitle: "Analisis keluar masuk barang, penghasilan dan pengeluaran" },
    };

    const t = titles[page];
    if (t) {
      elements.pageTitle.textContent = t.title;
      elements.pageSubtitle.textContent = t.subtitle;
    }

    // Close mobile sidebar
    elements.sidebar.classList.remove("open");
    elements.sidebarOverlay.classList.remove("active");
  }

  // ==========================================
  // DATA LOADING
  // ==========================================

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
      updateDashboard();
    } catch (error) {
      console.error("Error loading data:", error);
      showToast("error", "Gagal memuat data", "Periksa koneksi internet dan konfigurasi Firebase.");
    } finally {
      hideLoading();
    }
  }

  // ---- Real-time Listeners ----

  function loadProducts() {
    return new Promise((resolve, reject) => {
      productsRef.orderBy("createdAt", "desc").onSnapshot(
        (snapshot) => {
          allProducts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          renderProducts();
          updateDashboard();
          resolve();
        },
        (error) => {
          console.error("Error loading products:", error);
          reject(error);
        }
      );
    });
  }

  function loadCategories() {
    return new Promise((resolve, reject) => {
      categoriesRef.orderBy("name").onSnapshot(
        (snapshot) => {
          allCategories = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          renderCategories();
          populateCategorySelects();
          updateDashboard();
          resolve();
        },
        (error) => {
          console.error("Error loading categories:", error);
          reject(error);
        }
      );
    });
  }

  // ==========================================
  // DASHBOARD
  // ==========================================

  function updateDashboard() {
    const totalStockCount = allProducts.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
    const lowStockCount = allProducts.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= 10).length;

    animateNumber(elements.totalProducts, allProducts.length);
    animateNumber(elements.totalCategories, allCategories.length);
    animateNumber(elements.totalStock, totalStockCount);
    animateNumber(elements.lowStock, lowStockCount);

    renderRecentProducts();
    renderLowStockList();
  }

  function animateNumber(el, target) {
    const current = parseInt(el.textContent) || 0;
    if (current === target) return;

    const duration = 400;
    const step = (target - current) / (duration / 16);
    let value = current;

    function update() {
      value += step;
      if ((step > 0 && value >= target) || (step < 0 && value <= target)) {
        el.textContent = target.toLocaleString("id-ID");
        return;
      }
      el.textContent = Math.round(value).toLocaleString("id-ID");
      requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  function renderRecentProducts() {
    const recent = allProducts.slice(0, 5);
    if (recent.length === 0) {
      elements.recentProducts.innerHTML = `
        <div class="empty-state small">
          <i class="ri-inbox-line"></i>
          <p>Belum ada produk</p>
        </div>`;
      return;
    }

    elements.recentProducts.innerHTML = recent
      .map((p) => {
        const cat = allCategories.find((c) => c.id === p.categoryId);
        return `
        <div class="recent-item">
          <div class="recent-item-info">
            <div class="recent-item-icon"><i class="ri-box-3-line"></i></div>
            <div>
              <div class="recent-item-name">${escapeHtml(p.name)}</div>
              <div class="recent-item-category">${cat ? escapeHtml(cat.name) : "Tanpa Kategori"}</div>
            </div>
          </div>
          <div class="recent-item-price">${formatCurrency(p.price)}</div>
        </div>`;
      })
      .join("");
  }

  function renderLowStockList() {
    const lowStockItems = allProducts.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= 10);
    if (lowStockItems.length === 0) {
      elements.lowStockList.innerHTML = `
        <div class="empty-state small">
          <i class="ri-checkbox-circle-line"></i>
          <p>Semua stok aman</p>
        </div>`;
      return;
    }

    elements.lowStockList.innerHTML = lowStockItems
      .slice(0, 5)
      .map(
        (p) => `
        <div class="low-stock-item">
          <div class="low-stock-item-info">
            <div class="recent-item-icon"><i class="ri-error-warning-line"></i></div>
            <div>
              <div class="recent-item-name">${escapeHtml(p.name)}</div>
              <div class="recent-item-category">SKU: ${escapeHtml(p.sku || "-")}</div>
            </div>
          </div>
          <div class="low-stock-item-stock">${p.stock} tersisa</div>
        </div>`
      )
      .join("");
  }

  // ==========================================
  // PRODUCTS CRUD
  // ==========================================

  function renderProducts() {
    let filtered = [...allProducts];

    // Filter by search
    const search = elements.globalSearch.value.toLowerCase().trim();
    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          (p.sku && p.sku.toLowerCase().includes(search)) ||
          (p.description && p.description.toLowerCase().includes(search))
      );
    }

    // Filter by category
    const catFilter = elements.filterCategory.value;
    if (catFilter) {
      filtered = filtered.filter((p) => p.categoryId === catFilter);
    }

    // Filter by stock status
    const stockFilter = elements.filterStock.value;
    if (stockFilter) {
      filtered = filtered.filter((p) => getStockStatus(p.stock) === stockFilter);
    }

    if (filtered.length === 0) {
      elements.productsTableBody.innerHTML = `
        <tr><td colspan="6">
          <div class="empty-state">
            <i class="ri-box-3-line"></i>
            <h3>${search || catFilter || stockFilter ? "Tidak ada hasil" : "Belum ada produk"}</h3>
            <p>${search || catFilter || stockFilter ? "Coba ubah filter pencarian Anda." : 'Klik "Tambah Produk" untuk menambahkan produk pertama.'}</p>
          </div>
        </td></tr>`;
      return;
    }

    elements.productsTableBody.innerHTML = filtered
      .map((p) => {
        const cat = allCategories.find((c) => c.id === p.categoryId);
        const status = getStockStatus(p.stock);
        const statusLabel = getStockLabel(status);

        return `
        <tr>
          <td>
            <div class="product-cell">
              <div class="product-thumb"><i class="ri-box-3-line"></i></div>
              <div>
                <div class="product-name">${escapeHtml(p.name)}</div>
                <div class="product-sku">${escapeHtml(p.sku || "-")}</div>
              </div>
            </div>
          </td>
          <td><span class="category-badge"><i class="ri-folder-3-line"></i> ${cat ? escapeHtml(cat.name) : "-"}</span></td>
          <td><span class="price-text">${formatCurrency(p.price)}</span></td>
          <td><span class="stock-text">${Number(p.stock).toLocaleString("id-ID")}</span></td>
          <td><span class="status-badge ${status}"><span class="status-dot"></span>${statusLabel}</span></td>
          <td>
            <div class="action-buttons">
              <button class="btn-icon" onclick="gupikkk.editProduct('${p.id}')" title="Edit">
                <i class="ri-edit-line"></i>
              </button>
              <button class="btn-icon danger" onclick="gupikkk.deleteProduct('${p.id}', '${escapeHtml(p.name)}')" title="Hapus">
                <i class="ri-delete-bin-line"></i>
              </button>
            </div>
          </td>
        </tr>`;
      })
      .join("");
  }

  function getStockStatus(stock) {
    const s = Number(stock);
    if (s <= 0) return "out-of-stock";
    if (s <= 10) return "low-stock";
    return "in-stock";
  }

  function getStockLabel(status) {
    const labels = { "in-stock": "Tersedia", "low-stock": "Stok Rendah", "out-of-stock": "Habis" };
    return labels[status] || status;
  }

  function openProductModal(product = null) {
    elements.productForm.reset();
    elements.productId.value = "";
    elements.productSku.value = "";

    if (product) {
      elements.productModalTitle.textContent = "Edit Produk";
      elements.productId.value = product.id;
      elements.productName.value = product.name;
      elements.productCategory.value = product.categoryId || "";
      elements.productSku.value = product.sku || "";
      elements.productPrice.value = product.price;
      elements.productStock.value = product.stock;
      elements.productDescription.value = product.description || "";
    } else {
      elements.productModalTitle.textContent = "Tambah Produk";
      elements.productSku.value = generateSKU();
    }

    elements.productModal.classList.add("active");
    setTimeout(() => elements.productName.focus(), 200);
  }

  function closeProductModal() {
    elements.productModal.classList.remove("active");
  }

  async function saveProduct(e) {
    e.preventDefault();

    const id = elements.productId.value;
    const data = {
      name: elements.productName.value.trim(),
      categoryId: elements.productCategory.value,
      sku: elements.productSku.value.trim(),
      price: Number(elements.productPrice.value) || 0,
      stock: Number(elements.productStock.value) || 0,
      description: elements.productDescription.value.trim(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    if (!data.name || !data.categoryId) {
      showToast("warning", "Perhatian", "Nama produk dan kategori wajib diisi.");
      return;
    }

    try {
      if (id) {
        await productsRef.doc(id).update(data);
        showToast("success", "Berhasil", `Produk "${data.name}" berhasil diperbarui.`);
      } else {
        data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        await productsRef.add(data);
        showToast("success", "Berhasil", `Produk "${data.name}" berhasil ditambahkan.`);
      }
      closeProductModal();
    } catch (error) {
      console.error("Error saving product:", error);
      showToast("error", "Gagal", "Terjadi kesalahan saat menyimpan produk.");
    }
  }

  function editProduct(id) {
    const product = allProducts.find((p) => p.id === id);
    if (product) openProductModal(product);
  }

  function deleteProduct(id, name) {
    elements.deleteMessage.textContent = `Apakah Anda yakin ingin menghapus produk "${name}"?`;
    deleteCallback = async () => {
      try {
        await productsRef.doc(id).delete();
        showToast("success", "Berhasil", `Produk "${name}" berhasil dihapus.`);
      } catch (error) {
        console.error("Error deleting product:", error);
        showToast("error", "Gagal", "Terjadi kesalahan saat menghapus produk.");
      }
    };
    elements.deleteModal.classList.add("active");
  }

  // ==========================================
  // CATEGORIES CRUD
  // ==========================================

  function renderCategories() {
    if (allCategories.length === 0) {
      elements.categoriesGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <i class="ri-folder-3-line"></i>
          <h3>Belum ada kategori</h3>
          <p>Klik "Tambah Kategori" untuk menambahkan kategori pertama.</p>
        </div>`;
      return;
    }

    elements.categoriesGrid.innerHTML = allCategories
      .map((cat) => {
        const productCount = allProducts.filter((p) => p.categoryId === cat.id).length;
        return `
        <div class="category-card">
          <div class="category-card-header">
            <div class="category-card-icon"><i class="ri-folder-3-line"></i></div>
            <div class="category-card-actions">
              <button class="btn-icon" onclick="gupikkk.editCategory('${cat.id}')" title="Edit">
                <i class="ri-edit-line"></i>
              </button>
              <button class="btn-icon danger" onclick="gupikkk.deleteCategory('${cat.id}', '${escapeHtml(cat.name)}')" title="Hapus">
                <i class="ri-delete-bin-line"></i>
              </button>
            </div>
          </div>
          <h4>${escapeHtml(cat.name)}</h4>
          <p>${escapeHtml(cat.description || "Tidak ada deskripsi")}</p>
          <div class="category-card-footer">
            <i class="ri-box-3-line"></i>
            ${productCount} produk
          </div>
        </div>`;
      })
      .join("");
  }

  function populateCategorySelects() {
    const options = allCategories.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");

    elements.productCategory.innerHTML = `<option value="">Pilih Kategori</option>${options}`;
    elements.filterCategory.innerHTML = `<option value="">Semua Kategori</option>${options}`;
  }

  function openCategoryModal(category = null) {
    elements.categoryForm.reset();
    elements.categoryId.value = "";

    if (category) {
      elements.categoryModalTitle.textContent = "Edit Kategori";
      elements.categoryId.value = category.id;
      elements.categoryName.value = category.name;
      elements.categoryDescription.value = category.description || "";
    } else {
      elements.categoryModalTitle.textContent = "Tambah Kategori";
    }

    elements.categoryModal.classList.add("active");
    setTimeout(() => elements.categoryName.focus(), 200);
  }

  function closeCategoryModal() {
    elements.categoryModal.classList.remove("active");
  }

  async function saveCategory(e) {
    e.preventDefault();

    const id = elements.categoryId.value;
    const data = {
      name: elements.categoryName.value.trim(),
      description: elements.categoryDescription.value.trim(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    if (!data.name) {
      showToast("warning", "Perhatian", "Nama kategori wajib diisi.");
      return;
    }

    try {
      if (id) {
        await categoriesRef.doc(id).update(data);
        showToast("success", "Berhasil", `Kategori "${data.name}" berhasil diperbarui.`);
      } else {
        data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        await categoriesRef.add(data);
        showToast("success", "Berhasil", `Kategori "${data.name}" berhasil ditambahkan.`);
      }
      closeCategoryModal();
    } catch (error) {
      console.error("Error saving category:", error);
      showToast("error", "Gagal", "Terjadi kesalahan saat menyimpan kategori.");
    }
  }

  function editCategory(id) {
    const cat = allCategories.find((c) => c.id === id);
    if (cat) openCategoryModal(cat);
  }

  function deleteCategory(id, name) {
    const productCount = allProducts.filter((p) => p.categoryId === id).length;
    if (productCount > 0) {
      showToast(
        "warning",
        "Tidak dapat dihapus",
        `Kategori "${name}" masih memiliki ${productCount} produk. Pindahkan atau hapus produk terlebih dahulu.`
      );
      return;
    }

    elements.deleteMessage.textContent = `Apakah Anda yakin ingin menghapus kategori "${name}"?`;
    deleteCallback = async () => {
      try {
        await categoriesRef.doc(id).delete();
        showToast("success", "Berhasil", `Kategori "${name}" berhasil dihapus.`);
      } catch (error) {
        console.error("Error deleting category:", error);
        showToast("error", "Gagal", "Terjadi kesalahan saat menghapus kategori.");
      }
    };
    elements.deleteModal.classList.add("active");
  }

  // ==========================================
  // DELETE CONFIRMATION
  // ==========================================

  function closeDeleteModal() {
    elements.deleteModal.classList.remove("active");
    deleteCallback = null;
  }

  async function confirmDelete() {
    if (deleteCallback) {
      await deleteCallback();
      deleteCallback = null;
    }
    closeDeleteModal();
  }

  // ==========================================
  // TOAST NOTIFICATIONS
  // ==========================================

  function showToast(type, title, message) {
    const icons = {
      success: "ri-checkbox-circle-fill",
      error: "ri-close-circle-fill",
      warning: "ri-alert-fill",
      info: "ri-information-fill",
    };

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <i class="toast-icon ${icons[type] || icons.info}"></i>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close"><i class="ri-close-line"></i></button>
    `;

    elements.toastContainer.appendChild(toast);

    // Close button
    toast.querySelector(".toast-close").addEventListener("click", () => removeToast(toast));

    // Auto remove
    setTimeout(() => removeToast(toast), 4000);
  }

  function removeToast(toast) {
    if (!toast.parentElement) return;
    toast.classList.add("removing");
    setTimeout(() => toast.remove(), 300);
  }

  // ==========================================
  // UTILITIES
  // ==========================================

  function generateSKU() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let sku = "GPK-";
    for (let i = 0; i < 6; i++) {
      sku += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return sku;
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  }

  function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // ==========================================
  // EVENT BINDINGS
  // ==========================================

  function bindEvents() {
    // Navigation
    $$(".nav-item").forEach((item) => {
      item.addEventListener("click", () => navigateTo(item.dataset.page));
    });

    // Mobile sidebar
    elements.mobileMenuBtn.addEventListener("click", () => {
      elements.sidebar.classList.toggle("open");
      elements.sidebarOverlay.classList.toggle("active");
    });

    elements.sidebarOverlay.addEventListener("click", () => {
      elements.sidebar.classList.remove("open");
      elements.sidebarOverlay.classList.remove("active");
    });

    // Theme
    elements.themeToggle.addEventListener("click", toggleTheme);

    // Search
    elements.globalSearch.addEventListener("input", () => renderProducts());

    // Filters
    elements.filterCategory.addEventListener("change", () => renderProducts());
    elements.filterStock.addEventListener("change", () => renderProducts());

    // Product Modal
    elements.addProductBtn.addEventListener("click", () => openProductModal());
    elements.closeProductModal.addEventListener("click", closeProductModal);
    elements.cancelProductBtn.addEventListener("click", closeProductModal);
    elements.productForm.addEventListener("submit", saveProduct);

    // Category Modal
    elements.addCategoryBtn.addEventListener("click", () => openCategoryModal());
    elements.closeCategoryModal.addEventListener("click", closeCategoryModal);
    elements.cancelCategoryBtn.addEventListener("click", closeCategoryModal);
    elements.categoryForm.addEventListener("submit", saveCategory);

    // Delete Modal
    elements.closeDeleteModal.addEventListener("click", closeDeleteModal);
    elements.cancelDeleteBtn.addEventListener("click", closeDeleteModal);
    elements.confirmDeleteBtn.addEventListener("click", confirmDelete);

    // Close modals on overlay click
    [elements.productModal, elements.categoryModal, elements.deleteModal].forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.classList.remove("active");
          deleteCallback = null;
        }
      });
    });

    // Keyboard: close modals with Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeProductModal();
        closeCategoryModal();
        closeDeleteModal();
      }
    });
  }

  // ==========================================
  // PUBLIC API (for inline onclick handlers)
  // ==========================================

  window.gupikkk = {
    editProduct,
    deleteProduct,
    editCategory,
    deleteCategory,
  };

  // Export functions for reports.js
  window.navigateTo = navigateTo;
  window.showToast = showToast;

  // ==========================================
  // START
  // ==========================================

  document.addEventListener("DOMContentLoaded", init);
})();
