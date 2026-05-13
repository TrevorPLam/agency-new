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
