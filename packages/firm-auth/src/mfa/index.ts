/**
 * MFA (Multi-Factor Authentication) module for Firm Auth
 * 
 * Exports all MFA related functionality including TOTP setup,
 * verification, and management functions.
 */

// Export types
export type {
  TotpSecret,
  TotpSetupOptions,
  TotpSetupResult,
  TotpVerificationResult,
  TotpBackupCode,
  MfaSession,
  MfaEnforcementOptions,
  MfaDeviceTrust,
} from './types';

// Export TOTP setup functions
export {
  setupTotp,
  verifyTotpSetup,
  disableTotp,
  regenerateBackupCodes,
} from './totp-setup';

// Export TOTP verification functions
export {
  verifyTotp,
  verifyBackupCode,
  isMfaRequired,
  getMfaStatus,
} from './totp-verify';
