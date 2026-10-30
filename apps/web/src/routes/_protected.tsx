import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { Toaster } from '@/components/ui/sonner'
import { UserShell } from '@/components/user-shell'
import { queryClient } from '@/app/query-client'
import { meQueryOptions, type User } from '@/features/auth/auth-query'

async function requireUser(): Promise<User> {
  try {
    return await queryClient.fetchQuery(meQueryOptions)
  } catch {
    throw redirect({ to: '/login' }) // me gagal → /login
  }
}

function ProtectedLayout() {
  const { user } = Route.useRouteContext()

  // Halaman user memakai UserShell: sidebar hijau tua (#0d3f31, sama
  // dengan panel kiri login) + footer.
  if (user.role === 'user') {
    return (
      <>
        <UserShell user={user}>
          <Outlet />
        </UserShell>
        <Toaster position="top-right" />
      </>
    )
  }

  // Pengelola semuanya berada di rute yang sudah memakai DashboardShell
  // (/dashboard, /verifikasi, /admin/*) — route-nya sendiri yang menolak
  // role lain lewat beforeLoad. Karena AppNav (topbar) sudah dihapus,
  // tinggal Outlet polos di sini.
  return (
    <div className="bg-muted/40 min-h-screen">
      <Outlet />
      {/* Toaster global untuk semua halaman protected. */}
      <Toaster position="top-right" />
    </div>
  )
}

export const Route = createFileRoute('/_protected')({
  beforeLoad: async () => ({ user: await requireUser() }),
  component: ProtectedLayout,
})
