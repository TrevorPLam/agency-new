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
