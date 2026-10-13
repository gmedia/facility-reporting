import { describe, expect, it } from 'vitest'
import { homeFor } from '@/features/auth/auth-query'

describe('homeFor', () => {
  it('super_admin → /admin', () => {
    expect(homeFor('super_admin')).toBe('/admin')
  })

  it('role lain → /dashboard', () => {
    expect(homeFor('user')).toBe('/dashboard')
    expect(homeFor('admin')).toBe('/dashboard')
  })
})
