# firm-errors

Generated on: 2026-05-13T02:25:38.584Z
Total files: 11

**Description:** Typed error hierarchy for Firm platform with RFC 9457 serialization

**Version:** 1.0.0

## Table of Contents

- [auth-error.ts](#auth-error-ts)
- [authorization-error.ts](#authorization-error-ts)
- [business-error.ts](#business-error-ts)
- [not-found-error.ts](#not-found-error-ts)
- [rate-limit-error.ts](#rate-limit-error-ts)
- [server-error.ts](#server-error-ts)
- [validation-error.ts](#validation-error-ts)
- [firm-error.ts](#firm-error-ts)
- [index.ts](#index-ts)
- [utils.ts](#utils-ts)
- [firm-error.test.ts](#firm-error-test-ts)

## File Contents

### auth-error.ts

**Path:** `src\errors\auth-error.ts`

**Language:** TypeScript

```typescript
import { FirmError, ERROR_CODES } from '../firm-error';

/**
 * Error thrown when authentication fails.
 */
export class AuthenticationError extends FirmError {
  constructor(
    message: string = 'Authentication failed',
    context?: Record<string, unknown>,
    requestId?: string,
    cause?: Error,
  ) {
    super(
      'AuthenticationError',
      ERROR_CODES.UNAUTHORIZED,
      message,
      401,
      context,
      requestId,
      cause,
    );
  }

  protected getHumanReadableTitle(): string {
    return 'Authentication Failed';
  }
}

/**
 * Error thrown when credentials are invalid.
 */
export class InvalidCredentialsError extends FirmError {
  constructor(
    message: string = 'Invalid credentials provided',
    context?: Record<string, unknown>,
    requestId?: string,
    cause?: Error,
  ) {
    super(
      'AuthenticationError',
      ERROR_CODES.INVALID_CREDENTIALS,
      message,
      401,
      context,
      requestId,
      cause,
    );
  }

  protected getHumanReadableTitle(): string {
    return 'Invalid Credentials';
  }
}

/**
 * Error thrown when token has expired.
 */
export class TokenExpiredError extends FirmError {
  constructor(
    message: string = 'Authentication token has expired',
    context?: Record<string, unknown>,
    requestId?: string,
    cause?: Error,
  ) {
    super(
      'AuthenticationError',
      ERROR_CODES.TOKEN_EXPIRED,
      message,
      401,
      context,
      requestId,
      cause,
    );
  }

  protected getHumanReadableTitle(): string {
    return 'Token Expired';
  }
}

/**
 * Error thrown when token is invalid.
 */
export class TokenInvalidError extends FirmError {
  constructor(
    message: string = 'Authentication token is invalid',
    context?: Record<string, unknown>,
    requestId?: string,
    cause?: Error,
  ) {
    super(
      'AuthenticationError',
      ERROR_CODES.TOKEN_INVALID,
      message,
      401,
      context,
      requestId,
      cause,
    );
  }

  protected getHumanReadableTitle(): string {
    return 'Invalid Token';
  }
}

/**
 * Error thrown when session has expired.
 */
export class SessionExpiredError extends FirmError {
  constructor(
    message: string = 'User session has expired',
    context?: Record<string, unknown>,
    requestId?: string,
    cause?: Error,
  ) {
    super(
      'AuthenticationError',
      ERROR_CODES.SESSION_EXPIRED,
      message,
      401,
      context,
      requestId,
      cause,
    );
  }

  protected getHumanReadableTitle(): string {
    return 'Session Expired';
  }
}

/**
 * Error thrown when MFA is required.
 */
export class MFARequiredError extends FirmError {
  constructor(
    message: string = 'Multi-factor authentication is required',
    context?: Record<string, unknown>,
    requestId?: string,
    cause?: Error,
  ) {
    super(
      'AuthenticationError',
      ERROR_CODES.MFA_REQUIRED,
      message,
      401,
      context,
      requestId,
      cause,
    );
  }

  protected getHumanReadableTitle(): string {
    return 'MFA Required';
  }
}

/**
 * Error thrown when MFA code is invalid.
 */
export class MFAInvalidError extends FirmError {
  constructor(
    message: string = 'Invalid multi-factor authentication code',
    context?: Record<string, unknown>,
    requestId?: string,
    cause?: Error,
  ) {
    super(
      'AuthenticationError',
      ERROR_CODES.MFA_INVALID,
      message,
      401,
      context,
      requestId,
      cause,
    );
  }

  protected getHumanReadableTitle(): string {
    return 'Invalid MFA Code';
  }
}

```

---

### authorization-error.ts

**Path:** `src\errors\authorization-error.ts`

**Language:** TypeScript

```typescript
import { FirmError, ERROR_CODES } from '../firm-error';

/**
 * Error thrown when authorization fails.
 */
export class AuthorizationError extends FirmError {
  constructor(
    message: string = 'Access is forbidden',
    context?: Record<string, unknown>,
    requestId?: string,
    cause?: Error,
  ) {
    super(
      ERROR_CODES.FORBIDDEN,
      message,
      403,
      context,
      requestId,
      cause,
    );
  }

  protected getHumanReadableTitle(): string {
    return 'Access Forbidden';
  }
}

/**
 * Error thrown when user has insufficient permissions.
 */
export class InsufficientPermissionsError extends FirmError {
  constructor(
    requiredPermission: string,
    context?: Record<string, unknown>,
    requestId?: string,
  ) {
    super(
      ERROR_CODES.INSUFFICIENT_PERMISSIONS,
      `Insufficient permissions. Required: ${requiredPermission}`,
      403,
      { ...context, requiredPermission },
      requestId,
    );
  }

  protected getHumanReadableTitle(): string {
    return 'Insufficient Permissions';
  }
}

/**
 * Error thrown when cross-tenant access is attempted.
 */
export class CrossTenantAccessError extends FirmError {
  constructor(
    targetTenant: string,
    currentTenant: string,
    context?: Record<string, unknown>,
    requestId?: string,
  ) {
    super(
      ERROR_CODES.CROSS_TENANT_ACCESS,
      `Cannot access tenant '${targetTenant}' from tenant '${currentTenant}'`,
      403,
      { ...context, targetTenant, currentTenant },
      requestId,
    );
  }

  protected getHumanReadableTitle(): string {
    return 'Cross-Tenant Access';
  }
}

/**
 * Error thrown when resource access is denied.
 */
export class ResourceAccessDeniedError extends FirmError {
  constructor(
    resource: string,
    reason?: string,
    context?: Record<string, unknown>,
    requestId?: string,
  ) {
    super(
      ERROR_CODES.RESOURCE_ACCESS_DENIED,
      `Access denied to resource: ${resource}${reason ? ` (${reason})` : ''}`,
      403,
      { ...context, resource, reason },
      requestId,
    );
  }

  protected getHumanReadableTitle(): string {
    return 'Resource Access Denied';
  }
}

```

---

### business-error.ts

**Path:** `src\errors\business-error.ts`

**Language:** TypeScript

```typescript
import { FirmError, ERROR_CODES } from '../firm-error';

/**
 * Error thrown when consent is required.
 */
export class ConsentRequiredError extends FirmError {
  constructor(
    consentType: string,
    context?: Record<string, unknown>,
    requestId?: string,
    cause?: Error,
  ) {
    super(
      ERROR_CODES.CONSENT_REQUIRED,
      `Consent is required for: ${consentType}`,
      422,
      { ...context, consentType },
      requestId,
      cause,
    );
  }

  protected getHumanReadableTitle(): string {
    return 'Consent Required';
  }
}

/**
 * Error thrown when consent has been withdrawn.
 */
export class ConsentWithdrawnError extends FirmError {
  constructor(
    consentType: string,
    context?: Record<string, unknown>,
    requestId?: string,
    cause?: Error,
  ) {
    super(
      ERROR_CODES.CONSENT_WITHDRAWN,
      `Consent has been withdrawn for: ${consentType}`,
      422,
      { ...context, consentType },
      requestId,
      cause,
    );
  }

  protected getHumanReadableTitle(): string {
    return 'Consent Withdrawn';
  }
}

/**
 * Error thrown when payment fails.
 */
export class PaymentFailedError extends FirmError {
  constructor(
    paymentId: string,
    reason: string,
    context?: Record<string, unknown>,
    requestId?: string,
    cause?: Error,
  ) {
    super(
      ERROR_CODES.PAYMENT_FAILED,
      `Payment failed for ID '${paymentId}': ${reason}`,
      422,
      { ...context, paymentId, reason },
      requestId,
      cause,
    );
  }

  protected getHumanReadableTitle(): string {
    return 'Payment Failed';
  }
}

/**
 * Error thrown when payment is declined.
 */
export class PaymentDeclinedError extends FirmError {
  constructor(
    paymentId: string,
    declineReason: string,
    context?: Record<string, unknown>,
    requestId?: string,
    cause?: Error,
  ) {
    super(
      ERROR_CODES.PAYMENT_DECLINED,
      `Payment declined for ID '${paymentId}': ${declineReason}`,
      422,
      { ...context, paymentId, declineReason },
      requestId,
      cause,
    );
  }

  protected getHumanReadableTitle(): string {
    return 'Payment Declined';
  }
}

/**
 * Error thrown when integration fails.
 */
export class IntegrationFailedError extends FirmError {
  constructor(
    integrationName: string,
    error: string,
    context?: Record<string, unknown>,
    requestId?: string,
    cause?: Error,
  ) {
    super(
      ERROR_CODES.INTEGRATION_FAILED,
      `Integration '${integrationName}' failed: ${error}`,
      422,
      { ...context, integrationName, error },
      requestId,
      cause,
    );
  }

  protected getHumanReadableTitle(): string {
    return 'Integration Failed';
  }
}

```

---

### not-found-error.ts

**Path:** `src\errors\not-found-error.ts`

**Language:** TypeScript

```typescript
import { FirmError, ERROR_CODES } from '../firm-error';

/**
 * Error thrown when resource is not found.
 */
export class NotFoundError extends FirmError {
  constructor(
    message: string = 'Resource not found',
    context?: Record<string, unknown>,
    requestId?: string,
    cause?: Error,
  ) {
    super(
      ERROR_CODES.NOT_FOUND,
      message,
      404,
      context,
      requestId,
      cause,
    );
  }

  protected getHumanReadableTitle(): string {
    return 'Resource Not Found';
  }
}

/**
 * Error thrown when user is not found.
 */
export class UserNotFoundError extends FirmError {
  constructor(
    userId: string,
    context?: Record<string, unknown>,
    requestId?: string,
  ) {
    super(
      ERROR_CODES.USER_NOT_FOUND,
      `User with ID '${userId}' not found`,
      404,
      { ...context, userId },
      requestId,
    );
  }

  protected getHumanReadableTitle(): string {
    return 'User Not Found';
  }
}

/**
 * Error thrown when tenant is not found.
 */
export class TenantNotFoundError extends FirmError {
  constructor(
    tenantId: string,
    context?: Record<string, unknown>,
    requestId?: string,
  ) {
    super(
      ERROR_CODES.TENANT_NOT_FOUND,
      `Tenant with ID '${tenantId}' not found`,
      404,
      { ...context, tenantId },
      requestId,
    );
  }

  protected getHumanReadableTitle(): string {
    return 'Tenant Not Found';
  }
}

/**
 * Error thrown when specific resource is not found.
 */
export class ResourceNotFoundError extends FirmError {
  constructor(
    resourceType: string,
    resourceId: string,
    context?: Record<string, unknown>,
    requestId?: string,
  ) {
    super(
      ERROR_CODES.RESOURCE_NOT_FOUND,
      `${resourceType} with ID '${resourceId}' not found`,
      404,
      { ...context, resourceType, resourceId },
      requestId,
    );
  }

  protected getHumanReadableTitle(): string {
    return 'Resource Not Found';
  }
}

```

---

### rate-limit-error.ts

**Path:** `src\errors\rate-limit-error.ts`

**Language:** TypeScript

```typescript
import { FirmError, ERROR_CODES } from '../firm-error';

/**
 * Error thrown when rate limit is exceeded.
 */
export class RateLimitExceededError extends FirmError {
  constructor(
    limit: number,
    window: string,
    context?: Record<string, unknown>,
    requestId?: string,
  ) {
    super(
      ERROR_CODES.RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded. Maximum ${limit} requests per ${window}`,
      429,
      { ...context, limit, window },
      requestId,
    );
  }

  protected getHumanReadableTitle(): string {
    return 'Rate Limit Exceeded';
  }
}

/**
 * Error thrown when quota is exceeded.
 */
export class QuotaExceededError extends FirmError {
  constructor(
    quotaType: string,
    current: number,
    limit: number,
    context?: Record<string, unknown>,
    requestId?: string,
  ) {
    super(
      ERROR_CODES.QUOTA_EXCEEDED,
      `${quotaType} quota exceeded. Current: ${current}, Limit: ${limit}`,
      429,
      { ...context, quotaType, current, limit },
      requestId,
    );
  }

  protected getHumanReadableTitle(): string {
    return 'Quota Exceeded';
  }
}

/**
 * Error thrown when concurrent limit is exceeded.
 */
export class ConcurrentLimitExceededError extends FirmError {
  constructor(
    limit: number,
    current: number,
    context?: Record<string, unknown>,
    requestId?: string,
  ) {
    super(
      ERROR_CODES.CONCURRENT_LIMIT_EXCEEDED,
      `Concurrent limit exceeded. Current: ${current}, Limit: ${limit}`,
      429,
      { ...context, limit, current },
      requestId,
    );
  }

  protected getHumanReadableTitle(): string {
    return 'Concurrent Limit Exceeded';
  }
}

```

---

### server-error.ts

**Path:** `src\errors\server-error.ts`

**Language:** TypeScript

```typescript
import { FirmError, ERROR_CODES } from '../firm-error';

/**
 * Error thrown when internal server error occurs.
 */
export class InternalServerError extends FirmError {
  constructor(
    message: string = 'Internal server error occurred',
    context?: Record<string, unknown>,
    requestId?: string,
    cause?: Error,
  ) {
    super(
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      message,
      500,
      context,
      requestId,
      cause,
    );
  }

  protected getHumanReadableTitle(): string {
    return 'Internal Server Error';
  }
}

/**
 * Error thrown when database connection fails.
 */
export class DatabaseConnectionError extends FirmError {
  constructor(
    database: string,
    reason?: string,
    context?: Record<string, unknown>,
    requestId?: string,
    cause?: Error,
  ) {
    super(
      ERROR_CODES.DATABASE_CONNECTION_FAILED,
      `Database connection failed: ${database}${reason ? ` (${reason})` : ''}`,
      500,
      { ...context, database, reason },
      requestId,
      cause,
    );
  }

  protected getHumanReadableTitle(): string {
    return 'Database Connection Failed';
  }
}

/**
 * Error thrown when configuration validation fails.
 */
export class ConfigValidationError extends FirmError {
  constructor(
    configKey: string,
    validationError: string,
    context?: Record<string, unknown>,
    requestId?: string,
    cause?: Error,
  ) {
    super(
      ERROR_CODES.CONFIG_VALIDATION_FAILED,
      `Configuration validation failed for '${configKey}': ${validationError}`,
      500,
      { ...context, configKey, validationError },
      requestId,
      cause,
    );
  }

  protected getHumanReadableTitle(): string {
    return 'Configuration Validation Failed';
  }
}

/**
 * Error thrown when webhook signature is invalid.
 */
export class WebhookSignatureError extends FirmError {
  constructor(
    webhookType: string,
    reason: string,
    context?: Record<string, unknown>,
    requestId?: string,
    cause?: Error,
  ) {
    super(
      ERROR_CODES.WEBHOOK_SIGNATURE_INVALID,
      `Invalid webhook signature for ${webhookType}: ${reason}`,
      500,
      { ...context, webhookType, reason },
      requestId,
      cause,
    );
  }

  protected getHumanReadableTitle(): string {
    return 'Webhook Signature Invalid';
  }
}

/**
 * Error thrown when AI quota is exceeded.
 */
export class AiQuotaExceededError extends FirmError {
  constructor(
    quotaType: string,
    current: number,
    limit: number,
    context?: Record<string, unknown>,
    requestId?: string,
    cause?: Error,
  ) {
    super(
      ERROR_CODES.AI_QUOTA_EXCEEDED,
      `AI quota exceeded for ${quotaType}. Current: ${current}, Limit: ${limit}`,
      500,
      { ...context, quotaType, current, limit },
      requestId,
      cause,
    );
  }

  protected getHumanReadableTitle(): string {
    return 'AI Quota Exceeded';
  }
}

```

---

### validation-error.ts

**Path:** `src\errors\validation-error.ts`

**Language:** TypeScript

```typescript
import { FirmError, ERROR_CODES } from '../firm-error';

/**
 * Error thrown when input validation fails.
 */
export class ValidationError extends FirmError {
  constructor(
    message: string,
    context?: Record<string, unknown>,
    requestId?: string,
    cause?: Error,
  ) {
    super(
      ERROR_CODES.VALIDATION_FAILED,
      message,
      400,
      context,
      requestId,
      cause,
    );
  }

  protected getHumanReadableTitle(): string {
    return 'Validation Failed';
  }
}

/**
 * Error thrown when input format is invalid.
 */
export class InvalidInputError extends FirmError {
  constructor(
    message: string,
    context?: Record<string, unknown>,
    requestId?: string,
    cause?: Error,
  ) {
    super(
      ERROR_CODES.INVALID_INPUT,
      message,
      400,
      context,
      requestId,
      cause,
    );
  }

  protected getHumanReadableTitle(): string {
    return 'Invalid Input';
  }
}

/**
 * Error thrown when required field is missing.
 */
export class MissingRequiredFieldError extends FirmError {
  constructor(
    fieldName: string,
    context?: Record<string, unknown>,
    requestId?: string,
  ) {
    super(
      ERROR_CODES.MISSING_REQUIRED_FIELD,
      `Required field '${fieldName}' is missing`,
      400,
      { ...context, fieldName },
      requestId,
    );
  }

  protected getHumanReadableTitle(): string {
    return 'Missing Required Field';
  }
}

/**
 * Error thrown when input format is invalid.
 */
export class InvalidFormatError extends FirmError {
  constructor(
    field: string,
    expectedFormat: string,
    actualValue: string,
    context?: Record<string, unknown>,
    requestId?: string,
  ) {
    super(
      ERROR_CODES.INVALID_FORMAT,
      `Field '${field}' must be in ${expectedFormat} format, got: ${actualValue}`,
      400,
      { ...context, field, expectedFormat, actualValue },
      requestId,
    );
  }

  protected getHumanReadableTitle(): string {
    return 'Invalid Format';
  }
}

/**
 * Error thrown when database constraint is violated.
 */
export class ConstraintViolationError extends FirmError {
  constructor(
    constraint: string,
    context?: Record<string, unknown>,
    requestId?: string,
  ) {
    super(
      ERROR_CODES.CONSTRAINT_VIOLATION,
      `Database constraint violated: ${constraint}`,
      400,
      { ...context, constraint },
      requestId,
    );
  }

  protected getHumanReadableTitle(): string {
    return 'Constraint Violation';
  }
}

```

---

### firm-error.ts

**Path:** `src\firm-error.ts`

**Language:** TypeScript

```typescript
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

```

---

### index.ts

**Path:** `src\index.ts`

**Language:** TypeScript

```typescript
// Base error class and types
export type {
  ProblemDetails,
  ErrorCategory,
  ErrorCode,
} from './firm-error';
export {
  FirmError,
  ERROR_CODES,
} from './firm-error';

// Validation errors
export {
  ValidationError,
  InvalidInputError,
  MissingRequiredFieldError,
  InvalidFormatError,
  ConstraintViolationError,
} from './errors/validation-error';

// Authentication errors
export {
  AuthenticationError,
  InvalidCredentialsError,
  TokenExpiredError,
  TokenInvalidError,
  SessionExpiredError,
  MFARequiredError,
  MFAInvalidError,
} from './errors/auth-error';

// Authorization errors
export {
  AuthorizationError,
  InsufficientPermissionsError,
  CrossTenantAccessError,
  ResourceAccessDeniedError,
} from './errors/authorization-error';

// Not found errors
export {
  NotFoundError,
  UserNotFoundError,
  TenantNotFoundError,
  ResourceNotFoundError,
} from './errors/not-found-error';

// Rate limiting errors
export {
  RateLimitExceededError,
  QuotaExceededError,
  ConcurrentLimitExceededError,
} from './errors/rate-limit-error';

// Server and business logic errors
export {
  InternalServerError,
  DatabaseConnectionError,
  ConfigValidationError,
  WebhookSignatureError,
  AiQuotaExceededError,
} from './errors/server-error';

// Business logic errors
export {
  ConsentRequiredError,
  ConsentWithdrawnError,
  PaymentFailedError,
  PaymentDeclinedError,
  IntegrationFailedError,
} from './errors/business-error';

import type { FirmError, ProblemDetails } from './firm-error';

/**
 * Utility function to create RFC 9457 Problem Details response.
 */
export function createProblemDetails(
  error: FirmError,
  instance?: string,
): ProblemDetails {
  return {
    ...error.toProblemDetails(),
    instance,
  };
}

// Re-export utility functions from separate module
export { isFirmError, getErrorCode, getErrorStatus } from './utils';

```

---

### utils.ts

**Path:** `src\utils.ts`

**Language:** TypeScript

```typescript
import { FirmError } from './firm-error';

/**
 * Utility function to check if error is a specific type.
 */
export function isFirmError(error: unknown): error is FirmError {
  return error instanceof FirmError;
}

/**
 * Utility function to get error code from unknown error.
 */
export function getErrorCode(error: unknown): string | null {
  if (isFirmError(error)) {
    return (error as FirmError).code;
  }
  return null;
}

/**
 * Utility function to get error status from unknown error.
 */
export function getErrorStatus(error: unknown): number | null {
  if (isFirmError(error)) {
    return (error as FirmError).status;
  }
  return null;
}

```

---

### firm-error.test.ts

**Path:** `tests\firm-error.test.ts`

**Language:** TypeScript

```typescript
import { describe, it, expect } from 'vitest';
import { 
  ValidationError, 
  NotFoundError, 
  RateLimitExceededError,
  AuthenticationError,
  AuthorizationError,
  InternalServerError,
  FirmError,
  ERROR_CODES, 
  createProblemDetails, 
  isFirmError, 
  getErrorCode, 
  getErrorStatus 
} from '../src';

describe('ValidationError', () => {
  it('creates a validation error with required fields', () => {
    const error = new ValidationError('Test validation error');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.name).toBe('ValidationError');
    expect(error.code).toBe(ERROR_CODES.VALIDATION_FAILED);
    expect(error.message).toBe('Test validation error');
    expect(error.status).toBe(400);
  });

  it('accepts optional context and cause', () => {
    const originalError = new Error('Original error');
    const context = { userId: '123', action: 'create' };
    
    const error = new ValidationError('Validation failed', context, undefined, originalError);

    expect(error.context).toEqual(context);
    expect(error.cause).toBe(originalError);
  });

  it('generates correct problem details', () => {
    const errorWithContext = new NotFoundError('Resource not found', { resourceId: '123' });

    const problemDetails = errorWithContext.toProblemDetails();
    
    expect(problemDetails).toEqual({
      type: 'https://api.firm.com/errors/NOT_FOUND',
      title: 'Resource Not Found',
      detail: 'Resource not found',
      status: 404,
      instance: undefined,
      timestamp: expect.any(String),
      extensions: { resourceId: '123' },
    });
  });

  it('serializes to JSON correctly', () => {
    const error = new RateLimitExceededError(100, '1h', { current: 101 });

    const json = JSON.parse(JSON.stringify(error));
    
    expect(json).toMatchObject({
      name: 'RateLimitExceededError',
      code: 'RATE_LIMIT_EXCEEDED',
      status: 429,
      context: { limit: 100, window: '1h', current: 101 },
    });
  });

  it('maintains proper stack trace', () => {
    const error = new ValidationError('Test error');

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('ValidationError');
  });
});

describe('Error utilities', () => {
  it('creates problem details with instance', () => {
    const error = new ValidationError('Invalid input');

    const problemDetails = createProblemDetails(error, '/api/users/123');
    
    expect(problemDetails.instance).toBe('/api/users/123');
  });

  it('identifies FirmError instances', () => {
    const firmError = new InternalServerError('Test error');
    const regularError = new Error('Regular error');

    expect(isFirmError(firmError)).toBe(true);
    expect(isFirmError(regularError)).toBe(false);
    expect(isFirmError(null)).toBe(false);
    expect(isFirmError(undefined)).toBe(false);
  });

  it('extracts error code from unknown error', () => {
    const firmError = new AuthenticationError('Auth failed');
    const regularError = new Error('Regular error');

    expect(getErrorCode(firmError)).toBe('UNAUTHORIZED');
    expect(getErrorCode(regularError)).toBe(null);
    expect(getErrorCode(null)).toBe(null);
  });

  it('extracts error status from unknown error', () => {
    const firmError = new AuthorizationError('Access denied');
    const regularError = new Error('Regular error');

    expect(getErrorStatus(firmError)).toBe(403);
    expect(getErrorStatus(regularError)).toBe(null);
    expect(getErrorStatus(null)).toBe(null);
  });
});

describe('ERROR_CODES', () => {
  it('contains all required error codes', () => {
    expect(ERROR_CODES.INTERNAL_SERVER_ERROR).toBe('INTERNAL_SERVER_ERROR');
    expect(ERROR_CODES.VALIDATION_FAILED).toBe('VALIDATION_FAILED');
    expect(ERROR_CODES.UNAUTHORIZED).toBe('UNAUTHORIZED');
    expect(ERROR_CODES.FORBIDDEN).toBe('FORBIDDEN');
    expect(ERROR_CODES.NOT_FOUND).toBe('NOT_FOUND');
    expect(ERROR_CODES.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
    expect(ERROR_CODES.CROSS_TENANT_ACCESS).toBe('CROSS_TENANT_ACCESS');
    expect(ERROR_CODES.CONFIG_VALIDATION_FAILED).toBe('CONFIG_VALIDATION_FAILED');
    expect(ERROR_CODES.DATABASE_CONNECTION_FAILED).toBe('DATABASE_CONNECTION_FAILED');
    expect(ERROR_CODES.WEBHOOK_SIGNATURE_INVALID).toBe('WEBHOOK_SIGNATURE_INVALID');
    expect(ERROR_CODES.AI_QUOTA_EXCEEDED).toBe('AI_QUOTA_EXCEEDED');
  });
});

```

---

