/**
 * ESLint rule to enforce proper validation of branded IDs
 * 
 * This rule prevents unsafe type assertions like `as UserId` and requires
 * the use of validation gatekeeper functions like `asUserId()`.
 */

import type { Rule } from 'eslint';

// List of branded ID types that require validation
const BRANDED_ID_TYPES = [
  'TenantId',
  'UserId', 
  'LeadId',
  'CampaignId',
  'BookingId',
  'InvoiceId',
  'SubscriptionId',
  'EmailTemplateId',
  'FormId',
  'WebhookId',
  'ApiKeyId',
  'SessionId',
  'AuditLogId',
  'SyncJobId',
  'ReportId',
];

// Mapping of branded types to their validation functions
const VALIDATION_FUNCTIONS: Record<string, string> = {
  'TenantId': 'asTenantId',
  'UserId': 'asUserId',
  'LeadId': 'asLeadId',
  'CampaignId': 'asCampaignId',
  'BookingId': 'asBookingId',
  'InvoiceId': 'asInvoiceId',
  'SubscriptionId': 'asSubscriptionId',
  'EmailTemplateId': 'asEmailTemplateId',
  'FormId': 'asFormId',
  'WebhookId': 'asWebhookId',
  'ApiKeyId': 'asApiKeyId',
  'SessionId': 'asSessionId',
  'AuditLogId': 'asAuditLogId',
  'SyncJobId': 'asSyncJobId',
  'ReportId': 'asReportId',
};

export const brandedIdValidationRule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce proper validation of branded IDs using gatekeeper functions',
      recommended: true,
      url: 'https://github.com/firm-platform/eslint-config/docs/rules/branded-id-validation.md',
    },
    fixable: 'code',
    schema: [],
    messages: {
      unsafeAssertion: 'Unsafe type assertion "{{type}}" detected. Use "{{validationFunction}}"() instead for proper UUID validation.',
      unsafeAnyAssertion: 'Unsafe "as any" assertion detected. This bypasses type safety for branded IDs.',
    },
  },
  
  create(context) {
    const sourceCode = context.getSourceCode();
    
    return {
      // Check for type assertions like "as UserId"
      TSAsExpression(node: any) {
        const typeAnnotation = node.typeAnnotation;
        
        // Check if it's a branded ID type
        if (typeAnnotation.type === 'TSTypeReference' && 
            typeAnnotation.typeName.type === 'Identifier') {
          const typeName = typeAnnotation.typeName.name;
          
          if (BRANDED_ID_TYPES.includes(typeName)) {
            const validationFunction = VALIDATION_FUNCTIONS[typeName];
            
            context.report({
              node,
              messageId: 'unsafeAssertion',
              data: {
                type: typeName,
                validationFunction,
              },
              fix(fixer) {
                // Replace "as UserId" with "asUserId(value)"
                const expressionText = sourceCode.getText(node.expression);
                
                return fixer.replaceText(
                  node,
                  `${validationFunction}(${expressionText})`
                );
              },
            });
          }
        }
        
        // Check for "as any" which is especially dangerous
        if (typeAnnotation.type === 'TSAnyKeyword') {
          // Check if the expression might be a branded ID context
          const parentText = sourceCode.getText(node.parent || node);
          const hasBrandedIdContext = BRANDED_ID_TYPES.some(type => 
            parentText.includes(type)
          );
          
          if (hasBrandedIdContext) {
            context.report({
              node,
              messageId: 'unsafeAnyAssertion',
            });
          }
        }
      },
      
      // Check for angle bracket type assertions like "<UserId>value"
      TSTypeAssertion(node: any) {
        const typeAnnotation = node.typeAnnotation;
        
        if (typeAnnotation.type === 'TSTypeReference' && 
            typeAnnotation.typeName.type === 'Identifier') {
          const typeName = typeAnnotation.typeName.name;
          
          if (BRANDED_ID_TYPES.includes(typeName)) {
            const validationFunction = VALIDATION_FUNCTIONS[typeName];
            
            context.report({
              node,
              messageId: 'unsafeAssertion',
              data: {
                type: typeName,
                validationFunction,
              },
              fix(fixer) {
                // Replace "<UserId>value" with "asUserId(value)"
                const expressionText = sourceCode.getText(node.expression);
                
                return fixer.replaceText(
                  node,
                  `${validationFunction}(${expressionText})`
                );
              },
            });
          }
        }
      },
    };
  },
};
