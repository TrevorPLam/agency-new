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
