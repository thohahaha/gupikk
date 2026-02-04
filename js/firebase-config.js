// ==========================================
// Firebase Configuration
// Ganti dengan API Key Firebase Anda
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyAgRh9W7nwRHlRThW4D3PQaWWh7nydG-Xw",
  authDomain: "gupikk-apps.firebaseapp.com",
  projectId: "gupikk-apps",
  storageBucket: "gupikk-apps.firebasestorage.app",
  messagingSenderId: "409024829286",
  appId: "1:409024829286:web:69d4ae4ce08d2b369bdaa7",
  measurementId: "G-H7T1NHDKT8"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Initialize Firebase Authentication
const auth = firebase.auth();

console.log("✅ Firebase initialized successfully");
console.log("✅ Firestore ready");
console.log("✅ Authentication ready");
