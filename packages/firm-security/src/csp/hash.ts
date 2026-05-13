import { createHash } from 'crypto'

/**
 * CSP hash algorithm types supported
 */
export type CspHashAlgorithm = 'sha256' | 'sha384' | 'sha512'

/**
 * Generates a CSP hash for inline scripts or styles
 * @param content - The inline content to hash
 * @param algorithm - Hash algorithm to use (default: sha256)
 * @returns Base64-encoded hash with algorithm prefix
 */
export function generateCspHash(content: string, algorithm: CspHashAlgorithm = 'sha256'): string {
  if (typeof content !== 'string') {
    throw new Error('Content must be a string')
  }
  
  const hash = createHash(algorithm).update(content, 'utf8').digest('base64')
  return `${algorithm}-${hash}`
}

/**
 * Validates a CSP hash format
 * @param hash - The hash to validate
 * @returns true if hash is valid format
 */
export function isValidCspHash(hash: string): boolean {
  if (typeof hash !== 'string') return false
  
  const validPrefixes = ['sha256-', 'sha384-', 'sha512-']
  const hasValidPrefix = validPrefixes.some(prefix => hash.startsWith(prefix))
  
  if (!hasValidPrefix) return false
  
  const base64Part = hash.split('-')[1]
  if (!base64Part) return false
  
  try {
    Buffer.from(base64Part, 'base64')
    return true
  } catch {
    return false
  }
}

/**
 * CSP hash builder class for managing multiple hashes
 */
export class CspHashBuilder {
  private hashes: Set<string> = new Set()

  /**
   * Add a hash for inline content
   */
  addHash(content: string, algorithm?: CspHashAlgorithm): this {
    const hash = generateCspHash(content, algorithm)
    this.hashes.add(hash)
    return this
  }

  /**
   * Add a pre-computed hash
   */
  addExistingHash(hash: string): this {
    if (!isValidCspHash(hash)) {
      throw new Error(`Invalid CSP hash format: ${hash}`)
    }
    this.hashes.add(hash)
    return this
  }

  /**
   * Get all hashes as array
   */
  getHashes(): string[] {
    return Array.from(this.hashes)
  }

  /**
   * Get hashes formatted for CSP header
   */
  getCspHashes(): string {
    return this.getHashes().map(hash => `'${hash}'`).join(' ')
  }

  /**
   * Clear all hashes
   */
  clear(): this {
    this.hashes.clear()
    return this
  }

  /**
   * Check if hash exists
   */
  hasHash(hash: string): boolean {
    return this.hashes.has(hash)
  }
}
