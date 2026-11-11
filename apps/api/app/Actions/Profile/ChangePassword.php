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
     */
    public function __invoke(ChangePasswordData $data, User $user): User
    {
        $user->password = $data->password;
        $user->save();

        return $user->fresh();
    }
}
