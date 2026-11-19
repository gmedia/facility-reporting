<?php

declare(strict_types=1);

namespace App\Data;

final readonly class UserLocationData
{
    public function __construct(
        public float $lat,
        public float $lng,
    ) {}
}