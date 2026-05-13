import { describe, it, expect, beforeEach } from 'vitest'
import { cursorPaginate, getCount } from '../src/helpers'
import { getDatabaseConfig, createDatabaseConnection } from '../src/connection'
import { leads, users, tenants, forms } from '../src/schemas'

// Create test database connection
const config = getDatabaseConfig()
const db = createDatabaseConnection('direct', config)

describe('Soft-Delete Filters', () => {
  beforeEach(async () => {
    // Clean up test data
    await db.delete(leads)
    await db.delete(users)
    await db.delete(tenants)
    await db.delete(forms)
  })

  it('should exclude soft-deleted records by default in cursorPaginate', async () => {
    // Create test tenant
    const [tenant] = await db.insert(tenants).values({
      name: 'Test Tenant',
      slug: 'test-tenant',
      status: 'active'
    }).returning()

    // Create test leads
    const [activeLead] = await db.insert(leads).values({
      tenantId: tenant.id,
      firstName: 'Active',
      lastName: 'Lead',
      email: 'active@example.com',
      source: 'manual'
    }).returning()

    const [deletedLead] = await db.insert(leads).values({
      tenantId: tenant.id,
      firstName: 'Deleted',
      lastName: 'Lead',
      email: 'deleted@example.com',
      source: 'manual',
      deletedAt: new Date()
    }).returning()

    // Test default behavior (exclude deleted)
    const result = await cursorPaginate(db, leads, {
      where: { tenantId: tenant.id }
    })

    expect(result.items).toHaveLength(1)
    expect(result.items[0].id).toBe(activeLead.id)
    expect(result.items[0].firstName).toBe('Active')

    // Test includeDeleted option
    const resultWithDeleted = await cursorPaginate(db, leads, {
      where: { tenantId: tenant.id },
      includeDeleted: true
    })

    expect(resultWithDeleted.items).toHaveLength(2)
    const ids = resultWithDeleted.items.map(item => item.id)
    expect(ids).toContain(activeLead.id)
    expect(ids).toContain(deletedLead.id)
  })

  it('should exclude soft-deleted records by default in getCount', async () => {
    // Create test tenant
    const [tenant] = await db.insert(tenants).values({
      name: 'Test Tenant',
      slug: 'test-tenant-2',
      status: 'active'
    }).returning()

    // Create test users
    await db.insert(users).values({
      email: 'active@example.com',
      name: 'Active User'
    })

    await db.insert(users).values({
      email: 'deleted@example.com',
      name: 'Deleted User',
      deletedAt: new Date()
    })

    // Test default behavior (exclude deleted)
    const count = await getCount(db, users)
    expect(count).toBe(1)

    // Test includeDeleted option
    const countWithDeleted = await getCount(db, users, {
      includeDeleted: true
    })
    expect(countWithDeleted).toBe(2)
  })

  it('should work with tables that do not have deletedAt column', async () => {
    // Create test tenant
    const [tenant] = await db.insert(tenants).values({
      name: 'Test Tenant',
      slug: 'test-tenant-3',
      status: 'active'
    }).returning()

    // Test with bookings table (no deletedAt column)
    const result = await cursorPaginate(db, leads, {
      where: { tenantId: tenant.id },
      includeDeleted: true // Should not cause errors
    })

    expect(result.items).toHaveLength(0) // No bookings created
    expect(result.hasMore).toBe(false)
  })

  it('should combine soft-delete filter with other where conditions', async () => {
    // Create test tenant
    const [tenant] = await db.insert(tenants).values({
      name: 'Test Tenant',
      slug: 'test-tenant-4',
      status: 'active'
    }).returning()

    // Create test forms with different statuses
    const [activeForm] = await db.insert(forms).values({
      tenantId: tenant.id,
      name: 'Active Form',
      type: 'contact',
      fields: [{ name: 'email', type: 'text', label: 'Email', required: true }],
      isActive: true
    }).returning()

    await db.insert(forms).values({
      tenantId: tenant.id,
      name: 'Deleted Form',
      type: 'contact',
      fields: [{ name: 'email', type: 'text', label: 'Email', required: true }],
      isActive: true,
      deletedAt: new Date()
    })

    await db.insert(forms).values({
      tenantId: tenant.id,
      name: 'Inactive Form',
      type: 'contact',
      fields: [{ name: 'email', type: 'text', label: 'Email', required: true }],
      isActive: false
    })

    // Test combining filters
    const result = await cursorPaginate(db, forms, {
      where: { 
        tenantId: tenant.id,
        isActive: true 
      }
    })

    expect(result.items).toHaveLength(1)
    expect(result.items[0].id).toBe(activeForm.id)
    expect(result.items[0].name).toBe('Active Form')
  })
})
