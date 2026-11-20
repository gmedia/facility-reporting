import { cn } from '@/lib/utils'
import type { PosisiPelapor } from './lokasi-pelapor'

const EMERALD = 'bg-emerald-100 text-emerald-800'
const AMBER = 'bg-amber-100 text-amber-800'
const RED = 'bg-red-100 text-red-800'

function chipDari(posisi: PosisiPelapor): { teks: string; kelas: string } {
  switch (posisi.status) {
    case 'dalam':
      return { teks: `Dalam radius ${posisi.radius} m`, kelas: EMERALD }
    case 'luar':
      return { teks: 'Di luar radius', kelas: RED }
    case 'ditolak':
      return { teks: 'Ditolak', kelas: RED }
    case 'tidak_didukung':
      return { teks: 'Tidak didukung', kelas: RED }
    case 'gagal':
      return { teks: 'Gagal', kelas: RED }
    case 'galat_batas':
      return { teks: 'Batas gagal dimuat', kelas: RED }
    case 'memuat_batas':
      return { teks: 'Memeriksa…', kelas: AMBER }
    default:
      return { teks: 'Menunggu izin', kelas: AMBER }
  }
}

type Banner = {
  nada: 'kuning' | 'merah'
  teks: string
  aksi?: { label: string; klik: () => void }
}

function bannerDari(posisi: PosisiPelapor): Banner | null {
  switch (posisi.status) {
    case 'meminta':
      return {
        nada: 'kuning',
        teks: 'Menunggu izin lokasi dari browser. Pilih Izinkan agar laporan bisa dikirim.',
      }
    case 'ditolak':
      return {
        nada: 'merah',
        teks: 'Izin lokasi ditolak. Laporan tidak bisa dikirim tanpa lokasi. Aktifkan izin lewat ikon gembok di address bar, lalu coba lagi.',
        aksi: { label: 'Coba lagi', klik: posisi.ulangi },
      }
    case 'tidak_didukung':
      return {
        nada: 'merah',
        teks: 'Browser ini tidak mendukung lokasi, jadi laporan tidak bisa dikirim.',
      }
    case 'gagal':
      return {
        nada: 'merah',
        teks: 'Lokasi belum bisa ditentukan. Pastikan GPS atau layanan lokasi aktif.',
        aksi: { label: 'Coba lagi', klik: posisi.ulangi },
      }
    case 'galat_batas':
      return {
        nada: 'merah',
        teks: 'Batas lokasi gagal dimuat, jadi laporan belum bisa dikirim.',
        aksi: { label: 'Muat ulang', klik: posisi.muatUlangBatas },
      }
    case 'luar':
      return {
        nada: 'merah',
        teks: `Di luar radius ${posisi.radius} m dari kampus (${Math.round(posisi.jarak ?? 0)} m). Laporan tidak bisa dikirim.`,
      }
    default:
      return null
  }
}

function garisKoordinat(posisi: PosisiPelapor): string | null {
  const { gps, jarak, radius } = posisi
  if (!gps) return null

  let teks = `Lat ${gps.lat.toFixed(7)} · Lng ${gps.lng.toFixed(7)}`
  if (jarak !== null && radius !== null) {
    teks += ` · ${Math.round(jarak)} m dari kampus (maks. ${radius} m)`
  }
  return `${teks} · akurasi ±${Math.round(gps.akurasi)} m`
}

// Kotak status lokasi di paling atas formulir /lapor. Hanya menampilkan
// banner kalau ada masalah, supaya kotaknya tetap ringkas saat semuanya aman.
export function LokasiKotak({ posisi }: { posisi: PosisiPelapor }) {
  const chip = chipDari(posisi)
  const banner = bannerDari(posisi)
  const koordinat = garisKoordinat(posisi)

  return (
    <section
      aria-labelledby="lokasi-pelapor-judul"
      className="rounded-2xl border border-[#d7e2dc] p-3.5"
    >
      <div className="flex items-center justify-between gap-2">
        <h3
          id="lokasi-pelapor-judul"
          className="text-sm font-semibold text-[#173d30]"
        >
          Lokasi pelapor
          <span aria-hidden="true" className="ml-0.5 text-red-600">
            *
          </span>
        </h3>

        <span
          role="status"
          className={cn(
            'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
            chip.kelas,
          )}
        >
          {chip.teks}
        </span>
      </div>

      {banner && (
        <div
          role={banner.nada === 'merah' ? 'alert' : 'status'}
          className={cn(
            'mt-2.5 rounded-xl px-3 py-2 text-xs leading-relaxed',
            banner.nada === 'merah'
              ? 'bg-red-50 text-red-800'
              : 'bg-amber-50 text-amber-800',
          )}
        >
          {banner.teks}
          {banner.aksi && (
            <>
              {' '}
              <button
                type="button"
                onClick={banner.aksi.klik}
                className="font-semibold underline underline-offset-2"
              >
                {banner.aksi.label}
              </button>
            </>
          )}
        </div>
      )}

      {koordinat && (
        <p className="mt-2.5 rounded-lg bg-[#e8f3ee] px-2.5 py-1.5 font-mono text-[11px] text-[#173d30]">
          {koordinat}
        </p>
      )}
    </section>
  )
}
