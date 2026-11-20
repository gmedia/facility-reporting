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

        // Password baru ini ditetapkan super admin, bukan oleh pemilik akun.
        // Kosongkan penandanya supaya admin yang bersangkutan diingatkan
        // untuk menggantinya saat login berikutnya.
        if ($data->password !== null) {
            $user->forceFill(['password_changed_at' => null])->save();
        }

        return $user->fresh();
    }
}
