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
