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
