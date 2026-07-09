import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
// TAMBAHAN: Import updateEmail
import { getAuth, onAuthStateChanged, signOut, updateEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
// TAMBAHAN: Import updateDoc
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

let currentUserData = null; // Menyimpan data sementara untuk form edit

onAuthStateChanged(auth, async (user) => {
    if (user) {
        document.getElementById("profilEmail").textContent = user.email;

        try {
            const userSnap = await getDoc(doc(db, "users", user.uid));
            if (userSnap.exists()) {
                currentUserData = userSnap.data();
                
                // Menampilkan ke halaman profil
                document.getElementById("profilNama").textContent = currentUserData.nama || "Warga Tanpa Nama";
                document.getElementById("profilRT").textContent = currentUserData.rt || "--";
                document.getElementById("profilRW").textContent = currentUserData.rw || "--";

                // Memasukkan data ke dalam form modal agar siap diedit
                document.getElementById("editNama").value = currentUserData.nama;
                document.getElementById("editEmail").value = user.email;
                document.getElementById("editRT").value = currentUserData.rt;
                document.getElementById("editRW").value = currentUserData.rw;
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

// LOGIKA SUBMIT EDIT PROFIL
document.getElementById("formEditProfil").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btnSimpanEdit");
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Menyimpan...';

    const newNama = document.getElementById("editNama").value;
    const newEmail = document.getElementById("editEmail").value;
    const newRT = document.getElementById("editRT").value;
    const newRW = document.getElementById("editRW").value;
    
    const user = auth.currentUser;

    try {
        // 1. Update Email di Authentication (JIKA BERUBAH)
        if (user.email !== newEmail) {
            await updateEmail(user, newEmail);
        }

        // 2. Update Data di Firestore
        await updateDoc(doc(db, "users", user.uid), {
            nama: newNama,
            email: newEmail,
            rt: newRT,
            rw: newRW
        });

        alert("Profil berhasil diperbarui!");
        // Refresh halaman agar data baru ter-load
        window.location.reload(); 

    } catch (error) {
        // Error handling khusus untuk keamanan Firebase Auth
        if (error.code === 'auth/requires-recent-login') {
            alert("Untuk alasan keamanan, Anda harus Logout dan Login kembali sebelum dapat mengubah alamat Email.");
        } else {
            alert("Gagal memperbarui profil: " + error.message);
        }
        btn.disabled = false;
        btn.textContent = "Simpan Perubahan";
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