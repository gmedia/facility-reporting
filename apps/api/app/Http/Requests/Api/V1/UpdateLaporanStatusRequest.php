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
    /**
     * Determine if the user is authorized to make this request.
     *
     * Only admins and super admins may change a report's status. The route
     * is already guarded by the `admin` middleware; this stays as a second
     * line of defence.
     */
    public function authorize(): bool
    {
        $role = $this->user()?->role;

        return $role === UserRole::Admin->value || $role === UserRole::SuperAdmin->value;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(LaporanStatus::class)],
        ];
    }

    public function toDTO(): UpdateLaporanStatusData
    {
        return new UpdateLaporanStatusData(
            status: LaporanStatus::from($this->validated('status')),
        );
    }
}
