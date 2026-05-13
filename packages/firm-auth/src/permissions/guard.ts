/**
 * Permission guard functions for Firm Platform
 * 
 * Implements requirePermission() and hasPermission() functions
 * that use the RBAC permission matrix as the single source of truth.
 * 
 * These functions provide runtime permission checking with proper
 * error handling and audit logging.
 */

import type { SessionContext } from '../session/types';
import { 
  hasPermission as hasPermissionFromMatrix,
  canImpersonate,
  canDelegate,
  isValidPermission,
  Role,
  Permission
} from './matrix';
import type { PermissionCategory } from '@firm/types';

// Permission check results
export interface PermissionCheckResult {
  granted: boolean;
  reason?: string;
  requiredPermission?: string;
  userRole?: string;
  userPermissions?: string[];
}

export interface PermissionGuardOptions {
  // Resource context for fine-grained permissions
  resourceId?: string;
  resourceOwnerId?: string;
  tenantId?: string;
  
  // Allow self-access (users can access their own resources)
  allowSelf?: boolean;
  
  // Require tenant membership
  requireTenantMembership?: boolean;
  
  // Audit logging
  auditAction?: string;
  auditContext?: Record<string, any>;
}

/**
 * Checks if a user has a specific permission
 * 
 * This is the core permission checking function that uses the RBAC matrix.
 * It supports role-based permissions, user-specific permissions, and wildcards.
 */
export function hasPermission(
  session: SessionContext | null,
  requiredPermission: string,
  options: PermissionGuardOptions = {}
): PermissionCheckResult {
  // No session means no permissions
  if (!session || !session.isAuthenticated) {
    return {
      granted: false,
      reason: 'not_authenticated',
      requiredPermission,
    };
  }

  // Validate permission format
  if (!isValidPermission(requiredPermission)) {
    return {
      granted: false,
      reason: 'invalid_permission_format',
      requiredPermission,
      userRole: session.role,
      userPermissions: session.permissions,
    };
  }

  const {
    resourceId,
    resourceOwnerId,
    tenantId,
    allowSelf = false,
    requireTenantMembership = true,
    auditAction,
    auditContext,
  } = options;

  // Check tenant membership if required
  if (requireTenantMembership && tenantId && session.tenantId.toString() !== tenantId) {
    return {
      granted: false,
      reason: 'wrong_tenant',
      requiredPermission,
      userRole: session.role,
      userPermissions: session.permissions,
    };
  }

  // Allow self-access if enabled
  if (allowSelf && resourceOwnerId && session.userId.toString() === resourceOwnerId) {
    // For self-access, we only need basic read permissions
    const [category, action] = requiredPermission.split(':');
    if (action === 'read' || action === 'update') {
      return {
        granted: true,
        requiredPermission,
        userRole: session.role,
        userPermissions: session.permissions,
      };
    }
  }

  // Check permission using matrix
  const hasRolePermission = hasPermissionFromMatrix(
    session.role as Role,
    session.permissions,
    requiredPermission as Permission
  );

  if (!hasRolePermission) {
    return {
      granted: false,
      reason: 'permission_denied',
      requiredPermission,
      userRole: session.role,
      userPermissions: session.permissions,
    };
  }

  // Permission granted
  return {
    granted: true,
    requiredPermission,
    userRole: session.role,
    userPermissions: session.permissions,
  };
}

/**
 * Requires a specific permission and throws if not granted
 * 
 * This is the guard function that should be used in application code
 * to protect routes and operations.
 */
export function requirePermission(
  session: SessionContext | null,
  requiredPermission: string,
  options: PermissionGuardOptions = {}
): asserts session is SessionContext {
  const result = hasPermission(session, requiredPermission, options);
  
  if (!result.granted) {
    const error = new PermissionError(
      `Permission denied: ${requiredPermission}`,
      result.reason || 'unknown',
      result
    );
    
    // Log audit event if configured
    if (options.auditAction) {
      logPermissionDenied(session, requiredPermission, options, result);
    }
    
    throw error;
  }
  
  // Log audit event if configured
  if (options.auditAction && session) {
    logPermissionGranted(session, requiredPermission, options);
  }
}

/**
 * Checks multiple permissions (AND logic - all must be granted)
 */
export function hasAllPermissions(
  session: SessionContext | null,
  requiredPermissions: string[],
  options: PermissionGuardOptions = {}
): PermissionCheckResult {
  for (const permission of requiredPermissions) {
    const result = hasPermission(session, permission, options);
    if (!result.granted) {
      return result;
    }
  }
  
  return {
    granted: true,
    requiredPermission: requiredPermissions.join(', '),
    userRole: session?.role,
    userPermissions: session?.permissions,
  };
}

/**
 * Checks multiple permissions (OR logic - any one must be granted)
 */
export function hasAnyPermission(
  session: SessionContext | null,
  requiredPermissions: string[],
  options: PermissionGuardOptions = {}
): PermissionCheckResult {
  const failedResults: PermissionCheckResult[] = [];
  
  for (const permission of requiredPermissions) {
    const result = hasPermission(session, permission, options);
    if (result.granted) {
      return result;
    }
    failedResults.push(result);
  }
  
  // Return the first failed result
  return failedResults[0] || {
    granted: false,
    reason: 'no_permissions_checked',
  };
}

/**
 * Checks if user can perform action on specific resource
 */
export function canAccessResource(
  session: SessionContext | null,
  action: string,
  category: PermissionCategory,
  resourceOwnerId?: string,
  options: Omit<PermissionGuardOptions, 'resourceOwnerId'> = {}
): PermissionCheckResult {
  const permission = `${category}:${action}`;
  
  return hasPermission(session, permission, {
    ...options,
    resourceOwnerId,
    allowSelf: true, // Enable self-access by default
  });
}

/**
 * Checks if user can impersonate another user
 */
export function checkImpersonationPermission(
  impersonatorSession: SessionContext,
  targetRole: string,
  targetUserId?: string
): PermissionCheckResult {
  // Check if impersonator has impersonate permission
  const hasImpersonatePermission = hasPermission(
    impersonatorSession,
    'user:impersonate'
  );
  
  if (!hasImpersonatePermission.granted) {
    return {
      granted: false,
      reason: 'no_impersonate_permission',
      userRole: impersonatorSession.role,
      userPermissions: impersonatorSession.permissions,
    };
  }
  
  // Check role hierarchy
  const canImpersonateRole = canImpersonate(
    impersonatorSession.role as Role,
    targetRole as Role
  );
  
  if (!canImpersonateRole) {
    return {
      granted: false,
      reason: 'cannot_impersonate_role',
      userRole: impersonatorSession.role,
      userPermissions: impersonatorSession.permissions,
    };
  }
  
  // Cannot impersonate yourself
  if (targetUserId && impersonatorSession.userId.toString() === targetUserId) {
    return {
      granted: false,
      reason: 'cannot_impersonate_self',
      userRole: impersonatorSession.role,
      userPermissions: impersonatorSession.permissions,
    };
  }
  
  return {
    granted: true,
    userRole: impersonatorSession.role,
    userPermissions: impersonatorSession.permissions,
  };
}

/**
 * Checks if user can delegate permissions to another user
 */
export function checkDelegationPermission(
  delegatorSession: SessionContext,
  delegateeRole: string,
  permission: string,
  delegateeUserId?: string
): PermissionCheckResult {
  // Check if delegator can delegate the specific permission
  const canDelegatePermission = canDelegate(
    delegatorSession.role as Role,
    delegateeRole as Role,
    permission as Permission
  );
  
  if (!canDelegatePermission) {
    return {
      granted: false,
      reason: 'cannot_delegate_permission',
      requiredPermission: permission,
      userRole: delegatorSession.role,
      userPermissions: delegatorSession.permissions,
    };
  }
  
  // Cannot delegate to yourself
  if (delegateeUserId && delegatorSession.userId.toString() === delegateeUserId) {
    return {
      granted: false,
      reason: 'cannot_delegate_self',
      requiredPermission: permission,
      userRole: delegatorSession.role,
      userPermissions: delegatorSession.permissions,
    };
  }
  
  return {
    granted: true,
    requiredPermission: permission,
    userRole: delegatorSession.role,
    userPermissions: delegatorSession.permissions,
  };
}

/**
 * Permission error class
 */
export class PermissionError extends Error {
  constructor(
    message: string,
    public reason: string,
    public checkResult: PermissionCheckResult
  ) {
    super(message);
    this.name = 'PermissionError';
  }
}

/**
 * Audit logging functions (placeholders)
 */
function logPermissionGranted(
  session: SessionContext,
  permission: string,
  options: PermissionGuardOptions
): void {
  // This would integrate with the audit logging system
  console.log(`Permission granted: ${permission} for user ${session.userId} (${session.role})`);
}

function logPermissionDenied(
  session: SessionContext | null,
  permission: string,
  options: PermissionGuardOptions,
  result: PermissionCheckResult
): void {
  // This would integrate with the audit logging system
  console.log(`Permission denied: ${permission} for user ${session?.userId} (${session?.role}) - ${result.reason}`);
}

/**
 * Middleware factory for route protection
 */
export function createPermissionGuard(
  requiredPermission: string,
  options: PermissionGuardOptions = {}
) {
  return (session: SessionContext | null) => {
    requirePermission(session, requiredPermission, options);
  };
}

/**
 * Higher-order function for protecting async operations
 */
export function withPermission<T extends any[], R>(
  requiredPermission: string,
  fn: (...args: T) => Promise<R>,
  options: PermissionGuardOptions = {}
) {
  return async (session: SessionContext | null, ...args: T): Promise<R> => {
    requirePermission(session, requiredPermission, options);
    return fn(...args);
  };
}

/**
 * Validates a permission string against the RBAC matrix
 * Re-exported from matrix for convenience in API key validation
 */
export { isValidPermission } from './matrix';
