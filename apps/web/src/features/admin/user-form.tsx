import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  errorMessage,
  fieldErrors,
  useCreateAdminUser,
  useUpdateAdminUser,
  type AdminUser,
  type UpdateUserInput,
} from './users-query'

const formSchema = z.object({
  name: z
    .string()
    .min(1, 'Nama wajib diisi')
    .max(255, 'Nama maksimal 255 karakter'),
  email: z.email('Email tidak valid').max(255, 'Email maksimal 255 karakter'),
  password: z
    .string()
    .refine(
      (value) => value === '' || value.length >= 8,
      'Password minimal 8 karakter',
    ),
})

type FormValues = z.infer<typeof formSchema>

type UserFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AdminUser | null
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
}: UserFormDialogProps) {
  const isEdit = user !== null
  const createMutation = useCreateAdminUser()
  const updateMutation = useUpdateAdminUser()

  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      password: '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    if (!isEdit && values.password === '') {
      setError('password', { message: 'Password wajib diisi' })
      return
    }

    try {
      if (user) {
        const body: UpdateUserInput = {
          name: values.name,
          email: values.email,
        }
        if (values.password !== '') body.password = values.password
        await updateMutation.mutateAsync({ id: user.id, values: body })
        toast.success('Perubahan tersimpan')
      } else {
        await createMutation.mutateAsync({
          name: values.name,
          email: values.email,
          password: values.password,
        })
        toast.success('Akun admin ditambahkan')
      }
      onOpenChange(false)
    } catch (error) {
      const serverErrors = fieldErrors(error)
      let applied = false

      if (serverErrors) {
        for (const [field, messages] of Object.entries(serverErrors)) {
          const message = messages[0]
          if (
            message &&
            (field === 'name' || field === 'email' || field === 'password')
          ) {
            setError(field, { message })
            applied = true
          }
        }
      }

      if (!applied) toast.error(errorMessage(error))
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit akun admin' : 'Tambah akun admin'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Kosongkan password jika tidak ingin mengubahnya.'
              : 'Akun baru dibuat dengan role admin.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4">
          <Controller
            control={control}
            name="name"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="admin-name">Nama</FieldLabel>
                <Input
                  id="admin-name"
                  placeholder="Nama lengkap"
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
            name="email"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="admin-email">Email</FieldLabel>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@facility.test"
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
            name="password"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="admin-password">Password</FieldLabel>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder={
                    isEdit
                      ? 'Biarkan kosong untuk tetap sama'
                      : 'Minimal 8 karakter'
                  }
                  autoComplete="new-password"
                  {...field}
                />
                <FieldError
                  errors={fieldState.error ? [fieldState.error] : undefined}
                />
              </Field>
            )}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
