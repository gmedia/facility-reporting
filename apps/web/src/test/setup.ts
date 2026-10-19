import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
})

window.scrollTo = vi.fn()

// jsdom gak mengimplementasikan matchMedia. Sonner (Toaster) memanggil
// `window.matchMedia` pas komponennya mount, jadi tanpa stub ini semua
// test yang me-render halaman ber-Toaster bakal crash dengan
// "window.matchMedia is not a function".
// Stub-nya cuma balikin `matches: false` — gak ngaruh ke logika test mana pun.
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
}
