<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\LaporanStatus;
use Database\Factories\LaporanFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'kategori', 'lokasi', 'deskripsi', 'foto', 'nilai_kerusakan', 'nilai_risiko', 'nilai_dampak', 'nilai_frekuensi', 'skor_prioritas', 'foto_bukti'])]
class Laporan extends Model
{
    /** @use HasFactory<LaporanFactory> */
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function (Laporan $laporan): void {
            $laporan->status ??= LaporanStatus::MenungguVerifikasi;
        });
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => LaporanStatus::class,
            'nilai_kerusakan' => 'integer',
            'nilai_risiko' => 'integer',
            'nilai_dampak' => 'integer',
            'nilai_frekuensi' => 'integer',
            'skor_prioritas' => 'string',
            'foto_bukti' => 'string',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
