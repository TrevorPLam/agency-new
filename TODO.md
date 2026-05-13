Phase 1 of the updated TODO.md follows. Every parent task is small, contains all required sections, and uses the unique ID and indicator conventions you specified.

---

# TODO.md — Agency Platform Monorepo Build Plan

## Phase 1: Foundation Hardening

*All existing packages stabilised, missing Layer 0 config created, governance artifacts in place, structural extractions performed, and CI/verification infrastructure ready. No new business‑logic package may be started until Phase 1 acceptance criteria are met.*

---

### PH1.1 – Establish repository governance artifacts
- [ ] **PH1.1** | Status: Not Started

**Related files:** `SECURITY.md`, `CONTRIBUTING.md`, `.github/ISSUE_TEMPLATE/`, `.github/PULL_REQUEST_TEMPLATE.md`

**Definition of Done:**
- `SECURITY.md` contains vulnerability disclosure process, security contact, and response SLA.
- `CONTRIBUTING.md` describes PR process, branch naming, test requirements, and ADR proposal process.
- `.github/ISSUE_TEMPLATE/` has `bug_report.md`, `feature_request.md`, `adr_proposal.md`, `security_vulnerability.md`.
- `.github/PULL_REQUEST_TEMPLATE.md` includes checklist: tests added, coverage ≥80%, ADR if breaking.

**Out of Scope:** Actual ADR records; only template and directory (see PH1.2).

**Rules to Follow:** Follow standard GitHub community health file conventions.

**Advanced Coding Patterns:** N/A

**Anti-Patterns:** Do not commit placeholder content that will be replaced later; final text must be review‑ready.

**DDD:** [N/A]  
**TDD:** [N/A]  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH1.1.1** [HUMAN] Draft and commit `SECURITY.md` at repository root.
- [ ] **PH1.1.2** [HUMAN] Draft and commit `CONTRIBUTING.md` at repository root.
- [ ] **PH1.1.3** [AGENT] Create issue templates: `.github/ISSUE_TEMPLATE/bug_report.md`, `feature_request.md`, `adr_proposal.md`, `security_vulnerability.md`.
- [ ] **PH1.1.4** [AGENT] Create PR template: `.github/PULL_REQUEST_TEMPLATE.md`.

---

### PH1.2 – Set up ADR infrastructure and write blocking ADRs
- [ ] **PH1.2** | Status: Not Started

**Related files:** `docs/adr/`, `docs/adr/0000-template.md`, `docs/adr/index.md`

**Definition of Done:**
- `docs/adr/` directory exists with template and index.
- The following ADRs are written, reviewed, and committed: `firm‑bus` engine, `firm‑search` engine, `firm‑types` shared kernel boundary, `firm‑db` read‑model home, application grouping, `firm‑workflow` condition model, template engine choice, client site generation model.
- Each ADR follows the template (status, context, decision, consequences).

**Out of Scope:** ADRs that do not block Phase 2 (they can be written in later phases).

**Rules to Follow:** Use the numbered ADR convention; set status to “proposed” until approved, then “accepted”.

**Advanced Coding Patterns:** N/A

**Anti-Patterns:** Do not approve an ADR without linking it to the CI enforcement that implements the decision.

**DDD:** [N/A]  
**TDD:** [N/A]  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH1.2.1** [AGENT] Create `docs/adr/` directory and `0000-template.md` based on standard ADR template.
- [ ] **PH1.2.2** [AGENT] Create `docs/adr/index.md` listing all ADRs with status.
- [ ] **PH1.2.3** [HUMAN] Write ADR‑001: `firm‑bus` engine (Inngest vs. custom outbox). File: `docs/adr/0001-firm-bus-engine.md`.
- [ ] **PH1.2.4** [HUMAN] Write ADR‑002: `firm‑search` engine (PostgreSQL FTS vs. Typesense/Meilisearch). File: `docs/adr/0002-firm-search-engine.md`.
- [ ] **PH1.2.5** [HUMAN] Write ADR‑003: `firm‑types` shared kernel boundary. File: `docs/adr/0003-shared-kernel-boundary.md`.
- [ ] **PH1.2.6** [HUMAN] Write ADR‑004: `firm‑db` read‑model home (Option A/B). File: `docs/adr/0004-db-read-model-home.md`.
- [ ] **PH1.2.7** [HUMAN] Write ADR‑005: application grouping (22 apps vs. 3‑5 grouped). File: `docs/adr/0005-application-grouping.md`.
- [ ] **PH1.2.8** [HUMAN] Write ADR‑006: client site generation model (ephemeral vs. committed). File: `docs/adr/0006-client-site-generation.md`.
- [ ] **PH1.2.9** [HUMAN] Write ADR‑007: `firm‑workflow` condition model. File: `docs/adr/0007-workflow-condition-model.md`.
- [ ] **PH1.2.10** [HUMAN] Write ADR‑008: template engine choice (Liquid for email/SMS, Handlebars for PDF). File: `docs/adr/0008-template-engine-choice.md`.

---

### PH1.3 – Create SLO definitions and runbook skeleton
- [ ] **PH1.3** | Status: Not Started

**Related files:** `docs/slos/`, `docs/runbooks/`

**Definition of Done:**
- `docs/slos/` contains at least 6 SLO definitions (API p95 latency, outbox processing lag, auth success rate, RLS health, cross‑tenant query rate, AI approval rate).
- `docs/runbooks/` contains a markdown file for each SLO that will trigger a Grafana alert, with diagnostic steps and escalation path.

**Out of Scope:** Actual Grafana dashboards and Prometheus rules (those come in Phase 8).

**Rules to Follow:** Every SLO must have a corresponding runbook before the alert is configured.

**Advanced Coding Patterns:** N/A

**Anti-Patterns:** Do not define SLOs without a clear measurement window and error budget.

**DDD:** [N/A]  
**TDD:** [N/A]  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH1.3.1** [HUMAN] Write SLO definitions in `docs/slos/`: `api-p95-latency.md`, `outbox-lag.md`, `auth-success-rate.md`, `rls-health.md`, `cross-tenant-queries.md`, `ai-approval-rate.md`.
- [ ] **PH1.3.2** [HUMAN] Create runbook skeleton files in `docs/runbooks/` corresponding to each SLO and any other critical alerts (e.g., `redis‑down.md`, `outbox‑worker‑crash.md`, `pgbouncer‑eviction.md`).

---

### PH1.4 – Rename `services/` to `workers/` and update all references
- [ ] **PH1.4** | Status: Not Started

**Related files:** `services/` directory, all import paths, `firm-config-eslint` boundary types, `dep‑fence` script (when created).

**Definition of Done:**
- `services/` directory is renamed to `workers/`.
- All internal imports, CI scripts, Dockerfiles, and documentation references are updated.
- `workers` boundary type is added to ESLint config (see PH1.12).

**Out of Scope:** New worker implementations; only directory rename.

**Rules to Follow:** Use a global search‑and‑replace, then manually verify that no stale `services/` paths remain.

**Advanced Coding Patterns:** N/A

**Anti-Patterns:** Do not leave both directories; if a reference is missed, the CI must catch it.

**DDD:** [N/A]  
**TDD:** [N/A]  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH1.4.1** [AGENT] Rename `services/` to `workers/` using `git mv`.
- [ ] **PH1.4.2** [AGENT] Update all occurrences of `"services/"` in `package.json` files, `tsconfig` paths, CI scripts, and documentation to `"workers/"`.
- [ ] **PH1.4.3** [AGENT] Verify no stale reference remains by running a recursive grep for `services/` across the entire repo and failing CI if any found.

---

### PH1.5 – Build missing Layer 0 config: `firm-config-prettier`
- [ ] **PH1.5** | Status: Not Started

**Related files:** `packages/layer0‑config/firm‑config‑prettier/`

**Definition of Done:**
- Package exports a frozen Prettier configuration (`prettier.config.js` equivalent).
- All existing packages consume it via `"prettier": "@firm/config‑prettier"` in `package.json`.

**Out of Scope:** Formatting rule debate; only freezing the current style.

**Rules to Follow:** This is a Layer 0 config package; no runtime code, no internal imports beyond primitives.

**Advanced Coding Patterns:** Factory function that returns the config object.

**Anti-Patterns:** Do not import from other config packages.

**DDD:** [N/A]  
**TDD:** Snapshot test that the exported config matches expected shape.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH1.5.1** [AGENT] Scaffold package: `packages/layer0‑config/firm‑config‑prettier/package.json`, `index.ts`.
- [ ] **PH1.5.2** [AGENT] Export a frozen Prettier configuration object with the project’s formatting rules.
- [ ] **PH1.5.3** [AGENT] Add snapshot test to verify config integrity.
- [ ] **PH1.5.4** [AGENT] Update root `package.json` and all workspace packages to use `"prettier": "@firm/config‑prettier"`.

---

### PH1.6 – Build missing Layer 0 config: `firm-config-vitest`
- [ ] **PH1.6** | Status: Not Started

**Related files:** `packages/layer0‑config/firm‑config‑vitest/`

**Definition of Done:**
- Package exports a `createVitestConfig(baseOptions)` factory that sets coverage ≥80% and Node/browser environment modes.
- All existing packages consume it.

**Out of Scope:** Actual test files.

**Rules to Follow:** Layer 0; no runtime code. Must reference `firm‑primitives` for environment types if needed.

**Advanced Coding Patterns:** Factory function merging user options with strict defaults.

**Anti-Patterns:** Do not hardcode paths that break when the monorepo structure changes; use relative paths from the consuming package root.

**DDD:** [N/A]  
**TDD:** Unit test that the factory returns the expected merged config.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH1.6.1** [AGENT] Scaffold package: `packages/layer0‑config/firm‑config‑vitest/`.
- [ ] **PH1.6.2** [AGENT] Implement `createVitestConfig()` with Node and browser mode support, coverage thresholds.
- [ ] **PH1.6.3** [AGENT] Write unit test for the factory.
- [ ] **PH1.6.4** [AGENT] Update all existing packages to use the shared config.

---

### PH1.7 – Build missing Layer 0 config: `firm-config-playwright`
- [ ] **PH1.7** | Status: Not Started

**Related files:** `packages/layer0‑config/firm‑config‑playwright/`

**Definition of Done:**
- Package exports a `createPlaywrightConfig(baseOptions)` factory with default browsers, base URLs, auth state configuration.

**Out of Scope:** Actual E2E tests.

**Rules to Follow:** Layer 0; no runtime code.

**Advanced Coding Patterns:** Factory function.

**Anti-Patterns:** Do not commit real credentials in the config factory; use env references.

**DDD:** [N/A]  
**TDD:** Snapshot test of default config.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH1.7.1** [AGENT] Scaffold package.
- [ ] **PH1.7.2** [AGENT] Implement `createPlaywrightConfig()`.
- [ ] **PH1.7.3** [AGENT] Write snapshot test.
- [ ] **PH1.7.4** [AGENT] Update packages that will use Playwright (e.g., `firm‑testing`).

---

### PH1.8 – Build missing Layer 0 config: `firm-config-commitlint`
- [ ] **PH1.8** | Status: Not Started

**Related files:** `packages/layer0‑config/firm‑config‑commitlint/`

**Definition of Done:**
- Package exports a commitlint config enforcing conventional commits.
- Root `commitlint.config.js` references this package.

**Out of Scope:** Git hooks; only the config.

**Rules to Follow:** Layer 0; no runtime code.

**Advanced Coding Patterns:** Export a configuration object.

**Anti-Patterns:** N/A

**DDD:** [N/A]  
**TDD:** Snapshot test.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH1.8.1** [AGENT] Scaffold package.
- [ ] **PH1.8.2** [AGENT] Export conventional commit config.
- [ ] **PH1.8.3** [AGENT] Add snapshot test.
- [ ] **PH1.8.4** [AGENT] Point root `commitlint.config.js` to this package.

---

### PH1.9 – Build missing Layer 0 config: `firm-config-docker`
- [ ] **PH1.9** | Status: Not Started

**Related files:** `packages/layer0‑config/firm‑config‑docker/`

**Definition of Done:**
- Package contains reusable Dockerfile templates and a factory to produce hardened Node.js Dockerfiles.
- Templates enforce multi‑stage builds, non‑root user, `tini` as PID 1, and standard `HEALTHCHECK CMD`.

**Out of Scope:** Actual Docker image builds; only the templates and factory.

**Rules to Follow:** Layer 0; no runtime code. Templates must be parameterisable.

**Advanced Coding Patterns:** Factory function that accepts base image and entrypoint, returns a complete Dockerfile string.

**Anti-Patterns:** Do not commit a Dockerfile that runs as root.

**DDD:** [N/A]  
**TDD:** Unit test that generated Dockerfile contains required instructions.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH1.9.1** [AGENT] Scaffold package.
- [ ] **PH1.9.2** [AGENT] Implement `createDockerfile(options)` factory generating hardened Node.js Dockerfile content.
- [ ] **PH1.9.3** [AGENT] Add tests verifying non‑root user, `tini`, and `HEALTHCHECK` presence.
- [ ] **PH1.9.4** [AGENT] Document usage in `README.md`.

---

### PH1.10 – Build missing Layer 0 config: `firm-config-storybook`
- [ ] **PH1.10** | Status: Not Started

**Related files:** `packages/layer0‑config/firm‑config‑storybook/`

**Definition of Done:**
- Package exports a shared Storybook configuration factory that integrates with `firm‑tokens` theming and `firm‑ui` components.

**Out of Scope:** Individual component stories; only the global Storybook config.

**Rules to Follow:** Layer 0; no runtime code. Must support Vite builder.

**Advanced Coding Patterns:** Factory function merging default Storybook config with theme injection.

**Anti-Patterns:** Do not hardcode paths to stories; accept glob patterns via options.

**DDD:** [N/A]  
**TDD:** Snapshot test of generated config.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH1.10.1** [AGENT] Scaffold package.
- [ ] **PH1.10.2** [AGENT] Implement `createStorybookConfig()`.
- [ ] **PH1.10.3** [AGENT] Add snapshot test.
- [ ] **PH1.10.4** [AGENT] Integrate with `firm‑ui` once built (Phase 4).

---

### PH1.11 – Build missing Layer 0 config: `firm-config-security-headers`
- [ ] **PH1.11** | Status: Not Started

**Related files:** `packages/layer0‑config/firm‑config‑security‑headers/`

**Definition of Done:**
- Package exports a factory for CSP/HSTS/Permissions‑Policy header generation, decoupled from Next.js.
- Default `Permissions‑Policy` restricts camera, microphone, geolocation, payment.

**Out of Scope:** Next.js middleware (that’s in `firm‑config‑next`).

**Rules to Follow:** Layer 0; no runtime dependencies except `firm‑primitives`. Must support nonce generation.

**Advanced Coding Patterns:** Factory returning header objects that can be consumed by any server framework.

**Anti-Patterns:** Do not allow `unsafe‑inline` or `unsafe‑eval` in default CSP.

**DDD:** [N/A]  
**TDD:** Unit test that generated headers include required directives.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH1.11.1** [AGENT] Scaffold package.
- [ ] **PH1.11.2** [AGENT] Implement `createSecurityHeaders(options)` factory.
- [ ] **PH1.11.3** [AGENT] Add tests verifying CSP, HSTS, and Permissions‑Policy defaults.
- [ ] **PH1.11.4** [AGENT] Add JSDoc documentation.

---

### PH1.12 – Build missing Layer 0 config: `firm-config-k6`
- [ ] **PH1.12** | Status: Not Started

**Related files:** `packages/layer0‑config/firm‑config‑k6/`

**Definition of Done:**
- Package exports shared k6 configuration (base URLs, auth fixtures, ramp‑up profiles) consumed by `load‑tests/` scenarios.

**Out of Scope:** Actual k6 test scenarios (see PH1.34).

**Rules to Follow:** Layer 0; no runtime code.

**Advanced Coding Patterns:** Factory function merging scenario‑specific options with global defaults.

**Anti-Patterns:** Do not commit real credentials; use env variables.

**DDD:** [N/A]  
**TDD:** Unit test that config factory produces valid k6 options structure.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH1.12.1** [AGENT] Scaffold package.
- [ ] **PH1.12.2** [AGENT] Implement `createK6Config(options)`.
- [ ] **PH1.12.3** [AGENT] Add unit test.
- [ ] **PH1.12.4** [AGENT] Document environment variables expected.

---

### PH1.13 – Update existing Layer 0 configs
- [ ] **PH1.13** | Status: Not Started

**Related files:** `firm-config-typescript`, `firm-config-tailwind`, `firm-config-next`, `firm-config-eslint`

**Definition of Done:**
- `firm-config-typescript` exports a `worker` variant that covers background workers without leaking browser API types.
- `firm-config-tailwind` adds a `v4/` export for Tailwind v4 CSS‑first configuration.
- `firm-config-next` explicitly sets `serverExternalPackages: ['pino', 'drizzle‑orm', 'postgres']`.
- `firm-config-eslint` adds rules: `no‑direct‑fetch`, `no‑direct‑read‑model‑write`, `no‑runtime‑tokens‑import`, and `workers` as a named boundary type.

**Out of Scope:** New config packages; only updates to existing ones.

**Rules to Follow:** Existing CI must pass; no breaking changes for current consumers.

**Advanced Coding Patterns:** Extend existing factory functions.

**Anti-Patterns:** Do not remove existing rules without ADR.

**DDD:** [N/A]  
**TDD:** Update existing tests to cover new variants.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH1.13.1** [AGENT] In `firm-config-typescript`, add `worker` config variant and unit test. File: `packages/layer0‑config/firm‑config‑typescript/src/index.ts`.
- [ ] **PH1.13.2** [AGENT] In `firm-config-tailwind`, create `v4/` export with CSS‑first configuration. File: `packages/layer0‑config/firm‑config‑tailwind/src/v4.ts`.
- [ ] **PH1.13.3** [AGENT] In `firm-config-next`, add `serverExternalPackages` array to default config. File: `packages/layer0‑config/firm‑config‑next/src/index.ts`.
- [ ] **PH1.13.4** [AGENT] In `firm-config-eslint`, add `no‑direct‑fetch`, `no‑direct‑read‑model‑write`, `no‑runtime‑tokens‑import` rules and `workers` boundary type. File: `packages/layer0‑config/firm‑config‑eslint/src/presets/boundaries.ts`.

---

### PH1.14 – Fix `firm-cache` TTL bug and add missing capabilities
- [ ] **PH1.14** | Status: Not Started (Fix 1)

**Related files:** `packages/layer2‑data/firm‑cache/src/`

**Definition of Done:**
- `TenantCache.set` validates that `ttlSeconds` is a number, throws on non‑number.
- `acquireLock(key, ttlMs)` implemented using Redis `SET NX`.
- `warmCache(keys)` implemented for pre‑populating high‑traffic keys.
- Unit tests cover all three functions and TTL validation.

**Out of Scope:** Connection pool management (already works).

**Rules to Follow:** Use `@firm/errors` for typed errors; never throw raw strings.

**Advanced Coding Patterns:** Distributed lock with automatic release via TTL.

**Anti-Patterns:** Do not accept `{ ttl }` object; only number.

**DDD:** Cache is a technical service, not an aggregate.  
**TDD:** Write tests first: TTL validation, lock acquisition/rejection, cache warming.  
**BDD:** Behavior: calling `set` with a non‑numeric TTL throws a `ValidationError`.  
**Deep Module:** `TenantCache` abstracts Redis key scoping and TTL policy behind a simple interface.

#### Subtasks
- [ ] **PH1.14.1** [AGENT] Add runtime check in `TenantCache.set` that throws if `ttlSeconds` is not a number. File: `packages/layer2‑data/firm‑cache/src/tenant-cache.ts`.
- [ ] **PH1.14.2** [AGENT] Implement `acquireLock(key, ttlMs)` using `SET key value NX PX ttlMs`. File: `packages/layer2‑data/firm‑cache/src/lock.ts`.
- [ ] **PH1.14.3** [AGENT] Implement `warmCache(keys)` to pre‑fetch and populate high‑traffic keys at startup. File: `packages/layer2‑data/firm‑cache/src/warm.ts`.
- [ ] **PH1.14.4** [AGENT] Write unit tests for TTL validation, lock acquisition, lock rejection, and cache warming. File: `packages/layer2‑data/firm‑cache/tests/`.

---

### PH1.15 – Fix `firm-security` import bug and prepare for rate‑limiter extraction
- [ ] **PH1.15** | Status: Not Started (Fix 2a)

**Related files:** `packages/layer3‑security/firm‑security/src/`

**Definition of Done:**
- Rate limiter import corrected from `CacheClient` to `TenantCache`.
- `set()` call passes numeric TTL, not an object.
- Unit test proves RateLimiter can be instantiated.

**Out of Scope:** Extracting rate‑limiter (that is PH1.28). Only fixing the existing code so it compiles and passes tests.

**Rules to Follow:** Temporary fix only; do not add new rate‑limiter features here.

**Advanced Coding Patterns:** Use dependency injection for cache client in rate‑limiter constructor.

**Anti-Patterns:** Do not leave the rate‑limiter code permanently in `firm-security`; it will be extracted immediately after.

**DDD:** Rate limiting is a security domain service.  
**TDD:** Test that `RateLimiter` can be constructed and its `consume` method calls the cache correctly.  
**BDD:** [N/A]  
**Deep Module:** [N/A] (temporary fix)

#### Subtasks
- [ ] **PH1.15.1** [AGENT] In `firm-security`, fix import statement: replace `{ CacheClient }` with `{ TenantCache }`. File: `packages/layer3‑security/firm‑security/src/rate‑limiter.ts`.
- [ ] **PH1.15.2** [AGENT] Update `set()` call to pass numeric TTL. Same file.
- [ ] **PH1.15.3** [AGENT] Write unit test with mocked `TenantCache` proving `RateLimiter.consume` works. File: `packages/layer3‑security/firm‑security/tests/rate‑limiter.test.ts`.

---

### PH1.16 – Fix `firm-auth` types and remove deprecated impersonation
- [ ] **PH1.16** | Status: Not Started (Fix 3)

**Related files:** `packages/layer3‑security/firm‑auth/src/`

**Definition of Done:**
- `SessionContext.role` typed as `Role` union, not `string`.
- Deprecated `startImpersonationLegacy` removed.
- Audit log fallback no longer uses `console.log`; instead writes to a dedicated error stream.

**Out of Scope:** New RBAC features; only fixing current bugs.

**Rules to Follow:** Keep the existing public API stable where possible.

**Advanced Coding Patterns:** Use TypeScript `satisfies` to verify role against permission matrix.

**Anti-Patterns:** Do not leave a silent fallback; audit failures must be observable.

**DDD:** `SessionContext` is a value object in the auth bounded context.  
**TDD:** Test that role assignment fails at compile time for invalid strings; test that legacy function is absent.  
**BDD:** Behavior: calling removed function results in a build error.  
**Deep Module:** `firm-auth` wraps Better Auth behind a platform‑specific session model.

#### Subtasks
- [ ] **PH1.16.1** [AGENT] Change `session.role` type from `string` to the `Role` union. File: `packages/layer3‑security/firm‑auth/src/session/types.ts`.
- [ ] **PH1.16.2** [AGENT] Remove `startImpersonationLegacy` and update all internal references. File: `packages/layer3‑security/firm‑auth/src/impersonation.ts`.
- [ ] **PH1.16.3** [AGENT] Replace `console.log` fallback in audit logger with a dedicated error stream or logger call. File: `packages/layer3‑security/firm‑auth/src/audit.ts`.
- [ ] **PH1.16.4** [AGENT] Update tests to verify removed export and new type checks. File: `packages/layer3‑security/firm‑auth/tests/`.

---

### PH1.17 – Fix `firm-validators` imports, migrations, and add factory functions
- [ ] **PH1.17** | Status: Not Started (Fix 4)

**Related files:** `packages/layer2‑data/firm‑validators/src/`

**Definition of Done:**
- `campaign.ts` missing imports (`uuidField`, etc.) added.
- Lead v1→v2 and v2→v1 migrations use only existing fields; broken references removed.
- Factory functions `createPaginationSchema`, `createTenantScopedSchema`, `createVersionedSchema` implemented and tested.
- Package compiles cleanly; unit tests cover all entities and factories.

**Out of Scope:** New entity schemas beyond the current set (they will come when new features are built).

**Rules to Follow:** Every Zod schema must `satisfy` its corresponding `firm-types` interface.

**Advanced Coding Patterns:** Factory functions that accept base schemas and return enriched Zod objects with tenant scoping, pagination, or versioning applied.

**Anti-Patterns:** Do not commit schemas that reference non‑existent fields.

**DDD:** Validators are a supporting domain service.  
**TDD:** For each factory, write tests that verify the returned schema rejects invalid data and accepts valid data.  
**BDD:** Behavior: a tenant‑scoped schema requires `tenantId` and rejects payloads without it.  
**Deep Module:** Factory functions encapsulate cross‑cutting validation concerns.

#### Subtasks
- [ ] **PH1.17.1** [AGENT] Fix missing imports in `campaign.ts`. File: `packages/layer2‑data/firm‑validators/src/campaign.ts`.
- [ ] **PH1.17.2** [AGENT] Rewrite lead v1→v2 and v2→v1 migrations using only existing fields. File: `packages/layer2‑data/firm‑validators/src/lead/migrations.ts`.
- [ ] **PH1.17.3** [AGENT] Implement `createPaginationSchema(baseSchema)` that adds `cursor` and `limit` fields. File: `packages/layer2‑data/firm‑validators/src/factories/pagination.ts`.
- [ ] **PH1.17.4** [AGENT] Implement `createTenantScopedSchema(baseSchema)` that adds `tenantId` field and scoping logic. File: `packages/layer2‑data/firm‑validators/src/factories/tenant-scoped.ts`.
- [ ] **PH1.17.5** [AGENT] Implement `createVersionedSchema(schema, version)` that wraps a schema with version metadata. File: `packages/layer2‑data/firm‑validators/src/factories/versioned.ts`.
- [ ] **PH1.17.6** [AGENT] Write comprehensive unit tests for all entity schemas and factory functions. File: `packages/layer2‑data/firm‑validators/tests/`.

---

### PH1.18 – Fix `firm-db` pre‑split cleanup
- [ ] **PH1.18** | Status: Not Started (Fix 5)

**Related files:** `packages/layer2‑data/firm‑db/src/`

**Definition of Done:**
- Outbox import moved to top of file.
- `softDelete` function typed with `PgTable` instead of `any`.
- Drizzle RLS API updated from deprecated `.enableRLS()` to `pgTable.withRLS(...)`.
- Migration test verifies new API works.

**Out of Scope:** The actual split into `firm‑db‑schema` and `firm‑db‑client` (that is PH1.29).

**Rules to Follow:** No functional changes; only code cleanup and type safety.

**Advanced Coding Patterns:** Use Drizzle’s `pgTable.withRLS()` per latest docs.

**Anti-Patterns:** Do not leave `any` types in exported functions.

**DDD:** Database access is infrastructure.  
**TDD:** Write a migration test that creates a table with `withRLS` and verifies RLS is enabled.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH1.18.1** [AGENT] Move outbox import to top of file. File: `packages/layer2‑data/firm‑db/src/outbox.ts`.
- [ ] **PH1.18.2** [AGENT] Change `softDelete` parameter type from `any` to `PgTable`. File: `packages/layer2‑data/firm‑db/src/utils/soft‑delete.ts`.
- [ ] **PH1.18.3** [AGENT] Replace `.enableRLS()` with `.withRLS(...)` in all schema definitions. File: `packages/layer2‑data/firm‑db/src/schemas/`.
- [ ] **PH1.18.4** [AGENT] Add migration test that asserts RLS is enabled on a new table. File: `packages/layer2‑data/firm‑db/tests/rls‑migration.test.ts`.

---

### PH1.19 – Fix `firm-request-context` design flaw and add tests
- [ ] **PH1.19** | Status: Not Started (Fix 6)

**Related files:** `packages/layer1‑core/firm‑request‑context/src/`

**Definition of Done:**
- `[key: string]: any` removed from `RequestContext`. Packages that extend the context use module augmentation (`.d.ts` files).
- `withRequestContext()` wrapper added for Inngest/BullMQ job handlers.
- Comprehensive unit and integration tests cover nested async, concurrent contexts, and module augmentation.
- Test coverage ≥80%.

**Out of Scope:** Changing how context is propagated at runtime; only typing and testing.

**Rules to Follow:** Use TypeScript module augmentation; do not break existing consumers.

**Advanced Coding Patterns:** Module augmentation pattern for extensible context.

**Anti-Patterns:** Do not leave an index signature that defeats type safety.

**DDD:** Request context is a technical service carrying cross‑cutting metadata.  
**TDD:** Write tests first: setting a tenant ID in one context does not leak to another concurrent context.  
**BDD:** Behavior: a typo in a context key results in a compile‑time error, not silent failure.  
**Deep Module:** `AsyncLocalStorage` is encapsulated; consumers never interact with it directly.

#### Subtasks
- [ ] **PH1.19.1** [AGENT] Remove `[key: string]: any` from `RequestContext` interface. File: `packages/layer1‑core/firm‑request‑context/src/types.ts`.
- [ ] **PH1.19.2** [AGENT] Create a base `RequestContext` interface and document module augmentation pattern. File: `packages/layer1‑core/firm‑request‑context/README.md`.
- [ ] **PH1.19.3** [AGENT] Implement `withRequestContext(fn)` wrapper that restores context for job handlers. File: `packages/layer1‑core/firm‑request‑context/src/with-context.ts`.
- [ ] **PH1.19.4** [AGENT] Write unit tests for concurrent context isolation, module augmentation, and `withRequestContext`. File: `packages/layer1‑core/firm‑request‑context/tests/`.

---

### PH1.20 – Fix `firm-observability` and add missing helpers
- [ ] **PH1.20** | Status: Not Started (Fix 7)

**Related files:** `packages/layer4‑observability/firm‑observability/src/`

**Definition of Done:**
- `logger.ts` deprecated re‑export resolved (either removed or undeprecated with clear reasoning).
- `resetForTesting()` implemented to bypass double‑init guard.
- `withTenantSpan(name, fn)`, `captureError(error, context)`, `createTenantMeter(tenantId)` implemented.
- Integration tests cover all new functions.

**Out of Scope:** International PII redaction (handled in PH1.27).

**Rules to Follow:** All spans must auto‑attach `tenant.id`, `user.id`, `correlation.id` when using `withTenantSpan`.

**Advanced Coding Patterns:** Higher‑order function `withTenantSpan` that creates a span with default attributes from request context.

**Anti-Patterns:** Do not force developers to manually add tenant attributes to spans.

**DDD:** Observability is a cross‑cutting concern.  
**TDD:** Test that `withTenantSpan` attaches expected attributes; test that `resetForTesting` allows re‑initialisation.  
**BDD:** Behavior: calling `initializeObservability` twice throws without `resetForTesting`.  
**Deep Module:** `firm-observability` hides OpenTelemetry SDK complexity behind a simple API.

#### Subtasks
- [ ] **PH1.20.1** [AGENT] Remove deprecated `logger.ts` re‑export or undeprecate with a clear comment. File: `packages/layer4‑observability/firm‑observability/src/logger.ts`.
- [ ] **PH1.20.2** [AGENT] Implement `resetForTesting()`. File: `packages/layer4‑observability/firm‑observability/src/testing.ts`.
- [ ] **PH1.20.3** [AGENT] Implement `withTenantSpan(name, fn)` that auto‑attaches tenant, user, correlation attributes. File: `packages/layer4‑observability/firm‑observability/src/tracing.ts`.
- [ ] **PH1.20.4** [AGENT] Implement `captureError(error, context)` enriching Sentry events with tenant context. File: `packages/layer4‑observability/firm‑observability/src/error‑tracking.ts`.
- [ ] **PH1.20.5** [AGENT] Implement `createTenantMeter(tenantId)` for tenant‑labeled Prometheus metrics. File: `packages/layer4‑observability/firm‑observability/src/metrics.ts`.
- [ ] **PH1.20.6** [AGENT] Write integration tests for all new functions. File: `packages/layer4‑observability/firm‑observability/tests/`.

---

### PH1.21 – Extract `firm-primitives` from `firm-types`
- [ ] **PH1.21** | Status: Not Started (Fix 8)

**Related files:** `packages/layer0‑config/firm‑primitives/`, `packages/layer2‑data/firm‑types/`

**Definition of Done:**
- New package `firm-primitives` at `packages/layer0‑config/firm‑primitives/` contains branded IDs (`TenantId`, `AgencyId`, `SubAccountId`, `PlatformId`, `SessionId`, `UserId`), gatekeepers (`asTenantId`, etc.), and pure helper types.
- `firm-types` imports from `firm-primitives` and no longer exports them.
- All existing imports across the monorepo updated.
- Gatekeeper functions have unit tests.

**Out of Scope:** Adding new branded IDs beyond those listed.

**Rules to Follow:** Layer 0; no runtime code except gatekeepers. Zero domain knowledge.

**Advanced Coding Patterns:** Branded types with unique symbols.

**Anti-Patterns:** Do not include `LeadId`, `CampaignId`, etc. here—those are domain types and stay in `firm‑types`.

**DDD:** Primitives are technical building blocks, not domain concepts.  
**TDD:** Test that `asTenantId(uuid)` validates UUID format and returns branded type.  
**BDD:** [N/A]  
**Deep Module:** [N/A] (tiny package)

#### Subtasks
- [ ] **PH1.21.1** [AGENT] Scaffold `packages/layer0‑config/firm‑primitives/`.
- [ ] **PH1.21.2** [AGENT] Move branded IDs and gatekeepers from `firm‑types` into `firm‑primitives/src/ids.ts`.
- [ ] **PH1.21.3** [AGENT] Update `firm‑types` to re‑export from `firm‑primitives` (or update all consumers). File: `packages/layer2‑data/firm‑types/src/index.ts`.
- [ ] **PH1.21.4** [AGENT] Update all import statements in the monorepo to use `@firm/primitives` where only branded IDs are needed.
- [ ] **PH1.21.5** [AGENT] Write unit tests for all gatekeeper functions. File: `packages/layer0‑config/firm‑primitives/tests/`.

---

### PH1.22 – Fix `firm-logger` split‑brain context bug
- [ ] **PH1.22** | Status: Not Started (Fix 9)

**Related files:** `packages/layer1‑core/firm‑logger/src/`

**Definition of Done:**
- `ContextManager` no longer maintains its own `currentContext`; it reads solely from the unified `firm‑request‑context` store.
- Concurrent async context test proves no divergence.
- `logger.child(bindings)` implemented for request‑scoped child loggers.
- Configurable sampling added (errors/warnings never dropped).
- `createTestLogger()` implemented for in‑memory log assertions.

**Out of Scope:** PII redaction (already covered, but will be tested alongside).

**Rules to Follow:** All context extraction must go through `getUnifiedContext()`.

**Advanced Coding Patterns:** Child loggers with bound context for per‑request logging.

**Anti-Patterns:** Do not keep a secondary context store that can diverge.

**DDD:** Logging is a technical service.  
**TDD:** Write a concurrent async test: two parallel requests with different tenant IDs must produce logs with correct tenantId each.  
**BDD:** Behavior: `logger.child({ requestId })` creates a logger that includes `requestId` in every log line.  
**Deep Module:** `firm‑logger` abstracts Pino behind a context‑aware, PII‑safe API.

#### Subtasks
- [ ] **PH1.22.1** [AGENT] Remove internal `currentContext` from `ContextManager`; delegate to `firm‑request‑context`. File: `packages/layer1‑core/firm‑logger/src/context.ts`.
- [ ] **PH1.22.2** [AGENT] Implement `logger.child(bindings)` using Pino’s child logger. File: `packages/layer1‑core/firm‑logger/src/logger.ts`.
- [ ] **PH1.22.3** [AGENT] Add configurable sampling: `sampleRate` option, errors/warnings never sampled out. Same file.
- [ ] **PH1.22.4** [AGENT] Implement `createTestLogger()` returning an in‑memory array for assertions. File: `packages/layer1‑core/firm‑logger/src/test‑logger.ts`.
- [ ] **PH1.22.5** [AGENT] Write concurrent async test and tests for child loggers, sampling, and test logger. File: `packages/layer1‑core/firm‑logger/tests/`.

---

### PH1.23 – Fix `firm-health` synthetic runner and add OTel check
- [ ] **PH1.23** | Status: Not Started (Fix 10)

**Related files:** `packages/layer4‑observability/firm‑health/src/`

**Definition of Done:**
- Synthetic runner uses recursive `setTimeout` wrapped in try/catch instead of `setInterval`.
- `observabilityHealthCheck()` added to readiness probe (OTel initialised, spans exporting).
- Event‑driven health check registration implemented (L6 packages register checks without importing `firm‑health` directly).
- Unit tests cover new runner error recovery and registration.

**Out of Scope:** RLS probe (already exists); only enhancing existing probes.

**Rules to Follow:** Readiness probe must fail if OTel SDK is not exporting spans.

**Advanced Coding Patterns:** Event emitter pattern for domain‑specific health check registration (inversion of control to avoid L4→L6 layer violation).

**Anti-Patterns:** Do not use `setInterval` for synthetic checks (no error recovery).

**DDD:** Health checks are infrastructure, not domain.  
**TDD:** Write a test that simulates a synthetic check failure and asserts the runner recovers and continues.  
**BDD:** Behavior: when a synthetic check throws, the runner logs the error and schedules the next run.  
**Deep Module:** `firm‑health` provides Kubernetes‑standard probes and extensible synthetic monitoring behind a simple registration API.

#### Subtasks
- [ ] **PH1.23.1** [AGENT] Replace `setInterval` with recursive `setTimeout` wrapped in try/catch in the synthetic runner. File: `packages/layer4‑observability/firm‑health/src/synthetic.ts`.
- [ ] **PH1.23.2** [AGENT] Implement `observabilityHealthCheck()` that verifies OTel SDK is initialised and spans are exporting. File: `packages/layer4‑observability/firm‑health/src/probes/observability.ts`.
- [ ] **PH1.23.3** [AGENT] Implement event‑driven health check registration (EventEmitter or similar) so L6 packages can register checks without importing `firm‑health`. File: `packages/layer4‑observability/firm‑health/src/registry.ts`.
- [ ] **PH1.23.4** [AGENT] Write unit tests for synthetic runner recovery, OTel health check, and registration mechanism. File: `packages/layer4‑observability/firm‑health/tests/`.

---

### PH1.24 – Add `checkQuota()` to `firm-metering` and CI enforcement
- [ ] **PH1.24** | Status: Not Started (Fix 11)

**Related files:** `packages/layer6‑features/firm‑metering/` (to be created), `scripts/ci/quota‑check‑enforcement.ts`

**Definition of Done:**
- `firm-metering` package exists at `packages/layer6‑features/firm‑metering/` with `checkQuota(tenantId, dimension, amount): Promise<Result<QuotaAllowed, QuotaExceeded>>`.
- 80% quota warning event emitted when usage crosses threshold.
- CI static analysis gate (`scripts/ci/quota‑check‑enforcement.ts`) detects metered operations without preceding `checkQuota()` call and fails build.

**Out of Scope:** Full metering aggregation (Phase 2); only the enforcement API.

**Rules to Follow:** `checkQuota()` must reject before the operation, not after.

**Advanced Coding Patterns:** Static analysis via AST (TypeScript compiler API) to detect missing pre‑checks.

**Anti-Patterns:** Do not allow `recordUsage()` to serve as a substitute for `checkQuota()`.

**DDD:** Metering is a supporting domain service.  
**TDD:** Test that `checkQuota` returns `QuotaExceeded` when limit is reached, and that a quota warning event fires at 80%.  
**BDD:** Behavior: an operation that would exceed quota is rejected with `QuotaExceeded` before any resources are consumed.  
**Deep Module:** `firm‑metering` encapsulates quota logic behind a simple `checkQuota` call; feature packages never access Redis counters directly.

#### Subtasks
- [ ] **PH1.24.1** [AGENT] Create `firm-metering` package scaffold at `packages/layer6‑features/firm‑metering/`.
- [ ] **PH1.24.2** [AGENT] Implement `checkQuota(tenantId, dimension, amount)` with Redis‑backed counters. File: `packages/layer6‑features/firm‑metering/src/quota.ts`.
- [ ] **PH1.24.3** [AGENT] Implement 80% quota warning event emission. File: `packages/layer6‑features/firm‑metering/src/warnings.ts`.
- [ ] **PH1.24.4** [AGENT] Write unit tests for quota enforcement and warning. File: `packages/layer6‑features/firm‑metering/tests/`.
- [ ] **PH1.24.5** [AGENT] Build `scripts/ci/quota‑check‑enforcement.ts` CI script that scans feature packages for metered operations lacking `checkQuota()` call. File: `scripts/ci/quota‑check‑enforcement.ts`.
- [ ] **PH1.24.6** [AGENT] Integrate the script into CI pipeline (see PH1.33).

---

### PH1.25 – Build `adapter-storage-local`
- [ ] **PH1.25** | Status: Not Started (Fix 13)

**Related files:** `packages/layer7‑adapters/storage/adapters‑storage‑local/`

**Definition of Done:**
- Package implements `StoragePort` from `firm‑types` with filesystem backend.
- `putObject`, `getObject`, `deleteObject`, `getSignedUrl` operations work with local directory.
- Conformance test passes.

**Out of Scope:** Cloud storage adapters (S3, R2) – those come in Phase 3.

**Rules to Follow:** Must be scaffolded via generator (once built); for now, hand‑authored as the generator doesn’t exist yet, but must follow the same structure.

**Advanced Coding Patterns:** Lazy initialisation of storage directory from env vars.

**Anti-Patterns:** Do not use real cloud credentials; only local filesystem.

**DDD:** Adapter implements an anti‑corruption layer between the platform’s `StoragePort` and the filesystem.  
**TDD:** Test that `putObject` writes a file and `getObject` retrieves it; test that `getSignedUrl` returns a valid local file URL.  
**BDD:** Behavior: storing an object with a tenant‑scoped key prefixes the path with the tenant ID.  
**Deep Module:** Adapter hides filesystem details behind the `StoragePort` interface.

#### Subtasks
- [ ] **PH1.25.1** [AGENT] Create package at `packages/layer7‑adapters/storage/adapters‑storage‑local/`.
- [ ] **PH1.25.2** [AGENT] Implement `LocalStorageAdapter` class implementing `StoragePort`. File: `packages/layer7‑adapters/storage/adapters‑storage‑local/src/adapter.ts`.
- [ ] **PH1.25.3** [AGENT] Write conformance test against `StoragePort`. File: `packages/layer7‑adapters/storage/adapters‑storage‑local/tests/conformance.test.ts`.
- [ ] **PH1.25.4** [AGENT] Add unit tests for filesystem operations. File: `packages/layer7‑adapters/storage/adapters‑storage‑local/tests/`.

---

### PH1.26 – Split `firm-db` into `firm-db-schema` and `firm-db-client`
- [ ] **PH1.26** | Status: Not Started (Fix 14)

**Related files:** `packages/layer2‑data/firm‑db/`, `packages/layer2‑data/firm‑db‑schema/`, `packages/layer2‑data/firm‑db‑client/`

**Definition of Done:**
- `firm‑db‑schema` contains Drizzle schema definitions, RLS policies, migration source of truth. Zero runtime deps beyond Drizzle.
- `firm‑db‑client` contains connection factories (serverless/pooled/direct), outbox helpers, pagination, PgBouncer‑safe RESET wrapper.
- All existing consumers updated to import from the correct new package.
- Original `firm‑db` package either removed or becomes a re‑export barrel.

**Out of Scope:** CQRS read model home (PH1.27 decides that).

**Rules to Follow:** No package may import `firm‑db‑client` unless it needs a database connection. Packages needing only types import `firm‑db‑schema`.

**Advanced Coding Patterns:** Separation of lightweight schema from heavyweight connection logic.

**Anti-Patterns:** Do not let `firm‑db‑schema` import `postgres` or `ioredis`; keep it pure.

**DDD:** Database infrastructure is split into contract (schema) and runtime (client).  
**TDD:** Write a migration test that uses `firm‑db‑client` to run migrations defined in `firm‑db‑schema` and then query through the client.  
**BDD:** [N/A]  
**Deep Module:** The split allows feature packages to depend only on the lightweight schema, improving build times and test isolation.

#### Subtasks
- [ ] **PH1.26.1** [AGENT] Create `packages/layer2‑data/firm‑db‑schema/` and move all Drizzle schema files and migration files into it. Remove runtime deps.
- [ ] **PH1.26.2** [AGENT] Create `packages/layer2‑data/firm‑db‑client/` and move connection factories, outbox helpers, pagination, RESET wrapper.
- [ ] **PH1.26.3** [AGENT] Update `firm‑db‑client` to import schema types from `firm‑db‑schema`.
- [ ] **PH1.26.4** [AGENT] Update all existing package imports to point to `firm‑db‑schema` or `firm‑db‑client` as appropriate.
- [ ] **PH1.26.5** [AGENT] Write integration test proving migration + query works with the split. File: `packages/layer2‑data/firm‑db‑client/tests/`.

---

### PH1.27 – Create `firm-db-read` (CQRS read model, conditional on ADR‑004)
- [ ] **PH1.27** | Status: Not Started

**Related files:** `packages/layer2‑data/firm‑db‑read/` (or subdirectory of `firm‑db‑schema`, per ADR outcome)

**Definition of Done:**
- Read‑optimised schema for `firm‑reporting` exists, containing denormalised tables.
- Dedicated connection pool for read queries (separate from write pool).
- ESLint rule enforces that only outbox event handlers may write to this schema.
- ADR‑004 outcome documented and implemented.

**Out of Scope:** Populating the read model with actual data; that requires `firm‑bus` and `firm‑reporting` (later phases).

**Rules to Follow:** If ADR chooses Option A (separate package), this is a standalone package. If Option B (subdirectory), it lives under `firm‑db‑schema/src/schemas/reporting/`.

**Advanced Coding Patterns:** CQRS pattern with separate read/write models.

**Anti-Patterns:** Do not allow feature packages to write directly to the read model.

**DDD:** Read model is a separate projection of the domain events.  
**TDD:** Test that the read schema can be created and queried with the dedicated pool.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH1.27.1** [HUMAN] Finalise ADR‑004 and confirm the package structure (Option A or B).
- [ ] **PH1.27.2** [AGENT] Create `firm‑db‑read` package or subdirectory per ADR decision, with denormalised table definitions. File: `packages/layer2‑data/firm‑db‑read/` or `firm‑db‑schema/src/schemas/reporting/`.
- [ ] **PH1.27.3** [AGENT] Implement dedicated read‑only connection pool in `firm‑db‑client` and export a `readPool` helper. File: `packages/layer2‑data/firm‑db‑client/src/read‑pool.ts`.
- [ ] **PH1.27.4** [AGENT] Add ESLint rule `no‑direct‑read‑model‑write` that fails if any package other than outbox handlers writes to the read schema. (Already in PH1.13.4; verify.)
- [ ] **PH1.27.5** [AGENT] Write test verifying that a direct write from a feature package is blocked by lint. File: test fixture in `firm‑config‑eslint/`.

---

### PH1.28 – Extract `firm-rate-limiter` from `firm-security`
- [ ] **PH1.28** | Status: Not Started (Fix 2b)

**Related files:** `packages/layer3‑security/firm‑rate‑limiter/`, `packages/layer3‑security/firm‑security/`

**Definition of Done:**
- New package `firm-rate-limiter` at `packages/layer3‑security/firm‑rate‑limiter/` contains Redis sliding window, token bucket, plan‑tier‑aware limits, dry‑run mode, fail‑open behaviour.
- `firm-security` no longer contains rate‑limiting code; it imports from `firm-rate-limiter` if needed.
- Full test suite covers all modes.

**Out of Scope:** New rate‑limiting policies beyond the existing named policies; only extraction.

**Rules to Follow:** Package depends on `firm‑cache` and `firm‑env`; no circular deps.

**Advanced Coding Patterns:** Token bucket algorithm with dry‑run mode for production tuning.

**Anti-Patterns:** Do not leave rate‑limiter code in `firm-security`; CI must verify extraction is complete.

**DDD:** Rate limiting is a security domain service.  
**TDD:** Test sliding window with Redis mock, token bucket, dry‑run (records but doesn’t block), fail‑open (Redis down returns success).  
**BDD:** Behavior: when Redis is unreachable, the rate limiter allows the request and logs a critical alert.  
**Deep Module:** `firm-rate-limiter` encapsulates complex rate‑limiting algorithms behind a simple `consume(policyName, tenantId, tokens)` interface.

#### Subtasks
- [ ] **PH1.28.1** [AGENT] Scaffold `packages/layer3‑security/firm‑rate‑limiter/`.
- [ ] **PH1.28.2** [AGENT] Move all rate‑limiting logic from `firm-security` to `firm-rate-limiter/src/`. Implement sliding window and token bucket.
- [ ] **PH1.28.3** [AGENT] Implement dry‑run mode: when enabled, records would‑block events but never blocks. File: `firm-rate-limiter/src/dry‑run.ts`.
- [ ] **PH1.28.4** [AGENT] Implement fail‑open: when Redis is unreachable, log critical alert and allow request. File: `firm-rate-limiter/src/fail‑open.ts`.
- [ ] **PH1.28.5** [AGENT] Write full test suite covering sliding window, token bucket, dry‑run, fail‑open. File: `packages/layer3‑security/firm‑rate‑limiter/tests/`.
- [ ] **PH1.28.6** [AGENT] Update `firm-security` to remove rate‑limiting code and import from `firm-rate-limiter` if needed. File: `packages/layer3‑security/firm‑security/src/`.

---

### PH1.29 – Rename `firm-test-utils` to `firm-testing` and expand scope
- [ ] **PH1.29** | Status: Not Started (Fix 15)

**Related files:** `packages/testing/firm‑testing/` (renamed from `firm‑test‑utils`)

**Definition of Done:**
- Package renamed to `firm‑testing`.
- New harnesses added: `createUnitHarness()` (PGLite + ioredis‑mock), `createIntegrationHarness()` (real DB + Redis, isolated tenant lifecycle), `createE2eHarness()` (Playwright), `createTenantIsolationFixture()`, `mockAdapter<T extends Port>()`, `createOutboxHarness()`.
- All existing consumers updated.

**Out of Scope:** Actual test suites using these harnesses; only the harness implementations.

**Rules to Follow:** Harnesses must be reusable by any feature package without modification.

**Advanced Coding Patterns:** Factory functions that return isolated test environments with automatic cleanup.

**Anti-Patterns:** Do not hardcode test credentials; use ephemeral databases.

**DDD:** Testing infrastructure is a development concern.  
**TDD:** Write tests for the harnesses themselves to verify they set up and tear down correctly.  
**BDD:** [N/A]  
**Deep Module:** Harnesses encapsulate complex setup (PGLite, ioredis‑mock, tenant provisioning) behind a simple `createUnitHarness()` call.

#### Subtasks
- [ ] **PH1.29.1** [AGENT] Rename package directory from `firm‑test‑utils` to `firm‑testing` and update `package.json`.
- [ ] **PH1.29.2** [AGENT] Implement `createUnitHarness()` with PGLite and ioredis‑mock. File: `packages/testing/firm‑testing/src/harnesses/unit.ts`.
- [ ] **PH1.29.3** [AGENT] Implement `createIntegrationHarness()` with real DB and Redis, isolated tenant lifecycle. File: `packages/testing/firm‑testing/src/harnesses/integration.ts`.
- [ ] **PH1.29.4** [AGENT] Implement `createE2eHarness()` with Playwright config. File: `packages/testing/firm‑testing/src/harnesses/e2e.ts`.
- [ ] **PH1.29.5** [AGENT] Implement `createTenantIsolationFixture()` that sets up two tenants and provides cross‑visibility assertion helpers. File: `packages/testing/firm‑testing/src/fixtures/tenant‑isolation.ts`.
- [ ] **PH1.29.6** [AGENT] Implement `mockAdapter<T extends Port>()` for type‑safe mock creation. File: `packages/testing/firm‑testing/src/mocks/adapter.ts`.
- [ ] **PH1.29.7** [AGENT] Implement `createOutboxHarness()` that captures outbox events without real DB transactions. File: `packages/testing/firm‑testing/src/harnesses/outbox.ts`.
- [ ] **PH1.29.8** [AGENT] Update all import paths across the monorepo.

---

### PH1.30 – Add missing utilities to `firm-utils`
- [ ] **PH1.30** | Status: Not Started

**Related files:** `packages/layer1‑core/firm‑utils/src/`

**Definition of Done:**
- `retry<T>(fn, options)` with exponential backoff + jitter implemented.
- `sleep(ms)` helper added.
- `paginate(cursor, limit, direction)` pure pagination math function added.
- `hashIp` docs fixed (salt param described correctly).
- Unit tests for all new functions.

**Out of Scope:** Changing existing utility signatures.

**Rules to Follow:** All functions must be pure; no side effects (except `retry`'s timing).

**Advanced Coding Patterns:** Exponential backoff with full jitter for `retry`.

**Anti-Patterns:** Do not re‑implement `retry` logic in multiple packages; centralise here.

**DDD:** Utilities are technical building blocks, not domain.  
**TDD:** Test retry succeeds on 3rd attempt, fails after max attempts; test paginate edge cases.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH1.30.1** [AGENT] Implement `retry<T>(fn, options)` in `packages/layer1‑core/firm‑utils/src/retry.ts`.
- [ ] **PH1.30.2** [AGENT] Implement `sleep(ms)` in `packages/layer1‑core/firm‑utils/src/sleep.ts`.
- [ ] **PH1.30.3** [AGENT] Implement `paginate(cursor, limit, direction)` in `packages/layer1‑core/firm‑utils/src/paginate.ts`.
- [ ] **PH1.30.4** [AGENT] Fix `hashIp` JSDoc to accurately describe salt parameter.
- [ ] **PH1.30.5** [AGENT] Write unit tests. File: `packages/layer1‑core/firm‑utils/tests/`.

---

### PH1.31 – Add missing error helpers to `firm-errors`
- [ ] **PH1.31** | Status: Not Started

**Related files:** `packages/layer1‑core/firm‑errors/src/`

**Definition of Done:**
- `isRetryable(error): boolean` predicate implemented.
- `toTRPCError()` and `toHTTPResponse()` serialisation functions implemented.
- Unit tests.

**Out of Scope:** New error types beyond RFC 7807 hierarchy.

**Rules to Follow:** `isRetryable` must recognise error categories that warrant retry (timeouts, network errors, 429).

**Advanced Coding Patterns:** Predicate function on error base class.

**Anti-Patterns:** Do not hardcode HTTP status codes outside `toHTTPResponse`.

**DDD:** Errors are a technical cross‑cutting concern.  
**TDD:** Test that `isRetryable` returns true for `NetworkError` and false for `ValidationError`.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH1.31.1** [AGENT] Implement `isRetryable(error): boolean` in `packages/layer1‑core/firm‑errors/src/retryable.ts`.
- [ ] **PH1.31.2** [AGENT] Implement `toTRPCError()` in `packages/layer1‑core/firm‑errors/src/serialization.ts`.
- [ ] **PH1.31.3** [AGENT] Implement `toHTTPResponse()` in same file.
- [ ] **PH1.31.4** [AGENT] Write unit tests. File: `packages/layer1‑core/firm‑errors/tests/`.

---

### PH1.32 – Add missing crypto functions and remove `generateUUID`
- [ ] **PH1.32** | Status: Not Started

**Related files:** `packages/layer1‑core/firm‑crypto/src/`

**Definition of Done:**
- `generateSecureToken(bytes)` added.
- `encryptField` / `decryptField` for column‑level encryption added.
- `deriveKey(password, salt)` for per‑tenant key derivation added.
- `generateUUID` removed (duplicates `crypto.randomUUID()`).
- Unit tests for all new functions.

**Out of Scope:** Changing existing HMAC or TOTP implementations.

**Rules to Follow:** Use Web Crypto API; constant‑time operations where applicable.

**Advanced Coding Patterns:** AES‑GCM for field encryption with IV generation.

**Anti-Patterns:** Do not keep a redundant `generateUUID` that just wraps `crypto.randomUUID()`.

**DDD:** Crypto is a technical service.  
**TDD:** Test that encrypt/decrypt round‑trip works; test key derivation produces deterministic output for same inputs.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH1.32.1** [AGENT] Implement `generateSecureToken(bytes)` in `packages/layer1‑core/firm‑crypto/src/token.ts`.
- [ ] **PH1.32.2** [AGENT] Implement `encryptField` / `decryptField` using Web Crypto AES‑GCM. File: `packages/layer1‑core/firm‑crypto/src/encrypt.ts`.
- [ ] **PH1.32.3** [AGENT] Implement `deriveKey(password, salt)` using PBKDF2. File: `packages/layer1‑core/firm‑crypto/src/derive.ts`.
- [ ] **PH1.32.4** [AGENT] Remove `generateUUID` and update any callers to use `crypto.randomUUID()` directly.
- [ ] **PH1.32.5** [AGENT] Write unit tests. File: `packages/layer1‑core/firm‑crypto/tests/`.

---

### PH1.33 – Add secret format validation and `environment` export to `firm-env`
- [ ] **PH1.33** | Status: Not Started

**Related files:** `packages/layer1‑core/firm‑env/src/`

**Definition of Done:**
- Validators check secret formats (URL structure, key prefix/length), not just presence.
- `environment` export (`'development' | 'staging' | 'production'`) available for environment‑aware behaviour.

**Out of Scope:** New env var schemas; only enhancing existing ones.

**Rules to Follow:** Use Zod refinements for format checks.

**Advanced Coding Patterns:** N/A

**Anti-Patterns:** Do not throw on missing optional vars; only required ones.

**DDD:** [N/A]  
**TDD:** Test that malformed URLs or short keys cause validation failure.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH1.33.1** [AGENT] Add Zod refinements to existing env schemas for format validation. File: `packages/layer1‑core/firm‑env/src/schemas/`.
- [ ] **PH1.33.2** [AGENT] Export `environment` derived from `NODE_ENV`. File: `packages/layer1‑core/firm‑env/src/environment.ts`.
- [ ] **PH1.33.3** [AGENT] Write tests for invalid formats and environment export. File: `packages/layer1‑core/firm‑env/tests/`.

---

### PH1.34 – Enhance `firm-api-contracts` with missing functions
- [ ] **PH1.34** | Status: Not Started

**Related files:** `packages/layer2‑data/firm‑api‑contracts/src/`

**Definition of Done:**
- `deprecateEvent(name, version, sunsetDate)` implemented, with CI enforcement.
- `createWebhookPayloadSchema(eventSchema)` added for standard outbound webhook envelope.
- tRPC sub‑routers organised by domain (`leadsRouter`, `campaignsRouter`, etc.) created from day one.

**Out of Scope:** New event types; only infrastructure for event lifecycle.

**Rules to Follow:** Deprecated events must trigger CI warnings after sunset date.

**Advanced Coding Patterns:** Higher‑order function to wrap event schemas with webhook envelope (id, timestamp, signature).

**Anti-Patterns:** Do not allow unregistered events to be emitted.

**DDD:** API contracts are the shared kernel between services.  
**TDD:** Test that `deprecateEvent` registers the sunset date; test that `createWebhookPayloadSchema` produces a schema with required envelope fields.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH1.34.1** [AGENT] Implement `deprecateEvent(name, version, sunsetDate)` and integrate with the event registry. File: `packages/layer2‑data/firm‑api‑contracts/src/events/deprecation.ts`.
- [ ] **PH1.34.2** [AGENT] Implement `createWebhookPayloadSchema(eventSchema)` that wraps an event schema with a standard webhook envelope. File: `packages/layer2‑data/firm‑api‑contracts/src/webhooks/payload.ts`.
- [ ] **PH1.34.3** [AGENT] Create tRPC sub‑routers: `leadsRouter`, `campaignsRouter`, `bookingsRouter`, etc. File: `packages/layer2‑data/firm‑api‑contracts/src/routers/`.
- [ ] **PH1.34.4** [AGENT] Write unit tests for deprecation and webhook schema generation. File: `packages/layer2‑data/firm‑api‑contracts/tests/`.

---

### PH1.35 – Fix `firm-consent` bugs and add regulatory requirements
- [ ] **PH1.35** | Status: Not Started

**Related files:** `packages/layer3‑security/firm‑consent/src/`

**Definition of Done:**
- `gpcApplied` flag embedded in signed consent payload.
- Google Consent Mode v3 translation layer implemented (deadline Jun 15).
- TCF 2.2 consent string encoding added for EU programmatic ads.
- CNIL email tracking pixel suppression for EU users until explicit marketing opt‑in (deadline Jul 14).
- Tests verify all new functionality.

**Out of Scope:** Consent UI; only server‑side logic.

**Rules to Follow:** GPC header detection must override stored consent and cannot be overridden by banner.

**Advanced Coding Patterns:** Translation layer mapping internal `ConsentRecord` to Google’s `gtag('consent', 'update', {...})` format.

**Anti-Patterns:** Do not serve tracking pixels before consent is verified server‑side.

**DDD:** Consent is a domain service in the privacy bounded context.  
**TDD:** Test that GPC header forces `analytics=false` even if stored consent says `true`. Test that CNIL suppression prevents pixel rendering.  
**BDD:** Behavior: a user with GPC enabled never sees marketing cookies, even if they previously consented.  
**Deep Module:** `firm‑consent` encapsulates GDPR/CCPA complexity behind simple `hasConsent` and `consentGate` APIs.

#### Subtasks
- [ ] **PH1.35.1** [AGENT] Embed `gpcApplied` flag in the signed consent payload. File: `packages/layer3‑security/firm‑consent/src/cookie.ts`.
- [ ] **PH1.35.2** [AGENT] Implement Google Consent Mode v3 translation layer (`consentToGtag()`). File: `packages/layer3‑security/firm‑consent/src/gtag.ts`.
- [ ] **PH1.35.3** [AGENT] Implement TCF 2.2 consent string encoding. File: `packages/layer3‑security/firm‑consent/src/tcf.ts`.
- [ ] **PH1.35.4** [AGENT] Implement CNIL pixel suppression: for EU users without explicit marketing consent, tracking pixels must not be rendered. File: `packages/layer3‑security/firm‑consent/src/cnil.ts`.
- [ ] **PH1.35.5** [AGENT] Write comprehensive tests covering GPC override, GCM v3 mapping, TCF encoding, and CNIL suppression. File: `packages/layer3‑security/firm‑consent/tests/`.

---

### PH1.36 – Build CI pipeline and all enforcement scripts
- [ ] **PH1.36** | Status: Not Started

**Related files:** `.github/workflows/ci.yml`, `scripts/ci/`

**Definition of Done:**
- CI workflow runs on every PR: supply‑chain security, boundary check, type check, lint, unit/integration tests, event registry check, versioning check, RLS coverage, quota check, PII redaction, feature flag expiration, tag registry integrity, observability instrumentation, exports verification, AsyncAPI generation, schema build, adapter scaffolding verification.
- All scripts in `scripts/ci/` are implemented and tested.

**Out of Scope:** CD/release workflow (handled in PH1.37).

**Rules to Follow:** Any failure in any gate must block the PR.

**Advanced Coding Patterns:** Composite GitHub Actions to reuse enforcement scripts across workflows.

**Anti-Patterns:** Do not allow skip of enforcement gates without documented waiver.

**DDD:** [N/A]  
**TDD:** Each CI script must have a corresponding test that proves it catches violations.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH1.36.1** [AGENT] Create base CI workflow `.github/workflows/ci.yml` with stages: install deps, supply‑chain audit, boundary check, type check, lint, test, and all enforcement gates.
- [ ] **PH1.36.2** [AGENT] Build `scripts/ci/dep‑fence.ts` that walks the dependency graph and fails on layer violations.
- [ ] **PH1.36.3** [AGENT] Build `scripts/ci/event‑version‑check.ts` that scans `emitEvent()` calls and cross‑references the registry; fails on unregistered events or versions without handlers.
- [ ] **PH1.36.4** [AGENT] Build `scripts/ci/generate‑asyncapi.ts` (Gate 16) that reads the Event Registry and produces AsyncAPI 3.0 `asyncapi.yaml`, failing if any event lacks a channel definition.
- [ ] **PH1.36.5** [AGENT] Build `scripts/ci/schema‑build.ts` that produces `contracts/v1/openapi.json`, `asyncapi.yaml`, `events.schema.json`; fails if committed artifacts don’t match generated.
- [ ] **PH1.36.6** [AGENT] Build `scripts/ci/rls‑coverage‑check.ts` that queries `pg_tables` for RLS status and runs sibling/parent isolation tests.
- [ ] **PH1.36.7** [AGENT] Build `scripts/ci/feature‑flag‑expiration.ts` that scans flag definitions and fails build if any temporary flag has expired.
- [ ] **PH1.36.8** [AGENT] Build `scripts/ci/tag‑registry‑integrity.ts` that verifies all third‑party scripts are registered, consented, and SRI‑hashed.
- [ ] **PH1.36.9** [AGENT] Build `scripts/ci/observability‑instrumentation‑check.ts` that AST‑checks for `initializeObservability()` in every entry point.
- [ ] **PH1.36.10** [AGENT] Build `scripts/ci/exports‑verification.ts` that ensures no import of unlisted internal paths.
- [ ] **PH1.36.11** [AGENT] Build `scripts/ci/adapter‑scaffolding‑verification.ts` that checks every adapter was generated by the scaffolding tool (Gate 13).
- [ ] **PH1.36.12** [AGENT] Configure supply‑chain security gate: `npm audit` (fail on high/critical CVEs) and license scanner (reject GPL for SaaS).
- [ ] **PH1.36.13** [AGENT] Configure branch protection rules (4 pre‑merge gates) requiring status checks.
- [ ] **PH1.36.14** [AGENT] Build PII redaction CI test that feeds known PII through logger and greps output for plaintext values.

---

### PH1.37 – Set up release workflow with SLSA provenance
- [ ] **PH1.37** | Status: Not Started

**Related files:** `.github/workflows/release.yml`

**Definition of Done:**
- Release workflow triggers on version tags, builds all packages, generates SLSA provenance, and publishes to npm registry.
- Workflow tested with a dry‑run.

**Out of Scope:** Actual release to production; only the pipeline.

**Rules to Follow:** Follow SLSA Level 3 requirements.

**Advanced Coding Patterns:** Use GitHub’s `slsa-framework/slsa-github-generator`.

**Anti-Patterns:** Do not publish without provenance.

**DDD:** [N/A]  
**TDD:** Test the workflow by running it on a test tag.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH1.37.1** [AGENT] Create `.github/workflows/release.yml` with SLSA provenance generation.
- [ ] **PH1.37.2** [HUMAN] Test the workflow with a prerelease tag to ensure it publishes correctly.

---

### PH1.38 – Create `local-dev/` Docker Compose stack
- [ ] **PH1.38** | Status: Not Started

**Related files:** `local‑dev/docker‑compose.yml`

**Definition of Done:**
- `docker‑compose.yml` provides PostgreSQL (with RLS enabled), Redis, and any other required services for local development.
- Readme explains how to start and seed the environment.

**Out of Scope:** Production‑grade infrastructure; only local development.

**Rules to Follow:** Services must be configured with the same versions as production where possible.

**Advanced Coding Patterns:** Health checks for each service in the compose file.

**Anti-Patterns:** Do not use `latest` tags; pin versions.

**DDD:** [N/A]  
**TDD:** Test that `docker compose up` results in healthy PostgreSQL and Redis.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH1.38.1** [AGENT] Create `local‑dev/docker‑compose.yml` with PostgreSQL (RLS enabled), Redis, and health checks.
- [ ] **PH1.38.2** [AGENT] Write `local‑dev/README.md` with startup and seeding instructions.

---

### PH1.39 – Create `load-tests/` directory and baseline k6 scenarios
- [ ] **PH1.39** | Status: Not Started

**Related files:** `load‑tests/`

**Definition of Done:**
- `load‑tests/` directory contains k6 TypeScript scenarios: outbox throughput under 10k events/minute, tenant isolation under concurrent load (no cross‑tenant data leak), and rate‑limit holding (limits enforced under load).
- All scenarios pass against a local environment.

**Out of Scope:** CI integration; manual run for now.

**Rules to Follow:** Use `firm‑config‑k6` for shared configuration.

**Advanced Coding Patterns:** k6 checks and thresholds for pass/fail criteria.

**Anti-Patterns:** Do not hardcode test tenant IDs; generate per run.

**DDD:** [N/A]  
**TDD:** Each scenario must have defined thresholds (e.g., outbox lag < 60s).  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH1.39.1** [AGENT] Create `load‑tests/` directory structure.
- [ ] **PH1.39.2** [AGENT] Write k6 scenario: outbox throughput (`load‑tests/outbox‑throughput.ts`).
- [ ] **PH1.39.3** [AGENT] Write k6 scenario: tenant isolation under concurrent load (`load‑tests/tenant‑isolation.ts`).
- [ ] **PH1.39.4** [AGENT] Write k6 scenario: rate‑limit holding (`load‑tests/rate‑limit.ts`).
- [ ] **PH1.39.5** [AGENT] Add README with run instructions.

---

### PH1.40 – Create `chaos/` directory and Toxiproxy scenarios
- [ ] **PH1.40** | Status: Not Started

**Related files:** `chaos/`

**Definition of Done:**
- `chaos/` directory contains Toxiproxy scenarios: Redis‑down (rate limiter fails open), outbox worker crash (exactly‑once delivery), PgBouncer eviction (cross‑tenant leak safety).
- All scenarios verified manually.

**Out of Scope:** Automated chaos in CI; manual execution only.

**Rules to Follow:** The PgBouncer eviction scenario is the highest‑severity vulnerability; must be executed before any EU client is onboarded.

**Advanced Coding Patterns:** Toxiproxy HTTP API to inject faults.

**Anti-Patterns:** Do not run chaos scenarios against production without explicit approval.

**DDD:** [N/A]  
**TDD:** Each scenario must assert the expected resilience behaviour.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH1.40.1** [AGENT] Create `chaos/` directory structure with Toxiproxy configuration.
- [ ] **PH1.40.2** [AGENT] Write scenario: Redis‑down → rate limiter fails open (`chaos/redis‑down.ts`).
- [ ] **PH1.40.3** [AGENT] Write scenario: outbox worker crash → exactly‑once delivery (`chaos/outbox‑crash.ts`).
- [ ] **PH1.40.4** [AGENT] Write scenario: PgBouncer eviction → no cross‑tenant data leak (`chaos/pgbouncer‑eviction.ts`).
- [ ] **PH1.40.5** [AGENT] Add README with execution instructions and safety warnings.

---

### PH1.41 – Build adapter scaffolding generator
- [ ] **PH1.41** | Status: Not Started

**Related files:** `tools/generators/adapter/`

**Definition of Done:**
- `pnpm turbo gen adapter` scaffolds a new adapter package with uniform structure: `implements Port`, lazy client init, transform functions, webhook verify‑deduplicate‑process, error mapping, Prometheus metrics, stub, and conformance test.
- CI Gate 13 enforces that all adapters are scaffolded (see PH1.36.11).

**Out of Scope:** Building the adapters themselves; only the generator.

**Rules to Follow:** Generator must produce code that passes all Layer 7 rules.

**Advanced Coding Patterns:** Plop or custom script generating package directories from templates.

**Anti-Patterns:** Do not allow hand‑authored adapters to bypass the generator.

**DDD:** [N/A]  
**TDD:** Test that a generated adapter compiles and passes the conformance test.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH1.41.1** [AGENT] Set up generator tool in `tools/generators/adapter/` using Plop or a similar scaffolder.
- [ ] **PH1.41.2** [AGENT] Create template files for adapter package, stub, conformance test, and `package.json`.
- [ ] **PH1.41.3** [AGENT] Implement the generator script that accepts category and provider name as arguments.
- [ ] **PH1.41.4** [AGENT] Write a test that generates a dummy adapter, compiles it, and runs its conformance test.

---

### PH1.42 – Partition `infra/` into regional structure
- [ ] **PH1.42** | Status: Not Started

**Related files:** `infra/`

**Definition of Done:**
- `infra/` is partitioned into `infra/regions/us‑east‑1/`, `infra/regions/eu‑west‑1/`, and `infra/shared/` (Cloudflare, monitoring).
- README explains the regional layout and data residency enforcement.

**Out of Scope:** Actual infrastructure provisioning (Terraform/Pulumi); only directory structure and README.

**Rules to Follow:** Follow GDPR Art. 32 and Art. 51f for data residency markings.

**Advanced Coding Patterns:** N/A

**Anti-Patterns:** Do not place EU‑specific configuration in the global shared directory.

**DDD:** [N/A]  
**TDD:** [N/A]  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH1.42.1** [AGENT] Create `infra/regions/us‑east‑1/`, `infra/regions/eu‑west‑1/`, and `infra/shared/` directories with placeholder files.
- [ ] **PH1.42.2** [AGENT] Write `infra/README.md` describing regional partitioning, data residency rules, and how to add new regions.

---

Phase 2 of the updated TODO.md follows. Each parent task is small, contains all required sections, and uses the unique ID and indicator conventions established in Phase 1.

---

## Phase 2: Infrastructure Foundation

*All 17 Tier A backbone packages plus the SDK. Every business capability depends on this layer. Build strictly in dependency order; no package may start until its prerequisites are complete and the corresponding ADR (if any) is accepted.*

---

### PH2.1 – Build `firm-bus` (event bus, outbox processor, cron, sagas)
- [ ] **PH2.1** | Status: Not Started

**Related files:** `packages/layer6-features/firm-bus/`

**Definition of Done:**
- Implements transactional outbox reader: polls `outbox_events` where `status='pending'` and `nextAttemptAt <= now()`, dispatches to handlers, marks completed on success, increments attempts and schedules retry with exponential backoff on failure, moves to dead‑letter after max attempts.
- Supports cron‑style scheduled jobs via recurring event emission.
- Saga orchestrator: each step is idempotent with compensating action; saga state persisted in `saga_instances` table (defined in `firm-db-schema`). Durable execution handles step failure, retry, and compensation.
- Execution model determined by ADR‑001 (Inngest or custom). If Inngest, package wraps Inngest client; if custom, implements the polling loop.
- All worker code lives in `workers/outbox-processor/` but the bus logic lives in the package.
- Tests: outbox delivery at least once, idempotency (duplicate event does not repeat side effect), retry/backoff, dead‑letter queue, saga compensation.

**Out of Scope:** Actual workers (they are in Phase 11); only the bus library and its interface.

**Rules to Follow:**
- Must use `firm-db-client` for DB access.
- Events carry `version`; handlers declare `acceptsVersions`. CI already verifies this (Phase 1); runtime must also validate.
- Outbox events include `idempotencyKey`; handlers check before processing.
- All async work is initiated from this bus; feature packages never poll the outbox directly.

**Advanced Coding Patterns:**
- If custom: polling loop with `FOR UPDATE SKIP LOCKED` to prevent duplicate processing across workers.
- Saga pattern with step compensation registration.
- `EventRouter` mapping event types to handler arrays.

**Anti-Patterns:**
- Do not let feature packages directly read from `outbox_events` table.
- Do not use `setInterval` for polling (use recursive `setTimeout` or a worker framework).
- Never skip idempotency check.

**DDD:** The bus is the backbone of event‑driven communication; it is an infrastructure service.  
**TDD:** Write tests for: successful delivery, idempotency, retry with backoff, dead‑letter after max attempts, saga step failure triggering compensation.  
**BDD:** Behavior: emitting an event within a transaction persists it atomically; the bus picks it up and dispatches to all registered handlers.  
**Deep Module:** `firm-bus` encapsulates all outbox polling, retry logic, and saga coordination behind a simple `emitEvent()` and `registerHandler()` API.

#### Subtasks
- [ ] **PH2.1.1** [HUMAN] Confirm ADR‑001 decision and document chosen execution model (Inngest or custom). File: `docs/adr/0001-firm-bus-engine.md`.
- [ ] **PH2.1.2** [AGENT] Create package scaffold: `packages/layer6-features/firm-bus/`.
- [ ] **PH2.1.3** [AGENT] Implement `OutboxReader` class that polls `outbox_events`, dispatches to handlers, handles completion, retry, and dead‑letter queue. File: `packages/layer6-features/firm-bus/src/outbox/reader.ts`.
- [ ] **PH2.1.4** [AGENT] Implement `EventRouter` that maps `(eventType, version)` to an array of handlers. File: `packages/layer6-features/firm-bus/src/router.ts`.
- [ ] **PH2.1.5** [AGENT] Implement idempotency guard that checks `idempotencyKey` before processing. File: `packages/layer6-features/firm-bus/src/idempotency.ts`.
- [ ] **PH2.1.6** [AGENT] Implement saga orchestrator: `createSaga(steps)` with compensation registration and durable state. File: `packages/layer6-features/firm-bus/src/saga.ts`.
- [ ] **PH2.1.7** [AGENT] Implement cron scheduler: register recurring events with a cron expression, emit them via outbox. File: `packages/layer6-features/firm-bus/src/cron.ts`.
- [ ] **PH2.1.8** [AGENT] Write integration tests covering outbox delivery, idempotency, retry/backoff, dead‑letter, saga compensation. File: `packages/layer6-features/firm-bus/tests/`.

---

### PH2.2 – Build `firm-flags` (feature flags with expiration enforcement)
- [ ] **PH2.2** | Status: Not Started

**Related files:** `packages/layer6-features/firm-flags/`

**Definition of Done:**
- Exports `isFeatureEnabled(flagName, tenantId)`, `getAllFlags(tenantId)`, `createFlag(definition)`.
- Flag definitions include mandatory `expiresAt` (UTC timestamp) for temporary flags; permanent flags use a `never` marker.
- Redis‑backed cache with DB fallback; circuit‑breaker behaviour when Redis is unreachable (return `defaultValue`).
- CI expiration check (Phase 1) already enforces that expired temporary flags break build; runtime also enforces (expired flag returns `false`).
- Tests: flag evaluation, expiration, Redis‑down graceful degradation, plan‑gated flags.

**Out of Scope:** Admin UI for flag management; only the evaluation API.

**Rules to Follow:**
- All flag reads go through `firm-flags`; no direct DB reads.
- Expired temporary flags must return `false` and emit a warning log.
- Must import from `firm-db-client` and `firm-cache`.

**Advanced Coding Patterns:**
- Circuit breaker for Redis that returns `defaultValue` when the cache is down.
- Flag definition registry with runtime validation.

**Anti-Patterns:**
- Do not leave expired temporary flags in the codebase; CI prevents this, but runtime defense must also exist.
- Do not cache flags indefinitely; respect TTL.

**DDD:** Feature flags are a supporting domain service.  
**TDD:** Test flag evaluation, expiration, Redis‑down fallback, plan‑gated flag returning default for non‑matching plan.  
**BDD:** Behavior: a temporary flag past its `expiresAt` always returns `false`, regardless of stored value.  
**Deep Module:** `firm-flags` hides caching, DB, and plan evaluation behind `isFeatureEnabled`.

#### Subtasks
- [ ] **PH2.2.1** [AGENT] Create package scaffold: `packages/layer6-features/firm-flags/`.
- [ ] **PH2.2.2** [AGENT] Implement flag definition and registry: `createFlag(name, defaultValue, expiresAt?, planGate?)`. File: `packages/layer6-features/firm-flags/src/registry.ts`.
- [ ] **PH2.2.3** [AGENT] Implement `isFeatureEnabled(flagName, tenantId)` with Redis cache‑first, DB fallback, circuit breaker. File: `packages/layer6-features/firm-flags/src/evaluate.ts`.
- [ ] **PH2.2.4** [AGENT] Implement `getAllFlags(tenantId)` that returns a map of all flags and their current values.
- [ ] **PH2.2.5** [AGENT] Implement expiration enforcement: if `expiresAt <= now()`, return `false` and log warning. File: `packages/layer6-features/firm-flags/src/expiration.ts`.
- [ ] **PH2.2.6** [AGENT] Write unit and integration tests. File: `packages/layer6-features/firm-flags/tests/`.

---

### PH2.3 – Build `firm-metering` (full usage counter aggregation, quota enforcement API)
- [ ] **PH2.3** | Status: Not Started

**Related files:** `packages/layer6-features/firm-metering/`

**Definition of Done:**
- Extends the Phase 1 stub (`checkQuota`) with full aggregation pipeline.
- `recordUsage(tenantId, dimension, amount)` stores meter events in outbox; a dedicated handler aggregates into Redis counters.
- Periodic flush to DB for billing/quota persistence.
- `getUsageSummary(tenantId, period)` returns usage per dimension.
- 80% quota warning event fires automatically.
- All metered operations in feature packages must be preceded by `checkQuota()` (CI gate from Phase 1 enforces this).
- Tests: quota enforcement, aggregation, 80% warning, period summary.

**Out of Scope:** Invoicing logic (that’s `firm-billing`); only usage data.

**Rules to Follow:**
- `checkQuota()` must reject before the operation; `recordUsage()` records after success.
- Redis counters are the source of truth for quota checks; DB is the long‑term store.
- Must emit events: `metering.quota.warning`, `metering.quota.exceeded`, `metering.usage.recorded`.

**Advanced Coding Patterns:**
- Write‑behind caching: usage increments go to Redis immediately; periodic worker aggregates and writes to DB.
- Event‑driven aggregation via `firm-bus`.

**Anti-Patterns:**
- Do not allow `recordUsage()` to bypass `checkQuota()`.
- Do not skip the 80% warning event.

**DDD:** Metering is a supporting domain service.  
**TDD:** Test that exceeding quota throws `QuotaExceeded`; test that 80% usage triggers warning event; test that `getUsageSummary` returns correct aggregates.  
**BDD:** Behavior: a tenant with 90% of their lead quota cannot create a new lead.  
**Deep Module:** `firm-metering` encapsulates Redis counters and quota logic behind `checkQuota` and `recordUsage`.

#### Subtasks
- [ ] **PH2.3.1** [AGENT] Extend existing `firm-metering` package with aggregation handler. File: `packages/layer6-features/firm-metering/src/aggregation.ts`.
- [ ] **PH2.3.2** [AGENT] Implement `recordUsage()` that writes a meter event to outbox. File: `packages/layer6-features/firm-metering/src/record.ts`.
- [ ] **PH2.3.3** [AGENT] Implement handler that consumes meter events, increments Redis counters, and checks for 80% threshold. File: `packages/layer6-features/firm-metering/src/handler.ts`.
- [ ] **PH2.3.4** [AGENT] Implement periodic flush worker logic (will be deployed as a worker in Phase 11). File: `packages/layer6-features/firm-metering/src/flush.ts`.
- [ ] **PH2.3.5** [AGENT] Implement `getUsageSummary(tenantId, period)`. File: `packages/layer6-features/firm-metering/src/query.ts`.
- [ ] **PH2.3.6** [AGENT] Write comprehensive tests for aggregation, quota warning, and summary. File: `packages/layer6-features/firm-metering/tests/`.

---

### PH2.4 – Build `firm-audit` (immutable, cryptographically chained audit log)
- [ ] **PH2.4** | Status: Not Started

**Related files:** `packages/layer6-features/firm-audit/`

**Definition of Done:**
- Exports `recordAuditEntry(tenantId, action, resource, metadata)` that writes an append‑only entry with a cryptographic hash chain (each entry has `previousHash`).
- `queryAuditLog(tenantId, filters)` returns paginated, verifiable audit trail.
- `exportAuditLog(tenantId, format)` exports for compliance reviews.
- All write operations in feature packages that affect business data must be audited via `firm-bus` event handler.
- Tests: immutability (entry cannot be modified), chain integrity (hash chain valid), query and export.

**Out of Scope:** Real‑time audit alerts; only storage and retrieval.

**Rules to Follow:**
- Audit entries are immutable; no update or delete operations on the audit table.
- Hash chain uses HMAC‑SHA256 with a per‑tenant secret to prevent tampering.
- Must use `firm-db-client` for storage.

**Advanced Coding Patterns:**
- Cryptographic hash chain (blockchain‑lite) for tamper detection.
- Use `firm-crypto` for HMAC.

**Anti-Patterns:**
- Do not allow direct writes to the audit table outside of `firm-audit`.
- Do not include PII in audit entries unless required by regulation (and then encrypt it).

**DDD:** Audit log is a supporting domain service.  
**TDD:** Test that a recorded entry has a valid hash chain; test that modifying a past entry breaks chain verification.  
**BDD:** Behavior: any privileged action is recorded and cannot be deleted.  
**Deep Module:** `firm-audit` provides a simple `recordAuditEntry` API that guarantees tamper‑proof records.

#### Subtasks
- [ ] **PH2.4.1** [AGENT] Create package scaffold: `packages/layer6-features/firm-audit/`.
- [ ] **PH2.4.2** [AGENT] Implement `recordAuditEntry(tenantId, action, resource, metadata)` with hash chain. File: `packages/layer6-features/firm-audit/src/record.ts`.
- [ ] **PH2.4.3** [AGENT] Implement `queryAuditLog(tenantId, filters)` with pagination. File: `packages/layer6-features/firm-audit/src/query.ts`.
- [ ] **PH2.4.4** [AGENT] Implement `exportAuditLog(tenantId, format)` for CSV/JSON download. File: `packages/layer6-features/firm-audit/src/export.ts`.
- [ ] **PH2.4.5** [AGENT] Implement audit event handler: subscribes to all `*.audit` events and persists them. File: `packages/layer6-features/firm-audit/src/handler.ts`.
- [ ] **PH2.4.6** [AGENT] Write tests for immutability, chain verification, query, and export. File: `packages/layer6-features/firm-audit/tests/`.

---

### PH2.5 – Build `firm-i18n` (internationalisation: locales, formatting, RTL)
- [ ] **PH2.5** | Status: Not Started

**Related files:** `packages/layer6-features/firm-i18n/`

**Definition of Done:**
- Provides translation key lookup (`t(key, locale, vars)`) backed by JSON resource files.
- Locale‑aware formatting: dates (timezone‑aware), numbers, currencies, addresses.
- RTL support utilities (e.g., `isRTL(locale)`, direction hooks).
- ICU MessageFormat pluralisation.
- Locale detection from request context.
- Tests: translation loading, fallback to default locale, formatting edge cases.

**Out of Scope:** Translation management UI; only the runtime library.

**Rules to Follow:**
- Translations must be tree‑shakeable; only load requested locale.
- Must use `firm-request-context` to determine current locale.
- Date formatting must respect the tenant’s timezone (from `firm-tenant-config`).

**Advanced Coding Patterns:**
- Nested JSON keys with dot‑notation lookup.
- ICU MessageFormat for pluralisation and gender.

**Anti-Patterns:**
- Do not hardcode locale strings; always use the `t()` function.
- Do not assume all locales are LTR.

**DDD:** i18n is a supporting domain service.  
**TDD:** Test that `t('greeting', { name: 'Alice' })` returns the correct string for each locale; test fallback when key missing; test pluralisation rules.  
**BDD:** Behavior: switching locale changes all displayed strings.  
**Deep Module:** `firm-i18n` encapsulates locale resource loading and formatting behind a single `t()` function.

#### Subtasks
- [ ] **PH2.5.1** [AGENT] Create package scaffold: `packages/layer6-features/firm-i18n/`.
- [ ] **PH2.5.2** [AGENT] Implement translation key registry and `t(key, locale, vars)` function. File: `packages/layer6-features/firm-i18n/src/translate.ts`.
- [ ] **PH2.5.3** [AGENT] Implement locale‑aware formatting for dates, numbers, currencies, and addresses. File: `packages/layer6-features/firm-i18n/src/format.ts`.
- [ ] **PH2.5.4** [AGENT] Implement RTL utilities: `isRTL(locale)`, `getDirection(locale)`. File: `packages/layer6-features/firm-i18n/src/rtl.ts`.
- [ ] **PH2.5.5** [AGENT] Implement ICU MessageFormat pluralisation via `intl-messageformat`. File: `packages/layer6-features/firm-i18n/src/icu.ts`.
- [ ] **PH2.5.6** [AGENT] Write tests for all functions. File: `packages/layer6-features/firm-i18n/tests/`.

---

### PH2.6 – Build `firm-template-engine` (template rendering with versioning)
- [ ] **PH2.6** | Status: Not Started

**Related files:** `packages/layer6-features/firm-template-engine/`

**Definition of Done:**
- Supports two template languages per ADR‑008: Liquid for email/SMS, Handlebars for PDF.
- Templates are versioned (schema `templateVersions` table).
- `renderTemplate(templateId, version, variables, locale)` returns rendered string.
- Preview API: `renderPreview(templateId, draftVariables)` without persisting version.
- Locale‑aware via `firm-i18n`.
- Tests: rendering with variables, version resolution, locale fallback, missing variable errors.

**Out of Scope:** Template management UI; only rendering engine.

**Rules to Follow:**
- Templates are stored in DB (managed by `firm-tenant-config` or a dedicated schema).
- Versioning: each change creates a new version; rendering can request a specific version or "latest".
- Must use `firm-i18n` for locale formatting inside templates.

**Advanced Coding Patterns:**
- Liquid parser with custom filters (e.g., `date_format`, `currency`).
- Handlebars with layout inheritance for PDF documents.

**Anti-Patterns:**
- Do not allow arbitrary code execution in templates; escape all variables.
- Do not mix template languages in the same template.

**DDD:** Template engine is a supporting domain service.  
**TDD:** Test rendering with provided variables; test that missing variable throws a clear error; test version selection.  
**BDD:** Behavior: a welcome email template renders the recipient’s name and a formatted date.  
**Deep Module:** `firm-template-engine` abstracts the choice of template language and versioning behind `renderTemplate`.

#### Subtasks
- [ ] **PH2.6.1** [AGENT] Confirm ADR‑008 and document the chosen libraries. File: `docs/adr/0008-template-engine-choice.md`.
- [ ] **PH2.6.2** [AGENT] Create package scaffold: `packages/layer6-features/firm-template-engine/`.
- [ ] **PH2.6.3** [AGENT] Implement Liquid renderer (using a Liquid library) with custom filters. File: `packages/layer6-features/firm-template-engine/src/liquid.ts`.
- [ ] **PH2.6.4** [AGENT] Implement Handlebars renderer with PDF‑specific helpers. File: `packages/layer6-features/firm-template-engine/src/handlebars.ts`.
- [ ] **PH2.6.5** [AGENT] Implement template version resolution: `renderTemplate(templateId, versionOrLatest, variables, locale)`. File: `packages/layer6-features/firm-template-engine/src/render.ts`.
- [ ] **PH2.6.6** [AGENT] Implement preview mode that renders without persisting a version. File: `packages/layer6-features/firm-template-engine/src/preview.ts`.
- [ ] **PH2.6.7** [AGENT] Write tests. File: `packages/layer6-features/firm-template-engine/tests/`.

---

### PH2.7 – Build `firm-media` (file storage, image processing, CDN)
- [ ] **PH2.7** | Status: Not Started

**Related files:** `packages/layer6-features/firm-media/`

**Definition of Done:**
- Exports `uploadFile(tenantId, file, options)`, `getFileUrl(key, transformation?)`, `deleteFile(key)`.
- Uses `StoragePort` adapter (initially `adapter-storage-local`, later S3/R2).
- Image transformation pipeline: generates WebP/AVIF variants and `srcset` via sharp or similar.
- Deduplication by content hash.
- CDN cache invalidation (emits `media.cache.invalidate` event).
- Tenant‑scoped path prefix: `/{tenantId}/...`.
- Enforces storage quota via `firm-metering.checkQuota()` before upload.

**Out of Scope:** Media library UI; only the API.

**Rules to Follow:**
- All file access must be through `firm-media`, never direct adapter calls.
- Metadata stripping (EXIF) on upload for privacy.
- Must use `firm-cache` for URL signing.

**Advanced Coding Patterns:**
- Image processing pipeline with configurable quality/formats.
- Presigned URLs for secure uploads/downloads.

**Anti-Patterns:**
- Do not serve user‑uploaded files from the application server; always use CDN/storage URLs.
- Do not skip quota check.

**DDD:** Media is a supporting domain service.  
**TDD:** Test upload with tenant scoping, transformation, deduplication, quota enforcement.  
**BDD:** Behavior: uploading the same image twice stores it once and returns the same key.  
**Deep Module:** `firm-media` hides storage provider and transformation complexity behind `uploadFile` and `getFileUrl`.

#### Subtasks
- [ ] **PH2.7.1** [AGENT] Create package scaffold: `packages/layer6-features/firm-media/`.
- [ ] **PH2.7.2** [AGENT] Implement `uploadFile(tenantId, file, options)` with content hash dedup, metadata stripping, and quota check. File: `packages/layer6-features/firm-media/src/upload.ts`.
- [ ] **PH2.7.3** [AGENT] Implement image transformation pipeline (WebP/AVIF, `srcset` generation). File: `packages/layer6-features/firm-media/src/transform.ts`.
- [ ] **PH2.7.4** [AGENT] Implement `getFileUrl(key, transformation?)` that generates a presigned URL or CDN URL. File: `packages/layer6-features/firm-media/src/url.ts`.
- [ ] **PH2.7.5** [AGENT] Implement `deleteFile(key)` and CDN invalidation event. File: `packages/layer6-features/firm-media/src/delete.ts`.
- [ ] **PH2.7.6** [AGENT] Write integration tests with `adapter-storage-local`. File: `packages/layer6-features/firm-media/tests/`.

---

### PH2.8 – Build `firm-tenant-config` (per‑tenant configuration resolution)
- [ ] **PH2.8** | Status: Not Started

**Related files:** `packages/layer6-features/firm-tenant-config/`

**Definition of Done:**
- Exports `getTenantConfig(tenantId)` that resolves branding, features, SEO, consent settings via cache → DB → defaults.
- `mergeWithDefaults(tenantConfig, planDefaults)` applies plan‑specific defaults.
- Configuration versioning: every write creates a new version; `rollback(tenantId, version)` supported up to 5 versions.
- Emits `tenant-config.updated` event for CDN and theme cache invalidation.
- `isFeatureEnabled(flag, tenantId)` delegates to `firm-flags` but adds tenant‑level overrides.
- `getPlanLimit(tenantId, capability)` returns the effective limit considering plan defaults and overrides.
- Theme resolution: `resolveTheme(baseTokens, overrides)` produces a validated theme object (contrast check per WCAG AA).
- `getSeoSettings(tenantId)` returns global SEO defaults for the tenant.

**Out of Scope:** Feature flag definitions themselves (in `firm-flags`). Actual CDN purge (handled by a worker subscribing to the event).

**Rules to Follow:**
- All writes must be audited via `firm-audit`.
- Theme contrast must be validated (WCAG AA) before write; reject inaccessible combinations.
- Cache invalidation after write.

**Advanced Coding Patterns:**
- Deep merge for theme overrides.
- Versioning with rollback using a history table.

**Anti-Patterns:**
- Do not allow direct mutation of config without audit trail.
- Do not store secrets in tenant config; use `firm-env` for secrets.

**DDD:** Tenant config is an aggregate root in the tenant management bounded context.  
**TDD:** Test cache hit/miss, merge with defaults, write and versioning, rollback, theme contrast validation, feature flag override.  
**BDD:** Behavior: upgrading a tenant’s plan immediately updates their feature limits without requiring a restart.  
**Deep Module:** `firm-tenant-config` hides caching, plan merging, and versioning behind `getTenantConfig` and `updateTenantConfig`.

#### Subtasks
- [ ] **PH2.8.1** [AGENT] Create package scaffold: `packages/layer6-features/firm-tenant-config/`.
- [ ] **PH2.8.2** [AGENT] Implement `getTenantConfig(tenantId)` with cache→DB→defaults resolution. File: `packages/layer6-features/firm-tenant-config/src/retrieve.ts`.
- [ ] **PH2.8.3** [AGENT] Implement `mergeWithDefaults(tenantConfig, planDefaults)`. File: `packages/layer6-features/firm-tenant-config/src/merge.ts`.
- [ ] **PH2.8.4** [AGENT] Implement config write with versioning and audit. File: `packages/layer6-features/firm-tenant-config/src/write.ts`.
- [ ] **PH2.8.5** [AGENT] Implement `rollback(tenantId, version)`. File: `packages/layer6-features/firm-tenant-config/src/rollback.ts`.
- [ ] **PH2.8.6** [AGENT] Implement `isFeatureEnabled(flag, tenantId)` with tenant‑level override layer. File: `packages/layer6-features/firm-tenant-config/src/features.ts`.
- [ ] **PH2.8.7** [AGENT] Implement `getPlanLimit(tenantId, capability)`. File: `packages/layer6-features/firm-tenant-config/src/limits.ts`.
- [ ] **PH2.8.8** [AGENT] Implement `resolveTheme(baseTokens, overrides)` with WCAG AA contrast check. File: `packages/layer6-features/firm-tenant-config/src/theme.ts`.
- [ ] **PH2.8.9** [AGENT] Implement `getSeoSettings(tenantId)`. File: `packages/layer6-features/firm-tenant-config/src/seo.ts`.
- [ ] **PH2.8.10** [AGENT] Write comprehensive tests. File: `packages/layer6-features/firm-tenant-config/tests/`.

---

### PH2.9 – Build `firm-payments` (Stripe checkout and webhook handling)
- [ ] **PH2.9** | Status: Not Started

**Related files:** `packages/layer6-features/firm-payments/`

**Definition of Done:**
- Exports `createCheckoutSession(tenantId, items, successUrl, cancelUrl)`, `handleStripeWebhook(rawBody, signature)`.
- Webhook processing: constant‑time signature verification, idempotency check via `stripeEventId`, then delegates to internal event handler (emits `payment.succeeded`, `payment.failed`, etc.).
- Payment method management: `listPaymentMethods(customerId)`, `attachPaymentMethod(customerId, pmId)`.
- Split payment support: a single checkout can split funds between platform and connected accounts (Stripe Connect).
- All operations audited via `firm-audit`.
- Uses `stripe` adapter behind `PaymentsPort` (or directly via Stripe SDK if adapter not yet built; adapters phase can refactor).
- Tests: successful checkout creation, webhook signature verification, idempotency, error handling.

**Out of Scope:** Subscription lifecycle (that's `firm-subscriptions`). Actual invoicing (`firm-billing`).

**Rules to Follow:**
- Webhook handler must follow verify‑then‑deduplicate‑then‑process.
- Never trust parsed payload for signature verification; use raw body.
- Must use `firm-metering` for payment volume metrics.

**Advanced Coding Patterns:**
- Stripe webhook signature verification using `stripe.webhooks.constructEvent`.
- Idempotency key from `stripeEventId` to prevent duplicate processing.

**Anti-Patterns:**
- Do not store raw card numbers; use Stripe’s tokenization.
- Do not process a webhook without signature verification.

**DDD:** Payments is a domain service in the revenue bounded context.  
**TDD:** Test checkout session creation, webhook with valid and invalid signatures, duplicate webhook idempotency.  
**BDD:** Behavior: a successful payment triggers `payment.succeeded` event and updates the invoice.  
**Deep Module:** `firm-payments` encapsulates Stripe integration behind simple methods.

#### Subtasks
- [ ] **PH2.9.1** [AGENT] Create package scaffold: `packages/layer6-features/firm-payments/`.
- [ ] **PH2.9.2** [AGENT] Implement `createCheckoutSession(tenantId, items, successUrl, cancelUrl)` using Stripe SDK (via adapter if available). File: `packages/layer6-features/firm-payments/src/checkout.ts`.
- [ ] **PH2.9.3** [AGENT] Implement `handleStripeWebhook(rawBody, signature)` with verify‑deduplicate‑process. File: `packages/layer6-features/firm-payments/src/webhook.ts`.
- [ ] **PH2.9.4** [AGENT] Implement payment method management. File: `packages/layer6-features/firm-payments/src/methods.ts`.
- [ ] **PH2.9.5** [AGENT] Implement split payment support via Stripe Connect. File: `packages/layer6-features/firm-payments/src/split.ts`.
- [ ] **PH2.9.6** [AGENT] Write integration tests with Stripe test mode. File: `packages/layer6-features/firm-payments/tests/`.

---

### PH2.10 – Build `firm-notifications` (multi‑channel delivery, digest batching)
- [ ] **PH2.10** | Status: Not Started

**Related files:** `packages/layer6-features/firm-notifications/`

**Definition of Done:**
- Exports `sendNotification(tenantId, channel, templateId, recipient, variables, options)`.
- Supports channels: email, SMS, push, in‑app.
- Digest batching: groups related notifications within a configurable time window into a single delivery (prevents 500 individual emails from bulk lead import).
- Per‑channel retry policies (e.g., email: 3 retries, SMS: 2 retries).
- In‑app notifications stored in DB with unread count per user.
- Consent‑gated: before sending, checks `firm-consent` for the recipient’s channel consent.
- Templates rendered via `firm-template-engine`.
- Delivery via adapters (email via `adapters-email-*`, SMS via `adapters-sms-*`, etc.) through Port interfaces.

**Out of Scope:** Notification preferences UI; only the sending API.

**Rules to Follow:**
- Must check consent before any send.
- Must use `firm-bus` for asynchronous delivery.
- All sends are audited.

**Advanced Coding Patterns:**
- Digest window: aggregate events per user per channel, flush at window close.
- Retry with exponential backoff via `firm-bus`.

**Anti-Patterns:**
- Do not send without consent check; if no consent, log and skip.
- Do not block the main request thread for delivery; always async.

**DDD:** Notifications is a domain service.  
**TDD:** Test digest batching (multiple events within window produce one email), consent blocking, retry logic, in‑app storage.  
**BDD:** Behavior: a bulk lead import sends a single digest email rather than 500 individual notifications.  
**Deep Module:** `firm-notifications` abstracts channel routing, consent, and batching behind `sendNotification`.

#### Subtasks
- [ ] **PH2.10.1** [AGENT] Create package scaffold: `packages/layer6-features/firm-notifications/`.
- [ ] **PH2.10.2** [AGENT] Implement `sendNotification()` that writes a notification event to the outbox. File: `packages/layer6-features/firm-notifications/src/send.ts`.
- [ ] **PH2.10.3** [AGENT] Implement digest batching aggregator: collects events per user/channel, flushes at window close. File: `packages/layer6-features/firm-notifications/src/digest.ts`.
- [ ] **PH2.10.4** [AGENT] Implement per‑channel retry policies. File: `packages/layer6-features/firm-notifications/src/retry.ts`.
- [ ] **PH2.10.5** [AGENT] Implement in‑app notification storage and unread count query. File: `packages/layer6-features/firm-notifications/src/in-app.ts`.
- [ ] **PH2.10.6** [AGENT] Implement consent gate integration with `firm-consent`. File: `packages/layer6-features/firm-notifications/src/consent-gate.ts`.
- [ ] **PH2.10.7** [AGENT] Write integration tests with mock adapters. File: `packages/layer6-features/firm-notifications/tests/`.

---

### PH2.11 – Build `firm-webhooks` (outbound delivery, signing, retry)
- [ ] **PH2.11** | Status: Not Started

**Related files:** `packages/layer6-features/firm-webhooks/`

**Definition of Done:**
- Exports `registerWebhookSubscription(tenantId, url, events, secret)`, `deliverWebhook(event, subscription)`.
- Outbound delivery with retry and exponential backoff (via `firm-bus`).
- Payload signing: HMAC‑SHA256 signature in `X-Firm-Signature` header.
- Test ping endpoint for subscription validation: `sendPing(subscriptionId)`.
- Mutual TLS support for enterprise endpoints.
- Webhook delivery logs stored for debugging.
- URL reachability validated before subscription is saved.

**Out of Scope:** Inbound webhooks (handled by individual adapters). UI for subscription management.

**Rules to Follow:**
- Must use `firm-crypto` for constant‑time signature generation.
- Retry up to max attempts, then mark subscription as `failing` and alert.
- All deliveries are audited.

**Advanced Coding Patterns:**
- HMAC signature generation with shared secret.
- Webhook event envelope (id, timestamp, eventType, data, signature).

**Anti-Patterns:**
- Do not deliver without verifying the target URL is reachable at registration time.
- Do not use a single secret across all tenants.

**DDD:** Webhooks is an integration domain service.  
**TDD:** Test signature generation, delivery with success/failure, retry logic, ping endpoint.  
**BDD:** Behavior: a registered webhook receives a signed POST request when its subscribed event fires.  
**Deep Module:** `firm-webhooks` abstracts outbound HTTP delivery, signing, and retry behind `registerWebhookSubscription` and automatic event‑driven delivery.

#### Subtasks
- [ ] **PH2.11.1** [AGENT] Create package scaffold: `packages/layer6-features/firm-webhooks/`.
- [ ] **PH2.11.2** [AGENT] Implement subscription registry: `registerWebhookSubscription`, `deleteSubscription`. File: `packages/layer6-features/firm-webhooks/src/subscription.ts`.
- [ ] **PH2.11.3** [AGENT] Implement `deliverWebhook(event, subscription)` that sends POST with signed payload. File: `packages/layer6-features/firm-webhooks/src/deliver.ts`.
- [ ] **PH2.11.4** [AGENT] Implement HMAC signature generation using shared secret. File: `packages/layer6-features/firm-webhooks/src/signing.ts`.
- [ ] **PH2.11.5** [AGENT] Implement retry logic via `firm-bus` (publish `webhook.deliver` event with attempt count). File: `packages/layer6-features/firm-webhooks/src/retry.ts`.
- [ ] **PH2.11.6** [AGENT] Implement `sendPing(subscriptionId)` for endpoint validation. File: `packages/layer6-features/firm-webhooks/src/ping.ts`.
- [ ] **PH2.11.7** [AGENT] Write integration tests with a mock HTTP server. File: `packages/layer6-features/firm-webhooks/tests/`.

---

### PH2.12 – Build `firm-search` (full‑text search with tenant isolation)
- [ ] **PH2.12** | Status: Not Started

**Related files:** `packages/layer6-features/firm-search/`

**Definition of Done:**
- Exports `search(tenantId, index, query, filters)`, `indexDocument(tenantId, index, id, body)`, `deleteDocument(tenantId, index, id)`.
- Search engine chosen per ADR‑002 (Typesense, Meilisearch, or PostgreSQL FTS).
- Tenant isolation enforced at application layer (RLS as safety net if using PostgreSQL, or separate indexes/API keys for external engines).
- Supports faceting, filtering, and pagination.
- Search events emitted for observability.
- Tests: cross‑tenant query returns zero results, indexing, deletion, basic search.

**Out of Scope:** Search UI; only the API.

**Rules to Follow:**
- Tenant isolation is mandatory; must be verified by tests.
- Must use `firm-db-client` if PostgreSQL FTS, or adapter if external engine.
- Must emit `search.indexed` and `search.deleted` events.

**Advanced Coding Patterns:**
- If external engine: adapter pattern wrapping the search client.
- Facet aggregation from filters.

**Anti-Patterns:**
- Do not allow cross‑tenant search queries; every search must be scoped to `tenantId`.
- Do not hardcode the engine; use a Port interface so the engine can be swapped.

**DDD:** Search is a supporting domain service.  
**TDD:** Test index and search, cross‑tenant isolation, faceting.  
**BDD:** Behavior: searching for "lead" as tenant A does not return tenant B's leads.  
**Deep Module:** `firm-search` hides the search engine behind a tenant‑scoped API.

#### Subtasks
- [ ] **PH2.12.1** [AGENT] Confirm ADR‑002 and document chosen engine. File: `docs/adr/0002-firm-search-engine.md`.
- [ ] **PH2.12.2** [AGENT] Create package scaffold: `packages/layer6-features/firm-search/`.
- [ ] **PH2.12.3** [AGENT] Implement `SearchPort` interface and engine‑specific adapter. File: `packages/layer6-features/firm-search/src/engine.ts`.
- [ ] **PH2.12.4** [AGENT] Implement `indexDocument(tenantId, index, id, body)` with tenant scoping. File: `packages/layer6-features/firm-search/src/index.ts`.
- [ ] **PH2.12.5** [AGENT] Implement `search(tenantId, index, query, filters)` with faceting. File: `packages/layer6-features/firm-search/src/search.ts`.
- [ ] **PH2.12.6** [AGENT] Implement `deleteDocument(tenantId, index, id)`. File: `packages/layer6-features/firm-search/src/delete.ts`.
- [ ] **PH2.12.7** [AGENT] Write integration tests with a local search engine instance. File: `packages/layer6-features/firm-search/tests/`.

---

### PH2.13 – Build `firm-sse` (Server‑Sent Events for real‑time updates)
- [ ] **PH2.13** | Status: Not Started

**Related files:** `packages/layer6-features/firm-sse/`

**Definition of Done:**
- Exports `createSSEConnection(tenantId, userId, channels)` that returns a `ReadableStream` of SSE events.
- Supports per‑user subscription to event channels (e.g., `lead.${leadId}`, `notification.${userId}`).
- Heartbeat every 15 seconds to keep connection alive.
- Authentication via session token passed in query param or cookie.
- Automatic reconnection with `Last-Event-ID` header.
- Tests: connection establishment, event delivery, reconnection, authentication.

**Out of Scope:** WebSocket transport; only SSE.

**Rules to Follow:**
- Must validate tenant and user identity before opening the stream.
- Must use `firm-bus` to publish events to interested SSE connections.
- Must handle connection cleanup when client disconnects.

**Advanced Coding Patterns:**
- Use `AsyncLocalStorage` to propagate request context into the SSE stream.
- Channel‑based pub/sub for routing events to connections.

**Anti-Patterns:**
- Do not keep stale connections alive indefinitely; implement idle timeout.
- Do not send sensitive data over SSE without verifying the user’s permissions.

**DDD:** SSE is an infrastructure service for real‑time communication.  
**TDD:** Test that a client receives events published to its subscribed channel; test that unauthenticated request is rejected.  
**BDD:** Behavior: a user watching a lead detail page receives a real‑time update when the lead status changes.  
**Deep Module:** `firm-sse` abstracts the SSE protocol and pub/sub behind a simple `createSSEConnection` function.

#### Subtasks
- [ ] **PH2.13.1** [AGENT] Create package scaffold: `packages/layer6-features/firm-sse/`.
- [ ] **PH2.13.2** [AGENT] Implement `SSEManager` that maintains a registry of open connections per tenant/user. File: `packages/layer6-features/firm-sse/src/manager.ts`.
- [ ] **PH2.13.3** [AGENT] Implement `createSSEConnection(tenantId, userId, channels)` returning a `ReadableStream`. File: `packages/layer6-features/firm-sse/src/connection.ts`.
- [ ] **PH2.13.4** [AGENT] Implement pub/sub: subscribe to `firm-bus` events and forward to matching SSE connections. File: `packages/layer6-features/firm-sse/src/pubsub.ts`.
- [ ] **PH2.13.5** [AGENT] Implement heartbeat and `Last-Event-ID` reconnection support. File: `packages/layer6-features/firm-sse/src/heartbeat.ts`.
- [ ] **PH2.13.6** [AGENT] Write integration tests. File: `packages/layer6-features/firm-sse/tests/`.

---

### PH2.14 – Build `firm-ai` (AI infrastructure: model routing, cost metering, rate limiting)
- [ ] **PH2.14** | Status: Not Started

**Related files:** `packages/layer6-features/firm-ai/`

**Definition of Done:**
- Exports `generateText(prompt, options)` and `generateImage(prompt, options)` that route to appropriate AI model adapter (OpenAI, Anthropic, etc.) based on model availability and tenant plan.
- Token counting (pre‑request estimate and post‑response actual) via model‑specific tokenizers.
- Cost metering: records AI token usage via `firm-metering.recordUsage('ai_tokens', count)`.
- Rate limiting: uses `firm-rate-limiter` to enforce per‑tenant AI request limits (token bucket).
- Lead scoring and personalization functions (analytical AI) – no approval gate.
- No generation logic, no compliance‑sensitive features (that's `firm-ai-content`).

**Out of Scope:** Content generation with human‑approval gate (Phase 6). Image generation (handled by `firm-ai-content` though the infrastructure may route it).

**Rules to Follow:**
- Must use AI model adapters (Layer 7) through `AIModelPort`.
- Must check quota via `firm-metering.checkQuota()` before sending a request.
- Must apply rate limiting per tenant per model.

**Advanced Coding Patterns:**
- Model router that selects the cheapest available model meeting the requested capability.
- Token counting before and after generation for accurate billing.

**Anti-Patterns:**
- Do not hardcode model names; use the adapter abstraction.
- Do not allow unrestricted AI generation; always enforce rate limits and quotas.

**DDD:** AI infrastructure is a supporting domain service.  
**TDD:** Test model routing, token counting, rate limit enforcement, quota check rejection.  
**BDD:** Behavior: a tenant on a "starter" plan can only make 100 AI requests per month; the 101st is rejected with a quota error.  
**Deep Module:** `firm-ai` hides model selection, rate limiting, and cost tracking behind `generateText`.

#### Subtasks
- [ ] **PH2.14.1** [AGENT] Create package scaffold: `packages/layer6-features/firm-ai/`.
- [ ] **PH2.14.2** [AGENT] Implement `ModelRouter` that selects the best model based on capability and plan. File: `packages/layer6-features/firm-ai/src/router.ts`.
- [ ] **PH2.14.3** [AGENT] Implement `generateText(prompt, options)` with pre‑request quota check, rate limiting, token counting, and cost metering. File: `packages/layer6-features/firm-ai/src/generate.ts`.
- [ ] **PH2.14.4** [AGENT] Implement token counting utilities (via model‑specific tokenizers or estimators). File: `packages/layer6-features/firm-ai/src/tokens.ts`.
- [ ] **PH2.14.5** [AGENT] Implement lead scoring function (analytical AI) without approval gate. File: `packages/layer6-features/firm-ai/src/scoring.ts`.
- [ ] **PH2.14.6** [AGENT] Write integration tests with mock AI adapters. File: `packages/layer6-features/firm-ai/tests/`.

---

### PH2.15 – Build `firm-migrations` (migration runner and drift check)
- [ ] **PH2.15** | Status: Not Started

**Related files:** `packages/layer6-features/firm-migrations/`

**Definition of Done:**
- Exports `runMigrations(dbClient)` that applies all pending Drizzle migrations.
- Drift check: `checkDrift(dbClient)` compares current DB schema against the expected migration state and reports differences.
- CI integration: drift check runs on every PR to ensure migrations are in sync.
- Uses `firm-db-client` and `firm-db-schema`.

**Out of Scope:** Creating new migrations (that's manual via Drizzle Kit); only running and verifying.

**Rules to Follow:**
- Migrations must be run in a transaction where possible (PostgreSQL DDL transactional limitations apply).
- Drift check must fail CI if any discrepancy is found.

**Advanced Coding Patterns:**
- Wrapper around Drizzle Kit’s migration functions.

**Anti-Patterns:**
- Do not run migrations automatically on application start without a lock to prevent concurrent runs.

**DDD:** [N/A]  
**TDD:** Test that `runMigrations` applies pending migrations and `checkDrift` returns expected status.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH2.15.1** [AGENT] Create package scaffold: `packages/layer6-features/firm-migrations/`.
- [ ] **PH2.15.2** [AGENT] Implement `runMigrations(dbClient)` using Drizzle Kit’s migrator. File: `packages/layer6-features/firm-migrations/src/run.ts`.
- [ ] **PH2.15.3** [AGENT] Implement `checkDrift(dbClient)` that compares schema hashes. File: `packages/layer6-features/firm-migrations/src/drift.ts`.
- [ ] **PH2.15.4** [AGENT] Write tests using a test database. File: `packages/layer6-features/firm-migrations/tests/`.

---

### PH2.16 – Build `firm-seed` (deterministic seed data)
- [ ] **PH2.16** | Status: Not Started

**Related files:** `packages/layer6-features/firm-seed/`

**Definition of Done:**
- Exports `seed(tenantId, scenario)` that inserts deterministic test data (users, leads, campaigns, etc.) for development and testing.
- Supports scenarios: `minimal`, `basic`, `full`.
- Idempotent: running seed twice does not duplicate data.
- Uses `firm-db-client`.

**Out of Scope:** Production data seeding; only dev/test.

**Rules to Follow:**
- Must use the same RLS policies as production.
- Must mark seeded data with `is_seeded = true` flag so it can be identified and cleaned up.

**Advanced Coding Patterns:**
- Factory functions for generating realistic random data with fixed seeds (using `faker` or similar with a seed).

**Anti-Patterns:**
- Do not seed real emails or PII that could accidentally be used in production.

**DDD:** [N/A]  
**TDD:** Test that seeding produces the expected number of records and is idempotent.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH2.16.1** [AGENT] Create package scaffold: `packages/layer6-features/firm-seed/`.
- [ ] **PH2.16.2** [AGENT] Implement `seed(tenantId, scenario)` with `minimal`, `basic`, `full` scenarios. File: `packages/layer6-features/firm-seed/src/seed.ts`.
- [ ] **PH2.16.3** [AGENT] Implement data factories with deterministic random generation. File: `packages/layer6-features/firm-seed/src/factories/`.
- [ ] **PH2.16.4** [AGENT] Write tests for seed idempotency and record counts. File: `packages/layer6-features/firm-seed/tests/`.

---

### PH2.17 – Build `firm-kpi` (business KPI telemetry and anomaly alerts)
- [ ] **PH2.17** | Status: Not Started

**Related files:** `packages/layer6-features/firm-kpi/`

**Definition of Done:**
- Exports `trackKPI(metricName, value, tenantId)` and `queryKPI(metricName, tenantId, period)`.
- Built‑in metrics: revenue, lead conversion rate, campaign ROI, churn risk.
- Anomaly detection: compares current period values against historical baseline and alerts if deviation exceeds threshold.
- Uses `firm-observability` for metric export and `firm-bus` for alerts.

**Out of Scope:** Dashboards (that's `firm-reporting`); only metric collection and anomaly detection.

**Rules to Follow:**
- Must use `firm-db-client` for storage of KPI time‑series.
- Anomaly alerts must be emitted via `firm-bus` for notification dispatch.

**Advanced Coding Patterns:**
- Simple statistical anomaly detection (e.g., Z‑score) on rolling windows.
- Time‑series aggregation queries.

**Anti-Patterns:**
- Do not compute KPIs synchronously on the request path; use async processing.

**DDD:** KPIs are a supporting domain service for business intelligence.  
**TDD:** Test that tracking a metric stores it, query returns correct aggregates, anomaly detection triggers alert when value is outside threshold.  
**BDD:** Behavior: if lead conversion drops by 50% week‑over‑week, a `kpi.anomaly.detected` event is emitted.  
**Deep Module:** `firm-kpi` hides time‑series storage and anomaly detection behind simple `trackKPI` and `queryKPI` functions.

#### Subtasks
- [ ] **PH2.17.1** [AGENT] Create package scaffold: `packages/layer6-features/firm-kpi/`.
- [ ] **PH2.17.2** [AGENT] Implement `trackKPI(metricName, value, tenantId)` writing to a time‑series table. File: `packages/layer6-features/firm-kpi/src/track.ts`.
- [ ] **PH2.17.3** [AGENT] Implement `queryKPI(metricName, tenantId, period)` with aggregation. File: `packages/layer6-features/firm-kpi/src/query.ts`.
- [ ] **PH2.17.4** [AGENT] Implement anomaly detection using Z‑score on a rolling window. File: `packages/layer6-features/firm-kpi/src/anomaly.ts`.
- [ ] **PH2.17.5** [AGENT] Write tests for tracking, querying, and anomaly detection. File: `packages/layer6-features/firm-kpi/tests/`.

---

### PH2.18 – Build `firm-sdk` (typed TypeScript client, Layer 2)
- [ ] **PH2.18** | Status: Not Started

**Related files:** `packages/layer2-data/firm-sdk/`

**Definition of Done:**
- Exports `FirmClient` class with methods for all API endpoints (leads, bookings, forms, etc.), pagination support, and tenant context injection (`FirmClient.withTenant(tenantId)`).
- Separate sub‑exports: `@firm/sdk/node` and `@firm/sdk/browser`.
- Includes `verifyWebhookSignature(payload, signature, secret)` helper.
- Auto‑generated from OpenAPI spec where possible; manual wrappers for type‑safe parameters.
- Tests: pagination, tenant scoping, webhook signature verification.

**Out of Scope:** Backend API implementation; only the client library.

**Rules to Follow:**
- Must use `firm-api-contracts` for types.
- Must not include any business logic.

**Advanced Coding Patterns:**
- Auto‑pagination iterator.
- Type‑safe API client with method autocompletion.

**Anti-Patterns:**
- Do not bundle server‑only dependencies in the browser export.

**DDD:** [N/A]  
**TDD:** Test client calls against a mock server; test pagination and tenant context.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH2.18.1** [AGENT] Create package scaffold: `packages/layer2-data/firm-sdk/`.
- [ ] **PH2.18.2** [AGENT] Implement `FirmClient` with endpoint methods, pagination, and `withTenant()`. File: `packages/layer2-data/firm-sdk/src/client.ts`.
- [ ] **PH2.18.3** [AGENT] Set up sub‑exports: `node` and `browser` with appropriate fetch adapters. Files: `packages/layer2-data/firm-sdk/src/node.ts`, `browser.ts`.
- [ ] **PH2.18.4** [AGENT] Implement `verifyWebhookSignature(payload, signature, secret)`. File: `packages/layer2-data/firm-sdk/src/webhook.ts`.
- [ ] **PH2.18.5** [AGENT] Write tests with a mock API server. File: `packages/layer2-data/firm-sdk/tests/`.

---

Phase 3 of the updated TODO.md follows. Each parent task groups adapters by category, and each adapter is a subtask. All adapters must be generated using the scaffolding tool from Phase 1 and must pass the Port conformance test.

---

## Phase 3: Adapters (105 adapters)

*Built in priority order, parallel with Phases 2‑5. The adapter scaffolding generator (PH1.41) must be complete and CI Gate 13 active before any adapter is built. Every adapter implements a Port interface from `firm‑types`, lazy‑initialises from environment variables, transforms provider types to canonical types, maps errors to `FirmError`, exports Prometheus metrics, and follows the verify‑deduplicate‑process webhook pattern where applicable.*

---

### PH3.1 – Build critical missing adapters (unblockers for local development and core features)
- [ ] **PH3.1** | Status: Not Started

**Related files:** `packages/layer7‑adapters/storage/adapters‑storage‑local/` (already built in Phase 1), `packages/layer7‑adapters/pdf‑generator/adapters‑pdf‑generator‑puppeteer/`, `packages/layer7‑adapters/ai‑image/adapters‑ai‑image‑openai/`, `packages/layer7‑adapters/ai‑image/adapters‑ai‑image‑stability/`, `packages/layer7‑adapters/videoconferencing/adapters‑videoconferencing‑zoom/`, `packages/layer7‑adapters/videoconferencing/adapters‑videoconferencing‑google‑meet/`, `packages/layer7‑adapters/email‑validation/adapters‑email‑validation‑zerobounce/`

**Definition of Done:**
- All adapters listed as “Critical Missing” in the Current State Assessment are built:
  - `adapters‑storage‑local` — already complete (PH1.25).
  - `adapters‑pdf‑generator‑puppeteer` — generates PDFs using a local Puppeteer instance.
  - `adapters‑ai‑image‑openai` and `adapters‑ai‑image‑stability` — text‑to‑image generation.
  - `adapters‑videoconferencing‑zoom` and `adapters‑videoconferencing‑google‑meet` — create meeting links.
  - `adapters‑email‑validation‑zerobounce` — validate email addresses for deliverability.
- Each adapter passes its Port conformance test, has a stub, and is listed in the auto‑generated `REGISTRY.md`.

**Out of Scope:** Other email validation providers, other video conferencing providers, other PDF generators (those are in later tasks).

**Rules to Follow:**
- Use the adapter scaffolding generator (`pnpm turbo gen adapter`). Hand‑authored adapters will fail CI.
- Lazy client initialisation from `firm‑env` validated variables.
- Webhook handlers must follow verify → deduplicate → process.

**Advanced Coding Patterns:**
- Puppeteer: manage browser instances with a pool to avoid cold starts; use `page.pdf()` with options.
- AI Image: map prompt parameters to provider‑specific API calls; return canonical `GeneratedImage` type.
- Video conferencing: OAuth token management with refresh.

**Anti-Patterns:**
- Do not hardcode credentials; use `firm‑env`.
- Do not process a webhook without constant‑time signature verification.

**DDD:** Each adapter is an anti‑corruption layer between the platform’s Port and the external system.  
**TDD:** Conformance test for each Port verifies all methods return canonical types and errors map to `FirmError`.  
**BDD:** Behavior: calling `generatePdf(html)` returns a buffer; calling `createMeeting(details)` returns a meeting URL.  
**Deep Module:** Each adapter hides provider‑specific SDK details behind the Port interface.

#### Subtasks
- [ ] **PH3.1.1** [AGENT] `adapters‑storage‑local` — already built in Phase 1; verify conformance and REGISTRY entry. File: `packages/layer7‑adapters/storage/adapters‑storage‑local/`.
- [ ] **PH3.1.2** [AGENT] Scaffold `adapters‑pdf‑generator‑puppeteer` using the generator. Implement `PdfGeneratorPort` using Puppeteer with browser pooling. File: `packages/layer7‑adapters/pdf‑generator/adapters‑pdf‑generator‑puppeteer/`.
- [ ] **PH3.1.3** [AGENT] Scaffold `adapters‑ai‑image‑openai`. Implement `AiImagePort` mapping to DALL‑E API. File: `packages/layer7‑adapters/ai‑image/adapters‑ai‑image‑openai/`.
- [ ] **PH3.1.4** [AGENT] Scaffold `adapters‑ai‑image‑stability`. Implement `AiImagePort` mapping to Stability AI API. File: `packages/layer7‑adapters/ai‑image/adapters‑ai‑image‑stability/`.
- [ ] **PH3.1.5** [AGENT] Scaffold `adapters‑videoconferencing‑zoom`. Implement `VideoConferencingPort` with OAuth, create meeting, and webhook handling. File: `packages/layer7‑adapters/videoconferencing/adapters‑videoconferencing‑zoom/`.
- [ ] **PH3.1.6** [AGENT] Scaffold `adapters‑videoconferencing‑google‑meet`. Implement `VideoConferencingPort` with Google Calendar API integration. File: `packages/layer7‑adapters/videoconferencing/adapters‑videoconferencing‑google‑meet/`.
- [ ] **PH3.1.7** [AGENT] Scaffold `adapters‑email‑validation‑zerobounce`. Implement `EmailValidationPort` with single/batch validation endpoints. File: `packages/layer7‑adapters/email‑validation/adapters‑email‑validation‑zerobounce/`.
- [ ] **PH3.1.8** [AGENT] Run conformance tests for all newly scaffolded adapters and update `REGISTRY.md`.

---

### PH3.2 – Build CRM adapters (7 adapters)
- [ ] **PH3.2** | Status: Not Started

**Related files:** `packages/layer7‑adapters/crm/adapters‑crm‑hubspot/`, `adapters‑crm‑salesforce/`, `adapters‑crm‑gohighlevel/`, `adapters‑crm‑pipedrive/`, `adapters‑crm‑zoho/`, `adapters‑crm‑activecampaign/`, `adapters‑crm‑keap/`

**Definition of Done:**
- All seven adapters implement `CRMPort`: `syncLead`, `syncCompany`, `syncDeal`, `handleWebhook`.
- Webhook signature verification uses constant‑time comparison.
- Each adapter exports Prometheus metrics (`crm_sync_calls_total`, `crm_sync_errors_total`).

**Out of Scope:** CRM UI; only the adapter layer.

**Rules to Follow:**
- Every adapter must use the scaffolding generator; stub and conformance test generated simultaneously.
- Must map provider‑specific field names to canonical `Lead`, `Company`, `Deal` types from `firm‑types`.

**Advanced Coding Patterns:**
- Use OAuth token management with refresh for HubSpot, Salesforce, GHL.
- Salesforce: use `jsforce` library or REST API with token exchange.

**Anti-Patterns:**
- Do not store raw API keys in config; use `firm‑env`.
- Do not let a feature package call the CRM SDK directly; only through this adapter.

**DDD:** Adapters implement the anti‑corruption layer at the CRM bounded context boundary.  
**TDD:** Conformance tests using mock HTTP servers that simulate each CRM’s API.  
**BDD:** Behavior: calling `syncLead(lead)` creates/updates a lead in the external CRM and returns the external ID.  
**Deep Module:** Provider‑specific modules within the `crm/` directory, each exposing only the Port interface.

#### Subtasks
- [ ] **PH3.2.1** [AGENT] Scaffold `adapters‑crm‑hubspot` and implement `CRMPort` with OAuth, `syncLead`, `syncCompany`, `syncDeal`, webhook verification. File: `packages/layer7‑adapters/crm/adapters‑crm‑hubspot/`.
- [ ] **PH3.2.2** [AGENT] Scaffold `adapters‑crm‑salesforce` with OAuth and equivalent methods. File: `packages/layer7‑adapters/crm/adapters‑crm‑salesforce/`.
- [ ] **PH3.2.3** [AGENT] Scaffold `adapters‑crm‑gohighlevel`. File: `packages/layer7‑adapters/crm/adapters‑crm‑gohighlevel/`.
- [ ] **PH3.2.4** [AGENT] Scaffold `adapters‑crm‑pipedrive`. File: `packages/layer7‑adapters/crm/adapters‑crm‑pipedrive/`.
- [ ] **PH3.2.5** [AGENT] Scaffold `adapters‑crm‑zoho`. File: `packages/layer7‑adapters/crm/adapters‑crm‑zoho/`.
- [ ] **PH3.2.6** [AGENT] Scaffold `adapters‑crm‑activecampaign`. File: `packages/layer7‑adapters/crm/adapters‑crm‑activecampaign/`.
- [ ] **PH3.2.7** [AGENT] Scaffold `adapters‑crm‑keap`. File: `packages/layer7‑adapters/crm/adapters‑crm‑keap/`.
- [ ] **PH3.2.8** [AGENT] Run conformance tests for all CRM adapters and update `REGISTRY.md`.

---

### PH3.3 – Build Email adapters (6 adapters)
- [ ] **PH3.3** | Status: Not Started

**Related files:** `packages/layer7‑adapters/email/adapters‑email‑resend/`, `adapters‑email‑sendgrid/`, `adapters‑email‑ses/`, `adapters‑email‑postmark/`, `adapters‑email‑smtp/`, `adapters‑email‑mailgun/`

**Definition of Done:**
- All adapters implement `EmailPort`: `sendEmail`, `sendBulk`, `getEmailStatus`.
- SMTP adapter supports standard SMTP credentials.
- Webhook handlers for bounce/complaint/delivery notifications.

**Out of Scope:** Email template rendering (that’s `firm‑template‑engine`).

**Rules to Follow:**
- Must use `firm‑crypto` for webhook signature verification where applicable.
- Rate limits and retry logic are handled by `firm‑notifications`, not the adapters.

**Advanced Coding Patterns:**
- Resend/SendGrid: REST API with API key auth.
- SES: AWS SDK v3 with credential chain.
- SMTP: Nodemailer with connection pooling.

**Anti-Patterns:**
- Do not hardcode sender addresses; use config from `firm‑env`.

**DDD:** Adapters implement the anti‑corruption layer at the messaging bounded context boundary.  
**TDD:** Conformance tests using mock SMTP servers and HTTP mocks.  
**BDD:** Behavior: `sendEmail` returns a message ID; `getEmailStatus` returns delivery status.  
**Deep Module:** Provider‑specific modules in `email/` directory.

#### Subtasks
- [ ] **PH3.3.1** [AGENT] Scaffold `adapters‑email‑resend`. File: `packages/layer7‑adapters/email/adapters‑email‑resend/`.
- [ ] **PH3.3.2** [AGENT] Scaffold `adapters‑email‑sendgrid`. File: `packages/layer7‑adapters/email/adapters‑email‑sendgrid/`.
- [ ] **PH3.3.3** [AGENT] Scaffold `adapters‑email‑ses`. File: `packages/layer7‑adapters/email/adapters‑email‑ses/`.
- [ ] **PH3.3.4** [AGENT] Scaffold `adapters‑email‑postmark`. File: `packages/layer7‑adapters/email/adapters‑email‑postmark/`.
- [ ] **PH3.3.5** [AGENT] Scaffold `adapters‑email‑smtp`. File: `packages/layer7‑adapters/email/adapters‑email‑smtp/`.
- [ ] **PH3.3.6** [AGENT] Scaffold `adapters‑email‑mailgun`. File: `packages/layer7‑adapters/email/adapters‑email‑mailgun/`.
- [ ] **PH3.3.7** [AGENT] Run conformance tests and update `REGISTRY.md`.

---

### PH3.4 – Build AI Model adapters (4 adapters)
- [ ] **PH3.4** | Status: Not Started

**Related files:** `packages/layer7‑adapters/ai‑models/adapters‑ai‑openai/`, `adapters‑ai‑anthropic/`, `adapters‑ai‑google/`, `adapters‑ai‑azure‑openai/`

**Definition of Done:**
- All adapters implement `AIModelPort`: `generateText`, `generateChat`, `countTokens`.
- OpenAI and Azure OpenAI share a common base with endpoint configuration.
- Anthropic uses the Messages API.
- Google uses the Gemini API.

**Out of Scope:** Image generation (that’s `AiImagePort`, handled in PH3.1).

**Rules to Follow:**
- Must expose `countTokens` for accurate metering.
- Must handle streaming responses (optional, but recommended).

**Advanced Coding Patterns:**
- Azure OpenAI: uses token provider for authentication.
- Token counting via tiktoken (OpenAI) or equivalent.

**Anti-Patterns:**
- Do not log prompt/response content without PII redaction.

**DDD:** Adapters implement the anti‑corruption layer at the AI integration boundary.  
**TDD:** Conformance tests with mocked provider APIs.  
**BDD:** Behavior: `generateText(prompt)` returns the model’s response text.  
**Deep Module:** Provider‑specific modules.

#### Subtasks
- [ ] **PH3.4.1** [AGENT] Scaffold `adapters‑ai‑openai`. File: `packages/layer7‑adapters/ai‑models/adapters‑ai‑openai/`.
- [ ] **PH3.4.2** [AGENT] Scaffold `adapters‑ai‑anthropic`. File: `packages/layer7‑adapters/ai‑models/adapters‑ai‑anthropic/`.
- [ ] **PH3.4.3** [AGENT] Scaffold `adapters‑ai‑google`. File: `packages/layer7‑adapters/ai‑models/adapters‑ai‑google/`.
- [ ] **PH3.4.4** [AGENT] Scaffold `adapters‑ai‑azure‑openai`. File: `packages/layer7‑adapters/ai‑models/adapters‑ai‑azure‑openai/`.
- [ ] **PH3.4.5** [AGENT] Run conformance tests and update `REGISTRY.md`.

---

### PH3.5 – Build Cloud Storage adapters (S3, R2)
- [ ] **PH3.5** | Status: Not Started

**Related files:** `packages/layer7‑adapters/storage/adapters‑storage‑s3/`, `packages/layer7‑adapters/storage/adapters‑storage‑r2/`

**Definition of Done:**
- Both adapters implement `StoragePort`: `putObject`, `getObject`, `deleteObject`, `getSignedUrl`.
- S3 adapter uses AWS SDK v3 with credential chain; R2 adapter uses S3‑compatible API with Cloudflare credentials.
- `adapters‑storage‑local` already done (PH1.25); these complete the storage adapter set.

**Out of Scope:** CDN configuration (handled by infrastructure).

**Rules to Follow:**
- Tenant‑scoped path prefixes: `/{tenantId}/...`.
- Must use presigned URLs for secure access.

**Advanced Coding Patterns:**
- Multipart upload for large files.

**Anti-Patterns:**
- Do not store bucket names in code; use `firm‑env`.

**DDD:** Adapters implement the anti‑corruption layer at the storage boundary.  
**TDD:** Conformance tests with local S3 emulator (MinIO) or mock.  
**BDD:** Behavior: `putObject` stores a file and returns a key; `getSignedUrl` returns a time‑limited URL.  
**Deep Module:** Provider‑specific modules.

#### Subtasks
- [ ] **PH3.5.1** [AGENT] Scaffold `adapters‑storage‑s3`. File: `packages/layer7‑adapters/storage/adapters‑storage‑s3/`.
- [ ] **PH3.5.2** [AGENT] Scaffold `adapters‑storage‑r2`. File: `packages/layer7‑adapters/storage/adapters‑storage‑r2/`.
- [ ] **PH3.5.3** [AGENT] Run conformance tests and update `REGISTRY.md`.

---

### PH3.6 – Build Payment adapters (Stripe, Paddle, PayPal, Square)
- [ ] **PH3.6** | Status: Not Started

**Related files:** `packages/layer7‑adapters/payments/adapters‑payments‑stripe/`, `adapters‑payments‑paddle/`, `adapters‑payments‑paypal/`, `adapters‑payments‑square/`

**Definition of Done:**
- All adapters implement `PaymentsPort`: `createCheckoutSession`, `handleWebhook`, `createSubscription`, `cancelSubscription`, `refund`.
- Webhook signature verification constant‑time.
- Stripe adapter may also implement `splitPayment` via Connect.

**Out of Scope:** Invoicing logic (handled by `firm‑billing`).

**Rules to Follow:**
- Webhook: verify signature on raw body, then idempotency check, then process.
- Must use `firm‑env` for secret keys.

**Advanced Coding Patterns:**
- Stripe: use `stripe` Node SDK with webhook signature verification.
- Paddle: use Paddle.js and Paddle Billing API.

**Anti-Patterns:**
- Do not expose secret keys in logs or client‑side code.

**DDD:** Adapters implement the anti‑corruption layer at the payment boundary.  
**TDD:** Conformance tests with provider‑provided test environments (Stripe test mode, Paddle sandbox).  
**BDD:** Behavior: `createCheckoutSession` returns a URL; webhook processing fires `payment.succeeded`.  
**Deep Module:** Provider‑specific modules.

#### Subtasks
- [ ] **PH3.6.1** [AGENT] Scaffold `adapters‑payments‑stripe`. File: `packages/layer7‑adapters/payments/adapters‑payments‑stripe/`.
- [ ] **PH3.6.2** [AGENT] Scaffold `adapters‑payments‑paddle`. File: `packages/layer7‑adapters/payments/adapters‑payments‑paddle/`.
- [ ] **PH3.6.3** [AGENT] Scaffold `adapters‑payments‑paypal`. File: `packages/layer7‑adapters/payments/adapters‑payments‑paypal/`.
- [ ] **PH3.6.4** [AGENT] Scaffold `adapters‑payments‑square`. File: `packages/layer7‑adapters/payments/adapters‑payments‑square/`.
- [ ] **PH3.6.5** [AGENT] Run conformance tests and update `REGISTRY.md`.

---

### PH3.7 – Build SMS adapters (4 adapters)
- [ ] **PH3.7** | Status: Not Started

**Related files:** `packages/layer7‑adapters/sms/adapters‑sms‑twilio/`, `adapters‑sms‑vonage/`, `adapters‑sms‑messagebird/`, `adapters‑sms‑sinch/`

**Definition of Done:**
- All adapters implement `SmsPort`: `sendSms`, `getDeliveryStatus`, `handleWebhook`.
- Webhook for delivery receipts, replies.

**Out of Scope:** MMS, voice (future).

**Rules to Follow:**
- Must use `firm‑env` for API keys.
- Constant‑time webhook verification where supported.

**Advanced Coding Patterns:**
- Twilio: use Twilio SDK with webhook signature validation.
- MessageBird: REST API with API key.

**Anti-Patterns:**
- Do not send SMS without consent; consent is enforced by `firm‑notifications`, not the adapter.

**DDD:** Adapters implement the anti‑corruption layer at the messaging boundary.  
**TDD:** Conformance tests with mocks.  
**BDD:** Behavior: `sendSms` returns a message SID; delivery webhook updates status.  
**Deep Module:** Provider‑specific modules.

#### Subtasks
- [ ] **PH3.7.1** [AGENT] Scaffold `adapters‑sms‑twilio`. File: `packages/layer7‑adapters/sms/adapters‑sms‑twilio/`.
- [ ] **PH3.7.2** [AGENT] Scaffold `adapters‑sms‑vonage`. File: `packages/layer7‑adapters/sms/adapters‑sms‑vonage/`.
- [ ] **PH3.7.3** [AGENT] Scaffold `adapters‑sms‑messagebird`. File: `packages/layer7‑adapters/sms/adapters‑sms‑messagebird/`.
- [ ] **PH3.7.4** [AGENT] Scaffold `adapters‑sms‑sinch`. File: `packages/layer7‑adapters/sms/adapters‑sms‑sinch/`.
- [ ] **PH3.7.5** [AGENT] Run conformance tests and update `REGISTRY.md`.

---

### PH3.8 – Build Analytics adapters (5 adapters)
- [ ] **PH3.8** | Status: Not Started

**Related files:** `packages/layer7‑adapters/analytics/adapters‑analytics‑ga4/`, `adapters‑analytics‑plausible/`, `adapters‑analytics‑fathom/`, `adapters‑analytics‑mixpanel/`, `adapters‑analytics‑posthog/`

**Definition of Done:**
- All adapters implement `AnalyticsPort`: `sendEvent`, `getReport`, `handleWebhook` (if applicable).
- GA4: Measurement Protocol.
- Plausible/Fathom: server‑side event API.
- Mixpanel/PostHog: SDK or API.

**Out of Scope:** Client‑side tracking scripts (that’s consent‑gated UI).

**Rules to Follow:**
- Must respect consent before sending analytics events; consent check done by `firm‑consent`, but adapter should not assume.

**Advanced Coding Patterns:**
- Batch event sending for efficiency.
- PostHog: use `posthog-node` SDK.

**Anti-Patterns:**
- Do not send PII in analytics events.

**DDD:** Adapters implement the anti‑corruption layer at the analytics boundary.  
**TDD:** Conformance tests with mocks or sandbox.  
**BDD:** Behavior: `sendEvent` delivers a structured event to the analytics service.  
**Deep Module:** Provider‑specific modules.

#### Subtasks
- [ ] **PH3.8.1** [AGENT] Scaffold `adapters‑analytics‑ga4`. File: `packages/layer7‑adapters/analytics/adapters‑analytics‑ga4/`.
- [ ] **PH3.8.2** [AGENT] Scaffold `adapters‑analytics‑plausible`. File: `packages/layer7‑adapters/analytics/adapters‑analytics‑plausible/`.
- [ ] **PH3.8.3** [AGENT] Scaffold `adapters‑analytics‑fathom`. File: `packages/layer7‑adapters/analytics/adapters‑analytics‑fathom/`.
- [ ] **PH3.8.4** [AGENT] Scaffold `adapters‑analytics‑mixpanel`. File: `packages/layer7‑adapters/analytics/adapters‑analytics‑mixpanel/`.
- [ ] **PH3.8.5** [AGENT] Scaffold `adapters‑analytics‑posthog`. File: `packages/layer7‑adapters/analytics/adapters‑analytics‑posthog/`.
- [ ] **PH3.8.6** [AGENT] Run conformance tests and update `REGISTRY.md`.

---

### PH3.9 – Build CRO adapters (4 adapters)
- [ ] **PH3.9** | Status: Not Started

**Related files:** `packages/layer7‑adapters/cro/adapters‑cro‑hotjar/`, `adapters‑cro‑crazyegg/`, `adapters‑cro‑optimizely/`, `adapters‑cro‑vwo/`

**Definition of Done:**
- Implement `CROPort`: `trackHeatmap`, `runABTest`, `getABTestResults`.

**Out of Scope:** Client‑side snippet injection (consent‑gated).

**Rules to Follow:**
- Must use server‑side APIs where available.

**Advanced Coding Patterns:**
- Optimizely: use Full Stack SDK for server‑side A/B testing.

**Anti-Patterns:**
- Do not hardcode experiment IDs; use config.

**DDD:** Adapters implement anti‑corruption layer.  
**TDD:** Conformance tests with mocks.  
**BDD:** Behavior: `runABTest` returns a variant for the given user.  
**Deep Module:** Provider‑specific modules.

#### Subtasks
- [ ] **PH3.9.1** [AGENT] Scaffold `adapters‑cro‑hotjar`. File: `packages/layer7‑adapters/cro/adapters‑cro‑hotjar/`.
- [ ] **PH3.9.2** [AGENT] Scaffold `adapters‑cro‑crazyegg`. File: `packages/layer7‑adapters/cro/adapters‑cro‑crazyegg/`.
- [ ] **PH3.9.3** [AGENT] Scaffold `adapters‑cro‑optimizely`. File: `packages/layer7‑adapters/cro/adapters‑cro‑optimizely/`.
- [ ] **PH3.9.4** [AGENT] Scaffold `adapters‑cro‑vwo`. File: `packages/layer7‑adapters/cro/adapters‑cro‑vwo/`.
- [ ] **PH3.9.5** [AGENT] Run conformance tests and update `REGISTRY.md`.

---

### PH3.10 – Build SEO Data adapters (4 adapters)
- [ ] **PH3.10** | Status: Not Started

**Related files:** `packages/layer7‑adapters/seo/adapters‑seo‑searchconsole/`, `adapters‑seo‑semrush/`, `adapters‑seo‑ahrefs/`, `adapters‑seo‑moz/`

**Definition of Done:**
- Implement `SeoDataPort`: `getKeywordRankings`, `getBacklinks`, `getSiteAudit`.

**Out of Scope:** SEO audit logic (that’s `firm‑seo`).

**Rules to Follow:**
- Must use API keys; no OAuth for these providers.

**Advanced Coding Patterns:**
- Semrush/Ahrefs: REST API with JSON responses.

**Anti-Patterns:**
- Do not exceed rate limits; use caching.

**DDD:** Adapters implement anti‑corruption layer.  
**TDD:** Conformance tests with mocks.  
**BDD:** Behavior: `getKeywordRankings` returns a list of keyword positions.  
**Deep Module:** Provider‑specific modules.

#### Subtasks
- [ ] **PH3.10.1** [AGENT] Scaffold `adapters‑seo‑searchconsole`. File: `packages/layer7‑adapters/seo/adapters‑seo‑searchconsole/`.
- [ ] **PH3.10.2** [AGENT] Scaffold `adapters‑seo‑semrush`. File: `packages/layer7‑adapters/seo/adapters‑seo‑semrush/`.
- [ ] **PH3.10.3** [AGENT] Scaffold `adapters‑seo‑ahrefs`. File: `packages/layer7‑adapters/seo/adapters‑seo‑ahrefs/`.
- [ ] **PH3.10.4** [AGENT] Scaffold `adapters‑seo‑moz`. File: `packages/layer7‑adapters/seo/adapters‑seo‑moz/`.
- [ ] **PH3.10.5** [AGENT] Run conformance tests and update `REGISTRY.md`.

---

### PH3.11 – Build Paid Ads adapters (4 adapters)
- [ ] **PH3.11** | Status: Not Started

**Related files:** `packages/layer7‑adapters/ads/adapters‑ads‑google‑ads/`, `adapters‑ads‑meta‑ads/`, `adapters‑ads‑linkedin‑ads/`, `adapters‑ads‑tiktok‑ads/`

**Definition of Done:**
- Implement `AdsPort`: `createCampaign`, `updateCampaign`, `getPerformance`, `handleWebhook`.

**Out of Scope:** Ad creative management (that’s `firm‑ads`).

**Rules to Follow:**
- OAuth for Google and Meta; API key for TikTok/LinkedIn where applicable.

**Advanced Coding Patterns:**
- Google Ads API (not AdWords) with gRPC or REST.

**Anti-Patterns:**
- Do not use deprecated versions of APIs.

**DDD:** Adapters implement anti‑corruption layer.  
**TDD:** Conformance tests with mocks.  
**BDD:** Behavior: `getPerformance` returns impressions, clicks, spend.  
**Deep Module:** Provider‑specific modules.

#### Subtasks
- [ ] **PH3.11.1** [AGENT] Scaffold `adapters‑ads‑google‑ads`. File: `packages/layer7‑adapters/ads/adapters‑ads‑google‑ads/`.
- [ ] **PH3.11.2** [AGENT] Scaffold `adapters‑ads‑meta‑ads`. File: `packages/layer7‑adapters/ads/adapters‑ads‑meta‑ads/`.
- [ ] **PH3.11.3** [AGENT] Scaffold `adapters‑ads‑linkedin‑ads`. File: `packages/layer7‑adapters/ads/adapters‑ads‑linkedin‑ads/`.
- [ ] **PH3.11.4** [AGENT] Scaffold `adapters‑ads‑tiktok‑ads`. File: `packages/layer7‑adapters/ads/adapters‑ads‑tiktok‑ads/`.
- [ ] **PH3.11.5** [AGENT] Run conformance tests and update `REGISTRY.md`.

---

### PH3.12 – Build CMS adapters (4 adapters)
- [ ] **PH3.12** | Status: Not Started

**Related files:** `packages/layer7‑adapters/cms/adapters‑cms‑sanity/`, `adapters‑cms‑strapi/`, `adapters‑cms‑directus/`, `adapters‑cms‑contentful/`

**Definition of Done:**
- Implement `CmsPort`: `getContent`, `publishContent`, `handleWebhook`.

**Out of Scope:** Content editing UI.

**Rules to Follow:**
- Webhook for content updates to invalidate cache.

**Advanced Coding Patterns:**
- GraphQL or REST clients.

**Anti-Patterns:**
- Do not embed raw API keys in the adapter.

**DDD:** Adapters implement anti‑corruption layer.  
**TDD:** Conformance tests with mocks.  
**BDD:** Behavior: `getContent` returns structured content; webhook triggers cache invalidation.  
**Deep Module:** Provider‑specific modules.

#### Subtasks
- [ ] **PH3.12.1** [AGENT] Scaffold `adapters‑cms‑sanity`. File: `packages/layer7‑adapters/cms/adapters‑cms‑sanity/`.
- [ ] **PH3.12.2** [AGENT] Scaffold `adapters‑cms‑strapi`. File: `packages/layer7‑adapters/cms/adapters‑cms‑strapi/`.
- [ ] **PH3.12.3** [AGENT] Scaffold `adapters‑cms‑directus`. File: `packages/layer7‑adapters/cms/adapters‑cms‑directus/`.
- [ ] **PH3.12.4** [AGENT] Scaffold `adapters‑cms‑contentful`. File: `packages/layer7‑adapters/cms/adapters‑cms‑contentful/`.
- [ ] **PH3.12.5** [AGENT] Run conformance tests and update `REGISTRY.md`.

---

### PH3.13 – Build Booking adapters (4 adapters)
- [ ] **PH3.13** | Status: Not Started

**Related files:** `packages/layer7‑adapters/booking/adapters‑booking‑calcom/`, `adapters‑booking‑google‑calendar/`, `adapters‑booking‑outlook/`, `adapters‑booking‑acuity/`

**Definition of Done:**
- Implement `BookingPort`: `getAvailability`, `createBooking`, `cancelBooking`, `handleWebhook`.

**Out of Scope:** Appointment logic (that’s `firm‑appointments`).

**Rules to Follow:**
- Must use OAuth for calendar access.

**Advanced Coding Patterns:**
- Google Calendar API v3.
- Cal.com API v2.

**Anti-Patterns:**
- Do not expose customer calendars to other tenants.

**DDD:** Adapters implement anti‑corruption layer.  
**TDD:** Conformance tests with mocks.  
**BDD:** Behavior: `getAvailability` returns open slots; webhook confirms booking.  
**Deep Module:** Provider‑specific modules.

#### Subtasks
- [ ] **PH3.13.1** [AGENT] Scaffold `adapters‑booking‑calcom`. File: `packages/layer7‑adapters/booking/adapters‑booking‑calcom/`.
- [ ] **PH3.13.2** [AGENT] Scaffold `adapters‑booking‑google‑calendar`. File: `packages/layer7‑adapters/booking/adapters‑booking‑google‑calendar/`.
- [ ] **PH3.13.3** [AGENT] Scaffold `adapters‑booking‑outlook`. File: `packages/layer7‑adapters/booking/adapters‑booking‑outlook/`.
- [ ] **PH3.13.4** [AGENT] Scaffold `adapters‑booking‑acuity`. File: `packages/layer7‑adapters/booking/adapters‑booking‑acuity/`.
- [ ] **PH3.13.5** [AGENT] Run conformance tests and update `REGISTRY.md`.

---

### PH3.14 – Build Accounting adapters (3 adapters)
- [ ] **PH3.14** | Status: Not Started

**Related files:** `packages/layer7‑adapters/accounting/adapters‑accounting‑quickbooks/`, `adapters‑accounting‑xero/`, `adapters‑accounting‑freshbooks/`

**Definition of Done:**
- Implement `AccountingPort`: `createInvoice`, `syncTransactions`, `getReport`.

**Out of Scope:** Billing logic (that’s `firm‑billing`).

**Rules to Follow:**
- OAuth where supported.

**Advanced Coding Patterns:**
- QuickBooks Online API.

**Anti-Patterns:**
- Do not store accounting credentials in plaintext.

**DDD:** Adapters implement anti‑corruption layer.  
**TDD:** Conformance tests with mocks.  
**BDD:** Behavior: `createInvoice` returns the accounting system’s invoice ID.  
**Deep Module:** Provider‑specific modules.

#### Subtasks
- [ ] **PH3.14.1** [AGENT] Scaffold `adapters‑accounting‑quickbooks`. File: `packages/layer7‑adapters/accounting/adapters‑accounting‑quickbooks/`.
- [ ] **PH3.14.2** [AGENT] Scaffold `adapters‑accounting‑xero`. File: `packages/layer7‑adapters/accounting/adapters‑accounting‑xero/`.
- [ ] **PH3.14.3** [AGENT] Scaffold `adapters‑accounting‑freshbooks`. File: `packages/layer7‑adapters/accounting/adapters‑accounting‑freshbooks/`.
- [ ] **PH3.14.4** [AGENT] Run conformance tests and update `REGISTRY.md`.

---

### PH3.15 – Build Social adapters (4 adapters)
- [ ] **PH3.15** | Status: Not Started

**Related files:** `packages/layer7‑adapters/social/adapters‑social‑meta/`, `adapters‑social‑twitter/`, `adapters‑social‑linkedin/`, `adapters‑social‑tiktok/`

**Definition of Done:**
- Implement `SocialPort`: `publishPost`, `getEngagement`, `handleWebhook`.

**Out of Scope:** Social listening (that’s `firm‑social`).

**Rules to Follow:**
- OAuth with token refresh.
- Webhook for incoming DMs routed to `firm‑inbox`.

**Advanced Coding Patterns:**
- Meta Graph API.

**Anti-Patterns:**
- Do not post without explicit user action (human approval gate in `firm‑social`).

**DDD:** Adapters implement anti‑corruption layer.  
**TDD:** Conformance tests with mocks.  
**BDD:** Behavior: `publishPost` returns a post ID; `getEngagement` returns likes/comments.  
**Deep Module:** Provider‑specific modules.

#### Subtasks
- [ ] **PH3.15.1** [AGENT] Scaffold `adapters‑social‑meta`. File: `packages/layer7‑adapters/social/adapters‑social‑meta/`.
- [ ] **PH3.15.2** [AGENT] Scaffold `adapters‑social‑twitter`. File: `packages/layer7‑adapters/social/adapters‑social‑twitter/`.
- [ ] **PH3.15.3** [AGENT] Scaffold `adapters‑social‑linkedin`. File: `packages/layer7‑adapters/social/adapters‑social‑linkedin/`.
- [ ] **PH3.15.4** [AGENT] Scaffold `adapters‑social‑tiktok`. File: `packages/layer7‑adapters/social/adapters‑social‑tiktok/`.
- [ ] **PH3.15.5** [AGENT] Run conformance tests and update `REGISTRY.md`.

---

### PH3.16 – Build Review adapters (3 adapters)
- [ ] **PH3.16** | Status: Not Started

**Related files:** `packages/layer7‑adapters/reviews/adapters‑reviews‑google‑business/`, `adapters‑reviews‑trustpilot/`, `adapters‑reviews‑yelp/`

**Definition of Done:**
- Implement `ReviewPort`: `getReviews`, `respondToReview`, `handleWebhook`.

**Out of Scope:** Review monitoring (that’s `firm‑reputation`).

**Rules to Follow:**
- Must authenticate with OAuth or API key.

**Advanced Coding Patterns:**
- Google My Business API.

**Anti-Patterns:**
- Do not auto‑respond without human approval (enforced by `firm‑reputation`).

**DDD:** Adapters implement anti‑corruption layer.  
**TDD:** Conformance tests with mocks.  
**BDD:** Behavior: `getReviews` returns a list of reviews with ratings.  
**Deep Module:** Provider‑specific modules.

#### Subtasks
- [ ] **PH3.16.1** [AGENT] Scaffold `adapters‑reviews‑google‑business`. File: `packages/layer7‑adapters/reviews/adapters‑reviews‑google‑business/`.
- [ ] **PH3.16.2** [AGENT] Scaffold `adapters‑reviews‑trustpilot`. File: `packages/layer7‑adapters/reviews/adapters‑reviews‑trustpilot/`.
- [ ] **PH3.16.3** [AGENT] Scaffold `adapters‑reviews‑yelp`. File: `packages/layer7‑adapters/reviews/adapters‑reviews‑yelp/`.
- [ ] **PH3.16.4** [AGENT] Run conformance tests and update `REGISTRY.md`.

---

### PH3.17 – Build Proposal/Signing adapters (4 adapters)
- [ ] **PH3.17** | Status: Not Started

**Related files:** `packages/layer7‑adapters/proposals/adapters‑proposals‑pandadoc/`, `adapters‑proposals‑qwilr/`, `adapters‑proposals‑docusign/`, `adapters‑proposals‑dropbox‑sign/`

**Definition of Done:**
- Implement `ProposalPort` and `ESignPort`: `createProposal`, `sendForSignature`, `getStatus`, `handleWebhook`.

**Out of Scope:** Proposal content management (that’s `firm‑documents`).

**Rules to Follow:**
- Webhook for signature status updates.

**Advanced Coding Patterns:**
- DocuSign: use eSignature REST API with OAuth.

**Anti-Patterns:**
- Do not store signed documents outside of `firm‑media`.

**DDD:** Adapters implement anti‑corruption layer.  
**TDD:** Conformance tests with sandboxes.  
**BDD:** Behavior: `sendForSignature` returns an envelope ID; webhook marks as signed.  
**Deep Module:** Provider‑specific modules.

#### Subtasks
- [ ] **PH3.17.1** [AGENT] Scaffold `adapters‑proposals‑pandadoc`. File: `packages/layer7‑adapters/proposals/adapters‑proposals‑pandadoc/`.
- [ ] **PH3.17.2** [AGENT] Scaffold `adapters‑proposals‑qwilr`. File: `packages/layer7‑adapters/proposals/adapters‑proposals‑qwilr/`.
- [ ] **PH3.17.3** [AGENT] Scaffold `adapters‑proposals‑docusign`. File: `packages/layer7‑adapters/proposals/adapters‑proposals‑docusign/`.
- [ ] **PH3.17.4** [AGENT] Scaffold `adapters‑proposals‑dropbox‑sign`. File: `packages/layer7‑adapters/proposals/adapters‑proposals‑dropbox‑sign/`.
- [ ] **PH3.17.5** [AGENT] Run conformance tests and update `REGISTRY.md`.

---

### PH3.18 – Build Project Management adapters (4 adapters)
- [ ] **PH3.18** | Status: Not Started

**Related files:** `packages/layer7‑adapters/project‑mgmt/adapters‑project‑mgmt‑asana/`, `adapters‑project‑mgmt‑trello/`, `adapters‑project‑mgmt‑monday/`, `adapters‑project‑mgmt‑clickup/`

**Definition of Done:**
- Implement `ProjectMgmtPort`: `createProject`, `syncTasks`, `handleWebhook`.

**Out of Scope:** Project management logic (that’s `firm‑projects`).

**Rules to Follow:**
- OAuth or API key authentication.

**Advanced Coding Patterns:**
- Asana: use Asana Node SDK.

**Anti-Patterns:**
- Do not sync sensitive project data without encryption.

**DDD:** Adapters implement anti‑corruption layer.  
**TDD:** Conformance tests with mocks.  
**BDD:** Behavior: `syncTasks` pushes/updates tasks in the external tool.  
**Deep Module:** Provider‑specific modules.

#### Subtasks
- [ ] **PH3.18.1** [AGENT] Scaffold `adapters‑project‑mgmt‑asana`. File: `packages/layer7‑adapters/project‑mgmt/adapters‑project‑mgmt‑asana/`.
- [ ] **PH3.18.2** [AGENT] Scaffold `adapters‑project‑mgmt‑trello`. File: `packages/layer7‑adapters/project‑mgmt/adapters‑project‑mgmt‑trello/`.
- [ ] **PH3.18.3** [AGENT] Scaffold `adapters‑project‑mgmt‑monday`. File: `packages/layer7‑adapters/project‑mgmt/adapters‑project‑mgmt‑monday/`.
- [ ] **PH3.18.4** [AGENT] Scaffold `adapters‑project‑mgmt‑clickup`. File: `packages/layer7‑adapters/project‑mgmt/adapters‑project‑mgmt‑clickup/`.
- [ ] **PH3.18.5** [AGENT] Run conformance tests and update `REGISTRY.md`.

---

### PH3.19 – Build Design adapters (3 adapters)
- [ ] **PH3.19** | Status: Not Started

**Related files:** `packages/layer7‑adapters/design/adapters‑design‑figma/`, `adapters‑design‑canva/`, `adapters‑design‑adobe‑cc/`

**Definition of Done:**
- Implement `DesignPort`: `getAssets`, `exportDesign`.

**Out of Scope:** Design collaboration UI.

**Rules to Follow:**
- OAuth for Figma, Adobe.

**Advanced Coding Patterns:**
- Figma REST API.

**Anti-Patterns:**
- Do not store design files outside of `firm‑media`.

**DDD:** Adapters implement anti‑corruption layer.  
**TDD:** Conformance tests with mocks.  
**BDD:** Behavior: `getAssets` returns a list of exportable assets.  
**Deep Module:** Provider‑specific modules.

#### Subtasks
- [ ] **PH3.19.1** [AGENT] Scaffold `adapters‑design‑figma`. File: `packages/layer7‑adapters/design/adapters‑design‑figma/`.
- [ ] **PH3.19.2** [AGENT] Scaffold `adapters‑design‑canva`. File: `packages/layer7‑adapters/design/adapters‑design‑canva/`.
- [ ] **PH3.19.3** [AGENT] Scaffold `adapters‑design‑adobe‑cc`. File: `packages/layer7‑adapters/design/adapters‑design‑adobe‑cc/`.
- [ ] **PH3.19.4** [AGENT] Run conformance tests and update `REGISTRY.md`.

---

### PH3.20 – Build Video adapters (4 adapters)
- [ ] **PH3.20** | Status: Not Started

**Related files:** `packages/layer7‑adapters/video/adapters‑video‑youtube/`, `adapters‑video‑vimeo/`, `adapters‑video‑wistia/`, `adapters‑video‑mux/`

**Definition of Done:**
- Implement `VideoPort`: `uploadVideo`, `getVideoUrl`, `getAnalytics`.

**Out of Scope:** Video editing.

**Rules to Follow:**
- Must use presigned URLs or direct upload.

**Advanced Coding Patterns:**
- Mux: direct upload URL generation.

**Anti-Patterns:**
- Do not serve video files from application servers.

**DDD:** Adapters implement anti‑corruption layer.  
**TDD:** Conformance tests with mocks.  
**BDD:** Behavior: `uploadVideo` returns a playback URL.  
**Deep Module:** Provider‑specific modules.

#### Subtasks
- [ ] **PH3.20.1** [AGENT] Scaffold `adapters‑video‑youtube`. File: `packages/layer7‑adapters/video/adapters‑video‑youtube/`.
- [ ] **PH3.20.2** [AGENT] Scaffold `adapters‑video‑vimeo`. File: `packages/layer7‑adapters/video/adapters‑video‑vimeo/`.
- [ ] **PH3.20.3** [AGENT] Scaffold `adapters‑video‑wistia`. File: `packages/layer7‑adapters/video/adapters‑video‑wistia/`.
- [ ] **PH3.20.4** [AGENT] Scaffold `adapters‑video‑mux`. File: `packages/layer7‑adapters/video/adapters‑video‑mux/`.
- [ ] **PH3.20.5** [AGENT] Run conformance tests and update `REGISTRY.md`.

---

### PH3.21 – Build Chat adapters (4 adapters)
- [ ] **PH3.21** | Status: Not Started

**Related files:** `packages/layer7‑adapters/chat/adapters‑chat‑intercom/`, `adapters‑chat‑drift/`, `adapters‑chat‑tidio/`, `adapters‑chat‑whatsapp/`

**Definition of Done:**
- Implement `ChatPort`: `sendMessage`, `handleWebhook`, `getConversation`.

**Out of Scope:** Chat UI (that’s the unified inbox app).

**Rules to Follow:**
- Webhook for incoming messages routed to `firm‑inbox`.

**Advanced Coding Patterns:**
- WhatsApp Business API.

**Anti-Patterns:**
- Do not store chat transcripts without consent.

**DDD:** Adapters implement anti‑corruption layer.  
**TDD:** Conformance tests with mocks.  
**BDD:** Behavior: `sendMessage` delivers a message to the external chat platform.  
**Deep Module:** Provider‑specific modules.

#### Subtasks
- [ ] **PH3.21.1** [AGENT] Scaffold `adapters‑chat‑intercom`. File: `packages/layer7‑adapters/chat/adapters‑chat‑intercom/`.
- [ ] **PH3.21.2** [AGENT] Scaffold `adapters‑chat‑drift`. File: `packages/layer7‑adapters/chat/adapters‑chat‑drift/`.
- [ ] **PH3.21.3** [AGENT] Scaffold `adapters‑chat‑tidio`. File: `packages/layer7‑adapters/chat/adapters‑chat‑tidio/`.
- [ ] **PH3.21.4** [AGENT] Scaffold `adapters‑chat‑whatsapp`. File: `packages/layer7‑adapters/chat/adapters‑chat‑whatsapp/`.
- [ ] **PH3.21.5** [AGENT] Run conformance tests and update `REGISTRY.md`.

---

### PH3.22 – Build SCIM adapters (2 adapters)
- [ ] **PH3.22** | Status: Not Started

**Related files:** `packages/layer7‑adapters/scim/adapters‑scim‑okta/`, `adapters‑scim‑azure‑ad/`

**Definition of Done:**
- Implement `SCIMPort`: `/scim/v2/Users`, `/scim/v2/Groups` endpoints for enterprise provisioning.

**Out of Scope:** SCIM client UI.

**Rules to Follow:**
- Follow RFC 7643/7644 standards.

**Advanced Coding Patterns:**
- Okta: SCIM 2.0 API with bearer token.

**Anti-Patterns:**
- Do not provision users without validating the SCIM request signature.

**DDD:** Adapters implement anti‑corruption layer at the identity management boundary.  
**TDD:** Conformance tests with SCIM protocol compliance checks.  
**BDD:** Behavior: a SCIM POST to `/Users` creates a user in the platform.  
**Deep Module:** Provider‑specific modules.

#### Subtasks
- [ ] **PH3.22.1** [AGENT] Scaffold `adapters‑scim‑okta`. File: `packages/layer7‑adapters/scim/adapters‑scim‑okta/`.
- [ ] **PH3.22.2** [AGENT] Scaffold `adapters‑scim‑azure‑ad`. File: `packages/layer7‑adapters/scim/adapters‑scim‑azure‑ad/`.
- [ ] **PH3.22.3** [AGENT] Run conformance tests and update `REGISTRY.md`.

---

### PH3.23 – Build remaining Email Validation adapters (2 adapters)
- [ ] **PH3.23** | Status: Not Started

**Related files:** `packages/layer7‑adapters/email‑validation/adapters‑email‑validation‑neverbounce/`, `adapters‑email‑validation‑kickbox/`

**Definition of Done:**
- Implement `EmailValidationPort` for NeverBounce and Kickbox, similar to ZeroBounce.

**Out of Scope:** Already covered by ZeroBounce in PH3.1.

**Rules to Follow:** Same as other email validation adapters.

**Advanced Coding Patterns:** REST API with API key auth.

**Anti-Patterns:** Do not validate emails on every send without caching results.

**DDD:** Adapters implement anti‑corruption layer.  
**TDD:** Conformance tests.  
**BDD:** Behavior: `validateEmail` returns a result with risk score.  
**Deep Module:** Provider‑specific modules.

#### Subtasks
- [ ] **PH3.23.1** [AGENT] Scaffold `adapters‑email‑validation‑neverbounce`. File: `packages/layer7‑adapters/email‑validation/adapters‑email‑validation‑neverbounce/`.
- [ ] **PH3.23.2** [AGENT] Scaffold `adapters‑email‑validation‑kickbox`. File: `packages/layer7‑adapters/email‑validation/adapters‑email‑validation‑kickbox/`.
- [ ] **PH3.23.3** [AGENT] Run conformance tests and update `REGISTRY.md`.

---

### PH3.24 – Build remaining PDF Generator adapters (1 adapter)
- [ ] **PH3.24** | Status: Not Started

**Related files:** `packages/layer7‑adapters/pdf‑generator/adapters‑pdf‑generator‑pdfshift/`

**Definition of Done:**
- Implement `PdfGeneratorPort` for PdfShift (cloud API).

**Out of Scope:** Already covered by Puppeteer in PH3.1.

**Rules to Follow:** Same as other adapters.

**Advanced Coding Patterns:** REST API with API key.

**Anti-Patterns:** Do not send sensitive HTML to the cloud provider without encryption.

**DDD:** Adapters implement anti‑corruption layer.  
**TDD:** Conformance tests.  
**BDD:** Behavior: `generatePdf(html)` returns a PDF buffer via PdfShift.  
**Deep Module:** Provider‑specific module.

#### Subtasks
- [ ] **PH3.24.1** [AGENT] Scaffold `adapters‑pdf‑generator‑pdfshift`. File: `packages/layer7‑adapters/pdf‑generator/adapters‑pdf‑generator‑pdfshift/`.
- [ ] **PH3.24.2** [AGENT] Run conformance test and update `REGISTRY.md`.

---

### PH3.25 – Build remaining Video Conferencing adapters (1 adapter)
- [ ] **PH3.25** | Status: Not Started

**Related files:** `packages/layer7‑adapters/videoconferencing/adapters‑videoconferencing‑microsoft‑teams/`

**Definition of Done:**
- Implement `VideoConferencingPort` for Microsoft Teams.

**Out of Scope:** Zoom and Google Meet already in PH3.1.

**Rules to Follow:** OAuth with Microsoft Graph API.

**Advanced Coding Patterns:** Create online meeting endpoint.

**Anti-Patterns:** Do not hardcode tenant‑specific Teams settings.

**DDD:** Adapter implements anti‑corruption layer.  
**TDD:** Conformance tests with mock.  
**BDD:** Behavior: `createMeeting` returns a Teams meeting link.  
**Deep Module:** Provider‑specific module.

#### Subtasks
- [ ] **PH3.25.1** [AGENT] Scaffold `adapters‑videoconferencing‑microsoft‑teams`. File: `packages/layer7‑adapters/videoconferencing/adapters‑videoconferencing‑microsoft‑teams/`.
- [ ] **PH3.25.2** [AGENT] Run conformance test and update `REGISTRY.md`.

---

Phase 4 of the updated TODO.md follows. Each parent task covers one Tier B operations package, with full sections and subtasks.

---

## Phase 4: Operations Layer (Tier B – 8 packages)

*All business operations packages. Each depends on the Tier A infrastructure from Phase 2 and relevant adapters from Phase 3. Build order respects dependency chains; `firm‑provisioning` and `firm‑compliance` should come first because they underpin tenant lifecycle and regulatory safety.*

---

### PH4.1 – Build `firm-provisioning` (tenant lifecycle saga)
- [ ] **PH4.1** | Status: Not Started

**Related files:** `packages/layer6‑features/firm‑provisioning/`

**Definition of Done:**
- Exports `createTenant(params)`, `upgradePlan(tenantId, newPlan)`, `suspendTenant(tenantId)`, `offboardTenant(tenantId)`.
- Each operation is a saga (via `firm‑bus`) with idempotent steps and compensating actions.
- `createTenant` saga: creates tenant record, seeds default config via `firm‑tenant‑config`, creates default admin user via `firm‑auth`, sends welcome notification via `firm‑notifications`, creates CRM company via CRM adapter.
- Upgrade saga: changes plan, adjusts `firm‑metering` quotas, emits `tenant.plan.upgraded`.
- Offboarding: suspends tenant, schedules GDPR erasure via `firm‑compliance`, archives data, sends confirmation.
- Dry‑run mode for all operations: `dryRun: true` performs validation and logs what would happen without executing.
- Provisioning health check: validates that all required steps can be performed before starting.

**Out of Scope:** Actual plan definition (that’s `firm‑subscriptions`). Billing changes on upgrade (handled by `firm‑billing` subscribing to the event).

**Rules to Follow:**
- Every step must be compensable; if a step fails, previous steps are rolled back.
- Must audit every lifecycle event via `firm‑audit`.
- Must use `firm‑db‑client` for tenant record operations.
- Dry‑run must never produce side effects.

**Advanced Coding Patterns:**
- Saga orchestration using `firm‑bus.saga()` with explicit compensation registration.
- Idempotency keys based on `tenantId + operation` to prevent duplicate provisioning.

**Anti-Patterns:**
- Do not provision a tenant without validating that the slug/subdomain is available.
- Do not leave a partially created tenant on saga failure; compensate fully.

**DDD:** `firm‑provisioning` is the domain service for the tenant lifecycle aggregate.  
**TDD:** Test successful creation saga, upgrade saga, offboarding saga; test dry‑run produces no side effects; test saga compensation on step failure.  
**BDD:** Behavior: calling `createTenant` with valid data results in a fully operational tenant with default config, admin user, and welcome email.  
**Deep Module:** The module hides multi‑step saga complexity behind simple `createTenant` / `upgradePlan` / `offboardTenant` commands.

#### Subtasks
- [ ] **PH4.1.1** [AGENT] Create package scaffold: `packages/layer6‑features/firm‑provisioning/`.
- [ ] **PH4.1.2** [AGENT] Implement `createTenant` saga with all steps and compensation. File: `packages/layer6‑features/firm‑provisioning/src/create‑tenant.ts`.
- [ ] **PH4.1.3** [AGENT] Implement `upgradePlan` saga. File: `packages/layer6‑features/firm‑provisioning/src/upgrade‑plan.ts`.
- [ ] **PH4.1.4** [AGENT] Implement `suspendTenant` saga. File: `packages/layer6‑features/firm‑provisioning/src/suspend.ts`.
- [ ] **PH4.1.5** [AGENT] Implement `offboardTenant` saga that coordinates with `firm‑compliance`. File: `packages/layer6‑features/firm‑provisioning/src/offboard.ts`.
- [ ] **PH4.1.6** [AGENT] Implement dry‑run mode for all operations. File: `packages/layer6‑features/firm‑provisioning/src/dry‑run.ts`.
- [ ] **PH4.1.7** [AGENT] Implement provisioning health check. File: `packages/layer6‑features/firm‑provisioning/src/health.ts`.
- [ ] **PH4.1.8** [AGENT] Write integration tests with real database and mock adapters. File: `packages/layer6‑features/firm‑provisioning/tests/`.

---

### PH4.2 – Build `firm-compliance` (GDPR/CCPA engine)
- [ ] **PH4.2** | Status: Not Started

**Related files:** `packages/layer6‑features/firm‑compliance/`

**Definition of Done:**
- Exports `requestErasure(dataSubjectId)`, `requestExport(dataSubjectId)`, `generateArticle30Report(tenantId)`.
- Erasure saga (2‑phase):
  - Phase 1 (immediate): anonymise all PII in DB (names, emails, phones, IPs). Emits `erasure.anonymised` and `audit.record`.
  - Phase 2 (after retention window, e.g., 30 days): hard delete all records. Emits `erasure.hard_deleted`.
- Data export: collects all data for a subject across all tables, packages into a machine‑readable format (JSON/CSV), stores in `firm‑media`, generates a download link.
- Data residency enforcement: check that a tenant’s data is stored only in their designated region (GDPR Art. 32). Fails if cross‑region writes are detected.
- Art. 30 report generation: outputs a structured compliance report.

**Out of Scope:** Consent management (that’s `firm‑consent`). Actual deletion after export (handled by the erasure saga).

**Rules to Follow:**
- Phase 1 must complete within 72 hours of request (regulatory requirement).
- Must use `firm‑audit` for all erasure/export actions.
- Anonymisation must use `firm‑crypto` for secure hashing where necessary.
- Data residency check must run periodically (via cron in `firm‑bus`).

**Advanced Coding Patterns:**
- 2‑phase saga with a scheduled delayed job (via `firm‑bus.cron` or delayed event).
- PII detection and anonymisation using pattern matching and field‑path rules.

**Anti-Patterns:**
- Do not permanently delete data in Phase 1 before export is confirmed.
- Do not skip the `gpcApplied` flag when building compliance reports.

**DDD:** `firm‑compliance` is a domain service in the privacy bounded context.  
**TDD:** Test erasure saga phases, data export completeness, residency check detection of cross‑region data.  
**BDD:** Behavior: a data subject request triggers immediate anonymisation, followed by a scheduled hard delete; the subject receives a download link.  
**Deep Module:** The module encapsulates complex GDPR workflows behind simple `requestErasure` / `requestExport` commands.

#### Subtasks
- [ ] **PH4.2.1** [AGENT] Create package scaffold: `packages/layer6‑features/firm‑compliance/`.
- [ ] **PH4.2.2** [AGENT] Implement `requestErasure` that starts the 2‑phase saga. File: `packages/layer6‑features/firm‑compliance/src/erasure.ts`.
- [ ] **PH4.2.3** [AGENT] Implement Phase 1 anonymisation logic (PII pattern detection and hashing/replacement). File: `packages/layer6‑features/firm‑compliance/src/anonymise.ts`.
- [ ] **PH4.2.4** [AGENT] Implement Phase 2 hard‑delete scheduled job. File: `packages/layer6‑features/firm‑compliance/src/hard‑delete.ts`.
- [ ] **PH4.2.5** [AGENT] Implement `requestExport` data collection and packaging. File: `packages/layer6‑features/firm‑compliance/src/export.ts`.
- [ ] **PH4.2.6** [AGENT] Implement data residency enforcement check. File: `packages/layer6‑features/firm‑compliance/src/residency.ts`.
- [ ] **PH4.2.7** [AGENT] Implement Art. 30 report generation. File: `packages/layer6‑features/firm‑compliance/src/article‑30.ts`.
- [ ] **PH4.2.8** [AGENT] Write integration tests for erasure, export, and residency. File: `packages/layer6‑features/firm‑compliance/tests/`.

---

### PH4.3 – Build `firm-projects` (project/task management, kanban, time tracking)
- [ ] **PH4.3** | Status: Not Started

**Related files:** `packages/layer6‑features/firm‑projects/`

**Definition of Done:**
- Exports CRUD for projects and tasks, kanban board operations (move task between columns), time tracking (start/stop timer, log hours), billable/non‑billable flagging.
- Task dependency tracking: a task can have prerequisites; marking a task complete checks if dependents can be unblocked.
- Client‑facing visibility: tasks can be marked as `internal` or `visible` to the client (sub‑account).
- Time entries aggregate per project and per user for invoicing (emits `time.recorded` event for `firm‑billing` to consume).
- Integration with `firm‑notifications` for task assignment and deadline reminders.

**Out of Scope:** Client portal view (that’s `firm‑portal`). Invoicing (that’s `firm‑billing`).

**Rules to Follow:**
- All data access via `firm‑db‑client`. Tenant isolation via RLS.
- Must use `firm‑validators` for input validation.
- Time tracking entries must be immutable once invoiced.

**Advanced Coding Patterns:**
- State machine for task status transitions (todo → in‑progress → review → done).
- Event‑driven notifications on task assignment.

**Anti-Patterns:**
- Do not allow a task to be deleted if time has been logged against it; archive instead.

**DDD:** Projects and tasks are an aggregate; time entries are part of the same bounded context.  
**TDD:** Test task CRUD, column movement, dependency gating, time tracking start/stop, immutability after invoicing.  
**BDD:** Behavior: moving a task to "done" when all its dependents are complete unblocks the next task and notifies the assignee.  
**Deep Module:** `firm‑projects` hides the complexity of task state, dependencies, and time tracking behind a clean API.

#### Subtasks
- [ ] **PH4.3.1** [AGENT] Create package scaffold: `packages/layer6‑features/firm‑projects/`.
- [ ] **PH4.3.2** [AGENT] Implement project CRUD. File: `packages/layer6‑features/firm‑projects/src/project.ts`.
- [ ] **PH4.3.3** [AGENT] Implement task CRUD with status state machine. File: `packages/layer6‑features/firm‑projects/src/task.ts`.
- [ ] **PH4.3.4** [AGENT] Implement kanban board column management. File: `packages/layer6‑features/firm‑projects/src/kanban.ts`.
- [ ] **PH4.3.5** [AGENT] Implement task dependency tracking. File: `packages/layer6‑features/firm‑projects/src/dependencies.ts`.
- [ ] **PH4.3.6** [AGENT] Implement time tracking (start/stop/manual entry) and billable flagging. File: `packages/layer6‑features/firm‑projects/src/time‑tracking.ts`.
- [ ] **PH4.3.7** [AGENT] Implement client‑visibility flags and event emission for invoicing. File: `packages/layer6‑features/firm‑projects/src/visibility.ts`.
- [ ] **PH4.3.8** [AGENT] Write tests. File: `packages/layer6‑features/firm‑projects/tests/`.

---

### PH4.4 – Build `firm-sales-pipeline` (deal pipeline, forecasting)
- [ ] **PH4.4** | Status: Not Started

**Related files:** `packages/layer6‑features/firm‑sales‑pipeline/`

**Definition of Done:**
- Exports `createDeal`, `moveDealStage`, `getPipeline(tenantId)`, `getForecast(tenantId)`.
- Deal stages: leads → qualified → proposal → negotiation → won/lost.
- Automated stage transitions: when a proposal is signed (event from `firm‑documents`), deal moves to `won`.
- Lead scoring integration: calls `firm‑ai.leadScoring` to prioritise deals.
- Forecasting: predicts revenue for period based on deal value × stage probability.

**Out of Scope:** Lead management (that’s part of CRM sync and forms). Actual AI scoring implementation (uses `firm‑ai`).

**Rules to Follow:**
- Must use `firm‑db‑client` and RLS.
- Stage transition must be validated (e.g., can’t go from `won` back to `qualified`).

**Advanced Coding Patterns:**
- State machine for deal stages.
- Weighted forecast algorithm.

**Anti-Patterns:**
- Do not allow deleting a deal that has associated invoices or time entries; close as `lost` instead.

**DDD:** Sales pipeline is a core domain aggregate.  
**TDD:** Test deal creation, stage transitions, forecast calculation, event‑driven transition on proposal signed.  
**BDD:** Behavior: a deal in `proposal` stage automatically moves to `won` when the proposal is signed.  
**Deep Module:** `firm‑sales‑pipeline` hides forecasting math and stage logic behind a simple API.

#### Subtasks
- [ ] **PH4.4.1** [AGENT] Create package scaffold: `packages/layer6‑features/firm‑sales‑pipeline/`.
- [ ] **PH4.4.2** [AGENT] Implement deal CRUD with stage state machine. File: `packages/layer6‑features/firm‑sales‑pipeline/src/deal.ts`.
- [ ] **PH4.4.3** [AGENT] Implement `moveDealStage` with validation. File: `packages/layer6‑features/firm‑sales‑pipeline/src/stages.ts`.
- [ ] **PH4.4.4** [AGENT] Implement automated stage transition handler (subscribes to `document.signed`). File: `packages/layer6‑features/firm‑sales‑pipeline/src/automation.ts`.
- [ ] **PH4.4.5** [AGENT] Implement lead scoring integration with `firm‑ai`. File: `packages/layer6‑features/firm‑sales‑pipeline/src/scoring.ts`.
- [ ] **PH4.4.6** [AGENT] Implement `getForecast` with weighted pipeline calculation. File: `packages/layer6‑features/firm‑sales‑pipeline/src/forecast.ts`.
- [ ] **PH4.4.7** [AGENT] Write tests. File: `packages/layer6‑features/firm‑sales‑pipeline/tests/`.

---

### PH4.5 – Build `firm-documents` (PDF generation, e‑signature, proposals)
- [ ] **PH4.5** | Status: Not Started

**Related files:** `packages/layer6‑features/firm‑documents/`

**Definition of Done:**
- Exports `createDocument(templateId, variables)`, `requestSignature(documentId, signers)`, `getDocumentStatus(documentId)`.
- PDF generation via `firm‑template‑engine` (Handlebars) and PDF adapter (Puppeteer/PdfShift).
- E‑signature support with multi‑signatory ordering (e.g., signer 1 then signer 2).
- Collaborative internal review: comments on documents before sending.
- Document analytics: open/view tracking (consent‑gated).
- Proposals are a subtype of document (not a separate package); proposal‑specific fields like `validUntil`, `acceptanceLink`.

**Out of Scope:** E‑signature provider implementation (that’s in adapters). Document storage (uses `firm‑media`).

**Rules to Follow:**
- PDF generation must be asynchronous via `firm‑bus` and `workers/`.
- E‑signature webhook must follow verify‑deduplicate‑process.
- Must audit all signature events.

**Advanced Coding Patterns:**
- Document state machine: draft → review → sent → signed / declined.
- Multi‑signatory with sequential ordering.

**Anti-Patterns:**
- Do not allow a document to be sent for signature if it’s still in `draft`.
- Do not store sensitive contract data outside of the audit trail.

**DDD:** Documents is an aggregate; e‑signature is a domain service within this bounded context.  
**TDD:** Test document creation, rendering pipeline, signature request, webhook processing, sequential signing.  
**BDD:** Behavior: a proposal document sent to two signatories is only fully signed after both sign in order.  
**Deep Module:** `firm‑documents` hides PDF rendering, signature orchestration, and analytics behind simple commands.

#### Subtasks
- [ ] **PH4.5.1** [AGENT] Create package scaffold: `packages/layer6‑features/firm‑documents/`.
- [ ] **PH4.5.2** [AGENT] Implement document CRUD with state machine. File: `packages/layer6‑features/firm‑documents/src/document.ts`.
- [ ] **PH4.5.3** [AGENT] Implement PDF generation pipeline using `firm‑template‑engine` and PDF adapter. File: `packages/layer6‑features/firm‑documents/src/render.ts`.
- [ ] **PH4.5.4** [AGENT] Implement e‑signature request with multi‑signatory ordering. File: `packages/layer6‑features/firm‑documents/src/signature.ts`.
- [ ] **PH4.5.5** [AGENT] Implement collaborative review comments. File: `packages/layer6‑features/firm‑documents/src/review.ts`.
- [ ] **PH4.5.6** [AGENT] Implement document analytics (open/view tracking). File: `packages/layer6‑features/firm‑documents/src/analytics.ts`.
- [ ] **PH4.5.7** [AGENT] Implement proposal‑specific fields and lifecycle. File: `packages/layer6‑features/firm‑documents/src/proposal.ts`.
- [ ] **PH4.5.8** [AGENT] Write tests with mock PDF and signature adapters. File: `packages/layer6‑features/firm‑documents/tests/`.

---

### PH4.6 – Build `firm-appointments` (booking pages, calendar, reminders)
- [ ] **PH4.6** | Status: Not Started

**Related files:** `packages/layer6‑features/firm‑appointments/`

**Definition of Done:**
- Exports `getAvailability(tenantId, serviceId, date)`, `createBooking(params)`, `cancelBooking(bookingId)`, `rescheduleBooking(bookingId, newSlot)`.
- Booking page configuration per tenant/service (duration, buffer time, location).
- Staff availability management (working hours, time off).
- Group appointments: a single slot can be booked by multiple clients.
- No‑show policies: configurable action after X no‑shows (block future bookings).
- Automatic calendar sync via booking adapters (Google Calendar, Outlook).
- Video conferencing link automatically attached via video conferencing adapter.
- Reminders via `firm‑notifications` (email/SMS before appointment).

**Out of Scope:** Actual calendar UI (that’s an app). Payment for bookings (handled by `firm‑payments` before booking is confirmed).

**Rules to Follow:**
- Must use `firm‑metering` to track booking usage per tenant.
- Booking slots must be double‑book safe (use DB locks or atomic insert).

**Advanced Coding Patterns:**
- Slot generation algorithm with buffer times and staff availability.
- Double‑booking prevention via `SELECT ... FOR UPDATE` or optimistic concurrency.

**Anti-Patterns:**
- Do not show other tenants’ appointments to any client.
- Do not allow booking in the past.

**DDD:** Appointments is an aggregate; availability is a domain service.  
**TDD:** Test slot generation, booking creation, cancellation, reschedule, double‑booking prevention, group appointments, no‑show policy enforcement.  
**BDD:** Behavior: a client picks a time slot and books it; the slot is no longer available; they receive a confirmation with a calendar invite and video link.  
**Deep Module:** `firm‑appointments` hides complex slot calculation and calendar integration behind `getAvailability` and `createBooking`.

#### Subtasks
- [ ] **PH4.6.1** [AGENT] Create package scaffold: `packages/layer6‑features/firm‑appointments/`.
- [ ] **PH4.6.2** [AGENT] Implement staff availability and working hours management. File: `packages/layer6‑features/firm‑appointments/src/availability.ts`.
- [ ] **PH4.6.3** [AGENT] Implement slot generation algorithm. File: `packages/layer6‑features/firm‑appointments/src/slots.ts`.
- [ ] **PH4.6.4** [AGENT] Implement `createBooking` with double‑booking prevention. File: `packages/layer6‑features/firm‑appointments/src/booking.ts`.
- [ ] **PH4.6.5** [AGENT] Implement `cancelBooking` and `rescheduleBooking`. File: `packages/layer6‑features/firm‑appointments/src/cancel‑reschedule.ts`.
- [ ] **PH4.6.6** [AGENT] Implement group appointments. File: `packages/layer6‑features/firm‑appointments/src/group.ts`.
- [ ] **PH4.6.7** [AGENT] Implement no‑show policy enforcement. File: `packages/layer6‑features/firm‑appointments/src/no‑show.ts`.
- [ ] **PH4.6.8** [AGENT] Implement calendar sync via booking adapters. File: `packages/layer6‑features/firm‑appointments/src/calendar‑sync.ts`.
- [ ] **PH4.6.9** [AGENT] Implement video link attachment via videoconferencing adapter. File: `packages/layer6‑features/firm‑appointments/src/video‑link.ts`.
- [ ] **PH4.6.10** [AGENT] Implement reminders via `firm‑notifications`. File: `packages/layer6‑features/firm‑appointments/src/reminders.ts`.
- [ ] **PH4.6.11** [AGENT] Write integration tests with mock booking and video adapters. File: `packages/layer6‑features/firm‑appointments/tests/`.

---

### PH4.7 – Build `firm-workflow` (internal process automation)
- [ ] **PH4.7** | Status: Not Started

**Related files:** `packages/layer6‑features/firm‑workflow/`

**Definition of Done:**
- Exports `defineWorkflow(trigger, steps)`, `activateWorkflow(tenantId, workflowId)`, `getWorkflowExecutions(tenantId)`.
- Trigger: on event (e.g., `document.signed`, `lead.created`) or schedule (cron).
- Steps: actions like send notification, create task, update CRM, call webhook, wait for condition.
- Condition model per ADR‑009 (must be resolved before building).
- Each workflow execution is a saga; if a step fails, compensating actions run in reverse.
- Visual builder configuration is out of scope, but the configuration schema must be documented.
- Strictly inward‑facing: "when proposal signed → create project, assign PM, send onboarding email".
- Separate bounded context from `firm‑funnels` (external marketing automation).

**Out of Scope:** Funnel builder (that’s `firm‑funnels`). Visual workflow editor UI.

**Rules to Follow:**
- Must use `firm‑bus` for saga execution and `firm‑validators` for workflow definitions.
- All actions must be audited.

**Advanced Coding Patterns:**
- Configurable DAG of steps with conditional branching.
- JSON‑based workflow definition that can be serialised and stored.

**Anti-Patterns:**
- Do not mix internal workflows with marketing funnels; they are separate packages with separate event contracts.

**DDD:** Workflow is a domain service for process automation; it orchestrates other domain services.  
**TDD:** Test a workflow triggered by `document.signed` that creates a project and sends a notification; test compensation on step failure.  
**BDD:** Behavior: when a document is signed, a project is automatically created and the assignee gets a notification.  
**Deep Module:** `firm‑workflow` encapsulates the complexity of step orchestration, conditions, and compensation behind a simple workflow definition.

#### Subtasks
- [ ] **PH4.7.1** [HUMAN] Confirm ADR‑009 outcome for condition model. File: `docs/adr/0007‑workflow‑condition‑model.md`.
- [ ] **PH4.7.2** [AGENT] Create package scaffold: `packages/layer6‑features/firm‑workflow/`.
- [ ] **PH4.7.3** [AGENT] Implement workflow definition schema and validator. File: `packages/layer6‑features/firm‑workflow/src/definition.ts`.
- [ ] **PH4.7.4** [AGENT] Implement workflow engine: parse definition, execute steps in order, handle branching. File: `packages/layer6‑features/firm‑workflow/src/engine.ts`.
- [ ] **PH4.7.5** [AGENT] Implement built‑in actions: `sendNotification`, `createTask`, `waitForCondition`, `callWebhook`, `updateCRM`. File: `packages/layer6‑features/firm‑workflow/src/actions/`.
- [ ] **PH4.7.6** [AGENT] Implement saga compensation: register inverse action for each step. File: `packages/layer6‑features/firm‑workflow/src/compensation.ts`.
- [ ] **PH4.7.7** [AGENT] Implement trigger listeners (event and cron). File: `packages/layer6‑features/firm‑workflow/src/triggers.ts`.
- [ ] **PH4.7.8** [AGENT] Write integration tests with a sample workflow. File: `packages/layer6‑features/firm‑workflow/tests/`.

---

### PH4.8 – Build `firm-integrations` (unified integration dashboard, health scoring)
- [ ] **PH4.8** | Status: Not Started

**Related files:** `packages/layer6‑features/firm‑integrations/`

**Definition of Done:**
- Exports `getIntegrationHealth(tenantId)` that returns health status for all connected adapters (CRM, email, SMS, etc.).
- Health scoring: composite score per integration based on API response time, error rate, OAuth token status.
- Proactive OAuth token refresh: detects tokens nearing expiry and refreshes them.
- Integration status events: `integration.connected`, `integration.disconnected`, `integration.degraded`.
- Logs recent sync activity for each integration.

**Out of Scope:** Actual adapter health checks (each adapter exposes its own metrics and status; this aggregates them). Integration configuration UI.

**Rules to Follow:**
- Must use adapter Port interfaces to query health.
- Must emit observability metrics for integration health.

**Advanced Coding Patterns:**
- Health check aggregator that queries all registered adapters in parallel.
- Token expiry detection and refresh using OAuth client credentials.

**Anti-Patterns:**
- Do not hardcode a list of integrations; use a registry pattern where adapters self‑register.

**DDD:** Integrations is a domain service for managing external system connections.  
**TDD:** Test that `getIntegrationHealth` returns status for all connected adapters; test that a degraded adapter lowers the composite score; test token refresh.  
**BDD:** Behavior: the integration dashboard shows a green indicator for healthy integrations and a red indicator with error details for broken ones.  
**Deep Module:** `firm‑integrations` hides the complexity of OAuth token management and health aggregation behind a simple status API.

#### Subtasks
- [ ] **PH4.8.1** [AGENT] Create package scaffold: `packages/layer6‑features/firm‑integrations/`.
- [ ] **PH4.8.2** [AGENT] Implement adapter registry: adapters self‑register on init with their Port and health check function. File: `packages/layer6‑features/firm‑integrations/src/registry.ts`.
- [ ] **PH4.8.3** [AGENT] Implement `getIntegrationHealth` aggregator. File: `packages/layer6‑features/firm‑integrations/src/health.ts`.
- [ ] **PH4.8.4** [AGENT] Implement composite health scoring algorithm. File: `packages/layer6‑features/firm‑integrations/src/scoring.ts`.
- [ ] **PH4.8.5** [AGENT] Implement proactive OAuth token refresh. File: `packages/layer6‑features/firm‑integrations/src/token‑refresh.ts`.
- [ ] **PH4.8.6** [AGENT] Implement integration status events and activity logging. File: `packages/layer6‑features/firm‑integrations/src/events.ts`.
- [ ] **PH4.8.7** [AGENT] Write tests with mock adapters. File: `packages/layer6‑features/firm‑integrations/tests/`.

---

Phase 5 of the updated TODO.md follows. This phase covers the two Tier C revenue packages. Both depend heavily on Tier A infrastructure from Phase 2 and the payment adapters from Phase 3.

---

## Phase 5: Revenue Packages (Tier C – 2 packages)

*These packages manage the money path. `firm‑subscriptions` defines plans and entitlements; `firm‑billing` handles invoicing, revenue recognition, and dunning. Both must be built before any client‑facing feature that consumes billable resources.*

---

### PH5.1 – Build `firm-subscriptions` (plan lifecycle, entitlements, grace periods)
- [ ] **PH5.1** | Status: Not Started

**Related files:** `packages/layer6‑features/firm‑subscriptions/`

**Definition of Done:**
- Exports `definePlan(planDefinition)`, `subscribe(tenantId, planId)`, `changePlan(tenantId, newPlanId)`, `cancelSubscription(tenantId)`, `getEntitlements(tenantId)`.
- Plan definitions stored in DB; include features, quotas, and pricing.
- Plan lifecycle: trial → active → past_due → canceled / expired.
- Grace periods: configurable window (e.g., 3‑7 days) after payment failure before hard revocation; during grace period, service continues.
- Grandfathering: tenants on old plans can remain on them indefinitely; plan definitions are versioned.
- Entitlement resolution: queries `firm‑flags` for feature flags gated by plan, and `firm‑metering` for quota limits defined by plan.
- Emits subscription events: `subscription.created`, `subscription.upgraded`, `subscription.canceled`, `subscription.past_due`.
- All operations audited via `firm‑audit`.

**Out of Scope:** Actual payment processing (that’s `firm‑payments`). Invoicing (that’s `firm‑billing`). The subscription listens for `payment.succeeded` / `payment.failed` events to manage lifecycle.

**Rules to Follow:**
- Must use `firm‑db‑client` and `firm‑validators`.
- Plan definition changes must not affect currently subscribed tenants unless explicitly migrated.
- Grace period must prevent immediate lockout from a failed card payment.

**Advanced Coding Patterns:**
- Plan versioning with grandfathering support.
- Entitlement aggregation from multiple sources (`firm‑flags`, `firm‑metering`).

**Anti-Patterns:**
- Do not hardcode plan details in code; plans are stored in DB and configurable.
- Do not revoke access immediately on payment failure; always observe the grace period.

**DDD:** Subscription is the aggregate root for the revenue bounded context.  
**TDD:** Test subscribe, change plan, cancel, grace period enforcement, grandfathering, entitlement resolution.  
**BDD:** Behavior: a tenant on a "starter" plan cannot access a "pro"‑only feature; upgrading changes their entitlement immediately; a failed payment triggers a grace period, not instant lockout.  
**Deep Module:** `firm‑subscriptions` encapsulates complex plan logic and grace periods behind simple `subscribe` / `getEntitlements` calls.

#### Subtasks
- [ ] **PH5.1.1** [AGENT] Create package scaffold: `packages/layer6‑features/firm‑subscriptions/`.
- [ ] **PH5.1.2** [AGENT] Implement plan definition schema and storage. File: `packages/layer6‑features/firm‑subscriptions/src/plan.ts`.
- [ ] **PH5.1.3** [AGENT] Implement `subscribe(tenantId, planId)` with trial initiation. File: `packages/layer6‑features/firm‑subscriptions/src/subscribe.ts`.
- [ ] **PH5.1.4** [AGENT] Implement `changePlan(tenantId, newPlanId)` with proration logic. File: `packages/layer6‑features/firm‑subscriptions/src/change‑plan.ts`.
- [ ] **PH5.1.5** [AGENT] Implement `cancelSubscription(tenantId)` and lifecycle state machine. File: `packages/layer6‑features/firm‑subscriptions/src/cancel.ts`.
- [ ] **PH5.1.6** [AGENT] Implement grace period management (listens to `payment.failed`, schedules revocation). File: `packages/layer6‑features/firm‑subscriptions/src/grace‑period.ts`.
- [ ] **PH5.1.7** [AGENT] Implement grandfathering: plan versioning and tenant‑plan binding. File: `packages/layer6‑features/firm‑subscriptions/src/grandfathering.ts`.
- [ ] **PH5.1.8** [AGENT] Implement `getEntitlements(tenantId)` aggregating flags and quotas. File: `packages/layer6‑features/firm‑subscriptions/src/entitlements.ts`.
- [ ] **PH5.1.9** [AGENT] Write integration tests with mock payment events. File: `packages/layer6‑features/firm‑subscriptions/tests/`.

---

### PH5.2 – Build `firm-billing` (invoicing, revenue recognition, dunning)
- [ ] **PH5.2** | Status: Not Started

**Related files:** `packages/layer6‑features/firm‑billing/`

**Definition of Done:**
- Exports `generateInvoice(tenantId, period)`, `getInvoice(invoiceId)`, `payInvoice(invoiceId)`, `getAgingReport(tenantId)`.
- Invoice line items automatically generated from: subscription plan charges, metered usage (from `firm‑metering`), one‑time charges.
- Multi‑currency support: invoices in tenant’s configured currency; exchange rates applied at invoice generation.
- Tax jurisdiction detection: automatic tax rate based on tenant’s billing address (supports EU VAT OSS, US sales tax).
- Revenue recognition: records revenue in the period it was earned, not when paid; supports deferred revenue.
- Dunning: automated email sequence for overdue invoices (friendly reminder → warning → final notice).
- Financial reporting: `getRevenueReport(tenantId, period)`, `getAgingReport(tenantId)`.
- All operations audited.

**Out of Scope:** Actual payment collection (handled by `firm‑payments`). Accounting export (handled by accounting adapters). Subscription plan definition (that’s `firm‑subscriptions`).

**Rules to Follow:**
- Invoices must be immutable after issuance; corrections require a credit note.
- Revenue recognition must follow ASC 606 / IFRS 15 principles (earned when service delivered).
- Dunning emails must respect `firm‑notifications` consent.

**Advanced Coding Patterns:**
- Invoice generation engine that aggregates line items from multiple sources.
- Tax jurisdiction detection using address validation.
- Revenue recognition schedule for subscription periods.

**Anti-Patterns:**
- Do not allow editing an issued invoice; create a credit note instead.
- Do not send dunning emails to tenants who have already paid.

**DDD:** Invoice is an aggregate in the revenue bounded context.  
**TDD:** Test invoice generation with subscription and metered items, multi‑currency, tax calculation, dunning sequence, revenue recognition schedule.  
**BDD:** Behavior: at the end of the billing period, an invoice is generated with line items for the plan and usage; tax is calculated based on jurisdiction; on payment, revenue is recognised.  
**Deep Module:** `firm‑billing` hides complex invoice generation, tax logic, and dunning behind `generateInvoice` and `getAgingReport`.

#### Subtasks
- [ ] **PH5.2.1** [AGENT] Create package scaffold: `packages/layer6‑features/firm‑billing/`.
- [ ] **PH5.2.2** [AGENT] Implement invoice schema and `generateInvoice` with line item aggregation from subscriptions and metering. File: `packages/layer6‑features/firm‑billing/src/invoice‑generate.ts`.
- [ ] **PH5.2.3** [AGENT] Implement invoice immutability: `issueInvoice` marks as issued; edits blocked. File: `packages/layer6‑features/firm‑billing/src/invoice‑issue.ts`.
- [ ] **PH5.2.4** [AGENT] Implement `payInvoice` and payment reconciliation with `firm‑payments`. File: `packages/layer6‑features/firm‑billing/src/payment.ts`.
- [ ] **PH5.2.5** [AGENT] Implement multi‑currency support with exchange rate lookup. File: `packages/layer6‑features/firm‑billing/src/currency.ts`.
- [ ] **PH5.2.6** [AGENT] Implement tax jurisdiction detection (VAT OSS, US sales tax). File: `packages/layer6‑features/firm‑billing/src/tax.ts`.
- [ ] **PH5.2.7** [AGENT] Implement revenue recognition scheduling (deferred revenue). File: `packages/layer6‑features/firm‑billing/src/revenue‑recognition.ts`.
- [ ] **PH5.2.8** [AGENT] Implement dunning sequence: overdue detection, email escalation via `firm‑notifications`. File: `packages/layer6‑features/firm‑billing/src/dunning.ts`.
- [ ] **PH5.2.9** [AGENT] Implement financial reports: `getRevenueReport`, `getAgingReport`. File: `packages/layer6‑features/firm‑billing/src/reports.ts`.
- [ ] **PH5.2.10** [AGENT] Write integration tests. File: `packages/layer6‑features/firm‑billing/tests/`.

---

Phase 6 of the updated TODO.md follows. This phase covers all 11 Tier D client‑facing and marketing packages, plus the AI content generation package with its mandatory human‑approval gate.

---

## Phase 6: Client‑Facing & Marketing Execution (Tier D – 11 packages)

*These packages deliver the externally visible platform capabilities. Build order respects dependencies on Tier A infrastructure, Tier B operations, adapters, and the split between `firm‑ai` (infrastructure) and `firm‑ai‑content` (generation with compliance). The portal and inbox come late because they aggregate other packages.*

---

### PH6.1 – Build `firm-reporting` (analytics engine, branded reports, CQRS read model)
- [ ] **PH6.1** | Status: Not Started

**Related files:** `packages/layer6‑features/firm‑reporting/`

**Definition of Done:**
- Exports `getDashboard(tenantId)`, `generateReport(tenantId, reportConfig)`, `scheduleReport(tenantId, config, schedule)`.
- Reads exclusively from the CQRS read model (`firm‑db‑read`). Writes are only allowed via outbox event handlers.
- Branded PDF and email reports using `firm‑template‑engine` and `firm‑media`.
- Pre‑computed metrics: caches aggregated data for fast dashboard loads; invalidation via `firm‑bus` events.
- Shareable report links with configurable expiry.
- Report scheduling: daily/weekly/monthly delivery via `firm‑notifications`.
- Anomaly detection: integrates with `firm‑kpi` for metric anomaly highlighting.
- ESLint rule (already in place from Phase 1) prevents direct writes to the read model from any other package.

**Out of Scope:** Ad performance data (consumed from `firm‑ads`). Real‑time dashboards via SSE (that’s `firm‑sse`).

**Rules to Follow:**
- Must use a dedicated read‑only connection pool from `firm‑db‑client`.
- Must never write to the read model directly; only outbox event handlers populate it.
- Reports must respect tenant data isolation.

**Advanced Coding Patterns:**
- CQRS read‑model projection handlers subscribing to domain events.
- Materialised view refresh via event‑driven invalidation.
- PDF report generation using `firm‑template‑engine` with Handlebars layouts.

**Anti-Patterns:**
- Do not query transactional tables for reports; always use the read model.
- Do not let a report request block the main API thread; generate asynchronously.

**DDD:** Reporting is a separate read model projection of the core domain.  
**TDD:** Test dashboard metrics accuracy, PDF generation, scheduled report delivery, shareable link authentication.  
**BDD:** Behavior: a scheduled weekly report is generated and emailed to the agency admin every Monday at 8 AM.  
**Deep Module:** `firm‑reporting` encapsulates read‑model population, metric aggregation, and report rendering behind a simple query API.

#### Subtasks
- [ ] **PH6.1.1** [AGENT] Create package scaffold: `packages/layer6‑features/firm‑reporting/`.
- [ ] **PH6.1.2** [AGENT] Implement read‑model projection handlers for core events (lead created, payment succeeded, etc.). File: `packages/layer6‑features/firm‑reporting/src/projections/`.
- [ ] **PH6.1.3** [AGENT] Implement `getDashboard(tenantId)` with pre‑computed metrics. File: `packages/layer6‑features/firm‑reporting/src/dashboard.ts`.
- [ ] **PH6.1.4** [AGENT] Implement `generateReport(tenantId, config)` with PDF output. File: `packages/layer6‑features/firm‑reporting/src/generate.ts`.
- [ ] **PH6.1.5** [AGENT] Implement `scheduleReport` and `cancelScheduledReport`. File: `packages/layer6‑features/firm‑reporting/src/schedule.ts`.
- [ ] **PH6.1.6** [AGENT] Implement shareable report links with signed URLs and expiry. File: `packages/layer6‑features/firm‑reporting/src/sharing.ts`.
- [ ] **PH6.1.7** [AGENT] Implement anomaly highlighting integration with `firm‑kpi`. File: `packages/layer6‑features/firm‑reporting/src/anomalies.ts`.
- [ ] **PH6.1.8** [AGENT] Write integration tests with seeded data and mock adapters. File: `packages/layer6‑features/firm‑reporting/tests/`.

---

### PH6.2 – Build `firm-cms` (headless CMS, content staging, multilingual)
- [ ] **PH6.2** | Status: Not Started

**Related files:** `packages/layer6‑features/firm‑cms/`

**Definition of Done:**
- Exports `getContent(tenantId, slug, locale)`, `publishContent(tenantId, contentId)`, `createContent(tenantId, data)`.
- Content staging: draft → preview → published; preview URL with a temporary token.
- SEO metadata management per content item (title, description, OG tags, structured data).
- Multilingual support with locale fallback: if a locale is missing, fall back to the tenant’s default locale.
- Integration with CMS adapters for external headless CMS sync (Sanity, Strapi, etc.).
- Content versioning: every publish creates a new version; rollback supported.

**Out of Scope:** Content editing UI. Actual static site generation.

**Rules to Follow:**
- Must use `firm‑db‑client` and `firm‑cache` for content delivery.
- Published content must be cacheable at the edge (CDN) with invalidation on update.

**Advanced Coding Patterns:**
- Content delivery with edge caching headers.
- Locale fallback chain resolution.

**Anti-Patterns:**
- Do not serve draft content without a valid preview token.
- Do not allow cross‑tenant content queries.

**DDD:** CMS is a supporting domain service for content management.  
**TDD:** Test CRUD, publish workflow, locale fallback, SEO metadata, preview token auth.  
**BDD:** Behavior: a content editor creates a draft, previews it with a shareable link, and publishes it; the published content is immediately available via the API in the requested locale.  
**Deep Module:** `firm‑cms` hides content storage, versioning, and localisation behind a clean CRUD API.

#### Subtasks
- [ ] **PH6.2.1** [AGENT] Create package scaffold: `packages/layer6‑features/firm‑cms/`.
- [ ] **PH6.2.2** [AGENT] Implement content CRUD with draft/published state machine. File: `packages/layer6‑features/firm‑cms/src/content.ts`.
- [ ] **PH6.2.3** [AGENT] Implement content staging and preview tokens. File: `packages/layer6‑features/firm‑cms/src/staging.ts`.
- [ ] **PH6.2.4** [AGENT] Implement SEO metadata management per content item. File: `packages/layer6‑features/firm‑cms/src/seo.ts`.
- [ ] **PH6.2.5** [AGENT] Implement multilingual support with locale fallback chain. File: `packages/layer6‑features/firm‑cms/src/locales.ts`.
- [ ] **PH6.2.6** [AGENT] Implement CMS adapter integration for external sync. File: `packages/layer6‑features/firm‑cms/src/sync.ts`.
- [ ] **PH6.2.7** [AGENT] Implement content versioning and rollback. File: `packages/layer6‑features/firm‑cms/src/versioning.ts`.
- [ ] **PH6.2.8** [AGENT] Write tests. File: `packages/layer6‑features/firm‑cms/tests/`.

---

### PH6.3 – Build `firm-forms` (form builder, conditional logic, analytics)
- [ ] **PH6.3** | Status: Not Started

**Related files:** `packages/layer6‑features/firm‑forms/`

**Definition of Done:**
- Exports `createForm(definition)`, `submitForm(formId, data)`, `getFormAnalytics(formId)`.
- Form builder: conditional logic (show/hide fields based on previous answers), multi‑step forms with partial save/resume.
- Field‑level abandonment analytics: tracks which field caused the user to drop off.
- CRM field mapping: maps form fields to CRM lead/contact fields; validation prevents broken mappings at publish time.
- Spam protection via Turnstile (from `firm‑security`).
- Form submissions emit `form.submitted` event; lead creation is handled by a handler that calls `firm‑sales‑pipeline` or CRM adapter.

**Out of Scope:** Form rendering UI. Landing page integration (that’s `firm‑landing‑pages`).

**Rules to Follow:**
- Form definitions must be validated by `firm‑validators` before storage.
- Submissions must be rate‑limited via `firm‑rate‑limiter`.
- Must check `firm‑consent` before storing submission data.

**Advanced Coding Patterns:**
- JSON‑based form definition schema with conditional logic.
- Partial save using client‑side storage + server reconciliation.
- Field‑level analytics via event tracking.

**Anti-Patterns:**
- Do not store form submissions without consent.
- Do not allow a form to be published with a broken CRM field mapping.

**DDD:** Forms is a domain service for lead capture.  
**TDD:** Test form creation, submission, conditional logic, partial save, CRM mapping validation, abandonment tracking.  
**BDD:** Behavior: a user fills out a multi‑step form, saves progress halfway, and resumes later; the form maps fields to CRM and creates a lead on submission.  
**Deep Module:** `firm‑forms` hides form definition parsing, conditional logic evaluation, and CRM mapping behind `createForm` and `submitForm`.

#### Subtasks
- [ ] **PH6.3.1** [AGENT] Create package scaffold: `packages/layer6‑features/firm‑forms/`.
- [ ] **PH6.3.2** [AGENT] Implement form definition schema and validator. File: `packages/layer6‑features/firm‑forms/src/definition.ts`.
- [ ] **PH6.3.3** [AGENT] Implement `createForm` with conditional logic support. File: `packages/layer6‑features/firm‑forms/src/create.ts`.
- [ ] **PH6.3.4** [AGENT] Implement `submitForm` with rate limiting and Turnstile validation. File: `packages/layer6‑features/firm‑forms/src/submit.ts`.
- [ ] **PH6.3.5** [AGENT] Implement multi‑step form partial save/resume. File: `packages/layer6‑features/firm‑forms/src/partial‑save.ts`.
- [ ] **PH6.3.6** [AGENT] Implement CRM field mapping and validation at publish time. File: `packages/layer6‑features/firm‑forms/src/crm‑mapping.ts`.
- [ ] **PH6.3.7** [AGENT] Implement field‑level abandonment analytics. File: `packages/layer6‑features/firm‑forms/src/analytics.ts`.
- [ ] **PH6.3.8** [AGENT] Write tests. File: `packages/layer6‑features/firm‑forms/tests/`.

---

### PH6.4 – Build `firm-landing-pages` (landing page builder, A/B testing, Core Web Vitals)
- [ ] **PH6.4** | Status: Not Started

**Related files:** `packages/layer6‑features/firm‑landing‑pages/`

**Definition of Done:**
- Exports `createPage(definition)`, `renderPage(slug, tenantId)`, `getABTestResults(pageId)`.
- Block‑based page builder: pages composed of predefined blocks (Hero, CTA, Testimonial, etc.).
- A/B testing: multiple variants per page, traffic split by percentage, conversion goal tracking.
- Core Web Vitals tracking per variant (LCP, FID, CLS) emitted as observability metrics.
- Conversion pixel management: pixels only fire after consent granted (via `firm‑consent`).
- Page archiving with analytics retention.

**Out of Scope:** Block rendering (that’s `firm‑ui/marketing`). CMS content (consumed from `firm‑cms`).

**Rules to Follow:**
- Must use `firm‑consent` before rendering any third‑party scripts or pixels.
- Must use `firm‑cache` for page caching; invalidation on publish.
- A/B test assignment must be sticky (cookie‑based) and consistent per user.

**Advanced Coding Patterns:**
- Block renderer that resolves block types to React components.
- A/B test traffic splitting with consistent assignment.

**Anti-Patterns:**
- Do not render pixels or analytics without consent.
- Do not hardcode block definitions; blocks are registered in a registry.

**DDD:** Landing pages is a domain service for marketing execution.  
**TDD:** Test page creation, rendering, A/B test assignment, variant analytics, consent‑gated pixels.  
**BDD:** Behavior: a marketer creates a landing page with two variants; 50% of visitors see variant A, 50% see variant B; conversions are tracked per variant and the winner is identified.  
**Deep Module:** `firm‑landing‑pages` hides block rendering, A/B testing, and consent enforcement behind `renderPage`.

#### Subtasks
- [ ] **PH6.4.1** [AGENT] Create package scaffold: `packages/layer6‑features/firm‑landing‑pages/`.
- [ ] **PH6.4.2** [AGENT] Implement page definition schema and block registry. File: `packages/layer6‑features/firm‑landing‑pages/src/definition.ts`.
- [ ] **PH6.4.3** [AGENT] Implement `renderPage` with block resolution and consent gating. File: `packages/layer6‑features/firm‑landing‑pages/src/render.ts`.
- [ ] **PH6.4.4** [AGENT] Implement A/B test variant management and traffic splitting. File: `packages/layer6‑features/firm‑landing‑pages/src/ab‑test.ts`.
- [ ] **PH6.4.5** [AGENT] Implement Core Web Vitals tracking per variant. File: `packages/layer6‑features/firm‑landing‑pages/src/vitals.ts`.
- [ ] **PH6.4.6** [AGENT] Implement conversion pixel management with consent enforcement. File: `packages/layer6‑features/firm‑landing‑pages/src/pixels.ts`.
- [ ] **PH6.4.7** [AGENT] Implement page archiving with analytics retention. File: `packages/layer6‑features/firm‑landing‑pages/src/archive.ts`.
- [ ] **PH6.4.8** [AGENT] Write tests with mock block renderer and consent service. File: `packages/layer6‑features/firm‑landing‑pages/tests/`.

---

### PH6.5 – Build `firm-funnels` (marketing automation, cross‑channel sequences)
- [ ] **PH6.5** | Status: Not Started

**Related files:** `packages/layer6‑features/firm‑funnels/`

**Definition of Done:**
- Exports `createFunnel(definition)`, `activateFunnel(funnelId)`, `getFunnelAnalytics(funnelId)`.
- Multi‑step behaviour‑driven sequences: wait for trigger, send email, wait X days, check condition, branch.
- Cross‑channel actions: email, SMS, webhook, update CRM, add to campaign.
- Funnel analytics: entry rate, step completion rate, drop‑off per step.
- Pause/resume: a running funnel can be paused and resumed without losing state.
- Strictly outward‑facing marketing automation; separate bounded context from `firm‑workflow`.

**Out of Scope:** Internal workflow automation (that’s `firm‑workflow`). Funnel builder UI.

**Rules to Follow:**
- Must use `firm‑bus` for step execution and scheduling.
- All communication actions must check `firm‑consent` before sending.
- Must emit funnel analytics events for `firm‑reporting`.

**Advanced Coding Patterns:**
- DAG of steps with delay and condition nodes.
- Per‑contact funnel state tracking for pause/resume.

**Anti-Patterns:**
- Do not send marketing communications without consent; hard block.
- Do not use funnel data for internal operations.

**DDD:** Funnels is a domain service for marketing automation, separate from internal workflow.  
**TDD:** Test funnel execution, delay steps, condition branching, pause/resume, analytics.  
**BDD:** Behavior: a lead enters a funnel after form submission; they receive a welcome email immediately, wait 2 days, then receive a follow‑up; if they click the link, they move to a different branch.  
**Deep Module:** `firm‑funnels` hides step execution, scheduling, and branching behind a funnel definition.

#### Subtasks
- [ ] **PH6.5.1** [AGENT] Create package scaffold: `packages/layer6‑features/firm‑funnels/`.
- [ ] **PH6.5.2** [AGENT] Implement funnel definition schema and validator. File: `packages/layer6‑features/firm‑funnels/src/definition.ts`.
- [ ] **PH6.5.3** [AGENT] Implement funnel engine: step execution, delays, conditions, branching. File: `packages/layer6‑features/firm‑funnels/src/engine.ts`.
- [ ] **PH6.5.4** [AGENT] Implement cross‑channel actions (email, SMS, webhook, CRM) with consent checks. File: `packages/layer6‑features/firm‑funnels/src/actions/`.
- [ ] **PH6.5.5** [AGENT] Implement per‑contact state tracking and pause/resume. File: `packages/layer6‑features/firm‑funnels/src/state.ts`.
- [ ] **PH6.5.6** [AGENT] Implement funnel analytics (entry rate, completion, drop‑off). File: `packages/layer6‑features/firm‑funnels/src/analytics.ts`.
- [ ] **PH6.5.7** [AGENT] Write integration tests with mock adapters. File: `packages/layer6‑features/firm‑funnels/tests/`.

---

### PH6.6 – Build `firm-social` (cross‑platform social media management)
- [ ] **PH6.6** | Status: Not Started

**Related files:** `packages/layer6‑features/firm‑social/`

**Definition of Done:**
- Exports `schedulePost(tenantId, channel, content, scheduledAt)`, `getCalendar(tenantId, period)`, `getPostAnalytics(postId)`.
- Content calendar: view scheduled and published posts per channel.
- Cross‑platform posting via social adapters.
- Social listening: tracks mentions and comments; inbound DMs routed to `firm‑inbox` via `social.dm.received` event.
- Content recycling: suggest re‑posting top‑performing content.
- Approval workflow: posts require approval before publishing.

**Out of Scope:** Content creation (that’s `firm‑ai‑content`). Social inbox (that’s `firm‑inbox`).

**Rules to Follow:**
- Outbound only; all inbound messages go to `firm‑inbox`.
- Must use social adapters via Port interfaces.
- Must audit all published posts.

**Advanced Coding Patterns:**
- Calendar‑based scheduling with timezone support.
- Social listening via webhook ingestion.

**Anti-Patterns:**
- Do not publish without human approval (enforced by `firm‑social`, not the adapter).
- Do not store social media credentials in the app; use adapter OAuth.

**DDD:** Social is a domain service for social media execution.  
**TDD:** Test post scheduling, calendar retrieval, cross‑platform publishing, approval workflow, inbound DM routing.  
**BDD:** Behavior: a marketer schedules a post for tomorrow at 9 AM; the post is published on the connected social channel at the scheduled time.  
**Deep Module:** `firm‑social` hides platform differences, scheduling, and approval behind `schedulePost`.

#### Subtasks
- [ ] **PH6.6.1** [AGENT] Create package scaffold: `packages/layer6‑features/firm‑social/`.
- [ ] **PH6.6.2** [AGENT] Implement post scheduling and content calendar. File: `packages/layer6‑features/firm‑social/src/schedule.ts`.
- [ ] **PH6.6.3** [AGENT] Implement cross‑platform publishing via social adapters. File: `packages/layer6‑features/firm‑social/src/publish.ts`.
- [ ] **PH6.6.4** [AGENT] Implement social listening and inbound DM routing. File: `packages/layer6‑features/firm‑social/src/listening.ts`.
- [ ] **PH6.6.5** [AGENT] Implement content recycling suggestions. File: `packages/layer6‑features/firm‑social/src/recycling.ts`.
- [ ] **PH6.6.6** [AGENT] Implement approval workflow. File: `packages/layer6‑features/firm‑social/src/approval.ts`.
- [ ] **PH6.6.7** [AGENT] Implement post analytics. File: `packages/layer6‑features/firm‑social/src/analytics.ts`.
- [ ] **PH6.6.8** [AGENT] Write tests with mock social adapters. File: `packages/layer6‑features/firm‑social/tests/`.

---

### PH6.7 – Build `firm-seo` (keyword tracking, technical audits, structured data)
- [ ] **PH6.7** | Status: Not Started

**Related files:** `packages/layer6‑features/firm‑seo/`

**Definition of Done:**
- Exports `getKeywordRankings(tenantId, keywords)`, `runSiteAudit(tenantId, url)`, `getBacklinks(tenantId)`, `generateStructuredData(type, data)`.
- Keyword rank tracking via SEO data adapters.
- Technical SEO audits: crawl a site, report issues (missing meta, broken links, etc.).
- Backlink monitoring.
- Structured data management: generate JSON‑LD for local business, events, products.
- SERP feature detection (featured snippets, knowledge panels).

**Out of Scope:** SEO content optimisation (that’s `firm‑ai‑content`). Actual site crawling (uses adapters).

**Rules to Follow:**
- Must use SEO adapters; never call external APIs directly.
- Audit results must be tenant‑scoped.

**Advanced Coding Patterns:**
- Site crawler logic using adapter‑provided data.
- JSON‑LD generator for schema.org types.

**Anti-Patterns:**
- Do not hardcode keyword lists in the package.

**DDD:** SEO is a domain service for search engine optimisation.  
**TDD:** Test keyword ranking retrieval, audit report generation, structured data output, backlink monitoring.  
**BDD:** Behavior: an agency user enters keywords and sees their current rankings; they run a site audit and receive a list of issues.  
**Deep Module:** `firm‑seo` hides SEO data adapter calls and audit logic behind a simple API.

#### Subtasks
- [ ] **PH6.7.1** [AGENT] Create package scaffold: `packages/layer6‑features/firm‑seo/`.
- [ ] **PH6.7.2** [AGENT] Implement `getKeywordRankings` via SEO data adapters. File: `packages/layer6‑features/firm‑seo/src/keywords.ts`.
- [ ] **PH6.7.3** [AGENT] Implement `runSiteAudit` with issue detection. File: `packages/layer6‑features/firm‑seo/src/audit.ts`.
- [ ] **PH6.7.4** [AGENT] Implement backlink monitoring. File: `packages/layer6‑features/firm‑seo/src/backlinks.ts`.
- [ ] **PH6.7.5** [AGENT] Implement structured data generator (JSON‑LD) for common types. File: `packages/layer6‑features/firm‑seo/src/structured‑data.ts`.
- [ ] **PH6.7.6** [AGENT] Implement SERP feature detection. File: `packages/layer6‑features/firm‑seo/src/serp.ts`.
- [ ] **PH6.7.7** [AGENT] Write tests with mock SEO adapters. File: `packages/layer6‑features/firm‑seo/tests/`.

---

### PH6.8 – Build `firm-reputation` (review monitoring, competitor tracking, SLA alerts)
- [ ] **PH6.8** | Status: Not Started

**Related files:** `packages/layer6‑features/firm‑reputation/`

**Definition of Done:**
- Exports `getReviews(tenantId)`, `respondToReview(reviewId, response)`, `getCompetitorReviews(tenantId, competitorId)`.
- Review monitoring: aggregate reviews from Google Business, Trustpilot, Yelp via review adapters.
- Response time SLA monitoring: alerts if a review goes unanswered beyond the configured SLA.
- AI‑suggested responses: uses `firm‑ai` to generate response drafts; human‑approval gate enforced before publishing.
- Competitor tracking: monitor competitors’ reviews and sentiment.

**Out of Scope:** AI response generation (delegated to `firm‑ai`). Actual publishing (via review adapters).

**Rules to Follow:**
- AI‑generated responses must go through the human‑approval gate in `firm‑ai‑content` (or an equivalent approval flow); no auto‑publishing.
- SLA alerts must respect notification preferences.

**Advanced Coding Patterns:**
- Sentiment analysis on reviews.
- SLA timer with escalations.

**Anti-Patterns:**
- Do not auto‑publish AI responses without explicit human approval.
- Do not allow a user to respond to a review from another tenant.

**DDD:** Reputation is a domain service for review management.  
**TDD:** Test review aggregation, response submission, SLA alert, AI suggestion approval flow, competitor tracking.  
**BDD:** Behavior: a 1‑star review triggers an SLA alert; an AI‑generated response is drafted but requires human approval before posting.  
**Deep Module:** `firm‑reputation` hides multi‑platform review aggregation and SLA management behind a unified review feed.

#### Subtasks
- [ ] **PH6.8.1** [AGENT] Create package scaffold: `packages/layer6‑features/firm‑reputation/`.
- [ ] **PH6.8.2** [AGENT] Implement review aggregation from review adapters. File: `packages/layer6‑features/firm‑reputation/src/aggregator.ts`.
- [ ] **PH6.8.3** [AGENT] Implement `respondToReview` with audit and publishing via adapter. File: `packages/layer6‑features/firm‑reputation/src/respond.ts`.
- [ ] **PH6.8.4** [AGENT] Implement SLA timer with configurable thresholds and escalation alerts. File: `packages/layer6‑features/firm‑reputation/src/sla.ts`.
- [ ] **PH6.8.5** [AGENT] Implement AI‑suggested response generation via `firm‑ai` with approval gate. File: `packages/layer6‑features/firm‑reputation/src/ai‑suggestions.ts`.
- [ ] **PH6.8.6** [AGENT] Implement competitor review tracking and sentiment comparison. File: `packages/layer6‑features/firm‑reputation/src/competitors.ts`.
- [ ] **PH6.8.7** [AGENT] Write tests with mock review adapters and AI service. File: `packages/layer6‑features/firm‑reputation/tests/`.

---

### PH6.9 – Build `firm-ads` (paid ad campaign management)
- [ ] **PH6.9** | Status: Not Started

**Related files:** `packages/layer6‑features/firm‑ads/`

**Definition of Done:**
- Exports `createCampaign(tenantId, config)`, `getCampaignPerformance(campaignId)`, `syncCampaigns(tenantId)`.
- Ad performance aggregation across Google Ads, Meta Ads, LinkedIn Ads, TikTok Ads.
- UTM parameter management: auto‑generate and append UTM parameters to campaign URLs.
- Creative performance: track which ad creatives perform best.
- Ad fatigue detection: flag campaigns where frequency is rising and CTR dropping.
- Budget alerts: notify when campaign spend reaches configured thresholds.

**Out of Scope:** Ad creative generation (that’s `firm‑ai‑content`). Actual ad buying (via adapters).

**Rules to Follow:**
- Must use ad adapters; never call ad APIs directly.
- Must aggregate performance data into `firm‑reporting` read model.

**Advanced Coding Patterns:**
- Multi‑platform performance aggregation with normalised metrics.
- Ad fatigue detection algorithm using rolling windows.

**Anti-Patterns:**
- Do not allow a campaign to exceed its budget without an alert.

**DDD:** Ads is a domain service for paid advertising management.  
**TDD:** Test campaign creation, performance aggregation, UTM generation, ad fatigue detection, budget alerts.  
**BDD:** Behavior: a marketer creates a Google Ads campaign; performance metrics are aggregated and displayed in a dashboard; an alert is sent when spend reaches 80% of budget.  
**Deep Module:** `firm‑ads` hides multi‑platform aggregation and monitoring behind a unified campaign API.

#### Subtasks
- [ ] **PH6.9.1** [AGENT] Create package scaffold: `packages/layer6‑features/firm‑ads/`.
- [ ] **PH6.9.2** [AGENT] Implement campaign CRUD with adapter integration. File: `packages/layer6‑features/firm‑ads/src/campaign.ts`.
- [ ] **PH6.9.3** [AGENT] Implement performance aggregation from ad adapters. File: `packages/layer6‑features/firm‑ads/src/performance.ts`.
- [ ] **PH6.9.4** [AGENT] Implement UTM parameter management. File: `packages/layer6‑features/firm‑ads/src/utm.ts`.
- [ ] **PH6.9.5** [AGENT] Implement creative performance tracking. File: `packages/layer6‑features/firm‑ads/src/creatives.ts`.
- [ ] **PH6.9.6** [AGENT] Implement ad fatigue detection. File: `packages/layer6‑features/firm‑ads/src/fatigue.ts`.
- [ ] **PH6.9.7** [AGENT] Implement budget alerts. File: `packages/layer6‑features/firm‑ads/src/budget‑alerts.ts`.
- [ ] **PH6.9.8** [AGENT] Write tests with mock ad adapters. File: `packages/layer6‑features/firm‑ads/tests/`.

---

### PH6.10 – Build `firm-ai-content` (AI generation with human‑approval gate, C2PA, compliance)
- [ ] **PH6.10** | Status: Not Started

**Related files:** `packages/layer6‑features/firm‑ai‑content/`

**Definition of Done:**
- Exports `generateContent(prompt, options)`, `approveContent(contentId)`, `rejectContent(contentId, reason)`, `getContentStatus(contentId)`.
- All generated content is created with status `pending_approval`. Only `approveContent()` with `requirePermission('content:approve')` changes status to `approved`. No `autoApprove` flag exists.
- C2PA manifest generation for all AI‑generated content (EU AI Act Art. 50, deadline Aug 2). Manifest stores content hash, generation timestamp, model identifier, prompt hash, AI‑training‑data assertion.
- NY Synthetic Performer disclosure (Jun 9 deadline): auto‑appends disclosure text where required.
- Content moderation: scans generated content for prohibited material before even storing as `pending_approval`. Rejects at the API level.
- Brand voice enforcement: optionally passes a brand voice profile to the AI model to tune output.
- All generation is metered via `firm‑metering.checkQuota('ai_tokens', estimatedTokens)` before the API call.
- Uses `firm‑ai` for model routing and token counting; this package is only generation logic and compliance.

**Out of Scope:** AI infrastructure (model routing, cost metering, rate limiting) – that’s `firm‑ai`. Image generation (handled by `firm‑ai` routing to image adapters, but the approval gate here applies if images are generated through this package).

**Rules to Follow:**
- Human‑Approval Gate is mandatory and non‑bypassable. No feature flag can disable it.
- C2PA manifest must be generated and stored for every approved content item.
- Must check content moderation before storing any generated content.
- Must audit all approve/reject actions.

**Advanced Coding Patterns:**
- Content state machine: generating → pending_approval → approved / rejected.
- C2PA manifest generation using a cryptographic library.
- Brand voice injection via system prompt templating.

**Anti-Patterns:**
- Do not expose a bypass for the approval gate.
- Do not store the full prompt in the C2PA manifest; only the hash.
- Do not generate content without a preceding `checkQuota` call.

**DDD:** AI content is a domain service with strict regulatory boundaries.  
**TDD:** Test that generation returns `pending_approval`, approval changes status, rejection logs reason, C2PA manifest is generated, content moderation rejects prohibited prompts, quota enforcement rejects over‑limit requests.  
**BDD:** Behavior: a marketer generates an AI blog post; it appears as `pending_approval`; a reviewer approves it; the C2PA manifest is attached; the post is now `approved` and can be published.  
**Deep Module:** `firm‑ai‑content` encapsulates the entire compliance workflow and AI generation behind a simple API that guarantees human oversight.

#### Subtasks
- [ ] **PH6.10.1** [AGENT] Create package scaffold: `packages/layer6‑features/firm‑ai‑content/`.
- [ ] **PH6.10.2** [AGENT] Implement `generateContent` with pre‑quota check, `firm‑ai` model routing, and `pending_approval` status. File: `packages/layer6‑features/firm‑ai‑content/src/generate.ts`.
- [ ] **PH6.10.3** [AGENT] Implement Human‑Approval Gate: `approveContent` and `rejectContent` with permission check and audit. File: `packages/layer6‑features/firm‑ai‑content/src/approval.ts`.
- [ ] **PH6.10.4** [AGENT] Implement C2PA manifest generation and storage. File: `packages/layer6‑features/firm‑ai‑content/src/c2pa.ts`.
- [ ] **PH6.10.5** [AGENT] Implement NY Synthetic Performer disclosure injection. File: `packages/layer6‑features/firm‑ai‑content/src/ny‑disclosure.ts`.
- [ ] **PH6.10.6** [AGENT] Implement content moderation scanner. File: `packages/layer6‑features/firm‑ai‑content/src/moderation.ts`.
- [ ] **PH6.10.7** [AGENT] Implement brand voice enforcement via system prompt templating. File: `packages/layer6‑features/firm‑ai‑content/src/brand‑voice.ts`.
- [ ] **PH6.10.8** [AGENT] Write comprehensive tests covering all states, compliance, and failure modes. File: `packages/layer6‑features/firm‑ai‑content/tests/`.

---

### PH6.11 – Build `firm-inbox` (unified conversation inbox)
- [ ] **PH6.11** | Status: Not Started

**Related files:** `packages/layer6‑features/firm‑inbox/`

**Definition of Done:**
- Exports `getConversations(tenantId, filters)`, `getMessages(conversationId)`, `sendMessage(conversationId, body)`, `assignConversation(conversationId, userId)`.
- Unified threading: all inbound messages from email, SMS, social DMs, and chat adapters converge into a single conversation view.
- Assignment and routing: conversations can be assigned to team members; routing rules by channel, keyword, or customer.
- SLA tracking: time‑to‑first‑response and time‑to‑resolution tracked per conversation; alerts on breach.
- Tagging: conversations can be tagged for categorisation.
- Real‑time updates via `firm‑sse` when new messages arrive.

**Out of Scope:** Outbound campaigns (handled by respective feature packages). Chat UI.

**Rules to Follow:**
- Must use adapter webhooks to ingest messages (social DM, chat, etc.).
- Must enforce tenant isolation; an agency admin can see conversations across sub‑accounts.

**Advanced Coding Patterns:**
- Conversation threading algorithm grouping messages by sender, channel, and time window.
- Assignment round‑robin or skill‑based routing.

**Anti-Patterns:**
- Do not mix conversations across tenants.
- Do not let SLA timers run without pausing outside business hours (if configured).

**DDD:** Inbox is a domain service aggregating multi‑channel communication.  
**TDD:** Test conversation threading, message sending, assignment, SLA tracking, cross‑channel aggregation.  
**BDD:** Behavior: a customer sends a message via Facebook DM; it appears in the unified inbox; an agent responds; the SLA timer stops.  
**Deep Module:** `firm‑inbox` hides multi‑channel aggregation, assignment logic, and SLA tracking behind a unified conversation API.

#### Subtasks
- [ ] **PH6.11.1** [AGENT] Create package scaffold: `packages/layer6‑features/firm‑inbox/`.
- [ ] **PH6.11.2** [AGENT] Implement conversation threading and message storage. File: `packages/layer6‑features/firm‑inbox/src/conversation.ts`.
- [ ] **PH6.11.3** [AGENT] Implement `sendMessage` with adapter routing (email, SMS, chat, social). File: `packages/layer6‑features/firm‑inbox/src/send.ts`.
- [ ] **PH6.11.4** [AGENT] Implement assignment and routing rules. File: `packages/layer6‑features/firm‑inbox/src/assignment.ts`.
- [ ] **PH6.11.5** [AGENT] Implement SLA tracking with configurable thresholds and business hours. File: `packages/layer6‑features/firm‑inbox/src/sla.ts`.
- [ ] **PH6.11.6** [AGENT] Implement tagging system. File: `packages/layer6‑features/firm‑inbox/src/tags.ts`.
- [ ] **PH6.11.7** [AGENT] Implement real‑time updates via `firm‑sse`. File: `packages/layer6‑features/firm‑inbox/src/realtime.ts`.
- [ ] **PH6.11.8** [AGENT] Write integration tests with mock adapters. File: `packages/layer6‑features/firm‑inbox/tests/`.

---

Phase 7 of the updated TODO.md follows. This phase is a single package—the white‑label client portal—but it is broken into two small parent tasks for manageability: one for the core portal API and one for its supporting features.

---

## Phase 7: Client Portal

*The portal aggregates projects, documents, reports, invoices, and other data for sub‑account users in a white‑label experience. It depends on nearly every Tier D package from Phase 6 and the revenue packages from Phase 5.*

---

### PH7.1 – Build `firm-portal` (white‑label client portal API)
- [ ] **PH7.1** | Status: Not Started

**Related files:** `packages/layer6‑features/firm‑portal/`

**Definition of Done:**
- Exports `getPortalConfig(subAccountId)` and data aggregation functions: `getPortalProjects(subAccountId)`, `getPortalDocuments(subAccountId)`, `getPortalReports(subAccountId)`, `getPortalInvoices(subAccountId)`.
- All endpoints are scoped to the requesting sub‑account; the portal never returns data from sibling sub‑accounts.
- Agency admin override: when an agency admin queries with a `subAccountId` parameter, they can view that sub‑account’s data (audited).
- White‑label domain configuration: the portal can be served under a custom domain belonging to the agency; tenant identification via `X‑Tenant‑Id` or hostname mapping.
- Per‑sub‑account module toggling: the agency can enable/disable which modules appear in the portal for each sub‑account (e.g., hide Invoices, show Projects).
- Portal activity audit log: records every login, file download, and document view by sub‑account users.

**Out of Scope:** Portal UI (that’s an application in Phase 8). Real‑time updates (SSE endpoints are consumed by the UI but defined here if needed). File storage (delegated to `firm‑media`).

**Rules to Follow:**
- Strict sub‑account isolation: the portal must verify the requesting user belongs to the sub‑account being queried.
- Agency admin access must be audited and scoped; no blind cross‑tenant access.
- Must use `firm‑tenant‑config` for white‑label branding settings (logo, colours, custom domain).

**Advanced Coding Patterns:**
- Aggregation API that fetches data from multiple packages and composes a unified response.
- Module toggling via feature flags stored in `firm‑tenant‑config`.

**Anti-Patterns:**
- Do not expose internal package APIs directly to the portal UI; everything goes through the portal aggregation layer.
- Do not allow a sub‑account user to see another sub‑account’s data, even if they guess the ID.

**DDD:** The portal is a presentation‑layer aggregation service; it does not own any business data but composes data from other bounded contexts.  
**TDD:** Test that a sub‑account user sees only their own data; test that an agency admin can see sub‑account data; test module toggling; test white‑label domain resolution.  
**BDD:** Behavior: a client logs into the portal at `portal.agency.com`; they see a branded dashboard showing their projects, documents, and invoices; they cannot see data from another client.  
**Deep Module:** `firm‑portal` provides a single, secure API that aggregates all client‑facing data and enforces strict multi‑tenant isolation.

#### Subtasks
- [ ] **PH7.1.1** [AGENT] Create package scaffold: `packages/layer6‑features/firm‑portal/`.
- [ ] **PH7.1.2** [AGENT] Implement portal configuration service: `getPortalConfig(subAccountId)` resolves white‑label branding, enabled modules, and domain mapping from `firm‑tenant‑config`. File: `packages/layer6‑features/firm‑portal/src/config.ts`.
- [ ] **PH7.1.3** [AGENT] Implement `getPortalProjects(subAccountId)` that aggregates project and task data from `firm‑projects`. File: `packages/layer6‑features/firm‑portal/src/projects.ts`.
- [ ] **PH7.1.4** [AGENT] Implement `getPortalDocuments(subAccountId)` that aggregates document and e‑signature status from `firm‑documents`. File: `packages/layer6‑features/firm‑portal/src/documents.ts`.
- [ ] **PH7.1.5** [AGENT] Implement `getPortalReports(subAccountId)` that fetches pre‑computed reports from `firm‑reporting`. File: `packages/layer6‑features/firm‑portal/src/reports.ts`.
- [ ] **PH7.1.6** [AGENT] Implement `getPortalInvoices(subAccountId)` that aggregates invoice and payment status from `firm‑billing`. File: `packages/layer6‑features/firm‑portal/src/invoices.ts`.
- [ ] **PH7.1.7** [AGENT] Implement agency admin override logic: allows querying sub‑account data with an explicit `subAccountId` parameter, fully audited. File: `packages/layer6‑features/firm‑portal/src/admin‑override.ts`.
- [ ] **PH7.1.8** [AGENT] Implement portal activity audit: log every login, download, and view action. File: `packages/layer6‑features/firm‑portal/src/audit.ts`.
- [ ] **PH7.1.9** [AGENT] Write integration tests with mock feature packages and isolated sub‑account contexts. File: `packages/layer6‑features/firm‑portal/tests/`.

---

### PH7.2 – Build portal‑specific worker and supporting services
- [ ] **PH7.2** | Status: Not Started

**Related files:** `workers/portal‑notifications/`, `packages/layer6‑features/firm‑portal/src/notifications.ts`

**Definition of Done:**
- A dedicated worker in `workers/portal‑notifications/` subscribes to events that are relevant to portal users (e.g., `document.signed`, `invoice.paid`, `project.task‑completed`) and dispatches in‑app notifications to the affected sub‑account users.
- Portal notification preferences: sub‑account users can opt in/out of email or in‑app notifications per event type.
- File sharing: generates presigned download URLs for documents and reports via `firm‑media`, scoped to the requesting user’s sub‑account.
- Approval workflows: if a document or report requires client approval, the portal exposes endpoints for the client to approve/reject directly (with audit).

**Out of Scope:** Bulk notification delivery (uses `firm‑notifications`). Real‑time SSE (already built in `firm‑sse`; the portal worker publishes events that the SSE channel forwards).

**Rules to Follow:**
- All notifications must respect the user’s preferences.
- Approval actions must be audited and must validate that the user has the `sub‑account‑user` role with appropriate permissions.

**Advanced Coding Patterns:**
- Event‑driven worker that translates internal domain events into portal‑specific notifications.
- Presigned URL generation with short expiry for secure file access.

**Anti-Patterns:**
- Do not send notifications to sub‑account users who have opted out.
- Do not generate presigned URLs that are valid beyond the user’s session.

**DDD:** The portal worker is a supporting service that bridges the core domain events and the portal presentation.  
**TDD:** Test that a `document.signed` event triggers a portal notification; test opt‑out preference; test presigned URL generation; test approval endpoint.  
**BDD:** Behavior: when an invoice is paid, the client receives an in‑app notification in the portal; they can download the invoice as a PDF via a secure link.  
**Deep Module:** The worker encapsulates all portal‑specific event handling, keeping the core feature packages unaware of portal concerns.

#### Subtasks
- [ ] **PH7.2.1** [AGENT] Create worker scaffold: `workers/portal‑notifications/`.
- [ ] **PH7.2.2** [AGENT] Implement worker that subscribes to relevant events (`document.signed`, `invoice.paid`, `project.task‑completed`) and creates portal notifications. File: `workers/portal‑notifications/src/handler.ts`.
- [ ] **PH7.2.3** [AGENT] Implement portal notification preferences management in `firm‑portal`. File: `packages/layer6‑features/firm‑portal/src/notifications.ts`.
- [ ] **PH7.2.4** [AGENT] Implement file sharing service: generates presigned URLs via `firm‑media` scoped to sub‑account. File: `packages/layer6‑features/firm‑portal/src/files.ts`.
- [ ] **PH7.2.5** [AGENT] Implement client approval endpoints (approve/reject document, approve report) with audit. File: `packages/layer6‑features/firm‑portal/src/approvals.ts`.
- [ ] **PH7.2.6** [AGENT] Write integration tests for the worker and supporting services. File: `workers/portal‑notifications/tests/` and `packages/layer6‑features/firm‑portal/tests/`.

---

Phase 8 of the updated TODO.md follows. This final phase covers the remaining background workers, all platform applications, client site generation, infrastructure finalisation, and cross‑cutting integration tests.

---

## Phase 8: Applications, Workers, and Final Infrastructure

*The last mile. All feature packages are built; this phase delivers the application layer, the remaining background workers, the agency marketing site, client site generation, and the operational infrastructure to run everything in production. The application grouping model is determined by ADR‑005.*

---

### PH8.1 – Build `workers/outbox-processor`
- [ ] **PH8.1** | Status: Not Started

**Related files:** `workers/outbox‑processor/`

**Definition of Done:**
- A standalone worker service that runs `firm‑bus`'s outbox reader loop.
- Polls `outbox_events` for pending events, dispatches to registered handlers via the event router, handles retry and dead‑letter.
- Deployed as a separate process (not part of the Next.js server).
- Includes health check endpoint for orchestrator readiness probe.
- Handles graceful shutdown: finishes processing current batch before exiting.

**Out of Scope:** The bus logic itself (that's `firm‑bus`). Individual event handlers (they live in their respective feature packages).

**Rules to Follow:**
- Must use the `firm‑db‑client` read‑only connection for polling; write connection for status updates.
- Must restore `firm‑request‑context` for each event from the event metadata.
- Must respect `FOR UPDATE SKIP LOCKED` when multiple workers are running to prevent duplicate processing.

**Advanced Coding Patterns:**
- Graceful shutdown with batch completion.
- Health check endpoint for Kubernetes readiness probe.

**Anti-Patterns:**
- Do not use `setInterval`; use recursive scheduling with error recovery.
- Do not hardcode the polling interval; use configuration from `firm‑env`.

**DDD:** [N/A] – infrastructure worker.  
**TDD:** Test that the worker picks up a pending event, dispatches it, and marks it complete; test that a failing event is retried; test graceful shutdown.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH8.1.1** [AGENT] Create worker scaffold: `workers/outbox‑processor/`.
- [ ] **PH8.1.2** [AGENT] Implement outbox polling loop using `firm‑bus`'s `OutboxReader` with recursive scheduling and error recovery. File: `workers/outbox‑processor/src/poller.ts`.
- [ ] **PH8.1.3** [AGENT] Implement health check HTTP endpoint for orchestrator probes. File: `workers/outbox‑processor/src/health.ts`.
- [ ] **PH8.1.4** [AGENT] Implement graceful shutdown handler. File: `workers/outbox‑processor/src/shutdown.ts`.
- [ ] **PH8.1.5** [AGENT] Write integration tests with a test database. File: `workers/outbox‑processor/tests/`.

---

### PH8.2 – Build `workers/email-delivery-worker`
- [ ] **PH8.2** | Status: Not Started

**Related files:** `workers/email‑delivery‑worker/`

**Definition of Done:**
- Subscribes to `notification.email.send` events from the outbox.
- Renders the email template via `firm‑template‑engine`, resolves recipient consent via `firm‑consent`, and delivers via the configured email adapter.
- Handles delivery status webhooks (bounce, complaint, open, click) and updates notification status.
- Respects per‑channel retry policy from `firm‑notifications`.
- Exports Prometheus metrics for delivery success rate, latency, and bounce rate.

**Out of Scope:** Digest batching logic (that's in `firm‑notifications`). Email template management.

**Rules to Follow:**
- Must check consent before every send; skip and log if consent absent.
- Must use the email adapter through `EmailPort`; never call the adapter directly.
- Must handle bounces by marking the contact as bounced in the CRM.

**Advanced Coding Patterns:**
- Delivery pipeline: render template → check consent → send via adapter → handle result.

**Anti-Patterns:**
- Do not send email without consent, even if the event is in the queue.
- Do not retry a bounced email to the same address.

**DDD:** [N/A] – infrastructure worker.  
**TDD:** Test successful delivery, consent block, bounce handling, retry exhaustion.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH8.2.1** [AGENT] Create worker scaffold: `workers/email‑delivery‑worker/`.
- [ ] **PH8.2.2** [AGENT] Implement email delivery handler: render → consent check → adapter send. File: `workers/email‑delivery‑worker/src/handler.ts`.
- [ ] **PH8.2.3** [AGENT] Implement bounce/complaint webhook processing. File: `workers/email‑delivery‑worker/src/webhooks.ts`.
- [ ] **PH8.2.4** [AGENT] Implement Prometheus metrics export. File: `workers/email‑delivery‑worker/src/metrics.ts`.
- [ ] **PH8.2.5** [AGENT] Write tests with mock email adapter. File: `workers/email‑delivery‑worker/tests/`.

---

### PH8.3 – Build `workers/sms-delivery-worker`
- [ ] **PH8.3** | Status: Not Started

**Related files:** `workers/sms‑delivery‑worker/`

**Definition of Done:**
- Subscribes to `notification.sms.send` events.
- Resolves consent, renders template, delivers via SMS adapter.
- Handles delivery receipts and status updates.
- Metrics for SMS delivery success/failure.

**Out of Scope:** SMS template management.

**Rules to Follow:**
- Same consent and adapter rules as email worker.

**Advanced Coding Patterns:** Same delivery pipeline pattern as email.

**Anti-Patterns:** Do not send SMS to numbers on the do‑not‑contact list.

**DDD:** [N/A]  
**TDD:** Test delivery, consent block, delivery receipt processing.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH8.3.1** [AGENT] Create worker scaffold: `workers/sms‑delivery‑worker/`.
- [ ] **PH8.3.2** [AGENT] Implement SMS delivery handler. File: `workers/sms‑delivery‑worker/src/handler.ts`.
- [ ] **PH8.3.3** [AGENT] Implement delivery receipt webhook processing. File: `workers/sms‑delivery‑worker/src/webhooks.ts`.
- [ ] **PH8.3.4** [AGENT] Implement metrics. File: `workers/sms‑delivery‑worker/src/metrics.ts`.
- [ ] **PH8.3.5** [AGENT] Write tests with mock SMS adapter. File: `workers/sms‑delivery‑worker/tests/`.

---

### PH8.4 – Build `workers/pdf-generation-worker`
- [ ] **PH8.4** | Status: Not Started

**Related files:** `workers/pdf‑generation‑worker/`

**Definition of Done:**
- Subscribes to `document.render‑pdf` events.
- Renders the document template via `firm‑template‑engine` (Handlebars), generates PDF via Puppeteer or PdfShift adapter.
- Stores the rendered PDF in `firm‑media` and updates the document record with the file URL.
- Emits `document.rendered` event on completion.
- Handles large documents with timeouts and memory limits.

**Out of Scope:** Template rendering logic (that's `firm‑template‑engine`). E‑signature (handled by `firm‑documents`).

**Rules to Follow:**
- PDF generation must be asynchronous; never block the API request.
- Must use `firm‑media` for storage and `firm‑metering` for tracking PDF generation usage.

**Advanced Coding Patterns:**
- Browser pool management for Puppeteer (if used).
- Memory and timeout guards for large documents.

**Anti-Patterns:**
- Do not generate PDFs synchronously in the API handler.
- Do not use a single browser instance without a pool.

**DDD:** [N/A]  
**TDD:** Test PDF generation from a template, storage, and event emission.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH8.4.1** [AGENT] Create worker scaffold: `workers/pdf‑generation‑worker/`.
- [ ] **PH8.4.2** [AGENT] Implement PDF generation handler with Puppeteer browser pool or PdfShift adapter. File: `workers/pdf‑generation‑worker/src/handler.ts`.
- [ ] **PH8.4.3** [AGENT] Implement resource limits and timeout guards. File: `workers/pdf‑generation‑worker/src/limits.ts`.
- [ ] **PH8.4.4** [AGENT] Write tests with mock PDF adapter. File: `workers/pdf‑generation‑worker/tests/`.

---

### PH8.5 – Build `workers/media-processing-worker`
- [ ] **PH8.5** | Status: Not Started

**Related files:** `workers/media‑processing‑worker/`

**Definition of Done:**
- Subscribes to `media.uploaded` events.
- Processes uploaded images: generates WebP/AVIF variants and `srcset` sizes.
- Strips EXIF metadata.
- Generates and stores content hash for deduplication.
- Updates the media record with variant URLs.
- Emits `media.processed` event on completion.

**Out of Scope:** Actual upload (handled by `firm‑media`). CDN invalidation (handled by `firm‑media`).

**Rules to Follow:**
- Must use the image processing library configured in `firm‑media` (sharp or similar).
- Must handle large images with timeouts.

**Advanced Coding Patterns:**
- Image processing pipeline with configurable quality and formats.

**Anti-Patterns:**
- Do not block the upload API while processing; always async.

**DDD:** [N/A]  
**TDD:** Test image variant generation, EXIF stripping, deduplication.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH8.5.1** [AGENT] Create worker scaffold: `workers/media‑processing‑worker/`.
- [ ] **PH8.5.2** [AGENT] Implement image processing handler: variant generation, EXIF stripping, content hash. File: `workers/media‑processing‑worker/src/handler.ts`.
- [ ] **PH8.5.3** [AGENT] Write tests with test image files. File: `workers/media‑processing‑worker/tests/`.

---

### PH8.6 – Build `workers/cron-worker`
- [ ] **PH8.6** | Status: Not Started

**Related files:** `workers/cron‑worker/`

**Definition of Done:**
- A worker that runs the `firm‑bus` cron scheduler.
- Emits scheduled events at their configured cron expressions via the outbox.
- Supports one‑time scheduled events (e.g., delayed hard‑delete for GDPR).
- Ensures exactly‑once emission per schedule tick using distributed locking via `firm‑cache.acquireLock`.
- Health check endpoint.

**Out of Scope:** Cron job definitions (they are registered in `firm‑bus` by feature packages).

**Rules to Follow:**
- Must use distributed lock to prevent duplicate cron emission when multiple workers are running.
- Must log every cron tick and event emission.

**Advanced Coding Patterns:**
- Cron parser and scheduler with distributed lock.

**Anti-Patterns:**
- Do not use `setInterval` for cron; evaluate next tick time dynamically.

**DDD:** [N/A]  
**TDD:** Test that a cron job emits an event at the scheduled time; test duplicate prevention via lock.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH8.6.1** [AGENT] Create worker scaffold: `workers/cron‑worker/`.
- [ ] **PH8.6.2** [AGENT] Implement cron scheduler loop with distributed lock. File: `workers/cron‑worker/src/scheduler.ts`.
- [ ] **PH8.6.3** [AGENT] Implement one‑time delayed event emission. File: `workers/cron‑worker/src/delayed.ts`.
- [ ] **PH8.6.4** [AGENT] Implement health check endpoint. File: `workers/cron‑worker/src/health.ts`.
- [ ] **PH8.6.5** [AGENT] Write tests with a mock clock. File: `workers/cron‑worker/tests/`.

---

### PH8.7 – Build `workers/erasure-worker`
- [ ] **PH8.7** | Status: Not Started

**Related files:** `workers/erasure‑worker/`

**Definition of Done:**
- Subscribes to `compliance.erasure.phase‑2` events (delayed 30 days after Phase 1).
- Executes hard deletion of all anonymised records for the data subject.
- Verifies no PII remains and emits `erasure.hard‑deleted`.
- Generates a deletion confirmation report stored in `firm‑media`.

**Out of Scope:** Phase 1 anonymisation (done by `firm‑compliance`). Erasure request handling.

**Rules to Follow:**
- Must be idempotent: if Phase 2 runs twice, it must not fail.
- Must verify deletion completeness.

**Advanced Coding Patterns:**
- Hard‑delete with cascade across multiple tables.

**Anti-Patterns:**
- Do not execute Phase 2 without confirming Phase 1 completed.

**DDD:** [N/A]  
**TDD:** Test hard deletion, idempotency, verification.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH8.7.1** [AGENT] Create worker scaffold: `workers/erasure‑worker/`.
- [ ] **PH8.7.2** [AGENT] Implement hard‑delete handler with cascade and verification. File: `workers/erasure‑worker/src/handler.ts`.
- [ ] **PH8.7.3** [AGENT] Write tests with test data. File: `workers/erasure‑worker/tests/`.

---

### PH8.8 – Build `workers/search-indexing-worker`
- [ ] **PH8.8** | Status: Not Started

**Related files:** `workers/search‑indexing‑worker/`

**Definition of Done:**
- Subscribes to domain events that affect search indices (e.g., `lead.created`, `lead.updated`, `lead.deleted`).
- Indexes, updates, or deletes documents in the search engine via `firm‑search`.
- Handles batch indexing for bulk operations.

**Out of Scope:** Search querying (that's `firm‑search`).

**Rules to Follow:**
- Must use `firm‑search` API; never call the search engine directly.
- Must carry tenant context in every indexing operation.

**Advanced Coding Patterns:**
- Batch indexing for efficiency.

**Anti-Patterns:**
- Do not index without tenant scoping.

**DDD:** [N/A]  
**TDD:** Test indexing on lead created, updating on lead changed, deletion on lead deleted.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH8.8.1** [AGENT] Create worker scaffold: `workers/search‑indexing‑worker/`.
- [ ] **PH8.8.2** [AGENT] Implement search indexing handler for each indexable entity. File: `workers/search‑indexing‑worker/src/handler.ts`.
- [ ] **PH8.8.3** [AGENT] Implement batch indexing support. File: `workers/search‑indexing‑worker/src/batch.ts`.
- [ ] **PH8.8.4** [AGENT] Write tests with mock search engine. File: `workers/search‑indexing‑worker/tests/`.

---

### PH8.9 – Build `workers/reporting-worker`
- [ ] **PH8.9** | Status: Not Started

**Related files:** `workers/reporting‑worker/`

**Definition of Done:**
- Subscribes to `reporting.generate` events (scheduled reports).
- Generates the report via `firm‑reporting`, renders PDF, stores in `firm‑media`.
- Delivers the report via `firm‑notifications` (email with download link).
- Handles report generation failures with retry.

**Out of Scope:** Report configuration (that's `firm‑reporting`).

**Rules to Follow:**
- Must be asynchronous; report generation can be slow.
- Must respect the tenant's notification preferences.

**Advanced Coding Patterns:** N/A

**Anti-Patterns:**
- Do not generate reports synchronously in the API.

**DDD:** [N/A]  
**TDD:** Test scheduled report generation, delivery, and retry on failure.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH8.9.1** [AGENT] Create worker scaffold: `workers/reporting‑worker/`.
- [ ] **PH8.9.2** [AGENT] Implement report generation handler. File: `workers/reporting‑worker/src/handler.ts`.
- [ ] **PH8.9.3** [AGENT] Implement delivery via `firm‑notifications`. File: `workers/reporting‑worker/src/deliver.ts`.
- [ ] **PH8.9.4** [AGENT] Write tests with mock reporting and notification services. File: `workers/reporting‑worker/tests/`.

---

### PH8.10 – Build `workers/webhook-delivery-worker`
- [ ] **PH8.10** | Status: Not Started

**Related files:** `workers/webhook‑delivery‑worker/`

**Definition of Done:**
- Subscribes to `webhook.deliver` events.
- Delivers the webhook payload to the subscriber's URL with HMAC signature.
- Handles retry with exponential backoff on failure.
- Updates webhook delivery logs and subscription health status.

**Out of Scope:** Webhook subscription management (that's `firm‑webhooks`).

**Rules to Follow:**
- Must sign every payload using the subscriber's shared secret.
- Must respect the max retry count and mark subscription as `failing` on exhaustion.

**Advanced Coding Patterns:**
- HMAC signing and HTTP delivery with timeout.

**Anti-Patterns:**
- Do not retry indefinitely; respect the configured max attempts.

**DDD:** [N/A]  
**TDD:** Test delivery success, delivery failure with retry, signature verification on the receiving end.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH8.10.1** [AGENT] Create worker scaffold: `workers/webhook‑delivery‑worker/`.
- [ ] **PH8.10.2** [AGENT] Implement webhook delivery handler with retry. File: `workers/webhook‑delivery‑worker/src/handler.ts`.
- [ ] **PH8.10.3** [AGENT] Write tests with a mock HTTP server. File: `workers/webhook‑delivery‑worker/tests/`.

---

### PH8.11 – Build `workers/integration-health-worker`
- [ ] **PH8.11** | Status: Not Started

**Related files:** `workers/integration‑health‑worker/`

**Definition of Done:**
- Periodically (every 5 minutes) runs `firm‑integrations.getIntegrationHealth()` across all tenants.
- Proactively refreshes OAuth tokens nearing expiry.
- Emits `integration.degraded` and `integration.disconnected` events for alerting.
- Updates the integration health dashboard data.

**Out of Scope:** The health scoring logic (that's `firm‑integrations`).

**Rules to Follow:**
- Must use distributed lock to prevent duplicate health checks across workers.
- Must not overload external APIs; stagger checks across tenants.

**Advanced Coding Patterns:**
- Staggered health check scheduling.

**Anti-Patterns:**
- Do not run health checks more frequently than the adapter's rate limit allows.

**DDD:** [N/A]  
**TDD:** Test periodic health check, token refresh, degradation event emission.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH8.11.1** [AGENT] Create worker scaffold: `workers/integration‑health‑worker/`.
- [ ] **PH8.11.2** [AGENT] Implement periodic health check loop with distributed lock and staggered scheduling. File: `workers/integration‑health‑worker/src/checker.ts`.
- [ ] **PH8.11.3** [AGENT] Write tests with mock adapters. File: `workers/integration‑health‑worker/tests/`.

---

### PH8.12 – Build `workers/audit-archive-worker`
- [ ] **PH8.12** | Status: Not Started

**Related files:** `workers/audit‑archive‑worker/`

**Definition of Done:**
- Periodically archives audit logs older than a configurable retention period.
- Compresses and exports archives to `firm‑media` (cold storage).
- Verifies archive integrity (hash chain remains valid).
- Deletes archived records from the live audit table after successful archival.

**Out of Scope:** Audit querying (that's `firm‑audit`).

**Rules to Follow:**
- Must preserve the cryptographic hash chain during archival.
- Must not delete audit records before archive integrity is verified.

**Advanced Coding Patterns:**
- Streaming archive generation with compression.

**Anti-Patterns:**
- Do not delete audit records without a verified backup.

**DDD:** [N/A]  
**TDD:** Test archive generation, integrity verification, and safe deletion.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH8.12.1** [AGENT] Create worker scaffold: `workers/audit‑archive‑worker/`.
- [ ] **PH8.12.2** [AGENT] Implement archive handler: query old records, compress, store, verify, delete. File: `workers/audit‑archive‑worker/src/handler.ts`.
- [ ] **PH8.12.3** [AGENT] Write tests with test audit data. File: `workers/audit‑archive‑worker/tests/`.

---

### PH8.13 – Build `workers/kpi-anomaly-worker`
- [ ] **PH8.13** | Status: Not Started

**Related files:** `workers/kpi‑anomaly‑worker/`

**Definition of Done:**
- Periodically runs anomaly detection on all KPIs via `firm‑kpi`.
- Emits `kpi.anomaly.detected` events for significant deviations.
- Sends notifications to agency admins for critical anomalies.

**Out of Scope:** KPI tracking and anomaly detection algorithm (that's `firm‑kpi`).

**Rules to Follow:**
- Must be configurable per tenant (which KPIs to monitor, alert thresholds).

**Advanced Coding Patterns:** N/A

**Anti-Patterns:**
- Do not alert on every minor deviation; respect the configured sensitivity.

**DDD:** [N/A]  
**TDD:** Test that an anomaly triggers an event and notification.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH8.13.1** [AGENT] Create worker scaffold: `workers/kpi‑anomaly‑worker/`.
- [ ] **PH8.13.2** [AGENT] Implement periodic anomaly check loop. File: `workers/kpi‑anomaly‑worker/src/checker.ts`.
- [ ] **PH8.13.3** [AGENT] Write tests with mock KPI data. File: `workers/kpi‑anomaly‑worker/tests/`.

---

### PH8.14 – Build platform applications (per ADR‑005 grouping)
- [ ] **PH8.14** | Status: Not Started

**Related files:** `apps/platform/`

**Definition of Done:**
- Applications are scaffolded and deployed according to the grouping defined in ADR‑005 (recommended: 3‑5 grouped apps).
- Each app is a Next.js application using `firm‑config‑next`, `firm‑ui`, and the feature packages.
- All routes are behind `firm‑auth` with RBAC enforcement.
- White‑label ready: theming via `firm‑theme‑provider` with per‑tenant CSS variables.
- Each app has a `/api/health` endpoint and observability instrumentation.
- The following capabilities are covered across the applications (grouped or individual):
  - Agency portal (internal hub)
  - CRM (lead/deal management)
  - Booking (appointment scheduling)
  - Forms & Landing Pages
  - Funnels & Automation
  - Email Marketing
  - SEO tools
  - Reputation monitoring
  - Ads management
  - Social media scheduling
  - Content & asset management
  - Reporting & dashboards
  - Proposals & Documents
  - Invoicing & Billing
  - Projects & Tasks
  - Unified Inbox
  - Integrations dashboard
  - Platform admin
  - Storybook (component library)
- All apps pass Lighthouse 95+ performance and 100 accessibility.

**Out of Scope:** Client sites (separate generation pipeline). Detailed UI implementation (the apps consume pre‑built feature packages and UI components).

**Rules to Follow:**
- Must use `firm‑config‑next` for security headers and CSP.
- All routes must be protected by `firm‑auth`.
- Tenant context must be set before any data query.
- Must use `firm‑sdk` for any client‑side API calls.

**Advanced Coding Patterns:**
- App composition: each app imports feature package server actions and composes pages.
- Theming injection via `firm‑theme‑provider` with server‑side config resolution.

**Anti-Patterns:**
- Do not implement business logic in the app layer; all logic must be in feature packages.
- Do not call external APIs directly from the app; use adapters.
- Do not hardcode tenant IDs or secrets.

**DDD:** Applications are the presentation layer; they orchestrate UI but contain no domain logic.  
**TDD:** E2E smoke test for each app: login, view data, perform a core action.  
**BDD:** Behavior: an agency admin logs into the CRM app, views their pipeline, and creates a new deal.  
**Deep Module:** Each app is a thin composition layer over the feature packages.

#### Subtasks
- [ ] **PH8.14.1** [HUMAN] Finalise ADR‑005 and decide the exact application grouping. File: `docs/adr/0005‑application‑grouping.md`.
- [ ] **PH8.14.2** [AGENT] Scaffold the application directory structure per ADR‑005 under `apps/platform/`.
- [ ] **PH8.14.3** [AGENT] For each app, scaffold Next.js with `firm‑config‑next`, `firm‑config‑tailwind`, `firm‑ui`, and `firm‑theme‑provider`.
- [ ] **PH8.14.4** [AGENT] Implement `/api/health` route and observability initialisation in each app.
- [ ] **PH8.14.5** [AGENT] Implement auth middleware using `firm‑auth` in each app.
- [ ] **PH8.14.6** [AGENT] Compose pages for each app using the corresponding feature package server actions and `firm‑ui` components.
- [ ] **PH8.14.7** [AGENT] Write E2E smoke tests for each app. File: `e2e/`.

---

### PH8.15 – Build agency marketing site
- [ ] **PH8.15** | Status: Not Started

**Related files:** `apps/marketing‑site/`

**Definition of Done:**
- A Next.js public website for the agency itself.
- CMS‑driven content via `firm‑cms`.
- Lead capture forms integrated with `firm‑forms` and `firm‑sales‑pipeline`.
- Consent banner via `firm‑consent`.
- SEO metadata and structured data via `firm‑seo`.
- Blog with `firm‑cms` content.
- Performance: Lighthouse 95+ performance, 100 accessibility.

**Out of Scope:** Client websites (separate generation). E‑commerce.

**Rules to Follow:**
- Must use `firm‑consent` before loading any analytics or tracking scripts.
- Must validate all form submissions with Turnstile.

**Advanced Coding Patterns:**
- Static generation with incremental revalidation for CMS content.
- Edge caching for static pages.

**Anti-Patterns:**
- Do not hardcode content in the marketing site; all content must come from the CMS.

**DDD:** [N/A] – public website.  
**TDD:** Test that the site renders, forms submit, consent works.  
**BDD:** Behavior: a visitor lands on the agency website, reads a blog post, and submits a contact form that creates a lead in the CRM.  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH8.15.1** [AGENT] Scaffold `apps/marketing‑site/` with Next.js and shared configs.
- [ ] **PH8.15.2** [AGENT] Implement CMS‑driven pages (home, about, services, blog). File: `apps/marketing‑site/app/`.
- [ ] **PH8.15.3** [AGENT] Implement lead capture forms with Turnstile and `firm‑forms` integration. File: `apps/marketing‑site/app/contact/`.
- [ ] **PH8.15.4** [AGENT] Implement consent banner via `firm‑consent`. File: `apps/marketing‑site/app/layout.tsx`.
- [ ] **PH8.15.5** [AGENT] Implement SEO metadata and structured data. File: `apps/marketing‑site/app/`.
- [ ] **PH8.15.6** [AGENT] Write E2E tests. File: `e2e/marketing‑site/`.

---

### PH8.16 – Build client site generation pipeline
- [ ] **PH8.16** | Status: Not Started

**Related files:** `apps/clients/config/`, `packages/layer6‑features/firm‑cms/src/client‑sites.ts`

**Definition of Done:**
- Client sites are generated ephemerally per the model decided in ADR‑006 (recommended: config stored in `apps/clients/config/<slug>.json`, site generated on deploy).
- Each client site is a Next.js app that reads from the config: tenant slug, theme, pages, content blocks.
- Uses `firm‑cms` for content, `firm‑theme‑provider` for branding.
- No committed client‑specific code; everything is driven by config.
- Generation script: `pnpm generate‑client‑site <slug>` produces a deployable app.

**Out of Scope:** Ongoing content editing (that's the CMS). Site hosting (handled by infrastructure).

**Rules to Follow:**
- Must use `firm‑tenant‑config` for branding resolution.
- Must enforce tenant isolation at the application level.

**Advanced Coding Patterns:**
- Ephemeral generation: site is built on push from a config file.
- Config‑driven page composition.

**Anti-Patterns:**
- Do not commit generated client site code.
- Do not store client site configs outside of the repository.

**DDD:** [N/A]  
**TDD:** Test that a config file produces a working site with correct branding and content.  
**BDD:** Behavior: an agency creates a new client site config; on deploy, a fully branded site is generated and served under the client's domain.  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH8.16.1** [HUMAN] Finalise ADR‑006 and document the generation model. File: `docs/adr/0006‑client‑site‑generation.md`.
- [ ] **PH8.16.2** [AGENT] Implement client site config schema and validator. File: `apps/clients/config/schema.ts`.
- [ ] **PH8.16.3** [AGENT] Implement site generation script: `scripts/generate‑client‑site.ts` that reads a config and produces a Next.js app.
- [ ] **PH8.16.4** [AGENT] Create a reference client site config and verify generation. File: `apps/clients/config/example.json`.
- [ ] **PH8.16.5** [AGENT] Write tests for the generation pipeline. File: `scripts/tests/generate‑client‑site.test.ts`.

---

### PH8.17 – Finalise infrastructure: Prometheus, Grafana, runbooks
- [ ] **PH8.17** | Status: Not Started

**Related files:** `infra/prometheus/`, `infra/grafana/dashboards/`, `docs/runbooks/`

**Definition of Done:**
- Prometheus targets configured for all services and workers (metrics endpoints).
- Alert rules defined for all SLO violations (from `docs/slos/`).
- Grafana dashboards as code: at minimum, a platform overview dashboard and per‑service dashboards.
- Runbooks completed for every critical alert (expanded from Phase 1 skeleton).
- Disaster recovery runbook finalised (`docs/stack/operations/disaster‑recovery.md`).
- Incident response playbook finalised (`docs/stack/operations/incident‑response.md`).

**Out of Scope:** Infrastructure provisioning (Terraform/Pulumi). DNS configuration.

**Rules to Follow:**
- Every alert must have a corresponding runbook before being enabled.
- Dashboards must be importable via Grafana provisioning.

**Advanced Coding Patterns:**
- Grafana dashboards as JSON or using a dashboard‑as‑code tool.

**Anti-Patterns:**
- Do not enable alerts without runbooks.
- Do not hardcode server names in dashboards.

**DDD:** [N/A]  
**TDD:** Verify dashboards render with test data.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH8.17.1** [AGENT] Configure Prometheus scrape targets and alert rules in `infra/prometheus/prometheus.yml` and `infra/prometheus/alerts.yml`.
- [ ] **PH8.17.2** [AGENT] Build Grafana dashboards: platform overview, API performance, worker throughput, tenant metrics. File: `infra/grafana/dashboards/`.
- [ ] **PH8.17.3** [HUMAN] Complete disaster recovery runbook. File: `docs/stack/operations/disaster‑recovery.md`.
- [ ] **PH8.17.4** [HUMAN] Complete incident response playbook. File: `docs/stack/operations/incident‑response.md`.
- [ ] **PH8.17.5** [HUMAN] Complete one runbook per critical alert in `docs/runbooks/`.

---

### PH8.18 – Build `tools/catalog/` internal developer portal
- [ ] **PH8.18** | Status: Not Started

**Related files:** `tools/catalog/`

**Definition of Done:**
- A static site or CLI tool that reads the monorepo's `package.json` files and generates a browsable catalog of all packages.
- Shows for each package: name, layer, status, dependencies, Port interfaces (for adapters), and link to source.
- Auto‑generated on each commit or available via a `pnpm catalog` command.

**Out of Scope:** Full Backstage or similar developer portal.

**Rules to Follow:**
- Must read from the filesystem; no manual data entry.

**Advanced Coding Patterns:**
- AST parsing of `package.json` files across the workspace.

**Anti-Patterns:**
- Do not maintain a separate package list manually; it must be generated.

**DDD:** [N/A]  
**TDD:** Test that the catalog includes all packages and shows correct metadata.  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH8.18.1** [AGENT] Create tool scaffold: `tools/catalog/`.
- [ ] **PH8.18.2** [AGENT] Implement catalog generator that reads all `package.json` files and builds a static HTML or JSON output. File: `tools/catalog/src/generate.ts`.
- [ ] **PH8.18.3** [AGENT] Add `pnpm catalog` script to root `package.json`.
- [ ] **PH8.18.4** [AGENT] Write tests. File: `tools/catalog/tests/`.

---

### PH8.19 – Configure Renovate for automated dependency updates
- [ ] **PH8.19** | Status: Not Started

**Related files:** `.github/renovate.json`

**Definition of Done:**
- Renovate bot configured to open PRs for dependency updates.
- Pinning strategy: pin all dependencies.
- `minimumReleaseAge`: 3 days before updating to avoid bad releases.
- Grouped PRs for related packages (e.g., all Drizzle packages in one PR).
- Auto‑merge enabled for patch updates of dev dependencies (optional, with approval).

**Out of Scope:** Actually merging Renovate PRs.

**Rules to Follow:**
- Must respect the monorepo structure with Turborepo.

**Advanced Coding Patterns:** N/A

**Anti-Patterns:**
- Do not auto‑merge major version updates without review.

**DDD:** [N/A]  
**TDD:** [N/A]  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH8.19.1** [HUMAN] Create `.github/renovate.json` with pinning, `minimumReleaseAge`, grouping, and auto‑merge rules.
- [ ] **PH8.19.2** [HUMAN] Enable Renovate on the repository and verify the first PR is opened correctly.

---

### PH8.20 – Configure DNS via DNSControl
- [ ] **PH8.20** | Status: Not Started

**Related files:** `infra/dns/`

**Definition of Done:**
- DNS zones and records defined using DNSControl for all platform domains.
- Includes: apex domain, `www`, API subdomain, portal wildcard, and any regional endpoints.
- DNSControl configuration is committed and can be applied via CI.

**Out of Scope:** Actual DNS provider setup.

**Rules to Follow:**
- Must use DNSControl DSL.

**Advanced Coding Patterns:** N/A

**Anti-Patterns:**
- Do not manually manage DNS records; always use DNSControl.

**DDD:** [N/A]  
**TDD:** [N/A]  
**BDD:** [N/A]  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH8.20.1** [HUMAN] Define DNS zones and records in `infra/dns/dnsconfig.js`.
- [ ] **PH8.20.2** [HUMAN] Verify configuration with `dnscontrol check`.

---

### PH8.21 – Cross‑cutting integration tests (Scenarios A–F)
- [ ] **PH8.21** | Status: Not Started

**Related files:** `e2e/scenarios/`

**Definition of Done:**
- Each scenario from the Constitution's data flow architecture is implemented as an integration test:
  - Scenario A: Lead captured on landing page → lead created, welcome email queued, CRM synced (9 packages).
  - Scenario B: Payment succeeded → invoice paid, receipt sent, revenue recognised.
  - Scenario C: Tenant provisioning saga → sub‑account created with full setup.
  - Scenario D: GDPR right‑to‑erasure → 2‑phase saga completes.
  - Scenario E: Quota enforcement → AI generation blocked when quota exceeded.
  - Scenario F1: Redis‑down → rate limiter fails open.
  - Scenario F2: Outbox crash → exactly‑once delivery verified.
- All scenarios pass against a fully integrated test environment.

**Out of Scope:** Load testing (already done in Phase 1). Unit tests for individual packages.

**Rules to Follow:**
- Must use `firm‑testing` harnesses.
- Must clean up test data after each scenario.

**Advanced Coding Patterns:**
- Toxiproxy integration for chaos scenarios.

**Anti-Patterns:**
- Do not run integration tests against production.

**DDD:** [N/A]  
**TDD:** Each scenario is a test with assertions at every step.  
**BDD:** The scenarios themselves are BDD specifications.  
**Deep Module:** [N/A]

#### Subtasks
- [ ] **PH8.21.1** [AGENT] Implement Scenario A: Lead captured on landing page. File: `e2e/scenarios/scenario‑a‑lead‑creation.ts`.
- [ ] **PH8.21.2** [AGENT] Implement Scenario B: Payment succeeded. File: `e2e/scenarios/scenario‑b‑payment.ts`.
- [ ] **PH8.21.3** [AGENT] Implement Scenario C: Tenant provisioning saga. File: `e2e/scenarios/scenario‑c‑provisioning.ts`.
- [ ] **PH8.21.4** [AGENT] Implement Scenario D: GDPR right‑to‑erasure. File: `e2e/scenarios/scenario‑d‑erasure.ts`.
- [ ] **PH8.21.5** [AGENT] Implement Scenario E: Quota enforcement. File: `e2e/scenarios/scenario‑e‑quota.ts`.
- [ ] **PH8.21.6** [AGENT] Implement Scenario F1: Redis‑down fail‑open. File: `e2e/scenarios/scenario‑f1‑redis‑down.ts`.
- [ ] **PH8.21.7** [AGENT] Implement Scenario F2: Outbox crash exactly‑once. File: `e2e/scenarios/scenario‑f2‑outbox‑crash.ts`.

---

*End of Document.*