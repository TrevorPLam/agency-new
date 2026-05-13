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
