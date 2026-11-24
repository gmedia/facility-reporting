import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Menu,
  User,
  Wrench,
  X,
} from 'lucide-react'
import ctaKampusImage from '@/assets/landing/cta-kampus.jpg'
import figcraftCampusHeroImg from '@/assets/landing/figcraft-campus-hero.jpg'
import { homeFor, meQueryOptions } from '@/features/auth/auth-query'
import { statusQueryOptions } from '@/features/status/status-query'

const HERO_CONTENT = {
  titleLine1: 'Rusak?',
  titleLine2: 'Lapor.',
  subtitle:
    'Laporkan kerusakan fasilitas kampus dalam 30 detik, pantau penanganan teknisi hingga tuntas.',
  uptime: '98% Aktif',
  technicians: '12 Teknisi Siaga',
  image: figcraftCampusHeroImg,
  imageAlt: 'Gedung Saintek modern tempat pemantauan fasilitas kampus',
  liveTicket: {
    code: 'LR-412',
    title: 'AC Lab Komputer 2',
    status: 'Diproses',
    technician: 'Teknisi Budi S.',
    updatedAt: '12 mnt lalu',
  },
} as const

const HERO_LOCATIONS = [
  {
    name: 'Gedung A · Lab 2',
    sub: 'Fakultas Saintek · Lt. 2',
  },
  {
    name: 'Gedung B · Koridor Lt. 2',
    sub: 'Area Kelas & Lab',
  },
  {
    name: 'Gedung C · Ruang Dosen',
    sub: 'Administrasi & Rapat',
  },
  {
    name: 'Perpustakaan Pusat',
    sub: 'Zona Baca & Sanitasi',
  },
] as const

const HERO_TABS = [
  { id: 'lapor', label: 'Lapor Baru' },
  { id: 'status', label: 'Cek Status' },
  { id: 'fasilitas', label: 'Fasilitas' },
] as const

type HeroTabId = (typeof HERO_TABS)[number]['id']

const MODAL_CATEGORIES = [
  'Listrik & AC',
  'Sanitasi & Air',
  'Struktur & Ruang',
  'Lainnya',
] as const

const MODAL_PRIORITIES = ['Normal', 'Mendesak'] as const

const NAV_LINKS = [
  ['layanan', 'Layanan'],
  ['dampak', 'Dampak'],
  ['lapor', 'Cara lapor'],
  ['cerita', 'Cerita pengguna'],
] as const

const LOKASI_OPTIONS = [
  'Gedung A · Ruang kuliah 1–3',
  'Gedung B · Laboratorium komputer',
  'Gedung C · Ruang dosen & administrasi',
  'Perpustakaan Saintek',
  'Aula & kantin Saintek',
]

const KATEGORI_OPTIONS = [
  'Elektronik',
  'Mekanik',
  'Bangunan',
  'Furnitur',
  'Lainnya',
]

const URGENSI_OPTIONS = [
  ['Normal', 'Normal'],
  ['Mendesak', 'Mendesak — mengganggu operasional'],
  ['Bahaya', 'Bahaya keselamatan'],
] as const

const TESTIMONI = [
  {
    quote:
      'Dulu keluhan mahasiswa masuk lewat grup WhatsApp dan sering tenggelam. Sekarang tinggal foto masalahnya — tiket sudah ada nomornya sebelum kelas berikutnya.',
    nama: 'Rina Kusuma',
    peran: 'Administrasi akademik',
    unit: 'Gedung A · Fakultas Saintek',
    dampak: 'Tiket terbit < 1 menit',
    inisial: 'RK',
  },
  {
    quote:
      'Urgensi “bahaya keselamatan” bikin saya dapat telepon piket dalam hitungan menit, bukan shift berikutnya. Itu yang paling terasa bedanya.',
    nama: 'Dimas Prayoga',
    peran: 'Staf laboratorium',
    unit: 'Lab Kimia & Riset · Saintek',
    dampak: 'Respons darurat instan',
    inisial: 'DP',
  },
  {
    quote:
      'Laporan bulanan yang dulu dua hari saya rekap manual, sekarang tinggal ekspor. Rapat pengelola jadi membahas solusi, bukan data.',
    nama: 'Ayu Larasati',
    peran: 'Pengelola fakultas',
    unit: 'Tata Usaha · Fakultas Saintek',
    dampak: 'Rekap bulanan 1 klik',
    inisial: 'AL',
  },
  {
    quote:
      'Teknisi kami bekerja sambil berdiri di ruang panel — formulirnya harus bisa dipakai dengan satu tangan. Ternyata memang dibuat sesederhana itu.',
    nama: 'Hartono Wijaya',
    peran: 'Kepala teknisi',
    unit: 'Tim Utilitas & Mekanikal',
    dampak: 'Ramah dipakai di lapangan',
    inisial: 'HW',
  },
  {
    quote:
      'Filter AC tiap lab akhirnya terjadwal, bukan menunggu keluhan. Sejak itu keluhan “ruangan gerah” turun drastis saat praktikum.',
    nama: 'Maya Anggraini',
    peran: 'Dosen praktikum',
    unit: 'Laboratorium Komputer · Saintek',
    dampak: 'Perawatan AC terjadwal',
    inisial: 'MA',
  },
  {
    quote:
      'Yang saya butuhkan bukan aplikasi keren, tapi bukti bahwa laporan saya dibaca. Status “Diproses” yang bisa saya cek sendiri itu sudah cukup.',
    nama: 'Reza Alfarizi',
    peran: 'Mahasiswa',
    unit: 'Teknik Informatika · Saintek',
    dampak: 'Status progres transparan',
    inisial: 'RA',
  },
] as const

function ApiStatus() {
  const status = useQuery(statusQueryOptions)

  if (status.isPending) {
    return <span className="text-r-on-dark-soft">Menghubungkan…</span>
  }

  if (status.isError || status.data?.data.status !== 'ok') {
    return <span className="text-red-300">API tidak tersedia</span>
  }

  return <span className="text-r-accent-glow">Sistem aktif</span>
}

function BrandMark() {
  return (
    <span className="bg-r-fg text-r-surface flex h-[34px] w-[34px] items-center justify-center rounded-full">
      <Wrench className="h-[17px] w-[17px]" aria-hidden="true" />
    </span>
  )
}

type FormFields = {
  lokasi: string
  ruang: string
  pelapor: string
  kategori: string
  urgensi: string
  deskripsi: string
}

const EMPTY_FORM: FormFields = {
  lokasi: '',
  ruang: '',
  pelapor: '',
  kategori: '',
  urgensi: 'Normal',
  deskripsi: '',
}

const FIELD_CLASS =
  'border-r-line bg-r-surface text-r-fg placeholder:text-r-muted/75 focus:border-r-accent-ink focus:shadow-[0_0_0_3px_var(--rawat-accent-soft)] focus:outline-none w-full rounded-lg border px-3.5 py-2.5 min-h-11 text-[16px] sm:text-[14px] transition-[border-color,box-shadow]'

function ReportForm() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormFields>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [fotoName, setFotoName] = useState('Belum ada foto dipilih')

  function setField(name: keyof FormFields, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: false }))
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    void navigate({ to: '/login' })
  }

  return (
    <form onSubmit={submit} noValidate>
      <p className="text-r-fg text-[17.5px] font-semibold tracking-[-0.01em] sm:text-[19px]">
        Formulir laporan fasilitas
      </p>
      <p className="text-r-muted mt-1 mb-4 text-[13.5px] leading-relaxed text-pretty sm:mt-1.5 sm:mb-5 sm:text-[14px]">
        Isi singkat saja — teknisi yang menindaklanjuti butuh konteks, bukan
        esai.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
        <div
          data-field="lokasi"
          className="flex flex-col gap-1.5 sm:col-span-2"
        >
          <label
            htmlFor="f-lokasi"
            className="text-r-fg text-[13px] font-semibold"
          >
            Gedung &amp; ruang
          </label>
          <div className="relative">
            <select
              id="f-lokasi"
              value={form.lokasi}
              onChange={(event) => setField('lokasi', event.target.value)}
              aria-invalid={errors.lokasi || undefined}
              className={`${FIELD_CLASS} appearance-none pr-9`}
            >
              <option value="">Pilih gedung…</option>
              {LOKASI_OPTIONS.map((lokasi) => (
                <option key={lokasi}>{lokasi}</option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="text-r-muted pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2"
            />
          </div>
          {errors.lokasi ? (
            <p className="text-r-accent-ink text-[12.5px] font-medium">
              Pilih dulu gedung dan ruangnya.
            </p>
          ) : null}
        </div>

        <div data-field="ruang" className="flex flex-col gap-1.5">
          <label
            htmlFor="f-ruang"
            className="text-r-fg text-[13px] font-semibold"
          >
            Ruang / detail lokasi
          </label>
          <input
            id="f-ruang"
            value={form.ruang}
            onChange={(event) => setField('ruang', event.target.value)}
            placeholder="mis. Lab Komputer 2, dekat pintu masuk"
            aria-invalid={errors.ruang || undefined}
            className={FIELD_CLASS}
          />
          {errors.ruang ? (
            <p className="text-r-accent-ink text-[12.5px] font-medium">
              Tulis minimal nama ruang atau titik referensi.
            </p>
          ) : null}
        </div>

        <div data-field="pelapor" className="flex flex-col gap-1.5">
          <label
            htmlFor="f-pelapor"
            className="text-r-fg text-[13px] font-semibold"
          >
            Nama pelapor
          </label>
          <input
            id="f-pelapor"
            value={form.pelapor}
            onChange={(event) => setField('pelapor', event.target.value)}
            placeholder="Nama & prodi/unit"
            aria-invalid={errors.pelapor || undefined}
            className={FIELD_CLASS}
          />
          {errors.pelapor ? (
            <p className="text-r-accent-ink text-[12.5px] font-medium">
              Nama pelapor dibutuhkan untuk update status.
            </p>
          ) : null}
        </div>

        <fieldset data-field="kategori" className="border-0 p-0 sm:col-span-2">
          <legend className="text-r-fg mb-1.5 text-[13px] font-semibold">
            Kategori masalah
          </legend>
          <div className="flex flex-wrap gap-2">
            {KATEGORI_OPTIONS.map((kategori) => (
              <label key={kategori} className="relative">
                <input
                  type="radio"
                  name="kategori"
                  value={kategori}
                  checked={form.kategori === kategori}
                  onChange={() => setField('kategori', kategori)}
                  className="peer sr-only"
                />
                <span
                  className={`border-r-line text-r-fg peer-checked:border-r-fg peer-checked:bg-r-fg peer-hover:border-r-accent-ink peer-focus-visible:outline-r-accent-ink inline-flex min-h-10 items-center rounded-lg border bg-white px-3.5 py-2 text-[13px] font-medium transition-colors peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 sm:min-h-9 sm:py-1.5 ${
                    errors.kategori ? 'border-r-accent-ink' : ''
                  }`}
                >
                  {kategori}
                </span>
              </label>
            ))}
          </div>
          {errors.kategori ? (
            <p className="text-r-accent-ink mt-2 text-[12.5px] font-medium">
              Pilih satu kategori agar tiket masuk antrean yang tepat.
            </p>
          ) : null}
        </fieldset>

        <fieldset data-field="urgensi" className="border-0 p-0 sm:col-span-2">
          <legend className="text-r-fg mb-1.5 text-[13px] font-semibold">
            Tingkat urgensi
          </legend>
          <div className="flex flex-wrap gap-2">
            {URGENSI_OPTIONS.map(([value, label]) => (
              <label key={value} className="relative max-w-full">
                <input
                  type="radio"
                  name="urgensi"
                  value={value}
                  checked={form.urgensi === value}
                  onChange={() => setField('urgensi', value)}
                  className="peer sr-only"
                />
                <span className="border-r-line text-r-fg peer-checked:border-r-fg peer-checked:bg-r-fg peer-hover:border-r-accent-ink peer-focus-visible:outline-r-accent-ink inline-flex min-h-10 items-center rounded-lg border bg-white px-3.5 py-2 text-left text-[13px] leading-snug font-medium transition-colors peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 sm:min-h-9 sm:py-1.5">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div
          data-field="deskripsi"
          className="flex flex-col gap-1.5 sm:col-span-2"
        >
          <label
            htmlFor="f-deskripsi"
            className="text-r-fg text-[13px] font-semibold"
          >
            Apa yang terjadi?
          </label>
          <textarea
            id="f-deskripsi"
            value={form.deskripsi}
            onChange={(event) => setField('deskripsi', event.target.value)}
            placeholder="mis. AC Lab Komputer 2 tidak dingin sejak tadi pagi; sudah dicoba reset, tetap hangat."
            aria-invalid={errors.deskripsi || undefined}
            className={`${FIELD_CLASS} min-h-24 resize-y leading-[1.55]`}
          />
          {errors.deskripsi ? (
            <p className="text-r-accent-ink text-[12.5px] font-medium">
              Ceritakan masalahnya minimal 10 karakter.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label
            htmlFor="f-foto"
            className="text-r-fg text-[13px] font-semibold"
          >
            Foto pendukung{' '}
            <span className="text-r-muted text-xs font-normal">(opsional)</span>
          </label>
          <div className="border-r-line bg-r-bg/65 focus-within:outline-r-accent-ink relative flex flex-col items-start gap-2 rounded-lg border border-dashed p-3 focus-within:outline-2 focus-within:outline-offset-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <span className="border-r-line text-r-fg inline-flex min-h-10 items-center rounded-lg border bg-white px-[14px] py-1.5 text-[13.5px] font-semibold sm:min-h-9">
              Pilih foto
            </span>
            <span className="text-r-muted max-w-full truncate text-[13px]">
              {fotoName}
            </span>
            <input
              id="f-foto"
              type="file"
              accept="image/*"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              onChange={(event) =>
                setFotoName(
                  event.target.files?.[0]?.name ?? 'Belum ada foto dipilih',
                )
              }
            />
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2.5">
        <button
          type="submit"
          className="bg-r-fg hover:bg-r-dark-hover text-r-surface min-h-11 w-full rounded-lg px-[22px] py-3 text-[14.5px] font-semibold transition-colors active:translate-y-px"
        >
          Kirim laporan
        </button>
        <p className="text-r-muted text-xs">
          Anda akan diarahkan ke halaman masuk untuk mengirim laporan resmi.{' '}
          <Link
            to="/login"
            className="text-r-accent-ink font-semibold underline"
          >
            Masuk sekarang
          </Link>
          .
        </p>
      </div>
    </form>
  )
}

const LAYANAN = [
  {
    id: 'listrik',
    judul: 'Listrik & panel',
    isi: 'Lampu mati, MCB turun, stop kontak panas, atau panel yang perlu pengecekan beban.',
    pic: 'Tim Elektrikal',
    target: '≤ 4 jam · bahaya listrik diprioritaskan',
    x: 27.1,
    y: 83.3,
  },
  {
    id: 'air',
    judul: 'Air & plumbing',
    isi: 'Kran menetes, saluran mampet, WC tersumbat, sampai kebocoran di balik dinding.',
    pic: 'Tim Plumbing',
    target: '≤ 8 jam · kebocoran besar ≤ 2 jam',
    x: 67.7,
    y: 57.5,
  },
  {
    id: 'hvac',
    judul: 'HVAC & ventilasi',
    isi: 'AC tidak dingin, filter kotor, exhaust bising, atau suhu ruangan yang tidak merata.',
    pic: 'Tim Mekanikal',
    target: '≤ 24 jam · servis filter terjadwal',
    x: 70.8,
    y: 12.7,
  },
  {
    id: 'kebersihan',
    judul: 'Kebersihan & lingkungan',
    isi: 'Area kotor pasca-acara, sampah menumpuk, hama, atau kebutuhan pembersihan mendadak.',
    pic: 'Tim Kebersihan',
    target: '≤ 6 jam · piket harian per zona',
    x: 68.3,
    y: 83.3,
  },
] as const

function DenahGedung({
  zona,
  onPilih,
}: {
  zona: string
  onPilih: (id: string) => void
}) {
  return (
    <div className="bg-r-sage relative aspect-[4/5] w-full rounded-[16px]">
      <svg
        viewBox="0 0 480 600"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <line
          x1="24"
          y1="560"
          x2="456"
          y2="560"
          stroke="var(--rawat-fg)"
          strokeWidth="3"
        />

        {zona === 'hvac' ? (
          <rect
            x="272"
            y="40"
            width="136"
            height="118"
            fill="var(--rawat-accent-soft)"
          />
        ) : null}
        {zona === 'air' ? (
          <rect
            x="242"
            y="278"
            width="166"
            height="130"
            fill="var(--rawat-accent-soft)"
          />
        ) : null}
        {zona === 'listrik' ? (
          <rect
            x="68"
            y="438"
            width="124"
            height="118"
            fill="var(--rawat-accent-soft)"
          />
        ) : null}
        {zona === 'kebersihan' ? (
          <rect
            x="242"
            y="438"
            width="166"
            height="118"
            fill="var(--rawat-accent-soft)"
          />
        ) : null}

        <rect
          x="60"
          y="102"
          width="360"
          height="458"
          fill="var(--rawat-bg)"
          stroke="var(--rawat-fg)"
          strokeWidth="2.5"
        />
        <rect x="48" y="88" width="384" height="16" fill="var(--rawat-fg)" />
        <line
          x1="60"
          y1="264"
          x2="420"
          y2="264"
          stroke="var(--rawat-fg)"
          strokeWidth="2"
        />
        <line
          x1="60"
          y1="418"
          x2="420"
          y2="418"
          stroke="var(--rawat-fg)"
          strokeWidth="2"
        />

        <rect
          x="286"
          y="46"
          width="108"
          height="42"
          fill="var(--rawat-surface)"
          stroke="var(--rawat-fg)"
          strokeWidth="2.5"
        />
        <line
          x1="308"
          y1="46"
          x2="308"
          y2="88"
          stroke="var(--rawat-fg)"
          strokeWidth="2"
        />
        <line
          x1="330"
          y1="46"
          x2="330"
          y2="88"
          stroke="var(--rawat-fg)"
          strokeWidth="2"
        />
        <line
          x1="352"
          y1="46"
          x2="352"
          y2="88"
          stroke="var(--rawat-fg)"
          strokeWidth="2"
        />
        <rect
          x="322"
          y="102"
          width="30"
          height="58"
          fill="var(--rawat-surface)"
          stroke="var(--rawat-fg)"
          strokeWidth="2.5"
        />

        <path
          d="M228 102 V560"
          stroke="var(--rawat-fg)"
          strokeWidth="3"
          fill="none"
        />
        <path
          d="M228 320 H262"
          stroke="var(--rawat-fg)"
          strokeWidth="3"
          fill="none"
        />

        {[92, 168, 244, 320].map((x) => (
          <rect
            key={`f3-${x}`}
            x={x}
            y="132"
            width="52"
            height="36"
            fill="var(--rawat-sage)"
            stroke="var(--rawat-fg)"
            strokeWidth="2"
          />
        ))}
        {[92, 168].map((x) => (
          <rect
            key={`f2-${x}`}
            x={x}
            y="292"
            width="52"
            height="36"
            fill="var(--rawat-sage)"
            stroke="var(--rawat-fg)"
            strokeWidth="2"
          />
        ))}
        <rect
          x="92"
          y="448"
          width="52"
          height="36"
          fill="var(--rawat-sage)"
          stroke="var(--rawat-fg)"
          strokeWidth="2"
        />

        <rect
          x="262"
          y="292"
          width="60"
          height="38"
          fill="var(--rawat-surface)"
          stroke="var(--rawat-fg)"
          strokeWidth="2.5"
        />
        <circle
          cx="292"
          cy="352"
          r="13"
          fill="none"
          stroke="var(--rawat-fg)"
          strokeWidth="2.5"
        />
        <path
          d="M292 365 V392"
          stroke="var(--rawat-fg)"
          strokeWidth="2.5"
          fill="none"
        />
        <rect
          x="344"
          y="300"
          width="44"
          height="96"
          fill="var(--rawat-surface)"
          stroke="var(--rawat-fg)"
          strokeWidth="2.5"
        />
        <line
          x1="344"
          y1="326"
          x2="388"
          y2="326"
          stroke="var(--rawat-fg)"
          strokeWidth="2"
        />

        <rect
          x="84"
          y="452"
          width="72"
          height="98"
          fill="var(--rawat-surface)"
          stroke="var(--rawat-fg)"
          strokeWidth="2.5"
        />
        <line
          x1="98"
          y1="472"
          x2="142"
          y2="472"
          stroke="var(--rawat-fg)"
          strokeWidth="2.5"
        />
        <line
          x1="98"
          y1="492"
          x2="142"
          y2="492"
          stroke="var(--rawat-fg)"
          strokeWidth="2.5"
        />
        <circle cx="120" cy="522" r="8" fill="var(--rawat-fg)" />

        <rect
          x="262"
          y="452"
          width="136"
          height="108"
          fill="var(--rawat-surface)"
          stroke="var(--rawat-fg)"
          strokeWidth="2.5"
        />
        <line
          x1="330"
          y1="452"
          x2="330"
          y2="560"
          stroke="var(--rawat-fg)"
          strokeWidth="2.5"
        />
        <circle
          cx="360"
          cy="536"
          r="16"
          fill="none"
          stroke="var(--rawat-fg)"
          strokeWidth="2.5"
        />
        <path d="M360 520 V496" stroke="var(--rawat-fg)" strokeWidth="2.5" />
        <path
          d="M360 506 q-14 -12 -3 -26 q17 5 3 26"
          fill="var(--rawat-fg)"
          stroke="none"
        />
      </svg>

      {LAYANAN.map((kategori) => {
        const aktif = zona === kategori.id

        return (
          <button
            key={kategori.id}
            type="button"
            aria-pressed={aktif}
            aria-label={`Zona ${kategori.judul}`}
            onClick={() => onPilih(kategori.id)}
            className={`focus-visible:outline-r-accent-ink absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform duration-150 after:absolute after:-inset-1.5 after:content-[''] hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 sm:h-11 sm:w-11 sm:after:inset-0 ${
              aktif
                ? 'bg-r-accent outline-r-fg/25 outline-4'
                : 'bg-r-fg hover:bg-r-dark-hover'
            }`}
            style={{ left: `${kategori.x}%`, top: `${kategori.y}%` }}
          >
            <span className="sr-only">{kategori.judul}</span>
          </button>
        )
      })}
    </div>
  )
}

function LayananSection() {
  const [zona, setZona] = useState<string>('listrik')

  return (
    <section id="layanan" className="scroll-mt-20">
      <div className="mx-auto max-w-[1160px] px-4 pt-4 pb-14 sm:px-7 sm:pt-7 sm:pb-[clamp(52px,7vw,88px)]">
        <div className="grid gap-4 sm:gap-8 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="text-r-accent-ink mb-2 text-[13px] font-semibold sm:text-[13.5px]">
              Layanan
            </p>
            <h2 className="max-w-[22ch] text-[clamp(1.625rem,1rem+3vw,2.875rem)] leading-[1.12] font-semibold tracking-[-0.02em] text-balance lg:leading-[1.1]">
              Empat jenis masalah yang sering dilaporkan
            </h2>
          </div>
          <p className="text-r-muted max-w-[46ch] text-[15px] leading-[1.6] text-pretty sm:text-[17px] lg:justify-self-end">
            Setiap kategori punya alur penanganan sendiri: PIC, perkiraan waktu,
            dan checklist penyelesaian yang disepakati pengelola fakultas.
          </p>
        </div>

        <div className="mt-8 grid items-start gap-7 sm:mt-12 sm:gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="motion-denah mx-auto w-full max-w-[300px] sm:max-w-[380px] lg:max-w-none">
            <DenahGedung zona={zona} onPilih={setZona} />
            <p className="text-r-muted mt-3 text-center text-[13px] leading-[1.5] text-pretty sm:mt-4 sm:text-[13.5px] lg:text-left">
              Denah ilustratif satu gedung fakultas berlantai tiga. Ketuk titik
              zona, atau pilih kategori dari daftar.
            </p>
          </div>

          <div>
            {LAYANAN.map((kategori) => {
              const dipilih = zona === kategori.id

              return (
                <button
                  key={kategori.id}
                  type="button"
                  aria-pressed={dipilih}
                  onClick={() => setZona(kategori.id)}
                  className={`motion-layanan-card focus-visible:outline-r-accent-ink mb-2.5 block w-full rounded-[14px] px-4 py-4 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 sm:mb-3 sm:px-5 sm:py-5 ${
                    dipilih ? 'bg-r-beige' : 'hover:bg-r-sage/60'
                  }`}
                >
                  <span className="flex items-baseline gap-2.5 sm:gap-3">
                    <span
                      aria-hidden="true"
                      className={`h-2.5 w-2.5 flex-none rounded-full ${
                        dipilih ? 'bg-r-accent' : 'bg-r-fg/25'
                      }`}
                    />
                    <h3 className="text-[18.5px] leading-[1.2] font-semibold tracking-[-0.015em] sm:text-[clamp(20px,2vw,26px)] sm:leading-[1.15]">
                      {kategori.judul}
                    </h3>
                  </span>
                  <span className="text-r-muted mt-1.5 block pl-5 text-[13px] leading-[1.5] sm:mt-2 sm:pl-[22px] sm:text-[14px]">
                    PIC {kategori.pic} · {kategori.target}
                  </span>
                  <span className="text-r-fg mt-2 block max-w-[52ch] pl-5 text-[14.5px] leading-[1.6] text-pretty sm:mt-2.5 sm:pl-[22px] sm:text-[16px]">
                    {kategori.isi}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-7 flex flex-col items-start gap-4 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
          <a
            href="#lapor"
            className="bg-r-fg hover:bg-r-dark-hover text-r-surface inline-flex min-h-11 w-full items-center justify-center rounded-lg px-[22px] py-3 text-[14.5px] font-semibold transition-colors active:translate-y-px sm:w-auto"
          >
            Lihat cakupan layanan
          </a>
          <p className="text-r-muted max-w-[40ch] text-[14.5px] leading-[1.6] text-pretty sm:text-[16px]">
            Di luar empat kategori ini, laporan masuk ke antrean umum dan tetap
            dipantau sampai selesai.
          </p>
        </div>
      </div>
    </section>
  )
}

function useActiveSection() {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return

    const sections = NAV_LINKS.map(([id]) =>
      document.getElementById(id),
    ).filter((section): section is HTMLElement => section !== null)

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
        if (visible.length === 0) return

        const current = visible.reduce((best, entry) =>
          entry.intersectionRatio > best.intersectionRatio ? entry : best,
        )
        setActive(current.target.id)
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75] },
    )

    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  return active
}

export function LandingPage() {
  const navigate = useNavigate()
  const activeSection = useActiveSection()
  const [testiIndex, setTestiIndex] = useState(0)
  const { data: user } = useQuery(meQueryOptions)

  const [heroTab, setHeroTab] = useState<HeroTabId>('lapor')
  const [heroLocationIndex, setHeroLocationIndex] = useState(0)
  const [heroDateMode, setHeroDateMode] = useState<'today' | 'yesterday'>(
    'today',
  )
  const [heroSlaMode, setHeroSlaMode] = useState<'prioritas' | 'siaga'>(
    'prioritas',
  )
  const [statusLookupCode, setStatusLookupCode] = useState('LR-412')

  const [selectedCategory, setSelectedCategory] =
    useState<string>('Listrik & AC')
  const [selectedPriority, setSelectedPriority] = useState<
    'Normal' | 'Mendesak'
  >('Normal')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalLocation, setModalLocation] = useState('')
  const [modalIssue, setModalIssue] = useState('')
  const [modalError, setModalError] = useState<string | null>(null)
  const ticketCount = 3
  const [toasts, setToasts] = useState<Array<{ id: number; message: string }>>(
    [],
  )
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const locationInputRef = useRef<HTMLInputElement>(null)
  const heroTabRefs = useRef<Array<HTMLButtonElement | null>>([])

  const currentHeroLocation = HERO_LOCATIONS[heroLocationIndex]!

  const showToast = (message: string) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3600)
  }

  const handleOpenReportModal = (
    category?: string,
    prefillLocation?: string,
  ) => {
    if (
      category &&
      MODAL_CATEGORIES.includes(category as (typeof MODAL_CATEGORIES)[number])
    ) {
      setSelectedCategory(category)
    }
    if (prefillLocation !== undefined) {
      setModalLocation(prefillLocation)
    }
    setModalError(null)
    setIsModalOpen(true)
  }

  const handleHeroTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | null = null
    if (e.key === 'ArrowRight') nextIndex = (index + 1) % HERO_TABS.length
    else if (e.key === 'ArrowLeft')
      nextIndex = (index - 1 + HERO_TABS.length) % HERO_TABS.length
    else if (e.key === 'Home') nextIndex = 0
    else if (e.key === 'End') nextIndex = HERO_TABS.length - 1

    if (nextIndex !== null) {
      e.preventDefault()
      setHeroTab(HERO_TABS[nextIndex]!.id)
      heroTabRefs.current[nextIndex]?.focus()
    }
  }

  const handleCloseReportModal = () => {
    setIsModalOpen(false)
    setModalError(null)
  }

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsModalOpen(false)
    setModalError(null)
    void navigate({ to: '/login' })
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        handleCloseReportModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen])

  useEffect(() => {
    if (isModalOpen) {
      const timer = setTimeout(() => {
        locationInputRef.current?.focus()
      }, 60)
      return () => clearTimeout(timer)
    }
  }, [isModalOpen])

  return (
    <div className="font-jakarta min-h-screen bg-[#F7FAF8] text-[#0F3B2E] antialiased selection:bg-[#0F3B2E] selection:text-white">
      {/* ===================================================================== */}
      {/* 1. MINIMALIST TOP NAVBAR (FigCraft Page 1 — Green Brand Identity)     */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-40 w-full border-b border-[#E3EDE8] bg-[#F7FAF8]/92 backdrop-blur-md">
        <div className="w-full px-4 py-3 sm:px-8 sm:py-3.5 lg:px-10 xl:px-12">
          <nav
            className="flex items-center justify-between gap-3 sm:gap-4"
            aria-label="Navigasi Utama"
          >
            {/* Left: Brand Logo */}
            <div className="flex min-w-0 items-center gap-8">
              <a
                href="#top"
                className="group flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F3B2E] sm:gap-2.5"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-[#0F3B2E] transition-transform duration-200 group-hover:scale-105">
                  <span
                    className="h-2.5 w-2.5 rounded-full bg-[#4ADE80]"
                    aria-hidden="true"
                  />
                </span>
                <span className="text-[16.5px] font-bold tracking-[-0.03em] text-[#0F3B2E] sm:text-[18px]">
                  Facility Reporting
                </span>
              </a>

              <div className="hidden items-center gap-6 lg:flex">
                <a
                  href="#layanan"
                  aria-current={
                    activeSection === 'layanan' ? 'true' : undefined
                  }
                  className={`text-[13px] font-medium transition-colors hover:text-[#0F3B2E] ${
                    activeSection === 'layanan'
                      ? 'font-semibold text-[#0F3B2E]'
                      : 'text-[#466457]'
                  }`}
                >
                  Layanan
                </a>
                <a
                  href="#dampak"
                  aria-current={activeSection === 'dampak' ? 'true' : undefined}
                  className={`text-[13px] font-medium transition-colors hover:text-[#0F3B2E] ${
                    activeSection === 'dampak'
                      ? 'font-semibold text-[#0F3B2E]'
                      : 'text-[#466457]'
                  }`}
                >
                  Alur Tiket
                </a>
                <a
                  href="#cerita"
                  aria-current={activeSection === 'cerita' ? 'true' : undefined}
                  className={`text-[13px] font-medium transition-colors hover:text-[#0F3B2E] ${
                    activeSection === 'cerita'
                      ? 'font-semibold text-[#0F3B2E]'
                      : 'text-[#466457]'
                  }`}
                >
                  Cerita
                </a>
              </div>
            </div>

            {/* Right: Lapor Fasilitas Pill, Bell & Profile */}
            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
              <Link
                to={(user ? homeFor(user.role) : '/login') as never}
                className="hidden items-center rounded-full border border-[#C4DDD0] bg-white px-4 py-2 text-[12.5px] font-semibold text-[#0F3B2E] shadow-xs transition-all hover:border-[#0F3B2E] hover:bg-[#F0F7F3] sm:inline-flex"
              >
                {user ? 'Buka dashboard' : 'Lapor masalah'}
              </Link>

              {/* Notification Bell with Live Emerald Indicator */}
              <button
                type="button"
                onClick={() =>
                  showToast(
                    `Terdapat ${ticketCount} laporan aktif yang sedang dipantau teknisi`,
                  )
                }
                aria-label="Lihat laporan aktif"
                className="relative inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[#C4DDD0] bg-white text-[#0F3B2E] transition-colors hover:border-[#0F3B2E] hover:bg-[#F0F7F3] sm:h-9 sm:w-9"
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
                <span className="absolute -top-0.5 -right-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#22C55E] px-1 text-[10px] leading-none font-bold text-white ring-2 ring-[#F7FAF8]">
                  {ticketCount}
                </span>
              </button>

              {/* Profile Icon */}
              <Link
                to={(user ? homeFor(user.role) : '/login') as never}
                aria-label={user ? 'Akun pengguna' : 'Masuk akun'}
                className="hidden h-9 w-9 items-center justify-center rounded-full border border-[#C4DDD0] bg-white text-[#0F3B2E] transition-colors hover:border-[#0F3B2E] hover:bg-[#F0F7F3] sm:inline-flex"
              >
                <User className="h-4 w-4" aria-hidden="true" />
              </Link>

              {/* Mobile & Tablet Menu Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label="Buka menu navigasi"
                aria-expanded={mobileMenuOpen}
                className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[#C4DDD0] bg-white text-[#0F3B2E] transition-colors hover:bg-[#F0F7F3] sm:h-9 sm:w-9 lg:hidden"
              >
                {mobileMenuOpen ? (
                  <X className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Menu className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </nav>

          {/* Mobile & Tablet Dropdown Navigation */}
          {mobileMenuOpen && (
            <div className="pt-3 lg:hidden">
              <div className="flex flex-col gap-1 border-t border-[#E3EDE8] pt-3">
                <a
                  href="#layanan"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex min-h-11 items-center rounded-xl px-3 py-2 text-sm font-semibold text-[#0F3B2E] hover:bg-[#E7F2EC]"
                >
                  Layanan
                </a>
                <a
                  href="#dampak"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex min-h-11 items-center rounded-xl px-3 py-2 text-sm font-medium text-[#466457] hover:bg-[#E7F2EC]"
                >
                  Alur Tiket
                </a>
                <a
                  href="#cerita"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex min-h-11 items-center rounded-xl px-3 py-2 text-sm font-medium text-[#466457] hover:bg-[#E7F2EC]"
                >
                  Cerita
                </a>
                <Link
                  to={(user ? homeFor(user.role) : '/login') as never}
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-1.5 flex min-h-11 items-center justify-center rounded-xl bg-[#0F3B2E] px-3 py-2.5 text-center text-sm font-semibold text-white sm:hidden"
                >
                  {user ? 'Buka dashboard' : 'Lapor masalah'}
                </Link>
              </div>
            </div>
          )}
        </div>
        <div className="scroll-progress-bar" aria-hidden="true" />
      </header>

      {/* ===================================================================== */}
      {/* 2. HERO SECTION (FigCraft Page 1 — Architectural Green Edition)       */}
      {/* ===================================================================== */}
      <section
        id="top"
        className="relative w-full overflow-x-clip bg-[#F7FAF8] pt-3 pb-6 sm:pt-6 sm:pb-10"
      >
        {/* Monochromatic Sage Campus Map Backdrop (z-0, extends down to right above Layanan) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-[480px] bottom-0 z-0 overflow-hidden bg-[#F1F7F4] sm:top-[560px] lg:top-[580px] xl:top-[640px] 2xl:top-[690px]"
        >
          <svg
            viewBox="0 0 1200 390"
            preserveAspectRatio="xMidYMid slice"
            className="h-full w-full opacity-95"
          >
            <g fill="none" strokeLinecap="round">
              <path
                d="M0 40 L480 210 L920 380"
                stroke="#DCEAE2"
                strokeWidth="10"
              />
              <path d="M180 0 L620 390" stroke="#DCEAE2" strokeWidth="8" />
              <path
                d="M0 290 L520 120 L1200 180"
                stroke="#DCEAE2"
                strokeWidth="7"
              />
              <path
                d="M340 390 L760 60 L1200 30"
                stroke="#DCEAE2"
                strokeWidth="9"
              />
              <path d="M1010 0 L980 390" stroke="#DCEAE2" strokeWidth="8" />
              <path
                d="M60 160 L340 60 M140 240 L440 130 M580 260 L920 140 M720 360 L1140 220"
                stroke="#E5F0EA"
                strokeWidth="4"
              />
              <path
                d="M80 0 L190 360 M310 20 L430 380 M810 10 L890 380 M1110 40 L1160 360"
                stroke="#E5F0EA"
                strokeWidth="3"
              />
            </g>
            <rect
              x="110"
              y="175"
              width="90"
              height="44"
              rx="6"
              fill="#E3EFE8"
              transform="rotate(-18 155 197)"
            />
            <rect
              x="680"
              y="200"
              width="110"
              height="52"
              rx="6"
              fill="#E3EFE8"
              transform="rotate(14 735 226)"
            />
            <rect
              x="860"
              y="145"
              width="84"
              height="40"
              rx="6"
              fill="#E3EFE8"
              transform="rotate(-10 902 165)"
            />
            <text
              x="86"
              y="196"
              fill="#9DB7A9"
              fontSize="10"
              fontWeight="600"
              letterSpacing="1.2"
              transform="rotate(18 86 196)"
            >
              JL. KAMPUS II SAINTEK
            </text>
            <text
              x="618"
              y="232"
              fill="#9DB7A9"
              fontSize="10"
              fontWeight="600"
              letterSpacing="1.2"
              transform="rotate(-26 618 232)"
            >
              KORIDOR LAB SAINTEK
            </text>
            <text
              x="450"
              y="290"
              fill="#9DB7A9"
              fontSize="10"
              fontWeight="600"
              letterSpacing="1.2"
              transform="rotate(10 450 290)"
            >
              GEDUNG A · KULIAH
            </text>
            <text
              x="996"
              y="246"
              fill="#9DB7A9"
              fontSize="10"
              fontWeight="600"
              letterSpacing="1.2"
            >
              PERPUSTAKAAN PUSAT
            </text>
          </svg>
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#F7FAF8] to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#F7FAF8] to-transparent" />
        </div>

        {/* 2A. ROUNDED ARCHITECTURAL HERO BANNER CARD (z-10, floats cleanly above map) */}
        <div className="relative z-10 w-full px-3 sm:px-5 lg:px-6 xl:px-8">
          <div className="motion-hero-stage relative overflow-clip rounded-[24px] bg-[#E6EFF6] shadow-[0_24px_56px_-24px_rgba(15,59,46,0.24)] sm:rounded-[28px] lg:rounded-[32px]">
            <div className="relative flex flex-col lg:block lg:h-[640px] xl:h-[710px] 2xl:h-[760px]">
              {/* Left-to-Center Editorial Typography Block (sits on clean sky canvas on mobile/tablet) */}
              <div className="animate-rise relative z-10 flex max-w-[1060px] flex-col px-5 pt-6 pb-4 sm:px-10 sm:pt-10 sm:pb-6 lg:px-16 lg:pt-20 lg:pb-48 xl:px-20 xl:pt-24">
                {/* Editorial Architectural Kicker */}
                <p className="mb-3 inline-flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.13em] text-[#284B3D] uppercase sm:mb-5 sm:gap-3 sm:text-[12px] sm:tracking-[0.14em]">
                  <span
                    aria-hidden="true"
                    className="h-px w-6 bg-[#0F3B2E]/45 sm:w-7"
                  />
                  <span>Pelaporan Fasilitas Kampus</span>
                </p>

                <h1 className="flex flex-wrap items-baseline gap-x-[0.2em] text-[clamp(2.85rem,1.4rem+6.5vw,4.5rem)] leading-[0.96] font-extrabold tracking-[-0.045em] text-balance text-[#0F3B2E] sm:flex-nowrap sm:text-[clamp(3.75rem,1.8rem+5vw,5.5rem)] lg:text-[clamp(4.5rem,2.2rem+5vw,8.75rem)] lg:leading-[0.94]">
                  <span className="sr-only">
                    Fasilitas rusak? Cukup satu laporan —{' '}
                  </span>
                  <span>{HERO_CONTENT.titleLine1}</span>
                  <span className="text-[#146C34] lg:text-[#15803D]">
                    {HERO_CONTENT.titleLine2}
                  </span>
                </h1>

                {/* Horizontal Subtitle + Live Facility Metrics Row */}
                <div className="mt-4 flex flex-col gap-4 sm:mt-7 sm:flex-row sm:items-center sm:gap-7 lg:mt-8 lg:gap-8">
                  <p className="max-w-[34ch] text-[15px] leading-[1.6] font-medium text-pretty text-[#1F4235] sm:max-w-[28ch] sm:text-[17px] sm:leading-[1.55] sm:text-[#2E5244] xl:max-w-[31ch] xl:text-[18.5px]">
                    {HERO_CONTENT.subtitle}
                  </p>

                  <span
                    aria-hidden="true"
                    className="hidden h-11 w-px shrink-0 bg-[#0F3B2E]/20 sm:block"
                  />

                  <div className="grid grid-cols-2 gap-2.5 rounded-2xl border border-[#0F3B2E]/10 bg-white/75 px-3.5 py-3 backdrop-blur-xs sm:flex sm:flex-wrap sm:items-center sm:gap-x-7 sm:gap-y-2 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none lg:gap-x-8">
                    <div className="flex flex-col">
                      <span className="text-[15.5px] leading-tight font-extrabold tracking-[-0.02em] whitespace-nowrap text-[#146C34] sm:text-[19px] lg:text-[#15803D] xl:text-[21px]">
                        {HERO_CONTENT.uptime}
                      </span>
                      <span className="mt-0.5 text-[11.5px] font-medium text-[#355649] sm:text-[12px] sm:text-[#466457]">
                        Kondisi fasilitas
                      </span>
                    </div>
                    <div className="flex flex-col border-l border-[#0F3B2E]/12 pl-2.5 sm:border-l-0 sm:pl-0">
                      <span className="text-[15.5px] leading-tight font-extrabold tracking-[-0.02em] whitespace-nowrap text-[#0F3B2E] sm:text-[19px] xl:text-[21px]">
                        {HERO_CONTENT.technicians}
                      </span>
                      <span className="mt-0.5 text-[11.5px] font-medium text-[#355649] sm:text-[12px] sm:text-[#466457]">
                        Siap ditugaskan
                      </span>
                    </div>
                  </div>
                </div>

                {/* Editorial 3-Step Flow Strip */}
                <ol className="mt-4 flex w-full flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#0F3B2E]/15 pt-4 text-[12.5px] font-medium text-[#1F4235] sm:mt-8 sm:w-fit sm:gap-x-7 sm:pt-5 sm:text-[14px] sm:text-[#2E5244] lg:mt-9">
                  <li className="inline-flex items-center gap-1.5 sm:gap-2">
                    <span className="font-mono text-[11.5px] font-bold tracking-[0.06em] text-[#146C34] lg:text-[#15803D]">
                      01
                    </span>
                    <span>Foto &amp; lokasi</span>
                  </li>
                  <li
                    aria-hidden="true"
                    className="hidden h-px w-5 bg-[#0F3B2E]/25 sm:block"
                  />
                  <li className="inline-flex items-center gap-1.5 sm:gap-2">
                    <span className="font-mono text-[11.5px] font-bold tracking-[0.06em] text-[#146C34] lg:text-[#15803D]">
                      02
                    </span>
                    <span>Verifikasi cepat</span>
                  </li>
                  <li
                    aria-hidden="true"
                    className="hidden h-px w-5 bg-[#0F3B2E]/25 sm:block"
                  />
                  <li className="inline-flex items-center gap-1.5 sm:gap-2">
                    <span className="font-mono text-[11.5px] font-bold tracking-[0.06em] text-[#146C34] lg:text-[#15803D]">
                      03
                    </span>
                    <span>Teknisi tangani</span>
                  </li>
                </ol>
              </div>

              {/* Architectural Hero Photo: seamless lower band on mobile/tablet, full-bleed on desktop */}
              <div className="relative -mt-3 h-[215px] w-full sm:-mt-4 sm:h-[280px] lg:absolute lg:inset-0 lg:mt-0 lg:h-full">
                <img
                  src={HERO_CONTENT.image}
                  alt={HERO_CONTENT.imageAlt}
                  fetchPriority="high"
                  decoding="sync"
                  className="motion-hero-photo h-full w-full object-cover object-[84%_24%] lg:object-right"
                />
                {/* Seamless top sky blend on mobile/tablet */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#E6EFF6] via-[#E6EFF6]/60 to-transparent lg:hidden"
                />
                {/* Subtle lower grounding shade behind mobile tabs */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#0F3B2E]/25 to-transparent lg:hidden"
                />
                {/* Soft left sky veil on desktop so right-most metric stays high contrast */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-0 hidden w-[64%] bg-gradient-to-r from-[#E6EFF6]/85 via-[#E6EFF6]/50 via-70% to-transparent lg:block"
                />
              </div>

              {/* Floating Live-Ticket Glassmorphism Card (Desktop only, bridges sky & architecture) */}
              <button
                type="button"
                onClick={() => {
                  setStatusLookupCode(HERO_CONTENT.liveTicket.code)
                  setHeroTab('status')
                }}
                aria-label={`Lacak tiket aktif #${HERO_CONTENT.liveTicket.code} (${HERO_CONTENT.liveTicket.title})`}
                className="group absolute right-8 bottom-[184px] z-20 hidden max-w-[350px] cursor-pointer flex-col gap-2.5 rounded-[22px] border border-white/75 bg-white/84 px-6 py-4.5 text-left shadow-[0_18px_42px_-12px_rgba(15,59,46,0.24)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F3B2E] lg:flex xl:right-14 xl:bottom-[204px]"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11.5px] font-bold tracking-[0.04em] text-[#0F3B2E]">
                    <span className="h-2 w-2 rounded-full bg-[#16A34A]" />#
                    {HERO_CONTENT.liveTicket.code}
                  </span>
                  <span className="rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-[11px] font-semibold text-[#15803D]">
                    {HERO_CONTENT.liveTicket.status}
                  </span>
                </div>
                <div>
                  <p className="text-[14.5px] leading-snug font-bold text-[#0F3B2E]">
                    {HERO_CONTENT.liveTicket.title}
                  </p>
                  <p className="mt-0.5 text-[12px] text-[#466457]">
                    {HERO_CONTENT.liveTicket.technician} ·{' '}
                    {HERO_CONTENT.liveTicket.updatedAt}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[#15803D] transition-colors group-hover:text-[#0F3B2E]">
                  Cek progres tiket
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 2B. FLOATING QUICK REPORT BAR (z-20, floats above Hero & Map) */}
        <div className="motion-hero-bar relative z-20 -mt-16 pb-4 sm:-mt-28 sm:pb-8 lg:-mt-40 xl:-mt-44">
          <div className="mx-auto w-full max-w-[1520px] px-3 sm:px-8 lg:px-12 xl:px-16">
            {/* Attached Single-Row Accessible Tablist */}
            <div
              role="tablist"
              aria-label="Mode layanan cepat fasilitas"
              className="no-scrollbar grid w-full grid-cols-3 overflow-x-auto rounded-t-[18px] bg-[#0F3B2E] sm:inline-flex sm:w-auto sm:max-w-full sm:rounded-t-[20px]"
              {...({ focusgroup: 'tablist nomemory' } as Record<
                string,
                string
              >)}
            >
              {HERO_TABS.map((tab, index) => {
                const isSelected = heroTab === tab.id
                return (
                  <button
                    key={tab.id}
                    ref={(el) => {
                      heroTabRefs.current[index] = el
                    }}
                    id={`hero-tab-${tab.id}`}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    tabIndex={isSelected ? 0 : -1}
                    onClick={() => setHeroTab(tab.id)}
                    onKeyDown={(e) => handleHeroTabKeyDown(e, index)}
                    {...(isSelected
                      ? ({ focusgroupstart: '' } as Record<string, string>)
                      : {})}
                    className="hero-tab flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 px-2.5 py-3 text-[12.5px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#4ADE80] sm:justify-start sm:gap-2.5 sm:px-9 sm:py-4 sm:text-[15px]"
                  >
                    <span
                      aria-hidden="true"
                      className={`h-2 w-2 shrink-0 rounded-xs sm:h-2.5 sm:w-2.5 ${
                        isSelected
                          ? 'bg-[#15803D]'
                          : 'rounded-full bg-[#86EFAC]'
                      }`}
                    />
                    <span className="truncate">{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Main White Floating Bar Card */}
            <div className="rounded-b-[22px] border border-[#DCEAE2] bg-white p-4 shadow-[0_22px_50px_-16px_rgba(15,59,46,0.2)] sm:rounded-tr-[26px] sm:rounded-b-[26px] sm:p-7 lg:p-8">
              {/* TAB PANEL 1: LAPOR BARU */}
              <div
                role="tabpanel"
                aria-labelledby="hero-tab-lapor"
                hidden={heroTab !== 'lapor'}
              >
                <div className="grid grid-cols-1 gap-3.5 sm:gap-4 lg:grid-cols-[1.1fr_0.95fr_1.35fr] lg:gap-5">
                  {/* Field 1: Gedung & Ruang */}
                  <div className="rounded-[16px] border border-[#D4E6DC] bg-[#F7FBF9] px-4 py-3.5 transition-colors focus-within:border-[#0F3B2E] focus-within:bg-white sm:px-6 sm:py-5">
                    <label
                      htmlFor="hero-building-select"
                      className="block text-[11px] font-semibold tracking-[0.08em] text-[#5B7A6B] uppercase sm:text-[11.5px] sm:text-[#6E8F7F]"
                    >
                      Gedung &amp; Ruang
                    </label>
                    <div className="mt-1">
                      <select
                        id="hero-building-select"
                        value={heroLocationIndex}
                        onChange={(e) =>
                          setHeroLocationIndex(Number(e.target.value))
                        }
                        className="w-full cursor-pointer bg-transparent text-[16px] font-bold tracking-[-0.015em] text-[#0F3B2E] focus:outline-none sm:text-[18.5px]"
                      >
                        {HERO_LOCATIONS.map((loc, idx) => (
                          <option key={loc.name} value={idx}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="mt-1.5 text-[12.5px] text-[#466457] sm:mt-2 sm:text-[13px]">
                      {currentHeroLocation.sub}
                    </p>
                  </div>

                  {/* Field 2: Kategori & Urgensi */}
                  <div className="rounded-[16px] border border-[#D4E6DC] bg-[#F7FBF9] px-4 py-3.5 transition-colors focus-within:border-[#0F3B2E] focus-within:bg-white sm:px-6 sm:py-5">
                    <label
                      htmlFor="hero-category-select"
                      className="block text-[11px] font-semibold tracking-[0.08em] text-[#5B7A6B] uppercase sm:text-[11.5px] sm:text-[#6E8F7F]"
                    >
                      Kategori &amp; Urgensi
                    </label>
                    <div className="mt-1">
                      <select
                        id="hero-category-select"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full cursor-pointer bg-transparent text-[16px] font-bold tracking-[-0.015em] text-[#0F3B2E] focus:outline-none sm:text-[18.5px]"
                      >
                        {MODAL_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-1.5 flex items-center gap-4 text-[13px] sm:mt-2">
                      {MODAL_PRIORITIES.map((level) => {
                        const active = selectedPriority === level
                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setSelectedPriority(level)}
                            className={`inline-flex min-h-9 cursor-pointer items-center transition-colors sm:min-h-0 ${
                              active
                                ? 'font-semibold text-[#0F3B2E] underline underline-offset-4'
                                : 'font-medium text-[#5B7A6B] hover:text-[#0F3B2E] sm:text-[#7D9B8D]'
                            }`}
                          >
                            {level}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Field 3: Tanggal Lapor & Target SLA */}
                  <div className="grid grid-cols-1 divide-y divide-[#D4E6DC] rounded-[16px] border border-[#D4E6DC] bg-[#F7FBF9] sm:grid-cols-2 sm:divide-x sm:divide-y-0 sm:py-5">
                    <div className="px-4 py-3.5 sm:px-6 sm:py-0">
                      <span className="block text-[11px] font-semibold tracking-[0.08em] text-[#5B7A6B] uppercase sm:text-[11.5px] sm:text-[#6E8F7F]">
                        Tanggal Lapor
                      </span>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <span className="text-[16px] font-bold tracking-[-0.01em] text-[#0F3B2E] sm:text-[18px]">
                          {heroDateMode === 'today'
                            ? 'Kam, 22 Nov'
                            : 'Rab, 21 Nov'}
                        </span>
                        <Calendar
                          className="h-5 w-5 shrink-0 text-[#0F3B2E]"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="mt-1.5 flex items-center gap-4 text-[13px] sm:mt-2">
                        <button
                          type="button"
                          onClick={() => setHeroDateMode('today')}
                          className={`inline-flex min-h-9 cursor-pointer items-center sm:min-h-0 ${
                            heroDateMode === 'today'
                              ? 'font-semibold text-[#466457] underline underline-offset-4'
                              : 'text-[#5B7A6B] hover:text-[#0F3B2E] sm:text-[#7D9B8D]'
                          }`}
                        >
                          Hari ini
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeroDateMode('yesterday')}
                          className={`inline-flex min-h-9 cursor-pointer items-center sm:min-h-0 ${
                            heroDateMode === 'yesterday'
                              ? 'font-semibold text-[#466457] underline underline-offset-4'
                              : 'text-[#5B7A6B] hover:text-[#0F3B2E] sm:text-[#7D9B8D]'
                          }`}
                        >
                          Kemarin
                        </button>
                      </div>
                    </div>

                    <div className="px-4 py-3.5 sm:px-6 sm:py-0">
                      <span className="block text-[11px] font-semibold tracking-[0.08em] text-[#5B7A6B] uppercase sm:text-[11.5px] sm:text-[#6E8F7F]">
                        Target SLA
                      </span>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <span className="text-[16px] font-bold tracking-[-0.01em] text-[#146C34] sm:text-[18px] lg:text-[#15803D]">
                          {selectedPriority === 'Mendesak' ||
                          heroSlaMode === 'prioritas'
                            ? '≤ 2 Jam'
                            : '≤ 24 Jam'}
                        </span>
                        <Clock
                          className="h-5 w-5 shrink-0 text-[#146C34] lg:text-[#15803D]"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="mt-1.5 flex items-center gap-4 text-[13px] sm:mt-2">
                        <button
                          type="button"
                          onClick={() => setHeroSlaMode('prioritas')}
                          className={`inline-flex min-h-9 cursor-pointer items-center sm:min-h-0 ${
                            heroSlaMode === 'prioritas'
                              ? 'font-semibold text-[#466457] underline underline-offset-4'
                              : 'text-[#5B7A6B] hover:text-[#0F3B2E] sm:text-[#7D9B8D]'
                          }`}
                        >
                          Prioritas
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeroSlaMode('siaga')}
                          className={`inline-flex min-h-9 cursor-pointer items-center sm:min-h-0 ${
                            heroSlaMode === 'siaga'
                              ? 'font-semibold text-[#466457] underline underline-offset-4'
                              : 'text-[#5B7A6B] hover:text-[#0F3B2E] sm:text-[#7D9B8D]'
                          }`}
                        >
                          Siaga
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TAB PANEL 2: CEK STATUS */}
              <div
                role="tabpanel"
                aria-labelledby="hero-tab-status"
                hidden={heroTab !== 'status'}
              >
                <div className="grid grid-cols-1 gap-3.5 sm:gap-4 md:grid-cols-[1.2fr_1.8fr] lg:gap-5">
                  <div className="rounded-[16px] border border-[#D4E6DC] bg-[#F7FBF9] px-4 py-3.5 sm:px-6 sm:py-5">
                    <label
                      htmlFor="hero-ticket-code"
                      className="block text-[11px] font-semibold tracking-[0.08em] text-[#5B7A6B] uppercase sm:text-[11.5px] sm:text-[#6E8F7F]"
                    >
                      Nomor Tiket Laporan
                    </label>
                    <input
                      id="hero-ticket-code"
                      type="text"
                      value={statusLookupCode}
                      onChange={(e) => setStatusLookupCode(e.target.value)}
                      placeholder="Contoh: LR-412"
                      className="mt-1.5 w-full bg-transparent font-mono text-[16px] font-bold text-[#0F3B2E] focus:outline-none sm:text-[18.5px]"
                    />
                    <p className="mt-1.5 text-[12.5px] text-[#466457] sm:mt-2 sm:text-[13px]">
                      Masukkan kode tiket untuk melacak progres teknisi
                    </p>
                  </div>
                  <div className="flex flex-col justify-between gap-3 rounded-[16px] border border-[#D4E6DC] bg-[#F7FBF9] px-4 py-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:px-6 sm:py-5">
                    <div className="min-w-0">
                      <span className="block text-[11px] font-semibold tracking-[0.08em] text-[#5B7A6B] uppercase sm:text-[11.5px] sm:text-[#6E8F7F]">
                        Status Terkini · #{statusLookupCode || 'LR-412'}
                      </span>
                      <p className="mt-1.5 text-[15.5px] font-bold text-[#0F3B2E] sm:text-[18px]">
                        Diproses — Teknisi Budi S. di lokasi
                      </p>
                      <p className="mt-1 text-[12.5px] text-[#466457] sm:text-[13px]">
                        Gedung A · Lab Komputer 2 · Estimasi selesai ≤ 45 menit
                      </p>
                    </div>
                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#DCFCE7] px-3.5 py-1.5 text-[12.5px] font-semibold text-[#146C34] sm:text-[13px] lg:text-[#15803D]">
                      <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
                      Aktif ditangani
                    </span>
                  </div>
                </div>
              </div>

              {/* TAB PANEL 3: FASILITAS */}
              <div
                role="tabpanel"
                aria-labelledby="hero-tab-fasilitas"
                hidden={heroTab !== 'fasilitas'}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 lg:gap-5">
                  {[
                    {
                      zone: 'Listrik & AC',
                      status: '98% Normal',
                      pic: 'Tim Elektrikal · 5 teknisi',
                    },
                    {
                      zone: 'Sanitasi & Air',
                      status: '96% Normal',
                      pic: 'Tim Plumbing · 3 teknisi',
                    },
                    {
                      zone: 'Struktur & Ruang',
                      status: '99% Normal',
                      pic: 'Tim Sipil · 4 teknisi',
                    },
                  ].map((item) => (
                    <button
                      key={item.zone}
                      type="button"
                      onClick={() => handleOpenReportModal(item.zone)}
                      className="min-h-11 cursor-pointer rounded-[16px] border border-[#D4E6DC] bg-[#F7FBF9] px-4 py-3.5 text-left transition-colors hover:border-[#0F3B2E] hover:bg-white sm:px-6 sm:py-5"
                    >
                      <span className="block text-[11px] font-semibold tracking-[0.08em] text-[#146C34] uppercase sm:text-[11.5px] lg:text-[#15803D]">
                        {item.status}
                      </span>
                      <span className="mt-1 block text-[16px] font-bold text-[#0F3B2E] sm:mt-1.5 sm:text-[18px]">
                        {item.zone}
                      </span>
                      <span className="mt-0.5 block text-[12.5px] text-[#466457] sm:mt-1 sm:text-[13px]">
                        {item.pic}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Overlapping Primary Deep Forest Green CTA Button */}
            <div className="mt-3.5 flex justify-end sm:-mt-7 sm:pr-8">
              <button
                type="button"
                onClick={() => {
                  if (heroTab === 'status') {
                    showToast(
                      `Status tiket #${statusLookupCode || 'LR-412'}: Sedang ditangani Teknisi Budi S.`,
                    )
                    return
                  }
                  void navigate({ to: '/login' })
                }}
                className="group inline-flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-3 rounded-[16px] bg-[#0F3B2E] px-6 py-3.5 text-[15.5px] font-semibold text-white shadow-[0_16px_34px_-8px_rgba(15,59,46,0.5)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#14533F] focus-visible:ring-2 focus-visible:ring-[#0F3B2E] focus-visible:ring-offset-2 focus-visible:outline-none active:translate-y-0 sm:w-auto sm:gap-5 sm:rounded-[18px] sm:px-12 sm:py-5 sm:text-[17px]"
              >
                <span>
                  {heroTab === 'status' ? 'Lacak Tiket' : 'Kirim Laporan'}
                </span>
                <ArrowRight
                  className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </div>
      </section>

      <main id="content">
        <LayananSection />

        <section id="dampak" className="motion-alur-section scroll-mt-20">
          <div className="bg-r-fg py-14 text-white sm:py-[clamp(52px,7vw,88px)]">
            <div className="mx-auto max-w-[1600px] px-4 sm:px-7">
              <div className="grid items-start gap-8 sm:gap-[clamp(32px,5vw,72px)] lg:grid-cols-[0.85fr_1.15fr]">
                <div className="flex flex-col">
                  <span className="text-r-accent text-xs font-semibold tracking-wider uppercase">
                    Alur Tiket
                  </span>
                  <h2 className="mt-2 text-[clamp(1.5rem,1rem+2.5vw,2.125rem)] leading-[1.18] font-semibold tracking-[-0.015em] text-balance">
                    Setiap laporan bergerak sampai tuntas
                  </h2>
                  <p className="text-r-on-dark-soft mt-3 max-w-[46ch] text-[15px] leading-[1.6] text-pretty sm:text-[17px]">
                    Bukan kotak surat. Empat status yang sama dipakai pelapor,
                    pengelola, dan teknisi — tidak ada tiket yang hilang di
                    percakapan pribadi.
                  </p>

                  <div className="text-r-on-dark-soft mt-6 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-[13.5px] leading-relaxed sm:mt-8 sm:text-[14px]">
                    <p className="font-medium text-white">
                      Sistem penyaringan mandiri
                    </p>
                    <p className="mt-1 text-pretty">
                      Setiap tiket melalui validasi pengelola sebelum diteruskan
                      ke teknisi agar fasilitas darurat selalu diprioritaskan.
                    </p>
                  </div>
                </div>

                <ol className="relative isolate flex flex-col">
                  {/* Rel progres hijau emerald terisi kontinu saat di-scroll */}
                  <div
                    aria-hidden="true"
                    className="motion-alur-rail pointer-events-none absolute top-5 bottom-12 left-[17px] z-0 w-[2px] rounded-full bg-gradient-to-b from-[#4ADE80] via-[#22C55E] to-[#E8812F] sm:left-[19px]"
                  />
                  {[
                    {
                      no: '01',
                      status: 'Menunggu verifikasi',
                      isi: 'Laporan masuk antrean pengelola. Duplikat dan laporan tanpa bukti disaring sebelum jadi tiket resmi.',
                      cabang:
                        'Cabang keluar: jika tidak valid, status berubah menjadi Ditolak dan tiket langsung diarsipkan.',
                    },
                    {
                      no: '02',
                      status: 'Valid',
                      isi: 'Lokasi, kategori, dan urgensi dikunci. Tiket mendapatkan nomor unik dan masuk kalkulasi beban kerja tim.',
                    },
                    {
                      no: '03',
                      status: 'Diproses',
                      isi: 'Teknisi pemilik tiket bekerja di lapangan; pelapor dapat memantau pergerakan status secara langsung.',
                    },
                    {
                      no: '04',
                      status: 'Selesai',
                      isi: 'Pekerjaan ditutup setelah bukti perbaikan diunggah dan kedua belah pihak dapat melihat hasilnya.',
                    },
                  ].map((item, index) => {
                    const isLast = index === 3

                    return (
                      <li
                        key={item.status}
                        className="motion-alur-step relative z-10 flex gap-3.5 pb-5 last:pb-0 sm:gap-5 sm:pb-6"
                      >
                        {/* Garis rel dasar penghubung vertikal */}
                        {!isLast ? (
                          <div
                            aria-hidden="true"
                            className="absolute top-10 bottom-0 left-[17.5px] -z-10 w-px bg-white/15 sm:left-[19.5px]"
                          />
                        ) : (
                          <div
                            aria-hidden="true"
                            className="bg-r-fg pointer-events-none absolute top-9 bottom-0 left-[14px] z-[1] w-2 sm:top-10 sm:left-[16px]"
                          />
                        )}

                        {/* Indikator nomor / status */}
                        <div
                          className={`relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums transition-colors sm:size-10 ${
                            isLast
                              ? 'bg-r-accent text-r-fg shadow-lg shadow-black/20'
                              : 'border border-white/20 bg-[#1B4B3C] text-white'
                          }`}
                        >
                          {isLast ? (
                            <Check className="size-4 stroke-[2.5]" />
                          ) : (
                            item.no
                          )}
                        </div>

                        {/* Kartu status */}
                        <div
                          className={`min-w-0 flex-1 rounded-xl p-3.5 transition-colors sm:p-5 ${
                            isLast
                              ? 'border-r-accent/40 border bg-white/[0.09]'
                              : 'border border-white/10 bg-white/[0.04]'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3
                              className={`text-[16.5px] leading-tight font-semibold sm:text-[20px] ${
                                isLast ? 'text-r-accent-glow' : 'text-white'
                              }`}
                            >
                              {item.status}
                            </h3>
                            {isLast && (
                              <span className="bg-r-accent/20 text-r-accent-glow rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
                                Tahap akhir
                              </span>
                            )}
                          </div>

                          <p className="text-r-on-dark-soft mt-1.5 text-[13.5px] leading-relaxed text-pretty sm:text-[14.5px]">
                            {item.isi}
                          </p>

                          {/* Percabangan khusus untuk verifikasi */}
                          {item.cabang && (
                            <div className="text-r-on-dark-soft/85 mt-3 flex items-start gap-2 border-t border-white/10 pt-2.5 text-[12px] leading-relaxed sm:text-[12.5px]">
                              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-white/40" />
                              <p className="text-pretty">{item.cabang}</p>
                            </div>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </div>
            </div>
          </div>
        </section>

        <section id="lapor" className="scroll-mt-20">
          <div className="mx-auto max-w-[1160px] px-4 pt-14 pb-10 sm:px-7 sm:pt-[clamp(52px,7vw,88px)] sm:pb-[clamp(32px,4vw,48px)]">
            <div className="grid items-start gap-8 sm:gap-[clamp(32px,5vw,72px)] lg:grid-cols-[0.85fr_1.15fr]">
              <div className="lg:sticky lg:top-24">
                <span className="text-r-accent-ink text-xs font-semibold tracking-wider uppercase">
                  Alur Cepat
                </span>
                <h2 className="mt-2 text-[clamp(1.5rem,1rem+2.5vw,2.125rem)] leading-[1.18] font-semibold tracking-[-0.015em] text-balance">
                  Lapor dalam tiga langkah, di bawah satu menit
                </h2>
                <p className="text-r-muted mt-3 max-w-[46ch] text-[15px] leading-[1.6] text-pretty sm:text-[17px]">
                  Tidak perlu aplikasi tambahan. Formulir ini sama dengan yang
                  dipakai mahasiswa dan staf lewat QR di pintu lab, ruang
                  kuliah, dan papan pengumuman.
                </p>

                <ol className="mt-6 grid gap-3.5 sm:mt-8 sm:gap-5">
                  {[
                    {
                      nomor: '01',
                      judul: 'Sebutkan lokasinya',
                      isi: 'Pilih gedung dan ruang — sistem otomatis memetakan teknisi penanggung jawab zona.',
                    },
                    {
                      nomor: '02',
                      judul: 'Pilih kategori & urgensi',
                      isi: 'Menentukan prioritas penanganan: normal, mendesak, atau bahaya keselamatan.',
                    },
                    {
                      nomor: '03',
                      judul: 'Ikuti statusnya',
                      isi: 'Dari verifikasi hingga tuntas — pembaruan status dapat dicek secara transparan.',
                    },
                  ].map((langkah) => (
                    <li
                      key={langkah.nomor}
                      className="border-r-line/60 bg-r-surface/70 flex items-start gap-3.5 rounded-xl border p-3.5 transition-colors sm:gap-4 sm:p-4"
                    >
                      <span className="border-r-line text-r-accent-ink flex size-7 shrink-0 items-center justify-center rounded-md border bg-white font-mono text-[12px] font-bold tabular-nums">
                        {langkah.nomor}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-r-fg text-[15px] leading-snug font-semibold sm:text-[15.5px]">
                          {langkah.judul}
                        </h3>
                        <p className="text-r-muted mt-1 text-[13.5px] leading-relaxed text-pretty sm:text-[14px]">
                          {langkah.isi}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div
                data-ui
                className="motion-form-card bg-r-surface border-r-line rounded-2xl border p-4 shadow-[0_8px_30px_rgb(15,59,46,0.06)] sm:p-8"
              >
                <ReportForm />
              </div>
            </div>
          </div>
        </section>

        <section
          id="cerita"
          className="scroll-mt-20 border-t border-[#DCEAE2] bg-[#F7FAF8]"
        >
          <div className="mx-auto max-w-[1080px] px-4 py-14 sm:px-8 sm:py-[clamp(64px,8vw,108px)]">
            {/* Minimalist Editorial Header */}
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="inline-flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.14em] text-[#146C34] uppercase sm:gap-3 sm:text-[11.5px] lg:text-[#15803D]">
                  <span
                    aria-hidden="true"
                    className="h-px w-5 bg-[#15803D]/55 sm:w-6"
                  />
                  <span>Cerita Pengguna</span>
                </p>
                <h2 className="mt-2.5 text-[clamp(1.5rem,1rem+2.5vw,2.375rem)] leading-[1.15] font-bold tracking-[-0.025em] text-balance text-[#0F3B2E] sm:mt-3">
                  Suara dari lapangan kampus
                </h2>
              </div>
              <p className="shrink-0 font-mono text-[13px] font-medium text-[#58786A] tabular-nums">
                {String(testiIndex + 1).padStart(2, '0')}
                <span className="mx-1.5 text-[#0F3B2E]/25">/</span>
                {String(TESTIMONI.length).padStart(2, '0')}
              </p>
            </div>

            {/* Single Refined Editorial Card (Deep Forest Green) */}
            <figure className="motion-story-card mt-6 rounded-[22px] bg-[#0F3B2E] p-5 text-white shadow-[0_24px_56px_-22px_rgba(15,59,46,0.38)] sm:mt-10 sm:rounded-[28px] sm:p-12 lg:p-16">
              {/* Top Role & Impact Line */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/12 pb-4 sm:gap-3 sm:pb-6">
                <span className="text-[11.5px] font-semibold tracking-[0.06em] text-[#86EFAC] uppercase sm:text-[12.5px]">
                  {TESTIMONI[testiIndex]!.peran}
                </span>
                <span className="text-[12px] font-medium text-white/70 sm:text-[12.5px] sm:text-white/65">
                  {TESTIMONI[testiIndex]!.dampak}
                </span>
              </div>

              {/* Quote Body */}
              <div
                key={testiIndex}
                aria-live="polite"
                className="animate-rise py-6 sm:py-12"
              >
                <blockquote className="text-[19px] leading-[1.48] font-semibold tracking-[-0.015em] text-pretty text-white/95 sm:text-[clamp(22px,2.5vw,32px)] sm:leading-[1.42] sm:tracking-[-0.02em]">
                  “{TESTIMONI[testiIndex]!.quote}”
                </blockquote>
              </div>

              {/* Bottom Attribution & Prev/Next Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/12 pt-5 sm:gap-5 sm:pt-6">
                <figcaption className="min-w-0">
                  <div className="text-[15.5px] font-bold text-white sm:text-[16px]">
                    {TESTIMONI[testiIndex]!.nama}
                  </div>
                  <div className="mt-0.5 text-[13px] text-white/70 sm:text-[13.5px] sm:text-white/65">
                    {TESTIMONI[testiIndex]!.unit}
                  </div>
                </figcaption>

                <div className="flex shrink-0 items-center gap-2.5">
                  <button
                    type="button"
                    aria-label="Cerita sebelumnya"
                    onClick={() =>
                      setTestiIndex(
                        (i) => (i + TESTIMONI.length - 1) % TESTIMONI.length,
                      )
                    }
                    className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-white/5 text-white transition-colors hover:border-white hover:bg-white hover:text-[#0F3B2E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#86EFAC] active:translate-y-px"
                  >
                    <ArrowLeft className="size-4.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Cerita berikutnya"
                    onClick={() =>
                      setTestiIndex((i) => (i + 1) % TESTIMONI.length)
                    }
                    className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-white/5 text-white transition-colors hover:border-white hover:bg-white hover:text-[#0F3B2E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#86EFAC] active:translate-y-px"
                  >
                    <ArrowRight className="size-4.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </figure>
          </div>
        </section>

        <section className="motion-cta-banner bg-r-fg relative isolate overflow-clip py-16 text-center sm:py-[clamp(72px,10vw,120px)]">
          <div aria-hidden="true" className="absolute inset-0 -z-20">
            <img
              src={ctaKampusImage}
              alt=""
              loading="lazy"
              decoding="async"
              className="motion-cta-photo relative -top-[14%] h-[128%] w-full object-cover object-[50%_58%]"
            />
          </div>
          <div
            aria-hidden="true"
            className="rawat-banner-scrim absolute inset-0 -z-10"
          />

          <div className="mx-auto max-w-[640px] px-5 sm:px-7">
            <p className="text-r-accent-glow mb-2 text-[13px] font-semibold sm:text-[13.5px]">
              Mulai dari satu fakultas
            </p>
            <h2 className="text-[clamp(1.5rem,1rem+2.5vw,2.125rem)] leading-[1.2] font-semibold tracking-[-0.015em] text-balance text-white sm:leading-[1.18]">
              Aktifkan satu fakultas, rasakan bedanya dalam sebulan.
            </h2>
            <p className="mx-auto my-3 max-w-[58ch] text-[15px] leading-[1.6] text-pretty text-white/90 sm:text-[17px]">
              Kami siapkan QR per ruang, peta zona, dan daftar PIC teknisi Anda.
              Pelaporan bisa dimulai minggu ini juga.
            </p>
            <Link
              to={(user ? homeFor(user.role) : '/login') as never}
              className="bg-r-accent hover:bg-r-btn-hover text-r-fg mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-transparent px-[22px] py-3 text-[14.5px] font-semibold transition-colors active:translate-y-px sm:mt-8 sm:w-auto"
            >
              Masuk ke sistem
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-r-fg pt-12 pb-6 text-white sm:pt-[56px] sm:pb-5">
        <div className="mx-auto max-w-[1160px] px-4 sm:px-7">
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.2fr] lg:gap-8">
            <div className="col-span-2 lg:col-span-1">
              <div className="mb-3.5 flex items-center gap-2.5">
                <BrandMark />
                <span className="leading-[1.15]">
                  <span className="block text-base font-bold tracking-[-0.01em]">
                    Rawat
                  </span>
                  <span className="text-r-on-dark-soft block text-[10.5px] tracking-[0.02em]">
                    Pelaporan fasilitas
                  </span>
                </span>
              </div>
              <p className="text-r-on-dark-soft max-w-[34ch] text-[13.5px] leading-[1.6] text-pretty">
                Prototipe landing page untuk produk pelaporan fasilitas internal
                — dibangun sebagai bahan evaluasi desain.
              </p>
            </div>

            {[
              {
                judul: 'Produk',
                isi: [
                  ['Layanan', '#layanan'],
                  ['Formulir lapor', '#lapor'],
                  ['Dasbor dampak', '#dampak'],
                ],
              },
              {
                judul: 'Sumber daya',
                isi: [
                  ['Cerita pengguna', '#cerita'],
                  ['Panduan pelapor', '#lapor'],
                ],
              },
              {
                judul: 'Perusahaan',
                isi: [
                  ['Tentang Rawat', '#top'],
                  ['Mitra teknisi', '#cerita'],
                  ['Hubungi kami', '#lapor'],
                ],
              },
            ].map((kolom) => (
              <div key={kolom.judul}>
                <h3 className="mb-3 text-[13px] font-semibold tracking-[0.02em] sm:mb-3.5">
                  {kolom.judul}
                </h3>
                <div className="text-r-on-dark-soft grid gap-2 text-[14px] sm:gap-2.5">
                  {kolom.isi.map(([label, href]) => (
                    <a
                      key={label}
                      href={href}
                      className="inline-flex min-h-8 items-center transition-colors hover:text-white sm:min-h-0"
                    >
                      {label}
                    </a>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <h3 className="mb-3 text-[13px] font-semibold tracking-[0.02em] sm:mb-3.5">
                Kontak piket
              </h3>
              <div className="text-r-on-dark-soft grid gap-2 text-[13.5px] sm:gap-2.5 sm:text-[14px]">
                <span className="break-words">piket@rawat.demo</span>
                <span className="font-mono tabular-nums">(021) 555-0142</span>
                <span>Senin–Jumat · 07.00–21.00</span>
              </div>
            </div>
          </div>

          <div className="border-r-on-dark-line text-r-on-dark-soft mt-10 flex flex-col gap-3 border-t pt-5 text-xs leading-relaxed sm:mt-[56px] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-5">
            <span>
              © 2026 Rawat · prototipe demonstrasi, seluruh angka bersifat
              ilustratif
            </span>
            <span className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <span>
                Foto CTA: Guillermo Arévalo Aucahuasi (CC BY-SA 3.0) &amp;
                Universidade de Brasília (CC BY 2.0), via Wikimedia Commons
              </span>
              <span
                aria-hidden="true"
                className="hidden h-3 w-px bg-white/20 sm:inline-block"
              />
              <span>
                Status API: <ApiStatus />
              </span>
            </span>
          </div>
        </div>
      </footer>

      {/* ===================================================================== */}
      {/* DEEP FOREST GREEN EDITORIAL REPORT MODAL                              */}
      {/* ===================================================================== */}
      {isModalOpen && (
        <div
          id="reportModal"
          className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modalTitle"
        >
          {/* Soft Backdrop */}
          <div
            className="fixed inset-0 bg-[#0a3127]/35 backdrop-blur-[3px]"
            onClick={handleCloseReportModal}
          />

          {/* Modal Container */}
          <div className="animate-modal-in relative z-10 max-h-[calc(100dvh-1.5rem)] w-full max-w-[500px] overflow-y-auto rounded-[24px] border border-[#E5ECE8] bg-white p-5 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-[28px] sm:p-7">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF3F0] px-3 py-1 text-[11px] font-semibold text-[#0d3f31]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E86A33]" />
                  Laporan Cepat
                </span>
                <h3
                  id="modalTitle"
                  className="mt-2.5 text-[20px] font-bold tracking-[-0.03em] text-[#0d3f31] sm:text-[22px]"
                >
                  Buat Laporan{' '}
                  <span className="font-light text-[#6B7C74]">Fasilitas</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseReportModal}
                aria-label="Tutup modal"
                className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#EEF3F0] text-[#6B7C74] transition-colors hover:bg-[#0d3f31] hover:text-white sm:h-9 sm:w-9"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleReportSubmit} className="mt-5 space-y-4">
              {/* Category Pills */}
              <div>
                <label className="mb-2 block text-[12px] font-semibold text-[#0d3f31]">
                  Kategori
                </label>
                <div className="flex flex-wrap gap-2">
                  {MODAL_CATEGORIES.map((cat) => {
                    const active = selectedCategory === cat
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`min-h-9 cursor-pointer rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-all ${
                          active
                            ? 'border-[#0d3f31] bg-[#0d3f31] text-white'
                            : 'border-[#DDE6E1] bg-white text-[#6B7C74] hover:border-[#0d3f31]/40 hover:text-[#0d3f31]'
                        }`}
                      >
                        {cat}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Location / Room */}
              <div>
                <label
                  htmlFor="locationField"
                  className="mb-1.5 block text-[12px] font-semibold text-[#0d3f31]"
                >
                  Lokasi / Ruangan
                </label>
                <input
                  id="locationField"
                  ref={locationInputRef}
                  type="text"
                  required
                  value={modalLocation}
                  onChange={(e) => setModalLocation(e.target.value)}
                  placeholder="Contoh: Gedung A • Lt. 3, Ruang Rapat Melati"
                  className="w-full rounded-2xl border border-[#DDE6E1] bg-[#F8FAF9] px-4 py-3 text-[16px] text-[#0d3f31] transition-colors placeholder:text-[#8E9F97] focus:border-[#0d3f31] focus:bg-white focus:outline-none sm:text-[13.5px]"
                />
              </div>

              {/* Priority Level */}
              <div>
                <label className="mb-2 block text-[12px] font-semibold text-[#0d3f31]">
                  Tingkat Prioritas
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {MODAL_PRIORITIES.map((level) => {
                    const active = selectedPriority === level
                    const isUrgent = level === 'Mendesak'
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setSelectedPriority(level)}
                        className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border py-2.5 text-[12.5px] font-medium transition-all ${
                          active
                            ? 'border-[#0d3f31] bg-[#0d3f31] text-white'
                            : 'border-[#DDE6E1] bg-[#F8FAF9] text-[#6B7C74] hover:border-[#0d3f31]/40 hover:text-[#0d3f31]'
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isUrgent
                              ? 'bg-[#E86A33]'
                              : active
                                ? 'bg-emerald-400'
                                : 'bg-[#6B7C74]/50'
                          }`}
                        />
                        <span>{level}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label
                  htmlFor="issueField"
                  className="mb-1.5 block text-[12px] font-semibold text-[#0d3f31]"
                >
                  Deskripsi Singkat
                </label>
                <textarea
                  id="issueField"
                  rows={3}
                  required
                  value={modalIssue}
                  onChange={(e) => setModalIssue(e.target.value)}
                  placeholder="Jelaskan kendala fasilitas secara ringkas agar teknisi dapat segera menindaklanjuti..."
                  className="w-full resize-none rounded-2xl border border-[#DDE6E1] bg-[#F8FAF9] px-4 py-3 text-[16px] text-[#0d3f31] transition-colors placeholder:text-[#8E9F97] focus:border-[#0d3f31] focus:bg-white focus:outline-none sm:text-[13.5px]"
                />
              </div>

              {/* Validation Error Message */}
              {modalError && (
                <p className="rounded-xl bg-red-50 px-3.5 py-2 text-[12px] font-medium text-red-700">
                  {modalError}
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse gap-2.5 pt-2 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={handleCloseReportModal}
                  className="min-h-11 w-full cursor-pointer rounded-full border border-[#DDE6E1] bg-white px-5 py-3 text-[13.5px] font-medium text-[#6B7C74] transition-colors hover:bg-[#EEF3F0] hover:text-[#0d3f31] sm:w-auto sm:text-[13px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#0d3f31] px-6 py-3 text-[13.5px] font-medium text-white transition-all hover:bg-[#0a3127] active:scale-[0.98] sm:w-auto sm:text-[13px]"
                >
                  <span>Kirim Laporan</span>
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 17 17 7m0 0H8m9 0v9"
                    />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* FLOATING DEEP FOREST GREEN TOAST CONTAINER                            */}
      {/* ===================================================================== */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom,0px))] z-50 flex flex-col items-stretch gap-2.5 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="animate-toast-up pointer-events-auto flex max-w-md items-center gap-2.5 rounded-2xl bg-[#0d3f31] px-4 py-3 text-[12.5px] font-medium text-white shadow-2xl sm:rounded-full sm:px-5"
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#E86A33]" />
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
