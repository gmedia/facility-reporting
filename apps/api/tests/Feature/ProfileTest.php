<?php

declare(strict_types=1);

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

// Nama helper sengaja unik: Pest memuat semua file test dalam satu proses,
// jadi makeReporter()/makeRegularUser() dari file lain tidak boleh
// didefinisikan ulang di sini.
function makeAkunProfil(): User
{
    return User::factory()->create([
        'role' => UserRole::User->value,
        'password' => 'password-lama-123',
    ]);
}

/**
 * PNG 1x1 transparan — lolos rule `image` tanpa file fixture di disk
 * (pola yang sama dengan pngBytes() di StoreLaporanTest, sengaja tidak
 * dipakai ulang supaya tidak bentrok definisi fungsi global).
 */
function pngProfil(): string
{
    return base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGWWjIWgAAAABJRU5ErkJggg==');
}

beforeEach(function (): void {
    $this->withHeader('Origin', 'http://localhost:5173');
    // Disk dipalsukan untuk seluruh file di file test ini — tanpa fake,
    // berkas upload jatuh ke storage asli dan bikin test kotor.
    Storage::fake('public');
});

it('rejects unauthenticated foto upload', function (): void {
    $this->postJson('/api/v1/profile/foto')->assertUnauthorized();
});

it('rejects unauthenticated password change', function (): void {
    $this->patchJson('/api/v1/profile/password')->assertUnauthorized();
});

it('uploads a profile photo', function (): void {
    $user = makeAkunProfil();

    $response = $this->actingAs($user)
        ->post('/api/v1/profile/foto', [
            'foto' => UploadedFile::fake()->createWithContent('profil.png', pngProfil()),
        ], ['Accept' => 'application/json'])
        ->assertOk()
        ->assertJsonPath('data.id', $user->id);

    $foto = $response->json('data.foto');
    expect($foto)->not->toBeNull();
    expect(Storage::disk('public')->exists($foto))->toBeTrue();

    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'foto' => $foto,
    ]);
});

it('replaces the previous photo file', function (): void {
    $user = makeAkunProfil();
    Storage::disk('public')->put('profil/lama.jpg', 'isi-lama');
    $user->update(['foto' => 'profil/lama.jpg']);

    $this->actingAs($user)
        ->post('/api/v1/profile/foto', [
            'foto' => UploadedFile::fake()->createWithContent('baru.png', pngProfil()),
        ], ['Accept' => 'application/json'])
        ->assertOk();

    $foto = $user->fresh()->foto;
    expect($foto)->not->toBe('profil/lama.jpg');
    Storage::disk('public')->assertMissing('profil/lama.jpg');
    Storage::disk('public')->assertExists($foto);
});

it('rejects a non-image file for foto profil', function (): void {
    $this->actingAs(makeAkunProfil())
        ->post('/api/v1/profile/foto', [
            'foto' => UploadedFile::fake()->createWithContent('dokumen.pdf', '%PDF-1.4 fake pdf'),
        ], ['Accept' => 'application/json'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['foto']);
});

it('rejects a profile photo larger than 2 MB', function (): void {
    $content = pngProfil().str_repeat("\0", 3 * 1024 * 1024);

    $this->actingAs(makeAkunProfil())
        ->post('/api/v1/profile/foto', [
            'foto' => UploadedFile::fake()->createWithContent('profil.jpg', $content),
        ], ['Accept' => 'application/json'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['foto']);
});

it('changes the password when the current password matches', function (): void {
    $user = makeAkunProfil();

    $this->actingAs($user)
        ->patchJson('/api/v1/profile/password', [
            'current_password' => 'password-lama-123',
            'password' => 'password-baru-456',
            'password_confirmation' => 'password-baru-456',
        ])
        ->assertOk()
        ->assertJsonPath('message', 'Password berhasil diperbarui.');

    $fresh = $user->fresh();
    expect(Hash::check('password-baru-456', $fresh->password))->toBeTrue();
    expect(Hash::check('password-lama-123', $fresh->password))->toBeFalse();
});

it('rejects a wrong current password', function (): void {
    $user = makeAkunProfil();

    $this->actingAs($user)
        ->patchJson('/api/v1/profile/password', [
            'current_password' => 'password-salah',
            'password' => 'password-baru-456',
            'password_confirmation' => 'password-baru-456',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['current_password']);

    // Password lama tetap berlaku — perubahan tidak boleh terjadi.
    expect(Hash::check('password-lama-123', $user->fresh()->password))->toBeTrue();
});

it('rejects a new password shorter than eight characters', function (): void {
    $this->actingAs(makeAkunProfil())
        ->patchJson('/api/v1/profile/password', [
            'current_password' => 'password-lama-123',
            'password' => 'abc123',
            'password_confirmation' => 'abc123',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['password']);
});

it('rejects mismatched password confirmation', function (): void {
    $this->actingAs(makeAkunProfil())
        ->patchJson('/api/v1/profile/password', [
            'current_password' => 'password-lama-123',
            'password' => 'password-baru-456',
            'password_confirmation' => 'beda-lagi',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['password']);
});

it('requires current password and new password fields', function (): void {
    $this->actingAs(makeAkunProfil())
        ->patchJson('/api/v1/profile/password', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['current_password', 'password']);
});
