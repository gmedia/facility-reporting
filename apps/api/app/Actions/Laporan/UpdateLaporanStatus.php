<?php

declare(strict_types=1);

namespace App\Actions\Laporan;

use App\Data\UpdateLaporanStatusData;
use App\Models\Laporan;

final class UpdateLaporanStatus
{
    /**
     * Update the status of a report.
     *
     * The status is assigned directly instead of through mass assignment
     * because it is intentionally absent from the model's fillable list.
     */
    public function __invoke(UpdateLaporanStatusData $data, Laporan $laporan): Laporan
    {
        $laporan->status = $data->status;
        $laporan->save();

        return $laporan;
    }
}
