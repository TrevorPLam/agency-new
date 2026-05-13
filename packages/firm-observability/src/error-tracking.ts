import * as Sentry from '@sentry/node'
import { getCurrentContext, getTraceId } from './context'

export interface ErrorTrackingOptions {
  dsn: string
  environment: string
  release?: string
  tracesSampleRate?: number
  beforeSend?: (event: Sentry.Event, hint: Sentry.EventHint) => Sentry.Event | null
}

let isInitialized = false

export function initializeErrorTracking(options: ErrorTrackingOptions): void {
  if (isInitialized) {
    throw new Error('Error tracking already initialized')
  }

  Sentry.init({
    dsn: options.dsn,
    environment: options.environment,
    release: options.release,
    tracesSampleRate: options.tracesSampleRate || 0.1,
    beforeSend: options.beforeSend || defaultBeforeSend,
  })

  isInitialized = true
}

function defaultBeforeSend(event: Sentry.Event, hint: Sentry.EventHint): Sentry.Event | null {
  // Add custom context from our trace context
  const currentContext = getCurrentContext()
  const traceId = getTraceId()

  if (traceId) {
    event.tags = event.tags || {}
    event.tags.traceId = traceId
  }

  // Add user context if available
  if (currentContext.userId) {
    event.user = event.user || {}
    event.user.id = currentContext.userId
  }

  // Add tenant context if available
  if (currentContext.tenantId) {
    event.tags = event.tags || {}
    event.tags.tenantId = currentContext.tenantId
  }

  // Filter out PII from the event
  return filterPII(event)
}

function filterPII(event: Sentry.Event): Sentry.Event {
  // Remove PII from extra data
  if (event.extra) {
    event.extra = filterObject(event.extra, PII_FIELDS)
  }

  // Remove PII from user data
  if (event.user) {
    event.user = filterObject(event.user, PII_FIELDS)
  }

  // Remove PII from tags
  if (event.tags) {
    event.tags = filterObject(event.tags, PII_FIELDS)
  }

  // Filter PII from exception messages
  if (event.exception?.values) {
    event.exception.values = event.exception.values.map(exception => ({
      ...exception,
      value: filterPIIFromText(exception.value || ''),
      stacktrace: exception.stacktrace ? {
        ...exception.stacktrace,
        frames: exception.stacktrace.frames?.map(frame => ({
          ...frame,
          vars: frame.vars ? filterObject(frame.vars, PII_FIELDS) : undefined
        }))
      } : undefined
    }))
  }

  return event
}

const PII_FIELDS = [
  'email',
  'password',
  'ssn',
  'socialSecurityNumber',
  'creditCard',
  'creditCardNumber',
  'phoneNumber',
  'phone',
  'address',
  'street',
  'city',
  'state',
  'zipCode',
  'postalCode',
  'firstName',
  'lastName',
  'fullName',
  'name'
]

function filterObject(obj: any, piiFields: string[]): any {
  if (!obj || typeof obj !== 'object') {
    return obj
  }

  const filtered: any = Array.isArray(obj) ? [] : {}

  for (const [key, value] of Object.entries(obj)) {
    if (piiFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      filtered[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      filtered[key] = filterObject(value, piiFields)
    } else {
      filtered[key] = value
    }
  }

  return filtered
}

function filterPIIFromText(text: string): string {
  // Simple regex patterns for common PII
  const patterns = [
    // Email addresses
    { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL_REDACTED]' },
    // Phone numbers (US format)
    { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, replacement: '[PHONE_REDACTED]' },
    // SSN
    { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN_REDACTED]' },
    // Credit card numbers
    { pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, replacement: '[CREDIT_CARD_REDACTED]' }
  ]

  let filtered = text
  for (const { pattern, replacement } of patterns) {
    filtered = filtered.replace(pattern, replacement)
  }

  return filtered
}

export function captureException(error: Error, context?: Record<string, any>): void {
  if (!isInitialized) {
    console.error('Error tracking not initialized:', error)
    return
  }

  Sentry.captureException(error, {
    extra: context,
    captureContext: {
      tags: getCurrentContext()
    }
  })
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>): void {
  if (!isInitialized) {
    console.log(`[${level.toUpperCase()}] ${message}`)
    return
  }

  Sentry.captureMessage(message, level, {
    extra: context,
    captureContext: {
      tags: getCurrentContext()
    }
  })
}

export function setUser(user: { id?: string; email?: string; username?: string }): void {
  if (!isInitialized) {
    return
  }

  Sentry.setUser(user)
}

export function setTag(key: string, value: string): void {
  if (!isInitialized) {
    return
  }

  Sentry.setTag(key, value)
}

export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
  if (!isInitialized) {
    return
  }

  Sentry.addBreadcrumb(breadcrumb)
}
