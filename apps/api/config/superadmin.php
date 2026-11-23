<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Akun Superadmin Awal
    |--------------------------------------------------------------------------
    |
    | Nilai bawaan untuk `php artisan app:create-superadmin` saat dijalankan
    | otomatis (tanpa opsi CLI dan tanpa interaksi), mis. dari job rilis.
    | Opsi CLI selalu menang atas nilai di sini.
    |
    | Dibaca lewat config() — bukan env() langsung di command — karena pada
    | produksi konfigurasi di-cache dan env() di luar folder config akan
    | mengembalikan null.
    |
    */

    'email' => env('SUPERADMIN_EMAIL', ''),

    'name' => env('SUPERADMIN_NAME', 'Super Admin'),

    'password' => env('SUPERADMIN_PASSWORD', ''),

];
