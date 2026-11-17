import type { User } from '@/features/auth/auth-query'
import { KATEGORI_VALUES } from '@/features/laporan/laporan-query'
import type {
  Laporan,
  LaporanKategori,
  LaporanStatus,
} from '@/features/laporan/laporan-query'

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

// ------------------------------------------------------------------
// Khusus dashboard super admin
// ------------------------------------------------------------------
const MS_HARI = 24 * 60 * 60 * 1000

// Selisih hari penuh dari `dari` sampai `ke`. Kosong / tidak valid = 0.
export function selisihHari(dari?: string | null, ke = new Date()): number {
  if (!dari) return 0
  const t = new Date(dari).getTime()
  if (Number.isNaN(t)) return 0
  return Math.max(0, Math.floor((ke.getTime() - t) / MS_HARI))
}

// Gedung diambil dari `lokasi`: "Gedung S, ruang 204" -> "Gedung S".
// Ganti fungsi ini kalau backend nanti punya field gedung sendiri.
export function gedungDari(lokasi: string): string {
  const bagian = lokasi.split(/\s[-–]\s|,/)[0]?.trim()
  return bagian || 'Lainnya'
}

export type LaporanTertahan = { laporan: Laporan; hari: number }

// Belum selesai (valid / diproses) dan tidak berubah >= `ambang` hari.
// Paling lama di urutan pertama.
export function laporanTertahan(
  laporan: Laporan[],
  ambang: number,
  now = new Date(),
): LaporanTertahan[] {
  return laporan
    .filter((i) => i.status === 'valid' || i.status === 'diproses')
    .map((i) => ({
      laporan: i,
      hari: selisihHari(i.updated_at ?? i.created_at, now),
    }))
    .filter((i) => i.hari >= ambang)
    .sort((a, b) => b.hari - a.hari)
}

export function hitungKpi(laporan: Laporan[]) {
  const total = laporan.length
  const selesai = laporan.filter((i) => i.status === 'selesai')

  // Lama selesai = dari dibuat sampai terakhir diperbarui.
  const lama = selesai
    .map((i) => {
      const a = i.created_at ? new Date(i.created_at).getTime() : NaN
      const b = i.updated_at ? new Date(i.updated_at).getTime() : NaN
      return (b - a) / MS_HARI
    })
    .filter((n) => Number.isFinite(n) && n >= 0)

  return {
    total,
    diproses: laporan.filter((i) => i.status === 'diproses').length,
    jumlahSelesai: selesai.length,
    persenSelesai: total === 0 ? 0 : Math.round((selesai.length / total) * 100),
    rataHari:
      lama.length === 0 ? null : lama.reduce((a, n) => a + n, 0) / lama.length,
    tinggiAktif: laporan.filter(
      (i) =>
        i.prioritas_kategori === 'tinggi' &&
        ['menunggu_verifikasi', 'valid', 'diproses'].includes(i.status),
    ).length,
  }
}

export function hitungHeatmap(laporan: Laporan[]) {
  const gedung = [...new Set(laporan.map((i) => gedungDari(i.lokasi)))].sort()

  const sel = new Map<string, number>()
  for (const i of laporan) {
    const key = `${gedungDari(i.lokasi)}|${i.kategori}`
    sel.set(key, (sel.get(key) ?? 0) + 1)
  }

  const jumlah = (g: string, k: LaporanKategori) => sel.get(`${g}|${k}`) ?? 0
  const maks = Math.max(1, ...sel.values())

  return { gedung, kategori: KATEGORI_VALUES, jumlah, maks }
}
