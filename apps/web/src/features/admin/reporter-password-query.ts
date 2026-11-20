import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { api, initializeCsrf } from '@/lib/api/client'

// SESUAIKAN dengan routes/api.php kalau path-nya berbeda.
const PATH_DAFTAR = '/admin/reporter-passwords'
const PATH_RESET = '/admin/reporter-passwords/{user}/reset'

export type Mahasiswa = {
  id: number
  name: string
  nim: string | null
  email: string | null
  active: boolean
  must_change_password: boolean
}

export type DaftarMahasiswa = {
  data: Array<Mahasiswa>
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export type HasilReset = {
  id: number
  name: string
  nim: string | null
  password: string
}

// Endpoint ini belum ada di schema.d.ts. Setelah `types:generate`,
// hapus cast ini dan pakai `api` langsung.
type Hasil = { data?: unknown; error?: unknown; response: Response }
const client = api as unknown as {
  GET: (path: string, init?: unknown) => Promise<Hasil>
  POST: (path: string, init?: unknown) => Promise<Hasil>
}

function buatError(status: number, body: unknown, cadangan: string): Error {
  let pesan = cadangan
  if (status === 401) pesan = 'Sesi Anda sudah berakhir. Silakan login ulang.'
  else if (status === 403) pesan = 'Akses ditolak.'
  else if (status === 404) pesan = 'Akun mahasiswa tidak ditemukan.'
  else if (status === 429) pesan = 'Terlalu banyak permintaan. Coba lagi nanti.'
  else if (status >= 500) pesan = 'Server sedang bermasalah. Coba lagi nanti.'
  else if (body && typeof body === 'object') {
    const m = (body as { message?: unknown }).message
    if (typeof m === 'string' && m) pesan = m
  }
  return Object.assign(new Error(pesan), { status })
}

export function daftarMahasiswaQueryOptions(
  q: string,
  halaman: number, // 0-based
  perHalaman: number,
) {
  return queryOptions({
    queryKey: ['admin', 'reporter-passwords', q, halaman, perHalaman],
    queryFn: async (): Promise<DaftarMahasiswa> => {
      const { data, error, response } = await client.GET(PATH_DAFTAR, {
        params: {
          query: {
            q: q || undefined,
            page: halaman + 1,
            per_page: perHalaman,
          },
        },
      })
      if (error || !data)
        throw buatError(
          response.status,
          error,
          'Gagal memuat daftar mahasiswa.',
        )
      return data as DaftarMahasiswa
    },
    placeholderData: keepPreviousData,
    retry: false,
  })
}

export function useResetPasswordMahasiswa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number): Promise<HasilReset> => {
      await initializeCsrf()
      const { data, error, response } = await client.POST(PATH_RESET, {
        params: { path: { user: id } },
      })
      if (error || !data)
        throw buatError(response.status, error, 'Gagal mereset password.')
      return (data as { data: HasilReset }).data
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['admin', 'reporter-passwords'],
      }),
  })
}
