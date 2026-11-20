import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { api, initializeCsrf } from '@/lib/api/client'

export const RADIUS_MIN = 50
export const RADIUS_MAX = 5000

export type LokasiSetting = {
  center_lat: number
  center_lng: number
  radius_m: number
  updated_at: string | null
}

export type LokasiSettingInput = {
  center_lat: number
  center_lng: number
  radius_m: number
}

export type PelaporStatus = 'inside' | 'outside' | 'unknown'

export type PelaporLokasi = {
  id: number
  name: string
  nim: string | null
  lat: number | null
  lng: number | null
  last_location_at: string | null
  distance_m: number | null
  status: PelaporStatus
}

export type RingkasanLokasi = {
  total: number
  outside: number
  inside: number
  unknown: number
  radius_m: number
}

export type PelaporLokasiData = {
  rows: PelaporLokasi[]
  summary: RingkasanLokasi
}

// Titik yang dituju peta. `n` naik tiap kali peta perlu pindah/zoom ulang.
export type Fokus = { lat: number; lng: number; n: number }

// Endpoint lokasi belum ada di schema.d.ts, jadi klien `api` dipakai lewat
// pembungkus bertipe longgar. Hapus setelah `pnpm types:generate` dijalankan
// dengan api.json yang sudah memuat endpoint lokasi.
type Hasil = { data?: unknown; error?: unknown; response: Response }
const http = api as unknown as {
  GET: (path: string) => Promise<Hasil>
  PUT: (path: string, init: { body: unknown }) => Promise<Hasil>
}

const KEY_SETTING = ['admin', 'lokasi', 'setting'] as const
const KEY_PELAPOR = ['admin', 'lokasi', 'pelapor'] as const

export const lokasiSettingQueryOptions = queryOptions({
  queryKey: KEY_SETTING,
  queryFn: async () => {
    const { data, error, response } = await http.GET('/admin/location-settings')
    if (error || !data)
      throw apiError(
        response.status,
        error,
        'Gagal memuat titik pusat dan radius.',
      )
    return (data as { data: LokasiSetting }).data
  },
  retry: false,
})

export const pelaporLokasiQueryOptions = queryOptions({
  queryKey: KEY_PELAPOR,
  queryFn: async (): Promise<PelaporLokasiData> => {
    const { data, error, response } = await http.GET(
      '/admin/reporter-locations',
    )
    if (error || !data)
      throw apiError(response.status, error, 'Gagal memuat lokasi pelapor.')
    const body = data as { data: PelaporLokasi[]; summary: RingkasanLokasi }
    return { rows: body.data, summary: body.summary }
  },
  retry: false,
})

export function useUpdateLokasiSetting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: LokasiSettingInput) => {
      await initializeCsrf()
      const { data, error, response } = await http.PUT(
        '/admin/location-settings',
        { body: input },
      )
      if (error || !data)
        throw apiError(
          response.status,
          error,
          'Gagal menyimpan titik pusat dan radius.',
        )
      return (data as { data: LokasiSetting }).data
    },
    onSuccess: async (hasil) => {
      queryClient.setQueryData(KEY_SETTING, hasil)
      // Jarak dan status tiap pelapor dihitung backend dari titik pusat.
      await queryClient.invalidateQueries({ queryKey: KEY_PELAPOR })
    },
  })
}

// ---- Pencarian tempat (Nominatim / OpenStreetMap, tanpa API key) ----
// Kebijakan Nominatim: maksimal 1 permintaan per detik dan tanpa
// autocomplete, jadi pencarian hanya dijalankan saat tombol Enter ditekan.

export type Tempat = { id: number; nama: string; lat: number; lng: number }

export async function cariTempat(kata: string): Promise<Tempat[]> {
  const params = new URLSearchParams({
    q: kata,
    format: 'jsonv2',
    limit: '5',
    countrycodes: 'id',
    'accept-language': 'id',
  })
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    { headers: { Accept: 'application/json' } },
  )
  if (!res.ok) throw new Error('Pencarian gagal.')

  const rows = (await res.json()) as Array<{
    place_id: number
    display_name: string
    lat: string
    lon: string
  }>
  return rows.map((r) => ({
    id: r.place_id,
    nama: r.display_name,
    lat: Number(r.lat),
    lng: Number(r.lon),
  }))
}

// ---- Error ----

function apiError(status: number, body: unknown, fallback: string): Error {
  const pesanApi =
    body &&
    typeof body === 'object' &&
    typeof (body as { message?: unknown }).message === 'string'
      ? (body as { message: string }).message
      : null

  let message = fallback
  if (status === 401) message = 'Sesi Anda sudah berakhir. Silakan login ulang.'
  else if (status === 403)
    message = 'Akses ditolak. Hanya super admin yang boleh.'
  else if (status === 422 && pesanApi) message = pesanApi
  else if (status === 429)
    message = 'Terlalu banyak permintaan. Coba lagi nanti.'
  else if (status >= 500) message = 'Server sedang bermasalah. Coba lagi nanti.'

  const error = new Error(message)
  // `errors` (detail per field dari Laravel) ikut menempel di error supaya
  // fieldErrors() bisa membacanya.
  Object.assign(error, { status }, body ?? {})
  error.message = message
  return error
}

export function errorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.length > 0) return message
  }
  return 'Terjadi kesalahan. Silakan coba lagi.'
}

export function fieldErrors(error: unknown): Record<string, string[]> | null {
  if (error && typeof error === 'object' && 'errors' in error) {
    const errors = (error as { errors?: unknown }).errors
    if (errors && typeof errors === 'object')
      return errors as Record<string, string[]>
  }
  return null
}
