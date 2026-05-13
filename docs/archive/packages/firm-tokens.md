# `firm-ui` — Package Planning Document

**Component Library · Design System · React Server Components Default · CSS Custom Properties · Tailwind Utilities · Accessibility‑First · Zero Tenant Awareness**

---

## 0. Purpose & Architectural Position

`firm-ui` is the **single component library** for the entire platform. It provides a set of primitive, layout, and composite components that render the visual identity defined by `firm-tokens`. Every application and feature package uses these components to build user interfaces — no application imports raw HTML elements styled ad‑hoc.

Components have **zero knowledge of business logic, tenant identity, or feature‑specific workflows**. They are pure presentation and behaviour — their visual values come exclusively from CSS custom properties (injected via `data‑theme`). The library enforces the platform’s accessibility and UX consistency guarantees.

**Layer placement:** Layer 5 (UI, Theming & Configuration), Wave 6 — built after `firm-tokens` and before `firm-config`. It depends on:
- `firm-tokens` (generated CSS and TypeScript token constants)
- `firm-config-tailwind` (shared Tailwind preset that maps tokens to utilities)
- `firm-config-typescript` (build infrastructure)
- React 19.2+ and Next.js 16.2+ (peer dependencies — delivered by the consuming application)

**What it owns:**

| Domain | Mechanism |
|---|---|
| Primitive components | `Button`, `Input`, `Select`, `Textarea`, `Checkbox`, `Radio`, `Switch`, `Label`, `Badge`, `Avatar`, `Spinner` |
| Layout components | `Container`, `Grid`, `Flex`, `Stack`, `Section`, `Card`, `Modal`, `Drawer` |
| Typography components | `Heading`, `Text`, `Link`, `List` |
| Form components | `Form`, `FormField`, `FormError`, `FormSubmit` — composition wrappers around primitives |
| Feedback components | `Alert`, `Toast`, `Tooltip`, `Progress` |
| Utility components | `VisuallyHidden`, `FocusTrap`, `AriaAnnouncer` |
| Theme‑agnostic contract | Every component references only `var(--firm‑…)` for visual values; no hardcoded colours or dimensions |
| Accessibility tests | Every component ships with an `axe‑core` test suite; zero critical violations permitted |
| Storybook catalogue | For documentation and visual regression testing (Chromatic) |
| Server Components by default | All components are React Server Components unless they contain state, effects, or event handlers; then they are `'use client'` |

---

## 1. Immutable Rules

| Rule | Rationale |
|---|---|
| **Every visual value comes from a CSS custom property.** No hardcoded colours, font sizes, spacing, or radii. | Visual changes propagate instantly from `firm-tokens`; tenant theming works via CSS overrides. |
| **Components know nothing about tenants.** The `data-theme` attribute is set by the application shell; components simply reference variables. | A single component library serves every client. |
| **Server Components are the default.** Only components needing interactivity (state, effects, event handlers) are marked `'use client'`. | Aligns with Next.js 16 best practices; reduces bundle size. |
| **Every component must pass an accessibility test.** No critical or serious violations in `axe‑core` are allowed. | Commitment to WCAG 2.2 AA. |
| **Named exports only.** No default exports. | Consistent import patterns. |
| **All components are tree‑shakable.** No barrel imports that pull in the entire library; each component is a separate entry point or the bundler supports tree‑shaking. | Minimises client bundle. |
| **`exports` field is the contract boundary.** Consumers import from `firm-ui` or `firm-ui/button`, etc. | |
| **No business logic.** Components receive data via props; they never fetch data, mutate stores, or call business rules. | They are pure presentation; feature packages wrap them with data. |
| **CSS is applied via Tailwind utilities referencing design tokens.** The `@theme` block in `firm-config-tailwind` maps `--firm-*` tokens to utility classes. Components use `className` with Tailwind utilities. | Consistent styling approach; easy to override per tenant if needed. |

---

## 2. Component Architecture

### 2.1 Styling Strategy

Components use Tailwind CSS utilities that reference design tokens. The Tailwind configuration in `firm-config-tailwind` defines:

```css
@theme {
  --color-primary: var(--firm-color-primary);
  --font-sans: var(--firm-font-sans);
  /* etc. */
}
```

Thus, a component writes:

```tsx
<button className="bg-primary text-canvas font-sans rounded-md px-4 py-2">
  Click me
</button>
```

No inline styles. No CSS modules. The styles are compiled by Tailwind into the application’s global CSS; the component library does **not** ship its own compiled CSS — it relies on the consumer’s Tailwind setup to scan `firm-ui` source files via the `@source` directive (see `firm-config-tailwind`’s README). This avoids duplicate CSS and ensures tenant overrides apply correctly.

### 2.2 React Server Components (RSC) by Default

All components are RSC unless they must be interactive. Interactive components (forms, modals, toggles) are marked with `'use client'` and use hooks (`useState`, `useEffect`, etc.) sparingly; they accept minimally necessary client logic.

**Example RSC component (server):**
```tsx
// packages/firm-ui/src/Heading.tsx
import type { ReactNode, HTMLAttributes } from 'react';

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel;
  children: ReactNode;
}

export const Heading = ({ level = 'h2', children, className, ...props }: HeadingProps) => {
  const Tag = level;
  return (
    <Tag className={`text-2xl font-semibold font-heading text-ink ${className ?? ''}`} {...props}>
      {children}
    </Tag>
  );
};
```

**Example client component:**
```tsx
// packages/firm-ui/src/Modal.tsx
'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { FocusTrap } from './FocusTrap';

export const Modal = ({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) => {
  // ...
};
```

### 2.3 Accessibility Mandate

Every interactive component must include appropriate ARIA attributes, keyboard navigation, and focus management. The test suite uses `@testing-library/react` and `axe‑core` to run accessibility audits. A shared test helper `renderAndCheckA11y(component)` is provided. No component merges to `main` with a critical or serious violation.

### 2.4 Composition over Configuration

Components are designed to be composed. For example, `Form` is not a monolithic component but a composition of `FormField`, `Input`, `FormError`, etc. This allows maximum flexibility while retaining consistent error display and layout.

---

## 3. Module Inventory

```
packages/firm-ui/
├── src/
│   ├── index.ts                     # Barrel re‑export (but tree‑shakable)
│   ├── primitives/
│   │   ├── Button.tsx               # variant: primary, secondary, ghost; size: sm, md, lg
│   │   ├── Input.tsx                # text input, controlled/uncontrolled
│   │   ├── Select.tsx
│   │   ├── Textarea.tsx
│   │   ├── Checkbox.tsx
│   │   ├── Radio.tsx
│   │   ├── Switch.tsx
│   │   ├── Label.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   └── Spinner.tsx
│   ├── layout/
│   │   ├── Container.tsx
│   │   ├── Grid.tsx
│   │   ├── Flex.tsx
│   │   ├── Stack.tsx
│   │   ├── Section.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx                # 'use client'
│   │   └── Drawer.tsx               # 'use client'
│   ├── typography/
│   │   ├── Heading.tsx
│   │   ├── Text.tsx
│   │   ├── Link.tsx
│   │   └── List.tsx
│   ├── forms/
│   │   ├── Form.tsx
│   │   ├── FormField.tsx
│   │   ├── FormError.tsx
│   │   └── FormSubmit.tsx
│   ├── feedback/
│   │   ├── Alert.tsx
│   │   ├── Toast.tsx                # 'use client'
│   │   ├── Tooltip.tsx
│   │   └── Progress.tsx
│   ├── utilities/
│   │   ├── VisuallyHidden.tsx
│   │   ├── FocusTrap.tsx            # 'use client'
│   │   └── AriaAnnouncer.tsx        # 'use client'
│   ├── hooks/                       # Shared hooks used by client components
│   │   ├── useDisclosure.ts
│   │   ├── useFocusTrap.ts
│   │   └── useMediaQuery.ts
│   └── types.ts                     # Common prop types (Size, Variant, etc.)
├── tests/
│   ├── primitives/                  # Each component has a test file
│   │   ├── Button.test.tsx
│   │   ├── Input.test.tsx
│   │   └── ...
│   ├── layout/
│   ├── forms/
│   ├── feedback/
│   └── utilities/
├── stories/                         # Storybook stories for each component (optional)
├── package.json
├── README.md
├── CHANGELOG.md
└── tsconfig.json
```

---

## 4. Key Patterns

### 4.1 Consistent Prop Interfaces

All components follow a consistent pattern for common styling and sizing:

```typescript
type Size = 'sm' | 'md' | 'lg';
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type CommonProps = {
  className?: string;
  'data-testid'?: string;
};
```

Every component accepts `className` to allow consumer overrides (but the default styling is built in). Components never accept arbitrary style props — only predefined variants and sizes.

### 4.2 Polymorphic Components

Where appropriate, components are polymorphic (e.g., `Heading` can be any heading level, `Link` can be `a` or Next.js `Link`). This is implemented with a simple `as` prop and TypeScript generics.

### 4.3 Theme‑Agnostic Component

A button’s background is always `bg-primary` (Tailwind) which resolves to `var(--firm-color-primary)`. The application shell sets `data-theme="client-acme"` on `<html>`, and the corresponding CSS override provides the brand‑specific value. The component never inspects tenant or theme — it’s purely CSS.

### 4.4 Accessibility Test Example

```tsx
// tests/primitives/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '../../src/primitives/Button';

expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
  const { container } = render(<Button>Click me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### 4.5 Tree‑Shaking

Consumers import components individually:

```typescript
import { Button } from 'firm-ui/primitive/Button';
```

or via a barrel that is tree‑shakable (Next.js 16 with Turbopack handles this automatically when `sideEffects: false` is set). The package `exports` map exposes each component path.

---

## 5. Package Configuration

### 5.1 `package.json`

```jsonc
{
  "name": "firm-ui",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./*": "./src/*.tsx",
    "./utilities/*": "./src/utilities/*.tsx",
    "./typography/*": "./src/typography/*.tsx",
    "./layout/*": "./src/layout/*.tsx",
    "./forms/*": "./src/forms/*.tsx",
    "./feedback/*": "./src/feedback/*.tsx",
    "./hooks/*": "./src/hooks/*.ts"
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts --sourcemap --external react --external react-dom --external next",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/ tests/ stories/",
    "test": "vitest run",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  },
  "peerDependencies": {
    "react": "^19.2.6",
    "react-dom": "^19.2.6",
    "next": "^16.2.6"
  },
  "dependencies": {
    "firm-tokens": "workspace:*"               // only for TS constants
  },
  "devDependencies": {
    "firm-config-typescript": "workspace:*",
    "firm-config-eslint": "workspace:*",
    "firm-config-tailwind": "workspace:*",      // for Tailwind IntelliSense when developing
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jest-axe": "^9.0.0",
    "storybook": "^8.0.0",
    "@storybook/react": "^8.0.0",
    "vitest": "catalog:",
    "tsup": "catalog:",
    "typescript": "catalog:"
  },
  "sideEffects": false
}
```

**Why use `exports` wildcards?** So consumers can import `firm-ui/primitives/Button` which maps to `src/primitives/Button.tsx`. In monorepo consumption, this works via the bundler (Next.js/Turbopack) resolving to source files; for distribution we’d need a build step, but as a private package, the source is consumed directly.

### 5.2 `tsconfig.json`

```jsonc
{
  "extends": "firm-config-typescript/base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "rootDir": "./src",
    "outDir": "./dist",          // not used if source is consumed directly
    "noEmit": true               // apps build, not this package
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "tests", "stories"]
}
```

---

## 6. Test Strategy

| Suite | Tool | Coverage |
|---|---|---|
| Unit tests | Vitest + @testing-library/react | Render each component, verify default styling/variants, interactions (client components) |
| Accessibility | jest-axe | Every component; no critical/serious violations |
| Visual regression | Chromatic (via Storybook) | All component stories; catches unintended visual changes |
| Snapshot tests | Vitest snapshots | For static components, to catch unexpected DOM changes |

Accessibility tests are mandatory and run in CI; failing axe checks block merge.

---

## 7. Consumer Patterns

### 7.1 In a Next.js app

First, ensure the app’s Tailwind setup scans `firm-ui` source:

```css
/* apps/client-acme/src/app/globals.css */
@import 'firm-config-tailwind';
@source '../../../packages/firm-ui/src/**/*.tsx';
```

Then use components:

```tsx
import { Heading } from 'firm-ui/typography/Heading';
import { Button } from 'firm-ui/primitives/Button';
import { Container } from 'firm-ui/layout/Container';

export default function Page() {
  return (
    <Container>
      <Heading level="h1">Welcome</Heading>
      <Button variant="primary">Get Started</Button>
    </Container>
  );
}
```

### 7.2 Theming

The app root layout sets the `data-theme` attribute:

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="client-acme">
      <body>{children}</body>
    </html>
  );
}
```

The client’s CSS overrides (loaded via `firm-config`) provide the token values for that theme. `firm-ui` components automatically reflect those colours and fonts.

### 7.3 Feature Packages

Feature packages (Layer 6) import `firm-ui` components and compose them with business logic. They never redefine visual styles; they only pass data to `firm-ui` components.

---

## 8. Build Order & Dependency Map

```
firm-config-typescript (Layer 0)
          ↓
firm-tokens (Layer 5) ──── produces CSS variables and TS constants
          ↓
firm-ui (this package) ──── consumes tokens, references Tailwind utilities
```

`firm-ui` also depends on `firm-config-tailwind` (dev only) for IDE support; runtime styles come from the app’s compiled Tailwind CSS.

---

## 9. Interface Freeze & Governance

- After the initial design system release, component prop interfaces (variant names, sizes) are frozen. Adding new variants is minor; removing or renaming is major.
- Visual design tokens are owned by `firm-tokens`; `firm-ui` only references them.
- Accessibility: no component can regress below existing accessibility score; any PR that introduces a new critical violation is blocked.
- New components must include accessibility tests and Storybook stories.
- All components are exported by named export; default exports are prohibited by ESLint.

---

## 10. Documentation Requirements

- **README.md**: Setup for app consumers, component catalogue with examples, theming guide, accessibility statement.
- **Storybook**: Interactive documentation with knobs for variants and sizes; hosted publicly for agency-wide reference.
- **CHANGELOG.md**: Component additions, breaking changes (renames/removals), accessibility fixes.

---

## 11. Next Package

After `firm-ui`, the next Layer 5 package is **`firm-config`** — tenant configuration resolution, feature flags, SEO, per‑client theme injection.

---

## References

- [React Server Components](https://react.dev/reference/rsc/server-components)
- [Next.js 16 RSC integration](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Radix UI (primitives inspiration)](https://www.radix-ui.com/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [Tailwind CSS Utility‑First](https://tailwindcss.com/docs/utility-first)