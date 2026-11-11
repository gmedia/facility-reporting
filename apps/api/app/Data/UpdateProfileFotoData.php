<?php

declare(strict_types=1);

namespace App\Data;

use Illuminate\Http\UploadedFile;

final readonly class UpdateProfileFotoData
{
    public function __construct(
        public UploadedFile $foto,
    ) {}
}
