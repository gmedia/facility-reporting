<?php

namespace App\Providers;

use Dedoc\Scramble\Scramble;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        if (! app()->environment(['local', 'testing']) && ! config('app.api_docs_public', false)) {
            Scramble::ignoreDefaultRoutes();
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('login', function (Request $request): Limit {
            $identifier = $request->input('identifier');

            $key = is_string($identifier) && $identifier !== ''
                ? 'login:'.strtolower(trim($identifier))
                : 'login:ip:'.$request->ip();

            return Limit::perMinutes(1, 5)->by($key);
        });
    }
}
