import type { ReactNode } from 'react'

// ============================================================
// HEADER HALAMAN USER — TIDAK IKUT SCROLL (issue #113)
//
// Polanya mengikuti header DashboardShell milik halaman admin yang
// sudah lebih dulu sticky: blok judul tetap menempel di atas saat
// halaman di-scroll, jadi pembaca selalu tahu sedang di halaman mana.
//
// Desain (revisi 13 Nov, setelah dua iterasi):
// 1. Versi pertama: tiga baris penuh (eyebrow, judul 26px,
//    keterangan) — tinggi ±102px, kependekan buat yang menempel.
// 2. Versi kedua: eyebrow sejajar baseline dengan judul — TIDAK JADI,
//    pasangan label kapital 11px dengan judul 20px terasa janggal.
// 3. Sekarang: JUDUL di baris sendiri, lalu satu baris "kicker" berisi
//    label kapital hijau + titik pemisah + keterangan (text-xs). Dua
//    elemen kecil di baris yang sama seimbang; tinggi total ±64px —
//    setara min-h-16 header admin.
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
      <h1 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">
        {judul}
      </h1>
      {/* Kicker: label kapital hijau + titik + keterangan. Titik diberi
          aria-hidden supaya pembaca layar mendengar label dan
          keterangannya sebagai dua kalimat terpisah. */}
      <p className="mt-1 text-xs text-neutral-500">
        <span className="font-semibold tracking-[0.12em] text-[#0d3f31]/70 uppercase">
          {eyebrow}
        </span>
        <span aria-hidden="true" className="mx-1.5 text-neutral-300">
          ·
        </span>
        {keterangan}
      </p>
    </header>
  )
}
