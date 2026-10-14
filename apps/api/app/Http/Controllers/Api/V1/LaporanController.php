<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Actions\Laporan\StoreLaporan;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreLaporanRequest;
use App\Http\Resources\Api\V1\LaporanResource;
use Illuminate\Http\JsonResponse;

final class LaporanController extends Controller
{
    /**
     * Store a new facility report.
     */
    public function store(StoreLaporanRequest $request, StoreLaporan $action): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 401);

        $laporan = $action($request->toDTO(), (int) $user->id);

        return (new LaporanResource($laporan))->response()->setStatusCode(201);
    }
}
