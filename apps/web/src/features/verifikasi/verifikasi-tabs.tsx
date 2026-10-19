import { Link, useSearch } from '@tanstack/react-router'
import {
  readVerifikasiFilter,
  type VerifikasiFilter,
} from '@/features/verifikasi/verifikasi-query'
import { cn } from '@/lib/utils'

const filters = [
  { label: 'Semua', value: 'semua' },
  { label: 'Menunggu', value: 'menunggu' },
  { label: 'Terverifikasi', value: 'terverifikasi' },
] as const satisfies readonly { label: string; value: VerifikasiFilter }[]

// Tab Semua / Menunggu / Terverifikasi versi /verifikasi.
// Ditaruh di header layout (sebaris sama avatar, kayak mock),
// state-nya disimpan di URL (?filter=) supaya gampang di-share.
export function VerifikasiTabs() {
  const search = useSearch({ strict: false }) as { filter?: unknown }
  const filter = readVerifikasiFilter(search)

  return (
    <div className="flex gap-6">
      {filters.map((item) => (
        <Link
          key={item.value}
          to="/verifikasi"
          search={{ filter: item.value }}
          resetScroll={false}
          className={cn(
            '-mb-px border-b-2 pb-2.5 text-sm font-medium transition-colors',
            filter === item.value
              ? 'text-foreground border-[#dfc787]'
              : 'border-transparent text-neutral-400 hover:text-neutral-600',
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  )
}
