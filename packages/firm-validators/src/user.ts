/**
 * User schema validation
 * Provides comprehensive validation for user data with role and permission validation
 */

import { z } from 'zod';
import type { User, UserStatus, UserId, TenantId } from '@firm/types';
import {
  userIdField,
  tenantIdField,
  nameField,
  emailField,
  phoneField,
  textField,
  optionalTextField,
  enumField,
  arrayField,
  optionalArrayField,
  objectField,
  optionalObjectField,
  timestampField,
  metadataField,
  booleanField,
  optionalBooleanField,
  uuidField,
  numberField,
  urlField,
} from './common';

// User Role schema
const userRoleSchema = objectField({
  id: uuidField('Role ID'),
  name: textField('Role name', 1, 100),
  description: optionalTextField('Role description', 500),
  isSystem: booleanField('Is system role', false),
  permissions: arrayField(
    objectField({
      category: enumField(['tenant', 'user', 'lead', 'campaign', 'booking', 'invoice', 'analytics', 'settings', 'admin'] as const, 'Permission category'),
      action: textField('Permission action', 1, 100),
      resource: textField('Permission resource', 1, 100),
      conditions: metadataField(),
    }, 'Permission'),
    'Permissions',
    0,
    100
  ),
}, 'User role');

// User Preferences schema
const userPreferencesSchema = objectField({
  timezone: enumField(['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Australia/Sydney'] as const, 'Timezone'),
  language: enumField(['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'sv', 'da', 'no'] as const, 'Language'),
  theme: enumField(['light', 'dark', 'system'] as const, 'Theme'),
  notifications: objectField({
    email: objectField({
      info: booleanField('Email notifications - info', true),
      success: booleanField('Email notifications - success', true),
      warning: booleanField('Email notifications - warning', true),
      error: booleanField('Email notifications - error', true),
      alert: booleanField('Email notifications - alert', true),
    }, 'Email notifications'),
    push: objectField({
      info: booleanField('Push notifications - info', true),
      success: booleanField('Push notifications - success', true),
      warning: booleanField('Push notifications - warning', true),
      error: booleanField('Push notifications - error', true),
      alert: booleanField('Push notifications - alert', true),
    }, 'Push notifications'),
    sms: objectField({
      info: booleanField('SMS notifications - info', false),
      success: booleanField('SMS notifications - success', false),
      warning: booleanField('SMS notifications - warning', false),
      error: booleanField('SMS notifications - error', true),
      alert: booleanField('SMS notifications - alert', true),
    }, 'SMS notifications'),
  }, 'Notification preferences'),
  dashboard: objectField({
    layout: optionalTextField('Dashboard layout', 50),
    widgets: arrayField(
      objectField({
        id: textField('Widget ID', 1, 50),
        type: textField('Widget type', 1, 50),
        position: objectField({
          x: numberField('Widget X position', 0),
          y: numberField('Widget Y position', 0),
          w: numberField('Widget width', 1),
          h: numberField('Widget height', 1),
        }, 'Widget position'),
        config: metadataField(),
      }, 'Dashboard widget'),
      'Dashboard widgets',
      0,
      20
    ),
    defaultTimePeriod: enumField(['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_quarter', 'last_quarter', 'this_year', 'last_year', 'custom'] as const, 'Default time period'),
  }, 'Dashboard preferences'),
}, 'User preferences');

// User schema
export const userSchema = objectField({
  id: userIdField(),
  tenantId: tenantIdField(),
  email: emailField('Email'),
  firstName: nameField('First name'),
  lastName: nameField('Last name'),
  role: textField('Role', 1, 100),
  status: enumField(['active', 'inactive', 'suspended', 'pending', 'invited'] as const, 'Status'),
  permissions: arrayField(
    objectField({
      category: enumField(['tenant', 'user', 'lead', 'campaign', 'booking', 'invoice', 'analytics', 'settings', 'admin'] as const, 'Permission category'),
      action: textField('Permission action', 1, 100),
      resource: textField('Permission resource', 1, 100),
      conditions: metadataField(),
    }, 'Permission'),
    'Permissions',
    0,
    100
  ),
  lastLoginAt: timestampField('Last login at').optional(),
  emailVerified: booleanField('Email verified', false),
  phone: phoneField('Phone number').optional(),
  phoneVerified: booleanField('Phone verified', false),
  avatar: urlField('Avatar URL').optional(),
  preferences: userPreferencesSchema,
  metadata: metadataField(),
  createdAt: timestampField('Created at'),
  updatedAt: timestampField('Updated at'),
}, 'User');

// Enhanced user schema with business validation
export const userSchemaWithValidation = userSchema
  .superRefine((data, ctx) => {
    // Business validation rules
    
    // Email domain validation for tenant
    if (data.email && data.tenantId) {
      // This would typically be checked against tenant domain
      const emailDomain = data.email.split('@')[1]?.toLowerCase();
      // Skip validation for now - would need tenant data
    }
    
    // Phone validation for country
    if (data.phone && data.preferences?.timezone) {
      // Basic validation based on timezone
      const usTimezones = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'];
      const euTimezones = ['Europe/London', 'Europe/Paris', 'Europe/Berlin'];
      
      if (usTimezones.includes(data.preferences.timezone) && !data.phone.startsWith('+1')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Phone number should start with +1 for US timezone',
          path: ['phone'],
        });
      }
    }
    
    // Role validation against permissions
    if (data.role && data.permissions.length > 0) {
      // Admin role should have all admin permissions
      const isAdmin = data.role.toLowerCase().includes('admin');
      const hasAdminPermissions = data.permissions.some(p => 
        p.category === 'admin' && p.action.includes('all')
      );
      
      if (isAdmin && !hasAdminPermissions) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Admin role requires admin permissions',
          path: ['permissions'],
        });
      }
    }
    
    // Avatar validation
    if (data.avatar) {
      // Check if avatar URL is valid image format
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      const hasValidExtension = imageExtensions.some(ext => 
        data.avatar.toLowerCase().includes(ext)
      );
      
      if (!hasValidExtension) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Avatar URL must point to a valid image file',
          path: ['avatar'],
        });
      }
    }
    
    // Status validation
    if (data.status === 'active' && !data.emailVerified) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Active users must have verified email',
        path: ['emailVerified'],
      });
    }
    
    if (data.status === 'suspended' && data.lastLoginAt) {
      const suspensionTime = new Date();
      const lastLogin = new Date(data.lastLoginAt);
      const daysSinceLastLogin = (suspensionTime.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLastLogin > 30) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Cannot suspend user who logged in within last 30 days',
          path: ['status'],
        });
      }
    }
  })
  .transform((data) => {
    // Auto-derive permissions from role if not provided
    if (data.role && data.permissions.length === 0) {
      const rolePermissions = getRolePermissions(data.role);
      data.permissions = rolePermissions;
    }
    
    // Set default preferences if not provided
    if (!data.preferences) {
      data.preferences = {
        timezone: 'UTC',
        language: 'en',
        theme: 'system',
        notifications: {
          email: {
            info: true,
            success: true,
            warning: true,
            error: true,
            alert: true,
          },
          push: {
            info: true,
            success: true,
            warning: true,
            error: true,
            alert: true,
          },
          sms: {
            info: false,
            success: false,
            warning: false,
            error: true,
            alert: true,
          },
        },
        dashboard: {
          layout: 'default',
          widgets: [],
          defaultTimePeriod: 'this_month',
        },
      };
    }
    
    return data;
  });

// Helper function to get permissions based on role
function getRolePermissions(role: string) {
  const rolePermissions = {
    'admin': [
      { category: 'admin' as const, action: 'all', resource: 'all', conditions: {} },
      { category: 'tenant' as const, action: 'all', resource: 'all', conditions: {} },
      { category: 'user' as const, action: 'all', resource: 'all', conditions: {} },
      { category: 'lead' as const, action: 'all', resource: 'all', conditions: {} },
      { category: 'campaign' as const, action: 'all', resource: 'all', conditions: {} },
      { category: 'booking' as const, action: 'all', resource: 'all', conditions: {} },
      { category: 'invoice' as const, action: 'all', resource: 'all', conditions: {} },
      { category: 'analytics' as const, action: 'all', resource: 'all', conditions: {} },
      { category: 'settings' as const, action: 'all', resource: 'all', conditions: {} },
    ],
    'manager': [
      { category: 'lead' as const, action: 'all', resource: 'all', conditions: {} },
      { category: 'campaign' as const, action: 'all', resource: 'all', conditions: {} },
      { category: 'booking' as const, action: 'all', resource: 'all', conditions: {} },
      { category: 'invoice' as const, action: 'read', resource: 'all', conditions: {} },
      { category: 'analytics' as const, action: 'read', resource: 'all', conditions: {} },
    ],
    'agent': [
      { category: 'lead' as const, action: 'read', resource: 'own', conditions: {} },
      { category: 'lead' as const, action: 'update', resource: 'own', conditions: {} },
      { category: 'campaign' as const, action: 'read', resource: 'own', conditions: {} },
      { category: 'booking' as const, action: 'read', resource: 'own', conditions: {} },
      { category: 'booking' as const, action: 'update', resource: 'own', conditions: {} },
    ],
    'viewer': [
      { category: 'lead' as const, action: 'read', resource: 'own', conditions: {} },
      { category: 'campaign' as const, action: 'read', resource: 'own', conditions: {} },
      { category: 'booking' as const, action: 'read', resource: 'own', conditions: {} },
    ],
  };
  
  return rolePermissions[role.toLowerCase()] || [];
}

// Type assertions
export type UserInput = z.infer<typeof userSchema>;
export type UserInputWithValidation = z.infer<typeof userSchemaWithValidation>;

// Runtime validation functions
export const validateUser = (data: unknown) => userSchema.safeParse(data);
export const validateUserWithValidation = (data: unknown) => userSchemaWithValidation.safeParse(data);

// Compile-time validation
export const userSchemaSatisfies = userSchema satisfies z.ZodType<User>;
