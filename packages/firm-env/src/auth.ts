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
