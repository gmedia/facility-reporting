<?php

declare(strict_types=1);

namespace App\Data;

final readonly class StoreLaporanData
{
    public function __construct(
        public string $kategori,
        public string $lokasi,
        public string $deskripsi,
        public ?string $foto = null,
    ) {}
}
