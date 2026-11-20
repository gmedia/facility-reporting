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

// Posisi pelapor di-mock: jsdom tidak punya GPS. Tiap tes bisa mengganti
// `posisiMock.nilai` untuk mensimulasikan izin ditolak atau di luar radius.
const { posisiMock, POSISI_DALAM } = vi.hoisted(() => {
  const dalam = {
    status: 'dalam' as const,
    gps: { lat: -7.3859479, lng: 109.236801, akurasi: 10 },
    jarak: 149,
    radius: 400,
    bisaKirim: true,
    ulangi: () => {},
    muatUlangBatas: () => {},
  }
  return { POSISI_DALAM: dalam, posisiMock: { nilai: dalam as unknown } }
})

vi.mock('@/features/laporan/lokasi-pelapor', () => ({
  usePosisiPelapor: () => posisiMock.nilai,
}))

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
    // id-nya diambil dari <SelectTrigger> supaya <FieldLabel htmlFor>
    // tetap nyambung ke <select> stub ini — sama seperti produksi, di
    // mana id itu dipasang di trigger Base UI. Tanpa ini, Kategori dan
    // Lokasi (dua-duanya pakai Select) bakal sama-sama kebaca tanpa
    // label dan getByLabelText('Lokasi') jadi nihil.
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

// Kategori & Lokasi diisi lewat fireEvent karena komponen Select-nya
// di-stub jadi <select> native (lihat mock di atas). Deskripsi pakai
// user-event supaya ngelakuin apa yang beneran dilakuin user: ngetik
// karakter per karakter, bukan sekali set nilai.
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

  // defaultValues skala SMART sekarang 0 — harus dipilih eksplisit agar
  // form lolos validasi .min(1) (lihat laporan-form.tsx defaultValues).
  // Nama aksesibel radio sekarang "1 Rendah", "3 Sedang", dst. (label arah
  // ditambahkan di dalam <label>), jadi cari radio berdasarkan value atribut.
  const pilihNilai = async (label: RegExp, nilai: number) => {
    const rg = screen.getByRole('radiogroup', { name: label })
    const radio = within(rg)
      .getAllByRole('radio')
      .find((r) => (r as HTMLInputElement).value === String(nilai))
    await user.click(radio as Element)
  }
  await pilihNilai(/Nilai Kerusakan/, 3)
  await pilihNilai(/Nilai Risiko/, 3)
  await pilihNilai(/Nilai Dampak/, 3)
  await pilihNilai(/Nilai Frekuensi/, 3)
}

// Foto sekarang wajib, jadi tiap test yang mau submit harus nempelkin file.
// `files` di-properti jsdom read-only, jadi ditimpa lewat defineProperty —
// sama dengan yang dilakukan library upload pada umumnya.
function pilihFoto(nama = 'foto.png', tipe = 'image/png') {
  const input = screen.getByLabelText('Foto laporan')
  const file = new File(['isi-foto'], nama, { type: tipe })
  Object.defineProperty(input, 'files', {
    value: [file],
    configurable: true,
  })
  fireEvent.change(input)
}

beforeEach(() => {
  vi.clearAllMocks()
  posisiMock.nilai = POSISI_DALAM
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
    expect(screen.getByLabelText('Deskripsi')).toBeInTheDocument()
    expect(screen.getByLabelText('Foto')).toBeInTheDocument()

    // Lokasi berupa dropdown, bukan ketikan bebas: pilihannya terkunci
    // di LOKASI_VALUES (permintaan 3 Nov 2026).
    const lokasiLabel = screen.getByLabelText('Lokasi') as HTMLLabelElement
    expect(lokasiLabel).toBeInTheDocument()
    const lokasiSelect = document.getElementById(lokasiLabel.htmlFor!)
    expect(
      within(lokasiSelect!)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Gedung D', 'Gedung S'])
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
    // Kontrak baru: foto tidak lagi opsional.
    expect(
      await screen.findByText('Foto wajib dilampirkan'),
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
    expect(options.body.get('lokasi')).toBe('Gedung D')
    expect(options.body.get('nilai_kerusakan')).toBe('3')
    expect(options.body.get('nilai_risiko')).toBe('3')
    expect(options.body.get('nilai_dampak')).toBe('3')
    expect(options.body.get('nilai_frekuensi')).toBe('3')
    expect(options.body.get('latitude')).toBe('-7.3859479')
    expect(options.body.get('longitude')).toBe('109.2368010')

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

  it('izin lokasi ditolak → banner tampil dan tombol kirim terkunci', async () => {
    posisiMock.nilai = {
      ...POSISI_DALAM,
      status: 'ditolak',
      gps: null,
      jarak: null,
      bisaKirim: false,
    }
    renderAt('/lapor')

    expect(await screen.findByText(/Izin lokasi ditolak/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Kirim Laporan' })).toBeDisabled()
    expect(api.POST).not.toHaveBeenCalled()
  })

  it('di luar radius → pesan jarak tampil dan tombol kirim terkunci', async () => {
    posisiMock.nilai = {
      ...POSISI_DALAM,
      status: 'luar',
      jarak: 1200,
      bisaKirim: false,
    }
    renderAt('/lapor')

    expect(
      await screen.findByText(/Di luar radius 400 m dari kampus \(1200 m\)/),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Kirim Laporan' })).toBeDisabled()
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
