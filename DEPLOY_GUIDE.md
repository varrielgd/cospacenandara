# Pandaran Deployment Guide (Last Update: 2026-06-05)
Aplikasi Nandara Corporation sekarang dikonfigurasi untuk koneksi langsung ke backend.

## 1. Persiapan Database (Supabase)
Sangat disarankan menggunakan **Connection Pooling** untuk deployment cloud agar koneksi lebih stabil.

1.  Buka Dashboard Supabase > Settings > Database.
2.  Cari bagian **Connection String** dan pilih tab **Transaction** (Bukan Session).
3.  URL-nya akan menggunakan port **6543**. Contoh:
    `postgresql://postgres.cavaopitgwwxfpptnwcw:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require`

---

## 2. Deploy Backend (Render.com)
Backend akan dihosting di Render karena mendukung proses Node.js yang berjalan terus-menerus.

1.  **Buat Akun**: Daftar di [Render.com](https://render.com) dan hubungkan dengan akun GitHub Anda.
2.  **New Web Service**: Klik tombol **New +** > **Web Service**.
3.  **Pilih Repositori**: Pilih `nandaraoffice`.
4.  **Konfigurasi**:
    *   **Name**: `nandara-backend`
    *   **Root Directory**: `backend` (Sangat Penting!)
    *   **Environment**: `Node`
    *   **Build Command**: `npm install && npx prisma generate && npx prisma db push && npm run build`
    *   **Start Command**: `npm start`
5.  **Environment Variables**:
    *   `DATABASE_URL`: (Gunakan URL Transaction/Pooler dari langkah 1 di atas, port 6543)
    *   **PENTING**: Tambahkan `?sslmode=require` jika belum ada di akhir URL.
    *   `PORT`: `10000`
    *   `NODE_ENV`: `production`
    *   `JWT_SECRET`: (Rahasia Anda)
    *   `GEMINI_API_KEY`: (Key Anda)
    *   `GROQ_API_KEY`: (Key Anda)
    *   (Masukkan juga config SMTP & IMAP Hostinger Anda)
6.  **PENTING (Whitelist IP)**:
    Jika masih muncul error "Can't reach database", Anda harus mengizinkan akses dari semua IP di Supabase sementara waktu:
    *   Dashboard Supabase > Settings > Database > Network Restrictions.
    *   Klik **Disable Restrictions** atau tambahkan `0.0.0.0/0`. (Render memiliki IP yang berubah-ubah).
6.  **Deploy**: Klik **Create Web Service**. Tunggu hingga muncul status "Live".
7.  **Catat URL**: Ambil URL backend Anda (misal: `https://nandara-backend.onrender.com`).

---

## 3. Deploy Frontend (Vercel.com)
Frontend akan dihosting di Vercel yang sangat cepat untuk aplikasi React.

1.  **Buat Akun**: Daftar di [Vercel.com](https://vercel.com) menggunakan akun GitHub.
2.  **Add New**: Klik **Add New** > **Project**.
3.  **Import Repositori**: Pilih `nandaraoffice`.
4.  **Konfigurasi Framework**:
    *   **Framework Preset**: `Vite`
    *   **Root Directory**: `./` (Biarkan default)
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
5.  **Environment Variables**: Masukkan variabel dari file `.env` root:
    *   `VITE_API_URL`: `https://nandara-backend.onrender.com/api` (Sudah diperbarui dengan URL riil Anda)
    *   `DISABLE_HMR`: `true`
6.  **Deploy**: Klik **Deploy**.

---

## 4. Penyesuaian Terakhir (Proxy & CORS)
Saya telah memperbarui file [vercel.json](file:///d:/AI/app/nandaraoffice/vercel.json) di root project. File ini sekarang secara khusus mengarah ke URL backend Anda yang baru: `https://nandara-backend.onrender.com`.

**PENTING**: Jika nanti Anda mengganti URL backend di Render, Anda **wajib** mengubah alamat `destination` di file `vercel.json` dan melakukan `git push` ulang agar Vercel mengenali alamat barunya.

---

## 5. Cara Update Kode
Setiap kali Anda melakukan perubahan di komputer lokal:
1.  `git add .`
2.  `git commit -m "update fitur baru"`
3.  `git push origin main`

Vercel dan Render akan otomatis mendeteksi perubahan tersebut dan melakukan deploy ulang (Auto-deploy).
