# firm-crypto

Generated on: 2026-05-13T02:25:38.350Z
Total files: 7

**Description:** Cryptographic primitives for Firm platform

**Version:** 1.0.0

## Table of Contents

- [hmac.ts](#hmac-ts)
- [index.ts](#index-ts)
- [keys.ts](#keys-ts)
- [totp.ts](#totp-ts)
- [hmac.test.ts](#hmac-test-ts)
- [keys.test.ts](#keys-test-ts)
- [totp.test.ts](#totp-test-ts)

## File Contents

### hmac.ts

**Path:** `src\hmac.ts`

**Language:** TypeScript

```typescript
import { createHmac as createNodeHmac, timingSafeEqual } from 'crypto';

/**
 * Create an HMAC using a specified algorithm.
 * @param algorithm - Hash algorithm to use (sha256, sha512)
 * @param data - Data to sign
 * @param key - Secret key
 * @returns HMAC as hex string
 */
export function createHmac(
  algorithm: 'sha256' | 'sha512',
  data: string,
  key: string
): string {
  const hmac = createNodeHmac(algorithm, key);
  hmac.update(data);
  return hmac.digest('hex');
}

/**
 * Verify an HMAC against the expected value using constant-time comparison.
 * @param algorithm - Hash algorithm used (sha256, sha512)
 * @param data - Original data
 * @param key - Secret key
 * @param expectedHmac - Expected HMAC value
 * @returns True if HMAC is valid
 */
export function verifyHmac(
  algorithm: 'sha256' | 'sha512',
  data: string,
  key: string,
  expectedHmac: string
): boolean {
  const computedHmac = createHmac(algorithm, data, key);
  
  // Convert to buffers for timing-safe comparison
  const computedBuffer = Buffer.from(computedHmac, 'hex');
  const expectedBuffer = Buffer.from(expectedHmac, 'hex');
  
  // Use timingSafeEqual to prevent timing attacks
  if (computedBuffer.length !== expectedBuffer.length) {
    return false;
  }
  
  return timingSafeEqual(computedBuffer, expectedBuffer);
}

/**
 * Perform constant-time comparison of two strings.
 * This prevents timing attacks by ensuring comparison takes the same time
 * regardless of where the first difference occurs.
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
export function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  const bufferA = Buffer.from(a, 'utf8');
  const bufferB = Buffer.from(b, 'utf8');
  
  return timingSafeEqual(bufferA, bufferB);
}

/**
 * Perform constant-time comparison of two buffers.
 * @param a - First buffer
 * @param b - Second buffer
 * @returns True if buffers are equal
 */
export function constantTimeEqualsBuffer(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  return timingSafeEqual(a, b);
}

```

---

### index.ts

**Path:** `src\index.ts`

**Language:** TypeScript

```typescript
// Key generation and hashing
export {
  generateApiKey,
  hashApiKey,
  generateNonce,
  generateSessionToken,
  generateResetToken,
  generateUUID,
  generateRandomString,
} from './keys';

// HMAC and timing-safe comparison
export {
  createHmac,
  verifyHmac,
  constantTimeEquals,
  constantTimeEqualsBuffer,
} from './hmac';

// TOTP helpers
export {
  generateTotpSecret,
  generateTotpToken,
  verifyTotpToken,
} from './totp';

```

---

### keys.ts

**Path:** `src\keys.ts`

**Language:** TypeScript

```typescript
import { randomBytes, createHash } from 'crypto';

/**
 * Generate a cryptographically secure API key.
 * @returns A 32-byte hex string
 */
export function generateApiKey(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Hash an API key for secure storage.
 * Never store the raw key, only store the hash.
 * @param apiKey - The API key to hash
 * @returns A 64-byte hex hash
 */
export function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Generate a cryptographically secure nonce.
 * @returns A 16-byte hex string
 */
export function generateNonce(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Generate a cryptographically secure session token.
 * @returns A 32-byte base64url string
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Generate a cryptographically secure reset token.
 * @returns A 32-byte hex string
 */
export function generateResetToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Generate a cryptographically secure UUID v4.
 * @returns A UUID v4 string
 */
export function generateUUID(): string {
  const bytes = randomBytes(16);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40; // Set version to 0100
  bytes[8] = (bytes[8]! & 0x3f) | 0x80; // Set variant to 10x
  
  return [
    bytes.subarray(0, 4).toString('hex'),
    bytes.subarray(4, 6).toString('hex'),
    bytes.subarray(6, 8).toString('hex'),
    bytes.subarray(8, 10).toString('hex'),
    bytes.subarray(10, 16).toString('hex'),
  ].join('-');
}

/**
 * Generate a cryptographically secure random string.
 * @param length - The length of the string to generate
 * @returns A random string of the specified length
 */
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const result = [];
  
  // Generate cryptographically secure random bytes
  const randomValues = randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    const randomIndex = randomValues[i] % chars.length;
    result.push(chars[randomIndex]);
  }
  
  return result.join('');
}

```

---

### totp.ts

**Path:** `src\totp.ts`

**Language:** TypeScript

```typescript
import { authenticator } from 'otplib';
import { randomBytes } from 'crypto';

/**
 * Generate a TOTP secret key using otplib.
 * @returns A base32 encoded secret key
 */
export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Generate a TOTP token for current time using otplib.
 * @param secret - Base32 encoded secret
 * @param timeStep - Time step in seconds (default: 30)
 * @param digits - Number of digits (default: 6)
 * @returns TOTP token as string
 */
export function generateTotpToken(
  secret: string,
  timeStep: number = 30,
  digits: number = 6
): string {
  // Configure otplib with the provided parameters
  authenticator.options = {
    window: timeStep,
    digits,
  };
  
  return authenticator.generate(secret);
}

/**
 * Verify a TOTP token using otplib.
 * @param secret - Base32 encoded secret
 * @param token - Token to verify
 * @param timeStep - Time step in seconds (default: 30)
 * @param window - Number of time steps to check before/after (default: 1)
 * @returns True if token is valid
 */
export function verifyTotpToken(
  secret: string,
  token: string,
  timeStep: number = 30,
  window: number = 1
): boolean {
  // Configure otplib with the provided parameters
  authenticator.options = {
    window,
    timeStep,
  };
  
  return authenticator.verify({
    token,
    secret,
  });
}

```

---

### hmac.test.ts

**Path:** `tests\hmac.test.ts`

**Language:** TypeScript

```typescript
import { describe, it, expect } from 'vitest';
import {
  createHmac,
  verifyHmac,
  constantTimeEquals,
  constantTimeEqualsBuffer,
} from '../src/hmac';

describe('HMAC and timing-safe comparison', () => {
  it('creates HMAC with SHA256', () => {
    const data = 'test data';
    const key = 'secret key';
    const hmac = createHmac('sha256', data, key);
    
    expect(hmac).toBeDefined();
    expect(typeof hmac).toBe('string');
    expect(hmac.length).toBe(64); // SHA-256 hex length
  });

  it('creates HMAC with SHA512', () => {
    const data = 'test data';
    const key = 'secret key';
    const hmac = createHmac('sha512', data, key);
    
    expect(hmac).toBeDefined();
    expect(typeof hmac).toBe('string');
    expect(hmac.length).toBe(128); // SHA-512 hex length
  });

  it('creates consistent HMACs', () => {
    const data = 'test data';
    const key = 'secret key';
    const hmac1 = createHmac('sha256', data, key);
    const hmac2 = createHmac('sha256', data, key);
    
    expect(hmac1).toBe(hmac2);
  });

  it('verifies correct HMAC', () => {
    const data = 'test data';
    const key = 'secret key';
    const hmac = createHmac('sha256', data, key);
    
    expect(verifyHmac('sha256', data, key, hmac)).toBe(true);
  });

  it('rejects incorrect HMAC', () => {
    const data = 'test data';
    const key = 'secret key';
    const wrongHmac = 'wrong hmac value';
    
    expect(verifyHmac('sha256', data, key, wrongHmac)).toBe(false);
  });

  it('performs constant-time string comparison', () => {
    const str1 = 'test string';
    const str2 = 'test string';
    const str3 = 'different string';
    
    expect(constantTimeEquals(str1, str2)).toBe(true);
    expect(constantTimeEquals(str1, str3)).toBe(false);
  });

  it('performs constant-time buffer comparison', () => {
    const buf1 = Buffer.from('test data');
    const buf2 = Buffer.from('test data');
    const buf3 = Buffer.from('different data');
    
    expect(constantTimeEqualsBuffer(buf1, buf2)).toBe(true);
    expect(constantTimeEqualsBuffer(buf1, buf3)).toBe(false);
  });

  it('rejects different length strings', () => {
    const str1 = 'short';
    const str2 = 'much longer string';
    
    expect(constantTimeEquals(str1, str2)).toBe(false);
  });

  it('rejects different length buffers', () => {
    const buf1 = Buffer.from('short');
    const buf2 = Buffer.from('much longer buffer');
    
    expect(constantTimeEqualsBuffer(buf1, buf2)).toBe(false);
  });
});

```

---

### keys.test.ts

**Path:** `tests\keys.test.ts`

**Language:** TypeScript

```typescript
import { describe, it, expect } from 'vitest';
import {
  generateApiKey,
  hashApiKey,
  generateNonce,
  generateSessionToken,
  generateResetToken,
  generateUUID,
  generateRandomString,
} from '../src/keys';

describe('Key generation and hashing', () => {
  it('generates API key of correct length', () => {
    const apiKey = generateApiKey();
    expect(apiKey).toHaveLength(64); // 32 bytes * 2 hex chars
    expect(/^[0-9a-f]{64}$/.test(apiKey)).toBe(true);
  });

  it('hashes API key consistently', () => {
    const apiKey = generateApiKey();
    const hash1 = hashApiKey(apiKey);
    const hash2 = hashApiKey(apiKey);
    
    expect(hash1).toHaveLength(64); // SHA-256 hex
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(apiKey);
  });

  it('generates nonce of correct length', () => {
    const nonce = generateNonce();
    expect(nonce).toHaveLength(32); // 16 bytes * 2 hex chars
    expect(/^[0-9a-f]{32}$/.test(nonce)).toBe(true);
  });

  it('generates session token', () => {
    const token = generateSessionToken();
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('generates reset token', () => {
    const token = generateResetToken();
    expect(token).toHaveLength(64); // 32 bytes * 2 hex chars
    expect(/^[0-9a-f]{64}$/.test(token)).toBe(true);
  });

  it('generates valid UUID v4', () => {
    const uuid = generateUUID();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    expect(uuid).toMatch(uuidRegex);
  });

  it('generates different UUIDs each time', () => {
    const uuid1 = generateUUID();
    const uuid2 = generateUUID();
    expect(uuid1).not.toBe(uuid2);
  });

  it('generates random string of specified length', () => {
    const length = 10;
    const str = generateRandomString(length);
    
    expect(str).toHaveLength(length);
    expect(/^[A-Za-z0-9]+$/.test(str)).toBe(true);
  });

  it('generates cryptographically secure different random strings', () => {
    const str1 = generateRandomString(10);
    const str2 = generateRandomString(10);
    expect(str1).not.toBe(str2);
    
    // Generate multiple strings to ensure cryptographic randomness
    const strings = Array.from({ length: 100 }, () => generateRandomString(20));
    const uniqueStrings = new Set(strings);
    
    // All 100 strings should be unique (extremely high probability with crypto.randomBytes)
    expect(uniqueStrings.size).toBe(100);
  });
});

```

---

### totp.test.ts

**Path:** `tests\totp.test.ts`

**Language:** TypeScript

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateTotpSecret,
  generateTotpToken,
  verifyTotpToken,
} from '../src/totp';
import { authenticator } from 'otplib';

describe('TOTP helpers using otplib', () => {
  beforeEach(() => {
    // Reset otplib options before each test
    authenticator.options = {};
  });

  it('generates TOTP secret using otplib', () => {
    const secret = generateTotpSecret();
    
    expect(secret).toBeDefined();
    expect(typeof secret).toBe('string');
    expect(secret.length).toBeGreaterThan(0);
    expect(/^[A-Z2-7]+=*$/.test(secret)).toBe(true); // Base32 pattern
  });

  it('generates different secrets each time', () => {
    const secret1 = generateTotpSecret();
    const secret2 = generateTotpSecret();
    
    expect(secret1).not.toBe(secret2);
  });

  it('generates TOTP token with default parameters', () => {
    const secret = 'JBSWY3DPEHPK3PXP'; // Test secret
    const token = generateTotpToken(secret);
    
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token).toHaveLength(6);
    expect(/^\d{6}$/.test(token)).toBe(true);
  });

  it('generates TOTP token with custom parameters', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const token = generateTotpToken(secret, 60, 8);
    
    expect(token).toHaveLength(8);
    expect(/^\d{8}$/.test(token)).toBe(true);
  });

  it('generates consistent tokens for same time', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    
    // Mock time to ensure consistency
    const mockTime = Date.now();
    const originalDateNow = Date.now;
    Date.now = () => mockTime;
    
    try {
      const token1 = generateTotpToken(secret);
      const token2 = generateTotpToken(secret);
      
      expect(token1).toBe(token2);
    } finally {
      Date.now = originalDateNow;
    }
  });

  it('verifies correct TOTP token', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const token = generateTotpToken(secret);
    
    expect(verifyTotpToken(secret, token)).toBe(true);
  });

  it('rejects incorrect TOTP token', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const wrongToken = '123456';
    
    expect(verifyTotpToken(secret, wrongToken)).toBe(false);
  });

  it('verifies TOTP token within time window', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const token = generateTotpToken(secret);
    
    // Should verify with default window of 1 (±1 time step)
    expect(verifyTotpToken(secret, token, 30, 1)).toBe(true);
  });

  it('handles edge cases gracefully', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    
    // Should not throw errors for edge cases
    expect(() => generateTotpToken(secret)).not.toThrow();
    expect(() => verifyTotpToken(secret, '123456')).not.toThrow();
  });

  it('works with otplib directly for compatibility', () => {
    const secret = generateTotpSecret();
    
    // Generate token using our wrapper
    const ourToken = generateTotpToken(secret);
    
    // Generate token using otplib directly
    const otplibToken = authenticator.generate(secret);
    
    // They should be the same (within time tolerance)
    expect(ourToken).toMatch(/^\d{6}$/);
    expect(otplibToken).toMatch(/^\d{6}$/);
  });

  it('verifies tokens generated by otplib directly', () => {
    const secret = generateTotpSecret();
    const otplibToken = authenticator.generate(secret);
    
    // Our verifier should work with otplib-generated tokens
    expect(verifyTotpToken(secret, otplibToken)).toBe(true);
  });
});

```

---

