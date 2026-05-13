# firm-cache

Generated on: 2026-05-13T02:25:38.245Z
Total files: 9

**Description:** Tenant-scoped Redis wrapper for Firm platform

**Version:** 0.1.0

## Table of Contents

- [client.ts](#client-ts)
- [helpers.ts](#helpers-ts)
- [index.ts](#index-ts)
- [key-factory.ts](#key-factory-ts)
- [redis-factory.ts](#redis-factory-ts)
- [tags.ts](#tags-ts)
- [ttl-policies.ts](#ttl-policies-ts)
- [json-parsing-security.test.ts](#json-parsing-security-test-ts)
- [tsup.config.ts](#tsup-config-ts)

## File Contents

### client.ts

**Path:** `src\client.ts`

**Language:** TypeScript

```typescript
import Redis from 'ioredis'

/**
 * Tenant-scoped Redis client
 * 
 * Provides a Redis client that automatically prefixes all keys
 * with tenant information for multi-tenant isolation.
 */
export class TenantCache {
  private readonly redis: Redis
  private readonly tenantId: string
  private readonly keyPrefix: string

  constructor(redis: Redis, tenantId: string) {
    this.redis = redis
    this.tenantId = tenantId
    this.keyPrefix = `tenant:${tenantId}:`
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.keyPrefix + key
    const value = await this.redis.get(fullKey)
    
    if (!value) {
      return null
    }
    
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }

  /**
   * Set a value in cache with optional TTL
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const fullKey = this.keyPrefix + key
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value)
    
    if (ttlSeconds) {
      await this.redis.setex(fullKey, ttlSeconds, serializedValue)
    } else {
      await this.redis.set(fullKey, serializedValue)
    }
  }

  /**
   * Set a value only if it doesn't exist
   */
  async setIfNotExists<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    const fullKey = this.keyPrefix + key
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value)
    
    const result = await this.redis.set(
      fullKey,
      serializedValue,
      'EX',
      ttlSeconds || 0,
      'NX'
    )
    
    return result === 'OK'
  }

  /**
   * Delete a key from cache
   */
  async del(key: string): Promise<void> {
    const fullKey = this.keyPrefix + key
    await this.redis.del(fullKey)
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async delPattern(pattern: string): Promise<number> {
    const fullPattern = this.keyPrefix + pattern
    const keys = await this.redis.keys(fullPattern)
    
    if (keys.length === 0) {
      return 0
    }
    
    return await this.redis.del(...keys)
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    const fullKey = this.keyPrefix + key
    const result = await this.redis.exists(fullKey)
    return result === 1
  }

  /**
   * Set expiration on a key
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    const fullKey = this.keyPrefix + key
    const result = await this.redis.expire(fullKey, ttlSeconds)
    return result === 1
  }

  /**
   * Get remaining TTL for a key
   */
  async ttl(key: string): Promise<number> {
    const fullKey = this.keyPrefix + key
    return await this.redis.ttl(fullKey)
  }

  /**
   * Increment a numeric value
   */
  async incr(key: string, amount: number = 1): Promise<number> {
    const fullKey = this.keyPrefix + key
    return await this.redis.incrby(fullKey, amount)
  }

  /**
   * Decrement a numeric value
   */
  async decr(key: string, amount: number = 1): Promise<number> {
    const fullKey = this.keyPrefix + key
    return await this.redis.decrby(fullKey, amount)
  }

  /**
   * Add to a set
   */
  async sadd(key: string, member: string): Promise<number> {
    const fullKey = this.keyPrefix + key
    return await this.redis.sadd(fullKey, member)
  }

  /**
   * Remove from a set
   */
  async srem(key: string, member: string): Promise<number> {
    const fullKey = this.keyPrefix + key
    return await this.redis.srem(fullKey, member)
  }

  /**
   * Check if member exists in set
   */
  async sismember(key: string, member: string): Promise<boolean> {
    const fullKey = this.keyPrefix + key
    const result = await this.redis.sismember(fullKey, member)
    return result === 1
  }

  /**
   * Get all members of a set
   */
  async smembers(key: string): Promise<string[]> {
    const fullKey = this.keyPrefix + key
    return await this.redis.smembers(fullKey)
  }

  /**
   * Add to a sorted set
   */
  async zadd(key: string, score: number, member: string): Promise<number> {
    const fullKey = this.keyPrefix + key
    return await this.redis.zadd(fullKey, score, member)
  }

  /**
   * Get range from sorted set
   */
  async zrange(key: string, start: number = 0, stop: number = -1): Promise<string[]> {
    const fullKey = this.keyPrefix + key
    return await this.redis.zrange(fullKey, start, stop)
  }

  /**
   * Get range from sorted set with scores
   */
  async zrangeWithScores(key: string, start: number = 0, stop: number = -1): Promise<Array<{ member: string; score: number }>> {
    const fullKey = this.keyPrefix + key
    const results = await this.redis.zrange(fullKey, start, stop, 'WITHSCORES')
    
    // Convert string array to member/score objects
    const members: Array<{ member: string; score: number }> = []
    for (let i = 0; i < results.length; i += 2) {
      members.push({
        member: results[i] || '',
        score: parseFloat(results[i + 1] || '0')
      })
    }
    
    return members
  }

  /**
   * Execute Redis pipeline for batch operations
   */
  async pipeline<T>(operations: Array<(redis: Redis) => Promise<T>>): Promise<T[]> {
    const pipeline = this.redis.pipeline()
    
    for (const operation of operations) {
      operation(pipeline)
    }
    
    const results = await pipeline.exec()
    if (!results) {
      throw new Error('Pipeline execution failed')
    }
    
    return results.map(([err, result]) => {
      if (err) throw err
      return result as T
    })
  }

  /**
   * Get tenant ID for this cache instance
   */
  getTenantId(): string {
    return this.tenantId
  }

  /**
   * Get key prefix for debugging
   */
  getKeyPrefix(): string {
    return this.keyPrefix
  }

  /**
   * Close the Redis connection
   * 
   * Note: This method is deprecated for shared connections.
   * Use RedisConnectionFactory.closeAll() for proper cleanup.
   * @deprecated TenantCache should not own Redis connections
   */
  async quit(): Promise<void> {
    // For shared connections, this method should not close the connection
    // The connection lifecycle is managed by RedisConnectionFactory
    // This method is kept for backward compatibility but does nothing
    console.warn('TenantCache.quit() is deprecated for shared connections. Use RedisConnectionFactory.closeAll() for cleanup.')
  }
}

```

---

### helpers.ts

**Path:** `src\helpers.ts`

**Language:** TypeScript

```typescript
import type { TenantCache } from './client'
import type { CacheKeyFactory } from './key-factory'
import type { TagManager } from './tags'

/**
 * Cache-aside pattern helper
 * 
 * Provides a simple way to implement cache-aside pattern
 * with automatic cache management and fallback logic.
 */
export interface CacheAsideOptions<T> {
  keyFactory: CacheKeyFactory
  ttlSeconds?: number
  tags?: string[]
  fallback?: () => Promise<T>
}

/**
 * Cache-aside helper function
 * 
 * Wraps a data fetching function with caching logic.
 * Returns cached data if available, otherwise fetches and caches.
 */
export async function withCache<T>(
  cache: TenantCache,
  options: CacheAsideOptions<T>,
  fetcher: () => Promise<T>
): Promise<T> {
  const { keyFactory, ttlSeconds, tags, fallback } = options
  
  // Try to get from cache first
  const cached = await cache.get<T>(keyFactory.key(['cache']))
  
  if (cached !== null) {
    return cached
  }
  
  // If no cached data and fallback provided, use fallback
  if (fallback) {
    try {
      const fallbackData = await fallback()
      
      // Cache the fallback data for future requests
      if (ttlSeconds || tags) {
        await cache.set(
          keyFactory.key(['cache']),
          fallbackData,
          ttlSeconds,
          tags
        )
      }
      
      return fallbackData
    } catch (error) {
      // If fallback fails, return null or rethrow based on strategy
      console.warn('Cache fallback failed:', error)
      throw error
    }
  }
  
  // No cached data and no fallback, return null
  return null as T
}

/**
 * Cache-aside with refresh pattern
 * 
 * Similar to withCache but can refresh stale data
 * while serving fresh data from cache.
 */
export interface CacheAsideRefreshOptions<T> extends CacheAsideOptions<T> {
  staleWhileRevalidate?: boolean // Serve stale data while revalidating
  refreshThreshold?: number // Refresh if data is older than this many seconds
}

export async function withCacheRefresh<T>(
  cache: TenantCache,
  tagManager: TagManager,
  options: CacheAsideRefreshOptions<T>,
  fetcher: (currentData?: T) => Promise<T>
): Promise<T> {
  const { keyFactory, ttlSeconds, tags, staleWhileRevalidate, refreshThreshold } = options
  
  const cacheKey = keyFactory.key(['cache'])
  
  // Try to get from cache first
  const cached = await cache.get<T>(cacheKey)
  const now = Date.now()
  
  // If we have fresh data, return it
  if (cached !== null) {
    const cachedAge = (now - new Date(cached._cachedAt || '').getTime()) / 1000
    
    // Check if we need to refresh
    if (refreshThreshold && cachedAge > refreshThreshold) {
      // Start background refresh
      refreshInBackground(cache, tagManager, keyFactory, fetcher, cached)
    }
    
    return cached._data
  }
  
  // If we have stale data and staleWhileRevalidate is true, return it
  if (cached !== null && staleWhileRevalidate) {
    // Start background refresh
    refreshInBackground(cache, tagManager, keyFactory, fetcher, cached)
    
    return cached._data
  }
  
  // No cached data, fetch and cache it
  try {
    const freshData = await fetcher()
    
    // Cache the fresh data with metadata
    const cacheValue = {
      _data: freshData,
      _cachedAt: new Date().toISOString()
    }
    
    await cache.set(cacheKey, cacheValue as any, ttlSeconds, tags)
    
    return freshData
  } catch (error) {
    console.warn('Cache fetch failed:', error)
    throw error
  }
}

/**
 * Background refresh function
 * 
 * Refreshes cache data in the background without blocking
 * the current request.
 */
async function refreshInBackground<T>(
  cache: TenantCache,
  tagManager: TagManager,
  keyFactory: CacheKeyFactory,
  fetcher: (currentData?: T) => Promise<T>,
  currentData?: { _data: T; _cachedAt: string }
): Promise<void> {
  try {
    // Mark as refreshing to prevent race conditions
    const refreshKey = keyFactory.key(['refreshing'])
    const isRefreshing = await cache.exists(refreshKey)
    
    if (isRefreshing) {
      return // Already refreshing
    }
    
    // Set refresh lock
    await cache.set(refreshKey, 'true', 60) // 1 minute lock
    
    // Fetch fresh data
    const freshData = await fetcher(currentData?._data)
    
    // Update cache
    const cacheKey = keyFactory.key(['cache'])
    const cacheValue = {
      _data: freshData,
      _cachedAt: new Date().toISOString()
    }
    
    await cache.set(cacheKey, cacheValue as any)
    
    // Clear refresh lock
    await cache.del(refreshKey)
    
  } catch (error) {
    // Clear refresh lock even on error
    const refreshKey = keyFactory.key(['refreshing'])
    await cache.del(refreshKey)
    
    console.warn('Background refresh failed:', error)
  }
}

/**
 * Multi-get helper
 * 
 * Gets multiple values from cache efficiently
 */
export async function multiGet<T>(
  cache: TenantCache,
  keyFactory: CacheKeyFactory,
  keys: string[]
): Promise<Array<{ key: string; value: T | null }>> {
  const fullKeys = keys.map(key => keyFactory.key([key]))
  
  // Use Redis pipeline for efficiency
  const pipeline = cache.pipeline()
  const results = []
  
  for (const fullKey of fullKeys) {
    pipeline.get(fullKey)
  }
  
  const pipelineResults = await pipeline.exec()
  
  for (let i = 0; i < fullKeys.length; i++) {
    const result = pipelineResults[i]
    let value: T | null = null
    
    if (result && typeof result === 'string') {
      try {
        value = JSON.parse(result) as T
      } catch {
        // Invalid JSON, return as string
        value = result as unknown as T
      }
    }
    
    results.push({ key: keys[i], value })
  }
  
  return results
}

/**
 * Multi-set helper
 * 
 * Sets multiple values in cache efficiently
 */
export async function multiSet<T>(
  cache: TenantCache,
  keyFactory: CacheKeyFactory,
  items: Array<{ key: string; value: T; ttlSeconds?: number; tags?: string[] }>
): Promise<void> {
  const pipeline = cache.pipeline()
  
  for (const { key, value, ttlSeconds, tags } of items) {
    const fullKey = keyFactory.key([key])
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value)
    
    if (ttlSeconds) {
      pipeline.setex(fullKey, ttlSeconds, serializedValue)
    } else {
      pipeline.set(fullKey, serializedValue)
    }
    
    // Add tags if provided
    if (tags && tags.length > 0) {
      for (const tag of tags) {
        pipeline.sadd(`tag:${tag}`, fullKey)
        pipeline.sadd(`tags:${key}`, ...tags)
      }
    }
  }
  
  await pipeline.exec()
}

/**
 * Cache warming helper
 * 
 * Pre-loads commonly accessed data into cache
 */
export async function warmCache<T>(
  cache: TenantCache,
  keyFactory: CacheKeyFactory,
  items: Array<{ key: string; value: T; ttlSeconds?: number; tags?: string[] }>
): Promise<void> {
  console.log(`Warming cache with ${items.length} items...`)
  
  await multiSet(cache, keyFactory, items)
  
  console.log('Cache warming completed')
}

```

---

### index.ts

**Path:** `src\index.ts`

**Language:** TypeScript

```typescript
// Core cache client
export * from './client'

// Redis connection factory
export * from './redis-factory'

// Cache key management
export * from './key-factory'

// Tag-based invalidation
export * from './tags'

// Cache helpers and patterns
export * from './helpers'

// TTL policies
export * from './ttl-policies'

// Re-export commonly used types
export type {
  CacheAsideOptions,
  CacheAsideRefreshOptions
} from './helpers'

export type {
  TTLPolicy
} from './ttl-policies'

// Re-export Redis factory types
export type {
  RedisConnectionOptions
} from './redis-factory'

```

---

### key-factory.ts

**Path:** `src\key-factory.ts`

**Language:** TypeScript

```typescript
/**
 * Cache key factory for consistent key generation
 * 
 * Provides type-safe key generation with proper naming conventions
 * and tenant scoping.
 */

export interface CacheKeyOptions {
  prefix?: string
  version?: string
  separator?: string
}

/**
 * Default cache key configuration
 */
const DEFAULT_CONFIG: Required<CacheKeyOptions> = {
  separator: ':',
  version: 'v1'
}

/**
 * Cache key factory class
 */
export class CacheKeyFactory {
  private readonly tenantId: string
  private readonly config: CacheKeyOptions

  constructor(tenantId: string, config: CacheKeyOptions = {}) {
    this.tenantId = tenantId
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Generate a cache key with tenant prefix
   */
  key(parts: string[]): string {
    const { prefix, version, separator } = this.config
    
    const keyParts = [
      'tenant',
      this.tenantId,
      ...(prefix ? [prefix] : []),
      version,
      ...parts
    ].filter(Boolean)

    return keyParts.join(separator)
  }

  /**
   * Generate a session key
   */
  session(sessionId: string): string {
    return this.key(['session', sessionId])
  }

  /**
   * Generate a user session key
   */
  userSession(userId: string, sessionId: string): string {
    return this.key(['user', userId, 'session', sessionId])
  }

  /**
   * Generate a user preferences key
   */
  userPreferences(userId: string): string {
    return this.key(['user', userId, 'preferences'])
  }

  /**
   * Generate a form data key
   */
  formData(formId: string): string {
    return this.key(['form', formId, 'data'])
  }

  /**
   * Generate a lead data key
   */
  leadData(leadId: string): string {
    return this.key(['lead', leadId, 'data'])
  }

  /**
   * Generate a CRM sync key
   */
  crmSync(syncId: string): string {
    return this.key(['crm', 'sync', syncId])
  }

  /**
   * Generate an email cache key
   */
  email(emailId: string): string {
    return this.key(['email', emailId])
  }

  /**
   * Generate a booking cache key
   */
  booking(bookingId: string): string {
    return this.key(['booking', bookingId])
  }

  /**
   * Generate a rate limit key
   */
  rateLimit(identifier: string, window: string): string {
    return this.key(['rate-limit', identifier, window])
  }

  /**
   * Generate a feature flag key
   */
  featureFlag(flagName: string): string {
    return this.key(['feature', flagName])
  }

  /**
   * Generate a configuration key
   */
  config(configType: string): string {
    return this.key(['config', configType])
  }

  /**
   * Generate a temporary data key
   */
  temp(identifier: string): string {
    return this.key(['temp', identifier])
  }

  /**
   * Generate a lock key
   */
  lock(resource: string, identifier: string): string {
    return this.key(['lock', resource, identifier])
  }

  /**
   * Get the tenant ID for this factory
   */
  getTenantId(): string {
    return this.tenantId
  }
}

/**
 * Create a cache key factory for a tenant
 */
export function createCacheKeyFactory(tenantId: string, config?: CacheKeyOptions): CacheKeyFactory {
  return new CacheKeyFactory(tenantId, config)
}

```

---

### redis-factory.ts

**Path:** `src\redis-factory.ts`

**Language:** TypeScript

```typescript
import Redis from 'ioredis'
import type { RedisOptions } from 'ioredis'

/**
 * Redis connection configuration options
 */
export interface RedisConnectionOptions extends Partial<RedisOptions> {
  host?: string
  port?: number
  password?: string
  db?: number
  maxRetriesPerRequest?: number
  lazyConnect?: boolean
  keepAlive?: number
  family?: 4 | 6
}

/**
 * Shared Redis connection manager
 * 
 * Maintains a singleton Redis instance per connection configuration
 * to prevent connection proliferation in multi-tenant environments.
 */
export class RedisConnectionFactory {
  private static connections = new Map<string, Redis>()
  private static connectionConfigs = new Map<string, RedisConnectionOptions>()

  /**
   * Get or create a shared Redis connection
   * 
   * @param options - Redis connection options
   * @returns Redis instance
   */
  static getConnection(options: RedisConnectionOptions = {}): Redis {
    const configKey = this.getConfigKey(options)
    
    // Return existing connection if available
    if (this.connections.has(configKey)) {
      return this.connections.get(configKey)!
    }

    // Create new connection
    const redis = new Redis({
      host: options.host || process.env['REDIS_HOST'] || 'localhost',
      port: options.port || parseInt(process.env['REDIS_PORT'] || '6379'),
      password: options.password || process.env['REDIS_PASSWORD'],
      db: options.db || parseInt(process.env['REDIS_DB'] || '0'),
      maxRetriesPerRequest: options.maxRetriesPerRequest || 3,
      lazyConnect: options.lazyConnect !== false,
      keepAlive: options.keepAlive || 30000,
      family: options.family || 4,
      // Connection pooling settings to prevent exhaustion
      connectTimeout: 10000,
      commandTimeout: 5000,
      enableReadyCheck: true,
    })

    // Store connection and config
    this.connections.set(configKey, redis)
    this.connectionConfigs.set(configKey, options)

    // Handle connection errors gracefully
    redis.on('error', (error) => {
      console.error('Redis connection error:', error)
    })

    redis.on('close', () => {
      // Remove from connections map when closed
      this.connections.delete(configKey)
      this.connectionConfigs.delete(configKey)
    })

    return redis
  }

  /**
   * Create a Redis factory function with predefined options
   * 
   * @param options - Redis connection options
   * @returns Factory function that returns Redis instances
   */
  static createFactory(options: RedisConnectionOptions = {}) {
    return () => {
      return this.getConnection(options)
    }
  }

  /**
   * Close all Redis connections
   * 
   * Useful for application shutdown
   */
  static async closeAll(): Promise<void> {
    const closePromises = Array.from(this.connections.values()).map(redis => 
      redis.quit().catch(error => {
        console.error('Error closing Redis connection:', error)
      })
    )
    
    await Promise.all(closePromises)
    this.connections.clear()
    this.connectionConfigs.clear()
  }

  /**
   * Get connection statistics
   * 
   * @returns Object with connection count and configuration info
   */
  static getStats(): {
    connectionCount: number
    configurations: Array<{ key: string; options: RedisConnectionOptions }>
  } {
    return {
      connectionCount: this.connections.size,
      configurations: Array.from(this.connectionConfigs.entries()).map(([key, options]) => ({
        key,
        options: { ...options }
      }))
    }
  }

  /**
   * Check if a connection exists for the given options
   * 
   * @param options - Redis connection options
   * @returns True if connection exists
   */
  static hasConnection(options: RedisConnectionOptions = {}): boolean {
    const configKey = this.getConfigKey(options)
    return this.connections.has(configKey)
  }

  /**
   * Remove a specific connection from the pool
   * 
   * @param options - Redis connection options
   * @returns Promise that resolves when connection is closed
   */
  static async closeConnection(options: RedisConnectionOptions = {}): Promise<void> {
    const configKey = this.getConfigKey(options)
    const redis = this.connections.get(configKey)
    
    if (redis) {
      await redis.quit()
      this.connections.delete(configKey)
    }
  }

  /**
   * Generate a unique key for connection configuration
   * 
   * @param options - Redis connection options
   * @returns Unique configuration key
   */
  private static getConfigKey(options: RedisConnectionOptions): string {
    return JSON.stringify({
      host: options.host || process.env['REDIS_HOST'] || 'localhost',
      port: options.port || parseInt(process.env['REDIS_PORT'] || '6379'),
      db: options.db || parseInt(process.env['REDIS_DB'] || '0'),
      family: options.family || 4
    })
  }
}

/**
 * Default Redis factory function
 * 
 * Uses environment variables or defaults for connection configuration
 */
export const getDefaultRedis = RedisConnectionFactory.createFactory()

/**
 * Create a Redis connection for testing
 * 
 * @param options - Override options for testing
 * @returns Redis instance configured for testing
 */
export function createTestRedis(options: Partial<RedisConnectionOptions> = {}): Redis {
  return RedisConnectionFactory.getConnection({
    host: 'localhost',
    port: 6379,
    db: 1, // Use separate DB for testing
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    ...options
  })
}

```

---

### tags.ts

**Path:** `src\tags.ts`

**Language:** TypeScript

```typescript
import Redis from 'ioredis'

/**
 * Tag manager for cache invalidation
 * 
 * Provides efficient tag-based cache invalidation
 * allowing multiple cache keys to be invalidated together.
 */
export class TagManager {
  private readonly redis: Redis
  private readonly tenantId: string
  private readonly keyPrefix: string

  constructor(redis: Redis, tenantId: string) {
    this.redis = redis
    this.tenantId = tenantId
    this.keyPrefix = `tenant:${tenantId}:`
  }

  /**
   * Add tags to a cache key
   */
  async addTags(key: string, tags: string[]): Promise<void> {
    const fullKey = this.keyPrefix + key
    
    for (const tag of tags) {
      await this.redis.sadd(`tag:${tag}`, fullKey)
    }
    
    // Store the list of tags for this key
    await this.redis.sadd(`tags:${key}`, ...tags)
  }

  /**
   * Get all tags for a cache key
   */
  async getTags(key: string): Promise<string[]> {
    const fullKey = this.keyPrefix + key
    return await this.redis.smembers(`tags:${key}`)
  }

  /**
   * Remove tags from a cache key
   */
  async removeTags(key: string, tags: string[]): Promise<void> {
    const fullKey = this.keyPrefix + key
    
    for (const tag of tags) {
      await this.redis.srem(`tag:${tag}`, fullKey)
    }
    
    // Remove tags from the key's tag list
    for (const tag of tags) {
      await this.redis.srem(`tags:${key}`, tag)
    }
  }

  /**
   * Invalidate all cache keys with a specific tag
   */
  async invalidateTag(tag: string): Promise<number> {
    const keys = await this.redis.smembers(`tag:${tag}`)
    
    if (keys.length === 0) {
      return 0
    }
    
    // Delete all keys with this tag
    const result = await this.redis.del(...keys)
    
    // Clean up the tag set itself
    await this.redis.del(`tag:${tag}`)
    
    return result
  }

  /**
   * Invalidate multiple tags
   */
  async invalidateTags(tags: string[]): Promise<number> {
    let totalDeleted = 0
    
    for (const tag of tags) {
      totalDeleted += await this.invalidateTag(tag)
    }
    
    return totalDeleted
  }

  /**
   * Get all keys with a specific tag
   */
  async getKeysByTag(tag: string): Promise<string[]> {
    return await this.redis.smembers(`tag:${tag}`)
  }

  /**
   * Add multiple tags to multiple keys
   */
  async addTagsToKeys(keyTagPairs: Array<{ key: string; tags: string[] }>): Promise<void> {
    const pipeline = this.redis.pipeline()
    
    for (const { key, tags } of keyTagPairs) {
      const fullKey = this.keyPrefix + key
      
      // Add key to each tag set
      for (const tag of tags) {
        pipeline.sadd(`tag:${tag}`, fullKey)
      }
      
      // Store tags for this key
      pipeline.sadd(`tags:${key}`, ...tags)
    }
    
    await pipeline.exec()
  }

  /**
   * Create a tag-based cache entry
   */
  async createWithTags<T>(
    key: string,
    value: T,
    tags: string[],
    ttlSeconds?: number
  ): Promise<void> {
    const fullKey = this.keyPrefix + key
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value)
    
    // Set the cache value
    if (ttlSeconds) {
      await this.redis.setex(fullKey, ttlSeconds, serializedValue)
    } else {
      await this.redis.set(fullKey, serializedValue)
    }
    
    // Add tags
    await this.addTags(key, tags)
  }

  /**
   * Get tenant ID for this tag manager
   */
  getTenantId(): string {
    return this.tenantId
  }

  /**
   * Get key prefix for debugging
   */
  getKeyPrefix(): string {
    return this.keyPrefix
  }
}

```

---

### ttl-policies.ts

**Path:** `src\ttl-policies.ts`

**Language:** TypeScript

```typescript
/**
 * TTL (Time To Live) policies for different cache types
 * 
 * Provides standardized TTL values for different cache scenarios
 * to ensure consistent caching behavior across the platform.
 */

/**
 * TTL policy interface
 */
export interface TTLPolicy {
  name: string
  ttlSeconds: number
  description: string
}

/**
 * Common TTL policies
 */
export const TTLPolicies = {
  // Very short TTL for frequently changing data
  USER_SESSION: {
    name: 'USER_SESSION',
    ttlSeconds: 30 * 60, // 30 minutes
    description: 'User session data - short TTL for security'
  } as TTLPolicy,

  // Short TTL for temporary data
  TEMPORARY_DATA: {
    name: 'TEMPORARY_DATA',
    ttlSeconds: 5 * 60, // 5 minutes
    description: 'Temporary data that should expire quickly'
  } as TTLPolicy,

  // Medium TTL for user preferences
  USER_PREFERENCES: {
    name: 'USER_PREFERENCES',
    ttlSeconds: 24 * 60 * 7, // 7 days
    description: 'User preferences and settings - medium TTL'
  } as TTLPolicy,

  // Long TTL for configuration data
  CONFIGURATION: {
    name: 'CONFIGURATION',
    ttlSeconds: 24 * 60 * 30, // 30 days
    description: 'Configuration data that changes infrequently'
  } as TTLPolicy,

  // Very long TTL for rarely changing data
  STATIC_DATA: {
    name: 'STATIC_DATA',
    ttlSeconds: 24 * 60 * 90, // 90 days
    description: 'Static data that rarely changes'
  } as TTLPolicy,

  // Rate limiting TTL
  RATE_LIMIT: {
    name: 'RATE_LIMIT',
    ttlSeconds: 60, // 1 minute
    description: 'Rate limit counters - short TTL for accuracy'
  } as TTLPolicy,

  // Form data TTL
  FORM_DATA: {
    name: 'FORM_DATA',
    ttlSeconds: 2 * 60 * 60, // 2 hours
    description: 'Form submission data - medium TTL'
  } as TTLPolicy,

  // Lead data TTL
  LEAD_DATA: {
    name: 'LEAD_DATA',
    ttlSeconds: 24 * 60 * 14, // 2 weeks
    description: 'Lead data - longer TTL for business continuity'
  } as TTLPolicy,

  // Email data TTL
  EMAIL_DATA: {
    name: 'EMAIL_DATA',
    ttlSeconds: 24 * 60 * 7, // 7 days
    description: 'Email tracking data - medium TTL'
  } as TTLPolicy,

  // Booking data TTL
  BOOKING_DATA: {
    name: 'BOOKING_DATA',
    ttlSeconds: 24 * 60 * 3, // 3 days
    description: 'Booking data - short TTL for time-sensitive data'
  } as TTLPolicy,

  // API response cache
  API_RESPONSE: {
    name: 'API_RESPONSE',
    ttlSeconds: 15 * 60, // 15 minutes
    description: 'API response cache - short TTL for data freshness'
  } as TTLPolicy,

  // Feature flag TTL
  FEATURE_FLAG: {
    name: 'FEATURE_FLAG',
    ttlSeconds: 10 * 60, // 10 minutes
    description: 'Feature flags - short TTL for quick updates'
  } as TTLPolicy,

  // Analytics data TTL
  ANALYTICS_DATA: {
    name: 'ANALYTICS_DATA',
    ttlSeconds: 24 * 60 * 2, // 2 days
    description: 'Analytics data - medium TTL for reporting'
  } as TTLPolicy,

  // Security data TTL
  SECURITY_DATA: {
    name: 'SECURITY_DATA',
    ttlSeconds: 5 * 60, // 5 minutes
    description: 'Security-related data - short TTL for security'
  } as TTLPolicy,

  // Cache warming data
  CACHE_WARMING: {
    name: 'CACHE_WARMING',
    ttlSeconds: 24 * 60, // 24 hours
    description: 'Cache warming data - longer TTL for persistence'
  } as TTLPolicy
} as const

/**
 * Get TTL policy by name
 */
export function getTTLPolicy(name: string): TTLPolicy | undefined {
  return Object.values(TTLPolicies).find(policy => policy.name === name)
}

/**
 * Get all TTL policies
 */
export function getAllTTLPolicies(): TTLPolicy[] {
  return Object.values(TTLPolicies)
}

/**
 * Validate TTL value against policy
 */
export function validateTTL(policyName: string, ttlSeconds: number): boolean {
  const policy = getTTLPolicy(policyName)
  if (!policy) {
    throw new Error(`Unknown TTL policy: ${policyName}`)
  }
  
  // TTL should not be negative
  if (ttlSeconds < 0) {
    return false
  }
  
  // TTL should not exceed maximum allowed (90 days)
  const maxTTL = 24 * 60 * 90
  if (ttlSeconds > maxTTL) {
    return false
  }
  
  return true
}

/**
 * Get TTL seconds with validation
 */
export function getTTLSeconds(policyName: string): number {
  const policy = getTTLPolicy(policyName)
  if (!policy) {
    throw new Error(`Unknown TTL policy: ${policyName}`)
  }
  
  return policy.ttlSeconds
}

/**
 * Format TTL for human readable display
 */
export function formatTTL(ttlSeconds: number): string {
  const days = Math.floor(ttlSeconds / (24 * 60 * 60))
  const hours = Math.floor((ttlSeconds % (24 * 60 * 60)) / (60 * 60))
  const minutes = Math.floor((ttlSeconds % (60 * 60)) / 60)
  const seconds = ttlSeconds % 60
  
  const parts: string[] = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`)
  
  return parts.join(' ')
}

/**
 * TTL policy validator for different use cases
 */
export class TTLValidator {
  private readonly maxTTL: number
  private readonly minTTL: number

  constructor(maxTTL: number = 24 * 60 * 90, minTTL: number = 1) {
    this.maxTTL = maxTTL
    this.minTTL = minTTL
  }

  /**
   * Validate a TTL value
   */
  validate(ttlSeconds: number): { isValid: boolean; error?: string } {
    if (ttlSeconds < this.minTTL) {
      return {
        isValid: false,
        error: `TTL cannot be less than ${this.minTTL} second${this.minTTL === 1 ? '' : 's'}`
      }
    }

    if (ttlSeconds > this.maxTTL) {
      return {
        isValid: false,
        error: `TTL cannot exceed ${formatTTL(this.maxTTL)}`
      }
    }

    return { isValid: true }
  }

  /**
   * Get the maximum allowed TTL
   */
  getMaxTTL(): number {
    return this.maxTTL
  }

  /**
   * Get the minimum allowed TTL
   */
  getMinTTL(): number {
    return this.minTTL
  }
}

```

---

### json-parsing-security.test.ts

**Path:** `tests\json-parsing-security.test.ts`

**Language:** TypeScript

```typescript
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

```

---

### tsup.config.ts

**Path:** `tsup.config.ts`

**Language:** TypeScript

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'client': 'src/client.ts',
    'key-factory': 'src/key-factory.ts',
    'tags': 'src/tags.ts',
    'helpers': 'src/helpers.ts',
    'ttl-policies': 'src/ttl-policies.ts'
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: ['ioredis']
})

```

---

