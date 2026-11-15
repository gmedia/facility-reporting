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
import type { AdminUser } from '@/features/admin/users-query'

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

const superAdmin: AdminUser = {
  id: 1,
  name: 'Super Admin',
  nim: null,
  email: 'superadmin@facility.test',
  role: 'super_admin',
  foto: null,
  active: true,
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

// GET dijawab SESUAI PATH — sejak /admin masuk guard, halaman ini ikut
// manggil GET /auth/me, jadi nggak boleh dibalas data tabel.
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
  vi.mocked(api.POST).mockResolvedValue(ok({ data: superAdmin }))
  vi.mocked(api.DELETE).mockResolvedValue({
    response: new Response(null, { status: 204 }),
  } as never)
  mockGet({
    '/auth/me': () => ok({ data: superAdmin }),
    '/admin/users': () => ok({ data: [superAdmin] }),
  })
})

describe('guard /admin', () => {
  it('mengizinkan super admin membuka /admin', async () => {
    renderAt('/admin')

    expect(await screen.findByText('Super Admin')).toBeInTheDocument()
    expect(api.GET).toHaveBeenCalledWith('/auth/me')
  })

  it('melempar user biasa ke /dashboard', async () => {
    mockGet({
      '/auth/me': () => ok({ data: { ...superAdmin, role: 'user' } }),
      '/admin/users': () => ok({ data: [superAdmin] }),
      '/reports': () => ok({ data: [] }),
    })
    renderAt('/admin')

    expect(
      await screen.findByRole('heading', { name: 'Halo, Super Admin' }),
    ).toBeInTheDocument()
  })

  it('mengarahkan ke /login kalau sesi tidak ada', async () => {
    vi.mocked(api.GET).mockResolvedValue(fail(401, 'Unauthenticated'))
    renderAt('/admin')

    expect(
      await screen.findByRole('heading', { name: 'Masuk' }),
    ).toBeInTheDocument()
  })
})

describe('dashboard CRUD admin', () => {
  it('menampilkan daftar akun admin', async () => {
    renderAt('/admin')

    expect(
      await screen.findByText('superadmin@facility.test'),
    ).toBeInTheDocument()

    const nav = within(
      await screen.findByRole('complementary', { name: 'Navigasi admin' }),
    )
    expect(nav.getByRole('link', { name: 'Akun Admin' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(api.GET).toHaveBeenCalledWith('/admin/users')
  })

  it('menampilkan akses ditolak ketika API menjawab 403', async () => {
    mockGet({
      '/auth/me': () => ok({ data: superAdmin }),
      '/admin/users': () => fail(403, 'Forbidden'),
    })
    renderAt('/admin')

    expect(await screen.findByText('Akses ditolak')).toBeInTheDocument()
  })

  it('menambahkan akun admin baru', async () => {
    renderAt('/admin')

    fireEvent.click(await screen.findByRole('button', { name: 'Tambah akun' }))
    const dialog = await screen.findByRole('dialog')

    fireEvent.change(within(dialog).getByLabelText('Nama'), {
      target: { value: 'Budi Santoso' },
    })
    fireEvent.change(within(dialog).getByLabelText('Email'), {
      target: { value: 'budi@facility.test' },
    })
    fireEvent.change(within(dialog).getByLabelText('Password'), {
      target: { value: 'rahasia123' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Simpan' }))

    await waitFor(() =>
      expect(api.POST).toHaveBeenCalledWith('/admin/users', {
        body: {
          name: 'Budi Santoso',
          email: 'budi@facility.test',
          password: 'rahasia123',
        },
      }),
    )
  })
})

// ============================================================
// Tombol aktif/nonaktif — issue #115
//
// Bug-nya: label & gaya tombol pernah kebalik terhadap status
// (akun aktif justru ditawari "Aktifkan" hijau). Test ini yang
// mencegah kambuh: user aktif WAJIB melihat "Nonaktifkan", user
// nonaktif WAJIB melihat "Aktifkan" — plus dialog konfirmasi dan
// endpoint-nya ikut diverifikasi supaya satu rantai aksi tidak
// mungkin salah lagi.
// ============================================================
describe('tombol aktif/nonaktif akun (#115)', () => {
  const nonaktifUser: AdminUser = {
    id: 2,
    name: 'Akun Nonaktif',
    nim: null,
    email: 'nonaktif@facility.test',
    role: 'user',
    foto: null,
    active: false,
  }

  function mockDuaUser() {
    mockGet({
      '/auth/me': () => ok({ data: superAdmin }),
      '/admin/users': () => ok({ data: [superAdmin, nonaktifUser] }),
    })
  }

  function baris(email: string) {
    return screen.getByText(email).closest('tr') as HTMLElement
  }

  it('user aktif menampilkan tombol Nonaktifkan, bukan Aktifkan', async () => {
    renderAt('/admin')

    expect(
      await screen.findByRole('button', { name: 'Nonaktifkan' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Aktifkan' }),
    ).not.toBeInTheDocument()
  })

  it('user nonaktif menampilkan tombol Aktifkan di barisnya', async () => {
    mockDuaUser()
    renderAt('/admin')

    await screen.findByText('nonaktif@facility.test')
    expect(
      within(baris('nonaktif@facility.test')).getByRole('button', {
        name: 'Aktifkan',
      }),
    ).toBeInTheDocument()
    expect(
      within(baris('nonaktif@facility.test')).queryByRole('button', {
        name: 'Nonaktifkan',
      }),
    ).not.toBeInTheDocument()
  })

  it('dialog konfirmasi mengikuti aksi tombol yang ditekan', async () => {
    mockDuaUser()
    renderAt('/admin')

    fireEvent.click(await screen.findByRole('button', { name: 'Nonaktifkan' }))
    expect(
      await screen.findByText('Nonaktifkan akun Super Admin?'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Ya, nonaktifkan' }),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Batal' }))

    fireEvent.click(await screen.findByRole('button', { name: 'Aktifkan' }))
    expect(
      await screen.findByText('Aktifkan akun Akun Nonaktif?'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Ya, aktifkan' }),
    ).toBeInTheDocument()
  })

  it('mengirim aksi ke endpoint yang benar', async () => {
    vi.mocked(api.PUT).mockResolvedValue(ok({ data: superAdmin }))
    mockDuaUser()
    renderAt('/admin')

    fireEvent.click(await screen.findByRole('button', { name: 'Nonaktifkan' }))
    fireEvent.click(
      await screen.findByRole('button', { name: 'Ya, nonaktifkan' }),
    )
    await waitFor(() =>
      expect(api.PUT).toHaveBeenCalledWith('/admin/users/{user}/deactivate', {
        params: { path: { user: 1 } },
      }),
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Aktifkan' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Ya, aktifkan' }))
    await waitFor(() =>
      expect(api.PUT).toHaveBeenCalledWith('/admin/users/{user}/activate', {
        params: { path: { user: 2 } },
      }),
    )
  })
})
