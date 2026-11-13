import type { ReactNode } from 'react'

// ============================================================
// HEADER HALAMAN USER — TIDAK IKUT SCROLL (issue #113)
//
// Polanya mengikuti header DashboardShell milik halaman admin yang
// sudah lebih dulu sticky: blok judul tetap menempel di atas saat
// halaman di-scroll, jadi pembaca selalu tahu sedang di halaman mana.
//
// Versi COMPACT (masukan 13 Nov): dulu tiga baris penuh (eyebrow,
// judul 26px, keterangan) dengan padding longgar — tingginya ±110px
// dan terasa boros saat menempel. Kini eyebrow & judul jadi SATU baris
// (baseline), ukuran judul turun ke text-lg/xl, keterangan text-xs,
// padding jadi py-2 → tinggi ±60px.
//
// Detail penting:
// - Mobile: topbar hijau UserShell (sticky top-0, min-h-14 = 56px)
//   sudah lebih dulu memakan puncak layar, jadi header ini menempel
//   di `top-14` — tepat di bawahnya, z-10 supaya tidak menimpa
//   topbar (z-20). Desktop topbar tidak ada → `lg:top-0`.
// - Latar `bg-[#f5f7f6]` disamakan dengan latar halaman UserShell
//   supaya konten yang lewat di belakangnya tertutup mulus, bukan
//   tembus. Garis bawah tipis jadi pemisah saat menempel.
// - Bleed `-mx-* + px-*` supaya bidang dan garisnya membentang
//   selebar area konten (sama seperti header admin), bukan cuma
//   selebar kolom teksnya.
//
// Dipakai: Beranda, Lapor Kerusakan, Riwayat Laporan, Pengaturan.
// ============================================================
export function PageHeader({
  eyebrow,
  judul,
  keterangan,
}: {
  eyebrow: string
  judul: ReactNode
  keterangan: ReactNode
}) {
  return (
    <header className="sticky top-14 z-10 -mx-4 border-b border-black/5 bg-[#f5f7f6] px-4 py-2 sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-10 lg:px-10">
      {/* Satu baris: label kapital kecil di kiri, judul di kanannya.
          flex-wrap supaya di layar sempit judul turun baris dengan
          rapi, bukan memaksa labelnya menyempit. */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-[#0d3f31]/70 uppercase">
          {eyebrow}
        </p>
        <h1 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">
          {judul}
        </h1>
      </div>
      <p className="mt-0.5 text-xs text-neutral-500">{keterangan}</p>
    </header>
  )
}
