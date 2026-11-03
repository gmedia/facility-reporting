import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import type { User } from '@/features/auth/auth-query'
import { formatTanggal } from '@/features/dashboard/dashboard-query'
import { DashboardShell } from '@/features/dashboard/dashboard-shell'
import {
  LaporanHarianCard,
  PrioritasCard,
  RingkasanCards,
} from '@/features/dashboard/dashboard-summary'
import {
  hitungRingkasan,
  laporanPerHari,
} from '@/features/dashboard/dashboard-utils'
import {
  KATEGORI_LABEL,
  STATUS_LABEL,
  STATUS_VALUES,
  errorMessage,
  parseSkor,
  prioritasLabel,
  useLaporanList,
  useUpdateLaporanBukti,
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
  menunggu_verifikasi: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
  valid: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200',
  diproses: 'bg-sky-100 text-sky-800 ring-1 ring-sky-200',
  selesai: 'bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200',
  ditolak: 'bg-red-100 text-red-800 ring-1 ring-red-200',
}

const CARD = 'rounded-[26px] border-[1.5px] border-black/5 bg-white p-6'

// Nilai SMART yang wajib diisi saat status diubah ke valid.
type NilaiSmart = {
  kerusakan: number
  risiko: number
  dampak: number
  frekuensi: number
}

function kategoriLabel(kategori: string): string {
  return KATEGORI_LABEL[kategori as LaporanKategori] ?? kategori
}

export function VerifikasiPage({ user }: { user: User }) {
  const list = useLaporanList()
  const update = useUpdateLaporanStatus()
  const bukti = useUpdateLaporanBukti()
  const [filter, setFilter] = useState<StatusFilter>('semua')
  const [sortByPrioritas, setSortByPrioritas] = useState(false)

  // Dialog ubah status + nilai SMART.
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean
    laporan: Laporan | null
  }>({ open: false, laporan: null })

  const laporan = list.data ?? []
  const ringkasan = hitungRingkasan(laporan)
  const harian = laporanPerHari(laporan)
  const filterLabel =
    FILTERS.find((item) => item.value === filter)?.label ?? 'Semua'

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

  let antrian =
    filter === 'semua'
      ? ringkasan.antrian
      : ringkasan.antrian.filter((item) => item.status === filter)

  // Urutkan berdasarkan skor prioritas jika toggle aktif.
  if (sortByPrioritas) {
    antrian = [...antrian].sort((a, b) => {
      const skorA = parseSkor(a.skor_prioritas) ?? -1
      const skorB = parseSkor(b.skor_prioritas) ?? -1
      return skorB - skorA
    })
  }

  const ubahStatus = async (
    id: number,
    status: LaporanStatus,
    nilai: NilaiSmart | undefined,
    alasan: string | null,
    buktiFile: File | null,
    onClose: () => void,
  ) => {
    try {
      await update.mutateAsync({ id, status, nilai, alasan })

      if (buktiFile && status === 'selesai') {
        await bukti.mutateAsync({ id, file: buktiFile })
      }

      toast.success(`Status diubah ke ${STATUS_LABEL[status]}`)
      onClose()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <DashboardShell
      user={user}
      header={
        <VerifikasiHeader
          filter={filter}
          counts={counts}
          total={list.data?.length}
          onFilter={setFilter}
          sortByPrioritas={sortByPrioritas}
          onSortToggle={setSortByPrioritas}
        />
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[32px] leading-tight font-bold tracking-tight text-neutral-900">
              Verifikasi
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Antrian laporan, semua gedung
            </p>
          </div>
        </div>

        {list.isPending ? (
          <VerifikasiSkeleton />
        ) : list.isError ? (
          <VerifikasiError
            error={list.error}
            onRetry={() => void list.refetch()}
          />
        ) : (
          <>
            <RingkasanCards
              ringkasan={ringkasan}
              activeStatus={filter === 'semua' ? undefined : filter}
              onSelect={setFilter}
            />

            <div className="grid items-start gap-6 xl:grid-cols-[1.55fr_1fr]">
              <section className={cn(CARD, 'min-w-0')}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Antrian verifikasi
                    </h2>
                    {sortByPrioritas && (
                      <p className="mt-1 text-xs text-neutral-500">
                        Diurutkan dari skor prioritas tertinggi
                      </p>
                    )}
                  </div>
                </div>

                {antrian.length === 0 ? (
                  <EmptyState
                    filter={filter}
                    filterLabel={filterLabel}
                    total={laporan.length}
                    onReset={() => setFilter('semua')}
                  />
                ) : (
                  <div className="mt-2">
                    <p className="mb-2 text-xs text-neutral-500 sm:hidden">
                      Geser tabel ke samping untuk lihat status dan aksi.
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[48rem] border-collapse text-sm">
                        <thead>
                          <tr className="text-left text-neutral-500">
                            <th className="w-16 border-b border-black/5 py-2 font-normal">
                              ID
                            </th>
                            <th className="border-b border-black/5 py-2 font-normal">
                              Laporan
                            </th>
                            <th className="border-b border-black/5 py-2 text-right font-normal w-32">
                              Skor Prioritas
                            </th>
                            <th className="border-b border-black/5 py-2 text-right font-normal w-32">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {antrian.map((laporanItem) => (
                            <tr
                              key={laporanItem.id}
                              className="border-b border-black/5 last:border-0 hover:bg-[#0d3f31]/4"
                            >
                              <td className="py-3 pr-4 text-neutral-500">
                                {laporanItem.id}
                              </td>
                              <td className="py-3 pr-4">
                                <p className="font-medium text-neutral-900">
                                  {laporanItem.deskripsi}
                                </p>
                                <p className="mt-0.5 text-xs text-neutral-500">
                                  <span>
                                    {kategoriLabel(laporanItem.kategori)}
                                  </span>
                                  <span aria-hidden="true"> · </span>
                                  <span>{laporanItem.lokasi}</span>
                                  <span aria-hidden="true"> · </span>
                                  <span>
                                    {formatTanggal(laporanItem.created_at)}
                                  </span>
                                </p>
                              </td>
                              <td className="py-3 text-right">
                                <span
                                  className={cn(
                                    'inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ring-1 whitespace-nowrap',
                                    STATUS_PILL[
                                      laporanItem.status as LaporanStatus
                                    ] ?? 'bg-neutral-100 text-neutral-700 ring-neutral-200',
                                  )}
                                >
                                  {prioritasLabel(
                                    laporanItem.prioritas_kategori,
                                    parseSkor(laporanItem.skor_prioritas),
                                  )}
                                  {parseSkor(laporanItem.skor_prioritas) !== null && (
                                    <>
                                      <span aria-hidden="true"> · </span>
                                      {parseSkor(
                                        laporanItem.skor_prioritas,
                                      )?.toFixed(2)}
                                    </>
                                  )}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                <StatusMenu
                                  laporan={laporanItem}
                                  disabled={update.isPending || bukti.isPending}
                                  onChange={() => {
                                    setStatusDialog({
                                      open: true,
                                      laporan: laporanItem,
                                    })
                                  }}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>

              <PrioritasCard ringkasan={ringkasan} />
            </div>

            <LaporanHarianCard harian={harian} />
          </>
        )}
      </div>

      <StatusDialog
        open={statusDialog.open}
        laporan={statusDialog.laporan}
        onOpenChange={(open) => {
          setStatusDialog({ open, laporan: open ? statusDialog.laporan : null })
        }}
        onSave={(status, nilai, alasan, buktiFile) =>
          ubahStatus(
            statusDialog.laporan!.id,
            status,
            nilai,
            alasan,
            buktiFile,
            () =>
              setStatusDialog({ open: false, laporan: null }),
          )
        }
      />
    </DashboardShell>
  )
}

function VerifikasiHeader({
  filter,
  counts,
  total,
  onFilter,
  sortByPrioritas,
  onSortToggle,
}: {
  filter: StatusFilter
  counts?: Record<LaporanStatus, number>
  total?: number
  onFilter: (filter: StatusFilter) => void
  sortByPrioritas: boolean
  onSortToggle: (value: boolean) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      <nav
        aria-label="Filter antrian verifikasi"
        className="h-full min-w-0 scrollbar-none overflow-x-auto"
      >
        <div
          role="group"
          aria-label="Filter status"
          className="flex h-full items-stretch gap-6"
        >
          {FILTERS.map((item) => {
            const active = filter === item.value
            const jumlah =
              item.value === 'semua'
                ? total
                : counts?.[item.value as LaporanStatus]

            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={active}
                onClick={() => onFilter(item.value)}
                className={cn(
                  'flex items-center gap-1.5 border-b-[3px] text-[15px] whitespace-nowrap transition-colors',
                  active
                    ? 'border-[#0d3f31] font-bold text-neutral-800'
                    : 'border-transparent font-medium text-neutral-500 hover:text-neutral-700',
                )}
              >
                {item.label}
                {jumlah !== undefined && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[11px] leading-none',
                      active
                        ? 'bg-[#e6f2ec] text-[#15803d]'
                        : 'bg-[#eef1f0] text-neutral-500',
                    )}
                  >
                    {jumlah}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="sm"
          variant={sortByPrioritas ? 'default' : 'outline'}
          onClick={() => onSortToggle(!sortByPrioritas)}
          className="flex items-center gap-2"
        >
          Urutkan Prioritas
        </Button>
      </div>
    </div>
  )
}

function StatusDialog({
  open,
  laporan,
  onOpenChange,
  onSave,
}: {
  open: boolean
  laporan: Laporan | null
  onOpenChange: (open: boolean) => void
  onSave: (
    status: LaporanStatus,
    nilai: NilaiSmart | undefined,
    alasan: string | null,
    buktiFile: File | null,
  ) => void
}) {
  const isValidTarget = laporan?.status === 'valid'
  const isSelesaiTarget = laporan?.status === 'selesai'

  const [statusValue, setStatusValue] = useState<LaporanStatus>(
    (laporan?.status ?? 'menunggu_verifikasi') as LaporanStatus,
  )
  const [nilaiForm, setNilaiForm] = useState<NilaiSmart>({
    kerusakan: laporan?.nilai_kerusakan ?? 0,
    risiko: laporan?.nilai_risiko ?? 0,
    dampak: laporan?.nilai_dampak ?? 0,
    frekuensi: laporan?.nilai_frekuensi ?? 0,
  })
  const [alasanValue, setAlasanValue] = useState('')
  const [buktiFile, setBuktiFile] = useState<File | null>(null)

  const nilaiLengkap =
    statusValue === 'valid'
      ? {
          kerusakan: Math.max(1, Math.min(5, nilaiForm.kerusakan)),
          risiko: Math.max(1, Math.min(5, nilaiForm.risiko)),
          dampak: Math.max(1, Math.min(5, nilaiForm.dampak)),
          frekuensi: Math.max(1, Math.min(5, nilaiForm.frekuensi)),
        }
      : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent key={`status-${laporan?.id}`} className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Ubah Status Laporan</DialogTitle>
          <DialogDescription>
            Laporan #{laporan?.id} — {laporan?.deskripsi}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => e.preventDefault()} className="grid gap-4 py-4">
          <Field>
            <FieldLabel>Status Baru</FieldLabel>
            <select
              value={statusValue}
              onChange={(e) => setStatusValue(e.target.value as LaporanStatus)}
              className="block w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-neutral-900 focus:border-[#0d3f31] focus:ring-1 focus:ring-[#0d3f31]"
            >
              {STATUS_VALUES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>

          {isValidTarget && (
            <section className="grid gap-3">
              <p className="text-[11px] font-semibold tracking-[0.12em] text-neutral-500 uppercase">
                Nilai SMART (1–5)
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Kerusakan</FieldLabel>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={nilaiForm.kerusakan}
                    onChange={(e) =>
                      setNilaiForm((prev) => ({
                        ...prev,
                        kerusakan: Math.max(1, Math.min(5, Number(e.target.value) || 1)),
                      }))
                    }
                    className="h-9 rounded-xl border border-black/10 bg-white px-3 text-sm text-neutral-900 focus:border-[#0d3f31] focus:ring-1 focus:ring-[#0d3f31]"
                  />
                </Field>
                <Field>
                  <FieldLabel>Risiko</FieldLabel>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={nilaiForm.risiko}
                    onChange={(e) =>
                      setNilaiForm((prev) => ({
                        ...prev,
                        risiko: Math.max(1, Math.min(5, Number(e.target.value) || 1)),
                      }))
                    }
                    className="h-9 rounded-xl border border-black/10 bg-white px-3 text-sm text-neutral-900 focus:border-[#0d3f31] focus:ring-1 focus:ring-[#0d3f31]"
                  />
                </Field>
                <Field>
                  <FieldLabel>Dampak</FieldLabel>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={nilaiForm.dampak}
                    onChange={(e) =>
                      setNilaiForm((prev) => ({
                        ...prev,
                        dampak: Math.max(1, Math.min(5, Number(e.target.value) || 1)),
                      }))
                    }
                    className="h-9 rounded-xl border border-black/10 bg-white px-3 text-sm text-neutral-900 focus:border-[#0d3f31] focus:ring-1 focus:ring-[#0d3f31]"
                  />
                </Field>
                <Field>
                  <FieldLabel>Frekuensi</FieldLabel>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={nilaiForm.frekuensi}
                    onChange={(e) =>
                      setNilaiForm((prev) => ({
                        ...prev,
                        frekuensi: Math.max(1, Math.min(5, Number(e.target.value) || 1)),
                      }))
                    }
                    className="h-9 rounded-xl border border-black/10 bg-white px-3 text-sm text-neutral-900 focus:border-[#0d3f31] focus:ring-1 focus:ring-[#0d3f31]"
                  />
                </Field>
              </div>
            </section>
          )}

          {isSelesaiTarget && (
            <section className="grid gap-3">
              <p className="text-[11px] font-semibold tracking-[0.12em] text-neutral-500 uppercase">
                Foto Bukti
              </p>
              <Field>
                <FieldLabel>Foto</FieldLabel>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null
                    setBuktiFile(f)
                  }}
                  className="block w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-neutral-900 focus:border-[#0d3f31] focus:ring-1 focus:ring-[#0d3f31]"
                />
                {buktiFile && (
                  <p className="mt-1.5 text-xs text-neutral-500">
                    {buktiFile.name} ({Math.round(buktiFile.size / 1024)} KB)
                  </p>
                )}
              </Field>
            </section>
          )}

          <Field>
            <FieldLabel>Alasan</FieldLabel>
            <textarea
              value={alasanValue}
              onChange={(e) => setAlasanValue(e.target.value)}
              rows={3}
              className="block w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-neutral-900 focus:border-[#0d3f31] focus:ring-1 focus:ring-[#0d3f31]"
              placeholder="Alasan perubahan status…"
            />
          </Field>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            type="button"
            onClick={() => {
              onSave(statusValue, nilaiLengkap, alasanValue || null, buktiFile)
            }}
          >
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function StatusMenu({
  laporan,
  disabled,
  onChange,
}: {
  laporan: Laporan
  disabled: boolean
  onChange: (status: LaporanStatus) => void
}) {
  const status = laporan.status as LaporanStatus
  const label = STATUS_LABEL[status] ?? laporan.status

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            disabled={disabled}
            title="Klik untuk ubah status"
            className={cn(
              'inline-flex items-center gap-1.5 rounded-[10px] px-4 py-1.5 text-sm font-medium whitespace-nowrap transition hover:brightness-95 disabled:opacity-60',
              STATUS_PILL[status] ?? 'bg-neutral-100 text-neutral-700',
            )}
          />
        }
      >
        <span>{label}</span>
        <ChevronDown aria-hidden="true" className="size-3.5 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {STATUS_VALUES.map((s) => (
          <DropdownMenuItem
            key={s}
            disabled={disabled || s === status}
            onClick={() => onChange(s)}
          >
            {STATUS_LABEL[s]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function EmptyState({
  filter,
  filterLabel,
  total,
  onReset,
}: {
  filter: StatusFilter
  filterLabel: string
  total: number
  onReset: () => void
}) {
  if (filter === 'semua' || total === 0) {
    return (
      <p className="py-8 text-center text-sm text-neutral-500">
        Belum ada laporan masuk.
      </p>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <p className="text-sm text-neutral-500">
        Belum ada laporan berstatus {filterLabel}.
      </p>
      <Button type="button" variant="outline" size="sm" onClick={onReset}>
        Tampilkan semua
      </Button>
    </div>
  )
}

function VerifikasiSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-neutral-500">Memuat laporan…</p>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {['menunggu', 'terverifikasi', 'diproses', 'selesai'].map((key) => (
          <Skeleton key={key} className="h-[158px] rounded-[26px]" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <Skeleton className="h-72 rounded-[26px]" />
        <Skeleton className="h-72 rounded-[26px]" />
      </div>
      <Skeleton className="h-56 rounded-[26px]" />
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
