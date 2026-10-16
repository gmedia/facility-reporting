<?php

declare(strict_types=1);

namespace App\Actions\Laporan;

use App\Data\StoreLaporanData;
use App\Models\Laporan;

final class StoreLaporan
{
    public function __invoke(StoreLaporanData $data, int $userId): Laporan
    {
        return Laporan::create([
            'user_id' => $userId,
            'kategori' => $data->kategori,
            'lokasi' => $data->lokasi,
            'deskripsi' => $data->deskripsi,
            'foto' => $data->foto,
        ]);
    }
}
