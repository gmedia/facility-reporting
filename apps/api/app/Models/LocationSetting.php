<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['center_lat', 'center_lng', 'radius_m'])]
class LocationSetting extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'center_lat' => 'float',
            'center_lng' => 'float',
            'radius_m' => 'integer',
        ];
    }

    /**
     * Ambil satu-satunya baris pengaturan. Dibuat otomatis dengan nilai awal
     * (sama dengan prototipe) bila belum ada.
     */
    public static function current(): self
    {
        return static::query()->firstOrCreate([], [
            'center_lat' => -7.3859479,
            'center_lng' => 109.2368010,
            'radius_m' => 400,
        ]);
    }
}
