// ==========================================
// Authentication & Authorization System
// Handle login, logout, dan role-based access
// ==========================================

(function () {
  "use strict";

  // ---- DOM Elements ----
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginBtn = document.getElementById("loginBtn");
  const errorMessage = document.getElementById("errorMessage");
  const errorText = document.getElementById("errorText");
  const togglePassword = document.getElementById("togglePassword");

  // ---- Initialize Firebase Auth ----
  const auth = firebase.auth();
  const db = firebase.firestore();

  // ---- Toggle Password Visibility ----
  if (togglePassword) {
    togglePassword.addEventListener("click", () => {
      const type = passwordInput.type === "password" ? "text" : "password";
      passwordInput.type = type;
      const icon = togglePassword.querySelector("i");
      icon.className = type === "password" ? "ri-eye-line" : "ri-eye-off-line";
    });
  }

  // ---- Demo Account Fill Function ----
  // Mengisi form dengan data akun demo
  window.fillDemo = function (email, password) {
    emailInput.value = email;
    passwordInput.value = password;
    emailInput.focus();
  };

  // ---- Show Error Message ----
  function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.add("show");
    setTimeout(() => {
      errorMessage.classList.remove("show");
    }, 5000);
  }

  // ---- Hide Error Message ----
  function hideError() {
    errorMessage.classList.remove("show");
  }

  // ---- Login Handler ----
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideError();

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      // Validasi input
      if (!email || !password) {
        showError("Email dan password harus diisi");
        return;
      }

      // Disable tombol saat proses login
      loginBtn.disabled = true;
      loginBtn.innerHTML = '<i class="ri-loader-4-line"></i> Memproses...';

      try {
        // Login ke Firebase Auth
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Ambil role user dari Firestore
        const userDoc = await db.collection("users").doc(user.uid).get();

        if (!userDoc.exists) {
          throw new Error("Data user tidak ditemukan");
        }

        const userData = userDoc.data();
        const role = userData.role;

        // Simpan info user ke localStorage
        localStorage.setItem("gupikkk-user", JSON.stringify({
          uid: user.uid,
          email: user.email,
          role: role,
          name: userData.name
        }));

        // Redirect berdasarkan role
        redirectByRole(role);

      } catch (error) {
        console.error("Login error:", error);
        
        // Handle berbagai jenis error
        let errorMsg = "Terjadi kesalahan saat login";
        
        switch (error.code) {
          case "auth/user-not-found":
          case "auth/wrong-password":
            errorMsg = "Email atau password salah";
            break;
          case "auth/invalid-email":
            errorMsg = "Format email tidak valid";
            break;
          case "auth/user-disabled":
            errorMsg = "Akun ini telah dinonaktifkan";
            break;
          case "auth/too-many-requests":
            errorMsg = "Terlalu banyak percobaan. Coba lagi nanti";
            break;
          default:
            errorMsg = error.message;
        }

        showError(errorMsg);
        
        // Enable tombol kembali
        loginBtn.disabled = false;
        loginBtn.innerHTML = 'Masuk <i class="ri-arrow-right-line"></i>';
      }
    });
  }

  // ---- Redirect Berdasarkan Role ----
  function redirectByRole(role) {
    const rolePages = {
      superadmin: "index.html",
      gudang: "gudang.html",
      kasir: "kasir.html"
    };

    const page = rolePages[role] || "index.html";
    window.location.href = page;
  }

  // ---- Check Auth State (untuk halaman lain) ----
  window.checkAuth = function () {
    return new Promise((resolve, reject) => {
      // Cek localStorage dulu (lebih cepat)
      const storedUser = localStorage.getItem("gupikkk-user");
      
      if (!storedUser) {
        window.location.href = "login.html";
        reject("Not authenticated");
        return;
      }

      // Verify dengan Firebase Auth
      auth.onAuthStateChanged((user) => {
        if (user) {
          const userData = JSON.parse(storedUser);
          resolve(userData);
        } else {
          localStorage.removeItem("gupikkk-user");
          window.location.href = "login.html";
          reject("Not authenticated");
        }
      });
    });
  };

  // ---- Logout Function ----
  window.logout = async function () {
    if (!confirm("Apakah Anda yakin ingin keluar?")) {
      return;
    }

    try {
      await auth.signOut();
      localStorage.removeItem("gupikkk-user");
      window.location.href = "login.html";
    } catch (error) {
      console.error("Logout error:", error);
      alert("Gagal logout: " + error.message);
    }
  };

  // ---- Check Role Access ----
  // Memastikan user punya akses ke halaman ini
  window.checkRoleAccess = function (allowedRoles) {
    const storedUser = localStorage.getItem("gupikkk-user");
    
    if (!storedUser) {
      window.location.href = "login.html";
      return false;
    }

    const userData = JSON.parse(storedUser);
    
    if (!allowedRoles.includes(userData.role)) {
      alert("Anda tidak memiliki akses ke halaman ini");
      redirectByRole(userData.role);
      return false;
    }

    return true;
  };

  // ---- Get Current User ----
  window.getCurrentUser = function () {
    const storedUser = localStorage.getItem("gupikkk-user");
    return storedUser ? JSON.parse(storedUser) : null;
  };

  console.log("✅ Auth system loaded");
})();
