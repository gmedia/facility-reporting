import { useEffect, useState } from 'react'
import { ChevronDown, ImageIcon, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { User } from '@/features/auth/auth-query'
import { DashboardActions } from '@/features/dashboard/dashboard-actions'
import { formatTanggal } from '@/features/dashboard/dashboard-query'
import { DashboardShell } from '@/features/dashboard/dashboard-shell'
import {
  LaporanHarianCard,
  PerluTindakanCards,
  StatusBarCard,
} from '@/features/dashboard/dashboard-summary'
import {
  filterAntrian,
  hitungRingkasan,
  identitas,
  laporanPerHari,
  type AntrianFilter,
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

// Gaya kartu disamakan dengan dashboard user: putih, border tipis, shadow lembut.
const CARD_CLASS =
  'rounded-[26px] border border-neutral-200/70 bg-white shadow-sm'

// Pilihan status yang bisa dipilih user di kartu "Laporan Antrian".
type StatusPilihan =
  | 'semua'
  | 'menunggu_verifikasi'
  | 'valid'
  | 'diproses'
  | 'selesai'

const STATUS_OPSI: ReadonlyArray<{ value: StatusPilihan; label: string }> = [
  { value: 'semua', label: 'Semua status' },
  { value: 'menunggu_verifikasi', label: 'Menunggu' },
  { value: 'valid', label: 'Terverifikasi' },
  { value: 'diproses', label: 'Diproses' },
  { value: 'selesai', label: 'Selesai' },
]

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

// Waktu dibuat dalam milidetik, aman kalau `created_at` kosong atau
// formatnya tidak valid (dianggap 0 supaya jatuh ke urutan paling bawah).
function waktu(item: Laporan): number {
  const t = item.created_at ? new Date(item.created_at).getTime() : 0
  return Number.isNaN(t) ? 0 : t
}

// Bobot urutan prioritas: makin besar makin di atas. Laporan tanpa
// prioritas (`null`, belum diproses backend) bobotnya 0 sehingga di bawah.
const BOBOT_PRIORITAS: Record<string, number> = {
  tinggi: 3,
  sedang: 2,
  rendah: 1,
}

function bobotPrioritas(item: Laporan): number {
  return BOBOT_PRIORITAS[item.prioritas_kategori ?? ''] ?? 0
}

export function DashboardAdmin({
  user,
  filter,
}: {
  user: User
  filter: AntrianFilter
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
      <div className="flex flex-col gap-6">
        {laporan.isPending ? (
          <DashboardSkeleton />
        ) : laporan.isError ? (
          <DashboardError
            error={laporan.error}
            onRetry={() => void laporan.refetch()}
          />
        ) : (
          <DashboardContent
            laporan={laporan.data}
            filter={filter}
            onBukaFoto={setFotoBesar}
          />
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

function StatusSelect({
  value,
  onChange,
}: {
  value: StatusPilihan
  onChange: (value: StatusPilihan) => void
}) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Filter status laporan</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as StatusPilihan)}
        className="cursor-pointer appearance-none rounded-full border border-emerald-100 bg-emerald-50 py-1 pr-8 pl-3 text-xs font-medium text-emerald-800 transition-colors outline-none hover:bg-emerald-100 focus-visible:ring-2 focus-visible:ring-[#1f6b4f]/35"
      >
        {STATUS_OPSI.map((opsi) => (
          <option key={opsi.value} value={opsi.value}>
            {opsi.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-emerald-800"
      />
    </label>
  )
}

// Thumbnail foto di baris tabel. Kalau `foto` null atau gagal dimuat,
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
function FotoLightbox({
  src,
  onTutup,
}: {
  src: string
  onTutup: () => void
}) {
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

function DashboardContent({
  laporan,
  filter,
  onBukaFoto,
}: {
  laporan: Laporan[]
  filter: AntrianFilter
  onBukaFoto: (src: string) => void
}) {
  const [status, setStatus] = useState<StatusPilihan>('semua')

  const ringkasan = hitungRingkasan(laporan)
  // Dashboard cuma ringkasan: maksimal 5 baris. Urutan: prioritas tertinggi
  // dulu, lalu yang paling baru. Kalau waktunya sama persis, ID yang lebih
  // besar didahulukan. Daftar lengkap tetap ada di /verifikasi.
  const antrian = filterAntrian(ringkasan.antrian, filter).filter(
    (item) => status === 'semua' || item.status === status,
  )
  const antrianUrut = antrian
    .slice()
    .sort((a, b) => {
      const prioritas = bobotPrioritas(b) - bobotPrioritas(a)
      if (prioritas !== 0) return prioritas
      const selisih = waktu(b) - waktu(a)
      return selisih !== 0 ? selisih : b.id - a.id
    })
    .slice(0, 5)
  const harian = laporanPerHari(laporan)

  return (
    <div className="flex flex-col gap-6">
      <PerluTindakanCards ringkasan={ringkasan} />
      <StatusBarCard ringkasan={ringkasan} />

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <section className={`min-w-0 p-6 ${CARD_CLASS}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold">Laporan Antrian</h2>
              <StatusSelect value={status} onChange={setStatus} />
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
              Total {ringkasan.total}
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[26rem] text-sm">
              <thead>
                <tr className="text-left text-neutral-400">
                  <th className="pb-2 font-medium">Laporan</th>
                  <th className="pb-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {antrianUrut.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="py-6 text-center text-neutral-400"
                    >
                      {emptyText(filter, status)}
                    </td>
                  </tr>
                ) : (
                  antrianUrut.map((item) => (
                    <tr key={item.id} className="border-t border-neutral-100">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <FotoThumb foto={item.foto} onBuka={onBukaFoto} />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">{item.deskripsi}</p>
                              <PrioritasBadge
                                kategori={item.prioritas_kategori ?? null}
                              />
                            </div>
                            <p className="mt-0.5 text-xs text-neutral-400">
                              {kategoriLabel(item.kategori)} · {item.lokasi} ·{' '}
                              {formatTanggal(item.created_at)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <span className="whitespace-nowrap">
                          <StatusBadge status={item.status} />
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <LaporanHarianCard harian={harian} />
      </div>
    </div>
  )
}

function kategoriLabel(kategori: string): string {
  return KATEGORI_LABEL[kategori as LaporanKategori] ?? kategori
}

function emptyText(filter: AntrianFilter, status: StatusPilihan): string {
  if (status !== 'semua') {
    const label =
      STATUS_OPSI.find((opsi) => opsi.value === status)?.label ?? status
    return `Belum ada laporan dengan status ${label.toLowerCase()}.`
  }
  if (filter === 'menunggu') {
    return 'Belum ada laporan yang menunggu verifikasi.'
  }
  if (filter === 'terverifikasi') {
    return 'Belum ada laporan yang sudah terverifikasi.'
  }
  return 'Belum ada laporan masuk.'
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-24 rounded-[26px]" />
        <Skeleton className="h-24 rounded-[26px]" />
      </div>
      <Skeleton className="h-36 rounded-[26px]" />
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-72 rounded-[26px]" />
        <Skeleton className="h-72 rounded-[26px]" />
      </div>
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