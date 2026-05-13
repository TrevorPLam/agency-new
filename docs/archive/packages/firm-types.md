# `firm‑types` — Package Planning Document

**Branded IDs · Domain Enums · Entity Interfaces · Adapter Contracts · Zero Runtime Code**

---

## 1. Purpose & Architectural Position

`firm‑types` is the **single source of truth for every shared TypeScript shape** in the platform. It contains only `type`, `interface`, and `type alias` declarations — plus zero‑cost safe‑cast factory functions that exist purely to satisfy the type system.

**Layer placement:** Layer 2, Wave 3 — first package built. It is the dependency anchor for all other Layer 2 packages and is safely importable from every layer without risk of circular dependency or bundle bloat. It does **not** belong in Layer 0 because it carries domain concepts (`Lead`, `Tenant`, `Booking`, adapter contracts) that are not pure configuration.

**Multi‑platform guarantee:** Importable from Node.js, Vercel Edge, Cloudflare Workers, and React Native (Hermes) without any conditional exports — because it contains zero runtime imports and uses only erasable TypeScript syntax.

---

## 2. Immutable Rules

Every rule in this section is enforceable by CI.

| Rule | Rationale |
|---|---|
| **No runtime code.** Only `type`, `interface`, and zero‑cost safe‑cast helpers (`asTenantId`, etc.). No functions with bodies beyond these. | Compiles instantly, zero bundle impact, importable everywhere. |
| **Zero `dependencies`.** Only `devDependencies` (`typescript`, `firm‑config‑typescript`). | Layer 0 constraint: the dependency anchor imports nothing with executable code. |
| **Named exports only.** No `export default`. | Consistent import patterns, tree‑shaking compatible. |
| **`exports` field is the sole public API boundary.** Only `src/index.ts` reachable from outside. | Internal refactoring invisible to consumers. |
| **All IDs are branded** via `unique symbol` pattern. | Prevents compile‑time ID mix‑ups. |
| **String literal unions only** — never TypeScript `enum`. | Compatible with `erasableSyntaxOnly`, Node.js native type‑stripping, and `isolatedDeclarations`. |
| **Adding** a branded ID or status variant → **minor** bump. **Renaming or removing** → **major** bump with deprecation window. | Interface‑freeze governance. |
| **No `import` from any other internal package** except `firm‑config‑typescript`. | Maintains zero internal dependency guarantee. |

---

## 3. Module Inventory

Every source file in `src/` and its single responsibility:

| File | Purpose |
|---|---|
| `index.ts` | Single public door — named re‑exports only. The entire public API. |
| `branded.ts` | `Brand<B, T>` utility, all branded identity types (`TenantId`, `UserId`, `ClientSlug`, `FormId`, `BookingId`, `InvoiceId`, `LeadId`, `JobId`, `AdapterId`, `SessionId`), and their Gatekeeper factory functions (`asTenantId`, etc.). |
| `enums.ts` | Domain status unions (`LeadStatus`, `BookingStatus`, `TenantStatus`, `SubscriptionStatus`) and category unions (`ServiceTier`, `Vertical`, `VerticalCategory`, `ConsentCategory`). |
| `entities.ts` | Core entity interfaces: `User`, `Tenant`, `Lead`, `Campaign`, `Submission`, `Booking`, `Invoice`, `Subscription`. |
| `adapters.ts` | Adapter interfaces that all Layer 7 packages must implement: `CRMAdapter`, `EmailAdapter`, `AnalyticsAdapter`, `BookingAdapter`, `PaymentsAdapter`, `CMSAdapter`, `SMSAdapter`, `AIAdapter`, `SocialAdapter`. |
| `results.ts` | Adapter return shapes: `SyncResult`, `SendResult`, `BookingResult`. |
| `api.ts` | HTTP envelope types: `ApiResponse<T>`, `ApiError`, `PaginatedResult<T>`, `CursorParams`, `OffsetParams`, `HttpMethod`, `HttpStatus`. |
| `events.ts` | Analytics event and audit log interfaces (`AnalyticsEvent`, `AuditEvent`). |
| `config.ts` | `TenantConfig` interface — the shape of per‑tenant configuration loaded from the database. The Zod validation schema lives in `firm‑config` (Layer 5). |
| `helpers.ts` | Pure type utilities: `DeepPartial<T>`, `Nullable<T>`, `ReadonlyDeep<T>`, `NonEmptyArray<T>`. |

**Future additions (not in initial build):**

| Trigger | File | Contents |
|---|---|---|
| Native app launch | `src/native.ts` | `DevicePlatform`, `PushNotificationToken`, `BiometricStatus` |
| First regulated client | `src/compliance.ts` | `DataResidencyZone`, `ConsentPurpose`, `GDPRBasis` |
| 50+ vertical categories | `src/verticals/` subdirectory | Split `enums.ts` by category |

---

## 4. Key Patterns

### 4.1 Branded Types — `unique symbol`

```typescript
declare const _brand: unique symbol;
type Brand<B, T> = T & { readonly [_brand]: B };

export type TenantId = Brand<'TenantId', string>;
export type UserId   = Brand<'UserId',   string>;
```

The `unique symbol` ensures each brand is globally unique — even across different modules. This pattern provides **type‑level branding**: it prevents ID mix‑ups at compile time but does not assert post‑validation authority. Brands are erased at runtime and do **not** survive the Server Action serialization boundary. Re‑validate IDs with `asTenantId()` on the server side at every trust boundary.

**Note on spread‑leak:** Spreading a branded object preserves the brand. For cases where the brand must represent post‑validation authority (not applicable to `firm‑types`), use a class with a `private` field — the `private` field is lost on spread, preventing brand leakage. This pattern belongs in validation layers, not here.

### 4.2 Gatekeeper Factory Pattern

Every branded ID has exactly one factory function. Validation (e.g., UUID regex) lives here — nowhere else.

```typescript
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const asTenantId = (id: string): TenantId => {
  if (!UUID_REGEX.test(id)) throw new Error(`Invalid TenantId: ${id}`);
  return id as TenantId;
};
```

### 4.3 String Literal Unions — Never TypeScript `enum`

```typescript
// ✅ Correct
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

// ❌ Never this
// enum LeadStatus { New, Contacted, Qualified, Converted, Lost }
```

Rationale: TypeScript `enum` emits runtime code, is incompatible with `erasableSyntaxOnly`, cannot be stripped by Node.js, and breaks `isolatedDeclarations`. String literal unions are fully erasable, tree‑shakeable, and integrate seamlessly with Zod.

### 4.4 `assertNever` Cascade

Every `switch` on a union must include a `default` branch calling `assertNever(value)`. The `assertNever` function lives in `firm‑utils` (Layer 1) and is imported from there. When a new variant is added to any union, every switch across the platform produces a **compile error** until the new case is handled.

### 4.5 `satisfies` Verification with `firm‑validators`

Zod schemas in `firm‑validators` verify against `firm‑types` interfaces using:

```typescript
// In firm‑validators
import type { Lead } from 'firm‑types';

export const leadSchemaV2 = z.object({ /* ... */ });

// Compile‑time verification — fails if schema doesn't match interface
type _AssertLead = z.infer<typeof leadSchemaV2> satisfies Lead;
```

Use `z.ZodType<T>`, not `z.ZodSchema<T>` (deprecated in Zod v4). The `satisfies` operator preserves literal types without widening.

### 4.6 Entity→Schema Workflow

1. **Define the interface** in `firm‑types` (e.g., `src/entities.ts`)
2. **Create the Zod schema** in `firm‑validators` matching the interface
3. **Verify at compile time** using the `satisfies` pattern above

This three‑step workflow prevents schema‑interface drift — mismatches become build failures, not runtime surprises.

### 4.7 Navigability at Scale

When any source file exceeds 10 entity definitions, it splits into a subdirectory with individual files. `src/index.ts` remains the single re‑export point. Subdirectories are internal — the `exports` field remains the sole public boundary. No barrel files inside `src/`.

---

## 5. Package Configuration

### 5.1 `package.json`

```jsonc
{
  "name": "firm‑types",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts"
    }
  },
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc --build",
    "typecheck": "tsc --build --noEmit"
  },
  "devDependencies": {
    "typescript": "catalog:",
    "firm‑config‑typescript": "workspace:*"
  },
  "sideEffects": false
}
```

**Why:** `exports` with `types` first ensures correct resolution in all TS resolver modes. No `main` field — the package emits only declarations. `catalog:` protocol ensures consistent TypeScript version across the monorepo.

### 5.2 `tsconfig.json`

```jsonc
{
  "extends": "firm‑config‑typescript/base.json",
  "compilerOptions": {
    // ── Project references (required for dependency anchor) ──
    "composite": true,
    "declaration": true,
    "emitDeclarationOnly": true,
    "incremental": true,

    // ── Declaration output ──
    "declarationMap": true,
    "sourceMap": true,
    "declarationDir": "./dist",
    "outDir": "./dist",
    "tsBuildInfoFile": "./dist/.tsbuildinfo",

    // ── Source layout ──
    "rootDir": "./src",

    // ── Strictness & forward compatibility ──
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "isolatedDeclarations": true
  },
  "include": ["src"],
  "exclude": ["dist", "node_modules"],
  "references": [
    { "path": "../firm‑config‑typescript" }
  ]
}
```

**Why each non‑obvious flag:**

| Flag | Reason |
|---|---|
| `composite: true` | Required for any project referenced by others. |
| `emitDeclarationOnly: true` | Emits `.d.ts` files but no `.js` — the package contains only types. Must be paired with `declaration: true`. |
| `incremental: true` | Caches build state in `.tsbuildinfo` for fast rebuilds. |
| `declarationMap: true` | Enables "Go to Definition" to reach original `.ts` source across packages. |
| `sourceMap: true` | Required for declaration map resolution. |
| `rootDir: "./src"` | Explicitly required in TS 7.0 — `rootDir` defaults to `./`. |
| `verbatimModuleSyntax: true` | Forces explicit `import type` — prevents silent import elision. |
| `erasableSyntaxOnly: true` | Prevents non‑erasable syntax (enums, namespaces). Ensures Node.js native type‑stripping compatibility. |
| `isolatedDeclarations: true` | Enables parallel declaration generation. TS 7.0 project‑reference builder parallelization benefits from this — monorepos with 50+ packages report 3–8× declaration‑generation speedups. |

---

## 6. Build Scripts

| Script | Command | Purpose |
|---|---|---|
| `build` | `tsc --build` | Emits `.d.ts` files + `.tsbuildinfo` for downstream consumers. Project‑aware. |
| `typecheck` | `tsc --build --noEmit` | Fast type‑validation across references without emission. Used in CI. |

Never use `tsc --noEmit` without `--build` — it does not resolve project references.

---

## 7. Compile‑Time Tests

Only compile‑time tests — no runtime Vitest suite needed.

`tests/branded.test‑d.ts` asserts:
- Two different branded IDs are not assignable to each other.
- Gatekeeper factory returns the correct brand.
- Missing union branches are caught by `assertNever`.
- Entity interfaces satisfy expected structural shapes.

---

## 8. Build Order & Dependency Map

```
firm‑config‑typescript (Layer 0, Wave 0)
        │
   firm‑types (Layer 2, Wave 3 — first package)
        │
        ├── firm‑validators
        ├── firm‑api‑contracts
        ├── firm‑db
        ├── firm‑cache
        └── (every other package in the platform)
```

**Turborepo configuration:** `dist/**` and `dist/.tsbuildinfo` must be listed in `turbo.json` `outputs[]` for correct CI cache restoration. `.tsbuildinfo` must be in `.gitignore` (contains absolute paths).

---

## 9. Interface Freeze Governance

After the Wave 3 interface‑freeze milestone:
- Any **addition** (new branded ID, status variant, entity interface, adapter method) is a **minor** change.
- Any **renaming or removal** is a **major** breaking change requiring a deprecation window and cascading fix across all consumers.
- The CI script `scripts/validate‑adapters.ts` blocks any PR that changes an adapter interface without updating all implementing adapters.

---

## 10. Documentation Requirements

- **README.md** must follow the monorepo template: Purpose, API Reference (listing all exports), Usage Example, Links.
- **TSDoc comments** on every branded ID, entity interface, adapter contract, and public type exported from `src/index.ts`. Enforced by CI.

---

## 11. Key Configuration Rules for Consumers

- All consumers must use `tsc --build` (not `tsc --noEmit`) for incremental, project‑aware type‑checking.
- All consumers must use `import type { ... } from 'firm‑types'` — enforced by `verbatimModuleSyntax` and `noUncheckedSideEffectImports` (default `true` in TS 6.0+).
- Consumers (`firm‑validators`) must use `z.ZodType<T>`, not `z.ZodSchema<T>` (deprecated in Zod v4), for the `satisfies` verification pattern.
- Branded IDs must be re‑validated with `asTenantId()` at every Server Action serialization boundary — brands are erased at runtime.

---

