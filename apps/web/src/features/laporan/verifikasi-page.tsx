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

const CARD = 'rounded-[26px] border-[1.5px] border-[#efe9d8] bg-white p-6'

function kategoriLabel(kategori: string): string {
  return KATEGORI_LABEL[kategori as LaporanKategori] ?? kategori
}

export function VerifikasiPage({ user }: { user: User }) {
  const list = useLaporanList()
  const update = useUpdateLaporanStatus()
  const [filter, setFilter] = useState<StatusFilter>('semua')

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

  const antrian =
    filter === 'semua'
      ? ringkasan.antrian
      : ringkasan.antrian.filter((item) => item.status === filter)

  const ubahStatus = async (id: number, status: LaporanStatus) => {
    try {
      await update.mutateAsync({ id, status })
      toast.success(`Status diubah ke ${STATUS_LABEL[status]}`)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <DashboardShell
      user={user}
      header={
        <VerifikasiTabs
          filter={filter}
          counts={counts}
          total={list.data?.length}
          onSelect={setFilter}
        />
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[32px] leading-tight font-bold tracking-tight">
              Verifikasi
            </h1>
            <p className="mt-1 text-sm text-[#8a8f87]">
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
                <h2 className="text-lg font-semibold">Antrian verifikasi</h2>

                {antrian.length === 0 ? (
                  <EmptyState
                    filter={filter}
                    filterLabel={filterLabel}
                    total={laporan.length}
                    onReset={() => setFilter('semua')}
                  />
                ) : (
                  <div className="mt-2">
                    <p className="mb-2 text-xs text-[#8a8f87] sm:hidden">
                      Geser tabel ke samping untuk lihat status dan aksi.
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[34rem] border-collapse text-sm">
                        <thead>
                          <tr className="text-left text-[#8a8f87]">
                            <th className="w-16 border-b-[1.5px] border-[#efe9d8] py-2 font-normal">
                              ID
                            </th>
                            <th className="border-b-[1.5px] border-[#efe9d8] py-2 font-normal">
                              Laporan
                            </th>
                            <th className="border-b-[1.5px] border-[#efe9d8] py-2 text-right font-normal">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {antrian.map((laporanItem) => (
                            <tr
                              key={laporanItem.id}
                              className="border-b border-[#efe9d8] last:border-0 hover:bg-[#faf3e5]"
                            >
                              <td className="py-3 pr-4 text-[#8a8f87]">
                                {laporanItem.id}
                              </td>
                              <td className="py-3 pr-4">
                                <p className="font-medium text-[#1d2b26]">
                                  {laporanItem.deskripsi}
                                </p>
                                <p className="mt-0.5 text-xs text-[#8a8f87]">
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
                                <StatusMenu
                                  laporan={laporanItem}
                                  disabled={update.isPending}
                                  onChange={(status) =>
                                    void ubahStatus(laporanItem.id, status)
                                  }
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
    </DashboardShell>
  )
}

function VerifikasiTabs({
  filter,
  counts,
  total,
  onSelect,
}: {
  filter: StatusFilter
  counts?: Record<LaporanStatus, number>
  total?: number
  onSelect: (filter: StatusFilter) => void
}) {
  return (
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
              onClick={() => onSelect(item.value)}
              className={cn(
                'flex items-center gap-1.5 border-b-[3px] text-[15px] whitespace-nowrap transition-colors',
                active
                  ? 'border-[#dfc787] font-bold text-neutral-800'
                  : 'border-transparent font-medium text-[#8a8f87] hover:text-neutral-700',
              )}
            >
              {item.label}
              {jumlah !== undefined && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[11px] leading-none',
                    active
                      ? 'bg-[#e0f1e8] text-[#2f8059]'
                      : 'bg-neutral-100 text-[#8a8f87]',
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
  const pill = STATUS_PILL[status] ?? 'bg-neutral-100 text-neutral-700'

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
              pill,
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
      <p className="py-8 text-center text-sm text-[#8a8f87]">
        Belum ada laporan masuk.
      </p>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <p className="text-sm text-[#8a8f87]">
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
      <p className="text-sm text-[#8a8f87]">Memuat laporan…</p>
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
