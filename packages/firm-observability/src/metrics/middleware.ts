import { Request, Response, NextFunction } from 'express'
import { platformMetrics } from './platform-metrics'
import { getCurrentContext } from '../context'

export function MetricsMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now()

    // Override res.end to capture response metrics
    const originalEnd = res.end
    res.end = function(this: Response, ...args: any[]) {
      const duration = (Date.now() - startTime) / 1000 // Convert to seconds

      // Record HTTP request metrics
      platformMetrics.httpRequestsTotal.add(1, {
        method: req.method,
        route: req.route?.path || req.path,
        status_code: res.statusCode.toString(),
        tenant_id: getCurrentContext().tenantId || 'unknown'
      })

      platformMetrics.httpRequestDuration.record(duration, {
        method: req.method,
        route: req.route?.path || req.path,
        status_code: res.statusCode.toString()
      })

      // Record response size if available
      const contentLength = res.get('content-length')
      if (contentLength) {
        platformMetrics.httpResponseSize.record(parseInt(contentLength, 10), {
          method: req.method,
          route: req.route?.path || req.path
        })
      }

      // Record error metrics
      if (res.statusCode >= 400) {
        platformMetrics.errorsTotal.add(1, {
          error_type: res.statusCode >= 500 ? 'server_error' : 'client_error',
          status_code: res.statusCode.toString(),
          method: req.method,
          route: req.route?.path || req.path
        })
      }

      return originalEnd.apply(this, args)
    }

    next()
  }
}
