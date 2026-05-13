Here is the updated **Section 1: Executive Vision** for the Architecture Constitution, incorporating the precise adapter count and the explicit branded IDs for the three‑tier hierarchy.

---

# Marketing Agency Platform  
## Architecture Constitution & Enforcement Manual

**Document purpose:** This is the single, enduring source of architectural truth for the marketing agency platform. It defines the system’s structure, its immutable rules, its enforcement mechanisms, and the shared vocabulary everyone — founders, developers, AI agents — must operate by. It changes only when the platform’s architectural foundations are deliberately, formally updated.

**Companion document:** For the current state of the codebase (package health, known bugs, test gaps, missing inventory) and for the phased implementation plan (critical fixes, build order, construction phases), see the **Current State Assessment & Phased Implementation Roadmap**. That document is a living snapshot; this document is the constitution.

---

## Section 1: Executive Vision

### 1.1 What This Platform Is
Single unified codebase powering:
- Agency’s public website
- Per‑client dedicated websites (brand + content)
- Landing pages for ad campaigns
- Native business apps: CRM, project management, booking, invoicing, reporting, client portals
- Adapters to **105+ third‑party services** (email, social, ads, payments, CRMs, analytics, AI, and more)

**Multi‑tenancy (two levels):**
1. **Agency tenants** – each agency gets fully isolated environment.
2. **Sub‑accounts (agency clients)** – agencies manage end‑clients as sub‑accounts, inheriting branding/billing but isolated from each other.

**Three‑tier hierarchy:** Platform → Agency → Sub‑Account (white‑label reseller model).  
All data/config/digital assets securely isolated. Branded types (`TenantId`, `AgencyId`, `SubAccountId`, `PlatformId`, `SessionId`, `UserId`) enforce this hierarchy at compile time, preventing ID mix‑ups across the three levels.

**AI‑agent‑friendly:** every rule explicit, enabling safe feature addition.

### 1.2 Who This Blueprint Is For
- Founder/business owner – capabilities, guarantees, system structure.
- AI coding agents – unambiguous map of structural rules & contracts.
- Future human developers – rapid onboarding without reverse‑engineering.

### 1.3 What the Rest Contains
Defines the **immutable rules**:
- Seven‑layer taxonomy with strict dependency rules.
- Immutable stress‑test commitments (tenant isolation, usage control, event reliability, schema governance).
- Cross‑cutting enforcement mechanisms (CI, DB, language contracts).
- Canonical data‑flow patterns (requests, auth, events, consent, observability).
- Shared vocabulary & pattern library.

All features/adapters/applications must obey these rules.

---

## Section 2: Layered Taxonomy

**Seven strict layers:** Each layer may only depend on layers below. No upward imports, no circular dependencies.

---

### 2.1 Layer Overview

| Layer | Core Objective |
|-------|----------------|
| **0** | Build & constraint: shared config factories, design‑token pipeline, zero‑runtime primitives |
| **1** | Core utilities & environment: errors, crypto, logging, request context, env validation |
| **2** | Data & contracts: domain types, validation schemas, API/event contracts, DB schemas, cache isolation |
| **3** | Identity, security & consent: auth, RBAC, MFA, rate limiting, GDPR/CCPA consent |
| **4** | Observability & health: logs, traces, metrics, health probes |
| **5** | UI, theming & configuration: design tokens (consumed), component library, theme injection |
| **6** | Feature packages & workers: business capabilities + all background processing |
| **7** | Adapters: pluggable wrappers for 105+ third‑party services (sole external bridge) |

---

### 2.2 Layer 0 — Build & Constraint

**Purpose:** No runtime features. Enforces correctness, consistency, security at build time.

**Packages (compact):**
- `firm‑primitives`: branded IDs (`TenantId`, `AgencyId`, `SubAccountId`, `PlatformId`, `SessionId`, `UserId`, etc.), gatekeeper functions (`asTenantId`, `asAgencyId`, …), pure helper types. Domain‑level IDs (`LeadId`, `CampaignId`, etc.) are **excluded** — they belong in `firm‑types`. Zero domain knowledge.
- `firm‑config‑eslint`: shared ESLint flat config (import boundaries, branded‑ID validation, `workers` boundary type, `no‑direct‑fetch` rule forcing all external calls through adapters, rule banning direct writes to the CQRS read model).
- `firm‑config‑typescript`: strict TS config (no `any`, exhaustive switch, gatekeeper enforcement).
- `firm‑config‑prettier`: frozen formatting rules.
- `firm‑tokens`: W3C DTCG design tokens → generated CSS/TS constants. Build‑time only; a `no‑runtime‑tokens‑import` ESLint rule prevents direct runtime imports.
- `firm‑config‑next`: factory for security‑hardened Next.js configs (CSP, cache, Turbopack). Explicitly sets `serverExternalPackages: ['pino', 'drizzle‑orm', 'postgres']` to prevent Node‑native bundling errors.
- `firm‑config‑tailwind`: shared Tailwind safelist & content paths.
- `firm‑config‑vitest`: shared Vitest config factory (coverage ≥80%, Node/browser modes).
- `firm‑config‑playwright`: shared E2E config (browsers, base URLs, auth state).
- `firm‑config‑commitlint`: conventional commits enforcement.
- `firm‑config‑docker`: shared Dockerfile templates & base images (hardened Node.js). Template enforces: multi‑stage builds, non‑root user, `tini` as PID 1, standard `HEALTHCHECK CMD`.
- `firm‑config‑storybook`: shared Storybook config + theme injection.
- `firm‑config‑security‑headers`: factory for CSP/HSTS/Permissions‑Policy (decoupled from Next.js). Permissions‑Policy defaults: `camera=(), microphone=(), geolocation=(self), payment=(self)`.

**Immutable constraints:**
- No runtime code (except `firm‑primitives` gatekeepers). No runtime dependencies.
- All configuration changes propagate automatically through factory patterns — no developer should ever manually update a security header across multiple apps.
- Build‑target and module‑resolution choices avoid any settings marked as deprecated, eliminating forced future migrations.
- No imports from other internal packages (except primitives).
- `exports` field = only public API; internal path imports fail CI.

---

### 2.3 Layer 1 — Core Utilities & Environment

**Packages:**
- `firm‑env`: validates all env vars at startup; refuses start on missing/malformed secrets.
- `firm‑utils`: pure functions, `Result<T,E>` type, string helpers, deep‑merge, exhaustive checks.
- `firm‑errors`: typed error hierarchy (RFC 7807 Problem Details) with machine‑readable codes.
- `firm‑crypto`: Web Crypto wrappers (HMAC, nonce/TOTP, constant‑time compare).
- `firm‑logger`: structured JSON logging (Pino) with PII redaction. Uses `firm‑request‑context` exclusively for context → single source of truth.
- `firm‑request‑context`: `AsyncLocalStorage` carrying `RequestContext` (correlationId, traceId, tenantId, userId, session flags) through async ops.

**Key patterns:**
- Expected failures → `Result.Err`. Exceptions only for programmer errors.
- Every call to a third‑party library or external service is wrapped in `tryCatchAsync` at the adapter boundary, converting thrown exceptions into typed errors.
- All secrets via `firm‑env`. HMAC uses constant‑time.
- `console.log` banned; only `firm‑logger`.
- Context propagation solely via `firm‑request‑context`.

---

### 2.4 Layer 2 — Data & Contracts

**Purpose:** Defines the shared shape of every domain concept (lead, booking, campaign, invoice, etc.) – no business logic, only validation and schema generation.

**Packages:**

| Package | Research Domain | Responsibility (condensed) |
|---------|-----------------|---------------------------|
| `firm‑types` | Domain‑Driven Design | TS interfaces for all domain entities (Leads, CRM, Marketing, Content, Operations, Commercial, Automation, Reputation/SEO, Compliance, Messaging, Platform — full inventory defined in shared‑kernel ADR), Ports (`CRMPort`, etc.), API envelopes. Uses branded IDs from `firm‑primitives`. No runtime code. |
| `firm‑validators` | Validation | Single source of validation. Zod schemas `satisfies` the corresponding TS interface; ID fields use gatekeepers. |
| `firm‑api‑contracts` | API & Event Contracts | Typed tRPC/OpenAPI schemas, CloudEvents envelopes, global **Event Registry** with mandatory `version`. Handlers declare `acceptsVersions`; CI enforces coverage. |
| `firm‑db‑schema` | Infrastructure (Schema) | Drizzle schemas, RLS policy generators (parent‑child hierarchy), migration source of truth. Lightweight — no runtime connection dependencies. |
| `firm‑db‑client` | Infrastructure (Runtime) | Connection factories (`serverless/pooled/direct`), query helpers (cursor pagination, soft‑delete, transactional outbox), PgBouncer‑safe RESET wrapper. Depends on `firm‑db‑schema`. |
| `firm‑db‑read` | Infrastructure (CQRS Read) | Denormalised read‑optimised schema for `firm‑reporting`. Separate connection pool. Populated only by outbox event handlers. Home decided via ADR 7; initially a subdirectory of `firm‑db‑schema`. |
| `firm‑cache` | Caching | Tenant‑scoped Redis client, tag‑based invalidation, cache key factory auto‑prefixes with `tenantId`. |
| `firm‑sdk` | Public API Client | Typed TypeScript client for the platform API. Moved to Layer 2 (no business logic). Sub‑exports: `@firm/sdk/node`, `@firm/sdk/browser`. Includes `verifyWebhookSignature()` helper. |

**Key architectural patterns (all enforced):**

- **Branded IDs** (`TenantId`, `AgencyId`, …) from `firm‑primitives` prevent ID mix‑ups at compile time. Runtime gatekeeper validates UUID. ESLint bans raw `as TenantId`.
- **Event Registry + versioning:** Every event registered with a version. Handlers declare `acceptsVersions`. CI checks: every emitted version has a handler. Breaking changes require new version.
- **Tenant scoping via RLS:** All tenant‑scoped queries inside `setTenantContext()` – PostgreSQL RLS enforces isolation. Supports parent‑agency visibility via separate policy.
- **Explicit connection mode:** `serverless`, `pooled`, or `direct` – never guessed.
- **Cache key discipline:** All cache keys via `CacheKeyFactory(tenantId)`. Raw string concatenation is lint error.
- **RLS policy + test in same PR:** Every new tenant‑scoped table includes RLS policy and an isolation test.
- **CQRS read model isolation:** Only outbox event handlers (via `firm‑bus`) may write to the reporting read schema. Direct writes from feature packages are blocked by an ESLint rule.

> **Note:** The `firm‑db` split into `firm‑db‑schema`, `firm‑db‑client`, and `firm‑db‑read` is the target architecture and will be fully enacted before Phase 2 begins. A formal ADR for the split and CQRS home is in the ADR backlog.

---

### 2.5 Layer 3 — Identity, Security & Consent

**Packages:**
- `firm‑security`: CSP generation, security headers, named rate‑limiting policies (policy registry only — the *engine* is now in `firm‑rate‑limiter`), Turnstile verification, tag registry (third‑party scripts gated by consent), C2PA manifest generation (EU AI Act Art. 50).
- `firm‑rate‑limiter`: Redis‑backed sliding window and token‑bucket rate limiter. Plan‑tier‑aware limits (Starter/Pro), named policy registry as single source of truth, dry‑run mode for tuning, fail‑open when Redis is unreachable. All rate‑limited endpoints reference a named policy — inline values are rejected at CI.
- `firm‑auth`: session management (frozen immutable), RBAC (single permission matrix supporting explicit three‑tier hierarchy: `platform‑admin`, `agency‑admin`, `sub‑account‑admin`, `sub‑account‑user`), API keys (constant‑time HMAC, sub‑account scoping enforced), TOTP MFA, secure impersonation/delegation with audit logging. Centralised `validateCorsOrigin(origin, tenantId)` backed by `firm‑tenant‑config`.
- `firm‑consent`: full GDPR/CCPA lifecycle: server‑side cookie parsing (HMAC‑signed), Global Privacy Control (GPC) detection → overrides marketing/analytics consent (with `gpcApplied` flag in signed payload), Google Consent Mode v3 translation layer (deadline Jun 15), TCF 2.2 consent string encoding for EU programmatic ads, React‑level rendering gate (unconsented scripts never injected).

**Key patterns:**
- Dynamic pages: per‑request CSP nonce. `unsafe‑inline`/`unsafe‑eval` never allowed.
- Rate limiting: all limits reference named policies in `firm‑rate‑limiter`’s registry. Inline limits cause build failure.
- `SessionContext` deeply frozen after creation.
- RBAC matrix single file. Every protected route calls `requirePermission()`.
- Consent is structural gate, not UI preference. GPC forces denial of marketing/analytics.
- Every privileged action writes immutable audit record with cryptographic checksum.
- SCIM adapter (Layer 7) implements `/scim/v2/Users` and `/scim/v2/Groups` for enterprise provisioning, orchestrated by `firm‑auth`.

---

### 2.6 Layer 4 — Observability & Health

**Packages:**
- `firm‑observability`: init utilities for logs, traces (OpenTelemetry), metrics (Prometheus), error tracking (Sentry), RUM. Provides `withSpan()` and `withTenantSpan()` that automatically attach tenant/user/correlation context.
- `firm‑health`: Kubernetes‑style probes: liveness (event loop only), readiness (all dependencies + RLS + observability health check), startup (bootstrap). RLS check verifies every tenant‑scoped table has RLS.

**Three‑pillar requirement (enforced pre‑production & continuously):**  
Every service must produce structured logs, metrics, and distributed traces. Readiness probe fails if OpenTelemetry SDK not exporting spans → no traffic routed.

**Key patterns:**
- `AsyncLocalStorage` (Layer 1) propagates context into logs, metrics, spans.
- PII redaction: structural field‑path + regex patterns. CI test fails if any PII appears unredacted.
- Log sampling: errors/warnings never dropped; health‑check logs sampled.
- Distributed tracing: browser → API → worker → adapter via W3C Trace Context.
- Liveness probes never touch external dependencies. Readiness probes check all critical deps in parallel.

---

### 2.7 Layer 5 — UI, Theming & Testing

**Packages:**
- `firm‑tokens`: design tokens (W3C DTCG) → CSS custom properties, TypeScript constants. Same package as Layer 0 but at runtime its CSS output is consumed by `firm‑ui`. **Build‑time pipeline; no runtime import of `@firm/tokens` allowed (enforced by ESLint).**
- `firm‑ui`: shared component library organised into five sub‑exports:
  - `@firm/ui/primitives` — Button, Input, Select, Textarea, Checkbox, Radio, Switch, Badge, Avatar, Icon
  - `@firm/ui/composed` — Form, FormField, Modal, Toast, Table, Card, Tabs, Accordion, Dropdown, Combobox
  - `@firm/ui/layout` — Page, Sidebar, Topbar, Container, Grid, Stack, Divider
  - `@firm/ui/dataviz` — Chart wrappers (Nivo, with documented decision)
  - `@firm/ui/marketing` — Hero, CTA, FeatureGrid, Testimonial, PricingCard
  Uses Radix UI as headless primitive layer. Every component meets WCAG AA for keyboard navigation, focus management, and ARIA roles. All variants must have Storybook stories before considered complete. Theming injected via `data‑theme` and CSS custom properties using values pre‑resolved by `firm‑tenant‑config` (Layer 6) — `firm‑ui` never fetches configuration itself.
- `firm‑theme‑provider`: React context provider that receives tenant branding (resolved server‑side) and exposes it for CSS variable injection. Formerly named `firm‑config` (renamed to avoid collision with Layer 0).
- `firm‑testing`: shared test harnesses and fixtures. Includes:
  - `createUnitHarness()` — PGLite + ioredis‑mock
  - `createIntegrationHarness()` — real DB + Redis, isolated tenant lifecycle
  - `createE2eHarness()` — full stack, Playwright‑backed
  - `createTenantIsolationFixture()` — sets up two tenants, asserts zero data bleed
  - `mockAdapter<T extends Port>()` — fully type‑safe mock for any Port
  - `createOutboxHarness()` — captures outbox events without full DB transaction

**Key patterns:**
- Token pipeline from single DTCG file. Never hand‑edit generated output.
- Every component uses `var(--firm‑…)` – hardcoded visual values fail CI.
- Theme contrast validated before storage (WCAG AA). Inaccessible combinations rejected.

---

### 2.8 Layer 6 — Feature Packages & Workers

**Purpose:** Business capabilities + background processing.

**Package inventory (4 tiers):**

**Tier A – Core Infrastructure (12 → 13):**
- `firm‑bus`: event bus + outbox reader, retries (exponential backoff, dead‑letter), cron jobs, sagas with compensation. *Execution model (Inngest vs. custom) is under formal ADR; the package interface remains abstracted.*
- `firm‑flags`: feature flags (boolean, rollout, segments, plan‑gated). Mandatory expiration on temporary flags (CI enforced).
- `firm‑metering`: resource usage recording (leads, emails, AI tokens, storage, API calls) per tenant per period. **Primary API: `checkQuota(tenantId, dimension, amount)`** — rejects operations before overage. Quota warning event at 80% utilisation. `recordUsage()` for post‑operation recording. Used by quotas and billing.
- `firm‑audit`: immutable, cryptographically chained audit log of all write operations.
- `firm‑tenant‑config`: resolves per‑tenant config (branding, features, SEO, consent) via cache→DB→migration→Zod. Emits `tenant‑config.updated` event for CDN and theme invalidation. Supports merge‑with‑defaults and 5‑version rollback.
- `firm‑template‑engine`: template rendering for emails, SMS, PDFs, webhooks (version history, locale vars, preview). Uses Liquid for email/SMS, Handlebars for PDF (pending ADR).
- `firm‑notifications`: multi‑channel delivery (email, SMS, push, in‑app). Supports digest batching, per‑channel retry policies, and unread count persistence.
- `firm‑webhooks`: outbound delivery to tenant endpoints; signs payloads, retries, logs.
- `firm‑sse`: Server‑Sent Events delivery channel for real‑time updates to dashboards and client portals.
- `firm‑media`: multi‑provider file storage, image/video processing, metadata stripping, CDN. Tenant‑scoped via path prefix. Enforces storage quota via `checkQuota()`.
- `firm‑search`: full‑text search (tenant isolation via index partitions or PostgreSQL RLS). Architecture decided by ADR.
- `firm‑i18n`: translation keys, locale‑aware formatting (dates, numbers, currencies, addresses), RTL support, ICU MessageFormat pluralisation.
- `firm‑sdk`: **Relocated to Layer 2** (no business logic).

**Tier B – Operations (8):**
- `firm‑provisioning`: tenant lifecycle (creation, plan changes, suspension, offboarding with GDPR erasure). Idempotent, compensable. Dry‑run mode for validation.
- `firm‑compliance`: GDPR/CCPA engine: right‑to‑erasure sagas (immediate anonymisation → export → retention → hard deletion), data portability, data residency enforcement check (GDPR Art. 32), Art. 30 report generation.
- `firm‑projects`: project/task management, time tracking (billable/non‑billable), kanban, client‑facing status. Task dependency tracking and client‑internal visibility flags.
- `firm‑sales‑pipeline`: CRM deal pipeline (leads→stages→won/lost), conversion forecasting. Formerly `firm‑pipeline`; renamed to avoid ambiguity.
- `firm‑documents`: document generation (PDF) and e‑signature. Includes collaborative internal review, multi‑signatory support, and document open/view analytics. Proposals are a subtype, not a separate package.
- `firm‑appointments`: calendar management, booking pages, staff availability, buffer times, group appointments, no‑show policies.
- `firm‑workflow`: internal process automation (“when X → do Y” rules, visual builder). *Condition model, state machine, and trigger types are under formal ADR.*
- `firm‑integrations`: unified dashboard for all third‑party connections (health, OAuth, usage analytics). Composite health scoring and proactive OAuth token refresh.

**Tier C – Revenue (3):**
- `firm‑subscriptions`: plan lifecycle (upgrades, trials, cancellation), grace periods, grandfathering support. Reads entitlements from `firm‑flags` and usage from `firm‑metering`.
- `firm‑payments`: payment transactions (Stripe Customer, charges, refunds, disputes). Supports split payments and multi‑method storage.
- `firm‑billing`: invoicing, revenue recognition, dunning, financial reporting. Multi‑currency, tax jurisdiction detection, aging reports.

**Tier D – Client‑Facing & Marketing Execution (12):**
- `firm‑portal`: white‑label client portal with per‑sub‑account module config and portal activity audit.
- `firm‑inbox`: unified conversation inbox with assignment, SLA tracking, and tagging.
- `firm‑reporting`: analytics engine (pre‑computed metrics, branded PDF/email reports). Uses dedicated CQRS read model. Report scheduling, anomaly detection, shareable links.
- `firm‑cms`: headless CMS with content staging, SEO metadata management, multilingual locale fallback.
- `firm‑forms`: form builder with conditional logic, multi‑step, partial save/resume, field‑level abandonment analytics.
- `firm‑landing‑pages`: landing page builder (block‑based, A/B testing, Core Web Vitals tracking per variant).
- `firm‑funnels`: marketing automation (multi‑step behaviour‑driven sequences, cross‑channel). Funnel analytics and pause/resume.
- `firm‑social`: cross‑platform social media management (calendar, scheduling, approvals). Outbound only; inbound DMs routed to `firm‑inbox` via `social.dm.received` event.
- `firm‑seo`: keyword rank tracking, backlink monitoring, technical SEO audits, structured data management, SERP feature detection.
- `firm‑reputation`: review monitoring, competitor tracking, SLA‑driven response time, AI‑suggested replies (human‑approval gate enforced).
- `firm‑ads`: paid ad campaign management (Google, Meta, LinkedIn, TikTok), UTM parameter management, creative performance, ad fatigue detection.
- `firm‑ai‑content`: AI generation services (content, images) with **mandatory Human‑Approval Gate** — output always `pending_approval`, only `approveContent()` with `content:approve` permission sets `approved`, C2PA manifests generated and stored. Compliance‑sensitive package (EU AI Act Aug 2, NY disclosure Jun 9).

**Additional Tier A package added:**
- `firm‑ai`: AI infrastructure layer — provider client management via adapters, token counting, cost metering, model routing, rate limiting. **No generation logic, no approval gates.** Home for analytical AI (lead scoring, personalisation). Split from `firm‑ai‑content` per ADR; the two packages together replace the original single `firm‑ai`.

**Universal Layer 6 rules:**
- Named exports only; `exports` field = public API.
- Test coverage ≥80%.
- `console.log` banned; use `firm‑logger`.
- Database access via typed helpers from `firm‑db‑client` only.
- Pinned dependencies via workspace protocol & catalog.
- All async work via transactional outbox; `firm‑bus` picks up events. Workers live in `workers/`, import from feature packages, never from `apps/`.

**Additional domain rules:**
- AI content `pending_approval` → `approved` only via approval gate. No bypass.
- `firm‑search` tenant isolation: must choose (external index partitions + per‑tenant keys) or PostgreSQL RLS, documented pre‑implementation.
- `firm‑reporting` uses separate denormalised read schema; no direct writes. Dedicated connection pool.
- Metered operations **must** call `checkQuota()` before execution; CI static analysis enforces this.
- `firm‑workflow` (internal ops) and `firm‑funnels` (external marketing) have strictly separate bounded contexts, enforced by event contracts.

---

### 2.9 Layer 7 — Adapters

**Purpose:** Sole path between internal platform and external services. Feature packages must never call third‑party SDKs directly – only through adapters implementing **Port** interfaces (defined in `firm‑types`).

**Adapter categories & providers (105 total planned):**

| Category | Count | Providers |
|----------|-------|-----------|
| **CRM** | 7 | HubSpot, Salesforce, GoHighLevel, Pipedrive, Zoho, ActiveCampaign, Keap |
| **Email** | 6 | Resend, SendGrid, SES, Postmark, SMTP, Mailgun |
| **SMS** | 4 | Twilio, Vonage, MessageBird, Sinch |
| **Analytics** | 5 | GA4, Plausible, Fathom, Mixpanel, PostHog |
| **CRO** | 4 | Hotjar, CrazyEgg, Optimizely, VWO |
| **SEO Data** | 4 | SearchConsole, Semrush, Ahrefs, Moz |
| **Paid Ads** | 4 | Google Ads, Meta Ads, LinkedIn Ads, TikTok Ads |
| **CMS** | 4 | Sanity, Strapi, Directus, Contentful |
| **Booking** | 4 | Cal.com, Google Calendar, Outlook, Acuity |
| **Payments** | 4 | Stripe, Paddle, PayPal, Square |
| **Accounting** | 3 | QuickBooks, Xero, FreshBooks |
| **AI Models** | 4 | OpenAI, Anthropic, Google AI, Azure OpenAI |
| **AI Image Gen** | 2 | OpenAI (DALL‑E), Stability AI |
| **Social** | 4 | Meta, Twitter, LinkedIn, TikTok |
| **Reviews** | 3 | Google Business, Trustpilot, Yelp |
| **Proposals** | 4 | PandaDoc, Qwilr, DocuSign, Dropbox Sign |
| **Project Mgmt** | 4 | Asana, Trello, Monday, ClickUp |
| **Design** | 3 | Figma, Canva, Adobe CC |
| **Video** | 4 | YouTube, Vimeo, Wistia, Mux |
| **Chat** | 4 | Intercom, Drift, Tidio, WhatsApp |
| **SCIM** | 2 | Okta, Azure AD |
| **PDF Generation** | 2 | Puppeteer (self‑hosted), PdfShift (cloud) |
| **Video Conferencing** | 3 | Zoom, Google Meet, Microsoft Teams |
| **Email Validation** | 3 | ZeroBounce, NeverBounce, Kickbox |
| **Local Storage** | 1 | Local (filesystem‑based for development) |
| **Voice** | (future) | Reserved for VoicePort |

**Naming convention:** `adapters-<category>-<provider>` (e.g., `adapters‑crm‑hubspot`). Packages live in subdirectories grouped by category (`packages/layer7‑adapters/crm/adapters‑crm‑hubspot`) for discoverability while retaining flat pnpm workspace names. An auto‑generated `REGISTRY.md` maps every adapter to its Port interface and status.

**Universal adapter structure (every adapter must have):**
- `implements <Port>` (public export)
- Lazy client initialisation from env vars (via `firm‑env`)
- Transform functions: provider‑specific → canonical types
- Webhook signature verification: constant‑time compare, raw body only
- Prometheus metrics (call count, latency, errors)
- Provider error → `FirmError` mapping
- Generated via the adapter scaffolding generator (not hand‑authored). The generator simultaneously produces an adapter package, a stub, and a Port conformance test.

**Webhook security (non‑negotiable):**
- Constant‑time signature verification.
- Replay protection: timestamp tolerance (±5 min) + idempotency key store.
- Raw request body only for HMAC; parsed payload untrusted.

---

## Section 3: Immutable Stress‑Test Commitments

Four non‑negotiable guarantees. Enforced by automated mechanisms (Section 4). No exceptions.

---

### 3.1 Tenant Isolation

**Commitment:** Every tenant’s data/config/assets invisible to others at same hierarchy level. Exception: deliberate, audited parent‑child relationship – agency tenant can access its own sub‑accounts. Sibling sub‑accounts strictly isolated.

**What this means:**
- Request for Sub‑Account A never returns data from Sub‑Account B.
- Compromised sub‑account credentials: blast radius limited to that sub‑account.
- Agency admin *may* view aggregated/individual data across sub‑accounts – scoped, audited, not default.
- Platform admins: any cross‑tenant action audited and scoped to single tenant.

**Enforcement (architectural):**
- `tenant_id` column on every tenant‑scoped table. `tenants` table has `parent_tenant_id` (nullable) and `tenant_type` (`agency|sub_account|platform`).
- Row‑Level Security (RLS) on every tenant‑scoped table:
  - Default policy: `tenant_id = current_setting('app.current_tenant_id')::uuid`.
  - Agency‑admin policy: `tenant_id IN (SELECT id FROM tenants WHERE parent_tenant_id = current_setting(...))`.
- `setTenantContext()` sets `app.current_tenant_id` and, for agency admins, a parent‑scope flag.
- API request extracts tenant ID from headers/JWT before business logic. `CrossTenantAccessError` (HTTP 403) on violation – never 404 (avoid existence confirmation).
- Background workers restore tenant context from outbox event metadata.

---

### 3.2 Usage Control

**Commitment:** Resource‑intensive operations protected by probabilistic admission gating and explicit pre‑operation quota checks. Prevents any single tenant/user from overwhelming shared infrastructure or exceeding their plan limits silently.

**What this means:**
- Bulk export of 500k leads cannot starve other clients’ resources.
- Brute‑force login attacks thwarted by sliding‑window rate limiting.
- Expensive ops (AI generation, large file processing) throttled per tenant based on service tier.
- Metered operations (email sends, AI tokens, file storage) are checked *before* execution – not discovered as overages afterward.

**Enforcement (architectural):**
- Every rate‑limited endpoint references a **named policy** (e.g., `auth-login`). Policies defined in single auditable file in `firm-rate-limiter`. No inline overrides.
- Sliding‑window limiter backed by Redis. Redis unreachable → fail open (logged, alerted).
- Token‑bucket admission control for expensive ops, concurrency limited by tenant’s service tier.
- `firm-metering.checkQuota(tenantId, dimension, amount)` is the mandatory pre‑operation enforcement point for all billable and quota‑limited actions. A CI static‑analysis gate ensures it is called before any metered operation in feature packages.
- All limits surfaced in response headers (`X-RateLimit-Remaining`, `X-RateLimit-Reset`).

---

### 3.3 Event Reliability

**Commitment:** No business event ever silently lost. Events triggering critical side effects are persisted before transaction commit, and every event is processed at least once. The entire event catalog is externally verifiable through automatically generated AsyncAPI contracts.

**What this means:**
- Form submission → lead created, welcome email sent, CRM updated → all happen even if server crashes immediately after.
- Email provider down: retry with exponential backoff; after max attempts, move to dead‑letter queue.
- Payment processed but outbox worker crashes → event re‑delivered; idempotency key prevents duplicates.
- External webhook consumers and the platform SDK rely on a machine‑generated, versioned AsyncAPI document that describes every event type and version the platform may emit.

**Enforcement (architectural):**
- **Transactional outbox pattern:** within same DB transaction as business data, insert into `outbox_events`. Atomicity: transaction rollback removes both data and event.
- Separate worker reads outbox, dispatches to handlers, marks `completed` on success.
- Failure: increment `attempts`, schedule retry with exponential backoff. After max attempts → dead‑letter queue.
- **Idempotency keys** in every event. Handlers check before action – prevents double‑booking, double‑charging, duplicate sends.
- Long‑running workflows as state‑driven **sagas** with explicit compensation paths. Step failure → reverse previous steps (e.g., refund, cancel).
- **AsyncAPI generation gate** (CI Gate 16): `scripts/ci/generate-asyncapi.ts` reads the Event Registry, produces an AsyncAPI 3.0 `asyncapi.yaml`, and fails the build if any registered event lacks a channel definition. This makes the event guarantee auditable.

---

### 3.4 Schema Governance

**Commitment:** Shape of every DB table, API response, event payload, and validation rule defined in a single auditable location. ORM schemas and event schemas never drift. Events versioned; every consumer declares accepted versions. Versioned, distributable schema artifacts are produced by an automated build pipeline and committed as the canonical contract for external consumers.

**What this means:**
- Adding `preferredContactMethod` to `Lead` → DB migration, Zod validator, TS interface, API response, and event payloads all reflect change. Build‑time check ensures consistency.
- Breaking event change: new version (e.g., `lead.created v2`). Old handlers continue receiving v1 until they explicitly support v2.
- Handler never receives payload shape it hasn’t declared it can process.
- The OpenAPI, AsyncAPI, and JSON Schema artifacts in `contracts/v1/` exactly match the current codebase state and can be used by external integrators and SDK generators with confidence.

**Enforcement (architectural):**
- All Zod schemas in `firm-validators` satisfy compile‑time check against corresponding TS interface in `firm-types`.
- DB schemas in `firm-db-schema` are single source of truth; migrations generated, not hand‑written.
- **Event Registry** in `firm-api-contracts` sole authority for every event type + version. Every event definition includes mandatory `version`. Handlers declare `acceptsVersions` range.
- CI event inventory check: every emitted event version has at least one registered handler that accepts it.
- Cross‑reference manifest maps schemas → validators → events (with versions) → table definitions. Discrepancy fails build.
- **Schema build pipeline** (CI stage after event checks): `scripts/ci/schema-build.ts` produces `contracts/v1/openapi.json`, `contracts/v1/asyncapi.yaml`, and `contracts/v1/events.schema.json`. Committed artifacts must match generated output; mismatch → build fails.

---

## Section 4: Cross‑Cutting Enforcement Mechanisms

All rules mechanically enforced on every code change.

---

### 4.1 Package‑Boundary Enforcement

**Rule:** Packages may only import from same or lower layer. Upward/circular imports forbidden. Additional structural rules: feature packages must not call `fetch()` directly (all external calls must go through adapters); only outbox event handlers may write to the CQRS read model.

**Enforcement:**
1. **ESLint `boundaries` plugin** – each package type (`primitives|config|core|security|observability|ui|features|workers|adapters`) with allowed dependencies. `workers` added as a named boundary type.
2. **ESLint `no‑direct‑fetch` rule** – flags any `fetch()` call in feature packages; external communication must go through Layer 7 adapters.
3. **ESLint `no‑direct‑read‑model‑write` rule** – prevents direct database writes to the CQRS read schema from feature packages; only `firm‑bus` event handlers are permitted.
4. **`dep‑fence` script** – walks dependency graph; catches dynamic imports, re‑exports, layer violations.
5. **`exports` field verification** – script ensures no import of unlisted internal paths.

**Violation:** Build fails → correct import or layer reassignment via ADR.

---

### 4.2 Interface Freezes

**Rule:** Before implementing an adapter/feature/worker, its TypeScript interfaces must be frozen. Breaking changes require documented proposal.

**Enforcement:**
1. **Git tag** `iface‑freeze/v1-*`. CI blocks modifications to frozen files.
2. **TypeScript `satisfies` checks** – Zod schemas must satisfy frozen interface.
3. **Adapter conformance** – `implements` on class; missing methods or wrong types fail compilation.

**Violation:** Build fails. Breaking interface requires unfreezing via formal proposal, review, new freeze tag.

---

### 4.3 Event Registry Enforcement

**Rule:** Every event type + version must be registered in central `EventRegistry`. Handlers declare `acceptsVersions`. Emitting unregistered event or unsupported version impossible.

**Enforcement:**
1. **`defineEvent()`** – only event constructor. Requires mandatory `version`. Auto‑registers.
2. **CI event inventory check** – scans `emitEvent()` calls; cross‑references registry. Unregistered event → build fails.
3. **CI event versioning check** – every emitted version must have ≥1 handler whose `acceptsVersions` includes it. No handler → fail.
4. **Outbox validation** – `emitEvent()` validates payload against registered Zod schema (for that version). CI pre‑validates payload types.

**Violation:** Build fails (unregistered or unmatchable version). Runtime rejection (caught by CI before deploy).

---

### 4.4 Row‑Level Security (RLS) Coverage Tests

**Rule:** Every tenant‑scoped table must have RLS enabled + sibling isolation + parent visibility verified.

**Enforcement:**
1. **Migration hook** – Drizzle `afterMigrate` auto‑applies RLS policies (default + parent‑agency) to tables in `tenantScopedTables`.
2. **`firm‑health` RLS probe** – readiness probe checks `pg_tables` for `rowsecurity=true`. Any missing → `unhealthy`, deployment blocked.
3. **CI sibling isolation test** – create data as Sub‑Account A, switch to Sub‑Account B (same parent), attempt read → expect zero results.
4. **CI parent visibility test** – create data as Sub‑Account A, switch to parent agency admin → data visible. Verify parent cannot write (RLS read‑only).

**Violation:** Migration fails if policies incomplete. CI test fails → build blocked. RLS probe fails → deployment blocked.

---

### 4.5 Tag Governance

**Rule:** Every third‑party script tag must be registered in `TagRegistry` (`firm-security`). Unregistered scripts cannot render.

**Enforcement:**
1. **`TagRegistry`** – sole script source. ESLint rule (`no‑inline‑third‑party‑scripts`) flags manual `<script>` tags.
2. **Consent category validation** – each tag declares required category (`analytics|marketing|functional`). Missing/invalid → build fails.
3. **Subresource Integrity (SRI) hash required** – every tag must have valid `integrity` field. CI verifies; missing hash → reject.

**Violation:** Build fails (unregistered, missing category, missing SRI). Runtime: tag never injected.

---

### 4.6 Feature Flag Expiration

**Rule:** Temporary feature flags must carry expiration date. Expired flags break build. Flags must handle Redis unavailability via circuit‑breaker behaviour (return `defaultValue`).

**Enforcement:**
1. **Flag definition** – mandatory `expiresAt` field (UTC timestamp). Permanent flags use `never` marker.
2. **CI expiration check** – script checks each flag’s `expiresAt` against current date. Past expiration → build fails.
3. **Runtime defense** – expired flag evaluates as `false` + alert. Redis unreachable → flag returns its `defaultValue` (logged and alerted).

**Violation:** Build fails if any temporary flag expired.

---

### 4.7 PII Redaction Verification

**Rule:** No PII (email, phone, SSN) ever appears in plaintext in logs, errors, or Sentry events.

**Enforcement:**
1. **Dual‑level redaction (`firm-logger`)** – field‑path stripping (e.g., `user.email`) + regex pattern scanner. Both must pass.
2. **CI redaction test** – feed known PII‑containing object through logger; grep output for PII values. Any plaintext → build fails.
3. **Sentry PII filter** – identical redaction rules. CI validates Sentry event filtering.

**Violation:** Build fails if any PII appears unredacted. Runtime defensive redaction prevents emission (CI gate primary).

---

### 4.8 CI Pipeline Specification

Sequence (any failure blocks pipeline):

**Stage / Guards**
- **Supply‑Chain Security** – `npm audit` (fail on high/critical CVEs) + license scanner (reject GPL for SaaS)
- **Boundary Check** – ESLint `boundaries` + `no‑direct‑fetch` + `no‑direct‑read‑model‑write` + `dep‑fence` (Section 2 layer hierarchy)
- **Type Check** – `tsc --noEmit` (strict preset)
- **Lint** – ESLint (style, imports, branded‑ID asserts, no `console.log`)
- **Adapter Scaffolding Verification** – every adapter must be generated by the scaffolding script; stubs and conformance tests must exist
- **Unit & Integration Tests** – Vitest (coverage ≥80%)
- **Event Registry Check** – AST scan of `emitEvent()` against registry (3.4)
- **Event Versioning Check** – every emitted version has handler accepting it (3.4)
- **Event Schema Validation** – payload satisfies registered Zod schema (3.4)
- **RLS Coverage Check** – `firm‑health` probe + sibling/parent tests (3.1)
- **RLS Integration Test (Sibling)** – cross‑tenant data leak test (3.1)
- **RLS Integration Test (Parent)** – agency visibility (3.1)
- **Quota Check Enforcement** – static analysis verifying `checkQuota()` is called before any metered operation
- **PII Redaction Test** – log capture + grep (4.7)
- **Feature Flag Expiration** – scan flag definitions (4.6)
- **Tag Registry Integrity** – all third‑party scripts registered, consented, SRI hashed (4.5)
- **Observability Instrumentation** – AST check for `initializeObservability()` in every entry point (3‑pillar requirement)
- **Package `exports` Verification** – no import of unlisted internal paths
- **AsyncAPI Generation** – `scripts/ci/generate‑asyncapi.ts` reads EventRegistry, validates against AsyncAPI 3.0, fails if any event lacks a channel definition
- **Schema Build** – `scripts/ci/schema‑build.ts` produces `contracts/v1/openapi.json`, `contracts/v1/asyncapi.yaml`, `contracts/v1/events.schema.json`; committed artifacts must match generated output
- **Build** – `tsup` via Turborepo

---

### 4.9 Pre‑Merge Validation Gates

**Gate 1: Test Coverage Minimum**
- Rule: Packages Layers 1‑7 ≥80% coverage (lines, branches, functions, statements).
- Enforcement: Vitest `coverage.thresholds` per package. CI stage fails if below. Waiver requires documented, time‑bound architect approval.
- Violation: PR cannot merge.

**Gate 2: Schema Freeze Check**
- Rule: After freeze tag (`iface‑freeze/*`), frozen files cannot be modified without `breaking‑change` label + architecture reviewer approval.
- Enforcement: CI detects freeze tag, requires label and extra reviewer (branch protection).
- Violation: PR cannot merge.

**Gate 3: Database Migration Safety**
- Rule: Any PR adding/modifying tenant‑scoped table must include RLS policy (same migration) + isolation test.
- Enforcement: CI script inspects migration for `CREATE TABLE` in `tenantScopedTables` → checks for `ENABLE ROW LEVEL SECURITY` and `CREATE POLICY`. Also checks for new/updated isolation test in `firm‑db‑schema` suite.
- Violation: PR cannot merge.

**Gate 4: Adapter Scaffolding Gate (new)**
- Rule: Any new adapter must be created via the adapter scaffolding generator. Stub and conformance test must be included in the same PR.
- Enforcement: CI verifies adapter directory structure matches generated template. Manually authored adapters fail.
- Violation: PR cannot merge.

---

### 4.10 Post‑Deployment Verification

**Gate 1: Health Endpoint Probing**
- Rule: Load balancer queries `/health/readiness`. If probe fails, no traffic routed.
- Enforcement: Readiness probe includes `rlsHealthCheck()` and dependency checks. Failure → deployment marked unhealthy, rollback triggered.

**Gate 2: Synthetic Smoke Tests**
- Rule: After deployment passes health checks, automated smoke tests run against live deployment. Failure → alert, optional rollback.
- Enforcement: `SyntheticCheckManager` in `firm‑health/synthetic` defines checks (lead creation, notification, auth flow, consent gate, observability export). Runner executes every 5 minutes. Alert on failure; probation‑period rollback optional.

---

### 4.11 Adapter Scaffolding Enforcement

**Rule:** Every adapter in Layer 7 must be produced by the canonical adapter scaffolding generator. Manually authored adapters are not accepted. The generator simultaneously creates the adapter package, a test stub implementing the same Port, and a Port conformance test.

**Enforcement:**
1. **Generator CLI** – `pnpm turbo gen adapter` scaffolds `adapters-<category>-<provider>` with uniform structure (implements Port, lazy client, error mapping, metrics, webhook verify‑deduplicate‑process).
2. **CI verification** – checks adapter directory structure against the generated template. Any deviation → build fails.
3. **Conformance test** – every adapter must pass a Port conformance test that verifies all methods return canonical types and that error mapping produces `FirmError`.

**Violation:** Build fails (non‑conforming or hand‑authored adapter). Adapters missing stubs or conformance tests rejected at PR.

---

### 4.12 Quota Check Enforcement

**Rule:** Every metered operation in a feature package must call `firm‑metering.checkQuota()` before executing the chargeable action. Metering after the fact is not a substitute for pre‑operation enforcement.

**Enforcement:**
1. **Static analysis** – CI script scans feature package source for calls to known metered operations (`recordUsage`, AI SDK calls, email send, media upload, etc.) and ensures a preceding `checkQuota()` call exists in the same execution path.
2. **Runtime defense** – `recordUsage()` emits a warning if `checkQuota()` was not called within the same request context, enabling production detection of circumvention.
3. **Test requirement** – tests for metered operations must verify that exceeding a quota is rejected with `QuotaExceeded` *before* the operation executes.

**Violation:** Build fails (missing `checkQuota()` call). PR rejected if test coverage for quota rejection is absent.

---

### 4.13 AsyncAPI Generation Enforcement

**Rule:** The complete event catalog must be externally verifiable. Every registered event type + version must appear as a channel in a machine‑generated AsyncAPI 3.0 contract.

**Enforcement:**
1. **`scripts/ci/generate‑asyncapi.ts`** – reads the `EventRegistry` in `firm‑api‑contracts`, maps each event type to an AsyncAPI channel, and produces `contracts/v1/asyncapi.yaml`.
2. **CI gate** – after event registry checks, the script runs. If any registered event has no corresponding channel (missing metadata, unregistered channel definition) → build fails.
3. **Committed artifact** – the generated `asyncapi.yaml` is committed. Mismatch between committed and generated output → build fails, ensuring the contract is always current.

**Violation:** Build fails (unmapped event, missing channel, or outdated committed artifact).

---

### 4.14 Schema Build Pipeline Enforcement

**Rule:** Versioned, distributable schema artifacts representing the platform’s API and event contracts must be automatically generated from the single source of truth and committed. Consumers (external integrators, SDK generators) rely on these artifacts.

**Enforcement:**
1. **`scripts/ci/schema‑build.ts`** – produces:
   - `contracts/v1/openapi.json` (from tRPC/OpenAPI definitions in `firm‑api‑contracts`)
   - `contracts/v1/asyncapi.yaml` (produced by the AsyncAPI generation gate above)
   - `contracts/v1/events.schema.json` (JSON Schema for all event payloads)
2. **CI gate** – runs after event checks and AsyncAPI generation. Fails if any artifact cannot be generated or if the generated content does not match the committed file exactly.
3. **Versioned contract** – breaking changes produce a new `v2/` directory with its own set of artifacts, preserving `v1/` for backward compatibility.

**Violation:** Build fails (generation failure or committed artifact out of date).

---

## Section 5: Data Flow Architecture

Canonical flows demonstrating layer dependencies and enforcement points (Sections 2‑4).

---

### 5.1 Incoming HTTP Request (Create Lead) – with API Gateway

```
Browser/Client
    │
    ▼
[Edge API Gateway]
    │── Rate limiting (named policies from firm‑rate‑limiter)
    │── DDoS protection, WAF, IP rules
    │── Forward X‑Tenant‑Id, X‑Correlation‑Id, traceparent
    ▼
[Next.js Edge/Middleware]
    │── firm‑config‑next: security headers (CSP nonce, HSTS)
    │── firm‑request‑context: extract/create correlationId, traceId → AsyncLocalStorage
    ▼
[Security Middleware: firm‑security]
    │── CSRF (session‑bound, constant‑time)
    │── Turnstile (if bot‑protected endpoint)
    ▼
[Rate Limiting: firm‑rate‑limiter]
    │── Redis sliding window, named policy "api‑general"
    │── Fail‑open if Redis unreachable → logged, alerted
    ▼
[Authentication: firm‑auth]
    │── authenticateRequest() tries cookie → bearer → API key
    │── Valid session → frozen SessionContext (userId, tenantId, permissions)
    │── Invalid → 401/403
    ▼
[Authorization: firm‑auth/permissions]
    │── requirePermission("lead:create") checks RBAC matrix
    │── Denied → 403
    ▼
[Feature Handler: firm‑leads (future)]
    │── Validate payload with firm‑validators (leadSchemaV2)
    │── DB transaction via firm‑db‑client
    │── INSERT leads (tenantId auto‑set by RLS)
    │── INSERT outbox_events ("lead.created", version 2) within same transaction
    │── COMMIT
    ▼
[Observability: firm‑observability]
    │── withTenantSpan("createLead") captures trace with tenantId, userId, correlationId
    │── HTTP request metric incremented
    ▼
[Response: 201 Created]
    │── firm‑logger structured JSON (PII redacted)
    │── TraceContext in response headers (traceparent)
```

**Demonstrates:** `firm‑rate‑limiter` as a standalone Layer 3 package, two‑layer rate limiting (edge + application), atomic outbox, automatic context propagation.

---

### 5.2 Authentication Flow (Detailed)

Client sends credentials (cookie, bearer, API key). `authenticateRequest()` tries in priority order:

1. **Cookie present?** → `extractSessionFromCookie()` → `verifySession(token)` (Better Auth) → checks expiry, revocation, MFA → returns frozen `SessionContext`.
2. **Bearer token?** (falls through if cookie fails) → same as above.
3. **API key?** → `verifyApiKey(key, {ip, userAgent, endpoint})`:
   - Validate format (prefix `firm_`)
   - Hash key → query DB by keyPrefix
   - Constant‑time HMAC compare against stored hash
   - Check active, not expired, rate‑limited, IP allowed
   - Check sub‑account scoping: API key only authorises access to the issuing tenant
   - Return permissions (no session object)

**Key points:** Unified entry point, priority short‑circuit, constant‑time at every step, sub‑account scoping enforced at the API‑key level.

---

### 5.3 Event‑Driven Outbox Flow

```
Business Operation (e.g., create lead)
    │
    ▼
Database Transaction
    │── INSERT/UPDATE business table (via firm‑db‑client)
    │── INSERT outbox_events (event_type, version, payload) – same transaction
    │── COMMIT
    ▼
Outbox Worker (firm‑bus / Inngest)
    │── Poll outbox_events WHERE status='pending' AND nextAttemptAt <= now()
    │── For each event:
    │     ├─ markEventAsProcessing()
    │     ├─ Look up handler in EventRegistry for (event_type, version)
    │     │    └─ Validate payload against Zod schema for that version
    │     ├─ Dispatch to handler
    │     ├─ Success → markEventAsCompleted()
    │     └─ Failure:
    │           ├─ Increment attempts, exponential backoff
    │           ├─ If attempts < max → status='failed' (retryable)
    │           └─ If ≥ max → dead‑letter queue, alert
    ▼
Saga Orchestrator (multi‑step workflows)
    │── Each step idempotent with compensating action
    │── Saga state persisted in saga_instances table (defined in firm‑db‑schema – Layer 2)
    │── Durable execution engine handles step failure, retry, and compensation
```

**Demonstrates:** Explicit `version` in events, version‑specific schema validation, retries, dead‑letter, sagas. **Saga state schema lives at Layer 2** (`firm‑db‑schema`), not implicitly in the Layer 6 implementation — keeping the state contract formally governed.

---

### 5.4 Consent Resolution Flow (Server‑Side)

Request arrives at Next.js page/API route.

1. **`firm‑consent/server.ts`**:
   - Parse cookie header → extract `firm_consent` cookie
   - `parseSignedCookie()` – verify HMAC signature (constant‑time)
   - Validate consent record structure, check expiration
   - `getConsentFromHeaders()` returns `ConsentRecord` or `null`

2. **Check GPC header** (`Sec‑GPC: 1`):
   - `isGpcEnabledFromHeaders()` → `applyGpcOverrides(choices)` forces `analytics=false, marketing=false`
   - `gpcApplied` flag set in the signed consent record for audit trail

3. **Page/API logic**:
   - `hasConsentFromHeaders('analytics')` → false → GA script not rendered
   - `hasConsentFromHeaders('marketing')` → false → Facebook Pixel omitted
   - `consentGate('functional', manager, () => <ChatWidget />)` – conditional rendering

4. **Response**:
   - CSP nonce injected (per‑request)
   - Google Consent Mode v3 translation fires before any Google tags if consent changed
   - No third‑party scripts in HTML body unless consented
   - `set‑cookie` may update consent expiration

**Key points:** Consent resolved server‑side before HTML rendered – scripts structurally absent. GPC overrides stored consent and leaves an audit flag. Google Consent Mode v3 translation integrated with the CSP nonce pipeline.

---

### 5.5 Observability Context Propagation

```
Incoming Request
    │── W3C traceparent present? → extract traceId/spanId → set in firm‑request‑context
    │── Otherwise generate new traceId/spanId
    ▼
Any code in request flow:
    │── withTenantSpan("createLead", (span) => { ... })
    │      └─ Automatically attaches tenant.id, user.id, correlation.id as span attributes
    │── logger.info("Lead created", { leadId })
    │── platformMetrics.httpRequestsTotal.add(1, { tenant_id: ctx.tenantId })
    ▼
Outgoing call to external service (CRM adapter)
    │── injectTraceContext(headers) adds traceparent to outbound HTTP
    ▼
Outbox Event persisted
    │── Event metadata carries traceId, correlationId, tenantId
    ▼
Background Worker (firm‑bus) or standalone worker in workers/
    │── Extracts traceId, correlationId from event metadata/inbound headers
    │── Restores context via setRequestContext()
    │── Worker spans = children of original request span
    │── When calling external adapters, injectTraceContext() again
    ▼
Full trace: Browser → API Gateway → Next.js → Outbox → Worker → Adapter → External API
```

**Key points:** Context survives every boundary (sync, outbox, any background worker in `workers/`) – restored identically via `setRequestContext()`. `withTenantSpan()` guarantees tenant context is never accidentally omitted from traces.

---

### 5.6 Database Tenant Scoping (Three‑Tier Hierarchy)

```
Pre‑condition: setTenantContext(tenantId, { isAgencyAdmin: false }) called
    │── Done automatically by middleware or withTenantContext()
    ▼
Inside withTenantContext(tenantId, db, opts?):
    │── db.execute(`SET LOCAL app.current_tenant_id = ${tenantId}`)
    │── If opts.isAgencyAdmin === true:
    │       db.execute(`SET LOCAL app.current_agency_admin = true`)
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
    │── Sub‑account user (isAgencyAdmin=false) → only rows with tenant_id = sub‑account ID
    │── Agency admin (isAgencyAdmin=true) → rows from agency own tenant + all sub‑accounts
    │── Sibling sub‑accounts invisible to each other
    ▼
Multi‑step transaction:
    │── INSERT leads ... (tenant_id set by app)
    │── INSERT outbox_events ... (tenant_id from context)
    │── Writes restricted to current tenant (agency‑admin flag = read‑only for RLS)
    ▼
Cleanup: firm‑db‑client PgBouncer‑safe RESET wrapper
    │── RESET app.current_tenant_id; RESET app.current_agency_admin
    │── Ensures connection pool eviction does not leak tenant context to next request
    │── (Addresses the highest‑severity vulnerability documented in the platform security review)
```

**Demonstrates:** Three‑tier hierarchy in RLS, sibling isolation, parent visibility with zero app‑code changes beyond `setTenantContext()`. Write operations still guarded at application level. **The PgBouncer‑safe RESET wrapper** in `firm‑db‑client` prevents the cross‑tenant data‑leak vulnerability on connection pool eviction — the most critical security mechanism in the data access layer.

---

## Section 6: Design Principles & Shared Vocabulary

Glossary of platform‑specific terms + recurring architectural patterns.

---

### 6.1 Glossary of Platform Terms

- **API Gateway**: Edge component (Cloudflare/NGINX/Kong) applying rate limiting, WAF, DDoS protection before traffic reaches app. Named policies mirrored from `firm‑rate‑limiter`.

- **Audit Trail**: Append‑only, cryptographically chained record of significant business operations (`firm‑audit`). Each record includes hash of previous – tamper‑detectable. Required for SOC 2.

- **Branded ID**: TypeScript string tagged with unique symbol (`TenantId`, `AgencyId`, `SubAccountId`, `PlatformId`, `SessionId`, `UserId`). Compile‑time incompatibility prevents ID mix‑ups across the three‑tier hierarchy. Runtime gatekeeper (`asTenantId(uuid)`) validates UUID. Defined in `firm‑primitives`. ESLint bans raw `as TenantId`.

- **C2PA Manifest**: Coalition for Content Provenance and Authenticity manifest. Required under EU AI Act Art. 50 for AI‑generated content. Stores content hash, generation timestamp, model identifier, prompt hash (not the full prompt), and an AI‑training‑data assertion in `ai_generation_log.c2pa_manifest`. Generated by `firm‑security`, attached by `firm‑ai‑content`.

- **Chaos Engineering**: Controlled failure injection to verify resilience guarantees. The platform uses Toxiproxy for network‑level faults (Redis down, outbox worker crash, PgBouncer eviction). Required to prove the “no event ever lost” and “tenant isolation holds under failure” commitments.

- **`checkQuota`**: The primary API of `firm‑metering` (`checkQuota(tenantId, dimension, amount)`). Performs pre‑operation quota enforcement; rejects operations before they consume resources. CI static analysis requires it before every metered operation.

- **Constant‑Time Comparison**: Comparison that takes same time regardless of input differences. Prevents timing attacks. Used for HMAC, API keys, CSRF tokens, webhook signatures, consent cookies. `crypto.timingSafeEqual`.

- **CQRS Read‑Model**: Separate denormalised read‑optimised schema (`firm‑db‑read`) for `firm‑reporting`. Populated exclusively by outbox event handlers. Never accepts direct writes from feature packages (enforced by ESLint). Prevents analytical load impacting transaction performance.

- **Data Residency**: Infrastructure‑enforced requirement that a tenant’s data is stored only in their designated region (GDPR Art. 32). `infra/` is organised into regional subdirectories (`us‑east‑1/`, `eu‑west‑1/`). `firm‑compliance` runs an application‑level assertion verifying that no cross‑region writes occurred.

- **Design Token (DTCG)**: W3C Design Tokens Community Group JSON format for colours, spacing, typography, etc. Source of truth in `firm‑tokens` → generated CSS custom properties + TypeScript constants. No hardcoded visual values.

- **Digest Batching**: Grouping related notifications within a configurable time window into a single delivery. Prevents a bulk operation (e.g., importing 500 leads) from triggering 500 individual email/SMS alerts.

- **Dry‑Run Mode**: Simulation without side effects. Used in `firm‑provisioning` (validate tenant creation before committing), `firm‑rate‑limiter` (record would‑be‑rate‑limited events without blocking), and `firm‑compliance` (validate erasure saga before execution).

- **Event Versioning**: Every event carries `version` field. Handler declares `acceptsVersions` range. CI ensures each emitted version has handler. Breaking changes = new version; old handlers continue receiving old versions.

- **Global Privacy Control (GPC)**: Browser signal `Sec‑GPC: 1` indicating user does not want data sold/shared. Platform treats as binding directive: overrides consent cookie, forces `analytics=false, marketing=false`. Banner cannot override. The `gpcApplied` flag is embedded in the signed consent cookie for audit.

- **Grace Period**: Brief continued access window (3–7 days) after payment failure before hard subscription revocation. Managed by `firm‑subscriptions` to prevent immediate lockout from a failed card payment.

- **Idempotency Key**: Unique identifier enabling safe retry. Receiver stores key + first result; duplicate arrivals return stored result without repeating side effect. Used in payments, email, webhooks, outbox events.

- **Metering**: Recording resource consumption per tenant per billing period (leads, emails, AI tokens, storage, API calls). `firm‑metering` aggregates in Redis → periodic flush to DB. Used by quotas (`firm‑subscriptions`) and invoicing (`firm‑billing`).

- **Nonce‑Based CSP**: Unique cryptographic nonce per request injected into CSP header and every `<script>` tag. Browser executes only scripts with matching nonce. Dynamic pages use nonce; static pages use pre‑computed hashes.

- **Outbox Pattern**: Reliability strategy: event inserted into `outbox_events` within same DB transaction as data change. Worker (`firm‑bus`) reads and dispatches. Guarantees atomicity + at‑least‑once delivery. Saga state schema (`saga_instances`) is defined in `firm‑db‑schema` at Layer 2, not implicitly in the Layer 6 implementation — keeping the saga contract schema‑governed.

- **Port & Adapter (Hexagonal Architecture)**: **Port** = interface in `firm‑types` (canonical contract). **Adapter** = Layer 7 package implementing that interface for specific provider. Feature packages depend only on Port.

- **Result Type**: `Result<T, E>` = `Ok(value)` or `Err(error)`. Expected failures return `Err`; caller must handle. Unexpected failures throw exceptions.

- **Row‑Level Security (RLS)**: PostgreSQL feature auto‑filtering rows by security policy. Platform uses for tenant isolation + parent‑child hierarchy. Applied at migration time, verified by health probes.

- **Saga**: Long‑running workflow with compensable steps. If step fails, compensation steps run in reverse. Executed by `firm‑bus` with durable state persisted in `saga_instances` (defined in `firm‑db‑schema`).

- **SCIM** (System for Cross‑domain Identity Management): RFC 7643/7644 for automated user provisioning. Enterprise Okta/Azure AD integration via Layer 7 `firm‑adapter‑scim‑okta` and `firm‑adapter‑scim‑azure‑ad`, orchestrated by `firm‑auth`.

- **SLO (Service Level Objective)**: Specific measurable target for reliability, latency, or correctness (e.g., API p95 latency < 500ms, outbox processing lag < 60s). Defined in `docs/slos/`. Each SLO has a corresponding Grafana alert and runbook.

- **Sub‑Account**: End‑client of an agency in three‑tier hierarchy (Platform → Agency → Sub‑Account). Inherits branding/billing from parent agency. Sibling sub‑accounts strictly isolated. Modeled via `parent_tenant_id` and `tenant_type` in `tenants` table.

- **Supply‑Chain Integrity**: Automated checks: `npm audit` (block high/critical CVEs), license scanner (reject GPL for SaaS), SRI hashes for browser scripts. Enforced in CI.

- **TCF 2.2**: IAB Europe’s Transparency & Consent Framework v2.2. Required for programmatic ad platforms (DV360, Google Ads for EU) to serve personalised ads. Encoded by `firm‑consent` as the `tcf_string` consent signal.

---

### 6.2 Recurring Architectural Patterns

**Pattern: Result for Expected Failures**  
- *Problem*: Functions fail predictably (validation, missing records). Returning `null` or throwing creates ambiguity.  
- *Solution*: Return `Result<T, E>`. TypeScript enforces handling.  
- *When*: Expected, documentable failures. Not for programmer errors or infrastructure failures.  
- *Example*: Lead validation → `Result<Lead, ValidationError>`; API handler checks result → 201 or 400.

**Pattern: Decorator for Auth**  
- *Problem*: Direct coupling to third‑party auth library (Better Auth) makes migration expensive.  
- *Solution*: `firm‑auth` wraps Better Auth, exposes platform‑specific constructs (frozen `SessionContext`, RBAC, MFA, audit). Feature packages depend only on `firm‑auth`.  
- *When*: Any third‑party service that may be replaced.  
- *Example*: Replacing Better Auth → only `firm‑auth` changes.

**Pattern: Event Registry as Single Source of Truth**  
- *Problem*: Producers and consumers define events independently → drift → runtime mismatches.  
- *Solution*: Central `EventRegistry` in `firm‑api‑contracts`. `defineEvent()` registers; workers import same definition. No raw emission.  
- *When*: Any event emitted by one package and consumed by another.  
- *Example*: `firm‑funnels` defines `funnel.step_completed` via `defineEvent()`; `firm‑reporting` imports same definition to listen.

**Pattern: Lazy Initialisation from Environment Variables**  
- *Problem*: Hardcoding secrets unsafe; loading at module import breaks testing and optional integrations.  
- *Solution*: Client created on first use from `firm‑env` validated variables. Constructor reads `process.env` through env validation.  
- *When*: Every Layer 7 adapter + optional Layer 6 service integrations.  
- *Example*: Stripe adapter creates client only on first `createCheckoutSession()` call, reading `STRIPE_SECRET_KEY`.

**Pattern: Webhook Verify‑Then‑Deduplicate‑Then‑Process**  
- *Problem*: Inbound webhooks need signature verification, idempotency, then logic. Wrong order creates vulnerabilities.  
- *Solution*: Fixed three‑step sequence (mandatory):  
  1. **Verify** – HMAC signature of raw body (constant‑time). Fail → 401.  
  2. **Deduplicate** – check idempotency key (provider event ID). Already processed → return 200.  
  3. **Process** – business logic, emit platform outbox event.  
- *When*: Every adapter webhook handler.  
- *Example*: Stripe `checkout.session.completed`: verify signature → idempotency on event ID → update invoice, emit `invoice.paid`.

**Pattern: Metering Pattern**  
- *Problem*: Tracking resource usage for quotas/billing without adding latency to hot path, and without allowing operations to proceed beyond plan limits.  
- *Solution*: `checkQuota()` is called before any chargeable operation → rejects if quota exceeded. Successful operations place a meter event in the transactional outbox alongside business data. Aggregation worker increments Redis counters, periodically flushes to DB.  
- *When*: Any resource dimension with quota or billable.  
- *Example*: `firm‑ai‑content` calls `checkQuota(tenantId, 'ai_tokens', estimatedTokens)` → rejected if exceeded. On success, emits `ai.token.consumed` meter event; `firm‑metering` increments tenant’s monthly AI‑token counter.

**Pattern: Two‑Phase GDPR Erasure (in `firm‑compliance`)**  
- *Problem*: Immediate hard‑delete risks irreversible mistakes; delayed deletion risks non‑compliance with “without undue delay”.  
- *Solution*:  
  - **Phase 1 (immediate)** : Anonymise all PII in DB (names, emails, phones, addresses, IPs) → satisfies prompt action.  
  - **Phase 2 (after retention window, e.g., 30 days)** : Hard delete all records.  
- *When*: Any data deletion subject to privacy regulations.  
- *Example*: `firm‑compliance.eraseDataSubject(subjectId)` triggers saga: immediate anonymisation → export generation → retention clock → hard deletion → confirmation.

**Pattern: Human‑Approval Gate**  
- *Problem*: Certain operations (AI content, bulk emails, landing page publish, ad campaigns) must never execute without explicit human review.  
- *Solution*: Output produced as `pending_approval`. Only path to `approved` is explicit `approve()` function guarded by RBAC permission + audit log write. No `autoApprove` flag, no bypass.  
- *When*: AI content generation, sending bulk emails, publishing landing pages, approving ad campaigns, signing contracts.  
- *Example*: `firm‑ai‑content` content endpoint returns `status:'pending_approval'`. Reviewer calls `approveContent()` with `requirePermission('content:approve')` → audit record → status `approved`. Only approved content rendered or sent.

---

## Section 7: AI Agent Onboarding Instructions

Designed for AI coding agents at session start – provides repository structure, rules, and references without re‑reading entire Blueprint.

---

### 7.1 Repository Overview (for AI context window)

Monorepo with strict layers (0‑7). Layer 0 = config & constraints (`firm‑primitives` – branded IDs for three‑tier hierarchy: `TenantId`, `AgencyId`, `SubAccountId`, `PlatformId`, `SessionId`, `UserId`). Layer 1 = core utilities. Layer 2 = data & contracts (`firm‑types` domain interfaces, `firm‑db‑schema` Drizzle schemas, `firm‑db‑client` runtime connections, `firm‑sdk`). Layer 3 = identity, security, consent, rate limiting (`firm‑rate‑limiter` is separate). Layer 4 = observability & health. Layer 5 = UI & theming (`firm‑ui`, `firm‑theme‑provider`, `firm‑testing`). Layer 6 = feature packages & workers (Tiers A‑D; `firm‑ai` infrastructure + `firm‑ai‑content` generation split; `firm‑sales‑pipeline` renamed). Layer 7 = adapters (105 total, sole external bridge).

**Three‑tier tenant hierarchy:** Platform → Agency → Sub‑Account. RLS enforces sibling isolation & parent visibility.

**Critical directories:** `packages/` (layer0‑config, layer1‑core, layer2‑data, layer3‑security, layer4‑observability, layer5‑ui, layer6‑features, layer7‑adapters), `apps/`, `workers/` (background job handlers – renamed from `services/`), `infra/` (regional subdirectories for data residency), `docs/adr/`, `docs/slos/`, `docs/compliance/`, `e2e/`, `load‑tests/` (k6 scenarios), `chaos/` (Toxiproxy scenarios), `scripts/`, `local‑dev/`.

**Rules:** No layer‑up imports. Feature packages must not call `fetch()` directly. Only `firm‑bus` event handlers may write to the CQRS read model. Each package has `exports` field = public API. Enforced by ESLint + `dep‑fence`.

---

### 7.2 When Asked to Build a New Package

1. **Identify layer** (Section 2). Confirm dependencies only from lower layers.
2. **Check `exports`** of dependencies – import only public API.
3. **Define DB tables** in `firm‑db‑schema`. Tenant‑scoped? Include RLS policies (default + parent‑agency visibility) + sibling/parent isolation tests in same PR.
4. **Register events** in `firm‑api‑contracts` via `defineEvent()` with mandatory `version`. Ensure handler `acceptsVersions` covers it.
5. **Use `firm‑validators`** – every Zod schema must `satisfy` corresponding `firm‑types` interface.
6. **Use `Result` type** (`firm‑utils`) for expected failures.
7. **Use `firm‑logger`** – `console.log` banned.
8. **Write tests** – ≥80% coverage.
9. **If Layer 7 adapter:** generate via `pnpm turbo gen adapter` (hand‑authored adapters fail CI). Must implement Port interface, lazy init from `firm‑env`, transform functions, error mapping, metrics, webhook verify‑deduplicate‑process. Simultaneous stub + conformance test generated.
10. **If generating content (AI, documents, emails):** enforce Human‑Approval Gate – output `pending_approval`, only `approveContent()` with `content:approve` permission sets `approved`, C2PA manifest stored. No bypass.
11. **If metered operation:** call `firm‑metering.checkQuota()` *before* executing the chargeable action. CI static analysis enforces this.

---

### 7.3 When Asked to Fix a Bug

1. **Consult Current State Assessment** – lists known bugs with file locations & required fixes.
2. **Examine test coverage** – if missing tests, add them alongside fix.
3. **Ensure no layer boundary violations** – no new upward imports, no `fetch()` in feature packages, no direct write to read model.
4. **Run CI locally** – boundary check, type check, lint, tests – before commit.

---

### 7.4 Key Files to Review for Context

Layer definitions: `packages/layer0‑config/firm‑config‑eslint/src/presets/boundaries.ts`  
Branded IDs: `packages/layer0‑config/firm‑primitives/src/ids.ts`  
Domain entities: `packages/layer2‑data/firm‑types/src/entities.ts`  
Event Registry: `packages/layer2‑data/firm‑api‑contracts/src/events/registry.ts`  
Session types: `packages/layer3‑security/firm‑auth/src/session/types.ts`  
Permission matrix (three‑tier): `packages/layer3‑security/firm‑auth/src/permissions/matrix.ts`  
Rate limit policies: `packages/layer3‑security/firm‑rate‑limiter/src/policies.ts`  
DB schemas: `packages/layer2‑data/firm‑db‑schema/src/schemas/*.ts`  
DB client: `packages/layer2‑data/firm‑db‑client/src/client.ts`  
RLS policies: `packages/layer2‑data/firm‑db‑schema/src/rls‑policies.ts`  
Request context: `packages/layer1‑core/firm‑request‑context/src/store.ts`  
Logger: `packages/layer1‑core/firm‑logger/src/logger.ts`  
Validation fields: `packages/layer2‑data/firm‑validators/src/common.ts`  
Tag Registry: `packages/layer3‑security/firm‑security/src/tags/registry.ts`  
Feature flags: `packages/layer6‑features/firm‑flags/src/flags.ts`  
Audit log: `packages/layer6‑features/firm‑audit/src/audit.ts`  
Metering: `packages/layer6‑features/firm‑metering/src/meter.ts`  
ADRs: `docs/adr/`  
SLOs: `docs/slos/`  
Compliance: `docs/compliance/data‑residency.md`  
Boundary enforcement: `scripts/ci/dep‑fence.ts`  
Event version check: `scripts/ci/event‑version‑check.ts`

---

### 7.5 Anti‑Patterns to Avoid

- Importing from internal paths (not `exports` field).
- Using `as TenantId` instead of `asTenantId(uuid)` gatekeeper.
- Hardcoding rate limit values – reference named policy in `firm‑rate‑limiter`.
- Emitting unregistered event or version without handler.
- Manual tenant ID in SQL – use `setTenantContext()`.
- Calling `fetch()` or any third‑party SDK directly from a feature package – use Layer 7 adapter.
- Writing directly to the CQRS read model – only `firm‑bus` event handlers are permitted.
- `console.log` – use `firm‑logger`.
- Adding tenant‑scoped table without RLS policies + tests.
- Processing webhook before signature verification or idempotency.
- Performing a metered operation without a preceding `checkQuota()` call.
- Hand‑authoring an adapter – always use the scaffolding generator.
- Importing `@firm/tokens` at runtime – tokens are build‑time only; use CSS custom properties.
- Marking AI‑generated content as `approved` without explicit human‑review gate.
- Modifying `infra/` unless explicitly requested.

---

*Document End*