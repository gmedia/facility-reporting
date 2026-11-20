<?php

declare(strict_types=1);

namespace App\Actions\Profile;

use App\Data\UpdateProfileFotoData;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

final class UpdateProfileFoto
{
    /**
     * Simpan foto profil user, lalu hapus berkas lama supaya tidak menumpuk.
     */
    public function __invoke(UpdateProfileFotoData $data, User $user): User
    {
        $lama = $user->foto;

        $path = $data->foto->store('profil', 'public');

        if ($path === false) {
            throw new RuntimeException('Gagal menyimpan foto profil.');
        }

        $user->foto = $path;
        $user->save();

        if ($lama !== null && $lama !== $path) {
            Storage::disk('public')->delete($lama);
        }

        return $user->fresh();
    }
}
