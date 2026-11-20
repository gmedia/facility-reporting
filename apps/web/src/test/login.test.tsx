import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'

const { fakeUser, loginFn } = vi.hoisted(() => {
  const fakeUser = {
    id: 1,
    name: 'User Biasa',
    nim: '12345',
    email: 'user@facility.test',
    role: 'user',
  }
  return { fakeUser, loginFn: vi.fn(async () => fakeUser) }
})

vi.mock('@/features/auth/auth-query', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/auth/auth-query')>()
  return {
    ...actual, // homeFor asli dipakai, biar logika role ikut keuji
    loginMutationOptions: { mutationFn: loginFn },
    meQueryOptions: {
      queryKey: ['me'],
      queryFn: async () => fakeUser,
      retry: false,
      staleTime: 0,
    },
  }
})

vi.mock('@/features/status/status-query', () => ({
  statusQueryOptions: {
    queryKey: ['status'],
    queryFn: async () => ({ data: { status: 'ok' } }),
  },
}))

// Dashboard manggil GET /reports pas mount. Jangan biarkan test nembak
// jaringan beneran — balas array kosong biar halaman render empty state.
vi.mock('@/lib/api/client', () => ({
  api: {
    GET: vi.fn(async () => ({
      data: { data: [] },
      response: new Response(null, { status: 200 }),
    })),
    POST: vi.fn(),
    PUT: vi.fn(),
    DELETE: vi.fn(),
  },
  initializeCsrf: vi.fn(() => Promise.resolve()),
}))

function renderLogin() {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/login'] }),
  })
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

describe('halaman login', () => {
  it('menampilkan form login', async () => {
    renderLogin()
    expect(
      await screen.findByRole('heading', { name: 'Masuk' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Masuk' })).toBeInTheDocument()
  })

  it('menampilkan error validasi kalau form kosong', async () => {
    renderLogin()
    fireEvent.click(await screen.findByRole('button', { name: 'Masuk' }))

    expect(
      await screen.findByText('Email atau NIM wajib diisi'),
    ).toBeInTheDocument()
    expect(await screen.findByText('Password wajib diisi')).toBeInTheDocument()
  })

  it('login sukses → guard lolos → redirect ke /dashboard', async () => {
    const router = renderLogin()

    fireEvent.change(await screen.findByRole('textbox'), {
      target: { value: 'user@facility.test' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Masuk' }))

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/dashboard'),
    )
    expect(
      await screen.findByRole('heading', { name: 'Halo, User Biasa' }),
    ).toBeInTheDocument()

    // Halaman user sekarang dibungkus UserShell (sidebar), bukan AppNav
    // (topbar). Yang dibuktikan tetap sama: sesudah guard lolos, bingkai
    // navigasi halaman user berhasil ke-render sampai tuntas.
    expect(
      screen.getByRole('complementary', { name: 'Navigasi utama' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Keluar' })).toBeInTheDocument()
  })

  it('menampilkan petunjuk lupa password', async () => {
    renderLogin()
    expect(await screen.findByText('Lupa password?')).toBeInTheDocument()
  })

  it('error 429 tampil dalam bahasa Indonesia', async () => {
    loginFn.mockRejectedValueOnce(
      Object.assign(new Error('Too Many Attempts.'), { status: 429 }),
    )
    renderLogin()

    fireEvent.change(await screen.findByRole('textbox'), {
      target: { value: '234110601012' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'salah12345' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Masuk' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Terlalu banyak percobaan masuk/,
    )
  })
})
