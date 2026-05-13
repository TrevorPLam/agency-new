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
