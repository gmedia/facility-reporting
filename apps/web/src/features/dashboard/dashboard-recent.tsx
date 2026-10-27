import { ArrowRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import {
  KATEGORI_LABEL,
  STATUS_LABEL,
  STATUS_TONE,
  type Laporan,
  type LaporanStatus,
} from '@/features/laporan/laporan-query'
import { cn } from '@/lib/utils'
import { formatTanggal } from './dashboard-query'

function badgeFor(status: string) {
  const key = status as LaporanStatus
  return {
    label: STATUS_LABEL[key] ?? status,
    className:
      STATUS_TONE[key] ?? 'bg-neutral-100 text-neutral-700 ring-neutral-200',
  }
}

function kategoriLabel(kategori: string): string {
  return KATEGORI_LABEL[kategori as keyof typeof KATEGORI_LABEL] ?? kategori
}

export function DashboardRecent({
  laporans,
  role,
}: {
  laporans: Laporan[]
  role: string
}) {
  const isUser = role === 'user'
  // Dibatasi 3: bagian ini cuma pratampil. Daftar lengkap (dan panjang)
  // ada di Riwayat Laporan — kalau 5, kartunya sudah setinggi dua layar
  // dan menutupi QNA di bawahnya.
  const terbaru = [...laporans]
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    .slice(0, 3)

  return (
    <section className="rounded-3xl border border-black/5 bg-white shadow-[0_1px_2px_rgba(16,24,20,0.05)]">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-neutral-900">
            {isUser ? 'Laporan terbaru' : 'Laporan terbaru'}
          </h2>
          <p className="mt-0.5 text-xs text-neutral-400">
            {terbaru.length === 0
              ? 'Belum ada laporan masuk'
              : `Menampilkan ${terbaru.length} laporan terakhir`}
          </p>
        </div>

        {isUser && terbaru.length > 0 && (
          <Link
            to="/laporan/saya"
            className="inline-flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-medium text-[#0d3f31] transition-colors hover:bg-[#0d3f31]/6"
          >
            Lihat semua
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </Link>
        )}
      </header>

      {terbaru.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
          <p className="text-sm font-medium text-neutral-700">
            Belum ada laporan
          </p>
          <p className="text-xs text-neutral-400">
            Laporan yang kamu kirim akan muncul di sini.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-black/5">
          {terbaru.map((row) => {
            const badge = badgeFor(row.status)
            return (
              <li
                key={row.id}
                className="flex items-start justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-[#f7f9f8]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-800">
                    {kategoriLabel(row.kategori)}
                    <span className="text-neutral-400"> &middot; </span>
                    <span className="font-normal text-neutral-500">
                      {row.lokasi}
                    </span>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-neutral-400">
                    {row.deskripsi}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1',
                      badge.className,
                    )}
                  >
                    {badge.label}
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    {formatTanggal(row.created_at)}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
