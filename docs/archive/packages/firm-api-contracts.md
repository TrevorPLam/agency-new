# `firm‑api‑contracts` — Package Planning Document

**Event Registry · tRPC Route Contracts · OpenAPI 3.1 · RFC 7807 Errors · Consumer‑Driven Contract Tests**

---

## 0. Purpose & Architectural Position

`firm‑api‑contracts` is the **single source of truth for all API communication shapes** — the typed envelopes that every producer and consumer agrees on before a single line of implementation is written. It contains **no implementation** — only Zod schemas, TypeScript types, and the governance layer that enforces consistency across all services.

**Layer placement:** Layer 2, Wave 3 — third package built, after `firm‑validators`. It depends on both `firm‑types` (branded IDs, entity interfaces) and `firm‑validators` (canonical Zod schemas).

**What it owns:**

| Domain | Mechanism |
|---|---|
| Inngest event payload schemas | `EVENT_REGISTRY` — centralized governance layer |
| tRPC route input/output contracts | Typed Zod schemas shared between `firm‑api` (server) and all React clients |
| REST/OpenAPI definitions | Generated from Zod schemas via `@asteasolutions/zod‑to‑openapi` v8.x |
| Error response shapes | RFC 7807 Problem Details — shape defined here, implemented by `firm‑errors` |
| Pagination envelopes | Offset‑based (admin dashboards) and cursor‑based (high‑volume lists) |

---

## 1. Immutable Rules

| Rule | Rationale |
|---|---|
| **No implementation code.** This package contains only schemas, types, and registry definitions. | Contracts are pure shapes. tRPC routers, Inngest workers, and API route handlers implement them elsewhere. |
| **Every Inngest event is registered in `EVENT_REGISTRY` before any service can emit it.** Unregistered event names fail CI. | Prevents typo‑driven production incidents and ensures payload shape consistency. |
| **Every tRPC route contract is defined here as a Zod schema.** Server routers and client proxies both import from `firm‑api‑contracts`. | Single source of truth for all internal API shapes. |
| **All REST/public API schemas generate OpenAPI 3.1 documentation.** CI uses `oasdiff` to detect breaking changes. | Drift prevention — the spec is never out of date. 300+ change detection rules cover breaking, deprecation, and addition.  |
| **URI path versioning for REST endpoints** (`/api/v1/leads`, `/api/v2/leads`) with a 12‑month deprecation window. | The industry standard: ~70% of public APIs use URL path versioning.  |
| **All deprecated REST endpoints return `Deprecation`, `Sunset`, and `Link` headers.** | RFC 9745 (Deprecation) and RFC 8594 (Sunset) provide machine‑readable deprecation signals.  |
| **All error responses follow RFC 7807 Problem Details.** | The `ErrorResponse` shape is defined here; `firm‑errors` implements it; tRPC endpoints exposed externally transform to this shape via middleware. |
| **Named exports only.** No default exports. | Consistent import patterns. |
| **`exports` field is the contract boundary.** | Internal refactoring invisible to consumers. |

---

## 2. Hybrid API Strategy

The platform uses each paradigm where it excels:

| Paradigm | Scope | Implementation |
|---|---|---|
| **tRPC** | All internal TypeScript‑to‑TypeScript communication | Route contracts defined here; consumed by `firm‑api` (server) and all React clients via shared `AppRouter` type. tRPC v11 stable with async generator subscriptions.  |
| **REST + OpenAPI 3.1** | Public endpoints, webhooks, third‑party integrations | Generated from the same Zod schemas; OpenAPI spec published at `docs.[agency-domain].com/api/` rendered with Scalar.  |
| **Inngest Events** | Background job orchestration, service‑to‑service communication | Registered in `EVENT_REGISTRY`; consumed by all `services/*‑worker/` packages via Inngest SDK v4 `eventType()`.  |

This mirrors the 2026 industry architecture: "tRPC for internal type safety, REST for external/public consumers, events for asynchronous choreography." A real‑world migration documented at OpenStatus (Feb 2026) describes exactly this pattern: *"We maintain tRPC for ourselves and REST for everyone else... The result? The 'Split Stack' problem."*  — which this unified contract layer solves.

---

## 3. Module Inventory

```
src/
├── index.ts              # Single public door — named re‑exports only
├── events/
│   ├── base.ts           # Base event envelope (id, name, tenantId, correlationId, timestamp, v)
│   ├── registry.ts       # EVENT_REGISTRY + createTypedEvent() — the governance layer
│   ├── form.ts           # form.submitted, form.abandoned
│   ├── email.ts          # email.sent, email.bounced, email.unsubscribed
│   ├── crm.ts            # lead.synced, lead.sync‑failed
│   ├── booking.ts        # booking.created, booking.cancelled, booking.reminded
│   ├── report.ts         # report.generated, report.requested
│   ├── retention.ts      # retention.job‑due, retention.job‑completed
│   ├── compliance.ts     # data.erasure‑requested, data.erasure‑completed
│   ├── ai.ts             # ai.generation‑started, ai.generation‑completed
│   └── billing.ts        # invoice.created, payment.succeeded, payment.failed
├── routes/
│   ├── leads/            # v1.ts, v2.ts, index.ts
│   ├── tenants.ts
│   ├── campaigns.ts
│   ├── analytics.ts
│   ├── bookings.ts
│   └── invoices.ts
├── responses/
│   ├── pagination.ts     # PaginatedResponse<T> — offset‑based
│   ├── cursor.ts         # CursorPaginatedResponse<T> — cursor‑based (default for new endpoints)
│   └── errors.ts         # ErrorResponse — RFC 7807 Problem Details shape
├── openapi.ts            # Aggregates all route schemas → OpenAPI 3.1 document
└── native/               # Future: native auth, sync schemas (added at native app launch)
```

---

## 4. Key Patterns

### 4.1 The Base Event Envelope

Every Inngest event inherits from a shared base schema:

---

## 12. CNIL Email Tracking Consent Schema

### 12.1 Consent Schema Addition

```typescript
// CNIL email tracking consent schema - add to base contact/lead form schemas
const consentSchema = z.object({
  marketing: z.boolean(),          // existing consent to receive marketing emails
  emailTracking: z.object({
    performanceAnalytics: z.boolean(),  // pixel for campaign optimisation
    personalisation: z.boolean(),       // pixel for tailoring content
    profiling: z.boolean(),             // pixel for building interest profiles
  }).optional(),
});

// Updated contact form schema with CNIL compliance
const contactFormSchema = z.object({
  // ... existing fields ...
  marketing: z.boolean().default(false),
  emailTracking: consentSchema,
});
```

### 12.2 Implementation Notes

- **Separate consent:** Email tracking consent must be collected separately from marketing consent
- **Granular options:** Recipients can consent to individual tracking purposes  
- **Collection timing:** Consent captured at email address collection time
- **Territory detection:** Forms automatically detect French recipients and apply CNIL rules
- **Storage:** Consent flags stored with `consentedAt` timestamp for audit trail

**Related:** [CNIL Email Tracking Pixel Compliance](../features/cnil-email-pixels.md)

```typescript
// src/events/base.ts
import * as z from 'zod';

const baseEventSchema = z.object({
  id:            z.string().uuid(),           // Inngest deduplication key
  name:          z.string(),                  // Event name (e.g., "form/submitted")
  tenantId:      z.string().uuid(),           // Tenant isolation
  correlationId: z.string().uuid(),           // Propagated from originating request context
  timestamp:     z.iso.datetime(),            // Event creation time
  v:             z.string().default('1'),     // Schema version (aligns with Inngest convention) 
});

export function defineEvent<T extends z.ZodObject<z.ZodRawShape>>(
  name: string,
  dataSchema: T,
) {
  return baseEventSchema.extend({
    name: z.literal(name),
    data: dataSchema,
  });
}
```

Key decisions:
- **`v` (not `version`)**: The field is named `v` to match Inngest's event payload convention: `v?: string; // Optional: schema version`. Migration workers consume this field.
- `correlationId` propagates from the originating HTTP request through all downstream events — enabling end‑to‑end traceability (see Layer 4).
- `tenantId` is embedded in every event payload — no worker needs to look it up.

### 4.2 Event Naming Convention

The platform adopts Inngest's recommended **Object-Action pattern**:

| Pattern | Example | Notes |
|---|---|---|
| `{domain}/{noun}.{verb}` | `billing/invoice.paid` | Inngest official recommendation |
| `{domain}/{noun}.{verb}` | `user/profile.updated` | Past tense verb |
| `{domain}/{noun}.{verb}` | `form/submission.created` | Domain‑scoped |

No underscores, no camelCase. Every event name must be registered in `EVENT_REGISTRY` before any service can emit it. Enforced by CI.

### 4.3 The Event Registry — Centralized Governance

Despite Inngest SDK v4's **decentralized** `eventType()` model, the platform enforces a **centralized** `EVENT_REGISTRY`. This is an explicit architectural tradeoff:

```typescript
// src/events/registry.ts
import { formSubmittedEvent, formAbandonedEvent } from './form';
import { leadSyncedEvent, leadSyncFailedEvent } from './crm';
// ... all events imported

export const EVENT_REGISTRY = {
  'form/submitted':          formSubmittedEvent,
  'form/abandoned':          formAbandonedEvent,
  'lead/synced':             leadSyncedEvent,
  'lead/sync.failed':        leadSyncFailedEvent,
  'email/sent':              emailSentEvent,
  'data/erasure.requested':  dataErasureRequestedEvent,
  'booking/created':         bookingCreatedEvent,
  // Every event registered here before any service can use it
} as const;

export type EventName = keyof typeof EVENT_REGISTRY;
export type EventPayload<T extends EventName> = z.infer<typeof EVENT_REGISTRY[T]>;

export function createTypedEvent<T extends EventName>(
  name: T,
  data: EventPayload<T>,
) {
  return { name, data, id: crypto.randomUUID() };
}
```

**Why centralized?** Inngest SDK v4 *"removes EventSchemas entirely and replaces it with eventType(), a helper that defines event types alongside your functions."*  For a monorepo with 80+ adapters, 20+ workers, and 200+ client apps, the risk of event name typos and payload shape drift across packages is too high to leave to decentralized definitions. The registry provides:

- **Compile‑time guard:** `createTypedEvent('form/submitted', data)` fails if the name is not in the registry.
- **CI validation:** `scripts/validate‑event‑registry.ts` scans all worker packages and fails the build if any emitted event name is not registered.
- **Single discovery surface:** Developers find all available events in one place.

**What's implicitly registered:** Inngest system events (`inngest/function.failed`, `inngest/function.completed`) do not require entries in `EVENT_REGISTRY`. The registry governs only application‑defined events.

Workers use Inngest v4's `eventType()` at their definition site, passing registry‑derived schemas:

```typescript
import { eventType } from 'inngest';
import { EVENT_REGISTRY } from 'firm‑api‑contracts';

const formSubmitted = eventType('form/submitted', {
  schema: EVENT_REGISTRY['form/submitted'],
});
```

### 4.4 Event Schema Evolution

When a breaking change to an event schema occurs, the registry must support both versions simultaneously, following the same pattern as `firm‑validators` schema versioning. Research confirms this as the essential strategy: *"Parallel event types and migration trade-offs when event contracts evolve."* 

| Phase | Action |
|---|---|
| 1. **Expand** | Register `form/submitted.v1` (legacy) and `form/submitted.v2` (new) in `EVENT_REGISTRY`. Producer emits the new version. |
| 2. **Coexist** | Both old‑version and new‑version consumers run simultaneously. Migration workers can transform v1 → v2 events. |
| 3. **Drain** | When all consumers migrate and dead‑letter queues are drained, remove `form/submitted.v1` from the registry. |

### 4.5 tRPC Route Contracts

Route contracts are defined as Zod schemas — **not** as tRPC routers (which contain implementation):

```typescript
// src/routes/leads/v2.ts
import * as z from 'zod';
import { leadSchemaV2 } from 'firm‑validators';

export const createLeadInputV2 = z.object({
  firstName: z.string().min(1).max(200),
  email:    z.email(),
  phone:    z.string().optional(),
  source:   z.enum(['website', 'referral', 'ads', 'social', 'other']),
});

export const createLeadOutputV2 = leadSchemaV2;

// OpenAPI metadata (used by src/openapi.ts)
export const createLeadRouteV2 = {
  method: 'POST' as const,
  path: '/api/v2/leads',
  summary: 'Create a new lead',
  tags: ['Leads'],
  input: createLeadInputV2,
  output: createLeadOutputV2,
};
```

**Error handling:** Domain errors from `firm‑errors` map to `TRPCError` codes through shared middleware (`NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`). Internal tRPC endpoints use tRPC's native error format. For any tRPC endpoint exposed externally, middleware transforms errors into RFC 7807 shape with `Content‑Type: application/problem+json`.

**Subscriptions:** tRPC v11 supports real‑time procedures via async generators. *"tRPC v11 uses async generators for subscriptions, making real-time features straightforward."*  Subscription contracts follow the same pattern as query/mutation contracts — they accept Zod input/output schemas and are included in the `AppRouter` type export:

```typescript
// Example subscription contract (for platform‑booking, platform‑crm, platform‑analytics)
export const bookingUpdatesSubscription = {
  type: 'subscription' as const,
  path: 'booking.updates',
  input: z.object({ tenantId: z.string().uuid() }),
  output: bookingChangedEvent,
};
```

### 4.6 OpenAPI 3.1 Generation

`src/openapi.ts` compiles every annotated route into a single OpenAPI 3.1 document:

```typescript
// src/openapi.ts
import { OpenAPIRegistry } from '@asteasolutions/zod‑to‑openapi';
import * as z from 'zod';
import { createLeadRouteV2 } from './routes/leads/v2';
// ... all routes imported

const registry = new OpenAPIRegistry();

registry.registerPath(createLeadRouteV2);
// ... all routes registered

export const openApiDocument = registry.generateDocument({
  openapi: '3.1.0',
  info: {
    title: 'Firm Platform API',
    version: '2.0.0',
  },
});
```

**`@asteasolutions/zod‑to‑openapi` v8.x** is the canonical library for Zod v4 OpenAPI generation. v8.0.0 added: *"Zod v4 support. With zod's new option for generating JSON schemas and maintaining registries we've added a pretty much seamless support for all metadata information coming from `.meta`."*  v8.1.0 improved *"Zod v4 type compatibility in module augmentation."* 

**`.meta()` is now the recommended approach.** For simple schemas, `.meta()` alone provides sufficient metadata for OpenAPI generation — `extendZodWithOpenApi(z)` and `.openapi()` are only required for registering parameter metadata (query, header, path params) and schema extension scenarios. The native `z.toJSONSchema()` first‑party feature (Zod v4) is used internally by the library. The deprecated `zod-to-json-schema` external package is no longer needed.

#### Optional: OpenAPI `webhooks` Section

OpenAPI 3.1 introduced a top‑level `webhooks` field for documenting incoming webhook payloads: *"OpenAPI 3.1 documentation may include paths and/or webhooks."*  This is reserved for future use — populated by adapter package schemas (from `firm‑validators/src/webhooks/`) when that directory is created.

### 4.7 Breaking Change Detection with `oasdiff`

CI uses `oasdiff` — the industry‑standard tool for OpenAPI spec comparison: *"Compares two OpenAPI spec files and reports breaking changes, deprecations, and additions. 300+ change detection rules. Best for: CI pipelines. Free, open source. 1M+ downloads, 1,100+ GitHub stars."* 

The CI workflow:
1. `pnpm openapi:generate` regenerates `openapi.json`.
2. `oasdiff breaking openapi.json.prev openapi.json --fail-on ERR` checks for breaking changes.
3. If breaking changes are detected without a corresponding version bump, CI fails.

A GitHub Action is available for native integration. 

### 4.8 OpenAPI Documentation Hosting

The generated `openapi.json` is served from `docs.[agency-domain].com/api/openapi.json` and rendered with **Scalar** — the preferred OpenAPI UI in 2026: *"Better UI, native dark mode, and seamless integration... It's faster, better looking, and supports dark mode out of the box. Migration takes 5 minutes."*  Scalar supports CDN‑only embed with a single `<script>` tag pointing at the `openapi.json` URL.

### 4.9 REST API Deprecation Strategy

Deprecated endpoints (`/api/v1/*`) must return three standard HTTP headers on every response:

```http
Deprecation: @1761955200
Sunset: Sat, 01 Jun 2026 00:00:00 GMT
Link: <https://docs.agency.com/migration/v1-to-v2>; rel="deprecation"
```

Research confirms: *"Standard practices include sending Deprecation and Sunset HTTP headers, attaching Link headers with a rel value pointing to the migration guide."*  The `versionkit` npm package provides framework‑agnostic auto‑injection of these headers, supporting *"RFC 8594 (Sunset header), RFC 9745 (Deprecation header), and three version extraction strategies."* 

The `Sunset` header value uses an RFC 9651 Date (Unix timestamp). `Deprecation` is set to `true` for already‑deprecated endpoints, or a future timestamp for pre‑announced deprecations.

### 4.10 RFC 7807 Error Response Shape

```typescript
// src/responses/errors.ts
import * as z from 'zod';

export const errorResponseSchema = z.object({
  type:      z.string().url().meta({ description: 'URI identifying the error category' }),
  title:     z.string().meta({ description: 'Short, human‑readable summary' }),
  status:    z.number().int().min(100).max(599).meta({ description: 'HTTP status code' }),
  detail:    z.string().meta({ description: 'Human‑readable explanation' }),
  instance:  z.string().optional().meta({ description: 'Request path' }),
  traceId:   z.string().meta({ description: 'Correlation ID for debugging' }),
  timestamp: z.iso.datetime().meta({ description: 'When the error occurred' }),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
```

HTTP responses with errors **must** set `Content‑Type: application/problem+json`. `firm‑errors` (Layer 1) serializes `FirmError` instances to this shape.

### 4.11 Consumer‑Driven Contract Tests

For **public REST APIs**, Pact is the framework: *"Pact is a consumer-driven contract testing tool, which is a fancy way of saying that the API Consumer writes a test to set out its assumptions and needs of its API Provider(s)."*  Pact JS v16.2.0 (Feb 2026) supports bidirectional contract testing with V4 Pacts including both HTTP and non‑HTTP interactions. 

For **internal tRPC APIs**, compile‑time type verification via the shared `AppRouter` type is sufficient. No runtime contract tests are needed. Research confirms: *"The complete absence of code generation step in tRPC reduced our CI/CD pipeline time by 40% and eliminated the entire category of build‑time failures caused by schema mismatches."*

### 4.12 External REST Client Generation

External consumers generate typed clients from the published `openapi.json`. The agency does not publish client SDKs — the spec is the contract. The recommended toolchain: *"Use openapi‑typescript with openapi‑fetch for a lightweight, fetch‑based setup, or Orval for generated TanStack Query hooks and full client SDKs."*  Steve Kinney confirms: *"Using openapi‑fetch with generated TypeScript types creates a super easy, type-safe API client."* 

### 4.13 AI Coding Agents as API Spec Consumers

The `openapi.json` and `EVENT_REGISTRY` serve as machine‑readable contracts for AI coding agents (Claude Code, Cursor, Copilot). Morgan Stanley confirmed at QCon London 2026: *"The Model Context Protocol (MCP) has gone from obscurity to industry standard in roughly eighteen months, fundamentally changing who, or what, is consuming your APIs."* Cloudflare's production MCP server demonstrates the pattern: *"Agents first use search() to query the OpenAPI spec... reducing the token footprint of interacting with over 2,500 API endpoints from more than 1.17 million tokens to roughly 1,000 tokens."*

The `ai‑context/` directory (see `AGENTS.md`) should include `openapi.json` in its file inventory. The event registry provides a single discoverable index for AI agents constructing background job workflows.

---

## 5. Pagination Strategy

| Pattern | File | Response Shape | Use Case |
|---|---|---|---|
| **Offset‑based** | `responses/pagination.ts` | `{ data: T[], total: number, page: number, pageSize: number }` | Admin dashboards (≤10K rows, jump‑to‑page navigation) |
| **Cursor‑based** | `responses/cursor.ts` | `{ data: T[], nextCursor: string \| null }` | **Default for new endpoints.** High‑volume lists, native apps, real‑time feeds |

Cursor‑based pagination is the default for all new list endpoints — consistent with Stripe, GitHub, and other API design leaders. Offset‑based is reserved only for admin dashboards where jump‑to‑page navigation is required.

---

## 6. API Route Versioning

| Paradigm | Strategy |
|---|---|
| **tRPC** | Type evolution. Backward‑compatible changes are free. Breaking changes: new procedure name (`getLeadV2`) or new router. Compile‑time detection. |
| **REST** | URI path versioning: `/api/v1/leads`, `/api/v2/leads`. Old versions maintained for 12‑month deprecation window with standard deprecation headers. |
| **Inngest Events** | `v` field in base envelope + multi‑version `EVENT_REGISTRY` registration during migration. |

URI path versioning is the confirmed industry standard: *"URL-path versioning wins on simplicity and tooling, which is why roughly 70% of public APIs (Stripe, GitHub, Twilio) use it."* 

---

## 7. Package Configuration

### 7.1 `package.json`

```jsonc
{
  "name": "firm‑api‑contracts",
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
    "test": "vitest run --coverage",
    "test:watch": "vitest",
    "openapi:generate": "tsx src/openapi.ts > openapi.json",
    "openapi:check": "oasdiff breaking openapi.json.prev openapi.json --fail-on ERR"
  },
  "dependencies": {
    "firm‑types": "workspace:*",
    "firm‑validators": "workspace:*",
    "zod": "catalog:",
    "@asteasolutions/zod‑to‑openapi": "catalog:"
  },
  "devDependencies": {
    "firm‑config‑typescript": "workspace:*",
    "firm‑config‑eslint": "workspace:*",
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
  "extends": "firm‑config‑typescript/base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  },
  "include": ["src", "tests"],
  "exclude": ["dist", "node_modules"],
  "references": [
    { "path": "../firm‑types" },
    { "path": "../firm‑validators" }
  ]
}
```

---

## 8. Test Strategy

### 8.1 Test Categories

| Category | Scope | Framework | Example |
|---|---|---|---|
| **Schema validation** | Every route input/output | Vitest | Accepts valid, rejects invalid |
| **Event registry** | Every registered event | Vitest | Payload matches base envelope + data schema |
| **Contract tests (REST)** | Public REST endpoints | Pact | Consumer‑driven: verifies provider shapes match expectations |
| **Breaking change detection** | OpenAPI spec | `oasdiff` in CI | Detects breaking changes before merge |
| **Compile‑time (tRPC)** | All tRPC routes | TypeScript | `AppRouter` type is consumable without runtime tests |

### 8.2 CI Integration

| Gate | Command | What It Enforces |
|---|---|---|
| **Event Registry** | `scripts/validate‑event‑registry.ts` | Every event emitted in any worker is registered |
| **OpenAPI Breaking Changes** | `pnpm openapi:check` | `oasdiff` detects breaking spec changes |
| **Adapter Interface** | `scripts/validate‑adapters.ts` | All adapters implement `firm‑types` interfaces |

---

## 9. Build Order & Dependency Map

```
firm‑types (Layer 2, Wave 3 — built first)
      │
      ├── firm‑validators (built second)
      │       │
      │       └── firm‑api‑contracts (this package — built third)
      ├── firm‑db (depends on firm‑types + firm‑validators)
      └── firm‑cache (depends on firm‑types only)

firm‑api‑contracts ──► consumed by firm‑api (Layer 6), all Inngest workers,
                         OpenAPI consumers, and AI coding agents
```

---

## 10. Interface Freeze & Governance

- After Wave 3, event names in `EVENT_REGISTRY` cannot be renamed without a major version bump and migration path.
- **Adding** a new event, route, or optional field → **minor**.
- **Removing** an event, route field, or changing a field's type → **major**, with versioning.
- CI blocks any PR that emits an unregistered event name or introduces a breaking OpenAPI change without a version bump.

---

## 11. Documentation Requirements

- **README.md**: Purpose, Event Registry reference, Route contract reference, OpenAPI generation instructions, Scalar UI integration.
- **TSDoc comments** on every exported schema with `@example` blocks.
- **Event registry is self‑documenting** — the `EVENT_REGISTRY` object is the single discoverable index of all platform events.
- The `openapi.json` artifact is committed to the repository and version‑controlled.

---

