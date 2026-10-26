import { Link, useSearch } from '@tanstack/react-router'
import { readFilter } from './dashboard-utils'
import { cn } from '@/lib/utils'

const filters = [
  { label: 'Semua', value: 'semua' },
  { label: 'Menunggu', value: 'menunggu' },
  { label: 'Terverifikasi', value: 'terverifikasi' },
] as const

// Tab Semua / Menunggu / Terverifikasi. State disimpan di URL (?filter=)
// supaya halaman dashboard tinggal membaca dan me-refresh tetap konsisten.
export function DashboardTabs() {
  const search = useSearch({ strict: false }) as { filter?: unknown }
  const filter = readFilter(search)

  return (
    <nav
      aria-label="Filter antrian verifikasi"
      className="flex scrollbar-none gap-6 overflow-x-auto"
    >
      {filters.map((item) => (
        <Link
          key={item.value}
          to="/dashboard"
          search={{ filter: item.value }}
          resetScroll={false}
          aria-current={filter === item.value ? 'page' : undefined}
          className={cn(
            '-mb-px border-b-2 pb-2.5 text-sm font-medium whitespace-nowrap transition-colors',
            filter === item.value
              ? 'text-foreground border-amber-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-600',
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
