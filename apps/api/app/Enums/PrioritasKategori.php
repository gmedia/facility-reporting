<?php

declare(strict_types=1);

namespace App\Enums;

enum PrioritasKategori: string
{
    case Tinggi = 'tinggi';
    case Sedang = 'sedang';
    case Rendah = 'rendah';
}
