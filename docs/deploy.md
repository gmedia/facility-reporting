# Deploy

Project ini terdiri dari dua bagian yang harus online bersamaan:

| Bagian | Isi | Host yang dipakai |
|---|---|---|
| `apps/web` | React + Vite (SPA) | Vercel |
| `apps/api` | Laravel 13 / PHP 8.5 + PostgreSQL | Railway, Render, atau VPS (Docker) |

API **tidak bisa** dijalankan di Vercel karena Vercel tidak menyediakan runtime PHP dan filesystem-nya tidak permanen.

---

## 1. Deploy API

### Railway

1. Buat project baru, pilih **Deploy from GitHub repo** → `gmedia/facility-reporting`.
2. Di service API, set **Root Directory** ke `apps/api`
   (kalau tidak bisa, set env `RAILWAY_DOCKERFILE_PATH=apps/api/Dockerfile` dan build context ke root repo).
3. Tambahkan plugin **PostgreSQL**. Railway mengisi `DATABASE_URL`, tetapi project ini memakai variabel terpisah, jadi isi manual:
   - `DB_CONNECTION=pgsql`
   - `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` dari tab Connect.
4. Isi environment lain (lihat tabel di bagian 3). Minimal:
   - `APP_ENV=production`
   - `APP_DEBUG=false`
   - `APP_KEY=` → generate dengan `php artisan key:generate --show` di lokal, lalu tempel hasilnya.
   - `APP_URL=https://<domain-api>`
   - `FRONTEND_URL=https://<domain-web>`
   - `SANCTUM_STATEFUL_DOMAINS=<domain-web tanpa https>`
5. Tambahkan **Volume** dan mount ke `/var/www/html/storage/app/public`.
   Tanpa ini, foto laporan hilang setiap container dibuat ulang.
6. Deploy pertama: set `RUN_MIGRATIONS=true`. Setelah migrasi berhasil, kembalikan ke `false`
   supaya setiap restart tidak menjalankan migrasi.
7. Healthcheck path: `/api/v1/status`.

### VPS dengan Docker

```bash
cp apps/api/.env.production.example .env.prod
# isi APP_KEY, APP_URL, DB_PASSWORD, FRONTEND_URL, SANCTUM_STATEFUL_DOMAINS
docker compose --env-file .env.prod -f docker-compose.prod.yaml up -d --build
```

Letakkan reverse proxy (Caddy/Nginx) di depan port `8000` untuk menangani HTTPS.

---

## 2. Deploy web ke Vercel

1. Import repo `gmedia/facility-reporting`.
2. **Root Directory**: biarkan di root repo (karena memakai pnpm workspace).
3. Build & output sudah diatur di `vercel.json`:
   - Install: `pnpm install --frozen-lockfile`
   - Build: `pnpm --dir apps/web build`
   - Output: `apps/web/dist`
4. Tambahkan environment variable untuk **Production** dan **Preview**:
   ```
   VITE_API_BASE_URL=https://<domain-api>/api/v1
   ```
5. Deploy, lalu buka `https://<domain-web>/login`.

Kalau `VITE_API_BASE_URL` salah, aplikasi tetap tampil tetapi semua request gagal
(login, daftar laporan, foto).

---

## 3. Environment penting

| Variabel | Contoh | Catatan |
|---|---|---|
| `APP_KEY` | `base64:...` | Wajib. Jangan pernah commit |
| `APP_URL` | `https://api.contoh.ac.id` | Dipakai untuk URL storage |
| `FRONTEND_URL` | `https://app.contoh.ac.id` | CORS |
| `SANCTUM_STATEFUL_DOMAINS` | `app.contoh.ac.id` | Tanpa skema, pisahkan koma |
| `SESSION_SAME_SITE` | `lax` / `none` | Lihat tabel di bawah |
| `SESSION_SECURE_COOKIE` | `true` | Wajib `true` di HTTPS |
| `DB_*` | | PostgreSQL |
| `RUN_MIGRATIONS` | `false` | `true` hanya saat perlu migrasi |

### Cookie dan domain

| Posisi web & API | `SESSION_SAME_SITE` | Catatan |
|---|---|---|
| Satu domain / subdomain (`app.contoh.ac.id` + `api.contoh.ac.id`) | `lax` | Paling aman dan paling stabil |
| Beda domain (`*.vercel.app` + `*.railway.app`) | `none` | Wajib HTTPS. Safari bisa memblokir cookie pihak ketiga |

Kalau ingin menghindari `SameSite=None`, arahkan salah satu domain ke domain sendiri
(mis. `app.gmedia.id` + `api.gmedia.id`), atau proxy `/api` lewat Vercel `rewrites`.

---

## 4. Foto dan storage

- Foto disimpan di disk `public` (`storage/app/public`).
- Di container, direktori itu **wajib** volume permanen.
- `public/storage` dibuat otomatis oleh entrypoint (`php artisan storage:link`).
- Kalau nanti pindah ke beberapa instance, pindahkan storage ke S3/R2 dan set
  disk default ke `s3`.

---

## 5. Jangan dilakukan di production

- `php artisan migrate:fresh` — menghapus seluruh data.
- `php artisan db:seed` tanpa membaca seeder — `DemoLaporanSeeder` membuat akun
  dengan password `password`.
- Menjalankan dengan `APP_DEBUG=true`.
- Commit `.env` asli.

---

## 6. Checklist setelah deploy

1. `GET https://<api>/api/v1/status` → `{"data":{"status":"ok"}}`
2. Buka `/login`, login sebagai mahasiswa → dashboard tampil.
3. Buat laporan + upload foto → foto bisa dibuka dari `/storage/...`.
4. Login admin → verifikasi laporan → ubah status.
5. Login super admin → halaman Lokasi Akun → peta dan tabel pelapor tampil.
6. Cek `storage/logs/laravel.log` tidak berisi error.

---

## 7. Batasan yang diketahui

- Image API memakai `php artisan serve` (satu proses). Cukup untuk demo dan
  penggunaan kecil; untuk trafik lebih besar ganti ke php-fpm + nginx atau Octane.
- `SESSION_DRIVER=file` dan `CACHE_STORE=file` hanya aman untuk satu instance.
- Pencarian lokasi memakai Nominatim publik (batas ±1 request/detik). Untuk
  produksi, ganti dengan provider berbayar atau data lokasi kampus sendiri.
- Laporan mewajibkan GPS di dalam radius kampus. Pastikan kebijakan ini memang
  diinginkan sebelum dipakai pengguna nyata.
