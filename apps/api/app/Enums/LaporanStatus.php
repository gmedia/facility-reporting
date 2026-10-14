<?php

declare(strict_types=1);

namespace App\Enums;

enum LaporanStatus: string
{
    case MenungguVerifikasi = 'menunggu_verifikasi';
    case Valid = 'valid';
    case Ditolak = 'ditolak';
    case Diproses = 'diproses';
    case Selesai = 'selesai';
}
