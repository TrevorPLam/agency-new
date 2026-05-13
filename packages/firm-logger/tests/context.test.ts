import { describe, it, expect } from 'vitest';
import { createContextManager, getCurrentContext, runWithContext } from '../src/context';

describe('Context Management', () => {
  it('creates context manager', () => {
    const manager = createContextManager();
    
    expect(manager).toBeDefined();
    expect(typeof manager.getContext).toBe('function');
    expect(typeof manager.run).toBe('function');
  });

  it('gets empty context initially', () => {
    const manager = createContextManager();
    const context = manager.getContext();
    
    expect(context).toEqual({});
  });

  it('sets and gets context values', () => {
    const manager = createContextManager();
    
    manager.set('testKey', 'testValue');
    const value = manager.get('testKey');
    
    expect(value).toBe('testValue');
  });

  it('runs function with context', async () => {
    const manager = createContextManager();
    
    let capturedContext: any = {};
    
    await manager.run({ key: 'value' }, async () => {
      capturedContext = getCurrentContext();
    });
    
    expect(capturedContext.key).toBe('value');
  });

  it('merges context in nested runs', async () => {
    const manager = createContextManager();
    
    let capturedContext: any = {};
    
    await manager.run({ outer: 'value' }, async () => {
      await manager.run({ inner: 'nested' }, async () => {
        capturedContext = getCurrentContext();
      });
    });
    
    expect(capturedContext.outer).toBe('value');
    expect(capturedContext.inner).toBe('nested');
  });

  it('creates child context manager', () => {
    const parent = createContextManager();
    parent.set('parentKey', 'parentValue');
    
    const child = parent.child({ childKey: 'childValue' });
    const context = child.getContext();
    
    expect(context.parentKey).toBe('parentValue');
    expect(context.childKey).toBe('childValue');
  });
});

describe('runWithContext', () => {
  it('runs function with context directly', async () => {
    let capturedContext: any = {};
    
    await runWithContext({ direct: 'context' }, async () => {
      capturedContext = getCurrentContext();
    });
    
    expect(capturedContext.direct).toBe('context');
  });
});
