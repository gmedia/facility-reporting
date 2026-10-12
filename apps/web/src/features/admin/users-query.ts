import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { api, initializeCsrf } from '@/lib/api/client'
import type { components } from '@/lib/api/schema'

export type AdminUser = components['schemas']['UserResource']
export type StoreUserInput = components['schemas']['StoreUserRequest']
export type UpdateUserInput = components['schemas']['UpdateUserRequest']

export const adminUsersQueryOptions = queryOptions({
  queryKey: ['admin', 'users'],
  queryFn: async () => {
    const { data, error, response } = await api.GET('/admin/users')
    if (error || !data)
      throw apiError(response.status, error, 'Gagal memuat daftar akun admin.')
    return data.data
  },
  retry: false,
})

export function useCreateAdminUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: StoreUserInput) => {
      await initializeCsrf()
      const { data, error, response } = await api.POST('/admin/users', {
        body: input,
      })
      if (error || !data)
        throw apiError(response.status, error, 'Gagal menambah akun admin.')
      return data.data
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { id: number; values: UpdateUserInput }) => {
      await initializeCsrf()
      const { data, error, response } = await api.PUT('/admin/users/{user}', {
        params: { path: { user: input.id } },
        body: input.values,
      })
      if (error || !data)
        throw apiError(response.status, error, 'Gagal memperbarui akun.')
      return data.data
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await initializeCsrf()
      const { error, response } = await api.DELETE('/admin/users/{user}', {
        params: { path: { user: id } },
      })
      if (error) throw apiError(response.status, error, 'Gagal menghapus akun.')
      return id
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

function apiError(status: number, body: unknown, fallback: string): Error {
  const message = messageFor(status, fallback)
  const error = new Error(message)
  Object.assign(error, { status }, body ?? {})
  error.message = message
  return error
}

function messageFor(status: number, fallback: string): string {
  if (status === 401) return 'Sesi Anda sudah berakhir. Silakan login ulang.'
  if (status === 403) return 'Akses ditolak. Hanya super admin yang boleh.'
  if (status === 404) return 'Data tidak ditemukan.'
  if (status === 422) return 'Data yang dikirim tidak valid.'
  if (status === 429) return 'Terlalu banyak permintaan. Coba lagi nanti.'
  if (status >= 500) return 'Server sedang bermasalah. Coba lagi nanti.'
  return fallback
}

export function errorStatus(error: unknown): number {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status?: unknown }).status
    if (typeof status === 'number') return status
  }
  return 0
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
