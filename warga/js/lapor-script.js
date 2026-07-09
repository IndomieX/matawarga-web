import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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
    if (!user) {
        window.location.href = "../index.html"; // Tendang jika belum login
    }
});

// --- LOGIKA PETA PICKER LOKASI ---
let selectedLat = -6.200000; 
let selectedLng = 106.816666;

const mapPicker = L.map('mapPicker').setView([selectedLat, selectedLng], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(mapPicker);

const marker = L.marker([selectedLat, selectedLng], { draggable: true }).addTo(mapPicker);

marker.on('dragend', function (e) {
    selectedLat = marker.getLatLng().lat;
    selectedLng = marker.getLatLng().lng;
});

mapPicker.on('click', function (e) {
    selectedLat = e.latlng.lat;
    selectedLng = e.latlng.lng;
    marker.setLatLng([selectedLat, selectedLng]);
});
// ---------------------------------

document.getElementById("formLapor").onsubmit = async (e) => {
    e.preventDefault();
    
    // TAMBAHAN: Validasi Input Foto
    const file = document.getElementById("f").files[0];
    if (!file) {
        alert("Harap pilih dan unggah foto bukti kejadian terlebih dahulu!");
        return; // Hentikan proses jika tidak ada foto
    }

    const btn = document.getElementById("s");
    btn.disabled = true; 
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Mengirim...';
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "matawarga_preset");

    try {
        const res = await fetch("https://api.cloudinary.com/v1_1/ditdkfhv0/image/upload", { method: "POST", body: formData });
        const img = await res.json();
        
        await addDoc(collection(db, "laporan"), {
            title: document.getElementById("t").value,
            category: document.getElementById("k").value,
            location: document.getElementById("l").value,
            latitude: selectedLat,   
            longitude: selectedLng,  
            imageUrl: img.secure_url,
            status: "Menunggu",
            dukungan: 0,
            didukungOleh: [],
            createdAt: serverTimestamp()
        });
        
        alert("Laporan berhasil dikirim!"); 
        window.location.href = "beranda.html";
    } catch (err) { 
        alert("Gagal mengirim laporan: " + err.message); 
        btn.disabled = false; 
        btn.innerText = "Kirim Laporan"; 
    }
};