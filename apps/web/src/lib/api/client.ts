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

// Token CSRF terakhir dari /sanctum/csrf-cookie.
// Saat web dan API beda domain (Vercel ↔ Railway) cookie `XSRF-TOKEN`
// tersimpan di domain API, sehingga `document.cookie` di halaman web TIDAK
// bisa membacanya. Karena itu API mengirim token yang sama sebagai header
// respons `XSRF-TOKEN` (lihat ExposeCsrfTokenHeader di API) dan header itu
// dibaca di sini lalu disimpan di memori.
let csrfToken: string | null = null

function tokenDariCookie(): string | null {
  const raw = document.cookie
    .split('; ')
    .find((part) => part.startsWith('XSRF-TOKEN='))
    ?.slice('XSRF-TOKEN='.length)

  return raw ? decodeURIComponent(raw) : null
}

api.use({
  onRequest({ request }) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return request

    // Cookie hanya jadi cadangan (mis. saat dev, API satu domain).
    const token = csrfToken ?? tokenDariCookie()
    if (token) request.headers.set('X-XSRF-TOKEN', token)
    return request
  },
})

export async function initializeCsrf(): Promise<void> {
  const response = await fetch(`${apiOrigin()}/sanctum/csrf-cookie`, {
    credentials: 'include',
  })
  if (!response.ok) throw new Error('CSRF initialization failed')

  const dariHeader = response.headers.get('XSRF-TOKEN')
  csrfToken = dariHeader ? decodeURIComponent(dariHeader) : tokenDariCookie()
}
