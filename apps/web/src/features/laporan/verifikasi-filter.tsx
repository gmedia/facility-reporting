import { useEffect, useRef, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// Nilai "semua" = filter tidak aktif. Sama dengan state di verifikasi-page.
const SEMUA = 'semua'

// Warna chip prioritas saat dipilih, disamakan dengan badge prioritas di
// daftar laporan. Dicocokkan lewat label (huruf kecil) supaya tidak
// bergantung pada nilai enum.
const WARNA_PRIORITAS: Record<string, string> = {
  tinggi: 'border-red-300 bg-red-100 text-red-800',
  sedang: 'border-amber-300 bg-amber-100 text-amber-800',
  rendah: 'border-emerald-300 bg-emerald-100 text-emerald-800',
}

// Mengembalikan kelas warna khusus untuk grup Prioritas, atau undefined
// untuk grup lain (dipakai warna hijau tua bawaan).
function warnaPrioritas(key: string, label: string): string | undefined {
  if (key !== 'prioritas') return undefined
  return WARNA_PRIORITAS[label.toLowerCase()]
}

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
// membuka panel chip per grup. Di HP panel tampil sebagai bottom sheet
// (penuh lebar, menempel di bawah layar); di layar >= 640px tampil sebagai
// popup di bawah tombol. Filter yang aktif tetap kelihatan sebagai chip di
// bawah bar walau panel tertutup.
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

  // Tutup panel kalau klik di luar atau tekan Esc.
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

  // Cegah halaman di belakang ikut ter-scroll saat bottom sheet terbuka di HP.
  useEffect(() => {
    if (!buka) return
    if (!window.matchMedia('(max-width: 639px)').matches) return

    const lama = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = lama
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
            className="h-10 w-full rounded-xl border-[1.5px] border-[#efe9d8] bg-white pr-3 pl-10 text-sm transition-colors outline-none hover:border-[#d9d2bd] focus-visible:border-[#0f3d2e] focus-visible:ring-2 focus-visible:ring-[#0f3d2e]/20"
          />
        </label>

        <div ref={wadah} className="sm:relative">
          <button
            ref={tombol}
            type="button"
            aria-haspopup="true"
            aria-expanded={buka}
            onClick={() => setBuka((v) => !v)}
            className={cn(
              'inline-flex h-10 items-center gap-2 rounded-xl border-[1.5px] px-3.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#0f3d2e]/20',
              aktif.length > 0
                ? 'border-[#0f3d2e] bg-[#0f3d2e] font-medium text-white'
                : 'border-[#efe9d8] bg-white hover:border-[#d9d2bd]',
            )}
          >
            <SlidersHorizontal aria-hidden="true" className="size-4" />
            Filter
            {aktif.length > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1.5 text-xs font-bold text-[#0f3d2e]">
                {aktif.length}
              </span>
            )}
          </button>

          {/* Backdrop gelap, hanya di HP, supaya sheet terasa modal dan
              ketukan di luar menutupnya. */}
          {buka && (
            <div
              aria-hidden="true"
              onClick={() => setBuka(false)}
              className="fixed inset-0 z-40 bg-black/40 sm:hidden"
            />
          )}

          {/* Selalu tetap ada di DOM agar accessible untuk testing dan screen
              reader. HP: bottom sheet `fixed` menempel di bawah layar.
              >= sm: popup `absolute` di bawah tombol. */}
          <div
            role="group"
            aria-label="Filter status"
            className={cn(
              'z-50 overflow-y-auto bg-white shadow-lg',
              // HP: bottom sheet
              'fixed inset-x-0 bottom-0 max-h-[80dvh] rounded-t-3xl border-t-[1.5px] border-[#efe9d8] px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]',
              // Layar lebar: popup di bawah tombol
              'sm:absolute sm:inset-x-auto sm:top-12 sm:right-0 sm:bottom-auto sm:max-h-[70dvh] sm:w-[19rem] sm:rounded-2xl sm:border-[1.5px] sm:p-4',
              buka ? '' : 'hidden',
            )}
          >
            {/* Header sheet (hanya HP): pegangan + judul + tombol tutup */}
            <div className="sm:hidden">
              <div
                aria-hidden="true"
                className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[#d9d2bd]"
              />
              <div className="mb-3 flex items-center justify-between">
                <span className="text-base font-semibold text-[#1d2b26]">
                  Filter laporan
                </span>
                <button
                  type="button"
                  aria-label="Tutup filter"
                  onClick={() => setBuka(false)}
                  className="grid size-9 place-items-center rounded-full bg-[#f6f7f4] text-[#1d2b26] outline-none focus-visible:ring-2 focus-visible:ring-[#0f3d2e]/25"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              </div>
            </div>

            {grup.map((g) => (
              <fieldset key={g.key} className="mb-4 last:mb-0">
                <legend className="mb-2 text-sm text-[#8a8f87]">
                  {g.judul}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {g.opsi.map((o) => {
                    const dipilih = g.nilai === o.value
                    const warna = warnaPrioritas(g.key, o.label)
                    return (
                      <button
                        key={o.value}
                        type="button"
                        aria-pressed={dipilih}
                        // Klik lagi pada chip yang aktif = lepas filter.
                        onClick={() => g.onPilih(dipilih ? SEMUA : o.value)}
                        className={cn(
                          // min-h-10 = area ketuk nyaman di HP
                          'inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#0f3d2e]/25 sm:min-h-0',
                          dipilih
                            ? (warna ??
                                'border-[#0f3d2e] bg-[#0f3d2e] text-white') +
                                ' font-medium'
                            : 'border-[#efe9d8] hover:border-[#d9d2bd] hover:bg-[#faf3e5]',
                        )}
                      >
                        {o.label}
                        {o.jumlah !== undefined && (
                          <span
                            className={cn(
                              'text-xs tabular-nums',
                              dipilih
                                ? warna
                                  ? 'opacity-70'
                                  : 'text-white/70'
                                : 'text-[#8a8f87]',
                            )}
                          >
                            {o.jumlah}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            ))}

            {/* Tombol Terapkan (hanya HP): filter sudah langsung berlaku,
                tombol ini hanya menutup sheet. */}
            <button
              type="button"
              onClick={() => setBuka(false)}
              className="mt-4 h-11 w-full rounded-xl bg-[#0f3d2e] text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-[#0f3d2e]/40 sm:hidden"
            >
              Lihat {jumlah} laporan
            </button>
          </div>
        </div>

        {(aktif.length > 0 || cari.trim() !== '') && (
          <button
            type="button"
            onClick={() => {
              onReset()
              setBuka(false)
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm text-[#8a8f87] transition-colors outline-none hover:bg-[#0f3d2e]/10 hover:text-[#0f3d2e] focus-visible:ring-2 focus-visible:ring-[#0f3d2e]/20"
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
          const warna = warnaPrioritas(g.key, label)
          return (
            <span
              key={g.key}
              className={cn(
                'inline-flex items-center gap-1 rounded-full py-0.5 pr-1 pl-2.5 text-xs font-medium',
                warna ? `border ${warna}` : 'bg-[#0f3d2e] text-white',
              )}
            >
              {label}
              <button
                type="button"
                aria-label={`Hapus filter ${g.judul}: ${label}`}
                onClick={() => g.onPilih(SEMUA)}
                className={cn(
                  'grid size-4.5 place-items-center rounded-full outline-none focus-visible:ring-2',
                  warna
                    ? 'hover:bg-black/10 focus-visible:ring-black/20'
                    : 'hover:bg-white/20 focus-visible:ring-white/50',
                )}
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