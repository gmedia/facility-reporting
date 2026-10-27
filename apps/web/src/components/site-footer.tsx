import { Building2 } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import {
  STATUS_LABEL,
  type LaporanStatus,
} from '@/features/laporan/laporan-query'

// ============================================================
// Footer halaman user.
//
// Bukan lagi strip satu baris: empat kolom + baris kredit, supaya
// halaman terasa seperti website utuh — ada yang bisa dibaca ketika
// konten utama sudah habis, bukan cuma garis penutup.
//
// Dua aturan yang gampang dilanggar dan sengaja dijaga di sini:
//
// 1. JANGAN ada link menuju halaman yang belum ada. /tentang, /kontak,
//    /bantuan dll. belum ada routenya, dan link mati lebih merusak
//    kepercayaan daripada tidak ada link sama sekali. Kolom non-navigasi
//    diisi informasi faktual, bukan tautan.
//
// 2. JANGAN nulis status sebagai elemen terpisah. `Menunggu Verifikasi`
//    harus ikut dalam satu teks `A → B → C → D`, karena badge di atas
//    juga menampilkan teks itu persis. Kalau kepecah jadi banyak node,
//    getByText('Menunggu Verifikasi') bakal nemu dua elemen dan test
//    riwayat jatuh.
// ============================================================

const NAV: Array<{
  label: string
  to: '/dashboard' | '/lapor' | '/laporan/saya'
}> = [
  { label: 'Beranda', to: '/dashboard' },
  { label: 'Lapor Kerusakan', to: '/lapor' },
  { label: 'Riwayat Laporan', to: '/laporan/saya' },
]

const ALUR: LaporanStatus[] = [
  'menunggu_verifikasi',
  'valid',
  'diproses',
  'selesai',
]

const SEBELUM = [
  'Lampirkan foto — maksimal 2 MB.',
  'Tulis lokasi sampai nomor ruang.',
  'Satu masalah, satu laporan.',
]

export function SiteFooter() {
  const tahun = new Date().getFullYear()

  // Hijau footer sengaja LEBIH TUA dari sidebar (#0d3f31 → #082a20).
  // Pakai warna yang sama bikin sidebar dan footer nyatu jadi satu bidang
  // hijau di layar tinggi — pemisahnya hilang dan kelihatan janggal.
  return (
    <footer className="mt-auto bg-[#082a20] text-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-10 lg:py-7">
        {/* Dua kolom di ponsel supaya footer tidak menumpuk jadi empat
            blok setinggi layar; empat kolom penuh mulai lg. Kolom keempat
            membentang dua kolom di bawah lg karena isinya daftar butir —
            dipaksa ikut satu kolom sempit bikin teksnya pecah empat baris. */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-7 lg:grid-cols-[1.5fr_0.9fr_1.1fr_1.3fr] lg:gap-x-10 lg:gap-y-8">
          {/* identitas */}
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
                <Building2 aria-hidden="true" className="size-[18px]" />
              </span>
              <span className="text-[15px] leading-tight font-semibold tracking-tight">
                Facility Reporting
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/60">
              Portal pelaporan kerusakan fasilitas kampus — ajukan dalam satu
              menit, pantau sampai tuntas.
            </p>
          </div>

          {/* navigasi */}
          <div>
            <h3 className="text-[11px] font-semibold tracking-[0.14em] text-emerald-300/80 uppercase">
              Navigasi
            </h3>
            <ul className="mt-3 flex flex-col gap-2">
              {NAV.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-sm text-white/65 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* alur status — satu teks, lihat aturan di atas file ini */}
          <div>
            <h3 className="text-[11px] font-semibold tracking-[0.14em] text-emerald-300/80 uppercase">
              Alur Laporan
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              {ALUR.map((status) => STATUS_LABEL[status]).join(' → ')}
            </p>
          </div>

          {/* panduan singkat */}
          <div className="col-span-2 lg:col-span-1">
            <h3 className="text-[11px] font-semibold tracking-[0.14em] text-emerald-300/80 uppercase">
              Sebelum Mengirim
            </h3>
            <ul className="mt-3 flex flex-col gap-2">
              {SEBELUM.map((baris) => (
                <li
                  key={baris}
                  className="flex gap-2 text-sm leading-relaxed text-white/65"
                >
                  <span
                    aria-hidden="true"
                    className="mt-2 size-1 shrink-0 rounded-full bg-emerald-300/70"
                  />
                  <span>{baris}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-1.5 border-t border-white/10 pt-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {tahun} Facility Reporting</p>
          <p>
            Isi laporan hanya terlihat oleh pemiliknya dan pengelola kampus.
          </p>
        </div>
      </div>
    </footer>
  )
}
