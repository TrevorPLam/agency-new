# Frontend – How We Use Next.js in This Monorepo

This guide covers how we build client‑facing sites and platform apps with Next.js 16. For background theory or comparisons, see the archived framework research.

---

## 1. Framework & Version

All full‑stack applications in this monorepo use **Next.js 16.2.6** with the **App Router**.  
The bundler is **Turbopack** (default for dev and production). Escape hatch: `next build --webpack` only if a specific plugin requires it.

---

## 2. Rendering Strategy

We choose a rendering mode based on the page’s requirements. Caching is **opt‑in** — data is dynamic unless you explicitly cache it.

| Content Type                        | Strategy                                     |
| ----------------------------------- | -------------------------------------------- |
| Public marketing pages, blogs       | SSG + ISR (`cacheLife('hours')`)             |
| Marketing pages with personalisation| Static shell + dynamic holes (Cache Components) |
| Authenticated dashboards            | SSR with streaming and Suspense              |
| Real‑time widgets                   | CSR (client component) + TanStack Query      |

### 2.1 Static Generation & ISR

- Use `'use cache'` directive to mark a Server Component as cacheable.
- Assign a `cacheLife` profile: `"minutes"`, `"hours"`, `"days"`, or a custom profile defined in `next.config.ts`.
- Use `cacheTag()` to create invalidation tags (e.g., `cacheTag('blog-posts')`).
- On-demand revalidation: `revalidateTag()` in a Server Action or API route. Always pair with a CDN purge call (see [deployment.md](../infrastructure/deployment.md)).

```tsx
// app/blog/page.tsx
import { unstable_cacheLife as cacheLife, cacheTag } from 'next/cache';

async function BlogPosts() {
  'use cache';
  cacheLife('hours');
  cacheTag('blog-posts');
  return db.blogPosts.findMany();
}
```

### 2.2 Cache Components (Partial Prerendering Successor)

- In `next.config.ts`, enable `cacheComponents: true`.
- Static shell (layout, header, hero) is CDN‑cached; dynamic holes stream per request.
- Use `Suspense` boundaries around dynamic content.
- **Example**: A blog listing page shows static header/footer, but individual posts stream dynamically with their own cache tags.

### 2.3 SSR (Authenticated Pages)

- Pages behind authentication are fully server‑rendered.
- Stream responses with `<Suspense>` for non‑blocking data fetching.
- **Security boundary**: Never import `server-only` modules into client components; use `taintObjectReference` for sensitive data to prevent accidental leakage.

---

## 3. React Server Components (RSC)

We follow the default Next.js model: **Server Components are the default; Client Components are the exception.**

| Rule                                    | Server Component              | Client Component                 |
| --------------------------------------- | ----------------------------- | -------------------------------- |
| Directive                               | None (default)                | `'use client'`                   |
| Can access database / filesystem directly | Yes                           | No (must use API or Server Action) |
| Can use React hooks (`useState`, etc.)  | No                            | Yes                              |
| Bundle impact                           | Zero (not sent to browser)    | Included in JS bundle            |

**Composition rule:** Server Components can import and render Client Components (pass serializable props). Client Components **cannot** import Server Components, but they can receive Server Components as `children`.

For shared `@firm/ui` components, pure presentational components stay as Server Components; interactive ones (modals, forms) get `'use client'`.

---

## 4. Data Fetching

### 4.1 In Server Components

- Fetch directly in the component using `async/await`. No client‑side waterfalls.
- Combine with `'use cache'` and `cacheTag()` for caching.

### 4.2 Internal APIs: tRPC

- All internal TypeScript communication uses **tRPC v11**.
- Server Components can call tRPC procedures directly via `createCallerFactory` (zero HTTP overhead).
- Client Components use tRPC’s wrapped TanStack Query hooks (`useSuspenseQuery` as default).

### 4.3 External APIs: REST

- Public‑facing endpoints and webhooks use REST with OpenAPI.
- Schemas live in `@firm/api-contracts`.

### 4.3 Server Actions (Mutations)

- Form submissions and mutations use Server Actions with `useActionState` (React 19).
- Actions are secured with Zod validation, Turnstile, and Arcjet rate limiting.
- **Security**: All actions validate tenant context via `setTenantContext()` before database operations.

```tsx
// app/actions/submitLead.ts
'use server';
export async function submitLead(prevState, formData: FormData) { ... }
```

---

### 5. White‑Label / Multi‑Tenant Architecture

One codebase, many client brands. Tenancy is resolved at the edge.

1. **Tenant resolution:** Edge middleware (implemented as `proxy.ts` on Vercel or `middleware.ts` on Cloudflare) reads the `Host` header and attaches `tenantId` to the request. The shared logic lives in `@firm/auth/middleware`. See [Tenant Resolution](./tenant-resolution.md) for the runtime-specific setup.
2. **Theming:** CSS custom properties are injected on `<html>` via the root layout, scoped to `data-theme`.
3. **Data isolation:** Every data‑fetching component is scoped by `tenantId` (from session or request context).
4. **Cache isolation:** Cache tags include `tenantId` (e.g., `tenant-acme-blog`).

---

## 6. A/B Testing & Feature Flags

We use **Vercel Flags SDK** (free, MIT) for feature flag management and A/B testing.

- Evaluate flags as early as possible: edge middleware (`proxy.ts`) for routing, then Server Components for content.
- For static pages, use `precompute: true` to bake all variants at build time — zero client‑side flicker.
- **A/B testing explosion mitigation**: Precompute only top 2 variants for high‑traffic pages; lazy‑load remaining variants via ISR.
- Every flag follows `release/`, `exp/`, `ops/`, `perm/` taxonomy with mandatory expiry dates.
- For comprehensive flag management guidelines, lifecycle processes, and best practices, see [Feature Flags](./feature-flags.md).

---

## 7. Forms (Progressive Enhancement)

All lead‑capture forms are built with:
- `useActionState` + Server Actions (works without JavaScript).
- `@firm/forms` (React Hook Form + Zod v4) for client‑side validation.
- Cloudflare Turnstile for spam protection.
- Inngest dispatch for post‑submission processing (CRM sync, email, analytics).

---

## 8. Image & Asset Optimization

- Next.js `<Image>` with CDN source (Cloudinary / Cloudflare Images).
- LCP images: `loading="eager"`, `fetchpriority="high"`.
- Uploaded images: validated via magic bytes, stored privately, served as signed URLs.

---

## 9. Performance & SEO

- Core Web Vitals are enforced via Lighthouse CI budgets.
- `generateMetadata` is used for server‑resolved meta tags (non‑blocking for users, fully populated for bots). **Critical**: All metadata queries must be scoped with `setTenantContext()` to prevent leaking tenant data in meta tags.
- JSON‑LD structured data is injected via `firm-seo`.
- **Performance testing**: See [lead-performance.md](../features/lead-performance.md) for smoke test procedures and load-time SLIs.

---

## 10. Security

- **RSC CVEs:** React must be ≥19.2.6, Next.js ≥16.2.6 (patches for CVE‑2025‑55182 and others).
- CSP headers are emitted in `security.config.ts` — never a TODO comment.
- `dangerouslySetInnerHTML` only with DOMPurify sanitization.

---

*Related: [styling.md](./styling.md), [api.md](../integrations/api.md), [forms.md](../features/forms.md), [i18n.md](../features/i18n.md), [deployment.md](../infrastructure/deployment.md)*