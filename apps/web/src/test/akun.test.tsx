import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
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
  nim: string
  email: string
  role: Role
  foto: string | null
}

const mahasiswa: Akun = {
  id: 1,
  name: 'Mahasiswa Baru',
  nim: '12345',
  email: 'user@facility.test',
  role: 'user',
  foto: null,
}

// Ditukar per test, sama seperti navigasi-per-role: meQueryOptions dibaca
// pas query-nya jalan (waktu render), jadi aman diganti di dalam it().
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
    PUT: vi.fn(),
    PATCH: vi.fn(),
    DELETE: vi.fn(),
  },
  initializeCsrf: vi.fn(() => Promise.resolve()),
}))

vi.mock('@/components/ui/sonner', () => ({ Toaster: () => null }))

function ok(body: unknown) {
  return { data: body, response: new Response(null, { status: 200 }) } as never
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

// `files` di-properti jsdom read-only, jadi ditimpa lewat defineProperty —
// pola yang sama dengan pilihFoto() di lapor.test.
function pilihFoto(
  nama = 'profil.png',
  tipe = 'image/png',
  isi: BlobPart = 'isi-foto',
) {
  const input = screen.getByLabelText('Foto')
  const file = new File([isi], nama, { type: tipe })
  Object.defineProperty(input, 'files', {
    value: [file],
    configurable: true,
  })
  fireEvent.change(input)
}

async function isiPassword(
  user: UserEvent,
  lama: string,
  baru: string,
  konfirmasi: string,
) {
  await user.type(screen.getByLabelText('Password Saat Ini'), lama)
  await user.type(screen.getByLabelText('Password Baru'), baru)
  await user.type(screen.getByLabelText('Konfirmasi Password Baru'), konfirmasi)
}

beforeEach(() => {
  vi.clearAllMocks()
  currentUser = mahasiswa
  vi.mocked(api.POST).mockResolvedValue(
    ok({ data: { ...mahasiswa, foto: 'profil/baru.png' } }),
  )
  vi.mocked(api.PATCH).mockResolvedValue({
    data: { message: 'Password berhasil diperbarui.' },
    response: new Response(null, { status: 200 }),
  } as never)
})

afterEach(() => vi.clearAllMocks())

describe('halaman /pengaturan', () => {
  it('menampilkan kartu Kelola Akun dan Keamanan', async () => {
    renderAt('/pengaturan')

    expect(await screen.findByText('Kelola Akun')).toBeInTheDocument()
    expect(screen.getByLabelText('Foto')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Simpan Foto' }),
    ).toBeInTheDocument()

    expect(screen.getByText('Keamanan')).toBeInTheDocument()
    expect(screen.getByLabelText('Password Saat Ini')).toBeInTheDocument()
    expect(screen.getByLabelText('Password Baru')).toBeInTheDocument()
    expect(
      screen.getByLabelText('Konfirmasi Password Baru'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Simpan Password' }),
    ).toBeInTheDocument()

    // Belum ada foto → pratinjau memakai inisial nama. Di-scope ke kartu
    // Kelola Akun: kartu profil di sidebar juga menampilkan inisial sama.
    const kartuFoto = screen
      .getByText('Kelola Akun')
      .closest('[data-slot="card"]')
    expect(kartuFoto).not.toBeNull()
    expect(within(kartuFoto as HTMLElement).getByText('MB')).toBeInTheDocument()
  })

  it('upload foto → POST /profile/foto dikirim dengan FormData', async () => {
    renderAt('/pengaturan')
    const user = userEvent.setup()

    await screen.findByRole('button', { name: 'Simpan Foto' })
    pilihFoto()
    await user.click(screen.getByRole('button', { name: 'Simpan Foto' }))

    await waitFor(() => expect(api.POST).toHaveBeenCalledTimes(1))

    const [path, options] = vi.mocked(api.POST).mock.calls[0] as unknown as [
      string,
      { body: FormData },
    ]
    expect(path).toBe('/profile/foto')
    expect(options.body).toBeInstanceOf(FormData)
    expect(options.body.get('foto')).toBeInstanceOf(File)

    // Sukses → cache /auth/me ditimpa: pratinjau halaman jadi <img>
    // (di-scope ke kartu Kelola Akun) dan kartu profil di sidebar yang
    // membaca cache yang sama ikut berganti dari inisial ke foto.
    const kartuFoto = screen
      .getByText('Kelola Akun')
      .closest('[data-slot="card"]')
    expect(kartuFoto).not.toBeNull()
    expect(
      await within(kartuFoto as HTMLElement).findByAltText(
        'Foto profil Mahasiswa Baru',
      ),
    ).toBeInTheDocument()
    expect(
      await screen.findAllByAltText('Foto profil Mahasiswa Baru'),
    ).toHaveLength(2)
  })

  it('menolak foto lebih dari 2 MB tanpa memanggil API', async () => {
    renderAt('/pengaturan')
    const user = userEvent.setup()

    await screen.findByRole('button', { name: 'Simpan Foto' })
    pilihFoto('besar.png', 'image/png', new ArrayBuffer(3 * 1024 * 1024))
    await user.click(screen.getByRole('button', { name: 'Simpan Foto' }))

    expect(
      await screen.findByText('Ukuran foto maksimal 2 MB'),
    ).toBeInTheDocument()
    expect(api.POST).not.toHaveBeenCalled()
  })

  it('ganti password → PATCH /profile/password dikirim lalu form direset', async () => {
    renderAt('/pengaturan')
    const user = userEvent.setup()

    await screen.findByRole('button', { name: 'Simpan Password' })
    await isiPassword(
      user,
      'password-lama',
      'password-baru-123',
      'password-baru-123',
    )
    await user.click(screen.getByRole('button', { name: 'Simpan Password' }))

    await waitFor(() => expect(api.PATCH).toHaveBeenCalledTimes(1))

    const [path, options] = vi.mocked(api.PATCH).mock.calls[0] as unknown as [
      string,
      { body: Record<string, string> },
    ]
    expect(path).toBe('/profile/password')
    expect(options.body.current_password).toBe('password-lama')
    expect(options.body.password).toBe('password-baru-123')
    expect(options.body.password_confirmation).toBe('password-baru-123')

    // reset() setelah sukses — ketiga field kosong lagi.
    await waitFor(() =>
      expect(screen.getByLabelText('Password Baru')).toHaveValue(''),
    )
    expect(screen.getByLabelText('Password Saat Ini')).toHaveValue('')
  })

  it('validasi lokal: password baru minimal 8 karakter', async () => {
    renderAt('/pengaturan')
    const user = userEvent.setup()

    await screen.findByRole('button', { name: 'Simpan Password' })
    await isiPassword(user, 'password-lama', 'abc', 'abc')
    await user.click(screen.getByRole('button', { name: 'Simpan Password' }))

    expect(
      await screen.findByText('Password baru minimal 8 karakter'),
    ).toBeInTheDocument()
    expect(api.PATCH).not.toHaveBeenCalled()
  })

  it('menampilkan pesan per field ketika server balas 422', async () => {
    renderAt('/pengaturan')
    const user = userEvent.setup()

    vi.mocked(api.PATCH).mockResolvedValue(
      fail(422, 'Data tidak valid', {
        current_password: ['Password saat ini tidak sesuai.'],
      }),
    )

    await screen.findByRole('button', { name: 'Simpan Password' })
    await isiPassword(
      user,
      'password-salah',
      'password-baru-123',
      'password-baru-123',
    )
    await user.click(screen.getByRole('button', { name: 'Simpan Password' }))

    expect(
      await screen.findByText('Password saat ini tidak sesuai.'),
    ).toBeInTheDocument()
  })

  it('role admin: membuka halaman Pengaturan', async () => {
    currentUser = { ...mahasiswa, role: 'admin' }
    renderAt('/pengaturan')

    // Judulnya ada di header shell; nav shell juga punya link "Pengaturan",
    // jadi dicari lewat peran heading supaya tidak nyangkut link-nya.
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Pengaturan' }),
      ).toBeInTheDocument(),
    )
    expect(screen.getByLabelText('Password Saat Ini')).toBeInTheDocument()
    expect(screen.getByLabelText('Password Baru')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Simpan Password' }),
    ).toBeInTheDocument()
  })

  // Bagian 3 halaman Pengaturan (issue #113): QnA pindahan dari Beranda.
  it('bagian Bantuan: klik pertanyaan membuka jawabannya, satu waktu', async () => {
    renderAt('/pengaturan')
    const user = userEvent.setup()

    expect(await screen.findByText('Bantuan')).toBeInTheDocument()

    const tanya1 = screen.getByRole('button', {
      name: 'Apa itu Facility Reporting?',
    })
    expect(tanya1).toHaveAttribute('aria-expanded', 'false')

    await user.click(tanya1)
    expect(
      await screen.findByText(/Portal untuk melaporkan kerusakan fasilitas/),
    ).toBeInTheDocument()
    expect(tanya1).toHaveAttribute('aria-expanded', 'true')

    // Membuka pertanyaan kedua menutup yang pertama — cuma satu jawaban
    // terbuka sekaligus, supaya tingginya tetap terkendali.
    const tanya2 = screen.getByRole('button', {
      name: 'Bagaimana cara mengirim laporan?',
    })
    await user.click(tanya2)
    expect(
      screen.queryByText(/Portal untuk melaporkan kerusakan fasilitas/),
    ).not.toBeInTheDocument()
    expect(tanya1).toHaveAttribute('aria-expanded', 'false')
    expect(tanya2).toHaveAttribute('aria-expanded', 'true')
  })
})
