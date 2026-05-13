import { describe, it, expect } from 'vitest'
import { generateCspNonce, isValidCspNonce, createCspNonceContext, generateCspHash, isValidCspHash, CspHashBuilder } from '../src/csp'

describe('CSP Nonce', () => {
  it('should generate a valid CSP nonce', () => {
    const nonce = generateCspNonce()
    expect(typeof nonce).toBe('string')
    expect(nonce.length).toBeGreaterThan(0)
    expect(isValidCspNonce(nonce)).toBe(true)
  })

  it('should validate nonce format correctly', () => {
    const validNonce = generateCspNonce()
    expect(isValidCspNonce(validNonce)).toBe(true)
    
    expect(isValidCspNonce('')).toBe(false)
    expect(isValidCspNonce('short')).toBe(false)
    expect(isValidCspNonce('a'.repeat(33))).toBe(false)
    expect(isValidCspNonce('invalid-base64!@#')).toBe(false)
  })

  it('should create CSP nonce context', () => {
    const context = createCspNonceContext()
    expect(context).toHaveProperty('nonce')
    expect(context).toHaveProperty('generated')
    expect(typeof context.nonce).toBe('string')
    expect(context.generated).toBeInstanceOf(Date)
    expect(isValidCspNonce(context.nonce)).toBe(true)
  })
})

describe('CSP Hash', () => {
  it('should generate valid CSP hash', () => {
    const content = 'console.log("test")'
    const hash = generateCspHash(content)
    
    expect(typeof hash).toBe('string')
    expect(hash).toMatch(/^sha256-[a-zA-Z0-9+/]+={0,2}$/)
    expect(isValidCspHash(hash)).toBe(true)
  })

  it('should support different algorithms', () => {
    const content = 'test'
    const sha256 = generateCspHash(content, 'sha256')
    const sha384 = generateCspHash(content, 'sha384')
    const sha512 = generateCspHash(content, 'sha512')
    
    expect(sha256).toMatch(/^sha256-/)
    expect(sha384).toMatch(/^sha384-/)
    expect(sha512).toMatch(/^sha512-/)
  })

  it('should validate hash format', () => {
    const validHash = generateCspHash('test')
    expect(isValidCspHash(validHash)).toBe(true)
    
    expect(isValidCspHash('')).toBe(false)
    expect(isValidCspHash('invalid')).toBe(false)
    expect(isValidCspHash('sha512-')).toBe(false)
    expect(isValidCspHash('invalid-base64!@#')).toBe(false)
  })

  it('should throw error for invalid content', () => {
    expect(() => generateCspHash(null as any)).toThrow('Content must be a string')
    expect(() => generateCspHash(undefined as any)).toThrow('Content must be a string')
  })
})

describe('CspHashBuilder', () => {
  it('should build hashes incrementally', () => {
    const builder = new CspHashBuilder()
    
    builder.addHash('console.log("test1")')
    builder.addHash('console.log("test2")', 'sha384')
    
    const hashes = builder.getHashes()
    expect(hashes).toHaveLength(2)
    expect(hashes[0]).toMatch(/^sha256-/)
    expect(hashes[1]).toMatch(/^sha384-/)
  })

  it('should format hashes for CSP', () => {
    const builder = new CspHashBuilder()
    builder.addHash('test')
    
    const cspHashes = builder.getCspHashes()
    expect(cspHashes).toMatch(/^'sha256-[^']+'$/)
  })

  it('should add existing hashes', () => {
    const builder = new CspHashBuilder()
    const existingHash = generateCspHash('test')
    
    builder.addExistingHash(existingHash)
    expect(builder.getHashes()).toContain(existingHash)
  })

  it('should throw error for invalid existing hash', () => {
    const builder = new CspHashBuilder()
    expect(() => builder.addExistingHash('invalid')).toThrow('Invalid CSP hash format')
  })

  it('should clear hashes', () => {
    const builder = new CspHashBuilder()
    builder.addHash('test')
    builder.clear()
    
    expect(builder.getHashes()).toHaveLength(0)
  })

  it('should check hash existence', () => {
    const builder = new CspHashBuilder()
    const hash = generateCspHash('test')
    
    expect(builder.hasHash(hash)).toBe(false)
    builder.addExistingHash(hash)
    expect(builder.hasHash(hash)).toBe(true)
  })
})
