<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use App\Data\LoginData;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\Auth;

final class Login
{
    public function __invoke(LoginData $data): Authenticatable
    {
        $credentials = $this->credentials($data);

        if (! Auth::attempt($credentials)) {
            abort(401, 'Invalid credentials.');
        }

        session()->regenerate();

        return Auth::user();
    }

    /**
     * @return array<string, string>
     */
    private function credentials(LoginData $data): array
    {
        $identifier = $data->identifier;

        if (str_contains($identifier, '@')) {
            return ['email' => $identifier, 'password' => $data->password];
        }

        return ['nim' => $identifier, 'password' => $data->password];
    }
}
