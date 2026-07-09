import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, getDoc, updateDoc, doc, query, orderBy, arrayUnion, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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

let emailPenggunaAktif = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        emailPenggunaAktif = user.email;
        
        // AMBIL PROFIL WILAYAH
        try {
            const userSnap = await getDoc(doc(db, "users", user.uid));
            if (userSnap.exists()) {
                const userData = userSnap.data();
                document.getElementById("userName").textContent = userData.nama || "Warga";
                document.getElementById("userRT").textContent = userData.rt || "--";
                document.getElementById("userRW").textContent = userData.rw || "--";
            }
        } catch (e) { console.log("Gagal memuat profil:", e); }

        loadFeed(); 
    } else {
        window.location.href = "../index.html";
    }
});

async function loadFeed() {
    const feed = document.getElementById('feedWarga');
    feed.innerHTML = '<div class="col-12 text-center mt-5"><div class="spinner-border text-primary"></div><p class="mt-2 text-muted fw-medium">Memuat laporan...</p></div>';

    const q = query(collection(db, "laporan"), orderBy("createdAt", "desc"));
    
    try {
        const snap = await getDocs(q);
        feed.innerHTML = '';
        
        snap.forEach(d => {
            const item = d.data();
            const dukung = item.dukungan || 0;
            const didukungOleh = item.didukungOleh || []; 
            const sudahMendukung = didukungOleh.includes(emailPenggunaAktif);
            
            let warnaBadge = "bg-secondary-subtle text-secondary-emphasis"; 
            if (item.status === "Diproses") warnaBadge = "bg-warning-subtle text-warning-emphasis";
            if (item.status === "Selesai") warnaBadge = "bg-success-subtle text-success-emphasis";

            let tombolDukungHTML = '';
            if (sudahMendukung) {
                tombolDukungHTML = `<button class="btn btn-primary btn-sm fw-bold px-3" style="border-radius: 8px;" disabled><i class="fas fa-check me-1"></i> Didukung</button>`;
            } else {
                tombolDukungHTML = `<button class="btn btn-outline-primary btn-sm fw-bold px-3" style="border-radius: 8px;" onclick="window.dukung('${d.id}', this)"><i class="fas fa-thumbs-up me-1"></i> Dukung</button>`;
            }

            feed.innerHTML += `
                <div class="col-md-6 col-lg-4">
                    <div class="card-custom card-hover h-100 d-flex flex-column">
                        <a href="detail.html?id=${d.id}" class="text-decoration-none text-dark d-flex flex-column flex-grow-1">
                            <img src="${item.imageUrl || 'https://via.placeholder.com/400x200'}" class="img-rounded-top">
                            <div class="p-4 pb-2 d-flex flex-column flex-grow-1">
                                <div class="d-flex justify-content-between align-items-start mb-3">
                                    <h5 class="fw-bold mb-0 text-truncate pe-2 text-primary">${item.title}</h5>
                                    <span class="badge ${warnaBadge} px-2 py-1 rounded-3">${item.status}</span>
                                </div>
                                <p class="text-muted small mb-0 fw-medium"><i class="fas fa-map-marker-alt text-danger me-1"></i> ${item.location}</p>
                            </div>
                        </a>
                        <div class="p-4 pt-3 mt-auto border-top d-flex justify-content-between align-items-center">
                            <span class="text-muted small fw-bold" id="dukung-${d.id}">${dukung} Dukungan</span>
                            ${tombolDukungHTML}
                        </div>
                    </div>
                </div>`;
        });

        if(snap.empty) { feed.innerHTML = '<div class="col-12 text-center mt-5"><h5 class="text-muted">Tidak ada laporan terbaru.</h5></div>'; }
    } catch (e) { console.error(e); }
}

window.dukung = async (id, btn) => {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    try {
        await updateDoc(doc(db, "laporan", id), { 
            dukungan: increment(1),
            didukungOleh: arrayUnion(emailPenggunaAktif)
        });
        loadFeed();
    } catch(e) { btn.disabled = false; }
};