# ADR-019: Use `middleware.ts` on Cloudflare Until Native `proxy.ts` Support Arrives

**Status:** Accepted  
**Date:** May 11, 2026  
**Decision Makers:** Platform Team  
**Related:** [Tenant Resolution](../stack/tenant-resolution.md)

---

## Context

Next.js 16 (October 2025) introduced a breaking change:
- Renamed `middleware.ts` → `proxy.ts`
- Changed export from `middleware` → `proxy`  
- **Runtime change:** `proxy.ts` runs **Node.js only** (Edge Runtime not supported)

Cloudflare Workers do not support Node.js middleware (as of May 2026), creating a **version trap**:
- Use `proxy.ts` → Cloudflare rejects it (Node.js middleware not supported)
- Use `middleware.ts` → Turbopack rejects it (deprecated export name missing)
- Use Webpack → Works temporarily, but Webpack will be phased out

## Decision

We will maintain a **dual-file approach** until the Cloudflare adapter fully supports `proxy.ts`:

### Platform-Specific Files
- **Vercel deployments:** Use `proxy.ts` exporting `proxy` function (Node.js runtime)
- **Cloudflare deployments:** Use `middleware.ts` exporting `middleware` function (Edge Runtime)

### Shared Logic Architecture
- Extract all tenant-resolution logic into `@firm/auth/middleware`
- Both files import the same shared logic with different export signatures
- No code duplication - only export name differs

### Timeline
- **Current:** Maintain dual files with deprecation warnings
- **Q4 2026:** Expect Cloudflare adapter to support `proxy.ts` via Next.js 16.2 Adapter API
- **Post-2026:** Unify on `proxy.ts` and remove `middleware.ts`

## Consequences

### Positive
- **Platform compatibility:** Works on both Vercel and Cloudflare today
- **No development blockers:** Teams can continue shipping features
- **Shared logic:** Single source of truth for tenant resolution
- **Future-proof:** Clear migration path when adapter matures

### Negative
- **Maintenance overhead:** Two files to keep in sync
- **Deprecation warnings:** Will appear in Cloudflare builds (safe to ignore)
- **Turbopack issues:** May require `--webpack` fallback in some cases
- **Documentation complexity:** Need to explain the dual approach

### Risks
- **Next.js removes `middleware.ts` early** before Cloudflare adapter is ready
  - **Mitigation:** Use OpenNext external middleware as fallback
- **Turbopack compatibility issues** increase over time
  - **Mitigation:** Monitor and use `--webpack` when needed
- **Team confusion** about which file to use where
  - **Mitigation:** Clear documentation and automated checks

## Implementation Details

### File Structure
```
app/
├── proxy.ts          # Vercel (Node.js)
├── middleware.ts     # Cloudflare (Edge Runtime)
└── (shared logic in @firm/auth/middleware)
```

### Build Configuration
- **Vercel:** Uses `proxy.ts` by default
- **Cloudflare:** Uses `middleware.ts` via `@opennextjs/cloudflare` adapter
- **CI:** Platform detection ensures correct file is used

### Monitoring
- Track deprecation warnings in Cloudflare builds
- Monitor Next.js and OpenNext release notes for adapter updates
- Plan migration when Cloudflare adapter reaches stable `proxy.ts` support

---

## Alternatives Considered

### 1. Cloudflare-Only with `middleware.ts`
**Rejected:** Would lock us out of Vercel improvements and future Next.js features.

### 2. Vercel-Only Deployment  
**Rejected:** Eliminates Cloudflare's cost advantages for static/edge workloads.

### 3. OpenNext External Middleware Only
**Rejected:** Adds complexity for deployments that don't need external middleware.

### 4. Wait for Adapter Before Proceeding
**Rejected:** Would block all development for 6+ months.

---

**This decision will be revisited when the Next.js Cloudflare adapter announces stable `proxy.ts` support, expected by end of 2026.**
