import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { UserFormDialog } from '@/features/admin/user-form'
import {
  adminUsersQueryOptions,
  errorMessage,
  errorStatus,
  useDeactivateAdminUser,
  type AdminUser,
} from '@/features/admin/users-query'

type SearchSchema = { filter?: string }

export const Route = createFileRoute('/_protected/admin/')({
  // Halaman ini belum punya filter, tapi tombol "Kelola Akun" di dashboard
  // mengirim ?filter=semua (lihat dashboard-actions.tsx). Parameter itu
  // diterima lalu diabaikan: SearchSchema hanya mengenal 'filter' supaya link
  // tetap type-safe, dan AdminUsersPage tidak membacanya sama sekali.
  // Kalau nanti filter status aktif/nonaktif dibuat, pakai nilai ini di UI.
  validateSearch: (search: Record<string, unknown>): SearchSchema => ({
    filter: typeof search.filter === 'string' ? search.filter : undefined,
  }),
  component: AdminUsersPage,
})

// Gaya kartu disamakan dengan dashboard dan verifikasi.
const CARD_CLASS =
  'rounded-[26px] border border-neutral-200/70 bg-white shadow-sm'

function AdminUsersPage() {
  const users = useQuery(adminUsersQueryOptions)
  const deactivateMutation = useDeactivateAdminUser()
  const [form, setForm] = useState<{ open: boolean; user: AdminUser | null }>({
    open: false,
    user: null,
  })
  const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null)

  function handleDeactivate() {
    if (!pendingDelete) return
    deactivateMutation.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success(`Akun ${pendingDelete.name} dinonaktifkan`)
        setPendingDelete(null)
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {users.isPending ? (
        <section className={`flex flex-col gap-3 p-6 ${CARD_CLASS}`}>
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-5/6" />
          <Skeleton className="h-8 w-2/3" />
        </section>
      ) : users.isError ? (
        <ErrorAlert error={users.error} onRetry={() => users.refetch()} />
      ) : (
        <section className={`min-w-0 p-6 ${CARD_CLASS}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold">Daftar akun</h2>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                Total {users.data.length}
              </span>
            </div>
            <Button
              type="button"
              className="rounded-full bg-[#1f6b4f] px-5 text-white hover:bg-[#0d3f31]"
              onClick={() => setForm({ open: true, user: null })}
            >
              Tambah akun
            </Button>
          </div>

          {users.data.length === 0 ? (
            <p className="mt-6 py-6 text-center text-sm text-neutral-400">
              Belum ada akun admin. Klik Tambah akun untuk membuat yang pertama.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <Table className="min-w-[36rem] text-sm">
                <TableHeader>
                  <TableRow className="border-0 hover:bg-transparent">
                    <TableHead className="pl-0 font-medium text-neutral-400">
                      Nama
                    </TableHead>
                    <TableHead className="font-medium text-neutral-400">
                      E-mail
                    </TableHead>
                    <TableHead className="font-medium text-neutral-400">
                      NIM
                    </TableHead>
                    <TableHead className="font-medium text-neutral-400">
                      Peran
                    </TableHead>
                    <TableHead className="pr-0 text-right font-medium text-neutral-400">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.data.map((user) => (
                    <TableRow
                      key={user.id}
                      className="border-t border-neutral-100 hover:bg-[#f7f9f8]"
                    >
                      <TableCell className="py-3 pl-0 font-medium">
                        {user.name}
                      </TableCell>
                      <TableCell className="py-3">
                        {user.email ?? '-'}
                      </TableCell>
                      <TableCell className="py-3 text-neutral-400">
                        {user.nim ?? '-'}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          variant="secondary"
                          className="rounded-full bg-emerald-50 px-2.5 text-xs font-medium text-emerald-800 hover:bg-emerald-50"
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 pr-0 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-full text-xs"
                            onClick={() => setForm({ open: true, user })}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="rounded-full bg-orange-50 text-xs text-orange-600 hover:bg-orange-100 hover:text-orange-700"
                            onClick={() => setPendingDelete(user)}
                          >
                            Nonaktifkan
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      )}

      {pendingDelete && (
        <Alert variant="destructive" className="rounded-[26px]">
          <AlertTitle>Nonaktifkan akun {pendingDelete.name}?</AlertTitle>
          <AlertDescription>
            Akun yang dinonaktifkan tidak dapat login.
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => setPendingDelete(null)}
                disabled={deactivateMutation.isPending}
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="rounded-full"
                onClick={handleDeactivate}
                disabled={deactivateMutation.isPending}
              >
                {deactivateMutation.isPending
                  ? 'Menonaktifkan...'
                  : 'Ya, nonaktifkan'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <UserFormDialog
        key={form.user?.id ?? 'create'}
        open={form.open}
        user={form.user}
        onOpenChange={(open) => setForm((current) => ({ ...current, open }))}
      />
    </div>
  )
}

function ErrorAlert({
  error,
  onRetry,
}: {
  error: unknown
  onRetry: () => void
}) {
  const status = errorStatus(error)

  if (status === 401) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Sesi berakhir</AlertTitle>
        <AlertDescription>
          Silakan login ulang untuk mengelola akun admin.{' '}
          <a href="/login">Ke halaman login</a>
        </AlertDescription>
      </Alert>
    )
  }

  if (status === 403) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Akses ditolak</AlertTitle>
        <AlertDescription>
          Hanya super admin yang boleh mengelola akun admin.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert variant="destructive">
      <AlertTitle>Gagal memuat data</AlertTitle>
      <AlertDescription className="flex items-center gap-3">
        <span>{errorMessage(error)}</span>
        <Button type="button" size="sm" variant="outline" onClick={onRetry}>
          Coba lagi
        </Button>
      </AlertDescription>
    </Alert>
  )
}
