<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use App\Data\StoreLaporanData;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreLaporanRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'kategori' => ['required', 'string', 'max:100'],
            'lokasi' => ['required', 'string', 'max:255'],
            'deskripsi' => ['required', 'string', 'min:10', 'max:2000'],
        ];
    }

    public function toDTO(): StoreLaporanData
    {
        return new StoreLaporanData(
            kategori: $this->validated('kategori'),
            lokasi: $this->validated('lokasi'),
            deskripsi: $this->validated('deskripsi'),
        );
    }
}
