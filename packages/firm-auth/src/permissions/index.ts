/**
 * Permissions module for Firm Auth
 * 
 * Exports all permission-related functionality including the RBAC matrix
 * and permission guard functions.
 */

// Export RBAC matrix and types
export type {
  Role,
  Permission,
  PermissionAction,
} from './matrix';

export {
  PERMISSION_MATRIX,
  ROLE_HIERARCHY,
  hasPermission as hasPermissionFromMatrix,
  canImpersonate,
  canDelegate,
  isValidPermission,
  ALL_PERMISSIONS,
  PERMISSION_CATEGORIES,
} from './matrix';

// Export permission guard functions and types
export type {
  PermissionCheckResult,
  PermissionGuardOptions,
} from './guard';

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
} from './guard';
