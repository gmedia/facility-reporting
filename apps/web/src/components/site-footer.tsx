import { Building2 } from 'lucide-react'

// ============================================================
// Footer halaman user — SATU BARIS (permintaan 3 Nov 2026).
//
// Cuma identitas di kiri dan kredit di kanan. Navigasi sengaja TIDAK
// ada di footer: menu (Beranda, Lapor Kerusakan, Riwayat Laporan) sudah
// permanen di sidebar user, jadi mengulangnya di kaki halaman cuma
// menambah tinggi footer tanpa nilai tambah. Panduan & alur status juga
// tidak ikut — isinya sudah ada di halaman masing-masing.
//
// Aturan yang gampang dilanggar dan sengaja dijaga di sini:
// JANGAN ada link menuju halaman yang belum ada. /tentang, /kontak,
// /bantuan dll. belum ada routenya, dan link mati lebih merusak
// kepercayaan daripada tidak ada link sama sekali.
//
// Warna footer sengaja LEBIH TUA dari sidebar (#0d3f31 → #082a20).
// Pakai warna yang sama bikin sidebar dan footer nyatu jadi satu bidang
// hijau di layar tinggi — pemisahnya hilang dan kelihatan janggal.
// ============================================================

export function SiteFooter() {
  const tahun = new Date().getFullYear()

  // Satu flex row tanpa flex-col: di 390px pun identitas dan kredit tetap
  // muat sebaris, sesuai permintaan.
  return (
    <footer className="mt-auto bg-[#082a20] text-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 ring-1 ring-white/15">
              <Building2 aria-hidden="true" className="size-4" />
            </span>
            <span className="text-sm leading-tight font-semibold tracking-tight">
              Facility Reporting
            </span>
          </div>

          <p className="text-xs whitespace-nowrap text-white/45">
            © {tahun} Facility Reporting
          </p>
        </div>
      </div>
    </footer>
  )
}
