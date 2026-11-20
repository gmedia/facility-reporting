import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Check, ChevronLeft, ShieldCheck, X } from 'lucide-react'

const NOMOR_ADMIN = '08xx-xxxx-xxxx'

const LANGKAH = [
  <>
    Hubungi admin melalui WhatsApp resmi atau datang ke{' '}
    <strong>Kantor adminitrasi fakultas saintek</strong>.
  </>,
  'Tunjukkan KTM atau identitas lain untuk verifikasi.',
  'Admin akan membantu memeriksa dan menyelesaikan kendala Anda.',
]

export function LupaPassword() {
  const [tersalin, setTersalin] = useState(false)

  const salin = async () => {
    try {
      await navigator.clipboard.writeText(NOMOR_ADMIN.replace(/[^\d]/g, ''))
      setTersalin(true)
      setTimeout(() => setTersalin(false), 2000)
    } catch {
      setTersalin(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Kembali */}
      <Link
        to="/login"
        className="inline-flex w-fit items-center gap-1 text-xs font-semibold text-[#0d3f31] hover:underline"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        Kembali ke halaman masuk
      </Link>

      {/* Header */}
      <div>
        <h2 className="text-foreground text-2xl font-bold tracking-tight">
          Pusat Bantuan
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-neutral-500">
          Mengalami kendala saat menggunakan Facility Reporting? Hubungi
          administrator melalui kontak resmi di bawah ini untuk mendapatkan
          bantuan.
        </p>
      </div>

      {/* Kartu kontak admin */}
      <div className="rounded-2xl border border-neutral-200/70 bg-white p-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-[#0d3f31]">
          <ShieldCheck aria-hidden="true" className="size-3.5" />
          Kontak resmi admin
        </span>

        <p className="mt-2 text-xs text-neutral-500">
          WhatsApp admin fakultas saintek
        </p>

        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="text-xl font-bold tracking-wide text-neutral-900">
            {NOMOR_ADMIN}
          </p>

          <button
            type="button"
            onClick={salin}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 px-3 text-xs font-semibold text-[#0d3f31] transition hover:bg-neutral-50"
          >
            {tersalin ? (
              <>
                <Check aria-hidden="true" className="size-3.5" />
                Tersalin
              </>
            ) : (
              'Salin nomor'
            )}
          </button>
        </div>

        <p className="mt-2 text-xs text-neutral-500">
          Atau datang ke{' '}
          <strong className="text-neutral-800">
            Kantor adminitrasi fakultas saintek
          </strong>
          .
        </p>
      </div>

      {/* Layanan bantuan sistem */}
      <div>
        <p className="text-xs font-bold text-neutral-900">
          Layanan bantuan sistem
        </p>

        <ul className="mt-2 flex flex-col gap-1.5 text-xs text-neutral-700">
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-700" />
            Kendala akun dan akses masuk.
          </li>

          <li className="flex items-start gap-2">
            <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-700" />
            Kendala penggunaan fitur sistem.
          </li>

          <li className="flex items-start gap-2">
            <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-700" />
            Error atau gangguan aplikasi.
          </li>

          <li className="flex items-start gap-2">
            <X className="mt-0.5 size-3.5 shrink-0 text-red-600" />
            Laporan kerusakan fasilitas tetap dibuat melalui aplikasi.
          </li>
        </ul>
      </div>

      {/* Alur mendapatkan bantuan */}
      <div className="rounded-2xl border border-neutral-200/70 bg-white p-4">
        <h3 className="text-xs font-bold text-[#0d3f31]">
          Alur mendapatkan bantuan riset password
        </h3>

        <ol className="mt-3 flex flex-col gap-2.5">
          {LANGKAH.map((isi, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#0d3f31] text-[11px] font-bold text-white">
                {i + 1}
              </span>

              <p className="text-xs leading-relaxed text-neutral-700">{isi}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Peringatan keamanan */}
      <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900">
        Admin tidak pernah meminta password Anda melalui chat. Abaikan nomor
        lain yang mengaku sebagai admin.
      </p>
    </div>
  )
}
