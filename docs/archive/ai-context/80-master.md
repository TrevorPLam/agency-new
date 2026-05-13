# Platform Architecture Overview

**For AI coding agents working in this monorepo.**  
This document describes the high‑level architecture of the agency’s multi‑tenant marketing operating system. For implementation details, consult the corresponding stack book (`docs/stack/`).

---

## 1. Core Mission

The platform is a **full‑service, white‑label marketing operating system**. It serves multiple client tenants from a single monorepo, sharing infrastructure and code while strictly isolating data and branding.

New clients ascend through service tiers: Website → SEO → Content → Booking → Analytics → CRM → Full Platform.

---

## 2. Technology Stack (May 2026)

| Concern          | Technology                          |
| ---------------- | ----------------------------------- |
| Language         | TypeScript 7.0+ (strict, zero `any`)|
| UI Framework     | React 19.2.6 (RSC)                  |
| Meta‑Framework   | Next.js 16.2.6 App Router           |
| Content Sites    | Astro 6.3 (pure marketing pages)    |
| Styling          | Tailwind CSS 4.3, CSS custom props  |
| Database         | PostgreSQL 18 (Neon) + pgvector     |
| ORM              | Drizzle 1.0 RC                      |
| Package Manager  | pnpm 11, workspace catalogs         |
| Orchestrator     | Turborepo 2.9.12                    |
| Identity         | Better Auth 1.6.0 + Authentik 2026.2|
| Background Jobs  | Inngest v4 (checkpointing default)  |
| Observability    | Prometheus, Grafana, Loki           |
| Email            | Resend + SMTP fallback              |
| Hosting          | Vercel (SSR), Cloudflare (static)   |

---

## 3. Multi‑Tenancy

**Tenant isolation is enforced at three levels:**

1. **Application Layer**: `tenantId` is derived from the authenticated session (`session.user.tenantId`) — **never** from user input.
2. **Database Layer**: All tables carry `tenant_id`. Access is gated by Row‑Level Security (RLS). Use `SET LOCAL app.current_tenant_id = '<tenantId>'` inside **every** transaction, including read‑only queries.
3. **Cache Layer**: Every cache key includes the tenant ID (e.g., `cacheTag('tenant-acme-blog')`).

**Theming**: White‑labeling is achieved by scoping CSS custom properties to `data‑theme`. Components reference `var(--token-name)`.

---

## 4. Rendering Strategy

- Prefer **SSG** (Static Site Generation) for public, non‑user‑specific content.
- Use **ISR** (Incremental Static Regeneration) with `cacheLife` profiles for content that changes periodically.
- Use **Cache Components** (`"use cache"`) for composable caching in Next.js 16.
- Reserve **SSR** (Server‑Side Rendering) for fully authenticated, dynamic pages.
- All caching is **opt‑in** — data is dynamic by default.

---

## 5. API Design

- **Internal (TypeScript‑to‑TypeScript)**: tRPC v11. All procedures have Zod‑validated inputs. The shared `AppRouter` type provides end‑to‑end type safety.
- **External/Public**: REST with OpenAPI 3.1. Schemas are defined in `@firm/api‑contracts` (Zod) and the OpenAPI spec is generated from them.
- **Background Events**: Inngest events are defined in a centralized `EVENT_REGISTRY` in `firm‑api‑contracts`. No service emits an unregistered event.

---

## 6. Security Baseline

- **Secrets**: Never hardcoded. Managed by Infisical; injected at runtime.
- **Input Validation**: Zod schemas on every API boundary. Reject invalid input with `400`.
- **HTTP Headers**: CSP (nonce‑based for SSR, hash‑based for SSG), HSTS, `X‑Content‑Type‑Options`, `X‑Frame‑Options`, `Referrer‑Policy`.
- **Webhooks**: Signature verification with `crypto.timingSafeEqual`. Replay protection via 5‑minute timestamp tolerance. Idempotency enforced by unique constraint on event ID.
- **AI Content**: All AI‑generated content must be labelled with a non‑removable disclosure. C2PA manifests are required for EU AI Act compliance (deadline Dec 2, 2026).

---

## 7. Feature Flags

Flags follow OpenFeature standard with enforced taxonomy: `release/`, `exp/`, `ops/`, `perm/`. Every flag has a mandatory expiry date. Expired flags cause CI failures.

---

## 8. Package & App Structure

```
monorepo/
├── apps/              ← Deployable applications (Next.js, Astro)
│   ├── firm-site/     ← Agency marketing site
│   ├── clients/       ← Per‑client sites (client‑<slug>)
│   └── platform/      ← Internal platform apps
├── packages/          ← Shared libraries (@firm/*, adapters-*)
├── services/          ← Standalone background workers (Inngest)
├── infra/             ← Infrastructure as Code (Docker, DNS, monitoring)
├── docs/              ← All documentation
└── .github/           ← CI/CD workflows
```

---

*For detailed implementation guides, see the corresponding file in `docs/stack/`.*