<?php

declare(strict_types=1);

namespace App\Actions\Laporan;

use App\Data\UpdateLaporanStatusData;
use App\Enums\LaporanStatus;
use App\Models\Laporan;
use App\Models\LaporanStatusHistory;
use App\Services\PrioritasService;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;
use RuntimeException;

final class UpdateLaporanStatus
{
    /**
     * Peta transisi status yang sah. Status final tidak punya tujuan.
     *
     * @var array<string, list<LaporanStatus>>
     */
    private const TRANSISI = [
        'menunggu_verifikasi' => [LaporanStatus::Valid, LaporanStatus::Ditolak],
        'valid' => [LaporanStatus::Diproses],
        'diproses' => [LaporanStatus::Selesai],
        'ditolak' => [],
        'selesai' => [],
    ];

    public function __construct(
        private PrioritasService $prioritasService,
    ) {}

    /**
     * Update the status of a report.
     *
     * The status is assigned directly instead of through mass assignment
     * because it is intentionally absent from the model's fillable list.
     */
    public function __invoke(UpdateLaporanStatusData $data, Laporan $laporan): Laporan
    {
        $statusFrom = $laporan->status;
        $bolehBerpindah = self::TRANSISI[$statusFrom->value];

        if (! in_array($data->status, $bolehBerpindah, true)) {
            throw ValidationException::withMessages([
                'status' => "Status tidak dapat diubah dari {$statusFrom->value} ke {$data->status->value}.",
            ]);
        }

        // Simpan foto bukti yang di-upload (jika ada) sebelum dicek ke database
        if ($data->fotoBukti instanceof UploadedFile) {
            $path = $data->fotoBukti->store('bukti', 'public');

            if ($path === false) {
                throw new RuntimeException('Gagal menyimpan foto bukti.');
            }

            $laporan->foto_bukti = $path;
        }

        // Aturan: foto bukti wajib sebelum status diubah ke Selesai
        if ($data->status === LaporanStatus::Selesai && ! $laporan->foto_bukti) {
            throw ValidationException::withMessages([
                'foto_bukti' => 'Foto bukti wajib diupload sebelum status bisa diubah menjadi selesai.',
            ]);
        }

        $laporan->status = $data->status;

        if ($data->status === LaporanStatus::Valid &&
            $data->nilaiKerusakan !== null &&
            $data->nilaiRisiko !== null &&
            $data->nilaiDampak !== null &&
            $data->nilaiFrekuensi !== null
        ) {
            $laporan->setAttribute('nilai_kerusakan', $data->nilaiKerusakan);
            $laporan->setAttribute('nilai_risiko', $data->nilaiRisiko);
            $laporan->setAttribute('nilai_dampak', $data->nilaiDampak);
            $laporan->setAttribute('nilai_frekuensi', $data->nilaiFrekuensi);

            $prioritas = $this->prioritasService->hitung(
                $data->nilaiKerusakan,
                $data->nilaiRisiko,
                $data->nilaiDampak,
                $data->nilaiFrekuensi,
            );

            $laporan->skor_prioritas = (string) $prioritas->skor;
        }

        $laporan->save();

        $changedBy = auth()->user()?->id;

        LaporanStatusHistory::create([
            'laporan_id' => $laporan->id,
            'status_from' => $statusFrom->value,
            'status_to' => $data->status->value,
            'alasan' => $data->alasan,
            'changed_by' => $changedBy,
        ]);

        return $laporan;
    }
}
