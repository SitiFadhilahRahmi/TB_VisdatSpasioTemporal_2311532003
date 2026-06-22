# Dashboard Spasio-Temporal Bencana Indonesia (2010–2026)

Sebuah aplikasi web dashboard interaktif yang menyajikan visualisasi spasio-temporal bencana alam di Indonesia—khususnya gempa bumi, tsunami, dan banjir—untuk rentang tahun 2010 hingga 2026. Aplikasi ini menggabungkan kekuatan peta interaktif berbasis spasial dengan grafik analitis temporal untuk memberikan pemahaman mendalam mengenai pola kejadian dan dampak bencana di Indonesia.

---

## 📌 Deskripsi Proyek

Dashboard ini dirancang untuk mempermudah analisis data kebencanaan yang bersumber dari **USGS** (untuk data gempa bumi) dan **BNPB** (untuk data banjir dan tsunami). Aplikasi ini menyediakan beberapa fitur utama:
*   **Peta Interaktif (Leaflet)**: Menampilkan sebaran titik bencana (gempa & tsunami), pemetaan wilayah (choropleth banjir berdasarkan parameter tertentu, visualisasi dampak gempa), visualisasi kepadatan kejadian (heatmap gempa), serta penandaan anomali gempa hasil analisis machine learning.
*   **Kontrol Temporal & Animasi Time-lapse**: Memungkinkan pengguna memfilter data berdasarkan rentang tahun (2010–2026) serta memutar animasi perkembangan kejadian bencana secara sekuensial waktu.
*   **Panel Grafik Analitis (Chart.js)**: Menyajikan grafik tren kejadian tahunan & bulanan (musiman), visualisasi dampak banjir (korban meninggal, pengungsi, rumah rusak), distribusi magnitudo gempa, serta daftar 10 provinsi dengan tingkat kerawanan atau dampak tertinggi.
*   **Deteksi Anomali**: Integrasi hasil analisis machine learning untuk mendeteksi anomali pada kejadian gempa bumi.

---

## 🛠️ Dependensi Proyek

Aplikasi utama dibangun menggunakan teknologi web dasar (**HTML5**, **CSS3**, dan **Vanilla JavaScript**) tanpa menggunakan build-step compiler (seperti Vite/Webpack) ataupun framework JS. 

Seluruh pustaka (library) pihak ketiga dimuat langsung menggunakan **CDN (Content Delivery Network)** melalui [index.html](file:///d:/visdat_spasio_bencana/index.html):
1.  **Leaflet.js (v1.9.4)**: Untuk rendering peta dasar interaktif.
2.  **Leaflet Heat**: Ekstensi peta untuk visualisasi heatmap gempa bumi.
3.  **Leaflet TimeDimension**: Untuk memfasilitasi visualisasi berbasis waktu/animasi.
4.  **PapaParse (v5.4.1)**: Parser CSV yang cepat untuk mengolah data bencana mentah secara dinamis di sisi klien.
5.  **Chart.js (v4.4.0)**: Pustaka grafik responsif untuk visualisasi statistik bencana.
6.  **Font Awesome (v6.4.0)** & **Google Fonts (Inter)**: Untuk ikon antarmuka dan tipografi modern.

> [!NOTE]
> Karena seluruh pustaka dimuat dari CDN, **tidak ada proses instalasi lokal (`npm install`) yang diperlukan** untuk menjalankan aplikasi web ini. Namun, pastikan perangkat Anda terhubung ke internet saat membuka dashboard untuk memuat pustaka-pustaka tersebut.

---

## 🚀 Langkah-langkah Menjalankan Aplikasi

Karena aplikasi ini melakukan pemuatan file data lokal (`.csv` dan `.geojson`) melalui API Fetch secara asinkron (`async/await`), peramban (browser) akan memblokir akses jika file dibuka langsung menggunakan protokol `file:///` karena kebijakan keamanan peramban (**CORS Policy**).

Oleh karena itu, Anda harus menjalankan aplikasi ini menggunakan local web server. Berikut adalah beberapa metode yang dapat Anda gunakan:

### Metode 1: Menggunakan Python (Direkomendasikan)
Jika Anda memiliki Python terinstal di sistem Anda, jalankan perintah berikut pada direktori proyek:
```bash
python -m http.server 8000
```
Setelah server berjalan, buka peramban Anda dan akses tautan berikut:
👉 **[http://localhost:8000](http://localhost:8000)**

### Metode 2: Menggunakan Node.js (`http-server`)
Jika Anda lebih terbiasa dengan ekosistem Node.js, Anda dapat menggunakan modul `http-server` secara langsung tanpa instalasi global:
```bash
npx http-server -p 8000
```
Lalu akses melalui peramban di alamat **[http://localhost:8000](http://localhost:8000)**.

### Metode 3: Menggunakan Live Server di VS Code
Jika menggunakan VS Code, Anda cukup menginstal ekstensi **Live Server**, buka file [index.html](file:///d:/visdat_spasio_bencana/index.html), kemudian klik tombol **"Go Live"** di baris status bagian bawah editor.

---

## 📁 Struktur Folder Proyek

Berikut adalah penjelasan singkat mengenai struktur direktori dari proyek visualisasi data ini:

```text
d:/visdat_spasio_bencana/
│
├── index.html               # Halaman utama aplikasi (struktur layout dashboard)
│
├── css/
│   └── style.css            # Styling kustom dashboard (desain layout, warna, & responsivitas)
│
├── js/                      # Seluruh logika interaktivitas aplikasi (Modular JavaScript)
│   ├── config.js            # Konfigurasi global (warna, ambang batas, token peta)
│   ├── data.js              # Logika fetch & parsing file CSV/GeoJSON ke dalam format data terstruktur
│   ├── map.js               # Inisialisasi Leaflet map, manajemen layer spasial, marker, & tooltip
│   ├── charts.js            # Pembuatan & pembaruan grafik statistik menggunakan Chart.js
│   ├── filters.js           # Penanganan event filter tahun, checkbox layer, dan input kontrol
│   └── main.js              # Entry-point utama yang mengoordinasikan seluruh alur inisialisasi dashboard
│
└── ml/                      # Direktori analisis Machine Learning
    └── Anomaly_Detection.ipynb # Notebook deteksi anomali gempa bumi (Python/Jupyter)
```
