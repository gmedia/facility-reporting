import type { Laporan } from './laporan-query'

// ============================================================
// GRAFIK LAPORAN TAHUNAN — garis, bukan batang.
//
// Digambar tangan pakai SVG, bukan library chart. Alasannya cuma satu:
// kebutuhannya satu garis 12 titik dengan angka di atasnya, dan
// menambahkan dependency chart (recharts dll.) berarti menambah
// ~100KB bundle + satu API lagi yang harus dijaga — untuk satu grafik.
//
// viewBox-nya tetap (660×200), lebarnya mengikuti kartu lewat
// `w-full`. Konsekuensinya ikon/teks ikut menskala di layar sempit —
// itu disengaja, supaya grafik tidak pernah pecah atau perlu di-scroll.
//
// Warnanya sengaja bukan "putih + satu garis hijau": ada gradasi isian,
// gradasi garis, latar plot bergradasi, dan titik bulan berjalan amber.
// Satu warna hijau di atas putih bikin grafiknya terbaca seperti tabel
// yang kehilangan barisnya.
// ============================================================

const BULAN = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
]

// Geometri plot, dalam satuan viewBox.
const W = 660
const H = 200
const KIRI = 18
const KANAN = 18
const ATAS = 26
const BAWAH = 170 // baseline / sumbu X
const LABEL_Y = H - 8 // baris nama bulan

const EMERALD = '#059669'
const AMBER = '#f59e0b'

export function GrafikTahunan({ laporans }: { laporans: Laporan[] }) {
  const tahun = new Date().getFullYear()
  const perBulan = new Array<number>(BULAN.length).fill(0)

  for (const laporan of laporans) {
    const tanggal = new Date(laporan.created_at ?? '')
    if (Number.isNaN(tanggal.getTime())) continue
    if (tanggal.getFullYear() !== tahun) continue
    // `noUncheckedIndexedAccess` bikin `perBulan[i]` bertipe
    // `number | undefined`, jadi nilainya dijatuhkan dulu.
    const indeks = tanggal.getMonth()
    perBulan[indeks] = (perBulan[indeks] ?? 0) + 1
  }

  // `maksimum` tidak boleh 0 — kalau semua bulan kosong, garisnya tetap
  // harus ditarik di baseline, bukan dibagi nol jadi NaN.
  const maksimum = Math.max(...perBulan, 1)
  const bulanIni = new Date().getMonth()
  const total = laporans.length
  const totalTahunIni = perBulan.reduce((jumlah, n) => jumlah + n, 0)

  const lebarPlot = W - KIRI - KANAN
  const tinggiPlot = BAWAH - ATAS

  const titik = perBulan.map((jumlah, i) => ({
    jumlah,
    x: KIRI + (i * lebarPlot) / (BULAN.length - 1),
    y: BAWAH - (jumlah / maksimum) * tinggiPlot,
  }))

  const pertama = titik[0]
  const terakhir = titik[titik.length - 1]
  if (!pertama || !terakhir) return null

  const garis = titik.map((t) => `${t.x},${t.y}`).join(' ')
  const area = `M ${pertama.x} ${BAWAH} ${titik
    .map((t) => `L ${t.x} ${t.y}`)
    .join(' ')} L ${terakhir.x} ${BAWAH} Z`
  const kisi = [0, 1, 2, 3, 4].map((k) => ATAS + (k * tinggiPlot) / 4)

  const puncak = perBulan.indexOf(maksimum)
  const bulanPuncak = puncak >= 0 ? (BULAN[puncak] ?? '-') : 'belum ada'

  const keterangan = `Grafik laporan per bulan tahun ${tahun}. ${total} laporan terkirim sepanjang waktu, ${totalTahunIni} di antaranya pada tahun ${tahun}. Bulan dengan laporan terbanyak: ${bulanPuncak} (${maksimum}).`

  return (
    <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,20,0.05)]">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-neutral-900">
            Grafik laporan tahunan
          </h2>
          <p className="mt-0.5 text-xs text-neutral-400">
            Jumlah laporan yang kamu kirim per bulan · {tahun}
          </p>
        </div>

        {/* Total sengaja dibuat kecil, bukan angka besar seperti kartu di
            sebelahnya — kartu TOTAL sudah memegang angka itu, dan dua angka
            besar bersebelahan kelihatan seperti duplikat.
            Teksnya juga tidak boleh persis "N laporan": judul kelompok di
            daftar bawah memakai teks itu, dan kalau identik getByText bakal
            nemu dua elemen. */}
        <div className="text-right">
          <p className="text-sm leading-tight font-semibold text-neutral-900 tabular-nums">
            {total} laporan terkirim
          </p>
          <p className="mt-0.5 text-[11px] text-neutral-400">sepanjang waktu</p>
        </div>
      </header>

      <svg
        role="img"
        aria-label={keterangan}
        viewBox={`0 0 ${W} ${H}`}
        className="mt-4 w-full"
      >
        <defs>
          <linearGradient id="grafik-isi" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.03" />
          </linearGradient>
          <linearGradient id="grafik-garis" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#0d3f31" />
          </linearGradient>
          <linearGradient id="grafik-latar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e9f5ef" />
            <stop offset="100%" stopColor="#fbfefc" />
          </linearGradient>
        </defs>

        {/* latar plot — bikin area grafik terpisah dari kartu putihnya */}
        <rect
          x={KIRI}
          y={ATAS}
          width={lebarPlot}
          height={tinggiPlot}
          rx={12}
          fill="url(#grafik-latar)"
        />

        {/* kisi horizontal */}
        {kisi.map((y) => (
          <line
            key={`h-${y}`}
            x1={KIRI}
            x2={W - KANAN}
            y1={y}
            y2={y}
            stroke="#e7ecea"
          />
        ))}

        {/* kisi vertikal — penanda kolom tiap bulan */}
        {titik.map((t, i) => (
          <line
            key={`v-${i}`}
            x1={t.x}
            x2={t.x}
            y1={ATAS}
            y2={BAWAH}
            stroke="#f0f4f2"
          />
        ))}

        {/* penanda skala: nilai maksimum di kiri atas plot */}
        <text
          x={KIRI + 6}
          y={ATAS - 9}
          className="fill-neutral-400 text-[10px]"
          textAnchor="start"
        >
          {maksimum}
        </text>

        {/* bidang bawah garis */}
        <path d={area} fill="url(#grafik-isi)" />

        {/* garisnya sendiri */}
        <polyline
          points={garis}
          fill="none"
          stroke="url(#grafik-garis)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* titik + angka di atasnya (hanya bulan yang punya laporan) */}
        {titik.map((t, i) => {
          const aktif = i === bulanIni
          return (
            <g key={`titik-${i}`}>
              <circle
                cx={t.x}
                cy={t.y}
                r={aktif ? 6 : 4.5}
                fill={aktif ? AMBER : '#ffffff'}
                stroke={aktif ? '#ffffff' : EMERALD}
                strokeWidth={aktif ? 2.5 : 2.5}
              />
              {aktif && (
                <circle
                  cx={t.x}
                  cy={t.y}
                  r={9.5}
                  fill="none"
                  stroke={AMBER}
                  strokeOpacity={0.35}
                  strokeWidth={3}
                />
              )}
              {t.jumlah > 0 && (
                <text
                  x={t.x}
                  y={t.y - (aktif ? 17 : 14)}
                  textAnchor="middle"
                  className={`text-[10px] font-semibold ${
                    aktif ? 'fill-[#a16207]' : 'fill-[#0d3f31]'
                  }`}
                >
                  {t.jumlah}
                </text>
              )}
            </g>
          )
        })}

        {/* nama bulan — bulan berjalan ditandai lebih tegas */}
        {titik.map((t, i) => (
          <text
            key={BULAN[i] ?? i}
            x={t.x}
            y={LABEL_Y}
            textAnchor="middle"
            className={
              i === bulanIni
                ? 'fill-[#a16207] text-[10px] font-semibold'
                : 'fill-neutral-400 text-[10px]'
            }
          >
            {BULAN[i] ?? ''}
          </text>
        ))}
      </svg>

      {/* legenda — menjelaskan kenapa ada dua warna titik */}
      <div className="mt-2 flex flex-wrap justify-end gap-x-4 gap-y-1 text-[11px] text-neutral-400">
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-[#059669]"
          />
          Laporan per bulan
        </span>
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-[#f59e0b]"
          />
          Bulan berjalan
        </span>
      </div>
    </section>
  )
}
