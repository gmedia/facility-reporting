import { mutationOptions, queryOptions } from '@tanstack/react-query'
import { api, initializeCsrf } from '@/lib/api/client'
import type { components } from '@/lib/api/schema'

export type User = components['schemas']['UserResource']
export type LoginInput = components['schemas']['LoginRequest']

// GET /auth/me — buat guard & nampilin user
export const meQueryOptions = queryOptions({
  queryKey: ['me'],
  queryFn: async () => {
    const { data, error } = await api.GET('/auth/me')
    if (error || !data) throw new Error('Unauthenticated')
    return data.data // response dibungkus `data`
  },
  retry: false, // 401 jangan di-retry
  staleTime: 0, // guard selalu cek ulang
})

// POST /auth/login
export const loginMutationOptions = mutationOptions({
  mutationFn: async (input: LoginInput) => {
    await initializeCsrf() // WAJIB — lupa = 419 Page Expired
    const { data, error, response } = await api.POST('/auth/login', {
      body: input,
    })
    if (error || !data) {
      // Isi body error (`message` / `errors`) tetap ikut, ditambah `status`
      // supaya form bisa membedakan 429 (terlalu banyak percobaan) dari
      // salah password.
      throw Object.assign(new Error('Login gagal'), (error ?? {}) as object, {
        status: response.status,
      })
    }
    return data.data
  },
})

// POST /auth/logout (dipakai Anas nanti, sekalian bikin)
export const logoutMutationOptions = mutationOptions({
  mutationFn: async () => {
    const { error } = await api.POST('/auth/logout')
    if (error) throw error
  },
})

// Step 17: role → tujuan redirect.
// Semua role mendarat di /dashboard. Super admin tetap bisa membuka
// Akun Admin dan Lokasi Akun lewat sidebar. Kalau suatu role perlu halaman
// awal sendiri, tambahkan di tabel ini.
const HOME_PER_ROLE: Record<string, string> = {}

export function homeFor(role: string): string {
  return HOME_PER_ROLE[role] ?? '/dashboard'
}
