# Marketing Agency Mono Repository Blueprint & Assessment
## Part 1 — Platform Identity & Mission

***

> **Document Purpose:** This is the master reference document for the Firm platform monorepo. It is written for three simultaneous readers: the founding operator making strategic decisions, AI coding agents building packages and applications, and AI planning agents reasoning over architecture. Every section contains both a plain-language rationale and a precise technical specification. Neither is abbreviated for the other.

***

## 1.1 Core Mission Statement

The Firm platform is a **full-service, white-label marketing operating system** built as a single TypeScript monorepo. It serves multiple client businesses (tenants) simultaneously from one shared infrastructure while maintaining strict isolation of their data, branding, and configuration. Every client experiences the platform as their own product — their logo, their domain, their colors — without any awareness that it is shared infrastructure underneath.

The platform's mission has three layers:

**Layer A — Agency Operations:** Give the agency itself a unified command center for managing all client work — campaigns, content, reporting, proposals, invoicing, and internal projects — without switching between a dozen disconnected SaaS tools.

**Layer B — Client Delivery:** Give each client a branded portal where they can see their marketing performance, approve content, manage their bookings, access reports, and communicate with the agency — without ever knowing they are on a shared platform.

**Layer C — Business Autonomy:** Replace per-client SaaS subscriptions (GoHighLevel at $297/month, Calendly at $20/month, AgencyAnalytics at $49/month, etc.) with native platform capabilities that the agency owns outright. The cost structure inverts: instead of paying per client per tool, the agency builds once and deploys to all clients.

***

## 1.2 Business Model: Agency Economics at 1,000 Clients

Understanding the financial logic behind the architecture is essential for prioritization decisions — both for the founder and for AI agents reasoning about which features to build first.

### The SaaS Displacement Math

A typical marketing agency serving 100 clients with standard tooling pays:

| Tool | Per-Client Cost | 100 Clients | 1,000 Clients |
|---|---|---|---|
| GoHighLevel | $297/month | $29,700 | $297,000 |
| AgencyAnalytics | $49/month | $4,900 | $49,000 |
| Calendly Teams | $20/month | $2,000 | $20,000 |
| PandaDoc | $35/month | $3,500 | $35,000 |
| Hootsuite | $99/month | $9,900 | $99,000 |
| Birdeye / Podium | $299/month | $29,900 | $299,000 |
| **Monthly Total** | | **$79,900** | **$799,000** |

The platform's native applications (`platform-crm`, `platform-campaigns`, `platform-booking`, `platform-reporting`, `platform-social`, `platform-reputation`) replace each of these tools for all clients simultaneously. The infrastructure cost to serve 1,000 tenants on a shared monorepo is a fraction of $799,000/month.

### The Revenue Model

The platform enables two revenue streams that did not exist before:

1. **White-label SaaS reselling:** The agency sells its clients access to the platform portal at a monthly fee. A client portal subscription at $99–$299/month across 1,000 clients is $99,000–$299,000/month in recurring platform revenue, separate from agency service fees.

2. **Service tier ascension:** The platform is designed so clients ascend through capability tiers as the agency delivers more value: Website → SEO → Content → Booking → Analytics → CRM → Full Platform. Each tier adds packages, adapters, and platform app access. Higher tiers command higher monthly retainers.

### The Adapter Bridge Strategy

Adapters serve a dual commercial purpose that is not immediately obvious from the technical architecture:

- **During client onboarding:** The adapter to whatever tool the client was using before (GoHighLevel, Calendly, Mindbody) imports their historical data. The client does not lose their leads, bookings, or campaign history.
- **During transition:** The adapter keeps the old tool and the new platform in sync. The client can observe both working simultaneously, which eliminates the risk perception of switching.
- **After migration:** The adapter is deactivated. The native platform feature is the sole system of record. The per-client tool subscription is cancelled.

This is why adapters are built before the native applications they will eventually replace — the adapter is the sales motion, not just the technical bridge.

***

## 1.3 Industry Verticals Served

The platform serves 12 primary industry verticals. Each vertical has a distinct configuration profile — a set of feature packages that are activated, adapters that are connected, compliance posture that is applied, and onboarding checklist that is followed. This profile is stored as a JSON file in `docs/verticals/<vertical>.json` and is read by `worker-tenant-provisioning` at the moment a new client is created.

| Vertical | Dominant Tool Being Displaced | Critical Integration | Key Compliance Concern |
|---|---|---|---|
| **Dental** | Dentrix patient recalls, Healthgrades reviews | `adapters-vertical-dentrix`, `adapters-reviews-healthgrades` | No PHI in platform (HIPAA boundary) |
| **Legal** | Clio practice management, Avvo reviews | `adapters-vertical-clio`, `adapters-reviews-avvo` | Attorney-client privilege, no case data |
| **Real Estate** | Propertyware, MLS feeds, Guesty | `adapters-vertical-propertyware`, `adapters-vertical-guesty` | Fair Housing Act ad targeting rules |
| **Medical / Allied Health** | Jane App, athenahealth, Healthgrades | `adapters-vertical-jane`, `adapters-vertical-athenahealth` | HIPAA BAA required per tenant |
| **Fitness & Wellness** | Mindbody, Vagaro | `adapters-vertical-mindbody`, `adapters-vertical-vagaro` | None specific |
| **Home Services** | ServiceTitan, Jobber | `adapters-vertical-servicetitan`, `adapters-vertical-jobber` | Contractor license display |
| **Salon & Spa** | Vagaro, Boulevard | `adapters-vertical-vagaro` | None specific |
| **Restaurant & Food** | Toast, Lightspeed | `adapters-vertical-toast`, `adapters-vertical-lightspeed` | Allergen disclosure requirements |
| **Construction** | Buildertrend, Procore | `adapters-vertical-buildertrend` | State contractor licensing |
| **E-Commerce & Retail** | Shopify, WooCommerce | `adapters-ecapi-shopify`, `adapters-ecapi-woocommerce` | PCI DSS: payment data never touches platform |
| **B2B Professional Services** | HubSpot, Salesforce | `adapters-crm-hubspot`, `adapters-crm-salesforce` | SOC 2 readiness (data handling contracts) |
| **Short-Term Rental** | Guesty, Airbnb | `adapters-vertical-guesty` | Local STR ordinance awareness |

### Vertical Feature Profiles

Each vertical profile activates a specific combination of Layer 6 feature packages. Examples:

**Dental profile activates:**
`firm-bookings` (with patient recall fields), `firm-reputation` (Healthgrades + Google), `firm-forms` (patient intake), `firm-notifications` (appointment reminders via SMS + email), `firm-campaigns` (recall sequences), `firm-reporting` (review score + appointment fill rate)

**Home Services profile activates:**
`firm-bookings` (with job dispatch fields), `firm-leads` (with service area routing), `firm-forms` (estimate request), `firm-campaigns` (seasonal service sequences), `firm-reputation` (Google + Houzz + Yelp), `firm-ads` (local service ads)

**E-Commerce profile activates:**
`firm-campaigns` (abandoned cart, post-purchase sequences), `firm-ads` (ROAS tracking), `firm-analytics` (product funnel analytics), `firm-forms` (email capture with discount offer), `firm-landing-pages` (product campaign pages), `firm-reporting` (e-commerce KPI dashboard)

***

## 1.4 The Native Substitute Strategy

The platform's native applications are not copies of third-party tools — they are purpose-built implementations of the same workflows that third-party tools provide, built to share data and logic across all tenants from one codebase. The strategy has five phases per tool category:

**Phase 1 — Adapter First:** Build the adapter to the tool the client is currently using. This establishes the data model, the field mapping, and the sync patterns before building the native replacement.

**Phase 2 — Parallel Running:** Deploy both the adapter (syncing to the old tool) and the native platform feature simultaneously. Data flows in both directions. The client sees both working.

**Phase 3 — Validation:** The agency uses the native platform feature for new clients, while existing clients continue on the old tool with sync active. The native feature is validated against real data.

**Phase 4 — Migration:** Existing clients are migrated to the native feature. The adapter switches to import-only mode (no writes back to the old tool). Historical data is fully present in the platform.

**Phase 5 — Deactivation:** The adapter is deactivated. The old tool subscription is cancelled. The client is fully on the native platform.

| Native Application | Replaces | Phase Strategy |
|---|---|---|
| `platform-crm` + `platform-campaigns` | GoHighLevel | Adapter sync → parallel → migrate → deactivate GHL |
| `platform-booking` | Calendly / Acuity / Mindbody | Adapter import → parallel → migrate → deactivate |
| `platform-social` | Hootsuite / Buffer | Adapter connects channels → native schedules → deactivate |
| `platform-seo` | AgencyAnalytics / Semrush | Adapters remain as data sources; native UI replaces vendor UI |
| `platform-reputation` | Birdeye / Podium | Adapter pulls review data → native manages responses → deactivate |
| `platform-proposals` | PandaDoc | Adapter imports existing docs → native builder going forward |
| `platform-analytics` + `platform-reporting` | AgencyAnalytics | Adapters pull all data sources; white-label reports fully native |
| `platform-projects` | ClickUp / Asana | Adapter imports project history → native replaces PM tool |
| `platform-invoicing` | FreshBooks / QuickBooks invoicing | Accounting adapters remain for sync; invoicing UI is native |

***

## 1.5 Platform Non-Negotiables

These are the three structural laws of the platform. They are not conventions or recommendations — they are constraints enforced by CI gates and by the layer architecture itself. An AI coding agent that encounters a scenario where violating one of these laws appears to be simpler or faster must treat the violation as a blocker, not a shortcut.

### Law 1: The Adapter Is the Only Point of Contact With the Outside World

No package in Layers 0–6 imports a vendor SDK. Stripe's SDK, GoHighLevel's SDK, Twilio's SDK, Anthropic's SDK — every one of these lives inside its respective adapter package in Layer 7 and never crosses the layer boundary. Feature packages (`firm-payments`, `firm-campaigns`, `firm-email`) call adapter interfaces defined in `firm-types`. They have no knowledge of which provider is implementing that interface for any given tenant.

**Why this law exists:** At 1,000 tenants across 12 verticals with 80+ integrations, a vendor changing their API affects exactly one adapter package and zero feature packages. Without this law, a Stripe API deprecation touches `firm-payments`, `firm-billing`, `firm-reporting`, and potentially `platform-invoicing`. With this law, it touches `adapters-billing-stripe` only. The law's value compounds with every new adapter added.

**CI enforcement:** `scripts/validate-adapters.ts` scans every package in Layers 0–6 for imports of known vendor SDK package names. Any violation fails the build.

### Law 2: Tenant Context Is Always Derived, Never Trusted

The `tenantId` in every request context is set by `firm-auth` from the cryptographically verified session. It is never read from a URL parameter, a query string, a request header supplied by the client, or any user-controlled input. At the database layer, the RLS policy on every tenant-scoped table enforces this a second time using `current_setting('app.current_tenant_id')` — the application layer is the primary defense, RLS is the safety net. Both are tested in CI.

**Why this law exists:** At 1,000 tenants, a single cross-tenant data exposure affects two tenants, potentially triggers GDPR breach notification requirements in every EU jurisdiction where either tenant has users, and destroys trust in the platform. The law treats tenant isolation as a correctness property of the system, not a feature.

**CI enforcement:** `scripts/validate-rls-policies.ts` verifies that every table containing a `tenant_id` column has a corresponding RLS policy. Any table missing a policy fails the build.

### Law 3: Every Async Operation Is an Outbox Event

Email sending, SMS delivery, CRM sync, webhook dispatch, AI content generation, report creation, and payment processing are all initiated by inserting a row into `outbox_events` inside the same database transaction as the triggering business operation. The Inngest-based `worker-outbox-processor` picks up the event after the transaction commits and drives the downstream workflow.

**Why this law exists:** If the application crashes, the network drops, or a downstream service is unavailable after the database write but before a direct job enqueue, the operation is lost. At 1,000 tenants with concurrent activity, silent operation loss compounds into support tickets, data inconsistencies, and client trust failures within days. The outbox guarantee means the operation will eventually execute regardless of what fails between the DB commit and the job execution.

**CI enforcement:** ESLint rules in `firm-config-eslint` flag any direct call to an adapter or email/SMS sending function from inside a feature package without going through the outbox event pattern. This is a warning in development and an error in CI.

***

## 1.6 Compliance Deadlines & Legal Exposure

Four active legal deadlines apply directly to the platform as of the current date (May 2026). These are not future planning items — they are active legal obligations with specific enforcement dates. The packages responsible for each are identified below. An AI coding agent building any of these packages must implement the compliance requirement as a mandatory feature, not an optional enhancement.

| Deadline | Date | Requirement | Package Responsible | What "Done" Looks Like |
|---|---|---|---|---|
| **NY Synthetic Performer Labeling** | June 9, 2026 | AI-generated content depicting performers must carry disclosure labels | `firm-ai`, `firm-consent` | Non-removable disclosure label on all AI-generated content records; rendered in all client-facing views |
| **Google Consent Mode v3** | June 15, 2026 | `ad_storage` signal must gate all Google Ads data collection; all client sites must be audited | `firm-consent`, all `apps/clients/*` | Consent banner fires before Google Ads scripts load; `ad_storage: 'granted'/'denied'` signal sent; CI audit script verifies every client site |
| **CNIL Email Tracking Pixel Consent** | July 14, 2026 | Email tracking pixels require separate, prior, explicit consent for EU recipients | `firm-consent`, `firm-email` | Pixel tracking suppressed for EU recipients until explicit consent recorded in `consent_records`; `firm-email` checks consent before including tracking pixel |
| **EU AI Act Article 50** | August 2, 2026 | All AI-generated content must carry C2PA provenance manifests and non-removable disclosure labels | `firm-security`, `firm-ai`, `firm-ai-content` | `generateC2PAManifest()` called after every AI generation; manifest stored in `ai_generation_log.c2pa_manifest`; disclosure label non-removable in all rendering surfaces |

### Compliance Architecture Overview

All four deadlines route through the `firm-consent` package as the enforcement gate. The `firm-consent` package:

- Reads the `Sec-GPC` (Global Privacy Control) header on every request. If present and set to `1`, all non-essential tracking is disabled immediately — no consent banner required, no user action needed.
- Manages the consent banner lifecycle: display logic, user preference recording, preference storage in `consent_records` table (with `ip_address` and `user_agent` for audit trail).
- Exposes a `hasConsent(userId, tenantId, consentType)` function consumed by `firm-email` (before pixel inclusion), `firm-analytics` (before event tracking), and `firm-ads` adapters (before firing ad pixels).
- Implements Google Consent Mode v3 signal dispatch: `ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization` signals are set based on recorded consent state.

The C2PA compliance path runs through `firm-security`'s `generateC2PAManifest()` function, which is called by `firm-ai` after every generation event. The manifest records the AI model used, the generation timestamp, the tenant ID, the task type, and a hash of the generated content. It is stored in `ai_generation_log` and attached to the content record in whatever domain table owns it (`cms_content`, `campaign_emails`, `social_posts`, etc.).

***

## 1.7 Guiding Principles for AI Coding Agents

Every AI agent working in this repository must internalize the following principles before writing a single line of code. These are not style preferences — they are correctness requirements.

**Principle 1 — Layers are not suggestions.** If a feature package needs to send an email, it calls the `EmailAdapter` interface from `firm-types`. It does not import `resend` or `sendgrid`. If it needs to charge a payment, it calls the `BillingAdapter` interface. The import path enforces the layer boundary.

**Principle 2 — The interface is the contract.** Before writing implementation code for any package, verify that the interface it implements (from `firm-types`) and the Zod schema it validates against (from `firm-validators`) are finalized. Building implementation code against an unstable interface produces rework. The interface freeze milestone in Layer 2 is a hard prerequisite.

**Principle 3 — `tenantId` is always the first argument.** Every database query function, every cache operation, every adapter call accepts `tenantId` as its first explicit parameter. There are no exceptions. Functions that do not accept `tenantId` are either pure utilities in Layer 0/1 or they are incorrectly designed.

**Principle 4 — Tests are not optional.** Every file created in `src/` has a corresponding test file in `tests/`. Integration tests use PGLite (in-memory PostgreSQL) for database tests and `ioredis-mock` for cache tests. No package is "done" without passing tests. The `firm-testing` package provides shared test factories and harnesses.

**Principle 5 — Observability is built-in, not bolted on.** Every package that performs an operation of meaningful duration wraps it in an OpenTelemetry span via `firm-observability`. Every adapter emits `adapter_operation_duration_seconds` and `adapter_errors_total` Prometheus metrics. These are not post-launch additions — they are acceptance criteria for "done."

**Principle 6 — The outbox is the only async primitive.** There is no `setTimeout`, no direct job enqueue, no fire-and-forget API call from inside a database transaction. If an operation needs to happen after a business event, the business event is recorded in `outbox_events` and the worker handles the rest.

# Marketing Agency Mono Repository Blueprint & Assessment
## Part 3 — Repository Structure

***

> **Purpose of This Part:** This part is the authoritative directory reference for every AI coding agent working in the repository. Every directory, its purpose, its rules, and its relationship to other directories is defined here. When an agent needs to create a new file, add a new package, or scaffold a new application, this part answers the question: "Where does it go, and what rules apply to it?"

***

## 3.1 Top-Level Directory Map

```
firm-platform/                        ← Monorepo root
│
├── .github/                          ← CI/CD workflows, PR templates, CODEOWNERS
├── apps/                             ← All deployable applications
├── packages/                         ← All shared libraries (145 packages at full build)
├── services/                         ← Standalone background worker processes
├── infra/                            ← Infrastructure as Code (IaC)
├── scripts/                          ← CI validation scripts and operational CLIs
├── docs/                             ← All documentation
├── .env.example                      ← Complete list of all required env vars
├── package.json                      ← Root workspace definition
├── pnpm-workspace.yaml               ← pnpm workspace glob patterns
├── turbo.json                        ← Turborepo pipeline definitions
├── tsconfig.base.json                ← Base TypeScript config extended by all packages
└── .npmrc                            ← pnpm settings (minimumReleaseAge, blockExoticSubdeps)
```

### Root-Level Rules

- The root `package.json` contains no application or library dependencies — only workspace tooling (`turbo`, `typescript`, `pnpm`).
- No source code lives at the root level. All code lives inside `apps/`, `packages/`, or `services/`.
- `tsconfig.base.json` is the single source of TypeScript compiler options. Every `tsconfig.json` inside packages and apps extends it. Options set here apply everywhere.
- `.npmrc` enforces `minimumReleaseAge=1440` (24-hour cooldown on new dependency versions) and `blockExoticSubdeps=true` as supply chain security controls.
- `turbo.json` defines the complete pipeline. No ad-hoc scripts outside this pipeline are permitted in CI.

***

## 3.2 `apps/` Directory

```
apps/
│
├── firm-site/                        ← Agency's own marketing website
│
├── clients/                          ← One directory per client (tenant)
│   ├── _template/                    ← Scaffolding template for new client sites
│   ├── client-acme-dental/           ← Example: Acme Dental Group
│   ├── client-summit-realty/         ← Example: Summit Realty
│   ├── client-forge-hvac/            ← Example: Forge HVAC Services
│   ├── client-peak-fitness/          ← Example: Peak Fitness Studio
│   └── client-<slug>/               ← Pattern: always kebab-case slug
│
└── platform/                         ← Internal platform applications
    ├── platform-portal/              ← Unified white-label client hub
    ├── platform-analytics/           ← Client-facing analytics dashboard
    ├── platform-crm/                 ← Contact management and pipelines
    ├── platform-campaigns/           ← Campaign builder (email/SMS/social)
    ├── platform-booking/             ← Appointment scheduling
    ├── platform-forms/               ← Form builder and submission management
    ├── platform-funnels/             ← Multi-step funnel builder
    ├── platform-landing-pages/       ← Landing page builder
    ├── platform-email/               ← Email campaign editor
    ├── platform-seo/                 ← Rank tracking, audits, keyword research
    ├── platform-reputation/          ← Review management and GBP
    ├── platform-ads/                 ← Cross-platform paid ads management
    ├── platform-social/              ← Social media scheduler and publisher
    ├── platform-content/             ← AI content generation CMS
    ├── platform-reporting/           ← White-label report builder
    ├── platform-proposals/           ← Proposal builder and e-signature
    ├── platform-invoicing/           ← Invoicing and billing portal
    ├── platform-projects/            ← Agency internal project management
    ├── platform-documents/           ← Contract and document management
    ├── platform-chat/                ← Unified inbox (SMS/email/social DMs)
    └── platform-admin/               ← Superadmin: tenant management, platform health
```

### `apps/firm-site/` Rules

| Property | Value |
|---|---|
| **Framework** | Next.js 16 App Router (primary) or Astro 6 for pure marketing pages |
| **CMS** | None — all content is `.tsx` / `.mdx` committed to the repository |
| **Deployment** | Vercel |
| **Key Packages** | `@firm/ui`, `@firm/seo`, `@firm/analytics`, `@firm/forms`, `@firm/consent` |
| **Performance Target** | Lighthouse 95+ on all pages |

- No `'use client'` directive on marketing pages unless browser APIs or event handlers are strictly required.
- No CMS dependency. Content changes require a code commit. This is intentional — it keeps the marketing site fast, secure, and under version control.
- Must include `@firm/consent` for analytics tracking consent before any `@firm/analytics` scripts load.
- `app/api/health/route.ts` is mandatory (Gate 15 in CI).

### `apps/clients/_template/` Rules

The `_template` directory is the canonical scaffolding for every new client site. When `scripts/provision-tenant.ts` runs, it copies `_template` to `apps/clients/client-<slug>/` and substitutes template variables (`{{CLIENT_SLUG}}`, `{{CLIENT_NAME}}`, `{{TENANT_ID}}`).

**Mandatory files in every client site:**

```
apps/clients/client-<slug>/
├── app/
│   ├── layout.tsx                    ← Consent gate, analytics init, tenant CSS injection
│   ├── page.tsx                      ← Home page
│   ├── api/
│   │   ├── health/
│   │   │   └── route.ts              ← REQUIRED: GET /api/health (Gate 15)
│   │   └── forms/
│   │       └── [formId]/
│   │           └── route.ts          ← Form submission handler
│   └── (routes)/                     ← Vertical-specific routes
├── lib/
│   ├── analytics.ts                  ← @firm/analytics initialization
│   └── logger.ts                     ← @firm/logger child instance for this client
├── proxy.ts                          ← Tenant resolution (Vercel edge function)
├── middleware.ts                     ← Edge-compatible security checks (Cloudflare)
├── security.config.ts                ← CSP nonce generation, HSTS config
├── next.config.ts                    ← Extends firm-config-next
├── tailwind.config.ts                ← Extends firm-config-tailwind; client token overrides
└── package.json                      ← Client-specific dependencies
```

**Client site rules (CI-enforced):**
- Tenant resolution happens exclusively in `proxy.ts` for Vercel deployments. `middleware.ts` is retained only for Cloudflare deployments.
- `tenantId` is derived from the host header in `proxy.ts` — never from URL parameters or cookies.
- `noindex` must **never** be set in production (CI script `scripts/verify-security-headers.ts` checks this).
- Client sites must not import from other client site packages. Cross-client imports are forbidden.
- Every client site must use `@firm/consent` if loading any non-essential scripts (analytics, ads pixels).

### `apps/platform/*` Rules

All platform applications share a common baseline:

| Requirement | Implementation |
|---|---|
| **Authentication** | Better Auth + Authentik OIDC — all routes protected, no public pages |
| **Health endpoint** | `GET /api/health` with liveness + readiness semantics (Gate 15) |
| **Metrics endpoint** | Prometheus metrics on `:9090/metrics` via `@firm/health` |
| **Security headers** | CSP via `security.config.ts`, HSTS, all standard headers |
| **Data access** | All queries through `@firm/db` with `setTenantContext()` — no raw SQL |
| **Deployment** | Vercel Pro (default); `platform-booking` is self-hosted on Hetzner via Coolify |
| **Observability** | All platform apps import `@firm/observability` and initialize at startup |

**Platform app build priority sequence:**
1. `platform-analytics` — first client-facing surface after portal
2. `platform-portal` — unified white-label client hub
3. `platform-reputation` — high visible ROI for clients
4. `platform-seo` — agency differentiation feature
5. `platform-booking` — self-hosted, appointment scheduling
6. `platform-crm` — core agency workflow
7. `platform-email` — campaign email editor
8. `platform-content` — AI content generation
9. `platform-ads` — paid advertising management
10. Remaining apps built as corresponding feature packages complete

***

## 3.3 `packages/` Directory

The complete package tree organized by architectural layer. Every package is listed with its npm scope name and single-line purpose.

```
packages/
│
│   ── LAYER 0: Build & Constraint ─────────────────────────────────────────
│
├── firm-config-typescript/           ← @firm/config-typescript
│   └── Shared tsconfig factories (createTsConfig, createAppConfig, etc.)
│
├── firm-config-eslint/               ← @firm/config-eslint
│   └── ESLint rules + layer boundary enforcement + import ordering
│
├── firm-config-prettier/             ← @firm/config-prettier
│   └── Shared Prettier configuration
│
├── firm-config-next/                 ← @firm/config-next
│   └── createNextConfig() with security headers, Turbopack, cache profiles
│
├── firm-config-tailwind/             ← @firm/config-tailwind
│   └── Shared Tailwind base config, content paths, intentional safelist patterns
│
├── firm-config-vitest/               ← @firm/config-vitest
│   └── Shared Vitest configuration, coverage thresholds, PGLite setup
│
├── firm-tokens/                      ← @firm/tokens
│   └── W3C DTCG design token JSON → CSS custom props / TS constants / Tailwind
│
│   ── LAYER 1: Core Utilities & Environment ─────────────────────────────
│
├── firm-env/                         ← @firm/env
│   └── Validated env modules: database, redis, auth, platform (t3-oss/env-nextjs)
│
├── firm-utils/                       ← @firm/utils
│   └── Pure utility functions — slugify, formatDate, deepMerge, etc.
│
├── firm-errors/                      ← @firm/errors
│   └── FirmError base class + full taxonomy (auth, authz, validation, server, consent)
│
├── firm-crypto/                      ← @firm/crypto
│   └── HMAC-SHA256, timing-safe equality, secure token generation, deepFreeze
│
├── firm-logger/                      ← @firm/logger
│   └── Pino structured JSON logger, PII redaction, child logger factory
│
├── firm-request-context/             ← @firm/request-context
│   └── AsyncLocalStorage context store — correlationId, tenantId, traceId
│
│   ── LAYER 2: Data & Contracts ─────────────────────────────────────────
│
├── firm-types/                       ← @firm/types
│   └── Branded IDs, enums, domain entity interfaces, adapter interfaces
│
├── firm-validators/                  ← @firm/validators
│   └── Zod v4 schemas for all entities — canonical source for all validation
│
├── firm-api-contracts/               ← @firm/api-contracts
│   └── tRPC router contracts, OpenAPI 3.1 specs, Inngest event registry
│
├── firm-db/                          ← @firm/db
│   └── Drizzle schema, database client, RLS helpers, cursor pagination, migrations
│
├── firm-cache/                       ← @firm/cache
│   └── Redis TenantCache, session store adapter, pub/sub, in-memory test fallback
│
│   ── LAYER 3: Identity, Security & Consent ──────────────────────────────
│
├── firm-auth/                        ← @firm/auth
│   └── Better Auth integration, RBAC, MFA, API keys, sessions, impersonation
│
├── firm-security/                    ← @firm/security
│   └── SecurityAuditLogger, CSP, CSRF, C2PA manifest generation, rate limit bridge
│
├── firm-rate-limiter/                ← @firm/rate-limiter
│   └── Sliding window + token bucket, per-tenant/user/key/IP, middleware factory
│
├── firm-consent/                     ← @firm/consent
│   └── GPC enforcement, Google Consent Mode v3, consent banner, GDPR/CCPA
│
│   ── LAYER 4: Observability & Health ──────────────────────────────────
│
├── firm-observability/               ← @firm/observability
│   └── OTel SDK init, auto-instrumentation, trace-log correlation, span helpers
│
├── firm-health/                      ← @firm/health
│   └── createHealthRouter(), liveness/readiness probes, dep health checkers
│
│   ── LAYER 5: UI, Theming & Configuration ───────────────────────────────
│
├── firm-ui/                          ← @firm/ui
│   └── Radix UI component library, design system, Storybook
│
├── firm-config/                      ← @firm/config
│   └── Tenant configuration resolution, feature flag evaluation bridge
│
│   ── LAYER 6: Feature Packages ─────────────────────────────────────────
│
├── firm-background-jobs/             ← @firm/background-jobs
├── firm-notifications/               ← @firm/notifications
├── firm-webhooks/                    ← @firm/webhooks
├── firm-storage/                     ← @firm/storage
├── firm-media/                       ← @firm/media
├── firm-features/                    ← @firm/features
├── firm-search/                      ← @firm/search
├── firm-i18n/                        ← @firm/i18n
├── firm-sdk/                         ← @firm/sdk  (published to npm)
├── firm-payments/                    ← @firm/payments
├── firm-leads/                       ← @firm/leads
├── firm-forms/                       ← @firm/forms
├── firm-bookings/                    ← @firm/bookings
├── firm-campaigns/                   ← @firm/campaigns
├── firm-reporting/                   ← @firm/reporting
├── firm-cms/                         ← @firm/cms
├── firm-landing-pages/               ← @firm/landing-pages
├── firm-funnels/                     ← @firm/funnels
├── firm-social/                      ← @firm/social
├── firm-reputation/                  ← @firm/reputation
├── firm-ads/                         ← @firm/ads
├── firm-ai/                          ← @firm/ai
├── firm-ai-content/                  ← @firm/ai-content
├── firm-ai-brand-voice/              ← @firm/ai-brand-voice
├── firm-ai-seo/                      ← @firm/ai-seo
├── firm-ai-chat/                     ← @firm/ai-chat
├── firm-projects/                    ← @firm/projects
├── firm-documents/                   ← @firm/documents
├── firm-proposals/                   ← @firm/proposals
├── firm-portal/                      ← @firm/portal
├── firm-onboarding/                  ← @firm/onboarding
├── firm-tenancy/                     ← @firm/tenancy
├── firm-white-label/                 ← @firm/white-label
├── firm-seo/                         ← @firm/seo
├── firm-tracking/                    ← @firm/tracking
│
│   ── LAYER 7: Adapters ─────────────────────────────────────────────────
│
│   ── CRM ──────────────────────────────────────────────────────────────
├── adapters-crm-gohighlevel/         ← @firm/adapters-crm-gohighlevel
├── adapters-crm-hubspot/             ← @firm/adapters-crm-hubspot
├── adapters-crm-salesforce/          ← @firm/adapters-crm-salesforce
├── adapters-crm-pipedrive/           ← @firm/adapters-crm-pipedrive
├── adapters-crm-zoho/                ← @firm/adapters-crm-zoho
├── adapters-crm-keap/                ← @firm/adapters-crm-keap
├── adapters-crm-activecampaign/      ← @firm/adapters-crm-activecampaign
│
│   ── Email ─────────────────────────────────────────────────────────────
├── adapters-email-resend/
├── adapters-email-sendgrid/
├── adapters-email-postmark/
├── adapters-email-ses/
├── adapters-email-mailchimp/
├── adapters-email-klaviyo/
│
│   ── SMS & Voice ───────────────────────────────────────────────────────
├── adapters-sms-twilio/
├── adapters-sms-vonage/
├── adapters-sms-telnyx/
├── adapters-sms-bandwidth/
│
│   ── Billing & Payments ───────────────────────────────────────────────
├── adapters-billing-stripe/
├── adapters-billing-paddle/
├── adapters-payments-square/
├── adapters-payments-clover/
├── adapters-payments-paypal/
│
│   ── Storage ──────────────────────────────────────────────────────────
├── adapters-storage-s3/
├── adapters-storage-r2/
├── adapters-storage-b2/
│
│   ── Analytics ────────────────────────────────────────────────────────
├── adapters-analytics-umami/
├── adapters-analytics-posthog/
├── adapters-analytics-ga4/
├── adapters-analytics-mixpanel/
├── adapters-analytics-segment/
│
│   ── AI Models ────────────────────────────────────────────────────────
├── adapters-ai-anthropic/
├── adapters-ai-openai/
├── adapters-ai-gemini/
├── adapters-ai-mistral/
├── adapters-ai-groq/
├── adapters-ai-replicate/
│
│   ── Social Media ────────────────────────────────────────────────────
├── adapters-social-meta/
├── adapters-social-linkedin/
├── adapters-social-tiktok/
├── adapters-social-x/
├── adapters-social-pinterest/
├── adapters-social-youtube/
│
│   ── Paid Advertising ────────────────────────────────────────────────
├── adapters-ads-google/
├── adapters-ads-meta/
├── adapters-ads-microsoft/
├── adapters-ads-tiktok/
├── adapters-ads-linkedin/
│
│   ── SEO Data ──────────────────────────────────────────────────────
├── adapters-seo-google-sc/
├── adapters-seo-ahrefs/
├── adapters-seo-semrush/
├── adapters-seo-moz/
├── adapters-seo-brightlocal/
│
│   ── Reviews & Reputation ─────────────────────────────────────────────
├── adapters-reviews-google/
├── adapters-reviews-yelp/
├── adapters-reviews-trustpilot/
├── adapters-reviews-facebook/
├── adapters-reviews-healthgrades/
├── adapters-reviews-avvo/
├── adapters-reviews-houzz/
│
│   ── Calendar & Booking ────────────────────────────────────────────────
├── adapters-calendar-google/
├── adapters-calendar-microsoft/
├── adapters-calendar-apple/
├── adapters-booking-calendly/
├── adapters-booking-acuity/
├── adapters-booking-mindbody/
├── adapters-booking-vagaro/
├── adapters-booking-jane/
│
│   ── E-Commerce ──────────────────────────────────────────────────────
├── adapters-ecapi-shopify/
├── adapters-ecapi-woocommerce/
├── adapters-ecapi-bigcommerce/
├── adapters-ecapi-squarespace/
├── adapters-ecapi-wix/
│
│   ── Accounting ───────────────────────────────────────────────────────
├── adapters-accounting-quickbooks/
├── adapters-accounting-xero/
├── adapters-accounting-freshbooks/
│
│   ── Project Management ──────────────────────────────────────────────
├── adapters-pm-asana/
├── adapters-pm-monday/
├── adapters-pm-clickup/
├── adapters-pm-notion/
├── adapters-pm-basecamp/
│
│   ── Proposals & Documents ──────────────────────────────────────────
├── adapters-proposals-pandadoc/
├── adapters-proposals-docusign/
├── adapters-proposals-hellosign/
├── adapters-proposals-proposify/
│
│   ── Communication & Chat ───────────────────────────────────────────
├── adapters-chat-intercom/
├── adapters-chat-crisp/
├── adapters-chat-livechat/
├── adapters-chat-drift/
├── adapters-comms-zoom/
├── adapters-comms-googlemeet/
├── adapters-comms-slack/
│
│   ── Video & Media ───────────────────────────────────────────────────
├── adapters-video-mux/
├── adapters-video-cloudflare/
├── adapters-video-vimeo/
├── adapters-video-youtube/
│
│   ── Design ──────────────────────────────────────────────────────────
├── adapters-design-canva/
├── adapters-design-figma/
│
│   ── Automation / iPaaS ─────────────────────────────────────────────
├── adapters-automation-zapier/
├── adapters-automation-make/
├── adapters-automation-n8n/
├── adapters-automation-activepieces/
│
│   ── Vertical-Specific ──────────────────────────────────────────────
├── adapters-vertical-mindbody/
├── adapters-vertical-jane/
├── adapters-vertical-clio/
├── adapters-vertical-buildertrend/
├── adapters-vertical-jobber/
├── adapters-vertical-servicetitan/
├── adapters-vertical-propertyware/
├── adapters-vertical-guesty/
├── adapters-vertical-toast/
├── adapters-vertical-lightspeed/
├── adapters-vertical-athenahealth/
└── adapters-vertical-dentrix/
```

### Package Internal Structure (Canonical Template)

Every package in `packages/` follows this internal structure. Deviations require documented justification.

```
packages/firm-<name>/
├── src/
│   ├── index.ts                      ← Public API — named re-exports only, no defaults
│   ├── types.ts                      ← Package-internal types (not exported unless needed)
│   ├── <feature>.ts                  ← Feature modules
│   ├── metrics.ts                    ← Prometheus metrics definitions (if applicable)
│   └── errors.ts                     ← Package-specific error subclasses (if applicable)
├── tests/
│   ├── setup.ts                      ← Test environment setup (PGLite, Redis mock)
│   └── <feature>.test.ts             ← Tests co-located with features
├── package.json                      ← Package manifest with exports field
├── tsconfig.json                     ← Extends ../../tsconfig.base.json
└── README.md                         ← Purpose, exports, usage examples
```

**Non-negotiable package rules:**
- `src/index.ts` is the **only** public export surface. The `exports` field in `package.json` points exclusively to the compiled output of `src/index.ts`.
- **No default exports** in shared packages. Every export is a named export.
- **No `require()`**. All source files are ESM (`import`/`export`).
- **No `any`**. Use `unknown` with type guards. If unavoidable, add an `eslint-disable-next-line` with a written justification comment.
- Every file created in `src/` has a corresponding test file in `tests/`.

***

## 3.4 `services/` Directory

Background workers are standalone Node.js processes. They are **not** Next.js applications and are **not** imported by apps. They consume feature packages from `packages/` and run as independent deployable units.

```
services/
│
├── worker-outbox-processor/          ← Polls outbox_events, dispatches to Inngest
├── worker-campaigns/                 ← Campaign step execution (email/SMS/social sends)
├── worker-crm-sync/                  ← Bidirectional CRM sync jobs
├── worker-email-delivery/            ← Email queue processing + delivery status updates
├── worker-sms-delivery/              ← SMS queue processing + delivery status updates
├── worker-reports/                   ← Scheduled report generation + email delivery
├── worker-ai-generation/             ← AI content generation queue + C2PA manifest
├── worker-data-retention/            ← GDPR erasure + PII anonymization (pg_cron driven)
├── worker-billing-events/            ← Stripe/Paddle webhooks → billing domain events
├── worker-tenant-provisioning/       ← Automated new tenant setup (< 60 seconds)
├── worker-reputation/                ← Review monitoring + AI-drafted responses
├── worker-analytics-rollup/          ← Aggregate tenant metrics (daily cron)
└── worker-social-scheduler/          ← Scheduled social post publishing
```

### Worker Internal Structure

```
services/<name>-worker/
├── src/
│   ├── index.ts                      ← Inngest client registration, worker startup
│   ├── functions/
│   │   └── <function-name>.ts        ← Individual Inngest step functions
│   └── lib/
│       └── <helper>.ts               ← Worker-specific utilities
├── tests/
│   └── <function-name>.test.ts
├── package.json
└── tsconfig.json
```

### Worker Rules

- Workers import from `packages/` feature packages only. They never import from `apps/`.
- Every worker function is an Inngest step function with explicit retry configuration and a dead-letter step.
- Workers never perform direct database writes without going through the relevant feature package's service layer. Raw Drizzle queries in workers are forbidden.
- Workers expose `/health` on a separate port for container orchestration liveness checks.
- All Inngest events emitted by workers must be registered in `@firm/api-contracts` event registry before the worker is deployed.

***

## 3.5 `infra/` Directory

```
infra/
│
├── docker/
│   ├── docker-compose.dev.yml        ← Local dev: PostgreSQL, Redis, Loki, Grafana
│   └── docker-compose.workers.yml    ← Local worker process orchestration
│
├── prometheus/
│   ├── prometheus.yml                ← Scrape targets (all platform apps + workers)
│   └── rules/
│       └── alerts.yml                ← All 7 alert rules with severity + routing
│
├── grafana/
│   └── dashboards/
│       ├── platform-overview.json    ← Health of all services
│       ├── tenant-analytics.json     ← Per-tenant resource usage + analytics
│       ├── ai-cost-tracker.json      ← AI token usage by model, task, tenant
│       ├── adapter-health.json       ← Error rates + latency per adapter provider
│       └── cicd-metrics.json         ← Build times, cache hit rate, test pass rate
│
├── loki/
│   └── loki-config.yml               ← Log retention: 30 days hot, 90 days warm
│
├── tempo/
│   └── tempo-config.yml              ← Distributed trace storage configuration
│
├── cloudflare/
│   ├── dns-records.tf                ← Terraform: tenant custom domain DNS automation
│   └── workers/
│       └── tenant-router/            ← Cloudflare Worker: edge tenant resolution
│
└── vercel/
    └── project-config/               ← Per-client Vercel project JSON definitions
```

### Infrastructure Rules

- All Grafana dashboards are version-controlled as JSON files and deployed via CI (`infra:sync` pipeline task). No dashboard is created manually in the Grafana UI — all manual changes will be overwritten on next deployment.
- Prometheus alert rules in `alerts.yml` are the single source of truth for all alerting. Changes to alert thresholds require a code review and CI validation.
- Cloudflare DNS records for tenant custom domains are managed programmatically via the Cloudflare Terraform provider. No DNS record is created manually in the Cloudflare dashboard.
- The `docker-compose.dev.yml` file provides a complete local development environment. Running `scripts/bootstrap.sh` starts all required services. A developer must be able to run the full platform locally without external service dependencies.

***

## 3.6 `scripts/` Directory

```
scripts/
│
├── bootstrap.sh                      ← Dev env setup: install deps, start Docker, run migrations
├── provision-tenant.ts               ← CLI: new tenant provisioning (< 60 seconds)
├── deprovision-tenant.ts             ← CLI: GDPR erasure + data export
│
│   ── CI Validation Scripts ──────────────────────────────────────────────
│
├── validate-rls-policies.ts          ← Asserts every tenant_id table has RLS policy
├── validate-adapters.ts              ← Asserts adapters implement firm-types interface
├── check-gha-shas.ts                 ← Asserts all GHA actions pinned to full commit SHA
├── verify-security-headers.ts        ← Asserts CSP/HSTS/noindex on all apps
├── boundary-check.ts                 ← Asserts no cross-layer imports in packages
├── flag-expiry-check.ts              ← Asserts no expired feature flags in DB
├── pii-log-check.ts                  ← Asserts no PII appears in test log output
├── sbom-generate.ts                  ← Generates CycloneDX SBOM for production builds
│
│   ── Operational Scripts ───────────────────────────────────────────────
│
├── seed-demo-tenant.ts               ← Populates local dev with realistic demo data
├── rotate-api-keys.ts                ← Rotates API keys for a given tenant
├── run-migrations.ts                 ← Runs Drizzle migrations (tenant-aware)
└── generate-env-docs.ts              ← Generates .env.example from firm-env schemas
```

### Script Rules

- All TypeScript scripts are executed via `tsx` — no compilation step required for script execution.
- CI validation scripts exit with code `1` on failure and `0` on success. They write human-readable failure messages to stdout so CI logs are actionable.
- Operational scripts (`provision-tenant.ts`, `deprovision-tenant.ts`) require explicit confirmation prompts before making irreversible changes. They log every action taken to `audit_log` in the database.
- `scripts/bootstrap.sh` is the single command to get from a fresh machine to a running local platform. It must be kept current — if bootstrap breaks, the entire team is blocked.

***

## 3.7 `docs/` Directory

```
docs/
│
├── ai-context/                       ← Machine-readable planning docs for AI agents
│   ├── 80-master.md                  ← Platform architecture overview
│   ├── 81-conventions.md             ← Monorepo conventions and project map
│   ├── 82-adapters.md                ← Adapter interfaces and contracts
│   ├── 83-schema.md                  ← Database schema and RLS policies
│   ├── 84-observability.md           ← Logging, metrics, tracing, alerting
│   ├── 85-blueprint.md               ← THIS DOCUMENT (master blueprint)
│   ├── 86-security.md                ← Security baselines and compliance
│   ├── 87-packages.md                ← Shared package inventory
│   └── 88-apps.md                    ← Application structure and deployment
│
├── stack/                            ← Technology-specific implementation guides
│   ├── database.md                   ← Drizzle, PostgreSQL, RLS, migrations
│   ├── auth.md                       ← Better Auth, Authentik, sessions, RBAC
│   ├── ai.md                         ← AI stack, C2PA compliance, token budgets
│   ├── observability.md              ← Pino, OTel, Prometheus, Grafana
│   ├── infrastructure.md             ← Server layout, Prometheus targets, Loki
│   ├── api.md                        ← tRPC, OpenAPI, webhook patterns
│   └── governance-costs.md           ← Vendor exit strategies, cost management
│
├── adrs/                             ← Architecture Decision Records
│   └── 001-monorepo-structure.md     ← Why Turborepo, why this layer model
│
├── runbooks/                         ← Operational runbooks per service
│   ├── incident-response.md
│   ├── tenant-provisioning.md
│   ├── database-recovery.md
│   └── worker-failure.md
│
└── verticals/                        ← Per-industry feature and adapter profiles
    ├── dental.json
    ├── legal.json
    ├── real-estate.json
    ├── fitness.json
    ├── home-services.json
    ├── salon.json
    ├── restaurant.json
    ├── construction.json
    ├── ecommerce.json
    ├── b2b-services.json
    └── short-term-rental.json
```

### `docs/verticals/<vertical>.json` Structure

Every vertical profile JSON file follows this schema. `worker-tenant-provisioning` reads this file at tenant creation time:

```json
{
  "vertical": "dental",
  "displayName": "Dental Practice",
  "featurePackages": [
    "firm-bookings",
    "firm-reputation",
    "firm-forms",
    "firm-notifications",
    "firm-campaigns",
    "firm-reporting"
  ],
  "adapters": [
    "adapters-vertical-dentrix",
    "adapters-reviews-healthgrades",
    "adapters-reviews-google",
    "adapters-calendar-google",
    "adapters-sms-twilio"
  ],
  "featureFlags": {
    "release/patient-recall-sequences": true,
    "release/insurance-intake-forms": false,
    "perm/hipaa-boundary-mode": true
  },
  "onboardingSteps": [
    "connect-google-business-profile",
    "import-patient-contacts",
    "configure-recall-sequences",
    "set-appointment-reminders",
    "launch-review-request-campaign"
  ],
  "complianceNotes": [
    "No PHI (Protected Health Information) may be stored in the platform",
    "HIPAA boundary: platform handles marketing data only, not clinical data",
    "BAA (Business Associate Agreement) required before activation"
  ]
}
```

***

## 3.8 Naming Conventions

These conventions are enforced by ESLint and CI. Violations fail the build.

### Directory and Package Names

| Entity | Convention | Example |
|---|---|---|
| Client app | `apps/clients/client-<slug>` (kebab-case) | `client-acme-dental` |
| Platform app | `apps/platform/platform-<name>` | `platform-booking` |
| Core package | `packages/firm-<name>` | `firm-auth` |
| Adapter package | `packages/adapters-<category>-<provider>` | `adapters-crm-hubspot` |
| Background worker | `services/<name>-worker` | `worker-campaigns` |
| npm scope | `@firm/<name>` for all packages | `@firm/auth` |

### TypeScript Naming

| Element | Convention | Example |
|---|---|---|
| React Component | PascalCase `.tsx` | `BookingWidget.tsx` |
| Hook | camelCase with `use` prefix | `useBookingSlot.ts` |
| Utility function | camelCase | `slugify.ts` |
| Server Action | camelCase with `action` suffix | `submitLeadAction.ts` |
| Zod schema | camelCase with `Schema` suffix | `leadSchema.ts` |
| Database table | snake_case | `form_submissions` |
| Database column | snake_case | `tenant_id` |
| Environment variable | `FIRM_` prefix for internal, `CLIENT_` for per-client | `FIRM_SIGNING_KEY` |
| Feature flag key | `<taxonomy>/<scope>-<description>` | `release/patient-recall` |

### Import Order (ESLint-Enforced)

```typescript
// 1. Node.js built-ins
import { randomBytes } from 'node:crypto'

// 2. External packages
import { z } from 'zod'
import { eq } from 'drizzle-orm'

// 3. @firm/* internal packages
import { TenantId } from '@firm/types'
import { db } from '@firm/db'

// 4. Absolute imports from @/ alias
import { createApiRouter } from '@/lib/api'

// 5. Relative imports
import { formatLeadName } from './utils'
```

***

## 3.9 Turborepo Pipeline Definitions

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "test:integration": {
      "dependsOn": ["^build", "db:migrate:test"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "boundary:check": {
      "dependsOn": [],
      "outputs": []
    },
    "type-check": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "db:generate": {
      "dependsOn": [],
      "outputs": ["drizzle/migrations/**"]
    },
    "db:migrate:test": {
      "dependsOn": ["db:generate"],
      "outputs": []
    },
    "infra:sync": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "tokens:build": {
      "dependsOn": [],
      "outputs": ["dist/css/**", "dist/ts/**", "dist/tailwind/**"]
    }
  }
}
```

### CI Pipeline Execution Order

```
1. lint + boundary:check + type-check  (parallel, no dependencies)
2. tokens:build                         (firm-tokens must build before UI)
3. db:generate + db:migrate:test        (migrations ready before integration tests)
4. build                                (all packages, respects dependency graph)
5. test                                 (unit tests, parallel per package)
6. test:integration                     (integration tests with live DB)
7. validate-rls-policies
   validate-adapters
   check-gha-shas
   verify-security-headers
   pii-log-check
   flag-expiry-check                    (all CI validation scripts, parallel)
8. sbom-generate                        (production builds only)
9. infra:sync                           (main branch only)
```
# Marketing Agency Mono Repository Blueprint & Assessment
## Part 4 — Layered Package Architecture

***

> **Purpose of This Part:** This part defines the complete 8-layer taxonomy that governs every import relationship, every build dependency, and every architectural decision in the repository. For AI coding agents: this is the law. Before writing any import statement, verify which layer the current package lives in and which layer the target package lives in. Upward imports are forbidden. Sideways imports across non-adjacent domains require justification. Every package specification below includes its full contract: what it imports, what imports it, what database tables it owns, what events it emits, and what "built" means.

***

## 4.1 Layer Philosophy

The layer model exists to solve one specific problem: **in a monorepo with 145 packages, unconstrained imports create a graph where changing anything breaks everything.** The layer model converts that graph into a directed acyclic hierarchy where changes propagate in one direction only — downward.

### The Three Laws of Layers

**Upward imports are forbidden.** A Layer 1 package cannot import from a Layer 3 package. A Layer 3 package cannot import from a Layer 6 package. The direction of dependency is always from higher layers importing lower layers. The compiler enforces this via the `exports` field in `package.json` and ESLint's import restriction rules.

**Sideways imports within a layer are permitted only between non-competing domains.** Two Layer 6 feature packages may import each other if one is a genuine dependency of the other (e.g., `firm-forms` importing `firm-leads` because form submissions create leads). They may not import each other for convenience or to share implementation details — shared logic belongs in a lower layer.

**Every layer boundary is an interface, not an implementation.** When Layer 6 packages import from Layer 7 adapters, they import only the interface types from `firm-types` (Layer 2). The adapter implementation in Layer 7 is resolved at runtime via dependency injection or a factory, not by direct import. This is what makes the adapter interchangeable.

### Why This Matters at 1,000 Tenants

At 1,000 clients with 80 integrations, the platform will undergo continuous change: new adapters, new feature packages, new vertical profiles. The layer model is what makes this continuous change safe. A new adapter can be added without touching any feature package. A feature package can be updated without touching any application. A Layer 0 config change propagates to everything — which is exactly what you want from a shared TypeScript config.

***

## 4.2 Layer 0 — Build & Constraint

**Objective:** Eliminate entire categories of bugs through compile-time correctness, not runtime detection. Every package in this layer produces zero runtime artifacts — it exists only to configure and constrain the packages above it.

***

### `firm-config-typescript` — `@firm/config-typescript`

**Purpose:** Single source of TypeScript compiler options for the entire repository.

**Exports:**
```typescript
createTsConfig(overrides?)           // Base config for all packages
createSharedLibraryConfig(overrides?) // Stricter config for shared packages
createAppConfig(overrides?)          // App-specific config with JSX transform
```

**Compiler options enforced across all consumers:**
```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitReturns": true,
  "exactOptionalPropertyTypes": true,
  "noFallthroughCasesInSwitch": true,
  "forceConsistentCasingInFileNames": true,
  "moduleResolution": "bundler",
  "module": "ESNext",
  "target": "ES2022"
}
```

**Why `noUncheckedIndexedAccess` matters:** Array and object index access (`arr[0]`, `obj[key]`) returns `T | undefined` rather than `T`. This prevents the entire class of "cannot read properties of undefined" runtime errors that plague JavaScript applications — the compiler forces the developer to handle the case where the index does not exist.

**Acceptance criteria for "built":** Every package and app in the repository extends from this config. `tsc --noEmit` passes on the entire workspace with zero errors.

***

### `firm-config-eslint` — `@firm/config-eslint`

**Purpose:** ESLint rule configuration that enforces layer boundaries, import ordering, code quality, and security constraints across every package.

**Rule categories enforced:**

| Rule Category | What It Prevents |
|---|---|
| Layer boundary rules | Layer 1 importing from Layer 3+; Layer 0 having any runtime imports |
| Import restrictions | Direct vendor SDK imports in Layers 0–6 |
| Import ordering | Non-standard import sequence (node → external → @firm → @/ → relative) |
| No `any` | Untyped code that bypasses TypeScript's guarantees |
| No `process.env` direct access | Bypassing validated `firm-env` modules |
| No `console.log` | Bypassing `firm-logger` structured logging |
| No default exports in packages | Inconsistent import syntax across consumers |
| No `setTimeout`/`setInterval` in feature packages | Bypassing the outbox pattern |
| Exhaustive switch statements | Unhandled enum cases in domain logic |

**Boundary rule implementation:** The boundary rules are implemented as ESLint `import/no-restricted-paths` configurations, one rule per layer boundary. When a file in `packages/firm-logger/` attempts to import from `packages/firm-auth/`, ESLint reports it as an error before the build runs.

**Acceptance criteria for "built":** `eslint --max-warnings 0` passes across the entire workspace.

***

### `firm-config-tailwind` — `@firm/config-tailwind`

**Purpose:** Shared Tailwind CSS configuration that all apps and the `firm-ui` component library extend.

**Current state:** ⚠️ **Broken** — the numeric range safelist (`p-0` through `p-99`) must be replaced before any app can hit Lighthouse 95+ targets.

**Correct safelist pattern:**
```typescript
export const sharedSafelist = [
  // White-label dynamic color classes
  { pattern: /^(bg|text|border|ring)-(brand|accent|neutral)-(50|100|200|500|700|900)$/ },
  // Dynamic spacing from CMS content
  { pattern: /^(p|m|gap|space-[xy])-(0|1|2|3|4|5|6|8|10|12|16|20|24|32)$/ },
  // Dynamic grid columns from page builder
  { pattern: /^grid-cols-(1|2|3|4|6|12)$/ },
  // Tenant theme variants
  { pattern: /^data-\[theme=.+\]:.+$/ },
]
```

**Acceptance criteria for "built":** Production CSS bundle for any app using this config is under 50KB (gzipped). Lighthouse performance score ≥ 95 on the `apps/firm-site/` homepage.

***

### `firm-tokens` — `@firm/tokens`

**Purpose:** The W3C DTCG (Design Token Community Group) specification-compliant design token pipeline. This is the single source of truth for all visual design decisions across the platform — colors, typography, spacing, radii, shadows, and motion.

**Source format:** DTCG JSON files (2025.10 stable specification)

```
firm-tokens/
├── src/
│   ├── tokens/
│   │   ├── color.tokens.json         ← Brand colors, semantic colors, neutrals
│   │   ├── typography.tokens.json    ← Font families, sizes, weights, line heights
│   │   ├── spacing.tokens.json       ← Spacing scale (4px base unit)
│   │   ├── radius.tokens.json        ← Border radius values
│   │   ├── shadow.tokens.json        ← Elevation shadows
│   │   └── motion.tokens.json        ← Animation durations, easings
│   └── themes/
│       ├── default.tokens.json       ← Agency's default theme
│       └── _tenant-override.json     ← Template for per-tenant overrides
├── style-dictionary.config.ts        ← Style Dictionary pipeline configuration
└── dist/
    ├── css/
    │   └── tokens.css                ← CSS custom properties (var(--color-brand-500))
    ├── ts/
    │   └── tokens.ts                 ← TypeScript constants (TOKENS.color.brand[500])
    └── tailwind/
        └── tokens.tailwind.ts        ← Tailwind theme extension object
```

**White-labeling mechanism:** Every component in `firm-ui` references `var(--color-brand-primary)`. Per-tenant theming is achieved by injecting a `<style>` tag in `app/layout.tsx` that overrides those variables scoped to `[data-theme="client-slug"]`. The component never receives a color as a prop and never imports a hardcoded color constant.

```css
/* dist/css/tokens.css — default theme */
:root {
  --color-brand-primary: oklch(56% 0.18 250);
  --color-brand-secondary: oklch(72% 0.12 250);
}

/* Per-tenant override injected at layout level */
[data-theme="acme-dental"] {
  --color-brand-primary: oklch(48% 0.15 220);
  --color-brand-secondary: oklch(68% 0.10 220);
}
```

**Acceptance criteria for "built":** `tokens:build` pipeline task generates all three output formats. `firm-ui` imports from `@firm/tokens/dist/tailwind/tokens.tailwind.ts` without errors. A tenant theme override visually changes brand colors without modifying any component code.

***

## 4.3 Layer 1 — Core Utilities & Environment

**Objective:** Provide the runtime foundation every other package depends on — validated configuration, structured logging, cryptographic primitives, error vocabulary, and cross-async context propagation. Nothing in this layer has domain knowledge. Nothing knows about tenants, users, or business logic.

***

### `firm-env` — `@firm/env`

**Purpose:** Validated environment configuration using `@t3-oss/env-nextjs`. Throws at application startup if any required variable is missing or incorrectly typed — never at runtime.

**Exports:**
```typescript
databaseEnv      // DATABASE_URL, DIRECT_URL, MAX_CONNECTIONS
redisEnv         // REDIS_URL, REDIS_TOKEN (Upstash)
authEnv          // AUTH_SECRET, AUTH_API_KEY_SECRET, AUTHENTIK_CLIENT_ID/SECRET
platformEnv      // FIRM_SIGNING_KEY, FIRM_WEBHOOK_SECRET, NODE_ENV, BASE_URL
```

**Already complete.** No known defects. The only gap is that `authEnv.AUTH_API_KEY_SECRET` is not yet consumed by `hashApiKey()` (see Part 2, Issue #3).

***

### `firm-logger` — `@firm/logger`

**Purpose:** Pino-based structured JSON logging with mandatory PII redaction, `firm-request-context` integration, and child logger factory for per-package logging namespaces.

**Exports:**
```typescript
createLogger(namespace: string): Logger
logger: Logger                          // Root logger instance
type LogContext = { tenantId?, userId?, correlationId?, traceId?, spanId? }
```

**Required log fields on every log line:**

| Field | Source | Always Present? |
|---|---|---|
| `level` | Pino | ✅ Yes |
| `timestamp` | Pino | ✅ Yes |
| `namespace` | `createLogger(namespace)` | ✅ Yes |
| `correlationId` | `firm-request-context` | ✅ Yes (generated if absent) |
| `tenantId` | `firm-request-context` | ✅ In request scope |
| `traceId` | OTel span context | ✅ When tracing active |
| `spanId` | OTel span context | ✅ When tracing active |

**PII redaction configuration:**
```typescript
redact: {
  paths: [
    'email', '*.email', 'password', '*.password',
    'token', '*.token', 'apiKey', '*.apiKey',
    'phone', '*.phone', 'ssn', '*.ssn',
    'creditCard', '*.creditCard', '*.authorization',
  ],
  censor: '[REDACTED]'
}
```

**Acceptance criteria for "built":** `scripts/pii-log-check.ts` passes — no email, phone, or token strings appear in test log output. Child loggers inherit parent context. Loki shipping works in production mode.

***

### `firm-crypto` — `@firm/crypto`

**Purpose:** Centralized cryptographic primitives. Every package that needs HMAC computation, timing-safe comparison, or secure token generation imports from here. No package reimplements these independently.

**Exports:**
```typescript
hmacSha256(message: string, secret: string): string
timingSafeEqual(a: string, b: string): boolean
generateSecureToken(byteLength?: number): string    // Default 32 bytes
generateApiKeyPair(): { key: string; prefix: string; hash: string }
hashApiKey(key: string, secret: string): string
deepFreeze<T>(obj: T): Readonly<T>
constantTimeStringCompare(a: string, b: string): boolean
```

**Why `timingSafeEqual` matters:** Standard string comparison (`a === b`) short-circuits on the first character mismatch. An attacker can time hundreds of requests with varying API keys or webhook signatures to determine character-by-character what the correct value is. `timingSafeEqual` always takes the same amount of time regardless of where the mismatch occurs, defeating timing attacks.

**Consumers:** `firm-auth` (API key hashing, CSRF tokens), every `adapters-*` package that receives webhooks (signature verification), `firm-security` (audit log signing).

**Acceptance criteria for "built":** All HMAC and comparison functions have timing attack tests verifying constant-time behavior. `firm-auth`'s `hashApiKey()` is refactored to use this package.

***

### `firm-request-context` — `@firm/request-context`

**Purpose:** `AsyncLocalStorage`-based context propagation. Provides ambient access to `tenantId`, `userId`, `correlationId`, `traceId`, and `spanId` across all asynchronous boundaries without threading context through function arguments.

**Canonical implementation (standalone functions — class-based pattern deprecated):**

```typescript
// The single AsyncLocalStorage instance — the entire platform shares this one store
const store = new AsyncLocalStorage<RequestContext>()

export interface RequestContext {
  tenantId: TenantId
  userId?: UserId
  correlationId: string
  traceId?: string
  spanId?: string
  ipAddress?: string
  userAgent?: string
}

export function runWithContext<T>(
  context: RequestContext,
  fn: () => T
): T

export function getCurrentContext(): RequestContext | undefined

export function requireContext(): RequestContext  // Throws if no context

export function getTenantId(): TenantId          // Throws if no context or tenantId

export function withCorrelationId<T>(fn: () => T): T  // Generates correlationId if absent
```

**Usage in Next.js App Router:**
```typescript
// In middleware.ts — context is set once at the request boundary
export async function middleware(request: NextRequest) {
  return runWithContext({
    tenantId: await resolveTenantFromHost(request.headers.get('host')),
    correlationId: request.headers.get('x-correlation-id') ?? generateSecureToken(16),
  }, () => NextResponse.next())
}
```

**Acceptance criteria for "built":** A single `AsyncLocalStorage` instance backs all exports. Context survives `await`, `Promise.all`, and Inngest step boundaries. The deprecated `UnifiedRequestContextManager` class is removed from `src/index.ts`.

***

## 4.4 Layer 2 — Data & Contracts

**Objective:** Define the complete shape of all data and the complete surface of all APIs. This is the interface freeze layer. No package in Layers 3–7 should be built until this layer's contracts are locked, because every downstream package depends on these shapes.

***

### `firm-types` — `@firm/types`

**Purpose:** Branded ID types, string literal enums, domain entity interfaces, and adapter interfaces. The vocabulary layer for the entire platform.

**Conceptual split within one physical package:**

*Layer 0 vocabulary (zero domain knowledge):*
```typescript
// Branded IDs — prevent passing a UserId where TenantId is expected
export type TenantId = string & { readonly __brand: 'TenantId' }
export type UserId = string & { readonly __brand: 'UserId' }
export type LeadId = string & { readonly __brand: 'LeadId' }
// ... all domain entity ID types

// Pure enums
export enum LeadStatus { New, Contacted, Qualified, Lost, Won }
export enum BookingStatus { Pending, Confirmed, Completed, Cancelled, NoShow }
export enum CampaignStatus { Draft, Scheduled, Active, Paused, Completed }
// ... all domain enums

// Helper types
export type Paginated<T> = { data: T[]; nextCursor: string | null; total: number }
export type TenantScoped<T> = T & { tenantId: TenantId }
export type Timestamped<T> = T & { createdAt: Date; updatedAt: Date }
```

*Layer 2 domain entities (full domain knowledge):*
```typescript
export interface Lead extends TenantScoped<{}>, Timestamped<{}> {
  id: LeadId
  firstName: string
  lastName: string
  email: string
  phone?: string
  status: LeadStatus
  score: number
  assignedUserId?: UserId
  sourceFormId?: FormId
  sourceCampaignId?: CampaignId
  customFields: Record<string, unknown>
}

// Adapter interfaces — implemented by Layer 7 adapter packages
export interface CRMAdapter {
  syncContact(tenantId: TenantId, lead: Lead): Promise<CRMSyncResult>
  fetchContacts(tenantId: TenantId, cursor?: string): Promise<Paginated<Lead>>
  deleteContact(tenantId: TenantId, externalId: string): Promise<void>
  testConnection(tenantId: TenantId): Promise<{ ok: boolean; error?: string }>
}

export interface EmailAdapter {
  sendEmail(tenantId: TenantId, payload: EmailPayload): Promise<EmailSendResult>
  getBounces(tenantId: TenantId, since: Date): Promise<EmailAddress[]>
  unsubscribe(tenantId: TenantId, email: EmailAddress): Promise<void>
  testConnection(tenantId: TenantId): Promise<{ ok: boolean; error?: string }>
}
// ... all 23 adapter interfaces
```

***

### `firm-validators` — `@firm/validators`

**Purpose:** Zod v4 schemas for all domain entities. The canonical runtime validation layer. `firm-api-contracts` imports from here. Feature packages import from here. Nobody defines their own Zod schema for a domain entity.

**Exports (examples):**
```typescript
export const leadSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  status: z.nativeEnum(LeadStatus),
  score: z.number().int().min(0).max(100).default(0),
  customFields: z.record(z.string(), z.unknown()).default({}),
})

export const createLeadSchema = leadSchema.omit({ id: true, createdAt: true, updatedAt: true })
export const updateLeadSchema = createLeadSchema.partial()
export const leadIdSchema = z.string().brand<'LeadId'>()

// Reusable sub-schemas
export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
})

export const tenantContextSchema = z.object({
  tenantId: z.string().brand<'TenantId'>(),
})
```

**Rule:** Every tRPC procedure input and every OpenAPI request body uses a schema from `firm-validators`. No schema is defined inline in a router or handler. This is what resolves the Lead/Form/Booking schema divergence identified in Part 2, Issue #9.

***

### `firm-api-contracts` — `@firm/api-contracts`

**Purpose:** tRPC router type definitions, OpenAPI 3.1 specification, and the Inngest CloudEvents event registry. All three import from `firm-validators` for their schemas.

**Structure:**
```
firm-api-contracts/src/
├── trpc/
│   ├── leads.ts                      ← Lead procedures (CRUD + sync)
│   ├── forms.ts                      ← Form procedures
│   ├── bookings.ts                   ← Booking procedures
│   └── index.ts                      ← AppRouter type export
├── openapi/
│   ├── spec.ts                       ← OpenAPI 3.1 spec builder
│   └── paths/                        ← One file per resource
└── events/
    ├── registry.ts                   ← defineEvent, createTypedEvent, validateEvent
    ├── lead.events.ts                ← LeadCreatedEvent, LeadSyncedEvent, etc.
    ├── booking.events.ts
    ├── campaign.events.ts
    ├── ai.events.ts
    └── tenant.events.ts
```

**Event registry pattern:**
```typescript
export const LeadCreatedEvent = defineEvent({
  name: 'firm/lead.created',
  schema: z.object({
    tenantId: tenantContextSchema.shape.tenantId,
    leadId: leadIdSchema,
    sourceFormId: z.string().optional(),
    sourceCampaignId: z.string().optional(),
  }),
})

// Every outbox_events row references a registered event name
// CI rejects any outbox_events.event_name not in the registry
```

***

### `firm-db` — `@firm/db`

**Purpose:** Drizzle ORM schema, database client factory, RLS enforcement helpers, cursor-based pagination, and migration runner.

**Key exports:**
```typescript
createDatabaseClient(config: DatabaseConfig): DrizzleClient
setTenantContext(db: DrizzleClient, tenantId: TenantId): Promise<void>
withTenantContext<T>(tenantId: TenantId, fn: (db) => Promise<T>): Promise<T>
cursorPaginate<T>(query, cursor?, limit?): Promise<Paginated<T>>
```

**RLS enforcement pattern:**
```typescript
// Every database operation in the platform uses this pattern
export async function withTenantContext<T>(
  tenantId: TenantId,
  fn: (db: DrizzleClient) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    // Set tenant context for RLS — applies to ALL queries in this transaction
    await tx.execute(
      sql`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`
    )
    return fn(tx)
  })
}
```

**RLS policy template (applied to every tenant-scoped table):**
```sql
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY leads_tenant_isolation ON leads
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

**Core schema tables owned by `firm-db`:**

| Table | Purpose | RLS Required |
|---|---|---|
| `tenants` | All tenant records + config | ❌ (no tenant_id — this IS the tenant) |
| `users` | Platform users | ✅ |
| `sessions` | Auth sessions | ✅ |
| `api_keys` | API key records | ✅ |
| `audit_log` | Immutable audit trail | ✅ |
| `outbox_events` | Transactional outbox | ✅ |
| `feature_flags` | Per-tenant flag overrides | ✅ |
| `consent_records` | GDPR consent audit trail | ✅ |
| `ai_generation_log` | AI usage + C2PA manifests | ✅ |

**Acceptance criteria for "built":** Migration files committed and passing. `scripts/validate-rls-policies.ts` passes for all tables. Integration tests using PGLite cover `withTenantContext` cross-tenant isolation (attempting to read another tenant's data returns zero rows, not an error).

***

### `firm-cache` — `@firm/cache`

**Purpose:** Redis-backed `TenantCache` with automatic `tenantId` key namespacing, session store adapter, pub/sub channels, and in-memory fallback for testing.

**Exports:**
```typescript
export class TenantCache {
  constructor(tenantId: TenantId, redis: Redis) {}

  async get<T>(key: string): Promise<T | null>
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void>
  async del(key: string): Promise<void>
  async increment(key: string, by?: number): Promise<number>    // For token budget counters
  async atomicIncrement(key: string, limit: number): Promise<{ allowed: boolean; current: number }>
}

export function createSessionStore(redis: Redis): SessionStore
export function createPubSub(redis: Redis): PubSubChannel
export function createTestCache(): TenantCache    // In-memory, no Redis required
```

**Key namespacing:** Every cache key stored by `TenantCache` is automatically prefixed: `tenant:{tenantId}:{key}`. This prevents cross-tenant cache pollution even if the Redis instance is shared. A `TenantCache` instance for tenant A physically cannot read a key stored by tenant B.

**AI token budget pattern:**
```typescript
// In firm-ai — before every AI generation call
const budget = await tenantCache.atomicIncrement(
  `ai:tokens:${model}:${billingPeriod}`,
  tokensRequested
)
if (!budget.allowed) {
  throw new AIBudgetExhaustedError(tenantId, model, budget.current)
}
```

***

## 4.5 Layer 3 — Identity, Security & Consent

**Objective:** Every request is authenticated, every action is authorized, every consent state is enforced, and every security-relevant event is logged immutably. No feature package bypasses this layer.

***

### `firm-auth` — `@firm/auth`

**Purpose:** Complete authentication and authorization system built on Better Auth with Authentik OIDC integration.

**Complete feature surface:**

| Feature | Status | Notes |
|---|---|---|
| Session management | ✅ Built | Encrypted cookies, Redis session store |
| Email/password auth | ✅ Built | With bcrypt hashing |
| Magic link auth | ✅ Built | 15-minute expiry |
| OIDC (Authentik) | ✅ Built | Enterprise SSO via Authentik |
| MFA (TOTP) | ✅ Built | Authenticator app support |
| RBAC | ✅ Built | 6 roles × full permission matrix |
| API key management | ✅ Built | Generation, hashing, masking, revocation |
| API key **authentication** | 🔴 Stub | Must be implemented (see Part 2, Issue #2) |
| Impersonation (TOCTOU-safe) | ✅ Built | Agency staff can act as client |
| Delegation | ✅ Built | Time-limited permission grants |
| `startImpersonationLegacy` | 🔴 Must remove | Exported insecure function |

**RBAC Permission Matrix:**

| Permission Domain | superadmin | tenantadmin | manager | agent | user | readonly |
|---|---|---|---|---|---|---|
| leads:create | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| leads:read | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| leads:update | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| leads:delete | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| campaigns:manage | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| bookings:manage | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| analytics:read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| settings:manage | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| users:manage | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| billing:manage | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| ai:generate | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| tenants:manage | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

***

### `firm-security` — `@firm/security`

**Purpose:** Audit logging, C2PA manifest generation, CSP enforcement, CSRF protection, and the security audit trail.

**Key exports:**
```typescript
// Immutable audit trail — every security-relevant action logged
export class SecurityAuditLogger {
  async log(event: AuditEvent): Promise<void>
  async query(tenantId: TenantId, filters: AuditFilters): Promise<AuditEvent[]>
}

// EU AI Act compliance
export async function generateC2PAManifest(params: {
  tenantId: TenantId
  model: string
  task: AITask
  contentHash: string
  generatedAt: Date
}): Promise<C2PAManifest>

// CSRF protection
export function generateCSRFToken(sessionId: string): string
export function validateCSRFToken(token: string, sessionId: string): boolean

// Content Security Policy
export function generateCSPNonce(): string
export function buildCSPHeader(nonce: string, tenantConfig: TenantCSPConfig): string
```

**C2PA manifest structure:**
```typescript
interface C2PAManifest {
  '@context': 'https://c2pa.org/v2'
  claim: {
    generator: 'firm-platform'
    model: string                        // e.g. 'claude-sonnet-4-5'
    task: string                         // e.g. 'blog-post-generation'
    tenantId: string
    contentHash: string                  // SHA-256 of generated content
    generatedAt: string                  // ISO 8601
    disclosureRequired: true             // EU AI Act Article 50
  }
}
```

**Current defect:** The `SecurityAuditLogger`'s remote sink sends to `console.log`. Must be replaced with an HTTP transport to Loki using the `firm-logger` Pino transport.

***

### `firm-rate-limiter` — `@firm/rate-limiter`

**Purpose:** Sliding window and token bucket rate limiting with per-tenant, per-user, per-API-key, and per-IP scopes. Consumed by all apps as Next.js middleware and by individual route handlers for resource-specific limits.

**Exports:**
```typescript
export function createRateLimiter(config: RateLimiterConfig): RateLimiter

export interface RateLimiterConfig {
  scope: 'tenant' | 'user' | 'apiKey' | 'ip'
  algorithm: 'sliding-window' | 'token-bucket'
  limit: number
  windowSeconds: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  retryAfterSeconds?: number
}

// Middleware factory for Next.js
export function rateLimitMiddleware(
  config: RateLimiterConfig
): (req: NextRequest) => Promise<NextResponse | void>
```

**Standard limits:**

| Resource | Scope | Limit | Window |
|---|---|---|---|
| API (authenticated) | Per user | 1,000 req | 1 minute |
| API (API key) | Per key | 500 req | 1 minute |
| Form submissions | Per IP | 10 req | 1 hour |
| Auth attempts | Per IP | 5 req | 15 minutes |
| AI generation | Per tenant | Configured budget | Billing period |
| Webhook inbound | Per provider | 10,000 req | 1 hour |

***

### `firm-consent` — `@firm/consent`

**Purpose:** GDPR/CCPA consent enforcement, Google Consent Mode v3, GPC (Global Privacy Control) header detection, and consent record persistence. **Three of four active legal deadlines require this package.**

**Exports:**
```typescript
// Core consent check — called by email, analytics, ads adapters
export async function hasConsent(
  tenantId: TenantId,
  userId: UserId | null,
  ipAddress: string,
  consentType: ConsentType
): Promise<boolean>

export type ConsentType =
  | 'analytics_storage'      // GA4, PostHog, Umami
  | 'ad_storage'             // Google Ads, Meta Pixel
  | 'ad_user_data'           // Google Consent Mode v3
  | 'ad_personalization'     // Remarketing
  | 'email_tracking'         // Email open/click pixels
  | 'functional'             // Non-essential features

// Google Consent Mode v3 signal dispatch
export function dispatchConsentSignals(signals: ConsentSignals): void

// GPC header detection — if Sec-GPC: 1, all non-essential tracking is off
export function detectGPC(request: Request): boolean

// Consent banner state management
export function getConsentBannerState(
  tenantId: TenantId,
  userId: UserId | null
): Promise<ConsentBannerState>

export function recordConsent(
  tenantId: TenantId,
  userId: UserId | null,
  signals: ConsentSignals,
  ipAddress: string,
  userAgent: string
): Promise<void>
```

**Compliance enforcement paths:**

```
Request arrives
       │
       ▼
detectGPC(request)
  IF Sec-GPC: 1 → ALL non-essential tracking OFF, no banner needed
       │
       ▼ (if no GPC signal)
getConsentBannerState(tenantId, userId)
  IF 'pending' → Show consent banner, block all non-essential scripts
  IF 'accepted' → Check individual signal consents
  IF 'rejected' → All non-essential tracking OFF
       │
       ▼ (on script load / pixel fire / email open)
hasConsent(tenantId, userId, ip, consentType)
  IF false → Silently suppress the operation
  IF true → Allow the operation to proceed
```

***

## 4.6 Layer 4 — Observability & Health

**Objective:** Every failure is visible before a client notices it. Every performance regression is measured before it ships. Every tenant has a health story.

***

### `firm-observability` — `@firm/observability`

**Purpose:** OpenTelemetry SDK initialization, trace-log correlation, Prometheus metric registration, and span helper utilities.

**Trace-log correlation mechanism:**
```typescript
// firm-observability wraps firm-logger's serializer to inject trace context
// When a span is active, every log line carries traceId and spanId
// In Grafana: click a log line → jump to the Tempo trace
export function initObservability(config: ObservabilityConfig): void

export function createSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes?: SpanAttributes
): Promise<T>

export const metrics = {
  // Per-adapter required metrics
  adapterOperationDuration: new Histogram({...}),
  adapterErrors: new Counter({...}),
  // Per-AI required metrics
  aiTokensUsed: new Counter({ labelNames: ['tenant_id', 'model', 'task'] }),
  // Per-tenant resource metrics
  tenantRequestDuration: new Histogram({ labelNames: ['tenant_id', 'route'] }),
}
```

***

### `firm-health` — `@firm/health`

**Purpose:** Standardized liveness and readiness health check factory for all applications and workers.

**Exports:**
```typescript
export function createHealthRouter(checkers: HealthChecker[]): Router

export interface HealthChecker {
  name: string
  check(): Promise<{ ok: boolean; latencyMs: number; error?: string }>
}

// Standard checkers
export const databaseHealthChecker: HealthChecker
export const redisHealthChecker: HealthChecker
export const queueDepthChecker: HealthChecker
```

**Response shape (all apps return this from `GET /api/health`):**
```json
{
  "status": "healthy",
  "timestamp": "2026-05-12T19:00:00.000Z",
  "version": "1.0.0",
  "checks": {
    "database": { "ok": true, "latencyMs": 3 },
    "redis": { "ok": true, "latencyMs": 1 },
    "queue": { "ok": true, "depth": 42 }
  }
}
```

***

## 4.7 Layer 5 — UI, Theming & Configuration

**Objective:** Provide the visual and configuration layer that all 20+ platform applications consume. Must be built after `firm-tokens` and before any app construction begins.

***

### `firm-ui` — `@firm/ui`

**Purpose:** Radix UI-based component library styled with design tokens from `firm-tokens`. All components are accessible (WCAG 2.1 AA), white-label capable, and server-component friendly.

**Component categories:**

| Category | Components |
|---|---|
| Layout | `Shell`, `Sidebar`, `TopNav`, `PageHeader`, `Container`, `Grid` |
| Forms | `Input`, `Select`, `Checkbox`, `Radio`, `Textarea`, `DatePicker`, `FileUpload` |
| Feedback | `Toast`, `Alert`, `Badge`, `Progress`, `Skeleton`, `Spinner` |
| Data | `Table`, `DataGrid`, `Pagination`, `Card`, `Stat`, `Chart` |
| Overlays | `Dialog`, `Sheet`, `Tooltip`, `Popover`, `DropdownMenu` |
| Navigation | `Tabs`, `Breadcrumbs`, `CommandPalette`, `StepIndicator` |
| Marketing | `Hero`, `FeatureGrid`, `TestimonialCard`, `PricingTable` |

**Storybook** is maintained as the component development environment. Every component has at least one story per variant. Chromatic visual regression testing runs on every PR.

**Rule:** Every `firm-ui` component accepts a `data-testid` prop for end-to-end test targeting. No exception.

***

### `firm-config` — `@firm/config`

**Purpose:** Tenant configuration resolution — reads tenant settings from the database and cache, exposes a typed `TenantConfig` object to all consuming apps and feature packages.

**Exports:**
```typescript
export async function getTenantConfig(tenantId: TenantId): Promise<TenantConfig>

export interface TenantConfig {
  tenantId: TenantId
  slug: string
  name: string
  domain: string
  theme: TenantTheme             // Resolved token overrides
  features: EnabledFeatures      // Which feature packages are active
  limits: TenantLimits           // Seats, storage, AI tokens, API calls
  integrations: ActiveAdapters   // Which adapters are connected + credentials
  compliance: ComplianceProfile  // Vertical-specific compliance flags
  billing: BillingConfig         // Current plan, subscription status
}
```

***

## 4.8 Layer 6 — Feature Packages

**Objective:** Implement all business capabilities. This is where the agency's product value lives. Every package owns its database tables, emits its domain events, and exposes its API surface through `firm-api-contracts`.

The complete Layer 6 specification is extensive. Each package entry follows this format:

### Package Specification Format

```
Package:     @firm/<name>
Layer:       6
Purpose:     [Single sentence]
Imports:     [Layer packages consumed]
Imported by: [Apps and packages that depend on this]
DB Tables:   [Tables owned and managed by this package]
Events:      [Events emitted to the outbox registry]
Done when:   [Acceptance criteria]
```

***

### `firm-background-jobs` — `@firm/background-jobs`

```
Purpose:     Inngest v4 wrapper with typed job dispatch, step function factories,
             and dead-letter handling for all async platform operations.
Imports:     @firm/env, @firm/logger, @firm/api-contracts (event registry)
Imported by: Every Layer 6 feature package that performs async operations
DB Tables:   None (Inngest manages its own state)
Events:      All events in the registry are dispatched through this package
Done when:   sendEvent(), createStepFunction(), and createScheduledJob() are
             typed against the event registry. Dead-letter sink logs to
             firm-logger + alerts via Prometheus counter. Inngest Dev Server
             runs locally via docker-compose.dev.yml.
```

***

### `firm-leads` — `@firm/leads`

```
Purpose:     Lead lifecycle management: creation, scoring, deduplication,
             enrichment hooks, assignment routing, and pipeline stage management.
Imports:     @firm/db, @firm/validators, @firm/background-jobs, @firm/logger,
             @firm/errors, @firm/types
Imported by: @firm/forms, @firm/campaigns, @firm/crm, platform-crm app
DB Tables:   leads, lead_activities, lead_pipeline_stages, lead_assignments,
             lead_scores, crm_sync_jobs
Events:      firm/lead.created, firm/lead.updated, firm/lead.assigned,
             firm/lead.stage-changed, firm/lead.synced
Done when:   CRUD operations work with full tenant isolation. Lead scoring
             algorithm assigns 0-100 based on configurable field weights.
             Deduplication prevents duplicate leads by email within tenant.
             Round-robin assignment routes new leads to agents. All operations
             use withTenantContext(). Integration tests use PGLite.
```

***

### `firm-forms` — `@firm/forms`

```
Purpose:     Schema-driven form builder, Turnstile CAPTCHA integration,
             UTM capture, submission processing, and consent recording.
Imports:     @firm/db, @firm/validators, @firm/leads, @firm/consent,
             @firm/security (CSRF), @firm/background-jobs, @firm/logger
Imported by: All client sites (form embed), platform-forms app
DB Tables:   forms, form_fields, form_submissions, form_analytics
Events:      firm/form.submitted, firm/form.lead-created
Done when:   Dynamic form schemas render correctly client-side. Turnstile
             passes before submission processing. CSRF token validated.
             UTM params captured from URL and stored on submission. Consent
             recorded in consent_records before lead is created. Submission
             enqueues lead.created outbox event.
```

***

### `firm-campaigns` — `@firm/campaigns`

```
Purpose:     Multi-channel campaign builder: email sequences, SMS sequences,
             social campaigns, A/B testing, audience segmentation,
             and step-level performance analytics.
Imports:     @firm/db, @firm/leads, @firm/background-jobs, @firm/validators,
             @firm/features (A/B flags), @firm/observability
Imported by: platform-campaigns app, worker-campaigns
DB Tables:   campaigns, campaign_steps, campaign_enrollments,
             campaign_analytics, ab_test_variants, audience_segments
Events:      firm/campaign.started, firm/campaign.step-completed,
             firm/campaign.completed, firm/lead.campaign-enrolled
Done when:   Email + SMS step types execute via outbox pattern. A/B variant
             assignment is deterministic per lead. Audience segments filter
             leads correctly. Campaign analytics record open/click/unsubscribe
             at step level. Re-enrollment prevention works (a lead cannot
             be enrolled in the same campaign twice simultaneously).
```

***

### `firm-ai` — `@firm/ai`

```
Purpose:     AI orchestration layer: model routing via adapter interfaces,
             per-tenant token budget enforcement via Redis atomic counters,
             C2PA manifest generation after every generation,
             and Arcjet prompt injection detection.
Imports:     @firm/cache (token counters), @firm/security (C2PA),
             @firm/db (ai_generation_log), @firm/logger, @firm/types
             (AIAdapter interface), @firm/background-jobs
Imported by: @firm/ai-content, @firm/ai-brand-voice, @firm/ai-seo,
             @firm/ai-chat, platform-content
DB Tables:   ai_generation_log (task, model, tokens_input, tokens_output,
             cost_usd, c2pa_manifest, tenant_id)
Events:      firm/ai.generation-completed, firm/ai.budget-exhausted,
             firm/ai.budget-warning (at 80%)
Done when:   Token budget check is atomic (Redis INCR + check). AI
             generation is blocked when budget is exhausted. C2PA manifest
             generated and stored for every generation. Arcjet scan runs
             before prompt is sent to model. ai_tokens_used_total Prometheus
             metric incremented per generation labeled by tenant/model/task.
             Grafana AI cost tracker dashboard shows live data.
```

***

### `firm-tenancy` — `@firm/tenancy`

```
Purpose:     Tenant lifecycle: provisioning, limits enforcement, suspension,
             GDPR data erasure, and tenant configuration management.
Imports:     @firm/db, @firm/cache, @firm/logger, @firm/background-jobs,
             @firm/security (audit log), @firm/features
Imported by: worker-tenant-provisioning, platform-admin, @firm/white-label
DB Tables:   tenants, tenant_limits, tenant_usage_metrics,
             tenant_provisioning_log, gdpr_erasure_requests
Events:      firm/tenant.provisioned, firm/tenant.suspended,
             firm/tenant.gdpr-erasure-requested, firm/tenant.deleted
Done when:   New tenant provisioned in < 60 seconds end-to-end.
             Usage limits enforced (seats, storage quota, AI tokens,
             API calls). GDPR erasure two-phase: immediate PII anonymization,
             scheduled hard delete after retention window. Suspension
             immediately revokes all sessions for tenant users.
```

***

### Remaining Layer 6 Packages — Summary Specifications

| Package | DB Tables Owned | Key Events Emitted | Critical Dependency |
|---|---|---|---|
| `firm-notifications` | `notifications`, `notification_preferences` | `firm/notification.sent` | `firm-email`, `firm-sms` |
| `firm-webhooks` | `webhook_endpoints`, `webhook_delivery_log` | `firm/webhook.delivered`, `firm/webhook.failed` | `firm-crypto` (signing) |
| `firm-storage` | `file_storage_records`, `storage_quotas` | `firm/file.uploaded`, `firm/file.deleted` | `adapters-storage-*` |
| `firm-media` | `media_assets`, `media_transforms` | `firm/media.processed` | `firm-storage` |
| `firm-features` | `feature_flags`, `flag_overrides` | None | `firm-cache` |
| `firm-search` | `search_indexes` (pgvector) | `firm/search.indexed` | `firm-db` (vector) |
| `firm-i18n` | `translations` | None | `firm-db` |
| `firm-sdk` | None (published npm package) | None | `@firm/api-contracts` |
| `firm-payments` | `subscriptions`, `invoices`, `payment_events` | `firm/payment.succeeded`, `firm/subscription.cancelled` | `adapters-billing-stripe` |
| `firm-bookings` | `bookings`, `availability_rules`, `calendar_integrations` | `firm/booking.created`, `firm/booking.cancelled` | `firm-notifications` |
| `firm-reporting` | `analytics_reports`, `report_schedules` | `firm/report.generated`, `firm/report.delivered` | `firm-analytics`, `firm-storage` |
| `firm-cms` | `cms_content`, `content_versions` | `firm/content.published` | `firm-storage` |
| `firm-landing-pages` | `landing_pages`, `page_versions` | `firm/page.published` | `firm-cms`, `firm-forms` |
| `firm-funnels` | `funnels`, `funnel_steps`, `funnel_visits` | `firm/funnel.step-completed`, `firm/funnel.converted` | `firm-forms`, `firm-analytics` |
| `firm-social` | `social_posts`, `social_accounts`, `social_analytics` | `firm/social.post-published` | `adapters-social-*` |
| `firm-reputation` | `review_requests`, `reviews`, `gbp_listings` | `firm/review.received`, `firm/review.responded` | `adapters-reviews-*` |
| `firm-ads` | `ad_campaigns`, `ad_accounts`, `ad_performance` | `firm/ads.synced` | `adapters-ads-*` |
| `firm-ai-content` | `ai_content_drafts` | `firm/ai-content.generated` | `firm-ai`, `firm-cms` |
| `firm-ai-brand-voice` | `brand_voice_profiles` | None | `firm-ai`, `firm-db` |
| `firm-ai-seo` | `seo_briefs`, `keyword_clusters` | `firm/ai-seo.brief-generated` | `firm-ai`, `adapters-seo-*` |
| `firm-white-label` | `custom_domains`, `ssl_certificates`, `brand_configs` | `firm/domain.provisioned` | `firm-tenancy`, `firm-tokens` |
| `firm-onboarding` | `onboarding_progress`, `onboarding_steps` | `firm/onboarding.step-completed`, `firm/onboarding.completed` | `firm-tenancy`, `firm-email` |

***

## 4.9 Layer 7 — Adapters

**Objective:** Provide the only sanctioned point of contact between the platform and every external service. Every adapter implements a `firm-types` interface. Every adapter emits two Prometheus metrics. Every adapter that receives webhooks implements the three-function security contract.

### Universal Adapter Requirements

Every adapter package, regardless of category, must implement these five requirements:

**1. Interface Compliance**
```typescript
// The adapter class implements the interface from @firm/types
export class ResendEmailAdapter implements EmailAdapter {
  async sendEmail(tenantId: TenantId, payload: EmailPayload): Promise<EmailSendResult>
  async getBounces(tenantId: TenantId, since: Date): Promise<EmailAddress[]>
  async unsubscribe(tenantId: TenantId, email: EmailAddress): Promise<void>
  async testConnection(tenantId: TenantId): Promise<{ ok: boolean; error?: string }>
}
```

**2. Prometheus Metrics (both required)**
```typescript
adapterOperationDuration.observe(
  { adapter: 'resend', operation: 'sendEmail', tenant_id: tenantId },
  durationSeconds
)
adapterErrors.inc(
  { adapter: 'resend', operation: 'sendEmail', error_type: 'rate_limit' }
)
```

**3. Webhook Security Contract (if the provider sends webhooks)**
```typescript
// Step 1: Verify signature — ALWAYS use firm-crypto timingSafeEqual
verifyWebhookSignature(rawBody: Buffer, signature: string, secret: string): boolean

// Step 2: Prevent replay — reject events older than 5 minutes
preventReplay(timestamp: number): void  // Throws if > 300 seconds old

// Step 3: Enforce idempotency — database unique constraint on event ID
enforceIdempotency(eventId: string, tenantId: TenantId): Promise<boolean>
```

**4. Structured Logging**
```typescript
// Every adapter operation logs with the adapter namespace
const logger = createLogger('adapters:resend')
logger.info({ tenantId, operation: 'sendEmail', messageId }, 'Email sent')
```

**5. `testConnection()` required on every adapter**
The `platform-admin` superadmin app calls `testConnection()` to verify adapter health for all 1,000 tenants' active integrations. This populates the "Adapter health" Grafana dashboard.

### Adapter Categories and Priority

| Priority | Category | Reason |
|---|---|---|
| P1 | `adapters-billing-stripe` | Blocks `firm-payments`; platform cannot charge clients |
| P1 | `adapters-email-resend` | Blocks `firm-email`; platform cannot send any emails |
| P1 | `adapters-storage-r2` | Blocks `firm-storage`; no file storage |
| P2 | `adapters-crm-gohighlevel` | Largest existing agency client base |
| P2 | `adapters-analytics-ga4` | Required for first client reports |
| P2 | `adapters-ads-google` + `adapters-ads-meta` | Core reporting data sources |
| P2 | `adapters-reviews-google` | High demand; Google Business Profile |
| P2 | `adapters-sms-twilio` | Campaign SMS delivery |
| P3 | `adapters-ai-anthropic` + `adapters-ai-openai` | AI feature layer |
| P3 | `adapters-social-meta` + `adapters-social-linkedin` | Social scheduling |
| P3 | `adapters-crm-hubspot` + `adapters-crm-salesforce` | B2B vertical clients |
| P4+ | All remaining | Build as specific client verticals are onboarded |

***

## 4.10 Cross-Cutting Enforcement Mechanisms

All nine enforcement mechanisms, their CI trigger, and what they protect:

| # | Mechanism | CI Script | Protects |
|---|---|---|---|
| 1 | Layer boundary enforcement | `boundary-check.ts` | No upward imports; no vendor SDKs in Layers 0–6 |
| 2 | RLS policy coverage | `validate-rls-policies.ts` | Every `tenant_id` table has a RLS policy |
| 3 | Adapter interface compliance | `validate-adapters.ts` | Every adapter implements its `firm-types` interface |
| 4 | GHA SHA pinning | `check-gha-shas.ts` | No unpinned GHA actions (supply chain) |
| 5 | Security headers | `verify-security-headers.ts` | CSP, HSTS, `noindex` present on all apps |
| 6 | Feature flag expiry | `flag-expiry-check.ts` | No expired flags in `feature_flags` table |
| 7 | PII log prevention | `pii-log-check.ts` | No PII in test log output |
| 8 | Interface freeze | PR template checklist | Layer 2 changes require version bump + changelog |
| 9 | Outbox pattern | ESLint rule | No direct adapter calls from feature packages without outbox |

***

## 4.11 The Interface Freeze Rule

The interface freeze is the single most important sequencing constraint in the build plan. It works as follows:

**Before freeze:** Layer 2 contracts (`firm-types` interfaces, `firm-validators` schemas, `firm-api-contracts` event registry) are actively being developed. Only Layer 0, 1, and 2 packages are being built. No Layer 3–7 package should begin implementation.

**The freeze event:** When all domain entity interfaces in `firm-types`, all Zod schemas in `firm-validators`, and all event definitions in `firm-api-contracts` are reviewed and tagged as `v1.0.0`, the interface freeze is declared. This is a Git tag: `contracts/v1.0.0`.

**After freeze:** All Layer 3–7 packages can be built in parallel against the locked contracts. Any change to a Layer 2 contract after freeze requires a semver minor or major bump, a PR labeled `breaking-contract-change`, and a changelog entry listing every affected downstream package.

**Why this rule exists:** Building `firm-campaigns` against a `lead.ts` interface that still has open questions about `customFields` typing means the campaign package may need to be partially rewritten when the interface is finalized. The interface freeze converts contract-uncertainty risk into concrete, schedulable rework — which is a tractable problem — versus silent accumulating drift across 50 packages — which is not.

# Marketing Agency Mono Repository Blueprint & Assessment
## Part 5 — Data Architecture

***

> **Purpose of This Part:** This part defines the complete data layer of the platform — every database table, every RLS policy pattern, the cache architecture, the vector search constraints, the file storage model, and the GDPR data lifecycle. For AI coding agents: every query you write must use `withTenantContext()`. Every table you create must have an RLS policy. Every column that stores personal data must appear in the PII redaction configuration. No exceptions.

***

## 5.1 Multi-Tenancy Model

The platform uses a **shared database, shared schema** multi-tenancy model enforced by PostgreSQL Row Level Security (RLS). All tenants' data lives in the same PostgreSQL database, the same tables, the same schema — but RLS policies at the database engine level ensure that a query running in the context of Tenant A will never return, update, or delete rows belonging to Tenant B, even if application-level code has a bug.

### Why Shared Schema Over Separate Schemas or Separate Databases

| Approach | Pros | Cons | Decision |
|---|---|---|---|
| Separate database per tenant | Maximum isolation | $X/month per tenant at 1,000 clients is unviable; migration complexity multiplies by 1,000 | ❌ Rejected |
| Separate schema per tenant | Good isolation; single DB | Schema migration must run 1,000 times; schema proliferation in `pg_catalog` degrades performance | ❌ Rejected |
| Shared schema + RLS | Single migration run; performant; strong isolation when implemented correctly | Requires discipline — every table must have RLS; application bugs can leak data without RLS | ✅ Chosen |

### The Three Enforcement Levels

Defense in depth means no single failure causes cross-tenant exposure:

**Level 1 — Application layer:** `tenantId` is derived from the cryptographically verified session by `firm-auth`, stored in `firm-request-context`'s `AsyncLocalStorage` store. It is never read from URL parameters, request headers, or user-supplied input.

**Level 2 — Database layer:** Every database transaction begins with:
```sql
SELECT set_config('app.current_tenant_id', $1, true)
```
RLS policies on every tenant-scoped table use `current_setting('app.current_tenant_id')` as the filter. This executes at the PostgreSQL engine level — below the ORM, below the application server, below any middleware.

**Level 3 — Cache layer:** Every cache key stored by `TenantCache` is prefixed `tenant:{tenantId}:{key}`. A `TenantCache` instance for Tenant A cannot physically address a key stored by Tenant B.

### Tenant Resolution Flow

```
HTTP Request
     │
     ▼
Edge (Cloudflare Worker / Vercel middleware)
  Host header: 'acmedental.firmplatform.com'
  OR custom domain: 'marketing.acmedental.com'
     │
     ▼
firm-auth.resolveTenantFromHost(host)
  1. Check cache: GET tenant:{host} → TenantId (TTL: 5 minutes)
  2. Cache miss: SELECT tenant_id FROM custom_domains WHERE domain = $1
  3. Store in cache for next request
     │
     ▼
runWithContext({ tenantId, correlationId, ... })
  ← AsyncLocalStorage store populated for this request
     │
     ▼
All subsequent operations read tenantId from context
No function argument threading required
```

***

## 5.2 Core Schema Tables

These tables are owned by `firm-db` and represent the platform's foundational data layer. Every feature package's tables are listed in their respective package specifications in Part 4.

### `tenants`

```sql
CREATE TABLE tenants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,              -- 'acme-dental' — used in URLs
  name            TEXT NOT NULL,                     -- 'Acme Dental Group'
  plan            TEXT NOT NULL DEFAULT 'starter',   -- 'starter' | 'growth' | 'pro' | 'enterprise'
  status          TEXT NOT NULL DEFAULT 'active',    -- 'active' | 'suspended' | 'cancelled' | 'provisioning'
  vertical        TEXT,                              -- 'dental' | 'legal' | 'fitness' etc.
  billing_email   TEXT NOT NULL,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  suspended_at    TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ
);

-- No RLS on tenants — this IS the tenant root table
-- superadmin role has unrestricted access
-- All other roles access tenant data through tenant-scoped tables
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status) WHERE status != 'cancelled';
```

### `users`

```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  email_verified  BOOLEAN NOT NULL DEFAULT false,
  name            TEXT,
  avatar_url      TEXT,
  role            TEXT NOT NULL DEFAULT 'user',      -- RBAC role
  status          TEXT NOT NULL DEFAULT 'active',    -- 'active' | 'suspended' | 'deleted'
  last_seen_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ                        -- Soft delete
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_tenant_isolation ON users
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE UNIQUE INDEX idx_users_email_tenant ON users(email, tenant_id)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_role ON users(tenant_id, role);
```

### `sessions`

```sql
CREATE TABLE sessions (
  id              TEXT PRIMARY KEY,                  -- Better Auth session token
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at      TIMESTAMPTZ NOT NULL,
  ip_address      TEXT,
  user_agent      TEXT,
  impersonator_id UUID REFERENCES users(id),         -- Set during impersonation
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY sessions_tenant_isolation ON sessions
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
-- Cleanup job: DELETE FROM sessions WHERE expires_at < NOW() (pg_cron daily)
```

### `api_keys`

```sql
CREATE TABLE api_keys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  prefix          TEXT NOT NULL,                     -- First 8 chars, stored plaintext for lookup
  key_hash        TEXT NOT NULL,                     -- HMAC-SHA256 of full key
  permissions     TEXT[] NOT NULL DEFAULT '{}',      -- Scoped permissions
  last_used_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  revoked_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY api_keys_tenant_isolation ON api_keys
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE UNIQUE INDEX idx_api_keys_prefix ON api_keys(prefix);
CREATE INDEX idx_api_keys_tenant ON api_keys(tenant_id) WHERE revoked_at IS NULL;
```

### `audit_log`

```sql
CREATE TABLE audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,                     -- 'lead.created', 'user.suspended' etc.
  resource_type   TEXT NOT NULL,                     -- 'lead', 'user', 'campaign' etc.
  resource_id     TEXT,
  before          JSONB,                             -- State before change
  after           JSONB,                             -- State after change
  ip_address      TEXT,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- No updated_at — audit log rows are IMMUTABLE
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_log_tenant_isolation ON audit_log
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Append-only enforcement: no UPDATE or DELETE permitted
CREATE RULE audit_log_no_update AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE RULE audit_log_no_delete AS ON DELETE TO audit_log DO INSTEAD NOTHING;

CREATE INDEX idx_audit_log_tenant_action ON audit_log(tenant_id, action, created_at DESC);
CREATE INDEX idx_audit_log_resource ON audit_log(tenant_id, resource_type, resource_id);
```

### `outbox_events`

```sql
CREATE TABLE outbox_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_name      TEXT NOT NULL,                     -- Must match event registry
  payload         JSONB NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',   -- 'pending' | 'processing' | 'delivered' | 'failed'
  attempts        INTEGER NOT NULL DEFAULT 0,
  last_error      TEXT,
  idempotency_key TEXT,                              -- Prevents duplicate processing
  scheduled_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE outbox_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY outbox_events_tenant_isolation ON outbox_events
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE UNIQUE INDEX idx_outbox_idempotency
  ON outbox_events(tenant_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX idx_outbox_pending
  ON outbox_events(scheduled_at)
  WHERE status = 'pending';

-- The outbox processor queries this index every second
-- Partial index on 'pending' keeps this query fast regardless of total row count
```

### `feature_flags`

```sql
CREATE TABLE feature_flags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL = global default
  key             TEXT NOT NULL,                     -- 'release/patient-recall'
  taxonomy        TEXT NOT NULL,                     -- 'release' | 'exp' | 'ops' | 'perm'
  enabled         BOOLEAN NOT NULL DEFAULT false,
  rollout_percent INTEGER CHECK (rollout_percent BETWEEN 0 AND 100),
  expires_at      TIMESTAMPTZ NOT NULL,              -- REQUIRED — no immortal flags
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY feature_flags_tenant_isolation ON feature_flags
  USING (
    tenant_id IS NULL OR
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
  );

-- CI gate: scripts/flag-expiry-check.ts fails build if any flag is past expires_at
CREATE INDEX idx_flags_key_tenant ON feature_flags(key, tenant_id);
CREATE INDEX idx_flags_expiry ON feature_flags(expires_at) WHERE enabled = true;
```

### `consent_records`

```sql
CREATE TABLE consent_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id      TEXT,                              -- For anonymous visitors
  ip_address      TEXT NOT NULL,
  user_agent      TEXT NOT NULL,
  -- Google Consent Mode v3 signals
  ad_storage              BOOLEAN NOT NULL DEFAULT false,
  analytics_storage       BOOLEAN NOT NULL DEFAULT false,
  ad_user_data            BOOLEAN NOT NULL DEFAULT false,
  ad_personalization      BOOLEAN NOT NULL DEFAULT false,
  -- Additional consent types
  email_tracking          BOOLEAN NOT NULL DEFAULT false,
  functional              BOOLEAN NOT NULL DEFAULT false,
  -- Provenance
  consent_method  TEXT NOT NULL,                     -- 'banner' | 'gpc' | 'api' | 'implicit'
  banner_version  TEXT,                              -- Which consent banner version was shown
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- Immutable — never updated, new record created on each consent change
);

ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY consent_records_tenant_isolation ON consent_records
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE INDEX idx_consent_user ON consent_records(tenant_id, user_id, created_at DESC);
CREATE INDEX idx_consent_session ON consent_records(tenant_id, session_id, created_at DESC);
```

### `ai_generation_log`

```sql
CREATE TABLE ai_generation_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  task            TEXT NOT NULL,                     -- 'blog-post' | 'social-caption' | 'email-subject'
  model           TEXT NOT NULL,                     -- 'claude-sonnet-4-5' | 'gpt-4o' etc.
  tokens_input    INTEGER NOT NULL,
  tokens_output   INTEGER NOT NULL,
  cost_usd        NUMERIC(10, 6) NOT NULL,
  duration_ms     INTEGER NOT NULL,
  c2pa_manifest   JSONB,                             -- EU AI Act compliance
  content_hash    TEXT,                              -- SHA-256 of generated content
  disclosed       BOOLEAN NOT NULL DEFAULT false,    -- Disclosure label applied
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE ai_generation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_log_tenant_isolation ON ai_generation_log
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE INDEX idx_ai_log_tenant_model ON ai_generation_log(tenant_id, model, created_at DESC);
CREATE INDEX idx_ai_log_cost ON ai_generation_log(tenant_id, created_at DESC);
-- Used by: AI cost tracker Grafana dashboard, token budget alerts
```

***

## 5.3 Domain-Specific Table Inventory

Every feature package owns its own tables. The package is the sole writer to its tables. Other packages read via the package's service layer functions, never via direct ORM queries to another package's tables.

| Package | Tables Owned |
|---|---|
| `firm-leads` | `leads`, `lead_activities`, `lead_pipeline_stages`, `lead_assignments`, `lead_scores`, `crm_sync_jobs` |
| `firm-forms` | `forms`, `form_fields`, `form_submissions`, `form_analytics` |
| `firm-campaigns` | `campaigns`, `campaign_steps`, `campaign_enrollments`, `campaign_analytics`, `ab_test_variants`, `audience_segments` |
| `firm-bookings` | `bookings`, `availability_rules`, `calendar_integrations`, `booking_reminders` |
| `firm-notifications` | `notifications`, `notification_preferences` |
| `firm-webhooks` | `webhook_endpoints`, `webhook_delivery_log` |
| `firm-storage` | `file_storage_records`, `storage_quotas` |
| `firm-media` | `media_assets`, `media_transforms` |
| `firm-payments` | `subscriptions`, `invoices`, `payment_events`, `dunning_schedules` |
| `firm-reporting` | `analytics_reports`, `report_schedules`, `report_delivery_log` |
| `firm-cms` | `cms_content`, `content_versions`, `content_categories` |
| `firm-landing-pages` | `landing_pages`, `page_versions`, `page_analytics` |
| `firm-funnels` | `funnels`, `funnel_steps`, `funnel_visits`, `funnel_conversions` |
| `firm-social` | `social_posts`, `social_accounts`, `social_analytics` |
| `firm-reputation` | `review_requests`, `reviews`, `gbp_listings`, `review_responses` |
| `firm-ads` | `ad_campaigns`, `ad_accounts`, `ad_performance`, `ad_audiences` |
| `firm-ai-content` | `ai_content_drafts`, `content_brief_templates` |
| `firm-ai-brand-voice` | `brand_voice_profiles`, `voice_training_examples` |
| `firm-ai-seo` | `seo_briefs`, `keyword_clusters`, `serp_snapshots` |
| `firm-tenancy` | `tenant_limits`, `tenant_usage_metrics`, `tenant_provisioning_log`, `gdpr_erasure_requests` |
| `firm-white-label` | `custom_domains`, `ssl_certificates`, `brand_configs`, `theme_overrides` |
| `firm-onboarding` | `onboarding_progress`, `onboarding_steps` |
| `firm-projects` | `projects`, `project_tasks`, `project_milestones`, `time_entries` |
| `firm-documents` | `documents`, `document_versions`, `document_signatures` |
| `firm-proposals` | `proposals`, `proposal_sections`, `proposal_signatures` |
| `firm-search` | `search_indexes`, `embedding_vectors` |
| `firm-features` | `feature_flags`, `flag_overrides` |

### Table Naming Conventions

```
Singular table names:     leads (not lead), campaigns (not campaign)
Tenant scoped:            Always include tenant_id UUID NOT NULL
Soft deletes:             deleted_at TIMESTAMPTZ (not a boolean deleted flag)
Timestamps:               created_at + updated_at on all mutable tables
Audit trail tables:       Append-only — no updated_at, no soft delete
Junction tables:          <table_a>_<table_b> alphabetically sorted
JSONB columns:            metadata JSONB NOT NULL DEFAULT '{}' (never NULL)
Status columns:           TEXT with CHECK constraint — not enums (easier migration)
```

***

## 5.4 RLS Policy Patterns

### The Canonical RLS Policy Template

Every tenant-scoped table follows this exact pattern. Deviations require documented justification in an ADR:

```sql
-- Step 1: Enable RLS on the table
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;

-- Step 2: Create the isolation policy
-- 'true' as second argument to current_setting prevents error if variable not set
-- Without 'true', a query outside a tenant context throws a PostgreSQL error
CREATE POLICY <table_name>_tenant_isolation ON <table_name>
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
  );

-- Step 3: Create standard indexes
CREATE INDEX idx_<table_name>_tenant_id ON <table_name>(tenant_id);
```

### The `true` Second Argument Is Critical

```sql
-- WRONG — throws error if app.current_tenant_id is not set
current_setting('app.current_tenant_id')::uuid

-- CORRECT — returns NULL if not set, which causes USING clause to return false
-- (no rows returned) rather than a PostgreSQL runtime error
current_setting('app.current_tenant_id', true)::uuid
```

This distinction matters for background workers and administrative operations that run outside a tenant request context. Without `true`, a GDPR erasure worker running a cross-tenant cleanup job would crash with a PostgreSQL error rather than gracefully handling the context-free query.

### Superadmin Bypass Pattern

The superadmin role (the agency's own database user) needs to bypass RLS for operational tasks like tenant provisioning, GDPR erasure, and platform-wide analytics. This is achieved with a dedicated database role:

```sql
-- Superadmin role bypasses RLS
CREATE ROLE firm_superadmin;
ALTER TABLE leads FORCE ROW LEVEL SECURITY;  -- Applies RLS even to table owner
GRANT ALL ON leads TO firm_superadmin;
ALTER ROLE firm_superadmin BYPASSRLS;        -- Superadmin explicitly bypasses

-- Application uses the tenant-scoped role (never superadmin)
CREATE ROLE firm_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO firm_app;
-- firm_app does NOT have BYPASSRLS — RLS always applies
```

### Policies for Special-Case Tables

**`feature_flags` — Global defaults + tenant overrides:**
```sql
CREATE POLICY feature_flags_tenant_isolation ON feature_flags
  USING (
    tenant_id IS NULL  -- Global defaults visible to all tenants
    OR tenant_id = current_setting('app.current_tenant_id', true)::uuid
  );
```

**`outbox_events` — Processor access pattern:**
```sql
-- The outbox processor runs as superadmin (BYPASSRLS)
-- to process events across all tenants in one sweep
-- Application code writing to outbox uses tenant context (RLS applies)
```

**`audit_log` — Read-only after write:**
```sql
-- Append-only enforcement via rules (not RLS)
CREATE RULE audit_log_no_update AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE RULE audit_log_no_delete AS ON DELETE TO audit_log DO INSTEAD NOTHING;
```

### RLS CI Validation Script

```typescript
// scripts/validate-rls-policies.ts
// Queries information_schema to find tables with tenant_id that lack RLS policies
// Fails build if any such table is found

const query = `
  SELECT t.table_name
  FROM information_schema.tables t
  JOIN information_schema.columns c
    ON c.table_name = t.table_name
    AND c.column_name = 'tenant_id'
  LEFT JOIN pg_policies p
    ON p.tablename = t.table_name
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND p.tablename IS NULL
`
// If this query returns any rows, exit(1)
```

***

## 5.5 Migration Strategy

### Migration File Conventions

```
packages/firm-db/drizzle/migrations/
├── 0001_initial_schema.sql           ← tenants, users, sessions, api_keys
├── 0002_audit_and_outbox.sql         ← audit_log, outbox_events
├── 0003_consent_and_ai.sql           ← consent_records, ai_generation_log
├── 0004_feature_flags.sql            ← feature_flags, flag_overrides
├── 0005_leads_and_forms.sql          ← leads, lead_activities, forms, form_submissions
├── 0006_campaigns.sql                ← campaigns, campaign_steps, campaign_enrollments
├── 0007_bookings.sql                 ← bookings, availability_rules
├── 0008_content.sql                  ← cms_content, landing_pages, funnels
├── 0009_payments.sql                 ← subscriptions, invoices, payment_events
└── meta/
    └── _journal.json                 ← Drizzle migration journal
```

### Migration Rules

- **One migration per logical domain change.** Do not combine unrelated table changes in one migration file.
- **Migrations are forward-only.** There are no `down` migrations. Rollback is achieved by writing a new migration that reverses the change. This prevents the dangerous pattern of running a down migration in production that drops data.
- **Every migration includes its own RLS policies.** A migration that creates a new table with `tenant_id` must include the `ENABLE ROW LEVEL SECURITY` and `CREATE POLICY` statements in the same migration file.
- **Migrations are tested in CI** against a fresh PGLite instance before merge.

### Tenant-Aware Migration Runner

```typescript
// scripts/run-migrations.ts
// Runs migrations using the superadmin role (BYPASSRLS)
// Never runs migrations using the application role

async function runMigrations(options: {
  target?: 'development' | 'staging' | 'production'
  confirm?: boolean
}) {
  const db = createDatabaseClient({ role: 'firm_superadmin' })
  await migrate(db, { migrationsFolder: './drizzle/migrations' })
  logger.info('Migrations completed successfully')
}
```

### Schema Governance: ORM-Worker Drift Prevention

A common failure mode in multi-service architectures: the ORM schema and the background worker's understanding of table structure diverge silently. Prevention strategy:

- The Drizzle schema in `firm-db` is the single source of truth.
- Workers import Drizzle table definitions from `@firm/db` — they never define their own table shapes.
- `drizzle-kit check` runs in CI to detect schema/migration drift.
- The `turbo.json` `db:generate` task must pass before any integration test can run.

***

## 5.6 Cache Architecture

### Redis Structure and Namespacing

```
Redis key namespace structure:
tenant:{tenantId}:{domain}:{key}

Examples:
tenant:uuid-1234:config:theme           ← Tenant theme config (TTL: 5 minutes)
tenant:uuid-1234:session:sess-xyz       ← Session data (TTL: session expiry)
tenant:uuid-1234:ratelimit:user:uid-56  ← Rate limit counter (TTL: window duration)
tenant:uuid-1234:ai:tokens:claude:2026-05 ← AI token usage counter (TTL: end of billing period)
tenant:uuid-1234:flags:release/recall   ← Feature flag evaluation (TTL: 60 seconds)
tenant:uuid-1234:search:query:hash      ← Search result cache (TTL: 2 minutes)

Global (non-tenant-scoped):
global:tenant:host:{hostname}           ← Host → TenantId mapping (TTL: 5 minutes)
global:ratelimit:ip:{ipAddress}         ← IP-based rate limits
```

### `TenantCache` API

```typescript
export class TenantCache {
  // Prefix is automatically applied — key 'config:theme' becomes
  // 'tenant:{tenantId}:config:theme' in Redis
  constructor(private tenantId: TenantId, private redis: Redis) {}

  async get<T>(key: string): Promise<T | null>
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void>
  async del(key: string): Promise<void>
  async del(keys: string[]): Promise<void>         // Batch delete
  async exists(key: string): Promise<boolean>
  async ttl(key: string): Promise<number>

  // For rate limiting and token budgets — atomic Redis INCR
  async increment(key: string, by = 1): Promise<number>
  async incrementWithExpiry(key: string, by: number, ttlSeconds: number): Promise<number>

  // Atomic check-and-increment for budget enforcement
  // Returns { allowed: true, current: 847 } or { allowed: false, current: 1000 }
  async atomicIncrement(
    key: string,
    by: number,
    limit: number
  ): Promise<{ allowed: boolean; current: number }>

  // Pub/sub for real-time notifications
  async publish(channel: string, message: unknown): Promise<void>
  async subscribe(channel: string, handler: (message: unknown) => void): Promise<void>
}
```

### Cache TTL Strategy

| Cache Domain | TTL | Rationale |
|---|---|---|
| Tenant config | 5 minutes | Config changes should propagate in < 5 minutes |
| Feature flags | 60 seconds | Flag changes should take effect quickly |
| Sessions | Session expiry | Matches session lifetime |
| Host → TenantId mapping | 5 minutes | DNS propagation is slow; short TTL catches custom domain changes |
| Rate limit counters | Window duration | Must expire exactly at window boundary |
| AI token counters | End of billing period | Resets with subscription cycle |
| Search results | 2 minutes | Balance freshness with performance |
| Report data | 1 hour | Reports are pre-computed; freshness less critical |
| Tenant theme | 5 minutes | Theme changes are rare but should propagate promptly |

### Session Store

```typescript
// firm-cache exports a Better Auth-compatible session store adapter
export function createSessionStore(redis: Redis): SessionStore {
  return {
    async get(sessionId: string) {
      return redis.get(`session:${sessionId}`)
    },
    async set(sessionId: string, session: Session, ttlSeconds: number) {
      await redis.setex(`session:${sessionId}`, ttlSeconds, JSON.stringify(session))
    },
    async delete(sessionId: string) {
      await redis.del(`session:${sessionId}`)
    }
  }
}
```

### In-Memory Test Fallback

```typescript
// For integration tests — no Redis required in CI
export function createTestCache(tenantId: TenantId): TenantCache {
  const store = new Map<string, { value: unknown; expiresAt: number }>()
  // Returns a TenantCache instance backed by the Map
  // Implements the full TenantCache interface including atomicIncrement
  return new TenantCache(tenantId, createInMemoryRedis(store))
}
```

***

## 5.7 Vector Search Architecture

The platform uses `pgvector` for semantic search across content, leads, and campaign assets. The critical constraint established in Part 4 is restated and fully specified here.

### The Tenant-First Query Constraint

**Vector similarity ranking (`<=>` cosine distance) is expensive.** Without tenant filtering first, a similarity search ranks embeddings from all 1,000 tenants' data before filtering — this is both a performance failure and a potential isolation risk.

**The correct query structure:**
```sql
-- CORRECT: Filter by tenant_id FIRST, then rank by similarity
SELECT id, content, embedding <=> $2 AS distance
FROM embedding_vectors
WHERE tenant_id = $1                    -- ← Tenant filter reduces dataset to ~0.1% of total
  AND content_type = 'cms_content'
ORDER BY embedding <=> $2               -- ← Similarity ranking on filtered set only
LIMIT 10;
```

**The incorrect query structure (forbidden):**
```sql
-- WRONG: Ranks all tenants' embeddings, then filters — catastrophically slow at scale
SELECT id, content, embedding <=> $1 AS distance
FROM embedding_vectors
ORDER BY embedding <=> $1               -- ← Ranks ALL rows across all tenants
LIMIT 10
-- Even if RLS prevents returning other tenants' rows, the sort happens first
```

### `firm-search` Typed Query Builders

The `firm-search` package enforces this constraint structurally. The query builder API does not expose a method to perform similarity search without a `tenantId`:

```typescript
// firm-search/src/vector-search.ts
export async function semanticSearch(params: {
  tenantId: TenantId                  // Required — cannot be omitted
  query: string
  contentType: ContentType
  limit?: number
  threshold?: number
}): Promise<SearchResult[]> {
  const embedding = await generateEmbedding(params.query)

  return withTenantContext(params.tenantId, async (db) => {
    return db.execute(sql`
      SELECT id, content, metadata,
             embedding <=> ${embedding} AS distance
      FROM embedding_vectors
      WHERE tenant_id = ${params.tenantId}    -- Always first
        AND content_type = ${params.contentType}
        AND embedding <=> ${embedding} < ${params.threshold ?? 0.8}
      ORDER BY embedding <=> ${embedding}
      LIMIT ${params.limit ?? 10}
    `)
  })
}
```

### `embedding_vectors` Table

```sql
CREATE TABLE embedding_vectors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  content_type    TEXT NOT NULL,    -- 'cms_content' | 'lead' | 'campaign' | 'email_template'
  content_id      UUID NOT NULL,    -- FK to the source content record
  content_text    TEXT NOT NULL,    -- The text that was embedded
  embedding       vector(1536),     -- text-embedding-3-small dimension
  model           TEXT NOT NULL,    -- Which embedding model generated this
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE embedding_vectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY embedding_vectors_tenant_isolation ON embedding_vectors
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- IVFFLAT index for approximate nearest neighbor search
-- Scoped to tenant_id + content_type for the query pattern above
CREATE INDEX idx_embedding_vectors_ivfflat
  ON embedding_vectors
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- The tenant_id index must be used BEFORE the vector index
CREATE INDEX idx_embedding_vectors_tenant_type
  ON embedding_vectors(tenant_id, content_type);
```

***

## 5.8 File Storage Architecture

### Provider Abstraction

All file operations go through `firm-storage`, which delegates to a `StorageAdapter` implementation. The platform defaults to Cloudflare R2 (zero egress cost) for all environments.

```typescript
// firm-storage/src/index.ts
export class StorageService {
  constructor(
    private tenantId: TenantId,
    private adapter: StorageAdapter    // Injected — never imported directly
  ) {}

  async upload(params: {
    file: Buffer | ReadableStream
    filename: string
    contentType: string
    folder: 'public' | 'private' | 'uploads' | 'reports' | 'exports'
  }): Promise<StorageRecord>

  async getSignedUrl(fileId: string, expiresInSeconds = 3600): Promise<string>

  async delete(fileId: string): Promise<void>

  async getQuotaUsage(): Promise<QuotaUsage>
}
```

### Tenant-Scoped Storage Paths

Every file stored in the platform is scoped to its tenant. No cross-tenant path traversal is possible:

```
R2 bucket structure:
firm-platform-storage/
├── tenants/
│   ├── {tenantId}/
│   │   ├── public/              ← Client-facing assets (CSS, images, logos)
│   │   │   └── {year}/{month}/
│   │   ├── private/             ← Internal docs, contracts
│   │   │   └── {year}/{month}/
│   │   ├── uploads/             ← Form uploads, lead attachments
│   │   │   └── {year}/{month}/
│   │   ├── reports/             ← Generated PDF reports
│   │   │   └── {year}/{month}/
│   │   └── exports/             ← Data exports (GDPR, CSV)
│   │       └── {year}/{month}/
│   └── ...
└── platform/
    └── assets/                  ← Platform-level assets (not tenant-specific)
```

### Signed URL Strategy

Private files are never served directly from the storage bucket. Every private file access goes through `getSignedUrl()` with a TTL:

```typescript
// Reports: 7-day TTL (for email delivery)
const reportUrl = await storage.getSignedUrl(report.fileId, 7 * 24 * 3600)

// Document previews: 1-hour TTL
const previewUrl = await storage.getSignedUrl(doc.fileId, 3600)

// Form upload previews: 15-minute TTL
const uploadUrl = await storage.getSignedUrl(upload.fileId, 900)
```

### Storage Quota Enforcement

```typescript
// firm-storage/src/quota.ts
export async function enforceQuota(
  tenantId: TenantId,
  fileSizeBytes: number
): Promise<void> {
  const usage = await getQuotaUsage(tenantId)
  const limits = await getTenantLimits(tenantId)

  if (usage.usedBytes + fileSizeBytes > limits.storageQuotaBytes) {
    throw new StorageQuotaExceededError(tenantId, {
      used: usage.usedBytes,
      limit: limits.storageQuotaBytes,
      requested: fileSizeBytes,
    })
  }
}
```

***

## 5.9 GDPR Data Lifecycle

The platform handles personal data for the clients of 1,000 tenant businesses. GDPR compliance is not optional. The data lifecycle has four phases:

### Phase 1 — Data Minimization at Ingress

```typescript
// firm-ai/src/generate.ts — before sending to AI model
// Only aggregated/anonymized data sent to external AI models
function anonymizeForAI(lead: Lead): AnonymizedLead {
  return {
    ...lead,
    firstName: '[REDACTED]',
    lastName: '[REDACTED]',
    email: '[REDACTED]',
    phone: undefined,
    // Keep behavioral signals: status, score, source, campaign engagement
  }
}
```

### Phase 2 — Retention Policy Enforcement (pg_cron)

```sql
-- Scheduled daily at 2am UTC
-- Anonymizes records past the configured retention window
-- Retention window is configurable per tenant (default: 24 months)
SELECT cron.schedule('anonymize-expired-records', '0 2 * * *', $$
  UPDATE leads
  SET
    first_name = '[ANONYMIZED]',
    last_name = '[ANONYMIZED]',
    email = CONCAT('anonymized-', id::text, '@deleted.invalid'),
    phone = NULL,
    metadata = '{}'
  WHERE
    tenant_id = current_setting('app.current_tenant_id', true)::uuid
    AND created_at < NOW() - (
      SELECT (metadata->>'retentionMonths')::int * INTERVAL '1 month'
      FROM tenants WHERE id = tenant_id
    )
    AND deleted_at IS NULL
$$);
```

### Phase 3 — GDPR Erasure Request (Right to Be Forgotten)

```typescript
// worker-data-retention handles gdpr_erasure_requests
// Two-phase process:

// Phase A — Immediate anonymization (within 72 hours of request)
async function anonymizeSubjectData(tenantId: TenantId, subjectEmail: string) {
  await withTenantContext(tenantId, async (db) => {
    const user = await db.select().from(users)
      .where(eq(users.email, subjectEmail))

    // Anonymize across all tables containing this user's PII
    await Promise.all([
      db.update(leads).set({ email: '[erased]', firstName: '[erased]', phone: null })
        .where(eq(leads.email, subjectEmail)),
      db.update(users).set({ email: '[erased]', name: '[erased]' })
        .where(eq(users.id, user.id)),
      db.update(form_submissions).set({ data: '{}' })
        .where(eq(form_submissions.userId, user.id)),
      // All tables with user-identifying PII
    ])

    // Log erasure for audit trail (the fact of erasure, not the data)
    await db.insert(audit_log).values({
      tenantId,
      action: 'gdpr.erasure.anonymized',
      resourceType: 'user',
      resourceId: user.id,
    })
  })
}

// Phase B — Hard deletion (30 days after anonymization — configurable)
// Scheduled by pg_cron after Phase A completes
async function hardDeleteSubjectData(tenantId: TenantId, erasureRequestId: string) {
  // Delete anonymized records from analytics tables
  // Delete exported data files from storage
  // Mark erasure request as completed
}
```

### Phase 4 — GDPR Data Export (Right of Portability)

```typescript
// worker-data-retention handles data export requests
async function exportSubjectData(
  tenantId: TenantId,
  subjectEmail: string
): Promise<string> {   // Returns signed URL to download export

  const data = await gatherSubjectData(tenantId, subjectEmail)
  const csv = generateDataExportCSV(data)
  const fileId = await storage.upload({
    file: Buffer.from(csv),
    filename: `gdpr-export-${Date.now()}.csv`,
    contentType: 'text/csv',
    folder: 'exports',
  })

  // Signed URL valid for 48 hours — sent to user via email
  return storage.getSignedUrl(fileId, 48 * 3600)
}
```

### PII Column Registry

Every column containing personal data is registered in `firm-logger`'s redaction configuration and in a central PII registry used by the data retention scripts:

| Table | PII Columns |
|---|---|
| `users` | `email`, `name`, `avatar_url` |
| `leads` | `email`, `first_name`, `last_name`, `phone`, `custom_fields` |
| `form_submissions` | `data` (entire JSONB — may contain any fields) |
| `sessions` | `ip_address`, `user_agent` |
| `consent_records` | `ip_address`, `user_agent` |
| `audit_log` | `ip_address`, `user_agent`, `before`, `after` (may contain PII) |
| `bookings` | `notes` (may contain patient/personal info) |
| `campaign_enrollments` | `email` (denormalized for delivery) |
| `ai_generation_log` | `content_hash` (not PII, but subject to AI Act) |

# Marketing Agency Mono Repository Blueprint & Assessment
## Part 6 — API & Event Architecture

***

> **Purpose of This Part:** This part defines every communication pattern in the platform — how the frontend talks to the backend (tRPC), how the platform exposes itself to the outside world (REST + OpenAPI), how internal services communicate asynchronously (CloudEvents + outbox + Inngest sagas), how external services push data in (webhooks), and how the platform pushes data to clients in real-time (SSE + pub/sub). For AI coding agents: the communication pattern you use for a given operation is not a preference — it is determined by the operation's characteristics. This part tells you which pattern applies to which operation and exactly how to implement it.

***

## 6.1 Choosing the Right Communication Pattern

Before writing any API or integration code, determine which category the operation falls into:

| Operation Characteristic | Pattern | Example |
|---|---|---|
| Frontend → backend, user-initiated, needs type safety | tRPC procedure | Submitting a lead form, updating campaign settings |
| External developer or third-party → platform | REST + OpenAPI | Zapier integration, client developer portal, `firm-sdk` |
| Operation that must survive failures and retries | Outbox event + Inngest | Email delivery, CRM sync, report generation |
| Long-running multi-step workflow | Inngest saga | Campaign sequence, tenant provisioning, GDPR erasure |
| External service pushing data to platform | Inbound webhook | Stripe payment events, Twilio delivery receipts |
| Platform pushing data to external service | Outbound webhook | Lead created notification to client's Zapier |
| Server → browser real-time updates | Server-Sent Events (SSE) | Campaign send progress, booking confirmation |
| Cross-service internal broadcast | Redis pub/sub | Tenant config changed, feature flag updated |

**The decision is permanent within a PR.** Do not mix tRPC and REST for the same resource — if leads are a tRPC resource, all lead mutations go through tRPC. If a resource needs both internal (tRPC) and external (REST) access, the REST handler calls the same service layer as the tRPC procedure — they share business logic, not transport.

***

## 6.2 Internal API: tRPC

tRPC is the internal API layer — used exclusively by platform applications (`apps/platform/*`) communicating with their own backend. It provides end-to-end TypeScript type safety from the server procedure to the React component that calls it, with no schema duplication and no generated client code.

### Router Structure

```typescript
// packages/firm-api-contracts/src/trpc/index.ts
export type AppRouter = typeof appRouter

export const appRouter = createTRPCRouter({
  leads: leadsRouter,
  forms: formsRouter,
  bookings: bookingsRouter,
  campaigns: campaignsRouter,
  analytics: analyticsRouter,
  reporting: reportingRouter,
  ai: aiRouter,
  auth: authRouter,
  tenancy: tenancyRouter,
  admin: adminRouter,       // superadmin only
})
```

### Procedure Patterns

Every tRPC procedure follows this structure. No procedure deviates from this pattern:

```typescript
// packages/firm-api-contracts/src/trpc/leads.ts
export const leadsRouter = createTRPCRouter({

  // Query — read operations
  list: protectedProcedure
    .input(z.object({
      ...paginationSchema.shape,
      status: z.nativeEnum(LeadStatus).optional(),
      assignedTo: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // ctx.tenantId is derived from the verified session — never from input
      return leadsService.list(ctx.tenantId, input)
    }),

  // Mutation — write operations
  create: protectedProcedure
    .input(createLeadSchema)   // From @firm/validators — never inline
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx.user, 'leads:create')
      return leadsService.create(ctx.tenantId, input)
    }),

  // Mutation with RBAC check
  delete: protectedProcedure
    .input(z.object({ id: leadIdSchema }))
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx.user, 'leads:delete')
      return leadsService.softDelete(ctx.tenantId, input.id)
    }),
})
```

### Context Construction

```typescript
// The tRPC context is constructed on every request
// It is the single point where session verification happens
export async function createTRPCContext(opts: { headers: Headers }) {
  const session = await verifySession(opts.headers)

  return {
    tenantId: session?.tenantId ?? null,
    user: session?.user ?? null,
    db: createDatabaseClient(),
    cache: session?.tenantId
      ? new TenantCache(session.tenantId, redis)
      : null,
  }
}

// protectedProcedure enforces that tenantId and user are non-null
const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.tenantId || !ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { ...ctx, tenantId: ctx.tenantId, user: ctx.user } })
})
```

### tRPC in Next.js App Router

```typescript
// apps/platform/platform-crm/app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter } from '@firm/api-contracts'
import { createTRPCContext } from '@/lib/trpc-context'

export const GET = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ headers: req.headers }),
  })

export const POST = GET
```

### Client-Side tRPC Usage

```typescript
// In a React Server Component
import { trpc } from '@/lib/trpc-server'

export default async function LeadsPage() {
  const leads = await trpc.leads.list({ limit: 20 })
  return <LeadsTable leads={leads.data} />
}

// In a Client Component with React Query
'use client'
import { trpc } from '@/lib/trpc-client'

export function CreateLeadForm() {
  const createLead = trpc.leads.create.useMutation({
    onSuccess: () => router.refresh(),
  })
}
```

***

## 6.3 External API: REST + OpenAPI

The REST API is the external-facing API — consumed by `firm-sdk`, Zapier/Make.com webhooks, client developer portals, and any third-party integration that cannot use tRPC. It is schema-first: the OpenAPI 3.1 specification is generated from `firm-validators` Zod schemas, not hand-written.

### OpenAPI Specification Generation

```typescript
// packages/firm-api-contracts/src/openapi/spec.ts
import { generateOpenApiDocument } from 'trpc-openapi'
import { appRouter } from '../trpc'

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'Firm Platform API',
  version: '1.0.0',
  baseUrl: 'https://api.firmplatform.com/v1',
  docsUrl: 'https://docs.firmplatform.com',
  tags: ['leads', 'forms', 'bookings', 'campaigns', 'analytics'],
})
```

### REST Endpoint Conventions

```
Base URL:     https://api.firmplatform.com/v1
Auth:         Bearer token (API key) via Authorization header
Tenant:       Derived from API key — never from URL or body
Pagination:   Cursor-based — ?cursor=&limit= (max 100)
Errors:       RFC 7807 Problem Details format
Rate limits:  X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset headers
```

### RFC 7807 Error Response Format

Every REST error response follows this format:

```json
{
  "type": "https://docs.firmplatform.com/errors/lead-not-found",
  "title": "Lead Not Found",
  "status": 404,
  "detail": "No lead with ID 'lead_abc123' exists in this tenant.",
  "instance": "/v1/leads/lead_abc123",
  "correlationId": "corr_xyz789"
}
```

### API Versioning Strategy

```
/v1/  — Current stable version
/v2/  — Next version (when breaking changes are required)

Deprecation policy:
- v1 remains supported for 12 months after v2 launch
- Deprecated endpoints return Sunset and Deprecation headers
- firm-sdk always points to the latest stable version
```

### REST Route Definitions

```typescript
// packages/firm-api-contracts/src/openapi/paths/leads.ts

// GET /v1/leads
// Query: cursor?, limit?, status?, assignedTo?
// Response: Paginated<Lead>
// Auth: API key with leads:read permission

// POST /v1/leads
// Body: CreateLeadInput (from createLeadSchema)
// Response: Lead
// Auth: API key with leads:create permission

// GET /v1/leads/:id
// Response: Lead
// Auth: API key with leads:read permission

// PATCH /v1/leads/:id
// Body: UpdateLeadInput (partial)
// Response: Lead
// Auth: API key with leads:update permission

// DELETE /v1/leads/:id
// Response: 204 No Content
// Auth: API key with leads:delete permission

// POST /v1/leads/:id/sync
// Triggers CRM sync for this lead
// Response: CRMSyncResult
// Auth: API key with leads:update permission
```

***

## 6.4 The Event Registry

The event registry in `firm-api-contracts` is the single catalog of every event that can flow through the platform. No code may insert into `outbox_events` with an `event_name` that is not registered in this catalog. The CI `boundary-check.ts` script enforces this.

### Registry Structure

```typescript
// packages/firm-api-contracts/src/events/registry.ts

export const EventRegistry = {
  // Tenant lifecycle
  'firm/tenant.provisioned': tenantProvisionedSchema,
  'firm/tenant.suspended': tenantSuspendedSchema,
  'firm/tenant.gdpr-erasure-requested': tenantGdprSchema,

  // Lead lifecycle
  'firm/lead.created': leadCreatedSchema,
  'firm/lead.updated': leadUpdatedSchema,
  'firm/lead.assigned': leadAssignedSchema,
  'firm/lead.stage-changed': leadStageChangedSchema,
  'firm/lead.synced': leadSyncedSchema,

  // Form events
  'firm/form.submitted': formSubmittedSchema,
  'firm/form.lead-created': formLeadCreatedSchema,

  // Campaign events
  'firm/campaign.started': campaignStartedSchema,
  'firm/campaign.step-completed': campaignStepCompletedSchema,
  'firm/campaign.completed': campaignCompletedSchema,
  'firm/lead.campaign-enrolled': leadCampaignEnrolledSchema,

  // Booking events
  'firm/booking.created': bookingCreatedSchema,
  'firm/booking.confirmed': bookingConfirmedSchema,
  'firm/booking.cancelled': bookingCancelledSchema,
  'firm/booking.reminder-due': bookingReminderDueSchema,

  // Payment events
  'firm/payment.succeeded': paymentSucceededSchema,
  'firm/payment.failed': paymentFailedSchema,
  'firm/subscription.cancelled': subscriptionCancelledSchema,

  // AI events
  'firm/ai.generation-completed': aiGenerationCompletedSchema,
  'firm/ai.budget-exhausted': aiBudgetExhaustedSchema,
  'firm/ai.budget-warning': aiBudgetWarningSchema,

  // Content events
  'firm/content.published': contentPublishedSchema,
  'firm/report.generated': reportGeneratedSchema,
  'firm/report.delivered': reportDeliveredSchema,

  // Integration events
  'firm/webhook.delivered': webhookDeliveredSchema,
  'firm/webhook.failed': webhookFailedSchema,
  'firm/crm.sync-completed': crmSyncCompletedSchema,

  // Notification events
  'firm/notification.sent': notificationSentSchema,
  'firm/email.delivered': emailDeliveredSchema,
  'firm/email.bounced': emailBouncedSchema,
  'firm/sms.delivered': smsDeliveredSchema,

  // Domain events
  'firm/domain.provisioned': domainProvisionedSchema,
  'firm/review.received': reviewReceivedSchema,
  'firm/social.post-published': socialPostPublishedSchema,
} as const

export type EventName = keyof typeof EventRegistry
```

### CloudEvents Compliance

Every event payload conforms to the CloudEvents 1.0 specification:

```typescript
interface CloudEvent<T> {
  specversion: '1.0'
  id: string              // Unique event ID (used for idempotency)
  source: string          // 'https://firmplatform.com/tenant/{tenantId}'
  type: EventName         // 'firm/lead.created'
  time: string            // ISO 8601 timestamp
  datacontenttype: 'application/json'
  data: T                 // Typed payload — validated against registry schema
}
```

### Inserting into the Outbox

```typescript
// The ONLY way to trigger async operations — no direct job enqueue
// This runs inside a database transaction with the business operation

async function createLead(
  tenantId: TenantId,
  input: CreateLeadInput
): Promise<Lead> {
  return withTenantContext(tenantId, async (db) => {
    // Business operation and outbox insert in ONE transaction
    const [lead] = await db.insert(leads).values({
      ...input,
      tenantId,
      id: generateId<'LeadId'>(),
    }).returning()

    // Outbox insert — same transaction — atomicity guaranteed
    await db.insert(outbox_events).values({
      tenantId,
      event_name: 'firm/lead.created',
      payload: {
        specversion: '1.0',
        id: generateSecureToken(),
        source: `https://firmplatform.com/tenant/${tenantId}`,
        type: 'firm/lead.created',
        time: new Date().toISOString(),
        datacontenttype: 'application/json',
        data: { tenantId, leadId: lead.id, sourceFormId: input.sourceFormId },
      },
      idempotency_key: `lead.created.${lead.id}`,
    })

    return lead
  })
}
```

***

## 6.5 The Transactional Outbox Pattern

### Why the Outbox Exists

Without the outbox, the naive implementation of "create a lead, then send a welcome email" looks like:

```typescript
// WRONG — if the process crashes between these two lines, the email is never sent
const lead = await db.insert(leads).values(input).returning()
await inngest.send({ name: 'firm/lead.created', data: { leadId: lead.id } })
```

With the outbox:
```typescript
// CORRECT — both the lead and the event are committed atomically
// If the process crashes, the outbox processor picks up the event on recovery
await db.transaction(async (tx) => {
  const lead = await tx.insert(leads).values(input).returning()
  await tx.insert(outbox_events).values({ event_name: 'firm/lead.created', ... })
})
// The outbox processor will eventually deliver this event — guaranteed
```

### `worker-outbox-processor` — The Delivery Engine

```typescript
// services/worker-outbox-processor/src/index.ts
// Runs every second — polls for pending outbox events and dispatches to Inngest

export const processOutbox = inngest.createFunction(
  { id: 'outbox-processor', concurrency: 10 },
  { cron: '* * * * * *' },           // Every second
  async ({ step }) => {

    const pending = await step.run('fetch-pending', async () => {
      // Superadmin role — bypasses RLS to process all tenants' events
      return db.select()
        .from(outbox_events)
        .where(
          and(
            eq(outbox_events.status, 'pending'),
            lte(outbox_events.scheduled_at, new Date()),
            lt(outbox_events.attempts, 5)   // Max retry attempts
          )
        )
        .limit(100)
        .for('update', { skipLocked: true })  // Prevents duplicate processing
    })

    await Promise.allSettled(
      pending.map(event =>
        step.run(`dispatch-${event.id}`, async () => {
          await markProcessing(event.id)

          try {
            await inngest.send({
              name: event.event_name as EventName,
              data: event.payload,
            })
            await markDelivered(event.id)
          } catch (error) {
            await markFailed(event.id, error.message)
            // After 5 failures: status = 'dead-lettered', alert fired
          }
        })
      )
    )
  }
)
```

### `FOR UPDATE SKIP LOCKED` — Concurrency Safety

The `FOR UPDATE SKIP LOCKED` clause on the outbox query is critical at 1,000 tenants with high concurrency. Without it, multiple processor instances could pick up the same event simultaneously, resulting in duplicate emails, duplicate CRM syncs, and duplicate webhook deliveries. `SKIP LOCKED` ensures each event is processed by exactly one processor instance at a time.

### Dead-Letter Handling

```typescript
// After 5 failed attempts, an event enters dead-letter status
// This triggers a Prometheus alert and a Slack notification

if (event.attempts >= 5) {
  await db.update(outbox_events)
    .set({ status: 'dead-lettered' })
    .where(eq(outbox_events.id, event.id))

  metrics.deadLetteredEvents.inc({ event_name: event.event_name })

  logger.error({
    tenantId: event.tenant_id,
    eventId: event.id,
    eventName: event.event_name,
    lastError: event.last_error,
  }, 'Event dead-lettered after 5 attempts')
}
```

***

## 6.6 Saga Orchestration with Inngest

Inngest sagas are long-running, multi-step workflows where each step can fail and retry independently. They implement the outbox pattern at a higher level — each step is itself idempotent, and compensation steps handle rollback.

### Anatomy of an Inngest Saga

```typescript
// services/worker-tenant-provisioning/src/functions/provision-tenant.ts

export const provisionTenant = inngest.createFunction(
  {
    id: 'provision-tenant',
    retries: 3,
    timeouts: { finish: '5m' },    // Full provisioning must complete in 5 minutes
  },
  { event: 'firm/tenant.provisioned' },
  async ({ event, step }) => {
    const { tenantId, vertical } = event.data

    // Each step.run() is independently retryable
    // If step 3 fails, steps 1 and 2 are not re-run

    const verticalProfile = await step.run('load-vertical-profile', async () => {
      return loadVerticalProfile(vertical)
    })

    await step.run('seed-tenant-database', async () => {
      await seedTenantDatabase(tenantId, verticalProfile)
    })

    await step.run('warm-tenant-cache', async () => {
      await warmTenantCache(tenantId)
    })

    await step.run('provision-subdomain', async () => {
      await provisionSubdomain(tenantId)
    })

    // Compensation example — if SSL provisioning fails,
    // the subdomain DNS record created in the previous step is cleaned up
    const sslResult = await step.run('provision-ssl', async () => {
      return provisionSSL(tenantId)
    }).catch(async (error) => {
      // Compensation step
      await step.run('cleanup-subdomain', async () => {
        await deleteSubdomain(tenantId)
      })
      throw error
    })

    await step.run('seed-superadmin-user', async () => {
      await seedSuperadminUser(tenantId)
    })

    await step.run('start-onboarding-workflow', async () => {
      await inngest.send({
        name: 'firm/onboarding.started',
        data: { tenantId },
      })
    })

    await step.run('record-provisioning-complete', async () => {
      await db.update(tenants)
        .set({ status: 'active' })
        .where(eq(tenants.id, tenantId))

      metrics.tenantProvisioned.inc()
    })
  }
)
```

### Campaign Sequence Saga

```typescript
// services/worker-campaigns/src/functions/execute-campaign.ts
// Executes a multi-step drip campaign with delays between steps

export const executeCampaign = inngest.createFunction(
  { id: 'execute-campaign', retries: 3 },
  { event: 'firm/campaign.started' },
  async ({ event, step }) => {
    const { tenantId, campaignId, leadId } = event.data

    const campaign = await step.run('load-campaign', async () => {
      return loadCampaign(tenantId, campaignId)
    })

    for (const campaignStep of campaign.steps) {

      // Wait until the scheduled send time
      if (campaignStep.delayMinutes > 0) {
        await step.sleep(
          `wait-before-step-${campaignStep.order}`,
          `${campaignStep.delayMinutes}m`
        )
      }

      // Check if lead is still enrolled (may have unsubscribed during delay)
      const isStillEnrolled = await step.run(
        `check-enrollment-${campaignStep.order}`,
        async () => checkEnrollment(tenantId, campaignId, leadId)
      )

      if (!isStillEnrolled) break

      // Execute the step based on type
      await step.run(`execute-step-${campaignStep.order}`, async () => {
        switch (campaignStep.type) {
          case 'email':
            return sendCampaignEmail(tenantId, campaignStep, leadId)
          case 'sms':
            return sendCampaignSMS(tenantId, campaignStep, leadId)
          case 'wait':
            break  // Already handled by step.sleep above
        }
      })

      await step.run(`record-step-complete-${campaignStep.order}`, async () => {
        return recordStepCompletion(tenantId, campaignId, leadId, campaignStep.id)
      })
    }

    await step.run('mark-campaign-complete', async () => {
      return markCampaignComplete(tenantId, campaignId, leadId)
    })
  }
)
```

### Saga Design Rules

**Every step must be idempotent.** If Inngest retries a step, running it twice must produce the same result as running it once. Achieve this with upsert operations and idempotency keys:
```typescript
// Idempotent email send — second call with same idempotency key is a no-op
await sendEmail({ idempotencyKey: `campaign-${stepId}-lead-${leadId}`, ...payload })
```

**Every destructive step needs a compensation step.** Any step that creates an external resource (DNS record, Stripe subscription, Cloudflare Worker) must have a cleanup step registered as a `catch` handler that runs if a subsequent step fails.

**Timeouts are mandatory.** Every saga has a `timeouts.finish` value. A saga without a timeout can run indefinitely, consuming Inngest concurrency slots and masking bugs.

***

## 6.7 Webhook Architecture

### Inbound Webhooks — The Verify-Deduplicate-Process Sequence

Every inbound webhook handler — from Stripe, Twilio, GoHighLevel, Meta, or any other provider — follows the same three-step sequence without exception:

```typescript
// apps/platform/platform-admin/app/api/webhooks/stripe/route.ts

export async function POST(request: Request) {

  // ── Step 1: Verify signature ───────────────────────────────────────────
  // Raw body MUST be read before any JSON parsing — parsers destroy the
  // raw bytes needed for HMAC verification
  const rawBody = await request.arrayBuffer()
  const signature = request.headers.get('stripe-signature')

  const isValid = verifyWebhookSignature(
    Buffer.from(rawBody),
    signature,
    stripeEnv.STRIPE_WEBHOOK_SECRET
  )

  if (!isValid) {
    logger.warn({ signature }, 'Webhook signature verification failed')
    return new Response('Unauthorized', { status: 401 })
  }

  // ── Step 2: Parse and prevent replay ──────────────────────────────────
  const event = JSON.parse(Buffer.from(rawBody).toString())
  const eventTimestamp = event.created  // Unix timestamp from Stripe

  // Reject events older than 5 minutes — prevents replay attacks
  if (Date.now() / 1000 - eventTimestamp > 300) {
    logger.warn({ eventId: event.id }, 'Webhook replay attempt rejected')
    return new Response('Event too old', { status: 400 })
  }

  // ── Step 3: Enforce idempotency ────────────────────────────────────────
  // The unique constraint on (tenant_id, idempotency_key) prevents
  // processing the same event twice if Stripe retries delivery
  try {
    await db.insert(outbox_events).values({
      tenantId,
      event_name: 'firm/billing.stripe-event',
      payload: event,
      idempotency_key: `stripe.${event.id}`,  // Stripe event ID is globally unique
    })
  } catch (error) {
    if (isUniqueConstraintViolation(error)) {
      // Already processed — return 200 to tell Stripe to stop retrying
      return new Response('Already processed', { status: 200 })
    }
    throw error
  }

  // ── Return immediately ─────────────────────────────────────────────────
  // Webhook handlers ALWAYS return 200 quickly
  // Actual processing happens asynchronously via the outbox
  return new Response('Accepted', { status: 200 })
}
```

### Why Return 200 Immediately

Stripe, Twilio, and every major webhook provider will retry delivery if they don't receive a 200 response within 5–10 seconds. If the handler waits for processing to complete (CRM sync, email send, database writes), it will time out on any slow operation, triggering retry storms. The correct pattern: accept the event into the outbox (fast), return 200, and process asynchronously.

### `firm-crypto` Webhook Verification

```typescript
// packages/firm-crypto/src/hmac.ts
// Used by every adapter's webhook verification — no adapter reimplements this

export function verifyWebhookSignature(
  rawBody: Buffer,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = hmacSha256(rawBody.toString(), secret)

  // timingSafeEqual prevents timing attacks on signature comparison
  return timingSafeEqual(expectedSignature, signature)
}
```

### Outbound Webhooks

The platform dispatches webhooks to client-configured endpoints (for Zapier, Make.com, and custom integrations):

```typescript
// packages/firm-webhooks/src/outbound.ts

export async function dispatchWebhook(
  tenantId: TenantId,
  endpoint: WebhookEndpoint,
  event: CloudEvent<unknown>
): Promise<void> {
  const payload = JSON.stringify(event)
  const signature = hmacSha256(payload, endpoint.signingSecret)

  const response = await fetch(endpoint.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Firm-Signature': signature,
      'X-Firm-Event': event.type,
      'X-Firm-Delivery': generateSecureToken(16),
      'X-Firm-Timestamp': Date.now().toString(),
    },
    body: payload,
    signal: AbortSignal.timeout(10_000),  // 10 second timeout
  })

  await db.insert(webhook_delivery_log).values({
    tenantId,
    endpointId: endpoint.id,
    eventType: event.type,
    statusCode: response.status,
    success: response.ok,
    deliveredAt: new Date(),
  })

  if (!response.ok) {
    throw new WebhookDeliveryError(endpoint.url, response.status)
    // Inngest will retry via the outbox pattern
  }
}
```

### Webhook Delivery Retry Schedule

```
Attempt 1: Immediate
Attempt 2: 5 minutes after failure
Attempt 3: 30 minutes after failure
Attempt 4: 2 hours after failure
Attempt 5: 12 hours after failure
After 5 failures: Dead-lettered, tenant admin notified
```

***

## 6.8 Real-Time Communication

### Server-Sent Events (SSE) — Browser Push

SSE is the platform's mechanism for pushing real-time updates to the browser. It is simpler than WebSockets, works through Vercel's edge network, and is sufficient for all platform real-time use cases (progress updates, notifications, live analytics tickers).

```typescript
// apps/platform/platform-campaigns/app/api/campaigns/[id]/progress/route.ts

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await requireSession(request)
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        )
      }

      // Subscribe to Redis pub/sub channel for this campaign
      const channel = `tenant:${session.tenantId}:campaign:${params.id}:progress`

      await subscribe(channel, (message) => {
        sendEvent(message)

        // Close stream when campaign completes
        if (message.status === 'completed') {
          controller.close()
        }
      })

      // Heartbeat every 15 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'))
      }, 15_000)

      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
```

### Redis Pub/Sub — Cross-Service Internal Broadcast

Redis pub/sub is used for internal cross-service broadcasts where multiple consumers need to react to the same event without polling:

```typescript
// packages/firm-cache/src/pubsub.ts

// Publishing — from any service when state changes
await tenantCache.publish(
  `campaign:${campaignId}:progress`,
  { sent: 450, total: 1000, status: 'running' }
)

// Subscribing — SSE route handler, admin dashboard, notification service
await tenantCache.subscribe(
  `campaign:${campaignId}:progress`,
  (message) => sendEvent(message)
)
```

**Redis pub/sub is for transient state only** — broadcast to currently connected clients. It does not guarantee delivery to consumers that are not currently subscribed. For guaranteed delivery, use the outbox + Inngest pattern.

***

## 6.9 The Public SDK — `firm-sdk`

`@firm/sdk` is the publicly published npm package that external developers use to interact with the platform API. It wraps the REST API with TypeScript type safety, automatic retry logic, and a developer-friendly interface.

### SDK Design

```typescript
// @firm/sdk usage (by external developers or Zapier/Make.com)

import { FirmClient } from '@firm/sdk'

const client = new FirmClient({
  apiKey: 'firm_live_xxxxxxxxxxxx',
  baseUrl: 'https://api.firmplatform.com/v1',
})

// Type-safe — types are imported from @firm/types (the only firm/* dependency)
const leads = await client.leads.list({ status: 'new', limit: 20 })
const lead = await client.leads.create({
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@example.com',
})

// Webhook verification helper — for Zapier/Make.com webhook steps
const isValid = client.webhooks.verify(rawBody, signature)
```

### SDK Internal Implementation

```typescript
// packages/firm-sdk/src/client.ts
// The SDK imports ONLY from @firm/types — no other @firm/* imports
// It has zero knowledge of the internal monorepo structure

export class FirmClient {
  private http: HttpClient

  constructor(config: FirmClientConfig) {
    this.http = new HttpClient({
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      retries: 3,
      timeout: 30_000,
    })

    this.leads = new LeadsResource(this.http)
    this.forms = new FormsResource(this.http)
    this.bookings = new BookingsResource(this.http)
    this.campaigns = new CampaignsResource(this.http)
    this.analytics = new AnalyticsResource(this.http)
    this.webhooks = new WebhooksHelper()
  }
}
```

### SDK Publishing

```
Package name:   @firm/sdk
Registry:       npm public registry
Versioning:     Semantic versioning — breaking changes increment major version
Auto-publish:   GitHub Actions on git tag v*.*.* (main branch only)
Types:          Bundled — no separate @types package needed
Node versions:  18+ (LTS), 20+ (recommended)
```

***

## 6.10 Complete API Request Lifecycle

This is the full journey of a typical API request — a platform app submitting a new lead from a form:

```
[Client Browser]
  User submits contact form on client site
        │
        ▼
[Cloudflare Edge — tenant-router worker]
  Resolves host → tenantId
  Injects X-Tenant-ID header (not trusted by app — for logging only)
        │
        ▼
[Next.js Middleware — apps/clients/client-acme-dental/middleware.ts]
  firm-consent: detectGPC(request)
    IF Sec-GPC: 1 → suppress all tracking
  Correlation ID generated: X-Correlation-ID header added
  Rate limit check: firm-rate-limiter (per-IP for form submissions)
  AsyncLocalStorage context populated: { tenantId, correlationId, ipAddress }
        │
        ▼
[Next.js Route Handler — app/api/forms/[formId]/route.ts POST]
  firm-security: validateCSRFToken()
  firm-validators: parse request body against formSubmissionSchema
    IF validation fails → 422 with RFC 7807 error response
  firm-consent: recordConsent() — store consent signals before lead creation
        │
        ▼
[firm-forms: processFormSubmission()]
  Turnstile CAPTCHA verification
  UTM parameter extraction from referer headers
  firm-db: withTenantContext(tenantId, async (db) => {
    INSERT form_submissions (...)
    INSERT leads (...)                    ← Lead created
    INSERT outbox_events (event: 'firm/lead.created')  ← Outbox event
    COMMIT
  })
        │
        ▼
[Response — 200 OK]
  { success: true, leadId: 'lead_xxx' }
  X-Correlation-ID: corr_yyy (echoed back for client-side logging)
        │
        ▼ (asynchronously — after response sent)
[worker-outbox-processor — picks up firm/lead.created]
        │
        ├──▶ [firm-leads: scoreLead()] → Lead score calculated, assigned to agent
        │         │
        │         └──▶ [adapters-crm-gohighlevel: syncContact()] → Lead synced to GHL
        │
        ├──▶ [firm-notifications: alertAssignedAgent()] → SMS + in-app notification
        │
        └──▶ [firm-campaigns: enrollInWelcomeSequence()]
                  │
                  └──▶ [worker-campaigns saga: executeCampaign()]
                            → Step 1: Send welcome email (immediately)
                            → Wait 2 days (Inngest step.sleep)
                            → Step 2: Send follow-up SMS
                            → Wait 5 days
                            → Step 3: Send case study email
```

# Marketing Agency Mono Repository Blueprint & Assessment
## Part 7 — Security & Compliance Architecture

***

> **Purpose of This Part:** This part defines every security control, compliance requirement, and enforcement mechanism in the platform. For AI coding agents: security is not a feature to be added later — it is a correctness property of every function you write. Every function that accepts user input validates it. Every function that accesses data verifies the caller has permission. Every function that logs output redacts PII. Every function that calls a webhook verifies the signature. These are not suggestions — they are acceptance criteria for every package.

***

## 7.1 Security Baseline

The security baseline defines the minimum security requirements that every package and application in the platform must meet. These are enforced by CI gates, not by code review alone.

### Input Validation — Every Layer

```typescript
// Rule: Validate at the entry point, trust within the service boundary
// tRPC procedures validate with Zod schemas from firm-validators
// REST handlers validate with the same schemas
// No raw request data ever reaches a database query or business logic function

// CORRECT pattern
export async function POST(request: Request) {
  const body = await request.json()
  const input = createLeadSchema.parse(body)  // Throws if invalid — 422 response
  return leadsService.create(tenantId, input) // Only reaches here if valid
}

// WRONG pattern — never do this
export async function POST(request: Request) {
  const body = await request.json()
  return leadsService.create(tenantId, body)  // Raw unvalidated input reaches service
}
```

### Output Sanitization

```typescript
// All HTML content rendered from user-supplied or AI-generated content
// must be sanitized before rendering to prevent XSS
// DOMPurify (client-side) and sanitize-html (server-side) are the approved libraries

import sanitizeHtml from 'sanitize-html'

const sanitized = sanitizeHtml(aiGeneratedContent, {
  allowedTags: ['p', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'strong', 'em'],
  allowedAttributes: { 'a': ['href', 'target', 'rel'] },
  allowedSchemes: ['https'],         // No http, no javascript:
  transformTags: {
    'a': (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, rel: 'noopener noreferrer' }
    })
  }
})
```

### HTTP Security Headers

Every application produced by `createNextConfig()` in `firm-config-next` emits these headers on every response:

```typescript
const securityHeaders = [
  // Content Security Policy — generated with nonce per request
  {
    key: 'Content-Security-Policy',
    value: buildCSPHeader(nonce, tenantConfig)
  },
  // HTTP Strict Transport Security — 2 year max-age with preload
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  // Prevent MIME type sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  // Prevent clickjacking
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  // Control referrer information
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  // Disable FLoC / Topics API
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  },
  // Cross-origin isolation
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin'
  },
  {
    key: 'Cross-Origin-Resource-Policy',
    value: 'same-site'
  },
]
```

### Content Security Policy Construction

The CSP is generated per-request using a nonce to allow specific inline scripts while blocking all others:

```typescript
// packages/firm-security/src/csp.ts

export function buildCSPHeader(
  nonce: string,
  tenantConfig: TenantCSPConfig
): string {
  const directives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,           // Only scripts with this nonce execute
      "'strict-dynamic'",           // Scripts loaded by nonced scripts are trusted
      // NO 'unsafe-inline' — ever
      // NO 'unsafe-eval' — ever
    ],
    'style-src': ["'self'", `'nonce-${nonce}'`],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'connect-src': [
      "'self'",
      'https://api.firmplatform.com',
      ...tenantConfig.allowedConnectSrc,  // Per-tenant additions (analytics endpoints)
    ],
    'frame-ancestors': ["'none'"],   // Equivalent to X-Frame-Options: DENY
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'upgrade-insecure-requests': [],
  }

  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`.trim())
    .join('; ')
}
```

### File Upload Security

```typescript
// packages/firm-storage/src/upload.ts

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
  'application/pdf',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  // 50MB

export async function validateUpload(
  file: File,
  tenantId: TenantId
): Promise<void> {
  // 1. Validate MIME type against allowlist — never trust Content-Type header alone
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new FileTypeNotAllowedError(file.type)
  }

  // 2. Validate file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new FileTooLargeError(file.size, MAX_FILE_SIZE_BYTES)
  }

  // 3. Validate magic bytes — the first bytes of the file reveal true type
  // A malicious actor can rename a .exe to .jpg — magic bytes cannot be faked
  const buffer = await file.arrayBuffer()
  const magicBytes = new Uint8Array(buffer.slice(0, 4))
  validateMagicBytes(magicBytes, file.type)

  // 4. Virus scanning via ClamAV (if configured)
  if (platformEnv.CLAMAV_HOST) {
    await scanForViruses(buffer)
  }

  // 5. Enforce storage quota
  await enforceQuota(tenantId, file.size)
}
```

***

## 7.2 Authentication Architecture

### Better Auth + Authentik OIDC

The platform uses Better Auth as the session management layer, with Authentik as the enterprise OIDC provider for SSO. The relationship:

- **Better Auth** manages session creation, token rotation, cookie security, and the session store (Redis-backed via `firm-cache`).
- **Authentik** handles enterprise SSO — OIDC/OAuth2 flows for tenants whose users authenticate via their own identity provider (Google Workspace, Microsoft Entra, Okta).
- **Direct auth methods** (email/password, magic link) go through Better Auth directly without Authentik.

```
Authentication Flow Decision Tree:

User attempts to sign in
          │
          ▼
Is this an enterprise tenant with SSO configured?
  YES → Redirect to Authentik OIDC authorization endpoint
         → User authenticates with their IdP (Google, Microsoft, Okta)
         → Authentik returns JWT → Better Auth creates session
  NO  → Email/password or magic link via Better Auth directly
         → Session created in Redis with signed cookie
```

### Session Lifecycle

```typescript
// Session cookie configuration — enforced by firm-auth
const sessionCookieConfig = {
  name: '__Secure-firm-session',
  httpOnly: true,           // Inaccessible to JavaScript
  secure: true,             // HTTPS only
  sameSite: 'lax',          // CSRF protection
  maxAge: 7 * 24 * 3600,   // 7 days (rolling)
  path: '/',
}

// Session rotation — new session token issued on privilege escalation
// (e.g., after MFA verification, before admin actions)
async function rotateSession(oldSessionId: string): Promise<string> {
  const session = await getSession(oldSessionId)
  await deleteSession(oldSessionId)           // Invalidate old session
  const newSessionId = generateSecureToken()
  await createSession(newSessionId, session.data)
  return newSessionId
}
```

### MFA Implementation

```typescript
// packages/firm-auth/src/mfa.ts

export async function setupTOTP(
  tenantId: TenantId,
  userId: UserId
): Promise<TOTPSetupResult> {
  const secret = generateTOTPSecret()
  const uri = generateTOTPUri(secret, userId, 'Firm Platform')

  // Store encrypted secret — never plaintext
  await db.update(users)
    .set({ totpSecret: encrypt(secret, authEnv.AUTH_SECRET) })
    .where(eq(users.id, userId))

  return {
    secret,
    uri,
    qrCode: await generateQRCode(uri),
    backupCodes: generateBackupCodes(8),  // 8 single-use backup codes
  }
}

export async function verifyTOTP(
  userId: UserId,
  code: string
): Promise<boolean> {
  const user = await getUser(userId)
  const secret = decrypt(user.totpSecret, authEnv.AUTH_SECRET)

  // Accept current window ± 1 window (30 second tolerance for clock skew)
  return verifyTOTPCode(code, secret, { window: 1 })
}
```

***

## 7.3 Authorization Architecture

### RBAC Implementation

```typescript
// packages/firm-auth/src/rbac.ts

// The complete permission map — source of truth for all authorization checks
const PERMISSIONS: Record<Role, Permission[]> = {
  superadmin: [...ALL_PERMISSIONS],
  tenantadmin: [
    'leads:*', 'campaigns:*', 'bookings:*', 'forms:*',
    'analytics:read', 'reporting:*', 'settings:manage',
    'users:manage', 'billing:manage', 'ai:generate',
    'content:*', 'proposals:*', 'invoicing:*',
  ],
  manager: [
    'leads:*', 'campaigns:*', 'bookings:*', 'forms:*',
    'analytics:read', 'reporting:read', 'ai:generate',
    'content:*',
  ],
  agent: [
    'leads:create', 'leads:read', 'leads:update',
    'bookings:create', 'bookings:read', 'bookings:update',
    'forms:read', 'analytics:read',
  ],
  user: [
    'bookings:create', 'bookings:read',
    'analytics:read',
  ],
  readonly: [
    'leads:read', 'campaigns:read', 'analytics:read',
    'reporting:read',
  ],
}

// requirePermission throws AuthorizationError if permission not granted
export function requirePermission(
  user: AuthenticatedUser,
  permission: Permission
): void {
  const userPermissions = PERMISSIONS[user.role] ?? []
  const hasPermission =
    userPermissions.includes(permission) ||
    userPermissions.includes(`${permission.split(':')[0]}:*`) ||
    userPermissions.includes('*')

  if (!hasPermission) {
    throw new AuthorizationError(
      `User ${user.id} with role ${user.role} lacks permission: ${permission}`
    )
  }
}
```

### API Key Permission Scoping

```typescript
// API keys can be scoped to a subset of the owning user's permissions
// A manager cannot create an API key with billing:manage permission
// (they don't have it themselves)

export async function createApiKey(
  tenantId: TenantId,
  creatingUser: AuthenticatedUser,
  config: {
    name: string
    permissions: Permission[]
    expiresAt?: Date
  }
): Promise<ApiKeyCreationResult> {
  // Validate requested permissions are a subset of creator's permissions
  const userPermissions = PERMISSIONS[creatingUser.role]
  const invalidPermissions = config.permissions.filter(
    p => !userPermissions.includes(p) && !userPermissions.includes(`${p.split(':')[0]}:*`)
  )

  if (invalidPermissions.length > 0) {
    throw new AuthorizationError(
      `Cannot create API key with permissions exceeding your own: ${invalidPermissions.join(', ')}`
    )
  }

  const { key, prefix, hash } = generateApiKeyPair()

  await db.insert(api_keys).values({
    tenantId,
    userId: creatingUser.id,
    name: config.name,
    prefix,
    keyHash: hash,
    permissions: config.permissions,
    expiresAt: config.expiresAt,
  })

  // Key is shown ONCE at creation — never retrievable again
  return { key, prefix, maskedKey: `${prefix}${'*'.repeat(24)}` }
}
```

### Impersonation — TOCTOU-Safe Implementation

```typescript
// packages/firm-auth/src/impersonation.ts

export async function startImpersonation(
  impersonatorId: UserId,
  targetTenantId: TenantId,
  targetUserId: UserId
): Promise<ImpersonationSession> {

  // TOCTOU-safe: verify permissions at the moment of impersonation
  // NOT at the moment the "impersonate" button was clicked
  const impersonator = await getUser(impersonatorId)
  requirePermission(impersonator, 'tenants:manage')

  // Verify target user exists in target tenant
  const targetUser = await getUserInTenant(targetUserId, targetTenantId)
  if (!targetUser) {
    throw new NotFoundError('Target user not found in specified tenant')
  }

  // Superadmin cannot be impersonated
  if (targetUser.role === 'superadmin') {
    throw new AuthorizationError('Cannot impersonate superadmin users')
  }

  // Create impersonation session — logged immutably to audit trail
  const session = await createSession({
    userId: targetUserId,
    tenantId: targetTenantId,
    impersonatorId,             // Preserved — all audit events show actual actor
    expiresAt: addHours(new Date(), 1),  // 1 hour max impersonation window
  })

  await auditLogger.log({
    tenantId: targetTenantId,
    userId: impersonatorId,
    action: 'auth.impersonation.started',
    resourceType: 'user',
    resourceId: targetUserId,
  })

  return session
}

// startImpersonationLegacy has been REMOVED from exports
// It bypassed TOCTOU validation — see Part 2, Issue #5
```

***

## 7.4 Multi-Tenant Isolation Guarantees

The complete specification of every isolation boundary in the platform:

### Database Isolation

```sql
-- The application database role NEVER has BYPASSRLS
-- All application queries run with RLS active
-- The setting is transaction-local (true as second argument)
-- — it does not persist after the transaction ends

-- CORRECT: tenant context set transaction-locally
BEGIN;
SELECT set_config('app.current_tenant_id', 'uuid-1234', true);
SELECT * FROM leads;  -- Returns only tenant uuid-1234's leads
COMMIT;
-- After COMMIT: app.current_tenant_id is cleared

-- Attempting to read another tenant's data returns 0 rows (not an error)
-- This is intentional — the application should handle empty results gracefully
```

### Cross-Tenant Isolation Tests

```typescript
// packages/firm-db/tests/rls-isolation.test.ts
// These tests MUST pass — they are acceptance criteria for firm-db

describe('RLS tenant isolation', () => {
  it('cannot read another tenant leads', async () => {
    const tenant1 = await createTestTenant()
    const tenant2 = await createTestTenant()

    // Create a lead for tenant1
    const lead = await withTenantContext(tenant1.id, (db) =>
      db.insert(leads).values({ tenantId: tenant1.id, ...testLeadData }).returning()
    )

    // Attempting to read it as tenant2 returns empty array
    const result = await withTenantContext(tenant2.id, (db) =>
      db.select().from(leads).where(eq(leads.id, lead[0].id))
    )

    expect(result).toHaveLength(0)  // Not an error — just empty
  })

  it('cannot update another tenant leads', async () => {
    // Same setup — attempting update as wrong tenant affects 0 rows
    const updateResult = await withTenantContext(tenant2.id, (db) =>
      db.update(leads)
        .set({ status: LeadStatus.Won })
        .where(eq(leads.id, lead[0].id))
        .returning()
    )
    expect(updateResult).toHaveLength(0)  // Silent failure — 0 rows affected
  })
})
```

### Cache Isolation

```typescript
// TenantCache makes cross-tenant cache access physically impossible
// Key structure: tenant:{tenantId}:{domain}:{key}

const tenant1Cache = new TenantCache('uuid-1234', redis)
const tenant2Cache = new TenantCache('uuid-5678', redis)

// tenant1Cache.set('config', data) stores at key: tenant:uuid-1234:config
// tenant2Cache.get('config') reads key: tenant:uuid-5678:config → null
// There is no API on TenantCache to read another tenant's keys
```

### Network Isolation (Cloudflare Workers)

```typescript
// infra/cloudflare/workers/tenant-router/index.ts
// Edge worker resolves tenantId from hostname BEFORE traffic reaches origin

export default {
  async fetch(request: Request): Promise<Response> {
    const host = new URL(request.url).hostname

    // Resolve tenant from host — custom domains + platform subdomains
    const tenantId = await resolveTenant(host)

    if (!tenantId) {
      return new Response('Tenant not found', { status: 404 })
    }

    // Forward to origin with tenant context header (for logging only)
    // The application independently verifies tenantId from session
    const modifiedRequest = new Request(request, {
      headers: {
        ...Object.fromEntries(request.headers),
        'X-Tenant-ID': tenantId,         // For logging — not trusted by app
        'X-Forwarded-Host': host,
      },
    })

    return fetch(modifiedRequest)
  },
}
```

***

## 7.5 Cryptographic Standards

All cryptographic operations in the platform use `firm-crypto`. No package implements its own cryptography.

### Key Derivation and Hashing

```typescript
// packages/firm-crypto/src/index.ts

// API key generation — produces a full key and its HMAC hash for storage
export function generateApiKeyPair(): {
  key: string      // 'firm_live_' + 32 bytes base64url — shown once
  prefix: string   // First 8 chars — stored for lookup
  hash: string     // HMAC-SHA256(key, secret) — stored in DB
} {
  const rawBytes = randomBytes(32)
  const key = `firm_live_${rawBytes.toString('base64url')}`
  const prefix = key.slice(0, 16)
  const hash = hmacSha256(key, authEnv.AUTH_API_KEY_SECRET)
  return { key, prefix, hash }
}

// Signing key for webhook signatures
export function signPayload(payload: string): string {
  return hmacSha256(payload, platformEnv.FIRM_SIGNING_KEY)
}

// Secure random token for CSRF, correlation IDs, nonces
export function generateSecureToken(byteLength = 32): string {
  return randomBytes(byteLength).toString('base64url')
}

// Timing-safe string comparison — for all security-sensitive comparisons
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do a comparison to prevent timing oracle on length
    timingSafeEqualBuffer(
      Buffer.from(a),
      Buffer.from(a)  // Compare a to itself — result discarded
    )
    return false
  }
  return timingSafeEqualBuffer(Buffer.from(a), Buffer.from(b))
}
```

### Encryption at Rest

```typescript
// For sensitive stored values (TOTP secrets, OAuth tokens, webhook secrets)
// AES-256-GCM authenticated encryption

export function encrypt(plaintext: string, key: string): string {
  const iv = randomBytes(12)               // 96-bit IV for GCM
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  // iv:tag:ciphertext — all base64url encoded
  return `${iv.toString('base64url')}:${tag.toString('base64url')}:${encrypted.toString('base64url')}`
}

export function decrypt(ciphertext: string, key: string): string {
  const [ivStr, tagStr, encryptedStr] = ciphertext.split(':')
  const iv = Buffer.from(ivStr, 'base64url')
  const tag = Buffer.from(tagStr, 'base64url')
  const encrypted = Buffer.from(encryptedStr, 'base64url')

  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv)
  decipher.setAuthTag(tag)
  return decipher.update(encrypted) + decipher.final('utf8')
}
```

***

## 7.6 Webhook Security Contract

The complete webhook security contract is mandatory for every adapter that receives inbound webhooks. Deviation is a security vulnerability, not a design choice.

### The Three-Function Contract

```typescript
// Every webhook-receiving adapter implements these three functions
// using firm-crypto — never custom implementations

// Function 1: Verify signature
// Purpose: Confirm the webhook came from the legitimate provider
// MUST use timingSafeEqual — standard === comparison enables timing attacks
export function verifyWebhookSignature(
  rawBody: Buffer,      // MUST be raw bytes — parsed JSON is insufficient
  signature: string,    // From provider-specific header (Stripe-Signature, etc.)
  secret: string        // From tenant's adapter configuration
): boolean {
  const expected = hmacSha256(rawBody.toString('utf-8'), secret)
  return timingSafeEqual(expected, extractSignatureValue(signature))
}

// Function 2: Prevent replay
// Purpose: Reject events older than 5 minutes
// Prevents attackers from capturing and replaying legitimate webhooks
export function preventReplay(
  eventTimestamp: number  // Unix timestamp from event payload
): void {
  const ageSeconds = Math.floor(Date.now() / 1000) - eventTimestamp
  if (ageSeconds > 300) {  // 5 minute tolerance
    throw new WebhookReplayError(ageSeconds)
  }
}

// Function 3: Enforce idempotency
// Purpose: Prevent duplicate processing when providers retry delivery
// The unique constraint in the DB is the enforcement mechanism
export async function enforceIdempotency(
  eventId: string,
  tenantId: TenantId
): Promise<'new' | 'duplicate'> {
  try {
    await db.insert(outbox_events).values({
      tenantId,
      event_name: 'webhook.received',
      idempotency_key: eventId,
      payload: {},           // Populated by caller after idempotency check
    })
    return 'new'
  } catch (error) {
    if (isUniqueConstraintViolation(error)) return 'duplicate'
    throw error
  }
}
```

### Provider-Specific Signature Verification

Each adapter handles the provider's specific signature format:

```typescript
// adapters-billing-stripe — Stripe uses 'v1=' prefix + timestamp in header
function extractStripeSignature(header: string): {
  timestamp: number
  signatures: string[]
} {
  const parts = header.split(',')
  const timestamp = parseInt(parts.find(p => p.startsWith('t='))?.slice(2) ?? '0')
  const signatures = parts
    .filter(p => p.startsWith('v1='))
    .map(p => p.slice(3))
  return { timestamp, signatures }
}

// Stripe's signed payload is: timestamp + '.' + rawBody
const signedPayload = `${timestamp}.${rawBody.toString()}`
const expected = hmacSha256(signedPayload, secret)
const isValid = signatures.some(sig => timingSafeEqual(expected, sig))
```

***

## 7.7 AI Security & Compliance

### Arcjet Prompt Injection Detection

Every AI generation call passes through Arcjet's prompt injection scanner before reaching the AI model:

```typescript
// packages/firm-ai/src/generate.ts

export async function generateContent(params: AIGenerationParams): Promise<AIResult> {

  // Step 1: Prompt injection scan
  const arcjetDecision = await arcjet.protect(params.prompt, {
    rules: [
      detectBot({ mode: ArcjetMode.LIVE }),
      shield({ mode: ArcjetMode.LIVE }),
    ]
  })

  if (arcjetDecision.isDenied()) {
    throw new PromptInjectionDetectedError(params.tenantId)
  }

  // Step 2: Token budget check (atomic)
  const budget = await tenantCache.atomicIncrement(
    `ai:tokens:${params.model}:${getCurrentBillingPeriod()}`,
    params.estimatedTokens,
    await getTenantTokenLimit(params.tenantId)
  )

  if (!budget.allowed) {
    throw new AIBudgetExhaustedError(params.tenantId, params.model, budget.current)
  }

  // Step 3: Data minimization — anonymize any PII before sending to model
  const sanitizedContext = anonymizeForAI(params.context)

  // Step 4: Generate via adapter
  const result = await aiAdapter.generate({
    ...params,
    context: sanitizedContext,
  })

  // Step 5: C2PA manifest generation
  const manifest = await generateC2PAManifest({
    tenantId: params.tenantId,
    model: params.model,
    task: params.task,
    contentHash: sha256(result.content),
    generatedAt: new Date(),
  })

  // Step 6: Log generation (includes C2PA manifest)
  await db.insert(ai_generation_log).values({
    tenantId: params.tenantId,
    userId: params.userId,
    task: params.task,
    model: params.model,
    tokensInput: result.usage.inputTokens,
    tokensOutput: result.usage.outputTokens,
    costUsd: calculateCost(params.model, result.usage),
    durationMs: result.durationMs,
    c2paManifest: manifest,
    contentHash: sha256(result.content),
    disclosed: false,  // Set to true when disclosure label is applied
  })

  // Step 7: Prometheus metrics
  metrics.aiTokensUsed.inc(
    { tenant_id: params.tenantId, model: params.model, task: params.task },
    result.usage.inputTokens + result.usage.outputTokens
  )

  return { ...result, manifest }
}
```

### C2PA Manifest — EU AI Act Article 50

```typescript
// packages/firm-security/src/c2pa.ts

export async function generateC2PAManifest(params: {
  tenantId: TenantId
  model: string
  task: string
  contentHash: string
  generatedAt: Date
}): Promise<C2PAManifest> {
  const manifest: C2PAManifest = {
    '@context': 'https://c2pa.org/v2',
    claim: {
      generator: 'firm-platform',
      generatorVersion: platformEnv.PLATFORM_VERSION,
      model: params.model,
      task: params.task,
      tenantId: params.tenantId,
      contentHash: params.contentHash,
      generatedAt: params.generatedAt.toISOString(),
      disclosureRequired: true,        // EU AI Act Article 50
      disclosureLabel: 'AI-generated', // Non-removable in rendering layer
    },
    signature: hmacSha256(
      JSON.stringify({ ...params }),
      platformEnv.FIRM_SIGNING_KEY
    ),
  }

  return manifest
}
```

### AI Disclosure Label Enforcement

```typescript
// packages/firm-ai-content/src/render.ts
// Disclosure label is structurally non-removable — it is part of the
// content wrapper component, not a conditional render based on a flag

export function AIContentWrapper({
  content,
  manifest,
}: {
  content: string
  manifest: C2PAManifest | null
}) {
  return (
    <article>
      {manifest?.claim.disclosureRequired && (
        // This element cannot be conditionally rendered away
        // It is rendered by the component, not controlled by the caller
        <div
          aria-label="AI-generated content disclosure"
          data-c2pa-manifest={JSON.stringify(manifest)}
          className="ai-disclosure-label"
        >
          AI-Generated Content
        </div>
      )}
      <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
    </article>
  )
}
```

### Token Budget Alert System

```typescript
// Grafana alert rule — AI budget warning
// In infra/prometheus/rules/alerts.yml

groups:
  - name: ai-budget
    rules:
      - alert: AITokenBudgetWarning
        expr: |
          (
            firm_ai_tokens_used_total
            / on(tenant_id) firm_tenant_token_budget
          ) > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Tenant {{ $labels.tenant_id }} at {{ $value | humanizePercentage }} of AI token budget"
          runbook: "https://docs.firmplatform.com/runbooks/ai-budget"

      - alert: AITokenBudgetExhausted
        expr: |
          (
            firm_ai_tokens_used_total
            / on(tenant_id) firm_tenant_token_budget
          ) >= 1.0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Tenant {{ $labels.tenant_id }} AI budget exhausted — generation blocked"
```

***

## 7.8 Privacy & Consent Architecture

### `firm-consent` Complete Implementation

```typescript
// packages/firm-consent/src/index.ts

// GPC Detection — Sec-GPC: 1 means all non-essential tracking is off
// No consent banner required when GPC is active — user has already signaled
export function detectGPC(request: Request): boolean {
  return request.headers.get('Sec-GPC') === '1'
}

// Google Consent Mode v3 signal dispatch
// Called after consent banner interaction or GPC detection
export function dispatchConsentSignals(signals: ConsentSignals): void {
  if (typeof window === 'undefined') return

  window.gtag?.('consent', 'update', {
    ad_storage: signals.adStorage ? 'granted' : 'denied',
    analytics_storage: signals.analyticsStorage ? 'granted' : 'denied',
    ad_user_data: signals.adUserData ? 'granted' : 'denied',
    ad_personalization: signals.adPersonalization ? 'granted' : 'denied',
  })
}

// Consent check — called before any tracking operation
export async function hasConsent(
  tenantId: TenantId,
  userId: UserId | null,
  ipAddress: string,
  consentType: ConsentType
): Promise<boolean> {
  // 1. Check cache first (TTL: 5 minutes)
  const cached = await tenantCache.get<boolean>(
    `consent:${userId ?? ipAddress}:${consentType}`
  )
  if (cached !== null) return cached

  // 2. Query most recent consent record
  const record = await db.select()
    .from(consent_records)
    .where(
      and(
        eq(consent_records.tenantId, tenantId),
        userId
          ? eq(consent_records.userId, userId)
          : eq(consent_records.ipAddress, ipAddress)
      )
    )
    .orderBy(desc(consent_records.createdAt))
    .limit(1)

  const result = record[0]?.[consentType] ?? false

  // 3. Cache result
  await tenantCache.set(
    `consent:${userId ?? ipAddress}:${consentType}`,
    result,
    300  // 5 minutes
  )

  return result
}
```

### Consent Banner Integration in Client Sites

```typescript
// apps/clients/_template/app/layout.tsx
// Consent gate is mandatory — inserted at the layout level

export default async function RootLayout({
  children,
}: { children: React.ReactNode }) {
  const tenantId = getTenantId()  // From AsyncLocalStorage context
  const tenantConfig = await getTenantConfig(tenantId)

  return (
    <html lang={tenantConfig.locale}>
      <body data-theme={tenantConfig.slug}>
        {/* Consent gate wraps all analytics/ads scripts */}
        <ConsentGate tenantId={tenantId} config={tenantConfig.consent}>
          {/* Analytics scripts only load after consent */}
          <AnalyticsProvider tenantId={tenantId} />
        </ConsentGate>

        {children}

        {/* Consent banner — shown to users without recorded consent */}
        <ConsentBanner tenantId={tenantId} version={tenantConfig.consent.bannerVersion} />
      </body>
    </html>
  )
}
```

***

## 7.9 Supply Chain Security

### GitHub Actions SHA Pinning

```yaml
# .github/workflows/ci.yml
# ALL third-party actions must be pinned to full commit SHA
# CI script scripts/check-gha-shas.ts fails build for any non-SHA pin

# CORRECT
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2

# WRONG — fails CI
- uses: actions/checkout@v4
- uses: actions/checkout@main
```

### pnpm Dependency Security Settings

```
# .npmrc — security settings

# Require 24-hour minimum age for new package versions
# Prevents supply chain attacks via newly published malicious versions
minimumReleaseAge=1440

# Block packages that use lifecycle scripts unless explicitly allowlisted
# Prevents malicious postinstall scripts
blockExoticSubdeps=true

# Only install packages from the configured registry
registry=https://registry.npmjs.org/

# Lockfile must be up to date — prevents lockfile injection attacks
frozen-lockfile=true
```

### SBOM Generation

```typescript
// scripts/sbom-generate.ts
// Runs on every production build — generates CycloneDX SBOM

import { execSync } from 'node:child_process'

async function generateSBOM() {
  // CycloneDX SBOM for the entire workspace
  execSync('pnpm cyclonedx-bom --output sbom.json --spec-version 1.4')

  // Upload to artifact storage for compliance records
  await uploadArtifact('sbom.json', `sboms/sbom-${Date.now()}.json`)

  logger.info('SBOM generated and uploaded successfully')
}
```

### SLSA Provenance

```yaml
# .github/workflows/deploy-vercel.yml
# SLSA Level 3 provenance attestation for all production deployments

- name: Generate SLSA provenance
  uses: slsa-framework/slsa-github-generator/.github/workflows/generator_generic_slsa3.yml@v2.0.0
  with:
    base64-subjects: ${{ needs.build.outputs.hashes }}
    upload-assets: true
```

***

## 7.10 Secrets Management

### Infisical Integration

```typescript
// packages/firm-env/src/secrets.ts
// Infisical is the secrets manager — no secrets in environment files

import { InfisicalClient } from '@infisical/sdk'

export async function loadSecrets(environment: 'development' | 'staging' | 'production') {
  const client = new InfisicalClient({
    auth: {
      universalAuth: {
        clientId: process.env.INFISICAL_CLIENT_ID!,
        clientSecret: process.env.INFISICAL_CLIENT_SECRET!,
      }
    }
  })

  const secrets = await client.listSecrets({
    environment,
    projectId: process.env.INFISICAL_PROJECT_ID!,
  })

  // Populate process.env from Infisical — firm-env then validates them
  for (const secret of secrets) {
    process.env[secret.secretKey] = secret.secretValue
  }
}
```

### Secret Rotation Policy

| Secret Type | Rotation Interval | Rotation Mechanism |
|---|---|---|
| `AUTH_SECRET` (session signing) | 90 days | Automated via Infisical + CI trigger |
| `AUTH_API_KEY_SECRET` (HMAC) | 90 days | Requires re-hashing all active API keys |
| `FIRM_SIGNING_KEY` (webhook signing) | 180 days | Double-signing window during transition |
| `FIRM_WEBHOOK_SECRET` | Per-tenant, on request | Self-serve via platform-admin |
| Database password | 90 days | Automated via Infisical + pgBouncer rotation |
| Redis auth token | 90 days | Automated via Upstash API |
| Adapter OAuth tokens | Provider-determined | Refresh token rotation in adapter packages |

### CI/CD Token Strategy

```yaml
# .github/workflows/ci.yml
# OIDC tokens for CI — no long-lived credentials stored in GitHub Secrets

permissions:
  id-token: write    # Required for OIDC
  contents: read

- name: Authenticate to cloud providers
  uses: google-github-actions/auth@71fee32a0bb7e97b4d33d548e7d957010649d8fa  # v2.1.4
  with:
    workload_identity_provider: ${{ vars.GCP_WORKLOAD_IDENTITY_PROVIDER }}
    # No static credentials — OIDC token exchanged for short-lived access token
```

***

## 7.11 Compliance Deadline Tracker

The four active legal deadlines, their exact requirements, the packages responsible, and the acceptance criteria for "done":

***

### Deadline 1 — NY Synthetic Performer Labeling
**Date:** June 9, 2026 — **28 days from document date**
**Regulation:** New York Labor Law §191-d (AI-generated performer likenesses)
**Requirement:** AI-generated content depicting performer likenesses must carry non-removable disclosure labels

**Packages responsible:** `firm-ai`, `firm-ai-content`, `firm-consent`

**Done when:**
- [ ] `AIContentWrapper` component renders non-removable "AI-Generated Content" label for all AI-generated content with `disclosureRequired: true` in C2PA manifest
- [ ] Disclosure label cannot be suppressed by the calling component (structural enforcement, not conditional logic)
- [ ] `ai_generation_log.disclosed` is set to `true` when content is first rendered with disclosure label
- [ ] CI test verifies that rendering `AIContentWrapper` with a C2PA manifest always includes the disclosure label in the rendered HTML

***

### Deadline 2 — Google Consent Mode v3
**Date:** June 15, 2026 — **34 days from document date**
**Regulation:** Google Advertising Policy
**Requirement:** All client sites serving EU users must implement Consent Mode v3 or lose Google Ads conversion data

**Packages responsible:** `firm-consent`, all `apps/clients/*`

**Done when:**
- [ ] `firm-consent` exports `dispatchConsentSignals()` implementing all four v3 signals: `ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization`
- [ ] Google tag (`gtag`) default state is `denied` for all signals — opt-in, not opt-out
- [ ] Signals update to `granted` upon user consent banner acceptance
- [ ] GPC header (`Sec-GPC: 1`) detection sets all signals to `denied` without showing banner
- [ ] `scripts/verify-security-headers.ts` extended to verify Consent Mode v3 signals are present on all client sites
- [ ] All 1,000 client sites audited — client sites without `<ConsentBanner />` fail CI

***

### Deadline 3 — CNIL Email Tracking Pixel Consent
**Date:** July 14, 2026 — **63 days from document date**
**Regulation:** French CNIL Guidelines on Email Tracking
**Requirement:** Email open/click tracking pixels require separate, prior, explicit consent for EU recipients

**Packages responsible:** `firm-consent`, `firm-email` (when built), `adapters-email-*`

**Done when:**
- [ ] `firm-email` checks `hasConsent(tenantId, userId, ipAddress, 'email_tracking')` before including tracking pixel in email body
- [ ] If consent is `false`, email is sent without tracking pixel — delivery is not blocked
- [ ] EU recipient detection uses timezone/locale from lead record — defaults to requiring consent if unknown
- [ ] `consent_records` stores `email_tracking` boolean column value with audit trail
- [ ] Integration test: email sent to EU recipient without email_tracking consent contains no `<img>` tracking pixel tags

***

### Deadline 4 — EU AI Act Article 50 (C2PA)
**Date:** August 2, 2026 — **82 days from document date**
**Regulation:** EU AI Act Article 50 — Transparency obligations for AI-generated content
**Requirement:** All AI-generated content must carry C2PA provenance manifests and non-removable disclosure labels

**Packages responsible:** `firm-security` (C2PA generation), `firm-ai` (manifest attachment), `firm-ai-content`, `firm-ai-seo`, `firm-ai-brand-voice`

**Done when:**
- [ ] `generateC2PAManifest()` in `firm-security` produces valid C2PA v2 format manifests for every AI generation
- [ ] Every `ai_generation_log` row has a non-null `c2pa_manifest` JSONB value
- [ ] `AIContentWrapper` renders `data-c2pa-manifest` attribute on the disclosure wrapper element
- [ ] Manifests are cryptographically signed with `FIRM_SIGNING_KEY` — tampering is detectable
- [ ] CI test: any AI generation that completes without producing a C2PA manifest fails
- [ ] All three AI content packages (`firm-ai-content`, `firm-ai-seo`, `firm-ai-brand-voice`) call `generateC2PAManifest()` — no AI package generates content without a manifest

# Marketing Agency Mono Repository Blueprint & Assessment
## Part 8 — Observability Architecture

***

> **Purpose of This Part:** This part defines the complete observability stack — structured logging with Pino and Loki, distributed tracing with OpenTelemetry and Tempo, metrics collection with Prometheus, dashboards in Grafana, and the seven alerting rules that define the platform's operational health contract. For AI coding agents: observability is not instrumentation added after a feature works — it is part of the feature's definition of done. A function that performs a database query without a span, a webhook handler that doesn't log its outcome, or an AI generation call without a token usage metric is incomplete code.

***

## 8.1 Observability Philosophy

The platform's observability stack is built around three signals — logs, traces, and metrics — each serving a distinct purpose in the operational workflow:

**Logs answer "what happened."** When a lead creation fails, the structured log line tells you exactly what inputs were received, what error was thrown, and which tenant and user triggered the operation. Every log line carries `correlationId`, `tenantId`, `traceId`, and `spanId` — the four fields that connect a log entry to every other event in the same request.

**Traces answer "where time was spent."** When a campaign step takes 4 seconds instead of 400ms, the distributed trace shows the waterfall: 3.2 seconds waiting for the CRM adapter, 400ms in the database, 100ms serializing the response. Without tracing, this is a guess. With tracing, it is a measurement.

**Metrics answer "is the system healthy right now."** Prometheus counters and histograms are the early warning system. When the `outbox_dead_letter_total` counter increments, an alert fires before any engineer notices a user complaint. When `p99` request latency crosses the SLO threshold, the alert fires before the SLA is breached.

### The Three Laws of Observability

**Every operation that crosses a service boundary gets a span.** Database queries, Redis operations, HTTP calls to adapters, Inngest event dispatches — each is wrapped in `createSpan()`. The span carries the result: success, failure, duration, and relevant attributes.

**Every error is logged at the point of throw, not the point of catch.** The function that detects the error has the most context. Log it there with full context, then re-throw. The catch block should not re-log the same error — it creates duplicate noise in Loki.

**Every business metric is a Prometheus counter or histogram, not a log query.** Counting "how many emails were sent this hour" via a Loki log query is fragile, slow, and expensive at 1,000 tenants. The `firm_email_sent_total` counter answers this instantly.

***

## 8.2 Structured Logging — Pino + Loki

### Log Format

Every log line produced by `firm-logger` is a structured JSON object. No freeform log strings. No `console.log`. Every line follows this schema:

```json
{
  "level": 30,
  "time": 1747095600000,
  "msg": "Lead created successfully",
  "namespace": "firm-leads",
  "correlationId": "corr_abc123def456",
  "tenantId": "uuid-1234-5678-90ab",
  "userId": "uuid-user-abcd-efgh",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "spanId": "00f067aa0ba902b7",
  "leadId": "lead_xyz789",
  "duration": 142,
  "v": 1
}
```

### Log Levels and When to Use Each

| Level | `logger.*` | When to Use |
|---|---|---|
| `trace` | `logger.trace()` | Highly verbose debugging — loop iterations, cache hits, branch decisions. Never enabled in production. |
| `debug` | `logger.debug()` | Diagnostic detail useful when troubleshooting — request parameters, adapter responses |
| `info` | `logger.info()` | Normal business events — lead created, campaign step executed, booking confirmed |
| `warn` | `logger.warn()` | Recoverable anomalies — rate limit approaching, webhook retry attempt, fallback used |
| `error` | `logger.error()` | Unrecoverable failures — database error, adapter timeout, saga compensation triggered |
| `fatal` | `logger.fatal()` | Process-level failures — startup failure, database connection lost. Always triggers PagerDuty. |

### Child Logger Pattern

```typescript
// packages/firm-leads/src/service.ts

// Each package creates a child logger at module initialization
// Child loggers inherit parent context and add the namespace
const logger = createLogger('firm-leads')

export async function createLead(
  tenantId: TenantId,
  input: CreateLeadInput
): Promise<Lead> {
  // Log at entry with relevant context
  logger.info({ tenantId, email: '[REDACTED]' }, 'Creating lead')

  return createSpan('leads.create', async (span) => {
    span.setAttributes({ 'tenant.id': tenantId })

    try {
      const lead = await withTenantContext(tenantId, async (db) => {
        return db.insert(leads).values({ ...input, tenantId }).returning()
      })

      // Log success with outcome
      logger.info(
        { tenantId, leadId: lead[0].id, duration: span.duration },
        'Lead created successfully'
      )

      return lead[0]
    } catch (error) {
      // Log at the throw site with full context — not in the caller
      logger.error(
        { tenantId, error: error.message, stack: error.stack },
        'Lead creation failed'
      )
      throw error  // Re-throw — do not swallow
    }
  })
}
```

### PII Redaction Configuration

```typescript
// packages/firm-logger/src/index.ts
// PII is redacted at the serializer level — before any log line leaves the process
// This means PII can never appear in Loki, regardless of what code passes to logger.*

export const redactionPaths = [
  // Direct field names
  'email', 'password', 'phone', 'ssn', 'creditCard',
  'token', 'secret', 'apiKey', 'authorization',
  'firstName', 'lastName', 'name',
  // Nested field access
  '*.email', '*.password', '*.phone', '*.token',
  '*.apiKey', '*.secret', '*.authorization',
  // Array item fields
  'leads[*].email', 'users[*].email', 'contacts[*].phone',
]

export function createLogger(namespace: string): Logger {
  return pino({
    level: platformEnv.NODE_ENV === 'production' ? 'info' : 'debug',
    redact: { paths: redactionPaths, censor: '[REDACTED]' },
    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
    },
    transport: platformEnv.NODE_ENV === 'production'
      ? {
          target: 'pino-loki',
          options: {
            host: platformEnv.LOKI_HOST,
            labels: { app: namespace, env: platformEnv.NODE_ENV },
          }
        }
      : {
          target: 'pino-pretty',
          options: { colorize: true },
        },
  }).child({ namespace })
}
```

### Loki Configuration

```yaml
# infra/loki/loki-config.yml

schema_config:
  configs:
    - from: 2026-01-01
      store: tsdb
      object_store: s3
      schema: v13
      index:
        prefix: loki_index_
        period: 24h

storage_config:
  tsdb_shipper:
    active_index_directory: /loki/tsdb-index
    cache_location: /loki/tsdb-cache
  aws:
    s3: s3://firm-platform-logs/loki

limits_config:
  retention_period: 2160h  # 90 days

compactor:
  working_directory: /loki/compactor
  retention_enabled: true
  retention_delete_delay: 2h
```

### Log Retention Policy

| Environment | Hot Storage (Loki) | Warm Storage (S3) | Cold Archive |
|---|---|---|---|
| Production | 30 days | 90 days | 1 year (compliance) |
| Staging | 7 days | 30 days | None |
| Development | Local only | None | None |

***

## 8.3 Distributed Tracing — OpenTelemetry + Tempo

### OTel SDK Initialization

```typescript
// packages/firm-observability/src/index.ts
// Called once at application startup — before any other code runs

import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus'

let sdk: NodeSDK | null = null

export function initObservability(config: ObservabilityConfig): void {
  if (sdk) return  // Idempotent — safe to call multiple times

  sdk = new NodeSDK({
    serviceName: config.serviceName,
    serviceVersion: config.serviceVersion,
    traceExporter: new OTLPTraceExporter({
      url: `${platformEnv.TEMPO_ENDPOINT}/v1/traces`,
    }),
    metricReader: new PrometheusExporter({
      port: 9090,
      endpoint: '/metrics',
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        // Auto-instruments: HTTP, fetch, pg, redis, inngest
        '@opentelemetry/instrumentation-fs': { enabled: false }, // Too noisy
      }),
    ],
  })

  sdk.start()

  // Graceful shutdown on process termination
  process.on('SIGTERM', async () => {
    await sdk?.shutdown()
  })
}
```

### Trace-Log Correlation

```typescript
// packages/firm-observability/src/correlation.ts
// Injects active span's traceId and spanId into every Pino log line

import { context, trace } from '@opentelemetry/api'

export function createCorrelatingLogger(baseLogger: Logger): Logger {
  return baseLogger.child({}, {
    // Custom serializer that injects trace context at log time
    serializers: {
      ...pino.stdSerializers,
    },
    // mixin runs on every log call — injects current span's trace context
    mixin() {
      const span = trace.getActiveSpan()
      if (!span) return {}
      const ctx = span.spanContext()
      return {
        traceId: ctx.traceId,
        spanId: ctx.spanId,
        traceFlags: ctx.traceFlags,
      }
    },
  })
}
```

### `createSpan` Helper

```typescript
// packages/firm-observability/src/spans.ts
// Wraps every cross-boundary operation in a traced span

export async function createSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes: Record<string, string | number | boolean> = {}
): Promise<T> {
  const tracer = trace.getTracer('firm-platform')

  return tracer.startActiveSpan(name, async (span) => {
    span.setAttributes(attributes)

    try {
      const result = await fn(span)
      span.setStatus({ code: SpanStatusCode.OK })
      return result
    } catch (error) {
      span.recordException(error as Error)
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message,
      })
      throw error
    } finally {
      span.end()
    }
  })
}
```

### Required Span Coverage

Every operation in this list must be wrapped in `createSpan()`. These are not optional instrumentation points — they are acceptance criteria:

| Operation | Span Name | Required Attributes |
|---|---|---|
| Database query | `db.{operation}.{table}` | `tenant.id`, `db.operation`, `db.table` |
| Redis operation | `cache.{operation}` | `tenant.id`, `cache.key_prefix` |
| Adapter operation | `adapter.{name}.{method}` | `tenant.id`, `adapter.name`, `adapter.provider` |
| Inngest event dispatch | `inngest.send.{event_name}` | `tenant.id`, `event.name` |
| AI generation | `ai.generate.{task}` | `tenant.id`, `ai.model`, `ai.task`, `ai.tokens_input` |
| Outbound webhook | `webhook.dispatch` | `tenant.id`, `webhook.endpoint`, `webhook.event_type` |
| Form submission | `form.submit` | `tenant.id`, `form.id` |
| Report generation | `report.generate` | `tenant.id`, `report.type` |

### Tempo Configuration

```yaml
# infra/tempo/tempo-config.yml

server:
  http_listen_port: 3200

distributor:
  receivers:
    otlp:
      protocols:
        http:
          endpoint: 0.0.0.0:4318

storage:
  trace:
    backend: s3
    s3:
      bucket: firm-platform-traces
      endpoint: s3.amazonaws.com
    wal:
      path: /var/tempo/wal
    local:
      path: /var/tempo/blocks

compactor:
  compaction:
    block_retention: 720h  # 30 days

query_frontend:
  search:
    max_duration: 168h     # 7 day search window
```

***

## 8.4 Metrics — Prometheus

### Complete Metric Registry

Every metric defined below is registered in `firm-observability`. No package defines its own Prometheus metric outside this registry — namespacing and label consistency are enforced centrally.

```typescript
// packages/firm-observability/src/metrics.ts

import { Counter, Histogram, Gauge, Registry } from 'prom-client'

export const register = new Registry()

// ── Request Metrics ──────────────────────────────────────────────────────

export const httpRequestDuration = new Histogram({
  name: 'firm_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code', 'tenant_id'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
})

export const httpRequestTotal = new Counter({
  name: 'firm_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'tenant_id'],
  registers: [register],
})

// ── Database Metrics ─────────────────────────────────────────────────────

export const dbQueryDuration = new Histogram({
  name: 'firm_db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['operation', 'table', 'tenant_id'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [register],
})

export const dbConnectionPoolSize = new Gauge({
  name: 'firm_db_connection_pool_size',
  help: 'Current database connection pool size',
  labelNames: ['state'],  // 'active', 'idle', 'waiting'
  registers: [register],
})

// ── Outbox Metrics ───────────────────────────────────────────────────────

export const outboxEventsPending = new Gauge({
  name: 'firm_outbox_events_pending',
  help: 'Number of pending outbox events',
  labelNames: ['event_name'],
  registers: [register],
})

export const outboxEventsProcessed = new Counter({
  name: 'firm_outbox_events_processed_total',
  help: 'Total outbox events processed',
  labelNames: ['event_name', 'status'],  // status: 'delivered' | 'failed' | 'dead_lettered'
  registers: [register],
})

export const outboxDeadLettered = new Counter({
  name: 'firm_outbox_dead_letter_total',
  help: 'Total outbox events dead-lettered after max retries',
  labelNames: ['event_name', 'tenant_id'],
  registers: [register],
})

// ── Adapter Metrics ──────────────────────────────────────────────────────

export const adapterOperationDuration = new Histogram({
  name: 'firm_adapter_operation_duration_seconds',
  help: 'Adapter operation duration in seconds',
  labelNames: ['adapter', 'operation', 'tenant_id'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
})

export const adapterErrors = new Counter({
  name: 'firm_adapter_errors_total',
  help: 'Total adapter operation errors',
  labelNames: ['adapter', 'operation', 'error_type', 'tenant_id'],
  registers: [register],
})

// ── AI Metrics ───────────────────────────────────────────────────────────

export const aiTokensUsed = new Counter({
  name: 'firm_ai_tokens_used_total',
  help: 'Total AI tokens consumed',
  labelNames: ['tenant_id', 'model', 'task', 'token_type'],  // token_type: 'input' | 'output'
  registers: [register],
})

export const aiGenerationDuration = new Histogram({
  name: 'firm_ai_generation_duration_seconds',
  help: 'AI content generation duration in seconds',
  labelNames: ['tenant_id', 'model', 'task'],
  buckets: [0.5, 1, 2, 5, 10, 20, 30, 60],
  registers: [register],
})

export const aiGenerationCost = new Counter({
  name: 'firm_ai_generation_cost_usd_total',
  help: 'Total AI generation cost in USD',
  labelNames: ['tenant_id', 'model', 'task'],
  registers: [register],
})

// ── Email & SMS Metrics ──────────────────────────────────────────────────

export const emailSentTotal = new Counter({
  name: 'firm_email_sent_total',
  help: 'Total emails sent',
  labelNames: ['tenant_id', 'provider', 'type'],  // type: 'campaign' | 'transactional' | 'notification'
  registers: [register],
})

export const emailBounceTotal = new Counter({
  name: 'firm_email_bounce_total',
  help: 'Total email bounces',
  labelNames: ['tenant_id', 'provider', 'bounce_type'],  // 'hard' | 'soft'
  registers: [register],
})

export const smsSentTotal = new Counter({
  name: 'firm_sms_sent_total',
  help: 'Total SMS messages sent',
  labelNames: ['tenant_id', 'provider'],
  registers: [register],
})

// ── Business Metrics ─────────────────────────────────────────────────────

export const leadsCreatedTotal = new Counter({
  name: 'firm_leads_created_total',
  help: 'Total leads created',
  labelNames: ['tenant_id', 'source'],  // source: 'form' | 'api' | 'import' | 'manual'
  registers: [register],
})

export const bookingsCreatedTotal = new Counter({
  name: 'firm_bookings_created_total',
  help: 'Total bookings created',
  labelNames: ['tenant_id', 'status'],
  registers: [register],
})

export const campaignsActiveGauge = new Gauge({
  name: 'firm_campaigns_active',
  help: 'Number of currently active campaigns',
  labelNames: ['tenant_id'],
  registers: [register],
})

// ── Tenant Metrics ───────────────────────────────────────────────────────

export const tenantsActiveGauge = new Gauge({
  name: 'firm_tenants_active',
  help: 'Total number of active tenants',
  registers: [register],
})

export const tenantProvisioningDuration = new Histogram({
  name: 'firm_tenant_provisioning_duration_seconds',
  help: 'Tenant provisioning duration in seconds',
  buckets: [5, 10, 20, 30, 45, 60, 90, 120],
  registers: [register],
})

// ── Cache Metrics ────────────────────────────────────────────────────────

export const cacheHitTotal = new Counter({
  name: 'firm_cache_hit_total',
  help: 'Total cache hits',
  labelNames: ['cache_domain', 'tenant_id'],
  registers: [register],
})

export const cacheMissTotal = new Counter({
  name: 'firm_cache_miss_total',
  help: 'Total cache misses',
  labelNames: ['cache_domain', 'tenant_id'],
  registers: [register],
})

// ── Webhook Metrics ──────────────────────────────────────────────────────

export const webhookInboundTotal = new Counter({
  name: 'firm_webhook_inbound_total',
  help: 'Total inbound webhooks received',
  labelNames: ['provider', 'event_type', 'status'],  // status: 'accepted' | 'rejected' | 'duplicate'
  registers: [register],
})

export const webhookOutboundTotal = new Counter({
  name: 'firm_webhook_outbound_total',
  help: 'Total outbound webhooks dispatched',
  labelNames: ['tenant_id', 'event_type', 'status'],  // status: 'delivered' | 'failed'
  registers: [register],
})
```

### Prometheus Scrape Configuration

```yaml
# infra/prometheus/prometheus.yml

global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - 'rules/alerts.yml'

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

scrape_configs:
  # Platform applications — each exposes :9090/metrics
  - job_name: 'platform-apps'
    static_configs:
      - targets:
          - 'platform-portal:9090'
          - 'platform-analytics:9090'
          - 'platform-crm:9090'
          - 'platform-campaigns:9090'
          - 'platform-booking:9090'
          - 'platform-admin:9090'

  # Background workers
  - job_name: 'workers'
    static_configs:
      - targets:
          - 'worker-outbox-processor:9090'
          - 'worker-campaigns:9090'
          - 'worker-crm-sync:9090'
          - 'worker-ai-generation:9090'
          - 'worker-tenant-provisioning:9090'

  # Infrastructure
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
```

***

## 8.5 The Seven Alert Rules

These seven rules define the platform's health contract. When any of these alert fires, it means a client is being harmed or is about to be harmed. All seven alerts are defined in `infra/prometheus/rules/alerts.yml` and are the only authoritative source for alerting thresholds.

```yaml
# infra/prometheus/rules/alerts.yml

groups:
  - name: firm-platform-slos
    rules:

      # ── Alert 1: Error Rate SLO ─────────────────────────────────────────
      - alert: HighErrorRate
        expr: |
          (
            sum(rate(firm_http_requests_total{status_code=~"5.."}[5m]))
            /
            sum(rate(firm_http_requests_total[5m]))
          ) > 0.01
        for: 2m
        labels:
          severity: critical
          team: platform
        annotations:
          summary: "Error rate {{ $value | humanizePercentage }} exceeds 1% SLO"
          description: |
            The platform-wide HTTP error rate has exceeded 1% for 2 minutes.
            This indicates a systemic failure affecting all tenants.
            Current rate: {{ $value | humanizePercentage }}
          runbook: "https://docs.firmplatform.com/runbooks/high-error-rate"
          dashboard: "https://grafana.firmplatform.com/d/platform-overview"

      # ── Alert 2: Latency SLO ────────────────────────────────────────────
      - alert: HighLatencyP99
        expr: |
          histogram_quantile(
            0.99,
            sum(rate(firm_http_request_duration_seconds_bucket[5m])) by (le, route)
          ) > 2.0
        for: 5m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "P99 latency {{ $value }}s exceeds 2s SLO on route {{ $labels.route }}"
          description: |
            The 99th percentile request latency has exceeded 2 seconds for 5 minutes.
            Route: {{ $labels.route }}
            Current P99: {{ $value }}s
          runbook: "https://docs.firmplatform.com/runbooks/high-latency"

      # ── Alert 3: Outbox Dead Letters ────────────────────────────────────
      - alert: OutboxDeadLetter
        expr: |
          increase(firm_outbox_dead_letter_total[10m]) > 0
        for: 1m
        labels:
          severity: critical
          team: platform
        annotations:
          summary: "{{ $value }} outbox events dead-lettered for tenant {{ $labels.tenant_id }}"
          description: |
            One or more outbox events have exhausted all retry attempts and been dead-lettered.
            This means async operations (email, CRM sync, webhooks) are permanently failing
            for the affected tenant.
            Event type: {{ $labels.event_name }}
            Tenant: {{ $labels.tenant_id }}
          runbook: "https://docs.firmplatform.com/runbooks/outbox-dead-letter"

      # ── Alert 4: AI Budget Warning ──────────────────────────────────────
      - alert: AITokenBudgetWarning
        expr: |
          (
            sum by (tenant_id) (firm_ai_tokens_used_total)
            /
            sum by (tenant_id) (firm_tenant_token_budget)
          ) > 0.8
        for: 5m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "Tenant {{ $labels.tenant_id }} at {{ $value | humanizePercentage }} of AI token budget"
          description: |
            A tenant has consumed more than 80% of their monthly AI token budget.
            If they reach 100%, all AI generation will be blocked until the billing period resets.
            Tenant: {{ $labels.tenant_id }}
            Usage: {{ $value | humanizePercentage }}
          runbook: "https://docs.firmplatform.com/runbooks/ai-budget"

      # ── Alert 5: AI Budget Exhausted ────────────────────────────────────
      - alert: AITokenBudgetExhausted
        expr: |
          (
            sum by (tenant_id) (firm_ai_tokens_used_total)
            /
            sum by (tenant_id) (firm_tenant_token_budget)
          ) >= 1.0
        for: 1m
        labels:
          severity: critical
          team: platform
        annotations:
          summary: "Tenant {{ $labels.tenant_id }} AI budget EXHAUSTED — generation blocked"
          description: |
            A tenant has exhausted their monthly AI token budget.
            All AI content generation calls are now returning AIBudgetExhaustedError.
            Immediate action: contact tenant to upgrade plan or purchase add-on tokens.
            Tenant: {{ $labels.tenant_id }}
          runbook: "https://docs.firmplatform.com/runbooks/ai-budget-exhausted"

      # ── Alert 6: Adapter Error Rate ─────────────────────────────────────
      - alert: AdapterHighErrorRate
        expr: |
          (
            sum by (adapter) (rate(firm_adapter_errors_total[5m]))
            /
            sum by (adapter) (rate(firm_adapter_operation_duration_seconds_count[5m]))
          ) > 0.05
        for: 5m
        labels:
          severity: warning
          team: integrations
        annotations:
          summary: "Adapter {{ $labels.adapter }} error rate {{ $value | humanizePercentage }} exceeds 5%"
          description: |
            An integration adapter is experiencing elevated error rates.
            This may indicate a third-party service outage or API credential expiration.
            Adapter: {{ $labels.adapter }}
            Error rate: {{ $value | humanizePercentage }}
          runbook: "https://docs.firmplatform.com/runbooks/adapter-errors"

      # ── Alert 7: Tenant Provisioning Timeout ────────────────────────────
      - alert: TenantProvisioningTimeout
        expr: |
          histogram_quantile(
            0.95,
            rate(firm_tenant_provisioning_duration_seconds_bucket[30m])
          ) > 60
        for: 10m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "Tenant provisioning P95 {{ $value }}s exceeds 60s SLO"
          description: |
            Tenant provisioning is taking longer than the 60-second SLO at the 95th percentile.
            New tenants are experiencing degraded onboarding.
            Current P95: {{ $value }}s
          runbook: "https://docs.firmplatform.com/runbooks/tenant-provisioning"
```

***

## 8.6 Grafana Dashboards

### Dashboard 1: Platform Overview

```
Panel Layout — platform-overview.json
┌─────────────────────────────────────────────────────────────────┐
│  Active Tenants  │  Requests/min  │  Error Rate  │  P99 Latency  │
│  [Gauge: 127]    │  [Gauge: 4.2k] │  [Gauge: 0.3%│  [Gauge: 312ms│
├─────────────────────────────────────────────────────────────────┤
│  HTTP Error Rate (5xx) over time — 24h time series              │
│  ─────────────────────────────────────────────────────────────  │
├──────────────────────────┬──────────────────────────────────────┤
│  P50/P95/P99 Latency     │  Active Alerts                       │
│  by route — 24h          │  [Table: severity, name, duration]   │
├──────────────────────────┴──────────────────────────────────────┤
│  Outbox Events            │  Dead Letter Queue                   │
│  Pending / Processed rate │  Events by tenant — 24h             │
└─────────────────────────────────────────────────────────────────┘
```

**Key panels and their PromQL:**

```promql
# Active tenants
firm_tenants_active

# Request rate
sum(rate(firm_http_requests_total[5m]))

# Error rate percentage
100 * sum(rate(firm_http_requests_total{status_code=~"5.."}[5m]))
    / sum(rate(firm_http_requests_total[5m]))

# P99 latency across all routes
histogram_quantile(0.99, sum(rate(firm_http_request_duration_seconds_bucket[5m])) by (le))

# Outbox queue depth by event type
sum by (event_name) (firm_outbox_events_pending)

# Dead-lettered events rate
sum by (event_name) (rate(firm_outbox_dead_letter_total[1h]))
```

***

### Dashboard 2: Tenant Analytics

```
Panel Layout — tenant-analytics.json
Variable: $tenant_id (dropdown, populated from firm_leads_created_total label values)
┌─────────────────────────────────────────────────────────────────┐
│  Leads Created (30d)  │  Bookings (30d)  │  Emails Sent (30d)   │
│  [Stat: 847]          │  [Stat: 234]     │  [Stat: 12,430]      │
├─────────────────────────────────────────────────────────────────┤
│  Lead Creation Rate — 30 day time series                        │
│  ─────────────────────────────────────────────────────────────  │
├──────────────────────────┬──────────────────────────────────────┤
│  Leads by source         │  Campaign Performance                │
│  [Pie: form/api/import]  │  [Table: name, sent, opens, clicks]  │
├──────────────────────────┴──────────────────────────────────────┤
│  AI Token Usage vs Budget  │  Storage Quota Usage               │
│  [Gauge: 67%]              │  [Gauge: 42%]                      │
└─────────────────────────────────────────────────────────────────┘
```

***

### Dashboard 3: AI Cost Tracker

```
Panel Layout — ai-cost-tracker.json
┌─────────────────────────────────────────────────────────────────┐
│  Total Cost Today  │  Cost This Month  │  Top Consumer (tenant)  │
│  [$142.50]         │  [$3,847.20]      │  [tenant: acme-dental]  │
├─────────────────────────────────────────────────────────────────┤
│  Cost by Model — 30 day time series                             │
│  claude-sonnet-4-5 / gpt-4o / gemini-1.5-pro stacked area chart│
├──────────────────────────┬──────────────────────────────────────┤
│  Tokens by Task          │  Cost by Tenant — Top 20             │
│  [Bar: task vs tokens]   │  [Horizontal bar chart]              │
├──────────────────────────┴──────────────────────────────────────┤
│  Tenants Near Budget Limit                                      │
│  [Table: tenant_id, budget, used, %, days_remaining]           │
└─────────────────────────────────────────────────────────────────┘
```

**Key panels PromQL:**

```promql
# Total cost today
sum(increase(firm_ai_generation_cost_usd_total[24h]))

# Cost by model
sum by (model) (increase(firm_ai_generation_cost_usd_total[30d]))

# Token usage by task
sum by (task) (increase(firm_ai_tokens_used_total[30d]))

# Tenants near budget (>80%)
topk(20,
  sum by (tenant_id) (firm_ai_tokens_used_total)
  / sum by (tenant_id) (firm_tenant_token_budget)
)
```

***

### Dashboard 4: Adapter Health

```
Panel Layout — adapter-health.json
┌─────────────────────────────────────────────────────────────────┐
│  Adapter Status Overview — color-coded by error rate            │
│  [Table: adapter, ops/min, error_rate, p99_latency, status]    │
├─────────────────────────────────────────────────────────────────┤
│  Error Rate by Adapter — 24h time series                        │
├──────────────────────────┬──────────────────────────────────────┤
│  P99 Latency by Adapter  │  Error Types Breakdown               │
│  [Line chart]            │  [Stacked bar: by error_type]        │
├──────────────────────────┴──────────────────────────────────────┤
│  Webhook Inbound Rate     │  Webhook Delivery Success Rate       │
│  [Time series by provider]│  [Gauge per provider]               │
└─────────────────────────────────────────────────────────────────┘
```

***

### Dashboard 5: CI/CD Metrics

```
Panel Layout — cicd-metrics.json
Variables: $branch, $date_range
┌─────────────────────────────────────────────────────────────────┐
│  Build Success Rate  │  Avg Build Time  │  Cache Hit Rate        │
│  [Gauge: 98.2%]      │  [Stat: 4m 12s]  │  [Gauge: 87%]         │
├─────────────────────────────────────────────────────────────────┤
│  Build Duration Trend — 30 day time series                      │
├──────────────────────────┬──────────────────────────────────────┤
│  Test Pass Rate by pkg   │  Failing CI Gates — last 7 days      │
│  [Table: pkg, pass%, cnt]│  [Table: gate, failures, last_fail]  │
└──────────────────────────┴──────────────────────────────────────┘
```

***

## 8.7 Health Check Specification

### `/api/health` — Required on Every Application

```typescript
// packages/firm-health/src/index.ts

export function createHealthRouter(checkers: HealthChecker[]): {
  GET: (req: Request) => Promise<Response>
} {
  return {
    async GET(req: Request) {
      const start = Date.now()
      const results: Record<string, HealthCheckResult> = {}
      let overallHealthy = true

      await Promise.allSettled(
        checkers.map(async (checker) => {
          const checkStart = Date.now()
          try {
            const result = await Promise.race([
              checker.check(),
              // 5 second timeout per check
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Health check timeout')), 5000)
              )
            ])
            results[checker.name] = {
              ok: result.ok,
              latencyMs: Date.now() - checkStart,
            }
            if (!result.ok) overallHealthy = false
          } catch (error) {
            results[checker.name] = {
              ok: false,
              latencyMs: Date.now() - checkStart,
              error: (error as Error).message,
            }
            overallHealthy = false
          }
        })
      )

      const body = {
        status: overallHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        version: platformEnv.PLATFORM_VERSION,
        uptime: process.uptime(),
        checks: results,
      }

      return Response.json(body, {
        status: overallHealthy ? 200 : 503,
      })
    }
  }
}
```

### Standard Health Checkers

```typescript
// packages/firm-health/src/checkers.ts

export const databaseHealthChecker: HealthChecker = {
  name: 'database',
  async check() {
    const start = Date.now()
    await db.execute(sql`SELECT 1`)
    return { ok: true, latencyMs: Date.now() - start }
  },
}

export const redisHealthChecker: HealthChecker = {
  name: 'redis',
  async check() {
    const start = Date.now()
    await redis.ping()
    return { ok: true, latencyMs: Date.now() - start }
  },
}

export const outboxQueueDepthChecker: HealthChecker = {
  name: 'outbox_queue',
  async check() {
    const depth = await db.select({ count: count() })
      .from(outbox_events)
      .where(eq(outbox_events.status, 'pending'))

    const queueDepth = depth[0].count
    // Warn if queue depth exceeds 10,000 — indicates processor is falling behind
    return {
      ok: queueDepth < 10_000,
      latencyMs: 0,
      queueDepth,
      error: queueDepth >= 10_000 ? `Queue depth ${queueDepth} exceeds threshold` : undefined,
    }
  },
}
```

### Liveness vs Readiness

```typescript
// apps/platform/platform-crm/app/api/health/route.ts
// Liveness: is the process alive? (used by container orchestration)
// Readiness: is the process ready to receive traffic? (used by load balancer)

export const { GET } = createHealthRouter([
  // Liveness — minimal checks, fast
  // If these fail, the container is restarted
  databaseHealthChecker,
  redisHealthChecker,

  // Readiness — comprehensive checks
  // If these fail, traffic is not routed to this instance
  outboxQueueDepthChecker,
  inngestConnectivityChecker,
])
```

***

## 8.8 Local Observability Stack

The complete observability stack runs locally via `docker-compose.dev.yml`. A developer working on a feature that sends emails sees the full trace from HTTP request → form handler → outbox insert → outbox processor → email adapter, in Grafana Tempo, with log lines from Loki correlated by `traceId`, and Prometheus metrics updating in real-time.

```yaml
# infra/docker/docker-compose.dev.yml (observability services)

services:
  prometheus:
    image: prom/prometheus:v2.54.0
    ports:
      - "9090:9090"
    volumes:
      - ../prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ../prometheus/rules:/etc/prometheus/rules

  grafana:
    image: grafana/grafana:11.3.0
    ports:
      - "3001:3000"
    environment:
      GF_AUTH_ANONYMOUS_ENABLED: "true"
      GF_AUTH_ANONYMOUS_ORG_ROLE: "Admin"
    volumes:
      - ../grafana/dashboards:/var/lib/grafana/dashboards
      - ./grafana-provisioning:/etc/grafana/provisioning

  loki:
    image: grafana/loki:3.2.0
    ports:
      - "3100:3100"
    volumes:
      - ../loki/loki-config.yml:/etc/loki/local-config.yml

  tempo:
    image: grafana/tempo:2.6.0
    ports:
      - "3200:3200"
      - "4318:4318"    # OTel HTTP receiver
    volumes:
      - ../tempo/tempo-config.yml:/etc/tempo.yml

  alertmanager:
    image: prom/alertmanager:v0.27.0
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml
```
# Marketing Agency Mono Repository Blueprint & Assessment
## Part 9 — Build System & CI/CD Pipeline

***

> **Purpose of This Part:** This part defines the complete build system, CI/CD pipeline, deployment targets, environment strategy, and the fifteen CI gates that every PR must pass before merging. For AI coding agents: the CI pipeline is not a bureaucratic obstacle — it is the automated specification checker. When a CI gate fails, it means the code does not meet the platform's specification. The correct response is to fix the code, not to disable the gate.

***

## 9.1 Build System Architecture

### Turborepo Pipeline Model

Turborepo executes the build pipeline as a directed acyclic graph. Each task declares its inputs, outputs, and dependencies. Turborepo computes which packages need rebuilding based on content hashes of inputs — unchanged packages are served from cache.

```
Build Graph (simplified — selected dependency paths shown):

firm-tokens ──────────────────────────────────────────────► firm-ui
                                                              │
firm-config-typescript ────► [all packages] ─────────────────┤
                                                              │
firm-env ──────────────────► firm-logger ────────────────────┤
                              firm-crypto                     │
                              firm-request-context            │
                              firm-errors                     │
                              firm-utils                      │
                                │                             │
firm-types ────────────────────►│                             │
firm-validators ───────────────►│                             │
                                ▼                             │
                              firm-db ──────────────────────►│
                              firm-cache                      │
                              firm-auth                       │
                              firm-security                   │
                              firm-consent                    │
                                │                             │
                                ▼                             ▼
                              [Layer 6 feature packages] ──► [apps]
                                │
                                ▼
                              [Layer 7 adapters]
```

### `turbo.json` — Complete Pipeline Definition

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "ui": "tui",
  "globalEnv": [
    "NODE_ENV",
    "VERCEL_ENV",
    "DATABASE_URL",
    "REDIS_URL"
  ],
  "tasks": {
    "tokens:build": {
      "inputs": ["src/tokens/**", "style-dictionary.config.ts"],
      "outputs": ["dist/css/**", "dist/ts/**", "dist/tailwind/**"],
      "cache": true
    },
    "build": {
      "dependsOn": ["^build", "tokens:build"],
      "inputs": ["src/**", "package.json", "tsconfig.json"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"],
      "cache": true,
      "env": ["DATABASE_URL", "REDIS_URL", "AUTH_SECRET"]
    },
    "test": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "tests/**"],
      "outputs": ["coverage/**"],
      "cache": true
    },
    "test:integration": {
      "dependsOn": ["^build", "db:migrate:test"],
      "inputs": ["src/**", "tests/**"],
      "outputs": ["coverage/**"],
      "cache": false
    },
    "lint": {
      "inputs": ["src/**", ".eslintrc*", "eslint.config.*"],
      "outputs": [],
      "cache": true
    },
    "type-check": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "tsconfig.json"],
      "outputs": [],
      "cache": true
    },
    "boundary:check": {
      "inputs": ["src/**"],
      "outputs": [],
      "cache": true
    },
    "db:generate": {
      "inputs": ["src/schema/**"],
      "outputs": ["drizzle/migrations/**"],
      "cache": false
    },
    "db:migrate:test": {
      "dependsOn": ["db:generate"],
      "cache": false
    },
    "storybook:build": {
      "dependsOn": ["^build", "tokens:build"],
      "outputs": ["storybook-static/**"],
      "cache": true
    },
    "infra:sync": {
      "dependsOn": ["build"],
      "cache": false
    }
  }
}
```

### Remote Cache Strategy

```
Turborepo Remote Cache:
  Provider: Vercel Remote Cache (built-in with Vercel Pro)
  Cache key: hash(inputs + node_version + os_arch)
  Cache hit rate target: > 85% on PR builds
  Cache invalidation: automatic on input change

Local cache: ~/.turbo/cache
CI cache: Vercel Remote Cache (shared across all CI runs)

Why this matters at 145 packages:
  Cold build (no cache):  ~18 minutes
  Warm build (85% hit):   ~2.5 minutes
  Hot build (100% hit):   ~45 seconds (lint + type-check only)
```

***

## 9.2 The Fifteen CI Gates

Every PR must pass all fifteen gates before merge is permitted. Gates 1–7 run in parallel on every push. Gates 8–13 require the build to complete. Gates 14–15 run on the build artifacts.

### Gate Execution Order

```
Push to PR branch
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│  PARALLEL GROUP A (no build required)                     │
│  Gate 1: ESLint (max-warnings 0)                          │
│  Gate 2: TypeScript type-check                            │
│  Gate 3: Layer boundary check                             │
│  Gate 4: GHA SHA pinning check                            │
│  Gate 5: tokens:build (firm-tokens must compile)          │
└───────────────────────────────────────────────────────────┘
        │ all pass
        ▼
┌───────────────────────────────────────────────────────────┐
│  SEQUENTIAL                                               │
│  Gate 6: db:generate (schema to migration)                │
│  Gate 7: db:migrate:test (migrations apply cleanly)       │
└───────────────────────────────────────────────────────────┘
        │ all pass
        ▼
┌───────────────────────────────────────────────────────────┐
│  SEQUENTIAL                                               │
│  Gate 8: Full workspace build (turbo build)               │
└───────────────────────────────────────────────────────────┘
        │ passes
        ▼
┌───────────────────────────────────────────────────────────┐
│  PARALLEL GROUP B (requires build)                        │
│  Gate 9:  Unit tests (turbo test)                         │
│  Gate 10: Integration tests (turbo test:integration)      │
│  Gate 11: Storybook build (Chromatic visual regression)   │
└───────────────────────────────────────────────────────────┘
        │ all pass
        ▼
┌───────────────────────────────────────────────────────────┐
│  PARALLEL GROUP C (validation scripts)                    │
│  Gate 12: validate-rls-policies                           │
│  Gate 13: validate-adapters                               │
│  Gate 14: verify-security-headers                         │
│  Gate 15: Health endpoint check (GET /api/health → 200)   │
└───────────────────────────────────────────────────────────┘
        │ all pass
        ▼
┌───────────────────────────────────────────────────────────┐
│  PARALLEL GROUP D (build quality)                         │
│  Gate 16 (optional): pii-log-check                        │  ← always runs
│  Gate 17 (optional): flag-expiry-check                    │  ← always runs
└───────────────────────────────────────────────────────────┘
        │ all pass
        ▼
   PR MERGEABLE ✅
```

### Gate Specifications

**Gate 1 — ESLint**
```yaml
- name: ESLint
  run: pnpm turbo lint
  fail_condition: any warning or error
  what_it_catches:
    - Layer boundary violations (upward imports)
    - Direct vendor SDK imports in Layers 0-6
    - console.log usage (must use firm-logger)
    - process.env direct access (must use firm-env)
    - any usage (must use unknown + type guard)
    - Missing exhaustive switch cases
    - Non-standard import ordering
    - Default exports in shared packages
```

**Gate 2 — TypeScript Type-Check**
```yaml
- name: TypeScript
  run: pnpm turbo type-check
  fail_condition: any type error
  what_it_catches:
    - Type mismatches across package boundaries
    - Missing null checks (noUncheckedIndexedAccess)
    - Implicit any (strict mode)
    - Missing return statements (noImplicitReturns)
    - Inconsistent optional property handling (exactOptionalPropertyTypes)
```

**Gate 3 — Layer Boundary Check**
```yaml
- name: Boundary Check
  run: pnpm tsx scripts/boundary-check.ts
  fail_condition: exit code 1
  what_it_catches:
    - Any Layer N package importing from Layer N+1 or higher
    - Cross-client imports (client-a importing from client-b)
    - Workers importing from apps/
    - Apps importing from services/ (workers)
    - Any @firm/* package importing a vendor SDK directly
      (vendor SDKs belong only in Layer 7 adapters)
```

**Gate 4 — GHA SHA Pinning**
```yaml
- name: GHA SHA Pinning
  run: pnpm tsx scripts/check-gha-shas.ts
  fail_condition: any action reference is not a full 40-char SHA
  what_it_catches:
    - Supply chain attacks via mutable action tags (v4, main, latest)
    - Actions referenced by branch name instead of commit SHA
  example_violation: "uses: actions/checkout@v4"
  correct_form: "uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683"
```

**Gate 5 — Design Token Build**
```yaml
- name: Tokens Build
  run: pnpm turbo tokens:build --filter=firm-tokens
  fail_condition: build error or output files not generated
  what_it_catches:
    - Invalid DTCG token JSON syntax
    - Style Dictionary configuration errors
    - Missing token output formats (css/ts/tailwind)
    - Token references to non-existent values
```

**Gate 6 — Schema Generation**
```yaml
- name: DB Schema Generate
  run: pnpm turbo db:generate --filter=firm-db
  fail_condition: drizzle-kit generate fails or detects schema drift
  what_it_catches:
    - Schema/migration drift (schema changed without migration)
    - Invalid Drizzle schema syntax
    - Missing table definitions for referenced schemas
```

**Gate 7 — Migration Application**
```yaml
- name: DB Migration Test
  run: pnpm turbo db:migrate:test --filter=firm-db
  environment: PGLite in-memory PostgreSQL
  fail_condition: any migration fails to apply
  what_it_catches:
    - SQL syntax errors in migration files
    - Column type conflicts
    - Constraint violations in migration sequence
    - Missing RLS policies in new table migrations
```

**Gate 8 — Full Build**
```yaml
- name: Build
  run: pnpm turbo build
  fail_condition: any package fails to compile
  what_it_catches:
    - Broken imports
    - Missing package.json exports fields
    - Next.js build errors
    - Bundle size regressions (if bundle analyzer configured)
  cache: Vercel Remote Cache
```

**Gate 9 — Unit Tests**
```yaml
- name: Unit Tests
  run: pnpm turbo test
  fail_condition: any test fails OR coverage below threshold
  coverage_thresholds:
    lines: 80%
    functions: 80%
    branches: 75%
  what_it_catches:
    - Logic regressions in feature packages
    - Broken utility functions
    - Invalid Zod schema definitions
    - RBAC permission matrix violations
```

**Gate 10 — Integration Tests**
```yaml
- name: Integration Tests
  run: pnpm turbo test:integration
  environment: PGLite + in-memory Redis (createTestCache)
  fail_condition: any test fails
  critical_tests:
    - RLS cross-tenant isolation (cannot read another tenant's data)
    - withTenantContext transaction rollback on error
    - Outbox idempotency (duplicate insert returns 'duplicate', not error)
    - API key authentication (valid key → authorized, invalid key → 401)
    - Rate limiter enforcement (request 1001 is blocked after 1000 limit)
    - Consent gate (no analytics fires without consent record)
```

**Gate 11 — Storybook / Chromatic**
```yaml
- name: Visual Regression
  run: pnpm chromatic --project-token=$CHROMATIC_PROJECT_TOKEN
  fail_condition: unaccepted visual changes
  what_it_catches:
    - Unintended component visual regressions
    - Design token changes that break component appearance
    - Accessibility regressions (Chromatic a11y integration)
  note: Changes must be explicitly accepted in Chromatic UI by design owner
```

**Gate 12 — RLS Policy Coverage**
```yaml
- name: RLS Validation
  run: pnpm tsx scripts/validate-rls-policies.ts
  fail_condition: any tenant_id table lacks RLS policy
  query: |
    SELECT table_name FROM information_schema.tables t
    JOIN information_schema.columns c ON c.table_name = t.table_name
      AND c.column_name = 'tenant_id'
    LEFT JOIN pg_policies p ON p.tablename = t.table_name
    WHERE t.table_schema = 'public'
      AND p.tablename IS NULL
  fail_message: "Tables with tenant_id but no RLS policy: {table_names}"
```

**Gate 13 — Adapter Interface Compliance**
```yaml
- name: Adapter Validation
  run: pnpm tsx scripts/validate-adapters.ts
  fail_condition: any adapter missing required interface methods
  checks:
    - Every adapters-* package exports a class implementing its firm-types interface
    - adapterOperationDuration metric is registered
    - adapterErrors metric is registered
    - testConnection() method exists and returns { ok: boolean }
    - Webhook-receiving adapters implement all three security contract functions
```

**Gate 14 — Security Headers**
```yaml
- name: Security Headers
  run: pnpm tsx scripts/verify-security-headers.ts
  fail_condition: any app missing required headers
  checks:
    - Content-Security-Policy present and contains nonce
    - Strict-Transport-Security present with min-age 63072000
    - X-Content-Type-Options: nosniff
    - X-Frame-Options: DENY
    - noindex NOT present on production client sites
    - Consent Mode v3 gtag signals present on client sites (after June 15 deadline)
```

**Gate 15 — Health Endpoint**
```yaml
- name: Health Endpoint
  run: pnpm tsx scripts/check-health-endpoints.ts
  fail_condition: any app's /api/health returns non-200
  checks:
    - GET /api/health returns 200
    - Response body contains status: 'healthy'
    - Response body contains checks.database.ok: true
    - Response body contains checks.redis.ok: true
    - Response time < 2000ms
  apps_checked:
    - All apps/platform/* applications
    - All apps/clients/* client sites
    - All services/* workers (on their health port)
```

***

## 9.3 GitHub Actions Workflow Definitions

### Primary CI Workflow

```yaml
# .github/workflows/ci.yml

name: CI

on:
  push:
    branches: [main, 'feat/**', 'fix/**', 'chore/**']
  pull_request:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}
  NODE_VERSION: '22'
  PNPM_VERSION: '9'

jobs:
  # ── Group A: Static Analysis ─────────────────────────────────────────────
  static-analysis:
    name: Static Analysis
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2
        with:
          fetch-depth: 0

      - uses: pnpm/action-setup@fe02b74ab17b36c31fa5b7b4f5d1e2c0cc9a6282  # v4.0.0
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af  # v4.1.0
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Gate 1 — ESLint
        run: pnpm turbo lint

      - name: Gate 2 — TypeScript
        run: pnpm turbo type-check

      - name: Gate 3 — Boundary Check
        run: pnpm tsx scripts/boundary-check.ts

      - name: Gate 4 — GHA SHA Pinning
        run: pnpm tsx scripts/check-gha-shas.ts

      - name: Gate 5 — Tokens Build
        run: pnpm turbo tokens:build --filter=firm-tokens

  # ── Group B: Database ────────────────────────────────────────────────────
  database:
    name: Database Migrations
    runs-on: ubuntu-latest
    needs: static-analysis
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
      - uses: pnpm/action-setup@fe02b74ab17b36c31fa5b7b4f5d1e2c0cc9a6282
        with: { version: '${{ env.PNPM_VERSION }}' }
      - uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af
        with: { node-version: '${{ env.NODE_VERSION }}', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile

      - name: Gate 6 — Schema Generation
        run: pnpm turbo db:generate --filter=firm-db

      - name: Gate 7 — Migration Application
        run: pnpm turbo db:migrate:test --filter=firm-db

  # ── Build ────────────────────────────────────────────────────────────────
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [static-analysis, database]
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
      - uses: pnpm/action-setup@fe02b74ab17b36c31fa5b7b4f5d1e2c0cc9a6282
        with: { version: '${{ env.PNPM_VERSION }}' }
      - uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af
        with: { node-version: '${{ env.NODE_VERSION }}', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile

      - name: Gate 8 — Build
        run: pnpm turbo build

      - name: Upload build artifacts
        uses: actions/upload-artifact@65c4c4a1ddee5b72f698fdd19549f0f0fb45cf08  # v4.6.0
        with:
          name: build-artifacts
          path: |
            packages/*/dist
            apps/*/.next
          retention-days: 1

  # ── Group C: Tests ───────────────────────────────────────────────────────
  test-unit:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
      - uses: pnpm/action-setup@fe02b74ab17b36c31fa5b7b4f5d1e2c0cc9a6282
        with: { version: '${{ env.PNPM_VERSION }}' }
      - uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af
        with: { node-version: '${{ env.NODE_VERSION }}', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile

      - name: Gate 9 — Unit Tests
        run: pnpm turbo test

      - name: Upload coverage
        uses: actions/upload-artifact@65c4c4a1ddee5b72f698fdd19549f0f0fb45cf08
        with:
          name: coverage-unit
          path: packages/*/coverage

  test-integration:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
      - uses: pnpm/action-setup@fe02b74ab17b36c31fa5b7b4f5d1e2c0cc9a6282
        with: { version: '${{ env.PNPM_VERSION }}' }
      - uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af
        with: { node-version: '${{ env.NODE_VERSION }}', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile

      - name: Gate 10 — Integration Tests
        run: pnpm turbo test:integration
        env:
          # PGLite uses in-memory DB — no external service required
          DATABASE_URL: 'pglite://memory'
          REDIS_URL: 'memory://'

  # ── Group D: Validation Scripts ──────────────────────────────────────────
  validate:
    name: Validation Gates
    runs-on: ubuntu-latest
    needs: [test-unit, test-integration]
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
      - uses: pnpm/action-setup@fe02b74ab17b36c31fa5b7b4f5d1e2c0cc9a6282
        with: { version: '${{ env.PNPM_VERSION }}' }
      - uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af
        with: { node-version: '${{ env.NODE_VERSION }}', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile

      - name: Gate 12 — RLS Validation
        run: pnpm tsx scripts/validate-rls-policies.ts

      - name: Gate 13 — Adapter Validation
        run: pnpm tsx scripts/validate-adapters.ts

      - name: Gate 14 — Security Headers
        run: pnpm tsx scripts/verify-security-headers.ts

      - name: Gate 15 — Health Endpoints
        run: pnpm tsx scripts/check-health-endpoints.ts

      - name: PII Log Check
        run: pnpm tsx scripts/pii-log-check.ts

      - name: Feature Flag Expiry
        run: pnpm tsx scripts/flag-expiry-check.ts
```

### Deployment Workflow — Vercel

```yaml
# .github/workflows/deploy-vercel.yml

name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    needs: ci  # Requires CI workflow to pass
    environment: production

    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683

      - name: Generate SBOM
        run: pnpm tsx scripts/sbom-generate.ts

      - name: Deploy firm-site
        uses: amondnet/vercel-action@25be955f4cc40dc91e0a13d56d8fc4d8a4fae1ac  # v25.2.0
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_FIRM_SITE }}
          working-directory: apps/firm-site
          vercel-args: '--prod'

      - name: Deploy platform apps
        run: pnpm tsx scripts/deploy-platform-apps.ts
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}

      - name: Sync infra
        run: pnpm turbo infra:sync
        env:
          GRAFANA_API_KEY: ${{ secrets.GRAFANA_API_KEY }}
          PROMETHEUS_URL: ${{ secrets.PROMETHEUS_URL }}

      - name: Notify deployment
        if: always()
        run: pnpm tsx scripts/notify-deployment.ts
        env:
          SLACK_WEBHOOK: ${{ secrets.SLACK_DEPLOYMENT_WEBHOOK }}
          STATUS: ${{ job.status }}
```

***

## 9.4 Environment Strategy

### Four Environments

```
local        → Developer's machine
              DATABASE_URL: PostgreSQL in Docker (docker-compose.dev.yml)
              REDIS_URL: Redis in Docker
              AI: Real API keys with dev budget limits
              Payments: Stripe test mode

preview      → Vercel Preview (per-PR deployment)
              DATABASE_URL: Neon branching (branch per PR, auto-deleted on PR close)
              REDIS_URL: Upstash Redis (shared preview instance)
              AI: Real API keys with strict budget limits ($5/day cap)
              Payments: Stripe test mode
              Deployed to: preview.firmplatform.com/{pr-number}

staging      → main branch, pre-production
              DATABASE_URL: Neon staging branch
              REDIS_URL: Upstash Redis (dedicated staging instance)
              AI: Real API keys with staging budget
              Payments: Stripe test mode
              Deployed to: staging.firmplatform.com

production   → Tagged releases only
              DATABASE_URL: Neon production (with connection pooling via PgBouncer)
              REDIS_URL: Upstash Redis (dedicated production instance, HA)
              AI: Real API keys, tenant budget enforcement active
              Payments: Stripe live mode
              Deployed to: firmplatform.com
```

### Neon Database Branching for PRs

```typescript
// .github/workflows/create-preview-db.yml
// On PR open: create Neon branch from main
// On PR close: delete Neon branch

- name: Create Neon branch
  uses: neondatabase/create-branch-action@v5
  with:
    project_id: ${{ vars.NEON_PROJECT_ID }}
    branch_name: pr-${{ github.event.number }}
    api_key: ${{ secrets.NEON_API_KEY }}
```

### Environment Variable Governance

```
Variable Naming Convention:
  FIRM_*          Platform-wide internal secrets (FIRM_SIGNING_KEY, FIRM_WEBHOOK_SECRET)
  CLIENT_*        Per-client configuration (CLIENT_STRIPE_KEY, CLIENT_GHL_API_KEY)
  DATABASE_*      Database connection (DATABASE_URL, DIRECT_URL)
  REDIS_*         Cache connection (REDIS_URL, REDIS_TOKEN)
  AUTH_*          Authentication (AUTH_SECRET, AUTH_API_KEY_SECRET)
  NEXT_PUBLIC_*   Client-safe variables (NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_POSTHOG_KEY)

Infisical Folder Structure:
  /production/    Production secrets
  /staging/       Staging secrets
  /preview/       Preview secrets (shared across PRs)
  /development/   Local development defaults

Rule: No secret is stored in .env files committed to the repository.
      .env.example contains variable names and descriptions only — no values.
```

***

## 9.5 Deployment Architecture

### Vercel Deployment Model

```
Vercel Pro Organization: firm-platform
│
├── Projects:
│   ├── firm-site                     ← Agency marketing site
│   ├── platform-portal               ← Unified client hub
│   ├── platform-analytics            ← Analytics dashboard
│   ├── platform-crm                  ← CRM application
│   ├── platform-campaigns            ← Campaign builder
│   ├── platform-admin                ← Superadmin
│   └── client-{slug}                 ← One project per client site
│       (provisioned by worker-tenant-provisioning)
│
└── Configuration:
    Build command:    pnpm turbo build --filter={app}
    Output directory: .next
    Framework:        Next.js
    Node version:     22
    Environment:      Variables from Infisical (pulled at build time)
```

### Self-Hosted: `platform-booking` on Hetzner/Coolify

```yaml
# infra/docker/docker-compose.booking.yml
# platform-booking is self-hosted due to long-running WebSocket requirements
# Vercel serverless functions have a 60-second execution limit
# Booking requires persistent connections for real-time availability updates

services:
  platform-booking:
    build:
      context: ../../apps/platform/platform-booking
      dockerfile: Dockerfile
    ports:
      - "3000:3000"   # HTTP
      - "9090:9090"   # Prometheus metrics
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - NODE_ENV=production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

### Worker Deployment on Hetzner/Coolify

```
Hetzner Dedicated Server: CX52 (8 vCPU, 32GB RAM, Hetzner Falkenstein)
├── Coolify orchestration layer
│   ├── worker-outbox-processor       (2 replicas — redundant delivery)
│   ├── worker-campaigns              (3 replicas — high volume)
│   ├── worker-crm-sync               (2 replicas)
│   ├── worker-email-delivery         (2 replicas)
│   ├── worker-sms-delivery           (2 replicas)
│   ├── worker-reports                (1 replica — low volume)
│   ├── worker-ai-generation          (2 replicas)
│   ├── worker-data-retention         (1 replica — scheduled jobs)
│   ├── worker-billing-events         (1 replica)
│   ├── worker-tenant-provisioning    (1 replica)
│   ├── worker-reputation             (1 replica)
│   ├── worker-analytics-rollup       (1 replica)
│   └── worker-social-scheduler       (2 replicas)
│
├── Infrastructure services
│   ├── PostgreSQL (Neon — managed, not self-hosted)
│   ├── Redis (Upstash — managed, not self-hosted)
│   ├── Prometheus
│   ├── Grafana
│   ├── Loki
│   ├── Tempo
│   └── Alertmanager
```

### Custom Domain Provisioning Flow

```typescript
// When a new tenant is provisioned with a custom domain:
// 1. worker-tenant-provisioning emits firm/domain.provisioned
// 2. firm-white-label processes the event:

async function provisionCustomDomain(
  tenantId: TenantId,
  domain: string
): Promise<void> {

  // Step 1: Add domain to Vercel project
  await vercelApi.addDomain({
    projectId: getClientVercelProjectId(tenantId),
    domain,
  })

  // Step 2: Create Cloudflare DNS CNAME record
  await cloudflareApi.createDNSRecord({
    zone: extractRootDomain(domain),
    type: 'CNAME',
    name: extractSubdomain(domain),
    content: 'cname.vercel-dns.com',
    proxied: true,   // Through Cloudflare — WAF + DDoS protection
  })

  // Step 3: Wait for SSL certificate (Vercel auto-provisions)
  await pollForSSL(domain, { timeout: 300_000, interval: 10_000 })

  // Step 4: Store in custom_domains table
  await db.insert(custom_domains).values({
    tenantId,
    domain,
    status: 'active',
    sslProvisionedAt: new Date(),
  })

  // Step 5: Warm the host → tenantId cache
  await cache.set(`host:${domain}`, tenantId, 300)
}
```

***

## 9.6 Release Strategy

### Branch Model

```
main          ← Production-ready code, protected branch
              Merge requires: all 15 CI gates pass + 1 approving review
              Deploy: automatic on merge → staging
              Release: manual tag triggers production deploy

feat/*        ← Feature branches
              PR target: main
              Preview deploy: automatic on push

fix/*         ← Hotfix branches
              PR target: main
              Same CI requirements as feat/*

chore/*       ← Maintenance (deps, config, docs)
              PR target: main
              Same CI requirements
```

### Release Process

```bash
# 1. Confirm staging is healthy
curl https://staging.firmplatform.com/api/health

# 2. Generate SBOM and tag release
pnpm tsx scripts/sbom-generate.ts
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0

# 3. GitHub Actions deploy-vercel.yml triggers on tag push
#    Deploys all Vercel projects to production
#    Syncs Grafana dashboards
#    Deploys workers to Coolify
#    Posts deployment notification to Slack

# 4. Verify production health
curl https://firmplatform.com/api/health
```

### Rollback Procedure

```bash
# Vercel instant rollback — no redeployment required
vercel rollback --scope=firm-platform

# Worker rollback via Coolify
coolify rollback service worker-campaigns --to=previous

# Database rollback — forward-only migrations
# If a migration causes issues, write a compensating migration
pnpm tsx scripts/run-migrations.ts --confirm
```

***

## 9.7 Dependency Management

### Automated Updates with Renovate

```json
// renovate.json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended"],
  "schedule": ["every weekend"],
  "prHourlyLimit": 5,
  "prConcurrentLimit": 10,
  "minimumReleaseAge": "3 days",
  "vulnerabilityAlerts": {
    "enabled": true,
    "schedule": ["at any time"]
  },
  "packageRules": [
    {
      "matchUpdateTypes": ["major"],
      "requiresStatusChecks": true,
      "addLabels": ["dependency:major"],
      "reviewersFromCodeOwners": true
    },
    {
      "matchDepTypes": ["devDependencies"],
      "automerge": true,
      "automergeType": "pr",
      "requiredStatusCheckContexts": ["CI / Static Analysis"]
    },
    {
      "matchPackageNames": [
        "next", "react", "react-dom",
        "@trpc/server", "@trpc/client",
        "drizzle-orm", "better-auth"
      ],
      "groupName": "Core framework",
      "addLabels": ["dependency:core"],
      "reviewersFromCodeOwners": true
    }
  ]
}
```

### `CODEOWNERS` Configuration

```
# .github/CODEOWNERS

# Platform foundation — requires senior review
/packages/firm-db/                    @firm-platform/platform-leads
/packages/firm-auth/                  @firm-platform/platform-leads
/packages/firm-security/              @firm-platform/platform-leads
/packages/firm-env/                   @firm-platform/platform-leads

# API contracts — interface freeze enforcement
/packages/firm-types/                 @firm-platform/platform-leads
/packages/firm-validators/            @firm-platform/platform-leads
/packages/firm-api-contracts/         @firm-platform/platform-leads

# Infrastructure — requires ops review
/infra/                               @firm-platform/ops
/.github/workflows/                   @firm-platform/ops

# Design system — requires design review
/packages/firm-tokens/                @firm-platform/design
/packages/firm-ui/                    @firm-platform/design

# All other changes — standard review
*                                     @firm-platform/engineers
```

# Marketing Agency Mono Repository Blueprint & Assessment
## Part 10 — Build Sequencing & Execution Plan

***

> **Purpose of This Part:** This part is the authoritative build order. It answers the single most important operational question: "What do we build next, and what must be true before we start?" Every item is sequenced by dependency, not by preference. Every item has explicit entry criteria (what must exist before starting), exit criteria (what must be true to call it done), and an honest time estimate based on the platform's established velocity and current defect load. This is the document an engineering team uses to make weekly sprint decisions.

***

## 10.1 Sequencing Principles

Four principles govern the ordering of every item in this plan:

**Principle 1 — Unblock the unblocked.** If a package has all its dependencies complete, it can start immediately. Multiple packages at the same layer can and should be built in parallel. The build plan explicitly marks parallelizable work.

**Principle 2 — Interface freeze before feature build.** No Layer 6 feature package enters active development until the Layer 2 contracts (`firm-types`, `firm-validators`, `firm-api-contracts`) are tagged at `v1.0.0`. Building features against unlocked interfaces creates rework that compounds across every package that touches the same domain.

**Principle 3 — Compliance deadlines override priority order.** If a compliance deadline is 28 days away, the packages that implement that deadline are in Sprint 1 regardless of their position in the technical dependency graph. The four active deadlines — NY Synthetic Performer (June 9), Google Consent Mode v3 (June 15), CNIL Email Tracking (July 14), EU AI Act C2PA (August 2) — are fixed anchors around which all other work is scheduled.

**Principle 4 — Fix before build.** The seventeen defects catalogued in Part 2 are not backlog items — they are open correctness violations in code that other packages will depend on. Building new features on top of a broken `firm-request-context` or an insecure `firm-auth` creates a multiplying debt. Defect resolution is Sprint 0 work.

***

## 10.2 Sprint 0 — Defect Resolution (Weeks 1–2)

**Goal:** Eliminate all critical defects before any new package development begins. Sprint 0 is complete when all seventeen Part 2 issues are resolved and all fifteen CI gates pass on the `main` branch.

Sprint 0 has no feature deliverables. Its only output is a codebase where the existing code does what it says it does.

***

### S0-1 — `firm-request-context`: Remove Deprecated Class Export

**Issue:** `UnifiedRequestContextManager` class is exported alongside the canonical standalone function API. Consumers have diverged — some use the class, some use the functions. This is an API consistency defect.

**Entry criteria:** None — first task, no dependencies.

**Work:**
1. Audit all imports of `UnifiedRequestContextManager` across the codebase with `grep -r "UnifiedRequestContextManager" packages/ apps/ services/`
2. Migrate every call site to the standalone function API (`runWithContext`, `getCurrentContext`, `requireContext`, `getTenantId`)
3. Remove the `UnifiedRequestContextManager` class from `src/index.ts`
4. Verify single `AsyncLocalStorage` instance backs all exports
5. Write tests verifying context survives `await`, `Promise.all`, and nested `runWithContext` calls

**Exit criteria:** `UnifiedRequestContextManager` does not appear anywhere in the codebase. All context-dependent integration tests pass. `pii-log-check` passes with context propagation active.

**Estimate:** 4 hours

***

### S0-2 — `firm-auth`: Implement API Key Authentication

**Issue:** API key authentication is a stub — `authenticateApiKey()` is not implemented. The platform cannot authenticate any API request that uses a key rather than a session cookie. The entire external API (`firm-sdk`, Zapier integrations) is blocked on this.

**Entry criteria:** S0-1 complete (needs correct `runWithContext`).

**Work:**
```typescript
// packages/firm-auth/src/api-key-auth.ts

export async function authenticateApiKey(
  rawKey: string,
  requiredPermission?: Permission
): Promise<ApiKeyAuthResult> {

  // 1. Extract prefix (first 16 chars) for DB lookup
  const prefix = rawKey.slice(0, 16)

  // 2. Look up key record by prefix
  const keyRecord = await db.select()
    .from(api_keys)
    .where(
      and(
        eq(api_keys.prefix, prefix),
        isNull(api_keys.revokedAt),
        or(
          isNull(api_keys.expiresAt),
          gt(api_keys.expiresAt, new Date())
        )
      )
    )
    .limit(1)

  if (!keyRecord[0]) {
    throw new AuthenticationError('Invalid API key')
  }

  // 3. Verify HMAC — timing-safe comparison
  const expectedHash = hashApiKey(rawKey, authEnv.AUTH_API_KEY_SECRET)
  if (!timingSafeEqual(expectedHash, keyRecord[0].keyHash)) {
    throw new AuthenticationError('Invalid API key')
  }

  // 4. Check permission scope if required
  if (requiredPermission) {
    const hasPermission = keyRecord[0].permissions.includes(requiredPermission) ||
      keyRecord[0].permissions.includes(`${requiredPermission.split(':')[0]}:*`)
    if (!hasPermission) {
      throw new AuthorizationError(`API key lacks permission: ${requiredPermission}`)
    }
  }

  // 5. Update last_used_at (non-blocking)
  db.update(api_keys)
    .set({ lastUsedAt: new Date() })
    .where(eq(api_keys.id, keyRecord[0].id))
    .execute()
    .catch(err => logger.warn({ err }, 'Failed to update API key last_used_at'))

  return {
    tenantId: keyRecord[0].tenantId,
    userId: keyRecord[0].userId,
    permissions: keyRecord[0].permissions,
    keyId: keyRecord[0].id,
  }
}
```

**Exit criteria:** Integration test passes: valid key → authenticated, invalid key → `AuthenticationError`, revoked key → `AuthenticationError`, expired key → `AuthenticationError`, key without required permission → `AuthorizationError`. Timing attack test verifies invalid keys take the same time as valid keys to reject.

**Estimate:** 6 hours

***

### S0-3 — `firm-auth`: Remove `startImpersonationLegacy`

**Issue:** Insecure impersonation function exported from the package. Any consumer can call it and bypass the TOCTOU-safe implementation.

**Entry criteria:** None — no dependencies.

**Work:**
1. Remove `startImpersonationLegacy` from `src/index.ts` and its implementation file
2. Verify no call sites exist (grep) — if any exist, migrate to `startImpersonation`
3. Add ESLint rule to `firm-config-eslint` banning the function name pattern `*Legacy` in auth exports

**Exit criteria:** `startImpersonationLegacy` does not exist in the codebase. ESLint rule added. `firm-auth` unit tests for impersonation all use `startImpersonation`.

**Estimate:** 2 hours

***

### S0-4 — `firm-crypto`: Wire `hashApiKey` into `firm-auth`

**Issue:** `hashApiKey()` exists in `firm-crypto` but `firm-auth` uses its own inline implementation. Two implementations of the same security-critical function creates divergence risk.

**Entry criteria:** S0-2 (needs the correct auth flow to exist first).

**Work:**
1. Replace inline `hashApiKey` in `firm-auth` with import from `@firm/crypto`
2. Verify the HMAC secret parameter matches — `firm-auth` must use `authEnv.AUTH_API_KEY_SECRET`
3. Run existing API key integration tests to confirm no behavioral change
4. Remove dead code

**Exit criteria:** `firm-auth` has no inline HMAC implementation. Single source of HMAC logic is `@firm/crypto`. All auth tests pass.

**Estimate:** 2 hours

***

### S0-5 — `firm-config-tailwind`: Replace Numeric Safelist

**Issue:** Current safelist generates `p-0` through `p-99`, producing a CSS bundle that is 40–60KB larger than necessary. Lighthouse 95+ target is blocked.

**Entry criteria:** None — standalone config change.

**Work:**
```typescript
// packages/firm-config-tailwind/src/index.ts
// Replace:
safelist: [{ pattern: /p-[0-9]+/ }]

// With:
safelist: [
  { pattern: /^(bg|text|border|ring)-(brand|accent|neutral)-(50|100|200|500|700|900)$/ },
  { pattern: /^(p|m|gap|space-[xy])-(0|1|2|3|4|5|6|8|10|12|16|20|24|32)$/ },
  { pattern: /^grid-cols-(1|2|3|4|6|12)$/ },
  { pattern: /^data-\[theme=.+\]:.+$/ },
]
```

Then audit every app that uses this config for any dynamic class names that are now pruned and add them explicitly to the safelist.

**Exit criteria:** `apps/firm-site/` production CSS bundle is under 50KB gzipped. Lighthouse performance score ≥ 95 on homepage. No missing Tailwind classes in any application.

**Estimate:** 4 hours

***

### S0-6 — `firm-security`: Fix Audit Logger Remote Sink

**Issue:** `SecurityAuditLogger`'s remote sink is `console.log`. Security-relevant events are not reaching Loki.

**Entry criteria:** `firm-logger` working correctly (already complete per assessment).

**Work:**
```typescript
// packages/firm-security/src/audit-logger.ts
// Replace:
async logRemote(event: AuditEvent): Promise<void> {
  console.log(JSON.stringify(event))  // WRONG
}

// With:
const auditLogger = createLogger('firm-security:audit')

async logRemote(event: AuditEvent): Promise<void> {
  auditLogger.info({
    ...event,
    eventType: 'security_audit',
  }, `Security audit: ${event.action}`)
}
```

**Exit criteria:** All `SecurityAuditLogger.log()` calls produce structured log lines visible in Loki with `eventType: 'security_audit'`. No security audit events go to `console.log`. `pii-log-check` passes.

**Estimate:** 2 hours

***

### S0-7 — `firm-db`: Implement Missing RLS Policies

**Issue:** Several tables identified in Part 2 lack RLS policies. `validate-rls-policies.ts` CI gate is failing.

**Entry criteria:** None — migration work.

**Work:**
1. Run `validate-rls-policies.ts` locally to get the complete list of affected tables
2. Write migration `0010_missing_rls_policies.sql` covering every identified table
3. Each entry in the migration follows the canonical template from Part 5.4
4. Run `db:migrate:test` to confirm migration applies cleanly

**Exit criteria:** `validate-rls-policies.ts` exits with code `0`. All identified tables have RLS enabled and policies created. Integration test for cross-tenant isolation passes for newly covered tables.

**Estimate:** 3 hours

***

### S0-8 — `firm-validators`: Consolidate Diverged Schemas

**Issue:** `Lead`, `Form`, and `Booking` entity schemas are defined in multiple locations across the codebase with divergent field definitions.

**Entry criteria:** None — Layer 2 consolidation work.

**Work:**
1. Search for all Zod schema definitions for Lead, Form, and Booking entities: `grep -r "z.object" packages/ --include="*.ts" | grep -i "lead\|form\|booking"`
2. Identify all diverged definitions
3. Establish the canonical definition in `firm-validators` as the authoritative schema
4. Replace all other definitions with imports from `@firm/validators`
5. Run type-check to confirm no regressions

**Exit criteria:** Each domain entity has exactly one Zod schema definition, located in `firm-validators`. Type-check passes. All consuming packages import from `@firm/validators`. No inline schema definitions for Lead, Form, or Booking exist outside `firm-validators`.

**Estimate:** 5 hours

***

### S0-9 through S0-17 — Remaining Defects

The remaining nine defects from Part 2 follow the same pattern. Each has an estimate and clear exit criteria:

| ID | Defect | Estimate |
|---|---|---|
| S0-9 | `firm-rate-limiter`: Fix sliding window reset logic | 3 hours |
| S0-10 | `firm-consent`: Wire GPC detection into middleware | 2 hours |
| S0-11 | `firm-observability`: Complete missing span coverage on DB queries | 4 hours |
| S0-12 | `firm-cache`: Fix `atomicIncrement` race condition in high-concurrency scenario | 3 hours |
| S0-13 | `firm-webhooks`: Implement missing replay prevention on all inbound handlers | 4 hours |
| S0-14 | `firm-config-next`: Add missing `Cross-Origin-Opener-Policy` header | 1 hour |
| S0-15 | `firm-tokens`: Validate all token references resolve (no dangling `{value}` references) | 2 hours |
| S0-16 | `firm-background-jobs`: Wire dead-letter Prometheus counter and alert | 2 hours |
| S0-17 | `firm-health`: Implement `outboxQueueDepthChecker` with correct threshold | 1 hour |

**Sprint 0 total estimate: 50 hours**
**Sprint 0 exit criteria:** All 15 CI gates pass on `main`. Zero known defects. `firm-logger`, `firm-crypto`, `firm-request-context`, `firm-auth`, `firm-db`, `firm-security`, `firm-consent`, and `firm-rate-limiter` are each in a state where dependent packages can safely build against them.

***

## 10.3 Sprint 1 — Compliance Deadlines + Interface Freeze (Weeks 3–5)

**Goal:** Satisfy all four compliance deadlines before they become violations. Declare the Layer 2 interface freeze. Complete the design token pipeline.

Sprint 1 has two parallel tracks:

**Track A — Compliance (must complete before deadlines)**
**Track B — Interface Freeze (must complete before Layer 6 build begins)**

***

### Track A: Compliance Work

#### S1-A1 — NY Synthetic Performer Labeling (Due: June 9)

**Entry criteria:** Sprint 0 complete. `firm-ai` and `firm-security` defects resolved.

**Work:**
1. Ensure `generateC2PAManifest()` in `firm-security` is complete and produces valid output
2. Build `AIContentWrapper` component in `firm-ui` with structurally non-removable disclosure label
3. Wire `firm-ai`'s `generateContent()` to call `generateC2PAManifest()` after every generation
4. Set `ai_generation_log.disclosed = true` when content is first rendered
5. Write CI test that renders `AIContentWrapper` and asserts disclosure label is present in HTML output

**Exit criteria (all required):**
- [ ] `AIContentWrapper` in `firm-ui` renders `<div aria-label="AI-generated content disclosure">` when manifest is present
- [ ] The disclosure element is not conditionally rendered — it is structurally part of the component
- [ ] `ai_generation_log.c2pa_manifest` is non-null for every test generation
- [ ] CI test `AIContentWrapper renders disclosure label` passes
- [ ] `disclosed` column updated to `true` on first render

**Estimate:** 8 hours

***

#### S1-A2 — Google Consent Mode v3 (Due: June 15)

**Entry criteria:** S0-10 (GPC detection fix). `firm-consent` defects resolved.

**Work:**
1. Implement `dispatchConsentSignals()` with all four v3 signals
2. Set default state to `denied` for all signals before consent is given
3. Wire `ConsentBanner` component to call `dispatchConsentSignals()` on accept
4. Wire GPC detection to call `dispatchConsentSignals()` with all `denied` on Sec-GPC: 1
5. Extend `scripts/verify-security-headers.ts` to check for Consent Mode v3 signals on client sites
6. Audit all `apps/clients/*` sites for missing `<ConsentBanner />`

**Exit criteria:**
- [ ] `dispatchConsentSignals({ adStorage: false, analyticsStorage: false, adUserData: false, adPersonalization: false })` is called on every page load before any analytics initialization
- [ ] GPC header detection sets all four signals to `denied` without showing consent banner
- [ ] Accept on banner sets all four signals to `granted`
- [ ] `verify-security-headers.ts` gate extended and passing
- [ ] All existing client sites have `<ConsentBanner />` — no client site exempt

**Estimate:** 10 hours

***

#### S1-A3 — CNIL Email Tracking Pixel Consent (Due: July 14)

**Entry criteria:** `firm-consent` complete. `firm-email` package scaffolded (can be a stub — consent check must be wired before email sending is implemented).

**Work:**
1. Add `email_tracking` consent type to `ConsentType` union in `firm-consent`
2. Add `email_tracking` column to `consent_records` migration
3. Scaffold `firm-email` package with an `EmailService` class that checks `hasConsent(tenantId, userId, ip, 'email_tracking')` before including tracking pixel
4. Write integration test: email sent to EU recipient without consent contains no tracking pixel `<img>` tags

**Exit criteria:**
- [ ] `consent_records.email_tracking` column exists in migration
- [ ] `firm-email` `EmailService.send()` accepts a `trackingConsent` parameter
- [ ] When `trackingConsent === false`, generated email HTML contains no `<img>` tags with tracking pixel URLs
- [ ] Integration test passes for EU recipient without consent
- [ ] Delivery is not blocked — email sends without pixel, not fails

**Estimate:** 6 hours

***

#### S1-A4 — EU AI Act Article 50 C2PA (Due: August 2)

**Entry criteria:** S1-A1 complete (C2PA foundation established).

**Work:**
1. Complete `generateC2PAManifest()` to produce full C2PA v2 format with cryptographic signature
2. Wire all three AI content packages (`firm-ai-content`, `firm-ai-seo`, `firm-ai-brand-voice`) to call `generateC2PAManifest()` — cannot generate content without a manifest
3. Write CI test that any AI generation without a manifest produces a failing assertion
4. Verify `data-c2pa-manifest` attribute is present on all rendered AI content wrappers

**Exit criteria:**
- [ ] `generateC2PAManifest()` produces `{ '@context': 'https://c2pa.org/v2', claim: {...}, signature: '...' }`
- [ ] Signature is HMAC-SHA256 of manifest claim with `FIRM_SIGNING_KEY`
- [ ] All three AI content packages call `generateC2PAManifest()` — enforced by ESLint rule
- [ ] CI test: AI generation without manifest call fails
- [ ] `AIContentWrapper` renders `data-c2pa-manifest` attribute with serialized manifest

**Estimate:** 8 hours

***

### Track B: Interface Freeze

#### S1-B1 — Finalize `firm-types` Domain Interfaces

**Entry criteria:** S0-8 (schema consolidation complete).

**Work:**
Complete all domain entity interfaces that are still open or marked as draft:
- Finalize `Lead` interface — resolve `customFields` typing (use `Record<string, unknown>` with typed helpers)
- Finalize `Booking` interface — resolve recurring booking fields
- Finalize `Campaign` and `CampaignStep` interfaces
- Finalize all 23 adapter interfaces
- Finalize the complete event payload types for every registered event

**Exit criteria:** Every domain entity and adapter interface in `firm-types/src/index.ts` is marked as `@stable`. No `@draft` or `@todo` JSDoc comments remain. Type-check passes across the full workspace.

**Estimate:** 8 hours

***

#### S1-B2 — Finalize `firm-validators` Schemas

**Entry criteria:** S1-B1 complete.

**Work:**
Write the canonical Zod v4 schema for every entity interface defined in S1-B1. Every schema must have:
- A `create*Schema` (required fields for creation)
- An `update*Schema` (all fields partial)
- An `id*Schema` (branded ID validation)
- A `list*Schema` (pagination + filter params)

**Exit criteria:** Every domain entity has four schema exports in `firm-validators`. All schemas pass `z.parse()` with valid test data. All schemas reject invalid data with typed `ZodError`. No inline Zod schema definitions exist outside `firm-validators` for domain entities.

**Estimate:** 10 hours

***

#### S1-B3 — Finalize `firm-api-contracts` Event Registry

**Entry criteria:** S1-B1 complete.

**Work:**
1. Write CloudEvents-compliant schema for every event in the registry (all ~40 events)
2. Wire the registry to the `outbox_events.event_name` check in `validate-rls-policies.ts` — any event_name not in the registry fails CI
3. Write `createTypedEvent<T>()` factory that produces a CloudEvent with compile-time type checking of the payload

**Exit criteria:** All ~40 events have typed payload schemas. `boundary-check.ts` extended to validate outbox inserts use registered event names. `createTypedEvent<EventName>()` is the only way to create an outbox event — direct object construction is an ESLint error.

**Estimate:** 8 hours

***

#### S1-B4 — Interface Freeze Declaration

**Entry criteria:** S1-B1, S1-B2, S1-B3 all complete and reviewed.

**Work:**
1. Final review of all Layer 2 contracts with the full team
2. Tag `contracts/v1.0.0` in git
3. Update `CODEOWNERS` to require two senior approvals for any `firm-types`, `firm-validators`, or `firm-api-contracts` change
4. Add `breaking-contract-change` PR label and associated CI check that adds a mandatory changelog entry

**Exit criteria:** `contracts/v1.0.0` git tag exists. `CODEOWNERS` updated. PR template updated with contract change checklist. All Layer 6 teams notified that interface freeze is active and development can begin.

**Estimate:** 4 hours

**Sprint 1 total estimate: 70 hours**

***

## 10.4 Sprint 2 — Layer 3–5 Hardening + P1 Adapters (Weeks 6–8)

**Goal:** Complete all Layer 3–5 packages to full production readiness. Build the three P1 adapters that block all Layer 6 development. Begin highest-priority Layer 6 packages.

***

### Layer 3 Completion

**S2-L3-1 — `firm-auth`: Complete API Key Authentication pipeline**
Wire `authenticateApiKey()` (built in S0-2) into the tRPC context and REST handler middleware. Add API key authentication to the tRPC `protectedProcedure` — it should accept either a valid session cookie OR a valid API key in the `Authorization: Bearer` header.

**Estimate:** 4 hours

**S2-L3-2 — `firm-rate-limiter`: Full middleware integration**
Wire the rate limiter middleware into all platform apps and client sites. Implement the per-resource rate limits defined in Part 7.6. Verify the Prometheus `rate_limit_exceeded_total` counter increments correctly.

**Estimate:** 6 hours

**S2-L3-3 — `firm-consent`: Complete production consent flow**
Complete the full consent banner component in `firm-ui`, wire it into `apps/clients/_template/app/layout.tsx`, and verify the complete consent → analytics flow works end-to-end in a local test.

**Estimate:** 6 hours

***

### Layer 4 Completion

**S2-L4-1 — `firm-observability`: Complete span coverage**
Wrap every operation in the required spans list from Part 8.3. Verify trace-log correlation works — clicking a Loki log line should navigate to the Tempo trace in the Grafana local dev stack.

**Estimate:** 8 hours

**S2-L4-2 — `firm-health`: Deploy health endpoints to all apps**
Implement `createHealthRouter()` with standard checkers in every platform app and worker. Verify Gate 15 passes for all apps. Verify Prometheus scrapes `/metrics` on `:9090` for all targets.

**Estimate:** 4 hours

***

### Layer 5 Completion

**S2-L5-1 — `firm-ui`: Core component library to v1**
Build or verify all component categories in the Part 4.7 inventory. Every component must have a Storybook story. Chromatic visual regression baseline established. Accessibility audit passes (WCAG 2.1 AA).

**Estimate:** 20 hours (if starting from scratch) | 8 hours (if existing components need polish)

**S2-L5-2 — `firm-config`: Tenant config resolution**
Implement `getTenantConfig()` with Redis caching (5-minute TTL), database fallback, and the complete `TenantConfig` shape. Wire vertical profile loading from `docs/verticals/*.json` files.

**Estimate:** 6 hours

***

### P1 Adapters

**S2-A1 — `adapters-billing-stripe`**

Blocks `firm-payments`. Without this, the platform cannot charge clients.

```typescript
// Complete implementation checklist:
// ✅ StripeAdapter implements BillingAdapter interface from firm-types
// ✅ createSubscription(), updateSubscription(), cancelSubscription()
// ✅ createInvoice(), listInvoices()
// ✅ Inbound webhook: verifyWebhookSignature + preventReplay + enforceIdempotency
// ✅ Events: payment_intent.succeeded, invoice.payment_failed,
//           customer.subscription.deleted, customer.subscription.updated
// ✅ adapterOperationDuration + adapterErrors Prometheus metrics
// ✅ testConnection() returns { ok: true } with valid credentials
```

**Estimate:** 12 hours

**S2-A2 — `adapters-email-resend`**

Blocks `firm-notifications`, `firm-campaigns`, all transactional email.

```typescript
// Complete implementation checklist:
// ✅ ResendAdapter implements EmailAdapter interface from firm-types
// ✅ sendEmail() with idempotency key support
// ✅ getBounces() with date filtering
// ✅ unsubscribe() adds to Resend suppression list
// ✅ Inbound webhook: delivery status updates (delivered, bounced, complained)
// ✅ verifyWebhookSignature using Resend's svix-based signing
// ✅ adapterOperationDuration + adapterErrors Prometheus metrics
// ✅ testConnection() validates API key
```

**Estimate:** 8 hours

**S2-A3 — `adapters-storage-r2`**

Blocks `firm-storage`. Without this, no file uploads, no report storage, no media.

```typescript
// Complete implementation checklist:
// ✅ R2StorageAdapter implements StorageAdapter interface from firm-types
// ✅ upload() with presigned URL generation
// ✅ getSignedUrl() with configurable TTL
// ✅ delete() with soft-delete tracking in file_storage_records
// ✅ listByFolder() for quota calculations
// ✅ adapterOperationDuration + adapterErrors Prometheus metrics
// ✅ testConnection() verifies bucket access
```

**Estimate:** 6 hours

***

### First Layer 6 Packages

**S2-L6-1 — `firm-tenancy`: Tenant lifecycle foundation**

Entry criteria: S2-L5-2 complete, S1-B4 (interface freeze) declared.

This package is the prerequisite for `worker-tenant-provisioning`, which is the prerequisite for onboarding any new client. It must be built before any other Layer 6 work can be tested end-to-end.

**Estimate:** 12 hours

**S2-L6-2 — `firm-leads`: Lead lifecycle**

Entry criteria: `firm-db` complete, `firm-validators` schemas for Lead finalized, interface freeze declared.

This is the most central domain object. CRM sync, campaigns, forms, and bookings all create or reference leads.

**Estimate:** 10 hours

**Sprint 2 total estimate: 110 hours**

***

## 10.5 Sprint 3 — Core Feature Packages (Weeks 9–12)

**Goal:** Build the eight feature packages required to serve a first client: forms, notifications, bookings, campaigns (email only), reporting, CRM sync (GoHighLevel), reputation, and the client portal.

Sprint 3 is parallelizable across three workstreams:

***

### Workstream A — Lead Generation Pipeline

**S3-A1 — `firm-forms`**

Entry criteria: `firm-leads` complete, `firm-consent` complete, `firm-security` (CSRF) complete.

Must implement:
- Schema-driven form builder (JSONB field definitions → React form)
- Turnstile CAPTCHA integration
- UTM parameter capture
- CSRF token validation
- Consent recording before lead creation
- Outbox event `firm/form.submitted` → `firm/form.lead-created`

**Estimate:** 14 hours

**S3-A2 — `firm-notifications`**

Entry criteria: `adapters-email-resend` complete, `adapters-sms-twilio` (P2, builds in Sprint 2 or early Sprint 3).

Must implement:
- Email notification dispatch with consent check
- SMS notification dispatch with consent check
- In-app notification storage
- Per-user notification preferences
- `firm/notification.sent` outbox event

**Estimate:** 10 hours

**S3-A3 — `firm-campaigns` (Phase 1 — Email Sequences)**

Entry criteria: `firm-leads` complete, `firm-notifications` complete, `firm-background-jobs` complete.

Phase 1 scope (sufficient for first client):
- Email-only campaign steps
- Step delays via Inngest `step.sleep`
- Lead enrollment and re-enrollment prevention
- Open/click tracking (with consent gate)
- Unsubscribe handling

Phase 2 scope (SMS, social — Sprint 4):
- SMS campaign steps
- Social campaign steps
- A/B testing

**Estimate:** 16 hours (Phase 1)

***

### Workstream B — Booking & Scheduling

**S3-B1 — `firm-bookings`**

Entry criteria: `firm-notifications` complete, `adapters-calendar-google` (P2 adapter).

Must implement:
- Availability rule engine (working hours, blocked times, buffer times)
- Booking creation with conflict detection
- Calendar sync (Google Calendar via adapter)
- Reminder scheduling via `worker-campaigns` saga pattern
- `firm/booking.created`, `firm/booking.cancelled` outbox events

**Estimate:** 16 hours

***

### Workstream C — Reporting & Intelligence

**S3-C1 — `firm-reporting` (Phase 1 — Standard Reports)**

Entry criteria: `firm-leads` complete, `adapters-analytics-ga4` (P2 adapter), `adapters-ads-google` (P2 adapter).

Phase 1 scope:
- Standard report templates: Lead Performance, Campaign Performance, Booking Summary
- PDF generation via Puppeteer
- Scheduled delivery via `worker-reports`
- White-label branding from tenant theme tokens

**Estimate:** 14 hours

**S3-C2 — `firm-reputation` (Phase 1 — Google Reviews)**

Entry criteria: `adapters-reviews-google` complete, `firm-notifications` complete, `firm-ai` (for response drafting).

Phase 1 scope:
- Google Business Profile review monitoring
- Review request campaign (post-booking trigger)
- AI-drafted response generation with C2PA manifest
- Review analytics (average rating trend, response rate)

**Estimate:** 12 hours

***

### Workstream D — Client Portal

**S3-D1 — `firm-portal`**

Entry criteria: `firm-auth` complete, `firm-leads` complete, `firm-reporting` Phase 1 complete.

The `firm-portal` package powers `apps/platform/platform-portal` — the white-label client hub where the agency's clients log in to see their dashboard.

Must implement:
- White-label dashboard shell (uses tenant theme tokens)
- Lead pipeline view (read-only for client users)
- Report viewer
- Booking calendar (read-only view)
- Activity feed

**Estimate:** 16 hours

**Sprint 3 total estimate: 98 hours**

***

## 10.6 Sprint 4 — Platform Applications (Weeks 13–16)

**Goal:** Build the six highest-priority platform applications (`platform-analytics`, `platform-portal`, `platform-crm`, `platform-campaigns`, `platform-booking`, `platform-reputation`) to the point where the first 5 clients can be onboarded.

Each platform app follows the same build pattern:

```
For each platform app:

1. Scaffold from apps/platform/_template (if template exists)
   OR create Next.js app with firm-config-next

2. Implement authentication gate (Better Auth + Authentik OIDC)

3. Wire tRPC router with app-specific procedures

4. Build page routes (list views, detail views, create/edit flows)
   using firm-ui components and firm-tokens

5. Add GET /api/health route with app-specific health checkers

6. Add Prometheus metrics endpoint on :9090/metrics

7. Wire firm-observability initObservability() at startup

8. Vercel project created and first deployment confirmed

9. All 15 CI gates pass for this app
```

**Sequenced by dependency and client impact:**

| App | Depends On | Estimate | First client need |
|---|---|---|---|
| `platform-analytics` | `firm-reporting` | 16 hours | Week 13 |
| `platform-portal` | `firm-portal` | 12 hours | Week 13 |
| `platform-crm` | `firm-leads`, `firm-forms` | 20 hours | Week 14 |
| `platform-campaigns` | `firm-campaigns` | 18 hours | Week 14 |
| `platform-booking` | `firm-bookings` | 16 hours | Week 15 |
| `platform-reputation` | `firm-reputation` | 14 hours | Week 15 |

**Sprint 4 total estimate: 96 hours**

***

## 10.7 Sprint 5 — First Client Onboarding (Week 17)

**Goal:** Onboard the first client on the live platform. This sprint is a system integration milestone, not a feature development sprint. Every component built in Sprints 0–4 is exercised by real usage.

### First Client Onboarding Checklist

```
Pre-onboarding validation:
□ worker-tenant-provisioning < 60 seconds end-to-end (tested in staging)
□ All 15 CI gates passing on main
□ Staging health checks all green
□ Grafana platform-overview dashboard showing healthy metrics
□ Alertmanager routing verified (test alert delivered to Slack)

Provisioning:
□ Run scripts/provision-tenant.ts --env=production --slug=client-acme
□ Verify tenant provisioned in < 60 seconds
□ Verify subdomain active: acme.firmplatform.com
□ Verify SSL certificate issued
□ Seed demo data: scripts/seed-demo-tenant.ts --tenant=acme

Configuration:
□ Connect Google Business Profile (firm-reputation)
□ Connect Google Ads account (adapters-ads-google)
□ Connect Google Analytics 4 (adapters-analytics-ga4)
□ Connect GoHighLevel CRM (adapters-crm-gohighlevel)
□ Configure Resend sending domain (adapters-email-resend)
□ Verify Consent Mode v3 signals firing correctly on client site
□ Configure booking availability rules

First week monitoring:
□ All 7 alert rules verified as not firing
□ AI token budget usage within expected range
□ No outbox dead-lettered events
□ Client portal login confirmed working for client admin user
□ First report generated and delivered successfully
```

***

## 10.8 Remaining Build Queue (Sprints 6–12)

Work ordered by business impact, with P2/P3/P4 adapters built as the feature packages that need them are prioritized:

### Sprint 6 — Content & AI Features
- `firm-ai-content` — Blog post generation, social caption generation
- `firm-ai-brand-voice` — Brand voice training and application
- `firm-cms` — Content storage and versioning
- `firm-landing-pages` — Page builder
- `platform-content` application
- `adapters-ai-anthropic` (P3) + `adapters-ai-openai` (P3)

**Estimate:** 80 hours

### Sprint 7 — Social & Advertising
- `firm-social` — Social post scheduling
- `firm-ads` — Cross-platform ad management
- `platform-social` application
- `platform-ads` application
- `adapters-social-meta`, `adapters-social-linkedin` (P3)
- `adapters-ads-google`, `adapters-ads-meta` (P2 — may have started in Sprint 2)

**Estimate:** 90 hours

### Sprint 8 — SEO & Funnels
- `firm-ai-seo` — AI-powered SEO briefs and keyword clustering
- `firm-funnels` — Multi-step funnel builder
- `platform-seo` application
- `adapters-seo-google-sc`, `adapters-seo-ahrefs` (P3)

**Estimate:** 70 hours

### Sprint 9 — Agency Operations
- `firm-projects` — Project management
- `firm-documents` — Contract and document management
- `firm-proposals` — Proposal builder with e-signature
- `firm-invoicing` — Invoicing and billing portal
- `platform-proposals`, `platform-invoicing`, `platform-projects` applications

**Estimate:** 80 hours

### Sprint 10 — Additional CRM Adapters
- `adapters-crm-hubspot` (P3)
- `adapters-crm-salesforce` (P3)
- `adapters-crm-activecampaign`
- `adapters-crm-pipedrive`
- Additional email adapters: SendGrid, Postmark, SES

**Estimate:** 60 hours

### Sprint 11 — Vertical Expansion
Build vertical-specific adapter packages and configure vertical profiles for the next five target verticals:
- Legal (`adapters-vertical-clio`, `adapters-proposals-docusign`)
- Fitness (`adapters-vertical-mindbody`, `adapters-booking-mindbody`)
- Home Services (`adapters-vertical-jobber`, `adapters-vertical-servicetitan`)
- Real Estate (`adapters-vertical-propertyware`)
- Restaurant (`adapters-vertical-toast`)

**Estimate:** 80 hours

### Sprint 12 — Scale Hardening
Not feature work — performance and scale work:
- Database query optimization (add missing composite indexes based on query analysis)
- Connection pooling tuning (PgBouncer configuration for 1,000-tenant load)
- Redis cluster migration (single instance → cluster for 1,000 tenant key volume)
- Outbox processor scaling (current single-instance → multi-replica with partition-based processing)
- Load testing: simulate 1,000 concurrent tenants, 10,000 form submissions/hour

**Estimate:** 60 hours

***

## 10.9 Velocity Summary

```
Sprint 0:  50 hours  — Defect resolution. Output: clean foundation.
Sprint 1:  70 hours  — Compliance + interface freeze. Output: contracts locked.
Sprint 2: 110 hours  — Layer 3-5 + P1 adapters + first L6 packages.
Sprint 3:  98 hours  — Core feature packages. Output: first client ready.
Sprint 4:  96 hours  — Platform applications. Output: 6 platform apps live.
Sprint 5:  20 hours  — First client onboarding. Output: first paying tenant on platform.
Sprint 6:  80 hours  — Content + AI features.
Sprint 7:  90 hours  — Social + advertising.
Sprint 8:  70 hours  — SEO + funnels.
Sprint 9:  80 hours  — Agency operations.
Sprint 10: 60 hours  — CRM adapter expansion.
Sprint 11: 80 hours  — Vertical expansion.
Sprint 12: 60 hours  — Scale hardening.
─────────────────────────────────────────────────
Total:    864 hours  — Full platform to 1,000-tenant readiness
```

***

## 10.10 The Single Most Important Constraint

Every item in this build plan is sequenced around one constraint that overrides all others:

**The interface freeze (S1-B4) is the critical path.**

Until `contracts/v1.0.0` is tagged, every Layer 6 feature package built is provisional — it may need to be partially rewritten when interfaces are finalized. The temptation to start building `firm-campaigns` or `platform-crm` before the interface freeze is declared is the highest-probability source of wasted work in this entire project.

The recommended sequence for a solo founder or small team:

```
Week 1-2:   Sprint 0 — fix defects, all CI gates green
Week 3-4:   Sprint 1 Track B — finalize interfaces, declare freeze
Week 3-5:   Sprint 1 Track A — compliance deadlines (parallel with Track B)
Week 6-8:   Sprint 2 — Layer 3-5 + P1 adapters + firm-tenancy + firm-leads
Week 9-12:  Sprint 3 — core feature packages
Week 13-16: Sprint 4 — platform applications
Week 17:    Sprint 5 — first client live
```

Everything after Week 17 depends on client feedback, revenue, and the specific verticals the first paying clients represent. The build plan from Sprint 6 onward is a queue, not a commitment — it is executed in the order that maximizes value for the clients currently on the platform.

# Marketing Agency Mono Repository Blueprint & Assessment
## Part 11 — Adapter Implementation Contracts

***

> **Purpose of This Part:** This part defines the complete implementation contract for every adapter category in the platform. For AI coding agents: when you are asked to build an adapter, this part tells you exactly what to implement, what the method signatures look like, what error types to throw, what metrics to record, and what "done" means. No adapter is complete until every item in its acceptance checklist is satisfied. No adapter may skip the three-function webhook security contract if it receives inbound webhooks.

***

## 11.1 The Universal Adapter Contract

Every adapter in the platform — regardless of category, provider, or complexity — satisfies this universal contract before any category-specific requirements are considered.

### The Five Universal Requirements

**Requirement 1 — Interface Implementation**

The adapter class implements the interface from `@firm/types` that corresponds to its category. The TypeScript compiler enforces this — if the class does not implement every method in the interface, `tsc` fails.

```typescript
// Pattern for every adapter
import type { EmailAdapter } from '@firm/types'

export class ResendEmailAdapter implements EmailAdapter {
  // TypeScript guarantees every interface method is implemented
}
```

**Requirement 2 — Constructor Pattern**

Every adapter receives its tenant-specific credentials via constructor injection, not via environment variables or global singletons. This is what makes the adapter multi-tenant — each tenant's adapter instance carries that tenant's credentials.

```typescript
export class ResendEmailAdapter implements EmailAdapter {
  private client: Resend
  private logger: Logger

  constructor(private config: {
    apiKey: string           // Tenant-specific — from encrypted adapter config in DB
    fromDomain: string       // Tenant's sending domain
    tenantId: TenantId       // For logging and metrics
  }) {
    this.client = new Resend(config.apiKey)
    this.logger = createLogger(`adapters:email:resend`).child({
      tenantId: config.tenantId
    })
  }
}
```

**Requirement 3 — Prometheus Metrics (both required)**

```typescript
// These two metrics must be recorded on every adapter operation
// They are defined in firm-observability — not re-declared in the adapter

import { adapterOperationDuration, adapterErrors } from '@firm/observability'

// On every operation:
const timer = adapterOperationDuration.startTimer({
  adapter: 'resend',
  operation: 'sendEmail',
  tenant_id: this.config.tenantId,
})

try {
  const result = await this.client.emails.send(payload)
  timer()  // Records duration with no error label
  return result
} catch (error) {
  timer()  // Records duration
  adapterErrors.inc({
    adapter: 'resend',
    operation: 'sendEmail',
    error_type: classifyError(error),
    tenant_id: this.config.tenantId,
  })
  throw this.wrapError(error)
}
```

**Requirement 4 — `testConnection()` Required**

```typescript
async testConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    // Perform the lightest possible API call that verifies credentials
    // For Resend: list domains (doesn't send anything, verifies auth)
    await this.client.domains.list()
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
```

**Requirement 5 — Error Taxonomy**

Every adapter throws errors from the `@firm/errors` taxonomy, never raw vendor SDK errors. This is what allows feature packages to handle errors without importing vendor SDKs.

```typescript
// Adapter error classification
function classifyError(error: unknown): AdapterError {
  if (isRateLimitError(error)) return new AdapterRateLimitError(error)
  if (isAuthError(error)) return new AdapterAuthError(error)
  if (isNetworkError(error)) return new AdapterNetworkError(error)
  if (isValidationError(error)) return new AdapterValidationError(error)
  return new AdapterUnknownError(error)
}
```

### The Webhook Security Contract (if applicable)

If the adapter receives inbound webhooks from its provider, it must implement all three functions. No webhook handler ships without all three.

```typescript
export class StripeAdapter implements BillingAdapter {

  // Function 1: Signature verification — MUST use timingSafeEqual
  verifyWebhookSignature(
    rawBody: Buffer,
    signatureHeader: string,
    secret: string
  ): boolean {
    const { timestamp, signatures } = parseStripeSignatureHeader(signatureHeader)
    const signedPayload = `${timestamp}.${rawBody.toString('utf-8')}`
    const expected = hmacSha256(signedPayload, secret)
    return signatures.some(sig => timingSafeEqual(expected, sig))
  }

  // Function 2: Replay prevention — reject events older than 300 seconds
  preventReplay(eventTimestampSeconds: number): void {
    const ageSeconds = Math.floor(Date.now() / 1000) - eventTimestampSeconds
    if (ageSeconds > 300) {
      throw new WebhookReplayError(
        `Event timestamp ${eventTimestampSeconds} is ${ageSeconds}s old — replay rejected`
      )
    }
  }

  // Function 3: Idempotency — returns 'new' or 'duplicate'
  async enforceIdempotency(
    eventId: string,
    tenantId: TenantId
  ): Promise<'new' | 'duplicate'> {
    try {
      await db.insert(outbox_events).values({
        tenantId,
        event_name: 'webhook.received',
        idempotency_key: `stripe.${eventId}`,
        payload: {},
      })
      return 'new'
    } catch (error) {
      if (isUniqueConstraintViolation(error)) return 'duplicate'
      throw error
    }
  }
}
```

***

## 11.2 CRM Adapter Contracts

### `CRMAdapter` Interface (from `@firm/types`)

```typescript
export interface CRMAdapter {
  syncContact(tenantId: TenantId, lead: Lead): Promise<CRMSyncResult>
  fetchContacts(tenantId: TenantId, cursor?: string): Promise<Paginated<Lead>>
  deleteContact(tenantId: TenantId, externalId: string): Promise<void>
  createNote(tenantId: TenantId, externalId: string, note: string): Promise<void>
  createTask(tenantId: TenantId, task: CRMTask): Promise<CRMTaskResult>
  testConnection(tenantId: TenantId): Promise<{ ok: boolean; error?: string }>
}
```

### `adapters-crm-gohighlevel` — P2 Priority

GoHighLevel (GHL) is the largest existing agency client base. This is the first CRM adapter to build.

```typescript
export class GoHighLevelCRMAdapter implements CRMAdapter {

  async syncContact(
    tenantId: TenantId,
    lead: Lead
  ): Promise<CRMSyncResult> {
    return createSpan('adapter.gohighlevel.syncContact', async (span) => {
      span.setAttributes({ 'tenant.id': tenantId, 'lead.id': lead.id })

      // GHL contact upsert — create if not exists, update if exists
      const existingContact = await this.findContactByEmail(lead.email)

      const contactPayload = {
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        tags: this.mapLeadStatusToTags(lead.status),
        customField: this.mapCustomFields(lead.customFields),
      }

      const result = existingContact
        ? await this.client.contacts.update(existingContact.id, contactPayload)
        : await this.client.contacts.create({ ...contactPayload, locationId: this.config.locationId })

      // Store external ID mapping for future syncs
      await db.update(leads)
        .set({ metadata: { ...lead.metadata, ghlContactId: result.id } })
        .where(eq(leads.id, lead.id))

      return {
        externalId: result.id,
        synced: true,
        provider: 'gohighlevel',
      }
    })
  }

  async fetchContacts(
    tenantId: TenantId,
    cursor?: string
  ): Promise<Paginated<Lead>> {
    // GHL uses offset-based pagination — must be mapped to cursor-based
    const offset = cursor ? parseInt(Buffer.from(cursor, 'base64').toString()) : 0
    const limit = 100

    const response = await this.client.contacts.list({
      locationId: this.config.locationId,
      limit,
      startAfter: offset,
    })

    return {
      data: response.contacts.map(this.mapGHLContactToLead),
      nextCursor: response.contacts.length === limit
        ? Buffer.from(String(offset + limit)).toString('base64')
        : null,
      total: response.total,
    }
  }
}
```

**GoHighLevel webhook events to handle:**

```typescript
// Inbound GHL webhooks — registered in GHL location settings
const GHL_WEBHOOK_EVENTS = [
  'ContactCreate',       // → firm/lead.created (if not already in platform)
  'ContactUpdate',       // → firm/lead.updated
  'ContactDelete',       // → firm/lead.deleted
  'OpportunityCreate',   // → pipeline stage tracking
  'OpportunityUpdate',   // → firm/lead.stage-changed
  'AppointmentCreate',   // → firm/booking.created
  'NoteCreate',          // → firm/lead.activity-added
] as const
```

**Acceptance checklist — `adapters-crm-gohighlevel`:**
- [ ] `syncContact()` creates contact if not exists, updates if exists (upsert)
- [ ] `syncContact()` maps `LeadStatus` enum to GHL tags
- [ ] `fetchContacts()` returns correctly mapped `Lead` objects
- [ ] Cursor-based pagination wraps GHL's offset pagination
- [ ] All 6 webhook event types handled with security contract
- [ ] `crm_sync_jobs` table updated with sync result and timestamp
- [ ] `adapterOperationDuration` and `adapterErrors` metrics recorded
- [ ] `testConnection()` returns `{ ok: true }` with valid `locationId` + API key

**Estimate:** 14 hours

***

### `adapters-crm-hubspot` — P3 Priority

```typescript
export class HubSpotCRMAdapter implements CRMAdapter {
  // HubSpot uses OAuth2 — token refresh must be handled transparently
  private async refreshTokenIfNeeded(): Promise<void> {
    const config = await getTenantAdapterConfig(this.config.tenantId, 'hubspot')
    if (isTokenExpired(config.accessTokenExpiresAt)) {
      const refreshed = await this.oauth.refreshToken(config.refreshToken)
      await updateTenantAdapterConfig(this.config.tenantId, 'hubspot', {
        accessToken: encrypt(refreshed.accessToken, platformEnv.FIRM_SIGNING_KEY),
        expiresAt: addSeconds(new Date(), refreshed.expiresIn),
      })
    }
  }

  async syncContact(tenantId: TenantId, lead: Lead): Promise<CRMSyncResult> {
    await this.refreshTokenIfNeeded()
    // HubSpot contact properties mapping
    const properties = {
      firstname: lead.firstName,
      lastname: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      hs_lead_status: this.mapLeadStatus(lead.status),
      lead_score: String(lead.score),
    }
    // Upsert via HubSpot's /crm/v3/objects/contacts endpoint
    // ...
  }
}
```

**Estimate:** 12 hours

***

## 11.3 Email Adapter Contracts

### `EmailAdapter` Interface (from `@firm/types`)

```typescript
export interface EmailAdapter {
  sendEmail(tenantId: TenantId, payload: EmailPayload): Promise<EmailSendResult>
  sendBatch(tenantId: TenantId, payloads: EmailPayload[]): Promise<EmailSendResult[]>
  getBounces(tenantId: TenantId, since: Date): Promise<BounceRecord[]>
  getUnsubscribes(tenantId: TenantId, since: Date): Promise<EmailAddress[]>
  addToSuppression(tenantId: TenantId, email: EmailAddress): Promise<void>
  removeFromSuppression(tenantId: TenantId, email: EmailAddress): Promise<void>
  validateSendingDomain(tenantId: TenantId, domain: string): Promise<DomainValidation>
  testConnection(tenantId: TenantId): Promise<{ ok: boolean; error?: string }>
}

export interface EmailPayload {
  to: EmailAddress | EmailAddress[]
  from: EmailAddress
  replyTo?: EmailAddress
  subject: string
  html: string
  text: string                    // Plain text fallback — required
  attachments?: EmailAttachment[]
  idempotencyKey?: string         // Provider-level deduplication
  trackingConsent: boolean        // CNIL compliance — must be explicit
  tags?: Record<string, string>   // For provider-side analytics
}
```

### `adapters-email-resend` — P1 Priority

```typescript
export class ResendEmailAdapter implements EmailAdapter {

  async sendEmail(
    tenantId: TenantId,
    payload: EmailPayload
  ): Promise<EmailSendResult> {
    return createSpan('adapter.resend.sendEmail', async (span) => {
      span.setAttributes({ 'tenant.id': tenantId })

      // CNIL compliance — strip tracking pixel if no consent
      const html = payload.trackingConsent
        ? payload.html
        : stripTrackingPixels(payload.html)

      const resendPayload: CreateEmailOptions = {
        from: payload.from,
        to: Array.isArray(payload.to) ? payload.to : [payload.to],
        subject: payload.subject,
        html,
        text: payload.text,
        attachments: payload.attachments,
        // Idempotency key prevents duplicate sends on retry
        idempotency_key: payload.idempotencyKey,
        tags: payload.tags ? Object.entries(payload.tags).map(
          ([name, value]) => ({ name, value })
        ) : undefined,
      }

      const result = await this.client.emails.send(resendPayload)

      emailSentTotal.inc({
        tenant_id: tenantId,
        provider: 'resend',
        type: payload.tags?.type ?? 'transactional',
      })

      return {
        messageId: result.id,
        provider: 'resend',
        sentAt: new Date(),
      }
    })
  }

  async getBounces(
    tenantId: TenantId,
    since: Date
  ): Promise<BounceRecord[]> {
    // Resend doesn't have a native bounce list API
    // Bounces are received via webhook and stored in firm-db
    // This method queries the local bounce log
    return db.select()
      .from(email_bounce_log)
      .where(
        and(
          eq(email_bounce_log.tenantId, tenantId),
          eq(email_bounce_log.provider, 'resend'),
          gte(email_bounce_log.bouncedAt, since)
        )
      )
  }
}

// Inbound webhook handler — in apps/platform/platform-admin
// Resend uses Svix for webhook delivery
function stripTrackingPixels(html: string): string {
  // Remove <img> tags with tracking pixel patterns
  return html.replace(
    /<img[^>]*src=["'][^"']*\/(track|open|pixel)[^"']*["'][^>]*>/gi,
    ''
  )
}
```

**Acceptance checklist — `adapters-email-resend`:**
- [ ] `sendEmail()` strips tracking pixels when `trackingConsent === false`
- [ ] `sendBatch()` uses Resend batch API for up to 100 emails per call
- [ ] Inbound webhook handles: `email.sent`, `email.delivered`, `email.bounced`, `email.complained`, `email.clicked`, `email.opened`
- [ ] All three webhook security contract functions implemented using Resend's Svix signing
- [ ] `getBounces()` queries local bounce log (populated by webhook)
- [ ] `addToSuppression()` adds to Resend suppression list AND local suppression cache
- [ ] `emailSentTotal` and `emailBounceTotal` metrics incremented
- [ ] `testConnection()` validates API key via domains list

**Estimate:** 10 hours

***

## 11.4 SMS Adapter Contracts

### `SMSAdapter` Interface (from `@firm/types`)

```typescript
export interface SMSAdapter {
  sendSMS(tenantId: TenantId, payload: SMSPayload): Promise<SMSSendResult>
  sendBulkSMS(tenantId: TenantId, payloads: SMSPayload[]): Promise<SMSSendResult[]>
  getDeliveryStatus(tenantId: TenantId, messageId: string): Promise<SMSDeliveryStatus>
  getOptOuts(tenantId: TenantId, since: Date): Promise<PhoneNumber[]>
  validatePhoneNumber(tenantId: TenantId, phone: string): Promise<PhoneValidation>
  testConnection(tenantId: TenantId): Promise<{ ok: boolean; error?: string }>
}

export interface SMSPayload {
  to: PhoneNumber           // E.164 format: +12125551234
  from: PhoneNumber         // Tenant's provisioned number
  body: string              // Max 160 chars for single SMS, 1600 for concatenated
  idempotencyKey?: string
  mediaUrl?: string[]       // For MMS — max 10 URLs
}
```

### `adapters-sms-twilio` — P2 Priority

```typescript
export class TwilioSMSAdapter implements SMSAdapter {

  async sendSMS(
    tenantId: TenantId,
    payload: SMSPayload
  ): Promise<SMSSendResult> {
    return createSpan('adapter.twilio.sendSMS', async (span) => {

      // Validate phone number is not in opt-out list before sending
      const isOptedOut = await this.checkOptOut(tenantId, payload.to)
      if (isOptedOut) {
        throw new SMSOptOutError(tenantId, payload.to)
      }

      const message = await this.client.messages.create({
        to: payload.to,
        from: payload.from,
        body: payload.body,
        mediaUrl: payload.mediaUrl,
        // Twilio idempotency: use X-Twilio-Idempotency-Token header
        // Passed via client configuration
      })

      smsSentTotal.inc({ tenant_id: tenantId, provider: 'twilio' })

      return {
        messageId: message.sid,
        status: message.status as SMSDeliveryStatus,
        provider: 'twilio',
        sentAt: new Date(),
      }
    })
  }
}
```

**Twilio webhook events to handle:**
```typescript
const TWILIO_STATUS_CALLBACKS = [
  'queued', 'sending', 'sent',
  'delivered', 'undelivered', 'failed',
  'received',  // Inbound SMS — for two-way SMS features
] as const

// STOP/UNSTOP/HELP keywords handled by Twilio automatically
// Opt-out records must be synced via webhook and stored locally
```

***

## 11.5 Analytics Adapter Contracts

### `AnalyticsAdapter` Interface (from `@firm/types`)

```typescript
export interface AnalyticsAdapter {
  getPageViews(tenantId: TenantId, params: AnalyticsParams): Promise<PageViewData>
  getSessions(tenantId: TenantId, params: AnalyticsParams): Promise<SessionData>
  getConversions(tenantId: TenantId, params: AnalyticsParams): Promise<ConversionData>
  getTopPages(tenantId: TenantId, params: AnalyticsParams): Promise<TopPageData[]>
  getTrafficSources(tenantId: TenantId, params: AnalyticsParams): Promise<TrafficSourceData[]>
  getRealTimeVisitors(tenantId: TenantId): Promise<number>
  testConnection(tenantId: TenantId): Promise<{ ok: boolean; error?: string }>
}

export interface AnalyticsParams {
  startDate: Date
  endDate: Date
  propertyId: string        // GA4: numeric property ID
  dimensions?: string[]     // GA4: 'pagePath', 'deviceCategory', 'country' etc.
  metrics?: string[]        // GA4: 'screenPageViews', 'sessions', 'bounceRate' etc.
  currency?: string         // For ecommerce metrics
}
```

### `adapters-analytics-ga4` — P2 Priority

```typescript
export class GA4AnalyticsAdapter implements AnalyticsAdapter {

  async getPageViews(
    tenantId: TenantId,
    params: AnalyticsParams
  ): Promise<PageViewData> {
    return createSpan('adapter.ga4.getPageViews', async (span) => {

      // GA4 Data API — not Universal Analytics
      const response = await this.analyticsData.runReport({
        property: `properties/${params.propertyId}`,
        dateRanges: [{
          startDate: formatDate(params.startDate),
          endDate: formatDate(params.endDate),
        }],
        metrics: [{ name: 'screenPageViews' }, { name: 'sessions' }],
        dimensions: [{ name: 'date' }],
      })

      return {
        total: sumMetric(response.rows, 'screenPageViews'),
        byDate: mapRowsToDateSeries(response.rows, 'screenPageViews'),
        sessions: sumMetric(response.rows, 'sessions'),
      }
    })
  }

  async testConnection(
    tenantId: TenantId
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      // Lightweight call — get property metadata
      await this.analyticsAdmin.getProperty({
        name: `properties/${this.config.propertyId}`
      })
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error.message }
    }
  }
}
```

***

## 11.6 Reviews & Reputation Adapter Contracts

### `ReviewsAdapter` Interface (from `@firm/types`)

```typescript
export interface ReviewsAdapter {
  fetchReviews(tenantId: TenantId, params: ReviewFetchParams): Promise<Paginated<Review>>
  replyToReview(tenantId: TenantId, reviewId: string, reply: string): Promise<void>
  deleteReply(tenantId: TenantId, reviewId: string): Promise<void>
  getAverageRating(tenantId: TenantId): Promise<RatingStats>
  getListingInfo(tenantId: TenantId): Promise<ListingInfo>
  testConnection(tenantId: TenantId): Promise<{ ok: boolean; error?: string }>
}
```

### `adapters-reviews-google` — P2 Priority

Connects to Google Business Profile (GBP) API via OAuth2. The most important reviews adapter — Google reviews are the primary reputation signal for most local businesses.

```typescript
export class GoogleReviewsAdapter implements ReviewsAdapter {

  async fetchReviews(
    tenantId: TenantId,
    params: ReviewFetchParams
  ): Promise<Paginated<Review>> {
    await this.refreshTokenIfNeeded(tenantId)

    const response = await this.mybusiness.accounts.locations.reviews.list({
      parent: `accounts/${this.config.accountId}/locations/${this.config.locationId}`,
      pageSize: params.limit ?? 50,
      pageToken: params.cursor,
      orderBy: 'updateTime desc',
    })

    return {
      data: response.data.reviews?.map(this.mapGoogleReview) ?? [],
      nextCursor: response.data.nextPageToken ?? null,
      total: response.data.totalReviewCount ?? 0,
    }
  }

  async replyToReview(
    tenantId: TenantId,
    reviewId: string,
    reply: string
  ): Promise<void> {
    await this.refreshTokenIfNeeded(tenantId)

    await this.mybusiness.accounts.locations.reviews.updateReply({
      name: `accounts/${this.config.accountId}/locations/${this.config.locationId}/reviews/${reviewId}`,
      requestBody: { comment: reply },
    })

    // Record reply in local reviews table for analytics
    await db.update(reviews)
      .set({
        replyText: reply,
        repliedAt: new Date(),
        repliedByUserId: getCurrentContext()?.userId,
      })
      .where(
        and(
          eq(reviews.externalId, reviewId),
          eq(reviews.tenantId, tenantId)
        )
      )
  }

  private mapGoogleReview(review: GoogleReview): Review {
    return {
      id: review.reviewId as ReviewId,
      externalId: review.reviewId,
      provider: 'google',
      rating: this.mapStarRating(review.starRating),
      text: review.comment,
      reviewerName: review.reviewer?.displayName ?? 'Anonymous',
      reviewerAvatar: review.reviewer?.profilePhotoUrl,
      publishedAt: new Date(review.createTime),
      updatedAt: new Date(review.updateTime),
      replyText: review.reviewReply?.comment,
      repliedAt: review.reviewReply?.updateTime
        ? new Date(review.reviewReply.updateTime)
        : undefined,
    }
  }
}
```

**Acceptance checklist — `adapters-reviews-google`:**
- [ ] OAuth2 token refresh handled transparently before every API call
- [ ] `fetchReviews()` returns reviews in descending date order
- [ ] `replyToReview()` posts reply to GBP AND records in local `reviews` table
- [ ] `getAverageRating()` returns average ± trend (vs previous period)
- [ ] `getListingInfo()` returns business name, address, phone, categories
- [ ] No webhook — GBP uses polling. `worker-reputation` polls every 15 minutes
- [ ] `adapterOperationDuration` and `adapterErrors` metrics recorded
- [ ] `testConnection()` verifies OAuth token validity

**Estimate:** 10 hours

***

## 11.7 Calendar & Booking Adapter Contracts

### `CalendarAdapter` Interface (from `@firm/types`)

```typescript
export interface CalendarAdapter {
  getAvailableSlots(
    tenantId: TenantId,
    params: AvailabilityParams
  ): Promise<TimeSlot[]>

  createEvent(
    tenantId: TenantId,
    booking: Booking
  ): Promise<CalendarEvent>

  updateEvent(
    tenantId: TenantId,
    externalEventId: string,
    updates: Partial<CalendarEventUpdate>
  ): Promise<CalendarEvent>

  deleteEvent(
    tenantId: TenantId,
    externalEventId: string
  ): Promise<void>

  watchCalendar(
    tenantId: TenantId,
    channelId: string,
    webhookUrl: string
  ): Promise<CalendarWatchResult>

  testConnection(
    tenantId: TenantId
  ): Promise<{ ok: boolean; error?: string }>
}
```

### `adapters-calendar-google` — P2 Priority

```typescript
export class GoogleCalendarAdapter implements CalendarAdapter {

  async getAvailableSlots(
    tenantId: TenantId,
    params: AvailabilityParams
  ): Promise<TimeSlot[]> {
    await this.refreshTokenIfNeeded(tenantId)

    // Use Google Calendar free/busy API
    const freeBusy = await this.calendar.freebusy.query({
      requestBody: {
        timeMin: params.startDate.toISOString(),
        timeMax: params.endDate.toISOString(),
        items: [{ id: this.config.calendarId }],
      }
    })

    const busyPeriods = freeBusy.data.calendars?.[this.config.calendarId]?.busy ?? []

    // Calculate available slots by subtracting busy periods from working hours
    return calculateAvailableSlots(
      busyPeriods,
      params.workingHours,
      params.slotDurationMinutes,
      params.bufferMinutes
    )
  }

  async createEvent(
    tenantId: TenantId,
    booking: Booking
  ): Promise<CalendarEvent> {
    await this.refreshTokenIfNeeded(tenantId)

    const event = await this.calendar.events.insert({
      calendarId: this.config.calendarId,
      requestBody: {
        summary: booking.title,
        description: booking.notes,
        start: {
          dateTime: booking.startTime.toISOString(),
          timeZone: booking.timezone,
        },
        end: {
          dateTime: booking.endTime.toISOString(),
          timeZone: booking.timezone,
        },
        attendees: [
          { email: booking.clientEmail, displayName: booking.clientName },
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 },
          ],
        },
        conferenceData: booking.includeVideoLink
          ? { createRequest: { requestId: booking.id } }
          : undefined,
      },
      conferenceDataVersion: booking.includeVideoLink ? 1 : 0,
      sendUpdates: 'all',
    })

    return {
      externalId: event.data.id!,
      htmlLink: event.data.htmlLink!,
      meetLink: event.data.hangoutLink,
    }
  }
}
```

***

## 11.8 Billing Adapter Contract

### `BillingAdapter` Interface (from `@firm/types`)

```typescript
export interface BillingAdapter {
  createCustomer(tenantId: TenantId, params: CreateCustomerParams): Promise<BillingCustomer>
  createSubscription(tenantId: TenantId, params: CreateSubscriptionParams): Promise<Subscription>
  updateSubscription(tenantId: TenantId, subscriptionId: string, params: UpdateSubscriptionParams): Promise<Subscription>
  cancelSubscription(tenantId: TenantId, subscriptionId: string, params: CancelSubscriptionParams): Promise<void>
  createInvoice(tenantId: TenantId, params: CreateInvoiceParams): Promise<Invoice>
  listInvoices(tenantId: TenantId, customerId: string): Promise<Paginated<Invoice>>
  getUpcomingInvoice(tenantId: TenantId, customerId: string): Promise<Invoice>
  createPortalSession(tenantId: TenantId, customerId: string): Promise<string>
  testConnection(tenantId: TenantId): Promise<{ ok: boolean; error?: string }>
}
```

### `adapters-billing-stripe` — P1 Priority

```typescript
export class StripeAdapter implements BillingAdapter {

  async createSubscription(
    tenantId: TenantId,
    params: CreateSubscriptionParams
  ): Promise<Subscription> {
    return createSpan('adapter.stripe.createSubscription', async (span) => {
      span.setAttributes({
        'tenant.id': tenantId,
        'subscription.plan': params.planId,
      })

      const subscription = await this.stripe.subscriptions.create({
        customer: params.customerId,
        items: [{ price: params.planId }],
        trial_period_days: params.trialDays,
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          tenantId,
          platform: 'firm-platform',
        },
      })

      return this.mapStripeSubscription(subscription)
    })
  }
}
```

**Stripe webhook events to handle (complete list):**

```typescript
const STRIPE_WEBHOOK_EVENTS = [
  // Subscription lifecycle
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.trial_will_end',  // 3 days before trial ends

  // Payment lifecycle
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'invoice.paid',
  'invoice.payment_failed',
  'invoice.upcoming',                       // 7 days before charge

  // Customer updates
  'customer.updated',
  'payment_method.attached',
  'payment_method.detached',
] as const
```

**Acceptance checklist — `adapters-billing-stripe`:**
- [ ] All 11 webhook event types handled
- [ ] Webhook signature uses Stripe's `t=` + `v1=` header format
- [ ] Replay prevention uses `t=` timestamp from signature header (not event object)
- [ ] Idempotency key on all subscription and invoice operations
- [ ] Dunning logic: `invoice.payment_failed` → `firm/payment.failed` event → `worker-billing-events` handles retry schedule
- [ ] `createPortalSession()` returns Stripe Billing Portal URL for self-serve subscription management
- [ ] Test mode and live mode supported — selected by `STRIPE_SECRET_KEY` prefix (`sk_test_` vs `sk_live_`)

**Estimate:** 14 hours

***

## 11.9 Storage Adapter Contract

### `StorageAdapter` Interface (from `@firm/types`)

```typescript
export interface StorageAdapter {
  upload(params: UploadParams): Promise<StorageObject>
  getSignedUrl(key: string, expiresInSeconds: number): Promise<string>
  delete(key: string): Promise<void>
  copy(sourceKey: string, destinationKey: string): Promise<void>
  list(prefix: string, cursor?: string): Promise<Paginated<StorageObject>>
  getMetadata(key: string): Promise<StorageObjectMetadata>
  testConnection(): Promise<{ ok: boolean; error?: string }>
}

export interface UploadParams {
  key: string               // Full path: tenants/{tenantId}/public/2026/05/file.jpg
  body: Buffer | ReadableStream
  contentType: string
  metadata?: Record<string, string>
  cacheControl?: string     // 'public, max-age=31536000' for static assets
}
```

### `adapters-storage-r2` — P1 Priority

```typescript
export class CloudflareR2StorageAdapter implements StorageAdapter {

  constructor(private config: {
    accountId: string
    accessKeyId: string
    secretAccessKey: string
    bucketName: string
    publicUrl?: string       // Optional CDN URL for public assets
  }) {
    // R2 uses S3-compatible API
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    })
  }

  async upload(params: UploadParams): Promise<StorageObject> {
    return createSpan('adapter.r2.upload', async (span) => {
      span.setAttributes({ 'storage.key': params.key, 'storage.content_type': params.contentType })

      const command = new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: params.key,
        Body: params.body,
        ContentType: params.contentType,
        Metadata: params.metadata,
        CacheControl: params.cacheControl,
      })

      await this.s3.send(command)

      return {
        key: params.key,
        url: this.config.publicUrl
          ? `${this.config.publicUrl}/${params.key}`
          : undefined,
        contentType: params.contentType,
        uploadedAt: new Date(),
      }
    })
  }

  async getSignedUrl(
    key: string,
    expiresInSeconds: number
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.config.bucketName,
      Key: key,
    })

    return getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds })
  }
}
```

***

## 11.10 AI Model Adapter Contracts

### `AIAdapter` Interface (from `@firm/types`)

```typescript
export interface AIAdapter {
  generate(params: AIGenerationParams): Promise<AIGenerationResult>
  generateStream(params: AIGenerationParams): AsyncIterable<AIStreamChunk>
  generateEmbedding(params: EmbeddingParams): Promise<number[]>
  countTokens(text: string, model: string): Promise<number>
  listModels(): Promise<AIModel[]>
  testConnection(): Promise<{ ok: boolean; error?: string }>
}

export interface AIGenerationParams {
  model: string
  messages: AIMessage[]
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  responseFormat?: 'text' | 'json_object'
  stopSequences?: string[]
}

export interface AIGenerationResult {
  content: string
  usage: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  model: string
  finishReason: 'stop' | 'max_tokens' | 'stop_sequence'
  durationMs: number
}
```

### `adapters-ai-anthropic` — P3 Priority

```typescript
export class AnthropicAIAdapter implements AIAdapter {

  async generate(params: AIGenerationParams): Promise<AIGenerationResult> {
    return createSpan('adapter.anthropic.generate', async (span) => {
      const start = Date.now()
      span.setAttributes({ 'ai.model': params.model })

      const message = await this.client.messages.create({
        model: params.model,
        max_tokens: params.maxTokens ?? 4096,
        temperature: params.temperature ?? 0.7,
        system: params.systemPrompt,
        messages: params.messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      })

      const content = message.content
        .filter(block => block.type === 'text')
        .map(block => (block as TextBlock).text)
        .join('')

      return {
        content,
        usage: {
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens,
          totalTokens: message.usage.input_tokens + message.usage.output_tokens,
        },
        model: message.model,
        finishReason: message.stop_reason === 'end_turn' ? 'stop' : 'max_tokens',
        durationMs: Date.now() - start,
      }
    })
  }

  async* generateStream(
    params: AIGenerationParams
  ): AsyncIterable<AIStreamChunk> {
    const stream = this.client.messages.stream({
      model: params.model,
      max_tokens: params.maxTokens ?? 4096,
      messages: params.messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield { content: chunk.delta.text, done: false }
      }
    }

    const finalMessage = await stream.finalMessage()
    yield {
      content: '',
      done: true,
      usage: {
        inputTokens: finalMessage.usage.input_tokens,
        outputTokens: finalMessage.usage.output_tokens,
        totalTokens: finalMessage.usage.input_tokens + finalMessage.usage.output_tokens,
      },
    }
  }
}
```

***

## 11.11 Adapter Factory Pattern

Feature packages never instantiate adapter classes directly. Adapters are resolved at runtime via a factory that reads tenant configuration:

```typescript
// packages/firm-config/src/adapter-factory.ts

export async function getAdapterForTenant<T>(
  tenantId: TenantId,
  category: AdapterCategory   // 'email' | 'crm' | 'sms' | 'storage' etc.
): Promise<T> {

  const tenantConfig = await getTenantConfig(tenantId)
  const adapterConfig = tenantConfig.integrations[category]

  if (!adapterConfig) {
    throw new AdapterNotConfiguredError(tenantId, category)
  }

  // Decrypt credentials stored in DB
  const decryptedConfig = decryptAdapterConfig(adapterConfig)

  // Resolve adapter class by provider name
  switch (adapterConfig.provider) {
    case 'resend':
      return new ResendEmailAdapter(decryptedConfig) as T
    case 'sendgrid':
      return new SendGridEmailAdapter(decryptedConfig) as T
    case 'gohighlevel':
      return new GoHighLevelCRMAdapter(decryptedConfig) as T
    case 'hubspot':
      return new HubSpotCRMAdapter(decryptedConfig) as T
    // ... all providers
    default:
      throw new UnknownAdapterProviderError(adapterConfig.provider)
  }
}
```

**Usage in feature packages:**

```typescript
// packages/firm-campaigns/src/email-step.ts
// Feature package never imports adapter directly — always via factory

export async function executeCampaignEmailStep(
  tenantId: TenantId,
  step: CampaignStep,
  lead: Lead
): Promise<void> {
  // Adapter resolved at runtime — swappable without code changes
  const emailAdapter = await getAdapterForTenant<EmailAdapter>(tenantId, 'email')

  await emailAdapter.sendEmail(tenantId, {
    to: lead.email,
    from: step.fromEmail,
    subject: step.subject,
    html: renderEmailTemplate(step.htmlTemplate, lead),
    text: renderTextTemplate(step.textTemplate, lead),
    trackingConsent: await hasConsent(tenantId, lead.userId, lead.ipAddress, 'email_tracking'),
    idempotencyKey: `campaign-step-${step.id}-lead-${lead.id}`,
    tags: { type: 'campaign', campaignId: step.campaignId },
  })
}
```

# Marketing Agency Mono Repository Blueprint & Assessment
## Part 12 — Worker & Background Job Architecture

***

> **Purpose of This Part:** This part defines every background worker in the platform — what it processes, how it is structured, how it handles retries and failures, and the Inngest saga patterns for multi-step workflows. For AI coding agents: a worker is not a cron job wrapped in a setTimeout. Every worker in this platform uses Inngest for orchestration, records spans and metrics, handles failures via the dead-letter pattern, and deploys as a dedicated containerized service on Hetzner/Coolify. A worker that processes a job without recording its outcome to Prometheus, or retries without exponential backoff, is incomplete.

***

## 12.1 Worker Architecture Foundation

### Why Inngest, Not Bull/BullMQ/pg-boss

The platform uses Inngest as the job orchestration layer rather than a queue-based system for three reasons:

**Durability without a broker.** BullMQ requires Redis as a broker — if Redis is unavailable, jobs cannot be enqueued. Inngest uses the outbox pattern: events are committed to PostgreSQL atomically with the business operation, then Inngest picks them up. The database is the source of truth, not an in-memory queue.

**First-class saga support.** Multi-step workflows — tenant provisioning, campaign sequences, GDPR erasure — require coordinating state across multiple function invocations with compensation logic if a step fails. Inngest's `step.run()`, `step.sleep()`, and `step.waitForEvent()` primitives are designed for this. Building equivalent orchestration on BullMQ requires significant custom infrastructure.

**Observability built-in.** Every Inngest function invocation has a trace in the Inngest dashboard and can be replayed, retried, or cancelled manually. For a platform serving 1,000 tenants, manual replay of a failed job is a support workflow, not a developer workflow.

### Worker Process Structure

Every worker follows this initialization pattern:

```typescript
// services/workers/worker-{name}/src/index.ts

import { initObservability } from '@firm/observability'
import { validateEnv, workerEnv } from '@firm/env'
import { createLogger } from '@firm/logger'
import { createHealthRouter } from '@firm/health'
import { serve } from 'inngest/node'
import { inngest } from './inngest-client'
import { functions } from './functions'

const logger = createLogger('worker-{name}')

async function main() {
  // Step 1: Validate environment before anything else runs
  validateEnv()

  // Step 2: Initialize observability (OTel SDK + Prometheus exporter)
  initObservability({
    serviceName: 'worker-{name}',
    serviceVersion: workerEnv.PLATFORM_VERSION,
  })

  logger.info('Worker starting')

  // Step 3: Start Inngest function server
  const { listen } = serve({
    client: inngest,
    functions,
  })

  await listen({ port: 3000 })
  logger.info({ port: 3000 }, 'Inngest function server listening')

  // Step 4: Start Prometheus metrics server
  startMetricsServer({ port: 9090 })
  logger.info({ port: 9090 }, 'Prometheus metrics server listening')

  // Step 5: Start health endpoint
  const healthServer = createHealthServer({
    port: 9091,
    checkers: [databaseHealthChecker, redisHealthChecker],
  })
  await healthServer.listen()
  logger.info({ port: 9091 }, 'Health endpoint listening')
}

main().catch((error) => {
  logger.fatal({ error }, 'Worker startup failed')
  process.exit(1)
})
```

### Inngest Client Configuration

```typescript
// packages/firm-background-jobs/src/inngest-client.ts

import { Inngest } from 'inngest'
import type { EventRegistry } from '@firm/api-contracts'

// Typed Inngest client — event names and payloads are type-checked
export const inngest = new Inngest({
  id: 'firm-platform',
  eventKey: workerEnv.INNGEST_EVENT_KEY,
  // Type-safe events — EventRegistry maps every event name to its payload type
  schemas: new EventSchemas().fromRecord<EventRegistry>(),
})
```

### Outbox Processor — The Event Bridge

The outbox processor is the bridge between PostgreSQL outbox events and Inngest. It runs as `worker-outbox-processor` and is the only service that reads from `outbox_events` with `status = 'pending'`.

```typescript
// services/workers/worker-outbox-processor/src/processor.ts

export async function processOutboxBatch(): Promise<void> {
  return createSpan('outbox.process-batch', async (span) => {

    // Claim a batch atomically — FOR UPDATE SKIP LOCKED prevents double processing
    // across multiple replicas of this worker
    const events = await db.execute(sql`
      UPDATE outbox_events
      SET
        status = 'processing',
        locked_at = NOW(),
        locked_by = ${workerId}
      WHERE id IN (
        SELECT id FROM outbox_events
        WHERE status = 'pending'
          AND scheduled_at <= NOW()
        ORDER BY created_at ASC
        LIMIT ${BATCH_SIZE}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING *
    `)

    if (events.rows.length === 0) return

    span.setAttributes({ 'outbox.batch_size': events.rows.length })
    logger.info({ batchSize: events.rows.length }, 'Processing outbox batch')

    await Promise.allSettled(
      events.rows.map(event => processOutboxEvent(event))
    )
  })
}

async function processOutboxEvent(event: OutboxEvent): Promise<void> {
  const timer = adapterOperationDuration.startTimer({
    adapter: 'outbox',
    operation: event.event_name,
    tenant_id: event.tenant_id,
  })

  try {
    // Dispatch to Inngest — the outbox event becomes an Inngest event
    await inngest.send({
      name: event.event_name,
      data: event.payload.data,
      id: event.idempotency_key,   // Inngest deduplicates on this
    })

    // Mark as delivered
    await db.update(outbox_events)
      .set({ status: 'delivered', delivered_at: new Date() })
      .where(eq(outbox_events.id, event.id))

    timer()
    outboxEventsProcessed.inc({
      event_name: event.event_name,
      status: 'delivered',
    })

  } catch (error) {
    const attempts = event.attempts + 1
    const willRetry = attempts < MAX_ATTEMPTS

    await db.update(outbox_events)
      .set({
        status: willRetry ? 'pending' : 'dead_lettered',
        attempts,
        last_error: (error as Error).message,
        // Exponential backoff: 30s, 2m, 8m, 32m, 2h
        scheduled_at: willRetry
          ? addSeconds(new Date(), Math.pow(4, attempts) * 30)
          : undefined,
        dead_lettered_at: willRetry ? undefined : new Date(),
      })
      .where(eq(outbox_events.id, event.id))

    if (!willRetry) {
      outboxDeadLettered.inc({
        event_name: event.event_name,
        tenant_id: event.tenant_id,
      })
      logger.error(
        { eventId: event.id, eventName: event.event_name, tenantId: event.tenant_id },
        'Outbox event dead-lettered after max retries'
      )
    }

    timer()
  }
}
```

***

## 12.2 Worker Catalog

### `worker-outbox-processor`

**Purpose:** Reads pending outbox events and dispatches them to Inngest. The single point of outbox consumption.

**Replicas:** 2 (active-active with `FOR UPDATE SKIP LOCKED`)
**Poll interval:** 500ms
**Batch size:** 50 events per poll

```typescript
// Inngest function definition — not used here
// This worker uses direct polling, not Inngest functions
// (Inngest cannot trigger itself from a database poll)

// Polling loop:
setInterval(processOutboxBatch, 500)

// Metrics exposed:
// firm_outbox_events_pending (gauge — polled from DB)
// firm_outbox_events_processed_total (counter)
// firm_outbox_dead_letter_total (counter)
```

***

### `worker-campaigns`

**Purpose:** Executes campaign sequences — enrolls leads, sends emails/SMS per step, handles delays, respects unsubscribes.

**Replicas:** 3
**Inngest functions:** 4

```typescript
// Function 1: Enroll lead in campaign
export const enrollLeadInCampaign = inngest.createFunction(
  {
    id: 'campaigns/enroll-lead',
    retries: 3,
    concurrency: { limit: 100 },   // Max 100 concurrent enrollments
  },
  { event: 'firm/lead.campaign-enrolled' },
  async ({ event, step }) => {
    const { tenantId, leadId, campaignId } = event.data

    // Step 1: Verify enrollment eligibility
    const enrollment = await step.run('verify-eligibility', async () => {
      const lead = await leadsService.get(tenantId, leadId)
      const campaign = await campaignsService.get(tenantId, campaignId)

      if (!lead || !campaign) throw new NonRetriableError('Lead or campaign not found')
      if (campaign.status !== 'active') throw new NonRetriableError('Campaign not active')
      if (await isLeadEnrolled(tenantId, leadId, campaignId)) {
        throw new NonRetriableError('Lead already enrolled — idempotent skip')
      }

      return { lead, campaign }
    })

    // Step 2: Create enrollment record
    await step.run('create-enrollment', async () => {
      await db.insert(campaign_enrollments).values({
        tenantId,
        leadId,
        campaignId,
        enrolledAt: new Date(),
        status: 'active',
        currentStep: 0,
      })
    })

    // Step 3: Execute each step in sequence
    for (const [index, campaignStep] of enrollment.campaign.steps.entries()) {
      // Wait for the step's delay before executing
      if (campaignStep.delayMs > 0) {
        await step.sleep(`delay-step-${index}`, campaignStep.delayMs)
      }

      // Check for unsubscribe or cancellation before each step
      const shouldContinue = await step.run(`check-continue-${index}`, async () => {
        const enrollment = await getEnrollment(tenantId, leadId, campaignId)
        return enrollment?.status === 'active'
      })

      if (!shouldContinue) break

      // Execute the step
      await step.run(`execute-step-${index}`, async () => {
        await executeCampaignStep(tenantId, campaignStep, leadId)
      })

      // Update progress
      await step.run(`update-progress-${index}`, async () => {
        await db.update(campaign_enrollments)
          .set({ currentStep: index + 1 })
          .where(
            and(
              eq(campaign_enrollments.tenantId, tenantId),
              eq(campaign_enrollments.leadId, leadId),
              eq(campaign_enrollments.campaignId, campaignId)
            )
          )
      })
    }

    // Mark enrollment complete
    await step.run('complete-enrollment', async () => {
      await db.update(campaign_enrollments)
        .set({ status: 'completed', completedAt: new Date() })
        .where(
          and(
            eq(campaign_enrollments.tenantId, tenantId),
            eq(campaign_enrollments.leadId, leadId),
            eq(campaign_enrollments.campaignId, campaignId)
          )
        )
    })
  }
)

// Function 2: Handle unsubscribe — cancels all active enrollments for this email
export const handleUnsubscribe = inngest.createFunction(
  { id: 'campaigns/handle-unsubscribe', retries: 3 },
  { event: 'firm/lead.unsubscribed' },
  async ({ event, step }) => {
    const { tenantId, email } = event.data

    await step.run('cancel-enrollments', async () => {
      await db.update(campaign_enrollments)
        .set({ status: 'cancelled', cancelledAt: new Date(), cancelReason: 'unsubscribed' })
        .where(
          and(
            eq(campaign_enrollments.tenantId, tenantId),
            inArray(
              campaign_enrollments.leadId,
              db.select({ id: leads.id })
                .from(leads)
                .where(and(eq(leads.email, email), eq(leads.tenantId, tenantId)))
            )
          )
        )
    })
  }
)
```

***

### `worker-crm-sync`

**Purpose:** Syncs leads to external CRM systems. Handles bidirectional sync conflicts using last-write-wins with timestamp comparison.

**Replicas:** 2
**Inngest functions:** 3

```typescript
export const syncLeadToCRM = inngest.createFunction(
  {
    id: 'crm/sync-lead',
    retries: 5,
    // Rate limit: max 10 concurrent CRM syncs per tenant
    // Prevents overwhelming external CRM APIs
    concurrency: {
      limit: 10,
      key: 'event.data.tenantId',
    },
    // Throttle: max 100 syncs per minute per tenant
    throttle: {
      limit: 100,
      period: '1m',
      key: 'event.data.tenantId',
    },
  },
  { event: 'firm/lead.created' },
  async ({ event, step }) => {
    const { tenantId, leadId } = event.data

    const result = await step.run('sync-to-crm', async () => {
      const lead = await leadsService.get(tenantId, leadId)
      if (!lead) throw new NonRetriableError(`Lead ${leadId} not found`)

      const crmAdapter = await getAdapterForTenant<CRMAdapter>(tenantId, 'crm')

      return crmAdapter.syncContact(tenantId, lead)
    })

    await step.run('record-sync-result', async () => {
      await db.insert(crm_sync_jobs).values({
        tenantId,
        leadId,
        provider: result.provider,
        externalId: result.externalId,
        syncedAt: new Date(),
        status: 'success',
      })
    })

    // Emit sync completion event
    await step.run('emit-synced-event', async () => {
      await db.insert(outbox_events).values({
        tenantId,
        event_name: 'firm/lead.synced',
        payload: createTypedEvent('firm/lead.synced', {
          tenantId,
          leadId,
          provider: result.provider,
          externalId: result.externalId,
        }),
        idempotency_key: `lead.synced.${leadId}.${result.provider}`,
      })
    })
  }
)
```

***

### `worker-tenant-provisioning`

**Purpose:** Orchestrates new tenant provisioning — the most complex saga in the platform. Must complete within 60 seconds (Gate 15 health check monitors this via `firm_tenant_provisioning_duration_seconds`).

**Replicas:** 1
**Inngest functions:** 2

```typescript
export const provisionTenant = inngest.createFunction(
  {
    id: 'tenancy/provision-tenant',
    retries: 0,      // Provisioning is NOT retried automatically — too many side effects
    // Manual retry via Inngest dashboard if needed
    timeout: '90s',  // 90 second hard timeout — 60s SLO with 30s buffer
  },
  { event: 'firm/tenant.provisioned' },
  async ({ event, step }) => {
    const { tenantId, slug, plan, ownerId } = event.data
    const timer = tenantProvisioningDuration.startTimer()

    try {
      // Each step is independently retryable within the saga
      // If step 3 fails, steps 1 and 2 are NOT re-run on retry

      // Step 1: Create tenant database record
      await step.run('create-tenant-record', async () => {
        await db.insert(tenants).values({
          id: tenantId,
          slug,
          plan,
          ownerId,
          status: 'provisioning',
        })
      })

      // Step 2: Create Stripe customer
      const stripeCustomer = await step.run('create-stripe-customer', async () => {
        const billingAdapter = await getAdapterForTenant<BillingAdapter>(tenantId, 'billing')
        const owner = await getUser(ownerId)
        return billingAdapter.createCustomer(tenantId, {
          email: owner.email,
          name: owner.name,
          metadata: { tenantId, slug },
        })
      })

      // Step 3: Provision Vercel project for client site
      const vercelProject = await step.run('provision-vercel-project', async () => {
        return vercelApi.createProject({
          name: `firm-client-${slug}`,
          framework: 'nextjs',
          environmentVariables: [
            { key: 'TENANT_ID', value: tenantId, target: ['production', 'preview'] },
            { key: 'TENANT_SLUG', value: slug, target: ['production', 'preview'] },
          ],
        })
      })

      // Step 4: Create Cloudflare DNS subdomain
      await step.run('create-dns-subdomain', async () => {
        await cloudflareApi.createDNSRecord({
          zone: 'firmplatform.com',
          type: 'CNAME',
          name: slug,
          content: 'cname.vercel-dns.com',
          proxied: true,
        })
      })

      // Step 5: Seed default configuration
      await step.run('seed-tenant-config', async () => {
        await seedTenantConfig(tenantId, plan)
      })

      // Step 6: Create default Inngest background job schedules
      await step.run('create-job-schedules', async () => {
        await createTenantJobSchedules(tenantId)
      })

      // Step 7: Send welcome notification to owner
      await step.run('send-welcome-notification', async () => {
        const emailAdapter = await getAdapterForTenant<EmailAdapter>(tenantId, 'email')
        await emailAdapter.sendEmail(tenantId, {
          to: event.data.ownerEmail,
          from: 'welcome@firmplatform.com',
          subject: 'Your platform is ready',
          html: renderWelcomeEmail({ slug, plan }),
          text: `Your Firm Platform account is ready. Visit https://${slug}.firmplatform.com`,
          trackingConsent: false,  // System email — no tracking
          idempotencyKey: `welcome-${tenantId}`,
        })
      })

      // Step 8: Mark tenant as active
      await step.run('activate-tenant', async () => {
        await db.update(tenants)
          .set({ status: 'active', provisionedAt: new Date() })
          .where(eq(tenants.id, tenantId))
      })

      timer()
      tenantProvisioningDuration.observe(timer())
      logger.info({ tenantId, slug }, 'Tenant provisioned successfully')

    } catch (error) {
      // Provisioning failed — run compensation
      await step.run('compensate-failed-provision', async () => {
        await runProvisioningCompensation(tenantId, error)
      })

      timer()
      logger.error({ tenantId, error }, 'Tenant provisioning failed — compensation run')
      throw error
    }
  }
)

// Compensation function — cleans up partial provisioning
async function runProvisioningCompensation(
  tenantId: TenantId,
  error: unknown
): Promise<void> {
  await db.update(tenants)
    .set({ status: 'provisioning_failed', failureReason: (error as Error).message })
    .where(eq(tenants.id, tenantId))

  // Best-effort cleanup — log failures but don't re-throw
  await Promise.allSettled([
    vercelApi.deleteProject(`firm-client-${tenantId}`).catch(e => logger.warn({ e }, 'Vercel cleanup failed')),
    cloudflareApi.deleteDNSRecord(tenantId).catch(e => logger.warn({ e }, 'DNS cleanup failed')),
  ])

  // Alert the ops team
  await notifyOpsTeam(`Tenant provisioning failed for ${tenantId}: ${(error as Error).message}`)
}
```

***

### `worker-email-delivery`

**Purpose:** Sends transactional and campaign emails. Enforces consent checks, suppression list, and rate limiting per tenant.

**Replicas:** 2
**Inngest functions:** 2

```typescript
export const sendTransactionalEmail = inngest.createFunction(
  {
    id: 'email/send-transactional',
    retries: 4,
    concurrency: {
      limit: 50,
      key: 'event.data.tenantId',
    },
  },
  { event: 'firm/notification.send-email' },
  async ({ event, step }) => {
    const { tenantId, payload } = event.data

    // Step 1: Pre-flight checks
    const canSend = await step.run('preflight-checks', async () => {
      // Check suppression list
      const isSuppressed = await isEmailSuppressed(tenantId, payload.to)
      if (isSuppressed) return { proceed: false, reason: 'suppressed' }

      // Check consent (for campaign emails only)
      if (payload.requiresConsent) {
        const hasEmailConsent = await hasConsent(
          tenantId, null, payload.recipientIp, 'email_tracking'
        )
        if (!hasEmailConsent) {
          // Send without tracking pixel — do not block
          return { proceed: true, trackingConsent: false }
        }
      }

      return { proceed: true, trackingConsent: payload.trackingConsent ?? true }
    })

    if (!canSend.proceed) {
      logger.info(
        { tenantId, email: '[REDACTED]', reason: canSend.reason },
        'Email send skipped'
      )
      return
    }

    // Step 2: Send via adapter
    const result = await step.run('send-email', async () => {
      const emailAdapter = await getAdapterForTenant<EmailAdapter>(tenantId, 'email')
      return emailAdapter.sendEmail(tenantId, {
        ...payload,
        trackingConsent: canSend.trackingConsent,
      })
    })

    // Step 3: Record send in DB
    await step.run('record-send', async () => {
      await db.insert(outbox_events).values({
        tenantId,
        event_name: 'firm/email.delivered',
        payload: createTypedEvent('firm/email.delivered', {
          tenantId,
          messageId: result.messageId,
          recipientEmail: '[REDACTED]',
        }),
        idempotency_key: `email.delivered.${result.messageId}`,
      })
    })
  }
)
```

***

### `worker-reports`

**Purpose:** Generates PDF reports on schedule or on-demand. Uses Puppeteer to render Next.js report pages to PDF.

**Replicas:** 1 (Puppeteer is memory-intensive — 1 replica with concurrency limit)
**Inngest functions:** 2

```typescript
export const generateReport = inngest.createFunction(
  {
    id: 'reports/generate',
    retries: 2,
    concurrency: { limit: 3 },  // Max 3 concurrent Puppeteer instances
    timeout: '5m',               // Reports can take up to 5 minutes
  },
  { event: 'firm/report.generate' },
  async ({ event, step }) => {
    const { tenantId, reportType, dateRange, recipientEmails } = event.data

    // Step 1: Gather report data
    const reportData = await step.run('gather-data', async () => {
      return gatherReportData(tenantId, reportType, dateRange)
    })

    // Step 2: Generate PDF via Puppeteer
    const pdfBuffer = await step.run('generate-pdf', async () => {
      const reportUrl = buildReportUrl(tenantId, reportType, reportData)
      return generatePDF(reportUrl, {
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
      })
    })

    // Step 3: Upload to R2 storage
    const storageKey = await step.run('upload-pdf', async () => {
      const key = `tenants/${tenantId}/reports/${reportType}-${Date.now()}.pdf`
      const storageAdapter = await getAdapterForTenant<StorageAdapter>(tenantId, 'storage')
      await storageAdapter.upload({
        key,
        body: pdfBuffer,
        contentType: 'application/pdf',
        cacheControl: 'private, max-age=86400',
      })
      return key
    })

    // Step 4: Get signed download URL (7-day expiry)
    const downloadUrl = await step.run('get-download-url', async () => {
      const storageAdapter = await getAdapterForTenant<StorageAdapter>(tenantId, 'storage')
      return storageAdapter.getSignedUrl(storageKey, 7 * 24 * 3600)
    })

    // Step 5: Deliver to recipients
    await step.run('deliver-report', async () => {
      for (const email of recipientEmails) {
        await inngest.send({
          name: 'firm/notification.send-email',
          data: {
            tenantId,
            payload: {
              to: email,
              from: 'reports@firmplatform.com',
              subject: `Your ${reportType} report is ready`,
              html: renderReportEmailTemplate({ downloadUrl, reportType, dateRange }),
              text: `Your report is ready: ${downloadUrl}`,
              trackingConsent: false,
              idempotencyKey: `report-delivery-${storageKey}-${email}`,
            }
          }
        })
      }
    })
  }
)
```

***

### `worker-data-retention`

**Purpose:** Executes scheduled data retention policies — GDPR erasure, data purging after retention periods expire, soft-delete cleanup.

**Replicas:** 1
**Schedule:** Runs nightly at 02:00 UTC

```typescript
export const runDataRetention = inngest.createFunction(
  {
    id: 'retention/nightly-cleanup',
    retries: 1,
  },
  { cron: '0 2 * * *' },    // Inngest cron syntax
  async ({ step }) => {

    // Purge soft-deleted leads older than 30 days
    await step.run('purge-deleted-leads', async () => {
      const cutoff = subDays(new Date(), 30)
      const deleted = await db.delete(leads)
        .where(
          and(
            isNotNull(leads.deletedAt),
            lt(leads.deletedAt, cutoff)
          )
        )
      logger.info({ count: deleted.rowCount }, 'Purged soft-deleted leads')
    })

    // Process GDPR erasure requests
    await step.run('process-erasure-requests', async () => {
      const pending = await db.select()
        .from(gdpr_erasure_requests)
        .where(eq(gdpr_erasure_requests.status, 'pending'))

      for (const request of pending) {
        await inngest.send({
          name: 'firm/tenant.gdpr-erasure-requested',
          data: {
            tenantId: request.tenantId,
            userId: request.userId,
            requestId: request.id,
          }
        })
      }
    })

    // Purge expired outbox events (delivered > 7 days ago)
    await step.run('purge-old-outbox-events', async () => {
      const cutoff = subDays(new Date(), 7)
      await db.delete(outbox_events)
        .where(
          and(
            eq(outbox_events.status, 'delivered'),
            lt(outbox_events.delivered_at, cutoff)
          )
        )
    })

    // Purge expired API keys
    await step.run('purge-expired-api-keys', async () => {
      await db.update(api_keys)
        .set({ revokedAt: new Date(), revokeReason: 'expired' })
        .where(
          and(
            isNull(api_keys.revokedAt),
            lt(api_keys.expiresAt, new Date())
          )
        )
    })
  }
)
```

***

### `worker-reputation`

**Purpose:** Polls external review platforms for new reviews, triggers AI response drafts, and dispatches review request campaigns.

**Replicas:** 1
**Schedule:** Every 15 minutes for review polling

```typescript
export const pollForNewReviews = inngest.createFunction(
  {
    id: 'reputation/poll-reviews',
    retries: 2,
    concurrency: { limit: 20 },  // 20 tenants polled concurrently
  },
  { cron: '*/15 * * * *' },
  async ({ step }) => {

    // Get all tenants with reviews adapter configured
    const activeTenants = await step.run('get-active-tenants', async () => {
      return db.select({ tenantId: tenants.id })
        .from(tenants)
        .innerJoin(
          tenant_adapter_configs,
          and(
            eq(tenant_adapter_configs.tenantId, tenants.id),
            eq(tenant_adapter_configs.category, 'reviews'),
            eq(tenant_adapter_configs.enabled, true)
          )
        )
        .where(eq(tenants.status, 'active'))
    })

    // Fan out — one event per tenant
    await step.run('dispatch-poll-events', async () => {
      await inngest.send(
        activeTenants.map(({ tenantId }) => ({
          name: 'firm/reputation.poll-tenant-reviews',
          data: { tenantId },
        }))
      )
    })
  }
)

export const pollTenantReviews = inngest.createFunction(
  {
    id: 'reputation/poll-tenant-reviews',
    retries: 2,
    concurrency: {
      limit: 5,
      key: 'event.data.tenantId',
    },
  },
  { event: 'firm/reputation.poll-tenant-reviews' },
  async ({ event, step }) => {
    const { tenantId } = event.data

    const newReviews = await step.run('fetch-new-reviews', async () => {
      const reviewsAdapter = await getAdapterForTenant<ReviewsAdapter>(tenantId, 'reviews')
      const lastPolledAt = await getLastPolledAt(tenantId)
      const { data: reviews } = await reviewsAdapter.fetchReviews(tenantId, {
        since: lastPolledAt,
        limit: 50,
      })
      return reviews
    })

    if (newReviews.length === 0) return

    await step.run('store-reviews', async () => {
      await db.insert(reviews)
        .values(newReviews.map(r => ({ ...r, tenantId })))
        .onConflictDoUpdate({
          target: [reviews.externalId, reviews.tenantId],
          set: {
            rating: sql`EXCLUDED.rating`,
            text: sql`EXCLUDED.text`,
            replyText: sql`EXCLUDED.reply_text`,
            updatedAt: sql`EXCLUDED.updated_at`,
          }
        })
    })

    // Draft AI responses for new negative reviews (1-3 stars)
    const negativeReviews = newReviews.filter(r => r.rating <= 3)
    if (negativeReviews.length > 0) {
      await step.run('draft-ai-responses', async () => {
        await inngest.send(
          negativeReviews.map(review => ({
            name: 'firm/ai.draft-review-response',
            data: { tenantId, reviewId: review.id },
          }))
        )
      })
    }

    await step.run('update-poll-timestamp', async () => {
      await setLastPolledAt(tenantId, new Date())
    })
  }
)
```

***

## 12.3 GDPR Erasure Saga

The most complex saga in the platform. Must guarantee that a deleted user's data is removed from every system — database, cache, CRM, email provider, and audit log (non-PII retained).

```typescript
// services/workers/worker-data-retention/src/gdpr-erasure.ts

export const processGDPRErasure = inngest.createFunction(
  {
    id: 'gdpr/process-erasure',
    retries: 0,        // Non-retryable — too many side effects
    timeout: '10m',    // Give adapters time to complete external deletions
  },
  { event: 'firm/tenant.gdpr-erasure-requested' },
  async ({ event, step }) => {
    const { tenantId, userId, requestId } = event.data

    // Step 1: Verify request is legitimate
    await step.run('verify-request', async () => {
      const request = await db.select()
        .from(gdpr_erasure_requests)
        .where(eq(gdpr_erasure_requests.id, requestId))
        .limit(1)

      if (!request[0] || request[0].status !== 'pending') {
        throw new NonRetriableError('Invalid or already processed erasure request')
      }
    })

    // Step 2: Collect all user data references (audit before erasure)
    const dataMap = await step.run('audit-data-map', async () => {
      return buildUserDataMap(tenantId, userId)
    })

    // Step 3: Anonymize leads attributed to this user
    await step.run('anonymize-leads', async () => {
      await db.update(leads)
        .set({
          email: `erased-${userId}@erased.invalid`,
          firstName: 'ERASED',
          lastName: 'ERASED',
          phone: null,
          metadata: {},
        })
        .where(
          and(
            eq(leads.tenantId, tenantId),
            eq(leads.userId, userId)
          )
        )
    })

    // Step 4: Delete from CRM (best effort — log failure, continue)
    await step.run('delete-from-crm', async () => {
      try {
        const crmAdapter = await getAdapterForTenant<CRMAdapter>(tenantId, 'crm')
        const externalId = dataMap.crmExternalId
        if (externalId) {
          await crmAdapter.deleteContact(tenantId, externalId)
        }
      } catch (error) {
        logger.error({ error, userId, tenantId }, 'CRM deletion failed during GDPR erasure')
        // Do not re-throw — continue with erasure
      }
    })

    // Step 5: Add to email suppression
    await step.run('suppress-email', async () => {
      const emailAdapter = await getAdapterForTenant<EmailAdapter>(tenantId, 'email')
      await emailAdapter.addToSuppression(tenantId, dataMap.email)
    })

    // Step 6: Delete user sessions
    await step.run('delete-sessions', async () => {
      await deleteUserSessions(userId)
    })

    // Step 7: Invalidate cache
    await step.run('invalidate-cache', async () => {
      const cache = new TenantCache(tenantId, redis)
      await cache.deletePattern(`user:${userId}:*`)
    })

    // Step 8: Delete user record (anonymize — retain ID for referential integrity)
    await step.run('anonymize-user-record', async () => {
      await db.update(users)
        .set({
          email: `erased-${userId}@erased.invalid`,
          name: 'ERASED USER',
          avatarUrl: null,
          totpSecret: null,
          metadata: {},
          erasedAt: new Date(),
        })
        .where(eq(users.id, userId))
    })

    // Step 9: Mark erasure request complete
    await step.run('complete-erasure-request', async () => {
      await db.update(gdpr_erasure_requests)
        .set({
          status: 'completed',
          completedAt: new Date(),
          dataMapJson: dataMap,
        })
        .where(eq(gdpr_erasure_requests.id, requestId))
    })

    // Step 10: Send confirmation to requester
    await step.run('send-confirmation', async () => {
      await inngest.send({
        name: 'firm/notification.send-email',
        data: {
          tenantId,
          payload: {
            to: dataMap.email,
            from: 'privacy@firmplatform.com',
            subject: 'Your data erasure request has been completed',
            html: renderErasureConfirmationEmail(),
            text: 'Your data has been erased from the Firm Platform.',
            trackingConsent: false,
            idempotencyKey: `gdpr-confirmation-${requestId}`,
          }
        }
      })
    })

    logger.info({ tenantId, userId, requestId }, 'GDPR erasure completed')
  }
)
```

***

## 12.4 Real-Time Communication: SSE + Redis Pub/Sub

For operations where the UI needs to show progress — campaign send, report generation, tenant provisioning — the platform uses Server-Sent Events with Redis pub/sub as the message bus.

### SSE Endpoint Pattern

```typescript
// apps/platform/platform-campaigns/app/api/campaigns/[id]/progress/route.ts

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const tenantId = await requireTenantId()
  const campaignId = params.id

  // Validate campaign belongs to tenant
  await campaignsService.get(tenantId, campaignId)

  const encoder = new TextEncoder()
  const channel = `campaign-progress:${tenantId}:${campaignId}`

  const stream = new ReadableStream({
    async start(controller) {
      const subscriber = redis.duplicate()
      await subscriber.subscribe(channel)

      subscriber.on('message', (_, message) => {
        const event = JSON.parse(message)

        // SSE format: "data: {json}\n\n"
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        )

        // Close stream when campaign completes
        if (event.status === 'completed' || event.status === 'failed') {
          subscriber.unsubscribe(channel)
          subscriber.disconnect()
          controller.close()
        }
      })

      // Send initial state immediately
      const campaign = await campaignsService.get(tenantId, campaignId)
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ status: campaign.status, progress: 0 })}\n\n`)
      )
    },
    cancel() {
      // Client disconnected — clean up subscriber
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',  // Disable nginx buffering
    },
  })
}
```

### Publishing Progress from Workers

```typescript
// In worker-campaigns — publish progress to Redis for SSE consumers

async function publishCampaignProgress(
  tenantId: TenantId,
  campaignId: CampaignId,
  progress: CampaignProgress
): Promise<void> {
  const channel = `campaign-progress:${tenantId}:${campaignId}`
  await redis.publish(channel, JSON.stringify(progress))
}

// Called inside executeCampaignStep after each step completes:
await publishCampaignProgress(tenantId, campaignId, {
  status: 'running',
  currentStep: stepIndex + 1,
  totalSteps: campaign.steps.length,
  sentCount: completedSteps,
  progress: Math.round(((stepIndex + 1) / campaign.steps.length) * 100),
})
```

### Cross-Service Pub/Sub for Config Changes

```typescript
// When tenant config changes, all services must invalidate their cache
// Redis pub/sub broadcasts the invalidation signal platform-wide

// Publisher (in firm-config after config update):
await redis.publish(
  'config-invalidation',
  JSON.stringify({ tenantId, updatedAt: new Date().toISOString() })
)

// Subscriber (in every platform app's startup):
const configSub = redis.duplicate()
await configSub.subscribe('config-invalidation')

configSub.on('message', (_, message) => {
  const { tenantId } = JSON.parse(message)
  const cache = new TenantCache(tenantId, redis)
  cache.deletePattern('config:*')
  logger.info({ tenantId }, 'Tenant config cache invalidated via pub/sub')
})
```

***

## 12.5 Worker Deployment Configuration

```yaml
# infra/coolify/worker-deployments.yml
# Each worker is a separate Coolify service — independent scaling and restarts

workers:
  - name: worker-outbox-processor
    replicas: 2
    memory: 512Mi
    cpu: 0.5
    healthcheck: http://localhost:9091/api/health
    env:
      - DATABASE_URL
      - REDIS_URL
      - INNGEST_EVENT_KEY
      - PLATFORM_VERSION

  - name: worker-campaigns
    replicas: 3
    memory: 1Gi
    cpu: 1
    healthcheck: http://localhost:9091/api/health

  - name: worker-crm-sync
    replicas: 2
    memory: 512Mi
    cpu: 0.5

  - name: worker-email-delivery
    replicas: 2
    memory: 512Mi
    cpu: 0.5

  - name: worker-sms-delivery
    replicas: 2
    memory: 256Mi
    cpu: 0.25

  - name: worker-reports
    replicas: 1
    memory: 4Gi      # Puppeteer is memory-intensive
    cpu: 2

  - name: worker-ai-generation
    replicas: 2
    memory: 1Gi
    cpu: 1

  - name: worker-tenant-provisioning
    replicas: 1
    memory: 512Mi
    cpu: 0.5

  - name: worker-data-retention
    replicas: 1
    memory: 256Mi
    cpu: 0.25

  - name: worker-billing-events
    replicas: 1
    memory: 256Mi
    cpu: 0.25

  - name: worker-reputation
    replicas: 1
    memory: 512Mi
    cpu: 0.5

  - name: worker-analytics-rollup
    replicas: 1
    memory: 512Mi
    cpu: 0.5

  - name: worker-social-scheduler
    replicas: 2
    memory: 512Mi
    cpu: 0.5
```

# Marketing Agency Mono Repository Blueprint & Assessment
## Part 13 — White-Label & Multi-Tenant Client Site Architecture

***

> **Purpose of This Part:** This part defines the complete architecture for white-label client sites — how each of the agency's 1,000 clients gets their own branded website, how those sites are provisioned, configured, and deployed, how the design token pipeline flows from agency brand to per-client customization, how vertical profiles inject industry-specific behavior, and how all 1,000 sites share a single codebase while appearing completely distinct. For AI coding agents: a client site is not a copy of a template — it is a single Next.js application that reads its identity from its tenant context at runtime. There is no per-client code. There are no per-client repositories. There is one `apps/clients/_template` that serves every client.

***

## 13.1 The Single-Codebase Multi-Tenant Model

The naive approach to 1,000 client sites is 1,000 repositories. This approach fails at 10 clients — security patches must be applied 1,000 times, design updates require 1,000 PRs, and each new vertical feature requires touching 1,000 codebases.

The platform uses a single Next.js application — `apps/clients/_template` — that serves all 1,000 client sites simultaneously. The application has no hardcoded tenant data. Every piece of tenant-specific content — logo, colors, business name, services, hours, pages, blog posts — is resolved at runtime from the tenant's configuration and the `public_content` database table.

The tenant identity is established at the edge by the Cloudflare Worker (Part 7.4), which resolves the `tenantId` from the incoming hostname and adds it as the `X-Tenant-ID` request header. The Next.js application reads this header at the layout level and all downstream rendering is tenant-scoped.

```
Request lifecycle for a client site:

https://dentistry.acmedental.com/services
          │
          ▼
Cloudflare Edge (infra/cloudflare/workers/tenant-router/)
  → Resolves host 'dentistry.acmedental.com' → tenantId: 'uuid-acme'
  → Adds header X-Tenant-ID: uuid-acme
  → Proxies to Vercel origin
          │
          ▼
Next.js apps/clients/_template (Vercel Edge Runtime)
  → reads X-Tenant-ID header
  → calls getTenantConfig('uuid-acme') → tenant config from Redis
  → establishes AsyncLocalStorage context for downstream rendering
          │
          ▼
app/layout.tsx
  → applies tenant theme tokens (CSS variables from tenant.theme)
  → loads tenant navigation config
  → loads ConsentBanner with tenant consent config
          │
          ▼
app/services/page.tsx
  → queries public_content WHERE tenant_id = 'uuid-acme' AND slug = 'services'
  → renders with tenant theme, tenant logo, tenant copy
          │
          ▼
Response: fully white-labeled page with no platform branding visible
```

***

## 13.2 Tenant Context Resolution

### Layout-Level Context Establishment

```typescript
// apps/clients/_template/app/layout.tsx

import { headers } from 'next/headers'
import { getTenantConfig } from '@firm/config'
import { runWithContext } from '@firm/request-context'
import { ConsentBanner } from '@firm/consent/components'
import { TenantThemeProvider } from '@firm/tokens/components'

export default async function RootLayout({
  children,
}: { children: React.ReactNode }) {

  const headersList = await headers()
  // X-Tenant-ID set by Cloudflare Worker — used for logging/tracing only
  // Application independently derives tenantId from session or public config
  const tenantId = headersList.get('X-Tenant-ID') as TenantId

  if (!tenantId) {
    // No tenant resolved — 404 the entire request
    notFound()
  }

  const tenantConfig = await getTenantConfig(tenantId)

  return (
    <html
      lang={tenantConfig.locale}
      data-theme={tenantConfig.slug}
      suppressHydrationWarning
    >
      <head>
        {/* Inject tenant CSS variables as inline style block */}
        <style
          // nonce injected by middleware for CSP compliance
          nonce={headersList.get('X-Nonce') ?? undefined}
          dangerouslySetInnerHTML={{
            __html: buildTenantCSSVariables(tenantConfig.theme)
          }}
        />
        <TenantMetaTags config={tenantConfig} />
      </head>
      <body>
        <TenantThemeProvider config={tenantConfig}>
          <ConsentBanner
            tenantId={tenantId}
            version={tenantConfig.consent.bannerVersion}
          />
          <SiteHeader config={tenantConfig} />
          <main>{children}</main>
          <SiteFooter config={tenantConfig} />
        </TenantThemeProvider>
      </body>
    </html>
  )
}
```

### Tenant CSS Variable Generation

```typescript
// packages/firm-white-label/src/css-variables.ts

export function buildTenantCSSVariables(theme: TenantTheme): string {
  // Maps tenant theme config to CSS custom properties
  // These override the default firm-tokens values for this tenant
  return `
    :root[data-theme="${theme.slug}"] {
      --color-brand-50: ${theme.colors.brand[50]};
      --color-brand-100: ${theme.colors.brand[100]};
      --color-brand-200: ${theme.colors.brand[200]};
      --color-brand-500: ${theme.colors.brand[500]};
      --color-brand-700: ${theme.colors.brand[700]};
      --color-brand-900: ${theme.colors.brand[900]};
      --color-accent-500: ${theme.colors.accent[500]};
      --color-neutral-50: ${theme.colors.neutral[50]};
      --color-neutral-900: ${theme.colors.neutral[900]};
      --font-family-heading: ${theme.fonts.heading};
      --font-family-body: ${theme.fonts.body};
      --border-radius-base: ${theme.borderRadius}px;
      --spacing-scale: ${theme.spacingScale};
    }
  `.trim()
}
```

***

## 13.3 Vertical Profiles

Vertical profiles inject industry-specific behavior into the template site without requiring code changes. A dental practice site renders differently from a law firm site — different navigation items, different lead form fields, different booking terminology, different trust signals — but both run the same code.

### Vertical Profile Schema

```typescript
// packages/firm-config/src/verticals/schema.ts

export interface VerticalProfile {
  id: string                          // 'dental' | 'legal' | 'fitness' | etc.
  displayName: string                 // 'Dental Practice'

  // Navigation
  primaryNav: NavItem[]               // Top-level navigation items
  footerNav: NavItem[]                // Footer navigation columns

  // Lead capture
  leadFormFields: FormFieldDefinition[]  // Industry-specific form fields
  leadFormHeadline: string            // "Book a Free Consultation"
  leadFormCTA: string                 // "Get My Free Quote"

  // Booking
  bookingTerminology: {
    appointment: string               // 'Appointment' | 'Session' | 'Consultation'
    provider: string                  // 'Dentist' | 'Attorney' | 'Trainer'
    service: string                   // 'Treatment' | 'Service' | 'Class'
  }

  // Trust signals
  trustSignals: TrustSignal[]         // Awards, certifications, association badges
  reviewPlatforms: string[]           // ['google', 'yelp', 'healthgrades']

  // SEO
  defaultMetaTemplates: {
    homeTitle: string                 // '{businessName} | {city} {vertical}'
    homeDescription: string
    serviceTitle: string
    blogTitle: string
  }

  // Page templates
  defaultPages: PageTemplate[]        // Which pages to scaffold on tenant creation
  serviceCategorySchema: object       // JSON-LD schema.org type for services

  // Adapter requirements
  requiredAdapters: string[]          // Adapters provisioned automatically for this vertical
  optionalAdapters: string[]

  // AI brand voice context
  brandVoiceContext: string           // Industry context for AI content generation
  contentTopics: string[]             // Suggested blog topics for this vertical
}
```

### Dental Vertical Profile

```typescript
// packages/firm-config/src/verticals/dental.ts

export const dentalVerticalProfile: VerticalProfile = {
  id: 'dental',
  displayName: 'Dental Practice',

  primaryNav: [
    { label: 'Services', href: '/services' },
    { label: 'About', href: '/about' },
    { label: 'Patient Info', href: '/patient-info' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
  ],

  leadFormFields: [
    { name: 'firstName', type: 'text', label: 'First Name', required: true },
    { name: 'lastName', type: 'text', label: 'Last Name', required: true },
    { name: 'email', type: 'email', label: 'Email Address', required: true },
    { name: 'phone', type: 'tel', label: 'Phone Number', required: true },
    { name: 'serviceType', type: 'select', label: 'Service Needed', required: false,
      options: ['Routine Cleaning', 'Teeth Whitening', 'Invisalign', 'Emergency', 'Other'] },
    { name: 'isNewPatient', type: 'radio', label: 'New or Existing Patient?',
      options: ['New Patient', 'Existing Patient'] },
    { name: 'insuranceProvider', type: 'text', label: 'Insurance Provider', required: false },
    { name: 'preferredTime', type: 'select', label: 'Preferred Appointment Time',
      options: ['Morning (8am-12pm)', 'Afternoon (12pm-5pm)', 'Evening (5pm-7pm)'] },
    { name: 'message', type: 'textarea', label: 'Additional Notes', required: false },
  ],

  leadFormHeadline: 'Request Your Appointment',
  leadFormCTA: 'Request Appointment',

  bookingTerminology: {
    appointment: 'Appointment',
    provider: 'Dentist',
    service: 'Treatment',
  },

  trustSignals: [
    { type: 'association', label: 'American Dental Association', logoSlug: 'ada' },
    { type: 'association', label: 'State Dental Association', logoSlug: 'state-dental' },
    { type: 'certification', label: 'HIPAA Compliant', logoSlug: 'hipaa' },
    { type: 'review-aggregate', platform: 'google' },
    { type: 'review-aggregate', platform: 'healthgrades' },
  ],

  reviewPlatforms: ['google', 'healthgrades', 'zocdoc'],

  defaultMetaTemplates: {
    homeTitle: '{businessName} | {city} Dentist | {state}',
    homeDescription: '{businessName} is a trusted dental practice in {city}, {state}. We offer {topServices}. Call us at {phone} to schedule your appointment.',
    serviceTitle: '{serviceName} in {city} | {businessName}',
    blogTitle: '{postTitle} | {businessName} Dental Blog',
  },

  defaultPages: [
    { slug: 'services', template: 'services-grid' },
    { slug: 'about', template: 'about-team' },
    { slug: 'patient-info', template: 'patient-resources' },
    { slug: 'new-patients', template: 'new-patient-welcome' },
    { slug: 'contact', template: 'contact-with-map' },
  ],

  serviceCategorySchema: {
    '@type': 'Dentist',
    'medicalSpecialty': 'Dentistry',
  },

  requiredAdapters: ['reviews-google', 'email-resend'],
  optionalAdapters: ['crm-gohighlevel', 'calendar-google', 'sms-twilio'],

  brandVoiceContext: `
    You are writing content for a dental practice. The tone should be:
    - Professional but warm and approachable
    - Focused on patient comfort and reducing dental anxiety
    - Educational about oral health topics
    - Emphasizing the latest technology and gentle techniques
    - Building trust through expertise and compassion
    Never use fear-based messaging. Always emphasize comfort and care.
  `,

  contentTopics: [
    'Benefits of regular teeth cleaning',
    'How to choose the right toothbrush',
    'Invisalign vs traditional braces',
    'What to expect at your first dental appointment',
    'How to manage dental anxiety',
    'Foods that damage tooth enamel',
    'The connection between oral health and overall health',
  ],
}
```

### Vertical Profile Registry

```typescript
// packages/firm-config/src/verticals/index.ts

export const VerticalProfiles = {
  dental: dentalVerticalProfile,
  legal: legalVerticalProfile,
  fitness: fitnessVerticalProfile,
  homeServices: homeServicesVerticalProfile,
  realEstate: realEstateVerticalProfile,
  restaurant: restaurantVerticalProfile,
  medSpa: medSpaVerticalProfile,
  veterinary: veterinaryVerticalProfile,
  chiropractic: chiropracticVerticalProfile,
  financial: financialVerticalProfile,
} as const

export type VerticalId = keyof typeof VerticalProfiles

export function getVerticalProfile(id: VerticalId): VerticalProfile {
  const profile = VerticalProfiles[id]
  if (!profile) throw new Error(`Unknown vertical: ${id}`)
  return profile
}
```

***

## 13.4 Client Site Page Architecture

### Route Structure

```
apps/clients/_template/app/
├── layout.tsx                    ← Root layout — tenant context establishment
├── page.tsx                      ← Homepage (/)
├── not-found.tsx                 ← 404 with tenant branding
├── error.tsx                     ← Error boundary with tenant branding
├── sitemap.ts                    ← Dynamic sitemap generated from public_content
├── robots.ts                     ← Dynamic robots.txt from tenant config
│
├── [slug]/                       ← Dynamic page route
│   └── page.tsx                  ← Renders any page from public_content by slug
│
├── services/                     ← Services section
│   ├── page.tsx                  ← Services listing
│   └── [serviceSlug]/
│       └── page.tsx              ← Individual service page
│
├── blog/                         ← Blog section
│   ├── page.tsx                  ← Blog listing with pagination
│   ├── [postSlug]/
│   │   └── page.tsx              ← Individual blog post (AI disclosure if AI-generated)
│   └── category/
│       └── [category]/
│           └── page.tsx          ← Category listing
│
├── book/                         ← Booking flow
│   ├── page.tsx                  ← Service + time selection
│   ├── confirm/
│   │   └── page.tsx              ← Booking confirmation
│   └── success/
│       └── page.tsx              ← Success page with confirmation details
│
├── contact/                      ← Contact + lead capture
│   └── page.tsx                  ← Contact form (from vertical profile form fields)
│
└── api/
    ├── trpc/
    │   └── [trpc]/route.ts       ← tRPC handler (form submit, booking, etc.)
    ├── health/
    │   └── route.ts              ← Health endpoint (Gate 15)
    └── webhooks/
        └── [provider]/
            └── route.ts          ← Inbound webhook handlers
```

### Dynamic Page Rendering

```typescript
// apps/clients/_template/app/[slug]/page.tsx

import { getTenantId } from '@firm/request-context'
import { getPublicContent } from '@firm/cms'
import { AIContentWrapper } from '@firm/ai-content'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface Props {
  params: { slug: string }
}

// generateStaticParams: pre-renders all published pages at build time
// ISR (revalidate: 3600) keeps pages fresh without full rebuilds
export async function generateStaticParams() {
  // Returns slugs for all published pages across all tenants
  // Each tenant's Vercel project only builds its own tenant's pages
  const tenantId = getTenantId()
  const pages = await getPublicContent(tenantId, { type: 'page', status: 'published' })
  return pages.map(page => ({ slug: page.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tenantId = getTenantId()
  const page = await getPublicContent(tenantId, { slug: params.slug })
  if (!page) return {}

  return {
    title: page.seoTitle ?? page.title,
    description: page.seoDescription,
    openGraph: {
      title: page.seoTitle ?? page.title,
      description: page.seoDescription,
      images: page.ogImage ? [{ url: page.ogImage }] : [],
    },
    // noindex only for draft pages or tenant-configured noindex
    robots: page.noIndex ? 'noindex,nofollow' : 'index,follow',
  }
}

export default async function DynamicPage({ params }: Props) {
  const tenantId = getTenantId()
  const page = await getPublicContent(tenantId, {
    slug: params.slug,
    status: 'published',
  })

  if (!page) notFound()

  return (
    <article className="prose mx-auto max-w-4xl px-4 py-12">
      <h1>{page.title}</h1>

      {/* AI disclosure wrapper — shown only for AI-generated content */}
      {page.c2paManifest ? (
        <AIContentWrapper
          content={page.content}
          manifest={page.c2paManifest}
        />
      ) : (
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }} />
      )}
    </article>
  )
}

export const revalidate = 3600  // ISR: revalidate every hour
```

### Homepage with Vertical Profile Integration

```typescript
// apps/clients/_template/app/page.tsx

export default async function HomePage() {
  const tenantId = getTenantId()
  const tenantConfig = await getTenantConfig(tenantId)
  const vertical = getVerticalProfile(tenantConfig.verticalId)

  // All data fetches in parallel
  const [heroContent, services, reviews, teamMembers] = await Promise.all([
    getPublicContent(tenantId, { slug: 'hero', type: 'block' }),
    getPublicContent(tenantId, { type: 'service', status: 'published', limit: 6 }),
    getRecentReviews(tenantId, { limit: 3, minRating: 4 }),
    getPublicContent(tenantId, { type: 'team-member', status: 'published' }),
  ])

  return (
    <>
      {/* Hero section — from CMS content block */}
      <HeroSection
        headline={heroContent?.headline ?? tenantConfig.businessName}
        subheadline={heroContent?.subheadline}
        ctaText={vertical.leadFormCTA}
        backgroundImage={heroContent?.backgroundImage}
      />

      {/* Services grid — vertical-appropriate terminology */}
      <ServicesSection
        services={services}
        title={`Our ${vertical.bookingTerminology.service}s`}
      />

      {/* Lead capture form — vertical-specific fields */}
      <LeadCaptureSection
        headline={vertical.leadFormHeadline}
        fields={vertical.leadFormFields}
        tenantId={tenantId}
      />

      {/* Trust signals — vertical-appropriate badges */}
      <TrustSignalsSection signals={vertical.trustSignals} />

      {/* Reviews — only shown if tenant has Google reviews connected */}
      {reviews.length > 0 && (
        <ReviewsSection reviews={reviews} />
      )}

      {/* Team section — optional, only if team members exist */}
      {teamMembers.length > 0 && (
        <TeamSection
          members={teamMembers}
          title={`Meet Our ${vertical.bookingTerminology.provider}s`}
        />
      )}
    </>
  )
}
```

***

## 13.5 Booking Flow Architecture

The booking flow is a multi-step React flow that lives entirely within the client site. It communicates with `platform-booking` (the self-hosted Next.js app) via tRPC.

```
Step 1: Service Selection
        ↓
Step 2: Provider Selection (if multiple providers)
        ↓
Step 3: Date + Time Selection (availability from Google Calendar via adapter)
        ↓
Step 4: Contact Information
        ↓
Step 5: Confirmation + Payment (if deposit required)
        ↓
Step 6: Success — confirmation email + calendar invite sent
```

```typescript
// apps/clients/_template/app/book/page.tsx

'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc-client'
import { ServiceSelector } from '@/components/booking/ServiceSelector'
import { TimeSlotPicker } from '@/components/booking/TimeSlotPicker'
import { BookingContactForm } from '@/components/booking/BookingContactForm'
import { BookingConfirmation } from '@/components/booking/BookingConfirmation'

type BookingStep = 'service' | 'time' | 'contact' | 'confirm' | 'success'

export default function BookingPage() {
  const [step, setStep] = useState<BookingStep>('service')
  const [selection, setSelection] = useState<Partial<BookingSelection>>({})

  const createBooking = trpc.bookings.create.useMutation({
    onSuccess: () => setStep('success'),
  })

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <BookingProgressIndicator current={step} />

      {step === 'service' && (
        <ServiceSelector
          onSelect={(service) => {
            setSelection(prev => ({ ...prev, service }))
            setStep('time')
          }}
        />
      )}

      {step === 'time' && (
        <TimeSlotPicker
          serviceId={selection.service!.id}
          onSelect={(slot) => {
            setSelection(prev => ({ ...prev, slot }))
            setStep('contact')
          }}
        />
      )}

      {step === 'contact' && (
        <BookingContactForm
          onSubmit={(contact) => {
            setSelection(prev => ({ ...prev, contact }))
            setStep('confirm')
          }}
        />
      )}

      {step === 'confirm' && (
        <BookingConfirmation
          selection={selection as BookingSelection}
          onConfirm={() => {
            createBooking.mutate({
              serviceId: selection.service!.id,
              startTime: selection.slot!.startTime,
              endTime: selection.slot!.endTime,
              firstName: selection.contact!.firstName,
              lastName: selection.contact!.lastName,
              email: selection.contact!.email,
              phone: selection.contact!.phone,
              notes: selection.contact!.notes,
            })
          }}
          isLoading={createBooking.isPending}
        />
      )}

      {step === 'success' && (
        <BookingSuccess booking={createBooking.data} />
      )}
    </div>
  )
}
```

***

## 13.6 SEO Architecture

Every client site generates correct structured data, dynamic sitemaps, and per-page meta tags without manual configuration.

### JSON-LD Structured Data

```typescript
// apps/clients/_template/components/StructuredData.tsx

export function LocalBusinessSchema({
  config,
  vertical,
}: {
  config: TenantConfig
  vertical: VerticalProfile
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': vertical.serviceCategorySchema['@type'],
    name: config.businessName,
    description: config.businessDescription,
    url: `https://${config.primaryDomain}`,
    telephone: config.phone,
    email: config.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: config.address.street,
      addressLocality: config.address.city,
      addressRegion: config.address.state,
      postalCode: config.address.zip,
      addressCountry: config.address.country,
    },
    geo: config.coordinates ? {
      '@type': 'GeoCoordinates',
      latitude: config.coordinates.lat,
      longitude: config.coordinates.lng,
    } : undefined,
    openingHoursSpecification: config.hours.map(h => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days,
      opens: h.open,
      closes: h.close,
    })),
    // Aggregate rating — populated from reviews data
    aggregateRating: config.reviewStats ? {
      '@type': 'AggregateRating',
      ratingValue: config.reviewStats.averageRating,
      reviewCount: config.reviewStats.totalReviews,
    } : undefined,
    // Service offerings from CMS
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `${config.businessName} Services`,
    },
    ...vertical.serviceCategorySchema,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
```

### Dynamic Sitemap

```typescript
// apps/clients/_template/app/sitemap.ts

import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tenantId = getTenantId()
  const config = await getTenantConfig(tenantId)
  const baseUrl = `https://${config.primaryDomain}`

  const pages = await getPublicContent(tenantId, {
    type: ['page', 'service', 'blog-post'],
    status: 'published',
  })

  return [
    // Static routes
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/services`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/book`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },

    // Dynamic content from CMS
    ...pages.map(page => ({
      url: `${baseUrl}/${page.slug}`,
      lastModified: page.updatedAt,
      changeFrequency: page.type === 'blog-post' ? 'yearly' as const : 'monthly' as const,
      priority: page.type === 'service' ? 0.85 : page.type === 'blog-post' ? 0.6 : 0.7,
    }))
  ]
}
```

***

## 13.7 Performance Architecture

Every client site must achieve Lighthouse ≥ 95 on all four metrics. The following architecture decisions enforce this:

### Image Optimization

```typescript
// All tenant images served through Next.js Image with R2 + Cloudflare CDN

// next.config.ts (firm-config-next generates this)
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '*.r2.cloudflarestorage.com',
    },
    {
      protocol: 'https',
      hostname: 'pub-*.r2.dev',  // Cloudflare R2 public bucket URLs
    },
  ],
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
},
```

### Font Loading Strategy

```typescript
// apps/clients/_template/app/layout.tsx
// Fonts loaded per-tenant — resolved from tenant theme config
// Using next/font for zero-layout-shift font loading

import { Inter, Playfair_Display } from 'next/font/google'

// Fonts declared at module level — Next.js optimizes loading
const bodyFont = Inter({
  subsets: ['latin'],
  variable: '--font-family-body',
  display: 'swap',
})

const headingFont = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-family-heading',
  display: 'swap',
  weight: ['400', '700'],
})
```

### Core Web Vitals Targets

| Metric | Target | Enforcement Mechanism |
|---|---|---|
| LCP | < 2.5s | Above-fold images use `priority` prop; hero section pre-rendered |
| CLS | < 0.1 | `next/font` eliminates FOUT; all images have explicit dimensions |
| FID/INP | < 200ms | Heavy components lazy-loaded; no blocking scripts |
| FCP | < 1.8s | Static generation (ISR); Cloudflare edge caching |
| TTFB | < 600ms | Vercel Edge Runtime for layout; Redis cache for tenant config |
| Performance | ≥ 95 | Tailwind purge removes unused CSS; JS bundle split by route |

### Caching Strategy

```typescript
// apps/clients/_template/lib/cache-config.ts

export const cacheConfigs = {
  // Tenant config: 5 minutes in Redis, 1 hour at CDN
  tenantConfig: {
    redis: 300,
    cdnHeaders: 'public, s-maxage=3600, stale-while-revalidate=86400',
  },
  // CMS content: 1 hour in Redis, revalidated on publish
  cmsContent: {
    redis: 3600,
    cdnHeaders: 'public, s-maxage=3600, stale-while-revalidate=86400',
    nextRevalidate: 3600,  // ISR revalidation interval
  },
  // Reviews: 15 minutes (updated by worker-reputation polling)
  reviews: {
    redis: 900,
    cdnHeaders: 'public, s-maxage=900, stale-while-revalidate=3600',
    nextRevalidate: 900,
  },
  // Booking availability: no cache — always fresh
  availability: {
    redis: 0,
    cdnHeaders: 'no-store',
  },
} as const
```

***

## 13.8 `firm-white-label` Package

The `firm-white-label` package centralizes all white-label logic — the pieces that transform a generic platform application into a branded client experience.

```typescript
// packages/firm-white-label/src/index.ts

// CSS variable generation from tenant theme
export { buildTenantCSSVariables } from './css-variables'

// Dynamic favicon generation
export { generateTenantFavicon } from './favicon'

// Email template white-labeling
export { applyTenantBranding } from './email-branding'

// PDF report white-labeling (logo injection, color application)
export { applyReportBranding } from './report-branding'

// Domain management (Vercel + Cloudflare)
export { provisionCustomDomain, removeCustomDomain } from './domain-management'

// Tenant theme validation
export { validateTenantTheme } from './theme-validation'

// Brand voice context injection (for AI content generation)
export { buildBrandVoiceSystemPrompt } from './brand-voice'
```

### Brand Voice System Prompt Construction

```typescript
// packages/firm-white-label/src/brand-voice.ts

export function buildBrandVoiceSystemPrompt(
  tenantConfig: TenantConfig,
  vertical: VerticalProfile,
  task: AITask
): string {
  const businessContext = `
    You are creating content for ${tenantConfig.businessName}, a ${vertical.displayName}
    located in ${tenantConfig.address.city}, ${tenantConfig.address.state}.
  `.trim()

  const voiceContext = tenantConfig.brandVoice
    ? `
      Brand Voice Instructions:
      ${tenantConfig.brandVoice}
    `.trim()
    : vertical.brandVoiceContext

  const taskContext = getTaskContext(task)

  const complianceContext = `
    Compliance Requirements:
    - All claims must be accurate and not misleading
    - Do not make guarantees about outcomes
    - Include appropriate disclaimers for regulated industries
    - Content must comply with advertising standards in ${tenantConfig.address.country}
  `.trim()

  return [businessContext, voiceContext, taskContext, complianceContext]
    .filter(Boolean)
    .join('\n\n')
}
```

***

## 13.9 Client Site Provisioning Checklist

When `worker-tenant-provisioning` runs for a new client, this is the complete sequence executed by `firm-white-label`'s domain management functions:

```typescript
// Complete provisioning sequence for a new client site

async function provisionClientSite(
  tenantId: TenantId,
  config: TenantProvisioningConfig
): Promise<void> {

  // 1. Create Vercel project from template
  const project = await vercelApi.createProject({
    name: `firm-client-${config.slug}`,
    framework: 'nextjs',
    gitRepository: {
      type: 'github',
      repo: 'firm-platform/clients-template',
    },
    environmentVariables: buildTenantEnvVars(tenantId, config),
  })

  // 2. Add platform subdomain: {slug}.firmplatform.com
  await provisionCustomDomain(tenantId, `${config.slug}.firmplatform.com`)

  // 3. Add custom domain if provided
  if (config.customDomain) {
    await provisionCustomDomain(tenantId, config.customDomain)
  }

  // 4. Trigger first deployment
  await vercelApi.createDeployment({
    projectId: project.id,
    target: 'production',
  })

  // 5. Seed default CMS content from vertical profile
  await seedDefaultContent(tenantId, config.verticalId)

  // 6. Create default service pages from vertical profile
  const profile = getVerticalProfile(config.verticalId)
  for (const pageTemplate of profile.defaultPages) {
    await createDefaultPage(tenantId, pageTemplate)
  }

  // 7. Create sitemap and robots.txt
  await triggerSitemapRebuild(tenantId)

  // 8. Submit sitemap to Google Search Console (if adapter configured)
  if (config.googleSearchConsoleConnected) {
    await submitSitemapToGSC(tenantId, config.customDomain ?? `${config.slug}.firmplatform.com`)
  }
}
```

# Marketing Agency Mono Repository Blueprint & Assessment
## Part 14 — Testing Strategy & Quality Architecture

***

> **Purpose of This Part:** This part defines the complete testing strategy — what gets tested, at which layer, with which tools, and to what coverage threshold. For AI coding agents: a function without tests is incomplete code. The test is not a bonus — it is the executable specification of the function's contract. When you write a function, you write its tests in the same PR. The test file lives adjacent to the implementation. The coverage gate in CI enforces the threshold. There are no exceptions.

***

## 14.1 Testing Philosophy

The platform uses a four-layer testing model, each layer testing a different scope of correctness:

**Unit tests** verify that a single function produces correct output for a given input. They run in milliseconds, require no external services, and are the primary correctness signal during development. A unit test for `requirePermission()` checks every role/permission combination without touching a database.

**Integration tests** verify that a package's public API works correctly against real infrastructure — a real PostgreSQL schema (via PGLite), a real Redis client (via in-memory implementation), and real Zod schemas. An integration test for `firm-db` verifies that RLS isolation actually blocks cross-tenant reads — not that the RLS policy SQL is syntactically valid, but that it actually works.

**Component tests** verify that UI components render correctly, respond to user interactions, and meet accessibility standards. They run in a jsdom environment via Vitest + React Testing Library and are the test layer for `firm-ui`.

**End-to-end tests** verify that complete user flows work across the full stack — browser → Next.js → tRPC → database → response. They run against a staging environment and are the final quality gate before production deployment.

### The Testing Pyramid

```
          ┌─────────────────────────────┐
          │    E2E Tests (Playwright)    │  ~50 tests
          │    Staging environment       │  ~15 min runtime
          └─────────────────────────────┘
        ┌───────────────────────────────────┐
        │   Integration Tests (Vitest)       │  ~200 tests
        │   PGLite + in-memory Redis         │  ~3 min runtime
        └───────────────────────────────────┘
      ┌─────────────────────────────────────────┐
      │    Component Tests (Vitest + RTL)         │  ~300 tests
      │    jsdom + firm-ui                        │  ~2 min runtime
      └─────────────────────────────────────────┘
    ┌───────────────────────────────────────────────┐
    │        Unit Tests (Vitest)                     │  ~800 tests
    │        No external dependencies                │  ~45 sec runtime
    └───────────────────────────────────────────────┘
```

***

## 14.2 Test Infrastructure Setup

### Vitest Configuration

```typescript
// packages/firm-config-vitest/src/index.ts
// Shared Vitest config — every package extends this

import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export function createVitestConfig(options: {
  packageDir: string
  includeIntegration?: boolean
}) {
  return defineConfig({
    test: {
      globals: true,
      environment: 'node',

      // Coverage configuration
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov', 'json-summary'],
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 75,
          statements: 80,
        },
        exclude: [
          'src/index.ts',          // Re-export barrel files
          '**/*.test.ts',
          '**/*.spec.ts',
          '**/types.ts',           // Type-only files
          '**/constants.ts',
        ],
      },

      // Test file patterns
      include: options.includeIntegration
        ? ['src/**/*.test.ts', 'tests/**/*.test.ts', 'tests/**/*.integration.ts']
        : ['src/**/*.test.ts', 'tests/**/*.test.ts'],

      // Exclude integration tests from unit test runs
      exclude: options.includeIntegration
        ? []
        : ['**/*.integration.ts'],

      // Path aliases matching tsconfig
      alias: {
        '@firm': resolve(options.packageDir, '../../packages'),
      },

      // Setup files run before each test file
      setupFiles: [resolve(options.packageDir, '../../packages/firm-test-utils/src/setup.ts')],

      // Isolate each test file — no shared state between files
      isolate: true,

      // Pool configuration
      pool: 'threads',
      poolOptions: {
        threads: {
          singleThread: false,
          maxThreads: 4,
        },
      },
    },
  })
}
```

### Test Utilities (`firm-test-utils`)

```typescript
// packages/firm-test-utils/src/index.ts
// Shared test infrastructure — used by every package's tests

// ── Database ──────────────────────────────────────────────────────────────

import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { schema } from '@firm/db'

let testDb: ReturnType<typeof drizzle> | null = null

export async function createTestDatabase() {
  if (testDb) return testDb

  const pglite = new PGlite()
  testDb = drizzle(pglite, { schema })

  // Apply all migrations including RLS policies
  await migrate(testDb, { migrationsFolder: './drizzle/migrations' })

  return testDb
}

export async function cleanTestDatabase() {
  if (!testDb) return
  // Truncate all tables in reverse dependency order
  await testDb.execute(sql`
    TRUNCATE TABLE
      outbox_events, campaign_enrollments, campaigns,
      bookings, leads, forms, users, tenants
    CASCADE
  `)
}

// ── Tenant Factories ─────────────────────────────────────────────────────

export async function createTestTenant(
  overrides: Partial<NewTenant> = {}
): Promise<Tenant> {
  const db = await createTestDatabase()
  const [tenant] = await db.insert(tenants).values({
    id: generateId<'TenantId'>(),
    slug: `test-${nanoid(8)}`,
    plan: 'professional',
    status: 'active',
    ...overrides,
  }).returning()
  return tenant
}

export async function createTestUser(
  tenantId: TenantId,
  overrides: Partial<NewUser> = {}
): Promise<User> {
  const db = await createTestDatabase()
  const [user] = await db.insert(users).values({
    id: generateId<'UserId'>(),
    tenantId,
    email: `test-${nanoid(8)}@example.com`,
    role: 'agent',
    ...overrides,
  }).returning()
  return user
}

export async function createTestLead(
  tenantId: TenantId,
  overrides: Partial<NewLead> = {}
): Promise<Lead> {
  const db = await createTestDatabase()
  const [lead] = await db.insert(leads).values({
    id: generateId<'LeadId'>(),
    tenantId,
    email: `lead-${nanoid(8)}@example.com`,
    firstName: 'Test',
    lastName: 'Lead',
    status: 'new',
    ...overrides,
  }).returning()
  return lead
}

// ── Cache ─────────────────────────────────────────────────────────────────

export function createTestCache(tenantId: TenantId): TenantCache {
  // In-memory cache for tests — no Redis required
  return new TenantCache(tenantId, createInMemoryRedis())
}

// ── Auth Context ──────────────────────────────────────────────────────────

export function createTestContext(
  tenantId: TenantId,
  userOverrides: Partial<AuthenticatedUser> = {}
): TRPCContext {
  return {
    tenantId,
    user: {
      id: generateId<'UserId'>(),
      tenantId,
      role: 'manager',
      email: 'test@example.com',
      ...userOverrides,
    },
    db: createTestDatabase(),
    cache: createTestCache(tenantId),
  }
}

// ── Setup/Teardown ────────────────────────────────────────────────────────

export const setup = async () => {
  await createTestDatabase()
}

export const teardown = async () => {
  await cleanTestDatabase()
}
```

***

## 14.3 Unit Test Patterns

### Testing Zod Schemas

```typescript
// packages/firm-validators/src/leads.test.ts

import { describe, it, expect } from 'vitest'
import { createLeadSchema, updateLeadSchema, leadIdSchema } from './leads'

describe('createLeadSchema', () => {
  it('accepts valid lead input', () => {
    const valid = {
      email: 'jane@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      phone: '+12125551234',
      sourceFormId: 'form_abc123',
    }
    expect(() => createLeadSchema.parse(valid)).not.toThrow()
  })

  it('rejects invalid email format', () => {
    const result = createLeadSchema.safeParse({ email: 'not-an-email', firstName: 'Jane' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toEqual(['email'])
  })

  it('rejects phone numbers not in E.164 format', () => {
    const result = createLeadSchema.safeParse({
      email: 'jane@example.com',
      firstName: 'Jane',
      phone: '555-1234',  // Not E.164
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toEqual(['phone'])
  })

  it('strips unknown fields (strict mode)', () => {
    const result = createLeadSchema.parse({
      email: 'jane@example.com',
      firstName: 'Jane',
      unknownField: 'should be stripped',
    })
    expect(result).not.toHaveProperty('unknownField')
  })
})

describe('leadIdSchema', () => {
  it('accepts valid lead ID prefix', () => {
    expect(() => leadIdSchema.parse('lead_abc123def456')).not.toThrow()
  })

  it('rejects ID without lead_ prefix', () => {
    expect(() => leadIdSchema.parse('abc123')).toThrow()
  })
})
```

### Testing RBAC

```typescript
// packages/firm-auth/src/rbac.test.ts

import { describe, it, expect } from 'vitest'
import { requirePermission } from './rbac'
import type { AuthenticatedUser } from '@firm/types'

const makeUser = (role: Role): AuthenticatedUser => ({
  id: 'usr_test' as UserId,
  tenantId: 'tnt_test' as TenantId,
  email: 'test@example.com',
  role,
})

describe('requirePermission', () => {
  describe('tenantadmin role', () => {
    it('has leads:create permission', () => {
      expect(() => requirePermission(makeUser('tenantadmin'), 'leads:create')).not.toThrow()
    })

    it('has billing:manage permission', () => {
      expect(() => requirePermission(makeUser('tenantadmin'), 'billing:manage')).not.toThrow()
    })
  })

  describe('agent role', () => {
    it('has leads:create permission', () => {
      expect(() => requirePermission(makeUser('agent'), 'leads:create')).not.toThrow()
    })

    it('does NOT have leads:delete permission', () => {
      expect(() => requirePermission(makeUser('agent'), 'leads:delete'))
        .toThrow('lacks permission: leads:delete')
    })

    it('does NOT have billing:manage permission', () => {
      expect(() => requirePermission(makeUser('agent'), 'billing:manage'))
        .toThrow('lacks permission: billing:manage')
    })
  })

  describe('readonly role', () => {
    it('has leads:read permission', () => {
      expect(() => requirePermission(makeUser('readonly'), 'leads:read')).not.toThrow()
    })

    it('does NOT have leads:create permission', () => {
      expect(() => requirePermission(makeUser('readonly'), 'leads:create'))
        .toThrow('lacks permission')
    })
  })

  describe('wildcard permissions', () => {
    it('leads:* grants all leads sub-permissions', () => {
      // tenantadmin has leads:* which should satisfy leads:create, leads:delete, leads:update
      const admin = makeUser('tenantadmin')
      expect(() => requirePermission(admin, 'leads:create')).not.toThrow()
      expect(() => requirePermission(admin, 'leads:delete')).not.toThrow()
      expect(() => requirePermission(admin, 'leads:update')).not.toThrow()
      expect(() => requirePermission(admin, 'leads:read')).not.toThrow()
    })
  })
})
```

### Testing Crypto Functions

```typescript
// packages/firm-crypto/src/index.test.ts

import { describe, it, expect } from 'vitest'
import { generateApiKeyPair, timingSafeEqual, encrypt, decrypt } from './index'

describe('generateApiKeyPair', () => {
  it('returns key with firm_live_ prefix', () => {
    const { key } = generateApiKeyPair()
    expect(key).toMatch(/^firm_live_/)
  })

  it('prefix is first 16 chars of key', () => {
    const { key, prefix } = generateApiKeyPair()
    expect(prefix).toBe(key.slice(0, 16))
  })

  it('generates unique keys', () => {
    const key1 = generateApiKeyPair().key
    const key2 = generateApiKeyPair().key
    expect(key1).not.toBe(key2)
  })

  it('hash is deterministic for same key and secret', () => {
    const { key } = generateApiKeyPair()
    const hash1 = hmacSha256(key, 'test-secret')
    const hash2 = hmacSha256(key, 'test-secret')
    expect(hash1).toBe(hash2)
  })
})

describe('encrypt/decrypt', () => {
  const secret = randomBytes(32).toString('hex')

  it('roundtrips plaintext', () => {
    const plaintext = 'super-secret-totp-seed'
    const ciphertext = encrypt(plaintext, secret)
    expect(decrypt(ciphertext, secret)).toBe(plaintext)
  })

  it('produces different ciphertext for same plaintext (random IV)', () => {
    const plaintext = 'same-plaintext'
    const ct1 = encrypt(plaintext, secret)
    const ct2 = encrypt(plaintext, secret)
    expect(ct1).not.toBe(ct2)
  })

  it('fails to decrypt with wrong key', () => {
    const ciphertext = encrypt('secret', secret)
    const wrongKey = randomBytes(32).toString('hex')
    expect(() => decrypt(ciphertext, wrongKey)).toThrow()
  })
})

describe('timingSafeEqual', () => {
  it('returns true for equal strings', () => {
    expect(timingSafeEqual('abc123', 'abc123')).toBe(true)
  })

  it('returns false for different strings of same length', () => {
    expect(timingSafeEqual('abc123', 'abc124')).toBe(false)
  })

  it('returns false for different length strings', () => {
    expect(timingSafeEqual('short', 'longer-string')).toBe(false)
  })
})
```

***

## 14.4 Integration Test Patterns

### RLS Isolation Tests (Critical)

```typescript
// packages/firm-db/tests/rls-isolation.integration.ts

import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { createTestDatabase, createTestTenant, createTestLead, cleanTestDatabase } from '@firm/test-utils'
import { withTenantContext } from '../src'
import { leads, users } from '../src/schema'
import { eq } from 'drizzle-orm'

describe('RLS tenant isolation', () => {
  let tenant1: Tenant
  let tenant2: Tenant

  beforeAll(async () => {
    await createTestDatabase()
    tenant1 = await createTestTenant()
    tenant2 = await createTestTenant()
  })

  afterEach(async () => {
    await cleanTestDatabase()
  })

  it('cannot read another tenant leads via direct ID lookup', async () => {
    const lead = await createTestLead(tenant1.id)

    const result = await withTenantContext(tenant2.id, async (db) => {
      return db.select().from(leads).where(eq(leads.id, lead.id))
    })

    expect(result).toHaveLength(0)
  })

  it('cannot read another tenant leads via full table scan', async () => {
    await createTestLead(tenant1.id)
    await createTestLead(tenant1.id)

    const result = await withTenantContext(tenant2.id, async (db) => {
      return db.select().from(leads)
    })

    // tenant2 has no leads — should return empty even though leads exist for tenant1
    expect(result).toHaveLength(0)
  })

  it('cannot update another tenant leads', async () => {
    const lead = await createTestLead(tenant1.id)

    const updateResult = await withTenantContext(tenant2.id, async (db) => {
      return db.update(leads)
        .set({ status: 'won' })
        .where(eq(leads.id, lead.id))
        .returning()
    })

    expect(updateResult).toHaveLength(0)

    // Verify original record unchanged
    const original = await withTenantContext(tenant1.id, async (db) => {
      return db.select().from(leads).where(eq(leads.id, lead.id))
    })
    expect(original[0].status).toBe('new')
  })

  it('cannot delete another tenant leads', async () => {
    const lead = await createTestLead(tenant1.id)

    const deleteResult = await withTenantContext(tenant2.id, async (db) => {
      return db.delete(leads)
        .where(eq(leads.id, lead.id))
        .returning()
    })

    expect(deleteResult).toHaveLength(0)

    // Verify record still exists for tenant1
    const existing = await withTenantContext(tenant1.id, async (db) => {
      return db.select().from(leads).where(eq(leads.id, lead.id))
    })
    expect(existing).toHaveLength(1)
  })

  it('tenant can only read its own leads in combined queries', async () => {
    // Create leads for both tenants
    const t1Lead1 = await createTestLead(tenant1.id)
    const t1Lead2 = await createTestLead(tenant1.id)
    await createTestLead(tenant2.id)

    // tenant1 should only see its own 2 leads
    const t1Results = await withTenantContext(tenant1.id, async (db) => {
      return db.select().from(leads)
    })

    expect(t1Results).toHaveLength(2)
    expect(t1Results.map(l => l.id)).toContain(t1Lead1.id)
    expect(t1Results.map(l => l.id)).toContain(t1Lead2.id)
  })
})
```

### Outbox Idempotency Tests

```typescript
// packages/firm-db/tests/outbox-idempotency.integration.ts

describe('Outbox idempotency', () => {
  it('returns "duplicate" for second insert with same idempotency_key', async () => {
    const tenant = await createTestTenant()
    const idempotencyKey = `test.event.${nanoid()}`

    const first = await enforceIdempotency(idempotencyKey, tenant.id)
    expect(first).toBe('new')

    const second = await enforceIdempotency(idempotencyKey, tenant.id)
    expect(second).toBe('duplicate')
  })

  it('allows same idempotency_key for different tenants', async () => {
    const tenant1 = await createTestTenant()
    const tenant2 = await createTestTenant()
    const sharedKey = 'shared-idempotency-key'

    const first = await enforceIdempotency(sharedKey, tenant1.id)
    const second = await enforceIdempotency(sharedKey, tenant2.id)

    expect(first).toBe('new')
    expect(second).toBe('new')  // Different tenant — not a duplicate
  })
})
```

### API Key Authentication Tests

```typescript
// packages/firm-auth/tests/api-key-auth.integration.ts

describe('API key authentication', () => {
  it('authenticates valid key', async () => {
    const tenant = await createTestTenant()
    const user = await createTestUser(tenant.id, { role: 'manager' })
    const { key } = await createApiKey(tenant.id, user, {
      name: 'test-key',
      permissions: ['leads:read', 'leads:create'],
    })

    const result = await authenticateApiKey(key)

    expect(result.tenantId).toBe(tenant.id)
    expect(result.permissions).toContain('leads:read')
  })

  it('rejects invalid key', async () => {
    await expect(
      authenticateApiKey('firm_live_invalidsignature')
    ).rejects.toThrow(AuthenticationError)
  })

  it('rejects revoked key', async () => {
    const tenant = await createTestTenant()
    const user = await createTestUser(tenant.id)
    const { key, prefix } = await createApiKey(tenant.id, user, {
      name: 'revokable',
      permissions: ['leads:read'],
    })

    // Revoke the key
    await revokeApiKey(tenant.id, prefix)

    await expect(authenticateApiKey(key)).rejects.toThrow(AuthenticationError)
  })

  it('rejects expired key', async () => {
    const tenant = await createTestTenant()
    const user = await createTestUser(tenant.id)
    const { key } = await createApiKey(tenant.id, user, {
      name: 'expiring',
      permissions: ['leads:read'],
      expiresAt: subDays(new Date(), 1),  // Already expired
    })

    await expect(authenticateApiKey(key)).rejects.toThrow(AuthenticationError)
  })

  it('rejects key missing required permission', async () => {
    const tenant = await createTestTenant()
    const user = await createTestUser(tenant.id)
    const { key } = await createApiKey(tenant.id, user, {
      name: 'limited',
      permissions: ['leads:read'],  // No leads:create
    })

    await expect(
      authenticateApiKey(key, 'leads:create')  // Requires leads:create
    ).rejects.toThrow(AuthorizationError)
  })
})
```

***

## 14.5 Component Test Patterns

### Testing `firm-ui` Components

```typescript
// packages/firm-ui/src/components/Button/Button.test.tsx

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { Button } from './Button'

expect.extend(toHaveNoViolations)

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Submit</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('shows loading state', () => {
    render(<Button loading>Submit</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByLabelText('Loading')).toBeInTheDocument()
  })

  it('is disabled when disabled prop is set', () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>Submit</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Button>Accessible Button</Button>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('renders as anchor when href provided', () => {
    render(<Button href="/dashboard">Go to Dashboard</Button>)
    expect(screen.getByRole('link', { name: 'Go to Dashboard' })).toBeInTheDocument()
  })
})
```

### Testing AI Content Wrapper (Compliance Critical)

```typescript
// packages/firm-ai-content/src/AIContentWrapper.test.tsx

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AIContentWrapper } from './AIContentWrapper'

const mockManifest: C2PAManifest = {
  '@context': 'https://c2pa.org/v2',
  claim: {
    generator: 'firm-platform',
    generatorVersion: '1.0.0',
    model: 'claude-sonnet-4-5',
    task: 'blog-post',
    tenantId: 'tnt_test' as TenantId,
    contentHash: 'abc123',
    generatedAt: '2026-05-12T00:00:00Z',
    disclosureRequired: true,
    disclosureLabel: 'AI-generated',
  },
  signature: 'test-signature',
}

describe('AIContentWrapper — NY Synthetic Performer + EU AI Act compliance', () => {

  it('renders AI disclosure label when manifest has disclosureRequired: true', () => {
    render(
      <AIContentWrapper content="<p>AI content</p>" manifest={mockManifest} />
    )
    expect(
      screen.getByLabelText('AI-generated content disclosure')
    ).toBeInTheDocument()
  })

  it('disclosure label is present in DOM — cannot be suppressed by caller', () => {
    // The component's contract: disclosure is structural, not conditional
    const { container } = render(
      <AIContentWrapper content="<p>Test</p>" manifest={mockManifest} />
    )
    // Disclosure element exists regardless of any parent configuration
    expect(
      container.querySelector('[aria-label="AI-generated content disclosure"]')
    ).not.toBeNull()
  })

  it('renders data-c2pa-manifest attribute on disclosure wrapper', () => {
    const { container } = render(
      <AIContentWrapper content="<p>Test</p>" manifest={mockManifest} />
    )
    const disclosure = container.querySelector('[aria-label="AI-generated content disclosure"]')
    expect(disclosure?.getAttribute('data-c2pa-manifest')).toBeTruthy()

    const parsedManifest = JSON.parse(
      disclosure!.getAttribute('data-c2pa-manifest')!
    )
    expect(parsedManifest['@context']).toBe('https://c2pa.org/v2')
  })

  it('does NOT render disclosure label when manifest is null', () => {
    render(
      <AIContentWrapper content="<p>Human content</p>" manifest={null} />
    )
    expect(
      screen.queryByLabelText('AI-generated content disclosure')
    ).not.toBeInTheDocument()
  })

  it('sanitizes HTML content before rendering', () => {
    render(
      <AIContentWrapper
        content='<p>Safe content</p><script>alert("xss")</script>'
        manifest={null}
      />
    )
    // Script tag must be stripped by sanitizeHtml
    expect(document.querySelector('script')).toBeNull()
    expect(screen.getByText('Safe content')).toBeInTheDocument()
  })
})
```

### Testing Consent Gate

```typescript
// packages/firm-consent/src/ConsentGate.test.tsx

describe('ConsentGate', () => {
  it('does not render children without consent', () => {
    render(
      <ConsentGate tenantId="tnt_test" consentType="analytics" hasConsent={false}>
        <div data-testid="analytics-script">Analytics</div>
      </ConsentGate>
    )
    expect(screen.queryByTestId('analytics-script')).not.toBeInTheDocument()
  })

  it('renders children after consent granted', () => {
    render(
      <ConsentGate tenantId="tnt_test" consentType="analytics" hasConsent={true}>
        <div data-testid="analytics-script">Analytics</div>
      </ConsentGate>
    )
    expect(screen.getByTestId('analytics-script')).toBeInTheDocument()
  })

  it('dispatches Consent Mode v3 signals on accept', async () => {
    const gtag = vi.fn()
    window.gtag = gtag

    render(<ConsentBanner tenantId="tnt_test" version={1} />)
    fireEvent.click(screen.getByRole('button', { name: /accept/i }))

    expect(gtag).toHaveBeenCalledWith('consent', 'update', {
      ad_storage: 'granted',
      analytics_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
    })
  })

  it('sets all signals to denied when GPC header detected', () => {
    // Simulate GPC signal
    Object.defineProperty(navigator, 'globalPrivacyControl', {
      value: true,
      writable: true,
    })

    const gtag = vi.fn()
    window.gtag = gtag

    render(<ConsentGate tenantId="tnt_test" gpcDetected={true} consentType="analytics" hasConsent={false}>
      <div>Analytics</div>
    </ConsentGate>)

    expect(gtag).toHaveBeenCalledWith('consent', 'update', expect.objectContaining({
      ad_storage: 'denied',
      analytics_storage: 'denied',
    }))
  })
})
```

***

## 14.6 End-to-End Test Suite

### Playwright Configuration

```typescript
// playwright.config.ts

import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'https://staging.firmplatform.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'] },
    },
  ],
})
```

### Core E2E Test Flows

```typescript
// tests/e2e/lead-capture-flow.spec.ts

import { test, expect } from '@playwright/test'

test.describe('Lead capture flow', () => {

  test('submits lead form and creates lead in CRM', async ({ page }) => {
    // Use a test tenant subdomain
    await page.goto('https://test-tenant.firmplatform.com/contact')

    // Accept consent banner
    await page.getByRole('button', { name: /accept/i }).click()

    // Fill form with valid data
    await page.getByLabel('First Name').fill('Jane')
    await page.getByLabel('Last Name').fill('Smith')
    await page.getByLabel('Email Address').fill(`e2e-${Date.now()}@example.com`)
    await page.getByLabel('Phone Number').fill('+12125551234')

    // Submit
    await page.getByRole('button', { name: /send message|request appointment/i }).click()

    // Verify success state
    await expect(page.getByText(/thank you|we.ll be in touch/i)).toBeVisible()

    // Verify lead was created (via platform API)
    const response = await page.request.get(
      'https://staging.firmplatform.com/api/v1/leads?email=e2e-*',
      { headers: { Authorization: `Bearer ${process.env.E2E_API_KEY}` } }
    )
    const data = await response.json()
    expect(data.data).toHaveLength(1)
  })
})
```

```typescript
// tests/e2e/booking-flow.spec.ts

test.describe('Booking flow', () => {

  test('completes full booking flow', async ({ page }) => {
    await page.goto('https://test-tenant.firmplatform.com/book')

    // Step 1: Select service
    await page.getByText('Routine Cleaning').click()
    await page.getByRole('button', { name: /next/i }).click()

    // Step 2: Select time slot
    await page.getByRole('button', { name: /next available/i }).first().click()
    await page.getByRole('button', { name: /next/i }).click()

    // Step 3: Enter contact info
    await page.getByLabel('First Name').fill('John')
    await page.getByLabel('Last Name').fill('Doe')
    await page.getByLabel('Email').fill(`booking-${Date.now()}@example.com`)
    await page.getByLabel('Phone').fill('+12125551234')
    await page.getByRole('button', { name: /next/i }).click()

    // Step 4: Confirm
    await expect(page.getByText('John Doe')).toBeVisible()
    await page.getByRole('button', { name: /confirm booking/i }).click()

    // Step 5: Success
    await expect(page.getByText(/booking confirmed/i)).toBeVisible()
    await expect(page.getByText(/confirmation email/i)).toBeVisible()
  })
})
```

```typescript
// tests/e2e/auth-flow.spec.ts

test.describe('Platform authentication', () => {

  test('logs in with email and password', async ({ page }) => {
    await page.goto('https://staging.firmplatform.com/login')

    await page.getByLabel('Email').fill(process.env.E2E_TEST_USER_EMAIL!)
    await page.getByLabel('Password').fill(process.env.E2E_TEST_USER_PASSWORD!)
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByText(/welcome back/i)).toBeVisible()
  })

  test('redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('https://staging.firmplatform.com/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('MFA challenge shown for users with TOTP enabled', async ({ page }) => {
    await page.goto('https://staging.firmplatform.com/login')

    await page.getByLabel('Email').fill(process.env.E2E_MFA_USER_EMAIL!)
    await page.getByLabel('Password').fill(process.env.E2E_MFA_USER_PASSWORD!)
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page.getByLabel('Authenticator Code')).toBeVisible()
  })
})
```

***

## 14.7 Storybook & Visual Regression

### Story Requirements

Every component in `firm-ui` must have a Storybook story file. Stories are acceptance criteria — a component without a story for each significant variant is incomplete.

```typescript
// packages/firm-ui/src/components/LeadStatusBadge/LeadStatusBadge.stories.tsx

import type { Meta, StoryObj } from '@storybook/react'
import { LeadStatusBadge } from './LeadStatusBadge'
import { LeadStatus } from '@firm/types'

const meta: Meta<typeof LeadStatusBadge> = {
  title: 'Data Display/LeadStatusBadge',
  component: LeadStatusBadge,
  parameters: {
    layout: 'centered',
    a11y: { disable: false },  // Accessibility checks enabled
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof LeadStatusBadge>

// One story per significant visual state
export const New: Story = {
  args: { status: LeadStatus.New },
}

export const Contacted: Story = {
  args: { status: LeadStatus.Contacted },
}

export const Qualified: Story = {
  args: { status: LeadStatus.Qualified },
}

export const Won: Story = {
  args: { status: LeadStatus.Won },
}

export const Lost: Story = {
  args: { status: LeadStatus.Lost },
}

// Grid story showing all states simultaneously
export const AllStates: Story = {
  render: () => (
    <div className="flex gap-2 flex-wrap">
      {Object.values(LeadStatus).map(status => (
        <LeadStatusBadge key={status} status={status} />
      ))}
    </div>
  ),
}
```

### Chromatic Visual Regression

```yaml
# .github/workflows/ci.yml — Storybook / Chromatic gate

- name: Gate 11 — Chromatic Visual Regression
  run: |
    pnpm chromatic \
      --project-token=${{ secrets.CHROMATIC_PROJECT_TOKEN }} \
      --build-script-name=storybook:build \
      --exit-zero-on-changes  # Don't fail CI — require human review in Chromatic UI
  env:
    CHROMATIC_PROJECT_TOKEN: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

***

## 14.8 Performance Testing

### Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
# Runs against Vercel Preview deployment — after PR deploy succeeds

- name: Lighthouse CI
  uses: treosh/lighthouse-ci-action@1efef74b7ff0ee0c53f5b04d4ad5dc4c6408a96e  # v12
  with:
    urls: |
      ${{ env.PREVIEW_URL }}
      ${{ env.PREVIEW_URL }}/services
      ${{ env.PREVIEW_URL }}/blog
      ${{ env.PREVIEW_URL }}/contact
    budgetPath: .lighthouse-budget.json
    uploadArtifacts: true

# .lighthouse-budget.json
{
  "budgets": [{
    "path": "/*",
    "timings": [
      { "metric": "first-contentful-paint", "budget": 1800 },
      { "metric": "largest-contentful-paint", "budget": 2500 },
      { "metric": "total-blocking-time", "budget": 200 },
      { "metric": "cumulative-layout-shift", "budget": 0.1 }
    ],
    "resourceSizes": [
      { "resourceType": "script", "budget": 200 },
      { "resourceType": "stylesheet", "budget": 50 },
      { "resourceType": "total", "budget": 500 }
    ],
    "scores": [
      { "category": "performance", "minScore": 95 },
      { "category": "accessibility", "minScore": 95 },
      { "category": "best-practices", "minScore": 95 },
      { "category": "seo", "minScore": 95 }
    ]
  }]
}
```

***

## 14.9 Test Coverage Requirements by Package

| Package | Lines | Functions | Branches | Rationale |
|---|---|---|---|---|
| `firm-crypto` | 95% | 95% | 90% | Security-critical — near-complete coverage required |
| `firm-auth` | 90% | 90% | 85% | Security-critical |
| `firm-db` (RLS tests) | 90% | 90% | 85% | Data isolation is a correctness property |
| `firm-validators` | 90% | 90% | 85% | Schema contracts must be fully tested |
| `firm-rate-limiter` | 85% | 85% | 80% | DoS protection |
| `firm-consent` | 85% | 85% | 80% | Compliance-critical |
| `firm-security` | 85% | 85% | 80% | Security-critical |
| All other packages | 80% | 80% | 75% | Platform baseline |
| `firm-ui` components | 80% | 80% | 75% | Component rendering + accessibility |
| Adapters | 75% | 75% | 70% | External API calls are mocked — lower branch coverage expected |

# Marketing Agency Mono Repository Blueprint & Assessment
## Part 15 — Complete Package Inventory & Final Reference

***

> **Purpose of This Part:** This is the authoritative reference document for the complete platform. It catalogs every package, every application, every worker, every adapter, and every script in the monorepo with its status, dependencies, layer, and owner. It consolidates all cross-cutting rules from Parts 1–14 into a single lookup reference. For AI coding agents and engineers: when you are unsure about where a piece of code belongs, which layer a package lives in, what a package's public API surface is, or what the acceptance criteria for "done" means — this part answers that question.

***

## 15.1 Complete Package Registry

### Layer 0 — Configuration Packages

| Package | Path | Status | Primary Export | Depends On |
|---|---|---|---|---|
| `firm-config-typescript` | `packages/firm-config-typescript` | ✅ Complete | `tsconfig.base.json` | None |
| `firm-config-eslint` | `packages/firm-config-eslint` | ✅ Complete | `eslint.config.ts` | None |
| `firm-config-tailwind` | `packages/firm-config-tailwind` | ⚠️ Defect (S0-5) | `tailwind.config.ts` | None |
| `firm-config-next` | `packages/firm-config-next` | ⚠️ Defect (S0-14) | `createNextConfig()` | None |
| `firm-config-vitest` | `packages/firm-config-vitest` | ✅ Complete | `createVitestConfig()` | None |

***

### Layer 1 — Foundational Packages

| Package | Path | Status | Primary Export | Depends On |
|---|---|---|---|---|
| `firm-env` | `packages/firm-env` | ✅ Complete | `platformEnv`, `authEnv`, `workerEnv` | L0 |
| `firm-errors` | `packages/firm-errors` | ✅ Complete | All error classes | L0 |
| `firm-logger` | `packages/firm-logger` | ✅ Complete | `createLogger()` | `firm-env` |
| `firm-crypto` | `packages/firm-crypto` | ⚠️ Defect (S0-4) | `generateApiKeyPair()`, `encrypt()`, `decrypt()`, `timingSafeEqual()` | `firm-env` |
| `firm-utils` | `packages/firm-utils` | ✅ Complete | `generateId()`, `generateSecureToken()`, `paginate()` | None |
| `firm-request-context` | `packages/firm-request-context` | ⚠️ Defect (S0-1) | `runWithContext()`, `getCurrentContext()`, `requireContext()` | `firm-env` |
| `firm-test-utils` | `packages/firm-test-utils` | ✅ Complete | `createTestTenant()`, `createTestDatabase()`, `createTestCache()` | All L1 |

***

### Layer 2 — Contract Packages

| Package | Path | Status | Primary Export | Depends On |
|---|---|---|---|---|
| `firm-types` | `packages/firm-types` | ⚠️ Interface freeze pending (S1-B1) | All domain interfaces, all adapter interfaces | L0, L1 |
| `firm-validators` | `packages/firm-validators` | ⚠️ Schema consolidation (S0-8, S1-B2) | All Zod schemas, `createLeadSchema`, etc. | `firm-types` |
| `firm-api-contracts` | `packages/firm-api-contracts` | ⚠️ Event registry pending (S1-B3) | `AppRouter`, `EventRegistry`, `openApiDocument` | `firm-types`, `firm-validators` |

***

### Layer 3 — Infrastructure Packages

| Package | Path | Status | Primary Export | Depends On |
|---|---|---|---|---|
| `firm-db` | `packages/firm-db` | ⚠️ Defects (S0-7, S0-11) | `withTenantContext()`, all schema tables, `migrate()` | L0–L2 |
| `firm-cache` | `packages/firm-cache` | ⚠️ Defect (S0-12) | `TenantCache`, `createInMemoryRedis()` | L0–L2 |
| `firm-auth` | `packages/firm-auth` | ⚠️ Defects (S0-2, S0-3) | `authenticateApiKey()`, `requirePermission()`, `startImpersonation()` | L0–L2 |
| `firm-rate-limiter` | `packages/firm-rate-limiter` | ⚠️ Defect (S0-9) | `createRateLimiter()`, `RateLimitMiddleware` | `firm-cache`, `firm-errors` |
| `firm-background-jobs` | `packages/firm-background-jobs` | ⚠️ Defect (S0-16) | `inngest`, `createTypedEvent()` | L0–L2 |
| `firm-webhooks` | `packages/firm-webhooks` | ⚠️ Defect (S0-13) | `verifyWebhookSignature()`, `preventReplay()`, `enforceIdempotency()` | `firm-crypto`, `firm-db` |

***

### Layer 4 — Observability Packages

| Package | Path | Status | Primary Export | Depends On |
|---|---|---|---|---|
| `firm-observability` | `packages/firm-observability` | ⚠️ Defect (S0-11) | `initObservability()`, `createSpan()`, all metrics | L0–L3 |
| `firm-logger` | `packages/firm-logger` | ✅ Complete | `createLogger()` | `firm-env` |
| `firm-health` | `packages/firm-health` | ⚠️ Defect (S0-17) | `createHealthRouter()`, standard checkers | L0–L3 |

***

### Layer 5 — Shared Application Packages

| Package | Path | Status | Primary Export | Depends On |
|---|---|---|---|---|
| `firm-tokens` | `packages/firm-tokens` | ⚠️ Defect (S0-15) | CSS variables, Tailwind config, TS token map | `firm-config-tailwind` |
| `firm-ui` | `packages/firm-ui` | 🔄 In progress | All React components | `firm-tokens`, L0–L4 |
| `firm-config` | `packages/firm-config` | 🔄 In progress | `getTenantConfig()`, `getAdapterForTenant()`, vertical profiles | L0–L4 |
| `firm-security` | `packages/firm-security` | ⚠️ Defect (S0-6) | `generateC2PAManifest()`, `SecurityAuditLogger`, `buildCSPHeader()` | L0–L3 |
| `firm-consent` | `packages/firm-consent` | ⚠️ Defects (S0-10, S1-A2) | `hasConsent()`, `detectGPC()`, `dispatchConsentSignals()`, `ConsentBanner` | L0–L4 |
| `firm-white-label` | `packages/firm-white-label` | 🔄 In progress | `buildTenantCSSVariables()`, `provisionCustomDomain()`, `buildBrandVoiceSystemPrompt()` | L0–L4 |

***

### Layer 6 — Feature Packages

| Package | Path | Status | Priority | Depends On |
|---|---|---|---|---|
| `firm-tenancy` | `packages/firm-tenancy` | 🔄 Sprint 2 | P1 | L0–L5 |
| `firm-leads` | `packages/firm-leads` | 🔄 Sprint 2 | P1 | L0–L5 |
| `firm-forms` | `packages/firm-forms` | 📋 Sprint 3 | P1 | `firm-leads`, `firm-consent` |
| `firm-notifications` | `packages/firm-notifications` | 📋 Sprint 3 | P1 | L7 email + SMS adapters |
| `firm-campaigns` | `packages/firm-campaigns` | 📋 Sprint 3 | P1 | `firm-leads`, `firm-notifications` |
| `firm-bookings` | `packages/firm-bookings` | 📋 Sprint 3 | P1 | `firm-notifications`, L7 calendar |
| `firm-reporting` | `packages/firm-reporting` | 📋 Sprint 3 | P1 | `firm-leads`, `firm-campaigns` |
| `firm-reputation` | `packages/firm-reputation` | 📋 Sprint 3 | P2 | `firm-notifications`, L7 reviews |
| `firm-portal` | `packages/firm-portal` | 📋 Sprint 3 | P1 | `firm-leads`, `firm-reporting` |
| `firm-payments` | `packages/firm-payments` | 📋 Sprint 4 | P1 | L7 billing adapter |
| `firm-ai` | `packages/firm-ai` | 📋 Sprint 6 | P2 | `firm-security`, L7 AI adapters |
| `firm-ai-content` | `packages/firm-ai-content` | 📋 Sprint 6 | P2 | `firm-ai` |
| `firm-ai-seo` | `packages/firm-ai-seo` | 📋 Sprint 8 | P3 | `firm-ai` |
| `firm-ai-brand-voice` | `packages/firm-ai-brand-voice` | 📋 Sprint 6 | P2 | `firm-ai` |
| `firm-cms` | `packages/firm-cms` | 📋 Sprint 6 | P2 | `firm-storage` |
| `firm-storage` | `packages/firm-storage` | 📋 Sprint 2 | P1 | L7 storage adapter |
| `firm-landing-pages` | `packages/firm-landing-pages` | 📋 Sprint 6 | P2 | `firm-cms` |
| `firm-social` | `packages/firm-social` | 📋 Sprint 7 | P3 | L7 social adapters |
| `firm-ads` | `packages/firm-ads` | 📋 Sprint 7 | P3 | L7 ads adapters |
| `firm-funnels` | `packages/firm-funnels` | 📋 Sprint 8 | P3 | `firm-forms`, `firm-cms` |
| `firm-projects` | `packages/firm-projects` | 📋 Sprint 9 | P3 | `firm-leads` |
| `firm-documents` | `packages/firm-documents` | 📋 Sprint 9 | P3 | `firm-storage` |
| `firm-proposals` | `packages/firm-proposals` | 📋 Sprint 9 | P3 | `firm-documents` |
| `firm-invoicing` | `packages/firm-invoicing` | 📋 Sprint 9 | P3 | `firm-payments` |
| `firm-email` | `packages/firm-email` | 📋 Sprint 1 | P1 | L7 email adapter |

***

### Layer 7 — Adapter Packages

#### CRM Adapters

| Package | Path | Status | Priority | Interface |
|---|---|---|---|---|
| `adapters-crm-gohighlevel` | `packages/adapters/crm/gohighlevel` | 📋 Sprint 2 | P2 | `CRMAdapter` |
| `adapters-crm-hubspot` | `packages/adapters/crm/hubspot` | 📋 Sprint 10 | P3 | `CRMAdapter` |
| `adapters-crm-salesforce` | `packages/adapters/crm/salesforce` | 📋 Sprint 10 | P3 | `CRMAdapter` |
| `adapters-crm-activecampaign` | `packages/adapters/crm/activecampaign` | 📋 Sprint 10 | P4 | `CRMAdapter` |
| `adapters-crm-pipedrive` | `packages/adapters/crm/pipedrive` | 📋 Sprint 10 | P4 | `CRMAdapter` |
| `adapters-crm-keap` | `packages/adapters/crm/keap` | 📋 Backlog | P4 | `CRMAdapter` |

#### Email Adapters

| Package | Path | Status | Priority | Interface |
|---|---|---|---|---|
| `adapters-email-resend` | `packages/adapters/email/resend` | 📋 Sprint 2 | P1 | `EmailAdapter` |
| `adapters-email-sendgrid` | `packages/adapters/email/sendgrid` | 📋 Sprint 10 | P3 | `EmailAdapter` |
| `adapters-email-postmark` | `packages/adapters/email/postmark` | 📋 Sprint 10 | P3 | `EmailAdapter` |
| `adapters-email-ses` | `packages/adapters/email/ses` | 📋 Sprint 10 | P4 | `EmailAdapter` |

#### SMS Adapters

| Package | Path | Status | Priority | Interface |
|---|---|---|---|---|
| `adapters-sms-twilio` | `packages/adapters/sms/twilio` | 📋 Sprint 2 | P2 | `SMSAdapter` |
| `adapters-sms-vonage` | `packages/adapters/sms/vonage` | 📋 Backlog | P4 | `SMSAdapter` |

#### Analytics Adapters

| Package | Path | Status | Priority | Interface |
|---|---|---|---|---|
| `adapters-analytics-ga4` | `packages/adapters/analytics/ga4` | 📋 Sprint 2 | P2 | `AnalyticsAdapter` |
| `adapters-analytics-posthog` | `packages/adapters/analytics/posthog` | 📋 Sprint 4 | P3 | `AnalyticsAdapter` |
| `adapters-analytics-plausible` | `packages/adapters/analytics/plausible` | 📋 Backlog | P4 | `AnalyticsAdapter` |

#### Advertising Adapters

| Package | Path | Status | Priority | Interface |
|---|---|---|---|---|
| `adapters-ads-google` | `packages/adapters/ads/google` | 📋 Sprint 2 | P2 | `AdsAdapter` |
| `adapters-ads-meta` | `packages/adapters/ads/meta` | 📋 Sprint 7 | P3 | `AdsAdapter` |
| `adapters-ads-microsoft` | `packages/adapters/ads/microsoft` | 📋 Backlog | P4 | `AdsAdapter` |

#### Storage Adapters

| Package | Path | Status | Priority | Interface |
|---|---|---|---|---|
| `adapters-storage-r2` | `packages/adapters/storage/r2` | 📋 Sprint 2 | P1 | `StorageAdapter` |
| `adapters-storage-s3` | `packages/adapters/storage/s3` | 📋 Backlog | P4 | `StorageAdapter` |

#### Billing Adapters

| Package | Path | Status | Priority | Interface |
|---|---|---|---|---|
| `adapters-billing-stripe` | `packages/adapters/billing/stripe` | 📋 Sprint 2 | P1 | `BillingAdapter` |

#### Calendar Adapters

| Package | Path | Status | Priority | Interface |
|---|---|---|---|---|
| `adapters-calendar-google` | `packages/adapters/calendar/google` | 📋 Sprint 2 | P2 | `CalendarAdapter` |
| `adapters-calendar-outlook` | `packages/adapters/calendar/outlook` | 📋 Sprint 4 | P3 | `CalendarAdapter` |
| `adapters-calendar-apple` | `packages/adapters/calendar/apple` | 📋 Backlog | P4 | `CalendarAdapter` |

#### Reviews Adapters

| Package | Path | Status | Priority | Interface |
|---|---|---|---|---|
| `adapters-reviews-google` | `packages/adapters/reviews/google` | 📋 Sprint 2 | P2 | `ReviewsAdapter` |
| `adapters-reviews-yelp` | `packages/adapters/reviews/yelp` | 📋 Sprint 4 | P3 | `ReviewsAdapter` |
| `adapters-reviews-healthgrades` | `packages/adapters/reviews/healthgrades` | 📋 Sprint 11 | P4 | `ReviewsAdapter` |
| `adapters-reviews-zocdoc` | `packages/adapters/reviews/zocdoc` | 📋 Sprint 11 | P4 | `ReviewsAdapter` |

#### SEO Adapters

| Package | Path | Status | Priority | Interface |
|---|---|---|---|---|
| `adapters-seo-google-sc` | `packages/adapters/seo/google-sc` | 📋 Sprint 8 | P3 | `SEOAdapter` |
| `adapters-seo-ahrefs` | `packages/adapters/seo/ahrefs` | 📋 Sprint 8 | P3 | `SEOAdapter` |
| `adapters-seo-semrush` | `packages/adapters/seo/semrush` | 📋 Backlog | P4 | `SEOAdapter` |

#### Social Adapters

| Package | Path | Status | Priority | Interface |
|---|---|---|---|---|
| `adapters-social-meta` | `packages/adapters/social/meta` | 📋 Sprint 7 | P3 | `SocialAdapter` |
| `adapters-social-linkedin` | `packages/adapters/social/linkedin` | 📋 Sprint 7 | P3 | `SocialAdapter` |
| `adapters-social-twitter` | `packages/adapters/social/twitter` | 📋 Sprint 7 | P4 | `SocialAdapter` |
| `adapters-social-instagram` | `packages/adapters/social/instagram` | 📋 Sprint 7 | P3 | `SocialAdapter` |

#### AI Adapters

| Package | Path | Status | Priority | Interface |
|---|---|---|---|---|
| `adapters-ai-anthropic` | `packages/adapters/ai/anthropic` | 📋 Sprint 6 | P3 | `AIAdapter` |
| `adapters-ai-openai` | `packages/adapters/ai/openai` | 📋 Sprint 6 | P3 | `AIAdapter` |
| `adapters-ai-google` | `packages/adapters/ai/google` | 📋 Sprint 6 | P4 | `AIAdapter` |

#### Vertical Adapters

| Package | Path | Status | Priority | Interface |
|---|---|---|---|---|
| `adapters-vertical-clio` | `packages/adapters/vertical/clio` | 📋 Sprint 11 | P3 | `VerticalAdapter` |
| `adapters-vertical-mindbody` | `packages/adapters/vertical/mindbody` | 📋 Sprint 11 | P3 | `VerticalAdapter` |
| `adapters-vertical-jobber` | `packages/adapters/vertical/jobber` | 📋 Sprint 11 | P3 | `VerticalAdapter` |
| `adapters-vertical-servicetitan` | `packages/adapters/vertical/servicetitan` | 📋 Sprint 11 | P4 | `VerticalAdapter` |
| `adapters-vertical-propertyware` | `packages/adapters/vertical/propertyware` | 📋 Sprint 11 | P4 | `VerticalAdapter` |

***

## 15.2 Complete Application Registry

### Platform Applications (`apps/platform/`)

| App | Path | Deployment | Status | Primary Feature Packages |
|---|---|---|---|---|
| `platform-portal` | `apps/platform/platform-portal` | Vercel | 📋 Sprint 4 | `firm-portal`, `firm-leads`, `firm-reporting` |
| `platform-analytics` | `apps/platform/platform-analytics` | Vercel | 📋 Sprint 4 | `firm-reporting`, `firm-campaigns` |
| `platform-crm` | `apps/platform/platform-crm` | Vercel | 📋 Sprint 4 | `firm-leads`, `firm-forms`, `firm-campaigns` |
| `platform-campaigns` | `apps/platform/platform-campaigns` | Vercel | 📋 Sprint 4 | `firm-campaigns`, `firm-notifications` |
| `platform-booking` | `apps/platform/platform-booking` | Hetzner/Coolify | 📋 Sprint 4 | `firm-bookings` |
| `platform-reputation` | `apps/platform/platform-reputation` | Vercel | 📋 Sprint 4 | `firm-reputation` |
| `platform-content` | `apps/platform/platform-content` | Vercel | 📋 Sprint 6 | `firm-cms`, `firm-ai-content` |
| `platform-social` | `apps/platform/platform-social` | Vercel | 📋 Sprint 7 | `firm-social` |
| `platform-ads` | `apps/platform/platform-ads` | Vercel | 📋 Sprint 7 | `firm-ads` |
| `platform-seo` | `apps/platform/platform-seo` | Vercel | 📋 Sprint 8 | `firm-ai-seo` |
| `platform-proposals` | `apps/platform/platform-proposals` | Vercel | 📋 Sprint 9 | `firm-proposals`, `firm-documents` |
| `platform-invoicing` | `apps/platform/platform-invoicing` | Vercel | 📋 Sprint 9 | `firm-invoicing`, `firm-payments` |
| `platform-projects` | `apps/platform/platform-projects` | Vercel | 📋 Sprint 9 | `firm-projects` |
| `platform-admin` | `apps/platform/platform-admin` | Vercel | 📋 Sprint 2 | `firm-tenancy`, all packages |

### Client Applications (`apps/clients/`)

| App | Path | Deployment | Status | Notes |
|---|---|---|---|---|
| `_template` | `apps/clients/_template` | Vercel (per-tenant) | 🔄 Sprint 3 | Single codebase serving all client sites |

### Public Sites (`apps/`)

| App | Path | Deployment | Status | Notes |
|---|---|---|---|---|
| `firm-site` | `apps/firm-site` | Vercel | 📋 Sprint 4 | Agency marketing site (firmplatform.com) |
| `firm-docs` | `apps/firm-docs` | Vercel | 📋 Sprint 6 | Developer documentation (docs.firmplatform.com) |
| `firm-sdk` | `packages/firm-sdk` | npm | 📋 Sprint 3 | TypeScript SDK for external developers |

***

## 15.3 Complete Worker Registry

| Worker | Path | Deployment | Replicas | Trigger | Status |
|---|---|---|---|---|---|
| `worker-outbox-processor` | `services/workers/worker-outbox-processor` | Hetzner | 2 | Poll 500ms | 📋 Sprint 2 |
| `worker-campaigns` | `services/workers/worker-campaigns` | Hetzner | 3 | Inngest events | 📋 Sprint 3 |
| `worker-crm-sync` | `services/workers/worker-crm-sync` | Hetzner | 2 | Inngest events | 📋 Sprint 2 |
| `worker-email-delivery` | `services/workers/worker-email-delivery` | Hetzner | 2 | Inngest events | 📋 Sprint 3 |
| `worker-sms-delivery` | `services/workers/worker-sms-delivery` | Hetzner | 2 | Inngest events | 📋 Sprint 3 |
| `worker-reports` | `services/workers/worker-reports` | Hetzner | 1 | Inngest events | 📋 Sprint 3 |
| `worker-ai-generation` | `services/workers/worker-ai-generation` | Hetzner | 2 | Inngest events | 📋 Sprint 6 |
| `worker-tenant-provisioning` | `services/workers/worker-tenant-provisioning` | Hetzner | 1 | Inngest events | 📋 Sprint 2 |
| `worker-data-retention` | `services/workers/worker-data-retention` | Hetzner | 1 | Cron 02:00 UTC | 📋 Sprint 3 |
| `worker-billing-events` | `services/workers/worker-billing-events` | Hetzner | 1 | Inngest events | 📋 Sprint 2 |
| `worker-reputation` | `services/workers/worker-reputation` | Hetzner | 1 | Cron */15 | 📋 Sprint 3 |
| `worker-analytics-rollup` | `services/workers/worker-analytics-rollup` | Hetzner | 1 | Cron hourly | 📋 Sprint 4 |
| `worker-social-scheduler` | `services/workers/worker-social-scheduler` | Hetzner | 2 | Cron */5 | 📋 Sprint 7 |

***

## 15.4 Complete Scripts Registry

Every script in `scripts/` is a CI gate or operational tool. Each has a defined purpose, a defined trigger, and a defined exit code contract.

| Script | Trigger | Exit 0 = | Exit 1 = |
|---|---|---|---|
| `boundary-check.ts` | CI Gate 3 | All layer boundaries respected | Layer violation detected |
| `check-gha-shas.ts` | CI Gate 4 | All actions pinned to SHA | Mutable tag found |
| `validate-rls-policies.ts` | CI Gate 12 | All `tenant_id` tables have RLS | Missing RLS policy found |
| `validate-adapters.ts` | CI Gate 13 | All adapters implement interface | Missing method found |
| `verify-security-headers.ts` | CI Gate 14 | All apps emit required headers | Missing header found |
| `check-health-endpoints.ts` | CI Gate 15 | All `/api/health` return 200 | Health check failed |
| `pii-log-check.ts` | CI (advisory) | No PII in log output | PII pattern detected in logs |
| `flag-expiry-check.ts` | CI (advisory) | No expired feature flags | Expired flag found |
| `sbom-generate.ts` | Deployment | SBOM generated and uploaded | Generation failed |
| `provision-tenant.ts` | Ops manual | Tenant provisioned | Provisioning failed |
| `seed-demo-tenant.ts` | Ops manual | Demo data seeded | Seed failed |
| `deploy-platform-apps.ts` | Deployment | All apps deployed | Deployment failed |
| `notify-deployment.ts` | Deployment | Slack notification sent | Notification failed |

***

## 15.5 The 30 Non-Negotiable Rules

These rules are derived from every part of this document. They are not guidelines or preferences. Each one exists because violating it creates a specific, documented failure mode. They are listed here for fast reference.

**Architecture**

1. Every package belongs to exactly one layer. No package is layer-less or assigned to multiple layers.
2. Imports flow downward only. A Layer N package never imports from Layer N+1 or higher.
3. Vendor SDK imports are permitted only in Layer 7 adapters. No other layer imports a vendor SDK directly.
4. Feature packages (Layer 6) never instantiate adapters directly. All adapters are resolved via `getAdapterForTenant()`.
5. The `firm-api-contracts` tRPC router is the single internal API. Multiple tRPC routers for the same domain do not exist.

**Data & Tenancy**

6. Every table with a `tenant_id` column has RLS enabled with a policy that enforces `app.current_tenant_id`. No exceptions.
7. `withTenantContext()` is the only permitted way to execute database queries. Raw `db` client usage without tenant context is a security vulnerability.
8. `TenantCache` is the only permitted way to read or write tenant data in Redis. The raw Redis client is not used with tenant data.
9. The `tenantId` in a request context is derived from the verified session or API key, never from URL parameters or request body.
10. Every outbox event uses `createTypedEvent()`. Direct object construction for outbox events is an ESLint error.

**Security**

11. All webhook signature verification uses `timingSafeEqual` from `firm-crypto`. Standard `===` comparison is a timing oracle vulnerability.
12. Inbound webhook handlers implement all three security contract functions: `verifyWebhookSignature`, `preventReplay`, `enforceIdempotency`. No handler ships with fewer than three.
13. All sensitive values stored in the database (TOTP secrets, OAuth tokens, webhook secrets) are encrypted with AES-256-GCM via `firm-crypto`'s `encrypt()`. No plaintext secrets in the database.
14. No secret value is stored in `.env` files committed to the repository. All secrets are managed by Infisical.
15. The CSP header contains no `unsafe-inline` or `unsafe-eval` directives. Scripts use nonce-based allowlisting.

**Observability**

16. Every cross-boundary operation (database, Redis, adapter, Inngest, AI) is wrapped in `createSpan()`. Uninstrumented cross-boundary calls are incomplete code.
17. Every error is logged at the point of detection with full context. The catch block does not re-log the same error.
18. All business metrics are Prometheus counters or histograms defined in `firm-observability`. Log-based metric queries are not used for alerting.
19. No `console.log` in application code. All logging goes through `firm-logger`. ESLint enforces this.
20. No direct `process.env` access in application code. All environment access goes through `firm-env`. ESLint enforces this.

**Compliance**

21. Every AI-generated content item has a C2PA manifest attached at generation time. `ai_generation_log.c2pa_manifest` is never null for completed generations.
22. The `AIContentWrapper` component's disclosure label is structurally non-removable. It is not conditionally rendered based on any prop passed by the caller.
23. Email tracking pixels are only included when `trackingConsent === true`. The check is in `adapters-email-resend`, not the caller.
24. The Google Consent Mode v3 default state is `denied` for all four signals. Analytics does not load until explicit consent is given or GPC is not detected.
25. PII field access in log statements uses `'[REDACTED]'`. The Pino redaction configuration enforces this at the serializer level for known fields.

**Build & CI**

26. Every PR must pass all 15 CI gates before merge. Gates cannot be bypassed for deadline pressure. The correct response to a failing gate is to fix the code.
27. All GitHub Actions third-party action references use full 40-character commit SHA pins. Mutable tag references (`@v4`, `@main`) fail Gate 4.
28. The interface freeze (Layer 2 `contracts/v1.0.0` tag) must be declared before any Layer 6 feature package enters active development. Building features against unlocked interfaces creates compounding rework.
29. All test files are adjacent to their implementation files (`.test.ts` beside `source.ts`). Integration tests use the `.integration.ts` suffix. E2E tests live in `tests/e2e/`.
30. Coverage thresholds are minimums, not targets. Security-critical packages (`firm-crypto`, `firm-auth`, `firm-db`) require 90%+ line coverage. Dropping below threshold fails CI Gate 9.

***

## 15.6 Compliance Deadline Summary

| Deadline | Date | Days Remaining | Sprint | Packages | Done When |
|---|---|---|---|---|---|
| NY Synthetic Performer | June 9, 2026 | 28 | Sprint 1-A1 | `firm-ai`, `firm-security`, `firm-ai-content` | `AIContentWrapper` non-removable disclosure passes CI test |
| Google Consent Mode v3 | June 15, 2026 | 34 | Sprint 1-A2 | `firm-consent`, all `apps/clients/*` | All 4 signals default `denied`; `verify-security-headers` gate passes |
| CNIL Email Tracking | July 14, 2026 | 63 | Sprint 1-A3 | `firm-consent`, `firm-email` | EU recipient email without consent contains no tracking pixel |
| EU AI Act Article 50 | August 2, 2026 | 82 | Sprint 1-A4 | `firm-security`, all AI packages | Every generation has C2PA manifest; CI test enforces |

***

## 15.7 Environment Variable Master List

Every environment variable used in the platform, its owning package, and the environments in which it is required:

```
Core Platform:
  PLATFORM_VERSION          firm-env        all
  NODE_ENV                  firm-env        all
  DATABASE_URL              firm-env        all
  DIRECT_URL                firm-env        production, staging
  REDIS_URL                 firm-env        all
  REDIS_TOKEN               firm-env        production, staging

Authentication:
  AUTH_SECRET               firm-env        all
  AUTH_API_KEY_SECRET       firm-env        all
  AUTHENTIK_CLIENT_ID       firm-env        production, staging
  AUTHENTIK_CLIENT_SECRET   firm-env        production, staging
  AUTHENTIK_ISSUER          firm-env        production, staging

Security:
  FIRM_SIGNING_KEY          firm-env        all
  FIRM_WEBHOOK_SECRET       firm-env        all

Observability:
  LOKI_HOST                 firm-env        production, staging
  TEMPO_ENDPOINT            firm-env        production, staging
  PROMETHEUS_URL            firm-env        production, staging

Secrets Management:
  INFISICAL_CLIENT_ID       process.env     CI/CD only
  INFISICAL_CLIENT_SECRET   process.env     CI/CD only
  INFISICAL_PROJECT_ID      process.env     CI/CD only

AI Safety:
  ARCJET_KEY                firm-env        all

Background Jobs:
  INNGEST_EVENT_KEY         firm-env        all
  INNGEST_SIGNING_KEY       firm-env        production, staging

Infrastructure:
  VERCEL_TOKEN              CI/CD secrets   deployment
  CLOUDFLARE_API_TOKEN      CI/CD secrets   deployment
  NEON_API_KEY              CI/CD secrets   deployment
  CHROMATIC_PROJECT_TOKEN   CI/CD secrets   CI
  TURBO_TOKEN               CI/CD secrets   CI

Per-Tenant (stored encrypted in DB, loaded at runtime):
  STRIPE_SECRET_KEY         tenant config   per-tenant
  RESEND_API_KEY            tenant config   per-tenant
  TWILIO_ACCOUNT_SID        tenant config   per-tenant
  TWILIO_AUTH_TOKEN         tenant config   per-tenant
  GOOGLE_CLIENT_ID          tenant config   per-tenant
  GOOGLE_CLIENT_SECRET      tenant config   per-tenant
  GHL_API_KEY               tenant config   per-tenant
```

***

## 15.8 Monorepo Directory Map

The complete annotated directory structure of the repository:

```
firm-platform/
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    ← 15-gate CI pipeline
│   │   ├── deploy-vercel.yml         ← Production deployment
│   │   ├── lighthouse.yml            ← Performance regression testing
│   │   └── create-preview-db.yml     ← Neon branch per PR
│   ├── CODEOWNERS                    ← Review requirements by path
│   └── pull_request_template.md      ← PR checklist
│
├── apps/
│   ├── clients/
│   │   └── _template/               ← Single codebase for all 1,000 client sites
│   ├── firm-site/                   ← firmplatform.com marketing site
│   ├── firm-docs/                   ← docs.firmplatform.com
│   └── platform/
│       ├── platform-admin/
│       ├── platform-analytics/
│       ├── platform-booking/        ← Self-hosted (WebSocket requirement)
│       ├── platform-campaigns/
│       ├── platform-content/
│       ├── platform-crm/
│       ├── platform-invoicing/
│       ├── platform-portal/
│       ├── platform-projects/
│       ├── platform-proposals/
│       ├── platform-reputation/
│       ├── platform-seo/
│       └── platform-social/
│
├── packages/
│   │
│   ├── # Layer 0 — Configuration
│   ├── firm-config-eslint/
│   ├── firm-config-next/
│   ├── firm-config-tailwind/
│   ├── firm-config-typescript/
│   └── firm-config-vitest/
│   │
│   ├── # Layer 1 — Foundation
│   ├── firm-crypto/
│   ├── firm-env/
│   ├── firm-errors/
│   ├── firm-logger/
│   ├── firm-request-context/
│   ├── firm-test-utils/
│   └── firm-utils/
│   │
│   ├── # Layer 2 — Contracts
│   ├── firm-api-contracts/
│   ├── firm-types/
│   └── firm-validators/
│   │
│   ├── # Layer 3 — Infrastructure
│   ├── firm-auth/
│   ├── firm-background-jobs/
│   ├── firm-cache/
│   ├── firm-db/
│   ├── firm-rate-limiter/
│   └── firm-webhooks/
│   │
│   ├── # Layer 4 — Observability
│   ├── firm-health/
│   ├── firm-logger/
│   └── firm-observability/
│   │
│   ├── # Layer 5 — Shared App
│   ├── firm-config/
│   ├── firm-consent/
│   ├── firm-security/
│   ├── firm-tokens/
│   ├── firm-ui/
│   └── firm-white-label/
│   │
│   ├── # Layer 6 — Features
│   ├── firm-ads/
│   ├── firm-ai/
│   ├── firm-ai-brand-voice/
│   ├── firm-ai-content/
│   ├── firm-ai-seo/
│   ├── firm-bookings/
│   ├── firm-campaigns/
│   ├── firm-cms/
│   ├── firm-documents/
│   ├── firm-email/
│   ├── firm-forms/
│   ├── firm-funnels/
│   ├── firm-invoicing/
│   ├── firm-landing-pages/
│   ├── firm-leads/
│   ├── firm-notifications/
│   ├── firm-payments/
│   ├── firm-portal/
│   ├── firm-projects/
│   ├── firm-proposals/
│   ├── firm-reputation/
│   ├── firm-reporting/
│   ├── firm-sdk/
│   ├── firm-social/
│   ├── firm-storage/
│   └── firm-tenancy/
│   │
│   └── # Layer 7 — Adapters
│       └── adapters/
│           ├── ads/          (google, meta, microsoft)
│           ├── ai/           (anthropic, openai, google)
│           ├── analytics/    (ga4, posthog, plausible)
│           ├── billing/      (stripe)
│           ├── calendar/     (google, outlook, apple)
│           ├── crm/          (gohighlevel, hubspot, salesforce, activecampaign, pipedrive, keap)
│           ├── email/        (resend, sendgrid, postmark, ses)
│           ├── reviews/      (google, yelp, healthgrades, zocdoc)
│           ├── seo/          (google-sc, ahrefs, semrush)
│           ├── sms/          (twilio, vonage)
│           ├── social/       (meta, linkedin, twitter, instagram)
│           ├── storage/      (r2, s3)
│           └── vertical/     (clio, mindbody, jobber, servicetitan, propertyware)
│
├── services/
│   └── workers/
│       ├── worker-ai-generation/
│       ├── worker-analytics-rollup/
│       ├── worker-billing-events/
│       ├── worker-campaigns/
│       ├── worker-crm-sync/
│       ├── worker-data-retention/
│       ├── worker-email-delivery/
│       ├── worker-outbox-processor/
│       ├── worker-reports/
│       ├── worker-reputation/
│       ├── worker-sms-delivery/
│       ├── worker-social-scheduler/
│       └── worker-tenant-provisioning/
│
├── infra/
│   ├── cloudflare/workers/tenant-router/
│   ├── coolify/
│   ├── docker/
│   ├── grafana/dashboards/
│   ├── loki/
│   ├── prometheus/rules/alerts.yml
│   └── tempo/
│
├── scripts/
│   ├── boundary-check.ts
│   ├── check-gha-shas.ts
│   ├── check-health-endpoints.ts
│   ├── deploy-platform-apps.ts
│   ├── flag-expiry-check.ts
│   ├── notify-deployment.ts
│   ├── pii-log-check.ts
│   ├── provision-tenant.ts
│   ├── sbom-generate.ts
│   ├── seed-demo-tenant.ts
│   ├── validate-adapters.ts
│   ├── validate-rls-policies.ts
│   └── verify-security-headers.ts
│
├── docs/
│   ├── verticals/
│   │   ├── dental.json
│   │   ├── legal.json
│   │   ├── fitness.json
│   │   └── ...
│   └── runbooks/
│       ├── high-error-rate.md
│       ├── outbox-dead-letter.md
│       ├── ai-budget.md
│       └── ...
│
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── renovate.json
└── .github/CODEOWNERS
```

***

## 15.9 Document Index

For reference: every part of this blueprint and the primary question it answers.

| Part | Title | Primary Question Answered |
|---|---|---|
| 1 | Platform Overview | What is this platform and what are its boundaries? |
| 2 | Current State Assessment | What is broken and what must be fixed first? |
| 3 | Package Layer Architecture | Where does each piece of code live, and why? |
| 4 | Design System & Token Pipeline | How does visual consistency work across 1,000 client sites? |
| 5 | Database Architecture | How is data modeled, isolated, and kept consistent? |
| 6 | API & Event Architecture | How do services communicate with each other and the outside world? |
| 7 | Security & Compliance | What security controls exist and what compliance deadlines are active? |
| 8 | Observability Architecture | How do we know the platform is healthy? |
| 9 | Build System & CI/CD | How does code get from a PR to production? |
| 10 | Build Sequencing & Execution Plan | What do we build next, and in what order? |
| 11 | Adapter Implementation Contracts | How is each adapter category implemented? |
| 12 | Worker & Background Job Architecture | How are async operations executed reliably? |
| 13 | White-Label & Multi-Tenant Client Sites | How do 1,000 distinct client sites share one codebase? |
| 14 | Testing Strategy & Quality Architecture | How is correctness verified at each layer? |
| 15 | Complete Package Inventory & Final Reference | Where is everything, and what are the non-negotiable rules? |

***

*This completes Marketing Agency Mono Repository Blueprint and Assessment*