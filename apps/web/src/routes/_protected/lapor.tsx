import { createFileRoute, redirect } from '@tanstack/react-router'
import { Card } from '@/components/ui/card'
import { LaporanForm } from '@/features/laporan/laporan-form'
import { LaporanGuide } from '@/features/laporan/laporan-guide'

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
// Satu card, dua section. Kiri putih = formulir, kanan hijau tua #0d3f31 =
// panduan pengisian, dipisah garis tipis. Di bawah `lg` keduanya menumpuk
// ke bawah dengan formulir tetap di atas.
//
// Rasio `1.55fr 1fr` sengaja condong ke kiri: section formulir harus
// terasa lebih luas dari panduannya, karena di situlah user menghabiskan
// waktu. Panel panduan TIDAK sticky — isinya lebih tinggi dari viewport,
// jadi kalau dipaku, bagian bawahnya nggak bisa dibaca.
function LaporPage() {
  return (
    <Card className="gap-0 overflow-hidden rounded-[28px] p-0">
      <div className="grid lg:grid-cols-[1.55fr_1fr]">
        {/* Sisi kiri — formulir, latar putih */}
        <div className="p-6 sm:p-8 lg:p-10">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[#0d3f31]/70 uppercase">
            Formulir Laporan
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-[26px]">
            Laporkan Kerusakan Fasilitas
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-neutral-500">
            Laporanmu akan diteruskan ke pengelola kampus dan dicek oleh admin.
          </p>

          <div className="mt-7">
            <LaporanForm />
          </div>
        </div>

        {/* Sisi kanan — panduan, hijau tua. Pemisah muncul di kedua arah:
            garis vertikal di desktop, garis horizontal saat menumpuk. */}
        <div className="border-t border-white/10 bg-[#0d3f31] p-6 sm:p-8 lg:border-t-0 lg:border-l lg:p-10">
          <LaporanGuide />
        </div>
      </div>
    </Card>
  )
}
