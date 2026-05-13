import { sql, asc, desc, eq, and, or, ilike, gte, lte, count } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type { PgliteDatabase } from 'drizzle-orm/pglite'
import * as schema from '../schemas'

// Generic database type that works with both Postgres and PgLite
export type Database = PostgresJsDatabase | PgliteDatabase

/**
 * Pagination result interface
 */
export interface PaginatedResult<T> {
  items: T[]
  nextCursor?: string
  prevCursor?: string
  hasMore: boolean
  totalCount?: number
}

/**
 * Cursor-based pagination helper
 * 
 * Provides efficient pagination for large datasets using cursor-based approach
 * which is more performant than offset-based pagination.
 */
export async function cursorPaginate<T extends Record<string, any>, K extends keyof T>(
  db: Database,
  table: any,
  options: {
    limit?: number
    cursor?: string
    orderBy?: K
    orderDirection?: 'asc' | 'desc'
    where?: any
    includeDeleted?: boolean
  } = {}
): Promise<PaginatedResult<T>> {
  const {
    limit = 20,
    cursor,
    orderBy = 'createdAt' as K,
    orderDirection = 'desc',
    where,
    includeDeleted = false
  } = options

  // Parse cursor to extract timestamp and ID
  let cursorCondition = sql`TRUE`
  if (cursor) {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8')
      const { timestamp, id } = JSON.parse(decoded)
      const operator = orderDirection === 'desc' ? '<' : '>'
      cursorCondition = sql`${table[orderBy]} ${sql.raw(operator)} ${new Date(timestamp)} OR (${table[orderBy]} = ${new Date(timestamp)} AND ${table['id']} ${sql.raw(operator)} ${id})`
    } catch {
      // Invalid cursor, ignore and start from beginning
    }
  }

  // Build WHERE conditions
  const conditions = []
  
  // Add user-provided where condition
  if (where) {
    conditions.push(where)
  }
  
  // Add soft-delete filter if table has deletedAt column and includeDeleted is false
  if (!includeDeleted && 'deletedAt' in table) {
    conditions.push(sql`${table['deletedAt']} IS NULL`)
  }
  
  // Add cursor condition
  conditions.push(cursorCondition)

  const baseQuery = db
    .select()
    .from(table)
    .where(and(...conditions))
    .orderBy(orderDirection === 'desc' ? desc(table[orderBy]) : asc(table[orderBy]))
    .limit(limit + 1) // +1 to check if there are more results

  const results = await baseQuery

  const hasMore = results.length > limit
  const items = hasMore ? results.slice(0, -1) : results

  // Generate next cursor if there are more results
  let nextCursor: string | undefined
  if (hasMore && items.length > 0) {
    const lastItem = items[items.length - 1]
    if (lastItem) {
      const cursorData = {
        timestamp: lastItem[orderBy as string],
        id: lastItem['id']
      }
      nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64')
    }
  }

  return {
    items: items as T[],
    nextCursor,
    hasMore
  }
}

/**
 * Soft delete helper
 * 
 * Marks records as deleted without actually removing them
 * Uses the deletedAt timestamp for soft deletion.
 */
export async function softDelete(
  db: PostgresJsDatabase,
  table: any,
  id: string | number
): Promise<void> {
  await db
    .update(table)
    .set({ deletedAt: new Date() })
    .where(eq(table['id'], id))
}

/**
 * Restore soft deleted record
 */
export async function restoreSoftDeleted(
  db: PostgresJsDatabase,
  table: any,
  id: string | number
): Promise<void> {
  await db
    .update(table)
    .set({ deletedAt: null })
    .where(eq(table['id'], id))
}

/**
 * Check if record is soft deleted
 */
export function isSoftDeleted<T extends { deletedAt: any }>(record: T): boolean {
  return record.deletedAt !== null
}

/**
 * Create audit log entry
 * 
 * Helper for creating audit log entries with proper context
 */
export async function createAuditEntry(
  db: PostgresJsDatabase,
  entry: {
    action: string
    resource: string
    resourceId?: string
    userId?: string
    apiKeyId?: string
    oldValue?: unknown
    newValue?: unknown
    success?: boolean
    errorMessage?: string
    metadata?: Record<string, unknown>
    ipAddress?: string
    userAgent?: string
    requestId?: string
  }
): Promise<void> {
  const tenantId = getCurrentTenantId()
  if (!tenantId) {
    throw new Error('Tenant context is required for audit logging')
  }

  await db.insert(schema.auditLogs).values({
    tenantId,
    action: entry.action,
    resource: entry.resource,
    resourceId: entry.resourceId,
    userId: entry.userId,
    apiKeyId: entry.apiKeyId,
    oldValue: entry.oldValue,
    newValue: entry.newValue,
    success: entry.success ?? true,
    errorMessage: entry.errorMessage,
    metadata: entry.metadata,
    ipAddress: entry.ipAddress,
    userAgent: entry.userAgent,
    requestId: entry.requestId,
    createdAt: new Date()
  })
}

/**
 * Get count helper
 * 
 * Efficient count queries with where conditions
 */
export async function getCount(
  db: PostgresJsDatabase,
  table: any,
  options?: {
    where?: any
    includeDeleted?: boolean
  }
): Promise<number> {
  const { where, includeDeleted = false } = options || {}
  
  // Build WHERE conditions
  const conditions = []
  
  // Add user-provided where condition
  if (where) {
    conditions.push(where)
  }
  
  // Add soft-delete filter if table has deletedAt column and includeDeleted is false
  if (!includeDeleted && 'deletedAt' in table) {
    conditions.push(sql`${table['deletedAt']} IS NULL`)
  }

  const query = db.select({ count: count() }).from(table)
  if (conditions.length > 0) {
    query.where(and(...conditions))
  }
  
  const result = await query
  return result[0]?.count || 0
}

/**
 * Upsert helper
 * 
 * Performs insert or update operation based on conflict resolution
 */
export async function upsert(
  db: PostgresJsDatabase,
  table: any,
  data: any,
  conflictTarget: string
): Promise<any> {
  return db
    .insert(table)
    .values(data)
    .onConflictDoUpdate({
      target: table[conflictTarget],
      set: data
    })
    .returning()
    .then(rows => rows[0])
}

/**
 * Search helper for text search
 * 
 * Provides case-insensitive search across multiple fields
 */
export function createTextSearch(searchTerm: string, fields: string[]) {
  return or(
    ...fields.map(field => 
      ilike(sql.raw(field), sql`%${searchTerm}%`)
    )
  )
}

/**
 * Date range helper
 * 
 * Creates date range conditions for filtering
 */
export function createDateRange(
  startDateField: any,
  endDateField: any,
  startDate?: Date,
  endDate?: Date
) {
  if (startDate && endDate) {
    return and(
      gte(startDateField, startDate),
      lte(endDateField, endDate)
    )
  } else if (startDate) {
    return gte(startDateField, startDate)
  } else if (endDate) {
    return lte(endDateField, endDate)
  }
  
  return sql`TRUE`
}

/**
 * Import current tenant ID
 */
import { getCurrentTenantId } from '../connection/tenant-context'

// Export outbox helpers
export * from './outbox'
