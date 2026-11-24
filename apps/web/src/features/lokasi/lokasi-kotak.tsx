import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PosisiPelapor } from './lokasi-pelapor'

type Nada = 'hijau' | 'kuning' | 'merah'

const CHIP_KELAS: Record<Nada, string> = {
  hijau: 'bg-emerald-100 text-emerald-800',
  kuning: 'bg-amber-100 text-amber-800',
  merah: 'bg-red-100 text-red-800',
}

const TITIK_KELAS: Record<Nada, string> = {
  hijau: 'bg-emerald-500',
  kuning: 'bg-amber-500',
  merah: 'bg-red-500',
}

function chipDari(posisi: PosisiPelapor): { teks: string; nada: Nada } {
  switch (posisi.status) {
    case 'dalam':
      return { teks: `Dalam radius ${posisi.radius} m`, nada: 'hijau' }
    case 'luar':
      return { teks: 'Di luar radius', nada: 'merah' }
    case 'ditolak':
      return { teks: 'Ditolak', nada: 'merah' }
    case 'tidak_didukung':
      return { teks: 'Tidak didukung', nada: 'merah' }
    case 'gagal':
      return { teks: 'Gagal', nada: 'merah' }
    case 'galat_batas':
      return { teks: 'Batas gagal dimuat', nada: 'merah' }
    case 'memuat_batas':
      return { teks: 'Memeriksa…', nada: 'kuning' }
    default:
      return { teks: 'Menunggu izin', nada: 'kuning' }
  }
}

function subteksDari(posisi: PosisiPelapor): string {
  switch (posisi.status) {
    case 'dalam':
      return 'Terdeteksi di area kampus'
    case 'luar':
      return `Di luar radius ${posisi.radius} m dari kampus (${Math.round(posisi.jarak ?? 0)} m).`
    case 'memuat_batas':
      return 'Memeriksa posisimu…'
    case 'meminta':
      return 'Menunggu izin lokasi'
    default:
      return 'Lokasi belum bisa dipastikan'
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
    default:
      // Status 'luar' tidak pakai banner; keterangannya ada di subteks.
      return null
  }
}

// Kotak status lokasi di paling atas formulir /lapor. Detail koordinat
// sengaja tidak ditampilkan; banner hanya muncul kalau ada masalah.
export function LokasiKotak({ posisi }: { posisi: PosisiPelapor }) {
  const chip = chipDari(posisi)
  const banner = bannerDari(posisi)

  return (
    <section
      aria-labelledby="lokasi-pelapor-judul"
      className="rounded-2xl border border-[#d7e2dc] p-3.5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e8f3ee] text-[#0d3f31]"
          >
            <MapPin className="size-[18px]" />
          </span>

          <div className="min-w-0">
            <h3
              id="lokasi-pelapor-judul"
              className="text-sm font-semibold text-[#173d30]"
            >
              Lokasi Anda
              <span aria-hidden="true" className="ml-0.5 text-red-600">
                *
              </span>
            </h3>
            <p className="text-muted-foreground text-xs">
              {subteksDari(posisi)}
            </p>
          </div>
        </div>

        <span
          role="status"
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
            CHIP_KELAS[chip.nada],
          )}
        >
          <span
            aria-hidden="true"
            className={cn('size-1.5 rounded-full', TITIK_KELAS[chip.nada])}
          />
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
    </section>
  )
}
