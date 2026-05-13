import { sql, eq, and, lt, gte } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type { PgliteDatabase } from 'drizzle-orm/pglite'
import { randomUUID } from 'crypto'
import * as schema from '../schemas'
import type { OutboxEvent, NewOutboxEvent } from '../schemas'
import { EVENT_STATUS, DEFAULT_OUTBOX_CONFIG } from '../schemas/outbox-events'
import { createOutboxEventFromBaseEvent } from '../schemas/outbox-events'

// Generic database type that works with both Postgres and PgLite
export type Database = PostgresJsDatabase | PgliteDatabase

/**
 * Emit Event Helper
 * 
 * Inserts an event into the outbox table within the same transaction as the business operation.
 * This ensures reliable event delivery through the transactional outbox pattern.
 * 
 * The event will be processed by a separate worker that reads from the outbox,
 * publishes the event to external systems, and marks it as completed.
 */
export interface EmitEventOptions {
  /** Event data payload */
  data: Record<string, unknown>
  
  /** Event type identifier (e.g., 'lead.created', 'form.submitted') */
  type: string
  
  /** Event source identifier (e.g., 'firm.crm', 'firm.forms') */
  source: string
  
  /** Tenant UUID that owns this event */
  tenantId: string
  
  /** Correlation ID for distributed tracing */
  correlationId?: string
  
  /** Causation ID for event sourcing chains */
  causationId?: string
  
  /** Event schema version */
  version?: string
  
  /** JSON schema URL for data validation */
  dataSchema?: string
  
  /** Maximum retry attempts for this event */
  maxAttempts?: number
  
  /** Database transaction to use (optional) */
  tx?: Database
}

/**
 * Emit an event to the outbox table
 * 
 * This function should be called within the same transaction as the business operation
 * that triggered the event. If no transaction is provided, it will use the database directly.
 * 
 * @param db Database instance or transaction
 * @param options Event configuration options
 * @returns The created outbox event record
 */
export async function emitEvent(
  db: Database,
  options: EmitEventOptions
): Promise<OutboxEvent> {
  const eventId = randomUUID()
  const eventTime = new Date()
  
  const baseEvent = {
    id: eventId,
    type: options.type,
    source: options.source,
    time: eventTime,
    tenantId: options.tenantId,
    correlationId: options.correlationId,
    causationId: options.causationId,
    version: options.version,
    dataSchema: options.dataSchema,
    data: options.data
  }
  
  const outboxEvent = createOutboxEventFromBaseEvent(baseEvent, {
    maxAttempts: options.maxAttempts
  })
  
  const targetDb = options.tx || db
  
  const result = await targetDb
    .insert(schema.outboxEvents)
    .values(outboxEvent)
    .returning()
  
  if (!result[0]) {
    throw new Error('Failed to create outbox event')
  }
  
  return result[0]
}

/**
 * Emit multiple events atomically
 * 
 * Useful when multiple events need to be emitted as part of a single business operation.
 * All events will be inserted in a single database operation.
 * 
 * @param db Database instance or transaction
 * @param events Array of event options
 * @returns Array of created outbox event records
 */
export async function emitEvents(
  db: Database,
  events: EmitEventOptions[]
): Promise<OutboxEvent[]> {
  if (events.length === 0) {
    return []
  }
  
  const outboxEvents: NewOutboxEvent[] = events.map(options => {
    const eventId = randomUUID()
    const eventTime = new Date()
    
    const baseEvent = {
      id: eventId,
      type: options.type,
      source: options.source,
      time: eventTime,
      tenantId: options.tenantId,
      correlationId: options.correlationId,
      causationId: options.causationId,
      version: options.version,
      dataSchema: options.dataSchema,
      data: options.data
    }
    
    return createOutboxEventFromBaseEvent(baseEvent, {
      maxAttempts: options.maxAttempts
    })
  })
  
  // Use the first event's transaction if available
  const targetDb = events[0]?.tx || db
  
  const result = await targetDb
    .insert(schema.outboxEvents)
    .values(outboxEvents)
    .returning()
  
  return result
}

/**
 * Get pending events for processing
 * 
 * Used by the outbox worker to fetch events that need to be processed.
 * Returns events that are pending or have failed but haven't exceeded max attempts.
 * 
 * @param db Database instance
 * @param options Query options
 * @returns Array of pending outbox events
 */
export interface GetPendingEventsOptions {
  /** Limit number of events to fetch */
  limit?: number
  
  /** Filter by tenant ID */
  tenantId?: string
  
  /** Include events that failed but can be retried */
  includeRetries?: boolean
}

export async function getPendingEvents(
  db: Database,
  options: GetPendingEventsOptions = {}
): Promise<OutboxEvent[]> {
  const { limit = 50, tenantId, includeRetries = true } = options
  
  const now = new Date()
  
  // Build conditions for pending events
  const conditions: any[] = [
    eq(schema.outboxEvents.status, EVENT_STATUS.PENDING),
    gte(schema.outboxEvents.nextAttemptAt, now)
  ]
  
  // Include retryable failed events
  if (includeRetries) {
    conditions.push(
      and(
        eq(schema.outboxEvents.status, EVENT_STATUS.FAILED),
        lt(schema.outboxEvents.attempts, schema.outboxEvents.maxAttempts),
        gte(schema.outboxEvents.nextAttemptAt, now)
      )
    )
  }
  
  // Add tenant filter if specified
  if (tenantId) {
    const tenantConditions = conditions.map(condition => 
      and(condition, eq(schema.outboxEvents.tenantId, tenantId))
    )
    conditions.splice(0, conditions.length, ...tenantConditions)
  }
  
  const whereClause = conditions.length === 0 
    ? sql`TRUE`
    : conditions.length === 1 
      ? conditions[0] 
      : or(...conditions)
  
  return db
    .select()
    .from(schema.outboxEvents)
    .where(whereClause)
    .orderBy(schema.outboxEvents.nextAttemptAt)
    .limit(limit)
}

/**
 * Mark event as processing
 * 
 * Called by the worker when it starts processing an event to prevent
 * multiple workers from processing the same event.
 * 
 * @param db Database instance
 * @param eventId Event ID to mark as processing
 * @returns Updated event record
 */
export async function markEventAsProcessing(
  db: Database,
  eventId: string
): Promise<OutboxEvent | null> {
  const result = await db
    .update(schema.outboxEvents)
    .set({
      status: EVENT_STATUS.PROCESSING,
      lastAttemptAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(schema.outboxEvents.id, eventId))
    .returning()
  
  return result[0] || null
}

/**
 * Mark event as completed
 * 
 * Called by the worker when event has been successfully published.
 * 
 * @param db Database instance
 * @param eventId Event ID to mark as completed
 * @returns Updated event record
 */
export async function markEventAsCompleted(
  db: Database,
  eventId: string
): Promise<OutboxEvent | null> {
  const result = await db
    .update(schema.outboxEvents)
    .set({
      status: EVENT_STATUS.COMPLETED,
      completedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(schema.outboxEvents.id, eventId))
    .returning()
  
  return result[0] || null
}

/**
 * Mark event as failed and schedule retry
 * 
 * Called by the worker when event publication failed.
 * Increments attempt count and calculates next retry time using exponential backoff.
 * 
 * @param db Database instance
 * @param eventId Event ID to mark as failed
 * @param errorMessage Error message for logging
 * @param errorDetails Additional error details (optional)
 * @returns Updated event record
 */
export async function markEventAsFailed(
  db: Database,
  eventId: string,
  errorMessage: string,
  errorDetails?: Record<string, unknown>
): Promise<OutboxEvent | null> {
  // Get current event to calculate retry delay
  const currentEvent = await db
    .select()
    .from(schema.outboxEvents)
    .where(eq(schema.outboxEvents.id, eventId))
    .limit(1)
  
  if (currentEvent.length === 0) {
    return null
  }
  
  const event = currentEvent[0]!
  const newAttempts = event.attempts + 1
  
  // Calculate exponential backoff delay
  const retryDelay = Math.min(
    DEFAULT_OUTBOX_CONFIG.initialRetryDelay * 
    Math.pow(DEFAULT_OUTBOX_CONFIG.retryBackoffMultiplier, newAttempts - 1),
    DEFAULT_OUTBOX_CONFIG.maxRetryDelay
  )
  
  const nextAttemptAt = newAttempts >= event.maxAttempts 
    ? null // No more retries
    : new Date(Date.now() + retryDelay)
  
  const result = await db
    .update(schema.outboxEvents)
    .set({
      status: newAttempts >= event.maxAttempts ? EVENT_STATUS.FAILED : EVENT_STATUS.FAILED,
      attempts: newAttempts,
      lastAttemptAt: new Date(),
      nextAttemptAt,
      errorMessage,
      errorDetails,
      updatedAt: new Date()
    })
    .where(eq(schema.outboxEvents.id, eventId))
    .returning()
  
  return result[0] || null
}

/**
 * Clean up completed events
 * 
 * Removes events that have been successfully processed to prevent
 * the outbox table from growing indefinitely.
 * 
 * @param db Database instance
 * @param olderThan Remove events completed before this time
 * @param limit Maximum number of events to delete
 * @returns Number of deleted events
 */
export async function cleanupCompletedEvents(
  db: Database,
  olderThan: Date,
  limit: number = 1000
): Promise<number> {
  // Delete in batches to avoid long-running transactions
  let deletedCount = 0
  const batchSize = 100
  
  for (let i = 0; i < limit; i += batchSize) {
    const result = await db
      .delete(schema.outboxEvents)
      .where(
        and(
          eq(schema.outboxEvents.status, EVENT_STATUS.COMPLETED),
          lt(schema.outboxEvents.completedAt!, olderThan)
        )
      )
    
    const batchDeleted = 'rowCount' in result && typeof result.rowCount === 'number' ? result.rowCount : 0
    deletedCount += batchDeleted
    
    if (batchDeleted < batchSize) {
      break // No more records to delete
    }
  }
  
  return deletedCount
}

/**
 * Get event statistics
 * 
 * Useful for monitoring and alerting on outbox health.
 * 
 * @param db Database instance
 * @param tenantId Optional tenant filter
 * @returns Event count by status
 */
export async function getEventStatistics(
  db: Database,
  tenantId?: string
): Promise<Record<string, number>> {
  const baseQuery = db
    .select({
      status: schema.outboxEvents.status,
      count: sql<number>`count(*)`.as('count')
    })
    .from(schema.outboxEvents)
  
  if (tenantId) {
    baseQuery.where(eq(schema.outboxEvents.tenantId, tenantId))
  }
  
  const results = await baseQuery.groupBy(schema.outboxEvents.status)
  
  // Convert to record format
  const stats: Record<string, number> = {}
  results.forEach(row => {
    stats[row.status] = Number(row.count)
  })
  
  return stats
}

// Import the 'or' operator that was missing
import { or } from 'drizzle-orm'

// Re-export constants for external use
export { EVENT_STATUS, DEFAULT_OUTBOX_CONFIG } from '../schemas/outbox-events'
