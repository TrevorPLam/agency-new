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
          {
            type: 'workers',
            pattern: 'workers/**',
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
              
              // Workers can import all layers (same privilege as env)
              {
                from: 'workers',
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
