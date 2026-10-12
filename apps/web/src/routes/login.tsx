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
// LATAR HIJAU — efek senter dari atas.
// Diurutkan dari ATAS ke BAWAH, jadi array paling awal = paling depan.
// Angka 0.5 = gelap, 1.0 = hitam pekat.
// ============================================================
const latarBelakang = {
  backgroundColor: '#011a14',
  backgroundImage: [
    // 1. vignette — nerapin gelap di tepi & bawah (paling depan)
    'radial-gradient(85% 75% at 50% 8%, rgba(1,20,15,0) 30%, rgba(1,20,15,0.5) 65%, rgba(0,10,8,0.95) 100%)',
    // 2. inti senter — pusat cahaya paling terang
    'radial-gradient(38% 34% at 47% 0%, rgba(110,231,183,0.5) 0%, rgba(110,231,183,0) 70%)',
    // 3. pancaran luas — sebaran cahaya ke bawah (paling bawah)
    'radial-gradient(80% 68% at 50% -4%, rgba(16,185,129,0.65) 0%, rgba(16,185,129,0.28) 38%, rgba(16,185,129,0) 78%)',
  ].join(', '),
}

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <main
      className="relative isolate min-h-dvh text-green-50 lg:h-dvh lg:overflow-hidden"
      style={latarBelakang}
    >
      {/* Mobile: flex-col (tumpuk, center). Desktop: 2 kolom */}
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[80rem] flex-col items-center justify-center gap-6 px-6 py-8 sm:px-10 lg:grid lg:h-dvh lg:grid-cols-2 lg:items-center lg:justify-normal lg:gap-12 lg:px-24 lg:py-8">
        {/* ============ Kiri: brand, ilustrasi, highlight ============ */}
        <section className="flex w-full max-w-md flex-col items-center gap-3 text-center lg:max-w-lg lg:items-start lg:text-left">
          <p className="text-[11px] font-medium tracking-[0.25em] text-green-300 uppercase lg:text-[10px]">
            {loginCopy.brand}
          </p>

          {/* Ilustrasi: desktop aja — di mobile bikin kepanjangan */}
          <svg
            aria-hidden="true"
            viewBox="0 0 176 128"
            fill="none"
            className="hidden w-full max-w-[20rem] lg:block lg:h-[44vh] lg:max-h-80 lg:w-auto lg:max-w-full"
          >
            {/* kartu laporan */}
            <rect x="4" y="8" width="132" height="100" rx="14" fill="#ecfdf5" />

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
            <rect x="74" y="68" width="13" height="28" rx="5" fill="#6ee7b7" />
            <rect x="91" y="52" width="13" height="44" rx="5" fill="#34d399" />
            <rect x="108" y="76" width="13" height="20" rx="5" fill="#fbbf24" />
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
            <rect x="130" y="4" width="36" height="36" rx="13" fill="#10b981" />
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

          <h1 className="text-base leading-snug font-bold tracking-tight text-balance lg:text-xl">
            {loginCopy.headline}
          </h1>

          {/* Deskripsi panjang: desktop aja — di mobile bikin scroll */}
          <p className="hidden text-sm leading-relaxed text-green-200/75 sm:text-xs lg:block">
            {loginCopy.description}
          </p>

          <ul className="flex flex-wrap justify-center gap-2 lg:grid lg:grid-cols-3">
            {loginCopy.highlights.map((item) => (
              <li
                key={item}
                className="rounded-full bg-green-900/60 px-3 py-2 text-center text-xs text-green-100"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* ============ Kanan: kartu form ============ */}
        <section className="flex w-full justify-center lg:justify-end">
          <div className="bg-background text-foreground w-full max-w-md rounded-3xl p-6 shadow-2xl ring-1 ring-green-900/10 sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight">Masuk</h2>
            <p className="text-muted-foreground mt-2 mb-6 text-sm">
              Gunakan email atau NIM akun Anda.
            </p>
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  )
}
