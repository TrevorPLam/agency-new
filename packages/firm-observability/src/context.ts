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
