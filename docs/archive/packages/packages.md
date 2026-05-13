# Platform Architecture Skeleton  
**Immutable structural commitments — no version numbers, library names, or implementation details**

---

## Layered Taxonomy

| Layer | Research Domain | Core Objective |
|-------|----------------|----------------|
| **0** | Build & Constraint | Standardise strictness, enforce zero‑runtime‑deps foundation. |
| **1** | Core Utilities & Environment | Runtime infrastructure: errors, crypto, logging, env validation, pure utilities. |
| **2** | Data & Contracts | Domain shapes, validation, API contracts, database isolation, cache isolation. |
| **3** | Identity, Security & Consent | Auth, RBAC, API keys, MFA, CSP, rate‑limiting, consent enforcement. |
| **4** | Observability & Health | Structured logging, distributed tracing, metrics, error tracking, health probes. |
| **5** | UI, Theming & Configuration | Design tokens, component library, tenant configuration resolution. |
| **6** | Feature Packages & Workers | Business features, AI, email, forms, CRM, payments, background processing. |
| **7** | Adapters | Pluggable third‑party integration wrappers. |

---

## Immutable Stress‑Test Commitments

- **Tenant isolation** enforced through context propagation and dual‑reporting verification.
- **Usage control** via probabilistic admission gating on resource‑intensive operations.
- **Event reliability** using idempotent sagas with explicit compensation paths.
- **Schema governance** enforced by a unified manifest preventing ORM‑worker drift.

---

## Layer 0 — Absolute Foundation

**Definition:** A constraint system producing no runtime features — only correctness, consistency, and elimination of entire bug categories.

**Core packages and their sole responsibilities:**  
- Shared TypeScript strictness configuration.  
- Shared ESLint rules (flat config only).  
- Shared Prettier formatting (immutable after initial agreement).  
- Design token system (W3C DTCG source → generated CSS/TS).  
- Next.js factory for security‑hardened configuration.  
- Platform‑wide TypeScript vocabulary (branded IDs, enums, pure interfaces — never runtime code).

**Immutable constraints:**  
- No package contains runtime code, npm dependencies, or imports from other internal packages.  
- Config changes propagate through factory patterns — no manual per‑app updates.  
- All build‑target and module‑resolution choices avoid deprecated settings to prevent forced future migration.  
- `exports` fields are the sole public API boundaries.

**Contracts inherited by all higher layers:**  
- Strictest type checking, including branded ID enforcement and exhaustive switch handling.  
- Every environment variable validated at startup — no missing‑secret surprises.  
- Every generated app ships with security headers and cache profiles.  
- Every client theme is an override layer on a shared token system — no forks.

---

## Layer 1 — Core Utilities & Environment

**Definition:** Runtime infrastructure — transforms data, validates environment, describes failures, wraps cryptography, records events. Absolutely no knowledge of tenants, features, or domain concepts.

**Five packages and their single responsibilities:**  
- `firm‑env` — validates all environment variables; app refuses to start on missing/malformed values.  
- `firm‑utils` — pure functions, zero I/O; provides `Result<T,E>` for expected failures.  
- `firm‑errors` — typed error hierarchy, RFC 7807 serialisation, machine‑readable error codes.  
- `firm‑crypto` — Web Crypto wrappers for HMAC, tokens, nonces; constant‑time comparison.  
- `firm‑logger` — structured JSON logging with PII redaction; context propagation container (AsyncLocalStorage).

**Key architectural patterns:**  
- Expected failures return `Result`; thrown exceptions reserved for programmer errors.  
- All third‑party calls wrapped in `tryCatchAsync` at adapter boundaries.  
- `firm‑env` draws secrets exclusively from a vault; no hardcoded values.  
- HMAC verification uses constant‑time comparison; all tokens generated via cryptographically secure randomness.  
- Every log line is structured JSON with required context fields; PII is redacted before leaving the process.  
- `console.log` is banned; only `firm‑logger` methods may produce output.

**Immutable rules:**  
- No business logic. Any mention of domain entities means the code belongs elsewhere.  
- Zero side effects at module level.  
- All I/O must produce typed errors or `Result`.  
- Secrets never hardcoded.  
- PII never reaches stdout — enforced by CI test.

---

## Layer 2 — Data & Contracts

**Definition:** Shared shape, schema, and contract of every domain concept — no business logic, no implementation.

**Five packages and their single responsibilities:**  
- `firm‑types` — TypeScript interfaces, branded IDs, enums. Pure shapes, zero runtime deps.  
- `firm‑validators` — single source of validation truth; Zod schemas with compile‑time `satisfies` enforcement against `firm‑types`.  
- `firm‑api‑contracts` — typed API route schemas, Inngest event envelopes, OpenAPI definitions.  
- `firm‑db` — Drizzle schema definitions, RLS tenant isolation, connection factories, structural query helpers.  
- `firm‑cache` — tenant‑scoped Redis wrapper; tag‑based invalidation.

**Key architectural patterns:**  
- Branded types prevent ID mix‑ups at compile time; `assertNever` ensures exhaustive handling.  
- All Inngest events are registered in a central registry — unregistered events fail CI.  
- Every database query in shared‑schema mode runs inside `setTenantContext()`, which sets RLS variables and verifies tenant status.  
- Connection mode is always explicit (serverless, pooled, direct) — never inferred.  
- All cache keys are generated by factory functions scoped to `tenantId`; raw string concatenation for keys is a lint error.

**Immutable rules:**  
- Interfaces freeze before implementations; no adapter generation begins before the freeze milestone.  
- `exports` field is the contract boundary; internal refactoring invisible to consumers.  
- Schema versioning starts at the first breaking change, not later.  
- Every new shared‑schema table ships with its RLS policy and test in the same PR.  
- Event Registry is the sole authority for all event emission.

---

## Layer 3 — Security, Auth & Consent

**Definition:** Walls, locks, and consent enforcement — who can do what, how it’s proven, and how every action is structurally privacy‑compliant.

**Three packages and their single responsibilities:**  
- `firm‑security` — CSP, security headers, rate‑limit policies, Turnstile, tag governance.  
- `firm‑auth` — session management, RBAC, API keys, MFA, impersonation/delegation.  
- `firm‑consent` — GDPR/CCPA consent lifecycle, GPC enforcement, structural rendering gate.

**Key architectural patterns:**  
- Dynamic pages receive nonce‑based CSP; static pages receive hash‑based CSP.  
- All rate limiting uses named policies only — no inline configuration.  
- `SessionContext` is an immutable frozen object built by a unified authentication path (cookie or bearer).  
- RBAC permission matrix is a single file; every protected route calls `requirePermission()`.  
- Consent is a React‑level gate: scripts for unconsented categories are never injected into the DOM.  
- Global Privacy Control (`Sec‑GPC`) forces marketing/analytics denial; banner cannot override.  
- Every privileged action (impersonation, delegation, API key creation) writes an immutable audit record.

**Immutable rules:**  
- Security is structural, not advisory — every generated route is rate‑limited and nonce‑protected.  
- `CrossTenantAccessError` is always 403, never 404.  
- All rate limits, CSP presets, and RBAC matrices are named constants, never inline.  
- Consent is a structural gate, not a UI preference.  
- Every identity event is audited.

---

## Layer 4 — Observability & Health

**Definition:** Instruments, dashboards, alerts, and probes — making every component observable without manual instrumentation.

**Two packages and their single responsibilities:**  
- `firm‑observability` — logging, distributed tracing, metrics, error tracking, RUM.  
- `firm‑health` — liveness, readiness, startup probes, synthetic correctness verification.

**Mandatory three‑pillar requirement (enforced before first production deployment):**  
- Structured logs, metrics, and distributed traces in place for every service.

**Key architectural patterns:**  
- `AsyncLocalStorage` propagates `correlationId`, `tenantId`, `traceId` through every log line and metric without function‑argument threading.  
- PII redaction operates at both structural field paths and pattern‑based string scanning; a CI test guarantees no PII reaches stdout and blocks merge on failure.  
- Log sampling ensures errors and warnings are never dropped; high‑volume health checks sampled aggressively.  
- Distributed tracing links browser → API → background worker → adapter via W3C Trace Context, including manual injection across Inngest step boundaries.  
- Health checks strictly separate concerns: liveness probe never touches external dependencies to avoid restart cascades; readiness probe checks all dependencies; synthetic checks validate complete golden journeys.  
- Circuit breaker state is read from health reports but managed separately — health never directly opens circuits.

**Immutable rules:**  
- PII redaction test is unconditional; any PR that regresses it is rejected.  
- Liveness probes never check external dependencies.  
- All three observability pillars must exist before first client traffic.  
- `console.log` does not exist in production code.  
- Traces must connect unbroken across all execution boundaries.

---

## Layer 5 — UI, Theming & Configuration

**Definition:** Visual and configurational contract — what the platform looks like, what it renders, and what each tenant configures.

**Three packages and their sole responsibilities (the three‑question test):**  
- `firm‑tokens` — “What does it look like?” Design tokens (DTCG source), generated CSS/TS/Native.  
- `firm‑ui` — “What does it render?” Component library consuming tokens via CSS custom properties.  
- `firm‑config` — “What does this tenant configure?” Resolves per‑tenant config, themes, features, SEO.

**Key architectural patterns:**  
- All visual values flow from a DTCG JSON source through a generation pipeline; no human edits of generated output.  
- Every component references only `var(--firm‑...)` for visual values; hardcoded colours or dimensions are rejected.  
- Tenant configuration is resolved via: cache → database → version migration → Zod validation.  
- Theme contrast is validated before storage; a theme failing WCAG AA cannot be saved.  
- CSS is organised in a strict `@layer` stack: reset → tokens → base → theme → components → utilities → overrides, ensuring predictable specificity regardless of tenant count.  
- Feature flags are plan‑gated with mandatory expiration; expired flags break the build.

**Immutable rules:**  
- Tokens are DTCG, nothing else.  
- Components know nothing about tenants — theming is injected via `data‑theme` and custom properties.  
- Server Components are the default; `'use client'` is the exception.  
- Contrast is validated before storage.  
- Every component ships with an accessibility test; zero critical violations permitted.

---

## Layer 6 — Feature Packages & Workers

**Definition:** Business features and background processing — what the platform does for clients.

**Structural organisation:** Tiered packages (A, B, C) preventing circular dependencies; workers live in `services/` and import from feature packages but never from `apps/`.

**Key architectural commitments:**  
- **Server Actions are public endpoints** — every one is secured with input validation, Turnstile, rate limiting, and auth/authorisation.  
- **No analytics code loads** without explicit consent; the `track()` function returns immediately for unconsented users.  
- **AI‑generated content** is always tagged, requires human approval before publication, and includes mandatory FTC disclosure labelling.  
- **Webhook handlers** follow a fixed sequence: verify signature (raw body) → check idempotency → process → return 200 for duplicates.  
- **Workers** use durable execution with independent step retries; dead‑letter queues handle terminal failures.  
- **GDPR erasure** follows a two‑phase process: immediate anonymisation, then scheduled hard deletion after the retention window.

**Universal cross‑package rules:**  
- Named exports only, `exports` field as contract boundary, test coverage ≥80%, `console.log` banned.  
- Direct database access only through typed query helpers; no raw SQL in feature packages.  
- All dependencies pinned via workspace protocol and catalog.

**Immutable rules:**  
- Analytics are consent‑gated — no script, pixel, or server‑side event fires without it.  
- AI generates drafts; humans approve; auto‑publish is architecturally impossible.  
- Webhook processing order is non‑negotiable: verify, then deduplicate, then process.  
- Workers are packages, not apps — they import from feature packages, never from `apps/`.  
- Caching is explicit — every cached function declares its lifecycle and tags.

---

## Layer 7 — Adapters

**Definition:** Pluggable third‑party integration wrappers — the only path between the internal platform and external services. No feature package ever calls a third‑party SDK directly.

**Architecture pattern (Target/Adapter/Adaptee/Client):**  
- `firm‑types` defines the adapter interface.  
- Each adapter implements it, translating provider shapes to platform canonical types.  
- Callers depend only on the interface — provider changes never ripple into core.

**Universal adapter structure:**  
Every adapter must contain:
- Interface implementation (the only public export).  
- Lazy client initialisation from environment variables.  
- Transform functions (provider ↔ platform types).  
- Webhook signature verification (constant‑time comparison, raw body).  
- Standard Prometheus metrics (calls total, latency, errors).  
- Provider error‑to‑`FirmError` mapping.

**Adapter categories (structural list, no provider details):**  
CRM, Email, SMS, Analytics, CRO, SEO, Paid Ads, CMS, Booking, Payments, Accounting, AI Models, Social, Reviews, Proposals, Project Management, Design, Video, Chat.

**Webhook security requirements:**  
- Signature verification using constant‑time comparison.  
- Replay protection via timestamp tolerance and idempotency key store.  
- Raw request body is the only source for HMAC; parsed representations are untrusted.

**Immutable rules:**  
- Adapters are the sole path to external services.  
- Every adapter implements a `firm‑types` interface — no provider‑specific shapes leak.  
- Credentials come exclusively from environment variables.  
- Webhook processing order is verify, then deduplicate, then act.  
- Adapters depend only on Layers 0, 2, and 4 — never UI or feature logic.

---

## Cross‑Cutting Enforcement Mechanisms

- **Package boundaries** are verified by CI scripts at every layer boundary — no upward or unintended sideways imports.  
- **Interface freezes** lock contracts before dependent packages are built.  
- **Event Registry** ensures all event emissions are centralised and validated.  
- **RLS coverage** is tested for every shared‑schema table before merge.  
- **Tag governance** prevents unregistered third‑party scripts.  
- **Feature flag expiration** gates remove temporary flags automatically.

*This skeleton defines what must always be true. Every implementation detail — libraries, schemas, file paths, configuration values — lives in its respective package planning document and evolves independently.*