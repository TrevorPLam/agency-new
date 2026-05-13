# Monorepo Conventions & Project Map

**For AI coding agents.** This file defines the non‑negotiable rules and structural map that every package, app, and service must follow. Violations are blocked by CI. For implementation details, consult `docs/stack/`.

---

## 1. Project Map

```
monorepo/
├── apps/                     ← Deployable applications
│   ├── firm-site/            ← Agency marketing website
│   ├── clients/
│   │   └── client-<slug>/    ← One directory per client site
│   └── platform/
│       ├── platform-analytics/
│       ├── platform-portal/
│       ├── platform-reputation/
│       ├── platform-seo/
│       └── ...
├── packages/                 ← Shared libraries
│   ├── firm-*                ← Core platform packages (Layer 1–6)
│   └── adapters-<cat>-<prov> ← Third‑party adapter packages (Layer 7)
├── services/                 ← Background workers
│   └── <name>-worker/
├── infra/                    ← Infrastructure as Code
├── docs/                     ← Documentation
└── .github/                  ← CI/CD workflows
```

**Naming rules:**
- Client apps: `apps/clients/client-<slug>` (kebab‑case).
- Platform apps: `apps/platform/platform-<name>`.
- Shared packages: `packages/firm-<name>` (core) or `packages/adapters-<category>-<provider>`.
- Services: `services/<name>-worker`.

---

## 2. TypeScript Strictness

- `strict: true` is non‑negotiable.
- `any` is **forbidden**. Use `unknown` and type guards. If unavoidable, add an `eslint‑disable‑next‑line` with a written justification.
- `noUncheckedIndexedAccess` must be enabled.
- Discriminated unions are required for finite state modelling.
- All source files are **ESM** (`import`/`export`). Never use `require()`.

---

## 3. Naming Conventions

| Element              | Convention         | Example                  |
| -------------------- | ------------------ | ------------------------ |
| React Component      | PascalCase `.tsx`  | `BookingWidget.tsx`      |
| Hook                 | camelCase `use`    | `useBookingSlot.ts`      |
| Utility function     | camelCase          | `slugify.ts`             |
| Server Action        | camelCase `action` | `submitLeadAction.ts`    |
| Zod schema           | camelCase `Schema` | `leadSchema.ts`          |
| Database table       | snake_case         | `form_submissions`       |
| Database column      | snake_case         | `tenant_id`              |
| Client slug          | kebab‑case         | `acme‑nails`             |
| Environment variable | `FIRM_`, `CLIENT_` | `FIRM_SIGNING_KEY`       |

---

## 4. Import Order (Enforced by ESLint)

1. Node.js built‑ins (`node:path`, `node:crypto`)
2. External packages (`react`, `next`, `zod`)
3. `@firm/*` internal packages
4. Absolute imports from `@/`
5. Relative imports

All internal imports use `@/*` aliases. Never use deep relative paths outside a package.

---

## 5. Exports & Package Boundaries

- Every package has a single public door: `src/index.ts`.
- **No default exports** in shared packages. Named exports only (`export function Button()`).
- The `exports` field in `package.json` defines the public API contract.
- Packages must not import from apps; apps may import from packages. Adapters may only import from Layers 0, 2, and 4 (see `50-Layers.md`).

---

## 6. File & Folder Structure

### Shared Package (`packages/firm-<name>`)
```
src/
├── index.ts          ← Public API (named re‑exports only)
├── types.ts          ← Package‑specific types
├── <feature>.ts      ← Feature modules
└── metrics.ts        ← Prometheus metrics (if applicable)
tests/
└── <feature>.test.ts
```

### Client App (`apps/clients/client-<slug>`)
```
app/
├── layout.tsx
├── page.tsx
├── api/
│   ├── health/route.ts   ← Required (Gate 15)
│   └── forms/<name>/route.ts
└── (routes)/
lib/
├── analytics.ts
└── logger.ts
proxy.ts              ← Tenant resolution (Vercel)
middleware.ts         ← Edge‑compatible checks (Cloudflare)
security.config.ts    ← CSP, HSTS
```

---

## 7. React Component Conventions

- **Server Components by default.** Add `"use client"` only when the component requires browser APIs, React hooks, or event handlers.
- Props interface named `<ComponentName>Props`, defined in the same file.
- Components reference CSS custom properties (`var(--color-brand-primary)`), never hardcoded colours.

---

## 8. Database Conventions

- All query functions accept `tenantId` as the **first argument**.
- All shared‑schema tables **must** have an RLS policy.
- Tenant context is set via `SET LOCAL app.current_tenant_id = '<id>'` inside a transaction. **Never** use `SET SESSION`.
- Migrations live in `packages/firm-db/drizzle/migrations/`.

---

## 9. Environment Variables

| Scope           | Prefix          | Example                         |
| --------------- | --------------- | ------------------------------- |
| Public (browser) | `NEXT_PUBLIC_` | `NEXT_PUBLIC_ANALYTICS_ID`      |
| Internal        | `FIRM_`         | `FIRM_SIGNING_KEY`              |
| Per‑client      | `CLIENT_`       | `CLIENT_CRM_API_KEY`            |
| Infrastructure  | (no prefix)     | `DATABASE_URL`, `INNGEST_SIGNING_KEY` |
| Turnstile       | `TURNSTILE_`    | `TURNSTILE_SECRET_KEY`          |

No hardcoded values—all secrets come from Infisical or `process.env`. Every `.env.example` lists all required variables.

---

## 10. Commit Conventions

- All commit messages follow Conventional Commits: `type(scope): description`.
- Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`.
- Branch naming: `feat/<scope>-<desc>`, `fix/<scope>-<desc>`, `client/<slug>`, `adapter/<cat>-<prov>`.

---

## 11. Testing Adjacency

When you create or modify a file in `src/`, you must create or update its corresponding test file in a co‑located `tests/` directory (or `.test.ts(x)` next to it). Zero‑hallucination dependency rule: only use packages explicitly listed in the workspace’s `package.json`.

---

*For detailed conventions per technology, see the corresponding guide in `docs/stack/`.*