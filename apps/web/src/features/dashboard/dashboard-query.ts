// Statistik + hitungStatistik() pindah ke
// features/laporan/ringkasan-laporan.tsx — sekarang dipakai dua halaman
// (Beranda dan Riwayat), jadi rumusnya tidak boleh tinggal di fitur
// dashboard saja.

const tanggalFormat = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const jamFormat = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export function formatTanggal(iso: string | null): string {
  if (!iso) return '-'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '-'
  return tanggalFormat.format(date)
}

// "17 Nov 2026, 12:30". Dipakai untuk jejak verifikasi / penyelesaian.
export function formatWaktu(iso: string | null | undefined): string {
  if (!iso) return '-'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '-'
  return `${tanggalFormat.format(date)}, ${jamFormat.format(date).replace('.', ':')}`
}

// "baru saja", "5 menit lalu", "3 jam lalu", "2 hari lalu". Lewat 7 hari
// jatuh ke tanggal biasa.
export function waktuRelatif(
  iso: string | null | undefined,
  now = new Date(),
): string {
  if (!iso) return '-'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '-'

  const menit = Math.floor((now.getTime() - date.getTime()) / 60000)
  if (menit < 1) return 'baru saja'
  if (menit < 60) return `${menit} menit lalu`

  const jam = Math.floor(menit / 60)
  if (jam < 24) return `${jam} jam lalu`

  const hari = Math.floor(jam / 24)
  if (hari < 7) return `${hari} hari lalu`

  return tanggalFormat.format(date)
}