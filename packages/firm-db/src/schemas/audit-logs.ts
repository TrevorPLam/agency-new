import { pgTable, uuid, text, timestamp, jsonb, index, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

/**
 * Audit logs table - Comprehensive audit trail
 * 
 * This table tracks all important actions for compliance and security.
 * All entries are immutable and scoped to tenant.
 */
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  
  // Action details
  action: text('action').notNull(),
  resource: text('resource').notNull(),
  resourceId: uuid('resource_id'),
  
  // User context
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  apiKeyId: uuid('api_key_id').references(() => apiKeys.id, { onDelete: 'set null' }),
  
  // Request context
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  requestId: text('request_id'),
  
  // Changes and outcome
  oldValue: jsonb('old_value').$type<unknown>(),
  newValue: jsonb('new_value').$type<unknown>(),
  success: boolean('success').notNull().default(true),
  errorMessage: text('error_message'),
  
  // Captured fields
  capturedFields: jsonb('captured_fields').$type<Record<string, unknown>>(),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  tenantIdIdx: index('idx_audit_logs_tenant_id').on(table.tenantId),
  userIdIdx: index('idx_audit_logs_user_id').on(table.userId),
  actionIdx: index('idx_audit_logs_action').on(table.action),
  resourceIdx: index('idx_audit_logs_resource').on(table.resource),
  createdAtIdx: index('idx_audit_logs_created_at').on(table.createdAt)
}))

export type AuditLog = typeof auditLogs.$inferSelect
export type NewAuditLog = typeof auditLogs.$inferInsert

/**
 * Audit log relations
 */
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id]
  }),
  tenant: one(tenants, {
    fields: [auditLogs.tenantId],
    references: [tenants.id]
  }),
  apiKey: one(apiKeys, {
    fields: [auditLogs.apiKeyId],
    references: [apiKeys.id]
  })
}))

/**
 * Import other schemas
 */
import { tenants } from './tenants'
import { users } from './users'
import { apiKeys } from './users'
