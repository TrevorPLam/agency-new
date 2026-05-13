# @firm-org/tokens

Design token pipeline for the Firm platform using DTCG format and Style Dictionary.

## Overview

This package contains the design system tokens for the Firm platform, following the W3C Design Token Community Group (DTCG) format. It generates:

- CSS custom properties (`--firm-*`)
- TypeScript constants
- JSON token files

## Token Hierarchy

The tokens are organized in three levels:

### Core (`firm.core`)
Primitive values like colors, typography, spacing, etc.

### Brand (`firm.brand`)
Brand-specific values that reference core tokens.

### Context (`firm.context`)
- **Semantic**: High-level semantic tokens (text, background, borders, etc.)
- **Component**: Component-specific tokens (card, input, modal, etc.)

## Usage

### Installation

```bash
npm install @firm-org/tokens
```

### CSS Variables

```css
@import '@firm-org/tokens/dist/variables.css';

.my-component {
  background-color: var(--firm-brand-background-primary);
  color: var(--firm-context-color-text-primary);
  border-radius: var(--firm-core-border-radius-lg);
}
```

### TypeScript Constants

```typescript
import { FIRM_CORE_COLOR_BLUE_500, FIRM_BRAND_COLOR_PRIMARY } from '@firm-org/tokens';

console.log(FIRM_CORE_COLOR_BLUE_500); // '#3b82f6'
console.log(FIRM_BRAND_COLOR_PRIMARY); // '#2563eb'
```

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run dev
```

### Test

```bash
npm run test
```

### Update Snapshots

```bash
npm run test:snapshots -- --update
```

## File Structure

```
packages/firm-tokens/
├── tokens.json                 # DTCG source tokens
├── style-dictionary.config.js  # Style Dictionary configuration
├── dist/                       # Generated files
│   ├── variables.css          # CSS custom properties
│   ├── constants.ts            # TypeScript constants
│   └── tokens.json            # Nested JSON tokens
├── scripts/
│   └── test-snapshots.js      # Snapshot testing
└── snapshots/                  # Test snapshots
```

## Rules

1. **No manual edits** of generated files in `dist/`
2. **Reference tokens** using `{path.to.token}` syntax
3. **Follow DTCG format** for source tokens
4. **Run tests** after any token changes

## Advanced Features

### OKLCH Color Support

The package includes transforms for OKLCH color format (future enhancement).

### Custom Transforms

- `name/css`: Converts token paths to CSS custom property names
- `name/ts`: Converts token paths to TypeScript constant names
- `color/oklch`: Color transformation for OKLCH format
