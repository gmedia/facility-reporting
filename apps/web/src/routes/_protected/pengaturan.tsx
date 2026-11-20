import { createFileRoute } from '@tanstack/react-router'
import { PengaturanPage } from '@/features/akun/akun-page'

// Daftar tab yang boleh diminta lewat alamat (?tab=...). Sengaja ditulis di
// sini juga (bukan diimpor dari akun-page) supaya route tidak saling
// bergantung dengan komponen halamannya.
const TAB = ['profil', 'keamanan', 'bantuan'] as const
type Tab = (typeof TAB)[number]

export const Route = createFileRoute('/_protected/pengaturan')({
  // Parameter opsional. Nilai yang tidak dikenal dibuang, jadi alamat seperti
  // /pengaturan?tab=ngawur tetap aman dan jatuh ke tab Profil.
  validateSearch: (search: Record<string, unknown>): { tab?: Tab } => {
    const tab = TAB.find((item) => item === search.tab)
    return tab ? { tab } : {}
  },
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
