import { describe, it, expect } from 'vitest';
import { ok, err, isOk, isErr, map, mapErr, flatMap, unwrapOr, unwrap, intoEither, type Result } from '../src/result';

describe('Result', () => {
  describe('ok', () => {
    it('creates an Ok result', () => {
      const result = ok<string, Error>('success');
      expect(isOk(result)).toBe(true);
      expect(isErr(result)).toBe(false);
      if (isOk(result)) {
        expect(result.value).toBe('success');
      }
    });
  });

  describe('err', () => {
    it('creates an Err result', () => {
      const error = new Error('failure');
      const result = err<string, Error>(error);
      expect(isOk(result)).toBe(false);
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe(error);
      }
    });
  });

  describe('map', () => {
    it('maps Ok values', () => {
      const result = ok(5);
      const mapped = map(result, x => x * 2);
      expect(isOk(mapped)).toBe(true);
      if (isOk(mapped)) {
        expect(mapped.value).toBe(10);
      }
    });

    it('passes through Err values', () => {
      const error = new Error('test');
      const result = err<string, Error>(error);
      const mapped = map(result, x => x.toUpperCase());
      expect(isErr(mapped)).toBe(true);
      if (isErr(mapped)) {
        expect(mapped.error).toBe(error);
      }
    });
  });

  describe('mapErr', () => {
    it('maps Err values', () => {
      const error = new Error('original');
      const result = err<string, Error>(error);
      const mapped = mapErr(result, err => new Error(`mapped: ${(err as Error).message}`));
      expect(isErr(mapped)).toBe(true);
      if (isErr(mapped)) {
        expect((mapped.error as Error).message).toBe('mapped: original');
      }
    });

    it('passes through Ok values', () => {
      const result = ok('success');
      const mapped = mapErr(result, err => new Error(`mapped: ${(err as Error).message}`));
      expect(isOk(mapped)).toBe(true);
      if (isOk(mapped)) {
        expect(mapped.value).toBe('success');
      }
    });
  });

  describe('flatMap', () => {
    it('chains Ok operations', () => {
      const result = ok(5);
      const chained = flatMap(result, x => ok(x * 2));
      expect(isOk(chained)).toBe(true);
      if (isOk(chained)) {
        expect(chained.value).toBe(10);
      }
    });

    it('short-circuits on Err', () => {
      const error = new Error('failure');
      const result = err<number, Error>(error);
      const chained = flatMap(result, x => ok(x * 2));
      expect(isErr(chained)).toBe(true);
      if (isErr(chained)) {
        expect(chained.error).toBe(error);
      }
    });

    it('handles Err in chain', () => {
      const result = ok(5);
      const chained = flatMap(result, x => err<number, Error>(new Error('chain error')));
      expect(isErr(chained)).toBe(true);
      if (isErr(chained)) {
        expect((chained.error as Error).message).toBe('chain error');
      }
    });
  });

  describe('unwrapOr', () => {
    it('returns value for Ok', () => {
      const result = ok('success');
      expect(unwrapOr(result, 'default')).toBe('success');
    });

    it('returns default for Err', () => {
      const result = err<string, Error>(new Error('error'));
      expect(unwrapOr(result, 'default')).toBe('default');
    });
  });

  describe('unwrap', () => {
    it('returns value for Ok', () => {
      const result = ok('success');
      expect(unwrap(result)).toBe('success');
    });

    it('throws for Err', () => {
      const error = new Error('test error');
      const result = err<string, Error>(error);
      expect(() => unwrap(result)).toThrow(error);
    });
  });

  describe('intoEither', () => {
    it('returns value for Ok', () => {
      const result = ok('success');
      expect(intoEither(result)).toBe('success');
    });

    it('returns error for Err', () => {
      const error = new Error('test error');
      const result = err<string, Error>(error);
      expect(intoEither(result)).toBe(error);
    });
  });
});
