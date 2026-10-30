import type { LucideIcon } from 'lucide-react'
import { CheckCircle2, Clock, FileText, Wrench, XCircle } from 'lucide-react'
import type { Laporan } from './laporan-query'

// ============================================================
// RINGKASAN ANGKA LAPORAN — SATU KOMPONEN, DUA HALAMAN
//
// Dipakai Beranda dan Riwayat Laporan. Sengaja tidak dipisah jadi dua
// komponen yang "mirip": permintaannya modelnya sama persis, dan dua
// salinan yang sama persis hari ini akan berbeda pelan-pelan besok.
//
// Di Beranda layout-nya dua baris:
//   baris atas  — Total, sendirian, kartu horizontal
//   baris bawah — Menunggu / Diproses / Selesai / Ditolak, empat sejajar
//
// Di Riwayat kartu Total berdiri sebaris dengan grafik, jadi lebarnya
// cuma sepertiga layar tapi tingginya setinggi grafik (~300px). Bentuk
// horizontal di situ cuma menyisakan kotak putih kosong, jadi ada mode
// `penuh`: label di atas, angka besar di tengah, catatan di dasar.
//
// Yang tidak berubah di kedua bentuk: kartunya putih, rounded-3xl, isinya
// label huruf kecil + angka + catatan + ikon yang sama. Ini tetap satu
// kartu Total, bukan dua kartu berbeda.
// ============================================================

export type Statistik = {
  total: number
  menunggu: number
  diproses: number
  selesai: number
  ditolak: number
}

export function hitungStatistik(laporan: Laporan[]): Statistik {
  return {
    total: laporan.length,
    menunggu: laporan.filter((l) => l.status === 'menunggu_verifikasi').length,
    // `valid` ikut dihitung sebagai Diproses: sudah lolos verifikasi tapi
    // belum tuntas, jadi dari sudut pandang pemilik laporan masih berjalan.
    // Tanpa ini, jumlah empat kartu tidak akan pernah sama dengan `total`
    // — dan memang harus selalu sama, karena `total` memakai `length`.
    diproses: laporan.filter(
      (l) => l.status === 'diproses' || l.status === 'valid',
    ).length,
    selesai: laporan.filter((l) => l.status === 'selesai').length,
    ditolak: laporan.filter((l) => l.status === 'ditolak').length,
  }
}

// `as const` (bukan Record<string, ...>) supaya pemakaiannya lewat
// `tone: keyof typeof WARNA` ketat — repo ini nyalain
// noUncheckedIndexedAccess, jadi Record<string, ...> bikin hasilnya
// `possibly undefined`.
const WARNA = {
  netral: { bg: '#eef1f0', fg: '#0d3f31' },
  kuning: { bg: '#fdf3e3', fg: '#a16207' },
  biru: { bg: '#e8f2f8', fg: '#1d6f92' },
  hijau: { bg: '#e6f2ec', fg: '#15803d' },
  // Kartu ditolak sengaja netral, bukan merah: badge-nya sendiri sudah
  // merah, jadi kalau kartunya ikut merah halaman jadi teriak dua kali.
  abu: { bg: '#f0f0f1', fg: '#52525b' },
} as const

// Beranda memakai ketiganya lewat RingkasanLaporan(). Riwayat memakainya
// terpisah: kartu Total harus sebaris dengan grafik (kiri–kanan), sementara
// empat kartu status turun ke baris berikutnya — jadi komponennya tidak
// boleh terikat satu div induk.
export function RingkasanLaporan({ statistik }: { statistik: Statistik }) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <KartuTotal statistik={statistik} />
      <KartuStatus statistik={statistik} />
    </div>
  )
}

export function KartuTotal({
  statistik,
  penuh = false,
}: {
  statistik: Statistik
  /** true kalau kartunya berdiri di samping grafik (Riwayat). */
  penuh?: boolean
}) {
  return (
    <StatCard
      bar={!penuh}
      penuh={penuh}
      label="Total"
      note="Semua laporan"
      value={statistik.total}
      icon={FileText}
      tone="netral"
    />
  )
}

export function KartuStatus({ statistik }: { statistik: Statistik }) {
  return (
    // Dua kolom di ponsel (2×2), empat sejajar mulai xl — empat kartu
    // dipaksakan sejajar di 640px bikin angkanya sempit.
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <StatCard
        label="Menunggu"
        note="Belum diverifikasi"
        value={statistik.menunggu}
        icon={Clock}
        tone="kuning"
      />
      <StatCard
        label="Diproses"
        note="Sedang dikerjakan"
        value={statistik.diproses}
        icon={Wrench}
        tone="biru"
      />
      <StatCard
        label="Selesai"
        note="Sudah ditangani"
        value={statistik.selesai}
        icon={CheckCircle2}
        tone="hijau"
      />
      <StatCard
        label="Ditolak"
        note="Tidak lolos verifikasi"
        value={statistik.ditolak}
        icon={XCircle}
        tone="abu"
      />
    </div>
  )
}

function StatCard({
  label,
  note,
  value,
  icon: Icon,
  tone,
  bar = false,
  penuh = false,
}: {
  label: string
  note: string
  value: number
  icon: LucideIcon
  tone: keyof typeof WARNA
  bar?: boolean
  penuh?: boolean
}) {
  const warna = WARNA[tone]

  // Ikon jadi LATAR kartu, tapi versi kedua (28 Okt) — versi pertamanya
  // kegedean: 128–192px di pojok kanan-bawah, motong catatan dan numpang
  // di atas angka, jadi kelihatan maksa.
  //
  // Sekarang: kecil, nempel di pojok ATAS-KANAN (satu-satunya sudut yang
  // benar-benar kosong — label pendek di kiri, angka di bawahnya), dan
  // sengaja kepotong tepi kartu. Yang kelihatan cuma sisa sudutnya, jadi
  // bacaannya "aksen", bukan "stiker nempel". Opacity turun juga:
  // fill 8% + garis 16% — cukup buat nunjukkin tone, nggak cukup buat
  // berebut sama teks.
  //
  // Wajib `relative` di pembungkus isi: elemen absolute di painting
  // order-nya di atas saudara statis, jadi tanpa ini ikon numpang di
  // atas teks walau posisinya kelihatan "di pojok".
  const ukuran = penuh ? 'size-28' : bar ? 'size-24' : 'size-20'
  const geser = penuh ? '-top-6 -right-6' : '-top-5 -right-5'
  const latar = (
    <Icon
      aria-hidden="true"
      className={`pointer-events-none absolute ${geser} rotate-12 ${ukuran}`}
      style={{ color: warna.fg }}
      fill="currentColor"
      fillOpacity={0.08}
      strokeOpacity={0.16}
      strokeWidth={1.5}
    />
  )

  if (penuh) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-black/5 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,20,0.05)] sm:p-5">
        {latar}
        {/* `h-full` + justify-between: kartu ini menempel di samping
            grafik, jadi tingginya mengikuti grafik (~300px). Tanpa ini
            isinya cuma tiga baris teks di tengah kotak putih. */}
        <div className="relative flex h-full flex-col justify-between gap-3">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-neutral-500 uppercase">
            {label}
          </p>

          {/* Angka sengaja jauh lebih besar daripada versi bar: di ruang
              vertikal setinggi grafik, angka 26px bakal tenggelam. */}
          <p className="text-[52px] leading-none font-semibold tracking-tight text-neutral-900 tabular-nums">
            {value}
          </p>

          <p className="text-xs text-neutral-400">{note}</p>
        </div>
      </div>
    )
  }

  if (bar) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-black/5 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(16,24,20,0.05)] sm:px-5 sm:py-5">
        {latar}
        <div className="relative min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-neutral-500 uppercase">
            {label}
          </p>
          <p className="mt-2.5 text-[32px] leading-none font-semibold tracking-tight text-neutral-900 tabular-nums">
            {value}
          </p>
          <p className="mt-1.5 text-xs text-neutral-400">{note}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-black/5 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,20,0.05)] sm:p-5">
      {latar}
      <div className="relative">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-neutral-500 uppercase">
          {label}
        </p>
        <p className="mt-3 text-[26px] leading-none font-semibold tracking-tight text-neutral-900 tabular-nums">
          {value}
        </p>
        <p className="mt-1.5 text-xs text-neutral-400">{note}</p>
      </div>
    </div>
  )
}
