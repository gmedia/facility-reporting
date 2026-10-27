import { createFileRoute, redirect } from '@tanstack/react-router'
import { RiwayatList } from '@/features/laporan/riwayat-list'

export const Route = createFileRoute('/_protected/laporan/saya')({
  // /laporan/saya khusus mahasiswa, sama seperti /lapor. Role lain ->
  // /dashboard, karena dia emang udah berhasil login.
  beforeLoad: ({ context }) => {
    if (context.user.role !== 'user') throw redirect({ to: '/dashboard' })
  },
  component: RiwayatSayaPage,
})

// Catatan struktur: tidak ada <main> dan tidak ada mx-auto — UserShell
// sudah menyediakan wadahnya, sama seperti halaman /dashboard dan /lapor,
// jadi tiga halaman mahasiswa punya lebar & padding yang persis sama.
//
// Eyebrow-nya sengaja bukan teks "Riwayat Laporan" murni: di sisi kiri
// sudah ada link sidebar dengan label itu, dan nambah judul yang isinya
// sama persis cuma bikin pengulangan.
function RiwayatSayaPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.12em] text-[#0d3f31]/70 uppercase">
          Arsip Laporan
        </p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-[26px]">
          Laporan yang Pernah Saya Kirim
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-neutral-500">
          Pantau perkembangan laporanmu, mulai dari menunggu verifikasi sampai
          selesai ditangani.
        </p>
      </div>

      <RiwayatList />
    </div>
  )
}
