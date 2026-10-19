<?php

declare(strict_types=1);

namespace App\Actions\Laporan;

use App\Enums\UserRole;
use App\Models\Laporan;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

final class ListLaporan
{
    /**
     * List reports visible to the given user.
     *
     * A regular user only ever sees their own reports; admins and super
     * admins see every report.
     *
     * @return Collection<int, Laporan>
     */
    public function __invoke(User $user): Collection
    {
        $query = Laporan::query()->with('user')->latest('id');

        if ($user->role === UserRole::User->value) {
            $query->where('user_id', $user->id);
        }

        return $query->get();
    }
}
