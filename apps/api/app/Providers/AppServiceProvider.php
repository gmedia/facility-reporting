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
        // Disable default SameSite=lax on cookies so config('session.same_site') = '' works
        $this->app->make('cookie')->setDefaultPathAndDomain('/', null, false, null);

        RateLimiter::for('login', function (Request $request): Limit {
            $identifier = $request->input('identifier');
            $identifier = is_string($identifier) ? $identifier : '';

            $key = $identifier !== ''
                ? 'login:'.strtolower(trim($identifier))
                : 'login:ip:'.$request->ip();

            return Limit::perMinutes(1, 5)->by($key);
        });
    }
}
