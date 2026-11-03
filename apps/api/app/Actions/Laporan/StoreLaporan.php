<?php

declare(strict_types=1);

namespace App\Actions\Laporan;

use App\Data\StoreLaporanData;
use App\Models\Laporan;
use App\Services\PrioritasService;

final class StoreLaporan
{
    public function __construct(
        private readonly PrioritasService $prioritasService,
    ) {}

    public function __invoke(StoreLaporanData $data, int $userId): Laporan
    {
        $prioritas = null;
        if ($data->nilai_kerusakan !== null
            && $data->nilai_risiko !== null
            && $data->nilai_dampak !== null
            && $data->nilai_frekuensi !== null) {
            $prioritas = $this->prioritasService->hitung(
                $data->nilai_kerusakan,
                $data->nilai_risiko,
                $data->nilai_dampak,
                $data->nilai_frekuensi,
            );
        }

        return Laporan::create([
            'user_id' => $userId,
            'kategori' => $data->kategori,
            'lokasi' => $data->lokasi,
            'deskripsi' => $data->deskripsi,
            'foto' => $data->foto,
            'nilai_kerusakan' => $data->nilai_kerusakan,
            'nilai_risiko' => $data->nilai_risiko,
            'nilai_dampak' => $data->nilai_dampak,
            'nilai_frekuensi' => $data->nilai_frekuensi,
            'skor_prioritas' => $prioritas?->skor,
            'prioritas_kategori' => $prioritas?->kategori?->value,
        ]);
    }
}
