import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'
import { api } from '@/lib/api/client'

type Role = 'user' | 'admin' | 'super_admin'
type Akun = {
  id: number
  name: string
  nim: string | null
  email: string
  role: Role
}

const pengelola: Akun = {
  id: 2,
  name: 'Admin Demo',
  nim: null,
  email: 'admin@facility.test',
  role: 'admin',
}

const mahasiswa: Akun = {
  id: 3,
  name: 'Mahasiswa Demo',
  nim: '234110601001',
  email: 'mahasiswa@facility.test',
  role: 'user',
}

// Ditukar per test. Dibaca pas query-nya jalan (waktu render), bukan pas
// factory mock-nya dipanggil, jadi aman diganti di dalam `it()`.
let currentUser: Akun = mahasiswa

vi.mock('@/features/auth/auth-query', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/auth/auth-query')>()
  return {
    ...actual,
    meQueryOptions: {
      queryKey: ['me'],
      queryFn: async () => currentUser,
      retry: false,
      staleTime: 0,
    },
  }
})

vi.mock('@/lib/api/client', () => ({
  api: {
    GET: vi.fn(),
    POST: vi.fn(),
    PATCH: vi.fn(),
    PUT: vi.fn(),
    DELETE: vi.fn(),
  },
  initializeCsrf: vi.fn(() => Promise.resolve()),
}))

vi.mock('@/components/ui/sonner', () => ({ Toaster: () => null }))

// Catatan: tidak ada mock DropdownMenu di file ini lagi. Dulu mock itu ada
// karena <AppNav> (topbar) ikut terender di /laporan/saya; sejak AppNav
// dihapus dan halaman user pindah ke sidebar UserShell, tidak ada satu pun
// komponen di rute ini yang nge-render dropdown.

const laporanBaru = {
  id: 10,
  user_id: 3,
  kategori: 'elektronik',
  lokasi: 'perpustakaan lantai 2',
  deskripsi: 'stopkontak meledak',
  foto: null,
  status: 'menunggu_verifikasi',
  created_at: '2026-10-25T09:00:00Z',
  updated_at: '2026-10-25T09:00:00Z',
}

const laporanLama = {
  id: 2,
  user_id: 3,
  kategori: 'bangunan',
  lokasi: 'gedung h',
  deskripsi: 'plafon bocor',
  foto: null,
  status: 'selesai',
  created_at: '2026-10-10T09:00:00Z',
  updated_at: '2026-10-20T09:00:00Z',
}

// Ditambahkan supaya kartu ringkasan "Sudah Ditolak" teruji dengan angka
// selain 0. Kategori `furnitur` dan lokasi `gedung a lantai 1` dipilih
// supaya tidak kena matcher test lain: test status mencari "Elektronik" /
// "Bangunan" (masing-masing harus tetap unik), dan test urutan mencari
// /gedung h|perpustakaan lantai 2/.
const laporanDitolak = {
  id: 7,
  user_id: 3,
  kategori: 'furnitur',
  lokasi: 'gedung a lantai 1',
  deskripsi: 'kursi lipat patah',
  foto: null,
  status: 'ditolak',
  created_at: '2026-10-18T09:00:00Z',
  updated_at: '2026-10-19T09:00:00Z',
}

// Laporan tahun lalu — dipakai tes pemilih tahun: data yang benar-benar
// ada di tahun selain 2026 harus ikut tersedia di daftar opsi tahun.
const laporanTahunLalu = {
  id: 20,
  user_id: 3,
  kategori: 'mekanik',
  lokasi: 'gedung lama',
  deskripsi: 'cat tengkorak dinding ruang tunggu',
  foto: null,
  status: 'selesai',
  created_at: '2025-03-12T09:00:00Z',
  updated_at: '2025-03-12T09:00:00Z',
}

// Laporan dengan prioritas — dipakai tes badge prioritas.
const laporanPrioritasTinggi = {
  id: 30,
  user_id: 3,
  kategori: 'elektronik',
  lokasi: 'gedung baru lantai 1',
  deskripsi: 'proyeger ruang rapat nyala mati',
  foto: null,
  status: 'menunggu_verifikasi',
  prioritas_kategori: 'tinggi',
  skor_prioritas: '4.50',
  created_at: '2026-10-28T09:00:00Z',
  updated_at: '2026-10-28T09:00:00Z',
}

const laporanPrioritasSedang = {
  id: 31,
  user_id: 3,
  kategori: 'furnitur',
  lokasi: 'kantin',
  deskripsi: 'meja kantin legak',
  foto: null,
  status: 'menunggu_verifikasi',
  prioritas_kategori: 'sedang',
  skor_prioritas: '3.20',
  created_at: '2026-10-28T10:00:00Z',
  updated_at: '2026-10-28T10:00:00Z',
}

const laporanPrioritasRendah = {
  id: 32,
  user_id: 3,
  kategori: 'bangunan',
  lokasi: 'toilet depan',
  deskripsi: 'kran bocor kecil',
  foto: null,
  status: 'menunggu_verifikasi',
  prioritas_kategori: 'rendah',
  skor_prioritas: '2.10',
  created_at: '2026-10-28T11:00:00Z',
  updated_at: '2026-10-28T11:00:00Z',
}

const laporanTanpaPrioritas = {
  id: 33,
  user_id: 3,
  kategori: 'lainnya',
  lokasi: 'parkiran sepeda motor',
  deskripsi: 'papan petunjuk pudar',
  foto: null,
  status: 'menunggu_verifikasi',
  prioritas_kategori: null,
  skor_prioritas: null,
  created_at: '2026-10-28T12:00:00Z',
  updated_at: '2026-10-28T12:00:00Z',
}

// Riwayat perubahan status — dipakai tes timeline.
const riwayatValid = {
  id: 100,
  laporan_id: 10,
  status_from: null,
  status_to: 'valid',
  alasan: 'Dokumen dan foto lengkap, verifikasi diterima.',
  changed_by: 2,
  changed_by_name: 'Admin Demo',
  created_at: '2026-10-26T09:00:00Z',
  updated_at: '2026-10-26T09:00:00Z',
}

const riwayatDiproses = {
  id: 101,
  laporan_id: 10,
  status_from: 'valid',
  status_to: 'diproses',
  alasan: 'Teknisi ditugaskan, perbaikan dimulai.',
  changed_by: 2,
  changed_by_name: 'Admin Demo',
  created_at: '2026-10-27T14:30:00Z',
  updated_at: '2026-10-27T14:30:00Z',
}

function ok(body: unknown) {
  return { data: body, response: new Response(null, { status: 200 }) } as never
}

function renderAt(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  render(
    <QueryClientProvider
      // retry dimatikan: default React Query = 3 kali retry dengan backoff
      // eksponensial, jadi state error baru muncul ~7 detik dan test bakal
      // timeout. Di produksi retry-nya tetap jalan (bukan urusan test ini).
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

beforeEach(() => {
  vi.clearAllMocks()
  currentUser = mahasiswa
  vi.mocked(api.GET).mockImplementation(async (url: string) => {
    if (url === '/reports') {
      return ok({ data: [laporanBaru, laporanDitolak, laporanLama] })
    }
    if (
      typeof url === 'string' &&
      url.startsWith('/reports/') &&
      url.endsWith('/history')
    ) {
      return ok({ data: [] })
    }
    return ok({ data: [] })
  })
})

afterEach(() => vi.clearAllMocks())

describe('halaman /laporan/saya', () => {
  it('menampilkan riwayat laporan milik mahasiswa dari GET /reports', async () => {
    renderAt('/laporan/saya')

    // Lokasi sengaja dicari pakai regex: di markup dia ada di dalam
    // <span> yang juga memuat "· " sebagai pemisah, jadi matcher persis
    // gak bakal nemu (getByText cuma baca text node langsung).
    expect(await screen.findByText(/perpustakaan lantai 2/)).toBeInTheDocument()
    expect(screen.getByText(/gedung h/)).toBeInTheDocument()
    expect(screen.getByText('stopkontak meledak')).toBeInTheDocument()
    expect(screen.getByText('plafon bocor')).toBeInTheDocument()

    expect(api.GET).toHaveBeenCalledWith('/reports')
  })

  it('status ditampilkan sebagai label, bukan value mentah', async () => {
    renderAt('/laporan/saya')

    // Di-scope ke region daftar: kartu ringkasan di atas memakai label
    // yang sama persis dengan badge ("Selesai", "Ditolak"), jadi query
    // terhadap seluruh halaman bakal nemu dua elemen.
    const daftar = within(
      await screen.findByRole('region', { name: 'Daftar laporan' }),
    )

    expect(await daftar.findByText('Menunggu Verifikasi')).toBeInTheDocument()
    expect(daftar.getByText('Selesai')).toBeInTheDocument()
    expect(screen.queryByText('menunggu_verifikasi')).not.toBeInTheDocument()
  })

  it('kategori ditampilkan sebagai label', async () => {
    renderAt('/laporan/saya')

    expect(await screen.findByText('Elektronik')).toBeInTheDocument()
    expect(screen.getByText('Bangunan')).toBeInTheDocument()
    expect(screen.queryByText('elektronik')).not.toBeInTheDocument()
  })

  it('urutan terbaru di atas', async () => {
    renderAt('/laporan/saya')

    await screen.findByText(/perpustakaan lantai 2/)
    const kartu = screen
      .getAllByText(/gedung h|perpustakaan lantai 2/)
      .map((node) => node.textContent)
    // indeks 0 = kartu pertama di DOM = harus yang terbaru
    expect(kartu[0]).toContain('perpustakaan lantai 2')
  })

  it('menampilkan skeleton, bukan kartu, selagi memuat', async () => {
    // Promise yang tidak pernah selesai = query selalu pending.
    vi.mocked(api.GET).mockReturnValue(new Promise(() => {}) as never)

    renderAt('/laporan/saya')

    expect(
      await screen.findByText('Memuat riwayat laporan...'),
    ).toBeInTheDocument()
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(screen.queryByText('gedung h')).not.toBeInTheDocument()
  })

  it('empty state: belum pernah lapor, dengan ajakan ke /lapor', async () => {
    vi.mocked(api.GET).mockResolvedValue(ok({ data: [] }))

    renderAt('/laporan/saya')

    expect(
      await screen.findByText('Belum ada laporan yang kamu kirim'),
    ).toBeInTheDocument()

    const cta = screen.getByRole('link', { name: 'Laporkan Kerusakan' })
    expect(cta).toHaveAttribute('href', '/lapor')
  })

  it('error state: bisa dicoba lagi', async () => {
    vi.mocked(api.GET).mockResolvedValue({
      data: null,
      response: new Response(null, { status: 500 }),
    } as never)

    renderAt('/laporan/saya')

    expect(
      await screen.findByText('Gagal memuat riwayat laporan.'),
    ).toBeInTheDocument()
  })

  it('menu mahasiswa punya pintu Riwayat Laporan', async () => {
    renderAt('/laporan/saya')

    await screen.findByText(/perpustakaan lantai 2/)
    expect(
      screen.getAllByRole('link', { name: 'Riwayat Laporan' }).length,
    ).toBeGreaterThan(0)
  })

  it('ringkasan lima kartu, dan jumlahnya menjumlah ke total', async () => {
    renderAt('/laporan/saya')
    await screen.findByText(/perpustakaan lantai 2/)

    // Di-scope ke region: label kartu ("Selesai", "Ditolak") sama persis
    // dengan teks badge di daftar bawah, jadi query halaman penuh hasilnya
    // ganda.
    const ringkasan = within(
      await screen.findByRole('region', { name: 'Ringkasan laporan' }),
    )

    // Kartu membingkai label + ikon di div sendiri, jadi `closest('div')`
    // dari label cuma sampai div kepalanya — naik satu tingkat lagi biar
    // yang didapat kartunya, bukan kepalanya.
    const kartu = (label: string) => {
      const kepala = ringkasan.getByText(label).closest('div')
      const kartuEl = kepala?.parentElement
      if (!kartuEl) throw new Error(`kartu ringkasan "${label}" tidak ketemu`)
      return within(kartuEl)
    }

    const angka = (label: string) =>
      Number(kartu(label).getByText(/^\d+$/).textContent)

    // Data uji: 1 menunggu, 1 ditolak, 1 selesai, 0 diproses.
    expect(angka('Total')).toBe(3)
    expect(angka('Menunggu')).toBe(1)
    expect(angka('Diproses')).toBe(0)
    expect(angka('Selesai')).toBe(1)
    expect(angka('Ditolak')).toBe(1)

    // Empat kartu status harus selalu menjumlah ke `total`. Kalau tidak,
    // ada status yang tidak terhitung di kartu mana pun (dulu: ditolak).
    expect(
      angka('Menunggu') +
        angka('Diproses') +
        angka('Selesai') +
        angka('Ditolak'),
    ).toBe(angka('Total'))
  })

  it('kartu total sebaris dengan grafik tahunan, dan totalnya terbaca', async () => {
    renderAt('/laporan/saya')
    await screen.findByText(/perpustakaan lantai 2/)

    expect(screen.getByText('Grafik laporan tahunan')).toBeInTheDocument()

    // Angka besar ada di kartu TOTAL (sebelah kiri); grafik cuma
    // menampilkan ringkasan kecil + angka di deskripsi aksesibelnya.
    const grafik = screen.getByRole('img', {
      name: /Grafik laporan per bulan/,
    })
    expect(screen.getByText('3 laporan terkirim')).toBeInTheDocument()
    expect(grafik.getAttribute('aria-label')).toContain(
      '3 laporan terkirim sepanjang waktu',
    )

    // Sumbu X selalu 12 bulan, walau semua fixture jatuh di Oktober.
    expect(within(grafik).getAllByText('Okt')).toHaveLength(1)
    expect(within(grafik).getAllByText('Jan')).toHaveLength(1)
  })

  it('bisa menyaring daftar per bulan lewat chip', async () => {
    // Satu laporan di September supaya ada dua bulan berisi data untuk
    // dibandingkan — pilihan chipnya sendiri sudah 12 bulan penuh.
    vi.mocked(api.GET).mockResolvedValue(
      ok({
        data: [
          {
            ...laporanBaru,
            id: 1,
            lokasi: 'gedung timur',
            created_at: '2026-09-05T09:00:00Z',
            updated_at: '2026-09-05T09:00:00Z',
          },
          laporanBaru,
        ],
      }),
    )

    renderAt('/laporan/saya')
    await screen.findByText(/perpustakaan lantai 2/)

    // Default: semua bulan tampil.
    expect(screen.getByText('Oktober 2026')).toBeInTheDocument()
    expect(screen.getByText('September 2026')).toBeInTheDocument()

    // Chip nama pendek tanpa tahun ("Okt", bukan "Okt 2026").
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Saring per bulan' })).getByRole(
        'button',
        { name: 'Okt' },
      ),
    )

    expect(screen.getByText('Oktober 2026')).toBeInTheDocument()
    expect(screen.queryByText('September 2026')).not.toBeInTheDocument()

    // "Semua" mengembalikan bulan yang tadi disembunyikan.
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Saring per bulan' })).getByRole(
        'button',
        { name: 'Semua' },
      ),
    )
    expect(screen.getByText('September 2026')).toBeInTheDocument()
  })

  it('memilih tahun menyaring daftar, dan "Semua tahun" mengembalikannya', async () => {
    vi.mocked(api.GET).mockResolvedValue(
      ok({
        data: [laporanBaru, laporanTahunLalu],
      }),
    )

    renderAt('/laporan/saya')
    await screen.findByText(/perpustakaan lantai 2/)

    // Kedua tahun tampil di awal.
    expect(screen.getByText('Oktober 2026')).toBeInTheDocument()
    expect(screen.getByText('Maret 2025')).toBeInTheDocument()

    // Pemilih tahun di baris judul ("Semua tahun" + opsi 2026, 2025).
    const tahun = document.getElementById(
      'daftar-laporan-tahun',
    ) as HTMLSelectElement
    expect(tahun).toBeInTheDocument()

    fireEvent.change(tahun, { target: { value: '2025' } })

    expect(screen.getByText('Maret 2025')).toBeInTheDocument()
    expect(screen.queryByText('Oktober 2026')).not.toBeInTheDocument()

    // Kembali ke "Semua tahun" memunculkan semua lagi.
    fireEvent.change(tahun, { target: { value: '' } })
    expect(screen.getByText('Oktober 2026')).toBeInTheDocument()
    expect(screen.getByText('Maret 2025')).toBeInTheDocument()
  })

  it('bulan tanpa laporan tetap bisa dipilih dan menjawab "tidak ada laporan"', async () => {
    renderAt('/laporan/saya')
    await screen.findByText(/perpustakaan lantai 2/)

    // Semua fixture jatuh di Oktober, jadi Januari pasti kosong. Daftar
    // pilihannya harus memuat 12 bulan — kalau cuma bulan berisi data,
    // bulan kosong seperti ini mustahil dipilih.
    const pilih = () =>
      within(screen.getByRole('group', { name: 'Saring per bulan' }))

    expect(pilih().getAllByRole('button')).toHaveLength(13) // Semua + 12 bulan

    fireEvent.click(pilih().getByRole('button', { name: 'Jan' }))

    expect(screen.getByText('Tidak ada laporan')).toBeInTheDocument()
    expect(
      screen.getByText('Belum ada laporan yang dikirim pada Januari.'),
    ).toBeInTheDocument()
    // Tidak ada judul kelompok yang tersisa — daftarnya memang kosong.
    expect(screen.queryByText('Oktober 2026')).not.toBeInTheDocument()

    fireEvent.click(pilih().getByRole('button', { name: 'Semua' }))
    expect(screen.getByText('Oktober 2026')).toBeInTheDocument()
  })

  it('bulan kosong pada tahun yang dipilih tetap menjawab "tidak ada laporan"', async () => {
    // Hanya ada data Maret 2025; Januari 2025 harus bisa dipilih dan
    // menjawab kosong dengan tegas, bukan daftar yang tiba-tampa hilang.
    vi.mocked(api.GET).mockResolvedValue(ok({ data: [laporanTahunLalu] }))

    renderAt('/laporan/saya')
    await screen.findByText('Maret 2025')

    const tahun = document.getElementById(
      'daftar-laporan-tahun',
    ) as HTMLSelectElement
    fireEvent.change(tahun, { target: { value: '2025' } })

    const pilih = () =>
      within(screen.getByRole('group', { name: 'Saring per bulan' }))
    fireEvent.click(pilih().getByRole('button', { name: 'Jan' }))

    expect(screen.getByText('Tidak ada laporan')).toBeInTheDocument()
    expect(
      screen.getByText('Belum ada laporan yang dikirim pada Januari 2025.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Maret 2025')).not.toBeInTheDocument()

    fireEvent.click(pilih().getByRole('button', { name: 'Semua' }))
    expect(screen.getByText('Maret 2025')).toBeInTheDocument()
  })

  it('kartu laporan menyediakan slot foto, termasuk di dalam detail', async () => {
    renderAt('/laporan/saya')
    await screen.findByText(/perpustakaan lantai 2/)

    // Ketiga fixture `foto: null` → slot cadangan yang tampil, bukan
    // ruang kosong. Ini juga yang bikin tempat fotonya kelihatan sebelum
    // ada fotonya.
    expect(screen.getAllByText('Belum ada foto')).toHaveLength(3)

    const [tombolPertama] = screen.getAllByRole('button', { name: 'Detail' })
    if (!tombolPertama) throw new Error('tombol Detail tidak ditemukan')
    fireEvent.click(tombolPertama)

    // Panel detail punya blok "Foto" (kiri) dan keterangan (kanan),
    // sehingga slotnya jadi keempat.
    expect(screen.getByText('Foto')).toBeInTheDocument()
    expect(screen.getByText('ID Laporan')).toBeInTheDocument()
    expect(screen.getAllByText('Belum ada foto')).toHaveLength(4)
  })

  it('daftar dikelompokkan per bulan', async () => {
    renderAt('/laporan/saya')
    await screen.findByText(/perpustakaan lantai 2/)

    // Ketiga fixture Oktober 2026 → satu kelompok berisi tiga laporan.
    expect(screen.getByText('Oktober 2026')).toBeInTheDocument()
    expect(screen.getByText('3 laporan')).toBeInTheDocument()
  })

  it('tombol Detail memanjangkan kartu, Tutup menutupnya kembali', async () => {
    renderAt('/laporan/saya')
    await screen.findByText(/perpustakaan lantai 2/)

    // Panel detail dirender bersyarat — sebelum diklik benar-benar tidak
    // ada di DOM, bukan cuma disembunyikan lewat CSS.
    expect(screen.queryByText('Kategori')).not.toBeInTheDocument()

    const tombol = screen.getAllByRole('button', { name: 'Detail' })
    expect(tombol.length).toBeGreaterThan(0)
    const pertama = tombol[0]
    if (!pertama) throw new Error('tombol Detail tidak ketemu')
    fireEvent.click(pertama)

    expect(await screen.findByText('Kategori')).toBeInTheDocument()
    expect(screen.getByText('Lokasi')).toBeInTheDocument()
    expect(screen.getByText('Deskripsi')).toBeInTheDocument()
    expect(screen.getByText('Terakhir diperbarui')).toBeInTheDocument()
    expect(screen.getByText('ID Laporan')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tutup' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Tutup' }))
    expect(screen.queryByText('Kategori')).not.toBeInTheDocument()
    // Setelah ditutup semua tombol kembali berlabel "Detail", jadi ambil
    // yang pertama — masih kartu yang sama.
    const [tombolDetail] = screen.getAllByRole('button', { name: 'Detail' })
    if (!tombolDetail) throw new Error('tombol Detail tidak ditemukan')
    expect(tombolDetail).toHaveAttribute('aria-expanded', 'false')
  })

  it('admin di-redirect ke /dashboard', async () => {
    currentUser = pengelola

    const router = renderAt('/laporan/saya')

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/dashboard'),
    )
  })

  it('menampilkan badge prioritas Tinggi pada kartu', async () => {
    vi.mocked(api.GET).mockResolvedValue(ok({ data: [laporanPrioritasTinggi] }))
    renderAt('/laporan/saya')
    await screen.findByText('proyeger ruang rapat nyala mati')
    expect(screen.getByText('Tinggi')).toBeInTheDocument()
  })

  it('menampilkan badge prioritas Sedang pada kartu', async () => {
    vi.mocked(api.GET).mockResolvedValue(ok({ data: [laporanPrioritasSedang] }))
    renderAt('/laporan/saya')
    await screen.findByText('meja kantin legak')
    expect(screen.getByText('Sedang')).toBeInTheDocument()
  })

  it('menampilkan badge prioritas Rendah pada kartu', async () => {
    vi.mocked(api.GET).mockResolvedValue(ok({ data: [laporanPrioritasRendah] }))
    renderAt('/laporan/saya')
    await screen.findByText('kran bocor kecil')
    expect(screen.getByText('Rendah')).toBeInTheDocument()
  })

  it('tidak menampilkan badge prioritas kalau prioritas_kategori null', async () => {
    vi.mocked(api.GET).mockResolvedValue(ok({ data: [laporanTanpaPrioritas] }))
    renderAt('/laporan/saya')
    await screen.findByText('papan petunjuk pudar')
    expect(screen.queryByText('Tinggi')).not.toBeInTheDocument()
    expect(screen.queryByText('Sedang')).not.toBeInTheDocument()
    expect(screen.queryByText('Rendah')).not.toBeInTheDocument()
  })

  it('memuat timeline status saat detail dibuka', async () => {
    vi.mocked(api.GET).mockImplementation(async (url: string) => {
      if (url === '/reports') return ok({ data: [laporanBaru] })
      if (typeof url === 'string' && url.endsWith('/history'))
        return ok({ data: [riwayatValid, riwayatDiproses] })
      return ok({ data: [] })
    })
    renderAt('/laporan/saya')
    await screen.findByText(/perpustakaan lantai 2/)
    const [tombolDetail] = screen.getAllByRole('button', { name: 'Detail' })
    if (!tombolDetail) throw new Error('tombol Detail tidak ditemukan')
    fireEvent.click(tombolDetail)
    await screen.findByText('Riwayat Status')
    await waitFor(() => screen.getAllByText(/Admin Demo/), { timeout: 5000 })
    expect(screen.getByText(/26 Oktober 2026/)).toBeInTheDocument()
    // entri kedua: valid -> diproses
    expect(screen.getByText(/27 Oktober 2026/)).toBeInTheDocument()
    expect(
      screen.getByText('Teknisi ditugaskan, perbaikan dimulai.'),
    ).toBeInTheDocument()
  })

  it('timeline kosong menjawab "Belum ada riwayat perubahan status."', async () => {
    vi.mocked(api.GET).mockImplementation(async (url: string) => {
      if (url === '/reports') return ok({ data: [laporanBaru] })
      if (typeof url === 'string' && url.endsWith('/history'))
        return ok({ data: [] })
      return ok({ data: [] })
    })
    renderAt('/laporan/saya')
    await screen.findByText(/perpustakaan lantai 2/)
    const [tombolDetail] = screen.getAllByRole('button', { name: 'Detail' })
    if (!tombolDetail) throw new Error('tombol Detail tidak ditemukan')
    fireEvent.click(tombolDetail)
    await screen.findByText('Belum ada riwayat perubahan status.')
  })

  it('timeline gagal tidak merusak panel detail', async () => {
    vi.mocked(api.GET).mockImplementation(async (url: string) => {
      if (url === '/reports') return ok({ data: [laporanBaru] })
      if (typeof url === 'string' && url.endsWith('/history'))
        return Promise.reject(new Error('down'))
      return ok({ data: [] })
    })
    renderAt('/laporan/saya')
    await screen.findByText(/perpustakaan lantai 2/)
    const [tombolDetail] = screen.getAllByRole('button', { name: 'Detail' })
    if (!tombolDetail) throw new Error('tombol Detail tidak ditemukan')
    fireEvent.click(tombolDetail)
    await screen.findByText('Riwayat status tidak tersedia saat ini.')
  })
})
