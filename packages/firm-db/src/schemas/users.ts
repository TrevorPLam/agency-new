import { pgTable, uuid, text, timestamp, boolean, jsonb, index, uniqueIndex, primaryKey } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

/**
 * Users table - Platform users and tenant staff
 * 
 * This table stores user accounts that can access the platform.
 * Users can belong to multiple tenants with different roles.
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  name: text('name').notNull(),
  
  // Authentication
  passwordHash: text('password_hash'),
  
  // Multi-factor authentication
  mfaEnabled: boolean('mfa_enabled').notNull().default(false),
  mfaSecret: text('mfa_secret'),
  backupCodes: jsonb('backup_codes').$type<string[]>(),
  
  // Profile
  avatarUrl: text('avatar_url'),
  timezone: text('timezone').default('UTC'),
  locale: text('locale').default('en-US'),
  
  // Metadata
  preferences: jsonb('preferences').$type<Record<string, unknown>>(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  
  // Soft delete
  deletedAt: timestamp('deleted_at', { withTimezone: true })
}, (table) => ({
  emailIdx: index('idx_users_email').on(table.email),
  nameIdx: index('idx_users_name').on(table.name),
  emailVerifiedIdx: index('idx_users_email_verified').on(table.emailVerified)
}))

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

/**
 * User-tenant relationships - Many-to-many with roles
 * 
 * This join table defines which users have access to which tenants
 * and what roles they have in each tenant.
 */
export const userTenants = pgTable('user_tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  
  // Role-based access control
  role: text('role').notNull().$type<'owner' | 'admin' | 'manager' | 'staff' | 'viewer'>(),
  permissions: jsonb('permissions').$type<string[]>(),
  
  // Status
  isActive: boolean('is_active').notNull().default(true),
  invitedAt: timestamp('invited_at', { withTimezone: true }),
  joinedAt: timestamp('joined_at', { withTimezone: true }),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  userIdIdx: index('idx_user_tenants_user_id').on(table.userId),
  tenantIdIdx: index('idx_user_tenants_tenant_id').on(table.tenantId),
  roleIdx: index('idx_user_tenants_role').on(table.role),
  uniqueUserTenant: uniqueIndex('idx_user_tenants_unique').on(table.userId, table.tenantId)
}))

export type UserTenant = typeof userTenants.$inferSelect
export type NewUserTenant = typeof userTenants.$inferInsert

/**
 * API keys for programmatic access
 * 
 * This table stores API keys that can be used to access the platform
 * on behalf of a user within a specific tenant.
 */
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  
  // Key details
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull().unique(),
  keyPrefix: text('key_prefix').notNull(), // First 8 characters for identification
  
  // Permissions and scope
  permissions: jsonb('permissions').$type<string[]>(),
  scopes: jsonb('scopes').$type<string[]>(),
  
  // Usage limits
  rateLimitPerMinute: text('rate_limit_per_minute').$type<number>(),
  allowedIps: jsonb('allowed_ips').$type<string[]>(),
  
  // Status
  isActive: boolean('is_active').notNull().default(true),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  userIdIdx: index('idx_api_keys_user_id').on(table.userId),
  tenantIdIdx: index('idx_api_keys_tenant_id').on(table.tenantId),
  keyHashIdx: index('idx_api_keys_key_hash').on(table.keyHash),
  keyPrefixIdx: index('idx_api_keys_key_prefix').on(table.keyPrefix)
}))

export type ApiKey = typeof apiKeys.$inferSelect
export type NewApiKey = typeof apiKeys.$inferInsert

/**
 * User relations
 */
export const usersRelations = relations(users, ({ many }) => ({
  userTenants: many(userTenants),
  apiKeys: many(apiKeys),
  auditLogs: many(auditLogs)
}))

/**
 * User-tenant relations
 */
export const userTenantsRelations = relations(userTenants, ({ one }) => ({
  user: one(users, {
    fields: [userTenants.userId],
    references: [users.id]
  }),
  tenant: one(tenants, {
    fields: [userTenants.tenantId],
    references: [tenants.id]
  })
}))

/**
 * API key relations
 */
export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id]
  }),
  tenant: one(tenants, {
    fields: [apiKeys.tenantId],
    references: [tenants.id]
  })
}))

/**
 * Import other schemas
 */
import { tenants } from './tenants'
import { auditLogs } from './audit-logs'
