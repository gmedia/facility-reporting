import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { UserFormDialog } from '@/features/admin/user-form'
import {
  adminUsersQueryOptions,
  errorMessage,
  errorStatus,
  useDeleteAdminUser,
  type AdminUser,
} from '@/features/admin/users-query'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_protected/admin/')({
  component: AdminUsersPage,
})

// Palet ngikutin halaman user & dashboard pengelola: sidebar #0d3f31,
// area #f5f7f6, kartu putih border netral, aksen #0d3f31 / #e6f2ec.
const CARD = 'rounded-[26px] border-[1.5px] border-black/5 bg-white p-6'
const CHIP =
  'rounded-[10px] bg-[#e6f2ec] px-3.5 py-1 text-sm font-medium text-[#15803d]'
const TOMBOL_UTAMA =
  'h-11 rounded-2xl bg-[#0d3f31] px-5 text-white hover:bg-[#0a3127]'
const TOMBOL_BARIS =
  'h-9 rounded-[10px] border border-black/10 bg-white px-3.5 text-sm font-medium text-[#0d3f31] transition-colors hover:bg-[#0d3f31]/6'
const TOMBOL_HAPUS =
  'h-9 rounded-[10px] bg-red-50 px-3.5 text-sm font-medium text-red-700 hover:bg-red-100'
const PERAN_PILL: Record<string, string> = {
  super_admin: 'bg-[#e6f2ec] text-[#15803d]',
  admin: 'bg-[#eef1f0] text-neutral-500',
}

function AdminUsersPage() {
  const users = useQuery(adminUsersQueryOptions)
  const deleteMutation = useDeleteAdminUser()
  const [form, setForm] = useState<{ open: boolean; user: AdminUser | null }>({
    open: false,
    user: null,
  })
  const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null)

  function handleDelete() {
    if (!pendingDelete) return
    deleteMutation.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success(`Akun ${pendingDelete.name} dihapus`)
        setPendingDelete(null)
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[32px] leading-tight font-bold tracking-tight text-neutral-900">
            Akun Admin
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Kelola akun dengan role admin.
          </p>
        </div>
        <Button
          type="button"
          className={TOMBOL_UTAMA}
          onClick={() => setForm({ open: true, user: null })}
        >
          Tambah akun
        </Button>
      </div>

      {users.isPending ? (
        <AdminSkeleton />
      ) : users.isError ? (
        <ErrorAlert error={users.error} onRetry={() => users.refetch()} />
      ) : (
        <section className={CARD}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Daftar akun</h2>
            <span className={CHIP}>{users.data.length} akun terdaftar</span>
          </div>

          {users.data.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-500">
              Belum ada akun admin. Klik Tambah akun untuk membuat yang pertama.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[44rem] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-neutral-500">
                    <th className="border-b border-black/5 py-2 font-normal">
                      Nama
                    </th>
                    <th className="border-b border-black/5 py-2 font-normal">
                      Email
                    </th>
                    <th className="border-b border-black/5 py-2 font-normal">
                      NIM
                    </th>
                    <th className="border-b border-black/5 py-2 font-normal">
                      Role
                    </th>
                    <th className="border-b border-black/5 py-2 text-right font-normal">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.data.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-black/5 last:border-0 hover:bg-[#0d3f31]/4"
                    >
                      <td className="py-3 pr-4 font-medium text-neutral-900">
                        {user.name}
                      </td>
                      <td className="py-3 pr-4 text-neutral-900">
                        {user.email ?? '-'}
                      </td>
                      <td className="py-3 pr-4 text-neutral-500">
                        {user.nim ?? '-'}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={cn(
                            'inline-flex rounded-[10px] px-3 py-1 text-sm font-medium whitespace-nowrap',
                            PERAN_PILL[user.role] ??
                              'bg-[#eef1f0] text-neutral-500',
                          )}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className={TOMBOL_BARIS}
                            onClick={() => setForm({ open: true, user })}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            className={TOMBOL_HAPUS}
                            onClick={() => setPendingDelete(user)}
                          >
                            Hapus
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {pendingDelete && (
        <Alert variant="destructive">
          <AlertTitle>Hapus akun {pendingDelete.name}?</AlertTitle>
          <AlertDescription>
            Tindakan ini tidak bisa dibatalkan.
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPendingDelete(null)}
                disabled={deleteMutation.isPending}
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Menghapus...' : 'Ya, hapus'}
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

function AdminSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <section className={cn(CARD, 'flex flex-col gap-4')}>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-5/6" />
        <Skeleton className="h-9 w-2/3" />
      </section>
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
