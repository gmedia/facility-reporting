<?php

declare(strict_types=1);

namespace App\Services;

use App\Data\PrioritasData;
use App\Enums\PrioritasKategori;
use InvalidArgumentException;

final class PrioritasService
{
    /**
     * Hitung skor SMART dari empat nilai kriteria.
     */
    public function hitung(int $kerusakan, int $risiko, int $dampak, int $frekuensi): PrioritasData
    {
        $this->pastikanDalamSkala($kerusakan, $risiko, $dampak, $frekuensi);

        $skor = round(
            ($kerusakan * (float) config('prioritas.bobot.kerusakan'))
            + ($risiko * (float) config('prioritas.bobot.risiko'))
            + ($dampak * (float) config('prioritas.bobot.dampak'))
            + ($frekuensi * (float) config('prioritas.bobot.frekuensi')),
            2,
        );

        return new PrioritasData(
            skor: $skor,
            kategori: $this->kategori($skor),
        );
    }

    private function pastikanDalamSkala(int ...$nilai): void
    {
        $min = (int) config('prioritas.skala.min');
        $max = (int) config('prioritas.skala.max');

        foreach ($nilai as $item) {
            if ($item < $min || $item > $max) {
                throw new InvalidArgumentException(
                    "Nilai prioritas harus berada di antara {$min} dan {$max}.",
                );
            }
        }
    }

    private function kategori(float $skor): PrioritasKategori
    {
        if ($skor >= (float) config('prioritas.kategori.tinggi')) {
            return PrioritasKategori::Tinggi;
        }

        if ($skor >= (float) config('prioritas.kategori.sedang')) {
            return PrioritasKategori::Sedang;
        }

        return PrioritasKategori::Rendah;
    }
}
