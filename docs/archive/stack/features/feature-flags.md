# Feature Flags – How We Manage Feature Flags in This Monorepo

**Created: May 2026**  
*This guide covers our feature flag system: where flags are defined, how they're stored, the taxonomy we use, the full lifecycle from creation to removal, CI enforcement, per‑tenant scoping, and local development workflows.*

---

## 1. Where Flags Live — Two‑Layer Architecture

We use a two‑layer architecture that separates **definition** (code) from **evaluation** (runtime values).

| Layer | Location | Purpose |
|---|---|---|
| **Flag definitions** | `packages/firm-flags/src/flags.ts` (shared) or `lib/flags.ts` (per‑app) | TypeScript code that declares every flag with its key, type, default value, and optional identification context |
| **Flag values & targeting** | Vercel Edge Config (global, <1 ms reads at P50, <15 ms at P99) | Runtime flag values, targeting rules, user segments, and environment‑specific overrides |

The SDK is **`@vercel/flags`** — a free, open‑source (MIT) library from the creators of Next.js. It provides full TypeScript inference, automatic integration with Flags Explorer, precompute for static pages, and server‑side evaluation by default (no client‑side flicker).

**Why Vercel Flags over LaunchDarkly / Split / Unleash?**  
Vercel Flags is built into the platform where all our full‑stack apps already deploy. It requires zero additional infrastructure, zero external API calls at evaluation time (values live in Edge Config read locally), and zero additional cost. For a team already on Vercel Pro, it is the simplest, fastest option. If we ever need to migrate, the Flags SDK is provider‑agnostic (supports OpenFeature standards and adapters for LaunchDarkly, Optimizely, Statsig, and others) — the flag definitions in `flags.ts` stay the same; only the adapter changes.

---

## 2. Flag Definitions in Code

### 2.1 The Shared Flag Registry

All platform‑wide flags are defined in `packages/firm-flags/src/flags.ts`. This is the canonical registry — any flag not defined here (or in an app‑specific `lib/flags.ts` with an ADR justification) will be rejected by CI.

```typescript
// packages/firm-flags/src/flags.ts
import { flag, dedupe } from 'flags/next';
import { vercelAdapter } from '@flags-sdk/vercel';
import type { Session, TenantContext } from '@firm/auth';

// ── Entity types ──────────────────────────────────
type Entities = {
  user?: { id: string; role: string };
  tenant?: { id: string; tier: 'enterprise' | 'pro' | 'standard' };
};

// ── Identity (deduplicated per request) ─────────────
const identify = dedupe(async (): Promise<Entities> => {
  const session = await import('@firm/auth').then(m => m.auth());
  return {
    user: session?.user ? { id: session.user.id, role: session.user.role } : undefined,
    tenant: session?.tenantId
      ? { id: session.tenantId, tier: session.user?.tenantTier ?? 'standard' }
      : undefined,
  };
});

// ── Release flags ──────────────────────────────────
export const showNewDashboard = flag<boolean, Entities>({
  key: 'release/new-dashboard',
  description: 'Roll out the redesigned dashboard (remove by 2026‑07‑15)',
  identify,
  decide: () => false,       // default OFF; overridden via Vercel Dashboard targeting
});

// ── Experiment flags ────────────────────────────────
export const homepageCtaVariant = flag<'control' | 'v2', Entities>({
  key: 'exp/homepage-cta-v2',
  description: 'A/B test new homepage CTA (ends 2026‑06‑30)',
  options: [
    { value: 'control', label: 'Original CTA' },
    { value: 'v2', label: 'New CTA' },
  ],
  identify,
  decide: () => 'control',
});

// ── Ops / Kill‑switch flags ─────────────────────────
export const disableRecommendations = flag<boolean, Entities>({
  key: 'ops/disable-recommendations',
  description: 'Kill switch for AI recommendation engine',
  identify,
  decide: () => false,       // false = NOT disabled = feature ON
});

// ── Permission flags ────────────────────────────────
export const enterpriseAnalytics = flag<boolean, Entities>({
  key: 'perm/enterprise-analytics',
  description: 'Advanced analytics only for enterprise-tier tenants',
  identify,
  decide: ({ entities }) => entities?.tenant?.tier === 'enterprise',
});
```

**Key patterns in this file:**
- **`dedupe()` wrapper:** Ensures the `identify` function is called exactly once per request, even if dozens of flags reference it. This avoids redundant session lookups.
- **Explicit `description`:** Every flag carries a human‑readable description that includes the planned removal date (for `release/` and `exp/` flags).
- **`decide` as fallback only:** The `decide` function returns a safe default — the Vercel Dashboard targeting rules override it at runtime.

### 2.2 Consuming Flags in Application Code

```tsx
// app/dashboard/page.tsx (Server Component)
import { showNewDashboard, homepageCtaVariant } from '@firm/flags';

export default async function DashboardPage() {
  const isNewDash = await showNewDashboard();
  const ctaVariant = await homepageCtaVariant();

  return (
    <div>
      {isNewDash ? <NewDashboard /> : <LegacyDashboard />}
      <CtaButton variant={ctaVariant} />
    </div>
  );
}
```

Because flags are evaluated server‑side by default, the browser never sees a flash of the wrong UI. There is no client‑side flicker.

### 2.3 Precompute Pattern — Static Pages

For static marketing pages, evaluating flags at request time would force dynamic rendering. Instead, we use the **precompute** pattern — flags are resolved once at build time and each variant becomes its own static page.

```typescript
// packages/firm-flags/src/flags.ts (add to existing file)
export const layoutVariant = flag<'a' | 'b', Entities>({
  key: 'exp/layout-variant',
  options: [{ value: 'a' }, { value: 'b' }],
  identify,
  decide: () => 'a',
});

export const precompute = [layoutVariant];
// Build generates: /variant-a and /variant-b as separate static pages
```

Next.js treats each precomputed variant as a distinct static page, served from the CDN with zero runtime flag evaluation. For pages with flag variants that don't need precomputation, `'use cache'` in Next.js 16 provides a simpler alternative for caching flag‑resolved output.

---

## 3. Flag Taxonomy

Every flag in this platform must follow the **canonical four‑type taxonomy**, derived from Martin Fowler's framework and still the industry standard in 2026.

| Type | Prefix | Lifespan | Removal Policy | Example |
|---|---|---|---|---|
| **Release** | `release/` | Days to weeks (temporary) | Auto‑removed within 30 days after reaching 100% rollout | `release/checkout-redesign` |
| **Experiment** | `exp/` | Weeks to months (medium‑lived) | Removed within 30 days after experiment conclusion | `exp/homepage-cta-v2` |
| **Ops / Kill Switch** | `ops/` | Permanent (or until feature removed) | Quarterly audit; exercised in DR drills | `ops/disable-recommendations` |
| **Permission** | `perm/` | As long as entitlement exists | Removed when tier or plan changes | `perm/enterprise-sso` |

**Rules enforced at flag creation time (enforced by CI):**
1. Every flag must have a `description` that human beings can understand.
2. Every `release/` and `exp/` flag must include a **planned removal date** in its description (format: `YYYY‑MM‑DD`).
3. Every flag must declare an **owner** (the team or individual responsible) — this is recorded in the PR description and in a comment on the flag definition.
4. Flag keys must use `kebab‑case` and match the pattern `{type}/{descriptive‑name}`.

---

## 4. Flag Lifecycle — Creation to Removal

### 4.1 Creation

```
1. Developer opens a PR that adds a new flag() definition to flags.ts
2. CI validates:
   - Key follows {type}/{descriptive-name} pattern
   - Description includes planned removal date (for release/exp)
   - Flag is registered in the Vercel Dashboard (or a dashboard‑create ticket is linked)
   - No duplicate key exists
3. Reviewer approves; PR merges
4. On merge, the Vercel Dashboard targeting rules become active
```

### 4.2 Rollout (Release Flags)

```
Dashboard:   0% (default OFF) → 10% employees → 25% → 50% → 100%
Code:        No change — values come from Edge Config targeting rules
Duration:    Typically 2–7 days per step
Rollback:    Set back to 0% in Dashboard (instant; no deploy required)
```

Vercel Flags targeting rules support:
- **Percentage rollouts** (e.g., 10% of all traffic; consistent per‑entity via hashing)
- **User/tenant targeting** (specific user IDs, tenant tiers, roles)
- **Attribute‑based rules** (e.g., `tenant.tier === 'enterprise'`)

### 4.3 Stabilisation

After a flag has been at 100% (or 0%) for **one full release cycle** (typically 7 days), it is eligible for removal.

### 4.4 Removal

Removal follows a strict checklist that is enforced in the PR template and reviewed by CI:

```
## Flag Removal Checklist

- [ ] Flag has been at 100% (or 0%) for at least 7 days
- [ ] Targeting rules removed from Vercel Dashboard
- [ ] Flag definition removed from flags.ts
- [ ] All consumption sites in codebase updated (the `flag()` call removed, condition simplified)
- [ ] Dead code paths (the non‑selected variant) deleted
- [ ] Test fixtures updated to reflect the permanent state
- [ ] Flag archived in Vercel Dashboard (not just ignored)
- [ ] PR description links to the original creation ticket/PR
```

This checklist is a battle‑tested industry pattern. The removal PR must link back to the original creation PR so that any future developer can trace the full history in under a minute.

### 4.5 What Happens If You Skip This

A flag left in the codebase after it's "done" becomes tech debt. Six months later nobody remembers what it did. More conditionals accumulate, the test matrix expands, and eventually a dormant code path is unexpectedly re‑activated — a pattern that has caused major production incidents throughout the industry. Flag hygiene is boring on purpose. Boring is safe.

---

## 5. CI Enforcement — Automated Flag Hygiene

CI is the natural enforcement point for flag hygiene because every flag event (creation, aging, removal) manifests as a code change that passes through the pipeline.

### 5.1 Three Tiers of Enforcement

| Tier | Trigger | What Happens |
|---|---|---|
| **Block** | Expired flag found (removal date in past) | **CI fails.** PR cannot merge. |
| **Warn** | Flag older than 30 days (release) or 60 days (experiment) with no removal PR | **CI comment.** Merge allowed but owner notified. |
| **Detect** | New flag added, flag removed, flag key changed | **Log.** Tracked in a weekly flag hygiene report. |

### 5.2 The Validation Script

The platform already runs `scripts/validate-feature-flags.ts` in CI (referenced in `ci-cd.md`). This script:

1. Parses every `flag()` definition in `packages/firm-flags/src/flags.ts` and any app‑specific flag files.
2. Extracts `key`, `description`, and parses any `YYYY‑MM‑DD` date from the description.
3. **Block rule:** If any date is in the past (expired flag not yet removed), fail CI.
4. **Warn rule:** If any `release/` flag has a creation date > 30 days old without a linked removal PR, post a CI comment.
5. **Detect rule:** Compare against the previous `main` to see which flags were added or removed; log to the weekly report.

### 5.3 Automated Cleanup PRs (Future / Phase 2)

When a flag has been at 100% for 30+ days, an automated workflow can generate a cleanup PR:

```yaml
# .github/workflows/flag-cleanup.yml
name: Feature Flag Cleanup
on:
  schedule:
    - cron: '0 9 * * 1'   # Every Monday 09:00 UTC
jobs:
  cleanup-stale-flags:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<commit-sha>
      - name: Detect stale flags
        run: pnpm flags:detect-stale
      - name: Generate cleanup PR
        run: pnpm flags:cleanup --auto-pr
```

This pattern is used by teams managing 200+ flags and can reduce manual cleanup burden by 80%. The platform will adopt this once the number of active flags exceeds 20–30.

---

## 6. Per‑Tenant and Per‑User Targeting

### 6.1 How It Works

The `identify` function in `flags.ts` returns the `Entities` context. This context is sent to the Vercel Flags evaluation engine on every flag call. Targeting rules in the Vercel Dashboard can then use any attribute in this context.

**Example dashboard targeting rule:**  
*"Enable `release/new-dashboard` ONLY when `tenant.tier === 'enterprise'`"*

This means a single flag definition in code can enable a feature for enterprise tenants, keep it off for standard tenants, and be rolled out progressively — all controlled from the Vercel Dashboard, updated in seconds, with no code deploy.

### 6.2 Per‑Tenant Cache Isolation

When a page's rendered output depends on flag values (and flag values depend on the tenant context), cache tags must include the `tenantId` to prevent cross‑tenant cache leakage:

```tsx
// app/page.tsx
import { cacheTag } from 'next/cache';
import { showNewDashboard } from '@firm/flags';
import { auth } from '@firm/auth';

export default async function HomePage() {
  'use cache';
  const session = await auth();
  const isNewDash = await showNewDashboard();
  cacheTag(`tenant-${session.tenantId}-homepage`);
  // ...
}
```

This is the same pattern described in `frontend.md` § 5 — cache tags are scoped to the tenant.

### 6.3 Agency Staff Override

Agency staff (members of the root organization) can override flags for testing purposes via the **Vercel Toolbar → Flags Explorer** panel (see § 7). These overrides are session‑scoped and never affect client users.

---

## 7. Local Development & Flags Explorer

### 7.1 Development Workflow

During local development (`pnpm dev`), flags evaluate against the **Development** environment in Vercel Flags. The `decide` function serves as the default; you can override any flag value via the Vercel Toolbar:

1. Run `pnpm dev` (starts Next.js on `localhost:3000`).
2. Open the browser. The Vercel Toolbar appears automatically if configured.
3. Click **Flags Explorer** in the Toolbar.
4. Toggle any flag to override its value **for your session only** — no other developers are affected.

### 7.2 Sharing Overrides

When testing a feature branch, you can **save recommendations** so that anyone visiting your preview deployment sees the same flag values:

1. Set the desired overrides in Flags Explorer.
2. Select the chevron next to the branch name.
3. Choose **Save Recommendations**.
4. When another team member visits the preview URL, they receive a prompt to apply the recommended overrides.

### 7.3 Preview Deployments

Every PR deploys to a Vercel preview environment. The preview environment inherits flag values from Production by default, but you can set per‑environment overrides in the Vercel Dashboard. This enables testing a feature flag at 100% in preview without affecting production.

### 7.4 Setup (One‑Time Per Project)

The Flags Explorer requires a well‑known API endpoint in each app:

```typescript
// app/.well-known/vercel/flags/route.ts
import { createFlagsDiscoveryEndpoint, getProviderData } from 'flags/next';
import * as flags from '../../../../lib/flags';

export const GET = createFlagsDiscoveryEndpoint(async () => {
  return getProviderData(flags);
});
```

This endpoint uses the `FLAGS_SECRET` environment variable (automatically set by Vercel) to authenticate requests.

---

## 8. Governance Rules

### 8.1 Who Can Change What

| Role | Create Flags | Edit Targeting Rules | Delete/Archive Flags | Override in Preview |
|---|---|---|---|---|
| **Platform Admin** | ✅ | ✅ | ✅ | ✅ |
| **Senior Developer** | ✅ | ✅ (after review) | ✅ | ✅ |
| **Developer** | ✅ (PR required) | ❌ (Dashboard change request) | ❌ | ✅ |
| **QA / Designer** | ❌ | ❌ | ❌ | ✅ |

Dashboard access for targeting rule changes follows **least privilege**: only platform admins and senior developers can modify production targeting rules. This prevents accidental exposure of incomplete features.

### 8.2 Kill Switch Access

Kill switches (`ops/*` flags) are special. In an incident, any on‑call engineer must be able to toggle them. Vercel Dashboard access is granted to the on‑call rotation via team membership. Every kill switch must be **tested quarterly** — a flag that is never exercised is a flag whose "off" path may be broken.

### 8.3 Annual Flag Audit

Each January, the platform team:
1. Lists every active flag (code + Dashboard).
2. Identifies flags not evaluated in the last 90 days (orphaned).
3. Identifies flag values in Dashboard that don't match any code reference (stale).
4. Opens removal PRs for all eligible flags.
5. Publishes a "flag health" report: total active, removed this year, average lifespan.

---

## 9. Environment Variables

Vercel automatically sets these per environment — no developer action required:

| Variable | Purpose | Environment |
|---|---|---|
| `FLAGS` | Connection string identifying the Vercel Flags project | Production, Preview, Development (different values) |
| `FLAGS_SECRET` | Secret key for Flags Explorer secure overrides | Production, Preview, Development |

When you create your first flag in the Vercel Dashboard, these variables are automatically added to your Vercel project.

---

## 10. Quick Reference

| Task | How |
|---|---|
| **Create a flag** | Add `flag()` to `packages/firm-flags/src/flags.ts` + open PR |
| **Roll out a flag** | Change targeting % in Vercel Dashboard (no deploy needed) |
| **Kill a broken feature** | Toggle `ops/*` flag to `true` (disabled) in Dashboard |
| **Test a flag locally** | Toggle in Vercel Toolbar → Flags Explorer |
| **See all active flags** | `grep -r 'flag(' packages/firm-flags/src/` |
| **Remove a flag** | Follow the § 4.4 removal checklist |
| **Check flag age** | Run `pnpm flags:report` (lists all flags with age and owner) |
| **Override flag in CI** | Set `FLAGS` to a custom Edge Config ID for E2E tests |

---

*Related: [frontend.md](../core/frontend.md), [ci-cd.md](../development/ci-cd.md), [deployment.md](../infrastructure/deployment.md), [api.md](../integrations/api.md), [ai.md](../integrations/ai.md)*