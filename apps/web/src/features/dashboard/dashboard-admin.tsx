import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  PRIORITAS_LABEL,
  errorMessage,
  useLaporanList,
  type Laporan,
  type LaporanKategori,
  type PrioritasKategori,
} from '@/features/laporan/laporan-query'
import { PrioritasBadge } from '@/features/laporan/prioritas-badge'
import { StatusBadge } from '@/features/laporan/status-badge'
import { cn } from '@/lib/utils'

// Gaya kartu disamakan dengan dashboard user: putih, border tipis, shadow lembut.
const CARD_CLASS =
  'rounded-[26px] border border-neutral-200/70 bg-white shadow-sm'

// Lebar kolom daftar laporan: Foto | Judul | Prioritas | Status.
// Dipakai bersama oleh baris header dan baris data supaya selalu sejajar.
const KOLOM_DESKTOP = 'md:grid-cols-[56px_minmax(0,1fr)_110px_120px]'

// Pilihan jumlah baris per halaman. Default 5.
const UKURAN_HALAMAN = [5, 10, 20]

// Urutan prioritas dari yang paling mendesak. Label di luar tiga ini
// (kalau ada) ditaruh paling belakang.
// Sengaja tidak di-export: file .tsx cuma boleh export komponen supaya
// react-refresh tidak kasih warning baru.
const URUTAN_LABEL = ['tinggi', 'sedang', 'rendah']

function urutanLabel(label: string): number {
  const index = URUTAN_LABEL.indexOf(label.toLowerCase())
  return index === -1 ? URUTAN_LABEL.length : index
}

function rankPrioritas(kategori: string | null | undefined): number {
  if (!kategori) return URUTAN_LABEL.length
  return urutanLabel(PRIORITAS_LABEL[kategori as PrioritasKategori] ?? kategori)
}

// Urutan status mengikuti alur kerja laporan. Status yang tidak ada di
// daftar ini ditaruh paling belakang. Sesuaikan kalau nama status di
// backend berbeda.
const STATUS_URUTAN = [
  'menunggu_verifikasi',
  'terverifikasi',
  'diproses',
  'selesai',
  'ditolak',
]

function rankStatus(status: string): number {
  const index = STATUS_URUTAN.indexOf(status)
  return index === -1 ? STATUS_URUTAN.length : index
}

type KolomUrut = 'judul' | 'prioritas' | 'status'
type ArahUrut = 1 | -1

// Nomor halaman yang ditampilkan di pagination. Kalau halamannya banyak,
// bagian tengah diringkas dengan '…' (contoh: 1 … 4 5 6 … 12).
function daftarHalaman(sekarang: number, total: number): Array<number | '…'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const set = new Set<number>([1, total, sekarang, sekarang - 1, sekarang + 1])
  if (sekarang <= 3) [2, 3, 4].forEach((n) => set.add(n))
  if (sekarang >= total - 2) {
    ;[total - 1, total - 2, total - 3].forEach((n) => set.add(n))
  }

  const urut = [...set]
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b)

  const hasil: Array<number | '…'> = []
  urut.forEach((n, i) => {
    if (i > 0 && n - urut[i - 1] > 1) hasil.push('…')
    hasil.push(n)
  })
  return hasil
}

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

  // Semua laporan, diurutkan dari yang terbaru. Diurutkan di sini (bukan
  // memakai ringkasan.antrian) supaya daftar ini tidak bergantung pada
  // aturan filter di hitungRingkasan.
  const semuaLaporan = [...laporan].sort((a, b) =>
    (b.created_at ?? '').localeCompare(a.created_at ?? ''),
  )

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

      <LaporanTerbaru laporan={semuaLaporan} onBukaFoto={onBukaFoto} />
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

// Tombol judul kolom yang bisa diklik untuk mengurutkan.
function KolomUrut({
  label,
  aktif,
  arah,
  onClick,
}: {
  label: string
  aktif: boolean
  arah: ArahUrut
  onClick: () => void
}) {
  const Icon = !aktif ? ArrowUpDown : arah === 1 ? ArrowUp : ArrowDown

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Urutkan berdasarkan ${label}`}
      className={cn(
        'inline-flex items-center gap-1.5 transition-colors hover:text-neutral-900',
        aktif && 'text-neutral-900',
      )}
    >
      {label}
      <Icon
        aria-hidden="true"
        className={cn('size-3.5', aktif ? 'opacity-100' : 'opacity-50')}
      />
    </button>
  )
}

// Tombol bulat-persegi di pagination (« ‹ 1 2 3 › »).
function TombolHalaman({
  label,
  ariaLabel,
  onClick,
  disabled,
  aktif,
}: {
  label: string
  ariaLabel: string
  onClick: () => void
  disabled?: boolean
  aktif?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-current={aktif ? 'page' : undefined}
      className={cn(
        'h-10 min-w-10 rounded-xl border border-[#efe9d8] bg-white px-2 text-sm transition-colors',
        'hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-white',
        aktif &&
          'border-[#0f3d2e] bg-[#0f3d2e] font-bold text-white hover:bg-[#0f3d2e]',
      )}
    >
      {label}
    </button>
  )
}

// Menampilkan semua laporan terbaru dengan header kolom yang bisa
// diurutkan (Judul, Prioritas, Status) dan pagination. Klik header
// pertama: naik, kedua: turun, ketiga: kembali ke urutan terbaru.
// Setiap kali urutan atau jumlah baris berubah, halaman kembali ke 1.
function LaporanTerbaru({
  laporan,
  onBukaFoto,
}: {
  laporan: Laporan[]
  onBukaFoto: (src: string) => void
}) {
  const [kolom, setKolom] = useState<KolomUrut | null>(null)
  const [arah, setArah] = useState<ArahUrut>(1)
  const [halaman, setHalaman] = useState(1)
  const [ukuran, setUkuran] = useState(UKURAN_HALAMAN[0])

  function toggleUrut(target: KolomUrut) {
    if (kolom !== target) {
      setKolom(target)
      setArah(1)
    } else if (arah === 1) {
      setArah(-1)
    } else {
      setKolom(null)
      setArah(1)
    }
    setHalaman(1)
  }

  const urut = kolom
    ? [...laporan].sort((a, b) => {
        if (kolom === 'judul') {
          return arah * a.deskripsi.localeCompare(b.deskripsi, 'id')
        }
        if (kolom === 'prioritas') {
          return (
            arah *
            (rankPrioritas(a.prioritas_kategori) -
              rankPrioritas(b.prioritas_kategori))
          )
        }
        return arah * (rankStatus(a.status) - rankStatus(b.status))
      })
    : laporan

  // Halaman dijaga supaya tidak melewati total (misal data berkurang
  // setelah refetch).
  const totalHalaman = Math.max(1, Math.ceil(urut.length / ukuran))
  const halamanAktif = Math.min(halaman, totalHalaman)
  const tampil = urut.slice(
    (halamanAktif - 1) * ukuran,
    halamanAktif * ukuran,
  )

  const keterangan =
    laporan.length === 0
      ? 'Belum ada laporan masuk'
      : `Menampilkan ${laporan.length} laporan`

  return (
    <section className={cn('p-6', CARD_CLASS)}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold">Laporan terbaru</h2>
        <p className="text-sm text-neutral-500">{keterangan}</p>
      </div>

      {laporan.length === 0 ? (
        <p className="mt-6 text-center text-sm text-neutral-400">
          Belum ada laporan masuk.
        </p>
      ) : (
        <>
          {/* Header kolom: hanya tampil di layar md ke atas. */}
          <div
            className={cn(
              'mt-4 hidden items-center gap-x-4 rounded-xl bg-[#faf7ee] px-3 py-2.5 text-xs font-semibold text-neutral-500 md:grid',
              KOLOM_DESKTOP,
            )}
          >
            <span>Foto</span>
            <span>
              <KolomUrut
                label="Judul"
                aktif={kolom === 'judul'}
                arah={arah}
                onClick={() => toggleUrut('judul')}
              />
            </span>
            <span>
              <KolomUrut
                label="Prioritas"
                aktif={kolom === 'prioritas'}
                arah={arah}
                onClick={() => toggleUrut('prioritas')}
              />
            </span>
            <span>
              <KolomUrut
                label="Status"
                aktif={kolom === 'status'}
                arah={arah}
                onClick={() => toggleUrut('status')}
              />
            </span>
          </div>

          <ul className="mt-1 divide-y divide-neutral-100">
            {tampil.map((item) => (
              <li
                key={item.id}
                className={cn(
                  'grid grid-cols-[56px_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 px-3 py-3 md:gap-x-4',
                  KOLOM_DESKTOP,
                )}
              >
                <FotoThumb foto={item.foto} onBuka={onBukaFoto} />

                <div className="min-w-0">
                  <p className="truncate font-medium">{item.deskripsi}</p>
                  <p className="mt-0.5 truncate text-xs text-neutral-500">
                    {kategoriLabel(item.kategori)} · {item.lokasi} ·{' '}
                    {formatTanggal(item.created_at)}
                  </p>
                  {item.pelapor && (
                    <p className="mt-0.5 truncate text-xs text-neutral-500">
                      Pelapor:{' '}
                      <span className="font-semibold text-[#0f3d2e]">
                        {item.pelapor.name}
                      </span>
                    </p>
                  )}
                </div>

                <div className="col-start-2 md:col-start-auto">
                  <PrioritasBadge kategori={item.prioritas_kategori ?? null} />
                </div>
                <div className="col-start-2 md:col-start-auto">
                  <StatusBadge status={item.status} />
                </div>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 border-t border-[#efe9d8] pt-4 text-sm md:justify-between">
            <div className="flex items-center gap-2">
              <Select
                value={String(ukuran)}
                onValueChange={(value) => {
                  setUkuran(Number(value ?? UKURAN_HALAMAN[0]))
                  setHalaman(1)
                }}
              >
                <SelectTrigger
                  aria-label="Jumlah baris per halaman"
                  className="w-[76px] shrink-0"
                >
                  <SelectValue>{ukuran}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {UKURAN_HALAMAN.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>Jumlah baris per halaman</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <span className="mr-2 font-medium">
                Halaman {halamanAktif} dari {totalHalaman}
              </span>

              <TombolHalaman
                label="«"
                ariaLabel="Halaman pertama"
                onClick={() => setHalaman(1)}
                disabled={halamanAktif === 1}
              />
              <TombolHalaman
                label="‹"
                ariaLabel="Halaman sebelumnya"
                onClick={() => setHalaman(halamanAktif - 1)}
                disabled={halamanAktif === 1}
              />

              {daftarHalaman(halamanAktif, totalHalaman).map((n, i) =>
                n === '…' ? (
                  <span key={`titik-${i}`} className="px-1 text-neutral-400">
                    …
                  </span>
                ) : (
                  <TombolHalaman
                    key={n}
                    label={String(n)}
                    ariaLabel={`Halaman ${n}`}
                    onClick={() => setHalaman(n)}
                    aktif={n === halamanAktif}
                  />
                ),
              )}

              <TombolHalaman
                label="›"
                ariaLabel="Halaman berikutnya"
                onClick={() => setHalaman(halamanAktif + 1)}
                disabled={halamanAktif === totalHalaman}
              />
              <TombolHalaman
                label="»"
                ariaLabel="Halaman terakhir"
                onClick={() => setHalaman(totalHalaman)}
                disabled={halamanAktif === totalHalaman}
              />
            </div>
          </div>
        </>
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