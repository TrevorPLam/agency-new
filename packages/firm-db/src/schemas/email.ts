import { pgTable, uuid, text, timestamp, jsonb, index, integer } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

/**
 * Email logs table - Email delivery tracking
 * 
 * This table tracks all emails sent through the platform.
 * Each email is scoped to a tenant for multi-tenancy.
 */
export const emailLogs = pgTable('email_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  
  // Email details
  to: text('to').notNull(),
  from: text('from').notNull(),
  subject: text('subject').notNull(),
  templateId: uuid('template_id'),
  
  // Provider information
  provider: text('provider').notNull().$type<'resend' | 'smtp' | 'sendgrid' | 'ses'>(),
  providerMessageId: text('provider_message_id'),
  
  // Email metadata
  category: text('category').$type<'transactional' | 'marketing' | 'notification'>(),
  attachments: jsonb('attachments').$type<Array<{
    filename: string
    contentType: string
    size: number
  }>>(),
  
  // Status and tracking
  status: text('status').notNull().default('pending').$type<'pending' | 'sent' | 'delivered' | 'bounced' | 'opened' | 'clicked'>(),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  openedAt: timestamp('opened_at', { withTimezone: true }),
  clickedAt: timestamp('clicked_at', { withTimezone: true }),
  bouncedAt: timestamp('bounced_at', { withTimezone: true }),
  bounceReason: text('bounce_reason'),
  
  // Context
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'set null' }),
  bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
  formSubmissionId: uuid('form_submission_id').references(() => formSubmissions.id, { onDelete: 'set null' }),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  tenantIdIdx: index('idx_email_logs_tenant_id').on(table.tenantId),
  providerIdx: index('idx_email_logs_provider').on(table.provider),
  statusIdx: index('idx_email_logs_status').on(table.status),
  userIdIdx: index('idx_email_logs_user_id').on(table.userId),
  leadIdIdx: index('idx_email_logs_lead_id').on(table.leadId),
  createdAtIdx: index('idx_email_logs_created_at').on(table.createdAt)
}))

export type EmailLog = typeof emailLogs.$inferSelect
export type NewEmailLog = typeof emailLogs.$inferInsert

/**
 * Email log relations
 */
export const emailLogsRelations = relations(emailLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [emailLogs.tenantId],
    references: [tenants.id]
  }),
  user: one(users, {
    fields: [emailLogs.userId],
    references: [users.id]
  }),
  lead: one(leads, {
    fields: [emailLogs.leadId],
    references: [leads.id]
  }),
  booking: one(bookings, {
    fields: [emailLogs.bookingId],
    references: [bookings.id]
  }),
  formSubmission: one(formSubmissions, {
    fields: [emailLogs.formSubmissionId],
    references: [formSubmissions.id]
  })
}))

/**
 * Import other schemas
 */
import { tenants } from './tenants'
import { users } from './users'
import { leads } from './leads'
import { bookings } from './bookings'
import { formSubmissions } from './forms'
