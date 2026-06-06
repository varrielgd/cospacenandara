# Panduan Deployment Railway - Nandara CIIS

Ikuti langkah-langkah ini untuk mendeploy aplikasi Coffee Importer Intelligence System ke Railway.

## 🏗 Persiapan Repository
1. Pastikan seluruh perubahan sudah di-push ke GitHub: `https://github.com/nanmontierra/nandaracorporation`.
2. Pastikan file `dist/` (frontend) dan `dist/` (backend) tidak masuk ke `.gitignore` atau Railway akan melakukan build ulang secara otomatis.

## 1. Deploy Database (MySQL/PostgreSQL)
1. Buka [Railway.app](https://railway.app).
2. Klik **New Project** -> **Provision MySQL** (atau PostgreSQL sesuai `.env`).
3. Tunggu hingga database siap. Salin `DATABASE_URL` yang diberikan.

## 2. Deploy Backend
1. Klik **New Service** -> **GitHub Repo**.
2. Pilih repository `nandaracorporation`.
3. Masuk ke tab **Settings** -> **Root Directory**: ubah menjadi `/backend`.
4. Masuk ke tab **Variables** dan tambahkan:
   - `DATABASE_URL`: (Dari langkah database di atas)
   - `JWT_SECRET`: (Kunci rahasia random)
   - `GEMINI_API_KEY`: (Kunci API Gemini Anda)
   - `GROQ_API_KEY`: (Kunci API Groq Anda)
   - `SMTP_USER`: `marketing@nandaranusamontierra.com`
   - `SMTP_PASS`: `Ghfso#!@!5246!#!@g7`
   - `FRONTEND_URL`: `https://support.nandaranusamontierra.com`
5. Railway akan mendeteksi `package.json` dan menjalankan `npm install && npm run build && npm start`.
   
   Catatan: Pastikan `npm run build` di folder backend melakukan `prisma generate` (saat ini ada di `backend/package.json` sebagai `prisma generate && tsc`).


## 3. Deploy Frontend
1. Klik **New Service** -> **GitHub Repo**.
2. Pilih repository `nandaracorporation` lagi.
3. Masuk ke tab **Settings** -> **Root Directory**: biarkan di `/` (root).
4. Masuk ke tab **Variables** dan tambahkan:
   - `VITE_API_URL`: (URL Backend Railway yang baru saja dibuat, contoh: `https://backend-production-xyz.up.railway.app`)
5. Di **Settings**, atur **Domain**: Tambahkan `support.nandaranusamontierra.com`.
6. Railway akan mendeteksi Vite dan menjalankan build otomatis.

## 4. Finalisasi (Custom Domain)
1. Di Railway Frontend Service, buka tab **Settings** -> **Domains**.
2. Tambahkan `support.nandaranusamontierra.com`.
3. Anda akan mendapatkan nilai `CNAME` dari Railway.
4. Buka panel DNS Hostinger/Cloudflare Anda dan tambahkan record:
   - Type: `CNAME`
   - Name: `support`
   - Value: (Nilai CNAME dari Railway)

---
**Catatan Penting**: Karena aplikasi ini menggunakan `http-proxy-middleware` di [server.ts](file:///server.ts), pastikan backend sudah berjalan sebelum frontend mencoba melakukan koneksi API.
