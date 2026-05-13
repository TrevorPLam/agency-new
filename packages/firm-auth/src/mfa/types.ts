/**
 * MFA (Multi-Factor Authentication) types for Firm Auth
 * 
 * Defines TOTP-related interfaces and types for multi-factor authentication.
 */

import type { UserId, TenantId } from '@firm/types';

export interface TotpSecret {
  id: string;
  userId: UserId;
  tenantId: TenantId;
  secret: string; // Base32 encoded secret
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: 6 | 8;
  period: number; // Time step in seconds (usually 30)
  isActive: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
  backupCodes?: string[]; // Encrypted backup codes
}

export interface TotpSetupOptions {
  algorithm?: 'SHA1' | 'SHA256' | 'SHA512';
  digits?: 6 | 8;
  period?: number;
  issuer?: string;
  label?: string;
}

export interface TotpSetupResult {
  secret: string; // Base32 encoded secret (show to user once)
  qrCodeUrl: string; // QR code URL for authenticator apps
  backupCodes: string[]; // Backup codes (show to user once)
  totpSecret: Omit<TotpSecret, 'secret'>; // TOTP secret data without actual secret
}

export interface TotpVerificationResult {
  valid: boolean;
  error?: 'invalid_code' | 'expired_code' | 'rate_limited' | 'mfa_not_enabled' | 'backup_code_used';
  metadata?: {
    lastUsedAt: Date;
    backupCodeUsed?: boolean;
    remainingBackupCodes?: number;
  };
}

export interface TotpBackupCode {
  id: string;
  totpSecretId: string;
  userId: UserId;
  tenantId: TenantId;
  code: string; // Hashed backup code
  isUsed: boolean;
  usedAt?: Date;
  createdAt: Date;
}

export interface MfaSession {
  id: string;
  userId: UserId;
  tenantId: TenantId;
  sessionId: string; // Reference to main session
  mfaVerified: boolean;
  verifiedAt?: Date;
  method: 'totp' | 'backup_code';
  expiresAt: Date;
  createdAt: Date;
}

export interface MfaEnforcementOptions {
  requireMfaForRoles?: string[];
  requireMfaForPermissions?: string[];
  gracePeriodDays?: number;
  skipMfaForTrustedDevices?: boolean;
  trustedDeviceDurationDays?: number;
}

export interface MfaDeviceTrust {
  id: string;
  userId: UserId;
  tenantId: TenantId;
  deviceFingerprint: string;
  userAgent: string;
  ipAddress: string;
  isTrusted: boolean;
  trustedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  lastUsedAt?: Date;
}
