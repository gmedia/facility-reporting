<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Data\StoreUserData;
use App\Enums\UserRole;
use App\Models\User;

final class CreateUser
{
    public function __invoke(StoreUserData $data): User
    {
        return User::create([
            'name' => $data->name,
            'email' => $data->email,
            'password' => $data->password,
            'role' => UserRole::Admin->value,
        ]);
    }
}
