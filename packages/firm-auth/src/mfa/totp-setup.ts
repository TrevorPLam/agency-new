/**
 * TOTP setup for Firm Auth
 * 
 * Implements TOTP (Time-based One-Time Password) setup functionality
 * including secret generation, QR code generation, and backup codes.
 */

import { randomBytes } from 'crypto';
import { encode as base32Encode } from 'base32-encode';
import QRCode from 'qrcode';
import { authenticator } from 'otplib';
import { argon2 } from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { InternalServerError } from '@firm/errors';
import type { 
  TotpSecret, 
  TotpSetupOptions, 
  TotpSetupResult,
  TotpBackupCode 
} from './types';
import type { UserId, TenantId } from '@firm/types';

// TOTP configuration defaults
const DEFAULT_ALGORITHM = 'SHA1';
const DEFAULT_DIGITS = 6;
const DEFAULT_PERIOD = 30;
const BACKUP_CODES_COUNT = 10;
const BACKUP_CODE_LENGTH = 8;

/**
 * Sets up TOTP for a user
 * 
 * Generates a new TOTP secret, QR code URL, and backup codes.
 * The secret and backup codes are only shown once during setup.
 */
export async function setupTotp(
  userId: UserId,
  tenantId: TenantId,
  options: TotpSetupOptions = {}
): Promise<TotpSetupResult> {
  const {
    algorithm = DEFAULT_ALGORITHM,
    digits = DEFAULT_DIGITS,
    period = DEFAULT_PERIOD,
    issuer = 'Firm Platform',
    label = `user:${userId}`,
  } = options;

  // Generate random secret
  const secretBuffer = randomBytes(20); // 160 bits for TOTP
  const secret = base32Encode(secretBuffer, 'RFC4648');

  // Generate QR code URL
  const qrCodeUrl = generateTotpQrCodeUrl(secret, label, issuer, algorithm, digits, period);

  // Generate QR code image
  const qrCodeDataUrl = await generateQrCodeImage(qrCodeUrl);

  // Generate backup codes
  const backupCodes = generateBackupCodes();

  // Create TOTP secret data (without the actual secret for storage)
  const totpSecret: Omit<TotpSecret, 'secret'> = {
    id: uuidv4(),
    userId,
    tenantId,
    algorithm,
    digits,
    period,
    isActive: false, // Not active until verified
    createdAt: new Date(),
  };

  // Store TOTP secret in database (placeholder)
  await storeTotpSecret({
    ...totpSecret,
    secret,
  });

  // Store backup codes in database (placeholder)
  await storeBackupCodes(userId, tenantId, totpSecret.id, backupCodes);

  return {
    secret, // Only shown once
    qrCodeUrl: qrCodeDataUrl, // QR code image as data URL
    backupCodes, // Only shown once
    totpSecret,
  };
}

/**
 * Verifies TOTP setup with a user-provided code
 * 
 * Activates TOTP for the user after successful verification.
 */
export async function verifyTotpSetup(
  userId: UserId,
  totpSecretId: string,
  code: string
): Promise<boolean> {
  // Get TOTP secret from database
  const totpSecret = await getTotpSecret(totpSecretId);
  
  if (!totpSecret || totpSecret.userId.toString() !== userId.toString()) {
    return false;
  }

  // Verify the provided code
  const isValid = await verifyTotpCode(totpSecret.secret, code, totpSecret.algorithm, totpSecret.digits, totpSecret.period);
  
  if (!isValid) {
    return false;
  }

  // Activate TOTP
  await activateTotpSecret(totpSecretId);

  return true;
}

/**
 * Generates TOTP QR code URL
 */
function generateTotpQrCodeUrl(
  secret: string,
  label: string,
  issuer: string,
  algorithm: 'SHA1' | 'SHA256' | 'SHA512',
  digits: 6 | 8,
  period: number
): string {
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm,
    digits: digits.toString(),
    period: period.toString(),
  });

  return `otpauth://totp/${label}?${params.toString()}`;
}

/**
 * Generates QR code image as data URL
 */
async function generateQrCodeImage(url: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new InternalServerError('Failed to generate QR code', {
      code: 'QR_CODE_GENERATION_FAILED',
      originalError: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Generates backup codes
 */
function generateBackupCodes(): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < BACKUP_CODES_COUNT; i++) {
    const codeBuffer = randomBytes(BACKUP_CODE_LENGTH / 2);
    const code = codeBuffer.toString('hex').toUpperCase();
    codes.push(code);
  }
  
  return codes;
}

/**
 * Verifies a TOTP code
 */
export async function verifyTotpCode(
  secret: string,
  code: string,
  algorithm: 'SHA1' | 'SHA256' | 'SHA512',
  digits: 6 | 8,
  period: number
): Promise<boolean> {
  try {
    // Configure otplib with the provided parameters
    authenticator.options = {
      algorithm: algorithm.replace('SHA', 'sha') as 'sha1' | 'sha256' | 'sha512',
      digits,
      window: period, // Allow for time drift
    };
    
    // Verify the TOTP code using the authenticator
    return authenticator.verify({
      token: code,
      secret,
    });
  } catch (error) {
    console.error('TOTP verification error:', error);
    return false;
  }
}

/**
 * Stores TOTP secret in database
 */
async function storeTotpSecret(totpSecret: TotpSecret): Promise<void> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { totpSecrets } = await import('@firm/db/schemas');
    const { eq } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    // Deactivate any existing secrets for this user
    await db
      .update(totpSecrets)
      .set({ isActive: false, deactivatedAt: new Date() })
      .where(eq(totpSecrets.userId, totpSecret.userId));
    
    // Insert new secret
    await db.insert(totpSecrets).values({
      id: totpSecret.id,
      userId: totpSecret.userId,
      secret: totpSecret.secret,
      algorithm: totpSecret.algorithm,
      digits: totpSecret.digits,
      period: totpSecret.period,
      isActive: totpSecret.isActive,
      issuer: totpSecret.issuer || 'Firm Platform',
      label: totpSecret.label || `user:${totpSecret.userId}`,
      createdAt: totpSecret.createdAt
    });
    
    console.log('TOTP secret stored successfully:', { id: totpSecret.id, userId: totpSecret.userId });
  } catch (error) {
    console.error('Error storing TOTP secret:', error);
    throw error;
  }
}

/**
 * Gets TOTP secret from database
 */
async function getTotpSecret(totpSecretId: string): Promise<TotpSecret | null> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { totpSecrets } = await import('@firm/db/schemas');
    const { eq } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    const result = await db
      .select()
      .from(totpSecrets)
      .where(eq(totpSecrets.id, totpSecretId))
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
      createdAt: secret.createdAt,
      issuer: secret.issuer,
      label: secret.label
    };
  } catch (error) {
    console.error('Error getting TOTP secret:', error);
    return null;
  }
}

/**
 * Activates TOTP secret
 */
async function activateTotpSecret(totpSecretId: string): Promise<void> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { totpSecrets } = await import('@firm/db/schemas');
    const { eq } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    await db
      .update(totpSecrets)
      .set({ 
        isActive: true, 
        activatedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(totpSecrets.id, totpSecretId));
    
    console.log('TOTP secret activated successfully:', totpSecretId);
  } catch (error) {
    console.error('Error activating TOTP secret:', error);
    throw error;
  }
}

/**
 * Stores backup codes in database
 */
async function storeBackupCodes(
  userId: UserId,
  tenantId: TenantId,
  totpSecretId: string,
  backupCodes: string[]
): Promise<void> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { backupCodes: backupCodesTable } = await import('@firm/db/schemas');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    // Create backup code entries with proper async hashing
    const backupCodeEntries: Partial<NewBackupCode>[] = await Promise.all(
      backupCodes.map(async (code) => ({
        id: crypto.randomUUID(),
        userId,
        totpSecretId,
        code: await hashBackupCode(code), // Hash the backup codes
        codePrefix: code.substring(0, 4), // First 4 characters for identification
        isUsed: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year expiration
      }))
    );
    
    // Insert all backup codes
    await db.insert(backupCodesTable).values(backupCodeEntries as NewBackupCode[]);
    
    console.log('Backup codes stored successfully:', { userId, totpSecretId, count: backupCodes.length });
  } catch (error) {
    console.error('Error storing backup codes:', error);
    throw error;
  }
}

/**
 * Hashes backup code for secure storage using Argon2id
 */
async function hashBackupCode(code: string): Promise<string> {
  try {
    // Use Argon2id with secure parameters for one-way hashing
    return await argon2.hash(code, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,       // 3 iterations
      parallelism: 1,    // 1 thread
      hashLength: 32,     // 32 bytes
    });
  } catch (error) {
    console.error('Error hashing backup code:', error);
    throw new InternalServerError('Failed to hash backup code', {
      code: 'BACKUP_CODE_HASHING_FAILED',
      originalError: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Verifies a backup code against its Argon2id hash
 */
export async function verifyBackupCodeHash(plainCode: string, hashedCode: string): Promise<boolean> {
  try {
    return await argon2.verify(hashedCode, plainCode);
  } catch (error) {
    console.error('Error verifying backup code hash:', error);
    return false;
  }
}

/**
 * Disables TOTP for a user
 */
export async function disableTotp(userId: UserId): Promise<boolean> {
  // Get active TOTP secret for user
  const totpSecret = await getActiveTotpSecret(userId);
  
  if (!totpSecret) {
    return false;
  }

  // Deactivate TOTP secret
  await deactivateTotpSecret(totpSecret.id);

  // Revoke all backup codes
  await revokeBackupCodes(totpSecret.id);

  return true;
}

/**
 * Gets active TOTP secret for user
 */
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
      createdAt: secret.createdAt,
      issuer: secret.issuer,
      label: secret.label
    };
  } catch (error) {
    console.error('Error getting active TOTP secret:', error);
    return null;
  }
}

/**
 * Deactivates TOTP secret
 */
async function deactivateTotpSecret(totpSecretId: string): Promise<void> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { totpSecrets } = await import('@firm/db/schemas');
    const { eq } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    await db
      .update(totpSecrets)
      .set({ 
        isActive: false, 
        deactivatedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(totpSecrets.id, totpSecretId));
    
    console.log('TOTP secret deactivated successfully:', totpSecretId);
  } catch (error) {
    console.error('Error deactivating TOTP secret:', error);
    throw error;
  }
}

/**
 * Revokes backup codes
 */
async function revokeBackupCodes(totpSecretId: string): Promise<void> {
  try {
    const { createDatabaseConnection, getDatabaseConfig } = await import('@firm/db/connection');
    const { backupCodes: backupCodesTable } = await import('@firm/db/schemas');
    const { eq } = await import('drizzle-orm');
    
    const db = createDatabaseConnection('serverless', getDatabaseConfig());
    
    // Mark all backup codes for this TOTP secret as used
    await db
      .update(backupCodesTable)
      .set({ 
        isUsed: true, 
        usedAt: new Date(),
        usedByIpAddress: 'system_revocation'
      })
      .where(eq(backupCodesTable.totpSecretId, totpSecretId));
    
    console.log('Backup codes revoked successfully for TOTP secret:', totpSecretId);
  } catch (error) {
    console.error('Error revoking backup codes:', error);
    throw error;
  }
}

/**
 * Regenerates backup codes
 */
export async function regenerateBackupCodes(userId: UserId): Promise<string[] | null> {
  const totpSecret = await getActiveTotpSecret(userId);
  
  if (!totpSecret) {
    return null;
  }

  // Generate new backup codes
  const newBackupCodes = generateBackupCodes();

  // Revoke old backup codes
  await revokeBackupCodes(totpSecret.id);

  // Store new backup codes
  await storeBackupCodes(userId, totpSecret.tenantId, totpSecret.id, newBackupCodes);

  return newBackupCodes;
}
