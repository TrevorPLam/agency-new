/**
 * Logger context integration with unified request context
 * 
 * Migrates from separate AsyncLocalStorage to shared @firm/request-context
 * while maintaining backward compatibility.
 */

import type { LoggerContext } from './logger';
import { getCurrentContext as getUnifiedContext, setRequestContext } from '@firm/request-context';

/**
 * Convert unified request context to logger context
 */
function convertToLoggerContext(unifiedContext: any): LoggerContext {
  return {
    correlationId: unifiedContext.correlationId || unifiedContext.requestId,
    tenantId: unifiedContext.tenantId,
    userId: unifiedContext.userId,
    sessionId: unifiedContext.sessionId,
    traceId: unifiedContext.traceId,
    requestId: unifiedContext.requestId,
    // Legacy support
    spanId: unifiedContext.spanId,
    impersonatedBy: unifiedContext.impersonatedBy,
    delegatedBy: unifiedContext.delegatedBy,
    isAuthenticated: unifiedContext.isAuthenticated,
    isImpersonated: unifiedContext.isImpersonated,
    isDelegated: unifiedContext.isDelegated,
  };
}

/**
 * Create a context manager for logger state
 * @returns Context manager instance
 */
export function createContextManager() {
  return new ContextManager();
}

/**
 * Context manager for handling logger context in async operations
 * Now uses unified request context internally
 */
export class ContextManager {
  /**
   * Run a function with specific context
   * @param context - Context to set
   * @param fn - Function to run
   * @returns Result of the function
   */
  async run<T>(context: LoggerContext, fn: () => Promise<T>): Promise<T> {
    // Convert logger context to unified context and set it
    const unifiedContext = {
      correlationId: context.correlationId,
      tenantId: context.tenantId,
      userId: context.userId,
      sessionId: context.sessionId,
      traceId: context.traceId,
      requestId: context.requestId,
      spanId: context.spanId,
      impersonatedBy: context.impersonatedBy,
      delegatedBy: context.delegatedBy,
      isAuthenticated: context.isAuthenticated,
      isImpersonated: context.isImpersonated,
      isDelegated: context.isDelegated,
    };

    // Update unified request context
    setRequestContext(unifiedContext);

    return fn();
  }

  /**
   * Get current context from unified request context
   * @returns Current logger context
   */
  getContext(): LoggerContext {
    const unifiedContext = getUnifiedContext();
    return convertToLoggerContext(unifiedContext);
  }

  /**
   * Create child context manager with additional context
   * @param context - Additional context
   * @returns Child context manager
   */
  child(context: LoggerContext): ContextManager {
    const child = new ContextManager();
    const currentContext = this.getContext();
    const mergedContext = { ...currentContext, ...context };
    
    // Update unified context with merged context
    setRequestContext({
      correlationId: mergedContext.correlationId,
      tenantId: mergedContext.tenantId,
      userId: mergedContext.userId,
      sessionId: mergedContext.sessionId,
      traceId: mergedContext.traceId,
      requestId: mergedContext.requestId,
      spanId: mergedContext.spanId,
      impersonatedBy: mergedContext.impersonatedBy,
      delegatedBy: mergedContext.delegatedBy,
      isAuthenticated: mergedContext.isAuthenticated,
      isImpersonated: mergedContext.isImpersonated,
      isDelegated: mergedContext.isDelegated,
    });
    
    return child;
  }

  /**
   * Set context values directly
   * @param context - Context to set
   */
  setContext(context: LoggerContext): void {
    setRequestContext({
      correlationId: context.correlationId,
      tenantId: context.tenantId,
      userId: context.userId,
      sessionId: context.sessionId,
      traceId: context.traceId,
      requestId: context.requestId,
      spanId: context.spanId,
      impersonatedBy: context.impersonatedBy,
      delegatedBy: context.delegatedBy,
      isAuthenticated: context.isAuthenticated,
      isImpersonated: context.isImpersonated,
      isDelegated: context.isDelegated,
    });
  }

  /**
   * Clear all context
   */
  clear(): void {
    // Clear unified context
    const currentContext = getUnifiedContext();
    const clearedContext = { ...currentContext };
    delete clearedContext.correlationId;
    delete clearedContext.tenantId;
    delete clearedContext.userId;
    delete clearedContext.sessionId;
    delete clearedContext.traceId;
    delete clearedContext.requestId;
    delete clearedContext.spanId;
    delete clearedContext.impersonatedBy;
    delete clearedContext.delegatedBy;
    delete clearedContext.isAuthenticated;
    delete clearedContext.isImpersonated;
    delete clearedContext.isDelegated;
    
    setRequestContext(clearedContext);
  }

  /**
   * Get specific context value
   * @param key - Context key to get
   * @returns Context value or undefined
   */
  get<T = any>(key: keyof LoggerContext): T | undefined {
    const context = this.getContext();
    return context[key] as T;
  }

  /**
   * Set specific context value
   * @param key - Context key to set
   * @param value - Value to set
   */
  set<K extends keyof LoggerContext>(key: K, value: LoggerContext[K]): void {
    const currentContext = this.getContext();
    const updatedContext = { ...currentContext, [key]: value };
    this.setContext(updatedContext);
  }
}

/**
 * Get current logger context from unified request context
 * @returns Current logger context
 */
export function getCurrentContext(): LoggerContext {
  const unifiedContext = getUnifiedContext();
  return convertToLoggerContext(unifiedContext);
}

/**
 * Run function with context using unified request context
 * @param context - Context to set
 * @param fn - Function to run
 * @returns Result of the function
 */
export function runWithContext<T>(context: LoggerContext, fn: () => T): T {
  const unifiedContext = {
    correlationId: context.correlationId,
    tenantId: context.tenantId,
    userId: context.userId,
    sessionId: context.sessionId,
    traceId: context.traceId,
    requestId: context.requestId,
    spanId: context.spanId,
    impersonatedBy: context.impersonatedBy,
    delegatedBy: context.delegatedBy,
    isAuthenticated: context.isAuthenticated,
    isImpersonated: context.isImpersonated,
    isDelegated: context.isDelegated,
  };

  setRequestContext(unifiedContext);
  return fn();
}

/**
 * Run async function with context using unified request context
 * @param context - Context to set
 * @param fn - Async function to run
 * @returns Result of the async function
 */
export function runWithContextAsync<T>(context: LoggerContext, fn: () => Promise<T>): Promise<T> {
  const unifiedContext = {
    correlationId: context.correlationId,
    tenantId: context.tenantId,
    userId: context.userId,
    sessionId: context.sessionId,
    traceId: context.traceId,
    requestId: context.requestId,
    spanId: context.spanId,
    impersonatedBy: context.impersonatedBy,
    delegatedBy: context.delegatedBy,
    isAuthenticated: context.isAuthenticated,
    isImpersonated: context.isImpersonated,
    isDelegated: context.isDelegated,
  };

  setRequestContext(unifiedContext);
  return fn();
}
