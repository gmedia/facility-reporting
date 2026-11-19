<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Enums\PrioritasKategori;
use App\Enums\UserRole;
use App\Models\Laporan;
use App\Models\LaporanStatusHistory;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Laporan */
final class LaporanResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * `pelapor`, `diverifikasi_oleh/pada/foto` dan `diselesaikan_oleh/pada/foto`
     * hanya disertakan untuk admin / super admin.
     *
     * @return array{id: int, user_id: int, kategori: string, lokasi: string, deskripsi: string, foto: string|null, status: string, skor_prioritas: float|null, prioritas_kategori: string|null, nilai_kerusakan: int|null, nilai_risiko: int|null, nilai_dampak: int|null, nilai_frekuensi: int|null, foto_bukti: string|null, created_at: string|null, updated_at: string|null, pelapor?: array{id: int, name: string, email: string, nim: string|null, foto: string|null}|null, diverifikasi_oleh?: string|null, diverifikasi_oleh_foto?: string|null, diverifikasi_pada?: string|null, diselesaikan_oleh?: string|null, diselesaikan_oleh_foto?: string|null, diselesaikan_pada?: string|null}
     */
    public function toArray(Request $request): array
    {
        $skor = $this->resource->skor_prioritas;

        $viewer = $request->user();
        $isAdmin = $viewer !== null && $viewer->role !== UserRole::User->value;

        return [
            'id' => $this->resource->id,
            'user_id' => $this->resource->user_id,
            'kategori' => $this->resource->kategori,
            'lokasi' => $this->resource->lokasi,
            'latitude' => $this->resource->latitude,
            'longitude' => $this->resource->longitude,
            'deskripsi' => $this->resource->deskripsi,
            'foto' => $this->resource->foto,
            'status' => $this->resource->status->value,
            'skor_prioritas' => $skor,
            'prioritas_kategori' => $skor !== null ? $this->kategoriDariSkor((float) $skor) : null,
            'nilai_kerusakan' => $this->resource->nilai_kerusakan,
            'nilai_risiko' => $this->resource->nilai_risiko,
            'nilai_dampak' => $this->resource->nilai_dampak,
            'nilai_frekuensi' => $this->resource->nilai_frekuensi,
            'foto_bukti' => $this->resource->foto_bukti,
            'created_at' => $this->resource->created_at,
            'updated_at' => $this->resource->updated_at,

            // Data pelapor: hanya untuk admin. loadMissing() menjaga agar
            // respons updateStatus/updateBukti (yang tidak eager load user)
            // tetap menyertakan pelapor.
            'pelapor' => $this->when($isAdmin, function (): ?array {
                $user = $this->resource->loadMissing('user')->user;

                return $user === null ? null : [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'nim' => $user->nim,
                    'foto' => $user->foto,
                ];
            }),

            // Admin yang pertama kali memverifikasi (valid) atau menolak
            // laporan, beserta foto dan waktunya. Null kalau belum pernah.
            'diverifikasi_oleh' => $this->when(
                $isAdmin,
                fn (): ?string => $this->riwayatDari(['valid', 'ditolak'], false)?->changedBy?->name,
            ),
            'diverifikasi_oleh_foto' => $this->when(
                $isAdmin,
                fn (): ?string => $this->riwayatDari(['valid', 'ditolak'], false)?->changedBy?->foto,
            ),
            'diverifikasi_pada' => $this->when(
                $isAdmin,
                fn () => $this->riwayatDari(['valid', 'ditolak'], false)?->created_at,
            ),

            // Admin yang terakhir mengubah status ke selesai, beserta
            // foto dan waktunya. Null kalau laporan belum selesai.
            'diselesaikan_oleh' => $this->when(
                $isAdmin,
                fn (): ?string => $this->riwayatDari(['selesai'], true)?->changedBy?->name,
            ),
            'diselesaikan_oleh_foto' => $this->when(
                $isAdmin,
                fn (): ?string => $this->riwayatDari(['selesai'], true)?->changedBy?->foto,
            ),
            'diselesaikan_pada' => $this->when(
                $isAdmin,
                fn () => $this->riwayatDari(['selesai'], true)?->created_at,
            ),
        ];
    }

    /**
     * Cari satu catatan riwayat status.
     *
     * loadMissing() memakai relasi yang sudah di-eager load controller kalau
     * ada; kalau belum (mis. respons updateStatus), diambil sekali di sini.
     *
     * @param  list<string>  $statusTujuan  nilai status_to yang dicari
     * @param  bool  $terakhir  true = riwayat terbaru, false = yang pertama
     */
    private function riwayatDari(array $statusTujuan, bool $terakhir): ?LaporanStatusHistory
    {
        $riwayat = $this->resource
            ->loadMissing('statusHistories.changedBy')
            ->statusHistories
            ->filter(fn ($item): bool => in_array((string) $item->status_to, $statusTujuan, true))
            ->sortBy('id');

        return $terakhir ? $riwayat->last() : $riwayat->first();
    }

    private function kategoriDariSkor(float $skor): string
    {
        if ($skor >= 4.00) {
            return PrioritasKategori::Tinggi->value;
        }

        if ($skor >= 3.00) {
            return PrioritasKategori::Sedang->value;
        }

        return PrioritasKategori::Rendah->value;
    }
}
