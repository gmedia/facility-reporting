// ============================================================
// QNA di Beranda — SATU kartu, empat tanya-jawab dalam grid
// dua kolom.
//
// Isinya sengaja dijawab dari halaman sistem sendiri, bukan dari
// kebijakan yang belum ada di kode: tidak ada janji SLA ("2x24 jam"),
// tidak ada kriteria penolakan karangan. Kalau suatu aturan sudah ada
// di produk, tulis di sini; kalau belum, jangan duluan.
//
// Redesign 9 Nov (#102): versi lama memakai empat kartu terpisah
// dengan latar selang-seling putih/hijau dan ikon watermark besar di
// pojok. Karena ikonnya, paragrafnya dipaksa punya gutter kanan
// (pr-16/pr-20) sehingga barisnya pendek-pendek dan halamannya ramai.
// Sekarang: satu kartu — header di dalam kartu persis seperti
// "Laporan terbaru" di atasnya — dan isinya murni teks tanpa ikon.
// Tiap kolom ±430px ≈ 60-65 karakter per baris, ideal untuk dibaca.
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

export function DashboardFaq() {
  return (
    <section
      aria-label="Tanya jawab seputar sistem"
      className="rounded-3xl border border-black/5 bg-white shadow-[0_1px_2px_rgba(16,24,20,0.05)]"
    >
      <header className="border-b border-black/5 px-5 py-4">
        <h2 className="text-[15px] font-semibold tracking-tight text-neutral-900">
          Tanya seputar sistem
        </h2>
        <p className="mt-0.5 text-xs text-neutral-400">
          Empat pertanyaan yang paling sering muncul.
        </p>
      </header>

      {/* sm:grid-cols-2 → dua kolom dua baris; tanpa ikon dan tanpa
          gutter, jadi teksnya lebar penuh dan tidak putus-putus. */}
      <div className="grid gap-5 px-5 py-5 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-6">
        {TANYA.map(({ tanya, jawab }) => (
          <div key={tanya}>
            <h3 className="text-sm leading-snug font-semibold text-neutral-900">
              {tanya}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">
              {jawab}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
