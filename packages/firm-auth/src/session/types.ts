/**
 * Session types for Firm Auth
 * 
 * Defines the session context and related interfaces.
 * SessionContext is an immutable frozen object as required.
 */

import type { UserId, TenantId } from '@firm/types';

export interface SessionData {
  sessionId: string;
  userId: UserId;
  tenantId: TenantId;
  email: string;
  role: string;
  permissions: string[];
  mfaVerified: boolean;
  impersonatedBy?: UserId;
  delegatedBy?: UserId;
  expiresAt: Date;
  createdAt: Date;
  lastAccessAt: Date;
}

export interface SessionContext extends SessionData {
  isAuthenticated: boolean;
  isImpersonated: boolean;
  isDelegated: boolean;
}

export interface CreateSessionOptions {
  userId: UserId;
  tenantId: TenantId;
  email: string;
  role: string;
  permissions?: string[];
  rememberMe?: boolean;
  mfaVerified?: boolean;
}

export interface SessionVerificationResult {
  valid: boolean;
  session?: SessionContext;
  error?: 'expired' | 'invalid' | 'revoked' | 'mfa_required';
}

export interface SessionRevocationOptions {
  userId?: UserId;
  tenantId?: TenantId;
  sessionId?: string;
  revokeAll?: boolean;
  revokeImpersonated?: boolean;
}
