# firm-utils

Generated on: 2026-05-13T02:25:38.746Z
Total files: 10

**Description:** Pure utility functions for the firm platform

**Version:** 1.0.0

## Table of Contents

- [assert-never.ts](#assert-never-ts)
- [deep-merge.ts](#deep-merge-ts)
- [index.ts](#index-ts)
- [result.ts](#result-ts)
- [string.ts](#string-ts)
- [try-catch.ts](#try-catch-ts)
- [deep-merge.test.ts](#deep-merge-test-ts)
- [result.test.ts](#result-test-ts)
- [string.test.ts](#string-test-ts)
- [try-catch.test.ts](#try-catch-test-ts)

## File Contents

### assert-never.ts

**Path:** `src\assert-never.ts`

**Language:** TypeScript

```typescript
/**
 * Helper function for exhaustive type checking
 * Throws an error if called, indicating that all cases were not handled
 * @param value - The value that should never be passed
 * @param message - Optional custom error message
 * @returns Never returns, always throws
 */
export function assertNever(value: never, message?: string): never {
  const defaultMessage = `Unexpected value: ${String(value)}. This should never happen if all cases are handled.`;
  throw new Error(message || defaultMessage);
}

/**
 * Type-safe version of assertNever that provides better error messages
 * @param value - The value that should never be passed
 * @param context - Additional context for debugging
 * @returns Never returns, always throws
 */
export function assertNeverWithContext<T>(value: never, context: Record<string, unknown>): never {
  const contextStr = Object.entries(context)
    .map(([key, val]) => `${key}=${JSON.stringify(val)}`)
    .join(', ');
  
  throw new Error(
    `Unexpected value: ${String(value)}. Context: ${contextStr}. ` +
    'This indicates a missing case in exhaustive type checking.'
  );
}

```

---

### deep-merge.ts

**Path:** `src\deep-merge.ts`

**Language:** TypeScript

```typescript
/**
 * Deeply merges two objects, creating a new object
 * Arrays are replaced (not concatenated)
 * Primitive values are overridden by the right-hand value
 * @param target - The target object to merge into
 * @param source - The source object to merge from
 * @returns A new merged object
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (
        isPlainObject(sourceValue) &&
        targetValue !== undefined &&
        isPlainObject(targetValue)
      ) {
        // Both are plain objects, merge recursively
        (result as any)[key] = deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        );
      } else {
        // Override with source value (including arrays, primitives, null, undefined)
        (result as any)[key] = sourceValue;
      }
    }
  }

  return result;
}

/**
 * Checks if a value is a plain object (not null, not array, not Date, etc.)
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  // Check if it's a plain object (not array, date, regex, etc.)
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Merges multiple objects from left to right
 * @param objects - Array of objects to merge
 * @returns A new merged object
 */
export function deepMergeMany<T extends Record<string, unknown>>(
  ...objects: Partial<T>[]
): T {
  if (objects.length === 0) {
    return {} as T;
  }
  
  const [first, ...rest] = objects;
  return rest.reduce(
    (acc, obj) => deepMerge(acc, obj),
    first as unknown as T
  );
}

/**
 * Safely merges objects with type safety for partial updates
 * @param target - The target object
 * @param updates - Partial updates to apply
 * @returns A new object with updates applied
 */
export function applyUpdates<T extends Record<string, unknown>>(
  target: T,
  updates: Partial<T>
): T {
  return deepMerge(target, updates);
}

```

---

### index.ts

**Path:** `src\index.ts`

**Language:** TypeScript

```typescript
// Result type and utilities
export { ok, err, isOk, isErr, map, mapErr, flatMap, unwrapOr, unwrap, intoEither } from './result';
export type { Result } from './result';

// Error handling utilities
export { tryCatch, tryCatchAsync, tryCatchWith, tryCatchAsyncWith } from './try-catch';

// Type checking utilities
export { assertNever, assertNeverWithContext } from './assert-never';

// Object manipulation utilities
export { deepMerge, deepMergeMany, applyUpdates } from './deep-merge';

// String utilities
export { 
  slugify, 
  hashIp, 
  hashString, 
  truncate, 
  capitalize, 
  toCamelCase, 
  toPascalCase, 
  toSnakeCase 
} from './string';

```

---

### result.ts

**Path:** `src\result.ts`

**Language:** TypeScript

```typescript
/**
 * Result type for handling expected failures without throwing exceptions
 * Implements a tagged union with `ok` and `err` variants
 */
export type Result<T, E> = Ok<T, E> | Err<T, E>;

interface Ok<T, E> {
  readonly _tag: 'Ok';
  readonly value: T;
}

interface Err<T, E> {
  readonly _tag: 'Err';
  readonly error: E;
}

/**
 * Creates an Ok result containing a successful value
 */
export function ok<T, E>(value: T): Result<T, E> {
  return { _tag: 'Ok', value } as const;
}

/**
 * Creates an Err result containing an error value
 */
export function err<T, E>(error: E): Result<T, E> {
  return { _tag: 'Err', error } as const;
}

/**
 * Type guard to check if a Result is Ok
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T, E> {
  return result._tag === 'Ok';
}

/**
 * Type guard to check if a Result is Err
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<T, E> {
  return result._tag === 'Err';
}

/**
 * Maps the success value of a Result if it's Ok, otherwise returns the Err unchanged
 */
export function map<T, E, U>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return isOk(result) ? ok(fn(result.value)) : err(result.error);
}

/**
 * Maps the error value of a Result if it's Err, otherwise returns the Ok unchanged
 */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  return isErr(result) ? err(fn(result.error)) : ok(result.value);
}

/**
 * Chains operations that may fail, short-circuiting on the first Err
 */
export function flatMap<T, E, U>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> {
  return isOk(result) ? fn(result.value) : err(result.error);
}

/**
 * Unwraps a Result, returning the value if Ok or a default if Err
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return isOk(result) ? result.value : defaultValue;
}

/**
 * Unwraps a Result, returning the value if Ok or throwing the error
 * @throws The error value if the Result is Err, with additional context
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (isOk(result)) {
    return result.value;
  }
  const error = result.error;
  const message = error instanceof Error 
    ? error.message 
    : String(error);
  throw new Error(`Failed to unwrap Result: ${message}`, { cause: error });
}

/**
 * Returns the success value or the error value
 */
export function intoEither<T, E>(result: Result<T, E>): T | E {
  return isOk(result) ? result.value : result.error;
}

```

---

### string.ts

**Path:** `src\string.ts`

**Language:** TypeScript

```typescript
import { createHash } from 'crypto';

/**
 * Converts a string to a URL-friendly slug
 * - Converts to lowercase
 * - Replaces spaces and special characters with hyphens
 * - Removes consecutive hyphens
 * - Trims leading/trailing hyphens
 * @param text - The text to slugify
 * @param options - Configuration options
 * @returns The slugified string
 */
export function slugify(
  text: string,
  options: {
    maxLength?: number;
    separator?: string;
    lowercase?: boolean;
  } = {}
): string {
  const {
    maxLength = 100,
    separator = '-',
    lowercase = true
  } = options;

  let result = text;

  // Convert to lowercase if requested
  if (lowercase) {
    result = result.toLowerCase();
  }

  // Replace spaces, underscores, and multiple separators with single separator
  result = result
    .replace(/[^\w\s-]/gu, '') // Remove non-word chars except spaces and hyphens (Unicode-aware)
    .replace(/[\s_]+/gu, separator) // Replace spaces and underscores with separator (Unicode-aware)
    .replace(new RegExp(`${separator}+`, 'gu'), separator); // Replace multiple separators (Unicode-aware)

  // Remove leading/trailing separators
  result = result.replace(new RegExp(`^${separator}+|${separator}+$`, 'gu'), '');

  // Apply max length
  if (result.length > maxLength) {
    result = result.substring(0, maxLength);
    // Remove trailing separator if we cut in the middle
    result = result.replace(new RegExp(`${separator}+$`, 'u'), '');
  }

  return result;
}

/**
 * Hashes an IP address for pseudonymization using SHA-256
 * Uses a salt from environment variable to prevent rainbow table attacks
 * @param ip - The IP address to hash
 * @returns The hashed IP address as a hex string
 * @throws Error if IP_HASH_SALT environment variable is not set
 */
export function hashIp(ip: string): string {
  if (!ip || typeof ip !== 'string') {
    throw new Error('IP address must be a non-empty string');
  }

  // Basic IP validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
    throw new Error('Invalid IP address format');
  }

  const salt = process.env['IP_HASH_SALT'];
  if (!salt) {
    throw new Error('IP_HASH_SALT environment variable must be set for IP hashing');
  }

  const hash = createHash('sha256');
  hash.update(ip);
  hash.update(salt);

  return hash.digest('hex');
}

/**
 * Generates a consistent hash for any string input
 * @param input - The string to hash
 * @param algorithm - Hash algorithm to use (default: sha256)
 * @returns The hash as a hex string
 */
export function hashString(
  input: string,
  algorithm: 'sha256' | 'sha512' | 'md5' = 'sha256'
): string {
  if (!input || typeof input !== 'string') {
    throw new Error('Input must be a non-empty string');
  }

  const hash = createHash(algorithm);
  hash.update(input);
  return hash.digest('hex');
}

/**
 * Truncates a string to a specified length with an ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add when truncated (default: '...')
 * @returns The truncated string
 */
export function truncate(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitalizes the first letter of a string
 * @param text - The text to capitalize
 * @returns The capitalized string
 */
export function capitalize(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Converts a string to camelCase
 * 
 * Acronym handling:
 * - Consecutive uppercase letters are treated as a single word (e.g., "XMLParser" -> "xmlParser")
 * - Single uppercase letters are capitalized (e.g., "aB" -> "aB")
 * - Separators (hyphens, underscores, spaces) trigger capitalization
 * 
 * @param text - The text to convert
 * @returns The camelCase string
 * @example
 * toCamelCase('hello-world') // 'helloWorld'
 * toCamelCase('XMLParser') // 'xmlParser'
 * toCamelCase('user_id') // 'userId'
 */
export function toCamelCase(text: string): string {
  return text
    .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
    .replace(/^[A-Z]/, char => char.toLowerCase());
}

/**
 * Converts a string to PascalCase
 * 
 * Acronym handling:
 * - Consecutive uppercase letters are preserved (e.g., "XML" -> "XML")
 * - First character is always capitalized
 * - Separators (hyphens, underscores, spaces) trigger capitalization
 * 
 * @param text - The text to convert
 * @returns The PascalCase string
 * @example
 * toPascalCase('hello-world') // 'HelloWorld'
 * toPascalCase('XMLParser') // 'XMLParser'
 * toPascalCase('user_id') // 'UserId'
 */
export function toPascalCase(text: string): string {
  return text
    .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
    .replace(/^[a-z]/, char => char.toUpperCase());
}

/**
 * Converts a string to snake_case
 * 
 * Acronym handling:
 * - Consecutive uppercase letters are treated as a single word (e.g., "XMLParser" -> "xml_parser")
 * - All letters are lowercase
 * - CamelCase boundaries are converted to underscores
 * 
 * @param text - The text to convert
 * @returns The snake_case string
 * @example
 * toSnakeCase('helloWorld') // 'hello_world'
 * toSnakeCase('XMLParser') // 'xml_parser'
 * toSnakeCase('user-id') // 'user_id'
 */
export function toSnakeCase(text: string): string {
  return text
    .replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map(word => word.toLowerCase())
    .join('_');
}

```

---

### try-catch.ts

**Path:** `src\try-catch.ts`

**Language:** TypeScript

```typescript
import { ok, err } from './result';
import type { Result } from './result';

/**
 * Wraps a synchronous operation that may throw, returning a Result
 * @param fn - The function to execute
 * @returns Ok with the function result, or Err with the thrown error
 */
export function tryCatch<T, E = Error>(fn: () => T): Result<T, E> {
  try {
    return ok(fn());
  } catch (error) {
    return err(error as E);
  }
}

/**
 * Wraps an asynchronous operation that may throw, returning a Promise<Result>
 * @param fn - The async function to execute
 * @returns Promise that resolves to Ok with the function result, or Err with the thrown error
 */
export async function tryCatchAsync<T, E = Error>(fn: () => Promise<T>): Promise<Result<T, E>> {
  try {
    return ok(await fn());
  } catch (error) {
    return err(error as E);
  }
}

/**
 * Wraps a synchronous operation with a custom error mapper
 * @param fn - The function to execute
 * @param errorMapper - Function to transform the caught error
 * @returns Ok with the function result, or Err with the mapped error
 */
export function tryCatchWith<T, E, F = Error>(
  fn: () => T,
  errorMapper: (error: F) => E
): Result<T, E> {
  try {
    return ok(fn());
  } catch (error) {
    return err(errorMapper(error as F));
  }
}

/**
 * Wraps an asynchronous operation with a custom error mapper
 * @param fn - The async function to execute
 * @param errorMapper - Function to transform the caught error
 * @returns Promise that resolves to Ok with the function result, or Err with the mapped error
 */
export async function tryCatchAsyncWith<T, E, F = Error>(
  fn: () => Promise<T>,
  errorMapper: (error: F) => E
): Promise<Result<T, E>> {
  try {
    return ok(await fn());
  } catch (error) {
    return err(errorMapper(error as F));
  }
}

```

---

### deep-merge.test.ts

**Path:** `tests\deep-merge.test.ts`

**Language:** TypeScript

```typescript
import { describe, it, expect } from 'vitest';
import { deepMerge, deepMergeMany, applyUpdates } from '../src/deep-merge';

describe('deepMerge', () => {
  it('merges simple objects', () => {
    const target = { a: 1, b: 2 } as any;
    const source = { b: 3, c: 4 } as any;
    const result = deepMerge(target, source);
    
    expect(result).toEqual({ a: 1, b: 3, c: 4 });
  });

  it('does not mutate original objects', () => {
    const target = { a: 1 } as any;
    const source = { b: 2 } as any;
    deepMerge(target, source);
    
    expect(target).toEqual({ a: 1 });
    expect(source).toEqual({ b: 2 });
  });

  it('deeply merges nested objects', () => {
    const target = { a: { b: 1, c: 2 } } as any;
    const source = { a: { c: 3, d: 4 } } as any;
    const result = deepMerge(target, source);
    
    expect(result).toEqual({ a: { b: 1, c: 3, d: 4 } });
  });

  it('replaces arrays', () => {
    const target = { a: [1, 2, 3] } as any;
    const source = { a: [4, 5] } as any;
    const result = deepMerge(target, source);
    
    expect(result).toEqual({ a: [4, 5] });
  });

  it('handles null and undefined', () => {
    const target = { a: 1, b: 2 } as any;
    const source = { b: null, c: undefined, d: 4 } as any;
    const result = deepMerge(target, source);
    
    expect(result).toEqual({ a: 1, b: null, c: undefined, d: 4 });
  });
});

describe('deepMergeMany', () => {
  it('merges multiple objects', () => {
    const obj1 = { a: 1 } as any;
    const obj2 = { b: 2 } as any;
    const obj3 = { c: 3 } as any;
    const result = deepMergeMany(obj1, obj2, obj3);
    
    expect(result).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('handles empty array', () => {
    const result = deepMergeMany();
    expect(result).toEqual({});
  });

  it('merges in order', () => {
    const result = deepMergeMany(
      { a: 1, b: 2 } as any,
      { b: 3, c: 4 } as any,
      { c: 5, d: 6 } as any
    );
    
    expect(result).toEqual({ a: 1, b: 3, c: 5, d: 6 });
  });
});

describe('applyUpdates', () => {
  it('applies partial updates', () => {
    const target = { a: 1, b: 2, c: 3 } as any;
    const updates = { b: 20, d: 4 } as any;
    const result = applyUpdates(target, updates);
    
    expect(result).toEqual({ a: 1, b: 20, c: 3, d: 4 });
  });

  it('does not mutate original', () => {
    const target = { a: 1 } as any;
    const updates = { b: 2 } as any;
    applyUpdates(target, updates);
    
    expect(target).toEqual({ a: 1 });
  });
});

```

---

### result.test.ts

**Path:** `tests\result.test.ts`

**Language:** TypeScript

```typescript
import { describe, it, expect } from 'vitest';
import { ok, err, isOk, isErr, map, mapErr, flatMap, unwrapOr, unwrap, intoEither, type Result } from '../src/result';

describe('Result', () => {
  describe('ok', () => {
    it('creates an Ok result', () => {
      const result = ok<string, Error>('success');
      expect(isOk(result)).toBe(true);
      expect(isErr(result)).toBe(false);
      if (isOk(result)) {
        expect(result.value).toBe('success');
      }
    });
  });

  describe('err', () => {
    it('creates an Err result', () => {
      const error = new Error('failure');
      const result = err<string, Error>(error);
      expect(isOk(result)).toBe(false);
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe(error);
      }
    });
  });

  describe('map', () => {
    it('maps Ok values', () => {
      const result = ok(5);
      const mapped = map(result, x => x * 2);
      expect(isOk(mapped)).toBe(true);
      if (isOk(mapped)) {
        expect(mapped.value).toBe(10);
      }
    });

    it('passes through Err values', () => {
      const error = new Error('test');
      const result = err<string, Error>(error);
      const mapped = map(result, x => x.toUpperCase());
      expect(isErr(mapped)).toBe(true);
      if (isErr(mapped)) {
        expect(mapped.error).toBe(error);
      }
    });
  });

  describe('mapErr', () => {
    it('maps Err values', () => {
      const error = new Error('original');
      const result = err<string, Error>(error);
      const mapped = mapErr(result, err => new Error(`mapped: ${(err as Error).message}`));
      expect(isErr(mapped)).toBe(true);
      if (isErr(mapped)) {
        expect((mapped.error as Error).message).toBe('mapped: original');
      }
    });

    it('passes through Ok values', () => {
      const result = ok('success');
      const mapped = mapErr(result, err => new Error(`mapped: ${(err as Error).message}`));
      expect(isOk(mapped)).toBe(true);
      if (isOk(mapped)) {
        expect(mapped.value).toBe('success');
      }
    });
  });

  describe('flatMap', () => {
    it('chains Ok operations', () => {
      const result = ok(5);
      const chained = flatMap(result, x => ok(x * 2));
      expect(isOk(chained)).toBe(true);
      if (isOk(chained)) {
        expect(chained.value).toBe(10);
      }
    });

    it('short-circuits on Err', () => {
      const error = new Error('failure');
      const result = err<number, Error>(error);
      const chained = flatMap(result, x => ok(x * 2));
      expect(isErr(chained)).toBe(true);
      if (isErr(chained)) {
        expect(chained.error).toBe(error);
      }
    });

    it('handles Err in chain', () => {
      const result = ok(5);
      const chained = flatMap(result, x => err<number, Error>(new Error('chain error')));
      expect(isErr(chained)).toBe(true);
      if (isErr(chained)) {
        expect((chained.error as Error).message).toBe('chain error');
      }
    });
  });

  describe('unwrapOr', () => {
    it('returns value for Ok', () => {
      const result = ok('success');
      expect(unwrapOr(result, 'default')).toBe('success');
    });

    it('returns default for Err', () => {
      const result = err<string, Error>(new Error('error'));
      expect(unwrapOr(result, 'default')).toBe('default');
    });
  });

  describe('unwrap', () => {
    it('returns value for Ok', () => {
      const result = ok('success');
      expect(unwrap(result)).toBe('success');
    });

    it('throws for Err', () => {
      const error = new Error('test error');
      const result = err<string, Error>(error);
      expect(() => unwrap(result)).toThrow(error);
    });
  });

  describe('intoEither', () => {
    it('returns value for Ok', () => {
      const result = ok('success');
      expect(intoEither(result)).toBe('success');
    });

    it('returns error for Err', () => {
      const error = new Error('test error');
      const result = err<string, Error>(error);
      expect(intoEither(result)).toBe(error);
    });
  });
});

```

---

### string.test.ts

**Path:** `tests\string.test.ts`

**Language:** TypeScript

```typescript
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

```

---

### try-catch.test.ts

**Path:** `tests\try-catch.test.ts`

**Language:** TypeScript

```typescript
import { describe, it, expect } from 'vitest';
import { tryCatch, tryCatchAsync, tryCatchWith, tryCatchAsyncWith } from '../src/try-catch';

describe('tryCatch', () => {
  it('returns Ok for successful operation', () => {
    const result = tryCatch(() => 'success');
    expect(result._tag).toBe('Ok');
    if (result._tag === 'Ok') {
      expect(result.value).toBe('success');
    }
  });

  it('returns Err for thrown error', () => {
    const error = new Error('test error');
    const result = tryCatch(() => {
      throw error;
    });
    expect(result._tag).toBe('Err');
    if (result._tag === 'Err') {
      expect(result.error).toBe(error);
    }
  });
});

describe('tryCatchAsync', () => {
  it('returns Ok for successful async operation', async () => {
    const result = await tryCatchAsync(async () => 'success');
    expect(result._tag).toBe('Ok');
    if (result._tag === 'Ok') {
      expect(result.value).toBe('success');
    }
  });

  it('returns Err for rejected promise', async () => {
    const error = new Error('async error');
    const result = await tryCatchAsync(async () => {
      throw error;
    });
    expect(result._tag).toBe('Err');
    if (result._tag === 'Err') {
      expect(result.error).toBe(error);
    }
  });
});

describe('tryCatchWith', () => {
  it('maps errors with custom mapper', () => {
    const result = tryCatchWith(
      () => {
        throw new Error('original');
      },
      (err) => `mapped: ${(err as Error).message}`
    );
    expect(result._tag).toBe('Err');
    if (result._tag === 'Err') {
      expect(result.error).toBe('mapped: original');
    }
  });

  it('returns Ok for successful operation', () => {
    const result = tryCatchWith(
      () => 'success',
      (err) => `mapped: ${(err as Error).message}`
    );
    expect(result._tag).toBe('Ok');
    if (result._tag === 'Ok') {
      expect(result.value).toBe('success');
    }
  });
});

describe('tryCatchAsyncWith', () => {
  it('maps async errors with custom mapper', async () => {
    const result = await tryCatchAsyncWith(
      async () => {
        throw new Error('async original');
      },
      (err) => `mapped: ${(err as Error).message}`
    );
    expect(result._tag).toBe('Err');
    if (result._tag === 'Err') {
      expect(result.error).toBe('mapped: async original');
    }
  });

  it('returns Ok for successful async operation', async () => {
    const result = await tryCatchAsyncWith(
      async () => 'async success',
      (err) => `mapped: ${(err as Error).message}`
    );
    expect(result._tag).toBe('Ok');
    if (result._tag === 'Ok') {
      expect(result.value).toBe('async success');
    }
  });
});

```

---

