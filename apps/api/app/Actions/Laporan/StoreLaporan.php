<?php

declare(strict_types=1);

namespace App\Actions\Laporan;

use App\Data\StoreLaporanData;
use App\Models\Laporan;
use App\Models\User;
use App\Services\PrioritasService;
use Carbon\Carbon;

final class StoreLaporan
{
    public function __construct(
        private readonly PrioritasService $prioritasService,
    ) {}

    public function __invoke(StoreLaporanData $data, int $userId): Laporan
    {
        $prioritas = $this->prioritasService->hitung(
            $data->nilai_kerusakan,
            $data->nilai_risiko,
            $data->nilai_dampak,
            $data->nilai_frekuensi,
        );

        $laporan = Laporan::create([
            'user_id' => $userId,
            'kategori' => $data->kategori,
            'lokasi' => $data->lokasi,
            'latitude' => $data->latitude,
            'longitude' => $data->longitude,
            'deskripsi' => $data->deskripsi,
            'foto' => $data->foto,
            'nilai_kerusakan' => $data->nilai_kerusakan,
            'nilai_risiko' => $data->nilai_risiko,
            'nilai_dampak' => $data->nilai_dampak,
            'nilai_frekuensi' => $data->nilai_frekuensi,
            'skor_prioritas' => $prioritas->skor,
        ]);

        // Simpan lokasi GPS terakhir ke tabel users supaya super admin
        // bisa melihatnya di halaman /lokasi-akun.
        User::where('id', $userId)->update([
            'last_lat' => $data->latitude,
            'last_lng' => $data->longitude,
            'last_location_at' => Carbon::now(),
        ]);

        return $laporan;
    }
}
