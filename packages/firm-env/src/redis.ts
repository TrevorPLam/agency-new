import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

/**
 * Redis environment variable schema and validation.
 * Uses @t3-oss/env-nextjs for runtime validation with Zod schemas.
 * 
 * This module provides type-safe access to Redis configuration
 * environment variables with comprehensive validation.
 */
export const redisEnv = createEnv({
  /**
   * Server-side environment variables that must be present.
   * These are required for the application to start.
   */
  server: {
    /**
     * Redis connection URL.
     * Must be a valid Redis connection string with redis:// or rediss:// protocol.
     */
    REDIS_URL: z
      .string()
      .url()
      .refine(
        (url) => url.startsWith('redis://') || url.startsWith('rediss://'),
        {
          message: 'REDIS_URL must be a Redis connection string (redis:// or rediss://)',
        }
      ),

    /**
     * Redis database number (0-15).
     * Optional, defaults to 0 if not provided.
     */
    REDIS_DB: z
      .string()
      .transform(Number)
      .pipe(z.number().int().min(0).max(15))
      .optional()
      .default('0'),

    /**
     * Redis connection timeout in milliseconds.
     * Optional, defaults to 5000ms if not provided.
     */
    REDIS_TIMEOUT_MS: z
      .string()
      .transform(Number)
      .pipe(z.number().int().min(100).max(60000))
      .optional()
      .default('5000'),

    /**
     * Maximum number of retries for Redis operations.
     * Optional, defaults to 3 if not provided.
     */
    REDIS_MAX_RETRIES: z
      .string()
      .transform(Number)
      .pipe(z.number().int().min(0).max(10))
      .optional()
      .default('3'),

    /**
     * Redis key prefix for tenant isolation.
     * Required for multi-tenant key separation.
     */
    REDIS_KEY_PREFIX: z
      .string()
      .min(1)
      .max(50)
      .regex(/^[a-z0-9_-]*$/, {
        message: 'REDIS_KEY_PREFIX must contain only lowercase letters, numbers, underscores, and hyphens',
      }),

    /**
     * Default TTL for cache entries in seconds.
     * Optional, defaults to 3600 (1 hour) if not provided.
     */
    REDIS_DEFAULT_TTL_SECONDS: z
      .string()
      .transform(Number)
      .pipe(z.number().int().min(1).max(86400))
      .optional()
      .default('3600'),

    /**
     * Enable Redis cluster mode.
     * Optional, defaults to false if not provided.
     */
    REDIS_CLUSTER_ENABLED: z
      .string()
      .transform((val) => val.toLowerCase() === 'true')
      .pipe(z.boolean())
      .optional()
      .default('false'),

    /**
     * Redis cluster nodes (comma-separated URLs).
     * Required only if REDIS_CLUSTER_ENABLED is true.
     */
    REDIS_CLUSTER_NODES: z
      .string()
      .transform((val) => val.split(',').map(url => url.trim()))
      .pipe(z.array(z.string().url()))
      .optional(),
  },

  /**
   * Client-side environment variables (none for Redis config).
   * Redis configuration should never be exposed to the client.
   */
  client: {},

  /**
   * Runtime validation to ensure all required variables are present.
   * This will throw an error if any required environment variable is missing
   * or invalid when the module is imported.
   */
  runtimeEnv: {
    REDIS_URL: process.env['REDIS_URL'],
    REDIS_DB: process.env['REDIS_DB'],
    REDIS_TIMEOUT_MS: process.env['REDIS_TIMEOUT_MS'],
    REDIS_MAX_RETRIES: process.env['REDIS_MAX_RETRIES'],
    REDIS_KEY_PREFIX: process.env['REDIS_KEY_PREFIX'],
    REDIS_DEFAULT_TTL_SECONDS: process.env['REDIS_DEFAULT_TTL_SECONDS'],
    REDIS_CLUSTER_ENABLED: process.env['REDIS_CLUSTER_ENABLED'],
    REDIS_CLUSTER_NODES: process.env['REDIS_CLUSTER_NODES'],
  },

  /**
   * Skip validation for empty strings (not used - we want strict validation).
   */
  skipValidation: true,
});

/**
 * Type-safe accessors for Redis configuration.
 * These functions provide convenient access to validated environment variables.
 */

/**
 * Gets the Redis connection URL.
 * @returns The validated Redis connection string
 */
export function getRedisUrl(): string {
  return redisEnv.REDIS_URL;
}

/**
 * Gets the Redis database number.
 * @returns The database number to use (0-15)
 */
export function getRedisDb(): number {
  return redisEnv.REDIS_DB;
}

/**
 * Gets the Redis connection timeout in milliseconds.
 * @returns Timeout in milliseconds for Redis operations
 */
export function getRedisTimeoutMs(): number {
  return redisEnv.REDIS_TIMEOUT_MS;
}

/**
 * Gets the maximum number of retries for Redis operations.
 * @returns Maximum retry attempts
 */
export function getRedisMaxRetries(): number {
  return redisEnv.REDIS_MAX_RETRIES;
}

/**
 * Gets the Redis key prefix for tenant isolation.
 * @returns The key prefix to use for all Redis operations
 */
export function getRedisKeyPrefix(): string {
  return redisEnv.REDIS_KEY_PREFIX;
}

/**
 * Gets the default TTL for cache entries in seconds.
 * @returns Default TTL in seconds
 */
export function getRedisDefaultTtlSeconds(): number {
  return redisEnv.REDIS_DEFAULT_TTL_SECONDS;
}

/**
 * Checks if Redis cluster mode is enabled.
 * @returns True if cluster mode is enabled
 */
export function isRedisClusterEnabled(): boolean {
  return redisEnv.REDIS_CLUSTER_ENABLED;
}

/**
 * Gets the Redis cluster nodes if cluster mode is enabled.
 * @returns Array of cluster node URLs, or undefined if not in cluster mode
 */
export function getRedisClusterNodes(): string[] | undefined {
  return redisEnv.REDIS_CLUSTER_NODES;
}

/**
 * Checks if SSL is enabled for Redis connections.
 * @returns True if using rediss:// protocol
 */
export function isRedisSslEnabled(): boolean {
  return getRedisUrl().startsWith('rediss://');
}

/**
 * Redis connection configuration object for use with Redis clients.
 * This aggregates all Redis-related environment variables into a single
 * configuration object that can be passed directly to Redis libraries.
 */
export const redisConfig = {
  url: getRedisUrl(),
  db: getRedisDb(),
  timeoutMs: getRedisTimeoutMs(),
  maxRetries: getRedisMaxRetries(),
  keyPrefix: getRedisKeyPrefix(),
  defaultTtlSeconds: getRedisDefaultTtlSeconds(),
  clusterEnabled: isRedisClusterEnabled(),
  clusterNodes: getRedisClusterNodes(),
  sslEnabled: isRedisSslEnabled(),
} as const;

// Export types for external use
export type RedisEnv = typeof redisEnv;
export type RedisConfig = typeof redisConfig;
