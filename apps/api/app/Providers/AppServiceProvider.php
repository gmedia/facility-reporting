<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

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
        // Remove Sanctum's middleware from middleware priority so it doesn't force same_site => 'lax'
        $this->app->booted(function () {
            $kernel = $this->app->make(Kernel::class);
            $reflection = new \ReflectionClass($kernel);
            $property = $reflection->getProperty('middlewarePriority');
            $property->setAccessible(true);
            $middlewarePriority = $property->getValue($kernel);
            $key = array_search(EnsureFrontendRequestsAreStateful::class, $middlewarePriority, true);
            if ($key !== false) {
                unset($middlewarePriority[$key]);
                $property->setValue($kernel, array_values($middlewarePriority));
            }
        });

        // Disable default SameSite=lax on cookies so config('session.same_site') = '' works
        $this->app['cookie']->setDefaultPathAndDomain('/', null, false, null);

        RateLimiter::for('login', function (Request $request): Limit {
            $identifier = $request->input('identifier');

            $key = is_string($identifier) && $identifier !== ''
                ? 'login:'.strtolower(trim($identifier))
                : 'login:ip:'.$request->ip();

            return Limit::perMinutes(1, 5)->by($key);
        });
    }
}
