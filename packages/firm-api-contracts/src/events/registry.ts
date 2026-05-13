import { z } from 'zod'
import { randomUUID } from 'crypto'
import type { BaseEvent, BaseEventOptions } from './base'
import { BaseEventSchema, createBaseEvent } from './base'

/**
 * Cryptographically secure UUID generator for event IDs
 */
function generateUUID(): string {
  return randomUUID()
}

/**
 * Event definition with schema and metadata
 */
export interface EventDefinition<TData = unknown> {
  type: string
  schema: z.ZodSchema<TData>
  description?: string
  version?: string
  dataSchema?: string
}

/**
 * Typed event with inferred data type
 */
export interface TypedEvent<TData = unknown> extends BaseEvent {
  data: TData
  id: string
}

/**
 * Event registry for type-safe event handling
 */
export class EventRegistry {
  private readonly registry = new Map<string, EventDefinition>()

  /**
   * Register an event definition
   */
  register(definition: EventDefinition): void {
    if (this.registry.has(definition.type)) {
      throw new Error(`Event type "${definition.type}" is already registered in EVENT_REGISTRY`)
    }
    this.registry.set(definition.type, definition)
  }

  /**
   * Get an event definition by type
   */
  get(eventType: string): EventDefinition | undefined {
    return this.registry.get(eventType)
  }

  /**
   * Check if an event type is registered
   */
  has(eventType: string): boolean {
    return this.registry.has(eventType)
  }

  /**
   * Get all registered event types
   */
  keys(): string[] {
    return Array.from(this.registry.keys())
  }

  /**
   * Clear all registered events (for testing)
   */
  clear(): void {
    this.registry.clear()
  }

  /**
   * Get the underlying Map for advanced operations
   */
  getMap(): Map<string, EventDefinition> {
    return this.registry
  }
}

/**
 * Global event registry - all events must be registered here
 */
export const EVENT_REGISTRY = new EventRegistry()

/**
 * Factory function to create typed events with compile-time safety
 */
export function defineEvent<TData>(
  eventType: string,
  schema: z.ZodSchema<TData>,
  options?: {
    description?: string
    version?: string
    dataSchema?: string
  }
): EventDefinition<TData> {
  const definition: EventDefinition<TData> = {
    type: eventType,
    schema,
    description: options?.description,
    version: options?.version ?? '1.0',
    dataSchema: options?.dataSchema
  }

  // Register the event globally
  EVENT_REGISTRY.register(definition)

  return definition
}

/**
 * Create a typed event instance with validation
 */
export function createTypedEvent<TData>(
  definition: EventDefinition<TData>,
  options: Omit<BaseEventOptions, 'type'> & { data: TData }
): TypedEvent<TData> {
  // Validate the data against the schema
  const validatedData = definition.schema.parse(options.data)
  
  // Create base event
  const baseEvent = createBaseEvent({
    source: options.source,
    type: definition.type,
    tenantId: options.tenantId,
    correlationId: options.correlationId,
    causationId: options.causationId,
    version: definition.version,
    dataSchema: definition.dataSchema
  })

  // Generate unique ID
  const eventId = generateUUID()
  
  return {
    ...baseEvent,
    id: eventId,
    data: validatedData
  }
}

/**
 * Type guard to check if an event matches a specific type
 */
export function isEventType<TData>(
  event: BaseEvent,
  definition: EventDefinition<TData>
): event is TypedEvent<TData> {
  return event.type === definition.type
}

/**
 * Validate an event against its registered schema
 */
export function validateEvent(event: BaseEvent): BaseEvent {
  // Validate base event structure
  const validatedBase = BaseEventSchema.parse(event)
  
  // Get event definition from registry
  const definition = EVENT_REGISTRY.get(event.type)
  if (!definition) {
    throw new Error(`Event type "${event.type}" is not registered in EVENT_REGISTRY`)
  }
  
  // Validate event data
  definition.schema.parse(event.data)
  
  return validatedBase
}

/**
 * Get all registered event types
 */
export function getRegisteredEventTypes(): string[] {
  return EVENT_REGISTRY.keys()
}

/**
 * Check if an event type is registered
 */
export function isEventRegistered(eventType: string): boolean {
  return EVENT_REGISTRY.has(eventType)
}

/**
 * Clear the event registry (for testing)
 */
export function clearRegistry(): void {
  EVENT_REGISTRY.clear()
}
