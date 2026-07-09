import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// TAMBAHAN: Import Auth
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
const auth = getAuth(app); // TAMBAHAN: Inisialisasi Auth

// PENJAGAAN RUTE (ROUTE GUARDING)
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Jika sudah login, baru muat data petanya
        loadMapData();
    } else {
        // Jika belum, lempar ke halaman depan
        window.location.href = "../index.html";
    }
});

const map = L.map('map').setView([-6.200000, 106.816666], 12);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors, © CARTO',
    maxZoom: 19
}).addTo(map);

async function loadMapData() {
    try {
        const snap = await getDocs(collection(db, "laporan"));
        
        snap.forEach(async (d) => {
            const item = d.data();
            const id = d.id; 
            
            if (item.latitude && item.longitude) {
                buatPinDiPeta(item.latitude, item.longitude, item, id);
            } else if (item.location) {
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(item.location + ", Jakarta")}`);
                    const data = await response.json();
                    if(data && data.length > 0) {
                        buatPinDiPeta(data[0].lat, data[0].lon, item, id);
                    }
                } catch (e) {
                    console.log("Lokasi lama tidak ditemukan di peta");
                }
            }
        });
    } catch (e) {
        console.error("Gagal memuat titik peta: ", e);
    }
}

function buatPinDiPeta(lat, lng, item, id) {
    const marker = L.marker([lat, lng]).addTo(map);
    
    const foto = item.imageUrl || 'https://via.placeholder.com/150x100?text=No+Foto';
    
    marker.bindTooltip(`
        <div style="text-align: center; font-family: 'Plus Jakarta Sans', sans-serif; width: 150px;">
            <img src="${foto}" style="width: 100%; height: 90px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" alt="Foto Laporan">
            <p style="margin: 0; font-weight: 700; color: #1e293b; font-size: 13px; white-space: normal; line-height: 1.2;">${item.title}</p>
            <p style="margin: 4px 0 0 0; color: #0d6efd; font-size: 11px; font-weight: bold;">Klik untuk detail <i class="fas fa-arrow-right"></i></p>
        </div>
    `, { direction: 'top', offset: [0, -35], className: 'shadow-sm border-0 rounded-3 p-2' });

    marker.on('click', () => {
        window.location.href = `detail.html?id=${id}`;
    });
}
// loadMapData(); --> Dihapus dari sini karena sudah dipanggil di dalam onAuthStateChanged