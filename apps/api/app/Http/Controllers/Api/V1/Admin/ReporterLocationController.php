<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Admin\GetReporterLocations;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

final class ReporterLocationController extends Controller
{
    /**
     * Daftar pelapor beserta jarak dari titik pusat dan status radius.
     */
    public function __invoke(GetReporterLocations $action): JsonResponse
    {
        $result = $action();

        return response()->json([
            'data' => $result['rows'],
            'summary' => $result['summary'],
        ]);
    }
}
