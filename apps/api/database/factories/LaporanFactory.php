<?php

namespace Database\Factories;

use App\Enums\LaporanStatus;
use App\Models\Laporan;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Laporan>
 */
class LaporanFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'kategori' => fake()->randomElement(['elektronik', 'furniture', 'sarana_prasarana']),
            'lokasi' => fake()->unique()->words(3, true),
            'deskripsi' => fake()->sentence(12),
            'status' => LaporanStatus::MenungguVerifikasi->value,
        ];
    }
}
