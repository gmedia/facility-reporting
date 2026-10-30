<?php

declare(strict_types=1);

use App\Enums\LaporanStatus;
use App\Enums\UserRole;
use App\Models\Laporan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\patchJson;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->withHeader('Origin', 'http://localhost:5173');
    Storage::fake('public');
});

it('lets an admin change a report status', function (): void {
    $admin = User::factory()->create(['role' => UserRole::Admin->value]);
    $laporan = Laporan::factory()->create(['status' => LaporanStatus::MenungguVerifikasi->value]);

    $this->actingAs($admin)
        ->patchJson("/api/v1/reports/{$laporan->id}/status", [
            'status' => LaporanStatus::Valid->value,
        ])
        ->assertOk()
        ->assertJsonPath('data.status', LaporanStatus::Valid->value);

    $this->assertDatabaseHas('laporans', [
        'id' => $laporan->id,
        'status' => LaporanStatus::Valid->value,
    ]);
});

it('lets a super admin change a report status', function (): void {
    $superAdmin = User::factory()->create(['role' => UserRole::SuperAdmin->value]);
    $laporan = Laporan::factory()->create();

    $this->actingAs($superAdmin)
        ->patchJson("/api/v1/reports/{$laporan->id}/status", [
            'status' => LaporanStatus::Ditolak->value,
        ])
        ->assertOk()
        ->assertJsonPath('data.status', LaporanStatus::Ditolak->value);
});

it('forbids a regular user from changing any status', function (): void {
    $user = User::factory()->create(['role' => UserRole::User->value]);
    $laporan = Laporan::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->patchJson("/api/v1/reports/{$laporan->id}/status", [
            'status' => LaporanStatus::Selesai->value,
        ])
        ->assertForbidden();

    $this->assertDatabaseHas('laporans', [
        'id' => $laporan->id,
        'status' => LaporanStatus::MenungguVerifikasi->value,
    ]);
});

it('rejects unauthenticated requests', function (): void {
    $laporan = Laporan::factory()->create();

    patchJson("/api/v1/reports/{$laporan->id}/status", [
        'status' => LaporanStatus::Valid->value,
    ])->assertUnauthorized();
});

it('requires a status value', function (): void {
    $admin = User::factory()->create(['role' => UserRole::Admin->value]);
    $laporan = Laporan::factory()->create();

    $this->actingAs($admin)
        ->patchJson("/api/v1/reports/{$laporan->id}/status", [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['status']);
});

it('rejects a status outside the enum', function (): void {
    $admin = User::factory()->create(['role' => UserRole::Admin->value]);
    $laporan = Laporan::factory()->create();

    $this->actingAs($admin)
        ->patchJson("/api/v1/reports/{$laporan->id}/status", [
            'status' => 'sudah_selesai_sekali',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['status']);
});

it('returns 404 for a report that does not exist', function (): void {
    $admin = User::factory()->create(['role' => UserRole::Admin->value]);

    $this->actingAs($admin)
        ->patchJson('/api/v1/reports/999999/status', [
            'status' => LaporanStatus::Valid->value,
        ])
        ->assertNotFound();
});

it('cannot be reached through mass assignment on create', function (): void {
    $user = User::factory()->create(['role' => UserRole::User->value]);

    // Multipart, bukan postJson: foto kini wajib dan tidak bisa dikirim
    // sebagai JSON. Payload-nya sengaja tetap mengirim `status` — itu yang
    // sedang diuji, foto cuma syarat supaya request-nya lolos validasi.
    $this->actingAs($user)
        ->post('/api/v1/reports', [
            'kategori' => 'elektronik',
            'lokasi' => 'Lab 3 Lt.2',
            'deskripsi' => 'Proyektor mati total sejak pagi.',
            'foto' => UploadedFile::fake()->createWithContent(
                'foto.png',
                base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGWWjIWgAAAABJRU5ErkJggg=='),
            ),
            'status' => LaporanStatus::Selesai->value,
        ], ['Accept' => 'application/json'])
        ->assertCreated()
        ->assertJsonPath('data.status', LaporanStatus::MenungguVerifikasi->value);
});
