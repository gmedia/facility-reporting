import { createFileRoute } from '@tanstack/react-router'
import { PengaturanPage } from '@/features/akun/akun-page'

export const Route = createFileRoute('/_protected/pengaturan')({
  // Semua role yang sudah login boleh membuka /pengaturan (mahasiswa,
  // admin, super admin). Bingkai halamannya dipilih di PengaturanPage
  // sesuai role.
  component: PengaturanPage,
})

// Catatan struktur: untuk mahasiswa, tidak ada <main> dan tidak ada
// mx-auto — UserShell sudah menyediakan wadahnya, sama seperti halaman
// /lapor dan /laporan/saya. Untuk admin, PengaturanPage membungkus
// isinya sendiri dengan DashboardShell.
//
// Dulu rutenya /akun (issue #93); sejak #113 halamannya berganti nama
// jadi Pengaturan — tiga bagian: Kelola Akun (foto), Keamanan (password),
// dan Bantuan (QnA pindahan dari Beranda). Isinya di
// features/akun/akun-page.tsx.
