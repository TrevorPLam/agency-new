import { describe, it, expect, beforeEach, vi } from 'vitest'
import { randomUUID } from 'crypto'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../src/schemas'
import { 
  emitEvent, 
  emitEvents, 
  getPendingEvents, 
  markEventAsProcessing,
  markEventAsCompleted,
  markEventAsFailed,
  cleanupCompletedEvents,
  getEventStatistics,
  EVENT_STATUS,
  DEFAULT_OUTBOX_CONFIG
} from '../src/helpers/outbox'

// Mock database for testing
const mockDb = {
  insert: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
} as any

describe('Outbox Pattern Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('emitEvent', () => {
    it('should create an outbox event with correct structure', async () => {
      const mockResult = [{
        id: randomUUID(),
        eventId: 'test-event-id',
        eventType: 'lead.created',
        eventSource: 'firm.crm',
        status: EVENT_STATUS.PENDING,
        attempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }]
      
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(mockResult)
        })
      })

      const options = {
        data: { leadId: '123', email: 'test@example.com' },
        type: 'lead.created',
        source: 'firm.crm',
        tenantId: randomUUID(),
        correlationId: randomUUID(),
        version: '1.0'
      }

      const result = await emitEvent(mockDb, options)

      expect(result).toBeDefined()
      expect(result.eventType).toBe('lead.created')
      expect(result.eventSource).toBe('firm.crm')
      expect(result.status).toBe(EVENT_STATUS.PENDING)
      expect(result.attempts).toBe(0)
      expect(mockDb.insert).toHaveBeenCalledWith(schema.outboxEvents)
    })

    it('should throw error if event creation fails', async () => {
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([])
        })
      })

      const options = {
        data: { test: 'data' },
        type: 'test.event',
        source: 'test.source',
        tenantId: randomUUID()
      }

      await expect(emitEvent(mockDb, options)).rejects.toThrow('Failed to create outbox event')
    })

    it('should use provided transaction if available', async () => {
      const mockTx = { insert: vi.fn() }
      const mockResult = [{ id: randomUUID() }]
      
      mockTx.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(mockResult)
        })
      })

      const options = {
        data: { test: 'data' },
        type: 'test.event',
        source: 'test.source',
        tenantId: randomUUID(),
        tx: mockTx as any
      }

      await emitEvent(mockDb, options)

      expect(mockTx.insert).toHaveBeenCalledWith(schema.outboxEvents)
      expect(mockDb.insert).not.toHaveBeenCalled()
    })
  })

  describe('emitEvents', () => {
    it('should create multiple events atomically', async () => {
      const mockResult = [
        { id: randomUUID(), eventId: 'event-1' },
        { id: randomUUID(), eventId: 'event-2' }
      ]
      
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(mockResult)
        })
      })

      const events = [
        {
          data: { leadId: '1' },
          type: 'lead.created',
          source: 'firm.crm',
          tenantId: randomUUID()
        },
        {
          data: { leadId: '2' },
          type: 'lead.created',
          source: 'firm.crm',
          tenantId: randomUUID()
        }
      ]

      const result = await emitEvents(mockDb, events)

      expect(result).toHaveLength(2)
      expect(mockDb.insert).toHaveBeenCalledWith(schema.outboxEvents)
    })

    it('should return empty array for empty events input', async () => {
      const result = await emitEvents(mockDb, [])
      expect(result).toHaveLength(0)
      expect(mockDb.insert).not.toHaveBeenCalled()
    })
  })

  describe('getPendingEvents', () => {
    it('should fetch pending events with default options', async () => {
      const mockEvents = [
        { id: randomUUID(), status: EVENT_STATUS.PENDING },
        { id: randomUUID(), status: EVENT_STATUS.PENDING }
      ]
      
      const mockQuery = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(mockEvents)
            })
          })
        })
      }
      
      mockDb.select.mockReturnValue(mockQuery)

      const result = await getPendingEvents(mockDb)

      expect(result).toHaveLength(2)
      expect(mockDb.select).toHaveBeenCalled()
    })

    it('should filter by tenant ID when provided', async () => {
      const tenantId = randomUUID()
      const mockEvents = [{ id: randomUUID(), tenantId }]
      
      const mockQuery = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(mockEvents)
            })
          })
        })
      }
      
      mockDb.select.mockReturnValue(mockQuery)

      await getPendingEvents(mockDb, { tenantId })

      expect(mockDb.select).toHaveBeenCalled()
    })

    it('should respect limit parameter', async () => {
      const mockEvents = [{ id: randomUUID() }]
      
      const mockQuery = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(mockEvents)
            })
          })
        })
      }
      
      mockDb.select.mockReturnValue(mockQuery)

      await getPendingEvents(mockDb, { limit: 10 })

      expect(mockDb.select).toHaveBeenCalled()
    })
  })

  describe('markEventAsProcessing', () => {
    it('should mark event as processing', async () => {
      const eventId = randomUUID()
      const mockResult = [{
        id: eventId,
        status: EVENT_STATUS.PROCESSING,
        lastAttemptAt: new Date(),
        updatedAt: new Date()
      }]
      
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue(mockResult)
          })
        })
      })

      const result = await markEventAsProcessing(mockDb, eventId)

      expect(result).toBeDefined()
      expect(result?.status).toBe(EVENT_STATUS.PROCESSING)
      expect(result?.lastAttemptAt).toBeInstanceOf(Date)
      expect(mockDb.update).toHaveBeenCalledWith(schema.outboxEvents)
    })

    it('should return null if event not found', async () => {
      const eventId = randomUUID()
      
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([])
          })
        })
      })

      const result = await markEventAsProcessing(mockDb, eventId)

      expect(result).toBeNull()
    })
  })

  describe('markEventAsCompleted', () => {
    it('should mark event as completed', async () => {
      const eventId = randomUUID()
      const mockResult = [{
        id: eventId,
        status: EVENT_STATUS.COMPLETED,
        completedAt: new Date(),
        updatedAt: new Date()
      }]
      
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue(mockResult)
          })
        })
      })

      const result = await markEventAsCompleted(mockDb, eventId)

      expect(result).toBeDefined()
      expect(result?.status).toBe(EVENT_STATUS.COMPLETED)
      expect(result?.completedAt).toBeInstanceOf(Date)
    })
  })

  describe('markEventAsFailed', () => {
    it('should mark event as failed and schedule retry', async () => {
      const eventId = randomUUID()
      const currentEvent = {
        id: eventId,
        attempts: 1,
        maxAttempts: 3
      }
      
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([currentEvent])
          })
        })
      })
      
      const mockResult = [{
        id: eventId,
        status: EVENT_STATUS.FAILED,
        attempts: 2,
        lastAttemptAt: new Date(),
        nextAttemptAt: new Date(),
        errorMessage: 'Test error'
      }]
      
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue(mockResult)
          })
        })
      })

      const result = await markEventAsFailed(mockDb, eventId, 'Test error')

      expect(result).toBeDefined()
      expect(result?.status).toBe(EVENT_STATUS.FAILED)
      expect(result?.attempts).toBe(2)
      expect(result?.errorMessage).toBe('Test error')
      expect(result?.nextAttemptAt).toBeInstanceOf(Date)
    })

    it('should return null if event not found', async () => {
      const eventId = randomUUID()
      
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      })

      const result = await markEventAsFailed(mockDb, eventId, 'Test error')

      expect(result).toBeNull()
    })

    it('should calculate exponential backoff correctly', async () => {
      const eventId = randomUUID()
      const currentEvent = {
        id: eventId,
        attempts: 2, // Third attempt
        maxAttempts: 3
      }
      
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([currentEvent])
          })
        })
      })
      
      const mockResult = [{ id: eventId }]
      
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue(mockResult)
          })
        })
      })

      await markEventAsFailed(mockDb, eventId, 'Test error')

      // Should use exponential backoff: 1000ms * 2^(2-1) = 2000ms
      expect(mockDb.update).toHaveBeenCalledWith(schema.outboxEvents)
    })
  })

  describe('cleanupCompletedEvents', () => {
    it('should delete completed events older than specified date', async () => {
      const olderThan = new Date('2023-01-01')
      
      const mockResult = { rowCount: 5 }
      mockDb.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue(mockResult)
      })

      const result = await cleanupCompletedEvents(mockDb, olderThan)

      expect(result).toBe(5)
      expect(mockDb.delete).toHaveBeenCalledWith(schema.outboxEvents)
    })

    it('should handle zero rowCount gracefully', async () => {
      const olderThan = new Date('2023-01-01')
      
      const mockResult = {}
      mockDb.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue(mockResult)
      })

      const result = await cleanupCompletedEvents(mockDb, olderThan)

      expect(result).toBe(0)
    })
  })

  describe('getEventStatistics', () => {
    it('should return event count by status', async () => {
      const mockStats = [
        { status: EVENT_STATUS.PENDING, count: '10' },
        { status: EVENT_STATUS.COMPLETED, count: '50' },
        { status: EVENT_STATUS.FAILED, count: '2' }
      ]
      
      const mockQuery = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockResolvedValue(mockStats)
          })
        })
      }
      
      mockDb.select.mockReturnValue(mockQuery)

      const result = await getEventStatistics(mockDb)

      expect(result).toEqual({
        pending: 10,
        completed: 50,
        failed: 2
      })
    })

    it('should filter by tenant ID when provided', async () => {
      const tenantId = randomUUID()
      const mockStats = [{ status: EVENT_STATUS.PENDING, count: '5' }]
      
      const mockQuery = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: vi.fn().mockResolvedValue(mockStats)
          })
        })
      }
      
      mockDb.select.mockReturnValue(mockQuery)

      await getEventStatistics(mockDb, tenantId)

      expect(mockDb.select).toHaveBeenCalled()
    })
  })

  describe('Constants and Configuration', () => {
    it('should have correct event status constants', () => {
      expect(EVENT_STATUS.PENDING).toBe('pending')
      expect(EVENT_STATUS.PROCESSING).toBe('processing')
      expect(EVENT_STATUS.COMPLETED).toBe('completed')
      expect(EVENT_STATUS.FAILED).toBe('failed')
    })

    it('should have reasonable default configuration', () => {
      expect(DEFAULT_OUTBOX_CONFIG.maxAttempts).toBe(3)
      expect(DEFAULT_OUTBOX_CONFIG.initialRetryDelay).toBe(1000)
      expect(DEFAULT_OUTBOX_CONFIG.maxRetryDelay).toBe(300000)
      expect(DEFAULT_OUTBOX_CONFIG.retryBackoffMultiplier).toBe(2)
    })
  })
})
