<?php

declare(strict_types=1);

namespace App\Actions\Laporan;

use App\Data\UpdateLaporanBuktiData;
use App\Models\Laporan;
use RuntimeException;

final class UpdateLaporanBukti
{
    /**
     * Simpan foto bukti ke laporan.
     */
    public function __invoke(UpdateLaporanBuktiData $data, Laporan $laporan): Laporan
    {
        $path = $data->fotoBukti->store('bukti', 'public');

        if ($path === false) {
            throw new RuntimeException('Gagal menyimpan foto bukti.');
        }

        $laporan->foto_bukti = $path;
        $laporan->save();

        return $laporan;
    }
}
