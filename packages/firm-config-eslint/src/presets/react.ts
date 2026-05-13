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
