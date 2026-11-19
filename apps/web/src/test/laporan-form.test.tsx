import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { Children, isValidElement, type ReactNode } from 'react'
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

// Base UI Select di-stub jadi <select> native (pola sama lapor.test.tsx):
// popup Base UI butuh pointer/layout API yang tidak ada di jsdom.
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
    let id: string | undefined
    Children.forEach(children, (child) => {
      if (isValidElement<{ id?: string }>(child) && child.props.id) {
        id = child.props.id
      }
    })
    return (
      <select
        id={id}
        value={value ?? ''}
        onChange={(event) => {
          // react-hook-form's field.onChange accepts value directly
          onValueChange?.(event.target.value)
        }}
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
// pola yang sama dengan lapor.test.tsx dan akun.test.tsx.
function pilihFoto(nama = 'foto.png', tipe = 'image/png') {
  const input = screen.getByLabelText('Foto laporan')
  const file = new File(['isi-foto'], nama, { type: tipe })
  Object.defineProperty(input, 'files', {
    value: [file],
    configurable: true,
  })
  fireEvent.change(input)
}

async function isiForm(user: UserEvent) {
  const kategoriLabel = screen.getByLabelText('Kategori') as HTMLLabelElement
  const kategoriSelect = document.getElementById(kategoriLabel.htmlFor!)
  fireEvent.change(kategoriSelect!, { target: { value: 'elektronik' } })
  const lokasiLabel = screen.getByLabelText('Lokasi') as HTMLLabelElement
  const lokasiSelect = document.getElementById(lokasiLabel.htmlFor!)
  fireEvent.change(lokasiSelect!, { target: { value: 'Gedung D' } })
  await user.type(
    screen.getByLabelText('Deskripsi'),
    'Proyektor kelas mati total dan kabelnya terkelupas.',
  )
  pilihFoto()
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.POST).mockResolvedValue(
    ok({ data: { id: 1, status: 'menunggu_verifikasi' } }),
  )
})

afterEach(() => vi.clearAllMocks())

describe('form laporan /lapor', () => {
  it('submit tanpa memilih nilai → 4 pesan validasi dan api.POST tidak dipanggil', async () => {
    renderAt('/lapor')
    const user = userEvent.setup()

    await screen.findByRole('button', { name: 'Kirim Laporan' })
    await isiForm(user)

    // defaultValues berupa 0 → tidak ada tombol skala yang tercentang.
    // zod .min(1) menolak semua keempat field, 4 pesan validasi muncul.
    await user.click(screen.getByRole('button', { name: 'Kirim Laporan' }))

    await screen.findByText('Nilai kerusakan wajib diisi (1–5)')
    await screen.findByText('Nilai risiko wajib diisi (1–5)')
    await screen.findByText('Nilai dampak wajib diisi (1–5)')
    await screen.findByText('Nilai frekuensi wajib diisi (1–5)')

    expect(api.POST).not.toHaveBeenCalled()
  })

  it('isi lengkap + pilih nilai 3, 4, 2, 5 → api.POST dipanggil dengan FormData benar', async () => {
    const router = renderAt('/lapor')
    const user = userEvent.setup()

    await screen.findByRole('button', { name: 'Kirim Laporan' })
    await isiForm(user)

    // Pilih nilai SMART: 3, 4, 2, 5
    const pilihNilai = async (labelRadiogroup: RegExp, nilai: number) => {
      const rg = screen.getByRole('radiogroup', { name: labelRadiogroup })
      // Nama aksesibel radio sekarang "1 Rendah", "3 Sedang", dst. (label arah
      // ditambahkan di dalam <label>), jadi cari radio berdasarkan value atribut.
      const radio = within(rg)
        .getAllByRole('radio')
        .find((r) => (r as HTMLInputElement).value === String(nilai))
      await user.click(radio as Element)
    }

    await pilihNilai(/Nilai Kerusakan/, 3)
    await pilihNilai(/Nilai Risiko/, 4)
    await pilihNilai(/Nilai Dampak/, 2)
    await pilihNilai(/Nilai Frekuensi/, 5)

    await user.click(screen.getByRole('button', { name: 'Kirim Laporan' }))

    await waitFor(() => expect(api.POST).toHaveBeenCalledTimes(1))

    const [path, options] = vi.mocked(api.POST).mock.calls[0] as unknown as [
      string,
      { body: FormData },
    ]
    expect(path).toBe('/reports')
    expect(options.body).toBeInstanceOf(FormData)
    expect(options.body.get('kategori')).toBe('elektronik')
    expect(options.body.get('lokasi')).toBe('Gedung D')
    expect(options.body.get('nilai_kerusakan')).toBe('3')
    expect(options.body.get('nilai_risiko')).toBe('4')
    expect(options.body.get('nilai_dampak')).toBe('2')
    expect(options.body.get('nilai_frekuensi')).toBe('5')

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/dashboard'),
    )
  })
})
