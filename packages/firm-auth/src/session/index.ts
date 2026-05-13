/**
 * Session management module for Firm Auth
 * 
 * Exports all session-related functionality as a unified interface.
 * This is a thin wrapper around Better Auth with additional security features.
 */

// Export shared Better Auth instance
export { betterAuth, sessionHandler } from './better-auth-instance';

// Export types
export type {
  SessionData,
  SessionContext,
  CreateSessionOptions,
  SessionVerificationResult,
  SessionRevocationOptions,
} from './types';

// Export session creation functions
export {
  createSession,
  createImpersonatedSession,
  createDelegatedSession,
  updateSessionAccess,
  extendSession,
} from './create-session';

// Export session verification functions
export {
  verifySession,
  verifySessionForMfa,
  checkSessionExists,
  getSessionData,
  refreshSession,
} from './verify-session';

// Export session revocation functions
export {
  revokeSession,
  revokeSessions,
  revokeExpiredSessions,
  revokeOlderThanSessions,
  getActiveSessionCount,
  getSessionInfo,
} from './revoke-session';
