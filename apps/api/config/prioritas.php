<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Bobot SMART
    |--------------------------------------------------------------------------
    |
    | Total seluruh bobot harus 1.00. Nilai kriteria memakai skala 1 sampai 5.
    |
    */

    'bobot' => [
        'kerusakan' => 0.35,
        'risiko' => 0.25,
        'dampak' => 0.25,
        'frekuensi' => 0.15,
    ],

    'skala' => [
        'min' => 1,
        'max' => 5,
    ],

    /*
    |--------------------------------------------------------------------------
    | Ambang kategori prioritas
    |--------------------------------------------------------------------------
    |
    | Skor dihitung dalam rentang 1.00 sampai 5.00, lalu dibulatkan dua desimal
    | sebelum dibandingkan dengan ambang di bawah ini.
    |
    */

    'kategori' => [
        'tinggi' => 4.00,
        'sedang' => 3.00,
    ],

];
