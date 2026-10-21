import { Link } from '@tanstack/react-router'
import { Plus, ShieldCheck, Users } from 'lucide-react'

const TOMBOL_UTAMA =
  'inline-flex h-11 items-center gap-2 rounded-2xl bg-[#3b9b6b] px-5 text-sm font-medium text-white transition-colors hover:bg-[#2f8059]'
const TOMBOL_SEKUNDER =
  'inline-flex h-11 items-center gap-2 rounded-2xl border-[1.5px] border-[#dfc787] bg-white px-5 text-sm font-medium text-neutral-700 transition-colors hover:bg-[#faf3e5]'

// Tombol akses cepat beda per role:
// user        → Lapor Kerusakan
// admin       → Verifikasi Laporan
// super_admin → Verifikasi Laporan + Kelola Akun
export function DashboardActions({ role }: { role: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {role === 'user' && (
        <Link to="/lapor" className={TOMBOL_UTAMA}>
          <Plus aria-hidden="true" className="size-4" />
          Lapor Kerusakan
        </Link>
      )}

      {(role === 'admin' || role === 'super_admin') && (
        <Link
          to="/verifikasi"
          search={{ filter: 'semua' }}
          className={TOMBOL_UTAMA}
        >
          <ShieldCheck aria-hidden="true" className="size-4" />
          Verifikasi Laporan
        </Link>
      )}

      {role === 'super_admin' && (
        <Link
          to="/admin"
          search={{ filter: 'semua' }}
          className={TOMBOL_SEKUNDER}
        >
          <Users aria-hidden="true" className="size-4" />
          Kelola Akun
        </Link>
      )}
    </div>
  )
}
