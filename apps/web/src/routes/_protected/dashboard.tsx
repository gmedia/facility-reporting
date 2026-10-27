import { createFileRoute, Link } from '@tanstack/react-router'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowRight, ClipboardListIcon } from 'lucide-react'
import type { User } from '@/features/auth/auth-query'
import { DashboardAdmin } from '@/features/dashboard/dashboard-admin'
import { DashboardFaq } from '@/features/dashboard/dashboard-faq'
import { DashboardRecent } from '@/features/dashboard/dashboard-recent'
import {
  readFilter,
  type AntrianFilter,
} from '@/features/dashboard/dashboard-utils'
import { useLaporanList } from '@/features/laporan/laporan-query'
import {
  RingkasanLaporan,
  hitungStatistik,
} from '@/features/laporan/ringkasan-laporan'

export const Route = createFileRoute('/_protected/dashboard')({
  // ?filter=menunggu | ?filter=terverifikasi — tab-nya ada di header
  // DashboardShell. User biasa tetap memakai dashboard lamanya.
  validateSearch: (
    search: Record<string, unknown>,
  ): { filter?: AntrianFilter } => ({
    filter: readFilter(search),
  }),
  component: DashboardPage,
})

function DashboardPage() {
  const { user } = Route.useRouteContext()

  if (user.role === 'admin' || user.role === 'super_admin') {
    return <DashboardPengelola />
  }

  return <DashboardUser user={user} />
}

function DashboardPengelola() {
  const { user } = Route.useRouteContext()
  const search = Route.useSearch()

  return <DashboardAdmin user={user} filter={readFilter(search)} />
}

// Halaman user.
//
// Catatan struktur: BUNGKUSNYA sudah disediakan UserShell (sidebar +
// padding + footer), jadi di sini TIDAK ada <main> dan TIDAK ada
// mx-auto max-w-5xl — kalau dipasang dua kali, halaman jadi kecil dobel.
function DashboardUser({ user }: { user: User }) {
  const laporan = useLaporanList()

  if (laporan.isPending) return <DashboardSkeleton />

  if (laporan.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Gagal memuat dashboard</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center gap-3">
          {laporan.error.message}
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-2xl"
            onClick={() => laporan.refetch()}
          >
            Coba lagi
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  const statistik = hitungStatistik(laporan.data)

  return (
    <div className="flex flex-col gap-5">
      {/* sapaan — hierarki jelas: eyebrow, judul, identitas */}
      <div>
        <p className="text-[11px] font-semibold tracking-[0.12em] text-[#0d3f31]/70 uppercase">
          Beranda
        </p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-[26px]">
          Halo, {user.name}
        </h1>
        {/*
          Sengaja TIDAK pakai identitas() dari dashboard-utils: helper itu
          nge-return role mentah ('user', 'admin', 'admin@...') yang justru
          bikin bingung buat pembaca. Halaman user ditulis lengkap di sini
          supaya yang tampil label yang dipahami orang, bukan nilai enum.
        */}
        <p className="mt-1 text-sm text-neutral-500">
          {user.nim ? `Mahasiswa · NIM ${user.nim}` : 'Mahasiswa'}
        </p>
      </div>

      {/* kartu ajakan — hijau tua, warna yang sama dengan panel kiri login.
          Ini pengganti tombol polos di pojok kanan atas: lebih kelihatan,
          dan ada alasannya (laporan pertama) bukan cuma dekorasi. */}
      <section className="relative overflow-hidden rounded-[28px] bg-[#0d3f31] p-6 text-white sm:p-7">
        {/* dekorasi: dua lingkaran samar biar bidangnya nggak datar */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-16 size-56 rounded-full bg-white/6"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 -bottom-28 size-48 rounded-full bg-white/4"
        />

        <div className="relative max-w-lg">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-medium ring-1 ring-white/15">
            <ClipboardListIcon aria-hidden="true" className="size-3.5" />
            {statistik.menunggu > 0
              ? `${statistik.menunggu} laporan menunggu verifikasi`
              : 'Siap membantu'}
          </span>

          <h2 className="mt-3.5 text-lg leading-snug font-semibold tracking-tight sm:text-xl">
            Ada fasilitas yang rusak?
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-white/70">
            Kirim laporannya lewat formulir singkat. Kamu bisa memantau
            perkembangannya sampai selesai dari halaman Riwayat Laporan.
          </p>

          <Link
            to="/lapor"
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-semibold text-[#0d3f31] transition-colors hover:bg-white/90"
          >
            Laporkan Kerusakan
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </section>

      {/* Ringkasan: Total sendirian di baris atas, lalu Menunggu /
          Diproses / Selesai / Ditolak empat sejajar — lima kartu. */}
      <RingkasanLaporan statistik={statistik} />
      <DashboardRecent laporans={laporan.data} role={user.role} />
      <DashboardFaq />
    </div>
  )
}

const KARTU_SKELETON = ['menunggu', 'diproses', 'selesai', 'ditolak']
const FAQ_SKELETON = ['satu', 'dua', 'tiga', 'empat']
const BARIS_SKELETON = ['satu', 'dua', 'tiga']

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-2.5 h-7 w-56" />
        <Skeleton className="mt-2 h-4 w-44" />
      </div>
      <Skeleton className="h-44 rounded-[28px]" />
      {/* ringkasan: satu baris total + empat kartu */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <Skeleton className="h-24 w-full rounded-3xl" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {KARTU_SKELETON.map((key) => (
            <Skeleton key={key} className="h-28 rounded-3xl" />
          ))}
        </div>
      </div>
      <div className="rounded-3xl border border-black/5 bg-white p-5">
        <Skeleton className="h-5 w-36" />
        <div className="mt-4 flex flex-col gap-3">
          {BARIS_SKELETON.map((key) => (
            <Skeleton key={key} className="h-12 w-full rounded-2xl" />
          ))}
        </div>
      </div>
      <div>
        <Skeleton className="h-5 w-48" />
        <div className="mt-3 grid gap-3 sm:grid-cols-2 sm:gap-4">
          {FAQ_SKELETON.map((key) => (
            <Skeleton key={key} className="h-32 rounded-3xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
