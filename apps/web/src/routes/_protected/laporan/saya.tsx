import { HistoryIcon } from 'lucide-react'
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

function RiwayatSayaPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      {/* Judul + chip memakai bahasa visual yang sama dengan /lapor
          (chip emerald + h1 font-heading), jadi dua halaman mahasiswa
          terasa satu keluarga. */}
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        <HistoryIcon aria-hidden="true" className="size-3.5" />
        Riwayat laporan
      </span>

      <h1 className="font-heading mt-3 text-xl font-semibold tracking-tight">
        Laporan yang Pernah Saya Kirim
      </h1>
      <p className="text-muted-foreground mt-1.5 max-w-2xl text-sm">
        Pantau perkembangan laporanmu, mulai dari menunggu verifikasi sampai
        selesai ditangani.
      </p>

      <div className="mt-6">
        <RiwayatList />
      </div>
    </main>
  )
}
