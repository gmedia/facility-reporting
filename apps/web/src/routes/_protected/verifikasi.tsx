import { createFileRoute, redirect } from '@tanstack/react-router'
import { DashboardShell } from '@/features/dashboard/dashboard-shell'
import { LaporanList } from '@/features/laporan/laporan-list'

// Role yang boleh melihat laporan SEMUA mahasiswa.
// Sengaja whitelist, bukan blacklist - role baru yang belum dikenal
// otomatis ketolak, bukan kebagian akses.
const PENGELOLA = ['admin', 'super_admin']

export const Route = createFileRoute('/_protected/verifikasi')({
  // /verifikasi khusus pengelola. Mahasiswa dilempar ke /dashboard, bukan
  // /login, karena dia emang udah berhasil login.
  //
  // RIWAYAT RISET 28 OKT (/laporan/saya): route ini dulu bernama /laporan.
  // Waktu itu `laporan/saya.tsx` bakal jadi ANAK file ini, dan guard di
  // bawah ikut nimpa user biasa. Setelah rename ke /verifikasi, file
  // `laporan/saya.tsx` jatuhnya ke parent `_protected` - jadinya aman,
  // gak perlu guard khusus lagi.
  beforeLoad: ({ context }) => {
    if (!PENGELOLA.includes(context.user.role)) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: LaporanPage,
})

function LaporanPage() {
  const { user } = Route.useRouteContext()

  return (
    <DashboardShell
      user={user}
      header={
        <p className="text-xs font-medium tracking-widest text-neutral-400 uppercase">
          Admin / Verifikasi
        </p>
      }
    >
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Verifikasi</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Daftar laporan dari semua mahasiswa.
          </p>
        </div>
        <LaporanList />
      </div>
    </DashboardShell>
  )
}
