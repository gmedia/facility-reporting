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
  useActivateAdminUser,
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
  const activateMutation = useActivateAdminUser()
  const [form, setForm] = useState<{ open: boolean; user: AdminUser | null }>({
    open: false,
    user: null,
  })
  const [pendingAction, setPendingAction] = useState<{
    user: AdminUser | null
    type: 'activate' | 'deactivate' | null
  }>({ user: null, type: null })

  function handleActivate() {
    const user = pendingAction.user
    if (!user) return
    activateMutation.mutate(user.id, {
      onSuccess: () => {
        toast.success(`Akun ${user.name} diaktifkan`)
        setPendingAction({ user: null, type: null })
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  function handleDeactivate() {
    const user = pendingAction.user
    if (!user) return
    deactivateMutation.mutate(user.id, {
      onSuccess: () => {
        toast.success(`Akun ${user.name} dinonaktifkan`)
        setPendingAction({ user: null, type: null })
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  const isPending = deactivateMutation.isPending || activateMutation.isPending

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
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="rounded-full bg-emerald-50 px-2.5 text-xs font-medium text-emerald-800 hover:bg-emerald-50"
                          >
                            {user.role}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={`rounded-full px-2.5 text-xs font-medium ${
                              user.active
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                                : 'bg-red-100 text-red-700 hover:bg-red-100'
                            }`}
                          >
                            {user.active ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </div>
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
                          {/* Label & gaya mengikuti AKSI yang akan dijalankan,
                              bukan status barisnya: akun aktif ditawari
                              "Nonaktifkan" (merah), akun nonaktif ditawari
                              "Aktifkan" (hijau). Issue #115 — dulu kebalik. */}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className={`rounded-full text-xs ${
                              user.active
                                ? 'bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800'
                            }`}
                            onClick={() =>
                              setPendingAction({
                                user,
                                type: user.active ? 'deactivate' : 'activate',
                              })
                            }
                          >
                            {user.active ? 'Nonaktifkan' : 'Aktifkan'}
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

      {pendingAction.user && (
        <Alert
          variant={
            pendingAction.type === 'deactivate' ? 'destructive' : 'default'
          }
          className="rounded-[26px]"
        >
          <AlertTitle>
            {pendingAction.type === 'activate'
              ? `Aktifkan akun ${pendingAction.user.name}?`
              : `Nonaktifkan akun ${pendingAction.user.name}?`}
          </AlertTitle>
          <AlertDescription>
            {pendingAction.type === 'activate'
              ? 'Akun yang diaktifkan dapat login kembali.'
              : 'Akun ini tidak akan bisa login sampai diaktifkan kembali.'}
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => setPendingAction({ user: null, type: null })}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                variant={
                  pendingAction.type === 'deactivate'
                    ? 'destructive'
                    : 'default'
                }
                className={`rounded-full ${
                  pendingAction.type === 'activate'
                    ? 'bg-[#1f6b4f] text-white hover:bg-[#0d3f31]'
                    : ''
                }`}
                onClick={
                  pendingAction.type === 'activate'
                    ? handleActivate
                    : handleDeactivate
                }
                disabled={isPending}
              >
                {isPending
                  ? pendingAction.type === 'activate'
                    ? 'Mengaktifkan...'
                    : 'Menonaktifkan...'
                  : pendingAction.type === 'activate'
                    ? 'Ya, aktifkan'
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
