import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
  must_change_password: boolean
}

const mahasiswa: Akun = {
  id: 1,
  name: 'Mahasiswa Baru',
  nim: '12345',
  email: 'user@facility.test',
  role: 'user',
  foto: null,
  must_change_password: false,
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
// Input file disembunyikan (sr-only) dengan id "akun-foto", dicari pakai id.
function pilihFoto(
  nama = 'profil.png',
  tipe = 'image/png',
  isi: BlobPart = 'isi-foto',
) {
  const input = document.getElementById('akun-foto') as HTMLInputElement
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
  await user.type(screen.getByLabelText('Password saat ini'), lama)
  await user.type(screen.getByLabelText('Password baru'), baru)
  await user.type(screen.getByLabelText('Ulangi password baru'), konfirmasi)
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
    const user = userEvent.setup()

    // Tab 'Profil' aktif secara default.
    await screen.findByRole('heading', { name: 'Profil' })
    expect(
      screen.getByRole('button', { name: 'Pilih foto' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Simpan foto' }),
    ).toBeInTheDocument()

    // Klik tab Keamanan untuk mencari field password.
    await user.click(await screen.findByRole('button', { name: 'Keamanan' }))
    expect(screen.getByText('Ganti password')).toBeInTheDocument()
    expect(screen.getByLabelText('Password saat ini')).toBeInTheDocument()
    expect(screen.getByLabelText('Password baru')).toBeInTheDocument()
    expect(screen.getByLabelText('Ulangi password baru')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Simpan password' }),
    ).toBeInTheDocument()
  })

  it('upload foto → POST /profile/foto dikirim dengan FormData', async () => {
    renderAt('/pengaturan')
    const user = userEvent.setup()

    await screen.findByRole('button', { name: 'Pilih foto' })
    pilihFoto()
    await user.click(screen.getByRole('button', { name: 'Simpan foto' }))

    await waitFor(() => expect(api.POST).toHaveBeenCalledTimes(1))

    const [path, options] = vi.mocked(api.POST).mock.calls[0] as unknown as [
      string,
      { body: FormData },
    ]
    expect(path).toBe('/profile/foto')
    expect(options.body).toBeInstanceOf(FormData)
    expect(options.body.get('foto')).toBeInstanceOf(File)

    // Sukses → cache /auth/me ditimpa: pratinjau halaman jadi
    // (di-scope ke kartu Profil) dan kartu profil di sidebar yang
    // membaca cache yang sama ikut berganti dari inisial ke foto.
    expect(
      await screen.findAllByAltText('Foto profil Mahasiswa Baru'),
    ).toHaveLength(2)
  })

  it('menolak foto lebih dari 2 MB tanpa memanggil API', async () => {
    renderAt('/pengaturan')
    const user = userEvent.setup()

    await screen.findByRole('button', { name: 'Pilih foto' })
    pilihFoto('besar.png', 'image/png', new ArrayBuffer(3 * 1024 * 1024))
    await user.click(screen.getByRole('button', { name: 'Simpan foto' }))

    expect(
      await screen.findByText('Ukuran foto maksimal 2 MB'),
    ).toBeInTheDocument()
    expect(api.POST).not.toHaveBeenCalled()
  })

  it('ganti password → PATCH /profile/password dikirim lalu form direset', async () => {
    renderAt('/pengaturan')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Keamanan' }))
    await screen.findByRole('button', { name: 'Simpan password' })
    await isiPassword(
      user,
      'password-lama',
      'Password-baru-123',
      'Password-baru-123',
    )
    await user.click(screen.getByRole('button', { name: 'Simpan password' }))

    await waitFor(() => expect(api.PATCH).toHaveBeenCalledTimes(1))

    const [path, options] = vi.mocked(api.PATCH).mock.calls[0] as unknown as [
      string,
      { body: Record<string, string> },
    ]
    expect(path).toBe('/profile/password')
    expect(options.body.current_password).toBe('password-lama')
    expect(options.body.password).toBe('Password-baru-123')
    expect(options.body.password_confirmation).toBe('Password-baru-123')

    // reset() setelah sukses — ketiga field kosong lagi.
    await waitFor(() =>
      expect(screen.getByLabelText('Password baru')).toHaveValue(''),
    )
    expect(screen.getByLabelText('Password saat ini')).toHaveValue('')
  })

  it('validasi lokal: password baru minimal 8 karakter', async () => {
    renderAt('/pengaturan')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Keamanan' }))
    await screen.findByRole('button', { name: 'Simpan password' })
    await isiPassword(user, 'password-lama', 'abc', 'abc')
    await user.click(screen.getByRole('button', { name: 'Simpan password' }))

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

    await user.click(await screen.findByRole('button', { name: 'Keamanan' }))
    await screen.findByRole('button', { name: 'Simpan password' })
    await isiPassword(
      user,
      'password-salah',
      'Password-baru-123',
      'Password-baru-123',
    )
    await user.click(screen.getByRole('button', { name: 'Simpan password' }))

    expect(
      await screen.findByText(/Password saat ini tidak sesuai/),
    ).toBeInTheDocument()
  })

  it('role admin: membuka halaman Pengaturan', async () => {
    currentUser = { ...mahasiswa, role: 'admin' }
    renderAt('/pengaturan')
    const user = userEvent.setup()

    // Judulnya ada di header shell; nav shell juga punya link "Pengaturan",
    // jadi dicari lewat peran heading supaya tidak nyangkut link-nya.
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Pengaturan' }),
      ).toBeInTheDocument(),
    )
    await user.click(await screen.findByRole('button', { name: 'Keamanan' }))
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Simpan password' }),
      ).toBeInTheDocument(),
    )
  })

  // Bagian 3 halaman Pengaturan (issue #113): QnA pindahan dari Beranda.
  it('bagian Bantuan: klik pertanyaan membuka jawabannya, satu waktu', async () => {
    renderAt('/pengaturan')
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Bantuan' }))
    expect(
      await screen.findByRole('heading', { name: 'Bantuan' }),
    ).toBeInTheDocument()

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
