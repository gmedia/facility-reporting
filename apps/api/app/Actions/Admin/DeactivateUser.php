<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\User;

/**
 * Nonaktifkan akun admin tanpa menghapus datanya.
 *
 * Beda dengan DeleteUser: laporan dan riwayat status yang terhubung ke user
 * tetap utuh. Supaya akun yang dinonaktifkan tidak terus memakai sesi yang
 * masih hidup, semua token Sanctum miliknya ikut dicabut.
 */
final class DeactivateUser
{
    public function __invoke(User $user): User
    {
        $user->forceFill(['active' => false])->save();
        $user->tokens()->delete();

        return $user;
    }
}
