<?php

declare(strict_types=1);

namespace App\Data;

use Illuminate\Http\UploadedFile;

final readonly class UpdateLaporanBuktiData
{
    public function __construct(
        public UploadedFile $fotoBukti,
    ) {}
}
