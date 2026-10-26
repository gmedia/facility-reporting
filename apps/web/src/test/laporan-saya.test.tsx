import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'
import { api } from '@/lib/api/client'

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

// Ditukar per test. Dibaca pas query-nya jalan (waktu render), bukan pas
// factory mock-nya dipanggil, jadi aman diganti di dalam `it()`.
let currentUser: Akun = mahasiswa

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

// Base UI DropdownMenu bergantung ke pointer event + portal yang tidak ada
// di jsdom. Komponennya di-swap jadi HTML sederhana — produksi tetap
// DropdownMenu asli. Perlu diekspor SEMUA karena <AppNav> ngerender
// semuanya; kalau ada satu yang kurang, AppNav crash dan test merah.
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children?: ReactNode }) => <>{children}</>,
  DropdownMenuLabel: ({ children }: { children?: ReactNode }) => (
    <div className="px-2 py-1.5">{children}</div>
  ),
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuGroup: ({ children }: { children?: ReactNode }) => (
    <div role="group">{children}</div>
  ),
  DropdownMenuTrigger: ({ children }: { children?: ReactNode }) => (
    <button type="button">{children}</button>
  ),
  DropdownMenuContent: ({ children }: { children?: ReactNode }) => (
    <div role="menu">{children}</div>
  ),
  // WAJIB nurutin API asli Base UI: Menu.Item cuma punya `onClick`,
  // TIDAK punya `onSelect` (onSelect itu event DOM).
  DropdownMenuItem: ({
    children,
    onClick,
    disabled,
  }: {
    children?: ReactNode
    onClick?: () => void
    disabled?: boolean
  }) => (
    <button type="button" role="menuitem" disabled={disabled} onClick={onClick}>
      {children}
    </button>
  ),
}))

const laporanBaru = {
  id: 10,
  user_id: 3,
  kategori: 'elektronik',
  lokasi: 'perpustakaan lantai 2',
  deskripsi: 'stopkontak meledak',
  foto: null,
  status: 'menunggu_verifikasi',
  created_at: '2026-10-25T09:00:00Z',
  updated_at: '2026-10-25T09:00:00Z',
}

const laporanLama = {
  id: 2,
  user_id: 3,
  kategori: 'bangunan',
  lokasi: 'gedung h',
  deskripsi: 'plafon bocor',
  foto: null,
  status: 'selesai',
  created_at: '2026-10-10T09:00:00Z',
  updated_at: '2026-10-20T09:00:00Z',
}

function ok(body: unknown) {
  return { data: body, response: new Response(null, { status: 200 }) } as never
}

function renderAt(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  render(
    <QueryClientProvider
      // retry dimatikan: default React Query = 3 kali retry dengan backoff
      // eksponensial, jadi state error baru muncul ~7 detik dan test bakal
      // timeout. Di produksi retry-nya tetap jalan (bukan urusan test ini).
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

beforeEach(() => {
  vi.clearAllMocks()
  currentUser = mahasiswa
  vi.mocked(api.GET).mockResolvedValue(ok({ data: [laporanBaru, laporanLama] }))
})

afterEach(() => vi.clearAllMocks())

describe('halaman /laporan/saya', () => {
  it('menampilkan riwayat laporan milik mahasiswa dari GET /reports', async () => {
    renderAt('/laporan/saya')

    // Lokasi sengaja dicari pakai regex: di markup dia ada di dalam
    // <span> yang juga memuat "· " sebagai pemisah, jadi matcher persis
    // gak bakal nemu (getByText cuma baca text node langsung).
    expect(await screen.findByText(/perpustakaan lantai 2/)).toBeInTheDocument()
    expect(screen.getByText(/gedung h/)).toBeInTheDocument()
    expect(screen.getByText('stopkontak meledak')).toBeInTheDocument()
    expect(screen.getByText('plafon bocor')).toBeInTheDocument()

    expect(api.GET).toHaveBeenCalledWith('/reports')
  })

  it('status ditampilkan sebagai label, bukan value mentah', async () => {
    renderAt('/laporan/saya')

    expect(await screen.findByText('Menunggu Verifikasi')).toBeInTheDocument()
    expect(screen.getByText('Selesai')).toBeInTheDocument()
    expect(screen.queryByText('menunggu_verifikasi')).not.toBeInTheDocument()
  })

  it('kategori ditampilkan sebagai label', async () => {
    renderAt('/laporan/saya')

    expect(await screen.findByText('Elektronik')).toBeInTheDocument()
    expect(screen.getByText('Bangunan')).toBeInTheDocument()
    expect(screen.queryByText('elektronik')).not.toBeInTheDocument()
  })

  it('urutan terbaru di atas', async () => {
    renderAt('/laporan/saya')

    await screen.findByText(/perpustakaan lantai 2/)
    const kartu = screen
      .getAllByText(/gedung h|perpustakaan lantai 2/)
      .map((node) => node.textContent)
    // indeks 0 = kartu pertama di DOM = harus yang terbaru
    expect(kartu[0]).toContain('perpustakaan lantai 2')
  })

  it('menampilkan skeleton, bukan kartu, selagi memuat', async () => {
    // Promise yang tidak pernah selesai = query selalu pending.
    vi.mocked(api.GET).mockReturnValue(new Promise(() => {}) as never)

    renderAt('/laporan/saya')

    expect(
      await screen.findByText('Memuat riwayat laporan...'),
    ).toBeInTheDocument()
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(screen.queryByText('gedung h')).not.toBeInTheDocument()
  })

  it('empty state: belum pernah lapor, dengan ajakan ke /lapor', async () => {
    vi.mocked(api.GET).mockResolvedValue(ok({ data: [] }))

    renderAt('/laporan/saya')

    expect(
      await screen.findByText('Belum ada laporan yang kamu kirim'),
    ).toBeInTheDocument()

    const cta = screen.getByRole('link', { name: 'Laporkan Kerusakan' })
    expect(cta).toHaveAttribute('href', '/lapor')
  })

  it('error state: bisa dicoba lagi', async () => {
    vi.mocked(api.GET).mockResolvedValue({
      data: null,
      response: new Response(null, { status: 500 }),
    } as never)

    renderAt('/laporan/saya')

    expect(
      await screen.findByText('Gagal memuat riwayat laporan.'),
    ).toBeInTheDocument()
  })

  it('menu mahasiswa punya pintu Riwayat Laporan', async () => {
    renderAt('/laporan/saya')

    await screen.findByText(/perpustakaan lantai 2/)
    expect(
      screen.getAllByRole('link', { name: 'Riwayat Laporan' }).length,
    ).toBeGreaterThan(0)
  })

  it('admin di-redirect ke /dashboard', async () => {
    currentUser = pengelola

    const router = renderAt('/laporan/saya')

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/dashboard'),
    )
  })
})
