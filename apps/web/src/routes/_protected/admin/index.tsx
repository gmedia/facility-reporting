import { AlertTriangle, BadgeCheck, Clock, Wrench } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'
import {
  antrianVerifikasi,
  laporanPerHari,
  periodeHarian,
  prioritas,
  readFilter,
  statCards,
  type AntrianFilter,
  type LaporanStatus,
} from '@/features/admin/dashboard-data'
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

const statusStyle: Record<LaporanStatus, string> = {
  menunggu: 'bg-amber-100 text-amber-700',
  terverifikasi: 'bg-sky-100 text-sky-700',
}

const statusLabel: Record<LaporanStatus, string> = {
  menunggu: 'Menunggu',
  terverifikasi: 'Terverifikasi',
}

function AdminDashboardPage() {
  const { filter } = Route.useSearch()

  const antrian =
    filter === 'semua'
      ? antrianVerifikasi
      : antrianVerifikasi.filter((row) => row.status === filter)

  return (
    <div className="flex flex-col gap-6">
      {/* Judul + tombol tambah */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-xs font-medium tracking-widest text-neutral-400 uppercase">
            Ringkasan laporan fasilitas · Semua gedung
          </p>
        </div>
        <button
          type="button"
          aria-label="Tambah laporan"
          className="flex size-12 items-center justify-center rounded-2xl bg-[#2f9e78] text-white shadow-sm transition-colors hover:bg-[#278866]"
        >
          <span aria-hidden="true" className="text-xl leading-none">
            +
          </span>
        </button>
      </div>

      {/* Kartu statistik */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="flex flex-col items-center gap-2 rounded-2xl bg-[#faf5e9] px-4 py-6"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-white text-[#2f9e78]">
              <StatIcon name={card.icon} />
            </span>
            <p className="text-3xl font-bold">{card.value}</p>
            <p className="text-sm text-neutral-500">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Antrian + prioritas */}
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
                    Belum ada laporan pada filter ini.
                  </td>
                </tr>
              ) : (
                antrian.map((row) => (
                  <tr key={row.id} className="border-t border-neutral-100">
                    <td className="py-3 pr-4 text-neutral-500">{row.id}</td>
                    <td className="py-3 pr-4 font-medium">{row.laporan}</td>
                    <td className="py-3 text-right">
                      <span
                        className={cn(
                          'inline-block rounded-lg px-3 py-1 text-xs font-medium',
                          statusStyle[row.status],
                        )}
                      >
                        {statusLabel[row.status]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Prioritas</h2>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              {prioritas.bulan}
            </span>
          </div>

          <div className="my-6 flex justify-center">
            <DonutChart percent={prioritas.terverifikasiPersen} />
          </div>

          <ProgressStat
            percent={prioritas.bahayaTinggiPersen}
            label="Bahaya tinggi"
            className="bg-rose-400"
          />
          <div className="mt-4" />
          <ProgressStat
            percent={prioritas.tindakLanjutPersen}
            label="Perlu tindak lanjut"
            className="bg-sky-400"
          />
        </section>
      </div>

      {/* Laporan per hari */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Laporan per hari</h2>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            {periodeHarian}
          </span>
        </div>
        <div className="mt-8 flex items-end justify-between gap-2 sm:gap-4">
          {laporanPerHari.map((bar) => {
            const max = Math.max(...laporanPerHari.map((item) => item.jumlah))
            return (
              <div
                key={bar.tanggal}
                className="flex flex-1 flex-col items-center gap-2"
              >
                {bar.sorot && (
                  <span className="text-xs font-semibold text-[#2f9e78]">
                    {bar.jumlah}
                  </span>
                )}
                <div
                  role="img"
                  aria-label={`${bar.jumlah} laporan pada 0${bar.tanggal}`}
                  className={cn(
                    'w-full max-w-10 rounded-xl transition-colors',
                    bar.sorot ? 'bg-[#2f9e78]' : 'bg-[#ede2c4]',
                  )}
                  style={{ height: `${(bar.jumlah / max) * 9}rem` }}
                />
                <span className="text-xs text-neutral-400">{bar.tanggal}</span>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function StatIcon({ name }: { name: string }) {
  if (name === 'check')
    return <BadgeCheck aria-hidden="true" className="size-5" />
  if (name === 'alert')
    return <AlertTriangle aria-hidden="true" className="size-5" />
  if (name === 'wrench') return <Wrench aria-hidden="true" className="size-5" />
  return <Clock aria-hidden="true" className="size-5" />
}

function DonutChart({ percent }: { percent: number }) {
  // Lingkaran donut SVG — circumference 2πr dengan r=60 → 376.99
  const circumference = 2 * Math.PI * 60
  const offset = circumference - (percent / 100) * circumference

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
        <p className="text-3xl font-bold">{percent}%</p>
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
