import { Activity, ClipboardList, FileUp, UserCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ============================================================
// QNA di Beranda — empat kartu, dua baris (2 + 2).
//
// Isinya sengaja dijawab dari halaman sistem sendiri, bukan dari
// kebijakan yang belum ada di kode: tidak ada janji SLA ("2x24 jam"),
// tidak ada kriteria penolakan karangan. Kalau suatu aturan sudah ada
// di produk, tulis di sini; kalau belum, jangan duluan.
//
// Warna latar kartunya POLA DIAGONAL, bukan selang-seling baris:
//   kiri-atas putih   kanan-atas hijau
//   kiri-bawah hijau  kanan-bawah putih
// Versi sebelumnya berselang per baris, jadi kolom kiri jadi
// putih-putih dan kolom kanan hijau-hijau — polanya kebalik.
//
// Ikonnya watermark di pojok ATAS-KANAN, dan paragrafnya sengaja punya
// gutter kanan (pr-16 / pr-20). Versi 27 Okt ikonnya besar dan nempel
// di pojok kanan-bawah tanpa gutter: garis jawaban justru lewat di
// tengah ikon, jadi teksnya yang repot dibaca. Sekarang kolom teksnya
// berhenti sebelum ikon mulai — dua area tidak pernah tumpang tindih.
// ============================================================

type Tanya = {
  Ikon: LucideIcon
  tanya: string
  jawab: string
  card: string
  warna: string
}

const TANYA: Tanya[] = [
  {
    Ikon: ClipboardList,
    tanya: 'Apa itu Facility Reporting?',
    jawab:
      'Portal untuk melaporkan kerusakan fasilitas kampus. Laporan yang kamu kirim, statusnya, dan penanganannya terpantau di satu tempat.',
    card: 'bg-white',
    warna: '#15803d',
  },
  {
    Ikon: FileUp,
    tanya: 'Bagaimana cara mengirim laporan?',
    jawab:
      'Buka menu Lapor Kerusakan, lalu isi kategori, lokasi, deskripsi, dan foto. Fotonya wajib — JPG, PNG, atau WebP, maksimal 2 MB.',
    card: 'bg-[#edf4f1]',
    warna: '#0d3f31',
  },
  {
    Ikon: Activity,
    tanya: 'Bagaimana melacak statusnya?',
    jawab:
      'Setiap laporan melewati Menunggu Verifikasi → Valid → Diproses → Selesai. Rinciannya ada di halaman Riwayat Laporan.',
    card: 'bg-[#edf4f1]',
    warna: '#1d6f92',
  },
  {
    Ikon: UserCheck,
    tanya: 'Siapa yang memproses laporannya?',
    jawab:
      'Laporan diverifikasi admin kampus sebelum diteruskan ke pengelola fasilitas. Setiap perubahan statusnya tercatat dan bisa kamu lihat sendiri.',
    card: 'bg-white',
    warna: '#a16207',
  },
]

export function DashboardFaq() {
  return (
    <section aria-label="Tanya jawab seputar sistem">
      <header>
        <h2 className="text-[15px] font-semibold tracking-tight text-neutral-900">
          Tanya seputar sistem
        </h2>
        <p className="mt-0.5 text-xs text-neutral-400">
          Empat pertanyaan yang paling sering muncul.
        </p>
      </header>

      {/* sm:grid-cols-2 → tepat dua baris berisi dua kartu, sesuai
          permintaan; di bawah sm kartunya menumpuk satu kolom. */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2 sm:gap-4">
        {TANYA.map(({ Ikon, tanya, jawab, card, warna }) => (
          <article
            key={tanya}
            className={`relative overflow-hidden rounded-3xl border border-black/5 p-5 shadow-[0_1px_2px_rgba(16,24,20,0.05)] ${card}`}
          >
            {/* Aksen ikon: kecil, kepotong tepi kartu, cuma nyisain
                sudutnya. Gutter teks di bawah yang bikin aman. */}
            <Ikon
              aria-hidden="true"
              className="pointer-events-none absolute -top-5 -right-5 size-20 rotate-12 sm:size-24"
              style={{ color: warna }}
              fill="currentColor"
              fillOpacity={0.09}
              strokeOpacity={0.17}
              strokeWidth={1.5}
            />

            <div className="relative pr-16 sm:pr-20">
              <h3 className="text-[15px] leading-snug font-semibold text-neutral-900">
                {tanya}
              </h3>
              <p className="mt-1.5 text-sm leading-[1.7] text-neutral-600">
                {jawab}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
