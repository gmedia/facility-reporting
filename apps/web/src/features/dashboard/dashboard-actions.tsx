import { Link } from '@tanstack/react-router'
import { Plus, Users } from 'lucide-react'

const TOMBOL_UTAMA =
  'inline-flex h-11 items-center gap-2 rounded-2xl bg-[#0f3d2e] px-5 text-sm font-medium text-white transition-colors hover:bg-[#1f4d3d]'
const TOMBOL_SEKUNDER =
  'inline-flex h-11 items-center gap-2 rounded-2xl border-[1.5px] border-[#dfc787] bg-white px-5 text-sm font-medium text-neutral-700 transition-colors hover:bg-[#faf3e5]'

// Tombol akses cepat beda per role:
// user        → Lapor Kerusakan
// admin       → tidak ada (menu Verifikasi sudah ada di sidebar)
// super_admin → Kelola Akun
export function DashboardActions({ role }: { role: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {role === 'user' && (
        <Link to="/lapor" className={TOMBOL_UTAMA}>
          <Plus aria-hidden="true" className="size-4" />
          Lapor Kerusakan
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