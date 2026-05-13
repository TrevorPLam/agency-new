import { ok, err } from './result';
import type { Result } from './result';

/**
 * Wraps a synchronous operation that may throw, returning a Result
 * @param fn - The function to execute
 * @returns Ok with the function result, or Err with the thrown error
 */
export function tryCatch<T, E = Error>(fn: () => T): Result<T, E> {
  try {
    return ok(fn());
  } catch (error) {
    return err(error as E);
  }
}

/**
 * Wraps an asynchronous operation that may throw, returning a Promise<Result>
 * @param fn - The async function to execute
 * @returns Promise that resolves to Ok with the function result, or Err with the thrown error
 */
export async function tryCatchAsync<T, E = Error>(fn: () => Promise<T>): Promise<Result<T, E>> {
  try {
    return ok(await fn());
  } catch (error) {
    return err(error as E);
  }
}

/**
 * Wraps a synchronous operation with a custom error mapper
 * @param fn - The function to execute
 * @param errorMapper - Function to transform the caught error
 * @returns Ok with the function result, or Err with the mapped error
 */
export function tryCatchWith<T, E, F = Error>(
  fn: () => T,
  errorMapper: (error: F) => E
): Result<T, E> {
  try {
    return ok(fn());
  } catch (error) {
    return err(errorMapper(error as F));
  }
}

/**
 * Wraps an asynchronous operation with a custom error mapper
 * @param fn - The async function to execute
 * @param errorMapper - Function to transform the caught error
 * @returns Promise that resolves to Ok with the function result, or Err with the mapped error
 */
export async function tryCatchAsyncWith<T, E, F = Error>(
  fn: () => Promise<T>,
  errorMapper: (error: F) => E
): Promise<Result<T, E>> {
  try {
    return ok(await fn());
  } catch (error) {
    return err(errorMapper(error as F));
  }
}
