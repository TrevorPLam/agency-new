import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import { sql } from 'drizzle-orm'
import fs from 'fs/promises'
import path from 'path'

// Import the firm-db setup utilities
import { 
  getTestDb as getFirmTestDb, 
  createTestTenant, 
  createTestUser, 
  setTenantContext,
  clearTenantContext 
} from '@firm/db/tests/setup'

// Global test database instance for auth-specific tests
let authTestDb: ReturnType<typeof drizzle> | null = null
let pgLite: PGlite | null = null

// Test database file path
const testDbPath = path.join(__dirname, '..', '.test-data', 'auth-test.db')

/**
 * Initialize PgLite test database with migrations for auth tests
 */
async function initializeAuthTestDb(): Promise<ReturnType<typeof drizzle>> {
  // Ensure test data directory exists
  await fs.mkdir(path.dirname(testDbPath), { recursive: true })

  // Remove existing test database for clean state
  try {
    await fs.unlink(testDbPath)
  } catch {
    // File doesn't exist, which is fine
  }

  // Initialize PgLite
  pgLite = new PGlite(testDbPath)
  
  // Create Drizzle instance
  const db = drizzle(pgLite, {
    logger: false, // Disable logging in tests
  })

  // Run migrations from firm-db
  const migrationsPath = path.join(__dirname, '..', '..', 'firm-db', 'drizzle')
  try {
    await migrate(db, { migrationsFolder: migrationsPath })
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }

  return db
}

/**
 * Get the auth test database instance
 */
export function getAuthTestDb(): ReturnType<typeof drizzle> {
  if (!authTestDb) {
    throw new Error('Auth test database not initialized. Call setupAuthTestDb() first.')
  }
  return authTestDb
}

/**
 * Setup auth test database for all tests
 */
beforeAll(async () => {
  authTestDb = await initializeAuthTestDb()
})

/**
 * Cleanup auth test database after all tests
 */
afterAll(async () => {
  if (pgLite) {
    await pgLite.close()
  }
  
  // Clean up test database file
  try {
    await fs.unlink(testDbPath)
  } catch {
    // File doesn't exist or can't be deleted
  }
})

/**
 * Clean up database state between tests
 */
beforeEach(async () => {
  if (!authTestDb) return
  
  // Get all table names and truncate them
  const tables = [
    'audit_logs',
    'bookings', 
    'campaigns',
    'leads',
    'users',
    'tenants',
  ]

  for (const table of tables) {
    try {
      await authTestDb.execute(sql`TRUNCATE TABLE ${sql.raw(table)} RESTART IDENTITY CASCADE`)
    } catch (error) {
      // Table might not exist, which is fine for testing
    }
  }
})

/**
 * Reset database state after each test
 */
afterEach(async () => {
  // Additional cleanup if needed
})

/**
 * Create a test tenant for auth tests
 */
export async function createAuthTestTenant(overrides: Partial<any> = {}) {
  const db = getAuthTestDb()
  
  const tenantData = {
    name: 'Auth Test Tenant',
    slug: 'auth-test-tenant',
    status: 'active',
    service_tier: 'professional',
    settings: {},
    metadata: {},
    ...overrides,
  }

  const result = await db.execute(sql`
    INSERT INTO tenants (name, slug, status, service_tier, settings, metadata)
    VALUES (${tenantData.name}, ${tenantData.slug}, ${tenantData.status}, ${tenantData.service_tier}, ${JSON.stringify(tenantData.settings)}, ${JSON.stringify(tenantData.metadata)})
    RETURNING *
  `)

  return result.rows[0]
}

/**
 * Create a test user for auth tests
 */
export async function createAuthTestUser(tenantId: string, overrides: Partial<any> = {}) {
  const db = getAuthTestDb()
  
  const userData = {
    tenant_id: tenantId,
    email: 'auth-test@example.com',
    password_hash: 'hashed_password',
    first_name: 'Auth',
    last_name: 'Test',
    role: 'agent',
    status: 'active',
    permissions: [],
    phone_verified: false,
    email_verified: false,
    preferences: {},
    metadata: {},
    ...overrides,
  }

  const result = await db.execute(sql`
    INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, status, permissions, phone_verified, email_verified, preferences, metadata)
    VALUES (${userData.tenant_id}, ${userData.email}, ${userData.password_hash}, ${userData.first_name}, ${userData.last_name}, ${userData.role}, ${userData.status}, ${JSON.stringify(userData.permissions)}, ${userData.phone_verified}, ${userData.email_verified}, ${JSON.stringify(userData.preferences)}, ${JSON.stringify(userData.metadata)})
    RETURNING *
  `)

  return result.rows[0]
}

/**
 * Create a test user with specific role for permission testing
 */
export async function createTestUserWithRole(tenantId: string, role: string, overrides: Partial<any> = {}) {
  return createAuthTestUser(tenantId, {
    role,
    email: `${role}@example.com`,
    first_name: role.charAt(0).toUpperCase() + role.slice(1),
    last_name: 'User',
    ...overrides,
  })
}

/**
 * Set tenant context for RLS testing
 */
export async function setAuthTenantContext(tenantId: string) {
  const db = getAuthTestDb()
  await db.execute(sql`SET app.current_tenant_id = ${tenantId}`)
}

/**
 * Clear tenant context
 */
export async function clearAuthTenantContext() {
  const db = getAuthTestDb()
  await db.execute(sql`RESET app.current_tenant_id`)
}

/**
 * Create a complete test environment with tenant and user
 */
export async function createTestEnvironment(userRole: string = 'agent', tenantOverrides: Partial<any> = {}, userOverrides: Partial<any> = {}) {
  // Create tenant
  const tenant = await createAuthTestTenant(tenantOverrides)
  
  // Set tenant context
  await setAuthTenantContext(tenant.id as string)
  
  // Create user with specified role
  const user = await createTestUserWithRole(tenant.id as string, userRole, userOverrides)
  
  return {
    tenant,
    user,
    db: getAuthTestDb(),
    cleanup: async () => {
      await clearAuthTenantContext()
    }
  }
}

// Re-export firm-db utilities for convenience
export {
  getFirmTestDb,
  createTestTenant,
  createTestUser,
  setTenantContext,
  clearTenantContext
}
