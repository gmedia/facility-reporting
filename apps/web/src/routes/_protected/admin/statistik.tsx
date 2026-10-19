import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/admin/statistik')({
  component: StatistikPage,
})

function StatistikPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-xl font-semibold tracking-tight">Statistik</h1>
      <p className="text-muted-foreground text-sm">
        Halaman statistik laporan akan tersedia pada sprint berikutnya.
      </p>
    </div>
  )
}
