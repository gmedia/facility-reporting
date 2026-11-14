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

// Pilihan lokasi (permintaan 3 Nov 2026): user tidak lagi mengetik
// lokasi bebas — nilainya diambil dari daftar ini lewat dropdown, supaya
// data lokasi di backend konsisten dan gampang dikelompokkan. Backend
// tetap menerima string apa pun, jadi nambah gedung cukup nambah baris.
// Sengaja tidak di-export: file .tsx cuma boleh export komponen supaya
// react-refresh tidak kasih warning baru.
const LOKASI_VALUES = ['Gedung D', 'Gedung S'] as const

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
  //
  // Fotonya WAJIB (permintaan 26 Okt). Bentuknya tetap `.optional()` +
  // `.refine`, bukan `z.custom` polos, karena `z.input` harus mengizinkan
  // `undefined` supaya defaultValues dan field yang belum tersentuh tetap
  // lolos tipe. Yang menolak adalah refinement-nya, dan dia jalan juga
  // waktu nilainya undefined — jadi pesan "wajib" tetap muncul.
  foto: z
    .custom<FileList>()
    .optional()
    .refine((value) => (value?.length ?? 0) > 0, 'Foto wajib dilampirkan'),
  // Skala SMART 1–5, wajib diisi pelapor (backend mewajibkannya).
  // z.coerce.number() tetap dipakai sebagai pengaman, walaupun UI-nya
  // sekarang tombol pilihan 1–5 (bukan input yang bisa diketik).
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
  'nilai_kerusakan',
  'nilai_risiko',
  'nilai_dampak',
  'nilai_frekuensi',
]

const SKALA_NILAI = [1, 2, 3, 4, 5] as const

// Kalimat penjelasan sengaja pendek (satu baris) supaya tombol angka di
// kedua kolom sejajar.
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

// Pilihan 1–5 berupa radio asli yang disembunyikan secara visual, jadi
// keyboard (tab + panah) dan screen reader tetap jalan tanpa kode tambahan.
// Tidak di-export, sama seperti LOKASI_VALUES (aturan react-refresh).
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
      aria-labelledby={`${name}-label`}
      aria-describedby={`${name}-hint`}
      className="grid grid-cols-5 gap-1.5"
    >
      {SKALA_NILAI.map((n) => (
        <label key={n} className="cursor-pointer">
          <input
            type="radio"
            name={name}
            value={n}
            checked={value === n}
            onChange={() => onChange(n)}
            onBlur={onBlur}
            className="peer sr-only"
          />
          <span className="hover:bg-muted grid h-10 place-items-center rounded-xl border text-sm font-medium transition-colors peer-checked:border-[#0d3f31] peer-checked:bg-[#0d3f31] peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#0d3f31]/50">
            {n}
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
    formState: { isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      kategori: '',
      lokasi: '',
      deskripsi: '',
      foto: undefined,
      nilai_kerusakan: 1,
      nilai_risiko: 1,
      nilai_dampak: 1,
      nilai_frekuensi: 1,
    },
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
            {/* Pola yang sama dengan kategori: Base UI Select. Pilihan
                dikunci di LOKASI_VALUES — bukan Input bebas — supaya user
                tinggal memilih. */}
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="laporan-lokasi" className="w-full">
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
            <FieldLabel htmlFor="laporan-foto">Foto</FieldLabel>
            <Input
              id="laporan-foto"
              type="file"
              accept={FOTO_ACCEPT}
              required
              onChange={(event) => field.onChange(event.target.files)}
              onBlur={field.onBlur}
            />
            <p className="text-muted-foreground text-xs">
              Wajib. JPG, PNG, atau WebP. Maksimal 2 MB.
            </p>
            <FieldError
              errors={fieldState.error ? [fieldState.error] : undefined}
            />
          </Field>
        )}
      />

      {/* Skala SMART: pelapor memilih 1–5 lewat tombol, tidak mengetik.
          Backend menghitung skor prioritas dari keempat nilai ini. */}
      <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
        {NILAI_FIELDS.map((item) => (
          <Controller
            key={item.name}
            control={control}
            name={item.name}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel id={`${item.name}-label`}>{item.label}</FieldLabel>
                <p
                  id={`${item.name}-hint`}
                  className="text-muted-foreground -mt-1 text-xs leading-snug sm:min-h-4"
                >
                  {item.hint}
                </p>
                <SkalaNilai
                  name={item.name}
                  value={Number(field.value)}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
                <FieldError
                  errors={fieldState.error ? [fieldState.error] : undefined}
                />
              </Field>
            )}
          />
        ))}
      </div>

      {/* Tombol aksi utama diganti hijau tua, bukan warna --primary bawaan
          tema (hitam netral): di /lapor semua aksi penting berada di satu
          tempat dan harus kelihatan sebagai bagian dari identitas, bukan
          elemen asing. */}
      <Button
        type="submit"
        disabled={busy}
        className="h-10 rounded-2xl bg-[#0d3f31] text-sm font-semibold hover:bg-[#0a3127]"
      >
        {busy ? 'Mengirim...' : 'Kirim Laporan'}
      </Button>
    </form>
  )
}
