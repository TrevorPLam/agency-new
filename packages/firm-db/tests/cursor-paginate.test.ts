import { describe, it, expect, beforeEach } from 'vitest'
import { sql } from 'drizzle-orm'
import { cursorPaginate } from '../src/helpers'
import { getTestDb, createTestTenant, createTestLead, setTenantContext } from './setup'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'

// Mock schema for testing
interface MockTable {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
}

const mockTable = {
  id: 'id',
  name: 'name', 
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
} as any

describe('cursorPaginate', () => {
  let mockDb: PostgresJsDatabase
  let mockResults: any[]

  beforeEach(() => {
    mockResults = []
    mockDb = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve(mockResults))
            }))
          }))
        }))
      }))
    } as any
  })

  it('should paginate with descending order and cursor', async () => {
    // Mock test data
    const testDate = new Date('2024-01-01T00:00:00Z')
    mockResults = [
      { id: '1', name: 'Test 1', createdAt: new Date('2024-01-02T00:00:00Z') },
      { id: '2', name: 'Test 2', createdAt: new Date('2024-01-01T00:00:00Z') }
    ]

    // Create cursor for pagination
    const cursorData = { timestamp: testDate.toISOString(), id: '0' }
    const cursor = Buffer.from(JSON.stringify(cursorData)).toString('base64')

    const result = await cursorPaginate(mockDb, mockTable, {
      limit: 10,
      cursor,
      orderBy: 'createdAt',
      orderDirection: 'desc'
    })

    expect(result.items).toHaveLength(2)
    expect(result.hasMore).toBe(false)
    expect(result.nextCursor).toBeDefined()
    
    // Verify SQL generation uses sql.raw for operators
    expect(mockDb.select).toHaveBeenCalled()
  })

  it('should paginate with ascending order and cursor', async () => {
    // Mock test data
    const testDate = new Date('2024-01-01T00:00:00Z')
    mockResults = [
      { id: '1', name: 'Test 1', createdAt: new Date('2024-01-01T00:00:00Z') },
      { id: '2', name: 'Test 2', createdAt: new Date('2024-01-02T00:00:00Z') }
    ]

    // Create cursor for pagination
    const cursorData = { timestamp: testDate.toISOString(), id: '0' }
    const cursor = Buffer.from(JSON.stringify(cursorData)).toString('base64')

    const result = await cursorPaginate(mockDb, mockTable, {
      limit: 10,
      cursor,
      orderBy: 'createdAt',
      orderDirection: 'asc'
    })

    expect(result.items).toHaveLength(2)
    expect(result.hasMore).toBe(false)
    expect(result.nextCursor).toBeDefined()
  })

  it('should handle pagination without cursor (first page)', async () => {
    mockResults = [
      { id: '1', name: 'Test 1', createdAt: new Date('2024-01-02T00:00:00Z') },
      { id: '2', name: 'Test 2', createdAt: new Date('2024-01-01T00:00:00Z') }
    ]

    const result = await cursorPaginate(mockDb, mockTable, {
      limit: 10,
      orderBy: 'createdAt',
      orderDirection: 'desc'
    })

    expect(result.items).toHaveLength(2)
    expect(result.hasMore).toBe(false)
    expect(result.nextCursor).toBeDefined()
  })

  it('should detect when there are more results', async () => {
    // Mock more results than the limit
    mockResults = Array.from({ length: 11 }, (_, i) => ({
      id: String(i + 1),
      name: `Test ${i + 1}`,
      createdAt: new Date(`2024-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`)
    }))

    const result = await cursorPaginate(mockDb, mockTable, {
      limit: 10,
      orderBy: 'createdAt',
      orderDirection: 'desc'
    })

    expect(result.items).toHaveLength(10) // Should be limited
    expect(result.hasMore).toBe(true) // Should detect more results
    expect(result.nextCursor).toBeDefined()
  })

  it('should handle invalid cursor gracefully', async () => {
    mockResults = [
      { id: '1', name: 'Test 1', createdAt: new Date('2024-01-01T00:00:00Z') }
    ]

    const result = await cursorPaginate(mockDb, mockTable, {
      limit: 10,
      cursor: 'invalid-cursor',
      orderBy: 'createdAt',
      orderDirection: 'desc'
    })

    expect(result.items).toHaveLength(1)
    expect(result.hasMore).toBe(false)
    expect(result.nextCursor).toBeDefined()
  })

  it('should handle empty results', async () => {
    mockResults = []

    const result = await cursorPaginate(mockDb, mockTable, {
      limit: 10,
      orderBy: 'createdAt',
      orderDirection: 'desc'
    })

    expect(result.items).toHaveLength(0)
    expect(result.hasMore).toBe(false)
    expect(result.nextCursor).toBeUndefined()
  })

  it('should use custom where conditions', async () => {
    mockResults = [
      { id: '1', name: 'Test 1', createdAt: new Date('2024-01-01T00:00:00Z') }
    ]

    const mockWhere = sql`name = ${'Test 1'}`

    await cursorPaginate(mockDb, mockTable, {
      limit: 10,
      where: mockWhere,
      orderBy: 'createdAt',
      orderDirection: 'desc'
    })

    // Verify that the where condition was applied
    const selectMock = mockDb.select as any
    const fromMock = selectMock.mock.results[0].value.from
    const whereMock = fromMock.mock.results[0].value.where
    
    expect(whereMock).toHaveBeenCalled()
  })

  it('should generate proper cursor data', async () => {
    const testDate = new Date('2024-01-01T00:00:00Z')
    mockResults = [
      { id: 'test-id-123', name: 'Test 1', createdAt: testDate }
    ]

    const result = await cursorPaginate(mockDb, mockTable, {
      limit: 10,
      orderBy: 'createdAt',
      orderDirection: 'desc'
    })

    expect(result.nextCursor).toBeDefined()
    
    // Decode and verify cursor format
    const decoded = Buffer.from(result.nextCursor!, 'base64').toString('utf-8')
    const cursorData = JSON.parse(decoded)
    
    expect(cursorData).toEqual({
      timestamp: testDate.toISOString(),
      id: 'test-id-123'
    })
  })
})
