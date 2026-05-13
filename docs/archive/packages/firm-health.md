# `firm-health` — Package Planning Document

**Liveness · Readiness · Startup Probes · Synthetic Correctness Verification · No External Dependencies in Liveness**

---

## 0. Purpose & Architectural Position

`firm-health` is the **single source of truth for all health‑check and readiness machinery** in the platform. It provides machinery to assess whether a service is alive, ready to serve, and functionally correct — enabling orchestrators (Kubernetes, ECS, Vercel) to make precise scheduling decisions and preventing cascading failures.

It does **not** contain business logic. It is a pure infrastructure utility that exercises the boundaries of the service and reports results in a standard format.

**Layer placement:** Layer 4 (Observability & Health), Wave 5 — built after `firm-observability`. Dependencies:
- `firm-types` – status enums, branded IDs
- `firm-observability` – structured logging and metrics for health outcomes
- `firm-env` – validated configuration for health endpoints (e.g., probe paths, synthetic user credentials)
- `firm-errors` – typed errors for failed probes

**What it owns:**

| Domain | Mechanism |
|---|---|
| Liveness probe | Returns `200 OK` if process is alive; never touches external systems; minimal latency |
| Readiness probe | Returns `200 OK` only when all required downstream dependencies (database, Redis, external APIs) are reachable and responsive |
| Startup probe | Signals whether the application has completed its startup bootstrap (e.g., migrations, cache warm‑up) |
| Synthetic checks | Admin‑triggered or scheduled checks that exercise real user journeys (login, booking flow, payment simulation) and assert correctness beyond "is it running" |
| Health report endpoint | Aggregates all probe results into a single JSON response (`/health`) with status `pass`, `warn`, or `fail` |
| Circuit breaker monitoring | Reads health reports to inform circuit state; but **never opens circuits itself** (circuit breaker management is a concern of individual adapters using `firm-observability` metrics) |

---

## 1. Immutable Rules

| Rule | Rationale |
|---|---|
| **Liveness probes must never check external dependencies.** Only internal process status (event loop, memory) is evaluated. | Prevents Kubernetes restart cascades when a downstream is transiently slow or unavailable. |
| **Readiness probes check all dependencies.** Database, Redis, third‑party APIs (via their health endpoints) must respond within a configured timeout. | A service should not receive traffic unless it can function. |
| **Startup probes report `false` until bootstrap is complete.** Bootstrapping includes: migrations applied, cache warmed, configuration loaded, critical background tasks registered. | Prevents premature traffic routing. |
| **All health outcomes are logged and emitted as metrics.** Every probe run generates a structured log line and updates a gauge metric (value 0 = fail, 1 = pass). | Enables trend analysis and alerting via `firm-observability`. |
| **The health endpoint is protected by a secret token or internal network only.** Health probes may expose sensitive dependency status; they must not be publicly accessible. | Security. |
| **Synthetic checks must never mutate production data.** They use dedicated test accounts and idempotent actions; any side‑effects are cleaned up or isolated. | Prevents data pollution. |
| **`exports` field is the sole contract boundary.** | |
| **Named exports only. No default exports.** | |

---

## 2. Probe Architecture

### 2.1 Liveness Probe

Implemented as a simple HTTP handler that returns `200 OK` immediately if the Node.js event loop is not blocked (checked via `process.nextTick` timing). No external calls are made.

```typescript
// packages/firm-health/src/probes/liveness.ts
export async function livenessProbe(): Promise<{ status: 'pass' | 'fail'; details?: string }> {
  const start = process.hrtime.bigint();
  return new Promise((resolve) => {
    process.nextTick(() => {
      const elapsed = process.hrtime.bigint() - start;
      const blocked = elapsed > 1_000_000n * 500n; // 500ms threshold
      resolve({
        status: blocked ? 'fail' : 'pass',
        details: blocked ? 'Event loop blocked' : undefined,
      });
    });
  });
}
```

**Rationale:** If `process.nextTick` takes too long, the event loop is likely blocked by a synchronous operation — the process is technically alive but unresponsive. Kubernetes should restart it.

### 2.2 Readiness Probe

The readiness probe aggregates a list of dependency checks. Each dependency is checked in parallel (with timeout) and all must pass. A dependency is a predefined function that returns a promise.

```typescript
// packages/firm-health/src/probes/readiness.ts
import { getDb, getRedis } from '...'; // depends on context

export type ReadinessCheck = {
  name: string;
  check: () => Promise<boolean>;
  timeoutMs?: number;
};

export async function readinessProbe(checks: ReadinessCheck[]): Promise<{
  status: 'pass' | 'fail';
  failures?: string[];
}> {
  const results = await Promise.allSettled(
    checks.map(async (c) => {
      const timeout = c.timeoutMs ?? 5000;
      return Promise.race([
        c.check().then((ok) => (ok ? undefined : c.name)),
        new Promise<string>((res) => setTimeout(() => res(c.name), timeout)),
      ]);
    })
  );
  const failures = results.map((r) => (r.status === 'fulfilled' ? r.value : r.reason)).filter(Boolean) as string[];
  return {
    status: failures.length === 0 ? 'pass' : 'fail',
    failures: failures.length > 0 ? failures : undefined,
  };
}
```

The readiness probe is the key differentiator from liveness: it tells the orchestrator to stop sending traffic when a critical dependency is missing.

### 2.3 Startup Probe

The startup probe is a simple boolean flag in the process (startup phase). It returns `pass` only after the application’s `startup` function has completed.

```typescript
let startupComplete = false;

export function markStartupComplete() {
  startupComplete = true;
}

export async function startupProbe(): Promise<{ status: 'pass' | 'fail' }> {
  return { status: startupComplete ? 'pass' : 'fail' };
}
```

The application must call `markStartupComplete()` after all bootstrapping. This is typically called at the end of `instrumentation.ts` (Next.js) or the worker entry point.

### 2.4 Synthetic Checks

Synthetic checks are not run automatically by the health endpoint. Instead, they are registered as functions that run a full business flow (e.g., booking a test appointment) and report whether the journey succeeds.

```typescript
import { logger } from 'firm-observability';

type SyntheticCheck = {
  name: string;
  run: () => Promise<{ success: boolean; details?: string }>;
  schedule?: string; // cron expression
};
```

A manager exposes `registerSyntheticCheck(check)` and `runSyntheticChecks()` (admin endpoint or scheduled lambda). The checks use a dedicated test tenant and test user, and clean up after themselves. They emit metrics and logs.

**Golden journey example:** `booking-flow` creates a test lead, submits a booking, verifies that the booking appears in the dashboard, and then deletes the test data. If any step fails, the check fails.

This acts as a user‑facing correctness guarantee beyond infrastructure health.

---

## 3. Health Endpoint

A single HTTP endpoint (`/health`) returns a standardized JSON response:

```json
{
  "status": "pass",
  "version": "1.2.3",
  "timestamp": "2026-05-11T10:00:00Z",
  "uptime": 12345,
  "liveness": "pass",
  "readiness": "pass",
  "startup": "pass",
  "dependencies": {
    "database": "pass",
    "redis": "pass",
    "crm-adapter": "pass"
  },
  "syntheticChecksPending": 0
}
```

If any probe fails, overall `status` becomes `fail` (or `warn` for non‑critical dependency failure, configurable). The endpoint is protected by a secret `Authorization` header.

```typescript
// packages/firm-health/src/endpoint.ts
export async function healthHandler(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (token !== getHealthSecret()) return new Response('Unauthorized', { status: 401 });

  const [liveness, readiness] = await Promise.all([livenessProbe(), readinessProbe(getReadinessChecks())]);
  return Response.json({
    status: liveness.status === 'fail' || readiness.status === 'fail' ? 'fail' : 'pass',
    liveness: liveness.status,
    readiness: readiness.status,
    dependencies: readiness.failures ? Object.fromEntries(readiness.failures.map(f => [f, 'fail'])) : {},
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: getVersion(),
    serviceId: getServiceId(),
    syntheticChecksPending: getPendingSyntheticsCount(), // optionally
  });
}
```

---

## 4. Circuit Breaker Integration

`firm-health` does **not** manage circuit breakers directly, but it provides a read‑only health status that circuit breaker logic (in adapters) can consult. The adapter’s circuit breaker reads the readiness probe’s dependency status and opens the circuit if a critical dependency is consistently reported as failed. Separation of concerns: health reports are informational; circuit decisions are taken by the business logic that consumes them.

---

## 5. Module Inventory

```
packages/firm-health/
├── src/
│   ├── index.ts                    # Public API
│   ├── probes/
│   │   ├── liveness.ts             # livenessProbe()
│   │   ├── readiness.ts            # readinessProbe(checks), defineReadinessChecks()
│   │   ├── startup.ts              # startupProbe(), markStartupComplete()
│   │   └── synthetic.ts            # SyntheticCheckManager, registerSyntheticCheck(), runSyntheticCheck()
│   ├── endpoint.ts                 # healthHandler() – HTTP handler for /health
│   ├── checks/                     # Default readiness checks (optional)
│   │   ├── database.ts             # checkDatabase()
│   │   ├── redis.ts                # checkRedis()
│   │   └── adapter-template.ts     # checkThirdParty(url)
│   ├── config.ts                   # resolve health secret, version, service ID
│   ├── types.ts                    # HealthReport, ProbeResult, ReadinessCheck, SyntheticCheck
│   └── utils.ts                    # Helper: withTimeout, etc.
├── tests/
│   ├── liveness.test.ts
│   ├── readiness.test.ts
│   ├── startup.test.ts
│   ├── synthetic.test.ts
│   └── endpoint.test.ts
├── package.json
├── README.md
└── CHANGELOG.md
```

---

## 6. Key Patterns

### 6.1 Service Health Registration

Each service declares its readiness dependencies at startup:

```typescript
import { initializeObservability } from 'firm-observability';
import { setReadinessChecks, markStartupComplete } from 'firm-health';

await initializeObservability({...});

setReadinessChecks([
  { name: 'database', check: async () => { return checkDatabase(); }, timeoutMs: 3000 },
  { name: 'redis', check: async () => { return checkRedis(); }, timeoutMs: 2000 },
]);

// ... after all bootstrapping
markStartupComplete();
```

### 6.2 Synthetic Check Registration

```typescript
import { registerSyntheticCheck } from 'firm-health';
import { logger } from 'firm-observability';

registerSyntheticCheck({
  name: 'booking-flow',
  run: async () => {
    // ... perform end‑to‑end test
    return { success: true };
  },
});
```

Synthetics can be triggered via a protected API endpoint or a cron worker (using Inngest).

### 6.3 Readiness Probe with Inngest Workers

For Inngest workers, readiness might include checks that the Inngest service is reachable and that the function handshake succeeds. A custom `checkInngest()` function is registered.

---

## 7. Package Configuration

### 7.1 `package.json`

```jsonc
{
  "name": "firm-health",
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
    "firm-observability": "workspace:*",
    "firm-env": "workspace:*",
    "firm-errors": "workspace:*"
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

### 7.2 `tsconfig.json`

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
    { "path": "../firm-observability" },
    { "path": "../firm-env" },
    { "path": "../firm-errors" }
  ]
}
```

---

## 8. Test Strategy

| Suite | Key Tests |
|---|---|
| Liveness | Event loop unblocked → `pass`; simulated long sync operation → timeout detection (or near‑timeout) |
| Readiness | All dependencies pass → `pass`; one fails → `fail`, specific failure name reported |
| Startup | Before `markStartupComplete` → `fail`, after → `pass` |
| Synthetic | Check runs and returns success; failure returns details; no data left behind |
| Endpoint | Returns correct JSON structure; auth token required; aggregation logic |
| Integration | Full `/health` endpoint with actual database/Redis mocks returning failures and successes |

---

## 9. Consumer Patterns

### 9.1 Next.js 16 Application

```typescript
// apps/client-acme/src/app/health/route.ts
import { healthHandler } from 'firm-health';

export const GET = healthHandler;
export const dynamic = 'force-dynamic';
```

### 9.2 Worker Service

```typescript
// services/crm-sync/src/server.ts
import { healthHandler } from 'firm-health';
// ... set up HTTP server (e.g., Polka, Express, or Node http) with /health route
```

### 9.3 Kubernetes Pod Configuration Example

```yaml
livenessProbe:
  httpGet:
    path: /health?probe=liveness
    port: 3000
    httpHeaders:
      - name: Authorization
        value: Bearer {{health-secret}}
readinessProbe:
  httpGet:
    path: /health?probe=readiness
    port: 3000
    httpHeaders:
      - name: Authorization
        value: Bearer {{health-secret}}
startupProbe:
  httpGet:
    path: /health?probe=startup
    port: 3000
    httpHeaders:
      - name: Authorization
        value: Bearer {{health-secret}}
```

Alternatively, the single `/health` endpoint returns all probe statuses; the orchestrator can parse JSON and evaluate the relevant field.

---

## 10. Build Order & Dependency Map

```
firm-types, firm-env, firm-errors (Layer 1)
firm-observability (Layer 4)
          ↓
    firm-health (Layer 4)
```

`firm-health` depends on `firm-observability` for logging and metrics, and on `firm-env` for health secret.

---

## 11. Interface Freeze & Governance

- After Wave 5, the health response schema and probe signatures are frozen.
- Adding a new dependency to readiness checks is minor; removing or renaming one is major.
- The liveness probe logic (event‑loop check) must remain lightweight and external‑dependency‑free; any change is major.
- Synthetic checks may be added or removed without versioning changes, but their side‑effects must be validated.
- The health endpoint security (token requirement) is immutable.

---

## 12. Documentation Requirements

- **README.md**: Overview, probe types with Kubernetes examples, integration guide, synthetic check authoring, circuit breaker advisory.
- **TSDoc** on all public exports.

---

## 13. Next Package

After `firm-health`, the next package is in Layer 5 (UI, Theming & Configuration). The package order is: `firm-tokens` (design tokens, from DTCG source), then `firm-ui` (component library), then `firm-config` (tenant configuration resolution).

We'll produce `firm-tokens` next.

---

## References

- [Kubernetes Pod Lifecycle: Liveness, Readiness, Startup Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [IETF Health Check Response Format for HTTP APIs (RFC 2782)](https://datatracker.ietf.org/doc/draft-inadarei-api-health-check/)
- [The Twelve‑Factor App: Admin Processes (for synthetic checks)](https://12factor.net/admin-processes)