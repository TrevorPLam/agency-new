import { describe, it, expect, beforeEach } from 'vitest'
import { sql } from 'drizzle-orm'
import { getTestDb, createTestTenant, createTestLead, setTenantContext } from './setup'

// Test-specific cursor pagination that works with string table names
async function testCursorPaginate(
  db: ReturnType<typeof getTestDb>,
  tableName: string,
  options: {
    limit?: number
    cursor?: string
    orderBy?: string
    orderDirection?: 'asc' | 'desc'
    where?: any
  } = {}
) {
  const {
    limit = 20,
    cursor,
    orderBy = 'created_at',
    orderDirection = 'desc',
    where
  } = options

  // Parse cursor to extract timestamp and ID
  let cursorCondition = sql`TRUE`
  if (cursor) {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8')
      const { timestamp, id } = JSON.parse(decoded)
      const operator = orderDirection === 'desc' ? '<' : '>'
      cursorCondition = sql`${sql.raw(orderBy)} ${sql.raw(operator)} ${new Date(timestamp)} OR (${sql.raw(orderBy)} = ${new Date(timestamp)} AND id ${sql.raw(operator)} ${id})`
    } catch {
      // Invalid cursor, ignore and start from beginning
    }
  }

  const baseQuery = sql`
    SELECT * FROM ${sql.raw(tableName)}
    WHERE ${where ? where : sql`TRUE`} AND ${cursorCondition}
    ORDER BY ${sql.raw(orderBy)} ${sql.raw(orderDirection.toUpperCase())}
    LIMIT ${limit + 1}
  `

  const results = await db.execute(baseQuery)

  const hasMore = results.rows.length > limit
  const items = hasMore ? results.rows.slice(0, -1) : results.rows

  // Generate next cursor if there are more results
  let nextCursor: string | undefined
  if (hasMore && items.length > 0) {
    const lastItem = items[items.length - 1]
    const cursorData = {
      timestamp: lastItem[orderBy],
      id: lastItem.id
    }
    nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64')
  }

  return {
    items,
    nextCursor,
    hasMore
  }
}

describe('cursorPaginate Integration Tests', () => {
  let testTenant: any
  let testLeads: any[] = []

  beforeEach(async () => {
    const db = getTestDb()
    
    // Create test tenant
    testTenant = await createTestTenant()
    
    // Set tenant context for RLS
    await setTenantContext(testTenant.id)
    
    // Create test leads with different timestamps
    const baseDate = new Date('2024-01-01T00:00:00Z')
    
    for (let i = 0; i < 15; i++) {
      const lead = await createTestLead(testTenant.id, {
        first_name: `Lead ${i + 1}`,
        email: `lead${i + 1}@example.com`,
        created_at: new Date(baseDate.getTime() + i * 60 * 60 * 1000), // 1 hour apart
      })
      testLeads.push(lead)
    }
    
    // Sort leads by created_at descending for consistent testing
    testLeads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  })

  it('should paginate results without cursor (first page)', async () => {
    const db = getTestDb()
    
    const result = await testCursorPaginate(db, 'leads', {
      limit: 5,
      orderBy: 'created_at',
      orderDirection: 'desc'
    })

    expect(result.items).toHaveLength(5)
    expect(result.hasMore).toBe(true)
    expect(result.nextCursor).toBeDefined()
    
    // Verify items are the most recent 5 leads
    for (let i = 0; i < 5; i++) {
      expect(result.items[i].first_name).toBe(testLeads[i].first_name)
    }
  })

  it('should paginate with cursor (second page)', async () => {
    const db = getTestDb()
    
    // Get first page
    const firstPage = await testCursorPaginate(db, 'leads', {
      limit: 5,
      orderBy: 'created_at',
      orderDirection: 'desc'
    })

    // Get second page using cursor
    const secondPage = await testCursorPaginate(db, 'leads', {
      limit: 5,
      cursor: firstPage.nextCursor,
      orderBy: 'created_at',
      orderDirection: 'desc'
    })

    expect(secondPage.items).toHaveLength(5)
    expect(secondPage.hasMore).toBe(true)
    expect(secondPage.nextCursor).toBeDefined()
    
    // Verify items are the next 5 leads
    for (let i = 0; i < 5; i++) {
      expect(secondPage.items[i].first_name).toBe(testLeads[i + 5].first_name)
    }
  })

  it('should handle last page correctly', async () => {
    const db = getTestDb()
    
    // Get last page (items 10-14, but we only have 5 items left)
    const result = await testCursorPaginate(db, 'leads', {
      limit: 10,
      cursor: Buffer.from(JSON.stringify({ 
        timestamp: testLeads[9].created_at, 
        id: testLeads[9].id 
      })).toString('base64'),
      orderBy: 'created_at',
      orderDirection: 'desc'
    })

    expect(result.items).toHaveLength(5) // Only 5 items remaining
    expect(result.hasMore).toBe(false) // No more items
    expect(result.nextCursor).toBeUndefined()
    
    // Verify items are the last 5 leads
    for (let i = 0; i < 5; i++) {
      expect(result.items[i].first_name).toBe(testLeads[i + 10].first_name)
    }
  })

  it('should paginate with ascending order', async () => {
    const db = getTestDb()
    
    const result = await testCursorPaginate(db, 'leads', {
      limit: 5,
      orderBy: 'created_at',
      orderDirection: 'asc'
    })

    expect(result.items).toHaveLength(5)
    expect(result.hasMore).toBe(true)
    
    // Verify items are the oldest 5 leads (ascending order)
    const sortedLeads = [...testLeads].reverse() // Reverse to get ascending order
    for (let i = 0; i < 5; i++) {
      expect(result.items[i].first_name).toBe(sortedLeads[i].first_name)
    }
  })

  it('should handle empty results', async () => {
    const db = getTestDb()
    
    // Clear all leads
    await db.execute(sql`TRUNCATE TABLE leads RESTART IDENTITY CASCADE`)
    
    const result = await testCursorPaginate(db, 'leads', {
      limit: 10,
      orderBy: 'created_at',
      orderDirection: 'desc'
    })

    expect(result.items).toHaveLength(0)
    expect(result.hasMore).toBe(false)
    expect(result.nextCursor).toBeUndefined()
  })

  it('should handle custom where conditions', async () => {
    const db = getTestDb()
    
    const mockWhere = sql`first_name = ${'Lead 3'}`
    
    const result = await testCursorPaginate(db, 'leads', {
      limit: 10,
      where: mockWhere,
      orderBy: 'created_at',
      orderDirection: 'desc'
    })

    expect(result.items).toHaveLength(1)
    expect(result.items[0].first_name).toBe('Lead 3')
    expect(result.hasMore).toBe(false)
  })

  it('should generate proper cursor format', async () => {
    const db = getTestDb()
    
    const result = await testCursorPaginate(db, 'leads', {
      limit: 1,
      orderBy: 'created_at',
      orderDirection: 'desc'
    })

    expect(result.nextCursor).toBeDefined()
    
    // Decode and verify cursor format
    const decoded = Buffer.from(result.nextCursor!, 'base64').toString('utf-8')
    const cursorData = JSON.parse(decoded)
    
    expect(cursorData).toHaveProperty('timestamp')
    expect(cursorData).toHaveProperty('id')
    expect(cursorData.timestamp).toBe(testLeads[0].created_at)
    expect(cursorData.id).toBe(testLeads[0].id)
  })

  it('should handle invalid cursor gracefully', async () => {
    const db = getTestDb()
    
    const result = await testCursorPaginate(db, 'leads', {
      limit: 10,
      cursor: 'invalid-cursor',
      orderBy: 'created_at',
      orderDirection: 'desc'
    })

    // Should fall back to first page behavior
    expect(result.items).toHaveLength(10)
    expect(result.hasMore).toBe(true)
  })

  it('should respect tenant isolation with RLS', async () => {
    const db = getTestDb()
    
    // Create another tenant
    const otherTenant = await createTestTenant({ slug: 'other-tenant' })
    
    // Create leads for other tenant
    await createTestLead(otherTenant.id as string, {
      first_name: 'Other Tenant Lead',
      email: 'other@example.com'
    })
    
    // Set context back to original tenant
    await setTenantContext(testTenant.id)
    
    // Should only return leads from testTenant, not otherTenant
    const result = await testCursorPaginate(db, 'leads', {
      limit: 100,
      orderBy: 'created_at',
      orderDirection: 'desc'
    })

    expect(result.items).toHaveLength(15) // Only our test tenant's leads
    expect(result.items.some(item => item.first_name === 'Other Tenant Lead')).toBe(false)
  })
})
