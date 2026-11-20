<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\PasswordResetLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class ResetUserPassword
{
    // Tanpa karakter yang mudah tertukar (I, O, l, 0, 1) karena password
    // ini akan dibacakan atau dicatat tangan oleh mahasiswa.
    private const HURUF_BESAR = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

    private const HURUF_KECIL = 'abcdefghijkmnopqrstuvwxyz';

    private const ANGKA = '23456789';

    /**
     * Reset password `$target` ke password sementara acak dan kembalikan
     * password itu (satu-satunya kesempatan melihatnya).
     */
    public function __invoke(User $target, User $actor, ?string $ip = null): string
    {
        $password = $this->buatPassword();

        DB::transaction(function () use ($target, $actor, $ip, $password): void {
            // Cast `hashed` di model yang meng-hash. `password_changed_at`
            // dikosongkan supaya pengguna diminta menggantinya saat login.
            $target->forceFill([
                'password' => $password,
                'password_changed_at' => null,
                'remember_token' => Str::random(60),
            ])->save();

            // Keluarkan semua perangkat yang masih login dengan password lama.
            $target->tokens()->delete();

            // Sesi SPA (cookie) hanya bisa dicabut dari sini bila sesi
            // disimpan di database.
            if (config('session.driver') === 'database') {
                DB::table((string) config('session.table', 'sessions'))
                    ->where('user_id', $target->id)
                    ->delete();
            }

            PasswordResetLog::create([
                'user_id' => $target->id,
                'performed_by' => $actor->id,
                'ip_address' => $ip,
            ]);
        });

        return $password;
    }

    /**
     * 12 karakter: 3 huruf besar, 6 huruf kecil, 3 angka, lalu diacak.
     * Selalu lolos aturan password aplikasi (min 8, ada huruf besar, ada
     * angka). Memakai random_int (CSPRNG), bukan str_shuffle.
     */
    private function buatPassword(): string
    {
        $karakter = [
            ...$this->pilih(self::HURUF_BESAR, 3),
            ...$this->pilih(self::HURUF_KECIL, 6),
            ...$this->pilih(self::ANGKA, 3),
        ];

        for ($i = count($karakter) - 1; $i > 0; $i--) {
            $j = random_int(0, $i);
            [$karakter[$i], $karakter[$j]] = [$karakter[$j], $karakter[$i]];
        }

        return implode('', $karakter);
    }

    /**
     * @return list<string>
     */
    private function pilih(string $alfabet, int $jumlah): array
    {
        $hasil = [];
        $maks = strlen($alfabet) - 1;

        for ($i = 0; $i < $jumlah; $i++) {
            $hasil[] = $alfabet[random_int(0, $maks)];
        }

        return $hasil;
    }
}
