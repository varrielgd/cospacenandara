# Update ENV untuk Vercel (Frontend)

Karena file `.env*` dianggap tidak boleh diedit lewat tool, lakukan update ini langsung di Vercel melalui UI.

## Yang perlu ditambahkan
Tambahkan environment variable berikut di **Vercel Project (frontend)** (Production):

- `VITE_API_BASE_URL` = `https://nandara-backend.onrender.com`

## Catatan
- Frontend menggunakan `src/utils/api.ts`:
  - default `http://localhost:4000` jika `VITE_API_BASE_URL` tidak diset
  - jadi wajib set agar request API mengarah ke backend publik.

