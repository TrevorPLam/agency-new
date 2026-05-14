/**
 * ESLint rule to disallow direct fetch() calls outside of HTTP client utilities
 * 
 * Enforces that fetch() is only used through dedicated HTTP client abstractions
 * to ensure consistent error handling, timeout policies, and observability.
 */

import type { Rule } from 'eslint';

export const noDirectFetchRule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow direct fetch() calls outside HTTP client utilities',
      recommended: true,
      url: 'https://github.com/firm-platform/eslint-config/docs/rules/no-direct-fetch.md',
    },
    fixable: undefined,
    schema: [],
    messages: {
      noDirectFetch: 'Direct fetch() call detected. Use @firm/http-client or a dedicated HTTP utility instead to ensure consistent error handling and observability.',
    },
  },
  
  create(context) {
    return {
      CallExpression(node: any) {
        // Check if this is a fetch() call
        if (node.callee.type === 'Identifier' && node.callee.name === 'fetch') {
          context.report({
            node,
            messageId: 'noDirectFetch',
          });
        }
      },
    };
  },
};
