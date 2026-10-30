import { useState, type ReactNode } from 'react'
import { ChevronDownIcon, ImageIcon, InboxIcon } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  KATEGORI_LABEL,
  errorMessage,
  useLaporanList,
  type Laporan,
  type LaporanKategori,
} from './laporan-query'
import { GrafikTahunan } from './grafik-tahunan'
import { KartuStatus, KartuTotal, hitungStatistik } from './ringkasan-laporan'
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
  const [bulanDipilih, setBulanDipilih] = useState<string | null>(null)

  if (list.isPending) return <RiwayatSkeleton />

  if (list.isError) {
    return (
      <div className="border-destructive/30 bg-destructive/5 rounded-3xl border p-5">
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

  if (laporans.length === 0) return <Kosong />

  const statistik = hitungStatistik(laporans)

  // Semua bulan ditawarkan, bukan cuma yang datanya sudah ada —
  // permintaan 27 Okt: pengguna harus bisa membuka bulan kosong dan tahu
  // betul bahwa "tidak ada laporan", bukan hanya bulan-bulan yang kebetulan
  // sudah terisi.
  const tersedia = semuaBulan(laporans)

  // Ringkasan dan grafik selalu membaca SEMUA laporan; yang disaring cuma
  // daftar di bawahnya. Kalau ikut tersaring, angka total berubah sendiri
  // tiap kali chip ditekan dan tidak ada yang bisa dipercaya.
  const tampil = bulanDipilih
    ? laporans.filter(
        (laporan) => kunciBulan(laporan.created_at) === bulanDipilih,
      )
    : laporans

  // Urutan: baris atas TOTAL (kiri) + grafik (kanan), lalu empat kartu
  // status, baru daftar per bulan — permintaan 27 Okt.
  return (
    <div className="flex flex-col gap-5">
      <section aria-label="Ringkasan laporan" className="flex flex-col gap-4">
        <h2 className="text-[11px] font-semibold tracking-[0.12em] text-[#0d3f31]/70 uppercase">
          Ringkasan
        </h2>

        {/* minmax(0,…) di kedua kolom supaya kartu total tidak pernah
            memaksa grafik menyusut — SVG-nya lebar penuh, jadi kalau
            kolom kanan sempit, grafiknya ikut pecah.
            Kartu total memakai `penuh` supaya ikut tinggi grafik, bukan
            berhenti di atas dan meninggalkan space kosong di bawahnya. */}
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <KartuTotal statistik={statistik} penuh />
          <GrafikTahunan laporans={laporans} />
        </div>

        <KartuStatus statistik={statistik} />
      </section>

      <DaftarPerBulan
        laporans={tampil}
        tersedia={tersedia}
        bulanDipilih={bulanDipilih}
        onPilih={(kunci) => setBulanDipilih(kunci)}
      />
    </div>
  )
}

// ============================================================
// DAFTAR PER BULAN + PEMILIH BULAN
//
// Satu <section> pembungkus dengan aria-label — bukan cuma rapi secara
// visual, tapi juga jangkar untuk test: label kartu ringkasan ("Selesai",
// "Ditolak") sama persis dengan teks badge di daftar ini, jadi tanpa
// pemisah ruang getByText bakal nemu dua elemen.
// ============================================================
function DaftarPerBulan({
  laporans,
  tersedia,
  bulanDipilih,
  onPilih,
}: {
  laporans: Laporan[]
  tersedia: string[]
  bulanDipilih: string | null
  onPilih: (kunci: string | null) => void
}) {
  const kelompok = kelompokPerBulan(laporans)

  return (
    <section aria-label="Daftar laporan" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[11px] font-semibold tracking-[0.12em] text-[#0d3f31]/70 uppercase">
          Daftar Laporan
        </h2>

        <div
          role="group"
          aria-label="Saring per bulan"
          className="flex flex-wrap gap-2"
        >
          <ChipPilih
            aktif={bulanDipilih === null}
            onClick={() => onPilih(null)}
          >
            Semua
          </ChipPilih>
          {tersedia.map((kunci) => (
            <ChipPilih
              key={kunci}
              aktif={bulanDipilih === kunci}
              onClick={() => onPilih(kunci)}
            >
              {labelBulanSingkat(kunci)}
            </ChipPilih>
          ))}
        </div>
      </div>

      {/* Bulan sengaja bisa dipilih walaupun kosong, dan kalau kosong
          jawabannya ditulis tegas — bukan daftar yang mendadak jadi
          kosong tanpa penjelasan. */}
      {kelompok.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-black/10 bg-white px-5 py-12 text-center">
          <p className="text-sm font-medium text-neutral-800">
            Tidak ada laporan
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            {bulanDipilih
              ? `Belum ada laporan yang dikirim pada ${labelBulan(bulanDipilih)}.`
              : 'Belum ada laporan yang dikirim.'}
          </p>
        </div>
      ) : (
        kelompok.map(([kunci, isi]) => (
          <div key={kunci}>
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-[11px] font-semibold tracking-[0.12em] text-[#0d3f31]/70 uppercase">
                {labelBulan(kunci)}
              </h3>
              <span className="text-xs text-neutral-400 tabular-nums">
                {`${isi.length} laporan`}
              </span>
            </div>

            <ul className="mt-3 flex flex-col gap-3">
              {isi.map((laporan) => (
                <KartuLaporan key={laporan.id} laporan={laporan} />
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  )
}

function ChipPilih({
  aktif,
  onClick,
  children,
}: {
  aktif: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={aktif}
      className={cn(
        'rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
        aktif
          ? 'bg-[#0d3f31] text-white shadow-[0_1px_2px_rgba(16,24,20,0.12)]'
          : 'border border-black/8 bg-white text-neutral-600 hover:bg-[#eef4f1] hover:text-neutral-900',
      )}
    >
      {children}
    </button>
  )
}

// Kunci "YYYY-MM" dari tanggal lokal (bukan potongan string ISO): supaya
// label bulan yang tampil dan pengelompokannya membaca tanggal yang sama.
function kunciBulan(iso: string | null): string {
  if (!iso) return 'tanpa-tanggal'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'tanpa-tanggal'
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Semua kunci "YYYY-MM" yang layak ditawarkan sebagai pilihan: 12 bulan
// untuk tahun berjalan, plus 12 bulan untuk setiap tahun yang benar-benar
// muncul di data. Kuncinya dibangun, bukan diturunkan dari data — kalau
// diturunkan dari data, bulan kosong tidak akan pernah muncul di daftar
// pilihan dan permintaan 27 Okt itu mustahil dipenuhi.
function semuaBulan(laporans: Laporan[]): string[] {
  const tahun = new Set<string>([String(new Date().getFullYear())])
  for (const laporan of laporans) {
    const kunci = kunciBulan(laporan.created_at)
    if (kunci !== 'tanpa-tanggal') tahun.add(kunci.slice(0, 4))
  }

  return [...tahun]
    .sort((a, b) => Number(b) - Number(a)) // tahun terbaru dulu
    .flatMap((tahunTerpilih) =>
      Array.from(
        { length: 12 },
        (_, i) => `${tahunTerpilih}-${String(i + 1).padStart(2, '0')}`,
      ),
    )
}

// laporans sudah diurutkan terbaru di pemanggilnya, dan Map mempertahankan
// urutan sisipan — jadi kelompoknya ikut terbaru dulu, item di dalamnya
// juga terbaru dulu. Tidak perlu sort ulang.
function kelompokPerBulan(laporans: Laporan[]): Array<[string, Laporan[]]> {
  const peta = new Map<string, Laporan[]>()
  for (const laporan of laporans) {
    const kunci = kunciBulan(laporan.created_at)
    const sebelumnya = peta.get(kunci)
    if (sebelumnya) sebelumnya.push(laporan)
    else peta.set(kunci, [laporan])
  }
  return [...peta.entries()]
}

function labelBulan(kunci: string): string {
  if (kunci === 'tanpa-tanggal') return 'Tanpa tanggal'
  const bagian = kunci.split('-')
  const tahun = Number(bagian[0])
  const bulan = Number(bagian[1])
  if (!tahun || !bulan) return 'Tanpa tanggal'
  return new Date(tahun, bulan - 1, 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  })
}

const formatBulanSingkat = new Intl.DateTimeFormat('id-ID', {
  month: 'short',
  year: 'numeric',
})

// Versi pendek untuk chip pemilih bulan ("Okt 2026"). Sengaja berbeda
// dari labelBulan() ("Oktober 2026") yang dipakai judul kelompok di
// bawahnya — kalau keduanya identik, getByText('Oktober 2026') bakal
// nemu dua elemen dan test-nya jatuh.
function labelBulanSingkat(kunci: string): string {
  if (kunci === 'tanpa-tanggal') return 'Tanpa tanggal'
  const bagian = kunci.split('-')
  const tahun = Number(bagian[0])
  const bulan = Number(bagian[1])
  if (!tahun || !bulan) return 'Tanpa tanggal'
  return formatBulanSingkat.format(new Date(tahun, bulan - 1, 1))
}

// ============================================================
// KARTU + DETAIL
//
// Versi ringkas: kategori, lokasi, satu baris deskripsi, badge, tanggal.
// Tombol "Detail" memanjangkan kartu (render bersyarat, bukan
// `hidden`/`display:none`) sehingga isi detailnya benar-benar tidak ada di
// DOM sampai diminta — kalau cuma disembunyikan lewat CSS, teksnya masih
// kebaca oleh getByText dan ganda dengan baris ringkasnya.
// ============================================================
function KartuLaporan({ laporan }: { laporan: Laporan }) {
  const [terbuka, setTerbuka] = useState(false)

  return (
    <li>
      <Card className="gap-3 rounded-3xl px-5 py-4">
        {/* Foto di kiri kartu ringkas — permintaan 27 Okt. Slotnya tetap
            digambar walaupun `foto` null, supaya tempat fotonya kelihatan
            dan tingginya kartu tidak "melompat" antar baris. */}
        <div className="flex gap-4">
          <FotoLaporan
            foto={laporan.foto}
            className="size-20 shrink-0 sm:size-24"
          />

          {/* Di ponsel kategori+deskripsi dan badge+tanggal ditumpuk
              vertikal — versi berdampingan di layar sempit pecah: slot
              foto sudah menyedot 80px, sisa lebarnya cuma ~250px, dan
              badge "Menunggu Verifikasi" sendiri butuh ~180px, jadi
              "Gedung B Lantai 3" terpotong tiga baris. */}
          <div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-x-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {kategoriLabel(laporan.kategori)}
                <span className="text-muted-foreground font-normal">
                  {' '}
                  · {laporan.lokasi}
                </span>
              </p>
              <p className="text-muted-foreground mt-1 line-clamp-1 text-sm">
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
        </div>

        <div className="flex justify-end border-t border-black/5 pt-2.5">
          <button
            type="button"
            aria-expanded={terbuka}
            onClick={() => setTerbuka((buka) => !buka)}
            className="inline-flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold text-[#0d3f31] transition-colors hover:bg-[#0d3f31]/6"
          >
            {terbuka ? 'Tutup' : 'Detail'}
            <ChevronDownIcon
              aria-hidden="true"
              className={`size-3.5 transition-transform ${
                terbuka ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {terbuka && <Detail laporan={laporan} />}
      </Card>
    </li>
  )
}

function Detail({ laporan }: { laporan: Laporan }) {
  const baris = [
    { dt: 'ID Laporan', dd: `#${laporan.id}` },
    { dt: 'Kategori', dd: kategoriLabel(laporan.kategori) },
    { dt: 'Lokasi', dd: laporan.lokasi },
    { dt: 'Tanggal kirim', dd: tanggal(laporan.created_at) },
    { dt: 'Terakhir diperbarui', dd: tanggal(laporan.updated_at) },
  ]

  return (
    <div className="rounded-3xl bg-[#f5f7f6] p-4 ring-1 ring-black/5">
      {/* foto kiri, keterangan kanan — permintaan 27 Okt. Mulai `lg`
          karena di bawah itu kolom kanan sempit dan `dl` dua kolomnya jadi
          sesak; di bawah lg foto dulu baru keterangan. */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
            Foto
          </p>
          <FotoLaporan
            besar
            foto={laporan.foto}
            className="mt-1.5 aspect-[4/3] w-full"
          />
        </div>

        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {baris.map((item) => (
            <div key={item.dt}>
              <dt className="text-[11px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
                {item.dt}
              </dt>
              <dd className="mt-0.5 text-sm text-neutral-800">{item.dd}</dd>
            </div>
          ))}

          <div className="sm:col-span-2">
            <dt className="text-[11px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
              Status
            </dt>
            <dd className="mt-1">
              <StatusBadge status={laporan.status} />
            </dd>
          </div>

          <div className="sm:col-span-2">
            <dt className="text-[11px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
              Deskripsi
            </dt>
            <dd className="mt-0.5 text-sm leading-relaxed break-words text-neutral-800">
              {laporan.deskripsi}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

// `foto` disimpan sebagai path relatif di disk `public` (contoh:
// "laporan/abc.jpg"), bukan URL lengkap. Dipasang begitu saja ke
// <img src> bakal diminta ke origin frontend dan 404, jadi harus dibangun
// dulu. Basis API defaultnya `/api/v1` — relatif, satu origin dengan
// frontend — jadi storasenya di `/storage/...` pada origin yang sama, dan
// vite dev mem-proxy path itu (lihat vite.config.ts).
function fotoUrl(foto: string): string {
  if (/^(https?:|data:|blob:)/.test(foto)) return foto

  const dasar = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
  const origin = /^https?:\/\//.test(dasar)
    ? dasar.replace(/\/api\/v\d+\/?$/, '')
    : ''

  return `${origin}/storage/${foto.replace(/^\/+/, '')}`
}

// ============================================================
// SLOT FOTO
//
// Dua kondisi, satu kotak berukuran sama supaya tata letaknya tidak
// berubah di antara keduanya:
//   - ada foto & berhasil dimuat → <img>
//   - `foto` null ATAU gagal dimuat → slot putus-putus
//
// Slot kosongnya sengaja tetap digambar (permintaan 27 Okt): ini yang
// bikin tempat fotonya kelihatan sebelum ada fotonya, jadi tidak ada
// yang perlu menebak posisinya nanti. `onError` menutup kasus foto
// sudah ada tapi URL-nya belum bisa dijangkau — bukannya ikon patah,
// penggunanya tetap lihat kotak slot yang sama.
// ============================================================
function FotoLaporan({
  foto,
  besar = false,
  className,
}: {
  foto: string | null
  besar?: boolean
  className?: string
}) {
  const [gagal, setGagal] = useState(false)

  if (foto && !gagal) {
    return (
      <img
        src={fotoUrl(foto)}
        alt="Foto laporan"
        loading="lazy"
        onError={() => setGagal(true)}
        className={cn(
          'rounded-2xl border border-black/5 bg-[#f5f7f6] object-cover',
          className,
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-black/12 bg-[#f5f7f6] px-2 text-neutral-400',
        className,
      )}
    >
      <ImageIcon
        aria-hidden="true"
        strokeWidth={1.5}
        className={besar ? 'size-9' : 'size-5'}
      />
      <span
        className={cn(
          'text-center leading-tight font-medium tracking-wide uppercase',
          besar ? 'text-xs' : 'text-[10px]',
        )}
      >
        {foto ? 'Foto tidak termuat' : 'Belum ada foto'}
      </span>
    </div>
  )
}

// ============================================================
// KONDISI LAIN
// ============================================================
function Kosong() {
  return (
    <Card className="items-center gap-3 rounded-3xl px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-[#e6f2ec] text-[#0d3f31]">
        <InboxIcon aria-hidden="true" className="size-5" />
      </span>
      <p className="text-base font-medium">Belum ada laporan yang kamu kirim</p>
      <p className="text-muted-foreground max-w-sm text-sm">
        Ada fasilitas yang rusak? Kirim laporan pertamamu, lalu pantau prosesnya
        dari halaman ini.
      </p>
      {/*
        Pakai <Link> biasa, bukan <Button render={<Link>}> — sama persis
        dengan pola CTA di dashboard. Base UI Button nempelin `nativeButton`
        semantics, jadi link-nya kebaca sebagai role="button" (aksesibilitas
        rusak) dan console nge-spam peringatan. Keduanya ketahuan pas rehearsal.
      */}
      <Link
        to="/lapor"
        className="mt-2 inline-flex h-10 items-center gap-2 rounded-2xl bg-[#0d3f31] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0a3127]"
      >
        Laporkan Kerusakan
      </Link>
    </Card>
  )
}

// Loading: skeleton yang tingginya kira-kira sama dengan isi halaman
// (grafik → ringkasan → daftar), jadi halaman gak "melompat" waktu data
// datang.
function RiwayatSkeleton() {
  return (
    <>
      <p className="sr-only">Memuat riwayat laporan...</p>
      <div aria-busy="true" className="flex flex-col gap-5">
        {/* grafik */}
        <div className="rounded-3xl border border-black/5 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="mt-2 h-3 w-56" />
            </div>
            <div className="shrink-0 text-right">
              <Skeleton className="ml-auto h-6 w-10" />
              <Skeleton className="mt-2 ml-auto h-3 w-28" />
            </div>
          </div>
          <Skeleton className="mt-4 h-40 w-full rounded-2xl" />
        </div>

        {/* ringkasan: total sendirian di atas, empat kartu di bawahnya */}
        <div>
          <Skeleton className="h-3 w-20" />
          <div className="mt-3 flex flex-col gap-3 sm:gap-4">
            <Skeleton className="h-24 w-full rounded-3xl" />
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={`ringkasan-${i}`} className="h-32 rounded-3xl" />
              ))}
            </div>
          </div>
        </div>

        {/* daftar */}
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={`kartu-${i}`} className="h-24 w-full rounded-3xl" />
          ))}
        </div>
      </div>
    </>
  )
}
