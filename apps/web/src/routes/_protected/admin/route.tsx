import {
  Outlet,
  createFileRoute,
  redirect,
  useRouterState,
} from '@tanstack/react-router'
import { AdminShell } from '@/features/admin/admin-shell'
import { AntrianTabs } from '@/features/admin/antrian-tabs'

export const Route = createFileRoute('/_protected/admin')({
  beforeLoad: ({ context }) => {
    // Cuma super admin. Selain itu lempar ke /dashboard — bukan /login,
    // karena orangnya emang udah berhasil login.
    if (context.user.role !== 'super_admin') {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: AdminLayout,
})

function AdminLayout() {
  const { user } = Route.useRouteContext()
  // Tab Semua/Menunggu/Terverifikasi cuma relevan di dashboard (/admin),
  // jadi di halaman lain (akun, pengaturan, statistik) jangan ditampilin.
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  return (
    <AdminShell user={user} header={pathname === '/admin' && <AntrianTabs />}>
      <Outlet />
    </AdminShell>
  )
}
