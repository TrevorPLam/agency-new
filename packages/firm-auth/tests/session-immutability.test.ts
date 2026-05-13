/**
 * Tests for session immutability (H4 Security Fix)
 * 
 * Verifies that session contexts are deeply frozen and cannot be mutated.
 * Tests the fix for shallow freeze vulnerability where permissions arrays remained mutable.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSession, createImpersonatedSession, createDelegatedSession } from '../src/session/create-session';

// Mock Better Auth instance
vi.mock('../src/session/better-auth-instance', () => ({
  betterAuth: {
    session: {
      create: vi.fn().mockResolvedValue({
        id: 'session-123',
        token: 'token-123',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }),
    },
  },
}));

describe('Session Immutability (H4 Security Fix)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createSession', () => {
    it('should deeply freeze session context', async () => {
      const permissions = ['read:own', 'write:own'];
      const session = await createSession({
        userId: 'user-123' as any,
        tenantId: 'tenant-123' as any,
        email: 'user@example.com',
        role: 'user',
        permissions,
      });

      // Top-level object should be frozen
      expect(Object.isFrozen(session)).toBe(true);

      // Permissions array should be frozen
      expect(Object.isFrozen(session.permissions)).toBe(true);

      // All properties should be read-only
      expect(() => {
        (session as any).permissions = ['admin'];
      }).toThrow();

      // Array mutations should fail
      expect(() => {
        session.permissions.push('admin');
      }).toThrow();

      expect(() => {
        session.permissions[0] = 'admin';
      }).toThrow();
    });

    it('should freeze nested objects in permissions', async () => {
      // Test with complex permission objects if they exist
      const complexPermissions = [
        { action: 'read', resource: 'own' },
        { action: 'write', resource: 'own' },
      ];
      
      const session = await createSession({
        userId: 'user-123' as any,
        tenantId: 'tenant-123' as any,
        email: 'user@example.com',
        role: 'user',
        permissions: complexPermissions as any,
      });

      // Permission objects should be frozen
      expect(Object.isFrozen(session.permissions[0])).toBe(true);
      expect(Object.isFrozen(session.permissions[1])).toBe(true);

      // Nested property mutations should fail
      expect(() => {
        (session.permissions[0] as any).action = 'admin';
      }).toThrow();
    });
  });

  describe('createImpersonatedSession', () => {
    it('should deeply freeze impersonated session context', async () => {
      const permissions = ['read:all', 'write:all'];
      const session = await createImpersonatedSession(
        'user-123' as any,
        'tenant-123' as any,
        'admin-123' as any,
        'user@example.com',
        'user',
        permissions
      );

      // Top-level object should be frozen
      expect(Object.isFrozen(session)).toBe(true);

      // Permissions array should be frozen
      expect(Object.isFrozen(session.permissions)).toBe(true);

      // Array mutations should fail
      expect(() => {
        session.permissions.push('admin');
      }).toThrow();

      // Impersonation metadata should be frozen
      expect(Object.isFrozen(session.impersonatedBy)).toBe(true);
    });
  });

  describe('createDelegatedSession', () => {
    it('should deeply freeze delegated session context', async () => {
      const permissions = ['read:delegated', 'write:delegated'];
      const delegationExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
      
      const session = await createDelegatedSession(
        'user-123' as any,
        'tenant-123' as any,
        'manager-123' as any,
        'user@example.com',
        'user',
        permissions,
        delegationExpiresAt
      );

      // Top-level object should be frozen
      expect(Object.isFrozen(session)).toBe(true);

      // Permissions array should be frozen
      expect(Object.isFrozen(session.permissions)).toBe(true);

      // Array mutations should fail
      expect(() => {
        session.permissions.push('admin');
      }).toThrow();

      // Delegation metadata should be frozen
      expect(Object.isFrozen(session.delegatedBy)).toBe(true);
    });
  });

  describe('Security Impact', () => {
    it('should prevent privilege escalation via permission mutation', async () => {
      const originalPermissions = ['read:own'];
      const session = await createSession({
        userId: 'user-123' as any,
        tenantId: 'tenant-123' as any,
        email: 'user@example.com',
        role: 'user',
        permissions: originalPermissions,
      });

      // Attempt to escalate privileges by modifying permissions
      try {
        session.permissions.push('admin:all');
        // If we reach here, the freeze failed
        expect.fail('Permissions array should be frozen');
      } catch (error) {
        // Expected - permissions should be immutable
        expect(session.permissions).toEqual(originalPermissions);
      }

      try {
        session.permissions[0] = 'admin:all';
        expect.fail('Permissions array elements should be frozen');
      } catch (error) {
        // Expected - individual permission elements should be immutable
        expect(session.permissions[0]).toBe('read:own');
      }
    });

    it('should prevent session metadata tampering', async () => {
      const session = await createSession({
        userId: 'user-123' as any,
        tenantId: 'tenant-123' as any,
        email: 'user@example.com',
        role: 'user',
        permissions: ['read:own'],
      });

      // Attempt to modify session metadata
      try {
        (session as any).role = 'admin';
        expect.fail('Session role should be frozen');
      } catch (error) {
        expect(session.role).toBe('user');
      }

      try {
        (session as any).isImpersonated = true;
        expect.fail('Session flags should be frozen');
      } catch (error) {
        expect(session.isImpersonated).toBe(false);
      }
    });
  });
});
