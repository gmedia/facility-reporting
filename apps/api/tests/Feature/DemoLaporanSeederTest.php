<?php

declare(strict_types=1);

use App\Enums\LaporanStatus;
use App\Enums\UserRole;
use App\Models\Laporan;
use App\Models\LaporanStatusHistory;
use App\Models\User;
use App\Services\PrioritasService;
use Database\Seeders\DemoLaporanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('seeds demo laporan with computed priority idempotently', function (): void {
    $this->seed(DemoLaporanSeeder::class);
    $this->seed(DemoLaporanSeeder::class);

    $laporan = Laporan::query()->get();
    $prioritas = app(PrioritasService::class);

    expect($laporan)->toHaveCount(10)
        ->and(User::query()->where('role', UserRole::Admin->value)->count())->toBe(1)
        ->and(LaporanStatusHistory::query()->count())->toBeGreaterThan(0)
        ->and($laporan->pluck('status'))
        ->toContain(LaporanStatus::MenungguVerifikasi)
        ->toContain(LaporanStatus::Valid)
        ->toContain(LaporanStatus::Diproses)
        ->toContain(LaporanStatus::Ditolak);

    foreach ($laporan as $item) {
        $nilai = [
            $item->nilai_kerusakan,
            $item->nilai_risiko,
            $item->nilai_dampak,
            $item->nilai_frekuensi,
        ];

        foreach ($nilai as $angka) {
            expect($angka)->toBeGreaterThanOrEqual(1)->toBeLessThanOrEqual(5);
        }

        expect((float) $item->skor_prioritas)->toBe($prioritas->hitung(...$nilai)->skor);
    }
});
