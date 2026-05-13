import { pgTable, uuid, text, timestamp, jsonb, index, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

/**
 * Impersonation sessions table - Tracks active impersonations
 * 
 * This table stores impersonation sessions with proper audit trail
 * and security controls. Each impersonation has a defined duration.
 */
export const impersonationSessions = pgTable('impersonation_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  impersonatorUserId: uuid('impersonator_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  targetUserId: uuid('target_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull(),
  
  // Session details
  originalSessionId: text('original_session_id').notNull(),
  impersonatedSessionId: text('impersonated_session_id').notNull(),
  
  // Control and audit
  reason: text('reason'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  endedBy: uuid('ended_by').references(() => users.id, { onDelete: 'set null' }),
  
  // Usage tracking
  actionsCount: text('actions_count').notNull().default('0'),
  lastActionAt: timestamp('last_action_at', { withTimezone: true }),
  
  // Context
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  
  // Status
  isActive: boolean('is_active').notNull().default(true),
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  impersonatorIdx: index('idx_impersonation_sessions_impersonator').on(table.impersonatorUserId),
  targetIdx: index('idx_impersonation_sessions_target').on(table.targetUserId),
  tenantIdx: index('idx_impersonation_sessions_tenant').on(table.tenantId),
  originalSessionIdx: index('idx_impersonation_sessions_original_session').on(table.originalSessionId),
  isActiveIdx: index('idx_impersonation_sessions_is_active').on(table.isActive),
  endsAtIdx: index('idx_impersonation_sessions_ends_at').on(table.endsAt)
}))

export type ImpersonationSession = typeof impersonationSessions.$inferSelect
export type NewImpersonationSession = typeof impersonationSessions.$inferInsert

/**
 * Delegation grants table - Tracks active delegation grants
 * 
 * This table stores delegation grants with proper expiration
 * and usage tracking. Users can delegate specific permissions.
 */
export const delegationGrants = pgTable('delegation_grants', {
  id: uuid('id').primaryKey().defaultRandom(),
  delegatorUserId: uuid('delegator_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  delegateeUserId: uuid('delegatee_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull(),
  
  // Delegation details
  permissions: jsonb('permissions').notNull().$type<string[]>(),
  sessionId: text('session_id').notNull(),
  delegatedSessionId: text('delegated_session_id').notNull(),
  
  // Lifecycle
  grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  revokedBy: uuid('revoked_by').references(() => users.id, { onDelete: 'set null' }),
  
  // Usage tracking
  usageCount: text('usage_count').notNull().default('0'),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  
  // Context
  reason: text('reason'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  
  // Status
  isActive: boolean('is_active').notNull().default(true),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  delegatorIdx: index('idx_delegation_grants_delegator').on(table.delegatorUserId),
  delegateeIdx: index('idx_delegation_grants_delegatee').on(table.delegateeUserId),
  tenantIdx: index('idx_delegation_grants_tenant').on(table.tenantId),
  sessionIdIdx: index('idx_delegation_grants_session').on(table.sessionId),
  isActiveIdx: index('idx_delegation_grants_is_active').on(table.isActive),
  expiresAtIdx: index('idx_delegation_grants_expires_at').on(table.expiresAt)
}))

export type DelegationGrant = typeof delegationGrants.$inferSelect
export type NewDelegationGrant = typeof delegationGrants.$inferInsert

/**
 * Delegation usage logs table - Tracks delegation usage
 * 
 * This table logs each use of delegated permissions for audit purposes.
 */
export const delegationUsageLogs = pgTable('delegation_usage_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  delegationId: uuid('delegation_id').notNull().references(() => delegationGrants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull(),
  
  // Usage details
  permission: text('permission').notNull(),
  endpoint: text('endpoint').notNull(),
  method: text('method').notNull(),
  
  // Context
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  requestId: text('request_id'),
  
  // Result
  success: boolean('success').notNull().default(true),
  errorMessage: text('error_message'),
  
  // Timestamps
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  delegationIdx: index('idx_delegation_usage_logs_delegation').on(table.delegationId),
  userIdIdx: index('idx_delegation_usage_logs_user').on(table.userId),
  tenantIdx: index('idx_delegation_usage_logs_tenant').on(table.tenantId),
  permissionIdx: index('idx_delegation_usage_logs_permission').on(table.permission),
  timestampIdx: index('idx_delegation_usage_logs_timestamp').on(table.timestamp)
}))

export type DelegationUsageLog = typeof delegationUsageLogs.$inferSelect
export type NewDelegationUsageLog = typeof delegationUsageLogs.$inferInsert

/**
 * Relations
 */
export const impersonationSessionsRelations = relations(impersonationSessions, ({ one }) => ({
  impersonator: one(users, {
    fields: [impersonationSessions.impersonatorUserId],
    references: [users.id]
  }),
  target: one(users, {
    fields: [impersonationSessions.targetUserId],
    references: [users.id]
  }),
  endedByUser: one(users, {
    fields: [impersonationSessions.endedBy],
    references: [users.id]
  })
}))

export const delegationGrantsRelations = relations(delegationGrants, ({ one, many }) => ({
  delegator: one(users, {
    fields: [delegationGrants.delegatorUserId],
    references: [users.id]
  }),
  delegatee: one(users, {
    fields: [delegationGrants.delegateeUserId],
    references: [users.id]
  }),
  revokedByUser: one(users, {
    fields: [delegationGrants.revokedBy],
    references: [users.id]
  }),
  usageLogs: many(delegationUsageLogs)
}))

export const delegationUsageLogsRelations = relations(delegationUsageLogs, ({ one }) => ({
  delegation: one(delegationGrants, {
    fields: [delegationUsageLogs.delegationId],
    references: [delegationGrants.id]
  }),
  user: one(users, {
    fields: [delegationUsageLogs.userId],
    references: [users.id]
  })
}))
