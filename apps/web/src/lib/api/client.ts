import createClient from 'openapi-fetch'
import type { paths } from './schema'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

// Kalau API ada di origin lain (mis. web di Vercel, API di Railway), cookie
// CSRF harus diambil dari origin API. Path relatif hanya benar saat dev
// (proxy Vite) atau saat API dan web satu domain.
function apiOrigin(): string {
  if (!/^https?:\/\//.test(API_BASE_URL)) return ''
  return API_BASE_URL.replace(/\/api\/v\d+\/?$/, '')
}

export const api = createClient<paths>({
  baseUrl: API_BASE_URL,
  credentials: 'include',
  // Tanpa header ini browser kirim `Accept: */*` -> Laravel anggap bukan JSON,
  // coba redirect ke route('login') yang belum ada -> 500, bukan 401.
  headers: { Accept: 'application/json' },
})

api.use({
  onRequest({ request }) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return request

    const token = document.cookie
      .split('; ')
      .find((part) => part.startsWith('XSRF-TOKEN='))
      ?.slice('XSRF-TOKEN='.length)

    if (token) request.headers.set('X-XSRF-TOKEN', decodeURIComponent(token))
    return request
  },
})

export async function initializeCsrf(): Promise<void> {
  const response = await fetch(`${apiOrigin()}/sanctum/csrf-cookie`, {
    credentials: 'include',
  })
  if (!response.ok) throw new Error('CSRF initialization failed')
}
