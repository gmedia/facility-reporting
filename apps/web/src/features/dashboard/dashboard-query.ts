import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { components } from '@/lib/api/schema'

export type Laporan = components['schemas']['LaporanResource']
export type LaporanStatus = components['schemas']['LaporanStatus']

// TODO(setelah PR #44 merge): hapus STATUS_LABEL lokal ini, lalu import
// dari '@/features/laporan/laporan-query'. Lihat §11 sketsa.
// Sengaja belum diubah sekarang biar gak konflik sama PR #44.
export const STATUS_LABEL: Record<LaporanStatus, string> = {
  menunggu_verifikasi: 'Menunggu Verifikasi',
  valid: 'Valid',
  ditolak: 'Ditolak',
  diproses: 'Diproses',
  selesai: 'Selesai',
}

// Backend udah nge-scope: user biasa cuma dapet laporannya sendiri,
// admin/super_admin dapet semua. Jadi gak perlu filter di frontend.
export const dashboardQueryOptions = queryOptions({
  queryKey: ['dashboard', 'laporan'],
  queryFn: async (): Promise<Laporan[]> => {
    const { data, error, response } = await api.GET('/reports')

    if (error || !data) {
      throw new Error(
        response.status === 401
          ? 'Sesi Anda sudah berakhir.'
          : 'Gagal memuat laporan.',
      )
    }

    return data.data
  },
})

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
