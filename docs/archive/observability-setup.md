# Observability Setup Guide

This guide explains how to set up observability (OpenTelemetry + Sentry) in Firm Platform applications using the `@firm/observability` package.

## Overview

The observability system provides:
- **Tracing**: OpenTelemetry distributed tracing
- **Metrics**: OpenTelemetry metrics collection
- **Error Tracking**: Sentry error monitoring
- **Structured Logging**: Pino-based JSON logging

## Quick Setup

### 1. Environment Variables

Add these environment variables to your application:

```bash
# OpenTelemetry Configuration
OTEL_SERVICE_NAME=your-app-name
OTEL_EXPORTER_OTLP_ENDPOINT=https://your-otel-collector.com
OTEL_TRACING_ENABLED=true
OTEL_METRICS_ENABLED=true

# Sentry Configuration
SENTRY_DSN=https://your-sentry-dsn
SENTRY_ENABLED=true

# Logging
LOG_LEVEL=info

# Enable observability (set to 'true' to force enable in non-production)
OBSERVABILITY_ENABLED=true
```

### 2. Application Setup

#### For Next.js Applications:

1. **Copy the Next.js configuration:**
   ```bash
   cp next.config.template.js next.config.js
   ```

2. **Create instrumentation.ts** (if not using the root-level one):
   ```typescript
   import { initializeObservability } from '@firm/observability'

   export async function register() {
     const serviceName = process.env.OTEL_SERVICE_NAME || 'my-app'
     const serviceVersion = process.env.npm_package_version || '1.0.0'
     const environment = process.env.NODE_ENV || 'development'
     
     initializeObservability({
       serviceName,
       serviceVersion,
       environment,
       otelExporterEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
       sentryDsn: process.env.SENTRY_DSN,
       enableTracing: true,
       enableMetrics: true,
       enableErrorTracking: !!process.env.SENTRY_DSN,
     })
   }
   ```

#### For Node.js Applications:

```typescript
import { initializeObservability } from '@firm/observability'

// Initialize at application startup
initializeObservability({
  serviceName: 'my-app',
  serviceVersion: '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  otelExporterEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  sentryDsn: process.env.SENTRY_DSN,
})
```

## Usage Examples

### Logging

```typescript
import { getLogger } from '@firm/observability'

const logger = getLogger()

logger.info('User logged in', { userId: '123', ip: '192.168.1.1' })
logger.error('Database connection failed', { error: err.message })
```

### Tracing

```typescript
import { withSpan, createSpan } from '@firm/observability'

// Automatic span management
const result = await withSpan('database-query', async (span) => {
  span.setAttributes({ query: 'SELECT * FROM users' })
  return await db.query('SELECT * FROM users')
})

// Manual span management
const span = createSpan('manual-operation')
try {
  // Do work
  span.setAttributes({ recordsProcessed: 100 })
} catch (error) {
  span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
  throw error
} finally {
  span.end()
}
```

### Metrics

```typescript
import { platformMetrics, createCounter } from '@firm/observability'

// Use predefined metrics
platformMetrics.httpRequestsTotal.add(1, { 
  method: 'GET', 
  route: '/api/users', 
  status: '200' 
})

// Create custom metrics
const userCounter = createCounter('users_registered_total', 'Total registered users')
userCounter.add(1)
```

### Error Tracking

```typescript
import { captureException, setUser } from '@firm/observability'

try {
  // Risky operation
  await riskyOperation()
} catch (error) {
  // Set user context
  setUser({ id: '123', email: 'user@example.com' })
  
  // Capture exception
  captureException(error, {
    tags: { component: 'user-service' },
    extra: { userId: '123' }
  })
}
```

## Environment-Specific Behavior

### Development
- Observability is disabled by default
- Set `OBSERVABILITY_ENABLED=true` to enable for testing
- Console logging is used instead of structured logs

### Production
- Observability is automatically enabled
- All tracing, metrics, and error tracking are active
- Structured JSON logging is enabled

### Testing
- Observability is disabled to avoid noise in tests
- Mock implementations can be used for unit testing

## Configuration Options

The `initializeObservability` function accepts these options:

```typescript
interface ObservabilityOptions {
  serviceName: string          // Required: Service name for tracing
  serviceVersion: string      // Required: Service version
  environment: string          // Required: Environment (development/production)
  otelExporterEndpoint?: string // OpenTelemetry collector endpoint
  sentryDsn?: string          // Sentry DSN for error tracking
  logLevel?: pino.LevelWithSilent // Logging level (default: 'info')
  enableTracing?: boolean     // Enable OpenTelemetry tracing (default: true)
  enableMetrics?: boolean     // Enable OpenTelemetry metrics (default: true)
  enableErrorTracking?: boolean // Enable Sentry error tracking (default: true)
}
```

## Verification

### Check Initialization Status

```typescript
import { isObservabilityInitialized } from '@firm/observability'

if (isObservabilityInitialized()) {
  console.log('Observability is active')
}
```

### Test Tracing

```typescript
import { withSpan } from '@firm/observability'

// This should create a trace that appears in your OpenTelemetry backend
await withSpan('test-operation', async () => {
  console.log('This operation should be traced')
})
```

### Test Error Tracking

```typescript
import { captureException } from '@firm/observability'

// This should create an event in Sentry
captureException(new Error('Test error for verification'))
```

## Troubleshooting

### Common Issues

1. **Observability not initializing**
   - Check environment variables are set
   - Ensure `OBSERVABILITY_ENABLED=true` in development
   - Verify instrumentation.ts is in the correct location

2. **Missing traces in OpenTelemetry**
   - Verify `OTEL_EXPORTER_OTLP_ENDPOINT` is correct
   - Check network connectivity to collector
   - Ensure `OTEL_TRACING_ENABLED=true`

3. **Missing errors in Sentry**
   - Verify `SENTRY_DSN` is correct
   - Check `SENTRY_ENABLED=true`
   - Ensure `enableErrorTracking=true` in options

4. **TypeScript errors**
   - Ensure `@firm/observability` is installed
   - Check workspace dependencies are resolved

### Debug Mode

Enable debug logging to troubleshoot issues:

```bash
DEBUG=@opentelemetry/* npm run dev
```

## Production Deployment

### Required Environment Variables

```bash
# Minimum required for production
OTEL_SERVICE_NAME=your-app
OTEL_EXPORTER_OTLP_ENDPOINT=https://your-collector.com
SENTRY_DSN=https://your-sentry-dsn
NODE_ENV=production
```

### Health Checks

The observability system includes health checks that can be used in your monitoring:

```typescript
import { isObservabilityInitialized } from '@firm/observability'

app.get('/health/observability', (req, res) => {
  res.json({
    observability: isObservabilityInitialized(),
    timestamp: new Date().toISOString()
  })
})
```

## Best Practices

1. **Initialize Early**: Call `initializeObservability()` before any other code
2. **Use Structured Logging**: Always log objects, not strings
3. **Add Context**: Include relevant context in logs and traces
4. **Handle Errors Gracefully**: Don't let observability failures crash your app
5. **Monitor Costs**: Be mindful of tracing and error tracking volume in production
