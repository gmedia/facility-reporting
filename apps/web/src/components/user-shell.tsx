import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Building2,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  X,
} from 'lucide-react'
import { Link, useRouter, useRouterState } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { SiteFooter } from '@/components/site-footer'
import { logoutMutationOptions } from '@/features/auth/auth-query'
import type { User } from '@/features/auth/auth-query'
import { cn } from '@/lib/utils'

// ============================================================
// NAVIGASI HALAMAN USER
//
// ATURAN KERAS: cuma route yang SUDAH ADA di route tree. TanStack Router
// ngetik `to` sebagai union of real path — masukin path fiktif = tsc merah.
//
// Kenapa file terpisah dari DashboardShell (dashboard-shell.tsx)?
// Shell pengelola milik Anas, warnanya #3b9b6b, dan sudah dipakai 3 rute.
// Halaman user butuh warna yang sama dengan panel kiri login (#0d3f31),
// jadi digabung cuma bakal bikin salah satu pihak dikorbankan.
// ============================================================
type NavTo = '/dashboard' | '/lapor' | '/laporan/saya'

interface NavItem {
  label: string
  to: NavTo
  icon: typeof LayoutDashboard
  end?: boolean
}

const NAV_USER: NavItem[] = [
  { label: 'Beranda', to: '/dashboard', icon: LayoutDashboard, end: true },
  { label: 'Lapor Kerusakan', to: '/lapor', icon: PlusCircle },
  { label: 'Riwayat Laporan', to: '/laporan/saya', icon: History },
]

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// Bingkai halaman user: sidebar hijau tua di kiri (desktop), drawer di
// mobile, lalu area konten + footer. Guard role tetap di masing-masing
// route; komponen ini murni tampilan.
export function UserShell({
  user,
  children,
}: {
  user: User
  children: ReactNode
}) {
  const router = useRouter()
  const logout = useMutation(logoutMutationOptions)
  const [mobileOpen, setMobileOpen] = useState(false)

  const onLogout = async () => {
    await logout.mutateAsync()
    await router.navigate({ to: '/login' })
  }

  return (
    <div className="min-h-dvh bg-[#f5f7f6] lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      {/* overlay peneduh saat drawer mobile terbuka */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Tutup menu"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        aria-label="Navigasi utama"
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[272px] flex-col overflow-y-auto bg-[#0d3f31] text-white shadow-2xl lg:sticky lg:top-0 lg:z-0 lg:h-dvh lg:w-auto lg:translate-x-0 lg:shadow-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <button
          type="button"
          aria-label="Tutup menu"
          className="absolute top-4 right-4 grid size-9 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <X aria-hidden="true" className="size-5" />
        </button>

        {/* brand */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-7">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15">
            <Building2 aria-hidden="true" className="size-5" />
          </span>
          <span className="text-[15px] leading-tight font-semibold tracking-tight">
            Facility
            <br />
            Reporting
          </span>
        </div>

        {/* gap-2 + py-3: jarak antar tombol dan tinggi tombolnya sengaja
            dinaikkan satu langkah — versi lama (gap-1/py-2.5) terasa
            mepet, apalagi cuma ada 3 item. */}
        <nav className="flex flex-col gap-2 px-3">
          {NAV_USER.map((item) => (
            <NavLink
              key={item.to}
              {...item}
              onNavigate={() => setMobileOpen(false)}
            />
          ))}
        </nav>

        {/* kartu akun di bawah */}
        <div className="mt-auto px-3 pt-6 pb-4">
          <div className="rounded-3xl bg-white/8 p-4 ring-1 ring-white/10">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#3b9b6b] text-sm font-semibold text-white">
                {initialsOf(user.name)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-white">
                  {user.name}
                </span>
                <span className="block text-xs text-white/60">Mahasiswa</span>
              </span>
            </div>
            <button
              type="button"
              onClick={onLogout}
              disabled={logout.isPending}
              // Merah — satu-satunya tombol destruktif di sidebar, jadi
              // tidak boleh sekadar putih transparan seperti item biasa.
              className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-60"
            >
              <LogOut aria-hidden="true" className="size-4" />
              {logout.isPending ? 'Keluar...' : 'Keluar'}
            </button>
          </div>
        </div>
      </aside>

      {/* area konten */}
      <div className="flex min-h-dvh min-w-0 flex-col">
        {/* topbar mobile saja — desktop sudah ada sidebar */}
        <header className="sticky top-0 z-20 flex min-h-14 items-center gap-3 border-b border-black/5 bg-[#0d3f31] px-4 text-white lg:hidden">
          <button
            type="button"
            aria-label="Buka menu"
            className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 transition-colors hover:bg-white/15"
            onClick={() => setMobileOpen(true)}
          >
            <Menu aria-hidden="true" className="size-5" />
          </button>
          <span className="text-sm font-semibold tracking-tight">
            Facility Reporting
          </span>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-7 sm:px-6 lg:px-10 lg:py-9">
          {children}
        </main>

        <SiteFooter />
      </div>
    </div>
  )
}

function NavLink({
  label,
  to,
  icon: Icon,
  end,
  onNavigate,
}: {
  label: string
  to: NavTo
  icon: typeof LayoutDashboard
  end?: boolean
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
        'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors',
        active
          ? 'bg-white/12 font-semibold text-white ring-1 ring-white/10'
          : 'font-medium text-white/70 hover:bg-white/8 hover:text-white',
      )}
    >
      <Icon aria-hidden="true" className="size-[18px] shrink-0" />
      {label}
    </Link>
  )
}
