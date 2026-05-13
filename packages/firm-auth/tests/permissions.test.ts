/**
 * Tests for permissions module
 * 
 * Tests RBAC matrix, permission guards, and role hierarchy.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  hasPermission as hasPermissionFromMatrix,
  canImpersonate,
  canDelegate,
  isValidPermission,
  PERMISSION_MATRIX,
  SUPERIOR_ROLE_MAP,
} from '../src/permissions/matrix';
import {
  hasPermission,
  requirePermission,
  hasAllPermissions,
  hasAnyPermission,
  canAccessResource,
  checkImpersonationPermission,
  checkDelegationPermission,
  PermissionError,
} from '../src/permissions/guard';
import type { SessionContext } from '../src/session/types';

describe('RBAC Matrix', () => {
  it('should have all required roles defined', () => {
    const expectedRoles = ['super_admin', 'tenant_admin', 'manager', 'agent', 'user', 'read_only'];
    const actualRoles = Object.keys(PERMISSION_MATRIX);
    
    expect(actualRoles).toEqual(expect.arrayContaining(expectedRoles));
    expect(actualRoles).toHaveLength(expectedRoles.length);
  });

  it('should have proper role hierarchy', () => {
    expect(SUPERIOR_ROLE_MAP.super_admin).toEqual([]);
    expect(SUPERIOR_ROLE_MAP.read_only).toEqual(['user', 'agent', 'manager', 'tenant_admin', 'super_admin']);
  });

  it('should validate permission format', () => {
    expect(isValidPermission('user:read')).toBe(true);
    expect(isValidPermission('tenant:create')).toBe(true);
    expect(isValidPermission('invalid:permission')).toBe(false);
    expect(isValidPermission('user')).toBe(false);
    expect(isValidPermission('user:read:extra')).toBe(false);
  });

  it('should check permissions from matrix correctly', () => {
    // Super admin should have all permissions
    expect(hasPermissionFromMatrix('super_admin', [], 'user:create')).toBe(true);
    expect(hasPermissionFromMatrix('super_admin', [], 'tenant:delete')).toBe(true);
    
    // Read only should only have read permissions
    expect(hasPermissionFromMatrix('read_only', [], 'user:read')).toBe(true);
    expect(hasPermissionFromMatrix('read_only', [], 'user:create')).toBe(false);
    
    // User should have limited permissions
    expect(hasPermissionFromMatrix('user', [], 'user:read')).toBe(true);
    expect(hasPermissionFromMatrix('user', [], 'user:create')).toBe(false);
  });

  it('should check impersonation permissions correctly', () => {
    expect(canImpersonate('super_admin', 'user')).toBe(true);
    expect(canImpersonate('tenant_admin', 'agent')).toBe(true);
    expect(canImpersonate('agent', 'user')).toBe(false);
    expect(canImpersonate('user', 'user')).toBe(false);
  });

  it('should check delegation permissions correctly', () => {
    expect(canDelegate('super_admin', 'tenant_admin', 'user:read')).toBe(true);
    expect(canDelegate('tenant_admin', 'manager', 'user:read')).toBe(true);
    expect(canDelegate('agent', 'user', 'user:read')).toBe(false);
  });
});

describe('Permission Guards', () => {
  let mockSession: SessionContext;
  let mockAdminSession: SessionContext;

  beforeEach(() => {
    mockSession = {
      userId: 'user-123' as any,
      tenantId: 'tenant-123' as any,
      email: 'user@example.com',
      role: 'user',
      permissions: ['user:read'],
      mfaVerified: true,
      isAuthenticated: true,
      isImpersonated: false,
      isDelegated: false,
      expiresAt: new Date(),
      createdAt: new Date(),
      lastAccessAt: new Date(),
    };

    mockAdminSession = {
      ...mockSession,
      role: 'super_admin',
      permissions: ['user:create', 'user:read', 'user:update', 'user:delete'],
    };
  });

  it('should check permissions correctly', () => {
    const result = hasPermission(mockSession, 'user:read');
    expect(result.granted).toBe(true);
    expect(result.reason).toBeUndefined();
    expect(result.userRole).toBe('user');
  });

  it('should deny permissions for unauthorized users', () => {
    const result = hasPermission(mockSession, 'user:create');
    expect(result.granted).toBe(false);
    expect(result.reason).toBe('permission_denied');
  });

  it('should handle unauthenticated users', () => {
    const result = hasPermission(null, 'user:read');
    expect(result.granted).toBe(false);
    expect(result.reason).toBe('not_authenticated');
  });

  it('should throw PermissionError when requirePermission fails', () => {
    expect(() => {
      requirePermission(mockSession, 'user:create');
    }).toThrow(PermissionError);
  });

  it('should not throw when requirePermission succeeds', () => {
    expect(() => {
      requirePermission(mockSession, 'user:read');
    }).not.toThrow();
  });

  it('should check all permissions correctly', () => {
    const result = hasAllPermissions(mockSession, ['user:read']);
    expect(result.granted).toBe(true);

    const result2 = hasAllPermissions(mockSession, ['user:read', 'user:create']);
    expect(result2.granted).toBe(false);
  });

  it('should check any permissions correctly', () => {
    const result = hasAnyPermission(mockSession, ['user:create', 'user:read']);
    expect(result.granted).toBe(true);

    const result2 = hasAnyPermission(mockSession, ['user:create', 'user:delete']);
    expect(result2.granted).toBe(false);
  });

  it('should check resource access correctly', () => {
    const result = canAccessResource(mockSession, 'read', 'user', 'user-123');
    expect(result.granted).toBe(true);

    const result2 = canAccessResource(mockSession, 'read', 'user', 'other-user-123');
    expect(result2.granted).toBe(true); // User can read any user info with basic permissions
  });

  it('should check impersonation permissions correctly', () => {
    const result = checkImpersonationPermission(mockAdminSession, 'user', 'user-456');
    expect(result.granted).toBe(true);

    const result2 = checkImpersonationPermission(mockSession, 'user', 'user-456');
    expect(result2.granted).toBe(false);
  });

  it('should prevent self-impersonation', () => {
    const result = checkImpersonationPermission(mockAdminSession, 'super_admin', 'user-123');
    expect(result.granted).toBe(false);
    expect(result.reason).toBe('cannot_impersonate_self');
  });

  it('should check delegation permissions correctly', () => {
    const result = checkDelegationPermission(mockAdminSession, 'user', 'user:read');
    expect(result.granted).toBe(true);

    const result2 = checkDelegationPermission(mockSession, 'user', 'user:read');
    expect(result2.granted).toBe(false);
  });

  it('should prevent self-delegation', () => {
    const result = checkDelegationPermission(mockAdminSession, 'super_admin', 'user:read', 'user-123');
    expect(result.granted).toBe(false);
    expect(result.reason).toBe('cannot_delegate_self');
  });

  describe('Delegation Role Hierarchy', () => {
    it('should allow higher role to delegate to lower role', () => {
      // Manager can delegate to agent
      const managerSession: SessionContext = {
        ...mockAdminSession,
        role: 'manager',
        permissions: PERMISSION_MATRIX.manager,
      };

      const result = canDelegate('manager', 'agent', 'user:manage');
      expect(result).toBe(true);

      // Tenant admin can delegate to manager
      const tenantAdminResult = canDelegate('tenant_admin', 'manager', 'user:manage');
      expect(tenantAdminResult).toBe(true);

      // Super admin can delegate to any role
      const superAdminResult = canDelegate('super_admin', 'read_only', 'tenant:manage');
      expect(superAdminResult).toBe(true);
    });

    it('should prevent lower role from delegating to higher role', () => {
      // Agent cannot delegate to manager (privilege escalation)
      const agentResult = canDelegate('agent', 'manager', 'user:read');
      expect(agentResult).toBe(false);

      // Manager cannot delegate to tenant admin (privilege escalation)
      const managerResult = canDelegate('manager', 'tenant_admin', 'lead:create');
      expect(managerResult).toBe(false);

      // User cannot delegate to agent (privilege escalation)
      const userResult = canDelegate('user', 'agent', 'booking:read');
      expect(userResult).toBe(false);

      // Read-only cannot delegate to regular user (privilege escalation)
      const readOnlyResult = canDelegate('read_only', 'user', 'campaign:read');
      expect(readOnlyResult).toBe(false);
    });

    it('should prevent delegation between same level roles', () => {
      // Agent cannot delegate to another agent
      const agentResult = canDelegate('agent', 'agent', 'user:read');
      expect(agentResult).toBe(false);

      // Manager cannot delegate to another manager
      const managerResult = canDelegate('manager', 'manager', 'lead:approve');
      expect(managerResult).toBe(false);
    });

    it('should require manage permission for delegation category', () => {
      // Manager has user:manage but not tenant:manage
      const canManageUser = canDelegate('manager', 'agent', 'user:read');
      expect(canManageUser).toBe(true);

      const cannotManageTenant = canDelegate('manager', 'agent', 'tenant:read');
      expect(cannotManageTenant).toBe(false);

      // Agent has no manage permissions
      const agentCannotManage = canDelegate('agent', 'user', 'user:read');
      expect(agentCannotManage).toBe(false);
    });
  });

  it('should handle tenant membership checks', () => {
    const result = hasPermission(mockSession, 'user:read', {
      requireTenantMembership: true,
      tenantId: 'different-tenant' as any,
    });
    expect(result.granted).toBe(false);
    expect(result.reason).toBe('wrong_tenant');
  });

  it('should allow self-access when enabled', () => {
    const result = hasPermission(mockSession, 'user:read', {
      allowSelf: true,
      resourceOwnerId: 'user-123',
    });
    expect(result.granted).toBe(true);
  });
});

describe('Permission Error', () => {
  it('should create PermissionError with correct properties', () => {
    const mockResult = {
      granted: false,
      reason: 'permission_denied',
      userRole: 'user',
      userPermissions: ['user:read'],
    };

    const error = new PermissionError('Test message', 'permission_denied', mockResult);
    
    expect(error.name).toBe('PermissionError');
    expect(error.message).toBe('Test message');
    expect(error.reason).toBe('permission_denied');
    expect(error.checkResult).toBe(mockResult);
  });
});
