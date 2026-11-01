<?php

declare(strict_types=1);

namespace App\Actions\Laporan;

use App\Models\Laporan;
use App\Models\LaporanStatusHistory;
use Illuminate\Database\Eloquent\Collection;

final class ListLaporanStatusHistory
{
    /**
     * Ambil riwayat perubahan status suatu laporan.
     *
     * @return Collection<int, LaporanStatusHistory>
     */
    public function __invoke(Laporan $laporan): Collection
    {
        return LaporanStatusHistory::where('laporan_id', $laporan->id)
            ->with('changedBy')
            ->orderByDesc('created_at')
            ->get();
    }
}
