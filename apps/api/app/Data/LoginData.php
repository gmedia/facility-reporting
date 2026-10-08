<?php

declare(strict_types=1);

namespace App\Data;

final readonly class LoginData
{
    public function __construct(
        public string $identifier,
        public string $password,
    ) {}
}
