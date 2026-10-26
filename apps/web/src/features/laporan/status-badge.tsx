import { STATUS_LABEL, STATUS_TONE, type LaporanStatus } from './laporan-query'

// schema.d.ts ngetik `LaporanResource['status']` sebagai `string`, padahal
// backend cuma mau 5 nilai `LaporanStatus`. Helper ini memetakan label/tone
// dan tetap menampilkan nilai asli kalau statusnya di luar enum, biar gak
// lenyap diam-diam.
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

// Dipakai di halaman riwayat mahasiswa (/laporan/saya) dan ringkasan
// dashboard. /verifikasi punya pill status sendiri yang bisa diklik untuk
// mengubah status.
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
