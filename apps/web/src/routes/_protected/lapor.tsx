import { createFileRoute, redirect } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LaporanForm } from '@/features/laporan/laporan-form'

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
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Laporkan Kerusakan Fasilitas</CardTitle>
          <CardDescription>
            Laporanmu akan diteruskan ke pengelola kampus dan dicek oleh admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LaporanForm />
        </CardContent>
      </Card>
    </main>
  )
}
