# `firm-config-typescript` — Package Planning Document

**Shared TypeScript Strictness · TS 6.0+ / 7.0‑Ready · Project References · `@tsconfig/strictest` Foundation · Zero Runtime**

---

## 0. Purpose & Architectural Position

`firm-config-typescript` is the **single source of truth for every TypeScript compiler option** in the monorepo. It provides a base‑level `tsconfig.base.json` that all packages extend, plus variant configurations for shared libraries, applications, and services. It belongs to Layer 0 (Build & Constraint) — it produces **no runtime code**, contains **no npm dependencies**, and is the foundational constraint system upon which all higher layers depend.

**Layer placement:** Layer 0, Wave 0 — the very first package built in CI, before any application or library package exists.

**Multi‑compiler guarantee:** Every configuration in this package is validated against both `tsc` (TypeScript 6.0) and `tsgo` (TypeScript 7.0 Go‑based compiler) to ensure zero‑warning operation across both compilers.

---

## 1. Immutable Rules

| Rule | Rationale |
|---|---|
| **No runtime code.** No `dependencies` field — only `devDependencies` (`typescript`). | Layer 0 constraint — configuration cannot introduce runtime imports. |
| **`strict: true` is non‑negotiable.** | Enables the full safety bundle (`strictNullChecks`, `strictFunctionTypes`, `noImplicitAny`, …). |
| **Extend `@tsconfig/strictest`** as the baseline. | Community‑standard maximum‑strictness base; covers most safety flags. |
| **`verbatimModuleSyntax: true` is required for all packages.** | Forces explicit `import type` — prevents silent import elision. Implies `isolatedModules: true`. |
| **`erasableSyntaxOnly: true` is required for all packages.** | Prohibits enums, namespaces, parameter properties. Required for `tsgo` compatibility and Node.js native type‑stripping. |
| **`noUncheckedIndexedAccess: true` is required.** | Makes `array[0]` return `T \| undefined`, preventing a common class of runtime errors. |
| **`exactOptionalPropertyTypes: true` is required at Maximum tier.** | Enforces stricter semantics for optional properties. Overrideable per package for Zod compatibility (see §1.1). |
| **`noUncheckedSideEffectImports: true` is required.** | Catches typos like `import …` where nothing is used (TS 6.0+ default). |
| **`forceConsistentCasingInFileNames: true` is required.** | Prevents cross‑platform CI failures due to file‑name casing mismatches. |
| **`rootDir: "./src"` must be explicitly set.** | TS 6.0 changed the default to the directory containing `tsconfig.json` — explicit setting prevents output structure surprises. |
| **`types: []` (empty) is required; ambient types must be listed explicitly.** | The old default enumerated every `@types/` package. The new default loads nothing, reducing build times by 20‑50%. |
| **`moduleResolution: "bundler"` is the default for app and library packages.** | Aligns TypeScript module resolution with modern bundlers (Turbopack, Rolldown, Rspack). |
| **Named exports only.** No default exports. | Consistent import patterns. |
| **`exports` field is the sole public API boundary.** | Only `src/index.ts` reachable from outside. |

### 1.1 `exactOptionalPropertyTypes` & Zod v4

There is a known compatibility gap between `exactOptionalPropertyTypes: true` and Zod’s `.optional()` method, which infers `prop?: string` as `string | undefined` but marks the property as optional in the type system. When this flag is enabled, TypeScript may reject Zod‑inferred types for optional fields.

**Mitigation:**  
- At `base.json` level, the flag is inherited from `@tsconfig/strictest` (Maximum tier).  
- Packages that define Zod schemas (`firm‑validators`) may override `exactOptionalPropertyTypes: false` in their own `tsconfig.json` if the incompatibility causes build failures.  
- For other Maximum‑tier packages, keep the flag enabled.  
- Track [colinhacks/zod#635](https://github.com/colinhacks/zod/issues/635) and [colinhacks/zod#1510](https://github.com/colinhacks/zod/issues/1510); when Zod ships a fix, restore the flag universally.

---

## 2. Strictness Tiers

| Tier | Compiler Options | Applies to |
|---|---|---|
| **Maximum (default for packages & services)** | `strict: true` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` + `noImplicitOverride` + `erasableSyntaxOnly` + `verbatimModuleSyntax` + `isolatedDeclarations` + `forceConsistentCasingInFileNames` + `noUncheckedSideEffectImports` | All `packages/*`, `services/*` |
| **Standard (for apps)** | `strict: true` + `noUncheckedIndexedAccess` + `verbatimModuleSyntax` + `erasableSyntaxOnly` + `forceConsistentCasingInFileNames` | All `apps/*` (progressive migration path toward Maximum) |

---

## 3. Module Inventory

```
packages/firm-config-typescript/
├── src/
│   ├── index.ts              # Re‑exports all config factories + types
│   ├── base.json             # Root tsconfig shared by EVERY package
│   ├── shared-library.json   # For monorepo-internal libraries (composite + emit declarations)
│   ├── app.json              # For applications (Next.js, Astro, etc.)
│   ├── service.json          # For backend services / workers (Node.js, no DOM)
│   └── config-factory.ts     # createTsConfig(overrides) — programmatic helper
├── tsconfig.self-check.json  # Self‑validation of this package's source
├── package.json
├── README.md
└── CHANGELOG.md
```

---

## 4. Key Patterns

### 4.1 `base.json` — The Universal Root

Every package in the monorepo extends this file. It contains all strict‑tier flags that apply everywhere, with no environment‑specific settings.

```jsonc
// packages/firm-config-typescript/src/base.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@tsconfig/strictest/tsconfig.json",
  // @tsconfig/strictest v2.0.8 provides:
  //   strict, allowUnusedLabels:false, allowUnreachableCode:false,
  //   exactOptionalPropertyTypes, noFallthroughCasesInSwitch,
  //   noImplicitOverride, noImplicitReturns,
  //   noPropertyAccessFromIndexSignature, noUncheckedIndexedAccess,
  //   noUnusedLocals, noUnusedParameters, isolatedModules,
  //   esModuleInterop, skipLibCheck
  "compilerOptions": {
    // ── Language & environment ──
    "target": "es2025",
    "lib": ["es2025"],
    "module": "esnext",
    "moduleResolution": "bundler",

    // ── Additional safety beyond @tsconfig/strictest ──
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "isolatedDeclarations": true,
    "noUncheckedSideEffectImports": true,
    "forceConsistentCasingInFileNames": true,

    // ── TS 7.0 readiness ──
    "stableTypeOrdering": true,
    // Diagnostic flag in TS 6.0 (≈25% slowdown with tsc only).
    // In TS 7.0, this is the only behaviour – immutable, always true.
    // tsgo ignores the flag entirely; parallel ordering is built into the Go runtime.

    // ── Explicit interop (mandatory in TS 6.0+; hard error to set false in TS 7.0) ──
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,

    // ── Module resolution ──
    "resolvePackageJsonImports": true,
    "resolveJsonModule": true,
    // NOTE: paths is intentionally NOT set here.
    // Packages needing aliases should use subpath imports (#/*) in package.json.

    // ── Declarations ──
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,

    // ── Explicit type roots (TS 6.0 default) ──
    "types": [],

    // ── Build structure ──
    "rootDir": "./src",
    "outDir": "./dist",
    "composite": false,
    "incremental": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  },
  "exclude": ["node_modules", "dist", ".turbo", "coverage"]
}
```

### 4.2 `shared-library.json` — Internal Libraries

For monorepo‑internal shared libraries (`@firm/*` packages). These must emit declaration files because downstream packages consume their types via project references.

```jsonc
// packages/firm-config-typescript/src/shared-library.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    // ── Required for project references ──
    "composite": true,
    // implies declaration: true and incremental: true

    "declaration": true,
    "declarationMap": true,
    "emitDeclarationOnly": true,
    // Bundler (tsup) handles JS output; tsc only emits .d.ts files.

    // ── Allow .ts extensions in imports (safe because emitDeclarationOnly) ──
    "allowImportingTsExtensions": true,

    // ── Suppress false positives for multi‑reference builds ──
    // REMOVE after initial monorepo structure stabilizes (Wave 3 interface freeze).
    "suppressOutputDirCheck": true
  }
}
```

### 4.3 `app.json` — Applications

For Next.js, Astro, and other application deployments. Leaf nodes in the build graph — never composite.

```jsonc
// packages/firm-config-typescript/src/app.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    // ── Standard strictness tier ──
    "exactOptionalPropertyTypes": false,
    "noImplicitOverride": false,
    "isolatedDeclarations": false,

    // ── DOM & React ──
    "lib": ["es2025", "dom", "dom.iterable"],
    "jsx": "react-jsx",

    // ── Bundled resolution ──
    "moduleResolution": "bundler",

    // ── Apps never emit type declarations ──
    "declaration": false,
    "declarationMap": false,
    "composite": false,
    "noEmit": true,
    // TypeScript's role in apps is type‑checking only; bundler handles emit.

    // ── App‑specific types ──
    "types": ["node"],

    // ── Path alias to app root ──
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 4.4 `service.json` — Backend Services & Workers

For Node.js services and background workers (`services/*-worker`). Needs Node.js types but no DOM.

```jsonc
// packages/firm-config-typescript/src/service.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    // ── Node.js runtime ──
    "lib": ["es2025"],
    "types": ["node"],
    "moduleResolution": "nodenext",
    // Services run directly in Node.js, not through a bundler.

    // ── Same strictness as shared-library ──
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "isolatedDeclarations": true,

    // ── Optional composite for workers that export types ──
    "composite": false,
    "declaration": false
  }
}
```

### 4.5 `config-factory.ts` — Programmatic Configuration

For code generators and dynamic scaffolding. Accepts typed overrides and returns a fully‑resolved config object.

```typescript
import type { CompilerOptions } from 'typescript';
import baseConfig from './base.json' with { type: 'json' };

export type TsConfigVariant = 'base' | 'shared-library' | 'app' | 'service';

interface CreateTsConfigOptions {
  variant: TsConfigVariant;
  overrides?: Partial<CompilerOptions>;
  references?: Array<{ path: string }>;
}

export function createTsConfig(opts: CreateTsConfigOptions) {
  // Resolves the appropriate variant, merges overrides, returns complete tsconfig JSON
}
```

---

## 5. Package Configuration

### 5.1 `package.json`

```jsonc
{
  "name": "firm-config-typescript",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts"
    },
    "./base.json": "./src/base.json",
    "./shared-library.json": "./src/shared-library.json",
    "./app.json": "./src/app.json",
    "./service.json": "./src/service.json"
  },
  "scripts": {
    "check": "tsc --noEmit --project tsconfig.self-check.json",
    "validate": "tsgo --noEmit --project tsconfig.self-check.json"
  },
  "devDependencies": {
    "typescript": "npm:@typescript/typescript6@^6.0.0",
    "@typescript/native-preview": "^7.0.0-dev.20260508.1",
    "tsgo": "@typescript/native-preview"
  },
  "sideEffects": false
}
```

### 5.2 Self‑Referencing `tsconfig.self-check.json`

```jsonc
// packages/firm-config-typescript/tsconfig.self-check.json
{
  "extends": "./src/base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  },
  "include": ["src"]
}
```

---

## 6. Build Scripts

| Script | Command | Purpose |
|---|---|---|
| `check` | `tsc --noEmit --project tsconfig.self-check.json` | Validates the TypeScript source in `src/` (the factory file) |
| `validate` | `tsgo --noEmit --project tsconfig.self-check.json` | Dual‑compiler validation — confirms base config is TS 7.0 compatible |

**CI pipeline pattern:**

```yaml
- name: Fast type‑check (tsgo)
  run: pnpm typecheck  # tsgo --noEmit
- name: Full build (tsc)
  run: pnpm build      # tsc -b
```

`tsgo --noEmit` is the cheap gate; if it passes, `tsc -b` performs the production emit.

---

## 7. Build Order & Dependency Map

```
firm-config-typescript (Layer 0 — first package built)
        │
        └── Every other package extends base.json, shared-library.json,
            app.json, or service.json
```

---

## 8. Interface Freeze & Governance

- After Wave 0, the `base.json` compiler options are frozen. Any change affects every package.
- **Adding** a new safety flag → **minor**, with migration guide and codemod.
- **Removing** a safety flag → **major**, requires an ADR and deprecation window.
- **Changing** the default module resolution or target → **major**, requires a full monorepo migration.
- Every PR that modifies `base.json` must pass both `tsc` and `tsgo` on the full monorepo via `turbo typecheck --filter="...[origin/main]"` in CI.

---

## 9. Documentation Requirements

- **README.md** must follow the monorepo template: Purpose, Configuration Reference (all variants), Usage Examples, Migration Guide.
- Every exported `.json` file must have `"$schema": "https://json.schemastore.org/tsconfig"` for IDE autocompletion.
- **CHANGELOG.md** records every compiler‑option change with migration instructions.

---

## 10. Consumer Patterns (Quick Reference)

### For shared libraries (`@firm/*` packages)

```jsonc
// packages/firm-foo/tsconfig.json
{
  "extends": "firm-config-typescript/shared-library.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  },
  "include": ["src", "tests"],
  "exclude": ["dist", "node_modules"],
  "references": [
    { "path": "../firm-types" }
  ]
}
```
**Build command:** `tsc --build` (emits `.d.ts` + `.tsbuildinfo`)

### For applications (`apps/*`)

```jsonc
// apps/client-acme/tsconfig.json
{
  "extends": "firm-config-typescript/app.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "./dist",
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", ".next", "dist"]
}
```
**Type‑check command:** `tsc --noEmit` (apps are leaf nodes)

### For services (`services/*-worker`)

```jsonc
// services/crm-sync/tsconfig.json
{
  "extends": "firm-config-typescript/service.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "tsBuildInfoFile": "./dist/.tsbuildinfo",
    "types": ["node"]
  },
  "include": ["src", "tests"],
  "exclude": ["dist", "node_modules"]
}
```

---

## 11. Validation in CI

1. **Self‑check:** `pnpm --filter firm-config-typescript run check` — validates the factory TypeScript source with `tsc`.
2. **Dual‑compiler check:** `pnpm --filter firm-config-typescript run validate` — confirms `tsgo` compatibility.
3. **Consumer check:** `pnpm turbo typecheck --filter="...[origin/main]"` — validates every package against the shared config using `tsc --build --noEmit`.

Any PR that changes `base.json` or any variant configuration must pass all three.

---

## 12. Migration Path to TypeScript 7.0

**Phase 1 — Now (May 2026): Dual‑compiler validation**

- `typescript` points to `@typescript/typescript6` (`tsc6` binary).
- `@typescript/native-preview` provides `tsgo` (pinned to specific beta).
- CI runs `tsgo --noEmit` as fast gate, `tsc6 -b` for production emit.

**Phase 2 — After TS 7.0 stable (~July 2026): Collapse to single compiler**

- Switch `typescript` to `^7.0.0` (the Go compiler ships as `tsc`).
- Remove `@typescript/native-preview`.
- Keep `tsc6` alias only if ESLint type‑aware rules or custom transforms still need the TS 6.0 API.
- Renovate is configured to disable auto‑updates for `@typescript/native-preview` and to group TS 7.0 migration into a single PR.

---

## 13. Open Question

| Question | Status | Mitigation |
|---|---|---|
| `exactOptionalPropertyTypes` + Zod `.optional()` incompatibility | Open ([colinhacks/zod#635](https://github.com/colinhacks/zod/issues/635)) | Allow `firm-validators` to override the flag to `false` until Zod ships a native fix. |

---

## References

- [TypeScript 7.0 Beta Announcement (Microsoft)](https://devblogs.microsoft.com/typescript/typescript-native-port/)
- [TypeScript 6.0 — last JS‑based compiler](https://devops.com/typescript-6-0-sets-stage-for-performance-focused-7-0/)
- [tsc Is Now Written in Go — Your tsconfig Is Probably Wrong (Gabriel Anhaia)](https://dev.to/gabrielanhaia/tsc-is-now-written-in-go-your-tsconfig-is-probably-wrong-43e)
- [TypeScript 6.0 Patterns That Eliminate Legacy Config](https://dev.to/jsgurujobs/typescript-60-patterns-that-eliminate-legacy-config-and-prepare-you-for-10x-faster-builds-1pbk)
- [@tsconfig/strictest v2.0.8](https://www.npmjs.com/package/@tsconfig/strictest)
- [TypeScript Project References (DeepWiki)](https://deepwiki.com/microsoft/TypeScript/8.2-project-references)
- [Enterprise UI — Project References Exercise (Steve Kinney)](https://stevekinney.com/courses/enterprise-ui/typescript-references-exercise)
- [TypeScript Best Practices for Production Code in 2026](https://dev.to/_d7eb1c1703182e3ce1782/typescript-best-practices-for-production-code-in-2026-lb0)
```