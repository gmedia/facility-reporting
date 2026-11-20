<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
final class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array{id: int, name: string, nim: string|null, email: string|null, role: string, foto: string|null, active: bool, must_change_password: bool}
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'name' => $this->resource->name,
            'nim' => $this->resource->nim,
            'email' => $this->resource->email,
            'role' => $this->resource->role,
            'foto' => $this->resource->foto,
            'active' => (bool) $this->resource->active,
            // true = belum pernah mengganti password sejak akun dibuat,
            // artinya masih memakai password awal.
            'must_change_password' => $this->resource->password_changed_at === null,
        ];
    }
}
