import { STATUS_LABEL, STATUS_TONE, type LaporanStatus } from './laporan-query'

// schema.d.ts ngetik `LaporanResource['status']` sebagai `string`, padahal
// backend cuma mau 5 nilai `LaporanStatus`. Karena itu semua akses ke
// STATUS_LABEL/STATUS_TONE harus lewat helper ini — dan tetap ditampilkan
// apa adanya kalau nilainya di luar enum, biar gak lenyap diam-diam.
//
// Sengaja TIDAK diekspor: cukup dipakai di dalam file ini. Kalau diekspor,
// eslint react-refresh/only-export-components bakal nyomot file ini
// (campur komponen + fungsi) dan nge-warning.
function statusInfo(status: string): { label: string; tone: string } {
  const key = status as LaporanStatus
  return {
    label: STATUS_LABEL[key] ?? status,
    tone:
      STATUS_TONE[key] ?? 'bg-neutral-100 text-neutral-700 ring-neutral-200',
  }
}

// Dipakai halaman riwayat mahasiswa (/laporan/saya).
//
// CATATAN BUAT ANAS: laporan-list.tsx (milikmu) masih punya salinan helper
// + komponen Badge sendiri di dalam file-nya. File itu sengaja TIDAK aku
// sentuh di PR ini biar gak bentrok sama kerjaan "polish /verifikasi" kamu.
// Kalau mau nyatu, tinggal ganti pakai <StatusBadge> dari sini —
// palet warnanya sama persis (STATUS_TONE).
export function StatusBadge({ status }: { status: string }) {
  const { label, tone } = statusInfo(status)
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ${tone}`}
    >
      {label}
    </span>
  )
}
