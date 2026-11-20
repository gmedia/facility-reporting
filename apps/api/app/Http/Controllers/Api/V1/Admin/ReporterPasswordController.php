<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Admin\ResetUserPassword;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ReporterPasswordController extends Controller
{
    /**
     * Cari akun mahasiswa (nama, NIM, atau e-mail), default 10 per halaman
     * (bisa diubah lewat `per_page`, maksimal 50).
     * Admin dan super admin tidak ikut: password mereka dikelola lewat
     * halaman Akun Admin.
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);
        $kata = mb_strtolower(trim((string) $request->query('q', '')));
        $perHalaman = $request->integer('per_page', 10);

        $query = User::query()->whereNotIn('role', [
            UserRole::Admin->value,
            UserRole::SuperAdmin->value,
        ]);

        if ($kata !== '') {
            $like = '%'.addcslashes($kata, '%_\\').'%';

            $query->where(function ($w) use ($like): void {
                $w->whereRaw('LOWER(name) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(nim) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(email) LIKE ?', [$like]);
            });
        }

        $halaman = $query
            ->orderBy('name')
            ->orderBy('id')
            ->paginate($perHalaman);

        return response()->json([
            'data' => $halaman->getCollection()->map(fn (User $u): array => [
                'id' => $u->id,
                'name' => $u->name,
                'nim' => $u->nim,
                'email' => $u->email,
                'active' => (bool) $u->active,
                'must_change_password' => $u->password_changed_at === null,
            ])->values(),
            'meta' => [
                'current_page' => $halaman->currentPage(),
                'last_page' => $halaman->lastPage(),
                'per_page' => $halaman->perPage(),
                'total' => $halaman->total(),
            ],
        ]);
    }

    /**
     * Reset password satu akun mahasiswa. Password sementara hanya ada di
     * respons ini, jadi jangan sampai tersimpan di cache.
     */
    public function reset(
        Request $request,
        User $user,
        ResetUserPassword $action,
    ): JsonResponse {
        // Selain mahasiswa dianggap tidak ada (404), konsisten dengan
        // UserController di Akun Admin.
        abort_if(
            in_array($user->role, [UserRole::Admin->value, UserRole::SuperAdmin->value], true),
            404,
        );

        $password = $action($user, $request->user(), $request->ip());

        return response()
            ->json([
                'data' => [
                    'id' => (int) $user->id,
                    'name' => $user->name,
                    'nim' => $user->nim !== null ? (string) $user->nim : null,
                    'password' => $password,
                ],
            ])
            ->header('Cache-Control', 'no-store, private');
    }
}
