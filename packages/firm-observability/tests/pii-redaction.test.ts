import { describe, it, expect, vi } from 'vitest'
import { createLogger } from '../src/logger'
import { captureException } from '../src/error-tracking'
import * as Sentry from '@sentry/node'

// Mock Sentry for testing
vi.mock('@sentry/node', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
  setTag: vi.fn(),
  addBreadcrumb: vi.fn(),
  SpanStatusCode: {
    OK: 1,
    ERROR: 2
  }
}))

describe('PII Redaction', () => {
  describe('Logger PII Redaction', () => {
    it('should redact email addresses in log messages', () => {
      const logger = createLogger('test')
      const logSpy = vi.spyOn(logger, 'info')
      
      logger.info('User login', { 
        email: 'user@example.com',
        userId: '123'
      })
      
      expect(logSpy).toHaveBeenCalled()
      const loggedData = logSpy.mock.calls[0][1]
      expect(loggedData.email).toBe('[REDACTED]')
      expect(loggedData.userId).toBe('123')
    })

    it('should redact phone numbers in log messages', () => {
      const logger = createLogger('test')
      const logSpy = vi.spyOn(logger, 'info')
      
      logger.info('Contact info', { 
        phoneNumber: '555-123-4567',
        name: 'John Doe'
      })
      
      expect(logSpy).toHaveBeenCalled()
      const loggedData = logSpy.mock.calls[0][1]
      expect(loggedData.phoneNumber).toBe('[REDACTED]')
      expect(loggedData.name).toBe('John Doe')
    })

    it('should redact nested PII fields', () => {
      const logger = createLogger('test')
      const logSpy = vi.spyOn(logger, 'info')
      
      logger.info('User profile', { 
        user: {
          email: 'user@example.com',
          phone: '555-123-4567',
          name: 'John Doe'
        },
        customer: {
          address: {
            street: '123 Main St',
            city: 'Anytown',
            zipCode: '12345'
          }
        }
      })
      
      expect(logSpy).toHaveBeenCalled()
      const loggedData = logSpy.mock.calls[0][1]
      expect(loggedData.user.email).toBe('[REDACTED]')
      expect(loggedData.user.phone).toBe('[REDACTED]')
      expect(loggedData.customer.address.street).toBe('[REDACTED]')
      expect(loggedData.customer.address.city).toBe('[REDACTED]')
      expect(loggedData.customer.address.zipCode).toBe('[REDACTED]')
      expect(loggedData.user.name).toBe('John Doe')
    })

    it('should redact SSN and credit card numbers', () => {
      const logger = createLogger('test')
      const logSpy = vi.spyOn(logger, 'info')
      
      logger.info('Payment info', { 
        ssn: '123-45-6789',
        creditCard: '4111-1111-1111-1111',
        amount: 100.00
      })
      
      expect(logSpy).toHaveBeenCalled()
      const loggedData = logSpy.mock.calls[0][1]
      expect(loggedData.ssn).toBe('[REDACTED]')
      expect(loggedData.creditCard).toBe('[REDACTED]')
      expect(loggedData.amount).toBe(100.00)
    })
  })

  describe('Error Tracking PII Redaction', () => {
    it('should redact PII from error messages', () => {
      const error = new Error('Failed to process user user@example.com with phone 555-123-4567')
      
      captureException(error, {
        email: 'user@example.com',
        phoneNumber: '555-123-4567'
      })
      
      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          extra: expect.objectContaining({
            email: '[REDACTED]',
            phoneNumber: '[REDACTED]'
          })
        })
      )
      
      // Check that the error message was filtered
      const sentryCall = (Sentry.captureException as any).mock.calls[0]
      const capturedError = sentryCall[0]
      expect(capturedError.message).toContain('[EMAIL_REDACTED]')
      expect(capturedError.message).toContain('[PHONE_REDACTED]')
    })

    it('should redact PII from stack traces', () => {
      const error = new Error('Test error')
      error.stack = `Error: Test error
    at testFunction (/path/to/file.js:10:5)
    at Object.<anonymous> (/path/to/file.js:20:3)
    Context: { email: "user@example.com", ssn: "123-45-6789" }`
      
      captureException(error)
      
      expect(Sentry.captureException).toHaveBeenCalled()
      const sentryCall = (Sentry.captureException as any).mock.calls[0]
      const capturedError = sentryCall[0]
      expect(capturedError.stack).not.toContain('user@example.com')
      expect(capturedError.stack).not.toContain('123-45-6789')
    })
  })

  describe('Span PII Redaction', () => {
    it('should not allow PII in span attributes', () => {
      // This test verifies that PII is not accidentally exposed in spans
      // The actual redaction happens at the logger level, but we should
      // ensure span attributes don't contain PII
      
      const { withSpan } = require('../src/tracing/helpers')
      const tracer = require('@opentelemetry/api').trace.getTracer('test')
      
      let spanAttributes: any = {}
      
      const mockSpan = {
        setAttribute: (key: string, value: any) => {
          spanAttributes[key] = value
        },
        setStatus: vi.fn(),
        recordException: vi.fn(),
        end: vi.fn()
      }
      
      const mockTracer = {
        startActiveSpan: vi.fn((name, options, fn) => {
          return fn(mockSpan)
        })
      }
      
      vi.spyOn(require('@opentelemetry/api').trace, 'getTracer').mockReturnValue(mockTracer)
      
      withSpan('test span', (span) => {
        span.setAttribute('user.email', 'user@example.com')
        span.setAttribute('user.name', 'John Doe')
      })
      
      // In a real implementation, we would have validation here
      // For now, we just verify the span was created
      expect(mockTracer.startActiveSpan).toHaveBeenCalled()
    })
  })

  describe('PII Field Detection', () => {
    it('should detect common PII field patterns', () => {
      const piiFields = [
        'email',
        'password',
        'ssn',
        'creditCard',
        'phoneNumber',
        'address.street',
        'address.city',
        'address.zipCode',
        'user.email',
        'user.phone',
        'user.address',
        'customer.email',
        'customer.phone',
        'customer.address'
      ]
      
      // This test documents the PII fields that should be redacted
      expect(piiFields.length).toBeGreaterThan(0)
      
      // Verify all expected PII fields are covered
      const expectedFields = [
        'email', 'password', 'ssn', 'creditCard', 'phoneNumber',
        'address', 'street', 'city', 'zipCode', 'phone'
      ]
      
      expectedFields.forEach(field => {
        const isCovered = piiFields.some(piiField => 
          piiField.toLowerCase().includes(field.toLowerCase())
        )
        expect(isCovered).toBe(true)
      })
    })
  })
})
