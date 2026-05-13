# `firm-observability` — Package Planning Document

**Structured Logging · Distributed Tracing · Metrics · Error Tracking · PII Redaction · W3C Trace Context · AsyncLocalStorage Propagation**

---

## 0. Purpose & Architectural Position

`firm-observability` is the **single observability layer** for every service and application in the platform. It provides a unified API for structured logging, distributed tracing, metrics collection, and error tracking — consumed by all feature packages, workers, adapters, and applications. It enforces the **mandatory three‑pillar requirement** before any service reaches production.

It does **not** contain business logic. It is a pure instrumentation wrapper around OpenTelemetry (tracing & metrics), `firm-logger` (structured logging), and the error‑tracking backend (e.g., Sentry). Application code never configures these backends directly — they use `firm-observability`’s abstractions.

**Layer placement:** Layer 4 (Observability & Health), Wave 5 — built after Layer 3 (`firm-consent`). It depends on:
- `firm-types` – `TenantId`, `UserId`, `SessionId`, branded IDs
- `firm-logger` – low‑level structured JSON logger, `AsyncLocalStorage` context store, PII redaction primitives
- `firm-env` – validated observability endpoint URLs and secrets
- `firm-errors` – error serialisation to standard shapes

**What it owns:**

| Domain | Mechanism |
|---|---|
| Structured logging | Wraps `firm-logger`; adds trace/span context, enforces mandatory fields (`correlationId`, `tenantId`, `traceId`) |
| Distributed tracing | OpenTelemetry SDK for Node.js; automatic instrumentation for HTTP, database, and Inngest; manual span creation API |
| Metrics | OpenTelemetry Metrics SDK; counters, histograms, gauges; pre‑defined platform metrics |
| Error tracking | Integration with error‑tracking backend (Sentry); automatic capture of unhandled errors; manual `captureException` |
| Context propagation | `AsyncLocalStorage`‑based store (re‑exported from `firm-logger`); ensures `correlationId`, `tenantId`, `traceId` propagate through every async operation |
| PII redaction | Built‑in redaction filters applied before any data leaves the process; CI test guarantees no PII reaches stdout or external services |
| Log sampling | Configurable sampling rates; errors/warnings always kept; high‑volume health checks sampled aggressively |
| Circuit breaker state | Read from health reports but managed separately; observability never directly opens circuits |

---

## 1. Immutable Rules

| Rule | Rationale |
|---|---|
| **All three observability pillars must be present before first production deployment.** Logs, metrics, and traces must be active and tested for every service. | Prevents blind deployments. |
| **`console.log` does not exist in production code.** Only `firm-logger` (via `firm-observability`) may produce output. | Consistent structured logging; enforced by ESLint and CI. |
| **PII redaction is unconditional.** Every log line, span attribute, and metric label is filtered. A CI test guarantees no PII leaves the process. | GDPR compliance; prevents accidental data leaks. |
| **`correlationId`, `tenantId`, `traceId` are present in every log line, span, and metric (where applicable).** | Full correlation across services. |
| **Distributed traces must connect unbroken across all execution boundaries:** browser → API → worker → adapter, including across Inngest step boundaries. | End‑to‑end visibility. |
| **Liveness probes never touch external dependencies.** (Implemented in `firm-health`, but designed here.) | Prevents cascading restarts. |
| **Health check endpoints are instrumented but sampled aggressively for logs.** | Reduces noise; errors/warnings are never sampled out. |
| **`exports` field is the sole contract boundary.** | |
| **Named exports only. No default exports.** | |

---

## 2. Three‑Pillar Architecture

### 2.1 Structured Logging

All logs are emitted through `firm-logger`, but `firm-observability` enriches them with trace and span context, and adds the mandatory context fields. The expected shape of every log line:

```json
{
  "level": "info",
  "message": "lead.created",
  "correlationId": "uuid",
  "tenantId": "uuid",
  "traceId": "uuid",
  "spanId": "uuid",
  "userId": "uuid (if available)",
  "timestamp": "ISO 8601",
  "data": {}
}
```

`firm-observability` provides a `createLogger(name: string)` function that returns a logger that automatically includes trace context from the current `AsyncLocalStorage`. This function is the only way to obtain a logger in feature packages.

### 2.2 Distributed Tracing

OpenTelemetry SDK is configured once at application startup via `initializeObservability()`. It sets up:
- **Trace exporter** (e.g., OTLP to Honeycomb, Grafana Cloud, or agency‑hosted collector)
- **Automatic instrumentation** for HTTP (fetch), PostgreSQL (using `@opentelemetry/instrumentation-pg`), Redis (`ioredis`), and Inngest (custom instrumentation via `@inngest/middleware-opentelemetry`? or manual span creation)
- **W3C Trace Context** propagation for incoming and outgoing HTTP requests

Custom spans are created using a `withSpan(name, fn)` helper.

### 2.3 Metrics

OpenTelemetry Metrics SDK provides counters, histograms, and gauges. The package defines standard metrics:

```typescript
export const platformMetrics = {
  httpRequestDuration: createHistogram('http_request_duration', { unit: 'ms' }),
  dbQueryDuration: createHistogram('db_query_duration', { unit: 'ms' }),
  cacheHitRate: createCounter('cache_hit_total'),
  rateLimitHits: createCounter('rate_limit_hits_total'),
};
```

Feature packages can define their own metrics using `createMetric()` (which registers with a central meter provider).

---

## 3. Context Propagation

The `AsyncLocalStorage` store (from `firm-logger`) carries:

```typescript
interface ObservabilityContext {
  correlationId: string; // unique per request
  tenantId: string;
  traceId: string; // W3C trace ID
  spanId: string;
  userId?: string;
  sessionId?: string;
}
```

It is set by the application entry point (Next.js `proxy.ts`, API route, or worker entry) using `runWithContext(context, fn)`. All loggers and spans created within `fn` automatically pick up these values.

For Inngest workers, the context is restored from the Inngest event’s `correlationId` and `tenantId` fields (which are embedded in every event per `firm-api-contracts`). A middleware ensures the context is propagated to each step.

---

## 4. PII Redaction

Redaction is implemented in `firm-logger`, but `firm-observability` ensures it applies to all telemetry:

- **Logs**: redaction filters are applied in `firm-logger`’s serialiser; `firm-observability` doesn’t duplicate but enforces that the logger is used.
- **Span attributes**: an OpenTelemetry `SpanProcessor` strips known PII keys and patterns before export.
- **Metric labels**: metric instruments are registered with a restricted set of allowed label keys; any unapproved label triggers a CI failure.

PII redaction test: a CI test sends a known PII value through all pillars and verifies that the output does not contain the raw value.

---

## 5. Error Tracking

The package integrates with an error‑tracking backend (Sentry). It provides:

- `initializeErrorTracking(dsn: string, options?)` – enables global error capture
- `captureException(error: FirmError)` – manually report an error with context
- `captureMessage(message: string, level: 'error' | 'warning')`

All errors thrown from `firm-errors` are automatically enriched with trace context before being sent to Sentry. The integration uses the `@sentry/node` SDK and the OpenTelemetry integration for trace linking.

---

## 6. Module Inventory

```
packages/firm-observability/
├── src/
│   ├── index.ts                   # Public API
│   ├── initialize.ts              # initializeObservability(options) – sets up all pillars
│   ├── logger.ts                  # createLogger(name) – wraps firm-logger with trace context
│   ├── tracing/
│   │   ├── tracer.ts              # getTracer(), withSpan(), context propagation helpers
│   │   ├── instrumentation.ts     # Auto-instrumentation registrations (http, pg, ioredis, inngest)
│   │   └── span-processor.ts      # PII redaction span processor
│   ├── metrics/
│   │   ├── meter.ts               # getMeter(), createCounter(), createHistogram()
│   │   ├── standard-metrics.ts    # platformMetrics (predefined)
│   │   └── label-validation.ts    # Enforces allowed metric labels
│   ├── error-tracking/
│   │   ├── sentry.ts              # initializeErrorTracking(), captureException()
│   │   └── context-injection.ts   # Enriches error events with trace/tenant context
│   ├── context/
│   │   ├── store.ts               # Re-exports AsyncLocalStorage from firm-logger; runWithContext()
│   │   └── propagation.ts         # Helper to extract context from W3C headers or Inngest events
│   ├── types.ts                   # ObservabilityContext, Logger, Span, Metric types
│   └── sampling.ts                # Log sampling configuration
├── tests/
│   ├── logger.test.ts
│   ├── tracing.test.ts
│   ├── metrics.test.ts
│   ├── error-tracking.test.ts
│   ├── pii-redaction.test.ts
│   └── integration/
│       └── full-pipeline.test.ts
├── package.json
├── README.md
└── CHANGELOG.md
```

---

## 7. Key Patterns

### 7.1 Initialization Once

Every application/service calls `initializeObservability()` once at startup:

```typescript
import { initializeObservability } from 'firm-observability';

await initializeObservability({
  serviceName: 'crm-sync-worker',
  otlpEndpoint: env.OTLP_ENDPOINT,
  sentryDsn: env.SENTRY_DSN,
  logLevel: env.LOG_LEVEL,
});
```

This sets up the OpenTelemetry SDK, error‑tracking SDK, and configures `firm-logger`. From then on, `createLogger(name)` and `getTracer()` can be used anywhere.

### 7.2 Logging with Trace Context

```typescript
import { createLogger } from 'firm-observability';
const logger = createLogger('lead-service');

await runWithContext({ correlationId, tenantId, traceId }, async () => {
  logger.info('lead.created', { leadId });
  // Output log line automatically includes correlationId, tenantId, traceId, spanId
});
```

### 7.3 Creating a Span

```typescript
import { withSpan } from 'firm-observability';

const result = await withSpan('sync-lead-to-crm', async (span) => {
  span.setAttribute('lead.id', leadId);
  // ...
});
```

### 7.4 Recording Metric

```typescript
import { platformMetrics } from 'firm-observability';

platformMetrics.httpRequestDuration.record(durationMs, { route: '/api/leads', status: '200' });
```

### 7.5 Capturing Error

```typescript
try {
  // ...
} catch (err) {
  captureException(err); // automatically enriched with context
}
```

### 7.6 Inngest Context Propagation

When an Inngest function receives an event, it reconstructs the observability context:

```typescript
import { runWithContext, extractContextFromInngest } from 'firm-observability';

export const handleLeadSync = inngest.createFunction(
  { id: 'lead-sync-handler' },
  { event: 'lead/synced' },
  async ({ event }) => {
    const ctx = extractContextFromInngest(event); // reads correlationId, tenantId from event data
    return runWithContext(ctx, async () => {
      // ... business logic; all logs/spans are correlated
    });
  }
);
```

---

## 8. Package Configuration

### 8.1 `package.json`

```jsonc
{
  "name": "firm-observability",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts --sourcemap",
    "typecheck": "tsc --build --noEmit",
    "lint": "eslint src/ tests/",
    "test": "vitest run --coverage"
  },
  "dependencies": {
    "firm-types": "workspace:*",
    "firm-logger": "workspace:*",
    "firm-env": "workspace:*",
    "firm-errors": "workspace:*",
    "@opentelemetry/api": "^1.9.0",
    "@opentelemetry/sdk-node": "^0.57.0",
    "@opentelemetry/instrumentation-http": "^0.57.0",
    "@opentelemetry/instrumentation-pg": "^0.50.0",
    "@opentelemetry/instrumentation-ioredis": "^0.47.0",
    "@opentelemetry/exporter-trace-otlp-http": "^0.57.0",
    "@opentelemetry/exporter-metrics-otlp-http": "^0.57.0",
    "@sentry/node": "^9.0.0",
    "uuid": "catalog:"
  },
  "devDependencies": {
    "firm-config-typescript": "workspace:*",
    "firm-config-eslint": "workspace:*",
    "tsup": "catalog:",
    "vitest": "catalog:",
    "typescript": "catalog:"
  },
  "sideEffects": false
}
```

### 8.2 `tsconfig.json`

```jsonc
{
  "extends": "firm-config-typescript/base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  },
  "include": ["src", "tests"],
  "exclude": ["dist", "node_modules"],
  "references": [
    { "path": "../firm-types" },
    { "path": "../firm-logger" },
    { "path": "../firm-env" },
    { "path": "../firm-errors" }
  ]
}
```

---

## 9. Test Strategy

| Suite | Key Tests |
|---|---|
| Logger | Log lines include trace context, mandatory fields, no console.log used |
| Tracing | Spans are exported with correct attributes, parent‑child links work across async boundaries |
| Metrics | Counters increment, histograms record, labels are validated |
| Error Tracking | Exceptions are sent, context injected, sampling works |
| PII Redaction (critical) | Send known PII through all pillars, verify none appears in exported payloads; CI blocks on failure |
| Context propagation | `runWithContext` sets store, nested spans get correct `traceId`; extraction from Inngest events is correct |
| Integration | Full pipeline: a simulated request creates logs, spans, metrics, and error events with consistent correlation IDs |

Integration tests may need a local OTLP collector or mock endpoints. CI spins up a temporary collector.

---

## 10. Consumer Patterns

### 10.1 Next.js 16 `instrumentation.ts`

```typescript
// apps/client-acme/instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await initializeObservability({
      serviceName: 'client-acme',
      otlpEndpoint: process.env.OTLP_ENDPOINT!,
      sentryDsn: process.env.SENTRY_DSN,
      logLevel: 'info',
    });
  }
}
```

### 10.2 Worker Entry Point

```typescript
// services/crm-sync/src/index.ts
import { initializeObservability } from 'firm-observability';
await initializeObservability({ serviceName: 'crm-sync', ... });
```

### 10.3 Using Logger and Spans

```typescript
import { createLogger, withSpan } from 'firm-observability';
const logger = createLogger('lead-routes');

export async function getLead(id: string) {
  return withSpan('get-lead', async (span) => {
    span.setAttribute('lead.id', id);
    logger.info('fetching lead', { id });
    // ...
  });
}
```

---

## 11. Build Order & Dependency Map

```
firm-types, firm-env, firm-errors, firm-logger (Layer 1)
                  ↓
firm-observability (Layer 4) ← depends on above
```

`firm-observability` must be built after `firm-logger` and the other Layer 1 packages.

---

## 12. Interface Freeze & Governance

- After Wave 5, the `initializeObservability()` options are frozen. Adding a new exporter or integration is a minor change; altering the mandatory context fields is major.
- The PII redaction CI test is **immutable and unconditional** – any PR that breaks it is rejected.
- All three pillars must be active in CI staging environment before deployment is allowed; a deployment gate checks for their presence.
- `console.log` usage in feature packages is blocked by ESLint; `firm-observability`’s logger is the only allowed output.

---

## 13. Documentation Requirements

- **README.md**: Setup guide, three‑pillar overview, context propagation mechanics, PII redaction rules, CI enforcement, migration from previous observability tools.
- **TSDoc** on all public APIs.

---

## 14. Next Package

After `firm-observability`, the next Layer 4 package is **`firm-health`** — liveness, readiness, startup probes, synthetic correctness verification.

---

## References

- [OpenTelemetry JavaScript SDK](https://opentelemetry.io/docs/languages/js/)
- [W3C Trace Context](https://www.w3.org/TR/trace-context/)
- [@sentry/node documentation](https://docs.sentry.io/platforms/javascript/guides/node/)
- [Inngest OpenTelemetry Middleware](https://www.inngest.com/docs/middleware-opentelemetry)