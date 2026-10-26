import { InboxIcon } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  KATEGORI_LABEL,
  errorMessage,
  useLaporanList,
  type Laporan,
  type LaporanKategori,
} from './laporan-query'
import { StatusBadge } from './status-badge'

function kategoriLabel(kategori: string): string {
  return KATEGORI_LABEL[kategori as LaporanKategori] ?? kategori
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

// Daftar laporan milik user yang login.
//
// Sengaja memakai useLaporanList() apa adanya, TANPA filter status di
// sisi klien: backend sudah men-scope per role (PR #39) — user cuma dapat
// laporannya sendiri. Nambah filter sendiri di sini justru bisa bikin
// laporan user ilang diam-diam kalau backend ganti kebijakan scoping.
export function RiwayatList() {
  const list = useLaporanList()

  // Loading: skeleton, bukan teks "Memuat..." polos — tingginya kira-kira
  // sama dengan 3 kartu, jadi halaman gak "melompat" waktu data datang.
  if (list.isPending) {
    return (
      <>
        <p className="sr-only">Memuat riwayat laporan...</p>
        <div aria-busy="true" className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="gap-2.5 px-5 py-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-6 w-28" />
            </Card>
          ))}
        </div>
      </>
    )
  }

  if (list.isError) {
    return (
      <div className="border-destructive/30 bg-destructive/5 rounded-lg border p-5">
        <p className="text-sm font-medium">Gagal memuat riwayat laporan.</p>
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

  // Terbaru di atas. localeCompare di string ISO aman untuk urutan.
  const laporans = [...list.data].sort((a, b) =>
    (b.created_at ?? '').localeCompare(a.created_at ?? ''),
  )

  if (laporans.length === 0) {
    return (
      <Card className="items-center gap-3 px-6 py-14 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <InboxIcon aria-hidden="true" className="size-5" />
        </span>
        <p className="text-base font-medium">
          Belum ada laporan yang kamu kirim
        </p>
        <p className="text-muted-foreground max-w-sm text-sm">
          Ada fasilitas yang rusak? Kirim laporan pertamamu, lalu pantau
          prosesnya dari halaman ini.
        </p>
        {/*
          Pakai <Link> biasa, bukan <Button render={<Link>}> — sama persis
          dengan pola CTA di dashboard-recent.tsx. Dua alasan:
          1. Base UI Button nempelin `nativeButton` semantics, jadi link-nya
             kebaca sebagai role="button" (aksesibilitas rusak) dan console
             nge-spam peringatan. Keduanya ketahuan pas rehearsal.
          2. Ini link beneran (ada href), bukan tombol yang pura-pura pindah
             halaman — jadi juga kebuka klik-tengah / salin-tautan.
        */}
        <Link
          to="/lapor"
          className="mt-2 inline-flex h-9 items-center rounded-lg bg-emerald-700 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-800"
        >
          Laporkan Kerusakan
        </Link>
      </Card>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {laporans.map((laporan: Laporan) => (
        <li key={laporan.id}>
          <Card className="gap-2.5 px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {kategoriLabel(laporan.kategori)}
                  <span className="text-muted-foreground font-normal">
                    {' '}
                    · {laporan.lokasi}
                  </span>
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {laporan.deskripsi}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-start gap-1.5 sm:items-end">
                <StatusBadge status={laporan.status} />
                <span className="text-muted-foreground text-xs">
                  {tanggal(laporan.created_at)}
                </span>
              </div>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  )
}
