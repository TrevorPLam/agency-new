# Marketing Agency Platform — Architecture Constitution & Enforcement Manual

**Type:** Immutable architectural constitution — layer taxonomy, package contracts, guarantees, enforcement, vocabulary.
**Companion:** `ASSESSMENT.md` — current package health, known bugs, build order, progress tracking.
**Rule:** This document changes only when architectural foundations are deliberately, formally updated. All features, adapters, and applications must comply.

---

## §1 Platform

### 1.1 Capabilities

Single unified codebase powering:
- Agency public website
- Per-client dedicated websites (brand + content)
- Landing pages for ad campaigns
- Native business apps: CRM, project management, booking, invoicing, reporting, client portals
- Adapters to **105+ third-party services**: email, SMS, social, ads, payments, CRMs, analytics, AI, storage, telephony, and more

### 1.2 Tenancy & Hierarchy

**Three-tier hierarchy:** Platform → Agency → Sub-Account (white-label reseller model).

- **Agency tenants** — fully isolated environment per agency.
- **Sub-accounts** — agency end-clients; inherit branding/billing from parent agency; strictly isolated from sibling sub-accounts.
- **Platform** — operator tier; any cross-tenant action is audited and scoped to a single tenant.

All data, config, and digital assets are isolated by tier. Branded types enforce the hierarchy at compile time — ID mix-ups across tiers are a build error, not a runtime risk.

| Branded Type | Tier | Gatekeeper |
|---|---|---|
| `PlatformId` | Platform | `asPlatformId()` |
| `TenantId` | Agency or Sub-Account (generic) | `asTenantId()` |
| `AgencyId` | Agency | `asAgencyId()` |
| `SubAccountId` | Sub-Account | `asSubAccountId()` |
| `UserId` | Any tier | `asUserId()` |
| `SessionId` | Any tier | `asSessionId()` |

Domain-level IDs (`LeadId`, `CampaignId`, `BookingId`, `InvoiceId`, `ProjectId`, `ContactId`, `DealId`, `FormId`, `PageId`, `ContentId`, `DocumentId`) are defined in `firm-types`, not `firm-primitives`. Raw `as TenantId` casts are banned by ESLint — gatekeepers only.

---

## §2 Layers

**Rule:** Each layer may only import from the same or lower layer. No upward imports. No circular dependencies. Enforced by `firm-config-eslint` (`boundaries` plugin + `dep-fence` script) on every CI run.

### 2.0 Layer Overview

| L | Name | Objective | Pkg count |
|---|------|-----------|-----------|
| 0 | Build & Constraint | Config factories, design-token pipeline, zero-runtime primitives | 13 |
| 1 | Core Utilities | Errors, crypto, logging, context, env, date, IDs, sanitization | 12 |
| 2 | Data & Contracts | Domain types, validation, API/event contracts, DB schemas, cache, SDK | 16 |
| 3 | Identity, Security & Consent | Auth, RBAC, rate limiting, GDPR/CCPA consent, policy | 5 |
| 4 | Observability & Health | Logs, traces, metrics, health probes | 2 |
| 5 | UI, Theming & Testing | Design tokens (consumed), component library, theme injection, test harnesses | 4 |
| 6 | Features & Workers | Business capabilities + all background processing | 38 |
| 7 | Adapters | Pluggable wrappers for 105+ third-party services — sole external bridge | 105+ |

---

### 2.1 L0 — Build & Constraint

**Rules:** No runtime code except `firm-primitives` gatekeepers. No imports from internal packages except `firm-primitives`. `exports` field = only public API; internal path imports fail CI. Config changes propagate via factory patterns — never manually updated per-app.

| Package | Provides |
|---------|----------|
| `firm-primitives` | Branded IDs (`TenantId`, `AgencyId`, `SubAccountId`, `PlatformId`, `SessionId`, `UserId`) + gatekeeper functions (`asTenantId`, `asAgencyId`, …). Domain-level IDs excluded — they live in `firm-types`. |
| `firm-config-eslint` | ESLint flat config: layer boundary enforcement (`boundaries`), branded-ID validation, `workers` boundary type, `no-direct-fetch` rule, `no-direct-read-model-write` rule. |
| `firm-config-typescript` | Strict TS base config: `strict`, no `any`, exhaustive switch, gatekeeper enforcement. Composite builds + declaration maps. |
| `firm-config-prettier` | Frozen formatting rules. |
| `firm-tokens` | W3C DTCG design tokens → CSS custom properties + TS constants. Build-time pipeline; `no-runtime-tokens-import` ESLint rule prevents direct runtime imports. |
| `firm-config-next` | Security-hardened Next.js 15 (App Router) config factory. Sets `serverExternalPackages: ['pino', 'drizzle-orm', 'postgres']` to prevent Node-native bundling errors. |
| `firm-config-tailwind` | Shared Tailwind safelist & content paths. |
| `firm-config-vitest` | Shared Vitest config factory. Coverage threshold: ≥80% line/function, ≥75% branch. Node and browser modes. |
| `firm-config-playwright` | Shared E2E config: browsers, base URLs, auth state. |
| `firm-config-commitlint` | Conventional commits enforcement. |
| `firm-config-docker` | Dockerfile template. Enforces: multi-stage builds; non-root user (UID ≥ 10000); `tini` as PID 1; `HEALTHCHECK CMD` calling `/health`. |
| `firm-config-storybook` | Shared Storybook config + theme injection. |
| `firm-config-security-headers` | CSP/HSTS/Permissions-Policy factory, decoupled from Next.js. Defaults: `camera=(), microphone=(), geolocation=(self), payment=(self)`. |

---

### 2.2 L1 — Core Utilities & Environment

**Rules:** Zero business logic. Zero upward imports (L2–L7). Zero side effects at import time except `firm-env` startup assertion. `console.log` banned — `firm-logger` only. Context propagation exclusively via `firm-request-context`'s `AsyncLocalStorage`. Expected failures → `Result.Err`; exceptions only for programmer errors. `tsgo` for `--noEmit` CI type-checks; `tsc` for declaration emit until TS7 GA (H2 2026).

| Package | Provides |
|---------|----------|
| `firm-env` | Validates all env vars at startup via Zod; refuses start on missing/malformed secrets. Exports typed `environment: 'development'\|'staging'\|'production'`. `getSecret(key)` lazy accessor (prevents cold-start timing attacks). Secret format validation: `.url()`, `.min(32)`, custom DB URL validator. |
| `firm-utils` | `Result<T,E>`, `tryCatchAsync`, deep-merge, string helpers, exhaustive checks. `retry<T>(fn, options)` — full-jitter exponential backoff with `maxAttempts`, `initialDelayMs`, `maxDelayMs`, `backoffFactor`, `isRetryable` hook, `onRetry` callback. `sleep(ms)` — typed cancellable. `paginate(cursor, limit, direction)` — pure cursor math. Named sub-exports: `@firm/utils/result`, `/retry`, `/pagination`. |
| `firm-errors` | Typed RFC 7807 error hierarchy with machine-readable codes. `isRetryable(error): boolean` — distinguishes network timeout/503/429 from validation/duplicate/404. `toTRPCError(error)`, `toHTTPResponse(error, status?)` — standardised serialisers. `FirmError.withContext(additions)` — builder for adapter-specific context. |
| `firm-crypto` | HMAC (constant-time), TOTP, `generateSecureToken(bytes)` — uniform-length crypto-secure tokens. `encryptField(value, keyId)` / `decryptField(ciphertext, keyId)` — AES-256-GCM column-level PII encryption (GDPR Art. 32, SOC 2 CC6.1); `keyId` enables rotation. `deriveKey(password, salt, iterations?)` — PBKDF2/Argon2 for per-tenant keys. (`generateUUID` removed — use `firm-id`.) |
| `firm-logger` | Structured JSON logging (Pino) with PII redaction. Reads context exclusively from `firm-request-context.getUnifiedContext()` — no internal store. `logger.child(bindings)` — module/operation scoping. Configurable sampling with guaranteed error/warn delivery. `createTestLogger()` — in-memory capture for test assertions. Auto `pino-pretty` in dev. |
| `firm-request-context` | `AsyncLocalStorage` carrying `RequestContext` (`correlationId`, `traceId`, `tenantId`, `userId`, session flags). Closed type via module augmentation (no `[key: string]: any`). `withRequestContext(fn)` — mandatory wrapper for all Inngest/BullMQ job handlers; restores `tenantId`/`traceId` in background workers. `extendContext(additions)` — typed race-safe merge helper. |
| `firm-date` | `toISOStringUTC(date)`, `parseISO(string)` (throws `FirmError` on invalid), `addDuration(date, duration)`, `isWithinWindow(date, start, end)`, `formatRelative(date, locale)`, `startOfPeriod(date, 'day'\|'week'\|'month')`, `isExpired(date)`. **Must exist before any L2 schema or `firm-bus` is built** — outbox retry scheduling requires shared date arithmetic to prevent DST/clock-skew divergence. |
| `firm-id` | `generateId()` — UUID v7 (time-ordered, B-tree performance). `generateShortId()` — nanoid-style 21-char URL-safe. `generateApiKeyToken()` — `firm_` prefixed, 32-byte crypto-random. `isValidId(string)`, `toSlug(name)` (lowercase, hyphenated, max 63 chars), `isValidSlug(string)`. **Must exist before any table is created** — UUID version affects every primary key. Distinct from `firm-primitives`: `firm-primitives` defines types; `firm-id` generates new IDs. |
| `firm-sanitize` | `sanitizeHtml(html, policy)` — named policies: `strict`, `rich-text`, `email`, `cms`. `stripHtml(html)`, `sanitizeUrl(url)` (blocks `javascript:`, `data:`), `sanitizeFilename(name)` (path traversal prevention), `escapeHtml(string)`. **L1 (not L3)** — pure defensive utility with no domain or auth deps. Required by ≥6 packages; centralised here to prevent divergent XSS attack surface. |
| `firm-invariant` | `invariant(condition, message): asserts condition` — throws `InvariantViolationError`. `assertNonNull<T>(value): asserts value is T`. `assertNever(value)` — exhaustive switch arm. `assertValidated<T>(schema, value): z.infer<T>` — inline Zod validation that throws `FirmError`. |
| `firm-circuit-breaker` | `createCircuitBreaker<T>(fn, options)` — CLOSED/OPEN/HALF-OPEN state machine. Configurable: `failureThreshold`, `recoveryTimeout`, `successThreshold`. `onStateChange` callback for metrics. `getState()` for health endpoints. Redis-backed per-tenant failure counts. **Must exist before any L7 adapter is built** — prevents thundering herd on provider recovery. |
| `firm-codec` | `toBase64Url` / `fromBase64Url` (URL-safe, no padding), `toHex` / `fromHex`, `encodeQueryString` / `decodeQueryString` (typed, handles arrays/unicode), `serializeJSON` / `deserializeJSON<T>(string, schema)` (handles `Date`, `BigInt`, circular refs), `toCSV(rows)`. |

---

### 2.3 L2 — Data & Contracts

**Rules:** No business logic — defines shape, not behaviour. No upward imports (L3–L7). Every entity, schema, event, and table definition exists in exactly one place. **drizzle-zod bridge law:** Drizzle table = single structural source of truth; `firm-validators` imports `createInsertSchema`/`createSelectSchema` and adds only `.refine()` business rules — no manually-written structural Zod schemas. All cache keys via `CacheKeyFactory(tenantId)` — raw string concatenation is a lint error. Every new tenant-scoped table requires an RLS policy and an isolation test in the same PR.

| Package | Provides |
|---------|----------|
| `firm-types` | TS interfaces for all domain entities: Leads, CRM, Marketing, Content, Operations, Commercial, Automation, Reputation/SEO, Compliance, Messaging, Platform (scope defined by ADR-003). Domain-level branded IDs: `LeadId`, `CampaignId`, `BookingId`, `InvoiceId`, `ProjectId`, `ContactId`, `DealId`, `FormId`, `PageId`, `ContentId`, `DocumentId`. API envelopes. No runtime code. Port interfaces extracted to `firm-ports`. |
| `firm-validators` | Single source of validation. Zod schemas derived from Drizzle tables via `drizzle-zod`; adds only cross-field `.refine()` rules. Schema factories: `createPaginationSchema()`, `createTenantScopedSchema(base)`, `createVersionedSchema(schema, v)`, `createIdempotencySchema()`, `createWebhookPayloadSchema(eventSchema)`, `createAuditableSchema(base)`. `satisfies` CI gate ensures every Zod schema satisfies its TS interface. |
| `firm-api-contracts` | Typed tRPC routers (per-domain sub-routers from day one), OpenAPI schemas. HTTP contracts only — event contracts extracted to `firm-events`. oRPC ADR pending (single contract → tRPC + OpenAPI + type-safe fetch). |
| `firm-events` | `defineEvent(name, version, payloadSchema)`, `deprecateEvent(name, version, sunsetDate)` (CI blocks new handler registrations past sunset), `EventRegistry` (read by `firm-bus` at startup), `createEventHandler(name, versions, handler)`, `CloudEventsEnvelope<T>`, `createWebhookPayloadSchema(eventSchema)`, `generateAsyncApiDocument(registry)` → AsyncAPI 3.0 for `contracts/v1/`. **Prerequisite for `firm-bus`.** |
| `firm-db-schema` | Drizzle table definitions for all entities. RLS policy generators (default + parent-agency policies). Migration source of truth. `drizzle-zod` bridge: exports `createInsertSchema(table)`, `createSelectSchema(table)`. Zero runtime connection dependencies — importable in tests without a DB. |
| `firm-db-client` | Connection factories: `serverless`, `pooled`, `direct` — explicit, never auto-detected. `withTenantContext(tenantId, fn)` — wraps queries with RLS context setup/teardown + PgBouncer-safe RESET on exit (prevents `SET LOCAL` leaking across pooled connections). `withTransaction(fn)` — never exposes raw `BEGIN/COMMIT/ROLLBACK`. `writeToOutbox(event, payload, options)` — only permitted outbox write path. `paginateCursor(query, cursor, limit)`, `softDelete(table, id)`, `includeSoftDeleted(query)`, `batchQuery<T>(ids, fn)` — prevents N+1. `withOptimisticLock(table, id, version)`. |
| `firm-db-read` | Denormalised read-optimised schema for `firm-reporting`. Separate connection pool — never shares write pool. Populated exclusively by `firm-bus` outbox event handlers. `no-direct-read-model-write` ESLint rule blocks direct writes from any other package. |
| `firm-db-migrations` | `runMigrations(connStr, options?)`, `checkDrift()` (CI gate: fails on schema/definition mismatch), `generateMigration(name)`, `rollback(steps, connStr)` (non-prod only), `getTenantMigrationState(tenantId)`, `recordTenantMigration(tenantId, version)`. CLI: `pnpm db:migrate`, `db:check-drift`, `db:generate`. |
| `firm-db-seed` | Deterministic idempotent seed data for all three tiers. `seedPlatform(db)`, `seedAgency(db)`, `seedSubAccount(db, agencyId)`, `seedLeads(db, tenantId, count)`, `seedCampaigns(db, tenantId)`, `clearTenant(db, tenantId)`. Fixed random seed by default for reproducible integration tests. Uses `withTenantContext()` to respect RLS during seeding. |
| `firm-cache` | Tenant-scoped Redis client. `CacheKeyFactory(tenantId)` auto-prefixes all keys. Tag-based invalidation with `scope: 'local'\|'global'` (global is no-op initially — interface fixed from start). `lock(key, fn, ttl)` — distributed lock via Redlock (multi-node) or SETNX+TTL (single-node). Prometheus counters: `firm.cache.hit`/`miss` tagged with hashed `tenantId`, `keyPrefix`, `layer`. TTL Zod-validated at `set()` call site. |
| `firm-idempotency` | `createIdempotencyStore(redis)` — tenant-scoped. `withIdempotency(key, fn, options)` — check → execute → store; handles in-flight duplicates. `IdempotencyKey` branded type (prevents raw strings). `generateIdempotencyKey(namespace, inputs)` — deterministic server-side keys. `parseIdempotencyHeader(request)`. TTL default 24h. Same key + different body → `IDEMPOTENCY_CONFLICT`. |
| `firm-query` | `createTenantQuery(db, tenantId)` — scoped helper, auto-calls `withTenantContext`, verifies `TenantId` type. `withSoftDeleteFilter(query)`, `paginateCursor<T>(query, options)`, `withAuditFields()`, `batchQuery<T>(ids, fn)`, `withOptimisticLock(table, id, version)`. **Prerequisite for all L6 packages.** |
| `firm-pagination` | `PaginatedResponse<T>` — `{ data, nextCursor, prevCursor, hasNextPage, totalCount? }`. `encodeCursor(value)`, `decodeCursor(cursor)` (returns `FirmError` if tampered). `createPageSchema<T>(itemSchema)`. Constants: `DEFAULT_PAGE_SIZE = 25`, `MAX_PAGE_SIZE = 100`. `OffsetPage` for admin list views. |
| `firm-ports` | 22 typed Port interfaces extracted from `firm-types` (different versioning cadence, different consumers). `CRMPort`, `EmailPort`, `SMSPort`, `StoragePort`, `AnalyticsPort`, `AITextPort`, `AIImagePort` (return type includes `c2paManifestMetadata`), `SocialPort`, `AdsPort`, `SEOPort`, `ReviewsPort`, `BookingSystemPort`, `CalendarSyncPort`, `PaymentsPort`, `AccountingPort`, `ProjectMgmtPort`, `ProposalPort`, `ChatPort`, `VideoPort`, `DesignPort`, `AutomationPort`, `PDFPort`, `EmailValidationPort`, `TelephonyPort`, `VoiceAgentPort`, `VoicemailDropPort`, `ObservabilityTagPort`, `ExperimentationPort`. Plus `createPortMock<T extends Port>()` — type-safe mock factory. Port versioning via `@since` JSDoc tags. **Prerequisite for all L7 adapters.** |
| `firm-schema-registry` | Machine-readable registry of all event/API schema versions and status (active/deprecated/sunset). `validateSchemaCompatibility(old, new)` — breaking-change detection (new required field = breaking; removal = breaking). `generateContractArtifacts(registry)` → OpenAPI, AsyncAPI 3.0, JSON Schema for `contracts/v1/`. CI gate rejects PRs with breaking schema changes without version bump. Consumer tracking maps package → accepted versions for safe sunset. |
| `firm-sdk` | Typed tenant-aware TypeScript client for the platform API. Generated from tRPC router in `firm-api-contracts`. Sub-exports: `@firm/sdk/node` (pooling, streaming), `@firm/sdk/browser` (fetch, tree-shakeable). `FirmClient.withTenant(tenantId)` mandatory entry point — no tenant-unscoped operations. `verifyWebhookSignature(payload, sig, secret)`. Parses `X-RateLimit-Remaining` and surfaces warnings. |

---

### 2.4 L3 — Identity, Security & Consent

**Rules:** Per-request CSP nonce on dynamic pages — `unsafe-inline`/`unsafe-eval` never allowed. All rate limits reference named policies in `firm-rate-limiter`'s registry — inline limits cause build failure. `SessionContext` deeply frozen after creation. RBAC matrix lives in a single file; every protected route calls `requirePermission()`. Consent is a structural gate, not a UI preference — GPC forces denial of marketing/analytics. Every privileged action writes an immutable audit record with cryptographic checksum.

| Package | Provides |
|---------|----------|
| `firm-security` | CSP generation + security headers. Named rate-limiting policy registry (engine is in `firm-rate-limiter`). Turnstile verification. Tag registry — third-party scripts gated by consent; every tag requires `integrity` SRI hash and declared consent category. C2PA manifest generation (EU AI Act Art. 50). `validateOutboundUrl(url, options)` — SSRF protection: enforces `https://`, blocks RFC 1918, loopback, link-local 169.254.x.x. `generateSriHash(scriptContent)`. `buildCsp(nonce, tenantId, consentedTags)` — integrates `firm-consent` state. |
| `firm-rate-limiter` | Redis-backed sliding window + token-bucket rate limiter. Plan-tier-aware limits (Starter/Pro). Named policy registry = single source of truth. `responseMode: 'hard'\|'graduated'` — graduated: warn at 80% (`X-RateLimit-Warning`), throttle at 90%, block at 100%. `setEmergencyOverride(policyName, limits, ttl)` — hot-reload without deployment. `scope: 'local'\|'global'` from start (multi-region ready). `registerAdaptivePolicy(name, triggerFn)` — feedback hook. Fail-open when Redis unreachable (CRITICAL log + alert). Dry-run mode for tuning. |
| `firm-auth` | Session management (frozen immutable `SessionContext`). RBAC — single permission matrix: `platform-admin`, `agency-admin`, `sub-account-admin`, `sub-account-user`. `requirePermission(action, resource, context?)` — `context` param reserved for ABAC extension (omitting it later is a breaking change). API keys: constant-time HMAC, `scope: PermissionScope[]`, `expiresAt`, `ipAllowlist?: CIDR[]`, `rateLimit?: PolicyName`. TOTP MFA. Passkey/WebAuthn: `credentialId` + `credentialType: 'totp'\|'passkey'\|'magic-link'` reserved in session schema. `refreshSession(refreshToken)`, `revokeSession(sessionId)`, `RevocationStore`. Secure impersonation/delegation with audit logging. `validateCorsOrigin(origin, tenantId)` backed by `firm-tenant-config`. SCIM orchestration: `onUserProvisioned`, `onUserDeprovisioned`, `onGroupUpdated`. `createDelegatedSession(userId, agentId, scope, ttl)` — AI agent delegation. |
| `firm-consent` | Full GDPR/CCPA lifecycle: HMAC-signed server-side cookie parsing. GPC detection → overrides marketing/analytics consent (`gpcApplied` flag in signed payload). Google Consent Mode v3 translation layer (deadline: Jun 15). TCF 2.2 consent string encoding for EU programmatic ads. React-level rendering gate — unconsented scripts never injected. `shouldTrackEmail(userId, tenantId, jurisdiction): boolean` — CNIL pixel suppression. Consent state change events written to `firm-audit` (GDPR Art. 7(1)). |
| `firm-policy` | `PolicyRule`, `evaluate(request): PolicyDecision`. `createRbacMatrix(matrix)`, `createAbacPolicy(rules)`. `PermissionGuard` — React + server-side guard component. Decision caching (TTL 30–60s). Deny decision → auto-write to `firm-audit`. |

---

### 2.5 L4 — Observability & Health

**Rules:** Every service must produce structured logs, metrics, and distributed traces — three-pillar requirement enforced pre-production and continuously. Readiness probe fails if OpenTelemetry SDK is not exporting spans — no traffic routed until resolved. Liveness probes never touch external dependencies. PII never appears in plaintext in logs, errors, or Sentry events.

| Package | Provides |
|---------|----------|
| `firm-observability` | Init utilities for logs, traces (OpenTelemetry), metrics (Prometheus), error tracking (Sentry), RUM. `withSpan(name, fn)`, `withTenantSpan(name, tenantId, fn)` — automatically attaches `tenantId`, `userId`, `correlationId` to spans. Dual-level PII redaction: field-path stripping + regex scanner. Log sampling: errors/warnings never dropped; health-check logs sampled at configurable rate. Distributed tracing via W3C Trace Context: browser → API → worker → adapter. |
| `firm-health` | Kubernetes-style probes. Liveness: event-loop only. Readiness: all critical deps in parallel + RLS coverage check + `observabilityHealthCheck()` (OTel init + span export verified). Startup: bootstrap sequence. RLS probe: queries `pg_tables` for `rowsecurity=true`; any missing table → `unhealthy`, deployment blocked. |

---

### 2.6 L5 — UI, Theming & Testing

**Rules:** Token pipeline from single DTCG source file — never hand-edit generated output. Every component uses `var(--firm-…)` — hardcoded visual values fail CI. Theme contrast validated before storage (WCAG AA); inaccessible combinations rejected. `firm-testing` produces zero production artifacts.

| Package | Provides |
|---------|----------|
| `firm-tokens` | W3C DTCG design tokens → CSS custom properties + TypeScript constants. Same source as L0; at runtime, CSS output is consumed by `firm-ui`. No runtime import of `@firm/tokens` — ESLint enforced. |
| `firm-ui` | Shared component library. Sub-exports: `@firm/ui/primitives` (Button, Input, Select, Textarea, Checkbox, Radio, Switch, Badge, Avatar, Icon), `@firm/ui/composed` (Form, FormField, Modal, Toast, Table, Card, Tabs, Accordion, Dropdown, Combobox), `@firm/ui/layout` (Page, Sidebar, Topbar, Container, Grid, Stack, Divider), `@firm/ui/dataviz` (Nivo chart wrappers), `@firm/ui/marketing` (Hero, CTA, FeatureGrid, Testimonial, PricingCard). Radix UI headless primitive layer. WCAG AA: keyboard navigation, focus management, ARIA roles. All variants require Storybook stories before merge. Theming via `data-theme` + CSS custom properties resolved by `firm-tenant-config` server-side — `firm-ui` never fetches config itself. |
| `firm-theme-provider` | React context provider receiving tenant branding (resolved server-side) and exposing it for CSS variable injection. Formerly `firm-config` — renamed to avoid collision with 13 L0 `firm-config-*` packages. |
| `firm-testing` | `createUnitHarness()` — PGLite + ioredis-mock. `createIntegrationHarness()` — real DB + Redis, isolated tenant lifecycle. `createE2eHarness()` — full stack, Playwright-backed. `createTenantIsolationFixture()` — sets up two tenants, asserts zero data bleed. `mockAdapter<T extends Port>()` — type-safe mock for any Port. `createOutboxHarness()` — captures outbox events without full DB transaction. |

---

### 2.7 L6 — Features & Workers

**Universal rules:** Named exports only; `exports` field = public API. Test coverage ≥80%. `console.log` banned. DB access via `firm-db-client` typed helpers only. All async work via transactional outbox; `firm-bus` dispatches. Workers live in `workers/` (renamed from `services/`), import from feature packages, never from `apps/`. `checkQuota()` must be called before every metered operation — CI static-analysis gate (Gate New2) enforces this. AI content output is always `pending_approval`; only `approveContent()` with `content:approve` permission sets `approved` — no bypass. `firm-workflow` (internal ops) and `firm-funnels` (external marketing) have strictly separate bounded contexts enforced by event contracts.

#### Tier A — Core Infrastructure (14)

| Package | Responsibility |
|---------|---------------|
| `firm-bus` | Event bus + outbox reader, retries (exponential backoff, dead-letter), cron jobs, sagas with compensation. Execution model (Inngest vs. custom outbox) is under formal ADR — interface abstracted regardless of outcome. |
| `firm-flags` | Feature flags: boolean, rollout %, segments, plan-gated. Temporary flags require `expiresAt` — CI enforces. Expired flag evaluates `false`. Redis unreachable → returns `defaultValue` (logged + alerted). |
| `firm-metering` | Usage recording per tenant per period (leads, emails, AI tokens, storage, API calls). `checkQuota(tenantId, dimension, amount)` — pre-operation enforcement; rejects before overage. `recordUsage()` — post-operation. Emits `metering.quota.warning` at 80% utilisation. |
| `firm-audit` | Immutable, cryptographically chained audit log. `writeAuditRecord`, `verifyAuditChain`, `exportAuditLog`, `createAuditMiddleware()`, `AuditedOperation<T>`, `expungeRecord` (GDPR erasure only). SQL hash chain — tamper-detectable. |
| `firm-tenant-config` | Resolves per-tenant config (branding, features, SEO, consent) via cache → DB → migration → Zod. Emits `tenant-config.updated` for CDN + theme invalidation. Merge-with-defaults; 5-version rollback. |
| `firm-template-engine` | Template rendering: emails, SMS, PDFs, webhooks. Version history, locale vars, preview. Liquid for email/SMS; Handlebars for PDF (ADR pending). |
| `firm-notifications` | Multi-channel delivery: email, SMS, push, in-app. Digest batching, per-channel retry policies, unread count persistence. |
| `firm-webhooks` | Outbound delivery to tenant endpoints. Signs payloads (HMAC), retries with exponential backoff, logs delivery attempts. |
| `firm-sse` | Server-Sent Events delivery channel for real-time dashboard and portal updates. |
| `firm-media` | Multi-provider file storage, image/video processing, metadata stripping, CDN. Tenant-scoped via path prefix. Enforces storage quota via `checkQuota()`. |
| `firm-search` | Full-text search with tenant isolation (external index partitions + per-tenant keys, OR PostgreSQL RLS — documented before implementation per ADR). |
| `firm-i18n` | Translation keys, locale-aware formatting (dates, numbers, currencies, addresses), RTL support, ICU MessageFormat pluralisation. |
| `firm-ai` | AI infrastructure: provider client management via L7 adapters, token counting, cost metering, model routing, rate limiting. No generation logic, no approval gates. Home for analytical AI: lead scoring, personalisation. |
| `firm-policy` | *(see L3 — cross-layer; governs access decisions consumed by L6 packages)* |

#### Tier B — Operations (8)

| Package | Responsibility |
|---------|---------------|
| `firm-provisioning` | Tenant lifecycle: creation, plan changes, suspension, offboarding (GDPR erasure). Idempotent, compensable sagas. Inherit-and-detach model for sub-accounts (copy, not link, agency defaults). Dry-run mode. |
| `firm-compliance` | GDPR/CCPA engine: right-to-erasure sagas (anonymise → export → retain → hard delete), data portability, residency enforcement (GDPR Art. 32), Art. 30 report generation. |
| `firm-projects` | Project/task management, time tracking (billable/non-billable), kanban, client-facing status. Task dependency tracking. `ProjectTemplate` aggregate + `createProjectFromTemplate()`. |
| `firm-sales-pipeline` | CRM deal pipeline (leads → stages → won/lost), conversion forecasting. `lead.scored` event (payload: `leadId`, `score`, `confidence`, `scoringModelVersion`, `factors[]`) emitted by `firm-ai`, consumed here. Formerly `firm-pipeline`. |
| `firm-documents` | Document generation (PDF), e-signature, collaborative review, multi-signatory, document analytics. Proposals are a subtype. DOCX/HTML template merge fields (`{{client.name}}`, `{{deal.amount}}`). |
| `firm-appointments` | Calendar management, booking pages, staff availability, buffer times, group appointments, no-show policies. Round-robin assignment + collective booking (distinct from group appointments). |
| `firm-workflow` | Internal process automation ("when X → do Y"). Visual builder. Condition model, state machine, trigger types, and compensation model defined by ADR-007 before any build. |
| `firm-integrations` | Unified dashboard for all third-party connections: health, OAuth, usage analytics. Composite health scoring. Proactive OAuth token refresh → `getValidToken(providerId, tenantId)` for adapter injection. |

#### Tier C — Revenue (3)

| Package | Responsibility |
|---------|---------------|
| `firm-subscriptions` | Plan lifecycle: upgrades, trials, cancellation, grace periods, grandfathering. Reads entitlements from `firm-flags`, usage from `firm-metering`. `computeUsageCharge(tenantId, billingPeriod): UsageLineItem[]`. |
| `firm-payments` | Payment transactions: Stripe Customer, charges, refunds, disputes. Split payments, multi-method storage. Two-tier idempotency: financial webhooks (Stripe, Paddle, PayPal) → PostgreSQL; others → Redis. |
| `firm-billing` | Invoicing, revenue recognition, dunning, financial reporting. Multi-currency, tax jurisdiction detection, aging reports. `SplitRule` aggregate (platform % + agency %) for white-label reseller revenue share. |

#### Tier D — Client-Facing & Marketing (12)

| Package | Responsibility |
|---------|---------------|
| `firm-portal` | White-label client portal. Per-sub-account module config. Portal activity audit. |
| `firm-inbox` | Unified conversation inbox: assignment, routing, SLA tracking, tagging. All inbound channels converge here (email, SMS, social DMs via `social.dm.received`, chat). |
| `firm-reporting` | Pre-computed metrics, branded PDF/email reports, CQRS read model (dedicated connection pool, no direct writes). Report scheduling, anomaly detection, shareable links. |
| `firm-cms` | Headless CMS: content staging, SEO metadata, multilingual locale fallback. |
| `firm-forms` | Form builder: conditional logic, multi-step, partial save/resume, field-level abandonment analytics, CRM field-mapping validation at publish time. |
| `firm-landing-pages` | Block-based page builder, A/B testing, Core Web Vitals tracking per variant. Pixels fire only after consent granted. |
| `firm-funnels` | Multi-step behaviour-driven marketing automation, cross-channel. Funnel analytics, pause/resume. Entry rate, step completion, drop-off tracked. |
| `firm-social` | Cross-platform social: calendar, scheduling, approvals. Outbound only — inbound DMs route to `firm-inbox` via `social.dm.received` event. |
| `firm-seo` | Keyword rank tracking, backlink monitoring, technical SEO audits, structured data management, SERP feature detection. |
| `firm-reputation` | Review monitoring, competitor tracking, SLA response-time monitoring. AI-suggested replies with mandatory human-approval gate — no auto-publishing. |
| `firm-ads` | Ad performance aggregation, budget alerts, UTM management, creative performance, ad fatigue detection, frequency cap alerts. |
| `firm-ai-content` | AI content + image generation. Output always `pending_approval`. `approveContent()` requires `content:approve` permission. C2PA manifest generated and stored (EU AI Act Art. 50 — deadline Aug 2). NY Synthetic Performer disclosure embedded in `ai_generation_log` (deadline Jun 9). |

---

### 2.8 L7 — Adapters

**Rules:** Feature packages never call third-party SDKs directly — only through Port interfaces defined in `firm-ports`. All adapters generated via scaffolding generator (never hand-authored). Generator simultaneously produces adapter package, stub, and Port conformance test. Every adapter must: `implements <Port>`; lazy-init client from `firm-env`; transform provider types → canonical types; verify webhook signatures (constant-time, raw body only); expose Prometheus metrics (call count, latency, errors); map provider errors → `FirmError`; wrap every external call in `firm-circuit-breaker`; receive `getValidToken(providerId, tenantId)` as constructor dependency (platform-managed OAuth refresh via `firm-integrations`). Naming convention: `adapters-<category>-<provider>`.

**Webhook security (non-negotiable):** Constant-time signature verification. Replay protection: ±5 min timestamp tolerance + idempotency key store. Raw request body only for HMAC — parsed payload untrusted. Financial webhooks (Stripe, Paddle, PayPal) → PostgreSQL idempotency store; all others → Redis.

| Category | Count | Providers |
|----------|-------|-----------|
| CRM | 7 | HubSpot, Salesforce, GoHighLevel, Pipedrive, Zoho, ActiveCampaign, Keap |
| Email | 6 | Resend, SendGrid, SES, Postmark, SMTP, Mailgun |
| SMS | 4 | Twilio, Vonage, MessageBird, Sinch |
| Analytics | 5 | GA4, Plausible, Fathom, Mixpanel, PostHog |
| Observability Tags | 2 | Hotjar, CrazyEgg |
| Experimentation | 2 | Optimizely, VWO |
| SEO | 4 | Search Console, Semrush, Ahrefs, Moz |
| Paid Ads | 4 | Google Ads, Meta Ads, LinkedIn Ads, TikTok Ads |
| CMS | 4 | Sanity, Strapi, Directus, Contentful |
| Booking Systems | 2 | Cal.com, Acuity |
| Calendar Sync | 2 | Google Calendar, Outlook |
| Payments | 4 | Stripe, Paddle, PayPal, Square |
| Accounting | 3 | QuickBooks, Xero, FreshBooks |
| AI Models | 4 | OpenAI, Anthropic, Google AI, Azure OpenAI |
| AI Image Gen | 2 | OpenAI DALL-E, Stability AI |
| Social | 4 | Meta, Twitter/X, LinkedIn, TikTok |
| Reviews | 3 | Google Business Profile, Trustpilot, Yelp |
| Proposals | 4 | PandaDoc, Qwilr, DocuSign, Dropbox Sign |
| Project Mgmt | 4 | Asana, Trello, Monday, ClickUp |
| Design | 3 | Figma, Canva, Adobe CC |
| Video | 4 | YouTube, Vimeo, Wistia, Mux |
| Chat | 3 | Intercom, Drift, Tidio |
| SCIM | 2 | Okta, Azure AD |
| PDF Generation | 2 | Puppeteer (self-hosted), PdfShift (cloud) |
| Video Conferencing | 3 | Zoom, Google Meet, Microsoft Teams |
| Email Validation | 3 | ZeroBounce, NeverBounce, Kickbox |
| Storage (Cloud) | 4 | S3, R2, Azure Blob, GCS — 🔴 production blocker for `firm-media` |
| Storage (Local) | 1 | Filesystem — dev only |
| Speech-to-Text | 4 | Deepgram, AssemblyAI, Whisper, Google STT |
| Messaging / WhatsApp | 3 | Meta Business, Twilio WhatsApp, 360dialog |
| Telephony | 4 | Twilio Voice, Telnyx, Vonage, Plivo |
| Voice AI Agents | 3 | Vapi, Retell AI, Bland AI |
| Voicemail Drop | 2 | Drop Cowboy, Slybroadcast |
| iPaaS | 3 | Zapier, Make, n8n |
| E-Commerce | 3 | Shopify, WooCommerce, Stripe Connect |
| Team Communication | 3 | Slack, Microsoft Teams, Discord |
| Data Enrichment | 4 | Clearbit, Apollo, Hunter, ZoomInfo |
| Tax Calculation | 3 | Avalara, TaxJar, Stripe Tax |
| Map Listings | 4 | Google Business Profile, Apple Maps, Yext, Bing Places |
| Push Notifications | 3 | FCM, APNs, OneSignal |
| Translation | 3 | DeepL, Google Translate, AWS Translate |
| Fraud Detection | TBD | TBD |
| Identity Verification | TBD | TBD |
| Link Shortener | TBD | TBD |
| AI Video Gen | TBD | TBD |
| Text-to-Speech | TBD | TBD |

**Auto-generated registry:** `packages/layer7-adapters/REGISTRY.md` maps every adapter to its Port, stub status, and conformance test status. Regenerated on every adapter creation. CI (Gate 13) validates registry matches packages on disk.

Here is §3, §4, §5, §6, and §7 — the remainder of the Blueprint.

***

## §3 Immutable Stress-Test Commitments

Four non-negotiable guarantees. Enforced by automated mechanisms (§4). No exceptions, no feature-flag bypasses, no temporary waivers.

---

### 3.1 Tenant Isolation

**Commitment:** Every tenant's data, config, and assets are invisible to others at the same hierarchy level. Exception: deliberate, audited parent-child relationships — an agency admin may access its own sub-accounts. Sibling sub-accounts are strictly isolated.

**What this means in practice:**
- A request for Sub-Account A never returns data from Sub-Account B.
- Compromised sub-account credentials: blast radius limited to that sub-account only.
- Agency admins may view aggregated or individual data across their sub-accounts — scoped, audited, and not the default.
- Platform admins: any cross-tenant action is audited and scoped to a single tenant at a time.

**Enforcement (architectural):**
- `tenant_id` column on every tenant-scoped table. The `tenants` table carries `parent_tenant_id` (nullable) and `tenant_type` (`agency | sub_account | platform`).
- Row-Level Security (RLS) on every tenant-scoped table:
  - Default policy: `tenant_id = current_setting('app.current_tenant_id')::uuid`
  - Agency-admin policy: `tenant_id IN (SELECT id FROM tenants WHERE parent_tenant_id = current_setting(...))`
- `withTenantContext()` sets `app.current_tenant_id` and, for agency admins, a parent-scope flag. The PgBouncer-safe RESET wrapper in `firm-db-client` clears both on connection release.
- API requests extract `tenantId` from JWT/session before any business logic. `CrossTenantAccessError` (HTTP 403) on violation — never 404 (never confirm resource existence across tenants).
- Background workers restore tenant context from outbox event metadata.

---

### 3.2 Usage Control

**Commitment:** Resource-intensive operations are protected by pre-operation quota checks and plan-aware rate limiting. No tenant silently exceeds their plan limits; no single tenant can overwhelm shared infrastructure.

**What this means in practice:**
- Bulk export of 500k leads cannot starve other clients' DB connections.
- Brute-force login attacks are blocked by sliding-window rate limiting.
- AI generation, large file processing, and email sends are throttled per tenant per service tier.
- Metered operations are checked *before* execution — not discovered as overages afterward.

**Enforcement (architectural):**
- Every rate-limited endpoint references a **named policy** defined in `firm-rate-limiter`'s policy registry. No inline limits — inline values cause build failure.
- Sliding-window limiter backed by Redis. Redis unreachable → fail-open, logged and alerted.
- Token-bucket admission for expensive ops; concurrency limited by tenant's service tier.
- `graduated` response mode: warn at 80% (`X-RateLimit-Warning`), throttle at 90%, block at 100%.
- `firm-metering.checkQuota(tenantId, dimension, amount)` is the mandatory pre-operation enforcement point. CI static-analysis gate ensures it is called before any metered operation in every feature package.
- All limits surfaced in response headers: `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

---

### 3.3 Event Reliability

**Commitment:** No business event is ever silently lost. Events triggering critical side effects are persisted atomically before transaction commit. Every event is processed at least once. The complete event catalog is externally verifiable through a machine-generated, versioned AsyncAPI contract.

**What this means in practice:**
- Form submission → lead created, welcome email sent, CRM updated — all happen even if the server crashes immediately after.
- Email provider down: retry with exponential backoff; after max attempts, move to dead-letter queue.
- Payment processed but outbox worker crashes: event is re-delivered; idempotency key prevents duplicates.
- External webhook consumers and SDK integrators rely on a machine-generated, committed AsyncAPI 3.0 document describing every event type and version the platform may emit.

**Enforcement (architectural):**
- **Transactional outbox:** within the same DB transaction as business data, insert into `outbox_events`. If transaction rolls back, event is atomically removed — no phantom events.
- Separate worker reads outbox, dispatches to handlers, marks `completed` on success.
- Failure: increment `attempts`, schedule retry with exponential backoff. After max attempts → dead-letter queue, alert.
- **Idempotency keys** in every event. Handlers check before acting — prevents double-booking, double-charging, duplicate sends.
- Long-running workflows modelled as **sagas** with explicit compensation paths. Step failure → reverse prior steps (e.g., refund, cancel, de-provision). Saga state schema (`saga_instances`) is defined in `firm-db-schema` at Layer 2 — keeping the saga contract schema-governed, not implicit in the Layer 6 implementation.
- **AsyncAPI generation gate (Gate 16):** `scripts/ci/generate-asyncapi.ts` reads the EventRegistry, produces AsyncAPI 3.0, and fails the build if any registered event lacks a channel definition.

---

### 3.4 Schema Governance

**Commitment:** The shape of every DB table, API response, event payload, and validation rule is defined in a single auditable location. ORM schemas and event schemas never drift. Events are versioned; every consumer declares accepted versions. Versioned, distributable schema artifacts are produced by an automated build pipeline and committed as the canonical contract for external consumers.

**What this means in practice:**
- Adding `preferredContactMethod` to `Lead` → DB migration, Zod validator, TS interface, API response, and event payloads all reflect the change. Build-time check enforces consistency.
- Breaking event change: new version (e.g., `lead.created v2`). Old handlers continue receiving v1 until they explicitly support v2.
- A handler never receives a payload shape it hasn't declared it can process.
- The `contracts/v1/` OpenAPI, AsyncAPI, and JSON Schema artifacts exactly match the codebase state and can be used by external integrators and SDK generators with confidence.

**Enforcement (architectural):**
- All Zod schemas in `firm-validators` satisfy compile-time check against the corresponding TS interface in `firm-types`.
- DB schemas in `firm-db-schema` are the single source of structural truth; migrations are generated, not hand-written. `firm-db-migrations.checkDrift()` runs in CI; any divergence fails the build.
- **Event Registry** in `firm-events` is the sole authority for every event type + version. `defineEvent()` is the only constructor. Handlers declare `acceptsVersions`.
- CI event inventory check: every emitted event version has at least one registered handler that accepts it.
- Cross-reference manifest maps schemas → validators → events (with versions) → table definitions. Any discrepancy fails the build.
- **Schema build pipeline (Gate 17):** `scripts/ci/schema-build.ts` produces `contracts/v1/openapi.json`, `contracts/v1/asyncapi.yaml`, and `contracts/v1/events.schema.json`. Committed artifacts must exactly match generated output; mismatch → build fails.

---

## §4 Cross-Cutting Enforcement Mechanisms

All rules are mechanically enforced on every code change. Human review is insufficient — CI is the enforcer.

---

### 4.1 Package-Boundary Enforcement

**Rule:** Packages may only import from the same or lower layer. Upward and circular imports are forbidden. Feature packages must not call `fetch()` directly. Only `firm-bus` event handlers may write to the CQRS read model.

**Enforcement:**
1. **ESLint `boundaries` plugin** — each package type (`primitives | config | core | security | observability | ui | features | workers | adapters`) declares allowed dependencies. `workers` is a named boundary type.
2. **ESLint `no-direct-fetch` rule** — flags any `fetch()` call in feature packages; all external communication must go through Layer 7 adapters.
3. **ESLint `no-direct-read-model-write` rule** — prevents direct DB writes to the CQRS read schema from any package except `firm-bus` event handlers.
4. **`dep-fence` script** — walks the full dependency graph; catches dynamic imports, re-exports, and layer violations that static analysis misses.
5. **`exports` field verification** — script ensures no import of unlisted internal paths succeeds.

**Violation:** Build fails. Correct the import or reassign the package to a different layer via ADR.

---

### 4.2 Interface Freezes

**Rule:** Before implementing an adapter, feature package, or worker, its TypeScript interfaces must be frozen. Breaking changes require a documented proposal and a new freeze tag.

**Enforcement:**
1. **Git tag** `iface-freeze/v1-*`. CI blocks modifications to frozen files without the `breaking-change` label and an architecture reviewer approval.
2. **TypeScript `satisfies` checks** — Zod schemas must satisfy the frozen interface.
3. **Adapter conformance** — `implements <Port>` on every adapter class; missing methods or wrong return types fail compilation.

**Violation:** Build fails. Breaking an interface requires unfreezing via formal proposal, review, and a new freeze tag.

---

### 4.3 Event Registry Enforcement

**Rule:** Every event type and version must be registered in the central `EventRegistry`. Handlers declare `acceptsVersions`. Emitting an unregistered event or an unsupported version is impossible.

**Enforcement:**
1. **`defineEvent()`** — the only event constructor. Requires mandatory `version`. Auto-registers in the `EventRegistry`.
2. **CI event inventory check** — scans all `emitEvent()` calls; cross-references the registry. Unregistered event → build fails.
3. **CI event versioning check** — every emitted version must have at least one handler whose `acceptsVersions` includes it.
4. **Outbox validation** — `emitEvent()` validates payload against the registered Zod schema for that version.

**Violation:** Build fails (unregistered or unhandled version). No path to production.

---

### 4.4 RLS Coverage Tests

**Rule:** Every tenant-scoped table must have RLS enabled, sibling isolation verified, and parent visibility verified.

**Enforcement:**
1. **Migration hook** — Drizzle `afterMigrate` auto-applies RLS policies (default + parent-agency) to all tables in `tenantScopedTables`.
2. **`firm-health` RLS probe** — readiness probe queries `pg_tables` for `rowsecurity=true`. Any missing table → `unhealthy`, deployment blocked.
3. **CI sibling isolation test** — create data as Sub-Account A, switch to Sub-Account B (same parent), attempt read → expect zero results. Required on every PR that touches a tenant-scoped table.
4. **CI parent visibility test** — create data as Sub-Account A, switch to parent agency admin → data visible. Verify parent cannot write (RLS read-only policy).

**Violation:** Migration fails if policies are missing. CI tests fail → build blocked. Health probe fails → deployment blocked.

---

### 4.5 Tag Governance

**Rule:** Every third-party script tag must be registered in the `TagRegistry` (`firm-security`). Unregistered scripts cannot render.

**Enforcement:**
1. **`TagRegistry`** — sole script source. ESLint rule (`no-inline-third-party-scripts`) flags manual `<script>` tags anywhere in the codebase.
2. **Consent category validation** — each tag declares required category (`analytics | marketing | functional`). Missing or invalid category → build fails.
3. **SRI hash required** — every tag entry must carry a valid `integrity` field. CI verifies; missing hash → build fails.

**Violation:** Build fails (unregistered, missing category, missing SRI). Runtime: tag is never injected into the page.

---

### 4.6 Feature Flag Expiration

**Rule:** Temporary feature flags must carry an expiration date. Expired flags break the build. Flags must handle Redis unavailability by returning `defaultValue`.

**Enforcement:**
1. **Flag definition** — mandatory `expiresAt` (UTC timestamp) on temporary flags. Permanent flags use the `never` marker.
2. **CI expiration check** — script compares each flag's `expiresAt` against the current date. Past expiration → build fails.
3. **Runtime defense** — expired flag evaluates as `false` + fires an alert. Redis unreachable → flag returns `defaultValue`, logged and alerted.

**Violation:** Build fails if any temporary flag is past expiration.

---

### 4.7 PII Redaction Verification

**Rule:** No PII (email address, phone number, SSN, IP address) ever appears in plaintext in logs, errors, or Sentry events.

**Enforcement:**
1. **Dual-level redaction (`firm-logger`)** — field-path stripping (e.g., `user.email`) AND regex pattern scanner. Both layers must pass.
2. **CI redaction test** — feeds a known PII-containing object through the logger; greps output for PII values. Any plaintext PII → build fails.
3. **Sentry PII filter** — identical redaction rules applied to Sentry events. CI validates Sentry filtering.

**Violation:** Build fails if any PII appears unredacted. Runtime defensive redaction provides a secondary safety net; the CI gate is primary.

---

### 4.8 CI Pipeline Specification

The pipeline runs on every PR and every merge to `main`. Any stage failure blocks the pipeline entirely.

| # | Stage | What it checks |
|---|-------|---------------|
| 1 | Supply-Chain Security | `npm audit` (block high/critical CVEs) + license scanner (reject GPL for SaaS) |
| 2 | Boundary Check | ESLint `boundaries` + `no-direct-fetch` + `no-direct-read-model-write` + `dep-fence` |
| 3 | Type Check | `tsgo --noEmit` (strict config) |
| 4 | Lint | ESLint: style, imports, branded-ID asserts, no `console.log` |
| 5 | Adapter Scaffolding Verification | Adapter directory structure matches generated template; stub + conformance test present |
| 6 | Unit & Integration Tests | Vitest, coverage ≥80% (line/function/branch/statement) |
| 7 | Event Registry Check | AST scan of `emitEvent()` calls against `EventRegistry` |
| 8 | Event Versioning Check | Every emitted version has at least one handler accepting it |
| 9 | Event Schema Validation | Payload satisfies registered Zod schema for that version |
| 10 | RLS Coverage Check | `firm-health` probe + sibling/parent isolation tests |
| 11 | RLS Sibling Test | Sub-Account A data invisible to Sub-Account B |
| 12 | RLS Parent Test | Agency admin sees sub-account data; cannot write |
| 13 | Adapter Interface Compliance | Port conformance tests pass for all adapters in PR |
| New1 | Quota Check Enforcement | Static analysis: `checkQuota()` present before every metered operation |
| 14 | PII Redaction Test | Log capture + grep for known PII patterns |
| 15 | Feature Flag Expiration | Scan all flag definitions for past-expiry `expiresAt` |
| 16 | Tag Registry Integrity | All third-party scripts registered, consented, SRI-hashed |
| 17 | Observability Instrumentation | AST check for `initializeObservability()` in every service entry point |
| 18 | Package `exports` Verification | No import of unlisted internal paths |
| 19 | AsyncAPI Generation | `generate-asyncapi.ts` maps all registered events to channels; fails on missing channel definition |
| 20 | Schema Build | `schema-build.ts` generates `contracts/v1/`; committed artifacts must match generated output |
| 21 | Build | `tsdown` via Turborepo (dual-pass: JS + type declarations) |

---

### 4.9 Pre-Merge Validation Gates

**Gate 1 — Test Coverage Minimum**
- Rule: All packages Layers 1–7 must maintain ≥80% coverage (lines, branches, functions, statements).
- Enforcement: Vitest `coverage.thresholds` per package. Waiver requires documented, time-bound architect approval.
- Violation: PR cannot merge.

**Gate 2 — Schema Freeze Check**
- Rule: After `iface-freeze/*` tag, frozen files cannot be modified without the `breaking-change` label and an architecture reviewer approval.
- Enforcement: CI detects freeze tag, enforces label requirement and extra reviewer via branch protection.
- Violation: PR cannot merge.

**Gate 3 — Database Migration Safety**
- Rule: Any PR adding or modifying a tenant-scoped table must include the RLS policy in the same migration file and a new isolation test.
- Enforcement: CI inspects migration for `CREATE TABLE` entries in `tenantScopedTables`; checks for `ENABLE ROW LEVEL SECURITY` and `CREATE POLICY`. Also checks for a corresponding isolation test in `firm-db-schema` test suite.
- Violation: PR cannot merge.

**Gate 4 — Adapter Scaffolding Gate**
- Rule: Any new adapter must be created via the adapter scaffolding generator. Stub and conformance test must be included in the same PR.
- Enforcement: CI verifies adapter directory structure matches the generated template. Manually authored adapters fail.
- Violation: PR cannot merge.

---

### 4.10 Post-Deployment Verification

**Gate 1 — Health Endpoint Probing**
- Load balancer queries `/health/readiness` after every deploy. Failure → no traffic routed, rollback triggered.
- Readiness probe includes `rlsHealthCheck()`, all critical dependency checks, and `observabilityHealthCheck()` (OTel span export verified).

**Gate 2 — Synthetic Smoke Tests**
- After health check passes, automated smoke tests run against the live deployment.
- `SyntheticCheckManager` in `firm-health/synthetic` defines checks: lead creation, notification dispatch, auth flow, consent gate, and observability export.
- Runner executes every 5 minutes. Alert on failure; probation-period rollback optional.

---

### 4.11 Adapter Scaffolding Enforcement

**Rule:** Every Layer 7 adapter must be produced by the canonical adapter scaffolding generator. Manually authored adapters are not accepted.

**Enforcement:**
1. **Generator CLI** — `pnpm turbo gen adapter` scaffolds `adapters-<category>-<provider>` with the uniform structure: `implements <Port>`, lazy client init, transform functions, error mapping, Prometheus metrics, `verifyWebhookSignature`, deduplication, and process steps.
2. **CI verification** — compares adapter directory structure against the generated template. Any deviation → build fails.
3. **Simultaneous output** — generator produces the adapter package, a stub, and a Port conformance test in the same run. A PR that contains only the adapter without both the stub and conformance test is rejected.

---

### 4.12 Quota Check Enforcement

**Rule:** Every metered operation in a feature package must call `firm-metering.checkQuota()` before executing the chargeable action.

**Enforcement:**
1. **Static analysis** — CI script scans feature package source for calls to known metered operations (`recordUsage`, AI SDK calls, email send, media upload) and verifies a preceding `checkQuota()` call exists in the same execution path.
2. **Runtime defense** — `recordUsage()` emits a `CRITICAL` warning if `checkQuota()` was not called within the same request context, enabling production detection of any circumvention.
3. **Test requirement** — tests for metered operations must verify that exceeding a quota is rejected with `QuotaExceeded` *before* the operation executes.

---

### 4.13 AsyncAPI Generation Enforcement

**Rule:** The complete event catalog must be externally verifiable. Every registered event type + version must appear as a channel in the machine-generated AsyncAPI 3.0 contract.

**Enforcement:**
1. `scripts/ci/generate-asyncapi.ts` reads the `EventRegistry`, maps each event type to a channel, and produces `contracts/v1/asyncapi.yaml`.
2. If any registered event lacks a corresponding channel definition → build fails.
3. The generated file is committed. Mismatch between committed and freshly-generated output → build fails, ensuring the contract is always current.

---

### 4.14 Schema Build Pipeline Enforcement

**Rule:** Versioned, distributable schema artifacts must be automatically generated from the single source of truth and committed. External integrators and SDK generators depend on them.

**Enforcement:**
1. `scripts/ci/schema-build.ts` produces:
   - `contracts/v1/openapi.json` (from tRPC/OpenAPI definitions in `firm-api-contracts`)
   - `contracts/v1/asyncapi.yaml` (from the AsyncAPI generation gate)
   - `contracts/v1/events.schema.json` (JSON Schema for all event payloads)
2. CI gate runs after all event checks. Fails if any artifact cannot be generated or if generated content does not match the committed file.
3. **Breaking contract changes** produce a new `contracts/v2/` directory. `contracts/v1/` is preserved for backward compatibility.

---

## §5 Data Flow Architecture

Canonical flows demonstrating layer dependencies and enforcement points.

---

### 5.1 Incoming HTTP Request (Create Lead)

```
Browser / Client
    │
    ▼
[Edge API Gateway]
    │── Rate limiting (named policies from firm-rate-limiter)
    │── DDoS protection, WAF, IP rules
    │── Forward X-Tenant-Id, X-Correlation-Id, traceparent
    ▼
[Next.js Edge / Middleware]
    │── firm-config-next: CSP nonce, HSTS, security headers
    │── firm-request-context: extract/create correlationId + traceId → AsyncLocalStorage
    ▼
[Security Middleware: firm-security]
    │── CSRF (session-bound, constant-time)
    │── Turnstile (if bot-protected endpoint)
    ▼
[Rate Limiting: firm-rate-limiter]
    │── Redis sliding window, named policy "api-general"
    │── Fail-open if Redis unreachable → logged + alerted
    ▼
[Authentication: firm-auth]
    │── authenticateRequest(): cookie → bearer → API key (priority order)
    │── Valid session → frozen SessionContext (userId, tenantId, permissions)
    │── Invalid → 401 / 403
    ▼
[Authorization: firm-auth / permissions]
    │── requirePermission("lead:create") checks RBAC matrix
    │── Denied → 403
    ▼
[Quota Check: firm-metering]
    │── checkQuota(tenantId, 'leads', 1)
    │── Exceeded → 429 QuotaExceeded
    ▼
[Feature Handler: firm-leads]
    │── Validate payload with firm-validators (leadSchemaV2)
    │── DB transaction via firm-db-client.withTenantContext()
    │── INSERT leads (tenant_id enforced by RLS)
    │── INSERT outbox_events ("lead.created", version: 2) — same transaction
    │── COMMIT
    │── recordUsage(tenantId, 'leads', 1) — post-operation
    ▼
[Observability: firm-observability]
    │── withTenantSpan("createLead"): tenantId, userId, correlationId auto-attached
    │── HTTP request metric incremented
    ▼
[Response: 201 Created]
    │── firm-logger structured JSON (PII redacted)
    │── traceparent in response headers
```

---

### 5.2 Authentication Flow (Detailed)

`authenticateRequest()` tries strategies in priority order, short-circuits on first success:

1. **Cookie present?** → `extractSessionFromCookie()` → `verifySession(token)` (Better Auth) → checks expiry, revocation, MFA state → returns frozen `SessionContext`.
2. **Bearer token?** (falls through if cookie fails) → same verification path.
3. **API key?** → `verifyApiKey(key, { ip, userAgent, endpoint })`:
   - Validate format (prefix `firm_`)
   - Hash key → query DB by `keyPrefix`
   - Constant-time HMAC compare against stored hash
   - Check: active, not expired, not rate-limited, IP in allowlist
   - Enforce sub-account scoping: API key only authorises access to the issuing tenant
   - Return permissions (no full session object)

**Key points:** Single unified entry point; constant-time at every step; sub-account scoping enforced at the API-key level; `SessionContext` deeply frozen after creation.

---

### 5.3 Event-Driven Outbox Flow

```
Business Operation (e.g., create lead)
    │
    ▼
Database Transaction
    │── INSERT / UPDATE business table (via firm-db-client)
    │── INSERT outbox_events (event_type, version, tenantId, payload) — same txn
    │── COMMIT
    ▼
Outbox Worker (firm-bus)
    │── Poll outbox_events WHERE status='pending' AND nextAttemptAt <= now()
    │── For each event:
    │     ├─ markEventAsProcessing()
    │     ├─ Look up handler in EventRegistry for (event_type, version)
    │     │    └─ Validate payload against Zod schema for that version
    │     ├─ Dispatch to handler
    │     ├─ Success → markEventAsCompleted()
    │     └─ Failure:
    │           ├─ Increment attempts, exponential backoff
    │           ├─ attempts < max → status='pending', scheduled retry
    │           └─ attempts ≥ max → dead-letter queue, alert
    ▼
Saga Orchestrator (multi-step workflows)
    │── Each step idempotent with a compensating action
    │── Saga state persisted in saga_instances table (firm-db-schema, Layer 2)
    │── Step failure → compensation steps executed in reverse order
```

**Note:** Saga state schema (`saga_instances`) is defined at Layer 2 in `firm-db-schema`, not implicitly inside the Layer 6 implementation — keeping the saga contract formally schema-governed.

---

### 5.4 Consent Resolution Flow (Server-Side)

Request arrives at Next.js page or API route:

1. **`firm-consent/server.ts`:**
   - Parse `Cookie` header → extract `firm_consent` cookie
   - `parseSignedCookie()` — constant-time HMAC signature verification
   - Validate `ConsentRecord` structure and expiration
   - Returns `ConsentRecord | null`

2. **GPC check:**
   - `isGpcEnabledFromHeaders()` → `applyGpcOverrides(choices)` forces `analytics=false, marketing=false`
   - `gpcApplied` flag embedded in the signed consent record (GDPR audit trail)
   - Banner cannot override GPC — it is a binding browser signal

3. **Page/API logic:**
   - `hasConsent('analytics')` → `false` → GA script not rendered
   - `hasConsent('marketing')` → `false` → Facebook Pixel omitted from HTML
   - `consentGate('functional', () => <ChatWidget />)` — conditional rendering

4. **Response:**
   - Per-request CSP nonce injected
   - Google Consent Mode v3 translation fires before any Google tags
   - No third-party script appears in HTML body unless consented
   - All consent state changes written to `firm-audit` (GDPR Art. 7(1))

---

### 5.5 Observability Context Propagation

```
Incoming Request
    │── W3C traceparent present? → extract traceId/spanId → set in firm-request-context
    │── Otherwise → generate new traceId/spanId
    ▼
Any code in the request flow:
    │── withTenantSpan("createLead", fn)
    │      └─ Auto-attaches: tenant.id, user.id, correlation.id as span attributes
    │── logger.info("Lead created", { leadId })
    │      └─ Reads tenantId/traceId from AsyncLocalStorage
    │── platformMetrics.httpRequestsTotal.add(1, { tenant_id: hashedTenantId })
    ▼
Outgoing call to external service (CRM adapter):
    │── injectTraceContext(headers) → adds traceparent to outbound HTTP request
    ▼
Outbox event persisted:
    │── Event metadata carries: traceId, correlationId, tenantId
    ▼
Background Worker (firm-bus / any worker in workers/):
    │── Extracts traceId + correlationId from event metadata or inbound headers
    │── Restores via setRequestContext() — worker spans are children of the original request span
    │── On external adapter calls: injectTraceContext() again
    ▼
Full distributed trace: Browser → API Gateway → Next.js → Outbox → Worker → Adapter → External API
```

**Key point:** Context survives every async boundary — HTTP, outbox, background workers. `withTenantSpan()` guarantees tenant context is never accidentally omitted from any span.

---

### 5.6 Database Tenant Scoping (Three-Tier Hierarchy)

```
Pre-condition: withTenantContext(tenantId, db, { isAgencyAdmin: false }) called by middleware
    │
    ▼
Inside withTenantContext():
    │── SET LOCAL app.current_tenant_id = '<tenantId>'
    │── if isAgencyAdmin: SET LOCAL app.current_agency_admin = 'true'
    ▼
Query: db.select().from(leads)
    │── PostgreSQL applies RLS policy:
    │       USING (
    │           tenant_id = current_setting('app.current_tenant_id')::uuid
    │           OR (
    │               current_setting('app.current_agency_admin', true) = 'true'
    │               AND tenant_id IN (
    │                   SELECT id FROM tenants
    │                   WHERE parent_tenant_id = current_setting('app.current_tenant_id')::uuid
    │               )
    │           )
    │       )
    │── Sub-account user: sees only rows with tenant_id = own sub-account ID
    │── Agency admin: sees rows from own agency + all child sub-accounts
    │── Sibling sub-accounts: completely invisible to each other
    ▼
Multi-step transaction:
    │── INSERT leads (tenant_id set by application before insert)
    │── INSERT outbox_events (tenant_id from context)
    │── Writes: still guarded at application level; agency-admin flag = read-only for RLS
    ▼
Cleanup: PgBouncer-safe RESET wrapper (firm-db-client)
    │── RESET app.current_tenant_id; RESET app.current_agency_admin
    │── Prevents SET LOCAL from leaking to the next request on connection-pool eviction
    │── (The highest-severity vulnerability in the platform security review; addressed here)
```

---

## §6 Design Principles & Shared Vocabulary

### 6.1 Glossary

- **API Gateway** — Edge component (Cloudflare / NGINX / Kong) applying rate limiting, WAF, and DDoS protection before traffic reaches the application. Named rate-limit policies mirrored from `firm-rate-limiter`.

- **Audit Trail** — Append-only, cryptographically chained record in `firm-audit`. Each record includes a hash of the prior record — tamper-detectable. Required for SOC 2 CC6.2.

- **Branded ID** — TypeScript string tagged with a unique symbol (`TenantId`, `AgencyId`, `SubAccountId`, `PlatformId`, `SessionId`, `UserId`). Compile-time incompatibility prevents ID mix-ups across the three-tier hierarchy. Runtime gatekeeper (`asTenantId(uuid)`) validates UUID format. Defined in `firm-primitives`. ESLint bans raw `as TenantId`.

- **C2PA Manifest** — Coalition for Content Provenance and Authenticity manifest. Required by EU AI Act Art. 50 (deadline Aug 2). Stores: content hash, generation timestamp, model identifier, prompt hash (not the full prompt), and an AI-training-data assertion. Stored in `ai_generation_log.c2pa_manifest`. Generated by `firm-security`, attached by `firm-ai-content`.

- **Chaos Engineering** — Controlled failure injection (Toxiproxy) to verify resilience guarantees. Scenarios: Redis down, outbox worker crash, PgBouncer eviction, adapter timeout. PgBouncer eviction scenario must pass before any EU client is onboarded.

- **`checkQuota`** — Primary API of `firm-metering`. `checkQuota(tenantId, dimension, amount)` performs pre-operation enforcement and rejects if quota exceeded. CI static analysis requires it before every metered operation.

- **Constant-Time Comparison** — Comparison taking equal time regardless of input differences, preventing timing attacks. Used for: HMAC, API keys, CSRF tokens, webhook signatures, consent cookies. Uses `crypto.timingSafeEqual`.

- **CQRS Read Model** — Separate denormalised schema (`firm-db-read`) for `firm-reporting`. Populated exclusively by `firm-bus` outbox event handlers. ESLint rule blocks direct writes from any other package.

- **Data Residency** — Infrastructure-enforced requirement that tenant data is stored only in the designated region (GDPR Art. 32). `infra/` is organised into regional subdirectories (`us-east-1/`, `eu-west-1/`). `firm-compliance` runs an application-level assertion verifying no cross-region writes occurred.

- **Design Token (DTCG)** — W3C Design Tokens Community Group JSON format. Single source of visual truth in `firm-tokens` → CSS custom properties + TypeScript constants. No hardcoded visual values in any component.

- **Digest Batching** — Grouping related notifications within a configurable time window into a single delivery. Prevents a bulk operation (e.g., importing 500 leads) from triggering 500 individual email/SMS alerts.

- **Dry-Run Mode** — Simulation without side effects. Used in `firm-provisioning` (validate before committing), `firm-rate-limiter` (record without blocking), and `firm-compliance` (validate erasure saga before execution).

- **Event Versioning** — Every event carries a mandatory `version` field. Handler declares `acceptsVersions`. CI ensures each emitted version has a handler. Breaking changes require a new version; old handlers continue receiving old versions.

- **Global Privacy Control (GPC)** — Browser signal `Sec-GPC: 1`. Platform treats as a binding directive: overrides the consent cookie, forces `analytics=false, marketing=false`. The consent banner cannot override GPC. The `gpcApplied` flag is embedded in the signed consent cookie.

- **Grace Period** — Brief continued-access window (3–7 days) after payment failure before hard subscription revocation. Managed by `firm-subscriptions`.

- **Human-Approval Gate** — Platform constraint (not a temporary flag) requiring explicit human review before certain content or actions proceed. Output produced as `pending_approval`. Only `approveContent()` guarded by `content:approve` RBAC permission sets `approved`. No `autoApprove` flag exists.

- **Idempotency Key** — Unique identifier enabling safe retry. Receiver stores key + first result; duplicate arrivals return stored result without repeating side effects. Used in: payments, email, webhooks, outbox events. Financial webhooks use PostgreSQL store; others use Redis.

- **Metering** — Recording resource consumption per tenant per billing period. `firm-metering` aggregates in Redis → periodic flush to DB. Used by quota enforcement (`firm-subscriptions`) and invoicing (`firm-billing`).

- **Nonce-Based CSP** — Unique cryptographic nonce per request injected into the CSP header and every `<script>` tag. Browser executes only scripts with a matching nonce. `unsafe-inline` and `unsafe-eval` are never permitted.

- **Outbox Pattern** — Event inserted into `outbox_events` within the same DB transaction as the data change. Worker reads and dispatches. Guarantees atomicity and at-least-once delivery. Saga state schema (`saga_instances`) is defined in `firm-db-schema` at Layer 2.

- **Port & Adapter (Hexagonal Architecture)** — Port = typed interface in `firm-ports` (canonical contract). Adapter = Layer 7 package implementing that interface for a specific provider. Feature packages depend only on the Port, never the adapter.

- **Result Type** — `Result<T, E>` = `Ok(value)` or `Err(error)`. Expected failures return `Err`; caller must handle. Unexpected failures throw exceptions. From `firm-utils`.

- **Row-Level Security (RLS)** — PostgreSQL feature auto-filtering rows by security policy. Platform uses it for tenant isolation and parent-child hierarchy enforcement. Applied at migration time, verified by health probes on every deployment.

- **Saga** — Long-running workflow with compensable steps. If a step fails, compensation steps run in reverse order. Executed by `firm-bus`; state persisted in `saga_instances` (defined in `firm-db-schema`).

- **SCIM** (System for Cross-domain Identity Management) — RFC 7643/7644 for automated enterprise user provisioning. Implemented via `adapters-scim-okta` and `adapters-scim-azure-ad`, orchestrated by `firm-auth`.

- **SLO** (Service Level Objective) — Specific measurable reliability target (e.g., API p95 latency < 500ms, outbox processing lag < 60s). Defined in `docs/slos/`. Each SLO has a corresponding Grafana alert and runbook in `docs/runbooks/`.

- **Sub-Account** — End-client of an agency in the three-tier hierarchy. Inherits branding/billing from its parent agency. Sibling sub-accounts are strictly isolated via `parent_tenant_id` and RLS.

- **Supply-Chain Integrity** — Automated checks: `npm audit` (block high/critical CVEs), license scanner (reject GPL for SaaS use), SRI hashes for all browser-injected scripts, `minimumReleaseAge=1440` (24-hour new-package block), `blockExoticSubdeps=true`.

- **TCF 2.2** — IAB Europe Transparency & Consent Framework v2.2. Required for EU programmatic advertising (DV360, Google Ads). Encoded by `firm-consent` as the `tcf_string` consent signal.

---

### 6.2 Recurring Architectural Patterns

**Result for Expected Failures**
- Problem: Functions fail predictably (validation, missing records). Returning `null` or throwing creates ambiguity for callers.
- Solution: Return `Result<T, E>`. TypeScript enforces handling of both branches.
- When: Any expected, documentable failure. Not for programmer errors or infrastructure failures.
- Example: Lead validation → `Result<Lead, ValidationError>`; handler maps to 201 or 400.

**Decorator for Auth**
- Problem: Direct coupling to Better Auth makes migration expensive.
- Solution: `firm-auth` wraps Better Auth and exposes platform-specific constructs (frozen `SessionContext`, RBAC, MFA, audit). Feature packages depend only on `firm-auth`.
- When: Any third-party service that may eventually be replaced.
- Example: Replacing Better Auth → only `firm-auth` changes. No feature package is touched.

**Event Registry as Single Source of Truth**
- Problem: Producers and consumers define events independently → drift → runtime mismatches.
- Solution: Central `EventRegistry`. `defineEvent()` registers; workers import the same definition. No raw event emission.
- When: Any event emitted by one package and consumed by another.
- Example: `firm-funnels` defines `funnel.step_completed`; `firm-reporting` imports the same definition to subscribe.

**Lazy Initialisation from Environment Variables**
- Problem: Hardcoding secrets is unsafe; loading at module import breaks tests and optional integrations.
- Solution: Client created on first call, reading from `firm-env` validated variables.
- When: Every Layer 7 adapter and optional Layer 6 service integration.
- Example: Stripe adapter creates its client only on the first `createCheckoutSession()` call.

**Webhook Verify-Then-Deduplicate-Then-Process**
- Problem: Inbound webhooks need signature verification, idempotency, then business logic. Wrong order creates vulnerabilities.
- Solution: Fixed three-step sequence (mandatory for every adapter webhook handler):
  1. **Verify** — HMAC signature of raw body (constant-time). Fail → 401.
  2. **Deduplicate** — check idempotency key (provider event ID). Already processed → 200, no action.
  3. **Process** — business logic, emit platform outbox event.
- Example: Stripe `checkout.session.completed` → verify signature → idempotency on `event.id` → update invoice → emit `invoice.paid`.

**Metering Pattern**
- Problem: Tracking resource usage for quotas and billing without adding latency to the hot path, while preventing operations from exceeding plan limits.
- Solution: `checkQuota()` called before any chargeable operation. Successful operations emit a meter event in the transactional outbox. Aggregation worker increments Redis counters; periodic flush to DB.
- Example: `firm-ai-content` calls `checkQuota(tenantId, 'ai_tokens', estimatedTokens)` → rejected if quota exceeded → on success, emits `ai.token.consumed` → `firm-metering` increments the monthly counter.

**Two-Phase GDPR Erasure**
- Problem: Immediate hard-delete risks irreversible mistakes; delay risks non-compliance with "without undue delay" (GDPR Art. 17).
- Solution:
  - Phase 1 (immediate): Anonymise all PII in DB (names, emails, phones, IPs) — satisfies prompt action obligation.
  - Phase 2 (after retention window, e.g. 30 days): Hard-delete all records.
- Example: `firm-compliance.eraseDataSubject(subjectId)` triggers saga: immediate anonymisation → export generation → retention clock → hard deletion → confirmation record.

**Human-Approval Gate**
- Problem: AI content, bulk emails, and ad campaigns must never publish without explicit human review.
- Solution: Output produced as `pending_approval`. The only path to `approved` is an explicit `approveContent()` call guarded by RBAC permission `content:approve` + audit log write. No `autoApprove` flag. No bypass.
- Example: `firm-ai-content` returns `{ status: 'pending_approval' }`. Reviewer calls `approveContent(contentId)` with the `content:approve` permission → audit record written → status set to `approved`. Only approved content is rendered or sent.

---

## §7 AI Agent Onboarding

### 7.1 Repository Overview (for AI context window)

Monorepo. Strict layers 0–7. Layer 0 = config + constraints (`firm-primitives`: branded IDs `TenantId`, `AgencyId`, `SubAccountId`, `PlatformId`, `SessionId`, `UserId`). Layer 1 = core utilities. Layer 2 = data + contracts (`firm-types`, `firm-db-schema`, `firm-db-client`, `firm-sdk`, `firm-ports`). Layer 3 = identity, security, consent (`firm-auth`, `firm-rate-limiter`, `firm-consent`, `firm-security`, `firm-policy`). Layer 4 = observability + health. Layer 5 = UI + theming + testing. Layer 6 = feature packages + workers (Tiers A–D; `firm-ai` infrastructure + `firm-ai-content` generation; `firm-sales-pipeline`). Layer 7 = adapters (105, sole external bridge).

Three-tier tenant hierarchy: Platform → Agency → Sub-Account. RLS enforces sibling isolation + parent visibility.

Critical directories: `packages/` (layer0–layer7), `apps/`, `workers/` (renamed from `services/`), `infra/` (regional subdirectories), `docs/adr/`, `docs/slos/`, `docs/runbooks/`, `docs/compliance/`, `e2e/`, `load-tests/`, `chaos/`, `contracts/v1/`, `tools/catalog/`.

---

### 7.2 When Asked to Build a New Package

1. **Identify layer** (§2). Confirm all dependencies are from the same or lower layers.
2. **Check `exports`** of dependencies — import only the public API.
3. **Define DB tables** in `firm-db-schema`. If tenant-scoped: include RLS policies (default + parent-agency) and isolation tests in the same PR.
4. **Register events** via `defineEvent()` in `firm-events` with mandatory `version`. Ensure handler `acceptsVersions` covers every emitted version.
5. **Use `firm-validators`** — Zod schemas derived from Drizzle tables via `drizzle-zod`; add only `.refine()` business rules. Schema must `satisfy` the corresponding `firm-types` interface.
6. **Use `Result<T, E>`** (`firm-utils`) for expected failures. Never throw for predictable errors.
7. **Use `firm-logger`** only. `console.log` is banned.
8. **Write tests** — ≥80% coverage (line/function/branch/statement).
9. **If Layer 7 adapter:** generate via `pnpm turbo gen adapter`. Hand-authored adapters fail CI. Must: `implements <Port>`, lazy-init from `firm-env`, transform functions, error mapping to `FirmError`, Prometheus metrics, webhook `verify → deduplicate → process`. Simultaneous stub + conformance test required.
10. **If generating content (AI, documents, emails):** enforce Human-Approval Gate. Output `pending_approval`. Only `approveContent()` with `content:approve` permission sets `approved`. C2PA manifest stored. No bypass.
11. **If metered operation:** call `firm-metering.checkQuota()` *before* the chargeable action. CI static analysis enforces this. Test must verify `QuotaExceeded` is returned before the operation executes.

---

### 7.3 When Asked to Fix a Bug

1. **Consult the Critique** — lists known bugs with file locations and required fixes (Phase 1 Fix Sequence, §3.2 of Critique).
2. **Examine test coverage** — add tests alongside the fix if coverage is missing.
3. **Verify no layer violations** — no new upward imports, no `fetch()` in feature packages, no direct write to read model.
4. **Run CI locally** — boundary check, type check, lint, tests — before committing.

---

### 7.4 Key Files

| File | Purpose |
|------|---------|
| `packages/layer0-config/firm-config-eslint/src/presets/boundaries.ts` | Layer boundary rules |
| `packages/layer0-config/firm-primitives/src/ids.ts` | Branded IDs + gatekeepers |
| `packages/layer2-data/firm-types/src/entities.ts` | Domain entity interfaces |
| `packages/layer2-data/firm-events/src/registry.ts` | Event Registry |
| `packages/layer2-data/firm-ports/src/index.ts` | All 22+ Port interfaces |
| `packages/layer3-security/firm-auth/src/session/types.ts` | SessionContext shape |
| `packages/layer3-security/firm-auth/src/permissions/matrix.ts` | RBAC matrix (three-tier) |
| `packages/layer3-security/firm-rate-limiter/src/policies.ts` | Named rate-limit policies |
| `packages/layer2-data/firm-db-schema/src/schemas/*.ts` | Drizzle table definitions |
| `packages/layer2-data/firm-db-client/src/client.ts` | Connection factories + RESET wrapper |
| `packages/layer2-data/firm-db-schema/src/rls-policies.ts` | RLS policy generators |
| `packages/layer1-core/firm-request-context/src/store.ts` | AsyncLocalStorage store |
| `packages/layer1-core/firm-logger/src/logger.ts` | Pino logger + redaction |
| `packages/layer2-data/firm-validators/src/common.ts` | Zod validation schemas |
| `packages/layer3-security/firm-security/src/tags/registry.ts` | Third-party tag registry |
| `packages/layer6-features/firm-flags/src/flags.ts` | Feature flag definitions |
| `packages/layer6-features/firm-audit/src/audit.ts` | Audit log writer |
| `packages/layer6-features/firm-metering/src/meter.ts` | `checkQuota` + `recordUsage` |
| `packages/layer7-adapters/REGISTRY.md` | Auto-generated adapter registry |
| `docs/adr/` | All architectural decision records |
| `docs/slos/` | Six SLO definitions |
| `docs/compliance/data-residency.md` | Data residency policy |
| `scripts/ci/dep-fence.ts` | Dependency boundary enforcement |
| `scripts/ci/event-version-check.ts` | Event versioning CI gate |
| `contracts/v1/` | Committed OpenAPI, AsyncAPI, JSON Schema artifacts |

---

### 7.5 Anti-Patterns to Avoid

- Importing from internal paths not listed in the `exports` field.
- Using `as TenantId` instead of the `asTenantId(uuid)` gatekeeper.
- Hardcoding rate-limit values — reference a named policy from `firm-rate-limiter`.
- Emitting an unregistered event version or one without a handler.
- Manually inserting `tenant_id` in SQL — use `withTenantContext()`.
- Calling `fetch()` or any third-party SDK directly from a feature package — use a Layer 7 adapter.
- Writing directly to the CQRS read model from a feature package — only `firm-bus` event handlers are permitted.
- Using `console.log` — use `firm-logger`.
- Adding a tenant-scoped table without RLS policies and isolation tests in the same PR.
- Processing a webhook before signature verification and idempotency check.
- Performing a metered operation without a preceding `checkQuota()` call.
- Hand-authoring an adapter — always use the scaffolding generator.
- Importing `@firm/tokens` at runtime — tokens are build-time only; use CSS custom properties.
- Setting AI-generated content to `approved` without an explicit human-review gate.
- Modifying `infra/` unless the task explicitly requires it.
- Using a temporary feature flag without an `expiresAt` date.
- Using `as TenantId` anywhere in the codebase (lint error) — only gatekeepers allowed.

*End of Document.*