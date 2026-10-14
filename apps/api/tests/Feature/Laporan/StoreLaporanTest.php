<?php

declare(strict_types=1);

use App\Enums\LaporanStatus;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

use function Pest\Laravel\postJson;

uses(RefreshDatabase::class);

function makeReporter(string $nim = '234110601999'): User
{
    return User::factory()->create([
        'nim' => $nim,
        'role' => UserRole::User->value,
        'password' => 'secret-password',
    ]);
}

/**
 * @return array<string, string>
 */
function validReportPayload(): array
{
    return [
        'kategori' => 'elektronik',
        'lokasi' => 'Lab 3 Lt.2',
        'deskripsi' => 'Proyektor mati total sejak pagi.',
    ];
}

beforeEach(function (): void {
    $this->withHeader('Origin', 'http://localhost:5173');
});

it('stores a report for a logged-in user', function (): void {
    $user = makeReporter();

    $this->actingAs($user)
        ->postJson('/api/v1/reports', validReportPayload())
        ->assertCreated()
        ->assertJsonPath('data.kategori', 'elektronik')
        ->assertJsonPath('data.status', LaporanStatus::MenungguVerifikasi->value);

    $this->assertDatabaseHas('laporans', [
        'user_id' => $user->id,
        'kategori' => 'elektronik',
        'status' => 'menunggu_verifikasi',
    ]);
});

it('rejects unauthenticated requests', function (): void {
    postJson('/api/v1/reports', validReportPayload())
        ->assertUnauthorized();
});

it('requires kategori, lokasi, and deskripsi', function (): void {
    $this->actingAs(makeReporter())
        ->postJson('/api/v1/reports', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['kategori', 'lokasi', 'deskripsi']);
});

it('rejects a description shorter than ten characters', function (): void {
    $this->actingAs(makeReporter())
        ->postJson('/api/v1/reports', array_merge(validReportPayload(), [
            'deskripsi' => 'rusak',
        ]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['deskripsi']);
});

it('ignores status sent by the client', function (): void {
    $user = makeReporter();

    $this->actingAs($user)
        ->postJson('/api/v1/reports', array_merge(validReportPayload(), [
            'status' => LaporanStatus::Selesai->value,
        ]))
        ->assertCreated()
        ->assertJsonPath('data.status', LaporanStatus::MenungguVerifikasi->value);
});

it('ignores user_id sent by the client', function (): void {
    $user = makeReporter();
    $other = makeReporter('234110601998');

    $this->actingAs($user)
        ->postJson('/api/v1/reports', array_merge(validReportPayload(), [
            'user_id' => $other->id,
        ]))
        ->assertCreated()
        ->assertJsonPath('data.user_id', $user->id);
});
