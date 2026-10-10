<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureUserIsSuperAdmin
{
    /**
     * Abort with 403 unless the authenticated user is a super admin.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->role !== UserRole::SuperAdmin->value) {
            abort(403);
        }

        return $next($request);
    }
}
