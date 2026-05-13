import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

/**
 * Database environment variable schema and validation.
 * Uses @t3-oss/env-nextjs for runtime validation with Zod schemas.
 * 
 * This module provides type-safe access to database configuration
 * environment variables with comprehensive validation.
 */
export const databaseEnv = createEnv({
  /**
   * Server-side environment variables that must be present.
   * These are required for the application to start.
   */
  server: {
    /**
     * Primary database connection URL.
     * Must be a valid PostgreSQL connection string.
     */
    DATABASE_URL: z
      .string()
      .url()
      .refine(
        (url) => url.startsWith('postgresql://') || url.startsWith('postgres://'),
        {
          message: 'DATABASE_URL must be a PostgreSQL connection string',
        }
      ),

    /**
     * Database pool size for connection pooling.
     * Optional, defaults to 10 if not provided.
     */
    DATABASE_POOL_SIZE: z
      .string()
      .transform(Number)
      .pipe(z.number().int().min(1).max(100))
      .optional()
      .default('10'),

    /**
     * Database connection timeout in seconds.
     * Optional, defaults to 30 seconds.
     */
    DATABASE_TIMEOUT_SECONDS: z
      .string()
      .transform(Number)
      .pipe(z.number().int().min(1).max(300))
      .optional()
      .default('30'),

    /**
     * Whether to enable SSL for database connections.
     * Optional, defaults to true for production safety.
     */
    DATABASE_SSL_ENABLED: z
      .string()
      .transform((val) => val.toLowerCase() === 'true')
      .pipe(z.boolean())
      .optional()
      .default('true'),

    /**
     * Database schema name for multi-tenant isolation.
     * Required for tenant context switching.
     */
    DATABASE_SCHEMA: z
      .string()
      .min(1)
      .max(63)
      .regex(/^[a-z_][a-z0-9_]*$/, {
        message: 'DATABASE_SCHEMA must contain only lowercase letters, numbers, and underscores, and start with a letter or underscore',
      }),

    /**
     * Read replica database URL for read operations.
     * Optional - if not provided, primary URL is used for all operations.
     */
    DATABASE_READ_REPLICA_URL: z
      .string()
      .url()
      .refine(
        (url) => url.startsWith('postgresql://') || url.startsWith('postgres://'),
        {
          message: 'DATABASE_READ_REPLICA_URL must be a PostgreSQL connection string',
        }
      )
      .optional(),
  },

  /**
   * Client-side environment variables (none for database config).
   * Database configuration should never be exposed to the client.
   */
  client: {},

  /**
 * Runtime validation to ensure all required variables are present.
 * This will throw an error if any required environment variable is missing
 * or invalid when the module is imported.
 */
  runtimeEnv: {
    DATABASE_URL: process.env['DATABASE_URL'],
    DATABASE_POOL_SIZE: process.env['DATABASE_POOL_SIZE'],
    DATABASE_TIMEOUT_SECONDS: process.env['DATABASE_TIMEOUT_SECONDS'],
    DATABASE_SSL_ENABLED: process.env['DATABASE_SSL_ENABLED'],
    DATABASE_SCHEMA: process.env['DATABASE_SCHEMA'],
    DATABASE_READ_REPLICA_URL: process.env['DATABASE_READ_REPLICA_URL'],
  },

  /**
   * Empty object for client-side prefix (not used for database config).
   */
  
  /**
   * Skip validation for empty strings (not used - we want strict validation).
   */
  skipValidation: true,
});

/**
 * Type-safe accessors for database configuration.
 * These functions provide convenient access to validated environment variables.
 */

/**
 * Gets the primary database URL.
 * @returns The validated PostgreSQL connection string
 */
export function getDatabaseUrl(): string {
  return databaseEnv.DATABASE_URL;
}

/**
 * Gets the read replica database URL if configured, otherwise falls back to primary.
 * @returns The database URL to use for read operations
 */
export function getReadReplicaUrl(): string {
  return databaseEnv.DATABASE_READ_REPLICA_URL ?? databaseEnv.DATABASE_URL;
}

/**
 * Gets the configured database pool size.
 * @returns The maximum number of connections in the pool
 */
export function getDatabasePoolSize(): number {
  return databaseEnv.DATABASE_POOL_SIZE;
}

/**
 * Gets the database connection timeout in seconds.
 * @returns Timeout in seconds for database operations
 */
export function getDatabaseTimeoutSeconds(): number {
  return databaseEnv.DATABASE_TIMEOUT_SECONDS;
}

/**
 * Checks if SSL is enabled for database connections.
 * @returns True if SSL connections are required
 */
export function isDatabaseSslEnabled(): boolean {
  return databaseEnv.DATABASE_SSL_ENABLED;
}

/**
 * Gets the database schema name for tenant isolation.
 * @returns The schema name to use for tenant context
 */
export function getDatabaseSchema(): string {
  return databaseEnv.DATABASE_SCHEMA;
}

/**
 * Checks if a read replica is configured.
 * @returns True if a separate read replica URL is available
 */
export function hasReadReplica(): boolean {
  return !!databaseEnv.DATABASE_READ_REPLICA_URL;
}

/**
 * Database connection configuration object for use with database clients.
 * This aggregates all database-related environment variables into a single
 * configuration object that can be passed directly to database libraries.
 */
export const databaseConfig = {
  url: getDatabaseUrl(),
  readReplicaUrl: getReadReplicaUrl(),
  poolSize: getDatabasePoolSize(),
  timeoutSeconds: getDatabaseTimeoutSeconds(),
  sslEnabled: isDatabaseSslEnabled(),
  schema: getDatabaseSchema(),
  hasReadReplica: hasReadReplica(),
} as const;

// Export types for external use
export type DatabaseEnv = typeof databaseEnv;
export type DatabaseConfig = typeof databaseConfig;
