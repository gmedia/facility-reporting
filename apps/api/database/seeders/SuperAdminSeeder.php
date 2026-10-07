<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;

class SuperAdminSeeder extends Seeder
{
    /**
     * Create the initial super admin account.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'superadmin@facility.test'],
            [
                'name' => 'Super Admin',
                'nim' => null,
                'password' => 'password',
                'role' => UserRole::SuperAdmin->value,
            ],
        );
    }
}
