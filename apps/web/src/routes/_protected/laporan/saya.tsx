import { createFileRoute, redirect } from '@tanstack/react-router'
import { PageHeader } from '@/components/page-header'
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
//
// Judul memakai PageHeader supaya ikut sticky saat scroll (#113).
function RiwayatSayaPage() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Arsip Laporan"
        judul="Laporan yang Pernah Saya Kirim"
        keterangan="Pantau perkembangan laporanmu, mulai dari menunggu verifikasi sampai selesai ditangani."
      />

      <RiwayatList />
    </div>
  )
}
