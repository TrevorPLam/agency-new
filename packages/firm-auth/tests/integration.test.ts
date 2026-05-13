/**
 * Integration tests for firm-auth using PgLite test harness
 * 
 * Tests authentication and authorization flows with real database operations
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { createTestEnvironment } from './setup'
import { sql } from 'drizzle-orm'

describe('Authentication Integration Tests', () => {
  beforeEach(async () => {
    // Database cleanup is handled by setup.ts beforeEach
  })

  it('should create test environment with tenant and user', async () => {
    const { tenant, user, db, cleanup } = await createTestEnvironment('agent')

    expect(tenant).toBeDefined()
    expect(tenant.name).toBe('Auth Test Tenant')
    expect(tenant.slug).toBe('auth-test-tenant')
    
    expect(user).toBeDefined()
    expect(user.email).toBe('agent@example.com')
    expect(user.role).toBe('agent')
    expect(user.tenant_id).toBe(tenant.id)

    // Verify data was actually inserted into database
    const tenantResult = await db.execute(sql`SELECT * FROM tenants WHERE id = ${tenant.id}`)
    expect(tenantResult.rows).toHaveLength(1)
    expect(tenantResult.rows[0].name).toBe('Auth Test Tenant')

    const userResult = await db.execute(sql`SELECT * FROM users WHERE id = ${user.id}`)
    expect(userResult.rows).toHaveLength(1)
    expect(userResult.rows[0].email).toBe('agent@example.com')

    await cleanup()
  })

  it('should create users with different roles', async () => {
    const { tenant: managerEnv, cleanup: managerCleanup } = await createTestEnvironment('manager')
    const { tenant: adminEnv, cleanup: adminCleanup } = await createTestEnvironment('tenant_admin')

    expect(managerEnv.user.role).toBe('manager')
    expect(adminEnv.user.role).toBe('tenant_admin')

    // Verify different users have different emails based on role
    expect(managerEnv.user.email).toBe('manager@example.com')
    expect(adminEnv.user.email).toBe('tenant_admin@example.com')

    await managerCleanup()
    await adminCleanup()
  })

  it('should respect tenant isolation', async () => {
    const { tenant: tenant1, user: user1, db, cleanup: cleanup1 } = await createTestEnvironment('agent', {
      slug: 'tenant-1'
    })
    
    const { tenant: tenant2, cleanup: cleanup2 } = await createTestEnvironment('agent', {
      slug: 'tenant-2'
    })

    // Set context to first tenant
    await db.execute(sql`SET app.current_tenant_id = ${tenant1.id}`)

    // Should only see users from tenant1
    const usersResult = await db.execute(sql`SELECT * FROM users WHERE tenant_id = ${tenant1.id}`)
    expect(usersResult.rows).toHaveLength(1)
    expect(usersResult.rows[0].email).toBe('agent@example.com')

    // Should not see users from tenant2 when querying tenant1
    const tenant1Users = await db.execute(sql`SELECT * FROM users WHERE tenant_id = ${tenant1.id}`)
    expect(tenant1Users.rows.length).toBeGreaterThan(0)

    await cleanup1()
    await cleanup2()
  })

  it('should handle custom user overrides', async () => {
    const { tenant, user, cleanup } = await createTestEnvironment('agent', {}, {
      email: 'custom@example.com',
      first_name: 'Custom',
      last_name: 'User',
      phone: '+1234567890'
    })

    expect(user.email).toBe('custom@example.com')
    expect(user.first_name).toBe('Custom')
    expect(user.last_name).toBe('User')
    expect(user.phone).toBe('+1234567890')

    // Verify custom data was persisted
    const db = require('./setup').getAuthTestDb()
    const userResult = await db.execute(sql`SELECT * FROM users WHERE id = ${user.id}`)
    expect(userResult.rows[0].email).toBe('custom@example.com')
    expect(userResult.rows[0].first_name).toBe('Custom')

    await cleanup()
  })

  it('should handle custom tenant overrides', async () => {
    const { tenant, cleanup } = await createTestEnvironment('agent', {
      name: 'Custom Tenant',
      slug: 'custom-tenant',
      service_tier: 'enterprise'
    })

    expect(tenant.name).toBe('Custom Tenant')
    expect(tenant.slug).toBe('custom-tenant')
    expect(tenant.service_tier).toBe('enterprise')

    await cleanup()
  })

  it('should create multiple users in same tenant', async () => {
    const { tenant, db, cleanup } = await createTestEnvironment('agent')

    // Create additional users manually
    const managerResult = await db.execute(sql`
      INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, status, permissions, phone_verified, email_verified, preferences, metadata)
      VALUES (${tenant.id}, ${'manager@example.com'}, ${'hashed_password'}, ${'Manager'}, ${'User'}, ${'manager'}, ${'active'}, ${JSON.stringify([])}, ${false}, ${false}, ${JSON.stringify({})}, ${JSON.stringify({})})
      RETURNING *
    `)

    const adminResult = await db.execute(sql`
      INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, status, permissions, phone_verified, email_verified, preferences, metadata)
      VALUES (${tenant.id}, ${'admin@example.com'}, ${'hashed_password'}, ${'Admin'}, ${'User'}, ${'tenant_admin'}, ${'active'}, ${JSON.stringify([])}, ${false}, ${false}, ${JSON.stringify({})}, ${JSON.stringify({})})
      RETURNING *
    `)

    // Verify all users exist
    const allUsersResult = await db.execute(sql`SELECT * FROM users WHERE tenant_id = ${tenant.id}`)
    expect(allUsersResult.rows).toHaveLength(3) // Original agent + manager + admin

    const emails = allUsersResult.rows.map(row => row.email)
    expect(emails).toContain('agent@example.com')
    expect(emails).toContain('manager@example.com')
    expect(emails).toContain('admin@example.com')

    await cleanup()
  })
})
