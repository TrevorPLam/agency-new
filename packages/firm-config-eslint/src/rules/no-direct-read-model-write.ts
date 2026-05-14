/**
 * ESLint rule to disallow direct writes to read models
 * 
 * Enforces that read models are never mutated directly.
 * All mutations must go through the CQRS write model and event handlers.
 */

import type { Rule } from 'eslint';

const READ_MODEL_PATTERNS = [
  'readCache',
  'readDb',
  'readModel',
  'queryCache',
  'queryDb',
];

export const noDirectReadModelWriteRule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow direct writes to read models (CQRS violation)',
      recommended: true,
      url: 'https://github.com/firm-platform/eslint-config/docs/rules/no-direct-read-model-write.md',
    },
    fixable: undefined,
    schema: [],
    messages: {
      noDirectReadModelWrite: 'Direct write to read model "{{modelName}}" detected. Read models are immutable; mutations must go through the write model and event handlers.',
    },
  },
  
  create(context) {
    return {
      AssignmentExpression(node: any) {
        const leftText = context.getSourceCode().getText(node.left);
        
        // Check if assignment is to a read model pattern
        for (const pattern of READ_MODEL_PATTERNS) {
          if (leftText.includes(pattern) && (leftText.includes('.set(') || leftText.includes('.update(') || leftText.includes('.insert('))) {
            context.report({
              node,
              messageId: 'noDirectReadModelWrite',
              data: {
                modelName: pattern,
              },
            });
          }
        }
      },
      
      CallExpression(node: any) {
        const calleeText = context.getSourceCode().getText(node.callee);
        
        // Check for direct mutation method calls on read models
        if (calleeText.includes('.')) {
          const parts = calleeText.split('.');
          const methodName = parts[parts.length - 1];
          const objectName = parts[parts.length - 2];
          
          if (READ_MODEL_PATTERNS.some(p => objectName?.includes(p)) && 
              ['set', 'update', 'insert', 'delete', 'clear'].includes(methodName)) {
            context.report({
              node,
              messageId: 'noDirectReadModelWrite',
              data: {
                modelName: objectName,
              },
            });
          }
        }
      },
    };
  },
};
