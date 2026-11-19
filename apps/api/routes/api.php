<?php

use App\Http\Controllers\Api\V1\Admin\UserController;
use App\Http\Controllers\Api\V1\Auth\LoginController;
use App\Http\Controllers\Api\V1\Auth\LogoutController;
use App\Http\Controllers\Api\V1\Auth\MeController;
use App\Http\Controllers\Api\V1\LaporanController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\StatusController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Admin\LocationSettingController;
use App\Http\Controllers\Api\V1\Admin\ReporterLocationController;
use App\Http\Controllers\Api\V1\MeLocationController;
use App\Http\Controllers\Api\V1\Admin\ReporterPasswordController;

Route::prefix('v1')->group(function (): void {
    Route::get('status', StatusController::class);

    Route::post('auth/login', LoginController::class)
        ->middleware('throttle:login');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::post('auth/logout', LogoutController::class);
        Route::get('auth/me', MeController::class);

        // Akun milik user sendiri: foto profil & ganti password (issue #93)
        Route::post('profile/foto', [ProfileController::class, 'updateFoto']);
        Route::patch('profile/password', [ProfileController::class, 'changePassword']);
        Route::post('profile/lokasi', MeLocationController::class)
            ->middleware('throttle:30,1');

        Route::get('reports', [LaporanController::class, 'index']);
        Route::post('reports', [LaporanController::class, 'store']);

        // Titik pusat + radius, boleh dibaca semua user yang login. Pelapor
        // butuh nilainya untuk memeriksa jarak sebelum mengirim laporan.
        // Mengubahnya tetap khusus super admin (lihat admin/location-settings).
        Route::get('location-settings', [LocationSettingController::class, 'show']);

        // User can view their own report's history
        Route::get('reports/{laporan}/history', [LaporanController::class, 'history']);

        Route::middleware('admin')->group(function (): void {
            Route::patch('reports/{laporan}/status', [LaporanController::class, 'updateStatus']);
            Route::patch('reports/{laporan}/bukti', [LaporanController::class, 'updateBukti']);
        });

        Route::middleware('super_admin')->group(function (): void {
            Route::put('admin/users/{user}/deactivate', [UserController::class, 'deactivate']);
            Route::put('admin/users/{user}/activate', [UserController::class, 'activate']);
            Route::get('admin/location-settings', [LocationSettingController::class, 'show']);
            Route::put('admin/location-settings', [LocationSettingController::class, 'update']);
            Route::get('admin/reporter-locations', ReporterLocationController::class);
            Route::get('admin/reporters', [ReporterPasswordController::class, 'index']);
            Route::post('admin/reporters/{user}/reset-password', [ReporterPasswordController::class, 'reset'])
                ->middleware('throttle:20,1');
            Route::apiResource('admin/users', UserController::class)
                ->only(['index', 'store', 'update', 'destroy']);
        });
    });
});
