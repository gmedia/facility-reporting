<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreUserRequest;
use App\Http\Requests\Api\V1\UpdateUserRequest;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

final class UserController extends Controller
{
    /**
     * List all admin accounts.
     */
    public function index(): JsonResponse
    {
        $admins = User::where('role', UserRole::Admin->value)->latest('id')->get();

        return response()->json([
            'data' => UserResource::collection($admins),
        ]);
    }

    /**
     * Create a new admin account.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = User::create([
            ...$request->validated(),
            'role' => UserRole::Admin->value,
        ]);

        return response()->json([
            'data' => new UserResource($user),
        ], 201);
    }

    /**
     * Update an admin account.
     */
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        abort_unless($user->role === UserRole::Admin->value, 404);

        $user->update($request->validated());

        return response()->json([
            'data' => new UserResource($user->fresh()),
        ]);
    }

    /**
     * Delete an admin account.
     */
    public function destroy(User $user): Response
    {
        abort_unless($user->role === UserRole::Admin->value, 404);

        $user->delete();

        return response()->noContent();
    }
}
