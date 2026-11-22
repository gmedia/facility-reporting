<?php

declare(strict_types=1);

namespace App\Actions\Laporan;

use App\Data\UpdateLaporanBuktiData;
use App\Models\Laporan;
use RuntimeException;

final class UpdateLaporanBukti
{
    /**
     * Simpan foto bukti ke laporan (dengan kompresi otomatis).
     */
    public function __invoke(UpdateLaporanBuktiData $data, Laporan $laporan): Laporan
    {
        // Hapus bukti lama kalau ada
        if ($laporan->foto_bukti) {
            $laporan->deleteFoto($laporan->foto_bukti);
        }

        $path = $laporan->storeFoto($data->fotoBukti, 'laporan/bukti');

        if ($path === false) {
            throw new RuntimeException('Gagal menyimpan foto bukti.');
        }

        $laporan->foto_bukti = $path;
        $laporan->save();

        return $laporan;
    }
}
