import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'
import { api } from '@/lib/api/client'

type Akun = {
  id: number
  name: string
  nim: string | null
  email: string
  role: 'super_admin'
}

const superAdmin: Akun = {
  id: 1,
  name: 'Super Admin',
  nim: null,
  email: 'superadmin@facility.test',
  role: 'super_admin',
}

const laporan = [
  {
    id: 1,
    user_id: 3,
    kategori: 'bangunan',
    lokasi: 'gedung h',
    deskripsi: 'lampu koridor mati',
    foto: null,
    status: 'menunggu_verifikasi',
    created_at: '2026-10-26T08:00:00Z',
    updated_at: '2026-10-26T08:00:00Z',
  },
  {
    id: 2,
    user_id: 3,
    kategori: 'furnitur',
    lokasi: 'kelas a',
    deskripsi: 'meja kelas rusak',
    foto: null,
    status: 'valid',
    created_at: '2026-10-25T08:00:00Z',
    updated_at: '2026-10-25T08:00:00Z',
  },
  {
    id: 3,
    user_id: 3,
    kategori: 'elektronik',
    lokasi: 'lab 1',
    deskripsi: 'proyektor tidak menyala',
    foto: null,
    status: 'diproses',
    created_at: '2026-10-24T08:00:00Z',
    updated_at: '2026-10-24T08:00:00Z',
  },
  {
    id: 4,
    user_id: 3,
    kategori: 'mekanik',
    lokasi: 'toilet lantai 2',
    deskripsi: 'keran bocor',
    foto: null,
    status: 'selesai',
    created_at: '2026-10-23T08:00:00Z',
    updated_at: '2026-10-23T08:00:00Z',
  },
]

vi.mock('@/features/auth/auth-query', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/auth/auth-query')>()
  return {
    ...actual,
    meQueryOptions: {
      queryKey: ['me'],
      queryFn: async () => superAdmin,
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

function ok(body: unknown) {
  return { data: body, response: new Response(null, { status: 200 }) } as never
}

function renderAt(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.GET).mockResolvedValue(ok({ data: laporan }))
})

afterEach(cleanup)

describe('dashboard pengelola', () => {
  it('menampilkan ringkasan dan antrian dari API dengan shell hijau', async () => {
    renderAt('/dashboard')

    expect(
      await screen.findByRole('heading', { name: 'Halo, Super Admin' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Antrian verifikasi')).toBeInTheDocument()
    expect(screen.getByText('Prioritas')).toBeInTheDocument()
    expect(screen.getByText('Laporan per hari')).toBeInTheDocument()
    expect(screen.getByText('Total 4')).toBeInTheDocument()
    expect(await screen.findByText('lampu koridor mati')).toBeInTheDocument()
    expect(screen.getByText('meja kelas rusak')).toBeInTheDocument()
    expect(api.GET).toHaveBeenCalledWith('/reports')
  })

  it('tab Menunggu memfilter antrian lewat URL', async () => {
    const router = renderAt('/dashboard')

    await screen.findByText('lampu koridor mati')
    fireEvent.click(screen.getByRole('link', { name: 'Menunggu' }))

    await waitFor(() =>
      expect(router.state.location.search).toMatchObject({
        filter: 'menunggu',
      }),
    )
    expect(await screen.findByText('lampu koridor mati')).toBeInTheDocument()
    expect(screen.queryByText('meja kelas rusak')).not.toBeInTheDocument()
  })

  it('state kosong per filter menampilkan pesan yang sesuai', async () => {
    vi.mocked(api.GET).mockResolvedValue(ok({ data: [] }))
    renderAt('/dashboard?filter=terverifikasi')

    expect(
      await screen.findByText('Belum ada laporan yang sudah terverifikasi.'),
    ).toBeInTheDocument()
  })
})
