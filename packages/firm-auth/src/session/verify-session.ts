/**
 * Session verification wrapper around Better Auth
 * 
 * Implements decorator pattern around Better Auth verification methods.
 * Handles expiration, revocation, and MFA requirements.
 */

import type { 
  SessionContext, 
  SessionVerificationResult,
  SessionData 
} from './types';
import type { UserId, TenantId } from '@firm/types';
import { betterAuth } from './better-auth-instance';

/**
 * Verifies a session from cookie or bearer token
 */
export async function verifySession(
  token?: string
): Promise<SessionVerificationResult> {
  try {
    if (!token) {
      return { valid: false, error: 'invalid' };
    }

    // Verify with Better Auth
    const betterAuthResult = await betterAuth.session.validate(token);
    
    if (!betterAuthResult.session) {
      return { valid: false, error: 'invalid' };
    }

    // Check if session is expired
    if (betterAuthResult.session.expiresAt < new Date()) {
      await betterAuth.session.invalidate(betterAuthResult.session.id);
      return { valid: false, error: 'expired' };
    }

    // Check if session is revoked
    if (betterAuthResult.session.revoked) {
      return { valid: false, error: 'revoked' };
    }

    // Extract session data from Better Auth session
    const sessionData = betterAuthResult.session.data as SessionData;
    
    // Check MFA requirement
    if (!sessionData.mfaVerified) {
      return { valid: false, error: 'mfa_required' };
    }

    // Create SessionContext
    const sessionContext: SessionContext = Object.freeze({
      ...sessionData,
      isAuthenticated: true,
      isImpersonated: !!sessionData.impersonatedBy,
      isDelegated: !!sessionData.delegatedBy,
      lastAccessAt: new Date(), // Update access time
    });

    // Update last access time in Better Auth
    await betterAuth.session.update(betterAuthResult.session.id, {
      lastAccessAt: new Date(),
    });

    return { valid: true, session: sessionContext };

  } catch (error) {
    console.error('Session verification error:', error);
    return { valid: false, error: 'invalid' };
  }
}

/**
 * Verifies session without MFA check (for MFA verification flow)
 */
export async function verifySessionForMfa(
  token?: string
): Promise<SessionVerificationResult> {
  try {
    if (!token) {
      return { valid: false, error: 'invalid' };
    }

    const betterAuthResult = await betterAuth.session.validate(token);
    
    if (!betterAuthResult.session) {
      return { valid: false, error: 'invalid' };
    }

    if (betterAuthResult.session.expiresAt < new Date()) {
      await betterAuth.session.invalidate(betterAuthResult.session.id);
      return { valid: false, error: 'expired' };
    }

    if (betterAuthResult.session.revoked) {
      return { valid: false, error: 'revoked' };
    }

    const sessionData = betterAuthResult.session.data as SessionData;
    
    const sessionContext: SessionContext = Object.freeze({
      ...sessionData,
      isAuthenticated: true,
      isImpersonated: !!sessionData.impersonatedBy,
      isDelegated: !!sessionData.delegatedBy,
      lastAccessAt: new Date(),
    });

    return { valid: true, session: sessionContext };

  } catch (error) {
    console.error('Session verification error:', error);
    return { valid: false, error: 'invalid' };
  }
}

/**
 * Checks if a session exists and is valid (lightweight check)
 */
export async function checkSessionExists(
  token?: string
): Promise<boolean> {
  try {
    if (!token) {
      return false;
    }

    const betterAuthResult = await betterAuth.session.validate(token);
    return !!betterAuthResult.session && 
           !betterAuthResult.session.revoked &&
           betterAuthResult.session.expiresAt > new Date();
  } catch {
    return false;
  }
}

/**
 * Gets session data without validation (for debugging)
 */
export async function getSessionData(
  token: string
): Promise<SessionData | null> {
  try {
    const betterAuthResult = await betterAuth.session.validate(token);
    return betterAuthResult.session?.data as SessionData || null;
  } catch {
    return null;
  }
}

/**
 * Refreshes a session token
 */
export async function refreshSession(
  token: string
): Promise<SessionVerificationResult> {
  try {
    const betterAuthResult = await betterAuth.session.refresh(token);
    
    if (!betterAuthResult.session) {
      return { valid: false, error: 'invalid' };
    }

    const sessionData = betterAuthResult.session.data as SessionData;
    
    const sessionContext: SessionContext = Object.freeze({
      ...sessionData,
      isAuthenticated: true,
      isImpersonated: !!sessionData.impersonatedBy,
      isDelegated: !!sessionData.delegatedBy,
      lastAccessAt: new Date(),
    });

    return { valid: true, session: sessionContext };

  } catch (error) {
    console.error('Session refresh error:', error);
    return { valid: false, error: 'invalid' };
  }
}
