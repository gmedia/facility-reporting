<?php

use App\Http\Middleware\EnsureFrontendRequestsAreStateful;
use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\EnsureUserIsSuperAdmin;
use App\Http\Middleware\ExposeCsrfTokenHeader;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Sanctum sudah mendaftarkan EnsureFrontendRequestsAreStateful di grup
        // `api` saat `statefulApi()` aktif. Kelas bawaan itu memaksa
        // same_site => 'lax', jadi yang diganti adalah kelasnya, bukan grupnya.
        // (Kalau kelas bawaan di-remove lewat $middleware->remove(), middleware
        // stateful ikut hilang seluruhnya dan login tidak pernah membuat sesi.)
        $middleware->statefulApi();
        $middleware->api(replace: [
            Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class => EnsureFrontendRequestsAreStateful::class,
        ]);
        // Beda domain (Vercel ↔ Railway): cookie `XSRF-TOKEN` tidak bisa dibaca
        // dari halaman web, jadi nilainya juga dikirim sebagai header respons.
        $middleware->append(ExposeCsrfTokenHeader::class);
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
