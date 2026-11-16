import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
})

window.scrollTo = vi.fn()

// jsdom tidak sepenuhnya mengimplementasikan DataTransfer,
// yang dipakai foto-input.tsx dan laporan-form.tsx untuk
// membungkus File menjadi FileList lewat `new DataTransfer()`.
if (typeof window.DataTransfer === 'undefined') {
  window.DataTransfer = class DataTransfer {
    private _files: File[] = []
    get items() {
      return {
        add: (file: File) => {
          this._files.push(file)
        },
      }
    }
    get files() {
      return this._files as unknown as FileList
    }
  } as unknown as typeof DataTransfer
}

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
