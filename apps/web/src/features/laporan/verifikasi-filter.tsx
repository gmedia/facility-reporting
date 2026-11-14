import { useEffect, useRef, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// Nilai "semua" = filter tidak aktif. Sama dengan state di verifikasi-page.
const SEMUA = 'semua'

export type FilterOpsi = {
  value: string
  label: string
  jumlah?: number
}

export type FilterGrup = {
  key: string
  judul: string
  nilai: string
  opsi: ReadonlyArray<FilterOpsi>
  onPilih: (nilai: string) => void
}

type Props = {
  cari: string
  onCari: (nilai: string) => void
  grup: ReadonlyArray<FilterGrup>
  // Jumlah laporan setelah semua filter diterapkan.
  jumlah: number
  onReset: () => void
}

// Bar filter halaman Verifikasi: kolom cari + satu tombol Filter yang
// membuka popup chip per grup. Filter yang aktif tetap kelihatan sebagai
// chip di bawah bar walau popup tertutup.
export function VerifikasiFilter({
  cari,
  onCari,
  grup,
  jumlah,
  onReset,
}: Props) {
  const [buka, setBuka] = useState(false)
  const wadah = useRef<HTMLDivElement>(null)
  const tombol = useRef<HTMLButtonElement>(null)

  const aktif = grup.filter((g) => g.nilai !== SEMUA)

  // Tutup popup kalau klik di luar atau tekan Esc.
  useEffect(() => {
    if (!buka) return

    const onKlik = (event: PointerEvent) => {
      if (!wadah.current?.contains(event.target as Node)) setBuka(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setBuka(false)
        tombol.current?.focus()
      }
    }

    document.addEventListener('pointerdown', onKlik)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onKlik)
      document.removeEventListener('keydown', onKey)
    }
  }, [buka])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-[14rem] flex-1">
          <span className="sr-only">Cari laporan</span>
          <Search
            aria-hidden="true"
            className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#8a8f87]"
          />
          <input
            type="search"
            value={cari}
            onChange={(event) => onCari(event.target.value)}
            placeholder="Cari deskripsi, lokasi, atau pelapor…"
            className="h-10 w-full rounded-xl border-[1.5px] border-[#efe9d8] bg-white pr-3 pl-10 text-sm transition-colors outline-none hover:border-[#d9d2bd] focus-visible:border-[#1f6b4f] focus-visible:ring-2 focus-visible:ring-[#1f6b4f]/20"
          />
        </label>

        <div ref={wadah} className="relative">
          <button
            ref={tombol}
            type="button"
            aria-haspopup="true"
            aria-expanded={buka}
            onClick={() => setBuka((v) => !v)}
            className={cn(
              'inline-flex h-10 items-center gap-2 rounded-xl border-[1.5px] px-3.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#1f6b4f]/20',
              aktif.length > 0
                ? 'border-[#1f6b4f] bg-[#e0f1e8] font-medium text-[#1f6b4f]'
                : 'border-[#efe9d8] bg-white hover:border-[#d9d2bd]',
            )}
          >
            <SlidersHorizontal aria-hidden="true" className="size-4" />
            Filter
            {aktif.length > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#1f6b4f] px-1.5 text-xs text-white">
                {aktif.length}
              </span>
            )}
          </button>

          {buka && (
            <div
              role="group"
              aria-label="Filter laporan"
              className="absolute top-12 right-0 z-20 max-h-[70dvh] w-[19rem] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border-[1.5px] border-[#efe9d8] bg-white p-4 shadow-lg"
            >
              {grup.map((g) => (
                <fieldset key={g.key} className="mb-4 last:mb-0">
                  <legend className="mb-2 text-sm text-[#8a8f87]">
                    {g.judul}
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {g.opsi.map((o) => {
                      const dipilih = g.nilai === o.value
                      return (
                        <button
                          key={o.value}
                          type="button"
                          aria-pressed={dipilih}
                          // Klik lagi pada chip yang aktif = lepas filter.
                          onClick={() => g.onPilih(dipilih ? SEMUA : o.value)}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#1f6b4f]/25',
                            dipilih
                              ? 'border-[#1f6b4f] bg-[#e0f1e8] font-medium text-[#1f6b4f]'
                              : 'border-[#efe9d8] hover:border-[#d9d2bd] hover:bg-[#faf3e5]',
                          )}
                        >
                          {o.label}
                          {o.jumlah !== undefined && (
                            <span className="text-xs text-[#8a8f87] tabular-nums">
                              {o.jumlah}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
          )}
        </div>

        {(aktif.length > 0 || cari.trim() !== '') && (
          <button
            type="button"
            onClick={() => {
              onReset()
              setBuka(false)
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm text-[#8a8f87] transition-colors outline-none hover:bg-[#e0f1e8] hover:text-[#1f6b4f] focus-visible:ring-2 focus-visible:ring-[#1f6b4f]/20"
          >
            <X aria-hidden="true" className="size-4" />
            Reset
          </button>
        )}
      </div>

      <div className="flex min-h-6 flex-wrap items-center gap-2 text-sm text-[#8a8f87]">
        <span aria-live="polite">{jumlah} laporan</span>
        {aktif.map((g) => {
          const label =
            g.opsi.find((o) => o.value === g.nilai)?.label ?? g.nilai
          return (
            <span
              key={g.key}
              className="inline-flex items-center gap-1 rounded-full bg-[#e0f1e8] py-0.5 pr-1 pl-2.5 text-xs font-medium text-[#1f6b4f]"
            >
              {label}
              <button
                type="button"
                aria-label={`Hapus filter ${g.judul}: ${label}`}
                onClick={() => g.onPilih(SEMUA)}
                className="grid size-4.5 place-items-center rounded-full outline-none hover:bg-[#1f6b4f]/15 focus-visible:ring-2 focus-visible:ring-[#1f6b4f]/30"
              >
                <X aria-hidden="true" className="size-3" />
              </button>
            </span>
          )
        })}
      </div>
    </div>
  )
}
