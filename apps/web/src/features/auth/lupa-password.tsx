import { KeyRound } from 'lucide-react'

// Isi sesuai tempat dan kontak admin yang sebenarnya.
const TEMPAT_RESET = 'Kantor Administrasi Fakultas'
const KONTAK_ADMIN = 'WhatsApp admin: 08xx-xxxx-xxxx'

export function LupaPassword({ terbuka = false }: { terbuka?: boolean }) {
  return (
    <details
      open={terbuka || undefined}
      className="mt-4 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-[#0d3f31] outline-none focus-visible:ring-2 focus-visible:ring-[#1e6a52]/25">
        <KeyRound aria-hidden="true" className="size-4" />
        Lupa password?
      </summary>
      <div className="mt-3 space-y-2 text-neutral-600">
        <p>
          Password tidak bisa dipulihkan sendiri. Minta admin mereset akunmu:
        </p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Temui admin di <b>{TEMPAT_RESET}</b> atau hubungi lewat{' '}
            <b>{KONTAK_ADMIN}</b>.
          </li>
          <li>Bawa KTM atau identitas lain, admin akan memeriksanya dulu.</li>
          <li>
            Admin memberikan password sementara. Masuk dengan password itu, lalu
            buat password baru.
          </li>
        </ol>
      </div>
    </details>
  )
}
