<?php

declare(strict_types=1);

namespace App\Data;

final readonly class ChangePasswordData
{
    public function __construct(
        public string $password,
    ) {}
}
