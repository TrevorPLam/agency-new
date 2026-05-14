/**
 * ESLint rule to disallow importing tokens and secrets at runtime
 * 
 * Enforces that sensitive configuration (API keys, tokens, secrets) are only
 * imported via @firm/env which provides compile-time validation and environment
 * variable resolution.
 */

import type { Rule } from 'eslint';

const FORBIDDEN_IMPORTS = [
  'API_KEY',
  'SECRET_KEY',
  'TOKEN',
  'PASSWORD',
  'CREDENTIAL',
  'ACCESS_TOKEN',
  'REFRESH_TOKEN',
  'DATABASE_URL',
  'PRIVATE_KEY',
  'ENCRYPTION_KEY',
];

export const noRuntimeTokensImportRule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow runtime imports of tokens and secrets',
      recommended: true,
      url: 'https://github.com/firm-platform/eslint-config/docs/rules/no-runtime-tokens-import.md',
    },
    fixable: undefined,
    schema: [],
    messages: {
      noRuntimeTokensImport: 'Sensitive token/secret "{{tokenName}}" imported at runtime. Use @firm/env instead for compile-time validation and environment variable resolution.',
      noProcessEnvSecret: 'Direct access to process.env for secrets detected. Use @firm/env instead to ensure proper validation and handling of sensitive values.',
    },
  },
  
  create(context) {
    return {
      ImportDeclaration(node: any) {
        // Check imported specifiers for sensitive names
        for (const specifier of node.specifiers) {
          const importedName = specifier.imported?.name || specifier.local?.name;
          
          if (FORBIDDEN_IMPORTS.some(token => importedName?.includes(token))) {
            context.report({
              node: specifier,
              messageId: 'noRuntimeTokensImport',
              data: {
                tokenName: importedName,
              },
            });
          }
        }
      },
      
      MemberExpression(node: any) {
        const objectText = context.getSourceCode().getText(node.object);
        const propertyText = context.getSourceCode().getText(node.property);
        
        // Check for direct process.env access to secrets
        if (objectText === 'process.env') {
          if (FORBIDDEN_IMPORTS.some(token => propertyText.includes(token))) {
            context.report({
              node,
              messageId: 'noProcessEnvSecret',
            });
          }
        }
      },
    };
  },
};
