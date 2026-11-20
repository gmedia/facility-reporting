<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Actions\Profile\ChangePassword;
use App\Actions\Profile\UpdateProfileFoto;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\ChangePasswordRequest;
use App\Http\Requests\Api\V1\UpdateProfileFotoRequest;
use App\Http\Resources\Api\V1\UserResource;
use Illuminate\Http\JsonResponse;

final class ProfileController extends Controller
{
    /**
     * Upload foto profil milik user yang sedang login.
     */
    public function updateFoto(UpdateProfileFotoRequest $request, UpdateProfileFoto $action): UserResource
    {
        $user = $request->user();
        abort_unless($user !== null, 401);

        return new UserResource($action($request->toDTO(), $user));
    }

    /**
     * Ganti password user yang sedang login.
     */
    public function changePassword(ChangePasswordRequest $request, ChangePassword $action): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 401);

        $action($request->toDTO(), $user);

        return response()->json(['message' => 'Password berhasil diperbarui.']);
    }
}
