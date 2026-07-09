import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"; 

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

// PENJAGAAN RUTE (ROUTE GUARDING)
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Cek apakah emailnya berakhiran @admin.com
        if (!user.email.endsWith("@admin.com")) {
            alert("Akses ditolak! Halaman ini khusus Pengurus RT/RW.");
            window.location.href = "../warga/beranda.html"; 
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

// Cetak PDF (Versi Rapih & Resmi)
document.getElementById("btnCetakPDF").onclick = () => {
    const btn = document.getElementById("btnCetakPDF");
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Menyusun PDF...';
    btn.disabled = true;

    // 1. Ambil tabel asli dan gandakan (clone) agar tidak merusak tampilan web
    const tabelAsli = document.getElementById("tabelLaporan");
    const cloneTabel = tabelAsli.cloneNode(true);
    
    // 2. Hapus kolom "Aksi" dari tabel clone (kolom terakhir)
    const aksiCols = cloneTabel.querySelectorAll(".aksi-kolom");
    aksiCols.forEach(col => col.remove());

    // 3. Buat container khusus untuk format dokumen PDF
    const cetakContainer = document.createElement("div");
    cetakContainer.style.padding = "10px";
    cetakContainer.style.fontFamily = "'Plus Jakarta Sans', sans-serif";
    cetakContainer.style.color = "#1e293b";
    
    // 4. Tambahkan Kop / Judul Laporan Resmi
    const tanggalCetak = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    cetakContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px;">
            <h2 style="margin: 0; font-weight: 800; color: #0f172a; font-size: 24px;">REKAPITULASI PELAPORAN MATA WARGA</h2>
            <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">Dokumen ini dicetak otomatis pada: ${tanggalCetak}</p>
        </div>
    `;
    
    // 5. Rapikan style tabel untuk PDF
    cloneTabel.style.width = "100%";
    cloneTabel.style.borderCollapse = "collapse";
    cloneTabel.style.fontSize = "12px";
    
    const cells = cloneTabel.querySelectorAll("th, td");
    cells.forEach(cell => {
        cell.style.borderBottom = "1px solid #cbd5e1"; // Garis pemisah antar baris
        cell.style.padding = "12px 10px";
        cell.style.textAlign = "left";
        cell.style.verticalAlign = "middle";
    });

    // Warna background untuk Header Tabel
    const headerCells = cloneTabel.querySelectorAll("th");
    headerCells.forEach(th => {
        th.style.backgroundColor = "#f8fafc";
        th.style.fontWeight = "bold";
        th.style.color = "#334155";
    });

    cetakContainer.appendChild(cloneTabel);

    // 6. Konfigurasi html2pdf
    const opt = {
        margin:       0.4,
        filename:     'Laporan_Resmi_MataWarga.pdf',
        image:        { type: 'jpeg', quality: 1 },
        html2canvas:  { scale: 2, useCORS: true, windowWidth: 1000 }, 
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' },
        pagebreak:    { mode: 'css', avoid: 'tr' } // INI KUNCI AGAR BARIS TIDAK KEPOTONG
    };

    // 7. Eksekusi Cetak
    html2pdf().set(opt).from(cetakContainer).save().then(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
    });
};

document.getElementById("btnRefresh").onclick = loadData;

// LOGIKA LOGOUT ADMIN
document.getElementById("btnLogoutAdmin").addEventListener("click", async () => {
    if(confirm("Apakah Anda yakin ingin keluar dari halaman Admin?")) {
        try {
            await signOut(auth); // Memutus sesi Firebase secara resmi
            window.location.href = "../index.html";
        } catch (error) {
            alert("Gagal keluar: " + error.message);
        }
    }
});