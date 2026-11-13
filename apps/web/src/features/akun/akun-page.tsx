import {
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type Ref,
} from 'react'
import { useQuery } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { meQueryOptions, type User } from '@/features/auth/auth-query'
import { PageHeader } from '@/components/page-header'
import { DashboardShell } from '@/features/dashboard/dashboard-shell'
import { BantuanQna } from './bantuan'
import {
  BATAS_FOTO_BYTE,
  FOTO_ACCEPT,
  FOTO_MIME_IZIN,
  errorMessage,
  fieldErrors,
  useLaporanList,
} from '@/features/laporan/laporan-query'
import { fotoUrl, useChangePassword, useUpdateFoto } from './akun-query'

// ============================================================
// HALAMAN PENGATURAN (dulu "Akun", issue #93; berganti nama #113)
//
// Tiga bagian, urut sesuai permintaan:
//   1. Kelola Akun — ganti foto profil
//   2. Keamanan    — ganti password
//   3. Bantuan     — QnA pindahan dari Beranda (dashboard-faq)
//
// Data user dibaca dari cache /auth/me lewat useQuery — bukan prop
// route — supaya setelah unggahan foto sukses (mutation menimpa cache
// ['me']), pratinjau ikut berubah tanpa navigasi.
//
// Mahasiswa: dibungkus UserShell dari luar (seperti sebelumnya), judul
// halaman pakai PageHeader yang ikut sticky saat scroll (#113).
// Admin / super admin: dibungkus DashboardShell di sini — header
// shell-nya memang sudah sticky, jadi judul cukup lewat prop `header`.
// ============================================================

const schemaPassword = z
  .object({
    current_password: z.string().min(1, 'Password saat ini wajib diisi'),
    password: z.string().min(8, 'Password baru minimal 8 karakter'),
    password_confirmation: z.string().min(1, 'Konfirmasi password wajib diisi'),
  })
  .refine((value) => value.password === value.password_confirmation, {
    message: 'Konfirmasi password baru tidak sama',
    path: ['password_confirmation'],
  })

// Beda tipenya, sama seperti laporan-form: z.input sebelum resolver jalan,
// z.output sesudah refine (di sini bentuknya sama, tetap dipisah biar
// konsisten dan aman terhadap perubahan skema nanti).
type PasswordInput = z.input<typeof schemaPassword>
type PasswordValues = z.output<typeof schemaPassword>

// Field yang boleh menerima pesan error 422 dari server. Kalau tidak ada
// satu pun yang cocok, pesannya jatuh ke toast.
const FIELD_SERVER: ReadonlyArray<keyof PasswordValues> = [
  'current_password',
  'password',
]

export function PengaturanPage() {
  const { data: user } = useQuery(meQueryOptions)

  // Guard login sudah jalan di route _protected, jadi user praktis pasti
  // ada; null-nya cuma jaring pengaman saat cache belum terisi.
  if (!user) return null

  if (user.role === 'user') {
    return <PengaturanIsi user={user} tampilJudul />
  }

  return <PengaturanPengelola user={user} />
}

// Admin dan super admin: sidebar hijau tua milik DashboardShell. Judul
// halaman ditaruh di header atas, jadi tidak diulang di dalam konten.
function PengaturanPengelola({ user }: { user: User }) {
  // Badge jumlah laporan menunggu di menu Verifikasi tetap tampil di
  // halaman ini, sama seperti di Dasbor dan Verifikasi.
  const laporan = useLaporanList()
  const menunggu = laporan.data?.filter(
    (item) => item.status === 'menunggu_verifikasi',
  ).length

  return (
    <DashboardShell
      user={user}
      menunggu={menunggu}
      header={
        <div className="min-w-0 leading-tight">
          <h1 className="truncate text-xl font-bold tracking-tight">
            Pengaturan
          </h1>
          <p className="truncate text-sm text-[#8a8f87]">
            Kelola foto profil, keamanan, dan bantuan akunmu
          </p>
        </div>
      }
    >
      <div className="mx-auto w-full max-w-3xl">
        <PengaturanIsi user={user} tampilJudul={false} />
      </div>
    </DashboardShell>
  )
}

function PengaturanIsi({
  user,
  tampilJudul,
}: {
  user: User
  tampilJudul: boolean
}) {
  return (
    <div className="flex flex-col gap-5">
      {tampilJudul && (
        <PageHeader
          eyebrow="Akun & Keamanan"
          judul="Pengaturan"
          keterangan="Kelola foto profil, ganti password, dan temukan jawaban di Bantuan."
        />
      )}

      <KartuKelolaAkun user={user} />
      <KartuKeamanan />
      <KartuBantuan />
    </div>
  )
}

function inisial(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// Kolom password dengan tombol mata untuk melihat / menyembunyikan isinya.
// `ref` dari react-hook-form dioper lewat `inputRef` supaya fokus otomatis
// ke kolom yang salah tetap jalan.
function PasswordInput({
  inputRef,
  ...props
}: Omit<ComponentProps<typeof Input>, 'type' | 'ref'> & {
  inputRef?: Ref<HTMLInputElement>
}) {
  const [tampil, setTampil] = useState(false)

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type={tampil ? 'text' : 'password'}
        className="pr-11"
        {...props}
      />
      <button
        type="button"
        onClick={() => setTampil((nilai) => !nilai)}
        aria-label={tampil ? 'Sembunyikan password' : 'Tampilkan password'}
        aria-pressed={tampil}
        className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-neutral-500 transition-colors hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-[#0d3f31]/35 focus-visible:outline-none"
      >
        {tampil ? (
          <EyeOff aria-hidden="true" className="size-[18px]" />
        ) : (
          <Eye aria-hidden="true" className="size-[18px]" />
        )}
      </button>
    </div>
  )
}

// Bagian 1 — "Kelola Akun": intinya ganti foto profil (#93), judul
// kartu mengikuti nama menu Pengaturan (#113).
function KartuKelolaAkun({ user }: { user: User }) {
  const update = useUpdateFoto()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [galat, setGalat] = useState<string | null>(null)

  const onPilih = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null)
    setGalat(null)
  }

  const onSimpan = async () => {
    // Validasi ukuran/tipe di sini, bukan di server: sama seperti
    // laporan-form, biar user tahu sebelum menunggu 422.
    if (!file) {
      setGalat('Pilih dulu foto yang akan dipakai')
      return
    }
    if (file.size > BATAS_FOTO_BYTE) {
      setGalat('Ukuran foto maksimal 2 MB')
      return
    }
    if (!FOTO_MIME_IZIN.includes(file.type)) {
      setGalat('Format foto harus JPG, PNG, atau WebP')
      return
    }

    try {
      await update.mutateAsync(file)
      toast.success('Foto profil berhasil diperbarui')
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
    } catch (error) {
      setGalat(fieldErrors(error)?.foto?.[0] ?? errorMessage(error))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kelola Akun</CardTitle>
        <CardDescription>
          Ganti foto profil yang tampil di aplikasi. JPG, PNG, atau WebP,
          maksimal 2 MB.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center">
        {user.foto ? (
          <img
            src={fotoUrl(user.foto)}
            alt={`Foto profil ${user.name}`}
            className="size-20 shrink-0 rounded-full object-cover ring-1 ring-black/5"
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid size-20 shrink-0 place-items-center rounded-full bg-[#0d3f31] text-xl font-semibold text-white"
          >
            {inisial(user.name)}
          </span>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <Field data-invalid={galat !== null || undefined}>
            <FieldLabel htmlFor="akun-foto">Foto</FieldLabel>
            <Input
              ref={inputRef}
              id="akun-foto"
              type="file"
              accept={FOTO_ACCEPT}
              onChange={onPilih}
            />
            <p className="text-muted-foreground text-xs">
              Belum ada foto? Pakai inisial namamu. JPG, PNG, atau WebP.
            </p>
            <FieldError errors={galat ? [{ message: galat }] : undefined} />
          </Field>
          <div>
            <Button
              type="button"
              onClick={onSimpan}
              disabled={update.isPending}
              className="h-10 rounded-2xl bg-[#0d3f31] text-sm font-semibold hover:bg-[#0a3127]"
            >
              {update.isPending ? 'Menyimpan...' : 'Simpan Foto'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function KartuKeamanan() {
  const ganti = useChangePassword()

  const {
    control,
    handleSubmit,
    setError,
    reset,
    formState: { isSubmitting },
  } = useForm<PasswordInput, unknown, PasswordValues>({
    resolver: zodResolver(schemaPassword),
    defaultValues: {
      current_password: '',
      password: '',
      password_confirmation: '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await ganti.mutateAsync(values)
      toast.success('Password berhasil diperbarui')
      reset()
    } catch (error) {
      // 422 → taruh pesan per field, sesuai field-nya
      const serverErrors = fieldErrors(error)
      let applied = false

      if (serverErrors) {
        for (const [field, messages] of Object.entries(serverErrors)) {
          const message = messages[0]
          if (message && FIELD_SERVER.includes(field as keyof PasswordValues)) {
            setError(field as keyof PasswordValues, { message })
            applied = true
          }
        }
      }

      if (!applied) toast.error(errorMessage(error))
    }
  })

  const busy = isSubmitting || ganti.isPending

  return (
    <Card>
      <CardHeader>
        <CardTitle>Keamanan</CardTitle>
        <CardDescription>
          Ganti password akunmu. Minimal 8 karakter.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={onSubmit}
          noValidate
          className="flex max-w-md flex-col gap-4"
        >
          <Controller
            control={control}
            name="current_password"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="akun-password-lama">
                  Password Saat Ini
                </FieldLabel>
                <PasswordInput
                  id="akun-password-lama"
                  autoComplete="current-password"
                  placeholder="Password yang sekarang dipakai"
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                />
                <FieldError
                  errors={fieldState.error ? [fieldState.error] : undefined}
                />
              </Field>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="akun-password-baru">
                  Password Baru
                </FieldLabel>
                <PasswordInput
                  id="akun-password-baru"
                  autoComplete="new-password"
                  placeholder="Minimal 8 karakter"
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                />
                <FieldError
                  errors={fieldState.error ? [fieldState.error] : undefined}
                />
              </Field>
            )}
          />

          <Controller
            control={control}
            name="password_confirmation"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="akun-password-konfirmasi">
                  Konfirmasi Password Baru
                </FieldLabel>
                <PasswordInput
                  id="akun-password-konfirmasi"
                  autoComplete="new-password"
                  placeholder="Ulangi password baru"
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                />
                <FieldError
                  errors={fieldState.error ? [fieldState.error] : undefined}
                />
              </Field>
            )}
          />

          {/* Tombol utama hijau tua #0d3f31 — sama dengan aksi penting
              di halaman user lain (/lapor, kartu akun). */}
          <Button
            type="submit"
            disabled={busy}
            className="h-10 rounded-2xl bg-[#0d3f31] text-sm font-semibold hover:bg-[#0a3127]"
          >
            {busy ? 'Menyimpan...' : 'Simpan Password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// Bagian 3 — "Bantuan": QnA pindahan dari Beranda (#113). Isinya
// accordion (features/akun/bantuan.tsx); judul & deskripsi kartu dari
// CardHeader supaya seragam dengan dua kartu di atasnya.
function KartuBantuan() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bantuan</CardTitle>
        <CardDescription>
          Pertanyaan yang paling sering muncul — klik untuk membuka jawabannya.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <BantuanQna />
      </CardContent>
    </Card>
  )
}
