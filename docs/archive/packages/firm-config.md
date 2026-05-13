# `firm-config` — Package Planning Document

**Tenant Configuration Resolution · Per‑Client Theming · Feature Flags · SEO · Plan‑Gated Features · Zod Validation · Cache‑Through Strategy**

---

## 0. Purpose & Architectural Position

`firm-config` is the **single source of truth for tenant‑specific, runtime configuration**. It resolves per‑tenant settings, active feature flags, theme overrides, SEO metadata, and plan entitlements — serving as the bridge between the platform's shared capabilities and each client’s unique needs.

It contains **no UI** and **no business logic** — only configuration retrieval, caching, validation, and migration.

**Layer placement:** Layer 5 (UI, Theming & Configuration), Wave 6 — built after `firm-tokens` and `firm-ui`. It depends on:
- `firm-types` – `TenantId`, `TenantConfig`, `TenantTheme`, `FeatureFlag`, `PlanTier`, `SeoSettings`
- `firm-validators` – Zod schemas for tenant configuration and feature flag payloads
- `firm-db` – database access to the `tenant_configs` table
- `firm-cache` – Redis caching of resolved configurations (tenant‑scoped)
- `firm-tokens` – base design tokens that can be overridden per tenant
- `firm-env` – default plan settings, environment‑specific overrides
- `firm-errors` – typed configuration errors

**What it owns:**

| Domain | Mechanism |
|---|---|
| Tenant configuration retrieval | `getTenantConfig(tenantId)` – cache → DB → migration → validation pipeline |
| Theme resolution | Merges base tokens from `firm-tokens` with tenant‑specific overrides; validates WCAG AA contrast before storage |
| Feature flags | `isFeatureEnabled(flag, tenantId)` – plan‑gated, expiration‑aware; expired flags break the build in CI |
| SEO defaults & overrides | Per‑tenant title templates, meta tags, robots.txt, sitemap settings |
| Plan entitlements | Maps `PlanTier` to allowed features; gates feature access |
| Migration & versioning | Config schema versioning; automatic migration of deprecated fields |
| Access control | RBAC integration – who can modify configuration (handled by `firm-auth`, but `firm-config` exposes the config shape) |
| Contrast validation | Any theme override is validated for WCAG AA colour contrast before persistence |

---

## 1. Immutable Rules

| Rule | Rationale |
|---|---|
| **Tenant configuration is resolved in a fixed, immutable pipeline:** cache → database → (if stale) migration → Zod validation. | Guarantees consistency; no other code path retrieves tenant config. |
| **Feature flags are plan‑gated and time‑bound.** Flags that never expire or are not linked to a plan tier are rejected at lint time. Expired flags cause CI failure. | Prevents permanent feature flags and ensures cleanup. |
| **Theme contrast is validated before storage.** Any theme override that fails WCAG AA colour contrast cannot be saved; an error is thrown. | Enforces accessibility at the configuration level. |
| **Configuration is tenant‑scoped only.** No global platform configuration lives here; platform‑wide settings belong to `firm-env` or `firm-config-typescript`. | Clear separation of concerns. |
| **All configuration writes are immutable and audited.** Updates create new records (versioned), not row updates. | Audit trail; easy rollback. |
| **The `TenantConfig` shape is defined in `firm-types`; Zod schemas live in `firm-validators`; `firm-config` only consumes them.** | Single source of type truth elsewhere. |
| **Named exports only. No default exports.** | |
| **`exports` field is the sole contract boundary.** | |

---

## 2. Configuration Resolution Pipeline

### 2.1 `getTenantConfig(tenantId)`

The only public API for retrieving a tenant configuration. It follows a strict sequence:

```typescript
export async function getTenantConfig(tenantId: TenantId): Promise<TenantConfig> {
  // 1. Check cache
  const cached = await cache.get(tenantId, 'tenant-config');
  if (cached) {
    // validate cached version matches current schema version; if not, proceed to DB
    if (cached.schemaVersion === CURRENT_CONFIG_VERSION) return cached;
  }

  // 2. Fetch from database (latest version)
  const record = await db.query.tenantConfigs.findFirst({
    where: eq(tenantConfigs.tenantId, tenantId),
    orderBy: desc(tenantConfigs.version),
  });

  if (!record) {
    // 3. If no record, generate default config from plan
    const defaultConfig = buildDefaultConfig(tenantId);
    await saveConfig(tenantId, defaultConfig);
    await cache.set(tenantId, 'tenant-config', defaultConfig);
    return defaultConfig;
  }

  // 4. Migrate if schema version is outdated
  let config = record.config;
  if (record.schemaVersion < CURRENT_CONFIG_VERSION) {
    config = migrateConfig(config, record.schemaVersion, CURRENT_CONFIG_VERSION);
    // Save migrated config as a new version
    await saveConfig(tenantId, config, { isMigration: true });
  }

  // 5. Validate against Zod schema
  const result = tenantConfigSchema.safeParse(config);
  if (!result.success) {
    throw new ConfigValidationError(`Invalid config for tenant ${tenantId}`, {
      issues: result.error.issues,
      tenantId,
    });
  }

  // 6. Cache with explicit TTL (default 2 hours)
  await cache.set(tenantId, 'tenant-config', result.data, CACHE_TTL.tenantConfig);
  return result.data;
}
```

### 2.2 Cache Strategy

Cache key: `tenant:{tenantId}:config` (using `firm-cache` key factory). TTL: 2 hours by default, but configurable per plan. On any config write, the cache is invalidated immediately.

### 2.3 Migration

Config schema version is an integer that increments on breaking changes. The `migrateConfig` function applies sequential migrations (e.g., renaming fields, adding new required fields with defaults). Migrations are idempotent and tested. All old config versions are kept; the latest version is the active one.

---

## 3. Feature Flags

### 3.1 Flag Definition

Feature flags are defined in `firm-types` and validated by `firm-validators`. They are not stored in environment variables per tenant; they are part of the `TenantConfig.features` object.

```typescript
type FeatureFlag = {
  key: string;               // e.g., 'ai-content-generator'
  enabled: boolean;
  planTier?: PlanTier[];     // if absent, available to all plans
  expiresAt?: string;        // ISO date; mandatory for flags not tied to a plan
  description: string;
};
```

### 3.2 Gating

`isFeatureEnabled(flagKey, tenantId)` checks:
1. Flag exists in tenant config.
2. `enabled` is `true`.
3. If `planTier` is set, the tenant’s plan must be in the list.
4. If `expiresAt` is set, the current date must be before it; if expired, the flag is treated as `false` and a warning is logged.

In CI, a script scans all feature flag definitions and fails if any flag is past its expiration date (indicating it should have been removed). This enforces the “expired flags break the build” rule.

### 3.3 Feature Flag vs. Plan Tier

Plan tiers define coarse‑grained access (e.g., “Starter” has no AI generation). Feature flags allow finer‑grained control within a tier (e.g., “AI generation” might be enabled only for beta tenants on the “Pro” plan). The configuration resolves the intersection.

---

## 4. Theme & SEO Resolution

### 4.1 Theme Overrides

The tenant config contains a `themeOverrides` object (optional). It follows the same DTCG token categories as `firm-tokens` but only contains overridden values. When merging:

```typescript
function resolveTheme(baseTokens: Tokens, overrides: Partial<Tokens>): Tokens {
  return deepMerge(baseTokens, overrides);
}
```

The merged theme is validated for WCAG AA contrast on critical pairs (ink/canvas, primary/canvas, etc.) using the same validation logic from `firm-tokens`. If it fails, the config write is rejected.

The resolved theme is not stored as a separate entity; it’s computed on the fly and cached (but cache invalidates if base tokens or overrides change).

### 4.2 SEO Settings

```typescript
type SeoSettings = {
  titleTemplate: string;       // e.g., "{page} | Client Name"
  defaultTitle: string;
  defaultDescription: string;
  robots: 'index,follow' | 'noindex,nofollow';
  ogImage: string;            // URL
  twitterHandle?: string;
  additionalMetaTags?: Record<string, string>;
  sitemap: {
    enabled: boolean;
    excludePaths?: string[];
  };
};
```

These are consumed by the application layout to set `<head>` content dynamically based on tenant.

---

## 5. Plan Entitlements

A central mapping of `PlanTier` → capabilities:

```typescript
type PlanTier = 'starter' | 'professional' | 'enterprise' | 'agency';

type PlanCapability =
  | 'max_users'
  | 'max_leads'
  | 'ai_generation'
  | 'white_label'
  | 'custom_domain'
  | 'priority_support'
  | 'api_access'
  | 'sso';

const PLAN_LIMITS: Record<PlanTier, Partial<Record<PlanCapability, number | boolean>>> = {
  starter:      { max_users: 3, max_leads: 500, ai_generation: false, white_label: false },
  professional: { max_users: 20, max_leads: 10000, ai_generation: true, white_label: false },
  enterprise:   { max_users: 100, max_leads: 100000, ai_generation: true, white_label: true, api_access: true },
  agency:       { max_users: 500, max_leads: 1000000, ai_generation: true, white_label: true, api_access: true, sso: true },
};
```

The loaded tenant config includes the `plan` tier, and `firm-config` exposes a function `getPlanLimit(tenantId, capability)` that returns the limit. This is used by feature packages to enforce usage caps.

---

## 6. Write Path & Audit

### 6.1 Updating Configuration

Administrators (super‑admin or tenant‑admin with required RBAC permission) can update configuration via a protected API. The update flow:

1. Read current config.
2. Apply partial overrides (deep merge).
3. Validate the resulting config (schema + theme contrast).
4. Increment version, assign new `configId`.
5. Write new record to `tenant_configs` table.
6. Invalidate cache for that tenant.
7. Log immutable audit event.

### 6.2 Database Table

```sql
CREATE TABLE tenant_configs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    version int NOT NULL,
    schema_version int NOT NULL DEFAULT 1,
    config jsonb NOT NULL,
    created_by uuid REFERENCES users(id),
    created_at timestamptz DEFAULT now(),
    is_migration boolean DEFAULT false
);

CREATE UNIQUE INDEX idx_tenant_config_latest ON tenant_configs (tenant_id, version DESC);
```

Every write is an insert; the latest version is determined by the maximum `version`.

---

## 7. Module Inventory

```
packages/firm-config/
├── src/
│   ├── index.ts                    # Public API: getTenantConfig, isFeatureEnabled, getPlanLimit, resolveTheme, getSeoSettings, invalidateCache
│   ├── retrieval/
│   │   ├── get-config.ts           # Main pipeline: cache → DB → migration → validation
│   │   └── cache.ts                # Cache helpers (get/set/invalidate)
│   ├── features/
│   │   ├── flags.ts                # isFeatureEnabled, validateFeatureFlags
│   │   └── plan-limits.ts          # Plan entitlements mapping
│   ├── theme/
│   │   ├── merge.ts                # mergeBaseWithOverrides
│   │   └── contrast-check.ts       # validateContrast (uses firm-tokens contrast validation logic)
│   ├── seo/
│   │   └── seo.ts                  # getSeoSettings, defaultSEO
│   ├── migration/
│   │   ├── migrate.ts              # migrateConfig (in-place) with version map
│   │   └── versions.ts             # Migration functions per version
│   ├── schema.ts                   # Re-exports Zod schemas from firm-validators for convenience
│   ├── build-defaults.ts           # buildDefaultConfig(tenantId) – creates starter config
│   ├── write.ts                    # updateTenantConfig (with audit logging)
│   └── types.ts                    # Internal helper types
├── tests/
│   ├── retrieval.test.ts
│   ├── features.test.ts
│   ├── theme.test.ts
│   ├── migration.test.ts
│   ├── seo.test.ts
│   └── write.test.ts
├── package.json
├── README.md
└── CHANGELOG.md
```

---

## 8. Key Patterns

### 8.1 Config Resolution in a Next.js App

In a server component or `proxy.ts`:

```typescript
import { getTenantConfig } from 'firm-config';

const config = await getTenantConfig(tenantId);
// Use config.features, config.theme, config.seo
```

### 8.2 Feature Gating a Component or Route

```tsx
import { isFeatureEnabled } from 'firm-config';

export default async function AIWriterPage({ tenantId }: { tenantId: TenantId }) {
  if (!await isFeatureEnabled('ai-content-generator', tenantId)) {
    return <NotAllowed />;
  }
  return <AIEditor />;
}
```

### 8.3 Theme Injection in Root Layout

```tsx
// app/layout.tsx
import { getTenantConfig } from 'firm-config';
import { resolveTheme } from 'firm-config/theme/merge';

export default async function RootLayout({ children, tenantId }) {
  const config = await getTenantConfig(tenantId);
  const theme = resolveTheme(baseTokens, config.themeOverrides);
  return (
    <html data-theme={tenantId} style={theme.cssVariables}>
      <body>{children}</body>
    </html>
  );
}
```

---

## 9. Package Configuration

### 9.1 `package.json`

```jsonc
{
  "name": "firm-config",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./*": "./src/*.ts"
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts --sourcemap",
    "typecheck": "tsc --build --noEmit",
    "lint": "eslint src/ tests/",
    "test": "vitest run --coverage"
  },
  "dependencies": {
    "firm-types": "workspace:*",
    "firm-validators": "workspace:*",
    "firm-db": "workspace:*",
    "firm-cache": "workspace:*",
    "firm-tokens": "workspace:*",
    "firm-env": "workspace:*",
    "firm-errors": "workspace:*",
    "zod": "catalog:"
  },
  "devDependencies": {
    "firm-config-typescript": "workspace:*",
    "firm-config-eslint": "workspace:*",
    "tsup": "catalog:",
    "vitest": "catalog:",
    "typescript": "catalog:"
  },
  "sideEffects": false
}
```

### 9.2 `tsconfig.json`

```jsonc
{
  "extends": "firm-config-typescript/base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  },
  "include": ["src", "tests"],
  "exclude": ["dist", "node_modules"],
  "references": [
    { "path": "../firm-types" },
    { "path": "../firm-validators" },
    { "path": "../firm-db" },
    { "path": "../firm-cache" },
    { "path": "../firm-tokens" },
    { "path": "../firm-env" },
    { "path": "../firm-errors" }
  ]
}
```

---

## 10. Test Strategy

| Suite | Key Tests |
|---|---|
| Retrieval pipeline | cache hit, cache miss, DB fallback, migration trigger, validation error, default config generation |
| Feature flags | flag enabled, flag disabled, plan gating, expiration, CI check for expired flags |
| Theme merge | base only, override only, deep merge, contrast check (pass and fail) |
| Migration | sequential migrations from v0 to current, idempotency, invalid version |
| Write path | validation errors, audit logging, cache invalidation |
| Plan limits | each capability returns correct limit per plan |
| SEO | default vs. override settings |

Integration tests require a real database and Redis; unit tests mock DB and cache as needed.

---

## 11. Interface Freeze & Governance

- After Wave 6, the `TenantConfig` shape is frozen; adding new optional fields is a minor change; removing or renaming fields requires a major version bump and migration.
- Feature flag names and plan tier mapping are frozen; changed via dedicated PRs with review.
- The config retrieval pipeline (cache → DB → migration → validation) is immutable; no alternative path may exist.
- CI blocks any unexpired feature flag; expired flags must be removed or given a new expiration.
- Theme contrast validation cannot be bypassed.

---

## 12. Documentation Requirements

- **README.md**: Integration guide for apps, config shape reference, feature flag lifecycle, theme override examples, SEO setup.
- **TSDoc** on all public functions.

---

## 13. Next Package

After `firm-config`, the next package is in Layer 6 (Feature Packages). The initial feature package to build is **`firm-feature-crm`** (Lead Management, CRM Sync), but first we need to define the structure for all feature packages. However, the prompt is to "Produce the next package", so we should produce the next planning document in order, which would be the first feature package or a meta document for feature packages. Given the architecture skeleton, Layer 6 includes "Tiered packages (A, B, C)". We'll need to decide which one to document next. The skeleton mentions: "Business features: AI, email, forms, CRM, payments, background processing." A logical start is `firm-feature-crm` or a base pattern for feature packages. But to follow the established pattern of producing detailed planning documents for each package, we can do the next one as `firm-feature-crm`. However, the user hasn't specified which feature package; they just said "Produce the next package". Since the sequence so far has been following the layers, the next logical layer is 6, and within that, maybe the first feature package that touches on many cross-cutting concerns: probably CRM or email. I'll produce `firm-feature-crm` as the next package.

I'll prepare that.# `firm-feature-crm` — Package Planning Document

**Lead Management · CRM Sync (Multi‑Provider) · Duplicate Detection · Email Automation · Reporting · Consent‑Gated Analytics · Webhook Handlers · Idempotent Sagas**

---

## 0. Purpose & Architectural Position

`firm-feature-crm` is the **first business feature package** in the platform. It implements lead capture, enrichment, deduplication, scoring, and synchronisation with external CRM systems via adapters (Layer 7). It exposes a set of server actions, API routes, and background workers that together form the lead management system.

It belongs to Layer 6 (Feature Packages), **Tier A** (foundational business feature). It depends on:
- Lower‑layer packages: `firm-types`, `firm-validators`, `firm-api-contracts`, `firm-db`, `firm-cache`, `firm-auth`, `firm-consent`, `firm-observability`, `firm-config`, `firm-security`
- Adapters (Layer 7): `adapters-crm` (interface and implementations for GoHighLevel, HubSpot, Salesforce, etc.)

It does **not** depend on UI packages directly, but it may provide React hooks for client interactions (opt‑in). Its primary output is server‑side logic and background jobs.

**What it owns:**

| Domain | Mechanism |
|---|---|
| Lead creation | Form submissions → validated → deduplicated → stored → synced |
| Lead enrichment | Append visitor data (UTM, referrer, IP‑derived firmographics) at creation time |
| Lead scoring | Rules engine (demographic fit + behavioral signals) |
| Lead status transitions | State machine: `new` → `contacted` → `qualified` → `converted` (or `lost`) |
| CRM sync | Distributes leads to the configured CRM adapter(s); idempotent, with retry and dead‑letter queue |
| Duplicate detection | Fuzzy matching on email/phone/name; merge suggestions |
| Email automation | Trigger welcome emails, drip sequences (via `firm-feature-email` – but this package defines the trigger) |
| Reporting | Aggregated lead counts by source, status, conversion rates (cached) |
| Consent enforcement | All tracking and email sending gates through `firm-consent`; analytics events only fire if analytics consent is granted |
| Webhook reception | Accepts inbound lead webhooks from external sources (validate signature → deduplicate → process) |
| Idempotent sagas | For long‑running workflows (e.g., lead import from CSV) using Inngest, with compensation paths on failure |

---

## 1. Immutable Rules

| Rule | Rationale |
|---|---|
| **No raw SQL.** All database access uses `firm-db` query helpers and Drizzle’s typed query builder. | Type safety, RLS enforcement. |
| **All public API (server actions, REST endpoints) is security‑hardened:** validated input, rate‑limited, authenticated, authorised, Turnstile where applicable. | Consistent security posture. |
| **Analytics events are consent‑gated.** No `track()` call fires if analytics consent is denied. | Privacy compliance (GDPR/CCPA). |
| **CRM sync is idempotent** — duplicate external records are detected and merged, not overwritten. | Data integrity. |
| **Webhook processing order is non‑negotiable:** verify signature (raw body) → check idempotency key → process → return 200 for duplicates. | Prevents replay attacks and duplicate processing. |
| **Named exports only. No default exports.** | |
| **Business logic only — no UI.** Presentational components (e.g., lead tables) belong in feature‑specific UI packages or `firm-ui`; this package provides hooks if needed. | Separation of concerns. |
| **All dependencies are pinned (workspace protocol and catalog).** | |

---

## 2. Lead Lifecycle & State Machine

```
              +---------+
              |   new   |
              +----+----+
                   |
          +--------v---------+
          |    contacted      |
          +--------+---------+
                   |
          +--------v---------+
          |    qualified      |
          +--------+---------+
                   |
          +--------v---------+
          |    converted      |
          +------------------+
                   |
          +--------v---------+
          |       lost        |
          +------------------+
```

Transitions are triggered by explicit actions (`markContacted`, `markQualified`, etc.) or automatically when a lead meets scoring thresholds.

---

## 3. Module Inventory

```
packages/firm-feature-crm/
├── src/
│   ├── index.ts                    # Public API: server actions, query helpers
│   ├── lead/
│   │   ├── create-lead.ts          # Main creation pipeline
│   │   ├── deduplicate.ts          # Fuzzy matching & merge logic
│   │   ├── enrich.ts               # Enrichment (geo, firmographics)
│   │   ├── score.ts                # Scoring engine
│   │   ├── status.ts               # State machine transitions
│   │   └── import.ts               # CSV import (Inngest saga)
│   ├── crm-sync/
│   │   ├── sync-lead.ts            # Single lead sync to configured CRM adapter
│   │   ├── sync-worker.ts          # Inngest worker that processes sync jobs
│   │   └── webhook-handler.ts      # Inbound webhook endpoint
│   ├── email/
│   │   └── triggers.ts             # Defines events that trigger emails (e.g., lead.created)
│   ├── reporting/
│   │   ├── reports.ts              # Counts by source, status, conversion (cached)
│   │   └── metrics.ts              # Emits platform metrics
│   ├── hooks/                      # Optional React hooks for client use
│   │   ├── useLeads.ts
│   │   └── useLeadStats.ts
│   ├── sagas/                      # Complex workflows
│   │   └── lead-import-saga.ts
│   ├── types.ts                    # Feature‑specific types
│   └── config.ts                   # Feature flag checks (e.g., ai-lead-scoring)
├── tests/
│   ├── create-lead.test.ts
│   ├── deduplicate.test.ts
│   ├── score.test.ts
│   ├── crm-sync.test.ts
│   ├── webhook.test.ts
│   └── ...
├── package.json
├── README.md
└── CHANGELOG.md
```

---

## 4. Key Patterns

### 4.1 Lead Creation Pipeline

```typescript
export async function createLead(input: CreateLeadInput, tenantId: TenantId, session: SessionContext): Promise<Lead> {
  // 1. Validate
  const validated = createLeadInputSchema.parse(input);
  // 2. Deduplicate
  const existing = await findDuplicate(tenantId, validated.email, validated.phone);
  if (existing) {
    await mergeLeads(existing, validated);
    return existing;
  }
  // 3. Enrich
  const enriched = await enrichLead(tenantId, validated);
  // 4. Save to DB (within tenant context)
  const lead = await saveLead(tenantId, enriched);
  // 5. Score (async, fire‑and‑forget with Inngest)
  await scoreLeadInBackground(lead);
  // 6. Trigger CRM sync (idempotent)
  await triggerCrmSync(lead, tenantId);
  // 7. Trigger email automation (if consent given)
  if (await isFeatureEnabled('lead-emails', tenantId) && await consentManager.isGranted('marketing')) {
    await triggerWelcomeEmail(lead, tenantId); // goes to firm-feature-email
  }
  // 8. Audit
  await logLeadEvent(tenantId, 'lead.created', lead);
  return lead;
}
```

### 4.2 Deduplication

Uses a combination of exact email match and fuzzy name+phone matching (via `fuzzysort` or similar). When a duplicate is found, the older record is updated with any new data, and a `lead.merged` event is emitted.

### 4.3 CRM Sync (Idempotent)

Each lead sync to an external CRM is tracked with a `sync_jobs` table:

```sql
CREATE TABLE sync_jobs (
    id uuid PRIMARY KEY,
    lead_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    adapter_name text NOT NULL,
    external_id text,
    status text NOT NULL DEFAULT 'pending', -- pending, success, failed, dead
    attempts int DEFAULT 0,
    last_error text,
    idempotency_key text NOT NULL UNIQUE,
    created_at timestamptz DEFAULT now()
);
```

The sync worker processes pending jobs; failures are retried with exponential backoff up to a max attempts, then moved to a dead‑letter queue for manual review.

### 4.4 Webhook Handler

For inbound leads from external sources (e.g., Facebook Lead Ads, landing pages):

```typescript
export async function handleInboundLeadWebhook(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-webhook-signature');
  const idempotencyKey = request.headers.get('x-idempotency-key');

  // 1. Verify signature (adapter‑specific, but constant‑time)
  if (!verifyWebhookSignature(rawBody, signature)) {
    throw new WebhookSignatureError();
  }

  // 2. Check idempotency
  if (await isIdempotencyKeyUsed(idempotencyKey)) {
    return new Response(JSON.stringify({ status: 'duplicate' }), { status: 200 });
  }

  // 3. Parse and validate
  const parsed = JSON.parse(rawBody);
  const leadData = inboundLeadSchema.parse(parsed);

  // 4. Process
  const lead = await createLead(leadData, resolveTenantId(request));
  await markIdempotencyKeyUsed(idempotencyKey);

  return new Response(JSON.stringify(lead), { status: 201 });
}
```

---

## 5. Integration with Consent

All analytics events and marketing emails are gated behind consent:

```typescript
if (await consentManager.isGranted('analytics')) {
  trackEvent('lead_created', { leadId: lead.id }, tenantId);
}
```

`trackEvent` is a helper that uses `firm-observability` and `firm-consent` under the hood.

---

## 6. Feature Flags & Plan Limits

- `ai-lead-scoring`: If enabled and plan allows AI, use AI to score leads.
- `lead-emails`: Sends welcome emails (requires email provider configured).
- `crm-sync`: Which CRM adapters are active.
- `max_leads`: Enforced at creation; if tenant exceeds plan limit, creation is denied.
- `lead-export`: Allows CSV export.

All flags are checked via `firm-config` and can be toggled per tenant.

---

## 7. Package Configuration

### 7.1 `package.json`

```jsonc
{
  "name": "firm-feature-crm",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./hooks/*": "./src/hooks/*.ts"
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts --sourcemap",
    "typecheck": "tsc --build --noEmit",
    "lint": "eslint src/ tests/",
    "test": "vitest run --coverage"
  },
  "dependencies": {
    "firm-types": "workspace:*",
    "firm-validators": "workspace:*",
    "firm-api-contracts": "workspace:*",
    "firm-db": "workspace:*",
    "firm-cache": "workspace:*",
    "firm-auth": "workspace:*",
    "firm-consent": "workspace:*",
    "firm-observability": "workspace:*",
    "firm-config": "workspace:*",
    "firm-security": "workspace:*",
    "firm-errors": "workspace:*",
    "adapters-crm": "workspace:*",  // Layer 7
    "zod": "catalog:",
    "fuzzysort": "catalog:",
    "inngest": "catalog:"
  },
  "devDependencies": {
    "firm-config-typescript": "workspace:*",
    "firm-config-eslint": "workspace:*",
    "tsup": "catalog:",
    "vitest": "catalog:",
    "typescript": "catalog:"
  },
  "sideEffects": false
}
```

### 7.2 `tsconfig.json`

```jsonc
{
  "extends": "firm-config-typescript/base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  },
  "include": ["src", "tests"],
  "exclude": ["dist", "node_modules"],
  "references": [
    { "path": "../firm-types" },
    { "path": "../firm-validators" },
    { "path": "../firm-api-contracts" },
    { "path": "../firm-db" },
    { "path": "../firm-cache" },
    { "path": "../firm-auth" },
    { "path": "../firm-consent" },
    { "path": "../firm-observability" },
    { "path": "../firm-config" },
    { "path": "../firm-security" },
    { "path": "../firm-errors" },
    { "path": "../adapters-crm" }
  ]
}
```

---

## 8. Test Strategy

| Suite | Key Tests |
|---|---|
| Lead creation | Validation, duplicate detection, enrichment, DB persistence |
| Deduplication | Exact email match, fuzzy match, merge logic |
| Scoring | Rule‑based scoring, edge cases |
| CRM sync | Adapter mock, idempotency check, retry and dead‑letter queue |
| Webhooks | Signature verification, idempotency, valid/invalid payload |
| Consent | Analytics event suppression when denied |
| Plan limits | Enforcement at lead creation |
| Sagas | CSV import compensation on failure |

Integration tests use a real database/Redis and mock adapters.

---

## 9. Build Order & Dependency Map

```
Layer 0–5 packages ──► firm-feature-crm
                                      ├── adapters-crm (Layer 7)
                                      └── firm-feature-email (later)
```

`firm-feature-crm` is the first feature package and must wait for all lower layers to be built.

---

## 10. Interface Freeze & Governance

- After Wave 6 (feature packages), the lead schema and public API (createLead, updateLead) are frozen.
- New fields may be added as minor changes; removing fields requires migration and is major.
- CRM adapter interface (defined in `adapters-crm`) is frozen; this package only uses it.
- Webhook processing order is immutable.
- Feature flag keys used in this package are documented and must be kept in sync with `firm-config`.

---

## 11. Documentation Requirements

- **README.md**: Lead lifecycle, API reference, CRM sync architecture, webhook integration guide, feature flag reference.
- **TSDoc** on all public exports.

---

## 12. Next Package

After `firm-feature-crm`, the next package is **`adapters-crm`** (Layer 7) — the CRM adapter interface and initial implementations (e.g., GoHighLevel, HubSpot).

---

## References

- [Inngest Durable Execution](https://www.inngest.com/docs/durable-execution)
- [Idempotency Keys for APIs](https://brandur.org/idempotency-keys)
- [Fuzzy Matching in JavaScript](https://fusejs.io/)
- [Lead Scoring Best Practices](https://www.marketo.com/lead-scoring/)