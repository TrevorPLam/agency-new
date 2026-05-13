/**
 * Redis-based rate limiting for Firm Auth
 * 
 * Implements sliding-window rate limiting using Redis INCR and EXPIRE
 * for both API key usage and MFA attempts.
 */

import { TenantCache } from '@firm/cache/client';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum number of requests allowed */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Optional block duration after rate limit exceeded (in seconds) */
  blockDurationSeconds?: number;
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Current request count in the window */
  currentCount: number;
  /** Remaining requests allowed */
  remainingRequests: number;
  /** Time until window resets (in seconds) */
  resetTimeSeconds: number;
  /** Whether the client is currently blocked */
  blocked: boolean;
  /** Time until block expires (in seconds) */
  blockExpiresInSeconds?: number;
}

/**
 * Redis-based rate limiter using sliding window
 */
export class RedisRateLimiter {
  constructor(
    private readonly cache: TenantCache,
    private readonly config: RateLimitConfig
  ) {}

  /**
   * Check if a request is allowed based on rate limit
   * 
   * Uses Redis INCR and EXPIRE for atomic sliding window implementation
   */
  async checkRateLimit(identifier: string): Promise<RateLimitResult> {
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - (now % this.config.windowSeconds);
    
    const countKey = `rate_limit:${identifier}:${windowStart}`;
    const blockKey = `rate_limit_block:${identifier}`;
    
    try {
      // Check if currently blocked
      const blockExpiresAt = await this.cache.get<number>(blockKey);
      if (blockExpiresAt && blockExpiresAt > now) {
        return {
          allowed: false,
          currentCount: 0,
          remainingRequests: 0,
          resetTimeSeconds: blockExpiresAt - now,
          blocked: true,
          blockExpiresInSeconds: blockExpiresAt - now
        };
      }

      // Increment counter for current window
      const currentCount = await this.cache.incr(countKey);
      
      // Set expiration on first request in window
      if (currentCount === 1) {
        await this.cache.expire(countKey, this.config.windowSeconds);
      }

      const remainingRequests = Math.max(0, this.config.maxRequests - currentCount);
      const resetTimeSeconds = this.config.windowSeconds - (now % this.config.windowSeconds);

      // Check if rate limit exceeded
      if (currentCount > this.config.maxRequests) {
        // Apply block if configured
        if (this.config.blockDurationSeconds) {
          const blockExpiresAt = now + this.config.blockDurationSeconds;
          await this.cache.set(blockKey, blockExpiresAt, this.config.blockDurationSeconds);
          
          return {
            allowed: false,
            currentCount,
            remainingRequests: 0,
            resetTimeSeconds,
            blocked: true,
            blockExpiresInSeconds: this.config.blockDurationSeconds
          };
        }

        return {
          allowed: false,
          currentCount,
          remainingRequests: 0,
          resetTimeSeconds,
          blocked: false
        };
      }

      return {
        allowed: true,
        currentCount,
        remainingRequests,
        resetTimeSeconds,
        blocked: false
      };
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Fail open - allow request if Redis is unavailable
      return {
        allowed: true,
        currentCount: 0,
        remainingRequests: this.config.maxRequests,
        resetTimeSeconds: 0,
        blocked: false
      };
    }
  }

  /**
   * Reset rate limit for a specific identifier
   */
  async resetRateLimit(identifier: string): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - (now % this.config.windowSeconds);
    
    const countKey = `rate_limit:${identifier}:${windowStart}`;
    const blockKey = `rate_limit_block:${identifier}`;
    
    try {
      await this.cache.del(countKey);
      await this.cache.del(blockKey);
    } catch (error) {
      console.error('Failed to reset rate limit:', error);
    }
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getRateLimitStatus(identifier: string): Promise<Omit<RateLimitResult, 'currentCount'>> {
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - (now % this.config.windowSeconds);
    
    const countKey = `rate_limit:${identifier}:${windowStart}`;
    const blockKey = `rate_limit_block:${identifier}`;
    
    try {
      // Check if currently blocked
      const blockExpiresAt = await this.cache.get<number>(blockKey);
      if (blockExpiresAt && blockExpiresAt > now) {
        return {
          allowed: false,
          remainingRequests: 0,
          resetTimeSeconds: blockExpiresAt - now,
          blocked: true,
          blockExpiresInSeconds: blockExpiresAt - now
        };
      }

      // Get current count without incrementing
      const currentCount = await this.cache.get<number>(countKey) || 0;
      const remainingRequests = Math.max(0, this.config.maxRequests - currentCount);
      const resetTimeSeconds = this.config.windowSeconds - (now % this.config.windowSeconds);

      return {
        allowed: currentCount < this.config.maxRequests,
        remainingRequests,
        resetTimeSeconds,
        blocked: false
      };
    } catch (error) {
      console.error('Failed to get rate limit status:', error);
      return {
        allowed: true,
        remainingRequests: this.config.maxRequests,
        resetTimeSeconds: 0,
        blocked: false
      };
    }
  }
}

/**
 * Factory function to create rate limiters for different use cases
 */
export function createRateLimiter(cache: TenantCache, config: RateLimitConfig): RedisRateLimiter {
  return new RedisRateLimiter(cache, config);
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMIT_CONFIGS = {
  /** API key rate limiting - 1000 requests per hour */
  API_KEY: {
    maxRequests: 1000,
    windowSeconds: 3600, // 1 hour
    blockDurationSeconds: 300 // 5 minutes block
  } as RateLimitConfig,

  /** MFA TOTP rate limiting - 5 attempts per 5 minutes */
  MFA_TOTP: {
    maxRequests: 5,
    windowSeconds: 300, // 5 minutes
    blockDurationSeconds: 900 // 15 minutes block
  } as RateLimitConfig,

  /** MFA backup code rate limiting - 3 attempts per 5 minutes */
  MFA_BACKUP_CODE: {
    maxRequests: 3,
    windowSeconds: 300, // 5 minutes
    blockDurationSeconds: 900 // 15 minutes block
  } as RateLimitConfig,

  /** Strict rate limiting for sensitive operations - 10 requests per minute */
  STRICT: {
    maxRequests: 10,
    windowSeconds: 60, // 1 minute
    blockDurationSeconds: 300 // 5 minutes block
  } as RateLimitConfig
} as const;

/**
 * Helper function to create rate limiters with predefined configurations
 */
export function createApiKeyRateLimiter(cache: TenantCache): RedisRateLimiter {
  return createRateLimiter(cache, RATE_LIMIT_CONFIGS.API_KEY);
}

export function createMfaTotpRateLimiter(cache: TenantCache): RedisRateLimiter {
  return createRateLimiter(cache, RATE_LIMIT_CONFIGS.MFA_TOTP);
}

export function createMfaBackupCodeRateLimiter(cache: TenantCache): RedisRateLimiter {
  return createRateLimiter(cache, RATE_LIMIT_CONFIGS.MFA_BACKUP_CODE);
}

export function createStrictRateLimiter(cache: TenantCache): RedisRateLimiter {
  return createRateLimiter(cache, RATE_LIMIT_CONFIGS.STRICT);
}
