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
