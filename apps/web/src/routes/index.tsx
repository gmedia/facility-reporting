import { createFileRoute, redirect } from '@tanstack/react-router'
import { queryClient } from '@/app/query-client'
import { homeFor, meQueryOptions } from '@/features/auth/auth-query'
import { LandingPage } from '@/features/landing/landing-page'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const user = await queryClient.fetchQuery(meQueryOptions).catch(() => null)

    if (user) {
      throw redirect({ to: homeFor(user.role) as never })
    }
  },
  component: LandingPage,
})
