import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import {
  ArrowUpRight,
  Building2,
  Camera,
  Check,
  ClipboardCheck,
  GraduationCap,
  MonitorSmartphone,
  Route as RouteIcon,
  ShieldCheck,
  Users,
  Wrench,
  Zap,
} from 'lucide-react'
import plantRoomImage from '@/assets/landing/plant-room.jpg'
import reportPhotoImage from '@/assets/landing/report-photo.jpg'
import heroImage from '@/assets/landing/hero.jpg'
import { statusQueryOptions } from '@/features/status/status-query'

const KATEGORI = ['Elektronik', 'Furnitur', 'Mekanik', 'Bangunan', 'Lainnya']

const STATUS = [
  'Menunggu verifikasi',
  'Valid',
  'Ditolak',
  'Diproses',
  'Selesai',
]

const NAV_SECTIONS = ['fitur', 'alur', 'peran'] as const

function ApiStatus() {
  const status = useQuery(statusQueryOptions)

  if (status.isPending) {
    return <span className="text-on-dark">Menghubungkan…</span>
  }

  if (status.isError || status.data?.data.status !== 'ok') {
    return <span className="text-red-300">API tidak tersedia</span>
  }

  return <span className="text-lime">Sistem aktif</span>
}

function DualToneCta({
  to,
  label,
  tone = 'dark',
}: {
  to: '/login'
  label: string
  tone?: 'dark' | 'light'
}) {
  return (
    <Link
      to={to}
      className="group border-lime-deep bg-lime inline-flex items-center rounded-full border p-[2px] transition-transform duration-150 hover:scale-[0.97]"
    >
      <span
        className={
          tone === 'dark'
            ? 'bg-forest font-jakarta flex h-12 items-center rounded-full px-6 text-sm font-medium text-white'
            : 'font-jakarta text-forest flex h-12 items-center rounded-full bg-white px-6 text-sm font-semibold'
        }
      >
        {label}
      </span>
      <span className="bg-lime text-forest ml-[-2px] flex h-12 w-12 items-center justify-center rounded-full">
        <ArrowUpRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </span>
    </Link>
  )
}

function SectionPill({
  children,
  tone = 'light',
}: {
  children: ReactNode
  tone?: 'light' | 'dark'
}) {
  const dark = tone === 'dark'

  return (
    <div
      className={
        dark
          ? 'mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5'
          : 'border-cream-border mb-5 inline-flex items-center gap-2 rounded-full border bg-white px-3.5 py-1.5 shadow-sm'
      }
    >
      <span
        aria-hidden="true"
        className={
          dark
            ? 'text-lime text-xs leading-none font-bold'
            : 'text-forest text-xs leading-none font-bold'
        }
      >
        ✱
      </span>
      <span
        className={
          dark
            ? 'font-jakarta text-lime text-[11px] font-semibold tracking-wider uppercase'
            : 'font-jakarta text-forest text-[11px] font-semibold tracking-wider uppercase'
        }
      >
        {children}
      </span>
    </div>
  )
}

function SectionIntro({
  eyebrow,
  title,
  description,
  tone = 'light',
  align = 'left',
}: {
  eyebrow: string
  title: string
  description: string
  tone?: 'light' | 'dark'
  align?: 'left' | 'center'
}) {
  const dark = tone === 'dark'
  const centered = align === 'center'

  return (
    <div
      className={
        centered
          ? 'mx-auto max-w-3xl text-center'
          : 'grid grid-cols-1 items-end gap-8 lg:grid-cols-12'
      }
    >
      <div className={centered ? '' : 'lg:col-span-7'}>
        <SectionPill tone={tone}>{eyebrow}</SectionPill>
        <h2
          className={
            dark
              ? 'font-jakarta text-[32px] leading-[1.1] font-bold tracking-tight text-white md:text-[44px] md:leading-[1.08]'
              : 'font-jakarta text-forest text-[32px] leading-[1.1] font-bold tracking-tight md:text-[44px] md:leading-[1.08]'
          }
        >
          {title}
        </h2>
      </div>
      <div className={centered ? 'mt-4' : 'lg:col-span-5'}>
        <p
          className={
            dark
              ? 'font-jakarta text-on-dark text-[15px] leading-relaxed md:text-base'
              : 'font-jakarta text-muted-ink text-[15px] leading-relaxed md:text-base'
          }
        >
          {description}
        </p>
      </div>
    </div>
  )
}

function HeroPreview() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto w-full max-w-md lg:max-w-none"
    >
      <div className="bg-lime/20 absolute -inset-8 rounded-[40px] blur-3xl" />

      <div className="animate-rise relative rounded-[28px] border border-white/15 bg-white/10 p-2.5 shadow-[0_40px_80px_-24px_rgba(0,0,0,0.5)] backdrop-blur-md [animation-delay:150ms]">
        <div className="flex items-center gap-2 px-2 pt-1 pb-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
          <span className="font-jakarta ml-2 text-[10px] font-medium text-white/50">
            facility-report
          </span>
          <span className="bg-lime/15 text-lime ml-auto rounded-full px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase">
            Pratinjau
          </span>
        </div>

        <div className="rounded-[20px] bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="font-jakarta text-forest text-sm font-semibold">
                Laporan saya
              </div>
              <div className="font-jakarta text-muted-ink text-[10px]">
                2 laporan bulan ini
              </div>
            </div>
            <span className="bg-forest font-jakarta rounded-full px-3 py-1.5 text-[10px] font-semibold text-white">
              + Lapor
            </span>
          </div>

          <div className="space-y-2">
            {[
              {
                judul: 'AC ruang kelas tidak dingin',
                meta: 'Elektronik · Gedung A',
                status: 'Diproses',
                kelas: 'border-cream-chip bg-cream-low text-forest',
              },
              {
                judul: 'Kursi patah di lab',
                meta: 'Furnitur · Lab 2',
                status: 'Selesai',
                kelas: 'border-lime-deep bg-lime text-forest',
              },
            ].map((laporan) => (
              <div
                key={laporan.judul}
                className="border-cream-border flex items-center gap-3 rounded-2xl border bg-white px-3 py-2.5"
              >
                <span className="bg-cream-low text-forest flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
                  <Camera className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-jakarta text-forest truncate text-[11px] font-semibold">
                    {laporan.judul}
                  </div>
                  <div className="font-jakarta text-muted-ink truncate text-[10px]">
                    {laporan.meta}
                  </div>
                </div>
                <span
                  className={`font-jakarta shrink-0 rounded-full border px-2 py-1 text-[9px] font-semibold ${laporan.kelas}`}
                >
                  {laporan.status}
                </span>
              </div>
            ))}
          </div>

          <div className="border-cream-border mt-4 border-t pt-4">
            <div className="font-jakarta text-muted-ink mb-3 text-[9px] font-semibold tracking-wider uppercase">
              Riwayat status
            </div>
            <div className="space-y-2">
              {[
                ['09.12', 'Laporan dibuat'],
                ['09.30', 'Diverifikasi admin'],
                ['10.05', 'Sedang diproses'],
              ].map(([waktu, teks], index) => (
                <div key={waktu} className="flex items-center gap-3">
                  <span className="font-jakarta text-forest w-9 text-[10px] font-semibold">
                    {waktu}
                  </span>
                  <span
                    className={
                      index === 2
                        ? 'bg-forest h-2 w-2 rounded-full'
                        : 'bg-lime h-2 w-2 rounded-full'
                    }
                  />
                  <span className="bg-cream-border h-px flex-1" />
                  <span
                    className={
                      index === 2
                        ? 'font-jakarta text-forest text-[10px] font-semibold'
                        : 'font-jakarta text-muted-ink text-[10px]'
                    }
                  >
                    {teks}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="animate-rise border-cream-border absolute -top-3 -right-3 hidden items-center gap-2 rounded-full border bg-white px-3 py-2 shadow-lg [animation-delay:400ms] md:flex">
        <span className="bg-lime text-forest flex h-6 w-6 items-center justify-center rounded-full">
          <Check className="h-3.5 w-3.5" />
        </span>
        <span className="font-jakarta text-forest text-[10px] font-semibold">
          Foto + kategori
        </span>
      </div>

      <div className="animate-rise border-cream-border absolute -bottom-4 -left-3 hidden items-center gap-2 rounded-full border bg-white px-3 py-2 shadow-lg [animation-delay:500ms] md:flex">
        <span className="bg-forest text-lime flex h-6 w-6 items-center justify-center rounded-full">
          <RouteIcon className="h-3.5 w-3.5" />
        </span>
        <span className="font-jakarta text-forest text-[10px] font-semibold">
          Status terlacak
        </span>
      </div>
    </div>
  )
}

const FEATURES = [
  {
    id: 'lapor',
    nomor: '01',
    label: 'Lapor',
    title: 'Lapor cepat dengan foto',
    description:
      'Pilih kategori, unggah foto, dan kirim laporan langsung dari browser. Tanpa instal aplikasi.',
    Ikon: Camera,
  },
  {
    id: 'verifikasi',
    nomor: '02',
    label: 'Verifikasi',
    title: 'Verifikasi dan tindak lanjut',
    description:
      'Admin memeriksa laporan, menandai valid atau ditolak, lalu memperbarui status perbaikan.',
    Ikon: ClipboardCheck,
  },
  {
    id: 'riwayat',
    nomor: '03',
    label: 'Riwayat',
    title: 'Riwayat yang transparan',
    description:
      'Setiap perubahan status tercatat. Mahasiswa tahu posisi laporannya sampai selesai.',
    Ikon: ShieldCheck,
  },
] as const

function ReportPreview() {
  return (
    <div className="grid h-full gap-4 md:grid-cols-5">
      <div className="border-cream-border flex flex-col rounded-2xl border bg-white p-5 md:col-span-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-jakarta text-forest text-sm font-semibold">
              Laporan baru
            </div>
            <div className="font-jakarta text-muted-ink text-[11px]">
              Sarana kampus · Gedung A
            </div>
          </div>
          <span className="font-jakarta text-muted-ink border-cream-border bg-cream-low rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase">
            Draf
          </span>
        </div>

        <div className="mt-5 grid grid-cols-[84px_1fr] gap-3">
          <div className="relative h-24 overflow-hidden rounded-xl">
            <img
              src={reportPhotoImage}
              alt=""
              className="h-full w-full object-cover"
            />
            <span className="bg-lime text-forest absolute right-1.5 bottom-1.5 flex h-5 w-5 items-center justify-center rounded-full">
              <Check className="h-3 w-3" />
            </span>
          </div>
          <div className="border-cream-border bg-cream-low/60 flex flex-col justify-center rounded-xl border border-dashed p-3">
            <div className="font-jakarta text-forest truncate text-[11px] font-semibold">
              foto-kerusakan.jpg
            </div>
            <div className="font-jakarta text-muted-ink mt-0.5 text-[10px]">
              1,2 MB · selesai diunggah
            </div>
            <div className="bg-cream-border mt-2 h-1 overflow-hidden rounded-full">
              <div className="bg-forest h-full w-full rounded-full" />
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="font-jakarta text-muted-ink text-[10px] font-semibold tracking-wider uppercase">
            Kategori
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {['Elektronik', 'Furnitur', 'Bangunan', 'Lainnya'].map(
              (kategori, index) => (
                <span
                  key={kategori}
                  className={
                    index === 0
                      ? 'bg-forest rounded-full px-3 py-1.5 text-[10px] font-semibold text-white'
                      : 'border-cream-border text-muted-ink rounded-full border bg-white px-3 py-1.5 text-[10px] font-semibold'
                  }
                >
                  {kategori}
                </span>
              ),
            )}
          </div>
        </div>

        <div className="mt-5">
          <div className="font-jakarta text-muted-ink text-[10px] font-semibold tracking-wider uppercase">
            Deskripsi
          </div>
          <div className="font-jakarta text-forest border-cream-border bg-cream-low mt-2 rounded-xl border px-3 py-2.5 text-[11px] leading-relaxed">
            Kaca jendela retak di koridor lantai 2.
          </div>
        </div>

        <div className="bg-forest font-jakarta mt-auto flex items-center justify-between rounded-full px-4 py-2.5 pt-2.5 text-[11px] font-semibold text-white">
          <span className="pt-0">Kirim laporan</span>
          <ArrowUpRight className="text-lime h-4 w-4" />
        </div>
      </div>

      <div className="flex flex-col gap-3 md:col-span-2">
        <div className="bg-lime flex-1 rounded-2xl p-5">
          <div className="font-jakarta text-forest text-[10px] font-semibold tracking-wider uppercase">
            Yang diterima admin
          </div>
          <ul className="mt-4 space-y-3">
            {[
              'Foto kerusakan',
              'Kategori yang tepat',
              'Lokasi dan deskripsi',
            ].map((item) => (
              <li
                key={item}
                className="font-jakarta text-forest flex items-center gap-2.5 text-[11px] font-medium"
              >
                <span className="bg-forest text-lime flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                  <Check className="h-3 w-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="border-cream-border rounded-2xl border bg-white p-5">
          <div className="font-jakarta text-muted-ink text-[10px] font-semibold tracking-wider uppercase">
            Status awal
          </div>
          <div className="font-jakarta text-forest border-cream-chip bg-cream-low mt-3 inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[10px] font-semibold">
            <span className="bg-forest h-1.5 w-1.5 rounded-full" />
            Menunggu verifikasi
          </div>
          <p className="font-jakarta text-muted-ink mt-3 text-[11px] leading-relaxed">
            Laporan langsung masuk ke antrean admin.
          </p>
        </div>
      </div>
    </div>
  )
}

function VerifyPreview() {
  return (
    <div className="grid h-full gap-4 md:grid-cols-5">
      <div className="border-cream-border flex flex-col rounded-2xl border bg-white p-5 md:col-span-3">
        <div className="flex items-center justify-between">
          <div className="font-jakarta text-forest text-sm font-semibold">
            Antrean verifikasi
          </div>
          <span className="font-jakarta text-forest bg-cream-low rounded-full px-2.5 py-1 text-[10px] font-semibold">
            3 laporan
          </span>
        </div>

        <div className="mt-4 space-y-2">
          {[
            {
              judul: 'Kaca jendela retak',
              meta: 'Bangunan · Gedung A',
              status: 'Menunggu',
              aktif: true,
            },
            {
              judul: 'AC kelas tidak dingin',
              meta: 'Elektronik · Gedung B',
              status: 'Menunggu',
              aktif: false,
            },
            {
              judul: 'Kursi patah di lab',
              meta: 'Furnitur · Lab 2',
              status: 'Baru',
              aktif: false,
            },
          ].map((laporan) => (
            <div
              key={laporan.judul}
              className={
                laporan.aktif
                  ? 'border-forest/20 bg-cream-low flex items-center gap-3 rounded-xl border px-3 py-2.5'
                  : 'border-cream-border flex items-center gap-3 rounded-xl border bg-white px-3 py-2.5'
              }
            >
              <span className="bg-forest text-lime flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                <Camera className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-jakarta text-forest truncate text-[11px] font-semibold">
                  {laporan.judul}
                </div>
                <div className="font-jakarta text-muted-ink truncate text-[10px]">
                  {laporan.meta}
                </div>
              </div>
              <span className="font-jakarta text-muted-ink border-cream-border shrink-0 rounded-full border bg-white px-2 py-0.5 text-[9px] font-semibold">
                {laporan.status}
              </span>
            </div>
          ))}
        </div>

        <div className="font-jakarta text-muted-ink mt-auto flex items-center gap-2 pt-5 text-[10px]">
          <span className="bg-lime h-1.5 w-1.5 rounded-full" />
          Laporan terbaru masuk 2 menit lalu
        </div>
      </div>

      <div className="flex flex-col gap-3 md:col-span-2">
        <div className="border-cream-border overflow-hidden rounded-2xl border bg-white">
          <div className="relative h-28">
            <img
              src={reportPhotoImage}
              alt=""
              className="h-full w-full object-cover"
            />
            <span className="font-jakarta text-forest absolute top-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-semibold">
              Foto terlampir
            </span>
          </div>
          <div className="p-4">
            <div className="font-jakarta text-forest text-xs font-semibold">
              Kaca jendela retak
            </div>
            <div className="font-jakarta text-muted-ink mt-0.5 text-[10px]">
              Bangunan · Gedung A · Lantai 2
            </div>
          </div>
        </div>

        <div className="border-cream-border rounded-2xl border bg-white p-4">
          <div className="font-jakarta text-muted-ink text-[10px] font-semibold tracking-wider uppercase">
            Tinjau laporan
          </div>
          <div className="mt-3 flex gap-2">
            <span className="bg-forest font-jakarta flex flex-1 items-center justify-center gap-1 rounded-full py-2 text-[10px] font-semibold text-white">
              <Check className="h-3 w-3" />
              Valid
            </span>
            <span className="border-cream-chip font-jakarta text-forest flex flex-1 items-center justify-center rounded-full border py-2 text-[10px] font-semibold">
              Tolak
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function HistoryPreview() {
  return (
    <div className="mx-auto flex h-full max-w-xl flex-col">
      <div className="bg-forest rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <span className="font-jakarta text-on-dark-soft text-[10px] font-semibold tracking-wider uppercase">
            Laporan #024
          </span>
          <span className="bg-lime font-jakarta text-forest rounded-full px-2.5 py-1 text-[10px] font-semibold">
            Selesai
          </span>
        </div>
        <div className="font-jakarta mt-3 text-base font-semibold text-white">
          AC ruang kelas tidak dingin
        </div>
        <div className="font-jakarta text-on-dark mt-1 text-[11px]">
          Elektronik · Gedung A · Lantai 2
        </div>
        <div className="bg-forest-badge mt-4 h-1.5 overflow-hidden rounded-full">
          <div className="bg-lime h-full w-full rounded-full" />
        </div>
        <div className="font-jakarta text-on-dark-soft mt-2 flex justify-between text-[10px]">
          <span>Menunggu verifikasi</span>
          <span>Selesai dalam 4 jam 28 menit</span>
        </div>
      </div>

      <div className="border-cream-border mt-3 flex-1 rounded-2xl border bg-white p-5">
        <div className="space-y-4">
          {[
            ['09.12', 'Laporan dibuat', 'Mahasiswa'],
            ['09.30', 'Diverifikasi admin', 'Admin'],
            ['10.05', 'Sedang diproses', 'Admin'],
            ['13.40', 'Perbaikan selesai', 'Admin'],
          ].map(([waktu, teks, aktor], index) => (
            <div key={waktu} className="flex gap-3">
              <span className="font-jakarta text-forest w-10 shrink-0 pt-0.5 text-[10px] font-semibold">
                {waktu}
              </span>
              <span className="flex flex-col items-center">
                <span
                  className={
                    index === 3
                      ? 'bg-lime border-forest h-2.5 w-2.5 rounded-full border-2'
                      : 'bg-cream-chip h-2.5 w-2.5 rounded-full'
                  }
                />
                {index < 3 ? (
                  <span className="bg-cream-border w-px flex-1" />
                ) : null}
              </span>
              <div className="min-w-0 flex-1 pb-3">
                <div className="font-jakarta text-forest text-[11px] font-semibold">
                  {teks}
                </div>
                <div className="font-jakarta text-muted-ink text-[10px]">
                  oleh {aktor}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function useSectionReveal() {
  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('[data-reveal]'),
    )

    const reduced = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (reduced || typeof IntersectionObserver === 'undefined') {
      sections.forEach((section) => section.classList.add('reveal-visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('reveal-visible')
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )

    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])
}

function useActiveSection() {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return

    const sections = NAV_SECTIONS.map((id) =>
      document.getElementById(id),
    ).filter((section): section is HTMLElement => section !== null)

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
        if (visible.length === 0) return

        const current = visible.reduce((best, entry) =>
          entry.intersectionRatio > best.intersectionRatio ? entry : best,
        )
        setActive(current.target.id)
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75] },
    )

    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  return active
}

export function LandingPage() {
  useSectionReveal()
  const activeSection = useActiveSection()
  const [activeFeature, setActiveFeature] = useState<string>(FEATURES[0].id)

  return (
    <div className="bg-cream font-jakarta text-ink antialiased">
      <section className="bg-forest relative overflow-hidden">
        <img
          src={heroImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-right opacity-50"
        />
        <div className="from-forest via-forest/85 absolute inset-0 bg-gradient-to-r to-transparent" />
        <div className="from-forest absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t to-transparent" />
        <div className="bg-lime/10 absolute -top-40 right-0 h-[520px] w-[520px] rounded-full blur-[120px]" />

        <header className="border-cream-border/20 relative z-20 border-b">
          <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6 lg:px-12">
            <Link to="/" className="group flex items-center gap-2.5">
              <span className="bg-lime text-forest flex h-8 w-8 items-center justify-center rounded-lg transition-transform duration-150 group-hover:scale-95">
                <Building2 className="h-5 w-5" />
              </span>
              <span className="font-jakarta text-xl font-bold tracking-tight text-white">
                Facility Report<span className="text-lime">.</span>
              </span>
            </Link>

            <nav className="hidden items-center gap-8 md:flex">
              {[
                ['fitur', 'Fitur'],
                ['alur', 'Alur'],
                ['peran', 'Peran'],
              ].map(([id, label]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  aria-current={activeSection === id ? 'true' : undefined}
                  className={
                    activeSection === id
                      ? 'font-jakarta text-lime relative text-[13px] font-medium transition-colors'
                      : 'font-jakarta text-on-dark relative text-[13px] font-medium transition-colors hover:text-white'
                  }
                >
                  {label}
                  <span
                    className={
                      activeSection === id
                        ? 'bg-lime absolute -bottom-1.5 left-0 h-0.5 w-full rounded-full transition-all'
                        : 'bg-lime absolute -bottom-1.5 left-0 h-0.5 w-0 rounded-full transition-all'
                    }
                  />
                </a>
              ))}
            </nav>

            <Link
              to="/login"
              className="border-lime-deep bg-lime flex items-center gap-2 rounded-full border p-[2px] transition-transform duration-150 hover:scale-95"
            >
              <span className="bg-forest font-jakarta flex h-10 items-center rounded-full px-5 text-[13px] font-medium text-white">
                Masuk
              </span>
              <span className="bg-lime text-forest ml-[-2px] flex h-10 w-10 items-center justify-center rounded-full">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </header>

        <div className="relative z-10 mx-auto grid min-h-[calc(100svh-5rem)] max-w-7xl grid-cols-1 items-center gap-14 px-6 pt-16 pb-32 md:pt-20 md:pb-36 lg:grid-cols-12 lg:gap-10 lg:px-12">
          <div className="flex flex-col items-start lg:col-span-7">
            <div className="border-forest-badge bg-forest-badge mb-8 inline-flex items-center gap-3 rounded-full border px-4 py-2">
              <span className="flex items-center gap-2">
                <span className="bg-lime h-2 w-2 rounded-full" />
                <span className="font-jakarta text-on-dark text-xs font-medium md:text-sm">
                  <ApiStatus />
                </span>
              </span>
              <span className="bg-on-dark-soft/40 h-3 w-px" />
              <span className="font-jakarta text-on-dark text-xs font-medium md:text-sm">
                Pelaporan sarana kampus
              </span>
            </div>

            <h1 className="font-jakarta mb-6 text-[42px] leading-[50px] font-bold tracking-tight text-white md:text-7xl md:leading-[84px] lg:text-[80px] lg:leading-[92px]">
              <span className="block overflow-hidden pb-1">
                <span className="animate-mask block">
                  PERBAIKAN DIMULAI DARI
                </span>
              </span>{' '}
              <span className="block overflow-hidden pb-1">
                <span className="animate-mask text-lime block [animation-delay:120ms]">
                  LAPORAN YANG RAPI
                </span>
              </span>
            </h1>

            <p className="font-jakarta text-on-dark mb-10 max-w-xl text-[15px] leading-relaxed md:text-lg">
              Laporkan kerusakan sarana dengan foto dan kategori yang tepat.
              Admin menerima informasi lengkap, tanpa tanya ulang.
            </p>

            <div className="flex w-full flex-wrap items-center gap-6 sm:w-auto">
              <DualToneCta to="/login" label="Masuk dan mulai lapor" />
              <a
                href="#alur"
                className="font-jakarta text-on-dark group inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-white md:text-base"
              >
                Lihat alur kerja
                <ArrowUpRight className="text-lime h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>

            <div className="font-jakarta text-on-dark mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs">
              {['Tanpa instal aplikasi', 'Akun kampus', 'Riwayat status'].map(
                (item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <Check className="text-lime h-3.5 w-3.5" />
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>

          <div className="w-full lg:col-span-5">
            <HeroPreview />
          </div>
        </div>
      </section>

      <section
        aria-label="Ringkasan sistem"
        data-reveal
        className="reveal bg-cream relative z-20 px-6 lg:px-12"
      >
        <div className="mx-auto -mt-16 max-w-6xl">
          <div
            data-stagger
            className="border-cream-border bg-cream-border grid grid-cols-2 gap-px overflow-hidden rounded-[28px] border shadow-[0_30px_60px_-30px_rgba(11,58,51,0.35)] md:grid-cols-4"
          >
            {[
              {
                angka: '5',
                label: 'Kategori kerusakan',
                Ikon: Camera,
              },
              {
                angka: '5',
                label: 'Status laporan',
                Ikon: RouteIcon,
              },
              {
                angka: '3',
                label: 'Peran pengguna',
                Ikon: Users,
              },
              {
                angka: '0',
                label: 'Aplikasi diinstal',
                Ikon: MonitorSmartphone,
              },
            ].map(({ angka, label, Ikon }, index) => (
              <div
                key={label}
                className={
                  index === 0 ? 'bg-lime p-6 md:p-8' : 'bg-white p-6 md:p-8'
                }
              >
                <Ikon
                  className={
                    index === 0
                      ? 'text-forest mb-5 h-5 w-5'
                      : 'text-muted-ink mb-5 h-5 w-5'
                  }
                />
                <div className="font-jakarta text-forest text-3xl font-bold tracking-tight md:text-4xl">
                  {angka}
                </div>
                <div
                  className={
                    index === 0
                      ? 'font-jakarta text-forest mt-1 text-[11px] font-medium tracking-wide uppercase'
                      : 'font-jakarta text-muted-ink mt-1 text-[11px] font-medium tracking-wide uppercase'
                  }
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="fitur"
        data-reveal
        className="border-cream-border reveal bg-cream scroll-mt-24 border-b px-6 pt-24 pb-24 md:pt-28 md:pb-28 lg:px-12"
      >
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Fitur utama"
            title="Dari laporan masuk sampai selesai, tercatat rapi"
            description="Mahasiswa mengirim laporan dengan foto, admin menindaklanjuti, dan statusnya bisa dipantau. Semua perpindahan status tersimpan di satu sistem."
          />

          <div className="mt-14 grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
            <div
              role="tablist"
              aria-label="Fitur utama"
              className="grid grid-cols-3 gap-2 lg:col-span-4 lg:flex lg:flex-col lg:gap-3"
            >
              {FEATURES.map((feature, index) => {
                const aktif = activeFeature === feature.id

                return (
                  <button
                    key={feature.id}
                    id={`fitur-tab-${feature.id}`}
                    type="button"
                    role="tab"
                    aria-selected={aktif}
                    aria-controls={`fitur-panel-${feature.id}`}
                    tabIndex={aktif ? 0 : -1}
                    onClick={() => setActiveFeature(feature.id)}
                    onKeyDown={(event) => {
                      if (
                        event.key !== 'ArrowDown' &&
                        event.key !== 'ArrowRight' &&
                        event.key !== 'ArrowUp' &&
                        event.key !== 'ArrowLeft'
                      ) {
                        return
                      }

                      event.preventDefault()
                      const arah =
                        event.key === 'ArrowDown' || event.key === 'ArrowRight'
                          ? 1
                          : -1
                      const berikutnya =
                        FEATURES[
                          (index + arah + FEATURES.length) % FEATURES.length
                        ] ?? FEATURES[0]

                      setActiveFeature(berikutnya.id)
                      document
                        .getElementById(`fitur-tab-${berikutnya.id}`)
                        ?.focus()
                    }}
                    className={
                      aktif
                        ? 'bg-forest border-forest group flex flex-col rounded-[20px] border p-3 text-left transition-colors duration-200 lg:p-6'
                        : 'border-cream-border group hover:border-forest/30 flex flex-col rounded-[20px] border bg-white p-3 text-left transition-colors duration-200 lg:p-6'
                    }
                  >
                    <span className="flex items-center justify-between gap-2 lg:w-full">
                      <span
                        className={
                          aktif
                            ? 'bg-lime text-forest flex h-8 w-8 items-center justify-center rounded-xl lg:h-11 lg:w-11'
                            : 'bg-cream-low text-forest flex h-8 w-8 items-center justify-center rounded-xl lg:h-11 lg:w-11'
                        }
                      >
                        <feature.Ikon className="h-4 w-4 lg:h-5 lg:w-5" />
                      </span>
                      <span
                        aria-hidden="true"
                        className={
                          aktif
                            ? 'font-jakarta text-lime hidden text-xs font-semibold lg:block'
                            : 'font-jakarta text-muted-ink hidden text-xs font-semibold lg:block'
                        }
                      >
                        {feature.nomor}
                      </span>
                    </span>

                    <span
                      className={
                        aktif
                          ? 'font-jakarta mt-2 text-[11px] leading-tight font-semibold text-white lg:mt-6 lg:text-lg lg:leading-snug'
                          : 'font-jakarta text-forest mt-2 text-[11px] leading-tight font-semibold lg:mt-6 lg:text-lg lg:leading-snug'
                      }
                    >
                      <span className="lg:hidden">{feature.label}</span>
                      <span className="hidden lg:block">{feature.title}</span>
                    </span>
                    <span
                      className={
                        aktif
                          ? 'font-jakarta text-on-dark mt-1 hidden text-xs leading-relaxed lg:block'
                          : 'font-jakarta text-muted-ink mt-1 hidden text-xs leading-relaxed lg:block'
                      }
                    >
                      {feature.description}
                    </span>
                    <span
                      className={
                        aktif
                          ? 'font-jakarta text-lime mt-5 hidden items-center gap-2 text-xs font-semibold lg:inline-flex'
                          : 'font-jakarta text-forest mt-5 hidden items-center gap-2 text-xs font-semibold lg:inline-flex'
                      }
                    >
                      Lihat detail
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="lg:col-span-8">
              <div className="relative">
                <div
                  aria-hidden="true"
                  className="bg-forest/10 absolute -inset-4 rounded-[36px] blur-2xl"
                />
                <div className="border-cream-border relative rounded-[28px] border bg-white p-2.5 shadow-[0_30px_60px_-35px_rgba(11,58,51,0.4)]">
                  <div className="flex items-center gap-2 px-2 py-2">
                    <span className="bg-cream-chip h-2 w-2 rounded-full" />
                    <span className="bg-cream-chip h-2 w-2 rounded-full" />
                    <span className="bg-cream-chip h-2 w-2 rounded-full" />
                    <span className="font-jakarta text-muted-ink ml-2 text-[10px] font-medium">
                      facility-report / fitur
                    </span>
                    <span className="font-jakarta text-forest bg-cream-low ml-auto rounded-full px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase">
                      Pratinjau
                    </span>
                  </div>

                  <div className="bg-cream-low rounded-[20px] p-3 md:p-5">
                    <div
                      key={activeFeature}
                      id={`fitur-panel-${activeFeature}`}
                      role="tabpanel"
                      aria-labelledby={`fitur-tab-${activeFeature}`}
                      className="animate-rise min-h-[480px]"
                    >
                      {activeFeature === 'lapor' ? <ReportPreview /> : null}
                      {activeFeature === 'verifikasi' ? (
                        <VerifyPreview />
                      ) : null}
                      {activeFeature === 'riwayat' ? <HistoryPreview /> : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="peran"
        data-reveal
        className="reveal bg-forest border-forest-badge relative scroll-mt-24 overflow-hidden border-b px-6 py-24 md:py-28 lg:px-12"
      >
        <img
          src={plantRoomImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-15"
        />
        <div className="from-forest via-forest/90 to-forest absolute inset-0 bg-gradient-to-b" />

        <div className="relative mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Peran & akses"
            title="Satu sistem, tiga peran yang jelas"
            description="Laporan tidak hilang di grup chat. Setiap peran punya tugas dan akses yang terpisah, dengan riwayat yang sama."
            tone="dark"
          />

          <div
            data-stagger
            className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3"
          >
            {[
              {
                nomor: '01',
                peran: 'Mahasiswa',
                isi: 'Melaporkan kerusakan dan memantau tindak lanjut.',
                poin: [
                  'Kirim laporan dengan foto',
                  'Pantau status dan riwayat',
                ],
                Ikon: GraduationCap,
              },
              {
                nomor: '02',
                peran: 'Admin',
                isi: 'Memverifikasi laporan dan memperbarui status perbaikan.',
                poin: [
                  'Validasi atau tolak laporan',
                  'Perbarui progres perbaikan',
                ],
                Ikon: Wrench,
              },
              {
                nomor: '03',
                peran: 'Super admin',
                isi: 'Mengelola akun admin dan kategori kerusakan.',
                poin: ['Kelola akses admin', 'Jaga kategori tetap relevan'],
                Ikon: Users,
              },
            ].map(({ nomor, peran, isi, poin, Ikon }) => (
              <article
                key={peran}
                className="group rounded-[24px] border border-white/10 bg-white/5 p-7 backdrop-blur-sm transition-colors duration-300 hover:bg-white/10"
              >
                <div className="mb-8 flex items-start justify-between">
                  <span className="bg-lime text-forest flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105">
                    <Ikon className="h-6 w-6" />
                  </span>
                  <span
                    aria-hidden="true"
                    className="font-jakarta text-2xl font-bold tracking-tight text-white/20"
                  >
                    {nomor}
                  </span>
                </div>
                <div className="font-jakarta text-lime mb-2 text-[11px] font-semibold tracking-wider uppercase">
                  Peran {nomor}
                </div>
                <h3 className="font-jakarta mb-3 text-[22px] font-semibold tracking-tight text-white">
                  {peran}
                </h3>
                <p className="font-jakarta text-on-dark text-sm leading-relaxed">
                  {isi}
                </p>
                <ul className="mt-6 space-y-2.5 border-t border-white/10 pt-5">
                  {poin.map((item) => (
                    <li
                      key={item}
                      className="font-jakarta text-on-dark-soft flex items-center gap-2.5 text-xs"
                    >
                      <Check className="text-lime h-3.5 w-3.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="font-jakarta text-on-dark mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/10 pt-8 text-xs">
            <span className="inline-flex items-center gap-2">
              <span className="bg-lime h-2 w-2 rounded-full" />
              Masuk dengan akun kampus
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="bg-lime h-2 w-2 rounded-full" />
              Hak akses otomatis sesuai peran
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="bg-lime h-2 w-2 rounded-full" />
              Satu riwayat untuk semua
            </span>
          </div>
        </div>
      </section>

      <section
        id="alur"
        data-reveal
        className="border-cream-border reveal scroll-mt-24 border-b bg-white px-6 py-24 md:py-28 lg:px-12"
      >
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Alur pelaporan"
            title="Tiga langkah, dari lapor sampai selesai"
            description="Alur sederhana yang menjaga laporan tetap jelas dan tidak tertukar dengan obrolan harian."
            align="center"
          />

          <div
            data-stagger
            className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3"
          >
            {[
              {
                nomor: '01',
                judul: 'Lapor',
                isi: 'Pilih kategori kerusakan, unggah foto, dan kirim laporan. Deskripsi singkat membantu admin memahami kondisi di lapangan.',
                cek: 'Tanpa instal aplikasi',
                Ikon: Camera,
                gelap: true,
              },
              {
                nomor: '02',
                judul: 'Verifikasi',
                isi: 'Admin memeriksa laporan dan menandainya valid atau ditolak. Status langsung berubah dan bisa dipantau pelapor.',
                cek: 'Status berubah real-time',
                Ikon: Zap,
                gelap: false,
              },
              {
                nomor: '03',
                judul: 'Selesai',
                isi: 'Setelah perbaikan dilakukan, admin memperbarui status menjadi selesai. Riwayat laporan tetap tersimpan.',
                cek: 'Riwayat tersimpan',
                Ikon: ShieldCheck,
                gelap: true,
              },
            ].map((langkah) => (
              <article
                key={langkah.nomor}
                className="group border-cream-border hover:border-lime relative flex flex-col justify-between overflow-hidden rounded-[24px] border bg-white p-8 transition-colors"
              >
                <span
                  aria-hidden="true"
                  className="font-jakarta text-forest/10 pointer-events-none absolute -top-4 right-4 text-[96px] leading-none font-bold tracking-tight"
                >
                  {langkah.nomor}
                </span>
                <div className="relative">
                  <div className="mb-8 flex items-center justify-between">
                    <div
                      className={
                        langkah.gelap
                          ? 'bg-forest text-lime flex h-12 w-12 items-center justify-center rounded-full'
                          : 'bg-lime text-forest flex h-12 w-12 items-center justify-center rounded-full'
                      }
                    >
                      <langkah.Ikon className="h-5 w-5" />
                    </div>
                    <span className="border-cream-border font-jakarta text-muted-ink rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase">
                      Langkah {langkah.nomor}
                    </span>
                  </div>
                  <h3 className="font-jakarta text-forest mb-2 text-xl font-semibold">
                    {langkah.judul}
                  </h3>
                  <p className="font-jakarta text-muted-ink text-sm leading-relaxed">
                    {langkah.isi}
                  </p>
                </div>
                <div className="border-cream-border font-jakarta text-forest relative mt-6 flex items-center gap-2 border-t pt-4 text-xs font-medium">
                  <Check className="text-forest h-4 w-4" />
                  {langkah.cek}
                </div>
              </article>
            ))}
          </div>

          <div className="border-cream-border bg-cream mt-8 rounded-[24px] border p-6 md:p-8">
            <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
              <h3 className="font-jakarta text-forest text-sm font-semibold">
                Perjalanan status laporan
              </h3>
              <span className="font-jakarta text-muted-ink text-xs">
                Setiap perubahan tercatat dan bisa ditinjau kembali.
              </span>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {STATUS.map((status) => (
                <span
                  key={status}
                  className={
                    status === 'Ditolak'
                      ? 'border-cream-chip font-jakarta text-muted-ink inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-[10px] font-semibold uppercase'
                      : 'font-jakarta text-forest border-lime-deep inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-[10px] font-semibold uppercase'
                  }
                >
                  <span
                    className={
                      status === 'Ditolak'
                        ? 'bg-cream-chip h-1.5 w-1.5 rounded-full'
                        : 'bg-forest h-1.5 w-1.5 rounded-full'
                    }
                  />
                  {status}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        data-reveal
        className="reveal bg-lime relative overflow-hidden px-6 py-20 md:py-24 lg:px-12"
      >
        <div
          aria-hidden="true"
          className="border-forest/10 absolute -top-32 -right-20 h-80 w-80 rounded-full border-[32px]"
        />
        <div
          aria-hidden="true"
          className="border-forest/10 absolute -bottom-40 left-1/3 h-72 w-72 rounded-full border-[24px]"
        />

        <div className="relative mx-auto flex max-w-7xl flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="font-jakarta text-forest/80 mb-4 text-[11px] font-semibold tracking-wider uppercase">
              Mulai sekarang
            </div>
            <h2 className="font-jakarta text-forest max-w-3xl text-[34px] leading-[1.1] font-bold tracking-tight md:text-5xl">
              Siap melaporkan kerusakan di sekitarmu?
            </h2>
            <p className="font-jakarta text-forest/80 mt-4 max-w-xl text-[15px] leading-relaxed">
              Masuk dengan akun kampus, lalu kirim laporan pertamamu. Tidak
              perlu chat admin atau menebak harus menghubungi siapa.
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-3">
            <Link
              to="/login"
              className="group border-forest bg-forest inline-flex items-center rounded-full border p-[2px] transition-transform duration-150 hover:scale-[0.97]"
            >
              <span className="bg-lime font-jakarta text-forest flex h-12 items-center rounded-full px-6 text-sm font-semibold">
                Masuk sekarang
              </span>
              <span className="bg-forest text-lime ml-[-2px] flex h-12 w-12 items-center justify-center rounded-full">
                <ArrowUpRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </Link>
            <span className="font-jakarta text-forest/80 text-xs">
              Akun kampus · Tanpa instal aplikasi
            </span>
          </div>
        </div>
      </section>

      <footer
        data-reveal
        className="reveal border-forest-badge bg-forest text-on-dark-soft border-t"
      >
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-12">
          <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Link to="/" className="mb-4 flex items-center gap-2.5">
                <span className="bg-lime text-forest flex h-8 w-8 items-center justify-center rounded-lg">
                  <Building2 className="h-5 w-5" />
                </span>
                <span className="font-jakarta text-xl font-bold tracking-tight text-white">
                  Facility Report<span className="text-lime">.</span>
                </span>
              </Link>
              <p className="font-jakarta text-on-dark mb-6 max-w-sm text-sm leading-relaxed">
                Sistem pelaporan kerusakan sarana kampus. Menghubungkan
                mahasiswa, admin, dan pengelola fasilitas dalam satu alur yang
                tercatat.
              </p>
              <div className="font-jakarta text-on-dark inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs">
                <span className="bg-lime h-2 w-2 rounded-full" />
                Status API: <ApiStatus />
              </div>
            </div>

            <div className="lg:col-span-2 lg:col-start-6">
              <div className="font-jakarta mb-4 text-[11px] font-semibold tracking-wider text-white uppercase">
                Navigasi
              </div>
              <ul className="font-jakarta space-y-3 text-sm">
                <li>
                  <a
                    href="#fitur"
                    className="hover:text-lime transition-colors"
                  >
                    Fitur
                  </a>
                </li>
                <li>
                  <a
                    href="#peran"
                    className="hover:text-lime transition-colors"
                  >
                    Peran
                  </a>
                </li>
                <li>
                  <a href="#alur" className="hover:text-lime transition-colors">
                    Alur kerja
                  </a>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="hover:text-lime transition-colors"
                  >
                    Masuk
                  </Link>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-2">
              <div className="font-jakarta mb-4 text-[11px] font-semibold tracking-wider text-white uppercase">
                Kategori
              </div>
              <ul className="font-jakarta space-y-3 text-sm">
                {KATEGORI.map((kategori) => (
                  <li key={kategori}>{kategori}</li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-2">
              <div className="font-jakarta mb-4 text-[11px] font-semibold tracking-wider text-white uppercase">
                Akses
              </div>
              <ul className="font-jakarta space-y-3 text-sm">
                <li>
                  <Link
                    to="/login"
                    className="hover:text-lime transition-colors"
                  >
                    Masuk dengan NIM
                  </Link>
                </li>
                <li>Mahasiswa</li>
                <li>Admin</li>
                <li>Super admin</li>
              </ul>
            </div>
          </div>

          <div className="border-forest-badge font-jakarta text-on-dark-soft flex flex-col items-center justify-between gap-4 border-t pt-8 text-xs md:flex-row">
            <p className="text-center md:text-left">
              © 2026 Facility Report. Sistem pelaporan fasilitas kampus.
            </p>
            <div className="flex items-center gap-6">
              <span className="inline-flex items-center gap-1.5">
                <span className="bg-lime h-2 w-2 rounded-full" />
                Foto &amp; kategori
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="bg-lime h-2 w-2 rounded-full" />
                Riwayat status
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
