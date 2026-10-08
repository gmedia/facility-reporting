<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Actions\Auth\Login;
use App\Data\LoginData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\LoginRequest;
use App\Http\Resources\Api\V1\UserResource;
use Illuminate\Http\JsonResponse;

class LoginController extends Controller
{
    public function __invoke(LoginRequest $request, Login $action): JsonResponse
    {
        $data = new LoginData(
            identifier: $request->validated('identifier'),
            password: $request->validated('password'),
        );

        return response()->json([
            'data' => new UserResource($action($data)),
        ]);
    }
}
