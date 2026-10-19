import { Link, useSearch } from '@tanstack/react-router'
import { readFilter } from '@/features/admin/dashboard-data'
import { cn } from '@/lib/utils'

const filters = [
  { label: 'Semua', value: 'semua' },
  { label: 'Menunggu', value: 'menunggu' },
  { label: 'Terverifikasi', value: 'terverifikasi' },
] as const

// Tab Semua / Menunggu / Terverifikasi.
// Ditaruh di header layout admin (sebaris sama avatar, kayak mock),
// state-nya disimpan di URL (?filter=) supaya halaman /admin tinggal baca.
export function AntrianTabs() {
  const search = useSearch({ strict: false }) as { filter?: unknown }
  const filter = readFilter(search)

  return (
    <div className="flex gap-6">
      {filters.map((item) => (
        <Link
          key={item.value}
          to="/admin"
          search={{ filter: item.value }}
          resetScroll={false}
          className={cn(
            '-mb-px border-b-2 pb-2.5 text-sm font-medium transition-colors',
            filter === item.value
              ? 'text-foreground border-amber-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-600',
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  )
}
