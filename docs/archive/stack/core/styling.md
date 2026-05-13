# Styling & Design System – How We Use Tailwind CSS and Design Tokens

This guide covers our CSS framework, design token pipeline, component theming, and white‑label architecture. For alternative tools or market context, see the archived research.

---

## 1. CSS Framework: Tailwind CSS v4.3

We use **Tailwind CSS v4.3** exclusively. No runtime CSS‑in‑JS (incompatible with RSC). CSS Modules are allowed for complex component‑specific styles only.

### Key v4 Features We Use

- **CSS‑first config** via `@theme` blocks (no `tailwind.config.js`).
- **OKLCH color system** for perceptual uniformity and P3 wide‑gamut support.
- **`color‑mix()` for opacity** – dynamic opacity variants without class explosion.
- **Native cascade layers** (`@layer base, components, utilities`).
- **Container queries** via `@container` and `@container-size` utilities.
- **Scrollbar utilities** – `scrollbar-thin`, `scrollbar-thumb-*` (first‑class since v4.3).
- **Logical properties** – `inline-s-*`, `inline-e-*` for RTL‑ready layouts.
- **No external plugins** for scrollbars or container queries (built in).

### Monorepo Setup

Shared styles are centralized in `packages/firm-tokens` and consumed by all client apps.

```
packages/firm-tokens/
├── src/
│   ├── base.css       ← Agency defaults (`@theme`)
│   ├── tokens.css     ← CSS custom properties (from DTCG)
│   └── themes/
│       └── acme.css   ← Per‑client override (`@theme override`)
```

Consumer app (`apps/clients/client-acme/global.css`):
```css
@import '@firm/tokens/base.css';
@import '@firm/tokens/tokens.css';
@theme override {
  --color-brand-primary: oklch(0.48 0.22 350);
}
```

---

## 2. Design Tokens (W3C DTCG 2025.10)

Design tokens are stored in a **W3C Design Tokens Community Group format** (`tokens.json`). They flow through **Style Dictionary v5.4** to produce:

- CSS custom properties (`variables.css`)
- TypeScript constants (`tokens.ts`)
- Tailwind `@theme` blocks (`tailwind-theme.css`)

**Pipeline:**
```
tokens.json (DTCG) → Style Dictionary → {variables.css, tokens.ts, tailwind-theme.css}
```

Tokens follow a three‑layer hierarchy:
- **Core** (primitives: `color.blue.500`)
- **Brand** (semantic: `color.brand.primary`)
- **Context** (application: `color.card.background`)

No component‑level tokens.

---

## 3. White‑Label / Multi‑Brand Theming

We theme client sites by scoping CSS custom properties to the `data-theme` attribute on `<html>`.

```css
:root {
  --color-brand-primary: oklch(0.55 0.2 260);
}
[data-theme="acme"] {
  --color-brand-primary: oklch(0.48 0.22 350);
}
```

Components always reference `var(--color-brand-primary)` — never hardcoded values. The theme is applied server‑side via the root layout; zero client‑side JavaScript flicker.

Tailwind v4’s `@theme override` provides per‑client overrides without rebuilding the entire CSS framework.

### Dark Mode Support
- **Configuration**: Define `data-theme="dark"` overrides in token files for dark theme variants
- **Component support**: All `@firm/ui` components respect the `color-scheme` CSS property and automatically switch between light/dark themes
- **Implementation**: Theme switching is handled server-side via `data-theme` attribute on `<html>` element; no client-side JavaScript flicker

---

## 4. Component Library (`@firm/ui`) & shadcn/ui V4

Our component library is a thin wrapper around **shadcn/ui V4** (Base UI primitives). Components:

- Consume design tokens via CSS custom properties.
- Default to Server Components; only become Client Components when they need interactivity.
- Follow WCAG 2.2 AA with built‑in ARIA attributes from Base UI.

We use the `new-york` style (Tailwind v4 + Base UI) as our starting point. Radix UI is still supported for existing components, but new work defaults to Base UI.

---

## 5. Responsive Strategy

- **Mobile‑first** – base styles for small screens, `md:` and `lg:` breakpoints enhance.
- **Container queries** – components adapt to parent width using `@container` and `@md:`, `@xl:` utilities.
- **RTL ready** – we use logical properties (`ms-*`, `me-*`, `pbs-*`) instead of physical (`ml-*`, `mr-*`).

---

## 6. Animation

- **Simple animations** (hover effects, entrance fades) use pure CSS (`transition`, `animation`) — no JavaScript.
- **Scroll‑triggered animations** use native CSS `animation-timeline` (Chrome/Edge 146+).
- **Complex interactions** (spring physics, orchestration) use Motion (v12.38). We import `LazyMotion` and `domAnimation` to minimize bundle size on static pages.

### Bundle Size Impact
| Component Type | Added KB | Recommendation |
|---------------|-----------|-------------|
| Modal with animations | ~45 KB | Use `LazyMotion` and `domAnimation` only |
| Tooltip with hover | ~12 KB | Pure CSS preferred for simple interactions |
| Complex dashboard | ~80 KB | Acceptable for data-heavy components |

---

## 7. Visual Regression Testing

Every `@firm/ui` component has a Storybook story. Chromatic with SteadySnap captures pixel‑level snapshots across all configured themes (`data-theme`) in CI, catching regressions before merge.

---

## 8. Email Styling

Email templates are built with **React Email 6.0** and compiled to inlined HTML. Brand tokens are shared with `@firm/tokens` for consistency. See [email.md](../integrations/email.md).

---

*Related: [frontend.md](./frontend.md), [email.md](../integrations/email.md), [i18n.md](../features/i18n.md)*