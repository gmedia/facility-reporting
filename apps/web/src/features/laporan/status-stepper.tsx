import type { LaporanStatus } from './laporan-query'
import { cn } from '@/lib/utils'

const LANGKAH = ['Dilaporkan', 'Diverifikasi', 'Diproses', 'Selesai']

const INDEKS: Record<Exclude<LaporanStatus, 'ditolak'>, number> = {
  menunggu_verifikasi: 0,
  valid: 1,
  diproses: 2,
  selesai: 3,
}

// Stepper kecil alur laporan. Status `ditolak` keluar dari alur normal,
// jadi ditampilkan sebagai dua langkah: Dilaporkan -> Ditolak (merah).
export function StatusStepper({ status }: { status: string }) {
  const ditolak = status === 'ditolak'
  const langkah = ditolak ? ['Dilaporkan', 'Ditolak'] : LANGKAH
  const sekarang = ditolak ? 1 : (INDEKS[status as keyof typeof INDEKS] ?? 0)

  return (
    <ol
      aria-label="Progres laporan"
      className="mt-4 flex rounded-2xl border border-[#efe9d8] px-3 pt-3 pb-2.5"
    >
      {langkah.map((label, i) => {
        const selesai = i <= sekarang
        const merah = ditolak && i === 1
        const warna = merah
          ? 'bg-red-600 border-red-600'
          : 'bg-[#1f6b4f] border-[#1f6b4f]'

        return (
          <li
            key={label}
            aria-current={i === sekarang ? 'step' : undefined}
            className="relative flex flex-1 flex-col items-center"
          >
            {i > 0 && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute top-[5px] right-1/2 h-0.5 w-full',
                  selesai
                    ? merah
                      ? 'bg-red-600'
                      : 'bg-[#1f6b4f]'
                    : 'bg-[#e3e8e5]',
                )}
              />
            )}
            <span
              aria-hidden="true"
              className={cn(
                'relative z-10 size-3 rounded-full border-2',
                selesai ? warna : 'border-[#dfe5e2] bg-white',
              )}
            />
            <span
              className={cn(
                'mt-1.5 text-[11px] leading-none',
                selesai
                  ? merah
                    ? 'font-semibold text-red-600'
                    : 'font-medium text-[#1d2b26]'
                  : 'text-[#8a8f87]',
              )}
            >
              {label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
