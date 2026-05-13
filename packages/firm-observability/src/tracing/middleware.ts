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
