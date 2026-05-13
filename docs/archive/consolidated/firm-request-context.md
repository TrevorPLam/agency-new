# firm-request-context

Generated on: 2026-05-13T02:25:38.655Z
Total files: 5

**Description:** Unified request context for Firm Platform

**Version:** 1.0.0

## Table of Contents

- [index.ts](#index-ts)
- [middleware.ts](#middleware-ts)
- [store.ts](#store-ts)
- [types.ts](#types-ts)
- [tsup.config.ts](#tsup-config-ts)

## File Contents

### index.ts

**Path:** `src\index.ts`

**Language:** TypeScript

```typescript
/**
 * @firm/request-context
 * 
 * Unified request context for Firm Platform
 * Consolidates AsyncLocalStorage usage across logger, observability, and database packages.
 */

// Export types
export type {
  RequestContext,
  RequestContextOptions,
  MiddlewareContext,
  RequestContextManager,
} from './types';

// Export store functions and classes
export {
  UnifiedRequestContextManager,
  requestContext,
  getCurrentContext,
  setRequestContext,
  withRequestContext,
  withRequestContextAsync,
  createRequestContext,
  clearRequestContext,
} from './store';

// Export middleware functions
export {
  extractContextFromHeaders,
  createContextFromMiddleware,
  expressRequestContextMiddleware,
  fastifyRequestContextMiddleware,
  createRequestContextMiddleware,
  parseIncomingHeaders,
} from './middleware';

```

---

### middleware.ts

**Path:** `src\middleware.ts`

**Language:** TypeScript

```typescript
/**
 * Unified request context middleware
 * 
 * Provides a single middleware that extracts context from HTTP requests
 * and populates the shared AsyncLocalStorage store.
 */

import type { UserId, TenantId } from '@firm/types';
import { asUserId, asTenantId } from '@firm/types';
import type { RequestContext, RequestContextOptions, MiddlewareContext } from './types';
import { createRequestContext, withRequestContextAsync } from './store';

/**
 * Extract context from HTTP headers
 */
export function extractContextFromHeaders(headers: Record<string, string>): RequestContextOptions {
  const context: RequestContextOptions = {};

  // Extract standard headers
  if (headers['x-request-id']) {
    context.requestId = headers['x-request-id'];
  }
  
  if (headers['x-correlation-id']) {
    context.correlationId = headers['x-correlation-id'];
  }
  
  if (headers['x-trace-id']) {
    context.traceId = headers['x-trace-id'];
  }
  
  if (headers['x-span-id']) {
    context.spanId = headers['x-span-id'];
  }
  
  if (headers['x-user-id']) {
    try {
      context.userId = asUserId(headers['x-user-id']);
    } catch {
      // Invalid UUID, skip setting userId
    }
  }
  
  if (headers['x-tenant-id']) {
    try {
      context.tenantId = asTenantId(headers['x-tenant-id']);
    } catch {
      // Invalid UUID, skip setting tenantId
    }
  }
  
  if (headers['x-session-id']) {
    context.sessionId = headers['x-session-id'];
  }
  
  if (headers['x-api-key-id']) {
    context.apiKeyId = headers['x-api-key-id'];
  }
  
  // Authentication flags
  if (headers['x-authenticated'] === 'true') {
    context.isAuthenticated = true;
  }
  
  if (headers['x-impersonated'] === 'true') {
    context.isImpersonated = true;
  }
  
  if (headers['x-delegated'] === 'true') {
    context.isDelegated = true;
  }
  
  if (headers['x-impersonated-by']) {
    try {
      context.impersonatedBy = asUserId(headers['x-impersonated-by']);
    } catch {
      // Invalid UUID, skip setting impersonatedBy
    }
  }
  
  if (headers['x-delegated-by']) {
    try {
      context.delegatedBy = asUserId(headers['x-delegated-by']);
    } catch {
      // Invalid UUID, skip setting delegatedBy
    }
  }

  return context;
}

/**
 * Create request context from middleware context
 */
export function createContextFromMiddleware(
  middlewareContext: MiddlewareContext,
  additionalContext?: Partial<RequestContextOptions>
): RequestContext {
  const headerContext = extractContextFromHeaders(middlewareContext.headers);
  
  return createRequestContext({
    ...headerContext,
    method: middlewareContext.method,
    path: middlewareContext.path,
    ip: middlewareContext.ip,
    userAgent: middlewareContext.userAgent,
    ...additionalContext,
  });
}

/**
 * Express.js middleware for request context
 */
export function expressRequestContextMiddleware(
  additionalContext?: Partial<RequestContextOptions>
) {
  return (req: any, res: any, next: any) => {
    const middlewareContext: MiddlewareContext = {
      headers: req.headers || {},
      method: req.method,
      path: req.path,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent'),
    };

    const requestContext = createContextFromMiddleware(middlewareContext, additionalContext);

    // Run the request in the context
    withRequestContextAsync(requestContext, () => {
      // Add context to request for easy access
      req.requestContext = requestContext;
      
      // Set response headers for tracing
      if (requestContext.requestId) {
        res.setHeader('x-request-id', requestContext.requestId);
      }
      if (requestContext.correlationId) {
        res.setHeader('x-correlation-id', requestContext.correlationId);
      }
      if (requestContext.traceId) {
        res.setHeader('x-trace-id', requestContext.traceId);
      }

      next();
    });
  };
}

/**
 * Fastify middleware for request context
 */
export function fastifyRequestContextMiddleware(
  additionalContext?: Partial<RequestContextOptions>
) {
  return async (request: any, reply: any) => {
    const middlewareContext: MiddlewareContext = {
      headers: request.headers || {},
      method: request.method,
      path: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    };

    const requestContext = createContextFromMiddleware(middlewareContext, additionalContext);

    // Run the request in the context
    return withRequestContextAsync(requestContext, async () => {
      // Add context to request for easy access
      request.requestContext = requestContext;
      
      // Set response headers for tracing
      if (requestContext.requestId) {
        reply.header('x-request-id', requestContext.requestId);
      }
      if (requestContext.correlationId) {
        reply.header('x-correlation-id', requestContext.correlationId);
      }
      if (requestContext.traceId) {
        reply.header('x-trace-id', requestContext.traceId);
      }

      // Continue with the request
      return request;
    });
  };
}

/**
 * Generic middleware function for any framework
 */
export function createRequestContextMiddleware(
  middlewareContext: MiddlewareContext,
  additionalContext?: Partial<RequestContextOptions>
) {
  const requestContext = createContextFromMiddleware(middlewareContext, additionalContext);
  
  return {
    context: requestContext,
    run: <T>(fn: () => T) => withRequestContextAsync(requestContext, fn),
  };
}

/**
 * Helper to extract context from incoming request headers
 */
export function parseIncomingHeaders(headers: Record<string, string>): RequestContextOptions {
  return extractContextFromHeaders(headers);
}

```

---

### store.ts

**Path:** `src\store.ts`

**Language:** TypeScript

```typescript
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

```

---

### types.ts

**Path:** `src\types.ts`

**Language:** TypeScript

```typescript
/**
 * Unified request context types for Firm Platform
 * 
 * Consolidates context from logger, observability, and database packages
 * into a single AsyncLocalStorage store.
 */

import type { UserId, TenantId } from '@firm/types';

/**
 * Core request context that spans all packages
 */
export interface RequestContext {
  // Request identification
  requestId?: string;
  correlationId?: string;
  
  // User and tenant context
  userId?: UserId;
  tenantId?: TenantId;
  sessionId?: string;
  apiKeyId?: string;
  
  // Observability context
  traceId?: string;
  spanId?: string;
  
  // Authentication context
  isAuthenticated?: boolean;
  isImpersonated?: boolean;
  isDelegated?: boolean;
  impersonatedBy?: UserId;
  delegatedBy?: UserId;
  
  // Request metadata
  userAgent?: string;
  ip?: string;
  method?: string;
  path?: string;
  
  // Custom context for extensibility
  [key: string]: any;
}

/**
 * Request context options for initialization
 */
export interface RequestContextOptions {
  requestId?: string;
  correlationId?: string;
  userId?: UserId;
  tenantId?: TenantId;
  sessionId?: string;
  apiKeyId?: string;
  traceId?: string;
  spanId?: string;
  isAuthenticated?: boolean;
  isImpersonated?: boolean;
  isDelegated?: boolean;
  impersonatedBy?: UserId;
  delegatedBy?: UserId;
  userAgent?: string;
  ip?: string;
  method?: string;
  path?: string;
}

/**
 * Middleware context extracted from HTTP request
 */
export interface MiddlewareContext {
  headers: Record<string, string>;
  method?: string;
  path?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Request context manager interface
 */
export interface RequestContextManager {
  get(): RequestContext;
  set(context: Partial<RequestContext>): void;
  run<T>(context: RequestContext, fn: () => T): T;
  runAsync<T>(context: RequestContext, fn: () => Promise<T>): Promise<T>;
  clear(): void;
  child(context: Partial<RequestContext>): RequestContextManager;
}

```

---

### tsup.config.ts

**Path:** `tsup.config.ts`

**Language:** TypeScript

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['@firm/types'],
});

```

---

