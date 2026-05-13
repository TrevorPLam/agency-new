/**
 * Result type for handling expected failures without throwing exceptions
 * Implements a tagged union with `ok` and `err` variants
 */
export type Result<T, E> = Ok<T, E> | Err<T, E>;

interface Ok<T, E> {
  readonly _tag: 'Ok';
  readonly value: T;
}

interface Err<T, E> {
  readonly _tag: 'Err';
  readonly error: E;
}

/**
 * Creates an Ok result containing a successful value
 */
export function ok<T, E>(value: T): Result<T, E> {
  return { _tag: 'Ok', value } as const;
}

/**
 * Creates an Err result containing an error value
 */
export function err<T, E>(error: E): Result<T, E> {
  return { _tag: 'Err', error } as const;
}

/**
 * Type guard to check if a Result is Ok
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T, E> {
  return result._tag === 'Ok';
}

/**
 * Type guard to check if a Result is Err
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<T, E> {
  return result._tag === 'Err';
}

/**
 * Maps the success value of a Result if it's Ok, otherwise returns the Err unchanged
 */
export function map<T, E, U>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return isOk(result) ? ok(fn(result.value)) : err(result.error);
}

/**
 * Maps the error value of a Result if it's Err, otherwise returns the Ok unchanged
 */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  return isErr(result) ? err(fn(result.error)) : ok(result.value);
}

/**
 * Chains operations that may fail, short-circuiting on the first Err
 */
export function flatMap<T, E, U>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> {
  return isOk(result) ? fn(result.value) : err(result.error);
}

/**
 * Unwraps a Result, returning the value if Ok or a default if Err
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return isOk(result) ? result.value : defaultValue;
}

/**
 * Unwraps a Result, returning the value if Ok or throwing the error
 * @throws The error value if the Result is Err, with additional context
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (isOk(result)) {
    return result.value;
  }
  const error = result.error;
  const message = error instanceof Error 
    ? error.message 
    : String(error);
  throw new Error(`Failed to unwrap Result: ${message}`, { cause: error });
}

/**
 * Returns the success value or the error value
 */
export function intoEither<T, E>(result: Result<T, E>): T | E {
  return isOk(result) ? result.value : result.error;
}
