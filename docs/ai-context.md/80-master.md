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
| Language         | TypeScript 7.0 Beta (Go-based)     |
| UI Framework     | React 19.2.6                        |
| Meta‑Framework   | Next.js 16.2.6 App Router           |
| Content Sites    | Astro 6.3                           |
| Styling          | Tailwind CSS 4.3, CSS custom props  |
| Database         | PostgreSQL 18 (Neon) + pgvector 0.5 |
| ORM              | Drizzle ORM 1.0 (beta compatibility)|
| Package Manager  | pnpm 11.0, workspace catalogs      |
| Orchestrator     | Turborepo 2.9.12                    |
| Identity         | Better Auth 1.6.0 + Authentik 2026.2|
| Background Jobs  | Inngest v4 (checkpointing default)  |
| Observability    | Prometheus, Grafana 13, Loki 2.6    |
| Email            | Resend + SMTP fallback              |
| Hosting          | Vercel (SSR), Cloudflare (static)   |

### Version & Release Notes

- **TypeScript 7.0 Beta** (April 2026) – Go-based rework with ~10x performance improvement; stable release expected later in 2026. [0†L4-L9][0†L10-L16]
- **React 19.2.6** (May 6, 2026) – Latest stable in the 19.x line; includes improved Server Components and faster reconciliation. [1†L13-L15][1†L30-L31]
- **Next.js 16.2.6** – Introduces `cacheComponents: true` flag (stable) and Cache Components API (`"use cache"`, `cacheLife`, `cacheTag`). Defaults to Server Components. [2†L5-L11][20†L4-L8][20†L10-L13]
- **Astro 6.3** (May 7, 2026) – Experimental support for advanced routing; includes Content Collections framework for type‑safe markdown. [3†L4-L8][3†L10-L11]
- **Tailwind CSS 4.3** (May 8, 2026) – Bugfix release; v4 series focuses on smaller runtime footprint and improved Vite integration. [4†L4-L8][4†L12-L14]
- **PostgreSQL 18** (GA on Neon, May 2026) – Production‑ready; includes pgvector 0.5.0 for vector similarity search. [5†L9-L13][15†L12-L17]
- **Drizzle ORM 1.0** (beta compatibility) – Drizzle v1 is currently in beta (1.0.0-beta.x). The project works with beta releases; stable release expected later in 2026. [6†L20-L22][6†L36-L39]
- **pnpm 11.0** (April 28, 2026) – Requires Node.js 22+; native ESM; workspace catalogs now stable. [7†L35-L40][7†L16-L19]
- **Turborepo 2.9.12** (patch release) – Stable v2.x series; offers improved task scheduling and cache performance. [8†L4-L8][8†L33-L37]
- **Better Auth 1.6.0** (April 6, 2026) – Experimental OpenTelemetry support; non‑blocking password hashing via `node:crypto.scrypt`. [9†L4-L7][9†L14-L15]
- **Authentik 2026.2** (February 2026) – Adds SCIM provider enhancements, WS-Federation support, and object lifecycle management. [11†L4-L10][11†L16-L20]
- **Inngest v4** (March 2026, stable) – Checkpointing enabled by default; rewritten middleware; improved structured logging. [10†L4-L9][10†L10-L13][10†L16-L19]
- **Grafana 13** (April 2026) – Major overhaul of Loki architecture; aggregated query performance improved up to 10×. [19†L8-L13]
- **Resend** – Modern email API for developers; supports transactional and marketing emails, webhooks, and SMTP fallback. [12†L37-L42]
- **Cloudflare Workers** – Wrangler v4 available (esbuild v0.24+); updated v8 runtime (April 2026). [13†L4-L8][13†L16-L20]
- **Vercel** – Rolling Releases GA; Secure Compute now self‑serve; Vercel Flags GA (built‑in feature flags). [14†L4-L9][14†L10-L16][14†L17-L21]
- **pgvector** – Exact and approximate nearest neighbor search (HNSW/IVFFlat). New `similarity_threshold` support (April 2026). [15†L4-L10][15†L29-L35]
- **Infisical** – April 2026 update adds secure AI agent access, certificate approval workflows, real‑time secret mutations via SSE, and expanded secret rotation. [16†L4-L9][16†L17-L22]
- **OpenTelemetry** – Profiles (fourth signal) entered public alpha in March 2026; Collector 1.0 roadmap aims for stable config this year. [17†L38-L41][17†L32-L37]

---

## 3. Multi‑Tenancy

**Tenant isolation is enforced at three levels:**

1. **Application Layer**: `tenantId` is derived from the authenticated session (`session.user.tenantId`) — **never** from user input.
2. **Database Layer**: All tables carry `tenant_id`. Access is gated by Row‑Level Security (RLS). Use `SET LOCAL app.current_tenant_id = '<tenantId>'` inside **every** transaction, including read‑only queries.
3. **Cache Layer**: Every cache key includes the tenant ID (e.g., `cacheTag('tenant-acme-blog')`).

**Two‑level hierarchy**: Platform → Agency → Sub‑Account. RLS includes sibling isolation and parent visibility policies for agency admins.

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
- **AI Content**: All AI‑generated content must be labelled with a non‑removable disclosure. C2PA manifests are required for EU AI Act compliance (deadline **Dec 2, 2026**). 

> ⚠️ **Deadlines reminder** – Google Consent Mode v3 (June 15, 2026), CNIL email tracking pixel consent (July 14, 2026), EU AI Act Article 50 (Dec 2, 2026), NY synthetic performer labeling (June 9, 2026). All must be enforced in production before these dates.

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

## Research Notes (for maintainer context)

- **TypeScript 7.0** is a **major architectural shift** (Go compiler). The project should track its release candidates and be prepared for potential API changes before stable 7.0. The compiler is behaviourally compatible with TS 6.0. [0†L12-L16]
- **Drizzle ORM 1.0** is still in beta (1.0.0-beta.x). The stack remains compatible with 1.0.0-beta releases; monitor for stable release later in 2026. [6†L20-L22]
- **Next.js 16 Cache Components** (`use cache`, `cacheTag`, `cacheLife`) are now stable (no `unstable_` prefix). They replace the earlier experimental `unstable_cache`. [20†L10-L13]
- **Inngest v4 checkpointing** is **enabled by default** – no configuration required. This significantly reduces inter‑step latency (critical for AI workflows). [10†L16-L19]
- **OpenTelemetry Profiles** (fourth observability signal) entered **public alpha** in March 2026. The platform should plan for adoption once stable. [17†L38-L41]
- **Infisical real‑time events** (April 2026) now allow systems to listen for secret mutations using server‑sent events – reduces polling overhead. [16†L5-L9]

*For detailed implementation guides, see the corresponding file in `docs/stack/`.*
```

---
