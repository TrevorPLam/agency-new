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
