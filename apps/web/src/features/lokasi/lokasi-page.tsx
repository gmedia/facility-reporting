import { Suspense, lazy, useCallback, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { LocateFixed, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { User } from '@/features/auth/auth-query'
import { formatWaktu, waktuRelatif } from '@/features/dashboard/dashboard-query'
import { DashboardShell } from '@/features/dashboard/dashboard-shell'
import { VerifikasiPager } from '@/features/laporan/verifikasi-pager'
import {
  RADIUS_MAX,
  RADIUS_MIN,
  cariTempat,
  errorMessage,
  fieldErrors,
  lokasiSettingQueryOptions,
  pelaporLokasiQueryOptions,
  useUpdateLokasiSetting,
} from '@/features/lokasi/lokasi-query'
import type {
  Fokus,
  PelaporStatus,
  Tempat,
} from '@/features/lokasi/lokasi-query'
import { useLokasiSaya } from '@/features/lokasi/lokasi-saya'
import type { LokasiSaya } from '@/features/lokasi/lokasi-saya'
import { cn } from '@/lib/utils'

// Leaflet cukup besar, jadi hanya dimuat saat halaman ini dibuka.
const LokasiPeta = lazy(() =>
  import('@/features/lokasi/lokasi-peta').then((m) => ({
    default: m.LokasiPeta,
  })),
)

const CARD = 'rounded-[26px] border border-neutral-200/70 bg-white shadow-sm'

type Draft = { lat: number; lng: number; radius: number }
type FilterStatus = 'semua' | PelaporStatus

const FILTER: ReadonlyArray<{ value: FilterStatus; label: string }> = [
  { value: 'semua', label: 'Semua' },
  { value: 'outside', label: 'Di luar radius' },
  { value: 'inside', label: 'Dalam radius' },
  { value: 'unknown', label: 'Belum ada lokasi' },
]

const STATUS_LABEL: Record<PelaporStatus, string> = {
  inside: 'Dalam radius',
  outside: 'Di luar radius',
  unknown: 'Belum ada lokasi',
}

const STATUS_PILL: Record<PelaporStatus, string> = {
  inside: 'bg-emerald-100 text-emerald-800',
  outside: 'bg-red-100 text-red-800',
  unknown: 'bg-neutral-100 text-neutral-600',
}

// Backend menyimpan 7 desimal; dibulatkan di sini supaya angka yang tampil
// sama dengan yang tersimpan.
const bulat = (n: number) => Math.round(n * 1e7) / 1e7

export function LokasiPage({ user }: { user: User }) {
  return (
    <DashboardShell
      user={user}
      header={
        <div className="min-w-0 py-2">
          <h1 className="text-base leading-tight font-bold tracking-tight sm:text-lg">
            Lokasi Akun
          </h1>
          <p className="line-clamp-2 text-xs text-neutral-500">
            Atur titik pusat dan radius, lalu pantau lokasi pelapor
          </p>
        </div>
      }
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <PanelPeta />
        <PanelPelapor />
      </div>
    </DashboardShell>
  )
}

// ---------------------------------------------------------------------
// Panel 1: peta, pencarian, radius, simpan
// ---------------------------------------------------------------------

function PanelPeta() {
  const setting = useQuery(lokasiSettingQueryOptions)
  const pelapor = useQuery(pelaporLokasiQueryOptions)
  const update = useUpdateLokasiSetting()
  const cari = useMutation({ mutationFn: cariTempat })

  // Perubahan yang belum disimpan. null = tampilan sama dengan yang
  // tersimpan di server.
  const [draft, setDraft] = useState<Draft | null>(null)
  const [kata, setKata] = useState('')
  const [fokus, setFokus] = useState<Fokus | null>(null)

  // Tombol "Pakai lokasi saya". Hook ini harus dipanggil sebelum return
  // dini di bawah, jadi callback-nya hanya memakai setter fungsional dan
  // tidak bergantung pada variabel yang baru dihitung setelah return.
  const radiusTersimpan = setting.data?.radius_m
  const pindahKeLokasiSaya = useCallback(
    (lokasi: LokasiSaya) => {
      const lat = bulat(lokasi.lat)
      const lng = bulat(lokasi.lng)
      setDraft((sebelumnya) => ({
        lat,
        lng,
        radius: sebelumnya?.radius ?? radiusTersimpan ?? RADIUS_MIN,
      }))
      setFokus((sebelumnya) => ({ lat, lng, n: (sebelumnya?.n ?? 0) + 1 }))
    },
    [radiusTersimpan],
  )
  const lokasiSaya = useLokasiSaya(pindahKeLokasiSaya)

  if (setting.isPending) {
    return <Skeleton className="h-[34rem] rounded-[26px]" />
  }
  if (setting.isError) {
    return (
      <PanelError
        judul="Gagal memuat titik pusat dan radius"
        error={setting.error}
        onRetry={() => void setting.refetch()}
      />
    )
  }

  const tersimpan = setting.data
  const aktif: Draft = draft ?? {
    lat: tersimpan.center_lat,
    lng: tersimpan.center_lng,
    radius: tersimpan.radius_m,
  }
  const berubah =
    draft !== null &&
    (draft.lat !== tersimpan.center_lat ||
      draft.lng !== tersimpan.center_lng ||
      draft.radius !== tersimpan.radius_m)
  const fokusPeta: Fokus = fokus ?? {
    lat: tersimpan.center_lat,
    lng: tersimpan.center_lng,
    n: 0,
  }

  const ubah = (bagian: Partial<Draft>) => setDraft({ ...aktif, ...bagian })

  const pindahPusat = (lat: number, lng: number) =>
    ubah({ lat: bulat(lat), lng: bulat(lng) })

  const kirimCari = (event: FormEvent) => {
    event.preventDefault()
    const q = kata.trim()
    if (q.length < 3) return
    cari.mutate(q)
  }

  const pilihTempat = (tempat: Tempat) => {
    const lat = bulat(tempat.lat)
    const lng = bulat(tempat.lng)
    ubah({ lat, lng })
    setFokus({ lat, lng, n: (fokus?.n ?? 0) + 1 })
    cari.reset()
    setKata('')
  }

  const batalkan = () => {
    setDraft(null)
    setFokus({
      lat: tersimpan.center_lat,
      lng: tersimpan.center_lng,
      n: (fokus?.n ?? 0) + 1,
    })
  }

  const simpan = async () => {
    if (!draft) return
    try {
      await update.mutateAsync({
        center_lat: draft.lat,
        center_lng: draft.lng,
        radius_m: draft.radius,
      })
      setDraft(null)
      toast.success('Titik pusat dan radius disimpan')
    } catch (error) {
      // 422 dari Laravel membawa detail per field di `errors`.
      const detail = fieldErrors(error)
      const pesanField = detail ? Object.values(detail).flat()[0] : undefined
      toast.error(pesanField ?? errorMessage(error))
    }
  }

  return (
    <section
      aria-label="Titik pusat dan radius"
      className={cn('p-4 sm:p-6', CARD)}
    >
      <h2 className="text-base font-semibold">Titik pusat dan radius</h2>
      <p className="text-sm text-neutral-500">
        Cari tempat, klik di peta, atau pakai lokasimu sekarang untuk menentukan
        titik pusat. Pin bisa digeser.
      </p>

      {/* `isolate` mengurung z-index internal Leaflet (400+) supaya peta
          tidak menimpa header sticky atau menu di atasnya. */}
      <div className="relative isolate mt-4 h-96 overflow-hidden rounded-2xl border border-neutral-200/70">
        <Suspense fallback={<Skeleton className="h-full w-full" />}>
          <LokasiPeta
            pusat={{ lat: aktif.lat, lng: aktif.lng }}
            radius={aktif.radius}
            fokus={fokusPeta}
            pelapor={pelapor.data?.rows ?? []}
            onPindah={pindahPusat}
          />
        </Suspense>

        {/* Kotak cari melayang di atas peta */}
        <div className="absolute top-3 left-3 z-[1000] w-[min(20rem,calc(100%-1.5rem))]">
          <div className="flex items-center gap-2">
            <form
              onSubmit={kirimCari}
              role="search"
              className="relative min-w-0 flex-1"
            >
              <label htmlFor="lokasi-cari" className="sr-only">
                Cari tempat
              </label>
              <Search
                aria-hidden="true"
                className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-neutral-400"
              />
              <input
                id="lokasi-cari"
                type="search"
                value={kata}
                onChange={(event) => setKata(event.target.value)}
                placeholder="Cari tempat di kampus"
                className="h-10 w-full rounded-xl border-[1.5px] border-[#efe9d8] bg-white pr-3 pl-10 text-sm shadow-sm transition-colors outline-none focus-visible:border-[#0f3d2e] focus-visible:ring-2 focus-visible:ring-[#0f3d2e]/20"
              />
            </form>

            <button
              type="button"
              onClick={lokasiSaya.cari}
              disabled={lokasiSaya.mencari}
              aria-label="Pakai lokasi saya"
              title="Pakai lokasi saya"
              className="grid size-10 shrink-0 place-items-center rounded-xl border-[1.5px] border-[#efe9d8] bg-white text-[#0f3d2e] shadow-sm transition-colors outline-none hover:bg-[#faf3e5] focus-visible:border-[#0f3d2e] focus-visible:ring-2 focus-visible:ring-[#0f3d2e]/20 disabled:cursor-wait disabled:opacity-60"
            >
              <LocateFixed
                aria-hidden="true"
                className={cn(
                  'size-4.5',
                  lokasiSaya.mencari && 'animate-pulse',
                )}
              />
            </button>
          </div>

          {lokasiSaya.mencari && (
            <p
              role="status"
              className="mt-1.5 rounded-xl bg-white px-3.5 py-2.5 text-sm text-neutral-500 shadow-lg"
            >
              Mencari lokasimu…
            </p>
          )}
          {lokasiSaya.pesan && (
            <p
              role="status"
              className="mt-1.5 rounded-xl bg-white px-3.5 py-2.5 text-sm text-amber-800 shadow-lg"
            >
              {lokasiSaya.pesan}
            </p>
          )}

          {cari.isPending && (
            <p className="mt-1.5 rounded-xl bg-white px-3.5 py-2.5 text-sm text-neutral-500 shadow-lg">
              Mencari…
            </p>
          )}
          {cari.isError && (
            <p
              role="alert"
              className="mt-1.5 rounded-xl bg-white px-3.5 py-2.5 text-sm text-red-700 shadow-lg"
            >
              Pencarian gagal. Coba lagi.
            </p>
          )}
          {cari.data &&
            (cari.data.length === 0 ? (
              <p className="mt-1.5 rounded-xl bg-white px-3.5 py-2.5 text-sm text-neutral-500 shadow-lg">
                Tempat tidak ditemukan.
              </p>
            ) : (
              <ul className="mt-1.5 overflow-hidden rounded-xl border border-neutral-200/70 bg-white text-sm shadow-lg">
                {cari.data.map((t) => (
                  <li
                    key={t.id}
                    className="border-b border-neutral-100 last:border-0"
                  >
                    <button
                      type="button"
                      onClick={() => pilihTempat(t)}
                      className="line-clamp-2 w-full px-3.5 py-2.5 text-left transition-colors outline-none hover:bg-[#faf3e5] focus-visible:bg-[#faf3e5]"
                    >
                      {t.nama}
                    </button>
                  </li>
                ))}
              </ul>
            ))}
        </div>
      </div>

      {/* Slider radius */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <label htmlFor="lokasi-radius" className="text-sm text-neutral-500">
          Radius
        </label>
        <input
          id="lokasi-radius"
          type="range"
          min={RADIUS_MIN}
          max={RADIUS_MAX}
          step={10}
          value={aktif.radius}
          onChange={(event) => ubah({ radius: Number(event.target.value) })}
          className="min-w-40 flex-1 accent-[#1f6b4f]"
        />
        <output
          htmlFor="lokasi-radius"
          className="w-20 text-right text-sm font-semibold tabular-nums"
        >
          {aktif.radius.toLocaleString('id-ID')} m
        </output>
      </div>

      {/* Koordinat + tombol */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs text-neutral-500">
          Lat {aktif.lat.toFixed(7)} · Lng {aktif.lng.toFixed(7)}
        </p>
        <div className="flex items-center gap-2">
          {berubah && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={update.isPending}
              onClick={batalkan}
            >
              Batalkan
            </Button>
          )}
          <button
            type="button"
            disabled={!berubah || update.isPending}
            onClick={() => void simpan()}
            className="inline-flex h-9 items-center justify-center rounded-xl bg-[#0f3d2e] px-5 text-sm font-semibold text-white transition hover:bg-[#1f4d3d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {update.isPending ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      </div>

      {berubah && (
        <p
          role="status"
          className="mt-3 rounded-xl bg-amber-100 px-3.5 py-2.5 text-sm text-amber-800"
        >
          Perubahan belum disimpan. Jarak dan status pelapor di bawah masih
          dihitung dari titik pusat yang tersimpan.
        </p>
      )}

      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-neutral-500">
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-red-600" />
          Titik pusat (pin)
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[#1f8a5f]" />
          Pelapor dalam radius
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full border border-red-600 bg-red-600" />
          Pelapor di luar radius
        </li>
      </ul>
    </section>
  )
}

// ---------------------------------------------------------------------
// Panel 2: tabel lokasi pelapor
// ---------------------------------------------------------------------

function PanelPelapor() {
  const pelapor = useQuery(pelaporLokasiQueryOptions)
  const [filter, setFilter] = useState<FilterStatus>('semua')
  const [cari, setCari] = useState('')
  const [halaman, setHalaman] = useState(0)
  const [perHalaman, setPerHalaman] = useState(10)

  if (pelapor.isPending) {
    return <Skeleton className="h-96 rounded-[26px]" />
  }
  if (pelapor.isError) {
    return (
      <PanelError
        judul="Gagal memuat lokasi pelapor"
        error={pelapor.error}
        onRetry={() => void pelapor.refetch()}
      />
    )
  }

  const { rows, summary } = pelapor.data
  const jumlah: Record<FilterStatus, number> = {
    semua: summary.total,
    outside: summary.outside,
    inside: summary.inside,
    unknown: summary.unknown,
  }

  // Urutan dari backend sudah benar (terjauh dulu, yang belum punya
  // lokasi paling bawah); filter tidak mengubahnya.
  const kata = cari.trim().toLowerCase()
  const hasil = rows
    .filter((r) => filter === 'semua' || r.status === filter)
    .filter(
      (r) => !kata || `${r.name} ${r.nim ?? ''}`.toLowerCase().includes(kata),
    )

  const totalHalaman = Math.max(Math.ceil(hasil.length / perHalaman), 1)
  const halamanEfektif = Math.min(halaman, totalHalaman - 1)
  const tampak = hasil.slice(
    halamanEfektif * perHalaman,
    (halamanEfektif + 1) * perHalaman,
  )

  const pilihFilter = (nilai: FilterStatus) => {
    setFilter(nilai)
    setHalaman(0)
  }
  const ubahCari = (nilai: string) => {
    setCari(nilai)
    setHalaman(0)
  }
  const ubahPerHalaman = (jumlahBaru: number) => {
    setPerHalaman(jumlahBaru)
    setHalaman(0)
  }

  return (
    <>
      <section aria-label="Lokasi pelapor" className={cn('p-4 sm:p-6', CARD)}>
        <h2 className="text-base font-semibold">Lokasi pelapor</h2>
        <p className="text-sm text-neutral-500">
          {summary.outside} dari {summary.total} pelapor berada di luar radius{' '}
          {summary.radius_m.toLocaleString('id-ID')} m.
          {summary.unknown > 0 &&
            ` ${summary.unknown} pelapor belum mengirim lokasi.`}{' '}
          Titik hijau dan merah di peta adalah lokasi terakhir pelapor.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="relative w-full min-w-0 flex-1 basis-full sm:basis-56">
            <span className="sr-only">Cari pelapor</span>
            <Search
              aria-hidden="true"
              className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#8a8f87]"
            />
            <input
              type="search"
              value={cari}
              onChange={(event) => ubahCari(event.target.value)}
              placeholder="Cari nama atau NIM…"
              className="h-10 w-full rounded-xl border-[1.5px] border-[#efe9d8] bg-white pr-3 pl-10 text-sm transition-colors outline-none hover:border-[#d9d2bd] focus-visible:border-[#0f3d2e] focus-visible:ring-2 focus-visible:ring-[#0f3d2e]/20"
            />
          </label>

          <div
            role="group"
            aria-label="Filter status lokasi"
            className="flex flex-wrap gap-2"
          >
            {FILTER.map((f) => {
              const dipilih = filter === f.value
              return (
                <button
                  key={f.value}
                  type="button"
                  aria-pressed={dipilih}
                  onClick={() => pilihFilter(f.value)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#0f3d2e]/25 sm:px-3.5 sm:text-sm',
                    dipilih
                      ? 'border-[#0f3d2e] bg-[#0f3d2e] font-medium text-white'
                      : 'border-[#efe9d8] hover:border-[#d9d2bd] hover:bg-[#faf3e5]',
                  )}
                >
                  {f.label}
                  <span
                    className={cn(
                      'text-xs tabular-nums',
                      dipilih ? 'text-white/70' : 'text-[#8a8f87]',
                    )}
                  >
                    {jumlah[f.value]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-4">
          {hasil.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">
              {rows.length === 0
                ? 'Belum ada pelapor.'
                : 'Tidak ada pelapor yang cocok. Ubah filter atau kata kunci.'}
            </p>
          ) : (
            // Di HP kolom "Terakhir" disembunyikan supaya Jarak dan Status
            // muat tanpa scroll samping. Di layar >= sm tampil semua.
            <div className="overflow-x-auto">
              <table className="w-full text-sm sm:min-w-[560px]">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-[11px] font-semibold tracking-wider text-neutral-500 uppercase sm:text-xs">
                    <th scope="col" className="w-8 py-2.5 pr-2 sm:w-12">
                      No
                    </th>
                    <th scope="col" className="py-2.5 pr-3">
                      Pelapor
                    </th>
                    <th scope="col" className="py-2.5 pr-3 whitespace-nowrap">
                      Jarak
                    </th>
                    <th
                      scope="col"
                      className="hidden py-2.5 pr-3 sm:table-cell"
                    >
                      Terakhir
                    </th>
                    <th scope="col" className="py-2.5">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tampak.map((r, index) => (
                    <tr
                      key={r.id}
                      className="border-b border-neutral-100 align-top last:border-0"
                    >
                      <td className="py-3 pr-2 text-neutral-500 tabular-nums">
                        {halamanEfektif * perHalaman + index + 1}
                      </td>
                      <td className="py-3 pr-3">
                        <span className="block font-medium break-words">
                          {r.name}
                        </span>
                        {r.nim && (
                          <span className="block text-xs text-neutral-500">
                            NIM {r.nim}
                          </span>
                        )}
                        {/* "Terakhir" dipindah ke bawah nama di HP */}
                        {r.last_location_at && (
                          <span
                            title={formatWaktu(r.last_location_at)}
                            className="block text-xs text-neutral-400 sm:hidden"
                          >
                            {waktuRelatif(r.last_location_at)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-3 whitespace-nowrap tabular-nums">
                        {r.distance_m === null
                          ? '–'
                          : `${r.distance_m.toLocaleString('id-ID')} m`}
                      </td>
                      <td className="hidden py-3 pr-3 text-neutral-500 sm:table-cell">
                        {r.last_location_at ? (
                          <span title={formatWaktu(r.last_location_at)}>
                            {waktuRelatif(r.last_location_at)}
                          </span>
                        ) : (
                          '–'
                        )}
                      </td>
                      <td className="py-3">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-1 text-center text-[11px] leading-tight font-semibold sm:px-3 sm:text-xs sm:whitespace-nowrap',
                            STATUS_PILL[r.status],
                          )}
                        >
                          {STATUS_LABEL[r.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {hasil.length > 0 && (
        <VerifikasiPager
          halaman={halamanEfektif}
          totalHalaman={totalHalaman}
          perHalaman={perHalaman}
          onPindah={setHalaman}
          onUbahPerHalaman={ubahPerHalaman}
        />
      )}
    </>
  )
}

function PanelError({
  judul,
  error,
  onRetry,
}: {
  judul: string
  error: unknown
  onRetry: () => void
}) {
  return (
    <Alert variant="destructive">
      <AlertTitle>{judul}</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center gap-3">
        {errorMessage(error)}
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          Coba lagi
        </Button>
      </AlertDescription>
    </Alert>
  )
}
