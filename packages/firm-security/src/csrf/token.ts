import { randomBytes, createHmac } from 'crypto'

/**
 * CSRF token configuration
 */
export interface CsrfTokenConfig {
  /** Token length in bytes */
  tokenLength?: number
  /** Token validity in seconds */
  tokenValidity?: number
  /** Secret key for HMAC signing */
  secretKey: string
  /** Token name for form field */
  tokenName?: string
  /** Header name for token */
  headerName?: string
}

/**
 * CSRF token data structure
 */
export interface CsrfTokenData {
  /** Raw token value */
  token: string
  /** HMAC signature */
  signature: string
  /** Token creation timestamp */
  created: number
  /** Token expiration timestamp */
  expires: number
}

/**
 * CSRF token error
 */
export class CsrfError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message)
    this.name = 'CsrfError'
  }
}

/**
 * CSRF token manager with HMAC double-submit pattern and session binding
 */
export class CsrfTokenManager {
  private readonly tokenLength: number
  private readonly tokenValidity: number
  private readonly secretKey: string
  private readonly tokenName: string
  private readonly headerName: string

  constructor(config: CsrfTokenConfig) {
    if (!config.secretKey || typeof config.secretKey !== 'string') {
      throw new CsrfError('Secret key is required', 'MISSING_SECRET')
    }

    this.tokenLength = config.tokenLength || 32
    this.tokenValidity = config.tokenValidity || 3600 // 1 hour
    this.secretKey = config.secretKey
    this.tokenName = config.tokenName || 'csrf_token'
    this.headerName = config.headerName || 'X-CSRF-Token'
  }

  /**
   * Generate a new CSRF token bound to a session
   */
  generateToken(sessionId: string): CsrfTokenData {
    const now = Date.now()
    const token = randomBytes(this.tokenLength).toString('base64')
    const expires = now + (this.tokenValidity * 1000)
    const signature = this.signToken(token, sessionId, expires)

    return {
      token,
      signature,
      created: now,
      expires
    }
  }

  /**
   * Verify a CSRF token with session binding
   * @deprecated Use parseTokenString instead for better security and consistency
   */
  verifyToken(token: string, signature: string, sessionId: string, expires?: number): boolean {
    if (!token || !signature || !sessionId) {
      return false
    }

    try {
      // If expires is provided, use it directly
      if (expires !== undefined) {
        // Check expiration first
        const now = Date.now()
        if (expires <= now) {
          return false
        }

        // Verify HMAC signature with session binding
        const expectedSignature = this.signToken(token, sessionId, expires)
        return this.constantTimeEquals(signature, expectedSignature)
      }

      // For backward compatibility when expires is not provided,
      // this method is deprecated and should not be used
      // Return false to encourage migration to parseTokenString
      return false
    } catch {
      return false
    }
  }

  /**
   * Create signed token string for forms
   */
  createTokenString(sessionId: string): string {
    const tokenData = this.generateToken(sessionId)
    // Format: token.expires.signature
    return `${tokenData.token}.${tokenData.expires}.${tokenData.signature}`
  }

  /**
   * Parse and verify token string with session binding
   * This is the recommended method for token verification
   */
  parseTokenString(tokenString: string, sessionId: string): CsrfTokenData | null {
    const parts = tokenString.split('.')
    if (parts.length !== 3) {
      return null
    }

    const [token, expiresStr, signature] = parts
    if (!token || !expiresStr || !signature) {
      return null
    }
    
    const expires = parseInt(expiresStr, 10)
    if (isNaN(expires)) {
      return null
    }

    // Verify token directly without using deprecated verifyToken
    if (!this.verifyTokenWithExpires(token, signature, sessionId, expires)) {
      return null
    }

    return {
      token,
      signature,
      created: expires - (this.tokenValidity * 1000),
      expires
    }
  }

  /**
   * Internal method to verify token with explicit expires parameter
   */
  private verifyTokenWithExpires(token: string, signature: string, sessionId: string, expires: number): boolean {
    if (!token || !signature || !sessionId) {
      return false
    }

    try {
      // Check expiration first
      const now = Date.now()
      if (expires <= now) {
        return false
      }

      // Verify HMAC signature with session binding
      const expectedSignature = this.signToken(token, sessionId, expires)
      return this.constantTimeEquals(signature, expectedSignature)
    } catch {
      return false
    }
  }

  /**
   * Extract token from request
   */
  extractToken(headers: Record<string, string>, body?: Record<string, any>): string | undefined {
    // Try header first
    const headerToken = headers[this.headerName.toLowerCase()]
    if (headerToken) {
      return headerToken
    }

    // Try form body
    if (body && body[this.tokenName]) {
      return body[this.tokenName]
    }

    return undefined
  }

  /**
   * Validate request CSRF token with session binding
   */
  validateRequest(
    sessionId: string,
    headers: Record<string, string>,
    body?: Record<string, any>
  ): { valid: boolean; error?: string } {
    if (!sessionId) {
      return { valid: false, error: 'Session required for CSRF validation' }
    }

    const tokenString = this.extractToken(headers, body)
    if (!tokenString) {
      return { valid: false, error: 'CSRF token missing' }
    }

    const tokenData = this.parseTokenString(tokenString, sessionId)
    if (!tokenData) {
      return { valid: false, error: 'Invalid CSRF token' }
    }

    return { valid: true }
  }

  /**
   * Sign token with HMAC using session binding
   */
  private signToken(token: string, sessionId: string, expires: number): string {
    const data = `${token}:${sessionId}:${expires}`
    return createHmac('sha256', this.secretKey)
      .update(data)
      .digest('hex')
  }


  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private constantTimeEquals(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false
    }

    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }

    return result === 0
  }

  /**
   * Get configuration
   */
  getConfig(): Omit<CsrfTokenConfig, 'secretKey'> {
    return {
      tokenLength: this.tokenLength,
      tokenValidity: this.tokenValidity,
      tokenName: this.tokenName,
      headerName: this.headerName
    }
  }
}

/**
 * Create CSRF token manager
 */
export function createCsrfTokenManager(config: CsrfTokenConfig): CsrfTokenManager {
  return new CsrfTokenManager(config)
}

/**
 * Generate random secret key for CSRF
 */
export function generateCsrfSecret(length: number = 64): string {
  return randomBytes(length).toString('base64')
}
