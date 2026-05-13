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
