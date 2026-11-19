<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Enums\UserRole;
use App\Models\LocationSetting;
use App\Models\User;
use App\Support\GeoDistance;
use Carbon\Carbon;
use Illuminate\Support\Collection;

final class GetReporterLocations
{
    /**
     * @return array{
     *     rows: Collection<int, array{
     *         id: int,
     *         name: string,
     *         nim: string|null,
     *         lat: float|null,
     *         lng: float|null,
     *         last_location_at: Carbon|null,
     *         distance_m: int|null,
     *         status: string
     *     }>,
     *     summary: array{
     *         total: int,
     *         outside: int,
     *         inside: int,
     *         unknown: int,
     *         radius_m: int
     *     }
     * }
     */
    public function __invoke(): array
    {
        $setting = LocationSetting::current();

        $rows = User::query()
            ->whereNotIn('role', [UserRole::Admin->value, UserRole::SuperAdmin->value])
            ->where('active', true)
            ->orderBy('name')
            ->get()
            ->map(function (User $user) use ($setting): array {
                $distance = ($user->last_lat !== null && $user->last_lng !== null)
                    ? (int) round(GeoDistance::meters(
                        $setting->center_lat,
                        $setting->center_lng,
                        $user->last_lat,
                        $user->last_lng,
                    ))
                    : null;

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'nim' => $user->nim,
                    'lat' => $user->last_lat,
                    'lng' => $user->last_lng,
                    'last_location_at' => $user->last_location_at,
                    'distance_m' => $distance,
                    // inside | outside | unknown (belum pernah mengirim lokasi)
                    'status' => match (true) {
                        $distance === null => 'unknown',
                        $distance <= $setting->radius_m => 'inside',
                        default => 'outside',
                    },
                ];
            })
            // Terjauh dulu, seperti tabel di prototipe. Yang belum ada lokasi paling bawah.
            ->sortByDesc(fn (array $row) => $row['distance_m'] ?? -1)
            ->values();

        return [
            'rows' => $rows,
            'summary' => [
                'total' => $rows->count(),
                'outside' => $rows->where('status', 'outside')->count(),
                'inside' => $rows->where('status', 'inside')->count(),
                'unknown' => $rows->where('status', 'unknown')->count(),
                'radius_m' => $setting->radius_m,
            ],
        ];
    }
}
