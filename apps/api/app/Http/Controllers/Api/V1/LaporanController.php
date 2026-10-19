<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Actions\Laporan\ListLaporan;
use App\Actions\Laporan\StoreLaporan;
use App\Actions\Laporan\UpdateLaporanStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreLaporanRequest;
use App\Http\Requests\Api\V1\UpdateLaporanStatusRequest;
use App\Http\Resources\Api\V1\LaporanResource;
use App\Models\Laporan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class LaporanController extends Controller
{
    /**
     * List the reports visible to the authenticated user.
     *
     * A regular user only sees their own reports; admins see every report.
     */
    public function index(Request $request, ListLaporan $action): AnonymousResourceCollection
    {
        $user = $request->user();
        abort_unless($user !== null, 401);

        return LaporanResource::collection($action($user));
    }

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

    /**
     * Change the status of a report.
     *
     * Guarded by the `admin` middleware, so only admins and super admins
     * can reach this method.
     */
    public function updateStatus(
        UpdateLaporanStatusRequest $request,
        Laporan $laporan,
        UpdateLaporanStatus $action,
    ): LaporanResource {
        return new LaporanResource($action($request->toDTO(), $laporan));
    }
}
