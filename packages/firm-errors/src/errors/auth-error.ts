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
