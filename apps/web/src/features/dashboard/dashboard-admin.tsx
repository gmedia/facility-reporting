import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Ban,
  Clock,
  ClipboardList,
  ImageIcon,
  ShieldCheck,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { User } from '@/features/auth/auth-query'
import { DashboardActions } from '@/features/dashboard/dashboard-actions'
import { formatTanggal } from '@/features/dashboard/dashboard-query'
import { DashboardShell } from '@/features/dashboard/dashboard-shell'
import {
  hitungRingkasan,
  identitas,
  type AntrianFilter,
  type RingkasanDashboard,
} from '@/features/dashboard/dashboard-utils'
import {
  KATEGORI_LABEL,
  errorMessage,
  useLaporanList,
  type Laporan,
  type LaporanKategori,
} from '@/features/laporan/laporan-query'
import { PrioritasBadge } from '@/features/laporan/prioritas-badge'
import { StatusBadge } from '@/features/laporan/status-badge'
import { cn } from '@/lib/utils'

// Gaya kartu disamakan dengan dashboard user: putih, border tipis, shadow lembut.
const CARD_CLASS =
  'rounded-[26px] border border-neutral-200/70 bg-white shadow-sm'

// Jumlah laporan yang ditampilkan di kartu "Laporan terbaru".
const JUMLAH_TERBARU = 3

// `foto` disimpan sebagai path relatif di disk `public` (contoh:
// "laporan/abc.jpg"), bukan URL lengkap. Logikanya sama dengan fotoUrl di
// riwayat-list.tsx dan verifikasi-page.tsx, diduplikat di sini supaya
// file lain tidak ikut tersentuh.
function fotoUrl(foto: string): string {
  if (/^(https?:|data:|blob:)/.test(foto)) return foto

  const dasar = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
  const origin = /^https?:\/\//.test(dasar)
    ? dasar.replace(/\/api\/v\d+\/?$/, '')
    : ''

  return `${origin}/storage/${foto.replace(/^\/+/, '')}`
}

function kategoriLabel(kategori: string): string {
  return KATEGORI_LABEL[kategori as LaporanKategori] ?? kategori
}

// `filter` masih diterima karena route mengirimnya (?filter=...), tapi
// dashboard ini tidak lagi menampilkan tabel antrian, jadi tidak dipakai.
export function DashboardAdmin({
  user,
}: {
  user: User
  filter?: AntrianFilter
}) {
  const laporan = useLaporanList()
  const [fotoBesar, setFotoBesar] = useState<string | null>(null)

  // Jumlah laporan yang menunggu verifikasi: dipakai untuk badge di
  // sidebar (menu Verifikasi).
  const menunggu = laporan.data?.filter(
    (item) => item.status === 'menunggu_verifikasi',
  ).length

  return (
    <DashboardShell
      user={user}
      menunggu={menunggu}
      header={<DashboardIntro user={user} />}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        {laporan.isPending ? (
          <DashboardSkeleton />
        ) : laporan.isError ? (
          <DashboardError
            error={laporan.error}
            onRetry={() => void laporan.refetch()}
          />
        ) : (
          <DashboardContent laporan={laporan.data} onBukaFoto={setFotoBesar} />
        )}
      </div>

      {fotoBesar && (
        <FotoLightbox src={fotoBesar} onTutup={() => setFotoBesar(null)} />
      )}
    </DashboardShell>
  )
}

// Ditaruh di bar paling atas (prop `header` milik DashboardShell).
function DashboardIntro({ user }: { user: User }) {
  return (
    <div className="flex w-full items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <h1 className="truncate text-lg leading-tight font-bold tracking-tight">
          Halo, {user.name}
        </h1>
        <p className="truncate text-xs text-neutral-500">
          {identitas(user)} · Semua gedung
        </p>
      </div>
      <div className="shrink-0">
        <DashboardActions role={user.role} />
      </div>
    </div>
  )
}

function DashboardContent({
  laporan,
  onBukaFoto,
}: {
  laporan: Laporan[]
  onBukaFoto: (src: string) => void
}) {
  const ringkasan = hitungRingkasan(laporan)

  return (
    <>
      <HeroAntrian ringkasan={ringkasan} />
      <TotalKartu ringkasan={ringkasan} />

      <section
        aria-label="Ringkasan status"
        className="grid grid-cols-2 gap-4 xl:grid-cols-4"
      >
        <StatKartu
          label="Menunggu"
          jumlah={ringkasan.menunggu}
          caption="Belum diverifikasi"
          Icon={Clock}
          iconClass="text-amber-100"
        />
        <StatKartu
          label="Diproses"
          jumlah={ringkasan.diproses}
          caption="Sedang dikerjakan"
          Icon={Wrench}
          iconClass="text-sky-100"
        />
        <StatKartu
          label="Selesai"
          jumlah={ringkasan.selesai}
          caption="Sudah ditangani"
          Icon={ShieldCheck}
          iconClass="text-emerald-100"
        />
        <StatKartu
          label="Ditolak"
          jumlah={ringkasan.ditolak}
          caption="Tidak lolos verifikasi"
          Icon={Ban}
          iconClass="text-red-100"
        />
      </section>

      <LaporanTerbaru
        // `antrian` sudah diurutkan dari yang terbaru oleh hitungRingkasan.
        laporan={ringkasan.antrian.slice(0, JUMLAH_TERBARU)}
        onBukaFoto={onBukaFoto}
      />
    </>
  )
}

// Kartu hijau tua di paling atas, susunannya sama dengan dashboard user:
// chip jumlah, judul, penjelasan, lalu satu tombol utama.
function HeroAntrian({ ringkasan }: { ringkasan: RingkasanDashboard }) {
  const ada = ringkasan.menunggu > 0
  const adaTertunda = ringkasan.terverifikasi > 0

  return (
    <section
      aria-label="Perlu tindakan"
      className="relative overflow-hidden rounded-[26px] bg-[#0f3d2e] px-8 py-7 text-white"
    >
      <span
        aria-hidden="true"
        className="absolute -top-20 -right-14 size-64 rounded-full bg-white/5"
      />
      <span
        aria-hidden="true"
        className="absolute -right-4 -bottom-28 size-52 rounded-full bg-white/5"
      />

      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium ring-1 ring-white/10">
            <ClipboardList aria-hidden="true" className="size-4" />
            {ringkasan.menunggu} laporan menunggu verifikasi
          </span>

          {/* Chip kedua hanya muncul kalau ada laporan terverifikasi yang
              belum dikerjakan. Kalau 0, tidak ditampilkan. */}
          {adaTertunda && (
            <Link
              to="/verifikasi"
              search={{ filter: 'terverifikasi' }}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium ring-1 ring-white/10 transition-colors hover:bg-white/20"
            >
              <ShieldCheck aria-hidden="true" className="size-4" />
              {ringkasan.terverifikasi} terverifikasi, belum dikerjakan
            </Link>
          )}
        </div>

        <h2 className="mt-4 text-2xl font-semibold">
          {ada ? 'Ada laporan yang perlu dicek?' : 'Semua laporan sudah dicek'}
        </h2>
        <p className="mt-1.5 max-w-lg text-sm text-emerald-100/80">
          {ada
            ? 'Cek foto dan keterangannya, lalu verifikasi atau tolak laporan yang masuk.'
            : 'Belum ada laporan baru yang perlu Anda verifikasi. Bagus!'}
        </p>

        {ada && (
          <Link
            to="/verifikasi"
            search={{ filter: 'menunggu' }}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0f3d2e] transition-colors hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
          >
            Cek sekarang
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        )}
      </div>
    </section>
  )
}

function TotalKartu({ ringkasan }: { ringkasan: RingkasanDashboard }) {
  return (
    <section
      aria-label="Total laporan"
      className={cn('relative overflow-hidden px-6 py-5', CARD_CLASS)}
    >
      <ClipboardList
        aria-hidden="true"
        strokeWidth={1.5}
        className="absolute -top-3 -right-3 size-24 text-neutral-100"
      />
      <p className="relative text-xs font-semibold tracking-wider text-neutral-500 uppercase">
        Total
      </p>
      <p className="relative mt-1 text-4xl leading-none font-bold tabular-nums">
        {ringkasan.total}
      </p>
      <p className="relative mt-2 text-sm text-neutral-500">
        Semua laporan · {ringkasan.diproses} sedang dikerjakan
      </p>
    </section>
  )
}

function StatKartu({
  label,
  jumlah,
  caption,
  Icon,
  iconClass,
}: {
  label: string
  jumlah: number
  caption: string
  Icon: LucideIcon
  iconClass: string
}) {
  return (
    <div className="relative overflow-hidden rounded-[22px] border border-neutral-200/70 bg-white p-5 shadow-sm">
      <Icon
        aria-hidden="true"
        strokeWidth={1.5}
        className={cn('absolute -top-3 -right-3 size-20', iconClass)}
      />
      <p className="relative text-xs font-semibold tracking-wider text-neutral-500 uppercase">
        {label}
      </p>
      <p className="relative mt-1 text-3xl leading-none font-bold tabular-nums">
        {jumlah}
      </p>
      <p className="relative mt-2 text-sm text-neutral-500">{caption}</p>
    </div>
  )
}

function LaporanTerbaru({
  laporan,
  onBukaFoto,
}: {
  laporan: Laporan[]
  onBukaFoto: (src: string) => void
}) {
  return (
    <section className={cn('p-6', CARD_CLASS)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Laporan terbaru</h2>
          <p className="text-sm text-neutral-500">
            Menampilkan {JUMLAH_TERBARU} laporan terakhir
          </p>
        </div>
        <Link
          to="/verifikasi"
          search={{ filter: 'semua' }}
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#1f6b4f] hover:underline focus-visible:outline-none"
        >
          Lihat semua
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>

      {laporan.length === 0 ? (
        <p className="mt-6 text-center text-sm text-neutral-400">
          Belum ada laporan masuk.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-neutral-100">
          {laporan.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-3">
              <FotoThumb foto={item.foto} onBuka={onBukaFoto} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{item.deskripsi}</p>
                  <PrioritasBadge kategori={item.prioritas_kategori ?? null} />
                </div>
                <p className="mt-0.5 truncate text-xs text-neutral-400">
                  {kategoriLabel(item.kategori)} · {item.lokasi}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <StatusBadge status={item.status} />
                <span className="text-xs text-neutral-400">
                  {formatTanggal(item.created_at)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// Thumbnail foto di baris daftar. Kalau `foto` null atau gagal dimuat,
// tetap digambar kotak putus-putus berukuran sama supaya tinggi baris
// tidak melompat dan tidak ada ikon gambar patah.
function FotoThumb({
  foto,
  onBuka,
}: {
  foto: string | null
  onBuka: (src: string) => void
}) {
  const [gagal, setGagal] = useState(false)

  if (foto && !gagal) {
    const src = fotoUrl(foto)

    return (
      <button
        type="button"
        onClick={() => onBuka(src)}
        title="Klik untuk perbesar foto"
        aria-label="Perbesar foto laporan"
        className="size-14 shrink-0 overflow-hidden rounded-xl border border-neutral-200/70 bg-[#f6f7f4] transition hover:ring-2 hover:ring-[#1f6b4f]/35 focus-visible:ring-2 focus-visible:ring-[#1f6b4f]/35 focus-visible:outline-none"
      >
        <img
          src={src}
          alt="Foto laporan"
          loading="lazy"
          onError={() => setGagal(true)}
          className="size-full object-cover"
        />
      </button>
    )
  }

  return (
    <div
      title={foto ? 'Foto tidak termuat' : 'Belum ada foto'}
      className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-[#f6f7f4] text-neutral-400"
    >
      <ImageIcon aria-hidden="true" strokeWidth={1.5} className="size-5" />
    </div>
  )
}

// Foto ukuran besar. Ditutup lewat klik di luar foto, tombol X, atau Esc.
function FotoLightbox({ src, onTutup }: { src: string; onTutup: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onTutup()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onTutup])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Foto laporan"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onTutup}
    >
      <button
        type="button"
        aria-label="Tutup foto"
        onClick={onTutup}
        className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <X aria-hidden="true" className="size-5" />
      </button>
      <img
        src={src}
        alt="Foto laporan diperbesar"
        className="max-h-[85dvh] max-w-full rounded-2xl object-contain"
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-44 rounded-[26px]" />
      <Skeleton className="h-28 rounded-[26px]" />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-28 rounded-[22px]" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-[26px]" />
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
