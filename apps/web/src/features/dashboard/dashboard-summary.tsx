import { useState } from 'react'
import {
  BadgeCheck,
  ClipboardList,
  Clock,
  ShieldCheck,
  Wrench,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import type { LaporanStatus } from '@/features/laporan/laporan-query'
import type {
  BarBulanan,
  BarHarian,
  RingkasanDashboard,
} from './dashboard-utils'
import { periodeBulanan, periodeHarian } from './dashboard-utils'
import { cn } from '@/lib/utils'

const BULAN = new Intl.DateTimeFormat('id-ID', {
  month: 'long',
  year: 'numeric',
})

const CHIP =
  'rounded-[10px] bg-emerald-50 px-3.5 py-1 text-sm font-medium text-emerald-800'

// Kartu disamakan dengan dashboard user: putih, border tipis, shadow lembut.
const KARTU =
  'rounded-[26px] border border-neutral-200/70 bg-white p-6 shadow-sm'

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

// ------------------------------------------------------------------
// Grafik "Laporan per hari / per bulan" (garis + area, 7 titik terakhir)
// ------------------------------------------------------------------

// Ukuran kanvas grafik (viewBox). Tinggi tampil diatur CSS (h-24), garis
// ikut melebar karena preserveAspectRatio="none"; titiknya HTML biasa
// supaya tetap bulat.
const LEBAR = 700
const TINGGI = 96
const ATAS = 34 // y titik tertinggi, menyisakan ruang buat tooltip
const DASAR = 84 // y garis dasar (nol laporan)

type Titik = { x: number; y: number }

// Kurva halus tanpa overshoot: tiap segmen melengkung S antar dua titik.
function buatGaris(titik: Titik[]): string {
  let d = ''
  let prev: Titik | null = null
  for (const t of titik) {
    if (!prev) {
      d = `M${t.x} ${t.y}`
    } else {
      const m = (prev.x + t.x) / 2
      d += ` C${m} ${prev.y} ${m} ${t.y} ${t.x} ${t.y}`
    }
    prev = t
  }
  return d
}

// Dua kolom terkiri/terkanan tooltipnya ditempelkan ke tepi supaya tidak
// terpotong keluar kartu.
function posisiTooltip(i: number, n: number): string {
  if (i < 2) return 'left-0'
  if (i >= n - 2) return 'right-0'
  return 'left-1/2 -translate-x-1/2'
}

type ModeGrafik = 'harian' | 'bulanan'

// Bentuk seragam supaya satu grafik bisa menggambar data harian maupun
// bulanan.
type TitikGrafik = {
  key: string
  label: string // "Sab" / "Mei"
  sub: string // "14" / "05"
  tooltip: string
  aria: string
  jumlah: number
  sorot: boolean
}

export function LaporanHarianCard({
  harian,
  bulanan,
  terpilih = null,
  onPilih,
}: {
  harian: BarHarian[]
  // Opsional. Kalau diisi, muncul tombol Harian / Bulanan.
  bulanan?: BarBulanan[]
  // Indeks hari yang sedang dipilih (opsional, buat filter).
  terpilih?: number | null
  // Kalau diisi, titik bisa diklik. Hanya aktif di mode Harian.
  onPilih?: (indeks: number | null) => void
}) {
  const [mode, setMode] = useState<ModeGrafik>('harian')
  const modeAktif: ModeGrafik = bulanan ? mode : 'harian'
  const harianMode = modeAktif === 'harian'

  const titik: TitikGrafik[] = harianMode
    ? harian.map((b) => ({
        key: b.ariaLabel,
        label: b.hari,
        sub: String(b.tanggal),
        tooltip: `${b.hari}, ${b.tanggal} ${b.bulan} · ${b.jumlah} laporan`,
        aria: `${b.jumlah} laporan pada ${b.ariaLabel}`,
        jumlah: b.jumlah,
        sorot: b.sorot,
      }))
    : (bulanan ?? []).map((b) => ({
        key: b.ariaLabel,
        label: b.label,
        sub: String(b.bulan).padStart(2, '0'),
        tooltip: `${b.ariaLabel} · ${b.jumlah} laporan`,
        aria: `${b.jumlah} laporan pada ${b.ariaLabel}`,
        jumlah: b.jumlah,
        sorot: b.sorot,
      }))

  const judul = harianMode ? 'Laporan per hari' : 'Laporan per bulan'
  const rentang = harianMode ? '7 hari terakhir' : '7 bulan terakhir'
  const periode = harianMode
    ? periodeHarian(harian)
    : periodeBulanan(bulanan ?? [])
  const labelSorot = harianMode ? 'Hari ini' : 'Bulan ini'
  // Klik titik (filter tanggal) hanya masuk akal di mode Harian.
  const bisaPilih = harianMode && !!onPilih

  const n = titik.length
  const total = titik.reduce((acc, item) => acc + item.jumlah, 0)
  const maks = Math.max(1, ...titik.map((item) => item.jumlah))

  const data = titik.map((t, i) => ({
    t,
    x: ((i + 0.5) / n) * LEBAR,
    y: DASAR - (t.jumlah / maks) * (DASAR - ATAS),
  }))
  const garis = buatGaris(data)
  const pertama = data[0]
  const terakhir = data[data.length - 1]
  const area =
    pertama && terakhir
      ? `${garis} L${terakhir.x} ${DASAR} L${pertama.x} ${DASAR} Z`
      : ''

  return (
    <section className={cn(KARTU, 'py-4')}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{judul}</h2>

        <div className="flex items-center gap-2">
          {bulanan && (
            <div
              role="tablist"
              aria-label="Rentang laporan"
              className="inline-flex rounded-full bg-neutral-100 p-[3px]"
            >
              {(['harian', 'bulanan'] as const).map((m) => {
                const aktif = modeAktif === m
                return (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={aktif}
                    onClick={() => setMode(m)}
                    className={cn(
                      'rounded-full px-3.5 py-1 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#1f6b4f]/35',
                      aktif
                        ? 'bg-[#0f3d2e] font-medium text-white'
                        : 'text-neutral-500 hover:text-neutral-800',
                    )}
                  >
                    {m === 'harian' ? 'Harian' : 'Bulanan'}
                  </button>
                )
              })}
            </div>
          )}
          <span className={CHIP}>{periode}</span>
        </div>
      </div>

      {total === 0 || n === 0 ? (
        <p className="py-3 text-sm text-neutral-500">
          Belum ada laporan dalam {rentang}.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-2 sm:mt-6 sm:flex-row sm:items-end sm:gap-7">
          <div className="flex shrink-0 items-baseline gap-2 sm:block sm:min-w-[5.5rem] sm:pb-9">
            <p className="text-4xl leading-none font-bold text-[#0f3d2e]">
              {total}
            </p>
            <p className="text-xs leading-snug text-neutral-500 sm:mt-1.5">
              laporan
              <br className="hidden sm:block" /> {rentang}
            </p>
          </div>

          <div className="relative min-w-0 flex-1">
            <svg
              viewBox={`0 0 ${LEBAR} ${TINGGI}`}
              preserveAspectRatio="none"
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-24 w-full overflow-visible"
            >
              <defs>
                <linearGradient
                  id="grad-laporan-harian"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0" stopColor="#1f6b4f" stopOpacity={0.28} />
                  <stop offset="1" stopColor="#1f6b4f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <path
                d={`M0 ${DASAR}H${LEBAR}`}
                fill="none"
                stroke="#e4e0d2"
                strokeDasharray="4 4"
                vectorEffect="non-scaling-stroke"
              />
              <path d={area} fill="url(#grad-laporan-harian)" />
              <path
                d={garis}
                fill="none"
                stroke="#1f6b4f"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            <div
              role="group"
              aria-label={`Jumlah laporan per ${harianMode ? 'hari' : 'bulan'}`}
              className="relative grid"
              style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
            >
              {data.map(({ t, y }, i) => {
                const aktif = harianMode && terpilih === i
                const nol = t.jumlah === 0
                return (
                  <button
                    key={t.key}
                    type="button"
                    aria-pressed={bisaPilih ? aktif : undefined}
                    aria-label={t.aria}
                    onClick={() => {
                      if (bisaPilih) onPilih(aktif ? null : i)
                    }}
                    className={cn(
                      'group relative rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#1f6b4f]/35',
                      bisaPilih ? 'cursor-pointer' : 'cursor-default',
                    )}
                  >
                    <span className="relative block h-24">
                      {/* garis bantu vertikal */}
                      <span
                        aria-hidden="true"
                        style={{ top: y }}
                        className={cn(
                          'absolute bottom-3 left-1/2 border-l-[1.5px] border-dashed border-[#1f6b4f] opacity-0 transition-opacity group-hover:opacity-55 group-focus-visible:opacity-55',
                          aktif && 'opacity-55',
                        )}
                      />
                      {/* titik data */}
                      <span
                        aria-hidden="true"
                        style={{ top: y }}
                        className={cn(
                          'absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform group-hover:scale-125 group-focus-visible:scale-125',
                          nol
                            ? 'size-[7px] border-2 border-emerald-100 bg-white'
                            : t.sorot
                              ? 'size-3.5 border-[2.5px] border-[#0f3d2e] bg-[#0f3d2e]'
                              : 'size-[11px] border-[2.5px] border-[#1f6b4f] bg-white group-hover:border-[#0f3d2e]',
                          aktif && 'scale-125 border-[#0f3d2e] bg-[#0f3d2e]',
                        )}
                      />
                      {/* tooltip */}
                      <span
                        aria-hidden="true"
                        style={{ top: y - 12 }}
                        className={cn(
                          'pointer-events-none absolute z-10 -translate-y-full rounded-lg bg-[#1d2b26] px-2.5 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100',
                          posisiTooltip(i, n),
                          aktif && 'opacity-100',
                        )}
                      >
                        {t.tooltip}
                      </span>
                    </span>

                    <span
                      className={cn(
                        'mt-0.5 block text-center text-xs leading-tight text-neutral-400',
                        t.sorot && 'font-semibold text-[#0f3d2e]',
                      )}
                    >
                      {t.sorot ? labelSorot : t.label}
                      <span
                        className={cn(
                          'block text-[13px] text-neutral-700',
                          t.sorot && 'text-[#0f3d2e]',
                        )}
                      >
                        {t.sub}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

// Kartu ringkas "Laporan masuk" untuk halaman Verifikasi: total di kiri,
// grafik garis di tengah, toggle Harian/Bulanan + Puncak/Rata-rata di kanan.
export function LaporanMasukCard({
  harian,
  bulanan,
  terpilih = null,
  onPilih,
}: {
  harian: BarHarian[]
  // Opsional. Kalau diisi, muncul tombol Harian / Bulanan.
  bulanan?: BarBulanan[]
  // Indeks hari yang sedang dipilih (buat filter tanggal).
  terpilih?: number | null
  // Kalau diisi, titik bisa diklik. Hanya aktif di mode Harian.
  onPilih?: (indeks: number | null) => void
}) {
  const [mode, setMode] = useState<ModeGrafik>('harian')
  const modeAktif: ModeGrafik = bulanan ? mode : 'harian'
  const harianMode = modeAktif === 'harian'

  const titik: TitikGrafik[] = harianMode
    ? harian.map((b) => ({
        key: b.ariaLabel,
        label: b.hari,
        sub: String(b.tanggal),
        tooltip: `${b.hari}, ${b.tanggal} ${b.bulan} · ${b.jumlah} laporan`,
        aria: `${b.jumlah} laporan pada ${b.ariaLabel}`,
        jumlah: b.jumlah,
        sorot: b.sorot,
      }))
    : (bulanan ?? []).map((b) => ({
        key: b.ariaLabel,
        label: b.label,
        sub: String(b.bulan).padStart(2, '0'),
        tooltip: `${b.ariaLabel} · ${b.jumlah} laporan`,
        aria: `${b.jumlah} laporan pada ${b.ariaLabel}`,
        jumlah: b.jumlah,
        sorot: b.sorot,
      }))

  const rentang = harianMode ? '7 hari terakhir' : '7 bulan terakhir'
  const labelSorot = harianMode ? 'Hari ini' : 'Bulan ini'
  // Klik titik (filter tanggal) hanya masuk akal di mode Harian.
  const bisaPilih = harianMode && !!onPilih

  const n = titik.length
  const total = titik.reduce((acc, item) => acc + item.jumlah, 0)
  const puncak = Math.max(0, ...titik.map((item) => item.jumlah))
  const rata = n === 0 ? 0 : total / n
  const maks = Math.max(1, puncak)

  const data = titik.map((t, i) => ({
    t,
    x: ((i + 0.5) / n) * LEBAR,
    y: DASAR - (t.jumlah / maks) * (DASAR - ATAS),
  }))
  const garis = buatGaris(data)
  const pertama = data[0]
  const terakhir = data[data.length - 1]
  const area =
    pertama && terakhir
      ? `${garis} L${terakhir.x} ${DASAR} L${pertama.x} ${DASAR} Z`
      : ''

  return (
    <section
      aria-label="Laporan masuk"
      className={cn(
        KARTU,
        'flex flex-col gap-5 py-5 lg:flex-row lg:items-center lg:gap-8',
      )}
    >
      {/* Kiri: total */}
      <div className="flex shrink-0 flex-col lg:min-w-[9rem]">
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <span className="grid size-7 place-items-center rounded-lg bg-emerald-50 text-[#1f6b4f]">
            <ClipboardList aria-hidden="true" className="size-4" />
          </span>
          Laporan masuk
        </div>
        <p className="mt-3 text-4xl leading-none font-bold text-[#0f3d2e]">
          {total}
        </p>
        <p className="mt-1.5 text-xs text-neutral-500">{rentang}</p>
      </div>

      {/* Tengah: grafik */}
      <div className="relative min-w-0 flex-1">
        {total === 0 || n === 0 ? (
          <p className="py-6 text-sm text-neutral-500">
            Belum ada laporan dalam {rentang}.
          </p>
        ) : (
          <>
            <svg
              viewBox={`0 0 ${LEBAR} ${TINGGI}`}
              preserveAspectRatio="none"
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-24 w-full overflow-visible"
            >
              <defs>
                <linearGradient
                  id="grad-laporan-masuk"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0" stopColor="#1f6b4f" stopOpacity={0.28} />
                  <stop offset="1" stopColor="#1f6b4f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <path
                d={`M0 ${DASAR}H${LEBAR}`}
                fill="none"
                stroke="#e4e0d2"
                strokeDasharray="4 4"
                vectorEffect="non-scaling-stroke"
              />
              <path d={area} fill="url(#grad-laporan-masuk)" />
              <path
                d={garis}
                fill="none"
                stroke="#1f6b4f"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            <div
              role="group"
              aria-label={`Jumlah laporan per ${harianMode ? 'hari' : 'bulan'}`}
              className="relative grid"
              style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
            >
              {data.map(({ t, y }, i) => {
                const aktif = harianMode && terpilih === i
                const nol = t.jumlah === 0
                return (
                  <button
                    key={t.key}
                    type="button"
                    aria-pressed={bisaPilih ? aktif : undefined}
                    aria-label={t.aria}
                    onClick={() => {
                      if (bisaPilih) onPilih(aktif ? null : i)
                    }}
                    className={cn(
                      'group relative rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#1f6b4f]/35',
                      bisaPilih ? 'cursor-pointer' : 'cursor-default',
                    )}
                  >
                    <span className="relative block h-24">
                      {/* garis bantu vertikal */}
                      <span
                        aria-hidden="true"
                        style={{ top: y }}
                        className={cn(
                          'absolute bottom-3 left-1/2 border-l-[1.5px] border-dashed border-[#1f6b4f] opacity-0 transition-opacity group-hover:opacity-55 group-focus-visible:opacity-55',
                          aktif && 'opacity-55',
                        )}
                      />
                      {/* titik data */}
                      <span
                        aria-hidden="true"
                        style={{ top: y }}
                        className={cn(
                          'absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform group-hover:scale-125 group-focus-visible:scale-125',
                          nol
                            ? 'size-[7px] border-2 border-emerald-100 bg-white'
                            : t.sorot
                              ? 'size-3.5 border-[2.5px] border-[#0f3d2e] bg-[#0f3d2e]'
                              : 'size-[11px] border-[2.5px] border-[#1f6b4f] bg-white group-hover:border-[#0f3d2e]',
                          aktif && 'scale-125 border-[#0f3d2e] bg-[#0f3d2e]',
                        )}
                      />
                      {/* tooltip */}
                      <span
                        aria-hidden="true"
                        style={{ top: y - 12 }}
                        className={cn(
                          'pointer-events-none absolute z-10 -translate-y-full rounded-lg bg-[#1d2b26] px-2.5 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100',
                          posisiTooltip(i, n),
                          aktif && 'opacity-100',
                        )}
                      >
                        {t.tooltip}
                      </span>
                    </span>

                    <span
                      className={cn(
                        'mt-0.5 block text-center text-xs leading-tight text-neutral-400',
                        t.sorot && 'font-semibold text-[#0f3d2e]',
                      )}
                    >
                      {t.sorot ? labelSorot : t.label}
                      <span
                        className={cn(
                          'block text-[13px] text-neutral-700',
                          t.sorot && 'text-[#0f3d2e]',
                        )}
                      >
                        {t.sub}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Kanan: toggle + puncak/rata-rata */}
      <div className="flex shrink-0 flex-col items-start gap-2.5 lg:items-end">
        {bulanan && (
          <div
            role="tablist"
            aria-label="Rentang laporan"
            className="inline-flex rounded-full bg-neutral-100 p-[3px]"
          >
            {(['harian', 'bulanan'] as const).map((m) => {
              const aktif = modeAktif === m
              return (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={aktif}
                  onClick={() => setMode(m)}
                  className={cn(
                    'rounded-full px-3.5 py-1 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#1f6b4f]/35',
                    aktif
                      ? 'bg-[#0f3d2e] font-medium text-white'
                      : 'text-neutral-500 hover:text-neutral-800',
                  )}
                >
                  {m === 'harian' ? 'Harian' : 'Bulanan'}
                </button>
              )
            })}
          </div>
        )}
        <p className="text-xs text-neutral-500">
          Puncak <b className="text-[#1d2b26]">{puncak}</b> · Rata-rata{' '}
          <b className="text-[#1d2b26]">{rata.toFixed(1)}</b>
        </p>
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
