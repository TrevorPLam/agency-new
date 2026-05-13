# `firm-security` — Package Planning Document

**Runtime Security Middleware · CSP Nonce Injection · Rate‑Limit Policies · Turnstile Verification · Header Enforcement · Tag Governance**

---

## 0. Purpose & Architectural Position

`firm-security` is the **single enforcement point for all runtime security concerns** in the platform. It provides middleware, utilities, and policies that protect every HTTP endpoint — CSP nonce generation, security headers, rate limiting, CAPTCHA verification, and third‑party tag governance.

It contains **no business logic**. It is a pure security infrastructure layer consumed by every application route, API handler, and background worker.

**Layer placement:** Layer 3 (Identity, Security & Consent), Wave 4 — built after Layer 2 is complete but before `firm-auth`. It depends on:
- `firm-types` (branded IDs, configuration shapes)
- `firm-env` (validated environment variables)
- `firm-errors` (typed security errors)
- `firm-logger` (structured logging for security events)
- `firm-config-next` (static header defaults used as fallbacks)

**What it owns:**

| Domain | Mechanism |
|---|---|
| Content Security Policy (CSP) | Per‑request nonce generation, hash‑based static CSP builder, strict‑dynamic enforcement |
| Security headers | HSTS, X‑Content‑Type‑Options, X‑Frame‑Options, Permissions‑Policy, Referrer‑Policy, COOP, CORP |
| Rate limiting | Named policies (`login`, `api‑global`, `ai‑generation`), token‑bucket algorithm, Redis‑backed counters |
| Turnstile (CAPTCHA) | Server‑side token verification, invisible challenge integration |
| Tag governance | Allow‑list of third‑party script sources; blocks unregistered tags via CSP |
| CSRF protection | Double‑submit cookie pattern, token generation and verification |
| Security event audit | Immutable audit records for blocked requests, rate‑limit hits, CSP violations |

---

## 1. Immutable Rules

| Rule | Rationale |
|---|---|
| **Security is structural, not advisory.** Every route is protected by default. Opt‑out requires explicit justification. | A single missing header can expose the application; default‑on prevents configuration drift. |
| **All rate limits use named policies only — no inline configuration.** | Centralised control; changes propagate instantly without code duplication. |
| **CSP nonces are generated per‑request and never reused.** | Prevents nonce‑based bypasses; aligns with `strict‑dynamic`. |
| **`CrossTenantAccessError` is always 403, never 404.** | Prevents user enumeration. |
| **All security decisions are logged immutably via `firm-logger`.** | Auditability. |
| **Tag governance is enforced via CSP — unregistered scripts never execute.** | No third‑party script runs without explicit approval. |
| **`exports` field is the sole contract boundary.** | Only `src/index.ts` reachable. |
| **Named exports only. No default exports.** | Consistent import patterns. |
| **Credentials come exclusively from environment variables (via `firm-env`).** | No hardcoded secrets. |

---

## 2. CSP Architecture

### 2.1 Nonce‑Based CSP (Dynamic Pages)

For authenticated or server‑rendered pages, every response includes a unique nonce:

```typescript
// packages/firm-security/src/csp/nonce.ts
import { createHash, randomBytes } from 'node:crypto';

export function generateNonce(): string {
  return randomBytes(16).toString('base64');
}

export function buildNonceCsp(nonce: string, reportUri?: string): string {
  const policies = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https:`,
    `style-src 'self' 'nonce-${nonce}'`,
    `img-src 'self' blob: data: https:`,
    `font-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ];
  if (reportUri) policies.push(`report-uri ${reportUri}`);
  return policies.join('; ');
}
```

Middleware injects the nonce into the response header and makes it available to React Server Components via `AsyncLocalStorage` (see `firm-logger`’s context propagation).

### 2.2 Hash‑Based CSP (Static Pages)

For static export or aggressively cached pages, nonces are impossible. Instead, SRI hashes are used:

```typescript
export function buildHashCsp(scriptHashes: string[], styleHashes: string[], reportUri?: string): string {
  const scriptSrc = `'self' ${scriptHashes.map(h => `'sha256-${h}'`).join(' ')} 'strict-dynamic'`;
  const styleSrc = `'self' ${styleHashes.map(h => `'sha256-${h}'`).join(' ')}`;
  // ...
}
```

`firm-config-next` (Layer 0) provides configuration that enables SRI via Turbopack; `firm-security` verifies that hashes are present and fallback to nonce if auto‑generation fails.

### 2.3 CSP Violation Reporting

A built‑in endpoint receives violation reports (`report-uri` or `report-to`):

```typescript
// packages/firm-security/src/csp/report-handler.ts
export async function handleCspReport(report: CspViolationReport): Promise<void> {
  // Log to firm-logger as a security event
  // Store immutably for later analysis
}
```

All CSO violation reports are forwarded to the observability pipeline (Layer 4) for alerting.

---

## 3. Security Headers Middleware

A single middleware factory applies all required headers to every response:

```typescript
// packages/firm-security/src/headers/middleware.ts
import type { NextRequest, NextResponse } from 'next/server'; // will be used in proxy.ts

export function securityHeaders(options: SecurityHeaderOptions = {}): Record<string, string> {
  return {
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': options.frameAncestors ? `ALLOW-FROM ${options.frameAncestors}` : 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
  };
}
```

For Next.js 16, this is consumed in the `proxy.ts` file:

```typescript
// apps/.../proxy.ts
import { securityHeaders, buildNonceCsp } from 'firm-security';
export function proxy(request: NextRequest) {
  const nonce = generateNonce();
  const headers = new Headers();
  Object.entries(securityHeaders()).forEach(([k, v]) => headers.set(k, v));
  headers.set('Content-Security-Policy', buildNonceCsp(nonce));
  // ...
}
```

---

## 4. Rate Limiting

### 4.1 Named Policies

All rate limits are defined as named policies in a central registry:

```typescript
// packages/firm-security/src/rate-limit/policies.ts
export const RATE_LIMIT_POLICIES = {
  'login':             { maxRequests: 5,   windowMs: 60_000 },   // 5 attempts per minute
  'api-global':        { maxRequests: 100, windowMs: 60_000 },   // 100 req/min per IP
  'ai-generation':     { maxRequests: 10,  windowMs: 60_000 },   // 10 AI ops/min
  'password-reset':    { maxRequests: 3,   windowMs: 300_000 },  // 3 per 5 min
  'webhook-inbound':   { maxRequests: 500, windowMs: 60_000 },   // 500/min per source IP
} as const;

export type RateLimitPolicyName = keyof typeof RATE_LIMIT_POLICIES;
```

### 4.2 Redis‑Backed Token Bucket

Runtime enforcement uses a token‑bucket algorithm with Redis counters:

```typescript
// packages/firm-security/src/rate-limit/enforcer.ts
import { TenantCache } from 'firm-cache';
export async function checkRateLimit(
  cache: TenantCache,
  policyName: RateLimitPolicyName,
  clientKey: string, // e.g., IP, user ID, or API key
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const policy = RATE_LIMIT_POLICIES[policyName];
  const bucketKey = `ratelimit:${policyName}:${clientKey}`;
  // Redis INCR + EXPIRE logic
  // ...
}
```

**Lint enforcement:** Inline `maxRequests` or `windowMs` in feature code is an ESLint error. Only named policies may be used.

### 4.3 Admission Gating

For resource‑intensive operations (AI generation, bulk exports), `firm-security` provides a probabilistic admission gate:

```typescript
export function probabilisticGate(probability: number): boolean {
  return Math.random() < probability;
}
```

Used with `checkRateLimit` to shed load gracefully before the system becomes overloaded.

---

## 5. Turnstile Integration

Cloudflare Turnstile is the CAPTCHA mechanism. Verification is a single function:

```typescript
// packages/firm-security/src/turnstile/verify.ts
export async function verifyTurnstile(token: string, secretKey: string): Promise<boolean> {
  const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: JSON.stringify({ secret: secretKey, response: token }),
  });
  const json = await result.json();
  return json.success === true;
}
```

Server Actions use this before processing any form submission.

---

## 6. Tag Governance

Third‑party script tags (analytics, chatbots, ads) are only allowed if registered:

```typescript
// packages/firm-security/src/tags/registry.ts
export const TAG_REGISTRY = new Set<string>([
  'https://www.googletagmanager.com',
  'https://cdn.agency.com/analytics.js',
  // ... all approved sources
]);

export function isTagAllowed(src: string): boolean {
  return TAG_REGISTRY.has(new URL(src).origin);
}
```

CSP generation consults this registry to whitelist script sources. Unregistered tags cause the CSP to reject them. Any change to `TAG_REGISTRY` must be reviewed and merged in a dedicated PR.

---

## 7. CSRF Protection

For browser‑based requests (not API keys), a double‑submit cookie pattern is used:

```typescript
// packages/firm-security/src/csrf/token.ts
import { createHmac, randomBytes } from 'node:crypto';

export function generateCsrfToken(secret: string): string {
  const nonce = randomBytes(32).toString('base64url');
  const hmac = createHmac('sha256', secret).update(nonce).digest('base64url');
  return `${nonce}.${hmac}`;
}

export function verifyCsrfToken(token: string, secret: string): boolean {
  const [nonce, hash] = token.split('.');
  const expected = createHmac('sha256', secret).update(nonce).digest('base64url');
  return hash === expected;
}
```

The token is set in a cookie and also sent as a header (`X-CSRF-Token`) on state‑changing requests. Middleware compares them.

---

## 8. Module Inventory

```
packages/firm-security/
├── src/
│   ├── index.ts                     # Named re‑exports of all public API
│   ├── csp/
│   │   ├── nonce.ts                 # generateNonce, buildNonceCsp
│   │   ├── hash.ts                  # buildHashCsp
│   │   └── report-handler.ts        # handleCspReport
│   ├── headers/
│   │   └── middleware.ts            # securityHeaders factory
│   ├── rate-limit/
│   │   ├── policies.ts              # RATE_LIMIT_POLICIES, RateLimitPolicyName
│   │   └── enforcer.ts              # checkRateLimit, probabilisticGate
│   ├── turnstile/
│   │   └── verify.ts                # verifyTurnstile
│   ├── tags/
│   │   └── registry.ts              # TAG_REGISTRY, isTagAllowed
│   ├── csrf/
│   │   └── token.ts                 # generateCsrfToken, verifyCsrfToken
│   └── audit.ts                     # logSecurityEvent (uses firm-logger)
├── tests/
│   ├── csp.test.ts
│   ├── headers.test.ts
│   ├── rate-limit.test.ts
│   ├── turnstile.test.ts
│   ├── tags.test.ts
│   └── csrf.test.ts
├── package.json
├── README.md
└── CHANGELOG.md
```

---

## 9. Key Patterns

### 9.1 Centralised Policy Enforcement

All security checks are called through a single middleware factory:

```typescript
// apps/.../proxy.ts
import { createSecurityMiddleware } from 'firm-security';
export const security = createSecurityMiddleware({
  rateLimitPolicy: 'api-global',
  csrf: true,
  cspReportUri: 'https://monitor.agency.com/csp-report',
});
export function proxy(request: NextRequest) {
  return security(request);
}
```

### 9.2 Security Event Audit

Every blocked request, rate‑limit hit, CSP violation, and CSRF failure is logged via `firm-logger`:

```typescript
// packages/firm-security/src/audit.ts
import { logger } from 'firm-logger';
export function logSecurityEvent(event: SecurityEvent) {
  logger.info('security.event', { ...event, immutable: true });
}
```

These logs are sent to the immutable audit store (Layer 4 sink) and never deleted.

### 9.3 Inline CSP Reporting Endpoint

The package provides a ready‑to‑use API route for CSP violation collection:

```typescript
// In any API route (e.g., apps/api/csp-report/route.ts)
export async function POST(request: NextRequest) {
  const report = await request.json();
  await handleCspReport(report);
  return new Response(null, { status: 204 });
}
```

---

## 10. Package Configuration

### 10.1 `package.json`

```jsonc
{
  "name": "firm-security",
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
    "firm-env": "workspace:*",
    "firm-errors": "workspace:*",
    "firm-logger": "workspace:*",
    "firm-cache": "workspace:*",
    "ioredis": "catalog:"
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

**Dependency rationale:**
- `firm-cache` — for Redis‑backed rate limiting and token storage.
- `firm-logger` — for immutable security audit logging.
- `firm-errors` — for typed security exceptions (e.g., `RateLimitExceededError`, `CsrfValidationError`).
- `firm-env` — Turnstile secret keys, CSRF secret, etc., loaded from environment.

### 10.2 `tsconfig.json`

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
    { "path": "../firm-env" },
    { "path": "../firm-errors" },
    { "path": "../firm-logger" },
    { "path": "../firm-cache" }
  ]
}
```

---

## 11. Test Strategy

| Category | Examples |
|---|---|
| CSP header generation | Correct policy string, nonce uniqueness, hash inclusion |
| Rate limiting | Token bucket concurrency, policy name validation, Redis interaction mock |
| Turnstile | Valid/invalid token responses, error handling |
| CSRF | Token generation/verification, tampered token rejection |
| Tag governance | Allowed/blocked source origins |
| Headers | Every response contains mandatory security headers |

Integration tests use a real Redis instance (provided by CI). Unit tests mock `firm-cache`.

---

## 12. Consumer Patterns

### 12.1 Next.js 16 `proxy.ts`

```typescript
import { securityHeaders, generateNonce, buildNonceCsp, checkRateLimit, getTenantCache } from 'firm-security';

export async function proxy(request: NextRequest) {
  const nonce = generateNonce();
  const headers = securityHeaders();
  // Perform rate limit check
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const cache = getTenantCache(resolveTenantId(request));
  const { allowed } = await checkRateLimit(cache, 'api-global', ip);
  if (!allowed) {
    return new Response('Too Many Requests', { status: 429, headers: { ...headers } });
  }
  headers['Content-Security-Policy'] = buildNonceCsp(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  return NextResponse.next({ request: { headers: requestHeaders } });
}
```

### 12.2 Server Action Protection

```typescript
// In a Server Action
import { verifyTurnstile, checkRateLimit, logSecurityEvent } from 'firm-security';
import { getTenantCache } from 'firm-cache';

export async function submitForm(formData: FormData) {
  const token = formData.get('cf-turnstile-response') as string;
  if (!await verifyTurnstile(token, process.env.TURNSTILE_SECRET!)) {
    logSecurityEvent({ type: 'TURNSTILE_FAILED', ip: ... });
    throw new Error('CAPTCHA verification failed');
  }
  // ...
}
```

---

## 13. Interface Freeze & Governance

- After Wave 4, named rate limit policies and tag registry are frozen. Adding new ones is minor; changing existing thresholds requires a performance review.
- CSP configuration is considered security‑sensitive; any relaxation must be approved by a security review.
- Mandatory headers may only be removed or downgraded with an ADR and security audit.
- CI ensures that all routes have security headers applied (via integration tests or static analysis).

---

## 14. Documentation Requirements

- **README.md**: Security model overview, CSP setup, rate limiting configuration, Turnstile integration guide, tag governance workflow.
- **TSDoc** on all public functions.

---

## 15. Next Package

After `firm-security`, the next Layer 3 package is **`firm-auth`** — session management, RBAC, API keys, MFA, impersonation.

---

## References

- [MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Cloudflare Turnstile Documentation](https://developers.cloudflare.com/turnstile/)
- [OWASP Rate Limiting Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)
- [CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)