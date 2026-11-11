<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use App\Data\UpdateProfileFotoData;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileFotoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Aturannya sengaja identik dengan foto bukti laporan (StoreLaporanRequest):
     * satu aturan upload foto di seluruh aplikasi.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'foto' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ];
    }

    public function toDTO(): UpdateProfileFotoData
    {
        return new UpdateProfileFotoData(
            foto: $this->file('foto'),
        );
    }
}
