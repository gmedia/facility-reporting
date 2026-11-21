import { Link } from '@tanstack/react-router'
import { Plus, Users } from 'lucide-react'

const TOMBOL_UTAMA =
  'inline-flex h-11 items-center gap-2 rounded-2xl bg-[#0f3d2e] px-4 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-[#1f4d3d] sm:px-5'
const TOMBOL_SEKUNDER =
  'inline-flex size-11 shrink-0 items-center justify-center gap-2 rounded-2xl border-[1.5px] border-[#dfc787] bg-white text-sm font-medium whitespace-nowrap text-neutral-700 transition-colors hover:bg-[#faf3e5] sm:size-auto sm:h-11 sm:px-5'

// Tombol akses cepat beda per role:
// user        → Lapor Kerusakan
// admin       → tidak ada (menu Verifikasi sudah ada di sidebar)
// super_admin → Kelola Akun (HP: ikon saja, layar sm ke atas: ikon + teks)
export function DashboardActions({ role }: { role: string }) {
  return (
    <div className="flex items-center gap-2">
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
          aria-label="Kelola Akun"
          title="Kelola Akun"
          className={TOMBOL_SEKUNDER}
        >
          <Users aria-hidden="true" className="size-4" />
          <span className="hidden sm:inline">Kelola Akun</span>
        </Link>
      )}
    </div>
  )
}