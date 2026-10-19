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
  name: 'Anas Syahrul',
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
  vi.mocked(api.GET).mockImplementation((async (path: string) => {
    if (path === '/auth/me') return ok({ data: superAdmin })
    return fail(401, 'Unauthenticated')
  }) as never)
})

describe('dashboard super admin', () => {
  it('menampilkan kartu statistik', async () => {
    renderAt('/admin')

    expect(
      await screen.findByRole('heading', { name: 'Dashboard' }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Menunggu').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Terverifikasi').length).toBeGreaterThan(0)
    expect(screen.getByText('Prioritas tinggi')).toBeInTheDocument()
    expect(screen.getByText('Selesai')).toBeInTheDocument()
  })

  it('menampilkan menu sidebar sesuai super admin', async () => {
    renderAt('/admin')

    // muncul dua kali (sidebar desktop + nav mobile), href harus sama semua
    const hrefOf = async (name: string) =>
      (await screen.findAllByRole('link', { name })).map((link) =>
        link.getAttribute('href'),
      )

    expect(await hrefOf('Dashboard')).toEqual(['/admin', '/admin'])
    expect(await hrefOf('Verifikasi')).toEqual(['/verifikasi', '/verifikasi'])
    expect(await hrefOf('Pengaturan')).toEqual([
      '/admin/pengaturan',
      '/admin/pengaturan',
    ])
    expect(await hrefOf('Statistik')).toEqual([
      '/admin/statistik',
      '/admin/statistik',
    ])
    expect(await hrefOf('Akun Admin')).toEqual(['/admin/akun', '/admin/akun'])

    // /prioritas masih sprint 18 Nov — belum ada di menu siapa pun
    expect(screen.queryByRole('link', { name: 'Prioritas' })).toBeNull()
  })

  it('memfilter antrian lewat tab', async () => {
    renderAt('/admin')

    expect(await screen.findByText('Lampu koridor mati')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('link', { name: 'Terverifikasi' }))

    await waitFor(() => {
      expect(screen.queryByText('Lampu koridor mati')).not.toBeInTheDocument()
      expect(screen.getByText('Keran toilet rusak')).toBeInTheDocument()
    })
  })
})
