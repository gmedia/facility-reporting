<?php

namespace App\Http\Middleware;

use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful as SanctumEnsureFrontendRequestsAreStateful;

class EnsureFrontendRequestsAreStateful extends SanctumEnsureFrontendRequestsAreStateful
{
    /**
     * Configure secure cookie sessions.
     *
     * Override to NOT force same_site => 'lax' which breaks cross-origin cookies.
     *
     * @return void
     */
    protected function configureSecureCookieSessions()
    {
        config([
            'session.http_only' => true,
            // Do NOT force same_site => 'lax' - let config('session.same_site') take effect
            // config([
            //     'session.http_only' => true,
            //     'session.same_site' => 'lax',
            // ]);
        ]);
    }
}
