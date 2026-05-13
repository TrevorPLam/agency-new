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
