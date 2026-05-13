# Marketing Agency Platform  
## Current State Assessment & Phased Implementation Roadmap

**Document purpose:** This is the living, evolving record of the platform’s current condition and the plan to reach its target architecture. It contains the package inventory with health status, known bugs, dependency relationships, testing gaps, a complete inventory of what remains to be built, and the phased construction roadmap. This document is updated as packages are fixed, built, and tested — it is a project control dashboard, not a permanent constitution.

**Companion document:** For the platform’s invariant rules — the layered taxonomy, stress‑test commitments, enforcement mechanisms, data flow architecture, design vocabulary, and AI agent onboarding guidance — see the **Architecture Constitution & Enforcement Manual**. That document defines the *what* and *why*; this document defines the *where we are* and *how we get there*.

---

## Section 1: Current Package Inventory — What Exists Today

Repository has **23 packages** (Layers 0‑4) + 1 demo app. No Layer 5, 6, or 7 packages exist. This section reflects only code that is committed and compilable today.

---

### Package Evolution Plan (Pre‑Phase 2 Structural Changes)

The following high‑priority structural changes are decided and will be executed early in Phase 1 (Foundation Hardening), before any new L6 feature package is built. They are listed here to prevent confusion about package counts and dependencies during Phase 1 work.

| Change | Current State | Target State | Rationale |
|--------|---------------|--------------|-----------|
| **`firm-db` split** | Single package bundling schemas, connections, and query helpers | `firm-db-schema` (L2, lightweight) + `firm-db-client` (L2, connection pools, helpers) | Every L6 package imports `firm-db`; splitting now prevents a multi‑day migration across 35+ packages later |
| **`firm-rate-limiter` extraction** | Rate‑limiting logic lives inside `firm-security` (broken) | Standalone `firm-rate-limiter` (L3) with named policies, plan‑tier‑aware limits, dry‑run mode, fail‑open | Reduces `firm-security` surface; enables independent testing and policy governance |
| **`firm-test-utils` → `firm-testing`** | Named `firm-test-utils`, scope limited to mock factories | Renamed `firm-testing`; expanded to include PGLite harness, ioredis‑mock, `createUnitHarness`, `createIntegrationHarness`, `createE2eHarness`, `createTenantIsolationFixture` | Reflects promoted scope; rename is a fast Phase 1 action |
| **`firm-ai` split** | Blueprint originally specified a single `firm-ai` L6 package | `firm-ai` (L6 Tier A infrastructure: model routing, cost metering, rate limiting) + `firm-ai-content` (L6 Tier D: generation, human‑approval gate, C2PA manifests, NY disclosure) | Compliance boundary must be explicit; analytical AI and generative AI have different risk profiles and regulatory obligations |
| **Adapter count correction** | Assessment previously stated 33 adapters planned | **105** adapters (all 22 categories, per‑provider packages) | The Critique catalogued every provider; 33 was a category count, not a package count |
| **Application count correction** | Assessment previously stated 5 applications | **22** applications under `apps/platform/`; grouping into 3‑5 apps is an active ADR recommendation | Full platform surface area must be visible in the plan, even if subsequently grouped |

**Packages currently being tracked as “built” = 23.** After Phase 1 hardening, `firm-rate-limiter`, `firm-db-schema`, and `firm-db-client` will be extracted/created, increasing the built count. The progress tracker (Section 8) will reflect these as they are completed.

---

### 1.1 Package Inventory Table

| # | Package | Layer | Status | Purpose (short) |
|---|---------|-------|--------|-----------------|
| 1 | `firm-primitives` | 0 | ❌ not extracted | Branded IDs (`TenantId`, `UserId`, `AgencyId`, `SubAccountId`, `PlatformId`, `SessionId`), gatekeepers, helper types (planned) |
| 2 | `firm-types` | 2 | ⚠️ to split | Domain entities + adapter Ports – currently holds L0 primitives |
| 3 | `firm-utils` | 1 | ✅ ready | Pure utilities: Result, deep‑merge, tryCatch, strings |
| 4 | `firm-errors` | 1 | ✅ ready | RFC 7807 error hierarchy |
| 5 | `firm-crypto` | 1 | ✅ ready | HMAC, TOTP, constant‑time compare, key gen |
| 6 | `firm-logger` | 1 | ❌ critical bug | Structured JSON logging – split‑brain context bug |
| 7 | `firm-request-context` | 1 | ⚠️ untested | AsyncLocalStorage context propagation – **0% tests**; also has `[key: string]: any` design flaw |
| 8 | `firm-env` | 1 | ✅ ready | Zod env validation, startup guard |
| 9 | `firm-validators` | 2 | ❌ broken | Zod schemas – campaign missing imports, lead migration bugs |
| 10 | `firm-api-contracts` | 2 | ✅ ready | Event registry, tRPC/OpenAPI contracts |
| 11 | `firm-db` | 2 | ⚠️ **to be split** | Drizzle schemas, RLS, outbox, connections – **split into `firm-db-schema` + `firm-db-client` before any L6 build** |
| 12 | `firm-cache` | 2 | ✅ ready (needs TTL fix) | Tenant‑scoped Redis, key factory, tag invalidation |
| 13 | `firm-security` | 3 | ❌ broken | CSP, CSRF, rate limiting (will lose rate limiter to `firm-rate-limiter`), Turnstile, headers, C2PA manifests |
| 14 | `firm-auth` | 3 | ⚠️ blocked | Sessions, RBAC, API keys, MFA – depends on broken `firm-security`; will depend on `firm-rate-limiter` post‑extraction |
| 15 | `firm-consent` | 3 | ✅ ready | GDPR/CCPA consent, GPC, server‑side resolution |
| 16 | `firm-observability` | 4 | ⚠️ deprecated re‑export | OpenTelemetry, Sentry – logger wrapper deprecated |
| 17 | `firm-health` | 4 | ✅ ready (needs OTEL check) | Liveness, readiness, RLS check – missing OTEL health check |
| 18 | `firm-config-eslint` | 0 | ✅ ready | Flat config with layer boundaries, branded‑ID rule |
| 19 | `firm-config-next` | 0 | ✅ ready | Next.js config factory, CSP, Turbopack |
| 20 | `firm-config-tailwind` | 0 | ✅ ready | Safelist, content paths |
| 21 | `firm-config-typescript` | 0 | ✅ ready | TS config factory (app/service/library) |
| 22 | `firm-testing` | testing | ✅ ready (expanding) | *(renamed from `firm-test-utils`)* Mock factories, random data generators; adding PGLite harness, ioredis‑mock, `createUnitHarness`, `createIntegrationHarness`, `createE2eHarness`, `createTenantIsolationFixture` |
| 23 | `firm-tokens` | 0/5 | ✅ ready | DTCG design tokens → CSS/TS (Layer 0 only) |

---

### 1.2 What Is Not Yet Represented Here

The following packages are decided and documented in the Blueprint but have no code committed yet. They are listed for forward visibility; the Progress Tracker (Section 8) tracks them as “❌ not built.”

- **`firm-rate-limiter`** (L3) — decided, required before Phase 2. Extracted from `firm-security` during Phase 1.
- **`firm-db-schema`** and **`firm-db-client`** (L2) — created from the `firm-db` split during Phase 1.
- **All 16 Tier A infrastructure packages** (Phase 2)
- **All 8 Tier B operations packages** (Phase 4)
- **All 2 Tier C revenue packages** (Phase 5)
- **All 11 Tier D client‑facing packages**, including `firm-ai` and `firm-ai-content` (Phase 6)
- **`firm-portal`** (Phase 7)
- **All 105 adapter packages** (Phase 3, parallel)
- **All 22 applications** under `apps/platform/` (Phase 8)

---

### 1.3 Authoritative Platform Totals

These numbers replace all previous estimates in the Assessment. They are derived from the Blueprint’s canonical package list as validated by the Master Analysis.

| Metric | Value |
|--------|-------|
| Total planned packages (L0–L7) | **187** |
| Packages currently built | **23** |
| Packages still to build | **~164** *(including splits and new packages)* |
| Planned adapter packages | **105** (across 22+ categories) |
| Planned applications (`apps/platform/`) | **22** *(ADR pending: recommend grouping into 3‑5)* |
| Background workers (`workers/`) | **13** *(renamed from `services/`)* |
| Total artifacts (packages + workers + apps) | **~231** |
| Current completion (packages only) | **23 / 187 = 12.3%** |

**Note on completion percentage:** The 12.3% figure reflects only packages with committed, compilable code. It does not yet include packages whose design is decided but whose code will be created via extraction during Phase 1 (e.g., `firm-rate-limiter`, `firm-db-schema`, `firm-db-client`). Section 8 will track these as they are completed, and the percentage will increase as Phase 1 hardening concludes.

---

## Section 2: Deep‑Dive Package Health Reports

**Legend:** `✅`=ready, `⚠️`=partial/needs work, `❌`=broken/not built, `L#`=Layer, `Fix N`=refers to §7.1 critical fix.

---

### 2.0 `firm-primitives` (L0) – ❌ not extracted
Intent: branded IDs (`TenantId`, `UserId`, `AgencyId`, `SubAccountId`, `PlatformId`, `SessionId`), gatekeepers (`asTenantId`), pure helper types. Zero runtime deps.  
Current: does not exist – types live inside `firm-types`.  
Required: extract from `firm-types`, add gatekeeper unit tests. Deps: none. Blocks: layer boundary enforcement. **Fix 8.**

---

### 2.1 `firm-types` (L2) – ⚠️ to split
Intent: domain entity interfaces (`Lead`, `Booking`, etc.), adapter Ports, API envelopes. Depends on `firm-primitives`.  
Current: holds L0 primitives. After extraction, pure types only (compile‑time tests sufficient).  
Note: the full entity inventory required for a complete shared kernel is far larger than currently listed – see the Blueprint for the canonical list (tenants, leads, campaigns, content, operations, commercial, automation, reputation/seo, compliance, messaging, platform). An ADR defining the shared kernel boundary (which entities stay here vs. migrate to their owning feature package) must be written before any L6 package is built.  
Bugs: none after split. **Fix 8** (extraction).

---

### 2.2 `firm-utils` (L1) – ✅ ready
Intent: pure functions, `Result<T,E>` type, `tryCatch`, deep‑merge, strings.  
Required additions: `retry<T>(fn, options)` (exponential backoff + jitter, needed by adapters, bus, SDK), `sleep(ms)`, `paginate(cursor, limit, direction)` (pure pagination math). These are shared utilities that should not be re‑implemented in every consumer.  
Bugs: `hashIp` salt param ignored (docs mismatch). Tests: good (4 files). Deps: `@firm/types` (types only).

---

### 2.3 `firm-errors` (L1) – ✅ ready
Intent: RFC 7807 error hierarchy (`FirmError` base, concrete subclasses).  
Required additions: `isRetryable(error): boolean` (predicate for outbox worker retry/dead‑letter routing) and `toTRPCError()`/`toHTTPResponse()` (standardised serialisation).  
Tests: good. Deps: `@firm/types` (`ErrorCategory`).

---

### 2.4 `firm-crypto` (L1) – ✅ ready
Intent: HMAC, constant‑time compare, key/token gen, TOTP (wraps `otplib`).  
Required additions: `generateSecureToken(bytes)`, `encryptField`/`decryptField` (column‑level encryption for PII/payment tokens), `deriveKey(password, salt)` (per‑tenant key derivation).  
Bugs: `generateUUID` duplicates `crypto.randomUUID()` – **remove**, do not leave as a known redundancy. Tests: good (3 files). Deps: `otplib` (external).

---

### 2.5 `firm-logger` (L1) – ❌ critical bug
Intent: structured JSON logging (Pino) with PII redaction, context from `firm-request-context`.  
Bugs: **split‑brain** – `ContextManager` maintains own `currentContext` alongside unified store → can diverge in concurrent async contexts.  
Enhancements needed: `logger.child(bindings)` support (request‑scoped child loggers), configurable sampling (errors/warnings never dropped), `createTestLogger()` (in‑memory array for test assertions).  
Tests: good for PII redaction, **no test for split‑brain scenario**. Deps: `pino`, `@firm/request-context`. **Fix 9.**

---

### 2.6 `firm-request-context` (L1) – ⚠️ untested + design flaw
Intent: unified `AsyncLocalStorage` store for correlationId, traceId, tenantId, userId.  
Bugs: `RequestContext` has `[key: string]: any` – a typo in a key fails silently at runtime, defeating TypeScript’s purpose. **Replace with module augmentation**: packages that need to extend context declare additions in their own `.d.ts` files. Also missing: `withRequestContext()` wrapper for Inngest/BullMQ job handlers.  
Tests: **0% – none exist**. Highest infrastructure risk. Deps: `@firm/types`. **Fix 6** (add tests + fix design flaw).

---

### 2.7 `firm-env` (L1) – ✅ ready
Intent: Zod validation of env vars at startup. Auth, DB, Redis, platform schemas.  
Required enhancement: validate **format** of secrets (URL structure, key prefix/length), not just presence. Add `environment` export (`'development' | 'staging' | 'production'`) for environment‑aware behaviour across packages.  
Tests: excellent (5 files). Deps: `@t3-oss/env-nextjs`, `zod`.

---

### 2.8 `firm-validators` (L2) – ❌ broken
Intent: Zod schemas for all entities, `satisfies` against `firm-types`.  
Required factory additions: `createPaginationSchema()`, `createTenantScopedSchema(baseSchema)`, `createVersionedSchema(schema, version)`.  
Bugs: (1) `campaign.ts` missing imports for `uuidField` etc. (2) lead v1→v2 migration references non‑existent fields. (3) v2→v1 reverse migration also broken. (4) no compilation safeguard.  
Tests: only `enum-validation.test.ts`. Deps: `@firm/types`, `zod`. **Fix 4.**

---

### 2.9 `firm-api-contracts` (L2) – ✅ ready
Intent: event registry (`defineEvent`, versioning), tRPC/OpenAPI routes, CloudEvents.  
Required additions: `deprecateEvent(name, version, sunsetDate)` (with CI enforcement), `createWebhookPayloadSchema(eventSchema)` (standard outbound webhook envelope), tRPC sub‑routers organised by domain (`leadsRouter`, `campaignsRouter`, etc.) from day one.  
Note: an ADR evaluating oRPC (single contract → tRPC + OpenAPI) must be written before L6 build begins.  
Bugs: redundant re‑exports in `events/index.ts` (harmless). Tests: event registry covered; tRPC/OpenAPI untested. Deps: `zod`, `@asteasolutions/zod-to-openapi`, `@firm/types`.

---

### 2.10 `firm-db` (L2) – ⚠️ **HIGH PRIORITY SPLIT PENDING**
Intent: Drizzle schemas, connections (serverless/pooled/direct), RLS policies, outbox helpers, pagination.  
**Structural decision:** Before any L6 package is built, `firm-db` will be split into:
- **`firm-db-schema`** (L2): Drizzle schema definitions, RLS policies, migration source of truth – lightweight, zero runtime deps beyond Drizzle.
- **`firm-db-client`** (L2): connection factories, outbox helpers, pagination, PgBouncer‑safe RESET wrapper – heavyweight, imports `postgres`, `drizzle-orm`, `ioredis`.
- **CQRS read model** home: subdirectory `firm-db/src/schemas/reporting/` (Option B, with CODEOWNERS override) or separate `firm-db-read` package (Option A). ADR pending.

This split prevents every L6 package from pulling in connection pool infrastructure when it only needs schema types.  
Current bugs: (1) outbox import at bottom of file. (2) `softDelete` uses `any` instead of `PgTable`. (3) must update Drizzle RLS API from deprecated `.enableRLS()` to `pgTable.withRLS(...)`.  
Tests: good (6 files, PgLite integration). Deps: `drizzle-orm`, `postgres`, `@firm/request-context`, `@firm/types`. **Fix 5** (cleanup). Split is a **Phase 1 gate** before any infrastructure package build.

---

### 2.11 `firm-cache` (L2) – ✅ ready (needs TTL contract fix + additions)
Intent: tenant‑scoped Redis client, `CacheKeyFactory`, `TagManager`, connection pooling.  
Required additions: `acquireLock(key, ttlMs)` (distributed lock via Redis `SET NX` – prevents duplicate cron execution across workers) and `warmCache(keys)` (pre‑populates high‑traffic keys at startup to avoid cold‑cache thundering herd).  
Bugs: `TenantCache.set` expects `ttlSeconds?: number`, but consumer may pass `{ ttl }` object → corrupts TTL.  
Tests: only JSON parsing test; `set`, key factory, tag manager, pool untested. Deps: `ioredis`. **Fix 1.**

---

### 2.12 `firm-security` (L3) – ❌ broken
Intent: CSP, CSRF, rate limiting (will be extracted to `firm-rate-limiter`), Turnstile, security headers, tag registry, audit logger.  
Post‑extraction scope (retained): CSP nonce pipeline, CSRF, Turnstile, security headers middleware, tag registry, audit logging, C2PA manifest generation (Aug 2 EU AI Act deadline).  
Required additions: `validateCorsOrigin(origin, tenantId)` (tenant‑aware allowed origins from `firm-tenant-config`), `Permissions-Policy` header definitions.  
Bugs: (1) rate limiter imports `{ CacheClient }` – no such export (should be `TenantCache`). (2) `set()` call passes object instead of TTL number. (3) headers middleware is Next.js‑only.  
Tests: CSP, CSRF, policy definitions covered; rate limiter cannot be instantiated. Deps: `@firm/cache`, `@firm/crypto`, `next/server`. **Fix 2a** (fix import); **Fix 2b** (extract rate limiter to new package).

---

### 2.13 `firm-auth` (L3) – ⚠️ blocked by `firm-security`; will shift dependency
Intent: unified auth (cookie/bearer/API key), frozen `SessionContext`, RBAC matrix (three‑tier hierarchy: platform‑admin, agency‑admin, sub‑account‑admin, sub‑account‑user), API keys (sub‑account scoping required), TOTP MFA, impersonation/delegation, audit logging.  
Post‑extraction: will depend on `firm-rate-limiter` directly for MFA/API key rate limiting, removing the indirect `firm-security` dependency for this concern.  
Required additions: `createApiKeyForTenant()` must support sub‑account scoping; RBAC matrix must explicitly model the three‑tier hierarchy with clear inheritance rules; `validateCorsOrigin(origin, tenantId)` should be centralised (likely in `firm-auth` or `firm-security`).  
Bugs: (1) `session.role` typed as `string` instead of `Role`. (2) deprecated `startImpersonationLegacy` still exported (TOCTOU‑vulnerable). (3) audit logging falls back to `console.log` on import failure with no alert.  
Tests: excellent (7 files). Deps: `@firm/db`, `@firm/cache`, `@firm/security` (blocked), `@firm/crypto`, `@firm/validators`, `better-auth`. **Fix 3** (type fix + remove deprecated). Will unblock fully when Fix 2a/2b complete.

---

### 2.14 `firm-consent` (L3) – ✅ ready (with compliance deadline gaps)
Intent: consent categories, GPC detection, signed cookies (HMAC), server‑side resolution, React context gate.  
Required additions (with hard deadlines):
- **Google Consent Mode v3 translation layer** – Jun 15 deadline. Translates `ConsentRecord` into `gtag('consent', 'update', {...})`. Must fire before any Google tag initialises. ADR required for CSP nonce integration with `firm-config-next`.
- **TCF 2.2 consent string encoding** – required for EU programmatic ads. A significant missing capability, not a minor gap.
- **CNIL email tracking pixel consent (France)** – Jul 14 deadline. Pixels suppressed for EU users until explicit marketing opt‑in.
Bugs: (1) cookie parsing splits on `=` – value with `=` would truncate (unlikely). (2) `gpcApplied` flag not in signed payload – **audit gap**, must be fixed.  
Tests: good (3 files). Deps: `@firm/crypto`, `@firm/types`, `react`.

---

### 2.15 `firm-observability` (L4) – ⚠️ deprecated re‑export
Intent: OpenTelemetry/Sentry init, `withSpan`, `captureException`, metrics.  
Required additions from day one: `withTenantSpan(name, fn)` (auto‑attaches tenant.id, user.id, correlation.id), `captureError(error, context)` (enriches Sentry events with tenant context), `createTenantMeter(tenantId)` (tenant‑labeled Prometheus metrics), `resetForTesting()` (bypasses double‑init guard).  
Bugs: (1) `logger.ts` deprecated but still primary entry point. (2) double‑initialisation guard may throw in demo app. (3) Sentry PII redaction US‑centric (no international).  
Tests: minimal (only PII redaction). Deps: `@opentelemetry/api`, `@sentry/node`, `pino`, `@firm/logger`, `@firm/request-context`. **Fix 7.**

---

### 2.16 `firm-health` (L4) – ✅ ready (needs OTEL check + structural enhancements)
Intent: liveness, readiness (RLS, dependencies), startup, synthetic checks.  
Required enhancements: **event‑driven health check registration** – L6 feature packages register domain‑specific health checks without importing `firm-health` directly (inversion‑of‑control to avoid L4→L6 layer violation). Synthetic runner must replace `setInterval` with recursive `setTimeout` wrapped in try/catch, with escalating alert strategy (first failure warns, three consecutive fires `SyntheticCheckFailed` alert).  
Bugs: (1) RLS check opens new connection per invocation (not pooled). (2) synthetic runner uses `setInterval` – no error recovery.  
Missing: **observability health check** (OTel initialised, spans exporting). Tests: good for existing probes. **Fix 10.**

---

### 2.17 `firm-config-eslint` (L0) – ✅ ready
Shared ESLint flat config with layer boundaries, branded‑ID rule.  
Required additions: `workers` as a named boundary type; `no-direct-fetch` rule (feature packages must route external calls through adapters); rule preventing direct writes to the CQRS read model (only `firm-bus` event handlers allowed). Deps: none.

---

### 2.18 `firm-config-next` (L0) – ✅ ready
Next.js config factory: CSP, cache profiles, Turbopack.  
Required addition: explicitly add `serverExternalPackages: ['pino', 'drizzle-orm', 'postgres']` for Next.js 15 App Router. Tests: good. Deps: none.

---

### 2.19 `firm-config-tailwind` (L0) – ✅ ready
Shared Tailwind safelist, content paths.  
Required addition: provide a `v4/` export with CSS‑first configuration for Tailwind v4 breaking changes. Deps: none.

---

### 2.20 `firm-config-typescript` (L0) – ✅ ready
TS config factory for app/service/library. Strict mode.  
Verify `service` variant fully covers background workers without leaking browser API types; add `worker` variant if needed. Deps: none.

---

### 2.21 `firm-testing` (testing) – ✅ ready (expanding scope)
*(Renamed from `firm-test-utils`.)* Mock factories, random data generators.  
Expanded scope in Phase 1: PGLite harness (in‑memory Postgres for integration tests), ioredis‑mock, `createUnitHarness()`, `createIntegrationHarness()`, `createE2eHarness()`.  
Required additions: `createTenantIsolationFixture()` (two‑tenant setup with cross‑visibility assertion helpers – needed by every L6 package), `mockAdapter<T extends Port>(port)` (type‑safe mock for any Port interface), `createOutboxHarness()` (captures outbox events without real DB transactions).  
Deps: none.

---

### 2.22 `firm-tokens` (L0/5) – ✅ ready
W3C DTCG design tokens → CSS custom properties, TS constants. Build‑time only.  
Enforcement risk: add `no-runtime-tokens-import` ESLint rule – prevents direct token imports at runtime, enforcing CSS custom property usage for theming. Deps: none.

---

### 2.23 `firm-rate-limiter` (L3) – ❌ not built
*(New package – extracted from `firm-security` during Phase 1.)*  
Intent: Redis sliding window per named policy, token bucket for expensive operations (AI generation, file uploads), plan‑tier‑aware limits (values from `firm-flags` or `firm-subscriptions`, never inline), dry‑run mode (`RateLimitPolicy.dryRun: true` – records would‑block events without blocking, for production tuning), fail‑open when Redis unreachable (logged and alerted, never throws).  
Deps: `@firm/cache`, `@firm/env`. Tests: must include dry‑run behaviour and Redis‑unreachable graceful degradation. **Fix 2b.**

---

### 2.24 Critical Missing Adapters (Day‑One Development Unblockers)

The following adapter packages do not exist but are required to unblock local development and core feature work. They are listed here because their absence is a development velocity blocker, not just a future milestone.

| Package | Layer | Status | Blocks |
|---------|-------|--------|--------|
| `adapter-storage-local` | 7 | ❌ not built | All local development for media features – without it, developers need real S3/R2 credentials |
| `adapter-pdf-generator-puppeteer` | 7 | ❌ not built | `firm-documents` – no PDF generation without this |
| `adapter-ai-image-openai` | 7 | ❌ not built | `firm-ai-content` image generation |
| `adapter-videoconferencing-zoom` | 7 | ❌ not built | `firm-appointments` – cannot attach video links to bookings |
| `adapter-email-validation-zerobounce` | 7 | ❌ not built | Bulk email campaigns will accumulate bounces without email validation |

**`adapter-storage-local` is the single highest‑ROI adapter build** – it unblocks local development for every media‑touching feature and can be written in under an hour. It must be created in Phase 1.

---

### 2.25 Summary of Broken/Blocked/New Packages

**Broken (compilation fails or critical logic error):**
- `firm-primitives` – not extracted
- `firm-logger` – split‑brain context bug
- `firm-validators` – campaign imports, lead migration bugs
- `firm-security` – rate limiter import bug (will be partially resolved by extraction)

**Blocked (depends on a broken package):**
- `firm-auth` – blocked by `firm-security` Fix 2a/2b

**New packages decided and required before Phase 2:**
- `firm-rate-limiter` (L3) – extracted from `firm-security`
- `firm-db-schema` (L2) – split from `firm-db`
- `firm-db-client` (L2) – split from `firm-db`
- `adapter-storage-local` (L7) – unblocks all local media development

**Design changes propagated to Blueprint:**
- `firm-ai` split into `firm-ai` (infra) + `firm-ai-content` (generation + compliance)
- `firm-test-utils` → `firm-testing` (rename + expanded scope)
- `firm-pipeline` → `firm-sales-pipeline` (future L6, rename reflected in plans)

---

## Section 3: Cross‑Package Dependency Matrix (Post‑Phase 1 Target State)

This matrix describes the import relationships **after** all Phase 1 critical fixes are applied, `firm-rate-limiter` is extracted as a standalone Layer 3 package, and `firm-db` is split into `firm-db-schema` (L2, lightweight) and `firm-db-client` (L2, connection‑heavy). A `✅` indicates an allowed and correctly implemented direct import (lower or same layer). A blank cell means no direct import. No `⚠️` edges should remain—the Phase 1 fix sequence is designed to resolve every broken edge identified in the current Assessment.

**Note:** The matrix will be regenerated from actual `package.json` files after the split and extraction are physically completed. This version serves as the architectural target for Phase 1 verification.

| Imported ↓ → Importer | firm‑prim | firm‑types | firm‑utils | firm‑errors | firm‑crypto | firm‑logger | firm‑req‑ctx | firm‑env | firm‑validators | firm‑api‑ctr | firm‑db‑schema | firm‑db‑client | firm‑cache | firm‑rate‑limiter | firm‑security | firm‑auth | firm‑consent | firm‑observ | firm‑health |
|----------------------|-----------|------------|------------|-------------|-------------|-------------|--------------|----------|-----------------|--------------|----------------|----------------|------------|-------------------|---------------|-----------|--------------|-------------|------------|
| `firm‑primitives` | – | | | | | | | | | | | | | | | | | | |
| `firm‑types` | ✅ | – | | | | | | | | | | | | | | | | | |
| `firm‑utils` | ✅ | | – | | | | | | | | | | | | | | | | |
| `firm‑errors` | ✅ | | | – | | | | | | | | | | | | | | | |
| `firm‑crypto` | | | | | – | | | | | | | | | | | | | | |
| `firm‑logger` | | | | | | – | ✅ | | | | | | | | | | | | |
| `firm‑req‑ctx` | ✅ | | | | | | – | | | | | | | | | | | | |
| `firm‑env` | | | | | | | | – | | | | | | | | | | | |
| `firm‑validators` | ✅ | ✅ | | | | | | | – | | | | | | | | | | |
| `firm‑api‑ctr` | ✅ | ✅ | | | | | | | ✅ | – | | | | | | | | | |
| `firm‑db‑schema` | ✅ | ✅ | | | | | | | | | – | | | | | | | | |
| `firm‑db‑client` | ✅ | ✅ | | | | | ✅ | | | | ✅ | – | | | | | | | |
| `firm‑cache` | | | | | | | | | | | | | – | | | | | | |
| `firm‑rate‑limiter` | | | | | | | | ✅ | | | | | ✅ | – | | | | | |
| `firm‑security` | ✅ | | | ✅ | ✅ | | | | | | | | | | – | | | | |
| `firm‑auth` | ✅ | ✅ | | ✅ | ✅ | | ✅ | | ✅ | | | ✅ | ✅ | ✅ | ✅ | – | | | |
| `firm‑consent` | ✅ | | | ✅ | ✅ | | | | | | | | | | | | – | | |
| `firm‑observ` | | | | | | ✅ | ✅ | | | | | | | | | | | – | |
| `firm‑health` | | | | | | | | | | | | ✅ | | | | | | ✅ | – |

---

### Notes on Structural Changes

1. **`firm‑db‑schema` and `firm‑db‑client` replace `firm‑db`.** Packages that only need schema types (e.g., `firm‑validators` for `satisfies` checks) will import `firm‑db‑schema`—lightweight, zero runtime deps beyond Drizzle. Packages that need database connections (e.g., `firm‑auth` for session queries, `firm‑health` for RLS probes) import `firm‑db‑client`. This eliminates the previous fan‑out where every consumer of `firm‑db` pulled in connection pools and `postgres` unnecessarily.

2. **`firm‑rate‑limiter` is a new Layer 3 package.** `firm‑security` no longer contains rate‑limiting logic; it depends only on `firm‑primitives`, `firm‑errors`, and `firm‑crypto` for CSP/CSRF/Turnstile/headers. `firm‑auth` now directly depends on `firm‑rate‑limiter` for MFA and API key rate limiting, and on `firm‑cache` for session storage—both dependencies are now explicit and clean.

3. **`firm‑auth → firm‑security` remains a direct dependency** because `firm‑auth` consumes `firm‑security`’s CSRF and security headers middleware. This edge is healthy—it was only broken previously because `firm‑security` couldn’t be instantiated due to the rate‑limiter bug. Fix 2a resolves that and Fix 2b removes the rate‑limiter code from `firm‑security`, leaving a stable, importable package.

4. **`firm‑env` is imported by `firm‑rate‑limiter`** to allow environment‑aware configuration (e.g., relaxed limits in development, full enforcement in production) without hardcoding environment checks inside the policy engine.

5. **`firm‑health → firm‑observability` is added** because the observability health check (OTel initialised, spans exporting) requires querying the OTEL SDK, which lives in `firm‑observability`. Both are Layer 4, so this same‑layer import is permitted.

6. **All previously `⚠️` edges are resolved.** The matrix shows the clean state that must be verified at the end of Phase 1. No package imports from a layer above its own, no circular dependencies, no missing exports.

---

## Section 4: Testing Coverage Audit & Gaps

**Legend:** `P#`=Priority (1=highest risk). `Fix N` refers to §7.1 critical fix.

---

### 4.1 Priority‑Ordered Test Gaps

| P | Package | Gap | Risk | Fix |
|---|---------|-----|------|-----|
| 1 | `firm-request-context` | **0% tests** – no context storage, propagation, or middleware tests; also has `[key: string]: any` design flaw that needs module augmentation | Critical – tenant scoping, traces, audit | Fix 6 |
| 2 | `firm-validators` | Schemas broken (campaign imports, lead migration); no tests for lead/tenant/user/campaign; missing factory tests for `createPaginationSchema`, `createTenantScopedSchema`, `createVersionedSchema` | High – blocks all feature validation | Fix 4 |
| 3 | `firm-security` | RateLimiter untestable (broken import); Turnstile, headers middleware, tag registry, audit logger untested | High – security functions unverified | Fix 2a |
| 4 | `firm-rate-limiter` | **Not yet built** – Redis sliding window, token bucket, plan‑tier‑aware limits, dry‑run mode, fail‑open behaviour must all be tested before Phase 2 | High – new L3 package; blocks `firm-auth` rate‑limited endpoints | Fix 2b |
| 5 | `firm-logger` | Split‑brain context divergence (no test for concurrent async correctness) | High – logs/spans may attach wrong tenant/trace | Fix 9 |
| 6 | `firm-observability` | Tracing helpers, `withTenantSpan`, `captureError`, context propagation, metrics, `initializeObservability` untested | High – production debugging blind; tenant‑labeled metrics unavailable | Fix 7 |
| 7 | `firm-metering` | **`checkQuota()` enforcement logic untested** – quota rejection, 80% warning event, usage summary queries | High – billing accuracy, platform cost protection | New (Phase 1) |
| 8 | `firm-health` | Missing observability health check (OTel init + span export verification); synthetic runner error recovery untested | Medium – three‑pillar requirement unenforced | Fix 10 |
| 9 | `firm-cache` | Key factory, tag manager, connection pool, `acquireLock`, `warmCache` untested; only JSON parsing test exists | Medium – cross‑tenant cache collisions risk; distributed lock bugs affect all workers | Fix 1 |
| 10 | `firm-primitives` | Gatekeeper functions (`asTenantId`, etc.) untested (package not yet extracted) | Low – simple UUID validation | Fix 8 |
| 11 | `firm-api-contracts` | tRPC route schemas, OpenAPI generation, `deprecateEvent` sunset enforcement untested | Low – derived from schemas, regressions unlikely | – |

---

### 4.2 Missing Test Infrastructure (New Category)

These are not per‑package gaps but missing test capabilities that span the entire platform. They are required to validate the three hard platform guarantees: (1) no event ever silently lost, (2) tenant isolation holds under failure, (3) rate limiter fails open when Redis is unreachable.

| P | Capability | Tool | Status | Blocks |
|---|-----------|------|--------|--------|
| 1 | **Load testing** | k6 (TypeScript‑native, Grafana‑integrated) | `load-tests/` directory not created; no scenarios written | Cannot verify outbox throughput, API rate‑limit holding, or lead‑creation p95 latency under concurrent load before `firm-bus` and `firm-db-client` go production‑ready |
| 1 | **Chaos testing** | Toxiproxy (network‑level failure injection) | `chaos/` directory not created; no scenarios written | Cannot verify Redis‑down rate‑limiter fail‑open, outbox worker crash exactly‑once delivery, PgBouncer eviction cross‑tenant leak safety – the PgBouncer scenario is the highest‑severity vulnerability and must be executed before any EU client is onboarded |
| 2 | **`firm-config-k6`** | Layer 0 config package for k6 (shared base URLs, auth fixtures, ramp‑up profiles) | Not created | All load test scenarios will duplicate configuration; follows the existing Layer 0 config pattern and must be created with `load-tests/` |

**`load-tests/` and `chaos/` are Phase 1 deliverables** – they must be structured and have at minimum the PgBouncer eviction, Redis‑down, and outbox‑throughput scenarios written and passing before Phase 2 infrastructure packages are marked complete.

---

### 4.3 Coverage Summary by Package (Quick Reference)

✅ **Good coverage (≥80%):** `firm-utils`, `firm-errors`, `firm-crypto`, `firm-env`, `firm-auth`, `firm-consent`, `firm-health` (existing probes), `firm-config-next`

⚠️ **Partial / needs work:** `firm-logger` (good except split‑brain), `firm-security` (partial, blocked rate‑limiter tests), `firm-observability` (minimal), `firm-cache` (minimal), `firm-api-contracts` (partial), `firm-db` (good, but split will require restructured tests)

❌ **Broken / untested:** `firm-request-context` (0%), `firm-validators` (compilation fails), `firm-primitives` (not extracted), `firm-rate-limiter` (not built)

---

### 4.4 Alignment with Critical Fixes and New Phase 1 Deliverables

| Fix | Package | Test Deliverable |
|-----|---------|-----------------|
| Fix 1 | `firm-cache` | Unit tests for TTL validation, key factory, tag manager, `acquireLock`, `warmCache` |
| Fix 2a | `firm-security` | Unblocks RateLimiter instantiation tests; CSP/CSRF/headers middleware tests |
| Fix 2b | `firm-rate-limiter` | New package – sliding window, token bucket, dry‑run, fail‑open, plan‑tier‑aware limits |
| Fix 3 | `firm-auth` | Session type guards, impersonation removal verification, audit logger fallback alert test |
| Fix 4 | `firm-validators` | Full entity schema tests; migration tests; factory function tests |
| Fix 5 | `firm-db` (pre‑split) | Outbox import order, `softDelete` type safety; Drizzle RLS `.withRLS()` migration test |
| Fix 6 | `firm-request-context` | Comprehensive unit + integration tests (nested async, concurrent contexts); module augmentation design test |
| Fix 7 | `firm-observability` | `initializeObservability`, `withSpan`, `withTenantSpan`, `captureError`, `createTenantMeter`, `resetForTesting` |
| Fix 8 | `firm-primitives` | Gatekeeper unit tests (`asTenantId`, etc.) |
| Fix 9 | `firm-logger` | Concurrent async context test (split‑brain scenario); `logger.child`, sampling, `createTestLogger` |
| Fix 10 | `firm-health` | OTel health check test; event‑driven registration; synthetic runner error recovery |
| New | `firm-metering` | `checkQuota()` enforcement, quota warning at 80%, `getUsageSummary` |
| New | `load-tests/` | Outbox throughput, API rate‑limit holding, tenant isolation under concurrent load |
| New | `chaos/` | Redis‑down rate‑limiter fail‑open, outbox worker crash recovery, PgBouncer eviction (highest priority) |

**All critical‑path packages will have ≥80% unit/integration test coverage after Phase 1. Load and chaos testing will have baseline scenarios passing before Phase 2 is complete.**

---

## Section 5: Gap Analysis & Missing Inventory

**Current status:** Existing codebase covers Layers 0‑4 (infrastructure). **No** Layer 5 (UI), **no** Layer 6 (business features), **no** Layer 7 (adapters), **no** applications yet.

**Authoritative total after all planned packages:** **187 packages** (L0‑L7) + **105 adapters** + **22 applications** + **13 workers** = **~231 artifacts**.

**Packages still to build:** **~164** (187 total − 23 existing).  
**Adapters still to build:** **105** (none exist).  
**Applications still to build:** **22** (none exist).

---

### 5.1 Missing Infrastructure Packages (Tier A — Phase 2)

These 16 packages form the platform backbone. They must be built before any business feature package can operate. All are ❌ not built.

**Prerequisite:** The `firm-db` split into `firm-db-schema` + `firm-db-client` must be complete before any package in this list is built, as every one of them will import schema types or connection infrastructure.

| # | Package | Depends on | Core capability | Critical note |
|---|---------|------------|----------------|---------------|
| 1 | `firm-bus` | db-schema, db-client, req-ctx, logger, flags | Outbox processor, cron, sagas | **ADR pending** (Inngest vs. custom outbox) – must be resolved before code is written |
| 2 | `firm-flags` | db-client, cache, auth, env | Feature flags (expiration enforced) | Add circuit breaker for Redis unavailability |
| 3 | `firm-metering` | db-client, cache, api-contracts, bus | Usage counters, **`checkQuota()` enforcement** (must reject before operation, not detect after) | Add 80% quota warning event |
| 4 | `firm-audit` | db-client, crypto, req-ctx | Immutable cryptographically chained audit log | Must support `queryAuditLog()` and `exportAuditLog()` |
| 5 | `firm-i18n` | db-client, cache, req-ctx | Translation keys, locale formatting, timezone-aware dates, RTL support, ICU MessageFormat pluralisation | Required for any multi‑region deployment |
| 6 | `firm-template-engine` | db-client, i18n, media | Templates with versioning, rendering | **ADR pending** (Liquid for email/SMS, Handlebars for PDF) |
| 7 | `firm-media` | db-client, cache, bus, consent, storage adapter | File storage, image transformation pipeline (WebP/AVIF, `srcset`), deduplication by content hash, CDN cache invalidation | `adapter-storage-local` must exist before local development |
| 8 | `firm-tenant-config` | db-client, cache, validators, flags | Per‑tenant config resolution, merge with plan defaults, versioning with rollback | Emits `tenant-config.updated` event for CDN purge |
| 9 | `firm-payments` | db-client, bus, auth, env, api-contracts, stripe adapter | Stripe checkout, webhooks (constant‑time signature verification), idempotency | Payment method management, split payment support |
| 10 | `firm-notifications` | db-client, bus, auth, consent, template-engine, adapters | Multi‑channel send, preferences, digest batching, per‑channel retry policy, in‑app unread count | Grouping window prevents 500 individual emails from bulk lead import |
| 11 | `firm-webhooks` | db-client, bus, crypto, auth | Outbound delivery, retry, signing, subscription management, test ping endpoint, mutual TLS support | URL reachability validated before endpoint saved |
| 12 | `firm-search` | db-client, bus, auth, api-contracts | Full‑text search, faceting, tenant isolation enforced at application layer (RLS as safety net) | **ADR pending** (PostgreSQL FTS vs. Typesense/Meilisearch) |
| 13 | `firm-sdk` | api-contracts, crypto, types | TypeScript client, pagination, `FirmClient.withTenant()`, separate node/browser exports, `verifyWebhookSignature()` | **Relocated from L6 to L2** – lives in `packages/layer2-data/firm-sdk` |
| 14 | `firm-migrations` | db-client, env | Migration runner, drift check | – |
| 15 | `firm-seed` | db-client | Deterministic seed data (dev/test) | – |
| 16 | `firm-sse` | db-client, auth, bus | Server‑Sent Events delivery channel for real‑time dashboard and portal updates | New Tier A package |
| 17 | `firm-kpi` | db-client, bus, observability | Business KPI telemetry, anomaly alerts, revenue/lead‑conversion anomaly detection | *(Renamed from `firm-telemetry`)* |

**Build order within Phase 2:** bus → flags → metering → audit → i18n → template‑engine → media → tenant‑config → payments → notifications → webhooks → search → sdk → migrations → seed → sse → kpi.

---

### 5.2 Missing Business Domain Packages (Tiers B‑D — Phases 4‑7)

All packages are ❌ not built. Dependencies assume Tier A infrastructure packages are complete.

#### Tier B – Operations (8 packages — Phase 4)

| Package | Core capability | Depends on | Key addition vs. original scope |
|---------|----------------|------------|----------------------------------|
| `firm-provisioning` | Tenant lifecycle saga (create/upgrade/offboard) | db-client, bus, auth, billing, flags, notifications | Dry‑run mode; provisioning health check |
| `firm-compliance` | GDPR erasure (2‑phase), data export, Article 30 report generation | db-client, bus, audit, consent, media | Data residency enforcement check (GDPR Art 32) |
| `firm-projects` | Project/task mgmt, kanban, time tracking (billable/non‑billable), client‑visible vs. internal tasks | db-client, auth, notifications, bus | Task dependency tracking |
| `firm-sales-pipeline` | Deal pipeline, stages, forecasting, lead scoring integration, automated stage transitions | db-client, auth, search | *(Renamed from `firm-pipeline`)* |
| `firm-documents` | PDF generation, e‑signature (multi‑signatory with order), collaborative review, document analytics | db-client, notifications, media, bus, auth, template-engine, pdf adapter | Proposals absorbed here (not a separate package) |
| `firm-appointments` | Booking pages, calendar, reminders, buffer time, group appointments, no‑show policies | db-client, notifications, bus, booking adapter, videoconferencing adapter | Video link attachment via adapter |
| `firm-workflow` | Internal automation (contract→project→email) | db-client, bus, notifications, auth, webhooks | **Most under‑specified package – ADR required for condition model before build** |
| `firm-integrations` | Unified integration dashboard, OAuth health scoring, self‑healing token refresh | all adapters, db-client, auth | Integration health score (not binary) |

**`firm-workflow` vs. `firm-funnels` boundary:**
- `firm-workflow` → inward‑facing operational automation ("when proposal signed → create project, assign PM, send onboarding email").
- `firm-funnels` → outward‑facing marketing automation ("when lead created → wait 1 day → nurture email").

#### Tier C – Revenue (2 packages — Phase 5)

| Package | Core capability | Depends on | Key addition |
|---------|----------------|------------|--------------|
| `firm-subscriptions` | Plan lifecycle, upgrades/downgrades, entitlements, grace periods, grandfathering | db-client, flags, metering, notifications | Subscription event stream for downstream consumers |
| `firm-billing` | Invoicing, revenue recognition, dunning, multi‑currency, tax jurisdiction detection, aging reports | db-client, subscriptions, payments, bus, notifications, accounting adapter | EU VAT OSS scheme handling |

#### Tier D – Client‑Facing & Marketing (11 packages — Phase 6)

| Package | Core capability | Depends on | Key addition |
|---------|----------------|------------|--------------|
| `firm-reporting` | Branded PDF reports, dashboards, report scheduling, shareable links, CQRS read model | db-client (read‑schema), bus, notifications, media, cache, auth, analytics/ads adapters | **ESLint rule: only bus handlers write to read model** |
| `firm-cms` | Content delivery, edge caching, content staging, SEO metadata per item, multilingual with locale fallback | db-client, cache, media, i18n, consent, CMS adapter | Staging environment with publish workflow |
| `firm-forms` | Form builder, conditional logic, partial save/resume, field‑level abandonment analytics, CRM field mapping validation | db-client, validators, api-contracts, security, auth | Prevent broken CRM field mappings at publish time |
| `firm-landing-pages` | Block‑based pages, A/B tests, Core Web Vitals tracking, conversion pixel management, page archiving with analytics retention | db-client, cache, consent, validators, media, api-contracts, cms | Pixels only fire after consent granted |
| `firm-funnels` | Multi‑step automation, saga execution, cross‑channel, funnel analytics, pausing | db-client, bus, notifications, auth, webhooks, flags | Entry rate, step completion, drop‑off analytics |
| `firm-social` | Content calendar, cross‑platform posting, social listening, content recycling | db-client, bus, media, reporting, auth, social adapters | **Outbound only** – inbound DMs route to `firm-inbox` via `social.dm.received` event |
| `firm-seo` | Rank tracking, site audits, technical SEO crawl, schema markup management, SERP feature detection | db-client, bus, reporting, cache, SEO adapters | Structured data templates for local business, events, products |
| `firm-reputation` | Review monitoring, competitor tracking, response time SLA monitoring, AI response suggestions with approval gate | db-client, bus, notifications, ai, funnels, review adapters | No auto‑publishing of AI‑generated responses |
| `firm-ads` | Ad performance aggregation, budget alerts, UTM management, creative performance, ad fatigue detection | db-client, bus, reporting, media, cache, ad adapters | Frequency cap alerts |
| `firm-ai` | **Infrastructure layer:** AI provider client management via adapters, token counting, cost metering via `firm-metering`, model routing, rate limiting via `firm-rate-limiter`, lead scoring and personalization (analytical, no approval gate) | db-client, metering, rate-limiter, bus, ai adapters | No generation logic; no compliance‑sensitive features |
| `firm-ai-content` | **Generation layer:** content generation with human‑approval gate enforced, C2PA manifest generation (Aug 2 deadline), content moderation, brand voice enforcement, `pending/approval` state machine, NY Synthetic Performer disclosure (Jun 9 deadline) | db-client, ai, media, cms, flags, env, security | Compliance‑sensitive; cannot publish without explicit human approval |
| `firm-inbox` | Unified conversation threading, assignment/routing, SLA tracking, tagging | db-client, auth, notifications, email/sms/social/chat adapters | All inbound messages from all channels converge here |

**`firm-analytics`** (proposed, pending ADR) would add UTM tracking, attribution modeling, and real‑time dashboards distinct from `firm-reporting`’s pre‑computed exports. It is not included in the count above.

**Removed from original scope:** `firm-proposals` (absorbed by `firm-documents`), `firm-tracking` (concerns absorbed by `firm-analytics`/`firm-consent`/`VoicePort` adapter).

---

### 5.3 Missing Adapter Packages (105 — Phase 3, parallel)

Each adapter implements a Port interface defined in `firm-types`. Naming convention: `adapters-<category>-<provider>`. All are ❌ not built.

#### Priority Tiers and Categories

**High Priority (22 adapters) — Required to unblock core feature development:**

| Category | Adapter Packages |
|----------|-----------------|
| CRM | `adapters-crm-hubspot`, `adapters-crm-salesforce`, `adapters-crm-gohighlevel`, `adapters-crm-pipedrive`, `adapters-crm-zoho`, `adapters-crm-activecampaign`, `adapters-crm-keap` |
| Email | `adapters-email-resend`, `adapters-email-sendgrid`, `adapters-email-ses`, `adapters-email-postmark`, `adapters-email-smtp`, `adapters-email-mailgun` |
| Payments | `adapters-payments-stripe`, `adapters-payments-paddle`, `adapters-payments-paypal`, `adapters-payments-square` |
| AI Models | `adapters-ai-openai`, `adapters-ai-anthropic`, `adapters-ai-google`, `adapters-ai-azure-openai` |
| Storage | `adapters-storage-s3`, `adapters-storage-r2`, **`adapters-storage-local`** (dev – critical for local development) |

**Medium Priority (adapters needed for marketing operations):**

SMS (Twilio, Vonage, MessageBird), Booking (Cal.com, Google Calendar, Outlook, Acuity), Analytics (Plausible, GA4, Fathom, Mixpanel, **PostHog**), Social (Meta, Twitter, LinkedIn, TikTok), SEO (Google Search Console, SEMrush, Ahrefs, Moz), Paid Ads (Google Ads, Meta Ads, LinkedIn Ads, TikTok Ads), Reviews (Google Business Profile, Trustpilot, Yelp), Proposals/DocuSign (DocuSign, PandaDoc, Qwilr, Dropbox Sign), CMS (Sanity, Strapi, Directus, Contentful), PDF Generation (**Puppeteer**, PDFShift), AI Image Generation (**OpenAI DALL‑E 3**, Stability AI), Video Conferencing (**Zoom**, Google Meet, Microsoft Teams), Email Deliverability Validation (**ZeroBounce**, NeverBounce, Kickbox).

**Low Priority (adapters for extended platform capabilities):**

Accounting (QuickBooks, Xero, FreshBooks), CRO (Hotjar, CrazyEgg, Optimizely, VWO), Project Mgmt (Asana, Trello, Monday, ClickUp), Design (Figma, Canva, Adobe CC), Video (Mux, YouTube, Vimeo, Wistia), Chat (Intercom, Drift, Tidio, WhatsApp), SCIM (**Okta**, **Azure AD** – split per‑provider).

**Critical missing adapters that must be built first in Phase 3:**
1. `adapters-storage-local` – unblocks all local development for media features
2. `adapters-pdf-generator-puppeteer` – unblocks `firm-documents`
3. `adapters-ai-image-openai` + `adapters-ai-image-stability` – unblocks AI image generation
4. `adapters-videoconferencing-zoom` + `adapters-videoconferencing-google-meet` – unblocks video links in appointments
5. `adapters-email-validation-zerobounce` – unblocks bulk email campaigns

**Adapter governance:**
- Every adapter must be generated by the scaffolding tool (not hand‑authored). CI Gate 13 enforces this.
- A stub and a conformance test are generated simultaneously with each adapter.
- `packages/layer7-adapters/REGISTRY.md` is auto‑generated on every adapter scaffold invocation and committed.

---

### 5.4 Missing Applications (22 — Phase 8)

All applications are ❌ not built. **ADR pending:** whether to deploy as 22 separate apps, 1 unified app, or 3‑5 grouped apps (hybrid recommended).

| # | Application | Purpose |
|---|-------------|---------|
| 1 | `apps/platform/platform-portal` | Internal agency hub |
| 2 | `apps/platform/platform-analytics` | Agency analytics dashboards |
| 3 | `apps/platform/platform-crm` | Lead and deal management |
| 4 | `apps/platform/platform-booking` | Appointment scheduling |
| 5 | `apps/platform/platform-forms` | Form builder |
| 6 | `apps/platform/platform-funnels` | Funnel builder |
| 7 | `apps/platform/platform-landing-pages` | Landing page editor |
| 8 | `apps/platform/platform-email` | Email campaign management |
| 9 | `apps/platform/platform-seo` | SEO tools |
| 10 | `apps/platform/platform-reputation` | Review monitoring |
| 11 | `apps/platform/platform-ads` | Ad management |
| 12 | `apps/platform/platform-social` | Social scheduling |
| 13 | `apps/platform/platform-content` | Content/asset management |
| 14 | `apps/platform/platform-reporting` | Reports and dashboards |
| 15 | `apps/platform/platform-proposals` | Proposal builder |
| 16 | `apps/platform/platform-invoicing` | Invoicing |
| 17 | `apps/platform/platform-projects` | Project management |
| 18 | `apps/platform/platform-documents` | Document management |
| 19 | `apps/platform/platform-chat` | Unified inbox |
| 20 | `apps/platform/platform-storybook` | Component library (Storybook) |
| 21 | `apps/platform/platform-admin` | Platform administration |
| 22 | `apps/marketing-site` | Agency public website (CMS‑driven, lead capture) |

**Additionally, client sites (`apps/clients/`):** Generated per client, not hand‑authored. **ADR pending** — committed vs. ephemeral generation (ephemeral recommended, config stored in `apps/clients/config/<slug>.json`). No committed client‑specific code.

---

### 5.5 Build Order Summary (Phases 1‑8) — Revised

**Phase 1 (Foundation Hardening — Weeks 1‑3):** 23 existing packages + new extracted packages + critical missing adapters.
- Execute all critical fixes (Fix 1‑10 + new additions).
- Extract `firm-rate-limiter` from `firm-security`.
- Split `firm-db` into `firm-db-schema` + `firm-db-client`.
- Create `adapters-storage-local`.
- Add `checkQuota()` to `firm-metering` with CI gate.
- Fix `firm-request-context` design flaw.
- Build `load-tests/` and `chaos/` directories with baseline scenarios.
- Rename `firm-test-utils` → `firm-testing` and expand scope.

**Phase 2 (Infrastructure — Weeks 4‑9):** 17 Tier A packages.
- Build in order: bus → flags → metering → audit → i18n → template‑engine → media → tenant‑config → payments → notifications → webhooks → search → sdk → migrations → seed → sse → kpi.
- Resolve `firm-bus` ADR before writing any bus code.
- Write `firm-types` shared kernel ADR before any L6 package.

**Phase 3 (Adapters — Weeks 6‑20, parallel with Phases 2‑5):** 105 adapters.
- High priority first (22 adapters).
- Critical missing adapters built immediately: storage‑local, pdf‑generator, ai‑image, videoconferencing, email‑validation.
- Medium and low priority adapters built progressively alongside feature packages that need them.

**Phase 4 (Operations — Weeks 10‑14):** 8 Tier B packages.

**Phase 5 (Revenue — Weeks 13‑16):** 2 Tier C packages.

**Phase 6 (Client‑Facing — Weeks 15‑22):** 11 Tier D packages (including `firm-ai` + `firm-ai-content`).

**Phase 7 (Portal — Weeks 21‑24):** `firm-portal`.

**Phase 8 (Applications — Weeks 24‑30):** 22 apps (or grouped per ADR). Client site generation model ADR resolved before any client site is built.

---

### 5.6 Missing Root Files and Directories (Not Packages — Essential Artifacts)

The following root‑level directories, files, and infrastructure artifacts are required for platform maturity. They are not packages but are as critical as packages for security, compliance, and operational readiness. All are ❌ not created.

| Artifact | Type | Priority | Required for |
|----------|------|----------|--------------|
| `load-tests/` | Directory (k6 scenarios) | 🔴 Phase 1 | Verifying outbox throughput, tenant isolation under load, rate‑limit holding |
| `chaos/` | Directory (Toxiproxy scenarios) | 🔴 Phase 1 | Verifying Redis‑down fail‑open, outbox worker crash recovery, PgBouncer eviction safety |
| `firm-config-k6` | Layer 0 config package | 🔴 Phase 1 | Shared k6 configuration (base URLs, auth fixtures, ramp‑up profiles) |
| `SECURITY.md` | Root file | 🔴 Phase 1 | SOC 2 audit evidence, vulnerability disclosure process, security contact |
| `CONTRIBUTING.md` | Root file | 🔴 Phase 1 | PR process, branch naming, ADR proposal process, test requirements |
| `policies/` | Directory (reserved for OPA/Rego) | 🟠 Phase 2 | Documented migration trigger for OPA; currently reserved with README |
| `docs/slos/` | Directory | 🟠 Phase 2 | SLO definitions for API p95, outbox lag, auth success rate, RLS health, cross‑tenant queries, AI approval rate |
| `docs/runbooks/` | Directory (expanded) | 🟠 Phase 2 | One runbook per Grafana alert; currently only 2 exist |
| `docs/compliance/data-residency.md` | File | 🔴 Before EU onboarding | Data category taxonomy, region assignment logic, GDPR Art 32/51f evidence |
| `docs/adr/` | Directory | 🔴 Phase 1 | ADR records for all 12 open decisions |
| `contracts/v1/` | Directory (versioned schemas) | 🟠 Phase 2 | openapi.json, asyncapi.yaml, events.schema.json — build pipeline in CI |
| `scripts/ci/generate-asyncapi.ts` | CI script (Gate 16) | 🟠 Phase 2 | AsyncAPI 3.0 generation from EventRegistry |
| `scripts/ci/schema-build.ts` | CI script | 🟠 Phase 2 | Versioned schema artifact generation |
| `.github/ISSUE_TEMPLATE/` | Directory | 🟠 Phase 2 | bug_report, feature_request, adr_proposal, security_vulnerability templates |
| `.github/PULL_REQUEST_TEMPLATE.md` | File | 🟠 Phase 2 | Checklist: tests added, coverage ≥80%, ADR if breaking |
| `packages/layer7-adapters/REGISTRY.md` | File | 🟡 Phase 3 | Auto‑generated adapter catalog; columns: Category, Package, Port, Status, Priority |
| `tools/catalog/` | Tool directory | 🟡 Phase 3 | Static internal developer portal (reads package.json, generates browsable catalog) |
| `infra/regions/` | Directory structure | 🔴 Phase 1 | Regional infrastructure partitions (`us-east-1/`, `eu-west-1/`) for GDPR data residency |

**`infra/` regional structure is required before any EU infrastructure is provisioned.** The current flat `infra/` directory must be partitioned into `infra/regions/us-east-1/`, `infra/regions/eu-west-1/`, and `infra/shared/` for global services (Cloudflare, monitoring).

---

### 5.7 Recalculated Completion Metrics

| Metric | Previous (Incorrect) | Corrected |
|--------|---------------------|-----------|
| Total planned packages | ~94 | **187** |
| Total adapter packages | 33 | **105** |
| Total applications | 5 | **22** |
| Total artifacts (packages + workers + apps) | ~99 | **~231** |
| Current completion (packages) | ~14% | **23/187 = 12.3%** |
| Current completion (all artifacts) | ~14% | **23/231 = 10.0%** |

**Note:** Completion percentage will increase as Phase 1 extracts `firm-rate-limiter`, `firm-db-schema`, `firm-db-client`, creates `firm-config-k6`, and builds `adapters-storage-local`. These are counted as built only after they exist with passing tests.

---

## Section 6: Data Flow Integration Plan

Every business action follows the same standard path: **feature → emitEvent (same DB transaction) → outbox → bus → handlers** (retry, dead‑letter). Context propagation via `firm-request-context` carries `tenantId`, `userId`, `traceId`, `correlationId`, and `subAccountId` through every stage. The following scenarios describe the target state after all Phase 1 hardening and splits are complete.

---

### 6.1 Scenario A: Lead Captured on Landing Page

```
Form submit → validators → DB transaction (via firm-db-client):
  ├─ INSERT leads (tenant_id via RLS)
  └─ INSERT outbox_events ("lead.created", v1, traceId, tenantId, subAccountId)

Outbox worker (firm-bus):
  ├─ Handler1: firm-notifications.send(welcome_email)
  ├─ Handler2: CRM adapter.createLead() → HubSpot
  ├─ Handler3: firm-funnels.evaluateEntryTriggers("lead.created")
  ├─ Handler4: firm-metering.recordUsage("leads.created", 1)
  └─ Handler5: firm-audit.record("lead.created")
```

**Packages involved:** `firm-landing-pages`, `firm-validators`, `firm-db-client`, `firm-bus`, `firm-notifications`, `adapters-crm-hubspot`, `firm-funnels`, `firm-metering`, `firm-audit`.

---

### 6.2 Scenario B: Payment Succeeded

```
Stripe webhook → firm-payments webhook handler:
  ├─ Verify signature (constant‑time, via firm-crypto)
  ├─ Idempotency check
  ├─ Update invoice status → "paid" (via firm-db-client)
  └─ INSERT outbox_events ("invoice.paid", v1)

Outbox worker (firm-bus):
  ├─ firm-notifications.send(payment_receipt)
  ├─ firm-reporting.invalidateCache("revenue")
  ├─ firm-subscriptions.reconcilePayment(invoice)
  ├─ firm-billing.recognizeRevenue(invoice)
  ├─ firm-metering.recordUsage("revenue.collected", amount)
  └─ firm-audit.record("invoice.paid")
```

**Packages involved:** `firm-payments`, `firm-db-client`, `firm-bus`, `firm-notifications`, `firm-reporting`, `firm-subscriptions`, `firm-billing`, `firm-metering`, `firm-audit`.

---

### 6.3 Scenario C: Tenant Provisioning (Agency Creates Sub‑Account)

```
Agency admin → firm-auth.requirePermission("tenant:create") → firm-provisioning.createTenantSaga()
  ├─ Step1: INSERT tenants (type=sub_account, parent_tenant_id=agencyId) via firm-db-client
  ├─ Step2: firm-flags.assignPlanDefaults(tenantId, "starter")
  ├─ Step3: firm-tenant-config.seedDefaultConfig(tenantId)
  ├─ Step4: firm-auth.createDefaultAdminUser(tenantId)
  ├─ Step5: firm-notifications.send(welcome_new_account)
  ├─ Step6: firm-audit.record("tenant.created")
  ├─ Step7: CRM adapter.createCompany(tenantData)
  └─ (any step fails → compensate in reverse via saga state in firm-db-schema)
```

**Packages involved:** `firm-provisioning`, `firm-db-client`, `firm-flags`, `firm-tenant-config`, `firm-auth`, `firm-notifications`, `firm-audit`, `firm-bus`, `adapters-crm-hubspot`.

---

### 6.4 Scenario D: GDPR Right‑to‑Erasure

```
Data subject request → firm-compliance.requestErasure()
  ├─ Phase1 (immediate): firm-db-client.anonymisePII(names, emails, phones, IPs)
  │   └─ firm-audit.record("erasure.anonymised")
  ├─ firm-compliance.generateDataExport() → stored in firm-media → download link sent
  ├─ firm-bus.schedule("hardDelete", { dataSubjectId }, { delay: 30d })
  └─ firm-notifications.send(erasure_confirmed)

30 days later → bus executes hard‑delete job → firm-audit.record("erasure.hard_deleted")
```

**Packages involved:** `firm-compliance`, `firm-db-client`, `firm-bus`, `firm-audit`, `firm-media`, `firm-notifications`, `firm-auth`.

---

### 6.5 Scenario E: Quota Enforcement Flow (New)

Illustrates the mandatory `checkQuota()` call before any metered operation. This pattern must be enforced in every feature package that consumes billable resources.

```
User initiates chargeable action (e.g., AI content generation) →
  firm-ai-content calls firm-metering.checkQuota(tenantId, "ai_tokens", estimatedTokens)

If quota exceeded:
  → return QuotaExceeded error (displayed to user, no resources consumed)
  → firm-metering emits metering.quota.exceeded event
  → firm-notifications may alert agency admin

If quota allowed:
  → execute generation (tokens consumed)
  → firm-metering.recordUsage("ai_tokens", actualTokens)
  → if usage now ≥ 80% of plan limit:
      → emit metering.quota.warning event
      → firm-notifications.send(quota_warning) to agency admin
  → firm-audit.record("ai.content_generated")
```

**Packages involved:** `firm-ai-content`, `firm-metering`, `firm-notifications`, `firm-audit`, `firm-db-client`.

**CI enforcement:** Static analysis gate detects any metered operation that lacks a preceding `checkQuota()` call and fails the build.

---

### 6.6 Scenario F: Chaos Recovery Flows (New)

#### F1 — Rate Limiter Fails Open (Redis Unreachable)

```
Request hits rate-limited endpoint →
  firm-rate-limiter.consume(policyName, tenantId, tokens)
  → Redis connection fails (connection refused / timeout)
  → Log CRITICAL: "Rate limiter Redis unavailable, failing open"
  → fire firm-observability alert (RateLimiterRedisDown)
  → allow request to proceed (fail‑open, never blocks business operations)
  → emit firm-rate-limiter.degraded event
  → firm-kpi records degradation metric
```

**Guarantee verified by chaos test:** `chaos/scenarios/redis-down.ts` (Toxiproxy blocks Redis port; asserts that requests succeed and the alert fires).

#### F2 — Outbox Worker Crash (Exactly‑Once Delivery)

```
Outbox worker picks event "lead.created" (idempotencyKey: evt_123) →
  begins processing Handler1 (notifications) successfully →
  worker crashes mid‑processing before Handler2 (CRM adapter)
  → event remains in outbox with status "processing" and lease timeout

Firm-bus detects lease expiry →
  re‑delivers event to a new worker instance
  → idempotency check on "evt_123" ensures Handler1 is NOT re‑executed
  → continues from Handler2 (CRM adapter) onward
  → marks event "completed"
```

**Guarantee verified by chaos test:** `chaos/scenarios/outbox-worker-crash.ts` (Toxiproxy or process signal kills worker mid‑batch; asserts no duplicate leads in CRM and all handlers eventually complete).

---

### 6.7 Context Propagation Across Workers

Trace path: **Browser → API Gateway → Next.js** (gen/extract traceId, tenantId, subAccountId) → **Outbox event** (metadata carries traceId, correlationId, tenantId, subAccountId, version) → **Worker** (`setRequestContext()` restores) → **Adapter** (`injectTraceContext()` adds `traceparent`) → **External service**.

All background services in `workers/` (renamed from `services/`) must call `setRequestContext()` at job start, using the `withRequestContext()` wrapper provided by `firm-request-context` for Inngest, BullMQ, or custom job handlers. This wrapper eliminates the risk of `AsyncLocalStorage` context loss at async boundaries.

For OpenTelemetry spans, all feature packages and workers must use `withTenantSpan()` from `firm-observability` — this automatically attaches `tenant.id`, `user.id`, and `correlation.id` as span attributes, ensuring tenant‑level visibility in traces without developers manually adding attributes.

---

### 6.8 Cross‑Package Data Dependencies (Post‑Phase 1 Target State)

This table reflects the architecture after all splits, extractions, and renames. It replaces the previous version in its entirety.

| Consumer | Data needed | Producer | Mechanism |
|----------|-------------|----------|-----------|
| reporting | lead counts, revenue, ad perf | db-client (read‑schema), ads, metering | direct query (read pool) + adapter sync |
| portal | projects, docs, reports, invoices | projects, documents, reporting, billing | aggregation API per tenant |
| funnels | leads, email events | db-client (leads), notifications (webhooks) | webhook + direct query |
| ai-content | content generation prompts, brand voice | ai (model routing), db-client | API call via ai adapter |
| ai | lead scoring data, personalisation inputs | db-client (leads, conversion events) | direct query; analytical – no approval gate |
| cms | media assets | media | presigned URL |
| landing‑pages | content blocks | cms | API call + cache |
| social | images/videos | media | presigned URL |
| ads | creative assets | media | asset library |
| reputation | sentiment analysis | ai (analytical), ai-content (generative for response suggestions) | AI adapter call; response suggestions gated by human approval |
| webhooks | event payloads | all features (via outbox) | outbox → bus → webhooks |
| metering | usage counters | all features (meter events) | outbox → bus → metering |
| audit | write operations | all features (audit events) | outbox → bus → audit |
| subscriptions | quotas, usage | metering (live), flags | direct API call |
| billing | invoice lines | subscriptions, payments, metering | aggregation query |
| compliance | erasure/export data | db-client, audit, consent | direct query + saga |
| provisioning | tenant lifecycle | flags, tenant‑config, auth, billing | saga via bus |
| integrations | adapter health | all adapters | health check API |
| inbox | inbound messages | email, sms, social, chat adapters | webhook → outbox → handler; social DMs via `social.dm.received` event |
| workflow | trigger events | documents, appointments, projects | outbox events |
| rate‑limiter | policy definitions, plan tiers | flags (plan defaults), subscriptions (entitlements) | evaluated at request time; never stores limit values inline |
| kpi | business metrics | metering, ads, reporting, subscriptions | direct query + adapter sync; anomaly detection alerts |

**Each dependency must have an integration test before the consumer package is marked complete.**

---

## Section 7: Implementation Roadmap

**Two parts:** (A) Phase 1 Foundation Hardening — resolve all critical bugs, structural splits, and developer experience blockers. (B) Phased construction of missing packages (Phases 2‑8).

No new feature package is built until Phase 1 is complete and all acceptance criteria are verified.

---

### 7.1 Phase 1: Foundation Hardening (Weeks 1‑3)

Phase 1 has four objectives:
1. Fix every critical bug in existing packages.
2. Extract `firm-rate-limiter` and split `firm-db` into schema + client.
3. Add `checkQuota()` enforcement to `firm-metering`.
4. Create `adapters-storage-local` and the `load-tests/` and `chaos/` infrastructure.

**All existing critical fixes from the original Assessment are retained and re‑numbered where necessary.** New actions are appended starting at Fix 11.

| Fix | Package(s) | Action | Depends on | Blocks |
|-----|-----------|--------|------------|--------|
| 1 | `firm-cache` | Fix `TenantCache.set` TTL signature ambiguity – add runtime validation (throw on non‑number), JSDoc, unit test | – | Fix 2a |
| 2a | `firm-security` | Fix rate limiter import (`CacheClient` → `TenantCache`); fix `set()` call to pass numeric TTL; add unit test with mock | Fix 1 | Fix 3 |
| 2b | `firm-rate-limiter` (new) | Extract rate‑limiter into standalone L3 package: Redis sliding window, token bucket, plan‑tier‑aware limits, dry‑run mode, fail‑open. Write full test suite. | Fix 2a, `firm-cache` | `firm-auth` MFA rate limiting |
| 3 | `firm-auth` | Change `SessionContext.role` type to `Role`; remove deprecated `startImpersonationLegacy`; update guards; direct dependency on `firm-rate-limiter` for MFA/API key rate limiting | Fix 2a, Fix 2b | – |
| 4 | `firm-validators` | Add missing campaign imports; rewrite lead v1↔v2 migrations to use existing fields only; add factory functions (`createPaginationSchema`, `createTenantScopedSchema`, `createVersionedSchema`); add comprehensive unit tests | – | All feature packages |
| 5 | `firm-db` (pre‑split) | Move outbox import to top; replace `any` with `PgTable` in `softDelete`; update Drizzle RLS API from deprecated `.enableRLS()` to `pgTable.withRLS(...)`; add migration test | – | – |
| 6 | `firm-request-context` | **Add comprehensive unit + integration tests** (nested async, concurrent contexts). **Replace `[key: string]: any` with module augmentation** – packages declare context extensions in their own `.d.ts` files. Add `withRequestContext()` wrapper for Inngest/BullMQ job handlers. | – | All packages above L1 |
| 7 | `firm-observability` | Remove or undeprecate `logger.ts` re‑export; add `resetForTesting()`; add integration tests for `initializeObservability`, `withSpan`, `withTenantSpan`, `captureError`, `createTenantMeter` | stable `firm-logger` | Production observability |
| 8 | `firm-primitives` | Create new package; move branded IDs (`TenantId`, `UserId`, `AgencyId`, `SubAccountId`, `PlatformId`, `SessionId`), gatekeepers, helper types from `firm-types`; update all imports; add gatekeeper unit tests | – | Layer boundary enforcement |
| 9 | `firm-logger` | Remove `ContextManager` internal `currentContext`; read only from `getUnifiedContext()`; add concurrent async test; add `logger.child(bindings)`, configurable sampling, `createTestLogger()` | Fix 6 | All logging & tracing |
| 10 | `firm-health` | Implement `observabilityHealthCheck()` in readiness probe; replace `setInterval` with recursive `setTimeout` in synthetic runner; add event‑driven health check registration; add unit tests | stable `firm-observability` | Three‑pillar enforcement |
| 11 | `firm-metering` | Add `checkQuota(tenantId, dimension, amount): Promise<Result<QuotaAllowed, QuotaExceeded>>` as primary API; add 80% quota warning event; add `getUsageSummary(tenantId, period)`; add CI static analysis gate detecting metered operations without preceding `checkQuota()` call | – | All metered feature packages |
| 12 | `firm-request-context` (design) | *(Covered by Fix 6 — module augmentation replaces index signature; included here for visibility.)* | – | – |
| 13 | `adapters-storage-local` (new) | Create local storage adapter implementing `StoragePort` with filesystem backend; unblocks all local development for media features | – | `firm-media` local development |
| 14 | `firm-db` split (structural) | Split `firm-db` into `firm-db-schema` (L2, Drizzle schemas, RLS policies, migrations) and `firm-db-client` (L2, connection factories, outbox helpers, pagination, PgBouncer RESET wrapper). Update all existing consumers. Document CQRS read model home (Option B: subdirectory with CODEOWNERS, unless ADR chooses Option A). | Fix 5 | All Phase 2 infrastructure packages |
| 15 | `firm-testing` rename | Rename `firm-test-utils` → `firm-testing`; expand scope: PGLite harness, ioredis‑mock, `createUnitHarness()`, `createIntegrationHarness()`, `createE2eHarness()`, `createTenantIsolationFixture()`, `mockAdapter<T>()`, `createOutboxHarness()` | – | All future testing |
| 16 | `load-tests/` + `chaos/` | Create `load-tests/` directory with k6 structure and three baseline scenarios (outbox throughput, tenant isolation under concurrent load, rate‑limit holding). Create `chaos/` directory with Toxiproxy structure and three baseline scenarios (Redis‑down fail‑open, outbox worker crash recovery, PgBouncer eviction). Create `firm-config-k6` Layer 0 config package. | Phase 1 fixes complete | Verifying platform guarantees before Phase 2 completion |
| 17 | Root files | Create `SECURITY.md` (vulnerability disclosure, security contact, response SLA) and `CONTRIBUTING.md` (PR process, branch naming, test requirements, ADR proposal process). | – | SOC 2 readiness, developer onboarding |
| 18 | `infra/` regional structure | Partition `infra/` into `infra/regions/us-east-1/`, `infra/regions/eu-west-1/`, and `infra/shared/` (Cloudflare, monitoring). | – | GDPR data residency before EU infrastructure provisioned |

---

**Phase 1 Acceptance Criteria:**

- `tsc --noEmit` passes across all packages.
- `vitest run` passes with ≥80% unit/integration coverage for Layers 1‑4.
- `firm-primitives` exists standalone; no L0 types imported from `@firm/types`.
- `firm-db-schema` and `firm-db-client` exist as separate packages; all consumers updated.
- `firm-rate-limiter` extracted and fully tested (sliding window, token bucket, dry‑run, fail‑open).
- `firm-security` rate limiter code removed; remaining CSP/CSRF/headers tests pass.
- `firm-validators` migration tests pass; factory functions tested.
- `firm-logger` has no internal context store; concurrent async test passes.
- `firm-request-context` has no `[key: string]: any`; module augmentation design verified; 0% test gap closed.
- `firm-health` readiness probe includes OTel check; synthetic runner uses `setTimeout` with error recovery.
- `firm-metering.checkQuota()` implemented and enforced by CI gate.
- `adapters-storage-local` functional with `StoragePort` conformance test.
- `load-tests/` and `chaos/` directories exist with all baseline scenarios passing.
- `SECURITY.md` and `CONTRIBUTING.md` present at repository root.
- `infra/` partitioned with regional subdirectories.
- All 18 Phase 1 actions verified by tests or manual checklist.

---

### 7.2 Phased Construction Roadmap (Phases 2‑8)

#### Phase 2: Infrastructure Foundation (Weeks 4‑9) — 17 packages

**Prerequisite:** `firm-db-schema` + `firm-db-client` split complete. `firm-bus` ADR resolved (Inngest vs. custom outbox). `firm-types` shared kernel ADR written.

**Build order (sequential):** bus → flags → metering → audit → i18n → template‑engine → media → tenant‑config → payments → notifications → webhooks → search → sdk → migrations → seed → sse → kpi

**Key deliverables:**
- Outbox processor processes events, retries, cron scheduler, sagas (ordered option for per‑tenant sequence numbers)
- Feature flag evaluation with expiration enforcement and circuit breaker for Redis unavailability
- Usage counter aggregation & `checkQuota()` enforcement API
- Immutable cryptographically chained audit log with `queryAuditLog()` and `exportAuditLog()`
- Localisation with timezone‑aware formatting, RTL support, ICU MessageFormat pluralisation
- Template rendering with versioning and preview API (Liquid for email/SMS, Handlebars for PDF — ADR pending)
- File storage with image transformation pipeline (WebP/AVIF, `srcset`), deduplication, CDN cache invalidation
- Per‑tenant config resolution (branding, features), plan‑default merging, versioning with rollback
- Stripe checkout & webhook handling, payment method management, split payment support
- Multi‑channel notifications with digest batching, per‑channel retry policy, in‑app unread count
- Outbound webhook delivery with retry, signing, subscription management, test ping, mutual TLS
- Full‑text search with tenant isolation enforced at application layer (RLS as safety net; ADR for engine)
- TypeScript client SDK with `FirmClient.withTenant()`, node/browser exports, `verifyWebhookSignature()`
- Migration runner & drift check
- Deterministic seed data (dev/test)
- Server‑Sent Events delivery channel for real‑time updates
- Business KPI telemetry & anomaly alerts (revenue, lead conversion)

**Acceptance:**
- All 17 packages compile & pass tests.
- `firm-bus` processes outbox events; ordered delivery works within a tenant.
- `firm-metering` enforces quotas via `checkQuota()`; 80% warning event fires.
- `firm-payments` creates Stripe session & handles webhook idempotently.
- `firm-search` indexes 10k records <200ms; cross‑tenant queries return zero results.
- Load test scenarios for outbox throughput and tenant isolation pass SLO thresholds.

---

#### Phase 3: Adapter Packages (Weeks 6‑20, parallel with Phases 2‑5) — 105 adapters

**Build sequence:** High‑priority adapters first (22), then medium, then low. Critical missing adapters built immediately: `adapters-storage-local` (already done in Phase 1), `adapters-pdf-generator-puppeteer`, `adapters-ai-image-openai`, `adapters-videoconferencing-zoom`, `adapters-email-validation-zerobounce`.

**Each adapter** implements its Port interface from `firm-types`, lazy‑initialises from environment, transforms between canonical types and provider formats, maps errors to `FirmError` subtypes, exports standardised metrics, and handles webhooks with constant‑time signature verification and idempotency.

**Governance:** Every adapter generated by scaffolding tool (not hand‑authored) — verified by CI Gate 13. Stub and conformance test generated simultaneously. `packages/layer7-adapters/REGISTRY.md` auto‑generated and committed.

**Acceptance:** Webhook signature verification passes for each adapter; provider ↔ canonical type mapping correct; stubs exist and compile; REGISTRY.md is current.

---

#### Phase 4: Operations Layer (Weeks 10‑14) — 8 packages (Tier B)

**Order:** provisioning → compliance → projects → sales‑pipeline → documents → appointments → workflow → integrations

**Key deliverables:**
- Tenant lifecycle saga (create/upgrade/offboard) with dry‑run mode and provisioning health check
- GDPR erasure (2‑phase) & data export; Article 30 report generation; data residency enforcement check
- Project/task management, kanban, time tracking (billable/non‑billable), client‑visible vs. internal tasks
- Deal pipeline stages & forecasting; lead score integration; automated stage transitions
- PDF generation & e‑signature (multi‑signatory with order); collaborative review; document analytics
- Booking pages & calendar sync; buffer time; group appointments; no‑show policies
- Internal workflow automation (contract→project→email) — **ADR required for condition model before build**
- Unified integration dashboard with health scoring (not binary) and self‑healing OAuth token refresh

**Acceptance:** Agency admin can create sub‑account via saga; erasure request anonymises PII immediately; workflow triggers on document signed; integration health score reflects real status.

---

#### Phase 5: Revenue Packages (Weeks 13‑16) — 2 packages (Tier C)

**Order:** subscriptions → billing

**Key deliverables:**
- Plan definition, upgrades/downgrades, trial management, grace periods, grandfathering, subscription event stream
- Invoicing (line items from usage), revenue recognition, dunning, multi‑currency with exchange rates, tax jurisdiction detection (EU VAT OSS), aging reports

**Acceptance:** Upgrade tenant plan → prorated invoice generated; failed payment triggers dunning email series; grace period prevents immediate lockout.

---

#### Phase 6: Client‑Facing & Marketing Execution (Weeks 15‑22) — 11 packages (Tier D)

**Order:** reporting → cms → forms → landing‑pages → funnels → social → seo → reputation → ads → ai → ai‑content → inbox

**Key deliverables:**
- Branded PDF reports (multi‑source metrics), report scheduling, shareable links, CQRS read model with ESLint‑enforced write boundary
- Content delivery API with edge caching, content staging, SEO metadata management, multilingual fallback
- Form builder (conditional logic, multi‑step, partial save, field‑level abandonment analytics, CRM field mapping validation)
- Landing page renderer (A/B tests, Core Web Vitals tracking, conversion pixel management, consent‑gated scripts)
- Multi‑step funnel engine (cross‑channel, analytics, pausing)
- Cross‑platform social scheduling with social listening; outbound only — inbound DMs route to `firm-inbox`
- Rank tracking, technical SEO crawl, schema markup management, SERP feature detection
- Review monitoring, competitor tracking, response time SLA monitoring, AI response suggestions (human‑approval gated)
- Ad performance aggregation (Google, Meta), UTM management, creative performance, ad fatigue detection
- **`firm-ai`** — AI provider client management, token counting, cost metering, model routing, rate limiting; lead scoring and personalization (analytical, no approval gate)
- **`firm-ai-content`** — content generation with human‑approval gate enforced, C2PA manifest generation (Aug 2 deadline), NY Synthetic Performer disclosure (Jun 9 deadline), content moderation, brand voice enforcement
- Unified conversation inbox (all channels), assignment/routing, SLA tracking

**Acceptance:** Form submission triggers funnel; AI content cannot be published without explicit human approval; 1‑star review triggers alert; consent‑gated pixels fire only after marketing consent confirmed.

---

#### Phase 7: Client Portal (Weeks 21‑24) — 1 package

`firm-portal` — aggregates projects, documents, reports, invoices, campaign data for sub‑account users. White‑label domain configuration, per‑sub‑account module toggling, portal activity audit log.

**Acceptance:** Client user sees only own sub‑account data; agency admin sees all sub‑accounts; file sharing & approval workflows functional.

---

#### Phase 8: Applications (Weeks 24‑30) — 22 apps (or grouped per ADR)

**ADR required:** 22 separate apps vs. 3‑5 grouped apps vs. unified application. Recommend hybrid 3‑5 grouped apps: `platform-core` (CRM, projects, billing), `platform-marketing` (SEO, ads, social, content), `platform-portal` (client‑facing), `platform-admin`, `firm-site`.

**Client sites (`apps/clients/`):** ADR required — ephemeral generation recommended (config committed, code generated on deploy). No client‑specific code committed to the repository.

**Acceptance:**
- All apps deployed, tenant isolation enforced, consent respected.
- Marketing site captures leads → CRM, metering, audit.
- Client portal provides complete branded experience.
- Client site generation produces a working site from `apps/clients/config/<slug>.json`.

---

### 7.3 Phase Completion Summary (Revised)

| Phase | Packages / Actions | Weeks | Status |
|-------|-------------------|-------|--------|
| 1 (Hardening) | 23 existing + 18 fixes/structural actions | 1‑3 | ☐ Not started |
| 2 (Infrastructure) | 17 new | 4‑9 | ☐ Not started |
| 3 (Adapters) | 105 new | 6‑20 (parallel) | ☐ Not started |
| 4 (Operations) | 8 new | 10‑14 | ☐ Not started |
| 5 (Revenue) | 2 new | 13‑16 | ☐ Not started |
| 6 (Client‑Facing) | 11 new | 15‑22 | ☐ Not started |
| 7 (Portal) | 1 new | 21‑24 | ☐ Not started |
| 8 (Applications) | 22 apps (or grouped) | 24‑30 | ☐ Not started |

**Overall platform completion (post‑Phase 1):** 23 of ~187 packages built (12.3%). No business capabilities or user‑facing apps exist yet.

---

## Section 8: Progress Tracker & Status Dashboard

**Legend:** `✅`=ready, `⚠️`=partial/needs work, `❌`=broken/not built, `L#`=Layer, `P#`=Phase, `Fix N`=critical fix.

---

### 8.1 Existing Foundation Packages (Layers 0‑4) – 23 packages → Phase 1 target

| # | Package | Layer | Status | Phase | Started | Completed | Test Coverage | Notes |
|---|---------|-------|--------|-------|---------|-----------|---------------|-------|
| 1 | `firm-primitives` | 0 | ❌ not extracted | 1 (Fix 8) | ☐ | ☐ | — | create package, move from firm‑types; add `AgencyId`, `SubAccountId`, `PlatformId`, `SessionId` |
| 2 | `firm-types` | 2 | ⚠️ to split | 1 (Fix 8) | ☐ | ☐ | low (compile‑time) | domain entities + Ports only after split; shared kernel ADR required |
| 3 | `firm-utils` | 1 | ✅ ready | 1 | ☐ | ☐ | good | add `retry`, `sleep`, `paginate`; fix `hashIp` docs |
| 4 | `firm-errors` | 1 | ✅ ready | 1 | ☐ | ☐ | good | add `isRetryable`, `toTRPCError`, `toHTTPResponse` |
| 5 | `firm-crypto` | 1 | ✅ ready | 1 | ☐ | ☐ | good | remove `generateUUID`; add `generateSecureToken`, `encryptField`/`decryptField`, `deriveKey` |
| 6 | `firm-logger` | 1 | ❌ critical bug | 1 (Fix 9) | ☐ | ☐ | good (except split‑brain) | remove internal context store; add `child`, sampling, `createTestLogger` |
| 7 | `firm-request-context` | 1 | ⚠️ untested + design flaw | 1 (Fix 6) | ☐ | ☐ | **0%** — critical | replace `[key: string]: any` with module augmentation; add tests; add `withRequestContext` wrapper |
| 8 | `firm-env` | 1 | ✅ ready | 1 | ☐ | ☐ | excellent | add secret format validation; add `environment` export |
| 9 | `firm-validators` | 2 | ❌ broken | 1 (Fix 4) | ☐ | ☐ | minimal | add campaign imports, fix migrations, add factory fns, add tests |
| 10 | `firm-api-contracts` | 2 | ✅ ready | 1 | ☐ | ☐ | good | add `deprecateEvent`, `createWebhookPayloadSchema`, domain routers; oRPC ADR pending |
| 11 | `firm-db` | 2 | ⚠️ **to be split** | 1 (Fix 5 + Fix 14) | ☐ | ☐ | good | split into `firm-db-schema` + `firm-db-client` before any L6 build; update RLS API |
| 12 | `firm-cache` | 2 | ⚠️ needs TTL fix | 1 (Fix 1) | ☐ | ☐ | low (only JSON test) | add `acquireLock`, `warmCache` |
| 13 | `firm-security` | 3 | ❌ broken | 1 (Fix 2a) | ☐ | ☐ | partial | remove rate limiter (extracted to `firm-rate-limiter`); add `validateCorsOrigin`, `Permissions-Policy` |
| 14 | `firm-auth` | 3 | ⚠️ blocked | 1 (Fix 3) | ☐ | ☐ | good | fix role typing; remove deprecated impersonation; add sub‑account API key scoping |
| 15 | `firm-consent` | 3 | ✅ ready | 1 | ☐ | ☐ | good | add Google Consent Mode v3 (Jun 15), TCF 2.2, CNIL pixel suppression (Jul 14); fix `gpcApplied` in signed payload |
| 16 | `firm-observability` | 4 | ⚠️ deprecated | 1 (Fix 7) | ☐ | ☐ | minimal | add `withTenantSpan`, `captureError`, `createTenantMeter`, `resetForTesting` |
| 17 | `firm-health` | 4 | ⚠️ needs OTEL check | 1 (Fix 10) | ☐ | ☐ | good | add OTel health check; event‑driven registration; `setTimeout` recovery |
| 18 | `firm-config-eslint` | 0 | ✅ ready | 1 | ☐ | ☐ | N/A | add `workers` boundary type, `no-direct-fetch`, no‑direct‑write‑to‑read‑model rules |
| 19 | `firm-config-next` | 0 | ✅ ready | complete | ✅ | ✅ | good | add `serverExternalPackages` for Next.js 15 |
| 20 | `firm-config-tailwind` | 0 | ✅ ready | complete | ✅ | ✅ | N/A | add `v4/` export |
| 21 | `firm-config-typescript` | 0 | ✅ ready | complete | ✅ | ✅ | N/A | verify `worker` variant covers background workers |
| 22 | `firm-testing` | testing | ✅ ready (expanding) | 1 (Fix 15) | ☐ | ☐ | N/A | *(renamed from `firm-test-utils`)*; add PGLite, ioredis‑mock, harnesses, `createTenantIsolationFixture`, `mockAdapter`, `createOutboxHarness` |
| 23 | `firm-tokens` | 0/5 | ✅ ready | complete | ✅ | ✅ | snapshot | add `no-runtime-tokens-import` ESLint rule |

---

### 8.2 Phase 1 Structural Deliverables (New Packages Created During Hardening)

These packages do not exist today but are created during Phase 1 via extraction, split, or new development. They are tracked separately because they represent new artifacts in the repository.

| # | Package | Layer | Status | Started | Completed | Test Coverage | Key deliverable |
|---|---------|-------|--------|---------|-----------|---------------|-----------------|
| 24 | `firm-rate-limiter` | 3 | ❌ not built | ☐ | ☐ | — | extracted from `firm-security`; sliding window, token bucket, dry‑run, fail‑open |
| 25 | `firm-db-schema` | 2 | ❌ not built | ☐ | ☐ | — | split from `firm-db`; Drizzle schemas, RLS policies, migrations |
| 26 | `firm-db-client` | 2 | ❌ not built | ☐ | ☐ | — | split from `firm-db`; connection factories, outbox helpers, pagination, PgBouncer RESET |
| 27 | `adapters-storage-local` | 7 | ❌ not built | ☐ | ☐ | — | filesystem storage adapter; unblocks all local media development |
| 28 | `firm-config-k6` | 0 | ❌ not built | ☐ | ☐ | — | shared k6 configuration (base URLs, auth fixtures, ramp‑up profiles) |

---

### 8.3 Infrastructure Foundation Packages (Phase 2 – 17 packages, all ❌ not built)

| # | Package | Layer/Tier | Order | Started | Completed | Test Coverage | Key deliverable |
|---|---------|------------|-------|---------|-----------|---------------|-----------------|
| 29 | `firm-bus` | 6‑A | 1 | ☐ | ☐ | — | outbox processor, cron, sagas; **ADR pending** |
| 30 | `firm-flags` | 6‑A | 2 | ☐ | ☐ | — | flag evaluation, expiration, circuit breaker |
| 31 | `firm-metering` | 6‑A | 3 | ☐ | ☐ | — | usage counters, `checkQuota()` enforcement |
| 32 | `firm-audit` | 6‑A | 4 | ☐ | ☐ | — | immutable audit, crypto chaining, query/export |
| 33 | `firm-i18n` | 6‑A | 5 | ☐ | ☐ | — | locale detection, timezone, RTL, ICU pluralisation |
| 34 | `firm-template-engine` | 6‑A | 6 | ☐ | ☐ | — | templates, versioning, rendering; **ADR pending** |
| 35 | `firm-media` | 6‑A | 7 | ☐ | ☐ | — | storage, image pipeline, deduplication, CDN purge |
| 36 | `firm-tenant-config` | 6‑A | 8 | ☐ | ☐ | — | per‑tenant config, plan‑default merging, versioning |
| 37 | `firm-payments` | 6‑C | 9 | ☐ | ☐ | — | Stripe checkout, webhooks, payment methods |
| 38 | `firm-notifications` | 6‑A | 10 | ☐ | ☐ | — | multi‑channel, digest batching, in‑app unread count |
| 39 | `firm-webhooks` | 6‑A | 11 | ☐ | ☐ | — | outbound delivery, retry, signing, test ping, mTLS |
| 40 | `firm-search` | 6‑A | 12 | ☐ | ☐ | — | full‑text search, faceting, tenant isolation; **ADR pending** |
| 41 | `firm-sdk` | 2 | 13 | ☐ | ☐ | — | TypeScript client, pagination, `withTenant`, node/browser exports |
| 42 | `firm-migrations` | 6‑A | 14 | ☐ | ☐ | — | migration runner, drift check |
| 43 | `firm-seed` | 6‑A | 15 | ☐ | ☐ | — | deterministic seed data |
| 44 | `firm-sse` | 6‑A | 16 | ☐ | ☐ | — | Server‑Sent Events delivery channel |
| 45 | `firm-kpi` | 6‑A | 17 | ☐ | ☐ | — | business KPIs, anomaly alerts *(renamed from `firm-telemetry`)* |

---

### 8.4 Business Domain Packages (Phases 4‑7 – 22 packages, all ❌ not built)

#### Phase 4: Operations (8 packages)

| # | Package | Tier | Started | Completed | Key deliverable |
|---|---------|------|---------|-----------|-----------------|
| 46 | `firm-provisioning` | B | ☐ | ☐ | tenant lifecycle saga, dry‑run |
| 47 | `firm-compliance` | B | ☐ | ☐ | GDPR erasure (2‑phase), export, Art 30 reports |
| 48 | `firm-projects` | B | ☐ | ☐ | project/task mgmt, kanban, time tracking |
| 49 | `firm-sales-pipeline` | B | ☐ | ☐ | deal pipeline, forecasting *(renamed from `firm-pipeline`)* |
| 50 | `firm-documents` | B | ☐ | ☐ | PDF generation, e‑signature, collaborative review |
| 51 | `firm-appointments` | B | ☐ | ☐ | booking pages, buffer time, group appointments |
| 52 | `firm-workflow` | B | ☐ | ☐ | internal process automation; **ADR required** |
| 53 | `firm-integrations` | B | ☐ | ☐ | unified integration dashboard, health scoring |

#### Phase 5: Revenue (2 packages)

| # | Package | Tier | Started | Completed | Key deliverable |
|---|---------|------|---------|-----------|-----------------|
| 54 | `firm-subscriptions` | C | ☐ | ☐ | plan lifecycle, grace periods, grandfathering |
| 55 | `firm-billing` | C | ☐ | ☐ | invoicing, revenue recognition, multi‑currency |

#### Phase 6: Client‑Facing & Marketing (11 packages)

| # | Package | Tier | Started | Completed | Key deliverable |
|---|---------|------|---------|-----------|-----------------|
| 56 | `firm-reporting` | D | ☐ | ☐ | branded PDF reports, CQRS read model |
| 57 | `firm-cms` | D | ☐ | ☐ | content delivery, staging, multilingual fallback |
| 58 | `firm-forms` | D | ☐ | ☐ | form builder, partial save, CRM field validation |
| 59 | `firm-landing-pages` | D | ☐ | ☐ | landing page renderer, A/B tests, Core Web Vitals |
| 60 | `firm-funnels` | D | ☐ | ☐ | multi‑step funnel engine, cross‑channel, analytics |
| 61 | `firm-social` | D | ☐ | ☐ | cross‑platform scheduling, social listening |
| 62 | `firm-seo` | D | ☐ | ☐ | rank tracking, technical audits, schema markup |
| 63 | `firm-reputation` | D | ☐ | ☐ | review monitoring, competitor tracking, SLA alerts |
| 64 | `firm-ads` | D | ☐ | ☐ | ad performance aggregation, UTM management |
| 65 | `firm-ai` | D | ☐ | ☐ | AI infra: model routing, cost metering, lead scoring |
| 66 | `firm-ai-content` | D | ☐ | ☐ | AI generation: human‑approval gate, C2PA, NY disclosure |
| 67 | `firm-inbox` | D | ☐ | ☐ | unified conversation inbox, assignment, SLA tracking |

#### Phase 7: Portal (1 package)

| # | Package | Tier | Started | Completed | Key deliverable |
|---|---------|------|---------|-----------|-----------------|
| 68 | `firm-portal` | D | ☐ | ☐ | white‑label client portal API |

---

### 8.5 Adapter Packages (Phase 3 – 105 adapters, all ❌ not built)

**High priority (22):** HubSpot, Salesforce, GoHighLevel, Pipedrive, Zoho, ActiveCampaign, Keap (CRM); Resend, SendGrid, SES, Postmark, SMTP, Mailgun (Email); Stripe, Paddle, PayPal, Square (Payments); OpenAI, Anthropic, Google AI, Azure OpenAI (AI Models); S3, R2, **Local** (Storage – Local already tracked in §8.2)

**Medium priority:** Twilio, Vonage, MessageBird (SMS); Cal.com, Google Calendar, Outlook, Acuity (Booking); Plausible, GA4, Fathom, Mixpanel, PostHog (Analytics); Meta, Twitter, LinkedIn, TikTok (Social); Google Search Console, SEMrush, Ahrefs, Moz (SEO); Google Ads, Meta Ads, LinkedIn Ads, TikTok Ads (Paid Ads); Google Business Profile, Trustpilot, Yelp (Reviews); DocuSign, PandaDoc, Qwilr, Dropbox Sign (Proposals); Sanity, Strapi, Directus, Contentful (CMS); Puppeteer, PDFShift (PDF Generation); OpenAI DALL‑E 3, Stability AI (AI Image); Zoom, Google Meet, Microsoft Teams (Video Conferencing); ZeroBounce, NeverBounce, Kickbox (Email Validation)

**Low priority:** QuickBooks, Xero, FreshBooks (Accounting); Hotjar, CrazyEgg, Optimizely, VWO (CRO); Asana, Trello, Monday, ClickUp (Project Mgmt); Figma, Canva, Adobe CC (Design); Mux, YouTube, Vimeo, Wistia (Video); Intercom, Drift, Tidio, WhatsApp (Chat); Okta, Azure AD (SCIM – split per‑provider)

*Complete registry with per‑package tracking to be generated and maintained in `packages/layer7-adapters/REGISTRY.md`.*

---

### 8.6 Application Packages (Phase 8 – 22 apps, all ❌ not built)

| # | Application | Started | Completed | Purpose |
|---|-------------|---------|-----------|---------|
| 69 | `apps/platform/platform-portal` | ☐ | ☐ | internal agency hub |
| 70 | `apps/platform/platform-analytics` | ☐ | ☐ | agency analytics dashboards |
| 71 | `apps/platform/platform-crm` | ☐ | ☐ | lead and deal management |
| 72 | `apps/platform/platform-booking` | ☐ | ☐ | appointment scheduling |
| 73 | `apps/platform/platform-forms` | ☐ | ☐ | form builder |
| 74 | `apps/platform/platform-funnels` | ☐ | ☐ | funnel builder |
| 75 | `apps/platform/platform-landing-pages` | ☐ | ☐ | landing page editor |
| 76 | `apps/platform/platform-email` | ☐ | ☐ | email campaign management |
| 77 | `apps/platform/platform-seo` | ☐ | ☐ | SEO tools |
| 78 | `apps/platform/platform-reputation` | ☐ | ☐ | review monitoring |
| 79 | `apps/platform/platform-ads` | ☐ | ☐ | ad management |
| 80 | `apps/platform/platform-social` | ☐ | ☐ | social scheduling |
| 81 | `apps/platform/platform-content` | ☐ | ☐ | content/asset management |
| 82 | `apps/platform/platform-reporting` | ☐ | ☐ | reports and dashboards |
| 83 | `apps/platform/platform-proposals` | ☐ | ☐ | proposal builder |
| 84 | `apps/platform/platform-invoicing` | ☐ | ☐ | invoicing |
| 85 | `apps/platform/platform-projects` | ☐ | ☐ | project management |
| 86 | `apps/platform/platform-documents` | ☐ | ☐ | document management |
| 87 | `apps/platform/platform-chat` | ☐ | ☐ | unified inbox |
| 88 | `apps/platform/platform-storybook` | ☐ | ☐ | component library (Storybook) |
| 89 | `apps/platform/platform-admin` | ☐ | ☐ | platform administration |
| 90 | `apps/marketing-site` | ☐ | ☐ | agency public website |

**Client sites (`apps/clients/`):** Generated per client, not hand‑authored. **ADR pending** (ephemeral generation recommended). Not included in the count above as they are not committed code.

---

### 8.7 Phase Completion Summary (Revised)

| Phase | Target packages/actions | Current status | Started | Completed | Completion |
|-------|------------------------|----------------|---------|-----------|------------|
| 1 (Foundation Hardening) | 23 existing + 18 fixes/structural actions | ☐ not started | ☐ | ☐ | 0% |
| 2 (Infrastructure) | 17 new | ☐ not started | ☐ | ☐ | 0% |
| 3 (Adapters) | 105 new | ☐ not started | ☐ | ☐ | 0% |
| 4 (Operations) | 8 new | ☐ not started | ☐ | ☐ | 0% |
| 5 (Revenue) | 2 new | ☐ not started | ☐ | ☐ | 0% |
| 6 (Client‑Facing) | 11 new | ☐ not started | ☐ | ☐ | 0% |
| 7 (Portal) | 1 new | ☐ not started | ☐ | ☐ | 0% |
| 8 (Applications) | 22 apps | ☐ not started | ☐ | ☐ | 0% |

---

### 8.8 Overall Platform Metrics

| Metric | Value |
|--------|-------|
| Total planned packages (L0‑L7) | **187** |
| Total adapter packages | **105** |
| Total applications | **22** |
| Total background workers | **13** |
| **Total artifacts (packages + workers + apps)** | **~231** |
| Packages built today | **23** |
| Packages built after Phase 1 | **~28** (23 + new extracted/created) |
| Current package completion | **23 / 187 = 12.3%** |
| Current total artifact completion | **23 / 231 = 10.0%** |

**Note:** Completion percentages will be updated in real time as Phase 1 fixes are verified and new packages are committed with passing tests. Section 8 is the living project dashboard — it must be updated at the close of each phase.

---

---

*Document End*