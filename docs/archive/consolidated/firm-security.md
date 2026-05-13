# firm-security

Generated on: 2026-05-13T02:25:38.673Z
Total files: 21

**Description:** Runtime security middleware for Firm platform

**Version:** 0.1.0

## Table of Contents

- [audit.ts](#audit-ts)
- [index.ts](#index-ts)
- [hash.ts](#hash-ts)
- [index.ts](#index-ts)
- [nonce.ts](#nonce-ts)
- [index.ts](#index-ts)
- [token.ts](#token-ts)
- [index.ts](#index-ts)
- [middleware.ts](#middleware-ts)
- [index.ts](#index-ts)
- [index.ts](#index-ts)
- [limiter.ts](#limiter-ts)
- [policies.ts](#policies-ts)
- [index.ts](#index-ts)
- [registry.ts](#registry-ts)
- [index.ts](#index-ts)
- [verify.ts](#verify-ts)
- [csp.test.ts](#csp-test-ts)
- [csrf.test.ts](#csrf-test-ts)
- [rate-limit.test.ts](#rate-limit-test-ts)
- [tsup.config.ts](#tsup-config-ts)

## File Contents

### audit.ts

**Path:** `src\audit.ts`

**Language:** TypeScript

```typescript
/**
 * Security audit event types
 */
export type SecurityEventType = 
  | 'auth.login.success'
  | 'auth.login.failure'
  | 'auth.logout'
  | 'auth.password.reset'
  | 'auth.mfa.enabled'
  | 'auth.mfa.disabled'
  | 'auth.impersonation.start'
  | 'auth.impersonation.end'
  | 'csrf.token.generated'
  | 'csrf.token.verified'
  | 'csrf.token.failed'
  | 'rate.limit.exceeded'
  | 'turnstile.verified'
  | 'turnstile.failed'
  | 'csp.violation'
  | 'security.header.missing'
  | 'permission.denied'
  | 'data.access.sensitive'
  | 'admin.action'
  | 'config.changed'

/**
 * Security audit event severity levels
 */
export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * Security audit event context
 */
export interface SecurityEventContext {
  /** User ID if available */
  userId?: string
  /** IP address */
  ip?: string
  /** User agent */
  userAgent?: string
  /** Tenant ID */
  tenantId?: string
  /** Session ID */
  sessionId?: string
  /** Request ID */
  requestId?: string
  /** Resource being accessed */
  resource?: string
  /** Action being performed */
  action?: string
  /** Additional metadata */
  metadata?: Record<string, any>
}

/**
 * Security audit event
 */
export interface SecurityEvent {
  /** Event type */
  type: SecurityEventType
  /** Event severity */
  severity: SecuritySeverity
  /** Event timestamp */
  timestamp: Date
  /** Event message */
  message: string
  /** Event context */
  context: SecurityEventContext
  /** Event ID */
  id: string
}

/**
 * Security audit logger configuration
 */
export interface SecurityAuditConfig {
  /** Minimum severity level to log */
  minSeverity?: SecuritySeverity
  /** Whether to log to console */
  enableConsole?: boolean
  /** Whether to log to file (if implemented) */
  enableFile?: boolean
  /** Whether to log to external service (if implemented) */
  enableRemote?: boolean
  /** Remote logging endpoint */
  remoteEndpoint?: string
  /** API key for remote logging */
  remoteApiKey?: string
  /** Custom event formatter */
  formatter?: (event: SecurityEvent) => string
}

/**
 * Security audit logger
 */
export class SecurityAuditLogger {
  private readonly config: Required<SecurityAuditConfig>
  private readonly severityLevels: Record<SecuritySeverity, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4
  }

  constructor(config: SecurityAuditConfig = {}) {
    this.config = {
      minSeverity: config.minSeverity || 'low',
      enableConsole: config.enableConsole !== false,
      enableFile: config.enableFile || false,
      enableRemote: config.enableRemote || false,
      remoteEndpoint: config.remoteEndpoint || '',
      remoteApiKey: config.remoteApiKey || '',
      formatter: config.formatter || this.defaultFormatter
    }
  }

  /**
   * Log a security event
   */
  log(event: Omit<SecurityEvent, 'id' | 'timestamp'>): SecurityEvent {
    const fullEvent: SecurityEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date()
    }

    // Check severity threshold
    if (this.shouldLog(fullEvent.severity)) {
      this.writeLog(fullEvent)
    }

    return fullEvent
  }

  /**
   * Log authentication success
   */
  logAuthSuccess(
    userId: string,
    context: Partial<SecurityEventContext> = {}
  ): SecurityEvent {
    return this.log({
      type: 'auth.login.success',
      severity: 'medium',
      message: `User ${userId} logged in successfully`,
      context: { ...context, userId }
    })
  }

  /**
   * Log authentication failure
   */
  logAuthFailure(
    reason: string,
    context: Partial<SecurityEventContext> = {}
  ): SecurityEvent {
    return this.log({
      type: 'auth.login.failure',
      severity: 'high',
      message: `Authentication failed: ${reason}`,
      context
    })
  }

  /**
   * Log rate limit exceeded
   */
  logRateLimitExceeded(
    policy: string,
    context: Partial<SecurityEventContext> = {}
  ): SecurityEvent {
    return this.log({
      type: 'rate.limit.exceeded',
      severity: 'medium',
      message: `Rate limit exceeded for policy: ${policy}`,
      context: { ...context, metadata: { policy } }
    })
  }

  /**
   * Log CSRF token failure
   */
  logCsrfFailure(
    reason: string,
    context: Partial<SecurityEventContext> = {}
  ): SecurityEvent {
    return this.log({
      type: 'csrf.token.failed',
      severity: 'high',
      message: `CSRF token verification failed: ${reason}`,
      context
    })
  }

  /**
   * Log permission denied
   */
  logPermissionDenied(
    resource: string,
    action: string,
    context: Partial<SecurityEventContext> = {}
  ): SecurityEvent {
    return this.log({
      type: 'permission.denied',
      severity: 'medium',
      message: `Permission denied for ${action} on ${resource}`,
      context: { ...context, resource, action }
    })
  }

  /**
   * Log admin action
   */
  logAdminAction(
    action: string,
    description: string,
    context: Partial<SecurityEventContext> = {}
  ): SecurityEvent {
    return this.log({
      type: 'admin.action',
      severity: 'high',
      message: `Admin action: ${action} - ${description}`,
      context: { ...context, action, metadata: { description } }
    })
  }

  /**
   * Check if event should be logged based on severity
   */
  private shouldLog(severity: SecuritySeverity): boolean {
    return this.severityLevels[severity] >= this.severityLevels[this.config.minSeverity]
  }

  /**
   * Write log to configured outputs
   */
  private writeLog(event: SecurityEvent): void {
    if (this.config.enableConsole) {
      this.writeToConsole(event)
    }

    if (this.config.enableFile) {
      this.writeToFile(event)
    }

    if (this.config.enableRemote) {
      this.writeToRemote(event)
    }
  }

  /**
   * Write to console
   */
  private writeToConsole(event: SecurityEvent): void {
    const level = this.getConsoleLevel(event.severity)
    const message = this.config.formatter(event)
    
    console[level](`[SECURITY] ${message}`)
  }

  /**
   * Write to file (placeholder - would need file system implementation)
   */
  private writeToFile(event: SecurityEvent): void {
    // File logging implementation would go here
    // For now, we'll just log to console with file indicator
    console.log(`[FILE] ${this.config.formatter(event)}`)
  }

  /**
   * Write to remote service (placeholder - would need HTTP client)
   */
  private writeToRemote(event: SecurityEvent): void {
    // Remote logging implementation would go here
    // For now, we'll just log to console with remote indicator
    console.log(`[REMOTE] ${this.config.formatter(event)}`)
  }

  /**
   * Get console logging level based on severity
   */
  private getConsoleLevel(severity: SecuritySeverity): 'log' | 'warn' | 'error' {
    switch (severity) {
      case 'low':
      case 'medium':
        return 'log'
      case 'high':
        return 'warn'
      case 'critical':
        return 'error'
      default:
        return 'log'
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Default event formatter
   */
  private defaultFormatter(event: SecurityEvent): string {
    const context = event.context
    const contextParts = [
      context.userId && `user:${context.userId}`,
      context.ip && `ip:${context.ip}`,
      context.tenantId && `tenant:${context.tenantId}`,
      context.resource && `resource:${context.resource}`,
      context.action && `action:${context.action}`
    ].filter(Boolean)

    const contextStr = contextParts.length > 0 ? ` [${contextParts.join(', ')}]` : ''
    return `${event.timestamp.toISOString()} ${event.type}${contextStr} ${event.message}`
  }

  /**
   * Get configuration
   */
  getConfig(): SecurityAuditConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<SecurityAuditConfig>): void {
    Object.assign(this.config, updates)
  }
}

/**
 * Create security audit logger
 */
export function createSecurityAuditLogger(config: SecurityAuditConfig = {}): SecurityAuditLogger {
  return new SecurityAuditLogger(config)
}

/**
 * Default security audit logger instance
 */
export const defaultSecurityAuditLogger = createSecurityAuditLogger()

```

---

### index.ts

**Path:** `src\audit\index.ts`

**Language:** TypeScript

```typescript
export {
  SecurityAuditLogger,
  createSecurityAuditLogger,
  defaultSecurityAuditLogger,
  type SecurityEvent,
  type SecurityEventType,
  type SecuritySeverity,
  type SecurityEventContext,
  type SecurityAuditConfig
} from '../audit'

```

---

### hash.ts

**Path:** `src\csp\hash.ts`

**Language:** TypeScript

```typescript
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

```

---

### index.ts

**Path:** `src\csp\index.ts`

**Language:** TypeScript

```typescript
export {
  generateCspNonce,
  isValidCspNonce,
  createCspNonceContext,
  type CspNonceContext
} from './nonce'

export {
  generateCspHash,
  isValidCspHash,
  CspHashBuilder,
  type CspHashAlgorithm
} from './hash'

```

---

### nonce.ts

**Path:** `src\csp\nonce.ts`

**Language:** TypeScript

```typescript
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

```

---

### index.ts

**Path:** `src\csrf\index.ts`

**Language:** TypeScript

```typescript
export {
  CsrfTokenManager,
  createCsrfTokenManager,
  generateCsrfSecret,
  CsrfError,
  type CsrfTokenConfig,
  type CsrfTokenData
} from './token'

```

---

### token.ts

**Path:** `src\csrf\token.ts`

**Language:** TypeScript

```typescript
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

```

---

### index.ts

**Path:** `src\headers\index.ts`

**Language:** TypeScript

```typescript
export {
  securityHeaders,
  getCspNonce,
  createCspContext,
  type SecurityHeadersOptions
} from './middleware'

```

---

### middleware.ts

**Path:** `src\headers\middleware.ts`

**Language:** TypeScript

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { generateCspNonce, isValidCspNonce, CspNonceContext } from '../csp'

/**
 * Security header configuration options
 */
export interface SecurityHeadersOptions {
  /** Content Security Policy configuration */
  csp?: {
    /** Enable CSP nonce generation */
    enableNonce?: boolean
    /** Custom CSP directives */
    directives?: Record<string, string | string[]>
    /** Report-only mode for testing */
    reportOnly?: boolean
  }
  /** Enable HSTS */
  hsts?: {
    /** Max age in seconds */
    maxAge?: number
    /** Include subdomains */
    includeSubDomains?: boolean
    /** Preload */
    preload?: boolean
  }
  /** Enable other security headers */
  enableXContentTypeOptions?: boolean
  enableXFrameOptions?: boolean
  enableXSSProtection?: boolean
  enableReferrerPolicy?: boolean
  enablePermissionsPolicy?: boolean
}

/**
 * Default security header configuration
 */
const defaultOptions: Required<SecurityHeadersOptions> = {
  csp: {
    enableNonce: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'"],
      'connect-src': ["'self'"],
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"]
    },
    reportOnly: false
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: false
  },
  enableXContentTypeOptions: true,
  enableXFrameOptions: true,
  enableXSSProtection: true,
  enableReferrerPolicy: true,
  enablePermissionsPolicy: true
}

/**
 * Creates CSP header value from directives and optional nonce
 */
function buildCspHeader(
  directives: Record<string, string | string[]>,
  nonce?: string,
  reportOnly = false
): string {
  const headerParts: string[] = []

  for (const [directive, values] of Object.entries(directives)) {
    const valueArray = Array.isArray(values) ? values : [values]
    let directiveValue = valueArray.join(' ')

    // Add nonce to script-src if enabled
    if (directive === 'script-src' && nonce) {
      directiveValue += ` 'nonce-${nonce}'`
    }

    headerParts.push(`${directive} ${directiveValue}`)
  }

  return headerParts.join('; ')
}

/**
 * Security headers middleware factory
 */
export function securityHeaders(options: SecurityHeadersOptions = {}) {
  const config = { ...defaultOptions, ...options }

  return function middleware(request: NextRequest): NextResponse {
    const response = NextResponse.next()
    const headers = response.headers

    // Generate CSP nonce if enabled
    let cspNonce: string | undefined
    if (config.csp.enableNonce) {
      cspNonce = generateCspNonce()
      // Store nonce in request headers for downstream use
      request.headers.set('x-csp-nonce', cspNonce)
    }

    // Set CSP header
    const cspHeaderName = config.csp.reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy'
    const cspValue = buildCspHeader(config.csp.directives, cspNonce, config.csp.reportOnly)
    headers.set(cspHeaderName, cspValue)

    // Set HSTS header
    const hstsValue = [
      `max-age=${config.hsts.maxAge}`,
      config.hsts.includeSubDomains ? 'includeSubDomains' : '',
      config.hsts.preload ? 'preload' : ''
    ].filter(Boolean).join('; ')
    headers.set('Strict-Transport-Security', hstsValue)

    // Set other security headers
    if (config.enableXContentTypeOptions) {
      headers.set('X-Content-Type-Options', 'nosniff')
    }

    if (config.enableXFrameOptions) {
      headers.set('X-Frame-Options', 'DENY')
    }

    if (config.enableXSSProtection) {
      headers.set('X-XSS-Protection', '1; mode=block')
    }

    if (config.enableReferrerPolicy) {
      headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    }

    if (config.enablePermissionsPolicy) {
      const permissions = [
        'geolocation=()',
        'microphone=()',
        'camera=()',
        'payment=()',
        'usb=()',
        'magnetometer=()',
        'gyroscope=()',
        'accelerometer=()'
      ].join(', ')
      headers.set('Permissions-Policy', permissions)
    }

    return response
  }
}

/**
 * Extract CSP nonce from request headers
 */
export function getCspNonce(request: NextRequest): string | undefined {
  const nonce = request.headers.get('x-csp-nonce')
  return nonce && isValidCspNonce(nonce) ? nonce : undefined
}

/**
 * CSP nonce context for request-scoped operations
 */
export function createCspContext(request: NextRequest): CspNonceContext | undefined {
  const nonce = getCspNonce(request)
  if (!nonce) return undefined

  return {
    nonce,
    generated: new Date()
  }
}

```

---

### index.ts

**Path:** `src\index.ts`

**Language:** TypeScript

```typescript
// CSP nonce and hash builders
export {
  generateCspNonce,
  isValidCspNonce,
  createCspNonceContext,
  generateCspHash,
  isValidCspHash,
  CspHashBuilder,
  type CspNonceContext,
  type CspHashAlgorithm
} from './csp'

// Security headers factory
export {
  securityHeaders,
  getCspNonce,
  createCspContext,
  type SecurityHeadersOptions
} from './headers'

// Rate limiter with named policies
export {
  RATE_LIMIT_POLICIES,
  getRateLimitPolicy,
  validateRateLimitPolicy,
  registerRateLimitPolicy,
  RateLimiter,
  createRateLimiter,
  type RateLimitPolicy,
  type RateLimitResult,
  type RateLimitIdentifier
} from './rate-limit'

// Turnstile verification
export {
  verifyTurnstile,
  createTurnstileVerifier,
  validateTurnstileConfig,
  TurnstileError,
  type TurnstileResponse,
  type TurnstileErrorCode,
  type TurnstileVerifyOptions
} from './turnstile'

// Tag registry
export {
  TagRegistry,
  createTagRegistry,
  DEFAULT_TAGS,
  type ScriptTag
} from './tags'

// CSRF token helpers
export {
  CsrfTokenManager,
  createCsrfTokenManager,
  generateCsrfSecret,
  CsrfError,
  type CsrfTokenConfig,
  type CsrfTokenData
} from './csrf'

// Security audit logger
export {
  SecurityAuditLogger,
  createSecurityAuditLogger,
  defaultSecurityAuditLogger,
  type SecurityEvent,
  type SecurityEventType,
  type SecuritySeverity,
  type SecurityEventContext,
  type SecurityAuditConfig
} from './audit'

```

---

### index.ts

**Path:** `src\rate-limit\index.ts`

**Language:** TypeScript

```typescript
export {
  RATE_LIMIT_POLICIES,
  getRateLimitPolicy,
  validateRateLimitPolicy,
  registerRateLimitPolicy,
  type RateLimitPolicy
} from './policies'

export {
  RateLimiter,
  createRateLimiter,
  type RateLimitResult,
  type RateLimitIdentifier
} from './limiter'

```

---

### limiter.ts

**Path:** `src\rate-limit\limiter.ts`

**Language:** TypeScript

```typescript
import { CacheClient } from '@firm/cache'
import { RateLimitPolicy, getRateLimitPolicy } from './policies'

/**
 * Rate limit result interface
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean
  /** Number of requests remaining in the window */
  remaining: number
  /** Time when the window resets (Unix timestamp) */
  resetTime: number
  /** Time until reset in seconds */
  retryAfter?: number
  /** Policy that was applied */
  policy: RateLimitPolicy
}

/**
 * Rate limit identifier types
 */
export type RateLimitIdentifier = {
  /** IP address for anonymous requests */
  ip?: string
  /** User ID for authenticated requests */
  userId?: string
  /** Email for sensitive operations */
  email?: string
  /** API key for service requests */
  apiKey?: string
  /** Custom identifier */
  custom?: string
}

/**
 * Rate limiter class using Redis-backed token bucket
 */
export class RateLimiter {
  constructor(
    private readonly cache: CacheClient,
    private readonly keyPrefix = 'rate-limit'
  ) {}

  /**
   * Generate cache key for rate limit
   */
  private generateKey(
    policyName: string,
    identifier: RateLimitIdentifier,
    window: number
  ): string {
    const windowStart = Math.floor(Date.now() / (window * 1000)) * (window * 1000)
    const keyParts = [this.keyPrefix, policyName]
    
    if (identifier.userId) keyParts.push(`user:${identifier.userId}`)
    else if (identifier.email) keyParts.push(`email:${identifier.email}`)
    else if (identifier.apiKey) keyParts.push(`key:${identifier.apiKey}`)
    else if (identifier.ip) keyParts.push(`ip:${identifier.ip}`)
    else if (identifier.custom) keyParts.push(`custom:${identifier.custom}`)
    
    keyParts.push(`window:${windowStart}`)
    
    return keyParts.join(':')
  }

  /**
   * Check rate limit for a request
   */
  async checkLimit(
    policyName: string,
    identifier: RateLimitIdentifier
  ): Promise<RateLimitResult> {
    const policy = getRateLimitPolicy(policyName)
    if (!policy) {
      throw new Error(`Unknown rate limit policy: ${policyName}`)
    }

    const key = this.generateKey(policyName, identifier, policy.window)
    const now = Date.now()
    const windowEnd = Math.floor(now / (policy.window * 1000)) * (policy.window * 1000) + (policy.window * 1000)

    // Get current count
    const currentCount = await this.cache.get<number>(key) || 0

    // Check if limit exceeded
    const allowed = currentCount < policy.limit
    const remaining = Math.max(0, policy.limit - currentCount - (allowed ? 1 : 0))
    const retryAfter = allowed ? undefined : Math.ceil((windowEnd - now) / 1000)

    // Increment count if allowed
    if (allowed) {
      const ttl = Math.ceil(policy.window * 1.1) // Add 10% buffer
      await this.cache.set(key, currentCount + 1, { ttl })
    }

    return {
      allowed,
      remaining,
      resetTime: windowEnd,
      retryAfter,
      policy
    }
  }

  /**
   * Reset rate limit for a specific identifier
   */
  async resetLimit(
    policyName: string,
    identifier: RateLimitIdentifier
  ): Promise<void> {
    const policy = getRateLimitPolicy(policyName)
    if (!policy) {
      throw new Error(`Unknown rate limit policy: ${policyName}`)
    }

    const key = this.generateKey(policyName, identifier, policy.window)
    await this.cache.delete(key)
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getStatus(
    policyName: string,
    identifier: RateLimitIdentifier
  ): Promise<Omit<RateLimitResult, 'allowed' | 'retryAfter'>> {
    const policy = getRateLimitPolicy(policyName)
    if (!policy) {
      throw new Error(`Unknown rate limit policy: ${policyName}`)
    }

    const key = this.generateKey(policyName, identifier, policy.window)
    const now = Date.now()
    const windowEnd = Math.floor(now / (policy.window * 1000)) * (policy.window * 1000) + (policy.window * 1000)

    const currentCount = await this.cache.get<number>(key) || 0
    const remaining = Math.max(0, policy.limit - currentCount)

    return {
      remaining,
      resetTime: windowEnd,
      policy
    }
  }

  /**
   * Clean up expired rate limit entries
   */
  async cleanup(): Promise<void> {
    // Redis TTL handles automatic cleanup
    // This method can be used for manual cleanup if needed
  }
}

/**
 * Create a rate limiter instance
 */
export function createRateLimiter(cache: CacheClient, keyPrefix?: string): RateLimiter {
  return new RateLimiter(cache, keyPrefix)
}

```

---

### policies.ts

**Path:** `src\rate-limit\policies.ts`

**Language:** TypeScript

```typescript
/**
 * Rate limit policy configuration
 */
export interface RateLimitPolicy {
  /** Number of requests allowed */
  limit: number
  /** Time window in seconds */
  window: number
  /** Policy name for identification */
  name: string
  /** Description of what this policy protects */
  description?: string
}

/**
 * Predefined rate limit policies
 */
export const RATE_LIMIT_POLICIES: Record<string, RateLimitPolicy> = {
  // Authentication endpoints
  'auth-login': {
    name: 'auth-login',
    limit: 5,
    window: 300, // 5 minutes
    description: 'Login attempts per IP'
  },
  'auth-register': {
    name: 'auth-register',
    limit: 3,
    window: 3600, // 1 hour
    description: 'Registration attempts per IP'
  },
  'auth-password-reset': {
    name: 'auth-password-reset',
    limit: 3,
    window: 3600, // 1 hour
    description: 'Password reset requests per email'
  },

  // API endpoints
  'api-general': {
    name: 'api-general',
    limit: 100,
    window: 60, // 1 minute
    description: 'General API requests per authenticated user'
  },
  'api-upload': {
    name: 'api-upload',
    limit: 10,
    window: 60, // 1 minute
    description: 'File upload requests per user'
  },
  'api-search': {
    name: 'api-search',
    limit: 30,
    window: 60, // 1 minute
    description: 'Search requests per user'
  },

  // Form submissions
  'form-contact': {
    name: 'form-contact',
    limit: 5,
    window: 3600, // 1 hour
    description: 'Contact form submissions per IP'
  },
  'form-lead': {
    name: 'form-lead',
    limit: 20,
    window: 3600, // 1 hour
    description: 'Lead form submissions per IP'
  },

  // Webhook endpoints
  'webhook-ingest': {
    name: 'webhook-ingest',
    limit: 1000,
    window: 60, // 1 minute
    description: 'Webhook ingestion per source'
  },

  // Admin endpoints
  'admin-export': {
    name: 'admin-export',
    limit: 2,
    window: 3600, // 1 hour
    description: 'Data export requests per admin'
  },
  'admin-bulk': {
    name: 'admin-bulk',
    limit: 5,
    window: 3600, // 1 hour
    description: 'Bulk operations per admin'
  }
}

/**
 * Get a rate limit policy by name
 */
export function getRateLimitPolicy(name: string): RateLimitPolicy | undefined {
  return RATE_LIMIT_POLICIES[name]
}

/**
 * Validate a rate limit policy configuration
 */
export function validateRateLimitPolicy(policy: RateLimitPolicy): boolean {
  return (
    typeof policy.name === 'string' &&
    policy.name.length > 0 &&
    typeof policy.limit === 'number' &&
    policy.limit > 0 &&
    typeof policy.window === 'number' &&
    policy.window > 0
  )
}

/**
 * Register a custom rate limit policy
 */
export function registerRateLimitPolicy(policy: RateLimitPolicy): void {
  if (!validateRateLimitPolicy(policy)) {
    throw new Error(`Invalid rate limit policy: ${policy.name}`)
  }
  
  RATE_LIMIT_POLICIES[policy.name] = policy
}

```

---

### index.ts

**Path:** `src\tags\index.ts`

**Language:** TypeScript

```typescript
export {
  TagRegistry,
  createTagRegistry,
  DEFAULT_TAGS,
  type ScriptTag
} from './registry'

```

---

### registry.ts

**Path:** `src\tags\registry.ts`

**Language:** TypeScript

```typescript
/**
 * Third-party script tag configuration
 */
export interface ScriptTag {
  /** Unique identifier for the script */
  id: string
  /** Script source URL */
  src: string
  /** Script category for consent management */
  category: 'necessary' | 'analytics' | 'marketing' | 'functional'
  /** Script name for display */
  name: string
  /** Script description */
  description?: string
  /** Whether script requires async loading */
  async?: boolean
  /** Whether script requires defer loading */
  defer?: boolean
  /** Integrity hash for SRI */
  integrity?: string
  /** Crossorigin attribute */
  crossorigin?: 'anonymous' | 'use-credentials'
  /** Script version */
  version?: string
  /** Required consent categories */
  requiredConsent?: string[]
}

/**
 * Tag registry for managing third-party scripts
 */
export class TagRegistry {
  private tags = new Map<string, ScriptTag>()
  private consentMappings = new Map<string, Set<string>>()

  /**
   * Register a new script tag
   */
  register(tag: ScriptTag): void {
    if (!tag.id || typeof tag.id !== 'string') {
      throw new Error('Script tag must have a valid id')
    }

    if (!tag.src || typeof tag.src !== 'string') {
      throw new Error('Script tag must have a valid src')
    }

    if (!this.isValidCategory(tag.category)) {
      throw new Error(`Invalid category: ${tag.category}`)
    }

    this.tags.set(tag.id, tag)

    // Update consent mappings
    const consentCategories = tag.requiredConsent || [tag.category]
    for (const category of consentCategories) {
      if (!this.consentMappings.has(category)) {
        this.consentMappings.set(category, new Set())
      }
      this.consentMappings.get(category)!.add(tag.id)
    }
  }

  /**
   * Get a script tag by ID
   */
  get(id: string): ScriptTag | undefined {
    return this.tags.get(id)
  }

  /**
   * Check if a tag is registered
   */
  has(id: string): boolean {
    return this.tags.has(id)
  }

  /**
   * Get all registered tags
   */
  getAll(): ScriptTag[] {
    return Array.from(this.tags.values())
  }

  /**
   * Get tags by category
   */
  getByCategory(category: string): ScriptTag[] {
    return this.getAll().filter(tag => tag.category === category)
  }

  /**
   * Get tags that require specific consent
   */
  getByConsent(consentCategory: string): ScriptTag[] {
    const tagIds = this.consentMappings.get(consentCategory)
    if (!tagIds) return []

    return Array.from(tagIds)
      .map(id => this.tags.get(id))
      .filter((tag): tag is ScriptTag => tag !== undefined)
  }

  /**
   * Remove a tag from registry
   */
  remove(id: string): boolean {
    const tag = this.tags.get(id)
    if (!tag) return false

    this.tags.delete(id)

    // Update consent mappings
    const consentCategories = tag.requiredConsent || [tag.category]
    for (const category of consentCategories) {
      const tagIds = this.consentMappings.get(category)
      if (tagIds) {
        tagIds.delete(id)
        if (tagIds.size === 0) {
          this.consentMappings.delete(category)
        }
      }
    }

    return true
  }

  /**
   * Validate tag configuration
   */
  validate(tag: Partial<ScriptTag>): boolean {
    return (
      typeof tag.id === 'string' &&
      tag.id.length > 0 &&
      typeof tag.src === 'string' &&
      tag.src.length > 0 &&
      this.isValidCategory(tag.category)
    )
  }

  /**
   * Get consent categories for a tag
   */
  getConsentCategories(id: string): string[] {
    const tag = this.tags.get(id)
    if (!tag) return []

    return tag.requiredConsent || [tag.category]
  }

  /**
   * Check if tag requires consent
   */
  requiresConsent(id: string, consentCategory: string): boolean {
    const categories = this.getConsentCategories(id)
    return categories.includes(consentCategory)
  }

  /**
   * Export registry configuration
   */
  export(): Record<string, ScriptTag> {
    const exported: Record<string, ScriptTag> = {}
    for (const [id, tag] of this.tags) {
      exported[id] = { ...tag }
    }
    return exported
  }

  /**
   * Import registry configuration
   */
  import(config: Record<string, ScriptTag>): void {
    for (const tag of Object.values(config)) {
      this.register(tag)
    }
  }

  /**
   * Clear all tags
   */
  clear(): void {
    this.tags.clear()
    this.consentMappings.clear()
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    total: number
    byCategory: Record<string, number>
    byConsent: Record<string, number>
  } {
    const byCategory: Record<string, number> = {}
    const byConsent: Record<string, number> = {}

    for (const tag of this.tags.values()) {
      byCategory[tag.category] = (byCategory[tag.category] || 0) + 1

      const consentCategories = tag.requiredConsent || [tag.category]
      for (const category of consentCategories) {
        byConsent[category] = (byConsent[category] || 0) + 1
      }
    }

    return {
      total: this.tags.size,
      byCategory,
      byConsent
    }
  }

  private isValidCategory(category: string): category is ScriptTag['category'] {
    return ['necessary', 'analytics', 'marketing', 'functional'].includes(category)
  }
}

/**
 * Create a new tag registry instance
 */
export function createTagRegistry(): TagRegistry {
  return new TagRegistry()
}

/**
 * Default script tags for common third-party services
 */
export const DEFAULT_TAGS: Record<string, ScriptTag> = {
  'google-analytics': {
    id: 'google-analytics',
    src: 'https://www.googletagmanager.com/gtag/js',
    category: 'analytics',
    name: 'Google Analytics',
    description: 'Google Analytics for website analytics',
    async: true
  },
  'google-tag-manager': {
    id: 'google-tag-manager',
    src: 'https://www.googletagmanager.com/gtm.js',
    category: 'marketing',
    name: 'Google Tag Manager',
    description: 'Google Tag Manager for tag management',
    async: true
  },
  'facebook-pixel': {
    id: 'facebook-pixel',
    src: 'https://connect.facebook.net/en_US/fbevents.js',
    category: 'marketing',
    name: 'Facebook Pixel',
    description: 'Facebook Pixel for advertising analytics',
    defer: true
  },
  'hotjar': {
    id: 'hotjar',
    src: 'https://static.hotjar.com/c/hotjar-',
    category: 'analytics',
    name: 'Hotjar',
    description: 'Hotjar for user behavior analytics',
    async: true
  }
}

```

---

### index.ts

**Path:** `src\turnstile\index.ts`

**Language:** TypeScript

```typescript
export {
  verifyTurnstile,
  createTurnstileVerifier,
  validateTurnstileConfig,
  TurnstileError,
  type TurnstileResponse,
  type TurnstileErrorCode,
  type TurnstileVerifyOptions
} from './verify'

```

---

### verify.ts

**Path:** `src\turnstile\verify.ts`

**Language:** TypeScript

```typescript
/**
 * Turnstile verification response from Cloudflare API
 */
export interface TurnstileResponse {
  success: boolean
  'error-codes'?: TurnstileErrorCode[]
  hostname?: string
  challenge_ts?: string
}

/**
 * Turnstile error codes
 */
export type TurnstileErrorCode =
  | 'missing-input-secret'
  | 'invalid-input-secret'
  | 'missing-input-response'
  | 'invalid-input-response'
  | 'bad-request'
  | 'timeout-or-duplicate'
  | 'internal-error'

/**
 * Turnstile verification options
 */
export interface TurnstileVerifyOptions {
  /** Cloudflare Turnstile secret key */
  secretKey: string
  /** Remote IP address for additional validation */
  remoteIp?: string
  /** Request timeout in milliseconds */
  timeout?: number
}

/**
 * Turnstile verification error
 */
export class TurnstileError extends Error {
  constructor(
    message: string,
    public readonly code: TurnstileErrorCode,
    public readonly originalError?: Error
  ) {
    super(message)
    this.name = 'TurnstileError'
  }
}

/**
 * Verify Cloudflare Turnstile token
 */
export async function verifyTurnstile(
  token: string,
  options: TurnstileVerifyOptions
): Promise<TurnstileResponse> {
  const { secretKey, remoteIp, timeout = 5000 } = options

  if (!token) {
    throw new TurnstileError(
      'Turnstile token is required',
      'missing-input-response'
    )
  }

  if (!secretKey) {
    throw new TurnstileError(
      'Turnstile secret key is required',
      'missing-input-secret'
    )
  }

  const formData = new URLSearchParams({
    secret: secretKey,
    response: token
  })

  if (remoteIp) {
    formData.append('remoteip', remoteIp)
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      signal: AbortSignal.timeout(timeout)
    })

    if (!response.ok) {
      throw new TurnstileError(
        `HTTP error: ${response.status} ${response.statusText}`,
        'bad-request'
      )
    }

    const result = await response.json() as TurnstileResponse

    if (!result.success && result['error-codes']) {
      const errorCode = result['error-codes'][0]
      throw new TurnstileError(
        `Turnstile verification failed: ${errorCode}`,
        errorCode
      )
    }

    return result
  } catch (error) {
    if (error instanceof TurnstileError) {
      throw error
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new TurnstileError(
          'Turnstile verification timeout',
          'timeout-or-duplicate',
          error
        )
      }

      throw new TurnstileError(
        `Turnstile verification failed: ${error.message}`,
        'internal-error',
        error
      )
    }

    throw new TurnstileError(
      'Unknown Turnstile verification error',
      'internal-error'
    )
  }
}

/**
 * Turnstile verification middleware helper
 */
export function createTurnstileVerifier(options: TurnstileVerifyOptions) {
  return {
    /**
     * Verify a Turnstile token
     */
    verify: (token: string, remoteIp?: string) => 
      verifyTurnstile(token, {
        ...options,
        remoteIp: remoteIp || options.remoteIp
      }),

    /**
     * Extract token from request headers or body
     */
    extractToken: (headers: Record<string, string>, body?: Record<string, any>): string | undefined => {
      // Try authorization header first
      const authHeader = headers['authorization'] || headers['x-turnstile-token']
      if (authHeader) {
        // Remove "Bearer " prefix if present
        return authHeader.replace(/^Bearer\s+/i, '')
      }

      // Try body
      if (body?.['turnstile-token'] || body?.['cf-turnstile-response']) {
        return body['turnstile-token'] || body['cf-turnstile-response']
      }

      return undefined
    },

    /**
     * Get client IP from request
     */
    getClientIp: (headers: Record<string, string>): string | undefined => {
      return headers['x-forwarded-for'] ||
             headers['x-real-ip'] ||
             headers['cf-connecting-ip'] ||
             headers['x-client-ip']
    }
  }
}

/**
 * Validate Turnstile configuration
 */
export function validateTurnstileConfig(options: TurnstileVerifyOptions): boolean {
  return (
    typeof options.secretKey === 'string' &&
    options.secretKey.length > 0 &&
    (!options.timeout || typeof options.timeout === 'number' && options.timeout > 0)
  )
}

```

---

### csp.test.ts

**Path:** `tests\csp.test.ts`

**Language:** TypeScript

```typescript
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

```

---

### csrf.test.ts

**Path:** `tests\csrf.test.ts`

**Language:** TypeScript

```typescript
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

```

---

### rate-limit.test.ts

**Path:** `tests\rate-limit.test.ts`

**Language:** TypeScript

```typescript
import { describe, it, expect, vi } from 'vitest'
import { getRateLimitPolicy, validateRateLimitPolicy, registerRateLimitPolicy, RATE_LIMIT_POLICIES } from '../src/rate-limit'

describe('Rate Limit Policies', () => {
  it('should get existing policy', () => {
    const policy = getRateLimitPolicy('auth-login')
    expect(policy).toBeDefined()
    expect(policy?.name).toBe('auth-login')
    expect(policy?.limit).toBe(5)
    expect(policy?.window).toBe(300)
  })

  it('should return undefined for unknown policy', () => {
    const policy = getRateLimitPolicy('unknown-policy')
    expect(policy).toBeUndefined()
  })

  it('should validate policy configuration', () => {
    const validPolicy = {
      name: 'test-policy',
      limit: 10,
      window: 60,
      description: 'Test policy'
    }
    expect(validateRateLimitPolicy(validPolicy)).toBe(true)
  })

  it('should reject invalid policy configuration', () => {
    const invalidPolicy = {
      name: '',
      limit: -1,
      window: 0
    }
    expect(validateRateLimitPolicy(invalidPolicy)).toBe(false)
  })

  it('should register custom policy', () => {
    const customPolicy = {
      name: 'custom-test',
      limit: 15,
      window: 120,
      description: 'Custom test policy'
    }
    
    registerRateLimitPolicy(customPolicy)
    const retrieved = getRateLimitPolicy('custom-test')
    expect(retrieved).toEqual(customPolicy)
  })

  it('should throw error for invalid custom policy', () => {
    const invalidPolicy = {
      name: '',
      limit: -1,
      window: 0
    }
    
    expect(() => registerRateLimitPolicy(invalidPolicy)).toThrow('Invalid rate limit policy')
  })

  it('should have all required default policies', () => {
    const requiredPolicies = [
      'auth-login',
      'auth-register',
      'auth-password-reset',
      'api-general',
      'api-upload',
      'api-search',
      'form-contact',
      'form-lead',
      'webhook-ingest',
      'admin-export',
      'admin-bulk'
    ]

    requiredPolicies.forEach(policyName => {
      expect(RATE_LIMIT_POLICIES[policyName]).toBeDefined()
      expect(validateRateLimitPolicy(RATE_LIMIT_POLICIES[policyName])).toBe(true)
    })
  })
})

```

---

### tsup.config.ts

**Path:** `tsup.config.ts`

**Language:** TypeScript

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'csp': 'src/csp/index.ts',
    'headers': 'src/headers/index.ts',
    'rate-limit': 'src/rate-limit/index.ts',
    'turnstile': 'src/turnstile/index.ts',
    'tags': 'src/tags/index.ts',
    'csrf': 'src/csrf/index.ts',
    'audit': 'src/audit/index.ts'
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: ['@firm/cache', '@firm/crypto', '@firm/types', '@firm/utils']
})

```

---

