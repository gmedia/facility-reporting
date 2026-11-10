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

let currentUser: Akun = pengelola

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

const satuLaporan = [
  {
    id: 1,
    user_id: 3,
    kategori: 'bangunan',
    lokasi: 'gedung h',
    deskripsi: 'lampu mati',
    foto: null,
    status: 'menunggu_verifikasi',
    created_at: '2026-10-19T12:12:10Z',
    updated_at: '2026-10-19T12:12:10Z',
  },
]

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
  currentUser = pengelola
  vi.mocked(api.GET).mockResolvedValue(ok({ data: satuLaporan }))
  vi.mocked(api.PATCH).mockResolvedValue(
    ok({
      data: { ...satuLaporan[0], status: 'selesai', updated_at: null },
    }),
  )
})

afterEach(() => vi.clearAllMocks())

async function getDaftar() {
  return within(await screen.findByRole('region', { name: 'Daftar laporan' }))
}

describe('halaman /verifikasi', () => {
  it('role admin: menampilkan daftar laporan dari GET /reports', async () => {
    renderAt('/verifikasi')

    const daftar = await getDaftar()
    expect(await daftar.findByText('gedung h')).toBeInTheDocument()
    expect(screen.getByText('Bangunan')).toBeInTheDocument()
    expect(daftar.getByText('lampu mati')).toBeInTheDocument()

    // Shell pengelola menaungi halaman /verifikasi.
    const nav = within(
      await screen.findByRole('complementary', { name: 'Navigasi admin' }),
    )
    expect(nav.getByRole('link', { name: 'Verifikasi' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(
      screen.queryByRole('button', { name: 'Akun' }),
    ).not.toBeInTheDocument()

    // status enum ditampilkan sebagai label, bukan value mentah.
    expect(screen.getByText('Menunggu Verifikasi')).toBeInTheDocument()
    expect(screen.queryByText('menunggu_verifikasi')).not.toBeInTheDocument()

    expect(api.GET).toHaveBeenCalledWith('/reports')
  })

  it('menampilkan daftar laporan, progres, dan grafik dari data real', async () => {
    renderAt('/verifikasi')

    expect(
      screen.getByRole('region', { name: 'Daftar laporan' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Progres laporan')).toBeInTheDocument()
    expect(screen.getByText('Laporan per hari')).toBeInTheDocument()
    expect(api.GET).toHaveBeenCalledWith('/reports')
  })

  it('klik filter statistik menyaring daftar', async () => {
    vi.mocked(api.GET).mockResolvedValue(
      ok({
        data: [
          satuLaporan[0],
          {
            ...satuLaporan[0],
            id: 2,
            kategori: 'furnitur',
            lokasi: 'kelas a',
            deskripsi: 'meja rusak',
            status: 'selesai',
          },
        ],
      }),
    )
    renderAt('/verifikasi')

    const daftar = await getDaftar()
    await daftar.findByText('lampu mati')
    const filterGroup = screen.getByRole('group', { name: 'Filter status' })

    fireEvent.click(
      within(filterGroup).getByRole('button', { name: /Selesai/ }),
    )
    expect(
      within(filterGroup).getByRole('button', { name: /Selesai/ }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(daftar.getByText('meja rusak')).toBeInTheDocument()
    expect(daftar.queryByText('lampu mati')).not.toBeInTheDocument()
    expect(api.GET).toHaveBeenCalledWith('/reports')
  })

  it('role admin: bisa ubah status lewat PATCH', async () => {
    // PR #92: status final tidak boleh diubah. Laporan harus sudah
    // `diproses` baru bisa ditandai `selesai`.
    vi.mocked(api.GET).mockResolvedValue(
      ok({ data: [{ ...satuLaporan[0], status: 'diproses' }] }),
    )
    renderAt('/verifikasi')
    await screen.findByText('gedung h')

    // Klik item laporan untuk membuka detail panel, lalu klik aksi.
    const daftar = await getDaftar()
    await daftar.findByText('lampu mati')
    fireEvent.click(daftar.getByText('lampu mati'))

    fireEvent.click(screen.getByRole('button', { name: 'Tandai selesai' }))

    await waitFor(() => expect(api.PATCH).toHaveBeenCalledTimes(1))

    const [path, options] = vi.mocked(api.PATCH).mock.calls[0] as unknown as [
      string,
      { params: { path: { laporan: number } }; body: { status: string } },
    ]
    expect(path).toBe('/reports/{laporan}/status')
    expect(options.params.path.laporan).toBe(1)
    expect(options.body.status).toBe('selesai')
  })

  it('role user: diarahkan ke /dashboard', async () => {
    currentUser = mahasiswa
    const router = renderAt('/verifikasi')

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/dashboard'),
    )
    expect(screen.queryByText('gedung h')).not.toBeInTheDocument()
  })

  it('filter status menyaring daftar sesuai pilihan', async () => {
    vi.mocked(api.GET).mockResolvedValue(
      ok({
        data: [
          satuLaporan[0],
          {
            ...satuLaporan[0],
            id: 2,
            kategori: 'furnitur',
            lokasi: 'kelas a',
            deskripsi: 'meja rusak',
            status: 'selesai',
          },
        ],
      }),
    )
    renderAt('/verifikasi')

    const daftar = await getDaftar()
    await daftar.findByText('lampu mati')
    const filterGroup = screen.getByRole('group', { name: 'Filter status' })

    fireEvent.click(
      within(filterGroup).getByRole('button', { name: /Menunggu/ }),
    )
    expect(screen.getByText('lampu mati')).toBeInTheDocument()
    expect(daftar.queryByText('meja rusak')).not.toBeInTheDocument()

    fireEvent.click(
      within(filterGroup).getByRole('button', { name: /Selesai/ }),
    )
    expect(screen.getByText('meja rusak')).toBeInTheDocument()
    expect(daftar.queryByText('lampu mati')).not.toBeInTheDocument()

    fireEvent.click(within(filterGroup).getByRole('button', { name: /Semua/ }))
    expect(screen.getByText('lampu mati')).toBeInTheDocument()
    expect(screen.getByText('meja rusak')).toBeInTheDocument()
  })

  it('filter tanpa hasil: empty state mengikuti filter aktif', async () => {
    renderAt('/verifikasi')

    const daftar = await getDaftar()
    await daftar.findByText('lampu mati')
    const filterGroup = screen.getByRole('group', { name: 'Filter status' })

    fireEvent.click(
      within(filterGroup).getByRole('button', { name: /Terverifikasi/ }),
    )

    expect(
      screen.getByText(
        'Tidak ada laporan yang cocok. Ubah filter atau kata kunci.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(
      within(filterGroup).getByRole('button', { name: /Semua/ }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Reset filter' }))
    expect(await daftar.findByText('lampu mati')).toBeInTheDocument()
  })

  it('loading state: menampilkan pesan memuat', async () => {
    vi.mocked(api.GET).mockReturnValue(new Promise(() => {}) as never)
    renderAt('/verifikasi')

    expect(await screen.findByText('Memuat laporan…')).toBeInTheDocument()
  })

  it('error state: menampilkan pesan dan tombol coba lagi', async () => {
    vi.mocked(api.GET).mockRejectedValue(new Error('jaringan putus'))
    renderAt('/verifikasi')

    expect(
      await screen.findByText('Gagal memuat daftar laporan.'),
    ).toBeInTheDocument()
    expect(screen.getByText('jaringan putus')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Coba lagi' }),
    ).toBeInTheDocument()
  })

  it('data kosong: menampilkan pesan, bukan tabel kosong', async () => {
    vi.mocked(api.GET).mockResolvedValue(ok({ data: [] }))
    renderAt('/verifikasi')

    expect(
      await screen.findByText('Belum ada laporan masuk.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
