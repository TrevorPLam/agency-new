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
