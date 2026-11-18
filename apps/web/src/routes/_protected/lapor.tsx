import { createFileRoute, redirect } from '@tanstack/react-router'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import { LaporanForm } from '@/features/laporan/laporan-form'

export const Route = createFileRoute('/_protected/lapor')({
  // /lapor khusus mahasiswa. Role lain → /dashboard, bukan /login,
  // karena dia emang udah berhasil login.
  beforeLoad: ({ context }) => {
    if (context.user.role !== 'user') throw redirect({ to: '/dashboard' })
  },
  component: LaporPage,
})

// Catatan struktur: tidak ada <main> dan tidak ada mx-auto — UserShell
// sudah menyediakan wadahnya.
//
// Judul halaman dulu ada di dalam kartu formulir; sejak #113 ia keluar
// jadi PageHeader supaya ikut sticky saat scroll seperti halaman user
// lain — dan sticky memang tidak bisa bekerja di dalam kartu ini,
// karena kartunya `overflow-hidden` (overflow hidden mematikan posisi:
// sticky relatif ke ancestor-nya).
//
// Kartunya satu section: formulir putih. Panel panduan kanan dihapus
// supaya formulir menampak lebar dan rapi.
function LaporPage() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Formulir Laporan"
        judul="Laporkan Kerusakan Fasilitas"
        keterangan="Laporanmu akan diteruskan ke pengelola kampus dan dicek oleh admin."
      />

      <Card className="gap-0 overflow-hidden rounded-[28px] p-0">
        <div className="p-6 sm:p-8 lg:p-10">
          <LaporanForm />
        </div>
      </Card>
    </div>
  )
}
