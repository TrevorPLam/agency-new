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
