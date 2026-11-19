<?php

declare(strict_types=1);

namespace App\Actions\Profile;

use App\Data\UserLocationData;
use App\Models\User;

final class UpdateMyLocation
{
    public function __invoke(UserLocationData $data, User $user): void
    {
        $user->forceFill([
            'last_lat' => $data->lat,
            'last_lng' => $data->lng,
            'last_location_at' => now(),
        ])->save();
    }
}