import { describe, it, expect } from 'vitest'
import { createCsrfTokenManager, generateCsrfSecret, CsrfError } from '../src/csrf'

describe('CSRF Token Manager with Session Binding', () => {
  const secretKey = 'test-secret-key-for-testing-purposes'
  const sessionId = 'test-session-123'

  it('should create token manager with valid config', () => {
    const manager = createCsrfTokenManager({ secretKey })
    expect(manager).toBeDefined()
  })

  it('should throw error for missing secret key', () => {
    expect(() => createCsrfTokenManager({ secretKey: '' })).toThrow('Secret key is required')
    expect(() => createCsrfTokenManager({ secretKey: undefined as any })).toThrow('Secret key is required')
  })

  it('should generate valid session-bound token', () => {
    const manager = createCsrfTokenManager({ secretKey })
    const tokenData = manager.generateToken(sessionId)
    
    expect(tokenData).toHaveProperty('token')
    expect(tokenData).toHaveProperty('signature')
    expect(tokenData).toHaveProperty('created')
    expect(tokenData).toHaveProperty('expires')
    expect(typeof tokenData.token).toBe('string')
    expect(typeof tokenData.signature).toBe('string')
    expect(tokenData.expires).toBeGreaterThan(tokenData.created)
  })

  it('should create and parse session-bound token string', () => {
    const manager = createCsrfTokenManager({ secretKey })
    const tokenString = manager.createTokenString(sessionId)
    
    expect(typeof tokenString).toBe('string')
    expect(tokenString).toContain('.')
    
    const parsed = manager.parseTokenString(tokenString, sessionId)
    expect(parsed).toBeDefined()
    expect(parsed?.token).toBeDefined()
    expect(parsed?.signature).toBeDefined()
  })

  it('should verify valid session-bound token using parseTokenString', () => {
    const manager = createCsrfTokenManager({ secretKey })
    const tokenString = manager.createTokenString(sessionId)
    
    const tokenData = manager.parseTokenString(tokenString, sessionId)
    expect(tokenData).toBeTruthy()
    expect(tokenData?.token).toBeDefined()
    expect(tokenData?.signature).toBeDefined()
  })

  it('should reject token with wrong session binding using parseTokenString', () => {
    const manager = createCsrfTokenManager({ secretKey })
    const tokenString = manager.createTokenString(sessionId)
    
    // Try to parse with different session ID
    const tokenData = manager.parseTokenString(tokenString, 'different-session-456')
    expect(tokenData).toBeNull()
  })

  it('should reject invalid token using parseTokenString', () => {
    const manager = createCsrfTokenManager({ secretKey })
    
    expect(manager.parseTokenString('invalid-token.invalid-signature', sessionId)).toBeNull()
    expect(manager.parseTokenString('', sessionId)).toBeNull()
    expect(manager.parseTokenString('token.signature', '')).toBeNull()
  })

  it('should extract token from headers', () => {
    const manager = createCsrfTokenManager({ secretKey })
    const tokenString = manager.createTokenString(sessionId)
    
    const headers = {
      'x-csrf-token': tokenString
    }
    
    const extracted = manager.extractToken(headers)
    expect(extracted).toBe(tokenString)
  })

  it('should extract token from body', () => {
    const manager = createCsrfTokenManager({ secretKey })
    const tokenString = manager.createTokenString(sessionId)
    
    const body = {
      csrf_token: tokenString
    }
    
    const extracted = manager.extractToken({}, body)
    expect(extracted).toBe(tokenString)
  })

  it('should validate request with valid session-bound token', () => {
    const manager = createCsrfTokenManager({ secretKey })
    const tokenString = manager.createTokenString(sessionId)
    
    const headers = { 'x-csrf-token': tokenString }
    const result = manager.validateRequest(sessionId, headers)
    
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should reject request without session', () => {
    const manager = createCsrfTokenManager({ secretKey })
    const tokenString = manager.createTokenString(sessionId)
    
    const headers = { 'x-csrf-token': tokenString }
    const result = manager.validateRequest('', headers)
    
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Session required for CSRF validation')
  })

  it('should reject request without token', () => {
    const manager = createCsrfTokenManager({ secretKey })
    const result = manager.validateRequest(sessionId, {})
    
    expect(result.valid).toBe(false)
    expect(result.error).toBe('CSRF token missing')
  })

  it('should reject request with invalid session-bound token', () => {
    const manager = createCsrfTokenManager({ secretKey })
    const tokenString = manager.createTokenString(sessionId)
    
    const headers = { 'x-csrf-token': tokenString }
    const result = manager.validateRequest('different-session', headers)
    
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Invalid CSRF token')
  })

  it('should reject request with malformed token', () => {
    const manager = createCsrfTokenManager({ secretKey })
    const headers = { 'x-csrf-token': 'invalid-token-format' }
    const result = manager.validateRequest(sessionId, headers)
    
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Invalid CSRF token')
  })

  it('should handle expired tokens', () => {
    const manager = createCsrfTokenManager({ secretKey, tokenValidity: -1 }) // Already expired
    const tokenString = manager.createTokenString(sessionId)
    
    const headers = { 'x-csrf-token': tokenString }
    const result = manager.validateRequest(sessionId, headers)
    
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Invalid CSRF token')
  })

  it('should generate different tokens for different sessions', () => {
    const manager = createCsrfTokenManager({ secretKey })
    
    const token1 = manager.generateToken('session-1')
    const token2 = manager.generateToken('session-2')
    
    expect(token1.token).not.toBe(token2.token)
    expect(token1.signature).not.toBe(token2.signature)
  })

  it('should verify token only with correct session using parseTokenString', () => {
    const manager = createCsrfTokenManager({ secretKey })
    const tokenString = manager.createTokenString(sessionId)
    
    // Should verify with correct session
    const tokenData1 = manager.parseTokenString(tokenString, sessionId)
    expect(tokenData1).toBeTruthy()
    
    // Should not verify with wrong session
    const tokenData2 = manager.parseTokenString(tokenString, 'wrong-session')
    expect(tokenData2).toBeNull()
    
    // Should not verify without session
    const tokenData3 = manager.parseTokenString(tokenString, '')
    expect(tokenData3).toBeNull()
  })
})

describe('CSRF Utilities', () => {
  it('should generate secret key', () => {
    const secret = generateCsrfSecret()
    expect(typeof secret).toBe('string')
    expect(secret.length).toBeGreaterThan(0)
  })

  it('should generate secret key with custom length', () => {
    const secret = generateCsrfSecret(32)
    expect(typeof secret).toBe('string')
    expect(secret.length).toBeGreaterThan(0)
  })
})

describe('CSRF Token Format Fix - Integration Tests', () => {
  const secretKey = 'test-secret-key-for-csrf-fix'
  const sessionId = 'test-session-for-fix'

  it('should generate tokens in new format: token.expires.signature', () => {
    const manager = createCsrfTokenManager({ secretKey })
    const tokenString = manager.createTokenString(sessionId)
    
    const parts = tokenString.split('.')
    expect(parts).toHaveLength(3)
    
    const [token, expiresStr, signature] = parts
    expect(token).toBeTruthy()
    expect(expiresStr).toBeTruthy()
    expect(signature).toBeTruthy()
    
    // Verify expires is a valid timestamp
    const expires = parseInt(expiresStr, 10)
    expect(isNaN(expires)).toBe(false)
    expect(expires).toBeGreaterThan(Date.now())
  })

  it('should successfully verify tokens with new format', () => {
    const manager = createCsrfTokenManager({ secretKey })
    const tokenString = manager.createTokenString(sessionId)
    
    const result = manager.validateRequest(sessionId, { 'x-csrf-token': tokenString })
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should reject tampered tokens in new format', () => {
    const manager = createCsrfTokenManager({ secretKey })
    const tokenString = manager.createTokenString(sessionId)
    
    const parts = tokenString.split('.')
    const [token, expiresStr, signature] = parts
    
    // Tamper with the token
    const tamperedToken = token + 'tampered'
    const tamperedString = `${tamperedToken}.${expiresStr}.${signature}`
    
    const result = manager.validateRequest(sessionId, { 'x-csrf-token': tamperedString })
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Invalid CSRF token')
  })

  it('should reject tokens with tampered timestamps', () => {
    const manager = createCsrfTokenManager({ secretKey })
    const tokenString = manager.createTokenString(sessionId)
    
    const parts = tokenString.split('.')
    const [token, expiresStr, signature] = parts
    
    // Tamper with the timestamp
    const tamperedExpires = (parseInt(expiresStr, 10) + 1000000).toString()
    const tamperedString = `${token}.${tamperedExpires}.${signature}`
    
    const result = manager.validateRequest(sessionId, { 'x-csrf-token': tamperedString })
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Invalid CSRF token')
  })

  it('should reject tokens with tampered signatures', () => {
    const manager = createCsrfTokenManager({ secretKey })
    const tokenString = manager.createTokenString(sessionId)
    
    const parts = tokenString.split('.')
    const [token, expiresStr] = parts
    
    // Replace signature with invalid one
    const tamperedString = `${token}.${expiresStr}.invalid-signature`
    
    const result = manager.validateRequest(sessionId, { 'x-csrf-token': tamperedString })
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Invalid CSRF token')
  })

  it('should properly parse and return token data with new format', () => {
    const manager = createCsrfTokenManager({ secretKey, tokenValidity: 3600 })
    const tokenString = manager.createTokenString(sessionId)
    
    const tokenData = manager.parseTokenString(tokenString, sessionId)
    expect(tokenData).toBeTruthy()
    
    if (tokenData) {
      expect(tokenData.token).toBeTruthy()
      expect(tokenData.signature).toBeTruthy()
      expect(tokenData.expires).toBeGreaterThan(Date.now())
      expect(tokenData.created).toBe(tokenData.expires - (3600 * 1000))
    }
  })

  it('should verify token with explicit expires parameter', () => {
    const manager = createCsrfTokenManager({ secretKey })
    const tokenData = manager.generateToken(sessionId)
    
    // Test the new verifyToken signature with expires parameter
    const isValid = manager.verifyToken(tokenData.token, tokenData.signature, sessionId, tokenData.expires)
    expect(isValid).toBe(true)
  })

  it('should maintain session binding in new format', () => {
    const manager = createCsrfTokenManager({ secretKey })
    const tokenString = manager.createTokenString(sessionId)
    
    // Should work with correct session
    const result1 = manager.validateRequest(sessionId, { 'x-csrf-token': tokenString })
    expect(result1.valid).toBe(true)
    
    // Should fail with different session
    const result2 = manager.validateRequest('different-session', { 'x-csrf-token': tokenString })
    expect(result2.valid).toBe(false)
    expect(result2.error).toBe('Invalid CSRF token')
  })

  it('should handle malformed token strings gracefully', () => {
    const manager = createCsrfTokenManager({ secretKey })
    
    // Test various malformed formats
    const malformedTokens = [
      'token-only',                    // Missing parts
      'token.signature',               // Missing expires
      'token.expires',                 // Missing signature
      'token..signature',              // Empty expires
      '.expires.signature',            // Empty token
      'token.expires.',                // Empty signature
      'token.non-numeric.signature',   // Non-numeric expires
      'token.expires.signature.extra', // Too many parts
      '',                              // Empty string
    ]
    
    malformedTokens.forEach(malformedToken => {
      const result = manager.validateRequest(sessionId, { 'x-csrf-token': malformedToken })
      expect(result.valid).toBe(false)
      // Empty string should return "CSRF token missing", others should return "Invalid CSRF token"
      if (malformedToken === '') {
        expect(result.error).toBe('CSRF token missing')
      } else {
        expect(result.error).toBe('Invalid CSRF token')
      }
    })
  })

  it('should demonstrate the vulnerability is fixed', () => {
    const manager = createCsrfTokenManager({ secretKey })
    
    // Before the fix, this would always fail because extractTimestamp tried to parse
    // HMAC output as a timestamp. Now it should work properly.
    const tokenString = manager.createTokenString(sessionId)
    
    // This should now succeed (vulnerability fixed)
    const result = manager.validateRequest(sessionId, { 'x-csrf-token': tokenString })
    expect(result.valid).toBe(true)
    
    // Verify the token can be parsed correctly
    const tokenData = manager.parseTokenString(tokenString, sessionId)
    expect(tokenData).toBeTruthy()
    expect(tokenData?.expires).toBeGreaterThan(Date.now())
  })

  it('should demonstrate verifyToken deprecation and migration path', () => {
    const manager = createCsrfTokenManager({ secretKey })
    const tokenData = manager.generateToken(sessionId)
    
    // Deprecated verifyToken without expires parameter - should fail gracefully
    const isValidDeprecated = manager.verifyToken(tokenData.token, tokenData.signature, sessionId)
    expect(isValidDeprecated).toBe(false) // Expected to fail due to deprecation
    
    // verifyToken with explicit expires parameter - should still work
    const isValidWithExpires = manager.verifyToken(tokenData.token, tokenData.signature, sessionId, tokenData.expires)
    expect(isValidWithExpires).toBe(true)
    
    // Recommended approach: use parseTokenString and createTokenString
    const tokenString = manager.createTokenString(sessionId)
    const parsedTokenData = manager.parseTokenString(tokenString, sessionId)
    expect(parsedTokenData).toBeTruthy()
    expect(parsedTokenData?.token).toBeDefined()
    expect(parsedTokenData?.signature).toBeDefined()
  })
})

describe('CsrfError', () => {
  it('should create CSRF error', () => {
    const error = new CsrfError('Test error', 'TEST_CODE')
    expect(error.message).toBe('Test error')
    expect(error.code).toBe('TEST_CODE')
    expect(error.name).toBe('CsrfError')
  })
})
