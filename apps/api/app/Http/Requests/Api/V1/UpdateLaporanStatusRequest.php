<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use App\Data\UpdateLaporanStatusData;
use App\Enums\LaporanStatus;
use App\Enums\UserRole;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLaporanStatusRequest extends FormRequest
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
            'status' => ['required', Rule::enum(LaporanStatus::class)],

            'nilai_kerusakan' => [
                'sometimes',
                'integer',
                'between:1,5',
                Rule::requiredIf(fn () => $this->input('status') === LaporanStatus::Valid->value),
            ],
            'nilai_risiko' => [
                'sometimes',
                'integer',
                'between:1,5',
                Rule::requiredIf(fn () => $this->input('status') === LaporanStatus::Valid->value),
            ],
            'nilai_dampak' => [
                'sometimes',
                'integer',
                'between:1,5',
                Rule::requiredIf(fn () => $this->input('status') === LaporanStatus::Valid->value),
            ],
            'nilai_frekuensi' => [
                'sometimes',
                'integer',
                'between:1,5',
                Rule::requiredIf(fn () => $this->input('status') === LaporanStatus::Valid->value),
            ],

            'alasan' => [
                'nullable',
                'string',
                'max:255',
                Rule::requiredIf(fn () => $this->input('status') === LaporanStatus::Ditolak->value),
            ],

            'foto_bukti' => [
                'sometimes',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
                Rule::requiredIf(fn () => $this->input('status') === LaporanStatus::Selesai->value),
            ],
        ];
    }

    public function toDTO(): UpdateLaporanStatusData
    {
        return new UpdateLaporanStatusData(
            status: LaporanStatus::from($this->validated('status')),
            nilaiKerusakan: $this->validated('nilai_kerusakan'),
            nilaiRisiko: $this->validated('nilai_risiko'),
            nilaiDampak: $this->validated('nilai_dampak'),
            nilaiFrekuensi: $this->validated('nilai_frekuensi'),
            alasan: $this->validated('alasan'),
            fotoBukti: $this->file('foto_bukti'),
        );
    }
}
