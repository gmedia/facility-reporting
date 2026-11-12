<?php

declare(strict_types=1);

namespace App\Data;

use App\Enums\LaporanStatus;
use Illuminate\Http\UploadedFile;

final readonly class UpdateLaporanStatusData
{
    public function __construct(
        public LaporanStatus $status,
        public ?int $nilaiKerusakan = null,
        public ?int $nilaiRisiko = null,
        public ?int $nilaiDampak = null,
        public ?int $nilaiFrekuensi = null,
        public ?string $alasan = null,
        public ?UploadedFile $fotoBukti = null,
    ) {}
}
