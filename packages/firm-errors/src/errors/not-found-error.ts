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
