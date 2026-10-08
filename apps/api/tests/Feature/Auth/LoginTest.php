<?php

declare(strict_types=1);

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

use function Pest\Laravel\postJson;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->withHeader('Origin', 'http://localhost:5173');

    $this->user = User::factory()->create([
        'nim' => '12345678',
        'role' => UserRole::User->value,
        'password' => 'secret-password',
    ]);
});

it('logs in with nim', function (): void {
    $response = postJson('/api/v1/auth/login', [
        'identifier' => $this->user->nim,
        'password' => 'secret-password',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.role', UserRole::User->value);
});

it('logs in with email', function (): void {
    $response = postJson('/api/v1/auth/login', [
        'identifier' => $this->user->email,
        'password' => 'secret-password',
    ]);

    $response->assertOk();
});

it('rejects invalid password', function (): void {
    postJson('/api/v1/auth/login', [
        'identifier' => $this->user->email,
        'password' => 'wrong-password',
    ])->assertUnauthorized();
});

it('rejects unknown identifier', function (): void {
    postJson('/api/v1/auth/login', [
        'identifier' => 'not-registered',
        'password' => 'secret-password',
    ])->assertUnauthorized();
});

it('requires identifier and password', function (): void {
    postJson('/api/v1/auth/login', [])->assertUnprocessable();
});

it('returns the authenticated user', function (): void {
    $this->actingAs($this->user)
        ->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonPath('data.email', $this->user->email);
});

it('returns 401 on me without session', function (): void {
    $this->getJson('/api/v1/auth/me')->assertUnauthorized();
});

it('logs out', function (): void {
    $this->actingAs($this->user)
        ->postJson('/api/v1/auth/logout')
        ->assertOk();
});
