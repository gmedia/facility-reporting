# Seeder

Akun yang dibuat seeder demo (password semuanya `password`, hanya untuk demo lokal):

| Email | Password | Role |
|---|---|---|
| superadmin@facility.test | password | super_admin |
| admin@facility.test | password | admin |
| mahasiswa@facility.test | password | user |

`DemoLaporanSeeder` menambahkan 10 laporan contoh dengan empat nilai SMART 1-5,
skor prioritas hasil `PrioritasService`, variasi status, dan riwayat status.
Semua seeder idempotent, aman dijalankan berulang.

```bash
php artisan db:seed                        # semua seeder
php artisan db:seed --class=DemoLaporanSeeder
php artisan migrate:fresh --seed           # hanya di database lokal
```

> Password di atas khusus data demo. Untuk produksi, super admin dibuat lewat
> `SEED_SUPERADMIN_EMAIL` dan `SEED_SUPERADMIN_PASSWORD` (lihat `.env.production.example`).
