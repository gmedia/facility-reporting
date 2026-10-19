<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class MahasiswaSeeder extends Seeder
{
    /**
     * Seed mahasiswa accounts from CSV/TSV files in database/seeders/data.
     */
    public function run(): void
    {
        $files = $this->files();

        if ($files === []) {
            $this->command?->warn('MahasiswaSeeder: tidak ada CSV/TSV di database/seeders/data.');

            return;
        }

        $password = Hash::make('password');

        foreach ($files as $file) {
            $this->seedFile($file, $password);
        }
    }

    /**
     * @return list<string>
     */
    private function files(): array
    {
        $directory = database_path('seeders/data');
        $files = array_merge(
            glob($directory.'/*.csv') ?: [],
            glob($directory.'/*.tsv') ?: [],
        );

        sort($files);

        return array_values($files);
    }

    private function seedFile(string $file, string $password): void
    {
        $handle = fopen($file, 'r');

        if ($handle === false) {
            $this->command?->warn("MahasiswaSeeder: gagal membuka {$file}.");

            return;
        }

        $header = fgetcsv($handle, null, $this->delimiter($file));
        $header = is_array($header) ? array_map(static fn (mixed $value): string => trim((string) $value), $header) : [];

        while (($row = fgetcsv($handle, null, $this->delimiter($file))) !== false) {
            if (count($row) !== count($header)) {
                continue;
            }

            $data = array_combine($header, array_map(static fn (mixed $value): string => trim((string) $value), $row)) ?: [];

            $nim = $data['NIM'] ?? '';
            $name = $data['Nama'] ?? '';

            if ($nim === '' || $name === '') {
                continue;
            }

            $email = $data['Email'] ?? '';

            $user = User::firstOrNew(['nim' => $nim]);
            $user->name = $name;
            $user->email = $email !== '' ? $email : null;
            $user->role = UserRole::User->value;

            if (! $user->exists) {
                $user->password = $password;
            }

            $user->save();
        }

        fclose($handle);
    }

    private function delimiter(string $file): string
    {
        return str_ends_with(strtolower($file), '.tsv') ? "\t" : ',';
    }
}
