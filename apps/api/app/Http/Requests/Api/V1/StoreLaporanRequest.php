<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use App\Data\StoreLaporanData;
use App\Enums\LaporanKategori;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
     * `foto` wajib sejak 26 Okt 2026: form di frontend sudah menolak
     * pengiriman tanpa foto, dan aturan ini menutup bypass lewat client
     * lain. Kolom `laporans.foto` tetap nullable di database karena ada
     * laporan yang dibuat sebelum aturan ini berlaku dan memang tidak
     * memiliki foto.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'kategori' => ['required', 'string', Rule::enum(LaporanKategori::class)],
            'lokasi' => ['required', 'string', 'max:255'],
            'deskripsi' => ['required', 'string', 'min:10', 'max:2000'],
            'foto' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ];
    }

    public function toDTO(): StoreLaporanData
    {
        $foto = null;
        if ($this->hasFile('foto')) {
            $fotoPath = $this->file('foto')->store('laporan', 'public');
            $foto = $fotoPath !== false ? $fotoPath : null;
        }

        return new StoreLaporanData(
            kategori: $this->validated('kategori'),
            lokasi: $this->validated('lokasi'),
            deskripsi: $this->validated('deskripsi'),
            foto: $foto,
        );
    }
}
