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
