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
        <p role="alert" className="text-destructive text-sm">
          {serverError}
        </p>
      )}

      <Field>
        <FieldLabel htmlFor="identifier">Email atau NIM</FieldLabel>
        <FieldContent>
          <Input
            id="identifier"
            className="h-10 rounded-full border-green-200 bg-green-100/60 focus-visible:border-green-700 focus-visible:ring-green-700/20"
            autoComplete="username"
            placeholder="superadmin@facility.test"
            aria-invalid={!!errors.identifier}
            {...form.register('identifier')}
          />
          <FieldError>{errors.identifier?.message}</FieldError>
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel htmlFor="password">Password</FieldLabel>
        <FieldContent>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            className="h-10 rounded-full border-green-200 bg-green-100/60 focus-visible:border-green-700 focus-visible:ring-green-700/20"
            placeholder="Masukkan password"
            aria-invalid={!!errors.password}
            {...form.register('password')}
          />
          <FieldError>{errors.password?.message}</FieldError>
        </FieldContent>
      </Field>

      <Button
        type="submit"
        disabled={login.isPending}
        className="h-10 w-full rounded-full bg-green-950 text-green-50 hover:bg-green-900"
      >
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
