import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

/**
 * CRM sync jobs table - External CRM synchronization
 * 
 * This table tracks sync jobs to external CRM systems.
 * Each job is scoped to a tenant for multi-tenancy.
 */
export const crmSyncJobs = pgTable('crm_sync_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  
  // Job details
  leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  crmProvider: text('crm_provider').notNull().$type<'gohighlevel' | 'hubspot' | 'salesforce' | 'pipedrive' | 'zoho'>(),
  syncType: text('sync_type').notNull().$type<'create' | 'update' | 'delete'>(),
  
  // Status and outcome
  status: text('status').notNull().default('pending').$type<'pending' | 'success' | 'failed' | 'retry'>(),
  externalId: text('external_id'),
  errorMessage: text('error_message'),
  errorCode: text('error_code'),
  
  // Retry logic
  retryCount: text('retry_count').$type<number>().default(0),
  maxRetries: text('max_retries').$type<number>().default(3),
  nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),
  
  // Request/response data
  requestData: jsonb('request_data').$type<Record<string, unknown>>(),
  responseData: jsonb('response_data').$type<Record<string, unknown>>(),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true })
}, (table) => ({
  tenantIdIdx: index('idx_crm_sync_jobs_tenant_id').on(table.tenantId),
  leadIdIdx: index('idx_crm_sync_jobs_lead_id').on(table.leadId),
  crmProviderIdx: index('idx_crm_sync_jobs_crm_provider').on(table.crmProvider),
  statusIdx: index('idx_crm_sync_jobs_status').on(table.status),
  nextRetryAtIdx: index('idx_crm_sync_jobs_next_retry_at').on(table.nextRetryAt),
  createdAtIdx: index('idx_crm_sync_jobs_created_at').on(table.createdAt)
}))

export type CrmSyncJob = typeof crmSyncJobs.$inferSelect
export type NewCrmSyncJob = typeof crmSyncJobs.$inferInsert

/**
 * CRM sync job relations
 */
export const crmSyncJobsRelations = relations(crmSyncJobs, ({ one }) => ({
  lead: one(leads, {
    fields: [crmSyncJobs.leadId],
    references: [leads.id]
  }),
  tenant: one(tenants, {
    fields: [crmSyncJobs.tenantId],
    references: [tenants.id]
  })
}))

/**
 * Import other schemas
 */
import { tenants } from './tenants'
import { leads } from './leads'
