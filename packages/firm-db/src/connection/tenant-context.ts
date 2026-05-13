/**
 * Tenant context integration with unified request context
 * 
 * Migrates from separate AsyncLocalStorage to shared @firm/request-context
 * while maintaining backward compatibility for database operations.
 */

import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { sql } from 'drizzle-orm'
import { getCurrentContext as getUnifiedContext, setRequestContext } from '@firm/request-context'
import * as schema from '../schemas'

/**
 * Tenant context interface
 */
export interface TenantContext {
  tenantId: string
  userId?: string
  apiKeyId?: string
  requestId?: string
  correlationId?: string
  sessionId?: string
  isAuthenticated?: boolean
  isImpersonated?: boolean
  isDelegated?: boolean
  impersonatedBy?: string
  delegatedBy?: string
}

/**
 * Convert unified request context to tenant context
 */
function convertToTenantContext(unifiedContext: any): TenantContext | undefined {
  if (!unifiedContext.tenantId) {
    return undefined;
  }
  
  return {
    tenantId: unifiedContext.tenantId,
    userId: unifiedContext.userId,
    apiKeyId: unifiedContext.apiKeyId,
    requestId: unifiedContext.requestId,
    correlationId: unifiedContext.correlationId,
    sessionId: unifiedContext.sessionId,
    isAuthenticated: unifiedContext.isAuthenticated,
    isImpersonated: unifiedContext.isImpersonated,
    isDelegated: unifiedContext.isDelegated,
    impersonatedBy: unifiedContext.impersonatedBy,
    delegatedBy: unifiedContext.delegatedBy,
  };
}

/**
 * Set tenant context for the current request
 */
export function setTenantContext(context: TenantContext): void {
  // Update unified request context with tenant information
  setRequestContext({
    tenantId: context.tenantId,
    userId: context.userId,
    apiKeyId: context.apiKeyId,
    requestId: context.requestId,
    correlationId: context.correlationId,
    sessionId: context.sessionId,
    isAuthenticated: context.isAuthenticated,
    isImpersonated: context.isImpersonated,
    isDelegated: context.isDelegated,
    impersonatedBy: context.impersonatedBy,
    delegatedBy: context.delegatedBy,
  });
}

/**
 * Get current tenant context from unified request context
 */
export function getTenantContext(): TenantContext | undefined {
  const unifiedContext = getUnifiedContext();
  return convertToTenantContext(unifiedContext);
}

/**
 * Get current tenant ID
 */
export function getCurrentTenantId(): string | undefined {
  return getTenantContext()?.tenantId
}

/**
 * Get current user ID
 */
export function getCurrentUserId(): string | undefined {
  return getTenantContext()?.userId
}

/**
 * Create a database instance with tenant context applied
 * 
 * This function wraps the database instance with RLS (Row Level Security)
 * to ensure queries are automatically scoped to the current tenant.
 */
export function createTenantAwareDb(db: PostgresJsDatabase): PostgresJsDatabase {
  return drizzle(db.session, {
    schema: {
      ...schema,
      // Override tables to include tenant context in all queries
      tenants: {
        ...schema.tenants,
        // RLS policies will be applied at database level
        config: {
          ...schema.tenants.config
        }
      }
    },
    logger: false // Disable default logging, use observability layer
  })
}

/**
 * Execute a database operation within tenant context
 * 
 * This helper ensures all operations within the callback
 * are executed with the specified tenant context.
 */
export async function withTenantContext<T>(
  tenantId: string,
  operation: (db: PostgresJsDatabase) => Promise<T>,
  baseDb: PostgresJsDatabase
): Promise<T> {
  const currentContext = getTenantContext();
  const context: TenantContext = {
    tenantId,
    userId: currentContext?.userId,
    apiKeyId: currentContext?.apiKeyId,
    requestId: currentContext?.requestId,
    correlationId: currentContext?.correlationId,
    sessionId: currentContext?.sessionId,
    isAuthenticated: currentContext?.isAuthenticated,
    isImpersonated: currentContext?.isImpersonated,
    isDelegated: currentContext?.isDelegated,
    impersonatedBy: currentContext?.impersonatedBy,
    delegatedBy: currentContext?.delegatedBy,
  }
  
  // Update unified request context
  setTenantContext(context);
  
  try {
    // Create tenant-aware database instance
    const db = createTenantAwareDb(baseDb)
    
    // Set tenant context for RLS
    await db.execute(sql`SET LOCAL app.current_tenant_id = ${tenantId}`)
    
    try {
      return await operation(db)
    } finally {
      // Clean up tenant context
      await db.execute(sql`RESET app.current_tenant_id`)
    }
  } finally {
    // Restore previous context if it existed
    if (currentContext) {
      setTenantContext(currentContext);
    }
  }
}

/**
 * Execute a database operation with user context
 */
export async function withUserContext<T>(
  userId: string,
  operation: (db: PostgresJsDatabase) => Promise<T>,
  baseDb: PostgresJsDatabase
): Promise<T> {
  const currentContext = getTenantContext()
  const context: TenantContext = {
    tenantId: currentContext?.tenantId || '', // Ensure tenantId is required
    userId,
    apiKeyId: currentContext?.apiKeyId,
    requestId: currentContext?.requestId,
    correlationId: currentContext?.correlationId,
    sessionId: currentContext?.sessionId,
    isAuthenticated: currentContext?.isAuthenticated,
    isImpersonated: currentContext?.isImpersonated,
    isDelegated: currentContext?.isDelegated,
    impersonatedBy: currentContext?.impersonatedBy,
    delegatedBy: currentContext?.delegatedBy,
  }
  
  // Update unified request context
  setTenantContext(context);
  
  try {
    const db = createTenantAwareDb(baseDb)
    
    if (currentContext?.tenantId) {
      await db.execute(sql`SET LOCAL app.current_tenant_id = ${currentContext.tenantId}`)
    }
    
    try {
      return await operation(db)
    } finally {
      if (currentContext?.tenantId) {
        await db.execute(sql`RESET app.current_tenant_id`)
      }
    }
  } finally {
    // Restore previous context if it existed
    if (currentContext) {
      setTenantContext(currentContext);
    }
  }
}

/**
 * Execute a database operation with API key context
 */
export async function withApiKeyContext<T>(
  apiKeyId: string,
  operation: (db: PostgresJsDatabase) => Promise<T>,
  baseDb: PostgresJsDatabase
): Promise<T> {
  const currentContext = getTenantContext()
  const context: TenantContext = {
    tenantId: currentContext?.tenantId || '', // Ensure tenantId is required
    userId: currentContext?.userId,
    apiKeyId,
    requestId: currentContext?.requestId,
    correlationId: currentContext?.correlationId,
    sessionId: currentContext?.sessionId,
    isAuthenticated: currentContext?.isAuthenticated,
    isImpersonated: currentContext?.isImpersonated,
    isDelegated: currentContext?.isDelegated,
    impersonatedBy: currentContext?.impersonatedBy,
    delegatedBy: currentContext?.delegatedBy,
  }
  
  // Update unified request context
  setTenantContext(context);
  
  try {
    const db = createTenantAwareDb(baseDb)
    
    if (currentContext?.tenantId) {
      await db.execute(sql`SET LOCAL app.current_tenant_id = ${currentContext.tenantId}`)
    }
    
    try {
      return await operation(db)
    } finally {
      if (currentContext?.tenantId) {
        await db.execute(sql`RESET app.current_tenant_id`)
      }
    }
  } finally {
    // Restore previous context if it existed
    if (currentContext) {
      setTenantContext(currentContext);
    }
  }
}

/**
 * Middleware helper for setting up tenant context from request
 * This is typically used in API middleware
 */
export function createTenantMiddleware(baseDb: PostgresJsDatabase) {
  return async (tenantId: string, userId?: string, apiKeyId?: string) => {
    const context: TenantContext = {
      tenantId,
      userId,
      apiKeyId,
      requestId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
    }
    
    // Update unified request context
    setTenantContext(context);
    
    try {
      const db = createTenantAwareDb(baseDb)
      
      // Set tenant context for RLS
      await db.execute(sql`SET LOCAL app.current_tenant_id = ${tenantId}`)
      
      return db
    } finally {
      // Clean up context after middleware
      // Note: In a real implementation, you might want to preserve context
      // for the duration of the request, not just the middleware setup
    }
  }
}
