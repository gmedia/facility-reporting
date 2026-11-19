<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use App\Data\UserLocationData;
use Illuminate\Foundation\Http\FormRequest;

final class UpdateMyLocationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lng' => ['required', 'numeric', 'between:-180,180'],
        ];
    }

    public function toDTO(): UserLocationData
    {
        return new UserLocationData(
            lat: (float) $this->validated('lat'),
            lng: (float) $this->validated('lng'),
        );
    }
}