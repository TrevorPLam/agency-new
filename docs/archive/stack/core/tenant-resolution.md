# Tenant Resolution in Edge & Proxy

**Last updated: May 2026**  
*This document explains the unified tenant-resolution strategy for both Vercel and Cloudflare deployments, including the runtime conflict, current workaround, and forward-looking plan.*

---

## 1. Background

### 1.1 The Next.js 16 Change

In October 2025, Next.js 16 renamed the middleware file convention:
- **`middleware.ts`** → **`proxy.ts`** 
- **`middleware`** export → **`proxy`** export
- **Runtime change:** `proxy.ts` runs **Node.js only** (Edge Runtime not supported)

### 1.2 The Cloudflare Compatibility Issue

Cloudflare Workers are built on the `workerd` runtime and provide a Node.js compatibility layer, but **do not support Node.js middleware** introduced in Next.js 15.2+.

| Feature | Cloudflare Workers Status |
|---------|---------------------------|
| Middleware | ✅ supported |
| **Node.js in Middleware** | **⚪ not yet supported** |

This creates a **version trap**:
- **Use `proxy.ts`** → Cloudflare rejects it (Node.js middleware not supported)
- **Use `middleware.ts`** → Turbopack rejects it (deprecated export name missing)
- **Use Webpack** → Works temporarily, but Webpack will be phased out

---

## 2. Current Architecture (May 2026)

### 2.1 Dual-File Approach

We maintain two files to support both platforms:

| Platform | File | Export | Runtime |
|----------|------|--------|---------|
| **Vercel** | `proxy.ts` | `proxy` function | Node.js |
| **Cloudflare** | `middleware.ts` | `middleware` function | Edge Runtime |

### 2.2 Shared Logic Implementation

The tenant-resolution logic is written once in `@firm/auth/middleware` and imported by both files:

```typescript
// @firm/auth/middleware - shared logic
export function createTenantResolver() {
  return async function(request: NextRequest) {
    // Extract tenant from Host header
    const host = request.headers.get('host');
    const tenant = await resolveTenantFromHost(host);
    
    // Attach to request
    request.headers.set('x-tenant-id', tenant.id);
    
    // Session validation
    const session = await auth.api.getSession({
      headers: request.headers
    });
    
    if (!session && !isPublicPath(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  };
}
```

```typescript
// proxy.ts (Vercel)
import { createTenantResolver } from '@firm/auth/middleware';

export const proxy = createTenantResolver();
```

```typescript
// middleware.ts (Cloudflare)
import { createTenantResolver } from '@firm/auth/middleware';

export const middleware = createTenantResolver();

// Edge runtime config (required for Cloudflare)
export const config = {
  matcher: ['/((?!api/|_next/static|_next/image|favicon.ico).*)']
};
```

---

## 3. OpenNext External Middleware Option

For Cloudflare deployments, you can also deploy middleware as a **separate Cloudflare Worker** using the `cloudflare-edge` wrapper:

```typescript
// open-next.config.ts
{
  middleware: {
    external: true  // deploy middleware as its own Cloudflare Worker
  }
}
```

This approach:
- Uses `cloudflare-edge` wrapper for external middleware
- Bypasses the Node.js runtime conflict
- Keeps `middleware.ts` but isolates it from the main server
- Works with both Edge and Node.js runtimes in the same deployment

---

## 4. Deprecation Risk & Timeline

### 4.1 Current Risks

- **`middleware.ts` deprecation:** Next.js will eventually remove support
- **Build warnings:** Deprecation warnings appear in logs (safe to ignore temporarily)
- **Turbopack compatibility:** May require `--webpack` fallback in some cases

### 4.2 The Adapter API Path Forward

**Next.js 16.2 (March 2026)** introduced a stable Adapter API:
- Typed, versioned description of application output
- Shared test suite for adapter correctness
- Verified adapters hosted under Next.js organization

**Expected Timeline:**
- **Q4 2026:** Cloudflare adapter expected to fully support `proxy.ts`
- **Post-2026:** We will unify on `proxy.ts` and remove `middleware.ts`

Once the Cloudflare adapter supports proxy semantics, we will:
1. Remove `middleware.ts`
2. Use `proxy.ts` for all deployments
3. Update all documentation to reflect the unified approach

---

## 5. Implementation Guidelines

### 5.1 When Adding New Middleware Logic

1. **Add to `@firm/auth/middleware`** - never duplicate logic
2. **Test on both platforms** - Vercel and Cloudflare Workers
3. **Update both files** - `proxy.ts` and `middleware.ts` if export signatures change

### 5.2 When Deploying to Cloudflare

1. **Use `middleware.ts`** for now (not `proxy.ts`)
2. **Expect deprecation warnings** - these are safe to ignore
3. **Monitor build output** - switch to `--webpack` if Turbopack fails
4. **Consider external middleware** for complex routing needs

### 5.3 When Deploying to Vercel

1. **Use `proxy.ts`** - this is the forward-compatible approach
2. **No special configuration** - works out of the box
3. **Node.js runtime available** - full Node.js API access

---

## 6. Decision Record

This dual-file approach is documented as **ADR-019: Use middleware.ts on Cloudflare Until Native proxy.ts Support Arrives**.

The decision was made to:
- Maintain platform compatibility without blocking development
- Centralize shared logic to reduce maintenance burden
- Plan for future unification when the Adapter API matures

---

## 7. Migration Path (Future)

When the Cloudflare adapter fully supports `proxy.ts`:

1. **Remove `middleware.ts`** from all projects
2. **Update imports** to use only `proxy.ts`
3. **Remove Edge runtime config** (no longer needed)
4. **Update documentation** to reflect unified approach
5. **Archive ADR-019** as completed

---

*Related: [deployment.md](../infrastructure/deployment.md), [auth.md](../integrations/auth.md), [frontend.md](./frontend.md)*
