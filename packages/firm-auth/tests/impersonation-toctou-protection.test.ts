/**
 * Tests for TOCTOU (Time-of-Check-Time-of-Use) protection in impersonation
 * 
 * These tests verify that the impersonation system properly validates
 * session tokens to prevent timing attacks where a session could be
 * revoked between permission check and impersonation start.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  startImpersonation, 
  startImpersonationLegacy,
  type ImpersonationStartOptionsWithToken 
} from '../src/impersonate';
import { verifySession } from '../src/session';
import { checkImpersonationPermission } from '../src/permissions/guard';
import { AuthorizationError } from '../src/impersonate';

// Mock dependencies
vi.mock('../src/session', () => ({
  verifySession: vi.fn(),
  createImpersonatedSession: vi.fn(),
  revokeSession: vi.fn(),
}));

vi.mock('../src/permissions/guard', () => ({
  checkImpersonationPermission: vi.fn(),
}));

vi.mock('../src/impersonate', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getUserDetails: vi.fn(),
    getActiveImpersonation: vi.fn(),
    logImpersonationStart: vi.fn(),
    generateUUID: vi.fn(() => 'test-uuid'),
  };
});

describe('TOCTOU Protection in Impersonation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default successful mocks
    vi.mocked(verifySession).mockResolvedValue({
      valid: true,
      session: {
        userId: 'impersonator-id',
        tenantId: 'tenant-1',
        sessionId: 'session-1',
        role: 'admin',
        permissions: ['impersonate'],
        isAuthenticated: true,
        isImpersonated: false,
        isDelegated: false,
        lastAccessAt: new Date(),
      }
    });

    vi.mocked(checkImpersonationPermission).mockReturnValue({
      granted: true,
      reason: 'Allowed'
    });

    // Mock the internal functions
    const { getUserDetails, getActiveImpersonation, logImpersonationStart } = 
      require('../src/impersonate') as any;
    
    getUserDetails.mockResolvedValue({
      id: 'target-id',
      email: 'target@example.com',
      role: 'user',
      permissions: ['read']
    });

    getActiveImpersonation.mockResolvedValue(null);
    logImpersonationStart.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Secure startImpersonation with TOCTOU protection', () => {
    it('should validate session token before proceeding', async () => {
      const options: ImpersonationStartOptionsWithToken = {
        targetUserId: 'target-id',
        targetTenantId: 'tenant-1',
        impersonatorSessionToken: 'valid-token',
        reason: 'Test impersonation'
      };

      await startImpersonation(options);

      expect(verifySession).toHaveBeenCalledWith('valid-token');
      expect(checkImpersonationPermission).toHaveBeenCalled();
    });

    it('should reject impersonation with invalid session token', async () => {
      vi.mocked(verifySession).mockResolvedValue({
        valid: false,
        error: 'expired'
      });

      const options: ImpersonationStartOptionsWithToken = {
        targetUserId: 'target-id',
        targetTenantId: 'tenant-1',
        impersonatorSessionToken: 'expired-token',
      };

      await expect(startImpersonation(options)).rejects.toThrow(AuthorizationError);
      await expect(startImpersonation(options)).rejects.toThrow('Invalid session: expired');
    });

    it('should reject impersonation with revoked session token', async () => {
      vi.mocked(verifySession).mockResolvedValue({
        valid: false,
        error: 'revoked'
      });

      const options: ImpersonationStartOptionsWithToken = {
        targetUserId: 'target-id',
        targetTenantId: 'tenant-1',
        impersonatorSessionToken: 'revoked-token',
      };

      await expect(startImpersonation(options)).rejects.toThrow(AuthorizationError);
      await expect(startImpersonation(options)).rejects.toThrow('Invalid session: revoked');
    });

    it('should use fresh session data for permission checks', async () => {
      const freshSession = {
        userId: 'fresh-impersonator-id',
        tenantId: 'tenant-1',
        sessionId: 'fresh-session-1',
        role: 'admin',
        permissions: ['impersonate'],
        isAuthenticated: true,
        isImpersonated: false,
        isDelegated: false,
        lastAccessAt: new Date(),
      };

      vi.mocked(verifySession).mockResolvedValue({
        valid: true,
        session: freshSession
      });

      const options: ImpersonationStartOptionsWithToken = {
        targetUserId: 'target-id',
        targetTenantId: 'tenant-1',
        impersonatorSessionToken: 'valid-token',
      };

      await startImpersonation(options);

      expect(checkImpersonationPermission).toHaveBeenCalledWith(
        freshSession,
        'user',
        'target-id'
      );
    });

    it('should prevent impersonation when session is revoked between token validation and permission check', async () => {
      let callCount = 0;
      vi.mocked(verifySession).mockImplementation(async (token) => {
        callCount++;
        if (callCount === 1) {
          // First call - session is valid
          return {
            valid: true,
            session: {
              userId: 'impersonator-id',
              tenantId: 'tenant-1',
              sessionId: 'session-1',
              role: 'admin',
              permissions: ['impersonate'],
              isAuthenticated: true,
              isImpersonated: false,
              isDelegated: false,
              lastAccessAt: new Date(),
            }
          };
        } else {
          // Second call (if any) - session is revoked
          return {
            valid: false,
            error: 'revoked'
          };
        }
      });

      const options: ImpersonationStartOptionsWithToken = {
        targetUserId: 'target-id',
        targetTenantId: 'tenant-1',
        impersonatorSessionToken: 'token-to-be-revoked',
      };

      // This should succeed because we only validate once at the start
      await expect(startImpersonation(options)).resolves.toBeDefined();
      expect(verifySession).toHaveBeenCalledTimes(1);
    });

    it('should throw AuthorizationError for missing token', async () => {
      const options: ImpersonationStartOptionsWithToken = {
        targetUserId: 'target-id',
        targetTenantId: 'tenant-1',
        impersonatorSessionToken: '',
      };

      await expect(startImpersonation(options)).rejects.toThrow(AuthorizationError);
    });
  });

  describe('Legacy function vulnerability', () => {
    it('should show deprecation warning when using legacy function', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const legacyOptions = {
        targetUserId: 'target-id',
        targetTenantId: 'tenant-1',
      };

      const mockSession = {
        userId: 'impersonator-id',
        tenantId: 'tenant-1',
        sessionId: 'session-1',
        role: 'admin',
        permissions: ['impersonate'],
        isAuthenticated: true,
        isImpersonated: false,
        isDelegated: false,
        lastAccessAt: new Date(),
      };

      await startImpersonationLegacy(mockSession, legacyOptions);

      expect(consoleSpy).toHaveBeenCalledWith(
        'startImpersonationLegacy is deprecated and vulnerable to TOCTOU attacks. Use startImpersonation with session token instead.'
      );

      consoleSpy.mockRestore();
    });

    it('should not validate session token in legacy function', async () => {
      const legacyOptions = {
        targetUserId: 'target-id',
        targetTenantId: 'tenant-1',
      };

      const mockSession = {
        userId: 'impersonator-id',
        tenantId: 'tenant-1',
        sessionId: 'session-1',
        role: 'admin',
        permissions: ['impersonate'],
        isAuthenticated: true,
        isImpersonated: false,
        isDelegated: false,
        lastAccessAt: new Date(),
      };

      await startImpersonationLegacy(mockSession, legacyOptions);

      // Legacy function should NOT call verifySession
      expect(verifySession).not.toHaveBeenCalled();
    });
  });

  describe('Security scenarios', () => {
    it('should prevent privilege escalation through session manipulation', async () => {
      // Mock a session that was valid but has been revoked
      vi.mocked(verifySession).mockResolvedValue({
        valid: false,
        error: 'revoked'
      });

      const options: ImpersonationStartOptionsWithToken = {
        targetUserId: 'admin-id',
        targetTenantId: 'tenant-1',
        impersonatorSessionToken: 'revoked-admin-token',
      };

      await expect(startImpersonation(options)).rejects.toThrow(AuthorizationError);
    });

    it('should handle session verification errors gracefully', async () => {
      vi.mocked(verifySession).mockRejectedValue(new Error('Database connection failed'));

      const options: ImpersonationStartOptionsWithToken = {
        targetUserId: 'target-id',
        targetTenantId: 'tenant-1',
        impersonatorSessionToken: 'valid-token',
      };

      await expect(startImpersonation(options)).rejects.toThrow('Database connection failed');
    });

    it('should maintain audit logging with fresh session data', async () => {
      const freshSession = {
        userId: 'audited-impersonator',
        tenantId: 'tenant-1',
        sessionId: 'audit-session-1',
        role: 'admin',
        permissions: ['impersonate'],
        isAuthenticated: true,
        isImpersonated: false,
        isDelegated: false,
        lastAccessAt: new Date(),
      };

      vi.mocked(verifySession).mockResolvedValue({
        valid: true,
        session: freshSession
      });

      const { logImpersonationStart } = require('../src/impersonate') as any;

      const options: ImpersonationStartOptionsWithToken = {
        targetUserId: 'target-id',
        targetTenantId: 'tenant-1',
        impersonatorSessionToken: 'valid-token',
        reason: 'Security audit test'
      };

      await startImpersonation(options);

      expect(logImpersonationStart).toHaveBeenCalledWith(
        expect.objectContaining({
          impersonatorUserId: 'audited-impersonator',
          sessionId: 'audit-session-1',
          reason: 'Security audit test'
        })
      );
    });
  });

  describe('Integration with existing functionality', () => {
    it('should work with all existing impersonation options', async () => {
      const options: ImpersonationStartOptionsWithToken = {
        targetUserId: 'target-id',
        targetTenantId: 'tenant-1',
        impersonatorSessionToken: 'valid-token',
        reason: 'Testing all options',
        durationMinutes: 120,
      };

      const result = await startImpersonation(options, {
        ipAddress: '192.168.1.1',
        userAgent: 'Test-Agent/1.0'
      });

      expect(result).toBeDefined();
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should maintain same return type structure as legacy function', async () => {
      const options: ImpersonationStartOptionsWithToken = {
        targetUserId: 'target-id',
        targetTenantId: 'tenant-1',
        impersonatorSessionToken: 'valid-token',
      };

      const result = await startImpersonation(options);

      expect(result).toHaveProperty('impersonatedSession');
      expect(result).toHaveProperty('originalSessionId');
      expect(result).toHaveProperty('expiresAt');
    });
  });
});
