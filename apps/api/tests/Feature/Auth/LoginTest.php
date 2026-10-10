<?php

declare(strict_types=1);

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

use function Pest\Laravel\postJson;

uses(RefreshDatabase::class);

function makeLoginUser(): User
{
    return User::factory()->create([
        'nim' => '12345678',
        'role' => UserRole::User->value,
        'password' => 'secret-password',
    ]);
}

beforeEach(function (): void {
    $this->withHeader('Origin', 'http://localhost:5173');
});

it('logs in with nim', function (): void {
    $user = makeLoginUser();

    $response = postJson('/api/v1/auth/login', [
        'identifier' => $user->nim,
        'password' => 'secret-password',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.role', UserRole::User->value);
});

it('logs in with email', function (): void {
    $user = makeLoginUser();

    $response = postJson('/api/v1/auth/login', [
        'identifier' => $user->email,
        'password' => 'secret-password',
    ]);

    $response->assertOk();
});

it('rejects invalid password', function (): void {
    $user = makeLoginUser();

    postJson('/api/v1/auth/login', [
        'identifier' => $user->email,
        'password' => 'wrong-password',
    ])->assertUnauthorized();
});

it('rejects unknown identifier', function (): void {
    makeLoginUser();

    postJson('/api/v1/auth/login', [
        'identifier' => 'not-registered',
        'password' => 'secret-password',
    ])->assertUnauthorized();
});

it('requires identifier and password', function (): void {
    postJson('/api/v1/auth/login', [])->assertUnprocessable();
});

it('returns the authenticated user', function (): void {
    $user = makeLoginUser();

    $this->actingAs($user)
        ->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonPath('data.email', $user->email);
});

it('returns 401 on me without session', function (): void {
    $this->getJson('/api/v1/auth/me')->assertUnauthorized();
});

it('logs out', function (): void {
    $this->actingAs(makeLoginUser())
        ->postJson('/api/v1/auth/logout')
        ->assertOk();
});
