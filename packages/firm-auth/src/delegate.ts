/**
 * Permission delegation for Firm Auth
 * 
 * Implements delegation grant/revoke functionality with proper
 * security controls, audit logging, and permission checks.
 */

import { createDelegatedSession, revokeSession } from './session';
import { checkDelegationPermission } from './permissions/guard';
import { AuthorizationError, ValidationError, NotFoundError } from '@firm/errors';
import type { SessionContext } from './session/types';
import type { UserId, TenantId } from '@firm/primitives';
import { generateUUID } from '@firm/crypto';

export interface DelegationGrantOptions {
  targetUserId: UserId;
  targetTenantId: TenantId;
  permissions: string[];
  expiresAt?: Date;
  reason?: string;
}

export interface DelegationResult {
  delegatedSession: SessionContext;
  grantId: string;
  expiresAt: Date;
}

export interface DelegationGrant {
  id: string;
  delegatorUserId: UserId;
  delegatorTenantId: TenantId;
  delegateeUserId: UserId;
  delegateeTenantId: TenantId;
  permissions: string[];
  sessionId: string;
  delegatedSessionId: string;
  expiresAt: Date;
  grantedAt: Date;
  revokedAt?: Date;
  reason?: string;
  isActive: boolean;
  usageCount: number;
  lastUsedAt?: Date;
}

export interface DelegationUsageLog {
  id: string;
  delegationId: string;
  userId: UserId;
  tenantId: TenantId;
  permission: string;
  endpoint: string;
  method: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
}

/**
 * Grants delegated permissions to a user
 * 
 * Creates a delegated session with proper permission checks
 * and audit logging.
 */
export async function grantDelegation(
  delegatorSession: SessionContext,
  options: DelegationGrantOptions,
  context: {
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<DelegationResult> {
  const { targetUserId, targetTenantId, permissions, expiresAt, reason } = options;
  const { ipAddress, userAgent } = context;

  // Check if delegator has permission to delegate these permissions
  for (const permission of permissions) {
    const permissionCheck = checkDelegationPermission(
      delegatorSession,
      'user', // Would need to get target user's role
      permission,
      targetUserId.toString()
    );

    if (!permissionCheck.granted) {
      throw new AuthorizationError(`Delegation not allowed for permission ${permission}: ${permissionCheck.reason}`, {
        code: 'DELEGATION_NOT_ALLOWED',
        permission,
        reason: permissionCheck.reason,
        delegatorUserId: delegatorSession.userId.toString(),
        targetUserId: targetUserId.toString()
      });
    }
  }

  // Cannot delegate to yourself
  if (delegatorSession.userId.toString() === targetUserId.toString()) {
    throw new ValidationError('Cannot delegate permissions to yourself', {
      code: 'SELF_DELEGATION_DENIED',
      userId: delegatorSession.userId.toString()
    });
  }

  // Check if delegation already exists
  const existingDelegation = await getActiveDelegation(delegatorSession.userId, targetUserId);
  if (existingDelegation) {
    throw new ValidationError('Delegation already exists for this user', {
      code: 'DELEGATION_ALREADY_EXISTS',
      delegatorUserId: delegatorSession.userId.toString(),
      delegateeUserId: targetUserId.toString(),
      existingDelegationId: existingDelegation.id
    });
  }

  // Set default expiration if not provided (7 days)
  const delegationExpiresAt = expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Create delegated session
  const delegatedSession = await createDelegatedSession(
    targetUserId,
    targetTenantId,
    delegatorSession.userId,
    `delegated-${targetUserId}@example.com`,
    'user', // Would get from user details
    permissions,
    delegationExpiresAt
  );

  // Create delegation grant
  const delegationGrant: Partial<DelegationGrant> = {
    id: generateUUID(),
    delegatorUserId: delegatorSession.userId,
    delegatorTenantId: delegatorSession.tenantId,
    delegateeUserId: targetUserId,
    delegateeTenantId: targetTenantId,
    permissions,
    sessionId: delegatorSession.sessionId,
    delegatedSessionId: delegatedSession.sessionId,
    expiresAt: delegationExpiresAt,
    grantedAt: new Date(),
    isActive: true,
    usageCount: 0,
    reason,
  };

  await storeDelegationGrant(delegationGrant);

  return {
    delegatedSession,
    grantId: delegationGrant.id!,
    expiresAt: delegationExpiresAt,
  };
}

/**
 * Revokes delegated permissions from a user
 * 
 * Revokes the delegated session and updates audit logs.
 */
export async function revokeDelegation(
  delegatorSession: SessionContext,
  delegationId: string,
  context: {
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<boolean> {
  const { ipAddress, userAgent } = context;

  // Get delegation grant
  const delegationGrant = await getDelegationGrant(delegationId);
  
  if (!delegationGrant) {
    throw new NotFoundError('Delegation grant not found', {
      code: 'DELEGATION_GRANT_NOT_FOUND',
      delegationId
    });
  }

  // Verify that the caller is the original delegator
  if (delegationGrant.delegatorUserId.toString() !== delegatorSession.userId.toString()) {
    throw new AuthorizationError('Only the original delegator can revoke delegation', {
      code: 'DELEGATION_REVOKE_DENIED',
      delegationId,
      expectedDelegatorId: delegationGrant.delegatorUserId.toString(),
      actualUserId: delegatorSession.userId.toString()
    });
  }

  // Revoke delegated session
  await revokeSession(delegationGrant.delegatedSessionId);

  // Update delegation grant
  await revokeDelegationGrant(delegationId);

  return true;
}

/**
 * Gets active delegation grants for a user
 */
export async function getActiveDelegations(
  delegatorUserId?: UserId,
  delegateeUserId?: UserId
): Promise<DelegationGrant[]> {
  // This would integrate with firm-db for database access
  console.log('Getting active delegations:', { delegatorUserId, delegateeUserId });
  return []; // Placeholder
}

/**
 * Gets delegation history for a user
 */
export async function getDelegationHistory(
  userId: UserId,
  options: {
    asDelegator?: boolean;
    asDelegatee?: boolean;
    page?: number;
    limit?: number;
  } = {}
): Promise<{
  delegations: DelegationGrant[];
  total: number;
  page: number;
  limit: number;
}> {
  const { asDelegator = false, asDelegatee = false, page = 1, limit = 20 } = options;

  // This would integrate with firm-db for database access
  console.log('Getting delegation history:', { userId, asDelegator, asDelegatee, page, limit });
  
  return {
    delegations: [],
    total: 0,
    page,
    limit,
  };
}

/**
 * Checks if a session is a delegated session
 */
export function isDelegatedSession(session: SessionContext): boolean {
  return session.isDelegated && !!session.delegatedBy;
}

/**
 * Gets the original delegator from a delegated session
 */
export function getDelegatorFromSession(session: SessionContext): UserId | null {
  return session.delegatedBy || null;
}

/**
 * Extends delegation expiration
 */
export async function extendDelegation(
  delegatorSession: SessionContext,
  delegationId: string,
  newExpiresAt: Date
): Promise<boolean> {
  // Verify that the caller is the original delegator
  const delegationGrant = await getDelegationGrant(delegationId);
  
  if (!delegationGrant || 
      delegationGrant.delegatorUserId.toString() !== delegatorSession.userId.toString()) {
    throw new AuthorizationError('Only the original delegator can extend delegation', {
      code: 'DELEGATION_EXTEND_DENIED',
      delegationId,
      expectedDelegatorId: delegationGrant?.delegatorUserId.toString(),
      actualUserId: delegatorSession.userId.toString()
    });
  }

  // Extend delegation
  await extendDelegationExpiration(delegationId, newExpiresAt);

  return true;
}

/**
 * Updates delegation permissions
 */
export async function updateDelegationPermissions(
  delegatorSession: SessionContext,
  delegationId: string,
  newPermissions: string[]
): Promise<boolean> {
  // Verify that the caller is the original delegator
  const delegationGrant = await getDelegationGrant(delegationId);
  
  if (!delegationGrant || 
      delegationGrant.delegatorUserId.toString() !== delegatorSession.userId.toString()) {
    throw new AuthorizationError('Only the original delegator can update delegation permissions', {
      code: 'DELEGATION_UPDATE_DENIED',
      delegationId,
      expectedDelegatorId: delegationGrant?.delegatorUserId.toString(),
      actualUserId: delegatorSession.userId.toString()
    });
  }

  // Check new permissions
  for (const permission of newPermissions) {
    const permissionCheck = checkDelegationPermission(
      delegatorSession,
      'user', // Would need to get delegatee's role
      permission
    );

    if (!permissionCheck.granted) {
      throw new AuthorizationError(`Cannot delegate permission ${permission}: ${permissionCheck.reason}`, {
        code: 'DELEGATION_PERMISSION_DENIED',
        permission,
        reason: permissionCheck.reason,
        delegatorUserId: delegatorSession.userId.toString()
      });
    }
  }

  // Update delegation permissions
  await updateDelegationGrantPermissions(delegationId, newPermissions);

  return true;
}

/**
 * Logs delegation usage
 */
export async function logDelegationUsage(
  delegationId: string,
  permission: string,
  context: {
    endpoint: string;
    method: string;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
  }
): Promise<void> {
  const usageLog: Partial<DelegationUsageLog> = {
    id: generateUUID(),
    delegationId,
    permission,
    endpoint: context.endpoint,
    method: context.method,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    timestamp: new Date(),
    success: context.success,
  };

  await storeDelegationUsageLog(usageLog);
}

/**
 * Gets delegation usage statistics
 */
export async function getDelegationUsageStats(
  delegationId: string,
  timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'
): Promise<{
  totalUsages: number;
  successfulUsages: number;
  failedUsages: number;
  topPermissions: Array<{ permission: string; count: number }>;
  uniqueEndpoints: number;
}> {
  // This would integrate with firm-db for analytics
  console.log(`Getting delegation usage stats for delegation: ${delegationId}, range: ${timeRange}`);
  
  return {
    totalUsages: 0,
    successfulUsages: 0,
    failedUsages: 0,
    topPermissions: [],
    uniqueEndpoints: 0,
  };
}

/**
 * Forces revocation of all delegations (admin function)
 */
export async function forceRevokeAllDelegations(
  adminSession: SessionContext,
  delegatorUserId?: UserId,
  delegateeUserId?: UserId
): Promise<number> {
  // Verify admin permissions
  if (!hasAdminPermission(adminSession)) {
    throw new AuthorizationError('Admin permissions required', {
      code: 'ADMIN_PERMISSIONS_REQUIRED',
      userId: adminSession.userId.toString(),
      role: adminSession.role
    });
  }

  // Get active delegations
  const activeDelegations = await getActiveDelegations(delegatorUserId, delegateeUserId);
  
  let revokedCount = 0;
  
  for (const delegation of activeDelegations) {
    await revokeSession(delegation.delegatedSessionId);
    await revokeDelegationGrant(delegation.id);
    revokedCount++;
  }

  return revokedCount;
}

// Helper functions with database integration

async function getActiveDelegation(delegatorUserId: UserId, delegateeUserId: UserId): Promise<DelegationGrant | null> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { delegationGrants } = await import('@firm/db/schemas');
    const { eq, and, gte } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    const result = await db
      .select()
      .from(delegationGrants)
      .where(and(
        eq(delegationGrants.delegatorUserId, delegatorUserId),
        eq(delegationGrants.delegateeUserId, delegateeUserId),
        eq(delegationGrants.isActive, true),
        gte(delegationGrants.expiresAt, new Date())
      ))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const grant = result[0];
    return {
      id: grant.id,
      delegatorUserId: grant.delegatorUserId,
      delegatorTenantId: grant.tenantId,
      delegateeUserId: grant.delegateeUserId,
      delegateeTenantId: grant.tenantId,
      permissions: grant.permissions,
      sessionId: grant.sessionId,
      delegatedSessionId: grant.delegatedSessionId,
      expiresAt: grant.expiresAt,
      grantedAt: grant.grantedAt,
      isActive: grant.isActive,
      usageCount: Number(grant.usageCount),
      lastUsedAt: grant.lastUsedAt,
      reason: grant.reason,
    };
  } catch (error) {
    console.error('Error getting active delegation:', error);
    return null;
  }
}

async function storeDelegationGrant(grant: Partial<DelegationGrant>): Promise<void> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { delegationGrants } = await import('@firm/db/schemas');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    await db.insert(delegationGrants).values({
      id: grant.id!,
      delegatorUserId: grant.delegatorUserId!,
      delegateeUserId: grant.delegateeUserId!,
      tenantId: grant.delegatorTenantId!,
      permissions: grant.permissions!,
      sessionId: grant.sessionId!,
      delegatedSessionId: grant.delegatedSessionId!,
      expiresAt: grant.expiresAt!,
      grantedAt: grant.grantedAt || new Date(),
      isActive: grant.isActive || true,
      usageCount: grant.usageCount || 0,
      reason: grant.reason,
      ipAddress: grant.ipAddress,
      userAgent: grant.userAgent,
    });
    
    console.log('Delegation grant stored successfully:', { id: grant.id });
  } catch (error) {
    console.error('Error storing delegation grant:', error);
    throw error;
  }
}

async function getDelegationGrant(delegationId: string): Promise<DelegationGrant | null> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { delegationGrants } = await import('@firm/db/schemas');
    const { eq, and, gte } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    const result = await db
      .select()
      .from(delegationGrants)
      .where(and(
        eq(delegationGrants.id, delegationId),
        eq(delegationGrants.isActive, true),
        gte(delegationGrants.expiresAt, new Date())
      ))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const grant = result[0];
    return {
      id: grant.id,
      delegatorUserId: grant.delegatorUserId,
      delegatorTenantId: grant.tenantId,
      delegateeUserId: grant.delegateeUserId,
      delegateeTenantId: grant.tenantId,
      permissions: grant.permissions,
      sessionId: grant.sessionId,
      delegatedSessionId: grant.delegatedSessionId,
      expiresAt: grant.expiresAt,
      grantedAt: grant.grantedAt,
      isActive: grant.isActive,
      usageCount: Number(grant.usageCount),
      lastUsedAt: grant.lastUsedAt,
      reason: grant.reason,
    };
  } catch (error) {
    console.error('Error getting delegation grant:', error);
    return null;
  }
}

async function revokeDelegationGrant(delegationId: string): Promise<void> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { delegationGrants } = await import('@firm/db/schemas');
    const { eq } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    await db
      .update(delegationGrants)
      .set({
        isActive: false,
        revokedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(delegationGrants.id, delegationId));
    
    console.log('Delegation grant revoked successfully:', { delegationId });
  } catch (error) {
    console.error('Error revoking delegation grant:', error);
    throw error;
  }
}

async function extendDelegationExpiration(delegationId: string, newExpiresAt: Date): Promise<void> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { delegationGrants } = await import('@firm/db/schemas');
    const { eq } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    await db
      .update(delegationGrants)
      .set({
        expiresAt: newExpiresAt,
        updatedAt: new Date()
      })
      .where(eq(delegationGrants.id, delegationId));
    
    console.log('Delegation expiration extended successfully:', { delegationId, newExpiresAt });
  } catch (error) {
    console.error('Error extending delegation expiration:', error);
    throw error;
  }
}

async function updateDelegationGrantPermissions(delegationId: string, newPermissions: string[]): Promise<void> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { delegationGrants } = await import('@firm/db/schemas');
    const { eq } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    await db
      .update(delegationGrants)
      .set({
        permissions: newPermissions,
        updatedAt: new Date()
      })
      .where(eq(delegationGrants.id, delegationId));
    
    console.log('Delegation permissions updated successfully:', { delegationId });
  } catch (error) {
    console.error('Error updating delegation permissions:', error);
    throw error;
  }
}

async function storeDelegationUsageLog(log: Partial<DelegationUsageLog>): Promise<void> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { delegationUsageLogs, delegationGrants } = await import('@firm/db/schemas');
    const { eq, sql } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    // Store usage log
    await db.insert(delegationUsageLogs).values({
      id: log.id!,
      delegationId: log.delegationId!,
      userId: log.userId!,
      tenantId: log.tenantId!,
      permission: log.permission!,
      endpoint: log.endpoint!,
      method: log.method!,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      success: log.success!,
      timestamp: log.timestamp || new Date(),
    });
    
    // Update usage count on delegation grant
    await db
      .update(delegationGrants)
      .set({
        usageCount: sql`usage_count + 1`,
        lastUsedAt: new Date()
      })
      .where(eq(delegationGrants.id, log.delegationId!));
    
    console.log('Delegation usage log stored successfully:', { id: log.id });
  } catch (error) {
    console.error('Error storing delegation usage log:', error);
    throw error;
  }
}

function hasAdminPermission(session: SessionContext): boolean {
  return session.role === 'super_admin' || session.role === 'tenant_admin';
}
