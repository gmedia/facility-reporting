<?php

declare(strict_types=1);

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function makeSuperAdmin(): User
{
    return User::factory()->create([
        'role' => UserRole::SuperAdmin->value,
        'password' => 'secret-password',
    ]);
}

function makeAdmin(): User
{
    return User::factory()->create([
        'role' => UserRole::Admin->value,
        'password' => 'secret-password',
    ]);
}

function makeRegularUser(): User
{
    return User::factory()->create([
        'role' => UserRole::User->value,
        'password' => 'secret-password',
    ]);
}

beforeEach(function (): void {
    $this->withHeader('Origin', 'http://localhost:5173');
});

it('lists admin accounts for super admin', function (): void {
    $admin = makeAdmin();
    makeSuperAdmin();

    $this->actingAs(makeSuperAdmin())
        ->getJson('/api/v1/admin/users')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $admin->id)
        ->assertJsonPath('data.0.role', UserRole::Admin->value);
});

it('creates an admin account', function (): void {
    makeSuperAdmin();

    $this->actingAs(makeSuperAdmin())
        ->postJson('/api/v1/admin/users', [
            'name' => 'New Admin',
            'email' => 'admin@test.test',
            'password' => 'password123',
        ])
        ->assertCreated()
        ->assertJsonPath('data.name', 'New Admin')
        ->assertJsonPath('data.email', 'admin@test.test')
        ->assertJsonPath('data.role', UserRole::Admin->value);

    $this->assertDatabaseHas('users', [
        'email' => 'admin@test.test',
        'role' => UserRole::Admin->value,
    ]);
});

it('updates an admin account', function (): void {
    makeSuperAdmin();
    $admin = makeAdmin();

    $this->actingAs(makeSuperAdmin())
        ->putJson("/api/v1/admin/users/{$admin->id}", [
            'name' => 'Updated Name',
        ])
        ->assertOk()
        ->assertJsonPath('data.name', 'Updated Name');
});

it('deletes an admin account', function (): void {
    makeSuperAdmin();
    $admin = makeAdmin();

    $this->actingAs(makeSuperAdmin())
        ->deleteJson("/api/v1/admin/users/{$admin->id}")
        ->assertNoContent();

    $this->assertDatabaseMissing('users', ['id' => $admin->id]);
});

it('rejects regular user with 403', function (): void {
    makeRegularUser();
    makeAdmin();

    $this->actingAs(makeRegularUser())
        ->getJson('/api/v1/admin/users')
        ->assertForbidden();
});

it('rejects regular user from creating admin', function (): void {
    makeRegularUser();

    $this->actingAs(makeRegularUser())
        ->postJson('/api/v1/admin/users', [
            'name' => 'Hacker',
            'email' => 'hack@test.test',
            'password' => 'password123',
        ])
        ->assertForbidden();
});

it('rejects regular user from updating admin', function (): void {
    makeRegularUser();
    $admin = makeAdmin();

    $this->actingAs(makeRegularUser())
        ->putJson("/api/v1/admin/users/{$admin->id}", ['name' => 'Hacked'])
        ->assertForbidden();
});

it('rejects regular user from deleting admin', function (): void {
    makeRegularUser();
    $admin = makeAdmin();

    $this->actingAs(makeRegularUser())
        ->deleteJson("/api/v1/admin/users/{$admin->id}")
        ->assertForbidden();
});

it('returns 404 for non-admin target', function (): void {
    makeSuperAdmin();
    $regular = makeRegularUser();

    $this->actingAs(makeSuperAdmin())
        ->putJson("/api/v1/admin/users/{$regular->id}", ['name' => 'Nope'])
        ->assertNotFound();
});

it('validates store fields', function (): void {
    makeSuperAdmin();

    $this->actingAs(makeSuperAdmin())
        ->postJson('/api/v1/admin/users', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'email', 'password']);
});

it('rejects duplicate email on store', function (): void {
    makeSuperAdmin();
    makeAdmin();

    $this->actingAs(makeSuperAdmin())
        ->postJson('/api/v1/admin/users', [
            'name' => 'Dupe',
            'email' => User::where('role', UserRole::Admin->value)->first()->email,
            'password' => 'password123',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});
