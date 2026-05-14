# TODO.md — Agency Platform Monorepo Build Plan

## Conventions

> **Path convention:** All package paths are flat: `packages/firm-*`. Grouping prefixes (`config/`, `core/`, `data/`, `security/`, `observability/`, `ui/`, `features/`, `adapters/`, `testing/`) aid discoverability but are not nested beyond one level. Workers: `workers/`. CI scripts: `scripts/ci/`. Generators: `tools/generators/`.
>
> **Subtask tags:** `[AGENT]` = AI-executable. `[HUMAN]` = requires human judgment/credentials.
>
> **Gates:** CI gates are registered as stubs in PH1.35 and activated in the final task of each phase.

---

## Phase 1: Foundation Hardening

*Stabilise all existing packages, create missing L0 configs, establish governance artifacts, perform structural extractions, and wire CI verification. No new business-logic package may start until Phase 1 acceptance criteria are met.*

---

### PH1.1 – Repository governance artifacts
- [ ] **PH1.1** | Status: Not Started

**Related files:** `SECURITY.md`, `CONTRIBUTING.md`, `.github/ISSUE_TEMPLATE/`, `.github/PULL_REQUEST_TEMPLATE.md`

**Definition of Done:**
- `SECURITY.md`: vulnerability disclosure process, security contact, response SLA.
- `CONTRIBUTING.md`: PR process, branch naming, test requirements, ADR proposal process.
- `.github/ISSUE_TEMPLATE/`: `bug_report.md`, `feature_request.md`, `adr_proposal.md`, `security_vulnerability.md`.
- `.github/PULL_REQUEST_TEMPLATE.md`: checklist — tests added, coverage ≥80%, ADR if breaking.

**Out of Scope:** Actual ADR records (see PH1.2). **Rules:** Standard GitHub community health file conventions. **Anti-Patterns:** No placeholder content; all text must be review-ready. **DDD/TDD/BDD/Deep Module:** N/A

#### Subtasks
- [x] **PH1.1.1** [HUMAN] Draft and commit `SECURITY.md`.
- [x] **PH1.1.2** [HUMAN] Draft and commit `CONTRIBUTING.md`.
- [ ] **PH1.1.3** [AGENT] Create issue templates: `bug_report.md`, `feature_request.md`, `adr_proposal.md`, `security_vulnerability.md` under `.github/ISSUE_TEMPLATE/`.
- [ ] **PH1.1.4** [AGENT] Create `.github/PULL_REQUEST_TEMPLATE.md`.

---

### PH1.2 – ADR infrastructure and blocking ADRs
- [ ] **PH1.2** | Status: Not Started

**Related files:** `docs/adr/0000-template.md`, `docs/adr/index.md`, `docs/adr/0001–0009`

**Definition of Done:**
- `docs/adr/` with MADR template and index (status column).
- Nine blocking ADRs written, reviewed, committed — each with status `proposed` → `accepted` and a linked CI enforcement: ADR-001 `firm-bus` engine, ADR-002 `firm-search` engine, ADR-003 `firm-types` shared kernel boundary, ADR-004 `firm-db` read-model home, ADR-005 application grouping, ADR-006 client site generation model, ADR-007 `firm-workflow` condition model, ADR-008 template engine choice (Liquid email/SMS; Handlebars PDF), ADR-009 `firm-ai` split boundary.

**Out of Scope:** ADRs not blocking Phase 2. **Rules:** No ADR approved without a linked implementation/enforcement path. **Anti-Patterns:** No approved ADR without an implementation path. **DDD/TDD/BDD/Deep Module:** N/A

#### Subtasks
- [ ] **PH1.2.1** [AGENT] Create `docs/adr/` directory, `0000-template.md` (MADR format), and `index.md`.
- [ ] **PH1.2.2** [HUMAN] Write ADR-001: `firm-bus` engine. File: `docs/adr/0001-firm-bus-engine.md`.
- [ ] **PH1.2.3** [HUMAN] Write ADR-002: `firm-search` engine. File: `docs/adr/0002-firm-search-engine.md`.
- [ ] **PH1.2.4** [HUMAN] Write ADR-003: `firm-types` shared kernel boundary. File: `docs/adr/0003-shared-kernel-boundary.md`.
- [ ] **PH1.2.5** [HUMAN] Write ADR-004: `firm-db` read-model home. File: `docs/adr/0004-db-read-model-home.md`.
- [ ] **PH1.2.6** [HUMAN] Write ADR-005: application grouping (22 apps vs. 3–5 grouped). File: `docs/adr/0005-application-grouping.md`.
- [ ] **PH1.2.7** [HUMAN] Write ADR-006: client site generation model (ephemeral vs. committed). File: `docs/adr/0006-client-site-generation.md`.
- [ ] **PH1.2.8** [HUMAN] Write ADR-007: `firm-workflow` condition model. File: `docs/adr/0007-workflow-condition-model.md`.
- [ ] **PH1.2.9** [HUMAN] Write ADR-008: template engine choice. File: `docs/adr/0008-template-engine-choice.md`.
- [ ] **PH1.2.10** [HUMAN] Write ADR-009: `firm-ai` split boundary. File: `docs/adr/0009-firm-ai-split.md`.

---

### PH1.3 – SLO definitions and runbook skeletons
- [ ] **PH1.3** | Status: Not Started

**Related files:** `docs/slos/`, `docs/runbooks/`

**Definition of Done:**
- `docs/slos/`: 6 SLO definitions — `api-p95-latency.md`, `outbox-lag.md`, `auth-success-rate.md`, `rls-health.md`, `cross-tenant-queries.md`, `ai-approval-rate.md`.
- `docs/runbooks/`: one file per SLO alert plus critical alerts: `redis-down.md`, `outbox-worker-crash.md`, `pgbouncer-eviction.md`.

**Out of Scope:** Grafana dashboards and Prometheus alert rules (Phase 8). **Rules:** Every SLO must have a corresponding runbook before any alert is configured. **Anti-Patterns:** No SLO without a measurement window and error budget. **DDD/TDD/BDD/Deep Module:** N/A

#### Subtasks
- [ ] **PH1.3.1** [HUMAN] Write all 6 SLO definitions in `docs/slos/`.
- [ ] **PH1.3.2** [HUMAN] Write runbook skeletons for each SLO and the 3 critical alert runbooks in `docs/runbooks/`.

---

### PH1.4 – Rename `services/` → `workers/`
- [ ] **PH1.4** | Status: Not Started

**Related files:** `services/` (all references), `packages/firm-config-eslint/src/presets/boundaries.ts`

**Definition of Done:**
- `services/` renamed to `workers/` via `git mv`; all imports, CI scripts, Dockerfiles, and docs updated.
- `workers` boundary type added to ESLint config (enforced by PH1.6.4).
- CI grep confirms zero remaining `services/` references.

**Out of Scope:** New worker implementations. **Rules:** Global search-and-replace; verify with recursive grep. **Anti-Patterns:** Do not leave both directories. **DDD/TDD/BDD/Deep Module:** N/A

#### Subtasks
- [ ] **PH1.4.1** [AGENT] Rename via `git mv services/ workers/`.
- [ ] **PH1.4.2** [AGENT] Replace all `"services/"` references in `package.json` files, `tsconfig` paths, CI scripts, and docs with `"workers/"`.
- [ ] **PH1.4.3** [AGENT] Add CI grep step that fails if any `services/` reference remains. File: `.github/workflows/ci.yml`.

---

### PH1.5 – Create missing Layer 0 config packages (8 new)
- [ ] **PH1.5** | Status: Not Started

**Related files:** `packages/firm-config-prettier`, `packages/firm-config-vitest`, `packages/firm-config-playwright`, `packages/firm-config-commitlint`, `packages/firm-config-docker`, `packages/firm-config-storybook`, `packages/firm-config-security-headers`, `packages/firm-config-k6`

**Definition of Done:**
- All 8 L0 config packages exist, export their factory functions, are consumed by all applicable packages, and each has a snapshot or unit test. No package has runtime code.

**Out of Scope:** Updating existing L0 configs (see PH1.6). **Rules:** L0 only — no imports from L1–L7; factory functions accept options and merge with opinionated defaults. **Anti-Patterns:** No credentials in config defaults; use env variable references. **DDD:** N/A | **TDD:** Snapshot or unit test per package | **BDD:** N/A | **Deep Module:** Each config package hides tooling complexity behind one factory call.

#### Subtasks
- [ ] **PH1.5.1** [AGENT] Scaffold `packages/firm-config-prettier/`: frozen Prettier config export, snapshot test, wire into root and all workspace `package.json`. File: `packages/firm-config-prettier/src/index.ts`.
- [ ] **PH1.5.2** [AGENT] Scaffold `packages/firm-config-vitest/`: `createVitestConfig(options)` — Node/browser modes, coverage ≥80% thresholds, unit test, wire into all existing packages. File: `packages/firm-config-vitest/src/index.ts`.
- [ ] **PH1.5.3** [AGENT] Scaffold `packages/firm-config-playwright/`: `createPlaywrightConfig(options)` — default browsers, base URLs, auth state, snapshot test. File: `packages/firm-config-playwright/src/index.ts`.
- [ ] **PH1.5.4** [AGENT] Scaffold `packages/firm-config-commitlint/`: conventional commit config export, snapshot test, point root `commitlint.config.js` here. File: `packages/firm-config-commitlint/src/index.ts`.
- [ ] **PH1.5.5** [AGENT] Scaffold `packages/firm-config-docker/`: `createDockerfile(options)` — hardened multi-stage Node.js Dockerfile (non-root UID 10000, `tini` PID 1, `HEALTHCHECK`), tests verifying required instructions. File: `packages/firm-config-docker/src/index.ts`.
- [ ] **PH1.5.6** [AGENT] Scaffold `packages/firm-config-storybook/`: `createStorybookConfig(options)` — Vite builder, theme injection, snapshot test. File: `packages/firm-config-storybook/src/index.ts`.
- [ ] **PH1.5.7** [AGENT] Scaffold `packages/firm-config-security-headers/`: `createSecurityHeaders(options)` — CSP/HSTS/Permissions-Policy, decoupled from Next.js, no `unsafe-inline` or `unsafe-eval` in default CSP, tests. File: `packages/firm-config-security-headers/src/index.ts`.
- [ ] **PH1.5.8** [AGENT] Scaffold `packages/firm-config-k6/`: `createK6Config(options)` — base URLs, auth fixtures, ramp-up profiles, unit test, documented env vars. File: `packages/firm-config-k6/src/index.ts`.

---

### PH1.6 – Update existing Layer 0 config packages (4 existing)
- [ ] **PH1.6** | Status: Not Started

**Related files:** `packages/firm-config-typescript`, `packages/firm-config-tailwind`, `packages/firm-config-next`, `packages/firm-config-eslint`

**Definition of Done:**
- `firm-config-typescript`: adds `worker` variant (no browser API types).
- `firm-config-tailwind`: adds `v4/` export for Tailwind v4 CSS-first configuration.
- `firm-config-next`: sets `serverExternalPackages: ['pino', 'drizzle-orm', 'postgres']`.
- `firm-config-eslint`: adds rules `no-direct-fetch`, `no-direct-read-model-write`, `no-runtime-tokens-import`; registers `workers` boundary type.
- Existing CI continues to pass; no breaking changes.

**Out of Scope:** New config packages (PH1.5). **Rules:** Extend factory functions; do not remove existing rules without an ADR. **Anti-Patterns:** No rule removal without documentation. **DDD:** N/A | **TDD:** Update existing tests to cover new variants | **BDD:** N/A | **Deep Module:** N/A

#### Subtasks
- [ ] **PH1.6.1** [AGENT] Add `worker` tsconfig variant. File: `packages/firm-config-typescript/src/worker.ts`.
- [ ] **PH1.6.2** [AGENT] Add `v4/` export. File: `packages/firm-config-tailwind/src/v4.ts`.
- [ ] **PH1.6.3** [AGENT] Add `serverExternalPackages`. File: `packages/firm-config-next/src/index.ts`.
- [ ] **PH1.6.4** [AGENT] Add 3 ESLint rules and `workers` boundary type. File: `packages/firm-config-eslint/src/presets/boundaries.ts`.

---

### PH1.7 – Extract `firm-primitives` from `firm-types`
- [ ] **PH1.7** | Status: Not Started

**Related files:** `packages/firm-primitives/`, `packages/firm-types/src/index.ts`

**Definition of Done:**
- `packages/firm-primitives/` (L0): branded IDs (`TenantId`, `AgencyId`, `SubAccountId`, `PlatformId`, `SessionId`, `UserId`), gatekeeper functions (`asTenantId`, `asAgencyId`, etc.), and pure helper types only.
- `firm-types` re-exports from `@firm/primitives`; all existing consumers updated.
- Domain-level IDs (`LeadId`, `CampaignId`, etc.) remain in `firm-types`.
- All gatekeeper functions have unit tests.

**Out of Scope:** New branded IDs. **Rules:** L0 — zero domain knowledge; no runtime code beyond gatekeepers. **Anti-Patterns:** No domain IDs in `firm-primitives`. **DDD:** Primitives are technical building blocks | **TDD:** `asTenantId(uuid)` validates UUID format and returns branded type; raw string rejected at compile time | **BDD:** N/A | **Deep Module:** N/A

#### Subtasks
- [ ] **PH1.7.1** [AGENT] Scaffold `packages/firm-primitives/package.json` and `tsconfig.json`.
- [ ] **PH1.7.2** [AGENT] Move branded IDs and gatekeeper functions from `packages/firm-types/src/branded.ts` → `packages/firm-primitives/src/ids.ts`.
- [ ] **PH1.7.3** [AGENT] Update `packages/firm-types/src/index.ts` to re-export from `@firm/primitives`.
- [ ] **PH1.7.4** [AGENT] Update all monorepo imports of branded IDs to `@firm/primitives` where only those types are needed.
- [ ] **PH1.7.5** [AGENT] Write unit tests for all gatekeeper functions. File: `packages/firm-primitives/tests/ids.test.ts`.

---

### PH1.8 – Fix `firm-request-context` design flaw ⚠️ CRITICAL
- [ ] **PH1.8** | Status: Not Started | ⚠️ **CRITICAL — unblocks everything above L1**

**Related files:** `packages/firm-request-context/src/types.ts`, `packages/firm-request-context/src/store.ts`, `packages/firm-request-context/src/middleware.ts`, `packages/firm-request-context/src/with-context.ts`

**Definition of Done:**
- `[key: string]: any` removed from `RequestContext`; extension uses TypeScript module augmentation (`.d.ts` only).
- `withRequestContext(fn)` wrapper for Inngest/BullMQ job handlers — restores `tenantId` and `traceId`.
- `extendContext(additions)` typed race-safe merge helper.
- Tests: nested async, concurrent contexts, `Promise.all`, `setImmediate`, job handler wrapper. Coverage ≥80%.

**Out of Scope:** Changing runtime propagation mechanism. **Rules:** Context propagation via `AsyncLocalStorage` only; no secondary context store anywhere. **Anti-Patterns:** No index signature defeating type safety; no second `AsyncLocalStorage` instance in any consumer. **DDD:** Request context is a technical cross-cutting service | **TDD:** Write concurrent isolation test first — `tenantId` set in one async context must not bleed into a parallel context | **BDD:** A typo in a context key causes a compile-time error, not silent `undefined` | **Deep Module:** `AsyncLocalStorage` fully encapsulated; no consumer interacts with it directly.

#### Subtasks
- [ ] **PH1.8.1** [AGENT] Remove `[key: string]: any` from `RequestContext`. File: `packages/firm-request-context/src/types.ts`.
- [ ] **PH1.8.2** [AGENT] Document module augmentation extension pattern in `packages/firm-request-context/README.md`.
- [ ] **PH1.8.3** [AGENT] Implement `withRequestContext(fn)` wrapper. File: `packages/firm-request-context/src/with-context.ts`.
- [ ] **PH1.8.4** [AGENT] Implement `extendContext(additions)` race-safe merge helper. File: `packages/firm-request-context/src/store.ts`.
- [ ] **PH1.8.5** [AGENT] Write tests: concurrent isolation, nested async, `Promise.all`, `setImmediate`, job handler. File: `packages/firm-request-context/tests/`.

---

### PH1.9 – Fix `firm-logger` splitbrain context bug
- [ ] **PH1.9** | Status: Not Started | **Depends on PH1.8**

**Related files:** `packages/firm-logger/src/context.ts`, `packages/firm-logger/src/logger.ts`, `packages/firm-logger/src/redact.ts`, `packages/firm-logger/src/test-logger.ts`

**Definition of Done:**
- `ContextManager` removes its own `currentContext`; reads exclusively via `firm-request-context.getUnifiedContext()`.
- `logger.child(bindings)` via Pino's native child logger.
- Configurable `sampleRate`; errors and warnings never sampled out.
- `createTestLogger()` returns in-memory log array.
- Concurrent test: two parallel requests with different `tenantId` values produce correctly-tagged logs.

**Out of Scope:** PII redaction changes. **Rules:** All context reads through `getUnifiedContext()`; no secondary store; `console.log` banned. **Anti-Patterns:** No secondary context store diverging under concurrency. **DDD:** Logging is a technical service | **TDD:** Write concurrent tenantId test first | **BDD:** `logger.child({ requestId })` includes `requestId` in every subsequent log line | **Deep Module:** Abstracts Pino behind context-aware, PII-safe, concurrency-safe API.

#### Subtasks
- [ ] **PH1.9.1** [AGENT] Remove `currentContext` from `ContextManager`; delegate to `firm-request-context`. File: `packages/firm-logger/src/context.ts`.
- [ ] **PH1.9.2** [AGENT] Implement `logger.child(bindings)` using Pino child logger. File: `packages/firm-logger/src/logger.ts`.
- [ ] **PH1.9.3** [AGENT] Add `sampleRate` option; guarantee errors/warnings never sampled out. Same file.
- [ ] **PH1.9.4** [AGENT] Implement `createTestLogger()`. File: `packages/firm-logger/src/test-logger.ts`.
- [ ] **PH1.9.5** [AGENT] Write concurrent async test plus tests for child loggers, sampling, and test logger. File: `packages/firm-logger/tests/`.

---

### PH1.10 – Fix `firm-cache` TTL bug and add missing capabilities
- [ ] **PH1.10** | Status: Not Started | Fix 1

**Related files:** `packages/firm-cache/src/client.ts`, `packages/firm-cache/src/key-factory.ts`, `packages/firm-cache/src/ttl-policies.ts`

**Definition of Done:**
- `TenantCache.set` validates `ttlSeconds` is a positive number; throws `ValidationError` (`@firm/errors`) if not.
- `acquireLock(key, ttlMs)` via Redis `SET key value NX PX ttlMs`.
- `warmCache(keys)` pre-populates high-traffic keys at startup.
- Prometheus counters `firm.cache.hit` / `firm.cache.miss` tagged with hashed `tenantId`, `keyPrefix`, `layer`.
- Tests: TTL validation, lock acquire, lock rejection, cache warming.

**Out of Scope:** Connection pool management. **Rules:** Use `@firm/errors` for all thrown errors; all cache keys through `CacheKeyFactory(tenantId)`. **Anti-Patterns:** Do not accept `{ ttl }` object — plain number only; no raw Redis key strings outside `CacheKeyFactory`. **DDD:** Cache is technical infrastructure | **TDD:** Write tests first — TTL rejects non-number, lock acquired when key absent, lock rejected when present, warming populates expected keys | **BDD:** `set` with non-numeric TTL throws `ValidationError` before any Redis call | **Deep Module:** `TenantCache` abstracts key scoping, TTL policy, and lock mechanics.

#### Subtasks
- [ ] **PH1.10.1** [AGENT] Add `ValidationError` guard in `TenantCache.set`. File: `packages/firm-cache/src/client.ts`.
- [ ] **PH1.10.2** [AGENT] Implement `acquireLock(key, ttlMs)` via `SET NX PX`. File: `packages/firm-cache/src/lock.ts`.
- [ ] **PH1.10.3** [AGENT] Implement `warmCache(keys)`. File: `packages/firm-cache/src/warm.ts`.
- [ ] **PH1.10.4** [AGENT] Add Prometheus counters `firm.cache.hit` / `firm.cache.miss`. File: `packages/firm-cache/src/client.ts`.
- [ ] **PH1.10.5** [AGENT] Write unit tests for all four capabilities. File: `packages/firm-cache/tests/`.

---

### PH1.11 – Fix `firm-security` import bug (pre-extraction)
- [ ] **PH1.11** | Status: Not Started | Fix 2a

**Related files:** `packages/firm-security/src/rate-limit.ts`, `packages/firm-security/tests/rate-limit.test.ts`

**Definition of Done:**
- Rate limiter import corrected from `CacheClient` → `TenantCache`.
- `set()` call passes a numeric TTL (not an object).
- Unit test: `RateLimiter` instantiates and `consume()` calls cache correctly.
- Package compiles with zero type errors.

**Out of Scope:** Extracting the rate limiter (PH1.17); this is the import fix only. **Rules:** Temporary fix only; no new rate-limiter features here. **Anti-Patterns:** Do not leave rate-limiter permanently in `firm-security`. **DDD:** Rate limiting is a security domain service | **TDD:** `RateLimiter` constructs without error; `consume` calls `TenantCache.set` with numeric TTL | **BDD:** N/A | **Deep Module:** N/A (temp fix)

#### Subtasks
- [ ] **PH1.11.1** [AGENT] Replace `{ CacheClient }` import with `{ TenantCache }`. File: `packages/firm-security/src/rate-limit.ts`.
- [ ] **PH1.11.2** [AGENT] Update `set()` call to pass numeric TTL. Same file.
- [ ] **PH1.11.3** [AGENT] Write unit test with mocked `TenantCache`. File: `packages/firm-security/tests/rate-limit.test.ts`.

---

### PH1.12 – Fix `firm-auth` types and remove deprecated impersonation
- [ ] **PH1.12** | Status: Not Started | Fix 3

**Related files:** `packages/firm-auth/src/session/types.ts`, `packages/firm-auth/src/impersonate.ts`, `packages/firm-auth/src/audit.ts`, `packages/firm-auth/src/guard.ts`

**Definition of Done:**
- `SessionContext.role` typed as `Role` union (not `string`).
- `startImpersonationLegacy` removed; all internal call sites updated.
- Audit log fallback replaced: `console.log` → structured logger (`@firm/logger`).
- `context?` parameter reserved on `requirePermission` for future ABAC (JSDoc note).
- `credentialId` and `credentialType` fields reserved in session schema for passkey/TOTP.
- Tests verify removed export and new type constraints.

**Out of Scope:** New RBAC features. **Rules:** Keep existing public API stable; `console.log` banned. **Anti-Patterns:** No silent audit fallback. **DDD:** `SessionContext` is a value object in auth bounded context | **TDD:** Invalid string to `role` is compile-time error; `startImpersonationLegacy` absent from module exports | **BDD:** Calling the removed function results in a build error, not a runtime failure | **Deep Module:** `firm-auth` wraps Better Auth behind a platform-specific strictly-typed session model.

#### Subtasks
- [ ] **PH1.12.1** [AGENT] Change `session.role` type to `Role` union. File: `packages/firm-auth/src/session/types.ts`.
- [ ] **PH1.12.2** [AGENT] Remove `startImpersonationLegacy` and update all internal references. File: `packages/firm-auth/src/impersonate.ts`.
- [ ] **PH1.12.3** [AGENT] Replace `console.log` fallback with structured logger. File: `packages/firm-auth/src/audit.ts`.
- [ ] **PH1.12.4** [AGENT] Add `context?` reservation to `requirePermission` with JSDoc note. File: `packages/firm-auth/src/guard.ts`.
- [ ] **PH1.12.5** [AGENT] Add `credentialId` and `credentialType` field reservations to session schema. File: `packages/firm-auth/src/session/types.ts`.
- [ ] **PH1.12.6** [AGENT] Update tests for removed export and new type constraints. File: `packages/firm-auth/tests/`.

---

### PH1.13 – Fix `firm-validators` imports, migrations, and add factory functions
- [ ] **PH1.13** | Status: Not Started | Fix 4

**Related files:** `packages/firm-validators/src/`, `packages/firm-validators/tests/`

**Definition of Done:**
- `campaign.ts` missing imports (`uuidField`, etc.) fixed; zero compile errors.
- Lead v1→v2 and v2→v1 migrations reference only existing schema fields.
- Factory functions: `createPaginationSchema(base)`, `createTenantScopedSchema(base)`, `createVersionedSchema(schema, version)`, `createIdempotencySchema(base)`, `createWebhookPayloadSchema(base)`, `createAuditableSchema(base)`.
- `satisfies` CI conformance gate: every Zod schema satisfies its `firm-types` interface.
- Comprehensive unit tests covering all entities and factories.

**Out of Scope:** New entity schemas (added when feature packages are built). **Rules:** Drizzle table is the single structural source of truth — no hand-written structural Zod schemas; validators add `.refine()` rules only. **Anti-Patterns:** No schemas referencing non-existent fields; no hand-written structural Zod when a Drizzle table exists. **DDD:** Validators are a supporting domain service | **TDD:** Each factory rejects invalid and accepts valid data | **BDD:** A tenant-scoped schema requires `tenantId` and rejects payloads without it | **Deep Module:** Factory functions encapsulate cross-cutting validation behind a composable API.

#### Subtasks
- [ ] **PH1.13.1** [AGENT] Fix missing imports in `campaign.ts`. File: `packages/firm-validators/src/campaign.ts`.
- [ ] **PH1.13.2** [AGENT] Rewrite lead v1→v2 and v2→v1 migrations using only existing schema fields. Files: `packages/firm-validators/src/v1.ts`, `v2.ts`.
- [ ] **PH1.13.3** [AGENT] Implement `createPaginationSchema(base)`. File: `packages/firm-validators/src/factories/pagination.ts`.
- [ ] **PH1.13.4** [AGENT] Implement `createTenantScopedSchema(base)`. File: `packages/firm-validators/src/factories/tenant-scoped.ts`.
- [ ] **PH1.13.5** [AGENT] Implement `createVersionedSchema(schema, version)`. File: `packages/firm-validators/src/factories/versioned.ts`.
- [ ] **PH1.13.6** [AGENT] Implement `createIdempotencySchema`, `createWebhookPayloadSchema`, `createAuditableSchema`. File: `packages/firm-validators/src/factories/`.
- [ ] **PH1.13.7** [AGENT] Add `satisfies` conformance gate in CI — each schema satisfies its `firm-types` interface. File: `packages/firm-validators/src/conformance.ts`.
- [ ] **PH1.13.8** [AGENT] Write comprehensive unit tests. File: `packages/firm-validators/tests/`.

---

### PH1.14 – Fix `firm-db` pre-split cleanup
- [ ] **PH1.14** | Status: Not Started | Fix 5

**Related files:** `packages/firm-db/src/outbox.ts`, `packages/firm-db/src/`

**Definition of Done:**
- Outbox import moved to top of file.
- `softDelete` parameter typed as `PgTable` (not `any`).
- All `.enableRLS()` calls replaced with `pgTable.withRLS(...)`.
- Migration test verifies `.withRLS()` enables RLS on a test table.

**Out of Scope:** The `firm-db` split (PH1.15); this is pre-split cleanup only. **Rules:** No functional changes; `any` type banned by `firm-config-typescript`. **Anti-Patterns:** No `any` in exported functions. **DDD:** Database access is infrastructure | **TDD:** Migration test creates table with `.withRLS()` and asserts RLS enabled | **BDD:** N/A | **Deep Module:** N/A

#### Subtasks
- [ ] **PH1.14.1** [AGENT] Move outbox import to top of file. File: `packages/firm-db/src/outbox.ts`.
- [ ] **PH1.14.2** [AGENT] Change `softDelete` parameter type from `any` → `PgTable`. File: `packages/firm-db/src/` (soft-delete helper).
- [ ] **PH1.14.3** [AGENT] Replace all `.enableRLS()` with `.withRLS(...)` across all schema files. Files: `packages/firm-db/src/`.
- [ ] **PH1.14.4** [AGENT] Add migration test asserting RLS is enabled. File: `packages/firm-db/tests/rls-migration.test.ts`.

---

### PH1.15 – Split `firm-db` → `firm-db-schema` + `firm-db-client`
- [ ] **PH1.15** | Status: Not Started | Fix 14 | **Depends on PH1.14**

**Related files:** `packages/firm-db/`, `packages/firm-db-schema/`, `packages/firm-db-client/`

**Definition of Done:**
- `firm-db-schema` (`packages/firm-db-schema/`): Drizzle table definitions, RLS policy generators, migration source of truth, drizzle-zod bridge exports (`createInsertSchema`, `createSelectSchema`). Zero runtime connection deps — importable in tests without a database.
- `firm-db-client` (`packages/firm-db-client/`): connection factories (serverless, pooled, direct), `withTenantContext` (PgBouncer-safe `DISCARD ALL` on release), `withTransaction`, `writeToOutbox`, `paginateCursor`, `softDelete`, `batchQuery`, `withOptimisticLock`.
- All existing consumers updated. Original `firm-db` becomes a re-export barrel or is removed.
- Integration test: migrations from `firm-db-schema` executed via `firm-db-client`, results queried.

**Out of Scope:** CQRS read model (PH1.16). **Rules:** No package imports `firm-db-client` unless it needs a live DB connection. **Anti-Patterns:** `firm-db-schema` must not import `postgres`, `ioredis`, or any connection library. **DDD:** Schema (contract) split from client (runtime) | **TDD:** Integration test proves migrations + queries work across the split | **BDD:** N/A | **Deep Module:** Feature packages depend only on lightweight schema, reducing build times and improving test isolation.

#### Subtasks
- [ ] **PH1.15.1** [AGENT] Scaffold `packages/firm-db-schema/`; move all Drizzle schema files, RLS generators, and migration files; remove runtime connection deps.
- [ ] **PH1.15.2** [AGENT] Implement drizzle-zod bridge: export `createInsertSchema(table)` and `createSelectSchema(table)`. File: `packages/firm-db-schema/src/bridge.ts`.
- [ ] **PH1.15.3** [AGENT] Scaffold `packages/firm-db-client/`; move connection factories, `withTenantContext`, `withTransaction`, `writeToOutbox`, pagination helpers, `softDelete`, `batchQuery`, `withOptimisticLock`.
- [ ] **PH1.15.4** [AGENT] Implement PgBouncer-safe `DISCARD ALL` wrapper in `withTenantContext`. File: `packages/firm-db-client/src/tenant-context.ts`.
- [ ] **PH1.15.5** [AGENT] Update `firm-db-client` to import schema types from `@firm/db-schema`.
- [ ] **PH1.15.6** [AGENT] Update all monorepo imports to `@firm/db-schema` or `@firm/db-client` as appropriate.
- [ ] **PH1.15.7** [AGENT] Write integration test. File: `packages/firm-db-client/tests/split-integration.test.ts`.

---

### PH1.16 – Create `firm-db-read` (CQRS read model)
- [ ] **PH1.16** | Status: Not Started | **Blocked by ADR-004 (PH1.2.5)**

**Related files:** `packages/firm-db-read/` (Option A) or `packages/firm-db-schema/src/schemas/reporting/` (Option B)

**Definition of Done:**
- Denormalised read schema for `firm-reporting` with a dedicated read-only connection pool.
- ESLint rule `no-direct-read-model-write` (PH1.6.4) verified: only outbox event handlers may write to this schema.
- ADR-004 decision documented and implemented.

**Out of Scope:** Populating the read model with data (requires `firm-bus` and `firm-reporting`). **Rules:** Option A → standalone package; Option B → subdirectory of `firm-db-schema` per ADR. **Anti-Patterns:** No direct writes from feature packages to the read model. **DDD:** Read model is a separate projection of domain events | **TDD:** Read schema created and queried via dedicated pool | **BDD:** N/A | **Deep Module:** N/A

#### Subtasks
- [ ] **PH1.16.1** [HUMAN] Finalise ADR-004 and confirm Option A or B. File: `docs/adr/0004-db-read-model-home.md`.
- [ ] **PH1.16.2** [AGENT] Create `firm-db-read` package or subdirectory per ADR decision, with denormalised table definitions.
- [ ] **PH1.16.3** [AGENT] Implement dedicated read-only connection pool. File: `packages/firm-db-client/src/read-pool.ts`.
- [ ] **PH1.16.4** [AGENT] Verify `no-direct-read-model-write` ESLint rule fires on a direct-write test fixture. File: `packages/firm-config-eslint/tests/fixtures/`.

---

### PH1.17 – Extract `firm-rate-limiter` from `firm-security`
- [ ] **PH1.17** | Status: Not Started | Fix 2b | **Depends on PH1.11**

**Related files:** `packages/firm-rate-limiter/`, `packages/firm-security/src/`

**Definition of Done:**
- `packages/firm-rate-limiter/`: Redis sliding window, token bucket, named policy registry, plan-tier-aware limits, graduated response (warn 80%, throttle 90%, block 100%), `setEmergencyOverride(policyName, limits, ttl)`, `registerAdaptivePolicy(name, triggerFn)`, dry-run mode, fail-open behaviour.
- `firm-security` no longer contains rate-limiting code.
- Full test suite covers all modes.

**Out of Scope:** New rate-limiting policies beyond current named set. **Rules:** Depends on `@firm/cache` and `@firm/env`; no circular deps. **Anti-Patterns:** No rate-limiter code left in `firm-security` after extraction; no inline rate limit values — must reference policy registry (build failure otherwise). **DDD:** Rate limiting is a security domain service | **TDD:** Sliding window with Redis mock, token bucket, dry-run (records but never blocks), fail-open (Redis down → request allowed + CRITICAL log) | **BDD:** When Redis is unreachable, rate limiter allows the request and logs CRITICAL — it never throws | **Deep Module:** Encapsulates complex algorithms behind `consume(policyName, tenantId, tokens)`.

#### Subtasks
- [ ] **PH1.17.1** [AGENT] Scaffold `packages/firm-rate-limiter/package.json` and `tsconfig.json`.
- [ ] **PH1.17.2** [AGENT] Move all rate-limiting logic from `firm-security`; implement sliding window and token bucket. File: `packages/firm-rate-limiter/src/limiter.ts`.
- [ ] **PH1.17.3** [AGENT] Implement graduated response mode (warn/throttle/block thresholds). File: `packages/firm-rate-limiter/src/policies.ts`.
- [ ] **PH1.17.4** [AGENT] Implement `setEmergencyOverride` and `registerAdaptivePolicy`. File: `packages/firm-rate-limiter/src/index.ts`.
- [ ] **PH1.17.5** [AGENT] Implement dry-run mode. File: `packages/firm-rate-limiter/src/dry-run.ts`.
- [ ] **PH1.17.6** [AGENT] Implement fail-open (Redis unreachable → CRITICAL log + allow). File: `packages/firm-rate-limiter/src/fail-open.ts`.
- [ ] **PH1.17.7** [AGENT] Write full test suite. File: `packages/firm-rate-limiter/tests/`.
- [ ] **PH1.17.8** [AGENT] Remove rate-limiting code from `firm-security`. File: `packages/firm-security/src/`.

---

### PH1.18 – Fix `firm-observability` and add missing helpers
- [ ] **PH1.18** | Status: Not Started | Fix 7

**Related files:** `packages/firm-observability/src/logger.ts`, `packages/firm-observability/src/initialize.ts`, `packages/firm-observability/src/context.ts`, `packages/firm-observability/src/error-tracking.ts`, `packages/firm-observability/src/middleware.ts`

**Definition of Done:**
- Deprecated `logger.ts` re-export resolved (removed or undeprecated with clear reasoning).
- `resetForTesting()` bypasses double-init guard in tests.
- `withTenantSpan(name, fn)`: auto-attaches `tenant.id`, `user.id`, `correlation.id` from request context.
- `captureError(error, context)`: enriches Sentry events with tenant context.
- `createTenantMeter(tenantId)`: Prometheus metrics pre-labeled with hashed tenant ID.
- Dual-level PII redaction (field-path stripping + regex scanner) verified wired correctly.
- Integration tests cover all new functions.

**Out of Scope:** RUM browser/Node bundling conflict (provisional sub-export stays as `@firm/observability/rum`). **Rules:** All spans from `withTenantSpan` must auto-attach tenant, user, and correlation attributes from `getUnifiedContext()`. **Anti-Patterns:** No forcing developers to manually add tenant attributes to every span. **DDD:** Observability is a cross-cutting concern | **TDD:** `withTenantSpan` attaches expected attributes; `resetForTesting` allows re-init; double-init without reset throws | **BDD:** Calling `initializeObservability` twice without `resetForTesting` throws a descriptive error | **Deep Module:** Hides all OTel SDK complexity behind five simple functions.

#### Subtasks
- [ ] **PH1.18.1** [AGENT] Remove or undeprecate the `logger.ts` re-export with clear comment. File: `packages/firm-observability/src/logger.ts`.
- [ ] **PH1.18.2** [AGENT] Implement `resetForTesting()`. File: `packages/firm-observability/src/initialize.ts`.
- [ ] **PH1.18.3** [AGENT] Implement `withTenantSpan(name, fn)`. File: `packages/firm-observability/src/context.ts`.
- [ ] **PH1.18.4** [AGENT] Implement `captureError(error, context)`. File: `packages/firm-observability/src/error-tracking.ts`.
- [ ] **PH1.18.5** [AGENT] Implement `createTenantMeter(tenantId)`. File: `packages/firm-observability/src/middleware.ts`.
- [ ] **PH1.18.6** [AGENT] Write integration tests. File: `packages/firm-observability/tests/`.

---

### PH1.19 – Fix `firm-health` synthetic runner and add OTel readiness check
- [ ] **PH1.19** | Status: Not Started | Fix 10

**Related files:** `packages/firm-health/src/synthetic.ts`, `packages/firm-health/src/readiness.ts`, `packages/firm-health/src/registry.ts`, `packages/firm-health/src/startup.ts`

**Definition of Done:**
- Synthetic runner uses recursive `setTimeout` in try/catch (not `setInterval`).
- `observabilityHealthCheck()` added to readiness probe — verifies OTel SDK is initialised and spans are exporting.
- Event-driven health check registration via IoC (L6 packages register checks without importing `firm-health` directly — avoids layer violation).
- `isShuttingDown()` export and `registerShutdownHandler(fn, priority)` for ordered graceful shutdown.
- Escalating alert strategy for failing synthetic checks.
- Tests: recovery after thrown error, OTel check, IoC registration.

**Out of Scope:** RLS probe (already exists; not modified). **Rules:** Readiness probe must fail if OTel SDK not exporting; liveness probes must never touch external deps. **Anti-Patterns:** No `setInterval` for synthetic checks. **DDD:** Health checks are infrastructure | **TDD:** Simulate synthetic check throwing; assert runner logs it and schedules next run | **BDD:** When a synthetic check throws, runner emits error log and schedules next attempt without crashing | **Deep Module:** Provides K8s-standard probes and extensible synthetic monitoring behind `registerHealthCheck`.

#### Subtasks
- [ ] **PH1.19.1** [AGENT] Replace `setInterval` with recursive `setTimeout` in try/catch. File: `packages/firm-health/src/synthetic.ts`.
- [ ] **PH1.19.2** [AGENT] Implement `observabilityHealthCheck()`. File: `packages/firm-health/src/probes/observability.ts`.
- [ ] **PH1.19.3** [AGENT] Implement IoC health check registration. File: `packages/firm-health/src/registry.ts`.
- [ ] **PH1.19.4** [AGENT] Implement `isShuttingDown()` and `registerShutdownHandler(fn, priority)`. File: `packages/firm-health/src/startup.ts`.
- [ ] **PH1.19.5** [AGENT] Write unit tests. File: `packages/firm-health/tests/`.

---

### PH1.20 – Add missing utilities to `firm-utils`
- [ ] **PH1.20** | Status: Not Started

**Related files:** `packages/firm-utils/src/`

**Definition of Done:**
- `retry<T>(fn, options)` with full-jitter exponential backoff (`maxAttempts`, `initialDelayMs`, `maxDelayMs`, `backoffFactor`, `isRetryable` hook, `onRetry` callback).
- `sleep(ms)` typed cancellable helper.
- `paginate(cursor, limit, direction)` pure cursor math function.
- Named sub-exports: `@firm/utils/result`, `@firm/utils/retry`, `@firm/utils/pagination`.
- `hashIp` JSDoc fixed to accurately describe the salt parameter.
- Unit tests for all new functions.

**Out of Scope:** Changing existing utility signatures. **Rules:** All functions must be pure (except `retry`'s timing); centralise retry logic here — no package reimplements it. **Anti-Patterns:** No re-implementing retry logic elsewhere; no direct `setTimeout` in tests — mock time. **DDD:** Utilities are technical building blocks | **TDD:** Retry succeeds on 3rd attempt, fails after max attempts, calls `onRetry` callback; `paginate` edge cases (first/last/empty page) | **BDD:** N/A | **Deep Module:** N/A

#### Subtasks
- [ ] **PH1.20.1** [AGENT] Implement `retry<T>(fn, options)` with full-jitter backoff. File: `packages/firm-utils/src/retry.ts`.
- [ ] **PH1.20.2** [AGENT] Implement `sleep(ms)`. File: `packages/firm-utils/src/sleep.ts`.
- [ ] **PH1.20.3** [AGENT] Implement `paginate(cursor, limit, direction)`. File: `packages/firm-utils/src/paginate.ts`.
- [ ] **PH1.20.4** [AGENT] Add named sub-exports to `package.json` exports field.
- [ ] **PH1.20.5** [AGENT] Fix `hashIp` JSDoc. File: `packages/firm-utils/src/string.ts`.
- [ ] **PH1.20.6** [AGENT] Write unit tests. File: `packages/firm-utils/tests/`.

---

### PH1.21 – Add missing error helpers to `firm-errors`
- [ ] **PH1.21** | Status: Not Started

**Related files:** `packages/firm-errors/src/`

**Definition of Done:**
- `isRetryable(error): boolean` — `true` for timeouts, network errors, 429s.
- `toTRPCError(error)` serialisation function.
- `toHTTPResponse(error, status?)` serialisation function.
- `FirmError.withContext(additions)` for adding structured context to existing errors.
- Unit tests for all new functions.

**Out of Scope:** New error type classes beyond existing RFC 7807 hierarchy. **Rules:** `isRetryable` recognises `NetworkError`, `TimeoutError`, `RateLimitError` as retryable; HTTP status codes appear only in `toHTTPResponse`. **Anti-Patterns:** No hardcoded HTTP status codes outside `toHTTPResponse`. **DDD:** Errors are a technical cross-cutting concern | **TDD:** `isRetryable` returns `true` for `NetworkError`, `false` for `ValidationError`; `toHTTPResponse` produces correct status | **BDD:** N/A | **Deep Module:** N/A

#### Subtasks
- [ ] **PH1.21.1** [AGENT] Implement `isRetryable(error): boolean`. File: `packages/firm-errors/src/utils.ts`.
- [ ] **PH1.21.2** [AGENT] Implement `toTRPCError(error)` and `toHTTPResponse(error, status?)`. Same file.
- [ ] **PH1.21.3** [AGENT] Implement `FirmError.withContext(additions)`. File: `packages/firm-errors/src/firm-error.ts`.
- [ ] **PH1.21.4** [AGENT] Write unit tests. File: `packages/firm-errors/tests/`.

---

### PH1.22 – Add missing crypto functions and remove `generateUUID`
- [ ] **PH1.22** | Status: Not Started

**Related files:** `packages/firm-crypto/src/`

**Definition of Done:**
- `generateSecureToken(bytes)` — uniform-length crypto-secure tokens.
- `encryptField(value, keyId)` / `decryptField(ciphertext, keyId)` — AES-256-GCM with IV generation and `keyId` for rotation.
- `deriveKey(password, salt, iterations?)` — PBKDF2/Argon2 for per-tenant keys.
- `generateUUID` removed; all callers updated to `crypto.randomUUID()` or `@firm/id.generateId()` (UUID v7).
- Tests: encrypt/decrypt round-trip, key derivation determinism, decryption fails with wrong key.

**Out of Scope:** Changing existing HMAC or TOTP implementations. **Rules:** Web Crypto API; constant-time operations where applicable; `keyId` stored alongside ciphertext to enable rotation. **Anti-Patterns:** No keeping `generateUUID` as a thin wrapper — it is redundant and misleading. **DDD:** Crypto is a technical service | **TDD:** Round-trip test; wrong-key decryption fails; key derivation deterministic for identical inputs | **BDD:** N/A | **Deep Module:** N/A

#### Subtasks
- [ ] **PH1.22.1** [AGENT] Implement `generateSecureToken(bytes)`. File: `packages/firm-crypto/src/token.ts`.
- [ ] **PH1.22.2** [AGENT] Implement `encryptField` / `decryptField` using AES-256-GCM. File: `packages/firm-crypto/src/encrypt.ts`.
- [ ] **PH1.22.3** [AGENT] Implement `deriveKey(password, salt, iterations?)` using PBKDF2. File: `packages/firm-crypto/src/derive.ts`.
- [ ] **PH1.22.4** [AGENT] Remove `generateUUID` and update all callers. Files: `packages/firm-crypto/src/index.ts` + all call sites.
- [ ] **PH1.22.5** [AGENT] Write unit tests. File: `packages/firm-crypto/tests/`.

---

### PH1.23 – Enhance `firm-env` with secret format validation
- [ ] **PH1.23** | Status: Not Started

**Related files:** `packages/firm-env/src/`

**Definition of Done:**
- Zod refinements for secret format: `.url()`, minimum 32-char secrets, DB URL structure validator.
- `getSecret(key)` lazy accessor (prevents cold-start timing attacks).
- Typed `environment` export (`'development' | 'staging' | 'production'`) derived from `NODE_ENV`.
- Tests: invalid formats cause startup failure; valid formats pass.

**Out of Scope:** New env var schemas for feature packages. **Rules:** Fail at startup on malformed required secrets; do not throw on missing optional vars. **Anti-Patterns:** No silent acceptance of malformed URLs or short secrets. **DDD:** N/A | **TDD:** Malformed DB URL fails Zod parse; short secret key rejected | **BDD:** N/A | **Deep Module:** N/A

#### Subtasks
- [ ] **PH1.23.1** [AGENT] Add Zod refinements for URL format, minimum length (32 chars), DB URL structure. File: `packages/firm-env/src/` (locate schema files).
- [ ] **PH1.23.2** [AGENT] Implement `getSecret(key)` lazy accessor. File: `packages/firm-env/src/secrets.ts`.
- [ ] **PH1.23.3** [AGENT] Export typed `environment` constant. File: `packages/firm-env/src/environment.ts`.
- [ ] **PH1.23.4** [AGENT] Write tests for invalid formats and the `environment` export. File: `packages/firm-env/tests/`.

---

### PH1.24 – Enhance `firm-api-contracts` with deprecation and webhook infrastructure
- [ ] **PH1.24** | Status: Not Started

**Related files:** `packages/firm-api-contracts/src/events/`, `packages/firm-api-contracts/src/`

**Definition of Done:**
- `deprecateEvent(name, version, sunsetDate)` — registers sunset date; CI blocks new handler registrations past sunset.
- `createWebhookPayloadSchema(eventSchema)` — wraps event schema with standard webhook envelope (id, timestamp, HMAC signature field).
- tRPC sub-routers organised by domain: `leadsRouter`, `campaignsRouter`, `bookingsRouter`, `crmRouter`, `formsRouter`.
- Unregistered events cannot be emitted (EventRegistry enforcement).

**Out of Scope:** New event type definitions (added with feature packages). **Rules:** Deprecated events trigger CI warnings after sunset. All emitted events must be registered. **Anti-Patterns:** No unregistered events emitted at runtime. **DDD:** API contracts are the shared kernel between services | **TDD:** `deprecateEvent` stores sunset date; `createWebhookPayloadSchema` produces schema requiring envelope fields | **BDD:** N/A | **Deep Module:** N/A

#### Subtasks
- [ ] **PH1.24.1** [AGENT] Implement `deprecateEvent(name, version, sunsetDate)` in EventRegistry. File: `packages/firm-api-contracts/src/events/registry.ts`.
- [ ] **PH1.24.2** [AGENT] Implement `createWebhookPayloadSchema(eventSchema)`. File: `packages/firm-api-contracts/src/webhooks/payload.ts`.
- [ ] **PH1.24.3** [AGENT] Create domain-scoped tRPC sub-routers: extend existing `booking-routes.ts`, `crm.ts`, `form.ts`; add `leads.ts`, `campaigns.ts`. Files: `packages/firm-api-contracts/src/`.
- [ ] **PH1.24.4** [AGENT] Write tests for deprecation registration and webhook schema. File: `packages/firm-api-contracts/tests/`.

---

### PH1.25 – Fix `firm-consent` compliance gaps ⚠️ DEADLINE
- [ ] **PH1.25** | Status: Not Started | ⚠️ **GCM v3: Jun 15 deadline · CNIL suppression schema: Jun 9 deadline**

**Related files:** `packages/firm-consent/src/consent-manager.ts`, `packages/firm-consent/src/gate.ts`, `packages/firm-consent/src/server.ts`, `packages/firm-consent/src/gpc.ts`

**Definition of Done:**
- `gpcApplied` flag embedded in HMAC-signed consent payload — cannot be stripped by client.
- Google Consent Mode v3 translation layer `consentToGtag()` active — **Jun 15 deadline**; CI Gate 14 verifies.
- TCF 2.2 consent string encoding for EU programmatic ads.
- `shouldTrackEmail(userId, tenantId, jurisdiction): boolean` — pixels suppressed for EU users without explicit marketing opt-in — **schema wired Jun 9; enforcement Jul 14**.
- Consent state changes stubbed for `firm-audit` write path (wired in Phase 3 when `firm-audit` is built).
- Tests: GPC override, GCM v3 mapping, TCF encoding, CNIL suppression.

**Out of Scope:** Consent UI components. **Rules:** GPC overrides stored consent — cannot be overridden by consent banner; tracking pixels never rendered before server-side consent verification. **Anti-Patterns:** No serving tracking pixels before server-side consent verified. **DDD:** Consent is a domain service in the privacy bounded context | **TDD:** Request with `Sec-GPC: 1` forces `analytics_storage=denied` even if stored consent says granted; CNIL suppression returns `false` for EU users without marketing consent | **BDD:** A user with GPC enabled never receives marketing cookies even after previously granting consent | **Deep Module:** Encapsulates all GDPR/CCPA/CNIL compliance behind `hasConsent()` and `consentGate()`.

#### Subtasks
- [ ] **PH1.25.1** [AGENT] Embed `gpcApplied` flag in signed consent payload. File: `packages/firm-consent/src/consent-manager.ts`.
- [ ] **PH1.25.2** [AGENT] Implement GCM v3 translation layer `consentToGtag()`. File: `packages/firm-consent/src/server.ts`.
- [ ] **PH1.25.3** [AGENT] Implement TCF 2.2 consent string encoding. File: `packages/firm-consent/src/tcf.ts`.
- [ ] **PH1.25.4** [AGENT] Implement `shouldTrackEmail(userId, tenantId, jurisdiction)` for CNIL pixel suppression. File: `packages/firm-consent/src/gate.ts`.
- [ ] **PH1.25.5** [AGENT] Stub consent-state-change event emission for `firm-audit` (wired Phase 3). File: `packages/firm-consent/src/consent-manager.ts`.
- [ ] **PH1.25.6** [AGENT] Write comprehensive tests: GPC override, GCM v3 mapping, TCF encoding, CNIL suppression. File: `packages/firm-consent/tests/`.

---

### PH1.26 – NY Synthetic Performer compliance stub in `firm-db-schema` ⚠️ DEADLINE
- [ ] **PH1.26** | Status: Not Started | ⚠️ **Jun 9 deadline (schema minimum)**

**Related files:** `packages/firm-db-schema/src/` (post-split from PH1.15)

**Definition of Done:**
- `ai_generation_log` table: `id`, `tenant_id`, `disclosure_label` (non-nullable, non-removable), `c2pa_manifest` (nullable until Aug 2 deadline), `created_at`, `content_type`, `approved_at`, `approved_by`.
- Migration generated and committed.
- Migration test asserts table exists and `disclosure_label` has NOT NULL constraint.

**Out of Scope:** `firm-ai-content` package (Phase 4); C2PA manifest generation (Aug 2, Phase 3); full AI content approval workflow. **Rules:** `disclosure_label` must be non-nullable; no AI-generated content displayed without this label. **Anti-Patterns:** Do not defer this schema past Jun 9 — column must exist before any AI content is persisted. **DDD:** N/A | **TDD:** Migration test asserts table and column constraints | **BDD:** N/A | **Deep Module:** N/A

#### Subtasks
- [ ] **PH1.26.1** [AGENT] Add `ai_generation_log` table definition. File: `packages/firm-db-schema/src/ai-generation-log.ts`.
- [ ] **PH1.26.2** [AGENT] Generate and commit the Drizzle migration.
- [ ] **PH1.26.3** [AGENT] Write migration test asserting table existence and `disclosure_label` NOT NULL. File: `packages/firm-db-schema/tests/ai-generation-log.test.ts`.

---

### PH1.27 – Rename `firm-test-utils` → `firm-testing` and expand harnesses
- [ ] **PH1.27** | Status: Not Started

**Related files:** `packages/firm-testing/`

**Definition of Done:**
- Package renamed to `@firm/testing` at `packages/firm-testing/`.
- Harnesses: `createUnitHarness()` (PGLite + ioredis-mock), `createIntegrationHarness()` (real DB + Redis, isolated tenant lifecycle), `createE2eHarness()` (Playwright-backed), `createTenantIsolationFixture()` (two tenants, cross-visibility assertions), `mockAdapter<T extends Port>()` (type-safe Port mock), `createOutboxHarness()` (captures outbox events without full DB transaction), `createServerComponentHarness()`.
- Fixture factories: `createLeadFactory`, `createCampaignFactory`, `createTenantFactory`, `createUserFixture`, `createSessionFixture`.
- `expectNoA11yViolations(container)` axe-core matcher.
- All existing consumers updated.

**Out of Scope:** Actual test suites using these harnesses. **Rules:** Harnesses must be reusable without modification; always use ephemeral databases — never real credentials. **Anti-Patterns:** No hardcoded test credentials or tenant IDs — generate per run. **DDD:** Testing infrastructure is a development concern | **TDD:** Write tests for harnesses themselves verifying setup and teardown | **BDD:** N/A | **Deep Module:** `createUnitHarness()` encapsulates PGLite, ioredis-mock, and tenant provisioning behind one call.

#### Subtasks
- [ ] **PH1.27.1** [AGENT] Rename package directory and update `package.json` name to `@firm/testing`.
- [ ] **PH1.27.2** [AGENT] Implement `createUnitHarness()`. File: `packages/firm-testing/src/harnesses/unit.ts`.
- [ ] **PH1.27.3** [AGENT] Implement `createIntegrationHarness()`. File: `packages/firm-testing/src/harnesses/integration.ts`.
- [ ] **PH1.27.4** [AGENT] Implement `createE2eHarness()`. File: `packages/firm-testing/src/harnesses/e2e.ts`.
- [ ] **PH1.27.5** [AGENT] Implement `createTenantIsolationFixture()`. File: `packages/firm-testing/src/fixtures/tenant-isolation.ts`.
- [ ] **PH1.27.6** [AGENT] Implement `mockAdapter<T extends Port>()`. File: `packages/firm-testing/src/mocks/adapter.ts`.
- [ ] **PH1.27.7** [AGENT] Implement `createOutboxHarness()`. File: `packages/firm-testing/src/harnesses/outbox.ts`.
- [ ] **PH1.27.8** [AGENT] Implement `createServerComponentHarness()`. File: `packages/firm-testing/src/harnesses/server-component.ts`.
- [ ] **PH1.27.9** [AGENT] Implement fixture factories (`createLeadFactory`, `createCampaignFactory`, `createTenantFactory`, `createUserFixture`, `createSessionFixture`). File: `packages/firm-testing/src/fixtures/`.
- [ ] **PH1.27.10** [AGENT] Implement `expectNoA11yViolations(container)`. File: `packages/firm-testing/src/matchers/a11y.ts`.
- [ ] **PH1.27.11** [AGENT] Update all monorepo import paths to `@firm/testing`.

---

### PH1.28 – Build `firm-metering` and quota CI gate
- [ ] **PH1.28** | Status: Not Started

**Related files:** `packages/firm-metering/src/`, `scripts/ci/quota-check-gate.ts`

**Definition of Done:**
- `checkQuota(tenantId, dimension, amount): Promise<Result<QuotaAllowed, QuotaExceeded>>`.
- `recordUsage(tenantId, dimension, amount)` post-operation recording.
- `metering.quota.warning` event emitted at 80% utilisation.
- `scripts/ci/quota-check-gate.ts` (AST via `ts-morph`): detects any call to `recordUsage()`, AI SDK entry points, `sendEmail`, or `uploadMedia` in L6 packages without a preceding `checkQuota()` in the same execution path; fails build with file and line. Active as CI Gate `New1`.
- Test fixtures: violating (must fail gate), compliant (must pass gate).

**Out of Scope:** Full metering aggregation pipeline (Phase 3); only the enforcement API and CI gate. **Rules:** `checkQuota()` must reject before operation executes; `recordUsage()` is never a substitute for `checkQuota()`; gate must use AST traversal, not regex. **Anti-Patterns:** No post-facto quota discovery; no string/regex matching on source. **DDD:** Metering is a supporting domain service | **TDD:** `checkQuota` returns `QuotaExceeded` when limit reached; 80% warning event fires at threshold | **BDD:** An operation that would exceed quota is rejected with `QuotaExceeded` before any resources are consumed | **Deep Module:** `checkQuota(tenantId, dimension, amount)` hides quota storage, threshold math, and event emission.

#### Subtasks
- [ ] **PH1.28.1** [AGENT] Scaffold `packages/firm-metering/package.json` and `tsconfig.json`.
- [ ] **PH1.28.2** [AGENT] Implement `checkQuota(tenantId, dimension, amount)`. File: `packages/firm-metering/src/quota.ts`.
- [ ] **PH1.28.3** [AGENT] Implement `recordUsage(tenantId, dimension, amount)`. File: `packages/firm-metering/src/usage.ts`.
- [ ] **PH1.28.4** [AGENT] Emit `metering.quota.warning` at 80% utilisation. File: `packages/firm-metering/src/quota.ts`.
- [ ] **PH1.28.5** [AGENT] Implement `scripts/ci/quota-check-gate.ts` using `ts-morph`; define exhaustive metered call signature list; add `quota-check` job to `.github/workflows/ci.yml` as Gate `New1`. Files: `scripts/ci/quota-check-gate.ts`, `.github/workflows/ci.yml`.
- [ ] **PH1.28.6** [AGENT] Write gate test fixtures: `scripts/ci/fixtures/violating-no-quota-check.ts` (must fail), `compliant-with-quota-check.ts` (must pass). File: `scripts/ci/tests/quota-check-gate.test.ts`.
- [ ] **PH1.28.7** [AGENT] Write unit tests for quota enforcement and warning threshold. File: `packages/firm-metering/tests/`.

---

### PH1.29 – Build `firm-circuit-breaker`
- [ ] **PH1.29** | Status: Not Started | Fix 9

**Related files:** `packages/firm-circuit-breaker/src/`

**Definition of Done:**
- `createCircuitBreaker<T>(name, fn, options)`: closed → open → half-open state machine with configurable `failureThreshold`, `successThreshold`, `halfOpenTimeout`.
- Per-tenant failure counts stored in Redis (not in-process memory).
- `forceOpen(name)` / `forceClose(name)` manual overrides (persisted in Redis with configurable TTL).
- `onStateChange(callback)` hook.
- `circuitBreakerHealthCheck()` exposing all named breaker states.
- Prometheus counters: `firm.circuit_breaker.state_changes_total`, `firm.circuit_breaker.rejections_total`.
- Tests cover all state transitions, Redis counter persistence, and manual overrides.

**Out of Scope:** Integration with individual adapters (those wrap their calls in the circuit breaker when built in Phase 3). **Rules:** Failure counts must be Redis-backed — in-process counters reset on pod restart and break tenant fairness; manual override must persist in Redis with configurable TTL. **Anti-Patterns:** No breaker state in process memory. **DDD:** Circuit breaker is infrastructure resilience | **TDD:** CLOSED→OPEN on `failureThreshold` exceeded; OPEN→HALF_OPEN on timeout; HALF_OPEN→CLOSED on successful probe; HALF_OPEN→OPEN on failed probe | **BDD:** When downstream service fails 5 consecutive times, the circuit opens and subsequent calls are rejected immediately | **Deep Module:** `createCircuitBreaker(name, fn, options)` encapsulates the state machine and Redis counter; callers wrap any async function.

#### Subtasks
- [ ] **PH1.29.1** [AGENT] Scaffold `packages/firm-circuit-breaker/package.json` and `tsconfig.json`.
- [ ] **PH1.29.2** [AGENT] Implement closed/open/half-open state machine with Redis-backed counters. File: `packages/firm-circuit-breaker/src/breaker.ts`.
- [ ] **PH1.29.3** [AGENT] Implement `forceOpen` / `forceClose` with Redis TTL. File: `packages/firm-circuit-breaker/src/override.ts`.
- [ ] **PH1.29.4** [AGENT] Implement `onStateChange(callback)` hook and Prometheus counters. File: `packages/firm-circuit-breaker/src/metrics.ts`.
- [ ] **PH1.29.5** [AGENT] Implement `circuitBreakerHealthCheck()`. File: `packages/firm-circuit-breaker/src/health.ts`.
- [ ] **PH1.29.6** [AGENT] Wire `circuitBreakerHealthCheck()` into `firm-health` readiness probe. File: `packages/firm-health/src/probes/circuit-breaker.ts`.
- [ ] **PH1.29.7** [AGENT] Write comprehensive tests. File: `packages/firm-circuit-breaker/tests/`.

---

### PH1.30 – Build `firm-feature-flags`
- [ ] **PH1.30** | Status: Not Started | Fix 12

**Related files:** `packages/firm-feature-flags/src/`, `scripts/ci/feature-flag-expiry-gate.ts`

**Definition of Done:**
- `isEnabled(flagName, context): boolean` — gradual rollout (%, user segment, tenant tier), per-tenant overrides with expiry.
- `firm-bus` integration: `FlagChangedEvent` pushed on flag changes.
- `evaluateFlagForRequest(flagName): boolean` server-side helper.
- `useFlagClient(flagName): boolean` React hook backed by SSE (no polling).
- SSR-safe initial flag state seeded from RSC / `getServerSideProps`.
- `scripts/ci/feature-flag-expiry-gate.ts` (Gate 15): flags with a past `expiresAt` date fail the build.
- ESLint rule: flags must be declared in central registry before evaluation.
- All flags must have an `expiresAt` date.

**Out of Scope:** A/B testing framework; feature flag admin UI (Phase 5). **Rules:** Flags must have `expiresAt`; all flags declared in registry before use. **Anti-Patterns:** No polling for flag updates — use SSE; no undeclared flag evaluation. **DDD:** Feature flags are a supporting service for controlled rollout | **TDD:** Gradual rollout returns `true` for exactly `rolloutPercent`% of requests; per-tenant override expires correctly | **BDD:** When a flag's rollout % changes in the registry, all connected clients receive the update within one SSE event cycle — no page reload required | **Deep Module:** `isEnabled(flagName, context)` hides rollout math, override lookups, and event propagation.

#### Subtasks
- [ ] **PH1.30.1** [AGENT] Scaffold `packages/firm-feature-flags/package.json` and `tsconfig.json`.
- [ ] **PH1.30.2** [AGENT] Implement `isEnabled(flagName, context)` with gradual rollout and per-tenant overrides. File: `packages/firm-feature-flags/src/evaluator.ts`.
- [ ] **PH1.30.3** [AGENT] Implement `firm-bus` integration for `FlagChangedEvent`. File: `packages/firm-feature-flags/src/events.ts`.
- [ ] **PH1.30.4** [AGENT] Implement `evaluateFlagForRequest(flagName)`. File: `packages/firm-feature-flags/src/server.ts`.
- [ ] **PH1.30.5** [AGENT] Implement `useFlagClient(flagName)` React hook backed by SSE. File: `packages/firm-feature-flags/src/client.ts`.
- [ ] **PH1.30.6** [AGENT] Implement SSR-safe initial flag state seeding. File: `packages/firm-feature-flags/src/ssr.ts`.
- [ ] **PH1.30.7** [AGENT] Implement `scripts/ci/feature-flag-expiry-gate.ts`; add as Gate 15 to `.github/workflows/ci.yml`.
- [ ] **PH1.30.8** [AGENT] Add ESLint rule `no-undeclared-flags`. File: `packages/firm-config-eslint/src/rules/no-undeclared-flags.ts`.
- [ ] **PH1.30.9** [AGENT] Write tests for rollout, overrides, expiry, and gate fixtures. File: `packages/firm-feature-flags/tests/`.

---

### PH1.31 – Build `firm-i18n`
- [ ] **PH1.31** | Status: Not Started | Fix 13

**Related files:** `packages/firm-i18n/src/`, `scripts/ci/i18n-missing-keys-gate.ts`

**Definition of Done:**
- `createI18nInstance(locale, namespace)` factory for server and client contexts.
- ICU MessageFormat pluralisation; namespace-based lazy loading for client bundles.
- `t(key, vars)` server-side function (RSC-compatible, no hooks); `useTranslation(namespace)` React hook (Client Components only).
- Locale negotiation: `Accept-Language` header → tenant default → platform default (`en-US`).
- RTL `dir` attribute injection for Arabic, Hebrew, Persian.
- `scripts/ci/i18n-missing-keys-gate.ts`: compares all locale files against `en` baseline; fails build on missing keys in any locale.

**Out of Scope:** Translation management UI; machine-translation pipeline. **Rules:** No `useTranslation` in a Server Component — `no-hook-in-server-component` ESLint rule catches this; always fall back to `en` gracefully. **Anti-Patterns:** No hardcoded locale strings in components; no `useTranslation` in Server Components. **DDD:** i18n is a supporting technical service | **TDD:** Pluralisation with 0, 1, N; missing key fallback to English; locale negotiation order | **BDD:** `Accept-Language: fr` with `defaultLocale: es` resolves to `fr` — request header takes precedence | **Deep Module:** `t(key, vars)` and `useTranslation(namespace)` provide identical translation API across server and client contexts.

#### Subtasks
- [ ] **PH1.31.1** [AGENT] Scaffold `packages/firm-i18n/package.json` and `tsconfig.json`.
- [ ] **PH1.31.2** [AGENT] Implement `createI18nInstance(locale, namespace)` with ICU pluralisation and namespace lazy loading. File: `packages/firm-i18n/src/instance.ts`.
- [ ] **PH1.31.3** [AGENT] Implement `t(key, vars)` server-side function. File: `packages/firm-i18n/src/server.ts`.
- [ ] **PH1.31.4** [AGENT] Implement `useTranslation(namespace)` React hook. File: `packages/firm-i18n/src/client.ts`.
- [ ] **PH1.31.5** [AGENT] Implement locale negotiation. File: `packages/firm-i18n/src/negotiate.ts`.
- [ ] **PH1.31.6** [AGENT] Implement RTL `dir` injection. File: `packages/firm-i18n/src/rtl.ts`.
- [ ] **PH1.31.7** [AGENT] Implement `scripts/ci/i18n-missing-keys-gate.ts`; add as blocking gate to `.github/workflows/ci.yml`.
- [ ] **PH1.31.8** [AGENT] Write unit tests for pluralisation, fallback, negotiation, and gate fixtures. File: `packages/firm-i18n/tests/`.

---

Continuing from PH1.32:

***

### PH1.32 – Build adapter scaffolding generator and gate
- [ ] **PH1.32** | Status: Not Started

**Related files:** `tools/generators/adapter/`, `packages/firm-adapters/`, `scripts/ci/adapter-scaffold-gate.ts`

**Definition of Done:**
- `pnpm turbo gen adapter` scaffolds: `src/adapter.ts` (Port `implements` declaration), `src/stub.ts` (in-memory stub), `tests/conformance.test.ts` (verifies all Port methods return canonical types and map errors to `FirmError`), `package.json`, auto-updated `REGISTRY.md` entry.
- `scripts/ci/adapter-scaffold-gate.ts`: any package under `packages/firm-adapters-*/` that lacks a `tests/conformance.test.ts` fails the build.
- All existing adapters verified to have conformance tests or stubs created.

**Out of Scope:** Building individual adapters (those happen per-phase). **Rules:** Every adapter must implement exactly the methods declared in its Port — no extra public methods that bypass the port abstraction. **Anti-Patterns:** No adapter exposing provider-specific methods; no skipping the conformance test. **DDD:** Adapters are infrastructure; Ports are domain contracts | **TDD:** Conformance test verifies all Port methods: happy path returns canonical type, error path maps to `FirmError` | **BDD:** An adapter that throws a raw `AxiosError` is caught by the conformance test — it must rethrow as `FirmError` | **Deep Module:** Generator hides all scaffolding ceremony; `pnpm turbo gen adapter` is the single entry point.

#### Subtasks
- [ ] **PH1.32.1** [AGENT] Build Turbo generator at `tools/generators/adapter/` producing all required files.
- [ ] **PH1.32.2** [AGENT] Implement `scripts/ci/adapter-scaffold-gate.ts`; add as blocking gate to `.github/workflows/ci.yml`.
- [ ] **PH1.32.3** [AGENT] Audit all existing adapters; create missing conformance tests or stubs. Files: `packages/firm-adapters-*/tests/conformance.test.ts`.

***

### PH1.33 – Build `firm-ports` and register all Port interfaces
- [ ] **PH1.33** | Status: Not Started

**Related files:** `packages/firm-ports/src/`

**Definition of Done:**
- All Port interfaces consolidated in `packages/firm-ports/`: `EmailPort`, `SMSPort`, `StoragePort`, `PaymentPort`, `CRMSyncPort`, `CalendarPort`, `VideoConferencingPort`, `WebhookDeliveryPort`, `AITextPort`, `AIImagePort`, `VectorStorePort`, `AgentToolPort`, `KnowledgeBasePort`, `DNSPort`, `ShortUrlPort`, `QRCodePort`.
- Each Port uses `Result<T, FirmError>` return types only — no thrown errors.
- `REGISTRY.md` lists every Port with its adapter implementations.
- CI gate (Gate 16): any new Port without at least one registered adapter stubs the build with a warning.

**Out of Scope:** Adapter implementations (built per-phase). **Rules:** Ports may only import from `@firm/errors`, `@firm/types`, `@firm/primitives` — zero business logic; `Result<T, FirmError>` on all async methods. **Anti-Patterns:** No adapter code in `firm-ports`; no thrown errors from Port methods. **DDD:** Ports are domain contracts; adapters are infrastructure | **TDD:** Each Port interface checked against a minimal conformance stub | **BDD:** N/A | **Deep Module:** `firm-ports` is the single authoritative reference for all external integration contracts.

#### Subtasks
- [ ] **PH1.33.1** [AGENT] Scaffold `packages/firm-ports/package.json` and `tsconfig.json`.
- [ ] **PH1.33.2** [AGENT] Define all 16 Port interfaces. File: `packages/firm-ports/src/` (one file per Port).
- [ ] **PH1.33.3** [AGENT] Create `packages/firm-ports/REGISTRY.md` listing all Ports and known adapter implementations.
- [ ] **PH1.33.4** [AGENT] Add CI Gate 16 warning if any Port has zero registered adapters. File: `scripts/ci/port-adapter-gate.ts`.

***

### PH1.34 – Build `firm-webhook-receiver`
- [ ] **PH1.34** | Status: Not Started

**Related files:** `packages/firm-webhook-receiver/src/`

**Definition of Done:**
- `createWebhookHandler(provider, secret)` — constant-time HMAC-SHA256 signature verification before any payload parsing.
- Idempotency: deduplication by `webhookId` via Redis with TTL.
- Replay attack prevention: `timestamp` within ±5 min window enforced.
- Registered provider parsers: Stripe, Twilio, SendGrid, GoHighLevel (extensible via plugin pattern).
- `WebhookReceivedEvent` published to `firm-bus` for downstream consumers.
- Rate limiter: max 1000 events/sec/tenant via `firm-rate-limiter`.
- Tests: HMAC rejection, replay rejection, idempotency deduplication, rate limit enforcement.

**Out of Scope:** Webhook delivery (outbound) — that is in `firm-bus`. **Rules:** Signature verification must happen before payload parsing to prevent deserialization attacks; constant-time comparison mandatory. **Anti-Patterns:** No parsing webhook payload before signature verified; no string comparison for HMAC (timing attack). **DDD:** Webhook receipt is an integration infrastructure concern | **TDD:** Invalid HMAC returns 401 before any parsing; replayed `webhookId` returns 200 (idempotent) without re-processing | **BDD:** An attacker replaying a Stripe webhook with a valid signature but a `webhookId` seen within the last 24 hours receives 200 but the event is not re-processed | **Deep Module:** `createWebhookHandler(provider, secret)` hides all verification, deduplication, and routing complexity.

#### Subtasks
- [ ] **PH1.34.1** [AGENT] Scaffold `packages/firm-webhook-receiver/package.json` and `tsconfig.json`.
- [ ] **PH1.34.2** [AGENT] Implement constant-time HMAC-SHA256 signature verification. File: `packages/firm-webhook-receiver/src/verify.ts`.
- [ ] **PH1.34.3** [AGENT] Implement Redis idempotency deduplication with TTL. File: `packages/firm-webhook-receiver/src/idempotency.ts`.
- [ ] **PH1.34.4** [AGENT] Implement timestamp replay attack prevention (±5 min window). File: `packages/firm-webhook-receiver/src/replay.ts`.
- [ ] **PH1.34.5** [AGENT] Implement provider parsers: Stripe, Twilio, SendGrid, GoHighLevel. File: `packages/firm-webhook-receiver/src/providers/`.
- [ ] **PH1.34.6** [AGENT] Implement `WebhookReceivedEvent` emission to `firm-bus`. File: `packages/firm-webhook-receiver/src/handler.ts`.
- [ ] **PH1.34.7** [AGENT] Wire `firm-rate-limiter` policy `webhook-inbound`. Same file.
- [ ] **PH1.34.8** [AGENT] Write tests: HMAC rejection, replay, idempotency, rate limit. File: `packages/firm-webhook-receiver/tests/`.

***

### PH1.35 – CI gates scaffold and activate Phase 1 gates
- [ ] **PH1.35** | Status: Not Started

**Related files:** `.github/workflows/ci.yml`, `scripts/ci/`

**Definition of Done:**
- All CI gates registered (stubs) in `.github/workflows/ci.yml` with phase activation labels; inactive gates are no-ops that log their future purpose.
- **Active from Phase 1 completion:** Gate 1 (type-check), Gate 2 (lint), Gate 3 (unit test ≥80% coverage), Gate 4 (build), Gate 5 (`firm-request-context` concurrent isolation), Gate 6 (PII redaction fixture), Gate 7 (`firm-auth` session type), Gate 8 (quota-check AST gate `New1`), Gate 9 (`satisfies` conformance), Gate 15 (feature-flag expiry), Gate 16 (port-adapter stub check).
- Gates 10–14 and 17+ are registered stubs activated in later phases.
- Build time reported in CI summary; Turborepo remote cache enabled.

**Out of Scope:** Phase 2+ gate implementations. **Rules:** Every gate must have a unique label and an activation phase annotation. **Anti-Patterns:** No silent no-op gates without a log message. **DDD:** N/A | **TDD:** N/A | **BDD:** N/A | **Deep Module:** N/A

#### Subtasks
- [ ] **PH1.35.1** [AGENT] Scaffold all gate stubs (Gates 1–17+) in `.github/workflows/ci.yml` with activation phase annotations.
- [ ] **PH1.35.2** [AGENT] Activate Gates 1–9, 15, 16 as blocking steps.
- [ ] **PH1.35.3** [AGENT] Enable Turborepo remote cache; add build time reporting to CI summary.
- [ ] **PH1.35.4** [AGENT] Confirm all Phase 1 package builds pass: run `pnpm turbo build --filter=...` and record output.

***

### PH1.36 – New L0 packages from UPDATES.md: `firm-changesets`, `firm-config-knip`, `firm-config-lefthook`, `firm-config-stylelint`
- [ ] **PH1.36** | Status: Not Started

**Related files:** `packages/firm-changesets/`, `packages/firm-config-knip/`, `packages/firm-config-lefthook/`, `packages/firm-config-stylelint/`

**Definition of Done:**
- `firm-changesets`: Changesets config with `@changesets/cli` workspace setup; `changeset status` runs in CI as an advisory gate; conventional commit integration for automated versioning.
- `firm-config-knip`: `createKnipConfig(options)` factory; CI job runs `knip` on all packages and reports unused exports/dependencies; fails build if error-level violations found.
- `firm-config-lefthook`: `createLefthookConfig(options)` factory; pre-commit hook runs lint + type-check on staged files; pre-push hook runs unit tests for changed packages; wired into root via `lefthook install`.
- `firm-config-stylelint`: `createStylelintConfig(options)` factory for CSS/Tailwind linting; active in `firm-ui` and all app packages; snapshot test.
- All four are L0 — no imports from L1–L7.

**Out of Scope:** Migrating existing packages to use `lefthook` hooks retroactively beyond one-time `lefthook install`. **Rules:** L0 only; `firm-changesets` version bumps must be human-approved before publish. **Anti-Patterns:** No auto-publishing without human approval; no `knip` in watch mode in CI. **DDD:** N/A | **TDD:** Snapshot tests for config shapes | **BDD:** N/A | **Deep Module:** Each factory hides tooling complexity behind a single call.

#### Subtasks
- [ ] **PH1.36.1** [AGENT] Scaffold `packages/firm-changesets/`; configure Changesets for the monorepo; add advisory CI gate. File: `packages/firm-changesets/src/index.ts`.
- [ ] **PH1.36.2** [AGENT] Scaffold `packages/firm-config-knip/`: `createKnipConfig(options)` factory, snapshot test, CI `knip` job. File: `packages/firm-config-knip/src/index.ts`.
- [ ] **PH1.36.3** [AGENT] Scaffold `packages/firm-config-lefthook/`: `createLefthookConfig(options)` factory, pre-commit and pre-push hooks, `lefthook install` in root setup script. File: `packages/firm-config-lefthook/src/index.ts`.
- [ ] **PH1.36.4** [AGENT] Scaffold `packages/firm-config-stylelint/`: `createStylelintConfig(options)` factory, snapshot test, wire into `firm-ui` and app packages. File: `packages/firm-config-stylelint/src/index.ts`.

***

### PH1.37 – New L2 packages from UPDATES.md: `firm-constants`, `firm-prompts`, `firm-file-loaders`, `firm-metadata-engine`
- [ ] **PH1.37** | Status: Not Started

**Related files:** `packages/firm-constants/`, `packages/firm-prompts/`, `packages/firm-file-loaders/`, `packages/firm-metadata-engine/`

**Definition of Done:**
- `firm-constants`: all app-wide enumerations and lookup maps migrated from `firm-types`; `firm-types` re-exports; zero runtime deps; unit test coverage for all exported maps.
- `firm-prompts`: prompt template registry with versioning, slot interpolation, A/B variant support; `registerPrompt(name, version, template, slots[])`, `getPrompt(name, version?, variant?)`, `interpolate(template, vars)`; unit tests.
- `firm-file-loaders`: extraction ports for PDF (via `pdfjs-dist`), DOCX, PPTX, HTML, and Markdown; each returns `{ text: string, metadata: Record<string, unknown> }`; all errors mapped to `FirmError`; unit tests with fixture files.
- `firm-metadata-engine`: runtime user-defined schema system — `defineObjectType(tenantId, schema)`, `validateObject(tenantId, type, data)`, `listObjectTypes(tenantId)`; schema stored in DB via `firm-db-client`; unit + integration tests.

**Out of Scope:** UI for metadata schema management (Phase 5). **Rules:** `firm-constants` and `firm-prompts` are L2 — no imports from L3+; `firm-file-loaders` maps all provider errors to `FirmError`; `firm-metadata-engine` may import from L1–L2 only. **Anti-Patterns:** No hardcoded enum values in feature packages — always import from `firm-constants`. **DDD:** `firm-metadata-engine` is a supporting domain service enabling custom object modeling | **TDD:** Each file loader tested with real fixture files; metadata engine validates correct and incorrect objects | **BDD:** A tenant defines a custom `Property` object type at runtime; the platform validates all records against it without a deployment | **Deep Module:** `firm-metadata-engine` hides schema storage, versioning, and validation complexity behind three functions.

#### Subtasks
- [ ] **PH1.37.1** [AGENT] Scaffold `packages/firm-constants/`; migrate enumerations from `firm-types`; update `firm-types` re-exports; unit tests. File: `packages/firm-constants/src/index.ts`.
- [ ] **PH1.37.2** [AGENT] Scaffold `packages/firm-prompts/`; implement registry, versioning, A/B variants, slot interpolation; unit tests. File: `packages/firm-prompts/src/`.
- [ ] **PH1.37.3** [AGENT] Scaffold `packages/firm-file-loaders/`; implement extractors for PDF, DOCX, PPTX, HTML, Markdown; unit tests with fixtures. File: `packages/firm-file-loaders/src/`.
- [ ] **PH1.37.4** [AGENT] Scaffold `packages/firm-metadata-engine/`; implement `defineObjectType`, `validateObject`, `listObjectTypes`; integration test with `firm-db-client`. File: `packages/firm-metadata-engine/src/`.

***

### PH1.38 – New L1 package from UPDATES.md: `firm-streams`
- [ ] **PH1.38** | Status: Not Started

**Related files:** `packages/firm-streams/src/`

**Definition of Done:**
- `pipelineAsync(...streams)`: promisified Node.js `stream.pipeline` with auto-cleanup on error.
- `createCSVTransform(options)`: transform stream parsing CSV rows to typed objects using Zod schema.
- `createBatchTransform<T>(batchSize, fn)`: buffers items and flushes in batches.
- `createProgressTransform(total, onProgress)`: emits progress events as percentage.
- All errors propagate as `FirmError`; all streams must be auto-destroyed on pipeline failure.
- Unit tests: CSV transform, batch flush, progress tracking, error propagation.

**Out of Scope:** Media streaming (handled by `firm-media`); HTTP streaming responses (handled per-app). **Rules:** L1 — no imports from L2+; all transforms must handle backpressure correctly. **Anti-Patterns:** No silently swallowing stream errors; no unclosed streams on pipeline failure. **DDD:** N/A | **TDD:** CSV transform parses valid CSV and rejects invalid rows; batch transform flushes partial batch on stream end | **BDD:** N/A | **Deep Module:** `pipelineAsync` hides Node.js stream error handling and cleanup.

#### Subtasks
- [ ] **PH1.38.1** [AGENT] Scaffold `packages/firm-streams/package.json` and `tsconfig.json`.
- [ ] **PH1.38.2** [AGENT] Implement `pipelineAsync`. File: `packages/firm-streams/src/pipeline.ts`.
- [ ] **PH1.38.3** [AGENT] Implement `createCSVTransform`. File: `packages/firm-streams/src/csv.ts`.
- [ ] **PH1.38.4** [AGENT] Implement `createBatchTransform`. File: `packages/firm-streams/src/batch.ts`.
- [ ] **PH1.38.5** [AGENT] Implement `createProgressTransform`. File: `packages/firm-streams/src/progress.ts`.
- [ ] **PH1.38.6** [AGENT] Write unit tests. File: `packages/firm-streams/tests/`.

***

### PH1.39 – New L3 package from UPDATES.md: `firm-ip-allowlist`
- [ ] **PH1.39** | Status: Not Started

**Related files:** `packages/firm-ip-allowlist/src/`

**Definition of Done:**
- `isAllowed(tenantId, ip): Promise<boolean>` — per-tenant CIDR allowlist check; supports IPv4 and IPv6.
- `addCIDR(tenantId, cidr)` / `removeCIDR(tenantId, cidr)` management functions.
- Allowlist stored in Redis with DB-backed persistence via `firm-db-client`.
- Middleware helper `createIpAllowlistMiddleware(tenantId)` for Next.js / Hono.
- `firm-rate-limiter` named policy `ip-allowlist-violation` applied on rejection.
- Audit log event `ip.allowlist.violation` stubbed for `firm-audit` (wired Phase 3).
- Tests: IPv4 CIDR match, IPv6 match, rejection, Redis cache hit, DB fallback.

**Out of Scope:** IP-based geofencing (separate feature); `ipAllowlist` field on API keys in `firm-auth` (distinct). **Rules:** L3 — may import L0–L2; CIDR validation must reject malformed CIDRs at `addCIDR` time, not at check time. **Anti-Patterns:** No trusting `X-Forwarded-For` without validating against a trusted proxy list. **DDD:** IP allowlisting is a security domain service | **TDD:** CIDR `192.168.1.0/24` matches `192.168.1.100` and rejects `192.168.2.1` | **BDD:** A request from a non-allowlisted IP returns 403 before any business logic executes | **Deep Module:** `isAllowed(tenantId, ip)` hides CIDR math, Redis caching, and DB fallback.

#### Subtasks
- [ ] **PH1.39.1** [AGENT] Scaffold `packages/firm-ip-allowlist/package.json` and `tsconfig.json`.
- [ ] **PH1.39.2** [AGENT] Implement `isAllowed`, `addCIDR`, `removeCIDR` with Redis + DB persistence. File: `packages/firm-ip-allowlist/src/allowlist.ts`.
- [ ] **PH1.39.3** [AGENT] Implement `createIpAllowlistMiddleware`. File: `packages/firm-ip-allowlist/src/middleware.ts`.
- [ ] **PH1.39.4** [AGENT] Wire `firm-rate-limiter` and audit event stub. Files: `packages/firm-ip-allowlist/src/allowlist.ts`.
- [ ] **PH1.39.5** [AGENT] Write unit tests. File: `packages/firm-ip-allowlist/tests/`.

***

### PH1.40 – New L4 packages from UPDATES.md: `firm-logging-middleware`, `firm-status-page`
- [ ] **PH1.40** | Status: Not Started

**Related files:** `packages/firm-logging-middleware/src/`, `packages/firm-status-page/src/`

**Definition of Done:**
- `firm-logging-middleware`: `createRequestLogger(options)` — logs method, path, status, latency, `tenantId`, `requestId` on every HTTP request; PII paths configurable; integrates with `firm-logger` child loggers; Prometheus histogram `http_request_duration_ms` by route and status; Next.js and Hono variants. Unit tests: PII path redaction, latency tracking, child logger binding.
- `firm-status-page`: `createIncidentManager()` — detect incidents from `firm-health` check failures; component status model (operational, degraded, partial outage, major outage, maintenance); subscriber email/webhook notifications on status change; public status page data endpoint (no auth required); JSON + RSS feeds. Unit tests: incident detection from health check, status change notifications, feed generation.

**Out of Scope:** Status page UI (Next.js app, built in Phase 8); Grafana dashboards. **Rules:** `firm-logging-middleware` must never log raw request bodies; PII path redaction must be configurable per-tenant. **Anti-Patterns:** No logging raw request/response bodies; no blocking request processing on status page update. **DDD:** Both packages are infrastructure observability services | **TDD:** Request logger test: PII path `/api/users/:id/email` is redacted in log output | **BDD:** When `firm-health` reports `firm-db-client` as unhealthy for 3 consecutive probes, `firm-status-page` automatically creates a `degraded` incident | **Deep Module:** `createRequestLogger` hides all OTel span correlation and PII scrubbing.

#### Subtasks
- [ ] **PH1.40.1** [AGENT] Scaffold `packages/firm-logging-middleware/`; implement `createRequestLogger`; Next.js and Hono variants; Prometheus histogram; unit tests. File: `packages/firm-logging-middleware/src/`.
- [ ] **PH1.40.2** [AGENT] Scaffold `packages/firm-status-page/`; implement `createIncidentManager`, component status model, subscriber notifications, public data endpoint, JSON + RSS feeds; unit tests. File: `packages/firm-status-page/src/`.

***

### PH1.41 – Phase 1 acceptance criteria verification
- [ ] **PH1.41** | Status: Not Started | **Final Phase 1 gate**

**Definition of Done:**
- All CI gates 1–9, 15, 16, New1 pass on `main`.
- Zero `any` types in any exported function across all packages (verified by `tsc --strict`).
- Zero `console.log` calls outside `firm-config-eslint` test fixtures (verified by ESLint).
- Coverage ≥80% on all packages completed in Phase 1.
- All 9 blocking ADRs in `accepted` status.
- `firm-request-context` concurrent isolation test passes.
- `firm-consent` GCM v3 gate passes (Jun 15 deadline confirmed met).
- `firm-consent` CNIL suppression schema confirmed wired (Jun 9 deadline confirmed met).
- `ai_generation_log` table migration committed and tested.
- All package paths are flat `packages/firm-*`; zero `packages/layer*` or `packages/config/` nested paths remaining.

**Out of Scope:** Phase 2 tasks. **Rules:** No Phase 2 work begins until every criterion is met and verified in CI. **Anti-Patterns:** No declaring Phase 1 complete based on local builds only — CI must be green on `main`. **DDD:** N/A | **TDD:** N/A | **BDD:** N/A | **Deep Module:** N/A

#### Subtasks
- [ ] **PH1.41.1** [HUMAN] Review all 9 ADRs; set status to `accepted`; merge to `main`.
- [ ] **PH1.41.2** [AGENT] Run `tsc --strict` across all packages; fix any remaining `any` usages.
- [ ] **PH1.41.3** [AGENT] Run ESLint across all packages; fix any remaining `console.log` usages.
- [ ] **PH1.41.4** [AGENT] Run full test suite; confirm coverage ≥80% on all Phase 1 packages.
- [ ] **PH1.41.5** [AGENT] Verify all package paths are flat; run grep for `packages/layer` and `packages/config/` nested paths; fix any remaining nested paths.
- [ ] **PH1.41.6** [HUMAN] Sign off Phase 1 complete; tag release `v0.1.0-foundation`.

***

*End of Phase 1. Phase 2 begins only after PH1.41 sign-off.*