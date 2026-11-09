import { Building2 } from 'lucide-react'
import { Link } from '@tanstack/react-router'

// ============================================================
// Footer halaman user — VERSI MINIMALIS (permintaan 3 Nov 2026).
//
// Cuma dua baris: identitas + navigasi, lalu kredit. Sebelumnya footer
// ini empat kolom (identitas, navigasi, alur status, panduan singkat)
// dan terasa sepanjang konten utama — panduan & alur status sudah ada
// di halaman masing-masing, jadi tidak perlu diulang di kaki halaman.
//
// Dua aturan yang gampang dilanggar dan sengaja dijaga di sini:
//
// 1. JANGAN ada link menuju halaman yang belum ada. /tentang, /kontak,
//    /bantuan dll. belum ada routenya, dan link mati lebih merusak
//    kepercayaan daripada tidak ada link sama sekali.
//
// 2. Navigasi memakai label yang sama dengan sidebar user (Beranda,
//    Lapor Kerusakan, Riwayat Laporan). Test navigasi selalu di-scope
//    ke sidebar, jadi duplikat teks di footer aman.
// ============================================================

const NAV: Array<{
  label: string
  to: '/dashboard' | '/lapor' | '/laporan/saya'
}> = [
  { label: 'Beranda', to: '/dashboard' },
  { label: 'Lapor Kerusakan', to: '/lapor' },
  { label: 'Riwayat Laporan', to: '/laporan/saya' },
]

export function SiteFooter() {
  const tahun = new Date().getFullYear()

  // Hijau footer sengaja LEBIH TUA dari sidebar (#0d3f31 → #082a20).
  // Pakai warna yang sama bikin sidebar dan footer nyatu jadi satu bidang
  // hijau di layar tinggi — pemisahnya hilang dan kelihatan janggal.
  return (
    <footer className="mt-auto bg-[#082a20] text-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 lg:px-10">
        {/* Baris 1: identitas kiri, navigasi kanan. Di ponsel menumpuk. */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 ring-1 ring-white/15">
              <Building2 aria-hidden="true" className="size-4" />
            </span>
            <span className="text-sm leading-tight font-semibold tracking-tight">
              Facility Reporting
            </span>
          </div>

          <nav
            aria-label="Tautan footer"
            className="flex flex-wrap gap-x-5 gap-y-2"
          >
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-sm text-white/65 transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Baris 2: kredit — satu baris, bukan blok terpisah. */}
        <div className="mt-4 flex flex-col gap-1 border-t border-white/10 pt-4 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p>© {tahun} Facility Reporting</p>
          <p>
            Isi laporan hanya terlihat oleh pemiliknya dan pengelola kampus.
          </p>
        </div>
      </div>
    </footer>
  )
}
