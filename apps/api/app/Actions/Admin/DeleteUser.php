<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;

final class DeleteUser
{
    public function __invoke(User $user): void
    {
        try {
            $user->delete();
        } catch (QueryException $e) {
            throw new HttpResponseException(
                (new JsonResponse([
                    'message' => 'Akun tidak dapat dihapus karena masih ada data yang terkait.',
                    'errors' => null,
                ], 422))
            );
        }
    }
}
