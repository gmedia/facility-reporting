// Data dashboard super admin.
//
// NOTE: Endpoint API untuk statistik/daftar laporan BELUM ADA di backend
// (baru POST /reports). Jadi halaman /admin masih pakai data demo dari sini.
// Kalau backend sudah siap, ganti isi file ini dengan query ke API —
// bentuk datanya sengaja dibikin mirip resource biar tinggal tempel.

export type LaporanStatus = 'menunggu' | 'terverifikasi'

export type AntrianFilter = 'semua' | LaporanStatus

// Baca ?filter= dari URL. Nilai aneh/kosong → 'semua'.
export function readFilter(search: unknown): AntrianFilter {
  const raw = (search as { filter?: unknown } | null | undefined)?.filter
  return raw === 'menunggu' || raw === 'terverifikasi' ? raw : 'semua'
}

export interface AntrianRow {
  id: number
  laporan: string
  status: LaporanStatus
}

export interface HarianRow {
  tanggal: string
  jumlah: number
  sorot?: boolean
}

export const statCards = [
  { label: 'Menunggu', value: 12, icon: 'clock' },
  { label: 'Terverifikasi', value: 31, icon: 'check' },
  { label: 'Prioritas tinggi', value: 5, icon: 'alert' },
  { label: 'Selesai', value: 17, icon: 'wrench' },
] as const

export const antrianVerifikasi: AntrianRow[] = [
  { id: 10335, laporan: 'Lampu koridor mati', status: 'menunggu' },
  { id: 10467, laporan: 'AC ruang kelas bocor', status: 'menunggu' },
  { id: 10256, laporan: 'Keran toilet rusak', status: 'terverifikasi' },
  { id: 10462, laporan: 'Proyektor tidak menyala', status: 'menunggu' },
  { id: 10213, laporan: 'Atap lab bocor', status: 'terverifikasi' },
]

export const prioritas = {
  bulan: 'Okt 2026',
  terverifikasiPersen: 75,
  bahayaTinggiPersen: 38,
  tindakLanjutPersen: 15,
}

export const laporanPerHari: HarianRow[] = [
  { tanggal: '03', jumlah: 8 },
  { tanggal: '04', jumlah: 12 },
  { tanggal: '05', jumlah: 14, sorot: true },
  { tanggal: '06', jumlah: 10 },
  { tanggal: '07', jumlah: 16 },
  { tanggal: '08', jumlah: 9 },
  { tanggal: '09', jumlah: 11 },
  { tanggal: '10', jumlah: 15 },
]

export const periodeHarian = '3 Okt – 10 Okt'
