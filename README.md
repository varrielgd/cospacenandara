# Nandara Nusa Montierra — Coffee Importer Intelligence System ☕

Sebuah Sistem Kecerdasan Importir Kopi terpadu yang dirancang eksklusif untuk memfasilitasi kebutuhan manajemen perusahaan ekspor-impor biji kopi. Mencampur alur kerja tradisional perkopian dengan pendekatan CRM modern, pembuatan dokumen proforma, wawasan kurikulum berbasis kopi, hingga perpesanan dan pelacakan sampel yang krusial.

## 🌟 Fitur Utama Aplikasi

### 1. 📊 Central Dashboard (Dasbor Utama)
Menyajikan pandangan udara (*birds-eye view*) mengenai metrik inti performa operasional ekspor Anda:
- Ringkasan aktivitas ekspor bulanan dan visual progres target penjualan.
- Insight atau saran operasional.

### 2. 👥 CRM (Manajemen Relasi Importir / Lead)
*Customer Relationship Management* yang terpusat untuk menyimpan profil para perwakilan sangrai kopi (Roasters) atau importir asing:
- Pendataan nama delegasi, taksiran jumlah kontainer, prioritas (*Hot, Warm, Cold*), dan negara.
- Membantu *monitoring* kapan interaksi selanjutnya dilakukan.

### 3. ✉️ Email Generator (Penyusunan Perpesanan Otomatis)
Menyingkirkan kemacetan berpikir ketika harus mengirim surat elektronik:
- Dapat mendraft varian format email (Pembaruan Panen Baru/Micro-Lot, Perkenalan Perusahaan, Follow-Up).
- Mendukung personalisasi langsung melalui nama klien dari data CRM yang terpilih.

### 4. 📦 Sample Tracker (Manajemen Sampel)
Ruang kontrol pengawasan atas logistik pengiriman paket-paket kopi perdana *(samples)* yang menentukan ke mana deal ekspor berujung:
- Sinkronisasi info kurir pengirim beserta kode Resinya (DHL/FedEx AWB).
- Monitor progress perjalanan (*Preparing, Shipped, Delivered*).
- **Inovasi Keselamatan Kopi:** Memiliki _Moisture High Alert_ yang menandai kadar kelembapan biji hijau, secara intelijen akan memberikan peringatan merah (*warning*) manakala nilai Air melebihi `12.5%`—indikasi bahaya munculnya jamur di samudera.

### 5. 🧾 Quotation & Proforma (Penawaran Resmi)
Generator dokumen penawaran harga dan parameter kontrak:
- Membuat rincian kalkulasi penawaran ekspor (*FOB/CIF*).
- Berintegrasi bersama modul Leads/CRM agar tidak mengulang entri nama pembeli.

### 6. 📚 Industry Glossary (Kamus Industri Kopi)
Kamus ensiklopedik kecil dalam *app* mengenai istilah dagang kopi *(Terroir, Cupping, Defect, Honey Process)* dan standar dokumentasi ekspor *(FOB, LCL, Phytosanitary)*. Dapat dicari, difilter kategori, dan menajamkan intuisi para staf ekspor di internal.

### 7. 🔗 Sheets Integration (Konektivitas Spreadsheet)
Melihat visibilitas data cadangan; memonitor sukses pelaporan aktivitas dari aplikasi Nandara CIIS hacia *database* klasik tim melalui Google Apps Script Webhook. Menampilkan dasbor metrik interaktif jumlah "row" *spreadsheet* cadangan.

### 8. 🎓 Coffee Curriculum
*Knowledge Base* terintegrasi. Modul edukasi budidaya hingga pemrosesan biji pascapanen agar tiap anggota perusahaan mengekspor dengan fondasi literasi produk yang matang.

### 9. 🌐 Google Translate Integration Global 
Opsi pergantian instan ke Bahasa Inggris, Indonesia, Mandarin, Jerman, hingga Jepang untuk fleksibilitas operator maupun jika layar dipresentasikan *(showcasing)* pada pihak multi-nasional.

## 🚀 Panduan Instalasi Lokal & Setup VS Code

Sistem ini dikonstruksi modern dan tangguh menggunakan **React (Vite), TypeScript**, dan rancang tampilan komprehensif **Tailwind CSS**.

### Prasyarat
- **Node.js** versi stabil (18.x ++).
- Sistem manajer paket seperti **npm**, **pnpm**, **bun**, atau **yarn**.

### Langkah Peluncuran Pangkalan Dev

1. Ekstrak *source code* (unduhan dari ruang _builder_) Anda dan buka foldernya memakai Visual Studio Code.
2. Luncurkan instans terminal *(Ctrl+`)*, untuk mengambil modul dependensi inti:
   ```bash
   npm install
   ```
3. *(Opsional)* Susunlah Environment Variabel Anda.
   ```bash
   cp .env.example .env
   ```
4. Putar *local development server* vite untuk modifikasi dan pengetesan *Hot Reload*:
   ```bash
   npm run dev
   ```
5. Kunjungi alamat *localhost* yang tersedia misal `http://localhost:5173`. 

---

### 🏗 Deploy ke Netlify

Berkas `netlify.toml` telah siap pakai dalam repositori.

1. Unggah (*push*) folder ini ke repositori Github / Gitlab / Bitbucket Anda.
2. Hubungkan layanan Netlify melalui dasbor mereka kepada *repository* terunggah ini.
3. Seluruh *routing*, arahan SPA (*Single Page Application* React), dan sistem build otomatis akan berintegrasi transparan memproduksi map `/dist` ke publik internet tanpa butuh penyelarasan perintah lanjutan.  
*(Catatan: Pastikan perintah build pada Netlify disetel ke `npm run build` dan path terpublikasi `dist`)*.
