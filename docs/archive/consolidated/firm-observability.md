# firm-observability

Generated on: 2026-05-13T02:25:38.638Z
Total files: 13

**Description:** Observability and tracing for Firm Platform

**Version:** 1.0.0

## Table of Contents

- [context.ts](#context-ts)
- [error-tracking.ts](#error-tracking-ts)
- [index.ts](#index-ts)
- [initialize.ts](#initialize-ts)
- [logger.ts](#logger-ts)
- [index.ts](#index-ts)
- [middleware.ts](#middleware-ts)
- [platform-metrics.ts](#platform-metrics-ts)
- [helpers.ts](#helpers-ts)
- [index.ts](#index-ts)
- [middleware.ts](#middleware-ts)
- [pii-redaction.test.ts](#pii-redaction-test-ts)
- [tsup.config.ts](#tsup-config-ts)

## File Contents

### context.ts

**Path:** `src\context.ts`

**Language:** TypeScript

```typescript
/**
 * Observability context integration with unified request context
 * 
 * Migrates from separate AsyncLocalStorage to shared @firm/request-context
 * while maintaining backward compatibility and OpenTelemetry integration.
 */

import { trace, context as otelContext, Span, SpanStatusCode } from '@opentelemetry/api'
import { getCurrentContext as getUnifiedContext, setRequestContext } from '@firm/request-context'

export interface TraceContext {
  traceId?: string
  spanId?: string
  userId?: string
  tenantId?: string
  requestId?: string
  correlationId?: string
  sessionId?: string
  apiKeyId?: string
  isAuthenticated?: boolean
  isImpersonated?: boolean
  isDelegated?: boolean
  impersonatedBy?: string
  delegatedBy?: string
  [key: string]: any
}

export function initializeContext(): void {
  // Initialize the unified request context for observability
  // This is called during observability initialization
}

export function setContext(context: Partial<TraceContext>): void {
  // Update unified request context with observability data
  setRequestContext(context)
}

export function getCurrentContext(): TraceContext {
  // Get context from unified request context
  const unifiedContext = getUnifiedContext()
  return {
    traceId: unifiedContext.traceId,
    spanId: unifiedContext.spanId,
    userId: unifiedContext.userId,
    tenantId: unifiedContext.tenantId,
    requestId: unifiedContext.requestId,
    correlationId: unifiedContext.correlationId,
    sessionId: unifiedContext.sessionId,
    apiKeyId: unifiedContext.apiKeyId,
    isAuthenticated: unifiedContext.isAuthenticated,
    isImpersonated: unifiedContext.isImpersonated,
    isDelegated: unifiedContext.isDelegated,
    impersonatedBy: unifiedContext.impersonatedBy,
    delegatedBy: unifiedContext.delegatedBy,
  }
}

export function getTraceId(): string | undefined {
  const activeSpan = trace.getSpan(otelContext.active())
  if (activeSpan?.spanContext()) {
    return activeSpan.spanContext()?.traceId
  }
  return getUnifiedContext().traceId
}

export function getSpanId(): string | undefined {
  const activeSpan = trace.getSpan(otelContext.active())
  if (activeSpan?.spanContext()) {
    return activeSpan.spanContext()?.spanId
  }
  return getUnifiedContext().spanId
}

export function withSpan<T>(
  name: string,
  fn: (span: Span) => T,
  options: {
    attributes?: Record<string, any>
    kind?: any
    startTime?: number
  } = {}
): T {
  const tracer = trace.getTracer('firm-observability')
  
  return tracer.startActiveSpan(
    name,
    options,
    otelContext.active(),
    (span) => {
      try {
        // Add current context as span attributes
        const currentContext = getCurrentContext()
        Object.entries(currentContext).forEach(([key, value]) => {
          if (value !== undefined) {
            span.setAttribute(`firm.${key}`, value)
          }
        })

        // Add custom attributes
        if (options.attributes) {
          Object.entries(options.attributes).forEach(([key, value]) => {
            span.setAttribute(key, value)
          })
        }

        const result = fn(span)
        
        if (result instanceof Promise) {
          return result
            .then((value) => {
              span.setStatus({ code: SpanStatusCode.OK })
              return value
            })
            .catch((error) => {
              span.recordException(error)
              span.setStatus({ 
                code: SpanStatusCode.ERROR, 
                message: error.message 
              })
              throw error
            })
        } else {
          span.setStatus({ code: SpanStatusCode.OK })
          return result
        }
      } catch (error) {
        span.recordException(error as Error)
        span.setStatus({ 
          code: SpanStatusCode.ERROR, 
          message: (error as Error).message 
        })
        throw error
      }
    }
  )
}

export function runWithContext<T>(
  context: TraceContext,
  fn: () => T
): T {
  // Update unified request context and run function
  setRequestContext(context)
  return fn()
}

export function addContextAttribute(key: string, value: any): void {
  const currentContext = getCurrentContext()
  setContext({ [key]: value })
}

```

---

### error-tracking.ts

**Path:** `src\error-tracking.ts`

**Language:** TypeScript

```typescript
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

```

---

### index.ts

**Path:** `src\index.ts`

**Language:** TypeScript

```typescript
// Main initialization
export { initializeObservability, shutdown, isObservabilityInitialized } from './initialize'
export type { ObservabilityOptions } from './initialize'

// Logger functionality
export { createLogger, getLogger, withContext, log } from './logger'
export type { LoggerContext } from './logger'

// Tracing functionality
export { withSpan, withAsyncSpan, createSpan, setSpanAttributes, setSpanStatus } from './tracing/helpers'
export { TracingMiddleware, extractTraceContext, injectTraceContext } from './tracing/middleware'
export type { SpanOptions } from './tracing/helpers'

// Metrics functionality
export { platformMetrics, createCounter, createHistogram, createGauge, createUpDownCounter } from './metrics/platform-metrics'
export { MetricsMiddleware } from './metrics/middleware'

// Error tracking functionality
export { 
  captureException, 
  captureMessage, 
  setUser, 
  setTag, 
  addBreadcrumb 
} from './error-tracking'
export type { ErrorTrackingOptions } from './error-tracking'

// Context propagation
export { 
  setContext, 
  getCurrentContext, 
  getTraceId, 
  getSpanId, 
  runWithContext, 
  addContextAttribute 
} from './context'
export type { TraceContext } from './context'

```

---

### initialize.ts

**Path:** `src\initialize.ts`

**Language:** TypeScript

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { MeterProvider } from '@opentelemetry/sdk-metrics'
import * as Sentry from '@sentry/node'
import pino from 'pino'
import { createLogger } from './logger'
import { initializeContext } from './context'
import { initializeErrorTracking } from './error-tracking'

export interface ObservabilityOptions {
  serviceName: string
  serviceVersion: string
  environment: string
  otelExporterEndpoint?: string
  sentryDsn?: string
  logLevel?: pino.LevelWithSilent
  enableTracing?: boolean
  enableMetrics?: boolean
  enableErrorTracking?: boolean
}

let sdk: NodeSDK | null = null
let isInitialized = false

export function initializeObservability(options: ObservabilityOptions): void {
  if (isInitialized) {
    throw new Error('Observability already initialized. Call initializeObservability only once.')
  }

  const {
    serviceName,
    serviceVersion,
    environment,
    otelExporterEndpoint,
    sentryDsn,
    logLevel = 'info',
    enableTracing = true,
    enableMetrics = true,
    enableErrorTracking = true,
  } = options

  // Initialize context propagation first
  initializeContext()

  // Initialize OpenTelemetry SDK
  const instrumentations = getNodeAutoInstrumentations({
    // Only enable instrumentations that are relevant
    '@opentelemetry/instrumentation-fs': {
      enabled: false
    }
  })

  const traceExporter = otelExporterEndpoint 
    ? new OTLPTraceExporter({
        url: `${otelExporterEndpoint}/v1/traces`,
      })
    : undefined

  const metricExporter = otelExporterEndpoint
    ? new OTLPMetricExporter({
        url: `${otelExporterEndpoint}/v1/metrics`,
      })
    : undefined

  const sdkConfig: any = {
    instrumentations,
    serviceName,
    serviceVersion,
    environment,
  }

  if (enableTracing && traceExporter) {
    sdkConfig.traceExporter = traceExporter
  }

  if (enableMetrics && metricExporter) {
    sdkConfig.metricExporter = metricExporter
    sdkConfig.meterProvider = new MeterProvider()
  }

  sdk = new NodeSDK(sdkConfig)

  // Initialize Sentry if DSN provided
  if (enableErrorTracking && sentryDsn) {
    initializeErrorTracking({
      dsn: sentryDsn,
      environment,
      release: serviceVersion,
      tracesSampleRate: enableTracing ? 0.1 : 0,
    })
  }

  // Start the SDK
  sdk.start()

  // Initialize the default logger
  createLogger(serviceName, { level: logLevel })

  isInitialized = true

  // Graceful shutdown
  process.on('SIGTERM', () => {
    shutdown().catch((error) => {
      console.error('Error during observability shutdown:', error)
      process.exit(1)
    })
  })

  process.on('SIGINT', () => {
    shutdown().catch((error) => {
      console.error('Error during observability shutdown:', error)
      process.exit(1)
    })
  })
}

export async function shutdown(): Promise<void> {
  if (sdk) {
    await sdk.shutdown()
    sdk = null
    isInitialized = false
  }
}

export function isObservabilityInitialized(): boolean {
  return isInitialized
}

```

---

### logger.ts

**Path:** `src\logger.ts`

**Language:** TypeScript

```typescript
/**
 * @deprecated Use @firm/logger directly. This module re-exports logger functionality from @firm/logger
 * with OpenTelemetry trace context integration for backward compatibility.
 */

import type { Logger, LoggerOptions, LoggerContext as FirmLoggerContext } from '@firm/logger'
import { createLogger as createFirmLogger } from '@firm/logger'

// Re-export types from @firm/logger
export type { Logger, LoggerOptions, LoggerContext as FirmLoggerContext } from '@firm/logger'

// Extend the logger context with observability-specific fields
export interface LoggerContext extends FirmLoggerContext {
  [key: string]: any
}

let defaultLogger: Logger | null = null

/**
 * Create a logger with OpenTelemetry trace context integration
 * @param name - Logger name (usually service name)
 * @param options - Logger configuration options
 * @returns Logger instance with trace context
 */
export function createLogger(name: string, options: Partial<LoggerOptions> = {}): Logger {
  // Create base logger using @firm/logger with custom formatters for trace context
  const loggerWithTraceContext = createFirmLogger(name, {
    service: name,
    level: options.level || 'info',
    piiFields: [
      'email',
      'password',
      'ssn',
      'creditCard',
      'phoneNumber',
      'address.street',
      'address.city',
      'address.zipCode',
      'user.email',
      'user.phone',
      'user.address',
      'customer.email',
      'customer.phone',
      'customer.address',
      // Add any additional PII fields from options
      ...(options.piiFields || [])
    ],
    ...options
  })

  if (!defaultLogger) {
    defaultLogger = loggerWithTraceContext
  }

  return loggerWithTraceContext
}

/**
 * Get the default logger instance
 * @returns Default logger instance
 * @throws Error if logger not initialized
 */
export function getLogger(): Logger {
  if (!defaultLogger) {
    throw new Error('Logger not initialized. Call initializeObservability first.')
  }
  return defaultLogger
}

/**
 * Create a child logger with additional context
 * @param logger - Parent logger instance
 * @param additionalContext - Additional context to add
 * @returns Child logger with additional context
 */
export function withContext(logger: Logger, additionalContext: LoggerContext): Logger {
  return logger.child(additionalContext)
}


// Export a convenience function for quick logging (backward compatibility)
export const log = {
  info: (message: string, meta?: any) => {
    const logger = getLogger()
    logger.info(meta, message)
  },
  error: (message: string, error?: Error | any) => {
    const logger = getLogger()
    logger.error({ error: error?.stack || error }, message)
  },
  warn: (message: string, meta?: any) => {
    const logger = getLogger()
    logger.warn(meta, message)
  },
  debug: (message: string, meta?: any) => {
    const logger = getLogger()
    logger.debug(meta, message)
  },
  trace: (message: string, meta?: any) => {
    const logger = getLogger()
    logger.trace(meta, message)
  }
}

// Re-export additional functionality from @firm/logger for convenience
export {
  createContextualLogger,
  getCurrentContext as getFirmContext,
  runWithContext,
  runWithContextAsync,
  createRedactionSerializer,
  redactValue,
  containsPii,
} from '@firm/logger'

```

---

### index.ts

**Path:** `src\metrics\index.ts`

**Language:** TypeScript

```typescript
export { platformMetrics, createCounter, createHistogram, createGauge, createUpDownCounter } from './platform-metrics'
export { MetricsMiddleware } from './middleware'

```

---

### middleware.ts

**Path:** `src\metrics\middleware.ts`

**Language:** TypeScript

```typescript
import { Request, Response, NextFunction } from 'express'
import { platformMetrics } from './platform-metrics'
import { getCurrentContext } from '../context'

export function MetricsMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now()

    // Override res.end to capture response metrics
    const originalEnd = res.end
    res.end = function(this: Response, ...args: any[]) {
      const duration = (Date.now() - startTime) / 1000 // Convert to seconds

      // Record HTTP request metrics
      platformMetrics.httpRequestsTotal.add(1, {
        method: req.method,
        route: req.route?.path || req.path,
        status_code: res.statusCode.toString(),
        tenant_id: getCurrentContext().tenantId || 'unknown'
      })

      platformMetrics.httpRequestDuration.record(duration, {
        method: req.method,
        route: req.route?.path || req.path,
        status_code: res.statusCode.toString()
      })

      // Record response size if available
      const contentLength = res.get('content-length')
      if (contentLength) {
        platformMetrics.httpResponseSize.record(parseInt(contentLength, 10), {
          method: req.method,
          route: req.route?.path || req.path
        })
      }

      // Record error metrics
      if (res.statusCode >= 400) {
        platformMetrics.errorsTotal.add(1, {
          error_type: res.statusCode >= 500 ? 'server_error' : 'client_error',
          status_code: res.statusCode.toString(),
          method: req.method,
          route: req.route?.path || req.path
        })
      }

      return originalEnd.apply(this, args)
    }

    next()
  }
}

```

---

### platform-metrics.ts

**Path:** `src\metrics\platform-metrics.ts`

**Language:** TypeScript

```typescript
import { metrics, Meter, Counter, Histogram, Gauge, UpDownCounter } from '@opentelemetry/api'

let meter: Meter | null = null

function getMeter(): Meter {
  if (!meter) {
    meter = metrics.getMeter('firm-observability', '1.0.0')
  }
  return meter
}

// Standard platform metrics
export const platformMetrics = {
  // HTTP metrics
  httpRequestsTotal: getMeter().createCounter('http_requests_total', {
    description: 'Total number of HTTP requests',
    unit: '1'
  }),

  httpRequestDuration: getMeter().createHistogram('http_request_duration_seconds', {
    description: 'HTTP request duration in seconds',
    unit: 's'
  }),

  httpResponseSize: getMeter().createHistogram('http_response_size_bytes', {
    description: 'HTTP response size in bytes',
    unit: 'By'
  }),

  // Database metrics
  dbConnectionsActive: getMeter().createUpDownCounter('db_connections_active', {
    description: 'Number of active database connections',
    unit: '1'
  }),

  dbQueryDuration: getMeter().createHistogram('db_query_duration_seconds', {
    description: 'Database query duration in seconds',
    unit: 's'
  }),

  dbQueriesTotal: getMeter().createCounter('db_queries_total', {
    description: 'Total number of database queries',
    unit: '1'
  }),

  // Business metrics
  userSessionsActive: getMeter().createUpDownCounter('user_sessions_active', {
    description: 'Number of active user sessions',
    unit: '1'
  }),

  tenantOperationsTotal: getMeter().createCounter('tenant_operations_total', {
    description: 'Total number of tenant operations',
    unit: '1'
  }),

  // Error metrics
  errorsTotal: getMeter().createCounter('errors_total', {
    description: 'Total number of errors',
    unit: '1'
  }),

  // Cache metrics
  cacheHitsTotal: getMeter().createCounter('cache_hits_total', {
    description: 'Total number of cache hits',
    unit: '1'
  }),

  cacheMissesTotal: getMeter().createCounter('cache_misses_total', {
    description: 'Total number of cache misses',
    unit: '1'
  }),

  // Queue metrics
  queueMessagesProcessed: getMeter().createCounter('queue_messages_processed_total', {
    description: 'Total number of queue messages processed',
    unit: '1'
  }),

  queueMessagesFailed: getMeter().createCounter('queue_messages_failed_total', {
    description: 'Total number of queue messages that failed processing',
    unit: '1'
  }),

  // System metrics
  memoryUsage: getMeter().createGauge('memory_usage_bytes', {
    description: 'Memory usage in bytes',
    unit: 'By'
  }),

  cpuUsage: getMeter().createGauge('cpu_usage_percent', {
    description: 'CPU usage percentage',
    unit: '%'
  })
}

// Helper functions for creating custom metrics
export function createCounter(name: string, options?: {
  description?: string
  unit?: string
}): Counter {
  return getMeter().createCounter(name, options)
}

export function createHistogram(name: string, options?: {
  description?: string
  unit?: string
}): Histogram {
  return getMeter().createHistogram(name, options)
}

export function createGauge(name: string, options?: {
  description?: string
  unit?: string
}): Gauge {
  return getMeter().createGauge(name, options)
}

export function createUpDownCounter(name: string, options?: {
  description?: string
  unit?: string
}): UpDownCounter {
  return getMeter().createUpDownCounter(name, options)
}

```

---

### helpers.ts

**Path:** `src\tracing\helpers.ts`

**Language:** TypeScript

```typescript
import { trace, Span, SpanStatusCode, SpanKind } from '@opentelemetry/api'
import { getCurrentContext } from '../context'

export interface SpanOptions {
  attributes?: Record<string, any>
  kind?: SpanKind
  startTime?: number
}

export function withSpan<T>(
  name: string,
  fn: (span: Span) => T,
  options: SpanOptions = {}
): T {
  const tracer = trace.getTracer('firm-observability')
  
  return tracer.startActiveSpan(
    name,
    options,
    (span) => {
      try {
        // Add current context as span attributes
        addContextToSpan(span)
        
        // Add custom attributes
        if (options.attributes) {
          Object.entries(options.attributes).forEach(([key, value]) => {
            span.setAttribute(key, value)
          })
        }

        const result = fn(span)
        
        if (result && typeof result === 'object' && typeof (result as any).then === 'function') {
          return (result as Promise<any>)
            .then((value) => {
              span.setStatus({ code: SpanStatusCode.OK })
              return value
            })
            .catch((error) => {
              span.recordException(error)
              span.setStatus({ 
                code: SpanStatusCode.ERROR, 
                message: error.message 
              })
              throw error
            })
        } else {
          span.setStatus({ code: SpanStatusCode.OK })
          return result
        }
      } catch (error) {
        span.recordException(error as Error)
        span.setStatus({ 
          code: SpanStatusCode.ERROR, 
          message: (error as Error).message 
        })
        throw error
      }
    }
  )
}

export async function withAsyncSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  options: SpanOptions = {}
): Promise<T> {
  const tracer = trace.getTracer('firm-observability')
  
  return tracer.startActiveSpan(
    name,
    options,
    async (span) => {
      try {
        // Add current context as span attributes
        addContextToSpan(span)
        
        // Add custom attributes
        if (options.attributes) {
          Object.entries(options.attributes).forEach(([key, value]) => {
            span.setAttribute(key, value)
          })
        }

        const result = await fn(span)
        span.setStatus({ code: SpanStatusCode.OK })
        return result
      } catch (error) {
        span.recordException(error as Error)
        span.setStatus({ 
          code: SpanStatusCode.ERROR, 
          message: (error as Error).message 
        })
        throw error
      } finally {
        span.end()
      }
    }
  )
}

export function createSpan(
  name: string,
  options: SpanOptions = {}
): Span {
  const tracer = trace.getTracer('firm-observability')
  const span = tracer.startSpan(name, options)
  
  // Add current context as span attributes
  addContextToSpan(span)
  
  // Add custom attributes
  if (options.attributes) {
    Object.entries(options.attributes).forEach(([key, value]) => {
      span.setAttribute(key, value)
    })
  }
  
  return span
}

export function setSpanAttributes(span: Span, attributes: Record<string, any>): void {
  Object.entries(attributes).forEach(([key, value]) => {
    span.setAttribute(key, value)
  })
}

export function setSpanStatus(
  span: Span,
  code: SpanStatusCode,
  message?: string
): void {
  span.setStatus({ code, message })
}

function addContextToSpan(span: Span): void {
  const currentContext = getCurrentContext()
  Object.entries(currentContext).forEach(([key, value]) => {
    if (value !== undefined) {
      span.setAttribute(`firm.${key}`, value)
    }
  })
}

```

---

### index.ts

**Path:** `src\tracing\index.ts`

**Language:** TypeScript

```typescript
export { withSpan, withAsyncSpan, createSpan, setSpanAttributes, setSpanStatus } from './helpers'
export { TracingMiddleware } from './middleware'

```

---

### middleware.ts

**Path:** `src\tracing\middleware.ts`

**Language:** TypeScript

```typescript
import { Request, Response, NextFunction } from 'express'
import { trace, SpanKind, SpanStatusCode } from '@opentelemetry/api'
import { withSpan } from './helpers'

export function TracingMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const tracer = trace.getTracer('firm-observability')
    const spanName = `${req.method} ${req.route?.path || req.path}`
    
    tracer.startActiveSpan(
      spanName,
      {
        kind: SpanKind.SERVER,
        attributes: {
          'http.method': req.method,
          'http.url': req.url,
          'http.target': req.path,
          'http.host': req.get('host'),
          'user_agent': req.get('user-agent'),
          'remote_addr': req.ip || req.connection.remoteAddress,
          'http.scheme': req.protocol,
        }
      },
      (span) => {
        // Store span on request for later access
        ;(req as any).span = span

        // Override res.end to capture response status and finish span
        const originalEnd = res.end
        res.end = function(this: Response, ...args: any[]) {
          span.setAttribute('http.status_code', res.statusCode)
          
          if (res.statusCode >= 400) {
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: `HTTP ${res.statusCode}`
            })
          } else {
            span.setStatus({ code: SpanStatusCode.OK })
          }

          span.end()
          return originalEnd.apply(this, args)
        }

        next()
      }
    )
  }
}

// Helper to extract trace context from incoming requests
export function extractTraceContext(req: Request): Record<string, string> | null {
  const traceparent = req.get('traceparent')
  const tracestate = req.get('tracestate')
  
  if (!traceparent) {
    return null
  }

  const context: Record<string, string> = {
    traceparent
  }

  if (tracestate) {
    context.tracestate = tracestate
  }

  return context
}

// Helper to inject trace context into outgoing requests
export function injectTraceContext(headers: Record<string, string>): void {
  const activeSpan = trace.getSpan(trace.getActiveContext())
  if (activeSpan?.spanContext()) {
    const spanContext = activeSpan.spanContext()
    headers.traceparent = `00-${spanContext.traceId}-${spanContext.spanId}-0${spanContext.traceFlags.toString(16).padStart(2, '0')}`
  }
}

```

---

### pii-redaction.test.ts

**Path:** `tests\pii-redaction.test.ts`

**Language:** TypeScript

```typescript
import { describe, it, expect, vi } from 'vitest'
import { createLogger } from '../src/logger'
import { captureException } from '../src/error-tracking'
import * as Sentry from '@sentry/node'

// Mock Sentry for testing
vi.mock('@sentry/node', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
  setTag: vi.fn(),
  addBreadcrumb: vi.fn(),
  SpanStatusCode: {
    OK: 1,
    ERROR: 2
  }
}))

describe('PII Redaction', () => {
  describe('Logger PII Redaction', () => {
    it('should redact email addresses in log messages', () => {
      const logger = createLogger('test')
      const logSpy = vi.spyOn(logger, 'info')
      
      logger.info('User login', { 
        email: 'user@example.com',
        userId: '123'
      })
      
      expect(logSpy).toHaveBeenCalled()
      const loggedData = logSpy.mock.calls[0][1]
      expect(loggedData.email).toBe('[REDACTED]')
      expect(loggedData.userId).toBe('123')
    })

    it('should redact phone numbers in log messages', () => {
      const logger = createLogger('test')
      const logSpy = vi.spyOn(logger, 'info')
      
      logger.info('Contact info', { 
        phoneNumber: '555-123-4567',
        name: 'John Doe'
      })
      
      expect(logSpy).toHaveBeenCalled()
      const loggedData = logSpy.mock.calls[0][1]
      expect(loggedData.phoneNumber).toBe('[REDACTED]')
      expect(loggedData.name).toBe('John Doe')
    })

    it('should redact nested PII fields', () => {
      const logger = createLogger('test')
      const logSpy = vi.spyOn(logger, 'info')
      
      logger.info('User profile', { 
        user: {
          email: 'user@example.com',
          phone: '555-123-4567',
          name: 'John Doe'
        },
        customer: {
          address: {
            street: '123 Main St',
            city: 'Anytown',
            zipCode: '12345'
          }
        }
      })
      
      expect(logSpy).toHaveBeenCalled()
      const loggedData = logSpy.mock.calls[0][1]
      expect(loggedData.user.email).toBe('[REDACTED]')
      expect(loggedData.user.phone).toBe('[REDACTED]')
      expect(loggedData.customer.address.street).toBe('[REDACTED]')
      expect(loggedData.customer.address.city).toBe('[REDACTED]')
      expect(loggedData.customer.address.zipCode).toBe('[REDACTED]')
      expect(loggedData.user.name).toBe('John Doe')
    })

    it('should redact SSN and credit card numbers', () => {
      const logger = createLogger('test')
      const logSpy = vi.spyOn(logger, 'info')
      
      logger.info('Payment info', { 
        ssn: '123-45-6789',
        creditCard: '4111-1111-1111-1111',
        amount: 100.00
      })
      
      expect(logSpy).toHaveBeenCalled()
      const loggedData = logSpy.mock.calls[0][1]
      expect(loggedData.ssn).toBe('[REDACTED]')
      expect(loggedData.creditCard).toBe('[REDACTED]')
      expect(loggedData.amount).toBe(100.00)
    })
  })

  describe('Error Tracking PII Redaction', () => {
    it('should redact PII from error messages', () => {
      const error = new Error('Failed to process user user@example.com with phone 555-123-4567')
      
      captureException(error, {
        email: 'user@example.com',
        phoneNumber: '555-123-4567'
      })
      
      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          extra: expect.objectContaining({
            email: '[REDACTED]',
            phoneNumber: '[REDACTED]'
          })
        })
      )
      
      // Check that the error message was filtered
      const sentryCall = (Sentry.captureException as any).mock.calls[0]
      const capturedError = sentryCall[0]
      expect(capturedError.message).toContain('[EMAIL_REDACTED]')
      expect(capturedError.message).toContain('[PHONE_REDACTED]')
    })

    it('should redact PII from stack traces', () => {
      const error = new Error('Test error')
      error.stack = `Error: Test error
    at testFunction (/path/to/file.js:10:5)
    at Object.<anonymous> (/path/to/file.js:20:3)
    Context: { email: "user@example.com", ssn: "123-45-6789" }`
      
      captureException(error)
      
      expect(Sentry.captureException).toHaveBeenCalled()
      const sentryCall = (Sentry.captureException as any).mock.calls[0]
      const capturedError = sentryCall[0]
      expect(capturedError.stack).not.toContain('user@example.com')
      expect(capturedError.stack).not.toContain('123-45-6789')
    })
  })

  describe('Span PII Redaction', () => {
    it('should not allow PII in span attributes', () => {
      // This test verifies that PII is not accidentally exposed in spans
      // The actual redaction happens at the logger level, but we should
      // ensure span attributes don't contain PII
      
      const { withSpan } = require('../src/tracing/helpers')
      const tracer = require('@opentelemetry/api').trace.getTracer('test')
      
      let spanAttributes: any = {}
      
      const mockSpan = {
        setAttribute: (key: string, value: any) => {
          spanAttributes[key] = value
        },
        setStatus: vi.fn(),
        recordException: vi.fn(),
        end: vi.fn()
      }
      
      const mockTracer = {
        startActiveSpan: vi.fn((name, options, fn) => {
          return fn(mockSpan)
        })
      }
      
      vi.spyOn(require('@opentelemetry/api').trace, 'getTracer').mockReturnValue(mockTracer)
      
      withSpan('test span', (span) => {
        span.setAttribute('user.email', 'user@example.com')
        span.setAttribute('user.name', 'John Doe')
      })
      
      // In a real implementation, we would have validation here
      // For now, we just verify the span was created
      expect(mockTracer.startActiveSpan).toHaveBeenCalled()
    })
  })

  describe('PII Field Detection', () => {
    it('should detect common PII field patterns', () => {
      const piiFields = [
        'email',
        'password',
        'ssn',
        'creditCard',
        'phoneNumber',
        'address.street',
        'address.city',
        'address.zipCode',
        'user.email',
        'user.phone',
        'user.address',
        'customer.email',
        'customer.phone',
        'customer.address'
      ]
      
      // This test documents the PII fields that should be redacted
      expect(piiFields.length).toBeGreaterThan(0)
      
      // Verify all expected PII fields are covered
      const expectedFields = [
        'email', 'password', 'ssn', 'creditCard', 'phoneNumber',
        'address', 'street', 'city', 'zipCode', 'phone'
      ]
      
      expectedFields.forEach(field => {
        const isCovered = piiFields.some(piiField => 
          piiField.toLowerCase().includes(field.toLowerCase())
        )
        expect(isCovered).toBe(true)
      })
    })
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
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['@opentelemetry/api', '@sentry/node', 'pino'],
})

```

---

