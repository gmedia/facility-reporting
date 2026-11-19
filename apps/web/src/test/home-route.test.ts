import { describe, expect, it } from 'vitest'
import { homeFor } from '@/features/auth/auth-query'

describe('homeFor', () => {
  it.each(['super_admin', 'admin', 'user', 'role-tak-dikenal'])(
    '%s → /dashboard',
    (role) => {
      expect(homeFor(role)).toBe('/dashboard')
    },
  )
})
