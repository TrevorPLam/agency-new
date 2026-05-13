import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import * as schema from '../schemas'

/**
 * Database connection configuration
 */
export interface DatabaseConfig {
  url: string
  ssl?: boolean
  maxConnections?: number
  idleTimeout?: number
  connectTimeout?: number
}

/**
 * Connection modes for different deployment scenarios
 */
export type ConnectionMode = 'serverless' | 'pooled' | 'direct'

/**
 * Create database connection for serverless environments
 * Optimized for short-lived connections (Vercel, AWS Lambda)
 */
export function createServerlessConnection(config: DatabaseConfig): PostgresJsDatabase {
  return drizzle(config.url, {
    schema,
    connection: {
      ssl: config.ssl ?? true,
      max: 1, // Single connection for serverless
      idle_timeout: config.idleTimeout ?? 10,
      connect_timeout: config.connectTimeout ?? 10
    }
  })
}

/**
 * Create database connection with connection pooling
 * Optimized for server environments with sustained traffic
 * Includes RLS-specific configuration for tenant isolation
 */
export function createPooledConnection(config: DatabaseConfig): PostgresJsDatabase {
  return drizzle(config.url, {
    schema,
    connection: {
      ssl: config.ssl ?? false,
      max: config.maxConnections ?? 20,
      idle_timeout: config.idleTimeout ?? 300,
      connect_timeout: config.connectTimeout ?? 30,
      // RLS-specific settings for tenant isolation
      prepare: true, // Enable prepared statements for RLS performance
      max_lifetime: 3600, // 1 hour max connection lifetime for RLS context cleanup
      // Ensure each connection has proper isolation
      statement_timeout: 30000, // 30 second query timeout
      lock_timeout: 10000 // 10 second lock timeout
    }
  })
}

/**
 * Create direct database connection
 * For migrations and administrative tasks
 */
export function createDirectConnection(config: DatabaseConfig): PostgresJsDatabase {
  return drizzle(config.url, {
    schema,
    connection: {
      ssl: config.ssl ?? false,
      max: 1, // Single connection for admin tasks
      idle_timeout: config.idleTimeout ?? 60,
      connect_timeout: config.connectTimeout ?? 30
    }
  })
}

/**
 * Connection factory that selects appropriate connection type
 */
export function createDatabaseConnection(
  mode: ConnectionMode,
  config: DatabaseConfig
): PostgresJsDatabase {
  switch (mode) {
    case 'serverless':
      return createServerlessConnection(config)
    case 'pooled':
      return createPooledConnection(config)
    case 'direct':
      return createDirectConnection(config)
    default:
      throw new Error(`Unknown connection mode: ${mode}`)
  }
}

/**
 * Run database migrations
 * Uses direct connection for safety
 */
export async function runMigrations(config: DatabaseConfig, migrationsFolder: string = './drizzle') {
  const db = createDirectConnection(config)
  
  try {
    await migrate(db, { migrationsFolder })
    console.log('✅ Migrations completed successfully')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    // Close connection if needed
    // Note: postgres-js doesn't have explicit close method
    // Connection will be cleaned up by garbage collection
  }
}

/**
 * Test database connection
 */
export async function testConnection(config: DatabaseConfig): Promise<boolean> {
  try {
    const db = createDirectConnection(config)
    
    // Simple query to test connection
    await db.execute(sql`SELECT 1`)
    
    return true
  } catch (error) {
    console.error('Database connection test failed:', error)
    return false
  }
}

/**
 * Get connection configuration from environment
 */
export function getDatabaseConfig(): DatabaseConfig {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL environment variable is required')
  }
  
  return {
    url,
    ssl: process.env.DATABASE_SSL === 'true',
    maxConnections: process.env.DATABASE_MAX_CONNECTIONS 
      ? parseInt(process.env.DATABASE_MAX_CONNECTIONS, 10)
      : undefined,
    idleTimeout: process.env.DATABASE_IDLE_TIMEOUT
      ? parseInt(process.env.DATABASE_IDLE_TIMEOUT, 10)
      : undefined,
    connectTimeout: process.env.DATABASE_CONNECT_TIMEOUT
      ? parseInt(process.env.DATABASE_CONNECT_TIMEOUT, 10)
      : undefined
  }
}

/**
 * Import sql for queries
 */
import { sql } from 'drizzle-orm'
