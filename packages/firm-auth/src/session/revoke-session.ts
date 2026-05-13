/**
 * Session revocation wrapper around Better Auth
 * 
 * Implements decorator pattern around Better Auth revocation methods.
 * Handles selective revocation and cleanup.
 */

import type { SessionRevocationOptions } from './types';
import type { UserId, TenantId } from '@firm/types';
import { betterAuth } from './better-auth-instance';

/**
 * Revokes a specific session
 */
export async function revokeSession(sessionId: string): Promise<void> {
  await betterAuth.session.invalidate(sessionId);
}

/**
 * Revokes sessions based on various criteria
 */
export async function revokeSessions(options: SessionRevocationOptions): Promise<void> {
  const {
    userId,
    tenantId,
    sessionId,
    revokeAll = false,
    revokeImpersonated = false,
  } = options;

  // Revoke specific session
  if (sessionId && !revokeAll) {
    await revokeSession(sessionId);
    return;
  }

  // Revoke all sessions for a user
  if (userId) {
    await betterAuth.session.invalidateUserSessions(userId.toString());
    return;
  }

  // Revoke all sessions for a tenant
  if (tenantId) {
    // Better Auth doesn't have direct tenant-based revocation
    // We'll need to query all sessions for the tenant and revoke them
    // This would require database access through firm-db
    // For now, we'll implement a placeholder
    console.warn(`Tenant-wide session revocation not yet implemented for tenant: ${tenantId}`);
    return;
  }

  // Revoke all impersonated sessions
  if (revokeImpersonated) {
    // This would require querying sessions with impersonatedBy field
    console.warn('Impersonated session revocation not yet implemented');
    return;
  }

  // Revoke all sessions (admin only)
  if (revokeAll) {
    console.warn('Full session revocation not implemented - requires admin privileges');
    return;
  }
}

/**
 * Revokes all expired sessions (cleanup job)
 */
export async function revokeExpiredSessions(): Promise<number> {
  try {
    // Better Auth doesn't have a built-in cleanup method
    // This would require database access through firm-db
    // For now, return 0 as placeholder
    console.warn('Expired session cleanup not yet implemented');
    return 0;
  } catch (error) {
    console.error('Error revoking expired sessions:', error);
    return 0;
  }
}

/**
 * Revokes all sessions older than specified time
 */
export async function revokeOlderThanSessions(olderThanHours: number): Promise<number> {
  try {
    const cutoffDate = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    
    // This would require database access through firm-db
    console.warn(`Older-than session revocation not yet implemented for cutoff: ${cutoffDate}`);
    return 0;
  } catch (error) {
    console.error('Error revoking older sessions:', error);
    return 0;
  }
}

/**
 * Gets count of active sessions for monitoring
 */
export async function getActiveSessionCount(
  userId?: UserId,
  tenantId?: TenantId
): Promise<number> {
  try {
    if (userId) {
      // Better Auth doesn't expose session count directly
      // This would require database access through firm-db
      console.warn(`Session count for user ${userId} not yet implemented`);
      return 0;
    }
    
    if (tenantId) {
      console.warn(`Session count for tenant ${tenantId} not yet implemented`);
      return 0;
    }
    
    console.warn('Total session count not yet implemented');
    return 0;
  } catch (error) {
    console.error('Error getting session count:', error);
    return 0;
  }
}

/**
 * Gets session information for debugging
 */
export async function getSessionInfo(sessionId: string): Promise<any> {
  try {
    const session = await betterAuth.session.validate(sessionId);
    return session;
  } catch (error) {
    console.error('Error getting session info:', error);
    return null;
  }
}
