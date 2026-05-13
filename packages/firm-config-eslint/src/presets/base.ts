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
