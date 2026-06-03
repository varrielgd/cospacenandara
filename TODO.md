# TODO List & Development Roadmap
Aplikasi "Nandara Nusa Montierra - Coffee Importer Intelligence System"

## 🔴 WAJIB (MANDATORY SEBELUM PRODUCTION)
- [ ] **Migrasi Database**: Saat ini data `leads`, `emails`, `samples`, dan `quotations` disimpan secara lokal menggunakan `localStorage`. Di VS Code, Anda wajib memindahkan state ini agar terkoneksi secara aman ke Firebase Firestore, Supabase, PostgreSQL, atau backend database sungguhan.
- [ ] **Implementasi Autentikasi Pengguna**: Tambahkan autentikasi (login/register) menggunakan Firebase Auth, NextAuth, atau framework lainnya sebelum pengguna dapat mengakses dasbor, karena data transaksi klien bersifat sangat rahasia.
- [ ] **Backend API / Server Lapis**: Jika memerlukan sinkronisasi email berkapasitas besar, pembuatan token aman OAuth 2.0 (Google Sheets API), atau logic server khusus, Anda wajib membangun back-end (misal: Node.js/Express). Hindari mengekspos API Keys rahasia di dalam _frontend_.
- [ ] **Integrasi Email Provider**: Sambungkan API layanan email (SendGrid, Mailgun, AWS SES, atau Nodemailer) sehingga fitur Email Generator bukan sekadar membuat draf teks yang harus di _copy-paste_, namun benar-benar bisa menembakkan pesan langsung ke kotak masuk klien.

## 🟡 ENHANCEMENTS & FITUR LANJUTAN
- [ ] **Autentikasi Google Sheets**: Pada prototipe ini, integrasi ke Sheets diatur melalui Google Apps Script Webhook. Kedepannya bisa diganti menggunakan standar Google Cloud Console OAuth 2.0 (Google Sheets API).
- [ ] **Pembuatan PDF Berkualitas (Invoice Generation)**: Integrasikan plugin atau package seperti `jspdf` atau `html2pdf.js` untuk membuat export file format PDF sungguhan pada saat menekan "Export PDF" di Modul Penawaran (Quotation).
- [ ] **Bot Notifikasi atau Cron Jobs**: Buat *service background* yang memberikan peringatan/notification otomatis ke WhatsApp atau Email internal saat "Jadwal Follow Up" _Leads_ jatuh tempo, atau peringatan sampel bermutu rendah.
- [ ] **Multi-Language Standar Industri (i18n)**: Saat ini peralihan bahasa mengandalkan `google_translate_element` widget. Secara fungsional cukup praktis, namun secara *best-practice enterprise*, direkomendasikan menginstal modul seperti `react-i18next` dengan JSON terpusat.

## 🟢 UI / UX REFINEMENTS
- [ ] **Optimalisasi Responsivitas Lanjutan (Mobile Layout)**: Sesuaikan dan uji lebih mendalam _grid_, tabel, _sidebar_, dan tampilan modul lain pada perangkat layar kecil/gadget agar teratur 100%.
- [ ] **Analitik Chart Visual**: Sematkan grafik analitik lebih profesional dengan library seperti `recharts` atau `chart.js` agar data _Dashboard_ dapat diklik secara interaktif.
- [ ] **Cloud File Upload**: Integrasikan wadah penyimpanan cloud (contoh: AWS S3 atau Firebase Storage) apabila aplikasi rencananya dapat mengunggah (upload) dokumen, gambar sampel biji kopi, atau kontrak jual beli secara langsung.
