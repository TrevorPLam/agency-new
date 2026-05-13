import type { HealthCheckResult } from '../types.js'
import { createDirectConnection, getDatabaseConfig } from '@firm/db/connection/factories'
import { tenantScopedTables } from '@firm/db/schemas/rls-policies'
import { sql } from 'drizzle-orm'

/**
 * Check if Row Level Security is properly enabled on all tenant-scoped tables
 * This ensures tenant isolation is enforced at the database level
 */
export async function rlsHealthCheck(): Promise<HealthCheckResult> {
  const startTime = Date.now()
  const requireRLS = process.env['REQUIRE_RLS'] !== 'false'
  
  if (!requireRLS) {
    return {
      status: 'healthy',
      timestamp: new Date(),
      duration: Date.now() - startTime,
      message: 'RLS enforcement disabled (REQUIRE_RLS=false)',
      details: {
        skipped: true,
        reason: 'Environment variable REQUIRE_RLS is set to false'
      }
    }
  }

  try {
    const config = getDatabaseConfig()
    const db = createDirectConnection(config)
    
    // Query PostgreSQL catalog to check RLS status
    const rlsQuery = sql`
      SELECT 
        schemaname,
        tablename,
        rowsecurity
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename = ANY(${sql.array(tenantScopedTables)})
      ORDER BY tablename
    `
    
    const result = await db.execute(rlsQuery)
    const tables = result.rows || []
    
    // Check if all required tables have RLS enabled
    const missingRLS = tables.filter((table: { rowsecurity: boolean }) => !table.rowsecurity)
    const protectedTables = tables.filter((table: { rowsecurity: boolean }) => table.rowsecurity)
    
    // Check for tables that don't exist
    const existingTableNames = tables.map((table: { tablename: string }) => table.tablename)
    const nonExistentTables = tenantScopedTables.filter(table => !existingTableNames.includes(table))
    
    const duration = Date.now() - startTime
    
    if (nonExistentTables.length > 0) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        duration,
        message: `${nonExistentTables.length} tenant tables not found`,
        details: {
          missingTables: nonExistentTables,
          existingTables: existingTableNames,
          totalRequired: tenantScopedTables.length
        }
      }
    }
    
    if (missingRLS.length > 0) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        duration,
        message: `${missingRLS.length} tables missing RLS protection`,
        details: {
          unprotectedTables: missingRLS.map((table: { tablename: string }) => table.tablename),
          protectedTables: protectedTables.map((table: { tablename: string }) => table.tablename),
          totalRequired: tenantScopedTables.length
        }
      }
    }
    
    return {
      status: 'healthy',
      timestamp: new Date(),
      duration,
      message: `RLS enabled on all ${protectedTables.length} tenant tables`,
      details: {
        protectedTables: protectedTables.map((table: { tablename: string }) => table.tablename),
        totalRequired: tenantScopedTables.length,
        policiesActive: true
      }
    }
    
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date(),
      duration: Date.now() - startTime,
      message: 'Failed to verify RLS status',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    }
  }
}

/**
 * Create a health check object for RLS verification
 */
export function createRLSCheck(): import('../types.js').HealthCheck {
  return {
    name: 'row-level-security',
    timeoutMs: 10000, // 10 second timeout for RLS verification
    check: rlsHealthCheck
  }
}
