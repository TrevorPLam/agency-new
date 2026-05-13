/**
 * TOTP verification for Firm Auth
 * 
 * Implements TOTP code verification and backup code verification
 * with rate limiting and security controls.
 */

import { verifyTotpCode, verifyBackupCodeHash } from './totp-setup';
import type { 
  TotpSecret, 
  TotpVerificationResult,
  TotpBackupCode,
  MfaSession 
} from './types';
import type { UserId, TenantId } from '@firm/types';
import { TenantCache } from '@firm/cache';
import { createMfaTotpRateLimiter, createMfaBackupCodeRateLimiter } from '../infra/rate-limit-redis';
import { sql } from 'drizzle-orm';

// Rate limiting configuration
const MAX_ATTEMPTS_PER_WINDOW = 5;
const ATTEMPT_WINDOW_MINUTES = 5;
const CODE_REUSE_WINDOW_SECONDS = 30;

/**
 * Verifies a TOTP code for a user
 * 
 * Performs comprehensive security checks:
 * - TOTP code validation
 * - Rate limiting
 * - Code reuse prevention
 * - Session management
 */
export async function verifyTotp(
  userId: UserId,
  code: string,
  sessionId: string,
  context: {
    ipAddress?: string;
    userAgent?: string;
    cache?: TenantCache;
  } = {}
): Promise<TotpVerificationResult> {
  const { ipAddress, userAgent, cache } = context;

  // Check rate limiting
  if (cache && !(await checkTotpRateLimit(cache, userId, ipAddress))) {
    return {
      valid: false,
      error: 'rate_limited',
    };
  }

  // Get active TOTP secret for user
  const totpSecret = await getActiveTotpSecret(userId);
  
  if (!totpSecret) {
    return {
      valid: false,
      error: 'mfa_not_enabled',
    };
  }

  // Verify the TOTP code
  const isValid = await verifyTotpCode(
    totpSecret.secret,
    code,
    totpSecret.algorithm,
    totpSecret.digits,
    totpSecret.period
  );

  if (!isValid) {
    // Record failed attempt
    await recordTotpAttempt(userId, ipAddress, false);
    
    return {
      valid: false,
      error: 'invalid_code',
    };
  }

  // Check for code reuse
  const isReused = await isCodeReused(userId, code);
  if (isReused) {
    return {
      valid: false,
      error: 'expired_code',
    };
  }

  // Record successful verification
  await recordTotpAttempt(userId, ipAddress, true);
  await updateTotpSecretLastUsed(totpSecret.id);

  // Create or update MFA session
  await createOrUpdateMfaSession(userId, sessionId, 'totp');

  return {
    valid: true,
    metadata: {
      lastUsedAt: new Date(),
    },
  };
}

/**
 * Verifies a backup code for a user
 * 
 * Backup codes are one-time use codes that can be used when
 * the user doesn't have access to their TOTP device.
 */
export async function verifyBackupCode(
  userId: UserId,
  backupCode: string,
  sessionId: string,
  context: {
    ipAddress?: string;
    userAgent?: string;
    cache?: TenantCache;
  } = {}
): Promise<TotpVerificationResult> {
  const { ipAddress, userAgent, cache } = context;

  // Check rate limiting
  if (cache && !(await checkBackupCodeRateLimit(cache, userId, ipAddress))) {
    return {
      valid: false,
      error: 'rate_limited',
    };
  }

  // Get unused backup codes for user
  const backupCodeEntry = await getUnusedBackupCode(userId, backupCode);
  
  if (!backupCodeEntry) {
    // Record failed attempt
    await recordTotpAttempt(userId, ipAddress, false);
    
    return {
      valid: false,
      error: 'invalid_code',
    };
  }

  // Mark backup code as used
  await markBackupCodeAsUsed(backupCodeEntry.id);

  // Record successful verification
  await recordTotpAttempt(userId, ipAddress, true);

  // Create or update MFA session
  await createOrUpdateMfaSession(userId, sessionId, 'backup_code');

  // Get remaining backup codes count
  const remainingCodes = await getRemainingBackupCodesCount(userId);

  return {
    valid: true,
    metadata: {
      lastUsedAt: new Date(),
      backupCodeUsed: true,
      remainingBackupCodes: remainingCodes,
    },
  };
}

/**
 * Checks if MFA is required for a user/session
 */
export async function isMfaRequired(
  userId: UserId,
  sessionId: string,
  context: {
    ipAddress?: string;
    userAgent?: string;
    requiredRole?: string;
    requiredPermissions?: string[];
  } = {}
): Promise<{
  required: boolean;
  reason?: 'role_based' | 'permission_based' | 'policy_based' | 'new_device';
  gracePeriod?: boolean;
}> {
  const { ipAddress, userAgent, requiredRole, requiredPermissions } = context;

  // Check if user has MFA enabled
  const totpSecret = await getActiveTotpSecret(userId);
  if (!totpSecret) {
    return { required: false };
  }

  // Check if MFA is already verified for this session
  const mfaSession = await getMfaSession(sessionId);
  if (mfaSession && mfaSession.mfaVerified) {
    return { required: false };
  }

  // Check for trusted device
  if (ipAddress && userAgent) {
    const deviceTrust = await getTrustedDevice(userId, ipAddress, userAgent);
    if (deviceTrust && deviceTrust.isTrusted && deviceTrust.expiresAt && deviceTrust.expiresAt > new Date()) {
      return { required: false };
    }
  }

  // Check role-based MFA requirements
  if (requiredRole && isMfaRequiredForRole(requiredRole)) {
    return { 
      required: true, 
      reason: 'role_based',
      gracePeriod: await isInGracePeriod(userId),
    };
  }

  // Check permission-based MFA requirements
  if (requiredPermissions && requiredPermissions.some(permission => isMfaRequiredForPermission(permission))) {
    return { 
      required: true, 
      reason: 'permission_based',
      gracePeriod: await isInGracePeriod(userId),
    };
  }

  // Check new device detection
  if (ipAddress && userAgent && await isNewDevice(userId, ipAddress, userAgent)) {
    return { 
      required: true, 
      reason: 'new_device',
      gracePeriod: await isInGracePeriod(userId),
    };
  }

  // Default policy-based MFA
  return { 
    required: true, 
    reason: 'policy_based',
    gracePeriod: await isInGracePeriod(userId),
  };
}

/**
 * Gets MFA status for a user
 */
export async function getMfaStatus(userId: UserId): Promise<{
  enabled: boolean;
  verified: boolean;
  method?: 'totp' | 'backup_code';
  lastVerifiedAt?: Date;
  backupCodesRemaining?: number;
  trustedDevices?: number;
}> {
  const totpSecret = await getActiveTotpSecret(userId);
  
  if (!totpSecret) {
    return {
      enabled: false,
      verified: false,
    };
  }

  // Get MFA session status
  const mfaSession = await getLatestMfaSession(userId);
  
  // Get backup codes count
  const backupCodesRemaining = await getRemainingBackupCodesCount(userId);
  
  // Get trusted devices count
  const trustedDevicesCount = await getTrustedDevicesCount(userId);

  return {
    enabled: true,
    verified: !!mfaSession?.mfaVerified,
    method: mfaSession?.method,
    lastVerifiedAt: mfaSession?.verifiedAt,
    backupCodesRemaining,
    trustedDevices: trustedDevicesCount,
  };
}

// Helper functions with Redis-based rate limiting

async function checkTotpRateLimit(
  cache: TenantCache,
  userId: UserId,
  ipAddress?: string
): Promise<boolean> {
  try {
    const rateLimiter = createMfaTotpRateLimiter(cache);
    const identifier = `totp:${userId}${ipAddress ? `:${ipAddress}` : ''}`;
    
    const result = await rateLimiter.checkRateLimit(identifier);
    return result.allowed;
  } catch (error) {
    console.error('Error checking TOTP rate limit:', error);
    return false; // Fail secure
  }
}

async function checkBackupCodeRateLimit(
  cache: TenantCache,
  userId: UserId,
  ipAddress?: string
): Promise<boolean> {
  try {
    const rateLimiter = createMfaBackupCodeRateLimiter(cache);
    const identifier = `backup_code:${userId}${ipAddress ? `:${ipAddress}` : ''}`;
    
    const result = await rateLimiter.checkRateLimit(identifier);
    return result.allowed;
  } catch (error) {
    console.error('Error checking backup code rate limit:', error);
    return false; // Fail secure
  }
}

async function getActiveTotpSecret(userId: UserId): Promise<TotpSecret | null> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { totpSecrets } = await import('@firm/db/schemas');
    const { eq, and } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    const result = await db
      .select()
      .from(totpSecrets)
      .where(and(eq(totpSecrets.userId, userId), eq(totpSecrets.isActive, true)))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const secret = result[0];
    return {
      id: secret.id,
      userId: secret.userId,
      tenantId: '', // Not stored in TOTP secrets table
      secret: secret.secret,
      algorithm: secret.algorithm,
      digits: secret.digits,
      period: secret.period,
      isActive: secret.isActive,
      createdAt: secret.createdAt
    };
  } catch (error) {
    console.error('Error getting active TOTP secret:', error);
    return null;
  }
}

async function isCodeReused(userId: UserId, code: string): Promise<boolean> {
  try {
    // For TOTP, we check if the same code was used in the last 30 seconds
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { totpSecrets } = await import('@firm/db/schemas');
    const { eq, and, gte } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    
    const result = await db
      .select()
      .from(totpSecrets)
      .where(and(
        eq(totpSecrets.userId, userId),
        eq(totpSecrets.isActive, true),
        gte(totpSecrets.lastUsedAt, thirtySecondsAgo)
      ))
      .limit(1);
    
    return result.length > 0;
  } catch (error) {
    console.error('Error checking code reuse:', error);
    return false; // Allow on error
  }
}

async function recordTotpAttempt(userId: UserId, ipAddress?: string, success?: boolean): Promise<void> {
  try {
    // Rate limiting is now handled by Redis INCR operations in checkTotpRateLimit
    // We only need to update TOTP secret usage on success
    if (success) {
      const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db');
      const { totpSecrets } = await import('@firm/db');
      const { eq, and } = await import('drizzle-orm');
      
      const db = createDatabaseConnection('serverless', getDatabaseConfig());
      
      await db
        .update(totpSecrets)
        .set({
          lastUsedAt: new Date(),
          usageCount: sql`usage_count + 1`
        })
        .where(and(eq(totpSecrets.userId, userId), eq(totpSecrets.isActive, true)));
    }
  } catch (error) {
    console.error('Error recording TOTP attempt:', error);
  }
}

async function updateTotpSecretLastUsed(totpSecretId: string): Promise<void> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { totpSecrets } = await import('@firm/db/schemas');
    const { eq } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    await db
      .update(totpSecrets)
      .set({
        lastUsedAt: new Date(),
        usageCount: sql`usage_count + 1`,
        updatedAt: new Date()
      })
      .where(eq(totpSecrets.id, totpSecretId));
  } catch (error) {
    console.error('Error updating TOTP secret last used:', error);
  }
}

async function createOrUpdateMfaSession(userId: UserId, sessionId: string, method: 'totp' | 'backup_code'): Promise<void> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { mfaSessions } = await import('@firm/db/schemas');
    const { eq } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Check if session exists
    const existing = await db
      .select()
      .from(mfaSessions)
      .where(eq(mfaSessions.sessionId, sessionId))
      .limit(1);
    
    if (existing.length > 0) {
      // Update existing session
      await db
        .update(mfaSessions)
        .set({
          mfaVerified: true,
          verifiedAt: new Date(),
          method,
          updatedAt: new Date(),
          expiresAt
        })
        .where(eq(mfaSessions.id, existing[0].id));
    } else {
      // Create new session
      await db.insert(mfaSessions).values({
        userId,
        sessionId,
        mfaVerified: true,
        verifiedAt: new Date(),
        method,
        expiresAt
      });
    }
  } catch (error) {
    console.error('Error creating/updating MFA session:', error);
  }
}

async function getUnusedBackupCode(userId: UserId, backupCode: string): Promise<TotpBackupCode | null> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { backupCodes: backupCodesTable, totpSecrets } = await import('@firm/db/schemas');
    const { eq, and, inArray } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    // Get active TOTP secret for user
    const activeSecret = await db
      .select()
      .from(totpSecrets)
      .where(and(eq(totpSecrets.userId, userId), eq(totpSecrets.isActive, true)))
      .limit(1);
    
    if (activeSecret.length === 0) {
      return null;
    }
    
    // Get backup codes with matching prefix (first 4 chars)
    const codePrefix = backupCode.substring(0, 4);
    const candidates = await db
      .select()
      .from(backupCodesTable)
      .where(and(
        eq(backupCodesTable.userId, userId),
        eq(backupCodesTable.totpSecretId, activeSecret[0].id),
        eq(backupCodesTable.codePrefix, codePrefix),
        eq(backupCodesTable.isUsed, false)
      ));
    
    // Verify each candidate's hash
    for (const candidate of candidates) {
      const isValid = await verifyBackupCodeHash(backupCode, candidate.codeHash);
      if (isValid) {
        return {
          id: candidate.id,
          userId: candidate.userId,
          tenantId: '', // Not stored in backup codes table
          totpSecretId: candidate.totpSecretId,
          code: backupCode, // Return plain code for verification
          isUsed: candidate.isUsed,
          createdAt: candidate.createdAt
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting unused backup code:', error);
    return null;
  }
}

async function markBackupCodeAsUsed(backupCodeId: string): Promise<void> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { backupCodes: backupCodesTable } = await import('@firm/db/schemas');
    const { eq } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    await db
      .update(backupCodesTable)
      .set({
        isUsed: true,
        usedAt: new Date()
      })
      .where(eq(backupCodesTable.id, backupCodeId));
  } catch (error) {
    console.error('Error marking backup code as used:', error);
  }
}

async function getRemainingBackupCodesCount(userId: UserId): Promise<number> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { backupCodes: backupCodesTable, totpSecrets } = await import('@firm/db/schemas');
    const { eq, and, count } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    // Get active TOTP secret for user
    const activeSecret = await db
      .select()
      .from(totpSecrets)
      .where(and(eq(totpSecrets.userId, userId), eq(totpSecrets.isActive, true)))
      .limit(1);
    
    if (activeSecret.length === 0) {
      return 0;
    }
    
    // Count unused backup codes
    const result = await db
      .select({ count: count() })
      .from(backupCodesTable)
      .where(and(
        eq(backupCodesTable.userId, userId),
        eq(backupCodesTable.totpSecretId, activeSecret[0].id),
        eq(backupCodesTable.isUsed, false)
      ));
    
    return result[0]?.count || 0;
  } catch (error) {
    console.error('Error getting remaining backup codes count:', error);
    return 0;
  }
}

async function getMfaSession(sessionId: string): Promise<MfaSession | null> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { mfaSessions } = await import('@firm/db/schemas');
    const { eq, and, gte } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    const result = await db
      .select()
      .from(mfaSessions)
      .where(and(
        eq(mfaSessions.sessionId, sessionId),
        gte(mfaSessions.expiresAt, new Date())
      ))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const session = result[0];
    return {
      id: session.id,
      userId: session.userId,
      sessionId: session.sessionId,
      mfaVerified: session.mfaVerified,
      verifiedAt: session.verifiedAt,
      method: session.method,
      expiresAt: session.expiresAt
    };
  } catch (error) {
    console.error('Error getting MFA session:', error);
    return null;
  }
}

async function getTrustedDevice(userId: UserId, ipAddress: string, userAgent: string): Promise<any> {
  try {
    // For now, trusted devices are not implemented
    // This would integrate with a device tracking system
    return null;
  } catch (error) {
    console.error('Error getting trusted device:', error);
    return null;
  }
}

function isMfaRequiredForRole(role: string): boolean {
  const mfaRequiredRoles = ['super_admin', 'tenant_admin'];
  return mfaRequiredRoles.includes(role);
}

function isMfaRequiredForPermission(permission: string): boolean {
  const mfaRequiredPermissions = ['user:impersonate', 'tenant:delete', 'admin:delete'];
  return mfaRequiredPermissions.includes(permission);
}

async function isNewDevice(userId: UserId, ipAddress: string, userAgent: string): Promise<boolean> {
  try {
    // For now, we'll consider all devices as "new" to require MFA
    // This would integrate with device fingerprinting in a real implementation
    return true;
  } catch (error) {
    console.error('Error checking if new device:', error);
    return true; // Fail secure - require MFA
  }
}

async function isInGracePeriod(userId: UserId): Promise<boolean> {
  try {
    // For now, no grace period for MFA
    // This could be implemented based on user creation date or MFA enablement date
    return false;
  } catch (error) {
    console.error('Error checking if in grace period:', error);
    return false;
  }
}

async function getLatestMfaSession(userId: UserId): Promise<MfaSession | null> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { mfaSessions } = await import('@firm/db/schemas');
    const { eq, and, gte, desc } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    const result = await db
      .select()
      .from(mfaSessions)
      .where(and(
        eq(mfaSessions.userId, userId),
        gte(mfaSessions.expiresAt, new Date())
      ))
      .orderBy(desc(mfaSessions.createdAt))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const session = result[0];
    return {
      id: session.id,
      userId: session.userId,
      tenantId: '', // Not stored in MFA sessions table
      sessionId: session.sessionId,
      mfaVerified: session.mfaVerified,
      verifiedAt: session.verifiedAt,
      method: session.method,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt
    };
  } catch (error) {
    console.error('Error getting latest MFA session for user:', error);
    return null;
  }
}

async function getTrustedDevicesCount(userId: UserId): Promise<number> {
  try {
    // For now, no trusted devices are implemented
    // This would integrate with device tracking system
    return 0;
  } catch (error) {
    console.error('Error getting trusted devices count for user:', error);
    return 0;
  }
}
