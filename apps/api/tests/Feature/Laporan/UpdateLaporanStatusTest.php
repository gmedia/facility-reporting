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

// createWithContent dipakai supaya test tidak bergantung pada ekstensi GD.
function fotoBuktiPalsu(): UploadedFile
{
    return UploadedFile::fake()->createWithContent(
        'bukti.png',
        base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGWWjIWgAAAABJRU5ErkJggg=='),
    );
}

// status tidak ada di $fillable Laporan, jadi harus di-assign langsung.
function laporanBerstatus(LaporanStatus $status, bool $denganFotoBukti = false): Laporan
{
    $laporan = Laporan::factory()->create();
    $laporan->status = $status;
    $laporan->foto_bukti = $denganFotoBukti ? 'bukti.jpg' : null;
    $laporan->save();

    return $laporan;
}

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
            'alasan' => 'Tidak layak ditindaklanjuti',
        ])
        ->assertOk()
        ->assertJsonPath('data.status', LaporanStatus::Ditolak->value);

    $this->assertDatabaseHas('laporans', [
        'id' => $laporan->id,
        'status' => LaporanStatus::Ditolak->value,
    ]);
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

    // Multipost, bukan postJson: foto kini wajib dan tidak bisa dikirim
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

it('lets an admin upload foto bukti', function (): void {
    $admin = User::factory()->create(['role' => UserRole::Admin->value]);
    $laporan = Laporan::factory()->create();

    $this->actingAs($admin)
        ->patch('/api/v1/reports/'.$laporan->id.'/bukti', [
            'foto_bukti' => fotoBuktiPalsu(),
        ])
        ->assertOk()
        ->assertJsonPath('data.foto_bukti', $laporan->fresh()->foto_bukti);

    $this->assertDatabaseHas('laporans', [
        'id' => $laporan->id,
        'foto_bukti' => $laporan->fresh()->foto_bukti,
    ]);
});

it('lets an admin see riwayat status perubahan', function (): void {
    $admin = User::factory()->create(['role' => UserRole::Admin->value]);
    $laporan = Laporan::factory()->create(['status' => LaporanStatus::MenungguVerifikasi->value]);

    $this->actingAs($admin)
        ->patchJson("/api/v1/reports/{$laporan->id}/status", [
            'status' => LaporanStatus::Valid->value,
            'nilai_kerusakan' => 5,
            'nilai_risiko' => 4,
            'nilai_dampak' => 3,
            'nilai_frekuensi' => 2,
        ])
        ->assertOk();

    $this->actingAs($admin)
        ->get("/api/v1/reports/{$laporan->id}/history")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.status_to', LaporanStatus::Valid->value);
});

it('forbids a regular user from uploading bukti', function (): void {
    $user = User::factory()->create(['role' => UserRole::User->value]);
    $laporan = Laporan::factory()->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->patch('/api/v1/reports/'.$laporan->id.'/bukti', [
            'foto_bukti' => fotoBuktiPalsu(),
        ])
        ->assertForbidden();
});

it('rejects unauthenticated bukti upload', function (): void {
    $laporan = Laporan::factory()->create();

    $this->patchJson('/api/v1/reports/'.$laporan->id.'/bukti', [])
        ->assertUnauthorized();
});

it('wajib mengupload foto bukti sebelum status diubah ke selesai', function (): void {
    $admin = User::factory()->create(['role' => UserRole::Admin->value]);
    $laporan = laporanBerstatus(LaporanStatus::Diproses);

    $this->actingAs($admin)
        ->patchJson("/api/v1/reports/{$laporan->id}/status", [
            'status' => LaporanStatus::Selesai->value,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['foto_bukti']);

    $this->assertDatabaseHas('laporans', [
        'id' => $laporan->id,
        'status' => LaporanStatus::Diproses->value,
    ]);
});

it('boleh mengubah status ke selesai setelah foto bukti diupload', function (): void {
    $admin = User::factory()->create(['role' => UserRole::Admin->value]);
    $laporan = laporanBerstatus(LaporanStatus::Diproses);

    $this->actingAs($admin)
        ->patch('/api/v1/reports/'.$laporan->id.'/bukti', [
            'foto_bukti' => fotoBuktiPalsu(),
        ])
        ->assertOk();

    $this->actingAs($admin)
        ->patchJson("/api/v1/reports/{$laporan->id}/status", [
            'status' => LaporanStatus::Selesai->value,
        ])
        ->assertOk()
        ->assertJsonPath('data.status', LaporanStatus::Selesai->value);

    $this->assertDatabaseHas('laporans', [
        'id' => $laporan->id,
        'status' => LaporanStatus::Selesai->value,
    ]);
});

it('menerima setiap transisi status yang sah', function (LaporanStatus $dari, LaporanStatus $ke): void {
    $admin = User::factory()->create(['role' => UserRole::Admin->value]);
    $laporan = laporanBerstatus($dari, $ke === LaporanStatus::Selesai);

    $this->actingAs($admin)
        ->patchJson("/api/v1/reports/{$laporan->id}/status", [
            'status' => $ke->value,
            'alasan' => 'Layak ditindaklanjuti',
            'nilai_kerusakan' => 4,
            'nilai_risiko' => 3,
            'nilai_dampak' => 2,
            'nilai_frekuensi' => 1,
        ])
        ->assertOk()
        ->assertJsonPath('data.status', $ke->value);

    expect($laporan->fresh()->status)->toBe($ke);
})->with([
    'menunggu_verifikasi → valid' => [LaporanStatus::MenungguVerifikasi, LaporanStatus::Valid],
    'menunggu_verifikasi → ditolak' => [LaporanStatus::MenungguVerifikasi, LaporanStatus::Ditolak],
    'valid → diproses' => [LaporanStatus::Valid, LaporanStatus::Diproses],
    'diproses → selesai' => [LaporanStatus::Diproses, LaporanStatus::Selesai],
]);

it('menolak setiap transisi status yang tidak sah', function (LaporanStatus $dari, LaporanStatus $ke): void {
    $admin = User::factory()->create(['role' => UserRole::Admin->value]);
    $laporan = laporanBerstatus($dari, true);

    $this->actingAs($admin)
        ->patchJson("/api/v1/reports/{$laporan->id}/status", [
            'status' => $ke->value,
            'alasan' => 'Alasan uji',
            'nilai_kerusakan' => 4,
            'nilai_risiko' => 3,
            'nilai_dampak' => 2,
            'nilai_frekuensi' => 1,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['status']);

    expect($laporan->fresh()->status)->toBe($dari);
    $this->assertDatabaseCount('laporan_status_histories', 0);
})->with([
    'menunggu_verifikasi → diproses' => [LaporanStatus::MenungguVerifikasi, LaporanStatus::Diproses],
    'menunggu_verifikasi → selesai' => [LaporanStatus::MenungguVerifikasi, LaporanStatus::Selesai],
    'valid → menunggu_verifikasi' => [LaporanStatus::Valid, LaporanStatus::MenungguVerifikasi],
    'valid → ditolak' => [LaporanStatus::Valid, LaporanStatus::Ditolak],
    'valid → selesai' => [LaporanStatus::Valid, LaporanStatus::Selesai],
    'diproses → menunggu_verifikasi' => [LaporanStatus::Diproses, LaporanStatus::MenungguVerifikasi],
    'diproses → valid' => [LaporanStatus::Diproses, LaporanStatus::Valid],
    'diproses → ditolak' => [LaporanStatus::Diproses, LaporanStatus::Ditolak],
    'ditolak → menunggu_verifikasi' => [LaporanStatus::Ditolak, LaporanStatus::MenungguVerifikasi],
    'ditolak → valid' => [LaporanStatus::Ditolak, LaporanStatus::Valid],
    'ditolak → diproses' => [LaporanStatus::Ditolak, LaporanStatus::Diproses],
    'ditolak → selesai' => [LaporanStatus::Ditolak, LaporanStatus::Selesai],
    'selesai → menunggu_verifikasi' => [LaporanStatus::Selesai, LaporanStatus::MenungguVerifikasi],
    'selesai → valid' => [LaporanStatus::Selesai, LaporanStatus::Valid],
    'selesai → diproses' => [LaporanStatus::Selesai, LaporanStatus::Diproses],
    'selesai → ditolak' => [LaporanStatus::Selesai, LaporanStatus::Ditolak],
]);

it('mengunci status final', function (LaporanStatus $final): void {
    $admin = User::factory()->create(['role' => UserRole::Admin->value]);
    $laporan = laporanBerstatus($final, true);

    foreach (LaporanStatus::cases() as $tujuan) {
        $this->actingAs($admin)
            ->patchJson("/api/v1/reports/{$laporan->id}/status", [
                'status' => $tujuan->value,
                'alasan' => 'Alasan uji',
                'nilai_kerusakan' => 4,
                'nilai_risiko' => 3,
                'nilai_dampak' => 2,
                'nilai_frekuensi' => 1,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);
    }

    expect($laporan->fresh()->status)->toBe($final);
    $this->assertDatabaseCount('laporan_status_histories', 0);
})->with([
    'ditolak' => [LaporanStatus::Ditolak],
    'selesai' => [LaporanStatus::Selesai],
]);

it('mencatat riwayat lengkap saat laporan melewati semua tahap', function (): void {
    $admin = User::factory()->create(['role' => UserRole::Admin->value]);
    $laporan = laporanBerstatus(LaporanStatus::MenungguVerifikasi, true);

    $ubah = function (array $payload) use ($admin, $laporan): void {
        $this->actingAs($admin)
            ->patchJson("/api/v1/reports/{$laporan->id}/status", $payload)
            ->assertOk();
    };

    $ubah([
        'status' => LaporanStatus::Valid->value,
        'nilai_kerusakan' => 5,
        'nilai_risiko' => 4,
        'nilai_dampak' => 3,
        'nilai_frekuensi' => 2,
    ]);
    $ubah(['status' => LaporanStatus::Diproses->value]);
    $ubah(['status' => LaporanStatus::Selesai->value]);

    $this->actingAs($admin)
        ->get("/api/v1/reports/{$laporan->id}/history")
        ->assertOk()
        ->assertJsonCount(3, 'data')
        ->assertJsonPath('data.0.status_from', LaporanStatus::Diproses->value)
        ->assertJsonPath('data.0.status_to', LaporanStatus::Selesai->value);
});
