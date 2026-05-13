import { describe, it, expect } from 'vitest';
import { tryCatch, tryCatchAsync, tryCatchWith, tryCatchAsyncWith } from '../src/try-catch';

describe('tryCatch', () => {
  it('returns Ok for successful operation', () => {
    const result = tryCatch(() => 'success');
    expect(result._tag).toBe('Ok');
    if (result._tag === 'Ok') {
      expect(result.value).toBe('success');
    }
  });

  it('returns Err for thrown error', () => {
    const error = new Error('test error');
    const result = tryCatch(() => {
      throw error;
    });
    expect(result._tag).toBe('Err');
    if (result._tag === 'Err') {
      expect(result.error).toBe(error);
    }
  });
});

describe('tryCatchAsync', () => {
  it('returns Ok for successful async operation', async () => {
    const result = await tryCatchAsync(async () => 'success');
    expect(result._tag).toBe('Ok');
    if (result._tag === 'Ok') {
      expect(result.value).toBe('success');
    }
  });

  it('returns Err for rejected promise', async () => {
    const error = new Error('async error');
    const result = await tryCatchAsync(async () => {
      throw error;
    });
    expect(result._tag).toBe('Err');
    if (result._tag === 'Err') {
      expect(result.error).toBe(error);
    }
  });
});

describe('tryCatchWith', () => {
  it('maps errors with custom mapper', () => {
    const result = tryCatchWith(
      () => {
        throw new Error('original');
      },
      (err) => `mapped: ${(err as Error).message}`
    );
    expect(result._tag).toBe('Err');
    if (result._tag === 'Err') {
      expect(result.error).toBe('mapped: original');
    }
  });

  it('returns Ok for successful operation', () => {
    const result = tryCatchWith(
      () => 'success',
      (err) => `mapped: ${(err as Error).message}`
    );
    expect(result._tag).toBe('Ok');
    if (result._tag === 'Ok') {
      expect(result.value).toBe('success');
    }
  });
});

describe('tryCatchAsyncWith', () => {
  it('maps async errors with custom mapper', async () => {
    const result = await tryCatchAsyncWith(
      async () => {
        throw new Error('async original');
      },
      (err) => `mapped: ${(err as Error).message}`
    );
    expect(result._tag).toBe('Err');
    if (result._tag === 'Err') {
      expect(result.error).toBe('mapped: async original');
    }
  });

  it('returns Ok for successful async operation', async () => {
    const result = await tryCatchAsyncWith(
      async () => 'async success',
      (err) => `mapped: ${(err as Error).message}`
    );
    expect(result._tag).toBe('Ok');
    if (result._tag === 'Ok') {
      expect(result.value).toBe('async success');
    }
  });
});
