import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type ReactNode,
  type Ref,
} from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearch } from '@tanstack/react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Circle, Eye, EyeOff } from 'lucide-react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
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
import { cn } from '@/lib/utils'

// ============================================================
// HALAMAN PENGATURAN (dulu "Akun", issue #93; berganti nama #113)
//
// Tampilan: menu tab di kiri, kartu isi di kanan.
//   - Profil    — ganti foto profil, nama & e-mail (hanya tampil)
//   - Keamanan  — ganti password (ada bar kekuatan + checklist)
//   - Bantuan   — QnA, hanya untuk role `user` (pindahan dari Beranda)
//
// Tab awal bisa diminta lewat alamat: /pengaturan?tab=keamanan. Dipakai
// pengingat "Ganti password" supaya pengguna langsung sampai ke form
// password. Tanpa parameter, tab awalnya Profil.
//
// Data user dibaca dari cache /auth/me lewat useQuery — bukan prop
// route — supaya setelah unggahan foto sukses (mutation menimpa cache
// ['me']), pratinjau ikut berubah tanpa navigasi.
//
// Mahasiswa: dibungkus UserShell dari luar, judul halaman pakai
// PageHeader yang ikut sticky saat scroll (#113).
// Admin / super admin: dibungkus DashboardShell di sini — header
// shell-nya memang sudah sticky, jadi judul cukup lewat prop `header`.
// ============================================================

// Aturan password. Dipakai oleh checklist di form dan (lewat skema di
// bawah) oleh validasi, supaya yang tampil di layar sama dengan yang
// benar-benar dicek.
const ATURAN_PASSWORD: ReadonlyArray<{
  label: string
  lolos: (nilai: string) => boolean
}> = [
  { label: 'Minimal 8 karakter', lolos: (nilai) => nilai.length >= 8 },
  { label: 'Ada huruf besar', lolos: (nilai) => /[A-Z]/.test(nilai) },
  { label: 'Ada angka', lolos: (nilai) => /\d/.test(nilai) },
]

// Skema dibuat per kondisi: akun hasil reset admin tidak diminta password
// saat ini (user memang tidak tahu password acak itu).
function buatSchemaPassword(wajibPasswordLama: boolean) {
  return z
    .object({
      current_password: wajibPasswordLama
        ? z.string().min(1, 'Password saat ini wajib diisi')
        : z.string(),
      password: z
        .string()
        .min(8, 'Password baru minimal 8 karakter')
        .regex(/[A-Z]/, 'Password baru harus mengandung huruf besar')
        .regex(/\d/, 'Password baru harus mengandung angka'),
      password_confirmation: z
        .string()
        .min(1, 'Konfirmasi password wajib diisi'),
    })
    .refine((value) => value.password === value.password_confirmation, {
      message: 'Konfirmasi password baru tidak sama',
      path: ['password_confirmation'],
    })
}

// Beda tipenya, sama seperti laporan-form: z.input sebelum resolver jalan,
// z.output sesudah refine (di sini bentuknya sama, tetap dipisah biar
// konsisten dan aman terhadap perubahan skema nanti).
type SchemaPassword = ReturnType<typeof buatSchemaPassword>
type PasswordInput = z.input<SchemaPassword>
type PasswordValues = z.output<SchemaPassword>

// Field yang boleh menerima pesan error 422 dari server. Kalau tidak ada
// satu pun yang cocok, pesannya jatuh ke toast.
const FIELD_SERVER: ReadonlyArray<keyof PasswordValues> = [
  'current_password',
  'password',
]

type TabId = 'profil' | 'keamanan' | 'bantuan'

// Nilai ?tab= yang dikenal. Harus sama dengan validateSearch di
// routes/_protected/pengaturan.tsx.
const TAB_IDS: ReadonlyArray<TabId> = ['profil', 'keamanan', 'bantuan']

// Gaya kartu isi dan tombol utama, dipakai bersama oleh semua tab.
const KARTU_CLASS = 'rounded-3xl border border-black/5 bg-white p-7 shadow-sm'
const TOMBOL_UTAMA_CLASS =
  'h-11 rounded-xl bg-[#0d3f31] px-5 text-sm font-semibold text-white hover:bg-[#0a3127]'

export function PengaturanPage() {
  const { data: user } = useQuery(meQueryOptions)

  // Tab awal dari alamat (?tab=). `strict: false` karena komponen ini
  // dipakai di luar file route-nya; nilainya sudah dibersihkan oleh
  // validateSearch, jadi di sini cukup dicocokkan lagi sebagai jaring
  // pengaman.
  const { tab: tabUrl } = useSearch({ strict: false }) as { tab?: string }
  const tabAwal: TabId = TAB_IDS.find((id) => id === tabUrl) ?? 'profil'

  // Guard login sudah jalan di route _protected, jadi user praktis pasti
  // ada; null-nya cuma jaring pengaman saat cache belum terisi.
  if (!user) return null

  if (user.role === 'user') {
    return <PengaturanIsi user={user} tabAwal={tabAwal} tampilJudul />
  }

  return <PengaturanPengelola user={user} tabAwal={tabAwal} />
}

// Admin dan super admin: sidebar hijau tua milik DashboardShell. Judul
// halaman ditaruh di header atas, jadi tidak diulang di dalam konten.
function PengaturanPengelola({
  user,
  tabAwal,
}: {
  user: User
  tabAwal: TabId
}) {
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
            Kelola profil dan keamanan akunmu
          </p>
        </div>
      }
    >
      <div className="mx-auto w-full max-w-5xl">
        <PengaturanIsi user={user} tabAwal={tabAwal} tampilJudul={false} />
      </div>
    </DashboardShell>
  )
}

function PengaturanIsi({
  user,
  tabAwal,
  tampilJudul,
}: {
  user: User
  tabAwal: TabId
  tampilJudul: boolean
}) {
  // Bantuan hanya untuk role `user`. Kalau alamatnya meminta ?tab=bantuan
  // tapi yang membuka admin, jatuh ke Profil.
  const [tab, setTab] = useState<TabId>(
    tabAwal === 'bantuan' && user.role !== 'user' ? 'profil' : tabAwal,
  )

  const daftarTab: Array<{ id: TabId; label: string }> = [
    { id: 'profil', label: 'Profil' },
    { id: 'keamanan', label: 'Keamanan' },
    ...(user.role === 'user'
      ? [{ id: 'bantuan' as const, label: 'Bantuan' }]
      : []),
  ]

  return (
    <div className="flex flex-col gap-5">
      {tampilJudul && (
        <PageHeader
          eyebrow="Akun & Keamanan"
          judul="Pengaturan"
          keterangan="Kelola profil, ganti password, dan temukan jawaban di Bantuan."
        />
      )}

      <div className="grid items-start gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
        <nav
          aria-label="Menu pengaturan"
          className="flex gap-1 rounded-3xl border border-black/5 bg-white p-2 shadow-sm md:flex-col"
        >
          {daftarTab.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              aria-current={tab === item.id ? 'page' : undefined}
              className={cn(
                'flex-1 rounded-2xl px-4 py-3 text-left text-[15px] font-medium transition-colors md:flex-none',
                tab === item.id
                  ? 'bg-[#e3f1ea] text-[#1f6b4f]'
                  : 'text-neutral-600 hover:bg-neutral-50',
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <section className={KARTU_CLASS}>
          {tab === 'profil' && <TabProfil user={user} />}
          {tab === 'keamanan' && <TabKeamanan user={user} />}
          {tab === 'bantuan' && user.role === 'user' && <TabBantuan />}
        </section>
      </div>
    </div>
  )
}

// Judul + keterangan di atas isi setiap tab.
function JudulTab({
  judul,
  keterangan,
}: {
  judul: string
  keterangan: ReactNode
}) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-semibold tracking-tight">{judul}</h2>
      <p className="mt-1 text-[15px] text-neutral-500">{keterangan}</p>
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
        className="h-12 rounded-xl pr-11"
        {...props}
      />
      <button
        type="button"
        onClick={() => setTampil((nilai) => !nilai)}
        aria-label={tampil ? 'Sembunyikan password' : 'Tampilkan password'}
        aria-pressed={tampil}
        className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-neutral-500 transition-colors hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-[#1f6b4f]/35 focus-visible:outline-none"
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

// Validasi foto profil. Dipanggil saat file dipilih (supaya user langsung
// tahu kalau ditolak) dan sekali lagi saat simpan sebagai jaring pengaman.
// Mengembalikan pesan error, atau null kalau file lolos.
function cekFoto(file: File): string | null {
  if (file.size > BATAS_FOTO_BYTE) return 'Ukuran foto maksimal 2 MB'
  if (!FOTO_MIME_IZIN.includes(file.type)) {
    return 'Format foto harus JPG, PNG, atau WebP'
  }
  return null
}

// Tab "Profil": ganti foto profil (#93). Nama dan e-mail hanya
// ditampilkan (tidak bisa diubah dari sini).
//
// Pratinjau instan: begitu file dipilih, avatar langsung menampilkan
// gambarnya lewat object URL lokal (belum diunggah). Foto baru benar-benar
// tersimpan setelah "Simpan foto". Tombol "Batal" membuang pilihan.
//
// Validasi ukuran/format dijalankan saat file dipilih, jadi user langsung
// tahu kalau fotonya ditolak, tidak perlu menunggu klik "Simpan foto".
function TabProfil({ user }: { user: User }) {
  const update = useUpdateFoto()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [galat, setGalat] = useState<string | null>(null)

  // Object URL untuk pratinjau. Disimpan di state (supaya render ulang)
  // dan di ref (supaya bisa di-revoke saat diganti / komponen ditutup).
  const [preview, setPreview] = useState<string | null>(null)
  const previewRef = useRef<string | null>(null)

  const gantiPreview = (urlBaru: string | null) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = urlBaru
    setPreview(urlBaru)
  }

  // Bersihkan object URL terakhir saat tab Profil ditutup.
  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    }
  }, [])

  // Kembalikan semuanya ke keadaan awal: tanpa file, tanpa pratinjau,
  // tanpa pesan error, dan input file asli dikosongkan.
  const reset = () => {
    setFile(null)
    setGalat(null)
    gantiPreview(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const onPilih = (event: ChangeEvent<HTMLInputElement>) => {
    const dipilih = event.target.files?.[0] ?? null

    // Dialog dibatalkan / tidak ada file: anggap tidak ada pilihan.
    if (!dipilih) {
      reset()
      return
    }

    // Validasi langsung. File yang ditolak tidak disimpan di state,
    // jadi tombol Simpan tidak mungkin mengirim file yang salah.
    const pesan = cekFoto(dipilih)
    if (pesan) {
      reset()
      setGalat(pesan)
      toast.error(pesan)
      return
    }

    setFile(dipilih)
    setGalat(null)
    gantiPreview(URL.createObjectURL(dipilih))
  }

  const onBatal = () => {
    reset()
  }

  const onSimpan = async () => {
    if (!file) {
      setGalat('Pilih dulu foto yang akan dipakai')
      return
    }

    // Jaring pengaman: file sudah divalidasi saat dipilih.
    const pesan = cekFoto(file)
    if (pesan) {
      setGalat(pesan)
      return
    }

    try {
      await update.mutateAsync(file)
      toast.success('Foto profil berhasil diperbarui')
      reset()
    } catch (error) {
      setGalat(fieldErrors(error)?.foto?.[0] ?? errorMessage(error))
    }
  }

  // Prioritas tampilan avatar: pratinjau file baru > foto tersimpan > inisial.
  const srcAvatar = preview ?? (user.foto ? fotoUrl(user.foto) : null)

  return (
    <div>
      <JudulTab
        judul="Profil"
        keterangan="Foto JPG, PNG, atau WebP, maksimal 2 MB."
      />

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        {srcAvatar ? (
          <img
            src={srcAvatar}
            alt={
              preview
                ? 'Pratinjau foto profil baru'
                : `Foto profil ${user.name}`
            }
            className="size-[108px] shrink-0 rounded-full object-cover ring-1 ring-black/5"
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid size-[108px] shrink-0 place-items-center rounded-full bg-[#0d3f31] text-3xl font-semibold text-white"
          >
            {inisial(user.name)}
          </span>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {/* Input file asli disembunyikan; tombol "Pilih foto" yang
              membukanya, supaya tampilannya seragam di semua browser. */}
          <input
            ref={inputRef}
            id="akun-foto"
            type="file"
            accept={FOTO_ACCEPT}
            onChange={onPilih}
            className="sr-only"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={update.isPending}
              className="h-11 rounded-xl px-5 text-sm font-semibold"
            >
              Pilih foto
            </Button>
            <span className="min-w-0 truncate text-[15px] text-neutral-500">
              {file ? file.name : 'Belum ada file dipilih'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={onSimpan}
              disabled={update.isPending || !file}
              className={TOMBOL_UTAMA_CLASS}
            >
              {update.isPending ? 'Menyimpan...' : 'Simpan foto'}
            </Button>

            {file && (
              <Button
                type="button"
                variant="outline"
                onClick={onBatal}
                disabled={update.isPending}
                className="h-11 rounded-xl px-5 text-sm font-semibold"
              >
                Batal
              </Button>
            )}
          </div>

          {preview && !galat && (
            <p className="text-sm text-neutral-500">
              Ini baru pratinjau. Klik &quot;Simpan foto&quot; untuk
              memakainya, atau &quot;Batal&quot; kalau tidak jadi ganti.
            </p>
          )}

          {galat && (
            <p role="alert" className="text-destructive text-sm">
              {galat}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex max-w-xl flex-col gap-4">
        <Field>
          <FieldLabel htmlFor="akun-nama">Nama</FieldLabel>
          <Input
            id="akun-nama"
            value={user.name}
            readOnly
            className="h-12 rounded-xl"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="akun-email">E-mail</FieldLabel>
          <Input
            id="akun-email"
            value={user.email ?? ''}
            readOnly
            className="h-12 rounded-xl"
          />
        </Field>
      </div>
    </div>
  )
}

// Bar kekuatan + checklist aturan di bawah kolom "Password baru".
// Panjang bar = jumlah aturan yang sudah terpenuhi (0-3).
function KekuatanPassword({ nilai }: { nilai: string }) {
  const hasil = ATURAN_PASSWORD.map((aturan) => ({
    label: aturan.label,
    ok: aturan.lolos(nilai),
  }))
  const skor = hasil.filter((item) => item.ok).length

  return (
    <div className="mt-1">
      <div
        role="progressbar"
        aria-label="Kekuatan password"
        aria-valuemin={0}
        aria-valuemax={ATURAN_PASSWORD.length}
        aria-valuenow={skor}
        className="h-2 w-full overflow-hidden rounded-full bg-neutral-200"
      >
        <div
          className={cn(
            'h-full rounded-full transition-all',
            skor <= 1 && 'bg-red-400',
            skor === 2 && 'bg-amber-400',
            skor === 3 && 'bg-emerald-500',
          )}
          style={{ width: `${(skor / ATURAN_PASSWORD.length) * 100}%` }}
        />
      </div>

      <ul className="mt-2 space-y-0.5 text-sm">
        {hasil.map((item) => (
          <li
            key={item.label}
            className={cn(
              'flex items-center gap-1.5',
              item.ok ? 'text-emerald-700' : 'text-neutral-500',
            )}
          >
            {item.ok ? (
              <Check aria-hidden="true" className="size-3.5" />
            ) : (
              <Circle aria-hidden="true" className="size-3.5" />
            )}
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

// Tab "Keamanan": ganti password. Akun yang barusan direset admin
// (must_change_password = true) tidak diminta password saat ini.
function TabKeamanan({ user }: { user: User }) {
  const ganti = useChangePassword()
  const lewatiLama = user.must_change_password === true

  const resolver = useMemo(
    () => zodResolver(buatSchemaPassword(!lewatiLama)),
    [lewatiLama],
  )

  const {
    control,
    handleSubmit,
    setError,
    reset,
    formState: { isSubmitting },
  } = useForm<PasswordInput, unknown, PasswordValues>({
    resolver,
    defaultValues: {
      current_password: '',
      password: '',
      password_confirmation: '',
    },
  })

  // Dipantau terpisah supaya checklist langsung berubah saat mengetik.
  const passwordBaru = useWatch({ control, name: 'password' }) ?? ''

  const onSubmit = handleSubmit(async (values) => {
    try {
      const { current_password, ...lainnya } = values
      // Akun hasil reset: jangan kirim current_password sama sekali.
      await ganti.mutateAsync(
        lewatiLama ? lainnya : { current_password, ...lainnya },
      )
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
    <div>
      <JudulTab
        judul="Ganti password"
        keterangan={
          lewatiLama
            ? 'Passwordmu baru direset oleh admin. Buat password baru yang hanya kamu yang tahu.'
            : 'Gunakan kombinasi yang sulit ditebak.'
        }
      />

      <form
        onSubmit={onSubmit}
        noValidate
        className="flex max-w-xl flex-col gap-4"
      >
        {!lewatiLama && (
          <Controller
            control={control}
            name="current_password"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="akun-password-lama">
                  Password saat ini
                </FieldLabel>
                <PasswordInput
                  id="akun-password-lama"
                  autoComplete="current-password"
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
        )}

        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor="akun-password-baru">
                Password baru
              </FieldLabel>
              <PasswordInput
                id="akun-password-baru"
                autoComplete="new-password"
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                inputRef={field.ref}
              />
              <KekuatanPassword nilai={passwordBaru} />
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
                Ulangi password baru
              </FieldLabel>
              <PasswordInput
                id="akun-password-konfirmasi"
                autoComplete="new-password"
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

        <div>
          <Button type="submit" disabled={busy} className={TOMBOL_UTAMA_CLASS}>
            {busy ? 'Menyimpan...' : 'Simpan password'}
          </Button>
        </div>
      </form>
    </div>
  )
}

// Tab "Bantuan": QnA pindahan dari Beranda (#113). Isinya accordion
// (features/akun/bantuan.tsx). Hanya muncul untuk role `user`.
function TabBantuan() {
  return (
    <div>
      <JudulTab
        judul="Bantuan"
        keterangan="Pertanyaan yang paling sering muncul — klik untuk membuka jawabannya."
      />
      <BantuanQna />
    </div>
  )
}