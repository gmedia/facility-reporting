import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { queryClient } from '@/app/query-client'
import { meQueryOptions, type User } from '@/features/auth/auth-query'

async function requireUser(): Promise<User> {
  try {
    return await queryClient.fetchQuery(meQueryOptions)
  } catch {
    throw redirect({ to: '/login' }) // me gagal → /login
  }
}

export const Route = createFileRoute('/_protected')({
  beforeLoad: async () => ({ user: await requireUser() }),
  component: () => <Outlet />,
})
