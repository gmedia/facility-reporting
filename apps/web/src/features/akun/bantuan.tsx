import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================
// BANTUAN (QnA) — pindahan dari Beranda (issue #113).
//
// Dulu kartu ini nongol di /dashboard; sekarang jadi bagian ketiga
// halaman Pengaturan (setelah Kelola Akun & Keamanan), supaya Beranda
// fokus ke ringkasan laporan dan pertanyaan jumpa tepat saat user
// membuka halaman pengaturan akun. Judul kartunya ("Bantuan") datang
// dari CardHeader di akun-page, jadi komponen ini HANYA isi accordion.
//
// Isinya sengaja dijawab dari halaman sistem sendiri, bukan dari
// kebijakan yang belum ada di kode: tidak ada janji SLA ("2x24 jam"),
// tidak ada kriteria penolakan karangan. Kalau suatu aturan sudah ada
// di produk, tulis di sini; kalau belum, jangan duluan.
//
// Jawabannya dilipat (accordion): yang tampil cuma empat baris
// pertanyaan, klik untuk membuka, dan hanya SATU jawaban terbuka
// sekaligus supaya tingginya tetap terkendali. Chevron ikut berputar.
// Grid dua kolom dipertahankan supaya lebar jawaban tetap ±430px
// (60-65 karakter/baris), ideal untuk dibaca.
//
// Pola tombolnya mengikuti rekomendasi WAI-ARIA: <h3> membungkus
// <button>, jadi navigasi heading untuk screen reader tetap utuh dan
// state-nya dibaca lewat aria-expanded.
// ============================================================

type Tanya = {
  tanya: string
  jawab: string
}

const TANYA: Tanya[] = [
  {
    tanya: 'Apa itu Facility Reporting?',
    jawab:
      'Portal untuk melaporkan kerusakan fasilitas kampus. Laporan yang kamu kirim, statusnya, dan penanganannya terpantau di satu tempat.',
  },
  {
    tanya: 'Bagaimana cara mengirim laporan?',
    jawab:
      'Buka menu Lapor Kerusakan, lalu isi kategori, lokasi, deskripsi, dan foto. Fotonya wajib — JPG, PNG, atau WebP, maksimal 2 MB.',
  },
  {
    tanya: 'Bagaimana melacak statusnya?',
    jawab:
      'Setiap laporan melewati Menunggu Verifikasi → Valid → Diproses → Selesai. Rinciannya ada di halaman Riwayat Laporan.',
  },
  {
    tanya: 'Siapa yang memproses laporannya?',
    jawab:
      'Laporan diverifikasi admin kampus sebelum diteruskan ke pengelola fasilitas. Setiap perubahan statusnya tercatat dan bisa kamu lihat sendiri.',
  },
]

export function BantuanQna() {
  // Index jawaban yang sedang terbuka; null = semua tertutup (default
  // minim). Cuma satu pada satu waktu — FAQ bukan dokumen referensi,
  // membandingkan dua jawaban sekaligus bukan kasus pemakaian.
  const [terbuka, setTerbuka] = useState<number | null>(null)

  return (
    // Divider antar sel dihitung per indeks supaya logikanya kelihatan:
    // border-t kontainer jadi pemisah dari deskripsi kartu; mobile semua
    // sel kecuali pertama ikut border-t, desktop baris kedua juga, dan
    // kolom kanan dapat border-l. Sel tanpa px sendiri supaya teks
    // pertanyaan sejajar dengan judul kartu di atasnya.
    <div className="mt-4 grid border-t border-black/5 sm:grid-cols-2">
      {TANYA.map(({ tanya, jawab }, i) => {
        const aktif = terbuka === i
        const idJawab = `bantuan-jawab-${i}`

        return (
          <div
            key={tanya}
            className={cn(
              'border-black/5',
              i >= 1 && 'border-t',
              i === 1 && 'sm:border-t-0',
              i % 2 === 1 && 'sm:border-l',
            )}
          >
            <h3 className="text-sm leading-snug font-semibold text-neutral-900">
              <button
                type="button"
                onClick={() => setTerbuka(aktif ? null : i)}
                aria-expanded={aktif}
                aria-controls={aktif ? idJawab : undefined}
                className={cn(
                  'flex w-full cursor-pointer items-center justify-between gap-3 py-3.5 text-left transition-colors hover:bg-black/[0.02]',
                  aktif && 'bg-black/[0.02]',
                )}
              >
                <span>{tanya}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    'size-4 shrink-0 text-neutral-400 transition-transform duration-200',
                    aktif && 'rotate-180 text-[#0d3f31]',
                  )}
                />
              </button>
            </h3>

            {aktif && (
              <p
                id={idJawab}
                className="pb-4 text-sm leading-relaxed text-neutral-600"
              >
                {jawab}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
