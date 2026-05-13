import { pgTable, uuid, text, timestamp, boolean, jsonb, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

/**
 * Tenants table - Multi-tenant isolation
 * 
 * This table stores tenant information and is the root of multi-tenancy.
 * All other tables reference this table via tenant_id for row-level security.
 */
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  domain: text('domain').unique(),
  status: text('status').notNull().default('active').$type<'active' | 'inactive' | 'suspended'>(),
  
  // Configuration
  settings: jsonb('settings').$type<Record<string, unknown>>(),
  features: jsonb('features').$type<Record<string, boolean>>(),
  
  // Metadata
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  
  // Soft delete
  deletedAt: timestamp('deleted_at', { withTimezone: true })
}, (table) => ({
  nameIdx: index('idx_tenants_name').on(table.name),
  slugIdx: index('idx_tenants_slug').on(table.slug),
  statusIdx: index('idx_tenants_status').on(table.status)
}))

export type Tenant = typeof tenants.$inferSelect
export type NewTenant = typeof tenants.$inferInsert

/**
 * Tenant relations
 */
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  leads: many(leads),
  forms: many(forms),
  bookings: many(bookings),
  emailLogs: many(emailLogs),
  crmSyncJobs: many(crmSyncJobs)
}))

/**
 * Import other schemas (will be defined in separate files)
 */
import { users } from './users'
import { leads } from './leads'
import { forms } from './forms'
import { bookings } from './bookings'
import { emailLogs } from './email'
import { crmSyncJobs } from './crm-sync-jobs'
