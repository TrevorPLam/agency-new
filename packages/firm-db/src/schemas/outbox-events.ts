import { 
  pgTable, 
  uuid, 
  text, 
  timestamp, 
  jsonb, 
  integer,
  index
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

/**
 * Outbox Events Table
 * 
 * Implements the transactional outbox pattern for reliable event delivery.
 * Events are stored in this table within the same transaction as the business
 * operation, then processed by a separate worker that publishes them to
 * external systems (Inngest, webhooks, etc.).
 * 
 * This ensures that events are never lost if the application crashes after
 * a database write succeeds but before event publication completes.
 */
export const outboxEvents = pgTable(
  'outbox_events',
  {
    // Primary key
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Event metadata (CloudEvents specification)
    eventId: text('event_id').notNull().unique(),
    eventType: text('event_type').notNull(),
    eventSource: text('event_source').notNull(),
    eventSpecVersion: text('event_spec_version').notNull().default('1.0'),
    eventTime: timestamp('event_time', { withTimezone: true }).notNull(),
    dataContentType: text('data_content_type').notNull().default('application/json'),
    dataSchema: text('data_schema'),
    
    // Multi-tenant context
    tenantId: uuid('tenant_id').notNull(),
    
    // Event tracing
    correlationId: uuid('correlation_id'),
    causationId: uuid('causation_id'),
    eventVersion: text('event_version').notNull().default('1.0'),
    
    // Event payload
    eventData: jsonb('event_data').notNull(),
    
    // Processing metadata
    status: text('status').notNull().default('pending'), // pending, processing, completed, failed
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(3),
    lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }),
    errorMessage: text('error_message'),
    errorDetails: jsonb('error_details'),
    
    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => ({
    // Indexes for efficient querying
    pendingEventsIdx: index('outbox_events_pending_idx').on(table.status, table.nextAttemptAt),
    tenantEventsIdx: index('outbox_events_tenant_idx').on(table.tenantId, table.createdAt),
    eventTypeIdx: index('outbox_events_type_idx').on(table.eventType),
    eventIdIdx: index('outbox_events_event_id_idx').on(table.eventId),
    
    // Composite index for worker polling
    workerPollingIdx: index('outbox_events_worker_polling_idx').on(
      table.status, 
      table.nextAttemptAt, 
      table.tenantId
    ),
  })
)

/**
 * Relations for outbox events
 */
export const outboxEventsRelations = relations(outboxEvents, ({}) => ({
  // No foreign key relations - outbox is self-contained
}))

/**
 * Types for outbox events
 */
export type OutboxEvent = typeof outboxEvents.$inferSelect
export type NewOutboxEvent = typeof outboxEvents.$inferInsert

/**
 * Event status enum
 */
export const EVENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing', 
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const

export type EventStatus = typeof EVENT_STATUS[keyof typeof EVENT_STATUS]

/**
 * Default configuration for outbox events
 */
export const DEFAULT_OUTBOX_CONFIG = {
  maxAttempts: 3,
  initialRetryDelay: 1000, // 1 second
  maxRetryDelay: 300000, // 5 minutes
  retryBackoffMultiplier: 2,
} as const

/**
 * Helper function to create a new outbox event from a BaseEvent
 */
export function createOutboxEventFromBaseEvent(
  baseEvent: {
    id: string
    type: string
    source: string
    time: string | Date
    tenantId: string
    correlationId?: string
    causationId?: string
    version?: string
    dataSchema?: string
    dataContentType?: string
    data: unknown
  },
  options: {
    maxAttempts?: number
  } = {}
): NewOutboxEvent {
  const eventTime = typeof baseEvent.time === 'string' 
    ? new Date(baseEvent.time) 
    : baseEvent.time

  return {
    eventId: baseEvent.id,
    eventType: baseEvent.type,
    eventSource: baseEvent.source,
    eventSpecVersion: '1.0',
    eventTime,
    dataContentType: baseEvent.dataContentType || 'application/json',
    dataSchema: baseEvent.dataSchema,
    tenantId: baseEvent.tenantId,
    correlationId: baseEvent.correlationId,
    causationId: baseEvent.causationId,
    eventVersion: baseEvent.version || '1.0',
    eventData: baseEvent.data as Record<string, unknown>,
    status: EVENT_STATUS.PENDING,
    attempts: 0,
    maxAttempts: options.maxAttempts || DEFAULT_OUTBOX_CONFIG.maxAttempts,
    nextAttemptAt: new Date(), // Ready for immediate processing
  }
}
