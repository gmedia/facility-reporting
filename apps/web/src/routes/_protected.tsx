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

// Route yang bingkainya sendiri (AdminShell: sidebar hijau + header bar):
// /verifikasi sama /admin*. AppNav NGGAK dirender di sini biar nggak dobel —
// AppNav cuma buat /dashboard & /lapor. Guard tetap di masing-masing route.
function isAdminAppPath(pathname: string): boolean {
  return pathname === '/verifikasi' || pathname.startsWith('/admin')
}

function ProtectedLayout() {
  const { user } = Route.useRouteContext()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  return (
    <div className="bg-muted/40 min-h-screen">
      {!isAdminAppPath(pathname) && <AppNav user={user} />}
      <Outlet />
      {/* Toaster global. Halaman admin nggak punya Toaster sendiri lagi
          (AdminShell nggak ngerender), jadi cukup di sini. */}
      <Toaster position="top-right" />
    </div>
  )
}

export const Route = createFileRoute('/_protected')({
  beforeLoad: async () => ({ user: await requireUser() }),
  component: ProtectedLayout,
})
