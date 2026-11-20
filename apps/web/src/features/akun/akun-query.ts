import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, initializeCsrf } from '@/lib/api/client'
import { apiError } from '@/features/laporan/laporan-query'
import type { components } from '@/lib/api/schema'

type ChangePasswordRequest = components['schemas']['ChangePasswordRequest']

export type ChangePasswordInput = Omit<
  ChangePasswordRequest,
  'current_password'
> &
  Partial<Pick<ChangePasswordRequest, 'current_password'>>

// POST /profile/foto — upload foto profil milik user yang sedang login.
export function useUpdateFoto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      await initializeCsrf() // wajib — lupa = 419 Page Expired

      const form = new FormData()
      form.append('foto', file)

      // Pola yang sama dengan upload foto laporan: schema mengetik `foto`
      // sebagai string (OpenAPI "format: binary"), padahal isi FormData
      // berisi File. Cast sekali di sini — jangan ke file generated.
      const { data, error, response } = await api.POST('/profile/foto', {
        body: form as unknown as components['schemas']['UpdateProfileFotoRequest'],
      })

      if (error || !data) {
        throw apiError(response.status, error, 'Foto profil gagal diunggah.')
      }

      return data.data
    },
    onSuccess: (user) => {
      // Timpa cache /auth/me — pratinjau foto di halaman /pengaturan langsung
      // berubah tanpa perlu navigasi (komponennya membaca cache yang sama).
      queryClient.setQueryData(['me'], user)
    },
  })
}

// PATCH /profile/password — ganti password. `current_password` boleh
// dihilangkan untuk akun hasil reset admin (must_change_password = true).
export function useChangePassword() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ChangePasswordInput) => {
      await initializeCsrf()

      const { data, error, response } = await api.PATCH('/profile/password', {
        // Backend mengizinkan current_password tidak dikirim untuk akun hasil reset.
        // OpenAPI belum dapat menggambarkan validasi kondisional tersebut.
        body: input as components['schemas']['ChangePasswordRequest'],
      })

      if (error || !data) {
        throw apiError(response.status, error, 'Password gagal diperbarui.')
      }

      return data.message
    },
    onSuccess: () => {
      // Server mengisi password_changed_at, jadi flag must_change_password
      // berubah. Muat ulang /auth/me supaya form dan pengingat ikut berubah.
      void queryClient.invalidateQueries({ queryKey: ['me'] })
    },
  })
}

// Duplikat kecil dari features/laporan/riwayat-list.tsx: fotoUrl di sana
// tidak di-export karena file .tsx hanya boleh export komponen
// (react-refresh). Alasan sama dengan duplikasi apiError di laporan-query.
export function fotoUrl(foto: string): string {
  if (/^(https?:|data:|blob:)/.test(foto)) return foto

  const dasar = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
  const origin = /^https?:\/\//.test(dasar)
    ? dasar.replace(/\/api\/v\d+\/?$/, '')
    : ''

  return `${origin}/storage/${foto.replace(/^\/+/, '')}`
}
