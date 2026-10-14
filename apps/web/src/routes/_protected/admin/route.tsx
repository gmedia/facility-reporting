import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { Toaster } from '@/components/ui/sonner'

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
  return (
    <div className="bg-muted/40 min-h-screen">
      <header className="bg-background border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Facility Reporting</span>
            <span className="text-muted-foreground text-sm">/ Admin</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <a href="/" className="text-muted-foreground hover:text-foreground">
              Beranda
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>

      <Toaster position="top-right" />
    </div>
  )
}
