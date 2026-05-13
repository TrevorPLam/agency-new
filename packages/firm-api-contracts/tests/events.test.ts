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
