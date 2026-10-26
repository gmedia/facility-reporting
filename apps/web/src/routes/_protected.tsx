import {
  Outlet,
  createFileRoute,
  redirect,
  useRouterState,
} from '@tanstack/react-router'
import { Toaster } from '@/components/ui/sonner'
import { AppNav } from '@/components/app-nav'
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
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  // Dashboard pengelola memakai DashboardShell (sidebar hijau). Sembunyikan
  // AppNav biar tidak ada dua navigasi. Dashboard user tetap pakai AppNav.
  const pakaiDashboardShell = pathname === '/dashboard' && user.role !== 'user'

  return (
    <div className="bg-muted/40 min-h-screen">
      {!pakaiDashboardShell && <AppNav user={user} />}
      <Outlet />
      {/* Toaster global. Anas juga punya satu di _protected/admin/route.tsx -
          kabarin dia supaya dilepas, biar nggak dobel. */}
      <Toaster position="top-right" />
    </div>
  )
}

export const Route = createFileRoute('/_protected')({
  beforeLoad: async () => ({ user: await requireUser() }),
  component: ProtectedLayout,
})
