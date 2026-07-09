import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const db = getFirestore(app); // Tambahkan inisialisasi Firestore

// Cek status login dan tarik data profil
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Tampilkan Email
        document.getElementById("profilEmail").textContent = user.email;

        // Tarik data profil lengkap dari tabel 'users'
        try {
            const userSnap = await getDoc(doc(db, "users", user.uid));
            if (userSnap.exists()) {
                const userData = userSnap.data();
                document.getElementById("profilNama").textContent = userData.nama || "Warga Tanpa Nama";
                document.getElementById("profilRT").textContent = userData.rt || "--";
                document.getElementById("profilRW").textContent = userData.rw || "--";
            } else {
                document.getElementById("profilNama").textContent = "Pengguna Sistem";
            }
        } catch (error) {
            console.error("Gagal mengambil data profil:", error);
            document.getElementById("profilNama").textContent = "Gagal memuat profil";
        }

    } else {
        window.location.href = "../index.html";
    }
});

// Logika tombol Logout
document.getElementById("btnLogout").addEventListener("click", async () => {
    if(confirm("Apakah Anda yakin ingin keluar?")) {
        try {
            await signOut(auth);
            window.location.href = "../index.html";
        } catch (error) {
            alert("Gagal keluar: " + error.message);
        }
    }
});