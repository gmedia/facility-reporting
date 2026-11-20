import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'
import { Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Field, FieldContent, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { homeFor, loginMutationOptions } from '@/features/auth/auth-query'
import { LupaPassword } from '@/features/auth/lupa-password'

const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Email atau NIM wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
})

type LoginValues = z.infer<typeof loginSchema>

const inputSoft =
  'h-11 w-full min-w-0 rounded-full border border-transparent bg-[#eef1fb] px-4 text-sm text-neutral-900 placeholder:text-neutral-500 transition-colors outline-none focus-visible:border-[#1e6a52] focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#1e6a52]/15 aria-invalid:border-red-300'

const tombolSoft =
  'h-11 w-full rounded-full bg-[#0d3f31] text-sm font-medium text-white shadow-[0_6px_16px_-4px_rgba(0,0,0,0.3)] transition-all duration-200 hover:bg-[#1a5f4a] hover:shadow-[0_10px_24px_-6px_rgba(0,0,0,0.35)] active:translate-y-px active:bg-[#16523f] active:shadow-[0_3px_8px_-3px_rgba(0,0,0,0.3)] disabled:pointer-events-none disabled:opacity-60'

export function LoginForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState<string | null>(null)
  const [tampilPassword, setTampilPassword] = useState(false)
  const login = useMutation(loginMutationOptions)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  })

  const onValid = async (values: LoginValues) => {
    setServerError(null)
    try {
      const user = await login.mutateAsync(values)
      queryClient.clear()
      await router.navigate({ to: homeFor(user.role) as never })
    } catch (error) {
      setServerError(pesanDariServer(error))
    }
  }

  // Validasi form (kosong) juga tampil di banner yang sama.
  const onInvalid = () => {
    setServerError('Email/NIM dan password wajib diisi.')
  }

  const onSubmit = form.handleSubmit(onValid, onInvalid)
  const errors = form.formState.errors

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {serverError && (
        <div
          role="alert"
          className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {serverError}{' '}
          <Link
            to="/lupa-password"
            className="font-semibold text-red-800 underline underline-offset-2 hover:text-red-900"
          >
            Lupa password?
          </Link>
        </div>
      )}

      <Field>
        <FieldLabel htmlFor="identifier" className="text-sm text-neutral-700">
          Email atau NIM
        </FieldLabel>
        <FieldContent>
          <Input
            id="identifier"
            className={inputSoft}
            autoComplete="username"
            placeholder="Contoh: 234110601036"
            aria-invalid={!!errors.identifier}
            {...form.register('identifier')}
          />
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel htmlFor="password" className="text-sm text-neutral-700">
          Password
        </FieldLabel>
        <FieldContent>
          <div className="relative">
            <Input
              id="password"
              type={tampilPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className={`${inputSoft} pr-12`}
              placeholder="Masukkan password"
              aria-invalid={!!errors.password}
              {...form.register('password')}
            />
            <button
              type="button"
              onClick={() => setTampilPassword((v) => !v)}
              aria-label={
                tampilPassword ? 'Sembunyikan password' : 'Tampilkan password'
              }
              aria-pressed={tampilPassword}
              className="absolute top-1/2 right-3 grid size-8 -translate-y-1/2 place-items-center rounded-full text-neutral-500 transition-colors outline-none hover:text-[#0d3f31] focus-visible:ring-2 focus-visible:ring-[#1e6a52]/30"
            >
              {tampilPassword ? (
                <EyeOff aria-hidden="true" className="size-5" />
              ) : (
                <Eye aria-hidden="true" className="size-5" />
              )}
            </button>
          </div>

          {/* Link lupa password selalu ada di bawah kolom password */}
          <div className="mt-3 flex justify-end">
            <Link
              to="/lupa-password"
              className="text-sm font-semibold text-[#0d3f31] underline underline-offset-2 hover:text-[#1a5f4a]"
            >
              Lupa password?
            </Link>
          </div>
        </FieldContent>
      </Field>

      <Button type="submit" disabled={login.isPending} className={tombolSoft}>
        {login.isPending ? 'Masuk...' : 'Masuk'}
      </Button>

      {/* Terbuka otomatis setelah login gagal, karena itu saat paling
          mungkin orang butuh petunjuk ini. */}
      <LupaPassword terbuka={serverError !== null} />
    </form>
  )
}

function pesanDariServer(error: unknown): string {
  if (error && typeof error === 'object') {
    const status = 'status' in error ? error.status : undefined

    if (status === 429) {
      return 'Terlalu banyak percobaan masuk. Tunggu beberapa saat lalu coba lagi.'
    }

    if (status === 401) {
      return 'Email/NIM atau password salah.'
    }

    if ('message' in error && typeof error.message === 'string') {
      const pesan = error.message.toLowerCase()
      if (pesan.includes('invalid credentials')) {
        return 'Email/NIM atau password salah.'
      }
    }

    if ('errors' in error) {
      const errors = (error as { errors?: Record<string, string[]> }).errors
      const pertama = Object.values(errors ?? {}).flat()[0]
      if (pertama) {
        return pertama.toLowerCase().includes('invalid credentials')
          ? 'Email/NIM atau password salah.'
          : pertama
      }
    }
  }
  return 'Gagal masuk. Coba lagi.'
}
