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

Untuk mencoba stack ini di laptop (port `8000` pindah ke `18000` dan cookie
`lax`/non-secure), tambahkan override sementara:

```bash
docker compose -p facilitydeploytest \
  --env-file .env.test \
  -f docker-compose.prod.yaml -f override.yaml up -d --build
```

Isi `override.yaml` minimal: `api.ports: ["18000:8000"]`,
`SESSION_SAME_SITE=lax`, `SESSION_SECURE_COOKIE=false`,
`SANCTUM_STATEFUL_DOMAINS=localhost:18000,127.0.0.1:18000`.
Setelah selesai: `docker compose -p facilitydeploytest ... down -v`.

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
| `SANCTUM_STATEFUL_DOMAINS` | `app.contoh.ac.id` | Tanpa skema, pisahkan koma. **Wajib**, lihat catatan di bawah |
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

### Kalau login 200 tetapi request berikutnya 401

Penyebab paling umum: `SANCTUM_STATEFUL_DOMAINS` tidak memuat domain frontend yang
benar. Sanctum lalu menganggap request **bukan** dari frontend, session guard tidak
diaktifkan, `Auth::attempt()` tidak menyimpan user ke sesi, dan tabel `sessions`
hanya berisi baris dengan `user_id = NULL`.

Cek cepat:

```sql
select id, user_id, ip_address from sessions order by last_activity desc limit 5;
```

Semua `user_id` NULL setelah login berarti env di atas salah. Set domain frontend
(tanpa skema) lalu **redeploy** agar `config:cache` ulang. Middleware
`EnsureFrontendRequestsAreStateful` dicocokkan dengan header `Origin`/`Referer`,
jadi minta browser mengirimnya (fetch bawaan aplikasi sudah begitu).

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
- `SESSION_DRIVER=database` dipakai justru karena `artisan serve` menangani
  request lewat banyak proses; `file` membuat sesi login tidak terbaca pada
  request berikutnya. `CACHE_STORE=file` tetap hanya aman untuk satu instance——
  ganti ke `database` atau `redis` kalau replika lebih dari satu.
- `storage/app/public` bersifat sementara di platform tanpa volume
  (Railway, Vercel). Foto bukti akan hilang setiap deploy ulang; pasang volume
  atau pakai object storage (S3/R2) untuk data permanen.
- Pencarian lokasi memakai Nominatim publik (batas ±1 request/detik). Untuk
  produksi, ganti dengan provider berbayar atau data lokasi kampus sendiri.
- Laporan mewajibkan GPS di dalam radius kampus. Pastikan kebijakan ini memang
  diinginkan sebelum dipakai pengguna nyata.
