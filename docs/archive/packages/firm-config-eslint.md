# `firm-config-eslint` — Package Planning Document

**ESLint v10.3+ Flat Config · TypeScript Strict · Monorepo Boundary Enforcement · Import Sorting · Oxlint Fast Gate**

---

## 0. Purpose & Architectural Position

`firm-config-eslint` is the **single source of truth for all JavaScript and TypeScript linting rules** in the monorepo. It provides a flat-config preset that every package, application, and service extends. It belongs to Layer 0 (Build & Constraint) — it contains **no runtime code**, only configuration, and is the foundational linting constraint system for the platform.

**Layer placement:** Layer 0, Wave 0 — built immediately after `firm-config-typescript` and in parallel with `firm-config-prettier`.

**2026 context:** ESLint v10 (February 6 2026) completes the flat config migration. `LegacyESLint` is gone. `shouldUseFlatConfig()` unconditionally returns `true`. The `.eslintrc.*` format is fully removed. `next lint` is removed in Next.js 16. JSX reference tracking is built into ESLint v10, eliminating plugin workarounds. The v9 End-of-Life is **August 6 2026**.

---

## 1. Immutable Rules

| Rule | Rationale |
|---|---|
| **Flat config only.** `eslint.config.ts` (or `.mjs`) format. No `.eslintrc` anywhere. | ESLint v10 removes `LegacyESLint` entirely. |
| **ESM import syntax.** All config files use `import`/`export`. No `require()`. | Consistent with `"type": "module"`. Required by ESLint v10. |
| **`@eslint/js` + `typescript-eslint` as foundation.** Extends `eslint.configs.recommended` and TypeScript‑aware presets. | Industry standard for TypeScript codebases in 2026. |
| **`projectService: true` for typed linting.** No `project` paths. | `typescript-eslint` v8 stabilised `projectService`, requiring zero configuration for monorepos. |
| **`eslint-config-prettier` last in `extends`.** | Disables all ESLint formatting rules that conflict with Prettier. Must come last. |
| **No `eslint-plugin-prettier`.** Prettier runs as a separate formatting tool. | Single responsibility: ESLint for correctness, Prettier for formatting. |
| **Named `name` property on every config object.** | Required by ESLint v10 for config inspector debugging. |
| **Global ignores: `**/node_modules`, `**/dist`, `**/.turbo`, `**/.next`, `**/coverage`.** | Prevents linting of build output and dependencies. |
| **Import order enforced with groups.** Five groups: node built‑ins, external, `@firm/*` internal, `@/` absolute, relative. | Consistent import structure across the entire monorepo. |
| **Architectural boundaries enforced per layer.** `packages/` cannot import from `apps/`. Adapters only import from Layers 0, 2, 4. | Preserves the 8‑layer architecture defined in `50-Layers.md`. |
| **No `any` without justification.** `@typescript-eslint/no-explicit-any: error`. | Enforces TypeScript strictness at the lint layer. |
| **Console statements banned in production code.** `no-console: error` (except `console.error` for error handling). | Logging must go through `firm-logger`. |
| **Tree‑shaking safe: `no-default-export` enforced on `packages/*`.** | Named exports only for shared packages. |
| **`exports` field is the sole public API boundary.** | Architectural contract enforced by `eslint-plugin-boundaries`. |

---

## 2. Multi‑Compiler Strategy: ESLint + Oxlint

The platform uses **both** ESLint and Oxlint in a layered approach.

| Layer | Tool | Purpose | Performance |
|---|---|---|---|
| **Pre‑commit / Fast CI gate** | **Oxlint** | Catch obvious rule violations at Rust speed. 77×–181× faster than ESLint. | ~300ms across entire monorepo |
| **Full CI / typed rules** | **ESLint** | Type‑aware linting, boundary enforcement, custom rules, import order. | 10s+ across monorepo |

**Oxlint JS Plugins Alpha (March 2026):** loading standard ESLint plugins. Conformance rates:
- ESLint built‑in rules: 33,006 tests — **100%**
- React hooks (including React Compiler rules): 5,007 tests — **100%**
- ESLint Stylistic: 18,310 tests — **99.99%**
- Testing Library: 17,016 tests — **100%**

**Limitation:** No custom type‑aware rules from third‑party plugins. TypeScript‑ESLint's built‑in type‑aware rules are already implemented natively in Oxlint. Only user‑written type‑aware rules from external plugins are unsupported.

**`oxlint --format agent`** (v1.63.0+) produces machine‑readable output for AI coding agents.

**Migration path:** When Oxlint's plugin compatibility reaches parity, `eslint` dependency can be removed in favour of Oxlint‑only. The `@oxlint/migrate` tool enables automatic transition from ESLint flat config.

---

## 3. Module Inventory

```
packages/firm-config-eslint/
├── src/
│   ├── index.ts                  # Default export: complete flat config array
│   ├── presets/
│   │   ├── base.ts               # Shared ignores, JS rules, import plugin, boundaries
│   │   ├── typescript.ts         # TS‑specific: tseslint strict, typed checking
│   │   ├── react.ts              # React + React Hooks rules (for apps)
│   │   ├── nextjs.ts             # @next/eslint-plugin-next rules (for client apps)
│   │   ├── boundaries.ts         # Layer‑based element types + dependency rules
│   │   └── imports.ts            # Import order groups configuration
│   └── types.ts                  # TypeScript types for config factory options
├── eslint.config.ts              # Self‑referencing (lints this package with its own rules)
├── .oxlintrc.json                # Oxlint mirror: fast pre‑commit rules
├── package.json
├── README.md
└── CHANGELOG.md
```

---

## 4. Key Patterns

### 4.1 `tseslint.config()` Helper

All configurations use `tseslint.config()` from `typescript-eslint`:

```typescript
import tseslint from 'typescript-eslint';
import js from '@eslint/js';

export default tseslint.config(
  { name: 'firm/ignores', ignores: ['**/node_modules', '**/dist', '**/.turbo', '**/.next', '**/coverage'] },
  js.configs.recommended,
);
```

### 4.2 Typed Linting via `projectService`

```typescript
{
  name: 'firm/typescript-typed',
  languageOptions: {
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
  rules: {
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
  },
}
```

`projectService: true` is the recommended configuration for `typescript-eslint` v8+. It uses the same type information services as editors, supporting TypeScript project references natively.

### 4.3 Import Order with `eslint-plugin-perfectionist`

Import sorting uses `eslint-plugin-perfectionist` v5.3+ with the **array‑based `customGroups` API** (the old object‑based API was **removed** in v5.0.0):

```typescript
import perfectionist from 'eslint-plugin-perfectionist';

{
  name: 'firm/import-order',
  plugins: { perfectionist },
  rules: {
    'perfectionist/sort-imports': ['error', {
      type: 'natural',
      order: 'asc',
      groups: [
        'builtin',
        'external',
        '@firm/internal',
        '@firm/internal-type',
        ['parent', 'sibling', 'index'],
      ],
      customGroups: [
        { groupName: '@firm/internal', elementNamePattern: '@firm/**' },
        { groupName: '@firm/internal-type', selector: 'type', elementNamePattern: '@firm/**' },
      ],
      newlinesBetween: 'always',
    }],
    'perfectionist/sort-exports': 'error',
    'perfectionist/sort-named-imports': 'error',
    'perfectionist/sort-named-exports': 'error',
  },
}
```

**Group ordering maps to `CONVENTIONS.md`:**
1. Node.js built‑ins (`node:path`)
2. External packages (`react`, `next`, `zod`)
3. `@firm/*` internal packages
4. Absolute imports from `@/`
5. Relative imports

The `internal` group in perfectionist refers to imports from within the same package — **not** monorepo workspace packages. For `@firm/*` workspace packages, use `customGroups` with `elementNamePattern`.

### 4.4 Architectural Boundaries with `eslint-plugin-boundaries`

```typescript
import boundaries from 'eslint-plugin-boundaries';

{
  name: 'firm/boundaries',
  plugins: { boundaries },
  settings: {
    'import/resolver': {
      typescript: { project: './tsconfig.base.json' },
    },
    'boundaries/elements': [
      { type: 'config', pattern: 'packages/firm-config-*' },
      { type: 'utils', pattern: 'packages/firm-{env,utils,errors,crypto,logger}' },
      { type: 'data', pattern: 'packages/firm-{types,validators,api-contracts,db,cache}' },
      { type: 'security', pattern: 'packages/firm-{security,auth,consent}' },
      { type: 'observability', pattern: 'packages/firm-{observability,health}' },
      { type: 'ui', pattern: 'packages/firm-{tokens,ui,config}' },
      { type: 'feature', pattern: 'packages/firm-*' },
      { type: 'adapter', pattern: 'packages/adapters-*' },
      { type: 'app', pattern: 'apps/*' },
      { type: 'service', pattern: 'services/*' },
    ],
    'boundaries/ignore': ['**/*.test.*', '**/*.spec.*'],
  },
  rules: {
    'boundaries/element-types': ['error', {
      default: 'disallow',
      rules: [
        { from: ['app', 'feature', 'adapter', 'service'], allow: ['config', 'utils', 'data', 'security', 'observability', 'ui'] },
        { from: 'feature', allow: ['adapter', 'feature'] },
        { from: 'adapter', allow: ['config', 'data', 'observability'] },
        { from: 'app', allow: ['feature', 'adapter'] },
        { from: 'service', allow: ['feature'] },
      ],
    }],
  },
}
```

**Critical dependency:** `eslint-import-resolver-typescript`. Without it, the boundaries plugin cannot map imports to element types — a silent failure.

### 4.5 React & Next.js Rules

**For client applications only:**

```typescript
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';

// React Hooks rules — v7.1.1 minimum (ESLint v10 support)
{
  name: 'firm/react-hooks',
  files: ['**/*.{tsx,jsx}'],
  plugins: { 'react-hooks': reactHooksPlugin },
  rules: {
    // recommended preset: 15 stable Compiler rules + 2 core rules (rules-of-hooks, exhaustive-deps)
    ...reactHooksPlugin.configs.recommended.rules,
  },
},

// Next.js rules
{
  name: 'firm/nextjs',
  files: ['apps/clients/**/*.{ts,tsx,js,jsx}'],
  plugins: { '@next/next': nextPlugin },
  rules: {
    ...nextPlugin.configs.recommended.rules,
    ...nextPlugin.configs['core-web-vitals'].rules,
  },
}
```

**`recommended-latest` vs `recommended`:** The `recommended-latest` preset (16 rules, adds `void-use-memo`) includes "bleeding edge experimental compiler rules" that may produce false positives. Use `recommended` for production CI; allow apps to opt into `recommended-latest` for development only.

### 4.6 `eslint-plugin-react` — Current Status & Workaround

As of May 10 2026, `eslint-plugin-react` does **not** natively support ESLint v10. PR #3979 (opened February 9 2026) remains open and in draft, blocked on `eslint-plugin-import#3227`. The plugin calls `context.getFilename()` which was removed in ESLint v10, causing a hard runtime crash.

**Confirmed workaround** — hardcode React version in settings:

```typescript
{
  name: 'firm/react-core',
  files: ['apps/**/*.{tsx,jsx}'],
  plugins: { react: reactPlugin },
  settings: {
    react: { version: '19.2.6' },  // NOT 'detect' — avoids getFilename() crash
  },
  rules: {
    ...reactPlugin.configs.flat.recommended.rules,
    ...reactPlugin.configs.flat['jsx-runtime'].rules,
    'react/prop-types': 'off',
  },
}
```

When `version` is a specific value rather than `'detect'`, the auto‑detection path that calls `getFilename()` is never entered.

**pnpm peer dependency override** (still required):

```yaml
# pnpm-workspace.yaml
peerDependencyRules:
  allowAny:
    - eslint-plugin-react
```

**Future replacement option:** `@eslint-react/eslint-plugin@^5.7.0` (released May 8 2026) is ESLint v10 native, 4–7× faster, and has entered Long‑Term Support with a feature freeze. It includes a migration guide from `eslint-plugin-react`. This should be evaluated as a separate ADR. Several `eslint-plugin-react` rules have no direct equivalent but are made redundant by ESLint v10's built‑in JSX reference tracking and variable tracking.

**Trigger to revisit:** When PR #3979 merges, remove both the hardcoded `settings.react.version` and the `peerDependencyRules` override.

### 4.7 `eslint-plugin-import-x` replacement

`eslint-plugin-import` is replaced by `eslint-plugin-import-x@^4.16.0`, the maintained fork with ESLint v10 flat‑config support. The WordPress/Gutenberg monorepo confirmed this as the standard migration path.

### 4.8 Prettier Integration

```typescript
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  // ... all other configs ...
  eslintConfigPrettier,  // Must be last — disables all formatting rules
);
```

No `eslint-plugin-prettier` is used. Formatting is handled exclusively by `firm-config-prettier`.

### 4.9 Single Root Config

The platform uses a **single root configuration** with file‑pattern scoping. ESLint v10's config file lookup starts from the directory of each linted file, enabling package‑specific rule scoping via `files` patterns.

### 4.10 Oxlint Mirror Configuration

```json
// .oxlintrc.json (monorepo root)
{
  "$schema": "https://raw.githubusercontent.com/oxc-project/oxc/main/npm/oxlint/configuration_schema.json",
  "jsPlugins": [
    "eslint-plugin-react-hooks"
  ],
  "plugins": [],
  "categories": {
    "correctness": "error",
    "suspicious": "error",
    "pedantic": "warn",
    "style": "warn",
    "perf": "warn"
  },
  "rules": {
    "no-console": "error",
    "no-debugger": "error"
  },
  "ignorePatterns": [
    "node_modules",
    "dist",
    ".turbo",
    ".next",
    "coverage",
    "storybook-static"
  ],
  "env": {
    "node": true,
    "browser": false
  }
}
```

**React Compiler rules in Oxlint:** Use the `oxlint-config-react-hooks-js` bridge package (`recommended.json` preset). Performance note: this loads `eslint-plugin-react-hooks` as a JS plugin, which is slower than Oxlint's native Rust rules. When Oxlint ships native React Compiler rules, this bridge should be removed.

---

## 5. Package Configuration

### 5.1 `package.json`

```jsonc
{
  "name": "firm-config-eslint",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./presets/base": "./dist/presets/base.js",
    "./presets/typescript": "./dist/presets/typescript.js",
    "./presets/react": "./dist/presets/react.js",
    "./presets/nextjs": "./dist/presets/nextjs.js",
    "./presets/boundaries": "./dist/presets/boundaries.js",
    "./presets/imports": "./dist/presets/imports.js"
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "lint:self": "eslint . --config eslint.config.ts",
    "lint:self:fast": "oxlint ."
  },
  "dependencies": {
    "@eslint/js": "^10.0.1",
    "@typescript-eslint/eslint-plugin": "^8.59.2",
    "@typescript-eslint/parser": "^8.59.2",
    "typescript-eslint": "^8.59.2",
    "eslint-config-prettier": "^10.1.0",
    "eslint-import-resolver-typescript": "^4.0.0",
    "eslint-plugin-boundaries": "^6.0.2",
    "eslint-plugin-import-x": "^4.16.0",
    "eslint-plugin-perfectionist": "^5.3.0",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react": "^7.37.5",
    "@next/eslint-plugin-next": "^16.2.6"
  },
  "peerDependencies": {
    "eslint": "^10.3.0"
  },
  "devDependencies": {
    "eslint": "^10.3.0",
    "oxlint": "^1.63.0",
    "tsup": "catalog:",
    "typescript": "catalog:"
  },
  "sideEffects": false
}
```

**Dependency strategy:** All ESLint plugins are listed as direct `dependencies` so consumers don't need to install them individually. `eslint` is in both `peerDependencies` (consumers must have it) and `devDependencies` (for self‑linting).

### 5.2 Self‑Referencing `eslint.config.ts`

```typescript
// packages/firm-config-eslint/eslint.config.ts
import { sharedConfig } from './src/index.js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...sharedConfig,
  {
    name: 'firm-config-eslint/self',
    rules: {
      'no-console': 'off',
    },
  },
);
```

---

## 6. Consumer Pattern

Every package in the monorepo adds:

```jsonc
// In any package's package.json
{
  "scripts": {
    "lint": "eslint . --max-warnings 0",
    "lint:fast": "oxlint ."
  }
}
```

```typescript
// eslint.config.ts (in each package, for IDE support)
import { sharedConfig } from 'firm-config-eslint';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...sharedConfig,
  {
    name: '<package-name>/local',
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
```

For the monorepo root:

```typescript
// eslint.config.ts (repo root)
import tseslint from 'typescript-eslint';
import js from '@eslint/js';
import perfectionist from 'eslint-plugin-perfectionist';
import boundaries from 'eslint-plugin-boundaries';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  // ── Global ignores ──
  {
    name: 'firm/global-ignores',
    ignores: ['**/node_modules', '**/dist', '**/.turbo', '**/.next', '**/coverage', '**/storybook-static'],
  },

  // ── Base JS rules ──
  {
    name: 'firm/base-js',
    extends: [js.configs.recommended],
    rules: {
      'no-console': 'error',
      'no-debugger': 'error',
      'no-alert': 'error',
    },
  },

  // ── TypeScript rules ──
  {
    name: 'firm/typescript',
    files: ['**/*.{ts,tsx,mts,cts}'],
    extends: [
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
        fixStyle: 'separate-type-imports',
      }],
    },
  },

  // ── Import sorting ──
  {
    name: 'firm/import-order',
    plugins: { perfectionist },
    rules: {
      'perfectionist/sort-imports': ['error', {
        type: 'natural', order: 'asc',
        groups: [
          'builtin', 'external',
          '@firm/internal', '@firm/internal-type',
          ['parent', 'sibling', 'index'],
        ],
        customGroups: [
          { groupName: '@firm/internal', elementNamePattern: '@firm/**' },
          { groupName: '@firm/internal-type', selector: 'type', elementNamePattern: '@firm/**' },
        ],
        newlinesBetween: 'always',
      }],
      'perfectionist/sort-exports': 'error',
      'perfectionist/sort-named-imports': 'error',
      'perfectionist/sort-named-exports': 'error',
    },
  },

  // ── Architectural boundaries ──
  {
    name: 'firm/boundaries',
    plugins: { boundaries },
    settings: {
      'import/resolver': { typescript: { project: './tsconfig.base.json' } },
      'boundaries/elements': [
        { type: 'config', pattern: 'packages/firm-config-*' },
        { type: 'utils', pattern: 'packages/firm-{env,utils,errors,crypto,logger}' },
        { type: 'data', pattern: 'packages/firm-{types,validators,api-contracts,db,cache}' },
        { type: 'security', pattern: 'packages/firm-{security,auth,consent}' },
        { type: 'observability', pattern: 'packages/firm-{observability,health}' },
        { type: 'ui', pattern: 'packages/firm-{tokens,ui,config}' },
        { type: 'feature', pattern: 'packages/firm-*' },
        { type: 'adapter', pattern: 'packages/adapters-*' },
        { type: 'app', pattern: 'apps/*' },
        { type: 'service', pattern: 'services/*' },
      ],
      'boundaries/ignore': ['**/*.test.*', '**/*.spec.*'],
    },
    rules: {
      'boundaries/element-types': ['error', {
        default: 'disallow',
        rules: [
          { from: ['app', 'feature', 'adapter', 'service'], allow: ['config', 'utils', 'data', 'security', 'observability', 'ui'] },
          { from: 'feature', allow: ['adapter', 'feature'] },
          { from: 'adapter', allow: ['config', 'data', 'observability'] },
          { from: 'app', allow: ['feature', 'adapter'] },
          { from: 'service', allow: ['feature'] },
        ],
      }],
    },
  },

  // ── React core rules (apps only) ──
  {
    name: 'firm/react-core',
    files: ['apps/**/*.{tsx,jsx}'],
    plugins: { react: reactPlugin },
    settings: {
      react: { version: '19.2.6' },  // NOT 'detect' — see §4.6
    },
    rules: {
      ...reactPlugin.configs.flat.recommended.rules,
      ...reactPlugin.configs.flat['jsx-runtime'].rules,
      'react/prop-types': 'off',
    },
  },

  // ── React Hooks rules (all TSX/JSX files) ──
  {
    name: 'firm/react-hooks',
    files: ['**/*.{tsx,jsx}'],
    plugins: { 'react-hooks': reactHooksPlugin },
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
    },
  },

  // ── Next.js rules (client apps only) ──
  {
    name: 'firm/nextjs',
    files: ['apps/clients/**/*.{ts,tsx,js,jsx}'],
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },

  // ── Prettier — must be last ──
  eslintConfigPrettier,
);
```

---

## 7. CI Integration

```yaml
# In GitHub Actions workflow
- name: Fast lint (Oxlint)
  run: pnpm lint:fast
  # ~300ms for entire monorepo. Catches 80% of issues before ESLint.

- name: Full lint (ESLint)
  run: pnpm turbo lint --filter="...[origin/main]"
  # Type-aware rules, boundaries, import sorting. ~10s+ but comprehensive.

- name: Config validation
  run: pnpm --filter firm-config-eslint run lint:self
```

---

## 8. Version Compatibility Table (May 10 2026)

| Package | Version | Status |
|---|---|---|
| `eslint` | `^10.3.0` | Stable |
| `@eslint/js` | `^10.0.1` | Stable |
| `typescript-eslint` | `^8.59.2` | Stable |
| `eslint-plugin-react-hooks` | `^7.1.1` | Stable (ESLint v10 native) |
| `eslint-plugin-boundaries` | `^6.0.2` | Stable (ESLint v10 native) |
| `eslint-plugin-perfectionist` | `^5.3.0` | Stable (array‑based `customGroups` API) |
| `eslint-plugin-import-x` | `^4.16.2` | Stable (ESLint v10 native) |
| `eslint-plugin-react` | `^7.37.5` ⚠️ | Usable with hardcoded version workaround; PR #3979 pending |
| `@eslint-react/eslint-plugin` | `^5.7.5` | ESLint v10 native, LTS, optional replacement |
| `@next/eslint-plugin-next` | `^16.2.6` | Stable (flat config default) |
| `eslint-config-prettier` | `^10.1.0` | Stable |
| `eslint-import-resolver-typescript` | `^4.0.0` | Required for boundaries plugin |
| `oxlint` | `^1.63.0` | Stable (weekly cadence) |

For the `eslint-plugin-react` workaround, also add to `pnpm-workspace.yaml`:

```yaml
peerDependencyRules:
  allowAny:
    - eslint-plugin-react
```

---

## 9. Interface Freeze & Governance

- After Wave 0, the shared ESLint config is frozen. Rule changes affect every package.
- **Adding** a new rule or plugin → **minor**, with migration guide.
- **Removing** a rule → **major**, requires an ADR.
- **Tightening** a rule (e.g., `warn` → `error`) → **minor**.
- Every PR that changes ESLint configuration must run `pnpm turbo lint --filter="...[origin/main]"` in CI.
- Boundary rule violations must be **error** severity — never `warn` in CI.

---

## 10. Documentation Requirements

- **README.md**: Installation (one‑line consumer usage), Rule Reference (all enabled rules with rationale), Preset Overview, Oxlint Mirror Configuration, CI Integration, `eslint-plugin-react` workaround documentation, Architectural Boundary Map.
- **CHANGELOG.md**: Every rule addition/removal/tightening with migration instructions.
- All exported presets carry TSDoc comments explaining their purpose.

---

## 11. Remaining Tracked Items

| Item | Status | Action |
|---|---|---|
| `eslint-plugin-react` PR #3979 | Open, blocked on `eslint-plugin-import#3227` | Remove workaround when merged |
| `eslint-plugin-react` → `@eslint-react/eslint-plugin` migration | Future consideration | Evaluate as separate ADR |
| `eslint-plugin-react-hooks` `recommended-latest` graduation | Depends on React 19.x | Track React release notes |
| Oxlint native React Compiler rules | Not yet available | Remove `oxlint-config-react-hooks-js` bridge when shipped |
| ESLint v9 EOL | August 6 2026 | No action required (we baseline on v10) |
| ESLint v10.4.0 | Expected ~May 15 2026 | Renovate auto‑merge after CI passes |
| Oxlint v1.64.0 | Expected within days | Renovate auto‑merge after CI passes |

---

## References

- [ESLint v10.3.0 Release](https://eslint.org/blog/2026/05/eslint-v10.3.0-released/)
- [ESLint v10 Finalizes Flat Config](https://news.lavx.hu/article/eslint-v10-finalizes-flat-config-drops-legacy-support)
- [TypeScript-ESLint v8.59.2](https://www.npmjs.com/package/typescript-eslint)
- [Next.js 16 ESLint Documentation](https://nextjs.org/docs/app/api-reference/config/eslint)
- [eslint-plugin-perfectionist v5.3.0](https://github.com/azat-io/eslint-plugin-perfectionist)
- [eslint-plugin-boundaries v6.0.2](https://www.npmjs.com/package/eslint-plugin-boundaries)
- [eslint-plugin-react-hooks v7.1.1](https://www.npmjs.com/package/eslint-plugin-react-hooks)
- [eslint-plugin-react PR #3979](https://github.com/jsx-eslint/eslint-plugin-react/pull/3979)
- [eslint-plugin-import-x v4.16.2](https://www.npmjs.com/package/eslint-plugin-import-x)
- [@eslint-react/eslint-plugin v5.7.5](https://www.npmjs.com/package/@eslint-react/eslint-plugin)
- [Oxlint JS Plugins Alpha](https://oxc.rs/blog/2026-03-11-js-plugins-alpha)
- [Oxlint v1.63.0](https://github.com/oxc-project/oxc/releases)
- [WordPress/Gutenberg ESLint v10 Migration PR #76654](https://github.com/WordPress/gutenberg/pull/76654)