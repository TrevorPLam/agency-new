# Application Structure & Deployment

**For AI coding agents.** This file defines the structure and deployment defaults for every application in the monorepo. All apps live in `apps/`. No app may be created outside this directory.

---

## 1. Directory Map

```
apps/
├── firm-site/              ← Agency marketing website
├── clients/
│   └── client-<slug>/      ← One directory per client site
└── platform/
    ├── platform-analytics/
    ├── platform-portal/
    ├── platform-reputation/
    ├── platform-seo/
    ├── platform-booking/
    ├── platform-crm/
    ├── platform-email/
    ├── platform-content/
    ├── platform-ads/
    ├── platform-social/
    ├── platform-proposals/
    └── platform-invoicing/
```

---

## 2. Firm Site (`apps/firm-site`)

| Field | Value |
|-------|-------|
| Purpose | Agency marketing website — sales, portfolio, contact |
| Framework | Next.js 16.2.6 App Router |
| CMS | None — content managed directly in the repo |
| Deployment | Vercel |
| Key packages | `firm-ui`, `firm-seo`, `firm-analytics`, `firm-forms` |

**Rules:**
- No CMS dependency. All content is `.tsx` / `.mdx` committed to the repo.
- No `'use client'` on marketing pages unless strictly required.
- Lighthouse 95+ performance target on all pages.

---

## 3. Client Sites (`apps/clients/client-<slug>`)

### Default Stack
| Field | Value |
|-------|-------|
| Framework | Next.js 16.2.6 App Router |
| Styling | Tailwind CSS 4.3 + per‑client CSS custom properties |
| CMS | Keystatic (git‑based, default) |
| Deployment | Vercel (primary) / Cloudflare Workers (optional) |
| Auth | Better Auth (only on portal‑facing pages) |
| Analytics | `firm-analytics` (Umami) |
| Consent | `firm-consent` (required) |
| Forms | `firm-forms` + Turnstile + Inngest dispatch |
| SEO | `firm-seo` (sitemap, metadata, structured data) |

### Routes
Every client site includes:
- `app/layout.tsx` — consent gate, analytics, tenant CSS injection
- `app/page.tsx` — home page
- `app/api/health/route.ts` — required health endpoint
- `app/api/forms/...` — form handlers
- `app/(routes)/` — vertical‑specific routes (services, about, booking, gallery, contact)

### Rules
- Tenant resolution via `proxy.ts` (Vercel) or `middleware.ts` (Cloudflare).
- CSP headers emitted in `security.config.ts`.
- `noindex` must NEVER be set in production (enforced by CI).
- Client sites MUST NOT import from other client site packages.

---

## 4. Platform Apps (`apps/platform/*`)

All platform apps share:
- **Auth:** Better Auth + Authentik OIDC (all routes protected)
- **Observability:** `/api/health` endpoint, Prometheus metrics on `:9090/metrics` 
- **Security:** CSP via `proxy.ts`, Arcjet rate limiting
- **Data Access:** All queries go through `firm-db` with `setTenantContext()` 
- **Deployment:** Vercel Pro (except `platform-booking` which is self‑hosted on Hetzner via Coolify)

### Build Priority
1. `platform-analytics` — client‑facing analytics dashboard
2. `platform-portal` — unified client hub (white‑label enabled)
3. `platform-reputation` — review generation, GBP management
4. `platform-seo` — rank tracking, technical audits, keyword research
5. `platform-booking` — appointment scheduling (self‑hosted)
6. `platform-crm` — contact management, pipeline, lead routing
7. `platform-email` — campaign builder, broadcast sends
8. `platform-content` — CMS portal + AI content generation (replaces Keystatic at scale)
9. Remaining apps built as needed

### Routes per App
Each platform app follows the standard Next.js App Router structure with tRPC‑powered dashboards and REST endpoints for external integrations.

---

## 5. App Rules Summary

- Every app MUST have `/api/health` (Gate 15)
- Every app MUST emit CSP headers (Gate 13)
- Every app MUST use `firm-consent` if loading non‑essential scripts
- Platform apps MUST gate all routes behind Authentik OIDC
- Client apps MUST resolve `tenantId` from host header in `proxy.ts` 
- No app may hardcode secrets — all via Infisical / `process.env` 

---
