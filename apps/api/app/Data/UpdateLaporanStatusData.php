<?php

declare(strict_types=1);

namespace App\Data;

use App\Enums\LaporanStatus;

final readonly class UpdateLaporanStatusData
{
    public function __construct(
        public LaporanStatus $status,
    ) {}
}
