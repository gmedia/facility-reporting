import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Clock, Plus, ShieldCheck } from 'lucide-react'
import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AdminShell } from '@/features/admin/admin-shell'
import { VerifikasiTabs } from '@/features/verifikasi/verifikasi-tabs'
import {
  badgeFor,
  filterLaporan,
  formatWaktu,
  hitungStat,
  kategoriLabel,
  laporanErrorStatus,
  laporanErrorMessage,
  laporanPerHari,
  laporanQueryOptions,
  readVerifikasiFilter,
  sortAntrian,
  type Laporan,
  type VerifikasiFilter,
} from '@/features/verifikasi/verifikasi-query'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_protected/verifikasi')({
  // Guard: admin ATAU super_admin — ngikutin middleware `admin` di backend
  // (EnsureUserIsAdmin). Role user biasa dilempar ke /dashboard.
  // JANGAN digabung ke guard /admin (super_admin saja) — nanti admin biasa
  // gak bisa buka antrian.
  beforeLoad: ({ context }) => {
    const role = context.user.role
    if (role !== 'admin' && role !== 'super_admin') {
      throw redirect({ to: '/dashboard' })
    }
  },
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    filter: VerifikasiFilter
  } => ({ filter: readVerifikasiFilter(search) }),
  component: VerifikasiPage,
})

function VerifikasiPage() {
  const { user } = Route.useRouteContext()
  const { filter } = Route.useSearch()
  const laporan = useQuery(laporanQueryOptions)

  return (
    <AdminShell user={user} header={<VerifikasiTabs />}>
      {laporan.isPending ? (
        <LoadingState />
      ) : laporan.isError ? (
        <ErrorState error={laporan.error} onRetry={() => laporan.refetch()} />
      ) : (
        <VerifikasiContent filter={filter} laporans={laporan.data} />
      )}
    </AdminShell>
  )
}

function VerifikasiContent({
  filter,
  laporans,
}: {
  filter: VerifikasiFilter
  laporans: Laporan[]
}) {
  const stat = hitungStat(laporans)
  const antrian = sortAntrian(filterLaporan(laporans, filter))

  return (
    <div className="flex flex-col gap-6">
      {/* Judul + tombol tambah */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Verifikasi</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Antrian laporan, semua gedung
          </p>
        </div>
        <Button
          type="button"
          onClick={() => toast.info('Form laporan baru belum tersedia')}
          className="h-12 gap-2 rounded-2xl bg-[#3b9b6b] px-5 text-white hover:bg-[#2f8059]"
        >
          <Plus aria-hidden="true" className="size-4" />
          Laporan baru
        </Button>
      </div>

      {/* Kartu statistik — diklik buat ganti filter */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Menunggu"
          value={stat.menunggu}
          filter="menunggu"
          icon={<Clock aria-hidden="true" className="size-6" />}
          active={filter === 'menunggu'}
        />
        <StatCard
          label="Terverifikasi"
          value={stat.terverifikasi}
          filter="terverifikasi"
          icon={<ShieldCheck aria-hidden="true" className="size-6" />}
          active={filter === 'terverifikasi'}
        />
        <StatCard
          label="Prioritas tinggi"
          value={PRIORITAS_TINGGI_DEMO}
          filter="semua"
          icon={<AlertTriangle aria-hidden="true" className="size-6" />}
          active={false}
        />
        <StatCard
          label="Selesai"
          value={stat.selesai}
          filter="semua"
          icon={<ShieldCheck aria-hidden="true" className="size-6" />}
          active={false}
        />
      </div>

      {/* Antrian + prioritas */}
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <section className="rounded-[26px] border-[1.5px] border-[#efe9d8] bg-white p-6">
          <h2 className="text-lg font-semibold">Antrian verifikasi</h2>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-400">
                  <th className="pb-2 font-medium">ID</th>
                  <th className="pb-2 font-medium">Laporan</th>
                  <th className="hidden pb-2 font-medium sm:table-cell">
                    Kategori
                  </th>
                  <th className="hidden pb-2 font-medium md:table-cell">
                    Lokasi
                  </th>
                  <th className="hidden pb-2 font-medium lg:table-cell">
                    Waktu
                  </th>
                  <th className="pb-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {antrian.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-neutral-400"
                    >
                      {emptyText(filter)}
                    </td>
                  </tr>
                ) : (
                  antrian.map((row) => {
                    const badge = badgeFor(row.status)
                    return (
                      <tr
                        key={row.id}
                        className={cn(
                          'border-t border-neutral-100',
                          row.status === 'menunggu_verifikasi' &&
                            'bg-[#fdf8ee]',
                        )}
                      >
                        <td className="py-3 pr-4 text-neutral-500">{row.id}</td>
                        <td className="py-3 pr-4">
                          <p className="font-medium">{row.deskripsi}</p>
                          <p className="mt-0.5 text-xs text-neutral-400 sm:hidden">
                            {kategoriLabel[row.kategori] ?? row.kategori} ·{' '}
                            {row.lokasi} · {formatWaktu(row.created_at)}
                          </p>
                        </td>
                        <td className="hidden py-3 pr-4 sm:table-cell">
                          {kategoriLabel[row.kategori] ?? row.kategori}
                        </td>
                        <td className="hidden py-3 pr-4 md:table-cell">
                          {row.lokasi}
                        </td>
                        <td className="hidden py-3 pr-4 text-neutral-500 lg:table-cell">
                          {formatWaktu(row.created_at)}
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={cn(
                              'inline-block rounded-lg px-3 py-1 text-xs font-medium',
                              badge.className,
                            )}
                          >
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <PrioritasCard persen={stat.terverifikasiPersen} />
      </div>

      <HarianCard laporans={laporans} />
    </div>
  )
}

function emptyText(filter: VerifikasiFilter): string {
  if (filter === 'menunggu') return 'Belum ada laporan menunggu verifikasi.'
  if (filter === 'terverifikasi') return 'Belum ada laporan terverifikasi.'
  return 'Belum ada laporan masuk.'
}

// Angka "Prioritas tinggi" butuh skor SAW — endpoint-nya belum ada
// (sprint /prioritas 18 Nov). Sementara tampil angka demo.
const PRIORITAS_TINGGI_DEMO = 5
const BAHAYA_TINGGI_DEMO = 38
const TINDAK_LANJUT_DEMO = 15

function StatCard({
  label,
  value,
  filter,
  icon,
  active,
}: {
  label: string
  value: number
  filter: VerifikasiFilter
  icon: React.ReactNode
  active: boolean
}) {
  const display = useCountUp(value)

  return (
    <Link
      to="/verifikasi"
      search={{ filter }}
      resetScroll={false}
      className={cn(
        'flex flex-col items-center gap-2 rounded-[26px] border-[1.5px] bg-[#faf3e5] px-4 py-6 text-center transition-transform hover:-translate-y-0.5',
        active ? 'border-[#dfc787]' : 'border-transparent',
      )}
    >
      <span className="flex size-[62px] items-center justify-center rounded-full bg-white text-[#3b9b6b]">
        {icon}
      </span>
      <p className="text-3xl font-bold">{display}</p>
      <p className="text-base text-neutral-600">{label}</p>
    </Link>
  )
}

function PrioritasCard({ persen }: { persen: number }) {
  const circumference = 2 * Math.PI * 52
  const [shown, setShown] = useState(0)

  // Animasi mulai setelah paint pertama biar transisi CSS keburu jalan.
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(persen))
    return () => cancelAnimationFrame(id)
  }, [persen])

  return (
    <section className="rounded-[26px] border-[1.5px] border-[#efe9d8] bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Prioritas</h2>
        <span className="rounded-[10px] bg-[#e0f1e8] px-3.5 py-1 text-sm font-medium text-[#2f8059]">
          Okt 2026
        </span>
      </div>

      <div className="relative my-4 flex justify-center">
        <svg viewBox="0 0 120 120" className="size-[220px] -rotate-90">
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="#efe9d8"
            strokeWidth="12"
          />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="#dfc787"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (shown / 100) * circumference}
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-4xl font-bold">{persen}%</p>
          <p className="text-base text-neutral-500">Terverifikasi</p>
        </div>
      </div>

      {/* Dua bar ini dari skor SAW — endpoint-nya belum ada (18 Nov). */}
      <ProgressStat
        percent={BAHAYA_TINGGI_DEMO}
        label="Bahaya tinggi"
        trackClassName="bg-[#f7dde5]"
        barClassName="bg-[#e58aa5]"
      />
      <div className="mt-4" />
      <ProgressStat
        percent={TINDAK_LANJUT_DEMO}
        label="Perlu tindak lanjut"
        trackClassName="bg-[#dcedf6]"
        barClassName="bg-[#6ab4d6]"
      />
    </section>
  )
}

function ProgressStat({
  percent,
  label,
  trackClassName,
  barClassName,
}: {
  percent: number
  label: string
  trackClassName: string
  barClassName: string
}) {
  const [shown, setShown] = useState(0)

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(percent))
    return () => cancelAnimationFrame(id)
  }, [percent])

  return (
    <div>
      <p className="text-xl font-bold">{percent} %</p>
      <p className="text-sm text-neutral-500">{label}</p>
      <div className={cn('mt-2 h-1.5 rounded-full', trackClassName)}>
        <div
          className={cn('h-full rounded-full', barClassName)}
          style={{ width: `${shown}%`, transition: 'width .8s ease' }}
        />
      </div>
    </div>
  )
}

function HarianCard({ laporans }: { laporans: Laporan[] }) {
  const harian = laporanPerHari(laporans)
  const [selected, setSelected] = useState<number | null>(null)
  const max = Math.max(1, ...harian.map((bar) => bar.jumlah))
  const first = harian[0]
  const last = harian[harian.length - 1]
  const periodeHarian =
    first && last ? `${first.tanggal} – ${last.tanggal}` : null

  return (
    <section className="rounded-[26px] border-[1.5px] border-[#efe9d8] bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Laporan per hari</h2>
        {periodeHarian && (
          <span className="rounded-[10px] bg-[#e0f1e8] px-3.5 py-1 text-sm font-medium text-[#2f8059]">
            {periodeHarian}
          </span>
        )}
      </div>

      {harian.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-400">
          Belum ada laporan dengan tanggal tercatat.
        </p>
      ) : (
        <div className="mt-6 flex h-[190px] items-end justify-between gap-2">
          {harian.map((bar, index) => (
            <button
              key={bar.tanggal}
              type="button"
              onClick={() => setSelected(index)}
              aria-pressed={selected === index}
              className="flex flex-1 flex-col items-center gap-1.5"
            >
              <span
                className={cn(
                  'text-sm font-semibold text-[#3b9b6b] transition-opacity',
                  selected === index ? 'opacity-100' : 'opacity-0',
                )}
              >
                {bar.jumlah}
              </span>
              <div
                className={cn(
                  'w-full max-w-9 rounded-[9px] transition-colors',
                  selected === index
                    ? 'bg-[#3b9b6b]'
                    : 'bg-[#f0e2b8] hover:bg-[#dfc787]',
                )}
                style={{ height: `${(bar.jumlah / max) * 135}px` }}
              />
              <span className="text-sm text-neutral-500">{bar.tanggal}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-9 w-40" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-40 rounded-[26px]" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-72 rounded-[26px]" />
        <Skeleton className="h-72 rounded-[26px]" />
      </div>
      <Skeleton className="h-64 rounded-[26px]" />
    </div>
  )
}

function ErrorState({
  error,
  onRetry,
}: {
  error: unknown
  onRetry: () => void
}) {
  const status = laporanErrorStatus(error)

  if (status === 401) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Sesi berakhir</AlertTitle>
        <AlertDescription>
          Silakan login ulang untuk melihat antrian verifikasi.{' '}
          <a href="/login">Ke halaman login</a>
        </AlertDescription>
      </Alert>
    )
  }

  if (status === 403) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Akses ditolak</AlertTitle>
        <AlertDescription>
          Hanya admin dan super admin yang boleh membuka halaman ini.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert variant="destructive">
      <AlertTitle>Gagal memuat laporan</AlertTitle>
      <AlertDescription className="flex items-center gap-3">
        <span>{laporanErrorMessage(error)}</span>
        <Button type="button" size="sm" variant="outline" onClick={onRetry}>
          Coba lagi
        </Button>
      </AlertDescription>
    </Alert>
  )
}

// Angka naik dari 0 ke nilai akhir biar kayak mock. Hormati prefers-reduced-motion
// supaya gak bikin pusing — dan biar test deterministik.
// Kalau reduced-motion, angka langsung nilai akhir tanpa animasi (gak perlu state).
function useCountUp(target: number): number {
  const reduced = prefersReducedMotion()
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (reduced) return

    let step = 0
    const total = 20
    const id = setInterval(() => {
      step += 1
      setValue(Math.round((target * step) / total))
      if (step >= total) clearInterval(id)
    }, 30)

    return () => clearInterval(id)
  }, [target, reduced])

  return reduced ? target : value
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}
