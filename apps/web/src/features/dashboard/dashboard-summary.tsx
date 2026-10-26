import { BadgeCheck, Clock, ShieldCheck, Wrench } from 'lucide-react'
import type { LaporanStatus } from '@/features/laporan/laporan-query'
import type { BarHarian, RingkasanDashboard } from './dashboard-utils'
import { periodeHarian } from './dashboard-utils'
import { cn } from '@/lib/utils'

const BULAN = new Intl.DateTimeFormat('id-ID', {
  month: 'long',
  year: 'numeric',
})

const CHIP =
  'rounded-[10px] bg-[#e0f1e8] px-3.5 py-1 text-sm font-medium text-[#2f8059]'

const KARTU = 'rounded-[26px] border-[1.5px] border-[#efe9d8] bg-white p-6'

const KARTU_STAT =
  'flex flex-col items-center gap-2 rounded-[26px] bg-[#faf3e5] px-4 py-6 text-center'

type StatStatus = Extract<
  LaporanStatus,
  'menunggu_verifikasi' | 'valid' | 'diproses' | 'selesai'
>

const STATS: ReadonlyArray<{
  status: StatStatus
  label: string
  key: keyof Pick<
    RingkasanDashboard,
    'menunggu' | 'terverifikasi' | 'diproses' | 'selesai'
  >
  Icon: typeof Clock
}> = [
  {
    status: 'menunggu_verifikasi',
    label: 'Menunggu',
    key: 'menunggu',
    Icon: Clock,
  },
  {
    status: 'valid',
    label: 'Terverifikasi',
    key: 'terverifikasi',
    Icon: BadgeCheck,
  },
  { status: 'diproses', label: 'Diproses', key: 'diproses', Icon: Wrench },
  { status: 'selesai', label: 'Selesai', key: 'selesai', Icon: ShieldCheck },
]

export function RingkasanCards({
  ringkasan,
  activeStatus,
  onSelect,
}: {
  ringkasan: RingkasanDashboard
  activeStatus?: LaporanStatus
  onSelect?: (status: StatStatus) => void
}) {
  return (
    <section
      aria-label="Ringkasan laporan"
      className="grid grid-cols-2 gap-4 xl:grid-cols-4"
    >
      {STATS.map(({ status, label, key, Icon }) => {
        const content = (
          <>
            <span className="flex size-[62px] items-center justify-center rounded-full bg-white text-[#3b9b6b]">
              <Icon aria-hidden="true" className="size-6" />
            </span>
            <p className="text-3xl font-bold">{ringkasan[key]}</p>
            <p className="text-base text-neutral-600">{label}</p>
          </>
        )

        if (!onSelect) {
          return (
            <div key={status} className={KARTU_STAT}>
              {content}
            </div>
          )
        }

        return (
          <button
            key={status}
            type="button"
            aria-pressed={activeStatus === status}
            onClick={() => onSelect(status)}
            className={cn(
              KARTU_STAT,
              'transition hover:-translate-y-0.5 hover:shadow-sm',
              activeStatus === status &&
                'ring-2 ring-[#3b9b6b]/35 ring-offset-2 ring-offset-white',
            )}
          >
            {content}
          </button>
        )
      })}
    </section>
  )
}

export function PrioritasCard({
  ringkasan,
}: {
  ringkasan: RingkasanDashboard
}) {
  return (
    <section className={KARTU}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Prioritas</h2>
        <span className={CHIP}>{BULAN.format(new Date())}</span>
      </div>

      <div className="my-5 flex justify-center">
        <DonutChart percent={ringkasan.persen.terverifikasi} />
      </div>

      <ProgressStat
        percent={ringkasan.persen.menunggu}
        label="Menunggu verifikasi"
        className="bg-amber-400"
      />
      <div className="mt-3" />
      <ProgressStat
        percent={ringkasan.persen.diproses}
        label="Diproses"
        className="bg-sky-400"
      />
      <div className="mt-3" />
      <ProgressStat
        percent={ringkasan.persen.selesai}
        label="Selesai"
        className="bg-emerald-400"
      />
    </section>
  )
}

export function LaporanHarianCard({ harian }: { harian: BarHarian[] }) {
  const maxHarian = Math.max(1, ...harian.map((item) => item.jumlah))

  return (
    <section className={KARTU}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Laporan per hari</h2>
        <span className={CHIP}>{periodeHarian(harian)}</span>
      </div>
      <div className="mt-8 flex items-end justify-between gap-2 sm:gap-4">
        {harian.map((bar) => (
          <div
            key={bar.ariaLabel}
            className="group flex flex-1 flex-col items-center gap-2"
          >
            <span
              className={cn(
                'text-xs font-semibold text-[#2f8059] transition-opacity',
                bar.sorot ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
              )}
            >
              {bar.jumlah}
            </span>
            <div
              role="img"
              aria-label={`${bar.jumlah} laporan pada ${bar.ariaLabel}`}
              className={cn(
                'w-full max-w-10 rounded-xl transition-colors sm:max-w-9',
                bar.sorot
                  ? 'bg-[#3b9b6b]'
                  : 'bg-[#ede2c4] group-hover:bg-[#dfc787]',
              )}
              style={{ height: `${(bar.jumlah / maxHarian) * 9}rem` }}
            />
            <span className="text-sm text-neutral-400">{bar.tanggal}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function DonutChart({ percent }: { percent: number }) {
  const value = Math.min(100, Math.max(0, percent))
  const circumference = 2 * Math.PI * 60
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative size-52">
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
        <p className="text-4xl font-bold">{value}%</p>
        <p className="text-base text-neutral-500">Terverifikasi</p>
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
