/**
 * Base error class for all Firm platform errors.
 * Implements RFC 9457 Problem Details for HTTP APIs.
 */
export abstract class FirmError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly context?: Record<string, unknown>;
  public readonly category: ErrorCategory;
  public readonly timestamp: string;
  public readonly requestId?: string;
  public override cause?: Error;

  constructor(
    category: ErrorCategory,
    code: string,
    message: string,
    status: number,
    context?: Record<string, unknown>,
    requestId?: string,
    cause?: Error,
  ) {
    super(message);
    this.cause = cause;
    this.name = (this.constructor as any).name;
    this.category = category;
    this.code = code;
    this.status = status;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.requestId = requestId;

    // Ensure instanceof works correctly
    if (typeof Object.setPrototypeOf === 'function') {
      Object.setPrototypeOf(this, (this.constructor as any).prototype);
    }
  }

  /**
   * Convert error to RFC 9457 Problem Details object.
   */
  toProblemDetails(): ProblemDetails {
    return {
      type: `https://api.firm.com/errors/${this.code}`,
      title: this.getHumanReadableTitle(),
      detail: this.message,
      status: this.status,
      instance: this.requestId,
      timestamp: this.timestamp,
      ...(this.context && { extensions: this.context }),
    };
  }

  /**
   * Get human-readable title for the error type.
   */
  protected abstract getHumanReadableTitle(): string;

  /**
   * Check if this error matches a specific code.
   */
  protected isCode(code: string): boolean {
    return this.code === code;
  }

  /**
   * Check if this error belongs to a specific category.
   */
  isCategory(category: ErrorCategory): boolean {
    return this.category === category;
  }
}

/**
 * RFC 9457 Problem Details interface.
 */
export interface ProblemDetails {
  type: string;
  title: string;
  detail: string;
  status: number;
  instance?: string;
  timestamp?: string;
  extensions?: Record<string, unknown>;
}

/**
 * Error categories for grouping related errors.
 */
export type ErrorCategory = 
  | 'ValidationError'
  | 'AuthenticationError'
  | 'AuthorizationError'
  | 'NotFoundError'
  | 'RateLimitExceededError'
  | 'ConfigValidationError'
  | 'DatabaseConnectionError'
  | 'CrossTenantAccessError'
  | 'WebhookSignatureError'
  | 'AiQuotaExceededError'
  | 'ConsentError'
  | 'PaymentError'
  | 'IntegrationError';

/**
 * Error codes as string constants for type safety.
 */
export const ERROR_CODES = {
  // Validation errors (400)
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',

  // Authentication errors (401)
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  MFA_REQUIRED: 'MFA_REQUIRED',
  MFA_INVALID: 'MFA_INVALID',

  // Authorization errors (403)
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  CROSS_TENANT_ACCESS: 'CROSS_TENANT_ACCESS',
  RESOURCE_ACCESS_DENIED: 'RESOURCE_ACCESS_DENIED',

  // Not found errors (404)
  NOT_FOUND: 'NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',

  // Rate limiting errors (429)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  CONCURRENT_LIMIT_EXCEEDED: 'CONCURRENT_LIMIT_EXCEEDED',

  // Server errors (500)
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_CONNECTION_FAILED: 'DATABASE_CONNECTION_FAILED',
  CONFIG_VALIDATION_FAILED: 'CONFIG_VALIDATION_FAILED',
  WEBHOOK_SIGNATURE_INVALID: 'WEBHOOK_SIGNATURE_INVALID',
  AI_QUOTA_EXCEEDED: 'AI_QUOTA_EXCEEDED',

  // Business logic errors (422)
  CONSENT_REQUIRED: 'CONSENT_REQUIRED',
  CONSENT_WITHDRAWN: 'CONSENT_WITHDRAWN',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_DECLINED: 'PAYMENT_DECLINED',
  INTEGRATION_FAILED: 'INTEGRATION_FAILED',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
