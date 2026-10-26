import type { User } from '@/features/auth/auth-query'
import type { Laporan, LaporanStatus } from '@/features/laporan/laporan-query'

export type AntrianFilter = 'semua' | 'menunggu' | 'terverifikasi'

export type RingkasanDashboard = {
  total: number
  menunggu: number
  terverifikasi: number
  diproses: number
  selesai: number
  ditolak: number
  persen: {
    menunggu: number
    terverifikasi: number
    diproses: number
    selesai: number
  }
  antrian: Laporan[]
}

export type BarHarian = {
  tanggal: number
  bulan: string
  ariaLabel: string
  jumlah: number
  sorot: boolean
}

export function readFilter(search: unknown): AntrianFilter {
  const raw = (search as { filter?: unknown } | null | undefined)?.filter
  return raw === 'menunggu' || raw === 'terverifikasi' ? raw : 'semua'
}

export function hitungRingkasan(laporan: Laporan[]): RingkasanDashboard {
  const total = laporan.length
  const jumlah = (status: LaporanStatus) =>
    laporan.filter((item) => item.status === status).length

  const menunggu = jumlah('menunggu_verifikasi')
  const terverifikasi = jumlah('valid')
  const diproses = jumlah('diproses')
  const selesai = jumlah('selesai')
  const ditolak = jumlah('ditolak')
  const persen = (value: number) =>
    total === 0 ? 0 : Math.round((value / total) * 100)

  return {
    total,
    menunggu,
    terverifikasi,
    diproses,
    selesai,
    ditolak,
    persen: {
      menunggu: persen(menunggu),
      terverifikasi: persen(terverifikasi),
      diproses: persen(diproses),
      selesai: persen(selesai),
    },
    antrian: [...laporan].sort((a, b) =>
      (b.created_at ?? '').localeCompare(a.created_at ?? ''),
    ),
  }
}

export function filterAntrian(
  laporan: Laporan[],
  filter: AntrianFilter,
): Laporan[] {
  if (filter === 'menunggu') {
    return laporan.filter((item) => item.status === 'menunggu_verifikasi')
  }
  if (filter === 'terverifikasi') {
    return laporan.filter((item) => item.status === 'valid')
  }
  return laporan
}

// Tujuh hari terakhir, termasuk hari ini. Dipakai buat grafik batang.
export function laporanPerHari(
  laporan: Laporan[],
  now = new Date(),
): BarHarian[] {
  const hari = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now)
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (6 - index))
    return date
  })

  return hari.map((date) => {
    const next = new Date(date)
    next.setDate(next.getDate() + 1)

    const jumlah = laporan.filter((item) => {
      if (!item.created_at) return false
      const createdAt = new Date(item.created_at)
      return createdAt >= date && createdAt < next
    }).length

    return {
      tanggal: date.getDate(),
      bulan: new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(date),
      ariaLabel: new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
      }).format(date),
      jumlah,
      sorot: date.toDateString() === now.toDateString(),
    }
  })
}

export function periodeHarian(hari: BarHarian[]): string {
  const pertama = hari[0]
  const terakhir = hari[hari.length - 1]
  if (!pertama || !terakhir) return ''
  if (pertama.bulan === terakhir.bulan) {
    return `${pertama.tanggal}–${terakhir.tanggal} ${terakhir.bulan}`
  }
  return `${pertama.tanggal} ${pertama.bulan} – ${terakhir.tanggal} ${terakhir.bulan}`
}

export function identitas(user: User): string {
  if (user.role === 'user') {
    return ['user', user.nim ? `NIM ${user.nim}` : null]
      .filter(Boolean)
      .join(' · ')
  }
  return [user.role, user.email].filter(Boolean).join(' · ')
}
