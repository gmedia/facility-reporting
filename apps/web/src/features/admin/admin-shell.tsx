import { useMutation } from '@tanstack/react-query'
import {
  BarChart3,
  Bell,
  ClipboardList,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Link, useRouter } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { logoutMutationOptions } from '@/features/auth/auth-query'
import type { User } from '@/features/auth/auth-query'
import { cn } from '@/lib/utils'

// Rute yang boleh muncul di sidebar. Union eksplisit supaya Link dapet
// tipingan route yang benar.
type NavTo =
  | '/admin'
  | '/verifikasi'
  | '/admin/pengaturan'
  | '/admin/statistik'
  | '/admin/akun'

interface NavItem {
  label: string
  to: NavTo
  icon: typeof ClipboardList
  end?: boolean
}

// Menu super admin — ikut tabel "Menu per role" di brief:
//   super_admin → /admin, /admin/pengaturan, /admin/statistik
// + "Akun Admin" (/admin/akun) — CRUD akun, guard super_admin
// + "Verifikasi" (/verifikasi) — super_admin juga boleh lihat antrian
const superAdminNav: NavItem[] = [
  { label: 'Dashboard', to: '/admin', icon: ClipboardList, end: true },
  { label: 'Verifikasi', to: '/verifikasi', icon: ShieldCheck },
  { label: 'Pengaturan', to: '/admin/pengaturan', icon: Settings },
  { label: 'Statistik', to: '/admin/statistik', icon: BarChart3 },
  { label: 'Akun Admin', to: '/admin/akun', icon: Users },
]

// Menu role admin — di brief: /verifikasi, /prioritas.
// /prioritas masih sprint 18 Nov, jadi belum dimasukkan.
const adminNav: NavItem[] = [
  { label: 'Verifikasi', to: '/verifikasi', icon: ShieldCheck },
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

// Bingkai sidebar hijau dipakai BARENG sama /admin dan /verifikasi.
// Guard-nya tetap di masing-masing route (admin: super_admin saja,
// verifikasi: admin ATAU super_admin) — komponen ini cuma tampilan.
export function AdminShell({
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
      {/* Bingkai hijau — sidebar nyatu sama frame, panel putih nyatu di
          dalemnya tapi beri jarak hijau atas-kanan-bawah (kayak mock) */}
      <div className="flex min-h-dvh overflow-hidden rounded-none bg-[#2f9e78] lg:min-h-[calc(100dvh-2rem)] lg:rounded-[2rem] lg:pt-3 lg:pr-3 lg:pb-3">
        <aside className="hidden w-64 shrink-0 flex-col justify-between p-6 pl-7 lg:flex">
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
          {/* Nav versi mobile — sidebar disembunyikan di layar kecil */}
          <nav className="flex scrollbar-none items-center gap-1 overflow-x-auto border-b border-neutral-100 px-4 py-2 lg:hidden">
            {navItems.map((item) => (
              <NavLink key={item.to} {...item} mobile />
            ))}
          </nav>

          {/* Baris atas: slot header (tab filter) di kiri, akun di kanan */}
          <header className="flex items-center justify-between gap-4 border-b border-neutral-100 px-5 py-3.5 lg:px-8">
            <div className="min-w-0">{header}</div>

            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                aria-label="Notifikasi"
                className="text-neutral-400 transition-colors hover:text-neutral-700"
              >
                <Bell aria-hidden="true" className="size-5" />
              </button>
              <span className="flex size-9 items-center justify-center rounded-full bg-[#2f9e78] text-xs font-semibold text-white">
                {initialsOf(user.name)}
              </span>
              <span className="hidden text-sm font-medium text-neutral-700 sm:inline">
                {user.name}
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
  return (
    <Link
      to={to}
      activeOptions={end ? { exact: true } : undefined}
      className={cn(
        'flex items-center gap-3 rounded-full px-4 py-2 text-sm font-medium transition-colors',
        '[&.active]:bg-white [&.active]:text-[#0d6b4f] [&.active]:shadow-sm',
        'text-emerald-50/90 hover:bg-white/10 hover:text-white',
        mobile && 'shrink-0 px-3 py-1.5 text-xs',
      )}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      {label}
    </Link>
  )
}
