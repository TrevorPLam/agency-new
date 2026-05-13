# `firm-auth` — Package Planning Document

**Session Management · RBAC · API Keys · MFA · Impersonation · Delegation · Unified Auth Pathway**

---

## 0. Purpose & Architectural Position

`firm-auth` is the **single source of truth for all authentication and authorization logic** in the platform. It provides session creation and verification, role‑based access control, API key generation and validation, multi‑factor authentication (MFA), impersonation, and delegation — consumed by every protected route, API handler, and background worker.

It contains **no business logic**; it is a pure identity and access control layer. All identity events are audited immutably.

**Layer placement:** Layer 3 (Identity, Security & Consent), Wave 4 — built after `firm-security` and before `firm-consent`. It depends on:
- `firm-types` (branded IDs: `TenantId`, `UserId`, `SessionId`, `ApiKeyId`)
- `firm-errors` (typed auth errors)
- `firm-crypto` (HMAC, secure random, constant‑time comparison)
- `firm-cache` (Redis‑backed session store and rate‑limit counters)
- `firm-logger` (immutable audit logging)
- `firm-db` (user and API key tables, RLS‑safe querying)
- `firm-env` (secrets: session encryption key, API key signing secret)

**What it owns:**

| Domain | Mechanism |
|---|---|
| Session lifecycle | Create, verify, refresh, revoke — opaque session ID stored in Redis |
| Unified `SessionContext` | Immutable frozen object built from cookie token (web) or bearer token (API) |
| RBAC | Centralised permission matrix; `requirePermission()` guard |
| API keys | Secure generation, hashed storage, scoped verification |
| MFA | TOTP setup/verification; WebAuthn planned |
| Impersonation | Admin assumes user; audited, tenant‑scoped |
| Delegation | Limited‑scope, time‑bound permission grants |
| Audit logging | Every identity event is logged immutably |

---

## 1. Immutable Rules

| Rule | Rationale |
|---|---|
| **Unified authentication path.** All requests (web, API, worker) build a `SessionContext` via the same `authenticateRequest()` pipeline. | No diverging auth logic — cookie vs bearer is an input detail, not a code fork. |
| **`SessionContext` is an immutable frozen object.** After creation, it cannot be mutated. | Prevents accidental session tampering mid‑request. |
| **RBAC permission matrix is a single file.** All roles and permissions are defined in `src/permissions/matrix.ts`. | Single source of truth; no hidden permissions in route handlers. |
| **Every protected route calls `requirePermission()`.** Missing permission check is a CI error. | Enforcement is structural, not advisory. |
| **API keys are stored as hashed values.** Only the hash is persisted; the plaintext key is shown once at creation time. | Irreversible compromise. |
| **Impersonation and delegation write an immutable audit record.** Original admin identity is preserved. | Full accountability. |
| **Session cookies use `__Host-` prefix.** `__Host-firm-session` enforces `Secure`, `Path=/`, and no `Domain`. | Prevents subdomain cookie injection. |
| **MFA secrets are encrypted at rest.** TOTP keys are encrypted with a platform secret before storage. | Even if database leaked, MFA factors remain secret. |
| **No inline role checks.** Only `requirePermission()` or `hasPermission()` may gate access. | Prevents ad‑hoc role strings in route handlers. |
| **`exports` field is the sole contract boundary.** Only `src/index.ts` reachable. | Internal refactoring invisible to consumers. |
| **Named exports only. No default exports.** | Consistent import patterns. |

---

## 2. Unified Authentication Pipeline

### 2.1 `authenticateRequest()`

All authentication flows funnel into one pipeline:

```typescript
// packages/firm-auth/src/authenticate.ts
export async function authenticateRequest(
  request: { headers: Headers; cookies: { get: (name: string) => string | undefined } },
  options?: { allowAnonymous?: boolean }
): Promise<SessionContext | null> {
  // 1. Try session cookie (__Host-firm-session)
  // 2. Fallback to Authorization: Bearer <token> (API key or session token)
  // 3. Build SessionContext from resolved identity
  // 4. Return null if no valid credential and allowAnonymous
}
```

This function is the only entry point for building a `SessionContext`. Next.js `proxy.ts` calls it; API route handlers call it.

### 2.2 `SessionContext`

```typescript
export interface SessionContext {
  readonly sessionId: SessionId;
  readonly userId: UserId;
  readonly tenantId: TenantId;
  readonly roles: readonly string[];         // RBAC role names
  readonly permissions: readonly string[];   // Expanded permission strings
  readonly authMethod: 'session' | 'api-key';
  readonly impersonator?: UserId;            // Original admin ID, if impersonating
  readonly delegation?: { delegatorId: UserId; scopes: string[]; expiresAt: Date };
  readonly expiresAt: Date;
}
```

The factory `createSessionContext()` freezes the object:

```typescript
export function createSessionContext(data: SessionContextInput): SessionContext {
  return Object.freeze({ ...data, /* expanded permissions */ });
}
```

---

## 3. Session Management

### 3.1 Session Creation

Sessions are created after successful password, MFA, or OAuth login:

```typescript
export async function createSession(
  userId: UserId,
  tenantId: TenantId,
  roles: string[],
  metadata?: SessionMetadata
): Promise<{ sessionId: string; context: SessionContext }> {
  const sessionId = crypto.randomUUID();
  const expiresAt = Date.now() + SESSION_MAX_AGE_MS;
  const context = createSessionContext({ sessionId, userId, tenantId, roles, permissions: expandRoles(roles), authMethod: 'session', expiresAt });
  await sessionStore.set(sessionId, context, SESSION_MAX_AGE_SECONDS);
  return { sessionId, context };
}
```

Redis TTL automatically expires sessions. Renewal extends TTL on activity.

### 3.2 Session Cookie

```typescript
export const SESSION_COOKIE = '__Host-firm-session';
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 3600; // 7 days idle

export function setSessionCookie(response: NextResponse, sessionId: string) {
  response.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
    // no domain set — browser restricts to current origin (due to __Host- prefix)
  });
}
```

The `__Host-` prefix ensures the cookie is only sent to the exact origin that set it.

### 3.3 Session Verification & Renewal

On each request, after retrieving the session from Redis, the expiry is checked and extended:

```typescript
export async function verifySession(sessionId: string): Promise<SessionContext | null> {
  const context = await sessionStore.get(sessionId);
  if (!context) return null;
  if (context.expiresAt < new Date()) {
    await sessionStore.delete(sessionId);
    return null;
  }
  // Renew TTL
  await sessionStore.set(sessionId, context, SESSION_MAX_AGE_SECONDS);
  return context;
}
```

### 3.4 Session Revocation

- **Explicit logout:** Delete session from Redis and clear cookie.
- **Bulk logout (password change, security incident):** Invalidate all sessions for a user by deleting all keys matching `session:{userId}:*` (using a Redis scan or a session index).
- **Impersonation end:** When impersonation ends, the impersonated session is deleted and the admin’s original session is restored.

---

## 4. Role‑Based Access Control (RBAC)

### 4.1 Central Permission Matrix

```typescript
// packages/firm-auth/src/permissions/matrix.ts
export const ROLES = {
  super_admin: 'super_admin',
  tenant_admin: 'tenant_admin',
  manager: 'manager',
  user: 'user',
  readonly: 'readonly',
  api_key: 'api_key',
} as const;

export const PERMISSIONS = {
  // User management
  'users:read':     [ROLES.super_admin, ROLES.tenant_admin, ROLES.manager, ROLES.user],
  'users:create':   [ROLES.super_admin, ROLES.tenant_admin],
  'users:delete':   [ROLES.super_admin, ROLES.tenant_admin],
  // Tenant configuration
  'tenant:read':    [ROLES.super_admin, ROLES.tenant_admin, ROLES.manager, ROLES.readonly],
  'tenant:write':   [ROLES.super_admin, ROLES.tenant_admin],
  // Billing
  'billing:read':   [ROLES.super_admin, ROLES.tenant_admin],
  'billing:write':  [ROLES.super_admin],
  // AI features
  'ai:generate':    [ROLES.super_admin, ROLES.tenant_admin, ROLES.manager, ROLES.user],
  'ai:publish':     [ROLES.super_admin, ROLES.tenant_admin], // requires human approval
  // Impersonation
  'auth:impersonate': [ROLES.super_admin],
  // API key management
  'api-keys:manage':  [ROLES.super_admin, ROLES.tenant_admin],
} as const;

export type Permission = keyof typeof PERMISSIONS;
```

This matrix is the **single source of truth**. Any change must be reviewed in a dedicated PR.

### 4.2 `requirePermission()`

A pure function that throws `AuthorizationError` if the session lacks the required permission:

```typescript
import { AuthorizationError } from 'firm-errors';

export function requirePermission(session: SessionContext, permission: Permission): void {
  if (!session.permissions.includes(permission)) {
    throw new AuthorizationError(`Missing permission: ${permission}`, {
      userId: session.userId,
      tenantId: session.tenantId,
      required: permission,
      available: session.permissions,
    });
  }
}
```

### 4.3 `hasPermission()`

Non‑throwing variant for conditional rendering:

```typescript
export function hasPermission(session: SessionContext | null, permission: Permission): boolean {
  return session?.permissions.includes(permission) ?? false;
}
```

### 4.4 Role Expansion

At session creation, roles are expanded into permissions:

```typescript
export function expandRoles(roles: string[]): Permission[] {
  const permissions = new Set<Permission>();
  for (const role of roles) {
    for (const [perm, allowedRoles] of Object.entries(PERMISSIONS)) {
      if (allowedRoles.includes(role)) permissions.add(perm as Permission);
    }
  }
  return Array.from(permissions);
}
```

---

## 5. API Keys

### 5.1 Key Generation

API keys are generated with `firm-crypto` secure randomness, split into a visible prefix (for identification) and a secret suffix. The full key is shown only once; the database stores a hash of the full key.

```typescript
import { generateApiKey } from 'firm-crypto'; // uses crypto.randomBytes base62

export async function createApiKey(
  tenantId: TenantId,
  userId: UserId,
  name: string,
  scopes: Permission[],
  expiresAt?: Date
): Promise<{ apiKey: string; apiKeyId: string }> {
  const apiKey = generateApiKey(); // e.g., "firm_abc123...xyz"
  const hash = await hashApiKey(apiKey);
  const apiKeyId = crypto.randomUUID();
  await db.insert(apiKeys).values({
    id: apiKeyId,
    tenantId,
    userId,
    name,
    hash,
    scopes,
    expiresAt,
  });
  // Audit log
  logSecurityEvent({ type: 'API_KEY_CREATED', userId, tenantId, apiKeyId });
  return { apiKey, apiKeyId };
}
```

### 5.2 Key Verification

Incoming API requests (Bearer tokens) are verified:

```typescript
export async function verifyApiKey(rawKey: string): Promise<SessionContext | null> {
  const hash = await hashApiKey(rawKey);
  const keyRecord = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.hash, hash),
  });
  if (!keyRecord || (keyRecord.expiresAt && keyRecord.expiresAt < new Date())) return null;
  // Build SessionContext with scopes as permissions
  return createSessionContext({
    userId: keyRecord.userId,
    tenantId: keyRecord.tenantId,
    roles: [],
    permissions: keyRecord.scopes,
    authMethod: 'api-key',
    expiresAt: keyRecord.expiresAt ?? FAR_FUTURE,
  });
}
```

### 5.3 Hashing

API keys are hashed with HMAC‑SHA256 using a platform secret from `firm-env`:

```typescript
async function hashApiKey(key: string): Promise<string> {
  const secret = getApiKeySecret(); // from firm-env
  return hmacSha256Hex(secret, key); // firm-crypto helper
}
```

---

## 6. Multi‑Factor Authentication (MFA)

### 6.1 TOTP Setup

TOTP (Time‑based One‑Time Password) using `firm-crypto` for secret generation and verification:

```typescript
export async function setupMfa(userId: UserId): Promise<{ secret: string; qrCodeUrl: string }> {
  const secret = generateTotpSecret(); // 20 random bytes, base32
  const encrypted = await encryptMfaSecret(secret, getMfaEncryptionKey());
  await db.update(users).set({ mfaSecret: encrypted.str, mfaSecretIv: encrypted.iv }).where(eq(users.id, userId));
  const qrCodeUrl = `otpauth://totp/Firm:${userId}?secret=${secret}&issuer=Firm`;
  return { secret, qrCodeUrl };
}
```

### 6.2 TOTP Verification

```typescript
export async function verifyTotp(userId: UserId, token: string): Promise<boolean> {
  const user = await getUserById(userId);
  if (!user.mfaSecret) return false;
  const secret = await decryptMfaSecret(user.mfaSecret, user.mfaSecretIv);
  return verifyTotpToken(secret, token); // firm-crypto: constant-time
}
```

### 6.3 Backup Codes

One‑time backup codes are generated and stored hashed. After use, they are deleted.

---

## 7. Impersonation & Delegation

### 7.1 Impersonation

A super_admin can impersonate any user:

```typescript
export async function startImpersonation(
  adminSession: SessionContext,
  targetUserId: UserId,
  targetTenantId: TenantId,
): Promise<SessionContext> {
  requirePermission(adminSession, 'auth:impersonate');
  // Create a new session for the target, but with impersonator field
  const context = createSessionContext({
    ...targetUserContext,
    impersonator: adminSession.userId,
  });
  await sessionStore.set(context.sessionId, context, SESSION_MAX_AGE_SECONDS);
  logSecurityEvent({ type: 'IMPERSONATION_STARTED', adminId: adminSession.userId, targetUserId, tenantId: targetTenantId });
  return context;
}
```

All actions performed during impersonation carry the impersonator’s audit trail.

### 7.2 Delegation

A user can grant a subset of their permissions to another user for a limited time:

```typescript
export async function delegatePermissions(
  delegator: SessionContext,
  delegateeUserId: UserId,
  scopes: Permission[],
  durationMs: number,
): Promise<DelegationGrant> {
  // Ensure delegator has the permissions they want to delegate
  for (const scope of scopes) requirePermission(delegator, scope);
  const grant = createDelegation(delegator.userId, delegateeUserId, scopes, new Date(Date.now() + durationMs));
  // Stored in database delegation_grants table
  await db.insert(delegationGrants).values(grant);
  logSecurityEvent({ type: 'DELEGATION_GRANTED', ... });
  return grant;
}
```

At session creation, the user’s effective permissions are expanded to include active delegations.

---

## 8. Security Logging (Audit Trail)

Every identity event is logged immutably via `firm-logger`:

```typescript
// packages/firm-auth/src/audit.ts
import { logger } from 'firm-logger';

export const logIdentityEvent = (event: IdentityEvent) => {
  logger.info('identity.event', { ...event, immutable: true });
};
```

Events include: `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT`, `SESSION_EXPIRED`, `API_KEY_CREATED`, `API_KEY_REVOKED`, `MFA_ENABLED`, `MFA_DISABLED`, `IMPERSONATION_START`, `IMPERSONATION_END`, `DELEGATION_GRANTED`, `DELEGATION_REVOKED`.

---

## 9. Module Inventory

```
packages/firm-auth/
├── src/
│   ├── index.ts                    # Public API
│   ├── authenticate.ts             # authenticateRequest(), createSessionContext()
│   ├── session/
│   │   ├── store.ts                # Redis session store (CRUD)
│   │   ├── cookie.ts               # setSessionCookie, clearSessionCookie
│   │   └── verify.ts               # verifySession, refreshSession, revokeSession
│   ├── permissions/
│   │   ├── matrix.ts               # ROLES, PERMISSIONS
│   │   ├── guard.ts                # requirePermission, hasPermission
│   │   └── expand.ts               # expandRoles
│   ├── api-keys/
│   │   ├── create.ts               # createApiKey
│   │   ├── verify.ts               # verifyApiKey, hashApiKey
│   │   └── revoke.ts               # revokeApiKey
│   ├── mfa/
│   │   ├── totp-setup.ts           # setupMfa
│   │   ├── verify.ts               # verifyTotp
│   │   └── backup-codes.ts         # generateBackupCodes, verifyBackupCode
│   ├── impersonate.ts              # startImpersonation, endImpersonation
│   ├── delegate.ts                 # delegatePermissions, revokeDelegation
│   ├── audit.ts                    # logIdentityEvent
│   ├── errors.ts                   # AuthError subclasses (already in firm-errors? re-export with context)
│   └── types.ts                    # SessionContext, IdentityEvent, etc.
├── tests/
│   ├── authenticate.test.ts
│   ├── session.test.ts
│   ├── permissions.test.ts
│   ├── api-keys.test.ts
│   ├── mfa.test.ts
│   ├── impersonate.test.ts
│   └── delegate.test.ts
├── package.json
├── README.md
└── CHANGELOG.md
```

---

## 10. Key Patterns

### 10.1 Cookie vs Bearer Authentication

`authenticateRequest()` abstracts the source:

```typescript
async function authenticateRequest(req: ...) {
  // Try session cookie
  const sessionId = req.cookies.get(SESSION_COOKIE);
  if (sessionId) return verifySession(sessionId);
  // Try bearer token (API key)
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    return verifyApiKey(token) ?? verifySession(token); // fallback: also allow bearer session token
  }
  return null;
}
```

### 10.2 Password Authentication (External to this package)

User credential verification (password hashing) is performed by `firm-crypto` and the actual password comparison happens in a dedicated user service or directly in the login route using `firm-auth`'s session creation. `firm-auth` does not own user credentials; it creates sessions after credentials are verified. The login endpoint imports both `firm-auth` (session creation) and `firm-crypto` (password hash verification). This separation keeps `firm-auth` agnostic of authentication method (password, OAuth, passkey) — it only deals with identity and session.

### 10.3 RBAC in Routes

```typescript
// In any API route handler
import { getSessionFromCookies, requirePermission } from 'firm-auth';

export async function POST(request: NextRequest) {
  const session = await authenticateRequest(request);
  if (!session) return new Response('Unauthorized', { status: 401 });
  requirePermission(session, 'users:delete');
  // ...
}
```

### 10.4 Impersonation Exit

```typescript
export async function endImpersonation(impersonatedSession: SessionContext, adminSession: SessionContext): Promise<void> {
  // Delete impersonated session
  await sessionStore.delete(impersonatedSession.sessionId);
  logIdentityEvent({ type: 'IMPERSONATION_END', adminId: adminSession.userId, ... });
}
```

---

## 11. Package Configuration

### 11.1 `package.json`

```jsonc
{
  "name": "firm-auth",
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
    "firm-errors": "workspace:*",
    "firm-crypto": "workspace:*",
    "firm-cache": "workspace:*",
    "firm-logger": "workspace:*",
    "firm-db": "workspace:*",
    "firm-env": "workspace:*",
    "ioredis": "catalog:",
    "qrcode": "catalog:" // for MFA QR code generation
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

### 11.2 `tsconfig.json`

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
    { "path": "../firm-errors" },
    { "path": "../firm-crypto" },
    { "path": "../firm-cache" },
    { "path": "../firm-logger" },
    { "path": "../firm-db" },
    { "path": "../firm-env" }
  ]
}
```

---

## 12. Test Strategy

| Suite | Key Tests |
|---|---|
| Session | Create, verify, expire, renew, revoke, Redis interaction (mock/fake) |
| RBAC | Permission expansion, requirePermission throws/ok, hasPermission, matrix integrity (no undefined roles) |
| API keys | Generation uniqueness, hash verification, revoke, expiration, scope enforcement |
| MFA | TOTP generation/verification (time‑window), backup codes |
| Impersonation | Start/end, audit trail, permission propagation |
| Delegation | Grant/revoke, permission expansion, expiration |
| Authentication pipeline | Cookie extraction, bearer token parsing, fallback logic |

Integration tests use a real Redis instance. `firm-db` is mocked or substituted with an in‑memory version for unit tests.

---

## 13. Consumer Patterns

### 13.1 Next.js `proxy.ts` with Auth

```typescript
// apps/.../proxy.ts
import { authenticateRequest, requirePermission } from 'firm-auth';

export async function proxy(request: NextRequest) {
  const session = await authenticateRequest(request);
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!session) return NextResponse.redirect(new URL('/login', request.url));
    requirePermission(session, 'tenant:write');
  }
  const requestHeaders = new Headers(request.headers);
  if (session) requestHeaders.set('x-user-id', session.userId);
  requestHeaders.set('x-tenant-id', session?.tenantId ?? '');
  return NextResponse.next({ request: { headers: requestHeaders } });
}
```

### 13.2 API Route Handler

```typescript
// apps/api/some-route/route.ts
import { authenticateRequest, requirePermission } from 'firm-auth';
export async function GET(request: NextRequest) {
  const session = await authenticateRequest(request);
  if (!session) return new Response(null, { status: 401 });
  requirePermission(session, 'users:read');
  // ...
}
```

### 13.3 Server Action

```typescript
import { requirePermission, getSessionFromCookies } from 'firm-auth';
export async function deleteUser(userId: string) {
  const session = await getSessionFromCookies(); // uses AsyncLocalStorage or passed cookies
  requirePermission(session, 'users:delete');
  // ...
}
```

---

## 14. Interface Freeze & Governance

- After Wave 4, the `SessionContext` interface and permission matrix are frozen. Adding new permissions or roles is a minor change; removing or renaming is a major breaking change.
- Session cookie settings (name, flags) are immutable.
- The unified `authenticateRequest()` signature is the only entry point; internal refactoring may not break it.
- CI enforces that all protected routes use `requirePermission()` via static analysis or lint rules.

---

## 15. Documentation Requirements

- **README.md**: Authentication architecture, session lifecycle, RBAC reference, API key management, MFA setup, impersonation and delegation guides.
- **TSDoc** on all public exports.

---

## 16. Next Package

After `firm-auth`, the next Layer 3 package is **`firm-consent`** — GDPR/CCPA consent lifecycle, GPC enforcement, structural rendering gate.

---

## References

- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [__Host- cookie prefix specification](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#cookie_prefixes)
- [TOTP: RFC 6238](https://datatracker.ietf.org/doc/html/rfc6238)
- [WebAuthn Specification](https://www.w3.org/TR/webauthn-2/)
- [RBAC best practices](https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html)