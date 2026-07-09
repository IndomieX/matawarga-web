import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAuIVPGDAYCtdnTFDAhuQ87WWMdHg5wnY0",
    authDomain: "mata-warga-eac1d.firebaseapp.com",
    projectId: "mata-warga-eac1d",
    storageBucket: "mata-warga-eac1d.firebasestorage.app",
    messagingSenderId: "262840833160",
    appId: "1:262840833160:web:cb88eb1a2ba9ee25167b3d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Menarik ID Laporan dari URL (contoh: detail.html?id=XYZ123)
const urlParams = new URLSearchParams(window.location.search);
const reportId = urlParams.get('id');

let emailPenggunaAktif = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        emailPenggunaAktif = user.email;
        if (reportId) {
            loadDetail();
        } else {
            alert("Laporan tidak ditemukan!");
            window.location.href = "beranda.html";
        }
    } else {
        window.location.href = "../index.html";
    }
});

async function loadDetail() {
    try {
        const docRef = doc(db, "laporan", reportId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const item = docSnap.data();
            
            // Masukkan data ke HTML
            document.getElementById("detailFoto").src = item.imageUrl || 'https://via.placeholder.com/800x400';
            document.getElementById("detailJudul").textContent = item.title;
            document.getElementById("detailKategori").innerHTML = `<i class="fas fa-tag me-1"></i> ${item.category}`;
            document.getElementById("detailLokasi").textContent = item.location;
            
            // Format Waktu
            if (item.createdAt) {
                const date = item.createdAt.toDate();
                document.getElementById("detailWaktu").textContent = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit' });
            }

            // Status Badge
            const statusEl = document.getElementById("detailStatus");
            statusEl.textContent = item.status;
            statusEl.className = "badge px-3 py-2 rounded-3 fs-6 ";
            if (item.status === "Menunggu") statusEl.classList.add("bg-secondary-subtle", "text-secondary-emphasis");
            if (item.status === "Diproses") statusEl.classList.add("bg-warning-subtle", "text-warning-emphasis");
            if (item.status === "Selesai") statusEl.classList.add("bg-success-subtle", "text-success-emphasis");

            // Logika Dukungan
            const dukung = item.dukungan || 0;
            const didukungOleh = item.didukungOleh || [];
            const sudahMendukung = didukungOleh.includes(emailPenggunaAktif);
            
            document.getElementById("detailAngkaDukung").textContent = `${dukung} Warga Mendukung`;

            const btnArea = document.getElementById("areaTombolDukung");
            if (sudahMendukung) {
                btnArea.innerHTML = `<button class="btn btn-primary fw-bold px-4 rounded-3" disabled><i class="fas fa-check me-1"></i> Didukung</button>`;
            } else {
                btnArea.innerHTML = `<button class="btn btn-outline-primary fw-bold px-4 rounded-3" onclick="window.dukungDetail(this)"><i class="fas fa-thumbs-up me-1"></i> Dukung</button>`;
            }

            // Sembunyikan loading, tampilkan konten
            document.getElementById("loadingIndicator").classList.add("d-none");
            document.getElementById("detailContent").classList.remove("d-none");

        } else {
            alert("Data laporan tidak ditemukan.");
            window.location.href = "beranda.html";
        }
    } catch (e) {
        console.error("Error loading detail:", e);
        alert("Gagal memuat detail laporan.");
    }
}

// Fungsi dukung khusus di halaman detail
window.dukungDetail = async (btn) => {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    try {
        await updateDoc(doc(db, "laporan", reportId), { 
            dukungan: increment(1),
            didukungOleh: arrayUnion(emailPenggunaAktif)
        });
        loadDetail(); // Refresh data halaman detail
    } catch(e) {
        alert("Gagal mendukung: " + e.message);
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-thumbs-up me-1"></i> Dukung';
    }
};