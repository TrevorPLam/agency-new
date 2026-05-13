import { pgTable, uuid, text, timestamp, jsonb, index, decimal, integer } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

/**
 * Bookings table - Appointment and booking management
 * 
 * This table stores booking information for services.
 * Each booking is scoped to a tenant for multi-tenancy.
 * 
 * **Immutability:**
 * - Booking records should be treated as immutable snapshots
 * - Use the metadata field for storing change history rather than updating core fields
 * - For status changes, create audit records or use event sourcing patterns
 * - Customer and service information are captured at booking time and should not be updated
 * - This ensures accurate historical records and enables proper audit trails
 */
export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  
  // Basic information
  serviceId: uuid('service_id').notNull(),
  customerId: uuid('customer_id').notNull(),
  
  // Scheduling
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
  duration: integer('duration').notNull(), // in minutes
  
  // Status and management
  status: text('status').notNull().default('pending').$type<'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no-show'>(),
  notes: text('notes'),
  
  // Customer information
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  customerPhone: text('customer_phone'),
  
  // Service information
  serviceName: text('service_name').notNull(),
  servicePrice: decimal('service_price', { precision: 10, scale: 2 }),
  serviceCategory: text('service_category'),
  
  // Calendar integration
  calendarProvider: text('calendar_provider').$type<'calcom' | 'google' | 'outlook'>(),
  externalEventId: text('external_event_id'),
  
  // Metadata
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true })
}, (table) => ({
  tenantIdIdx: index('idx_bookings_tenant_id').on(table.tenantId),
  customerIdIdx: index('idx_bookings_customer_id').on(table.customerId),
  statusIdx: index('idx_bookings_status').on(table.status),
  startTimeIdx: index('idx_bookings_start_time').on(table.startTime),
  externalEventIdIdx: index('idx_bookings_external_event_id').on(table.externalEventId)
}))

export type Booking = typeof bookings.$inferSelect
export type NewBooking = typeof bookings.$inferInsert

/**
 * Booking relations
 */
export const bookingsRelations = relations(bookings, ({ one }) => ({
  tenant: one(tenants, {
    fields: [bookings.tenantId],
    references: [tenants.id]
  })
}))

/**
 * Import other schemas
 */
import { tenants } from './tenants'
