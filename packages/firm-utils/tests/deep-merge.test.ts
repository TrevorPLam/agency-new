import { describe, it, expect } from 'vitest';
import { deepMerge, deepMergeMany, applyUpdates } from '../src/deep-merge';

describe('deepMerge', () => {
  it('merges simple objects', () => {
    const target = { a: 1, b: 2 } as any;
    const source = { b: 3, c: 4 } as any;
    const result = deepMerge(target, source);
    
    expect(result).toEqual({ a: 1, b: 3, c: 4 });
  });

  it('does not mutate original objects', () => {
    const target = { a: 1 } as any;
    const source = { b: 2 } as any;
    deepMerge(target, source);
    
    expect(target).toEqual({ a: 1 });
    expect(source).toEqual({ b: 2 });
  });

  it('deeply merges nested objects', () => {
    const target = { a: { b: 1, c: 2 } } as any;
    const source = { a: { c: 3, d: 4 } } as any;
    const result = deepMerge(target, source);
    
    expect(result).toEqual({ a: { b: 1, c: 3, d: 4 } });
  });

  it('replaces arrays', () => {
    const target = { a: [1, 2, 3] } as any;
    const source = { a: [4, 5] } as any;
    const result = deepMerge(target, source);
    
    expect(result).toEqual({ a: [4, 5] });
  });

  it('handles null and undefined', () => {
    const target = { a: 1, b: 2 } as any;
    const source = { b: null, c: undefined, d: 4 } as any;
    const result = deepMerge(target, source);
    
    expect(result).toEqual({ a: 1, b: null, c: undefined, d: 4 });
  });
});

describe('deepMergeMany', () => {
  it('merges multiple objects', () => {
    const obj1 = { a: 1 } as any;
    const obj2 = { b: 2 } as any;
    const obj3 = { c: 3 } as any;
    const result = deepMergeMany(obj1, obj2, obj3);
    
    expect(result).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('handles empty array', () => {
    const result = deepMergeMany();
    expect(result).toEqual({});
  });

  it('merges in order', () => {
    const result = deepMergeMany(
      { a: 1, b: 2 } as any,
      { b: 3, c: 4 } as any,
      { c: 5, d: 6 } as any
    );
    
    expect(result).toEqual({ a: 1, b: 3, c: 5, d: 6 });
  });
});

describe('applyUpdates', () => {
  it('applies partial updates', () => {
    const target = { a: 1, b: 2, c: 3 } as any;
    const updates = { b: 20, d: 4 } as any;
    const result = applyUpdates(target, updates);
    
    expect(result).toEqual({ a: 1, b: 20, c: 3, d: 4 });
  });

  it('does not mutate original', () => {
    const target = { a: 1 } as any;
    const updates = { b: 2 } as any;
    applyUpdates(target, updates);
    
    expect(target).toEqual({ a: 1 });
  });
});
