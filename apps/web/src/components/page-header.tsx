import type { ReactNode } from 'react'

// ============================================================
// HEADER HALAMAN USER — TIDAK IKUT SCROLL (issue #113)
//
// Polanya mengikuti header DashboardShell milik halaman admin yang
// sudah lebih dulu sticky: blok eyebrow + judul + keterangan tetap
// menempel di atas saat halaman di-scroll, jadi pembaca selalu tahu
// sedang di halaman mana tanpa harus scroll balik ke atas.
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
    <header className="sticky top-14 z-10 -mx-4 border-b border-black/5 bg-[#f5f7f6] px-4 pt-3 pb-3.5 sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-10 lg:px-10">
      <p className="text-[11px] font-semibold tracking-[0.12em] text-[#0d3f31]/70 uppercase">
        {eyebrow}
      </p>
      <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-[26px]">
        {judul}
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-neutral-500">{keterangan}</p>
    </header>
  )
}
