/**
 * User impersonation for Firm Auth
 * 
 * Implements impersonation start/end functionality with proper
 * security controls, audit logging, and permission checks.
 */

import { createImpersonatedSession, revokeSession, verifySession } from './session';
import { checkImpersonationPermission } from './permissions/guard';
import { AuthorizationError, NotFoundError, ValidationError } from '@firm/errors';
import type { SessionContext } from './session/types';
import type { UserId, TenantId } from '@firm/types';
import { generateUUID } from '@firm/crypto';


export interface ImpersonationStartOptions {
  targetUserId: UserId;
  targetTenantId: TenantId;
  reason?: string;
  durationMinutes?: number; // Default 60 minutes
}

export interface ImpersonationStartOptionsWithToken extends ImpersonationStartOptions {
  impersonatorSessionToken: string;
}

export interface ImpersonationResult {
  impersonatedSession: SessionContext;
  originalSessionId: string;
  expiresAt: Date;
}

export interface ImpersonationLog {
  id: string;
  impersonatorUserId: UserId;
  impersonatorTenantId: TenantId;
  targetUserId: UserId;
  targetTenantId: TenantId;
  sessionId: string;
  impersonatedSessionId: string;
  reason?: string;
  startedAt: Date;
  endedAt?: Date;
  duration?: number; // Duration in minutes
  actionsCount: number;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Starts impersonation of a user
 * 
 * Creates an impersonated session with proper permission checks
 * and audit logging. Uses fresh session validation to prevent TOCTOU attacks.
 */
export async function startImpersonation(
  options: ImpersonationStartOptionsWithToken,
  context: {
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<ImpersonationResult> {
  const { targetUserId, targetTenantId, reason, durationMinutes = 60, impersonatorSessionToken } = options;
  const { ipAddress, userAgent } = context;

  // Fresh session validation to prevent TOCTOU attacks
  const sessionVerification = await verifySession(impersonatorSessionToken);
  if (!sessionVerification.valid) {
    throw new AuthorizationError(`Invalid session: ${sessionVerification.error}`, {
      code: 'INVALID_IMPERSONATOR_SESSION',
      reason: sessionVerification.error
    });
  }
  
  // Use the freshly validated session for all permission checks
  const freshSession = sessionVerification.session!;

  // Check if impersonator has permission to impersonate
  // Get target user details to check role
  const targetUser = await getUserDetails(targetUserId, targetTenantId);
  if (!targetUser) {
    throw new NotFoundError('Target user not found', {
      code: 'TARGET_USER_NOT_FOUND',
      targetUserId: targetUserId.toString(),
      targetTenantId: targetTenantId.toString()
    });
  }

  const permissionCheck = checkImpersonationPermission(
    freshSession,
    targetUser.role,
    targetUserId.toString()
  );

  if (!permissionCheck.granted) {
    throw new AuthorizationError(`Impersonation not allowed: ${permissionCheck.reason}`, {
      code: 'IMPERSONATION_NOT_ALLOWED',
      reason: permissionCheck.reason,
      targetUserId: targetUserId.toString(),
      impersonatorUserId: freshSession.userId.toString()
    });
  }

  // Cannot impersonate yourself
  if (freshSession.userId.toString() === targetUserId.toString()) {
    throw new ValidationError('Cannot impersonate yourself', {
      code: 'SELF_IMPERSONATION_DENIED',
      userId: freshSession.userId.toString()
    });
  }

  // Check if user is already being impersonated
  const existingImpersonation = await getActiveImpersonation(targetUserId);
  if (existingImpersonation) {
    throw new ValidationError('User is already being impersonated', {
      code: 'USER_ALREADY_IMPERSONATED',
      targetUserId: targetUserId.toString(),
      existingImpersonatorId: existingImpersonation.impersonatorUserId.toString()
    });
  }

  // Create impersonated session
  const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
  const impersonatedSession = await createImpersonatedSession(
    targetUserId,
    targetTenantId,
    freshSession.userId,
    targetUser.email,
    targetUser.role,
    targetUser.permissions
  );

  // Log impersonation start
  const impersonationLog: Partial<ImpersonationLog> = {
    id: generateUUID(),
    impersonatorUserId: freshSession.userId,
    impersonatorTenantId: freshSession.tenantId,
    targetUserId,
    targetTenantId,
    sessionId: freshSession.sessionId,
    impersonatedSessionId: impersonatedSession.sessionId,
    reason,
    startedAt: new Date(),
    actionsCount: 0,
    ipAddress,
    userAgent,
  };

  await logImpersonationStart(impersonationLog);

  return {
    impersonatedSession,
    originalSessionId: freshSession.sessionId,
    expiresAt,
  };
}

/**
 * @deprecated Use startImpersonation with ImpersonationStartOptionsWithToken instead
 * This function is kept for backward compatibility but is vulnerable to TOCTOU attacks
 */
export async function startImpersonationLegacy(
  impersonatorSession: SessionContext,
  options: ImpersonationStartOptions,
  context: {
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<ImpersonationResult> {
  // This legacy function is vulnerable to TOCTOU attacks
  // It should be replaced with the secure startImpersonation function
  console.warn('startImpersonationLegacy is deprecated and vulnerable to TOCTOU attacks. Use startImpersonation with session token instead.');
  
  const { targetUserId, targetTenantId, reason, durationMinutes = 60 } = options;
  const { ipAddress, userAgent } = context;

  // Check if impersonator has permission to impersonate
  // Get target user details to check role
  const targetUser = await getUserDetails(targetUserId, targetTenantId);
  if (!targetUser) {
    throw new NotFoundError('Target user not found', {
      code: 'TARGET_USER_NOT_FOUND',
      targetUserId: targetUserId.toString(),
      targetTenantId: targetTenantId.toString()
    });
  }

  const permissionCheck = checkImpersonationPermission(
    impersonatorSession,
    targetUser.role,
    targetUserId.toString()
  );

  if (!permissionCheck.granted) {
    throw new AuthorizationError(`Impersonation not allowed: ${permissionCheck.reason}`, {
      code: 'IMPERSONATION_NOT_ALLOWED',
      reason: permissionCheck.reason,
      targetUserId: targetUserId.toString(),
      impersonatorUserId: impersonatorSession.userId.toString()
    });
  }

  // Cannot impersonate yourself
  if (impersonatorSession.userId.toString() === targetUserId.toString()) {
    throw new ValidationError('Cannot impersonate yourself', {
      code: 'SELF_IMPERSONATION_DENIED',
      userId: impersonatorSession.userId.toString()
    });
  }

  // Check if user is already being impersonated
  const existingImpersonation = await getActiveImpersonation(targetUserId);
  if (existingImpersonation) {
    throw new ValidationError('User is already being impersonated', {
      code: 'USER_ALREADY_IMPERSONATED',
      targetUserId: targetUserId.toString(),
      existingImpersonatorId: existingImpersonation.impersonatorUserId.toString()
    });
  }

  // Create impersonated session
  const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
  const impersonatedSession = await createImpersonatedSession(
    targetUserId,
    targetTenantId,
    impersonatorSession.userId,
    targetUser.email,
    targetUser.role,
    targetUser.permissions
  );

  // Log impersonation start
  const impersonationLog: Partial<ImpersonationLog> = {
    id: generateUUID(),
    impersonatorUserId: impersonatorSession.userId,
    impersonatorTenantId: impersonatorSession.tenantId,
    targetUserId,
    targetTenantId,
    sessionId: impersonatorSession.sessionId,
    impersonatedSessionId: impersonatedSession.sessionId,
    reason,
    startedAt: new Date(),
    actionsCount: 0,
    ipAddress,
    userAgent,
  };

  await logImpersonationStart(impersonationLog);

  return {
    impersonatedSession,
    originalSessionId: impersonatorSession.sessionId,
    expiresAt,
  };
}

/**
 * Ends impersonation of a user
 * 
 * Revokes the impersonated session and updates audit logs.
 */
export async function endImpersonation(
  impersonatorSession: SessionContext,
  impersonatedSessionId: string,
  context: {
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<boolean> {
  const { ipAddress, userAgent } = context;

  // Get impersonation log
  const impersonationLog = await getImpersonationLog(impersonatedSessionId);
  
  if (!impersonationLog) {
    throw new NotFoundError('Impersonation session not found', {
      code: 'IMPERSONATION_SESSION_NOT_FOUND',
      impersonatedSessionId
    });
  }

  // Verify that the caller is the original impersonator
  if (impersonationLog.impersonatorUserId.toString() !== impersonatorSession.userId.toString()) {
    throw new AuthorizationError('Only the original impersonator can end impersonation', {
      code: 'IMPERSONATION_END_DENIED',
      impersonatedSessionId,
      expectedImpersonatorId: impersonationLog.impersonatorUserId.toString(),
      actualUserId: impersonatorSession.userId.toString()
    });
  }

  // Revoke impersonated session
  await revokeSession(impersonatedSessionId);

  // Update impersonation log
  const endTime = new Date();
  const duration = Math.floor((endTime.getTime() - impersonationLog.startedAt.getTime()) / (1000 * 60));

  await logImpersonationEnd(impersonationLog.id, endTime, duration);

  return true;
}

/**
 * Gets active impersonation sessions
 */
export async function getActiveImpersonations(
  impersonatorUserId?: UserId
): Promise<ImpersonationLog[]> {
  // This would integrate with firm-db for database access
  console.log('Getting active impersonations:', { impersonatorUserId });
  return []; // Placeholder
}

/**
 * Gets impersonation history for a user
 */
export async function getImpersonationHistory(
  userId: UserId,
  options: {
    asImpersonator?: boolean;
    asTarget?: boolean;
    page?: number;
    limit?: number;
  } = {}
): Promise<{
  impersonations: ImpersonationLog[];
  total: number;
  page: number;
  limit: number;
}> {
  const { asImpersonator = false, asTarget = false, page = 1, limit = 20 } = options;

  // This would integrate with firm-db for database access
  console.log('Getting impersonation history:', { userId, asImpersonator, asTarget, page, limit });
  
  return {
    impersonations: [],
    total: 0,
    page,
    limit,
  };
}

/**
 * Checks if a session is an impersonated session
 */
export function isImpersonatedSession(session: SessionContext): boolean {
  return session.isImpersonated && !!session.impersonatedBy;
}

/**
 * Gets the original impersonator from an impersonated session
 */
export function getImpersonatorFromSession(session: SessionContext): UserId | null {
  return session.impersonatedBy || null;
}

/**
 * Extends impersonation session
 */
export async function extendImpersonation(
  impersonatorSession: SessionContext,
  impersonatedSessionId: string,
  additionalMinutes: number
): Promise<boolean> {
  // Verify that the caller is the original impersonator
  const impersonationLog = await getImpersonationLog(impersonatedSessionId);
  
  if (!impersonationLog || 
      impersonationLog.impersonatorUserId.toString() !== impersonatorSession.userId.toString()) {
    throw new AuthorizationError('Only the original impersonator can extend impersonation', {
      code: 'IMPERSONATION_EXTEND_DENIED',
      impersonatedSessionId,
      expectedImpersonatorId: impersonationLog?.impersonatorUserId.toString(),
      actualUserId: impersonatorSession.userId.toString()
    });
  }

  // Extend session expiration
  const newExpiresAt = new Date(Date.now() + additionalMinutes * 60 * 1000);
  await extendSessionExpiration(impersonatedSessionId, newExpiresAt);

  return true;
}

/**
 * Forces end of all impersonation sessions (admin function)
 */
export async function forceEndAllImpersonations(
  adminSession: SessionContext,
  targetUserId?: UserId
): Promise<number> {
  // Verify admin permissions
  if (!hasAdminPermission(adminSession)) {
    throw new AuthorizationError('Admin permissions required', {
      code: 'ADMIN_PERMISSIONS_REQUIRED',
      userId: adminSession.userId.toString(),
      role: adminSession.role
    });
  }

  // Get active impersonations
  const activeImpersonations = await getActiveImpersonations();
  
  let endedCount = 0;
  
  for (const impersonation of activeImpersonations) {
    if (!targetUserId || impersonation.targetUserId.toString() === targetUserId.toString()) {
      await revokeSession(impersonation.impersonatedSessionId);
      await logImpersonationEnd(impersonation.id, new Date());
      endedCount++;
    }
  }

  return endedCount;
}

// Helper functions with database integration

async function getUserDetails(userId: UserId, tenantId: TenantId): Promise<any> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { users, userTenants } = await import('@firm/db/schemas');
    const { eq, and } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    // Get user with tenant relationship
    const result = await db
      .select({
        user: users,
        userTenant: userTenants
      })
      .from(users)
      .leftJoin(userTenants, and(eq(userTenants.userId, users.id), eq(userTenants.tenantId, tenantId)))
      .where(eq(users.id, userId))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const { user, userTenant } = result[0];
    
    return {
      id: user.id,
      tenantId,
      email: user.email,
      role: userTenant?.role || 'user',
      permissions: userTenant?.permissions || [],
    };
  } catch (error) {
    console.error('Error getting user details:', error);
    return null;
  }
}

async function getActiveImpersonation(targetUserId: UserId): Promise<ImpersonationLog | null> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { impersonationSessions } = await import('@firm/db/schemas');
    const { eq, and, gte } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    const result = await db
      .select()
      .from(impersonationSessions)
      .where(and(
        eq(impersonationSessions.targetUserId, targetUserId),
        eq(impersonationSessions.isActive, true),
        gte(impersonationSessions.endsAt, new Date())
      ))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const session = result[0];
    return {
      id: session.id,
      impersonatorUserId: session.impersonatorUserId,
      impersonatorTenantId: session.tenantId,
      targetUserId: session.targetUserId,
      targetTenantId: session.tenantId,
      sessionId: session.originalSessionId,
      impersonatedSessionId: session.impersonatedSessionId,
      reason: session.reason,
      startedAt: session.startedAt,
      actionsCount: Number(session.actionsCount),
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    };
  } catch (error) {
    console.error('Error getting active impersonation:', error);
    return null;
  }
}


async function logImpersonationStart(log: Partial<ImpersonationLog>): Promise<void> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { impersonationSessions } = await import('@firm/db/schemas');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    await db.insert(impersonationSessions).values({
      id: log.id!,
      impersonatorUserId: log.impersonatorUserId!,
      targetUserId: log.targetUserId!,
      tenantId: log.targetTenantId!,
      originalSessionId: log.sessionId!,
      impersonatedSessionId: log.impersonatedSessionId!,
      reason: log.reason,
      startedAt: log.startedAt!,
      endsAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour default
      actionsCount: log.actionsCount || 0,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      isActive: true
    });
    
    console.log('Impersonation start logged successfully:', { id: log.id });
  } catch (error) {
    console.error('Error logging impersonation start:', error);
    throw error;
  }
}

async function logImpersonationEnd(logId: string, endTime: Date, duration?: number): Promise<void> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { impersonationSessions } = await import('@firm/db/schemas');
    const { eq } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    await db
      .update(impersonationSessions)
      .set({
        isActive: false,
        endedAt: endTime,
        updatedAt: new Date()
      })
      .where(eq(impersonationSessions.id, logId));
    
    console.log('Impersonation end logged successfully:', { logId, endTime });
  } catch (error) {
    console.error('Error logging impersonation end:', error);
    throw error;
  }
}

async function getImpersonationLog(impersonatedSessionId: string): Promise<ImpersonationLog | null> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { impersonationSessions } = await import('@firm/db/schemas');
    const { eq, and, gte } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    const result = await db
      .select()
      .from(impersonationSessions)
      .where(and(
        eq(impersonationSessions.impersonatedSessionId, impersonatedSessionId),
        eq(impersonationSessions.isActive, true),
        gte(impersonationSessions.endsAt, new Date())
      ))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const session = result[0];
    return {
      id: session.id,
      impersonatorUserId: session.impersonatorUserId,
      impersonatorTenantId: session.tenantId,
      targetUserId: session.targetUserId,
      targetTenantId: session.tenantId,
      sessionId: session.originalSessionId,
      impersonatedSessionId: session.impersonatedSessionId,
      reason: session.reason,
      startedAt: session.startedAt,
      actionsCount: Number(session.actionsCount),
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    };
  } catch (error) {
    console.error('Error getting impersonation log:', error);
    return null;
  }
}

async function extendSessionExpiration(sessionId: string, newExpiresAt: Date): Promise<void> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { impersonationSessions } = await import('@firm/db/schemas');
    const { eq } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    await db
      .update(impersonationSessions)
      .set({
        endsAt: newExpiresAt,
        updatedAt: new Date()
      })
      .where(eq(impersonationSessions.impersonatedSessionId, sessionId));
    
    console.log('Session expiration extended successfully:', { sessionId, newExpiresAt });
  } catch (error) {
    console.error('Error extending session expiration:', error);
    throw error;
  }
}

function hasAdminPermission(session: SessionContext): boolean {
  return session.role === 'super_admin' || session.role === 'tenant_admin';
}
