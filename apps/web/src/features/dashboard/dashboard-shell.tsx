import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Building2,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react'
import { Link, useRouter, useRouterState } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { logoutMutationOptions } from '@/features/auth/auth-query'
import type { User } from '@/features/auth/auth-query'
import { cn } from '@/lib/utils'

// Rute yang boleh muncul di sidebar. Union eksplisit supaya Link dapat
// tipe route yang benar dan menu tidak pernah mengarah ke halaman fiktif.
type NavTo = '/dashboard' | '/verifikasi' | '/admin'

interface NavItem {
  label: string
  to: NavTo
  icon: typeof LayoutDashboard
  end?: boolean
}

const adminNav: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: LayoutDashboard,
    end: true,
  },
  { label: 'Verifikasi', to: '/verifikasi', icon: ShieldCheck },
]

// Akun Admin cuma untuk super_admin. Menu Prioritas/Statistik/Pengaturan
// belum punya route di main, jadi sengaja tidak dipasang sebagai link mati.
const superAdminNav: NavItem[] = [
  ...adminNav,
  { label: 'Akun Admin', to: '/admin', icon: Users },
]

function navFor(role: string): NavItem[] {
  return role === 'super_admin' ? superAdminNav : adminNav
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// Bingkai sidebar hijau tua untuk halaman pengelola (dashboard, verifikasi,
// akun admin). Warna disamakan dengan layout user. Guard role tetap di
// masing-masing route; komponen ini murni tampilan.
//
// `menunggu` = jumlah laporan yang menunggu verifikasi, ditampilkan
// sebagai badge di menu Verifikasi.
export function DashboardShell({
  user,
  header,
  menunggu,
  children,
}: {
  user: User
  header?: ReactNode
  menunggu?: number
  children: ReactNode
}) {
  const router = useRouter()
  const logout = useMutation(logoutMutationOptions)
  const navItems = navFor(user.role)
  const [mobileOpen, setMobileOpen] = useState(false)

  const onLogout = async () => {
    await logout.mutateAsync()
    await router.navigate({ to: '/login' })
  }

  const who =
    user.role === 'super_admin' ? { title: 'Super admin' } : { title: 'Admin' }

  return (
    <div className="min-h-dvh bg-[#0f3d2e] lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Tutup menu"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        aria-label="Navigasi admin"
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-[270px] flex-col overflow-y-auto bg-[#0f3d2e] text-white shadow-xl lg:sticky lg:top-0 lg:z-0 lg:flex lg:h-dvh lg:w-auto lg:translate-x-0 lg:shadow-none',
          mobileOpen ? 'flex translate-x-0' : 'hidden -translate-x-full',
        )}
      >
        <button
          type="button"
          aria-label="Tutup menu"
          className="absolute top-4 right-4 grid size-9 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <X aria-hidden="true" className="size-5" />
        </button>

        <div className="flex items-center gap-3 px-5 pt-5 pb-6 text-[17px] leading-tight font-bold">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/10">
            <Building2 aria-hidden="true" className="size-6" />
          </span>
          <span>
            Pelaporan
            <br />
            Fasilitas
          </span>
        </div>

        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              {...item}
              badge={item.to === '/verifikasi' ? menunggu : undefined}
              onNavigate={() => setMobileOpen(false)}
            />
          ))}
        </nav>

        {/* Kartu profil + keluar */}
        <div className="mx-3 mt-auto mb-3 rounded-[20px] bg-white/10 p-[18px]">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#1f6b4f] text-sm font-semibold text-white ring-1 ring-white/20">
              {initialsOf(user.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-white">
                {user.name}
              </p>
              <p className="text-sm text-white/70">{who.title}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            disabled={logout.isPending}
            className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            <LogOut aria-hidden="true" className="size-4" />
            {logout.isPending ? 'Keluar...' : 'Keluar'}
          </button>
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col bg-[#f6f7f4]">
        <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-neutral-200/70 bg-[#f6f7f4] px-4 lg:px-10">
          <button
            type="button"
            aria-label="Buka menu"
            className="grid size-9 shrink-0 place-items-center rounded-full text-neutral-700 transition-colors hover:bg-neutral-200/60 lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu aria-hidden="true" className="size-5" />
          </button>

          <div className="flex min-w-0 flex-1 items-center self-stretch">
            {header}
          </div>
        </header>

        <main className="flex-1 px-4 pt-5 pb-8 lg:px-10 lg:pt-5 lg:pb-10">
          {children}
        </main>
      </div>
    </div>
  )
}

function NavLink({
  label,
  to,
  icon: Icon,
  end,
  badge,
  onNavigate,
}: {
  label: string
  to: NavTo
  icon: typeof LayoutDashboard
  end?: boolean
  badge?: number
  onNavigate?: () => void
}) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const active = end
    ? pathname === to
    : pathname === to || pathname.startsWith(`${to}/`)

  return (
    <Link
      to={to}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'mx-3 flex items-center gap-3.5 rounded-xl px-4 py-3 text-[15px] transition-colors',
        active
          ? 'bg-[#1f4d3d] font-bold text-white'
          : 'font-medium text-white/80 hover:bg-white/10 hover:text-white',
      )}
    >
      <Icon aria-hidden="true" className="size-5 shrink-0" />
      {label}
      {badge ? (
        <span className="ml-auto rounded-full bg-[#f0b45a] px-2 text-[11px] font-bold text-[#3a2600]">
          {badge}
        </span>
      ) : null}
    </Link>
  )
}
