<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use App\Data\ChangePasswordData;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * `current_password` memverifikasi password lama terhadap user yang
     * sedang login. Kewajibannya dilewati untuk akun yang
     * `password_changed_at`-nya null (password hasil reset admin atau
     * password awal), karena user memang tidak tahu password itu.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ];

        if (! $this->melewatiPasswordLama()) {
            $rules['current_password'] = ['required', 'current_password'];
        }

        return $rules;
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'current_password.required' => 'Password saat ini wajib diisi.',
            'current_password.current_password' => 'Password saat ini tidak sesuai.',
            'password.required' => 'Password baru wajib diisi.',
            'password.min' => 'Password baru minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi password baru tidak sama.',
        ];
    }

    public function toDTO(): ChangePasswordData
    {
        return new ChangePasswordData(
            password: $this->validated('password'),
        );
    }

    private function melewatiPasswordLama(): bool
    {
        $user = $this->user();

        return $user !== null && $user->password_changed_at === null;
    }
}
