import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
  loginMutationOptions: {
    mutationFn: async () => ({ role: 'pelapor' }),
  },
  meQueryOptions: {
    queryKey: ['me'],
    retry: false,
    queryFn: async () => {
      throw new Error('Unauthenticated')
    },
  },
}))

function renderLanding() {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  return {
    router,
    ...render(
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  }
}

describe('Landing Page Hero Section & Quick Report Modal', () => {
  it('menampilkan hero Rusak? Lapor. dan floating bar bertab', async () => {
    renderLanding()

    expect(await screen.findByText('Facility Reporting')).toBeInTheDocument()
    expect(screen.getByText('Rusak?')).toBeInTheDocument()
    expect(screen.getByText('Lapor.')).toBeInTheDocument()
    expect(screen.getByText('98% Aktif')).toBeInTheDocument()
    expect(screen.getByText('12 Teknisi Siaga')).toBeInTheDocument()

    expect(screen.getByRole('tab', { name: /lapor baru/i })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: /cek status/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /fasilitas/i })).toBeInTheDocument()
    expect(screen.queryByText('Pantau laporan terbaru')).not.toBeInTheDocument()
  })

  it('berpindah tab Cek Status & Fasilitas lalu membuka modal dari zona fasilitas', async () => {
    renderLanding()
    const user = userEvent.setup()

    const statusTab = await screen.findByRole('tab', { name: /cek status/i })
    await user.click(statusTab)
    expect(statusTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByLabelText(/nomor tiket laporan/i)).toBeVisible()

    const fasilitasTab = screen.getByRole('tab', { name: /fasilitas/i })
    await user.click(fasilitasTab)
    expect(fasilitasTab).toHaveAttribute('aria-selected', 'true')

    await user.click(screen.getByRole('button', { name: /sanitasi & air/i }))

    const modal = screen.getByRole('dialog')
    expect(modal).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /buat laporan fasilitas/i }),
    ).toBeInTheDocument()

    await user.click(within(modal).getByRole('button', { name: /batal/i }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('mengarahkan langsung ke halaman login saat tombol Kirim Laporan diklik', async () => {
    const { router } = renderLanding()
    const user = userEvent.setup()

    const [ctaBtn] = await screen.findAllByRole('button', {
      name: /^kirim laporan$/i,
    })
    await user.click(ctaBtn!)

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login')
    })
  })
})
