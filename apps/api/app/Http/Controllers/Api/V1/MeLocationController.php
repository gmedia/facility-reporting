<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Actions\Profile\UpdateMyLocation;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\UpdateMyLocationRequest;
use Illuminate\Http\JsonResponse;

final class MeLocationController extends Controller
{
    /**
     * Pelapor mengirim lokasi GPS terakhirnya.
     */
    public function __invoke(UpdateMyLocationRequest $request, UpdateMyLocation $action): JsonResponse
    {
        $action($request->toDTO(), $request->user());

        return response()->json(['message' => 'Lokasi tersimpan.']);
    }
}
