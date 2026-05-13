# @firm/config-typescript

Shared TypeScript configuration for the Firm platform. Provides consistent TypeScript settings across all packages and applications.

## Features

- **Consistent Configuration**: Standardized TypeScript settings for all packages
- **Shared Base Configs**: Extensible base configurations for different use cases
- **Modern TypeScript**: Latest TypeScript features and best practices
- **Path Mapping**: Preconfigured import aliases for clean imports
- **Strict Type Checking**: Maximum type safety with configurable strictness

## Installation

```bash
pnpm add -D @firm/config-typescript
```

## Usage

### Shared Library Configuration

For packages that publish to npm:

```json
{
  "extends": "@firm/config-typescript/src/shared-library.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### Application Configuration

For applications (Next.js, Express, etc.):

```json
{
  "extends": "@firm/config-typescript/src/application.json",
  "compilerOptions": {
    "outDir": "./dist",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"]
    }
  }
}
```

### Base Configuration

For maximum customization:

```json
{
  "extends": "@firm/config-typescript/src/base.json",
  "compilerOptions": {
    // Your custom options
  }
}
```

## Available Configurations

### `base.json`
Core TypeScript configuration with:
- Strict type checking enabled
- Modern ES2022 target
- ES2022 lib support
- CommonJS and ES module support
- Interop settings for mixed module systems

### `shared-library.json`
Extends `base.json` with:
- Library-specific settings
- Declaration generation
- Source map generation
- Composite project support

### `application.json`
Extends `base.json` with:
- Application-specific settings
- JSX support
- Path mapping examples
- Development-friendly settings

## Configuration Options

### Strict Type Checking

All configurations enable strict mode for maximum type safety:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Module Resolution

Modern module resolution with full interop support:

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "resolveJsonModule": true
  }
}
```

### Path Mapping

Clean import paths with aliases:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@firm/*": ["../packages/*/src"],
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"]
    }
  }
}
```

## Examples

### Package Configuration

```json
{
  "name": "@firm/my-package",
  "tsconfig": {
    "extends": "@firm/config-typescript/src/shared-library.json",
    "compilerOptions": {
      "outDir": "./dist"
    }
  }
}
```

### Next.js Application

```json
{
  "extends": "@firm/config-typescript/src/application.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"]
    },
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## Best Practices

### 1. Use Path Mapping

Configure path aliases for cleaner imports:

```typescript
// Instead of:
import { User } from '../../../../../packages/firm-types/src/index'

// Use:
import { User } from '@firm/types'
```

### 2. Enable Strict Mode

All configs enable strict mode for maximum type safety. Keep it enabled.

### 3. Use Project References

For large codebases, use project references:

```json
{
  "references": [
    { "path": "../firm-types" },
    { "path": "../firm-utils" }
  ]
}
```

### 4. Consistent Targeting

All configs target ES2022 for modern JavaScript features while maintaining compatibility.

## Compatibility

- **TypeScript**: 5.6.3+
- **Node.js**: 18.0+
- **Browsers**: Modern browsers with ES2022 support

## License

Internal use only - restricted access
