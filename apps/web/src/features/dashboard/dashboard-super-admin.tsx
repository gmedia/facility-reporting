import { Fragment, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import type { User } from '@/features/auth/auth-query'
import {
  AvatarAdmin,
  FotoLightbox,
  LaporanTerbaru,
} from '@/features/dashboard/dashboard-admin'
import { DashboardActions } from '@/features/dashboard/dashboard-actions'
import {
  formatWaktu,
  waktuRelatif,
} from '@/features/dashboard/dashboard-query'
import { DashboardShell } from '@/features/dashboard/dashboard-shell'
import {
  gedungDari,
  hitungHeatmap,
  hitungKpi,
  identitas,
  laporanTertahan,
  type LaporanTertahan,
} from '@/features/dashboard/dashboard-utils'
import {
  KATEGORI_LABEL,
  errorMessage,
  useLaporanList,
  type Laporan,
} from '@/features/laporan/laporan-query'
import { cn } from '@/lib/utils'

const CARD = 'rounded-[26px] border border-neutral-200/70 bg-white shadow-sm'

// Pilihan ambang "tertahan" (hari). Default 3.
const AMBANG = [3, 5, 7]

// Jumlah kejadian yang ditampilkan di panel Aktivitas terbaru.
const JUMLAH_AKTIVITAS = 8

type Aktivitas = {
  key: string
  waktu: string
  admin: string
  adminFoto: string | null
  aksi: 'memverifikasi' | 'menolak' | 'menyelesaikan'
  laporan: Laporan
}

// Kejadian diambil dari jejak verifikasi / penolakan dan penyelesaian pada
// tiap laporan, diurutkan dari yang terbaru.
function susunAktivitas(laporan: Laporan[]): Aktivitas[] {
  const hasil: Aktivitas[] = []

  for (const item of laporan) {
    if (item.diverifikasi_oleh && item.diverifikasi_pada) {
      hasil.push({
        key: `verifikasi-${item.id}`,
        waktu: item.diverifikasi_pada,
        admin: item.diverifikasi_oleh,
        adminFoto: item.diverifikasi_oleh_foto ?? null,
        aksi: item.status === 'ditolak' ? 'menolak' : 'memverifikasi',
        laporan: item,
      })
    }
    if (
      item.status === 'selesai' &&
      item.diselesaikan_oleh &&
      item.diselesaikan_pada
    ) {
      hasil.push({
        key: `selesai-${item.id}`,
        waktu: item.diselesaikan_pada,
        admin: item.diselesaikan_oleh,
        adminFoto: item.diselesaikan_oleh_foto ?? null,
        aksi: 'menyelesaikan',
        laporan: item,
      })
    }
  }

  return hasil
    .sort((a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime())
    .slice(0, JUMLAH_AKTIVITAS)
}

export function DashboardSuperAdmin({ user }: { user: User }) {
  const laporan = useLaporanList()
  const [fotoBesar, setFotoBesar] = useState<string | null>(null)

  // Badge di sidebar (menu Verifikasi).
  const menunggu = laporan.data?.filter(
    (item) => item.status === 'menunggu_verifikasi',
  ).length

  return (
    <DashboardShell
      user={user}
      menunggu={menunggu}
      header={<DashboardIntro user={user} />}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        {laporan.isPending ? (
          <DashboardSkeleton />
        ) : laporan.isError ? (
          <DashboardError
            error={laporan.error}
            onRetry={() => void laporan.refetch()}
          />
        ) : (
          <DashboardContent laporan={laporan.data} onBukaFoto={setFotoBesar} />
        )}
      </div>

      {fotoBesar && (
        <FotoLightbox src={fotoBesar} onTutup={() => setFotoBesar(null)} />
      )}
    </DashboardShell>
  )
}

function DashboardIntro({ user }: { user: User }) {
  return (
    <div className="flex w-full items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <h1 className="truncate text-lg leading-tight font-bold tracking-tight">
          Halo, {user.name}
        </h1>
        <p className="truncate text-xs text-neutral-500">
          {identitas(user)} · Semua gedung
        </p>
      </div>
      <div className="shrink-0">
        <DashboardActions role={user.role} />
      </div>
    </div>
  )
}

function DashboardContent({
  laporan,
  onBukaFoto,
}: {
  laporan: Laporan[]
  onBukaFoto: (src: string) => void
}) {
  // Ambang dipakai bersama oleh banner dan panel tertahan.
  const [ambang, setAmbang] = useState(AMBANG[0] ?? 3)
  const tertahan = laporanTertahan(laporan, ambang)

  const terbaru = [...laporan].sort((a, b) =>
    (b.created_at ?? '').localeCompare(a.created_at ?? ''),
  )

  return (
    <>
      <BannerTertahan jumlah={tertahan.length} ambang={ambang} />
      <KpiKartu laporan={laporan} />
      <Heatmap laporan={laporan} />
      <PanelTertahan
        tertahan={tertahan}
        ambang={ambang}
        onAmbang={setAmbang}
      />
      <AktivitasTerbaru laporan={laporan} />
      <LaporanTerbaru laporan={terbaru} onBukaFoto={onBukaFoto} />
    </>
  )
}

// Kartu hijau tua di paling atas.
function BannerTertahan({
  jumlah,
  ambang,
}: {
  jumlah: number
  ambang: number
}) {
  return (
    <section
      aria-label="Laporan tertahan"
      className="flex flex-wrap items-center justify-between gap-4 rounded-[26px] bg-[#0f3d2e] px-8 py-6 text-white"
    >
      <div>
        <h2 className="text-lg font-semibold">
          {jumlah} laporan belum selesai dan tidak berubah lebih dari {ambang}{' '}
          hari
        </h2>
        <p className="mt-1 text-sm text-emerald-100/80">
          Dihitung dari status Valid atau Diproses dan tanggal terakhir
          diperbarui.
        </p>
      </div>
      <button
        type="button"
        onClick={() =>
          document
            .getElementById('tertahan')
            ?.scrollIntoView({ behavior: 'smooth' })
        }
        className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0f3d2e] transition-colors hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
      >
        Lihat ringkasan
      </button>
    </section>
  )
}

function KpiKartu({ laporan }: { laporan: Laporan[] }) {
  const k = hitungKpi(laporan)

  const items = [
    {
      label: 'Total laporan',
      nilai: String(k.total),
      caption: `${k.diproses} sedang dikerjakan`,
    },
    {
      label: 'Tingkat penyelesaian',
      nilai: `${k.persenSelesai}%`,
      caption: `${k.jumlahSelesai} dari ${k.total} laporan`,
    },
    {
      label: 'Rata-rata lama selesai',
      // DIBULATKAN: 0,9 hari -> 1 hari
      nilai: k.rataHari === null ? '–' : `${Math.round(k.rataHari)} hari`,
      caption: 'dari dibuat sampai terakhir diperbarui',
    },
    {
      label: 'Prioritas tinggi aktif',
      nilai: String(k.tinggiAktif),
      caption: 'belum selesai',
    },
  ]

  return (
    <section
      aria-label="Ringkasan"
      className="grid grid-cols-2 gap-4 xl:grid-cols-4"
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-[22px] border border-neutral-200/70 bg-white p-5 shadow-sm"
        >
          <p className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">
            {item.label}
          </p>
          <p className="mt-1 text-3xl leading-none font-bold tabular-nums">
            {item.nilai}
          </p>
          <p className="mt-2 text-sm text-neutral-500">{item.caption}</p>
        </div>
      ))}
    </section>
  )
}

// Heatmap gedung × kategori. Warna dihitung relatif terhadap sel terbesar.
function Heatmap({ laporan }: { laporan: Laporan[] }) {
  const { gedung, kategori, jumlah, maks } = hitungHeatmap(laporan)

  return (
    <section className={cn('p-6', CARD)}>
      <h2 className="text-base font-semibold">Heatmap gedung × kategori</h2>
      <p className="text-sm text-neutral-500">
        Makin gelap, makin banyak laporan. Titik rawan langsung terlihat.
      </p>

      {gedung.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-400">Belum ada data.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <div
            className="grid min-w-[480px] gap-1 text-sm"
            style={{
              gridTemplateColumns: `110px repeat(${kategori.length}, minmax(0, 1fr))`,
            }}
          >
            <div />
            {kategori.map((k) => (
              <div
                key={k}
                className="p-1 text-center text-xs font-medium text-neutral-500"
              >
                {KATEGORI_LABEL[k]}
              </div>
            ))}

            {gedung.map((g) => (
              <Fragment key={g}>
                <div className="flex items-center text-sm font-medium">{g}</div>
                {kategori.map((k) => {
                  const c = jumlah(g, k)
                  const rasio = c / maks
                  return (
                    <div
                      key={k}
                      title={`${g} · ${KATEGORI_LABEL[k]}: ${c} laporan`}
                      className={cn(
                        'rounded-lg border border-neutral-200/70 py-2.5 text-center font-semibold tabular-nums',
                        rasio > 0.55 && 'text-white',
                      )}
                      style={{
                        background: `color-mix(in srgb, #1f6b4f ${
                          c ? 15 + rasio * 75 : 0
                        }%, white)`,
                      }}
                    >
                      {c || '·'}
                    </div>
                  )
                })}
              </Fragment>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function PanelTertahan({
  tertahan,
  ambang,
  onAmbang,
}: {
  tertahan: LaporanTertahan[]
  ambang: number
  onAmbang: (n: number) => void
}) {
  // Jumlah laporan tertahan per gedung.
  const perGedung = new Map<string, number>()
  for (const t of tertahan) {
    const g = gedungDari(t.laporan.lokasi)
    perGedung.set(g, (perGedung.get(g) ?? 0) + 1)
  }

  return (
    <section id="tertahan" className={cn('scroll-mt-20 p-6', CARD)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Laporan tertahan</h2>
          <p className="text-sm text-neutral-500">
            Untuk pengawasan. Admin gedung yang menindaklanjuti lewat menu
            Verifikasi.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-neutral-500">
          Ambang
          <Select
            value={String(ambang)}
            onValueChange={(value) => onAmbang(Number(value ?? AMBANG[0]))}
          >
            <SelectTrigger
              aria-label="Ambang hari tertahan"
              className="w-[100px]"
            >
              <SelectValue>{ambang} hari</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {AMBANG.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} hari
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {tertahan.length === 0 ? (
        <p className="mt-5 text-sm text-neutral-400">
          Tidak ada laporan tertahan.
        </p>
      ) : (
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            {[...perGedung].map(([g, n]) => (
              <div
                key={g}
                className="grid grid-cols-[96px_1fr_24px] items-center gap-3 text-sm"
              >
                <span className="truncate">{g}</span>
                <div className="h-2.5 overflow-hidden rounded-full bg-emerald-50">
                  <div
                    className="h-full rounded-full bg-[#1f6b4f]"
                    style={{ width: `${(n / tertahan.length) * 100}%` }}
                  />
                </div>
                <b className="text-right tabular-nums">{n}</b>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs text-neutral-500">Paling lama</p>
            {tertahan.slice(0, 3).map(({ laporan, hari }) => (
              <div
                key={laporan.id}
                className="flex items-center justify-between gap-3 border-b border-neutral-100 py-2 text-sm last:border-0"
              >
                <span className="min-w-0 truncate">
                  <b className="font-medium">{laporan.deskripsi}</b> ·{' '}
                  {gedungDari(laporan.lokasi)}
                </span>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
                    hari >= 5
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800',
                  )}
                >
                  {hari} hari
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

// Jejak terbaru: siapa memverifikasi / menolak / menyelesaikan laporan apa
// dan kapan. Hanya tampil kalau backend sudah mengirim data admin.
function AktivitasTerbaru({ laporan }: { laporan: Laporan[] }) {
  const aktivitas = susunAktivitas(laporan)

  return (
    <section className={cn('p-6', CARD)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Aktivitas terbaru</h2>
          <p className="text-sm text-neutral-500">
            Verifikasi, penolakan, dan penyelesaian laporan oleh admin.
          </p>
        </div>
        <Link
          to="/semua-laporan"
          className="rounded-xl px-3 py-1.5 text-sm font-medium text-[#0f3d2e] transition-colors hover:bg-emerald-50"
        >
          Lihat semua laporan
        </Link>
      </div>

      {aktivitas.length === 0 ? (
        <p className="mt-5 text-sm text-neutral-400">
          Belum ada aktivitas admin yang tercatat.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-neutral-100">
          {aktivitas.map((a) => (
            <li key={a.key} className="flex items-center gap-3 py-3">
              <AvatarAdmin nama={a.admin} foto={a.adminFoto} className="size-8" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  <b className="font-semibold">{a.admin}</b> {a.aksi} laporan{' '}
                  <span className="font-medium">
                    &ldquo;{a.laporan.deskripsi}&rdquo;
                  </span>
                </p>
                <p className="text-xs text-neutral-500">
                  {a.laporan.lokasi} ·{' '}
                  {KATEGORI_LABEL[a.laporan.kategori] ?? a.laporan.kategori}
                  {a.laporan.pelapor && (
                    <>
                      {' '}
                      · Dilaporkan oleh{' '}
                      <span className="font-medium text-[#0f3d2e]">
                        {a.laporan.pelapor.name}
                      </span>
                    </>
                  )}
                </p>
              </div>

              <span
                title={formatWaktu(a.waktu)}
                className="shrink-0 text-xs text-neutral-500"
              >
                {waktuRelatif(a.waktu)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-28 rounded-[26px]" />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-28 rounded-[22px]" />
        ))}
      </div>
      <Skeleton className="h-56 rounded-[26px]" />
      <Skeleton className="h-64 rounded-[26px]" />
    </div>
  )
}

function DashboardError({
  error,
  onRetry,
}: {
  error: unknown
  onRetry: () => void
}) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Gagal memuat dashboard</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center gap-3">
        {errorMessage(error)}
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          Coba lagi
        </Button>
      </AlertDescription>
    </Alert>
  )
}