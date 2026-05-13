/**
 * Environment variable validation for the Firm platform.
 * 
 * This module exports all validated environment variables from different
 * configuration modules (database, redis, auth, platform) in a single
 * convenient location.
 * 
 * All environment variables are validated at runtime using @t3-oss/env-nextjs
 * with Zod schemas to ensure type safety and proper validation.
 */

// Import all environment modules for internal use
import {
  databaseEnv,
  databaseConfig,
  type DatabaseEnv,
  type DatabaseConfig,
} from './database';

import {
  redisEnv,
  redisConfig,
  type RedisEnv,
  type RedisConfig,
} from './redis';

import {
  authEnv,
  authConfig,
  type AuthEnv,
  type AuthConfig,
} from './auth';

import {
  platformEnv,
  platformConfig,
  type PlatformEnv,
  type PlatformConfig,
} from './platform';

// Export all environment modules
export * from './database';
export * from './redis';
export * from './auth';
export * from './platform';

// Re-export main environment schemas for convenience
export { 
  databaseEnv, 
  databaseConfig,
} from './database';
export { redisEnv, redisConfig } from './redis';
export { authEnv, authConfig } from './auth';
export { platformEnv, platformConfig } from './platform';

// Export types
export type { DatabaseEnv, DatabaseConfig } from './database';
export type { RedisEnv, RedisConfig } from './redis';
export type { AuthEnv, AuthConfig } from './auth';
export type { PlatformEnv, PlatformConfig } from './platform';

/**
 * Aggregated configuration object containing all environment variables.
 * This provides a single entry point for accessing all validated configuration
 * values across the entire platform.
 */
export const envConfig = {
  database: databaseConfig,
  redis: redisConfig,
  auth: authConfig,
  platform: platformConfig,
} as const;

/**
 * Type definition for the complete environment configuration.
 */
export type EnvConfig = typeof envConfig;

/**
 * Validates that all required environment variables are present and valid.
 * This function can be called at application startup to ensure the environment
 * is properly configured before proceeding with initialization.
 * 
 * @throws Error if any required environment variable is missing or invalid
 */
export function validateEnvironment(): void {
  // The environment variables are already validated when modules are imported
  // This function serves as an explicit validation step for application startup
  try {
    // Access each config to trigger validation if not already done
    void databaseConfig;
    void redisConfig;
    void authConfig;
    void platformConfig;
  } catch (error) {
    throw new Error(`Environment validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Checks if the application is running in development mode.
 * @returns True if running in development
 */
export function isDevelopment(): boolean {
  return platformEnv.NODE_ENV === 'development';
}

/**
 * Checks if the application is running in production mode.
 * @returns True if running in production
 */
export function isProduction(): boolean {
  return platformEnv.NODE_ENV === 'production';
}

/**
 * Checks if the application is running in staging mode.
 * @returns True if running in staging
 */
export function isStaging(): boolean {
  return platformEnv.NODE_ENV === 'staging';
}

/**
 * Gets the current environment with type safety.
 * @returns The current environment
 */
export function getEnvironment(): 'development' | 'staging' | 'production' {
  return platformEnv.NODE_ENV as 'development' | 'staging' | 'production';
}

/**
 * Environment-specific configuration helpers.
 */
export const env = {
  isDevelopment: isDevelopment(),
  isProduction: isProduction(),
  isStaging: isStaging(),
  current: getEnvironment(),
  config: envConfig,
} as const;

// Export main environment types
export type Environment = typeof env.current;
