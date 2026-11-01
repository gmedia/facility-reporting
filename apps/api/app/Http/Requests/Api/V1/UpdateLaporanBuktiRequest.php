<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use App\Data\UpdateLaporanBuktiData;
use App\Enums\UserRole;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateLaporanBuktiRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = $this->user()?->role;

        return $role === UserRole::Admin->value || $role === UserRole::SuperAdmin->value;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'foto_bukti' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ];
    }

    public function toDTO(): UpdateLaporanBuktiData
    {
        return new UpdateLaporanBuktiData(
            fotoBukti: $this->file('foto_bukti'),
        );
    }
}
