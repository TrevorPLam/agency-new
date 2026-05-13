import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { sql } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';
import * as schema from '../src/schemas';

// Global test database instance
let testDb: ReturnType<typeof drizzle> | null = null;
let pgLite: PGlite | null = null;

// Test database file path
const testDbPath = path.join(__dirname, '..', '.test-data', 'test.db');

/**
 * Initialize PgLite test database with migrations
 */
async function initializeTestDb(): Promise<ReturnType<typeof drizzle>> {
  // Ensure test data directory exists
  await fs.mkdir(path.dirname(testDbPath), { recursive: true });

  // Remove existing test database for clean state
  try {
    await fs.unlink(testDbPath);
  } catch {
    // File doesn't exist, which is fine
  }

  // Initialize PgLite
  pgLite = new PGlite(testDbPath);
  
  // Create Drizzle instance
  const db = drizzle(pgLite, {
    schema,
    logger: false, // Disable logging in tests
  });

  // Run migrations
  const migrationsPath = path.join(__dirname, '..', 'drizzle');
  try {
    await migrate(db, { migrationsFolder: migrationsPath });
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }

  return db;
}

/**
 * Get the test database instance
 */
export function getTestDb(): ReturnType<typeof drizzle> {
  if (!testDb) {
    throw new Error('Test database not initialized. Call setupTestDb() first.');
  }
  return testDb;
}

/**
 * Setup test database for all tests
 */
beforeAll(async () => {
  testDb = await initializeTestDb();
});

/**
 * Cleanup test database after all tests
 */
afterAll(async () => {
  if (pgLite) {
    await pgLite.close();
  }
  
  // Clean up test database file
  try {
    await fs.unlink(testDbPath);
  } catch {
    // File doesn't exist or can't be deleted
  }
});

/**
 * Clean up database state between tests
 * This removes all data but keeps schema
 */
beforeEach(async () => {
  if (!testDb) return;
  
  // Get all table names and truncate them
  const tables = [
    'audit_logs',
    'bookings', 
    'campaigns',
    'leads',
    'users',
    'tenants',
  ];

  for (const table of tables) {
    try {
      await testDb.execute(sql`TRUNCATE TABLE ${sql.raw(table)} RESTART IDENTITY CASCADE`);
    } catch (error) {
      // Table might not exist, which is fine for testing
    }
  }
});

/**
 * Reset database state after each test
 */
afterEach(async () => {
  // Additional cleanup if needed
});

/**
 * Create a test tenant for use in tests
 */
export async function createTestTenant(overrides: Partial<any> = {}) {
  const db = getTestDb();
  
  const tenantData = {
    name: 'Test Tenant',
    slug: 'test-tenant',
    status: 'active',
    service_tier: 'professional',
    settings: {},
    metadata: {},
    ...overrides,
  };

  const result = await db.execute(sql`
    INSERT INTO tenants (name, slug, status, service_tier, settings, metadata)
    VALUES (${tenantData.name}, ${tenantData.slug}, ${tenantData.status}, ${tenantData.service_tier}, ${JSON.stringify(tenantData.settings)}, ${JSON.stringify(tenantData.metadata)})
    RETURNING *
  `);

  return result.rows[0];
}

/**
 * Create a test user for use in tests
 */
export async function createTestUser(tenantId: string, overrides: Partial<any> = {}) {
  const db = getTestDb();
  
  const userData = {
    tenant_id: tenantId,
    email: 'test@example.com',
    password_hash: 'hashed_password',
    first_name: 'Test',
    last_name: 'User',
    role: 'agent',
    status: 'active',
    permissions: [],
    phone_verified: false,
    email_verified: false,
    preferences: {},
    metadata: {},
    ...overrides,
  };

  const result = await db.execute(sql`
    INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, status, permissions, phone_verified, email_verified, preferences, metadata)
    VALUES (${userData.tenant_id}, ${userData.email}, ${userData.password_hash}, ${userData.first_name}, ${userData.last_name}, ${userData.role}, ${userData.status}, ${JSON.stringify(userData.permissions)}, ${userData.phone_verified}, ${userData.email_verified}, ${JSON.stringify(userData.preferences)}, ${JSON.stringify(userData.metadata)})
    RETURNING *
  `);

  return result.rows[0];
}

/**
 * Create a test lead for use in tests
 */
export async function createTestLead(tenantId: string, overrides: Partial<any> = {}) {
  const db = getTestDb();
  
  const leadData = {
    tenant_id: tenantId,
    first_name: 'Test',
    last_name: 'Lead',
    email: 'lead@example.com',
    phone: '+1234567890',
    company: 'Test Company',
    job_title: 'Test Position',
    status: 'new',
    source: 'manual',
    score: 'cold',
    score_value: 0,
    tags: [],
    custom_fields: {},
    metadata: {},
    ...overrides,
  };

  const result = await db.execute(sql`
    INSERT INTO leads (tenant_id, first_name, last_name, email, phone, company, job_title, status, source, score, score_value, tags, custom_fields, metadata)
    VALUES (${leadData.tenant_id}, ${leadData.first_name}, ${leadData.last_name}, ${leadData.email}, ${leadData.phone}, ${leadData.company}, ${leadData.job_title}, ${leadData.status}, ${leadData.source}, ${leadData.score}, ${leadData.score_value}, ${leadData.tags}, ${JSON.stringify(leadData.custom_fields)}, ${JSON.stringify(leadData.metadata)})
    RETURNING *
  `);

  return result.rows[0];
}

/**
 * Set tenant context for RLS testing
 */
export async function setTenantContext(tenantId: string) {
  const db = getTestDb();
  await db.execute(sql`SET app.current_tenant_id = ${tenantId}`);
}

/**
 * Clear tenant context
 */
export async function clearTenantContext() {
  const db = getTestDb();
  await db.execute(sql`RESET app.current_tenant_id`);
}
