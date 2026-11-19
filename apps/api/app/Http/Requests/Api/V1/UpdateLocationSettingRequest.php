<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use App\Data\LocationSettingData;
use Illuminate\Foundation\Http\FormRequest;

final class UpdateLocationSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Akses dibatasi oleh middleware super_admin di routes.
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'center_lat' => ['required', 'numeric', 'between:-90,90'],
            'center_lng' => ['required', 'numeric', 'between:-180,180'],
            'radius_m' => ['required', 'integer', 'between:50,5000'],
        ];
    }

    public function toDTO(): LocationSettingData
    {
        return new LocationSettingData(
            centerLat: (float) $this->validated('center_lat'),
            centerLng: (float) $this->validated('center_lng'),
            radiusM: (int) $this->validated('radius_m'),
        );
    }
}