// Statistik + hitungStatistik() pindah ke
// features/laporan/ringkasan-laporan.tsx — sekarang dipakai dua halaman
// (Beranda dan Riwayat), jadi rumusnya tidak boleh tinggal di fitur
// dashboard saja.

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
