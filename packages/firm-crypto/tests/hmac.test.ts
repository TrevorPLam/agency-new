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
