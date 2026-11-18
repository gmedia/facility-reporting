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
  // validasi ukuran/tipe file ditangani manual (saat dipilih dan di onSubmit)
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

// Arah skala yang ditampilkan di bawah setiap tombol angka, supaya
// mahasiswa tidak menebak artinya. Sama dengan petunjuk di samping kanan
// halaman (1–2 Rendah, 3 Sedang, 4–5 Tinggi).
const NILAI_ARAH: Record<number, string> = {
  1: 'Rendah',
  2: 'Rendah',
  3: 'Sedang',
  4: 'Tinggi',
  5: 'Tinggi',
}

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

// Tanda bintang merah di samping label field wajib. aria-hidden supaya
// screen reader tidak membacanya sebagai simbol; kewajibannya disampaikan
// lewat aria-required di field-nya.
function Wajib() {
  return (
    <span aria-hidden="true" className="ml-0.5 text-red-600">
      *
    </span>
  )
}

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
      aria-required="true"
      aria-labelledby={`${name}-label`}
      aria-describedby={`${name}-hint`}
      className="grid grid-cols-5 gap-1.5"
    >
      {SKALA_NILAI.map((n) => (
        <label
          key={n}
          className="flex cursor-pointer flex-col items-center gap-0.5"
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
          <span className="grid size-9 place-items-center rounded-full border border-neutral-200 text-xs font-medium transition-colors peer-checked:border-[#0d3f31] peer-checked:bg-[#0d3f31] peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#0d3f31]/50">
            {n}
          </span>
          <p className="text-[10px] leading-none text-neutral-500">
            {NILAI_ARAH[n]}
          </p>
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

  // previewUrl untuk pratinjau foto di FotoInput. Dibuat dengan
  // FileReader.readAsDataURL (data: URL, aman untuk CodeQL DOM XSS)
  // bukan URL.createObjectURL agar taint tidak sampai ke FotoInput.
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

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
      {/* Keterangan tanda bintang di bagian atas form. */}
      <p className="text-muted-foreground text-xs">
        <span aria-hidden="true" className="text-red-600">
          *
        </span>{' '}
        Wajib diisi
      </p>

      <Controller
        control={control}
        name="kategori"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor="laporan-kategori">Kategori</FieldLabel>
            <Wajib />
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id="laporan-kategori"
                aria-required="true"
                className="w-full"
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

      <Controller
        control={control}
        name="lokasi"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor="laporan-lokasi">Lokasi</FieldLabel>
            <Wajib />
            {/* Pola yang sama dengan kategori: Base UI Select. Pilihan
                dikunci di LOKASI_VALUES — bukan Input bebas — supaya user
                tinggal memilih. */}
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id="laporan-lokasi"
                aria-required="true"
                className="w-full"
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

      <Controller
        control={control}
        name="deskripsi"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor="laporan-deskripsi">Deskripsi</FieldLabel>
            <Wajib />
            <Textarea
              id="laporan-deskripsi"
              rows={5}
              aria-required="true"
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
        render={({ field, fieldState }) => {
          const terpilih = field.value?.[0] ?? null

          return (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor="laporan-foto">Foto</FieldLabel>
              <Wajib />
              {/* Varian "kartu" dengan kondisi kosong berupa tombol kecil
                  (Kamera / Pilih file). Saat kamera menyala atau foto sudah
                  terpilih, tampilannya kotak 4:3 besar seperti dialog
                  "Selesaikan laporan". Teks petunjuk kamera disesuaikan
                  untuk laporan kerusakan. */}
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

                  // null = user menekan "Hapus foto".
                  if (!file) {
                    field.onChange(undefined)
                    setPreviewUrl(null)
                    return
                  }
                  // Cek format dan ukuran saat dipilih, bukan baru saat kirim.
                  if (!FOTO_MIME_IZIN.includes(file.type)) {
                    setError('foto', {
                      message: 'Format foto harus JPG, PNG, atau WebP',
                    })
                    return
                  }
                  if (file.size > BATAS_FOTO_BYTE) {
                    setError('foto', { message: 'Ukuran foto maksimal 2 MB' })
                    return
                  }

                  // Buat preview URL dengan FileReader.readAsDataURL (data: URL)
                  // supaya aman untuk CodeQL DOM XSS — tidak ada
                  // URL.createObjectURL dari e.target.files di sini.
                  const reader = new FileReader()
                  reader.onload = () => {
                    setPreviewUrl(typeof reader.result === 'string' ? reader.result : null)
                  }
                  reader.readAsDataURL(file)

                  // Form menyimpan FileList, jadi File dibungkus lewat
                  // DataTransfer.
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
                <FieldLabel id={`${item.name}-label`}>
                  {item.label}
                  <Wajib />
                </FieldLabel>
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
