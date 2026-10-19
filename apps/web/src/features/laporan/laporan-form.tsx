import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BATAS_FOTO_BYTE,
  FOTO_ACCEPT,
  FOTO_MIME_IZIN,
  KATEGORI_LABEL,
  KATEGORI_VALUES,
  errorMessage,
  fieldErrors,
  useCreateLaporan,
  type LaporanKategori,
} from './laporan-query'

const formSchema = z.object({
  // z.string() dulu, baru refine — biar pesannya manusiawi.
  // (z.enum dengan config kedua-nya berisiko beda antar versi zod.)
  kategori: z
    .string()
    .min(1, 'Kategori wajib dipilih')
    .refine(
      (value): value is LaporanKategori => value in KATEGORI_LABEL,
      'Kategori tidak dikenal',
    ),
  lokasi: z
    .string()
    .trim()
    .min(1, 'Lokasi wajib diisi')
    .max(255, 'Lokasi maksimal 255 karakter'),
  deskripsi: z
    .string()
    .trim()
    .min(10, 'Deskripsi minimal 10 karakter')
    .max(2000, 'Deskripsi maksimal 2000 karakter'),
  // validasi ukuran/tipe file ditangani manual di onSubmit
  foto: z.custom<FileList>().optional(),
})

// Beda tipenya, dan ini penting:
//   z.input  → sebelum resolver jalan. `kategori` masih `string`,
//              karena itu yang diketik user lewat UI.
//   z.output → sesudah `.refine` jalan. `kategori` sudah sempit ke
//              union enum, jadi aman dikirim ke POST /reports.
// useForm butuh dua-duanya (generic ke-3 = transformed values),
// kalau cuma dikasih satu, zodResolver bakal bentrok di tsc.
type FormInput = z.input<typeof formSchema>
type FormValues = z.output<typeof formSchema>

const FIELD_SERVER: ReadonlyArray<keyof FormValues> = [
  'kategori',
  'lokasi',
  'deskripsi',
  'foto',
]

export function LaporanForm() {
  const navigate = useNavigate()
  const create = useCreateLaporan()

  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { kategori: '', lokasi: '', deskripsi: '', foto: undefined },
  })

  const onSubmit = handleSubmit(async (values) => {
    const file = values.foto?.[0]
    if (file && file.size > BATAS_FOTO_BYTE) {
      setError('foto', { message: 'Ukuran foto maksimal 2 MB' })
      return
    }
    // Validasi formatnya di sini, bukan di Zod — `z.custom<FileList>()` cuma
    // ngecek keberadaan file-nya. Kalau dilewatin, user baru ngetahuinya
    // sebagai 422 dari server, dan itu jauh lebih membingungkan.
    if (file && !FOTO_MIME_IZIN.includes(file.type)) {
      setError('foto', { message: 'Format foto harus JPG, PNG, atau WebP' })
      return
    }

    try {
      await create.mutateAsync(values)
      toast.success('Laporan berhasil dikirim')
      // /laporan/saya belum ada (target 28 Okt) — sementara ke /dashboard.
      // Cek dulu di database atau lewat /laporan/saya kalau sudah jadi.
      await navigate({ to: '/dashboard' })
    } catch (error) {
      // 422 → taruh pesan per field, sesuai field-nya
      const serverErrors = fieldErrors(error)
      let applied = false

      if (serverErrors) {
        for (const [field, messages] of Object.entries(serverErrors)) {
          const message = messages[0]
          if (message && FIELD_SERVER.includes(field as keyof FormValues)) {
            setError(field as keyof FormValues, { message })
            applied = true
          }
        }
      }

      if (!applied) toast.error(errorMessage(error))
    }
  })

  const busy = isSubmitting || create.isPending

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Controller
        control={control}
        name="kategori"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor="laporan-kategori">Kategori</FieldLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="laporan-kategori" className="w-full">
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {KATEGORI_VALUES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {KATEGORI_LABEL[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError
              errors={fieldState.error ? [fieldState.error] : undefined}
            />
          </Field>
        )}
      />

      <Controller
        control={control}
        name="lokasi"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor="laporan-lokasi">Lokasi</FieldLabel>
            <Input
              id="laporan-lokasi"
              placeholder="gedung / lantai / ruangan"
              autoComplete="off"
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
        name="deskripsi"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor="laporan-deskripsi">Deskripsi</FieldLabel>
            <Textarea
              id="laporan-deskripsi"
              rows={5}
              placeholder="Ceritakan kerusakannya. Contoh: lampu AC di ruang 301 mati total sejak Senin."
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
        name="foto"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor="laporan-foto">Foto (opsional)</FieldLabel>
            <Input
              id="laporan-foto"
              type="file"
              accept={FOTO_ACCEPT}
              onChange={(event) => field.onChange(event.target.files)}
              onBlur={field.onBlur}
            />
            <p className="text-muted-foreground text-xs">
              JPG, PNG, atau WebP. Maksimal 2 MB.
            </p>
            <FieldError
              errors={fieldState.error ? [fieldState.error] : undefined}
            />
          </Field>
        )}
      />

      <Button type="submit" disabled={busy}>
        {busy ? 'Mengirim...' : 'Kirim Laporan'}
      </Button>
    </form>
  )
}
