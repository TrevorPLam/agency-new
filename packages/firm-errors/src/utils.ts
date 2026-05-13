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
