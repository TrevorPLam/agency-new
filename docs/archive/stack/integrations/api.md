# API & Service Design – How We Build APIs in This Monorepo

This guide covers our internal and external API strategy, contract sharing, error handling, rate limiting, and service communication. For paradigm comparisons, see the archived research.

---

## 1. API Paradigm: Hybrid

We use two paradigms, each where it excels:

| Interface                         | Technology                     | Scope                                           |
| -------------------------------- | ------------------------------ | ----------------------------------------------- |
| Internal TypeScript communication| tRPC v11                       | All Next.js apps ↔ backend services             |
| External / public / webhooks     | REST + OpenAPI 3.1 (code‑first)| Third‑party integrations, public APIs, webhooks |

---

## 2. Internal APIs: tRPC v11

tRPC provides end‑to‑end type safety without code generation. All procedures are defined in `packages/firm-api` using routers that import schemas from `@firm/api-contracts`.

### Key Features We Use

- **`useSuspenseQuery`** as the default client hook (cleaner loading states).
- **Server‑side caller** (`createCallerFactory`) for zero‑overhead RSC data fetching.
- **FormData support** – call mutations directly from `<form action={}>` without a client component.
- **Subscriptions via async generators** – real‑time features use SSE transport.
- **OpenAPI generation** – `@trpc/openapi` exports an OpenAPI spec from our tRPC routers (useful for documentation and external consumption).

```typescript
// Example: server-side caller in a RSC
const caller = createCallerFactory()(appRouter)(await createTRPCContext());
const leads = await caller.leads.list({ limit: 20 });
```

### Context & Middleware

- tRPC context carries `userId`, `tenantId`, and database connection.
- Protected procedures enforce authentication and tenant scoping via middleware.

---

## 3. External APIs: REST + OpenAPI 3.1

Public endpoints are implemented as Next.js Route Handlers (`app/api/.../route.ts`). We follow a **code‑first** approach: Zod schemas define the contract, and OpenAPI specs are generated from them.

**Toolchain:**
- Zod schemas in `@firm/api-contracts`.
- `@hono/zod-openapi` or `trpc-to-openapi` generates the OpenAPI document.
- `@asteasolutions/zod-to-openapi` v8 for Zod v4.
- Scalar UI renders the documentation at `docs.[agency-domain].com/api/`.

### Versioning

- **URI path versioning**: `/api/v1/leads`, `/api/v2/leads`.
- Deprecated endpoints return `Deprecation`, `Sunset`, and `Link` headers (RFC 8594 / RFC 9745).
- 12‑month deprecation window; never support more than three versions simultaneously.

---

## 4. Shared API Contracts (`@firm/api-contracts`)

All request and response shapes are defined as Zod schemas in a single shared package. This is the **single source of truth** for:

- tRPC procedure inputs/outputs
- REST route schemas
- Inngest event payloads (via `EVENT_REGISTRY`)
- OpenAPI definitions

No backend or frontend duplicates a validation rule.

---

## 5. Error Handling (RFC 9457 Problem Details)

All API errors follow the RFC 9457 Problem Details format:

```json
{
  "type": "https://api.agency.com/errors/validation-failed",
  "title": "Validation Failed",
  "status": 400,
  "detail": "The 'email' field must be a valid email address.",
  "instance": "/api/v1/leads",
  "traceId": "abc123"
}
```

The shared `@firm/error-handler` package provides middleware that transforms thrown `FirmError` instances into RFC 9457 responses, both for tRPC and REST endpoints.

---

## 6. Rate Limiting & Abuse Prevention

We use **Arcjet v1.0** for application‑layer protection. A single `protect()` call includes:

- Rate limiting (token bucket, per‑IP, per‑user, per‑tenant)
- Bot detection
- WAF (OWASP Top 10)
- Email validation and sign‑up form protection
- Prompt injection detection (for AI endpoints)
- API key validation and rate limiting for public REST endpoints

Rate limit rules are version‑controlled as code and deployed via `firm-security`.

---

## 7. Multi‑Tenant API Gateway

The API gateway is a **logical composite** implemented by combining:

### Gateway Components

- **`proxy.ts` / `middleware.ts`** – Edge-side request interceptor that resolves tenant context and performs early-stage rejection
- **Arcjet v1.0** – Rate limiting, WAF, and bot detection integrated into Next.js route handlers
- **`@firm/auth/middleware`** – Authentication validation and credential isolation
- **tRPC context middleware** – Role-based access control and per-tenant policy enforcement

### Enforcement Capabilities

- **Per‑tenant rate limits** – aligned to client pricing tiers via Arcjet token bucket
- **Request isolation** – one tenant's traffic spike never starves another
- **Credential isolation** – API keys and secrets are scoped per tenant in Infisical

---

## 9. Public REST API Key Management

### Key Issuance & Lifecycle

Public API keys are managed through the platform admin dashboard with the following workflow:

1. **Issuance**: Client admin generates API key with defined scopes (read/write) and rate limits
2. **Storage**: Keys are hashed using Argon2id before database storage
3. **Rotation**: Mandatory 90-day rotation with 7-day overlap period
4. **Revocation**: Immediate invalidation with optional grace period

### Key Format & Authentication

- **Format**: `firm_pk_<tenantId>_<randomId>` (e.g., `firm_pk_acme_v1a2b3c4d5e`)
- **Authentication**: Bearer token in `Authorization` header
- **Validation**: Middleware validates key format, tenant association, and rate limits

### Integration Points

- API key management is handled by `@firm/auth/api-keys` package
- Rate limiting integrates with Arcjet per-tenant token buckets
- Audit logs track key creation, usage, and rotation events

---

## 10. Service Communication

### Synchronous (HTTP)
Services call each other via HTTP over the private network. All calls use Zod‑validated contracts from `@firm/api-contracts`. 

#### Circuit Breaker Implementation
We use the **Opossum** circuit breaker library with the following configuration:
- **Failure threshold**: 5 consecutive failures trigger open state
- **Timeout**: 30 seconds per request
- **Reset timeout**: 60 seconds before attempting half‑open state
- **Monitoring**: Circuit state changes emit Prometheus metrics `circuit_breaker_state_total`

Circuit breakers prevent cascading failures and provide automatic recovery.

### Asynchronous (Events)
For long‑running or decoupled operations, services emit Inngest events. The event payloads are validated against the centralized `EVENT_REGISTRY`. See [background-jobs.md](./background-jobs.md).

---

*Related: [frontend.md](../core/frontend.md), [background-jobs.md](./background-jobs.md), [database.md](../core/database.md), [security.md](../../ai-context/86-security.md), [tenant-resolution.md](../core/tenant-resolution.md), [feature-flags.md](../features/feature-flags.md)*