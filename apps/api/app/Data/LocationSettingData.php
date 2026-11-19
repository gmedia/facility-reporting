<?php

declare(strict_types=1);

namespace App\Data;

final readonly class LocationSettingData
{
    public function __construct(
        public float $centerLat,
        public float $centerLng,
        public int $radiusM,
    ) {}
}