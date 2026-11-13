<?php

declare(strict_types=1);

namespace App\Data;

final readonly class StoreLaporanData
{
    public function __construct(
        public string $kategori,
        public string $lokasi,
        public string $deskripsi,
        public int $nilai_kerusakan,
        public int $nilai_risiko,
        public int $nilai_dampak,
        public int $nilai_frekuensi,
        public ?string $foto = null,
    ) {}
}
