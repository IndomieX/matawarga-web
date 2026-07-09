import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"; // TAMBAHAN IMPORT

const firebaseConfig = {
    apiKey: "AIzaSyAuIVPGDAYCtdnTFDAhuQ87WWMdHg5wnY0",
    authDomain: "mata-warga-eac1d.firebaseapp.com",
    projectId: "mata-warga-eac1d",
    storageBucket: "mata-warga-eac1d.firebasestorage.app",
    messagingSenderId: "262840833160",
    appId: "1:262840833160:web:cb88eb1a2ba9ee25167b3d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// CEK SESI LOGIN AKTIF (AUTO-REDIRECT)
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Jika sudah login, langsung arahkan tanpa perlu isi form lagi
        if (user.email.endsWith("@admin.com")) {
            window.location.href = "admin/dashboard.html";
        } else {
            window.location.href = "warga/beranda.html";
        }
    }
});

document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    const btn = document.getElementById("btnLogin");

    btn.disabled = true;
    btn.textContent = "Verifikasi...";

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // PEMISAHAN ROLE: Jika @admin.com masuk ke folder admin/
        if (user.email.endsWith("@admin.com")) {
            window.location.href = "admin/dashboard.html";
        } else {
            window.location.href = "warga/beranda.html";
        }
    } catch (error) {
        alert("Gagal Login: " + error.message);
        btn.disabled = false;
        btn.textContent = "Masuk";
    }
});