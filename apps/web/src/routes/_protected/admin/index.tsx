import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { CircleCheck, TriangleAlert, User as UserIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { fotoUrl } from '@/features/akun/akun-query'
import { ReporterPasswordSection } from '@/features/admin/reporter-password-section'
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

// Tombol utama hijau tua, sama dengan halaman Pengaturan.
const TOMBOL_UTAMA_CLASS =
  'rounded-xl bg-[#0d3f31] px-5 text-white hover:bg-[#0a3127]'

type PendingAction = {
  user: AdminUser | null
  type: 'activate' | 'deactivate' | null
}

const TANPA_AKSI: PendingAction = { user: null, type: null }

function inisial(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// Avatar: foto profil kalau ada. Kalau belum ada foto atau gagal dimuat,
// tampil inisial (di tabel) atau ikon orang (di dialog, `ikon`).
function AvatarAkun({
  nama,
  foto,
  ikon = false,
}: {
  nama: string
  foto?: string | null
  ikon?: boolean
}) {
  const [gagal, setGagal] = useState(false)

  if (foto && !gagal) {
    return (
      <img
        src={fotoUrl(foto)}
        alt={`Foto profil ${nama}`}
        onError={() => setGagal(true)}
        className="size-11 shrink-0 rounded-full object-cover ring-1 ring-black/5"
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className="grid size-11 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-semibold text-[#0d3f31]"
    >
      {ikon ? <UserIcon className="size-5" /> : inisial(nama)}
    </span>
  )
}

function BadgeStatusAkun({ active }: { active: boolean }) {
  return (
    <Badge
      variant="secondary"
      className={`rounded-full px-3 text-xs font-medium ${
        active
          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
          : 'bg-red-100 text-red-700 hover:bg-red-100'
      }`}
    >
      {active ? 'Aktif' : 'Nonaktif'}
    </Badge>
  )
}

function TombolAksiAkun({
  user,
  onEdit,
  onToggle,
  className = '',
}: {
  user: AdminUser
  onEdit: () => void
  onToggle: () => void
  className?: string
}) {
  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="rounded-full px-4 text-sm font-medium text-neutral-600"
        onClick={onEdit}
      >
        Edit
      </Button>
      {/* Label & gaya mengikuti AKSI yang akan dijalankan, bukan status
          barisnya: akun aktif ditawari "Nonaktifkan" (merah), akun nonaktif
          ditawari "Aktifkan" (hijau). Issue #115 — dulu kebalik. */}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={`rounded-full bg-white px-4 text-sm font-medium ${
          user.active
            ? 'border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700'
            : 'border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
        }`}
        onClick={onToggle}
      >
        {user.active ? 'Nonaktifkan' : 'Aktifkan'}
      </Button>
    </div>
  )
}

function AdminUsersPage() {
  const users = useQuery(adminUsersQueryOptions)
  const deactivateMutation = useDeactivateAdminUser()
  const activateMutation = useActivateAdminUser()
  const [form, setForm] = useState<{ open: boolean; user: AdminUser | null }>({
    open: false,
    user: null,
  })
  // `pendingAction` menentukan dialog terbuka atau tidak (dan di-reset saat
  // selesai). `terakhir` menyimpan aksi yang terakhir dipilih, khusus untuk
  // isi dialog, supaya judul dan teksnya tidak berganti saat dialog sedang
  // menutup.
  const [pendingAction, setPendingAction] = useState<PendingAction>(TANPA_AKSI)
  const [terakhir, setTerakhir] = useState<PendingAction>(TANPA_AKSI)
  const [cari, setCari] = useState('')

  function mintaKonfirmasi(user: AdminUser) {
    const aksi: PendingAction = {
      user,
      type: user.active ? 'deactivate' : 'activate',
    }
    setPendingAction(aksi)
    setTerakhir(aksi)
  }

  function handleActivate() {
    const user = pendingAction.user
    if (!user) return
    activateMutation.mutate(user.id, {
      onSuccess: () => {
        toast.success('Akun berhasil diaktifkan', {
          description: `Akun ${user.name} sekarang berstatus Aktif. Kamu bisa menonaktifkannya kembali kapan saja.`,
        })
        setPendingAction(TANPA_AKSI)
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  function handleDeactivate() {
    const user = pendingAction.user
    if (!user) return
    deactivateMutation.mutate(user.id, {
      onSuccess: () => {
        toast.success('Akun berhasil dinonaktifkan', {
          description: `Akun ${user.name} sekarang berstatus Nonaktif. Kamu bisa mengaktifkannya kembali kapan saja.`,
        })
        setPendingAction(TANPA_AKSI)
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  const isPending = deactivateMutation.isPending || activateMutation.isPending
  const aktifkan = terakhir.type === 'activate'
  const userDialog = terakhir.user

  // Pencarian by nama atau e-mail, tidak peka huruf besar/kecil.
  const kata = cari.trim().toLowerCase()
  const tampil = (users.data ?? []).filter(
    (user) =>
      kata === '' ||
      user.name.toLowerCase().includes(kata) ||
      (user.email ?? '').toLowerCase().includes(kata),
  )

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Akun admin</h2>
            <p className="text-sm text-neutral-500">
              Daftar akun admin yang bertugas memverifikasi dan mengelola
              laporan fasilitas.
            </p>
          </div>
          <Button
            type="button"
            className={`h-11 shrink-0 text-sm font-semibold ${TOMBOL_UTAMA_CLASS}`}
            onClick={() => setForm({ open: true, user: null })}
          >
            Tambah akun
          </Button>
        </div>

        {users.isPending ? (
          <section className={`flex flex-col gap-3 p-6 ${CARD_CLASS}`}>
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-5/6" />
            <Skeleton className="h-8 w-2/3" />
          </section>
        ) : users.isError ? (
          <ErrorAlert error={users.error} onRetry={() => users.refetch()} />
        ) : (
          <section className={`min-w-0 p-4 sm:p-6 ${CARD_CLASS}`}>
            <Input
              type="search"
              value={cari}
              onChange={(event) => setCari(event.target.value)}
              placeholder="Cari nama atau e-mail..."
              aria-label="Cari akun admin"
              className="h-11 max-w-md rounded-xl"
            />

            {users.data.length === 0 ? (
              <p className="mt-6 py-6 text-center text-sm text-neutral-400">
                Belum ada akun admin. Klik Tambah akun untuk membuat yang
                pertama.
              </p>
            ) : tampil.length === 0 ? (
              <p className="mt-6 py-6 text-center text-sm text-neutral-400">
                Tidak ada akun yang cocok dengan pencarian.
              </p>
            ) : (
              <>
                {/* ===== HP: daftar kartu ===== */}
                <ul className="mt-4 flex flex-col gap-3 md:hidden">
                  {tampil.map((user) => (
                    <li
                      key={user.id}
                      className="rounded-2xl border border-neutral-200/70 p-3.5"
                    >
                      <div className="flex items-start gap-3">
                        <AvatarAkun
                          key={`${user.id}-${user.foto ?? ''}`}
                          nama={user.name}
                          foto={user.foto}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-medium break-words">
                            {user.name}
                          </p>
                          <p className="text-sm break-all text-neutral-500">
                            {user.email ?? '-'}
                          </p>
                        </div>
                        <BadgeStatusAkun active={user.active} />
                      </div>
                      <TombolAksiAkun
                        user={user}
                        className="mt-3 justify-end border-t border-neutral-100 pt-3"
                        onEdit={() => setForm({ open: true, user })}
                        onToggle={() => mintaKonfirmasi(user)}
                      />
                    </li>
                  ))}
                </ul>

                {/* ===== Tablet/desktop: tabel ===== */}
                <div className="mt-4 hidden overflow-x-auto md:block">
                  <Table className="min-w-[32rem]">
                    <TableHeader>
                      <TableRow className="border-0 hover:bg-transparent">
                        <TableHead className="pl-3 text-[15px] font-medium text-neutral-500">
                          Nama
                        </TableHead>
                        <TableHead className="text-[15px] font-medium text-neutral-500">
                          Status
                        </TableHead>
                        <TableHead className="pr-3 text-right text-[15px] font-medium text-neutral-500">
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tampil.map((user) => (
                        <TableRow
                          key={user.id}
                          className="border-t border-neutral-100 hover:bg-[#f7f9f8]"
                        >
                          <TableCell className="py-3 pl-3">
                            <div className="flex items-center gap-3">
                              <AvatarAkun
                                key={`${user.id}-${user.foto ?? ''}`}
                                nama={user.name}
                                foto={user.foto}
                              />
                              <div className="min-w-0">
                                <p className="truncate text-base font-medium">
                                  {user.name}
                                </p>
                                <p className="truncate text-sm text-neutral-500">
                                  {user.email ?? '-'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            <BadgeStatusAkun active={user.active} />
                          </TableCell>
                          <TableCell className="py-3 pr-3 text-right">
                            <TombolAksiAkun
                              user={user}
                              className="justify-end"
                              onEdit={() => setForm({ open: true, user })}
                              onToggle={() => mintaKonfirmasi(user)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </section>
        )}
      </div>

      {/* Reset password mahasiswa */}
      <ReporterPasswordSection />

      {/* Konfirmasi nonaktifkan / aktifkan: dialog popup dengan latar gelap. */}
      <Dialog
        open={pendingAction.user !== null}
        onOpenChange={(open) => {
          if (!open && !isPending) setPendingAction(TANPA_AKSI)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg">
              {aktifkan ? (
                <CircleCheck
                  aria-hidden="true"
                  className="size-5 text-emerald-600"
                />
              ) : (
                <TriangleAlert
                  aria-hidden="true"
                  className="size-5 text-amber-600"
                />
              )}
              {aktifkan ? 'Aktifkan akun admin?' : 'Nonaktifkan akun admin?'}
            </DialogTitle>
            <DialogDescription className="pt-2 text-base">
              {aktifkan
                ? 'Apakah kamu yakin ingin mengaktifkan akun berikut?'
                : 'Apakah kamu yakin ingin menonaktifkan akun berikut?'}
            </DialogDescription>
          </DialogHeader>

          {userDialog && (
            <div className="flex items-center gap-3 rounded-2xl bg-neutral-100 p-3.5">
              <AvatarAkun
                key={`${userDialog.id}-${userDialog.foto ?? ''}`}
                nama={userDialog.name}
                foto={userDialog.foto}
                ikon
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{userDialog.name}</p>
                <p className="truncate text-sm text-neutral-500">
                  {userDialog.email ?? '-'}
                </p>
              </div>
              <Badge
                variant="secondary"
                className={`shrink-0 rounded-full px-3 text-xs font-semibold ${
                  userDialog.active
                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                    : 'bg-red-100 text-red-700 hover:bg-red-100'
                }`}
              >
                {userDialog.active ? 'Aktif' : 'Nonaktif'}
              </Badge>
            </div>
          )}

          <p className="text-sm text-neutral-500">
            {aktifkan
              ? 'Akun yang diaktifkan dapat digunakan kembali untuk masuk ke sistem.'
              : 'Akun yang dinonaktifkan tidak dapat digunakan untuk masuk ke sistem sampai diaktifkan kembali.'}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-full text-sm font-semibold"
              onClick={() => setPendingAction(TANPA_AKSI)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              type="button"
              className={`h-11 rounded-full text-sm font-semibold text-white ${
                aktifkan
                  ? 'bg-[#0d3f31] hover:bg-[#0a3127]'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
              onClick={aktifkan ? handleActivate : handleDeactivate}
              disabled={isPending}
            >
              {isPending
                ? 'Memproses...'
                : aktifkan
                  ? 'Ya, Aktifkan'
                  : 'Ya, Nonaktifkan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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