import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/admin/pengaturan')({
  component: PengaturanPage,
})

function PengaturanPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold tracking-tight">Pengaturan</h1>
      <p className="text-muted-foreground text-sm">
        Halaman pengaturan (kriteria & bobot SAW) akan tersedia pada sprint
        berikutnya.
      </p>
    </div>
  )
}
