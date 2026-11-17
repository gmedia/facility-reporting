import { createFileRoute, redirect } from '@tanstack/react-router'
import { SemuaLaporanPage } from '@/features/dashboard/semua-laporan-page'

// Khusus super admin. Admin biasa dan user dilempar ke /dashboard
// (mereka sudah login, jadi bukan ke /login).
export const Route = createFileRoute('/_protected/semua-laporan')({
  beforeLoad: ({ context }) => {
    if (context.user.role !== 'super_admin') {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: SemuaLaporanRoute,
})

function SemuaLaporanRoute() {
  const { user } = Route.useRouteContext()

  return <SemuaLaporanPage user={user} />
}
