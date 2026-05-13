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
