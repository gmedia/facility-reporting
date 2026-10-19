import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import type { components } from '@/lib/api/schema'

export type Laporan = components['schemas']['LaporanResource']
export type LaporanStatus = components['schemas']['LaporanStatus']

// GET /reports — role admin/super_admin melihat SEMUA laporan,
// role user hanya laporan miliknya sendiri (dibatasi backend).
export const laporanQueryOptions = queryOptions({
  queryKey: ['laporan'],
  queryFn: async () => {
    const { data, error, response } = await api.GET('/reports')
    if (error || !data)
      throw laporanApiError(response.status, error, 'Gagal memuat laporan.')
    return data.data
  },
  retry: false,
})

function laporanApiError(
  status: number,
  body: unknown,
  fallback: string,
): Error {
  const error = new Error(messageFor(status, fallback))
  Object.assign(error, { status }, body ?? {})
  return error
}

function messageFor(status: number, fallback: string): string {
  if (status === 401) return 'Sesi Anda sudah berakhir. Silakan login ulang.'
  if (status === 403)
    return 'Akses ditolak. Hanya admin yang boleh membuka halaman ini.'
  if (status === 404) return 'Data tidak ditemukan.'
  if (status === 429) return 'Terlalu banyak permintaan. Coba lagi nanti.'
  if (status >= 500) return 'Server sedang bermasalah. Coba lagi nanti.'
  return fallback
}

export function laporanErrorStatus(error: unknown): number {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status?: unknown }).status
    if (typeof status === 'number') return status
  }
  return 0
}

export function laporanErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.length > 0) return message
  }
  return 'Terjadi kesalahan. Silakan coba lagi.'
}

// ---------------------------------------------------------------------------
// Filter tab (Semua / Menunggu / Terverifikasi)
// ---------------------------------------------------------------------------

export type VerifikasiFilter = 'semua' | 'menunggu' | 'terverifikasi'

// Baca ?filter= dari URL. Nilai aneh/kosong → 'semua'.
export function readVerifikasiFilter(search: unknown): VerifikasiFilter {
  const raw = (search as { filter?: unknown } | null | undefined)?.filter
  return raw === 'menunggu' || raw === 'terverifikasi' ? raw : 'semua'
}

// "Menunggu" = menunggu_verifikasi. "Terverifikasi" = semua yang udah
// ditindak (valid/diproses/selesai/ditolak) — biar admin lihat sisa antrian.
export function filterLaporan(
  laporans: Laporan[],
  filter: VerifikasiFilter,
): Laporan[] {
  if (filter === 'menunggu')
    return laporans.filter((row) => row.status === 'menunggu_verifikasi')
  if (filter === 'terverifikasi')
    return laporans.filter((row) => row.status !== 'menunggu_verifikasi')
  return laporans
}

// ---------------------------------------------------------------------------
// Label, badge, urutan
// ---------------------------------------------------------------------------

// Label + warna badge per status. Dua warna utama ngikutin mock
// (menunggu = amber, terverifikasi = sky), sisanya diperluas wajar.
export const statusBadge: Record<
  LaporanStatus,
  { label: string; className: string }
> = {
  menunggu_verifikasi: {
    label: 'Menunggu',
    className: 'bg-[#fbe9cc] text-[#b9772a]',
  },
  valid: { label: 'Terverifikasi', className: 'bg-[#dff1f7] text-[#3a8fb0]' },
  ditolak: { label: 'Ditolak', className: 'bg-rose-100 text-rose-700' },
  diproses: { label: 'Diproses', className: 'bg-violet-100 text-violet-700' },
  selesai: { label: 'Selesai', className: 'bg-[#e0f1e8] text-[#2f8059]' },
}

// Status yang gak dikenal (mis. backend nambah enum baru) jangan bikin crash.
export function badgeFor(status: string): { label: string; className: string } {
  return (
    statusBadge[status as LaporanStatus] ?? {
      label: status,
      className: 'bg-neutral-100 text-neutral-600',
    }
  )
}

// Urutan tampil: yang MENUNGGU VERIFIKASI dulu (antrian), lalu terbaru.
export function sortAntrian(laporans: Laporan[]): Laporan[] {
  return [...laporans].sort((a, b) => {
    const menungguA = a.status === 'menunggu_verifikasi' ? 0 : 1
    const menungguB = b.status === 'menunggu_verifikasi' ? 0 : 1
    if (menungguA !== menungguB) return menungguA - menungguB
    return (b.created_at ?? '').localeCompare(a.created_at ?? '')
  })
}

const waktuFormat = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatWaktu(iso: string | null): string {
  if (!iso) return '-'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '-'
  return waktuFormat.format(date)
}

export const kategoriLabel: Record<string, string> = {
  elektronik: 'Elektronik',
  furnitur: 'Furnitur',
  mekanik: 'Mekanik',
  bangunan: 'Bangunan',
  lainnya: 'Lainnya',
}

// ---------------------------------------------------------------------------
// Statistik turunan (dihitung dari data GET /reports)
// ---------------------------------------------------------------------------

export interface VerifikasiStat {
  menunggu: number
  terverifikasi: number
  selesai: number
  /** Persentase yang udah ditindak — dipakai donut. */
  terverifikasiPersen: number
}

export function hitungStat(laporans: Laporan[]): VerifikasiStat {
  const menunggu = laporans.filter(
    (row) => row.status === 'menunggu_verifikasi',
  ).length
  const terverifikasi = laporans.filter((row) => row.status === 'valid').length
  const selesai = laporans.filter((row) => row.status === 'selesai').length
  const total = laporans.length
  const ditindak = total - menunggu

  return {
    menunggu,
    terverifikasi,
    selesai,
    terverifikasiPersen: total === 0 ? 0 : Math.round((ditindak / total) * 100),
  }
}

export interface HarianBar {
  /** Label pendek: tanggal aja ("3 Okt"). */
  tanggal: string
  jumlah: number
}

const harianFormat = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
})

// Kelompokkan laporan per hari berdasarkan created_at — dipakai bar chart
// "Laporan per hari". Diurut naik, diambil 8 hari terakhir yang ada data.
export function laporanPerHari(laporans: Laporan[]): HarianBar[] {
  const perHari = new Map<string, { urut: string; jumlah: number }>()

  for (const row of laporans) {
    if (!row.created_at) continue
    const date = new Date(row.created_at)
    if (Number.isNaN(date.getTime())) continue

    // Kunci pakai ISO date (bukan locale) biar urutannya stabil.
    const key = date.toISOString().slice(0, 10)
    const entry = perHari.get(key)
    if (entry) entry.jumlah += 1
    else perHari.set(key, { urut: key, jumlah: 1 })
  }

  return [...perHari.values()]
    .sort((a, b) => a.urut.localeCompare(b.urut))
    .slice(-8)
    .map((entry) => ({
      tanggal: harianFormat.format(new Date(`${entry.urut}T00:00:00`)),
      jumlah: entry.jumlah,
    }))
}
