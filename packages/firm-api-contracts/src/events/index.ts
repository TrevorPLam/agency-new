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
