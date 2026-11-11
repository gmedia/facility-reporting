import type { Laporan } from './laporan-query'

export type Statistik = {
  total: number
  menunggu: number
  diproses: number
  selesai: number
  ditolak: number
}

export function hitungStatistik(laporan: Laporan[]): Statistik {
  return {
    total: laporan.length,
    menunggu: laporan.filter((l) => l.status === 'menunggu_verifikasi').length,
    // `valid` ikut dihitung sebagai Diproses: sudah lolos verifikasi tapi
    // belum tuntas, jadi dari sudut pandang pemilik laporan masih berjalan.
    // Tanpa ini, jumlah empat kartu tidak akan pernah sama dengan `total`
    // — dan memang harus selalu sama, karena `total` memakai `length`.
    diproses: laporan.filter(
      (l) => l.status === 'diproses' || l.status === 'valid',
    ).length,
    selesai: laporan.filter((l) => l.status === 'selesai').length,
    ditolak: laporan.filter((l) => l.status === 'ditolak').length,
  }
}
