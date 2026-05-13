/**
 * RBAC Permission Matrix for Firm Platform
 * 
 * This file defines the complete permission matrix for the platform.
 * It serves as the single source of truth for all authorization decisions.
 */

import type { PermissionCategory } from '@firm/types';

// Permission actions that can be performed on resources
export type PermissionAction = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'list'
  | 'export'
  | 'import'
  | 'approve'
  | 'reject'
  | 'manage'
  | 'impersonate'
  | 'delegate';

// Role definitions for the platform
export type Role = 
  | 'super_admin'    // Platform-wide admin
  | 'tenant_admin'   // Tenant-level admin
  | 'manager'        // Business manager
  | 'agent'          // Customer service agent
  | 'user'           // Regular user
  | 'read_only';     // Read-only access

// Permission format: category:action:resource?
export type Permission = string;

// Base permission matrix - defines what each role can do
export const PERMISSION_MATRIX: Record<Role, Permission[]> = {
  // Super Admin has all permissions across all tenants
  super_admin: [
    // Tenant management
    'tenant:create',
    'tenant:read',
    'tenant:update',
    'tenant:delete',
    'tenant:list',
    'tenant:manage',
    
    // User management
    'user:create',
    'user:read',
    'user:update',
    'user:delete',
    'user:list',
    'user:manage',
    'user:impersonate',
    
    // All other permissions
    'lead:create',
    'lead:read',
    'lead:update',
    'lead:delete',
    'lead:list',
    'lead:export',
    'lead:import',
    'lead:manage',
    
    'campaign:create',
    'campaign:read',
    'campaign:update',
    'campaign:delete',
    'campaign:list',
    'campaign:approve',
    'campaign:manage',
    
    'booking:create',
    'booking:read',
    'booking:update',
    'booking:delete',
    'booking:list',
    'booking:approve',
    'booking:manage',
    
    'invoice:create',
    'invoice:read',
    'invoice:update',
    'invoice:delete',
    'invoice:list',
    'invoice:approve',
    'invoice:manage',
    
    'analytics:read',
    'analytics:export',
    'analytics:manage',
    
    'settings:read',
    'settings:update',
    'settings:manage',
    
    'admin:create',
    'admin:read',
    'admin:update',
    'admin:delete',
    'admin:manage',
  ],

  // Tenant Admin manages their own tenant
  tenant_admin: [
    // User management within tenant
    'user:create',
    'user:read',
    'user:update',
    'user:delete',
    'user:list',
    'user:manage',
    
    // Lead management
    'lead:create',
    'lead:read',
    'lead:update',
    'lead:delete',
    'lead:list',
    'lead:export',
    'lead:import',
    'lead:manage',
    
    // Campaign management
    'campaign:create',
    'campaign:read',
    'campaign:update',
    'campaign:delete',
    'campaign:list',
    'campaign:approve',
    'campaign:manage',
    
    // Booking management
    'booking:create',
    'booking:read',
    'booking:update',
    'booking:delete',
    'booking:list',
    'booking:approve',
    'booking:manage',
    
    // Invoice management
    'invoice:create',
    'invoice:read',
    'invoice:update',
    'invoice:delete',
    'invoice:list',
    'invoice:approve',
    'invoice:manage',
    
    // Analytics and settings
    'analytics:read',
    'analytics:export',
    'settings:read',
    'settings:update',
  ],

  // Manager role with business oversight
  manager: [
    'user:read',
    'user:list',
    'user:update', // Limited to team members
    
    'lead:create',
    'lead:read',
    'lead:update',
    'lead:list',
    'lead:export',
    
    'campaign:create',
    'campaign:read',
    'campaign:update',
    'campaign:list',
    'campaign:approve',
    
    'booking:create',
    'booking:read',
    'booking:update',
    'booking:list',
    'booking:approve',
    
    'invoice:read',
    'invoice:list',
    'invoice:approve',
    
    'analytics:read',
    'analytics:export',
    
    'settings:read',
  ],

  // Agent role for customer service
  agent: [
    'user:read',
    
    'lead:create',
    'lead:read',
    'lead:update',
    'lead:list',
    
    'booking:create',
    'booking:read',
    'booking:update',
    'booking:list',
    
    'invoice:read',
    'invoice:list',
    
    'analytics:read',
  ],

  // Regular user with basic access
  user: [
    'user:read', // Self only
    'lead:read', // Assigned leads only
    'lead:update', // Assigned leads only
    'booking:read', // Own bookings only
    'booking:create', // Own bookings only
    'invoice:read', // Own invoices only
  ],

  // Read-only role
  read_only: [
    'user:read',
    'lead:read',
    'lead:list',
    'campaign:read',
    'campaign:list',
    'booking:read',
    'booking:list',
    'invoice:read',
    'invoice:list',
    'analytics:read',
    'settings:read',
  ],
};

/**
 * Role hierarchy mapping - defines superior roles for each role
 * 
 * Maps each role to an array of roles that are superior (higher in hierarchy).
 * Used for delegation and impersonation authorization checks.
 * 
 * Direction: KEY role -> ARRAY of superior roles
 * Example: manager -> ['tenant_admin', 'super_admin'] means tenant_admin and super_admin are superior to manager
 */
export const SUPERIOR_ROLE_MAP: Record<Role, Role[]> = {
  super_admin: [], // Highest level
  tenant_admin: ['super_admin'],
  manager: ['tenant_admin', 'super_admin'],
  agent: ['manager', 'tenant_admin', 'super_admin'],
  user: ['agent', 'manager', 'tenant_admin', 'super_admin'],
  read_only: ['user', 'agent', 'manager', 'tenant_admin', 'super_admin'],
};

// Permission checking utilities
export function hasPermission(
  userRole: Role,
  userPermissions: Permission[],
  requiredPermission: Permission
): boolean {
  // Check direct role permissions
  const rolePermissions = PERMISSION_MATRIX[userRole] || [];
  if (rolePermissions.includes(requiredPermission)) {
    return true;
  }

  // Check additional user-specific permissions
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  // Check wildcard permissions
  const [category, action] = requiredPermission.split(':') as [PermissionCategory, PermissionAction];
  const wildcardPermission = `${category}:*`;
  if (rolePermissions.includes(wildcardPermission as Permission) || 
      userPermissions.includes(wildcardPermission as Permission)) {
    return true;
  }

  return false;
}

export function canImpersonate(
  impersonatorRole: Role,
  targetRole: Role
): boolean {
  // Only super_admin and tenant_admin can impersonate
  if (!['super_admin', 'tenant_admin'].includes(impersonatorRole)) {
    return false;
  }

  // Super admin can impersonate anyone
  if (impersonatorRole === 'super_admin') {
    return true;
  }

  // Tenant admin can impersonate roles below them
  const canImpersonateRoles: Role[] = ['manager', 'agent', 'user', 'read_only'];
  return canImpersonateRoles.includes(targetRole);
}

export function canDelegate(
  delegatorRole: Role,
  delegateeRole: Role,
  permission: Permission
): boolean {
  // Only roles with manage permission can delegate
  const [category] = permission.split(':') as [PermissionCategory, PermissionAction];
  const managePermission = `${category}:manage` as Permission;
  
  return hasPermission(delegatorRole, [], managePermission) && 
         delegatorRole !== delegateeRole &&
         SUPERIOR_ROLE_MAP[delegatorRole].includes(delegateeRole);
}

// Permission validation
export function isValidPermission(permission: string): permission is Permission {
  const parts = permission.split(':');
  
  // Reject permissions with more than 2 segments
  if (parts.length !== 2) {
    return false;
  }
  
  const [category, action] = parts;
  
  const validCategories: PermissionCategory[] = [
    'tenant', 'user', 'lead', 'campaign', 'booking', 
    'invoice', 'analytics', 'settings', 'admin'
  ];
  
  const validActions: PermissionAction[] = [
    'create', 'read', 'update', 'delete', 'list', 'export', 
    'import', 'approve', 'reject', 'manage', 'impersonate', 'delegate'
  ];
  
  return validCategories.includes(category as PermissionCategory) &&
         validActions.includes(action as PermissionAction);
}

// Export permission matrix for reference and debugging
export const ALL_PERMISSIONS: Permission[] = [
  ...PERMISSION_MATRIX.super_admin,
  ...PERMISSION_MATRIX.tenant_admin,
  ...PERMISSION_MATRIX.manager,
  ...PERMISSION_MATRIX.agent,
  ...PERMISSION_MATRIX.user,
  ...PERMISSION_MATRIX.read_only,
].filter((permission, index, array) => array.indexOf(permission) === index); // Remove duplicates

export const PERMISSION_CATEGORIES = {
  tenant: ['create', 'read', 'update', 'delete', 'list', 'manage'],
  user: ['create', 'read', 'update', 'delete', 'list', 'manage', 'impersonate'],
  lead: ['create', 'read', 'update', 'delete', 'list', 'export', 'import', 'manage'],
  campaign: ['create', 'read', 'update', 'delete', 'list', 'approve', 'manage'],
  booking: ['create', 'read', 'update', 'delete', 'list', 'approve', 'manage'],
  invoice: ['create', 'read', 'update', 'delete', 'list', 'approve', 'manage'],
  analytics: ['read', 'export', 'manage'],
  settings: ['read', 'update', 'manage'],
  admin: ['create', 'read', 'update', 'delete', 'manage'],
} as const;
