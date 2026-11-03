import {
  PRIORITAS_LABEL,
  PRIORITAS_TONE,
  type PrioritasKategori,
} from './laporan-query'

// schema.d.ts ngetik `LaporanResource['prioritas_kategori']` sebagai
// `string | null`, padahal backend cuma mau 3 nilai PrioritasKategori.
// Helper ini memetakan label/tone dan tetap menampilkan nilai asli
// kalau di luar enum, biar gak lenyap diam-diam. `null` → tidak render
// apa pun (laporan belum pernah diproses, bukan "Rendah" tebakan).
//
// Sengaja TIDAK diekspor: cukup dipakai di dalam file ini. Kalau
// diekspor, eslint react-refresh/only-export-components bakal nyomot
// file ini (campur komponen + fungsi) dan nge-warning.
function prioritasInfo(
  kategori: string | null,
): { label: string; tone: string } | null {
  if (!kategori) return null
  const key = kategori as PrioritasKategori
  return {
    label: PRIORITAS_LABEL[key] ?? kategori,
    tone:
      PRIORITAS_TONE[key] ?? 'bg-neutral-100 text-neutral-700 ring-neutral-200',
  }
}

export function PrioritasBadge({ kategori }: { kategori: string | null }) {
  const info = prioritasInfo(kategori)
  if (!info) return null

  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ${info.tone}`}
    >
      {info.label}
    </span>
  )
}
