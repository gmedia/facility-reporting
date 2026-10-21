import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

// ============================================================
// Status laporan (LaporanStatus di schema.d.ts).
// Record<> bikin kuncinya type-safe: backend nambah status tanpa
// update baris ini = tsc langsung merah, jadi gak mungkin kelewat.
// ============================================================
export type LaporanStatus = components['schemas']['LaporanStatus']

export const STATUS_LABEL: Record<LaporanStatus, string> = {
  menunggu_verifikasi: 'Menunggu Verifikasi',
  valid: 'Valid',
  ditolak: 'Ditolak',
  diproses: 'Diproses',
  selesai: 'Selesai',
}

export const STATUS_VALUES = Object.keys(STATUS_LABEL) as LaporanStatus[]

// Tones dipakai laporan-list.tsx buat nge-style badge-nya.
export const STATUS_TONE: Record<LaporanStatus, string> = {
  menunggu_verifikasi: 'bg-amber-100 text-amber-800 ring-amber-200',
  valid: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  ditolak: 'bg-red-100 text-red-800 ring-red-200',
  diproses: 'bg-sky-100 text-sky-800 ring-sky-200',
  selesai: 'bg-neutral-100 text-neutral-700 ring-neutral-200',
}

// Daftar laporan. Backend sudah menyeleksi per role:
//   user → cuma laporannya sendiri, admin/super_admin → semua.
// Jadi gak perlu difilter lagi di sisi klien.
export function useLaporanList() {
  return useQuery({
    queryKey: ['laporan', 'list'],
    queryFn: async () => {
      const { data, error, response } = await api.GET('/reports')
      if (error || !data) {
        throw apiError(response.status, error, 'Gagal memuat daftar laporan.')
      }
      return data.data
    },
  })
}

// Aksi admin: ubah status lewat PATCH /reports/{laporan}/status.
export function useUpdateLaporanStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: number
      status: LaporanStatus
    }) => {
      await initializeCsrf() // wajib — lupa = 419 Page Expired

      const { data, error, response } = await api.PATCH(
        '/reports/{laporan}/status',
        { params: { path: { laporan: id } }, body: { status } },
      )

      if (error || !data) {
        throw apiError(response.status, error, 'Gagal mengubah status laporan.')
      }

      return data.data
    },
    onSuccess: () => {
      // Tabelnya list-based, jadi invalidasi per-kunci 'laporan' cukup
      // buat nimpa list sekaligus (queryFn-nya pakai prefix yang sama).
      void queryClient.invalidateQueries({ queryKey: ['laporan'] })
    },
  })
}

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
