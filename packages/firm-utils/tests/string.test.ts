import { describe, it, expect } from 'vitest';
import { slugify, hashIp, hashString, truncate, capitalize, toCamelCase, toPascalCase, toSnakeCase } from '../src/string';

describe('slugify', () => {
  it('converts spaces to hyphens', () => {
    expect(slugify('hello world')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(slugify('hello@world!')).toBe('helloworld');
  });

  it('handles multiple separators', () => {
    expect(slugify('hello___world')).toBe('hello-world');
  });

  it('trims leading/trailing hyphens', () => {
    expect(slugify('--hello world--')).toBe('hello-world');
  });

  it('applies max length', () => {
    expect(slugify('very long string that should be truncated', { maxLength: 10 })).toBe('very-long');
  });

  it('supports custom separator', () => {
    expect(slugify('hello world', { separator: '_' })).toBe('hello_world');
  });

  it('preserves case when requested', () => {
    expect(slugify('Hello World', { lowercase: false })).toBe('Hello-World');
  });
});

describe('hashIp', () => {
  it('hashes IPv4 addresses', () => {
    const ip = '192.168.1.1';
    const hashed = hashIp(ip);
    expect(hashed).toMatch(/^[a-f0-9]{64}$/);
  });

  it('hashes IPv6 addresses', () => {
    const ip = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
    const hashed = hashIp(ip);
    expect(hashed).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces different hashes for different IPs', () => {
    const hash1 = hashIp('192.168.1.1');
    const hash2 = hashIp('192.168.1.2');
    expect(hash1).not.toBe(hash2);
  });

  it('uses salt for different results', () => {
    const ip = '192.168.1.1';
    const hash1 = hashIp(ip, 'salt1');
    const hash2 = hashIp(ip, 'salt2');
    expect(hash1).not.toBe(hash2);
  });

  it('throws for invalid IP', () => {
    expect(() => hashIp('invalid')).toThrow('Invalid IP address format');
  });

  it('throws for empty string', () => {
    expect(() => hashIp('')).toThrow('IP address must be a non-empty string');
  });
});

describe('hashString', () => {
  it('hashes strings with SHA-256', () => {
    const input = 'hello world';
    const hashed = hashString(input);
    expect(hashed).toMatch(/^[a-f0-9]{64}$/);
  });

  it('supports different algorithms', () => {
    const input = 'hello world';
    const sha256 = hashString(input, 'sha256');
    const sha512 = hashString(input, 'sha512');
    const md5 = hashString(input, 'md5');
    
    expect(sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(sha512).toMatch(/^[a-f0-9]{128}$/);
    expect(md5).toMatch(/^[a-f0-9]{32}$/);
  });

  it('produces consistent hashes', () => {
    const input = 'test';
    const hash1 = hashString(input);
    const hash2 = hashString(input);
    expect(hash1).toBe(hash2);
  });
});

describe('truncate', () => {
  it('truncates long strings', () => {
    expect(truncate('hello world', 5)).toBe('he...');
  });

  it('returns short strings unchanged', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('uses custom suffix', () => {
    expect(truncate('hello world', 5, '---')).toBe('he---');
  });
});

describe('capitalize', () => {
  it('capitalizes first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('handles empty strings', () => {
    expect(capitalize('')).toBe('');
  });

  it('handles single character', () => {
    expect(capitalize('a')).toBe('A');
  });
});

describe('toCamelCase', () => {
  it('converts spaces to camelCase', () => {
    expect(toCamelCase('hello world')).toBe('helloWorld');
  });

  it('converts hyphens to camelCase', () => {
    expect(toCamelCase('hello-world')).toBe('helloWorld');
  });

  it('converts underscores to camelCase', () => {
    expect(toCamelCase('hello_world')).toBe('helloWorld');
  });
});

describe('toPascalCase', () => {
  it('converts spaces to PascalCase', () => {
    expect(toPascalCase('hello world')).toBe('HelloWorld');
  });

  it('converts hyphens to PascalCase', () => {
    expect(toPascalCase('hello-world')).toBe('HelloWorld');
  });

  it('converts underscores to PascalCase', () => {
    expect(toPascalCase('hello_world')).toBe('HelloWorld');
  });
});

describe('toSnakeCase', () => {
  it('converts camelCase to snake_case', () => {
    expect(toSnakeCase('helloWorld')).toBe('hello_world');
  });

  it('converts PascalCase to snake_case', () => {
    expect(toSnakeCase('HelloWorld')).toBe('hello_world');
  });

  it('converts spaces to snake_case', () => {
    expect(toSnakeCase('hello world')).toBe('hello_world');
  });
});
