# firm-config-tailwind

Generated on: 2026-05-13T02:25:38.306Z
Total files: 2

**Description:** Shared Tailwind CSS preset for the firm platform

**Version:** 1.0.0

## Table of Contents

- [safelist.js](#safelist-js)
- [tailwind.config.js](#tailwind-config-js)

## File Contents

### safelist.js

**Path:** `src\safelist.js`

**Language:** JavaScript

```javascript
/**
 * Tailwind CSS safelist and content baseline for Firm Platform
 * 
 * This file exports safelist patterns and content paths to ensure
 * dynamic classes are not purged during the Tailwind build process.
 * 
 * Usage in tailwind.config.js:
 * ```js
 * import { safelist, content } from '@firm/config-tailwind/safelist.js';
 * 
 * export default {
 *   safelist,
 *   content,
 *   // ... other config
 * };
 * ```
 */

/**
 * Safelist patterns for dynamic class names
 * These patterns ensure classes generated at runtime are not purged
 */
export const safelist = [
  // Spacing utilities (common dynamic values)
  ...Array.from({ length: 100 }, (_, i) => `p-${i}`),
  ...Array.from({ length: 100 }, (_, i) => `px-${i}`),
  ...Array.from({ length: 100 }, (_, i) => `py-${i}`),
  ...Array.from({ length: 100 }, (_, i) => `pt-${i}`),
  ...Array.from({ length: 100 }, (_, i) => `pr-${i}`),
  ...Array.from({ length: 100 }, (_, i) => `pb-${i}`),
  ...Array.from({ length: 100 }, (_, i) => `pl-${i}`),
  ...Array.from({ length: 100 }, (_, i) => `m-${i}`),
  ...Array.from({ length: 100 }, (_, i) => `mx-${i}`),
  ...Array.from({ length: 100 }, (_, i) => `my-${i}`),
  ...Array.from({ length: 100 }, (_, i) => `mt-${i}`),
  ...Array.from({ length: 100 }, (_, i) => `mr-${i}`),
  ...Array.from({ length: 100 }, (_, i) => `mb-${i}`),
  ...Array.from({ length: 100 }, (_, i) => `ml-${i}`),
  
  // Width/height utilities
  ...Array.from({ length: 100 }, (_, i) => `w-${i}`),
  ...Array.from({ length: 100 }, (_, i) => `h-${i}`),
  ...Array.from({ length: 100 }, (_, i) => `max-w-${i}`),
  ...Array.from({ length: 100 }, (_, i) => `max-h-${i}`),
  
  // Font sizes
  ...Array.from({ length: 100 }, (_, i) => `text-${i}`),
  
  // Colors (common variants)
  ...['red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink', 'gray'].flatMap(
    color => [
      `bg-${color}-50`,
      `bg-${color}-100`,
      `bg-${color}-200`,
      `bg-${color}-300`,
      `bg-${color}-400`,
      `bg-${color}-500`,
      `bg-${color}-600`,
      `bg-${color}-700`,
      `bg-${color}-800`,
      `bg-${color}-900`,
      `text-${color}-50`,
      `text-${color}-100`,
      `text-${color}-200`,
      `text-${color}-300`,
      `text-${color}-400`,
      `text-${color}-500`,
      `text-${color}-600`,
      `text-${color}-700`,
      `text-${color}-800`,
      `text-${color}-900`,
      `border-${color}-50`,
      `border-${color}-100`,
      `border-${color}-200`,
      `border-${color}-300`,
      `border-${color}-400`,
      `border-${color}-500`,
      `border-${color}-600`,
      `border-${color}-700`,
      `border-${color}-800`,
      `border-${color}-900`,
      `ring-${color}-50`,
      `ring-${color}-100`,
      `ring-${color}-200`,
      `ring-${color}-300`,
      `ring-${color}-400`,
      `ring-${color}-500`,
      `ring-${color}-600`,
      `ring-${color}-700`,
      `ring-${color}-800`,
      `ring-${color}-900`,
    ]
  ),
  
  // Opacity utilities
  ...Array.from({ length: 101 }, (_, i) => `opacity-${i}`),
  
  // Z-index utilities
  ...Array.from({ length: 51 }, (_, i) => `z-${i}`),
  
  // Grid columns
  ...Array.from({ length: 13 }, (_, i) => `grid-cols-${i}`),
  
  // Grid rows
  ...Array.from({ length: 13 }, (_, i) => `grid-rows-${i}`),
  
  // Flex utilities
  'flex-1',
  'flex-2',
  'flex-3',
  'flex-4',
  'flex-5',
  'flex-6',
  'flex-7',
  'flex-8',
  'flex-9',
  'flex-10',
  'flex-11',
  'flex-12',
  
  // Gap utilities
  ...Array.from({ length: 100 }, (_, i) => `gap-${i}`),
  ...Array.from({ length: 100 }, (_, i) => `gap-x-${i}`),
  ...Array.from({ length: 100 }, (_, i) => `gap-y-${i}`),
  
  // Border radius
  ...Array.from({ length: 100 }, (_, i) => `rounded-${i}`),
  'rounded-t',
  'rounded-r',
  'rounded-b',
  'rounded-l',
  'rounded-tl',
  'rounded-tr',
  'rounded-br',
  'rounded-bl',
];

/**
 * Content paths for Tailwind to scan for class names
 * Adjust these paths based on your project structure
 */
export const content = [
  './src/**/*.{js,ts,jsx,tsx}',
  './app/**/*.{js,ts,jsx,tsx}',
  './pages/**/*.{js,ts,jsx,tsx}',
  './components/**/*.{js,ts,jsx,tsx}',
  './lib/**/*.{js,ts,jsx,tsx}',
];

/**
 * Default export for easy importing
 */
export default {
  safelist,
  content,
};

```

---

### tailwind.config.js

**Path:** `tailwind.config.js`

**Language:** JavaScript

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [],
  theme: {
    extend: {},
  },
  plugins: [],
};

```

---

