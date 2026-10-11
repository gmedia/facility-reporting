<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use App\Data\LoginData;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
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
            'identifier' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string'],
        ];
    }

    public function toDTO(): LoginData
    {
        return new LoginData(
            identifier: $this->validated('identifier'),
            password: $this->validated('password'),
        );
    }
}
