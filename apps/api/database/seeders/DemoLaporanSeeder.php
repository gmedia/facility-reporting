<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\LaporanKategori;
use App\Enums\LaporanStatus;
use App\Enums\UserRole;
use App\Models\Laporan;
use App\Models\LaporanStatusHistory;
use App\Models\User;
use App\Services\PrioritasService;
use Illuminate\Database\Seeder;

class DemoLaporanSeeder extends Seeder
{
    /**
     * Sepuluh laporan contoh dengan empat nilai SMART dan status bervariasi.
     *
     * @var list<array{kategori: LaporanKategori, lokasi: string, deskripsi: string, nilai: array{int, int, int, int}, status: LaporanStatus}>
     */
    private const LAPORAN = [
        [
            'kategori' => LaporanKategori::Elektronik,
            'lokasi' => 'Gedung A - Ruang 101',
            'deskripsi' => 'Lampu ruang kelas berkedip dan stopkontak mengeluarkan bau gosong.',
            'nilai' => [5, 4, 4, 5],
            'status' => LaporanStatus::Diproses,
        ],
        [
            'kategori' => LaporanKategori::Elektronik,
            'lokasi' => 'Gedung A - Lab Komputer 2',
            'deskripsi' => 'Tiga unit komputer tidak menyala sejak listrik padam pekan lalu.',
            'nilai' => [4, 3, 4, 3],
            'status' => LaporanStatus::Valid,
        ],
        [
            'kategori' => LaporanKategori::Furnitur,
            'lokasi' => 'Gedung B - Ruang Dosen 203',
            'deskripsi' => 'Kursi pimpinan patah pada bagian sandaran sehingga tidak bisa dipakai.',
            'nilai' => [2, 2, 2, 3],
            'status' => LaporanStatus::MenungguVerifikasi,
        ],
        [
            'kategori' => LaporanKategori::Bangunan,
            'lokasi' => 'Gedung B - Toilet Lantai 2',
            'deskripsi' => 'Keran air bocor terus sehingga lantai selalu basah dan licin.',
            'nilai' => [4, 4, 3, 4],
            'status' => LaporanStatus::Valid,
        ],
        [
            'kategori' => LaporanKategori::Kelistrikan,
            'lokasi' => 'Gedung C - Panel Listrik',
            'deskripsi' => 'Panel listrik berisik dan panas berlebihan saat beban penuh.',
            'nilai' => [5, 5, 4, 3],
            'status' => LaporanStatus::Diproses,
        ],
        [
            'kategori' => LaporanKategori::Bangunan,
            'lokasi' => 'Gedung C - Atap Koridor',
            'deskripsi' => 'Atap koridor bocor saat hujan sehingga air menetes ke jalan orang lewat.',
            'nilai' => [5, 4, 5, 2],
            'status' => LaporanStatus::Ditolak,
        ],
        [
            'kategori' => LaporanKategori::Elektronik,
            'lokasi' => 'Gedung A - Ruang Server',
            'deskripsi' => 'Pendingin ruang server mati sehingga suhu perangkat naik terus.',
            'nilai' => [4, 5, 5, 4],
            'status' => LaporanStatus::MenungguVerifikasi,
        ],
        [
            'kategori' => LaporanKategori::Furnitur,
            'lokasi' => 'Gedung D - Aula',
            'deskripsi' => 'Meja lipat aula goyang dan catnya sudah mengelupas di beberapa sisi.',
            'nilai' => [1, 1, 2, 1],
            'status' => LaporanStatus::Ditolak,
        ],
        [
            'kategori' => LaporanKategori::Lainnya,
            'lokasi' => 'Area Parkir - Pos Satpam',
            'deskripsi' => 'Lampu penerangan pos satpam mati sehingga area parkir gelap saat malam.',
            'nilai' => [2, 3, 2, 2],
            'status' => LaporanStatus::MenungguVerifikasi,
        ],
        [
            'kategori' => LaporanKategori::Kelistrikan,
            'lokasi' => 'Gedung D - Trafo Distribusi',
            'deskripsi' => 'Trafo distribusi mengeluarkan suara berdecit dan minyak bocor.',
            'nilai' => [5, 4, 4, 5],
            'status' => LaporanStatus::Valid,
        ],
    ];

    public function __construct(
        private readonly PrioritasService $prioritasService,
    ) {}

    public function run(): void
    {
        $this->call(DemoUserSeeder::class);

        // firstOrFail, bukan sole: database lokal bisa punya beberapa admin dari uji manual.
        $pelapor = User::query()->where('email', 'mahasiswa@facility.test')->firstOrFail();
        $admin = User::query()->where('role', UserRole::Admin->value)->firstOrFail();

        foreach (self::LAPORAN as $data) {
            [$kerusakan, $risiko, $dampak, $frekuensi] = $data['nilai'];

            // Skor dihitung lewat jalur yang sama dengan aplikasi, bukan angka manual.
            $prioritas = $this->prioritasService->hitung($kerusakan, $risiko, $dampak, $frekuensi);

            $laporan = Laporan::updateOrCreate(
                ['user_id' => $pelapor->id, 'lokasi' => $data['lokasi']],
                [
                    'kategori' => $data['kategori']->value,
                    'deskripsi' => $data['deskripsi'],
                    'nilai_kerusakan' => $kerusakan,
                    'nilai_risiko' => $risiko,
                    'nilai_dampak' => $dampak,
                    'nilai_frekuensi' => $frekuensi,
                    'skor_prioritas' => (string) $prioritas->skor,
                ],
            );

            // status sengaja tidak fillable, jadi di-assign langsung.
            if ($laporan->status !== $data['status']) {
                $laporan->status = $data['status'];
                $laporan->save();
            }

            $this->catatRiwayat($laporan, $admin->id);
        }
    }

    /**
     * Catat perpindahan status yang dilalui, supaya timeline demo tidak kosong.
     */
    private function catatRiwayat(Laporan $laporan, int $adminId): void
    {
        $jalur = match ($laporan->status) {
            LaporanStatus::Valid => [LaporanStatus::MenungguVerifikasi, LaporanStatus::Valid],
            LaporanStatus::Diproses => [
                LaporanStatus::MenungguVerifikasi,
                LaporanStatus::Valid,
                LaporanStatus::Diproses,
            ],
            LaporanStatus::Ditolak => [LaporanStatus::MenungguVerifikasi, LaporanStatus::Ditolak],
            default => [],
        };

        $sebelum = null;

        foreach ($jalur as $status) {
            if ($sebelum !== null) {
                LaporanStatusHistory::updateOrCreate(
                    ['laporan_id' => $laporan->id, 'status_to' => $status->value],
                    ['status_from' => $sebelum->value, 'changed_by' => $adminId],
                );
            }

            $sebelum = $status;
        }
    }
}
