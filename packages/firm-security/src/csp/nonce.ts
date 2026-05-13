import { randomBytes } from 'crypto'

/**
 * Generates a cryptographically secure CSP nonce for each request
 * Nonce should be base64 encoded and included in CSP header and script tags
 */
export function generateCspNonce(): string {
  const nonce = randomBytes(16)
  return nonce.toString('base64')
}

/**
 * Validates that a nonce matches the expected format
 * @param nonce - The nonce to validate
 * @returns true if nonce is valid base64 string of reasonable length
 */
export function isValidCspNonce(nonce: string): boolean {
  if (typeof nonce !== 'string') return false
  if (nonce.length < 16 || nonce.length > 32) return false
  
  try {
    // Try to decode as base64 to validate format
    Buffer.from(nonce, 'base64')
    return true
  } catch {
    return false
  }
}

/**
 * CSP nonce context interface for request-scoped nonce storage
 */
export interface CspNonceContext {
  nonce: string
  generated: Date
}

/**
 * Creates a new CSP nonce context
 */
export function createCspNonceContext(): CspNonceContext {
  return {
    nonce: generateCspNonce(),
    generated: new Date()
  }
}
