import { describe, it, expect, vi, beforeEach } from 'vitest'
import Redis from 'ioredis'
import { TenantCache } from '../src/client'

describe('TenantCache JSON Parsing Security', () => {
  let mockRedis: any
  let cache: TenantCache

  beforeEach(() => {
    mockRedis = {
      get: vi.fn(),
      set: vi.fn(),
      setex: vi.fn(),
      del: vi.fn(),
      keys: vi.fn(),
      exists: vi.fn(),
      expire: vi.fn(),
      ttl: vi.fn(),
      incrby: vi.fn(),
      decrby: vi.fn(),
      sadd: vi.fn(),
      srem: vi.fn(),
      sismember: vi.fn(),
      smembers: vi.fn(),
      zadd: vi.fn(),
      zrange: vi.fn(),
      pipeline: vi.fn(() => ({
        exec: vi.fn(),
      })),
      quit: vi.fn(),
    }
    cache = new TenantCache(mockRedis as Redis, 'test-tenant')
  })

  describe('get method JSON parsing security', () => {
    it('should return parsed JSON for valid JSON strings', async () => {
      mockRedis.get.mockResolvedValue('{"name":"test","value":123}')
      
      const result = await cache.get<{ name: string; value: number }>('test-key')
      
      expect(result).toEqual({ name: 'test', value: 123 })
      expect(mockRedis.get).toHaveBeenCalledWith('tenant:test-tenant:test-key')
    })

    it('should return null when JSON parsing fails (security fix)', async () => {
      mockRedis.get.mockResolvedValue('invalid-json-{')
      
      const result = await cache.get<{ name: string }>('test-key')
      
      expect(result).toBeNull()
      expect(mockRedis.get).toHaveBeenCalledWith('tenant:test-tenant:test-key')
    })

    it('should return null for malformed JSON from older versions', async () => {
      // Simulate plain string from older cache version
      mockRedis.get.mockResolvedValue('plain-string-value')
      
      const result = await cache.get<{ name: string }>('test-key')
      
      expect(result).toBeNull()
      expect(mockRedis.get).toHaveBeenCalledWith('tenant:test-tenant:test-key')
    })

    it('should return null for partial JSON objects', async () => {
      mockRedis.get.mockResolvedValue('{"incomplete": true')
      
      const result = await cache.get<{ complete: boolean }>('test-key')
      
      expect(result).toBeNull()
      expect(mockRedis.get).toHaveBeenCalledWith('tenant:test-tenant:test-key')
    })

    it('should return null for empty string values', async () => {
      mockRedis.get.mockResolvedValue('')
      
      const result = await cache.get<{ data: string }>('test-key')
      
      expect(result).toBeNull()
      expect(mockRedis.get).toHaveBeenCalledWith('tenant:test-tenant:test-key')
    })

    it('should return null when Redis returns null (cache miss)', async () => {
      mockRedis.get.mockResolvedValue(null)
      
      const result = await cache.get<{ data: string }>('test-key')
      
      expect(result).toBeNull()
      expect(mockRedis.get).toHaveBeenCalledWith('tenant:test-tenant:test-key')
    })

    it('should handle JSON syntax errors gracefully', async () => {
      const invalidJsonStrings = [
        '{',
        '}',
        '"unclosed string',
        '{"key": undefined}', // JavaScript undefined, not valid JSON
        '{"key": function(){}}', // Functions, not valid JSON
        'NaN', // Not valid JSON
        'Infinity', // Not valid JSON
        '-Infinity', // Not valid JSON
      ]

      for (const invalidJson of invalidJsonStrings) {
        mockRedis.get.mockResolvedValue(invalidJson)
        
        const result = await cache.get<any>('test-key')
        
        expect(result).toBeNull()
      }
    })

    it('should still work with valid numbers as JSON', async () => {
      mockRedis.get.mockResolvedValue('42')
      
      const result = await cache.get<number>('test-key')
      
      expect(result).toBe(42)
    })

    it('should still work with valid booleans as JSON', async () => {
      mockRedis.get.mockResolvedValue('true')
      
      const result = await cache.get<boolean>('test-key')
      
      expect(result).toBe(true)
    })

    it('should still work with valid arrays as JSON', async () => {
      mockRedis.get.mockResolvedValue('["item1","item2",123]')
      
      const result = await cache.get<Array<string | number>>('test-key')
      
      expect(result).toEqual(['item1', 'item2', 123])
    })
  })

  describe('security implications', () => {
    it('prevents type confusion attacks by returning null on parse failure', async () => {
      // This test ensures that malformed cache data cannot cause runtime type errors
      mockRedis.get.mockResolvedValue('not-an-object')
      
      // If this returned the raw string as T, it could cause runtime errors
      // when the caller tries to access object properties
      const result = await cache.get<{ dangerous: { nested: string } }>('test-key')
      
      // With the security fix, we get null instead of a malformed object
      expect(result).toBeNull()
      
      // This prevents: result.dangerous.nested would throw if result was a string
      expect(() => {
        if (result) {
          // This block should never execute with the security fix
          result.dangerous.nested
        }
      }).not.toThrow()
    })

    it('forces fresh data fetch when cache is corrupted', async () => {
      // Simulate corrupted cache data from an older version
      mockRedis.get.mockResolvedValue('corrupted-legacy-data')
      
      const result = await cache.get<{ user: { id: string } }>('user:123')
      
      // Security fix: returns null, forcing caller to fetch fresh data
      expect(result).toBeNull()
      
      // Caller should now fetch from source of truth
      // This prevents using corrupted/stale data
    })
  })
})
