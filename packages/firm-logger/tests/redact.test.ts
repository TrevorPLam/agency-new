import { describe, it, expect } from 'vitest';
import { createRedactionSerializer, redactValue, containsPii } from '../src/redact';

describe('PII Redaction', () => {
  it('creates serializer with default PII fields', () => {
    const serializer = createRedactionSerializer();
    
    expect(serializer).toBeDefined();
    expect(typeof serializer.serialize).toBe('function');
  });

  it('creates serializer with additional PII fields', () => {
    const serializer = createRedactionSerializer(['customField']);
    
    expect(serializer).toBeDefined();
  });

  it('redacts PII fields from objects', () => {
    const serializer = createRedactionSerializer();
    
    const obj = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-1234',
      address: '123 Main St',
      normalField: 'normal value',
    };
    
    const redacted = serializer.serialize(obj);
    
    expect(redacted.name).toBe('[REDACTED]');
    expect(redacted.email).toBe('[REDACTED]');
    expect(redacted.phone).toBe('[REDACTED]');
    expect(redacted.address).toBe('[REDACTED]');
    expect(redacted.normalField).toBe('normal value');
  });

  it('redacts nested PII fields', () => {
    const serializer = createRedactionSerializer();
    
    const obj = {
      user: {
        contact: {
          email: 'john@example.com',
          phone: '555-1234',
        },
        name: 'John Doe',
      },
      normal: {
        nested: 'value',
      },
    };
    
    const redacted = serializer.serialize(obj);
    
    expect(redacted.user.contact.email).toBe('[REDACTED]');
    expect(redacted.user.contact.phone).toBe('[REDACTED]');
    expect(redacted.user.name).toBe('[REDACTED]');
    expect(redacted.normal.nested).toBe('value');
  });

  it('redacts arrays with PII', () => {
    const serializer = createRedactionSerializer();
    
    const obj = {
      users: [
        { email: 'user1@example.com' },
        { email: 'user2@example.com' },
        { name: 'Normal User' },
      ],
    };
    
    const redacted = serializer.serialize(obj);
    
    expect(redacted.users[0].email).toBe('[REDACTED]');
    expect(redacted.users[1].email).toBe('[REDACTED]');
    expect(redacted.users[2].name).toBe('[REDACTED]'); // name is a PII field
  });

  it('handles non-object values', () => {
    const serializer = createRedactionSerializer();
    
    expect(serializer.serialize(null)).toBe(null);
    expect(serializer.serialize('string')).toBe('string');
    expect(serializer.serialize(123)).toBe(123);
    expect(serializer.serialize(undefined)).toBe(undefined);
  });
});

describe('redactValue', () => {
  it('fully redacts values', () => {
    const result = redactValue('sensitive-data');
    expect(result).toBe('[REDACTED]');
  });

  it('partially redacts values', () => {
    const result = redactValue('sensitive-data', 'partial');
    expect(result).toBe('se***ed');
  });

  it('handles short values for partial redaction', () => {
    const result = redactValue('123', 'partial');
    expect(result).toBe('[REDACTED]');
  });
});

describe('containsPii', () => {
  it('detects email addresses', () => {
    expect(containsPii('user@example.com')).toBe(true);
    expect(containsPii('normal text')).toBe(false);
  });

  it('detects phone numbers', () => {
    expect(containsPii('Call 555-123-4567')).toBe(true);
    expect(containsPii('Call 5551234567')).toBe(true);
    expect(containsPii('Call me')).toBe(false);
  });

  it('detects SSN patterns', () => {
    expect(containsPii('SSN: 123-45-6789')).toBe(true);
    expect(containsPii('ID: 123456789')).toBe(false);
  });

  it('detects credit card patterns', () => {
    expect(containsPii('Card: 1234-5678-9012-3456')).toBe(true);
    expect(containsPii('Card: 1234567890123456')).toBe(true);
    expect(containsPii('Account: 123456')).toBe(false);
  });
});
