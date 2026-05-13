# firm-api-contracts

Generated on: 2026-05-13T02:25:37.493Z
Total files: 16

**Description:** API contracts, event registry, and OpenAPI definitions for the Firm platform

**Version:** 0.1.0

## Table of Contents

- [check-openapi-changes.ts](#check-openapi-changes-ts)
- [base.ts](#base-ts)
- [booking.ts](#booking-ts)
- [crm.ts](#crm-ts)
- [email.ts](#email-ts)
- [form.ts](#form-ts)
- [index.ts](#index-ts)
- [registry.ts](#registry-ts)
- [index.ts](#index-ts)
- [openapi.ts](#openapi-ts)
- [index.ts](#index-ts)
- [booking-routes.ts](#booking-routes-ts)
- [openapi.ts](#openapi-ts)
- [trpc.ts](#trpc-ts)
- [events.test.ts](#events-test-ts)
- [tsup.config.ts](#tsup-config-ts)

## File Contents

### check-openapi-changes.ts

**Path:** `scripts\check-openapi-changes.ts`

**Language:** TypeScript

```typescript
#!/usr/bin/env node

import { execSync } from 'node:child_process'
import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * CI script to check for OpenAPI breaking changes using oasdiff
 * This script is designed to run in CI environments
 */

function main() {
  try {
    console.log('🔍 Checking for OpenAPI breaking changes...')
    
    // Generate current OpenAPI document
    console.log('📝 Generating current OpenAPI document...')
    execSync('npm run build', { stdio: 'inherit' })
    execSync('node dist/openapi.js', { stdio: 'inherit' })
    
    // Check if previous version exists
    const currentPath = 'openapi.json'
    const previousPath = 'openapi-prev.json'
    
    if (!existsSync(currentPath)) {
      console.log('❌ Current OpenAPI document not found')
      process.exit(1)
    }
    
    if (!existsSync(previousPath)) {
      console.log('ℹ️  No previous version found, skipping diff check')
      process.exit(0)
    }
    
    // Run oasdiff to check for breaking changes
    console.log('🔍 Running oasdiff to check for breaking changes...')
    try {
      const diffOutput = execSync(
        `npx oasdiff breaking ${previousPath} ${currentPath}`,
        { encoding: 'utf-8', stdio: 'pipe' }
      )
      
      if (diffOutput.trim()) {
        console.log('⚠️  Breaking changes detected:')
        console.log(diffOutput)
        console.log('')
        console.log('💡 To update the baseline, run:')
        console.log('   cp openapi.json openapi-prev.json')
        console.log('')
        console.log('🚨 CI check failed due to breaking changes')
        process.exit(1)
      } else {
        console.log('✅ No breaking changes detected')
      }
    } catch (error: any) {
      // oasdiff exits with non-zero code when breaking changes are found
      if (error.stdout) {
        console.log('⚠️  Breaking changes detected:')
        console.log(error.stdout)
        console.log('')
        console.log('💡 To update the baseline, run:')
        console.log('   cp openapi.json openapi-prev.json')
        console.log('')
        console.log('🚨 CI check failed due to breaking changes')
        process.exit(1)
      } else {
        console.log('❌ Error running oasdiff:', error.message)
        process.exit(1)
      }
    }
    
    console.log('✅ OpenAPI change check passed')
    
  } catch (error: any) {
    console.error('❌ Script failed:', error.message)
    process.exit(1)
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

```

---

### base.ts

**Path:** `src\events\base.ts`

**Language:** TypeScript

```typescript
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

```

---

### booking.ts

**Path:** `src\events\booking.ts`

**Language:** TypeScript

```typescript
import { z } from 'zod'
import { defineEvent } from './registry'

/**
 * Booking created event data
 */
export const BookingCreatedDataSchema = z.object({
  bookingId: z.string().uuid().describe('Booking UUID'),
  serviceId: z.string().uuid().describe('Service UUID'),
  customerId: z.string().uuid().describe('Customer UUID'),
  startTime: z.string().datetime().describe('Booking start time'),
  endTime: z.string().datetime().describe('Booking end time'),
  timezone: z.string().describe('Booking timezone (IANA format, e.g., America/New_York)'),
  duration: z.number().positive().describe('Booking duration in minutes'),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no-show']).default('pending').describe('Booking status'),
  notes: z.string().optional().describe('Booking notes'),
  customerInfo: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional()
  }).describe('Customer information'),
  serviceInfo: z.object({
    name: z.string(),
    price: z.number().nonnegative(),
    category: z.string()
  }).describe('Service information'),
  calendarProvider: z.enum(['calcom', 'google', 'outlook']).optional().describe('Calendar provider'),
  externalEventId: z.string().optional().describe('External calendar event ID')
})

export type BookingCreatedData = z.infer<typeof BookingCreatedDataSchema>

/**
 * Booking created event definition
 */
export const BookingCreatedEvent = defineEvent(
  'booking/created',
  BookingCreatedDataSchema,
  {
    description: 'Triggered when a new booking is created',
    version: '1.0'
  }
)

/**
 * Booking updated event data
 */
export const BookingUpdatedDataSchema = z.object({
  bookingId: z.string().uuid().describe('Booking UUID'),
  changes: z.record(z.object({
    oldValue: z.unknown(),
    newValue: z.unknown()
  })).describe('Field changes'),
  updatedBy: z.enum(['system', 'customer', 'staff', 'api']).describe('Who made the update'),
  updatedById: z.string().uuid().optional().describe('User ID if updated by user')
})

export type BookingUpdatedData = z.infer<typeof BookingUpdatedDataSchema>

/**
 * Booking updated event definition
 */
export const BookingUpdatedEvent = defineEvent(
  'booking/updated',
  BookingUpdatedDataSchema,
  {
    description: 'Triggered when a booking is updated',
    version: '1.0'
  }
)

/**
 * Booking confirmed event data
 */
export const BookingConfirmedDataSchema = z.object({
  bookingId: z.string().uuid().describe('Booking UUID'),
  confirmedAt: z.string().datetime().describe('Confirmation timestamp'),
  confirmedBy: z.enum(['system', 'staff', 'customer', 'api']).describe('Who confirmed'),
  confirmedById: z.string().uuid().optional().describe('User ID if confirmed by user'),
  reminderScheduled: z.array(z.string().datetime()).describe('Scheduled reminder times')
})

export type BookingConfirmedData = z.infer<typeof BookingConfirmedDataSchema>

/**
 * Booking confirmed event definition
 */
export const BookingConfirmedEvent = defineEvent(
  'booking/confirmed',
  BookingConfirmedDataSchema,
  {
    description: 'Triggered when a booking is confirmed',
    version: '1.0'
  }
)

/**
 * Booking cancelled event data
 */
export const BookingCancelledDataSchema = z.object({
  bookingId: z.string().uuid().describe('Booking UUID'),
  cancelledAt: z.string().datetime().describe('Cancellation timestamp'),
  cancelledBy: z.enum(['customer', 'staff', 'system', 'api']).describe('Who cancelled'),
  cancelledById: z.string().uuid().optional().describe('User ID if cancelled by user'),
  reason: z.string().optional().describe('Cancellation reason'),
  refundAmount: z.number().nonnegative().optional().describe('Refund amount if applicable'),
  refundStatus: z.enum(['pending', 'processed', 'failed']).optional().describe('Refund status')
})

export type BookingCancelledData = z.infer<typeof BookingCancelledDataSchema>

/**
 * Booking cancelled event definition
 */
export const BookingCancelledEvent = defineEvent(
  'booking/cancelled',
  BookingCancelledDataSchema,
  {
    description: 'Triggered when a booking is cancelled',
    version: '1.0'
  }
)

/**
 * Booking reminder sent event data
 */
export const BookingReminderSentDataSchema = z.object({
  bookingId: z.string().uuid().describe('Booking UUID'),
  reminderType: z.enum(['24h', '2h', '30m']).describe('Reminder type'),
  sentAt: z.string().datetime().describe('When reminder was sent'),
  channel: z.enum(['email', 'sms', 'push']).describe('Reminder channel'),
  recipient: z.string().describe('Recipient identifier'),
  templateId: z.string().optional().describe('Reminder template ID')
})

export type BookingReminderSentData = z.infer<typeof BookingReminderSentDataSchema>

/**
 * Booking reminder sent event definition
 */
export const BookingReminderSentEvent = defineEvent(
  'booking/reminder-sent',
  BookingReminderSentDataSchema,
  {
    description: 'Triggered when a booking reminder is sent',
    version: '1.0'
  }
)

```

---

### crm.ts

**Path:** `src\events\crm.ts`

**Language:** TypeScript

```typescript
import { z } from 'zod'
import { defineEvent } from './registry'

/**
 * Lead created event data
 */
export const LeadCreatedDataSchema = z.object({
  leadId: z.string().uuid().describe('Lead UUID'),
  firstName: z.string().describe('First name'),
  lastName: z.string().describe('Last name'),
  email: z.string().email().describe('Email address'),
  phone: z.string().optional().describe('Phone number'),
  company: z.string().optional().describe('Company name'),
  source: z.enum(['form', 'import', 'manual', 'api', 'webhook']).describe('Lead source'),
  sourceDetails: z.record(z.unknown()).optional().describe('Source-specific details'),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).default('new').describe('Lead status'),
  score: z.number().min(0).max(100).default(0).describe('Lead score'),
  tags: z.array(z.string()).default([]).describe('Lead tags'),
  customFields: z.record(z.unknown()).default({}).describe('Custom field values'),
  duplicateOf: z.string().uuid().optional().describe('If this is a duplicate, reference to original lead')
})

export type LeadCreatedData = z.infer<typeof LeadCreatedDataSchema>

/**
 * Lead created event definition
 */
export const LeadCreatedEvent = defineEvent(
  'lead/created',
  LeadCreatedDataSchema,
  {
    description: 'Triggered when a new lead is created',
    version: '1.0'
  }
)

/**
 * Lead updated event data
 */
export const LeadUpdatedDataSchema = z.object({
  leadId: z.string().uuid().describe('Lead UUID'),
  changes: z.record(z.object({
    oldValue: z.unknown(),
    newValue: z.unknown()
  })).describe('Field changes'),
  updatedBy: z.enum(['system', 'user', 'api']).describe('Who made the update'),
  updatedById: z.string().uuid().optional().describe('User ID if updated by user')
})

export type LeadUpdatedData = z.infer<typeof LeadUpdatedDataSchema>

/**
 * Lead updated event definition
 */
export const LeadUpdatedEvent = defineEvent(
  'lead/updated',
  LeadUpdatedDataSchema,
  {
    description: 'Triggered when a lead is updated',
    version: '1.0'
  }
)

/**
 * Lead synced event data
 */
export const LeadSyncedDataSchema = z.object({
  leadId: z.string().uuid().describe('Lead UUID'),
  crmProvider: z.enum(['gohighlevel', 'hubspot', 'salesforce', 'pipedrive', 'zoho']).describe('CRM provider'),
  externalId: z.string().describe('External CRM ID'),
  syncType: z.enum(['create', 'update', 'delete']).describe('Sync operation type'),
  status: z.enum(['success', 'failed', 'pending']).describe('Sync status'),
  errorMessage: z.string().optional().describe('Error message if sync failed'),
  syncedAt: z.string().datetime().describe('When the sync occurred')
})

export type LeadSyncedData = z.infer<typeof LeadSyncedDataSchema>

/**
 * Lead synced event definition
 */
export const LeadSyncedEvent = defineEvent(
  'lead/synced',
  LeadSyncedDataSchema,
  {
    description: 'Triggered when a lead is synced to external CRM',
    version: '1.0'
  }
)

/**
 * Lead converted event data
 */
export const LeadConvertedDataSchema = z.object({
  leadId: z.string().uuid().describe('Lead UUID'),
  convertedTo: z.enum(['customer', 'opportunity']).describe('What the lead was converted to'),
  convertedById: z.string().uuid().describe('Entity ID it was converted to'),
  conversionValue: z.number().optional().describe('Value of the conversion'),
  convertedAt: z.string().datetime().describe('When conversion occurred')
})

export type LeadConvertedData = z.infer<typeof LeadConvertedDataSchema>

/**
 * Lead converted event definition
 */
export const LeadConvertedEvent = defineEvent(
  'lead/converted',
  LeadConvertedDataSchema,
  {
    description: 'Triggered when a lead is converted to customer or opportunity',
    version: '1.0'
  }
)

```

---

### email.ts

**Path:** `src\events\email.ts`

**Language:** TypeScript

```typescript
import { z } from 'zod'
import { defineEvent } from './registry'

/**
 * Email sent event data
 */
export const EmailSentDataSchema = z.object({
  emailId: z.string().uuid().describe('Email UUID'),
  templateId: z.string().optional().describe('Email template ID'),
  to: z.array(z.string().email()).describe('Recipient email addresses'),
  cc: z.array(z.string().email()).optional().describe('CC recipients'),
  bcc: z.array(z.string().email()).optional().describe('BCC recipients'),
  subject: z.string().describe('Email subject'),
  from: z.string().email().describe('Sender email address'),
  replyTo: z.string().email().optional().describe('Reply-to address'),
  provider: z.enum(['resend', 'smtp', 'sendgrid', 'ses']).describe('Email provider'),
  providerMessageId: z.string().optional().describe('Provider message ID'),
  category: z.enum(['transactional', 'marketing', 'notification']).describe('Email category'),
  metadata: z.record(z.unknown()).optional().describe('Email metadata'),
  attachments: z.array(z.object({
    filename: z.string(),
    contentType: z.string(),
    size: z.number()
  })).optional().describe('Email attachments')
})

export type EmailSentData = z.infer<typeof EmailSentDataSchema>

/**
 * Email sent event definition
 */
export const EmailSentEvent = defineEvent(
  'email/sent',
  EmailSentDataSchema,
  {
    description: 'Triggered when an email is successfully sent',
    version: '1.0'
  }
)

/**
 * Email delivered event data
 */
export const EmailDeliveredDataSchema = z.object({
  emailId: z.string().uuid().describe('Email UUID'),
  providerMessageId: z.string().describe('Provider message ID'),
  provider: z.enum(['resend', 'smtp', 'sendgrid', 'ses']).describe('Email provider'),
  deliveredAt: z.string().datetime().describe('Delivery timestamp'),
  recipient: z.string().email().describe('Delivered to address')
})

export type EmailDeliveredData = z.infer<typeof EmailDeliveredDataSchema>

/**
 * Email delivered event definition
 */
export const EmailDeliveredEvent = defineEvent(
  'email/delivered',
  EmailDeliveredDataSchema,
  {
    description: 'Triggered when an email is successfully delivered',
    version: '1.0'
  }
)

/**
 * Email bounced event data
 */
export const EmailBouncedDataSchema = z.object({
  emailId: z.string().uuid().describe('Email UUID'),
  providerMessageId: z.string().describe('Provider message ID'),
  provider: z.enum(['resend', 'smtp', 'sendgrid', 'ses']).describe('Email provider'),
  bouncedAt: z.string().datetime().describe('Bounce timestamp'),
  recipient: z.string().email().describe('Bounced email address'),
  bounceType: z.enum(['hard', 'soft', 'transient']).describe('Bounce type'),
  bounceReason: z.string().describe('Bounce reason'),
  bounceCode: z.string().optional().describe('Provider bounce code')
})

export type EmailBouncedData = z.infer<typeof EmailBouncedDataSchema>

/**
 * Email bounced event definition
 */
export const EmailBouncedEvent = defineEvent(
  'email/bounced',
  EmailBouncedDataSchema,
  {
    description: 'Triggered when an email bounces',
    version: '1.0'
  }
)

/**
 * Email opened event data
 */
export const EmailOpenedDataSchema = z.object({
  emailId: z.string().uuid().describe('Email UUID'),
  providerMessageId: z.string().describe('Provider message ID'),
  provider: z.enum(['resend', 'smtp', 'sendgrid', 'ses']).describe('Email provider'),
  openedAt: z.string().datetime().describe('Open timestamp'),
  recipient: z.string().email().describe('Opened by address'),
  userAgent: z.string().optional().describe('User agent string'),
  ipAddress: z.string().ip().optional().describe('Client IP address')
})

export type EmailOpenedData = z.infer<typeof EmailOpenedDataSchema>

/**
 * Email opened event definition
 */
export const EmailOpenedEvent = defineEvent(
  'email/opened',
  EmailOpenedDataSchema,
  {
    description: 'Triggered when an email is opened',
    version: '1.0'
  }
)

/**
 * Email clicked event data
 */
export const EmailClickedDataSchema = z.object({
  emailId: z.string().uuid().describe('Email UUID'),
  providerMessageId: z.string().describe('Provider message ID'),
  provider: z.enum(['resend', 'smtp', 'sendgrid', 'ses']).describe('Email provider'),
  clickedAt: z.string().datetime().describe('Click timestamp'),
  recipient: z.string().email().describe('Clicked by address'),
  url: z.string().url().describe('Clicked URL'),
  userAgent: z.string().optional().describe('User agent string'),
  ipAddress: z.string().ip().optional().describe('Client IP address')
})

export type EmailClickedData = z.infer<typeof EmailClickedDataSchema>

/**
 * Email clicked event definition
 */
export const EmailClickedEvent = defineEvent(
  'email/clicked',
  EmailClickedDataSchema,
  {
    description: 'Triggered when an email link is clicked',
    version: '1.0'
  }
)

```

---

### form.ts

**Path:** `src\events\form.ts`

**Language:** TypeScript

```typescript
import { z } from 'zod'
import { defineEvent } from './registry'

/**
 * Form submission event data
 */
export const FormSubmittedDataSchema = z.object({
  formId: z.string().uuid().describe('Form UUID'),
  formType: z.enum(['contact', 'lead', 'quote', 'appointment', 'newsletter']).describe('Form type'),
  fields: z.record(z.unknown()).describe('Form field values'),
  userAgent: z.string().optional().describe('User agent string'),
  ipAddress: z.string().ip().optional().describe('Client IP address'),
  referrer: z.string().url().optional().describe('Referring URL'),
  utm: z.object({
    source: z.string().optional(),
    medium: z.string().optional(),
    campaign: z.string().optional(),
    term: z.string().optional(),
    content: z.string().optional()
  }).optional().describe('UTM parameters'),
  consent: z.object({
    marketing: z.boolean().default(false),
    analytics: z.boolean().default(false),
    necessary: z.boolean().default(true)
  }).describe('Consent preferences')
})

export type FormSubmittedData = z.infer<typeof FormSubmittedDataSchema>

/**
 * Form submitted event definition
 */
export const FormSubmittedEvent = defineEvent(
  'form/submitted',
  FormSubmittedDataSchema,
  {
    description: 'Triggered when a user submits a form',
    version: '1.0'
  }
)

/**
 * Form validation failed event data
 */
export const FormValidationFailedDataSchema = z.object({
  formId: z.string().uuid().describe('Form UUID'),
  formType: z.enum(['contact', 'lead', 'quote', 'appointment', 'newsletter']).describe('Form type'),
  errors: z.array(z.object({
    field: z.string(),
    message: z.string(),
    code: z.string()
  })).describe('Validation errors'),
  fields: z.record(z.unknown()).describe('Submitted field values'),
  userAgent: z.string().optional().describe('User agent string'),
  ipAddress: z.string().ip().optional().describe('Client IP address')
})

export type FormValidationFailedData = z.infer<typeof FormValidationFailedDataSchema>

/**
 * Form validation failed event definition
 */
export const FormValidationFailedEvent = defineEvent(
  'form/validation-failed',
  FormValidationFailedDataSchema,
  {
    description: 'Triggered when form validation fails',
    version: '1.0'
  }
)

```

---

### index.ts

**Path:** `src\events\index.ts`

**Language:** TypeScript

```typescript
// Base event infrastructure
export * from './base'
export * from './registry'

// Domain-specific event definitions
export * from './form'
export * from './crm'
export * from './email'
export * from './booking'

// Re-export all registered events for easy access
export {
  // Form events
  FormSubmittedEvent,
  FormValidationFailedEvent
} from './form'

export {
  // CRM events
  LeadCreatedEvent,
  LeadUpdatedEvent,
  LeadSyncedEvent,
  LeadConvertedEvent
} from './crm'

export {
  // Email events
  EmailSentEvent,
  EmailDeliveredEvent,
  EmailBouncedEvent,
  EmailOpenedEvent,
  EmailClickedEvent
} from './email'

export {
  // Booking events
  BookingCreatedEvent,
  BookingUpdatedEvent,
  BookingConfirmedEvent,
  BookingCancelledEvent,
  BookingReminderSentEvent
} from './booking'

```

---

### registry.ts

**Path:** `src\events\registry.ts`

**Language:** TypeScript

```typescript
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

```

---

### index.ts

**Path:** `src\index.ts`

**Language:** TypeScript

```typescript
// Event system
export * from './events'

// Route contracts
export * from './routes/trpc'
export * from './routes/openapi'

// Response schemas
export * from './responses'

// OpenAPI generation
export * from './openapi'

// Re-export commonly used types
export type {
  BaseEvent,
  TypedEvent,
  EventDefinition,
  EventRegistry
} from './events'

export type {
  ProblemDetails,
  PaginationMeta
} from './responses'

export {
  EVENT_REGISTRY,
  defineEvent,
  createTypedEvent,
  validateEvent,
  isEventRegistered,
  getRegisteredEventTypes
} from './events'

export {
  LeadRoutes,
  FormRoutes,
  BookingRoutes,
  type AppRouter
} from './routes/trpc'

export {
  LeadOpenApiRoutes,
  FormOpenApiRoutes,
  OpenApiComponents
} from './routes/openapi'

export {
  generateOpenAPIDocument,
  writeOpenAPIDocument,
  registry
} from './openapi'

export {
  ProblemDetailsSchema,
  PaginationMetaSchema,
  PaginatedResponseSchema,
  SuccessResponseSchema,
  ErrorResponseSchema,
  ErrorTypes,
  ErrorCreators,
  createProblemDetails
} from './responses'

```

---

### openapi.ts

**Path:** `src\openapi.ts`

**Language:** TypeScript

```typescript
import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import { OpenApiComponents, LeadOpenApiRoutes, FormOpenApiRoutes } from './routes/openapi'
import { BookingOpenApiRoutes } from './routes/booking-routes'
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

extendZodWithOpenApi(z)

/**
 * OpenAPI registry for generating API documentation
 */
export const registry = new OpenAPIRegistry()

// Register common components
registry.registerComponent('securitySchemes', OpenApiComponents.securitySchemes)
registry.registerComponent('parameters', OpenApiComponents.parameters)
registry.registerComponent('schemas', OpenApiComponents.schemas)

// Register API routes
Object.entries(LeadOpenApiRoutes).forEach(([path, routeDef]) => {
  Object.entries(routeDef).forEach(([method, methodDef]) => {
    registry.registerPath({
      method: method as 'get' | 'post' | 'put' | 'delete',
      path,
      ...methodDef as any
    })
  })
})

Object.entries(FormOpenApiRoutes).forEach(([path, routeDef]) => {
  Object.entries(routeDef).forEach(([method, methodDef]) => {
    registry.registerPath({
      method: method as 'get' | 'post' | 'put' | 'delete',
      path,
      ...methodDef as any
    })
  })
})

Object.entries(BookingOpenApiRoutes).forEach(([path, routeDef]) => {
  Object.entries(routeDef).forEach(([method, methodDef]) => {
    registry.registerPath({
      method: method as 'get' | 'post' | 'put' | 'delete',
      path,
      ...methodDef as any
    })
  })
})

/**
 * Generate OpenAPI document
 */
export function generateOpenAPIDocument() {
  return registry.generateDocument({
    openapi: '3.1.0',
    info: {
      version: '1.0.0',
      title: 'Firm Platform API',
      description: 'RESTful API for the Firm agency platform',
      contact: {
        name: 'Firm Platform Team',
        email: 'api@firm.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'https://api.firm.com',
        description: 'Production server'
      },
      {
        url: 'https://staging-api.firm.com',
        description: 'Staging server'
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    tags: [
      {
        name: 'Leads',
        description: 'Lead management operations'
      },
      {
        name: 'Forms',
        description: 'Form submission and management'
      },
      {
        name: 'Bookings',
        description: 'Booking and appointment management'
      }
    ],
    security: [
      {
        bearerAuth: []
      },
      {
        apiKeyAuth: []
      }
    ]
  })
}

/**
 * Write OpenAPI document to file
 */
export function writeOpenAPIDocument(filePath: string = 'openapi.json') {
  const document = generateOpenAPIDocument()
  
  // Write previous version for comparison if it exists
  if (existsSync(filePath)) {
    const currentDoc = readFileSync(filePath, 'utf-8')
    writeFileSync('openapi-prev.json', currentDoc, 'utf-8')
  }
  
  // Write current OpenAPI document
  writeFileSync(filePath, JSON.stringify(document, null, 2), 'utf-8')
  
  return document
}

```

---

### index.ts

**Path:** `src\responses\index.ts`

**Language:** TypeScript

```typescript
import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

/**
 * RFC 7807 Problem Details error response
 */
export const ProblemDetailsSchema = z.object({
  type: z.string().url().openapi({
    example: 'https://api.firm.com/errors/validation-failed',
    description: 'Error type identifier'
  }),
  title: z.string().openapi({
    example: 'Validation Failed',
    description: 'Human-readable error title'
  }),
  status: z.number().int().min(400).max(599).openapi({
    example: 400,
    description: 'HTTP status code'
  }),
  detail: z.string().openapi({
    example: 'The request failed validation',
    description: 'Detailed error message'
  }),
  instance: z.string().url().optional().openapi({
    example: 'https://api.firm.com/errors/12345',
    description: 'Specific error instance identifier'
  }),
  errors: z.array(z.object({
    field: z.string().openapi({
      example: 'email',
      description: 'Field name with error'
    }),
    message: z.string().openapi({
      example: 'Invalid email format',
      description: 'Error message for field'
    }),
    code: z.string().openapi({
      example: 'INVALID_EMAIL',
      description: 'Machine-readable error code'
    })
  })).optional().openapi({
    description: 'Field-specific validation errors'
  }),
  metadata: z.record(z.unknown()).optional().openapi({
    description: 'Additional error metadata'
  })
}).openapi('ProblemDetails')

export type ProblemDetails = z.infer<typeof ProblemDetailsSchema>

/**
 * Pagination cursor schema
 */
export const CursorSchema = z.string().openapi({
  example: 'eyJpZCI6IjEyMzQ1IiwidXBkYXRlZEF0IjoiMjAyNC0wMS0wMVQwMDowMDowMFoifQ==',
  description: 'Base64-encoded pagination cursor'
})

/**
 * Pagination metadata
 */
export const PaginationMetaSchema = z.object({
  nextCursor: CursorSchema.optional().openapi({
    description: 'Cursor for next page'
  }),
  prevCursor: CursorSchema.optional().openapi({
    description: 'Cursor for previous page'
  }),
  hasMore: z.boolean().openapi({
    example: true,
    description: 'Whether more items are available'
  }),
  totalCount: z.number().int().nonnegative().optional().openapi({
    example: 150,
    description: 'Total number of items (when available)'
  }),
  pageSize: z.number().int().positive().openapi({
    example: 20,
    description: 'Page size used for this request'
  })
}).openapi('PaginationMeta')

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>

/**
 * Paginated response wrapper
 */
export function PaginatedResponseSchema<T>(itemSchema: z.ZodSchema<T>, schemaName?: string) {
  const name = schemaName || `${itemSchema.constructor.name}Response`
  return z.object({
    items: z.array(itemSchema).openapi({
      description: 'Array of items for current page'
    }),
    meta: PaginationMetaSchema.openapi({
      description: 'Pagination metadata'
    })
  }).openapi(`Paginated${name}`)
}

/**
 * Success response wrapper
 */
export function SuccessResponseSchema<T>(dataSchema: z.ZodSchema<T>) {
  return z.object({
    success: z.literal(true).openapi({
      description: 'Success indicator'
    }),
    data: dataSchema.openapi({
      description: 'Response data'
    }),
    meta: z.record(z.unknown()).optional().openapi({
      description: 'Additional metadata'
    })
  }).openapi(`Success${dataSchema.constructor.name}Response`)
}

/**
 * Error response wrapper
 */
export const ErrorResponseSchema = z.object({
  success: z.literal(false).openapi({
    description: 'Success indicator'
  }),
  error: ProblemDetailsSchema.openapi({
    description: 'Error details'
  }),
  meta: z.record(z.unknown()).optional().openapi({
    description: 'Additional metadata'
  })
}).openapi('ErrorResponse')

/**
 * Common error types
 */
export const ErrorTypes = {
  // Validation errors
  VALIDATION_FAILED: 'https://api.firm.com/errors/validation-failed',
  INVALID_INPUT: 'https://api.firm.com/errors/invalid-input',
  MISSING_REQUIRED_FIELD: 'https://api.firm.com/errors/missing-required-field',
  
  // Authentication errors
  UNAUTHORIZED: 'https://api.firm.com/errors/unauthorized',
  INVALID_TOKEN: 'https://api.firm.com/errors/invalid-token',
  TOKEN_EXPIRED: 'https://api.firm.com/errors/token-expired',
  INVALID_API_KEY: 'https://api.firm.com/errors/invalid-api-key',
  
  // Authorization errors
  FORBIDDEN: 'https://api.firm.com/errors/forbidden',
  INSUFFICIENT_PERMISSIONS: 'https://api.firm.com/errors/insufficient-permissions',
  CROSS_TENANT_ACCESS: 'https://api.firm.com/errors/cross-tenant-access',
  
  // Resource errors
  NOT_FOUND: 'https://api.firm.com/errors/not-found',
  RESOURCE_CONFLICT: 'https://api.firm.com/errors/resource-conflict',
  RESOURCE_LOCKED: 'https://api.firm.com/errors/resource-locked',
  
  // Rate limiting
  RATE_LIMITED: 'https://api.firm.com/errors/rate-limited',
  QUOTA_EXCEEDED: 'https://api.firm.com/errors/quota-exceeded',
  
  // Business logic errors
  LEAD_ALREADY_EXISTS: 'https://api.firm.com/errors/lead-already-exists',
  INVALID_LEAD_STATUS: 'https://api.firm.com/errors/invalid-lead-status',
  BOOKING_CONFLICT: 'https://api.firm.com/errors/booking-conflict',
  FORM_SUBMISSION_FAILED: 'https://api.firm.com/errors/form-submission-failed',
  
  // System errors
  INTERNAL_SERVER_ERROR: 'https://api.firm.com/errors/internal-server-error',
  SERVICE_UNAVAILABLE: 'https://api.firm.com/errors/service-unavailable',
  DATABASE_ERROR: 'https://api.firm.com/errors/database-error',
  EXTERNAL_SERVICE_ERROR: 'https://api.firm.com/errors/external-service-error'
} as const

/**
 * Create a problem details error
 */
export function createProblemDetails(
  type: string,
  title: string,
  status: number,
  detail: string,
  options?: {
    instance?: string
    errors?: Array<{ field: string; message: string; code: string }>
    metadata?: Record<string, unknown>
  }
): ProblemDetails {
  return {
    type,
    title,
    status,
    detail,
    instance: options?.instance,
    errors: options?.errors,
    metadata: options?.metadata
  }
}

/**
 * Common error creators
 */
export const ErrorCreators = {
  validationFailed: (detail: string, errors?: Array<{ field: string; message: string; code: string }>) =>
    createProblemDetails(ErrorTypes.VALIDATION_FAILED, 'Validation Failed', 400, detail, { errors }),
    
  unauthorized: (detail: string = 'Authentication required') =>
    createProblemDetails(ErrorTypes.UNAUTHORIZED, 'Unauthorized', 401, detail),
    
  forbidden: (detail: string = 'Access denied') =>
    createProblemDetails(ErrorTypes.FORBIDDEN, 'Forbidden', 403, detail),
    
  notFound: (resource: string = 'Resource') =>
    createProblemDetails(ErrorTypes.NOT_FOUND, 'Not Found', 404, `${resource} not found`),
    
  rateLimited: (detail: string = 'Rate limit exceeded') =>
    createProblemDetails(ErrorTypes.RATE_LIMITED, 'Rate Limited', 429, detail),
    
  internalServerError: (detail: string = 'Internal server error') =>
    createProblemDetails(ErrorTypes.INTERNAL_SERVER_ERROR, 'Internal Server Error', 500, detail)
}

```

---

### booking-routes.ts

**Path:** `src\routes\booking-routes.ts`

**Language:** TypeScript

```typescript
import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

/**
 * Booking management OpenAPI routes
 */
export const BookingOpenApiRoutes = {
  '/v1/bookings': {
    post: {
      tags: ['Bookings'],
      summary: 'Create a new booking',
      description: 'Creates a new booking appointment',
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      parameters: [
        {
          name: 'X-Tenant-ID',
          in: 'header',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Tenant UUID for multi-tenancy'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.object({
              serviceId: z.string().uuid().openapi({
                description: 'Service UUID'
              }),
              customerId: z.string().uuid().openapi({
                description: 'Customer UUID'
              }),
              startTime: z.string().datetime().openapi({
                description: 'Booking start time (ISO 8601)'
              }),
              endTime: z.string().datetime().openapi({
                description: 'Booking end time (ISO 8601)'
              }),
              duration: z.number().min(1).openapi({
                description: 'Duration in minutes'
              }),
              notes: z.string().optional().openapi({
                description: 'Booking notes'
              }),
              customerName: z.string().min(1).openapi({
                description: 'Customer name'
              }),
              customerEmail: z.string().email().openapi({
                description: 'Customer email'
              }),
              customerPhone: z.string().optional().openapi({
                description: 'Customer phone'
              }),
              serviceName: z.string().min(1).openapi({
                description: 'Service name'
              }),
              servicePrice: z.number().min(0).optional().openapi({
                description: 'Service price'
              }),
              serviceCategory: z.string().optional().openapi({
                description: 'Service category'
              }),
              calendarProvider: z.enum(['calcom', 'google', 'outlook']).optional().openapi({
                description: 'Calendar provider for integration'
              }),
              metadata: z.record(z.unknown()).optional().openapi({
                description: 'Additional metadata'
              })
            })
          }
        }
      },
      responses: {
        201: {
          description: 'Booking created successfully',
          content: {
            'application/json': {
              schema: z.object({
                bookingId: z.string().uuid().openapi({
                  description: 'Booking UUID'
                }),
                status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no-show']).openapi({
                  description: 'Booking status'
                }),
                startTime: z.string().datetime().openapi({
                  description: 'Start time'
                }),
                endTime: z.string().datetime().openapi({
                  description: 'End time'
                }),
                duration: z.number().openapi({
                  description: 'Duration in minutes'
                }),
                customerName: z.string().openapi({
                  description: 'Customer name'
                }),
                customerEmail: z.string().email().openapi({
                  description: 'Customer email'
                }),
                serviceName: z.string().openapi({
                  description: 'Service name'
                }),
                createdAt: z.string().datetime().openapi({
                  description: 'Creation timestamp'
                })
              })
            }
          }
        },
        400: {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        403: {
          description: 'Forbidden',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    
    get: {
      tags: ['Bookings'],
      summary: 'List bookings',
      description: 'Retrieves a paginated list of bookings',
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      parameters: [
        {
          name: 'X-Tenant-ID',
          in: 'header',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Tenant UUID for multi-tenancy'
        },
        {
          name: 'cursor',
          in: 'query',
          required: false,
          schema: { type: 'string' },
          description: 'Cursor for pagination'
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          description: 'Number of items per page'
        },
        {
          name: 'status',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show']
          },
          description: 'Filter by booking status'
        },
        {
          name: 'customerId',
          in: 'query',
          required: false,
          schema: { type: 'string', format: 'uuid' },
          description: 'Filter by customer UUID'
        },
        {
          name: 'serviceCategory',
          in: 'query',
          required: false,
          schema: { type: 'string' },
          description: 'Filter by service category'
        },
        {
          name: 'startDate',
          in: 'query',
          required: false,
          schema: { type: 'string', format: 'date' },
          description: 'Filter by start date (YYYY-MM-DD)'
        },
        {
          name: 'endDate',
          in: 'query',
          required: false,
          schema: { type: 'string', format: 'date' },
          description: 'Filter by end date (YYYY-MM-DD)'
        }
      ],
      responses: {
        200: {
          description: 'Bookings retrieved successfully',
          content: {
            'application/json': {
              schema: z.object({
                items: z.array(z.object({
                  bookingId: z.string().uuid(),
                  serviceId: z.string().uuid(),
                  customerId: z.string().uuid(),
                  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no-show']),
                  startTime: z.string().datetime(),
                  endTime: z.string().datetime(),
                  duration: z.number(),
                  customerName: z.string(),
                  customerEmail: z.string().email(),
                  customerPhone: z.string().optional(),
                  serviceName: z.string(),
                  servicePrice: z.string().optional(),
                  serviceCategory: z.string().optional(),
                  notes: z.string().optional(),
                  createdAt: z.string().datetime(),
                  updatedAt: z.string().datetime()
                })),
                meta: z.object({
                  nextCursor: z.string().optional(),
                  hasMore: z.boolean()
                })
              })
            }
          }
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  
  '/v1/bookings/{bookingId}': {
    get: {
      tags: ['Bookings'],
      summary: 'Get booking details',
      description: 'Retrieves detailed information about a specific booking',
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      parameters: [
        {
          name: 'X-Tenant-ID',
          in: 'header',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Tenant UUID for multi-tenancy'
        },
        {
          name: 'bookingId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Booking UUID'
        }
      ],
      responses: {
        200: {
          description: 'Booking retrieved successfully',
          content: {
            'application/json': {
              schema: z.object({
                bookingId: z.string().uuid(),
                serviceId: z.string().uuid(),
                customerId: z.string().uuid(),
                status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no-show']),
                startTime: z.string().datetime(),
                endTime: z.string().datetime(),
                duration: z.number(),
                notes: z.string().optional(),
                customerName: z.string(),
                customerEmail: z.string().email(),
                customerPhone: z.string().optional(),
                serviceName: z.string(),
                servicePrice: z.string().optional(),
                serviceCategory: z.string().optional(),
                calendarProvider: z.enum(['calcom', 'google', 'outlook']).optional(),
                externalEventId: z.string().optional(),
                metadata: z.record(z.unknown()).optional(),
                createdAt: z.string().datetime(),
                updatedAt: z.string().datetime(),
                cancelledAt: z.string().datetime().optional(),
                completedAt: z.string().datetime().optional()
              })
            }
          }
        },
        404: {
          description: 'Booking not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    
    put: {
      tags: ['Bookings'],
      summary: 'Update booking',
      description: 'Updates booking information',
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      parameters: [
        {
          name: 'X-Tenant-ID',
          in: 'header',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Tenant UUID for multi-tenancy'
        },
        {
          name: 'bookingId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Booking UUID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.object({
              startTime: z.string().datetime().optional(),
              endTime: z.string().datetime().optional(),
              duration: z.number().min(1).optional(),
              notes: z.string().optional(),
              customerName: z.string().min(1).optional(),
              customerEmail: z.string().email().optional(),
              customerPhone: z.string().optional(),
              serviceName: z.string().min(1).optional(),
              servicePrice: z.number().min(0).optional(),
              serviceCategory: z.string().optional(),
              status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no-show']).optional(),
              metadata: z.record(z.unknown()).optional()
            })
          }
        }
      },
      responses: {
        200: {
          description: 'Booking updated successfully',
          content: {
            'application/json': {
              schema: z.object({
                bookingId: z.string().uuid(),
                updatedAt: z.string().datetime()
              })
            }
          }
        },
        404: {
          description: 'Booking not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    
    delete: {
      tags: ['Bookings'],
      summary: 'Delete booking',
      description: 'Deletes a booking from the system',
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      parameters: [
        {
          name: 'X-Tenant-ID',
          in: 'header',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Tenant UUID for multi-tenancy'
        },
        {
          name: 'bookingId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Booking UUID'
        }
      ],
      responses: {
        200: {
          description: 'Booking deleted successfully',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean()
              })
            }
          }
        },
        404: {
          description: 'Booking not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  
  '/v1/bookings/{bookingId}/confirm': {
    post: {
      tags: ['Bookings'],
      summary: 'Confirm booking',
      description: 'Confirms a pending booking',
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      parameters: [
        {
          name: 'X-Tenant-ID',
          in: 'header',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Tenant UUID for multi-tenancy'
        },
        {
          name: 'bookingId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Booking UUID'
        }
      ],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: z.object({
              notes: z.string().optional().openapi({
                description: 'Confirmation notes'
              }),
              sendConfirmationEmail: z.boolean().default(true).openapi({
                description: 'Send confirmation email to customer'
              })
            })
          }
        }
      },
      responses: {
        200: {
          description: 'Booking confirmed successfully',
          content: {
            'application/json': {
              schema: z.object({
                bookingId: z.string().uuid(),
                status: z.literal('confirmed'),
                confirmedAt: z.string().datetime()
              })
            }
          }
        },
        404: {
          description: 'Booking not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  
  '/v1/bookings/{bookingId}/cancel': {
    post: {
      tags: ['Bookings'],
      summary: 'Cancel booking',
      description: 'Cancels a booking',
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      parameters: [
        {
          name: 'X-Tenant-ID',
          in: 'header',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Tenant UUID for multi-tenancy'
        },
        {
          name: 'bookingId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Booking UUID'
        }
      ],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: z.object({
              reason: z.string().optional().openapi({
                description: 'Cancellation reason'
              }),
              sendCancellationEmail: z.boolean().default(true).openapi({
                description: 'Send cancellation email to customer'
              }),
              refundAmount: z.number().min(0).optional().openapi({
                description: 'Refund amount (if applicable)'
              })
            })
          }
        }
      },
      responses: {
        200: {
          description: 'Booking cancelled successfully',
          content: {
            'application/json': {
              schema: z.object({
                bookingId: z.string().uuid(),
                status: z.literal('cancelled'),
                cancelledAt: z.string().datetime()
              })
            }
          }
        },
        404: {
          description: 'Booking not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  }
}

```

---

### openapi.ts

**Path:** `src\routes\openapi.ts`

**Language:** TypeScript

```typescript
import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

/**
 * Common OpenAPI components
 */
export const OpenApiComponents = {
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT'
    },
    apiKeyAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'X-API-Key'
    }
  },
  parameters: {
    tenantId: {
      name: 'X-Tenant-ID',
      in: 'header',
      required: true,
      schema: { type: 'string', format: 'uuid' },
      description: 'Tenant UUID for multi-tenancy'
    },
    cursor: {
      name: 'cursor',
      in: 'query',
      required: false,
      schema: { type: 'string' },
      description: 'Cursor for pagination'
    },
    limit: {
      name: 'limit',
      in: 'query',
      required: false,
      schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      description: 'Number of items per page'
    }
  },
  schemas: {
    Error: z.object({
      error: z.object({
        code: z.string(),
        message: z.string(),
        details: z.record(z.unknown()).optional()
      })
    }).openapi('Error'),
    
    PaginationMeta: z.object({
      nextCursor: z.string().optional(),
      hasMore: z.boolean()
    }).openapi('PaginationMeta'),
    
    UTMParams: z.object({
      source: z.string().optional(),
      medium: z.string().optional(),
      campaign: z.string().optional(),
      term: z.string().optional(),
      content: z.string().optional()
    }).openapi('UTMParams'),
    
    Consent: z.object({
      marketing: z.boolean().default(false),
      analytics: z.boolean().default(false),
      necessary: z.boolean().default(true)
    }).openapi('Consent')
  }
}

/**
 * Lead management OpenAPI routes
 */
export const LeadOpenApiRoutes = {
  '/v1/leads': {
    post: {
      tags: ['Leads'],
      summary: 'Create a new lead',
      description: 'Creates a new lead in the system',
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      parameters: [
        OpenApiComponents.parameters.tenantId
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.object({
              firstName: z.string().min(1).openapi({
                example: 'John',
                description: 'First name'
              }),
              lastName: z.string().min(1).openapi({
                example: 'Doe',
                description: 'Last name'
              }),
              email: z.string().email().openapi({
                example: 'john.doe@example.com',
                description: 'Email address'
              }),
              phone: z.string().optional().openapi({
                example: '+1-555-0123',
                description: 'Phone number'
              }),
              company: z.string().optional().openapi({
                example: 'Acme Corp',
                description: 'Company name'
              }),
              source: z.enum(['form', 'import', 'manual', 'api', 'webhook']).openapi({
                example: 'form',
                description: 'Lead source'
              }),
              sourceDetails: z.record(z.unknown()).optional().openapi({
                description: 'Source-specific details'
              }),
              tags: z.array(z.string()).default([]).openapi({
                example: ['vip', 'enterprise'],
                description: 'Lead tags'
              }),
              customFields: z.record(z.unknown()).default({}).openapi({
                description: 'Custom field values'
              })
            })
          }
        }
      },
      responses: {
        201: {
          description: 'Lead created successfully',
          content: {
            'application/json': {
              schema: z.object({
                leadId: z.string().uuid().openapi({
                  description: 'Lead UUID'
                }),
                status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).openapi({
                  description: 'Lead status'
                }),
                score: z.number().min(0).max(100).openapi({
                  description: 'Lead score'
                }),
                createdAt: z.string().datetime().openapi({
                  description: 'Creation timestamp'
                })
              })
            }
          }
        },
        400: {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        403: {
          description: 'Forbidden',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    
    get: {
      tags: ['Leads'],
      summary: 'List leads',
      description: 'Retrieves a paginated list of leads',
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      parameters: [
        OpenApiComponents.parameters.tenantId,
        OpenApiComponents.parameters.cursor,
        OpenApiComponents.parameters.limit,
        {
          name: 'status',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['new', 'contacted', 'qualified', 'converted', 'lost']
          },
          description: 'Filter by lead status'
        },
        {
          name: 'source',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['form', 'import', 'manual', 'api', 'webhook']
          },
          description: 'Filter by lead source'
        },
        {
          name: 'tags',
          in: 'query',
          required: false,
          schema: {
            type: 'array',
            items: { type: 'string' }
          },
          style: 'form',
          explode: false,
          description: 'Filter by tags'
        },
        {
          name: 'search',
          in: 'query',
          required: false,
          schema: { type: 'string' },
          description: 'Search term for name/email/company'
        }
      ],
      responses: {
        200: {
          description: 'Leads retrieved successfully',
          content: {
            'application/json': {
              schema: z.object({
                items: z.array(z.object({
                  leadId: z.string().uuid(),
                  firstName: z.string(),
                  lastName: z.string(),
                  email: z.string().email(),
                  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']),
                  score: z.number().min(0).max(100),
                  createdAt: z.string().datetime()
                })),
                meta: { $ref: '#/components/schemas/PaginationMeta' }
              })
            }
          }
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  
  '/v1/leads/{leadId}': {
    get: {
      tags: ['Leads'],
      summary: 'Get lead details',
      description: 'Retrieves detailed information about a specific lead',
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      parameters: [
        OpenApiComponents.parameters.tenantId,
        {
          name: 'leadId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Lead UUID'
        }
      ],
      responses: {
        200: {
          description: 'Lead retrieved successfully',
          content: {
            'application/json': {
              schema: z.object({
                leadId: z.string().uuid(),
                firstName: z.string(),
                lastName: z.string(),
                email: z.string().email(),
                phone: z.string().optional(),
                company: z.string().optional(),
                status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']),
                score: z.number().min(0).max(100),
                tags: z.array(z.string()),
                customFields: z.record(z.unknown()),
                createdAt: z.string().datetime(),
                updatedAt: z.string().datetime()
              })
            }
          }
        },
        404: {
          description: 'Lead not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    
    put: {
      tags: ['Leads'],
      summary: 'Update lead',
      description: 'Updates lead information',
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      parameters: [
        OpenApiComponents.parameters.tenantId,
        {
          name: 'leadId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Lead UUID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.object({
              firstName: z.string().min(1).optional(),
              lastName: z.string().min(1).optional(),
              email: z.string().email().optional(),
              phone: z.string().optional(),
              company: z.string().optional(),
              status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional(),
              tags: z.array(z.string()).optional(),
              customFields: z.record(z.unknown()).optional()
            })
          }
        }
      },
      responses: {
        200: {
          description: 'Lead updated successfully',
          content: {
            'application/json': {
              schema: z.object({
                leadId: z.string().uuid(),
                updatedAt: z.string().datetime()
              })
            }
          }
        },
        404: {
          description: 'Lead not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    
    delete: {
      tags: ['Leads'],
      summary: 'Delete lead',
      description: 'Deletes a lead from the system',
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      parameters: [
        OpenApiComponents.parameters.tenantId,
        {
          name: 'leadId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Lead UUID'
        }
      ],
      responses: {
        200: {
          description: 'Lead deleted successfully',
          content: {
            'application/json': {
              schema: z.object({
                success: z.boolean()
              })
            }
          }
        },
        404: {
          description: 'Lead not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  },
  
  '/v1/leads/{leadId}/sync': {
    post: {
      tags: ['Leads'],
      summary: 'Sync lead to CRM',
      description: 'Initiates synchronization of a lead to external CRM',
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      parameters: [
        OpenApiComponents.parameters.tenantId,
        {
          name: 'leadId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Lead UUID'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.object({
              crmProvider: z.enum(['gohighlevel', 'hubspot', 'salesforce', 'pipedrive', 'zoho']).openapi({
                example: 'hubspot',
                description: 'CRM provider to sync to'
              })
            })
          }
        }
      },
      responses: {
        202: {
          description: 'Sync initiated successfully',
          content: {
            'application/json': {
              schema: z.object({
                syncId: z.string().uuid(),
                status: z.enum(['pending', 'success', 'failed']),
                externalId: z.string().optional()
              })
            }
          }
        },
        404: {
          description: 'Lead not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    }
  }
}

/**
 * Form management OpenAPI routes
 */
export const FormOpenApiRoutes = {
  '/v1/forms': {
    post: {
      tags: ['Forms'],
      summary: 'Submit form',
      description: 'Submits a form and creates lead if applicable',
      security: [],
      parameters: [
        OpenApiComponents.parameters.tenantId
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: z.object({
              formId: z.string().uuid().openapi({
                description: 'Form UUID'
              }),
              formType: z.enum(['contact', 'lead', 'quote', 'appointment', 'newsletter']).openapi({
                example: 'contact',
                description: 'Form type'
              }),
              fields: z.record(z.unknown()).openapi({
                description: 'Form field values'
              }),
              userAgent: z.string().optional().openapi({
                description: 'User agent string'
              }),
              referrer: z.string().url().optional().openapi({
                description: 'Referring URL'
              }),
              utm: { $ref: '#/components/schemas/UTMParams' },
              consent: { $ref: '#/components/schemas/Consent' }
            })
          }
        }
      },
      responses: {
        201: {
          description: 'Form submitted successfully',
          content: {
            'application/json': {
              schema: z.object({
                submissionId: z.string().uuid(),
                status: z.enum(['success', 'validation_failed']),
                leadId: z.string().uuid().optional(),
                errors: z.array(z.object({
                  field: z.string(),
                  message: z.string(),
                  code: z.string()
                })).optional()
              })
            }
          }
        },
        400: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    
    get: {
      tags: ['Forms'],
      summary: 'List forms',
      description: 'Retrieves a paginated list of forms',
      security: [
        { bearerAuth: [] },
        { apiKeyAuth: [] }
      ],
      parameters: [
        OpenApiComponents.parameters.tenantId,
        OpenApiComponents.parameters.cursor,
        OpenApiComponents.parameters.limit,
        {
          name: 'type',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['contact', 'lead', 'quote', 'appointment', 'newsletter']
          },
          description: 'Filter by form type'
        },
        {
          name: 'isActive',
          in: 'query',
          required: false,
          schema: { type: 'boolean' },
          description: 'Filter by active status'
        }
      ],
      responses: {
        200: {
          description: 'Forms retrieved successfully',
          content: {
            'application/json': {
              schema: z.object({
                items: z.array(z.object({
                  formId: z.string().uuid(),
                  name: z.string(),
                  type: z.enum(['contact', 'lead', 'quote', 'appointment', 'newsletter']),
                  isActive: z.boolean(),
                  submissionCount: z.number(),
                  createdAt: z.string().datetime()
                })),
                meta: { $ref: '#/components/schemas/PaginationMeta' }
              })
            }
          }
        }
      }
    }
  }
}

```

---

### trpc.ts

**Path:** `src\routes\trpc.ts`

**Language:** TypeScript

```typescript
import { z } from 'zod'
import { TRPCRouterRecord } from '@trpc/server'

/**
 * Common input schemas
 */
export const PaginationInputSchema = z.object({
  cursor: z.string().optional().describe('Cursor for pagination'),
  limit: z.number().min(1).max(100).default(20).describe('Number of items per page')
})

export const TenantInputSchema = z.object({
  tenantId: z.string().uuid().describe('Tenant UUID')
})

export const DateRangeInputSchema = z.object({
  startDate: z.string().datetime().optional().describe('Start date filter'),
  endDate: z.string().datetime().optional().describe('End date filter')
})

/**
 * Lead management route contracts
 */
export const LeadRoutes = {
  // Lead CRUD operations
  createLead: {
    input: z.object({
      tenantId: z.string().uuid(),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      company: z.string().optional(),
      source: z.enum(['form', 'import', 'manual', 'api', 'webhook']),
      sourceDetails: z.record(z.unknown()).optional(),
      tags: z.array(z.string()).default([]),
      customFields: z.record(z.unknown()).default({})
    }),
    output: z.object({
      leadId: z.string().uuid(),
      status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']),
      score: z.number().min(0).max(100),
      createdAt: z.string().datetime()
    })
  },

  getLead: {
    input: z.object({
      tenantId: z.string().uuid(),
      leadId: z.string().uuid()
    }),
    output: z.object({
      leadId: z.string().uuid(),
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      phone: z.string().optional(),
      company: z.string().optional(),
      status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']),
      score: z.number().min(0).max(100),
      tags: z.array(z.string()),
      customFields: z.record(z.unknown()),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime()
    })
  },

  listLeads: {
    input: z.object({
      tenantId: z.string().uuid(),
      cursor: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
      status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional(),
      source: z.enum(['form', 'import', 'manual', 'api', 'webhook']).optional(),
      tags: z.array(z.string()).optional(),
      search: z.string().optional()
    }),
    output: z.object({
      items: z.array(z.object({
        leadId: z.string().uuid(),
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email(),
        status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']),
        score: z.number().min(0).max(100),
        createdAt: z.string().datetime()
      })),
      nextCursor: z.string().optional(),
      hasMore: z.boolean()
    })
  },

  updateLead: {
    input: z.object({
      tenantId: z.string().uuid(),
      leadId: z.string().uuid(),
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      company: z.string().optional(),
      status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional(),
      tags: z.array(z.string()).optional(),
      customFields: z.record(z.unknown()).optional()
    }),
    output: z.object({
      leadId: z.string().uuid(),
      updatedAt: z.string().datetime()
    })
  },

  deleteLead: {
    input: z.object({
      tenantId: z.string().uuid(),
      leadId: z.string().uuid()
    }),
    output: z.object({
      success: z.boolean()
    })
  },

  // Lead sync operations
  syncLead: {
    input: z.object({
      tenantId: z.string().uuid(),
      leadId: z.string().uuid(),
      crmProvider: z.enum(['gohighlevel', 'hubspot', 'salesforce', 'pipedrive', 'zoho'])
    }),
    output: z.object({
      syncId: z.string().uuid(),
      status: z.enum(['pending', 'success', 'failed']),
      externalId: z.string().optional()
    })
  },

  getSyncStatus: {
    input: z.object({
      tenantId: z.string().uuid(),
      syncId: z.string().uuid()
    }),
    output: z.object({
      syncId: z.string().uuid(),
      leadId: z.string().uuid(),
      crmProvider: z.enum(['gohighlevel', 'hubspot', 'salesforce', 'pipedrive', 'zoho']),
      status: z.enum(['pending', 'success', 'failed']),
      externalId: z.string().optional(),
      errorMessage: z.string().optional(),
      createdAt: z.string().datetime(),
      completedAt: z.string().datetime().optional()
    })
  }
} satisfies TRPCRouterRecord

/**
 * Form management route contracts
 */
export const FormRoutes = {
  submitForm: {
    input: z.object({
      tenantId: z.string().uuid(),
      formId: z.string().uuid(),
      formType: z.enum(['contact', 'lead', 'quote', 'appointment', 'newsletter']),
      fields: z.record(z.unknown()),
      userAgent: z.string().optional(),
      referrer: z.string().url().optional(),
      utm: z.object({
        source: z.string().optional(),
        medium: z.string().optional(),
        campaign: z.string().optional(),
        term: z.string().optional(),
        content: z.string().optional()
      }).optional(),
      consent: z.object({
        marketing: z.boolean().default(false),
        analytics: z.boolean().default(false),
        necessary: z.boolean().default(true)
      })
    }),
    output: z.object({
      submissionId: z.string().uuid(),
      status: z.enum(['success', 'validation_failed']),
      leadId: z.string().uuid().optional(),
      errors: z.array(z.object({
        field: z.string(),
        message: z.string(),
        code: z.string()
      })).optional()
    })
  },

  getForm: {
    input: z.object({
      tenantId: z.string().uuid(),
      formId: z.string().uuid()
    }),
    output: z.object({
      formId: z.string().uuid(),
      name: z.string(),
      type: z.enum(['contact', 'lead', 'quote', 'appointment', 'newsletter']),
      fields: z.array(z.object({
        name: z.string(),
        type: z.string(),
        label: z.string(),
        required: z.boolean(),
        validation: z.record(z.unknown()).optional()
      })),
      isActive: z.boolean(),
      createdAt: z.string().datetime()
    })
  },

  listForms: {
    input: z.object({
      tenantId: z.string().uuid(),
      cursor: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
      type: z.enum(['contact', 'lead', 'quote', 'appointment', 'newsletter']).optional(),
      isActive: z.boolean().optional()
    }),
    output: z.object({
      items: z.array(z.object({
        formId: z.string().uuid(),
        name: z.string(),
        type: z.enum(['contact', 'lead', 'quote', 'appointment', 'newsletter']),
        isActive: z.boolean(),
        submissionCount: z.number(),
        createdAt: z.string().datetime()
      })),
      nextCursor: z.string().optional(),
      hasMore: z.boolean()
    })
  }
} satisfies TRPCRouterRecord

/**
 * Booking management route contracts
 */
export const BookingRoutes = {
  createBooking: {
    input: z.object({
      tenantId: z.string().uuid(),
      serviceId: z.string().uuid(),
      customerId: z.string().uuid(),
      startTime: z.string().datetime(),
      notes: z.string().optional(),
      customerInfo: z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string().optional()
      })
    }),
    output: z.object({
      bookingId: z.string().uuid(),
      status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no-show']),
      startTime: z.string().datetime(),
      endTime: z.string().datetime(),
      duration: z.number(),
      createdAt: z.string().datetime()
    })
  },

  getBooking: {
    input: z.object({
      tenantId: z.string().uuid(),
      bookingId: z.string().uuid()
    }),
    output: z.object({
      bookingId: z.string().uuid(),
      serviceId: z.string().uuid(),
      customerId: z.string().uuid(),
      startTime: z.string().datetime(),
      endTime: z.string().datetime(),
      duration: z.number(),
      status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no-show']),
      notes: z.string().optional(),
      customerInfo: z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string().optional()
      }),
      serviceInfo: z.object({
        name: z.string(),
        price: z.number(),
        category: z.string()
      }),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime()
    })
  },

  listBookings: {
    input: z.object({
      tenantId: z.string().uuid(),
      cursor: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
      status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no-show']).optional(),
      customerId: z.string().uuid().optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional()
    }),
    output: z.object({
      items: z.array(z.object({
        bookingId: z.string().uuid(),
        serviceId: z.string().uuid(),
        customerId: z.string().uuid(),
        startTime: z.string().datetime(),
        endTime: z.string().datetime(),
        status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no-show']),
        customerInfo: z.object({
          name: z.string(),
          email: z.string().email()
        }),
        serviceInfo: z.object({
          name: z.string(),
          price: z.number()
        })
      })),
      nextCursor: z.string().optional(),
      hasMore: z.boolean()
    })
  },

  updateBooking: {
    input: z.object({
      tenantId: z.string().uuid(),
      bookingId: z.string().uuid(),
      startTime: z.string().datetime().optional(),
      notes: z.string().optional(),
      status: z.enum(['pending', 'confirmed', 'cancelled', 'completed', 'no-show']).optional()
    }),
    output: z.object({
      bookingId: z.string().uuid(),
      updatedAt: z.string().datetime()
    })
  },

  cancelBooking: {
    input: z.object({
      tenantId: z.string().uuid(),
      bookingId: z.string().uuid(),
      reason: z.string().optional()
    }),
    output: z.object({
      bookingId: z.string().uuid(),
      status: z.enum(['cancelled']),
      cancelledAt: z.string().datetime()
    })
  }
} satisfies TRPCRouterRecord

/**
 * Combined router type
 */
export type AppRouter = {
  leads: typeof LeadRoutes
  forms: typeof FormRoutes
  bookings: typeof BookingRoutes
}

```

---

### events.test.ts

**Path:** `tests\events.test.ts`

**Language:** TypeScript

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { z } from 'zod'
import { 
  defineEvent, 
  createTypedEvent, 
  validateEvent, 
  isEventRegistered,
  getRegisteredEventTypes,
  clearRegistry
} from '../src/events'

describe('Event Registry', () => {
  beforeEach(() => {
    // Clear registry for each test
    clearRegistry()
  })

  describe('defineEvent', () => {
    it('should register a new event type', () => {
      const TestEventSchema = z.object({
        test: z.string()
      })
      
      const eventDef = defineEvent('test/event', TestEventSchema, {
        description: 'Test event'
      })
      
      expect(eventDef.type).toBe('test/event')
      expect(eventDef.schema).toBe(TestEventSchema)
      expect(eventDef.description).toBe('Test event')
      expect(isEventRegistered('test/event')).toBe(true)
    })

    it('should throw error when registering duplicate event type', () => {
      const TestEventSchema = z.object({
        test: z.string()
      })
      
      defineEvent('test/event', TestEventSchema)
      
      expect(() => {
        defineEvent('test/event', TestEventSchema)
      }).toThrow('Event type "test/event" is already registered in EVENT_REGISTRY')
    })
  })

  describe('createTypedEvent', () => {
    it('should create a typed event with validated data', () => {
      const TestEventSchema = z.object({
        test: z.string()
      })
      
      const eventDef = defineEvent('test/event', TestEventSchema)
      const event = createTypedEvent(eventDef, {
        source: 'test-source',
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
        data: { test: 'hello' }
      })
      
      expect(event.type).toBe('test/event')
      expect(event.source).toBe('test-source')
      expect(event.tenantId).toBe('123e4567-e89b-12d3-a456-426614174000')
      expect(event.data).toEqual({ test: 'hello' })
      expect(event.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })

    it('should validate data against schema', () => {
      const TestEventSchema = z.object({
        test: z.string().min(5)
      })
      
      const eventDef = defineEvent('test/event', TestEventSchema)
      
      expect(() => {
        createTypedEvent(eventDef, {
          source: 'test-source',
          tenantId: '123e4567-e89b-12d3-a456-426614174000',
          data: { test: 'hi' }
        })
      }).toThrow()
    })
  })

  describe('validateEvent', () => {
    it('should validate a valid event', () => {
      // Register a test event for validation
      const TestEventSchema = z.object({
        formId: z.string().uuid()
      })
      
      const testEventDef = defineEvent('test/validation', TestEventSchema, {
        description: 'Test event for validation',
        version: '1.0.0'
      })
      
      const event = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        source: 'test-source',
        specVersion: '1.0' as const,
        type: 'test/validation',
        time: '2024-01-01T00:00:00.000Z',
        dataContentType: 'application/json' as const,
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
        version: '1.0.0',
        data: { formId: '123e4567-e89b-12d3-a456-426614174000' }
      }
      
      const validated = validateEvent(event)
      expect(validated).toEqual(event)
    })

    it('should throw error for unregistered event type', () => {
      const event = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        source: 'test-source',
        specVersion: '1.0' as const,
        type: 'unregistered/event',
        time: '2024-01-01T00:00:00.000Z',
        dataContentType: 'application/json' as const,
        tenantId: '123e4567-e89b-12d3-a456-426614174000',
        version: '1.0.0',
        data: {}
      }
      
      expect(() => validateEvent(event)).toThrow('Event type "unregistered/event" is not registered in EVENT_REGISTRY')
    })
  })

  describe('isEventRegistered', () => {
    it('should return true for registered event types', () => {
      const TestEventSchema = z.object({ test: z.string() })
      defineEvent('test/event', TestEventSchema)
      
      expect(isEventRegistered('test/event')).toBe(true)
    })

    it('should return false for unregistered event types', () => {
      expect(isEventRegistered('unregistered/event')).toBe(false)
    })
  })

  describe('getRegisteredEventTypes', () => {
    it('should return all registered event types', () => {
      const TestEventSchema = z.object({ test: z.string() })
      defineEvent('test/event1', TestEventSchema)
      defineEvent('test/event2', TestEventSchema)
      
      const types = getRegisteredEventTypes()
      expect(types).toContain('test/event1')
      expect(types).toContain('test/event2')
      expect(types).toHaveLength(2)
    })
  })
})

describe('Domain Events', () => {
  it('should have form events available', async () => {
    // Import form events to verify they exist and have correct structure
    const { FormSubmittedEvent, FormValidationFailedEvent } = await import('../src/events/form')
    
    expect(FormSubmittedEvent.type).toBe('form/submitted')
    expect(FormSubmittedEvent.version).toBe('1.0')
    expect(FormValidationFailedEvent.type).toBe('form/validation-failed')
    expect(FormValidationFailedEvent.version).toBe('1.0')
  })

  it('should have CRM events available', async () => {
    // Import CRM events to verify they exist and have correct structure
    const { LeadCreatedEvent, LeadUpdatedEvent, LeadSyncedEvent, LeadConvertedEvent } = await import('../src/events/crm')
    
    expect(LeadCreatedEvent.type).toBe('lead/created')
    expect(LeadUpdatedEvent.type).toBe('lead/updated')
    expect(LeadSyncedEvent.type).toBe('lead/synced')
    expect(LeadConvertedEvent.type).toBe('lead/converted')
  })

  it('should have email events available', async () => {
    // Import email events to verify they exist and have correct structure
    const { EmailSentEvent, EmailDeliveredEvent, EmailBouncedEvent, EmailOpenedEvent, EmailClickedEvent } = await import('../src/events/email')
    
    expect(EmailSentEvent.type).toBe('email/sent')
    expect(EmailDeliveredEvent.type).toBe('email/delivered')
    expect(EmailBouncedEvent.type).toBe('email/bounced')
    expect(EmailOpenedEvent.type).toBe('email/opened')
    expect(EmailClickedEvent.type).toBe('email/clicked')
  })

  it('should have booking events available', async () => {
    // Import booking events to verify they exist and have correct structure
    const { BookingCreatedEvent, BookingUpdatedEvent, BookingConfirmedEvent, BookingCancelledEvent, BookingReminderSentEvent } = await import('../src/events/booking')
    
    expect(BookingCreatedEvent.type).toBe('booking/created')
    expect(BookingUpdatedEvent.type).toBe('booking/updated')
    expect(BookingConfirmedEvent.type).toBe('booking/confirmed')
    expect(BookingCancelledEvent.type).toBe('booking/cancelled')
    expect(BookingReminderSentEvent.type).toBe('booking/reminder-sent')
  })
})

```

---

### tsup.config.ts

**Path:** `tsup.config.ts`

**Language:** TypeScript

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    openapi: 'src/openapi.ts'
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: ['zod', '@asteasolutions/zod-to-openapi']
})

```

---

