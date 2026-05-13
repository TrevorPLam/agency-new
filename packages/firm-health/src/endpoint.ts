import { HealthResponse, HealthCheck } from './types.js';
import { livenessProbe } from './probes/liveness.js';
import { readinessProbe } from './probes/readiness.js';
import { startupProbe } from './probes/startup.js';
import { runSyntheticChecks } from './probes/synthetic.js';

export interface HealthEndpointOptions {
  /**
   * Secret token required to access the health endpoint
   */
  secret: string;
  
  /**
   * Header name for the secret token (default: 'Authorization')
   */
  headerName?: string;
  
  /**
   * Custom health checks to include in readiness probe
   */
  customChecks?: HealthCheck[];
  
  /**
   * Application version
   */
  version?: string;
  
  /**
   * Include synthetic checks in the response
   */
  includeSynthetic?: boolean;
  
  /**
   * Timeout for readiness probe in milliseconds
   */
  readinessTimeoutMs?: number;
}

/**
 * Creates a health check handler that can be used with various web frameworks
 * 
 * @param options Configuration options for the health endpoint
 * @returns Request handler function
 */
export function createHealthHandler(options: HealthEndpointOptions) {
  const {
    secret,
    headerName = 'Authorization',
    customChecks = [],
    version = '1.0.0',
    includeSynthetic = false,
    readinessTimeoutMs = 5000
  } = options;

  return async (request: {
    headers: Record<string, string>;
    method?: string;
  }): Promise<{
    status: number;
    headers: Record<string, string>;
    body?: string;
  }> => {
    // Only allow GET requests
    if (request.method && request.method !== 'GET') {
      return {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    // Check authorization
    const authHeader = request.headers[headerName.toLowerCase()];
    if (!authHeader || authHeader !== `Bearer ${secret}`) {
      return {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    const startTime = Date.now();
    const timestamp = new Date();
    const uptime = typeof globalThis.process !== 'undefined' ? 
      globalThis.process.uptime() : 0;

    try {
      // Run all probes in parallel
      const [livenessResult, readinessResult, startupResult] = await Promise.allSettled([
        livenessProbe(),
        readinessProbe(customChecks, readinessTimeoutMs),
        startupProbe()
      ]);

      // Get synthetic checks if requested
      let syntheticResults: Record<string, any> = {};
      if (includeSynthetic) {
        try {
          syntheticResults = await runSyntheticChecks();
        } catch (error) {
          // Synthetic check failures shouldn't affect overall health
          syntheticResults = {
            error: error instanceof Error ? error.message : 'Synthetic checks failed'
          };
        }
      }

      // Extract results from Promise.allSettled
      const liveness = livenessResult.status === 'fulfilled' ? livenessResult.value : {
        status: 'unhealthy' as const,
        timestamp,
        duration: 0,
        message: livenessResult.reason instanceof Error ? livenessResult.reason.message : 'Liveness probe failed'
      };

      const readiness = readinessResult.status === 'fulfilled' ? readinessResult.value : {
        status: 'unhealthy' as const,
        timestamp,
        duration: 0,
        message: readinessResult.reason instanceof Error ? readinessResult.reason.message : 'Readiness probe failed'
      };

      const startup = startupResult.status === 'fulfilled' ? startupResult.value : {
        status: 'unhealthy' as const,
        timestamp,
        duration: 0,
        message: startupResult.reason instanceof Error ? startupResult.reason.message : 'Startup probe failed'
      };

      // Combine all checks
      const checks: Record<string, any> = {
        liveness,
        readiness,
        startup,
        ...(includeSynthetic && { synthetic: syntheticResults })
      };

      // Determine overall status
      const statuses = Object.values(checks).map((check: any) => check.status);
      const hasUnhealthy = statuses.includes('unhealthy');
      const hasDegraded = statuses.includes('degraded');

      let overallStatus: 'healthy' | 'unhealthy' | 'degraded';
      if (hasUnhealthy) {
        overallStatus = 'unhealthy';
      } else if (hasDegraded) {
        overallStatus = 'degraded';
      } else {
        overallStatus = 'healthy';
      }

      const response: HealthResponse = {
        status: overallStatus,
        timestamp,
        checks,
        uptime,
        version
      };

      const httpStatus = overallStatus === 'healthy' ? 200 : 503;

      return {
        status: httpStatus,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response)
      };

    } catch (error) {
      const errorResponse: HealthResponse = {
        status: 'unhealthy',
        timestamp,
        checks: {
          liveness: { status: 'unhealthy', timestamp, duration: 0, message: 'Health check failed' },
          readiness: { status: 'unhealthy', timestamp, duration: 0, message: 'Health check failed' },
          startup: { status: 'unhealthy', timestamp, duration: 0, message: 'Health check failed' }
        },
        uptime,
        version
      };

      return {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorResponse)
      };
    }
  };
}

/**
 * Express.js middleware for health endpoint
 */
export function expressHealthMiddleware(options: HealthEndpointOptions) {
  const handler = createHealthHandler(options);
  
  return async (req: any, res: any) => {
    const result = await handler({
      headers: req.headers,
      method: req.method
    });
    
    res.status(result.status);
    Object.entries(result.headers).forEach(([key, value]) => {
      res.set(key, value);
    });
    
    if (result.body) {
      res.send(result.body);
    } else {
      res.end();
    }
  };
}

/**
 * Next.js API route handler for health endpoint
 */
export function nextHealthHandler(options: HealthEndpointOptions) {
  const handler = createHealthHandler(options);
  
  return async (req: Request) => {
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    const result = await handler({
      headers,
      method: req.method
    });
    
    return new Response(result.body, {
      status: result.status,
      headers: result.headers
    });
  };
}
