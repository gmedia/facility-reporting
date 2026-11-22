<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

/**
 * Membuat akun superadmin pertama di lingkungan produksi.
 *
 * Seeder bawaan memakai password `password` sehingga tidak aman untuk
 * produksi. Perintah ini minta password secara interaktif (tidak muncul di
 * shell history) atau lewat env SUPERADMIN_PASSWORD saat otomatis.
 */
class CreateSuperAdmin extends Command
{
    protected $signature = 'app:create-superadmin
        {--email= : Email superadmin}
        {--name= : Nama yang ditampilkan}
        {--password= : Password (kosongkan untuk input interaktif)}
        {--force : Timpa akun yang sudah ada (reset password & role)}';

    protected $description = 'Buat (atau perbarui) akun superadmin dengan password yang aman';

    public function handle(): int
    {
        $email = (string) ($this->option('email') ?: env('SUPERADMIN_EMAIL', ''));
        $name = (string) ($this->option('name') ?: env('SUPERADMIN_NAME', 'Super Admin'));
        $password = (string) ($this->option('password') ?: env('SUPERADMIN_PASSWORD', ''));

        if ($email === '' && $this->input->isInteractive()) {
            $email = (string) $this->ask('Email superadmin');
        }

        if ($password === '' && $this->input->isInteractive()) {
            $password = (string) $this->secret('Password superadmin');
        }

        $validator = Validator::make(
            ['email' => $email, 'password' => $password, 'name' => $name],
            [
                'email' => ['required', 'email', 'max:255'],
                'name' => ['required', 'string', 'max:255'],
                'password' => ['required', 'string', 'min:12'],
            ],
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        $existing = User::where('email', $email)->first();
        if ($existing !== null && ! $this->option('force')) {
            $this->error("User {$email} sudah ada. Gunakan --force untuk mereset password & role.");
            $this->line('(Tambahkan --no-interaction bila dijalankan otomatis.)');

            return self::FAILURE;
        }

        User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'nim' => null,
                'password' => $password,
                'role' => UserRole::SuperAdmin->value,
                'active' => true,
                'password_changed_at' => null,
            ],
        );

        $this->info("Superadmin {$email} siap. Password akan diminta diganti saat login pertama.");

        return self::SUCCESS;
    }
}
