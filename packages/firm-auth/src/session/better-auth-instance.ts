/**
 * Shared Better Auth instance for Firm Auth
 * 
 * Centralizes Better Auth configuration to prevent multiple connection pools
 * and reduce resource usage. All session modules should import this instance.
 */

import { auth } from 'better-auth';

/**
 * Shared Better Auth configuration
 * 
 * Security features:
 * - __Host- cookie prefix for strict security
 * - Cookie caching with 5-minute max age
 * - 24-hour default session expiration
 * - 1-hour session update age
 * - Disabled cross-subdomain cookies
 * - External ID generation
 */
export const betterAuth = auth({
  session: {
    expiresIn: 60 * 60 * 24, // 24 hours
    updateAge: 60 * 60, // 1 hour
    cookiePrefix: '__Host-',
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  advanced: {
    generateId: false, // Use our own ID generation
    crossSubDomainCookies: {
      enabled: false,
    },
  },
});

/**
 * Export the Better Auth session handler for direct access
 */
export const sessionHandler = betterAuth.session;
