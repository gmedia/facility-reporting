<?php

declare(strict_types=1);

namespace App\Data;

use App\Enums\PrioritasKategori;

final readonly class PrioritasData
{
    public function __construct(
        public float $skor,
        public PrioritasKategori $kategori,
    ) {}
}
