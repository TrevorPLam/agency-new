# `firm-consent` — Package Planning Document

**GDPR/CCPA Consent Lifecycle · GPC Enforcement · Structural Rendering Gate · Immutable Audit Trail**

---

## 0. Purpose & Architectural Position

`firm-consent` is the **sole authority on user consent** within the platform. It defines consent categories, enforces the consent lifecycle, listens for Global Privacy Control (`Sec‑GPC`) signals, provides a structural gate that prevents scripts and data collection from firing without consent, and logs every consent action immutably.

It contains **no UI** — only logic, hooks, and utilities. The consent banner, preference panels, and cookie declarations are built in `firm-ui` and feature packages using this package’s primitives.

**Layer placement:** Layer 3 (Identity, Security & Consent), Wave 4 — built after `firm-auth`. Dependencies:
- `firm-types` – `ConsentCategory`, `ConsentPurpose`, `TenantId`, branded IDs
- `firm-db` – consent records table, RLS‑scoped queries
- `firm-cache` – Redis for fast consent lookups (tenant‑scoped)
- `firm-logger` – immutable audit logging
- `firm-env` – GDPR/CCPA compliance mode flags (optional)
- `firm-errors` – consent‑specific errors

**What it owns:**

| Domain | Mechanism |
|---|---|
| Consent categories | Enum of categories (`necessary`, `analytics`, `marketing`, etc.) |
| Purpose definitions | Machine‑readable descriptions, retention periods, legal bases |
| Consent lifecycle | `grant`, `deny`, `withdraw`, `expire`, `renew` — transitions |
| Consent storage | Tenant‑scoped, user‑identified or device‑fingerprinted consent records |
| GPC enforcement | `Sec‑GPC` header / `navigator.globalPrivacyControl` forces analytics/marketing denial; banner cannot override |
| Structural rendering gate | `requireConsent(category)` hook / function — must return `true` before any script, pixel, or server‑side event fires |
| Audit trail | Every consent event is logged immutably |

---

## 1. Immutable Rules

| Rule | Rationale |
|---|---|
| **Consent is a structural gate, not a UI preference.** Unconsented categories are never loaded — no script, pixel, or tracking event fires. | Prevents race conditions where scripts load before consent decision. |
| **Global Privacy Control (`Sec‑GPC`) forces marketing and analytics denial.** Banner cannot override it; the user’s browser‑wide signal is always honoured. | GDPR/CCPA alignment. GPC is a legal opt‑out, not a suggestion. |
| **All consent changes are logged immutably.** | Complete audit trail for compliance. |
| **Consent records are tenant‑scoped and user‑identifiable where possible; anonymous device consent is supported via a persistent anonymous ID.** | Both authenticated and unauthenticated users are covered. |
| **Necessary cookies cannot be rejected.** The `necessary` category is always granted. | “Strictly necessary” means the site cannot function without them; consent is implied by using the service. |
| **Consent expires after a configurable period (default 12 months).** Users must re‑consent after expiry. | GDPR transparency principle. |
| **No vendor‑specific consent strings are stored.** Only high‑level category consent; vendor mapping is handled by tag governance in `firm‑security`. | Efficient storage; single source of truth. |
| **`exports` field is the sole contract boundary.** No internal implementation detail leaked. | |
| **Named exports only. No default exports.** | |

---

## 2. Consent Categories & Purposes

```typescript
// packages/firm-consent/src/categories.ts
import { z } from 'zod';

export const ConsentCategory = {
  NECESSARY:   'necessary',
  ANALYTICS:   'analytics',
  MARKETING:   'marketing',
  FUNCTIONAL:  'functional', // e.g., chat widget, personalisation
} as const;

export type ConsentCategory = typeof ConsentCategory[keyof typeof ConsentCategory];

export const ConsentPurpose = {
  [ConsentCategory.NECESSARY]: {
    displayName: 'Strictly Necessary',
    description: 'Required for the website to function. Cannot be disabled.',
    retention: 'session',
    legalBasis: 'legitimate_interest',
  },
  [ConsentCategory.ANALYTICS]: {
    displayName: 'Analytics & Performance',
    description: 'Help us understand how visitors interact with the website.',
    retention: '24 months',
    legalBasis: 'consent',
  },
  [ConsentCategory.MARKETING]: {
    displayName: 'Marketing & Advertising',
    description: 'Used to deliver relevant ads and measure campaign effectiveness.',
    retention: '12 months',
    legalBasis: 'consent',
  },
  [ConsentCategory.FUNCTIONAL]: {
    displayName: 'Functional & Personalisation',
    description: 'Enable enhanced functionality like chat, personalised content.',
    retention: '12 months',
    legalBasis: 'consent',
  },
} as const satisfies Record<ConsentCategory, PurposeDefinition>;
```

**Necessary** is always granted; the `deny` transition for `necessary` throws an error.

---

## 3. Consent Lifecycle & Storage

### 3.1 Consent Record

Stored in `firm‑db` as:

```sql
CREATE TABLE consent_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id),
    user_id uuid REFERENCES users(id),       -- null if anonymous
    anonymous_id text,                       -- device fingerprint / cookie
    category text NOT NULL,
    status text NOT NULL CHECK (status IN ('granted','denied')),
    granted_at timestamptz,
    expires_at timestamptz,
    proof text,                              -- consent receipt hash
    gpc_override boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

Unique constraint per (tenant_id, user_id, anonymous_id, category) to prevent duplicates.

### 3.2 Lifecycle Operations

```typescript
// packages/firm-consent/src/consent-manager.ts
export class ConsentManager {
  constructor(
    private tenantId: TenantId,
    private userId?: UserId,
    private anonymousId?: string, // device fingerprint
  ) {}

  async grant(category: ConsentCategory, proof?: Record<string, unknown>): Promise<void>;
  async deny(category: ConsentCategory, proof?: Record<string, unknown>): Promise<void>;
  async withdraw(category: ConsentCategory): Promise<void>; // same as deny
  async isGranted(category: ConsentCategory): Promise<boolean>;
  async getCategories(): Promise<Record<ConsentCategory, boolean>>;
}
```

- **`grant`**: Sets status to `granted`, records timestamp, sets expiry (default 12 months), computes proof hash if provided, logs audit.
- **`deny`/`withdraw`**: Sets status to `denied`, logs audit.
- **`isGranted`** checks cache first, then DB; also verifies expiry and GPC override.
- **`getCategories`** returns a map of all categories and whether they are currently granted.

### 3.3 Cache Strategy

Consent decisions are cached in Redis (tenant‑scoped) with TTL matching expiry. Incoming request checks:

1. `Sec‑GPC` header or `navigator.globalPrivacyControl` → forces `analytics` and `marketing` denial.
2. If GPC is active, return denied regardless of stored consent.
3. If GPC not active, return cached consent; on miss, fetch from DB and cache.

---

## 4. Global Privacy Control (GPC) Enforcement

GPC is signalled via:
- **HTTP header**: `Sec-GPC: 1`
- **JavaScript API**: `navigator.globalPrivacyControl === true`

`firm-consent` provides a `isGpcEnabled(request?)` function that checks both. When GPC is active, any call to `isGranted('analytics')` or `isGranted('marketing')` automatically returns `false`. The consent banner must not offer opt‑in for those categories when GPC is active, but the banner UI logic lives in `firm-ui`. `firm-consent` exposes a hook `useGpcStatus()` returning `boolean` for UI adaptation.

---

## 5. Structural Rendering Gate

### 5.1 Server‑Side Gate (`consentGate`)

A pure function that checks consent before executing any tracking or script injection:

```typescript
export function consentGate(
  category: ConsentCategory,
  consentManager: ConsentManager,
  action: () => Promise<void>,
): Promise<void> {
  return consentManager.isGranted(category).then(async (granted) => {
    if (granted) {
      await action();
    } else {
      // Optionally log a "blocked" event (non‑PII)
      logger.info('consent.blocked', { category });
    }
  });
}
```

Used by server components, API routes, and background workers before emitting analytics events, serving marketing pixels, etc.

### 5.2 React Hook (`useConsentGate`)

For client components, a custom hook prevents rendering of scripts/tracking components:

```typescript
export function useConsentGate(category: ConsentCategory): boolean {
  const [granted, setGranted] = useState(false);
  const { tenantId, userId, anonymousId } = useConsentContext();

  useEffect(() => {
    const manager = getConsentManager(tenantId, userId, anonymousId);
    manager.isGranted(category).then(setGranted);
  }, [category, tenantId, userId, anonymousId]);

  return granted;
}
```

Components that inject third‑party scripts (e.g., Google Analytics, Facebook Pixel) must be guarded:

```tsx
// In firm-ui or feature package
import { useConsentGate } from 'firm-consent';

export function GoogleAnalyticsScript() {
  const consent = useConsentGate('analytics');
  if (!consent) return null;
  return <Script src="https://www.googletagmanager.com/gtag/js?id=..." strategy="afterInteractive" />;
}
```

### 5.3 The Consent Context

A React context provides the current tenant/user/anonymous ID to the consent hooks. It is populated by the app’s root layout from the `proxy.ts` headers or session.

```typescript
// packages/firm-consent/src/context.tsx
export const ConsentProvider: React.FC<{ children: ReactNode; tenantId: TenantId; userId?: UserId; anonymousId?: string }>;
export function useConsentContext(): ConsentContextValue;
```

---

## 6. Consent Audit Logging

Every consent state change is logged immutably via `firm-logger`:

```typescript
// packages/firm-consent/src/audit.ts
import { logger } from 'firm-logger';
import type { TenantId, UserId, ConsentCategory } from 'firm-types';

export function logConsentEvent(event: {
  type: 'granted' | 'denied' | 'withdrawn' | 'expired' | 'gpc_override';
  tenantId: TenantId;
  userId?: UserId;
  anonymousId?: string;
  category: ConsentCategory;
  proof?: string; // hash
}) {
  logger.info('consent.event', { ...event, immutable: true });
}
```

These logs are streamed to the compliance archive (part of the observability sink).

---

## 7. Consent Banner Contract (for UI)

`firm-consent` does **not** render a banner. It exposes the necessary state and handlers for any consent UI to drive it:

```typescript
export interface ConsentUiContract {
  categories: { key: ConsentCategory; name: string; description: string; required: boolean }[];
  currentConsent: Record<ConsentCategory, boolean>;
  gpcEnabled: boolean;
  grantAll: () => Promise<void>;
  denyAll: () => Promise<void>;
  toggleCategory: (category: ConsentCategory, grant: boolean) => Promise<void>;
}
```

A React hook `useConsentUi()` returns this contract; the banner component (in `firm-ui` or feature) consumes it.

---

## 8. Module Inventory

```
packages/firm-consent/
├── src/
│   ├── index.ts                    # Public API
│   ├── categories.ts               # ConsentCategory, purpose definitions
│   ├── consent-manager.ts          # ConsentManager class
│   ├── store.ts                    # Database and cache interaction
│   ├── gpc.ts                      # isGpcEnabled (server & client)
│   ├── gate.ts                     # consentGate, useConsentGate
│   ├── context.tsx                 # ConsentProvider, useConsentContext
│   ├── ui-contract.ts              # useConsentUi hook (for banner)
│   ├── audit.ts                    # logConsentEvent
│   └── types.ts                    # ConsentRecord, ConsentStatus
├── tests/
│   ├── consent-manager.test.ts
│   ├── store.test.ts
│   ├── gpc.test.ts
│   ├── gate.test.ts
│   └── audit.test.ts
├── package.json
├── README.md
└── CHANGELOG.md
```

---

## 9. Key Patterns

### 9.1 Multi‑Identifier Consent

A user may have consent records both as an authenticated user (`user_id`) and as an anonymous device fingerprint (`anonymous_id`). When resolving consent for an authenticated session, the user‑level consent takes precedence; otherwise the anonymous consent is used. The `ConsentManager` constructor accepts both; lookup order is `user_id` first, then `anonymous_id`.

```typescript
const manager = new ConsentManager(tenantId, session?.userId, getAnonymousId(request));
```

### 9.2 GPC Override on Grant

If GPC is active, `grant('analytics')` throws a `ConsentBlockedError`. UI should disable the toggle for those categories.

### 9.3 Consent Expiry

A cron job (in a worker) or a server‑side check invalidates expired consent records. On next request, `isGranted` re‑evaluates expiry and automatically returns `false`. Users must re‑consent.

---

## 10. Package Configuration

### 10.1 `package.json`

```jsonc
{
  "name": "firm-consent",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts --sourcemap",
    "typecheck": "tsc --build --noEmit",
    "lint": "eslint src/ tests/",
    "test": "vitest run --coverage"
  },
  "dependencies": {
    "firm-types": "workspace:*",
    "firm-db": "workspace:*",
    "firm-cache": "workspace:*",
    "firm-logger": "workspace:*",
    "firm-env": "workspace:*",
    "firm-errors": "workspace:*",
    "react": "^19.2.6" // peer dependency for hooks, but optional?
  },
  "devDependencies": {
    "firm-config-typescript": "workspace:*",
    "firm-config-eslint": "workspace:*",
    "tsup": "catalog:",
    "vitest": "catalog:",
    "typescript": "catalog:",
    "@types/react": "^19.0.0"
  },
  "peerDependencies": {
    "react": "^19.2.6"
  },
  "sideEffects": false
}
```

**Note:** The `react` dependency is for hooks and context. For non‑React consumers, the `ConsentManager` class and `consentGate` function are pure TypeScript and don’t require React.

### 10.2 `tsconfig.json`

```jsonc
{
  "extends": "firm-config-typescript/base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "tsBuildInfoFile": "./dist/.tsbuildinfo",
    "jsx": "react-jsx" // needed for the context provider
  },
  "include": ["src", "tests"],
  "exclude": ["dist", "node_modules"],
  "references": [
    { "path": "../firm-types" },
    { "path": "../firm-db" },
    { "path": "../firm-cache" },
    { "path": "../firm-logger" },
    { "path": "../firm-env" },
    { "path": "../firm-errors" }
  ]
}
```

---

## 11. Test Strategy

| Suite | Key Tests |
|---|---|
| ConsentManager | grant/deny/withdraw lifecycle, GPC blocking, expiry, cache retrieval |
| Store (DB+Cache) | Writing consent record, reading from cache, DB fallback, unique constraint |
| GPC | HTTP header parsing, JS detection, server vs client, forced denial |
| Gate | `consentGate` executes action only if granted, `useConsentGate` returns correct boolean |
| Audit | Events logged with correct structure |
| UI Contract | `useConsentUi` generates correct state and handlers |

Integration tests use a real database and Redis instance in CI.

---

## 12. Consumer Patterns

### 12.1 Server‑side analytics protection

```typescript
import { consentGate, ConsentManager } from 'firm-consent';

await consentGate('analytics', manager, async () => {
  analytics.track('page_view', { ... });
});
```

### 12.2 Client script gate

```tsx
import { useConsentGate } from 'firm-consent';

const allowed = useConsentGate('analytics');
if (allowed) return <AnalyticsScript />;
return null;
```

### 12.3 Consent Banner (in `firm-ui`)

```tsx
import { useConsentUi } from 'firm-consent';

export function ConsentBanner() {
  const ui = useConsentUi();
  if (ui.currentConsent.necessary) return null; // already consented (or implied)
  return (
    <div>
      <h2>Cookie Preferences</h2>
      <ul>
        {ui.categories.map(cat => (
          <li key={cat.key}>
            <label>
              <input
                type="checkbox"
                checked={ui.currentConsent[cat.key]}
                disabled={cat.required || ui.gpcEnabled && (cat.key === 'analytics' || cat.key === 'marketing')}
                onChange={e => ui.toggleCategory(cat.key, e.target.checked)}
              />
              {cat.name}
            </label>
          </li>
        ))}
      </ul>
      <button onClick={ui.grantAll}>Accept All</button>
      <button onClick={ui.denyAll}>Reject All</button>
    </div>
  );
}
```

---

## 13. Build Order & Dependency Map

```
firm-types → firm-validators → firm-api-contracts → firm-db → firm-cache
                                                          ↓
firm-env, firm-errors, firm-logger ───────────────────────→ firm-security → firm-auth
                                                                              ↓
                                                                         firm-consent
```

`firm-consent` depends on `firm-db`, `firm-cache`, `firm-logger`, `firm-env`, `firm-errors`, and `firm-types`. It also indirectly depends on `firm-security` for tag governance, but that dependency is not direct.

---

## 14. Interface Freeze & Governance

- After Wave 4, consent categories and purpose definitions are frozen. Adding a new category is minor; removing a category is major.
- The `ConsentManager` interface is frozen.
- The rendering gate contract (`consentGate`, `useConsentGate`) is frozen.
- GPC enforcement logic cannot be loosened.
- CI checks that no analytics or marketing script loads without passing through a consent gate (static analysis / lint rule).

---

## 15. Documentation Requirements

- **README.md**: Consent architecture, category reference, GPC behavior, integration guide for banners, server‑side and client‑side usage.
- **TSDoc** on all public APIs.

---

## 16. Next Package

After `firm-consent`, the next package in Layer 4 (Observability & Health) is **`firm-observability`** — structured logging, distributed tracing, metrics, error tracking.

---

## References

- [Global Privacy Control (GPC)](https://globalprivacycontrol.org/)
- [GDPR Consent Guidelines](https://gdpr.eu/cookies/)
- [CCPA/CPRA Opt‑Out Signals](https://oag.ca.gov/privacy/ccpa)
- [IAB Transparency & Consent Framework](https://iabeurope.eu/transparency-consent-framework/)