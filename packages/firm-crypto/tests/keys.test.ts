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
