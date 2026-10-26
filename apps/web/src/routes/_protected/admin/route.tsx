import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { DashboardShell } from '@/features/dashboard/dashboard-shell'

export const Route = createFileRoute('/_protected/admin')({
  beforeLoad: ({ context }) => {
    // Cuma super admin. Selain itu lempar ke /dashboard - bukan /login,
    // karena orangnya emang udah berhasil login.
    if (context.user.role !== 'super_admin') {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: AdminLayout,
})

function AdminLayout() {
  const { user } = Route.useRouteContext()

  return (
    <DashboardShell
      user={user}
      header={
        <p className="text-xs font-medium tracking-widest text-neutral-400 uppercase">
          Admin / Akun Admin
        </p>
      }
    >
      <Outlet />
    </DashboardShell>
  )
}
