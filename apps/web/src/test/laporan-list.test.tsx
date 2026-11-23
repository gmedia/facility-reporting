import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'
import { api } from '@/lib/api/client'

// Mock kompresi foto agar pengujian tidak melakukan kompresi sungguhan.
vi.mock('browser-image-compression', () => ({
  default: vi.fn(async (file: File) => file),
}))

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
  return {
    data: body,
    response: new Response(null, { status: 200 }),
  } as never
}

function renderAt(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  })

  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
          },
        })
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
      data: {
        ...satuLaporan[0],
        status: 'diproses',
        updated_at: null,
      },
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

    expect(await daftar.findByText(/gedung h/)).toBeInTheDocument()
    expect(daftar.getByText(/Bangunan/)).toBeInTheDocument()
    expect(daftar.getByText('lampu mati')).toBeInTheDocument()

    const nav = within(
      await screen.findByRole('complementary', {
        name: 'Navigasi admin',
      }),
    )

    expect(nav.getByRole('link', { name: /Verifikasi/ })).toHaveAttribute(
      'aria-current',
      'page',
    )

    expect(
      screen.queryByRole('button', { name: 'Akun' }),
    ).not.toBeInTheDocument()

    expect(daftar.getByText('Menunggu Verifikasi')).toBeInTheDocument()

    expect(screen.queryByText('menunggu_verifikasi')).not.toBeInTheDocument()

    expect(api.GET).toHaveBeenCalledWith('/reports')
  })

  it('menampilkan daftar laporan, filter, dan grafik dari data real', async () => {
    renderAt('/verifikasi')

    expect(
      await screen.findByRole('region', { name: 'Daftar laporan' }),
    ).toBeInTheDocument()

    expect(
      await screen.findByRole('group', { name: 'Filter status' }),
    ).toBeInTheDocument()

    expect(await screen.findByText('Laporan per hari')).toBeInTheDocument()

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
            status: 'diproses',
          },
        ],
      }),
    )

    renderAt('/verifikasi')

    const daftar = await getDaftar()
    await daftar.findByText('lampu mati')

    const filterGroup = await screen.findByRole('group', {
      name: 'Filter status',
    })

    const btnMenunggu = await within(filterGroup).findByRole('button', {
      name: /Menunggu/,
    })

    fireEvent.click(btnMenunggu)

    expect(daftar.getByText('lampu mati')).toBeInTheDocument()
    expect(daftar.queryByText('meja rusak')).not.toBeInTheDocument()

    expect(api.GET).toHaveBeenCalledWith('/reports')
  })

  it('role admin: tandai selesai mengirim foto bukti lewat POST + _method=PATCH', async () => {
    // Laporan harus berstatus diproses sebelum ditandai selesai.
    vi.mocked(api.GET).mockResolvedValue(
      ok({
        data: [
          {
            ...satuLaporan[0],
            status: 'diproses',
          },
        ],
      }),
    )

    vi.mocked(api.POST).mockResolvedValue(
      ok({
        data: {
          ...satuLaporan[0],
          status: 'selesai',
        },
      }),
    )

    renderAt('/verifikasi')

    // Klik item laporan untuk membuka detail panel.
    const daftar = await getDaftar()

    await daftar.findByText('lampu mati')

    fireEvent.click(daftar.getByText('lampu mati'))

    // Buka dialog penyelesaian laporan.
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Tandai selesai',
      }),
    )

    const dialog = within(
      await screen.findByRole('dialog', {
        name: /Selesaikan laporan/,
      }),
    )

    // File contoh untuk pengujian.
    const foto = new File(['x'], 'bukti.jpg', {
      type: 'image/jpeg',
    })

    fireEvent.change(dialog.getByLabelText('Foto bukti penyelesaian'), {
      target: { files: [foto] },
    })

    // Tunggu sampai tombol Tandai selesai muncul setelah kompresi.
    const tombolSelesai = await dialog.findByRole('button', {
      name: 'Tandai selesai',
    })

    await waitFor(() => {
      expect(tombolSelesai).toBeEnabled()
    })

    // Kirim foto bukti penyelesaian.
    fireEvent.click(tombolSelesai)

    await waitFor(() => {
      expect(api.POST).toHaveBeenCalledTimes(1)
    })

    expect(api.PATCH).not.toHaveBeenCalled()

    const [path, options] = vi.mocked(api.POST).mock.calls[0] as unknown as [
      string,
      {
        params: {
          path: {
            laporan: number
          }
        }
        body: FormData
      },
    ]

    expect(path).toBe('/reports/{laporan}/status')
    expect(options.params.path.laporan).toBe(1)
    expect(options.body).toBeInstanceOf(FormData)
    expect(options.body.get('_method')).toBe('PATCH')
    expect(options.body.get('status')).toBe('selesai')
    expect(options.body.get('foto_bukti')).toBeInstanceOf(File)
  })

  it('role admin: verifikasi tanpa foto tetap lewat api.PATCH', async () => {
    vi.mocked(api.PATCH).mockResolvedValue(
      ok({
        data: {
          ...satuLaporan[0],
          status: 'valid',
        },
      }),
    )

    renderAt('/verifikasi')

    const user = userEvent.setup()

    const daftar = await getDaftar()

    await daftar.findByText('lampu mati')

    // Klik baris laporan untuk membuka detail dialog.
    fireEvent.click(daftar.getByText('lampu mati'))

    // Verifikasi tanpa foto.
    await user.click(
      await screen.findByRole('button', {
        name: 'Verifikasi',
      }),
    )

    await waitFor(() => {
      expect(api.PATCH).toHaveBeenCalledTimes(1)
    })

    expect(api.POST).not.toHaveBeenCalled()

    const [path, options] = vi.mocked(api.PATCH).mock.calls[0] as unknown as [
      string,
      {
        params: {
          path: {
            laporan: number
          }
        }
        body: {
          status: string
        }
      },
    ]

    expect(path).toBe('/reports/{laporan}/status')
    expect(options.params.path.laporan).toBe(1)
    expect(options.body.status).toBe('valid')
  })

  it('role user: diarahkan ke /dashboard', async () => {
    currentUser = mahasiswa

    const router = renderAt('/verifikasi')

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/dashboard')
    })

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
            status: 'diproses',
          },
        ],
      }),
    )

    renderAt('/verifikasi')

    const daftar = await getDaftar()

    await daftar.findByText('lampu mati')

    const filterGroup = await screen.findByRole('group', {
      name: 'Filter status',
    })

    fireEvent.click(
      await within(filterGroup).findByRole('button', {
        name: /Menunggu/,
      }),
    )

    expect(daftar.getByText('lampu mati')).toBeInTheDocument()
    expect(daftar.queryByText('meja rusak')).not.toBeInTheDocument()

    fireEvent.click(
      await within(filterGroup).findByRole('button', {
        name: /Terverifikasi/,
      }),
    )

    expect(daftar.queryByText('lampu mati')).not.toBeInTheDocument()
    expect(daftar.queryByText('meja rusak')).not.toBeInTheDocument()

    fireEvent.click(
      await within(filterGroup).findByRole('button', {
        name: /Semua status/,
      }),
    )

    const daftar2 = await getDaftar()

    expect(await daftar2.findByText('lampu mati')).toBeInTheDocument()
    expect(await daftar2.findByText('meja rusak')).toBeInTheDocument()
  })

  it('filter tanpa hasil: empty state mengikuti filter aktif', async () => {
    renderAt('/verifikasi')

    const daftar = await getDaftar()

    await daftar.findByText('lampu mati')

    const filterGroup = await screen.findByRole('group', {
      name: 'Filter status',
    })

    fireEvent.click(
      await within(filterGroup).findByRole('button', {
        name: /Terverifikasi/,
      }),
    )

    expect(
      screen.getByText(
        'Tidak ada laporan yang cocok. Ubah filter atau kata kunci.',
      ),
    ).toBeInTheDocument()

    expect(screen.queryByRole('table')).not.toBeInTheDocument()

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Reset filter',
      }),
    )

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
      screen.getByRole('button', {
        name: 'Coba lagi',
      }),
    ).toBeInTheDocument()
  })

  it('data kosong: menampilkan pesan, bukan tabel kosong', async () => {
    vi.mocked(api.GET).mockResolvedValue(ok({ data: [] }))

    renderAt('/verifikasi')

    expect(
      await screen.findByText(/Belum ada laporan di antrian/),
    ).toBeInTheDocument()

    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
