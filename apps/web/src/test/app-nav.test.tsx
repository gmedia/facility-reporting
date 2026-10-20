import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'
import { api } from '@/lib/api/client'

type Role = 'user' | 'admin' | 'super_admin'
type Akun = { id: number; name: string; nim: string; email: string; role: Role }

const mahasiswa: Akun = {
  id: 1,
  name: 'Mahasiswa Baru',
  nim: '12345',
  email: 'user@facility.test',
  role: 'user',
}

const admin: Akun = {
  ...mahasiswa,
  id: 2,
  name: 'Admin Satu',
  email: 'admin@facility.test',
  role: 'admin',
}

const superAdmin: Akun = {
  ...mahasiswa,
  id: 3,
  name: 'Super Admin',
  email: 'superadmin@facility.test',
  role: 'super_admin',
}

// Ditukar per test. `currentUser` dibaca pas query-nya jalan (waktu render),
// bukan pas factory mock-nya dipanggil, jadi aman diganti di dalam `it()`.
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
  api: { GET: vi.fn(), POST: vi.fn(), PUT: vi.fn(), DELETE: vi.fn() },
  initializeCsrf: vi.fn(() => Promise.resolve()),
}))

vi.mock('@/components/ui/sonner', () => ({ Toaster: () => null }))

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

beforeEach(() => {
  vi.clearAllMocks()
  currentUser = mahasiswa
  // openapi-fetch selalu balikin objek { data, error, response } — kalau
  // mock-nya return undefined, destructuring di mutation jadi error.
  vi.mocked(api.POST).mockResolvedValue({
    data: { message: 'Logged out' },
    response: new Response(null, { status: 200 }),
  } as never)
})

afterEach(() => vi.clearAllMocks())

// Inti dari issue #37: "AppNav yang menampilkan menu beda per role".
//
// Yang dites cuma menu-item yang routenya SUDAH ADA. /prioritas,
// /laporan/saya, /admin/statistik dll. belum dibuat, jadi belum
// dimasukin ke MENU_PER_ROLE — lihat komentar di app-nav.tsx.
describe('AppNav — menu per role', () => {
  it('role user: lihat Beranda dan Lapor Kerusakan', async () => {
    currentUser = mahasiswa
    renderAt('/dashboard')

    // Scope ke header nav — tombol aksi di dashboard juga berlabel
    // "Lapor Kerusakan", jadi jangan query seluruh halaman.
    const nav = within(await screen.findByRole('banner'))

    expect(nav.getByRole('link', { name: 'Beranda' })).toHaveAttribute(
      'href',
      '/dashboard',
    )

    // Ini pembeda utamanya — role lain gak boleh lihat ini.
    expect(nav.getByRole('link', { name: 'Lapor Kerusakan' })).toHaveAttribute(
      'href',
      '/lapor',
    )

    // Issue #42: /verifikasi khusus pengelola, user biasa gak boleh lihat.
    expect(
      nav.queryByRole('link', { name: 'Verifikasi' }),
    ).not.toBeInTheDocument()

    // Pemicu dropdown akun selalu ada, apa pun rolenya.
    expect(nav.getByRole('button', { name: 'Akun' })).toBeInTheDocument()
  })

  it('role admin: gak dapat menu Lapor Kerusakan', async () => {
    currentUser = admin
    renderAt('/dashboard')

    const nav = within(await screen.findByRole('banner'))

    expect(nav.getByRole('link', { name: 'Beranda' })).toBeInTheDocument()
    expect(
      nav.queryByRole('link', { name: 'Lapor Kerusakan' }),
    ).not.toBeInTheDocument()

    // Issue #42: admin boleh buka halaman daftar laporan di /verifikasi.
    expect(nav.getByRole('link', { name: 'Verifikasi' })).toHaveAttribute(
      'href',
      '/verifikasi',
    )
  })

  it('role super_admin: dapat Kelola Akun, bukan Lapor Kerusakan', async () => {
    currentUser = superAdmin
    renderAt('/dashboard')

    const nav = within(await screen.findByRole('banner'))

    expect(nav.getByRole('link', { name: 'Kelola Akun' })).toHaveAttribute(
      'href',
      '/admin',
    )
    expect(
      nav.queryByRole('link', { name: 'Lapor Kerusakan' }),
    ).not.toBeInTheDocument()

    // Issue #42: super_admin juga boleh buka /verifikasi.
    expect(nav.getByRole('link', { name: 'Verifikasi' })).toHaveAttribute(
      'href',
      '/verifikasi',
    )
  })

  // Regression: DropdownMenuLabel (Base UI Menu.GroupLabel) harus di dalam
  // Menu.Group. Kalau tidak, Base UI lempar "MenuGroupContext is missing"
  // dan seluruh halaman crash saat dropdown dibuka. Konten menu di-mount
  // lazy, jadi tanpa test ini bugnya lolos dari CI.
  it('dropdown akun bisa dibuka tanpa crash', async () => {
    currentUser = mahasiswa
    renderAt('/dashboard')

    fireEvent.click(await screen.findByRole('button', { name: 'Akun' }))

    // Pakai role menuitem, bukan teks: dashboard juga punya tombol "Keluar".
    expect(
      await screen.findByRole('menuitem', { name: 'Keluar' }),
    ).toBeInTheDocument()
  })

  // Regression: Base UI Menu.Item cuma punya `onClick`. Kalau pakai
  // `onSelect` (event DOM), handler-nya gak pernah kepicu.
  it('item Keluar di dropdown akun benar-benar ngejalanin logout', async () => {
    currentUser = mahasiswa
    renderAt('/dashboard')

    fireEvent.click(await screen.findByRole('button', { name: 'Akun' }))
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Keluar' }))

    await waitFor(() => expect(api.POST).toHaveBeenCalled())
  })
})
