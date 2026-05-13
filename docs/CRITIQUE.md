# Enterprise Monorepo — Critique

*This document is the current critique and recommendation document of the enterprise monorepo. This document is updated via planning, and may not reflect the future state of the monorepo.*

---

Here’s the updated **Part 1: What the Architecture Gets Right — Do Not Change**, with the original list preserved and the new items appended exactly as planned.

---

## Part 1: What the Architecture Gets Right — Do Not Change

✅ **Seven‑layer taxonomy** – machine‑enforced import boundaries via `@firm/config-eslint`.  
✅ **Three Platform Laws** – adapters only external boundary; `tenantId` derived from session, never trusted; outbox only async primitive. CI enforced.  
✅ **RLS as safety net** – app‑layer + RLS, both tested (Gates 10, 12). RLS health check in `firm-health` readiness probe.  
✅ **Branded IDs** (`TenantId`, `UserId`, etc.) + gatekeepers (`asTenantId`).  
✅ **`AsyncLocalStorage` via `firm-request-context`** – sole context carrier, no function threading.  
✅ **Changesets** – fixed versioning for Layer 0 config; independent for adapters/features.  
✅ **Outbox pattern enforcement** – ESLint rule flags direct adapter calls from feature packages.  
✅ **Adapter scaffolding generator** – enforces uniform structure, stub generation, and conformance test creation across all 105 adapters.  
✅ **Compliance deadline calendar** – embedded directly in the Critique, giving architecture decisions explicit business urgency.  
✅ **PgBouncer RESET wrapper** – implemented in `firm-db-client` to guard against cross‑tenant data leaks in pooled environments; directly mitigates the highest‑severity vulnerability.  
✅ **Named rate limit policies** – rate limit rules must be defined by name (never inline) and are enforced via build failure; ensures observability and consistent governance.  
✅ **Human‑approval gate** – treated as a structural platform constraint, not a temporary feature flag; required for AI‑generated content, high‑risk operations, and certain compliance workflows.  
✅ **Port‑and‑adapter pattern** – all third‑party dependencies are isolated behind Ports, keeping the core platform pure and testable.  
✅ **AI agent context files** – `CLAUDE.md` and `AGENTS.md` at repository root, ensuring any AI assistant (human or automated) operates with the same architectural understanding and constraints.

---

Here’s the fully expanded **Part 2: Resolved Decisions & Contradictions** — the authoritative record of closed debates, combining the original 6 entries with the 19 newly settled items from the Master Analysis. I’ve added a **Source** column to trace where each contradiction originated.

---

## Part 2: Resolved Decisions & Contradictions

*This section serves as the authoritative record of all resolved architectural debates. Once an item appears here, it is closed and should not be re‑litigated without new evidence.*

| # | Decision | Resolution | Source |
|---|----------|------------|--------|
| 1 | Monorepo orchestrator | **Turborepo now, Nx later.** Migrate when: first TS engineer hired, >60 packages, CI >15 min, Nx Cloud free tier covers workload, or adapter scaffolding generator needed. Until then, `tools/workspace-plugin/` holds generator templates (manual run). | Original Critique |
| 2 | Turborepo configuration schema | **v2 schema** — `turbo.json` uses `"tasks": {}` (not `"pipeline"`). | Original Critique |
| 3 | Adapter naming convention | **`adapters-<category>-<provider>`** (flat). Example: `adapters-crm-hubspot`. Subdirectory grouping by category within the flat naming structure. | Original Critique |
| 4 | Next.js version | **15** (App Router). `firm-config-next` targets `^15.0.0`. | Original Critique |
| 5 | Rate limiter package location | **Extracted to `firm-rate-limiter`** (Layer 3, new package). Sliding window + token bucket, Redis-backed. `firm-security` retains CSP, CSRF, audit logging, C2PA. | Original Critique |
| 6 | Testing package name & scope | **`firm-test-utils` → `firm-testing`** (Layer 5, `@firm/testing`). Expanded scope: PGLite harness, `ioredis-mock`, test factories, stub adapters, tenant isolation fixtures. Zero production artifacts. | Original Critique |
| 7 | Total adapter count | **105 is authoritative.** All documents (Blueprint, Critique, Assessment, roadmap) use this count. Includes all new categories and providers accepted via Decision 16 and Decision 17. | Master Analysis |
| 8 | Application count & grouping | **22 apps under `apps/platform/`** are catalogued as planned. Whether they remain separate, are grouped into 3–5 hybrid apps, or unified into a single application is an **open ADR** (see Part 11). Until resolved, the catalog lists all 22; implementation follows the ADR outcome. | Master Analysis |
| 9 | `firm-rate-limiter` extraction | **Confirmed.** Extraction from `firm-security` is a Phase 1 action (Fix 2b). The new package lives at Layer 3 and exports named policies only. | Master Analysis |
| 10 | `firm-test-utils` → `firm-testing` | **Confirmed.** Rename and scope expansion are accepted. Package now provides PGLite, `ioredis-mock`, test harnesses, and tenant isolation fixtures. | Master Analysis |
| 11 | `firm-db` split | **Must split into `firm-db-schema` + `firm-db-client`** before any Layer 6 package is built. Read model home (`firm-db-read` or subdirectory in `firm-db-schema`) is TBD per ADR (see Part 11). Migration runner points at `firm-db-schema`. | Master Analysis |
| 12 | `firm-ai` split | **Two packages:** `firm-ai` (infrastructure: model routing, token tracking, budget enforcement) + `firm-ai-content` (generation, compliance checks, human‑approval gate, C2PA manifest generation). | Master Analysis |
| 13 | Tier D package count & composition | **Keep 12 packages as per Blueprint.** `firm-documents` stays in Tier B. `firm-proposals` and `firm-tracking` are removed. `firm-analytics` is provisionally accepted with scope TBD by ADR. | Master Analysis |
| 14 | Branded IDs expansion | **`firm-primitives` now includes:** `TenantId`, `UserId`, `AgencyId`, `SubAccountId`, `PlatformId`, `SessionId`. Domain‑level branded types (e.g., `LeadId`, `CampaignId`) live in `firm-types`. | Master Analysis |
| 15 | `firm-sdk` location | **Moved from Layer 6 (Tier A) to Layer 2**, alongside `firm-api-contracts`. Exposes a typed, tenant‑aware client for third‑party integrations and the platform’s own frontends. | Master Analysis |
| 16 | Missing adapter categories | **Accepted as required.** Five new categories added to the 105‑adapter count: PDF Generation (2), AI Image Generation (2), Video Conferencing (3), Email Deliverability Validation (3), Local Storage (1). | Master Analysis |
| 17 | Missing adapter providers | **Accepted.** Added to adapter priority list: `adapters-crm-activecampaign`, `adapters-crm-keap`, `adapters-email-mailgun`, `adapters-analytics-posthog`. SCIM split into `adapters-scim-okta` + `adapters-scim-azure-ad`. | Master Analysis |
| 18 | `firm-pipeline` rename | **→ `firm-sales-pipeline`.** Clarifies that this package is sales‑specific, distinct from any future general workflow pipeline. | Master Analysis |
| 19 | `firm-config` (L5) rename | **→ `firm-theme-provider`.** Eliminates confusion with the 13 Layer 0 `firm-config-*` packages. | Master Analysis |
| 20 | `firm-telemetry` rename | **→ `firm-kpi`.** Reflects that the package provides KPI definitions and calculations, not low‑level telemetry (which belongs to `firm-observability`). | Master Analysis |
| 21 | `services/` directory rename | **→ `workers/`.** All background services are renamed to workers. `worker` added as a named ESLint boundary type. | Master Analysis |
| 22 | Missing root files & directories | **Accepted as required.** New root additions: `.github/ISSUE_TEMPLATE/`, `SECURITY.md`, `CONTRIBUTING.md`, `load-tests/`, `chaos/`, `policies/`, `docs/slos/`, expanded `docs/runbooks/`, `docs/compliance/data-residency.md`, `contracts/v1/`, `tools/catalog/`. | Master Analysis |
| 23 | Adapter discoverability | **`packages/layer7-adapters/REGISTRY.md`** is the auto‑generated adapter discovery mechanism. Updated by the scaffolding generator on every adapter creation. | Master Analysis |
| 24 | Stub generation | **Adapter scaffolding generator must produce stub + conformance test simultaneously.** CI enforces at Gate 13 (adapter interface compliance). No adapter is accepted without both. | Master Analysis |
| 25 | Contract versioning | **`contracts/v1/`** schema build pipeline produces versioned OpenAPI, AsyncAPI 3.0, and JSON Schema artifacts. Generated and committed. CI gate (Gate 17) validates generated artifacts match source. | Master Analysis |

---

Here is the updated **Part 3: Critical Findings — Security & Data Integrity Risks**, restructured and expanded as planned.

---

## Part 3: Critical Findings — Security & Data Integrity Risks

### 3.1 RLS + Connection Pooler – Highest Severity Vulnerability

**Problem:** PgBouncer in **transaction mode** can retain `SET LOCAL app.current_tenant_id` across requests → cross‑tenant data leak.

**Fix (expanded):**

1. **Documentation block** — Add a prominent comment block in `firm-db/src/connection.ts` (will become `firm-db-client/src/connection.ts` after split) documenting the absolute requirement for session‑mode pooling when RLS is active.
2. **Runtime assertion** — In the `pooled` connection factory, verify that `application_name` includes the tenant ID. If absent or mismatched, throw immediately before any query executes.
3. **Integration test (Gate 10)** — After `withTenantContext(tenantA)` completes, a bare query (no tenant context) must see zero tenantA data. This test must run on every PR.
4. **Runbook** — Create `docs/runbooks/connection-pooler-rls.md` covering detection, mitigation, and recovery steps.
5. **Chaos playbook** — Create and execute a controlled PgBouncer eviction scenario in `chaos/`. This scenario must pass and be reviewed **before any EU client is onboarded**. It validates that the RESET wrapper (Fix 8) works under real failure conditions and that monitoring alerts fire correctly.

---

### 3.2 Phase 1 Fix Sequence (Authoritative)

*This table replaces all prior fix ordering. Fixes must be executed in the exact sequence below. Dependencies between fixes are documented in the “Unblocks” column.*

| # | Fix | Package | Severity | Unblocks |
|---|-----|---------|----------|----------|
| 0 | Add comprehensive tests + fix design flaw (remove `[key: string]: any`) | `firm-request-context` | 🔴 | everything above L1 |
| 1 | `TenantCache.set()` reject non‑numeric TTL | `firm-cache` | 🔴 | Fix 2 |
| 2a | Rate limiter: fix `CacheClient` import | `firm-security` | 🔴 | Fix 3 |
| 2b | Extract rate limiter into `firm-rate-limiter` | new package (`firm-rate-limiter`) | 🔴 | clean L3 boundaries |
| 3 | Remove `startImpersonationLegacy`; tighten `session.role` from `string` to `Role` | `firm-auth` | 🟠 | – |
| 4 | Campaign missing imports; lead v1↔v2 migration non‑existent fields | `firm-validators` | 🔴 | all feature packages |
| 5 | Move `import { or }` to top; replace `table: any` with `PgTable` | `firm-db` | 🟡 | type safety |
| 6 | Remove `ContextManager.currentContext` (split‑brain) – read only from `getUnifiedContext()` | `firm-logger` | 🔴 | trace/tenant correlation |
| 7 | Add `observabilityHealthCheck()` to readiness probe (OTel init + span export) | `firm-health` | 🟠 | production readiness |
| 8 | Add PgBouncer RESET wrapper | `firm-db-client` (post‑split) | 🔴 | tenant isolation |
| 9 | Create `adapter-storage-local` | new adapter package | 🔴 | all local media development |
| 10 | Add `checkQuota()` + CI enforcement gate | `firm-metering` | 🔴 | usage control guarantee |

---

### 3.3 Compliance Deadline Calendar (90 days from May 2026)

*Unchanged. All deadlines remain in force.*

| Deadline | Obligation | Packages | Done Definition |
|----------|------------|----------|----------------|
| Jun 9 | NY Synthetic Performer labels | `firm-ai`, `firm-consent` | disclosure label stored in `ai_generation_log`; rendered non‑removable |
| Jun 15 | Google Consent Mode v3 | `firm-consent`, all `apps/clients/*` | `ad_storage` gates Google Ads; CI Gate 14 verifies |
| Jul 14 | CNIL email tracking pixel consent | `firm-consent`, `firm-email` | pixel suppressed for EU until explicit opt‑in |
| Aug 2 | EU AI Act Art. 50 (C2PA manifests) | `firm-security`, `firm-ai`, `firm-ai-content` | manifest generated and stored in `ai_generation_log.c2pa_manifest` |

---

### 3.4 Critical Finding: No `checkQuota()` Enforcement

**Problem:** Metering is currently post‑operation only. Quota overages are detected after resources (AI tokens, storage, API calls) have already been consumed. This breaks the hard platform guarantee of usage control.

**Fix:**

1. **Primary API** — `checkQuota(tenantId, dimension, amount): Promise<Result<QuotaAllowed, QuotaExceeded>>` must be the **only** entry point for quota‑enforced operations. All metered operations must call `checkQuota()` before consuming resources.
2. **CI static analysis gate** — A new CI gate (`check-quota-calls`) detects any metered operation that is not immediately preceded by a `checkQuota()` call. Build fails on violation.
3. **Phase 1 priority** — This fix is number 10 in the Phase 1 sequence; it unblocks all feature packages that consume billable resources.

---

### 3.5 Critical Finding: No Load Testing or Chaos Testing

**Problem:** The three hard platform guarantees — no event loss, tenant isolation, rate limiter fail‑open — cannot be fully verified by unit and integration tests alone. They require controlled failure injection and concurrency testing that does not currently exist.

**Fix:**

1. **`load-tests/` directory** — Implement k6 scenarios covering:
   - Tenant isolation under concurrent requests.
   - Outbox throughput (events per second, end‑to‑end latency).
   - Rate limiting (sliding window accuracy, token bucket refill under burst).
   - Lead creation burst (verifying no duplicate or lost leads).

2. **`chaos/` directory** — Implement Toxiproxy scenarios covering:
   - Redis failure (rate limiter fail‑open, cache degradation).
   - Outbox worker crash and recovery (no event loss).
   - PgBouncer eviction (tenant isolation holds, RESET wrapper works).
   - Adapter timeout and retry exhaustion (dead letter queue routing).

3. **Pre‑client onboarding gate** — The PgBouncer eviction scenario must be executed and passed before any EU client is onboarded (linked to 3.1 Fix 5).

4. **Runbooks** — Each chaos scenario requires a corresponding runbook in `docs/runbooks/` before the test is executed.

---

Here’s the updated **Part 4: Build & TypeScript Architecture**, preserving the original content and adding the two planned clarifications.

---

## Part 4: Build & TypeScript Architecture

### 4.1 TypeScript Project References (CI performance)

Every package `tsconfig.json` enables composite builds with declaration maps:

```json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "references": [
    { "path": "../firm-primitives" },
    { "path": "../firm-types" }
  ]
}
```

The root `tsconfig.json` acts as a solution file referencing all packages. This configuration takes cold CI from ~11 minutes to ~3 minutes.

### 4.2 Dual‑Pass Build (every package)

Every package runs separate JavaScript and type declaration builds:

```json
{
  "scripts": {
    "build:js": "tsdown --format esm,cjs --sourcemap",
    "build:types": "tsc --emitDeclarationOnly --declarationMap",
    "build": "concurrently 'pnpm build:js' 'pnpm build:types'"
  }
}
```

Turborevo tasks: `build:js`, `build:types`, and `build` (which depends on both). This pattern is enforced for all packages, including adapters and workers.

### 4.3 tsgo (TypeScript 7 forward path)

`tsgo` is used for `--noEmit` type‑checking in CI for speed. `tsc` remains for declaration emit until TypeScript 7 reaches GA (H2 2026), at which point `tsgo` will handle all emit.

### 4.4 `firm-config-docker` Template Requirements

The `firm-config-docker` package must enforce a standard Dockerfile template that includes:

- **Multi‑stage build** — separate build and production stages to minimise image size.
- **Non‑root user** — the container must run as an unprivileged user (UID ≥ 10000).
- **`tini` as PID 1** — ensures proper signal handling and zombie reaping.
- **Standard `HEALTHCHECK`** — every service image must include a health check directive that calls the application’s `/health` endpoint.

These requirements are applied to all worker images and any containerised application in the monorepo.

### 4.5 `firm-config-next` Server‑Only Package Guard

The `firm-config-next` configuration must explicitly list server‑only packages under `serverExternalPackages` to prevent Next.js 15 (App Router) from attempting to bundle them for the client:

```json
{
  "serverExternalPackages": ["pino", "drizzle-orm", "postgres"]
}
```

This list must be kept current as new server‑only dependencies are added to the platform. Failure to maintain it results in client‑side build errors and potential secret leakage.

---

Here is **Part 5: Dependency Governance**, with the only change being a note about the conditional `inngest` dependency pending the `firm-bus` ADR.

---

## Part 5: Dependency Governance

### 5.1 Named pnpm Catalogs (`pnpm-workspace.yaml`)

Dependencies are grouped into named catalogs to keep versions consistent across all packages:

```yaml
catalogs:
  default:
    typescript: ^5.5.0
    next: ^15.0.0
    react: ^19.0.0
    zod: ^3.23.0
    vitest: ^2.0.0
  server:
    drizzle-orm: ^0.33.0
    postgres: ^3.4.0
    ioredis: ^5.3.0
    pino: ^9.4.0
    better-auth: ^1.0.0
    inngest: ^3.0.0
  observability:
    '@opentelemetry/api': ^1.9.0
    '@sentry/node': ^8.0.0
  security:
    argon2: ^0.40.0
    otplib: ^12.0.1
  ui:
    '@radix-ui/react-dialog': ^1.1.0
    tailwindcss: ^3.4.0
    lucide-react: ^0.400.0
```

Packages reference catalogs with the shorthand `"zod": "catalog:"`.

**Note:** The `inngest` entry in the `server` catalog is **conditional on the outcome of the `firm-bus` ADR** (see Part 11). If the ADR selects a custom outbox‑only execution model over Inngest, `inngest` must be removed from this catalog.

### 5.2 Catalog Enforcement (`.npmrc`)

The following `.npmrc` directives ensure strict catalog adherence and supply‑chain hygiene:

```ini
catalog-mode=strict
minimumReleaseAge=1440
blockExoticSubdeps=true
```

- `catalog-mode=strict` prevents any package from specifying a dependency version outside of a named catalog.
- `minimumReleaseAge=1440` (24 hours) blocks newly published packages, reducing supply‑chain risk.
- `blockExoticSubdeps=true` prohibits installation of packages with non‑standard sub‑dependency resolution that could bypass catalog enforcement.

### 5.3 Renovate Configuration (excerpt)

Renovate is configured to respect pnpm catalogs, prioritise security‑sensitive packages, and automate safe adapter updates:

```json
{
  "pnpmCatalogs": true,
  "packageRules": [
    {
      "matchPackagePatterns": ["typescript", "eslint", "prettier"],
      "groupName": "layer-0-tooling"
    },
    {
      "matchPackageNames": ["next", "react", "react-dom"],
      "prPriority": 10
    },
    {
      "matchPaths": ["packages/adapters/**"],
      "matchUpdateTypes": ["patch"],
      "automerge": true
    },
    {
      "matchDepTypes": ["dependencies"],
      "matchPackagePatterns": ["argon2", "better-auth"],
      "schedule": ["at any time"],
      "labels": ["security"]
    }
  ]
}
```

---

Here is **Part 6: Complete Repository Structure (Authoritative)** — fully refreshed with all splits, renames, relocations, new directories, and ADR notes from the Master Analysis.

---

## Part 6: Complete Repository Structure (Authoritative)

### 6.1 Root Files & Directories

The repository root contains the following inventory. All items marked **new** were added per Master Analysis M4 and are now required.

```
.github/
  workflows/                  # CI/CD pipeline definitions
  CODEOWNERS                  # ownership boundaries
  ISSUE_TEMPLATE/             # new: bug report, feature request, ADR proposal, security vulnerability
.husky/                       # Git hooks
.changeset/                   # Changesets configuration
.vscode/                      # Editor settings
apps/                         # 22 platform applications + client sites (see 6.2)
packages/                     # 145+ packages across 8 layers (see 6.3)
workers/                      # renamed from services/ (see 6.4)
infra/                        # Docker, Prometheus, Grafana, Loki, Tempo, Cloudflare, Vercel
scripts/                      # CI validators, generation scripts
docs/                         # ADRs, runbooks, API docs, architecture, compliance, onboarding, AI context, stack, verticals
  slos/                       # new: six SLO definitions
  compliance/                 # new: data-residency.md and other compliance documentation
  runbooks/                   # expanded: one runbook per Grafana alert
e2e/                          # Playwright end-to-end tests
stubs/                        # adapter stubs (auto-generated, not hand-authored)
benchmarks/                   # performance benchmarks
contracts/                    # versioned contract artifacts
  v1/                         # new: OpenAPI, AsyncAPI 3.0, JSON Schema (generated, committed)
sbom/                         # CycloneDX SBOMs (generated in CI)
local-dev/                    # local development tooling
tools/
  workspace-plugin/            # Turborepo generator templates (manual run until Nx migration)
  catalog/                     # new: generated static service catalog (developer portal MVP)
load-tests/                   # new: k6 scenarios, thresholds, results
chaos/                        # new: Toxiproxy scenarios, playbooks, tools
policies/                     # new: reserved for future OPA Rego policies (README explains migration trigger)

Root files:
  package.json                # only turbo, typescript, pnpm; "packageManager": "pnpm@9.x.x"
  turbo.json                  # v2 schema: "tasks": {}
  pnpm-workspace.yaml         # catalogs definition
  .npmrc                      # catalog-mode=strict, minimumReleaseAge=1440, blockExoticSubdeps=true
  .nvmrc                      # 22.x
  tsconfig.json               # solution file referencing all packages
  CLAUDE.md                   # AI agent context (<2k tokens)
  AGENTS.md                   # AI agent context (extended)
  SECURITY.md                 # new: vulnerability reporting and security policy
  CONTRIBUTING.md             # new: contribution guidelines and developer setup
```

---

### 6.2 `apps/` — Applications (28 total)

```
apps/
├── firm-site/                     # agency marketing website
├── clients/                       # generated client sites
│   ├── _template/                 # base template for client generation
│   └── config/<slug>.json         # per-client configuration
└── platform/                      # platform applications
    ├── platform-portal
    ├── platform-analytics
    ├── platform-crm
    ├── platform-booking          # self‑hosted booking
    ├── platform-forms
    ├── platform-funnels
    ├── platform-landing-pages
    ├── platform-email
    ├── platform-seo
    ├── platform-reputation
    ├── platform-ads
    ├── platform-social
    ├── platform-content
    ├── platform-reporting
    ├── platform-proposals
    ├── platform-invoicing
    ├── platform-projects
    ├── platform-documents
    ├── platform-chat
    ├── platform-storybook
    ├── platform-admin
    └── platform-campaigns        # (if separate from CRM)
```

> **⚠️ ADR Pending:** Whether these 22 platform apps remain separate, are grouped into 3–5 hybrid applications, or unified into a single application is an **open ADR** (see Part 11, Item 2). The default recommendation is grouping into 3–5 hybrid apps for operational simplicity and cost efficiency. Until the ADR is resolved, all 22 are catalogued as planned; implementation will follow the ADR outcome.

> **Generation model:** `apps/clients/` generation is TBD per ADR (Part 11, Item 10). The current recommendation is ephemeral generation at deploy time, not committed source. `_template/` and per‑client `config/<slug>.json` are committed; generated output is not.

---

### 6.3 `packages/` — 145+ Packages (8 Layers)

#### Layer 0 — Build & Constraint (13 packages)

| Package | Purpose |
|---------|---------|
| `config/firm-primitives` | Branded types: `TenantId`, `UserId`, `AgencyId`, `SubAccountId`, `PlatformId`, `SessionId` |
| `firm-config-typescript` | Shared `tsconfig.json` base |
| `firm-config-eslint` | ESLint config with layer boundary rules |
| `firm-config-prettier` | Prettier config |
| `firm-config-next` | Next.js 15 shared config; `serverExternalPackages` for server‑only deps |
| `firm-config-tailwind` | Tailwind CSS config |
| `firm-config-vitest` | Vitest shared config |
| `firm-config-playwright` | Playwright shared config |
| `firm-config-commitlint` | Commit message linting rules |
| `firm-config-docker` | Dockerfile template (multi‑stage, non‑root, `tini`, `HEALTHCHECK`) |
| `firm-config-storybook` | Storybook shared config |
| `firm-config-security-headers` | Shared security header policies (CSP, HSTS, etc.) |
| `firm-tokens` | Design tokens (also referenced in Layer 5) |

#### Layer 1 — Core Utilities & Environment (6 packages)

| Package | Purpose | Status |
|---------|---------|--------|
| `core/firm-env` | Environment validation and typing | ✅ |
| `firm-utils` | Shared utilities | ✅ |
| `firm-errors` | Structured error types | ✅ |
| `firm-crypto` | Cryptographic primitives | ✅ |
| `firm-logger` | Structured logging (Pino) | ⚠️ Fix 6 — split‑brain `ContextManager.currentContext` |
| `firm-request-context` | `AsyncLocalStorage`‑based context | ⚠️ Fix 0 — 0% tests, design flaw |

#### Layer 2 — Data & Contracts (7 packages)

| Package | Purpose | Status |
|---------|---------|--------|
| `core/firm-types` | Domain‑level branded IDs (`LeadId`, `CampaignId`), shared types | ⚠️ needs primitives extraction |
| `firm-validators` | Zod schemas, tenant‑scoped validation | ⚠️ Fix 4 — missing imports, broken migrations |
| `firm-api-contracts` | API contract definitions (shared between client/server) | ✅ |
| `firm-sdk` | Typed, tenant‑aware SDK for third‑party integrations and frontends | ✅ relocated from L6 |
| `firm-db-schema` | Drizzle schema definitions, migrations | ✅ new — split from `firm-db` |
| `firm-db-client` | Connection factories (serverless, pooled, direct), PgBouncer RESET wrapper | ✅ new — split from `firm-db` |
| `firm-cache` | Tenant‑aware caching (Redis) | ⚠️ Fix 1 — TTL validation |

> **Optional:** `firm-db-read` — CQRS read model home. Existence and location TBD per ADR (Part 11, Item 3).

#### Layer 3 — Identity, Security & Consent (4 packages)

| Package | Purpose | Status |
|---------|---------|--------|
| `security/firm-auth` | Authentication, sessions, role management | ⚠️ Fix 3 — legacy impersonation, loose typing |
| `firm-security` | CSP, CSRF, audit logging, C2PA support | ⚠️ Fix 2a — broken `CacheClient` import |
| `firm-rate-limiter` | Sliding window + token bucket (Redis), named policies only | ✅ new — extracted from `firm-security` (Fix 2b) |
| `firm-consent` | Consent management, GDPR/CNIL compliance | ✅ |

#### Layer 4 — Observability & Health (2 packages)

| Package | Purpose | Status |
|---------|---------|--------|
| `observability/firm-observability` | OpenTelemetry setup, tenant‑aware spans/meters | ⚠️ Fix 7 — missing readiness health check |
| `firm-health` | Health endpoint utilities, readiness probes | ⚠️ needs OTel check per Fix 7 |

#### Layer 5 — UI, Theming & Testing (4 packages)

| Package | Purpose |
|---------|---------|
| `ui/firm-ui` | Shared React component library |
| `firm-tokens` | Design tokens (also Layer 0) |
| `firm-theme-provider` | Theme provider (renamed from `firm-config`) |
| `firm-testing` | Test harnesses: PGLite, `ioredis-mock`, factories, stub adapters, tenant isolation fixtures |

#### Layer 6 — Feature Packages (Tiers A–D, 38 packages)

**Tier A — Foundation (12 packages)**  
`firm-bus` · `firm-notifications` · `firm-webhooks` · `firm-storage` · `firm-media` · `firm-features` · `firm-search` · `firm-i18n` · `firm-tenancy` · `firm-white-label` · `firm-onboarding` · `firm-sse`

*Note: `firm-sdk` relocated to Layer 2. `firm-sse` added as new package.*

**Tier B — Core Business (12 packages)**  
`firm-leads` · `firm-forms` · `firm-campaigns` · `firm-bookings` · `firm-landing-pages` · `firm-funnels` · `firm-social` · `firm-seo` · `firm-projects` · `firm-compliance` · `firm-audit` · `firm-documents` · `firm-sales-pipeline`

*Note: `firm-tracking` removed. `firm-documents` moved from Tier D. `firm-sales-pipeline` renamed from `firm-pipeline`.*

**Tier C — Revenue (3 packages)**  
`firm-payments` · `firm-billing` · `firm-metering`

**Tier D — Specialised Applications (12 packages)**  
`firm-portal` · `firm-reporting` · `firm-reputation` · `firm-ads` · `firm-cms` · `firm-ai` · `firm-ai-content` · `firm-ai-brand-voice` · `firm-ai-seo` · `firm-ai-chat` · `firm-inbox` · `firm-analytics`

*Note: `firm-ai` split into `firm-ai` (infrastructure) and `firm-ai-content` (generation + compliance + C2PA). `firm-analytics` provisionally accepted; scope TBD by ADR. `firm-proposals` and `firm-tracking` removed. `firm-documents` moved to Tier B.*

#### Layer 7 — Adapters (105 packages)

Naming: `adapters-<category>-<provider>` (flat). Subdirectory grouping by category within the flat naming structure.

All adapters are generated via the scaffolding generator; no hand‑authored adapters are permitted. Discovery is via auto‑generated `packages/layer7-adapters/REGISTRY.md`.

**Category breakdown (updated with new categories and providers):**

| Category | Count | Includes |
|----------|-------|----------|
| CRM | 9 | HubSpot, Salesforce, Pipedrive, Zoho, ActiveCampaign, Keap, Monday.com, Freshsales, SugarCRM |
| Email | 7 | SendGrid, Mailchimp, Brevo, Mailgun, ConvertKit, Klaviyo, Constant Contact |
| SMS | 4 | Twilio, Vonage, Sinch, 46elks |
| Billing/Payments | 5 | Stripe, Paddle, Chargebee, Recurly, Lemon Squeezy |
| Storage | 4 | S3, Cloudflare R2, GCS, Azure Blob |
| Analytics | 6 | GA4, Mixpanel, Amplitude, PostHog, Plausible, Fathom |
| AI | 6 | OpenAI, Anthropic, Cohere, Google AI, Mistral, Groq |
| AI Image Generation | 2 | OpenAI DALL‑E, Stability AI |
| Social | 6 | Meta, Instagram, LinkedIn, X, TikTok, Pinterest |
| Ads | 5 | Google Ads, Meta Ads, LinkedIn Ads, TikTok Ads, Reddit Ads |
| SEO | 5 | Ahrefs, SEMrush, Moz, Google Search Console, Screaming Frog |
| Reviews | 7 | Google Business, Trustpilot, Yelp, G2, Capterra, Product Hunt, Glassdoor |
| Calendar/Booking | 8 | Google Calendar, Outlook, Calendly, Acuity, SavvyCal, Cronofy, OnceHub, YouCanBookMe |
| E‑Commerce | 5 | Shopify, WooCommerce, BigCommerce, Magento, Stripe Connect |
| Accounting | 3 | QuickBooks, Xero, FreshBooks |
| Project Management | 5 | ClickUp, Asana, Monday.com, Trello, Jira |
| Proposals | 4 | PandaDoc, Proposify, Qwilr, Better Proposals |
| Chat/Comms | 7 | Slack, Discord, WhatsApp Business, Telegram, Signal, Microsoft Teams, Zendesk |
| Video Conferencing | 3 | Zoom, Google Meet, Microsoft Teams |
| Design | 2 | Figma, Canva |
| Automation | 4 | Zapier, Make, n8n, Pipedream |
| PDF Generation | 2 | DocSpring, PDFMonkey |
| Email Deliverability | 3 | Mailgun Email Validation, ZeroBounce, NeverBounce |
| Local Storage | 1 | `adapter-storage-local` (development) |
| SCIM | 2 | Okta, Azure AD |
| Vertical‑specific | 12 | (as previously defined) |

---

### 6.4 `workers/` — Background Workers (13)

*Renamed from `services/`. `worker` is now a named ESLint boundary type.*

```
workers/
├── worker-outbox-processor
├── worker-campaigns
├── worker-crm-sync
├── worker-email-delivery
├── worker-sms-delivery
├── worker-reports
├── worker-ai-generation
├── worker-data-retention
├── worker-billing-events
├── worker-tenant-provisioning
├── worker-reputation
├── worker-analytics-rollup
└── worker-social-scheduler
```

**Contract (per worker):**
- `src/index.ts` — entry point
- `health.ts` — `GET /health` endpoint
- `metrics.ts` — Prometheus metrics
- `Dockerfile` — multi‑stage, non‑root, `tini`, `HEALTHCHECK`
- `package.json` — no business logic dependencies
- `tsconfig.json` — no composite (worker is leaf)

---

### 6.5 Supporting Directories

**`infra/`** — Docker Compose, Prometheus, Grafana, Loki, Tempo, Cloudflare, Vercel configurations.

**`scripts/ci/`** — CI validators and generators (updated):
- `boundary-check.ts` — layer import boundary enforcement
- `validate-adapters.ts` — adapter naming and structure
- `validate-rls.ts` — RLS policy presence
- `event-version.ts` — event schema versioning
- `pii-redaction.ts` — PII in log detection
- `flag-expiry.ts` — feature flag expiry checks
- `exports-check.ts` — package exports validation
- `supply-chain.ts` — dependency integrity
- `are-the-types-wrong.ts` — attw integration
- `generate-asyncapi.ts` — **new** AsyncAPI 3.0 generation (Gate 16)
- `schema-build.ts` — **new** versioned contract build (Gate 17)
- `check-quota-calls.ts` — **new** static analysis for `checkQuota()` enforcement
- `validate-adapter-scaffold.ts` — **new** ensures adapters are generated, not hand‑authored

**`docs/`** — ADRs, runbooks (one per Grafana alert), API documentation, architecture overview, compliance documentation, onboarding guide, AI context, stack guide, verticals.

**`e2e/`** — Playwright tests extending `firm-config-playwright`.

**`stubs/`** — Adapter stubs and factories, **auto‑generated** by the scaffolding generator. CI enforces that stubs match generated output. No hand‑authored stubs.

**`benchmarks/`** — Performance benchmarks.

**`contracts/v1/`** — Versioned contract artifacts (OpenAPI, AsyncAPI 3.0, JSON Schema). Generated by CI Gate 17; committed artifacts must match generated output exactly.

**`sbom/`** — CycloneDX SBOMs generated in CI via `syft`.

**`load-tests/`** — **new** k6 scenarios, thresholds, results.

**`chaos/`** — **new** Toxiproxy scenarios, playbooks, tools.

**`policies/`** — **new** Reserved for future OPA Rego policies. Contains a `README.md` explaining the migration trigger (when RBAC moves from in‑code to policy‑as‑code).

---

Here’s the updated **Part 7: Database & Migration Architecture**, reflecting the `firm-db` split, the PgBouncer RESET wrapper, the CQRS read model placeholder, and the new migration safety rule.

---

## Part 7: Database & Migration Architecture

### 7.1 Package Structure (Post‑Split)

The original `firm-db` package has been split into two packages to separate schema definition from connection management and to isolate the PgBouncer safety wrapper.

| Package | Layer | Responsibility |
|---------|-------|----------------|
| `firm-db-schema` | Layer 2 | Drizzle schema definitions, migration files, RLS policies, schema‑level helpers (outbox, soft‑delete, pagination) |
| `firm-db-client` | Layer 2 | Connection factories (serverless, pooled, direct), PgBouncer RESET wrapper, `application_name` verification, transaction helpers |

**Migration runner** — The dedicated init container (`migration.Dockerfile`) points exclusively at `firm-db-schema`. It runs migrations before any application pod starts, preventing race conditions and permission creep.

**CQRS read model home** — The read model (denormalised query tables) may live either as a separate `firm-db-read` package or as a subdirectory within `firm-db-schema`. This decision is pending the `firm-db` split ADR (see Part 11, Item 3). Until resolved, no read‑model tables are introduced; all queries use the normalised schema through RLS‑enforced views.

### 7.2 Migration Safety Rules (Gate 7)

All migrations must comply with the following rules. Violations are caught at CI Gate 7.

1. **Backward‑compatible for one release** — New columns must be nullable or have a default value. Dropped columns follow the two‑migration rule (stop writing → drop in subsequent release).
2. **Indexes created concurrently** — `CREATE INDEX CONCURRENTLY` to avoid table locking in production.
3. **No modification of existing migration files** — Once a migration file is committed and merged, it is immutable.
4. **Tenant‑scoped tables include RLS in the same migration** — Any new table containing a `tenant_id` column must have its RLS policy created in the same migration file. A sibling isolation test must be included in the same PR, verifying that cross‑tenant queries return zero rows (Gate 10 enforces).
5. **Migration runner runs as init container** — Ensures schema is current before any application logic executes.

### 7.3 PgBouncer RESET Wrapper (`firm-db-client`)

To mitigate the highest‑severity vulnerability (3.1), the `pooled` connection factory in `firm-db-client` wraps every connection in a RESET guard:

- On connection checkout: execute `DISCARD ALL` to clear any lingering session state from a previous transaction.
- On `application_name` mismatch (tenant ID not matching request context): throw immediately, aborting the query.
- The integration test suite (Gate 10) includes a dedicated test: after `withTenantContext(tenantA)` completes, a bare query using the pooled client must see zero `tenantA` data.

This wrapper is documented in the connection pooler runbook (`docs/runbooks/connection-pooler-rls.md`) and is exercised by the PgBouncer eviction chaos scenario (`chaos/`).

### 7.4 `firm-db-schema` Internal Structure

```
firm-db-schema/
├── src/
│   ├── schema/           # Drizzle table definitions
│   ├── migrations/       # Drizzle migration files
│   ├── rls.ts            # RLS policy helper (enables, disables, verifies)
│   └── helpers/
│       ├── outbox.ts     # Outbox message insertion helper
│       ├── pagination.ts # Cursor/offset pagination
│       └── soft-delete.ts# Soft-delete timestamp trigger
├── package.json
└── tsconfig.json
```

### 7.5 `firm-db-client` Internal Structure

```
firm-db-client/
├── src/
│   ├── connection.ts     # pooled, serverless, direct factories
│   ├── reset-wrapper.ts  # PgBouncer DISCARD ALL + application_name guard
│   ├── transaction.ts    # withTransaction helper
│   └── index.ts
├── package.json
└── tsconfig.json
```

---

Here’s the updated **Part 8: Governance & Developer Experience**, incorporating the CODEOWNERS excerpt, the expanded AI agent context, new root files, service catalog, adapter registry, and environment/pinning requirements.

---

## Part 8: Governance & Developer Experience

### 8.1 CODEOWNERS

Ownership boundaries are enforced via `.github/CODEOWNERS`. The following excerpt illustrates the pattern:

```
*                     @firm/architects
/packages/config/     @firm/architects @firm/platform-leads
/packages/security/   @firm/security @firm/architects
/infra/               @firm/devops @firm/architects
```

All PRs that cross ownership lines require approval from the relevant team before merge.

---

### 8.2 AI Agent Context (`CLAUDE.md` & `AGENTS.md`)

Every AI assistant interacting with the repository — whether an IDE copilot, a PR review bot, or a planning agent — receives the same architectural grounding through two root files:

- **`CLAUDE.md`** — concise context (<2k tokens) for short‑lived interactions.  
- **`AGENTS.md`** — extended context for multi‑turn planning and implementation sessions.

These files are kept current with every architectural change. The current skeleton includes:

1. **Repository identity** — pnpm, Node 22, Next 15, Turborevo v2.
2. **Three Platform Laws** — adapters only external boundary; `tenantId` derived from session, never trusted; outbox only async primitive.
3. **Layer import rules** — Layer 0 imports nothing above it; Layer 1 may import Layer 0; Layer 2 may import Layers 0‑1; and so on. Enforced by `@firm/config-eslint`.
4. **Tenant ID convention** — `tenantId` is the first argument to every DB query, cache operation, and adapter call.
5. **Package naming** — `@firm/adapters-<category>-<provider>` for adapters; `@firm/config-*` for build config; `@firm/<feature>` for feature packages.
6. **New & renamed packages** — `firm-db-schema` + `firm-db-client` (split from `firm-db`), `firm-rate-limiter` (extracted from `firm-security`), `firm-ai` + `firm-ai-content` (split), `firm-sdk` (moved to Layer 2), `firm-sales-pipeline` (renamed), `firm-theme-provider` (renamed), `firm-kpi` (renamed).
7. **Directory changes** — `services/` → `workers/`; new `load-tests/`, `chaos/`, `policies/`, `contracts/v1/` directories.
8. **Active compliance deadlines** — Jun 9 (NY synthetic labels), Jun 15 (Google Consent Mode v3), Jul 14 (CNIL pixel consent), Aug 2 (EU AI Act C2PA).
9. **Phase 1 Fix Sequence** — exact order of fixes 0‑10 with packages and severities (see 3.2).
10. **ADR Backlog pointer** — unresolved decisions live in Part 11 of the Critique; do not assume resolution.

---

### 8.3 Developer Tooling & Discovery

#### 8.3.1 Issue Templates

`.github/ISSUE_TEMPLATE/` contains four structured templates:

- **Bug report** — reproduction steps, expected behaviour, actual behaviour, environment.
- **Feature request** — problem statement, proposed solution, business value, affected packages.
- **ADR proposal** — decision title, context, options, recommendation, impacted packages.
- **Security vulnerability** — private reporting path, severity estimate, affected components.

These templates ensure every issue carries enough context for triage and architectural impact analysis.

#### 8.3.2 Service Catalog

`tools/catalog/` contains a **generated static service catalog** that serves as the developer portal MVP. It is regenerated on every merge to `main` and includes:

- List of all packages with layer, tier, and owner team.
- Dependency graph (derived from `tsconfig.json` references and `package.json` dependencies).
- Adapter registry snapshot (from `REGISTRY.md`).
- Link to CI/CD dashboard and current build status.
- Link to compliance deadline calendar.

#### 8.3.3 Adapter Registry

`packages/layer7-adapters/REGISTRY.md` is the **authoritative adapter discovery document**. It is automatically regenerated by the adapter scaffolding generator every time an adapter is created or removed. The registry lists:

- Provider name, category, package path.
- Port implemented (link to `firm-types`).
- Stub status (generated/present).
- Conformance test status (passing/failing/not implemented).
- Last generated timestamp.

CI enforces that the registry matches the actual adapter packages on disk (Gate 13).

---

### 8.4 Security & Contribution Policy

Two new root files formalise how external parties and new contributors interact with the project:

- **`SECURITY.md`** — defines the vulnerability disclosure process, private reporting channel, supported versions, and expected response times.
- **`CONTRIBUTING.md`** — covers development environment setup, package generation workflow, layer discipline, testing requirements, PR template, and the architectural decision process (ADR).

Both files are reviewed by `@firm/security` and `@firm/architects` annually.

---

### 8.5 Environment Variables

AI agents and developers reference **`.env.example`** at the root for required environment variables (non‑secret). This file is kept in sync with every new package and service.

Secrets (API keys, connection strings, signing keys) are stored in Infisical and encrypted in **`.env.vault`**. The vault is committed; decryption keys are never committed.

---

### 8.6 Node & pnpm Pinning

```ini
# .nvmrc
22.x
```

```json
// package.json
"packageManager": "pnpm@9.x.x"
```

These pins ensure consistent Node and pnpm versions across all development and CI environments.

---

Here’s the expanded **Part 9: CI/CD Architecture**, incorporating the new gates, the PR blast‑radius enrichment, and the remote cache key requirement.

---

## Part 9: CI/CD Architecture

### 9.1 17‑Gate Pipeline (Expanded)

The pipeline is organised into dependency groups. Gates within a group run in parallel; groups run sequentially as indicated.

**Group A — Fast Static Analysis (parallel)**
- **Gate 1 — ESLint** — All packages pass `@firm/config-eslint`, including layer import boundaries and outbox enforcement rules.
- **Gate 2 — Type Check** — `tsc --noEmit` (via `tsgo` for speed) + `attw` (are‑the‑types‑wrong) on every package.
- **Gate 3 — Boundary Check** — Custom script verifies no import crosses an upper layer; adapters only in Layer 7; workers are leaf nodes.
- **Gate 4 — GHA SHA Pinning** — All GitHub Actions steps reference exact commit SHAs, no floating tags.
- **Gate 5 — Design Token Build** — `firm-tokens` compiles without error.
- **Gate New1 — Adapter Scaffold Check** — Every adapter package under `layer7-adapters/` must be generated by the scaffolding generator, not hand‑authored. A stub and a conformance test must be present. (Enforces Decision 24.)

**Group B — Schema & Migration (sequential after A)**
- **Gate 6 — Schema Generation** — `drizzle-kit generate` runs in `firm-db-schema`; output matches committed files exactly.
- **Gate 7 — Migration Test** — PGLite runs all migrations; RLS policies on new tenant‑scoped tables are present and enforced.

**Group C — Build & Test (parallel after B)**
- **Gate 8 — Full Build** — `turbo build` succeeds for affected packages.
- **Gate 9 — Unit Tests** — 80% line/function coverage, 75% branch coverage. `firm-testing` provides PGLite and `ioredis-mock`.
- **Gate 10 — Integration Tests** — PGLite + ioredis‑mock. RLS cross‑tenant isolation verified: after tenant context ends, bare query returns zero data.
- **Gate 11 — Visual Regression** — Chromatic (or equivalent) captures UI changes.
- **Gate New2 — Check Quota Calls** — Static analysis scans all feature packages for metered operations (AI token consumption, storage writes, API calls) and verifies they are immediately preceded by a `checkQuota()` call. Build fails on any violation. (Enforces Fix 10.)

**Group D — Policy & Contract (parallel after C)**
- **Gate 12 — RLS Policy Coverage** — Every table with a `tenant_id` column has an RLS policy; coverage report is generated and checked.
- **Gate 13 — Adapter Interface Compliance** — Every adapter implements its declared Port exactly; stubs and conformance tests match the generated template.
- **Gate 14 — Security Headers** — CSP, HSTS, and (after Jun 15) Consent Mode v3 headers are present and correctly configured.
- **Gate 15 — Health Endpoints** — Every application and worker responds to `GET /health` within 2000ms.

**Group E — Contract Generation (sequential after D)**
- **Gate 16 — AsyncAPI Generation** — `scripts/ci/generate-asyncapi.ts` runs against the EventRegistry; every event has a channel definition in AsyncAPI 3.0. Generated output matches committed `contracts/v1/asyncapi.yaml`.
- **Gate 17 — Schema Build** — `scripts/ci/schema-build.ts` produces versioned OpenAPI, AsyncAPI, and JSON Schema artifacts in `contracts/v1/`. Committed artifacts must match generated output exactly. (Enforces Decision 25.)

**Future Gate (pre‑release, when `load-tests/` is implemented)**
- **Gate 18 — Load Test Thresholds** — k6 scenarios must pass SLO thresholds defined in `docs/slos/`. Tenant isolation, outbox throughput, rate limiting, and lead burst scenarios are mandatory. This gate is gated on the PgBouncer eviction chaos scenario having passed.

---

### 9.2 Merge Queue

GitHub merge queue is enabled with branch protection. Merge method: **squash**. All required status checks (Gates 1‑17) must pass before a PR enters the queue. The queue serialises merges to avoid race conditions in schema changes and contract generation.

---

### 9.3 Turborepo `--filter` for Affected Detection

Only affected packages are built and tested on each PR:

```yaml
- run: pnpm turbo build --filter=...[HEAD^1]
- run: pnpm turbo test --filter=...[HEAD^1]
```

The `...[HEAD^1]` syntax includes the changed packages and all dependents downstream. This keeps CI time proportional to change size.

**Remote cache:** To maximise cache hit rate across CI runs and local development, a remote cache is configured. The CI environment must include `TURBO_REMOTE_CACHE_SIGNATURE_KEY` as a secret. Vercel Remote Cache is the default provider; a self‑hosted alternative may be evaluated if usage exceeds the free tier.

---

### 9.4 Supply Chain Security (4 Layers)

1. **Socket.dev** — Malicious package detection on dependency changes.  
2. **Gitleaks** — Secrets scan on every PR.  
3. **Subresource Integrity (SRI)** — All external scripts loaded by client applications include integrity hashes.  
4. **SBOM Generation** — CycloneDX SBOMs are generated via `syft` and stored in the `sbom/` directory. Committed on every release.

---

### 9.5 Additional Validation Gates

These gates run alongside the main pipeline and are not part of the sequential gate numbering, but are equally required for merge:

- **`are‑the‑types‑wrong` (`attw`)** — Verifies every package’s exports are resolvable and correctly typed. Integrated into Gate 2.
- **Migration backward‑compatibility gate** — Validates that the current schema plus new migration still serves the previous application version. Prevents breaking changes slipping through.
- **PR blast‑radius comment** — A CI job comments on every PR listing the affected packages and their dependents. After the enrichment (9.6), this includes adapter impact and compliance deadline flags.

---

### 9.6 PR Blast‑Radius Enrichment (New)

When a PR modifies a **Port interface** (any type or contract in `firm-types` that adapters implement), the CI comment job auto‑generates an impact analysis that includes:

1. **All affected adapter packages** — Lists every `adapters-*` package that implements the changed Port.
2. **Change classification** — Marks the change as **additive** (backward‑compatible, adapters can update on their own schedule) or **breaking** (all listed adapters must be updated in the same PR or immediately after).
3. **Compliance deadline flags** — If the affected packages are subject to an active compliance deadline (see 3.3), the comment highlights the deadline and the required action.
4. **Dependent feature packages** — Lists Layer 6 packages that consume the changed types, with severity markers for direct vs. transitive dependencies.

This enrichment ensures no Port change lands without full awareness of downstream impact, and it gives reviewers a checklist before approving.

---

Here’s the updated **Part 10: Observability & Monitoring Infrastructure**, with the runbook/SLO linkage and the SLO table from the Master Analysis.

---

## Part 10: Observability & Monitoring Infrastructure

### 10.1 Grafana Dashboards (5, as code)

All dashboards are defined as code and deployed alongside infrastructure. They are populated by the tenant‑aware metrics wrappers (`withTenantSpan`, `createTenantMeter`) provided by `firm-observability` once built.

- **`platform-overview`** — Request rate, error rate, p95 latency, active tenants, outbox queue depth.
- **`tenant-analytics`** — Per‑tenant API calls, storage utilisation, AI token consumption, billing events.
- **`ai-cost`** — Token usage by model and tenant, budget alerts, C2PA manifest generation rate.
- **`adapter-health`** — Per‑adapter success rate, p99 latency, error counts, last successful sync timestamp.
- **`cicd-metrics`** — Build duration trend, test pass rate, cache hit rate, affected package count per PR.

---

### 10.2 Alert Rules

Each alert rule is accompanied by a runbook in `docs/runbooks/` and is linked to its corresponding SLO in `docs/slos/`. No alert may be introduced without a corresponding runbook.

**Critical alerts (immediate paging):**

```yaml
- alert: RLSHealthCheckFailed
  expr: firm_rls_check_success == 0
  runbook: docs/runbooks/rls-health-check-failed.md
  slo: tenant-isolation

- alert: OutboxDLQOverflow
  expr: firm_outbox_dlq_size > 100
  runbook: docs/runbooks/outbox-dlq-overflow.md
  slo: event-delivery

- alert: CrossTenantQueryDetected
  expr: firm_cross_tenant_query_count > 0
  runbook: docs/runbooks/cross-tenant-query.md
  slo: tenant-isolation
```

**Warning alerts (triage during business hours):**  
Additional warning‑level alerts exist for slow outbox queues, elevated adapter error rates, and AI budget near limit. These are not enumerated here but follow the same runbook/SLO requirement.

---

### 10.3 SLO Definitions

The six Service Level Objectives below define the hard platform guarantees. Each SLO is measured continuously, and breaches trigger the corresponding alert runbook.

| SLO | Target | Measurement Window | Linked Alerts |
|-----|--------|-------------------|---------------|
| **Tenant Isolation** | 100% — zero cross‑tenant queries | Continuous (per‑request) | RLSHealthCheckFailed, CrossTenantQueryDetected |
| **Event Delivery** | 99.99% — outbox events delivered within 10 minutes | 30‑day rolling | OutboxDLQOverflow |
| **API Availability** | 99.9% — platform API returns non‑5xx | 30‑day rolling | (dashboard threshold) |
| **Rate Limiter Fail‑Open** | 100% — rate limiter failures allow requests | Per‑event | (warning alert, linked to chaos test) |
| **AI Generation Latency** | p95 < 15 seconds | 7‑day rolling | (AI cost dashboard threshold) |
| **Compliance Manifest Coverage** | 100% — AI‑generated content has C2PA manifest | Per‑generation | (missing manifest warning, linked to EU AI Act deadline) |

Each SLO is documented in full in `docs/slos/`, including the measurement method, alert linkage, and the on‑call response procedure.

---

Here’s the new **Part 11: ADR Backlog**, containing all 12 open architectural decisions organised by the phase they block.

---

## Part 11: ADR Backlog

*This is the authoritative list of unresolved architectural decisions. Each ADR must be written, reviewed, and merged before the phase it blocks can begin. Until an ADR is resolved, the default recommendation noted here serves as the provisional working assumption.*

---

### Block Roadmap Validity — Write Immediately

These four ADRs have cascading impact on package structure, build order, and cost projections. They must be resolved to finalise the Blueprint and lock the implementation roadmap.

---

**1. `firm-bus` Execution Model**

- **Problem:** The platform requires reliable, ordered, tenant‑isolated event delivery. Two viable models exist: a lightweight custom outbox processor (already partially built) or adoption of Inngest as a managed durable execution layer.
- **Options:**
  - **A — Custom Outbox Only.** Build on the existing outbox pattern. Simpler dependency footprint, no external service cost, but requires building and maintaining retry logic, DLQ management, and observability ourselves.
  - **B — Inngest.** Adopt Inngest for durable function execution. Faster feature velocity, built‑in retry and observability, but introduces an external dependency, ongoing cost, and the `inngest` catalog entry.
- **Default recommendation:** A (custom outbox), maximising platform independence and avoiding a vendor commitment pre‑launch. Re‑evaluate at 50+ tenants.
- **Impact if delayed:** Build order for `firm-bus`, `firm-webhooks`, `firm-notifications`, and all workers is provisional.

---

**2. `apps/platform/` Application Grouping**

- **Problem:** The Blueprint catalogues 22 separate platform applications. Maintaining 22 distinct deployables generates significant operational overhead (CI minutes, deployment pipelines, Vercel project limits, cold starts).
- **Options:**
  - **A — 22 Separate Apps.** Maximum isolation, independent scaling, but high overhead and cost.
  - **B — 3‑5 Hybrid Apps.** Group by functional domain (e.g., marketing‑apps, sales‑apps, operations‑apps). Balance of isolation and operational simplicity.
  - **C — Single Unified App.** One Next.js application with all routes. Simplest operations, but larger bundle, potential for cross‑domain coupling, and harder independent scaling.
- **Default recommendation:** B (3‑5 hybrid apps), prioritising operational simplicity and cost efficiency.
- **Impact if delayed:** All platform application scaffolding and deployment pipelines are provisional.

---

**3. `firm-db` Split & Read Model Home**

- **Problem:** The current `firm-db` monolith must be split into `firm-db-schema` and `firm-db-client` (Decision 11). Additionally, a CQRS read model (denormalised tables for query performance) is planned but its physical home is undecided.
- **Options:**
  - **A — Separate `firm-db-read` Package.** Full isolation, independent migrations, but adds a third database package.
  - **B — Subdirectory in `firm-db-schema`.** Fewer packages, co‑located with source schema, but couples read model deployment to schema deployment.
- **Default recommendation:** A (separate `firm-db-read`), keeping read model fully independent and migration cycles decoupled.
- **Impact if delayed:** No read‑model tables can be introduced; all queries remain on normalised schema via RLS views.

---

**4. `firm-ai` Split**

- **Problem:** `firm-ai` currently conflates infrastructure concerns (model routing, token tracking, budget enforcement) with content generation and compliance (human‑approval gate, C2PA manifests). Decision 12 mandates a split; this ADR defines the exact interface boundary.
- **Options:**
  - **A — `firm-ai` as pure infra, `firm-ai-content` as consumer.** `firm-ai` exposes `generate(prompt, options)` and `checkQuota()`. `firm-ai-content` handles compliance wrapping, human‑approval queue, and C2PA generation.
  - **B — Shared kernel with feature‑specific extensions.** `firm-ai` holds base generation; `firm-ai-content`, `firm-ai-brand-voice`, `firm-ai-seo`, `firm-ai-chat` each add domain‑specific wrappers.
- **Default recommendation:** A, keeping `firm-ai` thin and auditable. Option B is compatible but defers extension package decisions.
- **Impact if delayed:** `firm-ai-content` and its compliance deadlines (NY Synthetic labels, EU AI Act C2PA) cannot begin implementation.

---

### Block Phase 2 Build Start

These six ADRs govern feature package architecture. They must be resolved before Tier A packages exit prototyping.

---

**5. `firm-types` Shared Kernel Boundary**

- **Problem:** `firm-types` holds domain‑level branded IDs and shared types. As adapters and feature packages grow, the risk of a bloated, breaking‑change‑prone shared kernel increases.
- **Options:**
  - **A — Single shared kernel.** All shared types in one package. Simpler imports, but higher coupling.
  - **B — Split by domain (types‑crm, types‑ads, types‑billing…).** Finer‑grained, but adds package overhead.
  - **C — Hybrid: core types in `firm-types`, domain‑specific contracts co‑located with feature packages.**
- **Default recommendation:** C, starting with a lean shared kernel and extracting domain contracts as needed.
- **Impact if delayed:** `firm-types` continues to accumulate types with no extraction policy; risk of uncontrolled growth.

---

**6. `firm-search` Engine Strategy**

- **Problem:** Full‑text search is required across multiple feature packages (leads, documents, CMS, chat). The engine choice impacts indexing strategy, infrastructure, and cost.
- **Options:**
  - **A — PostgreSQL full‑text search.** No additional infrastructure, tenant‑isolated via RLS, but less performant at scale.
  - **B — Meilisearch (self‑hosted).** Fast, typo‑tolerant, but adds operational burden and tenant isolation complexity.
  - **C — Typesense (self‑hosted or cloud).** Similar to Meilisearch; strong multi‑tenant support.
  - **D — Elasticsearch (managed).** Most powerful, but expensive and operationally heavy.
- **Default recommendation:** A (PostgreSQL) for launch, with Port‑and‑adapter pattern allowing migration to B/C/D later.
- **Impact if delayed:** `firm-search` package cannot define its adapter interface.

---

**7. `firm-workflow` Condition Model**

- **Problem:** Workflows (e.g., “when a lead completes a form, send a welcome email and assign to sales rep”) require a condition/trigger model. The expressiveness of this model dictates what automations the platform can support.
- **Options:**
  - **A — Event‑triggered only.** Simple, outbox‑native, but limited to event‑response automations.
  - **B — Rule engine (JSONLogic or similar).** Expressive, serialisable, but requires a rule evaluation layer.
  - **C — Visual builder (block‑based).** Best UX, but significant build investment.
- **Default recommendation:** B (rule engine), providing power‑user expressiveness without the Phase 2 cost of a visual builder.
- **Impact if delayed:** `firm-workflow` remains a placeholder.

---

**8. `firm-workflow` vs. `firm-funnels` Boundary**

- **Problem:** Workflows and funnels both model sequential processes. Without a clear boundary, they risk overlapping or duplicating functionality.
- **Options:**
  - **A — `firm-workflow` is the engine; `firm-funnels` is a specialised UI.** Funnels are a marketing‑specific workflow rendered visually.
  - **B — Separate packages with no dependency.** Each implements its own sequencing logic.
  - **C — `firm-funnels` absorbs `firm-workflow`.** Workflows are just a funnel variant.
- **Default recommendation:** A, giving a clean separation of engine vs. application.
- **Impact if delayed:** Both packages remain ambiguous; potential for duplicated sequencing logic.

---

**9. `firm-template-engine` Syntax**

- **Problem:** Multiple features (email, landing pages, proposals, documents) require templating. A single template engine avoids fragmentation but must support both simple text interpolation and complex rich content.
- **Options:**
  - **A — Handlebars (logic‑less).** Safe, well‑known, but limited expressiveness.
  - **B — Liquid (Shopify‑style).** More expressive than Handlebars, good ecosystem.
  - **C — JSX‑based (React Email, custom renderer).** Full React power, but heavier and harder to sandbox.
- **Default recommendation:** B (Liquid), balancing expressiveness with safety and ecosystem maturity.
- **Impact if delayed:** Each feature may adopt its own templating, leading to fragmentation.

---

**10. `apps/clients/` Generation Model**

- **Problem:** Client websites must be generated from templates and per‑client configuration. Whether this generation happens at build time, deploy time, or runtime impacts infrastructure, Vercel usage, and developer workflow.
- **Options:**
  - **A — Ephemeral generation at deploy time.** Sites are generated per deploy, not committed. Cleaner repo, but requires per‑deploy build infrastructure.
  - **B — Committed output.** Generated sites are committed to the repo. Simpler deployment, but bloats the monorepo and creates merge conflicts.
  - **C — Runtime rendering (headless CMS approach).** No static generation; client sites are rendered dynamically.
- **Default recommendation:** A (ephemeral generation), keeping the repository clean and generation reproducible.
- **Impact if delayed:** `apps/clients/` directory structure and generation tooling cannot be built.

---

### Block Phase 3 Adapter Build

This ADR governs a future‑phase decision but is documented now to prevent premature commitment.

---

**11. oRPC Evaluation**

- **Problem:** The platform currently assumes REST/OpenAPI for API contracts. oRPC (type‑safe RPC) could provide end‑to‑end type safety without code generation, but represents a significant architectural shift.
- **Options:**
  - **A — Adopt oRPC for internal service‑to‑service communication.** Maximum type safety, but couples packages to oRPC runtime.
  - **B — Stick with REST/OpenAPI.** Established, toolable, and decoupled.
  - **C — Hybrid: OpenAPI for external, oRPC for internal.**
- **Default recommendation:** Defer evaluation to Phase 2 end. Current OpenAPI foundation is sufficient.
- **Impact if delayed:** None — this ADR is intentionally deferred.

---

**12. OPA vs. In‑Code RBAC — Migration Trigger**

- **Problem:** Fine‑grained RBAC (attribute‑based access control) is currently planned as in‑code logic. OPA (Open Policy Agent) with Rego policies offers a more powerful, auditable alternative, but is premature for launch.
- **Options:**
  - **A — Stay in‑code until 50+ tenants or first enterprise audit requirement.**
  - **B — Implement OPA from the start.**
  - **C — Abstract behind a `firm-authorization` Port; swap implementation later.**
- **Default recommendation:** C (Port abstraction), with in‑code implementation as the initial adapter. Migration trigger documented in `policies/README.md`.
- **Impact if delayed:** None — RBAC in code is acceptable for initial launch; the Port prevents lock‑in.

---

Each ADR’s resolution will be captured in `docs/adrs/` using the standard ADR template and will update this back log accordingly.

---

*End of document.*