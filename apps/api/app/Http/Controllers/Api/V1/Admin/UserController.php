<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Admin\CreateUser;
use App\Actions\Admin\DeleteUser;
use App\Actions\Admin\UpdateUser;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreUserRequest;
use App\Http\Requests\Api\V1\UpdateUserRequest;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

final class UserController extends Controller
{
    /**
     * List all admin accounts.
     */
    public function index(): AnonymousResourceCollection
    {
        $admins = User::where('role', UserRole::Admin->value)->latest('id')->get();

        return UserResource::collection($admins);
    }

    /**
     * Create a new admin account.
     */
    public function store(StoreUserRequest $request, CreateUser $action): JsonResponse
    {
        return (new UserResource($action($request->toDTO())))->response()->setStatusCode(201);
    }

    /**
     * Update an admin account.
     */
    public function update(UpdateUserRequest $request, User $user, UpdateUser $action): UserResource
    {
        abort_unless($user->role === UserRole::Admin->value, 404);

        return new UserResource($action($request->toDTO(), $user));
    }

    /**
     * Delete an admin account.
     */
    public function destroy(User $user, DeleteUser $action): Response
    {
        abort_unless($user->role === UserRole::Admin->value, 404);

        $action($user);

        return response()->noContent();
    }
}
