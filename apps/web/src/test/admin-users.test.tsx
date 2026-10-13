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

function renderAdmin() {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/admin'] }),
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
  vi.mocked(api.GET).mockResolvedValue(ok({ data: [superAdmin] }))
  vi.mocked(api.POST).mockResolvedValue(ok({ data: superAdmin }))
  vi.mocked(api.DELETE).mockResolvedValue({
    response: new Response(null, { status: 204 }),
  } as never)
})

describe('dashboard CRUD admin', () => {
  it('menampilkan daftar akun admin', async () => {
    renderAdmin()

    expect(await screen.findByText('Super Admin')).toBeInTheDocument()
    expect(screen.getByText('superadmin@facility.test')).toBeInTheDocument()
    expect(api.GET).toHaveBeenCalledWith('/admin/users')
  })

  it('menampilkan akses ditolak saat bukan super admin', async () => {
    vi.mocked(api.GET).mockResolvedValue(fail(403, 'Forbidden'))
    renderAdmin()

    expect(await screen.findByText('Akses ditolak')).toBeInTheDocument()
  })

  it('menambahkan akun admin baru', async () => {
    renderAdmin()

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
    renderAdmin()

    fireEvent.click(await screen.findByRole('button', { name: 'Hapus' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Ya, hapus' }))

    await waitFor(() =>
      expect(api.DELETE).toHaveBeenCalledWith('/admin/users/{user}', {
        params: { path: { user: 1 } },
      }),
    )
  })
})
