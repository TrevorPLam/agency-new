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
