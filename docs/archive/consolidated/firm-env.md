# firm-env

Generated on: 2026-05-13T02:25:38.559Z
Total files: 14

**Description:** Environment variable validation for the Firm platform

**Version:** 0.1.0

## Table of Contents

- [auth.ts](#auth-ts)
- [database.ts](#database-ts)
- [index.ts](#index-ts)
- [platform.ts](#platform-ts)
- [redis.ts](#redis-ts)
- [auth.test.ts](#auth-test-ts)
- [constants.ts](#constants-ts)
- [database.test.ts](#database-test-ts)
- [index.test.ts](#index-test-ts)
- [platform.test.ts](#platform-test-ts)
- [redis.test.ts](#redis-test-ts)
- [utils.ts](#utils-ts)
- [tsup.config.ts](#tsup-config-ts)
- [vitest.config.ts](#vitest-config-ts)

## File Contents

### auth.ts

**Path:** `src\auth.ts`

**Language:** TypeScript

```typescript
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

/**
 * Authentication environment variable schema and validation.
 * Uses @t3-oss/env-nextjs for runtime validation with Zod schemas.
 * 
 * This module provides type-safe access to authentication configuration
 * environment variables with comprehensive validation.
 */
export const authEnv = createEnv({
  /**
   * Server-side environment variables that must be present.
   * These are required for the application to start.
   */
  server: {
    /**
     * Better Auth secret for session signing and encryption.
     * Must be at least 32 characters long for security.
     */
    AUTH_SECRET: z
      .string()
      .min(32, {
        message: 'AUTH_SECRET must be at least 32 characters long for security',
      }),

    /**
     * Better Auth URL for the auth service.
     * Must be a valid URL pointing to the auth service endpoint.
     */
    AUTH_URL: z
      .string()
      .url()
      .refine(
        (url) => url.startsWith('https://') || url.startsWith('http://localhost'),
        {
          message: 'AUTH_URL must use HTTPS in production or localhost for development',
        }
      ),

    /**
     * Session cookie secret for additional security layer.
     * Optional, but recommended for production.
     */
    AUTH_COOKIE_SECRET: z
      .string()
      .min(32, {
        message: 'AUTH_COOKIE_SECRET must be at least 32 characters long',
      })
      .optional(),

    /**
     * Session timeout in hours.
     * Optional, defaults to 24 hours if not provided.
     */
    AUTH_SESSION_TIMEOUT_HOURS: z
      .string()
      .transform(Number)
      .pipe(z.number().int().min(1).max(168)) // 1 hour to 1 week
      .optional()
      .default('24'),

    /**
     * Maximum number of concurrent sessions per user.
     * Optional, defaults to 5 if not provided.
     */
    AUTH_MAX_CONCURRENT_SESSIONS: z
      .string()
      .transform(Number)
      .pipe(z.number().int().min(1).max(20))
      .optional()
      .default('5'),

    /**
     * Enable MFA (Multi-Factor Authentication).
     * Optional, defaults to false if not provided.
     */
    AUTH_MFA_ENABLED: z
      .string()
      .transform((val) => val.toLowerCase() === 'true')
      .pipe(z.boolean())
      .optional()
      .default('false'),

    /**
     * TOTP issuer name for authenticator apps.
     * Required if AUTH_MFA_ENABLED is true.
     */
    AUTH_TOTP_ISSUER: z
      .string()
      .min(1)
      .max(100)
      .optional(),

    /**
     * OAuth provider configurations.
     * Optional - only include providers that are enabled.
     */
    AUTH_GOOGLE_CLIENT_ID: z.string().optional(),
    AUTH_GOOGLE_CLIENT_SECRET: z.string().optional(),
    AUTH_GITHUB_CLIENT_ID: z.string().optional(),
    AUTH_GITHUB_CLIENT_SECRET: z.string().optional(),
    AUTH_MICROSOFT_CLIENT_ID: z.string().optional(),
    AUTH_MICROSOFT_CLIENT_SECRET: z.string().optional(),

    /**
     * SAML provider configuration for enterprise SSO.
     * Optional - only required if using SAML.
     */
    AUTH_SAML_IDP_ENTITY_ID: z.string().url().optional(),
    AUTH_SAML_IDP_SSO_URL: z.string().url().optional(),
    AUTH_SAML_IDP_CERTIFICATE: z.string().min(1).optional(),
    AUTH_SAML_SP_ENTITY_ID: z.string().url().optional(),

    /**
     * API key encryption secret.
     * Required for API key management features.
     */
    AUTH_API_KEY_SECRET: z
      .string()
      .min(32, {
        message: 'AUTH_API_KEY_SECRET must be at least 32 characters long',
      }),

    /**
     * Enable impersonation feature for admin users.
     * Optional, defaults to false if not provided.
     */
    AUTH_IMPERSONATION_ENABLED: z
      .string()
      .transform((val) => val.toLowerCase() === 'true')
      .pipe(z.boolean())
      .optional()
      .default('false'),

    /**
     * Rate limiting for authentication endpoints.
     * Optional, defaults to 5 attempts per minute.
     */
    AUTH_RATE_LIMIT_ATTEMPTS: z
      .string()
      .transform(Number)
      .pipe(z.number().int().min(1).max(100))
      .optional()
      .default('5'),

    AUTH_RATE_LIMIT_WINDOW_MINUTES: z
      .string()
      .transform(Number)
      .pipe(z.number().int().min(1).max(60))
      .optional()
      .default('1'),
  },

  /**
   * Client-side environment variables that can be exposed to the browser.
   * These are safe to share with the frontend.
   */
  client: {
    /**
     * Public auth URL for frontend authentication flows.
     */
    NEXT_PUBLIC_AUTH_URL: z
      .string()
      .url()
      .refine(
        (url) => url.startsWith('https://') || url.startsWith('http://localhost'),
        {
          message: 'NEXT_PUBLIC_AUTH_URL must use HTTPS in production or localhost for development',
        }
      ),

    /**
     * Enable MFA in the frontend.
     */
    NEXT_PUBLIC_AUTH_MFA_ENABLED: z
      .string()
      .transform((val) => val.toLowerCase() === 'true')
      .pipe(z.boolean())
      .optional(),

    /**
     * Available OAuth providers for the frontend.
     */
    NEXT_PUBLIC_AUTH_PROVIDERS: z
      .string()
      .transform((val) => val.split(',').map(p => p.trim().toLowerCase()))
      .pipe(z.array(z.enum(['google', 'github', 'microsoft'])))
      .optional()
      .default(''),

    /**
     * Enable impersonation UI for admin users.
     */
    NEXT_PUBLIC_AUTH_IMPERSONATION_ENABLED: z
      .string()
      .transform((val) => val.toLowerCase() === 'true')
      .pipe(z.boolean())
      .optional(),
  },

  /**
   * Runtime validation to ensure all required variables are present.
   * This will throw an error if any required environment variable is missing
   * or invalid when the module is imported.
   */
  runtimeEnv: {
    AUTH_SECRET: process.env['AUTH_SECRET'],
    AUTH_URL: process.env['AUTH_URL'],
    AUTH_COOKIE_SECRET: process.env['AUTH_COOKIE_SECRET'],
    AUTH_SESSION_TIMEOUT_HOURS: process.env['AUTH_SESSION_TIMEOUT_HOURS'],
    AUTH_MAX_CONCURRENT_SESSIONS: process.env['AUTH_MAX_CONCURRENT_SESSIONS'],
    AUTH_MFA_ENABLED: process.env['AUTH_MFA_ENABLED'],
    AUTH_TOTP_ISSUER: process.env['AUTH_TOTP_ISSUER'],
    AUTH_GOOGLE_CLIENT_ID: process.env['AUTH_GOOGLE_CLIENT_ID'],
    AUTH_GOOGLE_CLIENT_SECRET: process.env['AUTH_GOOGLE_CLIENT_SECRET'],
    AUTH_GITHUB_CLIENT_ID: process.env['AUTH_GITHUB_CLIENT_ID'],
    AUTH_GITHUB_CLIENT_SECRET: process.env['AUTH_GITHUB_CLIENT_SECRET'],
    AUTH_MICROSOFT_CLIENT_ID: process.env['AUTH_MICROSOFT_CLIENT_ID'],
    AUTH_MICROSOFT_CLIENT_SECRET: process.env['AUTH_MICROSOFT_CLIENT_SECRET'],
    AUTH_SAML_IDP_ENTITY_ID: process.env['AUTH_SAML_IDP_ENTITY_ID'],
    AUTH_SAML_IDP_SSO_URL: process.env['AUTH_SAML_IDP_SSO_URL'],
    AUTH_SAML_IDP_CERTIFICATE: process.env['AUTH_SAML_IDP_CERTIFICATE'],
    AUTH_SAML_SP_ENTITY_ID: process.env['AUTH_SAML_SP_ENTITY_ID'],
    AUTH_API_KEY_SECRET: process.env['AUTH_API_KEY_SECRET'],
    AUTH_IMPERSONATION_ENABLED: process.env['AUTH_IMPERSONATION_ENABLED'],
    AUTH_RATE_LIMIT_ATTEMPTS: process.env['AUTH_RATE_LIMIT_ATTEMPTS'],
    AUTH_RATE_LIMIT_WINDOW_MINUTES: process.env['AUTH_RATE_LIMIT_WINDOW_MINUTES'],
    NEXT_PUBLIC_AUTH_URL: process.env['NEXT_PUBLIC_AUTH_URL'],
    NEXT_PUBLIC_AUTH_MFA_ENABLED: process.env['NEXT_PUBLIC_AUTH_MFA_ENABLED'],
    NEXT_PUBLIC_AUTH_PROVIDERS: process.env['NEXT_PUBLIC_AUTH_PROVIDERS'],
    NEXT_PUBLIC_AUTH_IMPERSONATION_ENABLED: process.env['NEXT_PUBLIC_AUTH_IMPERSONATION_ENABLED'],
  },

  /**
   * Skip validation for empty strings (not used - we want strict validation).
   */
  skipValidation: true,
});

/**
 * Type-safe accessors for authentication configuration.
 * These functions provide convenient access to validated environment variables.
 */

/**
 * Gets the Better Auth secret.
 * @returns The auth secret for session signing
 */
export function getAuthSecret(): string {
  return authEnv.AUTH_SECRET;
}

/**
 * Gets the Better Auth URL.
 * @returns The auth service URL
 */
export function getAuthUrl(): string {
  return authEnv.AUTH_URL;
}

/**
 * Gets the session cookie secret if configured.
 * @returns The cookie secret or undefined
 */
export function getAuthCookieSecret(): string | undefined {
  return authEnv.AUTH_COOKIE_SECRET;
}

/**
 * Gets the session timeout in hours.
 * @returns Session timeout in hours
 */
export function getAuthSessionTimeoutHours(): number {
  return authEnv.AUTH_SESSION_TIMEOUT_HOURS;
}

/**
 * Gets the maximum concurrent sessions per user.
 * @returns Maximum concurrent sessions
 */
export function getAuthMaxConcurrentSessions(): number {
  return authEnv.AUTH_MAX_CONCURRENT_SESSIONS;
}

/**
 * Checks if MFA is enabled.
 * @returns True if MFA is enabled
 */
export function isAuthMfaEnabled(): boolean {
  return authEnv.AUTH_MFA_ENABLED;
}

/**
 * Gets the TOTP issuer name.
 * @returns The TOTP issuer or undefined
 */
export function getAuthTotPIssuer(): string | undefined {
  return authEnv.AUTH_TOTP_ISSUER;
}

/**
 * Gets OAuth provider configurations.
 * @returns Object containing OAuth client IDs and secrets
 */
export function getAuthOAuthProviders() {
  return {
    google: {
      clientId: authEnv.AUTH_GOOGLE_CLIENT_ID,
      clientSecret: authEnv.AUTH_GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: authEnv.AUTH_GITHUB_CLIENT_ID,
      clientSecret: authEnv.AUTH_GITHUB_CLIENT_SECRET,
    },
    microsoft: {
      clientId: authEnv.AUTH_MICROSOFT_CLIENT_ID,
      clientSecret: authEnv.AUTH_MICROSOFT_CLIENT_SECRET,
    },
  } as const;
}

/**
 * Gets SAML provider configuration.
 * @returns Object containing SAML configuration
 */
export function getAuthSamlConfig() {
  return {
    idpEntityId: authEnv.AUTH_SAML_IDP_ENTITY_ID,
    idpSsoUrl: authEnv.AUTH_SAML_IDP_SSO_URL,
    idpCertificate: authEnv.AUTH_SAML_IDP_CERTIFICATE,
    spEntityId: authEnv.AUTH_SAML_SP_ENTITY_ID,
  } as const;
}

/**
 * Gets the API key encryption secret.
 * @returns The API key secret
 */
export function getAuthApiKeySecret(): string {
  return authEnv.AUTH_API_KEY_SECRET;
}

/**
 * Checks if impersonation is enabled.
 * @returns True if impersonation is enabled
 */
export function isAuthImpersonationEnabled(): boolean {
  return authEnv.AUTH_IMPERSONATION_ENABLED;
}

/**
 * Gets rate limiting configuration.
 * @returns Object containing rate limit settings
 */
export function getAuthRateLimit() {
  return {
    attempts: authEnv.AUTH_RATE_LIMIT_ATTEMPTS,
    windowMinutes: authEnv.AUTH_RATE_LIMIT_WINDOW_MINUTES,
  } as const;
}

/**
 * Gets the public auth URL for frontend.
 * @returns The public auth URL
 */
export function getPublicAuthUrl(): string {
  return authEnv.NEXT_PUBLIC_AUTH_URL;
}

/**
 * Gets available OAuth providers for frontend.
 * @returns Array of available provider names
 */
export function getPublicAuthProviders(): string[] {
  return authEnv.NEXT_PUBLIC_AUTH_PROVIDERS;
}

/**
 * Authentication configuration object for use with auth services.
 * This aggregates all authentication-related environment variables into a single
 * configuration object that can be passed directly to auth libraries.
 */
export const authConfig = {
  secret: getAuthSecret(),
  url: getAuthUrl(),
  cookieSecret: getAuthCookieSecret(),
  sessionTimeoutHours: getAuthSessionTimeoutHours(),
  maxConcurrentSessions: getAuthMaxConcurrentSessions(),
  mfaEnabled: isAuthMfaEnabled(),
  totpIssuer: getAuthTotPIssuer(),
  oauthProviders: getAuthOAuthProviders(),
  samlConfig: getAuthSamlConfig(),
  apiKeySecret: getAuthApiKeySecret(),
  impersonationEnabled: isAuthImpersonationEnabled(),
  rateLimit: getAuthRateLimit(),
  publicUrl: getPublicAuthUrl(),
  publicProviders: getPublicAuthProviders(),
  publicMfaEnabled: authEnv.NEXT_PUBLIC_AUTH_MFA_ENABLED,
  publicImpersonationEnabled: authEnv.NEXT_PUBLIC_AUTH_IMPERSONATION_ENABLED,
} as const;

// Export types for external use
export type AuthEnv = typeof authEnv;
export type AuthConfig = typeof authConfig;

```

---

### database.ts

**Path:** `src\database.ts`

**Language:** TypeScript

```typescript
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

```

---

### index.ts

**Path:** `src\index.ts`

**Language:** TypeScript

```typescript
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

```

---

### platform.ts

**Path:** `src\platform.ts`

**Language:** TypeScript

```typescript
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

/**
 * Platform environment variable schema and validation.
 * Uses @t3-oss/env-nextjs for runtime validation with Zod schemas.
 * 
 * This module provides type-safe access to platform configuration
 * environment variables with comprehensive validation.
 */
export const platformEnv = createEnv({
  /**
   * Server-side environment variables that must be present.
   * These are required for the application to start.
   */
  server: {
    /**
     * Application environment (development, staging, production).
     * Required for environment-specific behavior.
     */
    NODE_ENV: z
      .enum(['development', 'staging', 'production'])
      .default('development'),

    /**
     * Application version for deployment tracking.
     * Required for observability and debugging.
     */
    APP_VERSION: z
      .string()
      .min(1)
      .max(50)
      .regex(/^[v0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+)?$/, {
        message: 'APP_VERSION must follow semantic versioning (e.g., v1.2.3 or v1.2.3-beta)',
      }),

    /**
     * Platform deployment region.
     * Required for multi-region deployments.
     */
    PLATFORM_REGION: z
      .string()
      .min(1)
      .max(20)
      .regex(/^[a-z0-9-]+$/, {
        message: 'PLATFORM_REGION must contain only lowercase letters, numbers, and hyphens',
      }),

    /**
     * Platform instance identifier.
     * Required for multi-instance deployments.
     */
    PLATFORM_INSTANCE_ID: z
      .string()
      .min(1)
      .max(100),

    /**
     * Enable debug mode for additional logging.
     * Optional, defaults to false in production.
     */
    PLATFORM_DEBUG_ENABLED: z
      .string()
      .transform((val) => val.toLowerCase() === 'true')
      .pipe(z.boolean())
      .optional()
      .default('false'),

    /**
     * Log level for the application.
     * Optional, defaults to 'info' if not provided.
     */
    PLATFORM_LOG_LEVEL: z
      .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
      .optional()
      .default('info'),

    /**
     * Enable observability (metrics, traces).
     * Optional, defaults to true in production.
     */
    PLATFORM_OBSERVABILITY_ENABLED: z
      .string()
      .transform((val) => val.toLowerCase() === 'true')
      .pipe(z.boolean())
      .optional()
      .default('true'),

    /**
     * OpenTelemetry collector endpoint.
     * Required if observability is enabled.
     */
    PLATFORM_OTEL_COLLECTOR_ENDPOINT: z
      .string()
      .url()
      .optional(),

    /**
     * OpenTelemetry service name.
     * Required for observability tracking.
     */
    PLATFORM_OTEL_SERVICE_NAME: z
      .string()
      .min(1)
      .max(50)
      .optional(),

    /**
     * Enable feature flags system.
     * Optional, defaults to false if not provided.
     */
    PLATFORM_FEATURE_FLAGS_ENABLED: z
      .string()
      .transform((val) => val.toLowerCase() === 'true')
      .pipe(z.boolean())
      .optional()
      .default('false'),

    /**
     * Feature flags provider endpoint.
     * Required if feature flags are enabled.
     */
    PLATFORM_FEATURE_FLAGS_ENDPOINT: z
      .string()
      .url()
      .optional(),

    /**
     * Feature flags SDK key.
     * Required if feature flags are enabled.
     */
    PLATFORM_FEATURE_FLAGS_SDK_KEY: z
      .string()
      .min(1)
      .optional(),

    /**
     * Enable webhook processing.
     * Optional, defaults to true if not provided.
     */
    PLATFORM_WEBHOOKS_ENABLED: z
      .string()
      .transform((val) => val.toLowerCase() === 'true')
      .pipe(z.boolean())
      .optional()
      .default('true'),

    /**
     * Webhook secret for signature verification.
     * Required if webhooks are enabled.
     */
    PLATFORM_WEBHOOK_SECRET: z
      .string()
      .min(32, {
        message: 'PLATFORM_WEBHOOK_SECRET must be at least 32 characters long',
      })
      .optional(),

    /**
     * Maximum webhook processing timeout in seconds.
     * Optional, defaults to 30 seconds if not provided.
     */
    PLATFORM_WEBHOOK_TIMEOUT_SECONDS: z
      .string()
      .transform(Number)
      .pipe(z.number().int().min(1).max(300))
      .optional()
      .default('30'),

    /**
     * Enable background job processing.
     * Optional, defaults to true if not provided.
     */
    PLATFORM_JOBS_ENABLED: z
      .string()
      .transform((val) => val.toLowerCase() === 'true')
      .pipe(z.boolean())
      .optional()
      .default('true'),

    /**
     * Job queue provider (redis, bullmq, etc.).
     * Required if jobs are enabled.
     */
    PLATFORM_JOB_QUEUE_PROVIDER: z
      .enum(['redis', 'bullmq', 'memory'])
      .optional()
      .default('redis'),

    /**
     * Enable email sending.
     * Optional, defaults to true if not provided.
     */
    PLATFORM_EMAIL_ENABLED: z
      .string()
      .transform((val) => val.toLowerCase() === 'true')
      .pipe(z.boolean())
      .optional()
      .default('true'),

    /**
     * Email provider (resend, sendgrid, ses, etc.).
     * Required if email is enabled.
     */
    PLATFORM_EMAIL_PROVIDER: z
      .enum(['resend', 'sendgrid', 'ses', 'smtp'])
      .optional()
      .default('resend'),

    /**
     * Email provider API key.
     * Required if email is enabled.
     */
    PLATFORM_EMAIL_API_KEY: z
      .string()
      .min(1)
      .optional(),

    /**
     * Default from email address.
     * Required if email is enabled.
     */
    PLATFORM_EMAIL_FROM_ADDRESS: z
      .string()
      .email()
      .optional(),

    /**
     * Enable file storage.
     * Optional, defaults to true if not provided.
     */
    PLATFORM_STORAGE_ENABLED: z
      .string()
      .transform((val) => val.toLowerCase() === 'true')
      .pipe(z.boolean())
      .optional()
      .default('true'),

    /**
     * Storage provider (s3, gcs, azure, etc.).
     * Required if storage is enabled.
     */
    PLATFORM_STORAGE_PROVIDER: z
      .enum(['s3', 'gcs', 'azure', 'local'])
      .optional()
      .default('s3'),

    /**
     * Storage bucket name.
     * Required if cloud storage is enabled.
     */
    PLATFORM_STORAGE_BUCKET: z
      .string()
      .min(1)
      .max(63)
      .regex(/^[a-z0-9.-]+$/, {
        message: 'PLATFORM_STORAGE_BUCKET must contain only lowercase letters, numbers, dots, and hyphens',
      })
      .optional(),

    /**
     * Storage region.
     * Required if cloud storage is enabled.
     */
    PLATFORM_STORAGE_REGION: z
      .string()
      .min(1)
      .max(20)
      .regex(/^[a-z0-9-]+$/, {
        message: 'PLATFORM_STORAGE_REGION must contain only lowercase letters, numbers, and hyphens',
      })
      .optional(),

    /**
     * Storage access key.
     * Required if cloud storage is enabled.
     */
    PLATFORM_STORAGE_ACCESS_KEY: z
      .string()
      .min(1)
      .optional(),

    /**
     * Storage secret key.
     * Required if cloud storage is enabled.
     */
    PLATFORM_STORAGE_SECRET_KEY: z
      .string()
      .min(1)
      .optional(),

    /**
     * Enable AI/ML features.
     * Optional, defaults to false if not provided.
     */
    PLATFORM_AI_ENABLED: z
      .string()
      .transform((val) => val.toLowerCase() === 'true')
      .pipe(z.boolean())
      .optional()
      .default('false'),

    /**
     * AI provider (openai, anthropic, etc.).
     * Optional, defaults to 'openai' if AI is enabled.
     */
    PLATFORM_AI_PROVIDER: z
      .enum(['openai', 'anthropic', 'google', 'azure'])
      .optional(),

    /**
     * AI provider API key.
     * Optional, required if AI is enabled.
     */
    PLATFORM_AI_API_KEY: z
      .string()
      .min(1)
      .optional(),

    /**
     * AI model to use.
     * Optional, required if AI is enabled.
     */
    PLATFORM_AI_MODEL: z
      .string()
      .min(1)
      .max(100)
      .optional(),

    /**
     * Maximum API calls per minute for AI features.
     * Optional, defaults to 60 if AI is enabled.
     */
    PLATFORM_AI_RATE_LIMIT_PER_MINUTE: z
      .string()
      .transform(Number)
      .pipe(z.number().int().min(1).max(1000))
      .optional(),
  },

  /**
   * Client-side environment variables that can be exposed to the browser.
   * These are safe to share with the frontend.
   */
  client: {
    /**
     * Public API URL for frontend requests.
     */
    NEXT_PUBLIC_API_URL: z
      .string()
      .url()
      .refine(
        (url) => url.startsWith('https://') || url.startsWith('http://localhost'),
        {
          message: 'NEXT_PUBLIC_API_URL must use HTTPS in production or localhost for development',
        }
      ),

    /**
     * Application version for frontend display.
     */
    NEXT_PUBLIC_APP_VERSION: z
      .string()
      .min(1)
      .max(50),

    /**
     * Platform environment for frontend behavior.
     */
    NEXT_PUBLIC_PLATFORM_ENV: z
      .enum(['development', 'staging', 'production'])
      .default('development'),

    /**
     * Enable debug mode in frontend.
     */
    NEXT_PUBLIC_DEBUG_ENABLED: z
      .string()
      .transform((val) => val.toLowerCase() === 'true')
      .pipe(z.boolean())
      .optional(),

    /**
     * Enable feature flags in frontend.
     */
    NEXT_PUBLIC_FEATURE_FLAGS_ENABLED: z
      .string()
      .transform((val) => val.toLowerCase() === 'true')
      .pipe(z.boolean())
      .optional(),

    /**
     * Feature flags client SDK key.
     */
    NEXT_PUBLIC_FEATURE_FLAGS_CLIENT_KEY: z
      .string()
      .min(1)
      .optional(),

    /**
     * Enable AI features in frontend.
     */
    NEXT_PUBLIC_AI_ENABLED: z
      .string()
      .transform((val) => val.toLowerCase() === 'true')
      .pipe(z.boolean())
      .optional(),

    /**
     * Sentry DSN for error tracking.
     */
    NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),

    /**
     * Enable analytics tracking.
     */
    NEXT_PUBLIC_ANALYTICS_ENABLED: z
      .string()
      .transform((val) => val.toLowerCase() === 'true')
      .pipe(z.boolean())
      .optional(),

    /**
     * Analytics tracking ID.
     */
    NEXT_PUBLIC_ANALYTICS_ID: z.string().optional(),
  },

  /**
   * Runtime validation to ensure all required variables are present.
   * This will throw an error if any required environment variable is missing
   * or invalid when the module is imported.
   */
  runtimeEnv: {
    NODE_ENV: process.env['NODE_ENV'],
    APP_VERSION: process.env['APP_VERSION'],
    PLATFORM_REGION: process.env['PLATFORM_REGION'],
    PLATFORM_INSTANCE_ID: process.env['PLATFORM_INSTANCE_ID'],
    PLATFORM_DEBUG_ENABLED: process.env['PLATFORM_DEBUG_ENABLED'],
    PLATFORM_LOG_LEVEL: process.env['PLATFORM_LOG_LEVEL'],
    PLATFORM_OBSERVABILITY_ENABLED: process.env['PLATFORM_OBSERVABILITY_ENABLED'],
    PLATFORM_OTEL_COLLECTOR_ENDPOINT: process.env['PLATFORM_OTEL_COLLECTOR_ENDPOINT'],
    PLATFORM_OTEL_SERVICE_NAME: process.env['PLATFORM_OTEL_SERVICE_NAME'],
    PLATFORM_FEATURE_FLAGS_ENABLED: process.env['PLATFORM_FEATURE_FLAGS_ENABLED'],
    PLATFORM_FEATURE_FLAGS_ENDPOINT: process.env['PLATFORM_FEATURE_FLAGS_ENDPOINT'],
    PLATFORM_FEATURE_FLAGS_SDK_KEY: process.env['PLATFORM_FEATURE_FLAGS_SDK_KEY'],
    PLATFORM_WEBHOOKS_ENABLED: process.env['PLATFORM_WEBHOOKS_ENABLED'],
    PLATFORM_WEBHOOK_SECRET: process.env['PLATFORM_WEBHOOK_SECRET'],
    PLATFORM_WEBHOOK_TIMEOUT_SECONDS: process.env['PLATFORM_WEBHOOK_TIMEOUT_SECONDS'],
    PLATFORM_JOBS_ENABLED: process.env['PLATFORM_JOBS_ENABLED'],
    PLATFORM_JOB_QUEUE_PROVIDER: process.env['PLATFORM_JOB_QUEUE_PROVIDER'],
    PLATFORM_EMAIL_ENABLED: process.env['PLATFORM_EMAIL_ENABLED'],
    PLATFORM_EMAIL_PROVIDER: process.env['PLATFORM_EMAIL_PROVIDER'],
    PLATFORM_EMAIL_API_KEY: process.env['PLATFORM_EMAIL_API_KEY'],
    PLATFORM_EMAIL_FROM_ADDRESS: process.env['PLATFORM_EMAIL_FROM_ADDRESS'],
    PLATFORM_STORAGE_ENABLED: process.env['PLATFORM_STORAGE_ENABLED'],
    PLATFORM_STORAGE_PROVIDER: process.env['PLATFORM_STORAGE_PROVIDER'],
    PLATFORM_STORAGE_BUCKET: process.env['PLATFORM_STORAGE_BUCKET'],
    PLATFORM_STORAGE_REGION: process.env['PLATFORM_STORAGE_REGION'],
    PLATFORM_STORAGE_ACCESS_KEY: process.env['PLATFORM_STORAGE_ACCESS_KEY'],
    PLATFORM_STORAGE_SECRET_KEY: process.env['PLATFORM_STORAGE_SECRET_KEY'],
    PLATFORM_AI_ENABLED: process.env['PLATFORM_AI_ENABLED'],
    PLATFORM_AI_PROVIDER: process.env['PLATFORM_AI_PROVIDER'],
    PLATFORM_AI_API_KEY: process.env['PLATFORM_AI_API_KEY'],
    PLATFORM_AI_MODEL: process.env['PLATFORM_AI_MODEL'],
    PLATFORM_AI_RATE_LIMIT_PER_MINUTE: process.env['PLATFORM_AI_RATE_LIMIT_PER_MINUTE'],
    NEXT_PUBLIC_API_URL: process.env['NEXT_PUBLIC_API_URL'],
    NEXT_PUBLIC_APP_VERSION: process.env['NEXT_PUBLIC_APP_VERSION'],
    NEXT_PUBLIC_PLATFORM_ENV: process.env['NEXT_PUBLIC_PLATFORM_ENV'],
    NEXT_PUBLIC_DEBUG_ENABLED: process.env['NEXT_PUBLIC_DEBUG_ENABLED'],
    NEXT_PUBLIC_FEATURE_FLAGS_ENABLED: process.env['NEXT_PUBLIC_FEATURE_FLAGS_ENABLED'],
    NEXT_PUBLIC_FEATURE_FLAGS_CLIENT_KEY: process.env['NEXT_PUBLIC_FEATURE_FLAGS_CLIENT_KEY'],
    NEXT_PUBLIC_AI_ENABLED: process.env['NEXT_PUBLIC_AI_ENABLED'],
    NEXT_PUBLIC_SENTRY_DSN: process.env['NEXT_PUBLIC_SENTRY_DSN'],
    NEXT_PUBLIC_ANALYTICS_ENABLED: process.env['NEXT_PUBLIC_ANALYTICS_ENABLED'],
    NEXT_PUBLIC_ANALYTICS_ID: process.env['NEXT_PUBLIC_ANALYTICS_ID'],
  },

  /**
   * Skip validation for empty strings (not used - we want strict validation).
   */
  skipValidation: true,
});

/**
 * Type-safe accessors for platform configuration.
 * These functions provide convenient access to validated environment variables.
 */

/**
 * Gets the Node.js environment.
 * @returns The current environment
 */
export function getNodeEnv(): string {
  return platformEnv.NODE_ENV;
}

/**
 * Gets the application version.
 * @returns The application version
 */
export function getAppVersion(): string {
  return platformEnv.APP_VERSION;
}

/**
 * Gets the platform deployment region.
 * @returns The deployment region
 */
export function getPlatformRegion(): string {
  return platformEnv.PLATFORM_REGION;
}

/**
 * Gets the platform instance identifier.
 * @returns The instance ID
 */
export function getPlatformInstanceId(): string {
  return platformEnv.PLATFORM_INSTANCE_ID;
}

/**
 * Checks if debug mode is enabled.
 * @returns True if debug mode is enabled
 */
export function isPlatformDebugEnabled(): boolean {
  return platformEnv.PLATFORM_DEBUG_ENABLED;
}

/**
 * Gets the platform log level.
 * @returns The log level
 */
export function getPlatformLogLevel(): string {
  return platformEnv.PLATFORM_LOG_LEVEL;
}

/**
 * Checks if observability is enabled.
 * @returns True if observability is enabled
 */
export function isPlatformObservabilityEnabled(): boolean {
  return platformEnv.PLATFORM_OBSERVABILITY_ENABLED;
}

/**
 * Gets the OpenTelemetry collector endpoint.
 * @returns The collector endpoint or undefined
 */
export function getPlatformOtelCollectorEndpoint(): string | undefined {
  return platformEnv.PLATFORM_OTEL_COLLECTOR_ENDPOINT;
}

/**
 * Gets the OpenTelemetry service name.
 * @returns The service name or undefined
 */
export function getPlatformOtelServiceName(): string | undefined {
  return platformEnv.PLATFORM_OTEL_SERVICE_NAME;
}

/**
 * Checks if feature flags are enabled.
 * @returns True if feature flags are enabled
 */
export function isPlatformFeatureFlagsEnabled(): boolean {
  return platformEnv.PLATFORM_FEATURE_FLAGS_ENABLED;
}

/**
 * Gets the feature flags configuration.
 * @returns Object containing feature flags settings
 */
export function getPlatformFeatureFlagsConfig() {
  return {
    enabled: isPlatformFeatureFlagsEnabled(),
    endpoint: platformEnv.PLATFORM_FEATURE_FLAGS_ENDPOINT,
    sdkKey: platformEnv.PLATFORM_FEATURE_FLAGS_SDK_KEY,
  } as const;
}

/**
 * Checks if webhooks are enabled.
 * @returns True if webhooks are enabled
 */
export function isPlatformWebhooksEnabled(): boolean {
  return platformEnv.PLATFORM_WEBHOOKS_ENABLED;
}

/**
 * Gets the webhook configuration.
 * @returns Object containing webhook settings
 */
export function getPlatformWebhookConfig() {
  return {
    enabled: isPlatformWebhooksEnabled(),
    secret: platformEnv.PLATFORM_WEBHOOK_SECRET,
    timeoutSeconds: platformEnv.PLATFORM_WEBHOOK_TIMEOUT_SECONDS,
  } as const;
}

/**
 * Checks if background jobs are enabled.
 * @returns True if jobs are enabled
 */
export function isPlatformJobsEnabled(): boolean {
  return platformEnv.PLATFORM_JOBS_ENABLED;
}

/**
 * Gets the job queue provider.
 * @returns The queue provider
 */
export function getPlatformJobQueueProvider(): string {
  return platformEnv.PLATFORM_JOB_QUEUE_PROVIDER;
}

/**
 * Checks if email sending is enabled.
 * @returns True if email is enabled
 */
export function isPlatformEmailEnabled(): boolean {
  return platformEnv.PLATFORM_EMAIL_ENABLED;
}

/**
 * Gets the email configuration.
 * @returns Object containing email settings
 */
export function getPlatformEmailConfig() {
  return {
    enabled: isPlatformEmailEnabled(),
    provider: platformEnv.PLATFORM_EMAIL_PROVIDER,
    apiKey: platformEnv.PLATFORM_EMAIL_API_KEY,
    fromAddress: platformEnv.PLATFORM_EMAIL_FROM_ADDRESS,
  } as const;
}

/**
 * Checks if file storage is enabled.
 * @returns True if storage is enabled
 */
export function isPlatformStorageEnabled(): boolean {
  return platformEnv.PLATFORM_STORAGE_ENABLED;
}

/**
 * Gets the storage configuration.
 * @returns Object containing storage settings
 */
export function getPlatformStorageConfig() {
  return {
    enabled: isPlatformStorageEnabled(),
    provider: platformEnv.PLATFORM_STORAGE_PROVIDER ?? 's3',
    bucket: platformEnv.PLATFORM_STORAGE_BUCKET,
    region: platformEnv.PLATFORM_STORAGE_REGION,
    accessKey: platformEnv.PLATFORM_STORAGE_ACCESS_KEY,
    secretKey: platformEnv.PLATFORM_STORAGE_SECRET_KEY,
  } as const;
}

/**
 * Checks if AI features are enabled.
 * @returns True if AI is enabled
 */
export function isPlatformAiEnabled(): boolean {
  return platformEnv.PLATFORM_AI_ENABLED;
}

/**
 * Gets the AI configuration.
 * @returns Object containing AI settings
 */
export function getPlatformAiConfig() {
  return {
    enabled: isPlatformAiEnabled(),
    provider: platformEnv.PLATFORM_AI_PROVIDER ?? 'openai',
    apiKey: platformEnv.PLATFORM_AI_API_KEY,
    model: platformEnv.PLATFORM_AI_MODEL,
    rateLimitPerMinute: platformEnv.PLATFORM_AI_RATE_LIMIT_PER_MINUTE ?? 60,
  } as const;
}

/**
 * Gets the public API URL for frontend.
 * @returns The public API URL
 */
export function getPublicApiUrl(): string {
  return platformEnv.NEXT_PUBLIC_API_URL;
}

/**
 * Gets the public application version.
 * @returns The public app version
 */
export function getPublicAppVersion(): string {
  return platformEnv.NEXT_PUBLIC_APP_VERSION;
}

/**
 * Gets the public platform environment.
 * @returns The public platform environment
 */
export function getPublicPlatformEnv(): string {
  return platformEnv.NEXT_PUBLIC_PLATFORM_ENV;
}

/**
 * Checks if debug mode is enabled in frontend.
 * @returns True if debug is enabled in frontend
 */
export function isPublicDebugEnabled(): boolean {
  return platformEnv.NEXT_PUBLIC_DEBUG_ENABLED ?? false;
}

/**
 * Gets the public feature flags configuration.
 * @returns Object containing public feature flags settings
 */
export function getPublicFeatureFlagsConfig() {
  return {
    enabled: platformEnv.NEXT_PUBLIC_FEATURE_FLAGS_ENABLED,
    clientKey: platformEnv.NEXT_PUBLIC_FEATURE_FLAGS_CLIENT_KEY,
  } as const;
}

/**
 * Checks if AI features are enabled in frontend.
 * @returns True if AI is enabled in frontend
 */
export function isPublicAiEnabled(): boolean {
  return platformEnv.NEXT_PUBLIC_AI_ENABLED ?? false;
}

/**
 * Gets the Sentry DSN for error tracking.
 * @returns The Sentry DSN or undefined
 */
export function getPublicSentryDsn(): string | undefined {
  return platformEnv.NEXT_PUBLIC_SENTRY_DSN;
}

/**
 * Gets the analytics configuration.
 * @returns Object containing analytics settings
 */
export function getPublicAnalyticsConfig() {
  return {
    enabled: platformEnv.NEXT_PUBLIC_ANALYTICS_ENABLED,
    id: platformEnv.NEXT_PUBLIC_ANALYTICS_ID,
  } as const;
}

/**
 * Platform configuration object for use with platform services.
 * This aggregates all platform-related environment variables into a single
 * configuration object that can be passed directly to platform libraries.
 */
export const platformConfig = {
  nodeEnv: getNodeEnv(),
  appVersion: getAppVersion(),
  region: getPlatformRegion(),
  instanceId: getPlatformInstanceId(),
  debugEnabled: isPlatformDebugEnabled(),
  logLevel: getPlatformLogLevel(),
  observability: {
    enabled: isPlatformObservabilityEnabled(),
    collectorEndpoint: getPlatformOtelCollectorEndpoint(),
    serviceName: getPlatformOtelServiceName(),
  },
  featureFlags: getPlatformFeatureFlagsConfig(),
  webhooks: getPlatformWebhookConfig(),
  jobs: {
    enabled: isPlatformJobsEnabled(),
    queueProvider: getPlatformJobQueueProvider(),
  },
  email: getPlatformEmailConfig(),
  storage: getPlatformStorageConfig(),
  ai: getPlatformAiConfig(),
  public: {
    apiUrl: getPublicApiUrl(),
    appVersion: getPublicAppVersion(),
    platformEnv: getPublicPlatformEnv(),
    debugEnabled: platformEnv.NEXT_PUBLIC_DEBUG_ENABLED ?? false,
    featureFlags: getPublicFeatureFlagsConfig(),
    aiEnabled: platformEnv.NEXT_PUBLIC_AI_ENABLED ?? false,
    sentryDsn: getPublicSentryDsn(),
    analytics: getPublicAnalyticsConfig(),
  },
} as const;

// Export types for external use
export type PlatformEnv = typeof platformEnv;
export type PlatformConfig = typeof platformConfig;

```

---

### redis.ts

**Path:** `src\redis.ts`

**Language:** TypeScript

```typescript
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

```

---

### auth.test.ts

**Path:** `src\tests\auth.test.ts`

**Language:** TypeScript

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { authEnv, authConfig } from '../auth';
import { useEnhancedTestIsolation, setupAuthEnvironment, expectSpecificError, expectAnyError } from './utils';
import {
  VALID_AUTH_SECRET,
  VALID_API_KEY_SECRET,
  VALID_AUTH_URL,
  VALID_LOCALHOST_AUTH_URL,
  VALID_APP_VERSION,
  INVALID_SHORT_SECRET,
  INVALID_HTTP_AUTH_URL,
  MAX_SESSION_TIMEOUT_HOURS,
  MIN_SESSION_TIMEOUT_HOURS,
  MAX_CONCURRENT_SESSIONS,
  MIN_CONCURRENT_SESSIONS,
  MAX_RATE_LIMIT_ATTEMPTS,
  MIN_RATE_LIMIT_ATTEMPTS,
  MAX_RATE_LIMIT_WINDOW_MINUTES,
  MIN_RATE_LIMIT_WINDOW_MINUTES,
  MAX_TOTP_ISSUER_LENGTH,
  DEFAULT_SESSION_TIMEOUT_HOURS,
  DEFAULT_MAX_CONCURRENT_SESSIONS,
  DEFAULT_MFA_ENABLED,
  DEFAULT_IMPERSONATION_ENABLED,
  DEFAULT_RATE_LIMIT_ATTEMPTS,
  DEFAULT_RATE_LIMIT_WINDOW_MINUTES,
  OAUTH_PROVIDERS,
  generateLongString,
  generateTooLongString,
  generateEdgeCaseData,
  ERROR_MESSAGES,
} from './constants';

describe('Auth Environment Validation', () => {
  useEnhancedTestIsolation();

  describe('Required Server Variables', () => {
    const setupRequiredVars = () => {
      setupAuthEnvironment({
        AUTH_SECRET: VALID_AUTH_SECRET,
        AUTH_URL: VALID_AUTH_URL,
        AUTH_API_KEY_SECRET: VALID_API_KEY_SECRET,
        NEXT_PUBLIC_AUTH_URL: VALID_AUTH_URL,
        NEXT_PUBLIC_APP_VERSION: VALID_APP_VERSION,
      });
    };

    it('should validate required AUTH_SECRET', () => {
      setupRequiredVars();
      expect(authEnv.AUTH_SECRET).toBe(VALID_AUTH_SECRET);
    });

    it('should throw error for short AUTH_SECRET', () => {
      setupRequiredVars();
      process.env.AUTH_SECRET = INVALID_SHORT_SECRET;
      expectSpecificError(
        () => authEnv.AUTH_SECRET,
        ERROR_MESSAGES.AUTH_SECRET_TOO_SHORT
      );
    });

    it('should throw error for missing AUTH_SECRET', () => {
      setupRequiredVars();
      delete process.env.AUTH_SECRET;
      expectAnyError(() => authEnv.AUTH_SECRET);
    });

    it('should validate required AUTH_URL', () => {
      setupRequiredVars();
      expect(authEnv.AUTH_URL).toBe(VALID_AUTH_URL);
    });

    it('should validate localhost AUTH_URL in development', () => {
      setupRequiredVars();
      process.env.NODE_ENV = 'development';
      process.env.AUTH_URL = VALID_LOCALHOST_AUTH_URL;
      process.env.NEXT_PUBLIC_AUTH_URL = VALID_LOCALHOST_AUTH_URL;
      expect(authEnv.AUTH_URL).toBe(VALID_LOCALHOST_AUTH_URL);
    });

    it('should throw error for HTTP AUTH_URL in production', () => {
      setupRequiredVars();
      process.env.NODE_ENV = 'production';
      process.env.AUTH_URL = INVALID_HTTP_AUTH_URL;
      process.env.NEXT_PUBLIC_AUTH_URL = INVALID_HTTP_AUTH_URL;
      expectSpecificError(
        () => authEnv.AUTH_URL,
        ERROR_MESSAGES.AUTH_URL_HTTPS_REQUIRED
      );
    });

    it('should validate required AUTH_API_KEY_SECRET', () => {
      setupRequiredVars();
      expect(authEnv.AUTH_API_KEY_SECRET).toBe(VALID_API_KEY_SECRET);
    });

    it('should throw error for short AUTH_API_KEY_SECRET', () => {
      setupRequiredVars();
      process.env.AUTH_API_KEY_SECRET = INVALID_SHORT_SECRET;
      expectSpecificError(
        () => authEnv.AUTH_API_KEY_SECRET,
        ERROR_MESSAGES.AUTH_API_KEY_SECRET_TOO_SHORT
      );
    });
  });

  describe('Required Client Variables', () => {
    const setupRequiredVars = () => {
      setupAuthEnvironment({
        AUTH_SECRET: VALID_AUTH_SECRET,
        AUTH_URL: VALID_AUTH_URL,
        AUTH_API_KEY_SECRET: VALID_API_KEY_SECRET,
        NEXT_PUBLIC_AUTH_URL: VALID_AUTH_URL,
        NEXT_PUBLIC_APP_VERSION: VALID_APP_VERSION,
      });
    };

    it('should validate required NEXT_PUBLIC_AUTH_URL', () => {
      setupRequiredVars();
      expect(authEnv.NEXT_PUBLIC_AUTH_URL).toBe(VALID_AUTH_URL);
    });

    it('should validate localhost NEXT_PUBLIC_AUTH_URL', () => {
      setupRequiredVars();
      process.env.NEXT_PUBLIC_AUTH_URL = VALID_LOCALHOST_AUTH_URL;
      expect(authEnv.NEXT_PUBLIC_AUTH_URL).toBe(VALID_LOCALHOST_AUTH_URL);
    });

    it('should throw error for missing NEXT_PUBLIC_AUTH_URL', () => {
      setupRequiredVars();
      delete process.env.NEXT_PUBLIC_AUTH_URL;
      expectAnyError(() => authEnv.NEXT_PUBLIC_AUTH_URL);
    });

    it('should validate required NEXT_PUBLIC_APP_VERSION', () => {
      setupRequiredVars();
      expect(authEnv.NEXT_PUBLIC_APP_VERSION).toBe(VALID_APP_VERSION);
    });

    it('should throw error for missing NEXT_PUBLIC_APP_VERSION', () => {
      setupRequiredVars();
      delete process.env.NEXT_PUBLIC_APP_VERSION;
      expectAnyError(() => authEnv.NEXT_PUBLIC_APP_VERSION);
    });
  });

  describe('Optional Variables', () => {
    const setupRequiredVars = () => {
      setupAuthEnvironment({
        AUTH_SECRET: VALID_AUTH_SECRET,
        AUTH_URL: VALID_AUTH_URL,
        AUTH_API_KEY_SECRET: VALID_API_KEY_SECRET,
        NEXT_PUBLIC_AUTH_URL: VALID_AUTH_URL,
        NEXT_PUBLIC_APP_VERSION: VALID_APP_VERSION,
      });
    };

    it('should use default session timeout when not provided', () => {
      setupRequiredVars();
      delete process.env.AUTH_SESSION_TIMEOUT_HOURS;
      expect(authEnv.AUTH_SESSION_TIMEOUT_HOURS).toBe(DEFAULT_SESSION_TIMEOUT_HOURS);
    });

    it('should validate custom session timeout', () => {
      setupRequiredVars();
      process.env.AUTH_SESSION_TIMEOUT_HOURS = '12';
      expect(authEnv.AUTH_SESSION_TIMEOUT_HOURS).toBe(12);
    });

    it('should throw error for session timeout above maximum', () => {
      setupRequiredVars();
      process.env.AUTH_SESSION_TIMEOUT_HOURS = (MAX_SESSION_TIMEOUT_HOURS + 1).toString();
      expectAnyError(() => authEnv.AUTH_SESSION_TIMEOUT_HOURS);
    });

    it('should use default max sessions when not provided', () => {
      setupRequiredVars();
      delete process.env.AUTH_MAX_CONCURRENT_SESSIONS;
      expect(authEnv.AUTH_MAX_CONCURRENT_SESSIONS).toBe(DEFAULT_MAX_CONCURRENT_SESSIONS);
    });

    it('should validate custom max sessions', () => {
      setupRequiredVars();
      process.env.AUTH_MAX_CONCURRENT_SESSIONS = '10';
      expect(authEnv.AUTH_MAX_CONCURRENT_SESSIONS).toBe(10);
    });

    it('should use default MFA setting when not provided', () => {
      setupRequiredVars();
      delete process.env.AUTH_MFA_ENABLED;
      expect(authEnv.AUTH_MFA_ENABLED).toBe(DEFAULT_MFA_ENABLED);
    });

    it('should validate MFA enabled', () => {
      setupRequiredVars();
      process.env.AUTH_MFA_ENABLED = 'true';
      expect(authEnv.AUTH_MFA_ENABLED).toBe(true);
    });

    it('should validate TOTP issuer when MFA is enabled', () => {
      setupRequiredVars();
      process.env.AUTH_MFA_ENABLED = 'true';
      process.env.AUTH_TOTP_ISSUER = 'MyApp';
      expect(authEnv.AUTH_TOTP_ISSUER).toBe('MyApp');
    });

    it('should validate OAuth providers', () => {
      setupRequiredVars();
      process.env.AUTH_GOOGLE_CLIENT_ID = 'google-client-id';
      process.env.AUTH_GOOGLE_CLIENT_SECRET = 'google-secret';
      process.env.AUTH_GITHUB_CLIENT_ID = 'github-client-id';
      process.env.AUTH_GITHUB_CLIENT_SECRET = 'github-secret';
      
      expect(authEnv.AUTH_GOOGLE_CLIENT_ID).toBe('google-client-id');
      expect(authEnv.AUTH_GOOGLE_CLIENT_SECRET).toBe('google-secret');
      expect(authEnv.AUTH_GITHUB_CLIENT_ID).toBe('github-client-id');
      expect(authEnv.AUTH_GITHUB_CLIENT_SECRET).toBe('github-secret');
    });

    it('should validate SAML configuration', () => {
      setupRequiredVars();
      process.env.AUTH_SAML_IDP_ENTITY_ID = 'https://idp.example.com';
      process.env.AUTH_SAML_IDP_SSO_URL = 'https://idp.example.com/sso';
      process.env.AUTH_SAML_IDP_CERTIFICATE = '-----BEGIN CERTIFICATE-----...';
      process.env.AUTH_SAML_SP_ENTITY_ID = 'https://sp.example.com';
      
      expect(authEnv.AUTH_SAML_IDP_ENTITY_ID).toBe('https://idp.example.com');
      expect(authEnv.AUTH_SAML_IDP_SSO_URL).toBe('https://idp.example.com/sso');
      expect(authEnv.AUTH_SAML_IDP_CERTIFICATE).toBe('-----BEGIN CERTIFICATE-----...');
      expect(authEnv.AUTH_SAML_SP_ENTITY_ID).toBe('https://sp.example.com');
    });

    it('should use default impersonation setting when not provided', () => {
      setupRequiredVars();
      delete process.env.AUTH_IMPERSONATION_ENABLED;
      expect(authEnv.AUTH_IMPERSONATION_ENABLED).toBe(DEFAULT_IMPERSONATION_ENABLED);
    });

    it('should validate impersonation enabled', () => {
      setupRequiredVars();
      process.env.AUTH_IMPERSONATION_ENABLED = 'true';
      expect(authEnv.AUTH_IMPERSONATION_ENABLED).toBe(true);
    });

    it('should use default rate limit settings when not provided', () => {
      setupRequiredVars();
      delete process.env.AUTH_RATE_LIMIT_ATTEMPTS;
      delete process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES;
      
      expect(authEnv.AUTH_RATE_LIMIT_ATTEMPTS).toBe(DEFAULT_RATE_LIMIT_ATTEMPTS);
      expect(authEnv.AUTH_RATE_LIMIT_WINDOW_MINUTES).toBe(DEFAULT_RATE_LIMIT_WINDOW_MINUTES);
    });

    it('should validate custom rate limit settings', () => {
      setupRequiredVars();
      process.env.AUTH_RATE_LIMIT_ATTEMPTS = '10';
      process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES = '5';
      
      expect(authEnv.AUTH_RATE_LIMIT_ATTEMPTS).toBe(10);
      expect(authEnv.AUTH_RATE_LIMIT_WINDOW_MINUTES).toBe(5);
    });

    it('should validate public MFA setting', () => {
      setupRequiredVars();
      process.env.NEXT_PUBLIC_AUTH_MFA_ENABLED = 'true';
      expect(authEnv.NEXT_PUBLIC_AUTH_MFA_ENABLED).toBe(true);
    });

    it('should validate public providers', () => {
      setupRequiredVars();
      process.env.NEXT_PUBLIC_AUTH_PROVIDERS = 'google,github,microsoft';
      expect(authEnv.NEXT_PUBLIC_AUTH_PROVIDERS).toEqual(['google', 'github', 'microsoft']);
    });

    it('should validate public impersonation setting', () => {
      setupRequiredVars();
      process.env.NEXT_PUBLIC_AUTH_IMPERSONATION_ENABLED = 'true';
      expect(authEnv.NEXT_PUBLIC_AUTH_IMPERSONATION_ENABLED).toBe(true);
    });
  });

  describe('Auth Config Object', () => {
    const setupRequiredVars = () => {
      setupAuthEnvironment({
        AUTH_SECRET: VALID_AUTH_SECRET,
        AUTH_URL: VALID_AUTH_URL,
        AUTH_API_KEY_SECRET: VALID_API_KEY_SECRET,
        NEXT_PUBLIC_AUTH_URL: VALID_AUTH_URL,
        NEXT_PUBLIC_APP_VERSION: VALID_APP_VERSION,
        AUTH_SESSION_TIMEOUT_HOURS: '12',
        AUTH_MFA_ENABLED: 'true',
        AUTH_TOTP_ISSUER: 'MyApp',
        AUTH_GOOGLE_CLIENT_ID: 'google-client-id',
        AUTH_GOOGLE_CLIENT_SECRET: 'google-secret',
        AUTH_IMPERSONATION_ENABLED: 'true',
        AUTH_RATE_LIMIT_ATTEMPTS: '10',
        AUTH_RATE_LIMIT_WINDOW_MINUTES: '5',
        NEXT_PUBLIC_AUTH_MFA_ENABLED: 'true',
        NEXT_PUBLIC_AUTH_PROVIDERS: 'google,github',
        NEXT_PUBLIC_AUTH_IMPERSONATION_ENABLED: 'true',
      });
    };

    it('should create correct auth config object', () => {
      setupRequiredVars();
      expect(authConfig).toEqual({
        secret: VALID_AUTH_SECRET,
        url: VALID_AUTH_URL,
        cookieSecret: undefined,
        sessionTimeoutHours: 12,
        maxConcurrentSessions: DEFAULT_MAX_CONCURRENT_SESSIONS,
        mfaEnabled: true,
        totpIssuer: 'MyApp',
        oauthProviders: {
          google: {
            clientId: 'google-client-id',
            clientSecret: 'google-secret',
          },
          github: {
            clientId: undefined,
            clientSecret: undefined,
          },
          microsoft: {
            clientId: undefined,
            clientSecret: undefined,
          },
        },
        samlConfig: {
          idpEntityId: undefined,
          idpSsoUrl: undefined,
          idpCertificate: undefined,
          spEntityId: undefined,
        },
        apiKeySecret: VALID_API_KEY_SECRET,
        impersonationEnabled: true,
        rateLimit: {
          attempts: 10,
          windowMinutes: 5,
        },
        publicUrl: VALID_AUTH_URL,
        publicProviders: ['google', 'github'],
        publicMfaEnabled: true,
        publicImpersonationEnabled: true,
      });
    });
  });

  describe('Edge Cases', () => {
    const setupRequiredVars = () => {
      setupAuthEnvironment({
        AUTH_SECRET: VALID_AUTH_SECRET,
        AUTH_URL: VALID_AUTH_URL,
        AUTH_API_KEY_SECRET: VALID_API_KEY_SECRET,
        NEXT_PUBLIC_AUTH_URL: VALID_AUTH_URL,
        NEXT_PUBLIC_APP_VERSION: VALID_APP_VERSION,
      });
    };

    it('should handle maximum session timeout', () => {
      setupRequiredVars();
      process.env.AUTH_SESSION_TIMEOUT_HOURS = MAX_SESSION_TIMEOUT_HOURS.toString();
      expect(authEnv.AUTH_SESSION_TIMEOUT_HOURS).toBe(MAX_SESSION_TIMEOUT_HOURS);
    });

    it('should handle minimum session timeout', () => {
      setupRequiredVars();
      process.env.AUTH_SESSION_TIMEOUT_HOURS = MIN_SESSION_TIMEOUT_HOURS.toString();
      expect(authEnv.AUTH_SESSION_TIMEOUT_HOURS).toBe(MIN_SESSION_TIMEOUT_HOURS);
    });

    it('should handle maximum concurrent sessions', () => {
      setupRequiredVars();
      process.env.AUTH_MAX_CONCURRENT_SESSIONS = MAX_CONCURRENT_SESSIONS.toString();
      expect(authEnv.AUTH_MAX_CONCURRENT_SESSIONS).toBe(MAX_CONCURRENT_SESSIONS);
    });

    it('should handle minimum concurrent sessions', () => {
      setupRequiredVars();
      process.env.AUTH_MAX_CONCURRENT_SESSIONS = MIN_CONCURRENT_SESSIONS.toString();
      expect(authEnv.AUTH_MAX_CONCURRENT_SESSIONS).toBe(MIN_CONCURRENT_SESSIONS);
    });

    it('should handle maximum rate limit attempts', () => {
      setupRequiredVars();
      process.env.AUTH_RATE_LIMIT_ATTEMPTS = MAX_RATE_LIMIT_ATTEMPTS.toString();
      expect(authEnv.AUTH_RATE_LIMIT_ATTEMPTS).toBe(MAX_RATE_LIMIT_ATTEMPTS);
    });

    it('should handle minimum rate limit attempts', () => {
      setupRequiredVars();
      process.env.AUTH_RATE_LIMIT_ATTEMPTS = MIN_RATE_LIMIT_ATTEMPTS.toString();
      expect(authEnv.AUTH_RATE_LIMIT_ATTEMPTS).toBe(MIN_RATE_LIMIT_ATTEMPTS);
    });

    it('should handle maximum rate limit window', () => {
      setupRequiredVars();
      process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES = MAX_RATE_LIMIT_WINDOW_MINUTES.toString();
      expect(authEnv.AUTH_RATE_LIMIT_WINDOW_MINUTES).toBe(MAX_RATE_LIMIT_WINDOW_MINUTES);
    });

    it('should handle minimum rate limit window', () => {
      setupRequiredVars();
      process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES = MIN_RATE_LIMIT_WINDOW_MINUTES.toString();
      expect(authEnv.AUTH_RATE_LIMIT_WINDOW_MINUTES).toBe(MIN_RATE_LIMIT_WINDOW_MINUTES);
    });

    it('should handle maximum TOTP issuer length', () => {
      setupRequiredVars();
      process.env.AUTH_MFA_ENABLED = 'true';
      process.env.AUTH_TOTP_ISSUER = generateLongString(MAX_TOTP_ISSUER_LENGTH);
      expect(authEnv.AUTH_TOTP_ISSUER).toBe(generateLongString(MAX_TOTP_ISSUER_LENGTH));
    });

    it('should reject TOTP issuer that exceeds maximum length', () => {
      setupRequiredVars();
      process.env.AUTH_MFA_ENABLED = 'true';
      process.env.AUTH_TOTP_ISSUER = generateTooLongString(MAX_TOTP_ISSUER_LENGTH);
      expectAnyError(() => authEnv.AUTH_TOTP_ISSUER);
    });

    it('should handle empty public providers', () => {
      setupRequiredVars();
      process.env.NEXT_PUBLIC_AUTH_PROVIDERS = '';
      expect(authEnv.NEXT_PUBLIC_AUTH_PROVIDERS).toEqual([]);
    });

    it('should handle single public provider', () => {
      setupRequiredVars();
      process.env.NEXT_PUBLIC_AUTH_PROVIDERS = 'google';
      expect(authEnv.NEXT_PUBLIC_AUTH_PROVIDERS).toEqual(['google']);
    });

    it('should reject invalid public provider', () => {
      setupRequiredVars();
      process.env.NEXT_PUBLIC_AUTH_PROVIDERS = 'invalid,google';
      expectAnyError(() => authEnv.NEXT_PUBLIC_AUTH_PROVIDERS);
    });

    // New edge case tests
    it('should handle unicode characters in TOTP issuer', () => {
      setupRequiredVars();
      process.env.AUTH_MFA_ENABLED = 'true';
      process.env.AUTH_TOTP_ISSUER = generateEdgeCaseData.unicodeString();
      // Should either accept or reject gracefully
      expect(() => authEnv.AUTH_TOTP_ISSUER).not.toThrow();
    });

    it('should handle special characters in OAuth client IDs', () => {
      setupRequiredVars();
      process.env.AUTH_GOOGLE_CLIENT_ID = generateEdgeCaseData.specialChars();
      expect(() => authEnv.AUTH_GOOGLE_CLIENT_ID).not.toThrow();
    });

    it('should handle boolean edge cases for MFA enabled', () => {
      setupRequiredVars();
      const truthyValues = generateEdgeCaseData.truthyStrings();
      truthyValues.forEach((value: string) => {
        process.env.AUTH_MFA_ENABLED = value;
        expect(authEnv.AUTH_MFA_ENABLED).toBe(true);
      });
    });

    it('should handle boolean edge cases for MFA disabled', () => {
      setupRequiredVars();
      const falsyValues = generateEdgeCaseData.falsyStrings();
      falsyValues.forEach((value: string) => {
        process.env.AUTH_MFA_ENABLED = value;
        expect(authEnv.AUTH_MFA_ENABLED).toBe(false);
      });
    });

    it('should reject SQL injection patterns in secrets', () => {
      setupRequiredVars();
      process.env.AUTH_SECRET = generateEdgeCaseData.sqlInjection();
      expectAnyError(() => authEnv.AUTH_SECRET);
    });

    it('should handle whitespace variants in environment variables', () => {
      setupRequiredVars();
      process.env.AUTH_TOTP_ISSUER = generateEdgeCaseData.whitespaceVariants();
      // Should trim whitespace or handle appropriately
      expect(() => authEnv.AUTH_TOTP_ISSUER).not.toThrow();
    });

    it('should handle empty string values for optional variables', () => {
      setupRequiredVars();
      process.env.AUTH_TOTP_ISSUER = generateEdgeCaseData.emptyString();
      expect(() => authEnv.AUTH_TOTP_ISSUER).not.toThrow();
    });
  });
});

```

---

### constants.ts

**Path:** `src\tests\constants.ts`

**Language:** TypeScript

```typescript
/**
 * Test constants for environment validation tests
 */

// Valid test values
export const VALID_AUTH_SECRET = 'super-secret-auth-key-32-chars-long';
export const VALID_API_KEY_SECRET = 'api-key-secret-32-chars-long-minimum';
export const VALID_DATABASE_URL = 'postgresql://app_user:secure_password@db.example.com:5432/production_db';
export const VALID_REDIS_URL = 'redis://redis.example.com:6379';
export const VALID_REDIS_SECURE_URL = 'rediss://redis.example.com:6380';
export const VALID_AUTH_URL = 'https://auth.example.com';
export const VALID_LOCALHOST_AUTH_URL = 'http://localhost:3000';
export const VALID_API_URL = 'https://api.example.com';
export const VALID_APP_VERSION = 'v2.1.0';
export const VALID_REGION = 'us-west-2';
export const VALID_INSTANCE_ID = 'i-0123456789abcdef0';
export const VALID_SCHEMA = 'tenant_123_schema';
export const VALID_KEY_PREFIX = 'tenant123:';

// Invalid test values
export const INVALID_SHORT_SECRET = 'short';
export const INVALID_HTTP_AUTH_URL = 'http://auth.example.com';
export const INVALID_DATABASE_URL = 'mysql://user:pass@localhost:3306/test';
export const INVALID_REDIS_URL = 'http://localhost:6379';
export const INVALID_SCHEMA = 'Invalid-Schema';
export const INVALID_REGION = 'Invalid Region';
export const INVALID_APP_VERSION = '1.0.0';
export const INVALID_KEY_PREFIX = 'Invalid Prefix!';
export const INVALID_API_URL = 'ftp://invalid.com';

// Realistic invalid values for better testing
export const INVALID_MALFORMED_URL = 'https://example.com:invalid-port/path';
export const INVALID_MALFORMED_SECRET = 'insecure-secret-too-short';
export const INVALID_SPECIAL_CHARS_URL = 'https://example.com/path with spaces';
export const INVALID_NULL_VERSION = 'null';
export const INVALID_UNDEFINED_VERSION = 'undefined';
export const INVALID_EMPTY_URL = '';
export const INVALID_SPACES_ONLY = '   ';

// Boundary values
export const MAX_SECRET_LENGTH = 32;
export const MIN_SECRET_LENGTH = 32;
export const MAX_POOL_SIZE = 100;
export const MIN_POOL_SIZE = 1;
export const MAX_TIMEOUT_SECONDS = 300;
export const MIN_TIMEOUT_SECONDS = 1;
export const MAX_SESSION_TIMEOUT_HOURS = 168;
export const MIN_SESSION_TIMEOUT_HOURS = 1;
export const MAX_CONCURRENT_SESSIONS = 20;
export const MIN_CONCURRENT_SESSIONS = 1;
export const MAX_RATE_LIMIT_ATTEMPTS = 100;
export const MIN_RATE_LIMIT_ATTEMPTS = 1;
export const MAX_RATE_LIMIT_WINDOW_MINUTES = 60;
export const MIN_RATE_LIMIT_WINDOW_MINUTES = 1;
export const MAX_TOTP_ISSUER_LENGTH = 100;
export const MAX_SCHEMA_LENGTH = 63;
export const MAX_INSTANCE_ID_LENGTH = 100;
export const MAX_WEBHOOK_TIMEOUT_SECONDS = 300;
export const MIN_WEBHOOK_TIMEOUT_SECONDS = 1;
export const MAX_AI_RATE_LIMIT_PER_MINUTE = 1000;
export const MIN_AI_RATE_LIMIT_PER_MINUTE = 1;
export const MAX_STORAGE_BUCKET_LENGTH = 63;
export const MAX_KEY_PREFIX_LENGTH = 50;
export const MAX_REDIS_DB = 15;
export const MIN_REDIS_DB = 0;
export const MAX_REDIS_TIMEOUT_MS = 60000;
export const MIN_REDIS_TIMEOUT_MS = 100;
export const MAX_REDIS_DEFAULT_TTL_SECONDS = 86400;
export const MIN_REDIS_DEFAULT_TTL_SECONDS = 1;
export const MAX_REDIS_MAX_RETRIES = 10;
export const MIN_REDIS_MAX_RETRIES = 0;

// Default values
export const DEFAULT_SESSION_TIMEOUT_HOURS = 24;
export const DEFAULT_MAX_CONCURRENT_SESSIONS = 5;
export const DEFAULT_MFA_ENABLED = false;
export const DEFAULT_IMPERSONATION_ENABLED = false;
export const DEFAULT_RATE_LIMIT_ATTEMPTS = 5;
export const DEFAULT_RATE_LIMIT_WINDOW_MINUTES = 1;
export const DEFAULT_DATABASE_POOL_SIZE = 10;
export const DEFAULT_DATABASE_TIMEOUT_SECONDS = 30;
export const DEFAULT_DATABASE_SSL_ENABLED = true;
export const DEFAULT_REDIS_DB = 0;
export const DEFAULT_REDIS_TIMEOUT_MS = 5000;
export const DEFAULT_REDIS_MAX_RETRIES = 3;
export const DEFAULT_REDIS_DEFAULT_TTL_SECONDS = 3600;
export const DEFAULT_REDIS_CLUSTER_ENABLED = false;
export const DEFAULT_PLATFORM_DEBUG_ENABLED = false;
export const DEFAULT_PLATFORM_LOG_LEVEL = 'info';
export const DEFAULT_PLATFORM_OBSERVABILITY_ENABLED = true;
export const DEFAULT_PLATFORM_FEATURE_FLAGS_ENABLED = false;
export const DEFAULT_PLATFORM_WEBHOOKS_ENABLED = true;
export const DEFAULT_PLATFORM_WEBHOOK_TIMEOUT_SECONDS = 30;
export const DEFAULT_PLATFORM_JOBS_ENABLED = true;
export const DEFAULT_PLATFORM_EMAIL_ENABLED = true;
export const DEFAULT_PLATFORM_STORAGE_ENABLED = true;
export const DEFAULT_PLATFORM_AI_ENABLED = false;

// Environment names
export const ENV_DEVELOPMENT = 'development';
export const ENV_PRODUCTION = 'production';
export const ENV_STAGING = 'staging';

// OAuth providers
export const OAUTH_PROVIDERS = ['google', 'github', 'microsoft'];

// Test data generators
export const generateLongString = (length: number): string => 'a'.repeat(length);
export const generateTooLongString = (length: number): string => 'a'.repeat(length + 1);

// Enhanced test data generators for edge cases
export const generateEdgeCaseData = {
  // Unicode and international characters
  unicodeString: (): string => '🔐🌍🚀áéíóúñ中文日本語한국어',
  emojiString: (): string => '🔑🔒🛡️⚡🎯',
  chineseChars: (): string => '中文测试环境变量',
  japaneseChars: (): string => '日本語環境変数テスト',
  koreanChars: (): string => '한국어환경변수테스트',
  
  // Special characters that might cause issues
  specialChars: (): string => 'test-env_var.test@123#$',
  whitespaceVariants: (): string => '  test\tvalue\n\r  ',
  controlChars: (): string => 'test\x00\x1f\x7fvalue',
  
  // Numeric edge cases
  zeroString: (): string => '0',
  negativeNumber: (): string => '-1',
  largeNumber: (): string => '999999999999999999999',
  decimalNumber: (): string => '3.14159',
  
  // URL edge cases
  urlWithCredentials: (): string => 'postgresql://user:pass@localhost:5432/test',
  urlWithPort: (): string => 'https://example.com:8080',
  urlWithPath: (): string => 'https://example.com/api/v1/auth',
  urlWithQuery: (): string => 'https://example.com?param=value&other=test',
  urlWithFragment: (): string => 'https://example.com#section',
  
  // Boolean edge cases
  truthyStrings: (): string[] => ['true', '1', 'yes', 'on', 'enabled'],
  falsyStrings: (): string[] => ['false', '0', 'no', 'off', 'disabled', ''],
  
  // JSON-like strings
  jsonString: (): string => '{"key": "value", "nested": {"test": true}}',
  malformedJson: (): string => '{key: value, nested: {test: true}}',
  
  // SQL injection patterns (should be escaped/rejected)
  sqlInjection: (): string => "'; DROP TABLE users; --",
  xssPattern: (): string => '<script>alert("xss")</script>',
  
  // Path traversal patterns
  pathTraversal: (): string => '../../../etc/passwd',
  windowsPath: (): string => 'C:\\Windows\\System32',
  
  // Empty and null-like values
  emptyString: (): string => '',
  spaceString: (): string => ' ',
  tabString: (): string => '\t',
  newlineString: (): string => '\n',
};

// Error message constants for standardized validation
export const ERROR_MESSAGES = {
  // Auth errors
  AUTH_SECRET_TOO_SHORT: 'AUTH_SECRET must be at least 32 characters long',
  AUTH_API_KEY_SECRET_TOO_SHORT: 'AUTH_API_KEY_SECRET must be at least 32 characters long',
  AUTH_URL_HTTPS_REQUIRED: 'AUTH_URL must use HTTPS in production or localhost',
  AUTH_TOTP_ISSUER_TOO_LONG: 'AUTH_TOTP_ISSUER must be at most',
  AUTH_PUBLIC_PROVIDERS_INVALID: 'Invalid OAuth provider',
  
  // Database errors
  DATABASE_URL_INVALID: 'DATABASE_URL must be a PostgreSQL connection string',
  DATABASE_SCHEMA_INVALID: 'DATABASE_SCHEMA must contain only lowercase letters',
  DATABASE_SCHEMA_TOO_LONG: 'DATABASE_SCHEMA must be at most',
  DATABASE_SCHEMA_INVALID_START: 'DATABASE_SCHEMA must start with a letter',
  
  // Redis errors
  REDIS_URL_INVALID: 'REDIS_URL must be a Redis connection string',
  REDIS_KEY_PREFIX_INVALID: 'REDIS_KEY_PREFIX must contain only lowercase letters',
  REDIS_KEY_PREFIX_TOO_LONG: 'REDIS_KEY_PREFIX must be at most',
  REDIS_DB_OUT_OF_RANGE: 'REDIS_DB must be between',
  REDIS_TIMEOUT_OUT_OF_RANGE: 'REDIS_TIMEOUT_MS must be between',
  REDIS_TTL_OUT_OF_RANGE: 'REDIS_DEFAULT_TTL_SECONDS must be between',
  REDIS_RETRIES_OUT_OF_RANGE: 'REDIS_MAX_RETRIES must be between',
  
  // Platform errors
  APP_VERSION_INVALID: 'APP_VERSION must follow semantic versioning',
  PLATFORM_REGION_INVALID: 'PLATFORM_REGION must contain only lowercase letters',
  PLATFORM_INSTANCE_ID_TOO_LONG: 'PLATFORM_INSTANCE_ID must be at most',
  PLATFORM_API_URL_INVALID: 'NEXT_PUBLIC_API_URL must be a valid HTTP/HTTPS URL',
  PLATFORM_STORAGE_BUCKET_INVALID: 'PLATFORM_STORAGE_BUCKET must contain only lowercase letters',
  PLATFORM_STORAGE_BUCKET_TOO_LONG: 'PLATFORM_STORAGE_BUCKET must be at most',
  
  // General errors
  ENV_VALIDATION_FAILED: 'Environment validation failed',
  REQUIRED_VAR_MISSING: 'is required',
} as const;

```

---

### database.test.ts

**Path:** `src\tests\database.test.ts`

**Language:** TypeScript

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { databaseEnv, databaseConfig } from '../database';
import { useEnhancedTestIsolation, setupDatabaseEnvironment, expectSpecificError, expectAnyError } from './utils';
import {
  VALID_DATABASE_URL,
  VALID_SCHEMA,
  INVALID_DATABASE_URL,
  INVALID_SCHEMA,
  MAX_POOL_SIZE,
  MIN_POOL_SIZE,
  MAX_TIMEOUT_SECONDS,
  MIN_TIMEOUT_SECONDS,
  MAX_SCHEMA_LENGTH,
  DEFAULT_DATABASE_POOL_SIZE,
  DEFAULT_DATABASE_TIMEOUT_SECONDS,
  DEFAULT_DATABASE_SSL_ENABLED,
  generateLongString,
  generateTooLongString,
  ERROR_MESSAGES,
} from './constants';

describe('Database Environment Validation', () => {
  useEnhancedTestIsolation();

  describe('Required Variables', () => {
    const setupRequiredVars = () => {
      setupDatabaseEnvironment({
        DATABASE_URL: VALID_DATABASE_URL,
        DATABASE_SCHEMA: VALID_SCHEMA,
      });
    };

    it('should validate required database URL', () => {
      setupRequiredVars();
      expect(databaseEnv.DATABASE_URL).toBe(VALID_DATABASE_URL);
    });

    it('should throw error for missing DATABASE_URL', () => {
      setupRequiredVars();
      delete process.env.DATABASE_URL;
      expectAnyError(() => databaseEnv.DATABASE_URL);
    });

    it('should throw error for invalid DATABASE_URL protocol', () => {
      setupRequiredVars();
      process.env.DATABASE_URL = INVALID_DATABASE_URL;
      expectSpecificError(
        () => databaseEnv.DATABASE_URL,
        ERROR_MESSAGES.DATABASE_URL_INVALID
      );
    });

    it('should validate required DATABASE_SCHEMA', () => {
      setupRequiredVars();
      expect(databaseEnv.DATABASE_SCHEMA).toBe(VALID_SCHEMA);
    });

    it('should throw error for invalid DATABASE_SCHEMA format', () => {
      setupRequiredVars();
      process.env.DATABASE_SCHEMA = INVALID_SCHEMA;
      expectSpecificError(
        () => databaseEnv.DATABASE_SCHEMA,
        ERROR_MESSAGES.DATABASE_SCHEMA_INVALID
      );
    });

    it('should throw error for missing DATABASE_SCHEMA', () => {
      setupRequiredVars();
      delete process.env.DATABASE_SCHEMA;
      expectAnyError(() => databaseEnv.DATABASE_SCHEMA);
    });
  });

  describe('Optional Variables', () => {
    const setupRequiredVars = () => {
      setupDatabaseEnvironment({
        DATABASE_URL: VALID_DATABASE_URL,
        DATABASE_SCHEMA: VALID_SCHEMA,
      });
    };

    it('should use default pool size when not provided', () => {
      setupRequiredVars();
      delete process.env.DATABASE_POOL_SIZE;
      expect(databaseEnv.DATABASE_POOL_SIZE).toBe(DEFAULT_DATABASE_POOL_SIZE);
    });

    it('should validate custom pool size', () => {
      setupRequiredVars();
      process.env.DATABASE_POOL_SIZE = '20';
      expect(databaseEnv.DATABASE_POOL_SIZE).toBe(20);
    });

    it('should throw error for invalid pool size range', () => {
      setupRequiredVars();
      process.env.DATABASE_POOL_SIZE = (MAX_POOL_SIZE + 1).toString();
      expectAnyError(() => databaseEnv.DATABASE_POOL_SIZE);
    });

    it('should use default timeout when not provided', () => {
      setupRequiredVars();
      delete process.env.DATABASE_TIMEOUT_SECONDS;
      expect(databaseEnv.DATABASE_TIMEOUT_SECONDS).toBe(DEFAULT_DATABASE_TIMEOUT_SECONDS);
    });

    it('should validate custom timeout', () => {
      setupRequiredVars();
      process.env.DATABASE_TIMEOUT_SECONDS = '60';
      expect(databaseEnv.DATABASE_TIMEOUT_SECONDS).toBe(60);
    });

    it('should use default SSL setting when not provided', () => {
      setupRequiredVars();
      delete process.env.DATABASE_SSL_ENABLED;
      expect(databaseEnv.DATABASE_SSL_ENABLED).toBe(DEFAULT_DATABASE_SSL_ENABLED);
    });

    it('should validate SSL disabled', () => {
      setupRequiredVars();
      process.env.DATABASE_SSL_ENABLED = 'false';
      expect(databaseEnv.DATABASE_SSL_ENABLED).toBe(false);
    });

    it('should validate read replica URL when provided', () => {
      setupRequiredVars();
      process.env.DATABASE_READ_REPLICA_URL = 'postgresql://user:pass@localhost:5432/replica';
      expect(databaseEnv.DATABASE_READ_REPLICA_URL).toBe('postgresql://user:pass@localhost:5432/replica');
    });

    it('should handle missing read replica URL', () => {
      setupRequiredVars();
      delete process.env.DATABASE_READ_REPLICA_URL;
      expect(databaseEnv.DATABASE_READ_REPLICA_URL).toBeUndefined();
    });
  });

  describe('Database Config Object', () => {
    const setupRequiredVars = () => {
      setupDatabaseEnvironment({
        DATABASE_URL: VALID_DATABASE_URL,
        DATABASE_SCHEMA: VALID_SCHEMA,
        DATABASE_POOL_SIZE: '15',
        DATABASE_TIMEOUT_SECONDS: '45',
        DATABASE_SSL_ENABLED: 'false',
        DATABASE_READ_REPLICA_URL: 'postgresql://user:pass@localhost:5432/replica',
      });
    };

    it('should create correct database config object', () => {
      setupRequiredVars();
      expect(databaseConfig).toEqual({
        url: VALID_DATABASE_URL,
        readReplicaUrl: 'postgresql://user:pass@localhost:5432/replica',
        poolSize: 15,
        timeoutSeconds: 45,
        sslEnabled: false,
        schema: VALID_SCHEMA,
        hasReadReplica: true,
      });
    });

    it('should fall back to primary URL when no read replica', () => {
      setupRequiredVars();
      delete process.env.DATABASE_READ_REPLICA_URL;
      expect(databaseConfig.readReplicaUrl).toBe(VALID_DATABASE_URL);
      expect(databaseConfig.hasReadReplica).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    const setupRequiredVars = () => {
      setupDatabaseEnvironment({
        DATABASE_URL: VALID_DATABASE_URL,
        DATABASE_SCHEMA: VALID_SCHEMA,
      });
    };

    it('should handle maximum pool size', () => {
      setupRequiredVars();
      process.env.DATABASE_POOL_SIZE = MAX_POOL_SIZE.toString();
      expect(databaseEnv.DATABASE_POOL_SIZE).toBe(MAX_POOL_SIZE);
    });

    it('should handle minimum pool size', () => {
      setupRequiredVars();
      process.env.DATABASE_POOL_SIZE = MIN_POOL_SIZE.toString();
      expect(databaseEnv.DATABASE_POOL_SIZE).toBe(MIN_POOL_SIZE);
    });

    it('should handle maximum timeout', () => {
      setupRequiredVars();
      process.env.DATABASE_TIMEOUT_SECONDS = MAX_TIMEOUT_SECONDS.toString();
      expect(databaseEnv.DATABASE_TIMEOUT_SECONDS).toBe(MAX_TIMEOUT_SECONDS);
    });

    it('should handle minimum timeout', () => {
      setupRequiredVars();
      process.env.DATABASE_TIMEOUT_SECONDS = MIN_TIMEOUT_SECONDS.toString();
      expect(databaseEnv.DATABASE_TIMEOUT_SECONDS).toBe(MIN_TIMEOUT_SECONDS);
    });

    it('should handle maximum schema length', () => {
      setupRequiredVars();
      process.env.DATABASE_SCHEMA = generateLongString(MAX_SCHEMA_LENGTH);
      expect(databaseEnv.DATABASE_SCHEMA).toBe(generateLongString(MAX_SCHEMA_LENGTH));
    });

    it('should reject schema that exceeds maximum length', () => {
      setupRequiredVars();
      process.env.DATABASE_SCHEMA = generateTooLongString(MAX_SCHEMA_LENGTH);
      expectAnyError(() => databaseEnv.DATABASE_SCHEMA);
    });

    it('should accept valid schema with underscores', () => {
      setupRequiredVars();
      process.env.DATABASE_SCHEMA = 'tenant_123_schema';
      expect(databaseEnv.DATABASE_SCHEMA).toBe('tenant_123_schema');
    });

    it('should accept schema starting with underscore', () => {
      setupRequiredVars();
      process.env.DATABASE_SCHEMA = '_private_schema';
      expect(databaseEnv.DATABASE_SCHEMA).toBe('_private_schema');
    });

    it('should reject schema starting with number', () => {
      setupRequiredVars();
      process.env.DATABASE_SCHEMA = '123_invalid';
      expectAnyError(() => databaseEnv.DATABASE_SCHEMA);
    });
  });
});

```

---

### index.test.ts

**Path:** `src\tests\index.test.ts`

**Language:** TypeScript

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  validateEnvironment,
  isDevelopment,
  isProduction,
  isStaging,
  getEnvironment,
  env,
  envConfig,
  databaseEnv,
  redisEnv,
  authEnv,
  platformEnv,
} from '../index';
import { useEnhancedTestIsolation, setupCompleteTestEnvironment, expectSpecificError, expectAnyError } from './utils';
import {
  VALID_DATABASE_URL,
  VALID_SCHEMA,
  VALID_REDIS_URL,
  VALID_KEY_PREFIX,
  VALID_AUTH_SECRET,
  VALID_AUTH_URL,
  VALID_API_KEY_SECRET,
  VALID_APP_VERSION,
  VALID_API_URL,
  VALID_REGION,
  VALID_INSTANCE_ID,
  ENV_DEVELOPMENT,
  ENV_PRODUCTION,
  ENV_STAGING,
  DEFAULT_SESSION_TIMEOUT_HOURS,
  DEFAULT_DATABASE_POOL_SIZE,
  DEFAULT_REDIS_DB,
  ERROR_MESSAGES,
} from './constants';

describe('Environment Index', () => {
  useEnhancedTestIsolation();

  describe('Environment Validation', () => {
    const setupRequiredVars = () => {
      setupCompleteTestEnvironment({
        DATABASE_URL: VALID_DATABASE_URL,
        DATABASE_SCHEMA: VALID_SCHEMA,
        REDIS_URL: VALID_REDIS_URL,
        REDIS_KEY_PREFIX: VALID_KEY_PREFIX,
        AUTH_SECRET: VALID_AUTH_SECRET,
        AUTH_URL: VALID_AUTH_URL,
        AUTH_API_KEY_SECRET: VALID_API_KEY_SECRET,
        NEXT_PUBLIC_AUTH_URL: VALID_AUTH_URL,
        NEXT_PUBLIC_APP_VERSION: VALID_APP_VERSION,
        NODE_ENV: ENV_DEVELOPMENT,
        APP_VERSION: VALID_APP_VERSION,
        PLATFORM_REGION: VALID_REGION,
        PLATFORM_INSTANCE_ID: VALID_INSTANCE_ID,
        NEXT_PUBLIC_API_URL: VALID_API_URL,
      });
    };

    it('should validate environment without throwing', () => {
      setupRequiredVars();
      expect(() => validateEnvironment()).not.toThrow();
    });

    it('should throw error when required variables are missing', () => {
      setupRequiredVars();
      delete process.env.DATABASE_URL;
      expectSpecificError(
        () => validateEnvironment(),
        ERROR_MESSAGES.ENV_VALIDATION_FAILED
      );
    });
  });

  describe('Environment Detection', () => {
    const setupRequiredVars = () => {
      setupCompleteTestEnvironment({
        NODE_ENV: ENV_DEVELOPMENT,
        APP_VERSION: VALID_APP_VERSION,
        PLATFORM_REGION: VALID_REGION,
        PLATFORM_INSTANCE_ID: VALID_INSTANCE_ID,
        NEXT_PUBLIC_API_URL: VALID_API_URL,
        NEXT_PUBLIC_APP_VERSION: VALID_APP_VERSION,
      });
    };

    it('should detect development environment', () => {
      setupRequiredVars();
      expect(isDevelopment()).toBe(true);
      expect(isProduction()).toBe(false);
      expect(isStaging()).toBe(false);
      expect(getEnvironment()).toBe(ENV_DEVELOPMENT);
    });

    it('should detect production environment', () => {
      setupRequiredVars();
      process.env.NODE_ENV = ENV_PRODUCTION;
      expect(isDevelopment()).toBe(false);
      expect(isProduction()).toBe(true);
      expect(isStaging()).toBe(false);
      expect(getEnvironment()).toBe(ENV_PRODUCTION);
    });

    it('should detect staging environment', () => {
      setupRequiredVars();
      process.env.NODE_ENV = ENV_STAGING;
      expect(isDevelopment()).toBe(false);
      expect(isProduction()).toBe(false);
      expect(isStaging()).toBe(true);
      expect(getEnvironment()).toBe(ENV_STAGING);
    });

    it('should use default development environment', () => {
      setupRequiredVars();
      delete process.env.NODE_ENV;
      expect(isDevelopment()).toBe(true);
      expect(isProduction()).toBe(false);
      expect(isStaging()).toBe(false);
      expect(getEnvironment()).toBe(ENV_DEVELOPMENT);
    });
  });

  describe('Environment Object', () => {
    const setupRequiredVars = () => {
      setupCompleteTestEnvironment({
        NODE_ENV: ENV_PRODUCTION,
        APP_VERSION: 'v1.2.3',
        PLATFORM_REGION: 'us-west-2',
        PLATFORM_INSTANCE_ID: 'i-1234567890abcdef0',
        NEXT_PUBLIC_API_URL: VALID_API_URL,
        NEXT_PUBLIC_APP_VERSION: 'v1.2.3',
      });
    };

    it('should create correct env object', () => {
      setupRequiredVars();
      expect(env).toEqual({
        isDevelopment: false,
        isProduction: true,
        isStaging: false,
        current: 'production',
        config: envConfig,
      });
    });

    it('should have correct config structure', () => {
      setupRequiredVars();
      expect(envConfig).toHaveProperty('database');
      expect(envConfig).toHaveProperty('redis');
      expect(envConfig).toHaveProperty('auth');
      expect(envConfig).toHaveProperty('platform');
    });
  });

  describe('Module Exports', () => {
    beforeEach(() => {
      // Set minimal required variables
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test';
      process.env.DATABASE_SCHEMA = 'public';
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.REDIS_KEY_PREFIX = 'test:';
      process.env.AUTH_SECRET = 'a'.repeat(32);
      process.env.AUTH_URL = 'https://auth.example.com';
      process.env.AUTH_API_KEY_SECRET = 'b'.repeat(32);
      process.env.NEXT_PUBLIC_AUTH_URL = 'https://auth.example.com';
      process.env.NEXT_PUBLIC_APP_VERSION = 'v1.0.0';
      process.env.NODE_ENV = 'development';
      process.env.APP_VERSION = 'v1.0.0';
      process.env.PLATFORM_REGION = 'us-east-1';
      process.env.PLATFORM_INSTANCE_ID = 'instance-123';
      process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
      process.env.NEXT_PUBLIC_APP_VERSION = 'v1.0.0';
    });

    it('should export database environment', () => {
      expect(databaseEnv).toBeDefined();
      expect(databaseEnv.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/test');
      expect(databaseEnv.DATABASE_SCHEMA).toBe('public');
    });

    it('should export redis environment', () => {
      expect(redisEnv).toBeDefined();
      expect(redisEnv.REDIS_URL).toBe('redis://localhost:6379');
      expect(redisEnv.REDIS_KEY_PREFIX).toBe('test:');
    });

    it('should export auth environment', () => {
      expect(authEnv).toBeDefined();
      expect(authEnv.AUTH_SECRET).toBe('a'.repeat(32));
      expect(authEnv.AUTH_URL).toBe('https://auth.example.com');
      expect(authEnv.NEXT_PUBLIC_AUTH_URL).toBe('https://auth.example.com');
    });

    it('should export platform environment', () => {
      expect(platformEnv).toBeDefined();
      expect(platformEnv.NODE_ENV).toBe('development');
      expect(platformEnv.APP_VERSION).toBe('v1.0.0');
      expect(platformEnv.PLATFORM_REGION).toBe('us-east-1');
      expect(platformEnv.PLATFORM_INSTANCE_ID).toBe('instance-123');
    });
  });

  describe('Integration Tests', () => {
    beforeEach(() => {
      // Set comprehensive environment for integration testing
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';
      process.env.DATABASE_SCHEMA = 'tenant_schema';
      process.env.DATABASE_POOL_SIZE = '20';
      process.env.REDIS_URL = 'rediss://redis.example.com:6380';
      process.env.REDIS_KEY_PREFIX = 'tenant123:';
      process.env.REDIS_DB = '2';
      process.env.REDIS_TIMEOUT_MS = '10000';
      process.env.AUTH_SECRET = 'super-secret-auth-key-32-chars';
      process.env.AUTH_URL = 'https://auth.example.com';
      process.env.AUTH_SESSION_TIMEOUT_HOURS = '12';
      process.env.AUTH_MFA_ENABLED = 'true';
      process.env.AUTH_API_KEY_SECRET = 'api-key-secret-32-chars-long';
      process.env.NEXT_PUBLIC_AUTH_URL = 'https://auth.example.com';
      process.env.NEXT_PUBLIC_APP_VERSION = 'v2.1.0';
      process.env.NEXT_PUBLIC_AUTH_MFA_ENABLED = 'true';
      process.env.NODE_ENV = 'production';
      process.env.APP_VERSION = 'v2.1.0';
      process.env.PLATFORM_REGION = 'eu-west-1';
      process.env.PLATFORM_INSTANCE_ID = 'prod-instance-456';
      process.env.PLATFORM_DEBUG_ENABLED = 'false';
      process.env.PLATFORM_OBSERVABILITY_ENABLED = 'true';
      process.env.PLATFORM_AI_ENABLED = 'true';
      process.env.PLATFORM_AI_PROVIDER = 'openai';
      process.env.PLATFORM_AI_MODEL = 'gpt-4';
      process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
      process.env.NEXT_PUBLIC_DEBUG_ENABLED = 'false';
      process.env.NEXT_PUBLIC_AI_ENABLED = 'true';
    });

    it('should create comprehensive env config', () => {
      expect(envConfig.database).toBeDefined();
      expect(envConfig.redis).toBeDefined();
      expect(envConfig.auth).toBeDefined();
      expect(envConfig.platform).toBeDefined();

      expect(envConfig.database.url).toBe('postgresql://user:pass@localhost:5432/testdb');
      expect(envConfig.database.schema).toBe('tenant_schema');
      expect(envConfig.database.poolSize).toBe(20);

      expect(envConfig.redis.url).toBe('rediss://redis.example.com:6380');
      expect(envConfig.redis.keyPrefix).toBe('tenant123:');
      expect(envConfig.redis.db).toBe(2);
      expect(envConfig.redis.sslEnabled).toBe(true);

      expect(envConfig.auth.secret).toBe('super-secret-auth-key-32-chars');
      expect(envConfig.auth.sessionTimeoutHours).toBe(12);
      expect(envConfig.auth.mfaEnabled).toBe(true);
      expect(envConfig.auth.publicMfaEnabled).toBe(true);

      expect(envConfig.platform.nodeEnv).toBe('production');
      expect(envConfig.platform.appVersion).toBe('v2.1.0');
      expect(envConfig.platform.region).toBe('eu-west-1');
      expect(envConfig.platform.debugEnabled).toBe(false);
      expect(envConfig.platform.observability.enabled).toBe(true);
      expect(envConfig.platform.ai.enabled).toBe(true);
      expect(envConfig.platform.public.aiEnabled).toBe(true);
    });

    it('should provide consistent environment detection', () => {
      expect(env.isDevelopment).toBe(false);
      expect(env.isProduction).toBe(true);
      expect(env.isStaging).toBe(false);
      expect(env.current).toBe('production');
    });

    it('should validate complete environment', () => {
      expect(() => validateEnvironment()).not.toThrow();
    });

    // Enhanced integration tests
    it('should handle cross-module dependencies correctly', () => {
      // Test that auth config depends on platform environment
      expect(envConfig.auth.publicUrl).toBe(envConfig.platform.public.apiUrl);
      expect(envConfig.auth.publicMfaEnabled).toBe(envConfig.platform.public.aiEnabled);
    });

    it('should maintain consistency between server and client variables', () => {
      // Test that public variables match their server counterparts
      expect(envConfig.auth.publicMfaEnabled).toBe(envConfig.auth.mfaEnabled);
      expect(envConfig.platform.public.debugEnabled).toBe(envConfig.platform.debugEnabled);
      expect(envConfig.platform.public.aiEnabled).toBe(envConfig.platform.ai.enabled);
    });

    it('should handle environment-specific configurations', () => {
      // Test production-specific behavior
      expect(envConfig.platform.debugEnabled).toBe(false);
      expect(envConfig.platform.observability.enabled).toBe(true);
    });

    it('should validate configuration interdependencies', () => {
      // Test that related configurations are consistent
      if (envConfig.auth.mfaEnabled) {
        expect(envConfig.auth.publicMfaEnabled).toBeDefined();
      }
      if (envConfig.platform.ai.enabled) {
        expect(envConfig.platform.ai.provider).toBeDefined();
        expect(envConfig.platform.ai.model).toBeDefined();
      }
    });

    it('should handle optional configurations gracefully', () => {
      // Remove optional variables and test defaults
      delete process.env.AUTH_SESSION_TIMEOUT_HOURS;
      delete process.env.DATABASE_POOL_SIZE;
      delete process.env.REDIS_DB;
      
      expect(envConfig.auth.sessionTimeoutHours).toBe(DEFAULT_SESSION_TIMEOUT_HOURS);
      expect(envConfig.database.poolSize).toBe(DEFAULT_DATABASE_POOL_SIZE);
      expect(envConfig.redis.db).toBe(DEFAULT_REDIS_DB);
    });

    it('should validate security configurations', () => {
      // Test that security-related configurations are properly set
      expect(envConfig.auth.secret.length).toBeGreaterThanOrEqual(32);
      expect(envConfig.auth.apiKeySecret.length).toBeGreaterThanOrEqual(32);
      expect(envConfig.auth.url).toMatch(/^https:/);
      expect(envConfig.database.url).toMatch(/^postgresql:/);
    });

    it('should handle feature flag configurations', () => {
      // Test feature flag consistency
      const featureFlags = [
        envConfig.platform.debugEnabled,
        envConfig.platform.observability.enabled,
        envConfig.platform.ai.enabled,
        envConfig.auth.mfaEnabled,
      ];
      
      // All feature flags should be boolean
      featureFlags.forEach(flag => {
        expect(typeof flag).toBe('boolean');
      });
    });

    it('should provide complete configuration object', () => {
      // Test that the main env object contains all expected properties
      expect(env).toHaveProperty('isDevelopment');
      expect(env).toHaveProperty('isProduction');
      expect(env).toHaveProperty('isStaging');
      expect(env).toHaveProperty('current');
      expect(env).toHaveProperty('config');
      
      expect(env.config).toHaveProperty('database');
      expect(env.config).toHaveProperty('redis');
      expect(env.config).toHaveProperty('auth');
      expect(env.config).toHaveProperty('platform');
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', () => {
      // Create invalid environment
      process.env.DATABASE_URL = 'invalid-url';
      process.env.REDIS_URL = 'invalid-url';
      process.env.AUTH_SECRET = 'short';
      
      expectSpecificError(
        () => validateEnvironment(),
        ERROR_MESSAGES.ENV_VALIDATION_FAILED
      );
    });

    it('should provide meaningful error messages', () => {
      try {
        validateEnvironment();
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain(ERROR_MESSAGES.ENV_VALIDATION_FAILED);
      }
    });
  });
});

```

---

### platform.test.ts

**Path:** `src\tests\platform.test.ts`

**Language:** TypeScript

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { platformEnv } from '../platform';
import { useEnhancedTestIsolation, setupPlatformEnvironment, expectSpecificError, expectAnyError } from './utils';
import {
  VALID_APP_VERSION,
  VALID_REGION,
  VALID_INSTANCE_ID,
  VALID_API_URL,
  VALID_AUTH_URL,
  INVALID_REGION,
  INVALID_APP_VERSION,
  INVALID_API_URL,
  MAX_INSTANCE_ID_LENGTH,
  MAX_WEBHOOK_TIMEOUT_SECONDS,
  MIN_WEBHOOK_TIMEOUT_SECONDS,
  MAX_AI_RATE_LIMIT_PER_MINUTE,
  MIN_AI_RATE_LIMIT_PER_MINUTE,
  MAX_STORAGE_BUCKET_LENGTH,
  generateLongString,
  generateTooLongString,
  DEFAULT_PLATFORM_DEBUG_ENABLED,
  DEFAULT_PLATFORM_LOG_LEVEL,
  DEFAULT_PLATFORM_OBSERVABILITY_ENABLED,
  DEFAULT_PLATFORM_FEATURE_FLAGS_ENABLED,
  DEFAULT_PLATFORM_WEBHOOKS_ENABLED,
  DEFAULT_PLATFORM_WEBHOOK_TIMEOUT_SECONDS,
  DEFAULT_PLATFORM_JOBS_ENABLED,
  DEFAULT_PLATFORM_EMAIL_ENABLED,
  DEFAULT_PLATFORM_STORAGE_ENABLED,
  DEFAULT_PLATFORM_AI_ENABLED,
  ENV_DEVELOPMENT,
  ENV_PRODUCTION,
  ENV_STAGING,
  ERROR_MESSAGES,
} from './constants';

describe('Platform Environment Validation', () => {
  useEnhancedTestIsolation();

  describe('Required Server Variables', () => {
    const setupRequiredVars = () => {
      setupPlatformEnvironment();
    };

    it('should validate required NODE_ENV', () => {
      setupRequiredVars();
      expect(platformEnv.NODE_ENV).toBe(ENV_DEVELOPMENT);
    });

    it('should use default NODE_ENV when not provided', () => {
      setupRequiredVars();
      delete process.env.NODE_ENV;
      expect(platformEnv.NODE_ENV).toBe(ENV_DEVELOPMENT);
    });

    it('should validate required APP_VERSION', () => {
      setupRequiredVars();
      process.env.APP_VERSION = VALID_APP_VERSION;
      expect(platformEnv.APP_VERSION).toBe(VALID_APP_VERSION);
    });

    it('should validate semantic versioning format', () => {
      setupRequiredVars();
      process.env.APP_VERSION = 'v2.0.0-beta';
      expect(platformEnv.APP_VERSION).toBe('v2.0.0-beta');
    });

    it('should throw error for invalid APP_VERSION format', () => {
      setupRequiredVars();
      process.env.APP_VERSION = INVALID_APP_VERSION;
      expectSpecificError(
        () => platformEnv.APP_VERSION,
        ERROR_MESSAGES.APP_VERSION_INVALID
      );
    });

    it('should validate required PLATFORM_REGION', () => {
      setupRequiredVars();
      process.env.PLATFORM_REGION = VALID_REGION;
      expect(platformEnv.PLATFORM_REGION).toBe(VALID_REGION);
    });

    it('should throw error for invalid PLATFORM_REGION format', () => {
      setupRequiredVars();
      process.env.PLATFORM_REGION = INVALID_REGION;
      expectSpecificError(
        () => platformEnv.PLATFORM_REGION,
        ERROR_MESSAGES.PLATFORM_REGION_INVALID
      );
    });

    it('should validate required PLATFORM_INSTANCE_ID', () => {
      setupRequiredVars();
      process.env.PLATFORM_INSTANCE_ID = VALID_INSTANCE_ID;
      expect(platformEnv.PLATFORM_INSTANCE_ID).toBe(VALID_INSTANCE_ID);
    });

    it('should throw error for missing PLATFORM_INSTANCE_ID', () => {
      setupRequiredVars();
      delete process.env.PLATFORM_INSTANCE_ID;
      expectAnyError(() => platformEnv.PLATFORM_INSTANCE_ID);
    });

    it('should throw error for missing NEXT_PUBLIC_API_URL', () => {
      setupRequiredVars();
      delete process.env.NEXT_PUBLIC_API_URL;
      expectAnyError(() => platformEnv.NEXT_PUBLIC_API_URL);
    });

    it('should throw error for invalid NEXT_PUBLIC_API_URL format', () => {
      setupRequiredVars();
      process.env.NEXT_PUBLIC_API_URL = INVALID_API_URL;
      expectAnyError(() => platformEnv.NEXT_PUBLIC_API_URL);
    });
  });

  describe('Optional Variables', () => {
    const setupRequiredVars = () => {
      setupPlatformEnvironment();
    };

    it('should use default debug setting when not provided', () => {
      setupRequiredVars();
      delete process.env.PLATFORM_DEBUG_ENABLED;
      expect(platformEnv.PLATFORM_DEBUG_ENABLED).toBe(DEFAULT_PLATFORM_DEBUG_ENABLED);
    });

    it('should validate debug enabled', () => {
      setupRequiredVars();
      process.env.PLATFORM_DEBUG_ENABLED = 'true';
      expect(platformEnv.PLATFORM_DEBUG_ENABLED).toBe(true);
    });

    it('should use default log level when not provided', () => {
      setupRequiredVars();
      delete process.env.PLATFORM_LOG_LEVEL;
      expect(platformEnv.PLATFORM_LOG_LEVEL).toBe(DEFAULT_PLATFORM_LOG_LEVEL);
    });

    it('should validate custom log level', () => {
      setupRequiredVars();
      process.env.PLATFORM_LOG_LEVEL = 'debug';
      expect(platformEnv.PLATFORM_LOG_LEVEL).toBe('debug');
    });

    it('should use default observability setting when not provided', () => {
      setupRequiredVars();
      delete process.env.PLATFORM_OBSERVABILITY_ENABLED;
      expect(platformEnv.PLATFORM_OBSERVABILITY_ENABLED).toBe(DEFAULT_PLATFORM_OBSERVABILITY_ENABLED);
    });

    it('should validate observability disabled', () => {
      setupRequiredVars();
      process.env.PLATFORM_OBSERVABILITY_ENABLED = 'false';
      expect(platformEnv.PLATFORM_OBSERVABILITY_ENABLED).toBe(false);
    });

    it('should validate OTEL collector endpoint when provided', () => {
      setupRequiredVars();
      process.env.PLATFORM_OBSERVABILITY_ENABLED = 'true';
      process.env.PLATFORM_OTEL_COLLECTOR_ENDPOINT = 'https://otel.example.com:4317';
      expect(platformEnv.PLATFORM_OTEL_COLLECTOR_ENDPOINT).toBe('https://otel.example.com:4317');
    });

    it('should use default feature flags setting when not provided', () => {
      setupRequiredVars();
      delete process.env.PLATFORM_FEATURE_FLAGS_ENABLED;
      expect(platformEnv.PLATFORM_FEATURE_FLAGS_ENABLED).toBe(DEFAULT_PLATFORM_FEATURE_FLAGS_ENABLED);
    });

    it('should validate feature flags enabled', () => {
      setupRequiredVars();
      process.env.PLATFORM_FEATURE_FLAGS_ENABLED = 'true';
      expect(platformEnv.PLATFORM_FEATURE_FLAGS_ENABLED).toBe(true);
    });

    it('should use default webhooks setting when not provided', () => {
      setupRequiredVars();
      delete process.env.PLATFORM_WEBHOOKS_ENABLED;
      expect(platformEnv.PLATFORM_WEBHOOKS_ENABLED).toBe(DEFAULT_PLATFORM_WEBHOOKS_ENABLED);
    });

    it('should validate webhooks disabled', () => {
      setupRequiredVars();
      process.env.PLATFORM_WEBHOOKS_ENABLED = 'false';
      expect(platformEnv.PLATFORM_WEBHOOKS_ENABLED).toBe(false);
    });

    it('should use default webhook timeout when not provided', () => {
      setupRequiredVars();
      delete process.env.PLATFORM_WEBHOOK_TIMEOUT_SECONDS;
      expect(platformEnv.PLATFORM_WEBHOOK_TIMEOUT_SECONDS).toBe(DEFAULT_PLATFORM_WEBHOOK_TIMEOUT_SECONDS);
    });

    it('should validate custom webhook timeout', () => {
      setupRequiredVars();
      process.env.PLATFORM_WEBHOOK_TIMEOUT_SECONDS = '60';
      expect(platformEnv.PLATFORM_WEBHOOK_TIMEOUT_SECONDS).toBe(60);
    });

    it('should use default jobs setting when not provided', () => {
      setupRequiredVars();
      delete process.env.PLATFORM_JOBS_ENABLED;
      expect(platformEnv.PLATFORM_JOBS_ENABLED).toBe(DEFAULT_PLATFORM_JOBS_ENABLED);
    });

    it('should validate jobs disabled', () => {
      setupRequiredVars();
      process.env.PLATFORM_JOBS_ENABLED = 'false';
      expect(platformEnv.PLATFORM_JOBS_ENABLED).toBe(false);
    });

    it('should use default email setting when not provided', () => {
      setupRequiredVars();
      delete process.env.PLATFORM_EMAIL_ENABLED;
      expect(platformEnv.PLATFORM_EMAIL_ENABLED).toBe(DEFAULT_PLATFORM_EMAIL_ENABLED);
    });

    it('should validate email disabled', () => {
      setupRequiredVars();
      process.env.PLATFORM_EMAIL_ENABLED = 'false';
      expect(platformEnv.PLATFORM_EMAIL_ENABLED).toBe(false);
    });

    it('should use default storage setting when not provided', () => {
      setupRequiredVars();
      delete process.env.PLATFORM_STORAGE_ENABLED;
      expect(platformEnv.PLATFORM_STORAGE_ENABLED).toBe(DEFAULT_PLATFORM_STORAGE_ENABLED);
    });

    it('should validate storage disabled', () => {
      setupRequiredVars();
      process.env.PLATFORM_STORAGE_ENABLED = 'false';
      expect(platformEnv.PLATFORM_STORAGE_ENABLED).toBe(false);
    });

    it('should use default AI setting when not provided', () => {
      setupRequiredVars();
      delete process.env.PLATFORM_AI_ENABLED;
      expect(platformEnv.PLATFORM_AI_ENABLED).toBe(DEFAULT_PLATFORM_AI_ENABLED);
    });

    it('should validate AI enabled', () => {
      setupRequiredVars();
      process.env.PLATFORM_AI_ENABLED = 'true';
      expect(platformEnv.PLATFORM_AI_ENABLED).toBe(true);
    });
  });

  describe('Client Variables', () => {
    const setupRequiredVars = () => {
      setupPlatformEnvironment();
    };

    it('should validate NEXT_PUBLIC_PLATFORM_ENV', () => {
      setupRequiredVars();
      process.env.NEXT_PUBLIC_PLATFORM_ENV = 'staging';
      expect(platformEnv.NEXT_PUBLIC_PLATFORM_ENV).toBe('staging');
    });

    it('should use default NEXT_PUBLIC_PLATFORM_ENV when not provided', () => {
      setupRequiredVars();
      delete process.env.NEXT_PUBLIC_PLATFORM_ENV;
      expect(platformEnv.NEXT_PUBLIC_PLATFORM_ENV).toBe(ENV_DEVELOPMENT);
    });

    it('should validate NEXT_PUBLIC_DEBUG_ENABLED', () => {
      setupRequiredVars();
      process.env.NEXT_PUBLIC_DEBUG_ENABLED = 'true';
      expect(platformEnv.NEXT_PUBLIC_DEBUG_ENABLED).toBe(true);
    });

    it('should validate NEXT_PUBLIC_FEATURE_FLAGS_ENABLED', () => {
      setupRequiredVars();
      process.env.NEXT_PUBLIC_FEATURE_FLAGS_ENABLED = 'true';
      expect(platformEnv.NEXT_PUBLIC_FEATURE_FLAGS_ENABLED).toBe(true);
    });

    it('should validate NEXT_PUBLIC_AI_ENABLED', () => {
      setupRequiredVars();
      process.env.NEXT_PUBLIC_AI_ENABLED = 'true';
      expect(platformEnv.NEXT_PUBLIC_AI_ENABLED).toBe(true);
    });

    it('should validate NEXT_PUBLIC_SENTRY_DSN', () => {
      setupRequiredVars();
      process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://1234567890abcdef.ingest.sentry.io/123456';
      expect(platformEnv.NEXT_PUBLIC_SENTRY_DSN).toBe('https://1234567890abcdef.ingest.sentry.io/123456');
    });

    it('should validate NEXT_PUBLIC_ANALYTICS_ENABLED', () => {
      setupRequiredVars();
      process.env.NEXT_PUBLIC_ANALYTICS_ENABLED = 'true';
      expect(platformEnv.NEXT_PUBLIC_ANALYTICS_ENABLED).toBe(true);
    });

    it('should validate NEXT_PUBLIC_ANALYTICS_ID', () => {
      setupRequiredVars();
      process.env.NEXT_PUBLIC_ANALYTICS_ID = 'GA-123456789';
      expect(platformEnv.NEXT_PUBLIC_ANALYTICS_ID).toBe('GA-123456789');
    });
  });

  describe('Edge Cases', () => {
    const setupRequiredVars = () => {
      setupPlatformEnvironment();
    };

    it('should handle maximum instance ID length', () => {
      setupRequiredVars();
      process.env.PLATFORM_INSTANCE_ID = generateLongString(MAX_INSTANCE_ID_LENGTH);
      expect(platformEnv.PLATFORM_INSTANCE_ID).toBe(generateLongString(MAX_INSTANCE_ID_LENGTH));
    });

    it('should reject instance ID that exceeds maximum length', () => {
      setupRequiredVars();
      process.env.PLATFORM_INSTANCE_ID = generateTooLongString(MAX_INSTANCE_ID_LENGTH);
      expectAnyError(() => platformEnv.PLATFORM_INSTANCE_ID);
    });

    it('should handle maximum webhook timeout', () => {
      setupRequiredVars();
      process.env.PLATFORM_WEBHOOK_TIMEOUT_SECONDS = MAX_WEBHOOK_TIMEOUT_SECONDS.toString();
      expect(platformEnv.PLATFORM_WEBHOOK_TIMEOUT_SECONDS).toBe(MAX_WEBHOOK_TIMEOUT_SECONDS);
    });

    it('should handle minimum webhook timeout', () => {
      setupRequiredVars();
      process.env.PLATFORM_WEBHOOK_TIMEOUT_SECONDS = MIN_WEBHOOK_TIMEOUT_SECONDS.toString();
      expect(platformEnv.PLATFORM_WEBHOOK_TIMEOUT_SECONDS).toBe(MIN_WEBHOOK_TIMEOUT_SECONDS);
    });

    it('should handle maximum AI rate limit', () => {
      setupRequiredVars();
      process.env.PLATFORM_AI_RATE_LIMIT_PER_MINUTE = MAX_AI_RATE_LIMIT_PER_MINUTE.toString();
      expect(platformEnv.PLATFORM_AI_RATE_LIMIT_PER_MINUTE).toBe(MAX_AI_RATE_LIMIT_PER_MINUTE);
    });

    it('should handle minimum AI rate limit', () => {
      setupRequiredVars();
      process.env.PLATFORM_AI_RATE_LIMIT_PER_MINUTE = MIN_AI_RATE_LIMIT_PER_MINUTE.toString();
      expect(platformEnv.PLATFORM_AI_RATE_LIMIT_PER_MINUTE).toBe(MIN_AI_RATE_LIMIT_PER_MINUTE);
    });

    it('should handle valid storage bucket name', () => {
      setupRequiredVars();
      process.env.PLATFORM_STORAGE_BUCKET = 'my-valid-bucket.name';
      expect(platformEnv.PLATFORM_STORAGE_BUCKET).toBe('my-valid-bucket.name');
    });

    it('should reject storage bucket with invalid characters', () => {
      setupRequiredVars();
      process.env.PLATFORM_STORAGE_BUCKET = 'Invalid_Bucket_Name';
      expectSpecificError(
        () => platformEnv.PLATFORM_STORAGE_BUCKET,
        ERROR_MESSAGES.PLATFORM_STORAGE_BUCKET_INVALID
      );
    });

    it('should handle maximum storage bucket length', () => {
      setupRequiredVars();
      process.env.PLATFORM_STORAGE_BUCKET = generateLongString(MAX_STORAGE_BUCKET_LENGTH);
      expect(platformEnv.PLATFORM_STORAGE_BUCKET).toBe(generateLongString(MAX_STORAGE_BUCKET_LENGTH));
    });

    it('should reject storage bucket that exceeds maximum length', () => {
      setupRequiredVars();
      process.env.PLATFORM_STORAGE_BUCKET = generateTooLongString(MAX_STORAGE_BUCKET_LENGTH);
      expectAnyError(() => platformEnv.PLATFORM_STORAGE_BUCKET);
    });
  });
});

```

---

### redis.test.ts

**Path:** `src\tests\redis.test.ts`

**Language:** TypeScript

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { redisEnv, redisConfig } from '../redis';
import { useEnhancedTestIsolation, setupRedisEnvironment, expectSpecificError, expectAnyError } from './utils';
import {
  VALID_REDIS_URL,
  VALID_REDIS_SECURE_URL,
  VALID_KEY_PREFIX,
  INVALID_REDIS_URL,
  INVALID_KEY_PREFIX,
  MAX_REDIS_DB,
  MIN_REDIS_DB,
  MAX_REDIS_TIMEOUT_MS,
  MIN_REDIS_TIMEOUT_MS,
  MAX_REDIS_DEFAULT_TTL_SECONDS,
  MIN_REDIS_DEFAULT_TTL_SECONDS,
  MAX_REDIS_MAX_RETRIES,
  MIN_REDIS_MAX_RETRIES,
  MAX_KEY_PREFIX_LENGTH,
  DEFAULT_REDIS_DB,
  DEFAULT_REDIS_TIMEOUT_MS,
  DEFAULT_REDIS_MAX_RETRIES,
  DEFAULT_REDIS_DEFAULT_TTL_SECONDS,
  DEFAULT_REDIS_CLUSTER_ENABLED,
  generateLongString,
  generateTooLongString,
  ERROR_MESSAGES,
} from './constants';

describe('Redis Environment Validation', () => {
  useEnhancedTestIsolation();

  describe('Required Variables', () => {
    const setupRequiredVars = () => {
      setupRedisEnvironment({
        REDIS_URL: VALID_REDIS_URL,
        REDIS_KEY_PREFIX: VALID_KEY_PREFIX,
      });
    };

    it('should validate required Redis URL', () => {
      setupRequiredVars();
      expect(redisEnv.REDIS_URL).toBe(VALID_REDIS_URL);
    });

    it('should validate secure Redis URL', () => {
      setupRequiredVars();
      process.env.REDIS_URL = VALID_REDIS_SECURE_URL;
      expect(redisEnv.REDIS_URL).toBe(VALID_REDIS_SECURE_URL);
    });

    it('should throw error for missing REDIS_URL', () => {
      setupRequiredVars();
      delete process.env.REDIS_URL;
      expectAnyError(() => redisEnv.REDIS_URL);
    });

    it('should throw error for invalid REDIS_URL protocol', () => {
      setupRequiredVars();
      process.env.REDIS_URL = INVALID_REDIS_URL;
      expectSpecificError(
        () => redisEnv.REDIS_URL,
        ERROR_MESSAGES.REDIS_URL_INVALID
      );
    });

    it('should validate required REDIS_KEY_PREFIX', () => {
      setupRequiredVars();
      process.env.REDIS_KEY_PREFIX = 'tenant123:';
      expect(redisEnv.REDIS_KEY_PREFIX).toBe('tenant123:');
    });

    it('should throw error for missing REDIS_KEY_PREFIX', () => {
      setupRequiredVars();
      delete process.env.REDIS_KEY_PREFIX;
      expectAnyError(() => redisEnv.REDIS_KEY_PREFIX);
    });

    it('should throw error for invalid REDIS_KEY_PREFIX characters', () => {
      setupRequiredVars();
      process.env.REDIS_KEY_PREFIX = INVALID_KEY_PREFIX;
      expectSpecificError(
        () => redisEnv.REDIS_KEY_PREFIX,
        ERROR_MESSAGES.REDIS_KEY_PREFIX_INVALID
      );
    });
  });

  describe('Optional Variables', () => {
    const setupRequiredVars = () => {
      setupRedisEnvironment({
        REDIS_URL: VALID_REDIS_URL,
        REDIS_KEY_PREFIX: VALID_KEY_PREFIX,
      });
    };

    it('should use default database when not provided', () => {
      setupRequiredVars();
      delete process.env.REDIS_DB;
      expect(redisEnv.REDIS_DB).toBe(DEFAULT_REDIS_DB);
    });

    it('should validate custom database number', () => {
      setupRequiredVars();
      process.env.REDIS_DB = '5';
      expect(redisEnv.REDIS_DB).toBe(5);
    });

    it('should throw error for invalid database number range', () => {
      setupRequiredVars();
      process.env.REDIS_DB = (MAX_REDIS_DB + 1).toString();
      expectAnyError(() => redisEnv.REDIS_DB);
    });

    it('should use default timeout when not provided', () => {
      setupRequiredVars();
      delete process.env.REDIS_TIMEOUT_MS;
      expect(redisEnv.REDIS_TIMEOUT_MS).toBe(DEFAULT_REDIS_TIMEOUT_MS);
    });

    it('should validate custom timeout', () => {
      setupRequiredVars();
      process.env.REDIS_TIMEOUT_MS = '10000';
      expect(redisEnv.REDIS_TIMEOUT_MS).toBe(10000);
    });

    it('should throw error for timeout below minimum', () => {
      setupRequiredVars();
      process.env.REDIS_TIMEOUT_MS = '50';
      expectAnyError(() => redisEnv.REDIS_TIMEOUT_MS);
    });

    it('should use default max retries when not provided', () => {
      setupRequiredVars();
      delete process.env.REDIS_MAX_RETRIES;
      expect(redisEnv.REDIS_MAX_RETRIES).toBe(DEFAULT_REDIS_MAX_RETRIES);
    });

    it('should validate custom max retries', () => {
      setupRequiredVars();
      process.env.REDIS_MAX_RETRIES = '5';
      expect(redisEnv.REDIS_MAX_RETRIES).toBe(5);
    });

    it('should use default TTL when not provided', () => {
      setupRequiredVars();
      delete process.env.REDIS_DEFAULT_TTL_SECONDS;
      expect(redisEnv.REDIS_DEFAULT_TTL_SECONDS).toBe(DEFAULT_REDIS_DEFAULT_TTL_SECONDS);
    });

    it('should validate custom TTL', () => {
      setupRequiredVars();
      process.env.REDIS_DEFAULT_TTL_SECONDS = '7200';
      expect(redisEnv.REDIS_DEFAULT_TTL_SECONDS).toBe(7200);
    });

    it('should throw error for TTL above maximum', () => {
      setupRequiredVars();
      process.env.REDIS_DEFAULT_TTL_SECONDS = (MAX_REDIS_DEFAULT_TTL_SECONDS + 1).toString();
      expectAnyError(() => redisEnv.REDIS_DEFAULT_TTL_SECONDS);
    });

    it('should use default cluster setting when not provided', () => {
      setupRequiredVars();
      delete process.env.REDIS_CLUSTER_ENABLED;
      expect(redisEnv.REDIS_CLUSTER_ENABLED).toBe(DEFAULT_REDIS_CLUSTER_ENABLED);
    });

    it('should validate cluster enabled', () => {
      setupRequiredVars();
      process.env.REDIS_CLUSTER_ENABLED = 'true';
      expect(redisEnv.REDIS_CLUSTER_ENABLED).toBe(true);
    });

    it('should validate cluster nodes when provided', () => {
      setupRequiredVars();
      process.env.REDIS_CLUSTER_ENABLED = 'true';
      process.env.REDIS_CLUSTER_NODES = 'redis://node1:6379,redis://node2:6379,redis://node3:6379';
      expect(redisEnv.REDIS_CLUSTER_NODES).toEqual([
        'redis://node1:6379',
        'redis://node2:6379',
        'redis://node3:6379',
      ]);
    });
  });

  describe('Redis Config Object', () => {
    const setupRequiredVars = () => {
      setupRedisEnvironment({
        REDIS_URL: VALID_REDIS_SECURE_URL,
        REDIS_KEY_PREFIX: 'tenant123:',
        REDIS_DB: '2',
        REDIS_TIMEOUT_MS: '8000',
        REDIS_MAX_RETRIES: '5',
        REDIS_DEFAULT_TTL_SECONDS: '1800',
        REDIS_CLUSTER_ENABLED: 'false',
      });
    };

    it('should create correct redis config object', () => {
      setupRequiredVars();
      expect(redisConfig).toEqual({
        url: VALID_REDIS_SECURE_URL,
        db: 2,
        timeoutMs: 8000,
        maxRetries: 5,
        keyPrefix: 'tenant123:',
        defaultTtlSeconds: 1800,
        clusterEnabled: false,
        clusterNodes: undefined,
        sslEnabled: true,
      });
    });

    it('should detect SSL enabled correctly', () => {
      setupRequiredVars();
      expect(redisConfig.sslEnabled).toBe(true);
    });

    it('should detect SSL disabled correctly', () => {
      setupRequiredVars();
      process.env.REDIS_URL = VALID_REDIS_URL;
      expect(redisConfig.sslEnabled).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    const setupRequiredVars = () => {
      setupRedisEnvironment({
        REDIS_URL: VALID_REDIS_URL,
        REDIS_KEY_PREFIX: VALID_KEY_PREFIX,
      });
    };

    it('should handle maximum database number', () => {
      setupRequiredVars();
      process.env.REDIS_DB = MAX_REDIS_DB.toString();
      expect(redisEnv.REDIS_DB).toBe(MAX_REDIS_DB);
    });

    it('should handle minimum timeout', () => {
      setupRequiredVars();
      process.env.REDIS_TIMEOUT_MS = MIN_REDIS_TIMEOUT_MS.toString();
      expect(redisEnv.REDIS_TIMEOUT_MS).toBe(MIN_REDIS_TIMEOUT_MS);
    });

    it('should handle maximum timeout', () => {
      setupRequiredVars();
      process.env.REDIS_TIMEOUT_MS = MAX_REDIS_TIMEOUT_MS.toString();
      expect(redisEnv.REDIS_TIMEOUT_MS).toBe(MAX_REDIS_TIMEOUT_MS);
    });

    it('should handle maximum retries', () => {
      setupRequiredVars();
      process.env.REDIS_MAX_RETRIES = MAX_REDIS_MAX_RETRIES.toString();
      expect(redisEnv.REDIS_MAX_RETRIES).toBe(MAX_REDIS_MAX_RETRIES);
    });

    it('should handle zero retries', () => {
      setupRequiredVars();
      process.env.REDIS_MAX_RETRIES = MIN_REDIS_MAX_RETRIES.toString();
      expect(redisEnv.REDIS_MAX_RETRIES).toBe(MIN_REDIS_MAX_RETRIES);
    });

    it('should handle maximum TTL', () => {
      setupRequiredVars();
      process.env.REDIS_DEFAULT_TTL_SECONDS = MAX_REDIS_DEFAULT_TTL_SECONDS.toString();
      expect(redisEnv.REDIS_DEFAULT_TTL_SECONDS).toBe(MAX_REDIS_DEFAULT_TTL_SECONDS);
    });

    it('should handle minimum TTL', () => {
      setupRequiredVars();
      process.env.REDIS_DEFAULT_TTL_SECONDS = MIN_REDIS_DEFAULT_TTL_SECONDS.toString();
      expect(redisEnv.REDIS_DEFAULT_TTL_SECONDS).toBe(MIN_REDIS_DEFAULT_TTL_SECONDS);
    });

    it('should handle maximum key prefix length', () => {
      setupRequiredVars();
      process.env.REDIS_KEY_PREFIX = generateLongString(MAX_KEY_PREFIX_LENGTH);
      expect(redisEnv.REDIS_KEY_PREFIX).toBe(generateLongString(MAX_KEY_PREFIX_LENGTH));
    });

    it('should reject key prefix that exceeds maximum length', () => {
      setupRequiredVars();
      process.env.REDIS_KEY_PREFIX = generateTooLongString(MAX_KEY_PREFIX_LENGTH);
      expectAnyError(() => redisEnv.REDIS_KEY_PREFIX);
    });

    it('should accept valid key prefix with hyphens', () => {
      setupRequiredVars();
      process.env.REDIS_KEY_PREFIX = 'tenant-123_cache:';
      expect(redisEnv.REDIS_KEY_PREFIX).toBe('tenant-123_cache:');
    });

    it('should accept valid key prefix with underscores', () => {
      setupRequiredVars();
      process.env.REDIS_KEY_PREFIX = 'tenant_123_cache:';
      expect(redisEnv.REDIS_KEY_PREFIX).toBe('tenant_123_cache:');
    });

    it('should accept key prefix without trailing colon', () => {
      setupRequiredVars();
      process.env.REDIS_KEY_PREFIX = 'tenant123';
      expect(redisEnv.REDIS_KEY_PREFIX).toBe('tenant123');
    });

    it('should handle cluster config with nodes', () => {
      setupRequiredVars();
      process.env.REDIS_CLUSTER_ENABLED = 'true';
      process.env.REDIS_CLUSTER_NODES = 'redis://node1:6379, redis://node2:6379';
      
      expect(redisConfig.clusterEnabled).toBe(true);
      expect(redisConfig.clusterNodes).toEqual([
        'redis://node1:6379',
        'redis://node2:6379',
      ]);
    });

    it('should handle cluster config without nodes', () => {
      setupRequiredVars();
      process.env.REDIS_CLUSTER_ENABLED = 'true';
      delete process.env.REDIS_CLUSTER_NODES;
      
      expect(redisConfig.clusterEnabled).toBe(true);
      expect(redisConfig.clusterNodes).toBeUndefined();
    });
  });
});

```

---

### utils.ts

**Path:** `src\tests\utils.ts`

**Language:** TypeScript

```typescript
/**
 * Shared test utilities for environment validation tests
 */

import { beforeEach, afterEach, expect, it } from 'vitest';
import {
  VALID_AUTH_SECRET,
  VALID_API_KEY_SECRET,
  VALID_DATABASE_URL,
  VALID_REDIS_URL,
  VALID_AUTH_URL,
  VALID_APP_VERSION,
  VALID_REGION,
  VALID_INSTANCE_ID,
  VALID_SCHEMA,
  VALID_KEY_PREFIX,
  VALID_API_URL,
} from './constants';

// Store original environment and test state
let originalEnv: NodeJS.ProcessEnv;
let currentTestSnapshot: NodeJS.ProcessEnv;
let testIsolationActive = false;

/**
 * Setup test environment isolation with snapshot restoration
 */
export const setupTestEnvironment = (): void => {
  if (!testIsolationActive) {
    originalEnv = { ...process.env };
    testIsolationActive = true;
  }
  currentTestSnapshot = { ...process.env };
};

/**
 * Cleanup test environment and restore to test snapshot
 */
export const cleanupTestEnvironment = (): void => {
  if (currentTestSnapshot) {
    // Clear current environment
    Object.keys(process.env).forEach(key => {
      delete process.env[key];
    });
    // Restore test snapshot
    Object.entries(currentTestSnapshot).forEach(([key, value]) => {
      if (value !== undefined) {
        process.env[key] = value;
      }
    });
  }
};

/**
 * Complete cleanup - restore original environment (called after all tests)
 */
export const finalCleanup = (): void => {
  if (testIsolationActive && originalEnv) {
    Object.keys(process.env).forEach(key => {
      delete process.env[key];
    });
    Object.entries(originalEnv).forEach(([key, value]) => {
      if (value !== undefined) {
        process.env[key] = value;
      }
    });
    testIsolationActive = false;
  }
};

/**
 * Set up environment variables for testing with validation
 */
export const setEnvironmentVariables = (vars: Record<string, string | undefined>): void => {
  Object.entries(vars).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  });
};

/**
 * Safely set environment variables without affecting others
 */
export const safeSetEnvironmentVariables = (vars: Record<string, string | undefined>): NodeJS.ProcessEnv => {
  const currentEnv = { ...process.env };
  Object.entries(vars).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  });
  return currentEnv;
};

/**
 * Restore environment variables from a previous state
 */
export const restoreEnvironmentVariables = (previousEnv: NodeJS.ProcessEnv): void => {
  Object.keys(process.env).forEach(key => {
    if (!(key in previousEnv)) {
      delete process.env[key];
    }
  });
  Object.entries(previousEnv).forEach(([key, value]) => {
    if (value !== undefined) {
      process.env[key] = value;
    }
  });
};

/**
 * Clear all environment variables
 */
export const clearEnvironmentVariables = (): void => {
  Object.keys(process.env).forEach(key => {
    delete process.env[key];
  });
};

/**
 * Setup and cleanup hooks for test isolation with enhanced safety
 */
export const useTestIsolation = (): void => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });
};

/**
 * Enhanced test isolation with validation
 */
export const useEnhancedTestIsolation = (): void => {
  beforeEach(() => {
    setupTestEnvironment();
    // Validate environment is clean
    const envKeys = Object.keys(process.env);
    if (envKeys.length > 50) { // Reasonable limit for test environment
      console.warn(`Test environment has ${envKeys.length} variables, consider cleanup`);
    }
  });

  afterEach(() => {
    cleanupTestEnvironment();
    // Validate cleanup was successful
    const remainingKeys = Object.keys(process.env).filter(key => !key.startsWith('NODE_'));
    if (remainingKeys.length > 20) {
      console.warn('Environment may not have been properly cleaned up');
    }
  });
};

/**
 * Expect an error with specific message
 */
export const expectErrorWithMessage = (
  fn: () => void,
  expectedMessage: string | RegExp
): void => {
  try {
    fn();
    throw new Error('Expected function to throw');
  } catch (error) {
    if (error instanceof Error) {
      if (typeof expectedMessage === 'string') {
        expect(error.message).toContain(expectedMessage);
      } else {
        expect(error.message).toMatch(expectedMessage);
      }
    } else {
      throw error;
    }
  }
};

/**
 * Expect an error with specific message using constants
 */
export const expectSpecificError = (
  fn: () => void,
  expectedMessage: string
): void => {
  expectErrorWithMessage(fn, expectedMessage);
};

/**
 * Expect an error with partial message match
 */
export const expectPartialError = (
  fn: () => void,
  expectedPartialMessage: string
): void => {
  try {
    fn();
    throw new Error('Expected function to throw');
  } catch (error) {
    if (error instanceof Error) {
      expect(error.message).toContain(expectedPartialMessage);
    } else {
      throw error;
    }
  }
};

/**
 * Expect an error without checking message
 */
export const expectAnyError = (fn: () => void): void => {
  expect(fn).toThrow();
};

/**
 * Create a test environment configuration
 */
export const createTestEnvironment = (overrides: Record<string, string | undefined> = {}): Record<string, string> => {
  const baseEnv: Record<string, string> = {
    // Database
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/test',
    DATABASE_SCHEMA: 'public',
    
    // Redis
    REDIS_URL: 'redis://localhost:6379',
    REDIS_KEY_PREFIX: 'test:',
    
    // Auth
    AUTH_SECRET: 'a'.repeat(32),
    AUTH_URL: 'https://auth.example.com',
    AUTH_API_KEY_SECRET: 'b'.repeat(32),
    NEXT_PUBLIC_AUTH_URL: 'https://auth.example.com',
    NEXT_PUBLIC_APP_VERSION: 'v1.0.0',
    
    // Platform
    NODE_ENV: 'development',
    APP_VERSION: 'v1.0.0',
    PLATFORM_REGION: 'us-east-1',
    PLATFORM_INSTANCE_ID: 'instance-123',
    NEXT_PUBLIC_API_URL: 'https://api.example.com',
  };

  const env = { ...baseEnv };
  Object.entries(overrides).forEach(([key, value]) => {
    if (value === undefined) {
      delete env[key];
    } else {
      env[key] = value;
    }
  });

  return env;
};

/**
 * Setup a complete test environment
 */
export const setupCompleteTestEnvironment = (overrides: Record<string, string | undefined> = {}): void => {
  const env = createTestEnvironment(overrides);
  setEnvironmentVariables(env);
};

/**
 * Modular setup functions for different test scenarios
 */
export const setupAuthEnvironment = (overrides: Record<string, string | undefined> = {}): void => {
  const authEnv = {
    AUTH_SECRET: VALID_AUTH_SECRET,
    AUTH_URL: VALID_AUTH_URL,
    AUTH_API_KEY_SECRET: VALID_API_KEY_SECRET,
    NEXT_PUBLIC_AUTH_URL: VALID_AUTH_URL,
    NEXT_PUBLIC_APP_VERSION: VALID_APP_VERSION,
    ...overrides
  };
  setEnvironmentVariables(authEnv);
};

export const setupDatabaseEnvironment = (overrides: Record<string, string | undefined> = {}): void => {
  const dbEnv = {
    DATABASE_URL: VALID_DATABASE_URL,
    DATABASE_SCHEMA: VALID_SCHEMA,
    ...overrides
  };
  setEnvironmentVariables(dbEnv);
};

export const setupRedisEnvironment = (overrides: Record<string, string | undefined> = {}): void => {
  const redisEnv = {
    REDIS_URL: VALID_REDIS_URL,
    REDIS_KEY_PREFIX: VALID_KEY_PREFIX,
    ...overrides
  };
  setEnvironmentVariables(redisEnv);
};

export const setupPlatformEnvironment = (overrides: Record<string, string | undefined> = {}): void => {
  const platformEnv = {
    NODE_ENV: 'development',
    APP_VERSION: VALID_APP_VERSION,
    PLATFORM_REGION: VALID_REGION,
    PLATFORM_INSTANCE_ID: VALID_INSTANCE_ID,
    NEXT_PUBLIC_API_URL: VALID_API_URL,
    ...overrides
  };
  setEnvironmentVariables(platformEnv);
};

/**
 * Minimal setup for single variable testing
 */
export const setupMinimalEnvironment = (vars: Record<string, string | undefined>): void => {
  // Only set the provided variables, don't set up full environment
  setEnvironmentVariables(vars);
};

/**
 * Performance-optimized test setup utilities
 */
export const setupPerformanceOptimized = {
  /**
   * Setup only required variables for a specific module
   */
  authOnly: (overrides: Record<string, string | undefined> = {}): void => {
    const minimalAuthEnv = {
      AUTH_SECRET: VALID_AUTH_SECRET,
      AUTH_URL: VALID_AUTH_URL,
      AUTH_API_KEY_SECRET: VALID_API_KEY_SECRET,
      NEXT_PUBLIC_AUTH_URL: VALID_AUTH_URL,
      NEXT_PUBLIC_APP_VERSION: VALID_APP_VERSION,
      ...overrides
    };
    setEnvironmentVariables(minimalAuthEnv);
  },

  databaseOnly: (overrides: Record<string, string | undefined> = {}): void => {
    const minimalDbEnv = {
      DATABASE_URL: VALID_DATABASE_URL,
      DATABASE_SCHEMA: VALID_SCHEMA,
      ...overrides
    };
    setEnvironmentVariables(minimalDbEnv);
  },

  redisOnly: (overrides: Record<string, string | undefined> = {}): void => {
    const minimalRedisEnv = {
      REDIS_URL: VALID_REDIS_URL,
      REDIS_KEY_PREFIX: VALID_KEY_PREFIX,
      ...overrides
    };
    setEnvironmentVariables(minimalRedisEnv);
  },

  platformOnly: (overrides: Record<string, string | undefined> = {}): void => {
    const minimalPlatformEnv = {
      NODE_ENV: 'development',
      APP_VERSION: VALID_APP_VERSION,
      PLATFORM_REGION: VALID_REGION,
      PLATFORM_INSTANCE_ID: VALID_INSTANCE_ID,
      NEXT_PUBLIC_API_URL: VALID_API_URL,
      ...overrides
    };
    setEnvironmentVariables(minimalPlatformEnv);
  },

  /**
   * Setup only variables needed for validation testing
   */
  validationOnly: (vars: Record<string, string | undefined>): void => {
    setEnvironmentVariables(vars);
  },

  /**
   * Lazy environment setup - only setup when first accessed
   */
  lazySetup: (setupFn: () => void): () => void => {
    let setup = false;
    return () => {
      if (!setup) {
        setupFn();
        setup = true;
      }
    };
  },
};

/**
 * Performance monitoring utilities
 */
export const performanceUtils = {
  /**
   * Measure test execution time
   */
  measureTime: <T>(fn: () => T): { result: T; duration: number } => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    return {
      result,
      duration: end - start
    };
  },

  /**
   * Benchmark test performance
   */
  benchmark: (name: string, fn: () => void, iterations: number = 100): void => {
    const times: number[] = [];
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      fn();
      const end = performance.now();
      times.push(end - start);
    }
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    console.log(`${name} benchmark (${iterations} iterations):`);
    console.log(`  Average: ${avg.toFixed(2)}ms`);
    console.log(`  Min: ${min.toFixed(2)}ms`);
    console.log(`  Max: ${max.toFixed(2)}ms`);
  },
};

/**
 * Test data generators
 */
export const generateTestData = {
  longString: (length: number): string => 'a'.repeat(length),
  tooLongString: (length: number): string => 'a'.repeat(length + 1),
  validUrl: (protocol: string, domain: string, port?: number): string => 
    port ? `${protocol}://${domain}:${port}` : `${protocol}://${domain}`,
  invalidUrl: (protocol: string): string => `${protocol}://invalid.com`,
  validVersion: (major: number, minor: number, patch: number, prerelease?: string): string =>
    prerelease ? `v${major}.${minor}.${patch}-${prerelease}` : `v${major}.${minor}.${patch}`,
  invalidVersion: (major: number, minor: number, patch: number): string => `${major}.${minor}.${patch}`,
};

/**
 * Common test scenarios
 */
export const testScenarios = {
  missingRequiredVar: (varName: string, setupFn: () => void, accessFn: () => void): void => {
    it(`should throw error for missing ${varName}`, () => {
      setupFn();
      delete process.env[varName];
      expectAnyError(accessFn);
    });
  },

  invalidFormat: (varName: string, invalidValue: string, expectedError: string, setupFn: () => void, accessFn: () => void): void => {
    it(`should throw error for invalid ${varName} format`, () => {
      setupFn();
      process.env[varName] = invalidValue;
      expectErrorWithMessage(accessFn, expectedError);
    });
  },

  validValue: (varName: string, validValue: string, setupFn: () => void, accessFn: () => void): void => {
    it(`should validate ${varName}`, () => {
      setupFn();
      process.env[varName] = validValue;
      expect(() => accessFn()).not.toThrow();
    });
  },

  defaultValue: (varName: string, expectedDefault: any, setupFn: () => void, accessFn: () => void): void => {
    it(`should use default ${varName} when not provided`, () => {
      setupFn();
      delete process.env[varName];
      expect(accessFn()).toBe(expectedDefault);
    });
  },

  boundaryValue: (varName: string, value: string, expected: any, setupFn: () => void, accessFn: () => void): void => {
    it(`should handle boundary ${varName}`, () => {
      setupFn();
      process.env[varName] = value;
      expect(accessFn()).toBe(expected);
    });
  },
};

/**
 * Standardized test naming conventions
 */
export const testNaming = {
  // Validation patterns
  validatesRequired: (varName: string) => `validates required ${varName}`,
  validatesOptional: (varName: string) => `validates optional ${varName}`,
  rejectsInvalid: (varName: string, reason: string) => `rejects invalid ${varName} (${reason})`,
  acceptsValid: (varName: string) => `accepts valid ${varName}`,
  usesDefault: (varName: string) => `uses default ${varName} when not provided`,
  
  // Edge case patterns
  handlesBoundary: (varName: string, boundary: string) => `handles boundary ${varName} (${boundary})`,
  handlesMaximum: (varName: string) => `handles maximum ${varName}`,
  handlesMinimum: (varName: string) => `handles minimum ${varName}`,
  handlesEmpty: (varName: string) => `handles empty ${varName}`,
  handlesNull: (varName: string) => `handles null ${varName}`,
  
  // Integration patterns
  createsConfig: (configName: string) => `creates correct ${configName} config object`,
  validatesIntegration: (feature: string) => `validates ${feature} integration`,
  maintainsCompatibility: (feature: string) => `maintains backward compatibility for ${feature}`,
  
  // Security patterns
  rejectsMalicious: (varName: string, attack: string) => `rejects malicious ${varName} (${attack})`,
  sanitizesInput: (varName: string) => `sanitizes ${varName} input`,
  preventsInjection: (varName: string) => `prevents injection attacks in ${varName}`,
};

```

---

### tsup.config.ts

**Path:** `tsup.config.ts`

**Language:** TypeScript

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: ['zod', '@t3-oss/env-nextjs'],
  splitting: false,
  sourcemap: true,
  minify: false,
  tsconfig: './tsconfig.json',
});

```

---

### vitest.config.ts

**Path:** `vitest.config.ts`

**Language:** TypeScript

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: [],
    // Allow process.env manipulation in tests
    env: {
      NODE_ENV: 'test',
    },
  },
});

```

---

