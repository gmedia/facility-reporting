import { createFileRoute, redirect } from '@tanstack/react-router'
import { LaporanList } from '@/features/laporan/laporan-list'

// Role yang boleh melihat laporan SEMUA mahasiswa.
// Sengaja whitelist, bukan blacklist — role baru yang belum dikenal
// otomatis ketolak, bukan kebagian akses.
const PENGELOLA = ['admin', 'super_admin']

export const Route = createFileRoute('/_protected/verifikasi')({
  // /verifikasi khusus pengelola. Mahasiswa dilempar ke /dashboard, bukan
  // /login, karena dia emang udah berhasil login.
  //
  // RIWAYAT RISET 28 OKT (/laporan/saya): route ini dulu bernama /laporan.
  // Waktu itu `laporan/saya.tsx` bakal jadi ANAK file ini, dan guard di
  // bawah ikut nimpa user biasa. Setelah rename ke /verifikasi, file
  // `laporan/saya.tsx` jatuhnya ke parent `_protected` — jadinya aman,
  // gak perlu guard khusus lagi.
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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Verifikasi</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Daftar laporan dari semua mahasiswa.
        </p>
      </div>
      <LaporanList />
    </main>
  )
}
