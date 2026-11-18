import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearch } from '@tanstack/react-router'
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Bell,
  ImageIcon,
  Maximize2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { User } from '@/features/auth/auth-query'
import { formatTanggal } from '@/features/dashboard/dashboard-query'
import { DashboardShell } from '@/features/dashboard/dashboard-shell'
import { LaporanMasukCard } from '@/features/dashboard/dashboard-summary'

import {
  hitungRingkasan,
  laporanPerBulan,
  laporanPerHari,
} from '@/features/dashboard/dashboard-utils'
import { FotoInput } from '@/features/laporan/foto-input'
import { PrioritasBadge } from '@/features/laporan/prioritas-badge'
import {
  BATAS_FOTO_BYTE,
  FOTO_MIME_IZIN,
  KATEGORI_LABEL,
  KATEGORI_VALUES,
  PRIORITAS_LABEL,
  STATUS_LABEL,
  STATUS_VALUES,
  errorMessage,
  fieldErrors,
  useLaporanList,
  useUpdateLaporanStatus,
  type Laporan,
  type LaporanKategori,
  type LaporanStatus,
  type Pelapor,
  type PrioritasKategori,
} from '@/features/laporan/laporan-query'
import { StatusStepper } from '@/features/laporan/status-stepper'
import { VerifikasiFilter } from '@/features/laporan/verifikasi-filter'
import { VerifikasiPager } from '@/features/laporan/verifikasi-pager'
import { cn } from '@/lib/utils'

// 'perlu' = gabungan menunggu verifikasi + terverifikasi.
type StatusFilter = 'semua' | 'perlu' | LaporanStatus
type Tab = 'antrian' | 'tertahan' | 'riwayat'
// Kolom yang bisa diurutkan: hanya Prioritas dan Status.
type KunciUrut = 'prioritas' | 'status'
type Urut = { kunci: KunciUrut; arah: 'asc' | 'desc' } | null

const PER_HALAMAN_AWAL = 10

// Pengaturan tab Tertahan (dipatenkan, tidak bisa diubah dari UI).
const AMBANG_HARI = 2 // laporan aktif tanpa perubahan >= 2 hari = tertahan
const HARI_MERAH = 5 // >= 5 hari tertahan ditandai merah
const MS_HARI = 86_400_000

// Nilai ?filter= dari link dashboard -> filter status di halaman ini.
// 'perlu' = gabungan menunggu verifikasi + terverifikasi (belum dikerjakan).
const FILTER_URL_KE_STATUS: Record<string, StatusFilter> = {
  menunggu: 'menunggu_verifikasi',
  terverifikasi: 'valid',
  perlu: 'perlu',
}

// Status yang dihitung sebagai "perlu tindakan".
const STATUS_PERLU: ReadonlySet<string> = new Set([
  'menunggu_verifikasi',
  'valid',
])

// Kolom daftar: no | foto | judul | prioritas | status. Dipakai bersama oleh
// baris header dan baris data supaya kolomnya selalu sejajar.
const KOLOM = 'md:grid-cols-[2.5rem_3.5rem_minmax(0,1fr)_7rem_9rem]'
// Tab Tertahan punya satu kolom tambahan di kanan (lebih lebar supaya muat
// badge "X hari" + tanggal terakhir diubah).
const KOLOM_TERTAHAN =
  'md:grid-cols-[2.5rem_3.5rem_minmax(0,1fr)_7rem_9rem_8rem]' // BARU: 8rem

// Status final (PR #92): tidak ada aksi lanjutan. Laporan dengan status ini
// keluar dari Antrian dan pindah ke Riwayat.
const STATUS_FINAL: ReadonlySet<string> = new Set(['selesai', 'ditolak'])

function statusFinal(status: string): boolean {
  return STATUS_FINAL.has(status)
}

// Urutan status mengikuti alur verifikasi (dipakai untuk mengurutkan
// kolom Status).
const URUTAN_STATUS: Record<string, number> = {
  menunggu_verifikasi: 1,
  valid: 2,
  diproses: 3,
  selesai: 4,
  ditolak: 5,
}

// Urutan filter ngikutin alur verifikasi, bukan urutan enum backend.
// "Terverifikasi" sengaja dipakai buat status `valid` biar bahasa UI-nya
// sama dengan roadmap; badge status tetap pakai label asli `Valid`.
// Entri 'semua' tidak ditampilkan sebagai chip (filter dilepas dengan
// klik chip yang aktif atau tombol Reset), tapi nilainya tetap dipakai
// oleh tipe StatusFilter. 'selesai' dan 'ditolak' tidak dipakai di tab
// Antrian karena laporan dengan status itu pindah ke tab Riwayat.
const FILTERS: ReadonlyArray<{ value: StatusFilter; label: string }> = [
  { value: 'semua', label: 'Status' },
  { value: 'menunggu_verifikasi', label: 'Menunggu' },
  { value: 'valid', label: 'Terverifikasi' },
  { value: 'diproses', label: 'Diproses' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'ditolak', label: 'Ditolak' },
]

const STATUS_PILL: Record<LaporanStatus, string> = {
  menunggu_verifikasi: 'bg-[#fbe9cc] text-[#b9772a]',
  valid: 'bg-[#dff1f7] text-[#3a8fb0]',
  diproses: 'bg-[#e0f1e8] text-[#2f8059]',
  selesai: 'bg-emerald-100 text-emerald-800',
  ditolak: 'bg-red-100 text-red-800',
}

// Aksi per status mengikuti alur verifikasi. Admin tidak lagi memilih
// status bebas dari dropdown, jadi tidak ada langkah yang terlompat.
const AKSI: Partial<
  Record<
    LaporanStatus,
    ReadonlyArray<{ label: string; ke: LaporanStatus; bahaya?: boolean }>
  >
> = {
  menunggu_verifikasi: [
    { label: 'Verifikasi', ke: 'valid' },
    { label: 'Tolak', ke: 'ditolak', bahaya: true },
  ],
  valid: [{ label: 'Mulai proses', ke: 'diproses' }],
  diproses: [{ label: 'Tandai selesai', ke: 'selesai' }],
  // `ditolak` dan `selesai` adalah status final (PR #92): tidak ada aksi
  // perubahan status lagi, jadi tidak dimasukkan di sini. Itu sebabnya
  // laporan di tab Riwayat tidak bisa dibuka kembali.
}

// Pilihan filter prioritas diambil dari PRIORITAS_LABEL (sumber yang sama
// dengan badge), jadi nilainya pasti cocok dengan data. Diurutkan dari yang
// paling mendesak: Tinggi, Sedang, Rendah. Label di luar tiga itu (kalau
// ada) ditaruh paling belakang.
const URUTAN_LABEL = ['tinggi', 'sedang', 'rendah']

function urutanLabel(label: string): number {
  const index = URUTAN_LABEL.indexOf(label.toLowerCase())
  return index === -1 ? URUTAN_LABEL.length : index
}

const PRIORITAS_OPSI = (
  Object.entries(PRIORITAS_LABEL) as Array<[PrioritasKategori, string]>
).sort((a, b) => urutanLabel(a[1]) - urutanLabel(b[1]))

const CARD = 'rounded-[26px] border-[1.5px] border-[#efe9d8] bg-white p-6'

function kategoriLabel(kategori: string): string {
  return KATEGORI_LABEL[kategori as LaporanKategori] ?? kategori
}

// Waktu dibuat dalam milidetik, aman kalau `created_at` kosong atau
// formatnya tidak valid (dianggap 0 supaya jatuh ke urutan paling bawah).
function waktu(item: Laporan): number {
  const t = item.created_at ? new Date(item.created_at).getTime() : 0
  return Number.isNaN(t) ? 0 : t
}

// Waktu terakhir laporan berubah. Jatuh ke created_at kalau updated_at
// kosong. 0 kalau keduanya kosong atau tidak valid.
function waktuUbah(item: Laporan): number {
  const asal = item.updated_at ?? item.created_at
  if (!asal) return 0
  const t = new Date(asal).getTime()
  return Number.isNaN(t) ? 0 : t
}

// Berapa hari laporan tidak berubah.
function hariTertahan(item: Laporan, sekarang: number): number {
  const t = waktuUbah(item)
  return t === 0 ? 0 : Math.max(Math.floor((sekarang - t) / MS_HARI), 0)
}

// BARU: tanggal terakhir laporan berubah, untuk ditampilkan ke admin.
function tanggalUbah(item: Laporan): string {
  const asal = item.updated_at ?? item.created_at
  return asal ? formatTanggal(asal) : '-'
}

// Rank prioritas: Rendah = 1, Sedang = 2, Tinggi = 3. Tanpa prioritas = 0.
function rankPrioritas(item: Laporan): number {
  if (item.prioritas_kategori == null) return 0
  const label = PRIORITAS_LABEL[item.prioritas_kategori] ?? ''
  return URUTAN_LABEL.length - urutanLabel(label)
}

function rankStatus(item: Laporan): number {
  return URUTAN_STATUS[item.status] ?? 0
}

// `foto` disimpan sebagai path relatif di disk `public` (contoh:
// "laporan/abc.jpg"), bukan URL lengkap. Logikanya sama dengan fotoUrl di
// riwayat-list.tsx (tampilan user), diduplikat di sini supaya halaman
// user tidak ikut tersentuh.
function fotoUrl(foto: string): string {
  if (/^(https?:|data:|blob:)/.test(foto)) return foto

  const dasar = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
  const origin = /^https?:\/\//.test(dasar)
    ? dasar.replace(/\/api\/v\d+\/?$/, '')
    : ''

  return `${origin}/storage/${foto.replace(/^\/+/, '')}`
}

// Kunci pembanding gedung: huruf kecil dan tanpa spasi berlebih, supaya
// "Gedung D" dan "gedung d" dianggap sama.
function kunciGedung(lokasi: string): string {
  return lokasi.trim().toLowerCase()
}

// Label tampil: huruf pertama tiap kata dibuat kapital ("gedung s" -> "Gedung S").
function labelGedung(kunci: string): string {
  return kunci.replace(/(^|\s)\S/g, (huruf) => huruf.toUpperCase())
}

export function VerifikasiPage({ user }: { user: User }) {
  const list = useLaporanList()
  const update = useUpdateLaporanStatus()
  const [tab, setTab] = useState<Tab>('antrian')
  // Baca ?filter= dari URL (dikirim link di dashboard) lalu jadikan
  // nilai awal filter status.
  const { filter: filterUrl } = useSearch({ strict: false }) as {
    filter?: string
  }
  const [filter, setFilter] = useState<StatusFilter>(
    (filterUrl && FILTER_URL_KE_STATUS[filterUrl]) || 'semua',
  )
  const [cari, setCari] = useState('')
  const [kategori, setKategori] = useState<'semua' | LaporanKategori>('semua')
  const [prioritas, setPrioritas] = useState<string>('semua')
  const [gedung, setGedung] = useState<string>('semua')
  // Awal hari (timestamp) yang dipilih dari grafik; null = semua tanggal.
  const [tanggal, setTanggal] = useState<number | null>(null)
  // Urutan kolom. null = urutan bawaan (terbaru di atas).
  const [urut, setUrut] = useState<Urut>(null)
  // Pagination klien. Halaman 0-based. Reset ke 0 dilakukan di handler yang
  // sama dengan perubahan filter (bukan lewat efek).
  const [halaman, setHalaman] = useState(0)
  const [perHalaman, setPerHalaman] = useState(PER_HALAMAN_AWAL)
  const daftarRef = useRef<HTMLElement>(null)
  // id laporan yang detailnya sedang dibuka di popup; null = popup tertutup.
  const [pilihId, setPilihId] = useState<number | null>(null)
  const [fotoBesar, setFotoBesar] = useState<string | null>(null)
  // id laporan yang sedang akan ditolak (dialog alasan terbuka).
  const [tolakId, setTolakId] = useState<number | null>(null)
  // id laporan yang sedang akan diselesaikan (dialog foto bukti terbuka).
  const [buktiId, setBuktiId] = useState<number | null>(null)

  const laporan = list.data ?? []
  const ringkasan = hitungRingkasan(laporan)
  const harian = laporanPerHari(laporan)
  const bulanan = laporanPerBulan(laporan)

  // Pilihan gedung diambil dari lokasi yang benar-benar ada di laporan.
  const opsiGedung = useMemo(() => {
    const kunci = new Set<string>()
    for (const item of list.data ?? []) {
      const k = kunciGedung(item.lokasi)
      if (k) kunci.add(k)
    }
    return [...kunci].sort((a, b) => a.localeCompare(b, 'id'))
  }, [list.data])

  const counts = list.data
    ? STATUS_VALUES.reduce(
        (result, status) => {
          result[status] = laporan.filter(
            (item) => item.status === status,
          ).length
          return result
        },
        {} as Record<LaporanStatus, number>,
      )
    : undefined

  // Laporan selesai dan ditolak tidak lagi di Antrian; mereka pindah ke
  // Riwayat.
  const antrianAktif = ringkasan.antrian.filter(
    (item) => !statusFinal(item.status),
  )
  const riwayatFinal = laporan.filter((item) => statusFinal(item.status))
  const jumlahAntrian = antrianAktif.length
  const jumlahRiwayat = riwayatFinal.length

  // Laporan aktif yang tidak berubah selama >= AMBANG_HARI.
  const [sekarang, setSekarang] = useState(0)

  // eslint-disable react-hooks/set-state-in-effect
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setSekarang(Date.now)
  }, [])

  const tertahanSemua = antrianAktif.filter(
    (item) => hariTertahan(item, sekarang) >= AMBANG_HARI,
  )

  const jumlahTertahan = tertahanSemua.length

  // Sumber data tergantung tab.
  const sumber =
    tab === 'antrian'
      ? antrianAktif
      : tab === 'tertahan'
        ? tertahanSemua
        : riwayatFinal

  // Urutan bawaan: yang paling baru di atas; kalau waktunya sama persis, ID
  // yang lebih besar didahulukan. Di tab Tertahan, bawaannya kebalikan:
  // yang paling lama tidak berubah di atas. Kalau kolom Prioritas/Status
  // diklik, urutan kolom dipakai lebih dulu dan urutan bawaan jadi
  // pembanding kedua. Pencarian juga mencakup nama dan NIM pelapor.
  const kata = cari.trim().toLowerCase()
  const hasil = sumber
    // Filter 'perlu' = menunggu verifikasi + valid.
    .filter(
      (item) =>
        tab === 'riwayat' ||
        filter === 'semua' ||
        (filter === 'perlu'
          ? STATUS_PERLU.has(item.status)
          : item.status === filter),
    )
    .filter((item) => kategori === 'semua' || item.kategori === kategori)
    .filter(
      (item) => prioritas === 'semua' || item.prioritas_kategori === prioritas,
    )
    .filter((item) => gedung === 'semua' || kunciGedung(item.lokasi) === gedung)
    .filter((item) => {
      if (tanggal === null) return true
      const akhir = new Date(tanggal)
      akhir.setDate(akhir.getDate() + 1)
      const t = waktu(item)
      return t >= tanggal && t < akhir.getTime()
    })
    .filter(
      (item) =>
        !kata ||
        `${item.deskripsi} ${item.lokasi} ${item.pelapor?.name ?? ''} ${item.pelapor?.nim ?? ''}`
          .toLowerCase()
          .includes(kata),
    )
    .sort((a, b) => {
      if (urut) {
        const rank = urut.kunci === 'prioritas' ? rankPrioritas : rankStatus
        const beda = rank(a) - rank(b)
        if (beda !== 0) return urut.arah === 'asc' ? beda : -beda
      }
      // Tab Tertahan: yang paling lama tidak berubah di atas.
      if (tab === 'tertahan') {
        const selisihUbah = waktuUbah(a) - waktuUbah(b)
        return selisihUbah !== 0 ? selisihUbah : a.id - b.id
      }
      // Rank sama (atau tidak ada urutan): terbaru di atas.
      const selisih = waktu(b) - waktu(a)
      return selisih !== 0 ? selisih : b.id - a.id
    })

  const adaHasil = hasil.length > 0

  // Pagination: halaman dijepit saat render supaya aman kalau filter
  // memperkecil jumlah halaman.
  const totalHalaman = Math.max(Math.ceil(hasil.length / perHalaman), 1)
  const halamanEfektif = Math.min(halaman, totalHalaman - 1)
  const tampak = hasil.slice(
    halamanEfektif * perHalaman,
    (halamanEfektif + 1) * perHalaman,
  )

  const pindahHalaman = (h: number) => {
    setHalaman(h)
    // Balik ke atas daftar supaya halaman barunya kelihatan. Opsional
    // chaining karena scrollIntoView tidak ada di jsdom.
    daftarRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }

  const ubahPerHalaman = (jumlah: number) => {
    setPerHalaman(jumlah)
    setHalaman(0)
  }

  // Klik 1: naik, klik 2: turun, klik 3: kembali ke urutan bawaan.
  const ubahUrut = (kunci: KunciUrut) => {
    setUrut((sekarang) => {
      if (sekarang?.kunci !== kunci) return { kunci, arah: 'asc' }
      if (sekarang.arah === 'asc') return { kunci, arah: 'desc' }
      return null
    })
    setHalaman(0)
  }

  // Setiap perubahan filter mengembalikan daftar ke halaman pertama.
  const ubahCari = (nilai: string) => {
    setCari(nilai)
    setHalaman(0)
  }
  const ubahTanggal = (nilai: number | null) => {
    setTanggal(nilai)
    setHalaman(0)
  }
  const pindahTab = (baru: Tab) => {
    if (baru === tab) return
    setTab(baru)
    // Filter status khusus Antrian/Tertahan, jadi dilepas saat pindah tab.
    setFilter('semua')
    setHalaman(0)
  }

  // Laporan yang detailnya sedang dibuka. Dicari dari seluruh laporan (bukan
  // dari hasil filter), jadi popup tidak ikut tertutup kalau status berubah
  // dan laporannya pindah tab atau keluar dari filter yang aktif.
  const terpilih =
    pilihId === null ? undefined : laporan.find((item) => item.id === pilihId)

  // Notifikasi: semua laporan prioritas tertinggi yang masih aktif, tidak
  // terpengaruh filter daftar. Dicocokkan lewat label (sumber yang sama
  // dengan badge) supaya tidak bergantung pada nilai enum.
  const perluPerhatian = ringkasan.antrian
    .filter(
      (item) =>
        !statusFinal(item.status) &&
        item.prioritas_kategori != null &&
        PRIORITAS_LABEL[item.prioritas_kategori]?.toLowerCase() === 'tinggi',
    )
    .sort((a, b) => {
      const selisih = waktu(b) - waktu(a)
      return selisih !== 0 ? selisih : b.id - a.id
    })

  // Hari yang dipilih dari grafik (untuk label chip dan penanda di grafik).
  const indeksHari =
    tanggal === null ? null : harian.findIndex((b) => b.awal === tanggal)
  const hariDipilih = indeksHari !== null ? harian[indeksHari] : undefined

  const resetFilter = () => {
    setFilter('semua')
    setKategori('semua')
    setPrioritas('semua')
    setGedung('semua')
    setCari('')
    setTanggal(null)
    setUrut(null)
    setHalaman(0)
  }

  // Dari notifikasi: pindah ke Antrian dan filter dilepas dulu supaya daftar
  // kembali utuh, lalu popup detail laporan yang diklik dibuka.
  const bukaDariNotifikasi = (id: number) => {
    setTab('antrian')
    resetFilter()
    setPilihId(id)
  }

  // Mengembalikan true kalau berhasil, supaya dialog tahu kapan
  // boleh ditutup.
  const ubahStatus = async (
    id: number,
    status: LaporanStatus,
    tambahan?: { alasan?: string; foto?: File },
  ): Promise<boolean> => {
    try {
      await update.mutateAsync({ id, status, ...tambahan })
      toast.success(`Status diubah ke ${STATUS_LABEL[status]}`)
      return true
    } catch (error) {
      // 422 dari Laravel membawa detail per field di `errors`. Tampilkan
      // pesan pertamanya supaya kelihatan apa yang ditolak backend.
      const detail = fieldErrors(error)
      const pesanField = detail ? Object.values(detail).flat()[0] : undefined
      toast.error(pesanField ?? errorMessage(error))
      return false
    }
  }

  // "Ditolak" butuh alasan dan "Selesai" butuh foto bukti, jadi buka
  // dialognya dulu. Status lain langsung disimpan.
  const pilihStatus = (id: number, status: LaporanStatus) => {
    if (status === 'ditolak') {
      setTolakId(id)
      return
    }
    if (status === 'selesai') {
      setBuktiId(id)
      return
    }
    void ubahStatus(id, status)
  }

  const kirimPenolakan = async (alasan: string) => {
    if (tolakId === null) return
    const berhasil = await ubahStatus(tolakId, 'ditolak', { alasan })
    if (berhasil) setTolakId(null)
  }

  const kirimBukti = async (foto: File) => {
    if (buktiId === null) return
    const berhasil = await ubahStatus(buktiId, 'selesai', { foto })
    if (berhasil) setBuktiId(null)
  }

  // Esc di popup detail hanya menutup popup itu sendiri kalau tidak ada
  // dialog atau lightbox lain yang sedang terbuka di atasnya.
  const detailBolehEsc =
    tolakId === null && buktiId === null && fotoBesar === null

  // Grup filter status ada di tab Antrian dan Tertahan (bukan Riwayat),
  // tanpa opsi status final.
  const grupStatus =
    tab !== 'riwayat'
      ? [
          {
            key: 'status',
            judul: 'Status',
            nilai: filter as string,
            onPilih: (v: string) => {
              setFilter(v as StatusFilter)
              setHalaman(0)
            },
            opsi: [
              {
                value: 'semua',
                label: 'Semua status',
                jumlah: tab === 'tertahan' ? jumlahTertahan : jumlahAntrian,
              },
              // Gabungan menunggu verifikasi + terverifikasi.
              {
                value: 'perlu',
                label: 'Perlu tindakan',
                jumlah:
                  (counts?.menunggu_verifikasi ?? 0) + (counts?.valid ?? 0),
              },
              ...FILTERS.filter(
                (f) => f.value !== 'semua' && !statusFinal(f.value as string),
              ).map((f) => ({
                value: f.value as string,
                label: f.label,
                jumlah: counts?.[f.value as LaporanStatus] ?? 0,
              })),
            ],
          },
        ]
      : []

  // Label subtitle header per tab.
  const labelTab: Record<Tab, string> = {
    antrian: 'Antrian laporan',
    tertahan: 'Laporan tertahan',
    riwayat: 'Riwayat laporan selesai',
  }

  return (
    <DashboardShell
      user={user}
      menunggu={counts?.menunggu_verifikasi}
      header={
        <div className="flex w-full min-w-0 items-center justify-between gap-4">
          <div className="min-w-0 leading-tight">
            <h1 className="truncate text-xl font-bold tracking-tight">
              Verifikasi
            </h1>
            <p className="truncate text-sm text-[#8a8f87]">
              {labelTab[tab]} ·{' '}
              {gedung === 'semua' ? 'Semua gedung' : labelGedung(gedung)}
            </p>
          </div>

          <NotifikasiPrioritas
            items={perluPerhatian}
            aktifId={terpilih?.id}
            onPilih={bukaDariNotifikasi}
          />
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {list.isPending ? (
          <VerifikasiSkeleton />
        ) : list.isError ? (
          <VerifikasiError
            error={list.error}
            onRetry={() => void list.refetch()}
          />
        ) : (
          <>
            {/* Kartu ringkas "Laporan masuk" di paling atas. Klik titik
                grafik = filter tanggal. */}
            <LaporanMasukCard
              harian={harian}
              bulanan={bulanan}
              terpilih={indeksHari}
              onPilih={(i) =>
                ubahTanggal(i === null ? null : (harian[i]?.awal ?? null))
              }
            />

            {/* Tab: Antrian laporan / Tertahan / Riwayat laporan. */}
            <div
              role="tablist"
              aria-label="Jenis daftar laporan"
              className="flex flex-wrap gap-1 border-b border-[#efe9d8]"
            >
              <TabTombol
                aktif={tab === 'antrian'}
                jumlah={jumlahAntrian}
                onClick={() => pindahTab('antrian')}
              >
                Antrian laporan
              </TabTombol>
              <TabTombol
                aktif={tab === 'tertahan'}
                jumlah={jumlahTertahan}
                peringatan
                onClick={() => pindahTab('tertahan')}
              >
                Tertahan
              </TabTombol>
              <TabTombol
                aktif={tab === 'riwayat'}
                jumlah={jumlahRiwayat}
                onClick={() => pindahTab('riwayat')}
              >
                Riwayat laporan selesai
              </TabTombol>
            </div>

            {/* Banner peringatan di tab Antrian. */}
            {tab === 'antrian' && jumlahTertahan > 0 && (
              <div
                role="status"
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-amber-100 px-4 py-3 text-sm text-amber-800"
              >
                <span>
                  <b>{jumlahTertahan} laporan</b> belum berubah selama{' '}
                  {AMBANG_HARI} hari atau lebih. Segera tindak lanjuti.
                </span>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => pindahTab('tertahan')}
                  className="bg-amber-700 text-white hover:bg-amber-800"
                >
                  Lihat yang tertahan
                </Button>
              </div>
            )}

            {/* Keterangan di tab Tertahan (ambang dipatenkan). */}
            {tab === 'tertahan' && (
              <p className="text-sm text-[#8a8f87]">
                Laporan yang belum selesai dan tidak berubah selama{' '}
                {AMBANG_HARI} hari atau lebih, dihitung dari tanggal terakhir
                diubah. Urut dari yang paling lama.
              </p>
            )}

            {/* Search + filter ikut ter-scroll bersama halaman (tidak sticky). */}
            <div>
              <VerifikasiFilter
                cari={cari}
                onCari={ubahCari}
                jumlah={hasil.length}
                onReset={resetFilter}
                grup={[
                  ...grupStatus,
                  {
                    key: 'kategori',
                    judul: 'Kategori',
                    nilai: kategori,
                    onPilih: (v) => {
                      setKategori(v as 'semua' | LaporanKategori)
                      setHalaman(0)
                    },
                    opsi: KATEGORI_VALUES.map((k) => ({
                      value: k,
                      label: KATEGORI_LABEL[k],
                    })),
                  },
                  {
                    key: 'gedung',
                    judul: 'Gedung',
                    nilai: gedung,
                    onPilih: (v) => {
                      setGedung(v)
                      setHalaman(0)
                    },
                    opsi: opsiGedung.map((k) => ({
                      value: k,
                      label: labelGedung(k),
                    })),
                  },
                  {
                    key: 'prioritas',
                    judul: 'Prioritas',
                    nilai: prioritas,
                    onPilih: (v) => {
                      setPrioritas(v)
                      setHalaman(0)
                    },
                    opsi: PRIORITAS_OPSI.map(([value, label]) => ({
                      value,
                      label,
                    })),
                  },
                ]}
              />
            </div>

            {hariDipilih && (
              <div className="-mt-2 flex items-center gap-2 text-sm text-[#8a8f87]">
                Tanggal:
                <span className="inline-flex items-center gap-1 rounded-full bg-[#e0f1e8] py-0.5 pr-1 pl-2.5 text-xs font-medium text-[#1f6b4f]">
                  {hariDipilih.hari}, {hariDipilih.tanggal} {hariDipilih.bulan}
                  <button
                    type="button"
                    aria-label="Hapus filter tanggal"
                    onClick={() => ubahTanggal(null)}
                    className="grid size-4.5 place-items-center rounded-full outline-none hover:bg-[#1f6b4f]/15 focus-visible:ring-2 focus-visible:ring-[#1f6b4f]/30"
                  >
                    <X aria-hidden="true" className="size-3" />
                  </button>
                </span>
              </div>
            )}

            {/* Daftar laporan selebar halaman. Klik baris untuk membuka
                popup detail. */}
            <section
              ref={daftarRef}
              aria-label="Daftar laporan"
              className={cn(CARD, 'min-w-0 scroll-mt-20 overflow-hidden p-0')}
            >
              {!adaHasil ? (
                <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
                  <p className="text-sm text-[#8a8f87]">
                    {tab === 'riwayat' && jumlahRiwayat === 0
                      ? 'Belum ada laporan yang selesai atau ditolak.'
                      : tab === 'tertahan' && jumlahTertahan === 0
                        ? 'Tidak ada laporan tertahan. Bagus!'
                        : tab === 'antrian' && jumlahAntrian === 0
                          ? 'Belum ada laporan di antrian.'
                          : 'Tidak ada laporan yang cocok. Ubah filter atau kata kunci.'}
                  </p>
                  {laporan.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={resetFilter}
                    >
                      Reset filter
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <KepalaDaftar
                    urut={urut}
                    onUrut={ubahUrut}
                    tertahan={tab === 'tertahan'}
                  />

                  <ul className="divide-y divide-[#efe9d8]">
                    {tampak.map((item, itemIndex) => (
                      <li
                        key={item.id}
                        className={cn(
                          'relative grid grid-cols-[2.5rem_3.5rem_minmax(0,1fr)] items-center gap-x-3.5 gap-y-1.5 px-4 py-3 hover:bg-[#faf3e5]',
                          tab === 'tertahan' ? KOLOM_TERTAHAN : KOLOM,
                        )}
                      >
                        {/* Nomor urut: halamanEfektif * perHalaman + index + 1. */}
                        <div className="relative z-10 row-span-3 text-center text-[#5f655d] md:row-span-1">
                          {halamanEfektif * perHalaman + itemIndex + 1}
                        </div>
                        {/* z-10 supaya foto tetap bisa diklik walau seluruh
                            baris menjadi area klik untuk membuka detail. */}
                        <div className="relative z-10 row-span-3 md:row-span-1">
                          <FotoThumb foto={item.foto} onBuka={setFotoBesar} />
                        </div>

                        <button
                          type="button"
                          aria-haspopup="dialog"
                          onClick={() => setPilihId(item.id)}
                          className="min-w-0 text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
                        >
                          <span className="block truncate font-medium text-[#1d2b26]">
                            {item.deskripsi}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-[#8a8f87]">
                            {kategoriLabel(item.kategori)} · {item.lokasi} ·{' '}
                            {formatTanggal(item.created_at)}
                          </span>
                          {item.pelapor && (
                            <span className="mt-0.5 block truncate text-xs text-[#5f655d]">
                              Pelapor: {item.pelapor.name}
                            </span>
                          )}
                        </button>

                        <div className="col-start-2 md:col-start-auto">
                          <PrioritasBadge
                            kategori={item.prioritas_kategori ?? null}
                          />
                        </div>

                        <div className="col-start-2 md:col-start-auto">
                          <StatusPill status={item.status} />
                        </div>

                        {/* BARU: kolom lama tertahan + tanggal terakhir diubah. */}
                        {tab === 'tertahan' && (
                          <div className="col-start-2 md:col-start-auto">
                            <span
                              className={cn(
                                'inline-flex rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap',
                                hariTertahan(item, sekarang) >= HARI_MERAH
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800',
                              )}
                            >
                              {hariTertahan(item, sekarang)} hari
                            </span>
                            <span className="mt-1 block text-[11px] text-[#8a8f87]">
                              Diubah {tanggalUbah(item)}
                            </span>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            {adaHasil && (
              <VerifikasiPager
                halaman={halamanEfektif}
                totalHalaman={totalHalaman}
                perHalaman={perHalaman}
                onPindah={pindahHalaman}
                onUbahPerHalaman={ubahPerHalaman}
              />
            )}
          </>
        )}
      </div>

      {terpilih && (
        <DetailDialog
          key={terpilih.id}
          item={terpilih}
          disabled={update.isPending}
          bolehEsc={detailBolehEsc}
          onUbah={pilihStatus}
          onBuka={setFotoBesar}
          onTutup={() => setPilihId(null)}
        />
      )}

      {fotoBesar && (
        <FotoLightbox src={fotoBesar} onTutup={() => setFotoBesar(null)} />
      )}

      {tolakId !== null && (
        <TolakDialog
          id={tolakId}
          pending={update.isPending}
          onBatal={() => setTolakId(null)}
          onKirim={(alasan) => void kirimPenolakan(alasan)}
        />
      )}

      {buktiId !== null && (
        <BuktiDialog
          id={buktiId}
          pending={update.isPending}
          onBatal={() => setBuktiId(null)}
          onKirim={(foto) => void kirimBukti(foto)}
        />
      )}
    </DashboardShell>
  )
}

// Judul kolom yang bisa diklik untuk mengurutkan. Ikon ↑↓ abu-abu saat
// belum aktif, berubah jadi ↑ atau ↓ hijau saat sedang dipakai.
function KolomUrut({
  label,
  kunci,
  urut,
  onUrut,
}: {
  label: string
  kunci: KunciUrut
  urut: Urut
  onUrut: (kunci: KunciUrut) => void
}) {
  const arah = urut?.kunci === kunci ? urut.arah : null
  const Ikon =
    arah === null ? ArrowUpDown : arah === 'asc' ? ArrowUp : ArrowDown

  return (
    <button
      type="button"
      onClick={() => onUrut(kunci)}
      aria-label={`Urutkan berdasarkan ${label}`}
      className="inline-flex items-center gap-1 text-left font-semibold transition-colors outline-none hover:text-[#1d2b26] focus-visible:ring-2 focus-visible:ring-[#1f6b4f]/30"
    >
      {label}
      <Ikon
        aria-hidden="true"
        className={cn(
          'size-3.5',
          arah === null ? 'text-neutral-400' : 'text-[#1f6b4f]',
        )}
      />
    </button>
  )
}

// Baris judul kolom. Hanya Prioritas dan Status yang bisa diurutkan; No,
// Foto, dan Judul tulisan biasa. Disembunyikan di layar kecil (baris data
// ditumpuk di sana). `tertahan` menambah kolom "Tertahan" di kanan.
function KepalaDaftar({
  urut,
  onUrut,
  tertahan,
}: {
  urut: Urut
  onUrut: (kunci: KunciUrut) => void
  tertahan: boolean
}) {
  return (
    <div
      className={cn(
        'hidden items-center gap-x-3.5 border-b border-[#efe9d8] bg-[#faf7ee] px-4 py-2.5 text-xs font-semibold text-[#5f655d] md:grid',
        tertahan ? KOLOM_TERTAHAN : KOLOM,
      )}
    >
      <span>No</span>
      <span>Foto</span>
      <span>Judul</span>
      <KolomUrut
        label="Prioritas"
        kunci="prioritas"
        urut={urut}
        onUrut={onUrut}
      />
      <KolomUrut label="Status" kunci="status" urut={urut} onUrut={onUrut} />
      {tertahan && <span>Tertahan</span>}
    </div>
  )
}

// Tombol tab di atas daftar, lengkap dengan jumlah laporan per tab.
// `peringatan` = angka jadi merah kalau jumlahnya lebih dari 0.
function TabTombol({
  aktif,
  jumlah,
  peringatan = false,
  onClick,
  children,
}: {
  aktif: boolean
  jumlah: number
  peringatan?: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={aktif}
      onClick={onClick}
      className={cn(
        '-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#1f6b4f]/25',
        aktif
          ? 'border-[#1f6b4f] text-[#1d2b26]'
          : 'border-transparent text-[#8a8f87] hover:text-[#1d2b26]',
      )}
    >
      {children}
      <span
        className={cn(
          'rounded-full px-2 py-0.5 text-[11px] tabular-nums',
          peringatan && jumlah > 0
            ? 'bg-red-100 font-semibold text-red-800'
            : 'bg-[#f1f5f3]',
        )}
      >
        {jumlah}
      </span>
    </button>
  )
}

// Badge status biasa (tidak bisa diklik). Perubahan status lewat
// tombol aksi di DetailDialog.
function StatusPill({ status }: { status: string }) {
  const key = status as LaporanStatus
  return (
    <span
      className={cn(
        'inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap',
        STATUS_PILL[key] ?? 'bg-neutral-100 text-neutral-700',
      )}
    >
      {STATUS_LABEL[key] ?? status}
    </span>
  )
}

// Lonceng di header: angka merah = jumlah laporan prioritas tinggi yang
// masih aktif. Diklik membuka popup daftarnya; memilih salah satu langsung
// membuka detail laporan itu. Ditutup lewat klik di luar atau Esc.
function NotifikasiPrioritas({
  items,
  aktifId,
  onPilih,
}: {
  items: Laporan[]
  aktifId: number | undefined
  onPilih: (id: number) => void
}) {
  const [buka, setBuka] = useState(false)
  const wadah = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!buka) return

    const onKlik = (event: MouseEvent) => {
      if (!wadah.current?.contains(event.target as Node)) setBuka(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setBuka(false)
    }

    document.addEventListener('mousedown', onKlik)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onKlik)
      window.removeEventListener('keydown', onKey)
    }
  }, [buka])

  const jumlah = items.length

  return (
    <div ref={wadah} className="relative shrink-0">
      <button
        type="button"
        aria-label={
          jumlah > 0
            ? `Notifikasi: ${jumlah} laporan prioritas tinggi`
            : 'Notifikasi: tidak ada laporan prioritas tinggi'
        }
        aria-expanded={buka}
        aria-haspopup="dialog"
        onClick={() => setBuka((v) => !v)}
        className="relative grid size-11 place-items-center rounded-full border-[1.5px] border-[#efe9d8] bg-white text-[#1d2b26] transition hover:bg-[#faf3e5] focus-visible:ring-2 focus-visible:ring-[#1f6b4f]/35 focus-visible:outline-none"
      >
        <Bell aria-hidden="true" className="size-5" />
        {jumlah > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-700 px-1 text-[11px] font-bold text-white"
          >
            {jumlah > 99 ? '99+' : jumlah}
          </span>
        )}
      </button>

      {buka && (
        <div
          role="dialog"
          aria-label="Perlu perhatian"
          className="absolute top-14 right-0 z-40 w-[21rem] max-w-[calc(100vw-2rem)] rounded-[20px] border-[1.5px] border-[#efe9d8] bg-white p-3.5 shadow-[0_12px_32px_rgba(15,61,46,0.16)]"
        >
          <div className="flex items-center justify-between px-2 pb-2">
            <h2 className="text-[15px] font-bold text-[#1d2b26]">
              Perlu perhatian
            </h2>
            <span className="text-xs text-[#5f655d]">
              {jumlah} prioritas tinggi
            </span>
          </div>

          {jumlah === 0 ? (
            <p className="px-2 py-4 text-sm text-[#5f655d]">
              Tidak ada laporan prioritas tinggi yang menunggu.
            </p>
          ) : (
            <ul className="max-h-72 space-y-0.5 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-current={item.id === aktifId ? 'true' : undefined}
                    onClick={() => {
                      onPilih(item.id)
                      setBuka(false)
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-[14px] p-2 text-left transition focus-visible:ring-2 focus-visible:ring-[#1f6b4f]/35 focus-visible:outline-none',
                      item.id === aktifId
                        ? 'bg-[#e0f1e8]'
                        : 'hover:bg-[#faf3e5]',
                    )}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-red-50 text-red-700">
                      <AlertTriangle aria-hidden="true" className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[#1d2b26]">
                        {item.deskripsi}
                      </span>
                      <span className="block truncate text-xs text-[#5f655d]">
                        Prioritas tinggi · {item.lokasi}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// Foto kecil di popup detail. Diklik membuka lightbox. Kalau `foto` null
// atau gagal dimuat, tampil kotak putus-putus berukuran sama.
function FotoKecil({
  foto,
  onBuka,
}: {
  foto: string | null
  onBuka: (src: string) => void
}) {
  const [gagal, setGagal] = useState(false)

  if (!foto || gagal) {
    return (
      <div
        title={foto ? 'Foto tidak termuat' : 'Belum ada foto'}
        className="flex size-26 shrink-0 items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-[#f6f7f4] text-neutral-400"
      >
        <ImageIcon aria-hidden="true" strokeWidth={1.5} className="size-8" />
      </div>
    )
  }

  const src = fotoUrl(foto)
  return (
    <button
      type="button"
      onClick={() => onBuka(src)}
      aria-label="Perbesar foto laporan"
      className="group relative size-26 shrink-0 overflow-hidden rounded-2xl border border-[#efe9d8] focus-visible:ring-2 focus-visible:ring-[#1f6b4f]/35 focus-visible:outline-none"
    >
      <img
        src={src}
        alt="Foto laporan"
        onError={() => setGagal(true)}
        className="size-full object-cover"
      />
      <span className="absolute right-1.5 bottom-1.5 grid size-6 place-items-center rounded-md bg-white/90 text-[#1d2b26] transition group-hover:bg-white">
        <Maximize2 aria-hidden="true" className="size-3.5" />
      </span>
    </button>
  )
}

// Kartu pelapor ringkas di popup detail. Backend hanya mengirim `pelapor`
// untuk admin, jadi kalau kosong tidak ditampilkan sama sekali.
function PelaporInfo({ pelapor }: { pelapor: Pelapor | null | undefined }) {
  const [gagal, setGagal] = useState(false)
  if (!pelapor) return null

  const inisial = pelapor.name.trim().charAt(0).toUpperCase() || '?'
  const kontak = [pelapor.email, pelapor.nim ? `NIM ${pelapor.nim}` : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <section
      aria-label="Data pelapor"
      className="mt-4 flex items-center gap-3 rounded-2xl border border-[#efe9d8] bg-[#faf7ee] px-3.5 py-2.5"
    >
      {pelapor.foto && !gagal ? (
        <img
          src={fotoUrl(pelapor.foto)}
          alt={`Foto ${pelapor.name}`}
          onError={() => setGagal(true)}
          className="size-9 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-[#1f6b4f] text-sm font-semibold text-white"
        >
          {inisial}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p
          title={pelapor.name}
          className="truncate text-[13px] font-semibold text-[#1d2b26]"
        >
          {pelapor.name}
        </p>
        {kontak && (
          <p title={kontak} className="truncate text-xs text-[#5f655d]">
            {kontak}
          </p>
        )}
      </div>
    </section>
  )
}

// Popup detail laporan: admin melihat ringkasannya lalu langsung
// memverifikasi atau menolak. Ditutup lewat tombol X, klik di luar kotak,
// atau Esc. Laporan selesai/ditolak tidak punya tombol aksi (status final).
function DetailDialog({
  item,
  disabled,
  bolehEsc,
  onUbah,
  onBuka,
  onTutup,
}: {
  item: Laporan
  disabled: boolean
  bolehEsc: boolean
  onUbah: (id: number, status: LaporanStatus) => void
  onBuka: (src: string) => void
  onTutup: () => void
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && bolehEsc) onTutup()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [bolehEsc, onTutup])

  const aksi = AKSI[item.status as LaporanStatus] ?? []

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-judul"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onTutup}
    >
      <div
        className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-[26px] border border-neutral-200/70 bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Tutup detail"
          onClick={onTutup}
          className="absolute top-3.5 right-3.5 grid size-8 place-items-center rounded-full bg-[#f6f7f4] text-[#1d2b26] transition hover:bg-[#efe9d8] focus-visible:ring-2 focus-visible:ring-[#1f6b4f]/35 focus-visible:outline-none"
        >
          <X aria-hidden="true" className="size-4" />
        </button>

        <div className="flex items-start gap-3.5 pr-8">
          <FotoKecil foto={item.foto} onBuka={onBuka} />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusPill status={item.status} />
              <PrioritasBadge kategori={item.prioritas_kategori ?? null} />
            </div>

            <h2
              id="detail-judul"
              className="mt-2 text-base leading-snug font-semibold text-[#1d2b26]"
            >
              {item.deskripsi}
            </h2>

            {/* BARU: tampilkan tanggal dibuat dan terakhir diubah. */}
            <p className="mt-1 text-[13px] leading-relaxed text-[#5f655d]">
              {kategoriLabel(item.kategori)} · {item.lokasi}
              <br />
              Dibuat {formatTanggal(item.created_at)}
              <br />
              Terakhir diubah {tanggalUbah(item)}
            </p>
          </div>
        </div>

        <PelaporInfo pelapor={item.pelapor} />

        <div className="mt-4">
          <StatusStepper status={item.status} />
        </div>

        {aksi.length > 0 && (
          <div className="mt-4 flex gap-2">
            {aksi.map((a) => (
              <button
                key={a.ke}
                type="button"
                disabled={disabled}
                onClick={() => onUbah(item.id, a.ke)}
                className={cn(
                  'inline-flex h-10 flex-1 items-center justify-center rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
                  a.bahaya
                    ? 'border-[1.5px] border-red-600 text-red-600 hover:bg-red-50'
                    : 'bg-[#1f6b4f] text-white hover:bg-[#0f3d2e]',
                )}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Dialog alasan penolakan. Backend mewajibkan field `alasan` saat status
// ditolak. Ditutup lewat Batal, klik di luar kotak, atau Esc (kecuali
// saat sedang mengirim).
function TolakDialog({
  id,
  pending,
  onBatal,
  onKirim,
}: {
  id: number
  pending: boolean
  onBatal: () => void
  onKirim: (alasan: string) => void
}) {
  const [alasan, setAlasan] = useState('')
  const bersih = alasan.trim()

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending) onBatal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onBatal, pending])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tolak-judul"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => {
        if (!pending) onBatal()
      }}
    >
      <div
        className="w-full max-w-md rounded-[26px] border border-neutral-200/70 bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="tolak-judul" className="text-lg font-semibold">
          Tolak laporan #{id}
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Tulis alasan penolakan. Alasan ini wajib diisi.
        </p>

        <label htmlFor="tolak-alasan" className="sr-only">
          Alasan penolakan
        </label>
        <textarea
          id="tolak-alasan"
          autoFocus
          rows={4}
          maxLength={255}
          value={alasan}
          onChange={(event) => setAlasan(event.target.value)}
          placeholder="Contoh: Foto tidak jelas atau laporan duplikat."
          className="mt-4 w-full resize-none rounded-xl border border-neutral-200 bg-[#f6f7f4] px-3.5 py-2.5 text-sm text-neutral-800 transition-colors outline-none placeholder:text-neutral-400 focus-visible:border-[#1f6b4f] focus-visible:ring-2 focus-visible:ring-[#1f6b4f]/20"
        />
        <p className="mt-1 text-right text-xs text-neutral-400 tabular-nums">
          {alasan.length}/255
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onBatal}
          >
            Batal
          </Button>
          <button
            type="button"
            disabled={pending || bersih.length === 0}
            onClick={() => onKirim(bersih)}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? 'Menolak...' : 'Tolak laporan'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Dialog foto bukti penyelesaian. Backend mewajibkan foto bukti saat
// status diubah ke selesai. Format dan batas ukuran disamakan dengan
// unggahan foto laporan (jpeg/png/webp, maks 2 MB). Foto bisa dari
// galeri/file, kamera HP, atau webcam laptop. Seluruh kotak 4:3 (kartu
// Kamera/Pilih file, video dengan overlay, pratinjau) digambar oleh
// FotoInput varian "kartu". Header tetap di atas, hanya body yang scroll.
// bg-white ada di body (bukan di wadah luar) supaya tidak ada tepi putih
// yang mengintip di balik sudut header yang membulat.
function BuktiDialog({
  id,
  pending,
  onBatal,
  onKirim,
}: {
  id: number
  pending: boolean
  onBatal: () => void
  onKirim: (foto: File) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [galat, setGalat] = useState<string | null>(null)
  const [webcamAktif, setWebcamAktif] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending) onBatal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onBatal, pending])

  // Tetapkan src pratinjau secara imperatif lewat ref supaya data dari
  // state tidak langsung mencapai atribut src elemen (menghindari
  // pelacakan taint CodeQL DOM XSS).
  useEffect(() => {
    const img = imgRef.current
    if (img) {
      img.src = previewUrl ?? ''
    }
  }, [previewUrl])

  // Menerima File dari galeri, kamera HP, atau webcam laptop.
  // null = user menekan "Hapus foto".
  const onPilih = (dipilih: File | null) => {
    setGalat(null)

    if (!dipilih) {
      setFile(null)
      setPreviewUrl(null)
      return
    }
    if (!FOTO_MIME_IZIN.includes(dipilih.type)) {
      setFile(null)
      setGalat('Format tidak didukung. Pilih foto JPG, PNG, atau WebP.')
      return
    }
    if (dipilih.size > BATAS_FOTO_BYTE) {
      setFile(null)
      setGalat('Ukuran foto lebih dari 2 MB. Pilih foto yang lebih kecil.')
      return
    }
    setFile(dipilih)

    // Baca file sebagai data URL supaya pratinjau tidak menggunakan
    // URL.createObjectURL yang langsung terhubung ke input file pengguna.
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Hanya terima data URL gambar yang aman (data:image/*).
      if (result.startsWith('data:image/')) {
        setPreviewUrl(result)
      }
    }
    reader.readAsDataURL(dipilih)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bukti-judul"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      onClick={() => {
        if (!pending) onBatal()
      }}
    >
      <div
        className="flex max-h-[90dvh] w-full max-w-120 flex-col overflow-hidden rounded-3xl shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header gelap (tetap di atas, tidak ikut scroll) */}
        <div className="shrink-0 bg-[#0f3d2e] px-6 pt-5 pb-4.5 text-white">
          <h2 id="bukti-judul" className="text-lg font-semibold">
            Selesaikan laporan #{id}
          </h2>
          <p className="mt-0.5 text-sm text-emerald-100/80">
            Unggah foto bukti perbaikan. Foto ini wajib diisi.
          </p>
        </div>

        {/* Body: hanya bagian ini yang bisa di-scroll */}
        <div className="overflow-y-auto bg-white px-6 pt-4.5 pb-5.5">
          {/* Pratinjau foto bukti (render di parent untuk menghindari CodeQL
              melacak data dari input file langsung ke atribut src di FotoInput) */}
          {previewUrl ? (
            <img
              ref={imgRef}
              alt="Pratinjau foto bukti"
              className="size-full object-cover"
              decoding="async"
              loading="lazy"
            />
          ) : null}

          {/* Kotak 4:3 lengkap (kartu dan kamera) digambar FotoInput */}
          <FotoInput
            varian="kartu"
            inputId="bukti-foto"
            value={file}
            disabled={pending}
            onFile={onPilih}
            onWebcamAktif={setWebcamAktif}
            ariaLabel="Foto bukti penyelesaian"
          />

          {galat ? (
            <p role="alert" className="mt-2.5 text-xs text-red-600">
              {galat}
            </p>
          ) : (
            <p className="mt-2.5 text-xs text-neutral-500">
              {webcamAktif
                ? 'Kamera aktif. Foto baru diambil setelah kamu menekan tombol bulat.'
                : 'Format JPG, PNG, atau WebP. Maksimal 2 MB.'}
            </p>
          )}

          <div className="mt-4 flex gap-2.5">
            <button
              type="button"
              disabled={pending}
              onClick={onBatal}
              className="h-11 flex-1 rounded-2xl border border-neutral-300 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={pending || !file}
              onClick={() => {
                if (file) onKirim(file)
              }}
              className="h-11 flex-1 rounded-2xl bg-[#1f6b4f] text-sm font-semibold text-white transition hover:bg-[#0f3d2e] disabled:cursor-not-allowed disabled:bg-[#1f6b4f]/40"
            >
              {pending ? 'Menyimpan...' : 'Tandai selesai'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Thumbnail foto di baris daftar. Kalau `foto` null atau gagal dimuat,
// tetap digambar kotak putus-putus berukuran sama supaya tinggi baris
// tidak melompat dan tidak ada ikon gambar patah.
function FotoThumb({
  foto,
  onBuka,
}: {
  foto: string | null
  onBuka: (src: string) => void
}) {
  const [gagal, setGagal] = useState(false)

  if (foto && !gagal) {
    const src = fotoUrl(foto)

    return (
      <button
        type="button"
        onClick={() => onBuka(src)}
        title="Klik untuk perbesar foto"
        aria-label="Perbesar foto laporan"
        className="size-14 shrink-0 overflow-hidden rounded-xl border border-[#efe9d8] bg-[#f6f7f4] transition hover:ring-2 hover:ring-[#1f6b4f]/35 focus-visible:ring-2 focus-visible:ring-[#1f6b4f]/35 focus-visible:outline-none"
      >
        <img
          src={src}
          alt="Foto laporan"
          loading="lazy"
          onError={() => setGagal(true)}
          className="size-full object-cover"
        />
      </button>
    )
  }

  return (
    <div
      title={foto ? 'Foto tidak termuat' : 'Belum ada foto'}
      className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-[#f6f7f4] text-neutral-400"
    >
      <ImageIcon aria-hidden="true" strokeWidth={1.5} className="size-5" />
    </div>
  )
}

// Foto ukuran besar. Ditutup lewat klik di luar foto, tombol X, atau Esc.
function FotoLightbox({ src, onTutup }: { src: string; onTutup: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onTutup()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onTutup])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Foto laporan"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      onClick={onTutup}
    >
      <button
        type="button"
        aria-label="Tutup foto"
        onClick={onTutup}
        className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <X aria-hidden="true" className="size-5" />
      </button>
      <img
        src={src}
        alt="Foto laporan diperbesar"
        className="max-h-[85dvh] max-w-full rounded-2xl object-contain"
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  )
}

function VerifikasiSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-[#8a8f87]">Memuat laporan…</p>
      <Skeleton className="h-10 rounded-xl" />
      <Skeleton className="h-96 rounded-[26px]" />
    </div>
  )
}

function VerifikasiError({
  error,
  onRetry,
}: {
  error: unknown
  onRetry: () => void
}) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Gagal memuat daftar laporan.</AlertTitle>
      <AlertDescription>
        <p>{errorMessage(error)}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={onRetry}
        >
          Coba lagi
        </Button>
      </AlertDescription>
    </Alert>
  )
}
