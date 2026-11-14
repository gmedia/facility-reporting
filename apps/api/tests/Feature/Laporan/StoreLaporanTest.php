<?php

declare(strict_types=1);

use App\Enums\LaporanStatus;
use App\Enums\UserRole;
use App\Models\Laporan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

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
        'nilai_kerusakan' => 5,
        'nilai_risiko' => 4,
        'nilai_dampak' => 4,
        'nilai_frekuensi' => 3,
    ];
}

/**
 * PNG 1x1 transparan — cukup untuk lolos rule `image`, tanpa file fixture
 * beneran di disk.
 */
function pngBytes(): string
{
    return base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGWWjIWgAAAABJRU5ErkJggg==');
}

/**
 * Payload valid yang sudah menyertakan foto.
 *
 * Foto tidak bisa dikirim lewat JSON, jadi test yang HARUS berakhir 201
 * memakai helper ini + ->post() multipart. Test yang memang menguji
 * kegagalan tetap pakai validReportPayload() + postJson().
 *
 * @param  array<string, mixed>  $extra
 * @return array<string, mixed>
 */
function payloadWithPhoto(array $extra = []): array
{
    return array_merge(
        validReportPayload(),
        ['foto' => UploadedFile::fake()->createWithContent('foto.png', pngBytes())],
        $extra,
    );
}

beforeEach(function (): void {
    $this->withHeader('Origin', 'http://localhost:5173');
    // Disk dipalsukan untuk seluruh file di file test ini: foto kini wajib,
    // jadi hampir tiap test menaruh berkas — tanpa fake, berkasnya jatuh ke
    // storage asli dan bikin test kotor.
    Storage::fake('public');
});

it('stores a report for a logged-in user', function (): void {
    $user = makeReporter();

    $this->actingAs($user)
        ->post('/api/v1/reports', payloadWithPhoto(), ['Accept' => 'application/json'])
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

it('requires kategori, lokasi, deskripsi, and foto', function (): void {
    $this->actingAs(makeReporter())
        ->postJson('/api/v1/reports', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['kategori', 'lokasi', 'deskripsi', 'foto', 'nilai_kerusakan', 'nilai_risiko', 'nilai_dampak', 'nilai_frekuensi']);
});

it('rejects a payload that has every field but the photo', function (): void {
    $this->actingAs(makeReporter())
        ->postJson('/api/v1/reports', validReportPayload())
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['foto']);

    $this->assertDatabaseMissing('laporans', ['lokasi' => 'Lab 3 Lt.2']);
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
        ->post('/api/v1/reports', payloadWithPhoto([
            'status' => LaporanStatus::Selesai->value,
        ]), ['Accept' => 'application/json'])
        ->assertCreated()
        ->assertJsonPath('data.status', LaporanStatus::MenungguVerifikasi->value);
});

it('ignores user_id sent by the client', function (): void {
    $user = makeReporter();
    $other = makeReporter('234110601998');

    $this->actingAs($user)
        ->post('/api/v1/reports', payloadWithPhoto([
            'user_id' => $other->id,
        ]), ['Accept' => 'application/json'])
        ->assertCreated()
        ->assertJsonPath('data.user_id', $user->id);
});

it('stores a report with a photo', function (): void {
    $user = makeReporter();

    $response = $this->actingAs($user)
        ->post('/api/v1/reports', payloadWithPhoto(), ['Accept' => 'application/json'])
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
    $content = pngBytes().str_repeat("\0", 3 * 1024 * 1024);

    $this->actingAs(makeReporter())
        ->post('/api/v1/reports', array_merge(validReportPayload(), [
            'foto' => UploadedFile::fake()->createWithContent('foto.jpg', $content),
        ]), ['Accept' => 'application/json'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['foto']);
});

it('rejects a non-image file', function (): void {
    $this->actingAs(makeReporter())
        ->post('/api/v1/reports', array_merge(validReportPayload(), [
            'foto' => UploadedFile::fake()->createWithContent('foto.pdf', '%PDF-1.4 fake pdf'),
        ]), ['Accept' => 'application/json'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['foto']);
});

it('menghitung skor prioritas dari nilai SMART yang dikirim mahasiswa', function (): void {
    $user = makeReporter();

    // 5*0.35 + 4*0.25 + 4*0.25 + 3*0.15 = 1.75 + 1.00 + 1.00 + 0.45 = 4.20 -> tinggi
    $this->actingAs($user)
        ->post('/api/v1/reports', payloadWithPhoto(), ['Accept' => 'application/json'])
        ->assertCreated()
        ->assertJsonPath('data.prioritas_kategori', 'tinggi');

    $this->assertDatabaseHas('laporans', [
        'user_id' => $user->id,
        'nilai_kerusakan' => 5,
        'nilai_risiko' => 4,
        'nilai_dampak' => 4,
        'nilai_frekuensi' => 3,
    ]);

    $laporan = Laporan::query()->where('user_id', $user->id)->firstOrFail();
    expect((float) $laporan->skor_prioritas)->toBe(4.20);
});

it('menolak laporan yang hanya mengirim sebagian nilai SMART', function (string $field): void {
    $payload = validReportPayload();
    unset($payload[$field]);

    $this->actingAs(makeReporter())
        ->post('/api/v1/reports', array_merge($payload, [
            'foto' => UploadedFile::fake()->createWithContent('foto.png', pngBytes()),
        ]), ['Accept' => 'application/json'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors([$field]);

    $this->assertDatabaseMissing('laporans', ['lokasi' => 'Lab 3 Lt.2']);
})->with([
    'nilai_kerusakan',
    'nilai_risiko',
    'nilai_dampak',
    'nilai_frekuensi',
]);

it('menolak nilai SMART di luar skala 1-5', function (int $value): void {
    $this->actingAs(makeReporter())
        ->post('/api/v1/reports', array_merge(validReportPayload(), [
            'nilai_kerusakan' => $value,
            'foto' => UploadedFile::fake()->createWithContent('foto.png', pngBytes()),
        ]), ['Accept' => 'application/json'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['nilai_kerusakan']);
})->with([0, 6]);
