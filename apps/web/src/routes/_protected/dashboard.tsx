import { createFileRoute } from '@tanstack/react-router'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { User } from '@/features/auth/auth-query'
import { DashboardActions } from '@/features/dashboard/dashboard-actions'
import { hitungStatistik } from '@/features/dashboard/dashboard-query'
import { DashboardRecent } from '@/features/dashboard/dashboard-recent'
import { DashboardStats } from '@/features/dashboard/dashboard-stats'
import { useLaporanList } from '@/features/laporan/laporan-query'

export const Route = createFileRoute('/_protected/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { user } = Route.useRouteContext()
  const laporan = useLaporanList()

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Halo, {user.name}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">{identitas(user)}</p>
        </div>
        <DashboardActions role={user.role} />
      </div>

      {laporan.isPending ? (
        <DashboardSkeleton />
      ) : laporan.isError ? (
        <Alert variant="destructive" className="mt-6">
          <AlertTitle>Gagal memuat dashboard</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            {laporan.error.message}
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-xl"
              onClick={() => laporan.refetch()}
            >
              Coba lagi
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          <DashboardStats statistik={hitungStatistik(laporan.data)} />
          <DashboardRecent laporans={laporan.data} role={user.role} />
        </div>
      )}
    </main>
  )
}

function identitas(user: User): string {
  if (user.role === 'user') {
    return ['user', user.nim ? `NIM ${user.nim}` : null]
      .filter(Boolean)
      .join(' · ')
  }
  return [user.role, user.email].filter(Boolean).join(' · ')
}

const KARTU_SKELETON = ['total', 'menunggu', 'diproses', 'selesai']
const BARIS_SKELETON = ['satu', 'dua', 'tiga']

function DashboardSkeleton() {
  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {KARTU_SKELETON.map((key) => (
          <Skeleton key={key} className="h-[158px] rounded-[26px]" />
        ))}
      </div>
      <div className="rounded-[26px] border-[1.5px] border-[#efe9d8] bg-white p-6">
        <Skeleton className="h-6 w-40" />
        <div className="mt-4 flex flex-col gap-3">
          {BARIS_SKELETON.map((key) => (
            <Skeleton key={key} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
