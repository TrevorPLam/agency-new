/**
 * Unified authentication pipeline for Firm Platform
 * 
 * This is the main authentication function that handles both cookie-based
 * and Bearer token authentication in a unified pipeline.
 * 
 * Uses dedupe for identity resolution and follows the decorator pattern
 * around Better Auth primitives.
 */

import { verifySession, checkSessionExists } from './session';
import type { SessionContext, SessionVerificationResult } from './session/types';
import type { ApiKeyPermission } from '@firm/types';
import { verifyApiKey } from './api-keys/verify-key';

// Authentication method types
export type AuthMethod = 'cookie' | 'bearer' | 'api_key';

export interface AuthenticationRequest {
  // Cookie-based authentication
  cookie?: string;
  
  // Bearer token authentication
  authorization?: string;
  
  // API key authentication
  xApiKey?: string;
  
  // Request context
  userAgent?: string;
  ip?: string;
  path?: string;
  method?: string;
}

export interface AuthenticationResult {
  authenticated: boolean;
  session?: SessionContext;
  method?: AuthMethod;
  error?: 'invalid_token' | 'expired_token' | 'revoked_token' | 'mfa_required' | 'invalid_api_key' | 'no_credentials';
  metadata?: {
    userId?: string;
    tenantId?: string;
    permissions?: string[];
    apiKeyPermissions?: ApiKeyPermission[];
  };
}

/**
 * Unified authentication pipeline
 * 
 * This function implements the decorator pattern around Better Auth
 * and provides a single entry point for all authentication methods.
 * 
 * Priority order:
 * 1. Cookie authentication (session)
 * 2. Bearer token authentication (session)
 * 3. API key authentication
 */
export async function authenticateRequest(
  request: AuthenticationRequest
): Promise<AuthenticationResult> {
  const { cookie, authorization, xApiKey, userAgent, ip, path, method } = request;

  // Try cookie authentication first
  if (cookie) {
    const result = await authenticateWithCookie(cookie, { userAgent, ip, path, method });
    if (result.authenticated) {
      return { ...result, method: 'cookie' };
    }
  }

  // Try bearer token authentication
  if (authorization) {
    const result = await authenticateWithBearer(authorization, { userAgent, ip, path, method });
    if (result.authenticated) {
      return { ...result, method: 'bearer' };
    }
  }

  // Try API key authentication
  if (xApiKey) {
    const result = await authenticateWithApiKey(xApiKey, { userAgent, ip, path, method });
    if (result.authenticated) {
      return { ...result, method: 'api_key' };
    }
  }

  // No valid authentication found
  return {
    authenticated: false,
    error: 'no_credentials',
  };
}

/**
 * Cookie-based authentication
 */
async function authenticateWithCookie(
  cookie: string,
  context: { userAgent?: string; ip?: string; path?: string; method?: string }
): Promise<Omit<AuthenticationResult, 'method'>> {
  try {
    // Extract session token from cookie
    const sessionToken = extractSessionFromCookie(cookie);
    if (!sessionToken) {
      return { authenticated: false, error: 'invalid_token' };
    }

    // Verify session
    const verificationResult: SessionVerificationResult = await verifySession(sessionToken);
    
    if (!verificationResult.valid) {
      return {
        authenticated: false,
        error: mapVerificationError(verificationResult.error),
      };
    }

    const session = verificationResult.session!;
    
    return {
      authenticated: true,
      session,
      metadata: {
        userId: session.userId.toString(),
        tenantId: session.tenantId.toString(),
        permissions: session.permissions,
      },
    };
  } catch (error) {
    console.error('Cookie authentication error:', error);
    return { authenticated: false, error: 'invalid_token' };
  }
}

/**
 * Bearer token authentication
 */
async function authenticateWithBearer(
  authorization: string,
  context: { userAgent?: string; ip?: string; path?: string; method?: string }
): Promise<Omit<AuthenticationResult, 'method'>> {
  try {
    // Extract token from Authorization header
    const token = extractBearerToken(authorization);
    if (!token) {
      return { authenticated: false, error: 'invalid_token' };
    }

    // Verify session
    const verificationResult: SessionVerificationResult = await verifySession(token);
    
    if (!verificationResult.valid) {
      return {
        authenticated: false,
        error: mapVerificationError(verificationResult.error),
      };
    }

    const session = verificationResult.session!;
    
    return {
      authenticated: true,
      session,
      metadata: {
        userId: session.userId.toString(),
        tenantId: session.tenantId.toString(),
        permissions: session.permissions,
      },
    };
  } catch (error) {
    console.error('Bearer authentication error:', error);
    return { authenticated: false, error: 'invalid_token' };
  }
}

/**
 * API key authentication
 */
async function authenticateWithApiKey(
  apiKey: string,
  context: { userAgent?: string; ip?: string; path?: string; method?: string }
): Promise<Omit<AuthenticationResult, 'method'>> {
  try {
    const verificationResult = await verifyApiKey(apiKey, {
      ipAddress: context.ip,
      userAgent: context.userAgent,
      endpoint: context.path,
      method: context.method,
    });

    if (!verificationResult.valid) {
      return {
        authenticated: false,
        error: 'invalid_api_key',
      };
    }

    const { apiKeyData, metadata } = verificationResult;

    return {
      authenticated: true,
      metadata: {
        userId: metadata?.userId.toString(),
        tenantId: metadata?.tenantId.toString(),
        apiKeyPermissions: metadata?.permissions as ApiKeyPermission[],
      },
    };
  } catch (error) {
    console.error('API key authentication error:', error);
    return { authenticated: false, error: 'invalid_api_key' };
  }
}

/**
 * Extract session token from cookie string
 */
function extractSessionFromCookie(cookie: string): string | null {
  // Look for __Host-session cookie
  const cookies = cookie.split(';').map(c => c.trim());
  const sessionCookie = cookies.find(c => c.startsWith('__Host-session='));
  
  if (sessionCookie) {
    return sessionCookie.substring('__Host-session='.length);
  }
  
  return null;
}

/**
 * Extract token from Authorization header
 */
function extractBearerToken(authorization: string): string | null {
  if (authorization.startsWith('Bearer ')) {
    return authorization.substring('Bearer '.length);
  }
  
  return null;
}

/**
 * Map Better Auth verification errors to our error types
 */
function mapVerificationError(
  error?: 'expired' | 'invalid' | 'revoked' | 'mfa_required'
): AuthenticationResult['error'] {
  switch (error) {
    case 'expired':
      return 'expired_token';
    case 'revoked':
      return 'revoked_token';
    case 'mfa_required':
      return 'mfa_required';
    case 'invalid':
    default:
      return 'invalid_token';
  }
}

/**
 * Lightweight authentication check (doesn't verify full session)
 */
export async function quickAuthCheck(
  request: AuthenticationRequest
): Promise<{ authenticated: boolean; method?: AuthMethod }> {
  const { cookie, authorization, xApiKey } = request;

  // Check cookie
  if (cookie) {
    const sessionToken = extractSessionFromCookie(cookie);
    if (sessionToken && await checkSessionExists(sessionToken)) {
      return { authenticated: true, method: 'cookie' };
    }
  }

  // Check bearer token
  if (authorization) {
    const token = extractBearerToken(authorization);
    if (token && await checkSessionExists(token)) {
      return { authenticated: true, method: 'bearer' };
    }
  }

  // Check API key (placeholder)
  if (xApiKey) {
    // Would implement API key existence check
    return { authenticated: false };
  }

  return { authenticated: false };
}

/**
 * Authentication middleware for Next.js/Express
 */
export function createAuthMiddleware(options?: {
  requireAuth?: boolean;
  allowedMethods?: string[];
  skipPaths?: string[];
}) {
  const {
    requireAuth = true,
    allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    skipPaths = ['/health', '/api/health', '/metrics'],
  } = options || {};

  return async (request: AuthenticationRequest, next?: () => void) => {
    // Skip authentication for certain paths
    if (skipPaths.some(path => request.path?.startsWith(path))) {
      if (next) next();
      return { authenticated: true, method: 'cookie' as AuthMethod };
    }

    // Skip for unsupported methods
    if (!allowedMethods.includes(request.method || 'GET')) {
      return { authenticated: false, error: 'method_not_allowed' as const };
    }

    // Perform authentication
    const result = await authenticateRequest(request);
    
    // Return error if auth is required but not provided
    if (requireAuth && !result.authenticated) {
      return result;
    }

    if (next) next();
    return result;
  };
}
