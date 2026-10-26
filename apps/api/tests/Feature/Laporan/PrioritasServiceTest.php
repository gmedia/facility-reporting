<?php

declare(strict_types=1);

use App\Services\PrioritasService;

it('menghitung skor SMART dari empat nilai kriteria', function (): void {
    $hasil = app(PrioritasService::class)->hitung(5, 4, 3, 2);

    expect($hasil->skor)->toBe(3.80)
        ->and($hasil->kategori)->toBe(PrioritasService::KATEGORI_SEDANG);
});

it('menempatkan skor terendah pada kategori rendah', function (): void {
    $hasil = app(PrioritasService::class)->hitung(1, 1, 1, 1);

    expect($hasil->skor)->toBe(1.00)
        ->and($hasil->kategori)->toBe(PrioritasService::KATEGORI_RENDAH);
});

it('menempatkan skor tepat 3,00 pada kategori sedang', function (): void {
    $hasil = app(PrioritasService::class)->hitung(3, 3, 3, 3);

    expect($hasil->skor)->toBe(3.00)
        ->and($hasil->kategori)->toBe(PrioritasService::KATEGORI_SEDANG);
});

it('menempatkan skor tepat 4,00 pada kategori tinggi', function (): void {
    $hasil = app(PrioritasService::class)->hitung(4, 4, 4, 4);

    expect($hasil->skor)->toBe(4.00)
        ->and($hasil->kategori)->toBe(PrioritasService::KATEGORI_TINGGI);
});

it('menempatkan skor tertinggi pada kategori tinggi', function (): void {
    $hasil = app(PrioritasService::class)->hitung(5, 5, 5, 5);

    expect($hasil->skor)->toBe(5.00)
        ->and($hasil->kategori)->toBe(PrioritasService::KATEGORI_TINGGI);
});

it('menolak nilai di luar skala 1 sampai 5', function (array $nilai): void {
    expect(fn () => app(PrioritasService::class)->hitung(...$nilai))
        ->toThrow(InvalidArgumentException::class);
})->with([
    'kerusakan 0' => [[0, 3, 3, 3]],
    'risiko 6' => [[3, 6, 3, 3]],
    'dampak 0' => [[3, 3, 0, 3]],
    'frekuensi 6' => [[3, 3, 3, 6]],
]);

it('memakai total bobot satu', function (): void {
    $bobot = config('prioritas.bobot');

    expect($bobot)->toBeArray()
        ->and(round((float) array_sum($bobot), 2))->toBe(1.00);
});
