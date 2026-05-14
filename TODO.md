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
- [x] **PH1.1** | Status: Completed

**Related files:** `SECURITY.md`, `CONTRIBUTING.md`, `.github/ISSUE_TEMPLATE/`, `.github/PULL_REQUEST_TEMPLATE.md`

**Definition of Done:**
- `SECURITY.md`: vulnerability disclosure process, security contact, response SLA.
- `CONTRIBUTING.md`: PR process, branch naming, test requirements, ADR proposal process.
- `.github/ISSUE_TEMPLATE/`: `bug_report.md`, `feature_request.md`, `adr_proposal.md`, `security_vulnerability.md`.
- `.github/PULL_REQUEST_TEMPLATE.md`: checklist — tests added, coverage ≥80%, ADR if breaking.

**Out of Scope:** Actual ADR records (see PH1.2). **Rules:** Standard GitHub community health file conventions. **Anti-Patterns:** No placeholder content; all text must be review-ready. **DDD/TDD/BDD/Deep Module:** N/A

#### Subtasks
- [ ] **PH1.1.1** [HUMAN] Draft and commit `SECURITY.md`.
- [ ] **PH1.1.2** [HUMAN] Draft and commit `CONTRIBUTING.md`.
- [x] **PH1.1.3** [AGENT] Create issue templates: `bug_report.md`, `feature_request.md`, `adr_proposal.md`, `security_vulnerability.md` under `.github/ISSUE_TEMPLATE/`.
- [x] **PH1.1.4** [AGENT] Create `.github/PULL_REQUEST_TEMPLATE.md`.

---

### PH1.2 – ADR infrastructure and blocking ADRs
- [x] **PH1.2** | Status: Completed

**Related files:** `docs/adr/0000-template.md`, `docs/adr/index.md`, `docs/adr/0001–0009`

**Definition of Done:**
- `docs/adr/` with MADR template and index (status column).
- Nine blocking ADRs written, reviewed, committed — each with status `proposed` → `accepted` and a linked CI enforcement: ADR-001 `firm-bus` engine, ADR-002 `firm-search` engine, ADR-003 `firm-types` shared kernel boundary, ADR-004 `firm-db` read-model home, ADR-005 application grouping, ADR-006 client site generation model, ADR-007 `firm-workflow` condition model, ADR-008 template engine choice (Liquid email/SMS; Handlebars PDF), ADR-009 `firm-ai` split boundary.

**Out of Scope:** ADRs not blocking Phase 2. **Rules:** No ADR approved without a linked implementation/enforcement path. **Anti-Patterns:** No approved ADR without an implementation path. **DDD/TDD/BDD/Deep Module:** N/A

#### Subtasks
- [x] **PH1.2.1** [AGENT] Create `docs/adr/` directory, `0000-template.md` (MADR format), and `index.md`.
- [x] **PH1.2.2** [HUMAN] Write ADR-001: `firm-bus` engine. File: `docs/adr/0001-firm-bus-engine.md`.
- [x] **PH1.2.3** [HUMAN] Write ADR-002: `firm-search` engine. File: `docs/adr/0002-firm-search-engine.md`.
- [x] **PH1.2.4** [HUMAN] Write ADR-003: `firm-types` shared kernel boundary. File: `docs/adr/0003-shared-kernel-boundary.md`.
- [x] **PH1.2.5** [HUMAN] Write ADR-004: `firm-db` read-model home. File: `docs/adr/0004-db-read-model-home.md`.
- [x] **PH1.2.6** [HUMAN] Write ADR-005: application grouping (22 apps vs. 3–5 grouped). File: `docs/adr/0005-application-grouping.md`.
- [x] **PH1.2.7** [HUMAN] Write ADR-006: client site generation model (ephemeral vs. committed). File: `docs/adr/0006-client-site-generation.md`.
- [x] **PH1.2.8** [HUMAN] Write ADR-007: `firm-workflow` condition model. File: `docs/adr/0007-workflow-condition-model.md`.
- [x] **PH1.2.9** [HUMAN] Write ADR-008: template engine choice. File: `docs/adr/0008-template-engine-choice.md`.
- [x] **PH1.2.10** [HUMAN] Write ADR-009: `firm-ai` split boundary. File: `docs/adr/0009-firm-ai-split.md`.

---

### PH1.3 – SLO definitions and runbook skeletons
- [x] **PH1.3** | Status: Completed

**Related files:** `docs/slos/`, `docs/runbooks/`

**Definition of Done:**
- `docs/slos/`: 6 SLO definitions — `api-p95-latency.md`, `outbox-lag.md`, `auth-success-rate.md`, `rls-health.md`, `cross-tenant-queries.md`, `ai-approval-rate.md`.
- `docs/runbooks/`: one file per SLO alert plus critical alerts: `redis-down.md`, `outbox-worker-crash.md`, `pgbouncer-eviction.md`.

**Out of Scope:** Grafana dashboards and Prometheus alert rules (Phase 8). **Rules:** Every SLO must have a corresponding runbook before any alert is configured. **Anti-Patterns:** No SLO without a measurement window and error budget. **DDD/TDD/BDD/Deep Module:** N/A

#### Subtasks
- [x] **PH1.3.1** [HUMAN] Write all 6 SLO definitions in `docs/slos/`.
- [x] **PH1.3.2** [HUMAN] Write runbook skeletons for each SLO and the 3 critical alert runbooks in `docs/runbooks/`.

---

### PH1.4 – Rename `services/` → `workers/`
- [x] **PH1.4** | Status: Completed

**Related files:** `services/` (all references), `packages/firm-config-eslint/src/presets/boundaries.ts`

**Definition of Done:**
- `services/` renamed to `workers/` via `git mv`; all imports, CI scripts, Dockerfiles, and docs updated.
- `workers` boundary type added to ESLint config (enforced by PH1.6.4).
- CI grep confirms zero remaining `services/` references.

**Out of Scope:** New worker implementations. **Rules:** Global search-and-replace; verify with recursive grep. **Anti-Patterns:** Do not leave both directories. **DDD/TDD/BDD/Deep Module:** N/A

#### Subtasks
- [x] **PH1.4.1** [AGENT] Rename via `git mv services/ workers/`.
- [x] **PH1.4.2** [AGENT] Replace all `"services/"` references in `package.json` files, `tsconfig` paths, CI scripts, and docs with `"workers/"`.
- [x] **PH1.4.3** [AGENT] Add CI grep step that fails if any `services/` reference remains. File: `.github/workflows/ci.yml`.

---

### PH1.5 – Create missing Layer 0 config packages (8 new)
- [x] **PH1.5** | Status: Completed

**Related files:** `packages/firm-config-prettier`, `packages/firm-config-vitest`, `packages/firm-config-playwright`, `packages/firm-config-commitlint`, `packages/firm-config-docker`, `packages/firm-config-storybook`, `packages/firm-config-security-headers`, `packages/firm-config-k6`

**Definition of Done:**
- All 8 L0 config packages exist, export their factory functions, are consumed by all applicable packages, and each has a snapshot or unit test. No package has runtime code.

**Out of Scope:** Updating existing L0 configs (see PH1.6). **Rules:** L0 only — no imports from L1–L7; factory functions accept options and merge with opinionated defaults. **Anti-Patterns:** No credentials in config defaults; use env variable references. **DDD:** N/A | **TDD:** Snapshot or unit test per package | **BDD:** N/A | **Deep Module:** Each config package hides tooling complexity behind one factory call.

#### Subtasks
- [x] **PH1.5.1** [AGENT] Scaffold `packages/firm-config-prettier/`: frozen Prettier config export, snapshot test, wire into root and all workspace `package.json`. File: `packages/firm-config-prettier/src/index.ts`.
- [x] **PH1.5.2** [AGENT] Scaffold `packages/firm-config-vitest/`: `createVitestConfig(options)` — Node/browser modes, coverage ≥80% thresholds, unit test, wire into all existing packages. File: `packages/firm-config-vitest/src/index.ts`.
- [x] **PH1.5.3** [AGENT] Scaffold `packages/firm-config-playwright/`: `createPlaywrightConfig(options)` — default browsers, base URLs, auth state, snapshot test. File: `packages/firm-config-playwright/src/index.ts`.
- [x] **PH1.5.4** [AGENT] Scaffold `packages/firm-config-commitlint/`: conventional commit config export, snapshot test, point root `commitlint.config.js` here. File: `packages/firm-config-commitlint/src/index.ts`.
- [x] **PH1.5.5** [AGENT] Scaffold `packages/firm-config-docker/`: `createDockerfile(options)` — hardened multi-stage Node.js Dockerfile (non-root UID 10000, `tini` PID 1, `HEALTHCHECK`), tests verifying required instructions. File: `packages/firm-config-docker/src/index.ts`.
- [x] **PH1.5.6** [AGENT] Scaffold `packages/firm-config-storybook/`: `createStorybookConfig(options)` — Vite builder, theme injection, snapshot test. File: `packages/firm-config-storybook/src/index.ts`.
- [x] **PH1.5.7** [AGENT] Scaffold `packages/firm-config-security-headers/`: `createSecurityHeaders(options)` — CSP/HSTS/Permissions-Policy, decoupled from Next.js, no `unsafe-inline` or `unsafe-eval` in default CSP, tests. File: `packages/firm-config-security-headers/src/index.ts`.
- [x] **PH1.5.8** [AGENT] Scaffold `packages/firm-config-k6/`: `createK6Config(options)` — base URLs, auth fixtures, ramp-up profiles, unit test, documented env vars. File: `packages/firm-config-k6/src/index.ts`.

---

### PH1.6 – Update existing Layer 0 config packages (4 existing)
- [x] **PH1.6** | Status: Completed

**Related files:** `packages/firm-config-typescript`, `packages/firm-config-tailwind`, `packages/firm-config-next`, `packages/firm-config-eslint`

**Definition of Done:**
- `firm-config-typescript`: adds `worker` variant (no browser API types).
- `firm-config-tailwind`: adds `v4/` export for Tailwind v4 CSS-first configuration.
- `firm-config-next`: sets `serverExternalPackages: ['pino', 'drizzle-orm', 'postgres']`.
- `firm-config-eslint`: adds rules `no-direct-fetch`, `no-direct-read-model-write`, `no-runtime-tokens-import`; registers `workers` boundary type.
- Existing CI continues to pass; no breaking changes.

**Out of Scope:** New config packages (PH1.5). **Rules:** Extend factory functions; do not remove existing rules without an ADR. **Anti-Patterns:** No rule removal without documentation. **DDD:** N/A | **TDD:** Update existing tests to cover new variants | **BDD:** N/A | **Deep Module:** N/A

#### Subtasks
- [x] **PH1.6.1** [AGENT] Add `worker` tsconfig variant. File: `packages/firm-config-typescript/src/worker.ts`.
- [x] **PH1.6.2** [AGENT] Add `v4/` export. File: `packages/firm-config-tailwind/src/v4.ts`.
- [x] **PH1.6.3** [AGENT] Add `serverExternalPackages`. File: `packages/firm-config-next/src/index.ts`.
- [x] **PH1.6.4** [AGENT] Add 3 ESLint rules and `workers` boundary type. File: `packages/firm-config-eslint/src/presets/boundaries.ts`.

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

---

## Phase 2: Core Infrastructure

*Build and verify all L1–L3 infrastructure packages. No L4–L7 packages may be started until Phase 2 acceptance criteria are met.*

***

### PH2.1 – Build `firm-bus` (event bus and outbox)
- [ ] **PH2.1** | Status: Not Started | **Blocked by ADR-001 (PH1.2.2)**

**Related files:** `packages/firm-bus/src/`

**Definition of Done:**
- ADR-001 accepted before any implementation.
- `publish(event, payload)` — writes to outbox table via `firm-db-client.writeToOutbox`; no direct broker calls from application code.
- `subscribe(eventName, handler)` — registers handler with at-least-once delivery guarantee.
- `publishBatch(events[])` — single transaction outbox write.
- Dead-letter queue: events exceeding `maxRetries` moved to `firm_dead_letter` table.
- `EventRegistry` enforced: unregistered events cannot be published (build-time and runtime check).
- `firm-bus` health check registered with `firm-health`.
- Unit tests: publish writes to outbox, dead-letter promotion on max retries, unregistered event rejected.

**Out of Scope:** Outbox worker (PH8.1); broker adapter implementations (Phase 3). **Rules:** ADR-001 must be accepted first; no direct broker calls from application code — all events go through the outbox; `EventRegistry` enforcement is mandatory. **Anti-Patterns:** No direct broker calls bypassing outbox; no publishing unregistered events. **DDD:** `firm-bus` is a domain event infrastructure service | **TDD:** `publish` writes to outbox within the same DB transaction as the business operation | **BDD:** When `firm-db-client` transaction commits, the outbox row is visible; if the transaction rolls back, the event is never published | **Deep Module:** `publish(event, payload)` hides all outbox mechanics, serialization, and transaction coordination.

#### Subtasks
- [ ] **PH2.1.1** [HUMAN] Confirm ADR-001 accepted before any implementation. File: `docs/adr/0001-firm-bus-engine.md`.
- [ ] **PH2.1.2** [AGENT] Scaffold `packages/firm-bus/package.json` and `tsconfig.json`.
- [ ] **PH2.1.3** [AGENT] Implement `publish(event, payload)` writing to outbox via `writeToOutbox`. File: `packages/firm-bus/src/publish.ts`.
- [ ] **PH2.1.4** [AGENT] Implement `publishBatch(events[])` single-transaction outbox write. File: `packages/firm-bus/src/publish.ts`.
- [ ] **PH2.1.5** [AGENT] Implement `subscribe(eventName, handler)` with at-least-once delivery registration. File: `packages/firm-bus/src/subscribe.ts`.
- [ ] **PH2.1.6** [AGENT] Implement dead-letter promotion logic on `maxRetries` exceeded. File: `packages/firm-bus/src/dead-letter.ts`.
- [ ] **PH2.1.7** [AGENT] Implement `EventRegistry` enforcement — unregistered events rejected at publish time. File: `packages/firm-bus/src/registry.ts`.
- [ ] **PH2.1.8** [AGENT] Register `firm-bus` health check with `firm-health`. File: `packages/firm-bus/src/health.ts`.
- [ ] **PH2.1.9** [AGENT] Write unit tests. File: `packages/firm-bus/tests/`.

***

### PH2.2 – Build `firm-sse` (server-sent events)
- [ ] **PH2.2** | Status: Not Started

**Related files:** `packages/firm-sse/src/`

**Definition of Done:**
- `createSSEStream(req, options)` — creates a tenant-scoped SSE connection with automatic heartbeat (30s), reconnect tokens, and graceful close on client disconnect.
- `broadcast(tenantId, channel, event)` — Redis Pub/Sub fan-out to all connected SSE clients for a tenant.
- `SSEConnectionRegistry` — tracks active connections per tenant; exposes count via `firm-health`.
- Back-pressure handling: slow clients are disconnected after configurable buffer threshold.
- Next.js Route Handler and Hono adapter variants.
- Tests: broadcast fan-out, heartbeat, slow-client disconnect, reconnect token validation.

**Out of Scope:** WebSocket support. **Rules:** SSE connections must be tenant-scoped; no cross-tenant event fan-out; heartbeat mandatory to prevent proxy timeouts. **Anti-Patterns:** No unbounded connection accumulation; no broadcasting without tenant scope. **DDD:** SSE is a real-time delivery infrastructure service | **TDD:** `broadcast` delivers to all connections registered for `tenantId`; connection from different tenant receives nothing | **BDD:** When a flag changes, all SSE-connected dashboard tabs for that tenant receive the update within one heartbeat cycle | **Deep Module:** `createSSEStream` hides all Redis Pub/Sub, heartbeat scheduling, and connection lifecycle management.

#### Subtasks
- [ ] **PH2.2.1** [AGENT] Scaffold `packages/firm-sse/package.json` and `tsconfig.json`.
- [ ] **PH2.2.2** [AGENT] Implement `createSSEStream(req, options)` with heartbeat and reconnect tokens. File: `packages/firm-sse/src/stream.ts`.
- [ ] **PH2.2.3** [AGENT] Implement `broadcast(tenantId, channel, event)` via Redis Pub/Sub. File: `packages/firm-sse/src/broadcast.ts`.
- [ ] **PH2.2.4** [AGENT] Implement `SSEConnectionRegistry` with `firm-health` count exposure. File: `packages/firm-sse/src/registry.ts`.
- [ ] **PH2.2.5** [AGENT] Implement back-pressure slow-client disconnect. File: `packages/firm-sse/src/stream.ts`.
- [ ] **PH2.2.6** [AGENT] Implement Next.js Route Handler and Hono adapters. File: `packages/firm-sse/src/adapters/`.
- [ ] **PH2.2.7** [AGENT] Write tests. File: `packages/firm-sse/tests/`.

***

### PH2.3 – Build `firm-queue` (job queue)
- [ ] **PH2.3** | Status: Not Started

**Related files:** `packages/firm-queue/src/`

**Definition of Done:**
- `createQueue<T>(name, options)` — BullMQ-backed named queue with per-tenant job isolation.
- `enqueue(tenantId, data, options?)` — adds job with `tenantId` in job data; supports `delay`, `priority`, `attempts`.
- `createWorker<T>(queueName, handler, options)` — BullMQ worker that restores `firm-request-context` from job data before calling `handler`.
- `createScheduler(queueName)` — BullMQ `QueueScheduler` wrapper for delayed/repeatable jobs.
- Prometheus metrics: `firm.queue.job_duration_ms`, `firm.queue.waiting_count`, `firm.queue.failed_count`.
- `queueHealthCheck()` registered with `firm-health`.
- Tests: enqueue with delay, worker restores context, failed job increments metric.

**Out of Scope:** Specific job implementations (those are in `workers/`). **Rules:** All jobs must carry `tenantId` in job data; worker must restore `AsyncLocalStorage` context before handler execution; no anonymous jobs. **Anti-Patterns:** No jobs without `tenantId`; no calling `firm-bus` `subscribe` from a BullMQ worker — use queue for CPU-bound, bus for event-driven. **DDD:** Job queue is infrastructure | **TDD:** Worker calls `withRequestContext` with `tenantId` from job data before invoking handler | **BDD:** A job enqueued with `tenantId: 'A'` produces logs with `tenantId: 'A'` even when processed on a worker shared with other tenants | **Deep Module:** `createWorker` encapsulates context restoration, error handling, and metrics.

#### Subtasks
- [ ] **PH2.3.1** [AGENT] Scaffold `packages/firm-queue/package.json` and `tsconfig.json`.
- [ ] **PH2.3.2** [AGENT] Implement `createQueue<T>(name, options)`. File: `packages/firm-queue/src/queue.ts`.
- [ ] **PH2.3.3** [AGENT] Implement `enqueue(tenantId, data, options?)`. File: `packages/firm-queue/src/queue.ts`.
- [ ] **PH2.3.4** [AGENT] Implement `createWorker<T>(queueName, handler, options)` with context restoration. File: `packages/firm-queue/src/worker.ts`.
- [ ] **PH2.3.5** [AGENT] Implement `createScheduler(queueName)`. File: `packages/firm-queue/src/scheduler.ts`.
- [ ] **PH2.3.6** [AGENT] Add Prometheus metrics and `queueHealthCheck()`. Files: `packages/firm-queue/src/metrics.ts`, `packages/firm-queue/src/health.ts`.
- [ ] **PH2.3.7** [AGENT] Write tests. File: `packages/firm-queue/tests/`.

***

### PH2.4 – Build `firm-provisioning`
- [ ] **PH2.4** | Status: Not Started

**Related files:** `packages/firm-provisioning/src/`

**Definition of Done:**
- `provisionAgency(data)` saga: creates agency row, default sub-account, default roles, seeds quota limits, provisions Redis namespace, emits `agency.provisioned` event.
- `provisionSubAccount(agencyId, data)` saga: creates sub-account row, inherits parent roles, seeds quota limits, emits `sub_account.provisioned` event.
- `deprovisionTenant(tenantId)` GDPR erasure saga: soft-deletes all tenant data, calls `firm-search.deleteIndex(tenantId)`, `firm-ai-memory.erase(tenantId)`, `firm-consent` erasure, emits `tenant.deprovisioned` event. Idempotent — safe to retry.
- `TenantLifecycleEvent` domain events published via `firm-bus`.
- Tests: full provision → deprovision round-trip; idempotent deprovision.

**Out of Scope:** White-label config (Phase 4 `firm-white-label`); onboarding flows (Phase 5 `firm-onboarding`). **Rules:** All provisioning operations must be idempotent; GDPR erasure saga must complete within SLA; all steps wrapped in compensating transactions. **Anti-Patterns:** No provisioning that cannot be rolled back; no GDPR erasure that leaves orphaned data. **DDD:** Provisioning is a core domain process in the tenancy bounded context | **TDD:** Provisioning same agency twice returns existing record (idempotent); deprovision soft-deletes all scoped tables | **BDD:** When an agency is provisioned, the first sub-account is immediately available for login — no manual post-provisioning steps | **Deep Module:** `provisionAgency` encapsulates all saga steps, compensating transactions, and event emission.

#### Subtasks
- [ ] **PH2.4.1** [AGENT] Scaffold `packages/firm-provisioning/package.json` and `tsconfig.json`.
- [ ] **PH2.4.2** [AGENT] Implement `provisionAgency(data)` saga. File: `packages/firm-provisioning/src/agency.ts`.
- [ ] **PH2.4.3** [AGENT] Implement `provisionSubAccount(agencyId, data)` saga. File: `packages/firm-provisioning/src/sub-account.ts`.
- [ ] **PH2.4.4** [AGENT] Implement `deprovisionTenant(tenantId)` GDPR erasure saga (idempotent). File: `packages/firm-provisioning/src/erasure.ts`.
- [ ] **PH2.4.5** [AGENT] Publish `TenantLifecycleEvent` events via `firm-bus`. File: `packages/firm-provisioning/src/events.ts`.
- [ ] **PH2.4.6** [AGENT] Write tests: idempotent provision, deprovision round-trip. File: `packages/firm-provisioning/tests/`.

***

### PH2.5 – Build `firm-audit`
- [ ] **PH2.5** | Status: Not Started

**Related files:** `packages/firm-audit/src/`

**Definition of Done:**
- `logAuditEvent(tenantId, event): Promise<void>` — append-only write to `firm_audit_log` table; never throws (fire-and-forget with internal error logging).
- Audit events: `auth.*`, `permission.*`, `data.export`, `data.delete`, `api_key.*`, `impersonation.*`, `consent.*`, `ip.allowlist.violation`.
- `queryAuditLog(tenantId, filters)` — paginated read with RLS enforced.
- `firm-consent` consent-change stub (PH1.25.5) wired.
- `firm-ip-allowlist` violation stub (PH1.39.4) wired.
- Retention policy: configurable per-tenant; default 90 days; purge job registered in `firm-queue`.
- CI Gate 13 (Audit Coverage): all auth and permission operations must call `logAuditEvent`; AST gate verifies.
- Tests: append-only (update/delete on `firm_audit_log` rejected), RLS enforcement, retention purge.

**Out of Scope:** Audit log UI (Phase 5). **Rules:** Audit log is append-only — no updates or deletes except retention purge; never block business operations on audit failure; all `auth.*` and `permission.*` operations must be audited (enforced by Gate 13). **Anti-Patterns:** No `await logAuditEvent` in hot paths — fire-and-forget; no audit log entries writable by application code outside `firm-audit`. **DDD:** Audit is a compliance domain service | **TDD:** `logAuditEvent` never throws even if DB is down; `queryAuditLog` applies RLS and returns only the calling tenant's records | **BDD:** An admin action performed by User A is visible in the audit log when queried by a platform admin — and invisible when queried by a different agency admin | **Deep Module:** `logAuditEvent` hides all append-only enforcement, retry logic, and RLS policy.

#### Subtasks
- [ ] **PH2.5.1** [AGENT] Scaffold `packages/firm-audit/package.json` and `tsconfig.json`.
- [ ] **PH2.5.2** [AGENT] Implement `logAuditEvent(tenantId, event)` (fire-and-forget, never throws). File: `packages/firm-audit/src/log.ts`.
- [ ] **PH2.5.3** [AGENT] Implement `queryAuditLog(tenantId, filters)` with RLS. File: `packages/firm-audit/src/query.ts`.
- [ ] **PH2.5.4** [AGENT] Wire `firm-consent` consent-change stub and `firm-ip-allowlist` violation stub. Files: `packages/firm-audit/src/log.ts`.
- [ ] **PH2.5.5** [AGENT] Implement retention policy purge job registered in `firm-queue`. File: `packages/firm-audit/src/retention.ts`.
- [ ] **PH2.5.6** [AGENT] Implement CI Gate 13 (Audit Coverage AST gate). File: `scripts/ci/audit-coverage-gate.ts`; wire into `.github/workflows/ci.yml`.
- [ ] **PH2.5.7** [AGENT] Write tests: append-only enforcement, RLS, retention purge. File: `packages/firm-audit/tests/`.

***

### PH2.6 – Build `firm-gdpr`
- [ ] **PH2.6** | Status: Not Started

**Related files:** `packages/firm-gdpr/src/`

**Definition of Done:**
- `requestDataExport(tenantId, userId)` — queues async export job via `firm-queue`; returns `jobId`.
- `requestErasure(tenantId, userId)` — triggers `firm-provisioning.deprovisionTenant` erasure saga; returns `requestId`.
- `getRequestStatus(requestId)` — returns current state (queued, processing, complete, failed).
- Data subject request log: all requests persisted for regulator audit.
- 30-day completion SLA enforced: overdue requests emit `gdpr.sla_breach` event via `firm-bus`.
- Tests: export job enqueued, erasure triggers provisioning saga, SLA breach event fired.

**Out of Scope:** Data export file generation (handled by `firm-export` in Phase 6); consent management (handled by `firm-consent`). **Rules:** Data subject requests must be logged before processing begins; SLA monitoring must be automated — no manual tracking. **Anti-Patterns:** No processing erasure requests synchronously; no SLA tracking via calendar reminders. **DDD:** GDPR compliance is a regulatory domain service | **TDD:** Export request creates queue job and persisted request record; overdue request (mock clock) emits `gdpr.sla_breach` | **BDD:** A user submitting a data erasure request receives a `requestId` and the erasure completes (or fails with audit trail) within 30 days | **Deep Module:** `requestErasure` coordinates provisioning saga, audit logging, and SLA monitoring behind one call.

#### Subtasks
- [ ] **PH2.6.1** [AGENT] Scaffold `packages/firm-gdpr/package.json` and `tsconfig.json`.
- [ ] **PH2.6.2** [AGENT] Implement `requestDataExport`, `requestErasure`, `getRequestStatus`. File: `packages/firm-gdpr/src/requests.ts`.
- [ ] **PH2.6.3** [AGENT] Implement data subject request persistence. File: `packages/firm-gdpr/src/store.ts`.
- [ ] **PH2.6.4** [AGENT] Implement 30-day SLA monitor with `gdpr.sla_breach` event emission. File: `packages/firm-gdpr/src/sla.ts`.
- [ ] **PH2.6.5** [AGENT] Write tests. File: `packages/firm-gdpr/tests/`.

***

### PH2.7 – Build `firm-api-gateway`
- [ ] **PH2.7** | Status: Not Started

**Related files:** `packages/firm-api-gateway/src/`

**Definition of Done:**
- Request pipeline (in order): IP allowlist check → tenant resolution → auth verification → rate limit → request context setup → route dispatch.
- `resolveTenant(request)` — resolves `tenantId` from subdomain, custom domain, or JWT claim; caches in Redis.
- tRPC adapter: mounts all domain sub-routers from `firm-api-contracts`.
- REST adapter: OpenAPI spec auto-generated from tRPC router types.
- `createApiGateway(options)` factory for Next.js Route Handler and Hono.
- `firm-logging-middleware` wired for request logging.
- Tests: tenant resolution, pipeline short-circuit on auth failure, rate limit rejection.

**Out of Scope:** GraphQL gateway; API versioning beyond semver headers. **Rules:** Pipeline must short-circuit immediately on any rejection — no partial execution; tenant must be resolved before any business logic; rate limiting applied after auth to enable per-tenant policies. **Anti-Patterns:** No business logic in the gateway; no skipping any pipeline stage. **DDD:** API gateway is infrastructure | **TDD:** Request without valid JWT returns 401 before reaching route handler; IP-blocked request returns 403 before auth check | **BDD:** A valid request from a custom domain `agency.acme.com` resolves to the correct `tenantId` and reaches the handler within p95 < 50ms | **Deep Module:** `createApiGateway` encapsulates the entire request pipeline; route handlers never need to perform auth or tenant resolution.

#### Subtasks
- [ ] **PH2.7.1** [AGENT] Scaffold `packages/firm-api-gateway/package.json` and `tsconfig.json`.
- [ ] **PH2.7.2** [AGENT] Implement `resolveTenant(request)` with Redis caching. File: `packages/firm-api-gateway/src/tenant.ts`.
- [ ] **PH2.7.3** [AGENT] Implement request pipeline (IP → tenant → auth → rate limit → context → route). File: `packages/firm-api-gateway/src/pipeline.ts`.
- [ ] **PH2.7.4** [AGENT] Mount tRPC domain sub-routers. File: `packages/firm-api-gateway/src/trpc.ts`.
- [ ] **PH2.7.5** [AGENT] Implement OpenAPI spec auto-generation. File: `packages/firm-api-gateway/src/openapi.ts`.
- [ ] **PH2.7.6** [AGENT] Implement `createApiGateway(options)` factory for Next.js and Hono. File: `packages/firm-api-gateway/src/index.ts`.
- [ ] **PH2.7.7** [AGENT] Wire `firm-logging-middleware`. File: `packages/firm-api-gateway/src/pipeline.ts`.
- [ ] **PH2.7.8** [AGENT] Write tests. File: `packages/firm-api-gateway/tests/`.

***

## Phase 2.5: Infrastructure Provisioning

*Provision all external infrastructure. No Phase 3 work begins until all GAP infra tasks are verified in staging.*

***

### PH2.5.1 – PostgreSQL RLS setup and verification (GAP-1)
- [ ] **PH2.5.1** | Status: Not Started | ⚠️ **Security — highest priority infra**

**Related files:** `infra/regions/us-east-1/`, `infra/regions/eu-west-1/`, `packages/firm-db-schema/`

**Definition of Done:**
- PostgreSQL RLS enabled on all tenant-scoped tables via Drizzle `afterMigrate` hook — auto-applies default + parent-agency policies from `tenantScopedTables` registry. Hook is idempotent.
- `rlsHealthCheck()` in `firm-health` queries `pg_tables` for `rowsecurity=true`; any missing table blocks deployment.
- CI sibling isolation test: data written as Sub-Account A returns zero results queried as Sub-Account B (same parent).
- CI parent visibility test: agency admin reads sub-account rows; write attempt rejected.
- Both `infra/regions/us-east-1/` and `infra/regions/eu-west-1/` contain RLS configuration.

**Out of Scope:** PgBouncer (PH2.5.2); application-level row filtering — DB-level RLS only. **Rules:** Blueprint §4.4 — RLS enforced at PostgreSQL level, not only in application queries; `afterMigrate` hook must be idempotent. **Anti-Patterns:** No relying solely on application-level tenant filtering. **DDD:** RLS enforcement is infrastructure | **TDD:** Write sibling isolation test first — must fail before hook implemented, pass after | **BDD:** Querying any tenant-scoped table as Sub-Account B returns zero rows created by Sub-Account A, even via direct SQL bypassing the ORM | **Deep Module:** `afterMigrate` hook encapsulates all RLS policy application so no individual migration must remember to enable it.

#### Subtasks
- [ ] **PH2.5.1.1** [AGENT] Implement `afterMigrate` hook iterating `tenantScopedTables` and applying `ENABLE ROW LEVEL SECURITY` + default + parent-agency policies in a transaction. File: `packages/firm-db-schema/src/hooks/after-migrate.ts`.
- [ ] **PH2.5.1.2** [AGENT] Wire `rlsHealthCheck()` into `firm-health` readiness probe. File: `packages/firm-health/src/probes/rls.ts`.
- [ ] **PH2.5.1.3** [AGENT] Write CI sibling isolation test. File: `packages/firm-db-schema/tests/rls-sibling-isolation.test.ts`.
- [ ] **PH2.5.1.4** [AGENT] Write CI parent visibility test. File: `packages/firm-db-schema/tests/rls-parent-visibility.test.ts`.

***

### PH2.5.2 – PgBouncer configuration (GAP-2)
- [ ] **PH2.5.2** | Status: Not Started | ⚠️ **Security Fix 8 — highest severity**

**Related files:** `infra/regions/us-east-1/pgbouncer/`, `infra/regions/eu-west-1/pgbouncer/`, `packages/firm-db-client/`

**Definition of Done:**
- PgBouncer deployed in transaction-mode pooling in both regions; `server_reset_query = DISCARD ALL` confirmed.
- Pool size and max client connections documented per region.
- `firm-db-client.withTenantContext()` issues `DISCARD ALL` on connection release; verified against live PgBouncer in local-dev Docker Compose.
- PgBouncer eviction chaos test (`chaos/pgbouncer-eviction.ts`) passes — no cross-tenant data leak.

**Out of Scope:** Application-level RLS (PH2.5.1); connection string management (already in `firm-env`). **Rules:** Transaction mode mandatory — session mode is not acceptable; EU region config must meet GDPR Art. 32 data residency; no cross-region connection routing from EU. **Anti-Patterns:** No session-mode pooling; no skipping chaos test before onboarding EU tenants. **DDD:** Connection pooling is infrastructure | **TDD:** Chaos test `pgbouncer-eviction.ts` detects any cross-tenant leak | **BDD:** After a PgBouncer connection is returned to the pool and reassigned to a different tenant, the new request sees no trace of the previous tenant's `SET LOCAL` context | **Deep Module:** PgBouncer sits transparently between application and PostgreSQL; `DISCARD ALL` is the security contract.

#### Subtasks
- [ ] **PH2.5.2.1** [HUMAN] Configure PgBouncer in `infra/regions/us-east-1/pgbouncer/pgbouncer.ini` — transaction mode, `DISCARD ALL`, pool/connection limits.
- [ ] **PH2.5.2.2** [HUMAN] Configure PgBouncer in `infra/regions/eu-west-1/pgbouncer/pgbouncer.ini` — no cross-region routing.
- [ ] **PH2.5.2.3** [AGENT] Verify `firm-db-client.withTenantContext()` issues `DISCARD ALL` on release; add integration test against local-dev Docker Compose PgBouncer. File: `packages/firm-db-client/tests/pgbouncer-reset.test.ts`.
- [ ] **PH2.5.2.4** [AGENT] Execute PgBouncer eviction chaos test; record pass/fail. File: `chaos/pgbouncer-eviction.ts`.

***

### PH2.5.3 – Redis cluster setup (GAP-3)
- [ ] **PH2.5.3** | Status: Not Started

**Related files:** `infra/regions/us-east-1/redis/`, `infra/regions/eu-west-1/redis/`, `packages/firm-circuit-breaker/`, `packages/firm-rate-limiter/`, `packages/firm-cache/`

**Definition of Done:**
- Redis cluster (≥3-node Sentinel or Cluster mode) deployed in both regions; EU cluster has no cross-region replication.
- `firm-cache` Redlock configuration targets multi-node cluster endpoints from env vars.
- `firm-rate-limiter` fail-open behavior confirmed against simulated Redis outage in staging.
- `firm-circuit-breaker` Redis-backed per-tenant failure counts confirmed operational against the cluster.

**Out of Scope:** Application-level Redis usage patterns — provisioning and endpoint wiring only. **Rules:** Redlock requires ≥3 independent nodes; EU Redis must not replicate to US region. **Anti-Patterns:** No single-node Redis for distributed locks — split-brain on failover grants lock to two holders simultaneously. **DDD:** Redis is infrastructure | **TDD:** Fail-open test: simulate Redis outage during rate-limit check; assert request allowed and CRITICAL alert logged | **BDD:** When Redis is unreachable, `firm-rate-limiter` allows the request rather than blocking the platform | **Deep Module:** Cluster topology is infrastructure; `firm-cache`, `firm-rate-limiter`, `firm-circuit-breaker` see only endpoint env vars.

#### Subtasks
- [ ] **PH2.5.3.1** [HUMAN] Provision Redis cluster (≥3-node Sentinel or Cluster mode) in `infra/regions/us-east-1/redis/`.
- [ ] **PH2.5.3.2** [HUMAN] Provision Redis cluster in `infra/regions/eu-west-1/redis/` — no cross-region replication.
- [ ] **PH2.5.3.3** [AGENT] Update `firm-cache` Redlock config to reference multi-node cluster endpoints. File: `packages/firm-cache/src/lock.ts`.
- [ ] **PH2.5.3.4** [AGENT] Write fail-open integration test for `firm-rate-limiter` against simulated Redis outage. File: `packages/firm-rate-limiter/tests/fail-open.test.ts`.

***

### PH2.5.4 – OpenTelemetry Collector deployment (GAP-4)
- [ ] **PH2.5.4** | Status: Not Started

**Related files:** `infra/shared/otel/`, `packages/firm-observability/`, `packages/firm-health/`

**Definition of Done:**
- OTel Collector deployed in `infra/shared/otel/` with OTLP receiver, Prometheus exporter, Loki and Tempo exporters configured.
- `OTEL_EXPORTER_OTLP_ENDPOINT` set in all worker and app environment configs.
- `observabilityHealthCheck()` emits a test span and verifies receipt via collector `/metrics` endpoint.
- CI Gate 17 (Observability Instrumentation) is activatable in Phase 3 once this task is complete.

**Out of Scope:** Grafana dashboards (Phase 8); Sentry DSN configuration. **Rules:** Readiness probe must fail if OTel SDK not exporting spans; document per-region vs. shared collector decision. **Anti-Patterns:** No hardcoded OTLP endpoint — always read from `OTEL_EXPORTER_OTLP_ENDPOINT`; no deploying without readiness probe span verification. **DDD:** Observability infrastructure is cross-cutting | **TDD:** `observabilityHealthCheck()` fails in tests if env var not set or mock collector not running | **BDD:** After deploy, readiness probe emits a test span; if no acknowledgment received within timeout, traffic is not routed to the pod | **Deep Module:** OTel Collector decouples the SDK from the backend (Tempo, Prometheus, Loki).

#### Subtasks
- [ ] **PH2.5.4.1** [HUMAN] Deploy OTel Collector with OTLP receiver, Prometheus exporter, Loki/Tempo exporters. File: `infra/shared/otel/otel-collector-config.yaml`.
- [ ] **PH2.5.4.2** [AGENT] Set `OTEL_EXPORTER_OTLP_ENDPOINT` in all worker and app environment configs and Kubernetes manifests.
- [ ] **PH2.5.4.3** [AGENT] Ensure `observabilityHealthCheck()` emits a test span and verifies receipt. File: `packages/firm-health/src/probes/observability.ts`.

***

### PH2.5.5 – Kubernetes manifests and readiness wiring (GAP-5)
- [ ] **PH2.5.5** | Status: Not Started

**Related files:** `infra/regions/us-east-1/k8s/`, `infra/regions/eu-west-1/k8s/`, `workers/`, `apps/`

**Definition of Done:**
- K8s `Deployment` manifests for all workers include `livenessProbe` and `readinessProbe` targeting `firm-health` endpoints.
- All pod specs: `runAsUser: ≥10000`, `runAsNonRoot: true` (matching `firm-config-docker`).
- Rolling strategy: `maxUnavailable: 0`, `maxSurge: 1`.
- Namespace-level resource quotas applied per region.
- `Service` and `HorizontalPodAutoscaler` manifests for all worker types.
- CI check fails if any manifest violates non-root security context.

**Out of Scope:** Full IaC (Terraform/Pulumi); CD pipeline triggering deploys (Phase 8). **Rules:** Load balancer must query `/health/readiness` after every deploy; `infra/` must have regional subdirectories. **Anti-Patterns:** No hardcoded image tags in manifests; no containers running as root. **DDD:** K8s manifests are infrastructure | **TDD:** `kubectl apply --dry-run=client` passes all manifests; pod security context verified | **BDD:** After a new image is deployed, Kubernetes only routes traffic to pods whose readiness probe returns `200 OK` | **Deep Module:** Base `Deployment` template centralises security posture; worker overlays specify only image and replica count.

#### Subtasks
- [ ] **PH2.5.5.1** [HUMAN] Create K8s namespace and RBAC in `infra/regions/us-east-1/k8s/` and `infra/regions/eu-west-1/k8s/`.
- [ ] **PH2.5.5.2** [AGENT] Create base `Deployment` template with probes and non-root security context. File: `infra/k8s/base/deployment.yaml`.
- [ ] **PH2.5.5.3** [AGENT] Create `Service` and `HorizontalPodAutoscaler` manifests for all worker types. File: `infra/k8s/base/`.
- [ ] **PH2.5.5.4** [AGENT] Add CI check for non-root security context violations. File: `scripts/ci/pod-security-check.ts`.

***

### PH2.6 – CI gates: RLS coverage (GAP-7), AI content approval bypass (GAP-8), `satisfies` conformance (GAP-9)
- [ ] **PH2.6** | Status: Not Started

**Related files:** `scripts/ci/rls-coverage-gate.ts`, `scripts/ci/ai-content-approval-gate.ts`, `scripts/ci/satisfies-conformance.ts`, `.github/workflows/ci.yml`

**Definition of Done:**
- **Gate 10–12 (RLS coverage, `rls-coverage-gate.ts`):** Inspects every `CREATE TABLE` in PRs touching `firm-db-schema` migrations; fails if `ENABLE ROW LEVEL SECURITY`, `CREATE POLICY` (default + parent-agency), or a corresponding `*.isolation.test.ts` are absent from the same PR. Fixtures: migration without RLS (fail), migration with RLS + test (pass).
- **Gate `New2` (AI content approval bypass, `ai-content-approval-gate.ts`):** AST scan of all L6 packages; fails if any code path sets `ai_generation_log.status = 'approved'` directly via Drizzle or raw SQL — only `approveContent()` in `firm-ai-content` may do this. Active from Phase 4. Fixtures: direct assignment (fail), `approveContent()` call (pass).
- **Gate 9 (`satisfies` conformance, `satisfies-conformance.ts`):** Generates ephemeral `conformance.ts` with `schema satisfies SchemaType` for every registered schema/interface pair; runs `tsc --noEmit`; fails if any pair mismatches. Active from Phase 1 completion.

**Out of Scope:** Gate implementations internal to individual packages. **Rules:** All gates use AST traversal (`ts-morph`) not regex; generated conformance file must not be committed. **Anti-Patterns:** No regex-matching on source files for gate logic; no committing generated conformance file. **DDD:** CI gates are process automation | **TDD:** Each gate has a violating fixture (must fail) and a compliant fixture (must pass) | **BDD:** A developer adding `CREATE TABLE` without RLS sees the build fail immediately with the file and line identified | **Deep Module:** Each gate script encapsulates all AST traversal complexity; CI config calls `ts-node scripts/ci/<gate>.ts` only.

#### Subtasks
- [ ] **PH2.6.1** [AGENT] Implement `scripts/ci/rls-coverage-gate.ts` — SQL migration parse, RLS statement check, test file check. Wire as Gates 10–12.
- [ ] **PH2.6.2** [AGENT] Write RLS gate fixtures: missing RLS (fail), RLS + test file (pass). File: `scripts/ci/tests/rls-coverage-gate.test.ts`.
- [ ] **PH2.6.3** [AGENT] Implement `scripts/ci/ai-content-approval-gate.ts` — AST scan for direct `status = 'approved'` assignments. Wire as Gate `New2`, active from Phase 4.
- [ ] **PH2.6.4** [AGENT] Write AI approval gate fixtures: direct assignment (fail), `approveContent()` call (pass). File: `scripts/ci/tests/ai-content-approval-gate.test.ts`.
- [ ] **PH2.6.5** [AGENT] Implement `scripts/ci/satisfies-conformance.ts` — generate ephemeral `conformance.ts`, run `tsc --noEmit`. Wire as Gate 9, activate now.

***

### PH2.7 – Phase 2 acceptance criteria verification
- [ ] **PH2.7** | Status: Not Started | **Final Phase 2 gate**

**Definition of Done:**
- All Phase 2 packages build and pass tests on `main`.
- Gates 10–12, New1, New2, Gate 9 all passing.
- PgBouncer chaos test passed in staging (`chaos/pgbouncer-eviction.ts`).
- Redis fail-open test passed in staging.
- RLS sibling isolation test and parent visibility test passing in CI.
- OTel Collector receiving spans from all workers in staging.
- K8s manifests pass `kubectl apply --dry-run=client` and pod security CI check.
- Coverage ≥80% on all Phase 2 packages.

**Out of Scope:** Phase 3 work. **Rules:** No Phase 3 work begins until all criteria met and verified in CI on `main`. **Anti-Patterns:** No declaring Phase 2 complete on local builds only.

#### Subtasks
- [ ] **PH2.7.1** [AGENT] Run full test suite; confirm all Phase 2 packages ≥80% coverage.
- [ ] **PH2.7.2** [HUMAN] Confirm PgBouncer chaos test, Redis fail-open test, and OTel span verification passed in staging.
- [ ] **PH2.7.3** [HUMAN] Sign off Phase 2 complete; tag release `v0.2.0-infrastructure`.

***

## Phase 3: Adapter Layer

*Build all L7 adapter implementations. Adapters may be built in parallel. No Phase 4 feature packages may start until Phase 3 acceptance criteria are met.*

***

### PH3.1 – Build email adapters: SendGrid, Postmark, Resend
- [ ] **PH3.1** | Status: Not Started

**Related files:** `packages/firm-adapters-email-sendgrid/`, `packages/firm-adapters-email-postmark/`, `packages/firm-adapters-email-resend/`

**Definition of Done:**
- All three implement `EmailPort` exactly; each has a conformance test verifying all Port methods.
- `firm-circuit-breaker` wraps all provider calls.
- All provider errors mapped to `FirmError` subtypes.
- In-memory stub (`src/stub.ts`) for use in unit tests.
- Credentials read from `firm-env` only — never hardcoded.

**Out of Scope:** Email template rendering (handled by `firm-template-engine`). **Rules:** Implement `EmailPort` only — no extra public methods; all errors mapped to `FirmError`; circuit breaker mandatory. **Anti-Patterns:** No hardcoded credentials; no catching and swallowing provider errors. **DDD:** Adapters are infrastructure | **TDD:** Conformance test: happy path returns `Result<EmailSent>`; provider error maps to `FirmError` | **BDD:** N/A | **Deep Module:** N/A

#### Subtasks
- [ ] **PH3.1.1** [AGENT] Scaffold and implement `packages/firm-adapters-email-sendgrid/` — `EmailPort` implementation, circuit breaker, error mapping, stub, conformance test.
- [ ] **PH3.1.2** [AGENT] Scaffold and implement `packages/firm-adapters-email-postmark/` — same structure.
- [ ] **PH3.1.3** [AGENT] Scaffold and implement `packages/firm-adapters-email-resend/` — same structure.

***

### PH3.2 – Build SMS adapters: Twilio, Vonage
- [ ] **PH3.2** | Status: Not Started

**Related files:** `packages/firm-adapters-sms-twilio/`, `packages/firm-adapters-sms-vonage/`

**Definition of Done:**
- Both implement `SMSPort`; conformance tests; circuit breaker; error mapping; stubs; credentials from `firm-env`.

#### Subtasks
- [ ] **PH3.2.1** [AGENT] Scaffold and implement `packages/firm-adapters-sms-twilio/`.
- [ ] **PH3.2.2** [AGENT] Scaffold and implement `packages/firm-adapters-sms-vonage/`.

***

### PH3.3 – Build storage adapters: S3, R2, GCS
- [ ] **PH3.3** | Status: Not Started

**Related files:** `packages/firm-adapters-storage-s3/`, `packages/firm-adapters-storage-r2/`, `packages/firm-adapters-storage-gcs/`

**Definition of Done:**
- All three implement `StoragePort`; conformance tests; circuit breaker; error mapping; stubs; multipart upload support; presigned URL generation; credentials from `firm-env`.

#### Subtasks
- [ ] **PH3.3.1** [AGENT] Scaffold and implement `packages/firm-adapters-storage-s3/`.
- [ ] **PH3.3.2** [AGENT] Scaffold and implement `packages/firm-adapters-storage-r2/`.
- [ ] **PH3.3.3** [AGENT] Scaffold and implement `packages/firm-adapters-storage-gcs/`.

***

### PH3.4 – Build payment adapters: Stripe, NMI
- [ ] **PH3.4** | Status: Not Started

**Related files:** `packages/firm-adapters-payment-stripe/`, `packages/firm-adapters-payment-nmi/`

**Definition of Done:**
- Both implement `PaymentPort`; conformance tests; circuit breaker; error mapping; stubs; idempotency keys on all charge operations; SCA (3DS2) support on Stripe adapter.

#### Subtasks
- [ ] **PH3.4.1** [AGENT] Scaffold and implement `packages/firm-adapters-payment-stripe/` — includes SCA, webhook event parsing, idempotency keys.
- [ ] **PH3.4.2** [AGENT] Scaffold and implement `packages/firm-adapters-payment-nmi/`.

***

### PH3.5 – Build CRM sync adapters: GoHighLevel, HubSpot, Salesforce
- [ ] **PH3.5** | Status: Not Started

**Related files:** `packages/firm-adapters-crm-gohighlevel/`, `packages/firm-adapters-crm-hubspot/`, `packages/firm-adapters-crm-salesforce/`

**Definition of Done:**
- All three implement `CRMSyncPort`; conformance tests; circuit breaker; error mapping; stubs; OAuth token refresh handled transparently.

#### Subtasks
- [ ] **PH3.5.1** [AGENT] Scaffold and implement `packages/firm-adapters-crm-gohighlevel/`.
- [ ] **PH3.5.2** [AGENT] Scaffold and implement `packages/firm-adapters-crm-hubspot/`.
- [ ] **PH3.5.3** [AGENT] Scaffold and implement `packages/firm-adapters-crm-salesforce/`.

***

### PH3.6 – Build calendar adapters: Google Calendar, Outlook
- [ ] **PH3.6** | Status: Not Started

**Related files:** `packages/firm-adapters-calendar-google/`, `packages/firm-adapters-calendar-outlook/`

**Definition of Done:**
- Both implement `CalendarPort`; conformance tests; circuit breaker; error mapping; stubs; OAuth token refresh; timezone-safe datetime handling (UTC storage, local display via `firm-i18n`).

#### Subtasks
- [ ] **PH3.6.1** [AGENT] Scaffold and implement `packages/firm-adapters-calendar-google/`.
- [ ] **PH3.6.2** [AGENT] Scaffold and implement `packages/firm-adapters-calendar-outlook/`.

***

### PH3.7 – Build video conferencing adapters: Zoom, Google Meet
- [ ] **PH3.7** | Status: Not Started

**Related files:** `packages/firm-adapters-video-zoom/`, `packages/firm-adapters-video-googlemeet/`

**Definition of Done:**
- Both implement `VideoConferencingPort`; conformance tests; circuit breaker; error mapping; stubs; OAuth token refresh.

#### Subtasks
- [ ] **PH3.7.1** [AGENT] Scaffold and implement `packages/firm-adapters-video-zoom/`.
- [ ] **PH3.7.2** [AGENT] Scaffold and implement `packages/firm-adapters-video-googlemeet/`.

***

### PH3.8 – Build DNS adapters: Cloudflare, Route53 (GAP from UPDATES.md)
- [ ] **PH3.8** | Status: Not Started

**Related files:** `packages/firm-adapters-dns-cloudflare/`, `packages/firm-adapters-dns-route53/`

**Definition of Done:**
- Both implement `DNSPort`; conformance tests; circuit breaker; error mapping; stubs; credentials from `firm-env`.

#### Subtasks
- [ ] **PH3.8.1** [AGENT] Scaffold and implement `packages/firm-adapters-dns-cloudflare/`.
- [ ] **PH3.8.2** [AGENT] Scaffold and implement `packages/firm-adapters-dns-route53/`.

***

### PH3.9 – Build vector store adapters: pgvector, Pinecone, Qdrant (GAP from UPDATES.md)
- [ ] **PH3.9** | Status: Not Started

**Related files:** `packages/firm-adapters-vectorstore-pgvector/`, `packages/firm-adapters-vectorstore-pinecone/`, `packages/firm-adapters-vectorstore-qdrant/`

**Definition of Done:**
- All three implement `VectorStorePort`; conformance tests; circuit breaker; error mapping; stubs; tenant-isolated namespace/collection per adapter.

#### Subtasks
- [ ] **PH3.9.1** [AGENT] Scaffold and implement `packages/firm-adapters-vectorstore-pgvector/`.
- [ ] **PH3.9.2** [AGENT] Scaffold and implement `packages/firm-adapters-vectorstore-pinecone/`.
- [ ] **PH3.9.3** [AGENT] Scaffold and implement `packages/firm-adapters-vectorstore-qdrant/`.

***

### PH3.10 – Build short URL / QR adapters and consent GTM adapter (GAP from UPDATES.md)
- [ ] **PH3.10** | Status: Not Started

**Related files:** `packages/firm-adapters-shorturl-custom/`, `packages/firm-adapters-qr-generator/`, `packages/firm-adapters-consent-gtm/`

**Definition of Done:**
- `firm-adapters-shorturl-custom`: implements `ShortUrlPort`; generates branded short URLs with click-tracking hooks; conformance test; stub.
- `firm-adapters-qr-generator`: implements `QRCodePort`; generates PNG/SVG QR codes with tenant branding; conformance test; stub.
- `firm-adapters-consent-gtm`: implements GTM Consent Mode v3 data layer push; wires to `firm-consent.consentToGtag()`; conformance test.

#### Subtasks
- [ ] **PH3.10.1** [AGENT] Scaffold and implement `packages/firm-adapters-shorturl-custom/`.
- [ ] **PH3.10.2** [AGENT] Scaffold and implement `packages/firm-adapters-qr-generator/`.
- [ ] **PH3.10.3** [AGENT] Scaffold and implement `packages/firm-adapters-consent-gtm/` — wire `consentToGtag()` from `firm-consent`.

***

### PH3.11 – Build `firm-template-engine`
- [ ] **PH3.11** | Status: Not Started | **Blocked by ADR-008 (PH1.2.9)**

**Related files:** `packages/firm-template-engine/src/`

**Definition of Done:**
- ADR-008 accepted before implementation (Liquid for email/SMS; Handlebars for PDF).
- `renderEmail(templateId, vars, tenantId)` — Liquid rendering with sub-account branding override.
- `renderSMS(templateId, vars, tenantId)` — Liquid, 160-char segment counter, Unicode detection.
- `renderPDF(templateId, vars, tenantId)` — Handlebars → HTML → Puppeteer PDF.
- Template storage: per-tenant versioned templates in DB; fallback to platform defaults.
- Sandbox: templates cannot access `process.env` or execute arbitrary code.
- Tests: branding override, 160-char segmentation, sandbox escape attempt rejected, PDF render.

**Out of Scope:** Template authoring UI (Phase 5). **Rules:** ADR-008 must be accepted first; templates must be sandboxed; no access to `process.env` from templates. **Anti-Patterns:** No unsandboxed template execution; no hardcoded template strings in email workers. **DDD:** Template rendering is a supporting infrastructure service | **TDD:** Sandbox test: template accessing `process.env` throws `SandboxViolationError` | **BDD:** An agency's custom email template overrides the platform default for all their sub-accounts' outbound emails | **Deep Module:** `renderEmail(templateId, vars, tenantId)` hides engine selection, sandbox enforcement, and branding resolution.

#### Subtasks
- [ ] **PH3.11.1** [HUMAN] Confirm ADR-008 accepted. File: `docs/adr/0008-template-engine-choice.md`.
- [ ] **PH3.11.2** [AGENT] Scaffold `packages/firm-template-engine/package.json` and `tsconfig.json`.
- [ ] **PH3.11.3** [AGENT] Implement `renderEmail` (Liquid, branding override). File: `packages/firm-template-engine/src/email.ts`.
- [ ] **PH3.11.4** [AGENT] Implement `renderSMS` (Liquid, 160-char segment counter, Unicode detection). File: `packages/firm-template-engine/src/sms.ts`.
- [ ] **PH3.11.5** [AGENT] Implement `renderPDF` (Handlebars → HTML → Puppeteer). File: `packages/firm-template-engine/src/pdf.ts`.
- [ ] **PH3.11.6** [AGENT] Implement per-tenant versioned template storage and platform fallback. File: `packages/firm-template-engine/src/store.ts`.
- [ ] **PH3.11.7** [AGENT] Implement sandbox enforcement. File: `packages/firm-template-engine/src/sandbox.ts`.
- [ ] **PH3.11.8** [AGENT] Write tests. File: `packages/firm-template-engine/tests/`.

***

### PH3.12 – Build `firm-c2pa` (NY Synthetic Performer C2PA manifest) ⚠️ DEADLINE
- [ ] **PH3.12** | Status: Not Started | ⚠️ **Aug 2 deadline**

**Related files:** `packages/firm-c2pa/src/`, `packages/firm-db-schema/src/ai-generation-log.ts`

**Definition of Done:**
- `generateManifest(contentId, agencyId, modelId, generatedAt)` — produces a C2PA-compliant manifest and writes it to `ai_generation_log.c2pa_manifest`.
- `verifyManifest(contentId)` — validates manifest integrity.
- `firm-audit` event `c2pa.manifest.generated` logged on each generation.
- All AI-generated content written after Aug 2 must have a manifest; CI Gate enforces.
- Tests: valid manifest generation, verification pass, verification fail (tampered).

**Out of Scope:** `firm-ai-content` package (Phase 4); UI display of C2PA provenance badge. **Rules:** C2PA manifest must be generated atomically with content save — no content without manifest after Aug 2; `generateManifest` must be idempotent. **Anti-Patterns:** No deferring manifest generation to a background job — it must be synchronous with the content write. **DDD:** C2PA compliance is a regulatory infrastructure concern | **TDD:** `generateManifest` writes to `ai_generation_log.c2pa_manifest`; tampered manifest fails `verifyManifest` | **BDD:** Any AI-generated image saved after Aug 2 has a C2PA manifest viewable via content credentials | **Deep Module:** `generateManifest` hides all C2PA signing and DB write coordination.

#### Subtasks
- [ ] **PH3.12.1** [AGENT] Scaffold `packages/firm-c2pa/package.json` and `tsconfig.json`.
- [ ] **PH3.12.2** [AGENT] Implement `generateManifest(contentId, agencyId, modelId, generatedAt)`. File: `packages/firm-c2pa/src/manifest.ts`.
- [ ] **PH3.12.3** [AGENT] Implement `verifyManifest(contentId)`. File: `packages/firm-c2pa/src/verify.ts`.
- [ ] **PH3.12.4** [AGENT] Wire `firm-audit` event `c2pa.manifest.generated`. File: `packages/firm-c2pa/src/manifest.ts`.
- [ ] **PH3.12.5** [AGENT] Write tests. File: `packages/firm-c2pa/tests/`.

***

### PH3.13 – Phase 3 acceptance criteria verification
- [ ] **PH3.13** | Status: Not Started | **Final Phase 3 gate**

**Definition of Done:**
- All Phase 3 adapters have conformance tests passing on `main`.
- All adapters have in-memory stubs usable in unit tests.
- Gate 17 (Observability Instrumentation) activated: every new package must export at least one OTel span or metric.
- Gate New2 (AI content approval bypass) activated.
- `firm-template-engine` sandbox escape test passing.
- `firm-c2pa` manifest generation test passing.
- Coverage ≥80% on all Phase 3 packages.

#### Subtasks
- [ ] **PH3.13.1** [AGENT] Activate Gate 17 (Observability Instrumentation) in `.github/workflows/ci.yml`.
- [ ] **PH3.13.2** [AGENT] Activate Gate New2 (AI content approval bypass) in `.github/workflows/ci.yml`.
- [ ] **PH3.13.3** [AGENT] Run full test suite; confirm all Phase 3 packages ≥80% coverage.
- [ ] **PH3.13.4** [HUMAN] Sign off Phase 3 complete; tag release `v0.3.0-adapters`.

***

---

## Phase 4: Feature Packages — Tier A

*Build all L6 Tier A feature packages. These are the core platform primitives required by all Tier B–D features. May be built in parallel within the phase.*

***

### PH4.1 – Build `firm-domain-manager`
- [ ] **PH4.1** | Status: Not Started

**Related files:** `packages/firm-domain-manager/src/`

**Definition of Done:**
- `verifyDomain(tenantId, domain)` — initiates DNS TXT record verification challenge; polls until verified or timeout.
- `provisionSSL(tenantId, domain)` — triggers Let's Encrypt / provider SSL provisioning via `DNSPort` adapter injection.
- `routeDomain(domain)` → `tenantId` — reverse lookup with Redis caching; used by `firm-api-gateway` for tenant resolution.
- `deprovisionDomain(tenantId, domain)` — removes DNS records and revokes SSL; called by `firm-provisioning` erasure saga.
- `firm-audit` event `domain.verified`, `domain.provisioned`, `domain.deprovisioned` logged.
- Tests: DNS challenge generation, verification polling, routing lookup cache hit/miss, deprovision.

**Out of Scope:** White-label UI (Phase 4 `firm-white-label`); domain analytics. **Rules:** SSL provisioning is async — never block the request thread; `routeDomain` must never return `null` — throw `DomainNotFoundError` instead; circuit breaker wraps all DNS adapter calls. **Anti-Patterns:** No synchronous SSL provisioning; no caching unverified domain → tenant mappings. **DDD:** Domain management is a supporting domain service for white-label | **TDD:** `routeDomain` returns correct `tenantId` from cache; cache miss falls through to DB; unregistered domain throws `DomainNotFoundError` | **BDD:** An agency adding `crm.acme.com` receives a TXT record challenge; after DNS propagation, the domain routes to their sub-account automatically | **Deep Module:** `verifyDomain` hides challenge generation, polling, and DNS adapter coordination.

#### Subtasks
- [ ] **PH4.1.1** [AGENT] Scaffold `packages/firm-domain-manager/package.json` and `tsconfig.json`.
- [ ] **PH4.1.2** [AGENT] Implement `verifyDomain(tenantId, domain)` — DNS TXT challenge, polling via `firm-queue`. File: `packages/firm-domain-manager/src/verify.ts`.
- [ ] **PH4.1.3** [AGENT] Implement `provisionSSL(tenantId, domain)` via `DNSPort` adapter. File: `packages/firm-domain-manager/src/ssl.ts`.
- [ ] **PH4.1.4** [AGENT] Implement `routeDomain(domain)` with Redis caching. File: `packages/firm-domain-manager/src/router.ts`.
- [ ] **PH4.1.5** [AGENT] Implement `deprovisionDomain(tenantId, domain)`; wire into `firm-provisioning` erasure saga. File: `packages/firm-domain-manager/src/deprovision.ts`.
- [ ] **PH4.1.6** [AGENT] Wire `firm-audit` events. File: `packages/firm-domain-manager/src/audit.ts`.
- [ ] **PH4.1.7** [AGENT] Write tests. File: `packages/firm-domain-manager/tests/`.

***

### PH4.2 – Build `firm-white-label`
- [ ] **PH4.2** | Status: Not Started | **Depends on PH4.1**

**Related files:** `packages/firm-white-label/src/`

**Definition of Done:**
- `getWhiteLabelConfig(tenantId)` — resolves branding config (logo, primary colour, fonts, favicon, custom CSS, email sender name/domain) with inheritance: sub-account → agency → platform default. Redis-cached.
- `setWhiteLabelConfig(tenantId, config)` — validates config, persists, invalidates cache, emits `white_label.config.updated` via `firm-bus`.
- `resolveTheme(tenantId)` — returns Tailwind CSS variable overrides for use in `firm-ui` theming.
- `getBrandedEmailSender(tenantId)` — returns verified sender identity for email adapters.
- Config inheritance merging: sub-account overrides are additive, not replacing.
- Tests: inheritance chain (sub → agency → platform), cache invalidation on update, branded sender resolution.

**Out of Scope:** White-label UI builder (Phase 6 `firm-client-portal-builder`). **Rules:** `getWhiteLabelConfig` must never return `null` — always falls back to platform defaults; cache must be invalidated atomically with DB write; branded email sender must be a verified domain from `firm-domain-manager`. **Anti-Patterns:** No hardcoded platform colours or logos; no serving unverified sender domains. **DDD:** White-label is a core domain service in the tenancy bounded context | **TDD:** Sub-account config with no logo falls back to agency logo, then platform logo; cache miss returns DB value | **BDD:** After an agency updates their primary colour, all new page loads for their sub-accounts reflect the change within one cache TTL | **Deep Module:** `getWhiteLabelConfig` hides the three-tier inheritance resolution and Redis caching.

#### Subtasks
- [ ] **PH4.2.1** [AGENT] Scaffold `packages/firm-white-label/package.json` and `tsconfig.json`.
- [ ] **PH4.2.2** [AGENT] Implement `getWhiteLabelConfig(tenantId)` with three-tier inheritance and Redis caching. File: `packages/firm-white-label/src/config.ts`.
- [ ] **PH4.2.3** [AGENT] Implement `setWhiteLabelConfig(tenantId, config)` with validation and cache invalidation. File: `packages/firm-white-label/src/config.ts`.
- [ ] **PH4.2.4** [AGENT] Implement `resolveTheme(tenantId)` returning Tailwind CSS variable overrides. File: `packages/firm-white-label/src/theme.ts`.
- [ ] **PH4.2.5** [AGENT] Implement `getBrandedEmailSender(tenantId)`. File: `packages/firm-white-label/src/email.ts`.
- [ ] **PH4.2.6** [AGENT] Write tests. File: `packages/firm-white-label/tests/`.

***

### PH4.3 – Build `firm-tenancy`
- [ ] **PH4.3** | Status: Not Started

**Related files:** `packages/firm-tenancy/src/`

**Definition of Done:**
- `getTenant(tenantId)` — fetches tenant record with plan tier, quota limits, feature flags, and white-label config ref; Redis-cached.
- `updateTenant(tenantId, patch)` — partial update with optimistic lock; invalidates cache; emits `tenant.updated`.
- `getTenantHierarchy(tenantId)` — returns `{ agency, subAccounts[] }` for platform admin use.
- `assertTenantActive(tenantId)` — throws `TenantSuspendedError` or `TenantNotFoundError`; used as middleware in API gateway.
- `suspendTenant(tenantId, reason)` / `reactivateTenant(tenantId)` — with `firm-audit` events.
- Tests: cache hit/miss, optimistic lock conflict, suspend/reactivate state machine, hierarchy resolution.

**Out of Scope:** Provisioning (PH2.4); billing plan changes (Phase 5). **Rules:** `assertTenantActive` must be called by `firm-api-gateway` on every request — never bypassed; optimistic lock must prevent concurrent patch conflicts. **Anti-Patterns:** No tenant-status check in individual feature packages — use `assertTenantActive` middleware only. **DDD:** Tenancy is a core domain aggregate | **TDD:** `assertTenantActive` throws `TenantSuspendedError` for suspended tenant; optimistic lock test: concurrent updates — second update fails with `ConflictError` | **BDD:** A suspended agency's sub-accounts receive `403 TenantSuspended` on all API calls without needing changes to any feature package | **Deep Module:** `getTenant` hides caching, plan tier resolution, and hierarchy traversal.

#### Subtasks
- [ ] **PH4.3.1** [AGENT] Scaffold `packages/firm-tenancy/package.json` and `tsconfig.json`.
- [ ] **PH4.3.2** [AGENT] Implement `getTenant(tenantId)` with Redis caching. File: `packages/firm-tenancy/src/tenant.ts`.
- [ ] **PH4.3.3** [AGENT] Implement `updateTenant(tenantId, patch)` with optimistic lock and cache invalidation. File: `packages/firm-tenancy/src/tenant.ts`.
- [ ] **PH4.3.4** [AGENT] Implement `getTenantHierarchy(tenantId)`. File: `packages/firm-tenancy/src/hierarchy.ts`.
- [ ] **PH4.3.5** [AGENT] Implement `assertTenantActive(tenantId)` and wire into `firm-api-gateway`. File: `packages/firm-tenancy/src/assert.ts`.
- [ ] **PH4.3.6** [AGENT] Implement `suspendTenant` / `reactivateTenant` with `firm-audit` events. File: `packages/firm-tenancy/src/lifecycle.ts`.
- [ ] **PH4.3.7** [AGENT] Write tests. File: `packages/firm-tenancy/tests/`.

***

### PH4.4 – Build `firm-vector-store`
- [ ] **PH4.4** | Status: Not Started

**Related files:** `packages/firm-vector-store/src/`

**Definition of Done:**
- `upsertVector(tenantId, namespace, id, vector, metadata)` — tenant-namespaced upsert via `VectorStorePort` adapter injection.
- `queryVector(tenantId, namespace, vector, topK, filter?)` — ANN search, always tenant-scoped.
- `deleteVector(tenantId, namespace, id)` — individual deletion; `deleteNamespace(tenantId, namespace)` — bulk GDPR erasure.
- Adapter injected at construction — no hardcoded backend.
- `deleteNamespace` called from `firm-provisioning` erasure saga.
- Tests: upsert + query round-trip, cross-tenant isolation (query as Tenant A returns no Tenant B vectors), namespace deletion.

**Out of Scope:** Embedding generation (handled by `firm-context-engine`). **Rules:** Every operation must be tenant-scoped — no cross-tenant vector access possible; `deleteNamespace` must be idempotent for GDPR; `VectorStorePort` adapter must be injected, never instantiated internally. **Anti-Patterns:** No hardcoding `pgvector` or Pinecone — use `VectorStorePort`; no cross-tenant queries. **DDD:** Vector store is infrastructure for the AI bounded context | **TDD:** Cross-tenant isolation test: vectors upserted under Tenant A not returned when querying as Tenant B | **BDD:** N/A | **Deep Module:** `queryVector` hides adapter selection, tenant namespace scoping, and ANN search parameters.

#### Subtasks
- [ ] **PH4.4.1** [AGENT] Scaffold `packages/firm-vector-store/package.json` and `tsconfig.json`.
- [ ] **PH4.4.2** [AGENT] Implement `upsertVector`, `queryVector`, `deleteVector`, `deleteNamespace`. File: `packages/firm-vector-store/src/store.ts`.
- [ ] **PH4.4.3** [AGENT] Wire `deleteNamespace` into `firm-provisioning` erasure saga.
- [ ] **PH4.4.4** [AGENT] Write tests including cross-tenant isolation. File: `packages/firm-vector-store/tests/`.

***

### PH4.5 – Build `firm-model-runtime`
- [ ] **PH4.5** | Status: Not Started | **Blocked by ADR-009 (PH1.2.10)**

**Related files:** `packages/firm-model-runtime/src/`

**Definition of Done:**
- ADR-009 accepted before implementation.
- `callModel(tenantId, request)` — normalises request across 50+ providers via `AITextPort` / `AIImagePort` adapter injection; applies `checkQuota()` before every call; calls `recordUsage()` after.
- Token counting with per-model tokenizer adapters (tiktoken for OpenAI models; provider-specific for others).
- Model routing: primary/fallback selection, latency-weighted routing via `firm-circuit-breaker`.
- Per-model/provider rate limiting via `firm-rate-limiter` named policies.
- Streaming response support via `firm-sse`.
- Lead scoring event: `lead.scored` emitted via `firm-bus` when scoring model returns.
- Tests: quota rejection before call, usage recorded after call, fallback routing on circuit open, token count accuracy.

**Out of Scope:** Content generation (handled by `firm-ai-content`); agent execution loop (handled by `firm-agent-runtime`). **Rules:** ADR-009 accepted first; `checkQuota()` mandatory before every generation — enforced by Gate New1; all AI cost metered through `firm-metering`. **Anti-Patterns:** No direct provider SDK calls outside adapters; no generation without quota check. **DDD:** Model runtime is infrastructure in the AI bounded context | **TDD:** `callModel` with exhausted quota returns `QuotaExceeded` before any provider call; circuit open routes to fallback | **BDD:** When OpenAI returns a 429, the circuit opens and the next call is routed to the fallback provider within the same user request | **Deep Module:** `callModel` hides adapter selection, token counting, quota enforcement, and circuit breaking.

#### Subtasks
- [ ] **PH4.5.1** [HUMAN] Confirm ADR-009 accepted. File: `docs/adr/0009-firm-ai-split.md`.
- [ ] **PH4.5.2** [AGENT] Scaffold `packages/firm-model-runtime/package.json` and `tsconfig.json`.
- [ ] **PH4.5.3** [AGENT] Implement `callModel(tenantId, request)` with adapter injection, `checkQuota`, `recordUsage`. File: `packages/firm-model-runtime/src/runtime.ts`.
- [ ] **PH4.5.4** [AGENT] Implement per-model token counting adapters. File: `packages/firm-model-runtime/src/tokenizer.ts`.
- [ ] **PH4.5.5** [AGENT] Implement latency-weighted model routing and fallback via `firm-circuit-breaker`. File: `packages/firm-model-runtime/src/router.ts`.
- [ ] **PH4.5.6** [AGENT] Implement streaming response support via `firm-sse`. File: `packages/firm-model-runtime/src/stream.ts`.
- [ ] **PH4.5.7** [AGENT] Emit `lead.scored` event via `firm-bus`. File: `packages/firm-model-runtime/src/events.ts`.
- [ ] **PH4.5.8** [AGENT] Write tests. File: `packages/firm-model-runtime/tests/`.

***

### PH4.6 – Build `firm-context-engine`
- [ ] **PH4.6** | Status: Not Started | **Depends on PH4.4, PH4.5**

**Related files:** `packages/firm-context-engine/src/`

**Definition of Done:**
- `buildContext(tenantId, query, options)` — RAG pipeline: query expansion → `firm-vector-store` ANN search → re-ranking → context window packing within token budget.
- `generateEmbedding(tenantId, text)` — produces embedding vector via `AITextPort`; `checkQuota()` before; `recordUsage()` after.
- Context window packer: respects `maxTokens` per model; truncates gracefully; preserves most-relevant chunks.
- All context retrieval tenant-scoped — no cross-tenant document access.
- Tests: query expansion, re-ranking order, token budget enforcement, cross-tenant isolation.

**Out of Scope:** Document ingestion (handled by `firm-knowledge-base`); agent memory (handled by `firm-ai-memory`). **Rules:** `checkQuota()` before every embedding generation; context window packing must never exceed model token limit; all vector queries tenant-scoped. **Anti-Patterns:** No embedding generation without quota check; no context retrieval that can cross tenant boundaries. **DDD:** Context engine is a supporting service in the AI bounded context | **TDD:** Context exceeding `maxTokens` is truncated to fit; cross-tenant isolation: only Tenant A's documents appear in Tenant A's context | **BDD:** A user asking a question receives context drawn only from their agency's knowledge base — never from another agency's documents | **Deep Module:** `buildContext` hides query expansion, vector search, re-ranking, and token packing.

#### Subtasks
- [ ] **PH4.6.1** [AGENT] Scaffold `packages/firm-context-engine/package.json` and `tsconfig.json`.
- [ ] **PH4.6.2** [AGENT] Implement `buildContext(tenantId, query, options)` — query expansion, ANN search, re-rank, pack. File: `packages/firm-context-engine/src/context.ts`.
- [ ] **PH4.6.3** [AGENT] Implement `generateEmbedding(tenantId, text)` with quota enforcement. File: `packages/firm-context-engine/src/embedding.ts`.
- [ ] **PH4.6.4** [AGENT] Implement context window packer with `maxTokens` enforcement. File: `packages/firm-context-engine/src/packer.ts`.
- [ ] **PH4.6.5** [AGENT] Write tests. File: `packages/firm-context-engine/tests/`.

***

### PH4.7 – Build `firm-ai-memory`
- [ ] **PH4.7** | Status: Not Started | **Depends on PH4.4**

**Related files:** `packages/firm-ai-memory/src/`

**Definition of Done:**
- `storeMemory(tenantId, agentId, userId, content, ttl?)` — persists long-term agent memory in `firm-vector-store`; TTL decay enforced.
- `recallMemory(tenantId, agentId, userId, query, topK)` — ANN search scoped to `(tenantId, agentId, userId)` triple.
- `eraseMemory(tenantId, userId)` — GDPR erasure; deletes all vectors for user; idempotent; called from `firm-provisioning` erasure saga.
- `compressMemory(tenantId, agentId, userId)` — summarises old memories to reduce vector count; called by scheduled job.
- Tests: store + recall round-trip, TTL expiry, GDPR erasure, cross-user isolation.

**Out of Scope:** Conversation turn history (handled by `firm-conversation-flow`). **Rules:** Memory scoped to `(tenantId, agentId, userId)` triple — no cross-user memory access; `eraseMemory` must be idempotent for GDPR compliance. **Anti-Patterns:** No storing memory without TTL unless explicitly opted in; no cross-user recall. **DDD:** AI memory is a domain service in the AI bounded context | **TDD:** `eraseMemory` deletes all vectors and returns `ok` if called twice (idempotent); `recallMemory` for User A returns no memories stored for User B | **BDD:** After a GDPR erasure request, no subsequent AI interaction for that user can recall their previous memories | **Deep Module:** `storeMemory` hides vector namespacing, TTL enforcement, and compression scheduling.

#### Subtasks
- [ ] **PH4.7.1** [AGENT] Scaffold `packages/firm-ai-memory/package.json` and `tsconfig.json`.
- [ ] **PH4.7.2** [AGENT] Implement `storeMemory`, `recallMemory` with `(tenantId, agentId, userId)` scoping. File: `packages/firm-ai-memory/src/memory.ts`.
- [ ] **PH4.7.3** [AGENT] Implement `eraseMemory(tenantId, userId)` (idempotent); wire into erasure saga. File: `packages/firm-ai-memory/src/erase.ts`.
- [ ] **PH4.7.4** [AGENT] Implement `compressMemory` scheduled job. File: `packages/firm-ai-memory/src/compress.ts`.
- [ ] **PH4.7.5** [AGENT] Write tests. File: `packages/firm-ai-memory/tests/`.

***

### PH4.8 – Build `firm-conversation-flow`
- [ ] **PH4.8** | Status: Not Started | **Depends on PH4.5, PH4.7**

**Related files:** `packages/firm-conversation-flow/src/`

**Definition of Done:**
- `createConversation(tenantId, agentId, userId)` → `conversationId`.
- `addTurn(conversationId, role, content)` — appends turn; enforces max turn history window.
- `getContext(conversationId)` — returns turn history formatted for model context window, applying compression if over token budget.
- `endConversation(conversationId)` — persists summary to `firm-ai-memory`; closes conversation.
- `eraseConversation(tenantId, userId)` — GDPR: deletes all conversations and summaries; idempotent.
- Tests: turn appending, compression trigger, end-to-summary-persist, GDPR erasure.

**Out of Scope:** Agent tool-calling loop (handled by `firm-agent-runtime`); chat UI (Phase 6 `firm-ai-chat`). **Rules:** Conversations must be tenant-and-user scoped; `eraseConversation` must be idempotent; compression must fire before context window is exceeded — never after. **Anti-Patterns:** No storing raw model output in turn history without content-type tagging; no compression after token limit exceeded. **DDD:** Conversation flow is a domain service in the AI bounded context | **TDD:** Adding a turn beyond the max window triggers compression; `getContext` returns tokens within budget | **BDD:** A returning user picks up a conversation and the agent recalls context from previous sessions via memory compression | **Deep Module:** `getContext` hides turn history retrieval, compression, and memory integration.

#### Subtasks
- [ ] **PH4.8.1** [AGENT] Scaffold `packages/firm-conversation-flow/package.json` and `tsconfig.json`.
- [ ] **PH4.8.2** [AGENT] Implement `createConversation`, `addTurn`, `getContext`, `endConversation`. File: `packages/firm-conversation-flow/src/conversation.ts`.
- [ ] **PH4.8.3** [AGENT] Implement compression trigger and `firm-ai-memory` integration. File: `packages/firm-conversation-flow/src/compression.ts`.
- [ ] **PH4.8.4** [AGENT] Implement `eraseConversation(tenantId, userId)` (idempotent). File: `packages/firm-conversation-flow/src/erase.ts`.
- [ ] **PH4.8.5** [AGENT] Write tests. File: `packages/firm-conversation-flow/tests/`.

***

### PH4.9 – Build `firm-builtin-tools` and `firm-mcp-client`
- [ ] **PH4.9** | Status: Not Started | **Depends on PH4.3, PH4.5**

**Related files:** `packages/firm-builtin-tools/src/`, `packages/firm-mcp-client/src/`

**Definition of Done:**
- `firm-builtin-tools`: tool registry and execution harness; every tool invocation: RBAC check via `firm-auth` → `checkQuota()` → execute → `recordUsage()` → `logAuditEvent`. Built-in tools: `web_search`, `send_email`, `create_lead`, `schedule_meeting`, `lookup_contact`.
- `firm-mcp-client`: MCP-protocol client for external tool servers; `connectMCPServer(url, auth)`, `callTool(serverId, toolName, args)`; circuit breaker wraps all calls; tool results sandboxed (no filesystem or env access).
- Both: all tool calls logged to `firm-audit`; results never contain raw PII without masking.
- Tests: RBAC rejection before execution, quota rejection, audit event on execution, MCP circuit breaker fallback.

**Out of Scope:** Agent execution loop (handled by `firm-agent-runtime`). **Rules:** Every tool execution — built-in or MCP — must pass RBAC and quota checks; MCP tool results must be sandboxed; all tool calls audited. **Anti-Patterns:** No tool execution without RBAC check; no unaudited tool calls. **DDD:** Tool execution is infrastructure in the AI bounded context | **TDD:** Tool call without required permission returns `PermissionDeniedError` before execution; MCP circuit open returns fallback error | **BDD:** An AI agent calling `send_email` without the `notifications:send` permission is rejected with an audit log entry | **Deep Module:** `firm-builtin-tools` hides RBAC, quota, execution, and audit behind `executeTool(name, args, context)`.

#### Subtasks
- [ ] **PH4.9.1** [AGENT] Scaffold `packages/firm-builtin-tools/package.json` and `tsconfig.json`.
- [ ] **PH4.9.2** [AGENT] Implement tool registry and execution harness (RBAC → quota → execute → usage → audit). File: `packages/firm-builtin-tools/src/harness.ts`.
- [ ] **PH4.9.3** [AGENT] Implement built-in tools: `web_search`, `send_email`, `create_lead`, `schedule_meeting`, `lookup_contact`. File: `packages/firm-builtin-tools/src/tools/`.
- [ ] **PH4.9.4** [AGENT] Scaffold `packages/firm-mcp-client/package.json` and `tsconfig.json`.
- [ ] **PH4.9.5** [AGENT] Implement `connectMCPServer`, `callTool` with circuit breaker and sandbox. File: `packages/firm-mcp-client/src/client.ts`.
- [ ] **PH4.9.6** [AGENT] Write tests for both packages. Files: `packages/firm-builtin-tools/tests/`, `packages/firm-mcp-client/tests/`.

***

### PH4.10 – Build `firm-agent-runtime`
- [ ] **PH4.10** | Status: Not Started | **Depends on PH4.5, PH4.6, PH4.8, PH4.9**

**Related files:** `packages/firm-agent-runtime/src/`

**Definition of Done:**
- `runAgent(tenantId, agentId, userId, input)` — executes the full agent loop: context retrieval → model call → tool-call parsing → tool execution → loop until `stop` or `maxSteps`.
- `createDelegatedSession(userId, agentId, scope, ttl)` — creates a scoped, short-lived session for the agent's tool calls (limits blast radius).
- Step streaming via `firm-sse`: each step emits a `agent.step` event; final response emits `agent.done`.
- `maxSteps` guard: loop exits with `AgentMaxStepsError` if exceeded.
- All steps logged to `firm-audit` with tool calls and model responses.
- Tests: single-turn completion, multi-step with tool call, `maxSteps` guard, streaming events emitted.

**Out of Scope:** Conversation persistence (handled by `firm-conversation-flow`); individual tool implementations (handled by `firm-builtin-tools`). **Rules:** Delegated session must have narrower scope than the calling user's session; `maxSteps` guard is mandatory — no infinite loops; every tool call goes through `firm-builtin-tools` harness. **Anti-Patterns:** No direct model calls bypassing `firm-model-runtime`; no agent loops without a `maxSteps` guard. **DDD:** Agent runtime is a core service in the AI bounded context | **TDD:** Agent exceeding `maxSteps` throws `AgentMaxStepsError` and audit-logs the incomplete run | **BDD:** A user triggering an AI agent sees each reasoning step streamed to their UI via SSE — the page never appears to hang | **Deep Module:** `runAgent` encapsulates the entire ReAct loop, streaming, and audit trail.

#### Subtasks
- [ ] **PH4.10.1** [AGENT] Scaffold `packages/firm-agent-runtime/package.json` and `tsconfig.json`.
- [ ] **PH4.10.2** [AGENT] Implement `runAgent(tenantId, agentId, userId, input)` with full ReAct loop. File: `packages/firm-agent-runtime/src/runtime.ts`.
- [ ] **PH4.10.3** [AGENT] Implement `createDelegatedSession(userId, agentId, scope, ttl)`. File: `packages/firm-agent-runtime/src/session.ts`.
- [ ] **PH4.10.4** [AGENT] Implement SSE step streaming (`agent.step`, `agent.done`). File: `packages/firm-agent-runtime/src/stream.ts`.
- [ ] **PH4.10.5** [AGENT] Implement `maxSteps` guard. File: `packages/firm-agent-runtime/src/runtime.ts`.
- [ ] **PH4.10.6** [AGENT] Wire `firm-audit` logging for all steps. File: `packages/firm-agent-runtime/src/audit.ts`.
- [ ] **PH4.10.7** [AGENT] Write tests. File: `packages/firm-agent-runtime/tests/`.

***

### PH4.11 – Build `firm-ai-content`
- [ ] **PH4.11** | Status: Not Started | **Depends on PH4.5, PH3.12** | ⚠️ **C2PA Aug 2 deadline**

**Related files:** `packages/firm-ai-content/src/`

**Definition of Done:**
- `generateContent(tenantId, request)` — always writes `status: 'pending_approval'` to `ai_generation_log`; never writes `approved` directly; `checkQuota()` before; `recordUsage()` after.
- `approveContent(contentId, approverId)` — only function permitted to transition `pending_approval` → `approved`; RBAC: `ai_content:approve` permission required; `firm-audit` event logged; Gate New2 enforces no bypass.
- `rejectContent(contentId, reviewerId, reason)` — transitions to `rejected`; audit logged.
- `generateManifest` from `firm-c2pa` called atomically with content save (mandatory post Aug 2).
- Disclosure label (`disclosure_label`) required on every row — non-nullable.
- Tests: status always `pending_approval` on create, `approveContent` RBAC rejection, C2PA manifest attached, direct status bypass rejected.

**Out of Scope:** Content display UI; AI brand voice (Phase 6 `firm-ai-brand-voice`). **Rules:** Content is always `pending_approval` at creation — no exceptions; only `approveContent` may transition to `approved`; C2PA manifest mandatory post Aug 2 (Gate enforces). **Anti-Patterns:** No setting `status = 'approved'` directly anywhere — Gate New2 prevents this; no AI content without `disclosure_label`. **DDD:** AI content is a domain entity in the content bounded context | **TDD:** `generateContent` always returns `status: 'pending_approval'`; `approveContent` without `ai_content:approve` permission returns `PermissionDeniedError` | **BDD:** An AI-generated image is never visible to end users until a human with `ai_content:approve` permission explicitly approves it | **Deep Module:** `approveContent` is the single state transition point — all approval enforcement is centralised.

#### Subtasks
- [ ] **PH4.11.1** [AGENT] Scaffold `packages/firm-ai-content/package.json` and `tsconfig.json`.
- [ ] **PH4.11.2** [AGENT] Implement `generateContent(tenantId, request)` — always `pending_approval`, quota enforcement, `firm-c2pa` manifest generation. File: `packages/firm-ai-content/src/generate.ts`.
- [ ] **PH4.11.3** [AGENT] Implement `approveContent(contentId, approverId)` with RBAC and audit log. File: `packages/firm-ai-content/src/approve.ts`.
- [ ] **PH4.11.4** [AGENT] Implement `rejectContent(contentId, reviewerId, reason)` with audit log. File: `packages/firm-ai-content/src/approve.ts`.
- [ ] **PH4.11.5** [AGENT] Write tests. File: `packages/firm-ai-content/tests/`.

***

### PH4.12 – Build `firm-feature-gates`
- [ ] **PH4.12** | Status: Not Started

**Related files:** `packages/firm-feature-gates/src/`

**Definition of Done:**
- `isEntitled(tenantId, feature)` — permanent plan-based entitlement check; reads from tenant plan tier; Redis-cached; never expires (unlike `firm-feature-flags` which handles expiring rollouts).
- `assertEntitled(tenantId, feature)` — throws `EntitlementError` if not entitled; used as middleware.
- `getEntitlementMatrix()` — returns full plan → feature mapping (used by pricing/UI packages).
- `firm-feature-flags` retains expiring rollout flags; `firm-feature-gates` owns permanent plan entitlements — the two must not be confused.
- Tests: plan tier A entitled to feature X, plan tier B not; `assertEntitled` throws `EntitlementError`; cache hit.

**Out of Scope:** Billing plan changes (Phase 5); feature flag UI (Phase 5). **Rules:** Entitlements are defined in code (not DB); plan tier changes go through `firm-tenancy.updateTenant`; no feature should check both `isEnabled` and `isEntitled` — use the correct one. **Anti-Patterns:** No mixing entitlement gates with feature flags; no storing entitlement matrix in DB — it is a code artifact. **DDD:** Entitlements are a domain concept in the billing bounded context | **TDD:** `isEntitled` returns `false` for a feature not in the tenant's plan; Redis cache hit avoids DB call | **BDD:** A sub-account on the Starter plan attempting to access an Enterprise feature receives a clear `EntitlementError` — not a 500 | **Deep Module:** `assertEntitled` hides plan tier lookup, entitlement matrix evaluation, and caching.

#### Subtasks
- [ ] **PH4.12.1** [AGENT] Scaffold `packages/firm-feature-gates/package.json` and `tsconfig.json`.
- [ ] **PH4.12.2** [AGENT] Implement `isEntitled(tenantId, feature)` with Redis caching. File: `packages/firm-feature-gates/src/gates.ts`.
- [ ] **PH4.12.3** [AGENT] Implement `assertEntitled(tenantId, feature)`. File: `packages/firm-feature-gates/src/assert.ts`.
- [ ] **PH4.12.4** [AGENT] Implement `getEntitlementMatrix()`. File: `packages/firm-feature-gates/src/matrix.ts`.
- [ ] **PH4.12.5** [AGENT] Write tests. File: `packages/firm-feature-gates/tests/`.

***

### PH4.13 – Build `firm-search`
- [ ] **PH4.13** | Status: Not Started | **Blocked by ADR-002 (PH1.2.3)**

**Related files:** `packages/firm-search/src/`

**Definition of Done:**
- ADR-002 accepted before implementation.
- `createSearchIndex(tenantId)`, `indexDocument(tenantId, entity, doc)`, `search(tenantId, query, options)`, `deleteIndex(tenantId)` (GDPR).
- Tenant-isolated index strategy per ADR-002 decision (external index partitions or PostgreSQL RLS).
- Async indexing via `firm-bus` outbox (`document.indexed` event); at-least-once delivery.
- `deleteIndex` called from `firm-provisioning` erasure saga.
- Integration tests: zero cross-tenant result bleed, async index round-trip, erasure.

**Out of Scope:** Search UI autocomplete (handled by `firm-ui`); search analytics (handled by `firm-analytics`). **Rules:** ADR-002 must be accepted first; isolation enforced at search engine level — not only in query parameters; `deleteIndex` must be idempotent. **Anti-Patterns:** No shared index across tenants with query-time filter only — misconfiguration leaks results. **DDD:** Search is a supporting domain service | **TDD:** Index documents for Tenant A and B; search as A; assert zero results from B | **BDD:** Searching a term that exists in Tenant B's documents returns zero results when queried as Tenant A | **Deep Module:** `firm-search` abstracts the search engine behind a tenant-aware API.

#### Subtasks
- [ ] **PH4.13.1** [HUMAN] Confirm ADR-002 accepted. File: `docs/adr/0002-firm-search-engine.md`.
- [ ] **PH4.13.2** [AGENT] Scaffold `packages/firm-search/package.json` and `tsconfig.json`.
- [ ] **PH4.13.3** [AGENT] Implement `createSearchIndex`, `indexDocument`, `search`, `deleteIndex` per ADR-002 decision. File: `packages/firm-search/src/`.
- [ ] **PH4.13.4** [AGENT] Wire async indexing via `firm-bus` outbox. File: `packages/firm-search/src/indexer.ts`.
- [ ] **PH4.13.5** [AGENT] Wire `deleteIndex` into `firm-provisioning` erasure saga.
- [ ] **PH4.13.6** [AGENT] Write integration tests: cross-tenant isolation, async round-trip, erasure. File: `packages/firm-search/tests/`.

***

### PH4.14 – Build `firm-notifications`
- [ ] **PH4.14** | Status: Not Started | **Depends on PH2.1, PH3.11**

**Related files:** `packages/firm-notifications/src/`

**Definition of Done:**
- `sendNotification(tenantId, userId, notification)` — persists notification, checks `firm-consent.shouldTrackEmail`, emits `notification.email.queued` / `notification.sms.queued` / `notification.push.queued` via `firm-bus`.
- `markRead(notificationId, userId)` — updates read status; verifies ownership (RLS-backed).
- `listNotifications(tenantId, userId, filters)` — paginated, RLS-enforced.
- Unsubscribe management: `unsubscribe(userId, category)`, `resubscribe(userId, category)`, `getPreferences(userId)`.
- `notification.email.queued` event consumed by `workers/email-delivery-worker`.
- Tests: consent suppression (CNIL), ownership verification, unsubscribe prevents queuing.

**Out of Scope:** Actual delivery (handled by delivery workers); push notification provider integration (Phase 5). **Rules:** Never queue an email without checking `firm-consent.shouldTrackEmail`; never send to an unsubscribed user; notification must be persisted before event emitted. **Anti-Patterns:** No direct SMTP/SMS calls from this package — always emit via `firm-bus`. **DDD:** Notifications are a domain service in the communication bounded context | **TDD:** EU user without marketing consent — `sendNotification` stores record but does not emit `notification.email.queued` | **BDD:** An unsubscribed user never receives emails even if triggered by an automated workflow | **Deep Module:** `sendNotification` hides consent checking, persistence, and event emission.

#### Subtasks
- [ ] **PH4.14.1** [AGENT] Scaffold `packages/firm-notifications/package.json` and `tsconfig.json`.
- [ ] **PH4.14.2** [AGENT] Implement `sendNotification` with consent check and event emission. File: `packages/firm-notifications/src/send.ts`.
- [ ] **PH4.14.3** [AGENT] Implement `markRead`, `listNotifications` with RLS. File: `packages/firm-notifications/src/query.ts`.
- [ ] **PH4.14.4** [AGENT] Implement unsubscribe management. File: `packages/firm-notifications/src/preferences.ts`.
- [ ] **PH4.14.5** [AGENT] Write tests. File: `packages/firm-notifications/tests/`.

***

### PH4.15 – Build `firm-media`
- [ ] **PH4.15** | Status: Not Started | **Depends on PH3.3, PH1.28**

**Related files:** `packages/firm-media/src/`

**Definition of Done:**
- `uploadMedia(tenantId, file, options)` — `checkQuota()` before upload; content-addressed deduplication via `sha256(fileBuffer)` as key; routes to `StoragePort` adapter.
- Image processing pipeline: resize, format conversion, EXIF stripping (mandatory — no PII in EXIF).
- Video transcoding: dispatches to `firm-queue` job; progress events via `firm-sse`.
- `deleteMedia(tenantId, mediaId)` — removes from storage; called from erasure saga.
- Prometheus counter `firm.media.upload_bytes_total` tagged by `tenantId` hash and `mediaType`.
- Tests: quota rejection, deduplication (second upload returns existing URL), EXIF stripping, erasure.

**Out of Scope:** Entity-attached file management UX (Phase 5 `firm-attachments`). **Rules:** `checkQuota()` mandatory before all uploads; EXIF stripping is not optional — enforced by test; deduplication must be content-addressed (hash), not filename-based. **Anti-Patterns:** No uploads without quota check; no serving EXIF data to clients. **DDD:** Media is a supporting domain service | **TDD:** Quota exhausted returns `QuotaExceeded` before any storage write; second upload of identical file returns existing URL | **BDD:** An uploaded profile photo has all GPS and device metadata stripped before the URL is returned to the client | **Deep Module:** `uploadMedia` hides quota enforcement, deduplication, EXIF stripping, and storage adapter routing.

#### Subtasks
- [ ] **PH4.15.1** [AGENT] Scaffold `packages/firm-media/package.json` and `tsconfig.json`.
- [ ] **PH4.15.2** [AGENT] Implement `uploadMedia` with `checkQuota`, SHA-256 dedup, `StoragePort` routing. File: `packages/firm-media/src/upload.ts`.
- [ ] **PH4.15.3** [AGENT] Implement image processing pipeline (resize, format conversion, EXIF stripping). File: `packages/firm-media/src/image.ts`.
- [ ] **PH4.15.4** [AGENT] Implement video transcoding queue job and SSE progress events. File: `packages/firm-media/src/video.ts`.
- [ ] **PH4.15.5** [AGENT] Implement `deleteMedia`; wire into erasure saga. File: `packages/firm-media/src/delete.ts`.
- [ ] **PH4.15.6** [AGENT] Add Prometheus counter. File: `packages/firm-media/src/metrics.ts`.
- [ ] **PH4.15.7** [AGENT] Write tests. File: `packages/firm-media/tests/`.

***

### PH4.16 – Build `firm-knowledge-base`
- [ ] **PH4.16** | Status: Not Started | **Depends on PH4.4, PH4.6, PH1.37**

**Related files:** `packages/firm-knowledge-base/src/`

**Definition of Done:**
- `ingestDocument(tenantId, source)` — extracts text via `firm-file-loaders`, chunks, generates embeddings via `firm-context-engine`, upserts to `firm-vector-store`; dispatched as `firm-queue` background job.
- `listDocuments(tenantId, filters)` — paginated, RLS-enforced.
- `deleteDocument(tenantId, docId)` — removes chunks from vector store; idempotent.
- `deleteKnowledgeBase(tenantId)` — GDPR: deletes all documents; called from erasure saga.
- Progress events via `firm-sse` during ingestion.
- Tests: ingest → search round-trip, chunking boundary correctness, GDPR erasure, cross-tenant isolation.

**Out of Scope:** Knowledge base UI (Phase 5). **Rules:** Ingestion is always async via `firm-queue`; `deleteKnowledgeBase` must be idempotent; chunking must not split sentences mid-word. **Anti-Patterns:** No synchronous embedding generation during ingestion — always queue; no cross-tenant vector namespace access. **DDD:** Knowledge base is a domain service in the AI bounded context | **TDD:** Ingested document is retrievable via `firm-search` within the same tenant; cross-tenant isolation test | **BDD:** An agency uploads a PDF; within seconds, their AI agents can answer questions about its contents | **Deep Module:** `ingestDocument` hides text extraction, chunking, embedding, and vector storage behind one call.

#### Subtasks
- [ ] **PH4.16.1** [AGENT] Scaffold `packages/firm-knowledge-base/package.json` and `tsconfig.json`.
- [ ] **PH4.16.2** [AGENT] Implement `ingestDocument` as async queue job with `firm-file-loaders`, chunking, embedding, vector upsert, SSE progress. File: `packages/firm-knowledge-base/src/ingest.ts`.
- [ ] **PH4.16.3** [AGENT] Implement `listDocuments`, `deleteDocument`. File: `packages/firm-knowledge-base/src/documents.ts`.
- [ ] **PH4.16.4** [AGENT] Implement `deleteKnowledgeBase(tenantId)` (idempotent); wire into erasure saga. File: `packages/firm-knowledge-base/src/erase.ts`.
- [ ] **PH4.16.5** [AGENT] Write tests. File: `packages/firm-knowledge-base/tests/`.

***

### PH4.17 – Phase 4 acceptance criteria verification
- [ ] **PH4.17** | Status: Not Started | **Final Phase 4 gate**

**Definition of Done:**
- All Phase 4 packages build and pass tests on `main`.
- Gate New1 (quota-check) passing for all L6 packages.
- Gate New2 (AI content approval bypass) passing.
- `firm-ai-content` always creates `pending_approval` status — verified in CI.
- C2PA manifest wired and tested (Aug 2 deadline path confirmed).
- Cross-tenant isolation tests passing for `firm-vector-store`, `firm-search`, `firm-knowledge-base`, `firm-ai-memory`.
- GDPR erasure saga covers: `firm-search`, `firm-vector-store`, `firm-ai-memory`, `firm-conversation-flow`, `firm-knowledge-base`, `firm-media`.
- Coverage ≥80% on all Phase 4 packages.

#### Subtasks
- [ ] **PH4.17.1** [AGENT] Run full test suite; confirm all Phase 4 packages ≥80% coverage.
- [ ] **PH4.17.2** [AGENT] Run GDPR erasure integration test confirming all Phase 4 packages wired into erasure saga.
- [ ] **PH4.17.3** [AGENT] Confirm Gate New1 and Gate New2 passing on `main`.
- [ ] **PH4.17.4** [HUMAN] Sign off Phase 4 complete; tag release `v0.4.0-features-tier-a`.

***

---

## Phase 5: Feature Packages — Tier B

*Build all L6 Tier B feature packages. These are the core business-logic modules. May be built in parallel within the phase. Depends on all Phase 4 packages.*

***

### PH5.1 – Build `firm-contacts`
- [ ] **PH5.1** | Status: Not Started

**Related files:** `packages/firm-contacts/src/`

**Definition of Done:**
- `createContact(tenantId, data)` — validates via `firm-validators`; deduplicates by email+phone within tenant; emits `contact.created` via `firm-bus`.
- `updateContact(tenantId, contactId, patch)` — optimistic lock; emits `contact.updated`.
- `mergeContacts(tenantId, winnerId, loserId)` — merges fields, reassigns related records, emits `contact.merged`; idempotent.
- `deleteContact(tenantId, contactId)` — GDPR soft-delete; emits `contact.deleted`; called from erasure saga.
- `listContacts(tenantId, filters)` — cursor-paginated, RLS-enforced, fulltext search via `firm-search`.
- Custom field support via `firm-metadata-engine`.
- `firm-audit` event on all mutations.
- Tests: deduplication logic, merge idempotency, GDPR erasure, cross-tenant isolation, custom field round-trip.

**Out of Scope:** CRM sync (handled by `firm-crm`); contact import pipeline (PH5.2). **Rules:** Deduplication is per-tenant — no cross-tenant dedup; `mergeContacts` must be idempotent (calling twice produces same result); GDPR soft-delete must not hard-delete until retention period expires. **Anti-Patterns:** No hard-deleting contacts on GDPR request — soft-delete then purge after retention; no cross-tenant contact access. **DDD:** `Contact` is a core domain entity in the CRM bounded context | **TDD:** Creating two contacts with same email within tenant triggers deduplication merge; cross-tenant: same email in two tenants creates two independent records | **BDD:** When a duplicate contact is created, the system automatically merges records and notifies the user — no manual dedup required | **Deep Module:** `mergeContacts` encapsulates field resolution, related-record reassignment, and event emission.

#### Subtasks
- [ ] **PH5.1.1** [AGENT] Scaffold `packages/firm-contacts/package.json` and `tsconfig.json`.
- [ ] **PH5.1.2** [AGENT] Implement `createContact` with deduplication and event emission. File: `packages/firm-contacts/src/create.ts`.
- [ ] **PH5.1.3** [AGENT] Implement `updateContact` with optimistic lock. File: `packages/firm-contacts/src/update.ts`.
- [ ] **PH5.1.4** [AGENT] Implement `mergeContacts` (idempotent). File: `packages/firm-contacts/src/merge.ts`.
- [ ] **PH5.1.5** [AGENT] Implement `deleteContact` (soft-delete); wire into erasure saga. File: `packages/firm-contacts/src/delete.ts`.
- [ ] **PH5.1.6** [AGENT] Implement `listContacts` with cursor pagination, RLS, `firm-search`. File: `packages/firm-contacts/src/list.ts`.
- [ ] **PH5.1.7** [AGENT] Wire `firm-metadata-engine` custom fields. File: `packages/firm-contacts/src/custom-fields.ts`.
- [ ] **PH5.1.8** [AGENT] Write tests. File: `packages/firm-contacts/tests/`.

***

### PH5.2 – Build `firm-import-pipeline`
- [ ] **PH5.2** | Status: Not Started | **Depends on PH5.1, PH1.38**

**Related files:** `packages/firm-import-pipeline/src/`

**Definition of Done:**
- `createImportJob(tenantId, source, entityType, options)` — validates source file, enqueues via `firm-queue`, returns `jobId`.
- Processing pipeline via `firm-streams`: `createCSVTransform` → schema validation (`firm-validators`) → deduplication → batch upsert via `createBatchTransform`.
- Progress events via `firm-sse` (rows processed, errors, estimated completion).
- `ImportResult`: rows imported, duplicates merged, validation errors (per-row with line number), total processed.
- Idempotent: re-running same import with same `idempotencyKey` returns original `ImportResult`.
- Failed rows exported as downloadable error report.
- Tests: full CSV round-trip, duplicate handling, validation errors reported per-row, idempotency, progress events emitted.

**Out of Scope:** Non-CSV formats for Phase 5 (XLSX supported in Phase 6 via `firm-file-loaders`). **Rules:** Imports are always async via `firm-queue`; validation errors never abort the whole job — continue and report; idempotency key prevents double-imports. **Anti-Patterns:** No blocking imports; no aborting on first validation error; no re-processing idempotent jobs. **DDD:** Import pipeline is a supporting domain service | **TDD:** 1000-row CSV with 10 validation errors: 990 rows imported, 10 reported in error report; re-run with same `idempotencyKey` returns original result | **BDD:** A user uploading a CSV sees a live progress bar; validation errors are downloadable in a separate error report without blocking the successful rows | **Deep Module:** `createImportJob` hides streaming, batching, deduplication, and error accumulation.

#### Subtasks
- [ ] **PH5.2.1** [AGENT] Scaffold `packages/firm-import-pipeline/package.json` and `tsconfig.json`.
- [ ] **PH5.2.2** [AGENT] Implement `createImportJob` with `firm-queue` enqueue and idempotency. File: `packages/firm-import-pipeline/src/job.ts`.
- [ ] **PH5.2.3** [AGENT] Implement streaming pipeline: `createCSVTransform` → validate → dedup → `createBatchTransform`. File: `packages/firm-import-pipeline/src/pipeline.ts`.
- [ ] **PH5.2.4** [AGENT] Implement SSE progress events. File: `packages/firm-import-pipeline/src/progress.ts`.
- [ ] **PH5.2.5** [AGENT] Implement failed-row error report download. File: `packages/firm-import-pipeline/src/report.ts`.
- [ ] **PH5.2.6** [AGENT] Write tests. File: `packages/firm-import-pipeline/tests/`.

***

### PH5.3 – Build `firm-pipeline` (sales pipeline)
- [ ] **PH5.3** | Status: Not Started | **Depends on PH5.1**

**Related files:** `packages/firm-pipeline/src/`

**Definition of Done:**
- `createPipeline(tenantId, config)` — named pipeline with ordered stages; per-tenant limit enforced via `checkQuota()`.
- `moveOpportunity(tenantId, opportunityId, toStageId)` — validates legal transition; emits `opportunity.stage_changed` via `firm-bus`.
- `getOpportunityForecast(tenantId, pipelineId)` — weighted revenue forecast by stage probability.
- Custom field support via `firm-metadata-engine`.
- Stage change triggers `firm-workflow` evaluation (stubbed until `firm-workflow` built in PH5.8).
- `firm-audit` event on all mutations.
- Tests: illegal stage transition rejected, forecast calculation accuracy, quota enforcement, stage-change event.

**Out of Scope:** Pipeline UI (Phase 7 `app-platform-web`); revenue reporting (Phase 6 `firm-reporting`). **Rules:** Stage transitions must be validated against pipeline config — no skipping stages unless config allows; quota enforced on pipeline creation. **Anti-Patterns:** No direct stage manipulation without transition validation; no pipeline without quota check. **DDD:** `Pipeline` and `Opportunity` are core domain entities in the sales bounded context | **TDD:** Moving opportunity to non-adjacent stage (when config disallows skipping) throws `InvalidTransitionError` | **BDD:** A sales rep moving a deal to `Closed Won` automatically triggers a workflow that sends a congratulations notification | **Deep Module:** `moveOpportunity` hides transition validation, event emission, and workflow stub.

#### Subtasks
- [ ] **PH5.3.1** [AGENT] Scaffold `packages/firm-pipeline/package.json` and `tsconfig.json`.
- [ ] **PH5.3.2** [AGENT] Implement `createPipeline(tenantId, config)` with quota enforcement. File: `packages/firm-pipeline/src/pipeline.ts`.
- [ ] **PH5.3.3** [AGENT] Implement `moveOpportunity` with transition validation and event emission. File: `packages/firm-pipeline/src/opportunity.ts`.
- [ ] **PH5.3.4** [AGENT] Implement `getOpportunityForecast`. File: `packages/firm-pipeline/src/forecast.ts`.
- [ ] **PH5.3.5** [AGENT] Wire `firm-metadata-engine` custom fields and `firm-workflow` stub. File: `packages/firm-pipeline/src/opportunity.ts`.
- [ ] **PH5.3.6** [AGENT] Write tests. File: `packages/firm-pipeline/tests/`.

***

### PH5.4 – Build `firm-crm`
- [ ] **PH5.4** | Status: Not Started | **Depends on PH5.1, PH5.3, PH3.5**

**Related files:** `packages/firm-crm/src/`

**Definition of Done:**
- `syncContact(tenantId, contactId, provider)` — push contact to CRM provider via `CRMSyncPort`; conflict resolution strategy configurable (`platform-wins`, `provider-wins`, `last-write-wins`).
- `pullContacts(tenantId, provider, since?)` — incremental pull with cursor; upserts via `firm-contacts`; circuit breaker wraps provider calls.
- `mapFields(tenantId, provider, fieldMappings)` — tenant-configurable field mapping; stored in DB.
- Bi-directional sync webhook: `webhook.crm_contact_updated` event consumed from `firm-webhook-receiver`; updates `firm-contacts`.
- Sync audit log via `firm-audit`.
- Tests: conflict resolution (all three strategies), incremental pull cursor, field mapping round-trip, webhook-triggered update.

**Out of Scope:** CRM UI (Phase 7); per-provider OAuth flow UI (Phase 5 `firm-integrations`). **Rules:** Circuit breaker mandatory on all provider calls; conflict resolution must be explicit — no silent overwrites; sync errors must never corrupt local data. **Anti-Patterns:** No silent data loss on sync conflict; no direct CRM SDK calls outside adapters. **DDD:** CRM sync is an integration domain service | **TDD:** `platform-wins` strategy: provider value does not overwrite local value; `provider-wins`: it does | **BDD:** When a contact is updated in HubSpot, the platform reflects the change within one webhook event — no polling required | **Deep Module:** `syncContact` encapsulates field mapping, conflict resolution, and circuit-broken adapter calls.

#### Subtasks
- [ ] **PH5.4.1** [AGENT] Scaffold `packages/firm-crm/package.json` and `tsconfig.json`.
- [ ] **PH5.4.2** [AGENT] Implement `syncContact` with conflict resolution strategies. File: `packages/firm-crm/src/sync.ts`.
- [ ] **PH5.4.3** [AGENT] Implement `pullContacts` with incremental cursor. File: `packages/firm-crm/src/pull.ts`.
- [ ] **PH5.4.4** [AGENT] Implement `mapFields` with DB-persisted tenant config. File: `packages/firm-crm/src/mapping.ts`.
- [ ] **PH5.4.5** [AGENT] Wire `firm-webhook-receiver` consumer for `webhook.crm_contact_updated`. File: `packages/firm-crm/src/webhook.ts`.
- [ ] **PH5.4.6** [AGENT] Write tests. File: `packages/firm-crm/tests/`.

***

### PH5.5 – Build `firm-forms`
- [ ] **PH5.5** | Status: Not Started | **Depends on PH5.1, PH4.14**

**Related files:** `packages/firm-forms/src/`

**Definition of Done:**
- `createForm(tenantId, schema)` — validates schema; stores versioned form definition; emits `form.created`.
- `submitForm(formId, data, metadata)` — validates against form schema; checks consent (`firm-consent`); creates/updates contact via `firm-contacts`; emits `form.submitted`.
- `getFormAnalytics(formId)` — completion rate, field drop-off, submission count.
- Conditional logic: `showField(fieldId)` / `hideField(fieldId)` based on other field values (evaluated server-side for non-JS environments).
- Spam protection: `firm-rate-limiter` policy `form-submit` + honeypot field injection.
- Multi-step form support with partial saves.
- Tests: schema validation rejection, conditional logic evaluation, spam rejection, consent gate.

**Out of Scope:** Form builder UI (Phase 6 `firm-form-builder`); form embed script (Phase 6). **Rules:** Consent check mandatory before any `form.submitted` event is emitted; rate limiter applied before schema validation; partial saves must be tenant-scoped. **Anti-Patterns:** No emitting `form.submitted` without consent verification; no processing submissions without rate limiting. **DDD:** `Form` is a domain entity in the lead-capture bounded context | **TDD:** Submission without consent returns 200 (to prevent spam enumeration) but does not emit `form.submitted` or create a contact | **BDD:** A form submission from an EU user without marketing consent creates the contact but suppresses all marketing emails | **Deep Module:** `submitForm` hides validation, consent, contact upsert, and spam protection.

#### Subtasks
- [ ] **PH5.5.1** [AGENT] Scaffold `packages/firm-forms/package.json` and `tsconfig.json`.
- [ ] **PH5.5.2** [AGENT] Implement `createForm(tenantId, schema)` with versioning. File: `packages/firm-forms/src/form.ts`.
- [ ] **PH5.5.3** [AGENT] Implement `submitForm` with consent check, contact upsert, event emission, rate limiting, honeypot. File: `packages/firm-forms/src/submit.ts`.
- [ ] **PH5.5.4** [AGENT] Implement `getFormAnalytics`. File: `packages/firm-forms/src/analytics.ts`.
- [ ] **PH5.5.5** [AGENT] Implement conditional logic evaluation (server-side). File: `packages/firm-forms/src/conditions.ts`.
- [ ] **PH5.5.6** [AGENT] Implement multi-step partial save. File: `packages/firm-forms/src/partial.ts`.
- [ ] **PH5.5.7** [AGENT] Write tests. File: `packages/firm-forms/tests/`.

***

### PH5.6 – Build `firm-bookings`
- [ ] **PH5.6** | Status: Not Started | **Depends on PH5.1, PH3.6, PH3.7**

**Related files:** `packages/firm-bookings/src/`

**Definition of Done:**
- `getAvailability(tenantId, userId, window)` — computes free slots from calendar, buffer times, and booking rules; queries `CalendarPort` via circuit breaker.
- `createBooking(tenantId, data)` — idempotent (idempotency key); creates calendar event; emits `booking.created`; sends confirmation via `firm-notifications`.
- `rescheduleBooking(bookingId, newSlot)` — validates slot still available; updates calendar event; emits `booking.rescheduled`.
- `cancelBooking(bookingId, reason)` — cancels calendar event; emits `booking.cancelled`; sends cancellation notification.
- Group bookings: `createGroupBooking(tenantId, slotId, participants[])`.
- Buffer time and timezone handling: all stored UTC, displayed via `firm-i18n`.
- Tests: slot availability computation, double-booking prevention, idempotent create, timezone conversion, group booking.

**Out of Scope:** Booking UI (Phase 7); payment for paid bookings (PH5.14). **Rules:** All times stored UTC; `createBooking` must be idempotent; double-booking prevention must be atomic (DB transaction + advisory lock); notifications must be sent after calendar event confirmed. **Anti-Patterns:** No storing local times in DB; no non-idempotent booking creation; no sending notifications before calendar event created. **DDD:** `Booking` is a core domain entity in the scheduling bounded context | **TDD:** Concurrent `createBooking` calls for same slot: exactly one succeeds; idempotent retry with same key returns original booking | **BDD:** A client booking a slot sees immediate confirmation and receives a calendar invite — no manual follow-up required | **Deep Module:** `getAvailability` hides calendar provider queries, buffer computation, and timezone conversion.

#### Subtasks
- [ ] **PH5.6.1** [AGENT] Scaffold `packages/firm-bookings/package.json` and `tsconfig.json`.
- [ ] **PH5.6.2** [AGENT] Implement `getAvailability` with `CalendarPort`, buffer times, timezone handling. File: `packages/firm-bookings/src/availability.ts`.
- [ ] **PH5.6.3** [AGENT] Implement `createBooking` with idempotency and double-booking prevention. File: `packages/firm-bookings/src/booking.ts`.
- [ ] **PH5.6.4** [AGENT] Implement `rescheduleBooking`, `cancelBooking` with event emission and notifications. File: `packages/firm-bookings/src/booking.ts`.
- [ ] **PH5.6.5** [AGENT] Implement `createGroupBooking`. File: `packages/firm-bookings/src/group.ts`.
- [ ] **PH5.6.6** [AGENT] Write tests. File: `packages/firm-bookings/tests/`.

***

### PH5.7 – Build `firm-campaigns`
- [ ] **PH5.7** | Status: Not Started | **Depends on PH5.1, PH4.14, PH3.11**

**Related files:** `packages/firm-campaigns/src/`

**Definition of Done:**
- `createCampaign(tenantId, config)` — validates audience, channel mix (email/SMS/push), schedule, quota check.
- `launchCampaign(campaignId)` — fans out to `firm-notifications` for each recipient; respects `firm-consent` per channel; enqueues via `firm-queue` in batches of 500; emits `campaign.launched`.
- `pauseCampaign(campaignId)` / `resumeCampaign(campaignId)` — halts/resumes queue processing.
- `getCampaignMetrics(campaignId)` — delivered, opened, clicked, bounced, unsubscribed.
- A/B variant support: audience split, variant tracking, automatic winner selection by open rate after configurable window.
- Tests: consent suppression per-recipient, batch fan-out, pause/resume, A/B split distribution accuracy.

**Out of Scope:** Campaign UI (Phase 7); send-time optimisation AI (Phase 6 `firm-ai-send-time`). **Rules:** Every recipient checked against `firm-consent` at send time — not at campaign creation; quota checked before fan-out; batch size must be configurable via `firm-config`. **Anti-Patterns:** No consent check only at campaign creation time — it must happen per-recipient at send time; no unbatched fan-out. **DDD:** `Campaign` is a core domain entity in the marketing bounded context | **TDD:** 100-recipient campaign with 20 EU users without consent: exactly 80 `notification.*queued` events emitted | **BDD:** Pausing a campaign mid-send halts all remaining queued jobs; resuming continues from the last processed batch | **Deep Module:** `launchCampaign` hides per-recipient consent checking, batch queuing, and metric tracking.

#### Subtasks
- [ ] **PH5.7.1** [AGENT] Scaffold `packages/firm-campaigns/package.json` and `tsconfig.json`.
- [ ] **PH5.7.2** [AGENT] Implement `createCampaign` with validation and quota check. File: `packages/firm-campaigns/src/campaign.ts`.
- [ ] **PH5.7.3** [AGENT] Implement `launchCampaign` with per-recipient consent, batched queue fan-out. File: `packages/firm-campaigns/src/launch.ts`.
- [ ] **PH5.7.4** [AGENT] Implement `pauseCampaign` / `resumeCampaign`. File: `packages/firm-campaigns/src/lifecycle.ts`.
- [ ] **PH5.7.5** [AGENT] Implement `getCampaignMetrics`. File: `packages/firm-campaigns/src/metrics.ts`.
- [ ] **PH5.7.6** [AGENT] Implement A/B variant support with automatic winner selection. File: `packages/firm-campaigns/src/ab.ts`.
- [ ] **PH5.7.7** [AGENT] Write tests. File: `packages/firm-campaigns/tests/`.

***

### PH5.8 – Build `firm-workflow`
- [ ] **PH5.8** | Status: Not Started | **Blocked by ADR-007 (PH1.2.8)**

**Related files:** `packages/firm-workflow/src/`

**Definition of Done:**
- ADR-007 accepted before implementation.
- `createWorkflow(tenantId, definition)` — validates trigger, conditions (per ADR-007 model), and actions; stores versioned definition.
- `evaluateWorkflow(tenantId, trigger, context)` — evaluates conditions, executes action sequence; idempotent per `(workflowId, triggerId)` pair.
- Built-in actions: `send_email`, `send_sms`, `create_task`, `update_contact`, `add_to_campaign`, `webhook_call`, `wait_delay`, `branch_condition`.
- Workflow versioning: live workflows pinned to version; new version requires explicit activation.
- `firm-bus` consumer for all registered trigger events.
- Tests: condition evaluation (all ADR-007 operators), action sequence execution, idempotency, version pinning.

**Out of Scope:** Workflow UI builder (Phase 6 `firm-workflow-builder`); AI-suggested workflows (Phase 6). **Rules:** ADR-007 must be accepted first; `evaluateWorkflow` must be idempotent; live workflows pinned to version — no hot-swapping; all action execution through `firm-builtin-tools` harness (RBAC + quota). **Anti-Patterns:** No mutable live workflow definitions; no action execution bypassing `firm-builtin-tools` harness. **DDD:** `Workflow` is a core domain entity in the automation bounded context | **TDD:** Same trigger event evaluated twice produces exactly one action execution; condition `contact.score > 80 AND tag includes 'hot'` evaluates correctly | **BDD:** A workflow triggered by a form submission sends a follow-up email within 5 minutes — no developer intervention required | **Deep Module:** `evaluateWorkflow` encapsulates condition tree evaluation, action dispatch, idempotency, and audit logging.

#### Subtasks
- [ ] **PH5.8.1** [HUMAN] Confirm ADR-007 accepted. File: `docs/adr/0007-workflow-condition-model.md`.
- [ ] **PH5.8.2** [AGENT] Scaffold `packages/firm-workflow/package.json` and `tsconfig.json`.
- [ ] **PH5.8.3** [AGENT] Implement `createWorkflow` with versioning and definition validation. File: `packages/firm-workflow/src/workflow.ts`.
- [ ] **PH5.8.4** [AGENT] Implement `evaluateWorkflow` with condition tree evaluation and idempotency. File: `packages/firm-workflow/src/evaluate.ts`.
- [ ] **PH5.8.5** [AGENT] Implement all 8 built-in actions via `firm-builtin-tools` harness. File: `packages/firm-workflow/src/actions/`.
- [ ] **PH5.8.6** [AGENT] Implement `firm-bus` trigger consumers for all registered events. File: `packages/firm-workflow/src/triggers.ts`.
- [ ] **PH5.8.7** [AGENT] Wire `firm-pipeline` stage-change stub (PH5.3). File: `packages/firm-workflow/src/triggers.ts`.
- [ ] **PH5.8.8** [AGENT] Write tests. File: `packages/firm-workflow/tests/`.

***

### PH5.9 – Build `firm-onboarding`
- [ ] **PH5.9** | Status: Not Started | **Depends on PH4.3, PH4.2**

**Related files:** `packages/firm-onboarding/src/`

**Definition of Done:**
- `createOnboardingFlow(tenantId, config)` — configurable step sequence (business profile, team invite, integration connect, first workflow, white-label setup).
- `completeStep(tenantId, stepId, data)` — validates step data, marks complete, emits `onboarding.step_completed`.
- `getOnboardingStatus(tenantId)` — returns completed/pending steps, percentage, and next recommended action.
- Resumable: incomplete flows resume from last completed step after re-login.
- `firm-feature-flags` governs which optional steps are shown per plan tier.
- Tests: step completion sequence, skip logic, resumption after interruption, plan-gated step visibility.

**Out of Scope:** Onboarding UI (Phase 7); in-product guided tours (Phase 7 `firm-product-tours`). **Rules:** Onboarding flows are never blocking — users can access the platform at any step; step data validated before marking complete. **Anti-Patterns:** No blocking platform access on incomplete onboarding; no persisting onboarding flow state in a cookie. **DDD:** Onboarding is a supporting domain service in the tenancy bounded context | **TDD:** User accessing platform with incomplete onboarding receives `getOnboardingStatus` with next step — never blocked | **BDD:** An agency resuming after browser close continues exactly where they left off without re-entering data | **Deep Module:** `getOnboardingStatus` resolves step sequence, plan-gated steps, and completion state in one call.

#### Subtasks
- [ ] **PH5.9.1** [AGENT] Scaffold `packages/firm-onboarding/package.json` and `tsconfig.json`.
- [ ] **PH5.9.2** [AGENT] Implement `createOnboardingFlow`, `completeStep`, `getOnboardingStatus`. File: `packages/firm-onboarding/src/flow.ts`.
- [ ] **PH5.9.3** [AGENT] Implement resumable state persistence. File: `packages/firm-onboarding/src/state.ts`.
- [ ] **PH5.9.4** [AGENT] Wire `firm-feature-flags` for plan-gated steps. File: `packages/firm-onboarding/src/flow.ts`.
- [ ] **PH5.9.5** [AGENT] Write tests. File: `packages/firm-onboarding/tests/`.

***

### PH5.10 – Build `firm-tasks`
- [ ] **PH5.10** | Status: Not Started | **Depends on PH5.1**

**Related files:** `packages/firm-tasks/src/`

**Definition of Done:**
- `createTask(tenantId, data)` — assignee, due date, priority, related entity (contact/opportunity/booking), custom fields via `firm-metadata-engine`.
- `completeTask(taskId, userId)` — validates assignee; emits `task.completed`; triggers `firm-workflow` evaluation.
- `listTasks(tenantId, filters)` — cursor-paginated, RLS-enforced; overdue filter.
- `reassignTask(taskId, newAssigneeId)` — emits `task.reassigned`; sends notification to new assignee.
- Overdue task job: scheduled via `firm-queue`; emits `task.overdue` events for overdue tasks.
- Tests: assignee validation, overdue detection, `firm-workflow` trigger on complete, RLS enforcement.

**Out of Scope:** Task UI (Phase 7). **Rules:** Only assignee or a manager (checked via `firm-auth` RBAC) may complete a task; overdue job must be idempotent; `task.completed` event must fire before workflow evaluation. **Anti-Patterns:** No completing tasks without assignee validation; no workflow trigger before task state committed. **DDD:** `Task` is a domain entity in the productivity bounded context | **TDD:** `completeTask` by non-assignee non-manager returns `PermissionDeniedError`; overdue job run twice emits `task.overdue` only for still-overdue tasks | **BDD:** Completing a task automatically triggers any workflow subscribed to `task.completed` — no manual intervention | **Deep Module:** `completeTask` hides assignee validation, state transition, event emission, and workflow trigger.

#### Subtasks
- [ ] **PH5.10.1** [AGENT] Scaffold `packages/firm-tasks/package.json` and `tsconfig.json`.
- [ ] **PH5.10.2** [AGENT] Implement `createTask`, `completeTask`, `listTasks`, `reassignTask`. Files: `packages/firm-tasks/src/`.
- [ ] **PH5.10.3** [AGENT] Implement overdue task scheduled job. File: `packages/firm-tasks/src/overdue.ts`.
- [ ] **PH5.10.4** [AGENT] Wire `firm-workflow` trigger on `task.completed`. File: `packages/firm-tasks/src/complete.ts`.
- [ ] **PH5.10.5** [AGENT] Write tests. File: `packages/firm-tasks/tests/`.

***

### PH5.11 – Build `firm-reporting` and `firm-analytics`
- [ ] **PH5.11** | Status: Not Started | **Depends on PH1.16, PH5.1–PH5.10**

**Related files:** `packages/firm-reporting/src/`, `packages/firm-analytics/src/`

**Definition of Done:**
- `firm-reporting`:
  - Read model projections for: contacts, pipeline opportunities, campaign metrics, booking revenue, form conversions. All projections populated via `firm-bus` event handlers writing to `firm-db-read`.
  - `generateReport(tenantId, type, filters, format)` — returns structured data or dispatches PDF render (`firm-template-engine`).
  - `scheduleReport(tenantId, config)` — recurring reports via `firm-queue`; delivered via `firm-notifications`.
  - `exportReport(reportId, format)` — CSV/XLSX/PDF via `firm-queue` job; download URL via `firm-media`.
  - All queries RLS-enforced against read model.
- `firm-analytics`:
  - `trackEvent(tenantId, userId, event, properties)` — consent-gated via `firm-consent`; writes to analytics read model.
  - `getMetrics(tenantId, metric, window)` — aggregated metrics with time-windowed rollups pre-computed by scheduled job.
  - Funnel analysis: `getFunnelConversion(tenantId, steps[])`.
  - Cohort analysis: `getCohortRetention(tenantId, cohortDef)`.
- Tests: read model projection accuracy, report export round-trip, consent gate on tracking, funnel/cohort calculation.

**Out of Scope:** Dashboards (Phase 7 apps); raw event streaming (Phase 8). **Rules:** All analytics writes consent-gated; read model is append-only (projections rebuilt from events); report exports always async. **Anti-Patterns:** No direct writes to read model tables outside event handlers; no blocking report exports. **DDD:** Reporting is a read-side projection; analytics is a supporting domain service | **TDD:** Projection test: `contact.created` event causes read model row to appear; consent test: EU user without consent — `trackEvent` stores nothing | **BDD:** A manager running a pipeline report sees live data reflecting the last committed transaction — not a stale snapshot | **Deep Module:** `generateReport` hides read model queries, format rendering, and async dispatch.

#### Subtasks
- [ ] **PH5.11.1** [AGENT] Scaffold `packages/firm-reporting/package.json` and `tsconfig.json`.
- [ ] **PH5.11.2** [AGENT] Implement `firm-bus` event handlers projecting into `firm-db-read` for all 5 entity types. File: `packages/firm-reporting/src/projections/`.
- [ ] **PH5.11.3** [AGENT] Implement `generateReport`, `scheduleReport`, `exportReport`. File: `packages/firm-reporting/src/report.ts`.
- [ ] **PH5.11.4** [AGENT] Scaffold `packages/firm-analytics/package.json` and `tsconfig.json`.
- [ ] **PH5.11.5** [AGENT] Implement `trackEvent` with consent gate. File: `packages/firm-analytics/src/track.ts`.
- [ ] **PH5.11.6** [AGENT] Implement `getMetrics` with pre-computed rollups. File: `packages/firm-analytics/src/metrics.ts`.
- [ ] **PH5.11.7** [AGENT] Implement `getFunnelConversion`, `getCohortRetention`. File: `packages/firm-analytics/src/funnel.ts`.
- [ ] **PH5.11.8** [AGENT] Write tests for both packages. Files: `packages/firm-reporting/tests/`, `packages/firm-analytics/tests/`.

***

### PH5.12 – Build `firm-billing`
- [ ] **PH5.12** | Status: Not Started | **Depends on PH3.4, PH4.12, PH1.28**

**Related files:** `packages/firm-billing/src/`

**Definition of Done:**
- `createSubscription(tenantId, planId, paymentMethodId)` — idempotent; charges via `PaymentPort`; activates plan via `firm-tenancy.updateTenant`; emits `subscription.created`.
- `changePlan(tenantId, newPlanId)` — prorated billing calculation; emits `subscription.plan_changed`; updates entitlements via `firm-feature-gates`.
- `cancelSubscription(tenantId, reason)` — end-of-period cancellation; schedules `firm-provisioning` deprovision; emits `subscription.cancelled`.
- Stripe webhook events consumed from `firm-webhook-receiver`: `payment_intent.succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`.
- Dunning: `invoice.payment_failed` triggers grace period → suspension after 3 failures.
- Usage-based billing: `recordBillableUsage(tenantId, metric, quantity)` — writes to Stripe usage records via `PaymentPort`.
- Tests: idempotent subscription create, proration calculation, dunning state machine, webhook-driven updates.

**Out of Scope:** Billing UI (Phase 7); multi-currency (Phase 8). **Rules:** `createSubscription` must be idempotent (same `paymentMethodId + planId` returns existing subscription); dunning grace period configurable; no subscription changes without audit log. **Anti-Patterns:** No direct Stripe SDK calls outside `PaymentPort` adapter; no subscription state stored only in Stripe. **DDD:** Billing is a core domain service in the billing bounded context | **TDD:** `createSubscription` called twice with same key returns existing subscription without double-charging; three `invoice.payment_failed` webhooks trigger suspension | **BDD:** A payment failure triggers an automatic retry sequence; if all retries fail, the agency is suspended with a grace period to update payment details | **Deep Module:** `createSubscription` hides idempotency, payment processing, and entitlement activation.

#### Subtasks
- [ ] **PH5.12.1** [AGENT] Scaffold `packages/firm-billing/package.json` and `tsconfig.json`.
- [ ] **PH5.12.2** [AGENT] Implement `createSubscription`, `changePlan`, `cancelSubscription`. File: `packages/firm-billing/src/subscription.ts`.
- [ ] **PH5.12.3** [AGENT] Implement Stripe webhook consumers via `firm-webhook-receiver`. File: `packages/firm-billing/src/webhooks.ts`.
- [ ] **PH5.12.4** [AGENT] Implement dunning state machine. File: `packages/firm-billing/src/dunning.ts`.
- [ ] **PH5.12.5** [AGENT] Implement `recordBillableUsage`. File: `packages/firm-billing/src/usage.ts`.
- [ ] **PH5.12.6** [AGENT] Write tests. File: `packages/firm-billing/tests/`.

***

### PH5.13 – Build `firm-integrations` (OAuth connection manager)
- [ ] **PH5.13** | Status: Not Started | **Depends on PH3.5, PH3.6, PH3.7**

**Related files:** `packages/firm-integrations/src/`

**Definition of Done:**
- `initiateOAuth(tenantId, provider)` — generates PKCE challenge, stores state, returns redirect URL.
- `handleOAuthCallback(state, code)` — exchanges code, stores encrypted tokens via `firm-crypto`, emits `integration.connected`.
- `refreshTokenIfNeeded(tenantId, provider)` — proactive refresh before expiry; called transparently by all adapter invocations.
- `revokeIntegration(tenantId, provider)` — revokes token with provider, deletes local token, emits `integration.disconnected`.
- `getConnectionStatus(tenantId, provider)` — returns `connected | expired | disconnected | error`.
- Token storage: encrypted at rest via `firm-crypto.encryptField`; never logged.
- Tests: PKCE state validation, token refresh on expiry, revocation, cross-tenant token isolation.

**Out of Scope:** Integration marketplace UI (Phase 7). **Rules:** Tokens encrypted at rest; PKCE mandatory for all OAuth flows; `refreshTokenIfNeeded` must be called transparently — no adapter should check token expiry manually; tokens never appear in logs. **Anti-Patterns:** No storing plaintext OAuth tokens; no adapter managing its own token refresh. **DDD:** Integration management is a supporting domain service | **TDD:** `handleOAuthCallback` with tampered state throws `InvalidOAuthStateError`; expired token triggers refresh before adapter call | **BDD:** A connected integration seamlessly refreshes its token in the background — users never see a reconnect prompt unless the token is fully revoked | **Deep Module:** `refreshTokenIfNeeded` makes token lifecycle invisible to adapter callers.

#### Subtasks
- [ ] **PH5.13.1** [AGENT] Scaffold `packages/firm-integrations/package.json` and `tsconfig.json`.
- [ ] **PH5.13.2** [AGENT] Implement `initiateOAuth`, `handleOAuthCallback` with PKCE. File: `packages/firm-integrations/src/oauth.ts`.
- [ ] **PH5.13.3** [AGENT] Implement `refreshTokenIfNeeded` with proactive refresh. File: `packages/firm-integrations/src/token.ts`.
- [ ] **PH5.13.4** [AGENT] Implement `revokeIntegration`, `getConnectionStatus`. File: `packages/firm-integrations/src/lifecycle.ts`.
- [ ] **PH5.13.5** [AGENT] Encrypt tokens via `firm-crypto.encryptField`. File: `packages/firm-integrations/src/token.ts`.
- [ ] **PH5.13.6** [AGENT] Write tests. File: `packages/firm-integrations/tests/`.

***

### PH5.14 – Build `firm-payments` (platform-level)
- [ ] **PH5.14** | Status: Not Started | **Depends on PH3.4, PH5.6**

**Related files:** `packages/firm-payments/src/`

**Definition of Done:**
- `createInvoice(tenantId, items[])` — generates invoice; associates with contact.
- `chargeBooking(bookingId, paymentMethodId)` — idempotent charge via `PaymentPort`; emits `payment.booking_charged`.
- `issueRefund(chargeId, amount?, reason)` — partial or full refund; emits `payment.refunded`; audit logged.
- `getPaymentHistory(tenantId, filters)` — cursor-paginated, RLS-enforced.
- SCA/3DS2 challenge flow: `createPaymentIntent → confirmPayment` two-step for EU customers.
- `firm-billing` uses `PaymentPort` for subscriptions; this package handles one-off charges.
- Tests: idempotent charge, partial refund, SCA flow initiation, payment history RLS.

**Out of Scope:** Subscription billing (PH5.12); invoicing UI (Phase 7). **Rules:** All charges idempotent via `PaymentPort` idempotency keys; SCA required for EU customers; all payment operations audited. **Anti-Patterns:** No direct Stripe SDK calls; no non-idempotent charges. **DDD:** Payments are a domain service in the billing bounded context | **TDD:** Same `idempotencyKey` — second charge returns original charge result without double-charging | **BDD:** An EU customer completing a booking is presented with a 3DS2 challenge when required by their bank | **Deep Module:** `chargeBooking` hides idempotency, SCA detection, and audit logging.

#### Subtasks
- [ ] **PH5.14.1** [AGENT] Scaffold `packages/firm-payments/package.json` and `tsconfig.json`.
- [ ] **PH5.14.2** [AGENT] Implement `createInvoice`, `chargeBooking`, `issueRefund`, `getPaymentHistory`. Files: `packages/firm-payments/src/`.
- [ ] **PH5.14.3** [AGENT] Implement SCA two-step payment intent flow. File: `packages/firm-payments/src/sca.ts`.
- [ ] **PH5.14.4** [AGENT] Write tests. File: `packages/firm-payments/tests/`.

***

### PH5.15 – Build `firm-attachments`
- [ ] **PH5.15** | Status: Not Started | **Depends on PH4.15**

**Related files:** `packages/firm-attachments/src/`

**Definition of Done:**
- `attachFile(tenantId, entityType, entityId, fileId)` — links `firm-media` file to an entity; validates entity type is in allow-list; emits `attachment.created`.
- `detachFile(attachmentId, userId)` — validates ownership; soft-deletes; emits `attachment.removed`.
- `listAttachments(tenantId, entityType, entityId)` — RLS-enforced.
- `deleteAllAttachments(tenantId, entityId)` — GDPR: called from erasure saga for each entity.
- Virus scan hook: `firm-queue` job dispatched on attach; infected files quarantined with `firm-audit` event.
- Tests: entity allow-list rejection, ownership validation, virus scan quarantine, erasure.

**Out of Scope:** File picker UI. **Rules:** Entity type allow-list enforced at attach time; virus scan is async but quarantine blocks download until scan complete; `deleteAllAttachments` must be idempotent. **Anti-Patterns:** No attaching to arbitrary entity types; no serving unscanned files. **DDD:** Attachments are a supporting domain service | **TDD:** `attachFile` to unknown entity type throws `InvalidEntityTypeError`; download of unscanned file returns 423 (Locked) | **BDD:** A file attached to a contact is immediately visible in the contact timeline but not downloadable until the async virus scan completes | **Deep Module:** `attachFile` hides allow-list validation, media linking, and async scan dispatch.

#### Subtasks
- [ ] **PH5.15.1** [AGENT] Scaffold `packages/firm-attachments/package.json` and `tsconfig.json`.
- [ ] **PH5.15.2** [AGENT] Implement `attachFile`, `detachFile`, `listAttachments`. File: `packages/firm-attachments/src/`.
- [ ] **PH5.15.3** [AGENT] Implement `deleteAllAttachments` (idempotent); wire into erasure saga. File: `packages/firm-attachments/src/erase.ts`.
- [ ] **PH5.15.4** [AGENT] Implement async virus scan queue job and quarantine logic. File: `packages/firm-attachments/src/scan.ts`.
- [ ] **PH5.15.5** [AGENT] Write tests. File: `packages/firm-attachments/tests/`.

***

### PH5.16 – Phase 5 acceptance criteria verification
- [ ] **PH5.16** | Status: Not Started | **Final Phase 5 gate**

**Definition of Done:**
- All Phase 5 packages build and pass tests on `main`.
- All `firm-bus` event handlers verified: no unregistered events emitted.
- GDPR erasure saga integration test: all Phase 5 entities covered (contacts, tasks, attachments, analytics events, campaigns).
- `firm-workflow` stage-change stub from PH5.3 wired and verified.
- `firm-consent` CNIL enforcement deadline (Jul 14) met — `shouldTrackEmail` active in `firm-notifications` and `firm-campaigns`.
- Coverage ≥80% on all Phase 5 packages.
- Gate 13 (Audit Coverage) passing: all auth and permission mutations in Phase 5 packages audited.

#### Subtasks
- [ ] **PH5.16.1** [AGENT] Run full test suite; confirm all Phase 5 packages ≥80% coverage.
- [ ] **PH5.16.2** [AGENT] Run GDPR erasure integration test; confirm all Phase 5 entities covered.
- [ ] **PH5.16.3** [AGENT] Confirm Gate 13 passing on `main`; fix any un-audited mutations.
- [ ] **PH5.16.4** [HUMAN] Verify CNIL enforcement active in production (Jul 14 deadline confirmed met).
- [ ] **PH5.16.5** [HUMAN] Sign off Phase 5 complete; tag release `v0.5.0-features-tier-b`.

***

---

## Phase 6: Feature Packages — Tier C

*Build all L6 Tier C feature packages. These are extended-capability modules that build on Tier B. May be built in parallel within the phase. Depends on all Phase 5 packages.*

***

### PH6.1 – Build `firm-workflow-builder` (definition engine)
- [ ] **PH6.1** | Status: Not Started | **Depends on PH5.8**

**Related files:** `packages/firm-workflow-builder/src/`

**Definition of Done:**
- `validateDefinition(definition)` — full ADR-007 condition tree validation; returns typed error list with path pointers.
- `suggestNextAction(tenantId, partialDefinition)` — AI-assisted next-action suggestion via `firm-model-runtime`; `checkQuota()` before call.
- `simulateWorkflow(tenantId, definition, mockContext)` — dry-run evaluation against mock context; returns step-by-step trace without side effects.
- `exportDefinition(workflowId, format)` — JSON and YAML export.
- `importDefinition(tenantId, raw, format)` — validated import; conflict detection against existing workflow names.
- Template library: `getWorkflowTemplates(category)` — curated starter templates per use-case category.
- Tests: validation catches all ADR-007 error types, simulation produces correct trace, AI suggestion quota gated, import conflict detection.

**Out of Scope:** Drag-and-drop canvas UI (Phase 7). **Rules:** `simulateWorkflow` must have zero side effects — no events emitted, no DB writes, no external calls; AI suggestion always `checkQuota()` first; template library is read-only (no tenant modification). **Anti-Patterns:** No side effects during simulation; no AI suggestions without quota check. **DDD:** Workflow builder is a supporting service in the automation bounded context | **TDD:** `simulateWorkflow` with a `send_email` action produces trace entry but zero `firm-bus` events; validation returns path-annotated errors | **BDD:** A non-technical user building a workflow sees AI suggestions that reflect their industry vertical — not generic defaults | **Deep Module:** `simulateWorkflow` executes the full condition tree against mock context in a sandboxed, side-effect-free environment.

#### Subtasks
- [ ] **PH6.1.1** [AGENT] Scaffold `packages/firm-workflow-builder/package.json` and `tsconfig.json`.
- [ ] **PH6.1.2** [AGENT] Implement `validateDefinition` with path-annotated error list. File: `packages/firm-workflow-builder/src/validate.ts`.
- [ ] **PH6.1.3** [AGENT] Implement `suggestNextAction` via `firm-model-runtime` with quota check. File: `packages/firm-workflow-builder/src/suggest.ts`.
- [ ] **PH6.1.4** [AGENT] Implement `simulateWorkflow` (zero side effects). File: `packages/firm-workflow-builder/src/simulate.ts`.
- [ ] **PH6.1.5** [AGENT] Implement `exportDefinition` (JSON, YAML) and `importDefinition` with conflict detection. File: `packages/firm-workflow-builder/src/io.ts`.
- [ ] **PH6.1.6** [AGENT] Implement `getWorkflowTemplates(category)`. File: `packages/firm-workflow-builder/src/templates.ts`.
- [ ] **PH6.1.7** [AGENT] Write tests. File: `packages/firm-workflow-builder/tests/`.

***

### PH6.2 – Build `firm-form-builder` (definition engine)
- [ ] **PH6.2** | Status: Not Started | **Depends on PH5.5**

**Related files:** `packages/firm-form-builder/src/`

**Definition of Done:**
- `createFormDefinition(tenantId, schema)` — structured field schema with types: `text`, `email`, `phone`, `select`, `multi-select`, `date`, `file`, `signature`, `payment`.
- `validateFormDefinition(definition)` — catches circular conditional logic; returns path-annotated errors.
- `generateEmbedScript(formId, options)` — produces self-contained JS embed snippet; CSP-compatible; nonce-injectable.
- `previewForm(formId, viewport)` — server-side rendering for thumbnail generation via `firm-template-engine`.
- `duplicateForm(formId, tenantId)` — deep-copies definition with new IDs; preserves conditional logic.
- `getFormConversionInsights(formId)` — field drop-off rates plus AI suggestions via `firm-model-runtime`.
- Tests: circular logic detection, embed script CSP compliance, duplication preserves conditions, AI insights quota gated.

**Out of Scope:** Form canvas drag-and-drop UI (Phase 7); multi-page form UX animations. **Rules:** Generated embed script must be CSP-compatible; no `unsafe-inline` in script content; `getFormConversionInsights` always `checkQuota()` before AI call. **Anti-Patterns:** No `eval()` or `Function()` in embed script; no AI call without quota check. **DDD:** Form builder is a supporting service in the lead-capture bounded context | **TDD:** Circular conditional: field A shows when field B = `yes`, field B shows when field A = `yes` — detected and rejected at validation | **BDD:** An embed script generated for a form works on any third-party site without requiring CSP modifications | **Deep Module:** `generateEmbedScript` encapsulates nonce injection, tenant isolation, and CSP compliance.

#### Subtasks
- [ ] **PH6.2.1** [AGENT] Scaffold `packages/firm-form-builder/package.json` and `tsconfig.json`.
- [ ] **PH6.2.2** [AGENT] Implement `createFormDefinition` with all field types. File: `packages/firm-form-builder/src/definition.ts`.
- [ ] **PH6.2.3** [AGENT] Implement `validateFormDefinition` with circular logic detection. File: `packages/firm-form-builder/src/validate.ts`.
- [ ] **PH6.2.4** [AGENT] Implement `generateEmbedScript` (CSP-compatible, nonce-injectable). File: `packages/firm-form-builder/src/embed.ts`.
- [ ] **PH6.2.5** [AGENT] Implement `previewForm` via `firm-template-engine`. File: `packages/firm-form-builder/src/preview.ts`.
- [ ] **PH6.2.6** [AGENT] Implement `duplicateForm`. File: `packages/firm-form-builder/src/duplicate.ts`.
- [ ] **PH6.2.7** [AGENT] Implement `getFormConversionInsights` with quota check. File: `packages/firm-form-builder/src/insights.ts`.
- [ ] **PH6.2.8** [AGENT] Write tests. File: `packages/firm-form-builder/tests/`.

***

### PH6.3 – Build `firm-site-builder` (definition engine)
- [ ] **PH6.3** | Status: Not Started | **Blocked by ADR-006 (PH1.2.7)**

**Related files:** `packages/firm-site-builder/src/`

**Definition of Done:**
- ADR-006 accepted before implementation.
- `createSiteDefinition(tenantId, config)` — stores page tree, component schema, SEO meta, routing rules.
- `publishSite(tenantId, siteId)` — triggers static generation job (ephemeral or committed per ADR-006); emits `site.published`.
- `unpublishSite(tenantId, siteId)` — removes published assets; emits `site.unpublished`.
- `previewPage(tenantId, pageId, viewport)` — server-rendered preview without publishing.
- `generateSEOReport(siteId)` — meta completeness, canonical URLs, structured data validity.
- White-label theming: resolves `firm-white-label` config into component style tokens.
- Tests: publish job enqueued (not executed inline), preview side-effect-free, SEO report field completeness, white-label token injection.

**Out of Scope:** WYSIWYG drag-and-drop canvas (Phase 7); CDN invalidation (Phase 8). **Rules:** ADR-006 must be accepted first; `publishSite` is always async via `firm-queue`; `previewPage` must have zero side effects; white-label tokens must override without forking component code. **Anti-Patterns:** No synchronous site generation on publish request; no preview with side effects. **DDD:** Site builder is a supporting service in the client-portal bounded context | **TDD:** `publishSite` enqueues job and emits event; no static files written synchronously | **BDD:** An agency publishing a site sees a preview that matches production exactly — no surprises after publish | **Deep Module:** `publishSite` hides generation strategy (per ADR-006), queue dispatch, and white-label token resolution.

#### Subtasks
- [ ] **PH6.3.1** [HUMAN] Confirm ADR-006 accepted. File: `docs/adr/0006-client-site-generation.md`.
- [ ] **PH6.3.2** [AGENT] Scaffold `packages/firm-site-builder/package.json` and `tsconfig.json`.
- [ ] **PH6.3.3** [AGENT] Implement `createSiteDefinition`, `publishSite`, `unpublishSite`. File: `packages/firm-site-builder/src/site.ts`.
- [ ] **PH6.3.4** [AGENT] Implement `previewPage` (zero side effects). File: `packages/firm-site-builder/src/preview.ts`.
- [ ] **PH6.3.5** [AGENT] Implement `generateSEOReport`. File: `packages/firm-site-builder/src/seo.ts`.
- [ ] **PH6.3.6** [AGENT] Wire `firm-white-label` token resolution into component style system. File: `packages/firm-site-builder/src/theme.ts`.
- [ ] **PH6.3.7** [AGENT] Write tests. File: `packages/firm-site-builder/tests/`.

***

### PH6.4 – Build `firm-client-portal-builder`
- [ ] **PH6.4** | Status: Not Started | **Depends on PH6.3, PH4.2**

**Related files:** `packages/firm-client-portal-builder/src/`

**Definition of Done:**
- `createPortalDefinition(tenantId, config)` — configures portal sections: dashboard, invoices, documents, bookings, messages, custom pages.
- `publishPortal(tenantId, portalId)` — delegates to `firm-site-builder.publishSite`; additionally provisions portal auth routes via `firm-auth`.
- `getPortalAccessToken(tenantId, contactId, ttl)` — generates a scoped, short-lived magic-link token for passwordless portal access.
- `revokePortalAccess(tenantId, contactId)` — invalidates all active tokens for contact; audit logged.
- `customiseSections(portalId, sectionConfig)` — tenant-configurable section visibility and ordering.
- Tests: token scoping (contact-only access), revocation, section visibility config, portal auth route provisioning.

**Out of Scope:** Portal canvas UI (Phase 7). **Rules:** Portal tokens must be short-lived (max 72h) and single-use; `revokePortalAccess` must be synchronous for GDPR compliance; portal sections must be additive — no removing platform-required sections. **Anti-Patterns:** No long-lived portal session tokens; no synchronous `publishPortal`. **DDD:** Client portal is a domain service in the client-relationship bounded context | **TDD:** Token used twice: second use returns `401 TokenAlreadyUsed`; `revokePortalAccess` invalidates all outstanding tokens synchronously | **BDD:** A client clicking a magic link gets seamless portal access without registering a password | **Deep Module:** `getPortalAccessToken` hides token generation, scoping, single-use enforcement, and Redis TTL management.

#### Subtasks
- [ ] **PH6.4.1** [AGENT] Scaffold `packages/firm-client-portal-builder/package.json` and `tsconfig.json`.
- [ ] **PH6.4.2** [AGENT] Implement `createPortalDefinition`, `customiseSections`. File: `packages/firm-client-portal-builder/src/portal.ts`.
- [ ] **PH6.4.3** [AGENT] Implement `publishPortal` delegating to `firm-site-builder`. File: `packages/firm-client-portal-builder/src/publish.ts`.
- [ ] **PH6.4.4** [AGENT] Implement `getPortalAccessToken` (single-use, Redis TTL). File: `packages/firm-client-portal-builder/src/token.ts`.
- [ ] **PH6.4.5** [AGENT] Implement `revokePortalAccess` (synchronous, audit logged). File: `packages/firm-client-portal-builder/src/revoke.ts`.
- [ ] **PH6.4.6** [AGENT] Write tests. File: `packages/firm-client-portal-builder/tests/`.

***

### PH6.5 – Build `firm-reputation`
- [ ] **PH6.5** | Status: Not Started | **Depends on PH5.1, PH4.14**

**Related files:** `packages/firm-reputation/src/`

**Definition of Done:**
- `requestReview(tenantId, contactId, channel)` — checks consent; sends review request via `firm-notifications`; rate-limited (max 1 request per contact per 30 days).
- `ingestReview(tenantId, source, data)` — ingests from webhooks (Google, Facebook, Yelp via `firm-webhook-receiver`); deduplicates by `sourceId`.
- `getReputationScore(tenantId)` — weighted aggregate score across sources; cached 1h.
- `respondToReview(tenantId, reviewId, response)` — posts response via provider API (where supported); audit logged.
- Review request suppression: checks `firm-consent` for marketing opt-out before sending.
- Tests: 30-day rate limiting per contact, deduplication, score calculation, consent suppression.

**Out of Scope:** Reputation management UI (Phase 7); sentiment AI analysis (PH6.9). **Rules:** Never request a review from a contact who has opted out of marketing; 30-day cooldown enforced via `firm-rate-limiter` named policy `review-request`; score cache must invalidate on new review ingest. **Anti-Patterns:** No review request without consent check; no requesting reviews more than once per 30 days per contact. **DDD:** Reputation is a supporting domain service in the marketing bounded context | **TDD:** `requestReview` for a contact with active rate-limit window returns `RateLimitError` without sending; new review ingestion invalidates score cache | **BDD:** A contact who unsubscribed from marketing never receives a review request — even if triggered manually | **Deep Module:** `requestReview` hides consent checking, rate limiting, and notification dispatch.

#### Subtasks
- [ ] **PH6.5.1** [AGENT] Scaffold `packages/firm-reputation/package.json` and `tsconfig.json`.
- [ ] **PH6.5.2** [AGENT] Implement `requestReview` with consent check and rate limiter. File: `packages/firm-reputation/src/request.ts`.
- [ ] **PH6.5.3** [AGENT] Implement `ingestReview` with deduplication. File: `packages/firm-reputation/src/ingest.ts`.
- [ ] **PH6.5.4** [AGENT] Implement `getReputationScore` with 1h cache. File: `packages/firm-reputation/src/score.ts`.
- [ ] **PH6.5.5** [AGENT] Implement `respondToReview` with audit log. File: `packages/firm-reputation/src/respond.ts`.
- [ ] **PH6.5.6** [AGENT] Write tests. File: `packages/firm-reputation/tests/`.

***

### PH6.6 – Build `firm-social-planner`
- [ ] **PH6.6** | Status: Not Started | **Depends on PH4.15, PH5.7**

**Related files:** `packages/firm-social-planner/src/`

**Definition of Done:**
- `schedulePost(tenantId, post)` — validates media assets via `firm-media`; enqueues publish job at scheduled time via `firm-queue`; emits `social.post_scheduled`.
- `publishPost(postId)` — publishes to configured social accounts via provider adapters; emits `social.post_published`; updates metrics.
- `cancelPost(postId)` — dequeues scheduled job; emits `social.post_cancelled`.
- `getPostMetrics(postId)` — reach, impressions, engagement pulled from provider APIs.
- Content calendar: `getCalendar(tenantId, window)` — returns all scheduled and published posts in window.
- AI caption generation: `suggestCaption(tenantId, mediaId, tone)` via `firm-model-runtime`; `checkQuota()` before call.
- Tests: scheduled publish fires at correct time (mock clock), cancelled post does not publish, AI caption quota gated, media validation rejection.

**Out of Scope:** Social listening; social ad management. **Rules:** Media assets must pass `firm-media` validation before scheduling; `publishPost` is always executed via queue — never inline; AI caption always `checkQuota()` first. **Anti-Patterns:** No inline synchronous publishing; no scheduling posts with unvalidated media; no AI caption without quota check. **DDD:** Social planner is a domain service in the marketing bounded context | **TDD:** Scheduled post job fires at `scheduledAt` time (mock clock); cancellation removes job before firing | **BDD:** An AI-assisted caption suggestion is generated from the uploaded image content — not a generic template | **Deep Module:** `schedulePost` hides media validation, job scheduling, and event emission.

#### Subtasks
- [ ] **PH6.6.1** [AGENT] Scaffold `packages/firm-social-planner/package.json` and `tsconfig.json`.
- [ ] **PH6.6.2** [AGENT] Implement `schedulePost`, `publishPost`, `cancelPost`. File: `packages/firm-social-planner/src/post.ts`.
- [ ] **PH6.6.3** [AGENT] Implement `getPostMetrics`. File: `packages/firm-social-planner/src/metrics.ts`.
- [ ] **PH6.6.4** [AGENT] Implement `getCalendar(tenantId, window)`. File: `packages/firm-social-planner/src/calendar.ts`.
- [ ] **PH6.6.5** [AGENT] Implement `suggestCaption` with quota check. File: `packages/firm-social-planner/src/ai.ts`.
- [ ] **PH6.6.6** [AGENT] Write tests. File: `packages/firm-social-planner/tests/`.

***

### PH6.7 – Build `firm-export`
- [ ] **PH6.7** | Status: Not Started | **Depends on PH5.11, PH4.15**

**Related files:** `packages/firm-export/src/`

**Definition of Done:**
- `createExportJob(tenantId, config)` — entity types: contacts, pipeline, campaigns, bookings, audit log; formats: CSV, XLSX, JSON, PDF; enqueued via `firm-queue`; returns `jobId`.
- Streaming export via `firm-streams.pipelineAsync`: DB cursor → transform → format encoder → `firm-media` upload.
- Progress events via `firm-sse`.
- `getExportDownloadUrl(jobId, userId)` — generates presigned URL from `firm-media`; validates ownership; expires in 24h.
- GDPR data export: `createGdprExport(tenantId, userId)` — collects all entity types; packages as ZIP; called from `firm-gdpr`.
- Encrypted export option: passphrase-based AES-256-GCM encryption via `firm-crypto`.
- Tests: streaming large dataset (10k rows), encrypted export round-trip, presigned URL expiry, GDPR completeness (all entity types present).

**Out of Scope:** Export UI (Phase 7). **Rules:** Exports are always async; download URLs expire in 24h; GDPR export must cover every entity type (test enforces completeness); encrypted exports use `firm-crypto` — no custom encryption. **Anti-Patterns:** No synchronous exports; no non-expiring download URLs; no custom encryption logic. **DDD:** Export is a supporting domain service | **TDD:** GDPR export test asserts all entity types present in ZIP; encrypted export verified decryptable with correct passphrase and fails with wrong passphrase | **BDD:** A user exporting 50,000 contacts sees a live progress bar; the download link is ready within minutes and expires in 24 hours | **Deep Module:** `createExportJob` hides streaming, format encoding, encryption, and storage upload.

#### Subtasks
- [ ] **PH6.7.1** [AGENT] Scaffold `packages/firm-export/package.json` and `tsconfig.json`.
- [ ] **PH6.7.2** [AGENT] Implement `createExportJob` with all entity types and formats, `firm-queue` dispatch. File: `packages/firm-export/src/job.ts`.
- [ ] **PH6.7.3** [AGENT] Implement streaming pipeline via `firm-streams.pipelineAsync`. File: `packages/firm-export/src/stream.ts`.
- [ ] **PH6.7.4** [AGENT] Implement `getExportDownloadUrl` with 24h expiry and ownership validation. File: `packages/firm-export/src/download.ts`.
- [ ] **PH6.7.5** [AGENT] Implement `createGdprExport`; wire into `firm-gdpr`. File: `packages/firm-export/src/gdpr.ts`.
- [ ] **PH6.7.6** [AGENT] Implement AES-256-GCM encrypted export option via `firm-crypto`. File: `packages/firm-export/src/encrypt.ts`.
- [ ] **PH6.7.7** [AGENT] Write tests. File: `packages/firm-export/tests/`.

***

### PH6.8 – Build `firm-ai-agents` (agent definitions and registry)
- [ ] **PH6.8** | Status: Not Started | **Depends on PH4.10, PH4.9**

**Related files:** `packages/firm-ai-agents/src/`

**Definition of Done:**
- `registerAgent(tenantId, definition)` — stores versioned agent definition: system prompt (via `firm-prompts`), tools list, memory config, model preferences, max steps, delegated scope.
- `getAgent(tenantId, agentId)` — resolves active version; Redis-cached.
- `deployAgent(tenantId, agentId)` — activates version; emits `agent.deployed`; previous version soft-archived.
- `testAgent(tenantId, agentId, testCase)` — runs agent against test case in simulation mode (zero side effects, uses `firm-workflow-builder.simulateWorkflow` pattern).
- Platform agent library: `getPlatformAgents(category)` — curated agents (lead qualifier, booking assistant, support bot); non-modifiable by tenants.
- Agent permissions: each agent definition declares required tool permissions; `firm-auth` RBAC validated at deploy time.
- Tests: version pinning, deploy invalidates cache, test mode zero side effects, RBAC validation at deploy.

**Out of Scope:** Agent execution (handled by `firm-agent-runtime`); agent analytics dashboard (Phase 7). **Rules:** Agent deployment validates all declared tool permissions against `firm-auth` RBAC before activation; test mode must have zero side effects; platform agents are immutable. **Anti-Patterns:** No deploying agents with undeclared tool permissions; no side effects in test mode. **DDD:** Agent definition is a domain entity in the AI bounded context | **TDD:** Deploying an agent declaring `send_email` permission without `notifications:send` RBAC grant fails deployment | **BDD:** A tenant deploying a custom agent sees immediate validation feedback if their agent requests permissions their plan doesn't include | **Deep Module:** `deployAgent` encapsulates version management, RBAC validation, cache invalidation, and event emission.

#### Subtasks
- [ ] **PH6.8.1** [AGENT] Scaffold `packages/firm-ai-agents/package.json` and `tsconfig.json`.
- [ ] **PH6.8.2** [AGENT] Implement `registerAgent`, `getAgent`, `deployAgent`. File: `packages/firm-ai-agents/src/agent.ts`.
- [ ] **PH6.8.3** [AGENT] Implement `testAgent` in zero-side-effect simulation mode. File: `packages/firm-ai-agents/src/test.ts`.
- [ ] **PH6.8.4** [AGENT] Implement platform agent library. File: `packages/firm-ai-agents/src/platform-agents/`.
- [ ] **PH6.8.5** [AGENT] Implement RBAC permission validation at deploy time. File: `packages/firm-ai-agents/src/deploy.ts`.
- [ ] **PH6.8.6** [AGENT] Write tests. File: `packages/firm-ai-agents/tests/`.

***

### PH6.9 – Build `firm-ai-insights`
- [ ] **PH6.9** | Status: Not Started | **Depends on PH4.5, PH5.11, PH6.5**

**Related files:** `packages/firm-ai-insights/src/`

**Definition of Done:**
- `generateLeadScore(tenantId, contactId)` — scores lead 0–100 from engagement, pipeline stage, form submissions, booking history; writes to contact record; emits `lead.scored`.
- `generateReputationSentiment(tenantId, reviewId)` — sentiment classification (positive/neutral/negative) plus topic extraction; writes to review record.
- `generateCampaignInsight(tenantId, campaignId)` — natural-language performance summary with actionable recommendations.
- `generateChurnRisk(tenantId, contactId)` — churn probability 0–1 with feature attribution.
- All functions: `checkQuota()` before model call; `recordUsage()` after; results written to `ai_generation_log` with `disclosure_label`; `approveContent()` not required for analytics outputs (non-consumer-facing).
- Scheduled jobs for bulk scoring via `firm-queue`.
- Tests: quota gating, `lead.scored` event emission, sentiment classification accuracy (fixture-based), disclosure label present.

**Out of Scope:** Insights UI (Phase 7); predictive ad spend (Phase 8). **Rules:** All model calls quota-gated; analytics outputs (scores, sentiment) still written to `ai_generation_log` with `disclosure_label` even though human approval not required; no insights without quota check. **Anti-Patterns:** No model calls without quota check; no analytics outputs without `disclosure_label`. **DDD:** AI insights is a supporting domain service in the AI bounded context | **TDD:** `generateLeadScore` with exhausted quota returns `QuotaExceeded`; `disclosure_label` present on every `ai_generation_log` row | **BDD:** A sales rep opening a contact record sees an AI-generated lead score with a clear disclosure label indicating it was AI-generated | **Deep Module:** `generateLeadScore` hides feature extraction, model call, quota enforcement, and result persistence.

#### Subtasks
- [ ] **PH6.9.1** [AGENT] Scaffold `packages/firm-ai-insights/package.json` and `tsconfig.json`.
- [ ] **PH6.9.2** [AGENT] Implement `generateLeadScore` with feature extraction, quota guard, `lead.scored` event. File: `packages/firm-ai-insights/src/lead-score.ts`.
- [ ] **PH6.9.3** [AGENT] Implement `generateReputationSentiment`. File: `packages/firm-ai-insights/src/sentiment.ts`.
- [ ] **PH6.9.4** [AGENT] Implement `generateCampaignInsight`. File: `packages/firm-ai-insights/src/campaign.ts`.
- [ ] **PH6.9.5** [AGENT] Implement `generateChurnRisk`. File: `packages/firm-ai-insights/src/churn.ts`.
- [ ] **PH6.9.6** [AGENT] Implement scheduled bulk-scoring jobs. File: `packages/firm-ai-insights/src/scheduled.ts`.
- [ ] **PH6.9.7** [AGENT] Write tests. File: `packages/firm-ai-insights/tests/`.

***

### PH6.10 – Build `firm-ai-brand-voice`
- [ ] **PH6.10** | Status: Not Started | **Depends on PH4.11, PH4.16**

**Related files:** `packages/firm-ai-brand-voice/src/`

**Definition of Done:**
- `trainBrandVoice(tenantId, samples[])` — ingests writing samples; generates style embedding via `firm-context-engine`; stores as tenant brand voice profile.
- `applyBrandVoice(tenantId, draft)` — rewrites draft content to match brand voice profile; `checkQuota()` before model call; output written to `ai_generation_log` as `pending_approval`.
- `scoreBrandVoiceAlignment(tenantId, content)` — returns 0–1 alignment score without rewriting.
- `deleteBrandVoiceProfile(tenantId)` — GDPR: removes embeddings from `firm-vector-store`; idempotent.
- Tests: training produces embedding, `applyBrandVoice` output always `pending_approval`, alignment score range, GDPR deletion idempotency.

**Out of Scope:** Brand voice UI (Phase 7). **Rules:** `applyBrandVoice` output is always `pending_approval` — human review required before use; quota check mandatory; brand voice embeddings are tenant-scoped. **Anti-Patterns:** No auto-approving brand voice rewrites; no cross-tenant brand voice access. **DDD:** Brand voice is a domain service in the content bounded context | **TDD:** `applyBrandVoice` always returns `status: pending_approval`; `deleteBrandVoiceProfile` called twice returns `ok` both times | **BDD:** Content rewritten by the AI carries the agency's tone and style — reviewers can accept or reject before it reaches clients | **Deep Module:** `applyBrandVoice` hides embedding retrieval, style-conditioned generation, and approval state management.

#### Subtasks
- [ ] **PH6.10.1** [AGENT] Scaffold `packages/firm-ai-brand-voice/package.json` and `tsconfig.json`.
- [ ] **PH6.10.2** [AGENT] Implement `trainBrandVoice` with embedding storage. File: `packages/firm-ai-brand-voice/src/train.ts`.
- [ ] **PH6.10.3** [AGENT] Implement `applyBrandVoice` (quota check, always `pending_approval`). File: `packages/firm-ai-brand-voice/src/apply.ts`.
- [ ] **PH6.10.4** [AGENT] Implement `scoreBrandVoiceAlignment`. File: `packages/firm-ai-brand-voice/src/score.ts`.
- [ ] **PH6.10.5** [AGENT] Implement `deleteBrandVoiceProfile` (idempotent); wire into erasure saga. File: `packages/firm-ai-brand-voice/src/delete.ts`.
- [ ] **PH6.10.6** [AGENT] Write tests. File: `packages/firm-ai-brand-voice/tests/`.

***

### PH6.11 – Build `firm-ai-chat` (backend)
- [ ] **PH6.11** | Status: Not Started | **Depends on PH4.8, PH4.10, PH6.8**

**Related files:** `packages/firm-ai-chat/src/`

**Definition of Done:**
- `startChatSession(tenantId, agentId, userId, channel)` — creates conversation via `firm-conversation-flow`; resolves agent via `firm-ai-agents`; returns `sessionId`.
- `sendMessage(sessionId, content)` — appends user turn; invokes `firm-agent-runtime.runAgent`; streams response via `firm-sse`.
- `endChatSession(sessionId)` — closes conversation; persists summary to `firm-ai-memory`; emits `chat.session_ended`.
- `getChatHistory(sessionId, userId)` — RLS-enforced; validates ownership.
- Channel variants: widget, portal, API (all share the same backend).
- Typing indicator: `firm-sse` event `chat.typing` emitted during model call.
- Tests: ownership validation on history, typing indicator emitted before response, session end persists memory.

**Out of Scope:** Chat widget UI (Phase 7); chat analytics (Phase 7). **Rules:** Chat history access always RLS-validated against `userId`; `firm-agent-runtime` is the only execution path — no direct model calls; typing indicator emitted before model invocation, cleared after. **Anti-Patterns:** No direct model calls bypassing `firm-agent-runtime`; no serving another user's chat history. **DDD:** Chat is a domain service in the communication bounded context | **TDD:** `getChatHistory` for wrong `userId` returns empty array (RLS-enforced, not 403); typing indicator SSE event precedes assistant turn | **BDD:** A website visitor chatting with a bot sees a typing indicator immediately — never a blank screen while waiting for the AI | **Deep Module:** `sendMessage` orchestrates conversation turn, agent execution, streaming, and indicator management.

#### Subtasks
- [ ] **PH6.11.1** [AGENT] Scaffold `packages/firm-ai-chat/package.json` and `tsconfig.json`.
- [ ] **PH6.11.2** [AGENT] Implement `startChatSession`, `sendMessage`, `endChatSession`. File: `packages/firm-ai-chat/src/session.ts`.
- [ ] **PH6.11.3** [AGENT] Implement `getChatHistory` with RLS ownership validation. File: `packages/firm-ai-chat/src/history.ts`.
- [ ] **PH6.11.4** [AGENT] Implement typing indicator via `firm-sse`. File: `packages/firm-ai-chat/src/typing.ts`.
- [ ] **PH6.11.5** [AGENT] Write tests. File: `packages/firm-ai-chat/tests/`.

***

### PH6.12 – Build `firm-ai-send-time`
- [ ] **PH6.12** | Status: Not Started | **Depends on PH5.7, PH6.9**

**Related files:** `packages/firm-ai-send-time/src/`

**Definition of Done:**
- `predictOptimalSendTime(tenantId, contactId, channel)` — predicts best send time per contact and channel from engagement history; `checkQuota()` before model call; returns ISO-8601 datetime.
- `applyOptimalSendTime(campaignId)` — replaces fixed send time with per-recipient predictions; stores as campaign override map.
- `getSendTimeInsights(tenantId, channel)` — aggregate send-time patterns (best hours/days) for tenant-level reporting.
- Fallback: if insufficient engagement history, returns default business-hours recommendation without model call.
- Tests: quota gate, fallback when no history, per-recipient override map accuracy, insights aggregation.

**Out of Scope:** Send-time UI (Phase 7); A/B testing of send times (handled by `firm-campaigns`). **Rules:** Quota check mandatory before any model call; fallback must not call the model (cost control); per-recipient override map must be idempotent on re-generation. **Anti-Patterns:** No model call without quota check; no calling model when fallback is sufficient. **DDD:** Send-time optimisation is a supporting AI service in the marketing bounded context | **TDD:** Contact with no engagement history returns default recommendation without any model call; quota exhausted returns `QuotaExceeded` | **BDD:** A campaign using AI send-time optimisation delivers emails at different times for each recipient based on their individual engagement patterns | **Deep Module:** `predictOptimalSendTime` hides engagement history retrieval, model call decision, and fallback logic.

#### Subtasks
- [ ] **PH6.12.1** [AGENT] Scaffold `packages/firm-ai-send-time/package.json` and `tsconfig.json`.
- [ ] **PH6.12.2** [AGENT] Implement `predictOptimalSendTime` with quota check and fallback. File: `packages/firm-ai-send-time/src/predict.ts`.
- [ ] **PH6.12.3** [AGENT] Implement `applyOptimalSendTime`. File: `packages/firm-ai-send-time/src/apply.ts`.
- [ ] **PH6.12.4** [AGENT] Implement `getSendTimeInsights`. File: `packages/firm-ai-send-time/src/insights.ts`.
- [ ] **PH6.12.5** [AGENT] Write tests. File: `packages/firm-ai-send-time/tests/`.

***

### PH6.13 – Phase 6 acceptance criteria verification
- [ ] **PH6.13** | Status: Not Started | **Final Phase 6 gate**

**Definition of Done:**
- All Phase 6 packages build and pass tests on `main`.
- All AI-generating packages: `disclosure_label` present on every `ai_generation_log` row — verified by dedicated integration test.
- `firm-site-builder` and `firm-form-builder` embed scripts pass CSP audit.
- `firm-workflow-builder` simulation produces zero `firm-bus` events — verified in test.
- `firm-ai-agents` test mode produces zero side effects — verified in test.
- GDPR erasure saga updated: `firm-ai-brand-voice` brand voice embeddings covered.
- Coverage ≥80% on all Phase 6 packages.
- Gate New2 (AI content approval bypass) still passing across all new packages.

#### Subtasks
- [ ] **PH6.13.1** [AGENT] Run full test suite; confirm all Phase 6 packages ≥80% coverage.
- [ ] **PH6.13.2** [AGENT] Run `disclosure_label` integration test across all AI-generating packages.
- [ ] **PH6.13.3** [AGENT] Run GDPR erasure saga integration test; confirm `firm-ai-brand-voice` covered.
- [ ] **PH6.13.4** [AGENT] Run CSP audit on embed scripts from `firm-site-builder` and `firm-form-builder`.
- [ ] **PH6.13.5** [AGENT] Confirm Gate New2 passing on `main`.
- [ ] **PH6.13.6** [HUMAN] Sign off Phase 6 complete; tag release `v0.6.0-features-tier-c`.

***

---

## Phase 7: Application Layer

*Build all Next.js applications and shared UI packages. Applications may be built in parallel within the phase. Depends on all Phase 6 packages.*

***

### PH7.1 – Build `firm-ui` (shared component library)
- [ ] **PH7.1** | Status: Not Started | **Blocks all app packages**

**Related files:** `packages/firm-ui/src/`

**Definition of Done:**
- Design token system: all colours, spacing, typography, radii, and shadows derived from `firm-white-label.resolveTheme()` — zero hardcoded values.
- Primitive components (Radix UI headless): `Button`, `Input`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, `Textarea`, `Badge`, `Avatar`, `Tooltip`, `Popover`, `Dialog`, `Sheet`, `Tabs`, `Accordion`, `DropdownMenu`, `ContextMenu`, `Command`, `Combobox`.
- Compound components: `DataTable` (TanStack Table — virtualised, sortable, filterable, column-pinning), `Form` (React Hook Form + `firm-validators` Zod resolver), `FileUpload` (drag-and-drop, progress via SSE, `firm-media` integration), `RichTextEditor` (Tiptap), `DatePicker`, `DateRangePicker`, `TimePicker`, `ColorPicker`, `CodeEditor` (Monaco).
- AI-aware components: `AIGeneratedBadge` (disclosure label display), `AIApprovalCard` (approve/reject pending content), `StreamingText` (SSE-backed character-by-character render).
- All components: WCAG 2.2 AA, `expectNoA11yViolations` in every Storybook story, keyboard-navigable, RTL-compatible.
- Storybook: every component has stories for all variants and states; visual regression tests via Chromatic.
- Bundle: tree-shakeable, no CSS-in-JS runtime cost, Tailwind v4 CSS-only.
- `firm-config-stylelint` wired; zero linting violations.

**Out of Scope:** App-specific page compositions (built per-app). **Rules:** Zero hardcoded design tokens; all interactive components keyboard-navigable; `AIGeneratedBadge` must be non-removable when `disclosure_label` is present; `expectNoA11yViolations` in every story. **Anti-Patterns:** No hardcoded hex values; no skipping axe-core tests; no CSS-in-JS runtime. **DDD:** UI is a technical presentation layer | **TDD:** N/A | **BDD:** A keyboard-only user can complete any form, open any dialog, and navigate any table without a mouse | **Deep Module:** `DataTable` hides TanStack Table configuration, virtualisation, and RLS-aware data fetching.

#### Subtasks
- [ ] **PH7.1.1** [AGENT] Scaffold `packages/firm-ui/package.json`, `tsconfig.json`, Storybook config via `firm-config-storybook`.
- [ ] **PH7.1.2** [AGENT] Implement design token system wired to `firm-white-label.resolveTheme()`. File: `packages/firm-ui/src/tokens/`.
- [ ] **PH7.1.3** [AGENT] Implement all 20 primitive components with Radix UI. File: `packages/firm-ui/src/primitives/`.
- [ ] **PH7.1.4** [AGENT] Implement `DataTable` with TanStack Table virtualisation and column-pinning. File: `packages/firm-ui/src/compounds/data-table/`.
- [ ] **PH7.1.5** [AGENT] Implement `Form` compound with React Hook Form and `firm-validators` Zod resolver. File: `packages/firm-ui/src/compounds/form/`.
- [ ] **PH7.1.6** [AGENT] Implement `FileUpload` with SSE progress and `firm-media` integration. File: `packages/firm-ui/src/compounds/file-upload/`.
- [ ] **PH7.1.7** [AGENT] Implement `RichTextEditor` (Tiptap), `DatePicker`, `DateRangePicker`, `TimePicker`, `ColorPicker`, `CodeEditor` (Monaco). File: `packages/firm-ui/src/compounds/`.
- [ ] **PH7.1.8** [AGENT] Implement AI-aware components: `AIGeneratedBadge`, `AIApprovalCard`, `StreamingText`. File: `packages/firm-ui/src/ai/`.
- [ ] **PH7.1.9** [AGENT] Write Storybook stories for all components; add `expectNoA11yViolations` assertion in every story. File: `packages/firm-ui/src/**/*.stories.tsx`.
- [ ] **PH7.1.10** [AGENT] Configure Chromatic visual regression tests. File: `.github/workflows/chromatic.yml`.
- [ ] **PH7.1.11** [AGENT] Wire `firm-config-stylelint`; fix all violations.

***

### PH7.2 – Build `firm-ui-charts`
- [ ] **PH7.2** | Status: Not Started | **Depends on PH7.1**

**Related files:** `packages/firm-ui-charts/src/`

**Definition of Done:**
- Chart components (Recharts/Visx): `LineChart`, `AreaChart`, `BarChart`, `StackedBarChart`, `PieChart`, `DonutChart`, `FunnelChart`, `HeatmapChart`, `SparklineChart`, `GaugeChart`.
- All charts: white-label token-driven colours, responsive, animated, accessible (ARIA descriptions, keyboard focus on data points).
- `MetricCard` compound: value, trend indicator, sparkline, comparison period.
- `ReportDashboard` layout: draggable/resizable chart tiles, saved layout persistence via `firm-cache`.
- Empty states: skeleton loaders for all chart types.
- Tests: all charts render with empty data without crashing; ARIA description present.

**Out of Scope:** Real-time data streaming into charts (wired per-app). **Rules:** Charts must render gracefully with empty data; all colours from white-label tokens — no hardcoded values; keyboard-navigable data points mandatory. **Anti-Patterns:** No hardcoded chart colours; no crashing on empty data. **DDD:** N/A | **TDD:** All chart components render with `data=[]` without throwing | **BDD:** A screen reader user navigating a bar chart can hear the value of each bar via ARIA descriptions | **Deep Module:** `ReportDashboard` hides tile persistence, drag-and-drop, and data-loading orchestration.

#### Subtasks
- [ ] **PH7.2.1** [AGENT] Scaffold `packages/firm-ui-charts/package.json` and `tsconfig.json`.
- [ ] **PH7.2.2** [AGENT] Implement all 10 chart components with white-label tokens and accessibility. File: `packages/firm-ui-charts/src/charts/`.
- [ ] **PH7.2.3** [AGENT] Implement `MetricCard` and `ReportDashboard` with layout persistence. File: `packages/firm-ui-charts/src/compounds/`.
- [ ] **PH7.2.4** [AGENT] Write tests including empty-data render and ARIA. File: `packages/firm-ui-charts/tests/`.

***

### PH7.3 – Build `firm-ui-kanban`
- [ ] **PH7.3** | Status: Not Started | **Depends on PH7.1**

**Related files:** `packages/firm-ui-kanban/src/`

**Definition of Done:**
- `KanbanBoard` component: DnD Kit-backed drag-and-drop across columns with optimistic updates and rollback on server rejection.
- Virtualised card rendering via TanStack Virtual (handles 1000+ cards per column without jank).
- `KanbanCard` slot system: customisable card content per entity type (pipeline, tasks, bookings).
- Column collapse/expand; WIP limits with visual overflow indicator.
- Keyboard DnD: arrow-key card movement with ARIA live-region announcements.
- Tests: optimistic update rollback on server rejection, keyboard move emits correct event, WIP limit overflow indicator.

**Out of Scope:** Pipeline-specific business logic (handled by `firm-pipeline`). **Rules:** Optimistic updates must roll back cleanly on server error; keyboard DnD mandatory for WCAG 2.2 AA compliance; virtualisation required — no rendering all cards in DOM. **Anti-Patterns:** No rendering 1000+ un-virtualised cards; no non-keyboard-accessible DnD. **DDD:** N/A | **TDD:** Drag card to new column → optimistic update applied → server rejects → card returns to original column | **BDD:** A user moving a deal card via keyboard receives an ARIA announcement confirming the new column | **Deep Module:** `KanbanBoard` hides DnD state, optimistic update coordination, and virtualisation.

#### Subtasks
- [ ] **PH7.3.1** [AGENT] Scaffold `packages/firm-ui-kanban/package.json` and `tsconfig.json`.
- [ ] **PH7.3.2** [AGENT] Implement `KanbanBoard` with DnD Kit, virtualisation, and optimistic updates. File: `packages/firm-ui-kanban/src/board.tsx`.
- [ ] **PH7.3.3** [AGENT] Implement `KanbanCard` slot system. File: `packages/firm-ui-kanban/src/card.tsx`.
- [ ] **PH7.3.4** [AGENT] Implement keyboard DnD with ARIA live-region announcements. File: `packages/firm-ui-kanban/src/keyboard.tsx`.
- [ ] **PH7.3.5** [AGENT] Write tests. File: `packages/firm-ui-kanban/tests/`.

***

### PH7.4 – Build `firm-ui-builder-canvas`
- [ ] **PH7.4** | Status: Not Started | **Depends on PH7.1, PH7.3**

**Related files:** `packages/firm-ui-builder-canvas/src/`

**Definition of Done:**
- Shared canvas primitive for workflow, form, and site builders: DnD Kit node placement, multi-select, alignment guides, snap-to-grid.
- `CanvasNode<T>` generic: renders any node type via slot; connects to `firm-workflow-builder`, `firm-form-builder`, `firm-site-builder` data models.
- Connection lines: SVG bezier curve connectors for workflow edges; animated on hover.
- Undo/redo: `useUndoRedo(maxDepth: 50)` hook backed by immutable state snapshots.
- Minimap: `CanvasMinimap` component with viewport indicator.
- Export: `exportCanvasAsPNG(canvasId)` via html-to-image.
- Tests: undo/redo depth limit enforced, multi-select emits correct node IDs, snap-to-grid rounds to nearest unit.

**Out of Scope:** Canvas-specific node renderers for each builder (implemented in their respective app packages). **Rules:** Canvas is a generic primitive — zero business logic; undo history must cap at `maxDepth` to prevent memory leaks; connection lines must render without overlapping nodes. **Anti-Patterns:** No business logic in the canvas; no unbounded undo history. **DDD:** N/A | **TDD:** `useUndoRedo` with `maxDepth: 3` — after 4 operations, oldest state is evicted | **BDD:** A user accidentally deleting a node can press Ctrl+Z to restore it instantly — no page reload | **Deep Module:** `useUndoRedo` encapsulates immutable snapshot management and eviction policy.

#### Subtasks
- [ ] **PH7.4.1** [AGENT] Scaffold `packages/firm-ui-builder-canvas/package.json` and `tsconfig.json`.
- [ ] **PH7.4.2** [AGENT] Implement `CanvasNode<T>` with DnD Kit, multi-select, snap-to-grid, alignment guides. File: `packages/firm-ui-builder-canvas/src/canvas.tsx`.
- [ ] **PH7.4.3** [AGENT] Implement SVG bezier connection lines. File: `packages/firm-ui-builder-canvas/src/edges.tsx`.
- [ ] **PH7.4.4** [AGENT] Implement `useUndoRedo(maxDepth)` hook. File: `packages/firm-ui-builder-canvas/src/undo.ts`.
- [ ] **PH7.4.5** [AGENT] Implement `CanvasMinimap` and `exportCanvasAsPNG`. File: `packages/firm-ui-builder-canvas/src/minimap.tsx`.
- [ ] **PH7.4.6** [AGENT] Write tests. File: `packages/firm-ui-builder-canvas/tests/`.

***

### PH7.5 – Build `app-platform-web` (agency + sub-account dashboard)
- [ ] **PH7.5** | Status: Not Started | **Depends on PH7.1–PH7.4, all Phase 5–6 packages**

**Related files:** `apps/platform-web/`

**Definition of Done:**
- Next.js 15 App Router; all data-fetching in RSC; mutations via tRPC from `firm-api-contracts`.
- Route groups: `(agency)/` — agency admin views; `(sub-account)/` — sub-account operator views; `(platform)/` — platform super-admin views.
- Pages: Dashboard, Contacts, Pipeline (Kanban), Campaigns, Bookings, Forms, Tasks, Reporting, Integrations, Billing, Settings (white-label, team, domains, API keys), Onboarding, Audit Log.
- AI surfaces: Lead score badges on contact cards, `AIApprovalCard` queue for pending content, AI chat widget (agency-configurable), Agent builder canvas (`firm-ui-builder-canvas` + `firm-ai-agents`).
- Real-time: SSE-backed live pipeline updates, notification bell, campaign send progress.
- Accessibility: WCAG 2.2 AA; Lighthouse accessibility score ≥90 on all pages; `expectNoA11yViolations` in Playwright tests.
- Playwright E2E tests: critical paths — onboarding flow, contact import, campaign launch, booking creation, pipeline card move, billing plan change.
- `firm-config-security-headers` applied to all routes; CSP headers verified in E2E tests.
- Performance: LCP ≤2.5s, CLS ≤0.1 on all pages (measured in CI via Playwright).

**Out of Scope:** Mobile app; client-facing portal (PH7.6). **Rules:** All server components use RSC data-fetching — no `useEffect` data loading; CSP headers mandatory on all routes; LCP/CLS measured in CI. **Anti-Patterns:** No client-side data fetching for initial page load; no missing CSP headers; no un-audited admin mutations. **DDD:** Application layer orchestrates domain services | **TDD:** N/A | **BDD:** An agency admin completing onboarding can create their first campaign within 5 minutes without reading documentation | **Deep Module:** Route groups encapsulate role-specific layout and navigation; RSC data-fetching hides tRPC complexity from page components.

#### Subtasks
- [ ] **PH7.5.1** [AGENT] Scaffold `apps/platform-web/` with Next.js 15 App Router, `firm-config-next`, `firm-config-typescript`, `firm-config-tailwind`.
- [ ] **PH7.5.2** [AGENT] Implement route group layouts: `(agency)`, `(sub-account)`, `(platform)`. File: `apps/platform-web/app/`.
- [ ] **PH7.5.3** [AGENT] Implement all 15 pages with RSC data-fetching and tRPC mutations.
- [ ] **PH7.5.4** [AGENT] Implement SSE-backed real-time: live pipeline, notification bell, campaign progress. File: `apps/platform-web/app/_components/realtime/`.
- [ ] **PH7.5.5** [AGENT] Implement AI surfaces: lead score badges, `AIApprovalCard` queue, AI chat widget, agent builder. File: `apps/platform-web/app/_components/ai/`.
- [ ] **PH7.5.6** [AGENT] Apply `firm-config-security-headers` to all routes. File: `apps/platform-web/next.config.ts`.
- [ ] **PH7.5.7** [AGENT] Write Playwright E2E tests for 6 critical paths. File: `apps/platform-web/tests/e2e/`.
- [ ] **PH7.5.8** [AGENT] Add LCP/CLS measurement step to CI via Playwright. File: `.github/workflows/ci.yml`.

***

### PH7.6 – Build `app-client-portal` (client-facing)
- [ ] **PH7.6** | Status: Not Started | **Depends on PH7.1, PH6.4**

**Related files:** `apps/client-portal/`

**Definition of Done:**
- Next.js 15 App Router; magic-link authentication via `firm-client-portal-builder.getPortalAccessToken`.
- Pages: Dashboard (activity summary), Invoices (view + pay), Documents (view + download), Bookings (view + reschedule + cancel), Messages (AI chat or direct), Custom Pages (from `firm-site-builder`).
- White-label: fully themed per agency — logo, colours, fonts, domain; resolved via `firm-white-label`.
- No persistent session — every magic link produces a fresh short-lived token; `revokePortalAccess` reflected immediately.
- Performance: LCP ≤1.8s (client-facing SLA stricter than internal); measured in CI.
- Playwright E2E: magic link login, invoice payment, booking reschedule, document download.
- WCAG 2.2 AA; Lighthouse score ≥95 (client-facing).

**Out of Scope:** Agency admin views (PH7.5); portal builder canvas (handled by `firm-client-portal-builder`). **Rules:** No persistent session storage; white-label must be applied before first paint — no FOUC; LCP ≤1.8s enforced in CI. **Anti-Patterns:** No persistent session cookies; no unstyled flash on load; no serving portal pages without white-label resolution. **DDD:** Client portal is a presentation layer for the client-relationship bounded context | **TDD:** N/A | **BDD:** A client clicking a magic link sees their agency's fully branded portal within 1.8 seconds — with their name, invoices, and upcoming bookings | **Deep Module:** Magic link middleware resolves tenant, applies white-label, and sets request context before any page renders.

#### Subtasks
- [ ] **PH7.6.1** [AGENT] Scaffold `apps/client-portal/` with Next.js 15 App Router.
- [ ] **PH7.6.2** [AGENT] Implement magic-link middleware with `firm-client-portal-builder` token validation. File: `apps/client-portal/middleware.ts`.
- [ ] **PH7.6.3** [AGENT] Implement white-label theme resolution before first paint. File: `apps/client-portal/app/layout.tsx`.
- [ ] **PH7.6.4** [AGENT] Implement all 6 portal pages.
- [ ] **PH7.6.5** [AGENT] Write Playwright E2E tests for 4 critical paths. File: `apps/client-portal/tests/e2e/`.
- [ ] **PH7.6.6** [AGENT] Add LCP ≤1.8s enforcement to CI.

***

### PH7.7 – Build `app-public-site` (marketing + SEO)
- [ ] **PH7.7** | Status: Not Started | **Depends on PH7.1, PH4.2**

**Related files:** `apps/public-site/`

**Definition of Done:**
- Next.js 15 static generation (`output: 'export'` or ISR ≤60s); pages: Home, Features, Pricing, Blog, Changelog, Status (delegates to `firm-status-page` data endpoint), Legal (ToS, Privacy, Cookie Policy).
- Structured data (JSON-LD): `Organization`, `SoftwareApplication`, `FAQPage`, `BreadcrumbList`.
- `firm-consent` GTM Consent Mode v3 banner — non-blocking, respects GPC header, compliant by default.
- Core Web Vitals: LCP ≤1.5s, CLS ≤0.05, INP ≤200ms — all enforced in CI.
- Sitemap auto-generated on build; `robots.txt` referencing sitemap.
- Blog: MDX-based with `next-mdx-remote`; syntax highlighting; reading time estimate; Open Graph image auto-generated per post.
- Playwright E2E: GPC consent, structured data validation, sitemap generation.

**Out of Scope:** White-label client sites (handled per-agency via `firm-site-builder`). **Rules:** Consent banner must not block rendering; Core Web Vitals enforced in CI; all pages must have structured data. **Anti-Patterns:** No blocking render on consent resolution; no pages without structured data; no missing sitemap entries. **DDD:** N/A | **TDD:** N/A | **BDD:** A visitor with `Sec-GPC: 1` sees no tracking scripts loaded — the consent banner is not shown and the GPC signal is automatically honoured | **Deep Module:** N/A

#### Subtasks
- [ ] **PH7.7.1** [AGENT] Scaffold `apps/public-site/` with Next.js 15 static generation.
- [ ] **PH7.7.2** [AGENT] Implement all 7 page types with JSON-LD structured data.
- [ ] **PH7.7.3** [AGENT] Implement `firm-consent` GTM Consent Mode v3 banner with GPC support. File: `apps/public-site/app/_components/consent-banner.tsx`.
- [ ] **PH7.7.4** [AGENT] Implement MDX blog with Open Graph image generation. File: `apps/public-site/app/blog/`.
- [ ] **PH7.7.5** [AGENT] Implement sitemap and `robots.txt` generation. File: `apps/public-site/app/sitemap.ts`.
- [ ] **PH7.7.6** [AGENT] Add Core Web Vitals enforcement to CI (LCP ≤1.5s, CLS ≤0.05, INP ≤200ms).
- [ ] **PH7.7.7** [AGENT] Write Playwright E2E tests. File: `apps/public-site/tests/e2e/`.

***

### PH7.8 – Build `app-status-page-web`
- [ ] **PH7.8** | Status: Not Started | **Depends on PH7.1, PH1.40**

**Related files:** `apps/status-page-web/`

**Definition of Done:**
- Publicly accessible Next.js app (no auth required); reads from `firm-status-page` data endpoint.
- Pages: current status summary, incident history, component status grid, subscriber sign-up (email/webhook).
- SSE-backed live incident updates — status changes reflected within 5 seconds without page reload.
- RSS feed linked in `<head>`; JSON feed at `/feed.json`.
- White-label themed per platform config (not per-tenant — single platform status page).
- LCP ≤1.5s; Playwright E2E: incident creation reflects live, subscriber sign-up, RSS feed valid XML.

**Out of Scope:** Per-tenant status pages; Grafana embedding (Phase 8). **Rules:** No auth on any status page route; SSE updates must reflect within 5 seconds of incident creation; RSS must be valid XML. **Anti-Patterns:** No polling for status updates — SSE only; no auth walls on public status pages. **DDD:** N/A | **TDD:** N/A | **BDD:** When an incident is created in `firm-status-page`, a visitor already on the status page sees the update without refreshing | **Deep Module:** N/A

#### Subtasks
- [ ] **PH7.8.1** [AGENT] Scaffold `apps/status-page-web/` with Next.js 15.
- [ ] **PH7.8.2** [AGENT] Implement current status, incident history, component grid, subscriber sign-up pages.
- [ ] **PH7.8.3** [AGENT] Implement SSE-backed live updates from `firm-status-page`. File: `apps/status-page-web/app/_components/live-status.tsx`.
- [ ] **PH7.8.4** [AGENT] Implement RSS and JSON feeds. File: `apps/status-page-web/app/feed.xml/route.ts`.
- [ ] **PH7.8.5** [AGENT] Write Playwright E2E tests. File: `apps/status-page-web/tests/e2e/`.

***

### PH7.9 – Build `app-docs-site`
- [ ] **PH7.9** | Status: Not Started | **Depends on PH7.1**

**Related files:** `apps/docs-site/`

**Definition of Done:**
- Nextra or Fumadocs MDX-based documentation site; sections: Getting Started, API Reference (auto-generated from OpenAPI spec via `firm-api-gateway`), Guides, Changelog, SDK Reference.
- Search: `firm-search` integration scoped to docs content (no tenant auth required).
- Code examples: syntax-highlighted, copy-button, live-editable API sandbox (tRPC playground embed).
- Versioned docs: `v1/`, `v2/` route namespaces; default routes to latest.
- Auto-generated API reference: fetches OpenAPI spec from `firm-api-gateway.generateOpenApiSpec()`; rendered as interactive docs.
- LCP ≤1.5s; Playwright E2E: search returns results, API reference loads, versioned route resolves.

**Out of Scope:** Video tutorials; community forum. **Rules:** API reference must be auto-generated — never hand-written; search must be scoped to docs only (no cross-tenant data); versioned docs routes must never 404. **Anti-Patterns:** No hand-written API reference; no doc search returning tenant data. **DDD:** N/A | **TDD:** N/A | **BDD:** A developer searching for `createBooking` finds the API reference, code example, and related guide in one search result | **Deep Module:** N/A

#### Subtasks
- [ ] **PH7.9.1** [AGENT] Scaffold `apps/docs-site/` with Fumadocs or Nextra.
- [ ] **PH7.9.2** [AGENT] Implement all 5 doc sections with versioned routing.
- [ ] **PH7.9.3** [AGENT] Implement `firm-search` integration for docs search. File: `apps/docs-site/app/_components/search.tsx`.
- [ ] **PH7.9.4** [AGENT] Implement auto-generated API reference from OpenAPI spec. File: `apps/docs-site/app/api-reference/`.
- [ ] **PH7.9.5** [AGENT] Write Playwright E2E tests. File: `apps/docs-site/tests/e2e/`.

***

### PH7.10 – Build `workers/email-delivery-worker`
- [ ] **PH7.10** | Status: Not Started | **Depends on PH3.1, PH4.14, PH3.11**

**Related files:** `workers/email-delivery-worker/`

**Definition of Done:**
- Consumes `notification.email.queued` from `firm-bus`; renders via `firm-template-engine`; delivers via `EmailPort` adapter (provider selection per tenant config).
- Delivery receipt tracking: `email.delivered`, `email.bounced`, `email.opened`, `email.clicked` events from provider webhooks → `firm-webhook-receiver` → `firm-bus`.
- Bounce management: hard bounce → immediately unsubscribes contact; soft bounce → retry 3×.
- `firm-request-context` restored from job data before processing.
- Prometheus metrics: `firm.email.delivery_latency_ms`, `firm.email.bounce_rate`.
- Tests: hard bounce triggers unsubscribe, soft bounce retries 3×, template render failure → DLQ.

**Out of Scope:** SMS delivery (PH7.11); email provider OAuth (PH5.13). **Rules:** Hard bounce must unsubscribe immediately — no retry; template render failure goes to DLQ (not silently dropped); `firm-request-context` restored before every handler invocation. **Anti-Patterns:** No retrying hard bounces; no silently dropping render failures. **DDD:** Email delivery is infrastructure in the communication bounded context | **TDD:** Hard bounce event → contact marked unsubscribed with audit log; DLQ receives message on render failure | **BDD:** An email that hard-bounces automatically suppresses the contact from all future campaigns | **Deep Module:** Worker hides provider selection, template rendering, bounce classification, and context restoration.

#### Subtasks
- [ ] **PH7.10.1** [AGENT] Scaffold `workers/email-delivery-worker/` with `firm-config-typescript` worker variant.
- [ ] **PH7.10.2** [AGENT] Implement `firm-bus` consumer for `notification.email.queued`; restore request context. File: `workers/email-delivery-worker/src/index.ts`.
- [ ] **PH7.10.3** [AGENT] Implement template rendering via `firm-template-engine` and delivery via `EmailPort`. File: `workers/email-delivery-worker/src/deliver.ts`.
- [ ] **PH7.10.4** [AGENT] Implement bounce management: hard bounce unsubscribe, soft bounce retry 3×. File: `workers/email-delivery-worker/src/bounce.ts`.
- [ ] **PH7.10.5** [AGENT] Wire delivery receipt webhooks via `firm-webhook-receiver`. File: `workers/email-delivery-worker/src/receipts.ts`.
- [ ] **PH7.10.6** [AGENT] Add Prometheus metrics. File: `workers/email-delivery-worker/src/metrics.ts`.
- [ ] **PH7.10.7** [AGENT] Write tests. File: `workers/email-delivery-worker/tests/`.

***

### PH7.11 – Build `workers/sms-delivery-worker`
- [ ] **PH7.11** | Status: Not Started | **Depends on PH3.2, PH4.14, PH3.11**

**Related files:** `workers/sms-delivery-worker/`

**Definition of Done:**
- Consumes `notification.sms.queued`; renders via `firm-template-engine` (Liquid, 160-char segment counter); delivers via `SMSPort` adapter.
- Opt-out handling: inbound STOP keyword webhook → immediately unsubscribes contact from all SMS; HELP keyword → sends compliance response.
- Carrier lookup: validates phone number format before delivery; invalid numbers go to DLQ.
- `firm-request-context` restored from job data.
- Tests: STOP unsubscribes, HELP response sent, invalid number → DLQ, segment count reported in metrics.

**Out of Scope:** Voice calls; WhatsApp (separate adapter). **Rules:** STOP keyword must unsubscribe immediately and synchronously before any other processing; HELP response is mandatory (TCPA compliance); invalid numbers never retried. **Anti-Patterns:** No retrying invalid phone numbers; no delaying STOP processing. **DDD:** SMS delivery is infrastructure | **TDD:** Inbound STOP webhook → contact unsubscribed before any event emitted | **BDD:** A recipient texting STOP is immediately removed from all SMS campaigns — the next campaign send never reaches them | **Deep Module:** Worker hides segment calculation, opt-out enforcement, and carrier validation.

#### Subtasks
- [ ] **PH7.11.1** [AGENT] Scaffold `workers/sms-delivery-worker/`.
- [ ] **PH7.11.2** [AGENT] Implement consumer, template render, SMSPort delivery, context restore. File: `workers/sms-delivery-worker/src/index.ts`.
- [ ] **PH7.11.3** [AGENT] Implement STOP/HELP opt-out handling via inbound webhook. File: `workers/sms-delivery-worker/src/opt-out.ts`.
- [ ] **PH7.11.4** [AGENT] Implement phone number validation and DLQ routing. File: `workers/sms-delivery-worker/src/validate.ts`.
- [ ] **PH7.11.5** [AGENT] Write tests. File: `workers/sms-delivery-worker/tests/`.

***

### PH7.12 – Build `workers/outbox-worker`
- [ ] **PH7.12** | Status: Not Started | **Depends on PH2.1**

**Related files:** `workers/outbox-worker/`

**Definition of Done:**
- Polls `firm_outbox` table for undelivered events; delivers to broker (per ADR-001); marks delivered.
- At-least-once delivery: failed delivery → exponential backoff retry via `firm-utils.retry`; exceeds `maxRetries` → promotes to DLQ.
- Idempotent delivery: checks event ID against Redis dedup cache before dispatching.
- Concurrent processing: configurable `concurrency` workers per pod; tenant-fair scheduling (no single tenant starves others).
- Prometheus metrics: `firm.outbox.processing_latency_ms`, `firm.outbox.pending_count`, `firm.outbox.dlq_count`.
- Liveness probe: `isShuttingDown()` from `firm-health`; graceful drain on SIGTERM.
- Tests: retry on failure, DLQ promotion, idempotent dedup, graceful shutdown mid-batch.

**Out of Scope:** Event handler logic (handled per-feature). **Rules:** Delivery must be idempotent — Redis dedup cache mandatory; tenant-fair scheduling required — no single tenant monopolising worker threads; graceful shutdown must not drop in-flight events. **Anti-Patterns:** No processing events without dedup check; no unordered shutdown that drops events. **DDD:** Outbox worker is infrastructure | **TDD:** Same event ID processed twice: second dispatch skipped (dedup); `maxRetries` exceeded: event appears in DLQ | **BDD:** Deploying a new version while the outbox worker is mid-batch results in zero dropped events — in-flight events complete before the pod terminates | **Deep Module:** Worker encapsulates polling, retry scheduling, dedup, and tenant-fair concurrency.

#### Subtasks
- [ ] **PH7.12.1** [AGENT] Scaffold `workers/outbox-worker/`.
- [ ] **PH7.12.2** [AGENT] Implement outbox polling with configurable `concurrency` and tenant-fair scheduling. File: `workers/outbox-worker/src/index.ts`.
- [ ] **PH7.12.3** [AGENT] Implement Redis idempotency dedup and exponential backoff retry. File: `workers/outbox-worker/src/deliver.ts`.
- [ ] **PH7.12.4** [AGENT] Implement DLQ promotion on `maxRetries` exceeded. File: `workers/outbox-worker/src/dlq.ts`.
- [ ] **PH7.12.5** [AGENT] Add Prometheus metrics and graceful shutdown. Files: `workers/outbox-worker/src/metrics.ts`, `workers/outbox-worker/src/shutdown.ts`.
- [ ] **PH7.12.6** [AGENT] Write tests. File: `workers/outbox-worker/tests/`.

***

### PH7.13 – Build remaining workers
- [ ] **PH7.13** | Status: Not Started

**Related files:** `workers/`

**Definition of Done:**
- `workers/site-generation-worker/` — consumes `site.published` events; executes static generation job per ADR-006; uploads to `StoragePort`; emits `site.generation_complete`.
- `workers/report-export-worker/` — consumes report export queue jobs; streams via `firm-streams`; uploads to `firm-media`; emits `report.export_ready`.
- `workers/import-worker/` — consumes import queue jobs from `firm-import-pipeline`; runs streaming pipeline; emits progress via `firm-sse`.
- `workers/scheduled-jobs-worker/` — consolidates all `firm-queue` scheduled jobs: overdue tasks, campaign fan-out, quota warning checks, AI bulk scoring, report scheduling, memory compression. Prevents job duplication via distributed lock (`firm-cache.acquireLock`).
- All workers: `firm-request-context` restored, Prometheus metrics, graceful shutdown, liveness probes.

**Out of Scope:** New business-logic workers not covered above. **Rules:** All workers restore `firm-request-context` from job data; scheduled jobs use distributed lock to prevent duplicate execution across pods; all workers register with `firm-health`. **Anti-Patterns:** No scheduled jobs without distributed lock; no workers without graceful shutdown. **DDD:** Workers are infrastructure execution units | **TDD:** Scheduled job with active lock returns without executing (duplicate prevention) | **BDD:** Two pods attempting the same scheduled job simultaneously result in exactly one execution | **Deep Module:** `workers/scheduled-jobs-worker` consolidates all cron-like jobs behind distributed-lock-protected handlers.

#### Subtasks
- [ ] **PH7.13.1** [AGENT] Scaffold and implement `workers/site-generation-worker/`.
- [ ] **PH7.13.2** [AGENT] Scaffold and implement `workers/report-export-worker/`.
- [ ] **PH7.13.3** [AGENT] Scaffold and implement `workers/import-worker/`.
- [ ] **PH7.13.4** [AGENT] Scaffold and implement `workers/scheduled-jobs-worker/` with distributed lock per job type.

***

### PH7.14 – Phase 7 acceptance criteria verification
- [ ] **PH7.14** | Status: Not Started | **Final Phase 7 gate**

**Definition of Done:**
- All Phase 7 apps and workers build and pass tests on `main`.
- Playwright E2E suites passing for all apps: `app-platform-web` (6 paths), `app-client-portal` (4 paths), `app-public-site` (3 paths), `app-status-page-web` (3 paths), `app-docs-site` (3 paths).
- Core Web Vitals CI gates passing: LCP/CLS/INP within SLA for all apps.
- `firm-ui` Chromatic visual regression baseline committed; zero unreviewed changes.
- WCAG 2.2 AA: `expectNoA11yViolations` passing in all Storybook stories and Playwright tests.
- All workers: graceful shutdown test passing; Prometheus metrics registered.
- Coverage ≥80% on all workers; apps covered by E2E (unit coverage exempted for RSC pages).

#### Subtasks
- [ ] **PH7.14.1** [AGENT] Run all Playwright E2E suites; fix failures.
- [ ] **PH7.14.2** [AGENT] Run Core Web Vitals CI gates; fix any violations.
- [ ] **PH7.14.3** [AGENT] Run all Storybook `expectNoA11yViolations` assertions; fix failures.
- [ ] **PH7.14.4** [AGENT] Commit Chromatic visual regression baseline.
- [ ] **PH7.14.5** [HUMAN] Sign off Phase 7 complete; tag release `v0.7.0-applications`.

***

---

## Phase 8: Production Hardening

*Observability, performance, security, load testing, and CD pipeline. No production traffic until Phase 8 acceptance criteria are met.*

***

### PH8.1 – Grafana dashboard suite
- [ ] **PH8.1** | Status: Not Started

**Related files:** `infra/shared/grafana/dashboards/`

**Definition of Done:**
- Dashboards provisioned via `infra/shared/grafana/dashboards/` (JSON files, version-controlled; auto-provisioned on deploy).
- Required dashboards:
  - **Platform Overview:** request rate, error rate, p50/p95/p99 latency by route, active tenants, active SSE connections.
  - **Tenant Health:** per-tenant quota utilisation, rate-limit hit rate, circuit breaker states, outbox pending count.
  - **AI Operations:** model call latency by provider, token consumption rate, `pending_approval` queue depth, C2PA manifest generation rate.
  - **Infrastructure:** PgBouncer pool utilisation, Redis memory/hit rate, pod CPU/memory by worker type, OTel Collector throughput.
  - **SLO Burn Rate:** all 6 SLO definitions from PH1.3 with error budget burn rate visualised (fast-burn / slow-burn alerts).
  - **Security:** failed auth rate, rate-limit violations by tenant, RLS policy evaluation count, IP allowlist rejections.
- All dashboards: time range variable, tenant filter variable, region filter variable.
- Runbooks linked from every alert panel (SLO runbooks from PH1.3).

**Out of Scope:** Custom tenant-facing analytics dashboards (those are in `firm-reporting`). **Rules:** Dashboards must be version-controlled JSON — no manual click-to-configure; every alert panel must link its runbook; SLO burn rate must use the 1h fast-burn + 6h slow-burn dual-window pattern. **Anti-Patterns:** No dashboard-only alerts without runbooks; no manually configured Grafana state not in version control. **DDD:** N/A | **TDD:** N/A | **BDD:** An on-call engineer receiving a SLO burn-rate alert can navigate directly to the runbook from the alert panel and resolve the incident without prior context | **Deep Module:** N/A

#### Subtasks
- [ ] **PH8.1.1** [HUMAN] Design and commit Platform Overview dashboard JSON. File: `infra/shared/grafana/dashboards/platform-overview.json`.
- [ ] **PH8.1.2** [HUMAN] Design and commit Tenant Health dashboard JSON. File: `infra/shared/grafana/dashboards/tenant-health.json`.
- [ ] **PH8.1.3** [HUMAN] Design and commit AI Operations dashboard JSON. File: `infra/shared/grafana/dashboards/ai-operations.json`.
- [ ] **PH8.1.4** [HUMAN] Design and commit Infrastructure dashboard JSON. File: `infra/shared/grafana/dashboards/infrastructure.json`.
- [ ] **PH8.1.5** [HUMAN] Design and commit SLO Burn Rate dashboard JSON with dual-window alerts. File: `infra/shared/grafana/dashboards/slo-burn-rate.json`.
- [ ] **PH8.1.6** [HUMAN] Design and commit Security dashboard JSON. File: `infra/shared/grafana/dashboards/security.json`.
- [ ] **PH8.1.7** [AGENT] Configure Grafana auto-provisioning from `infra/shared/grafana/dashboards/`. File: `infra/shared/grafana/provisioning/dashboards.yaml`.

***

### PH8.2 – Prometheus alert rules
- [ ] **PH8.2** | Status: Not Started | **Depends on PH8.1**

**Related files:** `infra/shared/prometheus/rules/`

**Definition of Done:**
- Alert rules version-controlled in `infra/shared/prometheus/rules/` (YAML); auto-loaded on deploy.
- Required alert groups:
  - **SLO:** `APILatencyBudgetBurn` (p95 > 500ms sustained 5min), `OutboxLagBudgetBurn` (lag > 30s), `AuthSuccessRateBurn` (success < 99.5%), `RLSHealthBurn` (any RLS-disabled table), `CrossTenantQueryRateBurn`, `AIApprovalRateBurn`.
  - **Infrastructure:** `PgBouncerPoolExhausted`, `RedisMemoryHigh` (>85%), `PodOOMKilled`, `OutboxWorkerDown`, `CircuitBreakerOpen` (any named breaker open >5min).
  - **Security:** `HighFailedAuthRate` (>50 failures/min/tenant), `RateLimitViolationSpike`, `IPAllowlistViolationSpike`.
  - **Compliance:** `GDPRSLABreachImminent` (request >25 days old), `AIContentApprovalQueueDepth` (>100 items), `C2PAManifestMissing` (post Aug 2).
- All alerts: severity label (`critical`, `warning`, `info`), `tenantId` label where applicable, runbook URL annotation.
- `promtool check rules` passes for all rule files in CI.

**Out of Scope:** PagerDuty/OpsGenie routing configuration (human-configured). **Rules:** Every alert must have a `runbook_url` annotation; `promtool check rules` must pass in CI; no alert without a severity label. **Anti-Patterns:** No alerts without runbook URLs; no `critical` alerts that are non-actionable. **DDD:** N/A | **TDD:** N/A | **BDD:** A GDPR SLA breach alert fires with 5 days to spare — giving the team time to act before the legal deadline | **Deep Module:** N/A

#### Subtasks
- [ ] **PH8.2.1** [AGENT] Write SLO alert rules. File: `infra/shared/prometheus/rules/slo.yaml`.
- [ ] **PH8.2.2** [AGENT] Write infrastructure alert rules. File: `infra/shared/prometheus/rules/infrastructure.yaml`.
- [ ] **PH8.2.3** [AGENT] Write security alert rules. File: `infra/shared/prometheus/rules/security.yaml`.
- [ ] **PH8.2.4** [AGENT] Write compliance alert rules. File: `infra/shared/prometheus/rules/compliance.yaml`.
- [ ] **PH8.2.5** [AGENT] Add `promtool check rules` step to CI. File: `.github/workflows/ci.yml`.

***

### PH8.3 – Distributed tracing and log correlation
- [ ] **PH8.3** | Status: Not Started | **Depends on PH2.5.4**

**Related files:** `packages/firm-observability/`, `infra/shared/otel/`

**Definition of Done:**
- All tRPC routes, `firm-queue` workers, `firm-bus` handlers, and `workers/` decorated with `withTenantSpan` — 100% trace coverage verified by Gate 17.
- `traceId` and `spanId` injected into every Pino log line via `firm-logger.child` — log-to-trace correlation working in Grafana (Loki + Tempo link).
- Baggage propagation: `tenantId` and `correlationId` propagated across service boundaries via W3C Baggage header.
- Sampling: 100% for errors and warnings; 10% for successful requests (configurable per-route via `firm-feature-flags`).
- Span attribute conventions enforced: `tenant.id` (hashed), `user.id` (hashed), `db.statement` (redacted), `http.route` (normalised).
- CI Gate 17 enforcement: every new package export must include at least one OTel span or metric (active from PH3.13).

**Out of Scope:** RUM (browser tracing) — deferred. **Rules:** PII must never appear in span attributes — hashed IDs only; `db.statement` must be redacted before export; W3C Baggage header mandatory for cross-service propagation. **Anti-Patterns:** No raw PII in span attributes; no `db.statement` with parameter values; no service call without baggage propagation. **DDD:** Tracing is a cross-cutting infrastructure concern | **TDD:** Span attribute test: `tenant.id` is a hash, not the raw UUID | **BDD:** An engineer investigating a slow API call traces it end-to-end from the HTTP handler through the DB query to the outbox write — all in one Tempo trace | **Deep Module:** `withTenantSpan` auto-injects all required attributes; no engineer manually sets `tenant.id` on spans.

#### Subtasks
- [ ] **PH8.3.1** [AGENT] Audit all tRPC routes, queue workers, bus handlers, and delivery workers; wrap any un-traced code in `withTenantSpan`. Files: across all packages.
- [ ] **PH8.3.2** [AGENT] Inject `traceId` and `spanId` into `firm-logger` Pino child bindings. File: `packages/firm-logger/src/logger.ts`.
- [ ] **PH8.3.3** [AGENT] Implement W3C Baggage propagation for `tenantId` and `correlationId`. File: `packages/firm-observability/src/baggage.ts`.
- [ ] **PH8.3.4** [AGENT] Implement sampling policy: 100% errors/warnings, 10% success, per-route override via `firm-feature-flags`. File: `packages/firm-observability/src/sampling.ts`.
- [ ] **PH8.3.5** [AGENT] Enforce span attribute conventions and PII hashing. File: `packages/firm-observability/src/conventions.ts`.
- [ ] **PH8.3.6** [AGENT] Verify Loki + Tempo log-to-trace correlation in staging; document in `docs/runbooks/tracing.md`.

***

### PH8.4 – k6 load test suite
- [ ] **PH8.4** | Status: Not Started | **Depends on PH1.5.8**

**Related files:** `tests/load/`, `packages/firm-config-k6/`

**Definition of Done:**
- Load test scenarios (all using `firm-config-k6` config factory):
  - **Smoke:** 1 VU × 1min — verifies system functional under minimal load.
  - **Load:** ramp 0→200 VUs over 2min, sustain 5min, ramp down — target SLO latency maintained.
  - **Stress:** ramp 0→500 VUs over 5min — identifies breaking point; system must recover within 2min after ramp-down.
  - **Spike:** 10→500 VUs in 30s, back to 10 in 30s — tests auto-scaling response.
  - **Soak:** 50 VUs × 4h — detects memory leaks and connection pool exhaustion.
- Covered flows: agency login, contact list (1000 contacts), campaign launch (100 recipients), booking create, AI chat turn, report export enqueue.
- Thresholds: `http_req_failed < 1%`, `http_req_duration p95 < 500ms` for all load scenarios.
- Output: Prometheus remote-write → Grafana k6 dashboard; HTML summary in CI artefacts.
- Soak test run weekly via scheduled CI job; others run on every release candidate.

**Out of Scope:** Chaos engineering (PH8.5); per-tenant load isolation tests. **Rules:** All load tests use env-var-driven base URLs — never hardcoded; soak test on weekly schedule only; thresholds fail the CI run if breached. **Anti-Patterns:** No hardcoded URLs or credentials in test scripts; no running soak test on every PR. **DDD:** N/A | **TDD:** N/A | **BDD:** After a 500-VU stress spike, API error rate returns below 1% within 2 minutes — demonstrating auto-scaling recovery | **Deep Module:** `firm-config-k6` hides ramp profiles, auth fixture management, and Prometheus export config.

#### Subtasks
- [ ] **PH8.4.1** [AGENT] Implement smoke test scenario. File: `tests/load/smoke.ts`.
- [ ] **PH8.4.2** [AGENT] Implement load test scenario with 200-VU ramp. File: `tests/load/load.ts`.
- [ ] **PH8.4.3** [AGENT] Implement stress test scenario with 500-VU ramp and recovery assertion. File: `tests/load/stress.ts`.
- [ ] **PH8.4.4** [AGENT] Implement spike test scenario. File: `tests/load/spike.ts`.
- [ ] **PH8.4.5** [AGENT] Implement soak test scenario (4h, 50 VUs). File: `tests/load/soak.ts`.
- [ ] **PH8.4.6** [AGENT] Configure Prometheus remote-write output and Grafana k6 dashboard. File: `tests/load/config.ts`.
- [ ] **PH8.4.7** [AGENT] Add smoke/load/stress/spike to release-candidate CI job; add soak to weekly scheduled job. File: `.github/workflows/load-tests.yml`.

***

### PH8.5 – Chaos engineering suite
- [ ] **PH8.5** | Status: Not Started | **Depends on PH2.5.2, PH2.5.3**

**Related files:** `chaos/`

**Definition of Done:**
- Chaos scenarios (all run in staging only; never production):
  - `pgbouncer-eviction.ts` — already defined in PH2.5.2; confirm passing.
  - `redis-down.ts` — kills Redis; asserts: rate limiter fails open, circuit breaker state survives pod restart (DB-backed), cache miss falls through to DB, no 500s within 5s.
  - `outbox-worker-crash.ts` — kills outbox worker pod; asserts: no events lost, DLQ empty after worker restarts, delivery resumes within 60s.
  - `db-primary-failover.ts` — simulates primary failover; asserts: reads succeed on replica, writes queued, recovery within 30s.
  - `pod-oom.ts` — sends OOM signal to platform-web pod; asserts: K8s restarts pod, readiness probe delays traffic, zero 502s to active requests.
  - `tenant-data-isolation.ts` — concurrent cross-tenant requests under load; asserts: zero cross-tenant data leakage in any response.
- All scenarios: automated pass/fail assertion; results committed to `chaos/results/` on each run.
- Run monthly via scheduled CI; blocking before any major release.

**Out of Scope:** Production chaos (Chaos Monkey — out of scope entirely). **Rules:** All chaos tests run in staging only; `tenant-data-isolation` must be run before every major release; results committed to version control. **Anti-Patterns:** No running chaos tests in production; no chaos test without automated assertion. **DDD:** N/A | **TDD:** N/A | **BDD:** When Redis goes down mid-request, the platform returns valid responses within 5 seconds — degraded but functional | **Deep Module:** N/A

#### Subtasks
- [ ] **PH8.5.1** [AGENT] Confirm `pgbouncer-eviction.ts` passing from PH2.5.2. File: `chaos/pgbouncer-eviction.ts`.
- [ ] **PH8.5.2** [AGENT] Implement `redis-down.ts` with fail-open assertions. File: `chaos/redis-down.ts`.
- [ ] **PH8.5.3** [AGENT] Implement `outbox-worker-crash.ts` with no-event-loss assertion. File: `chaos/outbox-worker-crash.ts`.
- [ ] **PH8.5.4** [AGENT] Implement `db-primary-failover.ts` with replica-read and recovery assertions. File: `chaos/db-primary-failover.ts`.
- [ ] **PH8.5.5** [AGENT] Implement `pod-oom.ts` with readiness-gate and zero-502 assertion. File: `chaos/pod-oom.ts`.
- [ ] **PH8.5.6** [AGENT] Implement `tenant-data-isolation.ts` with cross-tenant leak assertion. File: `chaos/tenant-data-isolation.ts`.
- [ ] **PH8.5.7** [AGENT] Add monthly chaos schedule and pre-release blocking job. File: `.github/workflows/chaos.yml`.

***

### PH8.6 – Security hardening audit
- [ ] **PH8.6** | Status: Not Started

**Related files:** across all packages and apps

**Definition of Done:**
- **Dependency audit:** `pnpm audit --audit-level=high` passes with zero high/critical CVEs; automated weekly via Dependabot.
- **SAST:** Semgrep or CodeQL scanning on all TypeScript with zero high-severity findings; wired into CI as blocking gate.
- **Secrets scan:** `gitleaks` pre-commit hook (via `firm-config-lefthook`) and CI scan; zero secrets in repository history.
- **CSP audit:** all apps pass `firm-config-security-headers` CSP validation — no `unsafe-inline`, no `unsafe-eval`; verified via E2E tests.
- **OWASP Top 10 checklist:** documented `docs/security/owasp-checklist.md` with evidence for each item.
- **RLS penetration test:** manual SQL injection attempt against tenant-scoped endpoints documented in `docs/security/rls-pentest.md`.
- **Dependency pinning:** all `package.json` use exact versions (no `^` or `~`); enforced by `firm-config-knip`.

**Out of Scope:** Third-party penetration test (separate engagement). **Rules:** Zero high/critical CVEs before go-live; CSP must have no `unsafe-inline` or `unsafe-eval` in any app; secrets scan must cover git history. **Anti-Patterns:** No `^` version ranges in production dependencies; no ignoring high-severity CVEs. **DDD:** N/A | **TDD:** N/A | **BDD:** A security engineer running `pnpm audit` sees zero high or critical vulnerabilities — every dependency is pinned and audited | **Deep Module:** N/A

#### Subtasks
- [ ] **PH8.6.1** [AGENT] Run `pnpm audit --audit-level=high`; fix or document all findings. Add to CI as blocking gate.
- [ ] **PH8.6.2** [AGENT] Configure Semgrep or CodeQL SAST in CI as blocking gate. File: `.github/workflows/security.yml`.
- [ ] **PH8.6.3** [AGENT] Configure `gitleaks` in `firm-config-lefthook` pre-commit and CI. File: `packages/firm-config-lefthook/src/index.ts`.
- [ ] **PH8.6.4** [AGENT] Run CSP audit across all apps; fix any `unsafe-inline` or `unsafe-eval` violations.
- [ ] **PH8.6.5** [HUMAN] Complete OWASP Top 10 checklist. File: `docs/security/owasp-checklist.md`.
- [ ] **PH8.6.6** [HUMAN] Conduct RLS penetration test; document results. File: `docs/security/rls-pentest.md`.
- [ ] **PH8.6.7** [AGENT] Pin all `package.json` dependencies to exact versions; enforce via `firm-config-knip`. Files: all `package.json`.

***

### PH8.7 – CD pipeline and deployment automation
- [ ] **PH8.7** | Status: Not Started

**Related files:** `.github/workflows/`, `infra/`

**Definition of Done:**
- **Release pipeline:** `main` → staging auto-deploy on every merge; `v*` tag → production deploy with manual approval gate.
- **Staging smoke test:** smoke k6 scenario + Playwright E2E critical paths must pass before production promotion.
- **Database migration safety:** `drizzle-kit migrate` runs as a pre-deploy job; zero-downtime migration pattern enforced (additive-only; no column drops without a two-phase migration ADR).
- **Image promotion:** staging image digest promoted to production — never rebuild for production.
- **Rollback:** `pnpm turbo deploy:rollback` triggers K8s rollout undo + Redis cache flush for affected packages; automated rollback on health probe failure within 5min of deploy.
- **Environment parity:** staging and production use identical K8s manifests, identical image tags, identical env var keys (values differ).
- **Deploy notifications:** Slack/webhook notification on deploy start, success, rollback, and failure.
- **DORA metrics:** deployment frequency, lead time, MTTR, change failure rate measured and reported to Grafana.

**Out of Scope:** Multi-region active-active failover (separate project). **Rules:** Production never rebuilt from source — image promoted from staging; rollback must complete within 5min of health probe failure; migration must be additive-only (enforced by migration ADR pattern). **Anti-Patterns:** No rebuilding images for production; no deploying without staging smoke test passing; no destructive migrations without two-phase ADR. **DDD:** N/A | **TDD:** N/A | **BDD:** A failing health probe 3 minutes after a production deploy triggers an automatic rollback — no engineer action required | **Deep Module:** CD pipeline encapsulates promotion, migration, smoke test gate, and rollback orchestration.

#### Subtasks
- [ ] **PH8.7.1** [AGENT] Implement `main` → staging auto-deploy workflow. File: `.github/workflows/deploy-staging.yml`.
- [ ] **PH8.7.2** [AGENT] Implement `v*` tag → production deploy with manual approval gate. File: `.github/workflows/deploy-production.yml`.
- [ ] **PH8.7.3** [AGENT] Implement staging smoke test gate (k6 smoke + Playwright critical paths) before production promotion.
- [ ] **PH8.7.4** [AGENT] Implement `drizzle-kit migrate` pre-deploy job with additive-only enforcement. File: `.github/workflows/deploy-staging.yml`.
- [ ] **PH8.7.5** [AGENT] Implement image digest promotion (staging → production). File: `.github/workflows/deploy-production.yml`.
- [ ] **PH8.7.6** [AGENT] Implement `deploy:rollback` with K8s rollout undo and Redis cache flush. File: `scripts/ci/rollback.ts`.
- [ ] **PH8.7.7** [AGENT] Implement automated rollback on health probe failure (5min window). File: `.github/workflows/deploy-production.yml`.
- [ ] **PH8.7.8** [AGENT] Add deploy notifications to Slack/webhook. File: `.github/workflows/notify.yml`.
- [ ] **PH8.7.9** [AGENT] Implement DORA metrics collection and Grafana dashboard. File: `infra/shared/grafana/dashboards/dora.json`.

***

### PH8.8 – Performance optimisation pass
- [ ] **PH8.8** | Status: Not Started | **Depends on PH8.4**

**Related files:** across all packages and apps

**Definition of Done:**
- **Query optimisation:** `EXPLAIN ANALYZE` run on all queries identified as p95 > 100ms in load tests; missing indexes added; N+1 queries eliminated.
- **Cache warming:** `firm-cache.warmCache` wired for top-10 high-traffic `getTenant`, `getWhiteLabelConfig`, `routeDomain` calls at pod startup.
- **Bundle analysis:** `@next/bundle-analyzer` run on all apps; no single JS chunk > 200KB (gzipped); code-splitting verified for all dynamic imports.
- **RSC streaming:** all pages using `<Suspense>` boundaries with meaningful skeleton loaders — no full-page blocking render.
- **Image optimisation:** all `<Image>` components use `next/image` with explicit `width`/`height`; AVIF format enabled.
- **Drizzle query batching:** `batchQuery` used for all N+1 patterns identified in `firm-db-client`.
- All load-test thresholds still passing after optimisation changes.

**Out of Scope:** CDN configuration (PH8.9); database sharding. **Rules:** No query change without an `EXPLAIN ANALYZE` before/after; bundle size limit enforced in CI via `bundlewatch`; no `<Image>` without `next/image`. **Anti-Patterns:** No blind index additions without `EXPLAIN ANALYZE`; no images without `next/image`; no single chunk > 200KB. **DDD:** N/A | **TDD:** N/A | **BDD:** A platform user on a 4G connection sees the contacts list fully interactive within 2.5 seconds | **Deep Module:** N/A

#### Subtasks
- [ ] **PH8.8.1** [AGENT] Run `EXPLAIN ANALYZE` on all p95 > 100ms queries from load test results; add indexes. Files: `packages/firm-db-schema/src/` (index definitions).
- [ ] **PH8.8.2** [AGENT] Wire `warmCache` for top-10 high-traffic calls at pod startup. Files: affected packages.
- [ ] **PH8.8.3** [AGENT] Run `@next/bundle-analyzer` on all apps; add `bundlewatch` CI check for 200KB limit. Files: all app `next.config.ts`.
- [ ] **PH8.8.4** [AGENT] Audit all pages for `<Suspense>` boundaries; add skeleton loaders where missing.
- [ ] **PH8.8.5** [AGENT] Audit all images; ensure `next/image` with `width`/`height` and AVIF enabled.
- [ ] **PH8.8.6** [AGENT] Identify and fix all N+1 queries using `batchQuery`. Files: affected packages.

***

### PH8.9 – CDN configuration and edge caching
- [ ] **PH8.9** | Status: Not Started

**Related files:** `infra/shared/cdn/`, `apps/`

**Definition of Done:**
- CDN (Cloudflare or CloudFront) configured for all app origins; `infra/shared/cdn/` contains IaC config.
- Cache rules:
  - Static assets (`/_next/static/`): `Cache-Control: public, max-age=31536000, immutable`.
  - Public site pages: ISR-backed, CDN TTL 60s, `stale-while-revalidate`.
  - API routes: `Cache-Control: no-store` enforced.
  - Status page: CDN TTL 30s (intentionally short for live accuracy).
- CDN cache invalidation: wired into `firm-site-builder.publishSite` completion event — invalidates affected path patterns.
- `Vary: Accept-Encoding, Accept-Language` set on all cacheable responses.
- Security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`) injected at CDN edge if not already set by app.
- Tests: cache-hit on second request (verified via `CF-Cache-Status` or `X-Cache` header), API route returns `no-store`, invalidation clears stale cache.

**Out of Scope:** Edge compute / Workers (separate project). **Rules:** API routes must never be CDN-cached; cache invalidation must fire on site publish; security headers injected at edge as a defence-in-depth layer. **Anti-Patterns:** No caching API routes at CDN; no missing cache invalidation on publish; no deploying without security headers at edge. **DDD:** N/A | **TDD:** N/A | **BDD:** An agency publishing a site update sees the new version live within 60 seconds — the CDN cache is automatically invalidated | **Deep Module:** CDN config encapsulates cache rule complexity; apps set only `Cache-Control` headers and the CDN handles the rest.

#### Subtasks
- [ ] **PH8.9.1** [HUMAN] Configure CDN origin and cache rules in `infra/shared/cdn/`.
- [ ] **PH8.9.2** [AGENT] Set correct `Cache-Control` headers on all Next.js route types. Files: all app `next.config.ts`.
- [ ] **PH8.9.3** [AGENT] Wire CDN cache invalidation into `site.generation_complete` event handler. File: `workers/site-generation-worker/src/invalidate.ts`.
- [ ] **PH8.9.4** [AGENT] Configure security headers injection at CDN edge. File: `infra/shared/cdn/`.
- [ ] **PH8.9.5** [AGENT] Write cache-hit and `no-store` E2E assertions. File: `tests/e2e/cdn.test.ts`.

***

### PH8.10 – Backup and disaster recovery
- [ ] **PH8.10** | Status: Not Started

**Related files:** `infra/shared/backup/`, `docs/runbooks/disaster-recovery.md`

**Definition of Done:**
- **PostgreSQL:** automated daily snapshots with 30-day retention; point-in-time recovery (PITR) enabled; cross-region snapshot replication for EU region.
- **Redis:** AOF persistence enabled; daily RDB snapshots; documented recovery procedure.
- **`firm-media` storage:** versioning enabled on S3/R2 buckets; cross-region replication for EU buckets.
- **Restore drill:** documented procedure for full restore from backup; RTO ≤ 4h, RPO ≤ 1h documented in `docs/runbooks/disaster-recovery.md`.
- **Backup validation:** weekly automated restore-to-staging test; validates row counts and RLS still active post-restore.
- Backup failure alerts: `BackupJobFailed` Prometheus alert fires if daily snapshot misses window.

**Out of Scope:** Multi-region active-active (separate project). **Rules:** EU backups must remain in EU region — no cross-Atlantic replication; RTO and RPO must be documented and tested; backup validation must be automated. **Anti-Patterns:** No untested backups; no EU data replicated outside EU; no undocumented RTO/RPO. **DDD:** N/A | **TDD:** N/A | **BDD:** After a simulated database loss, the platform is fully restored within 4 hours with no more than 1 hour of data loss | **Deep Module:** N/A

#### Subtasks
- [ ] **PH8.10.1** [HUMAN] Configure PostgreSQL PITR and cross-region snapshot replication. File: `infra/shared/backup/postgres.md`.
- [ ] **PH8.10.2** [HUMAN] Configure Redis AOF + RDB snapshots and recovery procedure. File: `infra/shared/backup/redis.md`.
- [ ] **PH8.10.3** [HUMAN] Enable S3/R2 bucket versioning and EU cross-region replication. File: `infra/shared/backup/storage.md`.
- [ ] **PH8.10.4** [HUMAN] Document disaster recovery runbook with RTO ≤ 4h and RPO ≤ 1h. File: `docs/runbooks/disaster-recovery.md`.
- [ ] **PH8.10.5** [AGENT] Implement weekly automated restore-to-staging job with row count and RLS validation. File: `.github/workflows/backup-validation.yml`.
- [ ] **PH8.10.6** [AGENT] Add `BackupJobFailed` Prometheus alert. File: `infra/shared/prometheus/rules/infrastructure.yaml`.

***

### PH8.11 – Compliance final verification
- [ ] **PH8.11** | Status: Not Started | **Final compliance gate**

**Related files:** `docs/compliance/`

**Definition of Done:**
- **GDPR Art. 30 Records of Processing Activities (RoPA):** documented in `docs/compliance/ropa.md` covering all processing activities, purposes, legal bases, retention periods, and data flows.
- **GDPR Art. 32 Technical Measures:** `docs/compliance/art32-technical-measures.md` documenting encryption at rest/transit, RLS, access controls, pseudonymisation, incident response.
- **NY Synthetic Performer Act:** `docs/compliance/ny-synthetic-performer.md` confirming `disclosure_label` on all AI content, C2PA manifests post Aug 2, human approval workflow operational.
- **GCM v3 + CNIL:** `docs/compliance/consent-compliance.md` confirming all deadlines met: GCM v3 active (Jun 15 ✓), CNIL schema wired (Jun 9 ✓), CNIL enforcement active (Jul 14 ✓).
- **TCF 2.2:** consent string encoding verified by `firm-consent` tests.
- **Data residency:** EU tenant data confirmed non-replicated to US region; documented with infra evidence.
- **OWASP Top 10:** all items from PH8.6 signed off.
- All compliance documents reviewed and signed by human (founder or designated compliance owner).

**Out of Scope:** SOC 2 Type II audit (separate engagement); ISO 27001 certification. **Rules:** All compliance documents must be human-reviewed before go-live; no compliance document may be auto-generated without human sign-off. **Anti-Patterns:** No going live without human sign-off on all compliance documents. **DDD:** N/A | **TDD:** N/A | **BDD:** N/A

#### Subtasks
- [ ] **PH8.11.1** [HUMAN] Write and sign GDPR Art. 30 RoPA. File: `docs/compliance/ropa.md`.
- [ ] **PH8.11.2** [HUMAN] Write and sign GDPR Art. 32 Technical Measures document. File: `docs/compliance/art32-technical-measures.md`.
- [ ] **PH8.11.3** [HUMAN] Write and sign NY Synthetic Performer Act compliance statement. File: `docs/compliance/ny-synthetic-performer.md`.
- [ ] **PH8.11.4** [HUMAN] Write and sign GCM v3 + CNIL consent compliance record. File: `docs/compliance/consent-compliance.md`.
- [ ] **PH8.11.5** [HUMAN] Confirm EU data residency with infra evidence; document. File: `docs/compliance/data-residency.md`.
- [ ] **PH8.11.6** [HUMAN] Sign off all OWASP Top 10 checklist items from PH8.6.

***

### PH8.12 – Phase 8 acceptance criteria (go-live gate)
- [ ] **PH8.12** | Status: Not Started | ⚠️ **PRODUCTION GO-LIVE GATE**

**Definition of Done:**
- All Phase 8 tasks complete and signed off.
- All CI gates passing on `main`: Gates 1–17, New1, New2, Gate 13 (Audit Coverage), Gate 14 (GCM v3), Gate 15 (Feature Flag Expiry), Gate 16 (Port-Adapter Stub), Gate New2 (AI Approval Bypass).
- Load test suite passing: smoke, load, stress, spike all below thresholds.
- Chaos suite passing: all 6 scenarios pass assertions in staging.
- Security audit complete: zero high/critical CVEs, SAST clean, secrets scan clean, CSP audit clean.
- All 6 compliance documents human-signed.
- Grafana dashboards and Prometheus alerts deployed and verified in staging.
- Backup and restore drill completed; RTO/RPO documented.
- CDN configured and cache behaviour verified.
- Disaster recovery runbook reviewed and signed.
- `v1.0.0-rc` tag created; staging smoke test passes.

#### Subtasks
- [ ] **PH8.12.1** [AGENT] Run full CI suite on `main`; confirm all gates passing.
- [ ] **PH8.12.2** [AGENT] Run load test suite (smoke/load/stress/spike) in staging; confirm thresholds met.
- [ ] **PH8.12.3** [AGENT] Run chaos suite in staging; confirm all 6 scenarios passing.
- [ ] **PH8.12.4** [HUMAN] Complete security audit sign-off.
- [ ] **PH8.12.5** [HUMAN] Complete all 6 compliance document sign-offs.
- [ ] **PH8.12.6** [HUMAN] Confirm Grafana dashboards and alerts operational in staging.
- [ ] **PH8.12.7** [HUMAN] Complete backup restore drill; sign off RTO/RPO.
- [ ] **PH8.12.8** [HUMAN] Create `v1.0.0-rc` tag; confirm staging smoke test passes.
- [ ] **PH8.12.9** [HUMAN] **FINAL SIGN-OFF: approve production deployment.** Tag `v1.0.0`.

***

## CI Gate Registry

*All gates registered as stubs in PH1.35; activated in the phase indicated.*

| Gate | Name | Activation | Type |
|------|------|------------|------|
| 1 | Type-check (`tsc --strict`) | Phase 1 | Blocking |
| 2 | Lint (ESLint) | Phase 1 | Blocking |
| 3 | Unit tests (coverage ≥80%) | Phase 1 | Blocking |
| 4 | Build (`turbo build`) | Phase 1 | Blocking |
| 5 | `firm-request-context` concurrent isolation | Phase 1 | Blocking |
| 6 | PII redaction fixture | Phase 1 | Blocking |
| 7 | `firm-auth` session type | Phase 1 | Blocking |
| 8 | Quota-check AST gate (New1) | Phase 1 | Blocking |
| 9 | `satisfies` conformance | Phase 1 | Blocking |
| 10 | RLS coverage — new table check | Phase 2 | Blocking |
| 11 | RLS coverage — policy check | Phase 2 | Blocking |
| 12 | RLS coverage — isolation test check | Phase 2 | Blocking |
| 13 | Audit coverage — auth/permission mutations | Phase 2 | Blocking |
| 14 | GCM v3 translation layer present | Phase 1 (PH1.25) | Blocking |
| 15 | Feature flag expiry | Phase 1 | Blocking |
| 16 | Port-adapter stub check | Phase 1 | Warning |
| 17 | Observability instrumentation | Phase 3 | Blocking |
| New1 | Quota-check AST (metered calls) | Phase 1 | Blocking |
| New2 | AI content approval bypass | Phase 4 | Blocking |

***

## Compliance Deadline Tracker

| Deadline | Requirement | Task | Status |
|----------|-------------|------|--------|
| Jun 9, 2026 | CNIL suppression schema wired | PH1.25.4 | ⚠️ Pending |
| Jun 9, 2026 | NY Synthetic Performer schema minimum | PH1.26 | ⚠️ Pending |
| Jun 15, 2026 | GCM v3 translation layer active | PH1.25.2 | ⚠️ Pending |
| Jul 14, 2026 | CNIL enforcement active | PH5.16.4 | ⚠️ Pending |
| Aug 2, 2026 | C2PA manifests on all AI content | PH3.12, PH4.11 | ⚠️ Pending |

***

*End of Document.*