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
