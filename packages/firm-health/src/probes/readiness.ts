import type { HealthCheck, HealthCheckResult } from '../types.js';
import { createRLSCheck } from './rls-check.js';

/**
 * Readiness probe checks if the application is ready to serve traffic.
 * This checks all dependencies like database, external services, etc.
 * 
 * @param checks Array of health checks to run in parallel
 * @param timeoutMs Maximum time to wait for all checks (default: 5000ms)
 * @returns Promise<HealthCheckResult> - Overall readiness status
 */
export async function readinessProbe(
  checks: HealthCheck[],
  timeoutMs: number = 5000
): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Run all checks in parallel with timeout
    const checkPromises = checks.map(async (check) => {
      const checkStartTime = Date.now();
      
      try {
        // Add individual timeout for each check
        const result = await Promise.race([
          check.check(),
          new Promise<HealthCheckResult>((_, reject) =>
            setTimeout(() => reject(new Error(`Check ${check.name} timed out`)), check.timeoutMs)
          )
        ]);
        
        return {
          name: check.name,
          result: {
            ...result,
            duration: Date.now() - checkStartTime
          }
        };
      } catch (error) {
        return {
          name: check.name,
          result: {
            status: 'unhealthy',
            timestamp: new Date(),
            duration: Date.now() - checkStartTime,
            message: error instanceof Error ? error.message : 'Unknown error',
            details: {
              error: error instanceof Error ? error.stack : String(error)
            }
          }
        };
      }
    });
    
    // Wait for all checks with overall timeout
    const results = await Promise.race([
      Promise.all(checkPromises),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Readiness probe timed out')), timeoutMs)
      )
    ]);
    
    const duration = Date.now() - startTime;
    
    // Determine overall status
    const unhealthyChecks = results.filter(r => r.result.status === 'unhealthy');
    const degradedChecks = results.filter(r => r.result.status === 'degraded');
    
    let status: 'healthy' | 'unhealthy' | 'degraded';
    let message: string;
    
    if (unhealthyChecks.length > 0) {
      status = 'unhealthy';
      message = `${unhealthyChecks.length} dependencies unhealthy`;
    } else if (degradedChecks.length > 0) {
      status = 'degraded';
      message = `${degradedChecks.length} dependencies degraded`;
    } else {
      status = 'healthy';
      message = 'All dependencies healthy';
    }
    
    return {
      status,
      timestamp: new Date(),
      duration,
      message,
      details: {
        totalChecks: results.length,
        healthy: results.filter(r => r.result.status === 'healthy').length,
        degraded: degradedChecks.length,
        unhealthy: unhealthyChecks.length,
        checks: results.reduce((acc, r) => {
          acc[r.name] = r.result;
          return acc;
        }, {} as Record<string, HealthCheckResult>)
      }
    };
    
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date(),
      duration: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'Readiness probe failed',
      details: {
        error: error instanceof Error ? error.stack : String(error)
      }
    };
  }
}

/**
 * Readiness probe with RLS check included by default
 * This ensures tenant isolation security is verified before serving traffic
 */
export async function readinessProbeWithRLS(
  additionalChecks: HealthCheck[] = [],
  timeoutMs: number = 5000
): Promise<HealthCheckResult> {
  // Include RLS check by default for tenant isolation security
  const rlsCheck = createRLSCheck()
  const allChecks = [rlsCheck, ...additionalChecks]
  
  return readinessProbe(allChecks, timeoutMs)
}
