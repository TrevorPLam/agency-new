# `firm‑validators` — Package Planning Document

**Single Source of Validation Truth · Zod v4 · Standard Schema · `satisfies` Enforcement · Schema Versioning**

---

## 0. Purpose & Architectural Position

`firm‑validators` is the **sole source of all runtime input validation** in the platform. Every API route, form handler, webhook receiver, Server Action, and background worker imports its Zod schema from this package — never from inline definitions.

**Layer placement:** Layer 2, Wave 3 — second package built, immediately after `firm‑types`. It depends on `firm‑types` for all entity interfaces and branded IDs, and every schema is verified against those interfaces at compile time.

**Multi‑platform strategy:**

| Environment | Recommended Validator | Rationale |
|---|---|---|
| Server‑side (Node.js, API handlers) | **Zod v4** (`import * as z from 'zod'`) | Ecosystem breadth, 4.2× faster than v3, bundle size irrelevant on server |
| Client‑side (forms, edge functions) | **Valibot** (via Standard Schema) | ~1.5 KB tree‑shaken, 6.4× faster than Zod v3 |
| Edge middleware (bundle‑sensitive) | **Zod Mini** (`import * as z from 'zod/v4/mini'`) | ~1.88–3.92 KB gzipped, Zod‑familiar API |

`@t3-oss/env‑nextjs` (v0.13+) supports Standard Schema, so `firm‑env` (Layer 1) can consume schemas defined here regardless of the underlying library.

---

## 1. Immutable Rules

| Rule | Rationale |
|---|---|
| **All Zod schemas are defined here — nowhere else.** | Single source of validation truth. API routes, forms, webhooks, workers all import from `firm‑validators`. |
| **Use `import * as z from 'zod'`.** | Enables tree‑shaking. Enforced by ESLint. |
| **Every schema co‑exports its inferred TypeScript type via `z.infer<>`.** | Types flow from validation — no duplicative type declarations. |
| **Every schema must be verified against its `firm‑types` interface** using `satisfies z.ZodType<T>`. | Compile‑time guarantee that schema and interface stay in sync. |
| **`safeParse()` is the default for all public API boundaries.** | Returns a result object; cheaper for common failures; no try/catch wrapper needed. |
| **Schema versioning starts at the first breaking change.** | `v1.ts` persists forever. `v2.ts` added alongside. `index.ts` exports the current version. |
| **Named exports only.** No default exports. | Consistent import patterns. |
| **`exports` field is the contract boundary.** | Internal refactoring invisible to consumers. |
| **Test coverage ≥ 80%.** Every schema must have valid, invalid, boundary, and cross‑field test fixtures. | CI‑enforced by Vitest. |
| **Use `.meta()` for metadata, not `.describe()`.** | `.describe()` exists for Zod 3 compatibility; `.meta()` is the v4 recommended approach. |

---

## 2. Zod v4 — Key API Changes & Patterns

This section documents every v3‑to‑v4 change that `firm‑validators` schemas must follow.

### 2.1 Primitive Validators

Use top‑level functions — the chained forms (`z.string().email()`) are **deprecated**.

```typescript
import * as z from 'zod';

z.email()      // replaces z.string().email()
z.uuid()       // replaces z.string().uuid()
z.url()        // replaces z.string().url()
z.int()        // replaces z.number().int()
z.iso.datetime() // replaces z.string().datetime()
```

### 2.2 Error Handling

| v3 (removed/deprecated) | v4 (use) | Notes |
|---|---|---|
| `error.format()` | `z.treeifyError(error)` | Deprecated |
| `error.flatten()` | `z.treeifyError(error)` | Deprecated |
| `error.errors` | `error.issues` | Removed entirely |
| `message`, `required_error`, `invalid_type_error` | Unified `error` parameter | `message` still works but deprecated |
| `errorMap` | `error` parameter | Renamed |

The standardized consumer pattern in all API handlers:

```typescript
const result = schema.safeParse(input);
if (!result.success) {
  return NextResponse.json(
    { errors: z.treeifyError(result.error) },
    { status: 400 }
  );
}
```

`z.prettifyError()` produces a human‑readable string for logging/display.

### 2.3 Coercion

`z.coerce` now accepts `unknown` input. For environment variables (always strings), use:

```typescript
z.coerce.number().int().min(1024).max(65535) // PORT
z.stringbool()                                  // DEBUG flag
```

`z.stringbool()` is the recommended way to coerce string booleans (“true”/“false”/“1”/“0”).

### 2.4 Default Values

| Method | Behavior | Use Case |
|---|---|---|
| `.default(val)` | Applied only when input is `undefined` (after validation) | Truly optional fields |
| `.catch(val)` | Applied whenever validation fails for **any** reason | Backward‑compatible fallbacks (replaces old `.default()`) |
| `.prefault(val)` | Applied before validation; still expects correct type | Rare; only when undefined handling needed before validation |

For “fill in anything” defaults, use `.catch()`. For missing optional fields, use `.default()`.

### 2.5 Discriminated Unions

`z.union()` **auto‑detects discriminator keys** in v4, making `z.discriminatedUnion()` optional. Both are supported. For explicit discriminator field specification, use `z.discriminatedUnion()`.

### 2.6 Cross‑Field Validation

`.superRefine()` is fully supported (not deprecated). **Important:** If any field has an `invalid_type` error, subsequent `.superRefine()` callbacks are **not executed**. Place field‑level validation before cross‑field refinement.

```typescript
export const createLeadSchema = z.object({
  firstName:        z.string().min(1),
  email:            z.email().optional(),
  phone:            z.string().optional(),
  consentGiven:     z.boolean(),
  consentTimestamp: z.iso.datetime().optional(),
}).superRefine((data, ctx) => {
  if (!data.email && !data.phone) {
    ctx.addIssue({
      code:    z.ZodIssueCode.custom,
      path:    ['email'],
      message: 'Either email or phone is required',
    });
  }
});
```

Use `.refine()` only for single‑field custom rules. Use `.superRefine()` for multi‑field rules — it enables `ctx.addIssue()` targeting specific paths.

### 2.7 Async Validation

Async validation is supported via `Promise`‑returning `.refine()` / `.superRefine()` callbacks. However, **database queries inside `.refine()` are an anti‑pattern**.

```typescript
// ❌ Anti‑pattern — DoS risk on high‑traffic endpoints
z.object({ email: z.string().email() }).refine(async (data) => {
  return !(await db.user.exists(data.email));
}, 'Email already registered')
```

Separate uniqueness checks from schema validation: use the schema for shape + basic rules, perform uniqueness checks at the application layer, and rely on database `UNIQUE` constraints as the final safety net.

### 2.8 Metadata

Use `.meta()` instead of `.describe()`:

```typescript
const emailField = z.email().meta({
  description: 'User email address',
  maxLength: 254,
  examples: ['user@example.com'],
});
```

`.describe()` is still available for Zod 3 compatibility but is a shorthand that registers only a description.

### 2.9 JSON Schema Generation

`z.toJSONSchema()` is a **first‑party** feature, replacing the deprecated `zod-to-json-schema` package. Used by `firm‑api‑contracts` for OpenAPI documentation generation.

### 2.10 Additional v4.3.0+ Utilities

- `z.templateLiteral()` — typed string patterns (slugs, codes)
- `z.record(keySchema, valueSchema)` — validates dynamic keys as well as values (e.g., `z.record(z.string(), z.boolean())` for feature flags)
- `z.looseRecord()` — partial record validation
- `z.xor()` — exclusive OR between schema alternatives
- `z.decode()` — strongly‑typed input (for already‑typed internal data)
- `z.slugify()` — slug transformation
- `z.fromJSONSchema()` — reverse conversion from JSON Schema to Zod

---

## 3. Module Inventory

### 3.1 Initial Flat Structure (≤8 entities)

```
src/
├── index.ts          # Single public door — named re‑exports only
├── common.ts         # Shared primitives: emailField, phoneField, slugField, uuidField, urlField
├── config.ts         # tenantConfigSchema — validates TenantConfig from firm‑types
├── retention.ts      # dataRetentionPolicySchema — GDPR automation rules
├── lead.ts           # leadSchema (current version)
├── user.ts
├── tenant.ts
├── campaign.ts
├── booking.ts
├── invoice.ts
└── subscription.ts
```

### 3.2 Subdirectories — Activated by Trigger

| Trigger | Directory | Contents |
|---|---|---|
| Entity >10 | `src/entities/` | `lead/` (v1, v2, index), `user.ts`, `tenant.ts`, etc. |
| First webhook adapter | `src/webhooks/` | `stripe.ts`, `gohighlevel.ts`, `resend.ts` |
| Form variants >5 | `src/forms/` | `contact.ts`, `booking.ts`, `consultation.ts` |
| Native app launch | `src/native/` | `device-token.ts`, `offline-sync.ts` |

Subdirectories are **internal to the package**. `src/index.ts` remains the sole public API.

---

## 4. Key Patterns

### 4.1 `satisfies` Enforcement Against `firm‑types`

```typescript
import type { Lead } from 'firm‑types';
import * as z from 'zod';

export const leadSchemaV2 = z.object({
  id:        z.uuid(),
  email:     z.email(),
  firstName: z.string().min(1),
  lastName:  z.string().min(1),
  // …
});

// Compile error if schema doesn't match the Lead interface
type _AssertLead = z.infer<typeof leadSchemaV2> satisfies Lead;
```

- Use `satisfies z.ZodType<T>` — **not** `z.ZodSchema<T>` (deprecated in v4).
- `satisfies` preserves literal types without widening.
- **Limitation:** `satisfies` does not enforce that optional interface fields exist in the schema. For full precision, use the `Equal` type‑level check in test files:

```typescript
type Expect<T extends true> = T;
type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends
                   (<T>() => T extends Y ? 1 : 2) ? true : false;

type _LeadEquality = Expect<Equal<
  z.infer<typeof leadSchemaV2>,
  Lead
>>;
```

### 4.2 Schema Versioning

| Trigger | Action |
|---|---|
| Backward‑compatible change | Add optional field. No versioning. |
| First breaking change | Create `src/entities/<name>/v1.ts`, `v2.ts`, `index.ts`. `index.ts` exports current version. |
| Entity reaches v3+ | Add `v3.ts`, update `index.ts`. Never delete prior versions. |
| Old version safe to remove | Only after all Inngest dead‑letter queue events of that version are drained. Confirm via monitoring. |

### 4.3 Schema Factory Pattern

Schemas are defined at module scope — never re‑instantiated per request.

```typescript
const baseLeadSchema = z.object({ /* shared fields */ });

export function createLeadSchema(overrides: LeadOverrides) {
  return baseLeadSchema.extend({ /* client‑specific additions */ });
}
```

### 4.4 Branded Types with Zod

Zod v4 provides `.brand()` for runtime branding, complementary to `firm‑types` compile‑time brands:

```typescript
const TenantIdSchema = z.string().uuid().brand<'TenantId'>();
type TenantId = z.infer<typeof TenantIdSchema>; // branded type at both compile and runtime
```

Use Zod branding for validated inputs; `firm‑types` `asTenantId()` for re‑validation at trust boundaries.

---

## 5. Package Configuration

### 5.1 `package.json`

```jsonc
{
  "name": "firm‑validators",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts --sourcemap",
    "typecheck": "tsc --build --noEmit",
    "lint": "eslint src/ tests/",
    "test": "vitest run --coverage",
    "test:watch": "vitest"
  },
  "dependencies": {
    "firm‑types": "workspace:*",
    "zod": "catalog:"
  },
  "devDependencies": {
    "firm‑config‑typescript": "workspace:*",
    "firm‑config‑eslint": "workspace:*",
    "tsup": "catalog:",
    "vitest": "catalog:",
    "typescript": "catalog:"
  },
  "sideEffects": false
}
```

### 5.2 `tsconfig.json`

```jsonc
{
  "extends": "firm‑config‑typescript/base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  },
  "include": ["src", "tests"],
  "exclude": ["dist", "node_modules"],
  "references": [
    { "path": "../firm‑types" }
  ]
}
```

---

## 6. Test Strategy

### 6.1 Per‑Schema Test Requirements

| Category | Fixture | Example |
|---|---|---|
| Happy path | Fully valid input | All required + optional fields |
| Missing required | Absent required field | `{ ...valid, email: undefined }` |
| Wrong type | Type mismatch | `{ ...valid, age: "twelve" }` |
| Boundary | Min/max/edge values | Empty string, max length, negative numbers |
| Cross‑field | Validates `.superRefine()` logic | Email present but phone absent |
| Brand | Verifies brand on parsed output | Output assignable to branded type |

### 6.2 Compile‑Time Tests

`tests/entities/lead.test-d.ts` uses `Expect`/`Equal` for full type‑equality verification (catches missing optional fields that `satisfies` misses).

### 6.3 Test Template

```typescript
import { describe, it, expect } from 'vitest';
import * as z from 'zod';
import { leadSchemaV2 } from '../../src/entities/lead/v2';
import { validLeadFixture, invalidLeadFixtures } from '../fixtures/lead';

describe('leadSchemaV2', () => {
  it('accepts valid lead', () => {
    expect(leadSchemaV2.safeParse(validLeadFixture).success).toBe(true);
  });

  it('rejects missing email', () => {
    const result = leadSchemaV2.safeParse({ ...validLeadFixture, email: undefined });
    expect(result.success).toBe(false);
    expect(result.error.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: ['email'] })])
    );
  });

  it('satisfies Lead interface at compile time', () => {
    // Type‑level assertion — passes if compilation succeeds
    expect(true).toBe(true);
  });
});
```

Use `expect.toMatchSchema()` custom matcher for Standard Schema‑compatible validators where available.

---

## 7. Build Order & Dependency Map

```
firm‑types (Layer 2, Wave 3 — built first)
      │
      ├── firm‑validators (this package — depends on firm‑types)
      ├── firm‑api‑contracts (depends on firm‑types + firm‑validators)
      ├── firm‑db (depends on firm‑types + firm‑validators)
      └── firm‑cache (depends on firm‑types only)

firm‑validators ──► consumed by all Layer 2–7 packages
```

`firm‑validators` builds in parallel with `firm‑api‑contracts`, `firm‑db`, and `firm‑cache` once `firm‑types` is compiled.

---

## 8. Interface Freeze & Governance

- After Wave 3, schema exports are governed by the Entity‑to‑Schema workflow: interface changes in `firm‑types` trigger corresponding schema updates here, verified by `satisfies` enforcement.
- Adding a new optional field → **minor** (backward‑compatible).
- Renaming/removing a field, or changing its type → **major**, with schema versioning (`v1.ts` preserved, `v2.ts` created).
- CI gate: `tsc --build --noEmit` must pass for both `firm‑types` and `firm‑validators` simultaneously — a breaking interface change in `firm‑types` fails CI until the corresponding schema update is made.

---

## 9. Documentation Requirements

- **README.md** must follow the monorepo template: Purpose, API Reference listing all exported schemas, Usage Examples, Links.
- **TSDoc comments** on every exported schema. Include `@example` blocks showing valid input.
- All public schemas must use `.meta()` for structured metadata (description, constraints, examples). This metadata feeds `firm‑api‑contracts` OpenAPI docs and AI tool definitions.

---

## 10. Consumer Patterns (Quick Reference)

For any package consuming `firm‑validators`:

```typescript
import * as z from 'zod';
import { leadSchema } from 'firm‑validators';

// Public API boundary — use safeParse
const result = leadSchema.safeParse(untrustedInput);
if (!result.success) {
  return { errors: z.treeifyError(result.error) };
}
const validated = result.data;

// Internal data (already typed) — use decode
const validated = leadSchema.decode(alreadyTypedData);

// Programmer error (should never fail) — use parse
const config = tenantConfigSchema.parse(loadedConfig);
```

---

