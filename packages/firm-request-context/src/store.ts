/**
 * Unified AsyncLocalStorage store for request context
 * 
 * Replaces multiple separate AsyncLocalStorage instances with a single
 * centralized store that all packages can use.
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import type { RequestContext, RequestContextManager, RequestContextOptions } from './types';

/**
 * Global AsyncLocalStorage instance for request context
 */
const requestContextStore = new AsyncLocalStorage<RequestContext>();

/**
 * Default empty context
 */
const DEFAULT_CONTEXT: RequestContext = {};

/**
 * Unified request context manager
 */
export class UnifiedRequestContextManager implements RequestContextManager {
  private currentContext: RequestContext = DEFAULT_CONTEXT;

  /**
   * Get current request context
   */
  get(): RequestContext {
    const storeContext = requestContextStore.getStore();
    return storeContext || this.currentContext;
  }

  /**
   * Set request context values
   */
  set(context: Partial<RequestContext>): void {
    const currentContext = this.get();
    const newContext = { ...currentContext, ...context };
    this.currentContext = newContext;
    requestContextStore.enterWith(newContext);
  }

  /**
   * Run function with specific context
   */
  run<T>(context: RequestContext, fn: () => T): T {
    return requestContextStore.run(context, fn);
  }

  /**
   * Run async function with specific context
   */
  runAsync<T>(context: RequestContext, fn: () => Promise<T>): Promise<T> {
    return requestContextStore.run(context, fn);
  }

  /**
   * Clear all context
   */
  clear(): void {
    this.currentContext = DEFAULT_CONTEXT;
    requestContextStore.enterWith(DEFAULT_CONTEXT);
  }

  /**
   * Create child context manager with additional context
   */
  child(context: Partial<RequestContext>): RequestContextManager {
    const child = new UnifiedRequestContextManager();
    child.currentContext = { ...this.currentContext, ...context };
    return child;
  }

  /**
   * Get specific context value
   */
  get<T = any>(key: keyof RequestContext): T | undefined {
    return this.get()[key];
  }

  /**
   * Set specific context value
   */
  set<K extends keyof RequestContext>(key: K, value: RequestContext[K]): void {
    this.set({ [key]: value });
  }
}

/**
 * Global request context manager instance
 */
export const requestContext = new UnifiedRequestContextManager();

/**
 * Get current request context
 */
export function getCurrentContext(): RequestContext {
  return requestContext.get();
}

/**
 * Set request context
 */
export function setRequestContext(context: Partial<RequestContext>): void {
  requestContext.set(context);
}

/**
 * Run function with request context
 */
export function withRequestContext<T>(
  context: RequestContext,
  fn: () => T
): T {
  return requestContext.run(context, fn);
}

/**
 * Run async function with request context
 */
export function withRequestContextAsync<T>(
  context: RequestContext,
  fn: () => Promise<T>
): Promise<T> {
  return requestContext.runAsync(context, fn);
}

/**
 * Create request context from options
 */
export function createRequestContext(options: RequestContextOptions = {}): RequestContext {
  return {
    requestId: options.requestId || crypto.randomUUID(),
    correlationId: options.correlationId || options.requestId || crypto.randomUUID(),
    userId: options.userId,
    tenantId: options.tenantId,
    sessionId: options.sessionId,
    apiKeyId: options.apiKeyId,
    traceId: options.traceId,
    spanId: options.spanId,
    isAuthenticated: options.isAuthenticated,
    isImpersonated: options.isImpersonated,
    isDelegated: options.isDelegated,
    impersonatedBy: options.impersonatedBy,
    delegatedBy: options.delegatedBy,
    userAgent: options.userAgent,
    ip: options.ip,
    method: options.method,
    path: options.path,
  };
}

/**
 * Clear request context
 */
export function clearRequestContext(): void {
  requestContext.clear();
}
