# Data Mahasiswa untuk `MahasiswaSeeder`

Taruh file `.csv` atau `.tsv` di folder ini (isinya tidak di-commit).
Seeder membaca **semua** file `.csv`/`.tsv` di folder ini.

## Format

Lihat `contoh-mahasiswa.csv.example`. Kolom yang dipakai seeder:

| Header (wajib persis) | Wajib | Keterangan |
| --------------------- | ----- | ---------- |
| `NIM`                 | ya    | unik, dipakai sebagai kunci `updateOrCreate` |
| `Nama`                | ya    | nama lengkap |
| `Email`               | tidak | kalau kosong disimpan `NULL` |

Kolom lain (`No.`, `Angkatan`, `Prodi`, `JK`, `HP`, `Status`) diabaikan.
Baris dengan jumlah kolom tidak cocok dengan header dilewati.

Password semua akun di-set `password` dan role `user`.

## Pakai

```bash
cp contoh-mahasiswa.csv.example data-mahasiswa.csv   # lalu isi data asli
php artisan db:seed --class=MahasiswaSeeder
```

Aman dijalankan berkali-kali: akun dicocokkan berdasarkan `NIM`, tidak duplikat.
