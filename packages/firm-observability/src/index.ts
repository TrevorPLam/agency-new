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
