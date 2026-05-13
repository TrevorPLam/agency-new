```markdown
# `firm-config-prettier` — Package Planning Document

**Shared Prettier v3.8.3+ Configuration · Tailwind CSS Class Sorting · `package.json` Normalisation · Oxfmt Migration Path · Zero Runtime**

---

## 0. Purpose & Architectural Position

`firm-config-prettier` is the **single source of truth for all code formatting rules** in the monorepo. It provides an opinionated Prettier configuration that every package, application, and service inherits. It belongs to Layer 0 (Build & Constraint) — no runtime code, only configuration — and completes the “Big Three” of code quality enforcement alongside `firm-config-typescript` (type safety) and `firm-config-eslint` (correctness).

**Layer placement:** Layer 0, Wave 0 — built in parallel with `firm-config-eslint`, immediately after `firm-config-typescript`.

**2026 context:** Prettier v3.8.3 is the current stable release. Prettier now supports TypeScript configuration files, the `objectWrap` option, and `experimentalOperatorPosition`. Oxfmt (beta, February 2026) passes 100% of Prettier’s JavaScript and TypeScript conformance tests while running up to 36× faster. The Oxc ecosystem releases weekly; Oxfmt is already used in production by Vue.js core, Vercel Turborepo, HuggingFace, Remotion, and Sentry.

---

## 1. Immutable Rules

| Rule | Rationale |
|---|---|
| **Single source of truth.** One shared config; every package inherits it. No per‑package `.prettierrc.json` files. | Prevents formatting drift across 50+ packages. |
| **No runtime code.** Only configuration files; zero `dependencies` in the consumer sense. | Layer 0 constraint. |
| **`singleQuote: true`** | Consistent with the broader JS ecosystem; the ESLint import convention matches. |
| **`trailingComma: "all"`** | Maximises diff cleanliness when adding/removing parameters. |
| **`semi: true`** | Explicit statement termination; aligns with TypeScript strictness philosophy. |
| **`tabWidth: 2`, `useTabs: false`** | Industry standard for JavaScript/TypeScript monorepos. |
| **`printWidth: 100`** | Optimised for modern wide‑screen development and side‑by‑side diffs, while accommodating TypeScript’s verbose type annotations. Acknowledged as the pragmatic consensus for 2026 monorepos. |
| **`arrowParens: "always"`** | Consistency — no special cases for single parameters. |
| **`endOfLine: "lf"`** | Required for cross‑platform CI consistency (macOS, Linux, WSL). |
| **`bracketSpacing: true`** | Standard JavaScript convention. |
| **`bracketSameLine: false`** | Standard React convention — closing JSX bracket on its own line. |
| **`objectWrap: "preserve"`** | Respects the original author’s intent for object literal line breaks. Introduced in Prettier v3.5. |
| **`experimentalOperatorPosition: "start"`** | Placing binary operators at the start of wrapped lines makes them more scannable. The option is experimental and may be removed or made default by Prettier; the risk is acceptable because removal requires deleting only a single config line. Oxfmt adopts the same behaviour natively. |
| **`experimentalTernaries` NOT set** | This option has been experimental for 2.5+ years with no decision from Prettier. Including it would risk a monorepo‑wide reformat on an unpredictable timeline. It is explicitly excluded; when Prettier decides its fate, our config will automatically follow the new default. |
| **Plugins loaded in this order:** `prettier-plugin-tailwindcss` → `prettier-plugin-packagejson` | Tailwind class sorting must run before other formatting transformations. |
| **`.prettierignore` at monorepo root** | Prevents formatting of build output, generated files, and OS artefacts. |
| **`prettier --check` in CI with `--max-warnings 0`** | Formatting is a required quality gate. Failing CI blocks merge. |
| **Consumer usage: package.json shorthand** | A single `"prettier": "firm-config-prettier"` in each package’s `package.json`. No manual file copying. |
| **Prettier does NOT support `extends`** in `.prettierrc` files | The only configuration sharing mechanisms are the `package.json` shorthand or a `.prettierrc.js` with `import`. Our chosen pattern is the recommended approach. |
| **Format‑on‑save via `.vscode/settings.json`** | Developer experience — formatting happens automatically. |

---

## 2. Oxfmt — Future Migration Path

Oxfmt (beta, February 2026) is a Rust‑based Prettier‑compatible formatter developed by VoidZero (the Oxc project). It passes **100% of Prettier’s JavaScript and TypeScript conformance tests** while running **up to 36× faster than Prettier** and **3× faster than Biome** on cold runs.

| Tool | Speed (JS/TS) | Prettier Compat | Status |
|---|---|---|---|
| **Prettier** (Node.js) | Baseline (~2–10s for large files) | Reference | Stable (v3.8.3) |
| **Oxfmt** (Rust) | Up to 36× faster | 100% JS/TS conformance | **Beta** (February 2026) |
| **Biome** (Rust) | ~10× faster | ~97% compatible | Stable (v2.0) |

### 2.1 Built‑In Features (Eliminates Two Plugins)

Oxfmt includes several features that require external plugins in Prettier:

- **Tailwind CSS class sorting** – based on `prettier-plugin-tailwindcss` internals, built‑in and available for both JS/TS and non‑JS/TS files.
- **Import sorting** – based on `eslint-plugin-perfectionist/sort-imports`, configurable natively.
- **`package.json` field sorting** – built‑in, replacing `prettier-plugin-packagejson`.
- **Embedded formatting** (CSS‑in‑JS, GraphQL, etc.) – no additional plugins required.

### 2.2 Production Adoption

Projects using Oxfmt in production as of May 2026: **Vue.js core**, **Vercel Turborepo**, **HuggingFace**, **Sentry**, **Remotion**, **cloudflare/agents**, and others. This is not experimental adoption — major organisations have already migrated.

### 2.3 Migration from Prettier

The migration is trivial and reversible:

1. `pnpm add -D oxfmt && pnpm oxfmt --migrate prettier && pnpm oxfmt`
2. Rename `.prettierrc.json` → `.oxfmtrc.json` (identical configuration format).
3. Update scripts: `prettier` → `oxfmt`, `prettier --check` → `oxfmt --check`.
4. Update pre‑commit hooks, CI workflows, editor settings, and documentation.

An auto‑generated migration prompt for AI coding agents (Claude Code, Cursor) is available from the Oxfmt documentation.

### 2.4 1.0 Roadmap

The 1.0 milestone is gated on **native Prettier plugin support** (e.g., for Svelte components) and further CSS‑in‑JS formatting improvements. Since our monorepo uses none of these, Oxfmt is **production‑ready for our use case today**. There is no need to wait for 1.0.

---

## 3. Module Inventory

```
packages/firm-config-prettier/
├── src/
│   ├── .prettierrc.json       # The canonical Prettier configuration
│   ├── .prettierignore        # Global ignore patterns for the monorepo
│   └── index.ts               # Re‑exports Prettier config types (for programmatic consumers)
├── package.json
├── README.md
└── CHANGELOG.md
```

---

## 4. Key Patterns

### 4.1 Canonical `.prettierrc.json`

```jsonc
// packages/firm-config-prettier/src/.prettierrc.json
{
  "$schema": "https://json.schemastore.org/prettierrc",

  // ── Line & spacing ──
  "printWidth": 100,
  // 100 chars is the pragmatic consensus for 2026 TypeScript monorepos —
  // accommodates verbose type annotations and side‑by‑side diffs without
  // excessive wrapping. The official Prettier default is 80, but 100 is
  // widely adopted for modern development.

  "tabWidth": 2,
  "useTabs": false,
  "endOfLine": "lf",

  // ── Quotes & semicolons ──
  "singleQuote": true,
  "jsxSingleQuote": false,
  "semi": true,

  // ── Commas & parentheses ──
  "trailingComma": "all",
  "arrowParens": "always",
  "bracketSpacing": true,
  "bracketSameLine": false,

  // ── Object wrapping ──
  "objectWrap": "preserve",
  // Respects the original author's intent for object literal line breaks.

  // ── Operator position (experimental) ──
  "experimentalOperatorPosition": "start",
  // Places &&, ||, ?? at the start of wrapped lines — easier to scan.
  // This option may be removed or made default by Prettier in the future.
  // If removed, simply delete this line. Oxfmt adopts the same behaviour.

  // ── experimentalTernaries is explicitly NOT set ──
  // It has been experimental for 2.5+ years with no decision from Prettier.
  // Including it would risk a monorepo‑wide reformat on an unpredictable timeline.
  // When Prettier decides its fate, our config will automatically follow.

  // ── Plugins ──
  "plugins": [
    "prettier-plugin-tailwindcss",
    "prettier-plugin-packagejson"
  ]
}
```

### 4.2 Plugin: `prettier-plugin-tailwindcss` v0.8.0

Automatically sorts Tailwind CSS classes according to the recommended order. **v0.8.0** (latest) includes:

- Improved monorepo support — loads Tailwind CSS config relative to the input file, not the Prettier config file.
- Compatible plugin detection.
- Config resolution caching with directory‑based cache.
- Public sorting APIs exported to `/sorter`.

No additional configuration is needed; the plugin auto‑detects Tailwind CSS v4 (`@theme` blocks) or v3 (`tailwind.config.ts`).

### 4.3 Plugin: `prettier-plugin-packagejson` v3.0.0

Normalises `package.json` files by sorting keys to the `sort-package-json` convention (~1.2 M weekly downloads). **v3.0.0** dropped Prettier v2 support; our v3.8.3 baseline is fully compatible.

### 4.4 Consumer Usage — `package.json` Shorthand

Prettier v3+ resolves configuration from npm packages. Each consumer package adds a single line to its `package.json`:

```jsonc
// In any package's package.json
{
  "prettier": "firm-config-prettier"
}
```

No `.prettierrc.json` file is needed in individual packages. Prettier resolves `firm-config-prettier` as a module, finds the `.prettierrc.json` inside it, and applies the configuration. Per‑package overrides are possible via the `overrides` field but strongly discouraged — consistency is the goal.

The root `package.json` also carries `"prettier": "firm-config-prettier"`.

### 4.5 `.prettierignore`

```gitignore
# packages/firm-config-prettier/src/.prettierignore
# ── Build & cache ──
node_modules/
dist/
.turbo/
.next/
coverage/
storybook-static/
.cache/

# ── Generated files ──
pnpm-lock.yaml
*.generated.*
*.min.*

# ── IDE & OS ──
.vscode/
.idea/
.DS_Store

# ── Migrations (generated SQL) ──
packages/firm-db/drizzle/migrations/

# ── SBOM & provenance ──
sbom.json
```

This file is symlinked to the monorepo root during CI setup. Consumers inherit it automatically via Prettier’s ignore resolution.

### 4.6 CI Integration

```yaml
# In GitHub Actions workflow
- name: Format check (Prettier)
  run: prettier --check --max-warnings 0 .
  # Failing CI blocks merge. No auto‑formatting on CI — developers format locally.
```

### 4.7 Pre‑Commit Hook (Lefthook)

```yaml
# lefthook.yml (monorepo root)
pre-commit:
  parallel: true
  commands:
    prettier:
      glob: "*.{js,ts,tsx,jsx,json,md,yml,yaml,css,html}"
      run: prettier --write {staged_files}
      stage_fixed: true
    eslint:
      glob: "*.{js,ts,tsx,jsx}"
      run: eslint --fix {staged_files}
      stage_fixed: true
```

Lefthook runs Prettier and ESLint in parallel on staged files. `stage_fixed: true` automatically re‑stages formatted files.

### 4.8 Editor Integration (VS Code)

```jsonc
// .vscode/settings.json (monorepo root)
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "prettier.documentSelectors": [
    "**/*.{js,jsx,ts,tsx,json,md,mdx,yml,yaml,css,html}"
  ]
}
```

```jsonc
// .vscode/extensions.json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint"
  ]
}
```

These files are committed to the repository, ensuring every developer gets consistent formatting behaviour on‑save without manual configuration.

---

## 5. Package Configuration

### 5.1 `package.json`

```jsonc
{
  "name": "firm-config-prettier",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/.prettierrc.json"
  },
  "scripts": {
    "check": "prettier --check .",
    "check:fast": "oxfmt --check ."
  },
  "peerDependencies": {
    "prettier": "^3.8.3"
  },
  "dependencies": {
    "prettier-plugin-tailwindcss": "^0.8.0",
    "prettier-plugin-packagejson": "^3.0.0"
  },
  "devDependencies": {
    "prettier": "^3.8.3",
    "oxfmt": "^0.48.0"
  },
  "prettier": "./src/.prettierrc.json",
  "sideEffects": false
}
```

**Design decisions:**
- `"exports": "./src/.prettierrc.json"` — when a consumer sets `"prettier": "firm-config-prettier"`, Prettier loads this file.
- Plugins are in `dependencies` because they’re needed at format time, not just development time. Consumers don’t need to install them separately.
- `prettier` is in both `peerDependencies` (consumers must have it) and `devDependencies` (for self‑checking).
- `oxfmt` is in `devDependencies` for the fast `check:fast` script. It is not yet a `peerDependency`; it will be added when migration is complete.
- The self‑referencing `"prettier": "./src/.prettierrc.json"` validates that the package can resolve its own config.

### 5.2 Self‑Validation

The package’s own source files are formatted against its own config. Running `prettier --check .` or `oxfmt --check .` from within this package validates both the correctness of the config and that the source files are compliant.

---

## 6. Build Scripts

| Script | Command | Purpose |
|---|---|---|
| `check` | `prettier --check .` | Validates all files in this package are correctly formatted. |
| `check:fast` | `oxfmt --check .` | Fast validation via Oxfmt (beta). |

---

## 7. Consumer Patterns

### 7.1 For every package in the monorepo

Add to `package.json`:

```jsonc
{
  "prettier": "firm-config-prettier",
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "format:check:fast": "oxfmt --check ."
  }
}
```

No `.prettierrc.json` file needed. No `.prettierignore` needed (inherits from root).

### 7.2 Per‑package overrides (exceptional)

If a specific client app requires different formatting (extremely unlikely), it can define its own `.prettierrc.json` at its root, which overrides the inherited config. This pattern is documented for emergencies only and should be accompanied by an ADR explaining the exception.

---

## 8. Build Order & Dependency Map

```
firm-config-typescript (Layer 0, Wave 0)
        │
        ├── firm-config-eslint (Layer 0, Wave 0 — parallel)
        └── firm-config-prettier (Layer 0, Wave 0 — parallel)
```

`firm-config-prettier` has no dependency on other internal `firm-*` packages. It is built in parallel with `firm-config-eslint`. Both are consumed by every package in the monorepo.

---

## 9. Interface Freeze & Governance

- After Wave 0, the `.prettierrc.json` options are frozen. Formatting changes affect every file in every package.
- **Changing** a formatting option (e.g., `printWidth: 100` → `120`) → **major**, requiring an ADR and a monorepo‑wide reformat commit.
- **Adding** a plugin → **minor**, with CI validation that the plugin does not break existing formatting.
- **Removing** a plugin → **minor**.
- Every PR that changes `.prettierrc.json` must pass `prettier --check .` at the monorepo root in CI.
- `prettier --check` is a **required status check** on every PR. Failure blocks merge.

**Reformat commit protocol:** When a formatting option changes, a dedicated PR is opened containing **only** the config change and the mechanically reformatted files. The commit message must be `style: apply updated prettier config`. Reviewers approve the config change, not the thousands of reformatted lines. After merge, all open PRs must rebase.

---

## 10. Documentation Requirements

- **README.md**: Purpose, Configuration Reference (all options with rationale), Plugin Overview, Consumer Usage (one‑line setup), Editor Integration, CI Integration, `.prettierignore` Patterns, Oxfmt Migration Path, Oxfmt Built‑in Features, `experimentalOperatorPosition` Risk Note, `experimentalTernaries` Exclusion Rationale.
- **CHANGELOG.md**: Every formatting option change with migration instructions and the reformat commit hash.
- All options in `.prettierrc.json` carry inline comments explaining their rationale.

---

## 11. Oxfmt Migration Tracking

| Milestone | Status (May 10 2026) | Action |
|---|---|---|
| Oxfmt beta | ✅ Released (Feb 2026) | Included as `devDependency`; `check:fast` script available |
| Oxfmt 1.0 stable | Gated on Svelte plugin support | Not blocking for our monorepo |
| Migration ADR | Not yet scheduled | Schedule when convenient; no timeline dependency |
| Oxfmt migration execution | Future | Trivial: rename config, update scripts, remove plugins |

---

## 12. Version Compatibility Table (May 10 2026)

| Package | Version | Status |
|---|---|---|
| `prettier` | `^3.8.3` | Stable (April 15 2026) |
| `oxfmt` | `^0.48.0` | Beta (May 8 2026) |
| `prettier-plugin-tailwindcss` | `^0.8.0` | Stable |
| `prettier-plugin-packagejson` | `^3.0.0` | Stable (~1.2 M weekly downloads) |

---

## 13. Remaining Tracked Items

| Item | Status | Action |
|---|---|---|
| Oxfmt stable (1.0) | Beta, no date | No dependency for our use case |
| Prettier 3.9 | No evidence | Passive monitoring via Renovate |
| `experimentalOperatorPosition: "start"` removal | Experimental, could be removed | Delete config line if removed by Prettier |
| `experimentalTernaries` graduation | Experimental for 2.5+ years | Follow whatever Prettier decides |
| Oxfmt v0.49.0 | Expected ~May 12 2026 | Renovate auto‑merge |

---

## References

- [Prettier v3.8.3 (npm)](https://www.npmjs.com/package/prettier)
- [Prettier CHANGELOG](https://github.com/prettier/prettier/blob/main/CHANGELOG.md)
- [Prettier 3.5: `experimentalOperatorPosition` (Feb 2025)](https://prettier.io/blog/2025/02/09/3.5.0)
- [Prettier 3.8: Angular v21.1 support (Jan 2026)](https://prettier.io/blog/2026/01/14/3.8.0)
- [Sharing Configurations (Prettier docs)](https://prettier.io/docs/en/configuration#sharing-configurations)
- [prettier-plugin-tailwindcss v0.8.0](https://github.com/tailwindlabs/prettier-plugin-tailwindcss/releases)
- [prettier-plugin-packagejson v3.0.0](https://www.npmjs.com/package/prettier-plugin-packagejson)
- [Oxfmt Beta — 100% Prettier Conformance (oxc.rs)](https://oxc.rs/blog/2026-02-24-oxfmt-beta)
- [Oxfmt GitHub Releases](https://github.com/oxc-project/oxc/releases?q=oxfmt)
- [VoidZero "What's New in ViteLand" — Oxfmt & Oxlint (Feb 2026)](https://voidzero.dev/posts/whats-new-feb-2026)
- [Oxfmt vs Biome vs Prettier — 2026 Developer Comparison](https://zenn.dev)
- [Remotion — Formatting with Oxfmt](https://www.remotion.dev/docs/contributing/formatting)
```