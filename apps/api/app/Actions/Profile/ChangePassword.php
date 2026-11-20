<?php

declare(strict_types=1);

namespace App\Actions\Profile;

use App\Data\ChangePasswordData;
use App\Models\User;

final class ChangePassword
{
    /**
     * Ganti password user. Pemeriksaan password lama sudah dilakukan oleh
     * rule `current_password` di ChangePasswordRequest; di sini cukup
     * menimpanya — cast `hashed` di model yang meng-hash.
     *
     * `password_changed_at` diisi di sini (bukan lewat hook model) supaya
     * hanya penggantian password oleh user yang dihitung. Rehash otomatis
     * saat login juga mengubah kolom `password`, dan tidak boleh dianggap
     * sebagai "sudah ganti password".
     */
    public function __invoke(ChangePasswordData $data, User $user): User
    {
        $user->password = $data->password;
        $user->setAttribute('password_changed_at', now());
        $user->save();

        return $user->fresh();
    }
}
