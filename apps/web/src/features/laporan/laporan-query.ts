import { useMutation } from '@tanstack/react-query'
import { api, initializeCsrf } from '@/lib/api/client'
import type { components } from '@/lib/api/schema'

export type LaporanKategori = components['schemas']['LaporanKategori']
export type Laporan = components['schemas']['LaporanResource']

// Kunci objek ini = nilai enum di backend. Kalau backend nambah kategori,
// tambah di sini + jalankan `pnpm --dir apps/web types:generate`.
export const KATEGORI_LABEL: Record<LaporanKategori, string> = {
  elektronik: 'Elektronik',
  furnitur: 'Furnitur',
  mekanik: 'Mekanik',
  bangunan: 'Bangunan',
  lainnya: 'Lainnya',
}

// Record<> bikin daftar kuncinya type-safe — nambah kategori tanpa update
// baris ini bakal kena error di tsc, jadi gak mungkin kelewat.
export const KATEGORI_VALUES = Object.keys(KATEGORI_LABEL) as LaporanKategori[]

export type LaporanFormValues = {
  kategori: LaporanKategori
  lokasi: string
  deskripsi: string
  foto?: FileList
}

// Sama dengan validasi backend (Billy, PR #33)
export const BATAS_FOTO_BYTE = 2048 * 1024

// Format yang diterima backend — daftar dari kontrak Khaiz (issue #38).
// `image/jpg` sengaja gak ada: browser selalu ngirim `image/jpeg` untuk
// file .jpg. `image/jpg` itu nilai non-standar, cuma dipakai di nama
// ekstensi, bukan di MIME type.
export const FOTO_MIME_IZIN: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

// Dipakai di atribut `accept` supaya file picker cuma menawarkan format
// yang bakal diterima server — `image/*` kelebaran, ikut nimpa GIF/SVG/BMP.
export const FOTO_ACCEPT = FOTO_MIME_IZIN.join(',')

export function useCreateLaporan() {
  return useMutation({
    mutationFn: async (values: LaporanFormValues) => {
      await initializeCsrf() // wajib — lupa = 419 Page Expired

      const form = new FormData()
      form.append('kategori', values.kategori)
      form.append('lokasi', values.lokasi)
      form.append('deskripsi', values.deskripsi)

      const file = values.foto?.[0]
      if (file) form.append('foto', file)

      // schema.d.ts ngetik `foto` sebagai `string` (OpenAPI "format: binary"),
      // padahal yang dikirim FormData berisi File. Cast sekali di sini aja —
      // jangan di-commit ke file generated.
      const { data, error, response } = await api.POST('/reports', {
        body: form as unknown as components['schemas']['StoreLaporanRequest'],
      })

      if (error || !data) {
        throw apiError(
          response.status,
          error,
          'Laporan gagal dikirim. Silakan coba lagi.',
        )
      }

      return data.data
    },
  })
}

// ============================================================
// Helper error. Sengaja diduplikat dari features/admin/users-query.ts
// supaya nggak nyasar ke folder Anas. Debt kecil — kalau nanti mau
// digabung, bikin lib/api/errors.ts dulu bareng tim.
// ============================================================
function apiError(status: number, body: unknown, fallback: string): Error {
  const error = new Error(messageFor(status, fallback))
  Object.assign(error, { status }, body ?? {})
  return error
}

function messageFor(status: number, fallback: string): string {
  if (status === 401) return 'Sesi Anda sudah berakhir. Silakan login ulang.'
  if (status === 403) return 'Akses ditolak.'
  if (status === 422) return 'Data yang dikirim tidak valid.'
  if (status === 429) return 'Terlalu banyak permintaan. Coba lagi nanti.'
  if (status >= 500) return 'Server sedang bermasalah. Coba lagi nanti.'
  return fallback
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
