<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Salin token CSRF ke header respons `XSRF-TOKEN`.
 *
 * Laravel hanya menaruh token di cookie `XSRF-TOKEN`. Saat web dan API berbeda
 * domain (Vercel ↔ Railway) cookie itu milik domain API, sehingga halaman web
 * tidak bisa membacanya lewat `document.cookie`. Header dengan nilai yang sama
 * (diekspos via CORS `exposed_headers`) memberi cara resmi bagi web untuk
 * mendapatkan token tanpa harus berbagi domain.
 */
class ExposeCsrfTokenHeader
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (! $request->hasSession()) {
            return $response;
        }

        foreach ($response->headers->getCookies() as $cookie) {
            if ($cookie->getName() === 'XSRF-TOKEN') {
                $response->headers->set('XSRF-TOKEN', $cookie->getValue());

                break;
            }
        }

        return $response;
    }
}
