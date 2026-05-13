# `firm-config-next` — Package Planning Document

**Security‑Hardened Next.js 16.2+ Configuration Factory · CSP · Cache Components · Turbopack · Multi‑Tenant Proxy · Zero Runtime**

---

## 0. Purpose & Architectural Position

`firm-config-next` is the **single source of truth for all Next.js configuration** in the monorepo. It provides a factory function (`createNextConfig`) that generates a security‑hardened, performance‑optimised, multi‑tenant‑ready `next.config.ts` for every application. It belongs to Layer 0 (Build & Constraint) — contains **no runtime code**, only configuration — and is the final foundational package completing the Layer 0 toolchain.

**Layer placement:** Layer 0, Wave 0 — built after `firm-config-tailwind`, as the final Layer 0 package. It wraps `firm-config-typescript`, `firm-config-tailwind`, and `firm-config-prettier` into a single, secure‑by‑default Next.js preset.

**2026 context:** Next.js 16.2.6 (May 7 2026) is the current stable security release, patching 13 CVEs. It ships with Turbopack as the default bundler, Cache Components as an opt‑in explicit caching model, `proxy.ts` replacing `middleware.ts`, stable React Compiler support, native SRI via Turbopack, and built‑in CSP nonce injection from proxy headers.

---

## 1. Immutable Rules

| Rule | Rationale |
|---|---|
| **Factory function, not a flat config.** `createNextConfig(options)` returns a typed `NextConfig` object. | Enables per‑application overrides while guaranteeing security defaults. |
| **No runtime code.** Only a TypeScript factory function and configuration types. | Layer 0 constraint. |
| **Security headers are non‑negotiable.** HSTS, CSP (nonce‑based for dynamic pages, hash‑based for static), `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` are always emitted. | Per the security baselines in `86-security.md`. Every generated app ships with security headers. |
| **`poweredByHeader: false`.** Hides `X-Powered-By: Next.js`. | Reduces information leakage to potential attackers. |
| **Cache Components enabled by default.** `cacheComponents: true`. | Explicit caching model with `"use cache"` directive is the recommended architecture for all new apps. |
| **Turbopack is the default bundler.** No webpack fallback in the factory config. Individual apps can override via `turbopack: false` if needed. | Turbopack is 2–5× faster for production builds, 10× faster for Fast Refresh. |
| **`reactCompiler: true` (stable).** React Compiler 1.0 auto‑memoizes components and hooks. | Eliminates manual `useMemo`, `useCallback`, `React.memo`. Enables anonymous function naming for better stack traces. |
| **`experimental.prefetchInlining: true`.** Bundles all segment data for faster navigation. | Reduces RSC prefetch overhead, particularly important for CMS‑driven sites. |
| **`experimental.sri.algorithm: "sha256"`.** Generates SRI hashes for all JS bundles. | Supply‑chain integrity — browsers verify cryptographic hashes before executing any JavaScript. |
| **`images.minimumCacheTTL: 14400` (4 hours).** Extends cached image lifetime. | TS 6.0 changed `minimumCacheTTL` from 60s → 14400s. Reduces image optimisation requests. |
| **`images.dangerouslyAllowLocalIP: false`.** Blocked by default. | Security hardening — prevents SSRF via image optimisation endpoint. |
| **`images.remotePatterns` required for external images.** Wildcard never used; explicit domains only. | Prevents abuse of the Image Optimisation API. |
| **`serverExternalPackages` lists native modules that cannot be bundled.** | Required for packages like `@prisma/client`, `pg`, `pino` that rely on Node.js native bindings. |
| **`outputFileTracingIncludes` configured for monorepo shared packages.** | Ensures `standalone` output includes workspace dependencies for self‑hosted deployments. |
| **Custom `cacheLife` profiles for agency workloads.** Homepage, service pages, blog posts, real‑time booking all get named profiles. | Per the documented caching strategy in `92-vertical-demos.md`. |

---

## 2. Module Inventory

```
packages/firm-config-next/
├── src/
│   ├── index.ts                    # `createNextConfig()` — the factory function
│   ├── defaults.ts                 # Aggregate default config values (security headers, images, etc.)
│   ├── cache-profiles.ts           # Custom `cacheLife` profile definitions
│   ├── security-headers.ts         # Static security headers (non‑CSP)
│   ├── csp.ts                      # CSP header builder (nonce‑based and hash‑based variants)
│   ├── image-patterns.ts           # Shared `remotePatterns` for common CDNs
│   ├── turbopack.ts                # Turbopack‑specific defaults (resolveAlias, extensions)
│   ├── proxy.ts                    # Shared `proxy.ts` template (tenant resolution, CSP nonce)
│   └── types.ts                    # `CreateNextConfigOptions` type
├── package.json
├── README.md
└── CHANGELOG.md
```

---

## 3. Key Patterns

### 3.1 `createNextConfig()` — The Factory Function

```typescript
// packages/firm-config-next/src/index.ts
import type { NextConfig } from 'next';
import type { CreateNextConfigOptions } from './types';

export function createNextConfig(options: CreateNextConfigOptions = {}): NextConfig {
  const {
    tenantSlug,
    additionalRemotePatterns = [],
    serverExternalPackages = [],
    cacheHandler,
    output = 'standalone',
    reactCompiler = true,
    experimentalOverrides = {},
  } = options;

  return {
    // ── React Compiler ──
    reactCompiler,

    // ── Cache Components ──
    cacheComponents: true,
    cacheLife: {
      // Custom agency profiles derived from vertical demo strategy
      homepage: { stale: 60, revalidate: 900, expire: 86400 },
      servicePage: { stale: 600, revalidate: 86400, expire: 2592000 },
      blogPost: { stale: 300, revalidate: 3600, expire: 604800 },
      realtime: { stale: 0, revalidate: 30, expire: 120 },
      static: { stale: 60, revalidate: 3600, expire: 86400 },
      ...options.cacheLife,
    },
    cacheHandlers: cacheHandler ? { default: cacheHandler } : undefined,

    // ── Security ──
    poweredByHeader: false,

    // ── Images ──
    images: {
      minimumCacheTTL: 14400,           // 4 hours (TS 6.0+ default)
      dangerouslyAllowLocalIP: false,
      remotePatterns: [
        // CDN patterns — always allow agency CDN
        { protocol: 'https', hostname: 'cdn.agency.com' },
        { protocol: 'https', hostname: '**.cloudinary.com' },
        { protocol: 'https', hostname: '**.supabase.co' },
        // App‑specific patterns
        ...additionalRemotePatterns,
      ],
    },

    // ── Logging ──
    logging: {
      fetches: {
        fullUrl: process.env.NODE_ENV === 'development',
      },
    },

    // ── Server external packages ──
    serverExternalPackages: [
      'pino',
      '@firm/observability',
      ...serverExternalPackages,
    ],

    // ── Output ──
    output,
    outputFileTracingIncludes: {
      // Include workspace packages in standalone output
      '/**/*': ['./node_modules/@firm/**/*'],
    },

    // ── Turbopack ──
    turbopack: {
      resolveExtensions: [
        '.tsx', '.ts', '.jsx', '.js', '.json',
      ],
      resolveAlias: {
        // Map @/ to app src directory
        '@': './src',
      },
    },

    // ── Experimental ──
    experimental: {
      // SRI — Turbopack computes sha256 hashes for all JS bundles
      sri: { algorithm: 'sha256' },
      // Prefetch inlining — fewer RSC requests
      prefetchInlining: true,
      // Turbopack file‑system cache for faster dev restarts
      turbopackFileSystemCacheForDev: true,
      // App‑specific overrides
      ...experimentalOverrides,
    },

    // ── Static security headers (non‑CSP) ──
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
            { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
            { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
            { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
          ],
        },
      ];
    },
  };
}
```

**Design decisions:**
- `serverExternalPackages` must include `pino` and `@firm/observability` because both depend on Node.js native APIs. For Turbopack standalone builds, omitting packages from `serverExternalPackages` means they won't be bundled into the standalone output — a known regression tracked in `vercel/next.js#88844`.
- `reactCompiler: true` is the stable default. The React Compiler 1.0 "automatically memoizes components and hooks without manual `useMemo` or `useCallback` wrapping".
- `experimental.sri.algorithm: "sha256"` — Turbopack "computes SRI hashes for all output bundles and automatically inserts the integrity attributes into the HTML". This is the primary defence against compromised CDN or origin assets.
- `experimental.prefetchInlining: true` — "reduces RSC prefetch overhead" and is particularly important for CMS‑driven sites because it prevents the cascade where "each prefetch fires more requests".

### 3.2 Cache Life Profiles

Custom `cacheLife` profiles are defined directly in `next.config.ts` under the `cacheLife` option. The six built‑in profiles provide sensible defaults; custom profiles extend this:

| Profile | `stale` (s) | `revalidate` (s) | `expire` (s) | Used For |
|---|---|---|---|---|
| `homepage` | 60 | 900 | 86400 | Marketing homepages (15‑min revalidation) |
| `servicePage` | 600 | 86400 | 2592000 | Service detail pages (daily revalidation) |
| `blogPost` | 300 | 3600 | 604800 | Blog posts (hourly revalidation) |
| `realtime` | 0 | 30 | 120 | Booking pages, dashboards |
| `static` | 60 | 3600 | 86400 | Contact pages, about pages |

**Important:** `cacheLife()` must be called inside a `"use cache"` scope — it cannot be called at module scope. The built‑in profiles are: `seconds`, `minutes`, `hours`, `days`, `weeks`, `max`.

### 3.3 CSP — Nonce‑Based via `proxy.ts`

Next.js 16 supports CSP nonces through `proxy.ts` rather than `next.config.ts` because "the `headers()` function in `next.config.ts` is static, so it can't generate a random nonce for each request". The proxy generates a per‑request nonce and passes it via a custom `x-nonce` header.

Nonce‑based CSP is mandatory for all authenticated platform apps and any marketing site with login:

```typescript
// Template: apps/whatever/proxy.ts
import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDev = process.env.NODE_ENV === 'development';

  const cspHeader = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    `style-src 'self' 'nonce-${nonce}'`,
    `img-src 'self' blob: data: https:`,
    `font-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', cspHeader);
  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
```

This pattern is the official Next.js recommendation. The matcher excludes API routes, static files, image optimisation, and prefetch requests. Nonces are extracted automatically by Next.js from the `Content-Security-Policy` header and applied to framework scripts, page bundles, and `<Script>` components.

**Trade‑off:** Nonce‑based CSP requires dynamic rendering — "pages must be dynamically rendered" which means "static optimisation and ISR are disabled" and "pages cannot be cached by CDNs without additional configuration". For static marketing sites that don't need per‑request nonces, use hash‑based CSP via SRI instead.

**For static pages (hash‑based CSP):** When `experimental.sri.algorithm: "sha256"` is enabled and `cacheComponents: true` is set, Next.js generates SRI hashes for all JS bundles. The CSP header can then use `'sha256-{hash}'` instead of nonces, preserving static generation and CDN caching while still providing script integrity.

### 3.4 Turbopack Configuration

Turbopack is the default bundler in Next.js 16. The `--turbopack` flag is no longer needed — it's on by default. Configuration has moved from `experimental.turbo` to a top‑level `turbopack` key:

```typescript
turbopack: {
  // Resolve extensions in order
  resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  // Aliases — prevent ../../../ chains
  resolveAlias: { '@': './src' },
  // Ignore specific warnings (e.g., known‑safe deprecations)
  ignoreIssue: [
    { file: '**/node_modules/legacy-lib/**', message: /deprecated/ },
  ],
},
```

Turbopack **does not support the `webpack()` hook**. Any existing `webpack()` configuration in consumer apps will cause `next build` to fail. The webpack escape hatch is still available via `next build --webpack`.

Turbopack's `ignoreIssue` option suppresses noisy warnings: "Turbopack can now suppress noisy or expected warnings from streaming logs".

### 3.5 Image Optimisation

The factory sets sensible security defaults for image handling:

```typescript
images: {
  minimumCacheTTL: 14400,           // 4 hours
  dangerouslyAllowLocalIP: false,   // Must never be true
  remotePatterns: [
    { protocol: 'https', hostname: 'cdn.agency.com' },
    { protocol: 'https', hostname: '**.cloudinary.com' },
    { protocol: 'https', hostname: '**.supabase.co' },
    ...additionalRemotePatterns,
  ],
},
```

- `minimumCacheTTL: 14400` — TS 6.0 changed the default from 60s to 14,400s (4h). This reduces image optimisation requests for frequently‑accessed pages.
- `dangerouslyAllowLocalIP: false` — Blocks local IP resolution, preventing SSRF via the Image Optimisation API. A known DoS vulnerability (GHSA-9g9p-9gw9-jx7f) exists when `remotePatterns` allows external domains and the attacker can serve large images on an allowed domain.
- `remotePatterns` — Uses explicit domains only; never a wildcard `**`. CDN patterns are added per‑app via `additionalRemotePatterns`.

### 3.6 `serverExternalPackages`

Packages containing native Node.js modules (`*.node` bindings, WASM, or `require()` of platform‑specific binaries) cannot be bundled by Turbopack. They must be listed in `serverExternalPackages`:

```typescript
serverExternalPackages: [
  'pino',                  // Native transport workers
  '@firm/observability',   // OpenTelemetry SDK
  // Provider‑specific packages added per app:
  // '@prisma/client', 'pg', 'sharp'
],
```

Turbopack **does not bundle** these packages; they're loaded at runtime from `node_modules` instead. For standalone output (`output: "standalone"`), there's a known issue where Turbopack omits these packages from `.next/standalone/node_modules`. The safest path for production standalone builds is `next build --webpack` until this is resolved.

### 3.7 `proxy.ts` Template — Multi‑Tenant Routing

The `proxy.ts` convention replaces the deprecated `middleware.ts` in Next.js 16. The development server emits warnings advising migration: "Next.js 16 deprecates the `middleware` file convention in favour of `proxy`". The proxy runs on the **Node.js runtime** (not Edge), making it suitable for full session validation with database checks.

For the agency's multi‑tenant architecture, the `proxy.ts` template performs:

1. **Host header → tenant slug resolution**
2. **CSP nonce generation** (per‑request, for nonce‑based CSP)
3. **HSTS header injection** (for HTTPS enforcement)
4. **Authentication gating** (redirect unauthenticated users away from protected routes)

```typescript
// Template: proxy.ts
import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  // ── 1. CSP nonce generation ──
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  // ── 2. Tenant resolution from host header ──
  const host = request.headers.get('host') || '';
  const tenantSlug = resolveTenantFromHost(host);

  // ── 3. Auth check on protected routes ──
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/dashboard') && !request.cookies.get('auth_token')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ── 4. Set nonce header for CSP ──
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('x-tenant-slug', tenantSlug);

  return NextResponse.next({ request: { headers: requestHeaders } });
}
```

The proxy "runs before a request reaches a page, layout, route handler, or static asset, making it ideal for authentication checks, redirects, rewrites, and request‑level security logic".

---

## 4. Consumer Pattern

Every application imports the factory and generates its own config:

```typescript
// apps/client-acme/next.config.ts
import { createNextConfig } from 'firm-config-next';

export default createNextConfig({
  tenantSlug: 'client-acme',
  additionalRemotePatterns: [
    { protocol: 'https', hostname: 'images.acme-corp.com' },
  ],
  serverExternalPackages: [
    '@prisma/client',
    'sharp',
  ],
  experimentalOverrides: {
    // App‑specific experimentation
  },
});
```

No per‑app `next.config.ts` duplicates security headers, CSP policies, cache profiles, or image optimisation settings. All defaults are centrally managed and version‑controlled.

---

## 5. Package Configuration

### 5.1 `package.json`

```jsonc
{
  "name": "firm-config-next",
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
    "build": "tsup src/index.ts --format esm --dts",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "next": "^16.2.6"
  },
  "dependencies": {
    "firm-config-typescript": "workspace:*"
  },
  "devDependencies": {
    "next": "^16.2.6",
    "typescript": "catalog:",
    "tsup": "catalog:"
  },
  "sideEffects": false
}
```

---

## 6. Build Scripts

| Script | Command | Purpose |
|---|---|---|
| `build` | `tsup src/index.ts --format esm --dts` | Compiles the factory function and emits types. |
| `typecheck` | `tsc --noEmit` | Validates TypeScript against the Next.js `NextConfig` type. |

---

## 7. Consumer Prerequisites

Before using `firm-config-next`, each app must have these minimal files:

1. **`next.config.ts`** — imports `createNextConfig()` and exports the result.
2. **`proxy.ts`** — at the project root (NOT inside `app/`). Imports the shared proxy template or writes its own.
3. **`instrumentation.ts`** — at the project root for observability integration.
4. **`postcss.config.mjs`** — object syntax with `@tailwindcss/postcss` plugin (array syntax silently ignored by Turbopack).

**⚠️ Critical:** "Do not place `proxy.ts` inside the `app` directory. Next.js will not detect it there".

---

## 8. Security Validation in CI

| Check | Script | Purpose |
|---|---|---|
| Security headers | `curl -I https://deploy-preview.vercel.app \| grep -E 'Content-Security-Policy\|Strict-Transport-Security'` | Verifies headers present in preview deploy |
| SRI | Inspect built HTML for `integrity="sha256-..."` attributes | Verifies SRI hashes are generated |
| CSP nonce | Verify nonce appears in both CSP header and `<script nonce="...">` tags | Ensures nonce‑based CSP is functional |

---

## 9. Version Compatibility Table (May 10 2026)

| Package | Version | Status |
|---|---|---|
| `next` | `^16.2.6` | Stable (May 7 2026 security release) |
| `react` | `^19.2.6` | Required peer (RSC CVE patches) |
| `react-dom` | `^19.2.6` | Required peer |

---

## 10. Interface Freeze & Governance

- After Wave 0, the `createNextConfig` factory signature is frozen.
- **Adding** a new default (e.g., enabling an experimental flag) → **minor**.
- **Changing** a default (e.g., `minimumCacheTTL` value) → **minor**, with migration guide.
- **Removing** a default → **major**, requires an ADR.
- Every PR that changes the factory must run `pnpm turbo typecheck --filter="...[origin/main]"` and validate against the Next.js `NextConfig` type.

---

## 11. Documentation Requirements

- **README.md**: Purpose, Configuration Reference (all options with rationale), Consumer Setup (three‑step guide), Security Headers Matrix, CSP Strategy (nonce vs hash), `proxy.ts` Template, `cacheLife` Profile Reference, Image Optimisation Security, `serverExternalPackages` Guidance, Turbopack Escape Hatch, Known Issues & Workarounds.
- **CHANGELOG.md**: Every default value change with migration instructions.

---

## References

- [Next.js 16.2 Release (March 18 2026)](https://nextjs.org/blog/next-16-2)
- [Next.js Content Security Policy Guide (April 23 2026)](https://nextjs.org/docs/app/guides/content-security-policy)
- [How to Use proxy.ts File in Next.js 16 (April 2026)](https://www.cybrosys.com/blog/how-to-use-the-proxyts-file-in-nextjs-16)
- [Turbopack Configuration Reference (April 2026)](https://nextjs.org/docs/pages/api-reference/config/next-config-js/turbopack)
- [Turbopack: What's New in Next.js 16.2 (March 2026)](https://nextjs.org/blog/next-16-2-turbopack)
- [Cache Components: Getting Started (April 2026)](https://nextjs.org/docs/app/getting-started/caching)
- [Revalidating with Cache Components (April 2026)](https://nextjs.org/docs/app/getting-started/revalidating)
- [Smart Caching on Vercel (Vercel Academy)](https://vercel.com/docs/academy/smart-caching)
- [Supply Chain Security with SRI in Next.js (April 2026)](https://dev.to/mericcintosun/supply-chain-security-in-nextjs-javascript-files-with-subresource-integrity-4ifk)
- [Instrumentation Guide (April 2026)](https://nextjs.org/docs/app/guides/instrumentation)
- [Image Configuration (May 7 2026)](https://nextjs.org/docs/app/api-reference/config/next-config-js/images)
- [What's New in Next.js 16: Turbo Builds, Smart Caching, AI Debugging (January 2026)](https://www.syncfusion.com/blogs/post/whats-new-in-next-js-16-turbo-builds-smart-caching-ai-debugging)
- [Next.js 16 and React 19.2 Integration (DeepWiki)](https://deepwiki.com)
- [Migrate CSP from unsafe-inline to nonce‑based (March 2026)](https://github.com/julienroussel/tml/issues/44)
- [Next.js 16: The End of Manual Optimization and Rise of React Compiler (April 2026)](https://dev.to)
- [Security Headers in Next.js: CSP, HSTS, and Getting an A (April 2026)](https://dev.to)