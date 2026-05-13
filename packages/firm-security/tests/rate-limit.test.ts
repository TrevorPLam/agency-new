import { describe, it, expect, vi } from 'vitest'
import { getRateLimitPolicy, validateRateLimitPolicy, registerRateLimitPolicy, RATE_LIMIT_POLICIES } from '../src/rate-limit'

describe('Rate Limit Policies', () => {
  it('should get existing policy', () => {
    const policy = getRateLimitPolicy('auth-login')
    expect(policy).toBeDefined()
    expect(policy?.name).toBe('auth-login')
    expect(policy?.limit).toBe(5)
    expect(policy?.window).toBe(300)
  })

  it('should return undefined for unknown policy', () => {
    const policy = getRateLimitPolicy('unknown-policy')
    expect(policy).toBeUndefined()
  })

  it('should validate policy configuration', () => {
    const validPolicy = {
      name: 'test-policy',
      limit: 10,
      window: 60,
      description: 'Test policy'
    }
    expect(validateRateLimitPolicy(validPolicy)).toBe(true)
  })

  it('should reject invalid policy configuration', () => {
    const invalidPolicy = {
      name: '',
      limit: -1,
      window: 0
    }
    expect(validateRateLimitPolicy(invalidPolicy)).toBe(false)
  })

  it('should register custom policy', () => {
    const customPolicy = {
      name: 'custom-test',
      limit: 15,
      window: 120,
      description: 'Custom test policy'
    }
    
    registerRateLimitPolicy(customPolicy)
    const retrieved = getRateLimitPolicy('custom-test')
    expect(retrieved).toEqual(customPolicy)
  })

  it('should throw error for invalid custom policy', () => {
    const invalidPolicy = {
      name: '',
      limit: -1,
      window: 0
    }
    
    expect(() => registerRateLimitPolicy(invalidPolicy)).toThrow('Invalid rate limit policy')
  })

  it('should have all required default policies', () => {
    const requiredPolicies = [
      'auth-login',
      'auth-register',
      'auth-password-reset',
      'api-general',
      'api-upload',
      'api-search',
      'form-contact',
      'form-lead',
      'webhook-ingest',
      'admin-export',
      'admin-bulk'
    ]

    requiredPolicies.forEach(policyName => {
      expect(RATE_LIMIT_POLICIES[policyName]).toBeDefined()
      expect(validateRateLimitPolicy(RATE_LIMIT_POLICIES[policyName])).toBe(true)
    })
  })
})
