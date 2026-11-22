import { CheckIcon, ChevronDownIcon } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  nilai: number
  opsi: number[]
  onPilih: (jumlah: number) => void
}

// Dropdown kustom (pengganti <select> bawaan browser): popup membulat,
// opsi aktif diberi centang, terbuka ke atas karena pager ada di dasar
// halaman. Ditutup lewat klik di luar, Esc, atau memilih opsi.
export function PilihBaris({ nilai, opsi, onPilih }: Props) {
  const [buka, setBuka] = useState(false)
  const wadah = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => {
    if (!buka) return

    const onKlik = (event: MouseEvent) => {
      if (!wadah.current?.contains(event.target as Node)) setBuka(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setBuka(false)
    }

    document.addEventListener('mousedown', onKlik)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onKlik)
      window.removeEventListener('keydown', onKey)
    }
  }, [buka])

  return (
    <div ref={wadah} className="relative">
      <button
        type="button"
        aria-label="Jumlah baris per halaman"
        aria-haspopup="listbox"
        aria-expanded={buka}
        aria-controls={listId}
        onClick={() => setBuka((v) => !v)}
        className={cn(
          'inline-flex h-10 min-w-18 items-center justify-between gap-2 rounded-xl border-[1.5px] bg-white px-3 text-sm tabular-nums transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#1f6b4f]/20',
          buka
            ? 'border-[#1f6b4f]'
            : 'border-[#efe9d8] hover:bg-[#faf3e5] focus-visible:border-[#1f6b4f]',
        )}
      >
        {nilai}
        <ChevronDownIcon
          aria-hidden="true"
          className={cn(
            'size-4 text-[#5f655d] transition-transform',
            buka && 'rotate-180',
          )}
        />
      </button>

      {buka && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Jumlah baris per halaman"
          className="absolute bottom-full left-0 z-40 mb-2 w-28 rounded-xl border border-[#efe9d8] bg-white p-1 shadow-[0_12px_32px_rgba(15,61,46,0.16)]"
        >
          {opsi.map((n) => {
            const dipilih = n === nilai
            return (
              <li key={n} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={dipilih}
                  onClick={() => {
                    onPilih(n)
                    setBuka(false)
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm tabular-nums transition-colors outline-none focus-visible:bg-[#faf3e5]',
                    dipilih
                      ? 'bg-[#e0f1e8] font-semibold text-[#0f3d2e]'
                      : 'text-[#1d2b26] hover:bg-[#faf3e5]',
                  )}
                >
                  {n}
                  {dipilih && (
                    <CheckIcon
                      aria-hidden="true"
                      className="size-4 text-[#1f6b4f]"
                    />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
