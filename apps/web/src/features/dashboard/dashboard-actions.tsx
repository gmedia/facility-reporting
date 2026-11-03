import { Link } from '@tanstack/react-router'
import { Plus, ShieldCheck, Users } from 'lucide-react'

const TOMBOL_UTAMA =
  'inline-flex h-11 items-center gap-2 rounded-2xl bg-[#0d3f31] px-5 text-sm font-medium text-white transition-colors hover:bg-[#0a3127]'
const TOMBOL_SEKUNDER =
  'inline-flex h-11 items-center gap-2 rounded-2xl border border-black/10 bg-white px-5 text-sm font-medium text-[#0d3f31] transition-colors hover:bg-[#0d3f31]/6'

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
