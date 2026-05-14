import type { Linter } from 'eslint';
import { noDirectFetchRule } from '../rules/no-direct-fetch';
import { noDirectReadModelWriteRule } from '../rules/no-direct-read-model-write';
import { noRuntimeTokensImportRule } from '../rules/no-runtime-tokens-import';

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

/**
 * Creates a custom rules preset with firm-specific linting rules.
 */
export function createCustomRulesPreset(): FlatConfig[] {
  return [
    {
      plugins: {
        'firm': {
          rules: {
            'no-direct-fetch': noDirectFetchRule,
            'no-direct-read-model-write': noDirectReadModelWriteRule,
            'no-runtime-tokens-import': noRuntimeTokensImportRule,
          },
        },
      },
      rules: {
        // Security: Enforce HTTP client abstraction
        'firm/no-direct-fetch': 'warn',
        
        // CQRS: Protect read model immutability
        'firm/no-direct-read-model-write': 'error',
        
        // Security: Enforce @firm/env for sensitive configuration
        'firm/no-runtime-tokens-import': 'error',
      },
    },
  ];
}
