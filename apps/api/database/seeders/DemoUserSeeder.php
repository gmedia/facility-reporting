<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoUserSeeder extends Seeder
{
    /**
     * Create a demo account with the "user" role.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['nim' => '234110601001'],
            [
                'name' => 'Mahasiswa Demo',
                'email' => 'mahasiswa@facility.test',
                'password' => 'password',
                'role' => UserRole::User->value,
            ],
        );
    }
}
