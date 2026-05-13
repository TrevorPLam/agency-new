/**
 * Firm Auth - Authentication and Authorization for Firm Platform
 * 
 * This is the main export file for the firm-auth package.
 * It provides a comprehensive authentication and authorization system
 * built as a thin wrapper around Better Auth.
 * 
 * Key features:
 * - Unified authentication pipeline (cookie + bearer tokens)
 * - RBAC permission matrix with role hierarchy
 * - API key management with hashed storage
 * - MFA (TOTP) support with backup codes
 * - Impersonation and delegation capabilities
 * - Immutable audit logging with PII redaction
 * - Session management with Better Auth integration
 */

// Export main authentication function
export {
  authenticateRequest,
  quickAuthCheck,
  createAuthMiddleware,
  type AuthenticationRequest,
  type AuthenticationResult,
  type AuthMethod,
} from './authenticate';

// Export session management
export {
  createSession,
  createImpersonatedSession,
  createDelegatedSession,
  updateSessionAccess,
  extendSession,
  verifySession,
  verifySessionForMfa,
  checkSessionExists,
  getSessionData,
  refreshSession,
  revokeSession,
  revokeSessions,
  revokeExpiredSessions,
  revokeOlderThanSessions,
  getActiveSessionCount,
  getSessionInfo,
  type SessionContext,
  type SessionData,
  type CreateSessionOptions,
  type SessionVerificationResult,
  type SessionRevocationOptions,
} from './session';

// Export permissions and RBAC
export {
  hasPermission,
  requirePermission,
  hasAllPermissions,
  hasAnyPermission,
  canAccessResource,
  checkImpersonationPermission,
  checkDelegationPermission,
  PermissionError,
  createPermissionGuard,
  withPermission,
  type PermissionCheckResult,
  type PermissionGuardOptions,
} from './permissions';

export {
  PERMISSION_MATRIX,
  ROLE_HIERARCHY,
  hasPermission as hasPermissionFromMatrix,
  canImpersonate,
  canDelegate,
  isValidPermission,
  ALL_PERMISSIONS,
  PERMISSION_CATEGORIES,
  type Role,
  type Permission,
  type PermissionAction,
} from './permissions';

// Export API key management
export {
  generateApiKey,
  hashApiKey,
  isValidApiKeyFormat,
  extractApiKeyPrefix,
  maskApiKey,
  validateApiKeyPermissions,
  isApiKeyExpired,
  isApiKeyRateLimited,
  isIpAddressAllowed,
  isUserAgentAllowed,
  generateApiKeyUsageStats,
  verifyApiKey,
  verifyApiKeyPermissions,
  quickApiKeyCheck,
  verifyMultipleApiKeys,
  getApiKeyUsageStats,
  createApiKey,
  getApiKey,
  listApiKeys,
  updateApiKey,
  revokeApiKey,
  deleteApiKey,
  regenerateApiKey,
  getApiKeyMetrics,
  type ApiKeyData,
  type ApiKeyCreateOptions,
  type ApiKeyCreateResult,
  type ApiKeyVerificationResult,
  type ApiKeyUpdateOptions,
  type ApiKeyUsageLog,
  type ApiKeyMetrics,
} from './api-keys';

// Export MFA (TOTP)
export {
  setupTotp,
  verifyTotpSetup,
  disableTotp,
  regenerateBackupCodes,
  verifyTotp,
  verifyBackupCode,
  isMfaRequired,
  getMfaStatus,
  type TotpSecret,
  type TotpSetupOptions,
  type TotpSetupResult,
  type TotpVerificationResult,
  type TotpBackupCode,
  type MfaSession,
  type MfaEnforcementOptions,
  type MfaDeviceTrust,
} from './mfa';

// Export impersonation
export {
  startImpersonation,
  startImpersonationLegacy,
  endImpersonation,
  getActiveImpersonations,
  getImpersonationHistory,
  isImpersonatedSession,
  getImpersonatorFromSession,
  extendImpersonation,
  forceEndAllImpersonations,
  type ImpersonationStartOptions,
  type ImpersonationStartOptionsWithToken,
  type ImpersonationResult,
  type ImpersonationLog,
} from './impersonate';

// Export delegation
export {
  grantDelegation,
  revokeDelegation,
  getActiveDelegations,
  getDelegationHistory,
  isDelegatedSession,
  getDelegatorFromSession,
  extendDelegation,
  updateDelegationPermissions,
  logDelegationUsage,
  getDelegationUsageStats,
  forceRevokeAllDelegations,
  type DelegationGrantOptions,
  type DelegationResult,
  type DelegationGrant,
  type DelegationUsageLog,
} from './delegate';

// Export audit logging
export {
  createAuditLog,
  queryAuditLogs,
  getAuditLogSummary,
  verifyAuditLogIntegrity,
  getHighRiskEvents,
  getUserActivityTimeline,
  detectAnomalousActivity,
  logAuthenticationEvent,
  logAuthorizationEvent,
  logSecurityEvent,
  type AuditLogEntry,
  type AuditLogOptions,
  type AuditLogQuery,
  type AuditLogResult,
  type AuditLogSummary,
} from './audit';

// Export rate limiting infrastructure
export {
  RedisRateLimiter,
  createRateLimiter,
  createApiKeyRateLimiter,
  createMfaTotpRateLimiter,
  createMfaBackupCodeRateLimiter,
  createStrictRateLimiter,
  RATE_LIMIT_CONFIGS,
  type RateLimitConfig,
  type RateLimitResult,
} from './infra/rate-limit-redis';

// Re-export commonly used types for convenience
export type { UserId, TenantId, AuditAction } from '@firm/types';
