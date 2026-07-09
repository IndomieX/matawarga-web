import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"; // TAMBAHAN: Import Auth

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
const auth = getAuth(app); // TAMBAHAN: Inisialisasi Auth

// PENJAGAAN RUTE (ROUTE GUARDING)
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Cek apakah emailnya berakhiran @admin.com
        if (!user.email.endsWith("@admin.com")) {
            alert("Akses ditolak! Halaman ini khusus Pengurus RT/RW.");
            window.location.href = "../warga/beranda.html"; // Lempar ke beranda warga
        } else {
            // Jika benar admin, jalankan fungsi loadData
            loadData();
        }
    } else {
        // Jika belum login sama sekali, lempar ke halaman login (index.html di root)
        window.location.href = "../index.html";
    }
});

async function loadData() {
    const table = document.getElementById('tableBody');
    table.innerHTML = '<tr><td colspan="7" class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 fw-medium text-muted">Memuat data dari server...</p></td></tr>';
    
    try {
        const q = query(collection(db, "laporan"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        table.innerHTML = '';
        let i = 1;
        
        snap.forEach(d => {
            const item = d.data();
            const foto = item.imageUrl || 'https://via.placeholder.com/80?text=No+Foto';
            
            // Logika Warna Badge Pastel Elegan
            let warnaBadge = "bg-secondary-subtle text-secondary-emphasis"; 
            if (item.status === "Diproses") warnaBadge = "bg-warning-subtle text-warning-emphasis";
            if (item.status === "Selesai") warnaBadge = "bg-success-subtle text-success-emphasis";

            // Dropdown Pilihan Status
            const dropdownStatus = `
                <select class="form-select form-select-sm fw-bold shadow-sm" style="width: 130px; cursor: pointer; border-radius: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0;" onchange="window.ubahStatus('${d.id}', this.value)">
                    <option value="Menunggu" ${item.status === 'Menunggu' ? 'selected' : ''}>Menunggu</option>
                    <option value="Diproses" ${item.status === 'Diproses' ? 'selected' : ''}>Diproses</option>
                    <option value="Selesai" ${item.status === 'Selesai' ? 'selected' : ''}>Selesai</option>
                </select>
            `;
            
            table.innerHTML += `
                <tr>
                    <td class="px-3 fw-bold text-muted">${i++}</td>
                    <td><img src="${foto}" crossorigin="anonymous" style="width:70px; height:70px; object-fit:cover; border-radius:12px; border: 1px solid #f1f5f9; box-shadow: 0 4px 10px rgba(0,0,0,0.05);"></td>
                    <td class="fw-bold">${item.title}</td>
                    <td class="fw-medium text-muted">${item.category}</td>
                    <td class="fw-medium text-muted">${item.location}</td>
                    <td><span class="badge ${warnaBadge} px-3 py-2 rounded-3">${item.status}</span></td>
                    <td class="aksi-kolom">
                        <div class="d-flex justify-content-center align-items-center gap-2">
                            ${dropdownStatus}
                            <button class="btn btn-sm btn-danger shadow-sm d-flex align-items-center justify-content-center" style="width: 34px; height: 34px; border-radius: 8px;" onclick="window.delLapor('${d.id}')" title="Hapus Laporan">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
        });

        if (snap.empty) {
            table.innerHTML = '<tr><td colspan="7" class="text-center py-5 text-muted fw-bold">Belum ada data laporan yang masuk.</td></tr>';
        }
    } catch (e) {
        console.error(e);
        table.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger fw-bold">Gagal memuat data.</td></tr>';
    }
}

// Update Status Otomatis
window.ubahStatus = async (id, statusBaru) => {
    try {
        await updateDoc(doc(db, "laporan", id), { status: statusBaru });
        loadData(); 
    } catch (error) {
        alert("Gagal merubah status: " + error.message);
    }
};

// Hapus Laporan
window.delLapor = async (id) => {
    if(confirm("Apakah Anda yakin ingin menghapus laporan ini secara permanen?")) { 
        await deleteDoc(doc(db, "laporan", id)); 
        loadData(); 
    }
};

// Cetak PDF (Dengan Perbaikan CORS Foto)
document.getElementById("btnCetakPDF").onclick = () => {
    const el = document.getElementById("tabelLaporan");
    const cols = document.querySelectorAll(".aksi-kolom");
    
    cols.forEach(c => c.style.display = "none");
    
    const opt = {
        margin:       0.5,
        filename:     'Rekapan_MataWarga.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true }, 
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(el).save().then(() => {
        cols.forEach(c => c.style.display = "");
    });
};

document.getElementById("btnRefresh").onclick = loadData;
// loadData(); --> Baris ini sudah dihapus karena dipanggil di dalam fungsi cek login