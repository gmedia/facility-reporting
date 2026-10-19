import { Link, useRouter } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { MenuIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { logoutMutationOptions, type User } from '@/features/auth/auth-query'

// ============================================================
// MENU PER ROLE
//
// ATURAN KERAS: cuma route yang SUDAH ADA di route tree.
// TanStack Router ngetik `to` sebagai union of real paths —
// masukin path yang belum ada = tsc langsung merah.
//
// Rute yang MENYUSUL (tambahin satu baris pas sudah ada):
//   admin        → /prioritas
//   user         → /laporan/saya  (aman — bukan anak /verifikasi lagi,
//                                  lihat catatan di routes/_protected/verifikasi.tsx)
//   super_admin  → /admin/pengaturan, /admin/statistik
// ============================================================
type MenuItem = {
  to: '/dashboard' | '/lapor' | '/verifikasi' | '/admin'
  label: string
}

const MENU_PER_ROLE: Record<string, MenuItem[]> = {
  super_admin: [
    { to: '/verifikasi', label: 'Daftar Laporan' },
    { to: '/admin', label: 'Kelola Akun' },
  ],
  admin: [
    { to: '/dashboard', label: 'Beranda' },
    { to: '/verifikasi', label: 'Daftar Laporan' },
  ],
  user: [
    { to: '/dashboard', label: 'Beranda' },
    { to: '/lapor', label: 'Lapor Kerusakan' },
  ],
}

export function AppNav({ user }: { user: User }) {
  const router = useRouter()
  const logout = useMutation(logoutMutationOptions)

  // role nggak dikenal → menu kosong, jangan crash
  const menu = MENU_PER_ROLE[user.role] ?? []

  const onLogout = async () => {
    await logout.mutateAsync()
    await router.navigate({ to: '/login' })
  }

  return (
    <header className="bg-background sticky top-0 z-40 border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4">
        <div className="flex items-center gap-2">
          {/* mobile: buka menu lewat Sheet */}
          <Sheet>
            <SheetTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 w-9 lg:hidden"
                />
              }
            >
              <MenuIcon className="size-4" />
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1">
                {menu.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="hover:bg-accent rounded-md px-3 py-2 text-sm"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <Link to="/dashboard" className="font-semibold">
            Facility Reporting
          </Link>
        </div>

        {/* desktop */}
        <nav className="hidden items-center gap-1 lg:flex">
          {menu.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-sm transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <DropdownMenu>
          {/* ⚠️ JANGAN diganti jadi {user.name}.
              admin-users.test.tsx:90 dan login.test.tsx:89 pakai
              findByText(nama) — kalau nama muncul 2x, test merah.
              Nama baru dibuka di dalam dropdown (lazy mount). */}
          <DropdownMenuTrigger
            render={<Button type="button" variant="outline" size="sm" />}
          >
            Akun
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-muted-foreground text-xs font-normal">
                {user.role}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onLogout}>Keluar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
