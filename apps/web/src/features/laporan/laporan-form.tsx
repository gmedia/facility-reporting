import { Controller, useForm } from 'react-hook-form'
import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FotoInput } from './foto-input'
import {
  BATAS_FOTO_BYTE,
  FOTO_MIME_IZIN,
  KATEGORI_LABEL,
  KATEGORI_VALUES,
  errorMessage,
  fieldErrors,
  useCreateLaporan,
  type LaporanKategori,
} from './laporan-query'

const LOKASI_VALUES = ['Gedung D', 'Gedung S'] as const

const formSchema = z.object({
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
  foto: z
    .custom<FileList>()
    .optional()
    .refine((value) => (value?.length ?? 0) > 0, 'Foto wajib dilampirkan'),
  nilai_kerusakan: z.coerce
    .number()
    .min(1, 'Nilai kerusakan wajib diisi (1–5)')
    .max(5, 'Nilai kerusakan maksimal 5'),
  nilai_risiko: z.coerce
    .number()
    .min(1, 'Nilai risiko wajib diisi (1–5)')
    .max(5, 'Nilai risiko maksimal 5'),
  nilai_dampak: z.coerce
    .number()
    .min(1, 'Nilai dampak wajib diisi (1–5)')
    .max(5, 'Nilai dampak maksimal 5'),
  nilai_frekuensi: z.coerce
    .number()
    .min(1, 'Nilai frekuensi wajib diisi (1–5)')
    .max(5, 'Nilai frekuensi maksimal 5'),
})

type FormInput = z.input<typeof formSchema>
type FormValues = z.output<typeof formSchema>

const FIELD_SERVER: ReadonlyArray<keyof FormValues> = [
  'kategori',
  'lokasi',
  'deskripsi',
  'foto',
  'nilai_kerusakan',
  'nilai_risiko',
  'nilai_dampak',
  'nilai_frekuensi',
]

const SKALA_NILAI = [1, 2, 3, 4, 5] as const

const NILAI_ARAH: Record<number, string> = {
  1: 'Rendah',
  2: 'Rendah',
  3: 'Sedang',
  4: 'Tinggi',
  5: 'Tinggi',
}

const NILAI_FIELDS = [
  {
    name: 'nilai_kerusakan',
    label: 'Nilai Kerusakan',
    hint: 'Seberapa parah kondisinya.',
  },
  {
    name: 'nilai_risiko',
    label: 'Nilai Risiko',
    hint: 'Seberapa berbahaya jika dibiarkan.',
  },
  {
    name: 'nilai_dampak',
    label: 'Nilai Dampak',
    hint: 'Seberapa banyak yang terganggu.',
  },
  {
    name: 'nilai_frekuensi',
    label: 'Nilai Frekuensi',
    hint: 'Seberapa sering terjadi.',
  },
] as const

function Wajib() {
  return (
    <span aria-hidden="true" className="ml-0.5 text-red-600">
      *
    </span>
  )
}

function SkalaNilai({
  name,
  value,
  onChange,
  onBlur,
}: {
  name: string
  value: number
  onChange: (value: number) => void
  onBlur: () => void
}) {
  return (
    <div
      role="radiogroup"
      aria-required="true"
      aria-labelledby={`${name}-label`}
      aria-describedby={`${name}-hint`}
      className="grid grid-cols-5 gap-2"
    >
      {SKALA_NILAI.map((n) => (
        <label
          key={n}
          className="flex cursor-pointer flex-col items-center gap-1.5"
        >
          <input
            type="radio"
            name={name}
            value={n}
            checked={value === n}
            onChange={() => onChange(n)}
            onBlur={onBlur}
            className="peer sr-only"
          />

          <span className="grid size-10 place-items-center rounded-full border border-[#d7e2dc] bg-white text-sm font-medium text-[#183c30] transition-all peer-checked:border-[#0d3f31] peer-checked:bg-[#0d3f31] peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#0d3f31]/40 peer-focus-visible:ring-offset-2 hover:border-[#0d3f31]">
            {n}
          </span>

          <span className="text-center text-[11px] leading-tight text-neutral-500">
            {NILAI_ARAH[n]}
          </span>
        </label>
      ))}
    </div>
  )
}

export function LaporanForm() {
  const navigate = useNavigate()
  const create = useCreateLaporan()

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      kategori: '',
      lokasi: '',
      deskripsi: '',
      foto: undefined,
      nilai_kerusakan: 0,
      nilai_risiko: 0,
      nilai_dampak: 0,
      nilai_frekuensi: 0,
    },
  })

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const onSubmit = handleSubmit(async (values) => {
    const file = values.foto?.[0]

    if (file && file.size > BATAS_FOTO_BYTE) {
      setError('foto', { message: 'Ukuran foto maksimal 2 MB' })
      return
    }

    if (file && !FOTO_MIME_IZIN.includes(file.type)) {
      setError('foto', {
        message: 'Format foto harus JPG, PNG, atau WebP',
      })
      return
    }

    try {
      await create.mutateAsync(values)
      toast.success('Laporan berhasil dikirim')
      await navigate({ to: '/dashboard' })
    } catch (error) {
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

      if (!applied) {
        toast.error(errorMessage(error))
      }
    }
  })

  const busy = isSubmitting || create.isPending

  const inputClass =
    'h-11 w-full rounded-xl border-[#d7e2dc] bg-white px-4 text-sm shadow-none transition-colors focus-visible:border-[#0d3f31] focus-visible:ring-[#0d3f31]/20'

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {/* Keterangan field wajib */}
      <p className="text-muted-foreground text-xs">
        <span aria-hidden="true" className="text-red-600">
          *
        </span>{' '}
        Wajib diisi
      </p>

      {/* KATEGORI */}
      <Controller
        control={control}
        name="kategori"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor="laporan-kategori">
              Kategori
              <Wajib />
            </FieldLabel>

            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id="laporan-kategori"
                aria-required="true"
                className={inputClass}
              >
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

      {/* LOKASI */}
      <Controller
        control={control}
        name="lokasi"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor="laporan-lokasi">
              Lokasi
              <Wajib />
            </FieldLabel>

            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id="laporan-lokasi"
                aria-required="true"
                className={inputClass}
              >
                <SelectValue placeholder="Pilih lokasi" />
              </SelectTrigger>

              <SelectContent>
                {LOKASI_VALUES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
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

      {/* DESKRIPSI */}
      <Controller
        control={control}
        name="deskripsi"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor="laporan-deskripsi">
              Deskripsi
              <Wajib />
            </FieldLabel>

            <Textarea
              id="laporan-deskripsi"
              rows={3}
              aria-required="true"
              placeholder="Ceritakan kerusakannya. Contoh: lampu AC di ruang 301 mati total sejak Senin."
              className="min-h-[84px] resize-y rounded-xl border-[#d7e2dc] bg-white px-4 py-3 text-sm shadow-none focus-visible:border-[#0d3f31] focus-visible:ring-[#0d3f31]/20"
              {...field}
            />

            <FieldError
              errors={fieldState.error ? [fieldState.error] : undefined}
            />
          </Field>
        )}
      />

      {/* FOTO */}
      <Controller
        control={control}
        name="foto"
        render={({ field, fieldState }) => {
          const terpilih = field.value?.[0] ?? null

          return (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor="laporan-foto">
                Foto
                <Wajib />
              </FieldLabel>

              <FotoInput
                varian="kartu"
                kosong="pill"
                petunjuk="Arahkan ke kerusakan, lalu tekan tombol bulat"
                inputId="laporan-foto"
                value={terpilih}
                previewUrl={previewUrl}
                disabled={busy}
                ariaLabel="Foto laporan"
                onFile={(file) => {
                  clearErrors('foto')

                  if (!file) {
                    field.onChange(undefined)
                    setPreviewUrl(null)
                    return
                  }

                  if (!FOTO_MIME_IZIN.includes(file.type)) {
                    setError('foto', {
                      message: 'Format foto harus JPG, PNG, atau WebP',
                    })
                    return
                  }

                  if (file.size > BATAS_FOTO_BYTE) {
                    setError('foto', {
                      message: 'Ukuran foto maksimal 2 MB',
                    })
                    return
                  }

                  // Preview menggunakan FileReader, bukan object URL.
                  const reader = new FileReader()

                  reader.onload = () => {
                    setPreviewUrl(
                      typeof reader.result === 'string' ? reader.result : null,
                    )
                  }

                  reader.readAsDataURL(file)

                  // Membungkus File ke dalam FileList.
                  const dt = new DataTransfer()
                  dt.items.add(file)
                  field.onChange(dt.files)
                }}
              />

              <p className="text-muted-foreground text-xs">
                Wajib. JPG, PNG, atau WebP. Maksimal 2 MB.
              </p>

              <FieldError
                errors={fieldState.error ? [fieldState.error] : undefined}
              />
            </Field>
          )
        }}
      />

      {/* PENILAIAN SMART */}
      <div className="border-t border-[#e5ece8] pt-6">
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-[#173d30]">
            Penilaian Kerusakan
          </h3>

          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            Berikan nilai berdasarkan kondisi fasilitas yang dilaporkan.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2">
          {NILAI_FIELDS.map((item) => (
            <Controller
              key={item.name}
              control={control}
              name={item.name}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel id={`${item.name}-label`}>
                    {item.label}
                    <Wajib />
                  </FieldLabel>

                  <p
                    id={`${item.name}-hint`}
                    className="text-muted-foreground text-xs leading-relaxed"
                  >
                    {item.hint}
                  </p>

                  <div className="mt-1">
                    <SkalaNilai
                      name={item.name}
                      value={Number(field.value)}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  </div>

                  <FieldError
                    errors={fieldState.error ? [fieldState.error] : undefined}
                  />
                </Field>
              )}
            />
          ))}
        </div>
      </div>

      {/* TOMBOL KIRIM */}
      <Button
        type="submit"
        disabled={busy}
        className="h-11 w-full rounded-xl bg-[#0d3f31] text-sm font-semibold text-white shadow-none transition-colors hover:bg-[#0a3127] disabled:opacity-60"
      >
        {busy ? 'Mengirim...' : 'Kirim Laporan'}
      </Button>
    </form>
  )
}
