<?php

use App\Http\Middleware\EnsureFrontendRequestsAreStateful;
use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\EnsureUserIsSuperAdmin;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Disable Sanctum's default stateful middleware that forces same_site => 'lax'
        // Use our custom middleware that respects config('session.same_site')
        $middleware->remove(Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class);
        $middleware->append(EnsureFrontendRequestsAreStateful::class);
        $middleware->alias([
            'admin' => EnsureUserIsAdmin::class,
            'super_admin' => EnsureUserIsSuperAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
