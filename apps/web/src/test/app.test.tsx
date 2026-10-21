import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'

vi.mock('@/features/status/status-query', () => ({
  statusQueryOptions: {
    queryKey: ['status'],
    queryFn: async () => ({ data: { status: 'ok' } }),
  },
}))

vi.mock('@/features/auth/auth-query', () => ({
  homeFor: (role: string) => (role === 'super_admin' ? '/admin' : '/dashboard'),
  meQueryOptions: {
    queryKey: ['me'],
    retry: false,
    queryFn: async () => {
      throw new Error('Unauthenticated')
    },
  },
}))

describe('application shell', () => {
  it('menampilkan landing page untuk tamu', async () => {
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })
    render(
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )

    expect(
      await screen.findByRole('heading', {
        name: /perbaikan dimulai dari laporan yang rapi/i,
      }),
    ).toBeInTheDocument()

    const cta = screen.getByRole('link', {
      name: /masuk dan mulai lapor/i,
    })
    expect(cta).toHaveAttribute('href', '/login')

    expect((await screen.findAllByText('Sistem aktif')).length).toBeGreaterThan(
      0,
    )
  })
})
