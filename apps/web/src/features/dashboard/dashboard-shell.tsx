import { useMutation } from '@tanstack/react-query'
import {
  ClipboardList,
  LayoutDashboard,
  ShieldCheck,
  Users,
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
  icon: typeof ClipboardList
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

// Bingkai sidebar hijau untuk halaman pengelola (dashboard, verifikasi,
// akun admin). Guard role tetap di masing-masing route; komponen ini murni
// tampilan.
export function DashboardShell({
  user,
  header,
  children,
}: {
  user: User
  header?: ReactNode
  children: ReactNode
}) {
  const router = useRouter()
  const logout = useMutation(logoutMutationOptions)
  const navItems = navFor(user.role)

  const onLogout = async () => {
    await logout.mutateAsync()
    await router.navigate({ to: '/login' })
  }

  const who =
    user.role === 'super_admin'
      ? { title: 'Super admin', desc: 'Akses penuh ke semua pengaturan.' }
      : { title: 'Admin', desc: 'Verifikasi laporan masuk.' }

  return (
    <div className="min-h-dvh bg-[#f6f3ea] p-0 lg:p-4">
      <div className="flex min-h-dvh overflow-hidden rounded-none bg-[#2f9e78] lg:min-h-[calc(100dvh-2rem)] lg:rounded-[2rem] lg:pt-3 lg:pr-3 lg:pb-3">
        <aside
          aria-label="Navigasi admin"
          className="hidden w-64 shrink-0 flex-col justify-between p-6 pl-7 lg:flex"
        >
          <div className="flex flex-col gap-8">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <ClipboardList
                  aria-hidden="true"
                  className="size-5 text-white"
                />
              </span>
              <p className="text-lg leading-tight font-bold text-white">
                Pelaporan
                <br />
                Fasilitas
              </p>
            </div>

            <nav className="flex flex-col gap-1.5">
              {navItems.map((item) => (
                <NavLink key={item.to} {...item} />
              ))}
            </nav>
          </div>

          <div className="rounded-2xl bg-white/12 p-4">
            <p className="text-sm font-semibold text-white">{who.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-emerald-50/80">
              {who.desc}
            </p>
            <button
              type="button"
              onClick={onLogout}
              disabled={logout.isPending}
              className="mt-3 rounded-lg bg-[#f6efdc] px-4 py-1.5 text-sm font-semibold text-[#0d3f31] transition-colors hover:bg-white disabled:opacity-60"
            >
              {logout.isPending ? 'Keluar...' : 'Keluar'}
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-white lg:rounded-[1.25rem]">
          <nav
            aria-label="Navigasi admin mobile"
            className="flex scrollbar-none items-center gap-1 overflow-x-auto border-b border-neutral-100 bg-[#2f9e78] px-4 py-2 lg:hidden"
          >
            {navItems.map((item) => (
              <NavLink key={item.to} {...item} mobile />
            ))}
          </nav>

          <header className="flex items-center justify-between gap-4 border-b border-neutral-100 px-5 py-3.5 lg:px-8">
            <div className="min-w-0">{header}</div>

            <div className="flex shrink-0 items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-[#2f9e78] text-xs font-semibold text-white">
                {initialsOf(user.name)}
              </span>
              <span className="hidden text-right sm:block">
                <span className="block text-sm font-medium text-neutral-700">
                  {user.name}
                </span>
                <span className="block text-xs text-neutral-400">
                  {who.title}
                </span>
              </span>
            </div>
          </header>

          <main className="flex-1 px-5 py-6 pb-10 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  )
}

function NavLink({
  label,
  to,
  icon: Icon,
  end,
  mobile,
}: {
  label: string
  to: NavTo
  icon: typeof ClipboardList
  end?: boolean
  mobile?: boolean
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
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-full px-4 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-white text-[#0d6b4f] shadow-sm'
          : 'text-emerald-50/90 hover:bg-white/10 hover:text-white',
        mobile && 'shrink-0 px-3 py-1.5 text-xs',
      )}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      {label}
    </Link>
  )
}
