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
