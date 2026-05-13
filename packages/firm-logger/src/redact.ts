/**
 * Default PII fields that should be redacted
 */
const DEFAULT_PII_FIELDS = [
  'email',
  'phone',
  'password',
  'ssn',
  'socialSecurityNumber',
  'creditCard',
  'creditCardNumber',
  'cvv',
  'token',
  'apiKey',
  'secret',
  'privateKey',
  'address',
  'fullName',
  'firstName',
  'lastName',
  'dateOfBirth',
  'ipAddress',
  'userAgent',
];

/**
 * Create a PII redaction serializer for Pino
 * @param additionalFields - Additional PII fields to redact
 * @returns Serializer object for Pino
 */
export function createRedactionSerializer(additionalFields: string[] = []) {
  const piiFields = new Set([...DEFAULT_PII_FIELDS, ...additionalFields]);
  
  return {
    /**
     * Redact PII from log objects
     * @param obj - Object to serialize
     * @returns Redacted object
     */
    serialize(obj: any): any {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      return redactObject(obj, piiFields);
    },
  };
}

/**
 * Recursively redact PII fields from an object
 * @param obj - Object to redact
 * @param piiFields - Set of PII field names
 * @returns Redacted object
 */
function redactObject(obj: any, piiFields: Set<string>): any {
  if (Array.isArray(obj)) {
    return obj.map(item => redactObject(item, piiFields));
  }

  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const redacted: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (piiFields.has(key) || isPiiField(key, piiFields)) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactObject(value, piiFields);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Check if a field name matches PII patterns
 * @param fieldName - Field name to check
 * @param piiFields - Set of known PII fields
 * @returns True if field should be redacted
 */
function isPiiField(fieldName: string, piiFields: Set<string>): boolean {
  // Direct match
  if (piiFields.has(fieldName)) {
    return true;
  }

  // Pattern matching for nested fields (user.email, contact.phone, etc.)
  const patterns = [
    /email/i,
    /phone/i,
    /password/i,
    /ssn/i,
    /creditcard/i,
    /token/i,
    /secret/i,
    /key/i,
    /address/i,
    /name/i,
    /birth/i,
    /ip/i,
  ];

  return patterns.some(pattern => pattern.test(fieldName));
}

/**
 * Redact a specific value
 * @param value - Value to redact
 * @param type - Type of redaction
 * @returns Redacted value
 */
export function redactValue(value: string, type: 'partial' | 'full' = 'full'): string {
  if (type === 'partial') {
    // Show first and last characters, mask middle
    if (value.length <= 4) {
      return '[REDACTED]';
    }
    
    const start = value.substring(0, 2);
    const end = value.substring(value.length - 2);
    const middle = '*'.repeat(value.length - 4);
    
    return `${start}${middle}${end}`;
  }

  return '[REDACTED]';
}

/**
 * Check if a string contains PII patterns
 * @param text - Text to check
 * @returns True if PII patterns are detected
 */
export function containsPii(text: string): boolean {
  const piiPatterns = [
    // Email pattern
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    // Phone pattern (basic)
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    // SSN pattern
    /\b\d{3}-\d{2}-\d{4}\b/g,
    // Credit card pattern
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  ];

  return piiPatterns.some(pattern => pattern.test(text));
}
