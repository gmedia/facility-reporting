<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Actions\Auth\Login;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\LoginRequest;
use App\Http\Resources\Api\V1\UserResource;

class LoginController extends Controller
{
    public function __invoke(LoginRequest $request, Login $action): UserResource
    {
        return new UserResource($action($request->toDTO()));
    }
}
