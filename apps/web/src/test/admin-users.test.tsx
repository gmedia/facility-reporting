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
    })
    renderAt('/admin')

    expect(await screen.findByText('Anda masuk sebagai')).toBeInTheDocument()
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

    expect(await screen.findByText('Super Admin')).toBeInTheDocument()
    expect(screen.getByText('superadmin@facility.test')).toBeInTheDocument()
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

  it('menghapus akun admin setelah konfirmasi', async () => {
    renderAt('/admin')

    fireEvent.click(await screen.findByRole('button', { name: 'Hapus' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Ya, hapus' }))

    await waitFor(() =>
      expect(api.DELETE).toHaveBeenCalledWith('/admin/users/{user}', {
        params: { path: { user: 1 } },
      }),
    )
  })
})
