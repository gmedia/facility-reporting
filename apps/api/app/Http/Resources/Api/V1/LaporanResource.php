<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Models\Laporan;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Laporan */
final class LaporanResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array{id: int, user_id: int, kategori: string, lokasi: string, deskripsi: string, foto: string|null, status: string, created_at: string|null, updated_at: string|null}
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'user_id' => $this->resource->user_id,
            'kategori' => $this->resource->kategori,
            'lokasi' => $this->resource->lokasi,
            'deskripsi' => $this->resource->deskripsi,
            'foto' => $this->resource->foto,
            'status' => $this->resource->status->value,
            'created_at' => $this->resource->created_at,
            'updated_at' => $this->resource->updated_at,
        ];
    }
}
