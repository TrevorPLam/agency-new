/**
 * Helper function for exhaustive type checking
 * Throws an error if called, indicating that all cases were not handled
 * @param value - The value that should never be passed
 * @param message - Optional custom error message
 * @returns Never returns, always throws
 */
export function assertNever(value: never, message?: string): never {
  const defaultMessage = `Unexpected value: ${String(value)}. This should never happen if all cases are handled.`;
  throw new Error(message || defaultMessage);
}

/**
 * Type-safe version of assertNever that provides better error messages
 * @param value - The value that should never be passed
 * @param context - Additional context for debugging
 * @returns Never returns, always throws
 */
export function assertNeverWithContext<T>(value: never, context: Record<string, unknown>): never {
  const contextStr = Object.entries(context)
    .map(([key, val]) => `${key}=${JSON.stringify(val)}`)
    .join(', ');
  
  throw new Error(
    `Unexpected value: ${String(value)}. Context: ${contextStr}. ` +
    'This indicates a missing case in exhaustive type checking.'
  );
}
