import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const OPSI_PER_HALAMAN = [5, 10, 20, 50]

type Props = {
  halaman: number // 0-based
  totalHalaman: number
  perHalaman: number
  onPindah: (halaman: number) => void
  onUbahPerHalaman: (jumlah: number) => void
}

export function VerifikasiPager({
  halaman,
  totalHalaman,
  perHalaman,
  onPindah,
  onUbahPerHalaman,
}: Props) {
  const aktif = halaman + 1
  const nomor = susunNomor(totalHalaman, aktif)

  const tombol =
    'grid size-10 place-items-center rounded-xl border-[1.5px] border-[#efe9d8] bg-white text-sm font-medium tabular-nums transition-colors outline-none hover:bg-[#faf3e5] focus-visible:ring-2 focus-visible:ring-[#1f6b4f]/25 disabled:pointer-events-none disabled:opacity-40'

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <div className="flex items-center gap-3 text-sm">
        <label htmlFor="verifikasi-per-halaman" className="sr-only">
          Jumlah baris per halaman
        </label>
        <select
          id="verifikasi-per-halaman"
          value={perHalaman}
          onChange={(event) => onUbahPerHalaman(Number(event.target.value))}
          className="h-10 rounded-xl border-[1.5px] border-[#efe9d8] bg-white px-3 text-sm outline-none focus-visible:border-[#1f6b4f] focus-visible:ring-2 focus-visible:ring-[#1f6b4f]/20"
        >
          {OPSI_PER_HALAMAN.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span aria-hidden="true">Jumlah baris per halaman</span>
      </div>

      <nav
        aria-label="Halaman daftar laporan"
        className="flex flex-wrap items-center gap-2"
      >
        {/* Template literal: spasi tidak hilang walau Prettier memecah baris. */}
        <span aria-live="polite" className="mr-2 text-sm font-medium">
          {`Halaman ${aktif} dari ${totalHalaman}`}
        </span>

        <button
          type="button"
          aria-label="Halaman pertama"
          disabled={halaman === 0}
          onClick={() => onPindah(0)}
          className={tombol}
        >
          <ChevronsLeftIcon aria-hidden="true" className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Halaman sebelumnya"
          disabled={halaman === 0}
          onClick={() => onPindah(halaman - 1)}
          className={tombol}
        >
          <ChevronLeftIcon aria-hidden="true" className="size-4" />
        </button>

        {nomor.map((item, i) =>
          item === '…' ? (
            <span
              key={`titik-${i}`}
              aria-hidden="true"
              className="px-1 text-sm text-[#8a8f87]"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              aria-current={item === aktif ? 'page' : undefined}
              onClick={() => onPindah(item - 1)}
              className={cn(
                tombol,
                item === aktif &&
                  'border-[#0f3d2e] bg-[#0f3d2e] text-white hover:bg-[#0f3d2e]',
              )}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          aria-label="Halaman berikutnya"
          disabled={halaman === totalHalaman - 1}
          onClick={() => onPindah(halaman + 1)}
          className={tombol}
        >
          <ChevronRightIcon aria-hidden="true" className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Halaman terakhir"
          disabled={halaman === totalHalaman - 1}
          onClick={() => onPindah(totalHalaman - 1)}
          className={tombol}
        >
          <ChevronsRightIcon aria-hidden="true" className="size-4" />
        </button>
      </nav>
    </div>
  )
}

// Sama dengan susunNomor di riwayat-list.tsx: penuh kalau ≤ 7, selain itu
// jendela ±1 di sekitar halaman aktif + halaman pertama/terakhir.
function susunNomor(total: number, aktif: number): Array<number | '…'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const simpul = new Set<number>()
  for (const n of [1, total, aktif - 1, aktif, aktif + 1]) {
    if (n >= 1 && n <= total) simpul.add(n)
  }

  const terurut = [...simpul].sort((a, b) => a - b)
  const hasil: Array<number | '…'> = []
  let sebelumnya = 0

  for (const n of terurut) {
    const selisih = n - sebelumnya
    if (selisih === 2) hasil.push(sebelumnya + 1)
    else if (selisih > 2) hasil.push('…')
    hasil.push(n)
    sebelumnya = n
  }

  return hasil
}
