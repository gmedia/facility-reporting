import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { DashboardShell } from '@/features/dashboard/dashboard-shell'
import {
  RingkasanCards,
  LaporanHarianCard,
} from '@/features/dashboard/dashboard-summary'
import {
  hitungRingkasan,
  laporanPerHari,
  periodeHarian,
} from '@/features/dashboard/dashboard-utils'
import {
  useLaporanList,
  type Laporan,
} from '@/features/laporan/laporan-query'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_protected/admin/statistik')({
  component: StatistikPage,
})

// Palet ngikutin halaman user & dashboard pengelola: sidebar #0d3f31,
// area #f5f7f6, kartu putih border netral, aksen #0d3f31 / #e6f2ec.
const CARD = 'rounded-[26px] border-[1.5px] border-black/5 bg-white p-6'

function StatistikPage() {
  const list = useLaporanList()

  if (list.isPending) {
    return (
      <DashboardShell
        user={Route.useRouteContext().user}
        header={
          <p className="text-xs font-medium tracking-widest text-neutral-400 uppercase">
            Admin / Statistik
          </p>
        }
      >
        <div className="flex flex-col gap-6 p-6">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonStatCard key={i} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-6 xl:grid-cols-4">
            <SkeletonCard className="h-72" />
            <SkeletonCard className="h-72" />
            <SkeletonCard className="h-72" />
            <SkeletonCard className="h-72" />
          </div>
        </div>
      </DashboardShell>
    )
  }

  if (list.isError) {
    return (
      <DashboardShell
        user={Route.useRouteContext().user}
        header={
          <p className="text-xs font-medium tracking-widest text-neutral-400 uppercase">
            Admin / Statistik
          </p>
        }
      >
        <div className="flex flex-col gap-6 p-6">
          <div className="flex items-center gap-2 p-4 rounded-[26px] bg-red-50 border border-red-100">
            <span className="text-red-600 font-medium">Gagal memuat data</span>
            <span className="text-sm text-red-500">{list.error?.message ?? ''}</span>
          </div>
        </div>
      </DashboardShell>
    )
  }

  const laporan = list.data
  const ringkasan = hitungRingkasan(laporan)
  const harian = laporanPerHari(laporan)

  return (
    <DashboardShell
      user={Route.useRouteContext().user}
      header={
        <p className="text-xs font-medium tracking-widest text-neutral-400 uppercase">
          Admin / Statistik
        </p>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[32px] leading-tight font-bold tracking-tight text-neutral-900">
              Statistik
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Ringkasan dan grafik semua gedung
            </p>
          </div>
        </div>

        {/* Ringkasan kartu statistik */}
        <RingkasanCards
          ringkasan={ringkasan}
          activeStatus={undefined}
          onSelect={undefined}
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Grafik laporan per hari */}
          <LaporanHarianCard harian={harian} />

          {/* Ringkasan per kategori */}
          <KategoriRingkasanCard laporan={laporan} />
        </div>
      </div>
    </DashboardShell>
  )
}

function SkeletonStatCard() {
  return (
    <div className={KARTU_STAT}>
      <div className="flex size-[62px] items-center justify-center rounded-full bg-white text-[#0d3f31]">
        <div className="flex size-6 items-center justify-center rounded-full bg-[#0d3f31]/10">
          <Skeleton className="size-4" />
        </div>
      </div>
      <p className="text-3xl font-bold">
        <Skeleton className="h-8 w-24" />
      </p>
      <p className="text-base text-neutral-600">
        <Skeleton className="h-5 w-32" />
      </p>
    </div>
  )
}

function SkeletonCard({ className }: { className: string }) {
  return (
    <div className={cn(CARD, className, 'flex flex-col gap-4')}>
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-3/4" />
      <Skeleton className="h-9 w-2/3" />
    </div>
  )
}

const KARTU_STAT =
  'flex flex-col items-center gap-2 rounded-[26px] bg-[#eef1f0] px-4 py-6 text-center'

function KategoriRingkasanCard({
  laporan,
}: {
  laporan: Laporan[]
}) {
  const kategoriCount: Record<string, number> = {}
  laporan.forEach((item) => {
    kategoriCount[item.kategori] = (kategoriCount[item.kategori] ?? 0) + 1
  })

  const total = laporan.length

  return (
    <section className={CARD}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Ringkasan per Kategori</h2>
      </div>
      <div className="mt-4 space-y-3">
        {Object.entries(kategoriCount).map(([kategori, jumlah]) => {
          const persen = total === 0 ? 0 : Math.round((jumlah / total) * 100)
          return (
            <div
              key={kategori}
              className="flex items-center justify-between gap-3"
            >
              <span className="text-sm text-neutral-600 capitalize">
                {kategori}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full bg-[#0d3f31]"
                  style={{ width: `${persen}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-neutral-900">
                {jumlah} ({persen}%)
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}