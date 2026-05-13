# Build & Bundling – How We Use Turbopack and Turborepo

This guide covers our build pipeline in Next.js 16 with Turbopack, along with monorepo orchestration via Turborepo, caching, bundle analysis, and content‑aware task separation.

---

## 1. Bundler: Turbopack (Default)

All Next.js apps use **Turbopack** for both development and production builds. It is the default in Next.js 16 and requires no configuration changes.

- **Dev Server:** Turbopack + Server Fast Refresh (only changed modules re‑compiled).
- **Production Build:** Turbopack enable tree shaking, code splitting, and minification.
- **Escape hatch:** If a package requires Webpack (e.g., Payload CMS), use `next build --webpack`. Document exception in app's README. **Webpack escape hatch removal policy:** Time-box to 3 months; require an ADR if kept longer.

### Turbopack Configuration

```ts
// next.config.ts
const nextConfig = {
  turbopack: {
    resolveAlias: { ... },
    rules: { ... },
  },
};
```

The old `experimental.turbo` key is removed. Use the top‑level `turbopack` key (codemod available: `npx @next/codemod@latest next-experimental-turbo-to-turbopack`).

---

## 2. Monorepo Orchestration: Turborepo 2.9

All tasks are orchestrated via **Turborepo 2.9.12**.

### Key Concepts

- **Dependency‑graph awareness** – `turbo run build --filter="...[origin/main]"` builds only packages affected by a PR.
- **Caching** – outputs are cached locally and via Vercel Remote Cache (free for linked repos). Cache keys include source files, environment variables, and upstream outputs.
- **Content‑aware separation** – we split code changes (`build`) from data changes (`content:build`) to prevent CMS updates from busting the application build cache.

### `turbo.json` (Excerpt)

```jsonc
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "public/**", "package.json"],
      "outputs": [".next/**", "dist/**"]
    },
    "content:build": {
      "inputs": ["content/**", "data/**"],
      "outputs": [".next/server/app/**"]
    },
    "lint": { "inputs": ["src/**", ".eslintrc*"] },
    "test": { "dependsOn": ["^build"], "inputs": ["src/**", "tests/**"] }
  }
}
```

---

## 3. Run‑time Type Check

**Transpilation is separate from type‑checking.**  
Turbopack/SWC strips types for speed; `tsc --noEmit` (or `tsgo --noEmit`) runs in CI to verify safety.

---

## 4. White‑Label / Multi‑Tenant Builds

Client‑specific environment variables (`NEXT_PUBLIC_*`, theme tokens) are baked at build time. We declare them in `turbo.json` `env` to separate caches per client. For scaling beyond ~10 clients, we evaluate `next-runtime-env` for build‑once, deploy‑many.

---

## 5. Programmatic SEO Builds

For sites with thousands of pages (e.g., location‑based SEO):

- **ISR‑Hybrid Pattern:** Pre‑build top 1,000–5,000 pages (SSG), lazy‑render tail via `dynamicParams: true` + ISR with long `revalidate`.
- **Content‑aware separation example:** A blog post update only triggers `content:build` task, preserving the application build cache. A component change triggers both `build` and `content:build`.
- Use `generateSitemaps` in Next.js 16 for sitemap chunking (prevents timeouts on Vercel).
- Astro is used for pure‑content sites with >100k pages due to its streaming build.

---

## 6. Bundle Analysis & Performance Budgets

- **Analyzer:** Use `next experimental-analyze` (Turbopack‑native).
- **Budgets (enforced in CI via Lighthouse CI):**
  - Total page weight: ≤1.5 MB (landing pages), ≤800 KB (programmatic SEO)
  - JavaScript: ≤300 KB, CSS: ≤100 KB
  - LCP (P75): ≤2.0 s (marketing), ≤1.5 s (SEO pages)
  - **CI behavior when breached:** Build fails, automatic comment posted on PR with budget violation details and performance recommendations

---

## 7. Third‑Party Scripts

Heavy third‑party scripts are offloaded to a web worker via **Partytown** (GA, Tag Manager, Facebook Pixel). Main‑thread blocking is minimal. Partytown integrates with `@firm/consent` for GDPR compliance, ensuring tracking scripts only load after explicit consent. For details, see [frontend.md](./frontend.md) and consent rules in [governance-costs.md](./governance-costs.md).

---

*Related: [frontend.md](./frontend.md), [ci-cd.md](./ci-cd.md), [deployment.md](./deployment.md), [testing.md](./testing.md)*