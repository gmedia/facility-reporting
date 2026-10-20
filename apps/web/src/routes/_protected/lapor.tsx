import { createFileRoute, redirect } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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

function LaporPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      {/*
        Dua kolom di layar lebar: form di kiri (fungsi utamanya, utuh
        seluruhnya), panduan pengisian di kanan. Di bawah `lg` jadi satu
        kolom — form dulu, panduan di bawahnya.

        `items-start` supaya card panduan gak ikut meninggi mengikuti card
        form. Kolom panduan sengaja TIDAK sticky: isinya lebih tinggi dari
        viewport, jadi kalau dipaku malah bagian bawahnya gak bisa dibaca.
      */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>Laporkan Kerusakan Fasilitas</CardTitle>
            <CardDescription>
              Laporanmu akan diteruskan ke pengelola kampus dan dicek oleh
              admin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LaporanForm />
          </CardContent>
        </Card>

        <LaporanGuide />
      </div>
    </main>
  )
}
