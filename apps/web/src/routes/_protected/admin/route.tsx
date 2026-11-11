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
        <div className="min-w-0 py-2">
          <h1 className="truncate text-lg leading-tight font-bold tracking-tight">
            Akun Admin
          </h1>
          <p className="truncate text-xs text-neutral-500">
            Kelola akun dengan role admin
          </p>
        </div>
      }
    >
      <Outlet />
    </DashboardShell>
  )
}