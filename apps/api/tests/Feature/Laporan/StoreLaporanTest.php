<?php

declare(strict_types=1);

use App\Enums\LaporanStatus;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\File\UploadedFile;

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

it('stores a report with a photo', function (): void {
    Storage::fake('public');

    $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGWWjIWgAAAABJRU5ErkJggg==');
    $path = tempnam(sys_get_temp_dir(), 'laporan_');
    file_put_contents($path, $png);

    $user = makeReporter();

    $response = $this->actingAs($user)
        ->post('/api/v1/reports', array_merge(validReportPayload(), [
            'foto' => new UploadedFile($path, 'foto.png', 'image/png', null, true),
        ]), ['Accept' => 'application/json'])
        ->assertCreated();

    $foto = $response->json('data.foto');
    expect($foto)->not->toBeNull();
    expect(Storage::disk('public')->exists($foto))->toBeTrue();

    $this->assertDatabaseHas('laporans', [
        'user_id' => $user->id,
        'foto' => $foto,
    ]);
});

it('rejects a photo larger than 2 MB', function (): void {
    Storage::fake('public');

    $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGWWjIWgAAAABJRU5ErkJggg==');
    $path = tempnam(sys_get_temp_dir(), 'laporan_');
    file_put_contents($path, $png.str_repeat("\0", 3 * 1024 * 1024));

    $this->actingAs(makeReporter())
        ->post('/api/v1/reports', array_merge(validReportPayload(), [
            'foto' => new UploadedFile($path, 'foto.jpg', 'image/jpeg', null, true),
        ]), ['Accept' => 'application/json'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['foto']);
});

it('rejects a non-image file', function (): void {
    Storage::fake('public');

    $path = tempnam(sys_get_temp_dir(), 'laporan_');
    file_put_contents($path, '%PDF-1.4 fake pdf');

    $this->actingAs(makeReporter())
        ->post('/api/v1/reports', array_merge(validReportPayload(), [
            'foto' => new UploadedFile($path, 'foto.pdf', 'application/pdf', null, true),
        ]), ['Accept' => 'application/json'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['foto']);
});
