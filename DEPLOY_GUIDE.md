# Panduan Deploy Nandara Corporation (CIIS)

Dokumen ini berisi langkah-langkah detail untuk mendeploy aplikasi Nandara Corporation ke Vercel (Frontend) dan Render (Backend) menggunakan Database Supabase (PostgreSQL).

## 1. Persiapan Database (Supabase)
Anda sudah memiliki database di Supabase. Pastikan URL berikut tersimpan:
`postgresql://postgres:zAbEMHyW7nA0uTdR@db.cavaopitgwwxfpptnwcw.supabase.co:5432/postgres`

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
    *   **Build Command**: `npm install && npx prisma generate && npm run build`
    *   **Start Command**: `npm start`
5.  **Environment Variables**: Klik tombol **Advanced** > **Add Environment Variable**. Masukkan semua isi dari file `backend/.env` Anda:
    *   `DATABASE_URL`: (URL Supabase Anda)
    *   `PORT`: `10000` (Render menggunakan port dinamis, atau biarkan kosong)
    *   `JWT_SECRET`: (Rahasia Anda)
    *   `GEMINI_API_KEY`: (Key Anda)
    *   `GROQ_API_KEY`: (Key Anda)
    *   (Masukkan juga config SMTP & IMAP Hostinger Anda)
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
