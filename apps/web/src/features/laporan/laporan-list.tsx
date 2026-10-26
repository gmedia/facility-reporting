import { useState } from 'react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
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
} from './laporan-query'
import { StatusBadge } from './status-badge'

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

function kategoriLabel(kategori: string): string {
  return KATEGORI_LABEL[kategori as LaporanKategori] ?? kategori
}

function tanggal(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function LaporanList() {
  const list = useLaporanList()
  const update = useUpdateLaporanStatus()
  const [filter, setFilter] = useState<StatusFilter>('semua')

  if (list.isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daftar Laporan</CardTitle>
          <CardDescription>Memuat laporan…</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <Skeleton key={item.value} className="h-8 w-20 rounded-md" />
            ))}
          </div>
          <Skeleton className="mt-4 h-48 w-full rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (list.isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daftar Laporan</CardTitle>
          <CardDescription>Data laporan belum bisa dimuat.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>Gagal memuat daftar laporan.</AlertTitle>
            <AlertDescription>
              <p>{errorMessage(list.error)}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => void list.refetch()}
              >
                Coba lagi
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const laporans = list.data
  const counts: Record<string, number> = {}
  for (const laporan of laporans) {
    counts[laporan.status] = (counts[laporan.status] ?? 0) + 1
  }

  const filtered =
    filter === 'semua'
      ? laporans
      : laporans.filter((laporan) => laporan.status === filter)
  const filterLabel =
    FILTERS.find((item) => item.value === filter)?.label ?? 'Semua'

  const ubahStatus = async (id: number, status: LaporanStatus) => {
    try {
      await update.mutateAsync({ id, status })
      toast.success(`Status diubah ke ${STATUS_LABEL[status]}`)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div>
            <CardTitle>Daftar Laporan</CardTitle>
            <CardDescription>
              {filter === 'semua'
                ? `${laporans.length} laporan tercatat. Klik tombol status untuk mengubahnya.`
                : `${filtered.length} dari ${laporans.length} laporan berstatus ${filterLabel}.`}
            </CardDescription>
          </div>

          <div
            role="group"
            aria-label="Filter status"
            className="flex flex-wrap gap-2"
          >
            {FILTERS.map((item) => {
              const active = filter === item.value
              const jumlah =
                item.value === 'semua'
                  ? laporans.length
                  : (counts[item.value] ?? 0)

              return (
                <Button
                  key={item.value}
                  type="button"
                  size="sm"
                  variant={active ? 'default' : 'outline'}
                  aria-pressed={active}
                  onClick={() => setFilter(item.value)}
                  className="gap-1.5"
                >
                  {item.label}
                  <span className="text-xs opacity-70">{jumlah}</span>
                </Button>
              )
            })}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filtered.length === 0 ? (
          <EmptyState
            filter={filter}
            label={filterLabel}
            onReset={() => setFilter('semua')}
          />
        ) : (
          <div>
            <p className="text-muted-foreground mb-2 text-xs sm:hidden">
              Geser tabel ke samping untuk lihat status dan aksi.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-3 font-medium">Kategori</th>
                    <th className="py-2 pr-3 font-medium">Lokasi</th>
                    <th className="py-2 pr-3 font-medium">Deskripsi</th>
                    <th className="py-2 pr-3 font-medium">Dikirim</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    <th className="py-2 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((laporan: Laporan) => (
                    <tr key={laporan.id} className="border-b last:border-0">
                      <td className="py-3 pr-3 whitespace-nowrap">
                        {kategoriLabel(laporan.kategori)}
                      </td>
                      <td className="py-3 pr-3">{laporan.lokasi}</td>
                      <td className="text-muted-foreground max-w-xs truncate py-3 pr-3">
                        {laporan.deskripsi}
                      </td>
                      <td className="text-muted-foreground py-3 pr-3 whitespace-nowrap">
                        {tanggal(laporan.created_at)}
                      </td>
                      <td className="py-3 pr-3">
                        <StatusBadge status={laporan.status} />
                      </td>
                      <td className="py-3">
                        {/* Pilih DropdownMenu, bukan Select: <SelectValue> Base UI
                          berisiko nampilin value mentah (menunggu_verifikasi)
                          alih-alih labelnya. DropdownMenuItem nulis labelnya
                          sendiri, jadi bebas dari itu. */}
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                disabled={update.isPending}
                              />
                            }
                          >
                            {STATUS_LABEL[laporan.status as LaporanStatus] ??
                              laporan.status}
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {STATUS_VALUES.map((s) => (
                              <DropdownMenuItem
                                key={s}
                                disabled={s === laporan.status}
                                onClick={() => void ubahStatus(laporan.id, s)}
                              >
                                {STATUS_LABEL[s]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function EmptyState({
  filter,
  label,
  onReset,
}: {
  filter: StatusFilter
  label: string
  onReset: () => void
}) {
  if (filter === 'semua') {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Belum ada laporan masuk.
      </p>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <p className="text-muted-foreground text-sm">
        Belum ada laporan berstatus {label}.
      </p>
      <Button type="button" variant="outline" size="sm" onClick={onReset}>
        Tampilkan semua
      </Button>
    </div>
  )
}
