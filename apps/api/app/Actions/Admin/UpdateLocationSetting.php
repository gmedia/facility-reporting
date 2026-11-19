<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Data\LocationSettingData;
use App\Models\LocationSetting;
use App\Models\User;

final class UpdateLocationSetting
{
    public function __invoke(LocationSettingData $data, User $actor): LocationSetting
    {
        $setting = LocationSetting::current();

        $setting->forceFill([
            'center_lat' => $data->centerLat,
            'center_lng' => $data->centerLng,
            'radius_m' => $data->radiusM,
            'updated_by' => $actor->id,
        ])->save();

        return $setting->fresh();
    }
}