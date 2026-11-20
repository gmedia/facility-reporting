import { createFileRoute, redirect } from '@tanstack/react-router'
import { LokasiPage } from '@/features/lokasi/lokasi-page'

export const Route = createFileRoute('/_protected/lokasi-akun')({
  beforeLoad: ({ context }) => {
    // Cuma super admin. Selain itu lempar ke /dashboard, bukan /login,
    // karena orangnya memang sudah berhasil login.
    if (context.user.role !== 'super_admin') {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: LokasiRoute,
})

function LokasiRoute() {
  const { user } = Route.useRouteContext()
  return <LokasiPage user={user} />
}
