# Marketing Agency Platform
## Current State Assessment & Phased Implementation Roadmap

**Document purpose:** This is the living snapshot of the platform's implementation state. It records package health, known defects, required build sequences, and the phased roadmap. It changes as work progresses.

**Companion document:** For immutable architectural rules, layer definitions, enforcement mechanisms, and data flow patterns, see the **Architecture Constitution & Enforcement Manual** (Blueprint). For resolved decisions, critical security findings, and the ADR backlog, see the **Critique**.

**Legend:** 🔴 Critical / blocks progress · 🟠 High / needed this phase · 🟡 Medium / needed next phase · ✅ Clean · ⚠️ Defects present · ❌ Not built

---

## §A Package Health Inventory

Current state of every package across all eight layers. Definitions, interfaces, and rules for each package are in Blueprint §2. This section records only status, known defects, and required actions.

---

### A.0 Layer 0 — Build & Constraint (13 packages)

All Layer 0 packages are **configuration-only** with no runtime code (except `firm-primitives` gatekeepers). No bugs have been found. All 13 are considered clean.

| Package | Status | Notes |
|---------|--------|-------|
| `firm-primitives` | ✅ | Branded IDs + gatekeepers; domain IDs excluded (live in `firm-types`) |
| `firm-config-eslint` | ✅ | `boundaries` plugin, `no-direct-fetch`, `no-direct-read-model-write`, `workers` boundary type present |
| `firm-config-typescript` | ✅ | Strict, composite, declaration maps enabled |
| `firm-config-prettier` | ✅ | Frozen |
| `firm-config-next` | ✅ | Next.js 15; `serverExternalPackages: ['pino','drizzle-orm','postgres']` confirmed |
| `firm-config-tailwind` | ✅ | |
| `firm-config-vitest` | ✅ | Coverage threshold ≥80% configured |
| `firm-config-playwright` | ✅ | |
| `firm-config-commitlint` | ✅ | |
| `firm-config-docker` | ✅ | Multi-stage; non-root UID ≥10000; `tini`; `HEALTHCHECK` |
| `firm-config-storybook` | ✅ | |
| `firm-config-security-headers` | ✅ | CSP/HSTS/Permissions-Policy factory; defaults confirmed |
| `firm-tokens` | ✅ | W3C DTCG; `no-runtime-tokens-import` ESLint rule present |

---

### A.1 Layer 1 — Core Utilities & Environment (12 target packages)

Six packages exist; six are missing. All six existing packages have defects. The missing packages are prerequisites for Layer 2 schema work and must be built in Phase 0.

| Package | Status | Severity | Required Actions |
|---------|--------|----------|-----------------|
| `firm-request-context` | ⚠️ defects | 🔴 | Remove `[key: string]: any` (module augmentation); add `withRequestContext()` for job handlers; add `extendContext(additions)`; write full test suite (nested async, concurrent, `Promise.all`, `setImmediate`, job handler wrapper) |
| `firm-logger` | ⚠️ splitbrain bug | 🔴 | Delete internal `ContextManager.currentContext`; read exclusively from `getUnifiedContext()`; add `logger.child(bindings)`; configurable sampling (guaranteed error/warn); `createTestLogger()`; auto `pino-pretty` in dev |
| `firm-utils` | ⚠️ 3 missing, 1 bug | 🟠 | Fix `hashIp` salt (throw if <16 chars); add `retry<T>` (full-jitter, `isRetryable` hook, `onRetry`); `sleep(ms)`; `paginate(cursor, limit, direction)`; named sub-exports (`@firm/utils/result`, `/retry`, `/pagination`) |
| `firm-crypto` | ⚠️ 3 missing, 1 redundancy | 🟠 | Remove `generateUUID` (use `firm-id`); add `generateSecureToken(bytes)`; `encryptField/decryptField` (AES-256-GCM, `keyId`); `deriveKey(password, salt, iterations?)` |
| `firm-errors` | ⚠️ 2 missing | 🟠 | Add `isRetryable(error): boolean`; `toTRPCError(error)`; `toHTTPResponse(error, status?)`; `FirmError.withContext(additions)` |
| `firm-env` | ✅ minor gaps | 🟡 | Add secret format validation (`.url()`, `.min(32)`, DB URL validator); typed `environment` export; `getSecret(key)` lazy accessor |
| `firm-date` | ❌ missing | 🔴 | `toISOStringUTC`, `parseISO`, `addDuration`, `isWithinWindow`, `formatRelative`, `startOfPeriod`, `isExpired`. **Must exist before any L2 schema or `firm-bus`.** |
| `firm-id` | ❌ missing | 🔴 | `generateId()` UUID v7; `generateShortId()`; `generateApiKeyToken()`; `isValidId()`; `toSlug()`; `isValidSlug()`. **Must exist before any table is created.** |
| `firm-sanitize` | ❌ missing | 🔴 | `sanitizeHtml(html, policy)` (named policies: `strict`, `rich-text`, `email`, `cms`); `stripHtml`; `sanitizeUrl`; `sanitizeFilename`; `escapeHtml`. **Phase 0, before forms/CMS.** |
| `firm-invariant` | ❌ missing | 🟠 | `invariant`; `assertNonNull<T>`; `assertNever`; `assertValidated<T>(schema, value)` |
| `firm-circuit-breaker` | ❌ missing | 🟡 | CLOSED/OPEN/HALF-OPEN state machine; `failureThreshold`, `recoveryTimeout`, `successThreshold`; `onStateChange` metrics callback; `getState()`. **Phase 2, before any L7 adapter is built.** |
| `firm-codec` | ❌ missing | 🟡 | `toBase64Url/fromBase64Url`; `toHex/fromHex`; `encodeQueryString/decodeQueryString`; `serializeJSON/deserializeJSON<T>`; `toCSV(rows)`. **Phase 2.** |

**Cross-cutting note:** `firm-request-context` and `firm-logger` share the same root cause — two independent context stores diverging under concurrency. Both must be fixed in the same sprint: one store (`firm-request-context`'s `AsyncLocalStorage`), all readers delegate via `getUnifiedContext()`.

---

### A.2 Layer 2 — Data & Contracts (16 target packages)

Eight packages exist (or are partially built); eight are missing. The `firm-db` monolith must be split before any Layer 6 package is built.

| # | Package | Status | Severity | Required Actions |
|---|---------|--------|----------|-----------------|
| 1 | `firm-types` | ⚠️ structurally flawed | 🔴 | Extract `firm-primitives` (Layer 0); add all domain branded IDs (`LeadId`, `CampaignId`, `BookingId`, `InvoiceId`, `ProjectId`, `ContactId`, `DealId`, `FormId`, `PageId`, `ContentId`, `DocumentId`); extract Port interfaces to `firm-ports`; write ADR-003 (shared kernel boundary) |
| 2 | `firm-validators` | ⚠️ broken + misaligned | 🔴 | Fix 4 bugs (missing imports, v1↔v2 migration non-existent fields, reverse migration broken, no compilation safeguard); implement drizzle-zod bridge (Drizzle table = single structural truth; `firm-validators` adds only `.refine()` business rules); add schema factories (`createPaginationSchema`, `createTenantScopedSchema`, `createVersionedSchema`, `createIdempotencySchema`, `createWebhookPayloadSchema`, `createAuditableSchema`); add `satisfies` CI conformance gate |
| 3 | `firm-api-contracts` | ✅ scope too wide | 🟠 | Extract event contracts to `firm-events`; add tRPC sub-routers per domain from day one; ADR evaluating oRPC |
| 4 | `firm-db-schema` | ❌ not yet split | 🔴 | Split from `firm-db`; Drizzle table definitions; RLS policy generators (default + parent-agency); migration source of truth; `drizzle-zod` bridge (`createInsertSchema`, `createSelectSchema`); zero runtime connection deps |
| 5 | `firm-db-client` | ❌ not yet split | 🔴 | Split from `firm-db`; connection factories (`serverless`, `pooled`, `direct`); PgBouncer-safe RESET wrapper (Fix 8 — highest-severity security fix); `withTenantContext`; `withTransaction`; `writeToOutbox`; `paginateCursor`; `softDelete`; `batchQuery`; `withOptimisticLock`; fix `table: any` → `PgTable` |
| 6 | `firm-db-read` | ❌ pending ADR | 🔴 | ADR-003 decides location. Default: separate `firm-db-read` package. Denormalised read schema; separate connection pool; ESLint `no-direct-read-model-write` |
| 7 | `firm-cache` | ⚠️ 4 gaps | 🟠 | Fix TTL Zod validation at `set()` (Fix 1); add `lock(key, fn, ttl)` distributed lock (Redlock multi-node, SETNX+TTL single-node); Prometheus `firm.cache.hit/miss` counters; `scope: 'local'\|'global'` on `invalidate()` |
| 8 | `firm-sdk` | ❌ not built | 🟠 | Generated from tRPC; `FirmClient.withTenant(tenantId)` mandatory entry; `@firm/sdk/node` + `@firm/sdk/browser` sub-exports; `verifyWebhookSignature`; `X-RateLimit-Remaining` parsing |
| 9 | `firm-events` | ❌ missing | 🔴 | `defineEvent(name, version, payloadSchema)`; `deprecateEvent` (CI sunset gate); `EventRegistry`; `createEventHandler`; `CloudEventsEnvelope<T>`; `createWebhookPayloadSchema`; `generateAsyncApiDocument` → AsyncAPI 3.0. **Prerequisite for `firm-bus`.** |
| 10 | `firm-idempotency` | ❌ missing | 🔴 | `createIdempotencyStore(redis)`; `withIdempotency(key, fn, options)`; `IdempotencyKey` branded type; `generateIdempotencyKey`; `parseIdempotencyHeader`; TTL default 24h; conflict detection |
| 11 | `firm-query` | ❌ missing | 🔴 | `createTenantQuery(db, tenantId)`; `withSoftDeleteFilter`; `paginateCursor<T>`; `withAuditFields`; `batchQuery<T>`; `withOptimisticLock`. **Prerequisite for all L6 packages.** |
| 12 | `firm-pagination` | ❌ missing | 🟠 | `PaginatedResponse<T>`; `encodeCursor/decodeCursor`; `createPageSchema<T>`; `DEFAULT_PAGE_SIZE=25`; `MAX_PAGE_SIZE=100`; `OffsetPage` |
| 13 | `firm-ports` | ❌ missing | 🟠 | 22+ typed Port interfaces extracted from `firm-types`; `createPortMock<T extends Port>()`; `@since` JSDoc versioning. **Prerequisite for all L7 adapters.** |
| 14 | `firm-db-migrations` | ❌ missing | 🟠 | `runMigrations`; `checkDrift()` CI gate; `generateMigration`; `rollback` (non-prod); `getTenantMigrationState`; `recordTenantMigration`; CLI: `db:migrate`, `db:check-drift`, `db:generate` |
| 15 | `firm-schema-registry` | ❌ missing | 🟡 | Version registry; `validateSchemaCompatibility`; `generateContractArtifacts` → `contracts/v1/`; CI breaking-change gate; consumer tracking |
| 16 | `firm-db-seed` | ❌ missing | 🟡 | `seedPlatform`, `seedAgency`, `seedSubAccount`, `seedLeads`, `seedCampaigns`, `clearTenant`; deterministic (fixed seed); respects RLS via `withTenantContext` |

**drizzle-zod bridge** is not a new package — it is a mandatory cross-cutting action in Phase 1: `firm-db-schema` exports `createInsertSchema(table)` and `createSelectSchema(table)`; `firm-validators` imports these and adds only `.refine()` business rules. A field added to a Drizzle table automatically propagates to Zod — eliminating the drift that caused the four documented `firm-validators` bugs.

---

### A.3 Layer 3 — Identity, Security & Consent (5 target packages)

| Package | Status | Severity | Required Actions |
|---------|--------|----------|-----------------|
| `firm-security` | ⚠️ broken, scope too wide | 🔴 | Fix `CacheClient` import (Fix 2a); extract rate limiter (Fix 2b); integrate `firm-consent` state into `buildCsp(nonce, tenantId, consentedTags)`; add `validateOutboundUrl(url, options)` (SSRF: enforce `https://`, block RFC 1918, loopback, 169.254.x.x); add `generateSriHash(scriptContent)`; define C2PA write path interface with `firm-ai-content` (before Aug 2 deadline) |
| `firm-rate-limiter` | ❌ not yet extracted | 🔴 | Extract from `firm-security` (Fix 2b); Redis sliding window + token bucket; named policy registry; `responseMode: 'hard'\|'graduated'` (warn 80%, throttle 90%, block 100%); `setEmergencyOverride(policyName, limits, ttl)`; `scope: 'local'\|'global'`; `registerAdaptivePolicy(name, triggerFn)`; fail-open on Redis unreachable; dry-run mode |
| `firm-auth` | ⚠️ 6 structural gaps | 🟠 | Fix Fix 3 (remove `startImpersonationLegacy`; tighten `session.role` string → `Role`); add `context?` param to `requirePermission` (ABAC extension path); reserve `credentialId`/`credentialType` in session schema; define `refreshSession`/`revokeSession`/`RevocationStore`; expand `createApiKey()` with `scope`, `expiresAt`, `ipAllowlist`, `rateLimit`; add SCIM orchestration hooks (`onUserProvisioned`, `onUserDeprovisioned`, `onGroupUpdated`); add `createDelegatedSession(userId, agentId, scope, ttl)` |
| `firm-consent` | ⚠️ 4 compliance gaps | 🔴 | **Jun 15 (33 days):** Google Consent Mode v3 `ad_storage` gate + CI Gate 14; **Jul 14 (62 days):** add `shouldTrackEmail(userId, tenantId, jurisdiction): boolean` (CNIL pixel suppression); connect consent state changes to `firm-audit` (GDPR Art. 7(1)); DSR workflow delegated to `firm-compliance` |
| `firm-policy` | ❌ missing | 🟠 | `PolicyRule`; `evaluate(request): PolicyDecision`; `createRbacMatrix`; `createAbacPolicy`; `PermissionGuard`; decision caching TTL 30–60s; deny → auto `firm-audit` write |

---

### A.4 Layer 4 — Observability & Health (3 target packages)

| Package | Status | Severity | Required Actions |
|---------|--------|----------|-----------------|
| `firm-observability` | ⚠️ 1 gap | 🟠 | Add `observabilityHealthCheck()` (OTel init + span export verified) for readiness probe (Fix 7); confirm dual-level PII redaction (field-path + regex) wired; confirm `withTenantSpan()` auto-attaches `tenantId`, `userId`, `correlationId` |
| `firm-health` | ⚠️ 1 gap | 🟠 | Add `observabilityHealthCheck()` to readiness probe (Fix 7); add IoC `registerHealthCheck(name, fn, { critical })`; add `isShuttingDown()` export; add `@firm/health/shutdown` with `registerShutdownHandler(fn, priority)`; escalating alert strategy for synthetic checks |
| `firm-resilience` | ❌ retired | — | **Resolved:** circuit-breaker logic lives in `firm-circuit-breaker` at Layer 1. Bulkhead + timeout patterns are implemented as named policies within `firm-circuit-breaker`. No separate Layer 4 package. |

**Note on `firm-telemetry-client`:** RUM browser/Node bundling conflict requires an ADR before apps are built. Provisional: RUM stays as `@firm/observability/rum` sub-export with `react-server` condition guard. Re-evaluate at Phase 5.

---

### A.5 Layer 5 — UI, Theming & Testing (4 existing + 5 missing packages)

#### Existing Packages

| Package | Status | Severity | Required Actions |
|---------|--------|----------|-----------------|
| `firm-tokens` | ⚠️ 3 gaps | 🟠 | Adopt W3C DTCG stable spec (Oct 2025) for multi-brand output: `tokens/base.json` + `semantic.json` + `brands/<slug>.json` → Style Dictionary generates one CSS file per brand; enforce `no-runtime-tokens-import` ESLint rule before any component is built |
| `firm-ui` | ❌ not built | 🔴 | Declare RSC boundary in `exports` (`react-server` condition); CI gate: no `useState/useEffect/useContext/event-handlers` in server exports; resolve icon bundle isolation ADR (`firm-icons` or `@firm/ui/icons`); `@firm/ui/dataviz` separate chunk (`sideEffects:false`, own peer deps); WCAG 2.2 AA: `toBeAccessible()` Vitest assertion + `@storybook/addon-a11y` on every component; Chromatic visual regression in CI via `firm-config-storybook` |
| `firm-theme-provider` | ❌ not built | 🟠 | Server component calls `firm-tenant-config.resolve(tenantId)`; `buildThemeVars(theme)` pure server utility; `<ThemeProvider vars={cssVars} />` as `'use client'`; dark mode per-tenant (`localStorage` key `darkMode_${tenantId}`, system-pref fallback); `validateThemeContrast(theme)` checks WCAG 2.2 AA before `firm-tenant-config` persists |
| `firm-testing` | ⚠️ 5 gaps | 🟠 | Add `createVitestProject(options)` for composite build path resolution (Vitest 3.2+); default `pool: 'forks'` for packages with singleton state; `createServerComponentHarness()`; fixture factories (`createLeadFactory`, `createCampaignFactory`, `createTenantFactory`, `createUserFixture`, `createSessionFixture`); `expectNoA11yViolations(container)` axe-core matcher |

#### Missing Packages

| Package | Priority | Phase | Purpose |
|---------|----------|-------|---------|
| `firm-hooks` | 🔴 | Phase 5 | Shared React hooks: context (`useTenantTheme`, `useRequestId`), UI (`useDebounce`, `useMediaQuery`, `useOutsideClick`, `useIntersectionObserver`, `usePrevious`, `useLocalStorage`, `useReducedMotion`), forms (`useFormField`, `useFieldArray`, `useFormSubmitState`), async (`useAsyncState`, `useOptimisticUpdate`, `useEventSource`). Never imports from Layer 6. |
| `firm-email-templates` | 🔴 | Phase 5 | React Email templates: transactional, billing, notifications, agency reporting. All accept `TenantBranding` prop. White-label ready. `firm-template-engine` injects branding at send time. |
| `firm-icons` | 🟠 | Phase 5 | Pending icon ADR. Either dedicated package or `@firm/ui/icons` sub-export. `sideEffects: false`. |
| `firm-storybook-utils` | 🟡 | Phase 5 | Shared Storybook decorators, mock providers (`TenantThemeDecorator`, `SessionDecorator`, `ConsentDecorator`), argTypes factories. |
| `firm-kpi` | 🟡 | Phase 6 | KPI definitions and calculations for dashboards. Formerly misnamed `firm-telemetry`. Provides typed KPI schemas, calculation functions, and threshold definitions consumed by `firm-reporting`. |

---

### A.6 Layer 6 — Feature Packages & Workers (38 target packages)

No Layer 6 package may be built until all Phase 0 and Phase 1 prerequisites are complete (see §D). Status below reflects the current state.

#### Tier A — Core Infrastructure (14 packages)

| Package | Status | Phase | Notes |
|---------|--------|-------|-------|
| `firm-bus` | ❌ not built | Phase 3 | Blocked by ADR-001 (`firm-bus` execution model). Interface abstracted regardless of outcome. |
| `firm-flags` | ❌ not built | Phase 3 | `expiresAt` mandatory on temporary flags; CI expiration gate |
| `firm-metering` | ⚠️ post-op only | 🔴 Phase 1 | Fix 10: add `checkQuota(tenantId, dimension, amount)`; CI static-analysis gate (Gate New1); quota warning at 80% |
| `firm-audit` | ❌ not built | Phase 3 | SQL hash chain; `writeAuditRecord`; `verifyAuditChain`; `exportAuditLog`; `createAuditMiddleware()`; `expungeRecord` (GDPR); race protection via `firm-cache` distributed lock |
| `firm-tenant-config` | ❌ not built | Phase 3 | cache→DB→migration→Zod; `tenant-config.updated` event; merge-with-defaults; 5-version rollback |
| `firm-template-engine` | ❌ not built | Phase 3 | Liquid (email/SMS); Handlebars (PDF, ADR pending); version history; locale vars; preview |
| `firm-notifications` | ❌ not built | Phase 4 | Multi-channel; digest batching; per-channel retry policies; unread count |
| `firm-webhooks` | ❌ not built | Phase 4 | HMAC signing; retries; delivery logs |
| `firm-sse` | ❌ not built | Phase 4 | Server-Sent Events; real-time dashboards and portals |
| `firm-media` | ❌ not built | Phase 4 | Multi-provider; image/video processing; metadata stripping; CDN; `checkQuota()` enforced |
| `firm-search` | ❌ not built | Phase 4 | Tenant isolation model requires ADR before build (external index partitions vs. PostgreSQL RLS) |
| `firm-i18n` | ❌ not built | Phase 4 | Translation keys; ICU MessageFormat; RTL; locale-aware formatting |
| `firm-ai` | ❌ not built | Phase 4 | AI infrastructure only: provider routing, token counting, cost metering, model selection. Blocked by ADR-004 (`firm-ai` split). |
| `firm-worker-runtime` | ❌ not built | Phase 3 | `createWorker(options)` factory; graceful `SIGTERM` drain; K8s readiness/liveness HTTP server; worker-level metrics; uncaught exception handling; startup dependency checks (DB, Redis ready) |

#### Tier B — Operations (8 packages)

| Package | Status | Phase | Notes |
|---------|--------|-------|-------|
| `firm-provisioning` | ❌ not built | Phase 4 | Inherit-and-detach model; idempotent sagas; dry-run mode; GDPR erasure |
| `firm-compliance` | ❌ not built | Phase 4 | Right-to-erasure sagas (anonymise → export → retain → hard delete); Art. 30 reports; data residency assertion |
| `firm-projects` | ❌ not built | Phase 5 | `ProjectTemplate` aggregate; `createProjectFromTemplate()`; task dependency tracking |
| `firm-sales-pipeline` | ❌ not built | Phase 5 | Deal pipeline; `lead.scored` event contract required first (emitted by `firm-ai`, consumed here); formerly `firm-pipeline` |
| `firm-documents` | ❌ not built | Phase 5 | PDF generation; e-signature; multi-signatory; DOCX/HTML merge fields; event contracts with `firm-sales-pipeline` and `firm-billing` must be defined first |
| `firm-appointments` | ❌ not built | Phase 5 | Round-robin assignment; collective booking; group appointments; no-show policies |
| `firm-workflow` | ❌ not built | Phase 5 | **Blocked by ADR-007** (condition model, state machine, trigger types, compensation model all undefined). Do not begin implementation before ADR is merged. |
| `firm-integrations` | ❌ not built | Phase 5 | Unified OAuth health dashboard; proactive token refresh → `getValidToken(providerId, tenantId)` for adapter injection |

#### Tier C — Revenue (3 packages)

| Package | Status | Phase | Notes |
|---------|--------|-------|-------|
| `firm-subscriptions` | ❌ not built | Phase 5 | `computeUsageCharge(tenantId, billingPeriod)` reads `firm-metering`, applies plan pricing, returns typed line items for `firm-billing` |
| `firm-payments` | ❌ not built | Phase 5 | Stripe/Paddle/PayPal/Square; split payments; two-tier idempotency (financial webhooks → PostgreSQL; others → Redis) |
| `firm-billing` | ❌ not built | Phase 5 | Invoicing; revenue recognition; dunning; `SplitRule` aggregate (platform % + agency %) for white-label reseller revenue share |

#### Tier D — Client-Facing & Marketing (12 packages)

| Package | Status | Phase | Notes |
|---------|--------|-------|-------|
| `firm-portal` | ❌ not built | Phase 6 | White-label; per-sub-account module config; portal activity audit |
| `firm-inbox` | ❌ not built | Phase 6 | Unified conversations; assignment; SLA tracking; all inbound channels converge here |
| `firm-reporting` | ❌ not built | Phase 6 | CQRS read model; pre-computed metrics; branded PDF/email reports; anomaly detection; `firm-kpi` integration |
| `firm-cms` | ❌ not built | Phase 6 | Headless; content staging; multilingual locale fallback |
| `firm-forms` | ❌ not built | Phase 6 | Conditional logic; multi-step; partial save/resume; field-level abandonment analytics; CRM field-mapping validation at publish time |
| `firm-landing-pages` | ❌ not built | Phase 6 | Block-based; A/B testing; Core Web Vitals per variant; pixels fire only after consent granted |
| `firm-funnels` | ❌ not built | Phase 6 | Multi-step behaviour-driven marketing automation; funnel analytics; strictly separate bounded context from `firm-workflow` |
| `firm-social` | ❌ not built | Phase 6 | Outbound scheduling only; inbound DMs → `firm-inbox` via `social.dm.received` event |
| `firm-seo` | ❌ not built | Phase 6 | Keyword tracking; backlink monitoring; technical audits; structured data; SERP feature detection |
| `firm-reputation` | ❌ not built | Phase 6 | Review monitoring; AI-suggested replies; mandatory human-approval gate; no auto-publishing |
| `firm-ads` | ❌ not built | Phase 6 | Ad performance aggregation; budget alerts; UTM management; ad fatigue detection |
| `firm-ai-content` | ❌ not built | 🔴 Phase 4 | AI content + image generation; always `pending_approval`; C2PA manifest (Aug 2 deadline); NY Synthetic Performer labels (Jun 9 deadline); blocked by ADR-004 |

---

### A.7 Layer 7 — Adapters (105 target packages)

**Current state:** 0 of 105 built. Adapter scaffolding generator exists. No hand-authored adapters are permitted.

**Auto-generated registry:** `packages/layer7-adapters/REGISTRY.md` — regenerated on every adapter creation.

**Build prerequisite:** `firm-ports` (L2) must be complete and interface-frozen before any adapter is scaffolded.

**Priority queue** — first 20 adapters to build, in order:

| Priority | Adapter | Unblocks |
|----------|---------|----------|
| 1 | `adapters-storage-local` | Local media development (Fix 9 — production blocker for `firm-media` in dev) |
| 2 | `adapters-storage-s3` | `firm-media` production |
| 3 | `adapters-storage-r2` | `firm-media` production (Cloudflare) |
| 4 | `adapters-email-resend` | `firm-notifications`, welcome emails, magic links |
| 5 | `adapters-email-sendgrid` | `firm-notifications` fallback |
| 6 | `adapters-payments-stripe` | `firm-payments`, `firm-billing`, `firm-subscriptions` |
| 7 | `adapters-ai-openai` | `firm-ai`, `firm-ai-content` |
| 8 | `adapters-ai-anthropic` | `firm-ai` fallback |
| 9 | `adapters-sms-twilio` | `firm-notifications` SMS channel |
| 10 | `adapters-crm-hubspot` | `firm-sales-pipeline`, CRM sync worker |
| 11 | `adapters-crm-gohighlevel` | Primary CRM target for agency vertical |
| 12 | `adapters-analytics-ga4` | `firm-reporting`, consent gate integration |
| 13 | `adapters-analytics-posthog` | Internal product analytics |
| 14 | `adapters-scim-okta` | `firm-auth` enterprise provisioning |
| 15 | `adapters-scim-azure-ad` | `firm-auth` enterprise provisioning |
| 16 | `adapters-pdf-puppeteer` | `firm-documents`, `firm-billing` (invoices) |
| 17 | `adapters-social-meta` | `firm-social`, `firm-ads` |
| 18 | `adapters-ads-google` | `firm-ads` |
| 19 | `adapters-reviews-google-business` | `firm-reputation` |
| 20 | `adapters-calendar-google` | `firm-appointments` |

Remaining 85 adapters are built in Phases 6–7, ordered by feature package dependencies.

---

## §B Phase 1 Fix Sequence

The authoritative 11-fix sequence is defined in **Critique §3.2**. It must be executed in exact order — each fix's "Unblocks" column is a hard dependency, not a suggestion. The table below is reproduced for self-contained reference, with three cross-cutting actions appended that are not package-level fixes but must complete within Phase 1.

### B.1 Authoritative Fix Sequence (from Critique §3.2)

| # | Fix | Package | Severity | Unblocks |
|---|-----|---------|----------|----------|
| 0 | Add comprehensive tests + fix design flaw (remove `[key: string]: any`; module augmentation; add `withRequestContext()`; `extendContext()`) | `firm-request-context` | 🔴 | Everything above L1 |
| 1 | `TenantCache.set()` reject non-numeric TTL | `firm-cache` | 🔴 | Fix 2 |
| 2a | Rate limiter: fix `CacheClient` import | `firm-security` | 🔴 | Fix 3 |
| 2b | Extract rate limiter into `firm-rate-limiter` | new: `firm-rate-limiter` | 🔴 | Clean L3 boundaries |
| 3 | Remove `startImpersonationLegacy`; tighten `session.role` `string` → `Role` | `firm-auth` | 🟠 | — |
| 4 | Campaign missing imports; lead v1↔v2 migration non-existent fields; reverse migration broken | `firm-validators` | 🔴 | All feature packages |
| 5 | Move `import { or }` to top; replace `table: any` with `PgTable` | `firm-db` | 🟡 | Type safety |
| 6 | Remove `ContextManager.currentContext` (splitbrain) — read only from `getUnifiedContext()` | `firm-logger` | 🔴 | Trace/tenant correlation |
| 7 | Add `observabilityHealthCheck()` to readiness probe (OTel init + span export) | `firm-health` | 🟠 | Production readiness |
| 8 | Add PgBouncer RESET wrapper | `firm-db-client` (post-split) | 🔴 | Tenant isolation |
| 9 | Create `adapters-storage-local` | new: adapter package | 🔴 | All local media development |
| 10 | Add `checkQuota()` + CI static-analysis enforcement gate | `firm-metering` | 🔴 | Usage control guarantee |

### B.2 Cross-Cutting Phase 1 Actions

These are not package-level bug fixes but must complete within Phase 1. They are preconditions for any Phase 2 work.

| # | Action | Scope | Why Phase 1 |
|---|--------|-------|-------------|
| X1 | **drizzle-zod bridge** — `firm-db-schema` exports `createInsertSchema(table)` and `createSelectSchema(table)`; `firm-validators` imports these and adds only `.refine()` business rules | `firm-db-schema`, `firm-validators` | Eliminates the dual source of truth that caused all four `firm-validators` bugs; every L6 package depends on correct validation |
| X2 | **`dep-fence` script** — walk full dependency graph; catch dynamic imports, re-exports, layer violations that ESLint's static `boundaries` analysis misses | `scripts/ci/dep-fence.ts` | Must be active before any new package is added; retroactive enforcement is exponentially harder |
| X3 | **`exports` field audit** — ensure every existing package's `exports` field lists only its true public API; add a CI script that fails on any import of an unlisted internal path | All L0–L4 packages | Required before any L5/L6 package imports from them; prevents accidental coupling to internals |

---

## §C Compliance Deadline Calendar

Reproduced from **Critique §3.3** for self-contained reference. All four deadlines are active and in force. None are optional.

| Deadline | Days Remaining | Obligation | Packages | Done Definition |
|----------|---------------|------------|----------|----------------|
| **Jun 9, 2026** | ~27 days | NY Synthetic Performer Act — AI-generated performer labels | `firm-ai-content`, `firm-consent` | Disclosure label stored in `ai_generation_log`; rendered non-removable in all client-facing surfaces |
| **Jun 15, 2026** | ~33 days | Google Consent Mode v3 | `firm-consent`, all `apps/clients/*` | `ad_storage` gates Google Ads; CI Gate 14 verifies; GCM v3 translation layer active |
| **Jul 14, 2026** | ~62 days | CNIL — email tracking pixel consent | `firm-consent`, `firm-notifications` | Pixel suppressed for EU users until explicit opt-in; `shouldTrackEmail(userId, tenantId, jurisdiction)` implemented |
| **Aug 2, 2026** | ~81 days | EU AI Act Art. 50 — C2PA manifests | `firm-security`, `firm-ai`, `firm-ai-content` | C2PA manifest generated and stored in `ai_generation_log.c2pa_manifest` for every AI-generated asset |

**Risk note:** Jun 9 and Jun 15 both fall within Phase 1. `firm-ai-content` and `firm-consent` must be prioritised above non-compliance work in Phase 1 even though full L6 construction is Phase 3+. The specific compliance outputs (disclosure label storage schema, GCM v3 translation layer) can be delivered as minimal targeted implementations within `firm-ai-content` and `firm-consent` ahead of the full Tier D build.

---

## §D Phased Implementation Roadmap

### Overview

| Phase | Name | Primary Output | Hard Prerequisites |
|-------|------|---------------|-------------------|
| **0** | L1 Foundations | All 6 missing L1 packages built | Nothing — start here |
| **1** | Critical Fixes + L2/L3 Surgery | All 11 fixes complete; L2 split; L3 extracted; drizzle-zod bridge; compliance minimums | Phase 0 complete |
| **2** | L2 Missing Packages + L4 + L5 Gaps | `firm-events`, `firm-idempotency`, `firm-query`, `firm-pagination`, `firm-ports`, `firm-db-migrations`; L4 additions; `firm-testing` gaps | Phase 1 complete; ADR-003 resolved |
| **3** | L6 Tier A — Core Infrastructure | `firm-bus`, `firm-audit`, `firm-tenant-config`, `firm-template-engine`, `firm-worker-runtime`, `firm-flags`, first 4 workers | Phase 2 complete; ADR-001 resolved |
| **4** | L6 Tier A — Delivery + AI + First Adapters | `firm-notifications`, `firm-webhooks`, `firm-sse`, `firm-media`, `firm-ai`, `firm-ai-content`; priority adapters 1–11 | Phase 3 complete; ADR-004 resolved |
| **5** | L6 Tier B + C — Operations + Revenue | `firm-provisioning`, `firm-compliance`, `firm-projects`, `firm-appointments`, `firm-sales-pipeline`, `firm-documents`, `firm-subscriptions`, `firm-payments`, `firm-billing`, `firm-integrations` | Phase 4 complete; ADR-007 resolved |
| **6** | L6 Tier D + L5 UI | All 12 Tier D packages; `firm-ui`, `firm-theme-provider`, `firm-hooks`, `firm-email-templates`; priority adapters 12–20 | Phase 5 complete |
| **7** | L7 Adapters — Full Rollout | Remaining 85 adapters; `firm-schema-registry`, `firm-db-seed` | Phase 6 complete; `firm-ports` frozen |
| **8** | Apps + E2E | All 22 (or grouped) platform apps; E2E suite; load tests; chaos tests | Phase 7 complete; app grouping ADR resolved |

---

### Phase 0 — L1 Foundations

**Goal:** Build the six missing Layer 1 packages. These are pure utilities with no upstream dependencies — they can be built in parallel. Nothing above Layer 1 is stable until they exist.

**Why a named phase:** `firm-id` affects every primary key type (UUID v7 decision is irreversible once tables exist). `firm-date` affects every timestamp serialisation and outbox retry schedule. `firm-sanitize` is a Phase 1 security necessity — user-authored HTML in emails, CMS, and templates is an active XSS attack surface. These three in particular cannot be retrofitted safely.

**Packages to build:**

| Package | Parallel Group | Blocking? |
|---------|---------------|-----------|
| `firm-id` | A | 🔴 Blocks all L2 schemas |
| `firm-date` | A | 🔴 Blocks `firm-bus`, all timestamp-bearing schemas |
| `firm-sanitize` | A | 🔴 Blocks forms, CMS, template engine, inbox |
| `firm-invariant` | B (after `firm-errors`) | 🟠 Needed by L2+ packages |
| `firm-circuit-breaker` | C (Phase 2 entry) | 🟡 Needed before any L7 adapter |
| `firm-codec` | C (Phase 2 entry) | 🟡 Needed by SDK, reporting exports |

> **Note:** `firm-circuit-breaker` and `firm-codec` are listed as Phase 0 targets but may begin in parallel with Phase 1 as capacity allows. They are not blockers for Phase 1 fixes.

**Enhancements to existing L1 packages (parallel with new builds):**

- `firm-utils`: add `retry<T>`, `sleep`, `paginate`; fix `hashIp` salt
- `firm-errors`: add `isRetryable`, `toTRPCError`, `toHTTPResponse`, `withContext`
- `firm-crypto`: remove `generateUUID`; add `generateSecureToken`, `encryptField/decryptField`, `deriveKey`
- `firm-env`: add secret format validation; typed `environment`; `getSecret` lazy accessor

**Go/No-Go for Phase 1:** All of `firm-id`, `firm-date`, `firm-sanitize`, and `firm-invariant` are built, tested (≥80% coverage), and merged. `firm-utils.retry<T>` is complete. `firm-errors.isRetryable` is complete.

---

### Phase 1 — Critical Fixes + L2/L3 Surgery

**Goal:** Execute all 11 fixes from §B.1 in exact order. Split `firm-db`. Extract `firm-rate-limiter`. Implement the drizzle-zod bridge. Deliver compliance minimums for Jun 9 and Jun 15 deadlines. Run cross-cutting actions X1–X3.

**Execution order:**

**Sprint 1A — Infrastructure spine (Fix 0, 1, 6 in parallel after Fix 0 unblocks)**
1. Fix 0: `firm-request-context` — tests + design flaw. This is the single highest-risk item; nothing above L1 is trustworthy until the splitbrain is eliminated.
2. Fix 6: `firm-logger` — remove `ContextManager.currentContext`. Must follow Fix 0 (reads from `getUnifiedContext()`). Can be done same day.
3. Fix 1: `firm-cache` TTL validation. Small, isolated.

**Sprint 1B — Security layer (Fix 2a, 2b, 3)**
4. Fix 2a: `firm-security` `CacheClient` import.
5. Fix 2b: Extract `firm-rate-limiter`. Add graduated response mode, emergency override, `scope` API, adaptive threshold hook.
6. Fix 3: `firm-auth` — remove `startImpersonationLegacy`; tighten `session.role`.

**Sprint 1C — Data layer (Fix 4, 5, 8 + drizzle-zod + db split)**
7. Fix 4: `firm-validators` — 4 documented bugs.
8. Fix 5: `firm-db` — type safety fixes (pre-split cleanup).
9. Split `firm-db` → `firm-db-schema` + `firm-db-client` + `firm-db-read` (pending ADR-003 for read model home).
10. Fix 8: PgBouncer RESET wrapper in `firm-db-client`.
11. Action X1: Implement drizzle-zod bridge.

**Sprint 1D — Observability + metering + adapter (Fix 7, 9, 10)**
12. Fix 7: `firm-health` + `firm-observability` — `observabilityHealthCheck()`.
13. Fix 9: Scaffold `adapters-storage-local` via generator.
14. Fix 10: `firm-metering` — add `checkQuota()`; add CI Gate New1 (static-analysis enforcement).

**Sprint 1E — CI hardening + compliance minimums (X2, X3 + compliance)**
15. Action X2: `dep-fence` script — activate in CI.
16. Action X3: `exports` field audit — all L0–L4 packages.
17. **Jun 9 compliance (27 days):** `firm-ai-content` schema stub — add `ai_generation_log` table with `disclosure_label` and `c2pa_manifest` columns to `firm-db-schema`. Disclosure label storage wired; rendered non-removable in any surface that shows AI content. This is a targeted minimum — full `firm-ai-content` build is Phase 4.
18. **Jun 15 compliance (33 days):** `firm-consent` — Google Consent Mode v3 `ad_storage` gate; CI Gate 14 added; GCM v3 translation layer active.

**Go/No-Go for Phase 2:** All 11 fixes merged and CI green. `firm-db` split complete with PgBouncer RESET wrapper. `firm-rate-limiter` extracted. drizzle-zod bridge active. `dep-fence` and `exports` audit passing. Jun 9 disclosure label wired. Jun 15 GCM v3 gate active.

---

### Phase 2 — L2 Missing Packages + L4 + L5 Gaps

**Goal:** Build all remaining Layer 2 missing packages, completing the data + contracts layer. Close L4 gaps. Begin L5. Resolve ADR-003 before this phase starts.

**Build sequence (L2 — order matters due to dependencies):**

| Step | Package | Depends On |
|------|---------|-----------|
| 1 | `firm-events` | `firm-api-contracts` (extract from), `firm-id`, `firm-date` |
| 2 | `firm-pagination` | `firm-primitives`, Zod |
| 3 | `firm-idempotency` | `firm-cache`, `firm-id`, `firm-errors` |
| 4 | `firm-db-migrations` | `firm-db-schema` (post-split) |
| 5 | `firm-query` | `firm-db-client`, `firm-pagination`, `firm-id` |
| 6 | `firm-ports` | `firm-types` (post-surgery) |
| 7 | `firm-sdk` | `firm-api-contracts`, `firm-events`, `firm-id` |
| 8 | `firm-schema-registry` | `firm-events`, `firm-api-contracts` |
| 9 | `firm-db-seed` | `firm-db-client`, `firm-db-schema`, `firm-testing` |

**L2 surgery (parallel with new builds):**
- `firm-types`: extract `firm-primitives` (done in Phase 1 if not yet); add all domain branded IDs; begin Port interface extraction (completes as `firm-ports` builds)
- `firm-api-contracts`: tRPC sub-routers per domain; oRPC ADR evaluation

**L4 additions (parallel with L2):**

| Package | Action |
|---------|--------|
| `firm-health` | `registerHealthCheck` IoC; `isShuttingDown()`; `@firm/health/shutdown` with `registerShutdownHandler`; escalating alert strategy for synthetic checks |
| `firm-observability` | Confirm ESM loader hook entry point (`@firm/observability/instrumentation`); RUM sub-export provisional (`@firm/observability/rum`) pending telemetry ADR |

**L5 gaps (parallel with L2, but after L4 stabilises):**
- `firm-tokens`: multi-brand DTCG output; `no-runtime-tokens-import` ESLint rule enforced
- `firm-testing`: `createVitestProject`; `pool: 'forks'` default; `createServerComponentHarness`; fixture factories; `expectNoA11yViolations`

**Jul 14 compliance (within Phase 2 window):** `firm-consent` — add `shouldTrackEmail(userId, tenantId, jurisdiction): boolean`; wire EU pixel suppression; connect consent state changes to `firm-audit` write path.

**Go/No-Go for Phase 3:** All L2 missing packages built and tested. `firm-events` EventRegistry operational. `firm-query` and `firm-pagination` complete. `firm-ports` interface-frozen (git tag `iface-freeze/v1-ports`). `firm-db-migrations` `checkDrift()` gate active in CI. ADR-001 (`firm-bus` execution model) resolved.

---

### Phase 3 — L6 Tier A: Core Infrastructure

**Goal:** Build the core infrastructure packages and workers that every feature package depends on. Nothing in Tier B–D can proceed until this phase is complete.

**Hard prerequisites:** ADR-001 resolved (`firm-bus` execution model). ADR-003 resolved (read model home). `firm-ports` frozen.

**Build sequence:**

| Step | Package | Key Constraints |
|------|---------|----------------|
| 1 | `firm-worker-runtime` | `createWorker(options)`; graceful `SIGTERM` drain; K8s probes; worker metrics; startup dependency checks. **Built first** — all workers depend on it. |
| 2 | `firm-audit` | SQL hash chain; `writeAuditRecord`; `verifyAuditChain`; `exportAuditLog`; `createAuditMiddleware()`; `expungeRecord`. Depends on `firm-db-client`, `firm-cache` distributed lock. |
| 3 | `firm-tenant-config` | cache→DB→migration→Zod; `tenant-config.updated` event (requires `firm-events`); merge-with-defaults; 5-version rollback. |
| 4 | `firm-bus` | Event bus + outbox reader; retries; dead-letter; cron; sagas. Depends on `firm-events`, `firm-idempotency`, `firm-worker-runtime`. Interface is ADR-outcome-agnostic. |
| 5 | `firm-flags` | Boolean, rollout, segments, plan-gated. `expiresAt` mandatory (CI expiration gate active). Redis unreachable → `defaultValue`. |
| 6 | `firm-template-engine` | Liquid (email/SMS); Handlebars (PDF, ADR pending); version history; locale vars; preview. Depends on `firm-sanitize`, `firm-i18n` stub. |
| 7 | `firm-metering` | (already partially exists from Fix 10) — complete full `recordUsage()` aggregation pipeline; Redis counters; periodic DB flush. |

**Workers to scaffold (using `firm-worker-runtime`):**

| Worker | Depends On |
|--------|-----------|
| `worker-outbox-processor` | `firm-bus` |
| `worker-tenant-provisioning` | `firm-bus`, `firm-tenant-config` |
| `worker-data-retention` | `firm-bus`, `firm-compliance` stub |
| `worker-billing-events` | `firm-bus`, `firm-metering` |

**Aug 2 compliance (within Phase 3 window):** `firm-security` C2PA manifest generation interface defined and wired to `firm-ai-content` schema stub (from Phase 1). `firm-ai-content` write path to `ai_generation_log.c2pa_manifest` confirmed complete. Chaos + integration test for manifest coverage SLO (100%) activated.

**Go/No-Go for Phase 4:** `firm-bus` operational (outbox worker running, events dispatching). `firm-audit` chain verified in CI integration test. `firm-tenant-config` resolves and caches correctly. `firm-worker-runtime` used by all four initial workers. ADR-004 (`firm-ai` split) resolved.

---

### Phase 4 — L6 Tier A: Delivery + AI + Priority Adapters

**Goal:** Complete Tier A with delivery channels, AI infrastructure, and the first 11 adapters. Platform becomes capable of sending emails, processing payments, and generating AI content.

**Hard prerequisites:** ADR-004 resolved (`firm-ai` split). `firm-ports` frozen. Phase 3 Go/No-Go passed.

**Build sequence:**

| Step | Package / Adapter | Key Constraints |
|------|------------------|----------------|
| 1 | `firm-ai` | Infrastructure only: provider routing, token counting, cost metering, model selection. No generation logic. Depends on `firm-metering.checkQuota()`. |
| 2 | `adapters-ai-openai` | First AI adapter. Scaffolded via generator. `implements AITextPort`. |
| 3 | `adapters-ai-anthropic` | Fallback AI adapter. |
| 4 | `firm-ai-content` | Generation + compliance: always `pending_approval`; `approveContent()` guard; C2PA manifest generation (complete Aug 2 requirement); NY disclosure label (complete Jun 9 requirement). Depends on `firm-ai`, `firm-audit`. |
| 5 | `adapters-storage-s3` | `firm-media` unblocked after this. |
| 6 | `adapters-storage-r2` | Cloudflare R2 production storage. |
| 7 | `firm-media` | Multi-provider; image/video processing; metadata stripping; `checkQuota()` enforced. Depends on storage adapters. |
| 8 | `firm-notifications` | Email, SMS, push, in-app. Digest batching. Per-channel retry policies. Depends on `firm-template-engine`, `firm-bus`. |
| 9 | `adapters-email-resend` | Primary email adapter. |
| 10 | `adapters-email-sendgrid` | Fallback email adapter. |
| 11 | `adapters-sms-twilio` | SMS channel for `firm-notifications`. |
| 12 | `firm-webhooks` | HMAC signing; retries; delivery logs. Depends on `firm-bus`, `firm-idempotency`. |
| 13 | `firm-sse` | Server-Sent Events. Depends on `firm-request-context`, `firm-auth`. |
| 14 | `adapters-payments-stripe` | `firm-payments` unblocked. Financial webhook idempotency → PostgreSQL store. |
| 15 | `adapters-crm-hubspot` | `firm-sales-pipeline` integration unblocked. |
| 16 | `adapters-crm-gohighlevel` | Primary agency CRM. |
| 17 | `firm-search` | Tenant isolation model confirmed by ADR before build. |
| 18 | `firm-i18n` | ICU MessageFormat; locale-aware formatting; RTL support. |

**Workers to add:**

| Worker | Depends On |
|--------|-----------|
| `worker-email-delivery` | `firm-notifications`, `adapters-email-*` |
| `worker-sms-delivery` | `firm-notifications`, `adapters-sms-twilio` |
| `worker-ai-generation` | `firm-ai-content`, `firm-bus` |
| `worker-campaigns` | `firm-bus`, `firm-notifications` |

**Go/No-Go for Phase 5:** `firm-notifications` sending email and SMS end-to-end. `firm-media` storing and retrieving files. `firm-ai-content` generating content with C2PA manifests and NY disclosure labels. `firm-payments` processing Stripe webhooks with idempotency. All four delivery workers healthy. ADR-007 (`firm-workflow` condition model) resolved.

---

### Phase 5 — L6 Tier B + C: Operations + Revenue

**Goal:** Build all operations and revenue packages. Platform becomes capable of managing tenants, processing billing, running projects, and booking appointments.

**Hard prerequisites:** ADR-007 resolved (`firm-workflow`). Phase 4 Go/No-Go passed.

**Build sequence:**

| Step | Package | Key Constraints |
|------|---------|----------------|
| 1 | `firm-provisioning` | Inherit-and-detach model; idempotent sagas; dry-run. Depends on `firm-bus`, `firm-audit`, `firm-tenant-config`. |
| 2 | `firm-compliance` | Right-to-erasure sagas; Art. 30 reports; data residency assertion. Depends on `firm-provisioning`, `firm-audit`. |
| 3 | `firm-subscriptions` | `computeUsageCharge()`; plan lifecycle; reads `firm-metering`. |
| 4 | `firm-payments` | Stripe/Paddle/PayPal/Square; split payments; two-tier idempotency. |
| 5 | `firm-billing` | Invoicing; revenue recognition; dunning; `SplitRule` aggregate. Depends on `firm-payments`, `firm-subscriptions`. |
| 6 | `firm-integrations` | Unified OAuth health dashboard; proactive token refresh; `getValidToken(providerId, tenantId)`. |
| 7 | `firm-appointments` | Round-robin; collective booking; group appointments. |
| 8 | `firm-projects` | `ProjectTemplate` aggregate; task dependency tracking. |
| 9 | `firm-documents` | PDF generation; e-signature; merge fields. Event contracts with `firm-sales-pipeline` and `firm-billing` defined first. |
| 10 | `firm-sales-pipeline` | Deal pipeline; `lead.scored` event contract published to `firm-events` first. |
| 11 | `firm-workflow` | ADR-007 drives implementation. Do not begin without merged ADR. |

**Adapters to add in Phase 5:**

| Adapter | Unblocks |
|---------|----------|
| `adapters-payments-paddle` | `firm-billing` multi-provider |
| `adapters-accounting-quickbooks` | `firm-billing` accounting sync |
| `adapters-accounting-xero` | `firm-billing` accounting sync |
| `adapters-pdf-puppeteer` | `firm-documents` |
| `adapters-calendar-google` | `firm-appointments` |
| `adapters-calendar-outlook` | `firm-appointments` |
| `adapters-scim-okta` | `firm-auth` enterprise provisioning |
| `adapters-scim-azure-ad` | `firm-auth` enterprise provisioning |
| `adapters-project-clickup` | `firm-projects` |
| `adapters-project-asana` | `firm-projects` |

**Workers to add:**

| Worker | Depends On |
|--------|-----------|
| `worker-crm-sync` | `firm-sales-pipeline`, `adapters-crm-*` |
| `worker-reports` | `firm-reporting` stub, `firm-bus` |

**Go/No-Go for Phase 6:** `firm-provisioning` creating and destroying tenants end-to-end with saga compensation verified. `firm-billing` invoicing and dunning operational. `firm-compliance` erasure saga tested with PII anonymisation confirmed. All Tier C packages tested with ≥80% coverage. App grouping ADR resolved.

---

### Phase 6 — L6 Tier D + L5 UI

**Goal:** Build all 12 Tier D packages. Build the full UI layer. Platform is complete for internal use.

**Hard prerequisites:** App grouping ADR resolved. Phase 5 Go/No-Go passed. `firm-testing` gaps closed (Phase 2). `firm-tokens` multi-brand output confirmed.

**L5 builds (front-loaded — must complete before any app is scaffolded):**

| Step | Package | Key Constraints |
|------|---------|----------------|
| 1 | `firm-ui` | RSC boundary declared; WCAG 2.2 AA gate active; Chromatic in CI; Storybook stories for all components before merge |
| 2 | `firm-theme-provider` | `buildThemeVars`; `<ThemeProvider />`; dark mode; `validateThemeContrast` |
| 3 | `firm-hooks` | Never imports from L6; `useTenantTheme` reads theme-provider context only |
| 4 | `firm-email-templates` | All templates accept `TenantBranding` prop; `firm-template-engine` injects at send time |
| 5 | `firm-icons` | Icon ADR resolved; `sideEffects: false` |

**Tier D builds:**

| Step | Package | Key Constraints |
|------|---------|----------------|
| 1 | `firm-reporting` | CQRS read model; `firm-kpi` integration; no direct write-model queries |
| 2 | `firm-portal` | Per-sub-account module config; portal activity audit |
| 3 | `firm-inbox` | All inbound channels converge; `social.dm.received` consumer |
| 4 | `firm-cms` | `firm-sanitize` enforced on all content; multilingual locale fallback |
| 5 | `firm-forms` | CRM field-mapping validation at publish time; `firm-sanitize` enforced |
| 6 | `firm-landing-pages` | Consent gate before any pixel fires; A/B testing via `firm-flags` |
| 7 | `firm-funnels` | Bounded context strictly separate from `firm-workflow`; enforced by event contracts |
| 8 | `firm-social` | Outbound only; inbound DMs → `firm-inbox` via `social.dm.received` |
| 9 | `firm-seo` | Keyword tracking; structured data management |
| 10 | `firm-reputation` | Human-approval gate on all AI-suggested replies; no auto-publish path |
| 11 | `firm-ads` | UTM management; ad fatigue detection; budget alerts |
| 12 | `firm-ai-content` | (Full build — compliance minimums delivered in Phases 1–4) |

**Remaining priority adapters (12–20) built during this phase:**

`adapters-analytics-ga4`, `adapters-analytics-posthog`, `adapters-social-meta`, `adapters-ads-google`, `adapters-reviews-google-business`, `adapters-seo-semrush`, `adapters-seo-google-search-console`, `adapters-email-validation-zerobounce`

**Workers to add:**

| Worker | Depends On |
|--------|-----------|
| `worker-reputation` | `firm-reputation`, `adapters-reviews-*` |
| `worker-analytics-rollup` | `firm-reporting`, `firm-bus` |
| `worker-social-scheduler` | `firm-social`, `adapters-social-*` |

**Go/No-Go for Phase 7:** All 12 Tier D packages tested ≥80% coverage. All L5 packages complete with Storybook stories and WCAG 2.2 AA CI gates passing. `firm-reporting` CQRS read model operational (events flowing from outbox → read model). `firm-kpi` definitions active.

---

### Phase 7 — L7 Adapters: Full Rollout

**Goal:** Build remaining 85 adapters. Complete `firm-schema-registry` and `firm-db-seed`. Platform is externally complete.

**Hard prerequisites:** `firm-ports` frozen. Phase 6 Go/No-Go passed. All 22 Port interfaces confirmed stable.

**Build rules:**
- All adapters produced via scaffolding generator. No exceptions.
- Each adapter must: `implements <Port>`, lazy-init from `firm-env`, transform functions, error → `FirmError` mapping, Prometheus metrics, `verifyWebhookSignature`, `firm-circuit-breaker` wrapping, constructor-injected `getValidToken`.
- Stub + conformance test produced simultaneously with adapter.
- `REGISTRY.md` regenerated on every adapter merge.

**Batch order:**

| Batch | Categories | Count |
|-------|-----------|-------|
| 7A | Email (remaining), SMS (remaining), CRM (remaining) | ~12 |
| 7B | Analytics (remaining), Observability tags, Experimentation | ~7 |
| 7C | Video, Video conferencing, Chat | ~10 |
| 7D | Accounting (remaining), Payments (remaining), Tax calculation | ~8 |
| 7E | Proposals, Project management (remaining), Design | ~9 |
| 7F | Booking systems (remaining), Calendar (remaining) | ~5 |
| 7G | Telephony, Voice AI, Voicemail drop, Speech-to-text | ~13 |
| 7H | Messaging/WhatsApp, Push notifications, Translation | ~9 |
| 7I | iPaaS, E-commerce, Team communication, Data enrichment | ~13 |
| 7J | Map listings, Email validation (remaining), Local storage | ~7 |
| TBD | Fraud detection, Identity verification, AI video, TTS, Link shortener | TBD |

**Also in Phase 7:**
- `firm-schema-registry`: breaking-change detection gate; consumer tracking; `generateContractArtifacts` producing committed `contracts/v1/` artifacts
- `firm-db-seed`: deterministic three-tier hierarchy seed data; `clearTenant` teardown; required for Phase 8 integration scenarios

**Go/No-Go for Phase 8:** 105/105 adapters built, stubbed, and conformance-tested. `REGISTRY.md` current. `contracts/v1/` artifacts committed and CI-verified. `firm-db-seed` seeding all three tiers deterministically.

---

### Phase 8 — Apps + E2E + Load + Chaos

**Goal:** Scaffold and build all platform applications. Run full E2E, load, and chaos test suites. Platform is production-ready.

**Hard prerequisites:** App grouping ADR resolved. Phase 7 Go/No-Go passed.

**App scaffolding:**

Based on app grouping ADR outcome (default: 3–5 hybrid apps):

| Hybrid App (default grouping) | Contains |
|-------------------------------|---------|
| `platform-marketing` | landing-pages, funnels, forms, social, ads, seo, reputation, cms |
| `platform-operations` | crm, projects, documents, appointments, proposals, inbox, portal |
| `platform-revenue` | billing, invoicing, subscriptions, payments |
| `platform-analytics` | reporting, analytics |
| `platform-admin` | admin, storybook |

> If ADR resolves to 22 separate apps or single unified app, scaffolding follows that outcome exactly.

**E2E suite (Playwright):**
- Auth flow (login, MFA, session expiry, API key)
- Tenant isolation (cross-tenant access attempt → 403)
- Lead creation → outbox → email delivery end-to-end
- Consent gate (GPC → no marketing scripts in HTML)
- AI content → approval gate → publish
- Billing → payment → invoice generated
- GDPR erasure → PII anonymised → hard delete after retention

**Load tests (k6 — `load-tests/`):**
- Tenant isolation under concurrent requests (50 tenants, 100 req/s each)
- Outbox throughput (target: 10,000 events/min end-to-end latency <60s)
- Rate limiting accuracy (sliding window, token bucket refill under burst)
- Lead creation burst (10,000 leads/min, zero duplicates, zero lost events)

**Chaos tests (Toxiproxy — `chaos/`):**
- Redis failure → rate limiter fails open; cache degrades gracefully
- Outbox worker crash + recovery → zero event loss confirmed
- PgBouncer eviction → tenant isolation holds; RESET wrapper confirmed working. **Must pass before any EU client is onboarded.**
- Adapter timeout + retry exhaustion → dead-letter queue routing confirmed

**Runbooks required** (each chaos scenario requires its runbook in `docs/runbooks/` before the test is executed):
- `connection-pooler-rls.md`
- `outbox-worker-recovery.md`
- `redis-failure-degraded-mode.md`
- `adapter-timeout-dlq.md`

**Production readiness checklist (all must be true before first client onboarded):**

- [ ] All six SLOs defined in `docs/slos/` with Grafana alerts and runbooks
- [ ] PgBouncer eviction chaos test passed and reviewed
- [ ] `SECURITY.md` reviewed by `@firm/security`
- [ ] GDPR erasure saga tested end-to-end in staging
- [ ] All four compliance deadlines confirmed closed (Jun 9, Jun 15, Jul 14, Aug 2)
- [ ] `sbom/` CycloneDX SBOMs generated in CI and archived
- [ ] `contracts/v1/` artifacts committed and verified
- [ ] All workers: graceful shutdown tested under load
- [ ] Readiness probe passes on clean deploy with no manual intervention
- [ ] Synthetic smoke tests passing for ≥24 hours in staging


**Runtime guarantees (provided by `firm-worker-runtime`):**
- Graceful `SIGTERM` drain — in-flight jobs complete before shutdown; new jobs rejected
- K8s readiness (`/health/readiness`) and liveness (`/health/liveness`) HTTP endpoints
- Worker-level Prometheus metrics exported at `/metrics`
- Uncaught exception → `firm-logger` structured error + graceful restart signal
- Startup dependency check (DB reachable, Redis reachable) before accepting first job
- `withRequestContext()` called on every job — `tenantId` and `traceId` present in all logs and spans

### E.3 Complete Workers Inventory

| # | Worker | Phase Built | Primary Dependencies | Primary Responsibility |
|---|--------|-------------|---------------------|----------------------|
| 1 | `worker-outbox-processor` | Phase 3 | `firm-bus`, `firm-events`, `firm-idempotency` | Poll `outbox_events`; dispatch to registered handlers; retry with exponential backoff; dead-letter on max attempts |
| 2 | `worker-tenant-provisioning` | Phase 3 | `firm-bus`, `firm-tenant-config`, `firm-provisioning` | Execute tenant provision/deprovision sagas; inherit-and-detach model; compensation on failure |
| 3 | `worker-data-retention` | Phase 3 | `firm-bus`, `firm-compliance`, `firm-audit` | GDPR retention clock; hard-delete after window; write completion record to `firm-audit` |
| 4 | `worker-billing-events` | Phase 3 | `firm-bus`, `firm-metering`, `firm-billing` stub | Aggregate meter events; flush Redis counters to DB; trigger invoice generation signals |
| 5 | `worker-email-delivery` | Phase 4 | `firm-notifications`, `adapters-email-resend`, `adapters-email-sendgrid` | Send transactional and campaign emails; per-channel retry policy; digest aggregation |
| 6 | `worker-sms-delivery` | Phase 4 | `firm-notifications`, `adapters-sms-twilio` | Send SMS notifications; rate-limit enforcement per tenant per provider |
| 7 | `worker-ai-generation` | Phase 4 | `firm-ai-content`, `firm-bus`, `adapters-ai-openai`, `adapters-ai-anthropic` | Process AI generation jobs; enforce human-approval gate; write C2PA manifest; emit `ai.content.generated` event |
| 8 | `worker-campaigns` | Phase 4 | `firm-bus`, `firm-notifications`, `firm-leads` | Execute campaign sends; audience segmentation; delivery scheduling; unsubscribe processing |
| 9 | `worker-crm-sync` | Phase 5 | `firm-sales-pipeline`, `adapters-crm-hubspot`, `adapters-crm-gohighlevel` | Bidirectional CRM sync; conflict resolution; field mapping; sync health monitoring |
| 10 | `worker-reports` | Phase 5 | `firm-reporting`, `firm-bus`, `firm-media` | Pre-compute report aggregates; write to CQRS read model; generate scheduled PDF/email reports |
| 11 | `worker-reputation` | Phase 6 | `firm-reputation`, `adapters-reviews-google-business`, `adapters-reviews-trustpilot` | Poll review platforms; ingest new reviews; trigger AI reply suggestions (pending human approval) |
| 12 | `worker-analytics-rollup` | Phase 6 | `firm-reporting`, `firm-bus`, `adapters-analytics-ga4` | Roll up raw analytics events into period aggregates; feed `firm-kpi` calculations |
| 13 | `worker-social-scheduler` | Phase 6 | `firm-social`, `adapters-social-meta`, `adapters-social-linkedin` | Execute scheduled social posts; handle publish failures; update post status; emit `social.post.published` events |

### E.4 Worker Build Rules

1. **`firm-worker-runtime` first** — no worker is scaffolded until `firm-worker-runtime` is complete and tested (Phase 3, Step 1).
2. **No direct feature package imports** — workers receive jobs via `firm-bus` event dispatch or a job queue. They call feature packages to execute business logic, never contain it.
3. **Tenant context mandatory** — `withRequestContext({ tenantId, traceId })` must wrap every job handler. A worker that processes a job without tenant context fails the RLS coverage test and CI gate.
4. **Dead-letter routing** — every worker that handles outbox events must define a dead-letter handler. Silently dropping failed events is not permitted.
5. **Adapter injection, not direct import** — workers receive adapter instances via constructor injection from `firm-bus` configuration, not by importing adapter packages directly. This keeps workers decoupled from provider changes.

---

## §F Open ADR Summary

The authoritative ADR detail is in **Critique Part 11**. This section provides a reference table: what each ADR is, what phase it blocks, and the default recommendation to apply if the ADR has not yet been resolved.

### F.1 ADRs That Block Roadmap Validity — Write Immediately

These four ADRs have cascading impact on package structure, build order, and the implementation roadmap. Until they are resolved the corresponding phases are provisional.

| ADR | Decision Required | Blocks | Default (working assumption) |
|-----|------------------|--------|------------------------------|
| **ADR-001** | `firm-bus` execution model: custom outbox-only vs. Inngest durable execution | Phase 3 start; `firm-bus`, `firm-webhooks`, `firm-notifications`, all workers provisional | **Custom outbox only.** Re-evaluate at 50+ tenants. Remove `inngest` from pnpm catalog if confirmed. |
| **ADR-002** | `apps/platform/` grouping: 22 separate apps vs. 3–5 hybrid apps vs. single unified app | Phase 8 scaffolding; deployment pipelines; Vercel project limits | **3–5 hybrid apps** (marketing, operations, revenue, analytics, admin). |
| **ADR-003** | `firm-db` split + read model home: `firm-db-read` as separate package vs. subdirectory in `firm-db-schema` | Phase 2 start; `firm-db-read`, CQRS read model, `firm-reporting` | **Separate `firm-db-read` package.** Independent migration cycles, separate connection pool. |
| **ADR-004** | `firm-ai` split interface boundary: exact contract between `firm-ai` (infra) and `firm-ai-content` (generation + compliance) | Phase 4 `firm-ai-content` build; Jun 9 + Aug 2 compliance deadlines | **`firm-ai` exposes `generate(prompt, options)` + `checkQuota()` only.** `firm-ai-content` owns all compliance wrapping. |

### F.2 ADRs That Block Phase 2 Start

These six ADRs govern feature package architecture. Must be resolved before corresponding Tier A packages exit prototyping.

| ADR | Decision Required | Blocks | Default |
|-----|------------------|--------|---------|
| **ADR-005** | `firm-types` shared kernel boundary: single package vs. domain-split vs. hybrid (core types + feature-colocated contracts) | Phase 2 `firm-types` surgery; all domain branded ID locations | **Hybrid:** lean `firm-types` shared kernel + domain-specific contracts colocated with feature packages over time |
| **ADR-006** | `firm-workflow` condition model: expression language (JSONLogic, CEL), state machine library (XState, custom), trigger types, compensation model | Phase 5 `firm-workflow` build | **Defer until Phase 4 exit.** Do not begin `firm-workflow` implementation without a merged ADR. |
| **ADR-007** | `firm-search` tenant isolation model: external index partitions (Algolia, Typesense per-tenant index) vs. PostgreSQL RLS + full-text | Phase 4 `firm-search` build | **PostgreSQL full-text search + RLS** for launch; re-evaluate at 100k documents per tenant |
| **ADR-008** | `firm-bus` ADR-001 dependency — `firm-webhooks` delivery model: outbox-backed vs. direct HTTP with retry queue | Phase 4 `firm-webhooks` build | **Outbox-backed.** Consistent with ADR-001 default. |
| **ADR-009** | `firm-telemetry-client` / RUM browser-Node bundling conflict | Phase 2 `firm-observability` RUM sub-export; Phase 8 app instrumentation | **`@firm/observability/rum` sub-export with `react-server` condition guard.** Re-evaluate before Phase 8. |
| **ADR-010** | `apps/clients/` generation model: ephemeral at deploy time vs. committed generated source | Phase 8 client app scaffolding | **Ephemeral generation at deploy time.** `_template/` and `config/<slug>.json` committed; generated output is not. |

### F.3 ADRs That Block Phase 3+

These two ADRs are lower urgency but must be resolved before the phases they affect begin.

| ADR | Decision Required | Blocks | Default |
|-----|------------------|--------|---------|
| **ADR-011** | `firm-ui` icon isolation: dedicated `firm-icons` package vs. `@firm/ui/icons` sub-export with `sideEffects: false` | Phase 6 `firm-ui` build | **`@firm/ui/icons` sub-export.** Avoids a new package for a pure tree-shaking concern. |
| **ADR-012** | `firm-alerting` — alert rules as TypeScript generating Prometheus YAML, or direct YAML in `infra/` | Phase 5+ SLO alerting | **Direct YAML in `infra/`** for launch. TypeScript generation is a Phase 7 enhancement. |

### F.4 ADR Process

1. **Propose:** Open issue using `.github/ISSUE_TEMPLATE/adr-proposal.md`. State the problem, options, trade-offs, and a default recommendation.
2. **Review:** Architecture reviewer approval required. ADRs blocking Phase 1 or Phase 2 require two reviewers.
3. **Merge:** ADR document merged to `docs/adr/ADR-NNN-<slug>.md`. Status set to `Accepted`.
4. **Implement:** Blueprint and Assessment updated in the same PR that merges the ADR.
5. **Supersede:** A new ADR references the old one and sets its status to `Superseded`. Prior decisions are never deleted.

---

## §G Six Service Level Objectives

The six SLOs define the hard platform guarantees. Each is documented in full in `docs/slos/` including measurement method, alert linkage, and on-call response procedure. Breaches trigger the corresponding runbook.

| SLO | Target | Window | Grafana Alert | Runbook |
|-----|--------|--------|--------------|---------|
| **Tenant Isolation** | 100% — zero cross-tenant queries | Continuous (per-request) | `RLSHealthCheckFailed`, `CrossTenantQueryDetected` | `docs/runbooks/rls-violation.md` |
| **Event Delivery** | 99.99% — outbox events delivered within 10 minutes | 30-day rolling | `OutboxDLQOverflow` | `docs/runbooks/outbox-worker-recovery.md` |
| **API Availability** | 99.9% — platform API returns non-5xx | 30-day rolling | Dashboard threshold | `docs/runbooks/api-degraded.md` |
| **Rate Limiter Fail-Open** | 100% — rate limiter failures allow requests (never block) | Per-event | Warning alert + chaos test linkage | `docs/runbooks/redis-failure-degraded-mode.md` |
| **AI Generation Latency** | p95 < 15 seconds | 7-day rolling | AI cost dashboard threshold | `docs/runbooks/ai-generation-latency.md` |
| **Compliance Manifest Coverage** | 100% — every AI-generated asset has a C2PA manifest | Per-generation | Missing manifest warning | `docs/runbooks/c2pa-manifest-missing.md` |

**Alert severity tiers:**

| Tier | Criteria | Response |
|------|----------|----------|
| 🔴 Critical | Tenant isolation breach; outbox DLQ overflow; API availability below 99% | Page on-call immediately; incident channel opened; rollback triggered |
| 🟠 High | API availability 99–99.9%; AI latency p95 >15s; missing C2PA manifest | Page on-call within 15 minutes; runbook executed |
| 🟡 Warning | Outbox lag >5 minutes; rate limiter Redis unreachable; adapter error rate elevated | Triage during business hours; runbook referenced |

---

## §H Repository Checklist — Files and Directories

The following files and directories must exist before Phase 8 begins. Items marked 🔴 must exist before Phase 1 begins. Items marked 🟠 must exist before Phase 3 begins.

### Root Files

| File | Required By | Status |
|------|-------------|--------|
| `CLAUDE.md` | Phase 0 | ✅ Present |
| `AGENTS.md` | Phase 0 | ✅ Present |
| `SECURITY.md` | 🔴 Phase 1 | Must be created |
| `CONTRIBUTING.md` | 🔴 Phase 1 | Must be created |
| `turbo.json` | Phase 0 | ✅ v2 schema (`tasks:{}`) confirmed |
| `pnpm-workspace.yaml` | Phase 0 | ✅ Named catalogs confirmed |
| `.npmrc` | Phase 0 | ✅ `catalog-mode=strict`, `minimumReleaseAge=1440`, `blockExoticSubdeps=true` |
| `.nvmrc` | Phase 0 | Must be `22.x` |
| `tsconfig.json` | Phase 0 | ✅ Solution file referencing all packages |

### Directories

| Directory | Required By | Contents |
|-----------|-------------|---------|
| `.github/ISSUE_TEMPLATE/` | 🔴 Phase 1 | `bug-report.md`, `feature-request.md`, `adr-proposal.md`, `security-vulnerability.md` |
| `docs/adr/` | 🔴 Phase 1 | All resolved ADRs; `ADR-000-template.md` |
| `docs/slos/` | 🟠 Phase 3 | Six SLO definition files |
| `docs/runbooks/` | 🟠 Phase 3 | One runbook per Grafana critical/high alert |
| `docs/compliance/` | 🟠 Phase 3 | `data-residency.md`; per-deadline compliance records |
| `contracts/v1/` | Phase 7 | `openapi.json`, `asyncapi.yaml`, `events.schema.json` — generated and committed |
| `load-tests/` | Phase 8 | k6 scenarios, thresholds, baseline results |
| `chaos/` | Phase 8 | Toxiproxy scenarios, playbooks — PgBouncer eviction required pre-EU-onboarding |
| `policies/` | Phase 7 | Reserved for OPA Rego policies; `README.md` explains migration trigger |
| `tools/catalog/` | Phase 7 | Generated static service catalog (developer portal MVP) |
| `sbom/` | Phase 8 | CycloneDX SBOMs generated in CI and archived |
| `stubs/` | Phase 4 | Auto-generated adapter stubs; not hand-authored |
| `workers/` | 🟠 Phase 3 | Renamed from `services/` |
| `infra/` | 🟠 Phase 3 | Regional subdirectories: `us-east-1/`, `eu-west-1/`; Prometheus, Grafana, Loki, Tempo configs |

---

## §I CI Pipeline — Current vs. Target Gate State

The 21-gate CI pipeline is defined in **Blueprint §4.8**. This section tracks which gates are currently active, which require new work to activate, and which phase they become mandatory.

| Gate | Name | Currently Active | Requires | Mandatory From |
|------|------|-----------------|----------|---------------|
| 1 | Supply-Chain Security | ✅ `npm audit` + license scanner | — | Phase 0 |
| 2 | Boundary Check | ✅ ESLint `boundaries` + `no-direct-fetch` + `no-direct-read-model-write` | Add `dep-fence` (Action X2) | Phase 1 |
| 3 | Type Check | ✅ `tsgo --noEmit` strict | — | Phase 0 |
| 4 | Lint | ✅ ESLint style + imports | Add `no-runtime-tokens-import` rule (Phase 2) | Phase 0 |
| 5 | Adapter Scaffolding Verification | ❌ not active | Requires first adapter scaffold to validate template against | Phase 4 |
| 6 | Unit & Integration Tests | ✅ Vitest | Confirm ≥80% threshold in `firm-config-vitest` per-package | Phase 0 |
| 7 | Event Registry Check | ❌ not active | Requires `firm-events` + `EventRegistry` (Phase 2) | Phase 3 |
| 8 | Event Versioning Check | ❌ not active | Requires `firm-events` (Phase 2) | Phase 3 |
| 9 | Event Schema Validation | ❌ not active | Requires `firm-events` + Zod schemas (Phase 2) | Phase 3 |
| 10 | RLS Coverage Check | ⚠️ partial | `firm-health` RLS probe present; `rlsHealthCheck()` needs `observabilityHealthCheck()` wired (Fix 7) | Phase 1 |
| 11 | RLS Sibling Test | ⚠️ partial | PgBouncer RESET wrapper (Fix 8) required for full trust | Phase 1 |
| 12 | RLS Parent Test | ⚠️ partial | Same as Gate 11 | Phase 1 |
| 13 | Adapter Interface Compliance | ❌ not active | Requires `firm-ports` frozen (Phase 2) + first adapter | Phase 4 |
| New1 | Quota Check Enforcement | ❌ not active | Requires `firm-metering.checkQuota()` (Fix 10) + static-analysis script | Phase 1 |
| 14 | PII Redaction Test | ⚠️ partial | Log capture exists; Sentry filter validation not confirmed | Phase 1 |
| 15 | Feature Flag Expiration | ❌ not active | Requires `firm-flags` (Phase 3) | Phase 3 |
| 16 | Tag Registry Integrity | ⚠️ partial | `TagRegistry` present; SRI hash CI verification not confirmed | Phase 2 |
| 17 | Observability Instrumentation | ❌ not active | Requires `firm-observability` ESM loader hook confirmed (Phase 2) | Phase 3 |
| 18 | Package `exports` Verification | ❌ not active | Action X3 (Phase 1) | Phase 1 |
| 19 | AsyncAPI Generation | ❌ not active | Requires `firm-events` + `generateAsyncApiDocument` (Phase 2) | Phase 3 |
| 20 | Schema Build | ❌ not active | Requires `firm-schema-registry` + `contracts/v1/` pipeline (Phase 7) | Phase 7 |
| 21 | Build | ✅ `tsdown` via Turborepo dual-pass | — | Phase 0 |

**Gate activation targets by phase:**

- **Phase 1:** Gates 2 (full), 10–12 (full), New1, 14 (full), 18
- **Phase 2:** Gate 16 (full), Gate 19 prerequisite
- **Phase 3:** Gates 7–9, 15, 17, 19
- **Phase 4:** Gates 5, 13
- **Phase 7:** Gate 20

---

## §J Glossary of Assessment-Specific Terms

Terms used specifically in this document that are not defined in Blueprint §6.1.

**drizzle-zod bridge** — The pattern of using `drizzle-zod`'s `createInsertSchema(table)` and `createSelectSchema(table)` to derive Zod schemas directly from Drizzle table definitions, making the Drizzle table the single structural source of truth. `firm-validators` adds only `.refine()` business rules on top. Eliminates the dual source of truth that caused all four documented `firm-validators` bugs.

**Go/No-Go criteria** — The explicit list of conditions that must all be true before the next phase begins. Used at the end of each phase section in §D. Serves as the phase completion gate — not a suggestion, a hard prerequisite.

**Phase 0** — A named pre-phase before Phase 1. Its sole purpose is building the six missing Layer 1 packages (`firm-id`, `firm-date`, `firm-sanitize`, `firm-invariant`, `firm-circuit-breaker`, `firm-codec`). Phase 0 exists because `firm-id` and `firm-date` decisions are irreversible once any table is created.

**Priority adapter queue** — The ordered list of the first 20 adapters to build, defined in §A.7. Order is determined by which feature packages they unblock, not by provider popularity.

**Worker contract** — The structural and behavioural requirements every worker must satisfy, defined in §E.2. A worker that does not satisfy the contract is not considered buildable.

**X-action** — Cross-cutting Phase 1 action (X1, X2, X3) that is not a package-level bug fix but must complete within Phase 1. Defined in §B.2.

---

## §K Layer 6 Gap Register

The following gaps were identified in UPDATE.md and are not captured in the phase roadmap narratives above. Each is a discrete action item tied to a specific package. They are recorded here as the authoritative enhancement backlog — not optional polish, but underspecified behaviours that will produce bugs or data corruption when the package is built without them.

### K.1 Tier A — Core Infrastructure Gaps

**`firm-bus`**
| Gap | Description | Risk if Ignored |
|-----|-------------|----------------|
| `SAGA_COMPENSATION_FAILED` DLQ | Compensation step failure currently routes to the same DLQ as primary failure — silent data corruption. Need a distinct DLQ category with its own alert routing. | Compensated sagas appear failed; no recovery path; data left in inconsistent state |
| `sequenceKey` for ordered delivery | Some operations require causal ordering (e.g., `lead.created` → `lead.scored`). Define `sequenceKey` on outbox events for partition-level ordering. | Out-of-order processing produces incorrect CRM/pipeline state |
| Consumer lag alerting | No defined SLO or alert threshold for outbox consumer lag. Expose `getConsumerLag()` probe for `firm-health`. | Silent backlog accumulation; outbox delivery SLO breached without alert |
| Event replay capability | Required for debugging, compliance audits, and rebuilding the CQRS read model. Not currently in spec. | Read model rebuild after incident requires full DB restore instead of event replay |

**`firm-flags`**
| Gap | Description | Risk if Ignored |
|-----|-------------|----------------|
| Entitlement conflation | `firm-flags` currently conflates temporary flags (A/B tests, rollouts — mandatory expiration) with permanent entitlements (plan-based capabilities). | Permanent entitlements acquire spurious expiry dates; flag expiration CI gate produces false failures |
| Extract permanent entitlements | Move permanent entitlements to `firm-feature-gates` (see §K.4). `firm-flags` retains only temporary, expiring rollout flags. | — |

**`firm-metering`**
| Gap | Description | Risk if Ignored |
|-----|-------------|----------------|
| Typed `QuotaDimension.resetSchedule` | Quota dimension reset schedules are not first-class data. `QuotaDimension` needs a typed `resetSchedule: 'daily' \| 'monthly' \| 'annual'`. | Quota counters never reset; tenants blocked after first billing period |
| Three-tier aggregate quota enforcement | `checkQuota()` must enforce sub-account individual limit AND agency aggregate limit simultaneously. A sub-account burning 100% of the agency's shared quota must fail even if that sub-account has not reached its individual limit. | Agency overages unbounded; platform absorbs cost beyond plan |

**`firm-notifications`**
| Gap | Description | Risk if Ignored |
|-----|-------------|----------------|
| Three-level preference cascade | Level 1: platform default. Level 2: tenant override (agency restricts or expands). Level 3: user choice (can opt down from tenant defaults, never up). All three levels must be evaluated in order. | Users receive notifications they explicitly opted out of; GDPR/CNIL risk |
| In-app notification persistence | Missing in-app notification store with read/unread state for dashboard bell icon. This is distinct from transient delivery. | No notification history; no unread count; portal dashboard incomplete |

**`firm-sse`**
| Gap | Description | Risk if Ignored |
|-----|-------------|----------------|
| Redis Pub/Sub fanout | SSE connections are per-server. Without Redis Pub/Sub, a multi-server deployment cannot broadcast real-time events to clients connected to different nodes. | Real-time updates silently fail for multi-node deployments |

**`firm-search`**
| Gap | Description | Risk if Ignored |
|-----|-------------|----------------|
| ADR: tenant isolation model | PostgreSQL FTS (RLS enforces isolation) vs. Typesense/Meilisearch (separate index per tenant) vs. shared index with `tenantId` filter. Must be decided before implementation. | Wrong choice requires full re-index migration; tenant data may bleed in shared-index model |

**`firm-kpi`** (renamed from `firm-telemetry`)
| Gap | Description | Risk if Ignored |
|-----|-------------|----------------|
| `registerKpi(name, computeFn, tenantId)` IoC | KPI registration must use inversion-of-control so feature packages register their own KPIs without importing `firm-reporting`. | `firm-kpi` accumulates hard-coded knowledge of every feature package — circular dependency risk |
| Time-bucketed aggregation | Hourly/daily/weekly/monthly aggregation computed by cron via `firm-bus`, stored in read model. | Reports built on raw event streams are unacceptably slow at scale |
| Anomaly detection | ADR required: z-score vs. IQR vs. seasonal decomposition. Alert threshold model: absolute, percentage change, standard deviations from baseline. | No anomaly alerting; tenant dashboards miss significant metric changes |

**`firm-media`**
| Gap | Description | Risk if Ignored |
|-----|-------------|----------------|
| Video transcoding pipeline | Multi-resolution output; job queue; progress events via `firm-sse`. | Video uploads stored but unplayable across devices without transcoding |
| Content-addressed deduplication | Hash-based dedup before storage write; prevents duplicate storage charges. | Storage costs amplified by duplicate uploads |

---

### K.2 Tier B — Operations Gaps

**`firm-provisioning`**
| Gap | Description | Risk if Ignored |
|-----|-------------|----------------|
| Inherit-and-detach model | When a sub-account is created, copy (not link) the agency's default branding, feature flags, and quota assignments, then detach so the child diverges independently. Linking corrupts children if parent is deleted or modified. | Deleting an agency's default config propagates to all sub-accounts |

**`firm-subscriptions`**
| Gap | Description | Risk if Ignored |
|-----|-------------|----------------|
| `computeUsageCharge(tenantId, billingPeriod)` | This closes the metering→billing loop. Reads `firm-metering` aggregates, applies plan pricing, returns typed line items for `firm-billing`. | Metered usage is tracked but never converted to invoice line items |

**`firm-billing`**
| Gap | Description | Risk if Ignored |
|-----|-------------|----------------|
| `SplitRule` aggregate | Revenue split as a first-class domain object: platform percentage + agency percentage for white-label reseller model. | Revenue share computed ad-hoc per invoice; no auditable split history |

**`firm-projects`**
| Gap | Description | Risk if Ignored |
|-----|-------------|----------------|
| `ProjectTemplate` aggregate | `createProjectFromTemplate(templateId, tenantId)` — standardised project scaffolding for agencies. | Each project created from scratch; no template-driven onboarding |

**`firm-appointments`**
| Gap | Description | Risk if Ignored |
|-----|-------------|----------------|
| Round-robin + collective booking | Round-robin staff assignment; collective booking (all required attendees must be free); multi-staff required for service types. | Basic single-staff booking only; agency workflows blocked |

**`firm-documents`**
| Gap | Description | Risk if Ignored |
|-----|-------------|----------------|
| Template merge fields + event contracts | Document templates with merge fields; event contracts with `firm-sales-pipeline` and `firm-billing` must be defined in `firm-events` before build begins. | Documents built without pipeline/billing integration; cannot trigger e-signature on deal close |

**`firm-sales-pipeline`**
| Gap | Description | Risk if Ignored |
|-----|-------------|----------------|
| `lead.scored` event contract | Must be defined in `firm-events` with payload `{ leadId, score, confidence, scoringModelVersion, factors }` before `firm-sales-pipeline` is built. `firm-ai` emits it; `firm-sales-pipeline` subscribes. | AI lead scoring exists but pipeline never receives scores |

**`firm-workflow`**
| Gap | Description | Risk if Ignored |
|-----|-------------|----------------|
| ADR-006 required | Condition model, state machine type, trigger system, and compensation model are all undefined. Do not begin implementation before ADR-006 is merged. | Package built on wrong assumptions; complete rebuild required |

**`firm-integrations`**
| Gap | Description | Risk if Ignored |
|-----|-------------|----------------|
| `getValidToken(providerId, tenantId)` | Proactive OAuth token refresh before expiry; injected into adapter constructors. | Adapter calls fail with expired tokens mid-operation; no automatic recovery |

---

### K.3 Tier C — Revenue Gaps

*(All Tier C gaps captured in §K.2 via `firm-subscriptions` and `firm-billing` entries above.)*

---

### K.4 Tier D — Client-Facing & Marketing Gaps

**`firm-reporting`**
| Gap | Description | Risk if Ignored |
|-----|-------------|----------------|
| Three-package delivery chain | Full chain: `firm-bus` cron emits `report.schedule.triggered` → `firm-reporting` computes + stores PDF via `firm-media` → emits `report.generated` (signed URL) → `firm-notifications` delivers email/in-app. Chain must be explicitly specified before build. | Reports generated but never delivered; or delivered without proper signed-URL expiry |

**`firm-funnels`**
| Gap | Description | Risk if Ignored |
|-----|-------------|----------------|
| `touchpoint.recorded` event | Standardised event emitted by `firm-funnels`, `firm-ads`, and `firm-social`. Required for multi-touch attribution computation in `firm-reporting`. | Attribution computed only on funnel-originated touchpoints; ad and social touches invisible |

**`firm-ads`**
| Gap | Description | Risk if Ignored |
|-----|-------------|----------------|
| Creative asset lifecycle | Creative library (images, copy variants, video clips) with versioning, A/B test variant assignment, performance tracking per creative, approval workflows before publish, and fatigue detection. | Creatives published without approval; no fatigue detection; A/B results unmeasurable |

**`firm-social`**
| Gap | Description | Risk if Ignored |
|-----|-------------|----------------|
| Social listening ADR | Social listening (brand mention monitoring) must be assigned: `firm-reputation` (via `social.mention.received` event) is the recommendation. Leaving it in `firm-social` creates duplicate monitoring logic. | Mention monitoring duplicated across two packages; `firm-reputation` review workflows miss social mentions |

**`firm-inbox`**
| Gap | Description | Risk if Ignored |
|-----|-------------|----------------|
| AI reply drafting integration | Event chain: `inbox.message.received` → `firm-ai` → `inbox.reply.drafted` → human approval gate (same pattern as `firm-ai-content`). Contract must be defined in `firm-events` before `firm-inbox` is built. | AI reply drafts never surfaced; agents write all replies manually |

---

### K.5 Missing Packages Not Previously in §A.6

The following packages were identified in UPDATE.md as missing from the original L6 inventory. They are lower priority than Tier A–D but must be in the package catalog before Phase 6 planning begins.

| Package | Tier | Priority | Phase | Description |
|---------|------|----------|-------|-------------|
| `firm-feature-gates` | A | 🟠 | Phase 3 | Permanent entitlement checks (plan-based), separated from `firm-flags`. `checkEntitlement(tenantId, feature)`: boolean backed by `firm-subscriptions` data, cached via `firm-cache`, invalidated on plan change. Emits `entitlement.gate.denied` events. |
| `firm-worker-runtime` | A | 🔴 | Phase 3 | Already in §A.6 — confirmed as a first-class package, not a utility. `createWorker(options)` factory; graceful `SIGTERM` drain; K8s probes; worker-level metrics; uncaught exception handling; startup dependency checks. |
| `firm-calls` | B | 🟡 | Phase 5 | VoIP call initiation/reception (Twilio, Aircall, Vonage adapters). Call recording + transcription storage (`firm-media`). Voicemail and ringless voicemail drop. Call tracking numbers with attribution. AI-assisted call summaries. Click-to-call from CRM. |
| `firm-surveys` | D | 🟡 | Phase 6 | NPS/CSAT/CES with automatic score computation. Anonymous response mode (GDPR-friendly). Conditional branching. Aggregate-first analytics via `firm-reporting`. Delivery via `firm-notifications` (email/SMS invitations, one-click response). |
| `firm-chatbot` | D | 🟡 | Phase 6 | No-code AI chatbot builder. Visual conversation flow (nodes: message, condition, user input, CRM action, handoff). Intent recognition (FAQ pattern or LLM). Lead qualification → `firm-sales-pipeline`. Appointment booking → `firm-appointments`. Embedded widget. Fully automated, no human queue. |
| `firm-courses` | D | 🟡 | Phase 7 | Course structure (modules, lessons, quizzes with auto-grading, assignments). Membership access control (subscription tier, cohort, coupon). Completion tracking per student. Certificate generation (`firm-documents`). Drip content scheduling. Student engagement analytics (`firm-reporting`). |

---

### K.6 Additional L5 Missing Packages

UPDATE.md identified three additional Layer 5 packages beyond those in §A.5:

| Package | Priority | Phase | Description |
|---------|----------|-------|-------------|
| `firm-error-boundary` | 🟠 | Phase 5 | `ErrorBoundary` (fallback + `onError` → `captureError` with tenant context); `AsyncBoundary` (Suspense + ErrorBoundary combined); `Skeleton` variants (card, table, sidebar — matching `firm-ui` shapes); `EmptyState`; `useErrorBoundary` programmatic trigger. |
| `firm-forms-utils` | 🟠 | Phase 5 | RHF + Zod resolver factory; multi-step form state machine; shared types (`FormState<T>`, `FieldError`, `FormSubmitResult`); `createFieldSchema(baseSchema, overrides)`; `withFormContext<T>` HOC. **ADR required:** standalone `firm-forms-utils` vs. `@firm/ui/forms-utils` sub-export. Standalone recommended — `firm-forms` (L6) can consume without a visual `firm-ui` dependency. |
| `firm-motion` | 🟡 | Phase 5 | Token-backed animation variants with `useReducedMotion` (from `firm-hooks`). Consumes `firm-tokens` duration/easing tokens. **ADR required:** `framer-motion` (~40KB) vs. CSS-only keyframes with CSS custom properties. Decision driven by landing page and portal design requirements. |

---

## §L Master Package Count & Quick Reference

### L.1 Total Package Count by Layer

| Layer | Layer Name | Existing | Missing/Not Built | Total Target |
|-------|-----------|----------|------------------|-------------|
| 0 | Build & Constraint | 13 | 0 | 13 |
| 1 | Core Utilities & Environment | 6 | 6 | 12 |
| 2 | Data & Contracts | 8 | 8 | 16 |
| 3 | Identity, Security & Consent | 4 | 1 | 5 |
| 4 | Observability & Health | 2 | 1 | 3 |
| 5 | UI, Theming & Testing | 4 | 8 | 12 |
| 6 | Feature Packages | 1 (partial) | 43 | 44 |
| 7 | Adapters | 0 | 105 | 105 |
| — | Workers | 0 | 13 | 13 |
| **Total** | | **38** | **185** | **223** |

> Layer 6 count of 44 includes the 38 packages in §A.6 plus the 6 additions in §K.5. `firm-worker-runtime` is counted once in Layer 6, not also in Workers. Workers are not packages — they are leaf applications.

### L.2 Phase-to-Package Mapping

| Phase | Packages Delivered | Cumulative Total |
|-------|-------------------|-----------------|
| Phase 0 | 4 new L1 packages (`firm-id`, `firm-date`, `firm-sanitize`, `firm-invariant`) + 4 L1 enhancements | 42 |
| Phase 1 | 11 fixes; `firm-rate-limiter` extracted; `firm-db` split (2 packages); 1 adapter; drizzle-zod bridge | 47 |
| Phase 2 | 9 L2 packages; 2 L4 enhancements; 2 L5 enhancements | 58 |
| Phase 3 | 7 L6 Tier A packages; 4 workers | 69 |
| Phase 4 | 7 L6 Tier A packages; 11 adapters; 4 workers | 91 |
| Phase 5 | 11 L6 Tier B/C packages; 10 adapters; 2 workers | 114 |
| Phase 6 | 12 L6 Tier D packages; 5 L5 packages; 8 adapters; 3 workers | 142 |
| Phase 7 | 85 adapters; `firm-schema-registry`; `firm-db-seed` | 229 |
| Phase 8 | Apps (not packages); E2E; load tests; chaos tests | 229 + apps |

### L.3 All Packages — Alphabetical Quick Reference

A flat alphabetical list for search. Format: `package-name` → Layer / Tier (if L6) / Phase / Status.

| Package | Layer | L6 Tier | Phase | Status |
|---------|-------|---------|-------|--------|
| `adapters-*` (105 total) | 7 | — | 4–7 | ❌ not built |
| `firm-ai` | 6 | D | Phase 4 | ❌ not built |
| `firm-ai-brand-voice` | 6 | D | Phase 6 | ❌ not built |
| `firm-ai-chat` | 6 | D | Phase 6 | ❌ not built |
| `firm-ai-content` | 6 | D | Phase 4 | ❌ not built |
| `firm-ai-seo` | 6 | D | Phase 6 | ❌ not built |
| `firm-analytics` | 6 | D | Phase 6 | ❌ not built (scope ADR pending) |
| `firm-api-contracts` | 2 | — | Phase 2 | ✅ exists; scope too wide |
| `firm-appointments` | 6 | B | Phase 5 | ❌ not built |
| `firm-audit` | 6 | A | Phase 3 | ❌ not built |
| `firm-billing` | 6 | C | Phase 5 | ❌ not built |
| `firm-bookings` | 6 | B | Phase 5 | ❌ not built |
| `firm-bus` | 6 | A | Phase 3 | ❌ not built |
| `firm-cache` | 2 | — | Phase 1 | ⚠️ 4 gaps |
| `firm-calls` | 6 | B | Phase 5 | ❌ not built |
| `firm-campaigns` | 6 | B | Phase 6 | ❌ not built |
| `firm-chatbot` | 6 | D | Phase 6 | ❌ not built |
| `firm-circuit-breaker` | 1 | — | Phase 0 | ❌ missing |
| `firm-cms` | 6 | D | Phase 6 | ❌ not built |
| `firm-codec` | 1 | — | Phase 0/2 | ❌ missing |
| `firm-compliance` | 6 | B | Phase 5 | ❌ not built |
| `firm-config-commitlint` | 0 | — | — | ✅ |
| `firm-config-docker` | 0 | — | — | ✅ |
| `firm-config-eslint` | 0 | — | — | ✅ |
| `firm-config-next` | 0 | — | — | ✅ |
| `firm-config-playwright` | 0 | — | — | ✅ |
| `firm-config-prettier` | 0 | — | — | ✅ |
| `firm-config-security-headers` | 0 | — | — | ✅ |
| `firm-config-storybook` | 0 | — | — | ✅ |
| `firm-config-tailwind` | 0 | — | — | ✅ |
| `firm-config-typescript` | 0 | — | — | ✅ |
| `firm-config-vitest` | 0 | — | — | ✅ |
| `firm-consent` | 3 | — | Phase 1 | ⚠️ 4 compliance gaps |
| `firm-courses` | 6 | D | Phase 7 | ❌ not built |
| `firm-crypto` | 1 | — | Phase 0 | ⚠️ 3 missing, 1 redundancy |
| `firm-date` | 1 | — | Phase 0 | ❌ missing |
| `firm-db-client` | 2 | — | Phase 1 | ❌ not yet split |
| `firm-db-migrations` | 2 | — | Phase 2 | ❌ missing |
| `firm-db-read` | 2 | — | Phase 1 | ❌ pending ADR-003 |
| `firm-db-schema` | 2 | — | Phase 1 | ❌ not yet split |
| `firm-db-seed` | 2 | — | Phase 7 | ❌ missing |
| `firm-documents` | 6 | B | Phase 5 | ❌ not built |
| `firm-email-templates` | 5 | — | Phase 5 | ❌ missing |
| `firm-env` | 1 | — | Phase 0 | ✅ minor gaps |
| `firm-error-boundary` | 5 | — | Phase 5 | ❌ missing |
| `firm-errors` | 1 | — | Phase 0 | ⚠️ 2 missing |
| `firm-events` | 2 | — | Phase 2 | ❌ missing |
| `firm-feature-gates` | 6 | A | Phase 3 | ❌ missing |
| `firm-flags` | 6 | A | Phase 3 | ❌ not built |
| `firm-forms` | 6 | D | Phase 6 | ❌ not built |
| `firm-forms-utils` | 5 | — | Phase 5 | ❌ missing (ADR) |
| `firm-funnels` | 6 | D | Phase 6 | ❌ not built |
| `firm-health` | 4 | — | Phase 1 | ⚠️ 1 gap |
| `firm-hooks` | 5 | — | Phase 5 | ❌ missing |
| `firm-i18n` | 6 | A | Phase 4 | ❌ not built |
| `firm-icons` | 5 | — | Phase 5 | ❌ missing (ADR) |
| `firm-id` | 1 | — | Phase 0 | ❌ missing |
| `firm-idempotency` | 2 | — | Phase 2 | ❌ missing |
| `firm-inbox` | 6 | D | Phase 6 | ❌ not built |
| `firm-integrations` | 6 | B | Phase 5 | ❌ not built |
| `firm-invariant` | 1 | — | Phase 0 | ❌ missing |
| `firm-kpi` | 6 | D | Phase 6 | ❌ not built (renamed from `firm-telemetry`) |
| `firm-landing-pages` | 6 | D | Phase 6 | ❌ not built |
| `firm-leads` | 6 | B | Phase 5 | ❌ not built |
| `firm-logger` | 1 | — | Phase 1 | ⚠️ splitbrain bug |
| `firm-media` | 6 | A | Phase 4 | ❌ not built |
| `firm-metering` | 6 | C | Phase 1 | ⚠️ post-op only (Fix 10) |
| `firm-motion` | 5 | — | Phase 5 | ❌ missing (ADR) |
| `firm-notifications` | 6 | A | Phase 4 | ❌ not built |
| `firm-observability` | 4 | — | Phase 1 | ⚠️ 1 gap |
| `firm-pagination` | 2 | — | Phase 2 | ❌ missing |
| `firm-payments` | 6 | C | Phase 5 | ❌ not built |
| `firm-policy` | 3 | — | Phase 2 | ❌ missing |
| `firm-portal` | 6 | D | Phase 6 | ❌ not built |
| `firm-ports` | 2 | — | Phase 2 | ❌ missing |
| `firm-primitives` | 0 | — | — | ✅ |
| `firm-projects` | 6 | B | Phase 5 | ❌ not built |
| `firm-provisioning` | 6 | B | Phase 5 | ❌ not built |
| `firm-query` | 2 | — | Phase 2 | ❌ missing |
| `firm-rate-limiter` | 3 | — | Phase 1 | ❌ not yet extracted |
| `firm-reporting` | 6 | D | Phase 6 | ❌ not built |
| `firm-reputation` | 6 | D | Phase 6 | ❌ not built |
| `firm-request-context` | 1 | — | Phase 1 | ⚠️ Fix 0 |
| `firm-sales-pipeline` | 6 | B | Phase 5 | ❌ not built |
| `firm-sanitize` | 1 | — | Phase 0 | ❌ missing |
| `firm-schema-registry` | 2 | — | Phase 7 | ❌ missing |
| `firm-sdk` | 2 | — | Phase 2 | ❌ not built |
| `firm-search` | 6 | A | Phase 4 | ❌ not built (ADR required) |
| `firm-security` | 3 | — | Phase 1 | ⚠️ broken; scope too wide |
| `firm-seo` | 6 | D | Phase 6 | ❌ not built |
| `firm-social` | 6 | D | Phase 6 | ❌ not built |
| `firm-sse` | 6 | A | Phase 4 | ❌ not built |
| `firm-storybook-utils` | 5 | — | Phase 5 | ❌ missing |
| `firm-subscriptions` | 6 | C | Phase 5 | ❌ not built |
| `firm-surveys` | 6 | D | Phase 6 | ❌ not built |
| `firm-template-engine` | 6 | A | Phase 3 | ❌ not built |
| `firm-tenant-config` | 6 | A | Phase 3 | ❌ not built |
| `firm-tenancy` | 6 | A | Phase 4 | ❌ not built |
| `firm-testing` | 5 | — | Phase 1 | ⚠️ 5 gaps |
| `firm-theme-provider` | 5 | — | Phase 5 | ❌ not built |
| `firm-tokens` | 0/5 | — | Phase 2 | ⚠️ 3 gaps |
| `firm-types` | 2 | — | Phase 1 | ⚠️ structurally flawed |
| `firm-utils` | 1 | — | Phase 0 | ⚠️ 3 missing, 1 bug |
| `firm-validators` | 2 | — | Phase 1 | ⚠️ Fix 4 |
| `firm-webhooks` | 6 | A | Phase 4 | ❌ not built |
| `firm-white-label` | 6 | A | Phase 4 | ❌ not built |
| `firm-workflow` | 6 | B | Phase 5 | ❌ not built (ADR-006 required) |
| `firm-worker-runtime` | 6 | A | Phase 3 | ❌ not built |

---

## §M Document Maintenance

### M.1 When to Update This Document

This document changes when any of the following occur:

- A phase Go/No-Go is reached — update the phase's status and record the date
- A bug fix from §B.1 is merged — update the package row in §A and mark the fix complete
- An ADR is resolved — update §F (mark Resolved with date + outcome), update affected §A rows, update §D phase prerequisites
- A new package is added to any layer — add it to §A, §K (if L6 gap), and §L.3
- A compliance deadline is met — update §C (mark Done with date and PR reference)
- A CI gate is activated — update §I
- Package scope changes due to an ADR — update §A, §D, and §K as needed

### M.2 What This Document Does Not Contain

The following are deliberately excluded — they live in companion documents and must not be duplicated here:

| Topic | Lives In |
|-------|---------|
| Layer definitions, package interfaces, data flow diagrams | Blueprint §2, §5 |
| Enforcement mechanism specifications (ESLint rules, CI gate logic) | Blueprint §4 |
| Resolved architectural decisions | Critique Part 2 |
| Critical security finding details (RLS+PgBouncer, `checkQuota`) | Critique Part 3 |
| Build & TypeScript architecture | Critique Part 4 |
| Dependency governance (catalogs, Renovate) | Critique Part 5 |
| Full repository structure | Critique Part 6 |
| Database migration architecture | Critique Part 7 |
| Governance & developer experience | Critique Part 8 |
| CI/CD pipeline gate logic | Critique Part 9 |
| Observability & monitoring infrastructure | Critique Part 10 |
| ADR detail (problem statement, options, trade-offs) | Critique Part 11 |

### M.3 Document Ownership

| Section | Owner | Review Cadence |
|---------|-------|---------------|
| §A Package Health | `@firm/architects` | Every PR that touches a package |
| §B Fix Sequence | `@firm/architects` + `@firm/security` | Phase 1 sprint reviews |
| §C Compliance Deadlines | `@firm/legal` + `@firm/architects` | Weekly until all four closed |
| §D Roadmap | `@firm/architects` | Phase boundary reviews |
| §E Workers | `@firm/platform` | Phase 3+ |
| §F ADR Summary | `@firm/architects` | On every ADR merge |
| §G SLOs | `@firm/devops` + `@firm/architects` | Phase 3 + quarterly |
| §H Repository Checklist | `@firm/devops` | Phase 0 and Phase 3 |
| §I CI Gate State | `@firm/platform` | Every gate activation |
| §K L6 Gap Register | `@firm/architects` | Phase 3+ sprint planning |
| §L Quick Reference | `@firm/architects` | Every new package merge |

---

## §N Critique Supplement — Additions Not Previously Captured

This section records findings from UPDATE.md that are not yet reflected in any section of the Critique. These items must be written into the Critique in their appropriate Parts. Until that update occurs, this section is the authoritative source.

---

### N.1 Additions to Critique Part 1 — What the Architecture Gets Right

The following items are confirmed as correct, non-negotiable decisions that must be preserved and appended to Critique Part 1:

✅ **`firm-id` as a dedicated Layer 1 package** — UUID v7 (time-ordered for B-tree performance) as the platform-wide ID generation strategy, separated from `firm-primitives` (which defines types and gatekeepers, not generators). The ID format decision is irreversible once tables exist and must be locked before any schema is written.

✅ **`firm-date` as a dedicated Layer 1 package** — UTC-enforced date arithmetic as a shared primitive, not ad-hoc per package. DST and clock-skew divergence in outbox retry scheduling, billing period calculation, and compliance retention clocks are eliminated by a single authoritative date utility.

✅ **`firm-sanitize` as Layer 1, not Layer 3** — Pure defensive utility with no domain or auth dependencies. Placing it at Layer 1 avoids a layer-boundary smell (sanitisation is not a security policy decision — it is a defensive input transformation). Named policies (`strict`, `rich-text`, `email`, `cms`) ensure every consumer uses the same auditable ruleset.

✅ **`firm-worker-runtime` as a first-class L6 Tier A package** — Workers are not raw Node.js processes. The shared `createWorker(options)` factory standardises graceful shutdown, K8s probes, metrics, and startup dependency checks across all 13 workers. Building even one worker without it produces a divergent operational contract.

✅ **`firm-feature-gates` separated from `firm-flags`** — Permanent plan-based entitlements have a fundamentally different lifecycle from temporary rollout flags. Conflating them causes permanent entitlements to acquire expiry dates and triggers false CI failures on the flag expiration gate. Separation is a structural requirement, not a preference.

✅ **Three-tier aggregate quota enforcement** — `checkQuota()` must enforce both the sub-account individual limit and the agency aggregate limit simultaneously. A sub-account exhausting the agency's shared pool must be rejected even if it has not reached its own limit. Single-level quota enforcement is architecturally incomplete for the three-tier hierarchy.

✅ **Inherit-and-detach model for sub-account provisioning** — When a sub-account is created, the agency's defaults (branding, feature flags, quota assignments) are copied and then detached. Linking instead of copying causes parent modifications and deletions to propagate to children — a data integrity violation in the three-tier model.

✅ **`SAGA_COMPENSATION_FAILED` as a distinct DLQ category** — Compensation step failures must not route to the same dead-letter queue as primary failures. Silent data corruption results when a failed compensation is treated as a failed primary operation. This is a structural property of the outbox + saga model, not a monitoring preference.

---

### N.2 Additions to Critique Part 3 — Critical Findings

#### N.2.1 Critical Finding: Entitlement Conflation in `firm-flags`

**Problem:** `firm-flags` conflates two categories of flags with incompatible lifecycle contracts:
- **Temporary flags** (A/B tests, rollouts): must carry mandatory `expiresAt`; CI gate fails on expired flags; `false` after expiry.
- **Permanent entitlements** (plan-based capabilities, feature gating by subscription tier): must never expire; carry no `expiresAt`; backed by `firm-subscriptions` data.

The current design applies the same `expiresAt` enforcement to both categories. This causes permanent entitlements to either (a) require a sentinel `never` value that defeats the CI expiration gate, or (b) be incorrectly treated as expiring flags.

**Fix:**
1. Split into two packages: `firm-flags` (temporary, expiring, rollout flags only) and `firm-feature-gates` (permanent entitlements backed by subscription data).
2. `firm-feature-gates` provides `checkEntitlement(tenantId, feature): boolean` backed by `firm-subscriptions` data, cached via `firm-cache`, invalidated on `subscription.plan.changed` event.
3. `firm-feature-gates` emits `entitlement.gate.denied` for observability and billing alerts.
4. All existing references to permanent feature capabilities in `firm-flags` are migrated to `firm-feature-gates` before Phase 3 build begins.

---

#### N.2.2 Critical Finding: `firm-notifications` Three-Level Preference Cascade

**Problem:** Notification preferences have no defined enforcement model. The platform has three principals with different authority levels (platform, tenant/agency, user), each of which may restrict or expand notification delivery. Without an explicit cascade model, either:
- Users receive notifications they have explicitly opted out of (GDPR/CNIL risk), or
- Platform-mandated notifications are silently suppressed by user preferences.

**Fix:**
1. Define the three-level cascade as an immutable rule:
   - **Level 1 (Platform default):** default channel and frequency per notification type.
   - **Level 2 (Tenant override):** agency can restrict or expand platform defaults for all their users. Cannot grant capabilities beyond Level 1.
   - **Level 3 (User choice):** user can opt down from tenant-resolved preferences only. Users cannot opt up above what Level 2 permits.
2. `resolvePreference(tenantId, userId, notificationType, channel)` is the single evaluation function. No notification is dispatched without calling it.
3. In-app notification persistence (read/unread store for dashboard bell icon) is a distinct concern from transient delivery. Both must be designed in the same PR.

---

#### N.2.3 Critical Finding: No Event Replay Capability

**Problem:** The transactional outbox guarantees at-least-once delivery but provides no mechanism for replaying events after the fact. This gap has three direct consequences:
1. **Debugging:** tracing a failed downstream operation requires correlating logs manually rather than replaying the event and observing the handler.
2. **Compliance audits:** GDPR and SOC 2 require demonstrating that specific events occurred and were processed correctly. Without replay, audit evidence depends entirely on log retention.
3. **CQRS read model rebuild:** if the `firm-db-read` schema is rebuilt (after a bug, a migration, or a new consumer), rebuilding from events is the correct approach. Without replay, the only option is full DB restore.

**Fix:**
1. `outbox_events` must retain completed events for a configurable window (default: 30 days). Hard-delete is not performed at completion — status changes to `completed`, `processed_at` timestamp recorded.
2. `firm-bus` exposes `replayEvents(tenantId, fromTimestamp, toTimestamp, filter?)` — re-dispatches completed events to registered handlers.
3. Replay runs in a separate execution context from the primary outbox worker; it does not compete for the live processing queue.
4. Idempotency keys are honoured during replay — handlers receiving a replayed event with a previously-processed key return the cached result without repeating side effects.
5. Replay access is gated by `bus:replay` RBAC permission + audit record in `firm-audit`.

---

#### N.2.4 Critical Finding: Incomplete `firm-reporting` Delivery Chain

**Problem:** The three-package report delivery chain (`firm-reporting` → `firm-media` → `firm-notifications`) is not specified as an event contract anywhere. Without an explicit contract:
- Each package is built with an assumed interface that diverges at integration time.
- Signed URL expiry is not enforced consistently.
- The report delivery SLO has no measurable endpoint.

**Fix (event contracts to define before any package is built):**

```
report.schedule.triggered
  emitter: firm-bus (cron)
  payload: { tenantId, reportType, parameters, scheduledFor }

report.computation.started
  emitter: firm-reporting (on job pickup)
  payload: { tenantId, reportId, reportType, startedAt }

report.generated
  emitter: firm-reporting (on completion)
  payload: { tenantId, reportId, mediaId, signedUrl, expiresAt, format }

report.delivery.requested
  emitter: firm-reporting (consumed by firm-notifications)
  payload: { tenantId, reportId, recipients, channel, signedUrl, expiresAt }

report.delivered
  emitter: firm-notifications (on confirmed delivery)
  payload: { tenantId, reportId, deliveredAt, channel, recipient }
```

All five contracts must be registered in `firm-events` before `firm-reporting`, `firm-media`, or `firm-notifications` is built in relation to scheduled reports.

---

#### N.2.5 Critical Finding: No Backpressure Model for `firm-bus`

**Problem:** The outbox worker has no defined backpressure mechanism. Under high load (e.g., bulk lead import generating 50,000 events), the worker attempts to dispatch all events at maximum concurrency. This produces:
- Thundering herd on downstream handlers and adapters
- Adapter rate limit exhaustion (resulting in retry storms)
- Database connection pool saturation

**Fix:**
1. Define `concurrencyLimit` per worker and per event type in the `firm-bus` configuration.
2. Expose `getConsumerLag()` as a health probe metric consumed by `firm-health` readiness checks and Grafana alerting.
3. Consumer lag SLO: lag > 5 minutes → warning alert; lag > 10 minutes → high alert (triggers outbox delivery SLO breach).
4. Backpressure triggers exponential increase in poll interval, not infinite retry at full concurrency.
5. Load test scenario in `load-tests/` must exercise: 50,000 events enqueued in 60 seconds → verify p99 dispatch latency < 10 minutes.

---

### N.3 Additions to Critique Part 11 — ADR Backlog

The following ADRs were identified in UPDATE.md but are not yet in Critique Part 11. They must be added.

---

**ADR-013: `firm-analytics` Scope**

- **Problem:** `firm-analytics` is provisionally accepted in Tier D (Decision 13) but its scope relative to `firm-reporting` is undefined. `firm-reporting` covers structured business reports; `firm-analytics` potentially covers raw event tracking, cohort analysis, and product analytics. Without a defined boundary, the two packages will accumulate overlapping responsibilities.
- **Options:**
  - **A — `firm-analytics` is product analytics only** (PostHog-style: event tracking, funnels, cohorts, feature adoption). `firm-reporting` handles business intelligence (revenue, leads, campaigns).
  - **B — `firm-analytics` is eliminated.** Product analytics is delegated to `adapters-analytics-posthog` directly, consumed by `firm-reporting` via the outbox.
  - **C — `firm-analytics` is a thin facade** over pluggable analytics adapters, providing a tenant-isolated tracking API (`track(event, properties)`).
- **Default recommendation:** C — thin facade pattern, consistent with Port-and-adapter architecture. Prevents direct adapter imports from Layer 6 features.
- **Impact if delayed:** `firm-reporting` and `firm-analytics` both accumulate tracking logic with no defined boundary.

---

**ADR-014: `firm-calls` Scope and VoIP Provider Strategy**

- **Problem:** Voice capabilities (call initiation, recording, transcription, ringless voicemail, call tracking numbers) require a defined adapter strategy before `firm-calls` can be built. Twilio dominates but Aircall and Vonage serve distinct agency verticals.
- **Options:**
  - **A — Twilio-first with abstract `VoIPPort`.** `adapters-voip-twilio` as the first implementation; `adapters-voip-aircall` and `adapters-voip-vonage` follow the same Port.
  - **B — Twilio-only.** Simpler, but locks the platform to a single provider for voice.
- **Default recommendation:** A — consistent with Port-and-adapter pattern across all 105 adapters.
- **Impact if delayed:** `firm-calls` cannot define its Port interface; no VoIP adapter can be scaffolded.

---

**ADR-015: `firm-forms-utils` Location**

- **Problem:** RHF + Zod integration utilities and multi-step form state machines are needed by both `firm-ui` (visual components) and `firm-forms` (Layer 6 conditional logic engine). A Layer 5 package could be consumed by both; placing it in `firm-ui` as a sub-export forces `firm-forms` to depend on the UI layer unnecessarily.
- **Options:**
  - **A — Standalone `firm-forms-utils` package (Layer 5).** Both `firm-ui` and `firm-forms` import from it. No circular dependency.
  - **B — `@firm/ui/forms-utils` sub-export.** `firm-forms` (L6) must import from L5 `firm-ui`. Technically valid (L6 may import L5), but semantically odd — a business logic package depending on a UI package for form state management.
- **Default recommendation:** A — standalone, to keep the dependency semantics clean and avoid coupling `firm-forms` to `firm-ui`.
- **Impact if delayed:** `firm-forms` (Phase 6) must re-implement RHF integration, producing a second divergent validator/state-machine pattern.

---

**ADR-016: `firm-motion` Animation Strategy**

- **Problem:** Token-backed animations (branded transitions, micro-interactions) are required by the portal, landing pages, and funnel UI. Two viable approaches exist with significant bundle size implications.
- **Options:**
  - **A — `framer-motion`.** Declarative, powerful, well-supported. ~40KB gzipped. Adds to every page's bundle.
  - **B — CSS-only keyframes with CSS custom properties.** Zero JS bundle cost. Uses `firm-tokens` duration/easing tokens as CSS variables. Less expressive for complex sequence animations.
- **Default recommendation:** B for Phase 6 launch; A as an opt-in enhancement for Tier D packages that require complex animation (portals, proposals). Evaluated per-package, not platform-wide.
- **Impact if delayed:** `firm-ui` components use hard-coded `transition` values not sourced from `firm-tokens`; white-label branding cannot control animation timing.

---

**ADR-017: `firm-chatbot` AI Runtime**

- **Problem:** The no-code chatbot builder can run conversations via two mechanisms: (a) pattern-matching FAQ engine (deterministic, auditable, cheap), or (b) LLM-driven intent recognition (flexible, expensive, non-deterministic). The choice determines the conversation runtime, cost model, and human-approval requirements.
- **Options:**
  - **A — FAQ pattern-matching engine first.** Deterministic, low cost, no AI governance overhead. LLM fallback as an opt-in upgrade.
  - **B — LLM-first.** Richer conversations but requires: `checkQuota()` on every turn, C2PA-adjacent content governance, human-approval for published conversation flows.
- **Default recommendation:** A with LLM upgrade path. All conversation output is still gated by human approval of the published flow regardless of runtime.
- **Impact if delayed:** `firm-chatbot` (Phase 6) cannot define its execution model or quota dimensions.

---

### N.4 Additions to Critique Part 2 — Resolved Decisions

The following items from UPDATE.md represent resolved decisions that must be appended to Critique Part 2 as numbered entries (continuing from Decision 25):

| # | Decision | Resolution |
|---|----------|------------|
| 26 | `firm-resilience` package status | **Retired.** Circuit-breaker, bulkhead, and timeout patterns are implemented within `firm-circuit-breaker` at Layer 1 as named policies. No separate Layer 4 `firm-resilience` package exists. |
| 27 | `firm-kpi` location in layer hierarchy | **Layer 6, Tier D** — not Layer 4. `firm-kpi` provides KPI definitions, `registerKpi()` IoC, and time-bucketed aggregation for `firm-reporting`. Low-level telemetry remains in `firm-observability` (Layer 4). |
| 28 | `firm-flags` scope boundary | **`firm-flags` retains only temporary, expiring rollout flags.** Permanent plan-based entitlements move to `firm-feature-gates` (Layer 6, Tier A). The `never` sentinel marker in `firm-flags` is retired. |
| 29 | `firm-worker-runtime` package status | **First-class Layer 6, Tier A package.** Not a utility module embedded in individual workers. All 13 workers must use `createWorker(options)` from `firm-worker-runtime`. No exceptions. |
| 30 | Quota enforcement hierarchy | **Three-tier aggregate enforcement is mandatory.** `checkQuota()` enforces sub-account individual limit AND agency aggregate limit simultaneously. Sub-account exhausting agency pool is rejected regardless of individual quota remaining. |
| 31 | Sub-account provisioning model | **Inherit-and-detach.** Agency defaults (branding, flags, quotas) are copied to sub-account at creation time, then detached. Linking is prohibited. |
| 32 | Event replay capability | **Required as part of `firm-bus` specification.** `outbox_events` retains completed events for 30 days. `replayEvents()` is a first-class `firm-bus` API. Replay is idempotency-safe. |
| 33 | `SAGA_COMPENSATION_FAILED` DLQ | **Distinct DLQ category required.** Compensation failures must not route to the primary failed-event DLQ. Separate alert routing, separate runbook. |
| 34 | `touchpoint.recorded` event | **Standard event required before any of `firm-funnels`, `firm-ads`, or `firm-social` is built.** Registered in `firm-events`. Used for multi-touch attribution in `firm-reporting`. |
| 35 | Social listening assignment | **`firm-reputation` owns social listening** via `social.mention.received` event consumed from `firm-social`. `firm-social` emits; `firm-reputation` processes. No duplicate monitoring logic. |

---

### N.5 Additions to Critique Part 8 — Governance & Developer Experience

#### N.5.1 Complete `firm-testing` Internal API

The following is the authoritative target API for `firm-testing` (`@firm/testing`), compiled from UPDATE.md. This must be captured in the Critique's governance section as the test infrastructure contract.

```
firm-testing/src/
  harnesses/
    createUnitHarness.ts          # PGLite + ioredis-mock; pool: 'forks' default
    createIntegrationHarness.ts   # real DB + Redis; tenant isolation fixtures
    createE2eHarness.ts           # Playwright page factory + auth helpers
    createServerComponentHarness.ts  # async RSC render path (React 19)
    createOutboxHarness.ts        # in-memory outbox; assert events emitted

  fixtures/
    createTenantIsolationFixture.ts  # sibling isolation + parent visibility
    createTenantFixture.ts           # Platform → Agency → Sub-Account hierarchy
    createUserFixture.ts             # user + session + RBAC
    createSessionFixture.ts          # frozen SessionContext builder
    createAdapterFixture.ts          # stubbed by Port mock (createPortMock<T>)
    mockRequestContext.ts            # AsyncLocalStorage stub
    mockFeatureFlags.ts              # flag evaluation override

  factories/
    createLeadFactory.ts             # satisfies firm-validators leadSchema
    createCampaignFactory.ts
    createTenantFactory.ts
    createAuditEntryFactory.ts
    createOutboxEventFactory.ts

  utils/
    withTheme.ts                     # wraps component in ThemeProvider
    expectNoA11yViolations.ts        # axe-core matcher (AccessLint)
    createTestLogger.ts              # in-memory log capture; log.assert()
    createVitestProject.ts           # Vitest 3.2+ composite build factory
    mockAdapters.ts                  # createPortMock<T extends Port>()

  index.ts                           # barrel; named sub-exports only
```

**Rules:**
- Zero production artifacts. `firm-testing` must appear only in `devDependencies`.
- `createUnitHarness()` always sets `pool: 'forks'` — never `threads` — for packages with singleton state (`firm-request-context`, `firm-observability`). This is not configurable.
- All fixture factories produce values that satisfy `firm-validators` schemas. Compile-time `satisfies` check required.
- `createTestLogger()` is the only permitted logger in tests. `console.log` in tests is banned by ESLint.

---

#### N.5.2 Complete `firm-ui` Sub-Export Structure

The following is the authoritative target sub-export map for `firm-ui`, compiled from UPDATE.md. Must be captured in Critique Part 8 before Phase 6 begins.

| Sub-export | `react-server` condition | Contents |
|------------|------------------------|---------|
| `@firm/ui/primitives` | Both (`react-server` + default) | Button, Input, Select, Badge, Avatar, Switch, Checkbox, Radio, Textarea, Label, Tooltip, Popover |
| `@firm/ui/composed` | Client only | Form, Modal, Drawer, Toast, Table, Tabs, Combobox, CommandPalette, DatePicker, FileUpload |
| `@firm/ui/layout` | Server-safe | Page, Sidebar, Topbar, Container, Grid, Stack, Divider, Spacer |
| `@firm/ui/dataviz` | Client only | Nivo chart wrappers; isolated chunk; own peer deps; `sideEffects: false` |
| `@firm/ui/marketing` | Server-safe | Hero, CTA, PricingCard, FeatureGrid, Testimonial, LogoCloud |
| `@firm/ui/icons` | Server-safe | Curated Lucide + custom SVGs; RSC-safe; `sideEffects: false` |

**CI gate:** No file in a `react-server`-marked export may contain `useState`, `useEffect`, `useContext`, or event handlers. ESLint rule in `firm-config-eslint` enforces this. Build fails on violation.

---

### N.6 Document Cross-Reference Map

The following table maps every major architectural concern to its definitive location across the three documents. Use this to find the authoritative source before writing new content.

| Concern | Blueprint | Critique | Assessment |
|---------|-----------|----------|-----------|
| Layer definitions and rules | §2 | — | — |
| Package interfaces and API contracts | §2 per layer | — | §A (status only) |
| CI gate specifications | §4 | — | §I (active/inactive) |
| Data flow diagrams | §5 | — | — |
| Glossary of architectural terms | §6.1 | — | §J (assessment-specific only) |
| Recurring patterns | §6.2 | — | — |
| AI agent onboarding | §7 | — | — |
| Correct decisions to preserve | — | Part 1 | §N.1 (pending Critique update) |
| Resolved decisions + contradictions | — | Part 2 | §N.4 (pending Critique update) |
| Security and data integrity findings | — | Part 3 | §N.2 (pending Critique update) |
| Phase 1 fix sequence | — | Part 3.2 | §B (reproduced for self-containment) |
| Compliance deadline calendar | — | Part 3.3 | §C (reproduced for self-containment) |
| Build and TypeScript architecture | — | Part 4 | — |
| Dependency governance | — | Part 5 | — |
| Repository structure (authoritative) | — | Part 6 | §H (checklist only) |
| Database migration architecture | — | Part 7 | — |
| Governance and developer experience | — | Part 8 | §N.5 (pending Critique update) |
| CI/CD pipeline | — | Part 9 | §I |
| Observability and monitoring | — | Part 10 | — |
| ADR backlog (detail) | — | Part 11 | §F (summary table) + §N.3 (new ADRs) |
| Package health inventory | — | — | §A |
| Phased implementation roadmap | — | — | §D |
| Worker inventory and contracts | — | — | §E |
| L6 gap register | — | — | §K |
| Master package count and quick reference | — | — | §L |
| Critique supplement (pending items) | — | — | §N |

*End of document.*