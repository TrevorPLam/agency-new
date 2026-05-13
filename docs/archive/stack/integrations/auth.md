# Authentication – How We Use Better Auth and Authentik

This guide covers our identity architecture for a multi‑tenant marketing platform. For alternatives (Auth.js, Clerk, WorkOS), see the archived research.

---

## 1. Identity Architecture

We use a layered authentication model:

### Layer 1: Better Auth 1.6.0 (Application Layer)
- **Organization Plugin** – multi‑tenancy primitives: organizations, members, roles, teams, invitations.
- **Database‑backed sessions** – opaque session tokens in HttpOnly cookies. Instant revocation by deleting the session row.
- **Passkey support** – primary authentication method (5 billion in active use, NIST AAL2‑compliant).
- **Admin Plugin** – role‑gated impersonation (max 1 hour duration), no chaining, full audit log.

### Layer 2: Authentik 2026.2 (Identity Provider)
- **OIDC/SAML provider** – enterprise SSO for large clients.
- **User lifecycle** management and SCIM provisioning.
- **Policy engine** for access control and audit logging.

**Integration Pattern:**
```
Client App → Better Auth (session + RBAC) → Authentik (OIDC upstream) → External IdPs
```

Better Auth is the session manager and authorization broker; Authentik handles federation and enterprise SSO.

---

## 2. Session Model

- **Server‑side sessions** – the session cookie contains only an opaque token. The session data (user, tenant, roles) is resolved server‑side.
- **BFF (Backend‑for‑Frontend) pattern** – Next.js server acts as the authentication proxy. The browser never touches an access token.
- **Multi‑domain setup** – the session cookie **does not** carry a `domain` attribute. The browser scopes it to the request origin, naturally isolating client domains.
- **JWT use** – limited to short‑lived (≤1h) tokens for specific purposes (email verification, password reset). Never for session management.

---

## 3. Multi‑Tenant Identity

### Agency Staff
Agency staff are members of the **root organization** in Better Auth. They have the ability to impersonate users in any client organization (role‑gated, time‑limited, audited).

### Client Users
Each client is a **separate Better Auth organization**. Users belong to their client’s organization. Their session carries `tenantId` and `role`. The JWT `services` claim controls which platform apps they can access (analytics, SEO, booking, etc.).

#### Example JWT Payload
```json
{
  "sub": "user_123",
  "tenantId": "acme",
  "role": "admin",
  "services": ["analytics", "seo", "booking"],
  "exp": 1715673600,
  "iat": 1715670000
}
```

### Enterprise SSO
For clients requiring SAML/OIDC, we connect Authentik to their corporate IdP (Azure AD, Okta, etc.). Better Auth still manages the session; Authentik handles the upstream federation.

---

## 4. `@firm/auth` Package

The shared `@firm/auth` package provides:

**Server‑side exports:**
- `auth()` – universal session retrieval
- `requireAuth()` – middleware for API routes
- `requireTenantAccess(tenantId)` – cross‑tenant guard
- `requireRole(…roles)` – RBAC check
- `setTenantContext(tenantId)` – sets RLS context for database queries

**Client‑side exports:**
- `useSession()` – session hook
- `useTenant()` – tenant context hook
- `SignInButton`, `SignOutButton` – pre‑styled auth components

**Middleware:**
`@firm/auth/middleware` provides a pre-configured function that performs tenant resolution and session validation. This logic is imported by both `proxy.ts` (used on Vercel) and `middleware.ts` (used on Cloudflare). Together with Arcjet rate limiting (which also protects login endpoints), this forms the platform's API gateway layer. See [Tenant Resolution](../core/tenant-resolution.md).

---

## 5. Page‑Level Protection

Every protected page/layout follows the **three‑layer defense**:

1. **Edge Middleware** – runs on every request (as `proxy.ts` on Vercel or `middleware.ts` on Cloudflare).
2. **Page / Layout** – calls `auth.api.getSession()`. If invalid, redirect or throw.
3. **Data‑access layer** – every database query uses `setTenantContext()` and RLS. Even if the page renders without a valid session, the database rejects cross‑tenant access.

---

## 6. Impersonation (Agency Staff)

- Role‑gated to the agency administrator role.
- Produces a short‑lived JWT (≤1 hour) scoped to a single client organization.
- **No chaining** – an impersonated user cannot impersonate another user.
- Full audit log written for every impersonation action.

---

## 7. Compliance

- **Passkeys** satisfy PCI DSS 4.0 phishing‑resistant MFA requirements.
- **GDPR considerations** – user data is stored in our EU database. OAuth 2.1 with PKCE (S256) is enforced for all flows.
- **DPoP (RFC 9449)** is used for sender‑constrained tokens in machine‑to‑machine communication (CI/CD, background jobs).

#### DPoP Token Rotation
- **Rotation frequency**: Every 24 hours for background jobs, every 1 hour for CI/CD tokens
- **Trigger**: Automatic rotation handled by `@firm/auth/dpop` package 15 minutes before expiry
- **Proof key storage**: DPoP proof keys are stored in Redis with 48-hour TTL
- **Failover**: If rotation fails, system falls back to previous token for up to 30 minutes

---

*Related: [database.md](../core/database.md), [frontend.md](../core/frontend.md), [infrastructure.md](../infrastructure/infrastructure.md)*