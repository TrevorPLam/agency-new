import { CacheClient } from '@firm/cache'
import { RateLimitPolicy, getRateLimitPolicy } from './policies'

/**
 * Rate limit result interface
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean
  /** Number of requests remaining in the window */
  remaining: number
  /** Time when the window resets (Unix timestamp) */
  resetTime: number
  /** Time until reset in seconds */
  retryAfter?: number
  /** Policy that was applied */
  policy: RateLimitPolicy
}

/**
 * Rate limit identifier types
 */
export type RateLimitIdentifier = {
  /** IP address for anonymous requests */
  ip?: string
  /** User ID for authenticated requests */
  userId?: string
  /** Email for sensitive operations */
  email?: string
  /** API key for service requests */
  apiKey?: string
  /** Custom identifier */
  custom?: string
}

/**
 * Rate limiter class using Redis-backed token bucket
 */
export class RateLimiter {
  constructor(
    private readonly cache: CacheClient,
    private readonly keyPrefix = 'rate-limit'
  ) {}

  /**
   * Generate cache key for rate limit
   */
  private generateKey(
    policyName: string,
    identifier: RateLimitIdentifier,
    window: number
  ): string {
    const windowStart = Math.floor(Date.now() / (window * 1000)) * (window * 1000)
    const keyParts = [this.keyPrefix, policyName]
    
    if (identifier.userId) keyParts.push(`user:${identifier.userId}`)
    else if (identifier.email) keyParts.push(`email:${identifier.email}`)
    else if (identifier.apiKey) keyParts.push(`key:${identifier.apiKey}`)
    else if (identifier.ip) keyParts.push(`ip:${identifier.ip}`)
    else if (identifier.custom) keyParts.push(`custom:${identifier.custom}`)
    
    keyParts.push(`window:${windowStart}`)
    
    return keyParts.join(':')
  }

  /**
   * Check rate limit for a request
   */
  async checkLimit(
    policyName: string,
    identifier: RateLimitIdentifier
  ): Promise<RateLimitResult> {
    const policy = getRateLimitPolicy(policyName)
    if (!policy) {
      throw new Error(`Unknown rate limit policy: ${policyName}`)
    }

    const key = this.generateKey(policyName, identifier, policy.window)
    const now = Date.now()
    const windowEnd = Math.floor(now / (policy.window * 1000)) * (policy.window * 1000) + (policy.window * 1000)

    // Get current count
    const currentCount = await this.cache.get<number>(key) || 0

    // Check if limit exceeded
    const allowed = currentCount < policy.limit
    const remaining = Math.max(0, policy.limit - currentCount - (allowed ? 1 : 0))
    const retryAfter = allowed ? undefined : Math.ceil((windowEnd - now) / 1000)

    // Increment count if allowed
    if (allowed) {
      const ttl = Math.ceil(policy.window * 1.1) // Add 10% buffer
      await this.cache.set(key, currentCount + 1, { ttl })
    }

    return {
      allowed,
      remaining,
      resetTime: windowEnd,
      retryAfter,
      policy
    }
  }

  /**
   * Reset rate limit for a specific identifier
   */
  async resetLimit(
    policyName: string,
    identifier: RateLimitIdentifier
  ): Promise<void> {
    const policy = getRateLimitPolicy(policyName)
    if (!policy) {
      throw new Error(`Unknown rate limit policy: ${policyName}`)
    }

    const key = this.generateKey(policyName, identifier, policy.window)
    await this.cache.delete(key)
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getStatus(
    policyName: string,
    identifier: RateLimitIdentifier
  ): Promise<Omit<RateLimitResult, 'allowed' | 'retryAfter'>> {
    const policy = getRateLimitPolicy(policyName)
    if (!policy) {
      throw new Error(`Unknown rate limit policy: ${policyName}`)
    }

    const key = this.generateKey(policyName, identifier, policy.window)
    const now = Date.now()
    const windowEnd = Math.floor(now / (policy.window * 1000)) * (policy.window * 1000) + (policy.window * 1000)

    const currentCount = await this.cache.get<number>(key) || 0
    const remaining = Math.max(0, policy.limit - currentCount)

    return {
      remaining,
      resetTime: windowEnd,
      policy
    }
  }

  /**
   * Clean up expired rate limit entries
   */
  async cleanup(): Promise<void> {
    // Redis TTL handles automatic cleanup
    // This method can be used for manual cleanup if needed
  }
}

/**
 * Create a rate limiter instance
 */
export function createRateLimiter(cache: CacheClient, keyPrefix?: string): RateLimiter {
  return new RateLimiter(cache, keyPrefix)
}
