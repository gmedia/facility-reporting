import { useRef, useState, type ChangeEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
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
import {
  BATAS_FOTO_BYTE,
  FOTO_ACCEPT,
  FOTO_MIME_IZIN,
  errorMessage,
  fieldErrors,
} from '@/features/laporan/laporan-query'
import { fotoUrl, useChangePassword, useUpdateFoto } from './akun-query'

// ============================================================
// HALAMAN AKUN (issue #93)
//
// Dua kartu: Foto Profil dan Keamanan (ganti password). Data user dibaca
// dari cache /auth/me lewat useQuery — bukan prop route — supaya setelah
// unggahan foto sukses (mutation menimpa cache ['me']), pratinjau ikut
// berubah tanpa navigasi.
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

export function AkunPage() {
  const { data: user } = useQuery(meQueryOptions)

  // Guard role sudah jalan di beforeLoad route, jadi user praktis pasti
  // ada; null-nya cuma jaring pengaman saat cache belum terisi.
  if (!user) return null

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.12em] text-[#0d3f31]/70 uppercase">
          Akun Saya
        </p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-[26px]">
          Foto Profil &amp; Keamanan
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-neutral-500">
          Atur foto yang menemanimu di aplikasi dan jaga akses akunmu tetap
          aman.
        </p>
      </div>

      <KartuFoto user={user} />
      <KartuKeamanan />
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

function KartuFoto({ user }: { user: User }) {
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
        <CardTitle>Foto Profil</CardTitle>
        <CardDescription>
          Tampilan akunmu di aplikasi. JPG, PNG, atau WebP, maksimal 2 MB.
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
                <Input
                  id="akun-password-lama"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Password yang sekarang dipakai"
                  {...field}
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
                <Input
                  id="akun-password-baru"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Minimal 8 karakter"
                  {...field}
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
                <Input
                  id="akun-password-konfirmasi"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Ulangi password baru"
                  {...field}
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
