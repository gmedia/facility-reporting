<?php

declare(strict_types=1);

use App\Enums\UserRole;
use App\Models\User;
use Database\Seeders\MahasiswaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('seeds mahasiswa from CSV idempotently', function (): void {
    $directory = database_path('seeders/data');

    if (! is_dir($directory)) {
        mkdir($directory, 0777, true);
    }

    $file = $directory.'/mahasiswa-test-'.uniqid().'.csv';
    file_put_contents(
        $file,
        "No.,NIM,Nama,Angkatan,Prodi,Email,JK,HP,Status\n"
        ."1.,999999999999,Mahasiswa Uji,2023,Teknik Informatika,mahasiswa-uji@facility.test,L,080000000000,Aktif\n"
        ."2.,kolom-kurang\n"
        ."3.,999999999998,Mahasiswa Uji Dua,2024,Sistem Informasi,mahasiswa-uji@facility.test,P,080000000001,Aktif\n",
    );

    try {
        $this->seed(MahasiswaSeeder::class);
        $this->seed(MahasiswaSeeder::class);

        $user = User::query()->where('nim', '999999999999')->sole();
        $duplicate = User::query()->where('nim', '999999999998')->sole();

        expect($user->name)->toBe('Mahasiswa Uji')
            ->and($user->email)->toBe('mahasiswa-uji@facility.test')
            ->and($user->role)->toBe(UserRole::User->value)
            ->and(User::query()->where('nim', '999999999999')->count())->toBe(1)
            ->and($duplicate->email)->toBeNull()
            ->and($duplicate->role)->toBe(UserRole::User->value);
    } finally {
        @unlink($file);
    }
});
