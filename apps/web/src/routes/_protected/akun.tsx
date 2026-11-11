import { createFileRoute } from '@tanstack/react-router'
import { AkunPage } from '@/features/akun/akun-page'

export const Route = createFileRoute('/_protected/akun')({
  // Semua role yang sudah login boleh membuka /akun (mahasiswa, admin,
  // super admin). Bingkai halamannya dipilih di AkunPage sesuai role.
  component: AkunPage,
})

// Catatan struktur: untuk mahasiswa, tidak ada <main> dan tidak ada
// mx-auto — UserShell sudah menyediakan wadahnya, sama seperti halaman
// /lapor dan /laporan/saya. Untuk admin, AkunPage membungkus isinya
// sendiri dengan DashboardShell. Isinya dua kartu (Foto Profil &
// Keamanan) di features/akun/akun-page.tsx.