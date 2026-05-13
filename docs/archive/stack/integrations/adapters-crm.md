# `adapters-crm` — Package Planning Document

**CRM Adapter Interface · Provider Implementations (GoHighLevel, HubSpot, Salesforce, Pipedrive, Zoho) · Standardised Structure · Webhook Verification · Prometheus Metrics · Error Mapping**

---

## 0. Purpose & Architectural Position

`adapters-crm` is the **pluggable CRM integration layer**. It implements the `CRMAdapter` interface defined in `firm-types`, providing provider‑specific logic for GoHighLevel, HubSpot, Salesforce, Pipedrive, Zoho, and future CRMs. No feature package or application directly imports a CRM SDK; they always go through the adapter interface.

It belongs to **Layer 7 (Adapters)** — the outermost layer, depending only on lower layers and **never** on UI or feature packages. It depends on:
- `firm-types` – `CRMAdapter` interface, `Lead`, `SyncResult`, branded IDs
- `firm-validators` – incoming webhook payload validation
- `firm-api-contracts` – event definitions (`lead.synced`, `lead.sync-failed`)
- `firm-observability` – logging, tracing, metrics
- `firm-env` – provider API keys and secrets
- `firm-errors` – typed error mapping

**What it owns:**

| Domain | Mechanism |
|---|---|
| Interface implementation | Each provider exports a class implementing `CRMAdapter` |
| Lazy client initialization | Clients connect on first use, not at import time |
| Transform functions | Provider‑specific ↔ platform canonical `Lead` shape |
| Webhook signature verification | Constant‑time HMAC comparison, raw body only |
| Standard Prometheus metrics | `crm_sync_calls_total`, `crm_sync_duration_seconds`, `crm_sync_errors_total` |
| Provider error mapping | Third‑party error → `FirmError` subtypes |
| Dead‑letter queue handling | Failed syncs go to Inngest dead‑letter queue for manual review |

---

## 1. Immutable Rules

| Rule | Rationale |
|---|---|
| **All adapters implement the `CRMAdapter` interface from `firm-types`.** No provider‑specific shapes leak to feature packages. | Enables swapping providers without changing business code. |
| **Credentials come exclusively from environment variables.** No hardcoded keys, no config files. | Security; works across all environments. |
| **Webhook signature verification is constant‑time.** Uses `crypto.timingSafeEqual` or equivalent. | Prevents timing attacks. |
| **Webhook processing order is non‑negotiable:** verify signature (raw body) → check idempotency → process → return 200 for duplicates. | Same as all webhook handlers. |
| **Adapters depend only on Layers 0, 1, 2, 4.** No UI, no feature packages, no business logic. | Keeps them independent and testable. |
| **Every adapter exposes standard Prometheus metrics.** | Uniform observability. |
| **No default exports. Named exports only.** | |
| **`exports` field is the contract boundary.** | |
| **Provider errors are mapped to `FirmError` subtypes — never thrown raw.** | Consistent error handling upstream. |

---

## 2. CRMAdapter Interface (from `firm-types`)

```typescript
// Already defined in firm-types/src/adapters.ts
export interface CRMAdapter {
  readonly providerName: string;

  // Sync a single lead; returns external ID or error
  syncLead(tenantId: TenantId, lead: Lead): Promise<SyncResult>;

  // Bulk sync for imports
  syncLeads(tenantId: TenantId, leads: Lead[]): Promise<SyncResult[]>;

  // Get lead by external ID
  getLead(tenantId: TenantId, externalId: string): Promise<Lead | null>;

  // Delete lead (for GDPR erasure)
  deleteLead(tenantId: TenantId, externalId: string): Promise<void>;

  // Webhook signature verification (provider‑specific)
  verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean;

  // Transform from provider-specific webhook payload to platform Lead shape
  parseWebhookPayload(rawBody: string, tenantId: TenantId): Promise<Lead>;
}
```

All adapter public methods match this interface.

---

## 3. Provider Implementations

### 3.1 GoHighLevel

- **Package:** `adapters-crm/gohighlevel`
- **Client:** Official GoHighLevel API v2 (REST).
- **Webhook signature:** HMAC‑SHA256 of raw body with a secret token; constant‑time check.
- **Transform:** Maps GoHighLevel `contact` to platform `Lead`, preserving custom fields.
- **Special considerations:** GoHighLevel supports custom fields; mapping is configurable per tenant (via `firm-config` tenant settings).
- **Metrics:** Label `provider=gohighlevel`.

### 3.2 HubSpot

- **Package:** `adapters-crm/hubspot`
- **Client:** `@hubspot/api-client` v12+.
- **Webhook signature:** HubSpot uses signature v2 (HMAC‑SHA256 of request body + timestamp + secret).
- **Transform:** HubSpot `Contact` → `Lead`; handles `hs_lead_status` and `lifecyclestage`.
- **Special considerations:** Rate limiting with built‑in retry; HubSpot API v4 is in beta; adapter may need updating.

### 3.3 Salesforce

- **Package:** `adapters-crm/salesforce`
- **Client:** `jsforce` v1.x.
- **Webhook signature:** Salesforce Outbound Messages use a custom XML format; adapter validates the certificate chain and XML signature.
- **Transform:** Salesforce `Lead` object → platform `Lead`.
- **Special considerations:** OAuth2 flow with refresh tokens; connection pooling.

### 3.4 Pipedrive

- **Package:** `adapters-crm/pipedrive`
- **Client:** `pipedrive` npm package v24+.
- **Webhook signature:** Pipedrive uses a simple token validation.
- **Transform:** Pipedrive `Person` → platform `Lead`.

### 3.5 Zoho CRM

- **Package:** `adapters-crm/zoho`
- **Client:** Zoho REST API v2.1 (OAuth2 with grant token).
- **Webhook signature:** Zoho uses HMAC‑SHA256 of the JSON body with a shared secret.
- **Transform:** Zoho `Leads` module → platform `Lead`.

All providers share the same interface; adding a new CRM is a matter of creating a new subfolder, implementing the interface, and registering the adapter.

---

## 4. Standard Adapter Structure

Each provider adapter follows this internal layout:

```
adapters-crm/gohighlevel/
├── index.ts             # Named export: new GoHighLevelCRMAdapter(options)
├── client.ts            # Lazy singleton client initialisation
├── sync-lead.ts         # Core sync logic
├── transform.ts         # Provider ←→ platform type transforms
├── webhook.ts           # verifyWebhookSignature, parseWebhookPayload
├── errors.ts            # Provider error → FirmError mapping
└── metrics.ts           # Prometheus metric definitions
```

### 4.1 Lazy Client Initialization

```typescript
let client: GoHighLevelClient | null = null;
function getClient(): GoHighLevelClient {
  if (!client) {
    const apiKey = process.env.GOHIGHLEVEL_API_KEY!;
    client = new GoHighLevelClient({ apiKey });
  }
  return client;
}
```

### 4.2 Transform Functions

```typescript
// adapters-crm/gohighlevel/transform.ts
export function toPlatformLead(ghlContact: GHLContact, tenantId: TenantId): Lead {
  return {
    id: asLeadId(crypto.randomUUID()),
    tenantId,
    email: ghlContact.email,
    firstName: ghlContact.firstName,
    lastName: ghlContact.lastName,
    phone: ghlContact.phone,
    source: mapSource(ghlContact.source),
    status: mapStatus(ghlContact.status),
    // ... other fields
  };
}
```

### 4.3 Webhook Verification (GoHighLevel example)

```typescript
export function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

### 4.4 Error Mapping

```typescript
export function mapError(error: unknown): FirmError {
  if (error instanceof GoHighLevelAPIError) {
    if (error.status === 429) return new RateLimitExceededError(error.message);
    if (error.status === 401) return new AuthenticationError('GoHighLevel API key invalid');
    // ...
  }
  return new AdapterSyncError('Unknown GoHighLevel error', { originalError: error });
}
```

---

## 5. Metrics

All adapters must expose:

- `crm_sync_calls_total{provider, status}` — counter
- `crm_sync_duration_seconds{provider}` — histogram
- `crm_sync_errors_total{provider, error_type}` — counter

These are registered at import time and used throughout the adapter.

---

## 6. Module Inventory

```
packages/adapters-crm/
├── src/
│   ├── index.ts                   # Re‑exports all provider adapters
│   ├── gohighlevel/
│   │   ├── index.ts
│   │   ├── client.ts
│   │   ├── sync-lead.ts
│   │   ├── transform.ts
│   │   ├── webhook.ts
│   │   ├── errors.ts
│   │   └── metrics.ts
│   ├── hubspot/
│   │   └── ...
│   ├── salesforce/
│   │   └── ...
│   ├── pipedrive/
│   │   └── ...
│   ├── zoho/
│   │   └── ...
│   └── types.ts                   # Shared adapter types (SyncOptions, etc.)
├── tests/
│   ├── gohighlevel/
│   ├── hubspot/
│   └── ...
├── package.json
├── README.md
└── CHANGELOG.md
```

---

## 7. Package Configuration

### 7.1 `package.json`

```jsonc
{
  "name": "adapters-crm",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./gohighlevel": "./src/gohighlevel/index.ts",
    "./hubspot": "./src/hubspot/index.ts",
    "./salesforce": "./src/salesforce/index.ts",
    "./pipedrive": "./src/pipedrive/index.ts",
    "./zoho": "./src/zoho/index.ts"
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
    "firm-observability": "workspace:*",
    "firm-env": "workspace:*",
    "firm-errors": "workspace:*",
    "go-highlevel": "^2.0.0",       // example specific
    "@hubspot/api-client": "^12.0.0",
    "jsforce": "^1.12.0",
    "pipedrive": "^24.0.0",
    "uuid": "catalog:"
  },
  "devDependencies": {
    "firm-config-typescript": "workspace:*",
    "firm-config-eslint": "workspace:*",
    "tsup": "catalog:",
    "vitest": "catalog:",
    "typescript": "catalog:",
    "nock": "catalog:" // for HTTP mocking
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
    { "path": "../firm-observability" },
    { "path": "../firm-env" },
    { "path": "../firm-errors" }
  ]
}
```

---

## 8. Test Strategy

| Suite | Key Tests |
|---|---|
| Interface compliance | Every provider adapter passes a shared test suite that verifies all `CRMAdapter` methods exist and behave correctly |
| Sync | With mocked HTTP, successful sync returns external ID; handles errors and maps to `FirmError` |
| Transform | Edge cases: missing fields, unexpected values, custom field mapping |
| Webhook | Signature verification (valid, invalid, tampered), raw body used exclusively; parsing of incoming payloads |
| Metrics | Counters increment on success/failure, histogram records duration |
| Error mapping | Known API errors → correct `FirmError` subtypes |

Integration tests use mocked HTTP endpoints (nock).

---

## 9. Build Order & Dependency Map

```
firm-types, firm-validators, firm-api-contracts, firm-observability, firm-env, firm-errors
                                     ↓
                               adapters-crm
                                     ↓
                           firm-feature-crm (Layer 6)
```

Adapters are built before feature packages that use them, but they often develop in parallel once the interface is stable.

---

## 10. Interface Freeze & Governance

- The `CRMAdapter` interface is defined in `firm-types` and frozen after Wave 3. Adapters must implement it fully; any addition requires a minor version bump in `firm-types` and corresponding updates in all providers.
- Provider‑specific logic is isolated; removing a provider is a minor change (deprecating first).
- Webhook signature verification must remain constant‑time; any change is a critical review.
- All adapter changes require integration tests with mocked provider APIs.

---

## 11. Documentation Requirements

- **README.md**: Overview of all providers, setup instructions (env vars), webhook configuration guide, metric reference.
- **TSDoc** on all public classes and functions.

---

## 12. Next Package

After `adapters-crm`, the next adapter package could be **`adapters-email`** (Email sending via Resend, Postmark, SendGrid) to support `firm-feature-crm`'s email triggers, or **`adapters-ai`** for AI model integration (OpenAI, Anthropic). However, the user may have a specific sequence; we'll await further prompts.

---

## References

- [GoHighLevel API Documentation](https://developers.gohighlevel.com/)
- [HubSpot API Webhooks](https://developers.hubspot.com/docs/api/webhooks)
- [Salesforce Outbound Messages](https://developer.salesforce.com/docs/atlas.en-us.api.meta/api/sforce_api_om_outboundmessaging.htm)
- [Pipedrive API](https://developers.pipedrive.com/docs/api/v1)
- [Zoho CRM API](https://www.zoho.com/crm/developer/docs/api/v2/)