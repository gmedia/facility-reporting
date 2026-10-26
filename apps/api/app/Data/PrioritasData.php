<?php

declare(strict_types=1);

namespace App\Data;

final readonly class PrioritasData
{
    public function __construct(
        public float $skor,
        public string $kategori,
    ) {}
}
