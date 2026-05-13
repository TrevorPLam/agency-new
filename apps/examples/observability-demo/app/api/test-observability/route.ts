/**
 * API Route for Testing Observability
 * 
 * This endpoint demonstrates various observability features.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withSpan, getLogger, captureException, platformMetrics } from '@firm/observability'

const logger = getLogger()

export async function GET(request: NextRequest) {
  return await withSpan('api-test-observability', async (span) => {
    try {
      // Set span attributes
      span.setAttributes({
        'http.method': 'GET',
        'http.url': request.url,
        'user.agent': request.headers.get('user-agent') || 'unknown',
      })

      // Log the request
      logger.info('Observability test API called', {
        method: 'GET',
        url: request.url,
        userAgent: request.headers.get('user-agent'),
      })

      // Increment HTTP request counter
      platformMetrics.httpRequestsTotal.add(1, {
        method: 'GET',
        route: '/api/test-observability',
        status: '200',
      })

      // Simulate some work with nested spans
      const result = await withSpan('database-query', async (dbSpan) => {
        dbSpan.setAttributes({ query: 'SELECT * FROM test_table' })
        
        // Simulate database delay
        await new Promise(resolve => setTimeout(resolve, 100))
        
        logger.info('Database query completed', { 
          rows: 42,
          duration: '100ms' 
        })

        return { rows: 42, query_time: '100ms' }
      })

      // Simulate another operation
      await withSpan('cache-operation', async (cacheSpan) => {
        cacheSpan.setAttributes({ operation: 'get', key: 'test-key' })
        
        // Simulate cache hit
        await new Promise(resolve => setTimeout(resolve, 50))
        
        logger.info('Cache operation completed', { 
          operation: 'get',
          hit: true,
          duration: '50ms' 
        })
      })

      // Add custom metric
      platformMetrics.customOperations.add(1, {
        operation: 'test-observability',
        success: true,
      })

      const traces = [
        '✓ API request traced',
        '✓ Database query traced',
        '✓ Cache operation traced',
        '✓ HTTP metrics recorded',
        '✓ Custom metrics recorded',
        '✓ Structured logs generated',
      ]

      return NextResponse.json({
        success: true,
        message: 'Observability features tested successfully',
        traces,
        metrics: {
          http_requests: 1,
          db_queries: 1,
          cache_operations: 1,
          custom_operations: 1,
        },
        timestamp: new Date().toISOString(),
      })

    } catch (error) {
      // Capture error in Sentry
      captureException(error, {
        tags: { component: 'api-test-observability' },
        extra: { url: request.url, method: 'GET' }
      })

      // Log error
      logger.error('Observability test API failed', { 
        error: error.message,
        stack: error.stack 
      })

      // Increment error counter
      platformMetrics.httpRequestsTotal.add(1, {
        method: 'GET',
        route: '/api/test-observability',
        status: '500',
      })

      return NextResponse.json(
        { 
          success: false, 
          error: 'Internal server error',
          message: 'Error captured in observability system'
        },
        { status: 500 }
      )
    }
  })
}
