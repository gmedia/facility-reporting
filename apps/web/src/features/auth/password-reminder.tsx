import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useRouterState } from '@tanstack/react-router'
import { KeyRound } from 'lucide-react'
import { meQueryOptions } from '@/features/auth/auth-query'
import type { User } from '@/features/auth/auth-query'

// false = pengguna boleh menutup pengingat dengan "Nanti saja".
// true  = pengingat tidak bisa ditutup sampai password diganti
//         (halaman Pengaturan tetap bisa dibuka untuk menggantinya).
const WAJIB = false as boolean

// Field ini belum ada di schema.d.ts. Hapus setelah types:generate.
type UserDenganStatus = User & { must_change_password?: boolean }

export function PasswordReminder({ user }: { user: User }) {
  // Baca cache ['me'] langsung supaya pengingat hilang seketika setelah
  // password diganti, tanpa menunggu navigasi berikutnya.
  const { data: me } = useQuery(meQueryOptions)
  const akun: UserDenganStatus = me ?? user

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  // State ini hilang saat pindah ke /login lalu masuk lagi, jadi pengingat
  // muncul lagi di setiap login selama password belum diganti.
  const [ditutup, setDitutup] = useState(false)

  const tampil =
    akun.must_change_password === true &&
    pathname !== '/pengaturan' &&
    (WAJIB || !ditutup)

  useEffect(() => {
    if (!tampil || WAJIB) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDitutup(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tampil])

  if (!tampil) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pw-reminder-judul"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4"
      onClick={() => {
        if (!WAJIB) setDitutup(true)
      }}
    >
      <div
        className="w-full max-w-md rounded-[26px] border border-neutral-200/70 bg-white p-6 shadow-2xl"
        onClick={(event: React.MouseEvent) => event.stopPropagation()}
      >
        <span className="grid size-12 place-items-center rounded-2xl bg-amber-100 text-amber-700">
          <KeyRound aria-hidden="true" className="size-6" />
        </span>

        <h2
          id="pw-reminder-judul"
          className="mt-4 text-lg font-semibold text-[#1d2b26]"
        >
          Ganti password Anda sekarang
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          Akun ini masih memakai password awal yang sama dengan akun lain. Orang
          lain bisa saja masuk ke akun Anda dan mengirim laporan atas nama Anda.
          Buat password baru yang hanya Anda yang tahu.
        </p>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {!WAJIB && (
            <button
              type="button"
              onClick={() => setDitutup(true)}
              className="h-11 rounded-2xl border border-neutral-300 px-5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              Nanti saja
            </button>
          )}
          {/* Langsung ke tab Keamanan (form ganti password). */}
          <Link
            to="/pengaturan"
            search={{ tab: 'keamanan' }}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#0f3d2e] px-5 text-sm font-semibold text-white transition hover:bg-[#1f4d3d]"
          >
            Ganti password
          </Link>
        </div>
      </div>
    </div>
  )
}
