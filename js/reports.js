// ==========================================
// Reports & Analytics System
// Analisis keluar masuk barang, penghasilan, pengeluaran
// ==========================================

(function () {
  "use strict";

  // ---- State ----
  let incomeExpenseChart = null;
  let transactionTrendChart = null;
  let stockMovementChart = null;
  let allTransactions = [];
  let allExpenses = [];
  let allStockHistory = [];

  // ---- DOM Elements ----
  const $ = (sel) => document.querySelector(sel);
  const elements = {
    reportPeriod: $("#reportPeriod"),
    reportDateFrom: $("#reportDateFrom"),
    reportDateTo: $("#reportDateTo"),
    addExpenseBtn: $("#addExpenseBtn"),
    totalIncome: $("#totalIncome"),
    totalExpense: $("#totalExpense"),
    netProfit: $("#netProfit"),
    totalTransactions: $("#totalTransactions"),
    incomeExpenseChart: $("#incomeExpenseChart"),
    transactionTrendChart: $("#transactionTrendChart"),
    stockMovementChart: $("#stockMovementChart"),
    topProductsTableBody: $("#topProductsTableBody"),
    recentExpensesTableBody: $("#recentExpensesTableBody"),

    // Expense Modal
    expenseModal: $("#expenseModal"),
    expenseModalTitle: $("#expenseModalTitle"),
    expenseForm: $("#expenseForm"),
    expenseId: $("#expenseId"),
    expenseDescription: $("#expenseDescription"),
    expenseAmount: $("#expenseAmount"),
    expenseCategory: $("#expenseCategory"),
    expenseDate: $("#expenseDate"),
    expenseNote: $("#expenseNote"),
    closeExpenseModal: $("#closeExpenseModal"),
    cancelExpenseBtn: $("#cancelExpenseBtn"),
  };

  // ---- Initialize ----
  // Tunggu sampai app.js selesai load
  if (typeof db !== "undefined") {
    initReports();
  } else {
    window.addEventListener("load", () => {
      setTimeout(initReports, 500);
    });
  }

  function initReports() {
    bindEvents();
    loadReportsData();
  }

  // ---- Event Bindings ----
  function bindEvents() {
    // Period filter
    elements.reportPeriod.addEventListener("change", () => {
      if (elements.reportPeriod.value === "custom") {
        elements.reportDateFrom.style.display = "block";
        elements.reportDateTo.style.display = "block";
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        elements.reportDateFrom.value = lastMonth.toISOString().split("T")[0];
        elements.reportDateTo.value = today.toISOString().split("T")[0];
      } else {
        elements.reportDateFrom.style.display = "none";
        elements.reportDateTo.style.display = "none";
      }
      loadReportsData();
    });

    // Expense Modal
    elements.addExpenseBtn.addEventListener("click", () => openExpenseModal());
    elements.closeExpenseModal.addEventListener("click", closeExpenseModal);
    elements.cancelExpenseBtn.addEventListener("click", closeExpenseModal);
    elements.expenseForm.addEventListener("submit", saveExpense);

    // Set default date to today
    const today = new Date().toISOString().split("T")[0];
    elements.expenseDate.value = today;

    // Close modal on overlay click
    elements.expenseModal.addEventListener("click", (e) => {
      if (e.target === elements.expenseModal) {
        closeExpenseModal();
      }
    });
  }

  // ---- Load Data ----
  function loadReportsData() {
    const period = getSelectedPeriod();
    Promise.all([
      loadTransactions(period),
      loadExpenses(period),
      loadStockHistory(period),
    ]).then(() => {
      updateSummary();
      updateCharts();
      updateTopProducts();
      updateRecentExpenses();
    });
  }

  function getSelectedPeriod() {
    const period = elements.reportPeriod.value;
    const today = new Date();
    let startDate, endDate;

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
      case "year":
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case "custom":
        startDate = new Date(elements.reportDateFrom.value);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(elements.reportDateTo.value);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    return { startDate, endDate };
  }

  function loadTransactions(period) {
    return new Promise((resolve, reject) => {
      const { startDate, endDate } = period;

      // Load all transactions and filter in client-side to avoid index issues
      db.collection("transactions")
        .orderBy("createdAt", "desc")
        .get()
        .then((snapshot) => {
          const startTimestamp = firebase.firestore.Timestamp.fromDate(startDate);
          const endTimestamp = firebase.firestore.Timestamp.fromDate(endDate);

          allTransactions = snapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .filter((t) => {
              const createdAt = t.createdAt;
              if (!createdAt) return false;
              return createdAt >= startTimestamp && createdAt <= endTimestamp;
            });
          resolve();
        })
        .catch((error) => {
          console.error("Error loading transactions:", error);
          allTransactions = [];
          resolve(); // Resolve anyway to continue
        });
    });
  }

  function loadExpenses(period) {
    return new Promise((resolve, reject) => {
      const { startDate, endDate } = period;

      // Load all expenses and filter in client-side
      db.collection("expenses")
        .orderBy("date", "desc")
        .get()
        .then((snapshot) => {
          const startTimestamp = firebase.firestore.Timestamp.fromDate(startDate);
          const endTimestamp = firebase.firestore.Timestamp.fromDate(endDate);

          allExpenses = snapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .filter((e) => {
              const date = e.date;
              if (!date) return false;
              return date >= startTimestamp && date <= endTimestamp;
            });
          resolve();
        })
        .catch((error) => {
          console.error("Error loading expenses:", error);
          allExpenses = [];
          resolve(); // Resolve anyway to continue
        });
    });
  }

  function loadStockHistory(period) {
    return new Promise((resolve, reject) => {
      const { startDate, endDate } = period;

      // Load all stock history and filter in client-side
      db.collection("stock_history")
        .orderBy("createdAt", "desc")
        .get()
        .then((snapshot) => {
          const startTimestamp = firebase.firestore.Timestamp.fromDate(startDate);
          const endTimestamp = firebase.firestore.Timestamp.fromDate(endDate);

          allStockHistory = snapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .filter((h) => {
              const createdAt = h.createdAt;
              if (!createdAt) return false;
              return createdAt >= startTimestamp && createdAt <= endTimestamp;
            });
          resolve();
        })
        .catch((error) => {
          console.error("Error loading stock history:", error);
          allStockHistory = [];
          resolve(); // Resolve anyway to continue
        });
    });
  }

  // ---- Update Summary ----
  function updateSummary() {
    // Calculate income from transactions
    const totalIncome = allTransactions.reduce((sum, t) => sum + (Number(t.total) || 0), 0);

    // Calculate total expenses
    const totalExpense = allExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // Net profit
    const netProfit = totalIncome - totalExpense;

    // Update UI
    elements.totalIncome.textContent = formatCurrency(totalIncome);
    elements.totalExpense.textContent = formatCurrency(totalExpense);
    elements.netProfit.textContent = formatCurrency(netProfit);
    elements.totalTransactions.textContent = allTransactions.length.toLocaleString("id-ID");

    // Color net profit
    if (netProfit >= 0) {
      elements.netProfit.style.color = "#0f766e";
    } else {
      elements.netProfit.style.color = "#dc2626";
    }
  }

  // ---- Update Charts ----
  function updateCharts() {
    updateIncomeExpenseChart();
    updateTransactionTrendChart();
    updateStockMovementChart();
  }

  function updateIncomeExpenseChart() {
    const ctx = elements.incomeExpenseChart.getContext("2d");

    // Group by day/week/month based on period
    const period = elements.reportPeriod.value;
    const grouped = groupDataByPeriod(allTransactions, allExpenses, period);

    if (incomeExpenseChart) {
      incomeExpenseChart.destroy();
    }

    incomeExpenseChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: grouped.labels,
        datasets: [
          {
            label: "Penghasilan",
            data: grouped.income,
            backgroundColor: "rgba(15, 118, 110, 0.8)",
            borderColor: "rgba(15, 118, 110, 1)",
            borderWidth: 1,
          },
          {
            label: "Pengeluaran",
            data: grouped.expense,
            backgroundColor: "rgba(220, 38, 38, 0.8)",
            borderColor: "rgba(220, 38, 38, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return context.dataset.label + ": " + formatCurrency(context.parsed.y);
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return "Rp " + value.toLocaleString("id-ID");
              },
            },
          },
        },
      },
    });
  }

  function updateTransactionTrendChart() {
    const ctx = elements.transactionTrendChart.getContext("2d");

    const period = elements.reportPeriod.value;
    const grouped = groupTransactionsByPeriod(allTransactions, period);

    if (transactionTrendChart) {
      transactionTrendChart.destroy();
    }

    transactionTrendChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: grouped.labels,
        datasets: [
          {
            label: "Jumlah Transaksi",
            data: grouped.counts,
            borderColor: "rgba(15, 118, 110, 1)",
            backgroundColor: "rgba(15, 118, 110, 0.1)",
            tension: 0.4,
            fill: true,
          },
          {
            label: "Total Penghasilan",
            data: grouped.totals,
            borderColor: "rgba(245, 158, 11, 1)",
            backgroundColor: "rgba(245, 158, 11, 0.1)",
            tension: 0.4,
            fill: true,
            yAxisID: "y1",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                if (context.datasetIndex === 0) {
                  return "Transaksi: " + context.parsed.y;
                } else {
                  return "Total: " + formatCurrency(context.parsed.y);
                }
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            position: "left",
            title: {
              display: true,
              text: "Jumlah Transaksi",
            },
          },
          y1: {
            beginAtZero: true,
            position: "right",
            title: {
              display: true,
              text: "Total (Rp)",
            },
            ticks: {
              callback: function (value) {
                return "Rp " + value.toLocaleString("id-ID");
              },
            },
            grid: {
              drawOnChartArea: false,
            },
          },
        },
      },
    });
  }

  function updateStockMovementChart() {
    const ctx = elements.stockMovementChart.getContext("2d");

    // Analyze stock movements
    const stockIn = allStockHistory.filter((h) => h.type === "add").length;
    const stockOut = allStockHistory.filter((h) => h.type === "subtract").length;
    const stockSet = allStockHistory.filter((h) => h.type === "set").length;

    // Calculate total quantities
    const totalIn = allStockHistory
      .filter((h) => h.type === "add")
      .reduce((sum, h) => sum + (Number(h.amount) || 0), 0);
    const totalOut = allStockHistory
      .filter((h) => h.type === "subtract")
      .reduce((sum, h) => sum + (Number(h.amount) || 0), 0);

    if (stockMovementChart) {
      stockMovementChart.destroy();
    }

    stockMovementChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Barang Masuk", "Barang Keluar", "Update Stok"],
        datasets: [
          {
            data: [stockIn, stockOut, stockSet],
            backgroundColor: [
              "rgba(15, 118, 110, 0.8)",
              "rgba(220, 38, 38, 0.8)",
              "rgba(245, 158, 11, 0.8)",
            ],
            borderColor: [
              "rgba(15, 118, 110, 1)",
              "rgba(220, 38, 38, 1)",
              "rgba(245, 158, 11, 1)",
            ],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || "";
                const value = context.parsed || 0;
                return label + ": " + value + " kali";
              },
            },
          },
        },
      },
    });
  }

  // ---- Helper Functions for Grouping Data ----
  function groupDataByPeriod(transactions, expenses, period) {
    const labels = [];
    const income = [];
    const expense = [];

    // Group transactions and expenses by period
    const transactionMap = new Map();
    const expenseMap = new Map();

    transactions.forEach((t) => {
      const date = t.createdAt?.toDate() || new Date();
      const key = getPeriodKey(date, period);
      const current = transactionMap.get(key) || 0;
      transactionMap.set(key, current + (Number(t.total) || 0));
    });

    expenses.forEach((e) => {
      const date = e.date?.toDate() || new Date();
      const key = getPeriodKey(date, period);
      const current = expenseMap.get(key) || 0;
      expenseMap.set(key, current + (Number(e.amount) || 0));
    });

    // Get all unique keys and sort
    const allKeys = Array.from(new Set([...transactionMap.keys(), ...expenseMap.keys()])).sort();

    allKeys.forEach((key) => {
      labels.push(key);
      income.push(transactionMap.get(key) || 0);
      expense.push(expenseMap.get(key) || 0);
    });

    return { labels, income, expense };
  }

  function groupTransactionsByPeriod(transactions, period) {
    const labels = [];
    const counts = [];
    const totals = [];

    const countMap = new Map();
    const totalMap = new Map();

    transactions.forEach((t) => {
      const date = t.createdAt?.toDate() || new Date();
      const key = getPeriodKey(date, period);

      const currentCount = countMap.get(key) || 0;
      countMap.set(key, currentCount + 1);

      const currentTotal = totalMap.get(key) || 0;
      totalMap.set(key, currentTotal + (Number(t.total) || 0));
    });

    const allKeys = Array.from(countMap.keys()).sort();

    allKeys.forEach((key) => {
      labels.push(key);
      counts.push(countMap.get(key));
      totals.push(totalMap.get(key));
    });

    return { labels, counts, totals };
  }

  function getPeriodKey(date, period) {
    switch (period) {
      case "today":
        return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      case "week":
        return date.toLocaleDateString("id-ID", { weekday: "short", day: "numeric" });
      case "month":
        return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      case "year":
        return date.toLocaleDateString("id-ID", { month: "short" });
      default:
        return date.toLocaleDateString("id-ID");
    }
  }

  // ---- Update Top Products ----
  function updateTopProducts() {
    // Count products sold
    const productCount = new Map();

    allTransactions.forEach((t) => {
      t.items?.forEach((item) => {
        const current = productCount.get(item.productId) || {
          name: item.name,
          quantity: 0,
          total: 0,
        };
        current.quantity += Number(item.quantity) || 0;
        current.total += Number(item.subtotal) || 0;
        productCount.set(item.productId, current);
      });
    });

    const topProducts = Array.from(productCount.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    if (topProducts.length === 0) {
      elements.topProductsTableBody.innerHTML = `
        <tr><td colspan="3">
          <div class="empty-state small">
            <i class="ri-inbox-line"></i>
            <p>Belum ada data</p>
          </div>
        </td></tr>`;
      return;
    }

    elements.topProductsTableBody.innerHTML = topProducts
      .map(
        (p) => `
      <tr>
        <td>${escapeHtml(p.name)}</td>
        <td><span class="stock-text">${p.quantity.toLocaleString("id-ID")}</span></td>
        <td><span class="price-text">${formatCurrency(p.total)}</span></td>
      </tr>`
      )
      .join("");
  }

  // ---- Update Recent Expenses ----
  function updateRecentExpenses() {
    const recent = allExpenses.slice(0, 10);

    if (recent.length === 0) {
      elements.recentExpensesTableBody.innerHTML = `
        <tr><td colspan="3">
          <div class="empty-state small">
            <i class="ri-inbox-line"></i>
            <p>Belum ada pengeluaran</p>
          </div>
        </td></tr>`;
      return;
    }

    elements.recentExpensesTableBody.innerHTML = recent
      .map((e) => {
        const date = e.date?.toDate() || new Date();
        return `
      <tr>
        <td>${escapeHtml(e.description)}</td>
        <td><span class="price-text" style="color: #dc2626;">${formatCurrency(e.amount)}</span></td>
        <td>${date.toLocaleDateString("id-ID")}</td>
      </tr>`;
      })
      .join("");
  }

  // ---- Expense Modal ----
  function openExpenseModal(expense = null) {
    elements.expenseForm.reset();
    elements.expenseId.value = "";

    if (expense) {
      elements.expenseModalTitle.textContent = "Edit Pengeluaran";
      elements.expenseId.value = expense.id;
      elements.expenseDescription.value = expense.description || "";
      elements.expenseAmount.value = expense.amount || "";
      elements.expenseCategory.value = expense.category || "other";
      const date = expense.date?.toDate() || new Date();
      elements.expenseDate.value = date.toISOString().split("T")[0];
      elements.expenseNote.value = expense.note || "";
    } else {
      elements.expenseModalTitle.textContent = "Tambah Pengeluaran";
      const today = new Date().toISOString().split("T")[0];
      elements.expenseDate.value = today;
    }

    elements.expenseModal.classList.add("active");
    setTimeout(() => elements.expenseDescription.focus(), 200);
  }

  function closeExpenseModal() {
    elements.expenseModal.classList.remove("active");
  }

  async function saveExpense(e) {
    e.preventDefault();

    const id = elements.expenseId.value;
    const data = {
      description: elements.expenseDescription.value.trim(),
      amount: Number(elements.expenseAmount.value) || 0,
      category: elements.expenseCategory.value,
      note: elements.expenseNote.value.trim(),
      date: firebase.firestore.Timestamp.fromDate(new Date(elements.expenseDate.value)),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    if (!data.description || !data.amount) {
      showToast("warning", "Perhatian", "Keterangan dan jumlah wajib diisi");
      return;
    }

    try {
      const user = getCurrentUser();

      if (id) {
        await db.collection("expenses").doc(id).update(data);
        showToast("success", "Berhasil", "Pengeluaran berhasil diperbarui");
      } else {
        data.createdBy = {
          uid: user.uid,
          name: user.name,
          email: user.email,
        };
        data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection("expenses").add(data);
        showToast("success", "Berhasil", "Pengeluaran berhasil ditambahkan");
      }

      closeExpenseModal();
      loadReportsData(); // Reload data
    } catch (error) {
      console.error("Error saving expense:", error);
      showToast("error", "Gagal", "Terjadi kesalahan saat menyimpan pengeluaran");
    }
  }

  // ---- Utilities ----
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

  function showToast(type, title, message) {
    // Use existing toast function from app.js if available
    if (typeof window.showToast === "function") {
      window.showToast(type, title, message);
    } else {
      // Fallback toast
      alert(`${title}: ${message}`);
    }
  }

  // ---- Auto-load when reports page is shown ----
  // Check periodically if reports page is active
  function checkAndLoadReports() {
    const reportsPage = document.getElementById("page-reports");
    if (reportsPage && reportsPage.classList.contains("active")) {
      // Only load if charts are not initialized or data is empty
      if (!incomeExpenseChart || allTransactions.length === 0) {
        loadReportsData();
      }
    }
  }

  // Check every 1 second if reports page is active
  setInterval(checkAndLoadReports, 1000);

  // Also check on page load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkAndLoadReports);
  } else {
    checkAndLoadReports();
  }

  console.log("✅ Reports system loaded");
})();
