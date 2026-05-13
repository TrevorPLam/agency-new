# firm-config-typescript

Generated on: 2026-05-13T02:25:38.316Z
Total files: 2

**Description:** Shared TypeScript configuration for the firm platform

**Version:** 1.0.0

## Table of Contents

- [config-factory.ts](#config-factory-ts)
- [index.ts](#index-ts)

## File Contents

### config-factory.ts

**Path:** `src\config-factory.ts`

**Language:** TypeScript

```typescript
import type { CompilerOptions } from 'typescript';
import {
  ScriptTarget,
  ModuleKind,
  ModuleResolutionKind,
  JsxEmit,
} from 'typescript';

/**
 * Creates a TypeScript configuration object with the given overrides.
 * 
 * @param overrides - Partial compiler options to override defaults
 * @returns Complete TypeScript compiler options
 */
export function createTsConfig(overrides: Partial<CompilerOptions> = {}): CompilerOptions {
  const baseOptions: CompilerOptions = {
    target: ScriptTarget.ES2022,
    lib: ['ES2022'],
    module: ModuleKind.ESNext,
    moduleResolution: ModuleResolutionKind.Bundler,
    allowImportingTsExtensions: false,
    verbatimModuleSyntax: true,
    isolatedDeclarations: true,
    erasableSyntaxOnly: true,
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    resolveJsonModule: true,
    exactOptionalPropertyTypes: false,
    noImplicitReturns: true,
    noFallthroughCasesInSwitch: true,
    noUncheckedIndexedAccess: true,
    removeComments: false,
    sourceMap: true,
    declaration: true,
    declarationMap: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
  };

  return {
    ...baseOptions,
    ...overrides,
  } satisfies CompilerOptions;
}

/**
 * Creates a TypeScript configuration for shared libraries.
 */
export function createSharedLibraryConfig(overrides: Partial<CompilerOptions> = {}): CompilerOptions {
  return createTsConfig({
    outDir: './dist',
    rootDir: './src',
    composite: true,
    declaration: true,
    declarationMap: true,
    ...overrides,
  });
}

/**
 * Creates a TypeScript configuration for Next.js applications.
 */
export function createAppConfig(overrides: Partial<CompilerOptions> = {}): CompilerOptions {
  return createTsConfig({
    target: ScriptTarget.ES2022,
    lib: ['ES2022', 'DOM', 'DOM.Iterable'],
    jsx: JsxEmit.Preserve,
    incremental: true,
    noEmit: true,
    ...overrides,
  });
}

/**
 * Creates a TypeScript configuration for services.
 */
export function createServiceConfig(overrides: Partial<CompilerOptions> = {}): CompilerOptions {
  return createTsConfig({
    outDir: './dist',
    rootDir: './src',
    composite: true,
    declaration: true,
    declarationMap: true,
    sourceMap: true,
    removeComments: false,
    ...overrides,
  });
}

```

---

### index.ts

**Path:** `src\index.ts`

**Language:** TypeScript

```typescript
export type { CompilerOptions } from 'typescript';

export {
  createTsConfig,
  createSharedLibraryConfig,
  createAppConfig,
  createServiceConfig,
} from './config-factory';

```

---

