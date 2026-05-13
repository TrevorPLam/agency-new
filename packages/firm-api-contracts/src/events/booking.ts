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
