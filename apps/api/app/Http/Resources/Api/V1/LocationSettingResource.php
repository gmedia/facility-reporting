<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Models\LocationSetting;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin LocationSetting
 */
final class LocationSettingResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'center_lat' => $this->center_lat,
            'center_lng' => $this->center_lng,
            'radius_m' => $this->radius_m,
            'updated_at' => $this->updated_at,
        ];
    }
}