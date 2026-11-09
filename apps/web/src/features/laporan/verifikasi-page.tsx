import { useEffect, useState } from 'react'
import { ImageIcon, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { User } from '@/features/auth/auth-query'
import { formatTanggal } from '@/features/dashboard/dashboard-query'
import { DashboardShell } from '@/features/dashboard/dashboard-shell'
import { LaporanHarianCard } from '@/features/dashboard/dashboard-summary'
import {
  hitungRingkasan,
  laporanPerHari,
} from '@/features/dashboard/dashboard-utils'
import { PrioritasBadge } from '@/features/laporan/prioritas-badge'
import {
  BATAS_FOTO_BYTE,
  FOTO_ACCEPT,
  FOTO_MIME_IZIN,
  KATEGORI_LABEL,
  KATEGORI_VALUES,
  STATUS_LABEL,
  STATUS_VALUES,
  errorMessage,
  fieldErrors,
  useLaporanList,
  useUpdateLaporanStatus,
  type Laporan,
  type LaporanKategori,
  type LaporanStatus,
} from '@/features/laporan/laporan-query'
import { cn } from '@/lib/utils'

type StatusFilter = 'semua' | LaporanStatus

// Urutan filter ngikutin alur verifikasi, bukan urutan enum backend.
// "Terverifikasi" sengaja dipakai buat status `valid` biar bahasa UI-nya
// sama dengan roadmap; badge status tetap pakai label asli `Valid`.
const FILTERS: ReadonlyArray<{ value: StatusFilter; label: string }> = [
  { value: 'semua', label: 'Semua' },
  { value: 'menunggu_verifikasi', label: 'Menunggu' },
  { value: 'valid', label: 'Terverifikasi' },
  { value: 'diproses', label: 'Diproses' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'ditolak', label: 'Ditolak' },
]

const STATUS_PILL: Record<LaporanStatus, string> = {
  menunggu_verifikasi: 'bg-[#fbe9cc] text-[#b9772a]',
  valid: 'bg-[#dff1f7] text-[#3a8fb0]',
  diproses: 'bg-[#e0f1e8] text-[#2f8059]',
  selesai: 'bg-emerald-100 text-emerald-800',
  ditolak: 'bg-red-100 text-red-800',
}

// Aksi per status mengikuti alur verifikasi. Admin tidak lagi memilih
// status bebas dari dropdown, jadi tidak ada langkah yang terlompat.
const AKSI: Partial<
  Record<
    LaporanStatus,
    ReadonlyArray<{ label: string; ke: LaporanStatus; bahaya?: boolean }>
  >
> = {
  menunggu_verifikasi: [
    { label: 'Verifikasi', ke: 'valid' },
    { label: 'Tolak', ke: 'ditolak', bahaya: true },
  ],
  valid: [{ label: 'Mulai proses', ke: 'diproses' }],
  diproses: [{ label: 'Tandai selesai', ke: 'selesai' }],
  ditolak: [{ label: 'Buka kembali', ke: 'menunggu_verifikasi' }],
}

const CARD = 'rounded-[26px] border-[1.5px] border-[#efe9d8] bg-white p-6'

function kategoriLabel(kategori: string): string {
  return KATEGORI_LABEL[kategori as LaporanKategori] ?? kategori
}

// Waktu dibuat dalam milidetik, aman kalau `created_at` kosong atau
// formatnya tidak valid (dianggap 0 supaya jatuh ke urutan paling bawah).
function waktu(item: Laporan): number {
  const t = item.created_at ? new Date(item.created_at).getTime() : 0
  return Number.isNaN(t) ? 0 : t
}

// `foto` disimpan sebagai path relatif di disk `public` (contoh:
// "laporan/abc.jpg"), bukan URL lengkap. Logikanya sama dengan fotoUrl di
// riwayat-list.tsx (tampilan user), diduplikat di sini supaya halaman
// user tidak ikut tersentuh.
function fotoUrl(foto: string): string {
  if (/^(https?:|data:|blob:)/.test(foto)) return foto

  const dasar = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
  const origin = /^https?:\/\//.test(dasar)
    ? dasar.replace(/\/api\/v\d+\/?$/, '')
    : ''

  return `${origin}/storage/${foto.replace(/^\/+/, '')}`
}

export function VerifikasiPage({ user }: { user: User }) {
  const list = useLaporanList()
  const update = useUpdateLaporanStatus()
  const [filter, setFilter] = useState<StatusFilter>('semua')
  const [cari, setCari] = useState('')
  const [kategori, setKategori] = useState<'semua' | LaporanKategori>('semua')
  // id laporan yang sedang dilihat di panel detail.
  const [pilihId, setPilihId] = useState<number | null>(null)
  const [fotoBesar, setFotoBesar] = useState<string | null>(null)
  // id laporan yang sedang akan ditolak (dialog alasan terbuka).
  const [tolakId, setTolakId] = useState<number | null>(null)
  // id laporan yang sedang akan diselesaikan (dialog foto bukti terbuka).
  const [buktiId, setBuktiId] = useState<number | null>(null)

  const laporan = list.data ?? []
  const ringkasan = hitungRingkasan(laporan)
  const harian = laporanPerHari(laporan)

  const counts = list.data
    ? STATUS_VALUES.reduce(
        (result, status) => {
          result[status] = laporan.filter(
            (item) => item.status === status,
          ).length
          return result
        },
        {} as Record<LaporanStatus, number>,
      )
    : undefined

  // Yang paling baru di atas. Kalau waktunya sama persis, ID yang lebih
  // besar didahulukan.
  const kata = cari.trim().toLowerCase()
  const antrianUrut = ringkasan.antrian
    .filter((item) => filter === 'semua' || item.status === filter)
    .filter((item) => kategori === 'semua' || item.kategori === kategori)
    .filter(
      (item) =>
        !kata ||
        `${item.deskripsi} ${item.lokasi}`.toLowerCase().includes(kata),
    )
    .sort((a, b) => {
      const selisih = waktu(b) - waktu(a)
      return selisih !== 0 ? selisih : b.id - a.id
    })

  // Kalau laporan yang dipilih hilang dari daftar (karena filter),
  // otomatis jatuh ke laporan teratas.
  const terpilih =
    antrianUrut.find((item) => item.id === pilihId) ?? antrianUrut[0]

  const resetFilter = () => {
    setFilter('semua')
    setKategori('semua')
    setCari('')
  }

  // Mengembalikan true kalau berhasil, supaya dialog tahu kapan
  // boleh ditutup.
  const ubahStatus = async (
    id: number,
    status: LaporanStatus,
    tambahan?: { alasan?: string; foto?: File },
  ): Promise<boolean> => {
    try {
      await update.mutateAsync({ id, status, ...tambahan })
      toast.success(`Status diubah ke ${STATUS_LABEL[status]}`)
      return true
    } catch (error) {
      // 422 dari Laravel membawa detail per field di `errors`. Tampilkan
      // pesan pertamanya supaya kelihatan apa yang ditolak backend.
      const detail = fieldErrors(error)
      const pesanField = detail ? Object.values(detail).flat()[0] : undefined
      toast.error(pesanField ?? errorMessage(error))
      return false
    }
  }

  // "Ditolak" butuh alasan dan "Selesai" butuh foto bukti, jadi buka
  // dialognya dulu. Status lain langsung disimpan.
  const pilihStatus = (id: number, status: LaporanStatus) => {
    if (status === 'ditolak') {
      setTolakId(id)
      return
    }
    if (status === 'selesai') {
      setBuktiId(id)
      return
    }
    void ubahStatus(id, status)
  }

  const kirimPenolakan = async (alasan: string) => {
    if (tolakId === null) return
    const berhasil = await ubahStatus(tolakId, 'ditolak', { alasan })
    if (berhasil) setTolakId(null)
  }

  const kirimBukti = async (foto: File) => {
    if (buktiId === null) return
    const berhasil = await ubahStatus(buktiId, 'selesai', { foto })
    if (berhasil) setBuktiId(null)
  }

  return (
    <DashboardShell
      user={user}
      menunggu={counts?.menunggu_verifikasi}
      header={
        <div className="min-w-0 leading-tight">
          <h1 className="truncate text-xl font-bold tracking-tight">
            Verifikasi
          </h1>
          <p className="truncate text-sm text-[#8a8f87]">
            Antrian laporan · Semua gedung
          </p>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {list.isPending ? (
          <VerifikasiSkeleton />
        ) : list.isError ? (
          <VerifikasiError
            error={list.error}
            onRetry={() => void list.refetch()}
          />
        ) : (
          <>
            <FilterStats
              filter={filter}
              counts={counts}
              total={laporan.length}
              onSelect={setFilter}
            />

            <div className="flex flex-wrap gap-3">
              <label className="relative min-w-[14rem] flex-1">
                <span className="sr-only">Cari laporan</span>
                <Search
                  aria-hidden="true"
                  className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#8a8f87]"
                />
                <input
                  type="search"
                  value={cari}
                  onChange={(event) => setCari(event.target.value)}
                  placeholder="Cari deskripsi atau lokasi…"
                  className="h-10 w-full rounded-xl border-[1.5px] border-[#efe9d8] bg-white pr-3 pl-10 text-sm outline-none focus-visible:border-[#1f6b4f] focus-visible:ring-2 focus-visible:ring-[#1f6b4f]/20"
                />
              </label>
              <select
                aria-label="Kategori"
                value={kategori}
                onChange={(event) =>
                  setKategori(event.target.value as 'semua' | LaporanKategori)
                }
                className="h-10 rounded-xl border-[1.5px] border-[#efe9d8] bg-white px-3 text-sm outline-none focus-visible:border-[#1f6b4f] focus-visible:ring-2 focus-visible:ring-[#1f6b4f]/20"
              >
                <option value="semua">Semua kategori</option>
                {KATEGORI_VALUES.map((k) => (
                  <option key={k} value={k}>
                    {KATEGORI_LABEL[k]}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid items-start gap-6 xl:grid-cols-[1.5fr_1fr]">
              <section
                aria-label="Daftar laporan"
                className={cn(CARD, 'min-w-0 overflow-hidden p-0')}
              >
                {antrianUrut.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
                    <p className="text-sm text-[#8a8f87]">
                      {laporan.length === 0
                        ? 'Belum ada laporan masuk.'
                        : 'Tidak ada laporan yang cocok. Ubah filter atau kata kunci.'}
                    </p>
                    {laporan.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={resetFilter}
                      >
                        Reset filter
                      </Button>
                    )}
                  </div>
                ) : (
                  <ul className="max-h-[34rem] divide-y divide-[#efe9d8] overflow-y-auto">
                    {antrianUrut.map((item) => {
                      const aktif = item.id === terpilih?.id
                      return (
                        <li
                          key={item.id}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3',
                            aktif
                              ? 'bg-[#e0f1e8] shadow-[inset_3px_0_0_#1f6b4f]'
                              : 'hover:bg-[#faf3e5]',
                          )}
                        >
                          <FotoThumb foto={item.foto} onBuka={setFotoBesar} />
                          <button
                            type="button"
                            aria-current={aktif ? 'true' : undefined}
                            onClick={() => setPilihId(item.id)}
                            className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left focus-visible:outline-none"
                          >
                            <span className="min-w-0">
                              <span className="block truncate font-medium text-[#1d2b26]">
                                {item.deskripsi}
                              </span>
                              <span className="mt-0.5 block truncate text-xs text-[#8a8f87]">
                                {kategoriLabel(item.kategori)} · {item.lokasi} ·{' '}
                                {formatTanggal(item.created_at)}
                              </span>
                            </span>
                            <StatusPill status={item.status} />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>

              <DetailPanel
                key={terpilih?.id ?? 'kosong'}
                item={terpilih}
                disabled={update.isPending}
                onUbah={pilihStatus}
                onBuka={setFotoBesar}
              />
            </div>

            <LaporanHarianCard harian={harian} />
          </>
        )}
      </div>

      {fotoBesar && (
        <FotoLightbox src={fotoBesar} onTutup={() => setFotoBesar(null)} />
      )}

      {tolakId !== null && (
        <TolakDialog
          id={tolakId}
          pending={update.isPending}
          onBatal={() => setTolakId(null)}
          onKirim={(alasan) => void kirimPenolakan(alasan)}
        />
      )}

      {buktiId !== null && (
        <BuktiDialog
          id={buktiId}
          pending={update.isPending}
          onBatal={() => setBuktiId(null)}
          onKirim={(foto) => void kirimBukti(foto)}
        />
      )}
    </DashboardShell>
  )
}

// Satu baris filter ringkas. Menggantikan tab di header sekaligus
// 4 kartu statistik, jadi tiap angka cuma tampil sekali.
function FilterStats({
  filter,
  counts,
  total,
  onSelect,
}: {
  filter: StatusFilter
  counts?: Record<LaporanStatus, number>
  total: number
  onSelect: (filter: StatusFilter) => void
}) {
  return (
    <div
      role="group"
      aria-label="Filter status"
      className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6"
    >
      {FILTERS.map((item) => {
        const active = filter === item.value
        const jumlah =
          item.value === 'semua'
            ? total
            : (counts?.[item.value as LaporanStatus] ?? 0)

        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(item.value)}
            className={cn(
              'flex items-baseline gap-2.5 rounded-xl border-[1.5px] px-3.5 py-2.5 text-left transition-colors',
              active
                ? 'border-[#1f6b4f] bg-[#e0f1e8]'
                : 'border-[#efe9d8] bg-white hover:bg-[#faf3e5]',
            )}
          >
            <span className="text-2xl leading-none font-bold tabular-nums">
              {jumlah}
            </span>
            <span
              className={cn(
                'text-[13px]',
                active ? 'font-semibold text-neutral-800' : 'text-[#8a8f87]',
              )}
            >
              {item.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// Badge status biasa (tidak bisa diklik). Perubahan status lewat
// tombol aksi di DetailPanel.
function StatusPill({ status }: { status: string }) {
  const key = status as LaporanStatus
  return (
    <span
      className={cn(
        'inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap',
        STATUS_PILL[key] ?? 'bg-neutral-100 text-neutral-700',
      )}
    >
      {STATUS_LABEL[key] ?? status}
    </span>
  )
}

// Foto besar di panel detail. Kalau `foto` null atau gagal dimuat,
// tampil kotak putus-putus supaya tinggi panel tidak melompat.
function FotoDetail({
  foto,
  onBuka,
}: {
  foto: string | null
  onBuka: (src: string) => void
}) {
  const [gagal, setGagal] = useState(false)

  if (!foto || gagal) {
    return (
      <div className="flex aspect-[16/10] w-full items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-[#f6f7f4] text-neutral-400">
        <ImageIcon aria-hidden="true" strokeWidth={1.5} className="size-10" />
      </div>
    )
  }

  const src = fotoUrl(foto)
  return (
    <button
      type="button"
      onClick={() => onBuka(src)}
      aria-label="Perbesar foto laporan"
      className="block w-full overflow-hidden rounded-2xl border border-[#efe9d8] focus-visible:ring-2 focus-visible:ring-[#1f6b4f]/35 focus-visible:outline-none"
    >
      <img
        src={src}
        alt="Foto laporan"
        onError={() => setGagal(true)}
        className="aspect-[16/10] w-full object-cover"
      />
    </button>
  )
}

// Panel keputusan: admin melihat detail lalu langsung memverifikasi
// atau menolak tanpa pindah halaman.
function DetailPanel({
  item,
  disabled,
  onUbah,
  onBuka,
}: {
  item: Laporan | undefined
  disabled: boolean
  onUbah: (id: number, status: LaporanStatus) => void
  onBuka: (src: string) => void
}) {
  if (!item) {
    return (
      <aside className={cn(CARD, 'text-sm text-[#8a8f87]')}>
        Pilih laporan untuk melihat detail.
      </aside>
    )
  }

  const aksi = AKSI[item.status as LaporanStatus] ?? []

  return (
    <aside
      aria-label="Detail laporan"
      className={cn(CARD, 'xl:sticky xl:top-24')}
    >
      <FotoDetail foto={item.foto} onBuka={onBuka} />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusPill status={item.status} />
        <PrioritasBadge kategori={item.prioritas_kategori ?? null} />
      </div>

      <h2 className="mt-2 text-lg leading-snug font-semibold">
        {item.deskripsi}
      </h2>

      <dl className="mt-4 grid grid-cols-[6rem_1fr] gap-x-3 gap-y-1.5 text-sm">
        <dt className="text-[#8a8f87]">Kategori</dt>
        <dd>{kategoriLabel(item.kategori)}</dd>
        <dt className="text-[#8a8f87]">Lokasi</dt>
        <dd>{item.lokasi}</dd>
        <dt className="text-[#8a8f87]">Dilaporkan</dt>
        <dd>{formatTanggal(item.created_at)}</dd>
      </dl>

      {aksi.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {aksi.map((a) => (
            <button
              key={a.ke}
              type="button"
              disabled={disabled}
              onClick={() => onUbah(item.id, a.ke)}
              className={cn(
                'inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
                a.bahaya
                  ? 'border-[1.5px] border-red-600 text-red-600 hover:bg-red-50'
                  : 'bg-[#1f6b4f] text-white hover:bg-[#0f3d2e]',
              )}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </aside>
  )
}

// Dialog alasan penolakan. Backend mewajibkan field `alasan` saat status
// ditolak. Ditutup lewat Batal, klik di luar kotak, atau Esc (kecuali
// saat sedang mengirim).
function TolakDialog({
  id,
  pending,
  onBatal,
  onKirim,
}: {
  id: number
  pending: boolean
  onBatal: () => void
  onKirim: (alasan: string) => void
}) {
  const [alasan, setAlasan] = useState('')
  const bersih = alasan.trim()

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending) onBatal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onBatal, pending])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tolak-judul"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => {
        if (!pending) onBatal()
      }}
    >
      <div
        className="w-full max-w-md rounded-[26px] border border-neutral-200/70 bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="tolak-judul" className="text-lg font-semibold">
          Tolak laporan #{id}
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Tulis alasan penolakan. Alasan ini wajib diisi.
        </p>

        <label htmlFor="tolak-alasan" className="sr-only">
          Alasan penolakan
        </label>
        <textarea
          id="tolak-alasan"
          autoFocus
          rows={4}
          maxLength={255}
          value={alasan}
          onChange={(event) => setAlasan(event.target.value)}
          placeholder="Contoh: Foto tidak jelas atau laporan duplikat."
          className="mt-4 w-full resize-none rounded-xl border border-neutral-200 bg-[#f6f7f4] px-3.5 py-2.5 text-sm text-neutral-800 transition-colors outline-none placeholder:text-neutral-400 focus-visible:border-[#1f6b4f] focus-visible:ring-2 focus-visible:ring-[#1f6b4f]/20"
        />
        <p className="mt-1 text-right text-xs text-neutral-400 tabular-nums">
          {alasan.length}/255
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onBatal}
          >
            Batal
          </Button>
          <button
            type="button"
            disabled={pending || bersih.length === 0}
            onClick={() => onKirim(bersih)}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? 'Menolak...' : 'Tolak laporan'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Dialog foto bukti penyelesaian. Backend mewajibkan foto bukti saat
// status diubah ke selesai. Format dan batas ukuran disamakan dengan
// unggahan foto laporan (jpeg/png/webp, maks 2 MB).
function BuktiDialog({
  id,
  pending,
  onBatal,
  onKirim,
}: {
  id: number
  pending: boolean
  onBatal: () => void
  onKirim: (foto: File) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [galat, setGalat] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending) onBatal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onBatal, pending])

  // Pratinjau foto yang dipilih. URL objek dibersihkan saat file diganti
  // atau dialog ditutup.
  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const onPilih = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dipilih = event.target.files?.[0] ?? null
    setGalat(null)

    if (!dipilih) {
      setFile(null)
      return
    }
    if (!FOTO_MIME_IZIN.includes(dipilih.type)) {
      setFile(null)
      setGalat('Format foto harus JPG, PNG, atau WebP.')
      return
    }
    if (dipilih.size > BATAS_FOTO_BYTE) {
      setFile(null)
      setGalat('Ukuran foto maksimal 2 MB.')
      return
    }
    setFile(dipilih)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bukti-judul"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => {
        if (!pending) onBatal()
      }}
    >
      <div
        className="w-full max-w-md rounded-[26px] border border-neutral-200/70 bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="bukti-judul" className="text-lg font-semibold">
          Selesaikan laporan #{id}
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Unggah foto bukti perbaikan. Foto ini wajib diisi.
        </p>

        <div className="mt-4">
          {preview ? (
            <img
              src={preview}
              alt="Pratinjau foto bukti"
              className="aspect-[4/3] w-full rounded-xl border border-neutral-200 object-cover"
            />
          ) : (
            <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-300 bg-[#f6f7f4] text-neutral-400">
              <ImageIcon
                aria-hidden="true"
                strokeWidth={1.5}
                className="size-9"
              />
              <span className="text-xs font-medium">Belum ada foto</span>
            </div>
          )}
        </div>

        <label htmlFor="bukti-foto" className="sr-only">
          Foto bukti penyelesaian
        </label>
        <input
          id="bukti-foto"
          type="file"
          accept={FOTO_ACCEPT}
          disabled={pending}
          onChange={onPilih}
          className="mt-3 block w-full cursor-pointer text-sm text-neutral-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3.5 file:py-2 file:text-sm file:font-medium file:text-emerald-800 hover:file:bg-emerald-100"
        />
        <p className="mt-1 text-xs text-neutral-400">
          Format JPG, PNG, atau WebP. Maksimal 2 MB.
        </p>
        {galat && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {galat}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onBatal}
          >
            Batal
          </Button>
          <button
            type="button"
            disabled={pending || !file}
            onClick={() => {
              if (file) onKirim(file)
            }}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-[#1f6b4f] px-4 text-sm font-semibold text-white transition hover:bg-[#0f3d2e] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? 'Menyimpan...' : 'Tandai selesai'}
          </button>
        </div>
      </div>
    </div>
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
        className="size-14 shrink-0 overflow-hidden rounded-xl border border-[#efe9d8] bg-[#f6f7f4] transition hover:ring-2 hover:ring-[#1f6b4f]/35 focus-visible:ring-2 focus-visible:ring-[#1f6b4f]/35 focus-visible:outline-none"
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

function VerifikasiSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-[#8a8f87]">Memuat laporan…</p>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
        {[0, 1, 2, 3, 4, 5].map((key) => (
          <Skeleton key={key} className="h-[52px] rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Skeleton className="h-96 rounded-[26px]" />
        <Skeleton className="h-96 rounded-[26px]" />
      </div>
    </div>
  )
}

function VerifikasiError({
  error,
  onRetry,
}: {
  error: unknown
  onRetry: () => void
}) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Gagal memuat daftar laporan.</AlertTitle>
      <AlertDescription>
        <p>{errorMessage(error)}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={onRetry}
        >
          Coba lagi
        </Button>
      </AlertDescription>
    </Alert>
  )
}