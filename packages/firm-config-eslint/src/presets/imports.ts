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
