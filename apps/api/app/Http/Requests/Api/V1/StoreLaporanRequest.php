<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use App\Data\StoreLaporanData;
use App\Enums\LaporanKategori;
use App\Models\Laporan;
use App\Models\LocationSetting;
use App\Support\GeoDistance;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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
     * Keempat `nilai_*` wajib sejak 11 Nov 2026 (opsi A): mahasiswa
     * mengisi sendiri skala 1-5 saat melapor. Sebelumnya aturannya
     * `sometimes`, sehingga laporan dari form web selalu masuk tanpa
     * nilai dan `skor_prioritas` tersimpan `null` — prioritas SMART
     * tidak pernah terisi untuk laporan baru.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'kategori' => ['required', 'string', Rule::enum(LaporanKategori::class)],
            'lokasi' => ['required', 'string', 'max:255'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'deskripsi' => ['required', 'string', 'min:10', 'max:2000'],
            'foto' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'nilai_kerusakan' => ['required', 'integer', 'between:1,5'],
            'nilai_risiko' => ['required', 'integer', 'between:1,5'],
            'nilai_dampak' => ['required', 'integer', 'between:1,5'],
            'nilai_frekuensi' => ['required', 'integer', 'between:1,5'],
        ];
    }

    /**
     * @return array<int, \Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $latitude = (float) $this->input('latitude');
                $longitude = (float) $this->input('longitude');

                $setting = LocationSetting::current();

                $distance = GeoDistance::meters(
                    $latitude,
                    $longitude,
                    (float) $setting->center_lat,
                    (float) $setting->center_lng,
                );

                if ($distance > $setting->radius_m) {
                    $message = sprintf(
                        'Lokasi GPS berada di luar radius kampus (%d meter).',
                        $setting->radius_m,
                    );

                    $validator->errors()->add('latitude', $message);
                    $validator->errors()->add('longitude', $message);
                }
            },
        ];
    }

    public function toDTO(): StoreLaporanData
    {
        $foto = null;
        if ($this->hasFile('foto')) {
            $laporan = new Laporan();
            $foto = $laporan->storeFoto($this->file('foto'));
        }

        return new StoreLaporanData(
            kategori: $this->validated('kategori'),
            lokasi: $this->validated('lokasi'),
            deskripsi: $this->validated('deskripsi'),
            nilai_kerusakan: (int) $this->validated('nilai_kerusakan'),
            nilai_risiko: (int) $this->validated('nilai_risiko'),
            nilai_dampak: (int) $this->validated('nilai_dampak'),
            nilai_frekuensi: (int) $this->validated('nilai_frekuensi'),
            latitude: (float) $this->validated('latitude'),
            longitude: (float) $this->validated('longitude'),
            foto: $foto,
        );
    }
}
