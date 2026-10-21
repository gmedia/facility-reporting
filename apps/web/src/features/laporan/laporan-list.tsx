import { toast } from 'sonner'
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
import {
  KATEGORI_LABEL,
  STATUS_LABEL,
  STATUS_TONE,
  STATUS_VALUES,
  errorMessage,
  useLaporanList,
  useUpdateLaporanStatus,
  type Laporan,
  type LaporanKategori,
  type LaporanStatus,
} from './laporan-query'

// schema.d.ts ngetik `LaporanResource['status']` sebagai `string`, padahal
// backend cuma mau 5 nilai `LaporanStatus`. Karena itu semua akses ke
// STATUS_LABEL/STATUS_TONE harus lewat helper ini — dan tetap ditampilkan
// apa adanya kalau nilainya di luar enum, biar gak lenyap diam-diam.
function statusInfo(status: string): { label: string; tone: string } {
  const key = status as LaporanStatus
  return {
    label: STATUS_LABEL[key] ?? status,
    tone:
      STATUS_TONE[key] ?? 'bg-neutral-100 text-neutral-700 ring-neutral-200',
  }
}

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

function Badge({ status }: { status: string }) {
  const { label, tone } = statusInfo(status)
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs ring-1 ${tone}`}
    >
      {label}
    </span>
  )
}

export function LaporanList() {
  const list = useLaporanList()
  const update = useUpdateLaporanStatus()

  if (list.isPending) {
    return <p className="text-muted-foreground text-sm">Memuat laporan…</p>
  }

  if (list.isError) {
    return (
      <div className="border-destructive/30 bg-destructive/5 rounded-lg border p-4">
        <p className="text-sm font-medium">Gagal memuat daftar laporan.</p>
        <p className="text-muted-foreground mt-1 text-sm">
          {errorMessage(list.error)}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => void list.refetch()}
        >
          Coba lagi
        </Button>
      </div>
    )
  }

  const laporans = list.data

  if (laporans.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">Belum ada laporan masuk.</p>
    )
  }

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
        <CardTitle>Daftar Laporan</CardTitle>
        <CardDescription>
          {laporans.length} laporan tercatat. Klik tombol status untuk
          mengubahnya.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
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
              {laporans.map((laporan: Laporan) => (
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
                    <Badge status={laporan.status} />
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
                        {statusInfo(laporan.status).label}
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {STATUS_VALUES.map((s) => (
                          <DropdownMenuItem
                            key={s}
                            disabled={s === laporan.status}
                            onSelect={() => void ubahStatus(laporan.id, s)}
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
      </CardContent>
    </Card>
  )
}
