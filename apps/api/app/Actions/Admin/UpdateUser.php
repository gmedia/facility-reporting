<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Data\UpdateUserData;
use App\Models\User;

final class UpdateUser
{
    public function __invoke(UpdateUserData $data, User $user): User
    {
        $user->update(array_filter([
            'name' => $data->name,
            'email' => $data->email,
            'password' => $data->password,
        ], fn ($value) => $value !== null));

        return $user->fresh();
    }
}
