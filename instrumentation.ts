/**
 * Next.js 16+ Instrumentation Hook
 * 
 * This file is automatically imported by Next.js and used to initialize
 * observability before any other code runs. It sets up OpenTelemetry and
 * Sentry for tracing, metrics, and error tracking.
 */

import { initializeObservability } from '@firm/observability'

export async function register() {
  // Get configuration from environment variables
  const serviceName = process.env.OTEL_SERVICE_NAME || 'firm-platform'
  const serviceVersion = process.env.npm_package_version || '1.0.0'
  const environment = process.env.NODE_ENV || 'development'
  const otelExporterEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
  const sentryDsn = process.env.SENTRY_DSN
  const logLevel = (process.env.LOG_LEVEL as any) || 'info'
  
  // Determine which features to enable based on environment
  const enableTracing = process.env.OTEL_TRACING_ENABLED !== 'false'
  const enableMetrics = process.env.OTEL_METRICS_ENABLED !== 'false'
  const enableErrorTracking = !!sentryDsn && process.env.SENTRY_ENABLED !== 'false'

  // Only initialize in production or when explicitly enabled
  if (environment === 'production' || process.env.OBSERVABILITY_ENABLED === 'true') {
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
      // Don't throw - allow the application to start without observability
    }
  } else {
    console.log(`[Observability] Skipping initialization in ${environment} environment`)
  }
}

// Optional: Export a function to manually trigger shutdown
export async function onExit() {
  const { shutdown } = await import('@firm/observability')
  await shutdown()
}
