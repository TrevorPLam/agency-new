# Deployment & Hosting – How We Ship Code in This Monorepo

This guide covers our tiered hosting strategy, platform integration, DNS-as-code, preview environments, and CDN management. For service comparisons, see the archived research.

---

## 1. Hosting Tiers

We assign every app to one of three tiers based on its needs.

| Tier | Runtime | Host | Use Case |
|------|---------|------|----------|
| Static | None (HTML/CSS/JS) | Cloudflare Workers (free tier) | Pure marketing sites, landing pages |
| Edge‑compatible | Web APIs (no Node.js specifics) | Cloudflare Workers | A/B testing, geo‑redirects, lightweight auth |
| Full‑stack | Node.js (SSR, Server Actions, DB) | Vercel Pro | Client sites, platform apps, dashboards |

Cloudflare Workers is the default for new static and edge work because of unlimited bandwidth on the free tier. Vercel is used for all Next.js apps requiring SSR.

---

## 2. Vercel (Full‑stack Next.js Apps)

All client sites and platform apps deploy to **Vercel Pro** ($20/seat/month).

### Monorepo Setup
- Each app is a separate Vercel project pointing to its own directory.
- Sparse checkout is enabled (`VERCEL_BUILD_SPARSE_CHECKOUT_PATHS`) to improve build speeds.
- Turborepo Remote Cache is **free** for Vercel‑linked repositories and is used by CI.

### Preview Environments
- Every PR creates a preview deployment with a unique URL.
- A Neon database branch is provisioned automatically for the preview.
- On PR close, both the Vercel preview and the Neon branch are deleted.

### Production Deployments
- Triggered on merge to `main`.
- Applies DNSControl changes for custom domains.
- CDN cache is purged for affected paths after deployment.

### Spend Management
- A hard spend cap is configured at the team level. The “Pause Production Deployments” toggle is **explicitly enabled** to enforce the cap.
- Notifications fire at 50%, 75%, and 100% of the cap.
- Large media assets are offloaded to Cloudflare R2 to reduce Vercel bandwidth costs.

---

## 3. Cloudflare Workers (Static & Edge)

- Static assets are deployed via `wrangler` and served with unlimited bandwidth on the free tier.
- Workers Deploy Hooks (stable April 2026) rebuild sites on CMS content changes.
- Next.js apps deployed to Workers use the `@opennextjs/cloudflare` adapter. The deprecated `@cloudflare/next-on-pages` is not used.

### Tenant-Resolution Middleware for Cloudflare

Next.js 16 renamed the middleware file to `proxy.ts` and changed its runtime to Node-only. Cloudflare Workers do not yet support Node.js middleware (see [Cloudflare docs]). Consequently, **`proxy.ts` cannot be used on Cloudflare Workers as of May 2026**.

**Current workaround (temporary):**  
We maintain a separate `middleware.ts` file for Cloudflare deployments that exports a `middleware` function. This file uses the deprecated Edge-runtime middleware path, which remains functional but emits a deprecation warning. The shared tenant-resolution logic lives in `@firm/auth/middleware` and is reused by both `proxy.ts` (Vercel) and `middleware.ts` (Cloudflare).

**Deprecation risk:**  
Next.js will eventually remove `middleware.ts` support. The Next.js 16.2 Adapter API provides a path forward; a Cloudflare-compatible adapter is expected by end of 2026. At that point we will unify on `proxy.ts`.

**Alternative (OpenNext external middleware):**  
You may deploy the middleware as a standalone Cloudflare Worker using the `cloudflare-edge` wrapper, which bypasses the runtime conflict. See [OpenNext middleware docs].

For full details, see [Tenant Resolution](../core/tenant-resolution.md).

---

## 4. Rollback Strategy

- **Vercel Instant Rollback**: One-click rollback to previous deployment for all Next.js apps
- **Cloudflare Workers**: Manual redeploy of previous build from version control
- **Self-hosted services**: Use Coolify to redeploy previous Docker image version
- **Database**: Neon point-in-time recovery to previous state

- The database remains on Neon (compute separated from the booking service).

---

## 5. DNS & Domain Management

All DNS records are defined **as code** using **DNSControl** (files in `infra/dns/`).

- New client domains are added by committing a `dns/client-slug.dnscontrol.js` partial.
- CI applies DNS changes on merge to `main`. Manual changes via web consoles are not allowed.
- Cloudflare proxies all domains for DDoS protection and CDN caching.
- Per‑client domain compliance (SPF, DKIM, DMARC) is monitored via Skysnag/ZoneWatcher for all domains.

---

## 6. CDN Purge Performance

- **Performance checks**: Automated CDN purge performance tests after major deployments
- **Cache warming**: Strategic cache warming for critical pages after deployment
- **Monitoring**: Track CDN cache hit rates and purge effectiveness via Grafana dashboards
- **Reference**: See [lead-performance.md](../features/lead-performance.md) for detailed CDN performance testing procedures

On‑demand revalidation (`revalidateTag()`) invalidates only the Next.js server cache. The CDN must be purged explicitly.

- **Vercel:** Call the Vercel purge API immediately after `revalidateTag()`.
- **Cloudflare:** Call the Cloudflare purge API with the affected tags/URLs.
- **Vercel:** Call Vercel purge API immediately after `revalidateTag()` with affected tags/URLs
- **Cloudflare:** Call Cloudflare purge API with appropriate cache tags
- The shared `@firm/cms` package provides a `purgeCache()` function that orchestrates both CDN providers

---

## 7. Architecture Overview

**API Gateway Enforcement:** API gateway functionality is implemented by the application's request pipeline, not by a separate service. The combination of `proxy.ts`/`middleware.ts`, Arcjet, `@firm/auth/middleware`, and tRPC context middleware provides per-tenant policy enforcement, rate limiting, and credential isolation.

---

## 8. Multi‑Client CI Matrix

When shared packages (`@firm/ui`, `@firm/analytics`) change, only the affected client sites are rebuilt and deployed.

- `turbo query affected --json` outputs a list of affected apps.
- The CI matrix deploys each app in parallel with tenant‑specific environment variables.
- Deployment blackout windows per client (hard blackout: CI rejects deploy; soft blackout: requires account manager approval).

---

*Related: [ci-cd.md](../development/ci-cd.md), [infrastructure.md](./infrastructure.md), [frontend.md](../core/frontend.md), [governance-costs.md](../operations/governance-costs.md)*