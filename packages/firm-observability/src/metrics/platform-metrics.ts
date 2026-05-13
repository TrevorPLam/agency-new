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
