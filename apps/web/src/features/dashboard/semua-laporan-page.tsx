import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Download } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { User } from '@/features/auth/auth-query'
import {
  AvatarAdmin,
  FotoLightbox,
  FotoThumb,
} from '@/features/dashboard/dashboard-admin'
import {
  formatTanggal,
  formatWaktu,
} from '@/features/dashboard/dashboard-query'
import { DashboardShell } from '@/features/dashboard/dashboard-shell'
import { gedungDari } from '@/features/dashboard/dashboard-utils'
import {
  KATEGORI_LABEL,
  KATEGORI_VALUES,
  PRIORITAS_LABEL,
  PRIORITAS_VALUES,
  STATUS_LABEL,
  STATUS_VALUES,
  errorMessage,
  useLaporanList,
  type Laporan,
} from '@/features/laporan/laporan-query'
import { PrioritasBadge } from '@/features/laporan/prioritas-badge'
import { StatusBadge } from '@/features/laporan/status-badge'
import {
  VerifikasiFilter,
  type FilterGrup,
} from '@/features/laporan/verifikasi-filter'
import { cn } from '@/lib/utils'

type KunciUrut = 'prioritas' | 'status'
type Urut = { kunci: KunciUrut; arah: 'asc' | 'desc' } | null

type Filter = {
  gedung: string
  kategori: string
  status: string
  prioritas: string
  admin: string
}

const FILTER_KOSONG: Filter = {
  gedung: '',
  kategori: '',
  status: '',
  prioritas: '',
  admin: '',
}

// Nilai "semua" yang dipakai VerifikasiFilter untuk filter tidak aktif.
// State di halaman ini memakai string kosong, jadi dikonversi di bawah.
const SEMUA = 'semua'

// Urutan status mengikuti alur verifikasi.
const URUTAN_STATUS: Record<string, number> = {
  menunggu_verifikasi: 1,
  valid: 2,
  diproses: 3,
  selesai: 4,
  ditolak: 5,
}

// Rendah = 1, Sedang = 2, Tinggi = 3. Tanpa prioritas = 0.
const URUTAN_PRIORITAS: Record<string, number> = {
  rendah: 1,
  sedang: 2,
  tinggi: 3,
}

function rankPrioritas(item: Laporan): number {
  return item.prioritas_kategori
    ? (URUTAN_PRIORITAS[item.prioritas_kategori] ?? 0)
    : 0
}

function rankStatus(item: Laporan): number {
  return URUTAN_STATUS[item.status] ?? 0
}

function waktu(item: Laporan): number {
  const t = item.created_at ? new Date(item.created_at).getTime() : 0
  return Number.isNaN(t) ? 0 : t
}

// Nama admin yang menangani laporan ini (tanpa duplikat, tanpa kosong).
function adminDari(item: Laporan): string[] {
  return [
    ...new Set(
      [item.diverifikasi_oleh, item.diselesaikan_oleh].filter(
        (n): n is string => !!n,
      ),
    ),
  ]
}

// Satu baris jejak admin: foto/inisial, nama, lalu "peran · waktu".
function BarisAdmin({
  nama,
  foto,
  peran,
  waktu,
}: {
  nama: string
  foto?: string | null
  peran: string
  waktu?: string | null
}) {
  return (
    <div className="flex items-center gap-2">
      <AvatarAdmin nama={nama} foto={foto} className="size-7" />
      <div className="min-w-0">
        <p className="truncate text-[13px] leading-tight font-medium">{nama}</p>
        <p className="text-[11px] leading-tight text-neutral-500">
          {peran}
          {waktu ? ` · ${formatWaktu(waktu)}` : ''}
        </p>
      </div>
    </div>
  )
}

function unduhCsv(rows: Laporan[]) {
  const kolom = [
    'id',
    'judul',
    'kategori',
    'gedung',
    'lokasi',
    'pelapor',
    'prioritas',
    'status',
    'diverifikasi_oleh',
    'diverifikasi_pada',
    'diselesaikan_oleh',
    'diselesaikan_pada',
  ]

  const esc = (v: string | number | null | undefined) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }

  const baris = rows.map((i) => [
    i.id,
    i.deskripsi,
    KATEGORI_LABEL[i.kategori] ?? i.kategori,
    gedungDari(i.lokasi),
    i.lokasi,
    i.pelapor?.name ?? '',
    i.prioritas_kategori ? PRIORITAS_LABEL[i.prioritas_kategori] : '',
    STATUS_LABEL[i.status] ?? i.status,
    i.diverifikasi_oleh ?? '',
    i.diverifikasi_pada ? formatWaktu(i.diverifikasi_pada) : '',
    i.status === 'selesai' ? (i.diselesaikan_oleh ?? '') : '',
    i.status === 'selesai' && i.diselesaikan_pada
      ? formatWaktu(i.diselesaikan_pada)
      : '',
  ])

  // BOM di depan supaya Excel membaca UTF-8 dengan benar.
  const csv =
    '\uFEFF' +
    [kolom.join(','), ...baris.map((r) => r.map(esc).join(','))].join('\n')

  const url = URL.createObjectURL(
    new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
  )
  const a = document.createElement('a')
  a.href = url
  a.download = 'laporan.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export function SemuaLaporanPage({ user }: { user: User }) {
  const laporan = useLaporanList()
  const [fotoBesar, setFotoBesar] = useState<string | null>(null)

  const menunggu = laporan.data?.filter(
    (item) => item.status === 'menunggu_verifikasi',
  ).length

  // Hasil filter dipakai juga oleh tombol Ekspor CSV di header, jadi
  // disimpan di sini lewat callback dari konten.
  const [hasil, setHasil] = useState<Laporan[]>([])

  return (
    <DashboardShell
      user={user}
      menunggu={menunggu}
      header={
        <div className="flex w-full items-center justify-between gap-3 py-2">
          <div className="min-w-0">
            <h1 className="truncate text-lg leading-tight font-bold tracking-tight">
              Semua Laporan
            </h1>
            <p className="truncate text-xs text-neutral-500">
              Seluruh laporan · Semua gedung
            </p>
          </div>
          <button
            type="button"
            onClick={() => unduhCsv(hasil)}
            disabled={hasil.length === 0}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#0f3d2e] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0b2f23] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download aria-hidden="true" className="size-4" />
            Ekspor CSV
          </button>
        </div>
      }
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        {laporan.isPending ? (
          <Skeleton className="h-96 rounded-[26px]" />
        ) : laporan.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Gagal memuat laporan</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center gap-3">
              {errorMessage(laporan.error)}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void laporan.refetch()}
              >
                Coba lagi
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <Konten
            laporan={laporan.data}
            onBukaFoto={setFotoBesar}
            onHasil={setHasil}
          />
        )}
      </div>

      {fotoBesar && (
        <FotoLightbox src={fotoBesar} onTutup={() => setFotoBesar(null)} />
      )}
    </DashboardShell>
  )
}

function Konten({
  laporan,
  onBukaFoto,
  onHasil,
}: {
  laporan: Laporan[]
  onBukaFoto: (src: string) => void
  onHasil: (rows: Laporan[]) => void
}) {
  const [cari, setCari] = useState('')
  const [filter, setFilter] = useState<Filter>(FILTER_KOSONG)
  const [urut, setUrut] = useState<Urut>(null)

  // Kolom & filter Admin hanya ada kalau backend sudah mengirim datanya.
  const adaAdmin = laporan.some((i) => adminDari(i).length > 0)
  const daftarAdmin = [...new Set(laporan.flatMap(adminDari))].sort()
  const daftarGedung = [
    ...new Set(laporan.map((i) => gedungDari(i.lokasi))),
  ].sort()

  const q = cari.trim().toLowerCase()

  const terfilter = laporan.filter((item) => {
    if (filter.gedung && gedungDari(item.lokasi) !== filter.gedung) return false
    if (filter.kategori && item.kategori !== filter.kategori) return false
    if (filter.status && item.status !== filter.status) return false
    if (filter.prioritas && item.prioritas_kategori !== filter.prioritas) {
      return false
    }
    if (filter.admin && !adminDari(item).includes(filter.admin)) return false
    if (q) {
      const teks =
        `${item.deskripsi} ${item.lokasi} ${item.pelapor?.name ?? ''} #${item.id}`.toLowerCase()
      if (!teks.includes(q)) return false
    }
    return true
  })

  // Dasar: terbaru di atas. Kalau ada urutan kolom, rank sama tetap
  // terbaru di atas.
  const hasil = [...terfilter].sort((a, b) => {
    if (urut) {
      const rank = urut.kunci === 'prioritas' ? rankPrioritas : rankStatus
      const beda = rank(a) - rank(b)
      if (beda !== 0) return urut.arah === 'asc' ? beda : -beda
    }
    const selisih = waktu(b) - waktu(a)
    return selisih !== 0 ? selisih : b.id - a.id
  })

  // Kirim hasil ke header (tombol Ekspor CSV). Dibandingkan lewat id
  // supaya tidak looping render.
  const kunciHasil = hasil.map((i) => i.id).join(',')
  useEffect(() => {
    onHasil(hasil)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kunciHasil])

  // Klik 1: naik, klik 2: turun, klik 3: kembali ke urutan bawaan.
  const ubahUrut = (kunci: KunciUrut) => {
    setUrut((sekarang) => {
      if (sekarang?.kunci !== kunci) return { kunci, arah: 'asc' }
      if (sekarang.arah === 'asc') return { kunci, arah: 'desc' }
      return null
    })
  }

  // Satu grup chip untuk VerifikasiFilter. State di sini '' = tidak aktif,
  // VerifikasiFilter memakai 'semua', jadi dikonversi dua arah.
  const buatGrup = (
    key: keyof Filter,
    judul: string,
    opsi: Array<[string, string]>,
  ): FilterGrup => ({
    key,
    judul,
    nilai: filter[key] || SEMUA,
    opsi: opsi.map(([value, label]) => ({ value, label })),
    onPilih: (nilai) =>
      setFilter((f) => ({ ...f, [key]: nilai === SEMUA ? '' : nilai })),
  })

  const grup: FilterGrup[] = [
    buatGrup(
      'status',
      'Status',
      STATUS_VALUES.map((s) => [s, STATUS_LABEL[s]]),
    ),
    buatGrup(
      'kategori',
      'Kategori',
      KATEGORI_VALUES.map((k) => [k, KATEGORI_LABEL[k]]),
    ),
    buatGrup(
      'gedung',
      'Gedung',
      daftarGedung.map((g) => [g, g]),
    ),
    buatGrup(
      'prioritas',
      'Prioritas',
      PRIORITAS_VALUES.map((p) => [p, PRIORITAS_LABEL[p]]),
    ),
    ...(adaAdmin
      ? [
          buatGrup(
            'admin',
            'Admin',
            daftarAdmin.map((n) => [n, n]),
          ),
        ]
      : []),
  ]

  return (
    <section className="flex flex-col gap-3">
      <VerifikasiFilter
        cari={cari}
        onCari={setCari}
        grup={grup}
        jumlah={hasil.length}
        onReset={() => {
          setFilter(FILTER_KOSONG)
          setCari('')
        }}
      />

      {/* Tabel */}
      <div className="overflow-x-auto rounded-[22px] border border-neutral-200/70 bg-white shadow-sm">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="bg-[#faf7ee] text-left text-xs font-semibold">
              <th className="w-12 px-3 py-3 text-center">No</th>
              <th className="w-[72px] px-3 py-3">Foto</th>
              <th className="px-3 py-3">Judul</th>
              {adaAdmin && <th className="min-w-[210px] px-3 py-3">Admin</th>}
              <th className="px-3 py-3">
                <HeaderUrut
                  label="Prioritas"
                  kunci="prioritas"
                  urut={urut}
                  onUrut={ubahUrut}
                />
              </th>
              <th className="px-3 py-3">
                <HeaderUrut
                  label="Status"
                  kunci="status"
                  urut={urut}
                  onUrut={ubahUrut}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {hasil.length === 0 ? (
              <tr>
                <td
                  colSpan={adaAdmin ? 6 : 5}
                  className="px-3 py-10 text-center text-neutral-400"
                >
                  Tidak ada laporan yang cocok.
                </td>
              </tr>
            ) : (
              hasil.map((item, index) => (
                <tr key={item.id} className="border-t border-neutral-100">
                  <td className="px-3 py-3 text-center text-xs text-neutral-500">
                    {index + 1}
                  </td>
                  <td className="px-3 py-3">
                    <FotoThumb foto={item.foto} onBuka={onBukaFoto} />
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium">{item.deskripsi}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {KATEGORI_LABEL[item.kategori] ?? item.kategori} ·{' '}
                      {item.lokasi} · {formatTanggal(item.created_at)}
                    </p>
                    {item.pelapor && (
                      <p className="mt-0.5 text-xs text-neutral-500">
                        Pelapor:{' '}
                        <span className="font-semibold uppercase">
                          {item.pelapor.name}
                        </span>
                      </p>
                    )}
                  </td>
                  {adaAdmin && (
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-1.5">
                        {item.diverifikasi_oleh && (
                          <BarisAdmin
                            nama={item.diverifikasi_oleh}
                            foto={item.diverifikasi_oleh_foto}
                            peran={
                              item.status === 'ditolak'
                                ? 'Menolak'
                                : 'Verifikasi'
                            }
                            waktu={item.diverifikasi_pada}
                          />
                        )}
                        {item.status === 'selesai' &&
                          item.diselesaikan_oleh && (
                            <BarisAdmin
                              nama={item.diselesaikan_oleh}
                              foto={item.diselesaikan_oleh_foto}
                              peran="Selesai"
                              waktu={item.diselesaikan_pada}
                            />
                          )}
                      </div>
                    </td>
                  )}
                  <td className="px-3 py-3">
                    <PrioritasBadge
                      kategori={item.prioritas_kategori ?? null}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// Judul kolom yang bisa diklik untuk mengurutkan.
function HeaderUrut({
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
      className="inline-flex items-center gap-1 text-left font-semibold outline-none hover:text-neutral-800 focus-visible:ring-2 focus-visible:ring-[#1f6b4f]/30"
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
