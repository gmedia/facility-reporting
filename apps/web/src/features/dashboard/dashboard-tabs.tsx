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
      className="flex h-full scrollbar-none items-stretch gap-7 overflow-x-auto"
    >
      {filters.map((item) => (
        <Link
          key={item.value}
          to="/dashboard"
          search={{ filter: item.value }}
          resetScroll={false}
          aria-current={filter === item.value ? 'page' : undefined}
          className={cn(
            'flex items-center border-b-[3px] text-[15px] whitespace-nowrap transition-colors',
            filter === item.value
              ? 'border-[#dfc787] font-bold text-neutral-800'
              : 'border-transparent font-medium text-[#8a8f87] hover:text-neutral-700',
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
