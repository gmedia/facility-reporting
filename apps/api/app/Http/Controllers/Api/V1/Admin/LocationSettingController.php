<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Admin\UpdateLocationSetting;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\UpdateLocationSettingRequest;
use App\Http\Resources\Api\V1\LocationSettingResource;
use App\Models\LocationSetting;

final class LocationSettingController extends Controller
{
    /**
     * Ambil titik pusat dan radius saat ini.
     */
    public function show(): LocationSettingResource
    {
        return new LocationSettingResource(LocationSetting::current());
    }

    /**
     * Simpan titik pusat dan radius baru.
     */
    public function update(
        UpdateLocationSettingRequest $request,
        UpdateLocationSetting $action,
    ): LocationSettingResource {
        return new LocationSettingResource(
            $action($request->toDTO(), $request->user()),
        );
    }
}
