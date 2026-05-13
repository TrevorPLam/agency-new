/**
 * Tests for Redis-based rate limiting
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TenantCache } from '@firm/cache/client';
import { 
  RedisRateLimiter, 
  createRateLimiter, 
  createApiKeyRateLimiter,
  createMfaTotpRateLimiter,
  RATE_LIMIT_CONFIGS 
} from './rate-limit-redis';

// Mock TenantCache
const mockCache = {
  incr: vi.fn(),
  expire: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
} as unknown as TenantCache;

describe('RedisRateLimiter', () => {
  let rateLimiter: RedisRateLimiter;

  beforeEach(() => {
    vi.clearAllMocks();
    rateLimiter = createRateLimiter(mockCache, {
      maxRequests: 5,
      windowSeconds: 60
    });
  });

  it('should allow requests within limit', async () => {
    // Mock successful increment and expire
    vi.mocked(mockCache.incr).mockResolvedValue(1);
    vi.mocked(mockCache.expire).mockResolvedValue(true);
    vi.mocked(mockCache.get).mockResolvedValue(null);

    const result = await rateLimiter.checkRateLimit('test-user');

    expect(result.allowed).toBe(true);
    expect(result.currentCount).toBe(1);
    expect(result.remainingRequests).toBe(4);
    expect(result.blocked).toBe(false);
  });

  it('should block requests exceeding limit', async () => {
    // Mock increment returning count over limit
    vi.mocked(mockCache.incr).mockResolvedValue(6);
    vi.mocked(mockCache.expire).mockResolvedValue(true);
    vi.mocked(mockCache.get).mockResolvedValue(null);

    const result = await rateLimiter.checkRateLimit('test-user');

    expect(result.allowed).toBe(false);
    expect(result.currentCount).toBe(6);
    expect(result.remainingRequests).toBe(0);
    expect(result.blocked).toBe(false);
  });

  it('should handle blocked users', async () => {
    // Mock user is currently blocked
    vi.mocked(mockCache.get).mockResolvedValue(Date.now() / 1000 + 300); // 5 minutes from now

    const result = await rateLimiter.checkRateLimit('blocked-user');

    expect(result.allowed).toBe(false);
    expect(result.blocked).toBe(true);
    expect(result.blockExpiresInSeconds).toBeGreaterThan(0);
  });

  it('should fail open on Redis errors', async () => {
    // Mock Redis error
    vi.mocked(mockCache.get).mockRejectedValue(new Error('Redis connection failed'));

    const result = await rateLimiter.checkRateLimit('test-user');

    expect(result.allowed).toBe(true); // Fail open
    expect(result.blocked).toBe(false);
  });
});

describe('Predefined rate limiters', () => {
  it('should create API key rate limiter with correct config', () => {
    const limiter = createApiKeyRateLimiter(mockCache);
    expect(limiter).toBeInstanceOf(RedisRateLimiter);
  });

  it('should create MFA TOTP rate limiter with correct config', () => {
    const limiter = createMfaTotpRateLimiter(mockCache);
    expect(limiter).toBeInstanceOf(RedisRateLimiter);
  });

  it('should have correct predefined configurations', () => {
    expect(RATE_LIMIT_CONFIGS.API_KEY.maxRequests).toBe(1000);
    expect(RATE_LIMIT_CONFIGS.API_KEY.windowSeconds).toBe(3600);
    
    expect(RATE_LIMIT_CONFIGS.MFA_TOTP.maxRequests).toBe(5);
    expect(RATE_LIMIT_CONFIGS.MFA_TOTP.windowSeconds).toBe(300);
    
    expect(RATE_LIMIT_CONFIGS.MFA_BACKUP_CODE.maxRequests).toBe(3);
    expect(RATE_LIMIT_CONFIGS.MFA_BACKUP_CODE.windowSeconds).toBe(300);
  });
});
