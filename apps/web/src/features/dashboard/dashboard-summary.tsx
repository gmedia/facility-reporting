import { BadgeCheck, Clock, ShieldCheck, Wrench } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import type { LaporanStatus } from '@/features/laporan/laporan-query'
import type { BarHarian, RingkasanDashboard } from './dashboard-utils'
import { periodeHarian } from './dashboard-utils'
import { cn } from '@/lib/utils'

const BULAN = new Intl.DateTimeFormat('id-ID', {
  month: 'long',
  year: 'numeric',
})

const CHIP =
  'rounded-[10px] bg-emerald-50 px-3.5 py-1 text-sm font-medium text-emerald-800'

// Kartu disamakan dengan dashboard user: putih, border tipis, shadow lembut.
const KARTU = 'rounded-[26px] border border-neutral-200/70 bg-white p-6 shadow-sm'

const KARTU_STAT =
  'flex flex-col items-center gap-2 rounded-[26px] border border-neutral-200/70 bg-white px-4 py-6 text-center shadow-sm'

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
            <span className="flex size-[62px] items-center justify-center rounded-full bg-emerald-50 text-[#1f6b4f]">
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
              'transition hover:-translate-y-0.5 hover:shadow-md',
              activeStatus === status &&
                'ring-2 ring-[#1f6b4f]/35 ring-offset-2 ring-offset-[#f6f7f4]',
            )}
          >
            {content}
          </button>
        )
      })}
    </section>
  )
}

// ------------------------------------------------------------------
// Kartu "Perlu tindakan" (khusus dashboard admin)
// ------------------------------------------------------------------
const PERLU_TINDAKAN = [
  {
    key: 'menunggu',
    filter: 'menunggu',
    judul: 'Menunggu dicek',
    aktif: 'Laporan baru yang belum Anda verifikasi.',
    kosong: 'Tidak ada laporan baru. Bagus!',
    tombol: 'Cek sekarang',
  },
  {
    key: 'terverifikasi',
    filter: 'terverifikasi',
    judul: 'Terverifikasi, belum dikerjakan',
    aktif: 'Sudah valid, tinggal ditindaklanjuti.',
    kosong: 'Semua laporan valid sudah dikerjakan.',
    tombol: 'Lihat daftar',
  },
] as const

export function PerluTindakanCards({
  ringkasan,
}: {
  ringkasan: RingkasanDashboard
}) {
  return (
    <section aria-label="Perlu tindakan" className="grid gap-4 md:grid-cols-2">
      {PERLU_TINDAKAN.map((item) => {
        const jumlah = ringkasan[item.key]
        return (
          <div
            key={item.key}
            className={cn(
              'flex items-center gap-4 rounded-[26px] border px-6 py-5 shadow-sm',
              jumlah > 0
                ? 'border-amber-300 bg-amber-50'
                : 'border-neutral-200/70 bg-white opacity-90',
            )}
          >
            <p className="text-4xl leading-none font-bold">{jumlah}</p>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{item.judul}</p>
              <p className="text-sm text-neutral-500">
                {jumlah > 0 ? item.aktif : item.kosong}
              </p>
            </div>
            {jumlah > 0 && (
              <Link
                to="/verifikasi"
                search={{ filter: item.filter }}
                className="shrink-0 rounded-xl bg-[#1f6b4f] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0f3d2e]"
              >
                {item.tombol}
              </Link>
            )}
          </div>
        )
      })}
    </section>
  )
}

// ------------------------------------------------------------------
// Bar status bertumpuk + legend (khusus dashboard admin)
// ------------------------------------------------------------------
const SEGMEN = [
  { key: 'menunggu', label: 'Menunggu', className: 'bg-amber-400' },
  { key: 'terverifikasi', label: 'Terverifikasi', className: 'bg-emerald-400' },
  { key: 'diproses', label: 'Diproses', className: 'bg-sky-400' },
  { key: 'selesai', label: 'Selesai', className: 'bg-neutral-400' },
  { key: 'ditolak', label: 'Ditolak', className: 'bg-red-400' },
] as const

export function StatusBarCard({
  ringkasan,
}: {
  ringkasan: RingkasanDashboard
}) {
  const { total } = ringkasan

  return (
    <section className={KARTU}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          {ringkasan.diproses} dari {total} laporan sedang dikerjakan
        </h2>
        <span className={CHIP}>Semua laporan</span>
      </div>

      <div
        role="img"
        aria-label="Sebaran status laporan"
        className="mt-4 flex h-4 overflow-hidden rounded-full bg-neutral-100"
      >
        {SEGMEN.map(({ key, className }) =>
          ringkasan[key] > 0 ? (
            <div
              key={key}
              className={className}
              style={{ width: `${(ringkasan[key] / total) * 100}%` }}
            />
          ) : null,
        )}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {SEGMEN.map(({ key, label, className }) => (
          <li key={key} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={cn('size-2.5 rounded-full', className)}
            />
            {label} <b>{ringkasan[key]}</b>
          </li>
        ))}
      </ul>
    </section>
  )
}

// Masih dipertahankan kalau dipakai halaman lain (mis. dashboard user).
export function PrioritasCard({
  ringkasan,
}: {
  ringkasan: RingkasanDashboard
}) {
  return (
    <section className={KARTU}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Progres laporan</h2>
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
  const total = harian.reduce((acc, item) => acc + item.jumlah, 0)
  const puncak = harian.reduce<BarHarian | null>(
    (acc, item) => (!acc || item.jumlah > acc.jumlah ? item : acc),
    null,
  )

  return (
    <section className={KARTU}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Laporan per hari</h2>
        <span className={CHIP}>{periodeHarian(harian)}</span>
      </div>
      <p className="mt-2 text-sm text-neutral-500">
        {total === 0 || !puncak
          ? 'Belum ada laporan dalam 7 hari terakhir.'
          : `${total} laporan dalam 7 hari. Paling ramai ${puncak.ariaLabel} dengan ${puncak.jumlah} laporan.`}
      </p>
      <div className="mt-6 flex items-end justify-between gap-2 sm:gap-4">
        {harian.map((bar) => (
          <div
            key={bar.ariaLabel}
            className="group flex flex-1 flex-col items-center gap-2"
          >
            <span
              className={cn(
                'text-xs font-semibold text-emerald-800 transition-opacity',
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
                  ? 'bg-[#0f3d2e]'
                  : 'bg-emerald-100 group-hover:bg-emerald-300',
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
          stroke="#e8ece6"
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