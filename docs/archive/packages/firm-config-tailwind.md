# `firm-config-tailwind` — Package Planning Document

**Shared Tailwind CSS v4.3+ Preset · Design Token Foundation · Multi‑Brand Theming · Zero Runtime · Monorepo‑Optimised**

---

## 0. Purpose & Architectural Position

`firm-config-tailwind` is the **single source of truth for all Tailwind CSS configuration** in the monorepo. It provides shared design tokens (`@theme`), CSS layer architecture, custom utilities, and per‑client theming patterns consumed by every application and shared UI package. It belongs to Layer 0 (Build & Constraint) — contains **no runtime code**, only CSS and configuration — and is the visual foundation upon which all higher layers build.

**Layer placement:** Layer 0, Wave 0 — built after `firm-config-prettier`, before `firm-config-next`. Together with `firm-config-typescript` (type safety), `firm-config-eslint` (correctness), and `firm-config-prettier` (formatting), it completes the code‑quality toolchain.

**2026 context:** Tailwind CSS v4.3.0 (released May 8 2026) is the current stable release, adding `scrollbar-*`, `zoom-*`, `tab-*` utilities, and stacked `@variant` support. Tailwind v4 represents a ground‑up rewrite: a Rust‑powered Oxide engine (3.8× faster full builds, 100×+ incremental), CSS‑first configuration via `@theme` (no `tailwind.config.js` required), native cascade layers, OKLCH colour space, and automatic content detection. The framework embraces modern CSS: `@layer`, `@property`, `color-mix()`, registered custom properties, and container queries.

---

## 1. Immutable Rules

| Rule | Rationale |
|---|---|
| **Single source of truth for design tokens.** All shared tokens live in this package. No per‑package `@theme` blocks duplicating tokens. | Prevents visual drift across 50+ packages. Single edit propagates everywhere. |
| **CSS‑first configuration.** Tokens declared in `@theme` blocks inside CSS files. No `tailwind.config.js` (JavaScript config still supported via `@config` for complex plugins, but discouraged). | The `@theme` approach is "not optional — it's the default and only supported configuration path" for Tailwind v4. "Changing configuration via `@theme` is the recommended method, not merely an alternative". |
| **No runtime code.** Only CSS files and `package.json`. No `dependencies` — only `devDependencies` and `peerDependencies`. | Layer 0 constraint. |
| **All colour tokens use OKLCH colour space.** `--color-*` tokens declared via `oklch()` function. | "oklch — a perceptually uniform colour space that maps closer to how the human eye perceives colour". P3 wide‑gamut support, live CSS variables visible in DevTools and overridable at runtime. |
| **Design tokens are CSS custom properties, not JS objects.** All values are accessible via `var(--token-name)` in any stylesheet. | "Your design tokens are no longer trapped in a JS build step — they're real CSS variables at runtime". |
| **Consumer usage: `@import` the shared CSS file.** Each app adds `@import 'firm-config-tailwind'` in its global stylesheet. | Standardised pattern confirmed by Nx monorepo guide and Tailwind v4 community consensus. |
| **`@source` directives for monorepo package scanning.** When apps consume shared UI components from other workspace packages, `@source` directives include those packages in Tailwind's class scanning. | "In a monorepo, shared UI components live in other packages that Tailwind may not scan by default. `@source` explicitly includes those directories". |
| **CSS layer stack: `theme → base → components → utilities → overrides`.** Per‑client theming injected at the `theme` layer via CSS custom property overrides. | "Tailwind v4 ships with native `@layer` baked in. The defaults are theme, base, components, utilities". "V4 uses CSS `@layer` to organize its output. Tailwind utilities always win over component styles without needing `!important`". |
| **Per‑client theming via `data-theme` attribute.** Each client gets CSS custom property overrides scoped to `[data-theme="client-slug"]`. Components reference `var(--color-primary)` — no hardcoded colours. | "In Tailwind v4, `@theme` allows tokens to be defined as CSS variables, which utility classes then reference. This enables context‑driven theming — different tokens can be scoped or swapped depending on the tenant". |
| **Tailwind class sorting via `prettier-plugin-tailwindcss`.** Handled by `firm-config-prettier`. | Prettier integration is separate concern; this package provides tokens only. |
| **No `tailwind.config.js` in consumer packages.** All theme customisation flows through CSS `@theme` blocks that extend or override the shared tokens. | Automatic content detection eliminates the need for manual `content` arrays. |

---

## 2. Tailwind v4 Architecture

### 2.1 Oxide Engine

The most significant architectural change in v4: the build system rewritten in Rust as the "Oxide" engine, integrating Lightning CSS for parsing and optimisation.

| Metric | v3 (JIT engine) | v4 (Oxide engine) |
|---|---|---|
| Full rebuild | ~960ms | ~100ms (3.8× faster) |
| Incremental build (new CSS) | ~44ms | ~5ms (8.8× faster) |
| Incremental build (no changes) | ~35ms | ~192µs (182× faster) |
| Engine size | Baseline | 35% smaller |

Sources:

"The performance gains are substantial: internal benchmarks show full rebuilds are 3.5x to 10x faster, while incremental builds can be over 100x to 182x faster".

### 2.2 CSS‑First Configuration

"The biggest conceptual shift: configuration moved from `tailwind.config.js` to CSS". Design tokens are defined in `@theme` blocks inside CSS files:

```css
@import "tailwindcss";
@theme {
  --color-primary: oklch(62% 0.19 264);
  --font-sans: "Inter", sans-serif;
  --spacing-18: 4.5rem;
}
```

"The `@theme` directive replaces `theme.extend` entirely. Define CSS variables with the right naming prefix and Tailwind generates utilities automatically". These become Tailwind utilities automatically — `--color-primary` generates `bg-primary`, `text-primary`, `border-primary`, etc.

**Why CSS‑first matters:** "Automatic content detection means you can remove the `content` configuration. The design system becomes part of the cascade. DevTools can read them. Other CSS can reference them". A Chinese‑language source confirms: "配置直接写进 CSS 文件里，用 @theme 指令就行。这不是'可选'，而是默认且唯一支持的配置路径" (Configuration is written directly into CSS files using the `@theme` directive. This is not 'optional' — it's the default and the only supported configuration path).

### 2.3 Native Cascade Layers

V4 uses CSS `@layer` to organise its output. "Base styles, components, and utilities each live in their own cascade layer. This means Tailwind utilities always win over component styles without needing `!important`".

The five‑layer stack: `@layer reset, tokens, base, components, utilities, overrides` .

"This is a subtle change that mostly helps when you're mixing Tailwind with other CSS. For design systems where custom classes coexist with Tailwind utilities, the explicit layer model eliminates unpredictable override behaviour".

### 2.4 OKLCH Colour System

v4 ships with a new default palette in OKLCH — "a perceptually uniform colour space". Colour tokens declared in `@theme` become live CSS custom properties: `:root { --color-blue-500: oklch(62.3% 0.214 259); }`.

Two practical wins: (1) dark mode becomes a simple CSS variable override: `@media (prefers-color-scheme: dark) { :root { --color-bg: oklch(12% 0 0); } }` — one override, everything updates; (2) opacity modifiers always work: `bg-brand/30` uses the OKLCH alpha channel natively, unlike v3 where opacity with CSS variables was unpredictable.

---

## 3. Module Inventory

```
packages/firm-config-tailwind/
├── src/
│   ├── index.css              # The canonical Tailwind preset: imports Tailwind, declares @theme
│   ├── tokens.css             # Design token definitions (@theme block)
│   ├── base.css               # Element resets and typography defaults (@layer base)
│   ├── utilities.css          # Custom utility classes (@utility)
│   ├── components.css         # Shared component styles (@layer components)
│   ├── clients/               # Per‑client theme overrides
│   │   └── _template.css      # Template for new client theme files
│   └── fonts/                 # @font-face declarations for self‑hosted fonts
├── package.json
├── README.md
└── CHANGELOG.md
```

---

## 4. Key Patterns

### 4.1 Canonical `index.css` — The Shared Preset

```css
/* packages/firm-config-tailwind/src/index.css */

/* ── Layer declaration (must be first) ── */
@layer reset, tokens, base, components, utilities, overrides;

/* ── Import Tailwind ── */
@import "tailwindcss";

/* ── Source scanning for monorepo packages ── */
/* Include shared UI components from workspace packages */
/* @source "../../firm-ui/src/**/*.tsx"; */
/* @source "../firm-forms/src/**/*.tsx"; */

/* ── Design tokens ── */
@import "./tokens.css";

/* ── Base styles ── */
@import "./base.css";

/* ── Custom utilities ── */
@import "./utilities.css";

/* ── Shared components ── */
@import "./components.css";
```

**Key decisions:**
- Layer declaration **must** come first — before any `@import` that generates styles. Otherwise browsers resolve layers in document order, not the intended hierarchy.
- `@import "tailwindcss"` replaces the old three‑directive pattern (`@tailwind base; @tailwind components; @tailwind utilities;`). It injects Tailwind's own base, components, and utilities layers.
- `@source` directives are **commented out** by default. Each consumer app must explicitly `@source` its own shared‑package dependencies. The Nx blog confirms: "v4's scanning works automatically, but in monorepos you may need `@source` to include shared libraries".

### 4.2 `tokens.css` — Agency Design Tokens

```css
/* packages/firm-config-tailwind/src/tokens.css */

@theme {
  /* ── Brand colours ── */
  --color-primary:        oklch(55% 0.19 260);
  --color-primary-light:  oklch(84% 0.07 255);
  --color-primary-dark:   oklch(40% 0.17 262);
  --color-secondary:      oklch(52% 0.14 175);
  --color-secondary-light:oklch(84% 0.08 175);
  --color-secondary-dark: oklch(38% 0.12 173);

  /* ── Neutrals ── */
  --color-ink:            oklch(26% 0.05 264);
  --color-ink-light:      oklch(66% 0.01 258);
  --color-ink-lighter:    oklch(92% 0.003 254);
  --color-canvas:         oklch(97% 0.002 252);

  /* ── Semantic colours ── */
  --color-success:        oklch(55% 0.16 147);
  --color-error:          oklch(59% 0.19 38);
  --color-warning:        oklch(72% 0.15 85);

  /* ── Typography ── */
  --font-sans:            "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-heading:         "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono:            "JetBrains Mono", ui-monospace, monospace;

  /* ── Spacing (extends Tailwind default scale) ── */
  --spacing-18:           4.5rem;
  --spacing-88:           22rem;
  --spacing-128:          32rem;

  /* ── Shadows ── */
  --shadow-card:          0 4px 12px oklch(0% 0 0 / 10%);
  --shadow-elevated:      0 8px 24px oklch(0% 0 0 / 15%);

  /* ── Radii ── */
  --radius-card:          0.75rem;
  --radius-button:        0.5rem;
  --radius-full:          9999px;

  /* ── Breakpoints ── */
  --breakpoint-sm:        640px;
  --breakpoint-md:        768px;
  --breakpoint-lg:        1024px;
  --breakpoint-xl:        1280px;
  --breakpoint-2xl:       1536px;
}
```

**Design decisions:**
- Colour tokens follow the naming convention from the Nx monorepo guide: `--color-*` enables `bg-*`, `text-*`, `border-*`, etc..
- All colour tokens use OKLCH, enabling alpha channel support: `bg-primary/50` works on custom theme colours because OKLCH provides a dedicated alpha channel.
- The token set is intentionally minimal — additional tokens are added per‑client via the override mechanism.
- "Theme variables follow a structured naming convention with namespaces" — `--color-*` generates colour utilities, `--font-*` generates font utilities, `--spacing-*` generates spacing utilities.

### 4.3 `base.css` — Element Defaults

```css
/* packages/firm-config-tailwind/src/base.css */

@layer base {
  /* ── Smooth scrolling ── */
  html {
    scroll-behavior: smooth;
  }

  /* ── Heading defaults ── */
  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-heading);
    font-weight: 700;
    line-height: 1.2;
    text-wrap: balance;
  }

  /* ── Body defaults ── */
  body {
    font-family: var(--font-sans);
    font-size: 1rem;
    line-height: 1.6;
    color: var(--color-ink);
    background-color: var(--color-canvas);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* ── Focus ring ── */
  *:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  /* ── Selection ── */
  ::selection {
    background-color: var(--color-primary);
    color: white;
  }
}
```

### 4.4 `utilities.css` — Custom Utilities

```css
/* packages/firm-config-tailwind/src/utilities.css */

/* ── Glass effect ── */
@utility glass {
  backdrop-filter: blur(16px);
  background: oklch(31% 0 0 / 0.6);
  border: 1px solid oklch(100% 0 0 / 0.08);
}

/* ── Text balance ── */
@utility text-balance {
  text-wrap: balance;
}

/* ── Gradient text ── */
@utility text-gradient {
  background: linear-gradient(
    to right,
    var(--color-primary),
    var(--color-secondary)
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

**`@utility` limitations:** "`@utility` can't handle complex multi‑layer backgrounds with `background-blend-mode`. The rule of thumb: if your style is a single property or a simple set of properties, use `@utility`. If it involves multiple interacting declarations with blend modes or animations, use a regular CSS class and keep it in your global stylesheet".

### 4.5 Per‑Client Theming — `[data-theme]` Pattern

The agency's multi‑tenant architecture uses a single codebase to serve many branded clients. Tailwind v4 enables this through CSS custom property overrides scoped to a `data-theme` attribute:

```css
/* packages/firm-config-tailwind/src/clients/client-acme.css */
/* Or: injected into the app's own global CSS at build time */

[data-theme="client-acme"] {
  --color-primary:        oklch(48% 0.22 350);   /* Acme's brand red */
  --color-primary-light:  oklch(72% 0.12 348);
  --color-primary-dark:   oklch(32% 0.18 352);
  --color-secondary:      oklch(55% 0.16 220);   /* Acme's brand blue */
  --font-heading:         "Playfair Display", serif;
  --radius-card:          0.5rem;
  --radius-button:        0.25rem;
}
```

**How it works:**
1. The app's root layout sets `data-theme="client-slug"` on the `<html>` element.
2. All components reference CSS variables: `bg-primary`, `text-primary`, `font-heading`.
3. The browser applies the scoped custom properties for the active theme — zero runtime JavaScript.
4. "This enables context‑driven theming — different tokens can be scoped or swapped depending on the tenant, role, or mode active in the UI".

**White‑label systems:** "白标（White-label）产品多品牌发行 这种需求无法用原生 CSS 轻松解决。但 Tailwind 可以用：动态 CSS 变量 · 多主题体系（Theme Switch）· 用户级主题（Tenant-level Theme）" (White‑label product multi‑brand release cannot be easily solved with native CSS. But Tailwind can use: dynamic CSS variables, multi‑theme systems, tenant‑level themes.)

### 4.6 Consumer Usage — `@import` Pattern

Each application imports the shared preset in its global stylesheet:

```css
/* apps/client-acme/src/app/globals.css */
@import "firm-config-tailwind";

/* ── Per‑client token overrides ── */
[data-theme="client-acme"] {
  --color-primary: oklch(48% 0.22 350);
  --color-secondary: oklch(55% 0.16 220);
  --font-heading: "Playfair Display", serif;
}

/* ── Source scanning for shared UI packages ── */
@source "../../../packages/firm-ui/src/**/*.tsx";
@source "../../../packages/firm-forms/src/**/*.tsx";
```

**Why `@import` and not a package reference:** Tailwind v4's CSS‑first architecture means the shared tokens are just a CSS file. "In a pnpm/npm workspaces based monorepo you can put that CSS file in its own package and share it just as you'd do with your TypeScript packages". The `package.json` `exports` field points to the CSS entry point; consumers `@import` it directly.

**`package.json` for the shared package:**
```jsonc
{
  "name": "firm-config-tailwind",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.css",
    "./tokens.css": "./src/tokens.css",
    "./base.css": "./src/base.css",
    "./utilities.css": "./src/utilities.css"
  }
}
```

"The key is the `exports` field pointing directly to the CSS file. Any consumer can `@import 'firm-config-tailwind'` and get the tokens". No build step involved.

### 4.7 Next.js 16 + PostCSS Integration

Next.js 16 with Turbopack uses PostCSS for CSS processing. Each consumer app needs a minimal `postcss.config.mjs`:

```javascript
// apps/client-acme/postcss.config.mjs
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

**⚠️ Critical — PostCSS plugin format:** "postcss.config.ts uses the array‑based plugin syntax, which is not processed by Turbopack (mandatory in Next.js 16) … Production deployment on Vercel has no working styles". The **object syntax** shown above is required for Turbopack compatibility. Array‑based syntax (`plugins: [...]`) is silently ignored.

**⚠️ Known issue — Tailwind v4.1.10–v4.1.18 + Next.js 16 + Turbopack:** "Tailwind v4.1.18과 Next.js 16 Turbopack 번들러를 함께 사용해 프로덕션 빌드를 실행하면 CSS 처리 단계에서 범위 오류가 발생합니다" (Range error during CSS processing in production build). This is resolved in v4.2.0+. Our v4.3.0 baseline is clear.

**Vite‑based Next.js:** For experimental Vite‑based Next.js setups, the `@tailwindcss/vite` plugin is available. For standard PostCSS‑based setups, `@tailwindcss/postcss` is required.

### 4.8 `@source` Directive for Monorepo Scanning

Tailwind v4 scans for class names automatically, but in monorepos, shared UI components live in workspace packages outside the app's directory. Without explicit `@source` directives, classes used in shared components are tree‑shaken away in production.

"The `@source` directive is a Tailwind v4 CSS directive. The v3‑style `content` array in `postcss.config.js` does not work in v4. Source scanning must be configured in the CSS file itself. Paths are relative to the CSS file, not the project root or the PostCSS config".

**The opposite problem — over‑scanning:** For PostCSS‑based setups, `@tailwindcss/postcss` uses `process.cwd()` as its scanning base, meaning it scans the entire monorepo, potentially including unused package classes. "When you run `nx build demoapp`, `process.cwd()` is your workspace root. Tailwind scans from there, finding all template files across your entire monorepo". Restrict scanning via the `base` option in PostCSS config when needed.

---

## 5. Package Configuration

### 5.1 `package.json`

```jsonc
{
  "name": "firm-config-tailwind",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.css",
    "./tokens.css": "./src/tokens.css",
    "./base.css": "./src/base.css",
    "./utilities.css": "./src/utilities.css",
    "./components.css": "./src/components.css"
  },
  "peerDependencies": {
    "tailwindcss": "^4.3.0"
  },
  "dependencies": {
    "@tailwindcss/postcss": "^4.3.0"
  },
  "devDependencies": {
    "tailwindcss": "^4.3.0"
  },
  "sideEffects": true
}
```

**Design decisions:**
- `"sideEffects": true` **required**. Since this package's CSS file generates Tailwind utilities when imported by consumers, it has side effects. Setting `"sideEffects": false` would allow bundlers to tree‑shake it away entirely.
- `"exports"` field points to CSS files. No build step. Consumers `@import 'firm-config-tailwind'` directly.
- `@tailwindcss/postcss` is in `dependencies` (not `devDependencies`) because consumers need it at build time. However, each app installs its own copy — this dependency exists here primarily for version pinning and self‑validation.
- `tailwindcss` is in both `peerDependencies` (consumers must have it) and `devDependencies` (for CI validation of this package).

---

## 6. Build Scripts

| Script | Command | Purpose |
|---|---|---|
| `check` | `npx tailwindcss --check` | Validates the Tailwind CSS compiles without errors. |

**Note:** There is no build step for this package. CSS files are consumed directly by application build pipelines. The `check` script validates that the tokens and layers are syntactically correct and produce no Tailwind compilation errors.

---

## 7. Consumer Patterns

### 7.1 For every Next.js app

**Step 1:** Install dependencies:
```bash
pnpm add --filter apps/client-acme tailwindcss @tailwindcss/postcss
```

**Step 2:** Create minimal PostCSS config:
```javascript
// apps/client-acme/postcss.config.mjs
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

**Step 3:** Import shared tokens in global CSS:
```css
/* apps/client-acme/src/app/globals.css */
@import "firm-config-tailwind";

/* Add @source for any shared UI packages used by this app */
@source "../../../packages/firm-ui/src/**/*.tsx";
```

**Step 4:** Per‑client overrides (if needed):
```css
/* At bottom of globals.css, or in a separate client-theme.css */
[data-theme="client-acme"] {
  --color-primary: oklch(48% 0.22 350);
  --font-heading: "Playfair Display", serif;
}
```

### 7.2 For shared UI packages (`@firm/ui`, `@firm/forms`)

Shared packages reference the design tokens but do **not** generate their own Tailwind build. They consume the app's compiled Tailwind CSS:

```tsx
// packages/firm-ui/src/components/Button.tsx
export function Button({ children }: { children: React.ReactNode }) {
  return (
    <button className="bg-primary text-white font-sans rounded-button px-6 py-3">
      {children}
    </button>
  );
}
```

**Critical monorepo insight:** "The intuitive approach is to have component packages build their own CSS and have apps import it. Avoid this. Tailwind v4 wraps generated utilities in `@layer utilities`, so importing both CSS files gives the browser two `@layer utilities` blocks. Instead, shared packages only expose components that reference Tailwind classes — the app's build process scans those packages via `@source`".

---

## 8. Build Order & Dependency Map

```
firm-config-typescript (Layer 0, Wave 0)
        │
        ├── firm-config-eslint (Layer 0, Wave 0 — parallel)
        ├── firm-config-prettier (Layer 0, Wave 0 — parallel)
        └── firm-config-tailwind (Layer 0, Wave 0 — parallel)
                │
                └── firm-config-next (Layer 0, Wave 0 — next)
```

`firm-config-tailwind` has no dependency on other internal `firm-*` packages. It is built in parallel with `firm-config-eslint` and `firm-config-prettier`.

---

## 9. Interface Freeze & Governance

- After Wave 0, the design tokens in `tokens.css` are frozen. Token value changes affect every application.
- **Adding** a new token (new `--color-*`, `--font-*`, etc.) → **minor**.
- **Changing** a token value (e.g., `--color-primary` lightened) → **minor**, but requires visual regression testing via Chromatic.
- **Removing** a token → **major**, requires an ADR and migration over deprecation period.
- **Renaming** a token → **major**, requires a codemod for all consumers.
- Every PR that changes `tokens.css` must pass `npx tailwindcss --check` in CI.
- Visual regression tests (Chromatic) must pass before token changes are merged.

---

## 10. Monorepo Scanning Optimisation

### 10.1 Default Behaviour

`@tailwindcss/postcss` uses `process.cwd()` as its default scanning base — the workspace root. This means it finds **all** files in the monorepo, potentially generating CSS for classes in packages the app doesn't use.

### 10.2 Restricting Scanning

For production builds, limit scanning to only the packages the app actually depends on:

```javascript
// apps/client-acme/postcss.config.mjs
const config = {
  plugins: {
    "@tailwindcss/postcss": {
      base: __dirname,  // Only scan from this app's directory
    },
  },
};
export default config;
```

Then use `@source` in the CSS to explicitly add shared packages:
```css
@source "../../../packages/firm-ui/src/**/*.tsx";
```

### 10.3 Vite‑Based Apps

For `@tailwindcss/vite`, the scanning base defaults to the Vite config root (the app directory). "With Vite you have the opposite problem: not enough is included by default, so you must explicitly add library sources" via `@source`.

---

## 11. Documentation Requirements

- **README.md**: Purpose, Token Reference (all `--color-*`, `--font-*`, `--spacing-*`, `--shadow-*`, `--radius-*`), Consumer Setup (three‑step guide), Per‑Client Theming Pattern, `@source` Scanning Guide, PostCSS Configuration, Tailwind v4 Migration from v3, v4.3.0 Feature Overview.
- **CHANGELOG.md**: Every token addition/change/removal with migration instructions.
- All tokens in `tokens.css` carry inline comments explaining their design intent and usage context.

---

## 12. Version Compatibility Table (May 10 2026)

| Package | Version | Status |
|---|---|---|
| `tailwindcss` | `^4.3.0` | Stable (May 8 2026) |
| `@tailwindcss/postcss` | `^4.3.0` | Stable (syncs with tailwindcss) |
| `@tailwindcss/vite` | `^4.3.0` | Stable (alternative for Vite‑based apps) |
| `prettier-plugin-tailwindcss` | `^0.8.0` | Stable (handled by `firm-config-prettier`) |

---

## 13. v4.3.0 Feature Highlights

Released May 8 2026, v4.3.0 adds the following utilities relevant to the monorepo:

| Feature | Details |
|---|---|
| `@container-size` | Adapt components to parent container size |
| `scrollbar-*` | `scrollbar-auto`, `scrollbar-thin`, `scrollbar-none`; `scrollbar-thumb-*`, `scrollbar-track-*` colour utilities; `scrollbar-gutter-*` |
| `zoom-*` | CSS `zoom` for embedded content or accessibility |
| `tab-*` | Typographic tab size for code‑block rendering |
| Stacked `@variant` | `@variant hover:focus { … }` for auto‑composing compound variants |
| Compound `@variant` | `@variant hover, focus { … }` for comma‑separated selectors |

---

## References

- [Tailwind CSS v4.3.0 Release (GitHub, May 8 2026)](https://github.com/tailwindlabs/tailwindcss/releases/tag/v4.3.0)
- [Sharing Tailwind CSS Styles Across Apps in a Monorepo (Nx Blog, April 2026)](https://nx.dev/blog/sharing-tailwind-styles-nx-monorepo)
- [Tailwind CSS v4 — What Actually Changed (Dev.to, April 2026)](https://dev.to/malahim_haseeb_981126d794/tailwind-css-v4-what-actually-changed-and-what-it-means-for-your-nextjs-project-472f)
- [Multiple Portals, One Codebase: Scalable Theming with Tailwind v4 (Wawandco, Sept 2025)](https://wawand.co/blog/posts/managing-multiple-portals-with-tailwind/)
- [CSS Cascade Layers Finally Made My Design System Predictable (Dev.to, April 2026)](https://dev.to/raxxostudios/css-cascade-layers-finally-made-my-design-system-predictable-5gg5)
- [Tailwind CSS v4: What Changed and Why It Matters (Dev.to, March 2026)](https://dev.to/raxxostudios/tailwind-css-v4-what-changed-and-why-it-matters-1gck)
- [Tailwind CSS v4 Deep Dive (Dev.to, February 2026)](https://dev.to/dataformathub/tailwind-css-v4-deep-dive-why-the-oxide-engine-changes-everything-in-2026-2595)
- [Tailwind CSS 4 — Steve Kinney Course (March 2026)](https://stevekinney.com/courses/tailwind/tailwind-4)
- [Tailwind Best Practices — Steve Kinney (March 2026)](https://stevekinney.com/courses/tailwind/tailwind-best-practices)
- [Configure Tailwind v4 with Angular in an Nx Monorepo (Nx Blog, January 2026)](https://nx.dev/blog/setup-tailwind-4-angular-nx-workspace)
- [Tailwind + Next.js: The Complete Setup Guide 2026 (DesignRevision, February 2026)](https://designrevision.com/blog/tailwind-nextjs-setup)
- [Theme System — tailwindlabs/tailwindcss DeepWiki](https://deepwiki.com/tailwindlabs/tailwindcss/2.2-theme-system)
- [Fixing Tailwind Culling in Monorepos (December 2025)](https://torbensko.com/fixing-tailwind-culling-monorepos/)
- [prettier-plugin-tailwindcss v0.8.0 — Monorepo Support](https://github.com/tailwindlabs/prettier-plugin-tailwindcss/releases/tag/v0.8.0)
