import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanup,
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
import type { components } from '@/lib/api/schema'

vi.mock('@/lib/api/client', () => ({
  api: {
    GET: vi.fn(),
    POST: vi.fn(),
    PUT: vi.fn(),
    DELETE: vi.fn(),
  },
  initializeCsrf: vi.fn(() => Promise.resolve()),
}))

vi.mock('@/components/ui/sonner', () => ({ Toaster: () => null }))

type User = components['schemas']['UserResource']
type Laporan = components['schemas']['LaporanResource']

const superAdmin: User = {
  id: 1,
  name: 'Anas Syahrul',
  nim: null,
  email: 'superadmin@facility.test',
  role: 'super_admin',
}

const admin: User = {
  id: 2,
  name: 'Budi Admin',
  nim: null,
  email: 'admin@facility.test',
  role: 'admin',
}

const mahasiswa: User = {
  id: 3,
  name: 'Citra Mahasiswa',
  nim: '12345',
  email: 'citra@facility.test',
  role: 'user',
}

// Contoh laporan — field sesuai LaporanResource (GET /reports).
function laporan(overrides: Partial<Laporan> = {}): Laporan {
  return {
    id: 10335,
    user_id: 4,
    kategori: 'elektronik',
    lokasi: 'Lab 3 Lt.2',
    deskripsi: 'Proyektor mati total sejak pagi.',
    foto: null,
    status: 'menunggu_verifikasi',
    created_at: '2026-10-03T08:30:00Z',
    updated_at: '2026-10-03T08:30:00Z',
    ...overrides,
  }
}

function ok(body: unknown) {
  return { data: body, response: new Response(null, { status: 200 }) } as never
}

function fail(status: number, message: string) {
  return {
    error: { message },
    response: new Response(null, { status }),
  } as never
}

// GET dijawab SESUAI PATH — /verifikasi manggil /auth/me + /reports.
function mockGet(handlers: Record<string, () => unknown>) {
  vi.mocked(api.GET).mockImplementation((async (path: string) => {
    const handler = handlers[path]
    return handler ? handler() : fail(401, 'Unauthenticated')
  }) as never)
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
}

afterEach(cleanup)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('guard /verifikasi', () => {
  it('mengizinkan role admin membuka /verifikasi', async () => {
    mockGet({
      '/auth/me': () => ok({ data: admin }),
      '/reports': () => ok({ data: [laporan()] }),
    })
    renderAt('/verifikasi')

    expect(
      await screen.findByRole('heading', { name: 'Verifikasi' }),
    ).toBeInTheDocument()
  })

  it('mengizinkan super admin membuka /verifikasi', async () => {
    mockGet({
      '/auth/me': () => ok({ data: superAdmin }),
      '/reports': () => ok({ data: [laporan()] }),
    })
    renderAt('/verifikasi')

    expect(
      await screen.findByRole('heading', { name: 'Verifikasi' }),
    ).toBeInTheDocument()
  })

  it('melempar role user biasa ke /dashboard', async () => {
    mockGet({
      '/auth/me': () => ok({ data: mahasiswa }),
      '/reports': () => ok({ data: [] }),
    })
    renderAt('/verifikasi')

    expect(
      await screen.findByRole('heading', { name: 'Halo, Citra Mahasiswa' }),
    ).toBeInTheDocument()
  })

  it('mengarahkan ke /login kalau sesi tidak ada', async () => {
    vi.mocked(api.GET).mockResolvedValue(fail(401, 'Unauthenticated'))
    renderAt('/verifikasi')

    expect(
      await screen.findByRole('heading', { name: 'Masuk' }),
    ).toBeInTheDocument()
  })
})

describe('daftar laporan /verifikasi', () => {
  beforeEach(() => {
    mockGet({
      '/auth/me': () => ok({ data: admin }),
      '/reports': () =>
        ok({
          data: [
            laporan(),
            laporan({
              id: 10256,
              kategori: 'bangunan',
              lokasi: 'Toilet Lt.1',
              deskripsi: 'Keran toilet rusak.',
              status: 'valid',
              created_at: '2026-10-02T10:00:00Z',
            }),
          ],
        }),
    })
  })

  it('menampilkan daftar laporan dari GET /reports', async () => {
    renderAt('/verifikasi')

    expect(
      await screen.findByText('Proyektor mati total sejak pagi.'),
    ).toBeInTheDocument()
    expect(api.GET).toHaveBeenCalledWith('/reports')
  })

  it('menampilkan lokasi, kategori, deskripsi, dan waktu', async () => {
    renderAt('/verifikasi')

    expect(await screen.findByText('Lab 3 Lt.2')).toBeInTheDocument()
    expect(screen.getByText('Elektronik')).toBeInTheDocument()
    expect(
      screen.getByText('Proyektor mati total sejak pagi.'),
    ).toBeInTheDocument()
    // waktu diformat locale id-ID
    expect(screen.getAllByText(/Okt 2026/).length).toBeGreaterThan(0)
  })

  it('menyapu status menunggu_verifikasi dengan badge dan diurutkan paling atas', async () => {
    renderAt('/verifikasi')

    // "Menunggu" juga ada di tab — jadi scope query-nya ke dalem tabel.
    const table = (await screen.findByRole('table')) as HTMLElement
    const badge = within(table).getByText('Menunggu')
    expect(badge).toHaveClass('bg-[#fbe9cc]')
    // antrian: yang menunggu dulu, baru yang sudah ditindak
    const ids = within(table)
      .getAllByRole('row')
      .map((row) => row.textContent ?? '')
      .filter((text) => text.includes('10'))
    expect(ids[0]).toContain('10335')
  })

  it('memfilter lewat tab Menunggu', async () => {
    renderAt('/verifikasi')

    expect(await screen.findByText('Keran toilet rusak.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('link', { name: 'Menunggu' }))

    await waitFor(() => {
      expect(screen.queryByText('Keran toilet rusak.')).not.toBeInTheDocument()
      expect(
        screen.getByText('Proyektor mati total sejak pagi.'),
      ).toBeInTheDocument()
    })
  })
})

describe('state /verifikasi', () => {
  it('menampilkan empty state saat belum ada laporan', async () => {
    mockGet({
      '/auth/me': () => ok({ data: admin }),
      '/reports': () => ok({ data: [] }),
    })
    renderAt('/verifikasi')

    expect(
      await screen.findByText('Belum ada laporan masuk.'),
    ).toBeInTheDocument()
  })

  it('menampilkan akses ditolak ketika API menjawab 403', async () => {
    mockGet({
      '/auth/me': () => ok({ data: admin }),
      '/reports': () => fail(403, 'Forbidden'),
    })
    renderAt('/verifikasi')

    expect(await screen.findByText('Akses ditolak')).toBeInTheDocument()
  })

  it('menampilkan sesi berakhir ketika API menjawab 401', async () => {
    mockGet({
      '/auth/me': () => ok({ data: admin }),
      '/reports': () => fail(401, 'Unauthenticated'),
    })
    renderAt('/verifikasi')

    expect(await screen.findByText('Sesi berakhir')).toBeInTheDocument()
  })
})
