<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\User;

/**
 * Aktifkan kembali akun admin yang telah dinonaktifkan.
 *
 * Setelah diaktifkan, akun dapat login lagi menggunakan kredensial yang lama.
 */
final class ActivateUser
{
    public function __invoke(User $user): User
    {
        $user->forceFill(['active' => true])->save();

        return $user;
    }
}
