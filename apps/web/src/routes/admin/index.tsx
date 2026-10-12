import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  useDeleteAdminUser,
  type AdminUser,
} from '@/features/admin/users-query'

export const Route = createFileRoute('/admin/')({
  component: AdminUsersPage,
})

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
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Akun Admin</h1>
          <p className="text-muted-foreground text-sm">
            Kelola akun dengan role admin.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setForm({ open: true, user: null })}
        >
          Tambah akun
        </Button>
      </div>

      {users.isPending ? (
        <Card>
          <CardContent className="flex flex-col gap-3 py-6">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-5/6" />
            <Skeleton className="h-8 w-2/3" />
          </CardContent>
        </Card>
      ) : users.isError ? (
        <ErrorAlert error={users.error} onRetry={() => users.refetch()} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Daftar akun</CardTitle>
            <CardDescription>
              {users.data.length} akun terdaftar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.data.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Belum ada akun admin. Klik Tambah akun untuk membuat yang
                pertama.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>NIM</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.data.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email ?? '-'}</TableCell>
                      <TableCell>{user.nim ?? '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{user.role}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setForm({ open: true, user })}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => setPendingDelete(user)}
                          >
                            Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
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
