<?php

declare(strict_types=1);

use App\Enums\LaporanStatus;
use App\Enums\UserRole;
use App\Models\Laporan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

use function Pest\Laravel\getJson;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->withHeader('Origin', 'http://localhost:5173');
});

it('lets a regular user see only their own reports', function (): void {
    $owner = User::factory()->create(['role' => UserRole::User->value]);
    $other = User::factory()->create(['role' => UserRole::User->value]);

    Laporan::factory()->create(['user_id' => $owner->id]);
    Laporan::factory()->create(['user_id' => $other->id]);

    $response = $this->actingAs($owner)
        ->getJson('/api/v1/reports')
        ->assertOk()
        ->assertJsonCount(1, 'data');

    expect($response->json('data.0.user_id'))->toBe($owner->id);
});

it('lets an admin see every report', function (): void {
    $admin = User::factory()->create(['role' => UserRole::Admin->value]);

    Laporan::factory()->count(2)->create();

    $this->actingAs($admin)
        ->getJson('/api/v1/reports')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

it('lets a super admin see every report', function (): void {
    $superAdmin = User::factory()->create(['role' => UserRole::SuperAdmin->value]);

    Laporan::factory()->count(3)->create();

    $this->actingAs($superAdmin)
        ->getJson('/api/v1/reports')
        ->assertOk()
        ->assertJsonCount(3, 'data');
});

it('rejects unauthenticated requests', function (): void {
    getJson('/api/v1/reports')->assertUnauthorized();
});

it('returns the report payload shape', function (): void {
    $owner = User::factory()->create(['role' => UserRole::User->value]);

    Laporan::factory()->create([
        'user_id' => $owner->id,
        'kategori' => 'elektronik',
        'lokasi' => 'Lab 3 Lt.2',
        'status' => LaporanStatus::MenungguVerifikasi->value,
    ]);

    $this->actingAs($owner)
        ->getJson('/api/v1/reports')
        ->assertOk()
        ->assertJsonPath('data.0.kategori', 'elektronik')
        ->assertJsonPath('data.0.lokasi', 'Lab 3 Lt.2')
        ->assertJsonPath('data.0.status', LaporanStatus::MenungguVerifikasi->value);
});

it('returns an empty collection when the user has no reports', function (): void {
    $owner = User::factory()->create(['role' => UserRole::User->value]);

    $this->actingAs($owner)
        ->getJson('/api/v1/reports')
        ->assertOk()
        ->assertJsonCount(0, 'data');
});
