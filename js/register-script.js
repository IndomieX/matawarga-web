import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const db = getFirestore(app);

document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nama = document.getElementById("regNama").value;
    const rt = document.getElementById("regRT").value;
    const rw = document.getElementById("regRW").value;
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;
    const btn = document.getElementById("btnReg");

    btn.disabled = true;
    btn.textContent = "Sedang mendaftarkan...";

    try {
        // 1. Buat akun di Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Simpan data wilayah spesifik ke Firestore
        await setDoc(doc(db, "users", user.uid), {
            nama: nama,
            rt: rt,
            rw: rw,
            email: email,
            role: email.endsWith("@admin.com") ? "admin" : "warga"
        });

        alert("Akun Anda Berhasil Terdaftar!");
        window.location.href = "index.html";
    } catch (error) {
        alert("Gagal Daftar: " + error.message);
        btn.disabled = false;
        btn.textContent = "Daftar Sekarang";
    }
});