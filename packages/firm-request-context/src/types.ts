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
