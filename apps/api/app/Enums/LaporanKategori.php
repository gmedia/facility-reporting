<?php

declare(strict_types=1);

namespace App\Enums;

enum LaporanKategori: string
{
    case Elektronik = 'elektronik';
    case Furnitur = 'furnitur';
    case Mekanik = 'mekanik';
    case Bangunan = 'bangunan';
    case Lainnya = 'lainnya';
}
