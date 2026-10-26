import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Check, ChevronDown, Wrench } from 'lucide-react'
import heroKampusImage from '@/assets/landing/hero-kampus.jpg'
import ctaKampusImage from '@/assets/landing/cta-kampus.jpg'
import { homeFor, meQueryOptions } from '@/features/auth/auth-query'
import { statusQueryOptions } from '@/features/status/status-query'

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
    peran: 'Administrasi akademik · Saintek',
    inisial: 'RK',
  },
  {
    quote:
      'Urgensi “bahaya keselamatan” bikin saya dapat telepon piket dalam hitungan menit, bukan shift berikutnya. Itu yang paling terasa bedanya.',
    nama: 'Dimas Prayoga',
    peran: 'Staf laboratorium · Saintek',
    inisial: 'DP',
  },
  {
    quote:
      'Laporan bulanan yang dulu dua hari saya rekap manual, sekarang tinggal ekspor. Rapat pengelola jadi membahas solusi, bukan data.',
    nama: 'Ayu Larasati',
    peran: 'Pengelola fakultas · Saintek',
    inisial: 'AL',
  },
  {
    quote:
      'Teknisi kami bekerja sambil berdiri di ruang panel — formulirnya harus bisa dipakai dengan satu tangan. Ternyata memang dibuat sesederhana itu.',
    nama: 'Hartono Wijaya',
    peran: 'Kepala teknisi · Saintek',
    inisial: 'HW',
  },
  {
    quote:
      'Filter AC tiap lab akhirnya terjadwal, bukan menunggu keluhan. Sejak itu keluhan “ruangan gerah” turun drastis saat praktikum.',
    nama: 'Maya Anggraini',
    peran: 'Dosen · Laboratorium Saintek',
    inisial: 'MA',
  },
  {
    quote:
      'Yang saya butuhkan bukan aplikasi keren, tapi bukti bahwa laporan saya dibaca. Status “Diproses” yang bisa saya cek sendiri itu sudah cukup.',
    nama: 'Reza Alfarizi',
    peran: 'Mahasiswa · Saintek',
    inisial: 'RA',
  },
]

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

function Avatar({ inisial }: { inisial: string }) {
  return (
    <span className="bg-r-sage text-r-fg inline-flex h-[42px] w-[42px] items-center justify-center rounded-full text-[13px] font-semibold">
      {inisial}
    </span>
  )
}

function TestiCard({
  testi,
  featured = false,
  className = '',
}: {
  testi: (typeof TESTIMONI)[number]
  featured?: boolean
  className?: string
}) {
  return (
    <article
      className={`flex h-full flex-col ${
        featured
          ? 'bg-r-fg rounded-[18px] p-[clamp(24px,3vw,38px)] text-white'
          : 'bg-r-beige rounded-[14px] p-6'
      } ${className}`}
    >
      {featured ? (
        <span
          aria-hidden="true"
          className="text-r-accent text-[52px] leading-[0.7] font-semibold"
        >
          “
        </span>
      ) : null}
      <blockquote
        className={
          featured
            ? 'mt-4 text-[clamp(20px,2.1vw,27px)] leading-[1.42] font-medium tracking-[-0.012em]'
            : 'text-[15.5px] leading-[1.62]'
        }
      >
        {testi.quote}
      </blockquote>
      <div
        className={`mt-auto flex items-center gap-3 ${featured ? 'pt-8' : 'pt-5'}`}
      >
        <Avatar inisial={testi.inisial} />
        <div>
          <div
            className={`text-sm font-semibold ${featured ? '' : 'text-r-fg'}`}
          >
            {testi.nama}
          </div>
          <div
            className={
              featured
                ? 'text-r-on-dark-soft text-[12.5px]'
                : 'text-r-muted text-[12.5px]'
            }
          >
            {testi.peran}
          </div>
        </div>
      </div>
    </article>
  )
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

type Ticket = {
  id: string
  kategori: string
  lokasi: string
  sla: string
}

const EMPTY_FORM: FormFields = {
  lokasi: '',
  ruang: '',
  pelapor: '',
  kategori: '',
  urgensi: 'Normal',
  deskripsi: '',
}

function slaFor(urgensi: string): string {
  if (urgensi === 'Bahaya') return '≤ 30 menit — piket keselamatan'
  if (urgensi === 'Mendesak') return '≤ 2 jam — antrean prioritas'
  return '≤ 24 jam — antrean normal'
}

function ticketId(): string {
  const n = Math.floor(1000 + Math.random() * 8999)
  return `RWT-2026-${n}`
}

const FIELD_CLASS =
  'border-r-line bg-r-surface text-r-fg placeholder:text-r-muted/75 focus:border-r-accent-ink focus:shadow-[0_0_0_3px_var(--rawat-accent-soft)] focus:outline-none w-full rounded-lg border px-[13px] py-[11px] min-h-11 text-[14.5px] transition-[border-color,box-shadow]'

function ReportForm() {
  const [form, setForm] = useState<FormFields>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [fotoName, setFotoName] = useState('Belum ada foto dipilih')
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  function setField(name: keyof FormFields, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: false }))
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const next: Record<string, boolean> = {
      lokasi: form.lokasi === '',
      ruang: form.ruang.trim().length < 2,
      pelapor: form.pelapor.trim().length < 2,
      kategori: form.kategori === '',
      deskripsi: form.deskripsi.trim().length < 10,
    }
    setErrors(next)

    const firstError = Object.keys(next).find((key) => next[key])
    if (firstError) {
      const el = document.querySelector<HTMLElement>(
        `[data-field="${firstError}"] input, [data-field="${firstError}"] select, [data-field="${firstError}"] textarea`,
      )
      el?.focus()
      return
    }

    setTicket({
      id: ticketId(),
      kategori: form.kategori,
      lokasi: `${form.lokasi} · ${form.ruang.trim()}`,
      sla: slaFor(form.urgensi),
    })
    window.setTimeout(() => panelRef.current?.focus(), 0)
  }

  function reset() {
    setForm(EMPTY_FORM)
    setErrors({})
    setFotoName('Belum ada foto dipilih')
    setTicket(null)
  }

  if (ticket) {
    return (
      <div
        ref={panelRef}
        role="status"
        aria-live="polite"
        tabIndex={-1}
        className="focus:outline-none"
      >
        <div className="bg-r-fg text-r-surface mb-5 flex h-[46px] w-[46px] items-center justify-center rounded-full">
          <Check className="h-[22px] w-[22px]" aria-hidden="true" />
        </div>
        <p className="text-r-fg text-[19px] font-semibold tracking-[-0.01em]">
          Laporan tercatat.
        </p>
        <p className="text-r-muted mt-1.5 mb-5 text-[14px]">
          Tiket menunggu verifikasi pengelola. Nomor di bawah ini bisa dipakai
          untuk menanyakan progres ke pengelola fakultas.
        </p>
        {[
          { label: 'Nomor tiket', value: ticket.id, mono: true },
          { label: 'Kategori', value: ticket.kategori, mono: false },
          { label: 'Lokasi', value: ticket.lokasi, mono: false },
          { label: 'Target penanganan', value: ticket.sla, mono: false },
        ].map((baris, index) => (
          <div
            key={baris.label}
            className={`border-r-line flex flex-wrap justify-between gap-5 border-b py-3 text-[14px] ${
              index === 0 ? 'mt-5 border-t' : ''
            }`}
          >
            <span className="text-r-muted">{baris.label}</span>
            <span
              className={`text-r-fg font-semibold ${
                baris.mono ? 'font-mono' : ''
              }`}
            >
              {baris.value}
            </span>
          </div>
        ))}
        <button
          type="button"
          onClick={reset}
          className="bg-r-fg hover:bg-r-dark-hover text-r-surface mt-5 min-h-11 w-full rounded-lg px-[22px] py-3 text-[14.5px] font-semibold transition-colors active:translate-y-px"
        >
          Buat laporan lain
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate>
      <p className="text-r-fg text-[19px] font-semibold tracking-[-0.01em]">
        Formulir laporan fasilitas
      </p>
      <p className="text-r-muted mt-1.5 mb-5 text-[14px]">
        Isi singkat saja — teknisi yang menindaklanjuti butuh konteks, bukan
        esai.
      </p>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                  className={`border-r-line text-r-fg peer-checked:border-r-fg peer-checked:bg-r-fg peer-hover:border-r-accent-ink peer-focus-visible:outline-r-accent-ink inline-flex min-h-9 items-center rounded-full border bg-white px-[14px] py-1.5 text-[13.5px] font-medium transition-colors peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 ${
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
              <label key={value} className="relative">
                <input
                  type="radio"
                  name="urgensi"
                  value={value}
                  checked={form.urgensi === value}
                  onChange={() => setField('urgensi', value)}
                  className="peer sr-only"
                />
                <span className="border-r-line text-r-fg peer-checked:border-r-fg peer-checked:bg-r-fg peer-hover:border-r-accent-ink peer-focus-visible:outline-r-accent-ink inline-flex min-h-9 items-center rounded-full border bg-white px-[14px] py-1.5 text-[13.5px] font-medium transition-colors peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2">
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
          <div className="border-r-line bg-r-bg/65 focus-within:outline-r-accent-ink relative flex flex-wrap items-center gap-3 rounded-lg border border-dashed p-3 focus-within:outline-2 focus-within:outline-offset-2">
            <span className="border-r-line text-r-fg inline-flex min-h-9 items-center rounded-lg border bg-white px-[14px] py-1.5 text-[13.5px] font-semibold">
              Pilih foto
            </span>
            <span className="text-r-muted text-[13px]">{fotoName}</span>
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
          Prototipe demonstrasi — laporan tidak dikirim ke sistem mana pun.{' '}
          <Link
            to="/login"
            className="text-r-accent-ink font-semibold underline"
          >
            Masuk untuk laporan nyata
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
    isi: 'AC tidak dingin, filter kotor, exhaust bising, atau su ruangan yang tidak merata.',
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
            className={`focus-visible:outline-r-accent-ink absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform duration-150 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 ${
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
    <section id="layanan" data-reveal className="reveal scroll-mt-20">
      <div className="mx-auto max-w-[1160px] px-7 py-[clamp(52px,7vw,88px)]">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="text-r-accent-ink mb-2 text-[13.5px] font-semibold">
              Layanan
            </p>
            <h2 className="max-w-[22ch] text-[clamp(28px,3.6vw,46px)] leading-[1.1] font-semibold tracking-[-0.02em]">
              Empat jenis masalah yang sering dilaporkan
            </h2>
          </div>
          <p className="text-r-muted max-w-[46ch] text-[17px] leading-[1.6] lg:justify-self-end">
            Setiap kategori punya alur penanganan sendiri: PIC, perkiraan waktu,
            dan checklist penyelesaian yang disepakati pengelola fakultas.
          </p>
        </div>

        <div className="mt-12 grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <DenahGedung zona={zona} onPilih={setZona} />
            <p className="text-r-muted mt-4 text-[13.5px] leading-[1.5]">
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
                  className={`focus-visible:outline-r-accent-ink mb-3 block w-full rounded-[14px] px-5 py-5 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    dipilih ? 'bg-r-beige' : 'hover:bg-r-sage/60'
                  }`}
                >
                  <span className="flex items-baseline gap-3">
                    <span
                      aria-hidden="true"
                      className={`h-2.5 w-2.5 flex-none rounded-full ${
                        dipilih ? 'bg-r-accent' : 'bg-r-fg/25'
                      }`}
                    />
                    <h3 className="text-[clamp(20px,2vw,26px)] leading-[1.15] font-semibold tracking-[-0.015em]">
                      {kategori.judul}
                    </h3>
                  </span>
                  <span className="text-r-muted mt-2 block pl-[22px] text-[14px] leading-[1.5]">
                    PIC {kategori.pic} · {kategori.target}
                  </span>
                  <span className="text-r-fg mt-2.5 block max-w-[52ch] pl-[22px] text-[16px] leading-[1.6]">
                    {kategori.isi}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-6">
          <a
            href="#lapor"
            className="bg-r-fg hover:bg-r-dark-hover text-r-surface inline-flex min-h-11 items-center rounded-lg px-[22px] py-3 text-[14.5px] font-semibold transition-colors active:translate-y-px"
          >
            Lihat cakupan layanan
          </a>
          <p className="text-r-muted max-w-[40ch] text-[16px] leading-[1.6]">
            Di luar empat kategori ini, laporan masuk ke antrean umum dan tetap
            dipantau sampai selesai.
          </p>
        </div>
      </div>
    </section>
  )
}

function useSectionReveal() {
  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('[data-reveal]'),
    )

    const reduced = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (reduced || typeof IntersectionObserver === 'undefined') {
      sections.forEach((section) => section.classList.add('reveal-visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('reveal-visible')
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )

    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])
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
  useSectionReveal()
  const activeSection = useActiveSection()
  const { data: user } = useQuery(meQueryOptions)

  return (
    <div className="bg-r-bg font-jakarta text-r-fg antialiased">
      <header className="border-r-line bg-r-surface/90 sticky top-0 z-40 border-b backdrop-blur-[12px]">
        <div className="flex items-center justify-between gap-5 px-6 py-3 lg:px-8">
          <a href="#top" className="flex items-center gap-2.5">
            <BrandMark />
            <span className="leading-[1.15]">
              <span className="text-r-fg block text-base font-bold tracking-[-0.01em]">
                Rawat
              </span>
              <span className="text-r-muted block text-[10.5px] tracking-[0.02em]">
                Pelaporan fasilitas
              </span>
            </span>
          </a>

          <nav
            aria-label="Navigasi utama"
            className="hidden items-center gap-8 lg:flex"
          >
            {NAV_LINKS.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                aria-current={activeSection === id ? 'true' : undefined}
                className={`py-1.5 text-sm font-medium transition-colors ${
                  activeSection === id
                    ? 'text-r-fg'
                    : 'text-r-muted hover:text-r-fg'
                }`}
              >
                {label}
              </a>
            ))}
          </nav>

          <Link
            to={(user ? homeFor(user.role) : '/login') as never}
            className="bg-r-fg hover:bg-r-dark-hover text-r-surface inline-flex min-h-10 items-center rounded-full px-[18px] py-2 text-sm font-semibold transition-colors active:translate-y-px"
          >
            {user ? 'Buka dashboard' : 'Lapor masalah'}
          </Link>
        </div>
      </header>

      <main id="content">
        <nav
          aria-label="Navigasi bagian"
          className="border-r-line mx-auto flex max-w-[1160px] flex-wrap gap-2 border-b px-6 py-2 lg:hidden"
        >
          {NAV_LINKS.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              aria-current={activeSection === id ? 'true' : undefined}
              className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                activeSection === id
                  ? 'border-r-fg bg-r-fg text-r-surface'
                  : 'border-r-line text-r-muted'
              }`}
            >
              {label}
            </a>
          ))}
        </nav>
        <section
          id="top"
          aria-label="Hero"
          className="bg-r-fg relative isolate grid min-h-[clamp(620px,92svh,1000px)] overflow-hidden pt-[clamp(56px,9vw,120px)] pb-[clamp(72px,10vw,128px)]"
        >
          <div aria-hidden="true" className="absolute inset-0 -z-20">
            <img
              src={heroKampusImage}
              alt=""
              fetchPriority="high"
              decoding="async"
              className="h-full w-full object-cover object-center"
            />
          </div>
          <div
            aria-hidden="true"
            className="rawat-hero-scrim absolute inset-0 -z-10"
          />

          <div className="grid w-full items-end gap-[clamp(28px,4vw,56px)] pr-[clamp(24px,4vw,80px)] pl-[clamp(28px,10vw,180px)] lg:grid-cols-[1.2fr_330px]">
            <div className="max-w-[620px] self-center">
              <p className="text-r-accent-glow mb-2 text-[13.5px] font-semibold">
                Pelaporan fasilitas terpadu
              </p>
              <h1 className="text-[clamp(52px,7vw,104px)] leading-[1.04] font-semibold tracking-[-0.022em] text-white">
                Fasilitas rusak? Cukup satu laporan.
              </h1>
              <p className="text-r-on-dark-soft mt-5 max-w-[46ch] text-[17px] leading-[1.6]">
                Pilih gedung dan ruang, tulis masalahnya, lampirkan foto. Tiket
                langsung masuk ke piket teknisi — Anda memantau statusnya sampai
                selesai.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to={(user ? '/lapor' : '/login') as never}
                  className="bg-r-accent hover:bg-r-btn-hover text-r-fg inline-flex min-h-11 items-center rounded-lg border border-transparent px-[22px] py-3 text-[14.5px] font-semibold transition-colors active:translate-y-px"
                >
                  Buat laporan baru
                </Link>
                <a
                  href="#lapor"
                  className="border-surface inline-flex min-h-11 items-center rounded-lg border px-[22px] py-3 text-[14.5px] font-semibold text-white transition-colors hover:bg-white/15"
                >
                  Lihat cara kerjanya
                </a>
              </div>
            </div>
          </div>
        </section>

        <LayananSection />

        <section id="dampak" data-reveal className="reveal scroll-mt-20">
          <div className="bg-r-fg py-[clamp(52px,7vw,88px)] text-white">
            <div className="mx-auto max-w-[1160px] px-7">
              <div className="grid gap-[clamp(32px,5vw,72px)] lg:grid-cols-[0.85fr_1.15fr]">
                <div className="flex flex-col">
                  <h2 className="text-[clamp(26px,3vw,34px)] leading-[1.18] font-semibold tracking-[-0.015em]">
                    Setiap laporan bergerak sampai tuntas.
                  </h2>
                  <p className="text-r-on-dark-soft mt-3 max-w-[46ch] text-[17px] leading-[1.6]">
                    Bukan kotak surat. Empat status yang sama dipakai pelapor,
                    pengelola, dan teknisi — tidak ada tiket yang hilang di
                    percakapan pribadi.
                  </p>
                  <p className="text-r-on-dark-soft mt-6 max-w-[42ch] text-[15px] leading-[1.6] lg:mt-auto lg:pt-8">
                    <span className="mr-1.5 inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-[13px] font-semibold text-white">
                      Ditolak
                    </span>
                    Satu cabang di tahap verifikasi: laporan tidak valid keluar
                    dari alur dan tidak masuk antrean teknisi.
                  </p>
                </div>

                <ol data-stagger className="grid gap-2">
                  {[
                    [
                      'Menunggu verifikasi',
                      'Laporan masuk antrean pengelola. Duplikat dan laporan tanpa bukti disaring sebelum jadi tiket.',
                    ],
                    [
                      'Valid',
                      'Lokasi, kategori, dan urgensi dikunci. Tiket dapat nomor dan masuk hitungan pengelola.',
                    ],
                    [
                      'Diproses',
                      'Teknisi pemilik tiket bekerja di lapangan; pelapor melihat status yang sama.',
                    ],
                    [
                      'Selesai',
                      'Pekerjaan ditutup setelah pelapor dan pengelola sama-sama melihat hasilnya.',
                    ],
                  ].map(([status, isi], index) => {
                    const akhir = index === 3
                    const tone = [
                      'bg-white/[0.05]',
                      'bg-white/[0.09]',
                      'bg-white/[0.14]',
                      'bg-r-accent',
                    ][index]

                    return (
                      <li
                        key={status}
                        className={`${tone} grid gap-1.5 rounded-[10px] px-5 py-4 sm:min-h-[122px] sm:grid-cols-[1fr_1.1fr] sm:items-center sm:gap-5 sm:px-6 sm:py-5`}
                      >
                        <p
                          className={`${akhir ? 'text-[clamp(22px,2.1vw,28px)]' : 'text-[clamp(19px,1.7vw,23px)]'} leading-[1.15] font-semibold ${
                            akhir ? 'text-r-fg' : 'text-white'
                          }`}
                        >
                          {status}
                        </p>
                        <p
                          className={`text-[15px] leading-[1.5] ${
                            akhir ? 'text-r-fg' : 'text-r-on-dark-soft'
                          }`}
                        >
                          {isi}
                        </p>
                      </li>
                    )
                  })}
                </ol>
              </div>
            </div>
          </div>
        </section>

        <section id="lapor" data-reveal className="reveal scroll-mt-20">
          <div className="mx-auto max-w-[1160px] px-7 py-[clamp(52px,7vw,88px)]">
            <div className="grid items-start gap-[clamp(32px,5vw,72px)] lg:grid-cols-[0.85fr_1.15fr]">
              <div className="lg:sticky lg:top-24">
                <h2 className="text-[clamp(26px,3vw,34px)] leading-[1.18] font-semibold tracking-[-0.015em]">
                  Lapor dalam tiga langkah, di bawah satu menit.
                </h2>
                <p className="text-r-muted mt-3 max-w-[46ch] text-[17px] leading-[1.6]">
                  Tidak perlu aplikasi tambahan. Formulir ini sama dengan yang
                  dipakai mahasiswa dan staf lewat QR di pintu lab, ruang
                  kuliah, dan papan pengumuman.
                </p>

                <ol className="mt-10 grid gap-8">
                  {[
                    {
                      nomor: '1',
                      judul: 'Sebutkan lokasinya',
                      isi: 'Gedung dan ruang — sistem sudah memetakan zona per PIC.',
                    },
                    {
                      nomor: '2',
                      judul: 'Pilih kategori & urgensi',
                      isi: 'Menentukan antrean teknisi: normal, mendesak, atau bahaya keselamatan.',
                    },
                    {
                      nomor: '3',
                      judul: 'Ikuti statusnya',
                      isi: 'Dari menunggu verifikasi sampai selesai — semuanya tercatat.',
                    },
                  ].map((langkah) => (
                    <li
                      key={langkah.nomor}
                      className="grid grid-cols-[1.75rem_1fr] items-baseline gap-4"
                    >
                      <span className="text-r-accent-ink font-mono text-[15px] font-semibold tabular-nums">
                        {langkah.nomor}
                      </span>
                      <div>
                        <h3 className="text-[17px] leading-[1.35] font-semibold">
                          {langkah.judul}
                        </h3>
                        <p className="text-r-muted mt-1 text-[16px] leading-[1.6]">
                          {langkah.isi}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div data-ui className="bg-r-beige rounded-[20px] p-2">
                <div className="bg-r-surface rounded-[14px] p-[clamp(22px,3vw,32px)]">
                  <ReportForm />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="cerita" data-reveal className="reveal scroll-mt-20">
          <div className="mx-auto max-w-[1160px] px-7 py-[clamp(52px,7vw,88px)]">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="text-r-accent-ink mb-2 text-[13.5px] font-semibold">
                  Cerita pengguna
                </p>
                <h2 className="max-w-[24ch] text-[clamp(26px,3vw,34px)] leading-[1.18] font-semibold tracking-[-0.015em]">
                  Dioperasikan oleh tim yang setiap hari menjaga fasilitas
                  kampus.
                </h2>
              </div>
              <div className="lg:max-w-[34ch] lg:text-right">
                <p className="text-r-muted text-[15px] leading-[1.6]">
                  Enam suara dari Saintek — administrasi, laboratorium, teknisi,
                  dosen, sampai mahasiswa.
                </p>
                <p className="text-r-muted mt-2 font-mono text-[11.5px]">
                  kutipan ilustratif untuk demonstrasi
                </p>
              </div>
            </div>

            <div className="mt-12 grid gap-5 lg:grid-cols-12">
              <TestiCard
                testi={TESTIMONI[0]!}
                featured
                className="lg:col-span-7"
              />
              <div className="grid gap-5 lg:col-span-5">
                <TestiCard testi={TESTIMONI[1]!} />
                <TestiCard testi={TESTIMONI[2]!} />
              </div>
              {TESTIMONI.slice(3).map((testi) => (
                <TestiCard
                  key={testi.nama}
                  testi={testi}
                  className="lg:col-span-4"
                />
              ))}
            </div>
          </div>
        </section>

        <section
          data-reveal
          className="reveal bg-r-fg relative isolate overflow-hidden py-[clamp(72px,10vw,120px)] text-center"
        >
          <div aria-hidden="true" className="absolute inset-0 -z-20">
            <img
              src={ctaKampusImage}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover object-[50%_58%]"
            />
          </div>
          <div
            aria-hidden="true"
            className="rawat-banner-scrim absolute inset-0 -z-10"
          />

          <div className="mx-auto max-w-[640px] px-7">
            <p className="text-r-accent-glow mb-2 text-[13.5px] font-semibold">
              Mulai dari satu fakultas
            </p>
            <h2 className="text-[clamp(26px,3vw,34px)] leading-[1.18] font-semibold tracking-[-0.015em] text-white">
              Aktifkan satu fakultas, rasakan bedanya dalam sebulan.
            </h2>
            <p className="mx-auto my-3 max-w-[58ch] text-[17px] leading-[1.6] text-white/90">
              Kami siapkan QR per ruang, peta zona, dan daftar PIC teknisi Anda.
              Pelaporan bisa dimulai minggu ini juga.
            </p>
            <Link
              to={(user ? homeFor(user.role) : '/login') as never}
              className="bg-r-accent hover:bg-r-btn-hover text-r-fg mt-8 inline-flex min-h-11 items-center rounded-lg border border-transparent px-[22px] py-3 text-[14.5px] font-semibold transition-colors active:translate-y-px"
            >
              Masuk ke sistem
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-r-fg pt-[56px] pb-5 text-white">
        <div className="mx-auto max-w-[1160px] px-7">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.2fr]">
            <div>
              <div className="mb-3.5 flex items-center gap-2.5">
                <span className="bg-r-surface text-r-fg flex h-[34px] w-[34px] items-center justify-center rounded-full">
                  <Wrench className="h-[17px] w-[17px]" aria-hidden="true" />
                </span>
                <span className="leading-[1.15]">
                  <span className="block text-base font-bold tracking-[-0.01em]">
                    Rawat
                  </span>
                  <span className="text-r-on-dark-soft block text-[10.5px] tracking-[0.02em]">
                    Pelaporan fasilitas
                  </span>
                </span>
              </div>
              <p className="text-r-on-dark-soft max-w-[30ch] text-[13.5px] leading-[1.6]">
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
                <h3 className="mb-3.5 text-[13px] font-semibold tracking-[0.02em]">
                  {kolom.judul}
                </h3>
                <div className="text-r-on-dark-soft grid gap-2.5 text-[14px]">
                  {kolom.isi.map(([label, href]) => (
                    <a
                      key={label}
                      href={href}
                      className="transition-colors hover:text-white"
                    >
                      {label}
                    </a>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <h3 className="mb-3.5 text-[13px] font-semibold tracking-[0.02em]">
                Kontak piket
              </h3>
              <div className="text-r-on-dark-soft grid gap-2.5 text-[14px]">
                <span>piket@rawat.demo</span>
                <span className="font-mono tabular-nums">(021) 555-0142</span>
                <span>Senin–Jumat · 07.00–21.00</span>
              </div>
            </div>
          </div>

          <div className="border-r-on-dark-line text-r-on-dark-soft mt-[56px] flex flex-wrap justify-between gap-5 border-t pt-5 text-xs">
            <span>
              © 2026 Rawat · prototipe demonstrasi, seluruh angka bersifat
              ilustratif
            </span>
            <span className="flex flex-wrap items-center gap-4">
              <span>
                Foto CTA: Guillermo Arévalo Aucahuasi (CC BY-SA 3.0) &amp;
                Universidade de Brasília (CC BY 2.0), via Wikimedia Commons
              </span>
              <span aria-hidden="true" className="h-3 w-px bg-white/20" />
              <span>
                Status API: <ApiStatus />
              </span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
