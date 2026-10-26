import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
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
let currentUser: Akun = pengelola

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
// di jsdom. Komponennya di-swap jadi HTML sederhana di test ini — produksi
// tetap DropdownMenu. Konsekuensinya isi menu selalu ada di DOM, jadi test
// tidak perlu buka popup dulu.
// Perlu diekspor SEMUA: modul ini di-mock utuh, jadi <AppNav> yang juga
// ngederender <DropdownMenuLabel>/<DropdownMenuSeparator> ikut kena.
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children?: ReactNode }) => <>{children}</>,
  DropdownMenuLabel: ({ children }: { children?: ReactNode }) => (
    <div className="px-2 py-1.5">{children}</div>
  ),
  DropdownMenuSeparator: () => <hr />,
  // AppNav juga render modul ini, jadi semua export yang dipakai AppNav
  // harus ada di mock — kalau kurang, AppNav crash.
  DropdownMenuGroup: ({ children }: { children?: ReactNode }) => (
    <div role="group">{children}</div>
  ),
  DropdownMenuTrigger: ({ children }: { children?: ReactNode }) => (
    <button type="button">{children}</button>
  ),
  DropdownMenuContent: ({ children }: { children?: ReactNode }) => (
    <div role="menu">{children}</div>
  ),
  // ⚠️ Mock ini WAJIB nurutin API asli Base UI: Menu.Item cuma punya
  // `onClick`, TIDAK punya `onSelect`. Dulu mock-nya menerima `onSelect`
  // dan memetakannya ke onClick — makanya test ijo padahal di browser
  // handler-nya gak pernah kepicu (onSelect itu event DOM, bukan prop
  // Base UI). Kalau item-nya pakai `onSelect`, `onClick`-nya undefined
  // -> test ini harus merah.
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

const satuLaporan = [
  {
    id: 1,
    user_id: 3,
    kategori: 'bangunan',
    lokasi: 'gedung h',
    deskripsi: 'lampu mati',
    foto: null,
    status: 'menunggu_verifikasi',
    created_at: '2026-10-19T12:12:10Z',
    updated_at: '2026-10-19T12:12:10Z',
  },
]

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
  currentUser = pengelola
  vi.mocked(api.GET).mockResolvedValue(ok({ data: satuLaporan }))
  vi.mocked(api.PATCH).mockResolvedValue(
    ok({
      data: { ...satuLaporan[0], status: 'selesai', updated_at: null },
    }),
  )
})

afterEach(() => vi.clearAllMocks())

describe('halaman /verifikasi', () => {
  it('role admin: menampilkan tabel laporan dari GET /reports', async () => {
    renderAt('/verifikasi')

    expect(await screen.findByText('gedung h')).toBeInTheDocument()
    expect(screen.getByText('Bangunan')).toBeInTheDocument()
    expect(screen.getByText('lampu mati')).toBeInTheDocument()

    // status enum ditampilkan sebagai label, bukan value mentah.
    // selector 'span' dipakai biar gak ketimpa menuitem (mock dropdown
    // selalu render isinya di DOM, produksi pakai portal).
    expect(
      screen.getByText('Menunggu Verifikasi', { selector: 'span' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('menunggu_verifikasi')).not.toBeInTheDocument()

    expect(api.GET).toHaveBeenCalledWith('/reports')
  })

  it('role admin: bisa ubah status lewat PATCH', async () => {
    renderAt('/verifikasi')
    await screen.findByText('gedung h')

    fireEvent.click(screen.getByRole('menuitem', { name: 'Selesai' }))

    await waitFor(() => expect(api.PATCH).toHaveBeenCalledTimes(1))

    const [path, options] = vi.mocked(api.PATCH).mock.calls[0] as unknown as [
      string,
      { params: { path: { laporan: number } }; body: { status: string } },
    ]
    expect(path).toBe('/reports/{laporan}/status')
    expect(options.params.path.laporan).toBe(1)
    expect(options.body.status).toBe('selesai')
  })

  it('role user: diarahkan ke /dashboard', async () => {
    currentUser = mahasiswa
    const router = renderAt('/verifikasi')

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/dashboard'),
    )
    expect(screen.queryByText('gedung h')).not.toBeInTheDocument()
  })

  it('filter status menyaring tabel sesuai pilihan', async () => {
    vi.mocked(api.GET).mockResolvedValue(
      ok({
        data: [
          satuLaporan[0],
          {
            ...satuLaporan[0],
            id: 2,
            kategori: 'furnitur',
            lokasi: 'kelas a',
            deskripsi: 'meja rusak',
            status: 'selesai',
          },
        ],
      }),
    )
    renderAt('/verifikasi')

    await screen.findByText('lampu mati')
    const filterGroup = screen.getByRole('group', { name: 'Filter status' })

    fireEvent.click(
      within(filterGroup).getByRole('button', { name: /^Menunggu/ }),
    )
    expect(screen.getByText('lampu mati')).toBeInTheDocument()
    expect(screen.queryByText('meja rusak')).not.toBeInTheDocument()

    fireEvent.click(
      within(filterGroup).getByRole('button', { name: /^Selesai/ }),
    )
    expect(screen.getByText('meja rusak')).toBeInTheDocument()
    expect(screen.queryByText('lampu mati')).not.toBeInTheDocument()

    fireEvent.click(within(filterGroup).getByRole('button', { name: /^Semua/ }))
    expect(screen.getByText('lampu mati')).toBeInTheDocument()
    expect(screen.getByText('meja rusak')).toBeInTheDocument()
  })

  it('filter tanpa hasil: empty state mengikuti filter aktif', async () => {
    renderAt('/verifikasi')

    await screen.findByText('lampu mati')
    const filterGroup = screen.getByRole('group', { name: 'Filter status' })

    fireEvent.click(
      within(filterGroup).getByRole('button', { name: /^Terverifikasi/ }),
    )

    expect(
      screen.getByText('Belum ada laporan berstatus Terverifikasi.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(
      within(filterGroup).getByRole('button', { name: /^Semua/ }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Tampilkan semua' }))
    expect(await screen.findByRole('table')).toBeInTheDocument()
  })

  it('loading state: menampilkan pesan memuat', async () => {
    vi.mocked(api.GET).mockReturnValue(new Promise(() => {}) as never)
    renderAt('/verifikasi')

    expect(await screen.findByText('Memuat laporan…')).toBeInTheDocument()
  })

  it('error state: menampilkan pesan dan tombol coba lagi', async () => {
    vi.mocked(api.GET).mockRejectedValue(new Error('jaringan putus'))
    renderAt('/verifikasi')

    expect(
      await screen.findByText('Gagal memuat daftar laporan.'),
    ).toBeInTheDocument()
    expect(screen.getByText('jaringan putus')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Coba lagi' }),
    ).toBeInTheDocument()
  })

  it('data kosong: menampilkan pesan, bukan tabel kosong', async () => {
    vi.mocked(api.GET).mockResolvedValue(ok({ data: [] }))
    renderAt('/verifikasi')

    expect(
      await screen.findByText('Belum ada laporan masuk.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
