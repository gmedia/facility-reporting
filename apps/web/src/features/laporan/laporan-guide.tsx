import { BookOpenIcon, CheckIcon, LightbulbIcon } from 'lucide-react'
import { STATUS_LABEL, type LaporanStatus } from './laporan-query'

// Panel panduan di sisi kanan /lapor. Dipulihkan dari branch
// demo/lapor-plus-fix (PR #50) yang belum sempat merge, lalu disesuaikan:
//   - palet pindah dari gradient emerald ke #0d3f31 (warna identitas
//     halaman user, sama dengan sidebar, hero, dan footer)
//   - entri foto ditulis "Wajib", karena field-nya sudah tidak opsional
//
// Isinya sengaja tipis — panel ini "highlight", bukan artikel. Tiap entri
// sebaris: judul + satu kalimat pendukung.
const HIGHLIGHT = [
  {
    judul: 'Pilih kategori',
    isi: 'Yang paling sesuai dengan jenis kerusakannya.',
  },
  {
    judul: 'Sebut lokasi',
    isi: 'Gedung, lantai, sampai nomor ruang.',
  },
  {
    judul: 'Ceritakan kondisi',
    isi: 'Sudah rusak sejak kapan, dan seberapa mengganggu.',
  },
  {
    judul: 'Lampirkan foto',
    isi: 'Wajib. JPG, PNG, atau WebP, maksimal 2 MB.',
  },
]

// Alur status diambil dari label yang sama dengan badge di daftar riwayat,
// jadi satu sumber kebenaran untuk seluruh aplikasi.
const ALUR: LaporanStatus[] = [
  'menunggu_verifikasi',
  'valid',
  'diproses',
  'selesai',
]

export function LaporanGuide() {
  return (
    <div
      aria-label="Panduan pengisian"
      className="flex h-full flex-col text-white"
    >
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15">
          <BookOpenIcon aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight">
            Panduan singkat
          </p>
          <p className="text-xs text-white/55">
            Empat langkah, sekitar satu menit.
          </p>
        </div>
      </div>

      <ul className="mt-7 flex flex-col gap-4">
        {HIGHLIGHT.map((item) => (
          <li key={item.judul} className="flex gap-3">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-400/25 ring-1 ring-emerald-300/30">
              <CheckIcon aria-hidden="true" className="size-3" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium">{item.judul}</p>
              <p className="text-[13px] leading-snug text-white/60">
                {item.isi}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-8">
        <div className="rounded-3xl bg-white/8 p-4 ring-1 ring-white/12">
          <p className="flex items-center gap-1.5 text-xs text-emerald-300/85">
            <LightbulbIcon aria-hidden="true" className="size-3.5" />
            Alur laporan
          </p>
          <p className="mt-1.5 text-sm leading-snug font-medium">
            {ALUR.map((status) => STATUS_LABEL[status]).join(' → ')}
          </p>
        </div>
      </div>
    </div>
  )
}
