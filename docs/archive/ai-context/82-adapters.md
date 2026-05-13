# Adapter Interfaces & Contracts

**For AI coding agents.** This file defines the exact interfaces that every adapter package in `packages/adapters-*` must implement. CI enforces compliance via `scripts/validate-adapters.ts`.

---

## Base Adapter Requirements

Every adapter MUST:
- Accept a `tenantId` parameter for all operations.
- Emit Prometheus metrics: `adapter_operation_duration_seconds` (histogram) and `adapter_errors_total` (counter).
- Log all errors using the structured logger from `firm-observability`.
- For webhooks, provide an HMAC signature verification function using a constant-time comparison.

---

## CRM Adapter Interface (`adapters-crm-*`)

```typescript
interface CRMAdapter {
  syncLead(lead: Lead, tenantId: string): Promise<SyncResult>;
  getContact(email: string): Promise<Contact | null>;
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean;
}
```

---

## Email Adapter Interface (`adapters-email-*`)

```typescript
interface EmailAdapter {
  sendEmail(payload: EmailPayload): Promise<SendResult>;
  verifyDomain(domain: string): Promise<boolean>;
}
```

---

## Analytics Adapter Interface (`adapters-analytics-*`)

```typescript
interface AnalyticsAdapter {
  trackEvent(event: AnalyticsEvent): Promise<void>;
  identifyUser(userId: string, traits?: Record<string, unknown>): Promise<void>;
}
```

---

## AI Adapter Interface (`adapters-ai-*`)

```typescript
interface AIAdapter {
  generateContent(prompt: string | ChatMessage[], options: AIOptions, tenantId: string): Promise<AIResponse>;
  embeddings(text: string, tenantId: string): Promise<number[]>;
  enforceTokenBudget(tokens: number, tenantId: string): Promise<boolean>;
}
```

---

## Storage Adapter Interface (`adapters-storage-*`)

```typescript
interface StorageAdapter {
  upload(file: File | Buffer, key: string, tenantId: string): Promise<UploadResult>;
  download(key: string, tenantId: string): Promise<Buffer>;
  delete(key: string, tenantId: string): Promise<boolean>;
}
```

---

## Billing Adapter Interface (`adapters-billing-*`)

```typescript
interface BillingAdapter {
  upsertSubscription(subscription: Subscription, tenantId: string): Promise<SubscriptionResult>;
  recordUsage(usage: UsageData, tenantId: string): Promise<UsageResult>;
  processWebhook(event: BillingEvent, signature: string, tenantId: string): Promise<WebhookResult>;
}
```

---

## ECAPI Adapter Interface (`adapters-ecapi-*`)

```typescript
interface ECAPIAdapter {
  syncProducts(products: Product[], tenantId: string): Promise<SyncResult>;
  processWebhook(event: ECAPIEvent, signature: string, tenantId: string): Promise<WebhookResult>;
}
```

---

## Webhook Security Requirements (applies to all adapters that process webhooks)

Every webhook-capable adapter **must** implement:

```typescript
// Signature verification – constant-time comparison
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean;

// Replay protection – reject webhooks older than 5 minutes
function preventReplay(timestamp: number, nonce: string, tenantId: string): Promise<boolean>;

// Idempotency – store and check idempotencyKey with a unique constraint
function enforceIdempotency<T>(idempotencyKey: string, operation: () => Promise<T>): Promise<T>;
```

---

*See `docs/ai-context/86-security.md` for the full security baseline and `docs/stack/api.md` for webhook integration patterns.*