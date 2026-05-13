# firm-config-eslint

Generated on: 2026-05-13T02:25:38.265Z
Total files: 9

**Description:** Shared ESLint flat configuration for the firm platform

**Version:** 1.0.0

## Table of Contents

- [index.ts](#index-ts)
- [base.ts](#base-ts)
- [boundaries.ts](#boundaries-ts)
- [imports.ts](#imports-ts)
- [nextjs.ts](#nextjs-ts)
- [react.ts](#react-ts)
- [typescript.ts](#typescript-ts)
- [branded-id-validation.ts](#branded-id-validation-ts)
- [eslint-plugin-boundaries.d.ts](#eslint-plugin-boundaries-d-ts)

## File Contents

### index.ts

**Path:** `src\index.ts`

**Language:** TypeScript

```typescript
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

import type { Linter } from 'eslint';

type FlatConfig = {
  files?: string | string[];
  languageOptions?: {
    ecmaVersion?: Linter.EcmaVersion | 'latest';
    sourceType?: 'script' | 'module';
    globals?: Record<string, boolean>;
    parser?: any;
    parserOptions?: any;
  };
  plugins?: Record<string, any>;
  rules?: Record<string, any>;
  settings?: Record<string, any>;
};

import { createBasePreset } from './presets/base';
import { createTypeScriptPreset } from './presets/typescript';
import { createReactPreset } from './presets/react';
import { createNextJSPreset } from './presets/nextjs';
import { createBoundariesPreset } from './presets/boundaries';
import { createImportsPreset } from './presets/imports';

export interface ConfigOptions {
  /**
   * Enable TypeScript-specific rules
   * @default true
   */
  typescript?: boolean;
  
  /**
   * Enable React-specific rules
   * @default false
   */
  react?: boolean;
  
  /**
   * Enable Next.js-specific rules
   * @default false
   */
  nextjs?: boolean;
  
  /**
   * Enable boundaries rules for layer restrictions
   * @default true
   */
  boundaries?: boolean;
  
  /**
   * Enable import organization rules
   * @default true
   */
  imports?: boolean;
}

/**
 * Creates a complete ESLint flat config array with the specified options.
 * 
 * @param options - Configuration options
 * @returns ESLint flat config array
 */
export function createConfig(options: ConfigOptions = {}): FlatConfig[] {
  const {
    typescript = true,
    react = false,
    nextjs = false,
    boundaries = true,
    imports = true,
  } = options;

  const configs: FlatConfig[] = [
    // Always include base configuration
    ...createBasePreset(),
  ];

  // Add optional presets
  if (typescript) {
    configs.push(...createTypeScriptPreset());
  }

  if (react) {
    configs.push(...createReactPreset());
  }

  if (nextjs) {
    configs.push(...createNextJSPreset());
  }

  if (boundaries) {
    configs.push(...createBoundariesPreset());
  }

  if (imports) {
    configs.push(...createImportsPreset());
  }

  // Add prettier config last to override any conflicting rules
  configs.push(prettierConfig);

  return configs;
}

/**
 * Default configuration with TypeScript, boundaries, and imports enabled.
 */
export const defaultConfig: FlatConfig[] = createConfig();

/**
 * Configuration for React applications.
 */
export const reactConfig: FlatConfig[] = createConfig({ react: true });

/**
 * Configuration for Next.js applications.
 */
export const nextjsConfig: FlatConfig[] = createConfig({ react: true, nextjs: true });

/**
 * Configuration for Node.js services.
 */
export const serviceConfig: FlatConfig[] = createConfig({ react: false, nextjs: false });

// Export individual presets for advanced composition
export {
  createBasePreset,
  createTypeScriptPreset,
  createReactPreset,
  createNextJSPreset,
  createBoundariesPreset,
  createImportsPreset,
};

// Re-export typescript-eslint config helper for compatibility
export const config: typeof tseslint.config = tseslint.config;

```

---

### base.ts

**Path:** `src\presets\base.ts`

**Language:** TypeScript

```typescript
import type { Linter } from 'eslint';

type FlatConfig = {
  files?: string | string[];
  languageOptions?: {
    ecmaVersion?: Linter.EcmaVersion | 'latest';
    sourceType?: 'script' | 'module';
    globals?: Record<string, boolean>;
    parser?: any;
    parserOptions?: any;
  };
  plugins?: Record<string, any>;
  rules?: Record<string, any>;
  settings?: Record<string, any>;
};
import globals from 'globals';

export function createBasePreset(): FlatConfig[] {
  return [
    {
      languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        globals: {
          ...globals.node,
          ...globals.es2022,
        },
      },
      rules: {
        // General best practices
        'no-console': 'warn',
        'no-debugger': 'error',
        'no-alert': 'error',
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'no-new-func': 'error',
        'no-script-url': 'error',
        'prefer-const': 'error',
        'no-var': 'error',
        'object-shorthand': 'error',
        'prefer-destructuring': ['error', { object: true, array: false }],
        'prefer-template': 'error',
        'template-curly-spacing': ['error', 'never'],
        'arrow-spacing': 'error',
        'comma-dangle': ['error', 'always-multiline'],
        'comma-spacing': 'error',
        'comma-style': 'error',
        'computed-property-spacing': 'error',
        'func-call-spacing': 'error',
        'indent': ['error', 2, { SwitchCase: 1 }],
        'key-spacing': 'error',
        'keyword-spacing': 'error',
        'linebreak-style': ['error', 'unix'],
        'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
        'no-trailing-spaces': 'error',
        'object-curly-spacing': ['error', 'always'],
        'quotes': ['error', 'single', { avoidEscape: true }],
        'semi': ['error', 'always'],
        'space-before-blocks': 'error',
        'space-before-function-paren': ['error', {
          anonymous: 'always',
          named: 'never',
          asyncArrow: 'always',
        }],
        'space-in-parens': 'error',
        'space-infix-ops': 'error',
        'space-unary-ops': 'error',
        'spaced-comment': ['error', 'always'],
      },
    },
  ];
}

```

---

### boundaries.ts

**Path:** `src\presets\boundaries.ts`

**Language:** TypeScript

```typescript
import type { Linter } from 'eslint';

type FlatConfig = {
  files?: string | string[];
  languageOptions?: {
    ecmaVersion?: Linter.EcmaVersion | 'latest';
    sourceType?: 'script' | 'module';
    globals?: Record<string, boolean>;
    parser?: any;
    parserOptions?: any;
  };
  plugins?: Record<string, any>;
  rules?: Record<string, any>;
  settings?: Record<string, any>;
};
import boundariesPlugin from 'eslint-plugin-boundaries';

export function createBoundariesPreset(): FlatConfig[] {
  return [
    {
      settings: {
        'boundaries/elements': [
          {
            type: 'config',
            pattern: 'packages/firm-config-*/**',
            mode: 'public',
          },
          {
            type: 'utils',
            pattern: 'packages/firm-utils/**',
            mode: 'public',
          },
          {
            type: 'errors',
            pattern: 'packages/firm-errors/**',
            mode: 'public',
          },
          {
            type: 'crypto',
            pattern: 'packages/firm-crypto/**',
            mode: 'public',
          },
          {
            type: 'logger',
            pattern: 'packages/firm-logger/**',
            mode: 'public',
          },
          {
            type: 'types',
            pattern: 'packages/firm-types/**',
            mode: 'public',
          },
          {
            type: 'validators',
            pattern: 'packages/firm-validators/**',
            mode: 'public',
          },
          {
            type: 'api-contracts',
            pattern: 'packages/firm-api-contracts/**',
            mode: 'public',
          },
          {
            type: 'db',
            pattern: 'packages/firm-db/**',
            mode: 'public',
          },
          {
            type: 'cache',
            pattern: 'packages/firm-cache/**',
            mode: 'public',
          },
          {
            type: 'security',
            pattern: 'packages/firm-security/**',
            mode: 'public',
          },
          {
            type: 'auth',
            pattern: 'packages/firm-auth/**',
            mode: 'public',
          },
          {
            type: 'consent',
            pattern: 'packages/firm-consent/**',
            mode: 'public',
          },
          {
            type: 'env',
            pattern: 'packages/firm-env/**',
            mode: 'public',
          },
        ],
      },
      plugins: {
        boundaries: boundariesPlugin,
      },
      rules: {
        // Disallow unknown elements
        'boundaries/no-unknown': 'error',
        
        // Enforce dependency direction based on layer architecture
        'boundaries/allowed-types': [
          'error',
          {
            default: 'disallow',
            rules: [
              // Config can import anything (lowest layer)
              {
                from: 'config',
                allow: ['*'],
              },
              
              // Utils can only import config and other utils
              {
                from: 'utils',
                allow: ['config', 'utils'],
              },
              
              // Errors can import config, utils, and errors
              {
                from: 'errors',
                allow: ['config', 'utils', 'errors'],
              },
              
              // Crypto can import config, utils, errors, and crypto
              {
                from: 'crypto',
                allow: ['config', 'utils', 'errors', 'crypto'],
              },
              
              // Logger can import config, utils, errors, crypto, and logger
              {
                from: 'logger',
                allow: ['config', 'utils', 'errors', 'crypto', 'logger'],
              },
              
              // Types can import config, utils, errors, crypto, logger, and types
              {
                from: 'types',
                allow: ['config', 'utils', 'errors', 'crypto', 'logger', 'types'],
              },
              
              // Validators can import config, utils, errors, crypto, logger, types, and validators
              {
                from: 'validators',
                allow: ['config', 'utils', 'errors', 'crypto', 'logger', 'types', 'validators'],
              },
              
              // API contracts can import all above layers
              {
                from: 'api-contracts',
                allow: ['config', 'utils', 'errors', 'crypto', 'logger', 'types', 'validators', 'api-contracts'],
              },
              
              // DB can import all above layers
              {
                from: 'db',
                allow: ['config', 'utils', 'errors', 'crypto', 'logger', 'types', 'validators', 'api-contracts', 'db'],
              },
              
              // Cache can import all above layers
              {
                from: 'cache',
                allow: ['config', 'utils', 'errors', 'crypto', 'logger', 'types', 'validators', 'api-contracts', 'db', 'cache'],
              },
              
              // Security can import all above layers
              {
                from: 'security',
                allow: ['config', 'utils', 'errors', 'crypto', 'logger', 'types', 'validators', 'api-contracts', 'db', 'cache', 'security'],
              },
              
              // Auth can import all above layers
              {
                from: 'auth',
                allow: ['config', 'utils', 'errors', 'crypto', 'logger', 'types', 'validators', 'api-contracts', 'db', 'cache', 'security', 'auth'],
              },
              
              // Consent can import all above layers
              {
                from: 'consent',
                allow: ['config', 'utils', 'errors', 'crypto', 'logger', 'types', 'validators', 'api-contracts', 'db', 'cache', 'security', 'auth', 'consent'],
              },
              
              // Env can import all above layers (highest layer)
              {
                from: 'env',
                allow: ['*'],
              },
            ],
          },
        ],
        
        // Disallow private imports (use exports field)
        'boundaries/no-private': 'error',
        
        // Prefer absolute imports within monorepo
        'boundaries/prefer-absolute': 'error',
      },
    },
  ];
}

```

---

### imports.ts

**Path:** `src\presets\imports.ts`

**Language:** TypeScript

```typescript
import type { Linter } from 'eslint';

type FlatConfig = {
  files?: string | string[];
  languageOptions?: {
    ecmaVersion?: Linter.EcmaVersion | 'latest';
    sourceType?: 'script' | 'module';
    globals?: Record<string, boolean>;
    parser?: any;
    parserOptions?: any;
  };
  plugins?: Record<string, any>;
  rules?: Record<string, any>;
  settings?: Record<string, any>;
};
import perfectionistPlugin from 'eslint-plugin-perfectionist';

export function createImportsPreset(): FlatConfig[] {
  return [
    {
      plugins: {
        perfectionist: perfectionistPlugin,
      },
      rules: {
        // Perfectionist import sorting with array-based customGroups
        'perfectionist/sort-objects': [
          'error',
          {
            type: 'alphabetical',
            order: 'asc',
            caseSensitive: false,
          },
        ],
        'perfectionist/sort-array-values': [
          'error',
          {
            type: 'alphabetical',
            order: 'asc',
            caseSensitive: false,
          },
        ],
        'perfectionist/sort-exports': [
          'error',
          {
            type: 'alphabetical',
            order: 'asc',
            caseSensitive: false,
          },
        ],
        'perfectionist/sort-imports': [
          'error',
          {
            type: 'alphabetical',
            order: 'asc',
            caseSensitive: false,
            groups: [
              'builtin',
              'external',
              'internal',
              'parent',
              'sibling',
              'index',
              'object',
              'type',
            ],
            'custom-groups': {
              builtin: ['^(node|fs|path|os|crypto|util|url|http|https|stream|events|buffer|child_process|cluster|dgram|dns|net|readline|repl|tls|v8|vm|worker_threads|zlib|console|timers|async_hooks|diagnostics_channel|perf_hooks|process|punycode|querystring|string_decoder|sys|trace_events|tty|v8)$'],
              external: ['^(react|react-dom|next|@next|@types|@react|@radix|@hookform|zod|drizzle-orm|@t3-oss|@auth|@inngest|pino|lucia|ioredis|redis|@upstash|@planetscale|@neondatabase)$'],
              internal: ['^@firm/'],
              type: ['^.*\\.type$'],
            },
          },
        ],
        'perfectionist/sort-interfaces': [
          'error',
          {
            type: 'alphabetical',
            order: 'asc',
            caseSensitive: false,
          },
        ],
        'perfectionist/sort-intersection-types': [
          'error',
          {
            type: 'alphabetical',
            order: 'asc',
            caseSensitive: false,
          },
        ],
        'perfectionist/sort-named-exports': [
          'error',
          {
            type: 'alphabetical',
            order: 'asc',
            caseSensitive: false,
          },
        ],
        'perfectionist/sort-named-imports': [
          'error',
          {
            type: 'alphabetical',
            order: 'asc',
            caseSensitive: false,
          },
        ],
        'perfectionist/sort-object-types': [
          'error',
          {
            type: 'alphabetical',
            order: 'asc',
            caseSensitive: false,
          },
        ],
        'perfectionist/sort-union-types': [
          'error',
          {
            type: 'alphabetical',
            order: 'asc',
            caseSensitive: false,
          },
        ],
        'perfectionist/sort-variable-declarations': [
          'error',
          {
            type: 'alphabetical',
            order: 'asc',
            caseSensitive: false,
          },
        ],
      },
    },
  ];
}

```

---

### nextjs.ts

**Path:** `src\presets\nextjs.ts`

**Language:** TypeScript

```typescript
import type { Linter } from 'eslint';

type FlatConfig = {
  files?: string | string[];
  languageOptions?: {
    ecmaVersion?: Linter.EcmaVersion | 'latest';
    sourceType?: 'script' | 'module';
    globals?: Record<string, boolean>;
    parser?: any;
    parserOptions?: any;
  };
  plugins?: Record<string, any>;
  rules?: Record<string, any>;
  settings?: Record<string, any>;
};
import nextPlugin from '@next/eslint-plugin-next';

export function createNextJSPreset(): FlatConfig[] {
  return [
    {
      files: ['**/*.{js,jsx,ts,tsx}'],
      plugins: {
        '@next/next': nextPlugin,
      },
      rules: {
        // Next.js specific rules
        '@next/next/no-img-element': 'error',
        '@next/next/no-html-link-for-pages': 'error',
        '@next/next/no-page-custom-font': 'error',
        '@next/next/no-typos': 'error',
        '@next/next/no-css-tags': 'error',
        '@next/next/no-head-import-in-document': 'error',
        '@next/next/no-sync-scripts': 'error',
        '@next/next/google-font-display': 'error',
        '@next/next/google-font-preconnect': 'error',
        '@next/next/inline-script-id': 'error',
        '@next/next/no-assign-module-variable': 'error',
        '@next/next/no-duplicate-head': 'error',
        '@next/next/no-head-element': 'error',
        '@next/next/no-script-component-in-head': 'error',
        '@next/next/no-styled-jsx-in-document': 'error',
        '@next/next/no-title-in-document-head': 'error',
      },
    },
  ];
}

```

---

### react.ts

**Path:** `src\presets\react.ts`

**Language:** TypeScript

```typescript
import type { Linter } from 'eslint';

type FlatConfig = {
  files?: string | string[];
  languageOptions?: {
    ecmaVersion?: Linter.EcmaVersion | 'latest';
    sourceType?: 'script' | 'module';
    globals?: Record<string, boolean>;
    parser?: any;
    parserOptions?: any;
  };
  plugins?: Record<string, any>;
  rules?: Record<string, any>;
  settings?: Record<string, any>;
};
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';

export function createReactPreset(): FlatConfig[] {
  return [
    {
      files: ['**/*.jsx', '**/*.tsx'],
      languageOptions: {
        globals: {
          ...globals.browser,
          ...globals.es2022,
        },
        parserOptions: {
          ecmaFeatures: {
            jsx: true,
          },
        },
      },
      settings: {
        react: {
          version: '19.2.6', // Workaround for eslint-plugin-react incompatibility
        },
      },
      plugins: {
        react: reactPlugin,
        'react-hooks': reactHooksPlugin,
      },
      rules: {
        // React rules
        'react/jsx-uses-react': 'off', // Not needed in React 17+
        'react/react-in-jsx-scope': 'off', // Not needed in React 17+
        'react/jsx-uses-vars': 'error',
        'react/jsx-key': 'error',
        'react/jsx-no-duplicate-props': 'error',
        'react/jsx-no-undef': 'error',
        'react/jsx-pascal-case': 'error',
        'react/no-children-prop': 'error',
        'react/no-danger-with-children': 'error',
        'react/no-deprecated': 'error',
        'react/no-direct-mutation-state': 'error',
        'react/no-find-dom-node': 'error',
        'react/no-is-mounted': 'error',
        'react/no-render-return-value': 'error',
        'react/no-string-refs': 'error',
        'react/no-unescaped-entities': 'error',
        'react/no-unknown-property': 'error',
        'react/prop-types': 'off', // Using TypeScript for prop validation
        'react/self-closing-comp': 'error',
        'react/jsx-fragments': ['error', 'syntax'],
        'react/jsx-no-useless-fragment': 'error',
        'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
        'react/hook-use-state': 'error',
        
        // React Hooks rules
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
      },
    },
  ];
}

```

---

### typescript.ts

**Path:** `src\presets\typescript.ts`

**Language:** TypeScript

```typescript
import type { Linter } from 'eslint';

type FlatConfig = {
  files?: string | string[];
  languageOptions?: {
    ecmaVersion?: Linter.EcmaVersion | 'latest';
    sourceType?: 'script' | 'module';
    globals?: Record<string, boolean>;
    parser?: any;
    parserOptions?: any;
  };
  plugins?: Record<string, any>;
  rules?: Record<string, any>;
  settings?: Record<string, any>;
};
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export function createTypeScriptPreset(): FlatConfig[] {
  return [
    {
      files: ['**/*.ts', '**/*.tsx'],
      languageOptions: {
        parser: tsParser,
        parserOptions: {
          projectService: true,
          tsconfigRootDir: process.cwd(),
        },
      },
      plugins: {
        '@typescript-eslint': tsPlugin,
      },
      rules: {
        // TypeScript specific rules
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/prefer-nullish-coalescing': 'error',
        '@typescript-eslint/prefer-optional-chain': 'error',
        '@typescript-eslint/no-unnecessary-type-assertion': 'error',
        '@typescript-eslint/no-non-null-assertion': 'warn',
        '@typescript-eslint/consistent-type-imports': [
          'error',
          { prefer: 'type-imports', disallowTypeAnnotations: false },
        ],
        '@typescript-eslint/no-import-type-side-effects': 'error',
        '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
        '@typescript-eslint/prefer-function-type': 'error',
        '@typescript-eslint/prefer-readonly': 'error',
        '@typescript-eslint/prefer-readonly-parameter-types': 'off',
        '@typescript-eslint/require-await': 'error',
        '@typescript-eslint/return-await': ['error', 'always'],
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-misused-promises': 'error',
        '@typescript-eslint/await-thenable': 'error',
        '@typescript-eslint/no-for-in-array': 'error',
        '@typescript-eslint/no-unnecessary-type-constraint': 'error',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
      },
    },
  ];
}

```

---

### branded-id-validation.ts

**Path:** `src\rules\branded-id-validation.ts`

**Language:** TypeScript

```typescript
/**
 * ESLint rule to enforce proper validation of branded IDs
 * 
 * This rule prevents unsafe type assertions like `as UserId` and requires
 * the use of validation gatekeeper functions like `asUserId()`.
 */

import type { Rule } from 'eslint';

// List of branded ID types that require validation
const BRANDED_ID_TYPES = [
  'TenantId',
  'UserId', 
  'LeadId',
  'CampaignId',
  'BookingId',
  'InvoiceId',
  'SubscriptionId',
  'EmailTemplateId',
  'FormId',
  'WebhookId',
  'ApiKeyId',
  'SessionId',
  'AuditLogId',
  'SyncJobId',
  'ReportId',
];

// Mapping of branded types to their validation functions
const VALIDATION_FUNCTIONS: Record<string, string> = {
  'TenantId': 'asTenantId',
  'UserId': 'asUserId',
  'LeadId': 'asLeadId',
  'CampaignId': 'asCampaignId',
  'BookingId': 'asBookingId',
  'InvoiceId': 'asInvoiceId',
  'SubscriptionId': 'asSubscriptionId',
  'EmailTemplateId': 'asEmailTemplateId',
  'FormId': 'asFormId',
  'WebhookId': 'asWebhookId',
  'ApiKeyId': 'asApiKeyId',
  'SessionId': 'asSessionId',
  'AuditLogId': 'asAuditLogId',
  'SyncJobId': 'asSyncJobId',
  'ReportId': 'asReportId',
};

export const brandedIdValidationRule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce proper validation of branded IDs using gatekeeper functions',
      recommended: true,
      url: 'https://github.com/firm-platform/eslint-config/docs/rules/branded-id-validation.md',
    },
    fixable: 'code',
    schema: [],
    messages: {
      unsafeAssertion: 'Unsafe type assertion "{{type}}" detected. Use "{{validationFunction}}"() instead for proper UUID validation.',
      unsafeAnyAssertion: 'Unsafe "as any" assertion detected. This bypasses type safety for branded IDs.',
    },
  },
  
  create(context) {
    const sourceCode = context.getSourceCode();
    
    return {
      // Check for type assertions like "as UserId"
      TSAsExpression(node: any) {
        const typeAnnotation = node.typeAnnotation;
        
        // Check if it's a branded ID type
        if (typeAnnotation.type === 'TSTypeReference' && 
            typeAnnotation.typeName.type === 'Identifier') {
          const typeName = typeAnnotation.typeName.name;
          
          if (BRANDED_ID_TYPES.includes(typeName)) {
            const validationFunction = VALIDATION_FUNCTIONS[typeName];
            
            context.report({
              node,
              messageId: 'unsafeAssertion',
              data: {
                type: typeName,
                validationFunction,
              },
              fix(fixer) {
                // Replace "as UserId" with "asUserId(value)"
                const expressionText = sourceCode.getText(node.expression);
                
                return fixer.replaceText(
                  node,
                  `${validationFunction}(${expressionText})`
                );
              },
            });
          }
        }
        
        // Check for "as any" which is especially dangerous
        if (typeAnnotation.type === 'TSAnyKeyword') {
          // Check if the expression might be a branded ID context
          const parentText = sourceCode.getText(node.parent || node);
          const hasBrandedIdContext = BRANDED_ID_TYPES.some(type => 
            parentText.includes(type)
          );
          
          if (hasBrandedIdContext) {
            context.report({
              node,
              messageId: 'unsafeAnyAssertion',
            });
          }
        }
      },
      
      // Check for angle bracket type assertions like "<UserId>value"
      TSTypeAssertion(node: any) {
        const typeAnnotation = node.typeAnnotation;
        
        if (typeAnnotation.type === 'TSTypeReference' && 
            typeAnnotation.typeName.type === 'Identifier') {
          const typeName = typeAnnotation.typeName.name;
          
          if (BRANDED_ID_TYPES.includes(typeName)) {
            const validationFunction = VALIDATION_FUNCTIONS[typeName];
            
            context.report({
              node,
              messageId: 'unsafeAssertion',
              data: {
                type: typeName,
                validationFunction,
              },
              fix(fixer) {
                // Replace "<UserId>value" with "asUserId(value)"
                const expressionText = sourceCode.getText(node.expression);
                
                return fixer.replaceText(
                  node,
                  `${validationFunction}(${expressionText})`
                );
              },
            });
          }
        }
      },
    };
  },
};

```

---

### eslint-plugin-boundaries.d.ts

**Path:** `src\types\eslint-plugin-boundaries.d.ts`

**Language:** TypeScript

```typescript
declare module 'eslint-plugin-boundaries' {
  const plugin: any;
  export default plugin;
}

```

---

