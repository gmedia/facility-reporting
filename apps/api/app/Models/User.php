<?php

namespace App\Models;

use Database\Factories\UserFactory;
// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'nim', 'role', 'foto'])]
#[Hidden(['password', 'remember_token'])]
/**
 * @property-read string|null $password_changed_at
 * @property-read float|null $last_lat
 * @property-read float|null $last_lng
 * @property-read \DateTimeInterface|null $last_location_at
 */
class User extends Authenticatable
{
    use HasApiTokens;

    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'active' => 'boolean',
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_lat' => 'float',
            'last_lng' => 'float',
            'last_location_at' => 'datetime',
            'password_changed_at' => 'datetime',
        ];
    }
}
