import { createFileRoute } from '@tanstack/react-router'
import { LoginForm } from '@/features/auth/login-form'

// ============================================================
// GANTI TEKS DI SINI AJA. Struktur & styling di bawah gak usah disentuh.
// ============================================================
const loginCopy = {
  brand: 'Facility Reporting',
  headline: 'Laporkan kerusakan fasilitas kampus dalam hitungan detik',
  description:
    'Sistem pelaporan kerusakan fasilitas yang menghubungkan mahasiswa, teknisi, dan pengelola kampus dalam satu alur. Lapor, lacak progresnya, sampai selesai — tanpa chat berantai.',
  highlights: ['Foto & lokasi', 'Status real time', 'Riwayat laporan'],
}

// ============================================================
// Palet
//   HIJAU_TUA  → panel kiri (dan tombol, biar nyambung)
//   ABU_TERANG → panel kanan
// ============================================================
const HIJAU_TUA = '#0d3f31'
const ABU_TERANG = '#f4f4f5'

// ============================================================
// Lingkaran dekorasi.
//
// ATURAN POSISI (jangan dilanggar, nanti kepotong lagi):
//   • vertikal  → HARUS muat di dalam. Pakai top-* / bottom-* positif.
//   • horizontal→ boleh minus di kiri (bleed ke tepi layar).
//
// Dipakai 2 tempat:
//   • desktop → anak dari layer yang lebarnya persis 50vw (panel hijau)
//   • mobile  → anak dari <section> yang punya bg hijau sendiri
// ============================================================
function LingkaranDekor({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={className}>
      <div className="absolute bottom-6 -left-28 size-[24rem] rounded-full bg-white/[0.05]" />
      <div className="absolute top-10 right-24 size-[16rem] rounded-full bg-white/[0.04]" />
      <div className="absolute top-[46%] right-[14%] size-[7rem] rounded-full bg-white/[0.08]" />
    </div>
  )
}

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <main
      className="relative isolate min-h-dvh lg:h-dvh lg:overflow-hidden"
      style={{ backgroundColor: ABU_TERANG }}
    >
      {/* ===== GARIS SPLIT 50/50 di persis tengah layar (desktop aja) ===== */}
      <div
        aria-hidden="true"
        className="absolute inset-0 hidden lg:block"
        style={{
          backgroundImage: `linear-gradient(to right, ${HIJAU_TUA} 0%, ${HIJAU_TUA} 50%, ${ABU_TERANG} 50%, ${ABU_TERANG} 100%)`,
        }}
      />

      {/* ===== Lingkaran desktop ===== */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden lg:block"
      >
        <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
          <LingkaranDekor className="absolute inset-0" />
        </div>
      </div>

      {/* Mobile: kolom biasa, mulai dari atas (gak di-center).
          Desktop: grid 2 kolom, tengah layar. */}
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[100rem] flex-col px-6 lg:grid lg:h-dvh lg:grid-cols-2 lg:items-center lg:px-0">
        {/* ============ KIRI: panel hijau ============ */}
        <section className="relative -mx-6 overflow-hidden px-6 py-6 text-white lg:mx-0 lg:py-0 lg:pr-24 lg:pl-28">
          {/* panel hijau di mobile (desktop ngandelin gradient main) */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 lg:hidden"
            style={{ backgroundColor: HIJAU_TUA }}
          />

          <LingkaranDekor className="pointer-events-none absolute inset-0 lg:hidden" />

          <div className="relative flex w-full max-w-md flex-col items-start gap-3 lg:max-w-none">
            <p className="text-[11px] font-semibold tracking-[0.25em] text-emerald-300 uppercase lg:text-[10px]">
              {loginCopy.brand}
            </p>

            {/* Ilustrasi: desktop aja — di mobile bikin kepanjangan */}
            <svg
              aria-hidden="true"
              viewBox="0 0 176 128"
              fill="none"
              className="hidden w-full max-w-[20rem] lg:block lg:h-[40vh] lg:max-h-72 lg:w-auto lg:max-w-full"
            >
              {/* kartu laporan */}
              <rect
                x="4"
                y="8"
                width="132"
                height="100"
                rx="14"
                fill="#ecfdf5"
              />

              {/* header aplikasi — ikutin rx="14" kartunya */}
              <path
                d="M4 22A14 14 0 0 1 18 8H122A14 14 0 0 1 136 22V30H4Z"
                fill="#065f46"
              />
              <circle cx="16" cy="19" r="3" fill="#fbbf24" />
              <circle cx="27" cy="19" r="3" fill="#34d399" />
              <circle cx="38" cy="19" r="3" fill="#ffffff" fillOpacity="0.75" />

              {/* baris formulir (mencatat data) */}
              <rect
                x="16"
                y="44"
                width="48"
                height="8"
                rx="4"
                fill="#065f46"
                fillOpacity="0.4"
              />
              <rect
                x="16"
                y="60"
                width="34"
                height="8"
                rx="4"
                fill="#065f46"
                fillOpacity="0.22"
              />
              <rect
                x="16"
                y="76"
                width="42"
                height="8"
                rx="4"
                fill="#065f46"
                fillOpacity="0.22"
              />

              {/* grafik batang (rekap laporan) */}
              <rect
                x="74"
                y="68"
                width="13"
                height="28"
                rx="5"
                fill="#6ee7b7"
              />
              <rect
                x="91"
                y="52"
                width="13"
                height="44"
                rx="5"
                fill="#34d399"
              />
              <rect
                x="108"
                y="76"
                width="13"
                height="20"
                rx="5"
                fill="#fbbf24"
              />
              <rect
                x="70"
                y="96"
                width="54"
                height="5"
                rx="2.5"
                fill="#065f46"
                fillOpacity="0.25"
              />

              {/* badge: buat laporan baru */}
              <rect
                x="130"
                y="4"
                width="36"
                height="36"
                rx="13"
                fill="#10b981"
              />
              <path
                d="M148 14v16M140 22h16"
                stroke="#ffffff"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* badge: kerusakan terdeteksi */}
              <rect
                x="126"
                y="80"
                width="46"
                height="46"
                rx="15"
                fill="#f59e0b"
              />
              <path d="M149 93 162 114H136Z" fill="#064e3b" />
              <rect
                x="147.2"
                y="99"
                width="3.6"
                height="8"
                rx="1.8"
                fill="#fbbf24"
              />
              <circle cx="149" cy="111" r="1.9" fill="#fbbf24" />
            </svg>

            <h1 className="lg:text-1.5xl text-xl leading-[1.25] font-bold tracking-tight text-balance text-white">
              {loginCopy.headline}
            </h1>

            {/* Deskripsi panjang: desktop aja — di mobile bikin scroll */}
            <p className="hidden text-sm leading-relaxed text-emerald-100/75 sm:text-xs lg:block">
              {loginCopy.description}
            </p>

            {/* Pills: selalu 3 kolom rata, TANPA scroll samping,
                jadi gak ada yang kepotong di HP. */}
            <ul className="mt-1 grid w-full grid-cols-3 gap-2 lg:mt-0">
              {loginCopy.highlights.map((item) => (
                <li
                  key={item}
                  className="rounded-full bg-white px-2 py-1.5 text-center text-[11px] leading-tight font-semibold text-[#0d3f31] shadow-[0_4px_10px_-4px_rgba(0,0,0,0.35)] sm:text-xs lg:px-3.5"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ============ KANAN: form TANPA card ============
            Mobile: flex-1 + center → sisa layar dipakai form.
            pb ngikutin safe-area iPhone biar tombol gak mepet bar bawah. */}
        <section className="flex w-full flex-1 flex-col items-start justify-center pt-6 pb-[max(2rem,env(safe-area-inset-bottom))] lg:flex-none lg:justify-start lg:py-0 lg:pr-28 lg:pl-24">
          <div className="w-full max-w-md lg:max-w-none">
            <h2 className="text-foreground text-2xl font-bold tracking-tight">
              Masuk
            </h2>
            <p className="mt-1 text-sm text-neutral-500 lg:mt-2">
              Gunakan email atau NIM akun Anda.
            </p>

            <div className="mt-5 lg:mt-8">
              <LoginForm />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}