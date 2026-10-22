import type { Laporan } from '@/features/laporan/laporan-query'

export type Statistik = {
  total: number
  menunggu: number
  diproses: number
  selesai: number
}

export function hitungStatistik(laporan: Laporan[]): Statistik {
  return {
    total: laporan.length,
    menunggu: laporan.filter((l) => l.status === 'menunggu_verifikasi').length,
    diproses: laporan.filter((l) => l.status === 'diproses').length,
    selesai: laporan.filter((l) => l.status === 'selesai').length,
  }
}

const tanggalFormat = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function formatTanggal(iso: string | null): string {
  if (!iso) return '-'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '-'
  return tanggalFormat.format(date)
}
