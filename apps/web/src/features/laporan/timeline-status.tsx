import { StatusBadge } from './status-badge'
import { STATUS_LABEL, type LaporanStatus } from './laporan-query'
import { useLaporanHistory } from './laporan-query'
import { cn } from '@/lib/utils'

// Riwayat perubahan status satu laporan — dipanggil hanya saat panel
// detail dibuka (render bersyarat di pemanggilnya), bukan saat halaman
// dimuat, supaya 13 laporan tidak memicu 13 request sekaligus.
export function TimelineStatus({ laporanId }: { laporanId: number }) {
  const { data, isPending, isError } = useLaporanHistory(laporanId)
  const entri = data ?? []

  if (isPending) {
    return (
      <div className="rounded-3xl bg-[#f5f7f6] p-4 ring-1 ring-black/5">
        <p className="text-sm text-neutral-500">Memuat riwayat status…</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-3xl bg-[#f5f7f6] p-4 ring-1 ring-black/5">
        <p className="text-sm text-neutral-500">
          Riwayat status tidak tersedia saat ini.
        </p>
      </div>
    )
  }

  if (entri.length === 0) {
    return (
      <div className="rounded-3xl bg-[#f5f7f6] p-4 ring-1 ring-black/5">
        <p className="text-sm text-neutral-500">
          Belum ada riwayat perubahan status.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-3xl bg-[#f5f7f6] p-4 ring-1 ring-black/5">
      <ul className="space-y-3">
        {entri.map((item) => (
          <li key={item.id} className="flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
              {item.status_from && (
                <span className="text-[10px] font-medium tracking-wider text-neutral-400 uppercase">
                  {statusLabel(item.status_from)}
                </span>
              )}
              <span
                className={cn(
                  'text-[10px] font-medium',
                  item.status_from
                    ? 'ml-0.5 text-neutral-400'
                    : 'text-[#0d3f31]',
                )}
              >
                {item.status_from ? '→' : ''}
              </span>
              <StatusBadge status={item.status_to} />
            </div>

            <p className="text-xs text-neutral-500">
              {item.changed_by_name ?? '—'} ·{tanggal(item.created_at ?? null)}
            </p>

            {item.alasan && (
              <p className="mt-0.5 text-sm text-neutral-800">{item.alasan}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function statusLabel(status: string): string {
  const key = status as LaporanStatus
  return STATUS_LABEL[key] ?? status
}

function tanggal(iso: string | null): string {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}
