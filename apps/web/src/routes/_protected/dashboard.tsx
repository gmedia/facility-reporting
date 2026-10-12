import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { logoutMutationOptions } from '@/features/auth/auth-query'

export const Route = createFileRoute('/_protected/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const router = useRouter()
  const { user } = Route.useRouteContext()
  const logout = useMutation(logoutMutationOptions)

  const onLogout = async () => {
    await logout.mutateAsync()
    await router.navigate({ to: '/login' })
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-5 px-6">
      <div>
        <p className="text-muted-foreground text-sm">Anda masuk sebagai</p>
        <h1 className="text-3xl font-semibold tracking-tight">{user.name}</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {user.role}
          {user.email ? ` · ${user.email}` : ''}
          {user.nim ? ` · NIM ${user.nim}` : ''}
        </p>
      </div>
      <div>
        <Button
          type="button"
          variant="outline"
          onClick={onLogout}
          disabled={logout.isPending}
        >
          {logout.isPending ? 'Keluar...' : 'Keluar'}
        </Button>
      </div>
    </main>
  )
}
