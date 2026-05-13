import { pgTable, uuid, text, timestamp, jsonb, index, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

/**
 * Forms table - Dynamic form definitions
 * 
 * This table stores form configurations for lead capture.
 * Each form is scoped to a tenant for multi-tenancy.
 */
export const forms = pgTable('forms', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  
  // Basic information
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').notNull().$type<'contact' | 'lead' | 'quote' | 'appointment' | 'newsletter'>(),
  
  // Form configuration
  fields: jsonb('fields').notNull().$type<Array<{
    name: string
    type: string
    label: string
    required: boolean
    validation?: Record<string, unknown>
    options?: string[]
  }>>(),
  settings: jsonb('settings').$type<Record<string, unknown>>(),
  
  // Status and visibility
  isActive: boolean('is_active').notNull().default(true),
  isPublic: boolean('is_public').notNull().default(false),
  
  // Submission handling
  submitButtonText: text('submit_button_text').default('Submit'),
  successMessage: text('success_message'),
  redirectUrl: text('redirect_url'),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  
  // Soft delete
  deletedAt: timestamp('deleted_at', { withTimezone: true })
}, (table) => ({
  tenantIdIdx: index('idx_forms_tenant_id').on(table.tenantId),
  typeIdx: index('idx_forms_type').on(table.type),
  isActiveIdx: index('idx_forms_is_active').on(table.isActive),
  createdAtIdx: index('idx_forms_created_at').on(table.createdAt)
}))

export type Form = typeof forms.$inferSelect
export type NewForm = typeof forms.$inferInsert

/**
 * Form submissions table - Captured form data
 * 
 * This table stores all form submissions.
 */
export const formSubmissions = pgTable('form_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  formId: uuid('form_id').notNull().references(() => forms.id, { onDelete: 'cascade' }),
  
  // Submission data
  fields: jsonb('fields').notNull().$type<Record<string, unknown>>(),
  
  // Lead creation
  leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'set null' }),
  
  // Request context
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  referrer: text('referrer'),
  utmSource: text('utm_source'),
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),
  utmTerm: text('utm_term'),
  utmContent: text('utm_content'),
  
  // Consent
  consentMarketing: boolean('consent_marketing').default(false),
  consentAnalytics: boolean('consent_analytics').default(false),
  consentNecessary: boolean('consent_necessary').default(true),
  
  // Status
  status: text('status').notNull().default('success').$type<'success' | 'validation_failed' | 'spam' | 'blocked'>(),
  validationErrors: jsonb('validation_errors').$type<Array<{
    field: string
    message: string
    code: string
  }>>(),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  
  // Schema version
  schemaVersion: text('schema_version').notNull().default('1.0'),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  tenantIdIdx: index('idx_form_submissions_tenant_id').on(table.tenantId),
  formIdIdx: index('idx_form_submissions_form_id').on(table.formId),
  leadIdIdx: index('idx_form_submissions_lead_id').on(table.leadId),
  statusIdx: index('idx_form_submissions_status').on(table.status),
  createdAtIdx: index('idx_form_submissions_created_at').on(table.createdAt)
}))

export type FormSubmission = typeof formSubmissions.$inferSelect
export type NewFormSubmission = typeof formSubmissions.$inferInsert

/**
 * Form relations
 */
export const formsRelations = relations(forms, ({ many }) => ({
  submissions: many(formSubmissions)
}))

/**
 * Form submission relations
 */
export const formSubmissionsRelations = relations(formSubmissions, ({ one }) => ({
  form: one(forms, {
    fields: [formSubmissions.formId],
    references: [forms.id]
  }),
  lead: one(leads, {
    fields: [formSubmissions.leadId],
    references: [leads.id]
  }),
  tenant: one(tenants, {
    fields: [formSubmissions.tenantId],
    references: [tenants.id]
  })
}))

/**
 * Import other schemas
 */
import { tenants } from './tenants'
import { leads } from './leads'
