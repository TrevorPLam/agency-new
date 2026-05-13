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
