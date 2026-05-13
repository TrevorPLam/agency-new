/**
 * Next.js 16+ Instrumentation Hook for Observability Demo
 * 
 * This file initializes observability for the demo application.
 */

import { initializeObservability } from '@firm/observability'

export async function register() {
  // Get configuration from environment variables
  const serviceName = process.env.OTEL_SERVICE_NAME || 'observability-demo'
  const serviceVersion = process.env.npm_package_version || '0.1.0'
  const environment = process.env.NODE_ENV || 'development'
  const otelExporterEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
  const sentryDsn = process.env.SENTRY_DSN
  const logLevel = (process.env.LOG_LEVEL as any) || 'info'
  
  // Determine which features to enable based on environment
  const enableTracing = process.env.OTEL_TRACING_ENABLED !== 'false'
  const enableMetrics = process.env.OTEL_METRICS_ENABLED !== 'false'
  const enableErrorTracking = !!sentryDsn && process.env.SENTRY_ENABLED !== 'false'

  // Initialize in all environments for demo purposes
  try {
    initializeObservability({
      serviceName,
      serviceVersion,
      environment,
      otelExporterEndpoint,
      sentryDsn,
      logLevel,
      enableTracing,
      enableMetrics,
      enableErrorTracking,
    })

    console.log(`[Observability] Initialized for ${serviceName} in ${environment}`)
    console.log(`[Observability] Tracing: ${enableTracing}, Metrics: ${enableMetrics}, Error Tracking: ${enableErrorTracking}`)
  } catch (error) {
    console.error('[Observability] Failed to initialize:', error)
  }
}
