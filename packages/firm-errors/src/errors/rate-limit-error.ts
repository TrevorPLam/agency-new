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
