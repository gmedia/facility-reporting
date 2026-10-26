import { BadgeCheck, Clock, Plus, ShieldCheck, Wrench } from 'lucide-react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  KATEGORI_LABEL,
  STATUS_LABEL,
  STATUS_TONE,
  errorMessage,
  useLaporanList,
  type Laporan,
  type LaporanKategori,
  type LaporanStatus,
} from '@/features/laporan/laporan-query'
import {
  filterAntrian,
  hitungRingkasan,
  laporanPerHari,
  periodeHarian,
  readFilter,
  type AntrianFilter,
} from '@/features/admin/dashboard-utils'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_protected/admin/')({
  // ?filter=menunggu | ?filter=terverifikasi — tab-nya ada di header layout.
  validateSearch: (
    search: Record<string, unknown>,
  ): { filter: AntrianFilter } => ({
    filter: readFilter(search),
  }),
  component: AdminDashboardPage,
})

const BULAN = new Intl.DateTimeFormat('id-ID', {
  month: 'long',
  year: 'numeric',
})

function AdminDashboardPage() {
  const { filter } = Route.useSearch()
  const laporan = useLaporanList()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-xs font-medium tracking-widest text-neutral-400 uppercase">
            Ringkasan laporan fasilitas · Semua gedung
          </p>
        </div>
        <Link
          to="/lapor"
          aria-label="Tambah laporan"
          className="flex size-12 items-center justify-center rounded-2xl bg-[#2f9e78] text-white shadow-sm transition-colors hover:bg-[#278866]"
        >
          <Plus aria-hidden="true" className="size-5" />
        </Link>
      </div>

      {laporan.isPending ? (
        <DashboardSkeleton />
      ) : laporan.isError ? (
        <DashboardError
          error={laporan.error}
          onRetry={() => void laporan.refetch()}
        />
      ) : (
        <DashboardContent laporan={laporan.data} filter={filter} />
      )}
    </div>
  )
}

function DashboardContent({
  laporan,
  filter,
}: {
  laporan: Laporan[]
  filter: AntrianFilter
}) {
  const ringkasan = hitungRingkasan(laporan)
  const antrian = filterAntrian(ringkasan.antrian, filter)
  const harian = laporanPerHari(laporan)
  const maxHarian = Math.max(1, ...harian.map((item) => item.jumlah))

  const cards = [
    {
      label: 'Menunggu',
      value: ringkasan.menunggu,
      Icon: Clock,
    },
    {
      label: 'Terverifikasi',
      value: ringkasan.terverifikasi,
      Icon: BadgeCheck,
    },
    {
      label: 'Diproses',
      value: ringkasan.diproses,
      Icon: Wrench,
    },
    {
      label: 'Selesai',
      value: ringkasan.selesai,
      Icon: ShieldCheck,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {cards.map(({ label, value, Icon }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-2 rounded-2xl bg-[#faf5e9] px-4 py-6"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-white text-[#2f9e78]">
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-sm text-neutral-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Antrian verifikasi</h2>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-400">
                <th className="pb-2 font-medium">ID</th>
                <th className="pb-2 font-medium">Laporan</th>
                <th className="pb-2 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {antrian.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-neutral-400">
                    {emptyText(filter)}
                  </td>
                </tr>
              ) : (
                antrian.map((item) => (
                  <tr key={item.id} className="border-t border-neutral-100">
                    <td className="py-3 pr-4 text-neutral-500">{item.id}</td>
                    <td className="py-3 pr-4">
                      <p className="font-medium">{item.deskripsi}</p>
                      <p className="mt-0.5 text-xs text-neutral-400">
                        {kategoriLabel(item.kategori)} · {item.lokasi}
                      </p>
                    </td>
                    <td className="py-3 text-right">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Prioritas</h2>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              {BULAN.format(new Date())}
            </span>
          </div>

          <div className="my-6 flex justify-center">
            <DonutChart percent={ringkasan.persen.terverifikasi} />
          </div>

          <ProgressStat
            percent={ringkasan.persen.menunggu}
            label="Menunggu verifikasi"
            className="bg-amber-400"
          />
          <div className="mt-4" />
          <ProgressStat
            percent={ringkasan.persen.diproses}
            label="Diproses"
            className="bg-sky-400"
          />
          <div className="mt-4" />
          <ProgressStat
            percent={ringkasan.persen.selesai}
            label="Selesai"
            className="bg-emerald-400"
          />
        </section>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Laporan per hari</h2>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            {periodeHarian(harian)}
          </span>
        </div>
        <div className="mt-8 flex items-end justify-between gap-2 sm:gap-4">
          {harian.map((bar) => (
            <div
              key={bar.ariaLabel}
              className="flex flex-1 flex-col items-center gap-2"
            >
              {bar.sorot && (
                <span className="text-xs font-semibold text-[#2f9e78]">
                  {bar.jumlah}
                </span>
              )}
              <div
                role="img"
                aria-label={`${bar.jumlah} laporan pada ${bar.ariaLabel}`}
                className={cn(
                  'w-full max-w-10 rounded-xl transition-colors',
                  bar.sorot ? 'bg-[#2f9e78]' : 'bg-[#ede2c4]',
                )}
                style={{ height: `${(bar.jumlah / maxHarian) * 9}rem` }}
              />
              <span className="text-xs text-neutral-400">{bar.tanggal}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function kategoriLabel(kategori: string): string {
  return KATEGORI_LABEL[kategori as LaporanKategori] ?? kategori
}

function StatusBadge({ status }: { status: string }) {
  const key = status as LaporanStatus
  const label = STATUS_LABEL[key] ?? status
  const tone =
    STATUS_TONE[key] ?? 'bg-neutral-100 text-neutral-700 ring-neutral-200'

  return (
    <span
      className={cn(
        'inline-block rounded-lg px-3 py-1 text-xs font-medium ring-1',
        tone,
      )}
    >
      {label}
    </span>
  )
}

function emptyText(filter: AntrianFilter): string {
  if (filter === 'menunggu') {
    return 'Belum ada laporan yang menunggu verifikasi.'
  }
  if (filter === 'terverifikasi') {
    return 'Belum ada laporan yang sudah terverifikasi.'
  }
  return 'Belum ada laporan masuk.'
}

function DonutChart({ percent }: { percent: number }) {
  const value = Math.min(100, Math.max(0, percent))
  // Lingkaran donut SVG — circumference 2πr dengan r=60 → 376.99
  const circumference = 2 * Math.PI * 60
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative size-48">
      <svg viewBox="0 0 160 160" className="size-full -rotate-90">
        <circle
          cx="80"
          cy="80"
          r="60"
          fill="none"
          stroke="#f1ead6"
          strokeWidth="14"
        />
        <circle
          cx="80"
          cy="80"
          r="60"
          fill="none"
          stroke="#d9b854"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-bold">{value}%</p>
        <p className="text-sm text-neutral-500">Terverifikasi</p>
      </div>
    </div>
  )
}

function ProgressStat({
  percent,
  label,
  className,
}: {
  percent: number
  label: string
  className: string
}) {
  return (
    <div>
      <p className="text-xl font-bold">{percent} %</p>
      <p className="text-sm text-neutral-500">{label}</p>
      <div className="mt-2 h-1.5 rounded-full bg-neutral-100">
        <div
          className={cn('h-full rounded-full', className)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {['menunggu', 'terverifikasi', 'diproses', 'selesai'].map((key) => (
          <Skeleton key={key} className="h-[158px] rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
      <Skeleton className="h-56 rounded-2xl" />
    </div>
  )
}

function DashboardError({
  error,
  onRetry,
}: {
  error: unknown
  onRetry: () => void
}) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Gagal memuat dashboard</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center gap-3">
        {errorMessage(error)}
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          Coba lagi
        </Button>
      </AlertDescription>
    </Alert>
  )
}
