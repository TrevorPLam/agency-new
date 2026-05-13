import { z } from 'zod'

/**
 * Base event envelope for all platform events
 * Follows CloudEvents specification with platform-specific extensions
 */
export const BaseEventSchema = z.object({
  // CloudEvents specification
  id: z.string().describe('Unique identifier for the event'),
  source: z.string().describe('Event source identifier'),
  specVersion: z.literal('1.0').describe('CloudEvents spec version'),
  type: z.string().describe('Event type identifier'),
  time: z.string().datetime().describe('Event timestamp in ISO 8601 format'),
  
  // Platform-specific extensions
  dataContentType: z.literal('application/json').default('application/json'),
  dataSchema: z.string().url().optional().describe('JSON schema URL for data validation'),
  
  // Multi-tenant context
  tenantId: z.string().uuid().describe('Tenant UUID that owns this event'),
  
  // Event metadata
  correlationId: z.string().uuid().optional().describe('Correlation ID for tracing'),
  causationId: z.string().uuid().optional().describe('Causation ID for event sourcing'),
  version: z.string().regex(/^\d+\.\d+\.\d+$/).default('1.0').describe('Event schema version'),
  
  // Event data
  data: z.unknown().describe('Event payload')
})

export type BaseEvent = z.infer<typeof BaseEventSchema>

/**
 * Event envelope factory with base fields pre-populated
 */
export interface BaseEventOptions {
  source: string
  type: string
  tenantId: string
  correlationId?: string
  causationId?: string
  version?: string
  dataSchema?: string
}

export function createBaseEvent(options: BaseEventOptions): Omit<BaseEvent, 'id' | 'time' | 'data'> {
  return {
    source: options.source,
    specVersion: '1.0',
    type: options.type,
    dataContentType: 'application/json',
    dataSchema: options.dataSchema,
    tenantId: options.tenantId,
    correlationId: options.correlationId,
    causationId: options.causationId,
    version: options.version ?? '1.0'
  }
}
