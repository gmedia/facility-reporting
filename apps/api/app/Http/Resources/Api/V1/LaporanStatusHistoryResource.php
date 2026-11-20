<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Models\LaporanStatusHistory;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin LaporanStatusHistory */
final class LaporanStatusHistoryResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array{id: int, laporan_id: int, status_from: string|null, status_to: string, alasan: string|null, changed_by: int, changed_by_name: string|null, created_at: string|null, updated_at: string|null}
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'laporan_id' => $this->resource->laporan_id,
            'status_from' => $this->resource->status_from,
            'status_to' => $this->resource->status_to,
            'alasan' => $this->resource->alasan,
            'changed_by' => $this->resource->changed_by,
            'changed_by_name' => $this->resource->changedBy->name ?? null,
            'created_at' => $this->resource->created_at,
            'updated_at' => $this->resource->updated_at,
        ];
    }
}
