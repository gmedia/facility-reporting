import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { homeFor, loginMutationOptions } from '@/features/auth/auth-query'

// Zod — tiru validasi backend
const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Email atau NIM wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
})

type LoginValues = z.infer<typeof loginSchema>

// Input — bg abu muda + inner shadow, radius penuh. Pas focus: putih + ring.
const inputSoft =
  'h-11 w-full min-w-0 rounded-full border border-neutral-200 bg-white px-4 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors outline-none focus-visible:border-[#1e6a52] focus-visible:ring-2 focus-visible:ring-[#1e6a52]/15'

// Tombol "Masuk" — gradient gelap (atas terang → bawah gelap) + shadow ke bawah
const tombolSoft =
  'h-11 w-full rounded-full bg-[#1e6a52] text-sm font-medium text-white shadow-[0_6px_16px_-4px_rgba(0,0,0,0.3)] transition-all duration-200 hover:bg-[#1a5f4a] hover:shadow-[0_10px_24px_-6px_rgba(0,0,0,0.35)] active:translate-y-px active:bg-[#16523f] active:shadow-[0_3px_8px_-3px_rgba(0,0,0,0.3)] disabled:pointer-events-none disabled:opacity-60'
export function LoginForm() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const login = useMutation(loginMutationOptions)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null)
    try {
      const user = await login.mutateAsync(values)
      // cast: route /admin & /dashboard belum ada di route tree
      await router.navigate({ to: homeFor(user.role) as never })
    } catch (error) {
      setServerError(pesanDariServer(error))
    }
  })

  const errors = form.formState.errors

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {serverError && (
        <p role="alert" className="text-sm text-red-600">
          {serverError}
        </p>
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
            placeholder="superadmin@facility.test"
            aria-invalid={!!errors.identifier}
            {...form.register('identifier')}
          />
          <FieldError>{errors.identifier?.message}</FieldError>
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel htmlFor="password" className="text-sm text-neutral-700">
          Password
        </FieldLabel>
        <FieldContent>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            className={inputSoft}
            placeholder="Masukkan password"
            aria-invalid={!!errors.password}
            {...form.register('password')}
          />
          <FieldError>{errors.password?.message}</FieldError>
        </FieldContent>
      </Field>

      <Button type="submit" disabled={login.isPending} className={tombolSoft}>
        {login.isPending ? 'Masuk...' : 'Masuk'}
      </Button>
    </form>
  )
}

// 422 punya `errors`, 429/401 cuma punya `message`
function pesanDariServer(error: unknown): string {
  if (error && typeof error === 'object' && 'errors' in error) {
    const errors = (error as { errors?: Record<string, string[]> }).errors
    const pesan = Object.values(errors ?? {}).flat()[0]
    if (pesan) return pesan
  }
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message
  }
  return 'Gagal masuk. Coba lagi.'
}
