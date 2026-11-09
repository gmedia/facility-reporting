import { createFileRoute, redirect } from '@tanstack/react-router'
import { AkunPage } from '@/features/akun/akun-page'

export const Route = createFileRoute('/_protected/akun')({
  // /akun khusus mahasiswa, sama seperti /lapor dan /laporan/saya.
  // Role lain -> /dashboard, karena dia emang udah berhasil login.
  beforeLoad: ({ context }) => {
    if (context.user.role !== 'user') throw redirect({ to: '/dashboard' })
  },
  component: AkunPage,
})

// Catatan struktur: tidak ada <main> dan tidak ada mx-auto — UserShell
// sudah menyediakan wadahnya, sama seperti halaman /lapor dan
// /laporan/saya. Isinya dua kartu (Foto Profil & Keamanan) di
// features/akun/akun-page.tsx.
