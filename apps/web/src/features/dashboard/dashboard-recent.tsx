import { AlertTriangle } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import {
  KATEGORI_LABEL,
  STATUS_LABEL,
  type Laporan,
  type LaporanStatus,
} from '@/features/laporan/laporan-query'
import { cn } from '@/lib/utils'
import { formatTanggal } from './dashboard-query'

// Warna badge khusus dashboard; label status diambil dari features/laporan.
const STATUS_BADGE: Record<LaporanStatus, string> = {
  menunggu_verifikasi: 'bg-[#fbe9cc] text-[#b9772a]',
  valid: 'bg-[#dff1f7] text-[#3a8fb0]',
  ditolak: 'bg-rose-100 text-rose-700',
  diproses: 'bg-violet-100 text-violet-700',
  selesai: 'bg-[#e0f1e8] text-[#2f8059]',
}

function badgeFor(status: string) {
  return {
    label: STATUS_LABEL[status as LaporanStatus] ?? status,
    className:
      STATUS_BADGE[status as LaporanStatus] ??
      'bg-neutral-100 text-neutral-600',
  }
}

export function DashboardRecent({
  laporans,
  role,
}: {
  laporans: Laporan[]
  role: string
}) {
  const isUser = role === 'user'
  const menunggu = laporans.filter(
    (row) => row.status === 'menunggu_verifikasi',
  ).length
  const terbaru = [...laporans]
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    .slice(0, 5)

  return (
    <section className="rounded-[26px] border-[1.5px] border-[#efe9d8] bg-white p-6">
      <h2 className="text-lg font-semibold">
        {isUser ? 'Laporan saya' : 'Laporan terbaru'}
      </h2>

      {!isUser && menunggu > 0 && (
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-[#fdf8ee] px-4 py-2.5 text-sm text-[#b9772a]">
          <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
          {menunggu} laporan menunggu verifikasi
        </p>
      )}

      {terbaru.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="font-medium text-neutral-700">
            {isUser
              ? 'Belum ada laporan dari Anda.'
              : 'Belum ada laporan masuk.'}
          </p>
          {isUser && (
            <>
              <p className="text-sm text-neutral-500">
                Ada fasilitas yang rusak?
              </p>
              <Link
                to="/lapor"
                className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#3b9b6b] px-5 text-sm font-medium text-white transition-colors hover:bg-[#2f8059]"
              >
                + Lapor Kerusakan
              </Link>
            </>
          )}
        </div>
      ) : (
        <ul className="mt-4">
          {terbaru.map((row) => {
            const badge = badgeFor(row.status)
            return (
              <li
                key={row.id}
                className="border-t border-neutral-100 py-3 first:border-t-0 first:pt-0 last:pb-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {KATEGORI_LABEL[
                        row.kategori as keyof typeof KATEGORI_LABEL
                      ] ?? row.kategori}{' '}
                      · {row.lokasi}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-neutral-500">
                      {row.deskripsi}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className={cn(
                        'inline-block rounded-lg px-3 py-1 text-xs font-medium',
                        badge.className,
                      )}
                    >
                      {badge.label}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {formatTanggal(row.created_at)}
                    </span>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
