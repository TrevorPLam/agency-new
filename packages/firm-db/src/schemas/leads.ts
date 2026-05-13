import { pgTable, uuid, text, timestamp, integer, jsonb, index, uniqueIndex, decimal, boolean } from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

/**
 * Leads table - Customer leads and prospects
 * 
 * This table stores lead information from various sources.
 * Each lead is scoped to a tenant for multi-tenancy.
 */
export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  
  // Basic information
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  company: text('company'),
  website: text('website'),
  
  // Lead source and attribution
  source: text('source').notNull().$type<'form' | 'import' | 'manual' | 'api' | 'webhook'>(),
  sourceDetails: jsonb('source_details').$type<Record<string, unknown>>(),
  referrer: text('referrer'),
  utmSource: text('utm_source'),
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),
  utmTerm: text('utm_term'),
  utmContent: text('utm_content'),
  
  // Lead management
  status: text('status').notNull().default('new').$type<'new' | 'contacted' | 'qualified' | 'converted' | 'lost'>(),
  score: integer('score').notNull().default(0),
  value: decimal('value', { precision: 10, scale: 2 }),
  currency: text('currency').default('USD'),
  
  // Categorization
  tags: jsonb('tags').$type<string[]>(),
  customFields: jsonb('custom_fields').$type<Record<string, unknown>>(),
  
  // Duplicate handling
  duplicateOf: uuid('duplicate_of').references(() => leads.id),
  isDuplicate: boolean('is_duplicate').notNull().default(false),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  firstContactedAt: timestamp('first_contacted_at', { withTimezone: true }),
  lastContactedAt: timestamp('last_contacted_at', { withTimezone: true }),
  
  // Soft delete
  deletedAt: timestamp('deleted_at', { withTimezone: true })
}, (table) => ({
  tenantIdIdx: index('idx_leads_tenant_id').on(table.tenantId),
  emailIdx: index('idx_leads_email').on(table.email),
  statusIdx: index('idx_leads_status').on(table.status),
  scoreIdx: index('idx_leads_score').on(table.score),
  sourceIdx: index('idx_leads_source').on(table.source),
  createdAtIdx: index('idx_leads_created_at').on(table.createdAt),
  duplicateOfIdx: index('idx_leads_duplicate_of').on(table.duplicateOf),
  uniqueTenantEmail: uniqueIndex('idx_leads_tenant_email_unique').on(table.tenantId, table.email),
  // Regular index for text fields (simplified for compatibility)
  fullTextSearchIdx: index('idx_leads_full_text_search').on(table.firstName, table.lastName, table.email, table.company)
}))

export type Lead = typeof leads.$inferSelect
export type NewLead = typeof leads.$inferInsert

/**
 * Lead activities and interactions
 * 
 * This table tracks all interactions with leads.
 */
export const leadActivities = pgTable('lead_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  
  // Activity details
  type: text('type').notNull().$type<'note' | 'call' | 'email' | 'meeting' | 'task' | 'status_change'>(),
  title: text('title').notNull(),
  description: text('description'),
  
  // Activity metadata
  direction: text('direction').$type<'inbound' | 'outbound'>(),
  duration: integer('duration'), // in minutes for calls/meetings
  
  // Status and outcome
  status: text('status').notNull().default('completed').$type<'pending' | 'completed' | 'cancelled'>(),
  outcome: text('outcome').$type<'positive' | 'negative' | 'neutral'>(),
  
  // User assignment
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  
  // Attachments and links
  attachments: jsonb('attachments').$type<Array<{
    id: string
    name: string
    url: string
    type: string
    size: number
  }>>(),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true })
}, (table) => ({
  tenantIdIdx: index('idx_lead_activities_tenant_id').on(table.tenantId),
  leadIdIdx: index('idx_lead_activities_lead_id').on(table.leadId),
  userIdIdx: index('idx_lead_activities_user_id').on(table.userId),
  typeIdx: index('idx_lead_activities_type').on(table.type),
  createdAtIdx: index('idx_lead_activities_created_at').on(table.createdAt),
  scheduledForIdx: index('idx_lead_activities_scheduled_for').on(table.scheduledFor)
}))

export type LeadActivity = typeof leadActivities.$inferSelect
export type NewLeadActivity = typeof leadActivities.$inferInsert

/**
 * Lead relations
 */
export const leadsRelations = relations(leads, ({ many, one }) => ({
  activities: many(leadActivities),
  duplicateLead: one(leads, {
    fields: [leads.duplicateOf],
    references: [leads.id],
    relationName: 'duplicateLead'
  }),
  duplicates: many(leads, {
    relationName: 'duplicates'
  }),
  crmSyncJobs: many(crmSyncJobs)
}))

/**
 * Lead activity relations
 */
export const leadActivitiesRelations = relations(leadActivities, ({ one }) => ({
  lead: one(leads, {
    fields: [leadActivities.leadId],
    references: [leads.id]
  }),
  user: one(users, {
    fields: [leadActivities.userId],
    references: [users.id]
  }),
  tenant: one(tenants, {
    fields: [leadActivities.tenantId],
    references: [tenants.id]
  })
}))

/**
 * Import other schemas
 */
import { tenants } from './tenants'
import { users } from './users'
import { crmSyncJobs } from './crm-sync-jobs'
