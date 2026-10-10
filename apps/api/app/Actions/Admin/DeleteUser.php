<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\User;

final class DeleteUser
{
    public function __invoke(User $user): void
    {
        $user->delete();
    }
}
