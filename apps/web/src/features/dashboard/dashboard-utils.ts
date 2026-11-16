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
  hari: string // "Sab", "Min", dst.
  awal: number // timestamp 00:00 hari itu, dipakai buat filter
  ariaLabel: string
  jumlah: number
  sorot: boolean
}

export type BarBulanan = {
  bulan: number // 1–12
  label: string // "Mei", "Jun", ...
  ariaLabel: string // "Mei 2026"
  jumlah: number
  sorot: boolean // bulan ini
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

// Tujuh hari terakhir, termasuk hari ini. Dipakai buat grafik harian.
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
      hari: new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(date),
      awal: date.getTime(),
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

// Tujuh bulan terakhir, termasuk bulan ini. Dipakai buat grafik bulanan.
export function laporanPerBulan(
  laporan: Laporan[],
  now = new Date(),
): BarBulanan[] {
  const bulan = Array.from({ length: 7 }, (_, index) => {
    return new Date(now.getFullYear(), now.getMonth() - (6 - index), 1)
  })

  return bulan.map((awal) => {
    const berikut = new Date(awal.getFullYear(), awal.getMonth() + 1, 1)

    const jumlah = laporan.filter((item) => {
      if (!item.created_at) return false
      const createdAt = new Date(item.created_at)
      return createdAt >= awal && createdAt < berikut
    }).length

    return {
      bulan: awal.getMonth() + 1,
      label: new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(awal),
      ariaLabel: new Intl.DateTimeFormat('id-ID', {
        month: 'long',
        year: 'numeric',
      }).format(awal),
      jumlah,
      sorot:
        awal.getFullYear() === now.getFullYear() &&
        awal.getMonth() === now.getMonth(),
    }
  })
}

export function periodeBulanan(bulan: BarBulanan[], now = new Date()): string {
  const pertama = bulan[0]
  const terakhir = bulan[bulan.length - 1]
  if (!pertama || !terakhir) return ''
  const awal = new Date(
    now.getFullYear(),
    now.getMonth() - (bulan.length - 1),
    1,
  )
  // Lintas tahun: "Des 2025–Jun 2026". Satu tahun: "Mei–Nov 2026".
  if (awal.getFullYear() === now.getFullYear()) {
    return `${pertama.label}–${terakhir.label} ${now.getFullYear()}`
  }
  return `${pertama.label} ${awal.getFullYear()}–${terakhir.label} ${now.getFullYear()}`
}

export function identitas(user: User): string {
  if (user.role === 'user') {
    return ['user', user.nim ? `NIM ${user.nim}` : null]
      .filter(Boolean)
      .join(' · ')
  }
  return [user.role, user.email].filter(Boolean).join(' · ')
}
