import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'
import { api } from '@/lib/api/client'

const fakeUser = {
  id: 1,
  name: 'Mahasiswa Baru',
  nim: '12345',
  email: 'user@facility.test',
  role: 'user',
}

vi.mock('@/features/auth/auth-query', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/auth/auth-query')>()
  return {
    ...actual,
    meQueryOptions: {
      queryKey: ['me'],
      queryFn: async () => fakeUser,
      retry: false,
      staleTime: 0,
    },
  }
})

vi.mock('@/lib/api/client', () => ({
  api: { GET: vi.fn(), POST: vi.fn(), PUT: vi.fn(), DELETE: vi.fn() },
  initializeCsrf: vi.fn(() => Promise.resolve()),
}))

vi.mock('@/components/ui/sonner', () => ({ Toaster: () => null }))

// Base UI Select nge-render popup-nya lewat Portal dan bergantung ke pointer
// event + layout API (getBoundingClientRect, scrollIntoView) yang gak tersedia
// di jsdom. Jadi primitive Select-nya di-stub jadi <select> native di test ini.
// Yang diuji tetap logika form + kontrak POST /reports, bukan perilaku
// library UI pihak ketiga.
vi.mock('@/components/ui/select', () => {
  function Select({
    value,
    onValueChange,
    children,
  }: {
    value?: string
    onValueChange?: (value: string) => void
    children?: ReactNode
  }) {
    return (
      <select
        aria-label="Kategori"
        value={value ?? ''}
        onChange={(event) => onValueChange?.(event.target.value)}
      >
        {children}
      </select>
    )
  }

  function SelectContent({ children }: { children?: ReactNode }) {
    return <>{children}</>
  }

  function SelectItem({
    value,
    children,
  }: {
    value: string
    children?: ReactNode
  }) {
    return <option value={value}>{children}</option>
  }

  return {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger: () => null,
    SelectValue: () => null,
  }
})

function ok(body: unknown) {
  return { data: body, response: new Response(null, { status: 201 }) } as never
}

function fail(
  status: number,
  message: string,
  errors?: Record<string, string[]>,
) {
  return {
    error: { message, errors },
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
  return router
}

// Kategori diisi lewat fireEvent karena komponen Select-nya di-stub jadi
// <select> native (lihat mock di atas). Lokasi & Deskripsi pakai user-event
// supaya ngelakuin apa yang beneran dilakuin user: ngetik karakter per
// karakter, bukan sekali set nilai.
async function isiForm(user: UserEvent) {
  fireEvent.change(screen.getByLabelText('Kategori'), {
    target: { value: 'elektronik' },
  })
  await user.type(
    screen.getByLabelText('Lokasi'),
    'Gedung B lantai 2 ruang 205',
  )
  await user.type(
    screen.getByLabelText('Deskripsi'),
    'Proyektor kelas mati total dan kabelnya terkelupas.',
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.POST).mockResolvedValue(
    ok({ data: { id: 1, status: 'MENUNGGU_VERIFIKASI' } }),
  )
})

afterEach(() => vi.clearAllMocks())

describe('halaman /lapor', () => {
  it('menampilkan form laporan untuk role user', async () => {
    renderAt('/lapor')

    // CardTitle nge-render <div data-slot="card-title">, bukan elemen
    // heading, jadi dicari pakai teks biasa.
    expect(
      await screen.findByText('Laporkan Kerusakan Fasilitas'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Kategori')).toBeInTheDocument()
    expect(screen.getByLabelText('Lokasi')).toBeInTheDocument()
    expect(screen.getByLabelText('Deskripsi')).toBeInTheDocument()
    expect(screen.getByLabelText('Foto (opsional)')).toBeInTheDocument()
  })

  it('menampilkan error validasi kalau form kosong', async () => {
    renderAt('/lapor')

    fireEvent.click(
      await screen.findByRole('button', { name: 'Kirim Laporan' }),
    )

    expect(await screen.findByText('Lokasi wajib diisi')).toBeInTheDocument()
    expect(
      await screen.findByText('Deskripsi minimal 10 karakter'),
    ).toBeInTheDocument()
  })

  it('submit sukses → POST /reports dipanggil dengan FormData', async () => {
    const router = renderAt('/lapor')
    const user = userEvent.setup()

    await screen.findByRole('button', { name: 'Kirim Laporan' })
    await isiForm(user)

    await user.click(screen.getByRole('button', { name: 'Kirim Laporan' }))

    await waitFor(() => expect(api.POST).toHaveBeenCalledTimes(1))

    const [path, options] = vi.mocked(api.POST).mock.calls[0] as unknown as [
      string,
      { body: FormData },
    ]
    expect(path).toBe('/reports')
    expect(options.body).toBeInstanceOf(FormData)
    expect(options.body.get('kategori')).toBe('elektronik')
    expect(options.body.get('lokasi')).toBe('Gedung B lantai 2 ruang 205')

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/dashboard'),
    )
  })

  it('menampilkan pesan per field ketika server balas 422', async () => {
    renderAt('/lapor')
    const user = userEvent.setup()

    vi.mocked(api.POST).mockResolvedValue(
      fail(422, 'Data tidak valid', {
        deskripsi: ['Deskripsi minimal 10 karakter.'],
      }),
    )

    await screen.findByRole('button', { name: 'Kirim Laporan' })
    await isiForm(user)
    await user.click(screen.getByRole('button', { name: 'Kirim Laporan' }))

    expect(
      await screen.findByText('Deskripsi minimal 10 karakter.'),
    ).toBeInTheDocument()
  })

  it('melempar role selain user ke /dashboard', async () => {
    vi
      .mocked(api.GET)
      .mockResolvedValue(ok({ data: { ...fakeUser, role: 'admin' } })) as never
    // /auth/me dibalas lewat mock auth-query, jadi cukup render & cek:
    renderAt('/lapor')

    await waitFor(() =>
      expect(screen.queryByLabelText('Lokasi')).not.toBeInTheDocument(),
    )
  })
})

// Issue #50: /lapor jadi dua kolom — form di kiri, panduan di kanan.
// Yang diuji: panduan-nya muncul dan isinya nyambung sama field form.
// Fungsi form-nya sendiri sudah dijaga test di atas.
describe('panduan pengisian di /lapor', () => {
  it('menampilkan 4 langkah', async () => {
    renderAt('/lapor')

    const panduan = within(await screen.findByLabelText('Panduan pengisian'))

    for (const judul of [
      'Pilih kategori',
      'Sebutkan lokasi',
      'Ceritakan kerusakannya',
      'Lampirkan foto',
    ]) {
      expect(panduan.getByText(judul)).toBeInTheDocument()
    }

    expect(panduan.getByText('Langkah 1')).toBeInTheDocument()
    expect(panduan.getByText('Langkah 4')).toBeInTheDocument()
  })

  it('menampilkan contoh deskripsi, pilihan kategori, dan alur status', async () => {
    renderAt('/lapor')

    const panduan = within(await screen.findByLabelText('Panduan pengisian'))

    // Contoh konkret, bukan cuma teori.
    expect(
      panduan.getByText(/Lampu AC di ruang 301 mati total sejak Senin/),
    ).toBeInTheDocument()
    expect(
      panduan.getByText('Gedung H, Lantai 2, Ruang 214'),
    ).toBeInTheDocument()

    // Kategori diambil dari KATEGORI_LABEL, jadi sinkron sama form.
    expect(panduan.getByText('Elektronik')).toBeInTheDocument()
    expect(panduan.getByText('Lainnya')).toBeInTheDocument()

    // Alur status pakai label yang sama kayak badge di tabel admin.
    expect(panduan.getByText('Alur laporan')).toBeInTheDocument()
    expect(panduan.getByText('Menunggu Verifikasi')).toBeInTheDocument()
    expect(panduan.getByText('Selesai')).toBeInTheDocument()
  })

  it('form tetap utuh di halaman yang sama', async () => {
    renderAt('/lapor')

    // Semua field form masih ada — panduan cuma tambahan, bukan pengganti.
    expect(await screen.findByLabelText('Kategori')).toBeInTheDocument()
    expect(screen.getByLabelText('Lokasi')).toBeInTheDocument()
    expect(screen.getByLabelText('Deskripsi')).toBeInTheDocument()
    expect(screen.getByLabelText('Foto (opsional)')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Kirim Laporan' }),
    ).toBeInTheDocument()
  })
})
