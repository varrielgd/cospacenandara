# TODO - Fix Email Sync 401 Invalid or expired token

## Plan disetujui
- `src/utils/api.ts`: tangani `401 Unauthorized` dengan menghapus token dan memicu event `auth:logout`.
- `src/App.tsx`: listen event `auth:logout` dan jalankan `handleLogout()`.

## Steps
- [x] Update `src/utils/api.ts` untuk auto-logout saat 401.
- [x] Update `src/App.tsx` untuk handle event `auth:logout`.
- [x] Jalankan lint/build dan uji flow Sync Inbox.

