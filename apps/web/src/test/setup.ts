import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
})

window.scrollTo = vi.fn()

// jsdom gak nge-evaluate media query. Dua alasan butuh stub ini:
// 1. Sonner (Toaster) manggil `window.matchMedia` pas mount — tanpa stub,
//    semua test yang me-render halaman ber-Toaster crash "not a function".
// 2. Count-up animasi di /verifikasi jalan terus bikin test flaky kalau
//    `matches` selalu false.
// Jadi kita paksa `prefers-reduced-motion: reduce` → `matches: true` buat
// query itu (angka langsung nilai akhir), query lain tetap false.
window.matchMedia = ((query: string) => ({
  matches: query.includes('prefers-reduced-motion'),
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
})) as typeof window.matchMedia
