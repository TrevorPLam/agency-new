/**
 * Session creation wrapper around Better Auth
 * 
 * Implements decorator pattern around Better Auth session methods.
 * Uses __Host- cookie prefix for security.
 */

import type { Session } from 'better-auth/types';
import type { 
  SessionContext, 
  CreateSessionOptions, 
  SessionData 
} from './types';
import type { UserId, TenantId } from '@firm/types';
import { betterAuth } from './better-auth-instance';
import { createImmutableSession } from '../utils/deep-freeze';

/**
 * Creates a new session with Better Auth and wraps it in our SessionContext
 */
export async function createSession(
  options: CreateSessionOptions
): Promise<SessionContext> {
  const {
    userId,
    tenantId,
    email,
    role,
    permissions = [],
    rememberMe = false,
    mfaVerified = false,
  } = options;

  // Create Better Auth session
  const betterAuthSession = await betterAuth.session.create({
    userId: userId.toString(),
    expiresIn: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24, // 30 days if remember me
  });

  // Create our session data (sessionId will be added from Better Auth response)
  const sessionData: Omit<SessionData, 'sessionId'> = {
    userId,
    tenantId,
    email,
    role,
    permissions,
    mfaVerified,
    expiresAt: new Date(Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    lastAccessAt: new Date(),
  };

  // Create immutable SessionContext with deep freeze
  const sessionContext: SessionContext = createImmutableSession({
    sessionId: betterAuthSession.id,
    ...sessionData,
    isAuthenticated: true,
    isImpersonated: false,
    isDelegated: false,
  });

  return sessionContext;
}

/**
 * Creates an impersonated session (admin only)
 */
export async function createImpersonatedSession(
  targetUserId: UserId,
  targetTenantId: TenantId,
  impersonatedBy: UserId,
  targetEmail: string,
  targetRole: string,
  targetPermissions: string[]
): Promise<SessionContext> {
  // Create Better Auth session for impersonation
  const betterAuthSession = await betterAuth.session.create({
    userId: targetUserId.toString(),
    expiresIn: 60 * 60, // 1 hour for impersonation sessions
  });

  const sessionData: Omit<SessionData, 'sessionId'> = {
    userId: targetUserId,
    tenantId: targetTenantId,
    email: targetEmail,
    role: targetRole,
    permissions: targetPermissions,
    mfaVerified: true, // Impersonation bypasses MFA
    impersonatedBy,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    createdAt: new Date(),
    lastAccessAt: new Date(),
  };

  const sessionContext: SessionContext = createImmutableSession({
    sessionId: betterAuthSession.id,
    ...sessionData,
    isAuthenticated: true,
    isImpersonated: true,
    isDelegated: false,
  });

  return sessionContext;
}

/**
 * Creates a delegated session
 */
export async function createDelegatedSession(
  targetUserId: UserId,
  targetTenantId: TenantId,
  delegatedBy: UserId,
  targetEmail: string,
  targetRole: string,
  targetPermissions: string[],
  delegationExpiresAt: Date
): Promise<SessionContext> {
  // Create Better Auth session for delegation
  const betterAuthSession = await betterAuth.session.create({
    userId: targetUserId.toString(),
    expiresIn: Math.floor((delegationExpiresAt.getTime() - Date.now()) / 1000),
  });

  const sessionData: Omit<SessionData, 'sessionId'> = {
    userId: targetUserId,
    tenantId: targetTenantId,
    email: targetEmail,
    role: targetRole,
    permissions: targetPermissions,
    mfaVerified: true, // Delegation bypasses MFA
    delegatedBy,
    expiresAt: delegationExpiresAt,
    createdAt: new Date(),
    lastAccessAt: new Date(),
  };

  const sessionContext: SessionContext = createImmutableSession({
    sessionId: betterAuthSession.id,
    ...sessionData,
    isAuthenticated: true,
    isImpersonated: false,
    isDelegated: true,
  });

  return sessionContext;
}

/**
 * Updates session last access time
 */
export async function updateSessionAccess(sessionId: string): Promise<void> {
  // Update Better Auth session
  await betterAuth.session.update(sessionId, {
    lastAccessAt: new Date(),
  });
}

/**
 * Extends session expiration
 */
export async function extendSession(
  sessionId: string,
  extendBy: number = 60 * 60 * 24 // 24 hours by default
): Promise<void> {
  // Update Better Auth session expiration
  await betterAuth.session.update(sessionId, {
    expiresAt: new Date(Date.now() + extendBy * 1000),
  });
}
