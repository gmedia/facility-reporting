import { createFileRoute, redirect } from '@tanstack/react-router'
import { LaporanList } from '@/features/laporan/laporan-list'

// Role yang boleh melihat laporan SEMUA mahasiswa.
// Sengaja whitelist, bukan blacklist — role baru yang belum dikenal
// otomatis ketolak, bukan kebagian akses.
const PENGELOLA = ['admin', 'super_admin']

export const Route = createFileRoute('/_protected/laporan')({
  // /laporan khusus pengelola. Mahasiswa dilempar ke /dashboard, bukan
  // /login, karena dia emang udah berhasil login.
  //
  // ⚠️ CATATAN BUAT RIWAYAT 28 OKT (/laporan/saya):
  // di routing berbasis file, file `laporan/saya.tsx` jadi ANAK dari file
  // ini, jadi guard di atas juga menimpanya — user biasa bakal kelempar.
  // Kalau nanti mau nambah riwayat user, taruh di path yang GAK bersarang
  // (mis. /riwayat), atau guard-nya harus ngecek `location.pathname`.
  beforeLoad: ({ context }) => {
    if (!PENGELOLA.includes(context.user.role)) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: LaporanPage,
})

function LaporanPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <LaporanList />
    </main>
  )
}
